import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  stepCountIs,
  streamText,
  UIMessage,
  NoSuchToolError,
} from "ai";
import {
  observe,
  updateActiveObservation,
  updateActiveTrace,
} from "@langfuse/tracing";
import { trace } from "@opentelemetry/api";
import { after } from "next/server";

import { langfuseSpanProcessor } from "@/instrumentation";

import { customModelProvider, isToolCallUnsupportedModel } from "lib/ai/models";

import { mcpClientsManager } from "lib/ai/mcp/mcp-manager";

import { agentRepository, chatRepository } from "lib/db/repository";
import globalLogger from "logger";
import {
  buildMcpServerCustomizationsSystemPrompt,
  buildUserSystemPrompt,
  buildToolCallUnsupportedModelSystemPrompt,
} from "lib/ai/prompts";
import { chatApiSchemaRequestBodySchema, ChatMetadata } from "app-types/chat";
import { AppDefaultToolkit } from "lib/ai/tools";

import { errorIf, safe } from "ts-safe";

import {
  excludeToolExecution,
  handleError,
  manualToolExecuteByLastMessage,
  mergeSystemPrompt,
  extractInProgressToolPart,
  filterMcpServerCustomizations,
  loadMcpTools,
  loadWorkFlowTools,
  loadAppDefaultTools,
  convertToSavePart,
  buildResponseMessageFromStreamResult,
} from "./shared.chat";
import {
  rememberAgentAction,
  rememberMcpServerCustomizationsAction,
} from "./actions";
import { getSession } from "auth/server";
import { colorize } from "consola/utils";
import { generateUUID } from "lib/utils";

const logger = globalLogger.withDefaults({
  message: colorize("blackBright", `Chat API: `),
});

// Following the exact pattern from docs/langfuse-vercel-ai-sdk.md
const handler = async (request: Request) => {
  const json = await request.json();

  const session = await getSession();

  // CRITICAL: Set trace metadata IMMEDIATELY to avoid ghost traces
  const environment =
    process.env.VERCEL_ENV || process.env.NODE_ENV || "development";

  updateActiveTrace({
    name: "samba-ai-chat",
    userId: session?.user.id || "anonymous",
    metadata: {
      environment,
      tags: ["chat", `environment:${environment}`],
    },
  });

  if (!session?.user.id) {
    updateActiveTrace({
      output: { error: "Unauthorized" },
      metadata: { errorType: "auth_error" },
    });
    return new Response("Unauthorized", { status: 401 });
  }

  const {
    id,
    message,
    chatModel,
    toolChoice,
    allowedAppDefaultToolkit,
    allowedMcpServers,
    mentions = [],
  } = chatApiSchemaRequestBodySchema.parse(json);

  const normalizedAllowedAppToolkit = allowedAppDefaultToolkit?.filter(
    (toolkit): toolkit is AppDefaultToolkit =>
      Object.values(AppDefaultToolkit).includes(toolkit as AppDefaultToolkit),
  );

  const model = customModelProvider.getModel(chatModel);

  let thread = await chatRepository.selectThreadDetails(id);

  if (!thread) {
    logger.info(`create chat thread: ${id}`);
    const newThread = await chatRepository.insertThread({
      id,
      title: "",
      userId: session.user.id,
    });
    thread = await chatRepository.selectThreadDetails(newThread.id);
  }

  if (thread!.userId !== session.user.id) {
    updateActiveTrace({
      output: { error: "Forbidden" },
      metadata: { errorType: "auth_error", threadId: id },
    });
    return new Response("Forbidden", { status: 403 });
  }

  const messages: UIMessage[] = (thread?.messages ?? []).map((m) => {
    return {
      id: m.id,
      role: m.role,
      parts: m.parts.filter((part: any) => {
        // CLEANUP: Filter out ALL tool parts with invalid input
        // These cause Anthropic API "tool_use.input: Field required" errors
        if (part.type?.startsWith("tool-")) {
          // Case 1: input is completely missing
          if (part.input === undefined || part.input === null) {
            logger.warn(
              "Filtering out tool part with missing input from database",
              {
                messageId: m.id,
                toolType: part.type,
                toolCallId: part.toolCallId,
                inputValue: part.input,
                reason: "Missing input causes Anthropic API validation errors",
              },
            );
            return false;
          }

          // Case 2: input is empty object {}
          if (
            typeof part.input === "object" &&
            !Array.isArray(part.input) &&
            Object.keys(part.input).length === 0
          ) {
            logger.warn(
              "Filtering out tool part with empty input from database",
              {
                messageId: m.id,
                toolType: part.type,
                toolCallId: part.toolCallId,
                reason: "Empty input {} causes Anthropic API validation errors",
              },
            );
            return false;
          }
        }
        return true; // Keep valid parts with non-empty input
      }),
      metadata: m.metadata,
    };
  });

  if (messages.at(-1)?.id == message.id) {
    messages.pop();
  }
  messages.push(message);

  const supportToolCall = !isToolCallUnsupportedModel(model);

  const agentId = mentions.find((m) => m.type === "agent")?.agentId;

  const agent = await rememberAgentAction(agentId, session.user.id);

  // Extract input text for observation
  const inputText =
    message.parts?.find((part) => "text" in part && part.type === "text")
      ?.text || "";

  updateActiveObservation({
    input: inputText,
  });

  // Get MCP server list for metadata
  const mcpClients = await mcpClientsManager.getClients();
  const mcpServerList = mcpClients.map(
    (client) => client.client.getInfo().name,
  );

  // Update trace with full context and USE LANGFUSE SESSION for grouping
  updateActiveTrace({
    name: agent?.name ? `agent-${agent.name}-chat` : "samba-ai-chat",
    sessionId: id, // This groups all messages in same conversation
    userId: session.user.id,
    input: inputText,
    metadata: {
      threadId: id, // Add threadId for explicit grouping
      messageId: message.id,
      agentId: agent?.id,
      agentName: agent?.name,
      provider: chatModel?.provider,
      model: chatModel?.model,
      toolChoice,
      environment,
      mcpServerCount: mcpClients.length,
      mcpServerList,
      tags: [
        "chat",
        `provider:${chatModel?.provider || "unknown"}`,
        `model:${chatModel?.model || "unknown"}`,
        ...(agent?.name ? [`agent:${agent.name}`] : []),
        `environment:${environment}`,
        `thread:${id}`, // Add thread tag for filtering
      ],
    },
  });

  if (agent?.instructions?.mentions) {
    mentions.push(...agent.instructions.mentions);
  }

  const isToolCallAllowed =
    supportToolCall && (toolChoice != "none" || mentions.length > 0);

  const metadata: ChatMetadata = {
    agentId: agent?.id,
    toolChoice: toolChoice,
    toolCount: 0,
    chatModel: chatModel,
  };

  const stream = createUIMessageStream({
    execute: async ({ writer: dataStream }) => {
      const mcpClients = await mcpClientsManager.getClients();
      const mcpTools = await mcpClientsManager.tools();
      logger.info(
        `mcp-server count: ${mcpClients.length}, mcp-tools count :${Object.keys(mcpTools).length}`,
      );
      const MCP_TOOLS = await safe()
        .map(errorIf(() => !isToolCallAllowed && "Not allowed"))
        .map(() =>
          loadMcpTools({
            mentions,
            allowedMcpServers,
          }),
        )
        .orElse({});

      const WORKFLOW_TOOLS = await safe()
        .map(errorIf(() => !isToolCallAllowed && "Not allowed"))
        .map(() =>
          loadWorkFlowTools({
            mentions,
            dataStream,
          }),
        )
        .orElse({});

      const APP_DEFAULT_TOOLS = await safe()
        .map(errorIf(() => !isToolCallAllowed && "Not allowed"))
        .map(() =>
          loadAppDefaultTools({
            mentions,
            allowedAppDefaultToolkit: normalizedAllowedAppToolkit,
          }),
        )
        .orElse({});
      const inProgressToolParts = extractInProgressToolPart(message);
      if (inProgressToolParts.length) {
        await Promise.all(
          inProgressToolParts.map(async (part) => {
            const output = await manualToolExecuteByLastMessage(
              part,
              { ...MCP_TOOLS, ...WORKFLOW_TOOLS, ...APP_DEFAULT_TOOLS },
              request.signal,
            );
            part.output = output;

            dataStream.write({
              type: "tool-output-available",
              toolCallId: part.toolCallId,
              output,
            });
          }),
        );
      }

      const userPreferences = thread?.userPreferences || undefined;

      const mcpServerCustomizations = await safe()
        .map(() => {
          if (Object.keys(MCP_TOOLS ?? {}).length === 0)
            throw new Error("No tools found");
          return rememberMcpServerCustomizationsAction(session.user.id);
        })
        .map((v) => filterMcpServerCustomizations(MCP_TOOLS!, v))
        .orElse({});

      const systemPrompt = mergeSystemPrompt(
        buildUserSystemPrompt(session.user, userPreferences, agent),
        buildMcpServerCustomizationsSystemPrompt(mcpServerCustomizations),
        !supportToolCall && buildToolCallUnsupportedModelSystemPrompt,
      );

      const vercelAITooles = safe({ ...MCP_TOOLS, ...WORKFLOW_TOOLS })
        .map((t) => {
          const bindingTools =
            toolChoice === "manual" ||
            (message.metadata as ChatMetadata)?.toolChoice === "manual"
              ? excludeToolExecution(t)
              : t;
          return {
            ...bindingTools,
            ...APP_DEFAULT_TOOLS, // APP_DEFAULT_TOOLS Not Supported Manual
          };
        })
        .unwrap();
      metadata.toolCount = Object.keys(vercelAITooles).length;

      const allowedMcpTools = Object.values(allowedMcpServers ?? {})
        .map((t) => t.tools)
        .flat();

      logger.info(
        `${agent ? `agent: ${agent.name}, ` : ""}tool mode: ${toolChoice}, mentions: ${mentions.length}`,
      );

      logger.info(
        `allowedMcpTools: ${allowedMcpTools.length ?? 0}, allowedAppDefaultToolkit: ${normalizedAllowedAppToolkit?.length ?? 0}`,
      );
      logger.info(
        `binding tool count APP_DEFAULT: ${Object.keys(APP_DEFAULT_TOOLS ?? {}).length}, MCP: ${Object.keys(MCP_TOOLS ?? {}).length}, Workflow: ${Object.keys(WORKFLOW_TOOLS ?? {}).length}`,
      );
      logger.info(`model: ${chatModel?.provider}/${chatModel?.model}`);

      const result = streamText({
        model,
        system: systemPrompt,
        messages: convertToModelMessages(messages),
        experimental_transform: smoothStream({ chunking: "word" }),
        // Following the exact pattern from docs/langfuse-vercel-ai-sdk.md
        experimental_telemetry: {
          isEnabled: true,
        },
        maxRetries: 2,
        tools: vercelAITooles,
        stopWhen: stepCountIs(10),
        toolChoice: "auto",
        abortSignal: request.signal,

        // NEW: Capture tool results as they complete (PRIMARY FIX for Canvas chart rendering)
        onStepFinish: async (payload) => {
          const { stepResult, finishReason } = payload as {
            stepResult?: {
              toolCalls?: Array<{
                toolName?: string;
                toolCallId?: string;
              }>;
              toolResults?: Array<{
                toolName?: string;
                toolCallId?: string;
                result?: unknown;
              }>;
            };
            finishReason?: unknown;
          };
          logger.info("🔧 Step finished:", {
            finishReason,
            toolCallCount: stepResult?.toolCalls?.length || 0,
            toolResultCount: stepResult?.toolResults?.length || 0,
          });

          // Process tool results
          if (stepResult?.toolResults && stepResult.toolResults.length > 0) {
            for (const toolResult of stepResult.toolResults) {
              logger.info("📊 Tool result captured:", {
                toolName: toolResult.toolName,
                toolCallId: toolResult.toolCallId,
                hasResult: !!toolResult.result,
              });

              // Write tool result to stream for client processing
              dataStream.write({
                type: "tool-result",
                toolCallId: toolResult.toolCallId,
                toolName: toolResult.toolName,
                result: toolResult.result,
                timestamp: new Date().toISOString(),
              } as any);
            }
          }
        },

        onFinish: async (result) => {
          logger.info(
            "🎯 onFinish START: Processing message persistence + observability",
            {
              threadId: thread!.id,
              messageId: message.id,
              timestamp: new Date().toISOString(),
            },
          );

          // ============================================
          // PHASE 1: MESSAGE PERSISTENCE (CRITICAL)
          // ============================================
          try {
            logger.info("💾 Building response message from stream result");

            // Build assistant response message from streaming result
            const responseMessage = buildResponseMessageFromStreamResult(
              result,
              message,
            );

            logger.info("💾 Persisting messages to database", {
              userMessageId: message.id,
              assistantMessageId: responseMessage.id,
              threadId: thread!.id,
              partCount: responseMessage.parts.length,
            });

            // Persist using existing logic from outer onFinish
            if (responseMessage.id == message.id) {
              // If the assistant response reused the user message ID, persist both messages separately
              logger.warn(
                "Assistant response reused user message ID. Generating new assistant ID to preserve history.",
                {
                  threadId: thread!.id,
                  messageId: message.id,
                },
              );

              await chatRepository.upsertMessage({
                threadId: thread!.id,
                role: message.role,
                parts: message.parts.map(convertToSavePart),
                id: message.id,
              });
              logger.info("✅ User message persisted", { id: message.id });

              const regeneratedAssistantId = generateUUID();

              await chatRepository.upsertMessage({
                threadId: thread!.id,
                role: responseMessage.role,
                id: regeneratedAssistantId,
                parts: responseMessage.parts.map(convertToSavePart),
                metadata,
              });
              logger.info(
                "✅ Assistant message persisted with regenerated ID",
                {
                  id: regeneratedAssistantId,
                },
              );
            } else {
              // Separate messages case (user + assistant)

              // Persist user message
              await chatRepository.upsertMessage({
                threadId: thread!.id,
                role: message.role,
                parts: message.parts.map(convertToSavePart),
                id: message.id,
              });
              logger.info("✅ User message persisted", { id: message.id });

              // Persist assistant message
              await chatRepository.upsertMessage({
                threadId: thread!.id,
                role: responseMessage.role,
                id: responseMessage.id,
                parts: responseMessage.parts.map(convertToSavePart),
                metadata,
              });
              logger.info("✅ Assistant message persisted", {
                id: responseMessage.id,
              });
            }

            // Update agent timestamp if applicable
            if (agent) {
              await agentRepository.updateAgent(agent.id, session.user.id, {
                updatedAt: new Date(),
              } as any);
              logger.info("✅ Agent timestamp updated", { agentId: agent.id });
            }

            logger.info("✅ MESSAGE PERSISTENCE COMPLETE");
          } catch (persistError) {
            // CRITICAL: Log but don't throw - allow observability to continue
            logger.error("🚨 CRITICAL: Message persistence failed", {
              error:
                persistError instanceof Error
                  ? persistError.message
                  : String(persistError),
              stack:
                persistError instanceof Error ? persistError.stack : undefined,
              messageId: message.id,
              threadId: thread!.id,
              userId: session.user.id,
            });

            // Future enhancement: Add retry logic or dead letter queue
            // For now, continue with observability updates
          }

          // ============================================
          // PHASE 2: LANGFUSE OBSERVABILITY
          // ============================================
          logger.info("📊 Updating Langfuse trace metadata");

          try {
            // Comprehensive tool execution summary
            // Safety check: result.steps might be undefined in error conditions
            const toolExecutions =
              result?.steps?.flatMap((s) => s?.toolCalls ?? []) ?? [];
            const toolResults =
              result?.steps?.flatMap((s) => s?.toolResults ?? []) ?? [];

            const executionSummary = {
              totalSteps: result?.steps?.length || 0,
              totalToolCalls: toolExecutions?.length || 0,
              totalToolResults: toolResults?.length || 0,
              toolNames:
                toolExecutions?.map((t) => t?.toolName).filter(Boolean) || [],
              completionRate: toolExecutions?.length
                ? (toolResults?.length || 0) / toolExecutions.length
                : 0,
            };

            const mcpToolCount = Object.keys(MCP_TOOLS ?? {}).length;
            const workflowToolCount = Object.keys(WORKFLOW_TOOLS ?? {}).length;
            const appToolCount = Object.keys(APP_DEFAULT_TOOLS ?? {}).length;

            // Update Langfuse trace with detailed tool metadata
            updateActiveObservation({
              output: result.content,
              metadata: {
                toolExecutionSummary: executionSummary,
              },
            });

            updateActiveTrace({
              output: result.content,
              metadata: {
                ...executionSummary,
                mcpToolCount,
                workflowToolCount,
                appToolCount,
                totalToolsAvailable:
                  mcpToolCount + workflowToolCount + appToolCount,
              },
            });

            logger.info("✅ Langfuse metadata updated successfully");
          } catch (observabilityError) {
            logger.error("⚠️ Langfuse metadata update failed (non-critical)", {
              error:
                observabilityError instanceof Error
                  ? observabilityError.message
                  : String(observabilityError),
            });
            // Continue - observability failure shouldn't block response
          }

          // ============================================
          // PHASE 3: CLEANUP
          // ============================================
          logger.info("🏁 Ending OpenTelemetry span");
          trace.getActiveSpan()?.end();

          logger.info(
            "✅ onFinish COMPLETE - All phases executed successfully",
          );
        },
        onError: async (error) => {
          // Enhanced error handling for Vercel AI SDK 5.0
          let errorMessage = "Unknown error occurred";
          let errorType = "general";
          let errorDetails: any = {};

          // Handle specific AI SDK 5.0 error types
          if (NoSuchToolError.isInstance(error)) {
            errorType = "no_such_tool";
            errorMessage = `Tool not found: ${error.toolName}`;
            errorDetails = {
              toolName: error.toolName,
              availableTools: Object.keys(vercelAITooles),
              suggestion:
                "Check if tool is properly registered in APP_DEFAULT_TOOL_KIT",
            };
            logger.error("🚨 NoSuchToolError:", {
              toolName: error.toolName,
              availableTools: Object.keys(vercelAITooles),
              message: error.message,
            });
          } else if (
            error instanceof Error &&
            error.message.includes("tool") &&
            error.message.includes("argument")
          ) {
            // Handle tool argument errors generically (AI SDK version compatibility)
            errorType = "invalid_tool_arguments";
            errorMessage = `Invalid tool arguments: ${error.message}`;
            errorDetails = {
              error: error.message,
              suggestion: "Check tool input schema and provided arguments",
            };
            logger.error("🚨 Tool Arguments Error:", {
              message: error.message,
              stack: error.stack,
            });
          } else if (error instanceof Error) {
            errorMessage = error.message;
            errorDetails = {
              name: error.name,
              stack: error.stack,
            };
            logger.error("🚨 General Error:", {
              name: error.name,
              message: error.message,
              stack: error.stack,
            });
          } else {
            logger.error("🚨 Unknown Error Type:", error);
          }

          updateActiveObservation({
            output: {
              error: errorMessage,
              errorType,
              errorDetails,
              timestamp: new Date().toISOString(),
            },
            level: "ERROR",
          });
          updateActiveTrace({
            output: {
              error: errorMessage,
              errorType,
              errorDetails,
            },
          });

          // End span manually after stream has finished
          trace.getActiveSpan()?.end();
        },
      });
      result.consumeStream();
      dataStream.merge(
        result.toUIMessageStream({
          messageMetadata: ({ part }) => {
            if (part.type == "finish") {
              metadata.usage = part.totalUsage;
              return metadata;
            }
          },
        }),
      );
    },

    generateId: generateUUID,
    // onFinish removed - now handled in streamText.onFinish above
    onError: handleError,
    originalMessages: messages,
  });

  // CRITICAL: Force flush in serverless environments to prevent trace loss
  after(async () => {
    await langfuseSpanProcessor.forceFlush();
  });

  return createUIMessageStreamResponse({
    stream,
  });
};

// Export the wrapped handler following docs pattern
export const POST = observe(handler, {
  name: "chat-api-handler",
  endOnExit: false, // end observation _after_ stream has finished
});

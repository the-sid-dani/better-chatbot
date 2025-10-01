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

  if (!session?.user.id) {
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
    return new Response("Forbidden", { status: 403 });
  }

  const messages: UIMessage[] = (thread?.messages ?? []).map((m) => {
    return {
      id: m.id,
      role: m.role,
      parts: m.parts,
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

  // Set session id and user id on active trace (following docs pattern)
  const inputText =
    message.parts?.find((part) => "text" in part && part.type === "text")
      ?.text || "";

  updateActiveObservation({
    input: inputText,
  });

  const environment =
    process.env.VERCEL_ENV || process.env.NODE_ENV || "development";

  // Get MCP server list for metadata
  const mcpClients = await mcpClientsManager.getClients();
  const mcpServerList = mcpClients.map((client) => client.serverName);

  updateActiveTrace({
    name: agent?.name ? `agent-${agent.name}-chat` : "samba-orion-chat",
    sessionId: id,
    userId: session.user.id,
    input: inputText,
    metadata: {
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
            allowedAppDefaultToolkit,
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
        `allowedMcpTools: ${allowedMcpTools.length ?? 0}, allowedAppDefaultToolkit: ${allowedAppDefaultToolkit?.length ?? 0}`,
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
        onFinish: async (result) => {
          // Count tool executions from result
          const toolExecutionCount =
            result.steps?.reduce((count, step) => {
              return (
                count +
                (step.toolCalls?.length || 0) +
                (step.toolResults?.length || 0)
              );
            }, 0) || 0;

          const mcpToolCount = Object.keys(MCP_TOOLS ?? {}).length;
          const workflowToolCount = Object.keys(WORKFLOW_TOOLS ?? {}).length;
          const appToolCount = Object.keys(APP_DEFAULT_TOOLS ?? {}).length;

          updateActiveObservation({
            output: result.content,
          });
          updateActiveTrace({
            output: result.content,
            metadata: {
              toolExecutionCount,
              mcpToolCount,
              workflowToolCount,
              appToolCount,
              totalToolsAvailable:
                mcpToolCount + workflowToolCount + appToolCount,
            },
          });

          // End span manually after stream has finished
          trace.getActiveSpan()?.end();
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
    onFinish: async ({ responseMessage }) => {
      if (responseMessage.id == message.id) {
        await chatRepository.upsertMessage({
          threadId: thread!.id,
          ...responseMessage,
          parts: responseMessage.parts.map(convertToSavePart),
          metadata,
        });
      } else {
        await chatRepository.upsertMessage({
          threadId: thread!.id,
          role: message.role,
          parts: message.parts.map(convertToSavePart),
          id: message.id,
        });
        await chatRepository.upsertMessage({
          threadId: thread!.id,
          role: responseMessage.role,
          id: responseMessage.id,
          parts: responseMessage.parts.map(convertToSavePart),
          metadata,
        });
      }

      if (agent) {
        agentRepository.updateAgent(agent.id, session.user.id, {
          updatedAt: new Date(),
        } as any);
      }
    },
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

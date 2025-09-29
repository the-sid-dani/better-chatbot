"use client";

import { useChat } from "@ai-sdk/react";
import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import PromptInput from "./prompt-input";
import clsx from "clsx";
import { appStore } from "@/app/store";
import { cn, createDebounce, generateUUID, truncateString } from "lib/utils";
import { ErrorMessage, PreviewMessage } from "./message";
import { ChatGreeting } from "./chat-greeting";

import { useShallow } from "zustand/shallow";
import {
  DefaultChatTransport,
  isToolUIPart,
  lastAssistantMessageIsCompleteWithToolCalls,
  UIMessage,
  getToolName,
} from "ai";

import { safe } from "ts-safe";
import { mutate } from "swr";
import { ChatApiSchemaRequestBody, ChatModel } from "app-types/chat";
import { useToRef } from "@/hooks/use-latest";
import { isShortcutEvent, Shortcuts } from "lib/keyboard-shortcuts";
import { Button } from "ui/button";
import { deleteThreadAction } from "@/app/api/chat/actions";
import { useRouter } from "next/navigation";
import { ArrowDown, Loader } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "ui/dialog";
import { useTranslations } from "next-intl";
import { Think } from "ui/think";
import { useGenerateThreadTitle } from "@/hooks/queries/use-generate-thread-title";
import dynamic from "next/dynamic";
import { useMounted } from "@/hooks/use-mounted";
import { getStorageManager } from "lib/browser-stroage";
import { AnimatePresence, motion } from "framer-motion";
import { CanvasPanel, useCanvas } from "./canvas-panel";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "ui/resizable";
// getToolName already imported above, isToolUIPart already imported above

type Props = {
  threadId: string;
  initialMessages: Array<UIMessage>;
  selectedChatModel?: string;
};

// Props interface for ChatContent component
interface ChatContentProps {
  emptyMessage: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  handleScroll: () => void;
  messages: UIMessage[];
  threadId: string;
  status: any;
  addToolResult: (result: any) => Promise<void>;
  isLoading: boolean;
  isPendingToolCall: boolean;
  setMessages: React.Dispatch<React.SetStateAction<UIMessage[]>>;
  sendMessage: any;
  space: any;
  error: Error | undefined;
  isAtBottom: boolean;
  scrollToBottom: () => void;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  stop: () => void;
  isFirstTime: boolean;
  handleFocus: () => void;
  isDeleteThreadPopupOpen: boolean;
  setIsDeleteThreadPopupOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

// Props interface for ScrollToBottomButton component
interface ScrollToBottomButtonProps {
  show: boolean;
  onClick: () => void;
  className?: string;
}

// Memoized ScrollToBottomButton component - moved outside to prevent recreation
const ScrollToBottomButton = memo(function ScrollToBottomButton({
  show,
  onClick,
  className,
}: ScrollToBottomButtonProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className={className}
        >
          <Button
            onClick={onClick}
            className="shadow-lg backdrop-blur-sm border transition-colors"
            size="icon"
            variant="ghost"
          >
            <ArrowDown />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// Memoized ChatContent component - moved outside to prevent recreation
const ChatContent = memo(function ChatContent({
  emptyMessage,
  containerRef,
  handleScroll,
  messages,
  threadId,
  status,
  addToolResult,
  isLoading,
  isPendingToolCall,
  setMessages,
  sendMessage,
  space,
  error,
  isAtBottom,
  scrollToBottom,
  input,
  setInput,
  stop,
  isFirstTime,
  handleFocus,
  isDeleteThreadPopupOpen,
  setIsDeleteThreadPopupOpen,
}: ChatContentProps) {
  return (
    <div
      className={cn(
        emptyMessage && "justify-center pb-24",
        "flex flex-col min-w-0 relative h-full z-40",
      )}
    >
      {emptyMessage ? (
        <ChatGreeting />
      ) : (
        <>
          <div
            className={"flex flex-col gap-2 overflow-y-auto py-6 z-10"}
            ref={containerRef}
            onScroll={handleScroll}
          >
            {messages.map((message, index) => {
              const isLastMessage = messages.length - 1 === index;
              return (
                <PreviewMessage
                  threadId={threadId}
                  messageIndex={index}
                  prevMessage={messages[index - 1]}
                  key={message.id}
                  message={message}
                  status={status}
                  addToolResult={addToolResult}
                  isLoading={isLoading || isPendingToolCall}
                  isLastMessage={isLastMessage}
                  setMessages={setMessages}
                  sendMessage={sendMessage}
                  className={
                    isLastMessage &&
                    message.role != "user" &&
                    !space &&
                    message.parts.length > 1
                      ? "min-h-[calc(55dvh-40px)]"
                      : ""
                  }
                />
              );
            })}
            {space && (
              <>
                <div className="w-full mx-auto max-w-3xl px-6 relative">
                  <div className={space == "space" ? "opacity-0" : ""}>
                    <Think />
                  </div>
                </div>
                <div className="min-h-[calc(55dvh-56px)]" />
              </>
            )}

            {error && <ErrorMessage error={error} />}
            <div className="min-w-0 min-h-52" />
          </div>
        </>
      )}

      <div
        className={clsx(messages.length && "absolute bottom-14", "w-full z-10")}
      >
        <div className="max-w-3xl mx-auto relative flex justify-center items-center -top-2">
          <ScrollToBottomButton
            show={!isAtBottom && messages.length > 0}
            onClick={scrollToBottom}
          />
        </div>

        <PromptInput
          input={input}
          threadId={threadId}
          sendMessage={sendMessage}
          setInput={setInput}
          isLoading={isLoading || isPendingToolCall}
          onStop={stop}
          onFocus={isFirstTime ? undefined : handleFocus}
        />
      </div>
      <DeleteThreadPopup
        threadId={threadId}
        onClose={() => setIsDeleteThreadPopupOpen(false)}
        open={isDeleteThreadPopupOpen}
      />
    </div>
  );
});

const LightRays = dynamic(() => import("ui/light-rays"), {
  ssr: false,
});

const Particles = dynamic(() => import("ui/particles"), {
  ssr: false,
});

const debounce = createDebounce();

const firstTimeStorage = getStorageManager("IS_FIRST");
const isFirstTime = Boolean(firstTimeStorage.get() ?? true);
firstTimeStorage.set(false);

export default function ChatBot({ threadId, initialMessages }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Canvas state management
  const {
    isVisible: isCanvasVisible,
    artifacts: canvasArtifacts,
    activeArtifactId,
    canvasName,
    userManuallyClosed,
    addArtifact: addCanvasArtifact,
    updateArtifact: updateCanvasArtifact,
    closeCanvas,
    showCanvas,
    setActiveArtifactId,
  } = useCanvas();

  // Cleanup processed tools when thread changes to prevent memory leaks
  const processedToolsRef = useRef(new Set<string>());

  // Monitor for excessive re-renders
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  useEffect(() => {
    console.log(
      "🧼 ChatBot Debug: Thread changed - clearing processed tools cache",
    );
    processedToolsRef.current.clear();
  }, [threadId]);

  // Debug canvas state changes with enhanced logging
  useEffect(() => {
    console.log("🔍 ChatBot Canvas Debug: Canvas state changed", {
      isVisible: isCanvasVisible,
      artifactCount: canvasArtifacts.length,
      userManuallyClosed,
      activeArtifactId,
      canvasName,
      timestamp: new Date().toISOString(),
    });
  }, [
    isCanvasVisible,
    canvasArtifacts.length,
    userManuallyClosed,
    activeArtifactId,
    canvasName,
  ]);

  // MOVED AFTER useChat hook to fix initialization error

  const [
    appStoreMutate,
    model,
    toolChoice,
    allowedAppDefaultToolkit,
    allowedMcpServers,
    threadList,
    threadMentions,
    pendingThreadMention,
  ] = appStore(
    useShallow((state) => [
      state.mutate,
      state.chatModel,
      state.toolChoice,
      state.allowedAppDefaultToolkit,
      state.allowedMcpServers,
      state.threadList,
      state.threadMentions,
      state.pendingThreadMention,
    ]),
  );

  const generateTitle = useGenerateThreadTitle({
    threadId,
  });

  const [showParticles, setShowParticles] = useState(isFirstTime);

  const onFinish = useCallback(() => {
    const messages = latestRef.current.messages;
    const prevThread = latestRef.current.threadList.find(
      (v) => v.id === threadId,
    );
    const isNewThread =
      !prevThread?.title &&
      messages.filter((v) => v.role === "user" || v.role === "assistant")
        .length < 3;
    if (isNewThread) {
      const part = messages
        .slice(0, 2)
        .flatMap((m) =>
          m.parts
            .filter((v) => v.type === "text")
            .map((p) => `${m.role}: ${truncateString(p.text, 500)}`),
        );
      if (part.length > 0) {
        generateTitle(part.join("\n\n"));
      }
    } else if (latestRef.current.threadList[0]?.id !== threadId) {
      mutate("/api/thread");
    }
  }, []);

  const [input, setInput] = useState("");

  const {
    messages,
    status,
    setMessages,
    addToolResult: _addToolResult,
    error,
    sendMessage,
    stop,
  } = useChat({
    id: threadId,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    transport: new DefaultChatTransport({
      prepareSendMessagesRequest: ({ messages, body, id }) => {
        if (window.location.pathname !== `/chat/${threadId}`) {
          console.log("replace-state");
          window.history.replaceState({}, "", `/chat/${threadId}`);
        }
        const lastMessage = messages.at(-1)!;

        const requestBody: ChatApiSchemaRequestBody = {
          ...body,
          id,
          chatModel:
            (body as { model: ChatModel })?.model ?? latestRef.current.model,
          toolChoice: latestRef.current.toolChoice,
          allowedAppDefaultToolkit: latestRef.current.allowedAppDefaultToolkit,
          allowedMcpServers: latestRef.current.allowedMcpServers,
          mentions: latestRef.current.mentions,
          message: lastMessage,
        };
        return { body: requestBody };
      },
    }),
    messages: initialMessages,
    generateId: generateUUID,
    experimental_throttle: 100,
    onFinish,
    // Clean implementation without complex onData handling
    onData: (data: any) => {
      // Simple logging for debugging
      if (data?.type) {
        console.log("AI SDK onData:", data.type);
      }
    },
  });
  const [isDeleteThreadPopupOpen, setIsDeleteThreadPopupOpen] = useState(false);

  const addToolResult = useCallback(
    async (result: Parameters<typeof _addToolResult>[0]) => {
      await _addToolResult(result);
      // sendMessage();
    },
    [_addToolResult],
  );

  const mounted = useMounted();

  const latestRef = useToRef({
    toolChoice,
    model,
    allowedAppDefaultToolkit,
    allowedMcpServers,
    messages,
    threadList,
    threadId,
    mentions: threadMentions[threadId],
  });

  const isLoading = useMemo(
    () => status === "streaming" || status === "submitted",
    [status],
  );

  const emptyMessage = useMemo(
    () => messages.length === 0 && !error,
    [messages.length, error],
  );

  const isInitialThreadEntry = useMemo(
    () =>
      initialMessages.length > 0 &&
      initialMessages.at(-1)?.id === messages.at(-1)?.id,
    [messages],
  );

  const isPendingToolCall = useMemo(() => {
    if (status != "ready") return false;
    const lastMessage = messages.at(-1);
    if (lastMessage?.role != "assistant") return false;
    const lastPart = lastMessage.parts.at(-1);
    if (!lastPart) return false;
    if (!isToolUIPart(lastPart)) return false;
    if (lastPart.state.startsWith("output")) return false;
    return true;
  }, [status, messages]);

  const space = useMemo(() => {
    if (!isLoading || error) return false;
    const lastMessage = messages.at(-1);
    if (lastMessage?.role == "user") return "think";
    const lastPart = lastMessage?.parts.at(-1);
    if (!lastPart) return "think";
    const secondPart = lastMessage?.parts[1];
    if (secondPart?.type == "text" && secondPart.text.length == 0)
      return "think";
    if (lastPart?.type == "step-start") {
      return lastMessage?.parts.length == 1 ? "think" : "space";
    }
    return false;
  }, [isLoading, messages.at(-1)]);

  const particle = useMemo(() => {
    return (
      <AnimatePresence>
        {showParticles && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 5 }}
          >
            <div className="absolute top-0 left-0 w-full h-full z-10">
              <LightRays />
            </div>
            <div className="absolute top-0 left-0 w-full h-full z-10">
              <Particles particleCount={400} particleBaseSize={10} />
            </div>

            <div className="absolute top-0 left-0 w-full h-full z-10">
              <div className="w-full h-full bg-gradient-to-t from-background to-50% to-transparent z-20" />
            </div>
            <div className="absolute top-0 left-0 w-full h-full z-10">
              <div className="w-full h-full bg-gradient-to-l from-background to-20% to-transparent z-20" />
            </div>
            <div className="absolute top-0 left-0 w-full h-full z-10">
              <div className="w-full h-full bg-gradient-to-r from-background to-20% to-transparent z-20" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }, [showParticles]);

  const handleFocus = useCallback(() => {
    setShowParticles(false);
    debounce(() => setShowParticles(true), 60000);
  }, []);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isScrollAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    setIsAtBottom(isScrollAtBottom);
    handleFocus();
  }, [handleFocus]);

  const scrollToBottom = useCallback(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    appStoreMutate({ currentThreadId: threadId });
    return () => {
      appStoreMutate({ currentThreadId: null });
    };
  }, [threadId]);

  useEffect(() => {
    if (pendingThreadMention && threadId) {
      appStoreMutate((prev) => ({
        threadMentions: {
          ...prev.threadMentions,
          [threadId]: [pendingThreadMention],
        },
        pendingThreadMention: undefined,
      }));
    }
  }, [pendingThreadMention, threadId, appStoreMutate]);

  useEffect(() => {
    if (isInitialThreadEntry)
      containerRef.current?.scrollTo({
        top: containerRef.current?.scrollHeight,
        behavior: "instant",
      });
  }, [isInitialThreadEntry]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const messages = latestRef.current.messages;
      if (messages.length === 0) return;
      const isLastMessageCopy = isShortcutEvent(e, Shortcuts.lastMessageCopy);
      const isDeleteThread = isShortcutEvent(e, Shortcuts.deleteThread);
      if (!isDeleteThread && !isLastMessageCopy) return;
      e.preventDefault();
      e.stopPropagation();
      if (isLastMessageCopy) {
        const lastMessage = messages.at(-1);
        const lastMessageText = lastMessage!.parts
          .filter((part) => part.type == "text")
          ?.at(-1)?.text;
        if (!lastMessageText) return;
        navigator.clipboard.writeText(lastMessageText);
        toast.success("Last message copied to clipboard");
      }
      if (isDeleteThread) {
        setIsDeleteThreadPopupOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // HARDENED PRODUCTION FIX: Tool-based Canvas processing with race condition protection
  const processingDebounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear any existing debounce
    if (processingDebounceRef.current) {
      clearTimeout(processingDebounceRef.current);
    }

    // Debounce tool processing to prevent rapid-fire updates
    processingDebounceRef.current = setTimeout(() => {
      try {
        const lastMessage = messages[messages.length - 1];

        if (!lastMessage || lastMessage.role !== "assistant") {
          return;
        }

        console.log("🔧 ChatBot Tool Debug: Processing message", {
          messageId: lastMessage.id,
          partCount: lastMessage.parts.length,
          timestamp: new Date().toISOString(),
        });

        // Look for all chart tools in any state (including new artifact tools)
        const chartToolNames = [
          "create_chart",
          "create_area_chart",
          "create_scatter_chart",
          "create_radar_chart",
          "create_funnel_chart",
          "create_treemap_chart",
          "create_sankey_chart",
          "create_radial_bar_chart",
          "create_composed_chart",
          "create_geographic_chart",
          "create_gauge_chart",
          "create_calendar_heatmap",
          // Basic artifact tools (from artifacts/index.ts)
          "create_bar_chart",
          "create_line_chart",
          "create_pie_chart",
          // Table artifact tool
          "create_table",
        ];

        const chartTools = lastMessage.parts.filter(
          (part) =>
            isToolUIPart(part) && chartToolNames.includes(getToolName(part)),
        );

        console.log("📊 ChatBot Tool Debug: Found chart/table tools", {
          toolCount: chartTools.length,
          tools: chartTools.map((t) => ({
            name: getToolName(t),
            hasOutput: isToolUIPart(t),
          })),
        });

        // Open Canvas immediately when chart/table tools are detected (unless user closed it)
        if (chartTools.length > 0 && !isCanvasVisible && !userManuallyClosed) {
          console.log(
            "🎭 ChatBot Canvas Debug: Auto-opening Canvas for chart/table tools",
          );
          showCanvas();
        } else if (chartTools.length > 0 && userManuallyClosed) {
          console.log(
            "🚪 ChatBot Canvas Debug: Chart/table tools detected but user closed Canvas - respecting user choice",
          );
        }

        // Note: Removed loading chart detection and creation logic - no longer needed

        // Note: Removed loading artifact creation logic to eliminate stuck loading states
        // Charts will appear directly in Canvas when tools complete successfully

        // Process completed charts/tables with duplicate prevention
        const completedCharts = chartTools.filter((part) => {
          if (!isToolUIPart(part) || !part.state.startsWith("output")) {
            return false;
          }

          const result = part.output as any;

          // Support multiple result formats:
          // 1. Original format: shouldCreateArtifact && status === 'success'
          // 2. New format: success === true
          // 3. New structured format: structuredContent.result[0].success === true && isError === false
          const isCompleted =
            (result?.shouldCreateArtifact && result?.status === "success") ||
            result?.success === true ||
            (result?.structuredContent?.result?.[0]?.success === true &&
              result?.isError === false);

          if (isCompleted) {
            // Use different ID fields depending on format
            const artifactId =
              result.chartId ||
              result.artifactId ||
              result.structuredContent?.result?.[0]?.artifactId ||
              generateUUID();
            const toolKey = `${lastMessage.id}-${artifactId}`;

            // Check if we've already processed this tool
            if (processedToolsRef.current.has(toolKey)) {
              console.log(
                "⚠️ ChatBot Tool Debug: Skipping already processed chart",
                {
                  chartId: artifactId,
                  toolName: getToolName(part),
                },
              );
              return false;
            }

            // Mark as processed
            processedToolsRef.current.add(toolKey);
            return true;
          }

          return false;
        });

        console.log(
          "✅ ChatBot Tool Debug: Processing completed charts/tables",
          {
            completedCount: completedCharts.length,
            existingArtifacts: canvasArtifacts.length,
          },
        );

        completedCharts.forEach((part) => {
          if (!isToolUIPart(part)) return;
          const result = part.output as any;
          const toolName = getToolName(part);

          // Handle different result formats
          const artifactId =
            result.chartId ||
            result.artifactId ||
            result.structuredContent?.result?.[0]?.artifactId ||
            generateUUID();

          // Find existing artifact - check both direct ID match and loading artifacts for this tool call
          const existingArtifact = canvasArtifacts.find(
            (a) => a.id === artifactId || a.id === part.toolCallId,
          );

          // Determine if this is a table tool
          const isTableTool = toolName === "create_table";

          if (!existingArtifact) {
            console.log(
              `✨ ChatBot Tool Debug: Creating new ${isTableTool ? "table" : "chart"} artifact`,
              {
                chartId: artifactId,
                title:
                  result.title ||
                  result.artifact?.title ||
                  result.structuredContent?.result?.[0]?.artifact?.title,
                toolName,
              },
            );

            let chartData;
            let chartType;
            let title;
            let artifactType: "chart" | "table" = "chart"; // Default to chart

            // Handle new artifact format - check both old and new structured format
            const artifactData =
              result.artifact ||
              result.structuredContent?.result?.[0]?.artifact;
            if (artifactData) {
              const artifactContent = JSON.parse(artifactData.content);

              if (isTableTool) {
                // Handle table artifacts
                artifactType = "table";
                chartType = "table";
                title = artifactData.title;
                chartData = {
                  title: artifactContent.title,
                  description: artifactContent.description,
                  columns: artifactContent.columns,
                  data: artifactContent.data,
                };
              } else {
                // Handle chart artifacts
                // Extract the correct chart type
                chartType =
                  artifactContent.metadata?.chartType ||
                  artifactContent.type.replace("-chart", "");
                title = artifactData.title;

                // Create chartData in the format expected by ChartRenderer
                chartData = {
                  chartType: chartType,
                  title: artifactContent.title,
                  data: artifactContent.data || [],
                  description: artifactContent.description,
                  yAxisLabel: artifactContent.yAxisLabel,
                  xAxisLabel: artifactContent.xAxisLabel,
                  // Add additional properties for special chart types
                  areaType: artifactContent.areaType,
                  showBubbles: artifactContent.showBubbles,
                  geoType: artifactContent.geoType,
                  colorScale: artifactContent.colorScale,
                  value: artifactContent.value,
                  minValue: artifactContent.minValue,
                  maxValue: artifactContent.maxValue,
                  gaugeType: artifactContent.gaugeType,
                  unit: artifactContent.unit,
                  thresholds: artifactContent.thresholds,
                  nodes: artifactContent.nodes,
                  links: artifactContent.links,
                  innerRadius: artifactContent.innerRadius,
                  outerRadius: artifactContent.outerRadius,
                  startDate: artifactContent.startDate,
                  endDate: artifactContent.endDate,
                };
              }
            }
            // Handle original format - also check structured content for legacy support
            else {
              const structuredResult = result.structuredContent?.result?.[0];
              chartData = result.chartData || structuredResult?.chartData;
              chartType = result.chartType || structuredResult?.chartType;
              title =
                result.title ||
                structuredResult?.title ||
                structuredResult?.message;
            }

            const artifact = {
              id: artifactId,
              type: artifactType,
              title:
                title ||
                (isTableTool ? `Table: ${chartType}` : `${chartType} Chart`),
              canvasName:
                result.canvasName ||
                (isTableTool ? "Data Table" : "Data Visualization"),
              data: chartData,
              status: "completed" as const,
              metadata: {
                chartType: chartType || "bar",
                dataPoints: result.dataPoints || chartData?.data?.length || 0,
                toolName,
                lastUpdated: new Date().toISOString(),
              },
            };

            addCanvasArtifact(artifact);
          } else {
            // Update existing loading artifact with completed data
            console.log(
              "🔄 ChatBot Tool Debug: Updating existing loading artifact",
              {
                existingId: existingArtifact.id,
                newId: artifactId,
                toolName,
                status: existingArtifact.status,
              },
            );

            // Extract chart data for updating (same logic as creation)
            let chartData;
            let chartType;
            let title;
            let _artifactType: "chart" | "table" = "chart";

            const artifactData =
              result.artifact ||
              result.structuredContent?.result?.[0]?.artifact;
            if (artifactData) {
              const artifactContent = JSON.parse(artifactData.content);

              if (isTableTool) {
                _artifactType = "table";
                chartType = "table";
                title = artifactData.title;
                chartData = {
                  title: artifactContent.title,
                  description: artifactContent.description,
                  columns: artifactContent.columns,
                  data: artifactContent.data,
                };
              } else {
                chartType =
                  artifactContent.metadata?.chartType ||
                  artifactContent.type.replace("-chart", "");
                title = artifactData.title;

                chartData = {
                  chartType: chartType,
                  title: artifactContent.title,
                  data: artifactContent.data || [],
                  description: artifactContent.description,
                  yAxisLabel: artifactContent.yAxisLabel,
                  xAxisLabel: artifactContent.xAxisLabel,
                  areaType: artifactContent.areaType,
                  showBubbles: artifactContent.showBubbles,
                  geoType: artifactContent.geoType,
                  colorScale: artifactContent.colorScale,
                  value: artifactContent.value,
                  minValue: artifactContent.minValue,
                  maxValue: artifactContent.maxValue,
                  gaugeType: artifactContent.gaugeType,
                  unit: artifactContent.unit,
                  thresholds: artifactContent.thresholds,
                  nodes: artifactContent.nodes,
                  links: artifactContent.links,
                  innerRadius: artifactContent.innerRadius,
                  outerRadius: artifactContent.outerRadius,
                  startDate: artifactContent.startDate,
                  endDate: artifactContent.endDate,
                };
              }
            } else {
              const structuredResult = result.structuredContent?.result?.[0];
              chartData = result.chartData || structuredResult?.chartData;
              chartType = result.chartType || structuredResult?.chartType;
              title =
                result.title ||
                structuredResult?.title ||
                structuredResult?.message;
            }

            // Update the loading artifact with completed data
            updateCanvasArtifact(existingArtifact.id, {
              data: chartData,
              status: "completed",
              title: title || existingArtifact.title,
              canvasName: result.canvasName || existingArtifact.canvasName,
              metadata: {
                ...existingArtifact.metadata,
                chartType:
                  chartType || existingArtifact.metadata?.chartType || "bar",
                dataPoints: result.dataPoints || chartData?.data?.length || 0,
                toolName,
                lastUpdated: new Date().toISOString(),
              },
            });
          }
        });
      } catch (error) {
        console.error(
          "🚨 ChatBot Tool Debug: Error processing chart/table tools:",
          error,
        );
      }
    }, 150); // 150ms debounce to prevent rapid processing

    // Cleanup function
    return () => {
      if (processingDebounceRef.current) {
        clearTimeout(processingDebounceRef.current);
      }
    };
  }, [
    messages,
    isCanvasVisible,
    userManuallyClosed,
    showCanvas,
    addCanvasArtifact,
    updateCanvasArtifact,
    canvasArtifacts,
  ]);

  useEffect(() => {
    if (mounted) {
      handleFocus();
    }
  }, [input, mounted, handleFocus]);

  // Comprehensive cleanup on unmount
  useEffect(() => {
    return () => {
      console.log(
        "🧼 ChatBot Debug: Component unmounting - performing cleanup",
      );

      // Clear any pending timeouts
      if (processingDebounceRef.current) {
        clearTimeout(processingDebounceRef.current);
      }

      // Clear processed tools cache
      processedToolsRef.current.clear();

      console.log("✅ ChatBot Debug: Cleanup completed");
    };
  }, []);

  // Error boundary for the entire chat interface
  const [chatError, setChatError] = useState<Error | null>(null);

  useEffect(() => {
    const handleUnhandledError = (event: ErrorEvent) => {
      console.error("🚨 ChatBot Debug: Unhandled error in chat:", event.error);
      setChatError(event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error(
        "🚨 ChatBot Debug: Unhandled promise rejection in chat:",
        event.reason,
      );
      setChatError(new Error(`Promise rejection: ${event.reason}`));
    };

    window.addEventListener("error", handleUnhandledError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleUnhandledError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  // If there's a critical error, show error state
  if (chatError) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-destructive">
            <h3 className="font-semibold text-lg">Chat Error</h3>
            <p className="text-sm text-muted-foreground mt-2">
              The chat interface encountered an error. Please try refreshing the
              page.
            </p>
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              Error: {chatError.message}
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => setChatError(null)}
              variant="outline"
              size="sm"
            >
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()} size="sm">
              Reload Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (renderCountRef.current > 100) {
    console.warn("⚠️ ChatBot Debug: Excessive re-renders detected", {
      renderCount: renderCountRef.current,
      threadId,
      messageCount: messages.length,
      canvasVisible: isCanvasVisible,
    });
  }

  // Debug: Track layout decisions for Canvas behavior with enhanced context
  console.log("🎬 ChatBot Layout Debug:", {
    layout: isCanvasVisible ? "SPLIT VIEW" : "CHAT ONLY",
    artifactCount: canvasArtifacts.length,
    userManuallyClosed,
    activeArtifactId,
    canvasName,
    renderCount: renderCountRef.current,
    messagesLength: messages.length,
    isLoading,
    timestamp: new Date().toISOString(),
  });

  return (
    <>
      {particle}
      {/* Resizable integrated layout with proper keys for React reconciliation */}
      {isCanvasVisible ? (
        <ResizablePanelGroup
          key="canvas-layout"
          direction="horizontal"
          className="h-full"
        >
          {/* Chat Panel */}
          <ResizablePanel defaultSize={50} minSize={35} maxSize={75}>
            <ChatContent
              emptyMessage={emptyMessage}
              containerRef={containerRef}
              handleScroll={handleScroll}
              messages={messages}
              threadId={threadId}
              status={status}
              addToolResult={addToolResult}
              isLoading={isLoading}
              isPendingToolCall={isPendingToolCall}
              setMessages={setMessages}
              sendMessage={sendMessage}
              space={space}
              error={error}
              isAtBottom={isAtBottom}
              scrollToBottom={scrollToBottom}
              input={input}
              setInput={setInput}
              stop={stop}
              isFirstTime={isFirstTime}
              handleFocus={handleFocus}
              isDeleteThreadPopupOpen={isDeleteThreadPopupOpen}
              setIsDeleteThreadPopupOpen={setIsDeleteThreadPopupOpen}
            />
          </ResizablePanel>

          {/* Resizable Handle */}
          <ResizableHandle className="w-1 bg-border hover:bg-border/80 transition-colors" />

          {/* Canvas Panel */}
          <ResizablePanel defaultSize={50} minSize={25} maxSize={65}>
            <CanvasPanel
              isVisible={isCanvasVisible}
              onClose={closeCanvas}
              artifacts={canvasArtifacts}
              activeArtifactId={activeArtifactId}
              onArtifactSelect={setActiveArtifactId}
              canvasName={canvasName}
              isIntegrated={true}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div key="chat-only-layout" className="h-full">
          <ChatContent
            emptyMessage={emptyMessage}
            containerRef={containerRef}
            handleScroll={handleScroll}
            messages={messages}
            threadId={threadId}
            status={status}
            addToolResult={addToolResult}
            isLoading={isLoading}
            isPendingToolCall={isPendingToolCall}
            setMessages={setMessages}
            sendMessage={sendMessage}
            space={space}
            error={error}
            isAtBottom={isAtBottom}
            scrollToBottom={scrollToBottom}
            input={input}
            setInput={setInput}
            stop={stop}
            isFirstTime={isFirstTime}
            handleFocus={handleFocus}
            isDeleteThreadPopupOpen={isDeleteThreadPopupOpen}
            setIsDeleteThreadPopupOpen={setIsDeleteThreadPopupOpen}
          />
        </div>
      )}
    </>
  );
}

function DeleteThreadPopup({
  threadId,
  onClose,
  open,
}: { threadId: string; onClose: () => void; open: boolean }) {
  const t = useTranslations();
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const handleDelete = useCallback(() => {
    setIsDeleting(true);
    safe(() => deleteThreadAction(threadId))
      .watch(() => setIsDeleting(false))
      .ifOk(() => {
        toast.success(t("Chat.Thread.threadDeleted"));
        router.push("/");
      })
      .ifFail(() => toast.error(t("Chat.Thread.failedToDeleteThread")))
      .watch(() => onClose());
  }, [threadId, router]);
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Chat.Thread.deleteChat")}</DialogTitle>
          <DialogDescription>
            {t("Chat.Thread.areYouSureYouWantToDeleteThisChatThread")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("Common.cancel")}
          </Button>
          <Button variant="destructive" onClick={handleDelete} autoFocus>
            {t("Common.delete")}
            {isDeleting && <Loader className="size-3.5 ml-2 animate-spin" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

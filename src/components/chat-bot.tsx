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
    addArtifact: addCanvasArtifact,
    closeCanvas,
    setActiveArtifactId,
  } = useCanvas();

  // Debug canvas state changes
  useEffect(() => {
    console.log(
      "🔍 Canvas Debug: Canvas state changed - isVisible:",
      isCanvasVisible,
      "artifacts:",
      canvasArtifacts.length,
    );
  }, [isCanvasVisible, canvasArtifacts.length]);

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
          allowedAppDefaultToolkit: latestRef.current.mentions?.length
            ? []
            : latestRef.current.allowedAppDefaultToolkit,
          allowedMcpServers: latestRef.current.mentions?.length
            ? {}
            : latestRef.current.allowedMcpServers,
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
    // Debug data streaming (will be handled by tool result processing)
    onData: (data: any) => {
      console.log("🔍 AI SDK onData:", data);
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

  useEffect(() => {
    if (mounted) {
      handleFocus();
    }
  }, [input]);

  // Track processed messages to prevent infinite loops
  const processedMessagesRef = useRef(new Set<string>());

  // Simple tool result processing for Canvas
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];

    if (lastMessage?.role === "assistant" && !processedMessagesRef.current.has(lastMessage.id)) {
      processedMessagesRef.current.add(lastMessage.id);

      lastMessage.parts.forEach((part) => {
        if (isToolUIPart(part) && part.state === "output-available") {
          const toolName = getToolName(part);
          const result = part.output as any;

          // Simple chart tool detection and Canvas artifact creation
          if (toolName === "create_chart" && result?.shouldCreateArtifact && result?.status === 'success') {
            const artifact = {
              id: result.chartId,
              type: "chart" as const,
              title: result.title,
              data: result.chartData,
              metadata: {
                chartType: result.chartType,
                dataPoints: result.dataPoints,
                lastUpdated: "now"
              }
            };

            addCanvasArtifact(artifact);
          }
        }
      });
    }
  }, [messages.length, addCanvasArtifact]);

  // Canvas visibility now controlled directly by onData handler

  console.log(
    "🎬 ChatBot Debug: Rendering ChatBot with isCanvasVisible:",
    isCanvasVisible,
    "artifacts:",
    canvasArtifacts.length,
  );

  // Canvas visibility controlled manually - no auto-show

  return (
    <>
      {particle}
      {/* Resizable integrated layout */}
      {isCanvasVisible
        ? (() => {
            console.log(
              "✨ ChatBot Debug: Rendering CANVAS LAYOUT (ResizablePanelGroup)",
            );
            return (
              <ResizablePanelGroup direction="horizontal" className="h-full">
                {/* Chat Panel */}
                <ResizablePanel defaultSize={65} minSize={40} maxSize={80}>
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
                <ResizablePanel defaultSize={35} minSize={20} maxSize={60}>
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
            );
          })()
        : (() => {
            console.log(
              "💬 ChatBot Debug: Rendering CHAT-ONLY LAYOUT (no canvas)",
            );
            return (
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
            );
          })()}
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

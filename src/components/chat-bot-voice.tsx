"use client";

import { getToolName, isToolUIPart, TextPart } from "ai";
import { DEFAULT_VOICE_TOOLS, UIMessageWithCompleted } from "lib/ai/speech";
import { generateUUID } from "lib/utils";
import logger from "lib/logger";

import {
  OPENAI_VOICE,
  useOpenAIVoiceChat as OpenAIVoiceChat,
} from "lib/ai/speech/open-ai/use-voice-chat.openai";
import { cn } from "lib/utils";
import {
  CheckIcon,
  Loader,
  MicIcon,
  MicOffIcon,
  PhoneIcon,
  Settings2Icon,
  TriangleAlertIcon,
  XIcon,
  MessagesSquareIcon,
  MessageSquareMoreIcon,
  WrenchIcon,
  ChevronRight,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { safe } from "ts-safe";
import { Alert, AlertDescription, AlertTitle } from "ui/alert";
import { Button } from "ui/button";

import { Drawer, DrawerContent, DrawerPortal, DrawerTitle } from "ui/drawer";
import { CanvasPanel, useCanvas } from "./canvas-panel";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "ui/resizable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { GeminiIcon } from "ui/gemini-icon";
import { MessageLoading } from "ui/message-loading";
import { OpenAIIcon } from "ui/openai-icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { ToolMessagePart } from "./message-parts";

import { EnabledMcpToolsDropdown } from "./enabled-mcp-tools-dropdown";
import { appStore } from "@/app/store";
import { useShallow } from "zustand/shallow";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "ui/dialog";
import JsonView from "ui/json-view";
import { isShortcutEvent, Shortcuts } from "lib/keyboard-shortcuts";

const prependTools = [
  {
    id: "Browser",
    name: "Browser",
    tools: DEFAULT_VOICE_TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
    })),
  },
];

export function ChatBotVoice() {
  const t = useTranslations("Chat");
  const [appStoreMutate, voiceChat, model] = appStore(
    useShallow((state) => [state.mutate, state.voiceChat, state.chatModel]),
  );

  const [isClosing, setIsClosing] = useState(false);
  const startAudio = useRef<HTMLAudioElement>(null);
  const [useCompactView, setUseCompactView] = useState(true);

  // Canvas state management - CRITICAL missing feature from voice chat
  const {
    isVisible: isCanvasVisible,
    artifacts: canvasArtifacts,
    activeArtifactId,
    canvasName,
    userManuallyClosed,
    addArtifact: addCanvasArtifact,
    addLoadingArtifact,
    updateArtifact: updateCanvasArtifact,
    closeCanvas,
    showCanvas,
    setActiveArtifactId,
  } = useCanvas();

  // Cleanup processed tools when voice chat session changes
  const processedToolsRef = useRef(new Set<string>());

  const {
    isListening,
    isAssistantSpeaking,
    isLoading,
    isActive,
    isUserSpeaking,
    messages,
    error,
    start,
    startListening,
    stop,
    stopListening,
  } = OpenAIVoiceChat({
    ...voiceChat.options.providerOptions,
    agentId: voiceChat.agentId,
  });

  const startWithSound = useCallback(() => {
    if (!startAudio.current) {
      startAudio.current = new Audio("/sounds/start_voice.ogg");
    }
    start().then(() => {
      startAudio.current?.play().catch(() => {});
    });
  }, [start]);

  const endVoiceChat = useCallback(async () => {
    setIsClosing(true);
    await safe(() => stop());
    setIsClosing(false);
    appStoreMutate({
      voiceChat: {
        ...voiceChat,
        isOpen: false,
      },
    });
  }, [messages, model]);

  // CRITICAL: Chart tool detection for Canvas integration (copied from chat-bot.tsx)
  // Voice chat needs same Canvas processing as regular chat
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

        logger.debug("Voice Chat Tool Processing", {
          messageId: lastMessage.id,
          partCount: lastMessage.parts.length,
          timestamp: new Date().toISOString(),
        });

        // Look for all chart tools in any state (same as regular chat)
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
          // Basic artifact tools
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

        logger.debug("Voice Chat Chart Tools Found", {
          toolCount: chartTools.length,
          tools: chartTools.map((t) => ({
            name: getToolName(t),
            hasOutput: isToolUIPart(t),
          })),
        });

        // Open Canvas immediately when chart/table tools are detected (unless user closed it)
        if (chartTools.length > 0 && !isCanvasVisible && !userManuallyClosed) {
          logger.info("Voice Chat Auto-opening Canvas for chart tools");
          showCanvas();
        } else if (chartTools.length > 0 && userManuallyClosed) {
          logger.debug("Voice Chat Canvas closed by user - respecting choice");
        }

        // Process loading charts/tables - create loading artifacts when tools start
        const loadingCharts = chartTools.filter((part) => {
          if (!isToolUIPart(part)) return false;

          // Detect tools that are starting (input state) but not yet completed
          const isStarting =
            part.state.startsWith("input") ||
            part.state === "loading" ||
            (!part.state.startsWith("output") && part.state !== "error");

          if (isStarting) {
            const toolName = getToolName(part);
            const toolKey = `${lastMessage.id}-${toolName}-${part.toolCallId}`;

            // Check if we've already created loading artifact for this tool
            if (processedToolsRef.current.has(toolKey)) {
              return false;
            }

            // Mark as processed for loading
            processedToolsRef.current.add(toolKey);
            return true;
          }

          return false;
        });

        logger.debug("Voice Chat Processing Loading Charts", {
          loadingCount: loadingCharts.length,
          loadingTools: loadingCharts.map((part) => ({
            name: getToolName(part),
            state: isToolUIPart(part) ? part.state : "unknown",
          })),
        });

        // Create loading artifacts for chart tools that are starting
        loadingCharts.forEach((part) => {
          if (!isToolUIPart(part)) return;

          const toolName = getToolName(part);
          const args = part.args as any;

          // Extract chart name and type from tool arguments
          const chartTitle =
            args?.title ||
            args?.name ||
            `${toolName.replace("create_", "").replace("_", " ")}`;
          const chartType = toolName.includes("bar")
            ? "bar"
            : toolName.includes("line")
              ? "line"
              : toolName.includes("pie")
                ? "pie"
                : toolName.includes("area")
                  ? "area"
                  : toolName.includes("scatter")
                    ? "scatter"
                    : toolName.includes("radar")
                      ? "radar"
                      : toolName.includes("funnel")
                        ? "funnel"
                        : toolName.includes("treemap")
                          ? "treemap"
                          : toolName.includes("sankey")
                            ? "sankey"
                            : toolName.includes("radial")
                              ? "radial-bar"
                              : toolName.includes("composed")
                                ? "composed"
                                : toolName.includes("geographic")
                                  ? "geographic"
                                  : toolName.includes("gauge")
                                    ? "gauge"
                                    : toolName.includes("calendar") ||
                                        toolName.includes("heatmap")
                                      ? "calendar-heatmap"
                                      : toolName.includes("table")
                                        ? "table"
                                        : "bar";

          const loadingArtifactId = part.toolCallId || generateUUID();

          logger.debug("Voice Chat Creating Loading Artifact", {
            toolName,
            chartType,
            chartTitle,
            artifactId: loadingArtifactId,
          });

          // Create loading artifact
          addLoadingArtifact({
            id: loadingArtifactId,
            type: toolName.includes("table") ? "table" : "chart",
            title: chartTitle,
            canvasName: args?.canvasName || "Voice Data Visualization",
            metadata: {
              chartType,
              dataPoints: 0,
              isVoiceOriginated: true, // Mark as voice-originated
            },
          });
        });

        // Process completed charts/tables with duplicate prevention (same logic as regular chat)
        const completedCharts = chartTools.filter((part) => {
          if (!isToolUIPart(part) || !part.state.startsWith("output")) {
            return false;
          }

          const result = part.output as any;

          // Support multiple result formats
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
              logger.debug("Voice Chat Skipping Processed Chart", {
                chartId: artifactId,
                toolName: getToolName(part),
              });
              return false;
            }

            // Mark as processed
            processedToolsRef.current.add(toolKey);
            return true;
          }

          return false;
        });

        logger.debug("Voice Chat Processing Completed Charts", {
          completedCount: completedCharts.length,
          existingArtifacts: canvasArtifacts.length,
        });

        // Process completed charts using same logic as regular chat
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

          // Find existing artifact
          const existingArtifact = canvasArtifacts.find(
            (a) => a.id === artifactId || a.id === part.toolCallId,
          );

          // Determine if this is a table tool
          const isTableTool = toolName === "create_table";

          if (!existingArtifact) {
            logger.info(
              `Voice Chat Creating ${isTableTool ? "table" : "chart"} artifact`,
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
            let artifactType: "chart" | "table" = "chart";

            // Handle new artifact format
            const artifactData =
              result.artifact ||
              result.structuredContent?.result?.[0]?.artifact;
            if (artifactData) {
              const artifactContent = JSON.parse(artifactData.content);

              if (isTableTool) {
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
            } else {
              // Handle original format
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
                (isTableTool ? "Voice Data Table" : "Voice Data Visualization"),
              data: chartData,
              status: "completed" as const,
              metadata: {
                chartType: chartType || "bar",
                dataPoints: result.dataPoints || chartData?.data?.length || 0,
                toolName,
                lastUpdated: new Date().toISOString(),
                isVoiceOriginated: true, // Mark as voice-originated
              },
            };

            addCanvasArtifact(artifact);
          } else {
            // Update existing loading artifact with completed data
            logger.debug("Voice Chat Updating Loading Artifact", {
              existingId: existingArtifact.id,
              newId: artifactId,
              toolName,
              status: existingArtifact.status,
            });

            // Extract chart data for updating (same logic as creation)
            let chartData;
            let chartType;
            let title;

            const artifactData =
              result.artifact ||
              result.structuredContent?.result?.[0]?.artifact;
            if (artifactData) {
              const artifactContent = JSON.parse(artifactData.content);

              if (isTableTool) {
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
                isVoiceOriginated: true, // Mark as voice-originated
              },
            });
          }
        });
      } catch (error) {
        logger.error("Voice Chat Tool Processing Error", { error });
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
    addLoadingArtifact,
    updateCanvasArtifact,
    canvasArtifacts,
  ]);

  // generateUUID is now imported from lib/utils for consistency

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      logger.debug("Voice Chat Component Unmounting");

      // Clear any pending timeouts
      if (processingDebounceRef.current) {
        clearTimeout(processingDebounceRef.current);
      }

      // Clear processed tools cache
      processedToolsRef.current.clear();

      logger.debug("Voice Chat Cleanup Completed");
    };
  }, []);

  const statusMessage = useMemo(() => {
    if (isLoading) {
      return (
        <p className="fade-in animate-in duration-3000" key="start">
          {t("VoiceChat.preparing")}
        </p>
      );
    }
    if (!isActive)
      return (
        <p className="fade-in animate-in duration-3000" key="start">
          {t("VoiceChat.startVoiceChat")}
        </p>
      );
    if (!isListening)
      return (
        <p className="fade-in animate-in duration-3000" key="stop">
          {t("VoiceChat.yourMicIsOff")}
        </p>
      );
    if (!isAssistantSpeaking && messages.length === 0) {
      return (
        <p className="fade-in animate-in duration-3000" key="ready">
          {t("VoiceChat.readyWhenYouAreJustStartTalking")}
        </p>
      );
    }
    if (isUserSpeaking && useCompactView) {
      return <MessageLoading className="text-muted-foreground" />;
    }
    if (!isAssistantSpeaking && !isUserSpeaking) {
      return (
        <p className="delayed-fade-in" key="ready">
          {t("VoiceChat.readyWhenYouAreJustStartTalking")}
        </p>
      );
    }
  }, [
    isAssistantSpeaking,
    isUserSpeaking,
    isActive,
    isLoading,
    isListening,
    messages.length,
    useCompactView,
  ]);

  useEffect(() => {
    return () => {
      if (isActive) {
        stop();
      }
    };
  }, [voiceChat.options, isActive]);

  useEffect(() => {
    if (voiceChat.isOpen) {
      startWithSound();
    } else if (isActive) {
      stop();
    }
  }, [voiceChat.isOpen]);

  useEffect(() => {
    if (error && isActive) {
      toast.error(error.message);
      stop();
    }
  }, [error]);

  useEffect(() => {
    if (voiceChat.isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const isVoiceChatEvent = isShortcutEvent(e, Shortcuts.toggleVoiceChat);
      if (isVoiceChatEvent) {
        e.preventDefault();
        e.stopPropagation();
        appStoreMutate((prev) => ({
          voiceChat: {
            ...prev.voiceChat,
            isOpen: true,
            agentId: undefined,
          },
        }));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [voiceChat.isOpen]);

  // Track layout decisions for Voice Chat Canvas behavior
  logger.debug("Voice Chat Layout State", {
    layout: isCanvasVisible ? "SPLIT VIEW (Voice + Canvas)" : "VOICE ONLY",
    artifactCount: canvasArtifacts.length,
    userManuallyClosed,
    activeArtifactId,
    canvasName,
    voiceChatOpen: voiceChat.isOpen,
  });

  // CRITICAL: Use ResizablePanelGroup layout instead of full-screen Drawer
  // This is the key architectural change needed for Canvas integration
  return (
    <Drawer dismissible={false} open={voiceChat.isOpen} direction="top">
      <DrawerPortal>
        <DrawerContent className="max-h-[100vh]! h-full border-none! rounded-none! flex flex-col bg-card">
          {/* Voice Chat Header (always visible) */}
          <div
            className="w-full flex p-6 gap-2 border-b"
            style={{
              userSelect: "text",
            }}
          >
            <div className="flex items-center ">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={"secondary"}
                    size={"icon"}
                    onClick={() => setUseCompactView(!useCompactView)}
                  >
                    {useCompactView ? (
                      <MessageSquareMoreIcon />
                    ) : (
                      <MessagesSquareIcon />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {useCompactView
                    ? t("VoiceChat.compactDisplayMode")
                    : t("VoiceChat.conversationDisplayMode")}
                </TooltipContent>
              </Tooltip>
            </div>
            <DrawerTitle className="flex items-center gap-2 w-full">
              <EnabledMcpToolsDropdown
                align="start"
                side="bottom"
                prependTools={prependTools}
              />

              <div className="flex-1" />
              {/* Canvas Controls */}
              {canvasArtifacts.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isCanvasVisible ? "default" : "secondary"}
                      size={"icon"}
                      onClick={() => {
                        if (isCanvasVisible) {
                          closeCanvas();
                        } else {
                          showCanvas();
                        }
                      }}
                    >
                      <span className="text-xs">📊</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isCanvasVisible ? "Hide Canvas" : "Show Canvas"}
                  </TooltipContent>
                </Tooltip>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={"ghost"} size={"icon"}>
                    <Settings2Icon className="text-foreground size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="left"
                  className="min-w-40"
                  align="start"
                >
                  <DropdownMenuGroup className="cursor-pointer">
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger
                        className="flex items-center gap-2 cursor-pointer"
                        icon=""
                      >
                        <OpenAIIcon className="size-3.5 stroke-none fill-foreground" />
                        Open AI
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          {Object.entries(OPENAI_VOICE).map(([key, value]) => (
                            <DropdownMenuItem
                              className="cursor-pointer flex items-center justify-between"
                              onClick={() =>
                                appStoreMutate({
                                  voiceChat: {
                                    ...voiceChat,
                                    options: {
                                      provider: "openai",
                                      providerOptions: {
                                        voice: value,
                                      },
                                    },
                                  },
                                })
                              }
                              key={key}
                            >
                              {key}

                              {value ===
                                voiceChat.options.providerOptions?.voice && (
                                <CheckIcon className="size-3.5" />
                              )}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger
                          className="flex items-center gap-2 text-muted-foreground"
                          icon=""
                        >
                          <GeminiIcon className="size-3.5" />
                          Gemini
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <div className="text-xs text-muted-foreground p-6">
                              Not Implemented Yet
                            </div>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                    </DropdownMenuSub>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </DrawerTitle>
          </div>

          {/* CRITICAL: Resizable integrated layout with Canvas support */}
          {isCanvasVisible ? (
            <ResizablePanelGroup
              key="voice-canvas-layout"
              direction="horizontal"
              className="flex-1 min-h-0"
            >
              {/* Voice Chat Panel */}
              <ResizablePanel defaultSize={50} minSize={35} maxSize={75}>
                <VoiceChatContent
                  error={error}
                  isLoading={isLoading}
                  useCompactView={useCompactView}
                  messages={messages}
                  statusMessage={statusMessage}
                  isClosing={isClosing}
                  isActive={isActive}
                  isListening={isListening}
                  isUserSpeaking={isUserSpeaking}
                  startWithSound={startWithSound}
                  startListening={startListening}
                  stopListening={stopListening}
                  endVoiceChat={endVoiceChat}
                  t={t}
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
            <div key="voice-only-layout" className="flex-1 min-h-0">
              <VoiceChatContent
                error={error}
                isLoading={isLoading}
                useCompactView={useCompactView}
                messages={messages}
                statusMessage={statusMessage}
                isClosing={isClosing}
                isActive={isActive}
                isListening={isListening}
                isUserSpeaking={isUserSpeaking}
                startWithSound={startWithSound}
                startListening={startListening}
                stopListening={stopListening}
                endVoiceChat={endVoiceChat}
                t={t}
              />
            </div>
          )}
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}

// Extracted VoiceChatContent component for cleaner layout organization
interface VoiceChatContentProps {
  error: Error | null;
  isLoading: boolean;
  useCompactView: boolean;
  messages: UIMessageWithCompleted[];
  statusMessage: React.ReactNode;
  isClosing: boolean;
  isActive: boolean;
  isListening: boolean;
  isUserSpeaking: boolean;
  startWithSound: () => void;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  endVoiceChat: () => Promise<void>;
  t: (key: string) => string;
}

function VoiceChatContent({
  error,
  isLoading,
  useCompactView,
  messages,
  statusMessage,
  isClosing,
  isActive,
  isListening,
  isUserSpeaking,
  startWithSound,
  startListening,
  stopListening,
  endVoiceChat,
  t,
}: VoiceChatContentProps) {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-0 mx-auto w-full">
        {error ? (
          <div className="max-w-3xl mx-auto p-6">
            <Alert variant={"destructive"}>
              <TriangleAlertIcon className="size-4 " />
              <AlertTitle className="">Error</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>

              <AlertDescription className="my-4 ">
                <p className="text-muted-foreground ">
                  {t("VoiceChat.pleaseCloseTheVoiceChatAndTryAgain")}
                </p>
              </AlertDescription>
            </Alert>
          </div>
        ) : null}
        {isLoading ? (
          <div className="flex-1"></div>
        ) : (
          <div className="h-full w-full">
            {useCompactView ? (
              <CompactMessageView messages={messages} />
            ) : (
              <ConversationView messages={messages} />
            )}
          </div>
        )}
      </div>
      <div className="relative w-full p-6 flex items-center justify-center gap-4">
        <div className="text-sm text-muted-foreground absolute -top-5 left-0 w-full justify-center flex items-center">
          {statusMessage}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={"secondary"}
              size={"icon"}
              disabled={isClosing || isLoading}
              onClick={() => {
                if (!isActive) {
                  startWithSound();
                } else if (isListening) {
                  stopListening();
                } else {
                  startListening();
                }
              }}
              className={cn(
                "rounded-full p-6 transition-colors duration-300",

                isLoading
                  ? "bg-accent-foreground text-accent animate-pulse"
                  : !isActive
                    ? "bg-green-500/10 text-green-500 hover:bg-green-500/30"
                    : !isListening
                      ? "bg-destructive/30 text-destructive hover:bg-destructive/10"
                      : isUserSpeaking
                        ? "bg-input text-foreground"
                        : "",
              )}
            >
              {isLoading || isClosing ? (
                <Loader className="size-6 animate-spin" />
              ) : !isActive ? (
                <PhoneIcon className="size-6 fill-green-500 stroke-none" />
              ) : isListening ? (
                <MicIcon
                  className={`size-6 ${isUserSpeaking ? "text-primary" : "text-muted-foreground transition-colors duration-300"}`}
                />
              ) : (
                <MicOffIcon className="size-6" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {!isActive
              ? t("VoiceChat.startConversation")
              : isListening
                ? t("VoiceChat.closeMic")
                : t("VoiceChat.openMic")}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={"secondary"}
              size={"icon"}
              className="rounded-full p-6"
              disabled={isLoading || isClosing}
              onClick={endVoiceChat}
            >
              <XIcon className="text-foreground size-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("VoiceChat.endConversation")}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

function ConversationView({
  messages,
}: { messages: UIMessageWithCompleted[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTo({
        top: ref.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages.length]);
  return (
    <div className="select-text w-full overflow-y-auto h-full" ref={ref}>
      <div className="max-w-4xl mx-auto flex flex-col px-6 gap-6 pb-44 min-h-0 min-w-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex px-4 py-3",
              message.role == "user" &&
                "ml-auto max-w-2xl text-foreground rounded-2xl w-fit bg-input/40",
            )}
          >
            {!message.completed ? (
              <MessageLoading
                className={cn(
                  message.role == "user"
                    ? "text-muted-foreground"
                    : "text-foreground",
                )}
              />
            ) : (
              message.parts.map((part, index) => {
                if (part.type === "text") {
                  if (!part.text) {
                    return (
                      <MessageLoading
                        key={index}
                        className={cn(
                          message.role == "user"
                            ? "text-muted-foreground"
                            : "text-foreground",
                        )}
                      />
                    );
                  }
                  return (
                    <p key={index}>
                      {(part.text || "...")
                        ?.trim()
                        .split(" ")
                        .map((word, wordIndex) => (
                          <span
                            key={wordIndex}
                            className="animate-in fade-in duration-3000"
                          >
                            {word}{" "}
                          </span>
                        ))}
                    </p>
                  );
                } else if (isToolUIPart(part)) {
                  return (
                    <ToolMessagePart
                      key={index}
                      part={part}
                      showActions={false}
                      messageId={message.id}
                      isLast={part.state.startsWith("input")}
                    />
                  );
                }
                return <p key={index}>{part.type} unknown part</p>;
              })
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CompactMessageView({
  messages,
}: {
  messages: UIMessageWithCompleted[];
}) {
  const { toolParts, textPart, userTextPart } = useMemo(() => {
    const toolParts = messages
      .filter((msg) => msg.parts.some(isToolUIPart))
      .map((msg) => msg.parts.find(isToolUIPart));

    const textPart = messages.findLast((msg) => msg.role === "assistant")
      ?.parts[0] as TextPart;

    // Also get the latest user message to show transcription
    const userTextPart = messages.findLast((msg) => msg.role === "user")
      ?.parts[0] as TextPart;

    return { toolParts, textPart, userTextPart };
  }, [messages]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute bottom-6 max-h-[80vh] overflow-y-auto left-6 z-10 flex-col gap-2 hidden md:flex">
        {toolParts.map((toolPart, index) => {
          const isExecuting = toolPart?.state.startsWith("input");
          if (!toolPart) return null;
          return (
            <Dialog key={index}>
              <DialogTrigger asChild>
                <div className="animate-in slide-in-from-bottom-2 fade-in duration-3000 max-w-xs w-full">
                  <Button
                    variant={"outline"}
                    size={"icon"}
                    className="w-full bg-card flex items-center gap-2 px-2 text-xs text-muted-foreground"
                  >
                    <WrenchIcon className="size-3.5" />
                    <span className="text-sm font-bold min-w-0 truncate mr-auto">
                      {getToolName(toolPart)}
                    </span>
                    {isExecuting ? (
                      <Loader className="size-3.5 animate-spin" />
                    ) : (
                      <ChevronRight className="size-3.5" />
                    )}
                  </Button>
                </div>
              </DialogTrigger>
              <DialogContent className="z-50 md:max-w-2xl! max-h-[80vh] overflow-y-auto p-8">
                <DialogTitle>{getToolName(toolPart)}</DialogTitle>
                <div className="flex flex-row gap-4 text-sm ">
                  <div className="w-1/2 min-w-0 flex flex-col">
                    <div className="flex items-center gap-2 mb-2 pt-2 pb-1 z-10">
                      <h5 className="text-muted-foreground text-sm font-medium">
                        Inputs
                      </h5>
                    </div>
                    <JsonView data={toolPart.input} />
                  </div>

                  <div className="w-1/2 min-w-0 pl-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-4 pt-2 pb-1  z-10">
                      <h5 className="text-muted-foreground text-sm font-medium">
                        Outputs
                      </h5>
                    </div>
                    <JsonView
                      data={
                        toolPart.state === "output-available"
                          ? toolPart.output
                          : toolPart.state == "output-error"
                            ? toolPart.errorText
                            : {}
                      }
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          );
        })}
      </div>

      {/* User Transcription - Show when speaking or recently spoke */}
      {userTextPart && userTextPart.text && (
        <div className="absolute top-6 left-6 right-6 z-20">
          <div className="bg-card/90 backdrop-blur-sm border rounded-lg p-4 shadow-lg">
            <p className="text-sm text-muted-foreground mb-1">You said:</p>
            <p className="text-base font-medium">
              {userTextPart.text?.split(" ").map((word, wordIndex) => (
                <span
                  key={wordIndex}
                  className="animate-in fade-in duration-1000"
                >
                  {word}{" "}
                </span>
              ))}
            </p>
          </div>
        </div>
      )}

      {/* Current Message - Prominent */}
      {textPart && (
        <div className="w-full mx-auto h-full max-h-[80vh] overflow-y-auto px-4 lg:max-w-4xl flex-1 flex items-center">
          <div className="animate-in fade-in-50 duration-1000">
            <p className="text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight tracking-wide">
              {textPart.text?.split(" ").map((word, wordIndex) => (
                <span
                  key={wordIndex}
                  className="animate-in fade-in duration-5000"
                >
                  {word}{" "}
                </span>
              ))}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

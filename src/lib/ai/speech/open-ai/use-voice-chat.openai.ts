"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  DEFAULT_VOICE_TOOLS,
  UIMessageWithCompleted,
  VoiceChatSession,
} from "..";
import { generateUUID } from "lib/utils";
import { TextPart, ToolUIPart } from "ai";
import {
  OpenAIRealtimeServerEvent,
  OpenAIRealtimeSession,
} from "./openai-realtime-event";

import { appStore } from "@/app/store";
import { useShallow } from "zustand/shallow";
import { useTheme } from "next-themes";
import { extractMCPToolId } from "lib/ai/mcp/mcp-tool-id";
import { callMcpToolByServerNameAction } from "@/app/api/mcp/actions";

export const OPENAI_VOICE = {
  Alloy: "alloy",
  Ash: "ash",
  Ballad: "ballad",
  Cedar: "cedar",
  Coral: "coral",
  Echo: "echo",
  Marin: "marin",
  Sage: "sage",
  Shimmer: "shimmer",
  Verse: "verse",
};

interface UseOpenAIVoiceChatProps {
  model?: string;
  voice?: string;
  agentId?: string;
}

type Content =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "tool-invocation";
      name: string;
      arguments: any;
      state: "call" | "result";
      toolCallId: string;
      result?: any;
    };

const createUIPart = (content: Content): TextPart | ToolUIPart => {
  if (content.type == "tool-invocation") {
    const part: ToolUIPart = {
      type: `tool-${content.name}`,
      input: content.arguments,
      state: "output-available",
      toolCallId: content.toolCallId,
      output: content.result,
    };
    return part;
  }
  return {
    type: "text",
    text: content.text,
  };
};

const createUIMessage = (m: {
  id?: string;
  role: "user" | "assistant";
  content: Content;
  completed?: boolean;
}): UIMessageWithCompleted => {
  const id = m.id ?? generateUUID();
  return {
    id,
    role: m.role,
    parts: [createUIPart(m.content)],
    completed: m.completed ?? false,
  };
};

export function useOpenAIVoiceChat(
  props?: UseOpenAIVoiceChatProps,
): VoiceChatSession {
  const {
    model = "gpt-realtime",
    voice = OPENAI_VOICE.Marin,
    agentId: propsAgentId,
  } = props || {};

  const [storeAgentId, allowedAppDefaultToolkit, allowedMcpServers] = appStore(
    useShallow((state) => [
      state.voiceChat.agentId,
      state.allowedAppDefaultToolkit,
      state.allowedMcpServers,
    ]),
  );

  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [messages, setMessages] = useState<UIMessageWithCompleted[]>([]);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);
  const audioStream = useRef<MediaStream | null>(null);
  const sessionUpdateRetryTimeout = useRef<NodeJS.Timeout | null>(null);
  const sessionUpdatedReceived = useRef(false);

  const { setTheme } = useTheme();
  const tracks = useRef<RTCRtpSender[]>([]);

  const startListening = useCallback(async () => {
    try {
      if (!audioStream.current) {
        audioStream.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      }
      if (tracks.current.length) {
        const micTrack = audioStream.current.getAudioTracks()[0];
        tracks.current.forEach((sender) => {
          sender.replaceTrack(micTrack);
        });
      }
      setIsListening(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  const stopListening = useCallback(async () => {
    try {
      if (audioStream.current) {
        audioStream.current.getTracks().forEach((track) => track.stop());
        audioStream.current = null;
      }
      if (tracks.current.length) {
        const placeholderTrack = createEmptyAudioTrack();
        tracks.current.forEach((sender) => {
          sender.replaceTrack(placeholderTrack);
        });
      }
      setIsListening(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  const createSession =
    useCallback(async (): Promise<OpenAIRealtimeSession> => {
      const response = await fetch(
        `/api/chat/openai-realtime?model=${model}&voice=${voice}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            voice,
            allowedAppDefaultToolkit,
            allowedMcpServers,
            agentId: propsAgentId || storeAgentId,
          }),
        },
      );
      if (response.status !== 200) {
        throw new Error(await response.text());
      }
      const session = await response.json();
      if (session.error) {
        throw new Error(session.error.message);
      }

      return session;
    }, [
      model,
      voice,
      allowedAppDefaultToolkit,
      allowedMcpServers,
      propsAgentId || storeAgentId,
    ]);

  const updateUIMessage = useCallback(
    (
      id: string,
      action:
        | Partial<UIMessageWithCompleted>
        | ((
            message: UIMessageWithCompleted,
          ) => Partial<UIMessageWithCompleted>),
    ) => {
      setMessages((prev) => {
        if (prev.length) {
          const lastMessage = prev.find((m) => m.id == id);
          if (!lastMessage) return prev;
          const nextMessage =
            typeof action === "function" ? action(lastMessage) : action;
          if (lastMessage == nextMessage) return prev;
          return prev.map((m) => (m.id == id ? { ...m, ...nextMessage } : m));
        }
        return prev;
      });
    },
    [],
  );

  const clientFunctionCall = useCallback(
    async ({
      callId,
      toolName,
      args,
      id,
    }: { callId: string; toolName: string; args: string; id: string }) => {
      let toolResult: any = "success";
      stopListening();
      const toolArgs = JSON.parse(args);
      if (DEFAULT_VOICE_TOOLS.some((t) => t.name === toolName)) {
        switch (toolName) {
          case "changeBrowserTheme":
            setTheme(toolArgs?.theme);
            break;
        }
      } else {
        const toolId = extractMCPToolId(toolName);

        toolResult = await callMcpToolByServerNameAction(
          toolId.serverName,
          toolId.toolName,
          toolArgs,
        );
      }
      startListening();
      const resultText = JSON.stringify(toolResult).trim();

      const event = {
        type: "conversation.item.create",
        previous_item_id: id,
        item: {
          type: "function_call_output",
          call_id: callId,
          output: resultText.slice(0, 15000),
        },
      };
      updateUIMessage(id, (prev) => {
        const prevPart = prev.parts.find((p) => p.type == `tool-${toolName}`);
        if (!prevPart) return prev;
        const part: ToolUIPart = {
          state: "output-available",
          output: toolResult,
          toolCallId: callId,
          input: toolArgs,
          type: `tool-${toolName}`,
        };
        return {
          parts: [part],
        };
      });
      dataChannel.current?.send(JSON.stringify(event));

      dataChannel.current?.send(JSON.stringify({ type: "response.create" }));
      dataChannel.current?.send(JSON.stringify({ type: "response.create" }));
    },
    [updateUIMessage],
  );

  const handleServerEvent = useCallback(
    (event: OpenAIRealtimeServerEvent) => {
      // COMPREHENSIVE DEBUG LOGGING - Log ALL events to understand flow
      console.log("📡 OpenAI Event Received:", {
        type: event.type,
        timestamp: new Date().toISOString(),
        event: event,
      });

      // Special attention to speech and transcription events
      if (
        event.type.includes("speech") ||
        event.type.includes("transcription") ||
        event.type.includes("audio")
      ) {
        console.log("🔍 CRITICAL EVENT:", event.type, {
          item_id: (event as any).item_id,
          transcript: (event as any).transcript,
          delta: (event as any).delta,
          fullEvent: event,
        });
      }

      switch (event.type) {
        case "input_audio_buffer.speech_started": {
          console.log("🎙️ CREATING USER MESSAGE with ID:", event.item_id);
          const message = createUIMessage({
            role: "user",
            id: event.item_id,
            content: {
              type: "text",
              text: "",
            },
          });
          console.log("📝 Created user message:", message);
          setIsUserSpeaking(true);
          setMessages((prev) => {
            const newMessages = [...prev, message];
            console.log(
              "📋 Messages array updated, total messages:",
              newMessages.length,
            );
            return newMessages;
          });
          break;
        }
        case "input_audio_buffer.committed": {
          updateUIMessage(event.item_id, {
            parts: [
              {
                type: "text",
                text: "",
              },
            ],
            completed: true,
          });
          break;
        }
        case "conversation.item.input_audio_transcription.delta": {
          console.log("🎤 USER TRANSCRIPTION DELTA - Updating message:", {
            item_id: event.item_id,
            delta: (event as any).delta,
            event: event,
          });
          updateUIMessage(event.item_id, (prev) => {
            console.log("📝 Updating user message:", prev);
            const textPart = prev.parts.find((p) => p.type === "text");
            if (!textPart) {
              console.log("❌ No text part found in user message");
              return prev;
            }
            const newText =
              (textPart.text || "") + ((event as any).delta || "");
            console.log("✏️ Updated text:", newText);
            textPart.text = newText;
            return prev;
          });
          break;
        }
        case "conversation.item.input_audio_transcription.completed": {
          console.log("🎤 USER TRANSCRIPTION COMPLETED - Final update:", {
            item_id: event.item_id,
            transcript: (event as any).transcript,
            event: event,
          });
          updateUIMessage(event.item_id, {
            parts: [
              {
                type: "text",
                text: (event as any).transcript || "...speaking",
              },
            ],
            completed: true,
          });
          break;
        }
        case "response.output_audio_transcript.delta": {
          setIsAssistantSpeaking(true);
          setMessages((prev) => {
            const message = prev
              .slice()
              .reverse()
              .find((m) => m.id == event.item_id)!;
            if (message) {
              return prev.map((m) =>
                m.id == event.item_id
                  ? {
                      ...m,
                      parts: [
                        {
                          type: "text",
                          text:
                            (message.parts[0] as TextPart).text! + event.delta,
                        },
                      ],
                    }
                  : m,
              );
            }
            return [
              ...prev,
              createUIMessage({
                role: "assistant",
                id: event.item_id,
                content: {
                  type: "text",
                  text: event.delta,
                },
                completed: true,
              }),
            ];
          });
          break;
        }
        case "response.output_audio_transcript.done": {
          updateUIMessage(event.item_id, (prev) => {
            const textPart = prev.parts.find((p) => p.type == "text");
            if (!textPart) return prev;
            textPart.text = event.transcript || "";
            return {
              ...prev,
              completed: true,
            };
          });
          break;
        }
        case "response.function_call_arguments.done": {
          const message = createUIMessage({
            role: "assistant",
            id: event.item_id,
            content: {
              type: "tool-invocation",
              name: event.name,
              arguments: JSON.parse(event.arguments),
              state: "call",
              toolCallId: event.call_id,
            },
            completed: true,
          });
          setMessages((prev) => [...prev, message]);
          clientFunctionCall({
            callId: event.call_id,
            toolName: event.name,
            args: event.arguments,
            id: event.item_id,
          });
          break;
        }
        case "input_audio_buffer.speech_stopped": {
          setIsUserSpeaking(false);
          break;
        }
        case "output_audio_buffer.stopped": {
          setIsAssistantSpeaking(false);
          break;
        }
        default: {
          // Catch any transcription events we might be missing
          if (
            event.type.includes("transcription") ||
            event.type.includes("input_audio")
          ) {
            console.log("🚨 UNHANDLED TRANSCRIPTION EVENT:", event.type, event);
          }
          break;
        }
        case "session.updated": {
          console.log("✅ Session configuration update confirmed by OpenAI");
          sessionUpdatedReceived.current = true;

          // Clear any pending retry timeout
          if (sessionUpdateRetryTimeout.current) {
            clearTimeout(sessionUpdateRetryTimeout.current);
            sessionUpdateRetryTimeout.current = null;
          }
          break;
        }
      }
    },
    [clientFunctionCall, updateUIMessage],
  );

  const start = useCallback(async () => {
    if (isActive || isLoading) return;
    setIsLoading(true);
    setError(null);
    setMessages([]);
    try {
      const session = await createSession();
      console.log({ session });

      // Handle both old and new response formats
      const sessionToken = session.client_secret?.value || session.value;
      if (!sessionToken) {
        throw new Error("No session token received from OpenAI API");
      }
      const pc = new RTCPeerConnection();
      if (!audioElement.current) {
        audioElement.current = document.createElement("audio");
      }
      audioElement.current.autoplay = true;
      pc.ontrack = (e) => {
        if (audioElement.current) {
          audioElement.current.srcObject = e.streams[0];
        }
      };
      if (!audioStream.current) {
        audioStream.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      }
      tracks.current = [];
      audioStream.current.getTracks().forEach((track) => {
        const sender = pc.addTrack(track, audioStream.current!);
        if (sender) tracks.current.push(sender);
      });

      const dc = pc.createDataChannel("oai-events");
      dataChannel.current = dc;
      dc.addEventListener("message", async (e) => {
        try {
          const event = JSON.parse(e.data) as OpenAIRealtimeServerEvent;
          handleServerEvent(event);
        } catch (err) {
          console.error({
            data: e.data,
            error: err,
          });
        }
      });
      dc.addEventListener("open", () => {
        console.log("🚀 WebRTC Data Channel OPENED - Connection established!");
        // Reset session update tracking
        sessionUpdatedReceived.current = false;

        // Send session configuration in sequential updates to avoid overwhelming OpenAI
        if (session.sessionConfig) {
          console.log("📤 Starting split configuration updates:", {
            hasInstructions: !!session.sessionConfig.instructions,
            instructionsLength: session.sessionConfig.instructions?.length,
            toolCount: session.sessionConfig.tools?.length,
            voice: session.sessionConfig.audio?.output?.voice,
            instructionsPreview:
              session.sessionConfig.instructions?.substring(0, 200) + "...",
          });

          // Step 1: Send instructions update (agent system prompt)
          const instructionsUpdate = {
            type: "session.update",
            session: {
              type: "realtime",
              model: "gpt-realtime",
              instructions: session.sessionConfig.instructions,
              output_modalities: session.sessionConfig.output_modalities,
            },
          };

          console.log("📤 Step 1: Sending instructions update");
          dc.send(JSON.stringify(instructionsUpdate));

          // Step 2: Send tools update (100ms delay)
          setTimeout(() => {
            const toolsUpdate = {
              type: "session.update",
              session: {
                type: "realtime",
                model: "gpt-realtime",
                tools: session.sessionConfig.tools,
              },
            };

            console.log("📤 Step 2: Sending tools update");
            dc.send(JSON.stringify(toolsUpdate));

            // Step 3: Send audio settings update (100ms delay)
            setTimeout(() => {
              const audioUpdate = {
                type: "session.update",
                session: {
                  type: "realtime",
                  model: "gpt-realtime",
                  audio: session.sessionConfig.audio,
                },
              };

              console.log("📤 Step 3: Sending audio settings update");
              dc.send(JSON.stringify(audioUpdate));

              console.log("✅ All configuration updates sent successfully");
            }, 100);
          }, 100);

          // Set up retry logic if session.updated is not received within 3 seconds
          // (increased timeout due to sequential updates)
          sessionUpdateRetryTimeout.current = setTimeout(() => {
            if (!sessionUpdatedReceived.current) {
              console.warn(
                "⚠️ session.updated not received within 3 seconds, retrying with full configuration...",
              );
              console.log("🔄 Retrying with single session.update as fallback");

              const fallbackUpdate = {
                type: "session.update",
                session: {
                  type: "realtime",
                  model: "gpt-realtime",
                  ...session.sessionConfig,
                },
              };
              dc.send(JSON.stringify(fallbackUpdate));

              // Set up a final timeout for logging if still not received
              setTimeout(() => {
                if (!sessionUpdatedReceived.current) {
                  console.error(
                    "❌ session.updated still not received after retry - agent system prompt may not be active",
                  );
                }
              }, 2000);
            }
          }, 3000);
        }

        setIsActive(true);
        setIsListening(true);
        setIsLoading(false);
      });
      dc.addEventListener("close", () => {
        // Clean up session update timeout on close
        if (sessionUpdateRetryTimeout.current) {
          clearTimeout(sessionUpdateRetryTimeout.current);
          sessionUpdateRetryTimeout.current = null;
        }
        sessionUpdatedReceived.current = false;

        setIsActive(false);
        setIsListening(false);
        setIsLoading(false);
      });
      dc.addEventListener("error", (errorEvent) => {
        console.error(errorEvent);
        setError(errorEvent.error);
        setIsActive(false);
        setIsListening(false);
      });
      console.log("🔗 Creating WebRTC offer...");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log(
        "📡 Attempting WebRTC connection to OpenAI with token:",
        sessionToken.substring(0, 20) + "...",
      );
      const sdpResponse = await fetch(
        `https://api.openai.com/v1/realtime/calls`,
        {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            "Content-Type": "application/sdp",
          },
        },
      );
      console.log("📋 SDP Response status:", sdpResponse.status);
      const sdpText = await sdpResponse.text();
      console.log("📋 SDP Response received, length:", sdpText.length);

      const answer: RTCSessionDescriptionInit = {
        type: "answer",
        sdp: sdpText,
      };

      console.log("🔗 Setting remote description...");
      await pc.setRemoteDescription(answer);
      peerConnection.current = pc;
      console.log("✅ WebRTC Peer Connection established successfully!");

      // Add timeout fallback - if data channel doesn't open within 5 seconds, exit loading
      setTimeout(() => {
        if (isLoading) {
          console.warn(
            "⚠️ Data channel didn't open within 5 seconds, exiting loading state",
          );
          setIsLoading(false);
          setError(new Error("WebRTC data channel connection timeout"));
        }
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsActive(false);
      setIsListening(false);
      setIsLoading(false);
    }
  }, [isActive, isLoading, createSession, handleServerEvent, voice]);

  const stop = useCallback(async () => {
    try {
      // Clean up session update timeout
      if (sessionUpdateRetryTimeout.current) {
        clearTimeout(sessionUpdateRetryTimeout.current);
        sessionUpdateRetryTimeout.current = null;
      }
      sessionUpdatedReceived.current = false;

      if (dataChannel.current) {
        dataChannel.current.close();
        dataChannel.current = null;
      }
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      tracks.current = [];
      stopListening();
      setIsActive(false);
      setIsListening(false);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [stopListening]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  function createEmptyAudioTrack(): MediaStreamTrack {
    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();
    return destination.stream.getAudioTracks()[0];
  }

  return {
    isActive,
    isUserSpeaking,
    isAssistantSpeaking,
    isListening,
    isLoading,
    error,
    messages,
    start,
    stop,
    startListening,
    stopListening,
  };
}

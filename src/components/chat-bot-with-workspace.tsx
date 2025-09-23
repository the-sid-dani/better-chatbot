"use client";

import { useEffect, useCallback } from "react";
import { BaseArtifact } from "app-types/artifacts";
import {
  Workspace,
  WorkspaceProvider,
  useWorkspace,
  getArtifactDefinitions,
  artifactRegistry
} from "./artifacts";
import { chartsArtifact } from "../../artifacts/charts/client";
import ChatBot from "./chat-bot";
import { UIMessage } from "ai";
import { generateUUID } from "lib/utils";
import { toast } from "sonner";

// Register the charts artifact
artifactRegistry.register(chartsArtifact);

interface ChatBotWithWorkspaceProps {
  threadId: string;
  initialMessages: Array<UIMessage>;
  selectedChatModel?: string;
}

// Inner component that uses workspace context
function ChatBotWithWorkspaceInner({
  threadId,
  initialMessages,
  selectedChatModel,
}: ChatBotWithWorkspaceProps) {
  const {
    artifacts,
    activeArtifactId,
    addArtifact,
    updateArtifact,
    removeArtifact,
    setActiveArtifact
  } = useWorkspace();

  // Mock message append function for now
  const handleAppendMessage = useCallback((message: { role: "user" | "assistant"; content: string }) => {
    // This would typically be handled by the chat system
    // For now, we'll just log it
    console.log("Append message:", message);
  }, []);

  // Save artifact content
  const handleArtifactSave = useCallback(async (artifactId: string, content: string) => {
    try {
      // Call the artifacts API to save the content
      const response = await fetch(`/api/artifacts/${artifactId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          description: "Manual content update from workspace"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save artifact");
      }

      // Update local state
      updateArtifact(artifactId, { content, updatedAt: new Date() });
      toast.success("Artifact saved successfully");
    } catch (error) {
      console.error("Failed to save artifact:", error);
      toast.error("Failed to save artifact");
    }
  }, [updateArtifact]);

  // Listen for custom events from tool execution
  useEffect(() => {
    const handleArtifactCreate = (event: CustomEvent) => {
      const { artifactData } = event.detail;

      const artifact: BaseArtifact = {
        id: artifactData.id || generateUUID(),
        kind: artifactData.kind || "charts",
        title: artifactData.title || "Chart",
        content: artifactData.content || "",
        status: "complete",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addArtifact(artifact);
      toast.success(`${artifact.kind} "${artifact.title}" created in workspace`);
    };

    const handleArtifactUpdate = (event: CustomEvent) => {
      const { artifactId, updates } = event.detail;
      updateArtifact(artifactId, updates);
      toast.success("Artifact updated in workspace");
    };

    // Listen for custom events from the chat system
    window.addEventListener("artifact:create", handleArtifactCreate as EventListener);
    window.addEventListener("artifact:update", handleArtifactUpdate as EventListener);

    return () => {
      window.removeEventListener("artifact:create", handleArtifactCreate as EventListener);
      window.removeEventListener("artifact:update", handleArtifactUpdate as EventListener);
    };
  }, [addArtifact, updateArtifact]);

  return (
    <Workspace
      chatContent={
        <ChatBot
          threadId={threadId}
          initialMessages={initialMessages}
          selectedChatModel={selectedChatModel}
        />
      }
      artifacts={artifacts}
      artifactDefinitions={getArtifactDefinitions()}
      activeArtifactId={activeArtifactId}
      onArtifactSelect={setActiveArtifact}
      onArtifactClose={removeArtifact}
      onArtifactUpdate={(id, updates) => updateArtifact(id, updates)}
      onArtifactSave={handleArtifactSave}
      appendMessage={handleAppendMessage}
      className="h-full"
    />
  );
}

// Main component with workspace provider
export default function ChatBotWithWorkspace(props: ChatBotWithWorkspaceProps) {
  return (
    <WorkspaceProvider>
      <ChatBotWithWorkspaceInner {...props} />
    </WorkspaceProvider>
  );
}

// Export for backward compatibility
export { ChatBotWithWorkspace };
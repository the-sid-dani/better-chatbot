"use client";

import { create } from "zustand";
import { BaseArtifact } from "app-types/artifacts";

interface ArtifactsStore {
  artifacts: BaseArtifact[];
  activeArtifactId?: string;
  isWorkspaceVisible: boolean;

  // Actions
  addArtifact: (artifact: BaseArtifact) => void;
  updateArtifact: (id: string, updates: Partial<BaseArtifact>) => void;
  removeArtifact: (id: string) => void;
  setActiveArtifact: (id: string) => void;
  showWorkspace: () => void;
  hideWorkspace: () => void;
  toggleWorkspace: () => void;
  clearArtifacts: () => void;
}

export const useArtifactsStore = create<ArtifactsStore>((set, _get) => ({
  artifacts: [],
  activeArtifactId: undefined,
  isWorkspaceVisible: false,

  addArtifact: (artifact) => {
    set((state) => ({
      artifacts: [...state.artifacts, artifact],
      activeArtifactId: artifact.id,
      isWorkspaceVisible: true, // Show workspace when artifact is added
    }));
  },

  updateArtifact: (id, updates) => {
    set((state) => ({
      artifacts: state.artifacts.map((artifact) =>
        artifact.id === id ? { ...artifact, ...updates } : artifact
      ),
    }));
  },

  removeArtifact: (id) => {
    set((state) => {
      const newArtifacts = state.artifacts.filter((artifact) => artifact.id !== id);
      return {
        artifacts: newArtifacts,
        activeArtifactId: state.activeArtifactId === id ? newArtifacts[0]?.id : state.activeArtifactId,
        isWorkspaceVisible: newArtifacts.length > 0, // Hide workspace if no artifacts
      };
    });
  },

  setActiveArtifact: (id) => {
    set({ activeArtifactId: id });
  },

  showWorkspace: () => {
    set({ isWorkspaceVisible: true });
  },

  hideWorkspace: () => {
    set({ isWorkspaceVisible: false });
  },

  toggleWorkspace: () => {
    set((state) => ({ isWorkspaceVisible: !state.isWorkspaceVisible }));
  },

  clearArtifacts: () => {
    set({
      artifacts: [],
      activeArtifactId: undefined,
      isWorkspaceVisible: false,
    });
  },
}));

// Helper function to create artifact from tool result
export function createArtifactFromToolResult(toolName: string, result: any): BaseArtifact | null {
  // Handle individual chart artifact tools
  if ((toolName === "createBarChart" ||
       toolName === "createLineChart" ||
       toolName === "createPieChart" ||
       toolName === "create_chart") &&
      result?.success && result?.artifact) {
    return {
      id: result.artifactId,
      kind: "charts",
      title: result.artifact.title,
      content: result.artifact.content,
      status: "complete",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  return null;
}

// Helper to check if a tool result should create an artifact
export function shouldCreateArtifact(toolName: string, result: any): boolean {
  return (toolName === "createBarChart" ||
          toolName === "createLineChart" ||
          toolName === "createPieChart" ||
          toolName === "create_chart") &&
         result?.success &&
         result?.canvasReady === true;
}
"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "ui/resizable";
import { Button } from "ui/button";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { Badge } from "ui/badge";
import {
  X,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
  BarChart3,
  Code,
  Image as ImageIcon
} from "lucide-react";
import { cn } from "lib/utils";
import { BaseArtifact, ArtifactKind } from "app-types/artifacts";
import { ArtifactComponent, Artifact } from "./artifact";
// import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";

interface WorkspaceProps {
  chatContent: React.ReactNode;
  artifacts: BaseArtifact[];
  artifactDefinitions: Record<ArtifactKind, Artifact<any, any>>;
  activeArtifactId?: string;
  onArtifactSelect?: (artifactId: string) => void;
  onArtifactClose?: (artifactId: string) => void;
  onArtifactUpdate?: (artifactId: string, updates: Partial<BaseArtifact>) => void;
  onArtifactSave?: (artifactId: string, content: string) => void;
  appendMessage?: (message: { role: "user" | "assistant"; content: string }) => void;
  className?: string;
}

// Artifact tab component
interface ArtifactTabProps {
  artifact: BaseArtifact;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
}

function ArtifactTab({ artifact, isActive, onSelect, onClose }: ArtifactTabProps) {
  const getArtifactIcon = (kind: ArtifactKind) => {
    switch (kind) {
      case "text":
        return <FileText className="w-3 h-3" />;
      case "code":
        return <Code className="w-3 h-3" />;
      case "charts":
        return <BarChart3 className="w-3 h-3" />;
      case "image":
        return <ImageIcon className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  return (
    <div
      className={cn(
        "flex items-center space-x-2 px-3 py-2 rounded-t-lg border-b cursor-pointer transition-colors",
        isActive
          ? "bg-background border-border"
          : "bg-muted/50 border-transparent hover:bg-muted"
      )}
      onClick={onSelect}
    >
      {getArtifactIcon(artifact.kind)}
      <span className="text-sm truncate max-w-32">{artifact.title}</span>
      {artifact.status === "streaming" && (
        <Badge variant="default" className="text-xs animate-pulse">
          •
        </Badge>
      )}
      {artifact.status === "error" && (
        <Badge variant="destructive" className="text-xs">
          !
        </Badge>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="w-4 h-4 p-0 ml-auto opacity-60 hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
}

export function Workspace({
  chatContent,
  artifacts,
  artifactDefinitions,
  activeArtifactId,
  onArtifactSelect,
  onArtifactClose,
  onArtifactUpdate,
  onArtifactSave,
  appendMessage,
  className
}: WorkspaceProps) {
  const [isWorkspaceVisible, setIsWorkspaceVisible] = useState(artifacts.length > 0);
  const [isWorkspaceMaximized, setIsWorkspaceMaximized] = useState(false);
  const [workspaceWidth, setWorkspaceWidth] = useState(50);

  // Auto-show workspace when artifacts are added
  useEffect(() => {
    if (artifacts.length > 0 && !isWorkspaceVisible) {
      setIsWorkspaceVisible(true);
    }
  }, [artifacts.length, isWorkspaceVisible]);

  // Get active artifact
  const activeArtifact = artifacts.find(a => a.id === activeArtifactId) || artifacts[0];

  // Handle artifact selection
  const handleArtifactSelect = useCallback((artifactId: string) => {
    onArtifactSelect?.(artifactId);
  }, [onArtifactSelect]);

  // Handle artifact close
  const handleArtifactClose = useCallback((artifactId: string) => {
    onArtifactClose?.(artifactId);

    // Hide workspace if no artifacts left
    if (artifacts.length === 1) {
      setIsWorkspaceVisible(false);
    }
  }, [onArtifactClose, artifacts.length]);

  // Toggle workspace visibility
  const toggleWorkspace = useCallback(() => {
    setIsWorkspaceVisible(prev => !prev);
  }, []);

  // Toggle workspace maximize
  const toggleMaximize = useCallback(() => {
    setIsWorkspaceMaximized(prev => !prev);
  }, []);

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Workspace controls */}
      {artifacts.length > 0 && (
        <div className="flex items-center justify-between p-2 border-b bg-muted/30">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleWorkspace}
              className="text-muted-foreground"
            >
              {isWorkspaceVisible ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </Button>
            <span className="text-sm text-muted-foreground">
              {artifacts.length} artifact{artifacts.length !== 1 ? "s" : ""}
            </span>
          </div>

          {isWorkspaceVisible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMaximize}
              className="text-muted-foreground"
            >
              {isWorkspaceMaximized ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {!isWorkspaceVisible || artifacts.length === 0 ? (
          // Chat only view
          <div className="h-full">
            {chatContent}
          </div>
        ) : (
          // Split view with workspace
          <ResizablePanelGroup
            direction="horizontal"
            className="h-full"
            onLayout={(sizes) => {
              if (!isWorkspaceMaximized) {
                setWorkspaceWidth(sizes[1] || 50);
              }
            }}
          >
            {/* Chat panel */}
            {!isWorkspaceMaximized && (
              <>
                <ResizablePanel defaultSize={workspaceWidth} minSize={30}>
                  <div className="h-full">
                    {chatContent}
                  </div>
                </ResizablePanel>
                <ResizableHandle />
              </>
            )}

            {/* Workspace panel */}
            <ResizablePanel
              defaultSize={isWorkspaceMaximized ? 100 : 100 - workspaceWidth}
              minSize={isWorkspaceMaximized ? 100 : 30}
            >
              <div className="h-full flex flex-col bg-background">
                {/* Artifact tabs */}
                <div className="flex items-center space-x-1 p-2 border-b bg-muted/30">
                  <div className="flex items-center space-x-1 overflow-x-auto">
                    {artifacts.map((artifact) => (
                      <ArtifactTab
                        key={artifact.id}
                        artifact={artifact}
                        isActive={artifact.id === activeArtifact?.id}
                        onSelect={() => handleArtifactSelect(artifact.id)}
                        onClose={() => handleArtifactClose(artifact.id)}
                      />
                    ))}
                  </div>
                </div>

                {/* Active artifact content */}
                <div className="flex-1 overflow-hidden">
                  <AnimatePresence mode="wait">
                    {activeArtifact && (
                      <motion.div
                        key={activeArtifact.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                      >
                        <ArtifactComponent
                          artifact={activeArtifact}
                          definition={artifactDefinitions[activeArtifact.kind]}
                          onUpdateArtifact={(updates) =>
                            onArtifactUpdate?.(activeArtifact.id, updates)
                          }
                          onSaveContent={(content) =>
                            onArtifactSave?.(activeArtifact.id, content)
                          }
                          appendMessage={appendMessage}
                          className="h-full border-0 rounded-none"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Empty state */}
                  {!activeArtifact && (
                    <div className="h-full flex items-center justify-center">
                      <Card className="w-80">
                        <CardHeader>
                          <CardTitle className="text-center">No Artifacts</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-center text-muted-foreground">
                            Start a conversation to create interactive content like charts, code, and documents.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}

// Workspace provider for managing global workspace state
interface WorkspaceContextValue {
  artifacts: BaseArtifact[];
  activeArtifactId?: string;
  addArtifact: (artifact: BaseArtifact) => void;
  updateArtifact: (id: string, updates: Partial<BaseArtifact>) => void;
  removeArtifact: (id: string) => void;
  setActiveArtifact: (id: string) => void;
}

import { createContext, useContext } from "react";

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [artifacts, setArtifacts] = useState<BaseArtifact[]>([]);
  const [activeArtifactId, setActiveArtifactId] = useState<string>();

  const addArtifact = useCallback((artifact: BaseArtifact) => {
    setArtifacts(prev => [...prev, artifact]);
    setActiveArtifactId(artifact.id);
  }, []);

  const updateArtifact = useCallback((id: string, updates: Partial<BaseArtifact>) => {
    setArtifacts(prev =>
      prev.map(artifact =>
        artifact.id === id ? { ...artifact, ...updates } : artifact
      )
    );
  }, []);

  const removeArtifact = useCallback((id: string) => {
    setArtifacts(prev => prev.filter(artifact => artifact.id !== id));
    setActiveArtifactId(prev => prev === id ? undefined : prev);
  }, []);

  const setActiveArtifact = useCallback((id: string) => {
    setActiveArtifactId(id);
  }, []);

  const value: WorkspaceContextValue = {
    artifacts,
    activeArtifactId,
    addArtifact,
    updateArtifact,
    removeArtifact,
    setActiveArtifact
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
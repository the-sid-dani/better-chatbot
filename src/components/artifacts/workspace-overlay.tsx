"use client";

import { useArtifactsStore } from "lib/artifacts-store";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { Badge } from "ui/badge";
import {
  X,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  FileText,
  Code,
  Image as ImageIcon,
} from "lucide-react";
import { ArtifactComponent } from "./artifact";
import { getArtifactDefinition } from "./registry";
import { cn } from "lib/utils";
import { ArtifactKind } from "app-types/artifacts";

// Simple workspace overlay that appears when artifacts are created
export function WorkspaceOverlay() {
  const {
    artifacts,
    activeArtifactId,
    isWorkspaceVisible,
    setActiveArtifact,
    removeArtifact,
    updateArtifact,
  } = useArtifactsStore();

  const [isMaximized, setIsMaximized] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  // If no artifacts or workspace is hidden, don't render
  if (!isWorkspaceVisible || artifacts.length === 0) {
    return null;
  }

  const activeArtifact =
    artifacts.find((a) => a.id === activeArtifactId) ||
    artifacts[currentTab] ||
    artifacts[0];

  const getArtifactIcon = (kind: ArtifactKind) => {
    switch (kind) {
      case "text":
        return <FileText className="w-4 h-4" />;
      case "code":
        return <Code className="w-4 h-4" />;
      case "charts":
        return <BarChart3 className="w-4 h-4" />;
      case "image":
        return <ImageIcon className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const nextTab = () => {
    setCurrentTab((prev) => (prev + 1) % artifacts.length);
    setActiveArtifact(artifacts[(currentTab + 1) % artifacts.length].id);
  };

  const prevTab = () => {
    const newTab = currentTab > 0 ? currentTab - 1 : artifacts.length - 1;
    setCurrentTab(newTab);
    setActiveArtifact(artifacts[newTab].id);
  };

  const closeCurrentArtifact = () => {
    if (activeArtifact) {
      removeArtifact(activeArtifact.id);
      // If this was the last artifact, workspace will auto-hide
      if (artifacts.length > 1) {
        const nextIndex = currentTab >= artifacts.length - 1 ? 0 : currentTab;
        setCurrentTab(nextIndex);
        setActiveArtifact(artifacts[nextIndex].id);
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed right-0 top-0 h-full z-50 shadow-2xl",
          isMaximized ? "w-full" : "w-[50vw] min-w-[400px] max-w-[800px]",
        )}
      >
        <Card className="h-full rounded-none border-l border-t-0 border-r-0 border-b-0">
          {/* Header */}
          <CardHeader className="border-b p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getArtifactIcon(activeArtifact?.kind || "charts")}
                <CardTitle className="text-sm truncate">
                  {activeArtifact?.title || "Artifact"}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {activeArtifact?.kind}
                </Badge>
                {artifacts.length > 1 && (
                  <Badge variant="outline" className="text-xs">
                    {currentTab + 1} of {artifacts.length}
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-1">
                {/* Navigation for multiple artifacts */}
                {artifacts.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={prevTab}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={nextTab}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </>
                )}

                {/* Controls */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="h-7 w-7 p-0"
                >
                  {isMaximized ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeCurrentArtifact}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Content */}
          <CardContent className="p-0 flex-1 overflow-hidden">
            {activeArtifact && (
              <div className="h-full">
                <ArtifactComponent
                  artifact={activeArtifact}
                  definition={getArtifactDefinition(activeArtifact.kind)!}
                  onUpdateArtifact={(updates) =>
                    updateArtifact(activeArtifact.id, updates)
                  }
                  onSaveContent={(content) =>
                    updateArtifact(activeArtifact.id, { content })
                  }
                  className="h-full border-0 rounded-none"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

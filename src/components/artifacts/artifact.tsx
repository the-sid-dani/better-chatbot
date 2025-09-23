"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  BaseArtifact,
  ArtifactKind,
  ArtifactStreamPart,
  ArtifactAction,
  ArtifactToolbarAction,
  ArtifactContentProps,
  ArtifactActionContext
} from "app-types/artifacts";
import { Card, CardContent, CardHeader } from "ui/card";
import { Button } from "ui/button";
import { Separator } from "ui/separator";
import { Badge } from "ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "ui/dropdown-menu";
import {
  Download,
  MoreHorizontal,
  Copy,
  RefreshCw
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { cn } from "lib/utils";
import { toast } from "sonner";

// Artifact class following Vercel Chat SDK pattern
export class Artifact<
  TKind extends ArtifactKind = ArtifactKind,
  TMetadata = Record<string, any>
> {
  constructor(
    private config: ArtifactConfig<TKind, TMetadata>
  ) {}

  get kind() {
    return this.config.kind;
  }

  get description() {
    return this.config.description;
  }

  async initialize(context: ArtifactInitContext): Promise<void> {
    if (this.config.initialize) {
      await this.config.initialize(context);
    }
  }

  handleStreamPart(context: ArtifactStreamContext<TMetadata>): void {
    if (this.config.onStreamPart) {
      this.config.onStreamPart(context);
    }
  }

  renderContent(props: ArtifactContentProps): React.ReactNode {
    return this.config.content(props as any);
  }

  getActions(): ArtifactAction[] {
    return this.config.actions || [];
  }

  getToolbarActions(): ArtifactToolbarAction[] {
    return this.config.toolbar || [];
  }
}

// Configuration interfaces
interface ArtifactConfig<TKind extends ArtifactKind, TMetadata> {
  kind: TKind;
  description: string;
  initialize?: (context: ArtifactInitContext) => Promise<void>;
  onStreamPart?: (context: ArtifactStreamContext<TMetadata>) => void;
  content: (props: ArtifactContentProps) => React.ReactNode;
  actions?: ArtifactAction[];
  toolbar?: ArtifactToolbarAction[];
}

interface ArtifactInitContext {
  documentId: string;
  setMetadata: (metadata: any) => void;
}

interface ArtifactStreamContext<TMetadata> {
  streamPart: ArtifactStreamPart;
  setMetadata: (updater: (metadata: TMetadata) => TMetadata) => void;
  setArtifact: (updater: (artifact: BaseArtifact) => BaseArtifact) => void;
}

// Main artifact component props
interface ArtifactComponentProps {
  artifact: BaseArtifact;
  definition: Artifact<any, any>;
  onUpdateArtifact?: (updates: Partial<BaseArtifact>) => void;
  onSaveContent?: (content: string) => void;
  appendMessage?: (message: { role: "user" | "assistant"; content: string }) => void;
  className?: string;
  mode?: "view" | "edit" | "diff";
}

// Main artifact component
export function ArtifactComponent({
  artifact,
  definition,
  onUpdateArtifact,
  onSaveContent,
  appendMessage,
  className,
  mode = "view"
}: ArtifactComponentProps) {
  const [currentArtifact, setCurrentArtifact] = useState<BaseArtifact>(artifact);
  const [metadata] = useState<any>({});
  const [currentVersionIndex] = useState(0);
  const [isLoading] = useState(false);

  // Update artifact when prop changes
  useEffect(() => {
    setCurrentArtifact(artifact);
  }, [artifact]);

  // Action context for toolbar and actions
  const actionContext: ArtifactActionContext = useMemo(() => ({
    artifact: currentArtifact,
    appendMessage: appendMessage || (() => {}),
    updateArtifact: (updates) => {
      setCurrentArtifact(prev => ({ ...prev, ...updates }));
      onUpdateArtifact?.(updates);
    },
  }), [currentArtifact, appendMessage, onUpdateArtifact]);

  // Handle streaming updates (commented for now)
  // const handleStreamPart = useCallback((streamPart: ArtifactStreamPart) => {
  //   definition.handleStreamPart({
  //     streamPart,
  //     setMetadata: (updater) => setMetadata(prev => updater(prev)),
  //     setArtifact: (updater) => setCurrentArtifact(prev => updater(prev))
  //   });
  // }, [definition]);

  // Content props for the artifact
  const contentProps: ArtifactContentProps = {
    artifact: currentArtifact,
    mode,
    status: currentArtifact.status,
    content: currentArtifact.content,
    isCurrentVersion: true,
    currentVersionIndex,
    onSaveContent: onSaveContent || (() => {}),
    getDocumentContentById: (_versionIndex) => currentArtifact.content,
    isLoading,
    metadata
  };

  // Default actions
  const defaultActions: ArtifactToolbarAction[] = [
    {
      icon: <Copy className="w-4 h-4" />,
      description: "Copy to clipboard",
      onClick: () => {
        navigator.clipboard.writeText(currentArtifact.content);
        toast.success("Copied to clipboard");
      }
    },
    {
      icon: <Download className="w-4 h-4" />,
      description: "Download",
      onClick: () => {
        const blob = new Blob([currentArtifact.content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${currentArtifact.title}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    {
      icon: <RefreshCw className="w-4 h-4" />,
      description: "Regenerate",
      onClick: () => {
        actionContext.appendMessage({
          role: "user",
          content: `Regenerate the ${currentArtifact.kind} artifact "${currentArtifact.title}"`
        });
      }
    }
  ];

  const allToolbarActions = [
    ...defaultActions,
    ...definition.getToolbarActions()
  ];

  const allActions = definition.getActions();

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      {/* Header with title and controls */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold">{currentArtifact.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {currentArtifact.kind}
          </Badge>
          {currentArtifact.status === "streaming" && (
            <Badge variant="default" className="text-xs animate-pulse">
              Generating...
            </Badge>
          )}
          {currentArtifact.status === "error" && (
            <Badge variant="destructive" className="text-xs">
              Error
            </Badge>
          )}
        </div>

        {/* Toolbar actions */}
        <div className="flex items-center space-x-1">
          {allToolbarActions.slice(0, 3).map((action, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => action.onClick(actionContext)}
                  disabled={action.disabled}
                >
                  {action.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{action.description}</TooltipContent>
            </Tooltip>
          ))}

          {/* More actions dropdown */}
          {(allToolbarActions.length > 3 || allActions.length > 0) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Additional toolbar actions */}
                {allToolbarActions.slice(3).map((action, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => action.onClick(actionContext)}
                    disabled={action.disabled}
                  >
                    {action.icon}
                    <span className="ml-2">{action.description}</span>
                  </DropdownMenuItem>
                ))}

                {allToolbarActions.length > 3 && allActions.length > 0 && (
                  <Separator />
                )}

                {/* Additional actions */}
                {allActions.map((action, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => action.onClick(actionContext)}
                  >
                    {action.icon}
                    <span className="ml-2">{action.description}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      {/* Content area */}
      <CardContent className="flex-1 overflow-hidden">
        <div className="h-full">
          {definition.renderContent(contentProps)}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper hook for managing artifacts
export function useArtifact(artifact: BaseArtifact) {
  const [currentArtifact, setCurrentArtifact] = useState(artifact);
  const [versions] = useState<any[]>([]);

  const updateArtifact = useCallback((updates: Partial<BaseArtifact>) => {
    setCurrentArtifact(prev => ({ ...prev, ...updates }));
  }, []);

  const saveContent = useCallback(async (content: string) => {
    // This would typically call the API to save the content
    setCurrentArtifact(prev => ({ ...prev, content }));
  }, []);

  return {
    artifact: currentArtifact,
    versions,
    updateArtifact,
    saveContent
  };
}
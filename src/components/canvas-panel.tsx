"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as React from "react";
import { Button } from "ui/button";
import { Badge } from "ui/badge";
import {
  X,
  Minimize2,
  BarChart3,
  FileText,
  Code,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart } from "./tool-invocation/bar-chart";
import { LineChart } from "./tool-invocation/line-chart";
import { PieChart } from "./tool-invocation/pie-chart";
import { AreaChart } from "./tool-invocation/area-chart";
import { ScatterChart } from "./tool-invocation/scatter-chart";
import { RadarChart } from "./tool-invocation/radar-chart";
import { FunnelChart } from "./tool-invocation/funnel-chart";
import { TreemapChart } from "./tool-invocation/treemap-chart";
import { SankeyChart } from "./tool-invocation/sankey-chart";
import { RadialBarChart } from "./tool-invocation/radial-bar-chart";
import { ComposedChart } from "./tool-invocation/composed-chart";
import { GeographicChart } from "./tool-invocation/geographic-chart";
import { GaugeChart } from "./tool-invocation/gauge-chart";

interface CanvasArtifact {
  id: string;
  type: "chart" | "dashboard" | "code" | "text" | "image" | "data";
  title: string;
  canvasName?: string;
  data?: any;
  content?: string;
  status?: "loading" | "completed" | "error";
  metadata?: {
    chartType?: string;
    dataPoints?: number;
    charts?: number;
    lastUpdated?: string;
  };
}

interface CanvasPanelProps {
  isVisible: boolean;
  onClose: () => void;
  artifacts: CanvasArtifact[];
  activeArtifactId?: string;
  onArtifactSelect?: (id: string) => void;
  canvasName?: string;
  isIntegrated?: boolean;
}

// Loading placeholder component
function LoadingPlaceholder({ artifact }: { artifact: CanvasArtifact }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="animate-spin">
          <BarChart3 className="w-8 h-8 mx-auto text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Creating {artifact.type}...</p>
          <p className="text-xs text-muted-foreground">{artifact.title}</p>
        </div>
        <div className="flex space-x-1 justify-center">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    </div>
  );
}

// Chart renderer component
function ChartRenderer({ artifact }: { artifact: CanvasArtifact }) {
  if (artifact.status === "loading") {
    return <LoadingPlaceholder artifact={artifact} />;
  }

  if (!artifact.data) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No chart data available</p>
        </div>
      </div>
    );
  }

  const { chartType, title, data, description, yAxisLabel } = artifact.data;

  const chartProps = {
    title: title || artifact.title,
    data: data || [],
    description,
    yAxisLabel,
  };

  // Add sizing wrapper for all charts
  const chartContent = (() => {
    switch (chartType) {
      case "bar":
        return <BarChart {...chartProps} />;
      case "line":
        return <LineChart {...chartProps} />;
      case "pie":
        // Transform data for pie chart
        const pieData =
          data?.map((point: any) => ({
            label: point.xAxisLabel,
            value: point.series[0]?.value || 0,
          })) || [];
        return (
          <PieChart
            title={chartProps.title}
            data={pieData}
            description={description}
          />
        );
      case "area":
        return <AreaChart {...chartProps} />;
      case "scatter":
        return <ScatterChart {...chartProps} />;
      case "radar":
        return <RadarChart {...chartProps} />;
      case "funnel":
        return <FunnelChart {...chartProps} />;
      case "treemap":
        return <TreemapChart {...chartProps} />;
      case "sankey":
        return <SankeyChart {...chartProps} />;
      case "radial-bar":
      case "radialbar":
        return <RadialBarChart {...chartProps} />;
      case "composed":
        return <ComposedChart {...chartProps} />;
      case "geographic":
      case "geo":
        return <GeographicChart {...chartProps} />;
      case "gauge":
        return <GaugeChart {...chartProps} />;
      default:
        // Fallback to bar chart for unknown types
        console.warn(
          `Unknown chart type: ${chartType}, falling back to bar chart`,
        );
        return <BarChart {...chartProps} />;
    }
  })();

  return <div className="h-full w-full flex flex-col">{chartContent}</div>;
}

// Empty state component
function CanvasEmptyState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-4 max-w-sm">
        <div className="mx-auto w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-2">Canvas Ready</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Artifacts like charts, documents, and visualizations will appear
            here when generated by AI.
          </p>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Try asking for:</p>
          <div className="space-y-1">
            <p>• &ldquo;Create a chart showing...&rdquo;</p>
            <p>• &ldquo;Generate a document about...&rdquo;</p>
            <p>• &ldquo;Visualize the data...&rdquo;</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Error Boundary for Canvas Panel
class CanvasPanelErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      "💥 Canvas Error Boundary: Canvas crashed:",
      error,
      errorInfo,
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <div className="text-destructive">
              <BarChart3 className="w-12 h-12 mx-auto mb-4" />
              <h3 className="font-semibold text-lg">Canvas Error</h3>
              <p className="text-sm text-muted-foreground">
                The Canvas workspace encountered an error and needs to be
                reloaded.
              </p>
            </div>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
              size="sm"
            >
              Reload Canvas
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main Canvas Panel Component
export function CanvasPanel({
  isVisible,
  onClose,
  artifacts,
  activeArtifactId,
  onArtifactSelect: _onArtifactSelect,
  canvasName = "Canvas",
  isIntegrated = false,
}: CanvasPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const renderCountRef = useRef(0);

  // Track render count for debugging
  renderCountRef.current += 1;
  const debugPrefix = "🎭 CanvasPanel Debug:";

  console.log(
    `${debugPrefix} Render #${renderCountRef.current} - isVisible:`,
    isVisible,
    "artifacts:",
    artifacts.length,
    "activeArtifactId:",
    activeArtifactId,
  );

  if (!isVisible) {
    console.log("❌ CanvasPanel Debug: Not rendering - isVisible is false");
    return null;
  }

  console.log("✅ CanvasPanel Debug: Rendering canvas panel");

  // Use different styling for integrated vs floating - FIXED with proper max-height for scrolling
  const containerClasses = isIntegrated
    ? "max-h-screen bg-background border-l border-border overflow-y-auto"
    : "fixed right-0 top-0 max-h-screen w-[45vw] min-w-[500px] max-w-[700px] z-50 bg-background border-l border-border shadow-2xl overflow-y-auto";

  const content = (
    <div className={containerClasses}>
      <div className="h-full flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center space-x-2">
            <h2 className="font-semibold text-lg">{canvasName}</h2>
            {artifacts.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {artifacts.length}
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-1">
            {!isIntegrated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 p-0"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log("🚪 Canvas Debug: Close button clicked");
                onClose();
              }}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Clean minimal separator */}
        {artifacts.length > 0 && !isMinimized && (
          <div className="border-b border-border/10"></div>
        )}

        {/* Content Area - Canvas Panel Scrolling with Quality Charts */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {isMinimized ? (
            <div className="p-4 text-center text-muted-foreground">
              <p className="text-sm">Canvas minimized</p>
            </div>
          ) : artifacts.length > 0 ? (
            <div
              className="p-4 pb-8"
              style={{
                minHeight: `${Math.ceil(artifacts.length / 2) * 450 + 200}px`,
              }}
            >
              {/* Canvas Grid - Balanced approach for scrolling + chart quality */}
              <div
                className={cn(
                  "grid gap-6 grid-cols-2",
                  // Fixed 2-column horizontal layout
                  artifacts.length === 1 && "grid-cols-1",
                  artifacts.length === 2 && "grid-cols-2",
                  artifacts.length === 3 && "grid-cols-2",
                  artifacts.length >= 4 && "grid-cols-2",
                )}
              >
                {artifacts.map((artifact, _index) => (
                  <div
                    key={`chart-${artifact.id}`}
                    className="bg-card/30 border border-border/20 rounded-2xl overflow-hidden min-h-[400px] flex flex-col"
                  >
                    {artifact.status === "loading" ? (
                      <LoadingPlaceholder artifact={artifact} />
                    ) : artifact.type === "chart" ? (
                      <ChartRenderer artifact={artifact} />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <CanvasEmptyState />
          )}
        </div>
      </div>
    </div>
  );

  // Return with smooth animation for Canvas opening - wrapped in error boundary
  if (isIntegrated) {
    return (
      <CanvasPanelErrorBoundary>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 25,
            duration: 0.3,
          }}
        >
          {content}
        </motion.div>
      </CanvasPanelErrorBoundary>
    );
  }

  return (
    <CanvasPanelErrorBoundary>
      <AnimatePresence>
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {content}
        </motion.div>
      </AnimatePresence>
    </CanvasPanelErrorBoundary>
  );
}

// Simple Canvas naming - uses AI-provided canvas names

// Export simple canvas hook for managing canvas state
export function useCanvas() {
  const [isVisible, setIsVisible] = useState(false);
  const [artifacts, setArtifacts] = useState<CanvasArtifact[]>([]);
  const [activeArtifactId, setActiveArtifactId] = useState<string>();
  const [canvasName, setCanvasName] = useState<string>("Canvas");
  const [userManuallyClosed, setUserManuallyClosed] = useState(false);

  // Debug state management with detailed logging
  const debugPrefix = "🎭 useCanvas Debug:";
  const isMountedRef = useRef(true);
  const stateVersionRef = useRef(0);

  // Debug function for state changes
  const debugLog = useCallback(
    (action: string, data?: any) => {
      const version = ++stateVersionRef.current;
      console.log(`${debugPrefix} [v${version}] ${action}`, {
        isVisible,
        artifactCount: artifacts.length,
        activeArtifactId,
        userManuallyClosed,
        isMounted: isMountedRef.current,
        ...data,
      });
    },
    [isVisible, artifacts.length, activeArtifactId, userManuallyClosed],
  );

  // Track memory usage for debugging
  const memoryTracker = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      window.performance &&
      window.performance.memory
    ) {
      const memory = window.performance.memory;
      console.log(`${debugPrefix} Memory Usage:`, {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + "MB",
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + "MB",
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + "MB",
      });
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    debugLog("Canvas hook mounted");

    return () => {
      isMountedRef.current = false;
      debugLog("Canvas hook unmounting - cleanup initiated");
    };
  }, []);

  // Update canvas name when artifacts change - with safety checks
  useEffect(() => {
    if (!isMountedRef.current) {
      debugLog("Skipping canvas name update - component unmounted");
      return;
    }

    debugLog("Updating canvas name", { artifactCount: artifacts.length });

    if (artifacts.length > 0) {
      // Use canvas name from first artifact (all charts in same canvas should have same name)
      const firstArtifactCanvasName = (artifacts[0] as any)?.canvasName;
      if (firstArtifactCanvasName && firstArtifactCanvasName !== canvasName) {
        debugLog("Canvas name changed", {
          from: canvasName,
          to: firstArtifactCanvasName,
        });
        setCanvasName(firstArtifactCanvasName);
      }
    } else if (canvasName !== "Canvas") {
      debugLog("Resetting canvas name to default");
      setCanvasName("Canvas");
    }
  }, [artifacts, canvasName, debugLog]);

  const addArtifact = useCallback(
    (artifact: CanvasArtifact) => {
      if (!isMountedRef.current) {
        debugLog("Attempted to add artifact after unmount - ignoring", {
          artifactId: artifact.id,
        });
        return;
      }

      debugLog("Adding artifact", {
        artifactId: artifact.id,
        title: artifact.title,
        type: artifact.type,
      });
      memoryTracker();

      setArtifacts((prev) => {
        const existing = prev.find((a) => a.id === artifact.id);
        if (existing) {
          debugLog("Updating existing artifact", { artifactId: artifact.id });
          // Update existing artifact
          return prev.map((a) =>
            a.id === artifact.id ? { ...a, ...artifact } : a,
          );
        } else {
          debugLog("Adding new artifact", {
            artifactId: artifact.id,
            newTotal: prev.length + 1,
          });
          // Add new artifact
          return [...prev, artifact];
        }
      });

      setActiveArtifactId(artifact.id);

      // Prevent Canvas flickering by ensuring it stays visible
      if (!isVisible) {
        debugLog("Auto-opening Canvas for new artifact", {
          artifactId: artifact.id,
        });
        setIsVisible(true);
      }
    },
    [isVisible, debugLog, memoryTracker],
  );

  const addLoadingArtifact = useCallback(
    (artifact: Omit<CanvasArtifact, "status">) => {
      if (!isMountedRef.current) {
        debugLog("Attempted to add loading artifact after unmount - ignoring", {
          artifactId: artifact.id,
        });
        return;
      }

      debugLog("Adding loading artifact", {
        artifactId: artifact.id,
        title: artifact.title,
      });
      const loadingArtifact = { ...artifact, status: "loading" as const };
      addArtifact(loadingArtifact);
    },
    [addArtifact, debugLog],
  );

  const updateArtifact = useCallback(
    (id: string, updates: Partial<CanvasArtifact>) => {
      if (!isMountedRef.current) {
        debugLog("Attempted to update artifact after unmount - ignoring", {
          artifactId: id,
        });
        return;
      }

      debugLog("Updating artifact", {
        artifactId: id,
        updates: Object.keys(updates),
      });
      setArtifacts((prev) => {
        const artifactExists = prev.find((a) => a.id === id);
        if (!artifactExists) {
          debugLog("Warning: Attempted to update non-existent artifact", {
            artifactId: id,
          });
          return prev;
        }
        return prev.map((artifact) =>
          artifact.id === id ? { ...artifact, ...updates } : artifact,
        );
      });
    },
    [debugLog],
  );

  const removeArtifact = useCallback(
    (id: string) => {
      if (!isMountedRef.current) {
        debugLog("Attempted to remove artifact after unmount - ignoring", {
          artifactId: id,
        });
        return;
      }

      debugLog("Removing artifact", { artifactId: id });
      setArtifacts((prev) => {
        const artifactExists = prev.find((a) => a.id === id);
        if (!artifactExists) {
          debugLog("Warning: Attempted to remove non-existent artifact", {
            artifactId: id,
          });
          return prev;
        }

        const filtered = prev.filter((a) => a.id !== id);
        debugLog("Artifacts after removal", {
          remainingCount: filtered.length,
        });

        if (filtered.length === 0) {
          debugLog("Last artifact removed - hiding canvas");
          // Use setTimeout to prevent race conditions
          setTimeout(() => {
            if (isMountedRef.current) {
              setIsVisible(false);
            }
          }, 100);
        }
        return filtered;
      });
    },
    [debugLog],
  );

  const closeCanvas = useCallback(() => {
    if (!isMountedRef.current) {
      debugLog("Attempted to close canvas after unmount - ignoring");
      return;
    }

    debugLog("User manually closed Canvas");
    setIsVisible(false);
    setUserManuallyClosed(true);
  }, [debugLog]);

  const showCanvas = useCallback(() => {
    if (!isMountedRef.current) {
      debugLog("Attempted to show canvas after unmount - ignoring");
      return;
    }

    debugLog("Opening Canvas", {
      previouslyVisible: isVisible,
      userHadClosed: userManuallyClosed,
    });
    setIsVisible(true);
    setUserManuallyClosed(false); // Reset manual close flag when programmatically opened
  }, [isVisible, userManuallyClosed, debugLog]);

  // Listen for show canvas events - with proper cleanup and error handling
  useEffect(() => {
    const handleShow = (event: Event) => {
      try {
        if (!isMountedRef.current) {
          debugLog("Canvas show event received after unmount - ignoring");
          return;
        }

        debugLog("User clicked 'Open Canvas' button", {
          eventType: event.type,
        });

        // Check if we have artifacts to show
        setArtifacts((prev) => {
          if (prev.length > 0) {
            debugLog("Opening Canvas - artifacts available", {
              count: prev.length,
            });
            setIsVisible(true);
            setUserManuallyClosed(false);
          } else {
            debugLog(
              "Warning: Open Canvas button clicked but no artifacts available",
            );
          }
          return prev; // Don't change artifacts
        });
      } catch (error) {
        debugLog("Error handling canvas show event", { error });
        console.error(`${debugPrefix} Error in canvas show handler:`, error);
      }
    };

    // Add error boundary for event listener
    const safeHandleShow = (event: Event) => {
      try {
        handleShow(event);
      } catch (error) {
        console.error(
          `${debugPrefix} Critical error in canvas show handler:`,
          error,
        );
      }
    };

    debugLog("Registering canvas:show event listener");
    window.addEventListener("canvas:show", safeHandleShow);

    return () => {
      debugLog("Removing canvas:show event listener");
      window.removeEventListener("canvas:show", safeHandleShow);
    };
  }, [debugLog]); // Safe dependency

  // Debug state changes with comprehensive tracking
  useEffect(() => {
    if (!isMountedRef.current) return;

    debugLog("Canvas state changed", {
      isVisible,
      artifactCount: artifacts.length,
      activeArtifactId,
      userManuallyClosed,
      canvasName,
    });

    // Track potential memory leaks
    memoryTracker();
  }, [
    isVisible,
    artifacts.length,
    activeArtifactId,
    userManuallyClosed,
    canvasName,
    debugLog,
    memoryTracker,
  ]);

  return {
    isVisible,
    artifacts,
    activeArtifactId,
    canvasName,
    userManuallyClosed,
    addArtifact,
    addLoadingArtifact,
    updateArtifact,
    removeArtifact,
    closeCanvas,
    showCanvas,
    setActiveArtifactId,
  };
}

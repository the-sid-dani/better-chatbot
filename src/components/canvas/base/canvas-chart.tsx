"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "ui/card";
import { Badge } from "ui/badge";
import { Button } from "ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "ui/dropdown-menu";
import {
  MoreHorizontal,
  Download,
  Maximize2,
  Settings,
  RefreshCw
} from "lucide-react";
import { cn } from "lib/utils";

interface CanvasChartProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  height?: string | number;
  className?: string;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  legend?: {
    items: Array<{
      label: string;
      color: string;
      type?: "solid" | "dashed" | "dotted";
    }>;
  };
  onExport?: (format: "png" | "svg" | "json") => void;
  onMaximize?: () => void;
  onRefresh?: () => void;
  metadata?: {
    dataPoints?: number;
    lastUpdated?: string;
    chartType?: string;
  };
}

export function CanvasChart({
  title,
  description,
  children,
  isLoading = false,
  height = "20rem",
  className,
  badge,
  legend,
  onExport,
  onMaximize,
  onRefresh,
  metadata
}: CanvasChartProps) {
  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 bg-muted animate-pulse rounded w-32"></div>
              {description && <div className="h-4 bg-muted animate-pulse rounded w-48"></div>}
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="bg-muted animate-pulse rounded"
            style={{ height }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <CardTitle className="text-base truncate">{title}</CardTitle>
              {badge && (
                <Badge variant={badge.variant || "secondary"} className="text-xs">
                  {badge.text}
                </Badge>
              )}
            </div>

            {description && (
              <CardDescription className="text-sm">
                {description}
              </CardDescription>
            )}

            {/* Chart metadata */}
            {metadata && (
              <div className="flex items-center space-x-3 mt-2 text-xs text-muted-foreground">
                {metadata.chartType && (
                  <span className="capitalize">{metadata.chartType} Chart</span>
                )}
                {metadata.dataPoints && (
                  <span>{metadata.dataPoints} points</span>
                )}
                {metadata.lastUpdated && (
                  <span>Updated {metadata.lastUpdated}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1">
            {/* Quick actions */}
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="h-7 w-7 p-0"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            )}

            {onMaximize && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMaximize}
                className="h-7 w-7 p-0"
              >
                <Maximize2 className="w-3 h-3" />
              </Button>
            )}

            {/* More actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onExport?.("png")}>
                  <Download className="w-4 h-4 mr-2" />
                  Export PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport?.("svg")}>
                  <Download className="w-4 h-4 mr-2" />
                  Export SVG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport?.("json")}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Chart Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Chart legend */}
        {legend && (
          <div className="flex items-center space-x-4 mt-3">
            {legend.items.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className={cn("w-3 h-3 rounded-sm", {
                    "border border-dashed": item.type === "dashed",
                    "border border-dotted": item.type === "dotted",
                  })}
                  style={{
                    backgroundColor: item.type === "solid" ? item.color : "transparent",
                    borderColor: item.type !== "solid" ? item.color : undefined,
                  }}
                />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0 p-0">
        <div
          className="w-full"
          style={{ height }}
        >
          <div className="h-full w-full scale-90 origin-top-left transform">
            {children}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
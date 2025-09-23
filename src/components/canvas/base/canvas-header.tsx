"use client";

import { Button } from "ui/button";
import { Badge } from "ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "ui/dropdown-menu";
import {
  Download,
  Share,
  Settings,
  MoreHorizontal,
  RefreshCw,
  Copy
} from "lucide-react";
import { cn } from "lib/utils";
import { toast } from "sonner";

interface CanvasHeaderProps {
  title: string;
  description?: string;
  isLoading?: boolean;
  actions?: React.ReactNode;
  className?: string;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  onExport?: (format: "pdf" | "png" | "json") => void;
  onRefresh?: () => void;
  onShare?: () => void;
  metadata?: {
    created?: string;
    updated?: string;
    dataPoints?: number;
    charts?: number;
  };
}

export function CanvasHeader({
  title,
  description,
  isLoading = false,
  actions,
  className,
  badge,
  onExport,
  onRefresh,
  onShare,
  metadata
}: CanvasHeaderProps) {
  const handleExport = (format: "pdf" | "png" | "json") => {
    if (onExport) {
      onExport(format);
    } else {
      toast.success(`Exporting as ${format.toUpperCase()}...`);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Canvas link copied to clipboard");
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-between p-4 border-b border-border", className)}>
        <div className="space-y-2">
          <div className="h-6 bg-muted animate-pulse rounded w-48"></div>
          {description && <div className="h-4 bg-muted animate-pulse rounded w-64"></div>}
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
          <div className="h-8 w-8 bg-muted animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-between p-4 border-b border-border bg-muted/30", className)}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <h2 className="text-lg font-semibold text-foreground truncate">
            {title}
          </h2>
          {badge && (
            <Badge variant={badge.variant || "secondary"} className="text-xs">
              {badge.text}
            </Badge>
          )}
        </div>

        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}

        {/* Metadata */}
        {metadata && (
          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
            {metadata.charts && (
              <span>{metadata.charts} chart{metadata.charts !== 1 ? 's' : ''}</span>
            )}
            {metadata.dataPoints && (
              <span>{metadata.dataPoints} data points</span>
            )}
            {metadata.updated && (
              <span>Updated {metadata.updated}</span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {/* Custom actions */}
        {actions}

        {/* Quick actions */}
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}

        {/* More actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* Export options */}
            <DropdownMenuItem onClick={() => handleExport("png")}>
              <Download className="w-4 h-4 mr-2" />
              Export as PNG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("pdf")}>
              <Download className="w-4 h-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("json")}>
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Share options */}
            <DropdownMenuItem onClick={handleCopyLink}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </DropdownMenuItem>
            {onShare && (
              <DropdownMenuItem onClick={onShare}>
                <Share className="w-4 h-4 mr-2" />
                Share Canvas
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {/* Settings */}
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Canvas Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
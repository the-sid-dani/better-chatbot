"use client";

import { cn } from "lib/utils";
import { Card } from "ui/card";

interface BaseCanvasProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export function BaseCanvas({
  children,
  className,
  title,
  description,
  isLoading = false
}: BaseCanvasProps) {
  return (
    <div className={cn("h-full flex flex-col bg-background", className)}>
      {/* Optional header */}
      {(title || description) && (
        <div className="border-b border-border p-4">
          {title && (
            <h2 className="text-lg font-semibold text-foreground mb-1">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Canvas content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="h-full min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}
"use client";

import { cn } from "lib/utils";

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
  isLoading = false,
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
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Canvas content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="h-full min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <div className="animate-pulse text-muted-foreground">
                  Loading canvas content...
                </div>
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}

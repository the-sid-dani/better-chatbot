"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "ui/card";
import { cn } from "lib/utils";

interface CanvasSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  className?: string;
  variant?: "default" | "outlined" | "minimal";
}

export function CanvasSection({
  title,
  description,
  children,
  isLoading = false,
  className,
  variant = "default"
}: CanvasSectionProps) {
  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {title && (
          <div className="h-5 bg-muted animate-pulse rounded w-32"></div>
        )}
        {description && (
          <div className="h-4 bg-muted animate-pulse rounded w-48"></div>
        )}
        <div className="space-y-2">
          <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
          <div className="h-4 bg-muted animate-pulse rounded w-5/6"></div>
          <div className="h-4 bg-muted animate-pulse rounded w-4/5"></div>
        </div>
      </div>
    );
  }

  const content = (
    <div className="space-y-2">
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-base font-semibold text-foreground">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="text-sm leading-relaxed text-foreground">
        {children}
      </div>
    </div>
  );

  if (variant === "outlined") {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-4">
          {content}
        </CardContent>
      </Card>
    );
  }

  if (variant === "minimal") {
    return (
      <div className={cn("space-y-3", className)}>
        {content}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("space-y-3 p-4 bg-muted/30 rounded-lg", className)}>
      {content}
    </div>
  );
}
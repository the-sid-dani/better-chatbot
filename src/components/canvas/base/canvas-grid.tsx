"use client";

import { cn } from "lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "ui/card";
import { Badge } from "ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export type GridLayout = "1/1" | "2/2" | "2/3" | "3/3" | "4/4";

export interface GridItem {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  chart?: React.ReactNode;
}

interface CanvasGridProps {
  items: GridItem[];
  layout?: GridLayout;
  isLoading?: boolean;
  className?: string;
  title?: string;
  description?: string;
}

const layoutConfig = {
  "1/1": { columns: 1, maxItems: 1 },
  "2/2": { columns: 2, maxItems: 4 },
  "2/3": { columns: 2, maxItems: 3 },
  "3/3": { columns: 3, maxItems: 9 },
  "4/4": { columns: 4, maxItems: 16 },
};

function GridItemCard({ item, isLoading }: { item: GridItem; isLoading: boolean }) {
  const getTrendIcon = (trend: GridItem["trend"]) => {
    if (!trend) return null;
    if (trend.isNeutral) return <Minus className="w-3 h-3" />;
    return trend.isPositive ?
      <TrendingUp className="w-3 h-3 text-green-600" /> :
      <TrendingDown className="w-3 h-3 text-red-600" />;
  };

  const getTrendColor = (trend: GridItem["trend"]) => {
    if (!trend) return "";
    if (trend.isNeutral) return "text-muted-foreground";
    return trend.isPositive ? "text-green-600" : "text-red-600";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted animate-pulse rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-muted animate-pulse rounded w-full"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {item.title}
          </CardTitle>
          {item.badge && (
            <Badge variant={item.badge.variant || "secondary"} className="text-xs">
              {item.badge.text}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold">{item.value}</div>

          {item.subtitle && (
            <p className="text-xs text-muted-foreground">
              {item.subtitle}
            </p>
          )}

          {item.trend && (
            <div className={cn("flex items-center text-xs", getTrendColor(item.trend))}>
              {getTrendIcon(item.trend)}
              <span className="ml-1">{item.trend.value}</span>
            </div>
          )}

          {item.description && (
            <CardDescription className="text-xs">
              {item.description}
            </CardDescription>
          )}

          {/* Mini chart if provided */}
          {item.chart && (
            <div className="h-16 mt-2">
              {item.chart}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function CanvasGrid({
  items,
  layout = "2/2",
  isLoading = false,
  className,
  title,
  description
}: CanvasGridProps) {
  const config = layoutConfig[layout];
  const displayItems = items.slice(0, config.maxItems);

  // Generate loading skeleton items if needed
  const skeletonItems = isLoading ?
    Array.from({ length: config.maxItems }, (_, i) => ({
      id: `skeleton-${i}`,
      title: "Loading...",
      value: "---",
    })) : [];

  const itemsToRender = isLoading ? skeletonItems : displayItems;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Grid header */}
      {(title || description) && (
        <div>
          {title && (
            <h3 className="text-lg font-semibold mb-1">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Grid layout */}
      <div
        className={cn("grid gap-4", {
          "grid-cols-1": config.columns === 1,
          "grid-cols-2": config.columns === 2,
          "grid-cols-3": config.columns === 3,
          "grid-cols-4": config.columns === 4,
        })}
      >
        {itemsToRender.map((item) => (
          <GridItemCard
            key={item.id}
            item={item}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
}
"use client";

import * as React from "react";
import {
  Lightbulb,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { JsonViewPopup } from "../json-view-popup";

// AIInsights component props interface
export interface AIInsightsProps {
  // Insights title (required)
  title: string;
  // Analysis prompt (required)
  prompt: string;
  // Canvas data analyzed (optional)
  canvasData?: any;
  // Generated insights text (required)
  insights: string;
  // Severity level (optional)
  severity?: "info" | "warning" | "success" | "error";
  // Additional description (optional)
  description?: string;
}

export function AIInsights(props: AIInsightsProps) {
  const {
    title,
    prompt,
    canvasData,
    insights,
    severity = "info",
    description,
  } = props;

  // Determine severity styling
  const severityConfig = React.useMemo(() => {
    switch (severity) {
      case "warning":
        return {
          icon: AlertCircle,
          className: "border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20",
          iconColor: "text-yellow-600 dark:text-yellow-400",
        };
      case "success":
        return {
          icon: CheckCircle,
          className: "border-green-500/50 bg-green-50 dark:bg-green-950/20",
          iconColor: "text-green-600 dark:text-green-400",
        };
      case "error":
        return {
          icon: XCircle,
          className: "border-red-500/50 bg-red-50 dark:bg-red-950/20",
          iconColor: "text-red-600 dark:text-red-400",
        };
      case "info":
      default:
        return {
          icon: Lightbulb,
          className: "border-blue-500/50 bg-blue-50 dark:bg-blue-950/20",
          iconColor: "text-blue-600 dark:text-blue-400",
        };
    }
  }, [severity]);

  const SeverityIcon = severityConfig.icon;

  return (
    <Card className="bg-card h-full flex flex-col">
      <CardHeader className="flex flex-col gap-1 relative pb-3 flex-shrink-0">
        <CardTitle className="flex items-center text-sm font-medium">
          <SeverityIcon
            className={`h-4 w-4 mr-2 ${severityConfig.iconColor}`}
          />
          {title}
          <JsonViewPopup data={props} />
        </CardTitle>
        {description && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1 pb-6 pt-0 min-h-0 flex flex-col gap-4">
        {/* Context Section */}
        {prompt && (
          <Alert className={severityConfig.className}>
            <Info className="h-4 w-4" />
            <AlertTitle className="text-sm font-semibold">
              Analysis Context
            </AlertTitle>
            <AlertDescription className="text-sm mt-1">
              {prompt}
            </AlertDescription>
          </Alert>
        )}

        {/* Insights Section */}
        <div className="flex-1 overflow-auto">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{insights}</ReactMarkdown>
          </div>
        </div>

        {/* Canvas Data Indicator */}
        {canvasData && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <span className="font-medium">Based on Canvas data</span>
            {canvasData.title && (
              <span className="ml-1">
                from &ldquo;{canvasData.title}&rdquo;
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

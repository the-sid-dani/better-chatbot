/**
 * Langfuse SDK v4 Instrumentation for Better Chatbot
 *
 * Following the exact pattern from docs/langfuse-vercel-ai-sdk.md
 * Using NodeTracerProvider instead of @vercel/otel per Langfuse recommendations
 */

import { LangfuseSpanProcessor, ShouldExportSpan } from "@langfuse/otel";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

console.log("🔍 Langfuse Instrumentation: Starting setup...");
console.log("📍 Base URL:", process.env.LANGFUSE_BASE_URL);
console.log(
  "🔑 Public Key:",
  process.env.LANGFUSE_PUBLIC_KEY ? "✓ Set" : "✗ Missing",
);
console.log(
  "🔑 Secret Key:",
  process.env.LANGFUSE_SECRET_KEY ? "✓ Set" : "✗ Missing",
);

// Optional: filter out NextJS infra spans
const shouldExportSpan: ShouldExportSpan = (span) => {
  const shouldExport = span.otelSpan.instrumentationScope.name !== "next.js";
  console.log(
    `🔍 Span filter: ${span.otelSpan.instrumentationScope.name} -> ${shouldExport ? "EXPORT" : "SKIP"}`,
  );
  return shouldExport;
};

console.log("🔧 Creating LangfuseSpanProcessor...");
export const langfuseSpanProcessor = new LangfuseSpanProcessor({
  shouldExportSpan,
});

console.log("🔧 Creating NodeTracerProvider...");
const tracerProvider = new NodeTracerProvider({
  spanProcessors: [langfuseSpanProcessor],
});

console.log("🚀 Registering TracerProvider...");
tracerProvider.register();

console.log("✅ Langfuse instrumentation setup complete!");

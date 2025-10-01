/**
 * Langfuse SDK Client
 *
 * This module initializes the Langfuse SDK client for observe() decorators.
 * IMPORTANT: Only import this in Node.js runtime (API routes), NOT in Edge runtime (middleware).
 */

import { Langfuse } from "langfuse";

export const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
  release: process.env.LANGFUSE_TRACING_RELEASE || "1.0.0",
  environment:
    process.env.LANGFUSE_TRACING_ENVIRONMENT ||
    process.env.VERCEL_ENV ||
    process.env.NODE_ENV ||
    "development",
  flushAt: 1, // Flush immediately for debugging
  flushInterval: 1000, // Flush every 1 second
});

// Ensure traces are flushed on shutdown (serverless environments)
if (typeof process !== "undefined") {
  process.on("SIGTERM", async () => {
    console.log("🔄 Flushing Langfuse SDK traces before shutdown...");
    await langfuse.flushAsync();
    console.log("✅ Langfuse SDK traces flushed successfully");
  });
}

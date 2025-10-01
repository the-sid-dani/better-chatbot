import { LangfuseSpanProcessor, ShouldExportSpan } from "@langfuse/otel";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { IS_VERCEL_ENV } from "lib/const";

// Validate required Langfuse environment variables at startup
function validateLangfuseConfig() {
  const requiredVars = {
    LANGFUSE_PUBLIC_KEY: process.env.LANGFUSE_PUBLIC_KEY,
    LANGFUSE_SECRET_KEY: process.env.LANGFUSE_SECRET_KEY,
  };

  const missing = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    const errorMessage = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  LANGFUSE CONFIGURATION ERROR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Missing required Langfuse environment variables:
${missing.map((key) => `  - ${key}`).join("\n")}

Traces will NOT be sent to Langfuse without these variables.

Required variables:
  - LANGFUSE_PUBLIC_KEY (public key from Langfuse dashboard)
  - LANGFUSE_SECRET_KEY (secret key from Langfuse dashboard)

Optional variables:
  - LANGFUSE_BASE_URL (defaults to https://cloud.langfuse.com)

To fix:
  1. Get credentials from https://cloud.langfuse.com
  2. Add them to your .env file or deployment environment
  3. Restart the application

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    console.error(errorMessage);

    // Don't throw in production to prevent deployment failures
    // Just log the warning
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "⚠️  Langfuse tracing will be DISABLED due to missing configuration",
      );
    }
  } else {
    const baseUrl =
      process.env.LANGFUSE_HOST ||
      process.env.LANGFUSE_BASE_URL ||
      "https://cloud.langfuse.com";
    const environment =
      process.env.VERCEL_ENV || process.env.NODE_ENV || "development";
    console.log(`✅ Langfuse configured: ${baseUrl} [${environment}]`);
  }
}

// Run validation
validateLangfuseConfig();

// Filter out Next.js infrastructure spans
const shouldExportSpan: ShouldExportSpan = (span) => {
  return span.otelSpan.instrumentationScope.name !== "next.js";
};

export const langfuseSpanProcessor = new LangfuseSpanProcessor({
  shouldExportSpan,
});

const tracerProvider = new NodeTracerProvider({
  spanProcessors: [langfuseSpanProcessor],
});

tracerProvider.register();

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (!IS_VERCEL_ENV) {
      // run DB migration
      const runMigrate = await import("./lib/db/pg/migrate.pg").then(
        (m) => m.runMigrate,
      );
      await runMigrate().catch((e) => {
        console.error(e);
        process.exit(1);
      });
      const initMCPManager = await import("./lib/ai/mcp/mcp-manager").then(
        (m) => m.initMCPManager,
      );
      await initMCPManager();
    }
  }
}

/**
 * Langfuse Health Check Endpoint
 *
 * This endpoint provides a simple way to verify Langfuse connectivity
 * and configuration without exposing sensitive credentials.
 */

import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check if required environment variables are set
    const hasPublicKey = !!process.env.LANGFUSE_PUBLIC_KEY;
    const hasSecretKey = !!process.env.LANGFUSE_SECRET_KEY;
    const baseUrl =
      process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com";

    // Basic connectivity check to Langfuse endpoint
    let connectivityStatus = "unknown";
    try {
      const response = await fetch(`${baseUrl}/api/public/health`, {
        method: "GET",
        headers: {
          "User-Agent": "samba-orion-health-check",
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      connectivityStatus = response.ok ? "connected" : "error";
    } catch (_error) {
      connectivityStatus = "unreachable";
    }

    const healthStatus = {
      service: "langfuse",
      status: hasPublicKey && hasSecretKey ? "configured" : "not-configured",
      connectivity: connectivityStatus,
      baseUrl: baseUrl,
      environment: process.env.LANGFUSE_TRACING_ENVIRONMENT || "not-set",
      release: process.env.LANGFUSE_TRACING_RELEASE || "not-set",
      credentials: {
        publicKey: hasPublicKey ? "✓ set" : "✗ missing",
        secretKey: hasSecretKey ? "✓ set" : "✗ missing",
      },
      timestamp: new Date().toISOString(),
    };

    // Determine overall health
    const isHealthy =
      hasPublicKey && hasSecretKey && connectivityStatus === "connected";

    return NextResponse.json(
      {
        healthy: isHealthy,
        ...healthStatus,
      },
      {
        status: isHealthy ? 200 : 503,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        healthy: false,
        service: "langfuse",
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
      },
    );
  }
}

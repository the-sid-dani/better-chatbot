import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { z } from "zod";
import {
  documentRepository,
  createArtifact,
  validateArtifactKind,
  registerDocumentHandler
} from "@/lib/artifacts/server";
import { chartsDocumentHandler } from "../../../../artifacts/charts/server";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { generateUUID } from "lib/utils";
import { safe } from "ts-safe";

// Register chart handler on module load
registerDocumentHandler(chartsDocumentHandler);

// Validation schemas
const createArtifactSchema = z.object({
  title: z.string().min(1).max(255),
  kind: z.string().refine(validateArtifactKind, "Invalid artifact kind"),
  metadata: z.record(z.string(), z.any()).optional(),
});

const listArtifactsSchema = z.object({
  kind: z.string().refine(validateArtifactKind, "Invalid artifact kind").optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// GET /api/artifacts - List user's artifacts
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const validationResult = safe(() =>
    listArtifactsSchema.parse(Object.fromEntries(searchParams))
  );

  const { kind, limit, offset } = validationResult
    .ifFail((error) => {
      throw new Error(`Invalid parameters: ${error}`);
    })
    .unwrap();

  try {
    const artifacts = await documentRepository.getUserDocuments(session.user.id, kind as any);

    // Apply pagination
    const paginatedArtifacts = artifacts.slice(offset, offset + limit);

    return NextResponse.json({
      artifacts: paginatedArtifacts,
      pagination: {
        total: artifacts.length,
        limit,
        offset,
        hasMore: offset + limit < artifacts.length,
      },
    });
  } catch (error) {
    console.error("Failed to list artifacts:", error);
    return NextResponse.json(
      { error: "Failed to retrieve artifacts" },
      { status: 500 }
    );
  }
}

// POST /api/artifacts - Create new artifact with streaming
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const validationResult = safe(() => createArtifactSchema.parse(body));

  const { title, kind, metadata } = validationResult
    .ifFail((error) => {
      throw new Error(`Invalid request body: ${error}`);
    })
    .unwrap();

  // Create streaming response for artifact creation
  const stream = createUIMessageStream({
    execute: async ({ writer: dataStream }) => {
      try {
        // Create the artifact with streaming updates
        const artifact = await createArtifact(
          session.user.id,
          title,
          kind as any,
          dataStream,
          metadata
        );

        // Stream final success
        dataStream.write({
          type: "data-artifact-creation-complete",
          data: {
            id: artifact.id,
            title: artifact.title,
            kind: artifact.kind,
            content: artifact.content,
            createdAt: artifact.createdAt,
            updatedAt: artifact.updatedAt,
          },
        });

      } catch (error) {
        console.error("Failed to create artifact:", error);

        // Stream error
        dataStream.write({
          type: "error",
          errorText: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    generateId: generateUUID,
  });

  return createUIMessageStreamResponse({
    stream,
  });
}
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { z } from "zod";
import {
  documentRepository,
  updateArtifact
} from "@/lib/artifacts/server";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { generateUUID } from "lib/utils";
import { safe } from "ts-safe";

// Validation schemas
const updateArtifactSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
  description: z.string().min(1).max(1000),
  metadata: z.record(z.string(), z.any()).optional(),
});

// GET /api/artifacts/[id] - Get specific artifact
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const artifact = await documentRepository.getDocument(id, session.user.id);

    if (!artifact) {
      return NextResponse.json(
        { error: "Artifact not found" },
        { status: 404 }
      );
    }

    // Get versions for this artifact
    const versions = await documentRepository.getDocumentVersions(id);

    return NextResponse.json({
      artifact: {
        id: artifact.id,
        title: artifact.title,
        kind: artifact.kind,
        content: artifact.content,
        createdAt: artifact.createdAt,
        updatedAt: artifact.updatedAt,
        versions: versions.map(v => ({
          id: v.id,
          version: v.version,
          createdAt: v.createdAt,
          metadata: v.metadata,
        })),
      },
    });
  } catch (error) {
    console.error("Failed to get artifact:", error);
    return NextResponse.json(
      { error: "Failed to retrieve artifact" },
      { status: 500 }
    );
  }
}

// PUT /api/artifacts/[id] - Update artifact with streaming
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const validationResult = safe(() => updateArtifactSchema.parse(body));

  const { title, content, description, metadata } = validationResult
    .ifFail((error) => {
      throw new Error(`Invalid request body: ${error}`);
    })
    .unwrap();

  // Create streaming response for artifact update
  const stream = createUIMessageStream({
    execute: async ({ writer: dataStream }) => {
      try {
        // Check if artifact exists and user has access
        const existingArtifact = await documentRepository.getDocument(id, session.user.id);
        if (!existingArtifact) {
          dataStream.write({
            type: "error",
            errorText: "Artifact not found",
          });
          return;
        }

        // Update basic fields if provided
        if (title || content) {
          await documentRepository.updateDocument(id, session.user.id, {
            title,
            content,
          });
        }

        // If description is provided, use AI to update the artifact
        if (description) {
          const updatedArtifact = await updateArtifact(
            id,
            session.user.id,
            description,
            dataStream,
            metadata
          );

          // Stream final success
          dataStream.write({
            type: "data-artifact-update-complete",
            data: {
              id: updatedArtifact.id,
              title: updatedArtifact.title,
              kind: updatedArtifact.kind,
              content: updatedArtifact.content,
              createdAt: updatedArtifact.createdAt,
              updatedAt: updatedArtifact.updatedAt,
            },
          });
        } else {
          // For basic updates without AI processing
          const updatedArtifact = await documentRepository.getDocument(id, session.user.id);

          dataStream.write({
            type: "data-artifact-update-complete",
            data: {
              id: updatedArtifact!.id,
              title: updatedArtifact!.title,
              kind: updatedArtifact!.kind,
              content: updatedArtifact!.content,
              createdAt: updatedArtifact!.createdAt,
              updatedAt: updatedArtifact!.updatedAt,
            },
          });
        }

      } catch (error) {
        console.error("Failed to update artifact:", error);

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

// DELETE /api/artifacts/[id] - Delete artifact
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check if artifact exists first
    const artifact = await documentRepository.getDocument(id, session.user.id);
    if (!artifact) {
      return NextResponse.json(
        { error: "Artifact not found" },
        { status: 404 }
      );
    }

    // Delete the artifact (this will cascade to versions)
    await documentRepository.deleteDocument(id, session.user.id);

    return NextResponse.json({
      success: true,
      message: "Artifact deleted successfully"
    });
  } catch (error) {
    console.error("Failed to delete artifact:", error);
    return NextResponse.json(
      { error: "Failed to delete artifact" },
      { status: 500 }
    );
  }
}
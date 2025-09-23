import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { z } from "zod";
import { documentRepository } from "@/lib/artifacts/server";
import { safe } from "ts-safe";

// Validation schemas
const createVersionSchema = z.object({
  content: z.string().min(1),
  metadata: z.record(z.string(), z.any()).optional(),
});

// GET /api/artifacts/[id]/versions - Get artifact versions
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
    // Check if user has access to this artifact
    const artifact = await documentRepository.getDocument(id, session.user.id);
    if (!artifact) {
      return NextResponse.json(
        { error: "Artifact not found" },
        { status: 404 }
      );
    }

    // Get all versions for this artifact
    const versions = await documentRepository.getDocumentVersions(id);

    return NextResponse.json({
      versions: versions.map(version => ({
        id: version.id,
        version: version.version,
        content: version.content,
        metadata: version.metadata,
        createdAt: version.createdAt,
      })),
      total: versions.length,
    });
  } catch (error) {
    console.error("Failed to get artifact versions:", error);
    return NextResponse.json(
      { error: "Failed to retrieve versions" },
      { status: 500 }
    );
  }
}

// POST /api/artifacts/[id]/versions - Create new version
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const validationResult = safe(() => createVersionSchema.parse(body));

  const { content, metadata } = validationResult
    .ifFail((error) => {
      throw new Error(`Invalid request body: ${error}`);
    })
    .unwrap();

  try {
    // Check if user has access to this artifact
    const artifact = await documentRepository.getDocument(id, session.user.id);
    if (!artifact) {
      return NextResponse.json(
        { error: "Artifact not found" },
        { status: 404 }
      );
    }

    // Create new version
    const version = await documentRepository.createVersion(id, content, metadata);

    // Also update the main document content to match this version
    await documentRepository.updateDocument(id, session.user.id, {
      content,
    });

    return NextResponse.json({
      version: {
        id: version.id,
        version: version.version,
        content: version.content,
        metadata: version.metadata,
        createdAt: version.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create artifact version:", error);
    return NextResponse.json(
      { error: "Failed to create version" },
      { status: 500 }
    );
  }
}
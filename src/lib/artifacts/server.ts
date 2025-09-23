import "server-only";

import {
  ArtifactKind,
  DocumentHandler,
  CreateDocumentRequest,
  DocumentRepository,
  ArtifactError,
  ARTIFACT_KINDS
} from "app-types/artifacts";
import {
  DocumentSchema,
  DocumentVersionSchema,
  DocumentEntity,
  DocumentVersionEntity
} from "../db/pg/schema.pg";
import { pgDb as db } from "../db/pg/db.pg";
import { eq, and, desc } from "drizzle-orm";
import { generateUUID } from "@/lib/utils";
import { UIMessageStreamWriter } from "ai";
import { safe } from "ts-safe";
import logger from "logger";

// Document repository implementation
export class DocumentRepositoryImpl implements DocumentRepository {
  async createDocument(userId: string, data: CreateDocumentRequest): Promise<DocumentEntity> {
    const [document] = await db.insert(DocumentSchema).values({
      id: generateUUID(),
      title: data.title,
      content: data.content || "",
      kind: data.kind,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Create initial version
    if (data.content) {
      await this.createVersion(document.id, data.content, data.metadata);
    }

    return document;
  }

  async updateDocument(
    documentId: string,
    userId: string,
    data: Partial<DocumentEntity>
  ): Promise<DocumentEntity> {
    const [document] = await db
      .update(DocumentSchema)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(DocumentSchema.id, documentId), eq(DocumentSchema.userId, userId)))
      .returning();

    if (!document) {
      throw new Error(`Document ${documentId} not found or access denied`);
    }

    return document;
  }

  async deleteDocument(documentId: string, userId: string): Promise<void> {
    const result = await db
      .delete(DocumentSchema)
      .where(and(eq(DocumentSchema.id, documentId), eq(DocumentSchema.userId, userId)));

    if (result.rowCount === 0) {
      throw new Error(`Document ${documentId} not found or access denied`);
    }
  }

  async getDocument(documentId: string, userId: string): Promise<DocumentEntity | null> {
    const [document] = await db
      .select()
      .from(DocumentSchema)
      .where(and(eq(DocumentSchema.id, documentId), eq(DocumentSchema.userId, userId)))
      .limit(1);

    return document || null;
  }

  async getUserDocuments(userId: string, kind?: ArtifactKind): Promise<DocumentEntity[]> {
    if (kind) {
      return await db
        .select()
        .from(DocumentSchema)
        .where(and(eq(DocumentSchema.userId, userId), eq(DocumentSchema.kind, kind)))
        .orderBy(desc(DocumentSchema.updatedAt));
    }

    return await db
      .select()
      .from(DocumentSchema)
      .where(eq(DocumentSchema.userId, userId))
      .orderBy(desc(DocumentSchema.updatedAt));
  }

  async createVersion(
    documentId: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<DocumentVersionEntity> {
    // Get current version count to generate version number
    const existingVersions = await db
      .select()
      .from(DocumentVersionSchema)
      .where(eq(DocumentVersionSchema.documentId, documentId))
      .orderBy(desc(DocumentVersionSchema.createdAt));

    const versionNumber = `v${existingVersions.length + 1}`;

    const [version] = await db.insert(DocumentVersionSchema).values({
      id: generateUUID(),
      documentId,
      content,
      metadata,
      version: versionNumber,
      createdAt: new Date(),
    }).returning();

    return version;
  }

  async getDocumentVersions(documentId: string): Promise<DocumentVersionEntity[]> {
    return await db
      .select()
      .from(DocumentVersionSchema)
      .where(eq(DocumentVersionSchema.documentId, documentId))
      .orderBy(desc(DocumentVersionSchema.createdAt));
  }
}

// Global document repository instance
export const documentRepository = new DocumentRepositoryImpl();

// Document handler registry
const documentHandlers = new Map<ArtifactKind, DocumentHandler<any>>();

// Helper function to create document handlers
export function createDocumentHandler<TKind extends ArtifactKind>(
  handler: DocumentHandler<TKind>
): DocumentHandler<TKind> {
  return handler;
}

// Register a document handler
export function registerDocumentHandler<TKind extends ArtifactKind>(
  handler: DocumentHandler<TKind>
): void {
  documentHandlers.set(handler.kind, handler);
  logger.info(`Registered document handler for artifact kind: ${handler.kind}`);
}

// Get document handler by kind
export function getDocumentHandler<TKind extends ArtifactKind>(
  kind: TKind
): DocumentHandler<TKind> | undefined {
  return documentHandlers.get(kind) as DocumentHandler<TKind> | undefined;
}

// Get all registered handlers
export function getAllDocumentHandlers(): DocumentHandler[] {
  return Array.from(documentHandlers.values());
}

// Artifact creation helper
export async function createArtifact(
  userId: string,
  title: string,
  kind: ArtifactKind,
  dataStream: UIMessageStreamWriter,
  metadata?: Record<string, any>
): Promise<DocumentEntity> {
  return await safe(async () => {
    // Validate artifact kind
    if (!ARTIFACT_KINDS.includes(kind)) {
      throw new Error(`Invalid artifact kind: ${kind}`);
    }

    // Get the appropriate handler
    const handler = getDocumentHandler(kind);
    if (!handler) {
      throw new Error(`No handler registered for artifact kind: ${kind}`);
    }

    // Create the document in the database
    const document = await documentRepository.createDocument(userId, {
      title,
      kind,
      content: "",
      metadata,
    });

    // Stream creation status
    dataStream.write({
      type: "data-artifact-created",
      data: {
        documentId: document.id,
        title: document.title,
        kind: document.kind,
      },
    });

    // Generate content using the handler
    try {
      const content = await handler.onCreateDocument({
        title,
        dataStream,
        userId,
        metadata,
      });

      // Update document with generated content
      const updatedDocument = await documentRepository.updateDocument(document.id, userId, {
        content,
      });

      // Create a version for the generated content
      await documentRepository.createVersion(document.id, content, metadata);

      // Stream completion status
      dataStream.write({
        type: "data-artifact-complete",
        data: {
          documentId: document.id,
          content,
        },
      });

      return updatedDocument;
    } catch (error) {
      // Stream error status
      dataStream.write({
        type: "error",
        errorText: error instanceof Error ? error.message : "Unknown error",
      });

      // Clean up on error
      await documentRepository.deleteDocument(document.id, userId);
      throw error;
    }
  })
  .ifFail((error) => {
    logger.error("Failed to create artifact:", error);
    throw new ArtifactError(
      "generation",
      `Failed to create ${kind} artifact: ${error instanceof Error ? error.message : "Unknown error"}`,
      { kind, title, userId }
    );
  })
  .unwrap();
}

// Artifact update helper
export async function updateArtifact(
  documentId: string,
  userId: string,
  description: string,
  dataStream: UIMessageStreamWriter,
  metadata?: Record<string, any>
): Promise<DocumentEntity> {
  return await safe(async () => {
    // Get the existing document
    const document = await documentRepository.getDocument(documentId, userId);
    if (!document) {
      throw new Error(`Document ${documentId} not found or access denied`);
    }

    // Get the appropriate handler
    const handler = getDocumentHandler(document.kind);
    if (!handler) {
      throw new Error(`No handler registered for artifact kind: ${document.kind}`);
    }

    // Stream update status
    dataStream.write({
      type: "data-artifact-updating",
      data: {
        documentId: document.id,
        description,
      },
    });

    // Generate updated content using the handler
    try {
      const updatedContent = await handler.onUpdateDocument({
        document,
        description,
        dataStream,
        userId,
        metadata,
      });

      // Update document with new content
      const updatedDocument = await documentRepository.updateDocument(document.id, userId, {
        content: updatedContent,
      });

      // Create a new version
      await documentRepository.createVersion(document.id, updatedContent, metadata);

      // Stream completion status
      dataStream.write({
        type: "data-artifact-updated",
        data: {
          documentId: document.id,
          content: updatedContent,
        },
      });

      return updatedDocument;
    } catch (error) {
      // Stream error status
      dataStream.write({
        type: "error",
        errorText: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  })
  .ifFail((error) => {
    logger.error("Failed to update artifact:", error);
    throw new ArtifactError(
      "generation",
      `Failed to update artifact: ${error instanceof Error ? error.message : "Unknown error"}`,
      { documentId, userId, description }
    );
  })
  .unwrap();
}

// Validation helpers
export function validateArtifactKind(kind: string): kind is ArtifactKind {
  return ARTIFACT_KINDS.includes(kind as ArtifactKind);
}

export function validateDocumentAccess(document: DocumentEntity, userId: string): boolean {
  return document.userId === userId;
}

// Error handling utilities
export function createArtifactError(
  type: ArtifactError["type"],
  message: string,
  details?: Record<string, any>
): ArtifactError {
  return new ArtifactError(type, message, details);
}

export function isArtifactError(error: any): error is ArtifactError {
  return error && typeof error === "object" && "type" in error && "message" in error;
}

// Logging helpers
export function logArtifactOperation(
  operation: string,
  artifactKind: ArtifactKind,
  documentId: string,
  userId: string,
  success: boolean,
  error?: Error
): void {
  const logData = {
    operation,
    artifactKind,
    documentId,
    userId,
    success,
    error: error?.message,
  };

  if (success) {
    logger.info(`Artifact operation completed: ${operation}`, logData);
  } else {
    logger.error(`Artifact operation failed: ${operation}`, logData);
  }
}

// Export types and registry info
export const artifactKinds = ARTIFACT_KINDS;
export const registeredHandlers = () => Array.from(documentHandlers.keys());
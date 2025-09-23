import { NextRequest, NextResponse } from "next/server";
import { getEnhancedSession } from "lib/auth/server";
import { pgWorkflowRepository } from "lib/db/pg/repositories/workflow-repository.pg";
import { z } from "zod";

// Admin Workflow Update Schema
const AdminWorkflowUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  icon: z.record(z.any()).optional(),
  isPublished: z.boolean().optional(),
});

// GET /api/admin/workflows/[id] - Get specific admin workflow
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getEnhancedSession();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const workflow = await pgWorkflowRepository.selectById(params.id);

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    // Only allow access to admin-shared workflows for admin management
    if (workflow.visibility !== "admin-shared") {
      return NextResponse.json({ error: "Not an admin workflow" }, { status: 403 });
    }

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error("Error fetching admin workflow:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/workflows/[id] - Update admin workflow
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getEnhancedSession();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // First check if the workflow exists and is admin-shared
    const existingWorkflow = await pgWorkflowRepository.selectById(params.id);

    if (!existingWorkflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    if (existingWorkflow.visibility !== "admin-shared") {
      return NextResponse.json({ error: "Not an admin workflow" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = AdminWorkflowUpdateSchema.parse(body);

    // Update the workflow (ensure visibility remains admin-shared)
    const updatedWorkflow = await pgWorkflowRepository.save({
      ...existingWorkflow,
      ...validatedData,
      id: params.id,
      visibility: "admin-shared", // Ensure it stays admin-shared
      updatedAt: new Date(),
    });

    return NextResponse.json({ workflow: updatedWorkflow });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating admin workflow:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/workflows/[id] - Delete admin workflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getEnhancedSession();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // First check if the workflow exists and is admin-shared
    const existingWorkflow = await pgWorkflowRepository.selectById(params.id);

    if (!existingWorkflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    if (existingWorkflow.visibility !== "admin-shared") {
      return NextResponse.json({ error: "Not an admin workflow" }, { status: 403 });
    }

    // Delete the workflow
    await pgWorkflowRepository.delete(params.id);

    return NextResponse.json({ message: "Workflow deleted successfully" });
  } catch (error) {
    console.error("Error deleting admin workflow:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
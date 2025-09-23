import { NextRequest, NextResponse } from "next/server";
import { getEnhancedSession } from "lib/auth/server";
import { pgWorkflowRepository } from "lib/db/pg/repositories/workflow-repository.pg";
import { z } from "zod";

// Admin Workflow Creation Schema
const AdminWorkflowCreateSchema = z.object({
  name: z.string().min(1, "Workflow name is required"),
  description: z.string().optional(),
  icon: z.record(z.any()).optional(),
  version: z.string().default("0.1.0"),
});

// GET /api/admin/workflows - List all admin-shared workflows
export async function GET(request: NextRequest) {
  try {
    const session = await getEnhancedSession();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get all workflows and filter for admin-shared ones
    const allWorkflows = await pgWorkflowRepository.selectAll(session.user.id);

    // Filter to only admin-shared workflows for admin management
    const adminSharedWorkflows = allWorkflows.filter(
      (workflow) => workflow.visibility === "admin-shared"
    );

    return NextResponse.json({ workflows: adminSharedWorkflows });
  } catch (error) {
    console.error("Error fetching admin workflows:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/workflows - Create a new admin-shared workflow
export async function POST(request: NextRequest) {
  try {
    const session = await getEnhancedSession();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = AdminWorkflowCreateSchema.parse(body);

    // Create workflow with admin-shared visibility
    const workflow = await pgWorkflowRepository.save({
      ...validatedData,
      userId: session.user.id,
      visibility: "admin-shared", // Key: make it admin-shared
      isPublished: false, // Admin can publish later
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ workflow }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating admin workflow:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
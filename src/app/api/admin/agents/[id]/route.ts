import { NextRequest, NextResponse } from "next/server";
import { getEnhancedSession } from "lib/auth/server";
import { pgAgentRepository } from "lib/db/pg/repositories/agent-repository.pg";
import { z } from "zod";

// Admin Agent Update Schema
const AdminAgentUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  instructions: z.record(z.any()).optional(),
  icon: z.record(z.any()).optional(),
});

// GET /api/admin/agents/[id] - Get specific admin agent
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getEnhancedSession();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const agent = await pgAgentRepository.selectAgentById(
      params.id,
      session.user.id
    );

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Only allow access to admin-shared agents for admin management
    if (agent.visibility !== "admin-shared") {
      return NextResponse.json({ error: "Not an admin agent" }, { status: 403 });
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error("Error fetching admin agent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/agents/[id] - Update admin agent
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getEnhancedSession();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // First check if the agent exists and is admin-shared
    const existingAgent = await pgAgentRepository.selectAgentById(
      params.id,
      session.user.id
    );

    if (!existingAgent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (existingAgent.visibility !== "admin-shared") {
      return NextResponse.json({ error: "Not an admin agent" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = AdminAgentUpdateSchema.parse(body);

    // Update the agent (ensure visibility remains admin-shared)
    const updatedAgent = await pgAgentRepository.updateAgent(
      params.id,
      session.user.id,
      {
        ...validatedData,
        visibility: "admin-shared", // Ensure it stays admin-shared
      }
    );

    return NextResponse.json({ agent: updatedAgent });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating admin agent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/agents/[id] - Delete admin agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getEnhancedSession();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // First check if the agent exists and is admin-shared
    const existingAgent = await pgAgentRepository.selectAgentById(
      params.id,
      session.user.id
    );

    if (!existingAgent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (existingAgent.visibility !== "admin-shared") {
      return NextResponse.json({ error: "Not an admin agent" }, { status: 403 });
    }

    // Delete the agent
    await pgAgentRepository.deleteAgent(params.id, session.user.id);

    return NextResponse.json({ message: "Agent deleted successfully" });
  } catch (error) {
    console.error("Error deleting admin agent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
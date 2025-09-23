import { NextRequest, NextResponse } from "next/server";
import { getEnhancedSession } from "lib/auth/server";
import { pgAgentRepository } from "lib/db/pg/repositories/agent-repository.pg";
import { z } from "zod";

// Admin Agent Creation Schema
const AdminAgentCreateSchema = z.object({
  name: z.string().min(1, "Agent name is required"),
  description: z.string().optional(),
  instructions: z.record(z.any()).optional(),
  icon: z.record(z.any()).optional(),
});

// GET /api/admin/agents - List all admin-shared agents
export async function GET(request: NextRequest) {
  try {
    const session = await getEnhancedSession();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get only admin-shared agents
    const agents = await pgAgentRepository.selectAgents(
      session.user.id,
      ["all"], // Get all agents, including admin-shared
      100
    );

    // Filter to only admin-shared agents for admin management
    const adminSharedAgents = agents.filter(
      (agent) => agent.visibility === "admin-shared"
    );

    return NextResponse.json({ agents: adminSharedAgents });
  } catch (error) {
    console.error("Error fetching admin agents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/agents - Create a new admin-shared agent
export async function POST(request: NextRequest) {
  try {
    const session = await getEnhancedSession();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = AdminAgentCreateSchema.parse(body);

    // Create agent with admin-shared visibility
    const agent = await pgAgentRepository.insertAgent({
      ...validatedData,
      userId: session.user.id,
      visibility: "admin-shared", // Key: make it admin-shared
    });

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating admin agent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
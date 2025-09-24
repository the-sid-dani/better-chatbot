import { getEnhancedSession } from "@/lib/auth/server";
import { agentRepository } from "@/lib/db/pg/repositories/agent-repository.pg";
import { NextRequest } from "next/server";
import { z } from "zod";

const AgentCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.any().optional(),
  instructions: z.any().optional(),
});

export async function GET() {
  try {
    const session = await getEnhancedSession();

    if (session?.user?.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const adminAgents = await agentRepository
      .selectAgents(session.user.id, ["all"])
      .then((agents) =>
        agents.filter((agent) => agent.visibility === "admin-shared"),
      );

    return Response.json(adminAgents);
  } catch (error) {
    console.error("Error fetching admin agents:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getEnhancedSession();

    if (session?.user?.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const agentData = AgentCreateSchema.parse(body);

    // Force admin-shared visibility
    const agent = await agentRepository.insertAgent({
      ...agentData,
      userId: session.user.id,
      visibility: "admin-shared",
    });

    return Response.json(agent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.errors }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("Error creating admin agent:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

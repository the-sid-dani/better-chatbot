import { getEnhancedSession } from "@/lib/auth/server";
import { pgAgentRepository } from "@/lib/db/pg/repositories/agent-repository.pg";
import { NextRequest } from "next/server";
import { z } from "zod";

const AgentCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.any().optional(),
  visibility: z.enum(["admin-all", "admin-selective"]).optional(),
  instructions: z
    .object({
      role: z.string().optional(),
      systemPrompt: z.string().optional(),
      mentions: z.array(z.any()).optional(),
    })
    .default({
      role: "",
      systemPrompt: "",
      mentions: [],
    }),
});

export async function GET() {
  try {
    const session = await getEnhancedSession();

    if (session?.user?.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const adminAgents = await pgAgentRepository
      .selectAgents(session.user.id, ["all"])
      .then((agents) =>
        agents.filter((agent) => agent.visibility === "admin-all"),
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

    // Use visibility from UI selection, default to admin-all (modern standard)
    const agent = await pgAgentRepository.insertAgent({
      ...agentData,
      userId: session.user.id,
      visibility: agentData.visibility || "admin-all",
    });

    return Response.json(agent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.issues }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("Error creating admin agent:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

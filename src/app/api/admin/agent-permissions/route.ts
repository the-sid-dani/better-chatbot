import { getSession } from "@/lib/auth/server";
import { pgAgentPermissionRepository } from "@/lib/db/pg/repositories/agent-permission-repository.pg";
import { pgDb } from "@/lib/db/pg/db.pg";
import { UserSchema, AgentSchema } from "@/lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

const PermissionUpdateSchema = z.object({
  agentId: z.string().uuid(),
  userIds: z.array(z.string().uuid()),
  visibility: z.enum(["admin-all", "admin-selective"]),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    // Verify admin access
    const user = await pgDb
      .select({ role: UserSchema.role })
      .from(UserSchema)
      .where(eq(UserSchema.id, session.user.id))
      .limit(1);

    if (user[0]?.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");

    if (agentId) {
      // Get permissions for specific agent
      const permissions =
        await pgAgentPermissionRepository.getAgentPermissions(agentId);
      return Response.json(permissions);
    }

    // Get all users for selection
    const allUsers = await pgDb
      .select({
        id: UserSchema.id,
        name: UserSchema.name,
        email: UserSchema.email,
        role: UserSchema.role,
        image: UserSchema.image,
      })
      .from(UserSchema)
      .limit(100);

    return Response.json(allUsers);
  } catch (error) {
    console.error("Error fetching agent permissions:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    // Verify admin access
    const user = await pgDb
      .select({ role: UserSchema.role })
      .from(UserSchema)
      .where(eq(UserSchema.id, session.user.id))
      .limit(1);

    if (user[0]?.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const { agentId, userIds, visibility } = PermissionUpdateSchema.parse(body);

    // Verify admin owns the agent
    const agent = await pgDb
      .select({ userId: AgentSchema.userId })
      .from(AgentSchema)
      .where(eq(AgentSchema.id, agentId))
      .limit(1);

    if (!agent[0] || agent[0].userId !== session.user.id) {
      return new Response("Not Found", { status: 404 });
    }

    // Update agent visibility and permissions
    await pgDb.transaction(async (tx) => {
      // Update agent visibility
      await tx
        .update(AgentSchema)
        .set({
          visibility,
          updatedAt: new Date(),
        })
        .where(eq(AgentSchema.id, agentId));

      // Manage permissions based on visibility
      if (visibility === "admin-selective") {
        // Replace permissions with selected users
        await pgAgentPermissionRepository.replacePermissions(
          agentId,
          userIds,
          session.user.id,
        );
      } else if (visibility === "admin-all") {
        // Remove all specific permissions (agent available to all)
        await pgAgentPermissionRepository.bulkRevokePermissions(
          agentId,
          await pgAgentPermissionRepository.getPermittedUsers(agentId),
        );
      }
    });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.issues }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("Error updating agent permissions:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

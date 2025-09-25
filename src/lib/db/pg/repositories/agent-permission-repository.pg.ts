import { pgDb as db } from "../db.pg";
import { AgentUserPermissionSchema, UserSchema } from "../schema.pg";
import { eq, and, inArray, sql } from "drizzle-orm";
import { generateUUID } from "lib/utils";

export interface AgentPermission {
  id: string;
  agentId: string;
  userId: string;
  grantedBy: string;
  grantedAt: Date;
  permissionLevel: "use" | "edit";
  userName?: string;
  userEmail?: string;
  userImage?: string;
}

export interface AgentPermissionRepository {
  grantPermission(
    agentId: string,
    userId: string,
    grantedBy: string,
    permissionLevel?: "use" | "edit",
  ): Promise<void>;
  revokePermission(agentId: string, userId: string): Promise<void>;
  bulkGrantPermissions(
    agentId: string,
    userIds: string[],
    grantedBy: string,
    permissionLevel?: "use" | "edit",
  ): Promise<void>;
  bulkRevokePermissions(agentId: string, userIds: string[]): Promise<void>;
  replacePermissions(
    agentId: string,
    userIds: string[],
    grantedBy: string,
    permissionLevel?: "use" | "edit",
  ): Promise<void>;
  getAgentPermissions(agentId: string): Promise<AgentPermission[]>;
  getUserPermissions(userId: string): Promise<AgentPermission[]>;
  hasPermission(agentId: string, userId: string): Promise<boolean>;
  getPermittedUsers(agentId: string): Promise<string[]>;
  countPermissions(agentId: string): Promise<number>;
}

export const pgAgentPermissionRepository: AgentPermissionRepository = {
  async grantPermission(agentId, userId, grantedBy, permissionLevel = "use") {
    await db
      .insert(AgentUserPermissionSchema)
      .values({
        id: generateUUID(),
        agentId,
        userId,
        grantedBy,
        permissionLevel,
        grantedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          AgentUserPermissionSchema.agentId,
          AgentUserPermissionSchema.userId,
        ],
        set: {
          permissionLevel,
          grantedBy,
          grantedAt: new Date(),
        },
      });
  },

  async revokePermission(agentId, userId) {
    await db
      .delete(AgentUserPermissionSchema)
      .where(
        and(
          eq(AgentUserPermissionSchema.agentId, agentId),
          eq(AgentUserPermissionSchema.userId, userId),
        ),
      );
  },

  async bulkGrantPermissions(
    agentId,
    userIds,
    grantedBy,
    permissionLevel = "use",
  ) {
    if (userIds.length === 0) return;

    const values = userIds.map((userId) => ({
      id: generateUUID(),
      agentId,
      userId,
      grantedBy,
      permissionLevel,
      grantedAt: new Date(),
    }));

    await db
      .insert(AgentUserPermissionSchema)
      .values(values)
      .onConflictDoUpdate({
        target: [
          AgentUserPermissionSchema.agentId,
          AgentUserPermissionSchema.userId,
        ],
        set: {
          permissionLevel,
          grantedBy,
          grantedAt: new Date(),
        },
      });
  },

  async bulkRevokePermissions(agentId, userIds) {
    if (userIds.length === 0) return;

    await db
      .delete(AgentUserPermissionSchema)
      .where(
        and(
          eq(AgentUserPermissionSchema.agentId, agentId),
          inArray(AgentUserPermissionSchema.userId, userIds),
        ),
      );
  },

  async replacePermissions(
    agentId,
    userIds,
    grantedBy,
    permissionLevel = "use",
  ) {
    await db.transaction(async (tx) => {
      // Remove all existing permissions for this agent
      await tx
        .delete(AgentUserPermissionSchema)
        .where(eq(AgentUserPermissionSchema.agentId, agentId));

      // Add new permissions
      if (userIds.length > 0) {
        const values = userIds.map((userId) => ({
          id: generateUUID(),
          agentId,
          userId,
          grantedBy,
          permissionLevel,
          grantedAt: new Date(),
        }));

        await tx.insert(AgentUserPermissionSchema).values(values);
      }
    });
  },

  async getAgentPermissions(agentId): Promise<AgentPermission[]> {
    const results = await db
      .select({
        id: AgentUserPermissionSchema.id,
        agentId: AgentUserPermissionSchema.agentId,
        userId: AgentUserPermissionSchema.userId,
        grantedBy: AgentUserPermissionSchema.grantedBy,
        grantedAt: AgentUserPermissionSchema.grantedAt,
        permissionLevel: AgentUserPermissionSchema.permissionLevel,
        userName: UserSchema.name,
        userEmail: UserSchema.email,
        userImage: UserSchema.image,
      })
      .from(AgentUserPermissionSchema)
      .innerJoin(
        UserSchema,
        eq(AgentUserPermissionSchema.userId, UserSchema.id),
      )
      .where(eq(AgentUserPermissionSchema.agentId, agentId));

    return results.map((result) => ({
      ...result,
      userName: result.userName ?? undefined,
      userEmail: result.userEmail ?? undefined,
      userImage: result.userImage ?? undefined,
    }));
  },

  async getUserPermissions(userId): Promise<AgentPermission[]> {
    const results = await db
      .select({
        id: AgentUserPermissionSchema.id,
        agentId: AgentUserPermissionSchema.agentId,
        userId: AgentUserPermissionSchema.userId,
        grantedBy: AgentUserPermissionSchema.grantedBy,
        grantedAt: AgentUserPermissionSchema.grantedAt,
        permissionLevel: AgentUserPermissionSchema.permissionLevel,
        userName: UserSchema.name,
        userEmail: UserSchema.email,
        userImage: UserSchema.image,
      })
      .from(AgentUserPermissionSchema)
      .innerJoin(
        UserSchema,
        eq(AgentUserPermissionSchema.userId, UserSchema.id),
      )
      .where(eq(AgentUserPermissionSchema.userId, userId));

    return results.map((result) => ({
      ...result,
      userName: result.userName ?? undefined,
      userEmail: result.userEmail ?? undefined,
      userImage: result.userImage ?? undefined,
    }));
  },

  async hasPermission(agentId, userId): Promise<boolean> {
    const [result] = await db
      .select({ id: AgentUserPermissionSchema.id })
      .from(AgentUserPermissionSchema)
      .where(
        and(
          eq(AgentUserPermissionSchema.agentId, agentId),
          eq(AgentUserPermissionSchema.userId, userId),
        ),
      )
      .limit(1);

    return !!result;
  },

  async getPermittedUsers(agentId): Promise<string[]> {
    const results = await db
      .select({ userId: AgentUserPermissionSchema.userId })
      .from(AgentUserPermissionSchema)
      .where(eq(AgentUserPermissionSchema.agentId, agentId));

    return results.map((r) => r.userId);
  },

  async countPermissions(agentId): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(AgentUserPermissionSchema)
      .where(eq(AgentUserPermissionSchema.agentId, agentId));

    return result?.count || 0;
  },
};

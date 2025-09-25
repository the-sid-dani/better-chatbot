import { Agent, AgentRepository, AgentSummary } from "app-types/agent";
import { pgDb as db } from "../db.pg";
import {
  AgentSchema,
  BookmarkSchema,
  UserSchema,
  AgentUserPermissionSchema,
} from "../schema.pg";
import { and, desc, eq, ne, or, sql, exists } from "drizzle-orm";
import { generateUUID } from "lib/utils";

export const pgAgentRepository: AgentRepository = {
  async insertAgent(agent) {
    const [result] = await db
      .insert(AgentSchema)
      .values({
        id: generateUUID(),
        name: agent.name,
        description: agent.description,
        icon: agent.icon,
        userId: agent.userId,
        instructions: agent.instructions,
        visibility: agent.visibility || "private",
        status: "active", // Default status for new agents
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return {
      ...result,
      description: result.description ?? undefined,
      icon: result.icon ?? undefined,
      instructions: result.instructions ?? {},
      status: result.status ?? "active", // Default status
    };
  },

  async selectAgentById(id, userId): Promise<Agent | null> {
    const [result] = await db
      .select({
        id: AgentSchema.id,
        name: AgentSchema.name,
        description: AgentSchema.description,
        icon: AgentSchema.icon,
        userId: AgentSchema.userId,
        instructions: AgentSchema.instructions,
        visibility: AgentSchema.visibility,
        status: AgentSchema.status,
        createdAt: AgentSchema.createdAt,
        updatedAt: AgentSchema.updatedAt,
        isBookmarked: sql<boolean>`${BookmarkSchema.id} IS NOT NULL`,
      })
      .from(AgentSchema)
      .leftJoin(
        BookmarkSchema,
        and(
          eq(BookmarkSchema.itemId, AgentSchema.id),
          eq(BookmarkSchema.userId, userId),
          eq(BookmarkSchema.itemType, "agent"),
        ),
      )
      .where(
        and(
          eq(AgentSchema.id, id),
          or(
            eq(AgentSchema.userId, userId), // Own agent
            eq(AgentSchema.visibility, "public"), // Public agent
            eq(AgentSchema.visibility, "readonly"), // Readonly agent
            eq(AgentSchema.visibility, "admin-all"), // Admin shared agent
            eq(AgentSchema.visibility, "admin-all"), // Admin all agent
            // For admin-selective, check explicit permissions
            and(
              eq(AgentSchema.visibility, "admin-selective"),
              exists(
                db
                  .select({ id: AgentUserPermissionSchema.id })
                  .from(AgentUserPermissionSchema)
                  .where(
                    and(
                      eq(AgentUserPermissionSchema.agentId, AgentSchema.id),
                      eq(AgentUserPermissionSchema.userId, userId),
                    ),
                  ),
              ),
            ),
          ),
        ),
      );

    if (!result) return null;

    return {
      ...result,
      description: result.description ?? undefined,
      icon: result.icon ?? undefined,
      instructions: result.instructions ?? {},
      status: result.status ?? "active", // Default status
      isBookmarked: result.isBookmarked ?? false,
    };
  },

  async selectAgentsByUserId(userId) {
    const results = await db
      .select({
        id: AgentSchema.id,
        name: AgentSchema.name,
        description: AgentSchema.description,
        icon: AgentSchema.icon,
        userId: AgentSchema.userId,
        instructions: AgentSchema.instructions,
        visibility: AgentSchema.visibility,
        status: AgentSchema.status,
        createdAt: AgentSchema.createdAt,
        updatedAt: AgentSchema.updatedAt,
        userName: UserSchema.name,
        userAvatar: UserSchema.image,
        isBookmarked: sql<boolean>`false`,
      })
      .from(AgentSchema)
      .innerJoin(UserSchema, eq(AgentSchema.userId, UserSchema.id))
      .where(eq(AgentSchema.userId, userId))
      .orderBy(desc(AgentSchema.createdAt));

    // Map database nulls to undefined and set defaults for owned agents
    return results.map((result) => ({
      ...result,
      description: result.description ?? undefined,
      icon: result.icon ?? undefined,
      instructions: result.instructions ?? {},
      userName: result.userName ?? undefined,
      userAvatar: result.userAvatar ?? undefined,
      isBookmarked: false, // Always false for owned agents
    }));
  },

  async updateAgent(id, userId, agent) {
    const [result] = await db
      .update(AgentSchema)
      .set({
        ...agent,
        updatedAt: new Date(),
      })
      .where(
        and(
          // Only allow updates to agents owned by the user or public agents
          eq(AgentSchema.id, id),
          or(
            eq(AgentSchema.userId, userId),
            eq(AgentSchema.visibility, "public"),
          ),
        ),
      )
      .returning();

    return {
      ...result,
      description: result.description ?? undefined,
      icon: result.icon ?? undefined,
      instructions: result.instructions ?? {},
    };
  },

  async deleteAgent(id, userId) {
    await db
      .delete(AgentSchema)
      .where(and(eq(AgentSchema.id, id), eq(AgentSchema.userId, userId)));
  },

  async selectAgents(
    currentUserId,
    filters = ["all"],
    limit = 50,
  ): Promise<AgentSummary[]> {
    let orConditions: any[] = [];

    // Build OR conditions based on filters array
    for (const filter of filters) {
      if (filter === "mine") {
        orConditions.push(eq(AgentSchema.userId, currentUserId));
      } else if (filter === "shared") {
        orConditions.push(
          and(
            ne(AgentSchema.userId, currentUserId),
            or(
              eq(AgentSchema.visibility, "public"),
              eq(AgentSchema.visibility, "readonly"),
              eq(AgentSchema.visibility, "admin-all"),
              // admin-selective: check if user has explicit permission
              and(
                eq(AgentSchema.visibility, "admin-selective"),
                exists(
                  db
                    .select({ id: AgentUserPermissionSchema.id })
                    .from(AgentUserPermissionSchema)
                    .where(
                      and(
                        eq(AgentUserPermissionSchema.agentId, AgentSchema.id),
                        eq(AgentUserPermissionSchema.userId, currentUserId),
                      ),
                    ),
                ),
              ),
            ),
          ),
        );
      } else if (filter === "bookmarked") {
        orConditions.push(
          and(
            ne(AgentSchema.userId, currentUserId),
            or(
              eq(AgentSchema.visibility, "public"),
              eq(AgentSchema.visibility, "readonly"),
              eq(AgentSchema.visibility, "admin-all"),
              // admin-selective: check if user has explicit permission
              and(
                eq(AgentSchema.visibility, "admin-selective"),
                exists(
                  db
                    .select({ id: AgentUserPermissionSchema.id })
                    .from(AgentUserPermissionSchema)
                    .where(
                      and(
                        eq(AgentUserPermissionSchema.agentId, AgentSchema.id),
                        eq(AgentUserPermissionSchema.userId, currentUserId),
                      ),
                    ),
                ),
              ),
            ),
            sql`${BookmarkSchema.id} IS NOT NULL`,
          ),
        );
      } else if (filter === "all") {
        // All available agents (mine + shared) - this overrides other filters
        orConditions = [
          or(
            // My agents
            eq(AgentSchema.userId, currentUserId),
            // Shared agents
            and(
              ne(AgentSchema.userId, currentUserId),
              or(
                eq(AgentSchema.visibility, "public"),
                eq(AgentSchema.visibility, "readonly"),
                eq(AgentSchema.visibility, "admin-all"),
                eq(AgentSchema.visibility, "admin-all"),
                // admin-selective: check if user has explicit permission
                and(
                  eq(AgentSchema.visibility, "admin-selective"),
                  exists(
                    db
                      .select({ id: AgentUserPermissionSchema.id })
                      .from(AgentUserPermissionSchema)
                      .where(
                        and(
                          eq(AgentUserPermissionSchema.agentId, AgentSchema.id),
                          eq(AgentUserPermissionSchema.userId, currentUserId),
                        ),
                      ),
                  ),
                ),
              ),
            ),
          ),
        ];
        break; // "all" overrides everything else
      }
    }

    const results = await db
      .select({
        id: AgentSchema.id,
        name: AgentSchema.name,
        description: AgentSchema.description,
        icon: AgentSchema.icon,
        userId: AgentSchema.userId,
        // Exclude instructions from list queries for performance
        visibility: AgentSchema.visibility,
        status: AgentSchema.status,
        createdAt: AgentSchema.createdAt,
        updatedAt: AgentSchema.updatedAt,
        userName: UserSchema.name,
        userAvatar: UserSchema.image,
        isBookmarked: sql<boolean>`CASE WHEN ${BookmarkSchema.id} IS NOT NULL THEN true ELSE false END`,
      })
      .from(AgentSchema)
      .innerJoin(UserSchema, eq(AgentSchema.userId, UserSchema.id))
      .leftJoin(
        BookmarkSchema,
        and(
          eq(BookmarkSchema.itemId, AgentSchema.id),
          eq(BookmarkSchema.itemType, "agent"),
          eq(BookmarkSchema.userId, currentUserId),
        ),
      )
      .where(orConditions.length > 1 ? or(...orConditions) : orConditions[0])
      .orderBy(
        // My agents first, then other shared agents
        sql`CASE WHEN ${AgentSchema.userId} = ${currentUserId} THEN 0 ELSE 1 END`,
        desc(AgentSchema.createdAt),
      )
      .limit(limit);

    // Map database nulls to undefined
    return results.map((result) => ({
      ...result,
      description: result.description ?? undefined,
      icon: result.icon ?? undefined,
      status: result.status ?? "active", // Default status
      userName: result.userName ?? undefined,
      userAvatar: result.userAvatar ?? undefined,
    }));
  },

  async checkAccess(agentId, userId, destructive = false) {
    const [agent] = await db
      .select({
        visibility: AgentSchema.visibility,
        userId: AgentSchema.userId,
      })
      .from(AgentSchema)
      .where(eq(AgentSchema.id, agentId));
    if (!agent) {
      return false;
    }

    // Owner always has access
    if (userId == agent.userId) return true;

    // Handle different visibility types for non-owners
    if (!destructive) {
      // Read access for shared visibility types
      if (
        agent.visibility === "public" ||
        agent.visibility === "readonly" ||
        agent.visibility === "admin-all"
      ) {
        return true;
      }

      // For admin-selective, check explicit permissions
      if (agent.visibility === "admin-selective") {
        const [permission] = await db
          .select({ id: AgentUserPermissionSchema.id })
          .from(AgentUserPermissionSchema)
          .where(
            and(
              eq(AgentUserPermissionSchema.agentId, agentId),
              eq(AgentUserPermissionSchema.userId, userId),
            ),
          );
        return !!permission;
      }
    }

    return false;
  },
};

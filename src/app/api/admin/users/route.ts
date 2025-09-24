import { getEnhancedSession } from "@/lib/auth/server";
import { pgDb } from "@/lib/db/pg/db.pg";
import { UserSchema } from "@/lib/db/pg/schema.pg";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getEnhancedSession();

    if (session?.user?.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const users = await pgDb
      .select({
        id: UserSchema.id,
        name: UserSchema.name,
        email: UserSchema.email,
        role: UserSchema.role,
        image: UserSchema.image,
        createdAt: UserSchema.createdAt,
        updatedAt: UserSchema.updatedAt,
      })
      .from(UserSchema)
      .orderBy(desc(UserSchema.createdAt))
      .limit(100);

    return Response.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

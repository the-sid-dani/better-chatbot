import { getEnhancedSession } from "@/lib/auth/server";
import { pgDb } from "@/lib/db/pg/db.pg";
import { UserSchema } from "@/lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

const RoleUpdateSchema = z.object({
  role: z.enum(["admin", "user"]),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getEnhancedSession();

    if (session?.user?.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const { role } = RoleUpdateSchema.parse(body);

    await pgDb
      .update(UserSchema)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(UserSchema.id, params.id));

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.issues }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("Error updating user role:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

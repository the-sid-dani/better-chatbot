import { getSession } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { pgDb } from "@/lib/db/pg/db.pg";
import { UserSchema } from "@/lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  // Check user role directly without domain validation
  const user = await pgDb
    .select({
      role: UserSchema.role,
    })
    .from(UserSchema)
    .where(eq(UserSchema.id, session.user.id))
    .limit(1);

  if (user[0]?.role !== "admin") {
    redirect("/unauthorized");
  }

  // Use the same layout structure as the main chat app
  return <>{children}</>;
}

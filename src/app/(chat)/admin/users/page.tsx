import { getSession } from "@/lib/auth/server";
import { pgDb } from "@/lib/db/pg/db.pg";
import { UserSchema } from "@/lib/db/pg/schema.pg";
import { desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminUsersList } from "@/components/admin/admin-users-list";

export default async function AdminUsersPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    notFound();
  }

  // Fetch all users
  const allUsers = await pgDb
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

  // Filter users with valid roles and provide default role for null values
  const validUsers = allUsers
    .filter((user) => user.role !== null)
    .map((user) => ({
      ...user,
      role: user.role as "admin" | "user", // Safe cast since we filtered nulls
      image: user.image ?? undefined, // Convert null to undefined
    }));

  return <AdminUsersList users={validUsers} currentUserId={session.user.id} />;
}

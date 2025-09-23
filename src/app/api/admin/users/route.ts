import { NextRequest, NextResponse } from "next/server";
import { getEnhancedSession } from "lib/auth/server";
import { pgUserRepository } from "lib/db/pg/repositories/user-repository.pg";

// GET /api/admin/users - List all users with their roles
export async function GET(request: NextRequest) {
  try {
    const session = await getEnhancedSession();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get all users
    const users = await pgUserRepository.listUsers();

    // Remove sensitive information for the response
    const safeUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      // Don't expose preferences for security
    }));

    return NextResponse.json({ users: safeUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
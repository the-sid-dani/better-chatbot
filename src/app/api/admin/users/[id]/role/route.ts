import { NextRequest, NextResponse } from "next/server";
import { getEnhancedSession } from "lib/auth/server";
import { pgUserRepository } from "lib/db/pg/repositories/user-repository.pg";
import { z } from "zod";

// User Role Update Schema
const UserRoleUpdateSchema = z.object({
  role: z.enum(["user", "admin"], {
    required_error: "Role is required",
    invalid_type_error: "Role must be either 'user' or 'admin'",
  }),
});

// PUT /api/admin/users/[id]/role - Update user role
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getEnhancedSession();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Prevent admin from changing their own role
    if (session.user.id === params.id) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      );
    }

    // Check if the target user exists
    const targetUser = await pgUserRepository.findById(params.id);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = UserRoleUpdateSchema.parse(body);

    // Update the user's role
    const updatedUser = await pgUserRepository.updateRole(
      params.id,
      validatedData.role
    );

    // Return safe user data (no sensitive info)
    const safeUser = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      image: updatedUser.image,
    };

    return NextResponse.json({
      message: `User role updated to ${validatedData.role}`,
      user: safeUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
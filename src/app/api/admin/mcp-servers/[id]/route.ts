import { NextRequest, NextResponse } from "next/server";
import { getEnhancedSession } from "lib/auth/server";
import { pgMcpRepository } from "lib/db/pg/repositories/mcp-repository.pg";
import { z } from "zod";
import { MCPRemoteConfigZodSchema, MCPStdioConfigZodSchema } from "app-types/mcp";

// Admin MCP Server Update Schema
const AdminMcpServerUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  config: z.union([MCPRemoteConfigZodSchema, MCPStdioConfigZodSchema]).optional(),
});

// GET /api/admin/mcp-servers/[id] - Get specific admin MCP server
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getEnhancedSession();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const server = await pgMcpRepository.selectById(params.id);

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    // Only allow access to admin-created servers for admin management
    if (!server.adminCreated) {
      return NextResponse.json({ error: "Not an admin server" }, { status: 403 });
    }

    return NextResponse.json({ server });
  } catch (error) {
    console.error("Error fetching admin MCP server:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/mcp-servers/[id] - Update admin MCP server
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getEnhancedSession();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // First check if the server exists and is admin-created
    const existingServer = await pgMcpRepository.selectById(params.id);

    if (!existingServer) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    if (!existingServer.adminCreated) {
      return NextResponse.json({ error: "Not an admin server" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = AdminMcpServerUpdateSchema.parse(body);

    // If name is being updated, check for conflicts
    if (validatedData.name && validatedData.name !== existingServer.name) {
      const nameConflict = await pgMcpRepository.selectByServerName(
        validatedData.name
      );
      if (nameConflict && nameConflict.id !== params.id) {
        return NextResponse.json(
          { error: "Server with this name already exists" },
          { status: 409 }
        );
      }
    }

    // Update the server (ensure adminCreated remains true)
    const updatedServer = await pgMcpRepository.save({
      ...existingServer,
      ...validatedData,
      id: params.id,
      adminCreated: true, // Ensure it stays admin-created
    });

    return NextResponse.json({ server: updatedServer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating admin MCP server:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/mcp-servers/[id] - Delete admin MCP server
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getEnhancedSession();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // First check if the server exists and is admin-created
    const existingServer = await pgMcpRepository.selectById(params.id);

    if (!existingServer) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    if (!existingServer.adminCreated) {
      return NextResponse.json({ error: "Not an admin server" }, { status: 403 });
    }

    // Delete the server
    await pgMcpRepository.deleteById(params.id);

    return NextResponse.json({ message: "Server deleted successfully" });
  } catch (error) {
    console.error("Error deleting admin MCP server:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
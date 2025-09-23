import { NextRequest, NextResponse } from "next/server";
import { getEnhancedSession } from "lib/auth/server";
import { pgMcpRepository } from "lib/db/pg/repositories/mcp-repository.pg";
import { z } from "zod";
import { MCPRemoteConfigZodSchema, MCPStdioConfigZodSchema } from "app-types/mcp";

// Admin MCP Server Creation Schema
const AdminMcpServerCreateSchema = z.object({
  name: z.string().min(1, "Server name is required"),
  config: z.union([MCPRemoteConfigZodSchema, MCPStdioConfigZodSchema]),
});

// GET /api/admin/mcp-servers - List all admin-created MCP servers
export async function GET(request: NextRequest) {
  try {
    const session = await getEnhancedSession();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get all MCP servers and filter for admin-created ones
    const allServers = await pgMcpRepository.selectAll();

    // Filter to only admin-created servers for admin management
    const adminServers = allServers.filter(
      (server) => server.adminCreated === true
    );

    return NextResponse.json({ servers: adminServers });
  } catch (error) {
    console.error("Error fetching admin MCP servers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/mcp-servers - Create a new admin MCP server
export async function POST(request: NextRequest) {
  try {
    const session = await getEnhancedSession();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = AdminMcpServerCreateSchema.parse(body);

    // Check if server with same name already exists
    const existingServer = await pgMcpRepository.selectByServerName(
      validatedData.name
    );

    if (existingServer) {
      return NextResponse.json(
        { error: "Server with this name already exists" },
        { status: 409 }
      );
    }

    // Create MCP server with admin_created flag
    const server = await pgMcpRepository.save({
      ...validatedData,
      adminCreated: true, // Key: mark as admin-created
    });

    return NextResponse.json({ server }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating admin MCP server:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
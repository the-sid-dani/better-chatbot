import { getSession } from "auth/server";
import { NextResponse } from "next/server";
import { removeMcpClientAction } from "../actions";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await removeMcpClientAction(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to remove MCP server" },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { selectMcpClientAction } = await import("../actions");
    const client = await selectMcpClientAction(params.id);
    return NextResponse.json(client);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "MCP server not found" },
      { status: 404 },
    );
  }
}

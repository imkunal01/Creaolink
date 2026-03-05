import { NextRequest, NextResponse } from "next/server";
import { getPool, getAuthUser } from "@/lib/db";

// ── PATCH /api/projects/:id/status — Update project status ──
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Only client/admin can update status
    if (user.role !== "client" && user.role !== "admin") {
      return NextResponse.json({ error: "Only clients can update project status" }, { status: 403 });
    }

    const { id } = await params;
    const db = await getPool();

    // Verify membership
    const { rows: memberRows } = await db.query(
      "SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2",
      [id, user.id]
    );
    if (memberRows.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { status } = await request.json();
    if (!["active", "completed", "approved", "pending"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await db.query("UPDATE projects SET status = $1 WHERE id = $2", [status, id]);

    const { rows } = await db.query("SELECT * FROM projects WHERE id = $1", [id]);
    return NextResponse.json({ project: rows[0] });
  } catch (err) {
    console.error("Status update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getPool, getAuthUser } from "@/lib/db";
import { v4 as uuid } from "uuid";

// ── POST /api/projects/:id/feedback — Add feedback ──
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Only client can add feedback
    if (user.role !== "client" && user.role !== "admin") {
      return NextResponse.json({ error: "Only clients can add feedback" }, { status: 403 });
    }

    const { id } = await params;
    const db = await getPool();

    // Check membership
    const { rows: memberRows } = await db.query(
      "SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2",
      [id, user.id]
    );
    if (memberRows.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { type, priority, timestamp, description } = await request.json();
    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    // Get current version from project
    const { rows: projRows } = await db.query(
      "SELECT current_version_id FROM projects WHERE id = $1",
      [id]
    );
    if (projRows.length === 0 || !projRows[0].current_version_id) {
      return NextResponse.json({ error: "No active version found" }, { status: 400 });
    }

    const feedbackId = uuid();
    await db.query(
      `INSERT INTO feedback (id, project_id, version_id, created_by, type, priority, timestamp, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        feedbackId,
        id,
        projRows[0].current_version_id,
        user.id,
        type || "General",
        priority || "Medium",
        timestamp || "",
        description,
      ]
    );

    const { rows: fbRows } = await db.query("SELECT * FROM feedback WHERE id = $1", [feedbackId]);
    return NextResponse.json({ feedback: fbRows[0] }, { status: 201 });
  } catch (err) {
    console.error("Add feedback error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── GET /api/projects/:id/feedback — List feedback ──
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const db = await getPool();

    // Check membership
    const { rows: memberRows } = await db.query(
      "SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2",
      [id, user.id]
    );
    if (memberRows.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { rows: feedbackList } = await db.query(
      `SELECT f.*, u.name as creator_name, v.version_name
       FROM feedback f
       INNER JOIN users u ON u.id = f.created_by
       INNER JOIN versions v ON v.id = f.version_id
       WHERE f.project_id = $1
       ORDER BY f.created_at DESC`,
      [id]
    );

    return NextResponse.json({ feedback: feedbackList });
  } catch (err) {
    console.error("List feedback error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

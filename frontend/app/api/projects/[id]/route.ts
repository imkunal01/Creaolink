import { NextRequest, NextResponse } from "next/server";
import { getPool, getAuthUser } from "@/lib/db";

// ── GET /api/projects/:id — Project Detail ──
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

    // Get project
    const { rows: projectRows } = await db.query("SELECT * FROM projects WHERE id = $1", [id]);
    const project = projectRows[0];
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get current version
    let currentVersion = null;
    if (project.current_version_id) {
      const { rows } = await db.query("SELECT * FROM versions WHERE id = $1", [project.current_version_id]);
      currentVersion = rows[0] || null;
    }

    // Get all versions
    const { rows: versions } = await db.query(
      "SELECT * FROM versions WHERE project_id = $1 ORDER BY created_at ASC",
      [id]
    );

    // Get members with user info
    const { rows: members } = await db.query(
      `SELECT u.id, u.name, u.email, u.role
       FROM project_members pm
       INNER JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1`,
      [id]
    );

    return NextResponse.json({
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      deadline: project.deadline,
      created_by: project.created_by,
      created_at: project.created_at,
      currentVersion,
      versions,
      members,
    });
  } catch (err) {
    console.error("Get project error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

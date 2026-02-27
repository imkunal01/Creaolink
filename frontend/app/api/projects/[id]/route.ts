import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/api-auth";

// GET /api/projects/[id] — Project detail
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  // Check membership
  const membership = db
    .prepare(
      "SELECT id FROM project_members WHERE project_id = ? AND user_id = ?"
    )
    .get(id, user.id);

  if (!membership) {
    return NextResponse.json(
      { error: "You are not a member of this project" },
      { status: 403 }
    );
  }

  // Get project
  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Get current version
  const currentVersion = project.current_version_id
    ? db
        .prepare("SELECT * FROM versions WHERE id = ?")
        .get(project.current_version_id)
    : null;

  // Get all versions
  const versions = db
    .prepare(
      "SELECT * FROM versions WHERE project_id = ? ORDER BY created_at ASC"
    )
    .all(id);

  // Get members with user info
  const members = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = ?`
    )
    .all(id);

  // Get feedback
  const feedback = db
    .prepare(
      `SELECT f.*, u.name as created_by_name, u.role as created_by_role, v.version_name
       FROM feedback f
       JOIN users u ON u.id = f.created_by
       JOIN versions v ON v.id = f.version_id
       WHERE f.project_id = ?
       ORDER BY f.created_at DESC`
    )
    .all(id);

  return NextResponse.json({
    ...project,
    currentVersion,
    versions,
    members,
    feedback,
  });
}

























































































































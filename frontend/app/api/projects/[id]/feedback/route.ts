import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/api-auth";
import { v4 as uuid } from "uuid";

// POST /api/projects/[id]/feedback — Add feedback (client only)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  // Check user is client and member
  if (user.role !== "client" && user.role !== "admin") {
    return NextResponse.json(
      { error: "Only clients can add feedback" },
      { status: 403 }
    );
  }

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

  // Get current version
  const project = db
    .prepare("SELECT current_version_id FROM projects WHERE id = ?")
    .get(id) as { current_version_id: string } | undefined;

  if (!project || !project.current_version_id) {
    return NextResponse.json(
      { error: "Project has no active version" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { type, priority, timestamp, description } = body as {
    type?: string;
    priority?: string;
    timestamp?: string;
    description: string;
  };

  if (!description || !description.trim()) {
    return NextResponse.json(
      { error: "Description is required" },
      { status: 400 }
    );
  }

  const feedbackId = uuid();
  db.prepare(
    `INSERT INTO feedback (id, project_id, version_id, created_by, type, priority, timestamp, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    feedbackId,
    id,
    project.current_version_id,
    user.id,
    type || "Revision",
    priority || "Medium",
    timestamp || "",
    description.trim()
  );

  const feedback = db
    .prepare("SELECT * FROM feedback WHERE id = ?")
    .get(feedbackId);

  return NextResponse.json({ feedback }, { status: 201 });
}

// GET /api/projects/[id]/feedback — Get all feedback
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

  return NextResponse.json({ feedback });
}

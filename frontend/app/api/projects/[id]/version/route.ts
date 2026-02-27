import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/api-auth";
import { v4 as uuid } from "uuid";

// POST /api/projects/[id]/version — Create new version
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

  // Step 1 — Check membership
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

  // Optional notes from body
  let notes = "";
  try {
    const body = await req.json();
    notes = body.notes || "";
  } catch {
    // No body is fine
  }

  // Step 2 — Count existing versions
  const { count } = db
    .prepare("SELECT COUNT(*) as count FROM versions WHERE project_id = ?")
    .get(id) as { count: number };

  // Step 3 — Insert new version
  const versionId = uuid();
  const versionName = `v${count + 1}`;

  db.prepare(
    `INSERT INTO versions (id, project_id, version_name, notes) VALUES (?, ?, ?, ?)`
  ).run(versionId, id, versionName, notes);

  // Step 4 — Update project current_version_id
  db.prepare("UPDATE projects SET current_version_id = ? WHERE id = ?").run(
    versionId,
    id
  );

  // Step 5 — Return updated version list
  const versions = db
    .prepare(
      "SELECT * FROM versions WHERE project_id = ? ORDER BY created_at ASC"
    )
    .all(id);

  return NextResponse.json(
    { version: { id: versionId, version_name: versionName, notes }, versions },
    { status: 201 }
  );
}

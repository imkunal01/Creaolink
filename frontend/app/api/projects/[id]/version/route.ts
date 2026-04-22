import { NextRequest, NextResponse } from "next/server";
import { getPool, getAuthUser } from "@/lib/db";
import { v4 as uuid } from "uuid";

// ── POST /api/projects/:id/version — Create new version ──
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const db = await getPool();

    // Step 1: Check membership
    const { rows: memberRows } = await db.query(
      "SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2",
      [id, user.id]
    );
    if (memberRows.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const notes = body.notes || "";

    // Step 2: Count existing versions
    const { rows: countRows } = await db.query(
      "SELECT COUNT(*) as count FROM versions WHERE project_id = $1",
      [id]
    );
    const versionNumber = parseInt(countRows[0].count, 10) + 1;
    const versionName = `v${versionNumber}`;

    // Step 3: Insert new version
    const versionId = uuid();
    await db.query(
      "INSERT INTO versions (id, project_id, version_name, notes) VALUES ($1, $2, $3, $4)",
      [versionId, id, versionName, notes]
    );

    // Step 4: Update project current_version_id
    await db.query("UPDATE projects SET current_version_id = $1, updated_at = NOW() WHERE id = $2", [versionId, id]);

    // Step 5: Return updated version list
    const { rows: versions } = await db.query(
      "SELECT * FROM versions WHERE project_id = $1 ORDER BY created_at ASC",
      [id]
    );

    const { rows: cvRows } = await db.query("SELECT * FROM versions WHERE id = $1", [versionId]);

    return NextResponse.json({ currentVersion: cvRows[0], versions }, { status: 201 });
  } catch (err) {
    console.error("Create version error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

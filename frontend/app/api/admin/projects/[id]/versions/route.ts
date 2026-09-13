import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { requireAdmin, adminErrorResponse } from "@/lib/admin-guard";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id: projectId } = await params;
    const db = await getPool();

    // Check project and get current_version_id
    const projRes = await db.query(
      "SELECT id, title, current_version_id FROM projects WHERE id = $1",
      [projectId]
    );

    if (projRes.rows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = projRes.rows[0];

    // Fetch versions with pg_column_size for memory efficiency
    const { rows } = await db.query(
      `SELECT id,
              project_id,
              version_name,
              notes,
              created_at,
              COALESCE(pg_column_size(timeline_data), 0)::int AS payload_size_bytes,
              (timeline_data IS NOT NULL) AS has_timeline_data
       FROM versions
       WHERE project_id = $1
       ORDER BY created_at DESC`,
      [projectId]
    );

    return NextResponse.json({
      project,
      versions: rows,
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

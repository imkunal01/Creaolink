import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { requireAdmin, adminErrorResponse } from "@/lib/admin-guard";
import { logAdminAction } from "@/lib/audit";
import { invalidateProject } from "@/lib/invalidation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    await requireAdmin(request);
    const { id: projectId, versionId } = await params;
    const db = await getPool();

    const { rows } = await db.query(
      `SELECT id, project_id, version_name, notes, timeline_data, created_at
       FROM versions
       WHERE project_id = $1 AND id = $2`,
      [projectId, versionId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    return NextResponse.json({ version: rows[0] });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id: projectId, versionId } = await params;
    const db = await getPool();

    const versionRes = await db.query(
      `SELECT v.id, v.version_name, p.title AS project_title, p.created_by
       FROM versions v
       INNER JOIN projects p ON p.id = v.project_id
       WHERE v.project_id = $1 AND v.id = $2`,
      [projectId, versionId]
    );

    if (versionRes.rows.length === 0) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    const version = versionRes.rows[0];

    // Null out corrupted timeline_data without deleting the version row itself
    await db.query(
      "UPDATE versions SET timeline_data = NULL WHERE project_id = $1 AND id = $2",
      [projectId, versionId]
    );

    // Log admin audit action
    await logAdminAction({
      adminId: admin.id,
      action: "version.data_cleared",
      targetType: "version",
      targetId: versionId,
      metadata: {
        projectId,
        projectTitle: version.project_title,
        versionName: version.version_name,
      },
    });

    // Invalidate project cache
    await invalidateProject(projectId, version.created_by);

    return NextResponse.json({
      success: true,
      message: `Cleared timeline payload for version "${version.version_name}"`,
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

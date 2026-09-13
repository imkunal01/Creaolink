import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { requireAdmin, adminErrorResponse } from "@/lib/admin-guard";
import { logAdminAction } from "@/lib/audit";
import { invalidateProject } from "@/lib/invalidation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id: projectId } = await params;
    const { versionId } = await request.json();

    if (!versionId) {
      return NextResponse.json({ error: "Version ID is required" }, { status: 400 });
    }

    const db = await getPool();

    // Verify version belongs to this project to prevent cross-project injection
    const verRes = await db.query(
      `SELECT v.id, v.version_name, p.title AS project_title, p.created_by, p.current_version_id
       FROM versions v
       INNER JOIN projects p ON p.id = v.project_id
       WHERE v.project_id = $1 AND v.id = $2`,
      [projectId, versionId]
    );

    if (verRes.rows.length === 0) {
      return NextResponse.json(
        { error: "Version not found in this project" },
        { status: 404 }
      );
    }

    const { version_name, project_title, created_by, current_version_id } = verRes.rows[0];

    // Update current version
    await db.query(
      "UPDATE projects SET current_version_id = $1, updated_at = NOW() WHERE id = $2",
      [versionId, projectId]
    );

    // Log admin audit action
    await logAdminAction({
      adminId: admin.id,
      action: "project.version_rollback",
      targetType: "project",
      targetId: projectId,
      metadata: {
        projectTitle: project_title,
        previousVersionId: current_version_id,
        newVersionId: versionId,
        versionName: version_name,
      },
    });

    // Invalidate project cache
    await invalidateProject(projectId, created_by);

    return NextResponse.json({
      success: true,
      current_version_id: versionId,
      version_name,
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

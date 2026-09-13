import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { requireAdmin, adminErrorResponse } from "@/lib/admin-guard";
import { logAdminAction } from "@/lib/audit";
import { invalidateProject } from "@/lib/invalidation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id: projectId, userId: targetUserId } = await params;
    const { permission } = await request.json();

    if (!permission || !["admin", "editor", "viewer"].includes(permission)) {
      return NextResponse.json(
        { error: "Invalid permission. Allowed values: admin, editor, viewer" },
        { status: 400 }
      );
    }

    const db = await getPool();

    // Check membership
    const memRes = await db.query(
      `SELECT pm.id, pm.permission, p.title AS project_title, u.email AS user_email
       FROM project_members pm
       INNER JOIN projects p ON p.id = pm.project_id
       INNER JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1 AND pm.user_id = $2`,
      [projectId, targetUserId]
    );

    if (memRes.rows.length === 0) {
      return NextResponse.json({ error: "Project membership not found" }, { status: 404 });
    }

    const prevMem = memRes.rows[0];

    await db.query(
      "UPDATE project_members SET permission = $1 WHERE project_id = $2 AND user_id = $3",
      [permission, projectId, targetUserId]
    );

    // Log admin audit action
    await logAdminAction({
      adminId: admin.id,
      action: "project.member_permission_change",
      targetType: "project_member",
      targetId: `${projectId}:${targetUserId}`,
      metadata: {
        projectTitle: prevMem.project_title,
        targetUserEmail: prevMem.user_email,
        oldPermission: prevMem.permission,
        newPermission: permission,
      },
    });

    // Invalidate project team cache
    await invalidateProject(projectId, undefined, { team: true });

    return NextResponse.json({
      success: true,
      permission,
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

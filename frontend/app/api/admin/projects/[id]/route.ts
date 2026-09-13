import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { requireAdmin, adminErrorResponse } from "@/lib/admin-guard";
import { logAdminAction } from "@/lib/audit";
import { invalidateProject } from "@/lib/invalidation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id: projectId } = await params;
    const db = await getPool();

    // 1. Fetch project row with owner
    const projectRes = await db.query(
      `SELECT p.id,
              p.title,
              p.description,
              p.deadline,
              p.status,
              p.current_version_id,
              p.sync_code,
              p.visibility,
              p.created_at,
              p.updated_at,
              p.created_by,
              owner.name AS owner_name,
              owner.email AS owner_email,
              owner.username AS owner_username,
              COALESCE(vers.version_count, 0)::int AS version_count,
              COALESCE(fb.feedback_count, 0)::int AS feedback_count
       FROM projects p
       INNER JOIN users owner ON owner.id = p.created_by
       LEFT JOIN (
         SELECT project_id, COUNT(*) AS version_count
         FROM versions
         GROUP BY project_id
       ) vers ON vers.project_id = p.id
       LEFT JOIN (
         SELECT project_id, COUNT(*) AS feedback_count
         FROM feedback
         GROUP BY project_id
       ) fb ON fb.project_id = p.id
       WHERE p.id = $1`,
      [projectId]
    );

    if (projectRes.rows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = projectRes.rows[0];

    // 2. Fetch all members
    const membersRes = await db.query(
      `SELECT pm.id AS membership_id,
              pm.permission,
              u.id AS user_id,
              u.name,
              u.email,
              u.username,
              u.role,
              COALESCE(u.status, 'active') AS user_status,
              u.avatar_url
       FROM project_members pm
       INNER JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1
       ORDER BY pm.permission = 'admin' DESC, u.name ASC`,
      [projectId]
    );

    return NextResponse.json({
      project,
      members: membersRes.rows,
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id: projectId } = await params;
    const body = await request.json();
    const { title, description, deadline, status, visibility } = body;

    const db = await getPool();

    // Check project existence
    const existing = await db.query(
      "SELECT id, title, description, deadline, status, visibility, created_by FROM projects WHERE id = $1",
      [projectId]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const prev = existing.rows[0];
    const updates: string[] = [];
    const queryParams: unknown[] = [];
    let idx = 1;

    if (typeof title === "string" && title.trim()) {
      updates.push(`title = $${idx++}`);
      queryParams.push(title.trim());
    }

    if (typeof description === "string") {
      updates.push(`description = $${idx++}`);
      queryParams.push(description.trim());
    }

    if (deadline !== undefined) {
      updates.push(`deadline = $${idx++}`);
      queryParams.push(deadline || null);
    }

    if (status && ["active", "completed", "approved", "pending"].includes(status)) {
      updates.push(`status = $${idx++}`);
      queryParams.push(status);
    }

    if (visibility && ["public", "private", "followers-only"].includes(visibility)) {
      updates.push(`visibility = $${idx++}`);
      queryParams.push(visibility);
    }

    if (updates.length === 0) {
      return NextResponse.json({ project: prev, message: "No updates provided" });
    }

    updates.push("updated_at = NOW()");
    queryParams.push(projectId);

    const updateSql = `
      UPDATE projects
      SET ${updates.join(", ")}
      WHERE id = $${idx}
      RETURNING *
    `;

    const { rows } = await db.query(updateSql, queryParams);
    const updatedProject = rows[0];

    // Log admin update
    await logAdminAction({
      adminId: admin.id,
      action: "project.update",
      targetType: "project",
      targetId: projectId,
      metadata: {
        projectTitle: updatedProject.title,
        changedFields: body,
      },
    });

    // Invalidate Redis caches
    await invalidateProject(projectId, prev.created_by, {
      chat: true,
      feedback: true,
      team: true,
    });

    return NextResponse.json({ project: updatedProject });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id: projectId } = await params;
    const db = await getPool();

    // Check project info before deletion
    const existing = await db.query(
      "SELECT id, title, created_by FROM projects WHERE id = $1",
      [projectId]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = existing.rows[0];

    // Begin transaction for cascade deletion
    const client = await db.connect();
    try {
      await client.query("BEGIN");

      // 1. Log audit action before deletion commits
      await logAdminAction({
        adminId: admin.id,
        action: "project.delete",
        targetType: "project",
        targetId: projectId,
        metadata: {
          projectTitle: project.title,
          createdBy: project.created_by,
        },
      });

      // 2. Cascade delete dependent child records
      // Delete chat attachments
      await client.query(
        `DELETE FROM chat_attachments
         WHERE message_id IN (SELECT id FROM chat_messages WHERE project_id = $1)`,
        [projectId]
      );

      // Delete chat messages
      await client.query("DELETE FROM chat_messages WHERE project_id = $1", [projectId]);

      // Delete feedback
      await client.query("DELETE FROM feedback WHERE project_id = $1", [projectId]);

      // Delete versions
      await client.query("DELETE FROM versions WHERE project_id = $1", [projectId]);

      // Delete project members
      await client.query("DELETE FROM project_members WHERE project_id = $1", [projectId]);

      // Delete project row
      await client.query("DELETE FROM projects WHERE id = $1", [projectId]);

      await client.query("COMMIT");
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }

    // Invalidate Redis cache
    await invalidateProject(projectId, project.created_by, {
      chat: true,
      feedback: true,
      team: true,
    });

    return NextResponse.json({
      success: true,
      message: `Project "${project.title}" deleted successfully`,
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

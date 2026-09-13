import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { requireAdmin, adminErrorResponse } from "@/lib/admin-guard";
import { logAdminAction } from "@/lib/audit";
import { deleteCachedKeys } from "@/lib/cache";
import { feedbackKey } from "@/lib/invalidation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id: feedbackId } = await params;
    const { status } = await request.json();

    if (!status || !["open", "resolved"].includes(status.toLowerCase())) {
      return NextResponse.json(
        { error: "Invalid status. Allowed values: open, resolved" },
        { status: 400 }
      );
    }

    const normalizedStatus = status.toLowerCase();
    const db = await getPool();

    // Check existing feedback
    const existing = await db.query(
      `SELECT fb.id, fb.project_id, fb.status, p.title AS project_title
       FROM feedback fb
       INNER JOIN projects p ON p.id = fb.project_id
       WHERE fb.id = $1`,
      [feedbackId]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Feedback item not found" }, { status: 404 });
    }

    const item = existing.rows[0];

    await db.query("UPDATE feedback SET status = $1 WHERE id = $2", [
      normalizedStatus,
      feedbackId,
    ]);

    // Log admin audit action
    await logAdminAction({
      adminId: admin.id,
      action: "feedback.status_change",
      targetType: "feedback",
      targetId: feedbackId,
      metadata: {
        projectId: item.project_id,
        projectTitle: item.project_title,
        oldStatus: item.status,
        newStatus: normalizedStatus,
      },
    });

    // Invalidate project feedback cache
    await deleteCachedKeys([feedbackKey(item.project_id)]);

    return NextResponse.json({
      success: true,
      id: feedbackId,
      status: normalizedStatus,
    });
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
    const { id: feedbackId } = await params;
    const db = await getPool();

    const existing = await db.query(
      `SELECT fb.id, fb.project_id, fb.description, p.title AS project_title
       FROM feedback fb
       INNER JOIN projects p ON p.id = fb.project_id
       WHERE fb.id = $1`,
      [feedbackId]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Feedback item not found" }, { status: 404 });
    }

    const item = existing.rows[0];

    await db.query("DELETE FROM feedback WHERE id = $1", [feedbackId]);

    // Log admin audit action
    await logAdminAction({
      adminId: admin.id,
      action: "feedback.delete",
      targetType: "feedback",
      targetId: feedbackId,
      metadata: {
        projectId: item.project_id,
        projectTitle: item.project_title,
        snippet: item.description.slice(0, 100),
      },
    });

    // Invalidate project feedback cache
    await deleteCachedKeys([feedbackKey(item.project_id)]);

    return NextResponse.json({
      success: true,
      message: "Feedback item removed successfully",
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { requireAdmin, adminErrorResponse } from "@/lib/admin-guard";
import { logAdminAction } from "@/lib/audit";
import { deleteCachedKeys } from "@/lib/cache";
import { chatKey } from "@/lib/invalidation";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id: messageId } = await params;
    const db = await getPool();

    const existing = await db.query(
      `SELECT m.id, m.project_id, m.sender_id, m.body, p.title AS project_title, u.email AS sender_email
       FROM chat_messages m
       INNER JOIN projects p ON p.id = m.project_id
       INNER JOIN users u ON u.id = m.sender_id
       WHERE m.id = $1`,
      [messageId]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Chat message not found" }, { status: 404 });
    }

    const msg = existing.rows[0];

    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM chat_attachments WHERE message_id = $1", [messageId]);
      await client.query("DELETE FROM chat_messages WHERE id = $1", [messageId]);
      await client.query("COMMIT");
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }

    // Log admin audit action
    await logAdminAction({
      adminId: admin.id,
      action: "chat.message_delete",
      targetType: "chat_message",
      targetId: messageId,
      metadata: {
        projectId: msg.project_id,
        projectTitle: msg.project_title,
        senderEmail: msg.sender_email,
        snippet: msg.body.slice(0, 100),
      },
    });

    // Invalidate project chat cache
    await deleteCachedKeys([chatKey(msg.project_id)]);

    return NextResponse.json({
      success: true,
      message: "Chat message removed successfully",
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

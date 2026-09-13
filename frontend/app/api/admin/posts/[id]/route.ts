import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { requireAdmin, adminErrorResponse } from "@/lib/admin-guard";
import { logAdminAction } from "@/lib/audit";
import { invalidateFeed } from "@/lib/invalidation";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id: postId } = await params;
    const db = await getPool();

    const existing = await db.query(
      `SELECT p.id, p.title, p.user_id, u.email AS author_email
       FROM posts p
       INNER JOIN users u ON u.id = p.user_id
       WHERE p.id = $1`,
      [postId]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const post = existing.rows[0];

    const client = await db.connect();
    try {
      await client.query("BEGIN");
      // 1. Delete reactions
      await client.query("DELETE FROM post_reactions WHERE post_id = $1", [postId]);
      // 2. Delete comments
      await client.query("DELETE FROM post_comments WHERE post_id = $1", [postId]);
      // 3. Delete post
      await client.query("DELETE FROM posts WHERE id = $1", [postId]);
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
      action: "post.delete",
      targetType: "post",
      targetId: postId,
      metadata: {
        postTitle: post.title,
        authorId: post.user_id,
        authorEmail: post.author_email,
      },
    });

    // Invalidate author's feed cache immediately (follower feed caches will expire naturally within 90s TTL)
    await invalidateFeed(post.user_id);

    return NextResponse.json({
      success: true,
      message: `Post "${post.title}" deleted successfully`,
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

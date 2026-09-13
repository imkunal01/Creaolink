import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { requireAdmin, adminErrorResponse } from "@/lib/admin-guard";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "25", 10), 1), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const offset = (page - 1) * limit;

    const db = await getPool();

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (q) {
      conditions.push(
        `(p.title ILIKE $${paramIndex} OR p.content ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`
      );
      params.push(`%${q}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count total
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM posts p
      INNER JOIN users u ON u.id = p.user_id
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const total = countResult.rows[0]?.total || 0;

    // Fetch posts
    const dataParams = [...params, limit, offset];
    const dataQuery = `
      SELECT p.id,
             p.user_id,
             p.project_id,
             p.title,
             p.content,
             p.tags,
             p.created_at,
             u.name AS author_name,
             u.email AS author_email,
             u.username AS author_username,
             u.avatar_url AS author_avatar,
             COALESCE(r.reaction_count, 0)::int AS reaction_count,
             COALESCE(c.comment_count, 0)::int AS comment_count
      FROM posts p
      INNER JOIN users u ON u.id = p.user_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) AS reaction_count
        FROM post_reactions
        GROUP BY post_id
      ) r ON r.post_id = p.id
      LEFT JOIN (
        SELECT post_id, COUNT(*) AS comment_count
        FROM post_comments
        GROUP BY post_id
      ) c ON c.post_id = p.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const { rows } = await db.query(dataQuery, dataParams);

    return NextResponse.json({
      posts: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

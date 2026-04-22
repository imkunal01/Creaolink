import { NextRequest, NextResponse } from "next/server";
import { getPool, getAuthUser } from "@/lib/db";

async function safeRowsQuery<T>(
  queryFn: () => Promise<{ rows: T[] }>
): Promise<T[]> {
  try {
    const { rows } = await queryFn();
    return rows;
  } catch (err) {
    const code = (err as { code?: string }).code;
    // Undefined table/column/function errors should not break the feed page.
    if (code === "42P01" || code === "42703" || code === "42883") {
      return [];
    }
    throw err;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getPool();

    const activity = await safeRowsQuery(() => db.query(
      `SELECT DISTINCT p.id,
              p.title,
              p.status,
              p.created_at,
              p.updated_at,
              p.visibility,
              owner.id AS owner_id,
              owner.name AS owner_name,
              COALESCE(member_counts.member_count, 0)::int AS collaborator_count,
              COALESCE(feedback_counts.open_feedback, 0)::int AS open_feedback
       FROM projects p
       INNER JOIN users owner ON owner.id = p.created_by
       LEFT JOIN project_members pm ON pm.project_id = p.id
       LEFT JOIN (
         SELECT project_id, COUNT(*) AS member_count
         FROM project_members
         GROUP BY project_id
       ) member_counts ON member_counts.project_id = p.id
       LEFT JOIN (
         SELECT project_id, COUNT(*) FILTER (WHERE status = 'open') AS open_feedback
         FROM feedback
         GROUP BY project_id
       ) feedback_counts ON feedback_counts.project_id = p.id
       WHERE pm.user_id = $1
          OR (
            p.created_by IN (
              SELECT following_id FROM user_follows WHERE follower_id = $1
            )
            AND p.visibility IN ('public', 'followers-only')
          )
       ORDER BY p.updated_at DESC
       LIMIT 20`,
      [user.id]
    ));

    const discover = await safeRowsQuery(() => db.query(
      `SELECT p.id,
              p.title,
              p.description,
              p.status,
              p.created_at,
              p.updated_at,
              owner.id AS owner_id,
              owner.name AS owner_name,
              COUNT(pm.user_id)::int AS member_count
       FROM projects p
       INNER JOIN users owner ON owner.id = p.created_by
       LEFT JOIN project_members pm ON pm.project_id = p.id
       WHERE p.visibility = 'public'
         AND p.created_by <> $1
       GROUP BY p.id, owner.id, owner.name
       ORDER BY p.updated_at DESC
       LIMIT 18`,
      [user.id]
    ));

    const featured = await safeRowsQuery(() => db.query(
      `SELECT p.id,
              p.title,
              p.description,
              p.status,
              p.created_at,
              p.updated_at,
              owner.id AS owner_id,
              owner.name AS owner_name,
              COUNT(pm.user_id)::int AS collaborators
       FROM projects p
       INNER JOIN users owner ON owner.id = p.created_by
       LEFT JOIN project_members pm ON pm.project_id = p.id
       WHERE p.visibility IN ('public', 'followers-only')
         AND p.created_by <> $1
       GROUP BY p.id, owner.id, owner.name
       ORDER BY collaborators DESC, p.updated_at DESC
       LIMIT 6`,
      [user.id]
    ));

    const posts = await safeRowsQuery(() => db.query(
      `SELECT ps.id,
              ps.title,
              ps.content,
              ps.tags,
              ps.project_id,
              linked_project.title AS project_title,
              ps.created_at,
              author.id AS author_id,
              author.name AS author_name,
              COALESCE(reactions.reaction_count, 0)::int AS reactions,
              COALESCE(comments.comment_count, 0)::int AS comments
       FROM posts ps
       INNER JOIN users author ON author.id = ps.user_id
       LEFT JOIN projects linked_project ON linked_project.id = ps.project_id
       LEFT JOIN (
         SELECT post_id, COUNT(*) AS reaction_count
         FROM post_reactions
         GROUP BY post_id
       ) reactions ON reactions.post_id = ps.id
       LEFT JOIN (
         SELECT post_id, COUNT(*) AS comment_count
         FROM post_comments
         GROUP BY post_id
       ) comments ON comments.post_id = ps.id
       WHERE ps.user_id = $1
          OR ps.user_id IN (
            SELECT following_id FROM user_follows WHERE follower_id = $1
          )
          OR ps.project_id IN (
            SELECT project_id FROM project_members WHERE user_id = $1
          )
       ORDER BY ps.created_at DESC
       LIMIT 15`,
      [user.id]
    ));

    const network = await safeRowsQuery(() => db.query(
      `SELECT uf.following_id,
              u.name,
              u.role,
              COALESCE(project_stats.project_count, 0)::int AS project_count,
              COALESCE(follower_stats.follower_count, 0)::int AS follower_count
       FROM user_follows uf
       INNER JOIN users u ON u.id = uf.following_id
       LEFT JOIN (
         SELECT created_by, COUNT(*) AS project_count
         FROM projects
         GROUP BY created_by
       ) project_stats ON project_stats.created_by = uf.following_id
       LEFT JOIN (
         SELECT following_id, COUNT(*) AS follower_count
         FROM user_follows
         GROUP BY following_id
       ) follower_stats ON follower_stats.following_id = uf.following_id
       WHERE uf.follower_id = $1
       ORDER BY uf.created_at DESC
       LIMIT 12`,
      [user.id]
    ));

    return NextResponse.json({
      activity,
      discover,
      featured,
      posts,
      network,
    });
  } catch (err) {
    console.error("Feed fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

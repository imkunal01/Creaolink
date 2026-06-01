import { NextRequest, NextResponse } from "next/server";
import { getPool, getAuthUser } from "@/lib/db";
import { v4 as uuid } from "uuid";
import { readThroughCache, buildCacheKey, rateLimit } from "@/lib/cache";
import { invalidateFeed } from "@/lib/invalidation";
import { flags } from "@/lib/feature-flags";

// Cache key for global posts feed
function postsKey() {
  return buildCacheKey("posts-global");
}

const POSTS_TTL = 45; // seconds

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getPool();

    const posts = flags.cacheFeed
      ? await readThroughCache({
          key: postsKey(),
          ttlSeconds: POSTS_TTL,
          source: "api/posts",
          compute: async () => {
            const { rows } = await db.query(
              `SELECT p.id, p.title, p.content, p.tags, p.project_id, p.created_at,
                      u.id as author_id, u.name as author_name
               FROM posts p
               INNER JOIN users u ON u.id = p.user_id
               ORDER BY p.created_at DESC
               LIMIT 50`
            );
            return rows;
          },
        })
      : await db
          .query(
            `SELECT p.id, p.title, p.content, p.tags, p.project_id, p.created_at,
                    u.id as author_id, u.name as author_name
             FROM posts p
             INNER JOIN users u ON u.id = p.user_id
             ORDER BY p.created_at DESC
             LIMIT 50`
          )
          .then((r) => r.rows);

    const response = NextResponse.json({ posts });
    response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
    return response;
  } catch (err) {
    console.error("List posts error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate limit: 10 posts per minute per user
    const rl = await rateLimit(`posts:${user.id}`, 10, 60);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many posts — please slow down" },
        {
          status: 429,
          headers: {
            "Retry-After": String(rl.resetInSeconds),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const { title, content, tags, projectId } = await request.json();
    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const db = await getPool();
    await db.query(
      `INSERT INTO posts (id, user_id, project_id, title, content, tags)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        uuid(),
        user.id,
        projectId || null,
        String(title).slice(0, 120),
        String(content).slice(0, 10000),
        Array.isArray(tags) ? tags.slice(0, 10) : [],
      ]
    );

    // Bust author's feed + global posts list
    await Promise.all([
      invalidateFeed(user.id),
      import("@/lib/cache").then(({ deleteCachedKeys }) =>
        deleteCachedKeys([postsKey()])
      ),
    ]);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Create post error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

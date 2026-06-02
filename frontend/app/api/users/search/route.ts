import { NextRequest, NextResponse } from "next/server";
import { getPool, getAuthUser } from "@/lib/db";
import { getCachedJson, setCachedJson, buildCacheKey } from "@/lib/cache";

/**
 * GET /api/users/search?q=<query>
 *
 * Caches search results per query string in Redis (30s TTL).
 * User search doesn't change frequently — same query typed by
 * different users should return the same result.
 * Cache key excludes the calling user's ID so results are shared.
 */
export async function GET(request: NextRequest) {
  try {
    const me = await getAuthUser(request);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const query = (new URL(request.url).searchParams.get("q") || "").trim().toLowerCase();
    if (query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Cache key is per-query (shared across users — excludes me.id intentionally)
    const cacheKey = buildCacheKey("user-search", query);
    const cached = await getCachedJson<{ id: string; name: string; username: string; role: string }[]>(cacheKey);

    if (cached !== null) {
      // Still exclude the calling user from cached results
      const filtered = cached.filter((u) => u.id !== me.id);
      const response = NextResponse.json({ users: filtered });
      response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
      return response;
    }

    const db = await getPool();
    const { rows } = await db.query(
      `SELECT id, name, username, role
       FROM users
       WHERE username IS NOT NULL
         AND LOWER(username) LIKE $1
       ORDER BY CASE WHEN LOWER(username) = $2 THEN 0 ELSE 1 END, username ASC
       LIMIT 20`,
      [`${query}%`, query]
    );

    // Store all results (without filtering by me.id) so multiple users share the cache
    await setCachedJson(cacheKey, rows, 30);

    const filtered = rows.filter((u) => u.id !== me.id).slice(0, 12);
    const response = NextResponse.json({ users: filtered });
    response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
    return response;
  } catch (err) {
    console.error("User search error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

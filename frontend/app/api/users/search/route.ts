import { NextRequest, NextResponse } from "next/server";
import { getPool, getAuthUser } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const me = await getAuthUser(request);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const query = (new URL(request.url).searchParams.get("q") || "").trim().toLowerCase();
    if (query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const db = await getPool();
    const { rows } = await db.query(
      `SELECT id, name, username, role
       FROM users
       WHERE id <> $1
         AND username IS NOT NULL
         AND LOWER(username) LIKE $2
       ORDER BY CASE WHEN LOWER(username) = $3 THEN 0 ELSE 1 END, username ASC
       LIMIT 12`,
      [me.id, `${query}%`, query]
    );

    return NextResponse.json({ users: rows });
  } catch (err) {
    console.error("User search error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

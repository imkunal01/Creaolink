import { NextRequest, NextResponse } from "next/server";
import { getPool, getAuthUser } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getAuthUser(request);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const db = await getPool();

    const [{ rows: followingRows }, { rows: followerRows }] = await Promise.all([
      db.query("SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2", [me.id, id]),
      db.query("SELECT COUNT(*)::int AS count FROM user_follows WHERE following_id = $1", [id]),
    ]);

    return NextResponse.json({
      isFollowing: followingRows.length > 0,
      followers: followerRows[0]?.count ?? 0,
    });
  } catch (err) {
    console.error("Follow status error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getAuthUser(request);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (id === me.id) {
      return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
    }

    const db = await getPool();
    await db.query(
      `INSERT INTO user_follows (id, follower_id, following_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (follower_id, following_id) DO NOTHING`,
      [uuid(), me.id, id]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Follow user error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getAuthUser(request);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const db = await getPool();

    await db.query(
      "DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2",
      [me.id, id]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unfollow user error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

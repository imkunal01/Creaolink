import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";
import { query } from "@/lib/db";

// Get bookmarks for current user
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("creaolink_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);

    const result = await query(
      `
      SELECT
        b.id as bookmark_id,
        b.created_at as bookmarked_at,
        ep.id,
        p.display_name,
        ep.headline,
        ep.rating,
        ep.hourly_rate,
        ep.availability,
        ep.response_time_hours,
        ep.completed_projects,
        COALESCE(array_agg(DISTINCT s.name) FILTER (WHERE s.id IS NOT NULL), ARRAY[]::text[]) AS skills
      FROM bookmarks b
      JOIN editor_profiles ep ON ep.id = b.editor_profile_id
      JOIN profiles p ON p.user_id = ep.user_id
      LEFT JOIN editor_skills es ON es.editor_profile_id = ep.id
      LEFT JOIN skills s ON s.id = es.skill_id
      WHERE b.user_id = $1
      GROUP BY b.id, ep.id, p.display_name
      ORDER BY b.created_at DESC
      `,
      [payload.sub]
    );

    return NextResponse.json({ bookmarks: result.rows }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load bookmarks." },
      { status: 500 }
    );
  }
}

// Add a bookmark
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("creaolink_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);
    const body = await request.json();
    const editorProfileId = body.editorProfileId;

    if (!editorProfileId) {
      return NextResponse.json(
        { error: "Editor profile ID required." },
        { status: 400 }
      );
    }

    // Check if editor exists
    const editorCheck = await query(
      "SELECT id FROM editor_profiles WHERE id = $1",
      [editorProfileId]
    );

    if (editorCheck.rowCount === 0) {
      return NextResponse.json({ error: "Editor not found." }, { status: 404 });
    }

    // Insert bookmark (upsert)
    await query(
      `
      INSERT INTO bookmarks (user_id, editor_profile_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, editor_profile_id) DO NOTHING
      `,
      [payload.sub, editorProfileId]
    );

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to add bookmark." },
      { status: 500 }
    );
  }
}

// Remove a bookmark
export async function DELETE(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("creaolink_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);
    const { searchParams } = new URL(request.url);
    const editorProfileId = searchParams.get("editorProfileId");

    if (!editorProfileId) {
      return NextResponse.json(
        { error: "Editor profile ID required." },
        { status: 400 }
      );
    }

    await query(
      "DELETE FROM bookmarks WHERE user_id = $1 AND editor_profile_id = $2",
      [payload.sub, editorProfileId]
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to remove bookmark." },
      { status: 500 }
    );
  }
}

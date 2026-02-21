import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";
import { query } from "@/lib/db";

function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

// Add portfolio item
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("creaolink_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);

    if (payload.role !== "EDITOR") {
      return NextResponse.json({ error: "Must be an editor." }, { status: 403 });
    }

    const body = await request.json();
    const { title, youtubeUrl, description } = body;

    if (!title || !youtubeUrl) {
      return NextResponse.json(
        { error: "Title and YouTube URL are required." },
        { status: 400 }
      );
    }

    const youtubeId = extractYouTubeId(youtubeUrl);
    if (!youtubeId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL." },
        { status: 400 }
      );
    }

    // Get editor profile ID
    const profileResult = await query(
      "SELECT id FROM editor_profiles WHERE user_id = $1",
      [payload.sub]
    );

    if (profileResult.rowCount === 0) {
      return NextResponse.json({ error: "Editor profile not found." }, { status: 404 });
    }

    const editorProfileId = profileResult.rows[0].id;

    const result = await query(
      `
      INSERT INTO portfolio_items (editor_profile_id, title, youtube_url, youtube_id, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, title, youtube_url, youtube_id, description, created_at
      `,
      [editorProfileId, title, youtubeUrl, youtubeId, description || null]
    );

    return NextResponse.json({ item: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to add portfolio item." },
      { status: 500 }
    );
  }
}

// Delete portfolio item
export async function DELETE(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("creaolink_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);

    if (payload.role !== "EDITOR") {
      return NextResponse.json({ error: "Must be an editor." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("id");

    if (!itemId) {
      return NextResponse.json(
        { error: "Portfolio item ID required." },
        { status: 400 }
      );
    }

    // Get editor profile ID
    const profileResult = await query(
      "SELECT id FROM editor_profiles WHERE user_id = $1",
      [payload.sub]
    );

    if (profileResult.rowCount === 0) {
      return NextResponse.json({ error: "Editor profile not found." }, { status: 404 });
    }

    const editorProfileId = profileResult.rows[0].id;

    // Delete only if owned by this editor
    const result = await query(
      "DELETE FROM portfolio_items WHERE id = $1 AND editor_profile_id = $2 RETURNING id",
      [itemId, editorProfileId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Portfolio item not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete portfolio item." },
      { status: 500 }
    );
  }
}

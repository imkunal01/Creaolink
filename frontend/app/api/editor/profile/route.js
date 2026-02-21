import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";
import { query } from "@/lib/db";

// Get editor's own profile (for dashboard)
export async function GET() {
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

    const result = await query(
      `
      SELECT
        ep.id,
        ep.headline,
        ep.summary,
        ep.hourly_rate,
        ep.rating,
        ep.availability,
        ep.response_time_hours,
        ep.completed_projects,
        ep.languages,
        ep.timezone,
        ep.turnaround_days,
        ep.featured,
        p.display_name,
        p.bio,
        COALESCE(array_agg(DISTINCT jsonb_build_object('id', s.id, 'name', s.name, 'slug', s.slug)) FILTER (WHERE s.id IS NOT NULL), ARRAY[]::jsonb[]) AS skills
      FROM editor_profiles ep
      JOIN profiles p ON p.user_id = ep.user_id
      LEFT JOIN editor_skills es ON es.editor_profile_id = ep.id
      LEFT JOIN skills s ON s.id = es.skill_id
      WHERE ep.user_id = $1
      GROUP BY ep.id, p.display_name, p.bio
      `,
      [payload.sub]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ profile: null }, { status: 200 });
    }

    // Get portfolio items
    const portfolioResult = await query(
      `
      SELECT id, title, youtube_url, youtube_id, description, created_at
      FROM portfolio_items
      WHERE editor_profile_id = $1
      ORDER BY created_at DESC
      `,
      [result.rows[0].id]
    );

    return NextResponse.json(
      {
        profile: result.rows[0],
        portfolio: portfolioResult.rows,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load profile." },
      { status: 500 }
    );
  }
}

// Update editor profile
export async function PUT(request) {
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
    const {
      headline,
      summary,
      hourlyRate,
      availability,
      languages,
      timezone,
      turnaroundDays,
      displayName,
      bio,
      skillIds,
    } = body;

    // Validate availability
    if (availability && !["available", "busy", "away"].includes(availability)) {
      return NextResponse.json({ error: "Invalid availability." }, { status: 400 });
    }

    // Update profiles table
    if (displayName !== undefined || bio !== undefined) {
      await query(
        `
        UPDATE profiles
        SET
          display_name = COALESCE($2, display_name),
          bio = COALESCE($3, bio)
        WHERE user_id = $1
        `,
        [payload.sub, displayName, bio]
      );
    }

    // Update editor_profiles table
    const updateResult = await query(
      `
      UPDATE editor_profiles
      SET
        headline = COALESCE($2, headline),
        summary = COALESCE($3, summary),
        hourly_rate = COALESCE($4, hourly_rate),
        availability = COALESCE($5, availability),
        languages = COALESCE($6, languages),
        timezone = COALESCE($7, timezone),
        turnaround_days = COALESCE($8, turnaround_days)
      WHERE user_id = $1
      RETURNING id
      `,
      [
        payload.sub,
        headline,
        summary,
        hourlyRate,
        availability,
        languages,
        timezone,
        turnaroundDays,
      ]
    );

    if (updateResult.rowCount === 0) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const editorProfileId = updateResult.rows[0].id;

    // Update skills if provided
    if (Array.isArray(skillIds)) {
      // Remove old skills
      await query(
        "DELETE FROM editor_skills WHERE editor_profile_id = $1",
        [editorProfileId]
      );

      // Add new skills
      if (skillIds.length > 0) {
        const values = skillIds
          .map((_, i) => `($1, $${i + 2})`)
          .join(", ");
        await query(
          `INSERT INTO editor_skills (editor_profile_id, skill_id) VALUES ${values} ON CONFLICT DO NOTHING`,
          [editorProfileId, ...skillIds]
        );
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update profile." },
      { status: 500 }
    );
  }
}

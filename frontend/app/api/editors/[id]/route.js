import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const editorResult = await query(
      `
      SELECT
        ep.id,
        ep.user_id,
        ep.headline,
        ep.summary,
        ep.rating,
        ep.hourly_rate,
        ep.availability,
        ep.response_time_hours,
        ep.completed_projects,
        ep.languages,
        ep.timezone,
        ep.turnaround_days,
        ep.featured,
        p.display_name,
        p.bio,
        COALESCE(array_agg(DISTINCT s.name) FILTER (WHERE s.id IS NOT NULL), ARRAY[]::text[]) AS skills
      FROM editor_profiles ep
      JOIN profiles p ON p.user_id = ep.user_id
      LEFT JOIN editor_skills es ON es.editor_profile_id = ep.id
      LEFT JOIN skills s ON s.id = es.skill_id
      WHERE ep.id = $1
      GROUP BY ep.id, p.display_name, p.bio
      `,
      [id]
    );

    if (editorResult.rowCount === 0) {
      return NextResponse.json({ error: "Editor not found." }, { status: 404 });
    }

    const portfolioResult = await query(
      `
      SELECT id, title, youtube_url, youtube_id, description
      FROM portfolio_items
      WHERE editor_profile_id = $1
      ORDER BY created_at DESC
      `,
      [id]
    );

    return NextResponse.json(
      {
        editor: editorResult.rows[0],
        portfolio: portfolioResult.rows,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load editor." },
      { status: 500 }
    );
  }
}

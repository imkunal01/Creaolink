import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const skill = searchParams.get("skill")?.trim() || null;
    const minRatingRaw = Number(searchParams.get("minRating") || 0);
    const minRating = Number.isFinite(minRatingRaw)
      ? Math.min(Math.max(minRatingRaw, 0), 5)
      : 0;
    const search = searchParams.get("q")?.trim() || null;
    const sort = searchParams.get("sort") || "rating";
    const availability = searchParams.get("availability")?.trim() || null;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const offset = (page - 1) * limit;

    // Build sort clause
    const sortOptions = {
      rating: "ep.rating DESC, ep.completed_projects DESC",
      price_low: "ep.hourly_rate ASC NULLS LAST",
      price_high: "ep.hourly_rate DESC NULLS LAST",
      response: "ep.response_time_hours ASC",
      projects: "ep.completed_projects DESC",
      featured: "ep.featured DESC, ep.rating DESC",
    };
    const orderBy = sortOptions[sort] || sortOptions.rating;

    const result = await query(
      `
      SELECT
        ep.id,
        p.display_name,
        ep.headline,
        ep.summary,
        ep.rating,
        ep.hourly_rate,
        ep.availability,
        ep.response_time_hours,
        ep.completed_projects,
        ep.languages,
        ep.turnaround_days,
        ep.featured,
        COALESCE(array_agg(DISTINCT s.name) FILTER (WHERE s.id IS NOT NULL), ARRAY[]::text[]) AS skills,
        COALESCE(array_agg(DISTINCT s.slug) FILTER (WHERE s.id IS NOT NULL), ARRAY[]::text[]) AS skill_slugs
      FROM editor_profiles ep
      JOIN profiles p ON p.user_id = ep.user_id
      LEFT JOIN editor_skills es ON es.editor_profile_id = ep.id
      LEFT JOIN skills s ON s.id = es.skill_id
      WHERE ep.rating >= $1
        AND (
          $2::text IS NULL
          OR EXISTS (
            SELECT 1
            FROM editor_skills es2
            JOIN skills s2 ON s2.id = es2.skill_id
            WHERE es2.editor_profile_id = ep.id
              AND (s2.slug = $2 OR s2.name ILIKE $2)
          )
        )
        AND ($3::text IS NULL OR p.display_name ILIKE '%' || $3 || '%' OR ep.headline ILIKE '%' || $3 || '%')
        AND ($4::text IS NULL OR ep.availability = $4)
      GROUP BY ep.id, p.display_name
      ORDER BY ${orderBy}
      LIMIT $5 OFFSET $6
      `,
      [minRating, skill, search, availability, limit, offset]
    );

    // Get total count for pagination
    const countResult = await query(
      `
      SELECT COUNT(DISTINCT ep.id) as total
      FROM editor_profiles ep
      JOIN profiles p ON p.user_id = ep.user_id
      LEFT JOIN editor_skills es ON es.editor_profile_id = ep.id
      LEFT JOIN skills s ON s.id = es.skill_id
      WHERE ep.rating >= $1
        AND (
          $2::text IS NULL
          OR EXISTS (
            SELECT 1
            FROM editor_skills es2
            JOIN skills s2 ON s2.id = es2.skill_id
            WHERE es2.editor_profile_id = ep.id
              AND (s2.slug = $2 OR s2.name ILIKE $2)
          )
        )
        AND ($3::text IS NULL OR p.display_name ILIKE '%' || $3 || '%' OR ep.headline ILIKE '%' || $3 || '%')
        AND ($4::text IS NULL OR ep.availability = $4)
      `,
      [minRating, skill, search, availability]
    );

    const total = parseInt(countResult.rows[0]?.total || "0", 10);

    return NextResponse.json({
      editors: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load editors." },
      { status: 500 }
    );
  }
}

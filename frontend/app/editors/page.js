import { query } from "@/lib/db";
import EditorsPageClient from "./EditorsPageClient";

export const dynamic = "force-dynamic";

async function loadSkills() {
  const result = await query("SELECT id, name, slug FROM skills ORDER BY name ASC");
  return result.rows;
}

async function loadEditors({ skill, minRating, q, availability, sort, page, limit }) {
  const rating = Number.isFinite(Number(minRating)) ? Math.min(Math.max(Number(minRating), 0), 5) : 0;
  const pageNum = Math.max(1, parseInt(page || "1", 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit || "12", 10)));
  const offset = (pageNum - 1) * limitNum;

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
      COALESCE(array_agg(DISTINCT s.name) FILTER (WHERE s.id IS NOT NULL), ARRAY[]::text[]) AS skills
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
    [rating, skill || null, q || null, availability || null, limitNum, offset]
  );

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
    [rating, skill || null, q || null, availability || null]
  );

  const total = parseInt(countResult.rows[0]?.total || "0", 10);

  return {
    editors: result.rows,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
}

export default async function EditorsPage({ searchParams }) {
  const skill = typeof searchParams?.skill === "string" ? searchParams.skill : "";
  const minRating = typeof searchParams?.minRating === "string" ? searchParams.minRating : "";
  const q = typeof searchParams?.q === "string" ? searchParams.q : "";
  const availability = typeof searchParams?.availability === "string" ? searchParams.availability : "";
  const sort = typeof searchParams?.sort === "string" ? searchParams.sort : "rating";
  const page = typeof searchParams?.page === "string" ? searchParams.page : "1";

  const [skills, { editors, pagination }] = await Promise.all([
    loadSkills(),
    loadEditors({ skill, minRating, q, availability, sort, page, limit: "12" }),
  ]);

  return (
    <EditorsPageClient
      initialEditors={editors}
      initialSkills={skills}
      initialPagination={pagination}
    />
  );
}

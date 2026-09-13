import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { requireAdmin, adminErrorResponse } from "@/lib/admin-guard";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "25", 10), 1), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const offset = (page - 1) * limit;

    const db = await getPool();

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (q) {
      conditions.push(
        `(p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex} OR owner.name ILIKE $${paramIndex} OR owner.email ILIKE $${paramIndex} OR p.sync_code ILIKE $${paramIndex})`
      );
      params.push(`%${q}%`);
      paramIndex++;
    }

    if (status && ["active", "completed", "approved", "pending"].includes(status)) {
      conditions.push(`p.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count total projects
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM projects p
      INNER JOIN users owner ON owner.id = p.created_by
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const total = countResult.rows[0]?.total || 0;

    // Fetch projects data
    const dataParams = [...params, limit, offset];
    const dataQuery = `
      SELECT p.id,
             p.title,
             p.description,
             p.deadline,
             p.status,
             p.current_version_id,
             p.sync_code,
             p.visibility,
             p.created_at,
             p.updated_at,
             p.created_by,
             owner.name AS owner_name,
             owner.email AS owner_email,
             COALESCE(members.member_count, 0)::int AS member_count,
             COALESCE(vers.version_count, 0)::int AS version_count
      FROM projects p
      INNER JOIN users owner ON owner.id = p.created_by
      LEFT JOIN (
        SELECT project_id, COUNT(*) AS member_count
        FROM project_members
        GROUP BY project_id
      ) members ON members.project_id = p.id
      LEFT JOIN (
        SELECT project_id, COUNT(*) AS version_count
        FROM versions
        GROUP BY project_id
      ) vers ON vers.project_id = p.id
      ${whereClause}
      ORDER BY p.updated_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const { rows } = await db.query(dataQuery, dataParams);

    return NextResponse.json({
      projects: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

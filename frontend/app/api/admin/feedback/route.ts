import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { requireAdmin, adminErrorResponse } from "@/lib/admin-guard";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const priority = searchParams.get("priority")?.trim() || "";
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "25", 10), 1), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const offset = (page - 1) * limit;

    const db = await getPool();

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (q) {
      conditions.push(
        `(fb.description ILIKE $${paramIndex} OR p.title ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`
      );
      params.push(`%${q}%`);
      paramIndex++;
    }

    if (status && ["open", "resolved"].includes(status.toLowerCase())) {
      conditions.push(`fb.status = $${paramIndex}`);
      params.push(status.toLowerCase());
      paramIndex++;
    }

    if (priority && ["high", "medium", "low"].includes(priority.toLowerCase())) {
      conditions.push(`LOWER(fb.priority) = $${paramIndex}`);
      params.push(priority.toLowerCase());
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count total
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM feedback fb
      INNER JOIN projects p ON p.id = fb.project_id
      INNER JOIN users u ON u.id = fb.created_by
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const total = countResult.rows[0]?.total || 0;

    // Fetch data
    const dataParams = [...params, limit, offset];
    const dataQuery = `
      SELECT fb.id,
             fb.project_id,
             fb.version_id,
             fb.created_by,
             fb.type,
             fb.priority,
             fb.timestamp,
             fb.description,
             fb.status,
             fb.created_at,
             p.title AS project_title,
             u.name AS creator_name,
             u.email AS creator_email,
             u.avatar_url AS creator_avatar,
             v.version_name
      FROM feedback fb
      INNER JOIN projects p ON p.id = fb.project_id
      INNER JOIN users u ON u.id = fb.created_by
      LEFT JOIN versions v ON v.id = fb.version_id
      ${whereClause}
      ORDER BY fb.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const { rows } = await db.query(dataQuery, dataParams);

    return NextResponse.json({
      feedback: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

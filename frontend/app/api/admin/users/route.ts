import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { requireAdmin, adminErrorResponse } from "@/lib/admin-guard";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const role = searchParams.get("role")?.trim() || "";
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
        `(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR username ILIKE $${paramIndex})`
      );
      params.push(`%${q}%`);
      paramIndex++;
    }

    if (role && ["client", "freelancer", "admin"].includes(role)) {
      conditions.push(`role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    if (status && ["active", "suspended", "banned"].includes(status)) {
      conditions.push(`COALESCE(status, 'active') = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count query
    const countResult = await db.query(
      `SELECT COUNT(*)::int AS total FROM users ${whereClause}`,
      params
    );
    const total = countResult.rows[0]?.total || 0;

    // Data query
    const dataParams = [...params, limit, offset];
    const { rows } = await db.query(
      `SELECT id, name, email, username, role, COALESCE(status, 'active') AS status, avatar_url, created_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      dataParams
    );

    return NextResponse.json({
      users: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

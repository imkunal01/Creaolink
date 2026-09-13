import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { requireAdmin, adminErrorResponse } from "@/lib/admin-guard";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const action = searchParams.get("action")?.trim() || "";
    const targetType = searchParams.get("targetType")?.trim() || "";
    const adminId = searchParams.get("adminId")?.trim() || "";
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "25", 10), 1), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const offset = (page - 1) * limit;

    const db = await getPool();

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (q) {
      conditions.push(
        `(al.action ILIKE $${paramIndex} OR al.target_type ILIKE $${paramIndex} OR al.target_id ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`
      );
      params.push(`%${q}%`);
      paramIndex++;
    }

    if (action) {
      conditions.push(`al.action = $${paramIndex}`);
      params.push(action);
      paramIndex++;
    }

    if (targetType) {
      conditions.push(`al.target_type = $${paramIndex}`);
      params.push(targetType);
      paramIndex++;
    }

    if (adminId) {
      conditions.push(`al.admin_id = $${paramIndex}`);
      params.push(adminId);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count total
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM admin_audit_log al
      LEFT JOIN users u ON u.id = al.admin_id
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const total = countResult.rows[0]?.total || 0;

    // Fetch entries
    const dataParams = [...params, limit, offset];
    const dataQuery = `
      SELECT al.id,
             al.admin_id,
             al.action,
             al.target_type,
             al.target_id,
             al.metadata,
             al.created_at,
             u.name AS admin_name,
             u.email AS admin_email,
             u.avatar_url AS admin_avatar
      FROM admin_audit_log al
      LEFT JOIN users u ON u.id = al.admin_id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const { rows } = await db.query(dataQuery, dataParams);

    return NextResponse.json({
      auditLog: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

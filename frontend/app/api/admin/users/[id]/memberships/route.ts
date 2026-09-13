import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { requireAdmin, adminErrorResponse } from "@/lib/admin-guard";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id: targetUserId } = await params;

    const db = await getPool();

    const { rows } = await db.query(
      `SELECT pm.id AS membership_id,
              pm.permission,
              p.id AS project_id,
              p.title AS project_title,
              p.status AS project_status,
              p.deadline,
              p.created_at,
              p.updated_at,
              owner.name AS owner_name,
              owner.email AS owner_email
       FROM project_members pm
       INNER JOIN projects p ON p.id = pm.project_id
       INNER JOIN users owner ON owner.id = p.created_by
       WHERE pm.user_id = $1
       ORDER BY p.updated_at DESC`,
      [targetUserId]
    );

    return NextResponse.json({ memberships: rows });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

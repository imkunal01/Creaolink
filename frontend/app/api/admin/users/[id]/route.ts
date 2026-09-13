import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { requireAdmin, adminErrorResponse } from "@/lib/admin-guard";
import { logAdminAction } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id: targetUserId } = await params;
    const body = await request.json();
    const { role, status } = body;

    if (!role && !status) {
      return NextResponse.json(
        { error: "At least one field (role or status) is required" },
        { status: 400 }
      );
    }

    if (role && !["client", "freelancer", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Allowed values: client, freelancer, admin" },
        { status: 400 }
      );
    }

    if (status && !["active", "suspended", "banned"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Allowed values: active, suspended, banned" },
        { status: 400 }
      );
    }

    const db = await getPool();

    // Check existing target user
    const existing = await db.query(
      "SELECT id, name, email, username, role, COALESCE(status, 'active') as status FROM users WHERE id = $1",
      [targetUserId]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const prevUser = existing.rows[0];
    const updates: string[] = [];
    const queryParams: unknown[] = [];
    let idx = 1;

    if (role && role !== prevUser.role) {
      updates.push(`role = $${idx++}`);
      queryParams.push(role);
    }

    if (status && status !== prevUser.status) {
      updates.push(`status = $${idx++}`);
      queryParams.push(status);
    }

    if (updates.length === 0) {
      return NextResponse.json({ user: prevUser, message: "No changes needed" });
    }

    queryParams.push(targetUserId);
    const updateQuery = `
      UPDATE users
      SET ${updates.join(", ")}
      WHERE id = $${idx}
      RETURNING id, name, email, username, role, COALESCE(status, 'active') AS status, created_at
    `;

    const { rows } = await db.query(updateQuery, queryParams);
    const updatedUser = rows[0];

    // Log separate audit events
    if (role && role !== prevUser.role) {
      await logAdminAction({
        adminId: admin.id,
        action: "user.role_change",
        targetType: "user",
        targetId: targetUserId,
        metadata: {
          previousRole: prevUser.role,
          newRole: role,
          targetEmail: prevUser.email,
        },
      });
    }

    if (status && status !== prevUser.status) {
      await logAdminAction({
        adminId: admin.id,
        action: "user.status_change",
        targetType: "user",
        targetId: targetUserId,
        metadata: {
          previousStatus: prevUser.status,
          newStatus: status,
          targetEmail: prevUser.email,
        },
      });
    }

    return NextResponse.json({ user: updatedUser });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

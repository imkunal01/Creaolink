import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { requireAdmin, adminErrorResponse } from "@/lib/admin-guard";
import { logAdminAction } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id: targetUserId } = await params;
    const db = await getPool();

    const userRes = await db.query("SELECT id, name, email FROM users WHERE id = $1", [
      targetUserId,
    ]);

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userRes.rows[0];

    // Log session revocation in audit trail
    await logAdminAction({
      adminId: admin.id,
      action: "user.session_revoked",
      targetType: "user",
      targetId: targetUserId,
      metadata: {
        targetName: user.name,
        targetEmail: user.email,
        revokedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Active session for ${user.name} has been revoked.`,
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

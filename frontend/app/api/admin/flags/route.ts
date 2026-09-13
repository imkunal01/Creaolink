import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { requireAdmin, adminErrorResponse } from "@/lib/admin-guard";
import { logAdminAction } from "@/lib/audit";
import { invalidateFlagsCache } from "@/lib/feature-flags";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const db = await getPool();

    const { rows } = await db.query(
      `SELECT f.key,
              f.enabled,
              f.updated_at,
              f.updated_by,
              u.name AS updater_name,
              u.email AS updater_email
       FROM feature_flags f
       LEFT JOIN users u ON u.id = f.updated_by
       ORDER BY f.key ASC`
    );

    return NextResponse.json({ flags: rows });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const { key, enabled } = await request.json();

    if (typeof key !== "string" || typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "Invalid payload: key (string) and enabled (boolean) are required" },
        { status: 400 }
      );
    }

    const db = await getPool();

    // Check flag existence
    const checkRes = await db.query("SELECT key, enabled FROM feature_flags WHERE key = $1", [
      key,
    ]);

    const prevEnabled = checkRes.rows[0]?.enabled;

    // Upsert flag
    await db.query(
      `INSERT INTO feature_flags (key, enabled, updated_by, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (key) DO UPDATE
       SET enabled = $2, updated_by = $3, updated_at = NOW()`,
      [key, enabled, admin.id]
    );

    // Invalidate local in-process cache immediately
    invalidateFlagsCache();

    // Log admin audit action
    await logAdminAction({
      adminId: admin.id,
      action: "flag.toggle",
      targetType: "feature_flag",
      targetId: key,
      metadata: {
        flagKey: key,
        previousState: prevEnabled ?? null,
        newState: enabled,
      },
    });

    return NextResponse.json({
      success: true,
      key,
      enabled,
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

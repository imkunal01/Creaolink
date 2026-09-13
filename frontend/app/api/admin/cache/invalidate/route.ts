import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/admin-guard";
import { logAdminAction } from "@/lib/audit";
import { deleteCachedPattern } from "@/lib/cache";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const { pattern } = await request.json();

    if (!pattern || typeof pattern !== "string" || !pattern.trim()) {
      return NextResponse.json(
        { error: "Key pattern is required (e.g. 'cl:project:*' or 'cl:*')" },
        { status: 400 }
      );
    }

    const trimmedPattern = pattern.trim();

    // Prevent accidental destructive match outside application namespace
    const safePattern =
      trimmedPattern.startsWith("cl:") || trimmedPattern === "*"
        ? trimmedPattern
        : `cl:${trimmedPattern}`;

    const deletedCount = await deleteCachedPattern(safePattern);

    // Log admin audit action
    await logAdminAction({
      adminId: admin.id,
      action: "cache.manual_invalidate",
      targetType: "cache_pattern",
      targetId: safePattern,
      metadata: {
        pattern: safePattern,
        keysEvicted: deletedCount,
      },
    });

    return NextResponse.json({
      success: true,
      pattern: safePattern,
      keysEvicted: deletedCount,
      message: `Evicted ${deletedCount} cache keys matching pattern "${safePattern}"`,
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

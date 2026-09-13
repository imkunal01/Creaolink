import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { requireAdmin, adminErrorResponse } from "@/lib/admin-guard";
import { logAdminAction } from "@/lib/audit";
import { invalidateProject } from "@/lib/invalidation";

function createSyncCode() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let value = "LNK-";
  for (let index = 0; index < 6; index += 1) {
    value += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return value;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id: projectId } = await params;
    const db = await getPool();

    // Verify project exists
    const projRes = await db.query(
      "SELECT id, title, created_by, sync_code FROM projects WHERE id = $1",
      [projectId]
    );

    if (projRes.rows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = projRes.rows[0];
    let newSyncCode = createSyncCode();
    let updated = false;

    // Retry loop for unique constraint
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await db.query("UPDATE projects SET sync_code = $1, updated_at = NOW() WHERE id = $2", [
          newSyncCode,
          projectId,
        ]);
        updated = true;
        break;
      } catch (err) {
        if ((err as { code?: string }).code !== "23505" || attempt === 4) {
          throw err;
        }
        newSyncCode = createSyncCode();
      }
    }

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to generate a unique sync code" },
        { status: 500 }
      );
    }

    // Log admin audit event
    await logAdminAction({
      adminId: admin.id,
      action: "project.sync_code_regenerated",
      targetType: "project",
      targetId: projectId,
      metadata: {
        projectTitle: project.title,
        oldSyncCode: project.sync_code,
        newSyncCode,
      },
    });

    // Invalidate cache
    await invalidateProject(projectId, project.created_by);

    return NextResponse.json({
      success: true,
      sync_code: newSyncCode,
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

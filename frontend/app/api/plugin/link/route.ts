import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

// ── GET /api/plugin/link — Link Premiere Pro Plugin to Project ──
// Expects: ?code=LNK-XXXXXX
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Sync code is required" }, { status: 400 });
    }

    const db = await getPool();

    // Find the project with this sync_code
    const { rows: projectRows } = await db.query(
      "SELECT id, title, current_version_id FROM projects WHERE sync_code = $1",
      [code]
    );

    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Invalid sync code or project not found" }, { status: 404 });
    }

    const project = projectRows[0];

    // Find the current version
    let currentVersionId = project.current_version_id;

    if (!currentVersionId) {
      // Fallback: If no current version is set, fetch the latest one created
      const { rows: versionRows } = await db.query(
        "SELECT id FROM versions WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1",
        [project.id]
      );
      if (versionRows.length > 0) {
        currentVersionId = versionRows[0].id;
      }
    }

    // Optional Extra Safety: We can issue a simple JWT or token here, 
    // but the sync_code acts as a long-lived API key specifically limited to this project's timeline data.
    return NextResponse.json({ 
      success: true,
      projectId: project.id,
      projectName: project.title,
      currentVersionId: currentVersionId,
      message: "Plugin successfully linked to project!"
    }, { status: 200 });

  } catch (err) {
    console.error("Plugin link error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

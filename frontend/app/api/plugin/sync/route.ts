import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

// ── POST /api/plugin/sync — Save Timeline JSON payload from UXP Plugin ──
// Body expects: { projectId: "...", versionId: "...", timelineData: { ... } }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, versionId, timelineData } = body;

    if (!projectId || !versionId || !timelineData) {
      return NextResponse.json({ error: "Missing projectId, versionId, or timelineData" }, { status: 400 });
    }

    const db = await getPool();

    // Verify the project exists
    const { rows: projRows } = await db.query(
      "SELECT id FROM projects WHERE id = $1",
      [projectId]
    );

    if (projRows.length === 0) {
      return NextResponse.json({ error: "Linked project no longer exists" }, { status: 404 });
    }

    // Verify the version exists
    const { rows: verRows } = await db.query(
      "SELECT id FROM versions WHERE id = $1 AND project_id = $2",
      [versionId, projectId]
    );

    if (verRows.length === 0) {
      return NextResponse.json({ error: "Target version does not exist or doesn't belong to project" }, { status: 404 });
    }

    // Save Timeline JSON to Database
    await db.query(
      "UPDATE versions SET timeline_data = $1 WHERE id = $2",
      [JSON.stringify(timelineData), versionId]
    );

    // Provide back the timeline metrics
    return NextResponse.json({ 
      success: true,
      message: "Timeline saved successfully!",
      metadata: timelineData.metadata
    }, { status: 200 });

  } catch (err) {
    console.error("Timeline Sync error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

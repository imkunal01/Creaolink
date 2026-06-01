import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getCachedJson, setCachedJson, buildCacheKey } from "@/lib/cache";

/**
 * GET /api/plugin/link?code=LNK-XXXXXX
 *
 * Cached in Redis for 5 minutes — sync codes don't change once assigned.
 * The Premiere Pro plugin calls this on every session start; without caching
 * it hits the DB on every plugin open.
 */
const PLUGIN_LINK_TTL = 300; // 5 minutes

function pluginLinkKey(code: string) {
  return buildCacheKey("plugin-link", code.toUpperCase());
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = (searchParams.get("code") || "").trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ error: "Sync code is required" }, { status: 400 });
    }

    // Try Redis cache first
    const cached = await getCachedJson<{
      projectId: string;
      projectName: string;
      currentVersionId: string | null;
    }>(pluginLinkKey(code));

    if (cached) {
      return NextResponse.json(
        {
          success: true,
          ...cached,
          message: "Plugin successfully linked to project!",
          cached: true,
        },
        {
          status: 200,
          headers: { "Cache-Control": "private, max-age=300" },
        }
      );
    }

    const db = await getPool();

    const { rows: projectRows } = await db.query(
      "SELECT id, title, current_version_id FROM projects WHERE sync_code = $1",
      [code]
    );

    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Invalid sync code or project not found" }, { status: 404 });
    }

    const project = projectRows[0];
    let currentVersionId = project.current_version_id;

    if (!currentVersionId) {
      const { rows: versionRows } = await db.query(
        "SELECT id FROM versions WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1",
        [project.id]
      );
      if (versionRows.length > 0) {
        currentVersionId = versionRows[0].id;
      }
    }

    const payload = {
      projectId: project.id,
      projectName: project.title,
      currentVersionId: currentVersionId ?? null,
    };

    // Cache the result
    await setCachedJson(pluginLinkKey(code), payload, PLUGIN_LINK_TTL);

    return NextResponse.json(
      {
        success: true,
        ...payload,
        message: "Plugin successfully linked to project!",
        cached: false,
      },
      {
        status: 200,
        headers: { "Cache-Control": "private, max-age=300" },
      }
    );
  } catch (err) {
    console.error("Plugin link error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

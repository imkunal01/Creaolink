import { NextRequest, NextResponse } from "next/server";
import { getPool, getAuthUser } from "@/lib/db";
import { readThroughCache, buildCacheKey } from "@/lib/cache";
import { invalidateProject } from "@/lib/invalidation";
import { flags } from "@/lib/feature-flags";

function createSyncCode() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let value = "LNK-";
  for (let i = 0; i < 6; i += 1) {
    value += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return value;
}

import type { Pool } from "pg";

// ── Cached project data fetcher ─────────────────────────────────────────────
async function fetchProjectDetail(id: string, db: Pool) {
  const { rows: projectRows } = await db.query("SELECT * FROM projects WHERE id = $1", [id]);
  const project = projectRows[0];
  if (!project) return null;

  // Backfill legacy rows that were created before sync codes were introduced.
  if (!project.sync_code) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const nextCode = createSyncCode();
      try {
        const { rows: updated } = await db.query(
          "UPDATE projects SET sync_code = $1 WHERE id = $2 AND sync_code IS NULL RETURNING sync_code",
          [nextCode, id]
        );
        if (updated.length > 0) {
          project.sync_code = updated[0].sync_code;
          break;
        }
        const { rows: existing } = await db.query("SELECT sync_code FROM projects WHERE id = $1", [id]);
        project.sync_code = existing[0]?.sync_code ?? null;
        break;
      } catch (updateErr) {
        if ((updateErr as { code?: string }).code !== "23505") throw updateErr;
      }
    }
  }

  let currentVersion = null;
  if (project.current_version_id) {
    const { rows } = await db.query("SELECT * FROM versions WHERE id = $1", [project.current_version_id]);
    currentVersion = rows[0] || null;
  }

  const { rows: versions } = await db.query(
    "SELECT * FROM versions WHERE project_id = $1 ORDER BY created_at ASC",
    [id]
  );

  let members: Array<Record<string, unknown>> = [];
  let owners: Array<Record<string, unknown>> = [];

  try {
    const membersResult = await db.query(
      `SELECT u.id, u.name, u.email, u.username, u.role, pm.permission
       FROM project_members pm
       INNER JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1`,
      [id]
    );
    members = membersResult.rows;

    const ownersResult = await db.query(
      "SELECT id, name, email, username, role FROM users WHERE id = $1",
      [project.created_by]
    );
    owners = ownersResult.rows;
  } catch (err) {
    if ((err as { code?: string }).code !== "42703") throw err;

    const membersResult = await db.query(
      `SELECT u.id, u.name, u.email, u.role, pm.permission
       FROM project_members pm
       INNER JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1`,
      [id]
    );
    members = membersResult.rows.map((row) => ({ ...row, username: "" }));

    const ownersResult = await db.query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [project.created_by]
    );
    owners = ownersResult.rows.map((row) => ({ ...row, username: "" }));
  }

  return {
    id: project.id,
    title: project.title,
    description: project.description,
    status: project.status,
    deadline: project.deadline,
    sync_code: project.sync_code,
    visibility: project.visibility,
    created_by: project.created_by,
    created_at: project.created_at,
    updated_at: project.updated_at,
    owner: owners[0] || null,
    currentVersion,
    versions,
    members,
  };
}

// ── GET /api/projects/:id — Project Detail ──
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startedAt = Date.now();
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const db = await getPool();

    // Check membership first (outside cache — always live for security).
    const { rows: memberRows } = await db.query(
      "SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2",
      [id, user.id]
    );
    if (memberRows.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const cacheKey = buildCacheKey("project", id);

    const data = flags.cacheProject
      ? await readThroughCache({
          key: cacheKey,
          ttlSeconds: 60,
          source: "api/projects/[id]",
          compute: () => fetchProjectDetail(id, db),
        })
      : await fetchProjectDetail(id, db);

    if (!data) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const response = NextResponse.json(data);
    response.headers.set("x-response-time", String(Date.now() - startedAt));
    return response;
  } catch (err) {
    console.error("Get project error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── PATCH /api/projects/:id — Rename project / update settings ──
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { title, visibility } = await request.json();

    const db = await getPool();
    const { rows: memberRows } = await db.query(
      "SELECT permission FROM project_members WHERE project_id = $1 AND user_id = $2",
      [id, user.id]
    );

    const permission = memberRows[0]?.permission;
    const canManage = user.role === "admin" || permission === "admin";
    if (!canManage) {
      return NextResponse.json({ error: "Only project admins can update settings" }, { status: 403 });
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (typeof title === "string") {
      const trimmed = title.trim();
      if (trimmed.length < 3) {
        return NextResponse.json({ error: "Project name must be at least 3 characters" }, { status: 400 });
      }
      if (trimmed.length > 80) {
        return NextResponse.json({ error: "Project name must be 80 characters or fewer" }, { status: 400 });
      }
      values.push(trimmed);
      updates.push(`title = $${values.length}`);
    }

    if (typeof visibility === "string") {
      if (!["public", "private", "followers-only"].includes(visibility)) {
        return NextResponse.json({ error: "Invalid visibility option" }, { status: 400 });
      }
      values.push(visibility);
      updates.push(`visibility = $${values.length}`);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    updates.push("updated_at = NOW()");
    values.push(id);

    const { rows } = await db.query(
      `UPDATE projects SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Phase 4: invalidate project detail cache after settings change.
    await invalidateProject(id, rows[0].created_by);

    return NextResponse.json({ project: rows[0] });
  } catch (err) {
    console.error("Update project settings error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── DELETE /api/projects/:id — Delete project permanently ──
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const db = await getPool();
    const client = await db.connect();

    const runSafeDelete = async (sql: string, values: unknown[]) => {
      try {
        await client.query(sql, values);
      } catch (err) {
        // Ignore missing-table errors for optional social modules.
        if ((err as { code?: string }).code !== "42P01") {
          throw err;
        }
      }
    };

    try {
      await client.query("BEGIN");

      const { rows: projRows } = await client.query(
        "SELECT created_by FROM projects WHERE id = $1",
        [id]
      );
      if (projRows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      const { rows: memberRows } = await client.query(
        "SELECT permission FROM project_members WHERE project_id = $1 AND user_id = $2",
        [id, user.id]
      );

      const canDelete =
        user.role === "admin" ||
        projRows[0].created_by === user.id ||
        memberRows[0]?.permission === "admin";

      if (!canDelete) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Only project admins can delete projects" }, { status: 403 });
      }

      await runSafeDelete("DELETE FROM feedback WHERE project_id = $1", [id]);
      await runSafeDelete("DELETE FROM freelancer_presence WHERE project_id = $1", [id]);
      await runSafeDelete("DELETE FROM versions WHERE project_id = $1", [id]);
      await runSafeDelete("DELETE FROM project_members WHERE project_id = $1", [id]);
      await runSafeDelete(
        `DELETE FROM post_comments
         WHERE post_id IN (SELECT id FROM posts WHERE project_id = $1)`,
        [id]
      );
      await runSafeDelete(
        `DELETE FROM post_reactions
         WHERE post_id IN (SELECT id FROM posts WHERE project_id = $1)`,
        [id]
      );
      await runSafeDelete("DELETE FROM posts WHERE project_id = $1", [id]);
      await client.query("DELETE FROM projects WHERE id = $1", [id]);

      await client.query("COMMIT");

      // Phase 4: invalidate project detail and owner's project list.
      await invalidateProject(id, projRows[0].created_by);

      return NextResponse.json({ success: true });
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Delete project error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getPool, getAuthUser } from "@/lib/db";
import { v4 as uuid } from "uuid";
import { getPresence, setPresence } from "@/lib/cache";

/**
 * Presence route — uses Redis as a live heartbeat store (primary) with
 * PostgreSQL as a fallback / persistent audit log.
 *
 * Redis entries expire after 70s, so stale entries are cleaned up
 * automatically without any maintenance job.
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const db = await getPool();

    const { rows: memberRows } = await db.query(
      "SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2",
      [id, user.id]
    );
    if (memberRows.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Try Redis first (live, sub-second)
    const redisPresence = await getPresence(id);

    if (redisPresence.length > 0) {
      // Shape to match existing API response
      const activeFreelancers = redisPresence.map((p) => ({
        user_id: p.userId,
        name: p.name,
        status: p.status,
        current_task: p.currentTask,
        hours_logged: p.hoursLogged,
        last_seen: p.lastSeen,
      }));
      return NextResponse.json({ activeFreelancers });
    }

    // Fallback to PostgreSQL (cold start / Redis not configured)
    const { rows } = await db.query(
      `SELECT u.id as user_id, u.name, u.email, fp.status, fp.current_task, fp.hours_logged, fp.last_seen
       FROM freelancer_presence fp
       INNER JOIN users u ON u.id = fp.user_id
       WHERE fp.project_id = $1
         AND fp.last_seen > NOW() - INTERVAL '2 minutes'
       ORDER BY fp.last_seen DESC`,
      [id]
    );

    return NextResponse.json({ activeFreelancers: rows });
  } catch (err) {
    console.error("Fetch presence error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const db = await getPool();

    const { rows: memberRows } = await db.query(
      "SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2",
      [id, user.id]
    );
    if (memberRows.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { status, currentTask, hoursLogged } = await request.json();
    const safeStatus = ["online", "away", "offline"].includes(status) ? status : "online";
    const safeTask = typeof currentTask === "string" ? currentTask.slice(0, 140) : "";
    const safeHours = typeof hoursLogged === "number" && hoursLogged >= 0 ? hoursLogged : 0;

    const now = new Date().toISOString();

    // Write to Redis (primary — live heartbeat)
    await setPresence(id, {
      userId: user.id,
      name: user.name,
      status: safeStatus as "online" | "away" | "offline",
      currentTask: safeTask,
      hoursLogged: safeHours,
      lastSeen: now,
    }).catch(() => {});

    // Write to PostgreSQL (persistent audit / fallback when Redis unavailable)
    await db.query(
      `INSERT INTO freelancer_presence (id, project_id, user_id, status, current_task, hours_logged, last_seen)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (project_id, user_id)
       DO UPDATE SET status = EXCLUDED.status,
                     current_task = EXCLUDED.current_task,
                     hours_logged = EXCLUDED.hours_logged,
                     last_seen = NOW()`,
      [uuid(), id, user.id, safeStatus, safeTask, safeHours]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update presence error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

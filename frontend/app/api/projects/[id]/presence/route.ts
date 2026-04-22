import { NextRequest, NextResponse } from "next/server";
import { getPool, getAuthUser } from "@/lib/db";
import { v4 as uuid } from "uuid";

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

    const { rows } = await db.query(
      `SELECT u.id as user_id, u.name, u.email, fp.status, fp.current_task, fp.hours_logged, fp.last_seen
       FROM freelancer_presence fp
       INNER JOIN users u ON u.id = fp.user_id
       WHERE fp.project_id = $1
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

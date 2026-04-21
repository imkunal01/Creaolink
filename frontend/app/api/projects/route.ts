import { NextRequest, NextResponse } from "next/server";
import { getPool, getAuthUser } from "@/lib/db";
import { v4 as uuid } from "uuid";

// ── POST /api/projects — Create Project ──
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Step 1: Verify role — only clients (and admins) can create
    if (user.role !== "client" && user.role !== "admin") {
      return NextResponse.json({ error: "Only clients can create projects" }, { status: 403 });
    }

    const { title, description, deadline, freelancerEmails } = await request.json();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const db = await getPool();
    const client = await db.connect();
    const projectId = uuid();
    const versionId = uuid();
    const syncCode = "LNK-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      await client.query("BEGIN");

      // Step 2: Create project
      await client.query(
        "INSERT INTO projects (id, title, description, deadline, created_by, sync_code) VALUES ($1, $2, $3, $4, $5, $6)",
        [projectId, title, description || "", deadline || null, user.id, syncCode]
      );

      // Step 3: Insert client into project_members
      await client.query(
        "INSERT INTO project_members (id, project_id, user_id) VALUES ($1, $2, $3)",
        [uuid(), projectId, user.id]
      );

      // Step 4: Add freelancers
      if (freelancerEmails && Array.isArray(freelancerEmails)) {
        for (const email of freelancerEmails) {
          const { rows } = await client.query(
            "SELECT id, role FROM users WHERE email = $1",
            [email]
          );
          const freelancer = rows[0];
          if (freelancer && freelancer.role === "freelancer") {
            await client.query(
              "INSERT INTO project_members (id, project_id, user_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
              [uuid(), projectId, freelancer.id]
            );
          }
        }
      }

      // Step 5: Create Version v1
      await client.query(
        "INSERT INTO versions (id, project_id, version_name, notes) VALUES ($1, $2, $3, $4)",
        [versionId, projectId, "v1", "Initial version"]
      );

      // Step 6: Update project current_version_id
      await client.query(
        "UPDATE projects SET current_version_id = $1 WHERE id = $2",
        [versionId, projectId]
      );

      await client.query("COMMIT");
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }

    // Step 7: Return response
    const { rows: projectRows } = await db.query("SELECT * FROM projects WHERE id = $1", [projectId]);
    const { rows: versionRows } = await db.query("SELECT * FROM versions WHERE id = $1", [versionId]);

    return NextResponse.json({ project: projectRows[0], currentVersion: versionRows[0] }, { status: 201 });
  } catch (err) {
    console.error("Create project error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── GET /api/projects — List projects for authenticated user ──
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getPool();

    const { rows: projects } = await db.query(
      `SELECT p.id, p.title, p.description, p.status, p.deadline,
              p.current_version_id, p.created_by, p.created_at
       FROM projects p
       INNER JOIN project_members pm ON pm.project_id = p.id
       WHERE pm.user_id = $1
       ORDER BY p.created_at DESC`,
      [user.id]
    );

    return NextResponse.json({ projects });
  } catch (err) {
    console.error("List projects error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

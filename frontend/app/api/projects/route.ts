import { NextRequest, NextResponse } from "next/server";
import { getPool, getAuthUser } from "@/lib/db";
import { v4 as uuid } from "uuid";

function createSyncCode() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let value = "LNK-";
  for (let index = 0; index < 6; index += 1) {
    value += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return value;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (user.role !== "client" && user.role !== "admin") {
      return NextResponse.json({ error: "Only clients can create projects" }, { status: 403 });
    }

    const { title, description, deadline, freelancerEmails } = await request.json();
    const trimmedTitle = typeof title === "string" ? title.trim() : "";
    if (trimmedTitle.length < 3) {
      return NextResponse.json({ error: "Project title must be at least 3 characters" }, { status: 400 });
    }
    if (trimmedTitle.length > 80) {
      return NextResponse.json({ error: "Project title must be 80 characters or fewer" }, { status: 400 });
    }

    const db = await getPool();
    const client = await db.connect();
    const projectId = uuid();
    const versionId = uuid();

    try {
      await client.query("BEGIN");

      let syncCode = createSyncCode();
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          await client.query(
            "INSERT INTO projects (id, title, description, deadline, created_by, sync_code) VALUES ($1, $2, $3, $4, $5, $6)",
            [projectId, trimmedTitle, String(description || "").trim(), deadline || null, user.id, syncCode]
          );
          break;
        } catch (error) {
          if ((error as { code?: string }).code !== "23505" || attempt === 4) {
            throw error;
          }
          syncCode = createSyncCode();
        }
      }

      await client.query(
        "INSERT INTO project_members (id, project_id, user_id, permission) VALUES ($1, $2, $3, $4)",
        [uuid(), projectId, user.id, "admin"]
      );

      if (Array.isArray(freelancerEmails)) {
        for (const rawEmail of freelancerEmails) {
          const email = String(rawEmail || "").trim().toLowerCase();
          if (!email) continue;

          const { rows } = await client.query(
            "SELECT id, role FROM users WHERE LOWER(email) = $1 LIMIT 1",
            [email]
          );
          const freelancer = rows[0];

          if (freelancer && (freelancer.role === "freelancer" || freelancer.role === "admin")) {
            await client.query(
              `INSERT INTO project_members (id, project_id, user_id, permission)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (project_id, user_id) DO NOTHING`,
              [uuid(), projectId, freelancer.id, "editor"]
            );
          }
        }
      }

      await client.query(
        "INSERT INTO versions (id, project_id, version_name, notes) VALUES ($1, $2, $3, $4)",
        [versionId, projectId, "v1", "Initial version"]
      );

      await client.query(
        "UPDATE projects SET current_version_id = $1, updated_at = NOW() WHERE id = $2",
        [versionId, projectId]
      );

      await client.query("COMMIT");
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }

    const { rows: projectRows } = await db.query("SELECT * FROM projects WHERE id = $1", [projectId]);
    const { rows: versionRows } = await db.query("SELECT * FROM versions WHERE id = $1", [versionId]);

    return NextResponse.json({ project: projectRows[0], currentVersion: versionRows[0] }, { status: 201 });
  } catch (err) {
    console.error("Create project error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getPool();

    const { rows: projects } = await db.query(
      `SELECT p.id,
              p.title,
              p.description,
              p.status,
              p.deadline,
              p.current_version_id,
              cv.version_name AS current_version_name,
              p.created_by,
              p.created_at,
              p.updated_at,
              p.visibility,
              pm.permission,
              owner.name AS owner_name,
              COALESCE(member_counts.member_count, 0)::int AS member_count,
              COALESCE(feedback_counts.open_feedback, 0)::int AS open_feedback
       FROM projects p
       INNER JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
       INNER JOIN users owner ON owner.id = p.created_by
       LEFT JOIN versions cv ON cv.id = p.current_version_id
       LEFT JOIN (
         SELECT project_id, COUNT(*) AS member_count
         FROM project_members
         GROUP BY project_id
       ) member_counts ON member_counts.project_id = p.id
       LEFT JOIN (
         SELECT project_id, COUNT(*) FILTER (WHERE status = 'open') AS open_feedback
         FROM feedback
         GROUP BY project_id
       ) feedback_counts ON feedback_counts.project_id = p.id
       ORDER BY p.updated_at DESC, p.created_at DESC`,
      [user.id]
    );

    return NextResponse.json({ projects });
  } catch (err) {
    console.error("List projects error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

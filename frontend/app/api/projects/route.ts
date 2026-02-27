import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUserFromRequest, findUserByEmail } from "@/lib/api-auth";
import { v4 as uuid } from "uuid";

// POST /api/projects — Create a project (client only)
export async function POST(req: Request) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Step 1 — Only clients (and admins) can create projects
  if (user.role !== "client" && user.role !== "admin") {
    return NextResponse.json(
      { error: "Only clients can create projects" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { title, description, deadline, freelancerEmails } = body as {
    title: string;
    description?: string;
    deadline?: string;
    freelancerEmails?: string[];
  };

  if (!title || !title.trim()) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    );
  }

  const db = getDb();
  const projectId = uuid();

  // Step 2 — Create project
  db.prepare(
    `INSERT INTO projects (id, title, description, deadline, created_by)
     VALUES (?, ?, ?, ?, ?)`
  ).run(projectId, title.trim(), (description || "").trim(), deadline || null, user.id);

  // Step 3 — Add client as project member
  db.prepare(
    `INSERT INTO project_members (id, project_id, user_id) VALUES (?, ?, ?)`
  ).run(uuid(), projectId, user.id);

  // Step 4 — Add freelancers
  const addedFreelancers: string[] = [];
  const failedEmails: string[] = [];

  if (freelancerEmails && freelancerEmails.length > 0) {
    for (const email of freelancerEmails) {
      const freelancer = findUserByEmail(email.trim());
      if (freelancer && freelancer.role === "freelancer") {
        try {
          db.prepare(
            `INSERT OR IGNORE INTO project_members (id, project_id, user_id) VALUES (?, ?, ?)`
          ).run(uuid(), projectId, freelancer.id);
          addedFreelancers.push(email);
        } catch {
          failedEmails.push(email);
        }
      } else {
        failedEmails.push(email);
      }
    }
  }

  // Step 5 — Create version v1
  const versionId = uuid();
  db.prepare(
    `INSERT INTO versions (id, project_id, version_name) VALUES (?, ?, ?)`
  ).run(versionId, projectId, "v1");

  // Step 6 — Update project current_version_id
  db.prepare(
    `UPDATE projects SET current_version_id = ? WHERE id = ?`
  ).run(versionId, projectId);

  // Step 7 — Return response
  const project = db
    .prepare("SELECT * FROM projects WHERE id = ?")
    .get(projectId);

  const currentVersion = db
    .prepare("SELECT * FROM versions WHERE id = ?")
    .get(versionId);

  return NextResponse.json(
    {
      project,
      currentVersion,
      addedFreelancers,
      failedEmails,
    },
    { status: 201 }
  );
}

// GET /api/projects — List projects for current user
export async function GET(req: Request) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();

  // Get all projects this user is a member of
  const projects = db
    .prepare(
      `SELECT p.*, v.version_name as current_version_name
       FROM projects p
       JOIN project_members pm ON pm.project_id = p.id
       LEFT JOIN versions v ON v.id = p.current_version_id
       WHERE pm.user_id = ?
       ORDER BY p.created_at DESC`
    )
    .all(user.id);

  // For each project, get member count and feedback stats
  const enriched = (projects as Record<string, unknown>[]).map((p) => {
    const memberCount = (
      db
        .prepare(
          "SELECT COUNT(*) as count FROM project_members WHERE project_id = ?"
        )
        .get(p.id) as { count: number }
    ).count;

    const openFeedback = (
      db
        .prepare(
          "SELECT COUNT(*) as count FROM feedback WHERE project_id = ? AND status = 'open'"
        )
        .get(p.id) as { count: number }
    ).count;

    return { ...p, memberCount, openFeedback };
  });

  return NextResponse.json({ projects: enriched });
}

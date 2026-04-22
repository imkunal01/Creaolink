import { NextRequest, NextResponse } from "next/server";
import { getPool, getAuthUser } from "@/lib/db";
import { v4 as uuid } from "uuid";

async function assertProjectAdmin(projectId: string, userId: string) {
  const db = await getPool();
  const { rows } = await db.query(
    "SELECT permission FROM project_members WHERE project_id = $1 AND user_id = $2",
    [projectId, userId]
  );
  return rows[0]?.permission === "admin";
}

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

    const { rows: members } = await db.query(
      `SELECT u.id, u.name, u.email, u.username, u.role, pm.permission
       FROM project_members pm
       INNER JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1
       ORDER BY u.name ASC`,
      [id]
    );

    return NextResponse.json({ members });
  } catch (err) {
    console.error("List team members error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const db = await getPool();
    const isAdmin = user.role === "admin" || (await assertProjectAdmin(id, user.id));
    if (!isAdmin) {
      return NextResponse.json({ error: "Only project admins can add freelancers" }, { status: 403 });
    }

    const { identifier, permission } = await request.json();
    const access = permission || "editor";

    if (!["admin", "editor", "viewer"].includes(access)) {
      return NextResponse.json({ error: "Invalid permission" }, { status: 400 });
    }

    if (!identifier || typeof identifier !== "string") {
      return NextResponse.json({ error: "Email or username is required" }, { status: 400 });
    }

    const cleaned = identifier.trim().toLowerCase().replace(/^@+/, "");
    const { rows: users } = await db.query(
      `SELECT id, role
       FROM users
       WHERE LOWER(username) = $1
          OR LOWER(email) = $1
       LIMIT 1`,
      [cleaned]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: "Freelancer not found" }, { status: 404 });
    }

    const freelancer = users[0];
    if (freelancer.role !== "freelancer" && freelancer.role !== "admin") {
      return NextResponse.json({ error: "Only freelancers can be assigned" }, { status: 400 });
    }

    await db.query(
      `INSERT INTO project_members (id, project_id, user_id, permission)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (project_id, user_id)
       DO UPDATE SET permission = EXCLUDED.permission`,
      [uuid(), id, freelancer.id, access]
    );

    await db.query("UPDATE projects SET updated_at = NOW() WHERE id = $1", [id]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Add freelancer error:", err);
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
    const isAdmin = user.role === "admin" || (await assertProjectAdmin(id, user.id));
    if (!isAdmin) {
      return NextResponse.json({ error: "Only project admins can update permissions" }, { status: 403 });
    }

    const { userId, permission } = await request.json();
    if (!userId || !permission) {
      return NextResponse.json({ error: "userId and permission are required" }, { status: 400 });
    }
    if (!["admin", "editor", "viewer"].includes(permission)) {
      return NextResponse.json({ error: "Invalid permission" }, { status: 400 });
    }

    await db.query(
      "UPDATE project_members SET permission = $1 WHERE project_id = $2 AND user_id = $3",
      [permission, id, userId]
    );
    await db.query("UPDATE projects SET updated_at = NOW() WHERE id = $1", [id]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update permission error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const db = await getPool();
    const isAdmin = user.role === "admin" || (await assertProjectAdmin(id, user.id));
    if (!isAdmin) {
      return NextResponse.json({ error: "Only project admins can remove freelancers" }, { status: 403 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const { rows: projectRows } = await db.query(
      "SELECT created_by FROM projects WHERE id = $1",
      [id]
    );

    if (projectRows[0]?.created_by === userId) {
      return NextResponse.json({ error: "Project owner cannot be removed" }, { status: 400 });
    }

    await db.query("DELETE FROM freelancer_presence WHERE project_id = $1 AND user_id = $2", [id, userId]);
    await db.query("DELETE FROM project_members WHERE project_id = $1 AND user_id = $2", [id, userId]);
    await db.query("UPDATE projects SET updated_at = NOW() WHERE id = $1", [id]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Remove freelancer error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

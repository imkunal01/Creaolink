import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/api-auth";

// PATCH /api/projects/[id]/status — Update project status (client only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  // Check project exists and user is the creator (client)
  const project = db
    .prepare("SELECT * FROM projects WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.created_by !== user.id) {
    return NextResponse.json(
      { error: "Only the project owner can update status" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { status } = body as { status: string };

  const validStatuses = ["active", "completed", "approved", "paused"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  db.prepare("UPDATE projects SET status = ? WHERE id = ?").run(status, id);

  const updated = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);

  return NextResponse.json({ project: updated });
}

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/api-auth";

// PATCH /api/feedback/[feedbackId]/resolve — Resolve feedback (freelancer only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ feedbackId: string }> }
) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { feedbackId } = await params;
  const db = getDb();

  // Get the feedback item
  const feedbackItem = db
    .prepare("SELECT * FROM feedback WHERE id = ?")
    .get(feedbackId) as Record<string, unknown> | undefined;

  if (!feedbackItem) {
    return NextResponse.json(
      { error: "Feedback not found" },
      { status: 404 }
    );
  }

  // Check user is freelancer
  if (user.role !== "freelancer") {
    return NextResponse.json(
      { error: "Only freelancers can resolve feedback" },
      { status: 403 }
    );
  }

  // Check user belongs to the project
  const membership = db
    .prepare(
      "SELECT id FROM project_members WHERE project_id = ? AND user_id = ?"
    )
    .get(feedbackItem.project_id, user.id);

  if (!membership) {
    return NextResponse.json(
      { error: "You are not a member of this project" },
      { status: 403 }
    );
  }

  // Update status to resolved
  db.prepare("UPDATE feedback SET status = 'resolved' WHERE id = ?").run(
    feedbackId
  );

  const updated = db
    .prepare("SELECT * FROM feedback WHERE id = ?")
    .get(feedbackId);

  return NextResponse.json({ feedback: updated });
}

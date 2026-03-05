import { NextRequest, NextResponse } from "next/server";
import { getPool, getAuthUser } from "@/lib/db";

// ── PATCH /api/feedback/:feedbackId/resolve — Mark feedback resolved ──
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ feedbackId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Only freelancer can resolve feedback
    if (user.role !== "freelancer" && user.role !== "admin") {
      return NextResponse.json({ error: "Only freelancers can resolve feedback" }, { status: 403 });
    }

    const { feedbackId } = await params;
    const db = await getPool();

    // Get the feedback to find its project
    const { rows: fbRows } = await db.query("SELECT * FROM feedback WHERE id = $1", [feedbackId]);
    if (fbRows.length === 0) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }
    const feedback = fbRows[0];

    // Check user belongs to the project
    const { rows: memberRows } = await db.query(
      "SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2",
      [feedback.project_id, user.id]
    );
    if (memberRows.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update status to resolved
    await db.query("UPDATE feedback SET status = 'resolved' WHERE id = $1", [feedbackId]);

    const { rows: updatedRows } = await db.query("SELECT * FROM feedback WHERE id = $1", [feedbackId]);
    return NextResponse.json({ feedback: updatedRows[0] });
  } catch (err) {
    console.error("Resolve feedback error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

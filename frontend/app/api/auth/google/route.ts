import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase-server";

function deriveName(email: string, metadata: Record<string, unknown> | null) {
  const fullName =
    (typeof metadata?.full_name === "string" && metadata.full_name) ||
    (typeof metadata?.name === "string" && metadata.name) ||
    "";

  if (fullName.trim()) return fullName.trim();
  return email.split("@")[0] || "User";
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { accessToken, role } = await request.json();

    if (!accessToken || typeof accessToken !== "string") {
      return NextResponse.json({ error: "Missing access token" }, { status: 400 });
    }

    const requestedRole = role === "freelancer" ? "freelancer" : "client";

    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !data?.user) {
      return NextResponse.json({ error: "Invalid OAuth session" }, { status: 401 });
    }

    const oauthUser = data.user;
    const email = oauthUser.email?.toLowerCase().trim();
    if (!email) {
      return NextResponse.json({ error: "Google account email is required" }, { status: 400 });
    }

    const name = deriveName(email, oauthUser.user_metadata as Record<string, unknown> | null);

    const db = await getPool();
    const { rows } = await db.query(
      `
      INSERT INTO users (id, name, email, password, role)
      VALUES ($1, $2, $3, '', $4)
      ON CONFLICT (email)
      DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name, email, role
      `,
      [oauthUser.id, name, email, requestedRole]
    );

    const user = rows[0] as { id: string; name: string; email: string; role: string } | undefined;
    if (!user) {
      return NextResponse.json({ error: "Unable to create user session" }, { status: 500 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error("Google auth error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

function normalizeUsername(input: string) {
  const cleaned = input
    .trim()
    .replace(/^@+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned.slice(0, 24);
}

async function getUniqueUsername(db: Awaited<ReturnType<typeof getPool>>, baseInput: string) {
  const base = normalizeUsername(baseInput) || "user";
  for (let i = 0; i < 200; i += 1) {
    const suffix = i === 0 ? "" : String(i + 1);
    const candidate = `${base.slice(0, Math.max(1, 24 - suffix.length))}${suffix}`;
    const { rows } = await db.query("SELECT id FROM users WHERE username = $1", [candidate]);
    if (rows.length === 0) return candidate;
  }
  return `${base.slice(0, 16)}_${Math.random().toString(36).slice(2, 8)}`;
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
    const { rows: existing } = await db.query(
      "SELECT id, name, email, username, role FROM users WHERE email = $1",
      [email]
    );

    let user: { id: string; name: string; email: string; username: string; role: string } | undefined;

    if (existing.length > 0) {
      const current = existing[0];
      const ensuredUsername = current.username || (await getUniqueUsername(db, name || email));
      const { rows } = await db.query(
        `UPDATE users
         SET name = $1,
             username = COALESCE(NULLIF(username, ''), $2)
         WHERE email = $3
         RETURNING id, name, email, username, role`,
        [name, ensuredUsername, email]
      );
      user = rows[0];
    } else {
      const generatedUsername = await getUniqueUsername(db, name || email);
      const { rows } = await db.query(
        `INSERT INTO users (id, name, email, username, password, role)
         VALUES ($1, $2, $3, $4, '', $5)
         RETURNING id, name, email, username, role`,
        [oauthUser.id, name, email, generatedUsername, requestedRole]
      );
      user = rows[0];
    }

    if (!user) {
      return NextResponse.json({ error: "Unable to create user session" }, { status: 500 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error("Google auth error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

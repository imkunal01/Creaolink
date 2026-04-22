import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";

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
    const { name, email, password, role, username } = await request.json();

    // ── Validation ──
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }
    if (!role || !["client", "freelancer"].includes(role)) {
      return NextResponse.json({ error: "Role must be client or freelancer" }, { status: 400 });
    }

    const db = await getPool();

    // ── Check if email already taken ──
    const { rows: existing } = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // ── Hash password & insert ──
    const hashedPassword = await bcrypt.hash(password, 12);
    const id = uuid();
    const finalUsername = username
      ? normalizeUsername(String(username))
      : await getUniqueUsername(db, name || email);

    if (!finalUsername || finalUsername.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
    }

    const { rows: usernameRows } = await db.query("SELECT id FROM users WHERE username = $1", [finalUsername]);
    if (usernameRows.length > 0) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
    }

    await db.query(
      "INSERT INTO users (id, name, email, username, password, role) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, name.trim(), email.toLowerCase().trim(), finalUsername, hashedPassword, role]
    );

    return NextResponse.json(
      { user: { id, name: name.trim(), email: email.toLowerCase().trim(), username: finalUsername, role } },
      { status: 201 }
    );
  } catch (err) {
    console.error("Signup error:", err instanceof Error ? err.message : err);
    console.error("Stack:", err instanceof Error ? err.stack : "N/A");
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

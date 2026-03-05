import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role } = await request.json();

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

    await db.query(
      "INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)",
      [id, name.trim(), email.toLowerCase().trim(), hashedPassword, role]
    );

    return NextResponse.json(
      { user: { id, name: name.trim(), email: email.toLowerCase().trim(), role } },
      { status: 201 }
    );
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

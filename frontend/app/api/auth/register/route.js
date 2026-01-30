import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hashPassword, normalizeEmail, signAuthToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email || "");
    const password = body.password || "";
    const role = (body.role || "CLIENT").toUpperCase();
    const displayName = body.displayName || null;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (!['CLIENT', 'EDITOR'].includes(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rowCount > 0) {
      return NextResponse.json(
        { error: "Email already registered." },
        { status: 409 }
      );
    }

    const roleResult = await query("SELECT id FROM roles WHERE name = $1", [role]);
    if (roleResult.rowCount === 0) {
      return NextResponse.json(
        { error: "Role not found. Seed roles first." },
        { status: 500 }
      );
    }

    const passwordHash = await hashPassword(password);

    const userInsert = await query(
      "INSERT INTO users (email, password_hash, role_id) VALUES ($1, $2, $3) RETURNING id",
      [email, passwordHash, roleResult.rows[0].id]
    );

    await query(
      "INSERT INTO profiles (user_id, display_name) VALUES ($1, $2)",
      [userInsert.rows[0].id, displayName]
    );

    const token = await signAuthToken({
      sub: userInsert.rows[0].id,
      email,
      role,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: "creaolink_session",
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}

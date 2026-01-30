import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { normalizeEmail, signAuthToken, verifyPassword } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email || "");
    const password = body.password || "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const userResult = await query(
      "SELECT u.id, u.password_hash, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = $1",
      [email]
    );

    if (userResult.rowCount === 0) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const user = userResult.rows[0];
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = await signAuthToken({
      sub: user.id,
      email,
      role: user.role,
    });

    const response = NextResponse.json({ ok: true, role: user.role });
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
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("creaolink_session")?.value;
    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const payload = await verifyAuthToken(token);
    const userResult = await query(
      "SELECT u.id, u.email, r.name as role, p.display_name FROM users u JOIN roles r ON u.role_id = r.id LEFT JOIN profiles p ON p.user_id = u.id WHERE u.id = $1",
      [payload.sub]
    );

    if (userResult.rowCount === 0) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ user: userResult.rows[0] }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

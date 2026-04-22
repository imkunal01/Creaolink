import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error("Current user error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

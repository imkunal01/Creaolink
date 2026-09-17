import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUser = user as {
      id: string;
      name: string;
      email: string;
      username: string;
      role: string;
      status?: string;
    };

    return NextResponse.json({
      user: {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        username: authUser.username,
        role: authUser.role,
        status: authUser.status || "active",
      },
    });
  } catch (err) {
    console.error("Auth me error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

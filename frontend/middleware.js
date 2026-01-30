import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const encoder = new TextEncoder();

async function getSessionPayload(request) {
  const token = request.cookies.get("creaolink_session")?.value;
  if (!token) return null;
  if (!process.env.JWT_SECRET) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      encoder.encode(process.env.JWT_SECRET)
    );
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const protectedPaths = ["/dashboard", "/editor", "/api/protected"];
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (!isProtected) return NextResponse.next();

  const payload = await getSessionPayload(request);
  if (!payload) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/editor") && payload.role !== "EDITOR") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/api/protected/editor") && payload.role !== "EDITOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/editor/:path*", "/api/protected/:path*"]
};

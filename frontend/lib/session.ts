import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { type NextResponse } from "next/server";

export const SESSION_COOKIE_NAME = "creaolink_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

type SessionTokenPayload = {
  exp: number;
  iat: number;
  sub: string;
  v: 1;
};

let warnedAboutFallbackSecret = false;

function base64UrlEncode(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function getSessionSecret() {
  const configured =
    process.env.SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET;

  if (configured) return configured;

  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing SESSION_SECRET for production session signing");
  }

  if (!warnedAboutFallbackSecret) {
    warnedAboutFallbackSecret = true;
    console.warn(
      "[session] Using development fallback session secret. Set SESSION_SECRET to avoid forced logouts after restarts."
    );
  }

  return "dev-creaolink-session-secret-change-me";
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function createSessionToken(userId: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionTokenPayload = {
    exp: now + SESSION_DURATION_SECONDS,
    iat: now,
    sub: userId,
    v: 1,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySessionToken(token: string | null | undefined): SessionTokenPayload | null {
  if (!token) return null;

  const [encodedPayload, providedSignature] = token.split(".");
  if (!encodedPayload || !providedSignature) return null;

  const expectedSignature = sign(encodedPayload);
  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(providedSignature);

  if (expected.length !== received.length) return null;
  if (!timingSafeEqual(expected, received)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionTokenPayload;
    if (payload.v !== 1 || !payload.sub || typeof payload.exp !== "number") {
      return null;
    }
    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function parseCookieValue(cookieHeader: string | null, cookieName: string) {
  if (!cookieHeader) return null;

  const pair = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${cookieName}=`));

  return pair ? decodeURIComponent(pair.slice(cookieName.length + 1)) : null;
}

export function getSessionUserIdFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  const token = parseCookieValue(cookieHeader, SESSION_COOKIE_NAME);
  return verifySessionToken(token)?.sub ?? null;
}

export function getSessionUserIdFromCookieStore(
  cookieStore: { get(name: string): { value: string } | undefined }
) {
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token)?.sub ?? null;
}

export function getSessionCookieConfig(value: string): ResponseCookie {
  return {
    httpOnly: true,
    maxAge: SESSION_DURATION_SECONDS,
    name: SESSION_COOKIE_NAME,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    value,
  };
}

export function setSessionCookie(response: NextResponse, userId: string) {
  response.cookies.set(getSessionCookieConfig(createSessionToken(userId)));
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    ...getSessionCookieConfig(""),
    expires: new Date(0),
    maxAge: 0,
    value: "",
  });
}

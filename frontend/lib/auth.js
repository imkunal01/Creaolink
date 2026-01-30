import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();

export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export async function hashPassword(password) {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function signAuthToken(payload) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encoder.encode(process.env.JWT_SECRET));
}

export async function verifyAuthToken(token) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }

  const { payload } = await jwtVerify(
    token,
    encoder.encode(process.env.JWT_SECRET)
  );
  return payload;
}

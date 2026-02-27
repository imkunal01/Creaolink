import { getDb } from "./db";
import { v4 as uuid } from "uuid";

export interface DbUser {
  id: string;
  name: string;
  email: string;
  role: "client" | "freelancer" | "admin";
}

/**
 * Ensure a user exists in the DB (upsert by id).
 * Called when we derive user info from the X-User-* headers (mock auth).
 */
export function ensureUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
}): DbUser {
  const db = getDb();

  const existing = db
    .prepare("SELECT id, name, email, role FROM users WHERE id = ?")
    .get(user.id) as DbUser | undefined;

  if (existing) return existing;

  // Check by email too (allows different mock IDs but same email to resolve)
  const byEmail = db
    .prepare("SELECT id, name, email, role FROM users WHERE email = ?")
    .get(user.email) as DbUser | undefined;

  if (byEmail) return byEmail;

  const id = user.id || uuid();
  db.prepare(
    "INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)"
  ).run(id, user.name, user.email, user.role);

  return { id, name: user.name, email: user.email, role: user.role as DbUser["role"] };
}

/**
 * Find user by email.
 */
export function findUserByEmail(email: string): DbUser | null {
  const db = getDb();
  const row = db
    .prepare("SELECT id, name, email, role FROM users WHERE email = ?")
    .get(email) as DbUser | undefined;
  return row ?? null;
}

/**
 * Extract the current user from request headers.
 * The frontend sends user info via X-User-Id, X-User-Name, X-User-Email, X-User-Role headers.
 */
export function getUserFromRequest(req: Request): DbUser | null {
  const id = req.headers.get("x-user-id");
  const name = req.headers.get("x-user-name");
  const email = req.headers.get("x-user-email");
  const role = req.headers.get("x-user-role");

  if (!id || !name || !email || !role) return null;

  // Ensure user exists in the DB
  return ensureUser({ id, name, email, role });
}

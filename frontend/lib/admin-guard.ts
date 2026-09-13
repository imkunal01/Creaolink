import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/db";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  status?: string;
}

export class AdminGuardError extends Error {
  status: number;
  constructor(message = "Forbidden: Admin access required", status = 403) {
    super(message);
    this.name = "AdminGuardError";
    this.status = status;
  }
}

/**
 * Validates that the calling request has an authenticated user with role === 'admin'.
 * Returns the authenticated AdminUser or throws an AdminGuardError.
 */
export async function requireAdmin(request: Request): Promise<AdminUser> {
  const user = await getAuthUser(request);
  if (!user) {
    throw new AdminGuardError("Unauthorized: Authentication required", 401);
  }
  if (user.role !== "admin") {
    throw new AdminGuardError("Forbidden: Admin privileges required", 403);
  }
  return user as AdminUser;
}

/**
 * Standard error response helper for admin API routes
 */
export function adminErrorResponse(err: unknown) {
  if (err instanceof AdminGuardError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("Admin route error:", err);
  return NextResponse.json(
    { error: err instanceof Error ? err.message : "Internal server error" },
    { status: 500 }
  );
}

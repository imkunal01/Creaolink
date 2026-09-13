import { v4 as uuid } from "uuid";
import { getPool } from "./db";

export interface LogAdminActionParams {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown> | null;
}

/**
 * Inserts an immutable audit record for administrative actions.
 * Used across all admin mutation routes.
 */
export async function logAdminAction({
  adminId,
  action,
  targetType,
  targetId,
  metadata = null,
}: LogAdminActionParams): Promise<void> {
  try {
    const db = await getPool();
    const id = uuid();
    await db.query(
      `INSERT INTO admin_audit_log (id, admin_id, action, target_type, target_id, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        id,
        adminId,
        action,
        targetType,
        targetId,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
  } catch (err) {
    console.error("[AuditLog] Failed to record admin action:", err);
  }
}

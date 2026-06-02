/**
 * lib/invalidation.ts — Cache invalidation helpers
 *
 * Key taxonomy:
 *   cl:feed:{userId}              — personalised feed (90s TTL)
 *   cl:profile:{userId}           — user profile blob (300s TTL)
 *   cl:project:{projectId}        — project detail (60s TTL)
 *   cl:projects-list:{userId}     — user's project list (60s TTL)
 *   cl:chat:{projectId}           — last 100 chat messages (20s TTL)
 *   cl:feedback:{projectId}       — feedback list (30s TTL)
 *   cl:team:{projectId}           — team members (120s TTL)
 *   cl:presence:{projectId}:*     — per-user presence entries (70s TTL, live heartbeat)
 */

import { buildCacheKey, deleteCachedKeys, deleteCachedPattern } from "./cache";
import { getPool } from "./db";

// ── Key builders ─────────────────────────────────────────────────────────────

export const feedKey           = (userId: string)    => buildCacheKey("feed", userId);
export const profileKey        = (userId: string)    => buildCacheKey("profile", userId);
export const projectKey        = (projectId: string) => buildCacheKey("project", projectId);
export const projectsListKey   = (userId: string)    => buildCacheKey("projects-list", userId);
export const chatKey           = (projectId: string) => buildCacheKey("chat", projectId);
export const feedbackKey       = (projectId: string) => buildCacheKey("feedback", projectId);
export const teamKey           = (projectId: string) => buildCacheKey("team", projectId);

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Invalidate a user's personalised feed. */
export async function invalidateFeed(userId: string): Promise<void> {
  await deleteCachedKeys([feedKey(userId)]);
}

/** Invalidate a user's profile. */
export async function invalidateProfile(userId: string): Promise<void> {
  await deleteCachedKeys([profileKey(userId)]);
}

/**
 * Invalidate a project's detail cache, ALL member project-list caches,
 * and optionally the chat/feedback/team caches for that project.
 *
 * This is the correct approach — if any member opens their dashboard after
 * a project update, their list should reflect the change immediately.
 */
export async function invalidateProject(
  projectId: string,
  ownerId?: string,
  options?: { chat?: boolean; feedback?: boolean; team?: boolean }
): Promise<void> {
  const keys: string[] = [projectKey(projectId)];

  // Always bust the owner's list if provided directly
  if (ownerId) keys.push(projectsListKey(ownerId));

  // Fetch all members of this project and bust their list caches too
  try {
    const db = await getPool();
    const { rows } = await db.query<{ user_id: string }>(
      "SELECT user_id FROM project_members WHERE project_id = $1",
      [projectId]
    );
    for (const row of rows) {
      const memberListKey = projectsListKey(row.user_id);
      if (!keys.includes(memberListKey)) keys.push(memberListKey);
    }
  } catch {
    // If DB query fails, at least bust the owner key we already have
  }

  if (options?.chat)     keys.push(chatKey(projectId));
  if (options?.feedback) keys.push(feedbackKey(projectId));
  if (options?.team)     keys.push(teamKey(projectId));

  await deleteCachedKeys(keys);
}

/**
 * Invalidate all caches affected by a chat message being posted.
 * - Chat cache for the project (short TTL, but force fresh immediately)
 * - Project list for all members (updated_at changes on each message)
 */
export async function invalidateChat(projectId: string): Promise<void> {
  await deleteCachedKeys([chatKey(projectId)]);
  // Project list shows updated_at — bust all member lists
  await invalidateProject(projectId, undefined, {});
}

/**
 * Invalidate caches affected by new feedback.
 */
export async function invalidateFeedback(projectId: string): Promise<void> {
  await deleteCachedKeys([feedbackKey(projectId)]);
  // open_feedback count appears in project list cards
  await invalidateProject(projectId, undefined, {});
}

/**
 * Invalidate team cache (member add/remove/permission change).
 */
export async function invalidateTeam(projectId: string): Promise<void> {
  await deleteCachedKeys([teamKey(projectId), projectKey(projectId)]);
  // Project detail embeds members — and new member needs their list cache busted
  await invalidateProject(projectId, undefined, {});
}

/**
 * Invalidate all caches after a follow/unfollow action.
 */
export async function invalidateFollowChange(
  followerId: string,
  followingId: string
): Promise<void> {
  await deleteCachedKeys([
    feedKey(followerId),
    feedKey(followingId),
    profileKey(followingId),
  ]);
}

/**
 * Nuclear option: clear everything for a project (e.g. on DELETE).
 */
export async function invalidateProjectAll(
  projectId: string,
  ownerId?: string
): Promise<void> {
  await invalidateProject(projectId, ownerId, {
    chat: true,
    feedback: true,
    team: true,
  });
  // Also clear presence keys
  await deleteCachedPattern(`cl:presence:${projectId}:*`).catch(() => {});
}

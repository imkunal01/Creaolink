import { buildCacheKey, deleteCachedKeys } from "./cache";

// ── Key Catalog ────────────────────────────────────────────────────────────────
// All cache keys in one place so invalidation is never missed.
//
// Taxonomy:
//   creaolink:feed:{userId}          — personalised feed response
//   creaolink:profile:{userId}       — static profile blob (Option A)
//   creaolink:project:{projectId}    — project detail response
//   creaolink:projects-list:{userId} — user's project list
// ────────────────────────────────────────────────────────────────────────────────

export function feedKey(userId: string): string {
  return buildCacheKey("feed", userId);
}

export function profileKey(userId: string): string {
  return buildCacheKey("profile", userId);
}

export function projectKey(projectId: string): string {
  return buildCacheKey("project", projectId);
}

export function projectsListKey(userId: string): string {
  return buildCacheKey("projects-list", userId);
}

// ── Invalidation Helpers ───────────────────────────────────────────────────────

/**
 * Invalidate a user's personalised feed cache.
 * Call after: post create, follow/unfollow.
 */
export async function invalidateFeed(userId: string): Promise<void> {
  await deleteCachedKeys([feedKey(userId)]);
}

/**
 * Invalidate a user's static profile cache.
 * Call after: follow/unfollow (follower count changes).
 */
export async function invalidateProfile(userId: string): Promise<void> {
  await deleteCachedKeys([profileKey(userId)]);
}

/**
 * Invalidate a project detail + relevant list caches.
 * Call after: project PATCH, DELETE.
 * @param projectId  The project being modified.
 * @param ownerId    Creator of the project (to bust their list cache).
 */
export async function invalidateProject(
  projectId: string,
  ownerId?: string
): Promise<void> {
  const keys = [projectKey(projectId)];
  if (ownerId) keys.push(projectsListKey(ownerId));
  await deleteCachedKeys(keys);
}

/**
 * Invalidate all caches affected by a follow/unfollow action.
 * - Both users' feeds (network section changes).
 * - Target user's profile (follower count changes).
 */
export async function invalidateFollowChange(
  followerId: string,
  followingId: string
): Promise<void> {
  await deleteCachedKeys([
    feedKey(followerId),
    feedKey(followingId),
    profileKey(followingId), // follower count on the followed user's profile
  ]);
}

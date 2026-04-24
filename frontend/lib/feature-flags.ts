/**
 * Per-endpoint cache feature flags.
 * Set the env var to "false" (string) to disable a specific cache layer
 * without redeploying — useful for canary rollout and quick rollback.
 *
 * Examples:
 *   CACHE_FEED=false     — bypasses Redis for feed, hits DB every request
 *   CACHE_PROFILE=false  — bypasses Redis for profile
 *   CACHE_PROJECT=false  — bypasses Redis for project detail + list
 */
export const flags = {
  cacheFeed:    process.env.CACHE_FEED    !== "false",
  cacheProfile: process.env.CACHE_PROFILE !== "false",
  cacheProject: process.env.CACHE_PROJECT !== "false",
} as const;

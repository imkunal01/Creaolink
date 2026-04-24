# Creaolink API Cache Runbook

## Key Taxonomy

All keys are prefixed with `creaolink:` via `buildCacheKey()`.

| Key Pattern | Owner | TTL | Invalidated By |
|---|---|---|---|
| `creaolink:feed:{userId}` | Feed route | 90s | Post create, follow/unfollow |
| `creaolink:profile:{userId}` | Profile route | 120s | Follow/unfollow (target user) |
| `creaolink:project:{projectId}` | Project detail route | 60s | Project PATCH, DELETE |
| `creaolink:projects-list:{userId}` | Projects list route | 60s | Project POST, PATCH, DELETE |

> **Note:** Profile cache (Option A) stores only the static blob. `isFollowing`/`isMutual` are always fetched live.

---

## Feature Flags (Rollout / Rollback)

Set in environment variables. No code changes or redeployment needed.

| Variable | Default | Effect when set to `"false"` |
|---|---|---|
| `CACHE_FEED` | enabled | Feed always hits DB; Redis bypassed entirely |
| `CACHE_PROFILE` | enabled | Profile always hits DB |
| `CACHE_PROJECT` | enabled | Project detail and list always hit DB |

**Rollback procedure:**
1. Set the relevant env var to `"false"` in your hosting dashboard (Vercel / Railway / etc.)
2. Redeploy or trigger an env reload (no code push required in Vercel)
3. Verify via `/api/health/redis` — `flags` object in the response will confirm the state

---

## Verification Checklist

### After Deploying

1. **Redis connectivity:** `GET /api/health/redis`
   - Expected: `{ ok: true, configured: true, latencyMs: <n>, flags: { cacheFeed: true, ... } }`
   - If `ok: false`: add/check `UPSTASH_REDIS_URL` env var

2. **Feed cache hit:** Call `GET /api/feed` twice in quick succession
   - Server logs should show `[Cache] MISS` on first call, `[Cache] HIT` on second
   - Response header `x-response-time` should be significantly lower on the second call

3. **Invalidation correctness:**
   - Create a post → call feed again → confirm `[Cache] MISS` (invalidated)
   - Follow a user → call feed → confirm MISS
   - PATCH a project → call project detail → confirm MISS

4. **Redis-outage fallback:**
   - Set `UPSTASH_REDIS_URL` to an invalid value temporarily
   - All APIs should still respond correctly (cache utility auto-falls-through)
   - Logs will show `[Redis] Connection failed` but no 500 errors

---

## DB Indexes Applied (Phase 2)

All indexes are `CREATE INDEX IF NOT EXISTS` — safe to run repeatedly.

```
idx_pm_user_id              project_members(user_id)
idx_projects_updated_at     projects(updated_at DESC)
idx_uf_follower_id          user_follows(follower_id)
idx_uf_following_id         user_follows(following_id)
idx_posts_created_at        posts(created_at DESC)
idx_posts_user_id           posts(user_id)
idx_feedback_project_status feedback(project_id, status)
idx_projects_created_by     projects(created_by, updated_at DESC)
idx_post_reactions_post_id  post_reactions(post_id)
idx_post_comments_post_id   post_comments(post_id)
```

Indexes are created automatically on first server boot via `initTables()` in `lib/db.ts`.

---

## Redis Outage Playbook

| Symptom | Cause | Action |
|---|---|---|
| `GET /api/health/redis` returns 503 | Redis unreachable or misconfigured | Check `UPSTASH_REDIS_URL`; APIs still work without Redis |
| All feeds show `[Cache] MISS` | Redis connection dropped | Set `CACHE_FEED=false` to disable cache while investigating |
| Stale data after mutation | Invalidation missed a key | Check `lib/invalidation.ts` key catalog; add missing key |
| High DB load spike | Cache not warming / cold start | Normal on deploy; will self-warm within one TTL window |

---

## Anti-Stampede

`readThroughCache` uses an in-process `Set<string>` (`inFlightKeys`) to detect concurrent cache misses for the same key. If a key is already being computed, concurrent requests wait 200ms and retry from cache. This limits cold-start DB fanout to 1 query per key per process instance.

> In multi-instance deployments (e.g., Vercel serverless), each instance has its own in-process set. The worst case is N instances × 1 DB query on cold start — acceptable given Upstash's fast writes.

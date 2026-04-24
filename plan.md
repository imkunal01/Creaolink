Plan: Phase-Wise API Performance Rollout
Build performance improvements in complete, shippable phases so each Copilot run finishes a working slice with no half-done dependencies. Chosen direction: Upstash Redis + balanced freshness (60-120s TTL with targeted invalidation).

Steps

Phase 1 - Foundation (complete on its own)
Add Redis dependency and environment contract.
Create a shared cache utility for read-through caching, TTL, key naming, and safe fallback if Redis is down.
Add lightweight per-route timing and cache hit/miss logs so every next phase is measurable.
Done criteria: cache utility can set/get/delete successfully and APIs still work when Redis is unavailable.
Phase 2 - DB speedups (complete on its own)
Add idempotent high-impact indexes for feed/profile/project queries.
Refactor heavy read handlers to run independent SQL calls in parallel where safe.
Tune DB pool conservatively after fallback behavior is validated.
Done criteria: measurable latency drop and index usage confirmed on top slow queries.
Phase 3 - Feed acceleration (first end-to-end feature slice)
Add read-through cache to feed with per-user keys and 60-120s TTL.
Keep response contract unchanged.
Add invalidation hooks from writes that affect feed: post create, follow changes, project updates.
Done criteria: repeated feed calls hit cache; write actions invalidate and return fresh data.
Phase 4 - Profile + project detail acceleration (second full slice)
Add caching to profile and project detail endpoints with resource-specific keys and TTL.
Add invalidation mapping for follow/unfollow, project patch/delete, feedback/sync changes.
Centralize invalidation helpers to avoid missed keys.
Done criteria: lower p95 latency and correctness immediately after mutations.
Phase 5 - Non-Redis API optimizations (third full slice)
Add HTTP caching headers for safe public endpoints (discover/search).
Apply payload shaping, strict pagination limits, and response compression checks.
Add anti-stampede protection for hot cache keys and rate-limiting for expensive endpoints.
Done criteria: lower DB query count and better burst throughput.
Phase 6 - Production hardening
Add per-endpoint feature flags for cache rollout and quick rollback.
Add alerting for cache error rate, miss spikes, and latency regressions.
Publish a runbook for key taxonomy, invalidation rules, and outage fallback.
Done criteria: canary rollout + rollback drill with no correctness regressions.
Dependencies and parallelism

Phase 2 depends on Phase 1 instrumentation consistency.
Phase 3 depends on Phases 1-2 and is first user-visible complete gain.
Phase 4 can be split by endpoint and run in parallel after Phase 3 patterns are finalized.
Phase 5 can overlap with late Phase 4 for already-stable endpoints.
Phase 6 is final hardening after functional phases are complete.
Relevant files

package.json - Redis dependency and scripts.
db.ts - indexes and pool tuning.
frontend/lib/cache.ts - new shared cache utility.
route.ts - feed caching + invalidation-aware behavior.
route.ts - invalidate feed/posts cache on write.
frontend/app/api/users/[id]/follow/route.ts - invalidate feed/profile cache.
frontend/app/api/users/[id]/profile/route.ts - profile caching.
frontend/app/api/projects/[id]/route.ts - project detail caching.
route.ts - list caching/invalidation where needed.
route.ts - HTTP caching + query optimization.
Verification

Capture baseline and post-phase latency for feed/profile/project.
Test cache hit/miss/invalidation and Redis-outage fallback.
Validate DB plans with explain analyze for targeted queries.
Run burst-load smoke tests for p95 and hit-rate checks.
Confirm no response shape regressions for frontend consumers.
Decisions captured

Redis: Upstash.
Freshness: balanced 60-120s TTL + targeted invalidation.
Included: API performance, caching, invalidation, DB indexing, observability, rollout safety.
Excluded: frontend UX refactors and unrelated architectural rewrites.
Plan has been saved to session memory at /memories/session/plan.md and is ready for your approval or edits before implementation handoff.
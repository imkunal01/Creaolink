# Creaolink Admin Panel — Phase-Wise Build Plan

How to use this: work through the phases **in order** — each one depends on the DB/route work from the phase before it. Run the "Verify" checklist before moving to the next phase.

---

## Phase 0 — Admin Route Protection & Shell

**Goal:** A locked-down `/admin` section that only `role = 'admin'` users can reach. No admin features yet — just the gate and empty shell.

**Tasks:**
1. Create `app/admin/layout.tsx` — a server component that:
   - Calls `getAuthUser()` (reuse existing helper)
   - Redirects to `/dashboard` if user is missing or `user.role !== "admin"`
   - Renders a persistent shell: left sidebar with placeholder links (Users, Projects, Cache & Flags, Feedback, Metrics, Audit Log) and content area for `children`
   - Match existing Charcoal/Red design tokens from `app/globals.css`
2. Create `app/admin/page.tsx` — landing page with "Creaolink Admin" and short description.
3. Add `lib/admin-guard.ts` helper: `requireAdmin(request): Promise<User>` that throws 403 JSON response if caller isn't an admin.

**Verify:** Non-admin redirected from `/admin`; admin sees the shell.

---

## Phase 1 — Schema Additions

**Goal:** Add tables/columns using existing idempotent auto-migration pattern (`initTables()` in `lib/db.ts`).

**Tasks:**
1. `ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';`
2. `feature_flags` table (key, enabled, updated_by, updated_at) seeded with 'cacheFeed', 'cacheProfile', 'cacheProject'.
3. `admin_audit_log` table (id, admin_id, action, target_type, target_id, metadata, created_at) + index on `created_at DESC`.
4. `lib/audit.ts` helper: `logAdminAction({ adminId, action, targetType, targetId, metadata })`.

**Verify:** Tables & columns exist after dev server restarts.

---

## Phase 2 — User Management

**Goal:** List, search, and moderate users from the admin panel.

**Tasks:**
1. `app/api/admin/users/route.ts` (GET with ?q=, ?role=, ?status=, pagination).
2. `app/api/admin/users/[id]/route.ts` (PATCH for role & status, logs audit action).
3. `app/api/admin/users/[id]/memberships/route.ts` (GET project memberships).
4. `app/admin/users/page.tsx` (Search, filter dropdowns, table, per-row actions).
5. Update `app/api/auth/login/route.ts` to reject suspended/banned users with 403.

**Verify:** Suspended user cannot log in; audit log recorded.

---

## Phase 3 — Project Oversight

**Goal:** See and manage every project system-wide.

**Tasks:**
1. `app/api/admin/projects/route.ts` (GET all projects with creator name & member count).
2. `app/api/admin/projects/[id]/route.ts` (GET detail, PATCH title/status/deadline, DELETE cascading in transaction).
3. `app/api/admin/projects/[id]/sync-code/route.ts` (POST regenerate sync_code).
4. `app/api/admin/projects/[id]/members/[userId]/route.ts` (PATCH permission).
5. `app/admin/projects/page.tsx` & `app/admin/projects/[id]/page.tsx`.
6. Invalidate cache via `invalidateProject()`.

**Verify:** Admin status edit busts Redis cache immediately for real users.

---

## Phase 4 — Version & Timeline Inspection

**Goal:** Debug tooling for JSONB timeline payloads.

**Tasks:**
1. `app/api/admin/projects/[id]/versions/route.ts` (GET versions + pg_column_size).
2. `app/api/admin/projects/[id]/versions/[versionId]/route.ts` (GET JSON, DELETE clear payload).
3. `app/api/admin/projects/[id]/rollback/route.ts` (POST rollback current_version_id).
4. `app/admin/projects/[id]/versions/page.tsx` (JSON modal viewer, rollback & clear actions).

**Verify:** Rollback updates live Timeline Viewer.

---

## Phase 5 — Cache & Feature Flag Control

**Goal:** DB-backed feature flags + Redis cache / circuit-breaker health UI.

**Tasks:**
1. Update `lib/feature-flags.ts` to read from `feature_flags` table with 5s in-memory cache.
2. `app/api/admin/flags/route.ts` (GET & PATCH).
3. `app/api/admin/cache/health/route.ts` (Redis latency, circuit breaker cooldown state).
4. `app/api/admin/cache/invalidate/route.ts` (POST SCAN + DEL pattern).
5. `app/admin/cache/page.tsx` (Flag switches, health card, manual invalidation form).

**Verify:** Toggle flag off → verified live without redeploy.

---

## Phase 6 — Feedback & Chat Moderation

**Goal:** Cross-project view and moderation of feedback and chat.

**Tasks:**
1. `app/api/admin/feedback/route.ts` (GET cross-project paginated feedback).
2. `app/api/admin/feedback/[id]/route.ts` (PATCH status, DELETE item, bust feedbackKey).
3. `app/api/admin/chat/messages/[id]/route.ts` (DELETE chat message, bust chatKey).
4. `app/admin/feedback/page.tsx` (Feedback table & moderation actions).

**Verify:** Deleted feedback disappears from project tab immediately.

---

## Phase 7 — Community (Posts) Moderation

**Goal:** Moderate the social feed.

**Tasks:**
1. `app/api/admin/posts/route.ts` (GET all posts with counts).
2. `app/api/admin/posts/[id]/route.ts` (DELETE cascade in transaction, log action).
3. `app/admin/posts/page.tsx` (Posts table & delete action).

**Verify:** Deleted post disappears from feed.

---

## Phase 8 — System Metrics Dashboard

**Goal:** Live-updating system health and activity metrics.

**Tasks:**
1. `app/api/admin/metrics/route.ts` (Redis health, PG pool stats, user/project/presence counts, 24h audit summary).
2. `app/admin/metrics/page.tsx` (Polling stat cards every 15-30s).

**Verify:** Presence count reflects multi-session test users.

---

## Phase 9 — Audit Log Viewer & Session Security

**Goal:** Audit trail viewer and session revocation.

**Tasks:**
1. `app/api/admin/audit-log/route.ts` (GET paginated, filtered audit entries joined with admin user).
2. `app/admin/audit-log/page.tsx` (Audit table with pretty JSON viewer).
3. `app/api/admin/users/[id]/revoke-session/route.ts` (POST session revocation).

**Verify:** All admin actions appear in audit log viewer.

---

## Phase 10 — Visual Polish Pass

**Goal:** Seamless Vercel/Aceternity-inspired UI alignment with Charcoal/Red design tokens.

**Tasks:**
1. Replace default tables/buttons with dashboard component patterns.
2. Add loading skeletons.
3. Add empty states.
4. Add consistent confirmation modals for destructive actions.
5. Add admin navigation link/breadcrumb for admin users.

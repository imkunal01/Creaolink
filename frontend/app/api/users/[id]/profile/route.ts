import { NextRequest, NextResponse } from "next/server";
import { getPool, getAuthUser } from "@/lib/db";
import { readThroughCache, buildCacheKey } from "@/lib/cache";
import { flags } from "@/lib/feature-flags";

// Query real contribution activity for a user across the last 364 days
// Returns a map of ISO date string (YYYY-MM-DD) → count
async function getRealActivityMap(
  db: Awaited<ReturnType<typeof getPool>>,
  userId: string
): Promise<Record<string, number>> {
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - 364);
  const since = sinceDate.toISOString();

  const [projectCreations, projectUpdates, versionCreations, feedbackRows, postRows] =
    await Promise.all([
      // Projects created by user
      db.query(
        `SELECT DATE(created_at AT TIME ZONE 'UTC') AS day, COUNT(*)::int AS cnt
         FROM projects
         WHERE created_by = $1 AND created_at >= $2
         GROUP BY day`,
        [userId, since]
      ),
      // Projects updated by user (update events)
      db.query(
        `SELECT DATE(updated_at AT TIME ZONE 'UTC') AS day, COUNT(*)::int AS cnt
         FROM projects
         WHERE created_by = $1 AND updated_at >= $2 AND updated_at::date != created_at::date
         GROUP BY day`,
        [userId, since]
      ),
      // Version commits on user's projects
      db.query(
        `SELECT DATE(v.created_at AT TIME ZONE 'UTC') AS day, COUNT(*)::int AS cnt
         FROM versions v
         INNER JOIN projects p ON p.id = v.project_id
         WHERE p.created_by = $1 AND v.created_at >= $2
         GROUP BY day`,
        [userId, since]
      ),
      // Feedback left by user
      db.query(
        `SELECT DATE(created_at AT TIME ZONE 'UTC') AS day, COUNT(*)::int AS cnt
         FROM feedback
         WHERE created_by = $1 AND created_at >= $2
         GROUP BY day`,
        [userId, since]
      ),
      // Posts created by user
      db.query(
        `SELECT DATE(created_at AT TIME ZONE 'UTC') AS day, COUNT(*)::int AS cnt
         FROM posts
         WHERE user_id = $1 AND created_at >= $2
         GROUP BY day`,
        [userId, since]
      ),
    ]);

  const activityMap: Record<string, number> = {};

  for (const result of [projectCreations, projectUpdates, versionCreations, feedbackRows, postRows]) {
    for (const row of result.rows as { day: string | Date; cnt: number }[]) {
      // day comes back as a Date object from pg — format to YYYY-MM-DD
      const dateKey =
        row.day instanceof Date
          ? row.day.toISOString().slice(0, 10)
          : String(row.day).slice(0, 10);
      activityMap[dateKey] = (activityMap[dateKey] ?? 0) + row.cnt;
    }
  }

  return activityMap;
}

function buildProfileCopy(role: string, name: string, projectCount: number) {
  if (role === "freelancer") {
    return {
      headline: "Freelance collaborator",
      bio: `${name} shares project updates, delivery notes, and portfolio snapshots with clients and collaborators across ${Math.max(projectCount, 1)} active creative threads.`,
    };
  }

  if (role === "admin") {
    return {
      headline: "Workspace operator",
      bio: `${name} oversees delivery systems, collaborates across teams, and keeps feedback loops moving with transparent project rituals.`,
    };
  }

  return {
    headline: "Project owner",
    bio: `${name} runs project strategy, review workflows, and public-facing updates so collaborators always know what shipped and what comes next.`,
  };
}

// ── Static profile blob (Option A: viewer-agnostic) ──────────────────────────
// Excludes isFollowing / isMutual which are fetched live per viewer.
async function computeStaticProfile(id: string) {
  const db = await getPool();

  const [
    userResult,
    portfolioResult,
    followersCountResult,
    followingCountResult,
    followersListResult,
    followingListResult,
    activityMap,
  ] = await Promise.all([
    db.query(
      "SELECT id, name, email, username, role, created_at, avatar_url, bio, headline, company, location, website, status_text, status_emoji FROM users WHERE id = $1",
      [id]
    ),
    db.query(
      `SELECT id, title, description, status, updated_at, visibility
       FROM projects
       WHERE created_by = $1
       ORDER BY updated_at DESC
       LIMIT 20`,
      [id]
    ),
    db.query("SELECT COUNT(*)::int AS count FROM user_follows WHERE following_id = $1", [id]),
    db.query("SELECT COUNT(*)::int AS count FROM user_follows WHERE follower_id = $1", [id]),
    db.query(
      `SELECT u.id, u.name, u.username, u.role, u.avatar_url, u.bio
       FROM user_follows uf
       INNER JOIN users u ON u.id = uf.follower_id
       WHERE uf.following_id = $1
       ORDER BY uf.created_at DESC
       LIMIT 20`,
      [id]
    ),
    db.query(
      `SELECT u.id, u.name, u.username, u.role, u.avatar_url, u.bio
       FROM user_follows uf
       INNER JOIN users u ON u.id = uf.following_id
       WHERE uf.follower_id = $1
       ORDER BY uf.created_at DESC
       LIMIT 20`,
      [id]
    ),
    getRealActivityMap(db, id),
  ]);

  if (userResult.rows.length === 0) return null;

  const profile = userResult.rows[0] as {
    id: string;
    name: string;
    email: string;
    username: string;
    role: string;
    created_at: string;
    avatar_url: string | null;
    bio: string | null;
    headline: string | null;
    company: string | null;
    location: string | null;
    website: string | null;
    status_text: string | null;
    status_emoji: string | null;
  };

  const portfolio = portfolioResult.rows;
  const followers = followersCountResult.rows[0]?.count ?? 0;
  const following = followingCountResult.rows[0]?.count ?? 0;
  const reputation = Math.min(100, portfolio.length * 10 + followers * 2 + following);
  const copy = buildProfileCopy(profile.role, profile.name, portfolio.length);

  return {
    profile: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      username: profile.username,
      role: profile.role,
      created_at: profile.created_at,
      avatar_url: profile.avatar_url || null,
      bio: profile.bio || copy.bio,
      headline: profile.headline || copy.headline,
      company: profile.company || null,
      location: profile.location || null,
      website: profile.website || null,
      status_text: profile.status_text || null,
      status_emoji: profile.status_emoji || null,
      profile_visibility: "public" as const,
    },
    portfolio,
    followers,
    following,
    followersList: followersListResult.rows,
    followingList: followingListResult.rows,
    reputation,
    activityGraph: activityMap,
    skills:
      profile.role === "freelancer"
        ? ["Video Editing", "Motion Graphics", "Client Review", "Color Grading"]
        : ["Project Planning", "Creative Direction", "Review Systems", "Production"],
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startedAt = Date.now();
  try {
    const me = await getAuthUser(request);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const db = await getPool();

    // Phase 4 (Option A): cache the static blob; fetch viewer-specific state live.
    const cacheKey = buildCacheKey("profile", id);

    const staticData = flags.cacheProfile
      ? await readThroughCache({
          key: cacheKey,
          ttlSeconds: 120,
          source: "api/users/profile",
          compute: () => computeStaticProfile(id),
        })
      : await computeStaticProfile(id);

    if (!staticData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Live: viewer-specific follow state (never cached).
    const [followStateResult, reverseFollowResult] = await Promise.all([
      db.query("SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2", [me.id, id]),
      db.query("SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2", [id, me.id]),
    ]);

    const response = NextResponse.json({
      ...staticData,
      isFollowing: followStateResult.rows.length > 0,
      isMutual: followStateResult.rows.length > 0 && reverseFollowResult.rows.length > 0,
    });
    response.headers.set("x-response-time", String(Date.now() - startedAt));
    return response;
  } catch (err) {
    console.error("User profile error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getAuthUser(request);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (me.id !== id && me.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { avatar_url, name, headline, bio, company, location, website, status_text, status_emoji } = body;

    const db = await getPool();
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${idx++}`);
      values.push(avatar_url);
    }
    if (name !== undefined && typeof name === "string" && name.trim()) {
      updates.push(`name = $${idx++}`);
      values.push(name.trim());
    }
    if (headline !== undefined) {
      updates.push(`headline = $${idx++}`);
      values.push(headline);
    }
    if (bio !== undefined) {
      updates.push(`bio = $${idx++}`);
      values.push(bio);
    }
    if (company !== undefined) {
      updates.push(`company = $${idx++}`);
      values.push(company);
    }
    if (location !== undefined) {
      updates.push(`location = $${idx++}`);
      values.push(location);
    }
    if (website !== undefined) {
      updates.push(`website = $${idx++}`);
      values.push(website);
    }
    if (status_text !== undefined) {
      updates.push(`status_text = $${idx++}`);
      values.push(status_text);
    }
    if (status_emoji !== undefined) {
      updates.push(`status_emoji = $${idx++}`);
      values.push(status_emoji);
    }

    if (updates.length > 0) {
      values.push(id);
      await db.query(`UPDATE users SET ${updates.join(", ")} WHERE id = $${idx}`, values);
    }

    const updatedUser = await db.query(
      "SELECT id, name, email, username, role, created_at, avatar_url, bio, headline, company, location, website, status_text, status_emoji FROM users WHERE id = $1",
      [id]
    );

    return NextResponse.json({
      success: true,
      profile: updatedUser.rows[0],
    });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

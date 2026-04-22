import { NextRequest, NextResponse } from "next/server";
import { getPool, getAuthUser } from "@/lib/db";

function stableContributionSeed(userId: string, week: number) {
  return userId
    .split("")
    .reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + week + 1), week * 17);
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getAuthUser(request);
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const db = await getPool();

    const [
      userResult,
      portfolioResult,
      followersCountResult,
      followingCountResult,
      followersListResult,
      followingListResult,
      followStateResult,
      reverseFollowResult,
    ] = await Promise.all([
      db.query("SELECT id, name, email, role, created_at FROM users WHERE id = $1", [id]),
      db.query(
        `SELECT id, title, description, status, updated_at
         FROM projects
         WHERE created_by = $1 AND visibility = 'public'
         ORDER BY updated_at DESC
         LIMIT 12`,
        [id]
      ),
      db.query("SELECT COUNT(*)::int AS count FROM user_follows WHERE following_id = $1", [id]),
      db.query("SELECT COUNT(*)::int AS count FROM user_follows WHERE follower_id = $1", [id]),
      db.query(
        `SELECT u.id, u.name, u.role
         FROM user_follows uf
         INNER JOIN users u ON u.id = uf.follower_id
         WHERE uf.following_id = $1
         ORDER BY uf.created_at DESC
         LIMIT 8`,
        [id]
      ),
      db.query(
        `SELECT u.id, u.name, u.role
         FROM user_follows uf
         INNER JOIN users u ON u.id = uf.following_id
         WHERE uf.follower_id = $1
         ORDER BY uf.created_at DESC
         LIMIT 8`,
        [id]
      ),
      db.query("SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2", [me.id, id]),
      db.query("SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2", [id, me.id]),
    ]);

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile = userResult.rows[0] as {
      id: string;
      name: string;
      email: string;
      role: string;
      created_at: string;
    };

    const portfolio = portfolioResult.rows;
    const followers = followersCountResult.rows[0]?.count ?? 0;
    const following = followingCountResult.rows[0]?.count ?? 0;
    const reputation = Math.min(100, portfolio.length * 10 + followers * 2 + following);
    const copy = buildProfileCopy(profile.role, profile.name, portfolio.length);

    return NextResponse.json({
      profile: {
        ...profile,
        bio: copy.bio,
        headline: copy.headline,
        profile_visibility: "public",
      },
      portfolio,
      followers,
      following,
      followersList: followersListResult.rows,
      followingList: followingListResult.rows,
      reputation,
      activityGraph: Array.from({ length: 12 }).map((_, index) => ({
        week: index + 1,
        contributions: stableContributionSeed(id, index + 1) % 8,
      })),
      skills:
        profile.role === "freelancer"
          ? ["Video Editing", "Motion Graphics", "Client Communication", "Color Grading"]
          : ["Project Planning", "Creative Direction", "Review Systems", "Team Operations"],
      isFollowing: followStateResult.rows.length > 0,
      isMutual: followStateResult.rows.length > 0 && reverseFollowResult.rows.length > 0,
    });
  } catch (err) {
    console.error("User profile error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


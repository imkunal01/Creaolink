import { Pool } from "pg";

let pool: Pool | null = null;
let _initialized = false;

function createPool(): Pool {
  const connStr =
    process.env.DATABASE_URL ||
    "postgresql://postgres:kunal@localhost:5432/myapp";
  const isSupabase = connStr.includes("supabase");

  return new Pool({
    connectionString: connStr,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
    max: 10,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });
}

export async function getPool(): Promise<Pool> {
  if (!pool) {
    pool = createPool();
  }
  if (!_initialized) {
    _initialized = true;
    try {
      await initTables();
    } catch (err) {
      console.error("initTables failed (tables may already exist):", err);
      // Don't block — tables likely already exist in production
    }
  }
  return pool;
}

async function initTables() {
  const client = await pool!.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE,
        password TEXT NOT NULL DEFAULT '',
        role TEXT NOT NULL CHECK(role IN ('client', 'freelancer', 'admin')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        deadline TEXT,
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'approved', 'pending')),
        current_version_id TEXT,
        sync_code TEXT UNIQUE,
        created_by TEXT NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        visibility TEXT NOT NULL DEFAULT 'private' CHECK(visibility IN ('public', 'private', 'followers-only'))
      );

      CREATE TABLE IF NOT EXISTS project_members (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id),
        user_id TEXT NOT NULL REFERENCES users(id),
        permission TEXT NOT NULL DEFAULT 'editor' CHECK(permission IN ('admin', 'editor', 'viewer')),
        UNIQUE(project_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS versions (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id),
        version_name TEXT NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        timeline_data JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id),
        version_id TEXT NOT NULL REFERENCES versions(id),
        created_by TEXT NOT NULL REFERENCES users(id),
        type TEXT NOT NULL DEFAULT 'General',
        priority TEXT NOT NULL DEFAULT 'Medium',
        "timestamp" TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'resolved')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS freelancer_presence (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id),
        user_id TEXT NOT NULL REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'offline' CHECK(status IN ('online', 'away', 'offline')),
        current_task TEXT NOT NULL DEFAULT '',
        hours_logged NUMERIC NOT NULL DEFAULT 0,
        last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(project_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS user_follows (
        id TEXT PRIMARY KEY,
        follower_id TEXT NOT NULL REFERENCES users(id),
        following_id TEXT NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(follower_id, following_id),
        CHECK(follower_id <> following_id)
      );

      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        project_id TEXT REFERENCES projects(id),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT[] NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS post_reactions (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL REFERENCES posts(id),
        user_id TEXT NOT NULL REFERENCES users(id),
        reaction TEXT NOT NULL DEFAULT 'like',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(post_id, user_id, reaction)
      );

      CREATE TABLE IF NOT EXISTS post_comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL REFERENCES posts(id),
        user_id TEXT NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Add sync code to existing projects table if it doesn't exist
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS sync_code TEXT UNIQUE;
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private';

      -- Add member permissions for team management
      ALTER TABLE project_members ADD COLUMN IF NOT EXISTS permission TEXT NOT NULL DEFAULT 'editor';
      
      -- Add timeline_data to versions table if it doesn't exist
      ALTER TABLE versions ADD COLUMN IF NOT EXISTS timeline_data JSONB;

      -- Add username support for user search and quick mentions
      ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;

      WITH ranked_usernames AS (
        SELECT
          u.id,
          COALESCE(
            NULLIF(
              LOWER(REGEXP_REPLACE(SPLIT_PART(u.email, '@', 1), '[^a-zA-Z0-9_]+', '_', 'g')),
              ''
            ),
            'user'
          ) AS base,
          ROW_NUMBER() OVER (
            PARTITION BY COALESCE(
              NULLIF(
                LOWER(REGEXP_REPLACE(SPLIT_PART(u.email, '@', 1), '[^a-zA-Z0-9_]+', '_', 'g')),
                ''
              ),
              'user'
            )
            ORDER BY u.created_at, u.id
          ) AS rn
        FROM users u
        WHERE u.username IS NULL OR u.username = ''
      )
      UPDATE users u
      SET username = CASE
        WHEN r.rn = 1 THEN LEFT(r.base, 24)
        ELSE LEFT(r.base, 20) || r.rn::TEXT
      END
      FROM ranked_usernames r
      WHERE u.id = r.id;

      CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique_idx ON users(username);

      -- ── Performance indexes (idempotent) ──────────────────────────────────────
      -- Feed: project_members lookup by user (activity query)
      CREATE INDEX IF NOT EXISTS idx_pm_user_id ON project_members(user_id);
      -- Feed: project visibility + owner ordering
      CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);
      -- Feed: follow graph traversal
      CREATE INDEX IF NOT EXISTS idx_uf_follower_id ON user_follows(follower_id);
      CREATE INDEX IF NOT EXISTS idx_uf_following_id ON user_follows(following_id);
      -- Feed/Posts: post ordering and authorship
      CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
      -- Feed: feedback open-count aggregation
      CREATE INDEX IF NOT EXISTS idx_feedback_project_status ON feedback(project_id, status);
      -- Profile: portfolio lookup by creator + ordering
      CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by, updated_at DESC);
      -- Reactions / comments aggregation
      CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON post_reactions(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
    `, []);
  } finally {
    client.release();
  }
}

// ── Helper: get authenticated user from request header ──
export async function getAuthUser(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return null;
  const db = await getPool();
  try {
    const { rows } = await db.query(
      "SELECT id, name, email, username, role FROM users WHERE id = $1",
      [userId]
    );
    return (rows[0] as { id: string; name: string; email: string; username: string; role: string }) ?? null;
  } catch (err) {
    if ((err as { code?: string }).code !== "42703") {
      throw err;
    }

    const { rows } = await db.query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [userId]
    );
    if (rows.length === 0) return null;
    return { ...rows[0], username: "" } as { id: string; name: string; email: string; username: string; role: string };
  }
}

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
    max: 5,
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
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS project_members (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id),
        user_id TEXT NOT NULL REFERENCES users(id),
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

      -- Add sync code to existing projects table if it doesn't exist
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS sync_code TEXT UNIQUE;
      
      -- Add timeline_data to versions table if it doesn't exist
      ALTER TABLE versions ADD COLUMN IF NOT EXISTS timeline_data JSONB;
    `);
  } finally {
    client.release();
  }
}

// ── Helper: get authenticated user from request header ──
export async function getAuthUser(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return null;
  const db = await getPool();
  const { rows } = await db.query(
    "SELECT id, name, email, role FROM users WHERE id = $1",
    [userId]
  );
  return (rows[0] as { id: string; name: string; email: string; role: string }) ?? null;
}

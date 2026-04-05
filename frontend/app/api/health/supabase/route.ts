import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  const source = "api/health/supabase";
  const dbUrl = process.env.DATABASE_URL || "";
  const startedAt = Date.now();

  let dbHost = "invalid-url";
  try {
    dbHost = new URL(dbUrl).host;
  } catch {
    dbHost = "invalid-url";
  }

  try {
    const pool = await getPool();
    await pool.query("SELECT 1");

    console.info("[DirectDBCheck] Connection successful", {
      source,
      dbHost,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      {
        ok: true,
        source,
        mode: "direct-db-url",
        dbHost,
      },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    console.error("[DirectDBCheck] Connection failed", {
      source,
      dbHost,
      durationMs: Date.now() - startedAt,
      message,
    });

    return NextResponse.json(
      {
        ok: false,
        source,
        mode: "direct-db-url",
        dbHost,
        error: message,
      },
      { status: 503 }
    );
  }
}

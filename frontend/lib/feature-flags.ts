import { getPool } from "./db";

export interface FlagState {
  cacheFeed: boolean;
  cacheProfile: boolean;
  cacheProject: boolean;
}

const DEFAULT_FLAGS: FlagState = {
  cacheFeed: process.env.CACHE_FEED !== "false",
  cacheProfile: process.env.CACHE_PROFILE !== "false",
  cacheProject: process.env.CACHE_PROJECT !== "false",
};

let inMemoryFlags: FlagState = { ...DEFAULT_FLAGS };
let lastFetchedAt = 0;
const IN_MEMORY_TTL_MS = 5000; // 5-second in-memory TTL

let fetchPromise: Promise<FlagState> | null = null;

async function fetchFlagsFromDb(): Promise<FlagState> {
  try {
    const db = await getPool();
    const { rows } = await db.query<{ key: string; enabled: boolean }>(
      "SELECT key, enabled FROM feature_flags"
    );

    const nextFlags = { ...DEFAULT_FLAGS };
    for (const row of rows) {
      if (row.key === "cacheFeed") nextFlags.cacheFeed = Boolean(row.enabled);
      if (row.key === "cacheProfile") nextFlags.cacheProfile = Boolean(row.enabled);
      if (row.key === "cacheProject") nextFlags.cacheProject = Boolean(row.enabled);
    }

    inMemoryFlags = nextFlags;
    lastFetchedAt = Date.now();
    return nextFlags;
  } catch {
    // If DB is initializing or query fails, fall back to current in-memory flags
    return inMemoryFlags;
  } finally {
    fetchPromise = null;
  }
}

function ensureFreshFlags() {
  if (Date.now() - lastFetchedAt > IN_MEMORY_TTL_MS && !fetchPromise) {
    fetchPromise = fetchFlagsFromDb();
  }
}

// Initial server pre-fetch
if (typeof window === "undefined") {
  ensureFreshFlags();
}

/**
 * Invalidate in-memory flags cache immediately (called by admin flag mutations)
 */
export function invalidateFlagsCache(): void {
  lastFetchedAt = 0;
  fetchPromise = fetchFlagsFromDb();
}

/**
 * Direct async fetch guaranteeing latest DB state
 */
export async function getFlagsAsync(): Promise<FlagState> {
  if (Date.now() - lastFetchedAt > IN_MEMORY_TTL_MS) {
    return fetchFlagsFromDb();
  }
  return inMemoryFlags;
}

/**
 * Drop-in replacement for existing flags.cacheFeed, flags.cacheProfile, flags.cacheProject
 */
export const flags = {
  get cacheFeed(): boolean {
    ensureFreshFlags();
    return inMemoryFlags.cacheFeed;
  },
  get cacheProfile(): boolean {
    ensureFreshFlags();
    return inMemoryFlags.cacheProfile;
  },
  get cacheProject(): boolean {
    ensureFreshFlags();
    return inMemoryFlags.cacheProject;
  },
};

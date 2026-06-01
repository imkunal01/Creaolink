/**
 * instrumentation.ts — Next.js server instrumentation hook
 *
 * Runs ONCE when the Next.js server process starts (both dev and production).
 * Used here to:
 *   1. Log a boot banner with environment info
 *   2. Run a Redis health check and log the result
 *   3. Warn loudly if Redis is not configured
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on the Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME !== "edge") {
    const { runStartupHealthCheck } = await import("./lib/startup");
    await runStartupHealthCheck();
  }
}

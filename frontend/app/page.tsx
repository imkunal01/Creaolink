import Link from "next/link";
import ColorBends from "./components/ColorBends";

export default function Home() {
  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-bg/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            CreaoLink
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/auth/login"
              className="rounded-lg border border-white/20 px-3 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-black transition-transform hover:scale-[1.02]"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden border-b border-white/10">
          <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_20%,rgba(255,92,122,0.25),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(0,255,209,0.2),transparent_35%),linear-gradient(145deg,#050507_0%,#0a0b13_45%,#120816_100%)]" />
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-80">
            <ColorBends
              colors={["#ff5c7a", "#8a5cff", "#00ffd1"]}
              rotation={0}
              speed={0.2}
              scale={1}
              frequency={1}
              warpStrength={1}
              mouseInfluence={1}
              parallax={0.5}
              noise={0.1}
              transparent
              autoRotate={0}
              color=""
            />
          </div>

          <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-28">
            <div className="space-y-7">
              <p className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-text-secondary">
                Client to freelancer workflow, unified
              </p>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Launch projects faster.
                <br />
                Ship feedback without chaos.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-gray-300 sm:text-lg">
                CreaoLink gives teams one place to create projects, assign freelancers,
                track versions, and resolve feedback in real time.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/auth/signup"
                  className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
                >
                  Create workspace
                </Link>
                <Link
                  href="/auth/login"
                  className="rounded-xl border border-white/25 bg-black/30 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-black/45"
                >
                  I already have an account
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-black/45 p-5 backdrop-blur-xl sm:p-6">
              <p className="text-xs uppercase tracking-[0.16em] text-text-secondary">
                What teams love
              </p>
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm font-medium text-white">Role-based dashboards</p>
                  <p className="mt-1 text-sm text-gray-300">
                    Clients and freelancers get focused views with only the tools they need.
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm font-medium text-white">Version-safe collaboration</p>
                  <p className="mt-1 text-sm text-gray-300">
                    Push project versions confidently while preserving context and history.
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm font-medium text-white">Feedback that closes loops</p>
                  <p className="mt-1 text-sm text-gray-300">
                    Turn comments into resolved actions and keep every stakeholder aligned.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
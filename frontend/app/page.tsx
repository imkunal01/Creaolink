import Link from "next/link";
import ColorBends from "./components/ColorBends";
import LandingNavbar from "./components/LandingNavbar";

const stats = [
  { label: "Active workspaces", value: "12,500+" },
  { label: "Projects shipped", value: "48,000+" },
  { label: "Avg. feedback resolution", value: "3.2 hrs" },
  { label: "Client satisfaction", value: "98.4%" },
];

const milestones = [
  {
    title: "Project room creation",
    description:
      "Spin up project spaces with goals, owners, scope, and delivery timelines in under two minutes.",
  },
  {
    title: "Freelancer-first collaboration",
    description:
      "Assign contributors, share versions, and keep communication contextual so momentum never breaks.",
  },
  {
    title: "Structured feedback lifecycle",
    description:
      "Convert comments into actions, assign ownership, and track each item from open to resolved.",
  },
];

const values = [
  {
    title: "Clear communication",
    text: "We design for clarity first so every person understands what to do next.",
  },
  {
    title: "Ownership over noise",
    text: "Teams should spend energy delivering outcomes, not chasing scattered feedback threads.",
  },
  {
    title: "Progress you can trust",
    text: "Every version, comment, and status update is visible to the right people at the right time.",
  },
];

const events = [
  {
    name: "CreaoLink Community Townhall",
    date: "May 15, 2026",
    mode: "Live virtual",
    detail: "Roadmap reveal, Q&A with founders, and workflow demos from top agencies.",
  },
  {
    name: "SaaS Workflow Summit",
    date: "June 22, 2026",
    mode: "Bengaluru",
    detail: "A full-day meetup on faster client collaboration, approvals, and version control.",
  },
  {
    name: "Freelancer Growth Lab",
    date: "July 10, 2026",
    mode: "Hybrid",
    detail: "Hands-on sessions for freelancers to improve delivery systems and client visibility.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <LandingNavbar />

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
            <div className="space-y-7 reveal-up">
              <p className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-text-secondary">
                Client to freelancer workflow, unified
              </p>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Build with momentum.
                <br />
                Deliver without workflow chaos.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-gray-300 sm:text-lg">
                CreaoLink brings project planning, freelancer collaboration, approvals,
                versioning, and feedback resolution into one clean operating system for modern teams.
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
                  Book a live demo
                </Link>
              </div>
              <div className="grid max-w-2xl grid-cols-2 gap-3 pt-3 sm:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-lg font-semibold text-white sm:text-xl">{stat.value}</p>
                    <p className="mt-1 text-xs leading-snug text-gray-300">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="animate-float-soft rounded-2xl border border-white/15 bg-black/45 p-5 backdrop-blur-xl sm:p-6">
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
                <div className="rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-4">
                  <p className="text-sm font-medium text-emerald-100">This week on CreaoLink</p>
                  <p className="mt-1 text-sm text-emerald-50/90">
                    942 feedback tasks closed, 1,120 versions submitted, 87 projects shipped.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#07080f]">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">Trusted by product teams, agencies, and scaling studios</p>
            <div className="marquee-strip mt-4 overflow-hidden whitespace-nowrap text-sm text-gray-300/90">
              <span className="marquee-content inline-flex gap-10 pr-10">
                <span>NovoForge Studio</span>
                <span>BlueOrbit Digital</span>
                <span>PixelCraft Labs</span>
                <span>Northlane Products</span>
                <span>MetricMint Agency</span>
                <span>CloudPillar Ventures</span>
                <span>NovaNest Collective</span>
              </span>
              <span className="marquee-content inline-flex gap-10 pr-10" aria-hidden>
                <span>NovoForge Studio</span>
                <span>BlueOrbit Digital</span>
                <span>PixelCraft Labs</span>
                <span>Northlane Products</span>
                <span>MetricMint Agency</span>
                <span>CloudPillar Ventures</span>
                <span>NovaNest Collective</span>
              </span>
            </div>
          </div>
        </section>

        <section id="features" className="border-b border-white/10 bg-[linear-gradient(180deg,#090b14_0%,#090b10_100%)]">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="mb-10 max-w-3xl reveal-up">
              <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">Platform flow</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                A simple system for complex delivery work
              </h2>
              <p className="mt-3 text-gray-300">
                Teams move faster when planning, execution, and review live in one connected timeline.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {milestones.map((item, index) => (
                <article
                  key={item.title}
                  className="reveal-up rounded-2xl border border-white/10 bg-white/[0.03] p-6"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-text-secondary">Step {index + 1}</p>
                  <h3 className="mt-3 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-300">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="border-b border-white/10 bg-[#07070b]">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
            <div className="reveal-up">
              <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">About us</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                We started CreaoLink to remove delivery friction
              </h2>
              <p className="mt-4 text-base leading-relaxed text-gray-300">
                Our team experienced the same recurring pain across agencies and product teams: scattered files,
                unclear ownership, delayed feedback, and status confusion. CreaoLink was built to fix that pattern
                with a workspace where every role can move in sync.
              </p>
              <p className="mt-4 text-base leading-relaxed text-gray-300">
                Our motive is simple: help creators and clients collaborate with confidence, visibility, and speed,
                so great work ships more often and with less stress.
              </p>
            </div>

            <div className="space-y-4">
              {values.map((value, index) => (
                <div
                  key={value.title}
                  className="reveal-up rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <h3 className="text-base font-semibold text-white">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-300">{value.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="events" className="border-b border-white/10 bg-[linear-gradient(130deg,#080912_0%,#0b0a09_100%)]">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="mb-8 max-w-2xl reveal-up">
              <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">Events</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Meet us in upcoming sessions</h2>
              <p className="mt-3 text-gray-300">
                Join product leaders, freelancers, and agency operators learning better collaboration systems.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {events.map((event, index) => (
                <article
                  key={event.name}
                  className="reveal-up rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                  style={{ animationDelay: `${index * 140}ms` }}
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-emerald-200">{event.date}</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{event.name}</h3>
                  <p className="mt-1 text-sm text-gray-400">{event.mode}</p>
                  <p className="mt-3 text-sm leading-relaxed text-gray-300">{event.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="border-b border-white/10 bg-[#07080d]">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
            <div className="reveal-up">
              <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">Contact</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Talk to our team
              </h2>
              <p className="mt-3 max-w-xl text-gray-300">
                Whether you are scaling a freelance network or operating a product team, we can help you design a smoother delivery flow.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/auth/signup"
                  className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
                >
                  Start free trial
                </Link>
                <a
                  href="mailto:hello@creaolink.com"
                  className="rounded-xl border border-white/25 bg-black/20 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-black/40"
                >
                  hello@creaolink.com
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-text-secondary">Head office</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-300">44 Product Lane, Koramangala, Bengaluru, Karnataka 560034</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-text-secondary">Phone</p>
                <p className="mt-2 text-sm text-gray-300">+91 80 4422 1108</p>
                <p className="mt-2 text-sm text-gray-400">Mon-Fri, 9:00 AM to 6:00 PM IST</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.16em] text-text-secondary">Support</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-300">
                  Need onboarding support? Write to support@creaolink.com and we will help you set up your first workspace.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#050609]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-gray-400 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} CreaoLink. Built for teams that ship together.</p>
          <div className="flex flex-wrap gap-4">
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#about" className="transition-colors hover:text-white">About</a>
            <a href="#events" className="transition-colors hover:text-white">Events</a>
            <a href="#contact" className="transition-colors hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
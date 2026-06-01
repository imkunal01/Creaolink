import Link from "next/link";
import type { ReactNode } from "react";
import LandingNavbar from "./components/LandingNavbar";

const stats = [
  { value: "12,500+", label: "Active workspaces" },
  { value: "48k+", label: "Projects shipped" },
  { value: "3.2 hrs", label: "Avg. feedback resolution" },
  { value: "98.4%", label: "Client satisfaction rate" },
];

const features = [
  {
    icon: "01",
    title: "Role-based dashboards",
    description:
      "Clients see what they need to approve. Freelancers see what they need to deliver. No information overload.",
  },
  {
    icon: "02",
    title: "Version-safe collaboration",
    description:
      "Push new versions without losing previous context. Every file keeps a timestamped trail with linked feedback.",
  },
  {
    icon: "03",
    title: "Feedback that resolves",
    description:
      "Comments become trackable tasks with an owner, a due date, and a clear resolved state.",
  },
  {
    icon: "04",
    title: "Structured project rooms",
    description:
      "Spin up scoped workspaces with goals, delivery timelines, and stakeholder assignments in minutes.",
  },
  {
    icon: "05",
    title: "Progress dashboards",
    description:
      "Track velocity, closure rates, and revision loops across projects before delays compound.",
  },
  {
    icon: "06",
    title: "Approval checkpoints",
    description:
      "Build formal review stages into every project so clients approve and freelancers know what is next.",
  },
];

const steps = [
  {
    title: "Create a project room",
    description:
      "Define scope, goals, and delivery timelines. Assign clients and freelancers with role-specific access from the start.",
  },
  {
    title: "Collaborate in context",
    description:
      "Upload versions, leave feedback directly on deliverables, and keep communication tied to the exact work.",
  },
  {
    title: "Close the loop",
    description:
      "Convert feedback to tasks, get sign-off through structured approvals, and ship with version history intact.",
  },
];

const outcomes = [
  {
    tag: "Agency teams",
    value: "31%",
    label: "Faster approvals",
    description:
      "Versioned reviews and structured sign-off stages cut client wait cycles dramatically.",
  },
  {
    tag: "Freelancer pods",
    value: "2.4x",
    label: "Clearer handoffs",
    description:
      "Role-based briefs and owner tags mean contributors always know exactly what is next.",
  },
  {
    tag: "Product studios",
    value: "42%",
    label: "Fewer revision loops",
    description:
      "Mandatory acceptance criteria and templates reduce repetitive back-and-forth.",
  },
];

const testimonials = [
  {
    initials: "AM",
    name: "Arjun Mehra",
    role: "Creative Director, BlueOrbit Studio",
    quote:
      "Finally a tool that separates what clients see from what my team sees. We stopped getting file-status messages within a week.",
  },
  {
    initials: "SR",
    name: "Simran Rao",
    role: "Freelance UX Lead",
    quote:
      "The feedback-to-task conversion alone saved us hours every week. No more rebuilding task lists from chat threads.",
  },
  {
    initials: "KD",
    name: "Kavya Dalal",
    role: "Head of Product, PixelCraft Labs",
    quote:
      "We onboarded a remote team in days. The role setup is intuitive and the version history saved context during review.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "No card required",
    description: "For small teams validating creative workflow.",
    points: ["Up to 3 active projects", "Basic feedback tracking", "Client and freelancer roles", "Email support"],
    featured: false,
  },
  {
    name: "Growth",
    price: "$23",
    period: "per workspace / month",
    description: "For growing teams with active delivery pipelines.",
    points: ["Unlimited projects", "Version-safe approvals", "Custom review templates", "Priority support", "Analytics dashboard"],
    featured: true,
  },
  {
    name: "Scale",
    price: "Custom",
    period: "Volume pricing available",
    description: "For high-volume agencies and multi-team operations.",
    points: ["Multi-team governance", "Advanced analytics", "SSO and audit controls", "Dedicated success manager"],
    featured: false,
  },
];

function SectionHeader({
  label,
  title,
  children,
  centered = false,
}: {
  label: string;
  title: ReactNode;
  children?: ReactNode;
  centered?: boolean;
}) {
  return (
    <div className={centered ? "landing-section-head center" : "landing-section-head"}>
      <p className="landing-section-label">{label}</p>
      <h2 className="landing-section-title">{title}</h2>
      {children ? <p className="landing-section-copy">{children}</p> : null}
    </div>
  );
}

function DashboardPreview() {
  const rows = [
    ["Brand identity guide", "Sara M.", "v4.1", "In review"],
    ["Homepage redesign", "Kunal A.", "v2.0", "Active"],
    ["Social media kit", "Priya R.", "v1.3", "Done"],
    ["Motion guidelines", "Dev T.", "v1.0", "Active"],
  ];

  return (
    <div className="preview-shell">
      <div className="preview-glow" />
      <div className="preview-card">
        <div className="preview-topbar">
          <span className="preview-dot red" />
          <span className="preview-dot yellow" />
          <span className="preview-dot green" />
          <div className="preview-url">app.creaolink.com/workspace/nova-rebrand</div>
        </div>
        <div className="preview-body">
          <aside className="preview-sidebar">
            <div className="preview-logo">
              Creao<span>Link</span>
            </div>
            {["Projects", "Feedback", "Versions", "Team", "Analytics"].map((item, index) => (
              <div className={index === 0 ? "preview-nav active" : "preview-nav"} key={item}>
                <span className="preview-nav-icon" />
                {item}
                {index === 0 ? <span className="preview-nav-pulse" /> : null}
              </div>
            ))}
            <div className="preview-note">4 feedback items need resolution</div>
          </aside>
          <div className="preview-main">
            <div className="preview-main-head">
              <p>Nova Rebrand - Active Projects</p>
              <span>Live</span>
            </div>
            <div className="preview-stats">
              {[
                ["12", "Open tasks"],
                ["3", "In review"],
                ["8", "Versions"],
                ["94%", "On track"],
              ].map(([value, label], index) => (
                <div className="preview-stat" key={label}>
                  <strong className={index === 0 ? "accent" : ""}>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div className="preview-grid preview-grid-head">
              <span>Deliverable</span>
              <span>Assignee</span>
              <span>Version</span>
              <span>Status</span>
            </div>
            {rows.map(([name, assignee, version, status]) => (
              <div className="preview-grid preview-row" key={name}>
                <strong>{name}</strong>
                <span>{assignee}</span>
                <span>{version}</span>
                <span className={`preview-status ${status.toLowerCase().replace(" ", "-")}`}>{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="landing-page">
      <LandingNavbar />

      <main>
        <section className="landing-hero">
          <div className="hero-badge">
            <span />
            New - role-based dashboards now in beta
          </div>
          <h1 className="hero-title">
            One workspace for
            <br />
            <em>clients, freelancers,</em>
            <br />
            and every version.
          </h1>
          <p className="hero-copy">
            Stop losing work to scattered files, missed feedback, and unclear ownership. CreaoLink keeps every
            project moving from brief to shipped.
          </p>
          <div className="hero-actions">
            <Link href="/auth/signup" className="cl-btn primary large">
              Create free workspace
            </Link>
            <Link href="/auth/login" className="cl-btn ghost large">
              <span className="play-icon" aria-hidden="true" />
              Watch demo
            </Link>
          </div>
          <div className="hero-proof">
            <div className="avatar-stack" aria-hidden="true">
              {["AK", "SR", "MP", "JL"].map((avatar, index) => (
                <span className={`avatar avatar-${index + 1}`} key={avatar}>
                  {avatar}
                </span>
              ))}
            </div>
            <p>
              Trusted by <strong>500+ teams</strong> across agencies and studios
            </p>
          </div>

          <DashboardPreview />
        </section>

        <section className="stats-band" aria-label="CreaoLink performance metrics">
          {stats.map((stat) => (
            <div className="stat-tile" key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </section>

        <section className="landing-section" id="features">
          <SectionHeader label="Features" title={<>Everything a modern delivery team needs</>}>
            Built for the gap between loose docs and rigid ticketing. CreaoLink fits the way creative teams actually
            work.
          </SectionHeader>
          <div className="features-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <span className="feature-icon">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section" id="how">
          <SectionHeader label="How it works" title={<>Three steps to <em>zero</em> workflow chaos</>}>
            A simple operating rhythm for agencies, studios, and freelancer pods.
          </SectionHeader>
          <div className="how-grid">
            <div className="how-steps">
              {steps.map((step, index) => (
                <article className="how-step" key={step.title}>
                  <span>{`Step 0${index + 1}`}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
            <div className="feedback-panel">
              <p className="panel-label">Live feedback thread - Nova Rebrand</p>
              {[
                ["SL", "Sarah L.", "Client", "The hero color feels too warm. Can we try the cooler palette from v2.1?", "Convert to task"],
                ["KA", "Kunal A.", "Designer", "On it. Uploading v4.2 with the cooler palette applied across all hero variants.", ""],
                ["PR", "Priya R.", "PM", "Feedback task created and assigned. Approval checkpoint set for Friday 5 PM.", "Resolved"],
              ].map(([initials, name, role, message, action], index) => (
                <div className="feedback-item" key={name}>
                  <span className={`feedback-avatar avatar-${index + 1}`}>{initials}</span>
                  <div>
                    <div className="feedback-meta">
                      <strong>{name}</strong>
                      <span>{role}</span>
                    </div>
                    <p>{message}</p>
                    {action ? <button type="button">{action}</button> : null}
                  </div>
                </div>
              ))}
              <div className="version-note">
                <strong>v4.2</strong> uploaded by Kunal A. - 2 files - pending review
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section">
          <SectionHeader label="Outcomes" title={<>Numbers teams actually care about</>} />
          <div className="outcomes-grid">
            {outcomes.map((outcome) => (
              <article className="outcome-card" key={outcome.label}>
                <span>{outcome.tag}</span>
                <strong>{outcome.value}</strong>
                <h3>{outcome.label}</h3>
                <p>{outcome.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section" id="testimonials">
          <SectionHeader label="Reviews" title={<>What teams say after switching</>} />
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <article className="testimonial-card" key={testimonial.name}>
                <p className="stars">5/5</p>
                <blockquote>{testimonial.quote}</blockquote>
                <div className="testimonial-author">
                  <span className={`avatar avatar-${index + 1}`}>{testimonial.initials}</span>
                  <div>
                    <strong>{testimonial.name}</strong>
                    <p>{testimonial.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section" id="pricing">
          <SectionHeader centered label="Pricing" title={<>Simple pricing, no surprises</>}>
            Start free, standardize your process, and scale when your delivery volume grows.
          </SectionHeader>
          <div className="pricing-grid">
            {plans.map((plan) => (
              <article className={plan.featured ? "price-card featured" : "price-card"} key={plan.name}>
                <p className="price-name">{plan.name}</p>
                <strong className="price-value">{plan.price}</strong>
                <span className="price-period">{plan.period}</span>
                <p className="price-desc">{plan.description}</p>
                <ul>
                  {plan.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <Link href="/auth/signup" className={plan.featured ? "cl-btn primary full" : "cl-btn ghost full"}>
                  {plan.featured ? "Start free trial" : "Get started"}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section cta-section">
          <div className="cta-wrap">
            <h2>
              Ship more. <em>Chase less.</em>
              <br />
              Start in 2 minutes.
            </h2>
            <p>No card required. Cancel whenever. First workspace is free forever.</p>
            <div className="hero-actions">
              <Link href="/auth/signup" className="cl-btn primary large">
                Create free workspace
              </Link>
              <Link href="/auth/login" className="cl-btn ghost large">
                Book a demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div>
          <Link href="/" className="footer-logo">
            Creao<span>Link</span>
          </Link>
          <p>The operating system for client-freelancer delivery teams.</p>
        </div>
        <nav>
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#pricing">Pricing</a>
          <a href="#testimonials">Reviews</a>
        </nav>
        <p>(c) {new Date().getFullYear()} CreaoLink. Built for teams that ship together.</p>
      </footer>
    </div>
  );
}

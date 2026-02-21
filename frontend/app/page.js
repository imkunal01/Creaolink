import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container">
      <section className="hero-section">
        <h1 className="hero-title">
          Connect with <span className="gradient-text">World-Class</span> Video Editors
        </h1>
        <p className="hero-subtitle">
          CreaoLink is where creators find their perfect video editing partner. 
          No more endless revisions, broken workflows, or WhatsApp chaos.
        </p>
        <div className="stack hero-actions">
          <Link className="button large" href="/editors">
            Browse Editors
          </Link>
          <Link className="button large secondary" href="/register">
            Get Started Free
          </Link>
        </div>
      </section>

      <section className="features-section">
        <h2>Why CreaoLink?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">🎬</span>
            <h3>Curated Editors</h3>
            <p className="muted">
              Hand-picked video editors specializing in cinematic, documentary, 
              short-form, and motion graphics.
            </p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📝</span>
            <h3>Timeline Feedback</h3>
            <p className="muted">
              Leave precise timestamp-based comments directly on video versions. 
              No more vague emails.
            </p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🔄</span>
            <h3>Version Control</h3>
            <p className="muted">
              Track every revision with clear approval workflows. 
              Know exactly what changed and when.
            </p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">⚡</span>
            <h3>Fast Turnaround</h3>
            <p className="muted">
              See real response times and availability upfront. 
              No guessing games.
            </p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="card cta-card">
          <h2>Ready to find your editor?</h2>
          <p className="muted">
            Join creators who've streamlined their video production workflow.
          </p>
          <div className="stack">
            <Link className="button" href="/register?role=CLIENT">
              I'm a Creator
            </Link>
            <Link className="button secondary" href="/register?role=EDITOR">
              I'm an Editor
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
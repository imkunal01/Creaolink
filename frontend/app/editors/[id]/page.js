import Link from "next/link";
import { notFound } from "next/navigation";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

async function loadEditor(id) {
  const result = await query(
    `
    SELECT
      ep.id,
      ep.headline,
      ep.summary,
      ep.rating,
      ep.hourly_rate,
      ep.availability,
      ep.response_time_hours,
      ep.completed_projects,
      ep.languages,
      ep.timezone,
      ep.turnaround_days,
      ep.featured,
      p.display_name,
      p.bio,
      COALESCE(array_agg(DISTINCT s.name) FILTER (WHERE s.id IS NOT NULL), ARRAY[]::text[]) AS skills
    FROM editor_profiles ep
    JOIN profiles p ON p.user_id = ep.user_id
    LEFT JOIN editor_skills es ON es.editor_profile_id = ep.id
    LEFT JOIN skills s ON s.id = es.skill_id
    WHERE ep.id = $1
    GROUP BY ep.id, p.display_name, p.bio
    `,
    [id]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return result.rows[0];
}

async function loadPortfolio(id) {
  const result = await query(
    `
    SELECT id, title, youtube_url, youtube_id, description
    FROM portfolio_items
    WHERE editor_profile_id = $1
    ORDER BY created_at DESC
    `,
    [id]
  );

  return result.rows;
}

function AvailabilityBadge({ status }) {
  const colors = {
    available: { bg: "#065f46", border: "#10b981", text: "Available" },
    busy: { bg: "#92400e", border: "#f59e0b", text: "Busy" },
    away: { bg: "#7f1d1d", border: "#ef4444", text: "Away" },
  };
  const c = colors[status] || colors.available;

  return (
    <span
      className="availability-badge large"
      style={{ background: c.bg, borderColor: c.border }}
    >
      <span className="availability-dot" style={{ background: c.border }} />
      {c.text}
    </span>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="stat-card">
      <span className="stat-icon">{icon}</span>
      <div className="stat-content">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
}

export default async function EditorProfilePage({ params }) {
  const editor = await loadEditor(params.id);

  if (!editor) {
    notFound();
  }

  const portfolio = await loadPortfolio(params.id);

  return (
    <main className="container">
      <Link className="button secondary small" href="/editors">
        ← Back to editors
      </Link>

      <div className="profile-header">
        <div className="profile-avatar-section">
          <div className="avatar xlarge">
            {editor.display_name?.[0]?.toUpperCase() || "E"}
          </div>
          {editor.featured && <span className="featured-badge">Featured Editor</span>}
        </div>

        <div className="profile-info">
          <div className="profile-title-row">
            <h1>{editor.display_name}</h1>
            <span className="rating large">★ {editor.rating?.toFixed(1) ?? "—"}</span>
          </div>
          <p className="headline">{editor.headline}</p>
          <AvailabilityBadge status={editor.availability} />
          <div className="pill-row" style={{ marginTop: 12 }}>
            {editor.skills.map((skillName) => (
              <span className="pill" key={skillName}>
                {skillName}
              </span>
            ))}
          </div>
        </div>

        <div className="profile-cta">
          <button className="button large">Contact Editor</button>
          <button className="button secondary large">Save to Favorites</button>
          {editor.hourly_rate && (
            <p className="price-display">
              <strong>${editor.hourly_rate}</strong>
              <span className="muted">/hour</span>
            </p>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Projects Completed" value={editor.completed_projects} icon="📁" />
        <StatCard label="Response Time" value={`${editor.response_time_hours}h`} icon="⚡" />
        <StatCard label="Turnaround" value={`${editor.turnaround_days} days`} icon="🗓️" />
        <StatCard label="Languages" value={editor.languages?.join(", ") || "English"} icon="🌍" />
      </div>

      <section className="section">
        <h2>About</h2>
        <div className="card">
          <p>{editor.summary || editor.bio || "No description provided."}</p>
          {editor.timezone && (
            <p className="muted" style={{ marginTop: 12 }}>
              Timezone: {editor.timezone}
            </p>
          )}
        </div>
      </section>

      <section className="section">
        <h2>Portfolio</h2>
        {portfolio.length === 0 ? (
          <div className="card empty-state">
            <p className="muted">No portfolio items yet.</p>
          </div>
        ) : (
          <div className="grid">
            {portfolio.map((item) => (
              <div className="card portfolio-card" key={item.id}>
                <div className="video">
                  <iframe
                    src={`https://www.youtube.com/embed/${item.youtube_id}`}
                    title={item.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <h3>{item.title}</h3>
                <p className="muted">{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

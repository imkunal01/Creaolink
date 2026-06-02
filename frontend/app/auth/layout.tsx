import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-shell">
      {/* Left brand panel */}
      <div className="auth-left">
        <Link href="/" className="auth-logo">
          <b>Creao</b>Link
        </Link>

        <h2 style={{
          fontFamily: "var(--fd)",
          fontSize: "1.8rem",
          color: "var(--white)",
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
          marginBottom: "0.85rem",
        }}>
          Deliver without<br />
          <em style={{ color: "var(--red)" }}>workflow chaos.</em>
        </h2>

        <p style={{
          fontSize: "0.81rem",
          color: "var(--m2)",
          lineHeight: 1.7,
          fontWeight: 300,
          marginBottom: "1.75rem",
        }}>
          The operating system for client-freelancer delivery teams.
          Every version, feedback, and approval in one place.
        </p>

        {/* Feature list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[
            "Role-based dashboards for clients & freelancers",
            "Version control for every deliverable",
            "Feedback that converts to actionable tasks",
            "Premiere Pro timeline sync plugin",
          ].map((feat) => (
            <div key={feat} style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              fontSize: "0.78rem", color: "var(--m2)",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {feat}
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div className="auth-quote" style={{ marginTop: "2rem" }}>
          <div className="auth-quote-text">
            &ldquo;Version history saved us during a major client dispute. We onboarded our 12-person team in 3 days.&rdquo;
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "#7dd3fc", color: "#0d0f0e",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.54rem", fontWeight: 700,
            }}>
              KD
            </div>
            <div>
              <div style={{ fontSize: "0.76rem", fontWeight: 500, color: "var(--white)" }}>Kunal Dhangar</div>
              <div style={{ fontSize: "0.68rem", color: "var(--m1)" }}>Freelancer</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-right">
        {children}
      </div>
    </div>
  );
}

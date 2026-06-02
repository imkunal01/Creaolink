"use client";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "4rem 2rem", textAlign: "center",
      gap: "0.85rem",
    }}>
      {/* Icon container */}
      <div style={{
        width: 56, height: 56, borderRadius: "var(--rl)",
        background: "var(--s3)", border: "1px solid var(--b2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--m1)",
      }}>
        {icon ?? (
          <svg
            width="26" height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
          </svg>
        )}
      </div>

      <div style={{ fontSize: "0.95rem", fontWeight: 500, color: "var(--white)" }}>
        {title}
      </div>
      <div style={{
        fontSize: "0.82rem", color: "var(--m1)",
        maxWidth: 280, lineHeight: 1.65, textAlign: "center",
      }}>
        {description}
      </div>

      {action && (
        <button
          onClick={action.onClick}
          className="btn btn-p"
          style={{ marginTop: "0.35rem" }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

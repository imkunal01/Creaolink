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
    <div className="flex flex-col items-center justify-center py-16 px-6">
      {/* Illustration container */}
      <div className="w-20 h-20 rounded-2xl bg-bg-tertiary border border-border flex items-center justify-center mb-6">
        {icon ?? (
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-tertiary"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
          </svg>
        )}
      </div>

      {/* Text */}
      <h3 className="text-sm font-medium text-text-primary mb-1.5">{title}</h3>
      <p className="text-sm text-text-tertiary text-center max-w-[280px] leading-relaxed">
        {description}
      </p>

      {/* CTA */}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 px-5 py-2.5 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent-hover transition-all duration-200 cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

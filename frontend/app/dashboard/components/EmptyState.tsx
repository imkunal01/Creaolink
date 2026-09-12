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
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {/* Icon container */}
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#141618] border border-white/[0.08] text-zinc-500 mb-4 shadow-sm">
        {icon ?? (
          <svg
            width="22"
            height="22"
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

      <h3 className="text-sm font-semibold text-white mb-1">
        {title}
      </h3>
      <p className="text-xs text-zinc-400 max-w-xs leading-relaxed mb-5">
        {description}
      </p>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="btn btn-p btn-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

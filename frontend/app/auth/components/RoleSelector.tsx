"use client";

type Role = "freelancer" | "client";

interface RoleSelectorProps {
  selected: Role;
  onChange: (role: Role) => void;
}

export default function RoleSelector({ selected, onChange }: RoleSelectorProps) {
  return (
    <div className="flex gap-2 mb-6">
      <button
        type="button"
        onClick={() => onChange("client")}
        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer border ${
          selected === "client"
            ? "bg-accent text-bg border-accent"
            : "bg-transparent text-text-secondary border-border hover:border-border-hover hover:text-text-primary"
        }`}
      >
        Client
      </button>
      <button
        type="button"
        onClick={() => onChange("freelancer")}
        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer border ${
          selected === "freelancer"
            ? "bg-accent text-bg border-accent"
            : "bg-transparent text-text-secondary border-border hover:border-border-hover hover:text-text-primary"
        }`}
      >
        Freelancer
      </button>
    </div>
  );
}

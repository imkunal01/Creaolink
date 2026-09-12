"use client";

type Role = "freelancer" | "client";

interface RoleSelectorProps {
  selected: Role;
  onChange: (role: Role) => void;
}

export default function RoleSelector({ selected, onChange }: RoleSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/[0.04] border border-white/[0.08] rounded-2xl mb-5">
      <button
        type="button"
        onClick={() => onChange("client")}
        className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
          selected === "client"
            ? "bg-white text-black shadow-sm"
            : "text-neutral-400 hover:text-white"
        }`}
      >
        Client / Agency
      </button>
      <button
        type="button"
        onClick={() => onChange("freelancer")}
        className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
          selected === "freelancer"
            ? "bg-white text-black shadow-sm"
            : "text-neutral-400 hover:text-white"
        }`}
      >
        Freelancer / Editor
      </button>
    </div>
  );
}

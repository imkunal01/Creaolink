"use client";

type Role = "freelancer" | "client";

interface RoleSelectorProps {
  selected: Role;
  onChange: (role: Role) => void;
}

export default function RoleSelector({ selected, onChange }: RoleSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 p-1 bg-[#141618] border border-white/[0.08] rounded-md mb-5">
      <button
        type="button"
        onClick={() => onChange("client")}
        className={`py-2 px-3 rounded text-xs font-semibold transition-all duration-150 cursor-pointer ${
          selected === "client"
            ? "bg-[#00e5ff] text-[#08090a] shadow-sm"
            : "text-zinc-400 hover:text-white"
        }`}
      >
        Client / Agency
      </button>
      <button
        type="button"
        onClick={() => onChange("freelancer")}
        className={`py-2 px-3 rounded text-xs font-semibold transition-all duration-150 cursor-pointer ${
          selected === "freelancer"
            ? "bg-[#00e5ff] text-[#08090a] shadow-sm"
            : "text-zinc-400 hover:text-white"
        }`}
      >
        Freelancer / Editor
      </button>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "Projects",
    href: "/dashboard/projects",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  return (
    <>
      {/* Backdrop — mobile only */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-dvh w-72 sm:w-64
          bg-[#010409] border-r border-[#30363d] flex flex-col z-50
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Logo + close button */}
        <div className="h-14 shrink-0 border-b border-[#30363d] px-4 flex items-center justify-between">
          <Link href="/" className="text-base font-semibold tracking-tight text-[#f0f6fc]">
            CreaoLink
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-[#8b949e] hover:text-[#f0f6fc] transition-colors cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-2 pb-2 text-[11px] uppercase tracking-[0.14em] text-[#8b949e]">Workspace</p>
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150
                  ${
                    isActive
                      ? "border border-[#30363d] bg-[#161b22] text-[#f0f6fc]"
                      : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]"
                  }
                `}
              >
                <span className={isActive ? "text-[#58a6ff]" : "text-[#8b949e]"}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}

          <div className="mt-5 rounded-md border border-[#30363d] bg-[#0d1117] p-3">
            <p className="text-xs font-medium text-[#f0f6fc]">Need help onboarding?</p>
            <p className="mt-1 text-xs leading-relaxed text-[#8b949e]">
              Use templates to launch your first project workflow in under 10 minutes.
            </p>
          </div>
        </nav>

        {/* Logout */}
        <div className="shrink-0 px-3 pb-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[#8b949e] hover:bg-[#161b22] hover:text-[#f0f6fc] transition-all duration-150 cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        setUser(data.user);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
  }

  const publicLinks = [
    { href: "/editors", label: "Browse Editors" },
  ];

  const clientLinks = [
    { href: "/editors", label: "Browse Editors" },
    { href: "/bookmarks", label: "Saved" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  const editorLinks = [
    { href: "/editors", label: "Browse Editors" },
    { href: "/editor/dashboard", label: "My Profile" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  let navLinks = publicLinks;
  if (user?.role === "CLIENT") navLinks = clientLinks;
  if (user?.role === "EDITOR") navLinks = editorLinks;

  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="logo">
          <span className="logo-icon">◆</span>
          CreaoLink
        </Link>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${menuOpen ? "open" : ""}`} />
        </button>

        <nav className={`nav ${menuOpen ? "nav-open" : ""}`}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${pathname === link.href ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div className="nav-auth">
            {loading ? (
              <span className="nav-loading" />
            ) : user ? (
              <>
                <span className="nav-user">
                  <span className="avatar">{user.display_name?.[0] || user.email[0].toUpperCase()}</span>
                  <span className="user-info">
                    <span className="user-name">{user.display_name || "User"}</span>
                    <span className="user-role">{user.role}</span>
                  </span>
                </span>
                <button className="button small secondary" onClick={handleLogout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="button small secondary" onClick={() => setMenuOpen(false)}>
                  Log in
                </Link>
                <Link href="/register" className="button small" onClick={() => setMenuOpen(false)}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "../components/Toast";

function AvailabilityBadge({ status }) {
  const colors = {
    available: { bg: "#065f46", border: "#10b981", text: "Available" },
    busy: { bg: "#92400e", border: "#f59e0b", text: "Busy" },
    away: { bg: "#7f1d1d", border: "#ef4444", text: "Away" },
  };
  const c = colors[status] || colors.available;

  return (
    <span
      className="availability-badge"
      style={{ background: c.bg, borderColor: c.border }}
    >
      <span className="availability-dot" style={{ background: c.border }} />
      {c.text}
    </span>
  );
}

export default function BookmarksPage() {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [userRes, bookmarksRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/bookmarks"),
        ]);

        const userData = await userRes.json();

        if (!userData.user) {
          router.push("/login");
          return;
        }

        setUser(userData.user);

        if (bookmarksRes.ok) {
          const data = await bookmarksRes.json();
          setBookmarks(data.bookmarks || []);
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load bookmarks.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router, toast]);

  async function handleRemove(editorId) {
    try {
      const res = await fetch(`/api/bookmarks?editorProfileId=${editorId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed");

      setBookmarks(bookmarks.filter((b) => b.id !== editorId));
      toast.success("Bookmark removed.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to remove bookmark.");
    }
  }

  if (loading) {
    return (
      <main className="container">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading your saved editors...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="hero">
        <h1>Saved Editors</h1>
        <p className="muted">Editors you've bookmarked for later.</p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="card empty-state">
          <h3>No saved editors yet</h3>
          <p className="muted" style={{ marginBottom: 16 }}>
            Browse editors and save your favorites for quick access.
          </p>
          <Link href="/editors" className="button">
            Browse Editors
          </Link>
        </div>
      ) : (
        <div className="grid">
          {bookmarks.map((editor) => (
            <div className="card editor-card" key={editor.id}>
              <div className="editor-card-header">
                <div className="avatar large">
                  {editor.display_name?.[0]?.toUpperCase() || "E"}
                </div>
                <div className="editor-card-info">
                  <div className="row">
                    <Link href={`/editors/${editor.id}`}>
                      <h3>{editor.display_name}</h3>
                    </Link>
                    <span className="rating">★ {editor.rating?.toFixed(1) ?? "—"}</span>
                  </div>
                  <AvailabilityBadge status={editor.availability} />
                </div>
              </div>
              <p className="muted headline-text">{editor.headline}</p>
              <div className="editor-stats">
                <span>
                  <strong>{editor.completed_projects}</strong> projects
                </span>
                <span>
                  <strong>{editor.response_time_hours}h</strong> response
                </span>
                {editor.hourly_rate && (
                  <span>
                    <strong>${editor.hourly_rate}</strong>/hr
                  </span>
                )}
              </div>
              <div className="pill-row">
                {editor.skills?.slice(0, 3).map((skill) => (
                  <span className="pill" key={skill}>
                    {skill}
                  </span>
                ))}
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                <Link href={`/editors/${editor.id}`} className="button small">
                  View Profile
                </Link>
                <button
                  className="button small secondary danger"
                  onClick={() => handleRemove(editor.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

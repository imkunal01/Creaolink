"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type AppNotification,
  type NotifKind,
  clearAll,
  deleteNotification,
  getNotifications,
  markAllRead,
  markRead,
} from "@/lib/notifications";

const KIND_ICON: Record<NotifKind, string> = {
  chat: "💬",
  feedback: "📝",
  status: "🔄",
  member: "👥",
  version: "🚀",
  project: "🗂️",
};

const KIND_COLOR: Record<NotifKind, string> = {
  chat: "#a78bfa",
  feedback: "#fbbf24",
  status: "#7dd3fc",
  member: "#4ade80",
  version: "#f472b6",
  project: "var(--red)",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<NotifKind | "all">("all");

  const reload = () => setNotifs(getNotifications());

  useEffect(() => {
    reload();
    // Re-render whenever polling pushes a new notification
    const onUpdate = () => reload();
    window.addEventListener("cl_notif_update", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("cl_notif_update", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  const filtered = filter === "all" ? notifs : notifs.filter((n) => n.kind === filter);
  const unreadCount = notifs.filter((n) => !n.read).length;

  const handleClick = (notif: AppNotification) => {
    markRead(notif.id);
    reload();
    if (notif.projectId) {
      router.push(`/dashboard/projects/${notif.projectId}`);
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        width: "min(360px, calc(100vw - 24px))",
        maxHeight: "min(580px, calc(100dvh - 80px))",
        display: "flex",
        flexDirection: "column",
        background: "var(--s1)",
        border: "1px solid var(--b2)",
        borderRadius: "var(--rxl)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        zIndex: 200,
        overflow: "hidden",
      }}
    >

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.85rem 1.1rem",
        borderBottom: "1px solid var(--b2)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
          <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--white)" }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{
              background: "var(--red)", color: "#fff",
              fontSize: "0.6rem", fontWeight: 700,
              padding: "1px 6px", borderRadius: 99,
            }}>
              {unreadCount}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {unreadCount > 0 && (
            <button
              onClick={() => { markAllRead(); reload(); }}
              style={{
                fontSize: "0.7rem", color: "var(--m1)", background: "none",
                border: "none", cursor: "pointer", fontFamily: "var(--fb)",
                padding: "2px 6px",
              }}
              title="Mark all as read"
            >
              Mark all read
            </button>
          )}
          {notifs.length > 0 && (
            <button
              onClick={() => { clearAll(); reload(); }}
              style={{
                fontSize: "0.7rem", color: "var(--m1)", background: "none",
                border: "none", cursor: "pointer", fontFamily: "var(--fb)",
                padding: "2px 6px",
              }}
              title="Clear all"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div style={{
        display: "flex", gap: 6, padding: "0.6rem 1rem",
        overflowX: "auto", flexShrink: 0,
        borderBottom: "1px solid var(--b1)",
      }}>
        {(["all", "chat", "feedback", "status", "project", "version"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            style={{
              padding: "3px 10px",
              borderRadius: 99,
              fontSize: "0.67rem", fontWeight: 500,
              border: `1px solid ${filter === k ? "var(--b3)" : "var(--b1)"}`,
              background: filter === k ? "var(--s3)" : "transparent",
              color: filter === k ? "var(--white)" : "var(--m1)",
              cursor: "pointer", whiteSpace: "nowrap",
              fontFamily: "var(--fb)",
              transition: "all 0.12s",
            }}
          >
            {k === "all" ? "All" : KIND_ICON[k as NotifKind] + " " + k.charAt(0).toUpperCase() + k.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        {filtered.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "3rem 1.5rem", gap: "0.75rem", textAlign: "center",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              border: "1px solid var(--b2)", background: "var(--s3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.1rem",
            }}>
              🔔
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--m2)", fontWeight: 500 }}>All caught up!</div>
            <div style={{ fontSize: "0.74rem", color: "var(--m1)", lineHeight: 1.55 }}>
              New chat messages, feedback, and project updates will appear here automatically.
            </div>
          </div>
        ) : (
          filtered.map((notif) => (
            <NotifRow
              key={notif.id}
              notif={notif}
              onClick={() => handleClick(notif)}
              onDelete={() => { deleteNotification(notif.id); reload(); }}
            />
          ))
        )}
      </div>

      {/* Footer hint */}
      <div style={{
        padding: "0.55rem 1rem",
        borderTop: "1px solid var(--b1)",
        fontSize: "0.64rem", color: "var(--m1)", textAlign: "center",
        flexShrink: 0,
      }}>
        Checks for new activity every 30 seconds
      </div>
    </div>
  );
}

function NotifRow({
  notif, onClick, onDelete,
}: {
  notif: AppNotification;
  onClick: () => void;
  onDelete: () => void;
}) {
  const [hov, setHov] = useState(false);
  const color = KIND_COLOR[notif.kind];

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", gap: "0.75rem", padding: "0.75rem 1rem",
        background: !notif.read ? "rgba(255,255,255,0.025)" : "transparent",
        borderBottom: "1px solid var(--b1)",
        cursor: "pointer",
        transition: "background 0.1s",
        ...(hov ? { background: "var(--s3)" } : {}),
      }}
      onClick={onClick}
    >
      {/* Kind dot + unread indicator */}
      <div style={{ flexShrink: 0, paddingTop: 2, position: "relative" }}>
        <div style={{
          width: 34, height: 34, borderRadius: "var(--r)",
          background: `${color}18`,
          border: `1px solid ${color}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.95rem",
        }}>
          {KIND_ICON[notif.kind]}
        </div>
        {!notif.read && (
          <div style={{
            position: "absolute", top: -2, right: -2,
            width: 8, height: 8, borderRadius: "50%",
            background: "var(--red)", border: "1.5px solid var(--s1)",
          }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "0.79rem", fontWeight: notif.read ? 400 : 600,
          color: notif.read ? "var(--m2)" : "var(--white)",
          lineHeight: 1.3, marginBottom: "0.2rem",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {notif.title}
        </div>
        <div style={{
          fontSize: "0.72rem", color: "var(--m1)", lineHeight: 1.5,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {notif.body}
        </div>
        <div style={{ fontSize: "0.62rem", color: "var(--m1)", marginTop: "0.25rem" }}>
          {timeAgo(notif.createdAt)}
          {notif.projectTitle && (
            <span style={{ marginLeft: 6, color: color, opacity: 0.8 }}>· {notif.projectTitle}</span>
          )}
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="Dismiss"
        style={{
          flexShrink: 0, alignSelf: "flex-start",
          width: 22, height: 22, borderRadius: 4,
          background: "var(--s4)", border: "1px solid var(--b2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--m1)", cursor: "pointer",
          opacity: hov ? 1 : 0, transition: "opacity 0.15s",
          fontSize: 10,
        }}
      >
        ✕
      </button>
    </div>
  );
}

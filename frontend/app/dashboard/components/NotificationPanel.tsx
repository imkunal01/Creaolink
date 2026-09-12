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

function getKindIcon(kind: NotifKind) {
  switch (kind) {
    case "chat":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "feedback":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      );
    case "status":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
        </svg>
      );
    case "member":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "version":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case "project":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      );
  }
}

const KIND_COLOR: Record<NotifKind, string> = {
  chat: "#a78bfa",
  feedback: "#f59e0b",
  status: "#38bdf8",
  member: "#10b981",
  version: "#00e5ff",
  project: "#00e5ff",
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
      className="absolute top-[calc(100%+8px)] right-0 w-[min(380px,calc(100vw-24px))] max-h-[min(580px,calc(100dvh-80px))] flex flex-col bg-[#0c0e14]/95 border border-white/[0.12] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl z-50 overflow-hidden text-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.08] bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-white">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-white text-black text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => { markAllRead(); reload(); }}
              className="text-[11px] font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              Mark read
            </button>
          )}
          {notifs.length > 0 && (
            <button
              onClick={() => { clearAll(); reload(); }}
              className="text-[11px] font-mono text-neutral-500 hover:text-red-400 transition-colors cursor-pointer ml-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 px-3 py-2 overflow-x-auto shrink-0 border-b border-white/[0.06] bg-white/[0.01]">
        {(["all", "chat", "feedback", "status", "project", "version"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`px-3 py-1 rounded-full text-[11px] font-mono capitalize whitespace-nowrap transition-all cursor-pointer ${
              filter === k
                ? "bg-white text-black font-semibold shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1 divide-y divide-white/[0.04]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-[#1c1e22] border border-white/[0.06] flex items-center justify-center text-zinc-500 mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-zinc-300">All caught up</p>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-[200px]">
              New timeline sync events and project feedback will appear here.
            </p>
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

      {/* Footer */}
      <div className="px-3 py-2 border-t border-white/[0.06] bg-[#0d0e10] text-[10px] font-mono text-zinc-600 text-center shrink-0">
        Real-time telemetry active
      </div>
    </div>
  );
}

function NotifRow({
  notif,
  onClick,
  onDelete,
}: {
  notif: AppNotification;
  onClick: () => void;
  onDelete: () => void;
}) {
  const color = KIND_COLOR[notif.kind] || "#00e5ff";

  return (
    <div
      onClick={onClick}
      className={`group flex items-start gap-3 p-3 transition-colors cursor-pointer hover:bg-[#1c1e22] ${
        !notif.read ? "bg-white/[0.02]" : "bg-transparent"
      }`}
    >
      <div className="relative shrink-0 pt-0.5">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md border"
          style={{
            backgroundColor: `${color}15`,
            borderColor: `${color}30`,
            color: color,
          }}
        >
          {getKindIcon(notif.kind)}
        </div>
        {!notif.read && (
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#00e5ff] ring-2 ring-[#141618]" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className={`text-xs leading-tight truncate ${notif.read ? "text-zinc-300" : "text-white font-medium"}`}>
          {notif.title}
        </div>
        <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2 mt-1">
          {notif.body}
        </p>
        <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-zinc-500">
          <span>{timeAgo(notif.createdAt)}</span>
          {notif.projectTitle && (
            <span className="text-zinc-400 truncate max-w-[140px]">
              &middot; {notif.projectTitle}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Dismiss"
        className="opacity-0 group-hover:opacity-100 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#1c1e22] border border-white/[0.08] text-zinc-500 hover:text-white transition-opacity"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

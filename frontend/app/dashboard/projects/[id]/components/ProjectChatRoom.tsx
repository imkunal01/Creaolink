"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { getUser, type User } from "@/lib/auth";

interface ChatAttachment {
  id: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  data_url: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender_name: string;
  sender_email: string;
  sender_username: string;
  sender_role: string;
  attachments: ChatAttachment[];
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function AttachmentPreview({ attachment }: { attachment: ChatAttachment }) {
  const isImage = attachment.mime_type.startsWith("image/");
  const isVideo = attachment.mime_type.startsWith("video/");
  const isAudio = attachment.mime_type.startsWith("audio/");

  return (
    <a
      href={attachment.data_url}
      download={attachment.file_name}
      className="block overflow-hidden rounded-md border border-white/[0.08] bg-[#0d0e10] hover:border-white/20 transition-colors"
    >
      {isImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={attachment.data_url} alt={attachment.file_name} className="h-36 w-full object-cover" />
      )}
      {isVideo && (
        <video src={attachment.data_url} className="h-44 w-full bg-black object-contain" controls />
      )}
      {isAudio && (
        <div className="p-2">
          <audio src={attachment.data_url} className="w-full" controls />
        </div>
      )}
      <div className="flex items-center gap-2 p-2 bg-[#141618]">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-[#1c1e22] text-zinc-400 shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium text-white">{attachment.file_name}</span>
          <span className="block text-[10px] font-mono text-zinc-500">{formatBytes(attachment.file_size)}</span>
        </div>
      </div>
    </a>
  );
}

export default function ProjectChatRoom({ projectId }: { projectId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const selectedSize = useMemo(
    () => files.reduce((total, file) => total + file.size, 0),
    [files]
  );

  const fetchMessages = useCallback(async (quiet = false) => {
    const currentUser = getUser();
    if (!currentUser) return;
    try {
      if (!quiet) setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        headers: { "x-user-id": currentUser.id },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load chat");
      setMessages(data.messages || []);
      setError("");
    } catch (err) {
      if (!quiet) setError(err instanceof Error ? err.message : "Failed to load chat");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    setUser(getUser());
    fetchMessages();
    const interval = window.setInterval(() => fetchMessages(true), 5000);
    return () => window.clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files || []);
    setFiles((current) => [...current, ...nextFiles].slice(0, 6));
    event.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || sending) return;
    if (!body.trim() && files.length === 0) return;
    setSending(true);
    setError("");
    try {
      const form = new FormData();
      form.append("body", body);
      files.forEach((file) => form.append("attachments", file));
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: "POST",
        headers: { "x-user-id": user.id },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");
      setBody("");
      setFiles([]);
      await fetchMessages(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#08090a]">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#0d0e10] shrink-0">
        <div>
          <div className="text-xs font-semibold text-white">Workspace Chat</div>
          <div className="text-[10px] font-mono text-zinc-500">Live communication channel &middot; 5s sync</div>
        </div>
        <button
          type="button"
          onClick={() => fetchMessages()}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-[#141618] border border-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer"
          title="Refresh chat"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M16 8h5V3" />
          </svg>
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[#00e5ff] animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#141618] border border-white/[0.08] text-zinc-500 mb-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-zinc-300">No messages in room</p>
            <p className="text-[11px] font-mono text-zinc-500 mt-0.5">Start the workspace discussion below.</p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const mine = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
                >
                  {/* Meta */}
                  <div className={`flex items-center gap-1.5 mb-1 text-[10px] font-mono text-zinc-500 ${mine ? "flex-row-reverse" : "flex-row"}`}>
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1c1e22] text-[8px] font-bold text-zinc-300">
                      {(mine ? (user?.name ?? "U") : message.sender_name).slice(0, 1).toUpperCase()}
                    </div>
                    <span>{mine ? "You" : message.sender_name}</span>
                    <span>&middot;</span>
                    <span>{formatTime(message.created_at)}</span>
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                      mine
                        ? "bg-[#141618] text-white border border-[#00e5ff]/30 ring-1 ring-[#00e5ff]/10"
                        : "bg-[#141618] text-zinc-200 border border-white/[0.08]"
                    }`}
                  >
                    {message.body && (
                      <p className="whitespace-pre-wrap">{message.body}</p>
                    )}
                    {message.attachments.length > 0 && (
                      <div className={`grid gap-2 ${message.body ? "mt-2 pt-2 border-t border-white/[0.06]" : ""} ${
                        message.attachments.length > 1 ? "grid-cols-2" : "grid-cols-1"
                      }`}>
                        {message.attachments.map((att) => (
                          <AttachmentPreview key={att.id} attachment={att} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <form onSubmit={sendMessage} className="p-3 border-t border-white/[0.08] bg-[#0d0e10] shrink-0 space-y-2">
        {error && (
          <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* File previews */}
        {files.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-1.5 p-1.5 rounded bg-[#141618] border border-white/[0.08]">
                <div className="min-w-0 flex-1 truncate text-[11px] text-zinc-300 font-mono">
                  {file.name}
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-zinc-500 hover:text-red-400 p-0.5"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="flex items-end gap-2">
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#141618] border border-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Attach render or reference assets"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>

          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Type message or timeline note..."
            rows={1}
            maxLength={4000}
            className="flex-1 min-h-[36px] max-h-24 p-2 rounded-md bg-[#141618] border border-white/[0.08] text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#00e5ff]/60 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e as unknown as FormEvent);
              }
            }}
          />

          <button
            type="submit"
            disabled={sending || (!body.trim() && files.length === 0)}
            className="btn btn-p h-9 px-3 shrink-0 flex items-center justify-center"
            title="Send"
          >
            {sending ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

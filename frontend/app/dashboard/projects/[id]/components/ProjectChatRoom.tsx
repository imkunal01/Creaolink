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

function AttachmentPreview({ attachment }: { attachment: ChatAttachment }) {
  const isImage = attachment.mime_type.startsWith("image/");
  const isVideo = attachment.mime_type.startsWith("video/");
  const isAudio = attachment.mime_type.startsWith("audio/");

  return (
    <a
      href={attachment.data_url}
      download={attachment.file_name}
      className="block overflow-hidden rounded-lg border border-border bg-bg-tertiary hover:border-border-hover transition-colors"
    >
      {isImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={attachment.data_url}
          alt={attachment.file_name}
          className="h-40 w-full object-cover"
        />
      )}
      {isVideo && (
        <video
          src={attachment.data_url}
          className="h-48 w-full bg-black object-contain"
          controls
        />
      )}
      {isAudio && (
        <div className="p-3">
          <audio src={attachment.data_url} className="w-full" controls />
        </div>
      )}
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-text-tertiary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium text-text-primary">{attachment.file_name}</span>
          <span className="block text-[11px] text-text-tertiary">{formatBytes(attachment.file_size)}</span>
        </span>
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
    <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Project Chat</h3>
          <p className="text-xs text-text-tertiary">Shared project room</p>
        </div>
        <button
          type="button"
          onClick={() => fetchMessages()}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-tertiary hover:text-text-primary hover:border-border-hover transition-colors cursor-pointer"
          title="Refresh chat"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M16 8h5V3" />
          </svg>
        </button>
      </div>

      <div className="h-[520px] overflow-y-auto px-4 py-4 sm:px-5">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="w-5 h-5 border-2 border-text-tertiary border-t-accent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border text-text-tertiary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
              </svg>
            </div>
            <p className="text-sm text-text-primary">No messages yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const mine = message.sender_id === user?.id;
              return (
                <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[min(680px,92%)] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                    <div className="mb-1 flex items-center gap-2 text-[11px] text-text-tertiary">
                      <span>{mine ? "You" : message.sender_name}</span>
                      <span>{new Date(message.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                    </div>
                    <div className={`rounded-xl border px-4 py-3 ${
                      mine
                        ? "border-accent/25 bg-accent text-bg"
                        : "border-border bg-bg-tertiary text-text-primary"
                    }`}>
                      {message.body && (
                        <p className={`whitespace-pre-wrap break-words text-sm leading-relaxed ${mine ? "text-bg" : "text-text-primary"}`}>
                          {message.body}
                        </p>
                      )}
                      {message.attachments.length > 0 && (
                        <div className={`grid gap-2 ${message.body ? "mt-3" : ""} ${
                          message.attachments.length > 1 ? "sm:grid-cols-2" : ""
                        }`}>
                          {message.attachments.map((attachment) => (
                            <AttachmentPreview key={attachment.id} attachment={attachment} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="border-t border-border p-4 sm:p-5">
        {error && (
          <div className="mb-3 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-xs text-error">
            {error}
          </div>
        )}

        {files.length > 0 && (
          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-lg border border-border bg-bg-tertiary px-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs text-text-primary">{file.name}</span>
                  <span className="block text-[11px] text-text-tertiary">{formatBytes(file.size)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-tertiary hover:text-text-primary hover:bg-border/50 transition-colors cursor-pointer"
                  title="Remove attachment"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border text-text-tertiary hover:text-text-primary hover:border-border-hover transition-colors cursor-pointer"
            title="Attach files"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write a message or revision note..."
            rows={2}
            maxLength={4000}
            className="min-h-11 flex-1 resize-none rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-hover"
          />
          <button
            type="submit"
            disabled={sending || (!body.trim() && files.length === 0)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-bg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Send message"
          >
            {sending ? (
              <div className="h-4 w-4 rounded-full border-2 border-bg/40 border-t-bg animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            )}
          </button>
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-text-tertiary">
          <span>Up to 6 files, 25MB each.</span>
          <span>{files.length > 0 ? `${files.length} selected, ${formatBytes(selectedSize)}` : `${body.length}/4000`}</span>
        </div>
      </form>
    </div>
  );
}

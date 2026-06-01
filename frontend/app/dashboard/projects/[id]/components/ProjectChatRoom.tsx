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
      style={{
        display: "block", overflow: "hidden",
        borderRadius: "var(--r)", border: "1px solid var(--b2)",
        background: "var(--s3)",
        textDecoration: "none", transition: "border-color 0.15s",
      }}
    >
      {isImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={attachment.data_url} alt={attachment.file_name} style={{ height: 160, width: "100%", objectFit: "cover" }} />
      )}
      {isVideo && (
        <video src={attachment.data_url} style={{ height: 192, width: "100%", background: "#000", objectFit: "contain" }} controls />
      )}
      {isAudio && (
        <div style={{ padding: "0.75rem" }}>
          <audio src={attachment.data_url} style={{ width: "100%" }} controls />
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.5rem 0.75rem" }}>
        <span style={{
          width: 28, height: 28, borderRadius: "var(--r)", border: "1px solid var(--b2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, color: "var(--m1)",
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
        </span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{
            display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            fontSize: "0.75rem", fontWeight: 500, color: "var(--white)",
          }}>{attachment.file_name}</span>
          <span style={{ display: "block", fontSize: "0.65rem", color: "var(--m1)" }}>
            {formatBytes(attachment.file_size)}
          </span>
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
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: "var(--s2)",
    }}>
      {/* Chat header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.7rem 1.25rem", borderBottom: "1px solid var(--b2)",
        background: "var(--s1)", flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--white)" }}>Project Chat</div>
          <div style={{ fontSize: "0.67rem", color: "var(--m1)" }}>Shared project room · auto-refreshes every 5s</div>
        </div>
        <button
          type="button"
          onClick={() => fetchMessages()}
          style={{
            width: 30, height: 30, borderRadius: "var(--r)",
            background: "var(--s3)", border: "1px solid var(--b2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--m2)", cursor: "pointer",
          }}
          title="Refresh"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M16 8h5V3" />
          </svg>
        </button>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%",
              border: "2px solid var(--b2)", borderTopColor: "var(--red)",
              animation: "spin 0.8s linear infinite",
            }} />
          </div>
        ) : messages.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", flex: 1, gap: "0.6rem", textAlign: "center",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              border: "1px solid var(--b2)", background: "var(--s3)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "var(--m1)",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
              </svg>
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--m2)" }}>No messages yet.</div>
            <div style={{ fontSize: "0.74rem", color: "var(--m1)" }}>Start the conversation below.</div>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const mine = message.sender_id === user?.id;
              return (
                <div key={message.id} style={{
                  display: "flex", flexDirection: "column",
                  alignItems: mine ? "flex-end" : "flex-start",
                }}>
                  {/* Meta */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    marginBottom: 4, fontSize: "0.66rem", color: "var(--m1)",
                    flexDirection: mine ? "row-reverse" : "row",
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%",
                      background: mine ? "var(--red)" : "var(--s4)",
                      border: "1px solid var(--b2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.48rem", fontWeight: 700, color: mine ? "#fff" : "var(--m2)",
                      flexShrink: 0,
                    }}>
                      {(mine ? (user?.name ?? "You") : message.sender_name).slice(0, 2).toUpperCase()}
                    </div>
                    <span>{mine ? "You" : message.sender_name}</span>
                    <span>{formatTime(message.created_at)}</span>
                  </div>

                  {/* Bubble */}
                  <div style={{
                    maxWidth: "min(520px, 85%)",
                    padding: "0.55rem 0.85rem",
                    borderRadius: mine ? "var(--rl) var(--rl) 4px var(--rl)" : "var(--rl) var(--rl) var(--rl) 4px",
                    background: mine ? "var(--red)" : "var(--s3)",
                    border: `1px solid ${mine ? "rgba(232,57,46,0.4)" : "var(--b2)"}`,
                    fontSize: "0.8rem",
                    lineHeight: 1.55,
                    color: "var(--white)",
                    wordBreak: "break-word",
                  }}>
                    {message.body && (
                      <p style={{ whiteSpace: "pre-wrap" }}>{message.body}</p>
                    )}
                    {message.attachments.length > 0 && (
                      <div style={{
                        marginTop: message.body ? "0.5rem" : 0,
                        display: "grid", gap: 6,
                        gridTemplateColumns: message.attachments.length > 1 ? "1fr 1fr" : "1fr",
                      }}>
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
      <form onSubmit={sendMessage} style={{
        borderTop: "1px solid var(--b2)",
        padding: "0.85rem 1.25rem",
        background: "var(--s1)",
        flexShrink: 0,
      }}>
        {error && (
          <div style={{
            marginBottom: "0.65rem", padding: "0.5rem 0.75rem",
            background: "var(--rs)", border: "1px solid var(--rg)",
            borderRadius: "var(--r)", fontSize: "0.75rem", color: "var(--red)",
          }}>
            {error}
          </div>
        )}

        {/* File previews */}
        {files.length > 0 && (
          <div style={{
            marginBottom: "0.65rem",
            display: "grid", gap: 6,
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          }}>
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "0.5rem 0.75rem",
                background: "var(--s3)", border: "1px solid var(--b2)",
                borderRadius: "var(--r)",
              }}>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.73rem", color: "var(--white)" }}>{file.name}</span>
                  <span style={{ display: "block", fontSize: "0.62rem", color: "var(--m1)" }}>{formatBytes(file.size)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  style={{
                    width: 22, height: 22, flexShrink: 0,
                    background: "var(--s4)", border: "1px solid var(--b2)",
                    borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--m1)", cursor: "pointer",
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input row */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
          <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={handleFileChange} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 38, height: 38, flexShrink: 0,
              background: "var(--s3)", border: "1px solid var(--b2)",
              borderRadius: "var(--r)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--m2)", cursor: "pointer", transition: "all 0.12s",
            }}
            title="Attach files"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>

          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write a message or revision note…"
            rows={2}
            maxLength={4000}
            style={{
              flex: 1, minHeight: 38, resize: "none",
              background: "var(--s3)", border: "1px solid var(--b2)",
              borderRadius: "var(--r)", padding: "0.5rem 0.75rem",
              fontSize: "0.8rem", color: "var(--white)",
              outline: "none", fontFamily: "var(--fb)", lineHeight: 1.5,
            }}
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
            style={{
              width: 38, height: 38, flexShrink: 0,
              background: "var(--red)", border: "1px solid var(--red)",
              borderRadius: "var(--r)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", cursor: "pointer", opacity: (sending || (!body.trim() && files.length === 0)) ? 0.45 : 1,
              transition: "all 0.12s",
            }}
            title="Send message"
          >
            {sending ? (
              <div style={{
                width: 14, height: 14, borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
                animation: "spin 0.8s linear infinite",
              }} />
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            )}
          </button>
        </div>

        <div style={{
          display: "flex", justifyContent: "space-between",
          fontSize: "0.65rem", color: "var(--m1)", marginTop: "0.4rem",
        }}>
          <span>Up to 6 files · Enter to send · Shift+Enter for new line</span>
          <span>{files.length > 0 ? `${files.length} file${files.length !== 1 ? "s" : ""}, ${formatBytes(selectedSize)}` : `${body.length}/4000`}</span>
        </div>
      </form>
    </div>
  );
}

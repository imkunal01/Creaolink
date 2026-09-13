"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api-client";

interface PostRow {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  author_name: string;
  author_email: string;
  author_username: string;
  author_avatar?: string | null;
  reaction_count: number;
  comment_count: number;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<PostRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      params.set("page", page.toString());
      params.set("limit", "20");

      const res = await apiFetch(`/api/admin/posts?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load posts");
      }
      const data = await res.json();
      setPosts(data.posts || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching posts");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDeletePost = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/admin/posts/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete post");
      }
      setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-xs font-mono font-medium text-rose-400 uppercase tracking-wider">
              Social Community Stream
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Community Posts Moderation
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Total {total} community posts and showcase publications
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-xl bg-[#0c0d10] border border-white/[0.08] flex items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search posts by title, content, or author..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#121418] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff2a3d]/50 transition"
          />
        </div>

        {search && (
          <button
            onClick={() => {
              setSearch("");
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-zinc-400 hover:text-white transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* Posts Table Card */}
      <div className="rounded-xl bg-[#0c0d10] border border-white/[0.08] overflow-hidden">
        {error && (
          <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#121418]/60 text-zinc-400 font-mono">
                <th className="py-3 px-4 font-semibold uppercase">Post Content</th>
                <th className="py-3 px-4 font-semibold uppercase">Author</th>
                <th className="py-3 px-4 font-semibold uppercase">Engagement</th>
                <th className="py-3 px-4 font-semibold uppercase">Tags</th>
                <th className="py-3 px-4 font-semibold uppercase">Published</th>
                <th className="py-3 px-4 font-semibold uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 w-48 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-white/5 rounded" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 w-12 bg-white/5 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    No community posts found matching your search.
                  </td>
                </tr>
              ) : (
                posts.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-semibold text-white truncate">{p.title}</div>
                      <div className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">
                        {p.content}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-white font-medium">{p.author_name}</div>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        {p.author_username ? `@${p.author_username}` : p.author_email}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-zinc-300">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[11px]">
                          ❤️ {p.reaction_count}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                          💬 {p.comment_count}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {p.tags && p.tags.length > 0 ? (
                          p.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-400"
                            >
                              #{tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="p-1.5 rounded text-red-400 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/30 transition"
                        title="Delete Post"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 border-t border-white/[0.08] bg-[#121418]/40 flex items-center justify-between text-xs text-zinc-400">
          <div>
            Page <span className="font-mono text-white">{page}</span> of{" "}
            <span className="font-mono text-white">{totalPages}</span> ({total} posts)
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-2.5 py-1 rounded border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none text-white transition"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-2.5 py-1 rounded border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none text-white transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Delete Post Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-[#0c0d10] border border-red-500/30 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Community Post</h3>
                <p className="text-xs text-zinc-400">Author: {deleteTarget.author_name}</p>
              </div>
            </div>

            <div className="p-3 bg-[#121418] rounded-lg border border-white/5 space-y-1">
              <div className="font-semibold text-white text-xs">{deleteTarget.title}</div>
              <div className="text-[11px] text-zinc-400 line-clamp-2">{deleteTarget.content}</div>
            </div>

            <p className="text-[11px] text-zinc-400">
              This will permanently remove the post, along with all associated comments and reactions.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={handleDeletePost}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

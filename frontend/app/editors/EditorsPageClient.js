"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

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

function EditorCard({ editor }) {
  return (
    <Link className="card link-card editor-card" href={`/editors/${editor.id}`}>
      {editor.featured && <span className="featured-badge">Featured</span>}
      <div className="editor-card-header">
        <div className="avatar large">
          {editor.display_name?.[0]?.toUpperCase() || "E"}
        </div>
        <div className="editor-card-info">
          <div className="row">
            <h3>{editor.display_name}</h3>
            <span className="rating">★ {editor.rating?.toFixed(1) ?? "—"}</span>
          </div>
          <AvailabilityBadge status={editor.availability} />
        </div>
      </div>
      <p className="muted headline-text">{editor.headline}</p>
      <div className="editor-stats">
        <span title="Completed projects">
          <strong>{editor.completed_projects}</strong> projects
        </span>
        <span title="Response time">
          <strong>{editor.response_time_hours}h</strong> response
        </span>
        {editor.hourly_rate && (
          <span title="Hourly rate">
            <strong>${editor.hourly_rate}</strong>/hr
          </span>
        )}
      </div>
      <div className="pill-row">
        {editor.skills.slice(0, 4).map((skillName) => (
          <span className="pill" key={skillName}>
            {skillName}
          </span>
        ))}
        {editor.skills.length > 4 && (
          <span className="pill muted">+{editor.skills.length - 4}</span>
        )}
      </div>
    </Link>
  );
}

function Pagination({ pagination, onPageChange }) {
  if (pagination.totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= pagination.totalPages; i++) {
    if (
      i === 1 ||
      i === pagination.totalPages ||
      (i >= pagination.page - 1 && i <= pagination.page + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="pagination">
      <button
        className="button small secondary"
        disabled={pagination.page === 1}
        onClick={() => onPageChange(pagination.page - 1)}
      >
        ← Prev
      </button>
      <div className="pagination-pages">
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="pagination-ellipsis">
              ...
            </span>
          ) : (
            <button
              key={p}
              className={`pagination-btn ${p === pagination.page ? "active" : ""}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}
      </div>
      <button
        className="button small secondary"
        disabled={pagination.page === pagination.totalPages}
        onClick={() => onPageChange(pagination.page + 1)}
      >
        Next →
      </button>
    </div>
  );
}

export default function EditorsPageClient({ initialEditors, initialSkills, initialPagination }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [editors, setEditors] = useState(initialEditors);
  const [skills] = useState(initialSkills);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    q: searchParams.get("q") || "",
    skill: searchParams.get("skill") || "",
    minRating: searchParams.get("minRating") || "",
    availability: searchParams.get("availability") || "",
    sort: searchParams.get("sort") || "rating",
  });

  const fetchEditors = useCallback(async (params) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) qs.set(k, v);
      });
      const res = await fetch(`/api/editors?${qs.toString()}`);
      const data = await res.json();
      setEditors(data.editors || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateURL = useCallback((params) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) qs.set(k, v);
    });
    router.push(`/editors?${qs.toString()}`, { scroll: false });
  }, [router]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateURL({ ...filters, page: "1" });
    fetchEditors({ ...filters, page: "1" });
  };

  const handlePageChange = (page) => {
    updateURL({ ...filters, page: String(page) });
    fetchEditors({ ...filters, page: String(page) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="container">
      <div className="hero">
        <h1>Find Your Editor</h1>
        <p className="muted">
          Discover talented video editors for cinematic, documentary, and short-form content.
        </p>
      </div>

      <form className="filter-bar" onSubmit={handleSearch}>
        <div className="search-input-wrap">
          <input
            type="text"
            placeholder="Search by name or specialty..."
            value={filters.q}
            onChange={(e) => handleFilterChange("q", e.target.value)}
            className="search-input"
          />
        </div>
        <select
          value={filters.skill}
          onChange={(e) => handleFilterChange("skill", e.target.value)}
        >
          <option value="">All skills</option>
          {skills.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          value={filters.availability}
          onChange={(e) => handleFilterChange("availability", e.target.value)}
        >
          <option value="">Any availability</option>
          <option value="available">Available</option>
          <option value="busy">Busy</option>
        </select>
        <select
          value={filters.minRating}
          onChange={(e) => handleFilterChange("minRating", e.target.value)}
        >
          <option value="">Any rating</option>
          <option value="4">4.0+</option>
          <option value="4.5">4.5+</option>
          <option value="4.8">4.8+</option>
        </select>
        <select
          value={filters.sort}
          onChange={(e) => handleFilterChange("sort", e.target.value)}
        >
          <option value="rating">Top Rated</option>
          <option value="featured">Featured</option>
          <option value="projects">Most Projects</option>
          <option value="response">Fastest Response</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
        </select>
        <button className="button" type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      <div className="results-header">
        <span className="muted">
          {pagination.total} editor{pagination.total !== 1 ? "s" : ""} found
        </span>
      </div>

      <div className={`grid ${loading ? "loading" : ""}`}>
        {editors.length === 0 ? (
          <div className="card empty-state">
            <p>No editors match your criteria.</p>
            <button
              className="button secondary"
              onClick={() => {
                setFilters({ q: "", skill: "", minRating: "", availability: "", sort: "rating" });
                fetchEditors({});
                updateURL({});
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          editors.map((editor) => <EditorCard key={editor.id} editor={editor} />)
        )}
      </div>

      <Pagination pagination={pagination} onPageChange={handlePageChange} />
    </main>
  );
}

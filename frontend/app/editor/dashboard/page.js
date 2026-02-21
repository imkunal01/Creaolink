"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "../../components/Toast";

function AvailabilityToggle({ value, onChange }) {
  const options = [
    { value: "available", label: "Available", color: "#10b981" },
    { value: "busy", label: "Busy", color: "#f59e0b" },
    { value: "away", label: "Away", color: "#ef4444" },
  ];

  return (
    <div className="availability-toggle">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`availability-option ${value === opt.value ? "active" : ""}`}
          style={{ "--accent-color": opt.color }}
          onClick={() => onChange(opt.value)}
        >
          <span className="availability-dot" style={{ background: opt.color }} />
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function PortfolioManager({ portfolio, onAdd, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [description, setDescription] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    if (!title || !youtubeUrl) return;

    setAdding(true);
    await onAdd({ title, youtubeUrl, description });
    setTitle("");
    setYoutubeUrl("");
    setDescription("");
    setShowForm(false);
    setAdding(false);
  }

  return (
    <section className="section">
      <div className="section-header">
        <h2>Portfolio</h2>
        <button
          className="button small"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ Add Video"}
        </button>
      </div>

      {showForm && (
        <form className="card portfolio-form" onSubmit={handleAdd}>
          <label>
            Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Brand Launch Video"
              required
            />
          </label>
          <label>
            YouTube URL
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              required
            />
          </label>
          <label>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this work..."
              rows={3}
            />
          </label>
          <button className="button" type="submit" disabled={adding}>
            {adding ? "Adding..." : "Add to Portfolio"}
          </button>
        </form>
      )}

      <div className="grid">
        {portfolio.length === 0 ? (
          <div className="card empty-state">
            <p className="muted">No portfolio items yet. Add your best work!</p>
          </div>
        ) : (
          portfolio.map((item) => (
            <div className="card portfolio-card" key={item.id}>
              <div className="video">
                <iframe
                  src={`https://www.youtube.com/embed/${item.youtube_id}`}
                  title={item.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="portfolio-card-footer">
                <div>
                  <h3>{item.title}</h3>
                  <p className="muted">{item.description}</p>
                </div>
                <button
                  className="button small secondary danger"
                  onClick={() => onDelete(item.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default function EditorDashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    displayName: "",
    headline: "",
    summary: "",
    bio: "",
    hourlyRate: "",
    availability: "available",
    languages: [],
    timezone: "",
    turnaroundDays: "",
    skillIds: [],
  });

  useEffect(() => {
    async function load() {
      try {
        const [userRes, profileRes, skillsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/editor/profile"),
          fetch("/api/skills"),
        ]);

        const userData = await userRes.json();
        const profileData = await profileRes.json();
        const skillsData = await skillsRes.json();

        if (!userData.user) {
          router.push("/login");
          return;
        }

        if (userData.user.role !== "EDITOR") {
          router.push("/dashboard");
          return;
        }

        setUser(userData.user);
        setAllSkills(skillsData.skills || []);

        if (profileData.profile) {
          setProfile(profileData.profile);
          setPortfolio(profileData.portfolio || []);
          setForm({
            displayName: profileData.profile.display_name || "",
            headline: profileData.profile.headline || "",
            summary: profileData.profile.summary || "",
            bio: profileData.profile.bio || "",
            hourlyRate: profileData.profile.hourly_rate || "",
            availability: profileData.profile.availability || "available",
            languages: profileData.profile.languages || ["English"],
            timezone: profileData.profile.timezone || "",
            turnaroundDays: profileData.profile.turnaround_days || "",
            skillIds: (profileData.profile.skills || []).map((s) => s.id),
          });
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router, toast]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/editor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName,
          headline: form.headline,
          summary: form.summary,
          bio: form.bio,
          hourlyRate: form.hourlyRate ? parseInt(form.hourlyRate, 10) : null,
          availability: form.availability,
          languages: form.languages,
          timezone: form.timezone,
          turnaroundDays: form.turnaroundDays ? parseInt(form.turnaroundDays, 10) : null,
          skillIds: form.skillIds,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save");
      }

      toast.success("Profile saved successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddPortfolio({ title, youtubeUrl, description }) {
    try {
      const res = await fetch("/api/editor/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, youtubeUrl, description }),
      });

      if (!res.ok) {
        throw new Error("Failed to add");
      }

      const data = await res.json();
      setPortfolio([data.item, ...portfolio]);
      toast.success("Portfolio item added!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to add portfolio item.");
    }
  }

  async function handleDeletePortfolio(id) {
    if (!confirm("Remove this portfolio item?")) return;

    try {
      const res = await fetch(`/api/editor/portfolio?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete");
      }

      setPortfolio(portfolio.filter((p) => p.id !== id));
      toast.success("Portfolio item removed.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to remove portfolio item.");
    }
  }

  function handleFieldChange(field, value) {
    setForm({ ...form, [field]: value });
  }

  function toggleSkill(skillId) {
    const current = form.skillIds || [];
    if (current.includes(skillId)) {
      handleFieldChange("skillIds", current.filter((id) => id !== skillId));
    } else {
      handleFieldChange("skillIds", [...current, skillId]);
    }
  }

  if (loading) {
    return (
      <main className="container">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading your profile...</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="container">
        <div className="card empty-state">
          <h2>No Editor Profile</h2>
          <p className="muted">
            Your editor profile hasn't been set up yet. Contact support if this is an error.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="dashboard-header">
        <div>
          <h1>Editor Dashboard</h1>
          <p className="muted">Manage your profile and portfolio</p>
        </div>
        <Link href={`/editors/${profile.id}`} className="button secondary">
          View Public Profile →
        </Link>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-icon">📁</span>
          <div className="stat-content">
            <span className="stat-value">{profile.completed_projects}</span>
            <span className="stat-label">Projects</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⭐</span>
          <div className="stat-content">
            <span className="stat-value">{profile.rating?.toFixed(1) || "—"}</span>
            <span className="stat-label">Rating</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🎬</span>
          <div className="stat-content">
            <span className="stat-value">{portfolio.length}</span>
            <span className="stat-label">Portfolio Items</span>
          </div>
        </div>
      </div>

      <form className="card profile-form" onSubmit={handleSave}>
        <h2>Profile Details</h2>

        <div className="form-row">
          <label>
            Display Name
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => handleFieldChange("displayName", e.target.value)}
              placeholder="Your public name"
            />
          </label>
          <label>
            Hourly Rate ($)
            <input
              type="number"
              value={form.hourlyRate}
              onChange={(e) => handleFieldChange("hourlyRate", e.target.value)}
              placeholder="e.g., 50"
              min="0"
            />
          </label>
        </div>

        <label>
          Headline
          <input
            type="text"
            value={form.headline}
            onChange={(e) => handleFieldChange("headline", e.target.value)}
            placeholder="e.g., Cinematic brand films & launch videos"
          />
        </label>

        <label>
          Summary
          <textarea
            value={form.summary}
            onChange={(e) => handleFieldChange("summary", e.target.value)}
            placeholder="Describe your expertise and style..."
            rows={4}
          />
        </label>

        <div className="form-row">
          <label>
            Timezone
            <select
              value={form.timezone}
              onChange={(e) => handleFieldChange("timezone", e.target.value)}
            >
              <option value="">Select timezone</option>
              <option value="America/New_York">Eastern (US)</option>
              <option value="America/Chicago">Central (US)</option>
              <option value="America/Denver">Mountain (US)</option>
              <option value="America/Los_Angeles">Pacific (US)</option>
              <option value="Europe/London">London (UK)</option>
              <option value="Europe/Paris">Paris (EU)</option>
              <option value="Asia/Tokyo">Tokyo (Japan)</option>
              <option value="Asia/Seoul">Seoul (Korea)</option>
              <option value="Asia/Kolkata">India (IST)</option>
              <option value="Australia/Sydney">Sydney (AU)</option>
            </select>
          </label>
          <label>
            Turnaround (days)
            <input
              type="number"
              value={form.turnaroundDays}
              onChange={(e) => handleFieldChange("turnaroundDays", e.target.value)}
              placeholder="e.g., 3"
              min="1"
            />
          </label>
        </div>

        <label>
          Availability
          <AvailabilityToggle
            value={form.availability}
            onChange={(v) => handleFieldChange("availability", v)}
          />
        </label>

        <label>
          Skills
          <div className="skill-selector">
            {allSkills.map((skill) => (
              <button
                key={skill.id}
                type="button"
                className={`pill selectable ${form.skillIds.includes(skill.id) ? "selected" : ""}`}
                onClick={() => toggleSkill(skill.id)}
              >
                {skill.name}
              </button>
            ))}
          </div>
        </label>

        <button className="button" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>

      <PortfolioManager
        portfolio={portfolio}
        onAdd={handleAddPortfolio}
        onDelete={handleDeletePortfolio}
      />
    </main>
  );
}

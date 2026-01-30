"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
      displayName: formData.get("displayName"),
    };

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Registration failed.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="container">
      <h1>Create account</h1>
      <form className="card" onSubmit={handleSubmit}>
        <label>
          Display name
          <input name="displayName" type="text" />
        </label>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" required minLength={8} />
        </label>
        <label>
          Role
          <select name="role" defaultValue="CLIENT">
            <option value="CLIENT">Client</option>
            <option value="EDITOR">Editor</option>
          </select>
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="button" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
    </main>
  );
}

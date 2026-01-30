import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container">
      <h1>CreaoLink</h1>
      <p>Phase 1 foundation: auth + roles + PostgreSQL.</p>
      <div className="stack">
        <Link className="button" href="/login">Login</Link>
        <Link className="button" href="/register">Register</Link>
        <Link className="button" href="/dashboard">Dashboard</Link>
      </div>
    </main>
  );
}
# Creaolink — Web Application & API (Frontend)

This folder contains the full-stack **Next.js 16 (App Router)** web application for **Creaolink**, featuring real-time Adobe Premiere Pro timeline reviews, timestamped feedback, project rooms, community discovery, and an Upstash Redis caching layer.

> 📖 For full system architecture, animated components, and end-to-end flowcharts, please refer to the [Root README.md](../README.md).

---

## ⚡ Tech Stack

- **Framework**: [Next.js 16.1.6](https://nextjs.org/) (App Router, Server & Client Components)
- **UI Library**: [React 19.2.3](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + Custom Design Tokens (`globals.css`, `ColorBends.css`)
- **Database**: [PostgreSQL 16](https://www.postgresql.org/) (`pg` Connection Pool via `lib/db.ts`)
- **Cache**: [Upstash Redis](https://upstash.com/) (`redis` v5.12 with read-through caching in `lib/cache.ts`)
- **Auth**: [Supabase Auth](https://supabase.com/) & BCrypt
- **Graphics**: [Three.js](https://threejs.org/)

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file inside `frontend/`:

```env
# Database Connection
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/creaolink

# Caching Layer (Upstash or local Redis)
UPSTASH_REDIS_URL=rediss://default:your_token@your-redis-endpoint.upstash.io:6379
# or REDIS_URL=redis://localhost:6379

# Supabase Auth (Optional)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cache Feature Flags (Default: true)
CACHE_FEED=true
CACHE_PROFILE=true
CACHE_PROJECT=true
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## 🔍 Health & Diagnostic Endpoints

- **Redis Health & Latency Check**: `GET /api/health/redis`
  - Returns `200` with ping latency and active feature flags.
  - Returns `503` if Redis is unreachable (API auto-falls back to Postgres safely).

---

## 📚 Project Layout

```
frontend/
├── app/
│   ├── api/             # REST API endpoints (auth, projects, plugin, feedback, feed)
│   ├── auth/            # Multi-step signup and login flow
│   ├── components/      # WebGL canvas background & navigation
│   ├── dashboard/       # Authenticated command center, rooms & profile
│   ├── globals.css      # SaaS design system
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Public landing page & live product preview
└── lib/
    ├── api-client.ts    # Browser fetch client
    ├── api.ts           # Service API calls
    ├── auth.ts          # Session helper
    ├── cache.ts         # Upstash Redis read-through caching & anti-stampede
    ├── db.ts            # PostgreSQL pool & auto-migrations
    ├── invalidation.ts  # Cache key taxonomy & eviction triggers
    └── notifications.ts # Event notification dispatcher
```

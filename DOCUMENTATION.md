# Creaolink Project Documentation

## 1. Platform Overview
**Creaolink** is a collaborative project management and social platform tailored specifically for video editing freelancers and their clients. It acts as a bridge between the creative workspace (Adobe Premiere Pro) and the client review workspace (Web App). 

By integrating directly into Premiere Pro via a custom extension, Creaolink eliminates the friction of rendering heavy video files merely to share timeline progress, metadata, and version history. It allows editors to sync their project timeline states to the cloud seamlessly, where clients can view updates, provide feedback, and track statuses in real-time.

---

## 2. Core User Personas
Creaolink routes users into dedicated experiences based on their account type:
* **Freelancers (Video Editors):** Connect their Adobe Premiere Pro software to Creaolink, receive project specs, sync timeline data (metadata, clip data, markers), and get structured feedback.
* **Clients:** Create project briefs, hire/match with freelancers, track project timelines via the web dashboard without needing Adobe software, and approve progress milestones.

---

## 3. Platform Architecture
The system is divided into two primary environments: a high-performance **Web Cloud Platform** and a **Adobe Premiere Pro UXP Plugin**.

### A. The Web Platform (Frontend & Backend)
Built on a modern serverless stack to ensure performance, SEO, and fast database queries.
* **Framework:** Next.js (App Router)
* **Language:** TypeScript / JavaScript
* **Database:** PostgreSQL (using a connection pool via `lib/db.ts`)
* **Caching Layer:** Upstash Redis. Implementing a sophisticated "Read-Through" caching strategy for heavy API queries (Feed, Profile, Projects).
* **Styling:** Tailwind CSS & Custom CSS (`ColorBends.css`).

### B. The Premiere Pro Extension (`uxp_premier_pro`)
Built using Adobe's Unified Extensibility Platform (UXP) for Adobe Premiere Pro (v22.0+).
* **Location:** Premiere Pro Panel Interface (HTML, CSS, JS).
* **Functionality:** 
  - The editor enters a "Sync Code" generated from the Creaolink web app.
  - The plugin fetches the project and version details using `/api/plugin/link`.
  - The plugin gathers active timeline metadata out of Premiere Pro.
  - Using `/api/plugin/sync`, the plugin pushes a structured JSON payload of the timeline directly to the cloud without needing a full video export.

---

## 4. Key Platform Features

### 1. Unified Dashboard & Authentication
* Multi-role Support: Specialized components (`ClientDashboard.tsx`, `FreelancerDashboard.tsx`) render conditionally based on user authentication.
* Gatekeeping system (`AdminGate.tsx`) manages platform moderation or privileged actions.

### 2. Live Premiere Pro Syncing
* **Timeline Viewer:** The client can view a representation of the Premiere timeline through the web app (`TimelineViewer.tsx`). They can see how much work has been done (cut counts, timeline duration, markers) in real-time.
* **Version Control:** Edits are saved as "Versions" (`versions` DB table), allowing clients to review the evolution of a project and leave localized `feedback`.

### 3. Community Feed & Discovery
* Beyond standard project management, Creaolink features a social network layer.
* Users can create posts (`/api/posts`), comment, leave reactions, follow other users, and view a personalized feed (`/api/feed`).
* The system calculates mutual follows and serves as a discovery engine (`/api/users/search`) for clients to find top freelancers.

---

## 5. Technical Highlights & Performance (RUNBOOK)

Creaolink boasts a finely tuned caching and database indexing system designed for scale.

* **Upstash Redis Optimization:** The platform uses a high-performance Redis cache with targeted Time-To-Live (TTL). 
   - *Feed Cache (90s TTL):* Invalidates when a user posts or follows someone.
   - *Profile Cache (120s TTL):* Stores profile blobs efficiently.
   - *Auto-fallback System:* If Upstash Redis experiences an outage, `lib/cache.ts` gracefully degrades to DB polling with zero API downtime.
* **Anti-Stampede Protection:** A custom in-process memory queue (`inFlightKeys`) prevents identical concurrent cache misses from paralyzing the database (limits cold-start fanouts).
* **Rollout Feature Flags:** Caching layers can be toggled on/off instantly via environment variables (e.g., `CACHE_FEED=false`) if issues arise in production, enabling rapid rollback without the need for deployment pushes.

---

## 6. Real-World Data Flow Example

1. **Client Briefing:** A Client opens the web platform, uses the `CreateProjectModal`, and creates "Promotional Video Q3".
2. **Project Assignment:** A Freelancer accepts the project. Both users see the new project in their `ProjectExplorer`.
3. **Premiere Pro Linking:** The Freelancer opens their local Adobe Premiere Pro. They open the *CreaoLink* Panel and enter a 6-digit sync code provided via the web dashboard.
4. **Editing & Syncing:** The Freelancer edits the video. They hit "Sync" in Premiere. The plugin automatically calls `POST /api/plugin/sync` containing the timeline JSON.
5. **Client Review:** The Client visits the timeline view website. They see the timeline metadata populate instantly and can leave "Feedback" tied directly to the latest synced version. 

---

### File Structure Summary
* `app/auth/` & `app/dashboard/` - Frontend views handling visual logic and user spaces.
* `app/api/` - Next.js internal backend resolving data logic, social actions, and webhook calls from Premiere.
* `lib/` - Shared services (`db.ts` for database connections, `cache.ts` for Redis config).
* `uxp_premier_pro/` - Sideloaded directory containing the Adobe Extension code (`manifest.json`, `api.js`).
<div align="center">

<a href="#readme">
  <img src="./assets/banner.svg" alt="Creaolink Hero Banner" width="100%" />
</a>

<br/>
<br/>

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Upstash Redis](https://img.shields.io/badge/Upstash_Redis-Cache-00E599?style=for-the-badge&logo=redis&logoColor=white)](https://upstash.com/)
[![Adobe Premiere Pro UXP](https://img.shields.io/badge/Adobe_UXP-Premiere_Pro-990000?style=for-the-badge&logo=adobe-premiere-pro&logoColor=white)](https://developer.adobe.com/premiere-pro/uxp/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<p align="center">
  <strong>The Next-Generation Creative Delivery Platform Bridging Adobe Premiere Pro and Cloud Collaboration</strong>
</p>

<p align="center">
  <a href="#-the-creaolink-paradigm">Core Concept</a> •
  <a href="#-system-architecture--flowcharts">Flow Charts</a> •
  <a href="#-animated-components--interactive-ui">Animated Components</a> •
  <a href="#-feature-deep-dive">Features</a> •
  <a href="#-high-performance-caching-tier">Caching &amp; Performance</a> •
  <a href="#-quickstart--installation">Quickstart</a> •
  <a href="#-rest-api-documentation">API Catalog</a>
</p>

---

</div>

## 📌 Executive Summary

In traditional video production, creative reviews are slow, cumbersome, and computationally wasteful. Video editors spend hours rendering multi-gigabyte video files simply to show cut transitions, rough drafts, or timeline revisions to clients. Clients email unformatted comments with imprecise timestamps, and editors scramble to locate the matching frame inside Adobe Premiere Pro.

**Creaolink** completely eliminates this bottleneck. By integrating a custom **Adobe Premiere Pro UXP Extension** with a high-performance **Next.js 16 Cloud Workspace**, editors can sync their project timeline metadata—including clips, tracks, cuts, sequence duration, and markers—**in milliseconds without exporting a single frame of video**. Clients inspect interactive, web-rendered timelines, post timestamped revision notes, and approve milestones in real time.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  TRADITIONAL WORKFLOW                                                                  │
│  [Edit 30min] ──► [Export/Render 45min (4.8GB)] ──► [Upload 20min] ──► [Email Chaos]   │
│                                                                                        │
│  CREAOLINK ZERO-RENDER SYNC                                                            │
│  [Edit 30min] ──► [Click UXP Sync (18KB JSON)] ────► [Instant Web Review in <200ms] ⚡  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ The Creaolink Paradigm

| Challenge | Traditional Production Pipeline | The Creaolink Solution |
| :--- | :--- | :--- |
| **Review Turnaround** | Heavy 4GB+ H.264/ProRes rendering for every intermediate rough cut. | **Zero-Render Sync**: 18KB lightweight JSON metadata payload synced in `<200ms`. |
| **Review Surface** | Fragmented across Google Drive links, Frame.io paywalls, emails, WhatsApp. | **Unified SaaS Workspace**: Briefs, versions, chat, and timeline in one place. |
| **Revision Precision** | Vague feedback like *"fix the cut around 1 minute"*. | **Timestamped & Categorized Work Items**: Linked directly to timeline markers. |
| **Cache & Database Load** | Cold queries spike database CPU during client review surges. | **Sub-10ms Read-Through Redis Tier** with anti-stampede memory locking. |
| **Role Partitioning** | Generic project management tools confuse non-technical clients. | **Tailored Client vs. Freelancer Portals** with role-based feature gating. |

---

## 🏗 System Architecture & Flowcharts

### 1. End-to-End System Architecture

```mermaid
flowchart TB
    subgraph LocalNLE["🖥️ Video Editor Local Machine"]
        PR["🎬 Adobe Premiere Pro (NLE)"]
        UXP["🔌 CreaoLink UXP Plugin (Manifest v5)"]
        PR <-->|"Native Host Scripting\n(Ticks to Seconds / Clip Metadata)"| UXP
    end

    subgraph CloudPlatform["☁️ Creaolink Cloud Infrastructure (Next.js 16 App Router)"]
        APIGW["⚡ Next.js API Gateway (/api/...)"]
        
        subgraph CacheTier["🚀 High-Performance Caching Layer"]
            REDIS[("⚡ Upstash Redis\n(Read-Through Cache / 60-120s TTL)")]
            LOCK["🛡️ Anti-Stampede Memory Queue\n(inFlightKeys Set)"]
        end

        subgraph StorageTier["🗄️ Persistence Layer"]
            PG[("🐘 PostgreSQL Connection Pool\n(JSONB Timelines / Relational Data)")]
            SUPA["🔐 Supabase Auth & Storage"]
        end

        SSR["🌐 React 19 Server & Client Components\n(Tailwind CSS v4 + DM Sans / Instrument Serif)"]
    end

    subgraph ClientBrowsers["👥 Collaborative Web Workspace"]
        CLIENT_DASH["👔 Client Command Center\n(Timeline Viewer, Feedback, Approvals)"]
        FREELANCER_DASH["🎨 Freelancer Dashboard\n(Sync Codes, Assigned Projects, Chat)"]
    end

    UXP -->|"POST /api/plugin/sync\n(18KB Payload + 6-Digit PIN)"| APIGW
    APIGW --> LOCK
    LOCK --> REDIS
    REDIS -.->|"Cache Miss / Invalidation"| PG
    APIGW <--> SUPA
    APIGW --> SSR
    SSR <--> CLIENT_DASH
    SSR <--> FREELANCER_DASH
```

---

### 2. Zero-Render Timeline Sync Sequence Flow

```mermaid
sequenceDiagram
    autonumber
    actor Editor as 🎨 Freelancer (Premiere Pro)
    participant UXP as 🔌 UXP Plugin Panel
    participant API as ⚡ Next.js API Gateway
    participant Redis as 🚀 Upstash Redis
    participant DB as 🐘 PostgreSQL Database
    actor Client as 👔 Client (Web Browser)

    Note over Editor,Client: Phase 1 — Handshake & Linking
    Client->>API: POST /api/projects (Create Project Brief)
    API->>DB: INSERT project (Generate 6-Digit Sync PIN: 849-201)
    Client-->>Editor: Shares Project Sync PIN
    Editor->>UXP: Enters Sync PIN (849-201)
    UXP->>API: POST /api/plugin/link { syncCode: "849-201" }
    API->>DB: Verify PIN & Associate Editor ID
    API-->>UXP: 200 OK (Project Linked: "Promo_Commercial_v4")

    Note over Editor,Client: Phase 2 — Zero-Render Timeline Extraction
    Editor->>UXP: Clicks "Sync Timeline"
    UXP->>UXP: extractTimelineData() -> Inspects Active Sequence
    UXP->>UXP: Converts ticks to seconds, parses Video/Audio tracks & Markers
    UXP->>UXP: buildCleanJSON() -> Strips empty nodes (18KB payload)
    UXP->>API: POST /api/plugin/sync { syncCode, timelineData, versionName }
    
    Note over API,DB: Phase 3 — Invalidation & Ingestion
    API->>DB: INSERT INTO versions (timeline_data JSONB)
    API->>DB: UPDATE projects SET current_version_id
    API->>Redis: Invalidate keys (creaolink:project:{id}, creaolink:projects-list:*)
    API-->>UXP: 200 OK { synced: true, version: "v4" }

    Note over Client,API: Phase 4 — Instant Client Review & Feedback
    Client->>API: GET /api/projects/{id}
    API->>Redis: Read-Through Cache (Hydrated)
    Redis-->>Client: Returns Synced Timeline JSON (<15ms)
    Client->>Client: Renders Interactive Web Timeline (Tracks, Clips, Markers)
    Client->>API: POST /api/feedback { timestamp: "00:01:30", type: "Revision", priority: "High" }
    API->>DB: INSERT INTO feedback
    API->>Redis: Invalidate feedback cache
    API-->>Editor: Realtime Notification (Open Work Item @ 00:01:30)
```

---

### 3. Collaboration Lifecycle & Role Routing

```mermaid
flowchart LR
    Start([User Registration]) --> RoleCheck{Select Role}
    
    subgraph ClientFlow["👔 Client Persona"]
        RoleCheck -->|Client| C1[Create Project Brief & Deadline]
        C1 --> C2[Invite Freelancer via Email / Search]
        C2 --> C3[Generate 6-Digit Sync PIN]
        C3 --> C4[Inspect Synced Sequence on Web]
        C4 --> C5[Submit Timestamped Revision Notes]
        C5 --> C6[Approve Milestone & Sign-off]
    end

    subgraph FreelancerFlow["🎨 Freelancer Persona"]
        RoleCheck -->|Freelancer| F1[Accept Project Invitation]
        F1 --> F2[Open Adobe Premiere Pro]
        F2 --> F3[Enter Sync PIN in CreaoLink Panel]
        F3 --> F4[Click 'Sync Timeline' Button]
        F4 --> F5[Review Client Feedback by Priority]
        F5 --> F6[Resolve Notes & Sync New Version]
    end

    C3 -.->|Handshake PIN| F3
    F4 -.->|Zero-Render Sync| C4
    C5 -.->|Actionable Items| F5
    F6 -.->|Updated Version| C6
```

---

### 4. High-Performance Caching & Invalidation Flow

```mermaid
flowchart TD
    Req([Incoming Request: GET /api/projects/123]) --> CheckFlag{Is CACHE_PROJECT enabled?}
    
    CheckFlag -->|False| HitDB[Query PostgreSQL Database]
    CheckFlag -->|True| CheckInFlight{Key in Anti-Stampede Queue?}

    CheckInFlight -->|Yes - Concurrent Miss| WaitQueue[Wait 200ms & Retry from Cache]
    CheckInFlight -->|No| CheckRedis{Query Upstash Redis}

    CheckRedis -->|CACHE HIT| ReturnHit[Return Cached JSON Payload<br/>x-response-time: &lt;10ms]
    CheckRedis -->|CACHE MISS| AddLock[Add to inFlightKeys Set]
    
    AddLock --> QueryPostgres[Execute Query on PostgreSQL Pool]
    QueryPostgres --> WriteRedis[Write to Upstash Redis with 60s TTL]
    WriteRedis --> RemoveLock[Remove from inFlightKeys Set]
    RemoveLock --> ReturnMiss[Return Fresh JSON<br/>x-response-time: ~85ms]

    subgraph InvalidationEngine["⚡ Invalidation Triggers"]
        Mutate[Mutation: PATCH /api/projects/123 or Sync]
        Mutate --> EvictKey[buildCacheKey -> creaolink:project:123]
        EvictKey --> DelRedis[redisClient.del Key]
    end

    DelRedis -.->|Forces Miss on Next Request| CheckRedis
```

---

### 5. Database Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ PROJECTS : "creates"
    USERS ||--o{ PROJECT_MEMBERS : "belongs_to"
    PROJECTS ||--o{ PROJECT_MEMBERS : "has"
    PROJECTS ||--o{ VERSIONS : "contains"
    VERSIONS ||--o{ FEEDBACK : "targeted_by"
    USERS ||--o{ FEEDBACK : "submits"
    PROJECTS ||--o{ CHAT_MESSAGES : "hosts"
    USERS ||--o{ CHAT_MESSAGES : "sends"
    CHAT_MESSAGES ||--o{ CHAT_ATTACHMENTS : "includes"
    PROJECTS ||--o{ FREELANCER_PRESENCE : "monitors"
    USERS ||--o{ FREELANCER_PRESENCE : "tracks"
    USERS ||--o{ USER_FOLLOWS : "follows"
    USERS ||--o{ POSTS : "publishes"
    POSTS ||--o{ POST_REACTIONS : "receives"
    POSTS ||--o{ POST_COMMENTS : "receives"

    USERS {
        text id PK
        text name
        text email UK
        text username UK
        text password
        text role "client | freelancer | admin"
        timestamptz created_at
    }

    PROJECTS {
        text id PK
        text title
        text description
        text deadline
        text status "active | completed | approved | pending"
        text current_version_id FK
        text sync_code UK "6-Digit Handshake PIN"
        text created_by FK
        text visibility "public | private | followers-only"
        timestamptz created_at
        timestamptz updated_at
    }

    VERSIONS {
        text id PK
        text project_id FK
        text version_name
        text notes
        jsonb timeline_data "Extracted UXP Tracks & Markers"
        timestamptz created_at
    }

    FEEDBACK {
        text id PK
        text project_id FK
        text version_id FK
        text created_by FK
        text type "Revision | Bug | Enhancement | General"
        text priority "High | Medium | Low"
        text timestamp "e.g. 00:01:30"
        text description
        text status "open | resolved"
        timestamptz created_at
    }

    CHAT_MESSAGES {
        text id PK
        text project_id FK
        text sender_id FK
        text body
        timestamptz created_at
    }

    CHAT_ATTACHMENTS {
        text id PK
        text message_id FK
        text file_name
        text mime_type
        int file_size
        text data_url
        timestamptz created_at
    }
```

---

## 🎬 Animated Components & Interactive UI

### 1. Animated Premiere Pro Timeline Sync Emulation

The graphic below demonstrates how the Creaolink web application translates complex Adobe Premiere Pro sequence data into an interactive, readable visualizer for clients:

<div align="center">
  <img src="./assets/timeline_animation.svg" alt="Animated Timeline Sync Component" width="100%" />
</div>

<br/>

### 2. Zero-Render Synchronization Data Bus

<div align="center">
  <img src="./assets/sync_handshake.svg" alt="Zero Render Data Bus" width="100%" />
</div>

<br/>

---

### 3. Interactive Component Breakdowns

<details>
<summary><strong>🎯 Component A: Live Timeline Marker &amp; Timestamped Feedback Inspector (Click to expand)</strong></summary>

<br/>

When a client clicks anywhere on the web timeline ruler or hovers over a marker flag, Creaolink brings up a contextual feedback dialog:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 📍 TIMELINE MARKER INSPECTOR — 00:01:30:12                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Track: Video V1 [02_Interview_CamA.mov]                                         │
│ Priority: [🔴 HIGH PRIORITY]     Category: [🎬 REVISION]     Status: [⏳ OPEN]   │
│                                                                                 │
│ "Client Note: The jump-cut between 01:28 and 01:32 feels too abrupt.           │
│  Please overlay B-Roll sequence #03 with 50% opacity cross-dissolve."           │
│                                                                                 │
│ Author: Sarah Jenkins (Lead Creative Director) • Version: v4                    │
│ [ ✔️ Mark as Resolved ]    [ 💬 Reply to Sarah ]    [ ⏱ Jump in Premiere ]      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

</details>

<details>
<summary><strong>🔐 Component B: 6-Digit Zero-Render Handshake Simulator (Click to expand)</strong></summary>

<br/>

The synchronization handshake between the web room and the local Premiere Pro UXP plugin is governed by secure, one-time or reusable 6-digit sync pins:

| Step | Component | Action / Payload | Result |
| :--- | :--- | :--- | :--- |
| **1. Pin Generation** | Web Dashboard | `GET /api/projects/{id}/link` | Displays `849-201` with copy-to-clipboard button. |
| **2. Plugin Handshake** | Adobe UXP Panel | Enters `849-201` &rarr; `POST /api/plugin/link` | Validates project identity; establishes channel. |
| **3. Timeline Ingestion** | Premiere Pro Host | `extractTimelineData()` | Gathers active tracks, clips, in/out points & markers. |
| **4. Cloud Reflection** | Web Room | Redis cache invalidated &rarr; UI updates | Client sees updated timeline visual in `<200ms`. |

</details>

<details>
<summary><strong>⚡ Component C: Redis Cache &amp; Anti-Stampede Protection Metric (Click to expand)</strong></summary>

<br/>

Creaolink features an in-process anti-stampede queue (`inFlightKeys`) preventing thundering herds on cold starts:

```
Request 1 (Feed query)  ──► Cache MISS ──► Lock "creaolink:feed:user_1" ──► Query Postgres (85ms) ──► Set Cache
Request 2 (Concurrent) ──► Detected In-Flight ──► Awaits 200ms ──────► Reads from Cache (4ms) ──► 0 DB Load!
Request 3 (Concurrent) ──► Detected In-Flight ──► Awaits 200ms ──────► Reads from Cache (4ms) ──► 0 DB Load!
```

</details>

<details>
<summary><strong>👥 Component D: Role-Based Feature Access Matrix (Click to expand)</strong></summary>

<br/>

| Feature Capability | 👔 Client Account | 🎨 Freelancer Account | 🛡️ Platform Admin |
| :--- | :---: | :---: | :---: |
| **Create Projects &amp; Set Deadlines** | ✅ Yes | ❌ Assigned Only | ✅ Full Control |
| **Invite Team Members by Email** | ✅ Yes | ❌ Read Only | ✅ Full Control |
| **Connect Premiere Pro UXP Plugin** | ℹ️ View Code | ✅ Full Sync | ✅ Full Sync |
| **Post Timestamped Feedback** | ✅ Yes | 💬 Comment / Reply | ✅ Yes |
| **Resolve &amp; Close Work Items** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Approve Final Milestone** | ✅ Yes | ❌ Pending | ✅ Override |
| **Public Portfolio &amp; Skills Showcase** | ❌ Profile Only | ✅ Yes (Reputation) | ✅ Yes |

</details>

---

## 🚀 Key Feature Modules

### 1. Dashboard Command Center &amp; KPI Metrics
* **Personalized Briefing**: Dynamic greeting with real-time project statistics.
* **Scannable Metrics**: Live tracking for *Active Projects*, *Open Feedback Items*, *Latest Synced Versions*, and *Reputation Score*.
* **Global Search &amp; Notifications**: Instant project search and categorized notification bell (Chat, Feedback, Versions, Status changes).

### 2. Project Detail Room (The Collaboration Hub)
* **Overview Tab**: Project brief, team members, deadline countdown, and the live timeline viewer.
* **Chat Room Tab**: Sub-second messaging with multi-attachment support (images, video clips, audio wavs, and documents).
* **Feedback Tab**: Filterable checklist (All / Open / Resolved) categorized by Priority (High / Medium / Low) and Type (Revision / Bug / Enhancement).
* **Settings &amp; Access**: Member permission matrix (Admin / Editor / Viewer) and milestone approval triggers.

### 3. Adobe Premiere Pro Timeline Viewer
* **Zero Software Requirement**: Clients view timeline structures without owning or installing Adobe Premiere Pro.
* **Multi-Track Visualization**: Distinct lanes for Video (V1, V2...) and Audio (A1, A2...) with clip names, start times, and durations.
* **Interactive Ruler**: Millisecond-accurate timecode ticks with draggable playhead scrubber.
* **Marker Flag Overlay**: Color-coded markers mapped to native Premiere Pro marker colors (Green, Red, Cyan, Yellow).

### 4. Adobe Premiere Pro UXP Extension (`uxp_premier_pro`)
* **Modern UXP Architecture**: Built on Adobe's Unified Extensibility Platform (Manifest v5).
* **Native NLE Scripting**: Directly accesses `app.project.activeSequence`, video tracks, audio tracks, and clip items.
* **JSON Normalizer**: Strips gaps, null values, and synthetic clips using `buildCleanJSON()` to guarantee minimal payload size.
* **One-Click Sync**: Editors simply tap *Sync Timeline* to publish updates to the cloud.

### 5. Social Discovery, Network &amp; Feed
* **Creator Profiles**: Freelancers showcase skills, verified client reviews, past project showcases, and follower metrics.
* **Community Feed**: Post updates, share video editing techniques, react with likes, and leave comments.
* **Reputation Algorithm**: Automatic score calculation based on timely delivery and resolved feedback ratios.

---

## ⚡ High-Performance Caching Tier

Creaolink implements a multi-tier caching architecture with **Upstash Redis** and **PostgreSQL connection pooling** (`lib/cache.ts` and `lib/invalidation.ts`):

```
┌───────────────────────────────────────────────────────────────────────────┐
│ CACHE KEY TAXONOMY                                                        │
├────────────────────────────────┬─────────┬───────┬────────────────────────┤
│ Key Pattern                    │ Scope   │ TTL   │ Invalidated On         │
├────────────────────────────────┼─────────┼───────┼────────────────────────┤
│ creaolink:feed:{userId}        │ Feed    │ 90s   │ New post, follow/unf.  │
│ creaolink:profile:{userId}     │ Profile │ 120s  │ Follow target change   │
│ creaolink:project:{projectId}  │ Project │ 60s   │ Project PATCH/DELETE   │
│ creaolink:projects-list:{user} │ List    │ 60s   │ Project create/edit    │
└────────────────────────────────┴─────────┴───────┴────────────────────────┘
```

### Resilience &amp; Zero-Downtime Fallback
* **Auto-Fallthrough**: If Redis is offline or unreachable, the system transparently falls back to direct PostgreSQL queries without throwing 500 errors.
* **Feature Flag Control**: Individual caches can be toggled in real time without redeployment via environment variables (`CACHE_FEED=false`, `CACHE_PROFILE=false`, `CACHE_PROJECT=false`).
* **Optimized Database Indexes**: Pre-configured composite indexes on `project_members(user_id)`, `projects(updated_at DESC)`, and `feedback(project_id, status)`.

---

## 🛠 Tech Stack &amp; Dependencies

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | [Next.js 16.1.6](https://nextjs.org/) (App Router) | Server Components, API routes, optimized asset delivery |
| **UI Library** | [React 19.2.3](https://react.dev/) | Component architecture, responsive interactivity |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + Custom CSS | Modern dark SaaS design system (`ColorBends.css`) |
| **Primary Database** | [PostgreSQL](https://www.postgresql.org/) (`pg` Pool) | Relational persistence, JSONB timeline storage |
| **Cache Engine** | [Upstash Redis](https://upstash.com/) (`redis` v5.12) | Sub-10ms read-through caching &amp; anti-stampede |
| **Authentication** | [Supabase Auth](https://supabase.com/) &amp; BCrypt | Google OAuth, email/password, session tokens |
| **3D &amp; Motion** | [Three.js](https://threejs.org/) | Dynamic background shaders &amp; interactive graphics |
| **NLE Extension** | [Adobe Premiere Pro UXP](https://developer.adobe.com/premiere-pro/uxp/) | Native Adobe C++/JS runtime plugin |

---

## 📦 Quickstart &amp; Installation

### Prerequisites
* **Node.js**: `v18.18.0` or higher
* **npm** or **pnpm**
* **PostgreSQL**: Local instance or hosted (Supabase, Neon, Railway)
* **Redis**: Local or [Upstash Redis](https://upstash.com/) (Optional but recommended)
* **Adobe Premiere Pro 2023+** (v23.0 to v25.x) &amp; **Adobe UXP Developer Tool** (for NLE plugin)

---

### Step 1: Clone Repository &amp; Install Dependencies

```bash
# Clone the repository
git clone https://github.com/imkunal01/Creaolink.git
cd Creaolink

# Install frontend web dependencies
cd frontend
npm install
```

---

### Step 2: Environment Configuration

Create a `.env` file inside the `frontend/` directory:

```env
# Database Connection
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/creaolink

# Caching Tier (Upstash or Redis URL)
UPSTASH_REDIS_URL=rediss://default:your_token@your-redis-endpoint.upstash.io:6379
# or REDIS_URL=redis://localhost:6379

# Supabase Authentication (Optional / OAuth)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Caching Feature Flags (Default: true)
CACHE_FEED=true
CACHE_PROFILE=true
CACHE_PROJECT=true
```

---

### Step 3: Run Database Auto-Migrations &amp; Start Server

The database tables and indexes initialize automatically upon first server boot via `lib/db.ts`:

```bash
# Inside the frontend/ directory:
npm run dev
```

The web application will be live at **`http://localhost:3001`** (or `http://localhost:3000`).

---

### Step 4: Install &amp; Load Adobe Premiere Pro UXP Plugin

1. Download and open the **Adobe UXP Developer Tool (UDT)**.
2. Click **Add Plugin** and navigate to the project's `uxp_premier_pro/manifest.json` file.
3. Launch **Adobe Premiere Pro** and open any project with an active timeline sequence.
4. In the UDT window, click the **Actions (•••)** menu next to *CreaoLink* and select **Load**.
5. Inside Premiere Pro, navigate to **Window &rarr; Extensions &rarr; CreaoLink**.
6. Enter the **6-digit Sync Code** generated from your web project and click **Link &amp; Sync**!

---

## 🌐 REST API Documentation

### Authentication &amp; Users

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/login` | Email/password &amp; role-based login | No |
| `POST` | `/api/auth/signup` | Onboarding flow &amp; user registration | No |
| `GET` | `/api/users/me` | Fetch active authenticated user profile | Yes (`x-user-id`) |
| `GET` | `/api/users/search?q={query}` | Search freelancers &amp; clients by handle | Yes |
| `GET` | `/api/users/[id]` | Fetch public profile, portfolio &amp; reputation | Optional |
| `POST` | `/api/users/[id]/follow` | Follow / unfollow a creator | Yes |

### Project Rooms &amp; Versions

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/projects` | List all projects for authenticated user | Yes |
| `POST` | `/api/projects` | Create a new project brief &amp; generate Sync PIN | Yes (Client/Admin) |
| `GET` | `/api/projects/[id]` | Get detailed project room data &amp; timeline | Yes |
| `PATCH` | `/api/projects/[id]` | Update title, description, deadline, or status | Yes |
| `POST` | `/api/projects/[id]/versions` | Create a new version snapshot manually | Yes |

### Adobe Premiere Pro Plugin Sync

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/plugin/link` | Validate 6-digit sync code &amp; link plugin | Plugin Token |
| `POST` | `/api/plugin/sync` | Ingest extracted Premiere Pro timeline JSON | Plugin Token |

### Feedback &amp; Chat

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/feedback?projectId={id}` | Fetch all feedback items for a project | Yes |
| `POST` | `/api/feedback` | Submit timestamped revision note | Yes |
| `PATCH` | `/api/feedback/[id]` | Mark feedback item as *Resolved* or *Open* | Yes |
| `GET` | `/api/projects/[id]/chat` | Fetch recent chat messages &amp; attachments | Yes |
| `POST` | `/api/projects/[id]/chat` | Send message with media attachments | Yes |

### System Health &amp; Diagnostics

| Method | Endpoint | Description | Expected Output |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health/redis` | Upstash Redis connection status &amp; flags | `{ ok: true, latencyMs: 8, flags: {...} }` |

---

## 📂 Project Directory Structure

```
Creaolink/
├── assets/                          # Animated SVGs, UI visualizers, and project badges
│   ├── banner.svg                   # Animated repository header banner
│   ├── timeline_animation.svg       # Animated Premiere Pro timeline visualizer
│   └── sync_handshake.svg           # Zero-render sync data bus animation
│
├── frontend/                        # Full-Stack Next.js 16 Web Application
│   ├── app/                         # Next.js App Router
│   │   ├── api/                     # REST API Endpoints
│   │   │   ├── auth/                # Login, signup, and session routes
│   │   │   ├── feed/                # Social feed with Redis cache
│   │   │   ├── feedback/            # Timestamped review management
│   │   │   ├── health/              # Health & Redis diagnostic routes
│   │   │   ├── plugin/              # UXP Link & Timeline Sync endpoints
│   │   │   ├── posts/               # Community posts & comments
│   │   │   ├── projects/            # Project room CRUD & chat
│   │   │   └── users/               # User search, profile & follow routes
│   │   ├── auth/                    # Multi-step signup & login pages
│   │   ├── components/              # Global UI elements & WebGL background
│   │   ├── dashboard/               # Authenticated SaaS Shell
│   │   │   ├── components/          # Topbar, Sidebar, TimelineViewer, Stats
│   │   │   ├── profile/             # Profile & portfolio views
│   │   │   └── projects/            # Project list & [id] detail control room
│   │   ├── globals.css              # Custom SaaS Design System (Charcoal & Red)
│   │   ├── layout.tsx               # Root application layout
│   │   └── page.tsx                 # Public Landing Page & Live Demo
│   │
│   └── lib/                         # Core Backend & Utility Libraries
│       ├── api-client.ts            # Client-side API fetch wrapper
│       ├── api.ts                   # Centralized API service functions
│       ├── auth.ts                  # Local session management
│       ├── cache.ts                 # Upstash Redis read-through caching engine
│       ├── db.ts                    # PostgreSQL connection pool & migrations
│       ├── invalidation.ts          # Cache key taxonomy & invalidators
│       └── notifications.ts         # Real-time event notifications
│
├── uxp_premier_pro/                 # Adobe Premiere Pro UXP Plugin
│   ├── api.js                       # HTTP client communicating with Creaolink API
│   ├── index.html                   # UXP Panel UI layout
│   ├── main.js                      # Extension controller & event handlers
│   ├── manifest.json                # Adobe UXP v5 manifest configuration
│   ├── storage.js                   # Persistent plugin preferences
│   ├── styles.css                   # Premiere Pro dark theme styling
│   └── timeline.js                  # Native timeline parser (Clips, Tracks, Markers)
│
├── DOCUMENTATION.md                 # Complete platform technical documentation
├── RUNBOOK.md                       # API cache operations & outage playbook
├── UIUX_FLOW.md                     # Comprehensive UI/UX specification & wireframes
└── README.md                        # Master repository documentation (This file)
```

---

## 🛡️ Operational Diagnostics & Runbook

### Testing Redis Cache Performance
Run this test from your terminal to verify sub-10ms cache latency:

```bash
# 1. Check Redis Health & Feature Flags
curl -X GET http://localhost:3001/api/health/redis

# 2. Benchmark Feed Cache Miss vs. Cache Hit
curl -I http://localhost:3001/api/feed -H "x-user-id: test_user"
# Output on Call 1: [Cache] MISS (~85ms)

curl -I http://localhost:3001/api/feed -H "x-user-id: test_user"
# Output on Call 2: [Cache] HIT (~7ms)
```

### Emergency Cache Rollback
If you suspect stale cache data during heavy project edits, disable the cache instantly via environment variable without downtime:
```env
CACHE_PROJECT=false
CACHE_FEED=false
```

---

## 🤝 Contributing

Contributions to Creaolink are warmly welcome!

1. Fork the Project repository.
2. Create your Feature Branch (`git checkout -b feature/ZeroRenderEnhancement`).
3. Commit your Changes (`git commit -m 'feat: Add multi-sequence timeline sync'`).
4. Push to the Branch (`git push origin feature/ZeroRenderEnhancement`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
  <p>Built with ❤️ for Video Editors, Motion Designers, and Creative Teams worldwide.</p>
  <p><strong>Creaolink</strong> — Real-Time Premiere Pro Sync &amp; Creative Review Workspace.</p>
</div>

# 🎬 Creaolink Premiere Pro Plugin  
**End-to-End Technical Documentation**


### What problem are we solving?
Editors work in Adobe Premiere Pro, but:
- Timelines are locked inside `.prproj` files  
- No proper version history  
- No collaboration / syncing  
- No way to connect timeline logic to external systems  

### What Creaolink does
Creaolink is an external platform that:
- Stores timeline metadata  
- Tracks versions  
- Enables collaboration  
- Enables future automation & analytics  

### What this plugin does (scope locked)
The Premiere Pro plugin extracts timeline metadata and syncs it with Creaolink in real-time or on demand.

#### ❌ Explicitly NOT in scope
- No raw video/audio transfer  
- No frame processing  
- No media rendering  
- No editing Premiere files directly  

#### ✅ In scope
- Timeline structure  
- Tracks, clips, markers  
- Timecodes  
- Asset references  
- Version snapshots  

---

## 2. High-Level System Architecture
```
┌─────────────────────────────┐
│ Adobe Premiere Pro          │
│                             │
│ ┌─────────────────────────┐ │
│ │ UXP Plugin (Creaolink)  │ │
│ │                         │ │
│ │  UI (Panel)             │ │
│ │  Controller             │ │
│ │  Premiere API Adapter   │ │
│ └───────────┬─────────────┘ │
└─────────────│───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ Creaolink Backend           │
│ (REST API)                  │
│                             │
│  Timeline Store             │
│  Versioning Engine          │
│  Diff Engine                │
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│ Creaolink Frontend          │
│ (Web App)                   │
└─────────────────────────────┘
```

---

## 3. Tech Stack (Locked & Justified)

### Plugin (Premiere Pro)
| Layer | Tech |
|---|---|
| Plugin Platform | UXP (Adobe) |
| Language | JavaScript (ES2020+) |
| UI | HTML + CSS |
| APIs | Premiere Pro UXP APIs |
| Dev Tool | Adobe UXP Developer Tool |

**Why UXP:**
- Official  
- Future-proof  
- Secure  
- Required for Adobe Marketplace  

### Backend (Creaolink)
| Layer | Tech (suggested) |
|---|---|
| Server | Node.js |
| API | REST |
| Auth | JWT / API Key |
| DB | PostgreSQL / MongoDB |
| Versioning | Hash-based snapshots |

> Plugin is backend-agnostic.

---

## 4. Plugin Responsibilities (Clear Separation)

### Plugin MUST:
- Read timeline metadata  
- Normalize data  
- Send to backend  
- Handle errors gracefully  

### Plugin MUST NOT:
- Store business logic  
- Compute diffs  
- Handle collaboration logic  

> **Plugin = Bridge, not brain.**

---

## 5. Folder Structure (Production-Grade)
```
creaolink-premiere-plugin/
│
├── manifest.json
├── index.html
├── styles.css
├── main.js
│
├── core/
│   ├── controller.js
│   ├── syncService.js
│   ├── timelineService.js
│
├── adapters/
│   └── premiereAdapter.js
│
├── models/
│   ├── sequence.model.js
│   ├── track.model.js
│   └── clip.model.js
│
├── utils/
│   ├── logger.js
│   └── timecode.js
│
└── config/
    └── env.js
```

**This structure:**  
- Scales  
- Is testable  
- Is interview-ready  

---

## 6. Data Model (Critical)

### Timeline Snapshot (Core Payload)
```json
{
  "projectId": "creaolink-project-id",
  "sequence": {
    "id": "premiere-seq-id",
    "name": "Main Edit",
    "fps": 29.97,
    "duration": 5400,
    "tracks": [
      {
        "type": "video",
        "index": 0,
        "clips": [
          {
            "id": "clip-uuid",
            "name": "intro.mp4",
            "start": 0,
            "end": 300,
            "in": 10,
            "out": 310,
            "assetId": "premiere-project-item-id"
          }
        ]
      }
    ],
    "markers": []
  },
  "meta": {
    "capturedAt": "2026-01-30T12:30:00Z",
    "pluginVersion": "1.0.0"
  }
}
```

---

## 7. Detailed Component Design

### A) UI Layer
**Purpose:**  
- Minimal interaction  
- Clear status  

**UI Elements:**  
- Connect to Creaolink  
- Sync Timeline  
- Status indicator  

> UI never talks to Premiere APIs directly.

### B) Controller Layer
**Purpose:**  
- Entry point for all user actions  

```js
onSyncClicked() {
  validateState();
  const timeline = TimelineService.capture();
  SyncService.push(timeline);
}
```

### C) Premiere Adapter (Most Important)
**Purpose:**  
- Abstract Premiere API complexity  

**Key Methods:**  
- `getActiveSequence()`  
- `getTracks(sequence)`  
- `getClips(track)`  
- `getMarkers(sequence)`  

> This layer never returns Premiere objects — only plain JS.

### D) Timeline Service
**Purpose:**  
- Normalize data  
- Convert timecodes  
- Generate hashes  

**Example:**  
`generateStableHash(sequence)`  

Used for version comparison.

### E) Sync Service
**Purpose:**  
- Authentication  
- API calls  
- Retry logic  

`POST /api/timeline/sync`

---

## 8. Authentication Strategy

**MVP:**  
- API Key (stored securely via UXP storage)

**Later:**  
- OAuth flow  
- User login via Creaolink  

---

## 9. Error Handling Strategy
| Scenario | Behavior |
|---|---|
| No active sequence | Show UI warning |
| API unreachable | Retry + offline queue |
| Partial data failure | Skip + log |
| Permission denied | Hard fail |

> Never crash Premiere. Ever.

---

## 10. Development Setup (Step-by-Step)

### Step 1: Install Tools
- Adobe Premiere Pro (Trial OK)  
- Adobe UXP Developer Tool  
- Node.js  

### Step 2: Create Plugin
- Create folder  
- Add `manifest.json`  

```json
{
  "manifestVersion": 5,
  "id": "com.creaolink.premiere",
  "name": "Creaolink Sync",
  "version": "1.0.0",
  "host": {
    "app": "PPRO",
    "minVersion": "22.0"
  },
  "ui": {
    "type": "panel",
    "mainPath": "index.html"
  }
}
```

### Step 3: Load Plugin
- Open UXP Developer Tool  
- Add plugin folder  
- Launch Premiere  
- Open via:  
  **Window → Extensions (UXP) → Creaolink Sync**

### Step 4: Develop & Debug
- Use UXP console  
- `console.log()` works  
- Hot reload supported  

---

## 11. Deployment Options

### Option A: Private Distribution (MVP)
- Zip plugin  
- Manual install  
- Ideal for testing  

### Option B: Adobe Marketplace (Production)
**Requirements:**  
- Adobe Developer Account  
- Plugin signing  
- Security review  
- Privacy policy  

**Steps:**  
- Package plugin  
- Sign via Adobe tools  
- Submit to Marketplace  
- Review → Publish  

> Mandatory for real users.

---

## 12. Security & Compliance
- No media access  
- Metadata only  
- Explicit permissions  
- User-consented sync  
- GDPR-friendly by design  

---

## 13. Roadmap

**Phase 1**  
- Manual sync  
- JSON snapshots  

**Phase 2**  
- Auto sync on timeline change  
- Version diffs  

**Phase 3**  
- Collaboration  
- Timeline restore  
- Analytics  

---

## 14. Why This Plugin Is Strong

**For you personally:**  
- Adobe ecosystem knowledge  
- System design  
- Real product thinking  
- SaaS-ready integration  
- Resume + startup aligned  

> This is not just a plugin — this is infrastructure.

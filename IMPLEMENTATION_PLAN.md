# SIH 2026 Problem Explorer — Implementation Plan

## Project Objective

Build a focused research and decision-making tool that allows a user to efficiently browse, search, filter, evaluate, shortlist, annotate, and compare all 226 SIH 2026 problem statements — without losing any user progress across browser refreshes, server restarts, or project reopens.

---

## Environment Discovered

| Item | Detail |
|---|---|
| OS | macOS (arm64) |
| Python | 3.14.6 (built-in http.server available) |
| Node.js | v24.20.0 (via nvm, v20.20.2 default) |
| npm | 11.19.0 |
| Homebrew | Not installed |
| Package manager | pip 26.1.2 |
| Workspace | `/Users/bhagyaasatimackbook/Documents/SIH 2026/` |

---

## Architecture

**Lightweight Python backend + pure HTML/CSS/JS frontend.**

No framework overhead. No npm build step for the frontend. Python's built-in `http.server` augmented with a small custom request handler for the persistence API.

### Why this stack?
- Zero npm dependencies for the frontend
- No React/Vue/Angular build pipeline
- Python stdlib only for the backend (no pip installs)
- Fast startup, minimal disk usage
- Persistence via local JSON file writes

---

## Technology Stack

| Layer | Technology |
|---|---|
| Backend server | Python 3 `http.server` (custom handler) |
| API | Python HTTP handler — JSON REST endpoints |
| Frontend | Vanilla HTML5 + CSS3 + JavaScript (ES2020) |
| Data store | `data/sih_2026_problems.json` (read-only research) |
| User state | `data/user_progress.json` (read/write) |
| Fonts | Inter via Google Fonts |

---

## Data Architecture

```
data/
  sih_2026_problems.json    ← READ-ONLY: research dataset (226 records)
  user_progress.json        ← READ-WRITE: all user state
```

### sih_2026_problems.json structure

```json
{
  "total": 226,
  "problems": [{
    "id": "SIH26001",
    "title": "...",
    "organization": "...",
    "category": "Software|Hardware",
    "theme": "...",
    "research_categories": ["AI/ML", ...],
    "technology_opportunities": [...],
    "existing_solutions": [...],
    "feasibility": { "technical": 7, "hardware": "...", "time": "...", "data_risk": "..." },
    "scores": { "Innovation": 7, "Impact": 9, ... "Overall Opportunity": 8 },
    "risks": [...],
    "quick_verdict": "...",
    "summary": "..."
  }]
}
```

### user_progress.json structure

```json
{
  "version": "1.0",
  "last_updated": "ISO timestamp",
  "read": ["SIH26001", ...],
  "shortlist": ["SIH26003", ...],
  "notes": { "SIH26001": "my note here" },
  "personal_scores": {
    "SIH26001": {
      "interest": 4, "innovation": 5, "feasibility": 3,
      "impact": 5, "technical_depth": 4, "overall": 4.2
    }
  },
  "tags": { "SIH26001": ["NLP", "priority"] },
  "recently_viewed": ["SIH26001", ...],
  "preferences": {
    "theme": "light",
    "density": "normal",
    "default_sort": "id",
    "show_research_sections": true
  }
}
```

---

## Persistence Architecture

Every user action triggers an HTTP POST/PATCH to the local Python server:

```
User action (JS)
  → fetch('/api/progress', { method: 'PATCH', body: JSON })
  → Python handler receives delta
  → Reads current user_progress.json
  → Merges delta
  → Writes user_progress.json atomically (write to .tmp then rename)
  → Returns 200 OK
```

On page load:
```
fetch('/api/progress') → returns full user_progress.json
fetch('/api/problems') → returns sih_2026_problems.json
→ JS merges both into application state
→ UI renders
```

**Atomicity:** Write to `.tmp` file first, then `os.replace()` for atomic swap.

---

## Application Structure

```
SIH 2026/
├── SIH_2026_MASTER_RESEARCH.md     ← PRIMARY SOURCE (untouched)
├── data/
│   ├── sih_2026_problems.json      ← Research dataset
│   └── user_progress.json          ← User state (persistent)
├── scripts/
│   └── parse_research.py           ← Parser (run once)
├── app/
│   ├── server.py                   ← Python HTTP server + API
│   └── static/
│       ├── index.html              ← Main SPA
│       ├── app.js                  ← Application logic
│       └── style.css               ← Styles
├── IMPLEMENTATION_PLAN.md
└── FEATURE_PLAN.md
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/problems` | Return full problem dataset |
| GET | `/api/progress` | Return current user progress |
| PATCH | `/api/progress` | Update user progress (delta merge) |
| GET | `/api/health` | Health check |
| GET | `/` | Serve index.html |
| GET | `/static/*` | Serve static files |

---

## Development Phases

### Phase 1 — Data
- [x] Run parser → sih_2026_problems.json (226 records)
- [x] Initialize user_progress.json

### Phase 2 — Backend
- [ ] Write server.py with static file serving + JSON API

### Phase 3 — Frontend
- [ ] style.css (design system)
- [ ] index.html (layout skeleton)
- [ ] app.js (full application logic)

### Phase 4 — Verification
- [ ] Data integrity check
- [ ] Persistence test
- [ ] UI walkthrough

---

## Verification Plan

1. `python3 app/server.py` → starts on port 8000
2. Navigate to `http://localhost:8000`
3. Verify 226 problems load
4. Mark a problem read → refresh → confirm persisted
5. Add shortlist → restart server → confirm persisted
6. Add note + score → refresh → confirm persisted
7. Compare shortlisted problems
8. Dashboard numbers match actual data

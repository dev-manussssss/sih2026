# SIH 2026 Problem Explorer — Feature Plan

> **Living Document**: Edit this file to track and request new features.
> Each checked item below is fully implemented and tested.

---

## Core Features

- [x] View all 226 verified problem statements (SIH26001 – SIH26226)
- [x] Fast live search across all fields (ID, title, org, theme, category, domains, keywords, solutions)
- [x] Multi-criteria filtering (Category/Track, Theme, Organization, Domain, Read/Unread/Shortlisted status)
- [x] Multi-criteria sorting (Problem ID, Title A–Z, Title Z–A, Opportunity Score, Feasibility, Impact, Recently Viewed)
- [x] Full Problem Detail modal view with categorized sections
- [x] Mark as Read / Mark as Unread toggle
- [x] Bookmark to Shortlist / Remove from Shortlist
- [x] Personal Team Notes (per problem) with auto-saving debouncer
- [x] Personal 5-Star Rating (Interest, Innovation, Feasibility, Impact, Tech Depth) + dynamic average
- [x] Dashboard Overview with dynamic KPI counters, progress bar, top candidates, and breakdown charts
- [x] Compare Shortlisted Problems (18+ comparison metrics in a clean side-by-side matrix)
- [x] Top Candidates ranked view
- [x] Export Shortlist to Markdown report (`.md`)
- [x] Export Shortlist to CSV spreadsheet (`.csv`)
- [x] Global keyboard shortcuts (`/` to search, `Escape` to close detail/compare modals)

---

## Research & Data Display

- [x] Official SIH information table (ID, Title, Organization, Department, Track, Theme)
- [x] Problem interpretation & scope analysis
- [x] Research domains & specialization tags
- [x] Technology opportunities & stack recommendations
- [x] Existing solutions & prior art benchmarks
- [x] Gap analysis & differentiation opportunities
- [x] Proposed solution direction & prototype blueprints
- [x] Feasibility assessment (Technical 1–10, Hardware, Time, Data Availability Risk)
- [x] Identified project risks
- [x] Opportunity Assessment criteria scores (Innovation, Impact, Feasibility, Differentiation, Tech Depth)
- [x] Quick verdict badges

---

## Persistence & Hosting (Vercel & Offline Ready)

- [x] Dual-layer persistence: instant `localStorage` saving (primary for Vercel/web) + local API file saving
- [x] Read status persistence
- [x] Shortlist bookmarks persistence
- [x] Personal team notes persistence
- [x] 5-Star personal ratings persistence
- [x] Recently viewed history persistence
- [x] User preferences persistence (Theme, Density, Default Sort, Section Visibility)
- [x] Auto-saving on every action (no manual save required)
- [x] User state survives browser refreshes, tab closures, and system restarts
- [x] Independent progress for every friend/user visiting the hosted URL
- [x] Export user progress as JSON backup file (`.json`)
- [x] Import user progress from JSON backup file (restore across devices/browsers)
- [x] Vercel static hosting configuration (`vercel.json`)
- [x] Git repository & `.gitignore` configuration
- [x] Step-by-step GitHub & Vercel deployment instructions in `README.md`

---

## Settings & Customization

- [x] Dark / Light mode theme switcher
- [x] Display density modes (Compact / Normal / Comfortable)
- [x] Default sort order selector
- [x] Toggle visibility of research & inference sections
- [x] Progress backup download (JSON)
- [x] Progress backup restore (JSON file picker)
- [x] Reset progress with safety confirmation dialog
- [x] Dataset information & metadata summary

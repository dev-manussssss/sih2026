# SIH 2026 Problem Statement Explorer

A research, evaluation, and decision-making platform for all **226 Smart India Hackathon (SIH) 2026 problem statements**.

Built for hackathon participants, teams, mentors, and organizers to browse, filter, evaluate, shortlist, score, and select their ideal SIH 2026 project.

---

## Key Highlights

- **Complete Dataset**: All **226 problem statements** (SIH26001 – SIH26226) imported and verified from `SIH_2026_MASTER_RESEARCH.md`.
- **Zero Build Overhead**: Pure, lightweight Vanilla HTML5 + CSS3 + ES2020 JavaScript. Zero npm dependencies, zero build steps, instant loading.
- **Vercel & Static-Ready**: Designed for 1-click deployment on **Vercel**, **GitHub Pages**, or local Python execution.
- **Rock-Solid User Persistence**:
  - Automatically saves all your read marks, bookmarks/shortlist, team notes, and 5-star ratings directly into browser `localStorage`.
  - Your progress survives page refreshes, browser restarts, and device reboots.
  - Each friend/visitor who visits the live URL has their own independent progress.
- **Data Export & Import**:
  - **Export JSON Backup**: Save your complete progress file to transfer across laptops or browsers.
  - **Import JSON Backup**: Restore your notes, ratings, and shortlist anytime.
  - **Export Shortlist as Markdown**: Download a formatted team evaluation report to share in Discord / Slack / WhatsApp.
  - **Export Shortlist as CSV**: Open shortlisted problems directly in Microsoft Excel or Google Sheets.

---

## Features

### 1. Problem Browsing & Live Search
- Real-time search across ID, Title, Organization, Ministry, Category, Theme, Research Domains, Tech Stack, and Existing Solutions.
- Track filtering: **Software (151)** and **Hardware (29)**.
- Status filtering: **All**, **Unread**, **Read**, **Shortlisted**.
- Dropdown filters for **Themes**, **Organizations**, and **Research Domains**.
- Multi-sort: by Problem ID, Title A–Z / Z–A, Highest Opportunity Score, Highest Technical Feasibility, Highest Impact, or Recently Viewed.

### 2. Comprehensive Problem Detail View
- **Official SIH Information**: Problem ID, Title, Organization, Department, Category, Theme.
- **Problem Interpretation & Scope**: Research inference and problem breakdown.
- **Domains & Tech Stack**: AI/ML, GIS/Remote Sensing, IoT, Cybersecurity, Computer Vision, Robotics, etc.
- **Existing Solutions & Prior Art**: Comparative research benchmarks.
- **Gap Analysis**: Identified opportunities for differentiation and unique hackathon features.
- **Proposed Solution Direction**: Actionable blueprint and prototype direction.
- **Feasibility Breakdown**: Technical score (1–10), hardware requirements, time feasibility, data availability risk.
- **Opportunity Assessment**: Criteria scores (Innovation, Impact, Feasibility, Differentiation, Technical Depth).
- **Personal Team Notes**: Interactive textarea with auto-save.
- **5-Star Team Rating**: Score problems on Team Interest, Innovation, Feasibility, Impact, and Tech Depth with auto-calculated overall rating.

### 3. Dashboard & Analytics
- Live dynamic counter cards: Total Problems, Read count (% completed), Unread remaining, Shortlisted, Software, Hardware.
- Reading progress visualization bar.
- Top Candidates table ranked by research opportunity score.
- Breakdown charts: Distribution by Theme, Research Domain, Organization, and Theme-level reading progress.

### 4. Shortlist & Side-by-Side Comparison
- Star/bookmark problems into your shortlist.
- Dedicated Shortlist page displaying summaries, team ratings, and personal notes.
- **Side-by-Side Compare Matrix**: Compare multiple shortlisted problems across 18+ technical, feasibility, and scoring metrics.

### 5. Settings & Customization
- Clean Light Mode & Sleek Dark Mode.
- Display Density adjustment (Compact / Normal / Comfortable).
- Configurable default sort order.
- Toggle visibility of research/inference sections.
- Backup & Restore data management.

---

## How to Host on GitHub & Vercel

### Step 1: Push to GitHub

1. Open your terminal in this project directory:
   ```bash
   cd "/Users/bhagyaasatimackbook/Documents/SIH 2026"
   ```

2. Initialize and commit your files:
   ```bash
   git add .
   git commit -m "Initial commit: SIH 2026 Problem Explorer web app"
   ```

3. Create a new repository on [GitHub](https://github.com/new) (e.g., `sih-2026-problem-explorer`).

4. Link and push to your GitHub repository:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/sih-2026-problem-explorer.git
   git push -u origin main
   ```

---

### Step 2: Deploy to Vercel

1. Go to [Vercel](https://vercel.com) and log in (with your GitHub account).
2. Click **"Add New..."** → **"Project"**.
3. Select your GitHub repository (`sih-2026-problem-explorer`) and click **"Import"**.
4. In the configuration screen:
   - **Framework Preset**: Select `Other` (or leave default).
   - **Root Directory**: `./` (default).
   - **Build & Output Settings**: Leave empty (no build step required).
5. Click **"Deploy"**.

**That's it!** In 10 seconds, Vercel will give you a public URL (e.g., `https://sih-2026-problem-explorer.vercel.app`) that you can share with your friends.

---

## How to Run Locally

If you want to run the application locally on your computer:

```bash
# Start the lightweight Python server
python3 app/server.py 8000
```

Open your browser and navigate to:
```
http://localhost:8000
```

---

## Project Structure

```
SIH 2026/
├── index.html                   # Main application SPA (root for Vercel/Static hosting)
├── style.css                    # Design system (light/dark themes, responsive layouts)
├── app.js                       # Application logic (search, filter, compare, persistence)
├── vercel.json                  # Vercel routing and cache configuration
├── .gitignore                   # Git ignore configuration
├── README.md                    # Project documentation & deployment guide
├── SIH_2026_MASTER_RESEARCH.md  # Master research source of truth (226 problem statements)
├── data/
│   ├── sih_2026_problems.json   # Structured JSON dataset (226 verified records)
│   └── user_progress.json       # User progress state file
├── scripts/
│   └── parse_research.py        # Python parser (converts Markdown -> JSON dataset)
└── app/
    ├── server.py                # Local Python server with REST endpoints
    └── static/                  # Mirror of static assets for app/ structure
```

---

## Data Integrity & Source of Truth

- **Master Document**: `SIH_2026_MASTER_RESEARCH.md`
- **Total Problem Records**: 226
- **Unique Problem IDs**: SIH26001 – SIH26226 (0 duplicates, 0 missing IDs)
- **Official Tracks**: Software (151), Hardware (29), Snapshot pending rows (46)
- **Organizations**: 30 government ministries, state departments, and autonomous bodies.

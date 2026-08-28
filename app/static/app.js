/**
 * SIH 2026 Problem Explorer — Application Logic
 * Pure vanilla ES2020 — Zero dependencies.
 * Full offline-first & Vercel-ready persistence via localStorage + API sync.
 */

'use strict';

const STORAGE_KEY = 'sih_2026_user_progress';

// ── Application State ───────────────────────────────────────────────────
const state = {
  problems: [],          // all 226 records
  progress: null,        // user progress object
  view: 'all',           // all | dashboard | shortlist | top | compare | settings
  search: '',
  filters: {
    category: '',        // Software | Hardware | ''
    read: '',            // read | unread | shortlisted | ''
    theme: '',
    org: '',
    rescat: '',
  },
  sort: 'id',
  detailId: null,        // currently open problem ID in detail view
  filteredIds: [],       // problem IDs in current list view
  saveTimer: null,
};

// ── DOM Helpers ─────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// Default Progress State
function defaultProgress() {
  return {
    version: '1.0',
    last_updated: new Date().toISOString(),
    read: [],
    shortlist: [],
    notes: {},
    personal_scores: {},
    tags: {},
    recently_viewed: [],
    preferences: {
      theme: 'light',
      density: 'normal',
      default_sort: 'id',
      show_research_sections: true,
    }
  };
}

// ── Data Loader (Multi-Path Fallback for Local & Vercel) ────────────────
async function loadProblemsData() {
  const candidateUrls = [
    'data/sih_2026_problems.json',
    '/data/sih_2026_problems.json',
    './data/sih_2026_problems.json',
    '/api/problems',
    '../data/sih_2026_problems.json'
  ];

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.problems && Array.isArray(data.problems)) {
          return data.problems;
        }
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch (err) {
      // try next candidate URL
    }
  }
  throw new Error('Could not load SIH 2026 problems dataset from any known path.');
}

// ── Progress Loader (LocalStorage + Server Sync) ─────────────────────────
async function loadUserProgress() {
  let localProgress = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      localProgress = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('localStorage load error:', e);
  }

  let serverProgress = null;
  try {
    const res = await fetch('/api/progress', { cache: 'no-store' });
    if (res.ok) {
      serverProgress = await res.json();
    }
  } catch (e) {
    // API not running (static hosting on Vercel / GitHub Pages) - this is normal
  }

  // Merge logic: prefer local storage if present, fallback to server or default
  let merged = defaultProgress();
  if (localProgress && serverProgress) {
    // Merge both
    merged = {
      ...merged,
      ...serverProgress,
      ...localProgress,
      read: Array.from(new Set([...(serverProgress.read || []), ...(localProgress.read || [])])),
      shortlist: Array.from(new Set([...(serverProgress.shortlist || []), ...(localProgress.shortlist || [])])),
      notes: { ...(serverProgress.notes || {}), ...(localProgress.notes || {}) },
      personal_scores: { ...(serverProgress.personal_scores || {}), ...(localProgress.personal_scores || {}) },
      recently_viewed: Array.from(new Set([...(localProgress.recently_viewed || []), ...(serverProgress.recently_viewed || [])])).slice(0, 50),
      preferences: { ...(merged.preferences), ...(serverProgress.preferences || {}), ...(localProgress.preferences || {}) }
    };
  } else if (localProgress) {
    merged = { ...merged, ...localProgress };
  } else if (serverProgress) {
    merged = { ...merged, ...serverProgress };
  }

  // Ensure arrays/objects exist
  merged.read = merged.read || [];
  merged.shortlist = merged.shortlist || [];
  merged.notes = merged.notes || {};
  merged.personal_scores = merged.personal_scores || {};
  merged.recently_viewed = merged.recently_viewed || [];
  merged.preferences = { ...defaultProgress().preferences, ...(merged.preferences || {}) };

  // Save merged into localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {}

  return merged;
}

// ── Persistent Save (Immediate LocalStorage + Async API) ─────────────────
async function saveProgress(delta = {}) {
  if (!state.progress) return;

  // Apply delta to state.progress
  for (const [k, v] of Object.entries(delta)) {
    if (typeof v === 'object' && !Array.isArray(v) && v !== null && typeof state.progress[k] === 'object' && !Array.isArray(state.progress[k])) {
      state.progress[k] = { ...(state.progress[k] || {}), ...v };
    } else {
      state.progress[k] = v;
    }
  }
  state.progress.last_updated = new Date().toISOString();

  // 1. Immediately persist to localStorage (Synchronous & offline-safe)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
  } catch (err) {
    console.warn('localStorage save failed:', err);
  }

  // 2. Background async sync to local API if running
  try {
    fetch('/api/progress', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(delta),
    }).catch(() => {
      // Swallowed silently when hosted on static Vercel
    });
  } catch (err) {}
}

// ── Bootstrap Application ───────────────────────────────────────────────
async function init() {
  try {
    const [problems, progress] = await Promise.all([
      loadProblemsData(),
      loadUserProgress(),
    ]);

    state.problems = problems;
    state.progress = progress;

    applyPreferences();
    buildFilterOptions();
    renderAll();
    bindEvents();
    updateBadges();
    updateProgressBar();
  } catch (err) {
    console.error('Init error:', err);
    $('problems-list').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠</div>
        <div class="empty-title">Error Loading SIH Dataset</div>
        <div class="empty-desc">${esc(err.message)}</div>
      </div>`;
  }
}

// ── Preferences Management ──────────────────────────────────────────────
function applyPreferences() {
  const p = state.progress.preferences || {};
  if (p.theme === 'dark') {
    document.documentElement.dataset.theme = 'dark';
    if ($('setting-dark-mode')) $('setting-dark-mode').checked = true;
  } else {
    document.documentElement.dataset.theme = 'light';
    if ($('setting-dark-mode')) $('setting-dark-mode').checked = false;
  }

  if (p.density) {
    document.documentElement.dataset.density = p.density;
    if ($('setting-density')) $('setting-density').value = p.density;
  }

  if (p.default_sort) {
    state.sort = p.default_sort;
    if ($('sort-select')) $('sort-select').value = p.default_sort;
    if ($('setting-default-sort')) $('setting-default-sort').value = p.default_sort;
  }

  if (p.show_research_sections === false) {
    if ($('setting-show-research')) $('setting-show-research').checked = false;
  }
}

// ── Populate Filter Dropdowns ───────────────────────────────────────────
function buildFilterOptions() {
  // Themes
  const themes = [...new Set(state.problems.map(p => p.theme).filter(Boolean))].sort();
  const themeSelect = $('theme-filter');
  themes.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    themeSelect.appendChild(opt);
  });

  // Organizations
  const orgs = [...new Set(state.problems.map(p => p.organization).filter(Boolean))].sort();
  const orgSelect = $('org-filter');
  orgs.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o;
    opt.textContent = o.length > 38 ? o.slice(0, 38) + '…' : o;
    opt.title = o;
    orgSelect.appendChild(opt);
  });

  // Research Domains
  const allCats = new Set();
  state.problems.forEach(p => (p.research_categories || []).forEach(c => allCats.add(c)));
  const rescatSelect = $('rescat-filter');
  [...allCats].sort().forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    rescatSelect.appendChild(opt);
  });

  // Software / Hardware Track Badges
  const sw = state.problems.filter(p => (p.category || '').toLowerCase().includes('software')).length;
  const hw = state.problems.filter(p => (p.category || '').toLowerCase().includes('hardware')).length;
  $('badge-software').textContent = sw || '151';
  $('badge-hardware').textContent = hw || '29';
  $('stat-sw').textContent = sw || '151';
  $('stat-hw').textContent = hw || '29';
}

// ── Filter & Sort Logic ─────────────────────────────────────────────────
function getFiltered() {
  const s = state.search.toLowerCase().trim();
  const f = state.filters;
  const read = new Set(state.progress.read || []);
  const sl   = new Set(state.progress.shortlist || []);

  let list = state.problems.filter(p => {
    // Search query
    if (s) {
      const haystack = [
        p.id,
        p.title,
        p.organization,
        p.department,
        p.theme,
        p.category,
        p.summary,
        p.gap_analysis,
        p.solution_direction,
        ...(p.research_categories || []),
        ...(p.technology_opportunities || []),
        ...(p.existing_solutions || []),
      ].join(' ').toLowerCase();
      if (!haystack.includes(s)) return false;
    }

    // Category / Track Filter
    if (f.category) {
      const cat = (p.category || '').toLowerCase();
      if (f.category.toLowerCase() === 'software' && !cat.includes('software')) return false;
      if (f.category.toLowerCase() === 'hardware' && !cat.includes('hardware')) return false;
    }

    // Status Filter
    if (f.read === 'read' && !read.has(p.id)) return false;
    if (f.read === 'unread' && read.has(p.id)) return false;
    if (f.read === 'shortlisted' && !sl.has(p.id)) return false;

    // Theme Filter
    if (f.theme && p.theme !== f.theme) return false;

    // Org Filter
    if (f.org && p.organization !== f.org) return false;

    // Research Domain Filter
    if (f.rescat && !(p.research_categories || []).includes(f.rescat)) return false;

    return true;
  });

  // Sort
  const rv = state.progress.recently_viewed || [];
  list.sort((a, b) => {
    switch (state.sort) {
      case 'alpha':
        return a.title.localeCompare(b.title);
      case 'alpha-desc':
        return b.title.localeCompare(a.title);
      case 'score-desc':
        return (b.scores?.['Overall Opportunity'] || 0) - (a.scores?.['Overall Opportunity'] || 0);
      case 'feasibility-desc':
        return (b.feasibility?.technical || 0) - (a.feasibility?.technical || 0);
      case 'impact-desc':
        return (b.scores?.Impact || 0) - (a.scores?.Impact || 0);
      case 'recent': {
        const ai = rv.indexOf(a.id), bi = rv.indexOf(b.id);
        if (ai === -1 && bi === -1) return a.id.localeCompare(b.id);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      }
      default:
        return a.id.localeCompare(b.id);
    }
  });

  return list;
}

// ── Render Problem List ─────────────────────────────────────────────────
function renderAll() {
  const list = getFiltered();
  state.filteredIds = list.map(p => p.id);
  const container = $('problems-list');
  const read = new Set(state.progress.read || []);
  const sl   = new Set(state.progress.shortlist || []);

  $('result-count').textContent = `${list.length} of ${state.problems.length} problems`;

  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">No matching problem statements</div>
        <div class="empty-desc">Try clearing or adjusting your search terms and filters.</div>
      </div>`;
    return;
  }

  const html = list.map(p => {
    const isRead = read.has(p.id);
    const isSL   = sl.has(p.id);
    const score  = p.scores?.['Overall Opportunity'];
    const scoreHtml = score != null ? `<span class="score-pill">${score}/10</span>` : '';
    const isHW = (p.category || '').toLowerCase().includes('hardware');
    const catClass = isHW ? 'tag-hardware' : 'tag-software';
    const catLabel = isHW ? 'Hardware' : 'Software';
    const resCats = (p.research_categories || []).slice(0, 2).map(c => `<span class="tag tag-cat">${esc(c)}</span>`).join('');
    
    return `
    <div class="problem-card ${isRead ? 'is-read' : ''}" data-id="${p.id}">
      <div class="pc-left">
        <div class="pc-id">${p.id}</div>
        <button class="pc-read-btn ${isRead ? 'read' : ''}" data-id="${p.id}" title="${isRead ? 'Mark as Unread' : 'Mark as Read'}" onclick="toggleRead(event,'${p.id}')"></button>
      </div>
      <div class="pc-body">
        <div class="pc-header">
          <div class="pc-title">${esc(p.title)}</div>
        </div>
        <div class="pc-summary">${esc(p.summary || '')}</div>
        <div class="pc-meta">
          <span class="tag ${catClass}">${catLabel}</span>
          ${p.theme ? `<span class="tag tag-theme">${esc(p.theme)}</span>` : ''}
          <span class="tag tag-org" title="${esc(p.organization)}">${esc(shortOrg(p.organization))}</span>
          ${resCats}
        </div>
      </div>
      <div class="pc-right">
        <button class="star-btn ${isSL ? 'starred' : ''}" data-id="${p.id}" title="${isSL ? 'Remove from Shortlist' : 'Add to Shortlist'}" onclick="toggleShortlist(event,'${p.id}')">${isSL ? '★' : '☆'}</button>
        ${scoreHtml}
      </div>
    </div>`;
  }).join('');

  container.innerHTML = html;

  // Bind card clicks
  container.querySelectorAll('.problem-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('button')) return;
      openDetail(card.dataset.id);
    });
  });
}

// ── Text & Utility Formatters ───────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function shortOrg(org) {
  if (!org) return '';
  if (org.length <= 32) return org;
  const map = {
    'Ministry of Development of North Eastern Region (MDoNER)': 'MDoNER',
    'Ministry of Home Affairs': 'Ministry of Home Affairs',
    'Ministry of Earth Sciences': 'Ministry of Earth Sciences',
    'Ministry of Rural Development': 'Ministry of Rural Development',
    'Ministry of Consumer Affairs, Food & Public Distribution': 'MoCAFPD',
    'All India Council for Technical Education (AICTE)': 'AICTE',
    'Government of Maharashtra': 'Govt. of Maharashtra',
    'National Technical Research Organisation (NTRO)': 'NTRO',
    'Indian Space Research Organisation (ISRO)': 'ISRO',
    'National Remote Sensing Centre (NRSC/ISRO)': 'NRSC/ISRO',
  };
  return map[org] || org.slice(0, 30) + '…';
}

function scoreClass(n) {
  if (n == null) return '';
  if (n >= 8) return 'score-high';
  if (n >= 6) return 'score-mid';
  return 'score-low';
}

function scoreColor(n) {
  if (n == null) return 'var(--text-tertiary)';
  if (n >= 8) return 'var(--green)';
  if (n >= 6) return 'var(--amber)';
  return 'var(--red)';
}

function labelForScore(n) {
  if (n == null) return 'Unscored';
  if (n >= 9) return 'Exceptional Candidate';
  if (n >= 8) return 'High Potential';
  if (n >= 7) return 'Strong Candidate';
  if (n >= 6) return 'Worth Investigating';
  if (n >= 5) return 'Needs More Research';
  return 'Lower Priority';
}

function stripMarkdown(str) {
  if (!str) return '';
  return str
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

// ── Detail View ─────────────────────────────────────────────────────────
function openDetail(id) {
  const p = state.problems.find(x => x.id === id);
  if (!p) return;
  state.detailId = id;

  // Update recently viewed
  const rv = state.progress.recently_viewed || [];
  const idx = rv.indexOf(id);
  if (idx !== -1) rv.splice(idx, 1);
  rv.unshift(id);
  if (rv.length > 50) rv.length = 50;
  state.progress.recently_viewed = rv;
  saveProgress({ recently_viewed: rv });

  const read = new Set(state.progress.read || []);
  const sl   = new Set(state.progress.shortlist || []);
  const isRead = read.has(id);
  const isSL   = sl.has(id);
  const note   = (state.progress.notes || {})[id] || '';
  const pScore = (state.progress.personal_scores || {})[id] || {};

  $('detail-nav-id').textContent = id;
  $('detail-read-btn').textContent = isRead ? '✓ Read' : 'Mark Read';
  $('detail-read-btn').className   = `btn ${isRead ? 'btn-primary' : ''}`;
  $('detail-star-btn').textContent = isSL ? '★ Shortlisted' : '☆ Shortlist';

  const score = p.scores?.['Overall Opportunity'];
  const showResearch = $('setting-show-research') ? $('setting-show-research').checked : true;
  const isHW = (p.category || '').toLowerCase().includes('hardware');

  const html = `
    <div class="detail-header">
      <div class="detail-id">${esc(p.id)} · ${isHW ? 'Hardware' : 'Software'} · ${esc(p.theme || 'General Theme')}</div>
      <div class="detail-title">${esc(p.title)}</div>
      <div class="detail-badges">
        <span class="tag ${isHW ? 'tag-hardware' : 'tag-software'}">${isHW ? 'Hardware' : 'Software'}</span>
        ${p.theme ? `<span class="tag tag-theme">${esc(p.theme)}</span>` : ''}
        ${p.organization ? `<span class="tag tag-org">${esc(p.organization)}</span>` : ''}
        ${(p.research_categories || []).map(c => `<span class="tag tag-cat">${esc(c)}</span>`).join('')}
      </div>
    </div>

    ${score != null ? `
    <div class="verdict-banner">
      <div class="verdict-score">${score}</div>
      <div class="verdict-text">
        <div class="verdict-label">Research Opportunity Assessment Score / 10</div>
        <div class="verdict-summary">${labelForScore(score)} — ${esc(stripMarkdown(p.quick_verdict || ''))}</div>
      </div>
    </div>` : ''}

    <!-- ── Official Information (SIH) ────────────────────────── -->
    <div class="detail-section">
      <div class="detail-section-title">
        Official Problem Information
        <span class="section-badge badge-official">OFFICIAL SIH</span>
      </div>
      <table class="info-table">
        <tr><td>Problem ID</td><td><strong>${esc(p.id)}</strong></td></tr>
        <tr><td>Title</td><td>${esc(p.title)}</td></tr>
        <tr><td>Organization / Ministry</td><td>${esc(p.organization || '—')}</td></tr>
        <tr><td>Department</td><td>${esc(p.department || '—')}</td></tr>
        <tr><td>Category</td><td>${esc(p.category || (isHW ? 'Hardware' : 'Software'))}</td></tr>
        <tr><td>Theme</td><td>${esc(p.theme || '—')}</td></tr>
      </table>
    </div>

    ${showResearch ? `
    <!-- ── Problem Interpretation ────────────────────────────── -->
    <div class="detail-section">
      <div class="detail-section-title">
        Problem Interpretation & Scope
        <span class="section-badge badge-infer">INFERENCE</span>
      </div>
      <div class="prose">${esc(stripMarkdown(p.summary || ''))}</div>
    </div>

    <!-- ── Research Domain & Tech ───────────────────────────── -->
    ${(p.research_categories || []).length || (p.technology_opportunities || []).length ? `
    <div class="detail-section">
      <div class="detail-section-title">Research Domain & Technologies <span class="section-badge badge-research">RESEARCH</span></div>
      ${(p.research_categories || []).length ? `
        <div style="margin-bottom:var(--space-4);">
          <div style="font-size:12px;font-weight:600;color:var(--text-tertiary);margin-bottom:var(--space-2);">Domains & Specializations</div>
          <div class="inline-tags">${(p.research_categories || []).map(c => `<span class="tag tag-cat">${esc(c)}</span>`).join('')}</div>
        </div>` : ''}
      ${(p.technology_opportunities || []).filter(t => !t.startsWith('Standard web') && !t.startsWith('Relational') && !t.startsWith('Containerised')).length ? `
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--text-tertiary);margin-bottom:var(--space-2);">Technology Opportunities</div>
          <div class="inline-tags">${(p.technology_opportunities || []).filter(t => !t.startsWith('Standard web') && !t.startsWith('Relational') && !t.startsWith('Containerised')).map(t => `<span class="tag tag-theme">${esc(t)}</span>`).join('')}</div>
        </div>` : ''}
    </div>` : ''}

    <!-- ── Existing Solutions ────────────────────────────────── -->
    ${(p.existing_solutions || []).length ? `
    <div class="detail-section">
      <div class="detail-section-title">Existing Solutions & Prior Work <span class="section-badge badge-research">RESEARCH</span></div>
      <ul class="prose">
        ${(p.existing_solutions || []).map(s => `<li>${esc(s)}</li>`).join('')}
      </ul>
    </div>` : ''}

    <!-- ── Gap Analysis ──────────────────────────────────────── -->
    ${p.gap_analysis ? `
    <div class="detail-section">
      <div class="detail-section-title">Gap Analysis & Innovation Opportunities <span class="section-badge badge-infer">INFERENCE</span></div>
      <div class="prose">${esc(stripMarkdown(p.gap_analysis))}</div>
    </div>` : ''}

    <!-- ── Proposed Solution Direction ──────────────────────── -->
    ${p.solution_direction ? `
    <div class="detail-section">
      <div class="detail-section-title">Proposed Solution Direction <span class="section-badge badge-idea">PROPOSED IDEA</span></div>
      <div class="prose">${esc(stripMarkdown(p.solution_direction))}</div>
    </div>` : ''}

    <!-- ── Feasibility Breakdown ────────────────────────────── -->
    <div class="detail-section">
      <div class="detail-section-title">Feasibility Assessment <span class="section-badge badge-research">RESEARCH</span></div>
      <div class="feasibility-grid">
        <div class="feas-card">
          <div class="fc-label">Technical Feasibility</div>
          <div class="fc-value" style="color:${scoreColor(p.feasibility?.technical)}">${p.feasibility?.technical != null ? p.feasibility.technical + '/10' : '—'}</div>
        </div>
        <div class="feas-card">
          <div class="fc-label">Hardware Feasibility</div>
          <div class="fc-value">${esc(p.feasibility?.hardware || 'Manageable')}</div>
        </div>
        <div class="feas-card">
          <div class="fc-label">Time Feasibility</div>
          <div class="fc-value">${esc(p.feasibility?.time || 'Moderate')}</div>
        </div>
        <div class="feas-card">
          <div class="fc-label">Data Availability Risk</div>
          <div class="fc-value">${esc(p.feasibility?.data_risk || 'Medium')}</div>
        </div>
      </div>
    </div>

    <!-- ── Risks ─────────────────────────────────────────────── -->
    ${(p.risks || []).length ? `
    <div class="detail-section">
      <div class="detail-section-title">Potential Project Risks <span class="section-badge badge-infer">INFERENCE</span></div>
      <ul class="prose">
        ${(p.risks || []).map(r => `<li>${esc(r)}</li>`).join('')}
      </ul>
    </div>` : ''}

    <!-- ── SIH Opportunity Assessment Scores ─────────────────── -->
    <div class="detail-section">
      <div class="detail-section-title">Opportunity Assessment Heuristics <span class="section-badge badge-research">RESEARCH</span></div>
      <div style="font-size:11px;color:var(--text-tertiary);margin-bottom:var(--space-4);">Research-derived evaluation criteria to help candidate selection.</div>
      <div class="scores-grid">
        ${Object.entries(p.scores || {}).map(([k, v]) => v != null ? `
        <div class="score-card ${scoreClass(v)}">
          <div class="sc-label">${esc(k)}</div>
          <div class="sc-value">${v}</div>
          <div class="sc-bar"><div class="sc-bar-fill" style="width:${v*10}%"></div></div>
        </div>` : '').join('')}
      </div>
    </div>
    ` : ''}

    <!-- ── Personal Notes & Strategy ────────────────────────── -->
    <div class="detail-section">
      <div class="detail-section-title">My Personal Notes & Team Thoughts</div>
      <textarea class="note-editor" id="note-editor" placeholder="Write your ideas, team notes, tech ideas, or questions for this problem…">${esc(note)}</textarea>
      <div class="note-status" id="note-status"></div>
    </div>

    <!-- ── Personal Team Scoring ────────────────────────────── -->
    <div class="detail-section">
      <div class="detail-section-title">My Personal Rating (1–5 Stars)</div>
      <div class="personal-scores-grid" id="ps-grid">
        ${renderPersonalScores(id, pScore)}
      </div>
      ${personalOverall(pScore) != null ? `<div class="ps-overall">My Overall Rating: ${personalOverall(pScore).toFixed(1)} / 5.0</div>` : ''}
    </div>
  `;

  $('detail-content').innerHTML = html;

  // Auto-saving Note editor
  const noteEl = $('note-editor');
  let noteTimer = null;
  noteEl.addEventListener('input', () => {
    $('note-status').textContent = 'Saving…';
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => {
      const notes = state.progress.notes || {};
      notes[id] = noteEl.value;
      state.progress.notes = notes;
      saveProgress({ notes });
      $('note-status').textContent = 'Saved ✓';
      setTimeout(() => { $('note-status').textContent = ''; }, 2000);
    }, 500);
  });

  // Bind star clicks
  bindStars(id);

  // Switch to detail view layout
  $('detail-view').classList.add('active');
  $('main').querySelector('#content').style.display = 'none';
  $('topbar').style.display = 'none';
  $('filterbar').style.display = 'none';
  $('detail-view').querySelector('#detail-content').scrollTop = 0;
}

function bindStars(id) {
  $('detail-content').querySelectorAll('.ps-star').forEach(star => {
    star.addEventListener('click', () => {
      const criterion = star.dataset.criterion;
      const val = parseInt(star.dataset.val);
      const allPS = state.progress.personal_scores || {};
      if (!allPS[id]) allPS[id] = {};
      allPS[id][criterion] = val;
      state.progress.personal_scores = allPS;
      saveProgress({ personal_scores: allPS });

      const grid = $('ps-grid');
      if (grid) {
        grid.innerHTML = renderPersonalScores(id, allPS[id]);
        bindStars(id);
      }
      const overall = personalOverall(allPS[id]);
      const el = $('detail-content').querySelector('.ps-overall');
      if (el && overall != null) el.textContent = `My Overall Rating: ${overall.toFixed(1)} / 5.0`;
      showToast('Personal score saved ✓');
    });
  });
}

function renderPersonalScores(id, pScore) {
  const criteria = [
    { key: 'interest',        label: 'Team Interest' },
    { key: 'innovation',      label: 'Innovation Potential' },
    { key: 'feasibility',     label: 'Feasibility for Team' },
    { key: 'impact',          label: 'Real-World Impact' },
    { key: 'technical_depth', label: 'Technical Depth' },
  ];
  return criteria.map(c => {
    const val = pScore[c.key] || 0;
    const stars = [1, 2, 3, 4, 5].map(n =>
      `<span class="ps-star ${n <= val ? 'filled' : ''}" data-criterion="${c.key}" data-val="${n}" title="${n} Stars">★</span>`
    ).join('');
    return `
      <div class="ps-item">
        <div class="ps-label">${c.label}</div>
        <div class="ps-stars">${stars}</div>
      </div>`;
  }).join('');
}

function personalOverall(pScore) {
  if (!pScore) return null;
  const vals = Object.values(pScore).filter(v => typeof v === 'number' && v > 0);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function closeDetail() {
  $('detail-view').classList.remove('active');
  $('main').querySelector('#content').style.display = '';
  $('topbar').style.display = '';
  $('filterbar').style.display = '';
  state.detailId = null;
}

// ── Read & Shortlist Actions ────────────────────────────────────────────
function toggleRead(event, id) {
  if (event) event.stopPropagation();
  const read = new Set(state.progress.read || []);
  if (read.has(id)) {
    read.delete(id);
    showToast(`Marked ${id} as Unread`);
  } else {
    read.add(id);
    showToast(`Marked ${id} as Read ✓`);
  }
  state.progress.read = [...read];
  saveProgress({ read: state.progress.read });
  updateBadges();
  updateProgressBar();

  // Update card in list if present
  const card = document.querySelector(`.problem-card[data-id="${id}"]`);
  if (card) {
    const btn = card.querySelector('.pc-read-btn');
    if (read.has(id)) {
      card.classList.add('is-read');
      btn.classList.add('read');
      btn.title = 'Mark as Unread';
    } else {
      card.classList.remove('is-read');
      btn.classList.remove('read');
      btn.title = 'Mark as Read';
    }
  }

  // Update detail view buttons if open
  if (state.detailId === id) {
    const isRead = read.has(id);
    $('detail-read-btn').textContent = isRead ? '✓ Read' : 'Mark Read';
    $('detail-read-btn').className = `btn ${isRead ? 'btn-primary' : ''}`;
  }
}

function toggleShortlist(event, id) {
  if (event) event.stopPropagation();
  const sl = new Set(state.progress.shortlist || []);
  if (sl.has(id)) {
    sl.delete(id);
    showToast(`Removed ${id} from Shortlist`);
  } else {
    sl.add(id);
    showToast(`Added ${id} to Shortlist ★`);
  }
  state.progress.shortlist = [...sl];
  saveProgress({ shortlist: state.progress.shortlist });
  updateBadges();

  // Update card in list
  const card = document.querySelector(`.problem-card[data-id="${id}"]`);
  if (card) {
    const btn = card.querySelector('.star-btn');
    if (sl.has(id)) {
      btn.classList.add('starred');
      btn.textContent = '★';
      btn.title = 'Remove from Shortlist';
    } else {
      btn.classList.remove('starred');
      btn.textContent = '☆';
      btn.title = 'Add to Shortlist';
    }
  }

  // Update detail view button
  if (state.detailId === id) {
    const isSL = sl.has(id);
    $('detail-star-btn').textContent = isSL ? '★ Shortlisted' : '☆ Shortlist';
  }
}

// ── Badges & Progress Indicators ────────────────────────────────────────
function updateBadges() {
  const read = (state.progress.read || []).length;
  const sl   = (state.progress.shortlist || []).length;
  const total = state.problems.length;
  $('badge-read').textContent    = read;
  $('badge-unread').textContent  = total - read;
  $('badge-shortlist').textContent = sl;
  $('badge-all').textContent     = total;
  $('stat-read').textContent     = read;
  $('stat-unread').textContent   = total - read;
  $('stat-shortlist').textContent = sl;
  $('stat-total').textContent    = total;
  const pct = total ? Math.round(read / total * 100) : 0;
  $('stat-read-pct').textContent = `${pct}% complete`;
}

function updateProgressBar() {
  const read  = (state.progress.read || []).length;
  const total = state.problems.length;
  const pct   = total ? (read / total * 100).toFixed(1) : 0;
  $('sidebar-progress-text').textContent = `${read} / ${total} read`;
  $('sidebar-progress-bar').style.width  = pct + '%';
  $('dash-progress-pct').textContent     = pct + '%';
  $('dash-progress-bar').style.width     = pct + '%';
}

// ── Dashboard View ──────────────────────────────────────────────────────
function renderDashboard() {
  updateBadges();
  updateProgressBar();
  renderTopCandidates();
  renderBreakdowns();
}

function renderTopCandidates() {
  const sorted = [...state.problems]
    .filter(p => p.scores?.['Overall Opportunity'] != null)
    .sort((a, b) => (b.scores['Overall Opportunity'] || 0) - (a.scores['Overall Opportunity'] || 0))
    .slice(0, 15);

  const sl = new Set(state.progress.shortlist || []);

  const html = sorted.map((p, i) => `
    <div class="top-item" data-id="${p.id}">
      <div class="top-rank">#${i + 1}</div>
      <div class="top-info">
        <div class="top-title">${esc(p.title)}</div>
        <div class="top-org">${esc(shortOrg(p.organization))} · ${esc(p.theme || '')}</div>
      </div>
      ${sl.has(p.id) ? '<span style="color:var(--amber);font-size:14px">★</span>' : ''}
      <div class="top-score">${p.scores['Overall Opportunity']}/10</div>
    </div>`).join('');

  $('dash-top-list').innerHTML = html || '<div class="empty-state"><div class="empty-desc">No scored problems.</div></div>';
  $('dash-top-list').querySelectorAll('.top-item').forEach(el => {
    el.addEventListener('click', () => openDetail(el.dataset.id));
  });

  // Top candidates full view
  const fullHtml = sorted.map((p, i) => `
    <div class="top-item" data-id="${p.id}">
      <div class="top-rank">#${i + 1}</div>
      <div class="top-info">
        <div class="top-title">${esc(p.title)}</div>
        <div class="top-org">${esc(p.organization)} · ${esc(p.theme || '')}</div>
      </div>
      <span class="tag tag-cat" style="flex-shrink:0">${labelForScore(p.scores['Overall Opportunity'])}</span>
      ${sl.has(p.id) ? '<span style="color:var(--amber);font-size:14px">★</span>' : `<button class="btn btn-ghost" onclick="toggleShortlist(event,'${p.id}')">☆</button>`}
      <div class="top-score">${p.scores['Overall Opportunity']}/10</div>
    </div>`).join('');

  $('top-list-full').innerHTML = fullHtml || '<div class="empty-state"><div class="empty-desc">No scored problems.</div></div>';
  $('top-list-full').querySelectorAll('.top-item').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('button')) return;
      openDetail(el.dataset.id);
    });
  });
}

function renderBreakdowns() {
  const read = new Set(state.progress.read || []);

  // Theme breakdown
  const themeCount = {};
  state.problems.forEach(p => { if (p.theme) themeCount[p.theme] = (themeCount[p.theme] || 0) + 1; });
  const maxTheme = Math.max(...Object.values(themeCount), 1);
  $('theme-breakdown').innerHTML = Object.entries(themeCount).sort((a,b)=>b[1]-a[1]).map(([t, c]) => `
    <div class="bar-row">
      <div class="bar-label" title="${esc(t)}">${esc(t)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${c/maxTheme*100}%"></div></div>
      <div class="bar-count">${c}</div>
    </div>`).join('');

  // Domain breakdown
  const domainCount = {};
  state.problems.forEach(p => (p.research_categories || []).forEach(c => { domainCount[c] = (domainCount[c] || 0) + 1; }));
  const maxDomain = Math.max(...Object.values(domainCount), 1);
  $('domain-breakdown').innerHTML = Object.entries(domainCount).sort((a,b)=>b[1]-a[1]).slice(0, 12).map(([d, c]) => `
    <div class="bar-row">
      <div class="bar-label">${esc(d)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${c/maxDomain*100}%;background:var(--green)"></div></div>
      <div class="bar-count">${c}</div>
    </div>`).join('');

  // Org breakdown (top 12)
  const orgCount = {};
  state.problems.forEach(p => { if (p.organization) orgCount[p.organization] = (orgCount[p.organization] || 0) + 1; });
  const maxOrg = Math.max(...Object.values(orgCount), 1);
  $('org-breakdown').innerHTML = Object.entries(orgCount).sort((a,b)=>b[1]-a[1]).slice(0, 12).map(([o, c]) => `
    <div class="bar-row">
      <div class="bar-label" title="${esc(o)}">${esc(shortOrg(o))}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${c/maxOrg*100}%;background:var(--purple)"></div></div>
      <div class="bar-count">${c}</div>
    </div>`).join('');

  // Theme reading progress
  const themeRead = {};
  state.problems.forEach(p => {
    if (!p.theme) return;
    if (!themeRead[p.theme]) themeRead[p.theme] = { total: 0, read: 0 };
    themeRead[p.theme].total++;
    if (read.has(p.id)) themeRead[p.theme].read++;
  });
  $('theme-progress-breakdown').innerHTML = Object.entries(themeRead).sort((a,b)=>b[1].total-a[1].total).map(([t, v]) => {
    const pct = Math.round(v.read / v.total * 100);
    return `
    <div class="bar-row">
      <div class="bar-label" title="${esc(t)}">${esc(t)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:var(--amber)"></div></div>
      <div class="bar-count">${pct}%</div>
    </div>`;
  }).join('');
}

// ── Shortlist View ──────────────────────────────────────────────────────
function renderShortlist() {
  const sl = new Set(state.progress.shortlist || []);
  const problems = state.problems.filter(p => sl.has(p.id));

  if (!problems.length) {
    $('shortlist-list').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">☆</div>
        <div class="empty-title">Your Shortlist is Empty</div>
        <div class="empty-desc">Click the star (☆) button on any problem to bookmark it here for evaluation.</div>
      </div>`;
    return;
  }

  const notes = state.progress.notes || {};
  const pScores = state.progress.personal_scores || {};

  const html = problems.map(p => {
    const score = p.scores?.['Overall Opportunity'];
    const ps    = pScores[p.id];
    const po    = personalOverall(ps);
    const isHW  = (p.category || '').toLowerCase().includes('hardware');

    return `
    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius);padding:var(--space-4) var(--space-5);margin-bottom:6px;cursor:pointer;" data-id="${p.id}">
      <div style="display:flex;align-items:flex-start;gap:var(--space-4);">
        <div style="flex:1;min-width:0;">
          <div style="font-size:11px;color:var(--text-tertiary);margin-bottom:2px;font-family:var(--font-mono)">${esc(p.id)}</div>
          <div style="font-size:14px;font-weight:600;margin-bottom:4px;">${esc(p.title)}</div>
          <div class="pc-meta">
            <span class="tag ${isHW ? 'tag-hardware' : 'tag-software'}">${isHW ? 'Hardware' : 'Software'}</span>
            ${p.theme ? `<span class="tag tag-theme">${esc(p.theme)}</span>` : ''}
            <span class="tag tag-org" title="${esc(p.organization)}">${esc(shortOrg(p.organization))}</span>
          </div>
          ${notes[p.id] ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:6px;font-style:italic;">"${esc(notes[p.id].slice(0, 140))}${notes[p.id].length > 140 ? '…' : ''}"</div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;">
          ${score != null ? `<span class="score-pill">Research: ${score}/10</span>` : ''}
          ${po != null ? `<span class="score-pill" style="background:var(--green-light);color:var(--green);border-color:var(--green-border)">My: ${po.toFixed(1)}/5</span>` : ''}
          <button class="btn" style="color:var(--red);border-color:var(--red-border);font-size:11px" onclick="toggleShortlist(event,'${p.id}')">Remove</button>
        </div>
      </div>
    </div>`;
  }).join('');

  $('shortlist-list').innerHTML = html;
  $('shortlist-list').querySelectorAll('[data-id]').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('button')) return;
      openDetail(el.dataset.id);
    });
  });
}

// ── Compare View ─────────────────────────────────────────────────────────
function renderCompare() {
  const sl = new Set(state.progress.shortlist || []);
  const problems = state.problems.filter(p => sl.has(p.id));
  const container = $('compare-content');

  if (problems.length < 2) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⇌</div>
        <div class="empty-title">Add at least 2 problems to your shortlist</div>
        <div class="empty-desc">Bookmark problems using the star icon, then come back here to compare them side-by-side.</div>
      </div>`;
    return;
  }

  const rows = [
    ['Title',                 p => p.title],
    ['ID',                    p => p.id],
    ['Organization',          p => shortOrg(p.organization)],
    ['Track',                 p => (p.category || 'Software')],
    ['Theme',                 p => p.theme || '—'],
    ['Domain',                p => (p.research_categories || []).join(', ') || '—'],
    ['Summary',               p => stripMarkdown(p.summary || '').slice(0, 160)],
    ['Overall Opportunity',   p => p.scores?.['Overall Opportunity'] != null ? p.scores['Overall Opportunity'] + '/10' : '—'],
    ['Innovation',            p => p.scores?.Innovation != null ? p.scores.Innovation + '/10' : '—'],
    ['Impact',                p => p.scores?.Impact != null ? p.scores.Impact + '/10' : '—'],
    ['Technical Feasibility', p => p.scores?.['Technical Feasibility'] != null ? p.scores['Technical Feasibility'] + '/10' : '—'],
    ['Differentiation',       p => p.scores?.Differentiation != null ? p.scores.Differentiation + '/10' : '—'],
    ['Technical Depth',       p => p.scores?.['Technical Depth'] != null ? p.scores['Technical Depth'] + '/10' : '—'],
    ['Time Feasibility',      p => p.feasibility?.time || '—'],
    ['Data Risk',             p => p.feasibility?.data_risk || '—'],
    ['My Team Rating',        p => { const ps = (state.progress.personal_scores || {})[p.id]; const po = personalOverall(ps); return po != null ? po.toFixed(1) + ' / 5.0' : '—'; }],
    ['My Notes',              p => { const n = (state.progress.notes || {})[p.id]; return n ? n.slice(0, 120) : '—'; }],
    ['Existing Solutions',    p => (p.existing_solutions || []).slice(0, 2).join('; ') || '—'],
  ];

  const thead = `<tr><th style="min-width:140px">Criteria</th>${problems.map(p => `<th><div style="font-size:11px;font-family:var(--font-mono);color:var(--text-tertiary)">${p.id}</div><div>${esc(p.title.slice(0, 60))}${p.title.length > 60 ? '…' : ''}</div></th>`).join('')}</tr>`;
  const tbody = rows.map(([label, fn]) =>
    `<tr><td>${label}</td>${problems.map(p => `<td>${esc(fn(p))}</td>`).join('')}</tr>`
  ).join('');

  container.innerHTML = `<div class="compare-table-wrap"><table class="compare-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table></div>`;
}

// ── Export & Import Functions ───────────────────────────────────────────
function exportProgressJSON() {
  const blob = new Blob([JSON.stringify(state.progress, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `sih2026_progress_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Progress backup downloaded ✓');
}

function importProgressJSON(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid JSON format');
      }
      state.progress = {
        ...defaultProgress(),
        ...data,
        read: Array.isArray(data.read) ? data.read : [],
        shortlist: Array.isArray(data.shortlist) ? data.shortlist : [],
        notes: data.notes || {},
        personal_scores: data.personal_scores || {},
        recently_viewed: Array.isArray(data.recently_viewed) ? data.recently_viewed : [],
        preferences: { ...defaultProgress().preferences, ...(data.preferences || {}) },
      };

      saveProgress(state.progress);
      applyPreferences();
      updateBadges();
      updateProgressBar();
      if (state.view === 'all') renderAll();
      else if (state.view === 'shortlist') renderShortlist();
      else if (state.view === 'dashboard') renderDashboard();
      
      showToast('Progress restored successfully! ✓');
    } catch (err) {
      alert('Failed to import file: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function exportShortlistMarkdown() {
  const sl = new Set(state.progress.shortlist || []);
  const problems = state.problems.filter(p => sl.has(p.id));

  if (!problems.length) {
    alert('Your shortlist is currently empty. Star some problems first!');
    return;
  }

  const notes = state.progress.notes || {};
  const pScores = state.progress.personal_scores || {};

  let md = `# SIH 2026 Shortlisted Problem Statements\n\n`;
  md += `Export Date: ${new Date().toLocaleDateString()}\n`;
  md += `Total Shortlisted: ${problems.length}\n\n`;

  md += `| ID | Title | Track | Theme | Organization | Research Score | My Rating | Notes |\n`;
  md += `|---|---|---|---|---|---|---|---|\n`;

  problems.forEach(p => {
    const score = p.scores?.['Overall Opportunity'] != null ? `${p.scores['Overall Opportunity']}/10` : '—';
    const po = personalOverall(pScores[p.id]);
    const myRating = po != null ? `${po.toFixed(1)}/5` : '—';
    const note = (notes[p.id] || '').replace(/[\r\n]+/g, ' ');
    md += `| ${p.id} | ${p.title} | ${p.category || 'Software'} | ${p.theme || '—'} | ${p.organization} | ${score} | ${myRating} | ${note} |\n`;
  });

  md += `\n## Problem Details\n\n`;
  problems.forEach(p => {
    md += `### [${p.id}] ${p.title}\n`;
    md += `- **Organization:** ${p.organization}\n`;
    md += `- **Track:** ${p.category || 'Software'}\n`;
    md += `- **Theme:** ${p.theme || '—'}\n`;
    if (p.summary) md += `- **Summary:** ${stripMarkdown(p.summary)}\n`;
    if (notes[p.id]) md += `- **My Team Notes:** ${notes[p.id]}\n`;
    md += `\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `sih2026_shortlist_${new Date().toISOString().slice(0,10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Shortlist Markdown exported ✓');
}

function exportShortlistCSV() {
  const sl = new Set(state.progress.shortlist || []);
  const problems = state.problems.filter(p => sl.has(p.id));

  if (!problems.length) {
    alert('Your shortlist is currently empty. Star some problems first!');
    return;
  }

  const notes = state.progress.notes || {};
  const pScores = state.progress.personal_scores || {};

  const headers = ['ID', 'Title', 'Track', 'Theme', 'Organization', 'Research Score', 'My Rating', 'My Notes'];
  const rows = problems.map(p => {
    const score = p.scores?.['Overall Opportunity'] != null ? `${p.scores['Overall Opportunity']}/10` : '';
    const po = personalOverall(pScores[p.id]);
    const myRating = po != null ? po.toFixed(1) : '';
    const note = (notes[p.id] || '').replace(/"/g, '""');
    return [
      `"${p.id}"`,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.category || 'Software'}"`,
      `"${(p.theme || '').replace(/"/g, '""')}"`,
      `"${p.organization.replace(/"/g, '""')}"`,
      `"${score}"`,
      `"${myRating}"`,
      `"${note}"`
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `sih2026_shortlist_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Shortlist CSV exported ✓');
}

// ── Views & Navigation ──────────────────────────────────────────────────
function showView(view, extra) {
  state.view = view;

  // Hide all view containers
  $$('.view').forEach(v => v.classList.remove('active'));
  // Deactivate all sidebar items
  $$('.nav-item').forEach(n => n.classList.remove('active'));

  // Header & filter bar visibility
  const showBars = (view === 'all');
  $('topbar').style.display  = showBars ? '' : 'none';
  $('filterbar').style.display = showBars ? '' : 'none';

  // Highlight active sidebar item
  const navEl = $(`nav-${view}`);
  if (navEl) navEl.classList.add('active');

  switch (view) {
    case 'all':
      if (extra === 'unread')    { state.filters.read = 'unread'; $('fc-unread').click(); }
      else if (extra === 'read') { state.filters.read = 'read';   $('fc-read').click(); }
      else if (extra === 'software') { state.filters.category = 'Software'; syncChips(); }
      else if (extra === 'hardware') { state.filters.category = 'Hardware'; syncChips(); }
      $('list-view').classList.add('active');
      renderAll();
      break;
    case 'dashboard':
      $('dashboard-view').classList.add('active');
      renderDashboard();
      break;
    case 'shortlist':
      $('shortlist-view').classList.add('active');
      renderShortlist();
      break;
    case 'top':
      $('top-view').classList.add('active');
      renderTopCandidates();
      break;
    case 'compare':
      $('compare-view').classList.add('active');
      renderCompare();
      break;
    case 'settings':
      $('settings-view').classList.add('active');
      break;
  }
}

function syncChips() {
  $$('.filter-chip[data-filter="category"]').forEach(c => c.classList.remove('active'));
  const val = state.filters.category;
  if (!val) $('fc-all').classList.add('active');
  else if (val === 'Software') $('fc-sw').classList.add('active');
  else if (val === 'Hardware') $('fc-hw').classList.add('active');
}

// ── Toast Notifications ─────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

// ── Event Bindings ──────────────────────────────────────────────────────
function bindEvents() {
  // Sidebar navigation
  $$('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const view   = item.dataset.view;
      const filter = item.dataset.filter;
      if (view) {
        if (view === 'all' && !filter) {
          state.filters = { category: '', read: '', theme: '', org: '', rescat: '' };
          $('theme-filter').value = '';
          $('org-filter').value = '';
          $('rescat-filter').value = '';
          syncChips();
          $$('.filter-chip[data-filter="read"]').forEach(c => c.classList.remove('active'));
          $('fc-rs-all').classList.add('active');
        }
        showView(view, filter);
      }
    });
  });

  // Track filter chips
  $$('.filter-chip[data-filter="category"]').forEach(chip => {
    chip.addEventListener('click', () => {
      state.filters.category = chip.dataset.value;
      $$('.filter-chip[data-filter="category"]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderAll();
    });
  });

  // Read status filter chips
  $$('.filter-chip[data-filter="read"]').forEach(chip => {
    chip.addEventListener('click', () => {
      state.filters.read = chip.dataset.value;
      $$('.filter-chip[data-filter="read"]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderAll();
    });
  });

  // Filter dropdowns
  $('theme-filter').addEventListener('change', e => { state.filters.theme = e.target.value; renderAll(); });
  $('org-filter').addEventListener('change', e => { state.filters.org = e.target.value; renderAll(); });
  $('rescat-filter').addEventListener('change', e => { state.filters.rescat = e.target.value; renderAll(); });

  // Sort dropdown
  $('sort-select').addEventListener('change', e => { state.sort = e.target.value; renderAll(); });

  // Search input with debounce
  let searchTimer = null;
  $('search-input').addEventListener('input', e => {
    clearTimeout(searchTimer);
    state.search = e.target.value;
    searchTimer = setTimeout(renderAll, 150);
  });

  // Detail View Buttons
  $('btn-back').addEventListener('click', closeDetail);
  $('detail-read-btn').addEventListener('click', () => {
    if (state.detailId) toggleRead(new Event('click'), state.detailId);
  });
  $('detail-star-btn').addEventListener('click', () => {
    if (state.detailId) toggleShortlist(new Event('click'), state.detailId);
  });

  // Settings Events
  $('setting-dark-mode').addEventListener('change', e => {
    const theme = e.target.checked ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    state.progress.preferences = state.progress.preferences || {};
    state.progress.preferences.theme = theme;
    saveProgress({ preferences: state.progress.preferences });
  });

  $('setting-density').addEventListener('change', e => {
    document.documentElement.dataset.density = e.target.value;
    state.progress.preferences = state.progress.preferences || {};
    state.progress.preferences.density = e.target.value;
    saveProgress({ preferences: state.progress.preferences });
  });

  $('setting-default-sort').addEventListener('change', e => {
    state.progress.preferences = state.progress.preferences || {};
    state.progress.preferences.default_sort = e.target.value;
    saveProgress({ preferences: state.progress.preferences });
  });

  $('setting-show-research').addEventListener('change', e => {
    state.progress.preferences = state.progress.preferences || {};
    state.progress.preferences.show_research_sections = e.target.checked;
    saveProgress({ preferences: state.progress.preferences });
  });

  // Export / Import Progress Backup
  $('btn-export').addEventListener('click', exportProgressJSON);
  $('btn-import-trigger').addEventListener('click', () => $('import-file-input').click());
  $('import-file-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
      importProgressJSON(file);
      e.target.value = '';
    }
  });

  // Shortlist Exports
  $('btn-compare-shortlist').addEventListener('click', () => showView('compare'));
  $('btn-export-shortlist-md').addEventListener('click', exportShortlistMarkdown);
  $('btn-export-shortlist-csv').addEventListener('click', exportShortlistCSV);
  $('btn-export-md-settings').addEventListener('click', exportShortlistMarkdown);
  $('btn-compare-back').addEventListener('click', () => showView('shortlist'));

  // Reset Progress
  $('btn-reset').addEventListener('click', () => {
    if (!confirm('Are you sure you want to reset all your progress? This will clear all read marks, shortlist bookmarks, notes, and personal ratings. (The master SIH research dataset remains safe.)')) return;
    state.progress = defaultProgress();
    saveProgress(state.progress);
    applyPreferences();
    updateBadges();
    updateProgressBar();
    if (state.view === 'all') renderAll();
    else if (state.view === 'shortlist') renderShortlist();
    else if (state.view === 'dashboard') renderDashboard();
    showToast('Progress reset to default');
  });

  // Global Keyboard Shortcuts
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'Escape' && state.detailId) closeDetail();
    if (e.key === '/' && !state.detailId) {
      e.preventDefault();
      $('search-input').focus();
    }
  });
}

// ── Global Window Functions for Inline Onclick Handlers ─────────────────
window.toggleRead = toggleRead;
window.toggleShortlist = toggleShortlist;

// ── Initialize App ──────────────────────────────────────────────────────
init();

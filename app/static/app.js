/**
 * SIH 2026 Problem Explorer Pro — Application Logic
 * Pure vanilla ES2020 — Zero dependencies.
 * Full mobile-first responsive support + offline-first & Vercel-ready persistence.
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
  activeDetailTab: 'official', // official | pitch | tech | notes
  filteredIds: [],       // problem IDs in current list view
  saveTimer: null,
};

// ── DOM Helpers ─────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ── Shared SVG Icons (Refined Archival theme) ─────────────────────────
const ICONS = {
  software: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;vertical-align:-1px"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="12" y1="2" x2="12" y2="22"/></svg>`,
  hardware: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;vertical-align:-1px"><rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><line x1="9" y1="1" x2="9" y2="5"/><line x1="15" y1="1" x2="15" y2="5"/><line x1="9" y1="19" x2="9" y2="23"/><line x1="15" y1="19" x2="15" y2="23"/><line x1="20" y1="9" x2="24" y2="9"/><line x1="20" y1="14" x2="24" y2="14"/><line x1="0" y1="9" x2="4" y2="9"/><line x1="0" y1="14" x2="4" y2="14"/></svg>`,
  pitch: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;vertical-align:-2px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  starFilled: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  starOutline: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  check: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  clock: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:3px;vertical-align:-1px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  tag: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:3px;vertical-align:-1px"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  building: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:3px;vertical-align:-1px"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="22.01"/><line x1="15" y1="22" x2="15" y2="22.01"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><line x1="9" y1="18" x2="9" y2="18.01"/><line x1="15" y1="18" x2="15" y2="18.01"/></svg>`,
  target: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:3px;vertical-align:-1px"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  zap: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:3px;vertical-align:-1px"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  compare: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="8" height="18" rx="1"/><rect x="14" y="3" width="8" height="18" rx="1"/><path d="M10 8h4M10 12h4M10 16h4"/></svg>`
};

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
    // Static hosting fallback
  }

  // Merge logic: combine local + server safely to never lose progress
  let merged = defaultProgress();
  if (localProgress && serverProgress) {
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

  merged.read = merged.read || [];
  merged.shortlist = merged.shortlist || [];
  merged.notes = merged.notes || {};
  merged.personal_scores = merged.personal_scores || {};
  merged.recently_viewed = merged.recently_viewed || [];
  merged.preferences = { ...defaultProgress().preferences, ...(merged.preferences || {}) };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {}

  return merged;
}

// ── Persistent Save (Immediate LocalStorage + Async API) ─────────────────
async function saveProgress(delta = {}) {
  if (!state.progress) return;

  for (const [k, v] of Object.entries(delta)) {
    if (typeof v === 'object' && !Array.isArray(v) && v !== null && typeof state.progress[k] === 'object' && !Array.isArray(state.progress[k])) {
      state.progress[k] = { ...(state.progress[k] || {}), ...v };
    } else {
      state.progress[k] = v;
    }
  }
  state.progress.last_updated = new Date().toISOString();

  // 1. Immediately persist to localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
  } catch (err) {
    console.warn('localStorage save failed:', err);
  }

  // 2. Background sync to local API if running
  try {
    fetch('/api/progress', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(delta),
    }).catch(() => {});
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
    const listEl = $('problems-list');
    if (listEl) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <div class="empty-title">Error Loading SIH Dataset</div>
          <div class="empty-desc">${esc(err.message)}</div>
        </div>`;
    }
  }
}

// ── Preferences Management ──────────────────────────────────────────────
function applyPreferences() {
  const p = state.progress.preferences || {};
  const isDark = p.theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  
  if ($('setting-dark-mode')) $('setting-dark-mode').checked = isDark;
  if ($('drawer-dark-mode')) $('drawer-dark-mode').checked = isDark;
  const SUN_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
  const MOON_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  if ($('theme-icon')) $('theme-icon').innerHTML = isDark ? SUN_SVG : MOON_SVG;

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
  const drawerThemeSelect = $('drawer-theme-filter');
  
  themes.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    if (themeSelect) themeSelect.appendChild(opt);
    if (drawerThemeSelect) drawerThemeSelect.appendChild(opt.cloneNode(true));
  });

  // Organizations
  const orgs = [...new Set(state.problems.map(p => p.organization).filter(Boolean))].sort();
  const orgSelect = $('org-filter');
  const drawerOrgSelect = $('drawer-org-filter');
  
  orgs.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o;
    opt.textContent = o.length > 38 ? o.slice(0, 38) + '…' : o;
    opt.title = o;
    if (orgSelect) orgSelect.appendChild(opt);
    if (drawerOrgSelect) drawerOrgSelect.appendChild(opt.cloneNode(true));
  });

  // Research Domains
  const rescatSet = new Set();
  state.problems.forEach(p => {
    (p.technology_stack || p.research_categories || []).forEach(c => {
      if (c && c.length < 32 && !c.includes('Standard web') && !c.includes('Relational database')) {
        rescatSet.add(c);
      }
    });
  });
  const rescats = [...rescatSet].sort();
  const rescatSelect = $('rescat-filter');
  if (rescatSelect) {
    rescats.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r;
      opt.textContent = r;
      rescatSelect.appendChild(opt);
    });
  }
}

// ── Filter & Search Logic ───────────────────────────────────────────────
function getFilteredProblems() {
  const q = state.search.trim().toLowerCase();
  const cat = state.filters.category;
  const readFilter = state.filters.read;
  const theme = state.filters.theme;
  const org = state.filters.org;
  const rescat = state.filters.rescat;

  const readSet = new Set(state.progress.read || []);
  const slSet   = new Set(state.progress.shortlist || []);

  return state.problems.filter(p => {
    // Track filter
    if (cat && p.category !== cat) return false;

    // Read/Unread/Shortlist filter
    if (readFilter === 'read' && !readSet.has(p.id)) return false;
    if (readFilter === 'unread' && readSet.has(p.id)) return false;
    if (readFilter === 'shortlisted' && !slSet.has(p.id)) return false;

    // Dropdown filters
    if (theme && p.theme !== theme) return false;
    if (org && p.organization !== org) return false;
    if (rescat) {
      const allDomains = [...(p.technology_stack || []), ...(p.research_categories || [])];
      if (!allDomains.some(d => d.toLowerCase().includes(rescat.toLowerCase()))) return false;
    }

    // Text search query
    if (q) {
      const haystack = [
        p.id,
        p.title,
        p.organization,
        p.department,
        p.theme,
        p.category,
        p.summary,
        p.official_description,
        p.proposed_pitch?.idea,
        p.proposed_pitch?.differentiation,
        p.market_research?.thesis,
        p.market_research?.primary_buyer,
        ...(p.technology_stack || []),
        ...(p.sources || [])
      ].filter(Boolean).join(' ').toLowerCase();

      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}

// ── Sorting Logic ───────────────────────────────────────────────────────
function sortProblems(problems) {
  const list = [...problems];
  switch (state.sort) {
    case 'score-desc':
      return list.sort((a, b) => (b.scores?.['Overall Opportunity'] || 0) - (a.scores?.['Overall Opportunity'] || 0));
    case 'impact-desc':
      return list.sort((a, b) => (b.scores?.Impact || 0) - (a.scores?.Impact || 0));
    case 'feasibility-desc':
      return list.sort((a, b) => (b.scores?.['Technical Feasibility'] || 0) - (a.scores?.['Technical Feasibility'] || 0));
    case 'alpha':
      return list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    case 'alpha-desc':
      return list.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    case 'recent': {
      const rv = state.progress.recently_viewed || [];
      return list.sort((a, b) => {
        const ia = rv.indexOf(a.id);
        const ib = rv.indexOf(b.id);
        if (ia === -1 && ib === -1) return 0;
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
    }
    case 'id':
    default:
      return list.sort((a, b) => (a.id || '').localeCompare(b.id || ''));
  }
}

// ── Clean Markdown & Asterisk Renderer ──────────────────────────────────
function renderMarkdown(str) {
  if (!str) return '';
  let s = String(str);
  
  // Clean raw AI marker labels like **INFERENCE:**, **PROPOSED IDEA:**, etc.
  s = s.replace(/^[*-•\s]*\*\*(?:INFERENCE|PROPOSED IDEA|VERIFIED EXTERNAL|Market thesis|Primary buyer\/stakeholder|Primary buyer|Value KPI|Market risk|Hardware|Software|Data principle):\*\*\s*/gim, '');
  
  // Escape HTML characters
  s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // Bold formatting: **text** -> <strong>text</strong>
  s = s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic formatting: *text* or _text_ -> <em>text</em>
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // Inline code: `code` -> <code>code</code>
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Convert markdown links: [text](url) -> <a href="url" target="_blank">text</a>
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="prose-link">$1 ↗</a>');

  // Process bullet points into list items
  const lines = s.split('\n');
  let inList = false;
  let result = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      result.push(`<li>${trimmed.replace(/^[-*•]\s+/, '')}</li>`);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      if (trimmed.length > 0) {
        result.push(`<p>${line}</p>`);
      }
    }
  }
  if (inList) result.push('</ul>');

  return result.join('\n');
}

function cleanPlain(str) {
  if (!str) return '';
  return String(str)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*•]\s*/gm, '')
    .trim();
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
    'Ministry of Steel': 'Ministry of Steel',
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
  if (n == null) return 'Review Needed';
  if (n >= 9) return 'Exceptional Opportunity';
  if (n >= 8) return 'High Viability Candidate';
  if (n >= 7) return 'Strong Candidate';
  if (n >= 6) return 'Moderate Potential';
  return 'Challenging / Niche';
}

// ── Render Problem List ─────────────────────────────────────────────────
function renderAll() {
  const problems = sortProblems(getFilteredProblems());
  state.filteredIds = problems.map(p => p.id);

  const countEl = $('result-count');
  if (countEl) countEl.textContent = `${problems.length} problem${problems.length === 1 ? '' : 's'}`;

  // Update active filter badge counter on mobile
  const activeFilterCount = [
    state.filters.category,
    state.filters.read,
    state.filters.theme,
    state.filters.org,
    state.filters.rescat
  ].filter(Boolean).length;
  
  const mFilterBadge = $('mobile-filter-count');
  if (mFilterBadge) {
    if (activeFilterCount > 0) {
      mFilterBadge.classList.add('active');
    } else {
      mFilterBadge.classList.remove('active');
    }
  }

  const container = $('problems-list');
  if (!container) return;

  if (problems.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">No matching problem statements</div>
        <div class="empty-desc">Try clearing your search query or filters to browse all 226 statements.</div>
        <button class="btn btn-primary" onclick="resetFilters()" style="margin-top:10px">Reset All Filters</button>
      </div>`;
    return;
  }

  const readSet = new Set(state.progress.read || []);
  const slSet   = new Set(state.progress.shortlist || []);

  const html = problems.map(p => {
    const isRead = readSet.has(p.id);
    const isSL   = slSet.has(p.id);
    const isHW   = p.category === 'Hardware';
    const score  = p.scores?.['Overall Opportunity'];
    const pitchText = p.proposed_pitch?.idea ? cleanPlain(p.proposed_pitch.idea) : (p.summary ? cleanPlain(p.summary) : '');

    const scoreBadge = score != null
      ? `<div class="score-badge ${scoreClass(score)}" title="Research Opportunity Score">${score}/10</div>`
      : '';

    return `
    <div class="problem-card ${isRead ? 'is-read' : ''}" data-id="${p.id}">
      <div class="pc-left">
        <button class="pc-read-btn ${isRead ? 'read' : ''}" title="${isRead ? 'Mark as Unread' : 'Mark as Read'}" onclick="toggleRead(event,'${p.id}')">
          ${ICONS.check}
        </button>
      </div>
      <div class="pc-mid">
        <div class="pc-header-row">
          <span class="pc-id">${esc(p.id)}</span>
          <span class="tag ${isHW ? 'tag-hardware' : 'tag-software'}">${isHW ? ICONS.hardware + 'Hardware' : ICONS.software + 'Software'}</span>
          ${p.theme ? `<span class="tag tag-theme">${esc(p.theme)}</span>` : ''}
          ${p.organization ? `<span class="tag tag-org" title="${esc(p.organization)}">${esc(shortOrg(p.organization))}</span>` : ''}
          ${p.deadline ? `<span class="tag tag-deadline">${ICONS.clock}${esc(p.deadline)}</span>` : ''}
        </div>
        <h3 class="pc-title">${esc(p.title)}</h3>
        ${pitchText ? `
        <div class="pc-pitch-preview">
          <span class="pc-pitch-label">${ICONS.pitch}Unique Pitch:</span>${esc(pitchText.slice(0, 160))}${pitchText.length > 160 ? '…' : ''}
        </div>` : ''}
      </div>
      <div class="pc-right">
        <button class="star-btn ${isSL ? 'starred' : ''}" data-id="${p.id}" title="${isSL ? 'Remove from Shortlist' : 'Add to Shortlist'}" onclick="toggleShortlist(event,'${p.id}')">
          ${isSL ? ICONS.starFilled : ICONS.starOutline}
        </button>
        ${scoreBadge}
      </div>
    </div>`;
  }).join('');

  container.innerHTML = html;

  container.querySelectorAll('.problem-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('button')) return;
      openDetail(card.dataset.id);
    });
  });
}

// ── Detail View ─────────────────────────────────────────────────────────
function openDetail(id) {
  const p = state.problems.find(x => x.id === id);
  if (!p) return;
  state.detailId = id;

  // Track recently viewed
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
  const isHW  = p.category === 'Hardware';

  // ── Build Tabs HTML ───────────────────────────────────────────────────
  const html = `
    <!-- ── Hero Banner ─────────────────────────────────────────── -->
    <div class="detail-hero">
      <div class="detail-hero-meta" style="margin-bottom:10px;">
        <span class="tag ${isHW ? 'tag-hardware' : 'tag-software'}">${isHW ? ICONS.hardware + 'Hardware Track' : ICONS.software + 'Software Track'}</span>
        ${p.theme ? `<span class="tag tag-theme">${ICONS.tag}${esc(p.theme)}</span>` : ''}
        ${p.organization ? `<span class="tag tag-org" title="${esc(p.organization)}">${ICONS.building}${esc(p.organization)}</span>` : ''}
        ${p.department && p.department !== p.organization ? `<span class="tag tag-cat">${ICONS.building}${esc(p.department)}</span>` : ''}
        ${p.deadline ? `<span class="tag tag-deadline">${ICONS.clock}Deadline: ${esc(p.deadline)}</span>` : ''}
        ${p.ideas_count ? `<span class="tag tag-theme">${ICONS.target}Ideas: ${esc(p.ideas_count)}</span>` : ''}
      </div>
      <h1 class="detail-hero-title">${esc(p.title)}</h1>
    </div>

    <!-- ── Verdict & Score Banner ──────────────────────────────── -->
    ${score != null ? `
    <div class="verdict-banner">
      <div class="verdict-score-box">
        <div class="verdict-score-num">${score}</div>
        <div class="verdict-score-sub">/ 10 Score</div>
      </div>
      <div class="verdict-info">
        <div class="verdict-heading">Research Opportunity Assessment & Verdict</div>
        <div class="verdict-text-main">${labelForScore(score)} — ${esc(p.quick_verdict || 'Review for hackathon scope')}</div>
      </div>
    </div>` : ''}

    <!-- ════════════ TAB 1: OFFICIAL SIH PROBLEM ════════════ -->
    <div class="detail-tab-pane ${state.activeDetailTab === 'official' ? 'active' : ''}" id="pane-official">
      
      <!-- Official Details Table -->
      <div class="detail-section">
        <div class="detail-section-title">
          <span>Official SIH Problem Metadata</span>
          <span class="section-badge badge-official">Official SIH</span>
        </div>
        <table class="compare-table" style="border:none">
          <tr><td style="width:140px">Problem ID</td><td><strong>${esc(p.id)}</strong></td></tr>
          <tr><td>Problem Title</td><td><strong>${esc(p.title)}</strong></td></tr>
          <tr><td>Ministry / Org</td><td>${esc(p.organization || '—')}</td></tr>
          <tr><td>Department</td><td>${esc(p.department || '—')}</td></tr>
          <tr><td>Track</td><td>${esc(p.category)}</td></tr>
          <tr><td>Theme</td><td>${esc(p.theme || '—')}</td></tr>
          <tr><td>Submission Deadline</td><td>${esc(p.deadline || '20 September 2026')}</td></tr>
          <tr><td>Idea Submissions</td><td>${esc(p.ideas_count || '0/500')}</td></tr>
        </table>
      </div>

      <!-- Official Background -->
      ${p.official_background ? `
      <div class="detail-section">
        <div class="detail-section-title">
          <span>Official Background & Problem Context</span>
          <span class="section-badge badge-official">Context</span>
        </div>
        <div class="prose">${renderMarkdown(p.official_background)}</div>
      </div>` : ''}

      <!-- Official Description / Requirements -->
      <div class="detail-section">
        <div class="detail-section-title">
          <span>Official Problem Statement & Detailed Scope</span>
          <span class="section-badge badge-official">Statement</span>
        </div>
        <div class="prose">
          ${p.official_body ? renderMarkdown(p.official_body) : renderMarkdown(p.official_description || p.interpretation || 'Refer to canonical SIH catalogue.')}
        </div>
      </div>

      <!-- Official Expected Solution -->
      ${p.official_expected_solution ? `
      <div class="detail-section" style="border-left:4px solid var(--green)">
        <div class="detail-section-title" style="color:var(--green)">
          <span>Official Expected Solution Deliverables</span>
          <span class="section-badge badge-research">Expected Solution</span>
        </div>
        <div class="prose">${renderMarkdown(p.official_expected_solution)}</div>
      </div>` : ''}

    </div>

    <!-- ════════════ TAB 2: UNIQUE PITCH & MARKET ════════════ -->
    <div class="detail-tab-pane ${state.activeDetailTab === 'pitch' ? 'active' : ''}" id="pane-pitch">
      
      <!-- Proposed Unique Pitch Box -->
      <div class="pitch-showcase">
        <div class="pitch-showcase-title">
          <span>${ICONS.pitch}Proposed Unique Pitch for SIH</span>
          <span class="section-badge badge-pitch">Differentiated Concept</span>
        </div>
        <div class="pitch-showcase-text">
          ${renderMarkdown(p.proposed_pitch?.idea || p.solution_direction || 'Build an end-to-end prototype targeting the core sponsor bottleneck.')}
        </div>

        ${p.proposed_pitch?.differentiation ? `
        <div class="diff-box">
          <div class="diff-box-title">Why This Differentiates Against Generic Competitors:</div>
          <div>${renderMarkdown(p.proposed_pitch.differentiation)}</div>
        </div>` : ''}
      </div>

      <!-- Market Research 4-Card Grid -->
      <div class="detail-section">
        <div class="detail-section-title">
          <span>Market Research & Commercial Feasibility</span>
          <span class="section-badge badge-research">Market Analysis</span>
        </div>
        <div class="mkt-grid">
          <div class="mkt-card">
            <div class="mkt-card-title">${ICONS.target}Market Thesis</div>
            <div class="mkt-card-body">${renderMarkdown(p.market_research?.thesis || 'Adoption depends on measurable time, cost, or quality improvement.')}</div>
          </div>
          <div class="mkt-card">
            <div class="mkt-card-title">${ICONS.building}Primary Buyer / Stakeholder</div>
            <div class="mkt-card-body">${renderMarkdown(p.market_research?.primary_buyer || p.organization || 'Sponsoring Ministry / Department')}</div>
          </div>
          <div class="mkt-card">
            <div class="mkt-card-title">Key Value KPI</div>
            <div class="mkt-card-body">${renderMarkdown(p.market_research?.value_kpi || 'Measure quantifiable efficiency gains, error reduction, or speed.')}</div>
          </div>
          <div class="mkt-card">
            <div class="mkt-card-title">Market & Adoption Risk</div>
            <div class="mkt-card-body">${renderMarkdown(p.market_research?.market_risk || 'Institutional procurement cycles and integration complexity.')}</div>
          </div>
        </div>
      </div>

      <!-- Existing Solutions & Competition -->
      ${(p.existing_solutions?.references || []).length || p.existing_solutions?.competitive_reading ? `
      <div class="detail-section">
        <div class="detail-section-title">
          <span>Existing Solutions & Competition Landscape</span>
          <span class="section-badge badge-infer">Competition</span>
        </div>
        ${(p.existing_solutions?.references || []).length ? `
        <div style="margin-bottom:12px;">
          <div style="font-size:12px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:6px;">Adjacent / Existing Products:</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${p.existing_solutions.references.map(r => `<span class="tag tag-theme" style="font-size:12px;padding:4px 10px">${esc(cleanPlain(r))}</span>`).join('')}
          </div>
        </div>` : ''}
        ${p.existing_solutions?.competitive_reading ? `
        <div class="prose" style="margin-top:10px;">
          <strong>Competitive Reading:</strong> ${renderMarkdown(p.existing_solutions.competitive_reading)}
        </div>` : ''}
      </div>` : ''}

    </div>

    <!-- ════════════ TAB 3: TECH & FEASIBILITY ════════════ -->
    <div class="detail-tab-pane ${state.activeDetailTab === 'tech' ? 'active' : ''}" id="pane-tech">
      
      <!-- Tech Stack -->
      ${(p.technology_stack || []).length ? `
      <div class="detail-section">
        <div class="detail-section-title">
          <span>Research-Derived Technology Stack</span>
          <span class="section-badge badge-research">Tech Stack</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${p.technology_stack.map(t => `<span class="tag tag-cat" style="font-size:12px;padding:5px 12px">${ICONS.zap}${esc(cleanPlain(t))}</span>`).join('')}
        </div>
      </div>` : ''}

      <!-- Requirements Breakdown -->
      <div class="detail-section">
        <div class="detail-section-title">
          <span>Hardware & Software Requirements</span>
          <span class="section-badge badge-research">Requirements</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;">
          <div class="mkt-card">
            <div class="mkt-card-title">${ICONS.hardware}Hardware Requirements</div>
            <div class="mkt-card-body">${renderMarkdown(p.requirements?.hardware || 'Commodity laptop/phone for demo; no custom hardware required.')}</div>
          </div>
          <div class="mkt-card">
            <div class="mkt-card-title">${ICONS.software}Software Requirements</div>
            <div class="mkt-card-body">${renderMarkdown(p.requirements?.software || 'Frontend/mobile client + backend/data layer + domain engine.')}</div>
          </div>
        </div>
      </div>

      <!-- Data & API Strategy -->
      <div class="detail-section">
        <div class="detail-section-title">
          <span>Data & API Strategy</span>
          <span class="section-badge badge-infer">Data Plan</span>
        </div>
        ${(p.data_strategy?.sources || []).length ? `
        <ul class="prose" style="margin-bottom:10px;">
          ${p.data_strategy.sources.map(s => `<li>${renderMarkdown(s)}</li>`).join('')}
        </ul>` : ''}
        ${p.data_strategy?.principle ? `
        <div class="diff-box">
          <div class="diff-box-title">📡 Data Availability Principle:</div>
          <div>${renderMarkdown(p.data_strategy.principle)}</div>
        </div>` : ''}
      </div>

      <!-- 36-hr MVP & Feasibility Breakdown -->
      <div class="detail-section">
        <div class="detail-section-title">
          <span>Feasibility & 36-Hour Hackathon MVP Strategy</span>
          <span class="section-badge badge-research">MVP Blueprint</span>
        </div>
        <div class="feasibility-grid" style="margin-bottom:14px;">
          <div class="feas-card">
            <div class="fc-label">Build Feasibility</div>
            <div class="fc-value" style="color:var(--green)">${esc(cleanPlain(p.feasibility?.build || 'High'))}</div>
          </div>
          <div class="feas-card">
            <div class="fc-label">Technical Feasibility</div>
            <div class="fc-value" style="color:${scoreColor(p.scores?.['Technical Feasibility'])}">${p.scores?.['Technical Feasibility'] != null ? p.scores['Technical Feasibility'] + '/10' : '7/10'}</div>
          </div>
          <div class="feas-card">
            <div class="fc-label">Prototype Burden</div>
            <div class="fc-value">${esc(cleanPlain(p.feasibility?.prototype_burden || 'Moderate'))}</div>
          </div>
          <div class="feas-card">
            <div class="fc-label">Data Feasibility</div>
            <div class="fc-value">${esc(cleanPlain(p.feasibility?.data || 'Medium'))}</div>
          </div>
        </div>
        ${p.feasibility?.mvp_36hr ? `
        <div class="prose" style="background:var(--bg-subtle);padding:12px 14px;border-radius:var(--radius);">
          <strong>${ICONS.clock}36-Hour MVP Blueprint:</strong> ${renderMarkdown(p.feasibility.mvp_36hr)}
        </div>` : ''}
      </div>

      <!-- Risk Management & Mitigations -->
      ${(p.risk_management?.points || p.risks || []).length ? `
      <div class="detail-section">
        <div class="detail-section-title">
          <span>Risk Management & Mitigations</span>
          <span class="section-badge badge-infer">Risks</span>
        </div>
        <ul class="prose">
          ${(p.risk_management?.points || p.risks || []).map(r => `<li>${renderMarkdown(r)}</li>`).join('')}
        </ul>
      </div>` : ''}

      <!-- Sustainability & Open Standards -->
      ${(p.sustainability || []).length ? `
      <div class="detail-section">
        <div class="detail-section-title">
          <span>Sustainability & Operational Viability</span>
          <span class="section-badge badge-research">Sustainability</span>
        </div>
        <ul class="prose">
          ${p.sustainability.map(s => `<li>${renderMarkdown(s)}</li>`).join('')}
        </ul>
      </div>` : ''}

    </div>

    <!-- ════════════ TAB 4: TEAM NOTES & RATING ════════════ -->
    <div class="detail-tab-pane ${state.activeDetailTab === 'notes' ? 'active' : ''}" id="pane-notes">
      
      <!-- 8-Point Research Heuristic Scores -->
      <div class="detail-section">
        <div class="detail-section-title">
          <span>SIH Research Opportunity Heuristic Scores</span>
          <span class="section-badge badge-research">8 Criteria</span>
        </div>
        <div class="scores-grid">
          ${Object.entries(p.scores || {}).map(([k, v]) => v != null ? `
          <div class="score-card">
            <div class="sc-header">
              <span class="sc-title">${esc(k)}</span>
              <span class="sc-val" style="color:${scoreColor(v)}">${v}/10</span>
            </div>
            <div class="sc-track">
              <div class="sc-fill" style="width:${v*10}%;background:${scoreColor(v)}"></div>
            </div>
          </div>` : '').join('')}
        </div>
      </div>

      <!-- Personal 5-Star Team Rating -->
      <div class="detail-section">
        <div class="detail-section-title">
          <span>My Team Rating (1–5 Stars)</span>
          <span class="section-badge badge-pitch">Custom Rating</span>
        </div>
        <div class="personal-scores-grid" id="ps-grid">
          ${renderPersonalScores(id, pScore)}
        </div>
        ${personalOverall(pScore) != null ? `<div class="ps-overall">${ICONS.starFilled} My Overall Rating: ${personalOverall(pScore).toFixed(1)} / 5.0</div>` : ''}
      </div>

      <!-- Team Notes Editor -->
      <div class="detail-section">
        <div class="detail-section-title">
          <span>My Team Notes & Strategy</span>
          <span class="section-badge badge-infer">Auto-Saved</span>
        </div>
        <textarea class="note-editor" id="note-editor" placeholder="Write your team notes, solution brainstorming, architecture thoughts, or questions here…">${esc(note)}</textarea>
        <div class="note-status" id="note-status"></div>
      </div>

    </div>
  `;

  $('detail-content').innerHTML = html;

  // Auto-saving Note editor
  const noteEl = $('note-editor');
  let noteTimer = null;
  if (noteEl) {
    noteEl.addEventListener('input', () => {
      $('note-status').textContent = 'Saving…';
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => {
        const notes = state.progress.notes || {};
        notes[id] = noteEl.value;
        state.progress.notes = notes;
        saveProgress({ notes });
        $('note-status').textContent = 'Saved ✓';
        setTimeout(() => { if ($('note-status')) $('note-status').textContent = ''; }, 2000);
      }, 400);
    });
  }

  // Bind Star ratings
  bindStars(id);

  // Bind detail tab switching
  $$('.detail-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      state.activeDetailTab = tabName;
      $$('.detail-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      $$('.detail-tab-pane').forEach(p => p.classList.remove('active'));
      const activePane = $(`pane-${tabName}`);
      if (activePane) activePane.classList.add('active');
    });
  });

  // Switch to detail view overlay
  $('detail-view').classList.add('active');
  $('detail-content').scrollTop = 0;
}

function bindStars(id) {
  const container = $('detail-content');
  if (!container) return;
  
  container.querySelectorAll('.ps-star').forEach(star => {
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
      const el = container.querySelector('.ps-overall');
      if (el && overall != null) el.textContent = `⭐ My Overall Rating: ${overall.toFixed(1)} / 5.0`;
      showToast('Personal score saved ✓');
    });
  });
}

function renderPersonalScores(id, pScore) {
  const criteria = [
    { key: 'interest',        label: 'Team Interest & Excitement' },
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
  state.detailId = null;
}

// ── Next / Prev Problem Navigation ──────────────────────────────────────
function navigateProblem(offset) {
  if (!state.detailId || !state.filteredIds.length) return;
  const currIdx = state.filteredIds.indexOf(state.detailId);
  if (currIdx === -1) return;
  let nextIdx = currIdx + offset;
  if (nextIdx < 0) nextIdx = state.filteredIds.length - 1;
  if (nextIdx >= state.filteredIds.length) nextIdx = 0;
  openDetail(state.filteredIds[nextIdx]);
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

  // Update card in list
  const card = document.querySelector(`.problem-card[data-id="${id}"]`);
  if (card) {
    const btn = card.querySelector('.pc-read-btn');
    if (read.has(id)) {
      card.classList.add('is-read');
      if (btn) btn.classList.add('read');
    } else {
      card.classList.remove('is-read');
      if (btn) btn.classList.remove('read');
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
    if (btn) {
      if (sl.has(id)) {
        btn.classList.add('starred');
        btn.innerHTML = ICONS.starFilled;
      } else {
        btn.classList.remove('starred');
        btn.innerHTML = ICONS.starOutline;
      }
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
  const swCount = state.problems.filter(p => p.category === 'Software').length;
  const hwCount = state.problems.filter(p => p.category === 'Hardware').length;

  if ($('badge-read')) $('badge-read').textContent = read;
  if ($('badge-unread')) $('badge-unread').textContent = total - read;
  if ($('badge-shortlist')) $('badge-shortlist').textContent = sl;
  if ($('badge-all')) $('badge-all').textContent = total;
  if ($('badge-software')) $('badge-software').textContent = swCount;
  if ($('badge-hardware')) $('badge-hardware').textContent = hwCount;

  // Mobile badges
  if ($('m-badge-all')) $('m-badge-all').textContent = total;
  if ($('m-badge-shortlist')) $('m-badge-shortlist').textContent = sl;
  if ($('bnav-badge-all')) $('bnav-badge-all').textContent = total;
  if ($('bnav-badge-shortlist')) $('bnav-badge-shortlist').textContent = sl;

  // Dashboard stats
  if ($('stat-read')) $('stat-read').textContent = read;
  if ($('stat-unread')) $('stat-unread').textContent = total - read;
  if ($('stat-shortlist')) $('stat-shortlist').textContent = sl;
  if ($('stat-total')) $('stat-total').textContent = total;
  if ($('stat-sw')) $('stat-sw').textContent = swCount;
  if ($('stat-hw')) $('stat-hw').textContent = hwCount;

  const pct = total ? Math.round(read / total * 100) : 0;
  if ($('stat-read-pct')) $('stat-read-pct').textContent = `${pct}% complete`;
}

function updateProgressBar() {
  const read  = (state.progress.read || []).length;
  const total = state.problems.length;
  const pct   = total ? (read / total * 100).toFixed(1) : 0;

  if ($('sidebar-progress-text')) $('sidebar-progress-text').textContent = `${read} / ${total} read`;
  if ($('sidebar-progress-bar')) $('sidebar-progress-bar').style.width = pct + '%';

  if ($('drawer-progress-text')) $('drawer-progress-text').textContent = `${read} / ${total} read`;
  if ($('drawer-progress-bar')) $('drawer-progress-bar').style.width = pct + '%';

  if ($('dash-progress-pct')) $('dash-progress-pct').textContent = pct + '%';
  if ($('dash-progress-bar')) $('dash-progress-bar').style.width = pct + '%';
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

  if ($('dash-top-list')) {
    $('dash-top-list').innerHTML = html || '<div class="empty-state"><div class="empty-desc">No scored problems.</div></div>';
    $('dash-top-list').querySelectorAll('.top-item').forEach(el => {
      el.addEventListener('click', () => openDetail(el.dataset.id));
    });
  }

  // Top candidates full view
  const fullHtml = sorted.map((p, i) => `
    <div class="top-item" data-id="${p.id}">
      <div class="top-rank">#${i + 1}</div>
      <div class="top-info">
        <div class="top-title">${esc(p.title)}</div>
        <div class="top-org">${esc(p.organization)} · ${esc(p.theme || '')}</div>
      </div>
      <span class="tag tag-cat" style="flex-shrink:0">${labelForScore(p.scores['Overall Opportunity'])}</span>
      ${sl.has(p.id) ? '<span style="color:var(--amber);font-size:14px">★</span>' : `<button class="btn" style="padding:0 8px;font-size:11px" onclick="toggleShortlist(event,'${p.id}')">☆ Add</button>`}
      <div class="top-score">${p.scores['Overall Opportunity']}/10</div>
    </div>`).join('');

  if ($('top-list-full')) {
    $('top-list-full').innerHTML = fullHtml || '<div class="empty-state"><div class="empty-desc">No scored problems.</div></div>';
    $('top-list-full').querySelectorAll('.top-item').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('button')) return;
        openDetail(el.dataset.id);
      });
    });
  }
}

function renderBreakdowns() {
  const read = new Set(state.progress.read || []);

  // Theme breakdown
  const themeCount = {};
  state.problems.forEach(p => { if (p.theme) themeCount[p.theme] = (themeCount[p.theme] || 0) + 1; });
  const maxTheme = Math.max(...Object.values(themeCount), 1);
  if ($('theme-breakdown')) {
    $('theme-breakdown').innerHTML = Object.entries(themeCount).sort((a,b)=>b[1]-a[1]).map(([t, c]) => `
      <div class="bar-row">
        <div class="bar-label" title="${esc(t)}">${esc(t)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${c/maxTheme*100}%"></div></div>
        <div class="bar-count">${c}</div>
      </div>`).join('');
  }

  // Domain breakdown
  const domainCount = {};
  state.problems.forEach(p => (p.technology_stack || p.research_categories || []).forEach(c => {
    if (c && c.length < 32 && !c.includes('Standard web') && !c.includes('Relational')) {
      domainCount[c] = (domainCount[c] || 0) + 1;
    }
  }));
  const maxDomain = Math.max(...Object.values(domainCount), 1);
  if ($('domain-breakdown')) {
    $('domain-breakdown').innerHTML = Object.entries(domainCount).sort((a,b)=>b[1]-a[1]).slice(0, 12).map(([d, c]) => `
      <div class="bar-row">
        <div class="bar-label">${esc(d)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${c/maxDomain*100}%;background:var(--green)"></div></div>
        <div class="bar-count">${c}</div>
      </div>`).join('');
  }

  // Org breakdown (top 12)
  const orgCount = {};
  state.problems.forEach(p => { if (p.organization) orgCount[p.organization] = (orgCount[p.organization] || 0) + 1; });
  const maxOrg = Math.max(...Object.values(orgCount), 1);
  if ($('org-breakdown')) {
    $('org-breakdown').innerHTML = Object.entries(orgCount).sort((a,b)=>b[1]-a[1]).slice(0, 12).map(([o, c]) => `
      <div class="bar-row">
        <div class="bar-label" title="${esc(o)}">${esc(shortOrg(o))}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${c/maxOrg*100}%;background:var(--purple)"></div></div>
        <div class="bar-count">${c}</div>
      </div>`).join('');
  }

  // Theme reading progress
  const themeRead = {};
  state.problems.forEach(p => {
    if (!p.theme) return;
    if (!themeRead[p.theme]) themeRead[p.theme] = { total: 0, read: 0 };
    themeRead[p.theme].total++;
    if (read.has(p.id)) themeRead[p.theme].read++;
  });
  if ($('theme-progress-breakdown')) {
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
}

// ── Shortlist View ──────────────────────────────────────────────────────
function renderShortlist() {
  const sl = new Set(state.progress.shortlist || []);
  const problems = state.problems.filter(p => sl.has(p.id));

  const listEl = $('shortlist-list');
  if (!listEl) return;

  if (!problems.length) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">☆</div>
        <div class="empty-title">Your Shortlist is Empty</div>
        <div class="empty-desc">Click the star (☆) button on any problem to bookmark it here for team evaluation and comparison.</div>
      </div>`;
    return;
  }

  const notes = state.progress.notes || {};
  const pScores = state.progress.personal_scores || {};

  const html = problems.map(p => {
    const score = p.scores?.['Overall Opportunity'];
    const ps    = pScores[p.id];
    const po    = personalOverall(ps);
    const isHW  = p.category === 'Hardware';

    return `
    <div class="problem-card" data-id="${p.id}">
      <div class="pc-mid">
        <div class="pc-header-row">
          <span class="pc-id">${esc(p.id)}</span>
          <span class="tag ${isHW ? 'tag-hardware' : 'tag-software'}">${isHW ? ICONS.hardware + 'Hardware' : ICONS.software + 'Software'}</span>
          ${p.theme ? `<span class="tag tag-theme">${esc(p.theme)}</span>` : ''}
          <span class="tag tag-org" title="${esc(p.organization)}">${esc(shortOrg(p.organization))}</span>
        </div>
        <h3 class="pc-title">${esc(p.title)}</h3>
        ${notes[p.id] ? `<div style="font-size:12.5px;color:var(--text-secondary);margin-top:6px;font-style:italic;background:var(--bg-subtle);padding:6px 10px;border-radius:var(--radius-sm);">"${esc(notes[p.id].slice(0, 140))}${notes[p.id].length > 140 ? '…' : ''}"</div>` : ''}
      </div>
      <div class="pc-right">
        ${score != null ? `<span class="tag tag-cat">Score: ${score}/10</span>` : ''}
        ${po != null ? `<span class="tag tag-deadline">My: ${po.toFixed(1)}/5 ${ICONS.starFilled}</span>` : ''}
        <button class="btn" style="color:var(--red);border-color:var(--red-border);font-size:11px;height:28px" onclick="toggleShortlist(event,'${p.id}')">Remove</button>
      </div>
    </div>`;
  }).join('');

  listEl.innerHTML = html;
  listEl.querySelectorAll('.problem-card').forEach(el => {
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
  if (!container) return;

  if (problems.length < 2) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${ICONS.compare}</div>
        <div class="empty-title">Add at least 2 problems to your shortlist</div>
        <div class="empty-desc">Bookmark problems using the star icon, then come back here to compare them side-by-side.</div>
      </div>`;
    return;
  }

  const rows = [
    ['Problem ID',              p => p.id],
    ['Title',                   p => p.title],
    ['Organization',            p => shortOrg(p.organization)],
    ['Track',                   p => p.category],
    ['Theme',                   p => p.theme || '—'],
    ['Submission Deadline',     p => p.deadline || '20 Sep 2026'],
    ['Unique Pitch Idea',       p => cleanPlain(p.proposed_pitch?.idea || p.solution_direction || '—').slice(0, 160)],
    ['Differentiation',         p => cleanPlain(p.proposed_pitch?.differentiation || '—').slice(0, 140)],
    ['Market Thesis',           p => cleanPlain(p.market_research?.thesis || '—').slice(0, 140)],
    ['Primary Buyer',           p => cleanPlain(p.market_research?.primary_buyer || p.organization || '—')],
    ['Overall Research Score',  p => p.scores?.['Overall Opportunity'] != null ? p.scores['Overall Opportunity'] + '/10' : '—'],
    ['Innovation',              p => p.scores?.Innovation != null ? p.scores.Innovation + '/10' : '—'],
    ['Impact',                  p => p.scores?.Impact != null ? p.scores.Impact + '/10' : '—'],
    ['Technical Feasibility',   p => p.scores?.['Technical Feasibility'] != null ? p.scores['Technical Feasibility'] + '/10' : '—'],
    ['Build Feasibility',       p => cleanPlain(p.feasibility?.build || 'High')],
    ['36-hr MVP Blueprint',     p => cleanPlain(p.feasibility?.mvp_36hr || '—').slice(0, 140)],
    ['My Team Rating',          p => { const ps = (state.progress.personal_scores || {})[p.id]; const po = personalOverall(ps); return po != null ? po.toFixed(1) + ' / 5.0 ★' : '—'; }],
    ['My Team Notes',           p => { const n = (state.progress.notes || {})[p.id]; return n ? n.slice(0, 120) : '—'; }],
  ];

  // Desktop Matrix Table
  const thead = `<tr><th style="min-width:140px">Criteria</th>${problems.map(p => `<th><div style="font-size:11px;font-family:var(--font-mono);color:var(--text-tertiary)">${p.id}</div><div style="font-size:13px;font-weight:700">${esc(p.title.slice(0, 60))}${p.title.length > 60 ? '…' : ''}</div></th>`).join('')}</tr>`;
  const tbody = rows.map(([label, fn]) =>
    `<tr><td>${label}</td>${problems.map(p => `<td>${esc(fn(p))}</td>`).join('')}</tr>`
  ).join('');

  // Mobile Comparison Cards
  const mobileCards = `
    <div class="mobile-compare-container">
      ${problems.map(p => `
        <div class="mobile-compare-card">
          <div class="mobile-compare-title">
            <span class="pc-id">${p.id}</span> · ${esc(p.title)}
          </div>
          <table class="compare-table" style="border:none">
            ${rows.map(([label, fn]) => `<tr><td style="width:120px;font-size:11px">${label}</td><td style="font-size:12px">${esc(fn(p))}</td></tr>`).join('')}
          </table>
        </div>
      `).join('')}
    </div>
  `;

  container.innerHTML = `
    <div class="compare-table-wrap">
      <table class="compare-table">
        <thead>${thead}</thead>
        <tbody>${tbody}</tbody>
      </table>
    </div>
    ${mobileCards}
  `;
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

  let md = `# SIH 2026 Shortlisted Problem Statements Dossier\n\n`;
  md += `Export Date: ${new Date().toLocaleDateString()}\n`;
  md += `Total Shortlisted: ${problems.length}\n\n`;

  md += `| ID | Title | Track | Theme | Organization | Research Score | My Rating | Notes |\n`;
  md += `|---|---|---|---|---|---|---|---|\n`;

  problems.forEach(p => {
    const score = p.scores?.['Overall Opportunity'] != null ? `${p.scores['Overall Opportunity']}/10` : '—';
    const po = personalOverall(pScores[p.id]);
    const myRating = po != null ? `${po.toFixed(1)}/5 ★` : '—';
    const note = (notes[p.id] || '').replace(/[\r\n]+/g, ' ');
    md += `| ${p.id} | ${p.title} | ${p.category} | ${p.theme || '—'} | ${p.organization} | ${score} | ${myRating} | ${note} |\n`;
  });

  md += `\n## Problem Details & Research Summaries\n\n`;
  problems.forEach(p => {
    md += `### [${p.id}] ${p.title}\n`;
    md += `- **Organization:** ${p.organization}\n`;
    md += `- **Track:** ${p.category}\n`;
    md += `- **Theme:** ${p.theme || '—'}\n`;
    if (p.proposed_pitch?.idea) md += `- **Unique Pitch:** ${cleanPlain(p.proposed_pitch.idea)}\n`;
    if (p.market_research?.thesis) md += `- **Market Thesis:** ${cleanPlain(p.market_research.thesis)}\n`;
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

  const headers = ['ID', 'Title', 'Track', 'Theme', 'Organization', 'Research Score', 'My Rating', 'Pitch Idea', 'My Notes'];
  const rows = problems.map(p => {
    const score = p.scores?.['Overall Opportunity'] != null ? `${p.scores['Overall Opportunity']}/10` : '';
    const po = personalOverall(pScores[p.id]);
    const myRating = po != null ? po.toFixed(1) : '';
    const pitch = cleanPlain(p.proposed_pitch?.idea || '').replace(/"/g, '""');
    const note = (notes[p.id] || '').replace(/"/g, '""');
    return [
      `"${p.id}"`,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      `"${(p.theme || '').replace(/"/g, '""')}"`,
      `"${p.organization.replace(/"/g, '""')}"`,
      `"${score}"`,
      `"${myRating}"`,
      `"${pitch}"`,
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

// ── View Switching & Navigation ─────────────────────────────────────────
function showView(view, extra = {}) {
  state.view = view;

  // Close detail view if open
  if ($('detail-view')) $('detail-view').classList.remove('active');

  // Close mobile drawer
  closeMobileDrawer();

  // Hide all view containers
  $$('.view').forEach(v => v.classList.remove('active'));

  // Update Desktop Sidebar active states
  $$('#sidebar .nav-item').forEach(item => {
    if (item.dataset.view === view && !extra.filter) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update Bottom Nav active states
  $$('.bottom-nav-item').forEach(item => {
    if (item.dataset.view === view) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Handle specific views
  const viewEl = $(`${view}-view`);
  if (viewEl) viewEl.classList.add('active');

  // Topbar and filterbar visibility
  const isListView = (view === 'all');
  if ($('topbar')) $('topbar').style.display = isListView ? '' : 'none';
  if ($('filterbar')) $('filterbar').style.display = isListView ? '' : 'none';

  if (view === 'all') {
    if (extra.filter === 'read') {
      state.filters.read = 'read';
      updateFilterChips('read', 'read');
    } else if (extra.filter === 'unread') {
      state.filters.read = 'unread';
      updateFilterChips('read', 'unread');
    } else if (extra.filter === 'software') {
      state.filters.category = 'Software';
      updateFilterChips('category', 'Software');
    } else if (extra.filter === 'hardware') {
      state.filters.category = 'Hardware';
      updateFilterChips('category', 'Hardware');
    }
    renderAll();
  } else if (view === 'dashboard') {
    renderDashboard();
  } else if (view === 'shortlist') {
    renderShortlist();
  } else if (view === 'top') {
    renderTopCandidates();
  } else if (view === 'compare') {
    renderCompare();
  }

  // Scroll to top of content
  if ($('content')) $('content').scrollTop = 0;
}

function updateFilterChips(group, val) {
  $$(`.filter-chip[data-filter="${group}"]`).forEach(chip => {
    if (chip.dataset.value === val) chip.classList.add('active');
    else chip.classList.remove('active');
  });

  // Also sync drawer chips
  $$(`.drawer-chip[data-drawer-filter="${group}"]`).forEach(chip => {
    if (chip.dataset.val === val) chip.classList.add('active');
    else chip.classList.remove('active');
  });
}

function resetFilters() {
  state.search = '';
  state.filters = { category: '', read: '', theme: '', org: '', rescat: '' };
  
  if ($('search-input')) $('search-input').value = '';
  if ($('search-clear')) $('search-clear').style.display = 'none';
  if ($('theme-filter')) $('theme-filter').value = '';
  if ($('org-filter')) $('org-filter').value = '';
  if ($('rescat-filter')) $('rescat-filter').value = '';
  if ($('drawer-theme-filter')) $('drawer-theme-filter').value = '';
  if ($('drawer-org-filter')) $('drawer-org-filter').value = '';

  updateFilterChips('category', '');
  updateFilterChips('read', '');
  renderAll();
  showToast('Filters reset ✓');
}

// ── Mobile Drawer Controls ──────────────────────────────────────────────
function openMobileDrawer() {
  if ($('mobile-drawer')) $('mobile-drawer').classList.add('active');
  if ($('drawer-overlay')) $('drawer-overlay').classList.add('active');
}

function closeMobileDrawer() {
  if ($('mobile-drawer')) $('mobile-drawer').classList.remove('active');
  if ($('drawer-overlay')) $('drawer-overlay').classList.remove('active');
}

// ── Toast Notifications ──────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  const toast = $('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

// ── Event Bindings ───────────────────────────────────────────────────────
function bindEvents() {
  // Desktop Sidebar Nav Clicks
  $$('#sidebar .nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      const filter = item.dataset.filter;
      showView(view, { filter });
    });
  });

  // Mobile Bottom Nav Clicks
  $$('.bottom-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (item.id === 'bnav-more') {
        openMobileDrawer();
        return;
      }
      const view = item.dataset.view;
      if (view) showView(view);
    });
  });

  // Mobile Drawer Triggers
  if ($('btn-open-drawer')) $('btn-open-drawer').addEventListener('click', openMobileDrawer);
  if ($('drawer-close')) $('drawer-close').addEventListener('click', closeMobileDrawer);
  if ($('drawer-overlay')) $('drawer-overlay').addEventListener('click', closeMobileDrawer);
  if ($('btn-toggle-filter-sheet')) $('btn-toggle-filter-sheet').addEventListener('click', openMobileDrawer);

  // Mobile Drawer Navigation items
  $$('.drawer-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      if (view) showView(view);
    });
  });

  // Drawer filter chips
  $$('.drawer-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const group = chip.dataset.drawerFilter;
      const val = chip.dataset.val;
      state.filters[group] = val;
      updateFilterChips(group, val);
      renderAll();
      closeMobileDrawer();
    });
  });

  // Drawer select filters
  if ($('drawer-theme-filter')) {
    $('drawer-theme-filter').addEventListener('change', e => {
      state.filters.theme = e.target.value;
      if ($('theme-filter')) $('theme-filter').value = e.target.value;
      renderAll();
      closeMobileDrawer();
    });
  }

  if ($('drawer-org-filter')) {
    $('drawer-org-filter').addEventListener('change', e => {
      state.filters.org = e.target.value;
      if ($('org-filter')) $('org-filter').value = e.target.value;
      renderAll();
      closeMobileDrawer();
    });
  }

  // Mobile search toggle button
  if ($('btn-toggle-search')) {
    $('btn-toggle-search').addEventListener('click', () => {
      const tb = $('topbar');
      if (tb) {
        tb.classList.toggle('mobile-search-open');
        if (tb.classList.contains('mobile-search-open')) {
          if ($('search-input')) $('search-input').focus();
        }
      }
    });
  }

  // Quick theme toggle button
  const toggleTheme = () => {
    const isDark = document.documentElement.dataset.theme === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    state.progress.preferences = state.progress.preferences || {};
    state.progress.preferences.theme = nextTheme;
    saveProgress({ preferences: state.progress.preferences });
    applyPreferences();
    showToast(`Switched to ${nextTheme} theme`);
  };

  if ($('btn-theme-quick')) $('btn-theme-quick').addEventListener('click', toggleTheme);
  if ($('setting-dark-mode')) $('setting-dark-mode').addEventListener('change', toggleTheme);
  if ($('drawer-dark-mode')) $('drawer-dark-mode').addEventListener('change', toggleTheme);

  // Search input debouncing
  let searchDebounce = null;
  if ($('search-input')) {
    $('search-input').addEventListener('input', e => {
      const val = e.target.value;
      state.search = val;
      if ($('search-clear')) $('search-clear').style.display = val ? 'flex' : 'none';
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        renderAll();
      }, 150);
    });
  }

  if ($('search-clear')) {
    $('search-clear').addEventListener('click', () => {
      state.search = '';
      if ($('search-input')) $('search-input').value = '';
      $('search-clear').style.display = 'none';
      renderAll();
    });
  }

  // Keyboard shortcut '/' to focus search
  window.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement !== $('search-input') && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      const tb = $('topbar');
      if (tb) tb.classList.add('mobile-search-open');
      if ($('search-input')) $('search-input').focus();
    }
    if (e.key === 'Escape') {
      if (state.detailId) closeDetail();
      closeMobileDrawer();
    }
    // Left/Right arrows for problem navigation when detail view is open
    if (state.detailId && document.activeElement !== $('note-editor')) {
      if (e.key === 'ArrowLeft') navigateProblem(-1);
      if (e.key === 'ArrowRight') navigateProblem(1);
    }
  });

  // Sort dropdown
  if ($('sort-select')) {
    $('sort-select').addEventListener('change', e => {
      state.sort = e.target.value;
      renderAll();
    });
  }

  // Filter chips in top filterbar
  $$('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const filterGroup = chip.dataset.filter;
      const val = chip.dataset.value;
      state.filters[filterGroup] = val;
      updateFilterChips(filterGroup, val);
      renderAll();
    });
  });

  // Dropdown filter selects in top filterbar
  if ($('theme-filter')) {
    $('theme-filter').addEventListener('change', e => {
      state.filters.theme = e.target.value;
      if ($('drawer-theme-filter')) $('drawer-theme-filter').value = e.target.value;
      renderAll();
    });
  }

  if ($('org-filter')) {
    $('org-filter').addEventListener('change', e => {
      state.filters.org = e.target.value;
      if ($('drawer-org-filter')) $('drawer-org-filter').value = e.target.value;
      renderAll();
    });
  }

  if ($('rescat-filter')) {
    $('rescat-filter').addEventListener('change', e => {
      state.filters.rescat = e.target.value;
      renderAll();
    });
  }

  // Detail View Topbar Buttons
  if ($('btn-back')) $('btn-back').addEventListener('click', closeDetail);
  if ($('btn-prev-problem')) $('btn-prev-problem').addEventListener('click', () => navigateProblem(-1));
  if ($('btn-next-problem')) $('btn-next-problem').addEventListener('click', () => navigateProblem(1));

  if ($('detail-read-btn')) {
    $('detail-read-btn').addEventListener('click', () => {
      if (state.detailId) toggleRead(null, state.detailId);
    });
  }

  if ($('detail-star-btn')) {
    $('detail-star-btn').addEventListener('click', () => {
      if (state.detailId) toggleShortlist(null, state.detailId);
    });
  }

  if ($('detail-share-btn')) {
    $('detail-share-btn').addEventListener('click', () => {
      if (!state.detailId) return;
      const p = state.problems.find(x => x.id === state.detailId);
      if (!p) return;
      const shareText = `[${p.id}] ${p.title}\nTheme: ${p.theme} | Org: ${p.organization}\nPitch: ${cleanPlain(p.proposed_pitch?.idea || p.summary || '')}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => showToast('Problem summary copied to clipboard! 📋'));
      } else {
        showToast('Summary ready');
      }
    });
  }

  // Shortlist Actions
  if ($('btn-compare-shortlist')) $('btn-compare-shortlist').addEventListener('click', () => showView('compare'));
  if ($('btn-compare-back')) $('btn-compare-back').addEventListener('click', () => showView('shortlist'));
  if ($('btn-export-shortlist-md')) $('btn-export-shortlist-md').addEventListener('click', exportShortlistMarkdown);
  if ($('btn-export-shortlist-csv')) $('btn-export-shortlist-csv').addEventListener('click', exportShortlistCSV);
  if ($('btn-export-md-settings')) $('btn-export-md-settings').addEventListener('click', exportShortlistMarkdown);

  // Settings: Export / Import
  if ($('btn-export')) $('btn-export').addEventListener('click', exportProgressJSON);
  if ($('btn-import-trigger')) $('btn-import-trigger').addEventListener('click', () => $('import-file-input').click());
  if ($('import-file-input')) {
    $('import-file-input').addEventListener('change', e => {
      if (e.target.files && e.target.files[0]) importProgressJSON(e.target.files[0]);
    });
  }

  // Settings: Reset
  if ($('btn-reset')) {
    $('btn-reset').addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all your personal notes, read status, and shortlist? The master research will remain intact.')) {
        state.progress = defaultProgress();
        saveProgress(state.progress);
        updateBadges();
        updateProgressBar();
        renderAll();
        showToast('Progress reset successfully');
      }
    });
  }

  // Settings: Density & Defaults
  if ($('setting-density')) {
    $('setting-density').addEventListener('change', e => {
      const val = e.target.value;
      document.documentElement.dataset.density = val;
      state.progress.preferences = state.progress.preferences || {};
      state.progress.preferences.density = val;
      saveProgress({ preferences: state.progress.preferences });
    });
  }

  if ($('setting-default-sort')) {
    $('setting-default-sort').addEventListener('change', e => {
      const val = e.target.value;
      state.sort = val;
      if ($('sort-select')) $('sort-select').value = val;
      state.progress.preferences = state.progress.preferences || {};
      state.progress.preferences.default_sort = val;
      saveProgress({ preferences: state.progress.preferences });
    });
  }

  if ($('setting-show-research')) {
    $('setting-show-research').addEventListener('change', e => {
      state.progress.preferences = state.progress.preferences || {};
      state.progress.preferences.show_research_sections = e.target.checked;
      saveProgress({ preferences: state.progress.preferences });
      if (state.detailId) openDetail(state.detailId);
    });
  }
}

// ── Initialize App when DOM is ready ────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

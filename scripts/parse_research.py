#!/usr/bin/env python3
"""
Parse SIH_2026_MASTER_RESEARCH_FINAL.md + Official SIH Archive -> data/sih_2026_problems.json
Extracts all 226 problem statements with:
- Full official SIH problem statement, background, expected solution, deadline, organization, category, theme.
- Complete research layer: Market Research, Unique Pitch, Differentiators, Existing Solutions, Tech Stack, Requirements, Feasibility, Risk Management, Sustainability, Heuristic Scores, Quick Verdict, and Citations.
- Cleans AI formatting / double-star artifacts while preserving clean semantic structures.
"""

import re
import json
import os
import ssl
import urllib.request

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_MD = os.path.join(BASE_DIR, "SIH_2026_MASTER_RESEARCH_FINAL.md")
OFFICIAL_CACHE = os.path.join(BASE_DIR, "data", "official_sih_mirror.json")
OUT_JSON = os.path.join(BASE_DIR, "data", "sih_2026_problems.json")

os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)

# ── Load Official SIH Dataset ──────────────────────────────────────────────
official_data = []
if os.path.exists(OFFICIAL_CACHE):
    try:
        with open(OFFICIAL_CACHE, "r", encoding="utf-8") as f:
            official_data = json.load(f)
            print(f"[PARSER] Loaded {len(official_data)} records from local official cache: {OFFICIAL_CACHE}")
    except Exception as e:
        print(f"[PARSER] Cache load failed: {e}")

if not official_data:
    try:
        ctx = ssl._create_unverified_context()
        url = "https://raw.githubusercontent.com/vedantchalke36/sih-2026-problem-statements/refs/heads/main/data/sih2026_ps.json"
        print(f"[PARSER] Fetching official SIH records from {url}...")
        with urllib.request.urlopen(url, context=ctx, timeout=10) as resp:
            official_data = json.loads(resp.read().decode("utf-8"))
            with open(OFFICIAL_CACHE, "w", encoding="utf-8") as f:
                json.dump(official_data, f, ensure_ascii=False, indent=2)
            print(f"[PARSER] Fetched and cached {len(official_data)} official records.")
    except Exception as e:
        print(f"[PARSER] Warning: Could not fetch remote official dataset: {e}")

official_map = {item.get("ps_number"): item for item in official_data if item.get("ps_number")}

# ── Read Master Research MD ────────────────────────────────────────────────
with open(SRC_MD, "r", encoding="utf-8") as f:
    text = f.read()

# ── Helpers ────────────────────────────────────────────────────────────────
def clean_text(s):
    if not s:
        return ""
    # Normalize spaces
    return s.strip()

def strip_all_stars(s):
    if not s:
        return ""
    s = re.sub(r"\*\*+", "", s)
    s = re.sub(r"__+", "", s)
    return s.strip()

def clean_inline_formatting(s):
    if not s:
        return ""
    # Strip leading/trailing label markers like "- **Market thesis:**" or "**PROPOSED IDEA:**"
    s = re.sub(r"^[*-•\s]*\*\*[^*]+:\*\*\s*", "", s)
    s = re.sub(r"^[*-•\s]*", "", s)
    return s.strip()

def extract_section(block, title_pattern):
    # Match section up to next ### or --- or end of block
    m = re.search(r"###\s+(?:\d+\.\s+)?" + title_pattern + r"[^\n]*\n(.*?)(?=\n###|\n---|\Z)", block, re.DOTALL | re.IGNORECASE)
    return m.group(1).strip() if m else ""

def extract_bullets(sec_text):
    if not sec_text:
        return []
    items = []
    for line in sec_text.splitlines():
        s = line.strip()
        if s.startswith(("-", "*", "•")) and len(s) > 1:
            clean_item = s.lstrip("-*• \t").strip()
            if clean_item:
                items.append(clean_item)
    return items

def extract_key_val(sec_text, key_prefix):
    if not sec_text:
        return ""
    # Patterns:
    # 1. - **Key:** Value
    # 2. **Key:** Value
    # 3. Key: Value
    pattern = r"(?:^|\n)\s*(?:-\s*)?\*\*" + re.escape(key_prefix) + r":?\*\*:?\s*(.*?)(?=\n\s*-\s*\*\*|\n\s*\*\*|\n\s*###|\Z)"
    m = re.search(pattern, sec_text, re.DOTALL | re.IGNORECASE)
    if m:
        return clean_text(m.group(1))
    
    # Try without bold
    pattern_alt = r"(?:^|\n)\s*(?:-\s*)?" + re.escape(key_prefix) + r":\s*(.*?)(?=\n\s*-\s*|\n\s*###|\Z)"
    m_alt = re.search(pattern_alt, sec_text, re.DOTALL | re.IGNORECASE)
    if m_alt:
        return clean_text(m_alt.group(1))
    
    return ""

def extract_scores(block):
    scores = {}
    sec = extract_section(block, r"SIH Opportunity Score")
    for line in sec.splitlines():
        m = re.search(r"\|\s*([^|]+?)\s*\|\s*(\d+)/10\s*\|", line)
        if m:
            crit = m.group(1).strip()
            val = int(m.group(2))
            scores[crit] = val
        else:
            m_na = re.search(r"\|\s*([^|]+?)\s*\|\s*N/A\s*\|", line, re.IGNORECASE)
            if m_na:
                crit = m_na.group(1).strip()
                if crit not in ("Criterion", "Field") and not crit.startswith("---"):
                    scores[crit] = None
    return scores

def extract_official_table(sec_text):
    kv = {}
    for line in sec_text.splitlines():
        m = re.match(r"\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|", line)
        if m:
            k = m.group(1).strip()
            v = m.group(2).strip()
            if k and k not in ("Field", "Criterion") and not k.startswith("---"):
                kv[k] = v
    return kv

# ── Split Document into Problem Blocks ─────────────────────────────────────
problem_pattern = re.compile(r"^## (SIH26\d{3})\s*[—-]+\s*(.+)$", re.MULTILINE)
matches = list(problem_pattern.finditer(text))
print(f"[PARSER] Found {len(matches)} problem statements in {os.path.basename(SRC_MD)}")

problems = []

for i, m in enumerate(matches):
    pid = m.group(1).strip()
    title = strip_all_stars(m.group(2).strip())
    start = m.start()
    if i + 1 < len(matches):
        end = matches[i + 1].start()
    else:
        # Last problem: slice up to the end of problem block before document conclusions
        end_match = re.search(r"\n---\s*\n\s*#\s+6\.", text[start:])
        end = start + end_match.start() if end_match else len(text)
    
    block = text[start:end]

    off_table = extract_official_table(extract_section(block, r"Official Information"))
    official_obj = official_map.get(pid, {})

    # Organization & Dept
    org = official_obj.get("org") or off_table.get("Organization", "")
    dept = official_obj.get("department") or off_table.get("Department", "")
    if not dept or dept.startswith("Not specified") or dept == org:
        dept = official_obj.get("department", dept)
    cat = official_obj.get("category") or off_table.get("Official Category", "Software")
    theme = official_obj.get("theme") or off_table.get("Official Theme", "")
    
    # Official Description & Breakdown
    raw_desc = official_obj.get("description", "").strip()
    bg_match = re.search(r"Background:\s*(.*?)(?=\nDescription:|\Z)", raw_desc, re.DOTALL | re.IGNORECASE)
    desc_match = re.search(r"Description:\s*(.*?)(?=\nExpected Solution:|\Z)", raw_desc, re.DOTALL | re.IGNORECASE)
    sol_match = re.search(r"Expected Solution:\s*(.*?)(?=\Z)", raw_desc, re.DOTALL | re.IGNORECASE)

    bg_text = bg_match.group(1).strip() if bg_match else ""
    body_desc = desc_match.group(1).strip() if desc_match else raw_desc
    expected_sol = sol_match.group(1).strip() if sol_match else ""

    # Research Sections
    sec_mean = extract_section(block, r"What the Problem Really Means")
    sec_exist = extract_section(block, r"Existing Solutions & Competition")
    sec_mkt = extract_section(block, r"Market Research")
    sec_pitch = extract_section(block, r"Proposed Unique Pitch")
    sec_tech = extract_section(block, r"Research-Derived Technology")
    sec_req = extract_section(block, r"Hardware / Software Requirements")
    sec_data = extract_section(block, r"Data / API Strategy")
    sec_feas = extract_section(block, r"Feasibility")
    sec_risk = extract_section(block, r"Risk Management")
    sec_sust = extract_section(block, r"Sustainability")
    scores = extract_scores(block)
    sec_verd = extract_section(block, r"Quick Verdict")
    sec_sources = extract_section(block, r"Research Sources")

    # Section 1: Interpretation & Inference
    inference = extract_key_val(sec_mean, "INFERENCE")
    if not inference:
        inference = re.sub(r"^\s*\*\*INFERENCE:\*\*\s*", "", sec_mean).strip()
    
    # Section 2: Existing solutions & Competition
    exist_refs = [re.sub(r"^\*\*(.*?)\*\*$", r"\1", r) for r in extract_bullets(sec_exist)]
    exist_reading = extract_key_val(sec_exist, "Competitive reading")
    
    # Section 3: Market research
    mkt_thesis = extract_key_val(sec_mkt, "Market thesis")
    mkt_buyer = extract_key_val(sec_mkt, "Primary buyer/stakeholder") or extract_key_val(sec_mkt, "Primary buyer")
    mkt_kpi = extract_key_val(sec_mkt, "Value KPI")
    mkt_risk = extract_key_val(sec_mkt, "Market risk")
    
    # Section 4: Proposed Unique Pitch
    pitch_idea = extract_key_val(sec_pitch, "PROPOSED IDEA")
    pitch_diff = extract_key_val(sec_pitch, "Why this can differentiate")
    if not pitch_diff:
        pitch_diff = extract_key_val(sec_pitch, "Why this can differentiate:")
    
    # Section 5: Tech stack
    tech_stack = extract_bullets(sec_tech)
    
    # Section 6: Requirements
    req_hw = extract_key_val(sec_req, "Hardware")
    req_sw = extract_key_val(sec_req, "Software")
    
    # Section 7: Data strategy
    data_bullets = extract_bullets(sec_data)
    data_principle = extract_key_val(sec_data, "Data principle")
    
    # Section 8: Feasibility
    feas_bullets = extract_bullets(sec_feas)
    feas_build = ""
    feas_36hr = ""
    feas_data = ""
    feas_burden = ""
    feas_deploy = ""
    for fb in feas_bullets:
        if "Overall build feasibility:" in fb:
            feas_build = re.sub(r"^Overall build feasibility:\s*", "", fb).strip()
        elif "36-hour MVP:" in fb:
            feas_36hr = re.sub(r"^36-hour MVP:\s*", "", fb).strip()
        elif "Data feasibility:" in fb:
            feas_data = re.sub(r"^Data feasibility:\s*", "", fb).strip()
        elif "Prototype burden:" in fb:
            feas_burden = re.sub(r"^Prototype burden:\s*", "", fb).strip()
        elif "Deployment:" in fb:
            feas_deploy = re.sub(r"^Deployment:\s*", "", fb).strip()

    # Section 9: Risk Management
    risk_bullets = extract_bullets(sec_risk)
    primary_risk = extract_key_val(sec_risk, "Primary risk response")
    
    # Section 10: Sustainability
    sust_bullets = extract_bullets(sec_sust)
    
    # Section 13: Citations
    sources_list = extract_bullets(sec_sources)

    # Clean quick verdict
    quick_verd = re.sub(r"^\*\*(.*?)\*\*$", r"\1", sec_verd).strip()

    # Category & Theme fallback
    if "hardware" in cat.lower():
        cat = "Hardware"
    else:
        cat = "Software"

    p = {
        "id": pid,
        "title": title,
        "organization": org,
        "department": dept,
        "category": cat,
        "theme": theme,
        "deadline": official_obj.get("deadline", "20 September 2026"),
        "deadline_date": official_obj.get("deadline_date", "2026-09-20"),
        "ideas_count": official_obj.get("ideas", "0/500"),
        "youtube": official_obj.get("youtube", ""),
        "dataset_link": official_obj.get("dataset_link", ""),
        "contact": official_obj.get("contact", ""),
        # Official Problem Description
        "official_description": raw_desc,
        "official_background": bg_text,
        "official_body": body_desc,
        "official_expected_solution": expected_sol,
        # Section 1: Interpretation
        "interpretation": inference,
        # Section 2: Existing Solutions
        "existing_solutions": {
            "references": exist_refs,
            "competitive_reading": exist_reading
        },
        # Section 3: Market Research
        "market_research": {
            "thesis": mkt_thesis,
            "primary_buyer": mkt_buyer,
            "value_kpi": mkt_kpi,
            "market_risk": mkt_risk
        },
        # Section 4: Proposed Pitch
        "proposed_pitch": {
            "idea": pitch_idea,
            "differentiation": pitch_diff
        },
        # Section 5: Tech Stack
        "technology_stack": tech_stack,
        # Section 6: Requirements
        "requirements": {
            "hardware": req_hw,
            "software": req_sw
        },
        # Section 7: Data Strategy
        "data_strategy": {
            "sources": data_bullets,
            "principle": data_principle
        },
        # Section 8: Feasibility
        "feasibility": {
            "build": feas_build,
            "mvp_36hr": feas_36hr,
            "data": feas_data,
            "prototype_burden": feas_burden,
            "deployment": feas_deploy,
            "all_points": feas_bullets,
            "technical": scores.get("Technical Feasibility"),
            "prototype": scores.get("Prototype Feasibility")
        },
        # Section 9: Risk Management
        "risk_management": {
            "primary_risk": primary_risk,
            "points": risk_bullets
        },
        # Section 10: Sustainability
        "sustainability": sust_bullets,
        # Section 11: Heuristic Scores
        "scores": scores,
        # Section 12: Quick Verdict
        "quick_verdict": quick_verd,
        # Section 13: Citations
        "sources": sources_list,
        # Compatibility fields
        "summary": inference if inference else (body_desc[:250] if body_desc else title),
        "research_categories": [theme] + tech_stack[:2] if tech_stack else [theme],
        "technology_opportunities": tech_stack,
        "risks": risk_bullets,
        "gap_analysis": exist_reading,
        "solution_direction": pitch_idea,
    }
    problems.append(p)

print(f"[PARSER] Total problems processed: {len(problems)}")
print(f"[PARSER] Software: {sum(1 for p in problems if p['category'] == 'Software')} | Hardware: {sum(1 for p in problems if p['category'] == 'Hardware')}")

# Validation
ids = [p["id"] for p in problems]
unique_ids = set(ids)
assert len(unique_ids) == 226, f"Expected 226 unique IDs, got {len(unique_ids)}"
assert min(ids) == "SIH26001" and max(ids) == "SIH26226", f"ID bounds unexpected: {min(ids)} - {max(ids)}"

with open(OUT_JSON, "w", encoding="utf-8") as f:
    json.dump({"total": len(problems), "problems": problems}, f, ensure_ascii=False, indent=2)

print(f"[PARSER] Successfully wrote {OUT_JSON} ({os.path.getsize(OUT_JSON)} bytes)")

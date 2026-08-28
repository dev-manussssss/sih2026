#!/usr/bin/env python3
"""
Parse SIH_2026_MASTER_RESEARCH.md -> data/sih_2026_problems.json
Extracts all 226 problem records from the master research Markdown.
"""

import re
import json
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(BASE, "SIH_2026_MASTER_RESEARCH.md")
OUT_DIR = os.path.join(BASE, "data")
os.makedirs(OUT_DIR, exist_ok=True)

with open(SRC, encoding="utf-8") as f:
    text = f.read()


# ── helpers ────────────────────────────────────────────────────────────────
def clean(s):
    return s.strip() if s else ""


def table_val(block, field):
    pattern = r"\|\s*" + re.escape(field) + r"\s*\|\s*(.*?)\s*\|"
    m = re.search(pattern, block, re.IGNORECASE)
    return clean(m.group(1)) if m else ""


def section_text(block, heading):
    pattern = r"##\s+" + re.escape(heading) + r"\s*\n(.*?)(?=\n##|\Z)"
    m = re.search(pattern, block, re.DOTALL | re.IGNORECASE)
    return clean(m.group(1)) if m else ""


def bullet_list(text_block):
    items = []
    for l in text_block.splitlines():
        s = l.strip()
        if s.startswith(("-", "*")) and len(s) > 1:
            items.append(s.lstrip("-*• \t").strip())
    return [i for i in items if i]


def score_val(block, criterion):
    pattern = r"\|\s*" + re.escape(criterion) + r"\s*\|\s*(\d+)/10\s*\|"
    m = re.search(pattern, block, re.IGNORECASE)
    return int(m.group(1)) if m else None


def extract_scores(block):
    criteria = [
        "Innovation", "Impact", "Technical Feasibility",
        "Prototype Feasibility", "Differentiation",
        "Technical Depth", "Overall Opportunity"
    ]
    return {c: score_val(block, c) for c in criteria}


def extract_feasibility(block):
    section = section_text(block, "Feasibility")
    tech = re.search(r"Technical feasibility:\s*\*\*(\d+)/10\*\*", section, re.IGNORECASE)
    hw = re.search(r"Hardware feasibility:\s*\*\*(.*?)\*\*", section, re.IGNORECASE)
    time_ = re.search(r"Time feasibility:\s*\*\*(.*?)\*\*", section, re.IGNORECASE)
    data = re.search(r"Data availability risk:\s*\*\*(.*?)\*\*", section, re.IGNORECASE)
    return {
        "technical": int(tech.group(1)) if tech else None,
        "hardware": clean(hw.group(1)) if hw else "",
        "time": clean(time_.group(1)) if time_ else "",
        "data_risk": clean(data.group(1)) if data else "",
    }


def extract_existing_solutions(block):
    section = section_text(block, "Existing Solutions")
    rows = re.findall(
        r"\|\s*([^|]+?)\s*\|\s*(?:Existing|Proposed)/technical\s*\|",
        section, re.IGNORECASE
    )
    return [clean(r) for r in rows if clean(r) and not clean(r).startswith("Solution")]


# ── split document into per-problem chunks ─────────────────────────────────
problem_pattern = re.compile(r"^# (SIH26\d{3})\s*[—-]+\s*(.+)$", re.MULTILINE)
matches = list(problem_pattern.finditer(text))
print(f"[PARSER] Found {len(matches)} problem headers in the document.")

problems = []

for i, m in enumerate(matches):
    pid = m.group(1).strip()
    title = m.group(2).strip()
    start = m.start()
    end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
    block = text[start:end]

    org = table_val(block, "Organization")
    dept = table_val(block, "Department")
    category = table_val(block, "Official Category")
    theme = table_val(block, "Official Theme")
    hw_off = table_val(block, "Hardware")
    sw_off = table_val(block, "Software")

    res_cats = bullet_list(section_text(block, "Research-Derived Categories"))
    tech_opps = bullet_list(section_text(block, "Technology Opportunities"))
    quick_verdict = clean(section_text(block, "Quick Verdict"))
    scores = extract_scores(block)
    feasibility = extract_feasibility(block)
    existing_sols = extract_existing_solutions(block)
    risks = bullet_list(section_text(block, "Risks"))
    gap_text = section_text(block, "Gap Analysis")
    sol_dir_text = section_text(block, "Proposed Solution Direction")
    interp_text = section_text(block, "Problem Interpretation")

    # Clean summary
    summary = re.sub(r"\*\*INFERENCE:\*\*\s*", "", interp_text)
    summary = re.sub(r"\*\*PROPOSED IDEA:\*\*\s*", "", summary)
    summary = " ".join(summary.split())[:300]

    p = {
        "id": pid,
        "title": title,
        "organization": org,
        "department": dept,
        "category": category,
        "theme": theme,
        "research_categories": res_cats,
        "technology_opportunities": tech_opps,
        "existing_solutions": existing_sols,
        "feasibility": feasibility,
        "scores": scores,
        "risks": risks,
        "gap_analysis": gap_text,
        "solution_direction": sol_dir_text,
        "quick_verdict": quick_verdict,
        "summary": summary,
        "hardware_official": hw_off,
        "software_official": sw_off,
    }
    problems.append(p)

# ── validation ─────────────────────────────────────────────────────────────
ids = [p["id"] for p in problems]
unique_ids = set(ids)
print(f"[PARSER] Total problems parsed:  {len(problems)}")
print(f"[PARSER] Unique IDs:            {len(unique_ids)}")
print(f"[PARSER] Duplicate IDs:         {len(ids) - len(unique_ids)}")

nums = sorted(int(i.replace("SIH26", "")) for i in unique_ids)
if nums:
    expected = set(range(nums[0], nums[-1] + 1))
    missing = expected - set(nums)
    if missing:
        print(f"[PARSER] Missing IDs:           {sorted(missing)}")
    else:
        print(f"[PARSER] ID range SIH26{nums[0]:03d}-SIH26{nums[-1]:03d} COMPLETE")

sw = sum(1 for p in problems if "software" in p["category"].lower())
hw = sum(1 for p in problems if "hardware" in p["category"].lower())
print(f"[PARSER] Software: {sw}  Hardware: {hw}  Total: {sw + hw}")

# ── write output ──────────────────────────────────────────────────────────
out_path = os.path.join(OUT_DIR, "sih_2026_problems.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump({"total": len(problems), "problems": problems}, f,
              ensure_ascii=False, indent=2)

print(f"[PARSER] Written: {out_path}")
print("[PARSER] Done.")

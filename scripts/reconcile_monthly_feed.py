#!/usr/bin/env python3
"""
scripts/reconcile_monthly_feed.py
Generates an audit report (issue_body.md) for human verification
without mutating repository files in src/.
"""

import sys
import re
from pathlib import Path
import pandas as pd

PQ_MAP = {
    "off-white to white": "OW-W",
    "white": "W",
    "off-white": "OW",
    "cream to off-white": "CR-OW",
    "cream": "CR",
}

SRC_FILES = [
    ("A-C.csv", ["a", "b", "c", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]),
    ("D-F.csv", ["d", "e", "f"]),
    ("G-I.csv", ["g", "h", "i"]),
    ("J-L.csv", ["j", "k", "l"]),
    ("M-O.csv", ["m", "n", "o"]),
    ("P-R.csv", ["p", "q", "r"]),
    ("S-U.csv", ["s", "t", "u"]),
    ("V-Z.csv", ["v", "w", "x", "y", "z"]),
]

EXPECTED_COLUMNS = [
    "Title",
    "Issue",
    "CGC/CBCS Numeric Grade",
    "Certification ID",
    "Page Quality",
    "Realized Sales Price",
    "Auction House Tracking ID",
    "Scan Date"
]

def clean_title(title: str) -> str:
    if pd.isna(title):
        return ""
    t = str(title).lower().strip()
    t = re.sub(r'^(the|a|an)\s+', '', t)
    t = re.sub(r'[^a-z0-9\s]', '', t)
    return re.sub(r'\s+', ' ', t).strip()

def clean_issue(issue) -> str:
    if pd.isna(issue):
        return ""
    clean = str(issue).strip().lstrip("#")
    try:
        val = float(clean)
        return str(int(val)) if val.is_integer() else str(val)
    except ValueError:
        return clean.lower()

def format_grade(grade) -> str:
    if pd.isna(grade) or str(grade).strip().lower() in ["unknown", "nan", ""]:
        return ""
    try:
        val = float(grade)
        return str(int(val)) if val.is_integer() else str(val)
    except ValueError:
        return str(grade).strip()

def map_page_quality(pq: str) -> str:
    if pd.isna(pq) or str(pq).strip().lower() in ["unknown", "nan", ""]:
        return ""
    key = str(pq).strip().lower()
    return PQ_MAP.get(key, str(pq).strip())

def get_target_src_file(title: str) -> str:
    cleaned = clean_title(title)
    if not cleaned:
        return "A-C.csv"
    first_char = cleaned[0]
    for filename, chars in SRC_FILES:
        if first_char in chars:
            return filename
    return "A-C.csv"

def load_incoming_feed(feed_path: Path) -> pd.DataFrame:
    df = pd.read_csv(feed_path, header=None, dtype=str)
    first_cell = str(df.iloc[0, 0]).strip().lower()
    if first_cell == "title":
        df = df.iloc[1:].reset_index(drop=True)

    if df.shape[1] >= len(EXPECTED_COLUMNS):
        df = df.iloc[:, :len(EXPECTED_COLUMNS)]
        df.columns = EXPECTED_COLUMNS
    else:
        df.columns = EXPECTED_COLUMNS[:df.shape[1]]

    df = df[df["Title"].fillna("").astype(str).str.strip().str.lower() != "title"]
    df = df[df["Issue"].fillna("").astype(str).str.strip().str.lower() != "issue"]
    df = df.dropna(subset=["Title", "Issue"]).reset_index(drop=True)
    return df

def generate_report():
    feed_path = Path("data/church_pedigree_live_feed.csv")
    src_dir = Path("src")

    if not feed_path.exists():
        print(f"Staging file {feed_path} not found. Exiting.")
        sys.exit(0)

    print(f"Reading incoming feed: {feed_path}")
    df_feed = load_incoming_feed(feed_path)
    print(f"Loaded {len(df_feed)} incoming records.")

    updates = []
    additions = []

    # Map across all 8 src files
    for filename, _ in SRC_FILES:
        csv_file = src_dir / filename
        if not csv_file.exists():
            continue

        df_target = pd.read_csv(csv_file, dtype=str)
        issue_col = "Issue #" if "Issue #" in df_target.columns else "Issue"

        df_target["_k_title"] = df_target["Title"].apply(clean_title)
        df_target["_k_issue"] = df_target[issue_col].apply(clean_issue)

        file_feed = df_feed[df_feed["Title"].apply(get_target_src_file) == filename].copy()
        if file_feed.empty:
            continue

        file_feed["_k_title"] = file_feed["Title"].apply(clean_title)
        file_feed["_k_issue"] = file_feed["Issue"].apply(clean_issue)

        target_map = {
            (row["_k_title"], row["_k_issue"]): idx
            for idx, row in df_target.iterrows()
        }

        for _, frow in file_feed.iterrows():
            key = (frow["_k_title"], frow["_k_issue"])
            incoming_grade = format_grade(frow.get("CGC/CBCS Numeric Grade"))
            incoming_pq = map_page_quality(frow.get("Page Quality"))
            cert_id = frow.get("Certification ID", "Unknown")
            price = frow.get("Realized Sales Price", "Unknown")
            source = frow.get("Auction House Tracking ID", "Unknown")
            title = frow["Title"]
            issue = frow["Issue"]

            entry = {
                "title": title,
                "issue": issue,
                "grade": incoming_grade,
                "pq": incoming_pq,
                "cert": cert_id,
                "price": price,
                "source": source,
                "target_file": filename,
            }

            if key in target_map:
                idx = target_map[key]
                current_grade = df_target.at[idx, "CGC Grade"]
                current_pq = df_target.at[idx, "Page Quality"]
                
                # Check if this record offers a new grade or page quality
                grade_diff = incoming_grade and (pd.isna(current_grade) or str(current_grade).strip() == "")
                pq_diff = incoming_pq and (pd.isna(current_pq) or str(current_pq).strip() == "")

                if grade_diff or pq_diff:
                    entry["current_grade"] = current_grade if pd.notna(current_grade) else "None"
                    entry["current_pq"] = current_pq if pd.notna(current_pq) else "None"
                    updates.append(entry)
            else:
                additions.append(entry)

    # Build Markdown Issue Body
    report = []
    report.append("### Monthly Edgar Church Ingestion Verification\n")
    report.append(f"**Total Records Evaluated:** {len(df_feed)}  ")
    report.append(f"**Census Updates Detected:** {len(updates)}  ")
    report.append(f"**Potential New Additions:** {len(additions)}\n")
    report.append("> Check the auction source links and certs below before manually committing updates to `src/`.\n")

    if updates:
        report.append("### Updates to Existing Issues\n")
        for u in updates:
            report.append(f"- [ ] `{u['title']} #{u['issue']}` (`src/{u['target_file']}`)")
            report.append(f"  - **Incoming:** Grade `{u['grade']}`, PQ `{u['pq']}` | **Current:** Grade `{u['current_grade']}`, PQ `{u['current_pq']}`")
            report.append(f"  - **Cert ID:** `{u['cert']}` | **Price:** `{u['price']}`")
            report.append(f"  - **Source / Lot:** {u['source']}\n")

    if additions:
        report.append("### Potential New Additions (Not Currently in `src/`)\n")
        for a in additions:
            report.append(f"- [ ] `{a['title']} #{a['issue']}` (Target: `src/{a['target_file']}`)")
            report.append(f"  - **Grade:** `{a['grade']}` | **PQ:** `{a['pq']}` | **Cert ID:** `{a['cert']}`")
            report.append(f"  - **Price:** `{a['price']}`")
            report.append(f"  - **Source / Lot:** {a['source']}\n")

    out_file = Path("issue_body.md")
    out_file.write_text("\n".join(report))
    print(f"Report generated at {out_file}.")

    # Clean up staging file
    feed_path.unlink()
    print("Staging file cleaned up.")

if __name__ == "__main__":
    generate_report()

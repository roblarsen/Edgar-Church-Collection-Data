#!/usr/bin/env python3
"""
scripts/reconcile_monthly_feed.py
Reconciles church_pedigree_live_feed.csv directly into src/[A-Z]-[A-Z].csv
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

def reconcile():
    feed_path = Path("data/church_pedigree_live_feed.csv")
    src_dir = Path("src")

    if not feed_path.exists():
        print(f"Staging file {feed_path} not found. Exiting.")
        sys.exit(0)

    print(f"Reading incoming feed: {feed_path}")
    df_feed = pd.read_csv(feed_path, dtype=str)
    total_feed = len(df_feed)

    summary_updates = []
    summary_inserts = []

    for filename, _ in SRC_FILES:
        csv_file = src_dir / filename
        if not csv_file.exists():
            continue

        # Load all columns as strings to prevent Pandas type conflicts
        df_target = pd.read_csv(csv_file, dtype=str)
        issue_col = "Issue #" if "Issue #" in df_target.columns else "Issue"

        df_target["_k_title"] = df_target["Title"].apply(clean_title)
        df_target["_k_issue"] = df_target[issue_col].apply(clean_issue)

        file_feed = df_feed[df_feed["Title"].apply(get_target_src_file) == filename].copy()
        if file_feed.empty:
            df_target.drop(columns=["_k_title", "_k_issue"]).to_csv(csv_file, index=False)
            continue

        file_feed["_k_title"] = file_feed["Title"].apply(clean_title)
        file_feed["_k_issue"] = file_feed["Issue"].apply(clean_issue)

        target_map = {
            (row["_k_title"], row["_k_issue"]): idx
            for idx, row in df_target.iterrows()
        }

        new_rows = []

        for _, frow in file_feed.iterrows():
            key = (frow["_k_title"], frow["_k_issue"])
            incoming_grade = format_grade(frow.get("CGC/CBCS Numeric Grade"))
            incoming_pq = map_page_quality(frow.get("Page Quality"))

            if key in target_map:
                idx = target_map[key]
                current_grade = df_target.at[idx, "CGC Grade"]
                current_pq = df_target.at[idx, "Page Quality"]

                updated = False
                if incoming_grade and (pd.isna(current_grade) or str(current_grade).strip() == ""):
                    df_target.at[idx, "CGC Grade"] = incoming_grade
                    updated = True

                if incoming_pq and (pd.isna(current_pq) or str(current_pq).strip() == ""):
                    df_target.at[idx, "Page Quality"] = incoming_pq
                    updated = True

                if updated:
                    summary_updates.append(f"{frow['Title']} #{frow['Issue']} -> Grade: {incoming_grade}, PQ: {incoming_pq} ({filename})")
            else:
                new_row = {col: "" for col in df_target.columns if not col.startswith("_k_")}
                new_row["Title"] = str(frow["Title"]).lower()
                new_row[issue_col] = str(frow["Issue"])
                new_row["CGC Grade"] = incoming_grade
                new_row["Page Quality"] = incoming_pq
                new_rows.append(new_row)
                summary_inserts.append(f"{frow['Title']} #{frow['Issue']} -> Grade: {incoming_grade} ({filename})")

        df_target = df_target.drop(columns=["_k_title", "_k_issue"])

        if new_rows:
            df_new = pd.DataFrame(new_rows)
            df_target = pd.concat([df_target, df_new], ignore_index=True)

        df_target.to_csv(csv_file, index=False)
        print(f"Processed {filename}: {len(file_feed)} candidates evaluated.")

    # Write summary for the PR body
    summary_md = "### Monthly Reconciliation Summary\n"
    summary_md += f"- **Total Incoming Records Evaluated:** {total_feed}\n"
    summary_md += f"- **Existing Census Entries Updated:** {len(summary_updates)}\n"
    summary_md += f"- **New Entries Inserted:** {len(summary_inserts)}\n\n"
    if summary_updates:
        summary_md += "#### Updated Records\n" + "\n".join(f"- {u}" for u in summary_updates[:25]) + "\n\n"
    if summary_inserts:
        summary_md += "#### New Census Additions\n" + "\n".join(f"- {i}" for i in summary_inserts[:25]) + "\n"

    Path("reconcile_summary.md").write_text(summary_md)
    print("Reconciliation complete. Summary generated.")

    feed_path.unlink()
    print("Cleaned up staging file.")

if __name__ == "__main__":
    reconcile()

#!/usr/bin/env python3
"""
scripts/reconcile_monthly_feed.py
Reconciles incoming Church pedigree live feed data into the repo's master census.
"""

from pathlib import Path
import sys
import pandas as pd

def normalize_val(val):
    if pd.isna(val) or str(val).strip().lower() in ["unknown", "nan", ""]:
        return None
    return str(val).strip()

def normalize_issue(issue):
    if pd.isna(issue):
        return ""
    clean = str(issue).strip().lstrip("#")
    try:
        val = float(clean)
        return str(int(val)) if val.is_integer() else str(val)
    except ValueError:
        return clean

def reconcile():
    feed_path = Path("data/church_pedigree_live_feed.csv")
    # Path to your master dataset in the repo
    master_path = Path("data/church_pedigree_master.csv")

    if not feed_path.exists():
        print(f"No staging feed found at {feed_path}. Nothing to reconcile.")
        sys.exit(0)

    print(f"Loading incoming feed: {feed_path}")
    df_feed = pd.read_csv(feed_path)

    if master_path.exists():
        df_master = pd.read_csv(master_path)
    else:
        df_master = pd.DataFrame(columns=df_feed.columns)

    # Composite matching keys
    df_master["_k_title"] = df_master["Title"].fillna("").astype(str).str.lower().str.strip()
    df_master["_k_issue"] = df_master["Issue"].apply(normalize_issue)

    df_feed["_k_title"] = df_feed["Title"].fillna("").astype(str).str.lower().str.strip()
    df_feed["_k_issue"] = df_feed["Issue"].apply(normalize_issue)

    master_indices = {
        (row["_k_title"], row["_k_issue"]): idx
        for idx, row in df_master.iterrows()
    }

    new_rows = []
    updated_fields = 0

    fields_to_update = [
        "CGC/CBCS Numeric Grade",
        "Certification ID",
        "Page Quality",
        "Realized Sales Price",
        "Auction House Tracking ID"
    ]

    for _, row in df_feed.iterrows():
        key = (row["_k_title"], row["_k_issue"])
        if key in master_indices:
            idx = master_indices[key]
            for col in fields_to_update:
                if col in df_master.columns and col in df_feed.columns:
                    incoming = normalize_val(row[col])
                    existing = normalize_val(df_master.at[idx, col])
                    if incoming and not existing:
                        df_master.at[idx, col] = incoming
                        updated_fields += 1
        else:
            clean_entry = row.drop(labels=["_k_title", "_k_issue"]).to_dict()
            new_rows.append(clean_entry)

    if new_rows:
        df_new = pd.DataFrame(new_rows)
        df_master = df_master.drop(columns=["_k_title", "_k_issue"])
        df_master = pd.concat([df_master, df_new], ignore_index=True)
    else:
        df_master = df_master.drop(columns=["_k_title", "_k_issue"])

    df_master = df_master.sort_values(by=["Title", "Issue"]).reset_index(drop=True)

    master_path.parent.mkdir(parents=True, exist_ok=True)
    df_master.to_csv(master_path, index=False)
    print(f"Reconciliation complete: {len(new_rows)} rows added, {updated_fields} fields updated.")

    # Remove the staging file so it isn't committed in the PR
    feed_path.unlink()
    print(f"Cleaned up staging file: {feed_path}")

if __name__ == "__main__":
    reconcile()

#!/usr/bin/env python3
"""
scripts/reconcile_monthly_feed.py
Generates an audit report (issue_body.md) for human verification
with clickable auction and certification URLs, leaving src/ clean.
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

def format_source_link(source_str: str) -> str:
    if not source_str or str(source_str).strip().lower() in ["unknown", "nan", ""]:
        return "Unknown"
    
    s = str(source_str).strip()

    # Full Heritage match: Lot <num> (Auction <num> ...)
    ha_full = list(re.finditer(r'Lot\s+(\d+)\s*\(\s*Auction\s+(\d+)[^)]*\)', s, flags=re.IGNORECASE))
    if ha_full:
        res = s
        for m in ha_full:
            lot_num = m.group(1)
            auction_num = m.group(2)
            url = f"https

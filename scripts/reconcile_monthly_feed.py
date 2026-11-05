def format_source_link(source_str: str) -> str:
    if not source_str or str(source_str).strip().lower() in ["unknown", "nan", ""]:
        return "Unknown"
    
    s = str(source_str).strip()

    # 1. Full Heritage match: Lot <num> (Auction <num> ...)
    ha_full = list(re.finditer(r'Lot\s+(\d+)\s*\(\s*Auction\s+(\d+)[^)]*\)', s, flags=re.IGNORECASE))
    if ha_full:
        res = s
        for m in ha_full:
            lot_num = m.group(1)
            auction_num = m.group(2)
            url = f"https://comics.ha.com/itm/x/x/p/{auction_num}-{lot_num}.s"
            res = res.replace(m.group(0), f"[{m.group(0)}]({url})")
        return res

    # 2. Heritage lot-only match: Lot <num>
    if "heritage" in s.lower():
        ha_lots = list(re.finditer(r'Lot\s+(\d+)', s, flags=re.IGNORECASE))
        if ha_lots:
            res = s
            for m in ha_lots:
                lot_num = m.group(1)
                url = f"https://comics.ha.com/c/search-results.zx?N=0+790+231&Ntt={lot_num}"
                res = res.replace(m.group(0), f"[{m.group(0)}]({url})")
            return res

    # 3. CGC Pedigree Thread references
    if "cgc" in s.lower() and "thread" in s.lower():
        return f"[{s}](https://boards.cgccomics.com/topic/101897-edgar-church-pedigree-thread/)"

    return s

def format_cert_link(cert_str: str) -> str:
    if not cert_str or str(cert_str).strip().lower() in ["unknown", "nan", ""]:
        return "Unknown"
    cert = re.sub(r'\D', '', str(cert_str))
    if len(cert) >= 7:
        return f"[{cert}](https://www.cgccomics.com/certlookup/{cert}/)"
    return str(cert_str).strip()

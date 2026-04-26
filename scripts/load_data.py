#!/usr/bin/env python3
"""Load JSON exports into local Supabase via PostgREST (service role)."""
import os, json, pathlib, urllib.request, urllib.error, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = pathlib.Path(os.environ.get("DATA_DIR", ROOT / "data"))
TABLES_DIR = DATA / "tables"

API = os.environ["LOCAL_SUPABASE_URL"].rstrip("/")
KEY = os.environ["LOCAL_SERVICE_KEY"]

HDR = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal,missing=default",
}

LOAD_ORDER = [
    # Independent first (no FKs from other tables loaded later)
    "menu", "countries", "categories", "pages", "posts", "eventpages",
    "accordions", "accordion_items",
    "carousels", "carousel_items",
    "locations", "addresses", "organisations",
    "rooms", "beds", "accommodation_offerings", "accommodation_prices", "room_ao",
    "team_members", "stake_links", "progressbar", "page_images",
    "public_profiles", "profiles", "profilepages",
    "identifications", "identities",
    "subscribers",
    "role_permissions", "user_roles",
    # Junction tables last
    "page_category", "page_post", "page_accordion", "page_carousel",
    "category_post", "category_accordion", "category_carousel",
    "post_accordion", "post_carousel",
]

errs = 0
ok = 0
for table in LOAD_ORDER:
    f = TABLES_DIR / f"{table}.json"
    if not f.exists():
        print(f"[skip] {table}: no file")
        continue
    rows = json.loads(f.read_text())
    if not rows:
        print(f"[empty] {table}")
        continue
    # Bulk insert
    body = json.dumps(rows).encode()
    url = f"{API}/rest/v1/{table}"
    req = urllib.request.Request(url, data=body, headers=HDR, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            r.read()
        print(f"[ok]   {table}: {len(rows)} rows")
        ok += 1
    except urllib.error.HTTPError as e:
        msg = e.read().decode(errors="ignore")[:400]
        print(f"[FAIL] {table} ({e.code}): {msg}")
        errs += 1

print(f"\nDone: {ok} loaded, {errs} failed")
sys.exit(0 if errs == 0 else 1)

#!/usr/bin/env python3
"""
Commons Hub Supabase export.
Pulls all public tables + views via PostgREST (anon key) and downloads every
image from the website-images storage bucket to data/images/.

Secrets are fetched from Infisical at runtime (commons-hub project, dev env)
using the admin identity stored in ~/.secrets/.
"""
import os, sys, json, pathlib, urllib.request, urllib.parse, urllib.error, time

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
TABLES_DIR = DATA / "tables"
VIEWS_DIR = DATA / "views"
IMG_DIR = DATA / "images"
for d in (TABLES_DIR, VIEWS_DIR, IMG_DIR):
    d.mkdir(parents=True, exist_ok=True)

TABLES = ['accommodation_offerings', 'accommodation_prices', 'accordion_items', 'accordions', 'addresses', 'beds', 'carousel_items', 'carousels', 'categories', 'category_accordion', 'category_carousel', 'category_post', 'countries', 'eventpages', 'identifications', 'identities', 'locations', 'menu', 'organisations', 'page_accordion', 'page_carousel', 'page_category', 'page_images', 'page_post', 'pages', 'post_accordion', 'post_carousel', 'posts', 'profilepages', 'profiles', 'progressbar', 'public_profiles', 'role_permissions', 'room_ao', 'rooms', 'stake_links', 'subscribers', 'team_members', 'user_roles']
VIEWS  = ['carousel_items_with_images', 'homepage_with_related_data', 'page_with_related_data', 'user_roles_view', 'website_images']

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]
BUCKET = "website-images"

HDR = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Accept": "application/json",
    "Accept-Encoding": "identity",
}

def fetch_all(table: str, is_view: bool = False):
    """Page through PostgREST with Range headers."""
    out = []
    PAGE = 1000
    start = 0
    while True:
        url = f"{SUPABASE_URL}/rest/v1/{table}?select=*&order=id"
        # some tables don't have `id` — fall back
        req = urllib.request.Request(url, headers={**HDR,
            "Range-Unit": "items",
            "Range": f"{start}-{start+PAGE-1}",
            "Prefer": "count=exact",
        })
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                body = r.read().decode()
                rows = json.loads(body)
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="ignore")[:200]
            # retry without order by id
            if "column" in msg and "does not exist" in msg and start == 0:
                url2 = f"{SUPABASE_URL}/rest/v1/{table}?select=*"
                req2 = urllib.request.Request(url2, headers={**HDR})
                try:
                    with urllib.request.urlopen(req2, timeout=30) as r2:
                        return json.loads(r2.read().decode())
                except urllib.error.HTTPError as e2:
                    print(f"  [HTTP {e2.code}] {table}: {e2.read().decode(errors='ignore')[:160]}")
                    return None
            print(f"  [HTTP {e.code}] {table}: {msg}")
            return None
        except Exception as e:
            print(f"  [ERR] {table}: {e}")
            return None
        out.extend(rows)
        if len(rows) < PAGE: break
        start += PAGE
    return out

def export_all():
    summary = {"tables": {}, "views": {}}
    for name in TABLES:
        print(f"[table] {name} ...", end=" ", flush=True)
        rows = fetch_all(name)
        if rows is None:
            summary["tables"][name] = {"status": "error"}
            print("skip")
            continue
        p = TABLES_DIR / f"{name}.json"
        p.write_text(json.dumps(rows, indent=2, default=str))
        summary["tables"][name] = {"rows": len(rows), "file": str(p.relative_to(ROOT))}
        print(f"{len(rows)} rows")
    for name in VIEWS:
        print(f"[view]  {name} ...", end=" ", flush=True)
        rows = fetch_all(name, is_view=True)
        if rows is None:
            summary["views"][name] = {"status": "error"}
            print("skip")
            continue
        p = VIEWS_DIR / f"{name}.json"
        p.write_text(json.dumps(rows, indent=2, default=str))
        summary["views"][name] = {"rows": len(rows), "file": str(p.relative_to(ROOT))}
        print(f"{len(rows)} rows")
    return summary

def download_images(summary):
    """Pull every object from website-images bucket.
    Use the storage list API to enumerate, fall back to website_images view names."""
    # Try Storage API first (POST /storage/v1/object/list/<bucket>)
    names = set()
    url = f"{SUPABASE_URL}/storage/v1/object/list/{BUCKET}"
    body = json.dumps({"prefix": "", "limit": 1000, "offset": 0, "sortBy": {"column": "name", "order": "asc"}}).encode()
    try:
        req = urllib.request.Request(url, data=body, method="POST",
            headers={**HDR, "Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=30) as r:
            items = json.loads(r.read().decode())
        for it in items:
            if it.get("name"): names.add(it["name"])
        print(f"[storage] list: {len(names)} objects")
    except Exception as e:
        print(f"[storage] list failed ({e}); falling back to website_images view")

    # Fallback / supplement: names from website_images view
    wi_path = VIEWS_DIR / "website_images.json"
    if wi_path.exists():
        for row in json.loads(wi_path.read_text()):
            n = row.get("name")
            if n: names.add(n)

    print(f"[storage] total unique names: {len(names)}")
    ok, err = 0, 0
    for i, name in enumerate(sorted(names), 1):
        dst = IMG_DIR / name
        if dst.exists() and dst.stat().st_size > 0:
            ok += 1
            continue
        u = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{urllib.parse.quote(name)}"
        try:
            req = urllib.request.Request(u, headers={"User-Agent": "commons-hub-export"})
            with urllib.request.urlopen(req, timeout=60) as r:
                dst.write_bytes(r.read())
            ok += 1
        except Exception as e:
            err += 1
            print(f"  [img fail] {name}: {e}")
        if i % 25 == 0:
            print(f"  ...{i}/{len(names)}")
    print(f"[storage] downloaded: {ok} ok, {err} errors")
    summary["storage"] = {"bucket": BUCKET, "ok": ok, "err": err, "total_unique_names": len(names)}

if __name__ == "__main__":
    summary = export_all()
    download_images(summary)
    (DATA / "_export_summary.json").write_text(json.dumps(summary, indent=2))
    print("\nDone.")
    print(f"Summary: {DATA / '_export_summary.json'}")

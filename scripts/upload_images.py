#!/usr/bin/env python3
"""Create website-images bucket (public) and upload all exported images."""
import os, json, pathlib, mimetypes, urllib.request, urllib.error, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = pathlib.Path(os.environ.get("DATA_DIR", ROOT / "data"))
IMG_DIR = DATA / "images"
VIEWS_DIR = DATA / "views"

API = os.environ["LOCAL_SUPABASE_URL"].rstrip("/")
KEY = os.environ["LOCAL_SERVICE_KEY"]
BUCKET = "website-images"

HDR_JSON = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
}

def post_json(path, payload):
    req = urllib.request.Request(
        f"{API}{path}", data=json.dumps(payload).encode(),
        headers=HDR_JSON, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode(errors="ignore")

# Create bucket (public)
status, body = post_json("/storage/v1/bucket", {
    "id": BUCKET, "name": BUCKET, "public": True,
    "file_size_limit": 52428800,
})
print(f"[bucket] create {BUCKET}: {status} {body[:160]}")

# Upload images. If original UUIDs matter, use them as storage path.
# Pre-fetch website_images view data to map filename → UUID so storage.objects.id = view's id.
wi = json.loads((VIEWS_DIR / "website_images.json").read_text())
name_to_id = {r["name"]: r["id"] for r in wi}
name_to_mime = {r["name"]: r["mime_type"] for r in wi}

files = sorted(IMG_DIR.iterdir())
ok, err = 0, 0
for i, f in enumerate(files, 1):
    if not f.is_file(): continue
    name = f.name
    mime = name_to_mime.get(name) or mimetypes.guess_type(name)[0] or "application/octet-stream"
    data = f.read_bytes()
    url = f"{API}/storage/v1/object/{BUCKET}/{name}"
    req = urllib.request.Request(url, data=data, method="POST", headers={
        "apikey": KEY,
        "Authorization": f"Bearer {KEY}",
        "Content-Type": mime,
        "x-upsert": "true",
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            r.read()
        ok += 1
    except urllib.error.HTTPError as e:
        msg = e.read().decode(errors="ignore")[:200]
        print(f"[upload fail] {name} ({e.code}): {msg}")
        err += 1
    if i % 25 == 0:
        print(f"  {i}/{len(files)}")

print(f"\nDone: {ok} uploaded, {err} failed, bucket={BUCKET}")

#!/usr/bin/env python3
"""
Register O2M alias fields + relation metadata for content tables in Directus.

Directus auto-discovers tables (collections) and FK constraints (M2O relations)
at schema-introspection time, but to support nested fetches like
`?fields=*,carousel_items.*` it also needs:

  1. An alias field on the *parent* collection (`POST /fields/<parent>` with
     type='alias' / special=['o2m']).
  2. A row in `directus_relations` linking the FK to that alias's `one_field`.
     Directus blocks `POST /relations` when the FK is already auto-detected,
     so we INSERT directly into directus_relations (the table is a plain
     metadata table — no triggers).

Idempotent: skips alias fields and relation rows that already exist.

Env:
  DIRECTUS_URL                 default https://admin.commons-hub.at
  DIRECTUS_ADMIN_EMAIL         required
  DIRECTUS_ADMIN_PASSWORD      required
  DRY_RUN                      if "1", print actions without executing
"""

from __future__ import annotations

import os
import sys
import json
from typing import Any

import requests

DIRECTUS_URL = os.environ.get("DIRECTUS_URL", "https://admin.commons-hub.at").rstrip("/")
EMAIL = os.environ.get("DIRECTUS_ADMIN_EMAIL")
PASSWORD = os.environ.get("DIRECTUS_ADMIN_PASSWORD")
DRY_RUN = os.environ.get("DRY_RUN") == "1"

# Each tuple registers the FK as a Directus O2M:
#   (child_collection, fk_column, parent_collection, parent_alias_field)
#
# After registration, you can query:
#   GET /items/<parent_collection>?fields=*,<parent_alias_field>.*
#
# parent_alias_field names match the join-table names where the site code
# already expects them (e.g. pages.page_carousel) so existing call sites
# can stay 1:1.
RELATIONS: list[tuple[str, str, str, str]] = [
    # Direct content owns
    ("accordion_items",    "accordion_id", "accordions",  "accordion_items"),
    ("carousel_items",     "carousel_id",  "carousels",   "carousel_items"),
    # Page join tables
    ("page_accordion",     "accordion_id", "accordions",  "page_accordion"),
    ("page_accordion",     "page_id",      "pages",       "page_accordion"),
    ("page_carousel",      "carousel_id",  "carousels",   "page_carousel"),
    ("page_carousel",      "page_id",      "pages",       "page_carousel"),
    ("page_category",      "category_id",  "categories",  "page_category"),
    ("page_category",      "page_id",      "pages",       "page_category"),
    ("page_post",          "page_id",      "pages",       "page_post"),
    ("page_post",          "post_id",      "posts",       "page_post"),
    # Category join tables
    ("category_accordion", "accordion_id", "accordions",  "category_accordion"),
    ("category_accordion", "category_id",  "categories",  "category_accordion"),
    ("category_carousel",  "carousel_id",  "carousels",   "category_carousel"),
    ("category_carousel",  "category_id",  "categories",  "category_carousel"),
    ("category_post",      "category_id",  "categories",  "category_post"),
    ("category_post",      "post_id",      "posts",       "category_post"),
    # Post join tables
    ("post_accordion",     "accordion_id", "accordions",  "post_accordion"),
    ("post_accordion",     "post_id",      "posts",       "post_accordion"),
    ("post_carousel",      "carousel_id",  "carousels",   "post_carousel"),
    ("post_carousel",      "post_id",      "posts",       "post_carousel"),
    # Singletons
    ("menu",               "page_id",      "pages",       "menu_entries"),
]


def psql(sql: str) -> str:
    """Run a SQL statement against the directus DB on netcup and return stdout."""
    import subprocess
    # ssh passes everything after the host as a single shell command,
    # so we build a single string and quote the SQL inside it.
    quoted = sql.replace("'", "'\\''")
    remote = (
        "docker exec -i commons-hub-directus-db "
        "psql -U postgres -d directus -At -c '" + quoted + "'"
    )
    return subprocess.check_output(["ssh", "netcup-full", remote], text=True)


def login() -> str:
    if not (EMAIL and PASSWORD):
        sys.exit("DIRECTUS_ADMIN_EMAIL and DIRECTUS_ADMIN_PASSWORD required")
    r = requests.post(
        f"{DIRECTUS_URL}/auth/login",
        json={"email": EMAIL, "password": PASSWORD, "mode": "json"},
        timeout=15,
    )
    r.raise_for_status()
    return r.json()["data"]["access_token"]


def existing_alias_fields(token: str, collection: str) -> set[str]:
    r = requests.get(
        f"{DIRECTUS_URL}/fields/{collection}",
        headers={"authorization": f"Bearer {token}"},
        timeout=15,
    )
    r.raise_for_status()
    return {row["field"] for row in r.json()["data"] if row.get("type") == "alias"}


def existing_relation_metas() -> set[tuple[str, str]]:
    out = psql("SELECT many_collection || '|' || many_field FROM directus_relations;")
    pairs = set()
    for line in out.strip().splitlines():
        if "|" in line:
            many, field = line.split("|", 1)
            pairs.add((many, field))
    return pairs


def register_o2m_field(token: str, parent: str, alias: str) -> None:
    payload = {
        "field": alias,
        "type": "alias",
        "meta": {
            "special": ["o2m"],
            "interface": "list-o2m",
            "options": None,
            "display": None,
            "display_options": None,
            "hidden": False,
            "sort": None,
            "width": "full",
            "translations": None,
            "note": None,
            "conditions": None,
            "required": False,
            "group": None,
            "validation": None,
            "validation_message": None,
        },
        "schema": None,
    }
    if DRY_RUN:
        print(f"[dry] POST /fields/{parent} alias={alias}")
        return
    r = requests.post(
        f"{DIRECTUS_URL}/fields/{parent}",
        headers={"authorization": f"Bearer {token}"},
        json=payload,
        timeout=20,
    )
    if r.status_code >= 400:
        sys.exit(f"POST /fields/{parent} alias={alias} failed: {r.status_code} {r.text}")
    print(f"  alias  : {parent}.{alias}")


def register_relation_meta(many: str, field: str, one: str, one_field: str) -> None:
    """Insert into directus_relations directly. POST /relations is blocked when
    the FK already exists at the schema level, but the metadata row is
    independent."""
    sql = (
        f"INSERT INTO directus_relations (many_collection, many_field, one_collection, one_field) "
        f"VALUES ('{many}', '{field}', '{one}', '{one_field}');"
    )
    if DRY_RUN:
        print(f"[dry] INSERT {many}.{field} -> {one}.{one_field}")
        return
    psql(sql)
    print(f"  meta   : {many}.{field} -> {one}.{one_field}")


def main() -> None:
    print(f"Target: {DIRECTUS_URL}")
    print(f"Dry run: {DRY_RUN}\n")

    token = login()
    have_meta = existing_relation_metas()
    print(f"Existing relation meta rows: {len(have_meta)}\n")

    # Cache alias fields per parent to avoid one GET per relation.
    alias_cache: dict[str, set[str]] = {}

    for (many, field, one, alias) in RELATIONS:
        print(f"\n{many}.{field} -> {one}.{alias}")
        if (many, field) not in have_meta:
            register_relation_meta(many, field, one, alias)
        else:
            print(f"  meta   : already present")

        if one not in alias_cache:
            alias_cache[one] = existing_alias_fields(token, one)
        if alias not in alias_cache[one]:
            register_o2m_field(token, one, alias)
            alias_cache[one].add(alias)
        else:
            print(f"  alias  : already present")

    print("\nRestart Directus to flush schema cache, then verify nested fetch.")
    print("  ssh netcup-full docker restart commons-hub-directus")


if __name__ == "__main__":
    main()

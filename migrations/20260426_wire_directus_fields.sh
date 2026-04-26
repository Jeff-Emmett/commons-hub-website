#!/bin/bash
# Commons Hub: wire 14 image UUID columns to directus_files via Directus API.
# 2026-04-26
#
# Run after 20260426_directus_files_unification.sql. Creates one
# directus_relations row per field (M2O → directus_files, ON DELETE SET NULL)
# and patches each field's interface to file-image so editors get a picker.
#
# Idempotent: re-running on an already-wired field returns 400 from the
# relations endpoint but does not corrupt state.
#
# Env:
#   DIRECTUS_BASE  default https://commons-hub-admin.jeffemmett.com
#   DIRECTUS_TOKEN required (admin access token; obtain via POST /auth/login)

set -euo pipefail

BASE="${DIRECTUS_BASE:-https://commons-hub-admin.jeffemmett.com}"
TOKEN="${DIRECTUS_TOKEN:?must export DIRECTUS_TOKEN}"

FIELDS=(
  "accordion_items main_image"
  "categories      main_icon"
  "categories      main_image"
  "eventpages      main_icon"
  "eventpages      main_image"
  "pages           icon_id"
  "pages           image_id"
  "pages           main_icon"
  "pages           main_image"
  "posts           main_icon"
  "posts           main_image"
  "profilepages    main_icon"
  "profilepages    main_image"
  "stake_links     logo"
  "team_members    profile_image"
)

ok() { python3 -c "import sys,json;d=json.load(sys.stdin);print('OK' if 'data' in d else d)" ; }

for entry in "${FIELDS[@]}"; do
  set -- $entry
  COL=$1
  FLD=$2
  echo "=== $COL.$FLD ==="

  REL=$(curl -sX POST "$BASE/relations" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"collection\":\"$COL\",\"field\":\"$FLD\",\"related_collection\":\"directus_files\",\"schema\":{\"on_delete\":\"SET NULL\"},\"meta\":{\"sort_field\":null}}")
  echo "  rel:   $(echo "$REL" | ok)"

  PATCH=$(curl -sX PATCH "$BASE/fields/$COL/$FLD" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"meta":{"interface":"file-image","display":"image","special":["file"],"width":"full"}}')
  echo "  field: $(echo "$PATCH" | ok)"
done

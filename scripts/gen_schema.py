#!/usr/bin/env python3
"""Parse lib/database.types.ts → emit Postgres DDL.

Extracts enums + every table's Row block, maps TS types to SQL, writes schema.sql.
Views depend on tables existing, so we emit them at the end as SELECT * placeholders
(the app reads 5 views — we re-create them to mirror the real shape via introspection
later, but for now fall back to plain SELECT * FROM underlying table where possible).
"""
import re, json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TS = (ROOT / "lib" / "database.types.ts").read_text().splitlines()
OUT = ROOT / "data" / "schema.sql"

def find_block(start_line_pattern: str, start_index: int = 0):
    """Return (start_idx, end_idx) of a brace-matched block starting at line matching pattern."""
    for i in range(start_index, len(TS)):
        if re.match(start_line_pattern, TS[i]):
            open_i = i
            # Walk forward to find matching close
            depth = 0
            j = i
            while j < len(TS):
                depth += TS[j].count("{") - TS[j].count("}")
                if depth == 0 and j > i:
                    return open_i, j
                j += 1
    return None

def collect_section(section_name: str, schema_start_pattern: str = r"^  public: \{"):
    """Collect top-level keys within `schema_start.SECTION_NAME.{...}`."""
    # find schema start
    for i, line in enumerate(TS):
        if re.match(schema_start_pattern, line):
            schema_start = i
            break
    else:
        return {}
    # find `    SECTION_NAME: {`
    section_header = rf"^    {section_name}: \{{"
    for i in range(schema_start, len(TS)):
        if re.match(section_header, TS[i]):
            sect_start = i
            break
        if re.match(r"^  [a-z]", TS[i]) and i > schema_start:
            return {}  # next schema
    # walk the section body
    result = {}
    depth = 0
    cur_name = None
    cur_body_start = None
    for j in range(sect_start, len(TS)):
        depth += TS[j].count("{") - TS[j].count("}")
        if depth == 0 and j > sect_start:
            break
        # top-level entry of the section: 6 spaces indent
        m = re.match(r"^      ([a-zA-Z_][a-zA-Z0-9_]*): \{", TS[j])
        if m and cur_name is None:
            cur_name = m.group(1)
            cur_body_start = j
            cur_depth_at_start = depth - 1  # we just increased depth by 1 on this line
        elif cur_name and depth == cur_depth_at_start:
            # block ended on this line
            result[cur_name] = "\n".join(TS[cur_body_start:j+1])
            cur_name = None
    return result

# ---- Enums ---- (inline or multi-line continuation with `        |`)
enums = {}
in_public = False
in_enums = False
cur_name = None
cur_vals = []
for i, line in enumerate(TS):
    if re.match(r"^  public: \{", line):
        in_public = True
        continue
    if in_public and re.match(r"^  [a-z][a-z_]*: \{", line):
        # entered next schema
        break
    if in_public and re.match(r"^    Enums: \{", line):
        in_enums = True
        continue
    if in_enums:
        if re.match(r"^    \}", line):
            if cur_name and cur_vals: enums[cur_name] = cur_vals
            break
        m = re.match(r"^      ([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$", line)
        if m:
            # new enum starts — flush previous
            if cur_name and cur_vals: enums[cur_name] = cur_vals
            cur_name = m.group(1)
            cur_vals = re.findall(r'"([^"]+)"', m.group(2))
        else:
            # continuation line `        | "value"`
            cur_vals += re.findall(r'"([^"]+)"', line)
# flush final if no closing brace seen
if cur_name and cur_vals and cur_name not in enums: enums[cur_name] = cur_vals
print(f"enums: {list(enums.keys())}", file=sys.stderr)

# ---- Tables ----
tables_text = collect_section("Tables")
print(f"tables: {list(tables_text.keys())}", file=sys.stderr)

def parse_row(body: str):
    """Parse `Row: { col: type_expr }` subblock → list of (col, type_expr_raw, nullable)."""
    # Find the "Row: {" ... "}" inner body
    m = re.search(r"^        Row: \{$", body, re.MULTILINE)
    if not m: return []
    idx = m.end()
    remainder = body[idx:]
    # Walk to matching close
    depth = 1
    out_lines = []
    i = 0
    while i < len(remainder):
        if remainder[i] == '{': depth += 1
        elif remainder[i] == '}':
            depth -= 1
            if depth == 0: break
        i += 1
    inner = remainder[:i]
    cols = []
    for line in inner.splitlines():
        line = line.rstrip()
        if not line.strip(): continue
        m = re.match(r"^          ([a-zA-Z_][a-zA-Z0-9_]*)(\??): (.+)$", line)
        if not m: continue
        col, opt, type_expr = m.group(1), m.group(2), m.group(3)
        nullable = opt == "?" or "| null" in type_expr
        cols.append((col, type_expr.strip().rstrip(","), nullable))
    return cols

def ts_to_sql(col: str, type_expr: str, nullable: bool) -> str:
    te = type_expr.replace("| null", "").strip()
    # Enum ref: Database["public"]["Enums"]["name"]
    m = re.search(r'Database\["public"\]\["Enums"\]\["([a-zA-Z_][a-zA-Z0-9_]*)"\]', te)
    if m:
        sqltype = m.group(1)
    elif "Json" in te:
        sqltype = "JSONB[]" if te.endswith("[]") else "JSONB"
    elif te.endswith("[]"):
        base = te[:-2].strip()
        if base == "string": sqltype = "TEXT[]"
        elif base == "number": sqltype = "NUMERIC[]"
        elif base == "boolean": sqltype = "BOOLEAN[]"
        else: sqltype = "TEXT[]"
    elif te == "string":
        # Heuristic: uuid-named cols use UUID
        if col == "id" or col.endswith("_id") or col in ("main_image", "main_icon", "user_created", "user_updated", "profile_image", "logo"):
            sqltype = "UUID"
        elif col.endswith("_at") or col in ("created_at", "updated_at", "date_created", "date_updated"):
            sqltype = "TIMESTAMPTZ"
        elif col in ("StartDateTime", "EndDateTime"):
            sqltype = "TIMESTAMP"
        else:
            sqltype = "TEXT"
    elif te == "number":
        sqltype = "BIGINT" if col == "id" or col.endswith("_id") else "NUMERIC"
    elif te == "boolean":
        sqltype = "BOOLEAN"
    else:
        sqltype = "TEXT"
    # Primary key heuristic: id on base tables
    pk = " PRIMARY KEY" if col == "id" else ""
    null = "" if nullable else " NOT NULL"
    # Need to quote identifiers for CamelCase (StartDateTime)
    col_q = f'"{col}"' if col != col.lower() else col
    return f'  {col_q} {sqltype}{null}{pk}'

# Emit
out = []
out.append("-- Commons Hub — auto-generated schema from database.types.ts")
out.append("-- Drops existing public tables and recreates them.\n")
out.append("BEGIN;\n")

# Drop everything first (in public schema we control)
out.append("-- Drop tables + enums")
for name in reversed(list(tables_text.keys())):
    out.append(f'DROP TABLE IF EXISTS public."{name}" CASCADE;' if name != name.lower() else f"DROP TABLE IF EXISTS public.{name} CASCADE;")
out.append("")
for name in enums:
    out.append(f"DROP TYPE IF EXISTS public.{name} CASCADE;")
out.append("")

# Create enums
for name, vals in enums.items():
    vlist = ", ".join(f"'{v}'" for v in vals)
    out.append(f"CREATE TYPE public.{name} AS ENUM ({vlist});")
out.append("")

# Create tables
for name, body in tables_text.items():
    cols = parse_row(body)
    if not cols:
        print(f"warn: {name} no cols", file=sys.stderr)
        continue
    defs = [ts_to_sql(c, t, n) for (c, t, n) in cols]
    tname = f'public."{name}"' if name != name.lower() else f"public.{name}"
    out.append(f"CREATE TABLE {tname} (")
    out.append(",\n".join(defs))
    out.append(");\n")

# Grant to anon/authenticated so PostgREST can read via anon key
out.append("-- Grants for PostgREST roles (anon, authenticated)")
out.append("GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;")
out.append("GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;")
out.append("GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;")
out.append("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;")
out.append("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;")
out.append("")

out.append("COMMIT;")

OUT.write_text("\n".join(out))
print(f"wrote {OUT}", file=sys.stderr)

#!/bin/bash
# ─── Export schema from Supabase Cloud for self-hosting ──────
#
# This script connects to your Supabase cloud Postgres and exports:
#   1. The full schema (tables, functions, triggers, RLS policies)
#   2. Optionally, your data
#
# Prerequisites:
#   - psql (PostgreSQL client) installed
#   - Your Supabase database connection string
#
# Usage:
#   ./scripts/export-supabase-schema.sh <database-url>
#
# Example:
#   ./scripts/export-supabase-schema.sh "postgresql://postgres.wdwjmapvuibsqiifslno:PASSWORD@aws-0-eu-north-1.pooler.supabase.com:5432/postgres"
#
# The connection string is in: Supabase Dashboard → Project Settings → Database → Connection string (URI)

set -euo pipefail

DB_URL="${1:?Usage: $0 <database-connection-string>}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/../volumes/db/init"

mkdir -p "$OUTPUT_DIR"

echo "══════════════════════════════════════════════"
echo "  Leily — Schema Export from Supabase Cloud"
echo "══════════════════════════════════════════════"
echo ""

# ── 1. Export public schema (tables, functions, triggers, policies) ──
echo "→ Exporting public schema..."
pg_dump "$DB_URL" \
  --schema=public \
  --no-owner \
  --no-privileges \
  --no-comments \
  --if-exists \
  --clean \
  --create \
  > "$OUTPUT_DIR/01-baseline.sql" 2>/dev/null || {
    echo "ERROR: Could not connect. Check your connection string."
    echo "Find it at: Supabase Dashboard → Project Settings → Database → Connection string"
    exit 1
  }

echo "  ✓ Schema saved to volumes/db/init/01-baseline.sql"

# ── 2. Export data (optional) ──
read -p "→ Export data too? (y/N): " EXPORT_DATA
if [[ "$EXPORT_DATA" =~ ^[Yy]$ ]]; then
  echo "→ Exporting data..."
  pg_dump "$DB_URL" \
    --schema=public \
    --data-only \
    --no-owner \
    --no-privileges \
    --inserts \
    > "$OUTPUT_DIR/02-data.sql" 2>/dev/null

  echo "  ✓ Data saved to volumes/db/init/02-data.sql"
fi

# ── 3. Export auth.users (so you can log in locally) ──
read -p "→ Export auth users? (y/N): " EXPORT_USERS
if [[ "$EXPORT_USERS" =~ ^[Yy]$ ]]; then
  echo "→ Exporting auth users..."
  psql "$DB_URL" -c "\COPY (SELECT * FROM auth.users) TO STDOUT WITH CSV HEADER" \
    > "$OUTPUT_DIR/03-auth-users.csv" 2>/dev/null || echo "  ⚠ Could not export auth users (permission denied is normal for pooled connections)"

  if [ -f "$OUTPUT_DIR/03-auth-users.csv" ]; then
    echo "  ✓ Auth users saved to volumes/db/init/03-auth-users.csv"
    echo "  Note: You'll need to import these manually after the stack is up."
  fi
fi

echo ""
echo "══════════════════════════════════════════════"
echo "  Done! Next steps:"
echo "  1. Review the exported files in volumes/db/init/"
echo "  2. Copy .env.selfhost.example → .env and fill in secrets"
echo "  3. docker compose up -d"
echo "══════════════════════════════════════════════"

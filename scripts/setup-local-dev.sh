#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

DB_NAME="${DB_NAME:-claims_engine_dev}"
DB_USER="${DB_USER:-$USER}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

if ! command -v psql >/dev/null 2>&1; then
  echo "Postgres client (psql) not found."
  echo "Install Postgres (recommended: https://postgresapp.com/), then re-run:"
  echo "  scripts/setup-local-dev.sh"
  exit 1
fi

if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  echo "Creating local database '${DB_NAME}'..."
  createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
else
  echo "Local database '${DB_NAME}' already exists."
fi

ENV_FILE="$PROJECT_ROOT/.env.local"
DATABASE_URL="postgres://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

if [[ -f "$ENV_FILE" ]]; then
  BACKUP_FILE="$ENV_FILE.bak.$(date +%Y%m%d%H%M%S)"
  cp "$ENV_FILE" "$BACKUP_FILE"
  echo "Backed up existing .env.local to $BACKUP_FILE"
fi

{
  if [[ -f "$ENV_FILE" ]]; then
    grep -v '^DATABASE_URL=' "$ENV_FILE" || true
  fi
  echo "DATABASE_URL=\"${DATABASE_URL}\""
} > "$ENV_FILE"

echo "Set DATABASE_URL in .env.local"

export DATABASE_URL="$DATABASE_URL"

echo "Running Prisma migrations..."
npx prisma migrate dev

echo "Seeding demo data..."
npx prisma db seed

echo "Local dev setup complete. Start the app with:"
echo "  npm run dev"


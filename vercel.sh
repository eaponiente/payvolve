#!/usr/bin/env bash
set -euo pipefail

# Deploy this Next.js + Prisma app to Vercel.
# Requires: DATABASE_URL and AUTH_SECRET to be set in the environment
# (or in a .env file loaded before running this script).
#
# DATABASE_URL from the local environment is pushed to Vercel's project env
# vars (replacing whatever is already there) so the database that migrations
# are applied to always matches the database the deployed app connects to.

if ! command -v vercel &>/dev/null; then
  echo "Error: Vercel CLI is not installed. Install it with: npm i -g vercel" >&2
  exit 1
fi

# ── Pre-flight env checks ─────────────────────────────────
: "${DATABASE_URL:?DATABASE_URL must be set (Postgres connection string)}"
: "${AUTH_SECRET:?AUTH_SECRET must be set (next-auth JWT secret)}"

SEED=false
PROD=true
NO_LINK=false
for arg in "$@"; do
  case "$arg" in
    --seed)    SEED=true ;;
    --preview) PROD=false ;;
    --no-link) NO_LINK=true ;;
    *) echo "Unknown flag: $arg" >&2; exit 2 ;;
  esac
done

echo "→ Installing dependencies"
npm ci

echo "→ Generating Prisma client"
npx prisma generate

# Link repo to Vercel project once (interactive). Skip if already linked.
if [ "$NO_LINK" = false ] && [ ! -d .vercel ]; then
  echo "→ Linking to Vercel project (interactive)"
  vercel link
fi

TARGET_ENV="production"
if [ "$PROD" = false ]; then
  TARGET_ENV="preview"
fi

echo "→ Syncing DATABASE_URL to Vercel (${TARGET_ENV})"
vercel env rm DATABASE_URL "$TARGET_ENV" --yes >/dev/null 2>&1 || true
printf '%s' "$DATABASE_URL" | vercel env add DATABASE_URL "$TARGET_ENV"

echo "→ Applying pending migrations to target database"
npx prisma migrate deploy

if [ "$SEED" = true ]; then
  echo "→ Seeding demo data"
  npm run db:seed
fi

echo "→ Deploying to Vercel"
if [ "$PROD" = true ]; then
  vercel --prod --yes
else
  vercel --yes
fi

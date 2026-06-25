#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${WORLD_CUP_ENV_FILE:-$HOME/.config/world-cup-daily/env}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

cd "$ROOT_DIR"

node world-cup-daily/scripts/check-live-access.mjs
node world-cup-daily/scripts/fetch-matches.mjs \
  --profile .world-cup-daily/profile.json \
  --cache .world-cup-daily/cache/matches.json \
  --out .world-cup-daily/cache/matches-latest.json

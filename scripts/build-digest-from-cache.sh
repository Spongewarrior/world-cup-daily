#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
TODAY="${1:-$(date +%F)}"

cd "$ROOT_DIR"

if [ ! -f .world-cup-daily/profile.json ]; then
  echo "Missing profile: .world-cup-daily/profile.json" >&2
  exit 1
fi

if [ ! -f .world-cup-daily/cache/matches-latest.json ]; then
  echo "Missing match cache: .world-cup-daily/cache/matches-latest.json" >&2
  exit 1
fi

if [ ! -f .world-cup-daily/cache/news.json ]; then
  echo "Missing news cache: .world-cup-daily/cache/news.json" >&2
  exit 1
fi

node world-cup-daily/scripts/normalize-data.mjs \
  --profile .world-cup-daily/profile.json \
  --matches .world-cup-daily/cache/matches-latest.json \
  --news .world-cup-daily/cache/news.json \
  --out .world-cup-daily/cache/digest-data.json

node world-cup-daily/scripts/render-digest.mjs \
  --data .world-cup-daily/cache/digest-data.json \
  --template world-cup-daily/assets/digest-template.html \
  --out ".world-cup-daily/digests/${TODAY}.html"

node world-cup-daily/scripts/validate-digest.mjs \
  --html ".world-cup-daily/digests/${TODAY}.html"

echo "Digest ready: .world-cup-daily/digests/${TODAY}.html"

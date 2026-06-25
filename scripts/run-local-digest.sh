#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
TODAY="${1:-$(date +%F)}"

cd "$ROOT_DIR"

bash world-cup-daily/scripts/prefetch-live-matches.sh
bash world-cup-daily/scripts/build-digest-from-cache.sh "$TODAY"

echo "Open: $ROOT_DIR/.world-cup-daily/digests/${TODAY}.html"

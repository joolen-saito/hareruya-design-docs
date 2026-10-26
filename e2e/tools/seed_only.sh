#!/usr/bin/env bash
# シードの数と作り方の依存を数える（DB・アプリに触らない。シードは作らない）。 tools/seed_only.sh count
# 出力: .runs/seed_only/counts.tsv, needs.tsv
set -u
ROOT=$(cd "$(dirname "$0")/.." && pwd)
OUT=$ROOT/.runs/seed_only
mode=${1:-}
[ "$mode" = count ] || { echo "使い方: tools/seed_only.sh count" >&2; exit 2; }
mkdir -p "$OUT"
cd "$ROOT" || exit 1
SEED_ONLY_MODE=count nice -n 19 npx playwright test spec/seed_only.spec.ts --reporter=list --timeout 600000 --output "$OUT/tr" > "$OUT/count.log" 2>&1; echo "rc=$?"

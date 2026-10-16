#!/usr/bin/env bash
# run.sh <束>...  束ごとに codex を並行して回す。出力は review/<束>_out.txt、進み具合は review/progress.log
set -u
cd "$(dirname "$0")"
RUN=/home/y-saito/Developments/hareruya-design-docs/.cursor/skills/adversarial-review/scripts/run_codex_review.sh
for b in "$@"; do
  ( for i in 1 2 3; do
      bash "$RUN" "${b}_prompt.md" "${b}_out.txt" >/dev/null 2>&1
      grep -q "at capacity" "${b}_out.txt" || break
      sleep 120
    done
    echo "$(date +%T) done $b" >> progress.log ) &
done
wait
echo "$(date +%T) all done $*" >> progress.log

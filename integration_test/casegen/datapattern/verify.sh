#!/usr/bin/env bash
# verify.sh <並列数> <束>...  束ごとに codex を回す。出力は verify/<束>_out.txt、進み具合は verify/progress.log
set -u
cd "$(dirname "$0")"
N=$1; shift
RUN=/home/y-saito/Developments/hareruya-design-docs/.cursor/skills/adversarial-review/scripts/run_codex_review.sh
for b in "$@"; do
  while [ "$(jobs -rp | wc -l)" -ge "$N" ]; do sleep 20; done
  ( for i in 1 2 3; do
      bash "$RUN" "verify/${b}_prompt.md" "verify/${b}_out.txt" >/dev/null 2>&1
      grep -q "at capacity" "verify/${b}_out.txt" || break
      sleep 120
    done
    echo "$(date +%T) done $b" >> verify/progress.log ) &
done
wait
echo "$(date +%T) all done $*" >> verify/progress.log

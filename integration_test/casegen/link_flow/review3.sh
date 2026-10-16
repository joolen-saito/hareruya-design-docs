#!/usr/bin/env bash
# review3.sh <巡=3> <並列数> <群>...  群ごとに codex を回す。出力は review/<群>_r<巡>_out.txt
set -u
cd "$(dirname "$0")"
R=$1; N=$2; shift 2
RUN=/home/y-saito/Developments/hareruya-design-docs/.cursor/skills/adversarial-review/scripts/run_codex_review.sh
python3 make_review3.py "$@" >/dev/null
for c in "$@"; do
  while [ "$(jobs -rp | wc -l)" -ge "$N" ]; do sleep 20; done
  ( for i in 1 2 3; do
      bash "$RUN" "review/prompt_${c}_r${R}.md" "review/${c}_r${R}_out.txt" >/dev/null 2>&1
      grep -q "at capacity" "review/${c}_r${R}_out.txt" || break
      sleep 120
    done
    echo "$(date +%T) done $c" >> review/progress_r${R}.log ) &
done
wait
echo "$(date +%T) all done" >> review/progress_r${R}.log

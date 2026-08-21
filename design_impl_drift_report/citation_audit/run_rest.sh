#!/usr/bin/env bash
# rest_* パケットを並列で codex に投げる。
# usage: run_rest.sh [並列数]
set -uo pipefail
cd /home/y-saito/Developments/hareruya-design-docs/design_impl_drift_report
PAR="${1:-4}"
mkdir -p citation_audit/results

ls citation_audit/packets/rest_*.json | while read -r pkt; do
  pid=$(basename "$pkt" .json)
  [ -f "citation_audit/results/$pid.json" ] && continue
  echo "$pid"
done | xargs -I{} -P "$PAR" bash -c '
  pid="{}"
  B=/home/y-saito/Developments/hareruya-design-docs/design_impl_drift_report/citation_audit
  timeout 3600 "$B/run_codex.sh" "$B/packets/$pid.json" "$B/results/$pid.json" "$B/results/$pid.log" >/dev/null 2>&1
  n=$(ls "$B"/results/rest_*.json 2>/dev/null | wc -l)
  if [ -f "$B/results/$pid.json" ]; then
    echo "[$(date +%H:%M:%S)] done  $pid  ($n/48)"
  else
    echo "[$(date +%H:%M:%S)] FAIL  $pid  ($n/48)"
  fi
'
echo "=== rest 全パケット処理終了 ==="

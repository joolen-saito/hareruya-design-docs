#!/usr/bin/env bash
# api/batch パケットを並列で codex に投げる。
# usage: run_all.sh [並列数]
set -uo pipefail
cd /home/y-saito/Developments/hareruya-design-docs/design_impl_drift_report
PAR="${1:-3}"
mkdir -p citation_audit/results

ls citation_audit/packets/*.json | while read -r pkt; do
  pid=$(basename "$pkt" .json)
  [ -f "citation_audit/results/$pid.json" ] && { echo "skip $pid"; continue; }
  echo "$pid"
done | xargs -I{} -P "$PAR" bash -c '
  pid="{}"
  B=/home/y-saito/Developments/hareruya-design-docs/design_impl_drift_report/citation_audit
  echo "[$(date +%H:%M:%S)] start $pid"
  timeout 3600 "$B/run_codex.sh" "$B/packets/$pid.json" "$B/results/$pid.json" "$B/results/$pid.log" >/dev/null 2>&1
  if [ -f "$B/results/$pid.json" ]; then
    echo "[$(date +%H:%M:%S)] done  $pid"
  else
    echo "[$(date +%H:%M:%S)] FAIL  $pid (結果ファイル未作成)"
  fi
'
echo "=== 全パケット処理終了 ==="

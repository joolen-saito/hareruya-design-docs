#!/usr/bin/env bash
# codex の出力から最後の回答だけを取り出し findings_R<n>.md に書く。使い方: extract_findings.sh <業務> <巡>
set -euo pipefail
d="$(cd "$(dirname "$0")/.." && pwd)/$1/review"
src="$d/codex_R$2.txt"; out="$d/findings_R$2.md"
n=$(awk '/^codex$/{n=NR} END{print n}' "$src"); e=$(grep -n "^tokens used" "$src" | tail -1 | cut -d: -f1)
sed -n "$((n+1)),$((e-1))p" "$src" > "$out"
echo "$out 指摘$(grep -c '^主張:' "$out" || true)件"; grep '^判定:' "$out" | sort | uniq -c || true
grep -qx "NONE" "$out" && echo "NONE" || true

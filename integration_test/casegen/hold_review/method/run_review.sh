#!/usr/bin/env bash
# codex レビューを1グループ起動する。  run_review.sh <group名> <bNN> [<bNN> ...]
set -uo pipefail
S=/tmp/claude-1000/-home-y-saito-Developments-hareruya-design-docs/5d95a25c-a317-4d35-b601-d34efcc2a313/scratchpad/hold
G="$1"; shift
mkdir -p "$S/review"
python3 "$S/gate.py" "$S" "$@" || { echo "gate NG: $G"; exit 1; }
sed "s/__BATCHES__/$*/g" "$S/REVIEW_PROMPT.md" > "$S/review/$G.prompt.md"
bash /home/y-saito/Developments/hareruya-design-docs/.cursor/skills/adversarial-review/scripts/run_codex_review.sh \
  "$S/review/$G.prompt.md" "$S/review/$G.out.txt" /home/y-saito/Developments

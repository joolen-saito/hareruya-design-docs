#!/usr/bin/env bash
# 現行ソース調査の codex レビューを1グループ起動する。 run_review.sh <group> <cNN>...
S=/tmp/claude-1000/-home-y-saito-Developments-hareruya-design-docs/5d95a25c-a317-4d35-b601-d34efcc2a313/scratchpad/hold
G="$1"; shift
python3 "$S/current/gate_current.py" "$S" "$@" || { echo "gate NG: $G"; exit 1; }
sed "s/__BATCHES__/$*/g" "$S/current/REVIEW_CURRENT.md" > "$S/current/review/$G.prompt.md"
bash /home/y-saito/Developments/hareruya-design-docs/.cursor/skills/adversarial-review/scripts/run_codex_review.sh \
  "$S/current/review/$G.prompt.md" "$S/current/review/$G.out.txt" /home/y-saito/Developments

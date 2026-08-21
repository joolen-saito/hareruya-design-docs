#!/usr/bin/env bash
# codex による敵対レビューを規約どおりに起動する。
#
#   run_codex_review.sh <観点ファイル> <出力ファイル> [走査ルート]
#
# stdin を閉じる、走査ルートを正本リポジトリの親に置く、といった既知の罠を吸収する。
# 詳細は ../SKILL.md を参照。
set -euo pipefail

PROMPT="${1:?観点ファイルを指定する}"
OUT="${2:?出力ファイルを指定する}"
ROOT="${3:-/home/y-saito/Developments}"

[ -r "$PROMPT" ] || { echo "観点ファイルが読めない: $PROMPT" >&2; exit 1; }

# pkill -f "codex exec" は自分の親シェルにもマッチして自滅するので使わない。
# 停止が必要なときは pgrep で PID を確認して kill する。
codex exec --sandbox read-only --cd "$ROOT" "$(cat "$PROMPT")" < /dev/null > "$OUT" 2>&1
status=$?

echo "exit=$status  out=$OUT"
# codex は起動時に必ず "Reading additional input from stdin..." を出す。これ自体は異常ではない。
# 異常なのは stdin が開いたままで待ち続け、完了行が出ないまま終わる場合。
if ! grep -q "tokens used" "$OUT" 2>/dev/null; then
  echo "警告: codex が完了していない。stdin を閉じているか、観点ファイルが空でないか確認する。" >&2
  exit 1
fi

# 指摘件数の目安を出す。出力形式は SKILL.md の規定に従う想定。
n=$(grep -c '^判定:' "$OUT" 2>/dev/null || true)
if grep -qx "NONE" "$OUT" 2>/dev/null; then
  echo "指摘なし (NONE)"
else
  echo "指摘 ${n:-0} 件。実ソースで1件ずつ確認してから反映すること。"
fi
exit "$status"

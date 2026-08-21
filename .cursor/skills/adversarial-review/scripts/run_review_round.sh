#!/usr/bin/env bash
# 敵対レビューを1巡ぶん回す。codex と fable5 を並行で起動し、巡回数を打ち切る。
#
#   run_review_round.sh <レビューディレクトリ> <走査ルート> [対象設計書...]
#
# 2026-08-18 に導入。それまでは codex を逐次で10巡回し、1巡あたり約23万トークン・
# 指摘が1件でも同じコストがかかっていた（M05-01 検索結果で合計233万トークン）。
# 巡ごとに走査をやり直すのが原因なので、巡回数を上限で止め、両レビュアーを並行にする。
set -uo pipefail

DIR="${1:?レビューディレクトリを指定する}"
ROOT="${2:?走査ルートを指定する（正本リポと設計書リポを含む最小の親）}"
shift 2
MAX_ROUNDS="${MAX_ROUNDS:-3}"

PROMPT="$DIR/prompt.md"
[ -r "$PROMPT" ] || { echo "観点ファイルが無い: $PROMPT" >&2; exit 1; }

round=$(( $(ls "$DIR"/codex_r*.txt 2>/dev/null | wc -l) + 1 ))
if [ "$round" -gt "$MAX_ROUNDS" ]; then
  echo "巡回数の上限 ${MAX_ROUNDS} に達した。これ以上は回さない。" >&2
  echo "残っている指摘は carryover.md に理由付きで記録し、レビューを閉じる。" >&2
  exit 2
fi

echo "== 第${round}巡 / 上限${MAX_ROUNDS} =="
# 巡ごとの本文行数を記録する。レビューを重ねるほど設計書が細かくなる問題を可視化する。
for doc in "$@"; do
  [ -f "$doc" ] || continue
  n=$(grep -cve '^\s*$' -e '^#' "$doc")
  echo "  本文行数 $(basename "$doc"): ${n}" | tee -a "$DIR/size_log.txt"
done

CODEX_OUT="$DIR/codex_r${round}.txt"
codex exec --sandbox read-only --cd "$ROOT" "$(cat "$PROMPT")" < /dev/null > "$CODEX_OUT" 2>&1 &
codex_pid=$!
echo "  codex 起動 (pid ${codex_pid}) → ${CODEX_OUT}"
echo "  fable5 は Agent ツールで並行起動すること（observations: 対象は1〜3本まで）"
wait "$codex_pid"
grep -q "tokens used" "$CODEX_OUT" || { echo "警告: codex が完了していない" >&2; exit 1; }
if grep -qx "NONE" "$CODEX_OUT"; then
  echo "  codex: 指摘なし (NONE)"
else
  echo "  codex: 指摘 $(grep -c '^判定:' "$CODEX_OUT") 件。実ソースで1件ずつ確認してから反映する。"
fi

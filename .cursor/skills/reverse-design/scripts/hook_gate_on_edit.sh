#!/usr/bin/env bash
# functions/<repo>/<機能>.md を編集したら、その機能の粒度ゲートを走らせる。
#
# PostToolUse フックとして使う。標準入力にフックの JSON が来る。
# ゲートが NG のときだけ結果を返し、モデルの文脈へ差し戻す。通ったときは黙る。
# 手順書に「ゲートを通す」と書くだけでは人が実行しないと動かないため、
# ハーネス側で実行させる（2026-08-18）。
set -uo pipefail

f=$(jq -r '.tool_response.filePath // .tool_input.file_path // empty' 2>/dev/null)
[ -n "${f:-}" ] || exit 0

# 対象は設計書本体だけ。退避先(_archive)は納品物ではない。
case "$f" in
  */functions/_archive/*) exit 0 ;;
  */functions/*/*.md) ;;
  *) exit 0 ;;
esac

root="${f%%/functions/*}"
gate="$root/.cursor/skills/reverse-design/scripts/doc_granularity_gate.py"
[ -f "$gate" ] || exit 0

fid=$(basename "$f" | sed -n 's/^\([a-z][0-9][0-9]-[0-9][0-9][a-z]\?\)_.*/\1/p' | tr '[:lower:]' '[:upper:]')
[ -n "$fid" ] || exit 0

out=$(cd "$root" && python3 "$gate" --function "$fid" --strict 2>&1)
status=$?
[ "$status" -eq 0 ] && exit 0

jq -n --arg fid "$fid" --arg o "$out" \
  '{hookSpecificOutput:{hookEventName:"PostToolUse",
    additionalContext:("粒度ゲートが通っていない（機能 " + $fid + "）。設計書を直してから次へ進むこと。\n" + $o)}}'
exit 0

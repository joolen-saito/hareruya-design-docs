#!/usr/bin/env bash
# run_codex.sh <雛形> <出力名> <機能ID>...  雛形の {FIDS} に機能IDを差し込み、codex で読むだけのレビューを流す。
# 出力は review/<出力名>_prompt.md と review/<出力名>_out.txt。完了は出力末尾の「tokens used」で判断する（20〜40分かかる）。
set -eu
G=$(cd "$(dirname "$0")" && pwd)
tpl=$1; name=$2; shift 2
fids=$(IFS='・'; echo "$*")
sed "s/{FIDS}/$fids/g" "$G/$tpl" > "$G/review/${name}_prompt.md"
cd /home/y-saito/Developments/hareruya-design-docs
codex exec --sandbox read-only --cd /home/y-saito/Developments/hareruya-design-docs "$(cat "$G/review/${name}_prompt.md")" < /dev/null > "$G/review/${name}_out.txt" 2>&1

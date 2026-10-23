#!/usr/bin/env bash
# run_verify.sh <束>  codex で事実確認を読むだけで流す。出力は review/<束>_out.txt（完了は末尾の tokens used で判断。20〜40分）
set -eu
D=$(cd "$(dirname "$0")" && pwd)
cd /home/y-saito/Developments/hareruya-design-docs
codex exec --sandbox read-only --cd /home/y-saito/Developments/hareruya-design-docs "$(cat "$D/review/$1_prompt.md")" < /dev/null > "$D/review/$1_out.txt" 2>&1

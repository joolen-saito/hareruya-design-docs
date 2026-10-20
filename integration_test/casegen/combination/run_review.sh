#!/usr/bin/env bash
# run_review.sh <依頼文>  codex で読むだけのレビューを流す。出力は依頼文の _prompt.md を _out.txt にした名前。完了は末尾の「tokens used」。
set -eu
p=$1; o=${p%_prompt.md}_out.txt
cd /home/y-saito/Developments/hareruya-design-docs
codex exec --sandbox read-only --cd /home/y-saito/Developments/hareruya-design-docs "$(cat "$p")" < /dev/null > "$o" 2>&1

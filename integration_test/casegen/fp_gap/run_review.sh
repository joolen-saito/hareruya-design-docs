#!/usr/bin/env bash
# run_review.sh <依頼文>  codex で読むだけのレビューを流す。出力は依頼文の _prompt.md を _out.txt にした名前。完了は末尾の「tokens used」。
# ee（リポジトリの外）も読ませるので --cd は親ディレクトリ。git の管理外なので --skip-git-repo-check が要る（無いと即終了する）。
set -eu
p=$(realpath "$1"); o=${p%_prompt.md}_out.txt
cd /home/y-saito/Developments
nice codex exec --sandbox read-only --skip-git-repo-check --cd /home/y-saito/Developments "$(cat "$p")" < /dev/null > "$o" 2>&1

#!/bin/bash
# usage: launch.sh <巡> <機能ID...>   codex レビューを裏で起動する
cd "$(dirname "$0")/.."
r=$1; shift
for f in "$@"; do
  python3 review/make_prompts.py "$r" "$f" >/dev/null
  nohup bash review/run_codex.sh "review/${f}_r${r}_prompt.md" "review/${f}_r${r}_out.txt" >/dev/null 2>&1 &
  echo "$f r$r 起動"
done

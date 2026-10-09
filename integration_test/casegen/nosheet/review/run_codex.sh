#!/bin/bash
# usage: run_codex.sh <prompt.md> <out.txt>
for i in 1 2 3 4 5 6 7 8; do
  codex exec --sandbox read-only --skip-git-repo-check --cd /home/y-saito/Developments - < "$1" > "$2" 2>&1
  if grep -q 'at capacity' "$2"; then timeout 240 tail -f /dev/null; continue; fi
  break
done

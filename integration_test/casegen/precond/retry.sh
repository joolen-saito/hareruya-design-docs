#!/usr/bin/env bash
# 指定した機能を、gen/<f>/prompt.md のまま6本ずつ codex に回し、反映とゲートまで行う。
#   retry.sh A02-02 ...
set -uo pipefail
PC=/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/precond
LOG=$PC/PROGRESS.log
set -- "$@"
while [ $# -gt 0 ]; do
  B=("${@:1:6}"); shift $(( $# < 6 ? $# : 6 ))
  echo "=== $(date '+%m-%d %H:%M') 再実行 : ${B[*]} ===" >> $LOG
  declare -A pid=()
  for f in "${B[@]}"; do
    nohup codex exec --skip-git-repo-check --sandbox read-only --cd /home/y-saito/Developments \
      - < $PC/gen/$f/prompt.md > $PC/gen/$f/out.txt 2>&1 &
    pid[$f]=$!
  done
  for f in "${B[@]}"; do wait ${pid[$f]} 2>/dev/null; done
  python3 $PC/apply_precond.py "${B[@]}" >> $LOG 2>&1
  for f in "${B[@]}"; do
    if python3 $PC/gate_precond.py $f > $PC/gen/$f/gate.txt 2>&1; then touch $PC/gen/$f/.done
    else touch $PC/gen/$f/.failed; echo "  $f 再実行後も不合格: $(head -1 $PC/gen/$f/gate.txt)" >> $LOG; fi
  done
done
echo "retry.sh 終了 $(date '+%m-%d %H:%M')" >> $LOG

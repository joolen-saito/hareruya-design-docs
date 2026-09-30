#!/usr/bin/env bash
# 前提条件の書き直しを、残りの機能について6本ずつ無人で回す。
#   drive.sh <バッチ数>
# 著者=codex。出力を apply_precond.py で組み立て、gate_precond.py で検査する。
# ゲートで落ちた機能は、指摘を添えて1回だけ書き直させる。それでも落ちたら FAILED に残して先へ進む。
# レビュー（codex、10機能ずつ）は別に review.sh で回す。
# 依頼文は標準入力で渡す（引数だと1引数128KBの上限で書き直し依頼が E2BIG で落ちる。2026-09-29 M14-10）。
set -uo pipefail
ROOT=/home/y-saito/Developments/hareruya-design-docs
PC=$ROOT/integration_test/casegen/precond
N=${1:-1}
LOG=$PC/PROGRESS.log
PAR=6

done_mark() { grep -q 'tokens used' "$1" 2>/dev/null; }

run_codex() {            # $@=機能。gen/<f>/prompt.md → gen/<f>/out.txt
  declare -A pid try
  local f
  for f in "$@"; do
    try[$f]=0
    nohup codex exec --skip-git-repo-check --sandbox read-only --cd /home/y-saito/Developments \
      - < $PC/gen/$f/prompt.md > $PC/gen/$f/out.txt 2>&1 &
    pid[$f]=$!
  done
  local i live
  for i in $(seq 1 240); do
    sleep 30
    live=0
    for f in "$@"; do
      # 完了＝プロセスが終わり、かつ完了印がある。印だけだと依頼文中の文字列で誤判定しうる
      if ! kill -0 "${pid[$f]}" 2>/dev/null && done_mark $PC/gen/$f/out.txt; then continue; fi
      if ! kill -0 "${pid[$f]}" 2>/dev/null; then
        if [ "${try[$f]}" -lt 2 ]; then
          try[$f]=$(( try[$f] + 1 )); echo "  $f 異常終了。再試行 ${try[$f]}/2" >> $LOG; sleep 20
          nohup codex exec --skip-git-repo-check --sandbox read-only --cd /home/y-saito/Developments \
            - < $PC/gen/$f/prompt.md > $PC/gen/$f/out.txt 2>&1 &
          pid[$f]=$!
        else
          continue
        fi
      fi
      live=1
    done
    [ $live -eq 0 ] && break
  done
}

for b in $(seq 1 $N); do
  FIDS=$(python3 - <<'PY'
import csv, os
PC='/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/precond'
CG=os.path.dirname(PC)
order=[x['機能No'] for x in csv.DictReader(open(f'{CG}/execution_order.tsv'),delimiter='\t')]
have=[f for f in order if os.path.exists(f'{PC}/baseline/{f}_test_cases.tsv')]
have+=sorted(f[:-15] for f in os.listdir(f'{PC}/baseline') if f.endswith('_test_cases.tsv') and f[:-15] not in have)
todo=[f for f in have if f!='A01-01' and not os.path.exists(f'{PC}/gen/{f}/.done') and not os.path.exists(f'{PC}/gen/{f}/.failed')]
print(' '.join(todo[:6]))
PY
)
  [ -z "$FIDS" ] && { echo "全機能が完了 $(date '+%m-%d %H:%M')" >> $LOG; break; }
  { echo; echo "=== $(date '+%m-%d %H:%M') バッチ $b/$N : $FIDS ==="; } >> $LOG
  python3 $PC/make_registry.py >> $LOG 2>&1
  python3 $PC/make_prompts.py $FIDS >> $LOG 2>&1
  run_codex $FIDS
  python3 $PC/apply_precond.py $FIDS >> $LOG 2>&1
  RETRY=""
  for f in $FIDS; do
    if python3 $PC/gate_precond.py $f > $PC/gen/$f/gate.txt 2>&1; then touch $PC/gen/$f/.done
    else RETRY="$RETRY $f"; fi
  done
  if [ -n "$RETRY" ]; then
    echo "  ゲート不合格 →書き直し:$RETRY" >> $LOG
    python3 $PC/make_prompts.py --retry $RETRY >> $LOG 2>&1
    run_codex $RETRY
    python3 $PC/apply_precond.py $RETRY >> $LOG 2>&1
    for f in $RETRY; do
      if python3 $PC/gate_precond.py $f > $PC/gen/$f/gate.txt 2>&1; then touch $PC/gen/$f/.done
      else touch $PC/gen/$f/.failed; echo "  $f 書き直し後も不合格: $(tail -2 $PC/gen/$f/gate.txt | head -1)" >> $LOG; fi
    done
  fi
  python3 $PC/gate_precond.py $FIDS 2>&1 | tail -3 >> $LOG
done
echo "drive.sh 終了 $(date '+%m-%d %H:%M')" >> $LOG

#!/bin/bash
# 栗野さん分（.runs/kurino/run.tsv。build.py が作る）を、run_evidence に1回2件ずつ渡し、回と回のあいだを2分あけて流す。
# 2026-11-22 48（f7 の続き）の頼み「1回2件まで・回の間を数分あける」。記録は .runs/kurino/queue.log と .runs/kurino/qk_<機能>.log。
# 機能を飛ばすときは .runs/kurino/skip_<機能> を作る（流している途中なら次の回から止まる）。
cd "$(dirname "$0")/../.."
K=.runs/kurino
set -a; . ./.env.dev; set +a
export PW_SLOTS=2 PW_BATCH=2 PW_TIMEOUT_MS=${PW_TIMEOUT_MS:-1500000} PW_DEFER_SOLO_FILE=$PWD/.runs/defer_kurino_20261121.tsv
for f in $(cut -f1 $K/run.tsv | uniq); do
  [ -f "$K/skip_$f" ] && { echo "$(date +%H:%M) 飛ばす $f"; continue; }
  L=($(awk -F'\t' -v f="$f" '$1==f {split($2,a,"-"); print a[4]}' $K/run.tsv | sort -u))
  echo "$(date +%H:%M) 開始 $f ${L[*]}"
  : > $K/qk_$f.log
  for ((i=0; i<${#L[@]}; i+=2)); do
    [ -f .runs/shared_restore/STOP ] && { echo "$(date +%H:%M) STOP があるので止める（$f ${L[i]} の前）"; exit 1; }
    [ -f "$K/skip_$f" ] && break
    bash tools/run_evidence.sh $f ${L[@]:i:2} >> $K/qk_$f.log 2>&1
    sleep 120
  done
  echo "$(date +%H:%M) 終わり $f（$(grep -c 'DONE.*passed' $K/qk_$f.log) 合格・$(grep -c 'DONE.*failed' $K/qk_$f.log) 落ちた・$(grep -c 'DONE.*skipped' $K/qk_$f.log) スキップ）"
done
echo "$(date +%H:%M) 全部終わり（栗野さん分）"

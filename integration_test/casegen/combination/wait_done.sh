#!/usr/bin/env bash
# wait_done.sh <接頭辞> <数>  review/<接頭辞>_NN_out.txt のうち「tokens used」まで出たものが <数> 本以上になったら、済んだ束を書いて終わる
cd "$(dirname "$0")/review"
while :; do
  n=$(grep -l "^tokens used" $1_[0-9][0-9]_out.txt 2>/dev/null | wc -l)
  [ "$n" -ge "$2" ] && break
  sleep 30
done
grep -l "^tokens used" $1_[0-9][0-9]_out.txt | sed 's/_out.txt//'

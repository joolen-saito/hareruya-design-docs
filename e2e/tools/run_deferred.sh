#!/usr/bin/env bash
# 並べて流す間に書き留めた「1本だけで流すケース」を、機能ごとに1本だけで流す。 tools/run_deferred.sh [書き留めたファイル]
#   既定のファイルは .runs/lanes/deferred.tsv（1行「機能ID<TAB>番号<TAB>わけ」。tools/run_evidence.sh が PW_DEFER_SOLO_FILE へ書く）。
# - 機能を書かれた順に、tools/run_evidence.sh <機能ID> <番号…> を PW_SLOTS=1（ほかの回が終わるのを待つ単独）で流す。
#   判定はこの回のエビデンスに対して行う（並べて流して合格でなかったケースの流し直しを兼ねる）。
# - 流し終えた機能の行はファイルから除く（途中で止めても、残りから続けられる）。機能ごとの出力は .runs/lanes/<機能ID>.deferred.log。
set -u
ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT" || exit 1
F=${1:-$ROOT/.runs/lanes/deferred.tsv}
[ -s "$F" ] || { echo "書き留めた単独のケースは無い（$F）"; exit 0; }
LOG=$(dirname "$F")
worst=0
for fid in $(awk -F'\t' '!seen[$1]++ {print $1}' "$F"); do
  nums=$(awk -F'\t' -v f="$fid" '$1==f && !seen[$2]++ {print $2}' "$F" | tr '\n' ' ')
  echo "$(date '+%F %T') 単独: $fid $nums"
  # shellcheck disable=SC2086
  PW_SLOTS=1 PW_DEFER_SOLO_FILE= tools/run_evidence.sh "$fid" $nums > "$LOG/$fid.deferred.log" 2>&1; rc=$?
  echo "$(date '+%F %T') 単独: $fid 終了コード $rc — $(grep -E "^$fid: 合格" "$LOG/$fid.deferred.log" | tail -1)"
  (( rc > worst )) && worst=$rc
  if [ $rc -eq 3 ]; then echo "環境・ロックで止めたので、残りは流さない（$F に残す）"; break; fi
  awk -F'\t' -v f="$fid" '$1!=f' "$F" > "$F.tmp" && mv -f "$F.tmp" "$F"
done
exit $worst

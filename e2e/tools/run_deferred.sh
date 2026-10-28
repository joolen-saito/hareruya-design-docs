#!/usr/bin/env bash
# 並べて流す間に書き留めた「1本だけで流すケース」を、機能ごとに1本だけで流す。 tools/run_deferred.sh [書き留めたファイル]
#   既定のファイルは .runs/lanes/deferred.tsv（1行「機能ID<TAB>番号<TAB>わけ」。tools/run_evidence.sh が PW_DEFER_SOLO_FILE へ書く）。
# - 機能を書かれた順に、tools/run_evidence.sh <機能ID> <番号…> を PW_SLOTS=1（ほかの回が終わるのを待つ単独）で流す。
#   判定はこの回のエビデンスに対して行う（並べて流して合格でなかったケースの流し直しを兼ねる）。
# - 流し終えた機能の行はファイルから除く（途中で止めても、残りから続けられる）。機能ごとの出力は .runs/lanes/<機能ID>.deferred.log。
# - 流す前にエビデンスを控え（.runs/lanes/backup/）、「前の実行の残り」でシードが止まったケースは並べて流した回のエビデンスに戻す（2026-10-28）。
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
  # 流す前に、いまのエビデンス（並べて流した回）を控える。1本で流し直したら「前の実行の残り」でシードが止まったケースは、
  # 控えに戻して並べて流した回の結果で判定する（同じDBでは流し直せず、上書きすると落ち方の記録が消える。2026-10-28）
  bk="$LOG/backup/$fid"; mkdir -p "$bk"
  for n in $nums; do d="$ROOT/evidence/$fid/IT-$fid-$n"; [ -d "$d" ] && { rm -rf "${bk:?}/IT-$fid-$n"; cp -a "$d" "$bk/"; }; done
  # shellcheck disable=SC2086
  PW_SLOTS=1 PW_DEFER_SOLO_FILE= tools/run_evidence.sh "$fid" $nums > "$LOG/$fid.deferred.log" 2>&1; rc=$?
  for n in $nums; do
    d="$ROOT/evidence/$fid/IT-$fid-$n"; b="$bk/IT-$fid-$n"
    [ -f "$d/result.json" ] && [ -f "$b/result.json" ] || continue
    if node -e 'const r=JSON.parse(require("fs").readFileSync(process.argv[1],"utf-8"));const e=String(r.エラー||"")+String(r.実際の状態||"");process.exit(r.結果==="未判定"&&/前の実行|既に [0-9]+ 件|既に1件|残っている|残り/.test(e)?0:1)' "$d/result.json"; then
      rm -rf "${bk:?}/IT-$fid-$n.solo"; mv "$d" "$bk/IT-$fid-$n.solo" && cp -a "$b" "$d"
      echo "$(date '+%F %T') 単独: IT-$fid-$n は前の実行の残りで止まったので、並べて流した回のエビデンスに戻した（1本の回は $bk/IT-$fid-$n.solo）"
    fi
  done
  node "$ROOT/tools/evidence_index.mjs" "$fid" >/dev/null 2>&1 || true
  echo "$(date '+%F %T') 単独: $fid 終了コード $rc — $(grep -E "^$fid: 合格" "$LOG/$fid.deferred.log" | tail -1)"
  (( rc > worst )) && worst=$rc
  if [ $rc -eq 3 ]; then echo "環境・ロックで止めたので、残りは流さない（$F に残す）"; break; fi
  awk -F'\t' -v f="$fid" '$1!=f' "$F" > "$F.tmp" && mv -f "$F.tmp" "$F"
done
exit $worst

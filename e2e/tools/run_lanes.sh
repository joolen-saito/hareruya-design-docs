#!/usr/bin/env bash
# 機能の列（レーン）を同じDBへ並べて流し、エビデンスを作る（依頼者の承認 2026-10-26。3本まで）。
#   tools/run_lanes.sh "<機能ID…>" "<機能ID…>" ["<機能ID…>"] [-- <run_evidence.sh へ渡すオプション…>]
#   例: tools/run_lanes.sh "M03-16 M03-17 M03-18" "M04-01 M04-02" "M13-02" -- --todo
#
# - レーンごとに、機能を書いた順に tools/run_evidence.sh で流す。レーンの数が同時に流れる Playwright の本数（PW_SLOTS）になる。
#   自分の列を流し終えたレーンは、ほかのレーンの列の残りを後ろから引き取る（機能ごとの受け持ちの印 PW_LANE_CLAIM_DIR。
#   run_evidence.sh が流し始める前に印を作り、印がもうある機能は流さない）。列の長さが偏っても、先に空いたレーンが埋める。
# - データがぶつかりにくいよう、レーンはモジュール（M03・M04 など）で分けるのがよい。
# - 共有の設定を書き換えるケースと、並べて流して合格でなかったケースは、並べている間は流さずに書き留め（PW_DEFER_SOLO_FILE）、
#   全部のレーンが終わってから tools/run_deferred.sh が機能ごとに1本だけで流す（2026-10-26。その場で流すと、単独の回が
#   入るたびに3本とも今のまとまりを終えるまで止まった）。
# - 機能ごとの出力は .runs/lanes/<機能ID>.log。終わったら機能ごとの終了コードと、各機能の最後の行を出す。
set -u
ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT" || exit 1
lanes=(); opts=()
while [ $# -gt 0 ]; do
  if [ "$1" = "--" ]; then shift; opts=("$@"); break; fi
  lanes+=("$1"); shift
done
n=${#lanes[@]}
if (( n < 1 || n > 3 )); then echo "使い方: tools/run_lanes.sh \"<機能ID…>\" … （レーンは1〜3本）[-- オプション…]" >&2; exit 2; fi
for l in "${lanes[@]}"; do for f in $l; do
  [[ "$f" =~ ^[A-Z][0-9]{2}-[0-9]{2}$ ]] || { echo "機能IDでない: $f" >&2; exit 2; }
done; done
LOG=${PW_RUN_DIR:-$ROOT/.runs}/lanes
mkdir -p "$LOG"
export PW_SLOTS=$n
export PW_DEFER_SOLO_FILE=$LOG/deferred.tsv
export PW_LANE_CLAIM_DIR=$LOG/claimed.$$
rm -rf "${PW_LANE_CLAIM_DIR:?}"; mkdir -p "$PW_LANE_CLAIM_DIR"

lane() { # <レーン番号>: 自分の列のあと、ほかのレーンの列を後ろから
  local k=$1
  local f rc j t order=()
  for f in ${lanes[k-1]}; do order+=("$f"); done
  for ((j = 1; j < n; j++)); do
    t=${lanes[(k - 1 + j) % n]}
    # shellcheck disable=SC2206
    local rest=($t)
    for ((i = ${#rest[@]} - 1; i >= 0; i--)); do order+=("${rest[i]}"); done
  done
  for f in "${order[@]}"; do
    [ -d "$PW_LANE_CLAIM_DIR/$f" ] && continue
    tools/run_evidence.sh "$f" "${opts[@]}" > "$LOG/.$f.$k.tmp" 2>&1; rc=$?
    if grep -q "ほかのレーンが受け持った" "$LOG/.$f.$k.tmp"; then rm -f "$LOG/.$f.$k.tmp"; continue; fi
    mv -f "$LOG/.$f.$k.tmp" "$LOG/$f.log"
    echo "$(date '+%F %T') レーン$k: $f を流した"
    echo "$(date '+%F %T') レーン$k: $f 終了コード $rc"
    echo "$f	$rc" >> "$LOG/.done.$$"
    # 環境が止まった（3）なら、このレーンの残りも流さない
    if [ $rc -eq 3 ]; then echo "レーン$k: 環境・ロックで止めたので、残り（$*）は流さない"; return 3; fi
  done
}

: > "$LOG/.done.$$"
pids=()
for ((k = 0; k < n; k++)); do
  # shellcheck disable=SC2086
  lane $((k + 1)) &
  pids+=($!)
  sleep 20   # 立ち上がりの重なり（ログイン・シードの作り始め）を少しずらす
done
for p in "${pids[@]}"; do wait "$p"; done

echo "$(date '+%F %T') 書き留めた単独のケースを1本だけで流す"
tools/run_deferred.sh "$PW_DEFER_SOLO_FILE"; drc=$?

echo "---- 結果"
worst=0
while IFS=$'\t' read -r f rc; do
  echo "$f: 終了コード $rc — $(grep -E '^(全体|エビデンスの検査|止めた)' "$LOG/$f.log" | grep -v '^全体' | head -2 | tr '\n' ' ')"
  grep -E "^$f: 合格" "$LOG/$f.log" | tail -1
  (( rc > worst )) && worst=$rc
done < "$LOG/.done.$$"
rm -f "$LOG/.done.$$"
(( drc > worst )) && worst=$drc
exit $worst

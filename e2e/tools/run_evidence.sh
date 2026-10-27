#!/usr/bin/env bash
# 機能のケースを流して（まとめて・並べて流せる）、エビデンスを作る。
#   tools/run_evidence.sh <機能ID> [番号…] [--todo] [--failed] [--dry-run]
#
#   番号を省くと、その機能でテストコードがあるケースを全部流す（tools/coverage.mjs --list）。
#   --todo     エビデンスがまだ無いか、正本が変わって古くなったケースだけ流す（流し直しを繰り返しても同じ所から続く）
#   --failed   いまのエビデンスが合格でないケースだけ流す（--todo と併用できる。どちらかに当たれば流す）
#   --dry-run  流すケースを出すだけ
#
# - 流すのは tools/pw_run.sh。PW_BATCH 件（既定8）ずつ1回の起動でまとめて流す（共有シードの確かめが1回の起動で1度で済む）。
#   PW_SLOTS（既定1）が2以上なら、ほかの回と同じDBへ並べて流す（依頼者の承認 2026-10-26。3本まで。tools/run_lanes.sh が使う）。
#   共有の設定を書き換えるケース（tools/solo_cases.mjs）は、ほかの回が終わるのを待って1本だけで流す。
#   並べて流して合格でなかったケースは、最後に1本だけで流し直す（ほかの回とぶつかったせいでないことを確かめる）。
#   PW_DEFER_SOLO_FILE を与えると（run_lanes.sh が与える）、1本だけで流すケース（上の2つ）をその場で流さず、そのファイルへ
#   「機能ID<TAB>番号<TAB>わけ」を書き足す。全体を止める回数が減る（単独の回は、並べている回がすべて今のまとまりを終えるまで
#   待つので、そのたびにほかの2本が止まる）。書き留めた分は tools/run_deferred.sh が最後に1本ずつ流す（2026-10-26）。
#   並べて合格でなかったケースは、まとまり（pw_run.sh の1回）ごとに書き留める（途中で止めても漏れない。2026-10-27）。
#   実行中の run_lanes.sh に途中から効かせるときは、印のファイル .runs/lanes/defer_solo を置く（書き足す先は .runs/lanes/deferred.tsv）。
#   pw_run.sh の1回の予算（PW_BUDGET_SEC）が尽きて残りが出たら、残りで呼び直す。呼ぶ側の時間の制限があるとき（担当のコマンドの制限など）は、このスクリプトを裏で流す。
# - 流す前と、spec ごとに、接続先が応答するかを確かめる。応答しなければ止める（環境の停止で全件が未判定になるのを防ぐ）。
# - 終わったら evidence_index.mjs で一覧を作り直し、evidence_check.mjs で記録の形を検査する。
# - 終了コード: 0＝流し終えた（合否は問わない）／1＝エビデンスの検査で誤り／3＝環境・ロックで止めた／4＝エビデンスが書かれなかったケースがある
# - 手元のマシンが重くなりやすいので、低い優先度で流す（nice）。
set -u
ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT" || exit 1
fid=""; nums=(); todo=0; failed=0; dry=0
for a in "$@"; do
  case "$a" in
    --todo) todo=1 ;;
    --failed) failed=1 ;;
    --dry-run) dry=1 ;;
    -*) echo "知らないオプション: $a" >&2; exit 2 ;;
    *) if [ -z "$fid" ]; then fid=$a; else nums+=("$a"); fi ;;
  esac
done
if ! [[ "$fid" =~ ^[A-Z][0-9]{2}-[0-9]{2}$ ]]; then
  echo "使い方: tools/run_evidence.sh <機能ID> [番号…] [--todo] [--failed] [--dry-run]" >&2
  exit 2
fi
EVID=${E2E_EVIDENCE_DIR:-$ROOT/evidence}
export PW_BUDGET_SEC=${PW_BUDGET_SEC:-3600}
export PW_BATCH=${PW_BATCH:-8}
SLOTS=${PW_SLOTS:-1}
DEFER=${PW_DEFER_SOLO_FILE:-}
if [ -z "$DEFER" ] && [ "$SLOTS" -gt 1 ] && [ -f "$ROOT/.runs/lanes/defer_solo" ]; then DEFER=$ROOT/.runs/lanes/deferred.tsv; fi
[ "$SLOTS" -gt 1 ] || DEFER=""
# 受け持ちの印（run_lanes.sh が PW_LANE_CLAIM_DIR を与える）: 機能を流し始める前に印を作る。印がもうあれば、ほかのレーンが
# 受け持ったので流さずに終える（レーンの長さの偏りを、先に空いたレーンが残りを引き取って埋める。2026-10-26）
CLAIM=${PW_LANE_CLAIM_DIR:-}
if [ -z "$CLAIM" ] && [ "$SLOTS" -gt 1 ] && [ -f "$ROOT/.runs/lanes/defer_solo" ]; then CLAIM=$ROOT/.runs/lanes/claimed; fi
if [ -n "$CLAIM" ] && [ $dry -eq 0 ]; then
  mkdir -p "$CLAIM"
  if ! mkdir "$CLAIM/$fid" 2>/dev/null; then echo "$fid: ほかのレーンが受け持った（$CLAIM）。流さない"; exit 0; fi
fi
defer() { # <わけ> <番号…>
  local why=$1 n; shift
  for n in "$@"; do printf '%s\t%s\t%s\n' "$fid" "$n" "$why" >> "$DEFER"; done
  echo "あとで1本だけで流す（$why）: $*（書き留めた: $DEFER）"
}

# テストがあるケース（テストID<TAB>spec）
list=$(node tools/coverage.mjs --list "$fid") || { echo "テストコードの形に誤りがある（node tools/coverage.mjs $fid で確かめる）" >&2; exit 1; }
if [ -z "$list" ]; then echo "$fid にはテストコードのあるケースが無い" >&2; exit 1; fi

# 指定の番号に絞る
if [ ${#nums[@]} -gt 0 ]; then
  pat=$(printf "IT-$fid-%s\t|" "${nums[@]}"); pat=${pat%|}
  sel=$(echo "$list" | grep -E "^($pat)") || true
  for n in "${nums[@]}"; do echo "$sel" | grep -q "^IT-$fid-$n	" || echo "テストコードが無い: IT-$fid-$n（飛ばす）" >&2; done
  list=$sel
fi

# --todo / --failed: いまのエビデンスの状態で絞る
if [ $todo -eq 1 ] || [ $failed -eq 1 ]; then
  node tools/evidence_index.mjs --quiet "$fid" >/dev/null
  res="$EVID/$fid/results.tsv"
  list=$(echo "$list" | while IFS=$'\t' read -r id spec; do
    [ -z "$id" ] && continue
    row=$([ -f "$res" ] && awk -F'\t' -v id="$id" 'NR>1 && $1==id' "$res")
    if [ -z "$row" ]; then [ $todo -eq 1 ] && printf '%s\t%s\n' "$id" "$spec"; continue; fi
    result=$(echo "$row" | cut -f6); fresh=$(echo "$row" | cut -f13)
    if { [ $todo -eq 1 ] && [ "$fresh" != "一致" ]; } || { [ $failed -eq 1 ] && [ "$result" != "合格" ]; }; then printf '%s\t%s\n' "$id" "$spec"; fi
  done)
fi
if [ -z "$list" ]; then echo "$fid: 流すケースは無い"; node tools/evidence_index.mjs "$fid"; exit 0; fi
echo "$fid: 流すケース $(echo "$list" | wc -l)件"
if [ $dry -eq 1 ]; then echo "$list"; exit 0; fi

# 接続先が応答するか（手元の環境は止まることがある。HANDOFF_codex.md「手元環境の注意」）
base=${E2E_BASE_URL:-}
if [ -z "$base" ] && [ "${E2E_ENV:-local}" = "local" ]; then base=http://localhost:8000; fi
alive() {
  [ -z "$base" ] && return 0
  local code
  code=$(curl -ks -o /dev/null -m 60 -w '%{http_code}' "$base/${E2E_ADMIN_ROUTE:-admin}/login") || true
  [ "$code" = "200" ]
}

stopped=""
missing=()
# run_group <単独なら1> <spec> <番号…>: 流し終える（残りが出たら呼び直す）。止めたら 1 を返す
run_group() {
  local solo=$1 spec=$2; shift 2
  local todo_nums="$*" same=0 t0 out prc back prev n r
  while [ -n "${todo_nums// /}" ]; do
    if ! alive; then stopped="接続先 $base が応答しない（ログイン画面が200を返さない）。残り: $spec $todo_nums"; return 1; fi
    t0=$(date +%s)
    # shellcheck disable=SC2086
    out=$(PW_SOLO=$solo PW_SLOTS=$SLOTS nice -n 10 tools/pw_run.sh "$fid" "$spec" $todo_nums); prc=$?
    echo "$out" | grep -E '^(DONE|BUSY):' | { [ "$solo" = 1 ] && sed 's/$/ （単独）/' || cat; }
    if [ $prc -ne 0 ]; then stopped="pw_run.sh が終了コード $prc で終わった。残り: $spec $todo_nums"; return 1; fi
    # 頼んだ番号はすべて、流し終えた（DONE）か残り（REMAINING）として返ってくること
    back=" $(echo "$out" | sed -n 's/^DONE: \([^ ]*\) .*/\1/p' | tr '\n' ' ') $(echo "$out" | sed -n 's/^REMAINING: //p') "
    for n in $todo_nums; do
      case "$back" in *" $n "*) ;; *) missing+=("$n"); echo "pw_run.sh が結果を返さなかった: IT-$fid-$n" >&2 ;; esac
    done
    # 流し終えたケースに、この呼び出しで書かれたエビデンスがあること（テストが選ばれなかった・記録を書けなかった を見逃さない）
    for n in $(echo "$out" | sed -n 's/^DONE: \([^ ]*\) .*/\1/p'); do
      r="$EVID/$fid/IT-$fid-$n/result.json"
      if [ ! -f "$r" ] || [ "$(stat -c %Y "$r")" -lt "$t0" ]; then missing+=("$n"); echo "エビデンスが書かれていない: IT-$fid-$n（.runs のログを見る）" >&2; fi
    done
    # 並べて流しているときは、合格でなかったケースをまとまりごとに書き留める（機能の終わりまで待つと、途中で止めたときに漏れる。2026-10-27）
    if [ "$solo" != 1 ] && [ -n "$DEFER" ]; then
      local ng=()
      for n in $(echo "$out" | sed -n 's/^DONE: \([^ ]*\) .*/\1/p'); do
        r="$EVID/$fid/IT-$fid-$n/result.json"
        [ -f "$r" ] && [ "$(stat -c %Y "$r")" -ge "$t0" ] || continue
        [ "$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf-8")).結果)' "$r")" = "合格" ] || ng+=("$n")
      done
      [ ${#ng[@]} -gt 0 ] && defer "並べて合格でなかった" "${ng[@]}"
    fi
    prev=$todo_nums
    todo_nums=$(echo "$out" | sed -n 's/^REMAINING: //p')
    # ほかの実行がロックを持ち続けているなど、1件も進まないことが3回続いたら止める
    if [ "$todo_nums" = "$prev" ]; then same=$((same + 1)); else same=0; fi
    if [ $same -ge 3 ]; then stopped="ロックが取れず進まない（ほかの Playwright が流れていないか確かめる）。残り: $spec $todo_nums"; return 1; fi
  done
  return 0
}

solo_ids=" $(node tools/solo_cases.mjs "$fid" | tr '\n' ' ') "
nums_of() { # <spec> <単独なら1>
  echo "$list" | awk -F'\t' -v s="$1" '$2==s {print $1}' | while read -r id; do
    case "$solo_ids" in *" $id "*) [ "$2" = 1 ] && echo "${id#IT-$fid-}" ;; *) [ "$2" = 0 ] && echo "${id#IT-$fid-}" ;; esac
  done | tr '\n' ' '
}
run_t0=$(date +%s)
for spec in $(echo "$list" | cut -f2 | sort -u); do
  for solo in 0 1; do
    ns=$(nums_of "$spec" $solo)
    [ -n "${ns// /}" ] || continue
    # shellcheck disable=SC2086
    if [ "$solo" = 1 ] && [ -n "$DEFER" ]; then defer "単独のケース" $ns; continue; fi
    # shellcheck disable=SC2086
    run_group "$solo" "$spec" $ns || break 2
  done
done

# 並べて流して合格でなかったケースは、1本だけで流し直す
# （書き留める形のときは、まとまりごとに書き留め済み）
if [ -z "$stopped" ] && [ "$SLOTS" -gt 1 ] && [ -z "$DEFER" ]; then
  for spec in $(echo "$list" | cut -f2 | sort -u); do
    again=()
    for n in $(nums_of "$spec" 0); do
      r="$EVID/$fid/IT-$fid-$n/result.json"
      [ -f "$r" ] && [ "$(stat -c %Y "$r")" -ge "$run_t0" ] || continue
      [ "$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf-8")).結果)' "$r")" = "合格" ] || again+=("$n")
    done
    [ ${#again[@]} -gt 0 ] || continue
    echo "並べて流して合格でなかった ${#again[@]}件を、1本だけで流し直す: ${again[*]}"
    run_group 1 "$spec" "${again[@]}" || break
  done
fi

node tools/evidence_index.mjs "$fid"
node tools/evidence_check.mjs "$fid"; checked=$?
# 終了コード: 3＝環境・ロックで止めた／4＝エビデンスが書かれなかったケースがある／1＝エビデンスの検査で誤り／0＝流し終えた（合否は問わない）
if [ -n "$stopped" ]; then echo "止めた: $stopped" >&2; exit 3; fi
if [ ${#missing[@]} -gt 0 ]; then echo "エビデンスが書かれなかった: ${missing[*]}" >&2; exit 4; fi
exit $checked

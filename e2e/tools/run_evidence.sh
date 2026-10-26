#!/usr/bin/env bash
# 機能のケースを1件ずつ流して、エビデンスを作る。
#   tools/run_evidence.sh <機能ID> [番号…] [--todo] [--failed] [--dry-run]
#
#   番号を省くと、その機能でテストコードがあるケースを全部流す（tools/coverage.mjs --list）。
#   --todo     エビデンスがまだ無いか、正本が変わって古くなったケースだけ流す（流し直しを繰り返しても同じ所から続く）
#   --failed   いまのエビデンスが合格でないケースだけ流す（--todo と併用できる。どちらかに当たれば流す）
#   --dry-run  流すケースを出すだけ
#
# - 流すのは tools/pw_run.sh（ロックで全体1本・1件ずつ）。pw_run.sh の1回の予算（PW_BUDGET_SEC）が尽きて残りが出たら、
#   残りで呼び直す。呼ぶ側の時間の制限があるとき（担当のコマンドの制限など）は、このスクリプトを裏で流す。
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
for spec in $(echo "$list" | cut -f2 | sort -u); do
  todo_nums=$(echo "$list" | awk -F'\t' -v s="$spec" '$2==s {print $1}' | sed "s/^IT-$fid-//" | tr '\n' ' ')
  same=0
  while [ -n "${todo_nums// /}" ]; do
    if ! alive; then stopped="接続先 $base が応答しない（ログイン画面が200を返さない）。残り: $spec $todo_nums"; break 2; fi
    t0=$(date +%s)
    # shellcheck disable=SC2086
    out=$(nice -n 10 tools/pw_run.sh "$fid" "$spec" $todo_nums); prc=$?
    echo "$out" | grep -E '^(DONE|BUSY):'
    if [ $prc -ne 0 ]; then stopped="pw_run.sh が終了コード $prc で終わった。残り: $spec $todo_nums"; break 2; fi
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
    prev=$todo_nums
    todo_nums=$(echo "$out" | sed -n 's/^REMAINING: //p')
    # ほかの実行がロックを持ち続けているなど、1件も進まないことが3回続いたら止める
    if [ "$todo_nums" = "$prev" ]; then same=$((same + 1)); else same=0; fi
    if [ $same -ge 3 ]; then stopped="ロックが取れず進まない（ほかの Playwright が流れていないか確かめる）。残り: $spec $todo_nums"; break 2; fi
  done
done

node tools/evidence_index.mjs "$fid"
node tools/evidence_check.mjs "$fid"; checked=$?
# 終了コード: 3＝環境・ロックで止めた／4＝エビデンスが書かれなかったケースがある／1＝エビデンスの検査で誤り／0＝流し終えた（合否は問わない）
if [ -n "$stopped" ]; then echo "止めた: $stopped" >&2; exit 3; fi
if [ ${#missing[@]} -gt 0 ]; then echo "エビデンスが書かれなかった: ${missing[*]}" >&2; exit 4; fi
exit $checked

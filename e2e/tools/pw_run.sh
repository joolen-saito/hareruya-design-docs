#!/usr/bin/env bash
# Playwright をロックを取って流す。 tools/pw_run.sh <機能ID> <spec（e2e からの相対パス）> <番号…>
#
# - 並べて流せるのは同じDBへ PW_SLOTS 本まで（既定1。依頼者の承認 2026-10-26 で3本まで）。ロックは tools/pw_lock.sh。
#   PW_SOLO=1 の回は、ほかの回が終わるのを待って1本だけで流す（共有の設定を書き換えるケースなど。tools/solo_cases.mjs）。
#   test-results は枠ごと（.runs/slot-<枠>/test-results）。1本目の test-results を2本目が消さない。
# - PW_BATCH 件（既定1）を1回の起動でまとめて流す。起動・ログ掃除が1回で済み、共有シードは1回の起動で1度だけ作る・確かめる
#   （lib/seeds.ts。依頼者の承認 2026-10-26）。ケースごとの結果は JSON の報告から読む。
# - ロック待ちを含めて PW_BUDGET_SEC 秒（既定300）を過ぎたら、次のまとまりを始めず「REMAINING: 番号…」を出す。
#   ロックが取れずに予算が尽きたまとまりは「BUSY: 番号」を出す。出た番号で呼び直す。
# - テスト1件の制限時間は PW_TIMEOUT_MS（既定1800000。手元の環境が遅く、設定ファイルの900秒では環境のせいの時間切れが出る）。
# - まとまりごとのログは .runs/<機能>-<先頭の番号>[_<末尾の番号>].log、結果は .json、test-results の写しは .runs/results-<同じ名前>/。
# - 出力: ケースごとに「DONE: 番号 rc=終了コード 1 passed|failed|skipped|…」（結果が無ければ「結果なし」）。
# - HTML レポートは作らない。エビデンスは evidence/<機能>/<テストID>/ に書き出す（lib/evidence_reporter.ts）。
set -u
ROOT=$(cd "$(dirname "$0")/.." && pwd)
OUT=${PW_RUN_DIR:-$ROOT/.runs}
BUDGET=${PW_BUDGET_SEC:-300}
TIMEOUT=${PW_TIMEOUT_MS:-1800000}
SLOTS=${PW_SLOTS:-1}
SOLO=${PW_SOLO:-0}
BATCH=${PW_BATCH:-1}
if [ $# -lt 3 ]; then
  echo "使い方: tools/pw_run.sh <機能ID> <spec> <番号…>" >&2
  exit 2
fi
(( SLOTS >= 1 && SLOTS <= 3 )) || { echo "PW_SLOTS は1〜3（依頼者の承認は3本まで）" >&2; exit 2; }
(( BATCH >= 1 )) || BATCH=1
# 1本で流す回（PW_SLOTS=1）は、ほかの回と並べない（ほかの回が終わるのを待つ）。並べるのは PW_SLOTS を2以上にした回どうしだけ
(( SLOTS == 1 )) && SOLO=1
fid=$1; spec=$2; shift 2
tag=$(echo "$fid" | tr -d '-' | tr 'A-Z' 'a-z')
mkdir -p "$OUT"
# shellcheck source=pw_lock.sh
. "$ROOT/tools/pw_lock.sh"

# JSON の報告から、まとまりの番号ごとの結果（passed など）を出す
results_of() { # <json> <番号…>
  node -e '
    const fs = require("fs");
    const [file, fid, ...nums] = process.argv.slice(1);
    let j = null; try { j = JSON.parse(fs.readFileSync(file, "utf-8")); } catch {}
    const got = new Map();
    const walk = (s) => { for (const sp of s.specs ?? []) for (const t of sp.tests ?? []) {
      const tags = [...(sp.tags ?? []), ...(t.tags ?? [])].map((x) => x.replace(/^@/, ""));
      for (const n of nums) if (tags.includes(`IT-${fid}-${n}`)) { const r = t.results ?? []; got.set(n, r.length ? r[r.length - 1].status : "did not run"); }
    } for (const c of s.suites ?? []) walk(c); };
    if (j) for (const s of j.suites ?? []) walk(s);
    for (const n of nums) console.log(`${n}\t${got.get(n) ?? ""}`);
  ' "$@"
}

start=$(date +%s)
remaining=()
all=("$@")
for ((i = 0; i < ${#all[@]}; i += BATCH)); do
  chunk=("${all[@]:i:BATCH}")
  now=$(date +%s)
  if (( now - start >= BUDGET )); then remaining+=("${chunk[@]}"); continue; fi
  wait=$(( BUDGET - (now - start) ))
  name="$tag-${chunk[0]}"; (( ${#chunk[@]} > 1 )) && name="$name"_"${chunk[-1]}"
  log="$OUT/$name.log"; json="$OUT/$name.json"
  pat=$(IFS='|'; echo "${chunk[*]}")

  # 手元の localstack にログがたまっていたら消す（tools/cw_logs_clear.sh。消す間は1本だけ）。消す量を超えたら、全体の手が空いて
  # いれば消す（10秒だけ待つ）。上限を超えたら60秒だけ待ち、手が空かなければロックなしで消す。単独の回は、始めにロックを持ったまま消す
  if [ "$SOLO" != 1 ]; then
    if "$ROOT/tools/cw_logs_clear.sh" --needed-hard; then
      CW_LOCK_WAIT=60 "$ROOT/tools/cw_logs_clear.sh" >/dev/null 2>&1 || "$ROOT/tools/cw_logs_clear.sh" --no-lock >/dev/null || true
    elif "$ROOT/tools/cw_logs_clear.sh" --needed; then CW_LOCK_WAIT=10 "$ROOT/tools/cw_logs_clear.sh" >/dev/null 2>&1 || true
    fi
  fi

  if [ "$SOLO" = 1 ]; then pw_lock_exclusive "$wait"; else pw_lock_shared "$wait" "$SLOTS"; fi
  if [ $? -ne 0 ]; then echo "BUSY: ${chunk[*]}"; remaining+=("${chunk[@]}"); continue; fi
  slot=$PW_LOCK_SLOT
  (
    cd "$ROOT" || exit 1
    [ "$SOLO" = 1 ] && "$ROOT/tools/cw_logs_clear.sh" --locked
    mode="単独"; [ "$SOLO" != 1 ] && (( SLOTS > 1 )) && mode="並列（枠${slot}・同時に${SLOTS}本まで）"
    E2E_RUN_MODE="$mode" PLAYWRIGHT_JSON_OUTPUT_NAME="$json" PLAYWRIGHT_JSON_OUTPUT_FILE="$json" \
      npx playwright test "$spec" -g "@IT-$fid-($pat)( |\$)" --timeout "$TIMEOUT" --output "$OUT/slot-$slot/test-results" \
      --reporter=list,json,./lib/evidence_reporter.ts > "$log" 2>&1
    rc=$?
    rm -rf "$OUT/results-$name"
    [ -d "$OUT/slot-$slot/test-results" ] && cp -r "$OUT/slot-$slot/test-results" "$OUT/results-$name"
    while IFS=$'\t' read -r n st; do
      case "$st" in
        passed|skipped) crc=0 ;;
        "") crc=$rc; st="結果なし" ;;
        *) crc=1 ;;
      esac
      [ "$st" = "timedOut" ] && st="failed（時間切れ）"
      echo "DONE: $n rc=$crc 1 $st"
    done < <(results_of "$json" "$fid" "${chunk[@]}")
  )
  pw_lock_release
done
if [ ${#remaining[@]} -gt 0 ]; then echo "REMAINING: ${remaining[*]}"; fi

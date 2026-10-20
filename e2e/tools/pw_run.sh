#!/usr/bin/env bash
# Playwright をロックで1件ずつ流す。 tools/pw_run.sh <機能ID> <spec（e2e からの相対パス）> <番号…>
#
# 複数の担当（ワークフローの各担当など）から同時に呼んでも、Playwright は全体で1本だけ動く
# （test-results を取り合うと結果が壊れる。HANDOFF_codex.md 2章）。
# - 1件ごとにロック（.runs/playwright.lock）を取る。ロック待ちを含めて PW_BUDGET_SEC 秒（既定300）を過ぎたら
#   次のケースを始めず「REMAINING: 番号…」を出す（呼ぶ側の1回の制限時間を超えないように）。
#   ロックが取れずに予算が尽きたケースは「BUSY: 番号」を出す。出た番号で呼び直す。
# - テスト1件の制限時間は PW_TIMEOUT_MS（既定1800000。手元の環境が遅く、設定ファイルの900秒では環境のせいの時間切れが出る）。
# - 1件ごとのログは .runs/<機能>-<番号>.log、結果は .json、その回の test-results の写しは .runs/results-<機能>-<番号>/。
# - HTML レポートは作らない（他の実行のレポートを上書きしないため）。
set -u
ROOT=$(cd "$(dirname "$0")/.." && pwd)
OUT=${PW_RUN_DIR:-$ROOT/.runs}
LOCK=${PW_LOCK:-$OUT/playwright.lock}
BUDGET=${PW_BUDGET_SEC:-300}
TIMEOUT=${PW_TIMEOUT_MS:-1800000}
if [ $# -lt 3 ]; then
  echo "使い方: tools/pw_run.sh <機能ID> <spec> <番号…>" >&2
  exit 2
fi
fid=$1; spec=$2; shift 2
tag=$(echo "$fid" | tr -d '-' | tr 'A-Z' 'a-z')
mkdir -p "$OUT"
start=$(date +%s)
remaining=()
for n in "$@"; do
  now=$(date +%s)
  if (( now - start >= BUDGET )); then remaining+=("$n"); continue; fi
  wait=$(( BUDGET - (now - start) ))
  log="$OUT/$tag-$n.log"
  json="$OUT/$tag-$n.json"
  (
    flock -w "$wait" 9 || exit 75
    cd "$ROOT" || exit 1
    # 手元の localstack にログがたまっていたら、流す前に消す（tools/cw_logs_clear.sh。ロックは持ったまま）
    "$ROOT/tools/cw_logs_clear.sh" --locked
    PLAYWRIGHT_JSON_OUTPUT_NAME="$json" PLAYWRIGHT_JSON_OUTPUT_FILE="$json" \
      npx playwright test "$spec" -g "IT-$fid-$n" --timeout "$TIMEOUT" --reporter=list,json > "$log" 2>&1
    rc=$?
    rm -rf "$OUT/results-$tag-$n"
    [ -d test-results ] && cp -r test-results "$OUT/results-$tag-$n"
    echo "DONE: $n rc=$rc $(grep -Eo '[0-9]+ (passed|failed|skipped|flaky|did not run)' "$log" | tr '\n' ' ')"
  ) 9>"$LOCK"
  rc=$?
  if [ $rc -eq 75 ]; then echo "BUSY: $n"; remaining+=("$n"); fi
done
if [ ${#remaining[@]} -gt 0 ]; then echo "REMAINING: ${remaining[*]}"; fi

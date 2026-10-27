#!/usr/bin/env bash
# 前回の実行で残った売上分析タグを、名称で探して管理画面から削除する（依頼者決定 2026-10-27）。
#   tools/remove_sales_analysis_tags.sh <名称>...
# ほかの回とぶつからないよう、ほかの Playwright が終わるのを待って1本だけで流す（tools/pw_lock.sh の排他）。消したタグは機能の記録に書くこと。
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
[ $# -ge 1 ] || { echo "使い方: $0 <名称>..." >&2; exit 2; }
mkdir -p "$ROOT/.runs"
cd "$ROOT"
IFS=, ; names="$*"; unset IFS
# shellcheck source=pw_lock.sh
. "$ROOT/tools/pw_lock.sh"
pw_lock_exclusive "${PW_LOCK_WAIT:-3600}" || { echo "ロックが空かない" >&2; exit 75; }
E2E_REMOVE_SALES_TAG_NAMES="$names" E2E_RUN_MODE="保守" nice -n 10 npx playwright test -c tools/maint/playwright.config.ts remove_sales_analysis_tags.maint.ts

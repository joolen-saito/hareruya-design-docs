#!/usr/bin/env bash
# 前回の実行で残った商品を、商品コードで探して管理画面から「完全に削除」する（依頼者決定 2026-10-26）。
#   tools/remove_products.sh <商品コード>...
# ほかの回とぶつからないよう、ほかの Playwright が終わるのを待って1本だけで流す（tools/pw_lock.sh の排他）。消した商品は機能の記録に書くこと。
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
[ $# -ge 1 ] || { echo "使い方: $0 <商品コード>..." >&2; exit 2; }
mkdir -p "$ROOT/.runs"
cd "$ROOT"
IFS=, ; codes="$*"; unset IFS
# shellcheck source=pw_lock.sh
. "$ROOT/tools/pw_lock.sh"
pw_lock_exclusive "${PW_LOCK_WAIT:-3600}" || { echo "ロックが空かない" >&2; exit 75; }
E2E_REMOVE_PRODUCT_CODES="$codes" E2E_RUN_MODE="保守" nice -n 10 npx playwright test -c tools/maint/playwright.config.ts remove_products.maint.ts

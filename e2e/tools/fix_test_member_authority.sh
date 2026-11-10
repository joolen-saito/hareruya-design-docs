#!/usr/bin/env bash
# E2E が作った試験用メンバーの権限を、メンバー編集画面で直す。ほかの Playwright が終わるのを待って1本だけで流す。
#   tools/fix_test_member_authority.sh <管理者ID> <名前の先頭> <権限名>
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
[ $# -eq 3 ] || { echo "使い方: $0 <管理者ID> <名前の先頭> <権限名>" >&2; exit 2; }
mkdir -p "$ROOT/.runs"
cd "$ROOT"
. "$ROOT/tools/pw_lock.sh"
pw_lock_exclusive "${PW_LOCK_WAIT:-3600}" || { echo "ロックが空かない" >&2; exit 75; }
E2E_FIX_MEMBER_ID="$1" E2E_FIX_MEMBER_NAME_PREFIX="$2" E2E_FIX_MEMBER_AUTHORITY="$3" E2E_RUN_MODE="保守" nice -n 10 npx playwright test -c tools/maint/playwright.config.ts fix_test_member_authority.maint.ts

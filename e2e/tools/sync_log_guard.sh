#!/usr/bin/env bash
# 手元のアプリのコンテナで、毎分のファイル同期が出す「ログの書き込み」（aws logs ...）が重なったら、古いものから止める。
#   tools/sync_log_guard.sh [--once] [--dry-run]
#
# なぜ: 同期の処理（/usr/local/bin/file_sync_command。cron で毎分）は、結果を1行ごとに aws logs put-log-events で
#   localstack の開発用ログへ書く。1回は普段1秒ほどだが、テストで重くなると1分で終わらなくなり、次の回と重なって
#   さらに重くなる（2026-10-31〜11-01 に、起こし直しから2〜3時間で負荷20〜67まで上がり、自然には戻らなかった）。
#   重なった書き込みを止めれば、この悪循環が切れる。欠けるのは開発用の同期ログの行だけで、E2E はこのログを読まない。
#   依頼者の了承: 2026-11-02「1で進めて」（重なった書き込みだけを止める仕組みを入れてよい）。
# - 止めるのは、アプリのコンテナの中の「aws logs」のコマンド（put-log-events・describe-log-streams・create-log-stream）で、
#   動き始めてから GUARD_MAX_AGE 秒（既定 30）を超えたものだけ。ファイル同期の本体（aws s3 sync）・アプリ・DB には触らない。
# - --once: 1回だけ見て終わる。付けなければ GUARD_INTERVAL 秒（既定 20）ごとに見続ける。
# - --dry-run: 止めずに、止める対象を記録だけする。
# - 手元の環境（E2E_ENV が空か local）でだけ動く。記録は .runs/sync_log_guard.log（止めたときと、異常のときだけ書く）。
set -u
cd "$(dirname "$0")/.." || exit 1
[ -n "${E2E_ENV:-}" ] && [ "${E2E_ENV}" != "local" ] && { echo "手元の環境でないので何もしない"; exit 0; }
APP="${GUARD_APP_CONTAINER:-ec-cube-enterprise-ec-cube-1}"
MAX_AGE="${GUARD_MAX_AGE:-30}"
INTERVAL="${GUARD_INTERVAL:-20}"
LOG=.runs/sync_log_guard.log
ONCE=0; DRY=0
for a in "$@"; do case "$a" in --once) ONCE=1;; --dry-run) DRY=1;; esac; done
mkdir -p .runs

check() {
  # コンテナの中で: 動いている秒・PID・コマンドを出し、aws logs の古いものを選ぶ
  local list
  list=$(timeout 30 docker exec "$APP" sh -c "ps -eo pid=,etimes=,args= | grep -E '/usr/local/bin/aws logs (put-log-events|describe-log-streams|create-log-stream)' | grep -v grep" 2>/dev/null) || return 0
  [ -z "$list" ] && return 0
  local old pids n
  old=$(printf '%s\n' "$list" | awk -v m="$MAX_AGE" '$2+0 > m+0 {print $1}')
  [ -z "$old" ] && return 0
  pids=$(printf '%s ' $old); n=$(printf '%s\n' $old | wc -l)
  if [ "$DRY" = 1 ]; then
    echo "$(date '+%F %T') 止める対象 ${n}本（--dry-run で止めない）: $pids" >> "$LOG"
  else
    timeout 30 docker exec "$APP" sh -c "kill $pids" 2>/dev/null
    echo "$(date '+%F %T') 止めた: ログの書き込み ${n}本（${MAX_AGE}秒超え）load=$(cut -d' ' -f1 /proc/loadavg)" >> "$LOG"
  fi
}

if [ "$ONCE" = 1 ]; then check; exit 0; fi
while true; do check; sleep "$INTERVAL"; done

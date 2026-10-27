#!/usr/bin/env bash
# 手元の localstack にたまったアプリのログ群（監査ログ・開発者ログ）を消す。 tools/cw_logs_clear.sh [--force] [--locked] [--needed|--needed-hard]
#
# なぜ: アプリ（開発用の設定）は要求ごとに localstack のログ群を問い合わせる。ログがたまるとこの問い合わせが遅くなり
#   （約110MBで1回2.6秒）、画面がまるごと遅くなる。テストを流すと1時間半ほどでそうなる。
#   ログ群を消すと、アプリのログの部品（vendor/phpnexus/cwh の CloudWatch。createGroup の既定は true）が次の要求で作り直す。
#   ファイル置き場（S3）とコンテナには触らない。消えるのは手元の開発用のログだけ。E2E はこのログを読まない。
#   依頼者の了承: 2026-10-20 11:45（遅くなるたびに消してよい）。
# - S3同期のログ群（/ecs/dev-s3-sync-cron-logs-group）も消す（依頼者の了承: 2026-10-22）。
#   アプリのコンテナが毎分の同期の結果を1行ごとに書く。たまると書き込みが詰まって同期が積み重なり、
#   環境が止まった（2026-10-21 20:57・10-22 04:45。どちらも再起動から4〜5時間）。
#   同期の処理はログ群を自分で作らない（localstack の起動時に作るだけ）ので、消したらすぐ作り直す。
#   CW_SYNC_CLEAR_BYTES（既定 5000000）を超えたときだけ消す。--force なら量によらず消す。
# - S3同期の古い鍵（アプリのコンテナの /var/tmp/eccube-enterprise-sync-lock）も、書かれた PID のプロセスが
#   コンテナの中に無いときだけ消す（依頼者の了承: 2026-10-23）。マシンの再起動で鍵が残ると、毎分の同期が
#   鍵を取れずに失敗して積み重なり、CPU を使い切った（10/22 09:36〜22:15）。--force でも生きている鍵は消さない。
# - Playwright と同じロック（.runs/playwright.lock）を取ってから消す（テストの要求の途中で消さない）。
#   pw_run.sh のようにロックを持ったまま呼ぶときは --locked。ロックは tools/pw_lock.sh の排他（並べて流している回が終わるのを待つ）。
# - --needed: 消さずに、消す量までたまっているかだけを答える（たまっていれば終了コード0、いなければ1）。ロックを取らない。
# - --needed-hard: --needed と同じく答えるだけ。量は上限（CW_CLEAR_HARD_BYTES、既定 40000000・S3同期は CW_SYNC_CLEAR_HARD_BYTES、
#   既定 15000000）。並べて流す回（pw_run.sh）は、消す量（下）を超えたら「全体の手が空いていれば消す」（CW_LOCK_WAIT 秒だけ待つ）、
#   上限を超えたら全体を止めて消す（並べて流す回が終わるのを待つ）。止める回数を減らすため（2026-10-26）。
# - CW_LOCK_WAIT: ロックを待つ秒（既定 1800）。取れなければ消さずに終了コード 75。
# - --no-lock: ロックを取らずに消す（並べて流している最中でも）。pw_run.sh が上限を超えて60秒待っても手が空かないときに使う
#   （2026-10-26。上限のたびに長いまとまりが終わるまで3本とも止まった）。アプリのログの部品は、ログ群が消えても要求の終わりの
#   送信でエラーを記録するだけで（vendor/phpnexus/cwh の CloudWatch.php flushBuffer）、画面への応答はその前に返している。
#   それでも落ちたケースは、並べた回の流し直し（単独）で確かめ直す。記録に「ロックなし」と書く。
# - 2つのログ群の合計が CW_CLEAR_BYTES（既定 20000000）を超えたときだけ消す。--force なら量によらず消す。
# - 手元の環境（E2E_ENV が空か local）で、localstack のコンテナが動いているときだけ動く。それ以外は何もしない。
# - 記録は .runs/cw_logs_clear.log。
set -u
ROOT=$(cd "$(dirname "$0")/.." && pwd)
OUT=${PW_RUN_DIR:-$ROOT/.runs}
LOCK=${PW_LOCK:-$OUT/playwright.lock}
LIMIT=${CW_CLEAR_BYTES:-20000000}
CONTAINER=${CW_LOCALSTACK_CONTAINER:-localstack}
GROUPS_TO_CLEAR=(/ecs/dev-eccube-audit-logs /ecs/dev-eccube-developer-logs)
SYNC_GROUP=/ecs/dev-s3-sync-cron-logs-group
SYNC_LIMIT=${CW_SYNC_CLEAR_BYTES:-5000000}
APP_CONTAINER=${CW_APP_CONTAINER:-ec-cube-enterprise-ec-cube-1}
SYNC_LOCKFILE=/var/tmp/eccube-enterprise-sync-lock
force=0; locked=0; needed=0; hard=0; nolock=0
for a in "$@"; do
  case "$a" in
    --force) force=1 ;;
    --locked) locked=1 ;;
    --needed) needed=1 ;;
    --needed-hard) needed=1; hard=1 ;;
    --no-lock) nolock=1 ;;
    *) echo "使い方: tools/cw_logs_clear.sh [--force] [--locked|--no-lock] [--needed|--needed-hard]" >&2; exit 2 ;;
  esac
done
case "${E2E_ENV:-local}" in local) ;; *) [ "$needed" -eq 1 ] && exit 1; exit 0 ;; esac
docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$CONTAINER" || { [ "$needed" -eq 1 ] && exit 1; exit 0; }
mkdir -p "$OUT"
LOGFILE="$OUT/cw_logs_clear.log"

clear_once() {
  local bytes
  bytes=$(docker exec "$CONTAINER" awslocal logs describe-log-groups \
    --query "sum(logGroups[?logGroupName=='${GROUPS_TO_CLEAR[0]}' || logGroupName=='${GROUPS_TO_CLEAR[1]}'].storedBytes)" \
    --output text 2>/dev/null)
  case "$bytes" in ''|None|null) bytes=0 ;; esac
  bytes=${bytes%.*}
  if [ "$force" -eq 0 ] && [ "$bytes" -le "$LIMIT" ]; then return 0; fi
  local g
  for g in "${GROUPS_TO_CLEAR[@]}"; do
    docker exec "$CONTAINER" awslocal logs delete-log-group --log-group-name "$g" >/dev/null 2>&1
  done
  echo "$(date '+%F %T') 消した: ${GROUPS_TO_CLEAR[*]}（合計 ${bytes} バイト）" | tee -a "$LOGFILE"
}

clear_sync_once() {
  local bytes
  bytes=$(docker exec "$CONTAINER" awslocal logs describe-log-groups \
    --query "sum(logGroups[?logGroupName=='${SYNC_GROUP}'].storedBytes)" \
    --output text 2>/dev/null)
  case "$bytes" in ''|None|null) bytes=0 ;; esac
  bytes=${bytes%.*}
  if [ "$force" -eq 0 ] && [ "$bytes" -le "$SYNC_LIMIT" ]; then return 0; fi
  docker exec "$CONTAINER" awslocal logs delete-log-group --log-group-name "$SYNC_GROUP" >/dev/null 2>&1
  docker exec "$CONTAINER" awslocal logs create-log-group --log-group-name "$SYNC_GROUP" >/dev/null 2>&1
  echo "$(date '+%F %T') 消して作り直した: ${SYNC_GROUP}（${bytes} バイト）" | tee -a "$LOGFILE"
}

clear_stale_sync_lock() {
  docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$APP_CONTAINER" || return 0
  local r
  r=$(docker exec -u root "$APP_CONTAINER" sh -c \
    'f='"$SYNC_LOCKFILE"'; [ -f "$f" ] || exit 0; p=$(cat "$f" 2>/dev/null); case "$p" in ""|*[!0-9]*) exit 0 ;; esac; [ -e "/proc/$p" ] && exit 0; rm -f "$f" && echo "$p"' 2>/dev/null)
  [ -n "$r" ] && echo "$(date '+%F %T') 消した: S3同期の古い鍵（PID ${r} はもう無い）" | tee -a "$LOGFILE"
  return 0
}

stored_bytes() { # <ログ群…>
  local q="" g b
  for g in "$@"; do q="${q:+$q || }logGroupName=='$g'"; done
  b=$(docker exec "$CONTAINER" awslocal logs describe-log-groups --query "sum(logGroups[?$q].storedBytes)" --output text 2>/dev/null)
  case "$b" in ''|None|null) b=0 ;; esac
  echo "${b%.*}"
}

if [ "$needed" -eq 1 ]; then
  lim=$LIMIT; slim=$SYNC_LIMIT
  if [ "$hard" -eq 1 ]; then lim=${CW_CLEAR_HARD_BYTES:-40000000}; slim=${CW_SYNC_CLEAR_HARD_BYTES:-15000000}; fi
  [ "$(stored_bytes "${GROUPS_TO_CLEAR[@]}")" -gt "$lim" ] && exit 0
  [ "$(stored_bytes "$SYNC_GROUP")" -gt "$slim" ] && exit 0
  exit 1
fi

if [ "$nolock" -eq 1 ]; then
  echo "$(date '+%F %T') ロックなしで消す（並べて流している最中）" >> "$LOGFILE"
  clear_stale_sync_lock
  clear_once
  clear_sync_once
elif [ "$locked" -eq 1 ]; then
  clear_stale_sync_lock
  clear_once
  clear_sync_once
else
  # shellcheck source=pw_lock.sh
  . "$ROOT/tools/pw_lock.sh"
  pw_lock_exclusive "${CW_LOCK_WAIT:-1800}" || { echo "ロックが取れない（Playwright が流れている）" >&2; exit 75; }
  clear_stale_sync_lock
  clear_once
  clear_sync_once
  pw_lock_release
fi

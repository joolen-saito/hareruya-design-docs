#!/usr/bin/env bash
# 開発環境の DB へのトンネル（踏み台経由の SSH ポートフォワード）を張り、切れたら張り直す。
#   nohup tools/dev_db_tunnel.sh >/dev/null 2>&1 &     # 見張りとして裏で動かす
#   tools/dev_db_tunnel.sh --once                      # 1回だけ張る（張れていれば何もしない）
# 宛先は git 管理外の .env.dev（E2E_DB_TUNNEL_SSH・_KEY・_REMOTE・_LOCAL）から読む。
# 見張りの記録は .runs/db_tunnel.log。WSL やマシンを起こし直したら、見張りを動かし直す。
set -u
cd "$(dirname "$0")/.." || exit 1
set -a; . ./.env.dev; set +a
: "${E2E_DB_TUNNEL_SSH:?.env.dev に E2E_DB_TUNNEL_SSH が無い}" "${E2E_DB_TUNNEL_REMOTE:?}" "${E2E_DB_TUNNEL_LOCAL:=127.0.0.1:15432}"
key=${E2E_DB_TUNNEL_KEY/#\~/$HOME}
host=${E2E_DB_TUNNEL_LOCAL%:*}; port=${E2E_DB_TUNNEL_LOCAL##*:}
mkdir -p .runs; LOG=.runs/db_tunnel.log
up() { (echo > "/dev/tcp/$host/$port") 2>/dev/null; }
open_tunnel() {
  up && return 0
  echo "$(date '+%F %T') 張る" >> "$LOG"
  ssh -i "$key" -o BatchMode=yes -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -o ServerAliveCountMax=4 -f -N \
    -L "$E2E_DB_TUNNEL_LOCAL:$E2E_DB_TUNNEL_REMOTE" "$E2E_DB_TUNNEL_SSH" >> "$LOG" 2>&1
}
if [ "${1:-}" = "--once" ]; then open_tunnel; up; exit $?; fi
while true; do open_tunnel; sleep 30; done

#!/usr/bin/env bash
# エビデンスを1つの圧縮ファイルに固める（渡す・控えるため）。
#   tools/evidence_pack.sh [機能ID…]      省くと evidence/ にある全機能
# 出力: evidence/_packs/evidence_<機能ID…|all>_<日時>.tar.gz。中身は index.html から開ける形のまま。
# 操作の記録（trace.zip）は大きいので含めない（PACK_WITH_TRACE=1 で含める）。
set -eu
ROOT=$(cd "$(dirname "$0")/.." && pwd)
EVID=${E2E_EVIDENCE_DIR:-$ROOT/evidence}
cd "$EVID"
node "$ROOT/tools/evidence_index.mjs" --quiet "$@"
if [ $# -eq 0 ]; then set -- $(ls -d [A-Z][0-9][0-9]-[0-9][0-9] 2>/dev/null); tag=all; else tag=$(IFS=_; echo "$*"); fi
[ $# -gt 0 ] || { echo "エビデンスが無い" >&2; exit 1; }
mkdir -p _packs
out="_packs/evidence_${tag}_$(date +%Y%m%d-%H%M%S).tar.gz"
ex=(--exclude='*.tmp-*'); [ "${PACK_WITH_TRACE:-0}" = 1 ] || ex+=(--exclude='trace.zip')
nice -n 10 tar -czf "$out" "${ex[@]}" index.html index.md results.tsv "$@"
echo "$EVID/$out（$(du -h "$out" | cut -f1)）"

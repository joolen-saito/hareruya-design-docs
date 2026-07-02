#!/usr/bin/env bash
# e2e/seed/lib/apply.sh — シードをべき等に適用する。
#
# 使い方:
#   e2e/seed/lib/apply.sh                 # manifest 順に全セット適用
#   e2e/seed/lib/apply.sh SEED-M05-ORDERS # 指定セットのみ
#   SEED_DB_URL=postgres://... e2e/seed/lib/apply.sh
#
# 接続先は SEED_DB_URL（既定 postgres://dbuser:secret@localhost:15432/eccubedb）。
# 全て psql -v ON_ERROR_STOP=1 で1セット=1トランザクション。何度でも再実行可（UPSERT+seed_resync）。
set -euo pipefail
SEED_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_URL="${SEED_DB_URL:-postgres://dbuser:secret@localhost:15432/eccubedb}"
PSQL=(psql "$DB_URL" -X -v ON_ERROR_STOP=1 -q)

echo "[apply] helpers"
"${PSQL[@]}" -f "$SEED_DIR/lib/_helpers.sql" >/dev/null

# 適用対象ファイル（manifest 順）。引数があればそのセットのみ。
mapfile -t FILES < <(node -e '
  const fs=require("fs");
  const m=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
  const only=process.argv.slice(2);
  for(const s of m.sets){ if(only.length===0||only.includes(s.id)) console.log(s.file); }
' "$SEED_DIR/manifest.json" "$@")

if [ "${#FILES[@]}" -eq 0 ]; then echo "[apply] no matching sets"; exit 1; fi

for rel in "${FILES[@]}"; do
  f="$SEED_DIR/$rel"
  [ -f "$f" ] || { echo "[apply] MISSING $rel"; exit 1; }
  echo "[apply] $rel"
  "${PSQL[@]}" -f "$f" >/dev/null
done
echo "[apply] done (${#FILES[@]} sets)"

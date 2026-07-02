#!/usr/bin/env bash
# e2e/seed/lib/teardown.sh — シードを撤去する（*.down.sql を manifest 逆順で）。
#
# 使い方:
#   e2e/seed/lib/teardown.sh                 # 全セットを逆順で撤去
#   e2e/seed/lib/teardown.sh SEED-M05-ORDERS # 指定セットのみ
set -euo pipefail
SEED_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_URL="${SEED_DB_URL:-postgres://dbuser:secret@localhost:15432/eccubedb}"
PSQL=(psql "$DB_URL" -X -v ON_ERROR_STOP=1 -q)

echo "[teardown] helpers"
"${PSQL[@]}" -f "$SEED_DIR/lib/_helpers.sql" >/dev/null

mapfile -t FILES < <(node -e '
  const fs=require("fs");
  const m=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
  const only=process.argv.slice(2);
  const sets=[...m.sets].reverse();
  for(const s of sets){ if(only.length===0||only.includes(s.id)) console.log(s.file.replace(/\.sql$/,".down.sql")); }
' "$SEED_DIR/manifest.json" "$@")

for rel in "${FILES[@]}"; do
  f="$SEED_DIR/$rel"
  [ -f "$f" ] || { echo "[teardown] skip (no down): $rel"; continue; }
  echo "[teardown] $rel"
  "${PSQL[@]}" -f "$f" >/dev/null
done
echo "[teardown] done"

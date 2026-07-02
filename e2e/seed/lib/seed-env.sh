#!/usr/bin/env bash
# e2e/seed/lib/seed-env.sh — manifest の envVars を「export KEY=VAL」として標準出力に出す。
#
# 使い方（Playwright 実行前に反映）:
#   eval "$(e2e/seed/lib/seed-env.sh)"
#   npx playwright test ...
#
# 固定IDなので DB 照会せず決定的に出力する。spec は従来どおり process.env.ORDER_ID 等を読む。
set -euo pipefail
SEED_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
node -e '
  const fs=require("fs");
  const m=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
  const seen={};
  for(const s of m.sets){
    for(const [k,v] of Object.entries(s.envVars||{})){
      if(seen[k]!==undefined && seen[k]!==String(v)){
        process.stderr.write(`# WARN env ${k} 競合: ${seen[k]} vs ${v}\n`);
      }
      seen[k]=String(v);
    }
  }
  for(const [k,v] of Object.entries(seen)){
    // シェル安全化（英数と一部記号のみ想定の値）。
    const val = String(v).replace(/"/g,"\\\"");
    console.log(`export ${k}="${val}"`);
  }
' "$SEED_DIR/manifest.json"

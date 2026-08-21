#!/usr/bin/env bash
# Backlog不具合247件を、乖離リストと同じ軸（指摘区分/実害/根拠区分/設計書作業）で分類させる。
set -uo pipefail
B=/home/y-saito/Developments/hareruya-design-docs/design_impl_drift_report/citation_audit
PAR="${1:-6}"
TOTAL=$(ls "$B"/blclass_packets/bc_*.json | wc -l)
mkdir -p "$B/blclass_results"

ls "$B"/blclass_packets/bc_*.json | while read -r pkt; do
  pid=$(basename "$pkt" .json)
  [ -f "$B/blclass_results/$pid.json" ] && continue
  echo "$pid"
done | TOTAL="$TOTAL" xargs -I{} -P "$PAR" bash -c '
  pid="{}"
  B=/home/y-saito/Developments/hareruya-design-docs/design_impl_drift_report/citation_audit
  read -r -d "" P <<EOF
Backlogの不具合チケットを、設計書乖離リストと同じ分類軸に載せる作業です。

まず手順書を読んでください: $B/BL_CLASSIFY_TASK.md

担当パケット: $B/blclass_packets/$pid.json
出力先: $B/blclass_results/$pid.json

厳守事項:
- **実装工数は既に確定している。見積もり直さない。** 判定するのは分類だけ。
- **正本はExcel** (/home/y-saito/Developments/hareruya-design-docs/excel_to_html/input/*.xlsx)。
  HTML(output/)は生成物で、src-cell / data-excel-ref を持つ領域だけが正本由来。
  function-design-embed 領域は旧実装からのリバース記述であり正本ではない。
- **正本の根拠は base64 埋め込み画像 (class="image-layer-img") の中にあることが多い。**
  テキスト検索で出ないことを「正本に記述が無い」と即断しない。
- harm は Backlog優先度(高/中/低)を写さない。実コードを見て何が壊れるかで決める。
- basis は SPEC_BACKED / LEGACY_BACKED / UNSUPPORTED / UNCERTAIN のいずれか。
  確認できなければ UNCERTAIN にする。捏造は絶対禁止。
- reason には「どのファイルの何を見たか」を必ず書く。

tickets 全件について shitekiKubun / harm / basis / docWork / docEffortDays / docTarget /
reason / confidence をJSONで書き込んでください。
最終メッセージは内訳1行のみ（例: 20件: 未実装=6 実装違い=14 / high=2 med=13 low=5 / SPEC=7 LEGACY=9 UNSUP=2 UNCERT=2）。
EOF
  timeout 5400 codex exec --sandbox workspace-write --cd /home/y-saito/Developments \
    --skip-git-repo-check "$P" > "$B/blclass_results/$pid.log" 2>&1
  n=$(ls "$B"/blclass_results/bc_*.json 2>/dev/null | wc -l)
  if [ -f "$B/blclass_results/$pid.json" ]; then
    echo "[$(date +%H:%M:%S)] done  $pid  ($n/$TOTAL)"
  else
    echo "[$(date +%H:%M:%S)] FAIL  $pid  ($n/$TOTAL)"
  fi
'
echo "=== Backlog分類 全パケット処理終了 ==="

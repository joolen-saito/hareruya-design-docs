#!/usr/bin/env bash
# 根拠区分の批判的レビューを codex に投げる。
# usage: run_review.sh [並列数]
set -uo pipefail
B=/home/y-saito/Developments/hareruya-design-docs/design_impl_drift_report/citation_audit
cd /home/y-saito/Developments/hareruya-design-docs/design_impl_drift_report
PAR="${1:-4}"
mkdir -p citation_audit/review_results

ls "$B"/review_packets/*.json | while read -r pkt; do
  pid=$(basename "$pkt" .json)
  [ -f "$B/review_results/$pid.json" ] && continue
  echo "$pid"
done | xargs -I{} -P "$PAR" bash -c '
  pid="{}"
  B=/home/y-saito/Developments/hareruya-design-docs/design_impl_drift_report/citation_audit
  read -r -d "" P <<EOF
あなたは先行検証の分類を**批判的にレビュー**します。追認ではなく、誤りを見つけるのが仕事です。

まず手順書を読んでください: $B/REVIEW_TASK.md

担当パケット: $B/review_packets/$pid.json
出力先: $B/review_results/$pid.json

厳守事項:
- 引用は必ず実際にファイルを開いて確認した実物のみ。捏造は絶対に禁止。
- 確認していないことを確認したと書かない。
- Excel正本(src-cell/data-excel-ref を持つ要素)と、リバース詳細設計
  (function-design-embed / data-source=functions/...)を厳密に区別する。
  後者は「設計書に書かれている」の根拠にならない。
- LEGACY_BACKED の「正本に記述が無い」という不在の主張は、複数の言い換えで
  検索して崩そうと試みてください。どう探したかを checkedQuote に必ず書く。
- 元の判定に引きずられず、判断がつかなければ UNSURE にしてください。

findings 全件について結果をJSONで書き込んでください。
最終メッセージは内訳1行のみ（例: 15件: UPHELD=11 REFUTED=3 UNSURE=1）。
EOF
  timeout 3600 codex exec --sandbox workspace-write --cd /home/y-saito/Developments \
    --skip-git-repo-check "$P" > "$B/review_results/$pid.log" 2>&1
  n=$(ls "$B"/review_results/rv_*.json 2>/dev/null | wc -l)
  if [ -f "$B/review_results/$pid.json" ]; then
    echo "[$(date +%H:%M:%S)] done  $pid  ($n/24)"
  else
    echo "[$(date +%H:%M:%S)] FAIL  $pid  ($n/24)"
  fi
'
echo "=== レビュー全パケット処理終了 ==="

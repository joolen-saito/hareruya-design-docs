#!/usr/bin/env bash
# 改修区分・工数見積の批判的レビューを codex に投げる。
# usage: run_effreview.sh [並列数]
set -uo pipefail
B=/home/y-saito/Developments/hareruya-design-docs/design_impl_drift_report/citation_audit
PAR="${1:-6}"
TOTAL=$(ls "$B"/effort_packets/ef_*.json | wc -l)
mkdir -p "$B/effort_results"

ls "$B"/effort_packets/ef_*.json | while read -r pkt; do
  pid=$(basename "$pkt" .json)
  [ -f "$B/effort_results/$pid.json" ] && continue
  echo "$pid"
done | TOTAL="$TOTAL" xargs -I{} -P "$PAR" bash -c '
  pid="{}"
  B=/home/y-saito/Developments/hareruya-design-docs/design_impl_drift_report/citation_audit
  read -r -d "" P <<EOF
あなたは「その乖離を直すのに何を触るか(改修区分)」と「何人日か」の判定を
**批判的にレビュー**します。追認ではなく、誤りを見つけるのが仕事です。

まず手順書を読んでください: $B/EFFORT_REVIEW_TASK.md

担当パケット: $B/effort_packets/$pid.json
出力先: $B/effort_results/$pid.json

厳守事項:
- authorCat は語スコアによる機械分類で、約2割が誤り。**重い区分へ寄る傾向**がある。
  ただし逆方向(軽く見積もりすぎ)も必ず探すこと。
- 区分は「指摘の話題」ではなく「**直すために触るもの**」で決める。
  在庫や価格の話でも、翻訳ファイル1行の修正なら 2(画面表示)。
  「実装されていない」と書いてあっても、フォームの初期値1行なら 2、バリデータ1個なら 4。
- effortDays は区分の代表値に引きずられず、**この1件を実際に直すなら何人日か**を自分で見積もる。
  判断が要るときは実コード(/home/y-saito/Developments/ec-cube-enterprise)を開いて範囲を確かめる。
- 仕様が確定していないもの(設計が矛盾している等)は needsDecision: true とし、工数を出さない。
- 引用・確認内容の捏造は絶対に禁止。確認していないことを確認したと書かない。

findings 全件について verdict と effortDays をJSONで書き込んでください。
最終メッセージは内訳1行のみ（例: 28件: UPHELD=21 REFUTED=7 / 工数計 34.5人日）。
EOF
  timeout 5400 codex exec --sandbox workspace-write --cd /home/y-saito/Developments \
    --skip-git-repo-check "$P" > "$B/effort_results/$pid.log" 2>&1
  n=$(ls "$B"/effort_results/ef_*.json 2>/dev/null | wc -l)
  if [ -f "$B/effort_results/$pid.json" ]; then
    echo "[$(date +%H:%M:%S)] done  $pid  ($n/$TOTAL)"
  else
    echo "[$(date +%H:%M:%S)] FAIL  $pid  ($n/$TOTAL)"
  fi
'
echo "=== 改修区分・工数レビュー 全パケット処理終了 ==="

#!/usr/bin/env bash
set -uo pipefail
B=/home/y-saito/Developments/hareruya-design-docs/design_impl_drift_report/citation_audit
PAR="${1:-6}"
TOTAL=$(ls "$B"/backlog_packets/bl_*.json | wc -l)
mkdir -p "$B/backlog_results"
ls "$B"/backlog_packets/bl_*.json | while read -r pkt; do
  pid=$(basename "$pkt" .json)
  [ -f "$B/backlog_results/$pid.json" ] && continue
  echo "$pid"
done | TOTAL="$TOTAL" xargs -I{} -P "$PAR" bash -c '
  pid="{}"
  B=/home/y-saito/Developments/hareruya-design-docs/design_impl_drift_report/citation_audit
  read -r -d "" P <<EOF
Backlogの不具合チケットについて、改修区分と工数を1件ずつ見積もります。

まず手順書を読んでください: $B/BACKLOG_EFFORT_TASK.md

担当パケット: $B/backlog_packets/$pid.json
出力先: $B/backlog_results/$pid.json

厳守事項:
- 区分は「話題」ではなく「**直すために触るもの**」で決める。
  在庫や価格の話でも翻訳ファイル1行なら 2(画面表示)、バリデータ1個なら 4(入力検証)。
- effortDays は区分の代表値に引きずられず、実際に片付けるなら何人日かを自分で見積もる。
  判断が要るときは実コード(/home/y-saito/Developments/ec-cube-enterprise)を開いて範囲を確かめる。
- 1枚に複数の不具合がまとまっているチケットがある。itemCount に件数を書き、工数は合計で答える。
- 状態が 実装中(25%) / レビュー中(80%) のものは着手済みなので**残工数**を答える。
- 仕様が確定していないものは needsDecision: true とし工数0。
- 引用・確認内容の捏造は絶対に禁止。本文だけで判断できないときは confidence: low にする。

findings 全件について JSON で書き込んでください。
最終メッセージは内訳1行のみ（例: 20件: 計 12.5人日 / 要仕様確定 2件）。
EOF
  timeout 5400 codex exec --sandbox workspace-write --cd /home/y-saito/Developments \
    --skip-git-repo-check "$P" > "$B/backlog_results/$pid.log" 2>&1
  n=$(ls "$B"/backlog_results/bl_*.json 2>/dev/null | wc -l)
  if [ -f "$B/backlog_results/$pid.json" ]; then
    echo "[$(date +%H:%M:%S)] done  $pid  ($n/$TOTAL)"
  else
    echo "[$(date +%H:%M:%S)] FAIL  $pid  ($n/$TOTAL)"
  fi
'
echo "=== Backlog不具合 工数見積 全パケット処理終了 ==="

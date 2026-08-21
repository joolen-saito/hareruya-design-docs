#!/usr/bin/env bash
# 設計書(正本Excel)最新化の工数見積を codex に投げる。
set -uo pipefail
B=/home/y-saito/Developments/hareruya-design-docs/design_impl_drift_report/citation_audit
PAR="${1:-6}"
TOTAL=$(ls "$B"/docupdate_packets/du_*.json | wc -l)
mkdir -p "$B/docupdate_results"

ls "$B"/docupdate_packets/du_*.json | while read -r pkt; do
  pid=$(basename "$pkt" .json)
  [ -f "$B/docupdate_results/$pid.json" ] && continue
  echo "$pid"
done | TOTAL="$TOTAL" xargs -I{} -P "$PAR" bash -c '
  pid="{}"
  B=/home/y-saito/Developments/hareruya-design-docs/design_impl_drift_report/citation_audit
  read -r -d "" P <<EOF
設計書（正本Excel）を最新化する工数を見積もります。実装の修正工数ではありません。

まず手順書を読んでください: $B/DOCUPDATE_TASK.md

担当パケット: $B/docupdate_packets/$pid.json
出力先: $B/docupdate_results/$pid.json

厳守事項:
- **正本はExcel** (/home/y-saito/Developments/hareruya-design-docs/excel_to_html/input/*.xlsx)。
  HTML(output/)は convert.py の生成物で、直接編集しても次の変換で消える。
  見積もる対象は「Excelのどのシートのどの表/画像を、どう直すか」の作業量。
- 根拠区分=SPEC_BACKED は原則 docWork=NONE（設計書は正しく実装が追いついていないだけ）。
  記述が曖昧で明確化が要る場合だけ FIX。
- 根拠区分=LEGACY_BACKED は原則 docWork=ADD（設計書の記述漏れ）。
  ただし移行後に残さない挙動と読めるなら NONE。
- 表示文言・画面項目は、テキストの表に足せば済むのか、
  レイアウト**画像の描き直し**まで要るのか(IMAGE)を必ず区別する。
- 同じシートの行が隣り合うよう並べてある。まとめて直せる分は2件目以降を安くしてよい。
- HTML再生成と検証は書籍単位の固定費として別途集計するので、1件ごとの見積に含めない。
- 引用・確認内容の捏造は絶対に禁止。実装側の修正工数と混同しない。

findings 全件について docWork と docEffortDays をJSONで書き込んでください。
最終メッセージは内訳1行のみ（例: 28件: NONE=14 ADD=10 FIX=2 IMAGE=2 / 計 1.8人日）。
EOF
  timeout 5400 codex exec --sandbox workspace-write --cd /home/y-saito/Developments \
    --skip-git-repo-check "$P" > "$B/docupdate_results/$pid.log" 2>&1
  n=$(ls "$B"/docupdate_results/du_*.json 2>/dev/null | wc -l)
  if [ -f "$B/docupdate_results/$pid.json" ]; then
    echo "[$(date +%H:%M:%S)] done  $pid  ($n/$TOTAL)"
  else
    echo "[$(date +%H:%M:%S)] FAIL  $pid  ($n/$TOTAL)"
  fi
'
echo "=== 設計書最新化 見積 全パケット処理終了 ==="

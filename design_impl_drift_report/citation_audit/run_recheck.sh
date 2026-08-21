#!/usr/bin/env bash
# 再事実確認・批判的レビューを codex に投げる。
# usage: run_recheck.sh [並列数] [パケットglob]
set -uo pipefail
B=/home/y-saito/Developments/hareruya-design-docs/design_impl_drift_report/citation_audit
PAR="${1:-6}"
GLOB="${2:-rc_*}"
TOTAL=$(ls "$B"/recheck_packets/rc_*.json | wc -l)
mkdir -p "$B/recheck_results"

ls "$B"/recheck_packets/$GLOB.json | while read -r pkt; do
  pid=$(basename "$pkt" .json)
  [ -f "$B/recheck_results/$pid.json" ] && continue
  echo "$pid"
done | TOTAL="$TOTAL" xargs -I{} -P "$PAR" bash -c '
  pid="{}"
  B=/home/y-saito/Developments/hareruya-design-docs/design_impl_drift_report/citation_audit
  read -r -d "" P <<EOF
あなたは設計vs実装の乖離指摘を**批判的に再検証**します。追認ではなく、誤りを見つけるのが仕事です。

まず手順書を読んでください: $B/RECHECK_TASK.md

担当パケット: $B/recheck_packets/$pid.json
出力先: $B/recheck_results/$pid.json

厳守事項:
- 引用は必ず実際にファイルを開いて確認した実物のみ。捏造は絶対に禁止。
- 確認していないことを確認したと書かない。
- Excel正本(src-cell/data-excel-ref)と、リバース詳細設計(function-design-embed /
  data-source=functions/...)を厳密に区別する。後者は「設計書に書かれている」の根拠にならない。
- 表示文言・画面レイアウト・項目配置の指摘では、Excel正本の**レイアウト画像**も必ず確認する。
  テキストgrepだけで「正本に記述が無い」と結論しない（前回この見落としで誤判定が多発した）。
- driftVerdict は現在の作業ツリー(/home/y-saito/Developments/ec-cube-enterprise)で実地確認する。
  行番号はずれているのでシンボル名で追うこと。
- 元の判定に引きずられず、判断がつかなければ UNSURE にする。

findings 全件について classVerdict と driftVerdict の両方をJSONで書き込んでください。
最終メッセージは内訳1行のみ（例: 12件: class UPHELD=9 REFUTED=3 / drift REPRODUCED=10 RESOLVED=2）。
EOF
  timeout 5400 codex exec --sandbox workspace-write --cd /home/y-saito/Developments \
    --skip-git-repo-check "$P" > "$B/recheck_results/$pid.log" 2>&1
  n=$(ls "$B"/recheck_results/rc_*.json 2>/dev/null | wc -l)
  if [ -f "$B/recheck_results/$pid.json" ]; then
    echo "[$(date +%H:%M:%S)] done  $pid  ($n/$TOTAL)"
  else
    echo "[$(date +%H:%M:%S)] FAIL  $pid  ($n/$TOTAL)"
  fi
'
echo "=== 再検証 全パケット処理終了 ==="

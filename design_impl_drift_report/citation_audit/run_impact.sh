#!/usr/bin/env bash
# 影響区分(ふるまい・動作・I/O)の判定を codex に批判的レビューさせる。
# usage: run_impact.sh [並列数] [パケットglob]
set -uo pipefail
B=/home/y-saito/Developments/hareruya-design-docs/design_impl_drift_report/citation_audit
PAR="${1:-6}"
GLOB="${2:-*}"
TOTAL=$(ls "$B"/impact_packets/*.json | wc -l)
mkdir -p "$B/impact_results"

ls "$B"/impact_packets/$GLOB.json | while read -r pkt; do
  pid=$(basename "$pkt" .json)
  [ -f "$B/impact_results/$pid.json" ] && continue
  echo "$pid"
done | TOTAL="$TOTAL" xargs -I{} -P "$PAR" bash -c '
  pid="{}"
  B=/home/y-saito/Developments/hareruya-design-docs/design_impl_drift_report/citation_audit
  read -r -d "" P <<EOF
あなたは「その乖離がシステムのふるまい・動作・I/Oに影響するか」という判定を
**批判的にレビュー**します。追認ではなく、誤りを見つけるのが仕事です。

判定基準（必読）: $B/IMPACT_CRITERION.md
担当パケット: $B/impact_packets/$pid.json
出力先: $B/impact_results/$pid.json

パケットの mode で仕事が変わります。

【mode=refute】著者が NO_IMPACT / UNSURE と判定した行です。
  各行について、**外部から観測できる影響を1つでも見つけて反証**してください。
  例: 内部識別子だと言うが実は画面/HTTP/DBに露出していないか、値まで同じか、
  生成HTMLやレスポンスが変わらないか、を実際にコードを開いて確かめる。
  反証できなければ著者判定を維持(UPHELD)、できれば REFUTED。

【mode=sweep】著者はほぼ全行を IMPACT と判定しました。
  **見落とし（実は NO_IMPACT な行）**が無いかを独立に判定してください。
  NO_IMPACT と判定する行だけは、必ず実コードを開いて外部非露出を確認すること。
  IMPACT で異論が無い行は verdict=IMPACT のまま理由1行で構いません。

厳守事項:
- 引用は必ず実際にファイルを開いて確認した実物のみ。捏造は絶対に禁止。
- 「軽微」と「影響しない」を混同しない。表示文言が1文字違うのは IMPACT。
- 迷ったら UNSURE。推測で NO_IMPACT にしない。
- 次の**境界事例**は特に慎重に扱い、理由を明記すること:
  (a) バッチのコンソール開始/完了ログに日時が付かない類 → 標準出力の内容が変わる
  (b) 実行時間/メモリ制限やSQLロガーの設定 → 資源次第で結果が変わり得る
  (c) ルート名・セッションキー名・DIサービスIDなどの内部識別子 → 露出の有無を実査する

出力JSON:
{"packetId":"$pid","results":[{"rowId":1,"authorVerdict":"IMPACT",
 "verdict":"IMPACT|NO_IMPACT|UNSURE","agree":true,
 "observableEffect":"外部から観測できる差の具体(IMPACTのとき必須)",
 "checked":"実際に開いたファイルと確認内容(NO_IMPACTのとき必須)",
 "reason":"判断の根拠","confidence":"high|medium|low"}]}

findings 全件について返してください（欠落禁止）。
最終メッセージは内訳1行のみ（例: 36件: IMPACT=34 NO_IMPACT=1 UNSURE=1）。
EOF
  timeout 5400 codex exec --sandbox workspace-write --cd /home/y-saito/Developments \
    --skip-git-repo-check "$P" > "$B/impact_results/$pid.log" 2>&1
  n=$(ls "$B"/impact_results/*.json 2>/dev/null | wc -l)
  if [ -f "$B/impact_results/$pid.json" ]; then
    echo "[$(date +%H:%M:%S)] done  $pid  ($n/$TOTAL)"
  else
    echo "[$(date +%H:%M:%S)] FAIL  $pid  ($n/$TOTAL)"
  fi
'
echo "=== 影響区分レビュー 全パケット処理終了 ==="

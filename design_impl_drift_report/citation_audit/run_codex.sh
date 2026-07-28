#!/usr/bin/env bash
# codex exec に1パケットの根拠検証を委譲する。
# usage: run_codex.sh <packetPath> <outPath> [logPath]
set -uo pipefail
PACKET="$1"; OUT="$2"; LOG="${3:-${OUT%.json}.log}"
TASK=/home/y-saito/Developments/hareruya-design-docs/design_impl_drift_report/citation_audit/CODEX_TASK.md

read -r -d '' PROMPT <<EOF
あなたは設計vs実装の乖離指摘について、その根拠の所在を突き止める調査を行います。

まず手順書を読んでください: ${TASK}

担当パケット: ${PACKET}
出力先: ${OUT}

手順書の判定手順に厳密に従い、findings 全件について verdict / specEvidence / legacyEvidence /
currentImpl / note を決定し、出力先のJSONファイルに書き込んでください。

重要な注意:
- 設計書HTMLの行番号は監査後の再生成でずれています。行番号ではなく本文の内容で確認してください。
- 設計期待値の根拠が設計書に無い場合、旧実装リポジトリ(pf-api, pf-eccube3, pf-article, deck-api)を
  必ず探索してください。エンドポイントURL・メソッド名・カラム名・機能名で横断検索します。
- evidence には必ず「ファイルパス:行番号」と実際のコード/記述の引用を含めてください。
- 判断材料が足りない場合は UNCERTAIN にし、何が足りないかを note に書いてください。

作業完了後、最終メッセージには件数の内訳のみを1行で出力してください
（例: 20件処理: SPEC_BACKED=3 LEGACY_BACKED=9 UNSUPPORTED=2 ALREADY_MET=1 UNCERTAIN=5）。
EOF

codex exec \
  --sandbox workspace-write \
  --cd /home/y-saito/Developments \
  --skip-git-repo-check \
  "$PROMPT" > "$LOG" 2>&1
rc=$?
echo "exit=$rc log=$LOG"
tail -5 "$LOG"

# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/b05-09_0405_sheet-11_sheet.json#b05-09_0405_sheet-11_sheet-conformance-8d69e89cc513`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/b05-09_0405_sheet-11_sheet.json`
- sourceFindingId: `b05-09_0405_sheet-11_sheet-conformance-8d69e89cc513`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `b05-09_0405_sheet-11_sheet` / B05-09 スマレジ取引連携エラー再連携
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: スマレジ取引連携エラー再連携は、コンソールのバッチコマンド `smaregi:batch checkSmaregiTransaction` から実行できること。
- implementationActual: `src/Eccube/Command` の AsCommand 一覧には `eccube:smaregi:stock:backfill`、`eccube:smaregi:update-point`、`eccube:smaregi:otc:delete` 等は存在するが、設計コマンド `smaregi:batch checkSmaregiTransaction` または取引再連携バッチ相当のコマンドは存在しない。取引処理の子ジョブハンドラは `src/Eccube/Mess…
- mismatchReason: 設計は利用者視点の入口として特定コマンド名を外部契約化している。実装側には当該コマンド名・別名・取引再連携を示すCommandクラスがなく、Webhook由来の子ジョブ処理だけではバッチ入口要求を満たさない。
- designRefDetail: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-11:2078,2082
- implRef: 不在（探索範囲: src/Eccube/Command, src/Eccube/Service, src/Eccube/MessageHandler, src/Eccube/Repository, src/Eccube/Entity, html。検索語: checkSmaregiTransaction / check_smaregi_transaction / check-smaregi-transaction / smaregi:batch / smaregi:trans…

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "b05-09_0405_sheet-11_sheet-conformance-8d69e89cc513",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-11:2078,2082",
  "designRefDetail": null,
  "designExpectation": "スマレジ取引連携エラー再連携は、コンソールのバッチコマンド `smaregi:batch checkSmaregiTransaction` から実行できること。",
  "designQuote": "スマレジ取引連携エラー再連携は、コンソールのバッチコマンド `smaregi:batch checkSmaregiTransaction` から実行できること。",
  "implRef": "不在（探索範囲: src/Eccube/Command, src/Eccube/Service, src/Eccube/MessageHandler, src/Eccube/Repository, src/Eccube/Entity, html。検索語: checkSmaregiTransaction / check_smaregi_transaction / check-smaregi-transaction / smaregi:batch / smaregi:transaction / 取引連携エラー / 取引.*再連携）",
  "implementationActual": "`src/Eccube/Command` の AsCommand 一覧には `eccube:smaregi:stock:backfill`、`eccube:smaregi:update-point`、`eccube:smaregi:otc:delete` 等は存在するが、設計コマンド `smaregi:batch checkSmaregiTransaction` または取引再連携バッチ相当のコマンドは存在しない。取引処理の子ジョブハンドラは `src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:101` にあるが、コンソール入口ではない。",
  "difference": "設計は利用者視点の入口として特定コマンド名を外部契約化している。実装側には当該コマンド名・別名・取引再連携を示すCommandクラスがなく、Webhook由来の子ジョブ処理だけではバッチ入口要求を満たさない。",
  "mismatchReason": "設計は利用者視点の入口として特定コマンド名を外部契約化している。実装側には当該コマンド名・別名・取引再連携を示すCommandクラスがなく、Webhook由来の子ジョブ処理だけではバッチ入口要求を満たさない。",
  "comparisonRows": [
    {
      "item": "バッチ入口",
      "design": "`smaregi:batch checkSmaregiTransaction`",
      "implementation": "該当Commandなし。近接する実装は `eccube:smaregi:stock:backfill` など別機能のみ。",
      "mismatch": "設計コマンドが起動できない。"
    },
    {
      "item": "実行対象",
      "design": "スマレジ取引連携エラー再連携",
      "implementation": "`SmaregiTransactionProcessMessageHandler` は既存の `SmaregiTransactionProcessMessage` を処理する子ジョブ。",
      "mismatch": "バッチとして取引一覧を取得・再連携開始する入口がない。"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "b05-09_0405_sheet-11_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "不在（探索範囲: src/Eccube/Command, src/Eccube/Service, src/Eccube/MessageHandler, src/Eccube/Repository, src/Eccube/Entity, html。検索語: checkSmaregiTransaction / check_smaregi_transaction / check-smaregi-transaction / smaregi:batch / smaregi:transaction / 取引連携エラー / 取引.*再連携）",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「スマレジ取引連携エラー再連携は、コンソールのバッチコマンド `smaregi:batch checkSmaregiTransaction` から実行できること。」。実装は「`src/Eccube/Command` の AsCommand 一覧には `eccube:smaregi:stock:backfill`、`eccube:smaregi:update-point`、`eccube:smaregi:otc:delete` 等は存在するが、設計コマンド `smaregi:batch checkSmaregiTransaction` または取引再連携バッチ相当のコマンドは存在しない。取引処理の子ジョブハンドラは `src/Eccube/MessageHandler/SmaregiTr…」。乖離理由は「設計は利用者視点の入口として特定コマンド名を外部契約化している。実装側には当該コマンド名・別名・取引再連携を示すCommandクラスがなく、Webhook由来の子ジョブ処理だけではバッチ入口要求を満たさない。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "業務ロジック・外部連携未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "Twig・画面表示",
    "CSV・API・Batch・PDF・印刷",
    "権限・セッション・副作用・エラー・ログ"
  ],
  "designSnippet": "",
  "implementationRefs": [
    "不在（探索範囲: src/Eccube/Command, src/Eccube/Service, src/Eccube/MessageHandler, src/Eccube/Repository, src/Eccube/Entity, html。検索語: checkSmaregiTransaction / check_smaregi_transaction / check-smaregi-transaction / smaregi:batch / smaregi:transaction / 取引連携エラー / 取引.*再連携）"
  ],
  "implementationSnippets": [],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

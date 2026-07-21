# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/b02-07_0402_sheet-6_sheet.json#b02-07_0402_sheet-6_sheet-conformance-7a9e21e41821`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/b02-07_0402_sheet-6_sheet.json`
- sourceFindingId: `b02-07_0402_sheet-6_sheet-conformance-7a9e21e41821`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `b02-07_0402_sheet-6_sheet` / B02-07 週間在庫履歴更新バッチ
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: 商品コードごと、店舗ごとに在庫履歴の出力を行うため、ECCUBE、スマレジの在庫を合算して週間在庫履歴テーブルに登録する。
- implementationActual: BatchUpdateWeeklyStockHistoryAction は TODO コメントで「スマレジ在庫との合算対応」「現時点ではスマレジ在庫の取り込みが未実装のため、ECCUBE在庫のみを対象」と明記している。
- mismatchReason: 設計は ECCUBE とスマレジ在庫の合算登録を要求しているが、実装は対象外としており未実装。反証検索では ProductStock に stock_location_id とスマレジ区分定数はあるが、B02-07 の集計処理内で stock_location_id=1/2 を合算する SQL/分岐は確認できない。
- designRefDetail: excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html#sheet-6:1297
- implRef: src/Eccube/Service/Product/BatchUpdateWeeklyStockHistoryAction.php:41

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "b02-07_0402_sheet-6_sheet-conformance-7a9e21e41821",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html#sheet-6:1297",
  "designRefDetail": null,
  "designExpectation": "商品コードごと、店舗ごとに在庫履歴の出力を行うため、ECCUBE、スマレジの在庫を合算して週間在庫履歴テーブルに登録する。",
  "designQuote": "商品コードごと、店舗ごとに在庫履歴の出力を行うため、ECCUBE、スマレジの在庫を合算して週間在庫履歴テーブルに登録する。",
  "implRef": "src/Eccube/Service/Product/BatchUpdateWeeklyStockHistoryAction.php:41",
  "implementationActual": "BatchUpdateWeeklyStockHistoryAction は TODO コメントで「スマレジ在庫との合算対応」「現時点ではスマレジ在庫の取り込みが未実装のため、ECCUBE在庫のみを対象」と明記している。",
  "difference": "設計は ECCUBE とスマレジ在庫の合算登録を要求しているが、実装は対象外としており未実装。反証検索では ProductStock に stock_location_id とスマレジ区分定数はあるが、B02-07 の集計処理内で stock_location_id=1/2 を合算する SQL/分岐は確認できない。",
  "mismatchReason": "設計は ECCUBE とスマレジ在庫の合算登録を要求しているが、実装は対象外としており未実装。反証検索では ProductStock に stock_location_id とスマレジ区分定数はあるが、B02-07 の集計処理内で stock_location_id=1/2 を合算する SQL/分岐は確認できない。",
  "comparisonRows": [
    {
      "item": "スマレジ在庫合算",
      "design": "ECCUBE、スマレジの在庫を合算して週間在庫履歴テーブルに登録",
      "implementation": "ECCUBE在庫のみを対象。スマレジ合算は TODO",
      "mismatch": "スマレジ在庫が合算されない"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "b02-07_0402_sheet-6_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Service/Product/BatchUpdateWeeklyStockHistoryAction.php:41",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「商品コードごと、店舗ごとに在庫履歴の出力を行うため、ECCUBE、スマレジの在庫を合算して週間在庫履歴テーブルに登録する。」。実装は「BatchUpdateWeeklyStockHistoryAction は TODO コメントで「スマレジ在庫との合算対応」「現時点ではスマレジ在庫の取り込みが未実装のため、ECCUBE在庫のみを対象」と明記している。」。乖離理由は「設計は ECCUBE とスマレジ在庫の合算登録を要求しているが、実装は対象外としており未実装。反証検索では ProductStock に stock_location_id とスマレジ区分定数はあるが、B02-07 の集計処理内で stock_location_id=1/2 を合算する SQL/分岐は確認できない。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "業務ロジック・外部連携未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "Repository・Entity・DB",
    "CSV・API・Batch・PDF・印刷"
  ],
  "designSnippet": "",
  "implementationRefs": [
    "src/Eccube/Service/Product/BatchUpdateWeeklyStockHistoryAction.php:41",
    "src/Eccube/Service/Product/BatchUpdateWeeklyStockHistoryAction.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Service/Product/BatchUpdateWeeklyStockHistoryAction.php:41\n38:      * 3. 本テーブルを TRUNCATE\n39:      * 4. 一時テーブルから本テーブルへコピー\n40:      *\n41:      * TODO: スマレジ在庫との合算対応\n42:      *   設計書では「ECCUBEとスマレジの在庫を合算して週間在庫履歴テーブルに登録する」とあるが、\n43:      *   現時点ではスマレジ在庫の取り込みが未実装のため、ECCUBE在庫のみを対象としている。\n44:      *   スマレジ在庫が dtb_stock_history に取り込まれるようになった際は、",
    "src/Eccube/Service/Product/BatchUpdateWeeklyStockHistoryAction.php:22\n19: use Eccube\\Repository\\DtbWeeklyStockHistoryTempRepository;\n20: use Eccube\\Service\\MailService;\n21: \n22: class BatchUpdateWeeklyStockHistoryAction\n23: {\n24:     public const BATCH_SIZE = 20000;\n25: "
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

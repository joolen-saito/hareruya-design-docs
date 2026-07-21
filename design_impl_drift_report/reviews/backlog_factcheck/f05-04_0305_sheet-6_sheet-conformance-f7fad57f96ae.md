# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f05-04_0305_sheet-6_sheet.json#f05-04_0305_sheet-6_sheet-conformance-f7fad57f96ae`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f05-04_0305_sheet-6_sheet.json`
- sourceFindingId: `f05-04_0305_sheet-6_sheet-conformance-f7fad57f96ae`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f05-04_0305_sheet-6_sheet` / F05-04 ネット買取商品詳細
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: 過去1週間のうちに注文された商品数を表示。注文されていない場合は非表示（現行踏襲）。
- implementationActual: Purchase/detail.twigに週間販売数の表示要素・ラベルが一切無く（週/weekly/salesQuantity/sales-count/注文 いずれも0件）、detail()コントローラも該当集計・view変数を持たない。販売商品詳細Product/detail.twig:248-250ではweekly_sold()関数で表示している。
- mismatchReason: 現行踏襲の表示項目だが買取詳細のテンプレート/コントローラに表示ロジックが存在しない。
- designRefDetail: excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-6 (カード詳細 識別ID6 週間販売数)
- implRef: 不在（src/Eccube/Resource/template/default/Purchase/detail.twig, PurchaseController.php detail()）

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f05-04_0305_sheet-6_sheet-conformance-f7fad57f96ae",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-6",
  "designRefDetail": "excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-6 (カード詳細 識別ID6 週間販売数)",
  "designExpectation": "過去1週間のうちに注文された商品数を表示。注文されていない場合は非表示（現行踏襲）。",
  "designQuote": "過去1週間のうちに注文された商品数を表示。注文されていない場合は非表示（現行踏襲）。",
  "implRef": "不在（src/Eccube/Resource/template/default/Purchase/detail.twig, PurchaseController.php detail()）",
  "implementationActual": "Purchase/detail.twigに週間販売数の表示要素・ラベルが一切無く（週/weekly/salesQuantity/sales-count/注文 いずれも0件）、detail()コントローラも該当集計・view変数を持たない。販売商品詳細Product/detail.twig:248-250ではweekly_sold()関数で表示している。",
  "difference": "現行踏襲の表示項目だが買取詳細のテンプレート/コントローラに表示ロジックが存在しない。",
  "mismatchReason": "現行踏襲の表示項目だが買取詳細のテンプレート/コントローラに表示ロジックが存在しない。",
  "comparisonRows": [
    {
      "item": "週間販売数表示",
      "design": "過去1週間注文数を表示",
      "implementation": "要素・ラベル無し",
      "mismatch": "未実装"
    },
    {
      "item": "非表示条件",
      "design": "注文0件時は非表示",
      "implementation": "表示ロジック自体無し",
      "mismatch": "未実装"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f05-04_0305_sheet-6_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "不在（src/Eccube/Resource/template/default/Purchase/detail.twig, PurchaseController.php detail()）",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「過去1週間のうちに注文された商品数を表示。注文されていない場合は非表示（現行踏襲）。」。実装は「Purchase/detail.twigに週間販売数の表示要素・ラベルが一切無く（週/weekly/salesQuantity/sales-count/注文 いずれも0件）、detail()コントローラも該当集計・view変数を持たない。販売商品詳細Product/detail.twig:248-250ではweekly_sold()関数で表示している。」。乖離理由は「現行踏襲の表示項目だが買取詳細のテンプレート/コントローラに表示ロジックが存在しない。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:2070\n2067:       </section>\n2068:       <!-- function-design-embed:end f05-03-f05-03_front_online_purchase_buy_product_list -->\n2069: </section>\n2070:       <section class=\"sheet-panel\" id=\"sheet-6\">\n2071:         <div class=\"sheet-heading\">\n2072:           <h2>ネット買取商品詳細</h2>\n2073:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Purchase/detail.twig"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Purchase/detail.twig:1\n1: {#\n2: 買取商品詳細\n3: #}\n4: {% extends 'default_frame.twig' %}"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

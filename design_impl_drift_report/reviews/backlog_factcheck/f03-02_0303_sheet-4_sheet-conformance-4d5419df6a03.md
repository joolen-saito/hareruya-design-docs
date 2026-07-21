# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f03-02_0303_sheet-4_sheet.json#f03-02_0303_sheet-4_sheet-conformance-4d5419df6a03`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f03-02_0303_sheet-4_sheet.json`
- sourceFindingId: `f03-02_0303_sheet-4_sheet-conformance-4d5419df6a03`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f03-02_0303_sheet-4_sheet` / F03-02 商品詳細
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: (2-14)入荷通知/通知待ち：高額商品コードを登録している商品の場合、入荷通知ボタンを非表示にする
- implementationActual: 在庫なし時の入荷通知ボタンは _show_customer_favorite_and_notify のみでガードされ、class.highPriceCode の有無を判定しない。
- mismatchReason: 高額商品コードを持つ規格が在庫なしのとき入荷通知ボタンが表示され、非表示条件が未実装。
- designRefDetail: 0303_基本設計仕様書(フロント_商品).html#sheet-4 商品詳細 画面部品 2-14
- implRef: src/Eccube/Resource/template/default/Product/detail.twig:322-333, src/Eccube/Entity/ProductClass.php:867-870

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f03-02_0303_sheet-4_sheet-conformance-4d5419df6a03",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "0303_基本設計仕様書(フロント_商品).html#sheet-4",
  "designRefDetail": "0303_基本設計仕様書(フロント_商品).html#sheet-4 商品詳細 画面部品 2-14",
  "designExpectation": "(2-14)入荷通知/通知待ち：高額商品コードを登録している商品の場合、入荷通知ボタンを非表示にする",
  "designQuote": "(2-14)入荷通知/通知待ち：高額商品コードを登録している商品の場合、入荷通知ボタンを非表示にする",
  "implRef": "src/Eccube/Resource/template/default/Product/detail.twig:322-333, src/Eccube/Entity/ProductClass.php:867-870",
  "implementationActual": "在庫なし時の入荷通知ボタンは _show_customer_favorite_and_notify のみでガードされ、class.highPriceCode の有無を判定しない。",
  "difference": "高額商品コードを持つ規格が在庫なしのとき入荷通知ボタンが表示され、非表示条件が未実装。",
  "mismatchReason": "高額商品コードを持つ規格が在庫なしのとき入荷通知ボタンが表示され、非表示条件が未実装。",
  "comparisonRows": [
    {
      "item": "高額商品コード登録商品",
      "design": "入荷通知ボタン非表示",
      "implementation": "表示される",
      "mismatch": "highPriceCode判定なし"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f03-02_0303_sheet-4_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Resource/template/default/Product/detail.twig:322-333, src/Eccube/Entity/ProductClass.php:867-870",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「(2-14)入荷通知/通知待ち：高額商品コードを登録している商品の場合、入荷通知ボタンを非表示にする」。実装は「在庫なし時の入荷通知ボタンは _show_customer_favorite_and_notify のみでガードされ、class.highPriceCode の有無を判定しない。」。乖離理由は「高額商品コードを持つ規格が在庫なしのとき入荷通知ボタンが表示され、非表示条件が未実装。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "業務ロジック・外部連携未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "Service・業務ルール",
    "Repository・Entity・DB",
    "Twig・画面表示"
  ],
  "designSnippet": "",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Product/detail.twig:322-333",
    "src/Eccube/Entity/ProductClass.php:867-870",
    "src/Eccube/Resource/template/default/Product/detail.twig",
    "src/Eccube/Entity/ProductClass.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Product/detail.twig:322\n319:                                                         data-productclass=\"{{ class.id }}\">\n320:                                                     <i class=\"icon-hareruya-mail-small c-hareruya-icon--sm\"></i>\n321:                                                     <i class=\"icon-hareruya-close c-hareruya-icon--sm\"></i>\n322:                                                     <span>{{ 'front.product.restock_notify'|trans }}</span>\n323:                                                     <span>{{ 'front.product.restock_notify_waiting'|trans }}</span>\n324:                                                 </button>\n325:                                             {% endif %}",
    "src/Eccube/Entity/ProductClass.php:867\n864:             return $this;\n865:         }\n866: \n867:         public function getHighPriceCode(): ?string\n868:         {\n869:             return $this->high_price_code;\n870:         }",
    "src/Eccube/Resource/template/default/Product/detail.twig:1\n1: {#\n2: This file is part of EC-CUBE\n3: \n4: Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved."
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

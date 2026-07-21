# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f04-03_0304_sheet-5_sheet.json#f04-03_0304_sheet-5_sheet-conformance-0bfec35ef759`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f04-03_0304_sheet-5_sheet.json`
- sourceFindingId: `f04-03_0304_sheet-5_sheet-conformance-0bfec35ef759`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f04-03_0304_sheet-5_sheet` / F04-03 配送先の新規登録_変更
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: 編集画面の見出しは『配送先の新規登録・変更』（英語 Register New/Change Address）を表示。
- implementationActual: 見出しは会員時 front.shopping.shipping_edit_header_customer='お届け先の追加'（en 'Add Delivery Address'）、非会員時 shipping_edit_header_nonmember='お届け先の変更'（en 'Change Delivery Address'）。設計指定文言はロケールに不在。
- mismatchReason: shipping_edit.twig の見出し出力キーを特定し、messages.ja/en.yaml で当該キーの値を確認。設計指定文言（日英）を grep して実装に存在しないことを確認。
- designRefDetail: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-5
- implRef: src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:62,64,74,76 / messages.ja.yaml:1516-1517 / messages.en.yaml:1308-1309

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f04-03_0304_sheet-5_sheet-conformance-0bfec35ef759",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-5",
  "designRefDetail": null,
  "designExpectation": "編集画面の見出しは『配送先の新規登録・変更』（英語 Register New/Change Address）を表示。",
  "designQuote": "編集画面の見出しは『配送先の新規登録・変更』（英語 Register New/Change Address）を表示。",
  "implRef": "src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:62,64,74,76 / messages.ja.yaml:1516-1517 / messages.en.yaml:1308-1309",
  "implementationActual": "見出しは会員時 front.shopping.shipping_edit_header_customer='お届け先の追加'（en 'Add Delivery Address'）、非会員時 shipping_edit_header_nonmember='お届け先の変更'（en 'Change Delivery Address'）。設計指定文言はロケールに不在。",
  "difference": "shipping_edit.twig の見出し出力キーを特定し、messages.ja/en.yaml で当該キーの値を確認。設計指定文言（日英）を grep して実装に存在しないことを確認。",
  "mismatchReason": "shipping_edit.twig の見出し出力キーを特定し、messages.ja/en.yaml で当該キーの値を確認。設計指定文言（日英）を grep して実装に存在しないことを確認。",
  "comparisonRows": [
    {
      "item": "見出し(日本語)",
      "design": "配送先の新規登録・変更",
      "implementation": "お届け先の追加／お届け先の変更",
      "mismatch": "文言不一致"
    },
    {
      "item": "見出し(英語)",
      "design": "Register New/Change Address",
      "implementation": "Add Delivery Address／Change Delivery Address",
      "mismatch": "文言不一致"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f04-03_0304_sheet-5_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:62,64,74,76 / messages.ja.yaml:1516-1517 / messages.en.yaml:1308-1309",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「編集画面の見出しは『配送先の新規登録・変更』（英語 Register New/Change Address）を表示。」。実装は「見出しは会員時 front.shopping.shipping_edit_header_customer='お届け先の追加'（en 'Add Delivery Address'）、非会員時 shipping_edit_header_nonmember='お届け先の変更'（en 'Change Delivery Address'）。設計指定文言はロケールに不在。」。乖離理由は「shipping_edit.twig の見出し出力キーを特定し、messages.ja/en.yaml で当該キーの値を確認。設計指定文言（日英）を grep して実装に存在しないことを確認。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "Repository・Entity・DB",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1887\n1884:       </section>\n1885:       <!-- function-design-embed:end f04-02-f04-02_front_cart_shopping_order_method -->\n1886: </section>\n1887:       <section class=\"sheet-panel\" id=\"sheet-5\">\n1888:         <div class=\"sheet-heading\">\n1889:           <h2>配送先の新規登録_変更</h2>\n1890:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:62,64,74,76",
    "src/Eccube/Resource/template/default/Shopping/shipping_edit.twig"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:62\n59:                 <li class=\"p-hareruya-breadcrumb__item p-hareruya-breadcrumb__item--current\" itemprop=\"itemListElement\" itemscope itemtype=\"https://schema.org/ListItem\">\n60:                     <span class=\"p-hareruya-breadcrumb__current\" aria-current=\"page\">\n61:                         {% if is_granted('ROLE_USER') %}\n62:                             <span itemprop=\"name\">{{ 'front.shopping.shipping_edit_header_customer'|trans }}</span>\n63:                         {% else %}\n64:                             <span itemprop=\"name\">{{ 'front.shopping.shipping_edit_header_nonmember'|trans }}</span>\n65:                         {% endif %}",
    "src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:1\n1: {#\n2: This file is part of EC-CUBE\n3: \n4: Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved."
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f04-03_0304_sheet-5_sheet.json#f04-03_0304_sheet-5_sheet-conformance-eb1c8bd8f973`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f04-03_0304_sheet-5_sheet.json`
- sourceFindingId: `f04-03_0304_sheet-5_sheet-conformance-eb1c8bd8f973`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f04-03_0304_sheet-5_sheet` / F04-03 配送先の新規登録_変更
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: 編集画面の住所欄の下に入力注意『※町名・番地の入力漏れにご注意ください。』（日本語のみ）を表示。
- implementationActual: 住所（都道府県＋住所1/2、海外住所1-3）ブロックに『町名・番地の入力漏れにご注意ください。』相当の注意文が出力されていない。文言キー front.entry.address.note:464 / front.mypage.delivery.address_help:745 は存在するが本画面で未使用。
- mismatchReason: shipping_edit.twig の住所セクション(231-288)を精読、および template を grep し当該注意文が無いことを確認。
- designRefDetail: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-5
- implRef: 不在（src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:231-288）

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f04-03_0304_sheet-5_sheet-conformance-eb1c8bd8f973",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-5",
  "designRefDetail": null,
  "designExpectation": "編集画面の住所欄の下に入力注意『※町名・番地の入力漏れにご注意ください。』（日本語のみ）を表示。",
  "designQuote": "編集画面の住所欄の下に入力注意『※町名・番地の入力漏れにご注意ください。』（日本語のみ）を表示。",
  "implRef": "不在（src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:231-288）",
  "implementationActual": "住所（都道府県＋住所1/2、海外住所1-3）ブロックに『町名・番地の入力漏れにご注意ください。』相当の注意文が出力されていない。文言キー front.entry.address.note:464 / front.mypage.delivery.address_help:745 は存在するが本画面で未使用。",
  "difference": "shipping_edit.twig の住所セクション(231-288)を精読、および template を grep し当該注意文が無いことを確認。",
  "mismatchReason": "shipping_edit.twig の住所セクション(231-288)を精読、および template を grep し当該注意文が無いことを確認。",
  "comparisonRows": [
    {
      "item": "住所欄下の入力注意",
      "design": "『※町名・番地の入力漏れにご注意ください。』を表示",
      "implementation": "注意文なし",
      "mismatch": "未表示"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f04-03_0304_sheet-5_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "不在（src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:231-288）",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「編集画面の住所欄の下に入力注意『※町名・番地の入力漏れにご注意ください。』（日本語のみ）を表示。」。実装は「住所（都道府県＋住所1/2、海外住所1-3）ブロックに『町名・番地の入力漏れにご注意ください。』相当の注意文が出力されていない。文言キー front.entry.address.note:464 / front.mypage.delivery.address_help:745 は存在するが本画面で未使用。」。乖離理由は「shipping_edit.twig の住所セクション(231-288)を精読、および template を grep し当該注意文が無いことを確認。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "Form・入力項目",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1887\n1884:       </section>\n1885:       <!-- function-design-embed:end f04-02-f04-02_front_cart_shopping_order_method -->\n1886: </section>\n1887:       <section class=\"sheet-panel\" id=\"sheet-5\">\n1888:         <div class=\"sheet-heading\">\n1889:           <h2>配送先の新規登録_変更</h2>\n1890:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:231-288",
    "src/Eccube/Resource/template/default/Shopping/shipping_edit.twig"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:231\n228:                                 </div>\n229:                             {% endif %}\n230: \n231:                             {% if form.country.vars.value == constant('Eccube\\\\Entity\\\\Master\\\\Country::JAPAN') %}\n232:                                 <div class=\"p-hareruya-form-block p-hareruya-entry__address\">\n233:                                     <fieldset class=\"p-hareruya-form-block__fieldset\">\n234:                                         <legend class=\"p-hareruya-form-block__label-wrap\">",
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

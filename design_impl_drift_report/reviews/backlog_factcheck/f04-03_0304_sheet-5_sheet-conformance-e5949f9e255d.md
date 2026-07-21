# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f04-03_0304_sheet-5_sheet.json#f04-03_0304_sheet-5_sheet-conformance-e5949f9e255d`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f04-03_0304_sheet-5_sheet.json`
- sourceFindingId: `f04-03_0304_sheet-5_sheet-conformance-e5949f9e255d`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f04-03_0304_sheet-5_sheet` / F04-03 配送先の新規登録_変更
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: 編集画面表示時に注意文『既にいただいています（準備中も含む）ご注文の注文者ならびに配送先の情報は変更されませんので、変更が必要な場合は弊社へご連絡をお願い致します。』を常時表示。
- implementationActual: shipping_edit.twig に front.mypage.delivery.edit_notice の案内文が一切出力されていない。当該キーは messages.ja.yaml:744 に存在するが使用箇所は Mypage/delivery_edit.twig のみ。
- mismatchReason: shopping_shipping_edit ルートの描画テンプレートが Shopping/shipping_edit.twig であることを ShoppingController.php:761-763 で確認。同テンプレート全文を精読・grep し edit_notice/変更されません/弊社へご連絡 が無いことを確認。
- designRefDetail: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-5
- implRef: 不在（src/Eccube/Resource/template/default/Shopping/shipping_edit.twig）

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f04-03_0304_sheet-5_sheet-conformance-e5949f9e255d",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-5",
  "designRefDetail": null,
  "designExpectation": "編集画面表示時に注意文『既にいただいています（準備中も含む）ご注文の注文者ならびに配送先の情報は変更されませんので、変更が必要な場合は弊社へご連絡をお願い致します。』を常時表示。",
  "designQuote": "編集画面表示時に注意文『既にいただいています（準備中も含む）ご注文の注文者ならびに配送先の情報は変更されませんので、変更が必要な場合は弊社へご連絡をお願い致します。』を常時表示。",
  "implRef": "不在（src/Eccube/Resource/template/default/Shopping/shipping_edit.twig）",
  "implementationActual": "shipping_edit.twig に front.mypage.delivery.edit_notice の案内文が一切出力されていない。当該キーは messages.ja.yaml:744 に存在するが使用箇所は Mypage/delivery_edit.twig のみ。",
  "difference": "shopping_shipping_edit ルートの描画テンプレートが Shopping/shipping_edit.twig であることを ShoppingController.php:761-763 で確認。同テンプレート全文を精読・grep し edit_notice/変更されません/弊社へご連絡 が無いことを確認。",
  "mismatchReason": "shopping_shipping_edit ルートの描画テンプレートが Shopping/shipping_edit.twig であることを ShoppingController.php:761-763 で確認。同テンプレート全文を精読・grep し edit_notice/変更されません/弊社へご連絡 が無いことを確認。",
  "comparisonRows": [
    {
      "item": "変更不可の案内文",
      "design": "編集画面で常時表示",
      "implementation": "shipping_edit.twig に出力なし（Mypage側のみ）",
      "mismatch": "本機能画面で未表示"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f04-03_0304_sheet-5_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "不在（src/Eccube/Resource/template/default/Shopping/shipping_edit.twig）",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「編集画面表示時に注意文『既にいただいています（準備中も含む）ご注文の注文者ならびに配送先の情報は変更されませんので、変更が必要な場合は弊社へご連絡をお願い致します。』を常時表示。」。実装は「shipping_edit.twig に front.mypage.delivery.edit_notice の案内文が一切出力されていない。当該キーは messages.ja.yaml:744 に存在するが使用箇所は Mypage/delivery_edit.twig のみ。」。乖離理由は「shopping_shipping_edit ルートの描画テンプレートが Shopping/shipping_edit.twig であることを ShoppingController.php:761-763 で確認。同テンプレート全文を精読・grep し edit_notice/変更されません/弊社へご連絡 が無いことを確認。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "ルート・Controller",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1887\n1884:       </section>\n1885:       <!-- function-design-embed:end f04-02-f04-02_front_cart_shopping_order_method -->\n1886: </section>\n1887:       <section class=\"sheet-panel\" id=\"sheet-5\">\n1888:         <div class=\"sheet-heading\">\n1889:           <h2>配送先の新規登録_変更</h2>\n1890:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Shopping/shipping_edit.twig"
  ],
  "implementationSnippets": [
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

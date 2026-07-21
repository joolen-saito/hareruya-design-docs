# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f05-03_0305_sheet-5_sheet.json#f05-03_0305_sheet-5_sheet-conformance-3737dafffede`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f05-03_0305_sheet-5_sheet.json`
- sourceFindingId: `f05-03_0305_sheet-5_sheet-conformance-3737dafffede`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f05-03_0305_sheet-5_sheet` / F05-03 ネット買取商品一覧
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: 買取商品一覧の「マイナス（商品数減）ボタン」：押下すると商品数を1つ減らす。商品数が1の場合に押下すると、商品数を20にする（20へ循環させる）。
- implementationActual: 買取一覧カード（Block/_purchase_product_card.twig の .purchase-detail-qty）に適用される .btn-minus ハンドラは v>1 の時のみ v-- する実装で、商品数が1のとき押下しても何も起きず1で停止する。コメントに『買取カートは1枚以上が前提のため…1で止める』と明記。
- mismatchReason: 設計は識別ID8で『商品数が1の場合に押下すると、商品数を20にする』循環挙動を明示。実装は1で下限固定し20へ戻さない。card twig は .purchase-detail-qty を用い body_class に purchase_page を含むため当ハンドラが適用される。他JS（hareruya-products.js等）に循環処理は不在。
- designRefDetail: excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-5（レイアウト図 識別ID8 マイナス 商品数減ボタン）
- implRef: ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/Purchase/purchase_js.twig:44-55

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f05-03_0305_sheet-5_sheet-conformance-3737dafffede",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-5",
  "designRefDetail": "excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-5（レイアウト図 識別ID8 マイナス 商品数減ボタン）",
  "designExpectation": "買取商品一覧の「マイナス（商品数減）ボタン」：押下すると商品数を1つ減らす。商品数が1の場合に押下すると、商品数を20にする（20へ循環させる）。",
  "designQuote": "買取商品一覧の「マイナス（商品数減）ボタン」：押下すると商品数を1つ減らす。商品数が1の場合に押下すると、商品数を20にする（20へ循環させる）。",
  "implRef": "ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/Purchase/purchase_js.twig:44-55",
  "implementationActual": "買取一覧カード（Block/_purchase_product_card.twig の .purchase-detail-qty）に適用される .btn-minus ハンドラは v>1 の時のみ v-- する実装で、商品数が1のとき押下しても何も起きず1で停止する。コメントに『買取カートは1枚以上が前提のため…1で止める』と明記。",
  "difference": "設計は識別ID8で『商品数が1の場合に押下すると、商品数を20にする』循環挙動を明示。実装は1で下限固定し20へ戻さない。card twig は .purchase-detail-qty を用い body_class に purchase_page を含むため当ハンドラが適用される。他JS（hareruya-products.js等）に循環処理は不在。",
  "mismatchReason": "設計は識別ID8で『商品数が1の場合に押下すると、商品数を20にする』循環挙動を明示。実装は1で下限固定し20へ戻さない。card twig は .purchase-detail-qty を用い body_class に purchase_page を含むため当ハンドラが適用される。他JS（hareruya-products.js等）に循環処理は不在。",
  "comparisonRows": [
    {
      "item": "商品数=1でマイナス押下",
      "design": "商品数を20にする（循環）",
      "implementation": "1のまま変化なし（v>1判定でスキップ）",
      "mismatch": "循環（→20）が未実装、1で下限固定"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f05-03_0305_sheet-5_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/Purchase/purchase_js.twig:44-55",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「買取商品一覧の「マイナス（商品数減）ボタン」：押下すると商品数を1つ減らす。商品数が1の場合に押下すると、商品数を20にする（20へ循環させる）。」。実装は「買取一覧カード（Block/_purchase_product_card.twig の .purchase-detail-qty）に適用される .btn-minus ハンドラは v>1 の時のみ v-- する実装で、商品数が1のとき押下しても何も起きず1で停止する。コメントに『買取カートは1枚以上が前提のため…1で止める』と明記。」。乖離理由は「設計は識別ID8で『商品数が1の場合に押下すると、商品数を20にする』循環挙動を明示。実装は1で下限固定し20へ戻さない。card twig は .purchase-detail-qty を用い body_class に purchase_page を含むため当ハンドラが適用される。他JS（hareruya-products.js等）に循環処理は不在。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:1628\n1625:       </section>\n1626:       <!-- function-design-embed:end f05-02-f05-02_front_online_purchase_buy_product_search -->\n1627: </section>\n1628:       <section class=\"sheet-panel\" id=\"sheet-5\">\n1629:         <div class=\"sheet-heading\">\n1630:           <h2>ネット買取商品一覧</h2>\n1631:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Block/js/Purchase/purchase_js.twig:44-55",
    "src/Eccube/Resource/template/default/Block/js/Purchase/purchase_js.twig"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Block/js/Purchase/purchase_js.twig:44\n41:             $lab.text(v);\n42:         }\n43:     });\n44:     $(document).on('click', '.purchase_page .purchase-detail-qty .btn-minus', function () {\n45:         const $c = $(this).closest('.purchase-detail-qty');\n46:         const $inp = $c.find('.qty-input');\n47:         const $lab = $c.find('.qty-label');",
    "src/Eccube/Resource/template/default/Block/js/Purchase/purchase_js.twig:1\n1: <script>\n2: const purchaseCartMaxQtyPerLine = {{ purchaseCartMaxQtyPerLine|default(20) }};\n3: window.addEventListener('load', function() {\n4:     const $purchaseModal = $('#purchase-add-cart-ec-modal');"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

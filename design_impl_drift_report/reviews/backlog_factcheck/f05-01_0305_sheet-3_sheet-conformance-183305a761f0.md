# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f05-01_0305_sheet-3_sheet.json#f05-01_0305_sheet-3_sheet-conformance-183305a761f0`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f05-01_0305_sheet-3_sheet.json`
- sourceFindingId: `f05-01_0305_sheet-3_sheet-conformance-183305a761f0`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f05-01_0305_sheet-3_sheet` / F05-01 ネット買取トップページ
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: 買取特集コーナーの各商品カードに『週間販売数』ラベルを表示する（PCのみ表示）。
- implementationActual: 買取特集コーナーは lazyRender='purchase_special_corner' を送るが、Controller の lazy 応答分岐(781-809)は 'detail'/'search'/'purchase_feature' 以外を既定の purchase_product_list_unisearch.twig で描画。同twigのカードは 画像／カード言語ラベル／商品名／買取価格 のみで週間販売数の出力要素がなく、buildPurchaseUnisear…
- mismatchReason: 特集コーナー専用の描画分岐が Controller に無く既定twigへフォールバックし、そのtwig・カードデータいずれにも週間販売数(PCのみ)を出力する実装が存在しない。
- designRefDetail: excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-3（買取特集コーナー 画面部品6 週間販売数 ラベル・PCのみ表示）
- implRef: src/Eccube/Resource/template/default/Block/purchase_product_list_unisearch.twig:1-45, src/Eccube/Controller/Front/Purchase/PurchaseController.php:806-809

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f05-01_0305_sheet-3_sheet-conformance-183305a761f0",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-3",
  "designRefDetail": "excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-3（買取特集コーナー 画面部品6 週間販売数 ラベル・PCのみ表示）",
  "designExpectation": "買取特集コーナーの各商品カードに『週間販売数』ラベルを表示する（PCのみ表示）。",
  "designQuote": "買取特集コーナーの各商品カードに『週間販売数』ラベルを表示する（PCのみ表示）。",
  "implRef": "src/Eccube/Resource/template/default/Block/purchase_product_list_unisearch.twig:1-45, src/Eccube/Controller/Front/Purchase/PurchaseController.php:806-809",
  "implementationActual": "買取特集コーナーは lazyRender='purchase_special_corner' を送るが、Controller の lazy 応答分岐(781-809)は 'detail'/'search'/'purchase_feature' 以外を既定の purchase_product_list_unisearch.twig で描画。同twigのカードは 画像／カード言語ラベル／商品名／買取価格 のみで週間販売数の出力要素がなく、buildPurchaseUnisearchCardsFromDocs もカードに週間販売数を含めない。週間販売数相当の文字列は purchase 系 twig/JS に 0件。",
  "difference": "特集コーナー専用の描画分岐が Controller に無く既定twigへフォールバックし、そのtwig・カードデータいずれにも週間販売数(PCのみ)を出力する実装が存在しない。",
  "mismatchReason": "特集コーナー専用の描画分岐が Controller に無く既定twigへフォールバックし、そのtwig・カードデータいずれにも週間販売数(PCのみ)を出力する実装が存在しない。",
  "comparisonRows": [
    {
      "item": "買取特集コーナーカードの週間販売数ラベル(PCのみ)",
      "design": "表示する",
      "implementation": "twig・カードデータともに出力要素なし",
      "mismatch": "未実装"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f05-01_0305_sheet-3_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Resource/template/default/Block/purchase_product_list_unisearch.twig:1-45, src/Eccube/Controller/Front/Purchase/PurchaseController.php:806-809",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「買取特集コーナーの各商品カードに『週間販売数』ラベルを表示する（PCのみ表示）。」。実装は「買取特集コーナーは lazyRender='purchase_special_corner' を送るが、Controller の lazy 応答分岐(781-809)は 'detail'/'search'/'purchase_feature' 以外を既定の purchase_product_list_unisearch.twig で描画。同twigのカードは 画像／カード言語ラベル／商品名／買取価格 のみで週間販売数の出力要素がなく、buildPurchaseUnisearchCardsFromDocs もカード…」。乖離理由は「特集コーナー専用の描画分岐が Controller に無く既定twigへフォールバックし、そのtwig・カードデータいずれにも週間販売数(PCのみ)を出力する実装が存在しない。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "業務ロジック・外部連携未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "ルート・Controller",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:851\n848:           </div>\n849:         </div>\n850:       </section>\n851:       <section class=\"sheet-panel\" id=\"sheet-3\">\n852:         <div class=\"sheet-heading\">\n853:           <h2>ネット買取トップページ</h2>\n854:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Block/purchase_product_list_unisearch.twig:1-45",
    "src/Eccube/Controller/Front/Purchase/PurchaseController.php:806-809",
    "src/Eccube/Resource/template/default/Block/purchase_product_list_unisearch.twig",
    "src/Eccube/Controller/Front/Purchase/PurchaseController.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Block/purchase_product_list_unisearch.twig:1\n1: {#\n2:    買取トップ新着商品: UniSearch lazy 応答用の買取カード一覧。\n3:    表示は UniSearch doc を優先し、買取価格のみ DB（buyPrices）から取得する。\n4: #}",
    "src/Eccube/Controller/Front/Purchase/PurchaseController.php:806\n803:             ]);\n804:         }\n805: \n806:         return $this->render('Block/purchase_product_list_unisearch.twig', [\n807:             'cards' => $cards,\n808:         ]);\n809:     }",
    "src/Eccube/Resource/template/default/Block/purchase_product_list_unisearch.twig:1\n1: {#\n2:    買取トップ新着商品: UniSearch lazy 応答用の買取カード一覧。\n3:    表示は UniSearch doc を優先し、買取価格のみ DB（buyPrices）から取得する。\n4: #}"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

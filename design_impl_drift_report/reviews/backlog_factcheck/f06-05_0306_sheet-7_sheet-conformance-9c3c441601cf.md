# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-05_0306_sheet-7_sheet.json#f06-05_0306_sheet-7_sheet-conformance-9c3c441601cf`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-05_0306_sheet-7_sheet.json`
- sourceFindingId: `f06-05_0306_sheet-7_sheet-conformance-9c3c441601cf`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-05_0306_sheet-7_sheet` / F06-05 マイページ
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: 画面部品(5)バーコードは会員本人を店頭POSで識別するためのバーコードであり、店頭受取注文の際に読み取るとスマレジと連携して会員の注文履歴に登録・ポイント付与される。バーコードは各会員のスマレジ会員コードを表す必要がある。
- implementationActual: 22行目 barcode('{{ Customer.getSmaregiMemberCode }}',...) がコメントアウトされ、23行目で全会員共通の固定EAN13 '2900065596792' を描画。Customer.php:1075 に getSmaregiMemberCode() が実在するが未使用。
- mismatchReason: 実バーコードが全会員同一の固定値のため店頭POSで会員本人を識別できず、注文履歴登録・ポイント付与という設計要求を満たさない。
- designRefDetail: excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-7 (機能仕様 (4)バーコードについて / 画面部品説明 識別ID5 バーコード)
- implRef: src/Eccube/Resource/template/default/Block/js/point_barcode_js.twig:22-23

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-05_0306_sheet-7_sheet-conformance-9c3c441601cf",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-7",
  "designRefDetail": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-7 (機能仕様 (4)バーコードについて / 画面部品説明 識別ID5 バーコード)",
  "designExpectation": "画面部品(5)バーコードは会員本人を店頭POSで識別するためのバーコードであり、店頭受取注文の際に読み取るとスマレジと連携して会員の注文履歴に登録・ポイント付与される。バーコードは各会員のスマレジ会員コードを表す必要がある。",
  "designQuote": "画面部品(5)バーコードは会員本人を店頭POSで識別するためのバーコードであり、店頭受取注文の際に読み取るとスマレジと連携して会員の注文履歴に登録・ポイント付与される。バーコードは各会員のスマレジ会員コードを表す必要がある。",
  "implRef": "src/Eccube/Resource/template/default/Block/js/point_barcode_js.twig:22-23",
  "implementationActual": "22行目 barcode('{{ Customer.getSmaregiMemberCode }}',...) がコメントアウトされ、23行目で全会員共通の固定EAN13 '2900065596792' を描画。Customer.php:1075 に getSmaregiMemberCode() が実在するが未使用。",
  "difference": "実バーコードが全会員同一の固定値のため店頭POSで会員本人を識別できず、注文履歴登録・ポイント付与という設計要求を満たさない。",
  "mismatchReason": "実バーコードが全会員同一の固定値のため店頭POSで会員本人を識別できず、注文履歴登録・ポイント付与という設計要求を満たさない。",
  "comparisonRows": [
    {
      "item": "バーコード値",
      "design": "各会員のスマレジ会員コード(EAN13)",
      "implementation": "固定値 '2900065596792'",
      "mismatch": "会員別ではなく全会員共通固定値"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-05_0306_sheet-7_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Resource/template/default/Block/js/point_barcode_js.twig:22-23",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「画面部品(5)バーコードは会員本人を店頭POSで識別するためのバーコードであり、店頭受取注文の際に読み取るとスマレジと連携して会員の注文履歴に登録・ポイント付与される。バーコードは各会員のスマレジ会員コードを表す必要がある。」。実装は「22行目 barcode('{{ Customer.getSmaregiMemberCode }}',...) がコメントアウトされ、23行目で全会員共通の固定EAN13 '2900065596792' を描画。Customer.php:1075 に getSmaregiMemberCode() が実在するが未使用。」。乖離理由は「実バーコードが全会員同一の固定値のため店頭POSで会員本人を識別できず、注文履歴登録・ポイント付与という設計要求を満たさない。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "Repository・Entity・DB",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:2537\n2534:       </section>\n2535:       <!-- function-design-embed:end f06-04-f06-04_front_member_forgot_password_reset -->\n2536: </section>\n2537:       <section class=\"sheet-panel\" id=\"sheet-7\">\n2538:         <div class=\"sheet-heading\">\n2539:           <h2>マイページ</h2>\n2540:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Block/js/point_barcode_js.twig:22-23",
    "src/Eccube/Resource/template/default/Block/js/point_barcode_js.twig"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Block/js/point_barcode_js.twig:22\n19:     });\n20: \n21:     $(function() {\n22:         {#$(\"#js-ec_point_barcode\").barcode('{{ Customer.getSmaregiMemberCode }}', \"ean13\", { barWidth:2, fontSize:14 });#}\n23:         $(\"#js-ec_point_barcode\").barcode('2900065596792', \"ean13\", { barWidth:2, fontSize:14 });\n24:     });\n25: }, false);",
    "src/Eccube/Resource/template/default/Block/js/point_barcode_js.twig:1\n1: <script>\n2: window.addEventListener('load', function() {\n3:     $('#js-ec_point_timer').startTimer({\n4:         onComplete: function(element){"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

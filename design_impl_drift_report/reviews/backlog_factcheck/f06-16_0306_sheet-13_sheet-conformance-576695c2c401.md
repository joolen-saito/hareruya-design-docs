# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-16_0306_sheet-13_sheet.json#f06-16_0306_sheet-13_sheet-conformance-576695c2c401`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-16_0306_sheet-13_sheet.json`
- sourceFindingId: `f06-16_0306_sheet-13_sheet-conformance-576695c2c401`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-16_0306_sheet-13_sheet` / F06-16 大会デッキ登録編集
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: カード名入力で部分一致するカードがサジェスト表示され、選択して自動入力できる（フォーマット別サジェストファイル参照）。
- implementationActual: サジェスト候補リスト <ul data-deckentry-card-suggest-list> は常に空。JS は入力有無で aria-hidden を切り替えるのみで、カード名取得の fetch/API・サジェストファイル読込が一切無い。Controller もサジェストデータを渡さない。
- mismatchReason: 部分一致サジェストの中核要求に対し候補データ供給源が実装に存在しない。UIの器だけあり機能が空。hareruya-event.js の grep でも deckentry-card-suggest セレクタのみで fetch/api 呼び出しなし。
- designRefDetail: excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-13（機能仕様『カード名(13)を入力すると…部分一致するカードがサジェスト表示される』）
- implRef: src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:234-237, html/template/default/assets/hareruya/js/hareruya-event.js, src/Eccube/Controller/Front/Mypage/DeckEntryController.php:85-92

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-16_0306_sheet-13_sheet-conformance-576695c2c401",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-13",
  "designRefDetail": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-13（機能仕様『カード名(13)を入力すると…部分一致するカードがサジェスト表示される』）",
  "designExpectation": "カード名入力で部分一致するカードがサジェスト表示され、選択して自動入力できる（フォーマット別サジェストファイル参照）。",
  "designQuote": "カード名入力で部分一致するカードがサジェスト表示され、選択して自動入力できる（フォーマット別サジェストファイル参照）。",
  "implRef": "src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:234-237, html/template/default/assets/hareruya/js/hareruya-event.js, src/Eccube/Controller/Front/Mypage/DeckEntryController.php:85-92",
  "implementationActual": "サジェスト候補リスト <ul data-deckentry-card-suggest-list> は常に空。JS は入力有無で aria-hidden を切り替えるのみで、カード名取得の fetch/API・サジェストファイル読込が一切無い。Controller もサジェストデータを渡さない。",
  "difference": "部分一致サジェストの中核要求に対し候補データ供給源が実装に存在しない。UIの器だけあり機能が空。hareruya-event.js の grep でも deckentry-card-suggest セレクタのみで fetch/api 呼び出しなし。",
  "mismatchReason": "部分一致サジェストの中核要求に対し候補データ供給源が実装に存在しない。UIの器だけあり機能が空。hareruya-event.js の grep でも deckentry-card-suggest セレクタのみで fetch/api 呼び出しなし。",
  "comparisonRows": [
    {
      "item": "カード名サジェスト",
      "design": "部分一致候補をサジェスト表示し選択で自動入力",
      "implementation": "候補リスト空・aria-hidden切替のみ・データ供給なし",
      "mismatch": "機能が空（データ源不在）"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-16_0306_sheet-13_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:234-237, html/template/default/assets/hareruya/js/hareruya-event.js, src/Eccube/Controller/Front/Mypage/DeckEntryController.php:85-92",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「カード名入力で部分一致するカードがサジェスト表示され、選択して自動入力できる（フォーマット別サジェストファイル参照）。」。実装は「サジェスト候補リスト <ul data-deckentry-card-suggest-list> は常に空。JS は入力有無で aria-hidden を切り替えるのみで、カード名取得の fetch/API・サジェストファイル読込が一切無い。Controller もサジェストデータを渡さない。」。乖離理由は「部分一致サジェストの中核要求に対し候補データ供給源が実装に存在しない。UIの器だけあり機能が空。hareruya-event.js の grep でも deckentry-card-suggest セレクタのみで fetch/api 呼び出しなし。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ルート・Controller",
    "Form・入力項目",
    "Twig・画面表示",
    "CSV・API・Batch・PDF・印刷"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4169\n4166:       </section>\n4167:       <!-- function-design-embed:end f06-14-f06-14_front_member_mypage_event_reserved_list -->\n4168: </section>\n4169:       <section class=\"sheet-panel\" id=\"sheet-13\">\n4170:         <div class=\"sheet-heading\">\n4171:           <h2>大会デッキ登録編集</h2>\n4172:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:234-237",
    "src/Eccube/Controller/Front/Mypage/DeckEntryController.php:85-92",
    "src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig",
    "src/Eccube/Controller/Front/Mypage/DeckEntryController.php",
    "html/template/default/assets/hareruya/js/hareruya-event.js"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:234\n231:                     <div class=\"p-hareruya-deckentry-edit__card-select-group\">\n232:                         <label class=\"p-hareruya-deckentry-edit__card-select-subtitle\" for=\"cardNameInput\">カード名から登録</label>\n233:                         <div class=\"p-hareruya-deckentry-edit__card-input-wrapper\">\n234:                             <input class=\"p-hareruya-deckentry-edit__card-input\" type=\"text\" id=\"cardNameInput\" name=\"cardNameInput\" placeholder=\"カード名\">\n235:                             <div class=\"p-hareruya-deckentry-edit__card-suggest\" data-deckentry-card-suggest aria-hidden=\"true\">\n236:                                 <ul class=\"p-hareruya-deckentry-edit__card-suggest-list\" data-deckentry-card-suggest-list>\n237:                                 </ul>",
    "src/Eccube/Controller/Front/Mypage/DeckEntryController.php:85\n82:             ['createDate' => 'DESC']\n83:         );\n84: \n85:         return [\n86:             'EventDetail' => $EventDetail,\n87:             'Player' => $Player,\n88:             'Customer' => $Customer,",
    "src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:1\n1: {% extends 'default_frame.twig' %}\n2: \n3: {% set mypageno = 'deckentry' %}\n4: {% set body_class = 'mypage front_page p-deckentry-edit' %}"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

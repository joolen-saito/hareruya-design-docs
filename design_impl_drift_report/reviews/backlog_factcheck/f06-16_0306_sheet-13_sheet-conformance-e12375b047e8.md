# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-16_0306_sheet-13_sheet.json#f06-16_0306_sheet-13_sheet-conformance-e12375b047e8`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-16_0306_sheet-13_sheet.json`
- sourceFindingId: `f06-16_0306_sheet-13_sheet-conformance-e12375b047e8`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-16_0306_sheet-13_sheet` / F06-16 大会デッキ登録編集
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: No.4 大会名『()内にフォーマットを表示』。イベント名（フォーマット併記）を表示する。
- implementationActual: event-title は {{ EventDetail.event.nameJp }} のみ出力。括弧内へのフォーマット併記処理がテンプレート・Controller に存在しない。
- mismatchReason: 設計は大会名の後ろに『(フォーマット)』を併記する要求。テンプレートにフォーマット連結処理がなく、Controller も併記文字列を渡していない。
- designRefDetail: excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-13（レイアウト表 No.4 大会名『()内にフォーマットを表示』）
- implRef: src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:165

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-16_0306_sheet-13_sheet-conformance-e12375b047e8",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-13",
  "designRefDetail": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-13（レイアウト表 No.4 大会名『()内にフォーマットを表示』）",
  "designExpectation": "No.4 大会名『()内にフォーマットを表示』。イベント名（フォーマット併記）を表示する。",
  "designQuote": "No.4 大会名『()内にフォーマットを表示』。イベント名（フォーマット併記）を表示する。",
  "implRef": "src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:165",
  "implementationActual": "event-title は {{ EventDetail.event.nameJp }} のみ出力。括弧内へのフォーマット併記処理がテンプレート・Controller に存在しない。",
  "difference": "設計は大会名の後ろに『(フォーマット)』を併記する要求。テンプレートにフォーマット連結処理がなく、Controller も併記文字列を渡していない。",
  "mismatchReason": "設計は大会名の後ろに『(フォーマット)』を併記する要求。テンプレートにフォーマット連結処理がなく、Controller も併記文字列を渡していない。",
  "comparisonRows": [
    {
      "item": "大会名フォーマット併記",
      "design": "大会名の()内にフォーマットを表示",
      "implementation": "nameJp のみ、フォーマット併記なし",
      "mismatch": "フォーマット併記が不在"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-16_0306_sheet-13_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:165",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「No.4 大会名『()内にフォーマットを表示』。イベント名（フォーマット併記）を表示する。」。実装は「event-title は {{ EventDetail.event.nameJp }} のみ出力。括弧内へのフォーマット併記処理がテンプレート・Controller に存在しない。」。乖離理由は「設計は大会名の後ろに『(フォーマット)』を併記する要求。テンプレートにフォーマット連結処理がなく、Controller も併記文字列を渡していない。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "入出力・列定義・副作用未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ルート・Controller",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4169\n4166:       </section>\n4167:       <!-- function-design-embed:end f06-14-f06-14_front_member_mypage_event_reserved_list -->\n4168: </section>\n4169:       <section class=\"sheet-panel\" id=\"sheet-13\">\n4170:         <div class=\"sheet-heading\">\n4171:           <h2>大会デッキ登録編集</h2>\n4172:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:165",
    "src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:165\n162:             </div>\n163: \n164:             <div class=\"p-hareruya-deckentry-edit__event-section\">\n165:                 <h2 class=\"p-hareruya-deckentry-edit__event-title\">{{ EventDetail.event.nameJp }}</h2>\n166:                 <dl class=\"p-hareruya-deckentry-edit__event-detail\">\n167:                     <div class=\"p-hareruya-deckentry-edit__event-row\">\n168:                         <dt class=\"p-hareruya-deckentry-edit__event-label\">開催日時：</dt>",
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

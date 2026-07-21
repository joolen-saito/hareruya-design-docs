# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-16_0306_sheet-13_sheet.json#f06-16_0306_sheet-13_sheet-conformance-28af8b937cd0`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-16_0306_sheet-13_sheet.json`
- sourceFindingId: `f06-16_0306_sheet-13_sheet-conformance-28af8b937cd0`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-16_0306_sheet-13_sheet` / F06-16 大会デッキ登録編集
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: マイデッキ取得ポップアップに検索結果総数(2)・表示件数(3)・ページング(4)を表示。ページングは1ページ最大20件、ページ切り替えは動的処理。
- implementationActual: マイデッキモーダルは MyDecks を全件 {% for %} で列挙するのみ。総数・表示件数ラベル、20件毎の動的ページングUIが不在。Controller の findBy は件数無制限でページング用データを渡さない。
- mismatchReason: 設計はページング(最大20件/動的切替)・総数・表示件数の表示を明示。テンプレート/Controller に該当UI・データが無い。フォーマット絞り込み(select_format)のみ実装済み。
- designRefDetail: excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-13（マイデッキ取得ポップアップ レイアウト表 No.2 検索結果総数／No.3 表示件数／No.4 ページング）
- implRef: src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:363-420, src/Eccube/Controller/Front/Mypage/DeckEntryController.php:75-78

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-16_0306_sheet-13_sheet-conformance-28af8b937cd0",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-13",
  "designRefDetail": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-13（マイデッキ取得ポップアップ レイアウト表 No.2 検索結果総数／No.3 表示件数／No.4 ページング）",
  "designExpectation": "マイデッキ取得ポップアップに検索結果総数(2)・表示件数(3)・ページング(4)を表示。ページングは1ページ最大20件、ページ切り替えは動的処理。",
  "designQuote": "マイデッキ取得ポップアップに検索結果総数(2)・表示件数(3)・ページング(4)を表示。ページングは1ページ最大20件、ページ切り替えは動的処理。",
  "implRef": "src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:363-420, src/Eccube/Controller/Front/Mypage/DeckEntryController.php:75-78",
  "implementationActual": "マイデッキモーダルは MyDecks を全件 {% for %} で列挙するのみ。総数・表示件数ラベル、20件毎の動的ページングUIが不在。Controller の findBy は件数無制限でページング用データを渡さない。",
  "difference": "設計はページング(最大20件/動的切替)・総数・表示件数の表示を明示。テンプレート/Controller に該当UI・データが無い。フォーマット絞り込み(select_format)のみ実装済み。",
  "mismatchReason": "設計はページング(最大20件/動的切替)・総数・表示件数の表示を明示。テンプレート/Controller に該当UI・データが無い。フォーマット絞り込み(select_format)のみ実装済み。",
  "comparisonRows": [
    {
      "item": "検索結果総数/表示件数",
      "design": "総数・表示件数ラベルを表示",
      "implementation": "ラベルなし",
      "mismatch": "表示要素が不在"
    },
    {
      "item": "ページング",
      "design": "最大20件/ページ・動的切替",
      "implementation": "全件列挙、ページングなし",
      "mismatch": "ページング機構が不在"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-16_0306_sheet-13_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:363-420, src/Eccube/Controller/Front/Mypage/DeckEntryController.php:75-78",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「マイデッキ取得ポップアップに検索結果総数(2)・表示件数(3)・ページング(4)を表示。ページングは1ページ最大20件、ページ切り替えは動的処理。」。実装は「マイデッキモーダルは MyDecks を全件 {% for %} で列挙するのみ。総数・表示件数ラベル、20件毎の動的ページングUIが不在。Controller の findBy は件数無制限でページング用データを渡さない。」。乖離理由は「設計はページング(最大20件/動的切替)・総数・表示件数の表示を明示。テンプレート/Controller に該当UI・データが無い。フォーマット絞り込み(select_format)のみ実装済み。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "入出力・列定義・副作用未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "ルート・Controller",
    "Form・入力項目",
    "Repository・Entity・DB",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4169\n4166:       </section>\n4167:       <!-- function-design-embed:end f06-14-f06-14_front_member_mypage_event_reserved_list -->\n4168: </section>\n4169:       <section class=\"sheet-panel\" id=\"sheet-13\">\n4170:         <div class=\"sheet-heading\">\n4171:           <h2>大会デッキ登録編集</h2>\n4172:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:363-420",
    "src/Eccube/Controller/Front/Mypage/DeckEntryController.php:75-78",
    "src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig",
    "src/Eccube/Controller/Front/Mypage/DeckEntryController.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:363\n360:                     <h3 class=\"c-hareruya-heading--lev3\">マイデッキを取得</h3>\n361:                 </div>\n362:             </div>\n363:             <div class=\"p-hareruya-modal__body\">\n364:                 {% if MyDecks|length > 0 %}\n365:                 <div class=\"p-hareruya-deckentry-edit__mydeck-filter\">\n366:                     <div class=\"p-hareruya-deckentry-edit__mydeck-filter-heading\">",
    "src/Eccube/Controller/Front/Mypage/DeckEntryController.php:75\n72:                 'EventDetail' => $EventDetail,\n73:                 'Format' => $Format,\n74:             ]);\n75:             if ($Deck !== null) {\n76:                 $deckByFormats[$Format->getId()] = $Deck;\n77:             }\n78:         }",
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

# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-17_0306_sheet-14_sheet.json#f06-17_0306_sheet-14_sheet-conformance-eeb5690f79c9`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-17_0306_sheet-14_sheet.json`
- sourceFindingId: `f06-17_0306_sheet-14_sheet-conformance-eeb5690f79c9`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-17_0306_sheet-14_sheet` / F06-17 大会デッキ登録確認～完了
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: デッキ登録完了画面（confirm/check）に、カスタマイズ新規追加項目として開催店舗（会場店舗）を表示する。DCIナンバー削除と対になる本機能固有の新規追加。
- implementationActual: deck_entry_check.twig は見出し・会員氏名・大会名(EventDetail.event.nameJp)・お名前(Deck.playerName)・フォーマット・メイン/サイドボード・カード画像・ボタンのみを描画。店舗/store/shop/venue/会場/開催 のいずれもテンプレートにヒットせず、check() コントローラも店舗のview変数を渡していない。
- mismatchReason: 設計はカスタマイズ新規追加として完了画面への開催店舗表示を要求するが、テンプレート・コントローラのどこにも開催店舗を表示する要素・view変数が存在しない。DtbEventDetail の hasStoreEntried() は店頭受付判定であり開催店舗の表示関連ではない。DCIナンバー削除は実装済（非表示）だが、開催店舗の追加表示のみ欠落。
- designRefDetail: excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-14（カスタマイズ要件『・開催店舗を表示する』／画面部品表 識別ID4 開催店舗ラベル『※カスタマイズ対応、開催店舗を表示する』）
- implRef: src/Eccube/Resource/template/default/Mypage/deck_entry_check.twig:1-101 ／ src/Eccube/Controller/Front/Mypage/DeckEntryController.php:161-194

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-17_0306_sheet-14_sheet-conformance-eeb5690f79c9",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-14",
  "designRefDetail": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-14（カスタマイズ要件『・開催店舗を表示する』／画面部品表 識別ID4 開催店舗ラベル『※カスタマイズ対応、開催店舗を表示する』）",
  "designExpectation": "デッキ登録完了画面（confirm/check）に、カスタマイズ新規追加項目として開催店舗（会場店舗）を表示する。DCIナンバー削除と対になる本機能固有の新規追加。",
  "designQuote": "デッキ登録完了画面（confirm/check）に、カスタマイズ新規追加項目として開催店舗（会場店舗）を表示する。DCIナンバー削除と対になる本機能固有の新規追加。",
  "implRef": "src/Eccube/Resource/template/default/Mypage/deck_entry_check.twig:1-101 ／ src/Eccube/Controller/Front/Mypage/DeckEntryController.php:161-194",
  "implementationActual": "deck_entry_check.twig は見出し・会員氏名・大会名(EventDetail.event.nameJp)・お名前(Deck.playerName)・フォーマット・メイン/サイドボード・カード画像・ボタンのみを描画。店舗/store/shop/venue/会場/開催 のいずれもテンプレートにヒットせず、check() コントローラも店舗のview変数を渡していない。",
  "difference": "設計はカスタマイズ新規追加として完了画面への開催店舗表示を要求するが、テンプレート・コントローラのどこにも開催店舗を表示する要素・view変数が存在しない。DtbEventDetail の hasStoreEntried() は店頭受付判定であり開催店舗の表示関連ではない。DCIナンバー削除は実装済（非表示）だが、開催店舗の追加表示のみ欠落。",
  "mismatchReason": "設計はカスタマイズ新規追加として完了画面への開催店舗表示を要求するが、テンプレート・コントローラのどこにも開催店舗を表示する要素・view変数が存在しない。DtbEventDetail の hasStoreEntried() は店頭受付判定であり開催店舗の表示関連ではない。DCIナンバー削除は実装済（非表示）だが、開催店舗の追加表示のみ欠落。",
  "comparisonRows": [
    {
      "item": "完了画面の開催店舗ラベル（画面部品#4）",
      "design": "開催店舗を表示する（カスタマイズ新規追加）",
      "implementation": "表示要素・view変数とも不在",
      "mismatch": "未実装（表示欠落）"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-17_0306_sheet-14_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Resource/template/default/Mypage/deck_entry_check.twig:1-101 ／ src/Eccube/Controller/Front/Mypage/DeckEntryController.php:161-194",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「デッキ登録完了画面（confirm/check）に、カスタマイズ新規追加項目として開催店舗（会場店舗）を表示する。DCIナンバー削除と対になる本機能固有の新規追加。」。実装は「deck_entry_check.twig は見出し・会員氏名・大会名(EventDetail.event.nameJp)・お名前(Deck.playerName)・フォーマット・メイン/サイドボード・カード画像・ボタンのみを描画。店舗/store/shop/venue/会場/開催 のいずれもテンプレートにヒットせず、check() コントローラも店舗のview変数を渡していない。」。乖離理由は「設計はカスタマイズ新規追加として完了画面への開催店舗表示を要求するが、テンプレート・コントローラのどこにも開催店舗を表示する要素・view変数が存在しない。DtbEventDetail の hasStoreEntried() は店頭受付判定であり開催店舗の表示関連ではない。DCIナンバー削除は実装済（非表示）だが、開催店舗の追加表示のみ欠落。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "入出力・列定義・副作用未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "Service・業務ルール",
    "Repository・Entity・DB",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4650\n4647:       </section>\n4648:       <!-- function-design-embed:end f06-16-f06-16_front_member_mypage_event_deck_edit -->\n4649: </section>\n4650:       <section class=\"sheet-panel\" id=\"sheet-14\">\n4651:         <div class=\"sheet-heading\">\n4652:           <h2>大会デッキ登録確認～完了</h2>\n4653:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Mypage/deck_entry_check.twig:1-101",
    "src/Eccube/Controller/Front/Mypage/DeckEntryController.php:161-194",
    "src/Eccube/Resource/template/default/Mypage/deck_entry_check.twig",
    "src/Eccube/Controller/Front/Mypage/DeckEntryController.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Mypage/deck_entry_check.twig:1\n1: {% extends 'default_frame.twig' %}\n2: \n3: {% set mypageno = 'deckentry' %}\n4: {% set body_class = 'mypage front_page p-deck-entry-check' %}",
    "src/Eccube/Controller/Front/Mypage/DeckEntryController.php:161\n158:      */\n159:     #[Route(path: '/deckentry/{deckId}/check', name: 'mypage_deckentry_check', requirements: ['deckId' => '\\d+'], methods: ['GET'])]\n160:     #[Template(template: 'Mypage/deck_entry_check.twig')]\n161:     public function check(int $deckId): array|Response\n162:     {\n163:         /** @var Customer $Customer */\n164:         $Customer = $this->getUser();",
    "src/Eccube/Resource/template/default/Mypage/deck_entry_check.twig:1\n1: {% extends 'default_frame.twig' %}\n2: \n3: {% set mypageno = 'deckentry' %}\n4: {% set body_class = 'mypage front_page p-deck-entry-check' %}"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

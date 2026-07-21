# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f03-06_0303_sheet-8_sheet.json#f03-06_0303_sheet-8_sheet-conformance-dee3a0ea42e6`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f03-06_0303_sheet-8_sheet.json`
- sourceFindingId: `f03-06_0303_sheet-8_sheet-conformance-dee3a0ea42e6`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f03-06_0303_sheet-8_sheet` / F03-06 最近チェックした商品
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: 履歴Cookie(history)が無い/空のとき、見出しに加えて履歴無しメッセージ『最近見た商品はありません。』（英語『No Recently Seen Items』, キー history.no_content 相当）を表示する。
- implementationActual: build が history Cookie 無し/空・有効IDなし時に ProductClasses=[] を返し（PayloadBuilder.php:50-53,63-68）、recently_viewed.twig はブロック全体を `{% if ProductClasses|length > 0 %}`（:4）で囲み else 分岐を持たない（:58 で if 閉じ）。履歴が無い場合は見出しも履歴無しメッセージも一切描画されない。
- mismatchReason: recently_viewed.twig / RecentlyViewedBlockPayloadBuilder.php / messages.ja.yaml / messages.en.yaml を確認。no_content 相当の翻訳キーは存在せず（recently_viewed 系は title のみ, ja.yaml:1199 / en.yaml:979）、履歴無し表示の描画分岐も無く未実装。
- designRefDetail: excel_to_html/output/0303_基本設計仕様書(フロント_商品).html#sheet-8（表示メッセージ節『履歴無し=最近見た商品はありません。/No Recently Seen Items』, フロント挙動『履歴が無い場合は最近見た商品が無い旨のメッセージを表示する』, エッジケース『履歴Cookieが無い→履歴無しの表示を描画する』）
- implRef: src/Eccube/Resource/template/default/Block/recently_viewed.twig:4,58 ; src/Eccube/Service/Block/RecentlyViewedBlockPayloadBuilder.php:50-68

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f03-06_0303_sheet-8_sheet-conformance-dee3a0ea42e6",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0303_基本設計仕様書(フロント_商品).html#sheet-8",
  "designRefDetail": "excel_to_html/output/0303_基本設計仕様書(フロント_商品).html#sheet-8（表示メッセージ節『履歴無し=最近見た商品はありません。/No Recently Seen Items』, フロント挙動『履歴が無い場合は最近見た商品が無い旨のメッセージを表示する』, エッジケース『履歴Cookieが無い→履歴無しの表示を描画する』）",
  "designExpectation": "履歴Cookie(history)が無い/空のとき、見出しに加えて履歴無しメッセージ『最近見た商品はありません。』（英語『No Recently Seen Items』, キー history.no_content 相当）を表示する。",
  "designQuote": "履歴Cookie(history)が無い/空のとき、見出しに加えて履歴無しメッセージ『最近見た商品はありません。』（英語『No Recently Seen Items』, キー history.no_content 相当）を表示する。",
  "implRef": "src/Eccube/Resource/template/default/Block/recently_viewed.twig:4,58 ; src/Eccube/Service/Block/RecentlyViewedBlockPayloadBuilder.php:50-68",
  "implementationActual": "build が history Cookie 無し/空・有効IDなし時に ProductClasses=[] を返し（PayloadBuilder.php:50-53,63-68）、recently_viewed.twig はブロック全体を `{% if ProductClasses|length > 0 %}`（:4）で囲み else 分岐を持たない（:58 で if 閉じ）。履歴が無い場合は見出しも履歴無しメッセージも一切描画されない。",
  "difference": "recently_viewed.twig / RecentlyViewedBlockPayloadBuilder.php / messages.ja.yaml / messages.en.yaml を確認。no_content 相当の翻訳キーは存在せず（recently_viewed 系は title のみ, ja.yaml:1199 / en.yaml:979）、履歴無し表示の描画分岐も無く未実装。",
  "mismatchReason": "recently_viewed.twig / RecentlyViewedBlockPayloadBuilder.php / messages.ja.yaml / messages.en.yaml を確認。no_content 相当の翻訳キーは存在せず（recently_viewed 系は title のみ, ja.yaml:1199 / en.yaml:979）、履歴無し表示の描画分岐も無く未実装。",
  "comparisonRows": [
    {
      "item": "履歴無しメッセージの表示",
      "design": "『最近見た商品はありません。/No Recently Seen Items』を表示",
      "implementation": "ProductClasses空時はブロック全体を非表示（else分岐なし）",
      "mismatch": "履歴無しメッセージ未描画"
    },
    {
      "item": "翻訳キー",
      "design": "history.no_content 相当（ja/en）",
      "implementation": "recently_viewed.title のみ存在、no_content 相当キー無し",
      "mismatch": "翻訳キー不在"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f03-06_0303_sheet-8_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Resource/template/default/Block/recently_viewed.twig:4,58 ; src/Eccube/Service/Block/RecentlyViewedBlockPayloadBuilder.php:50-68",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「履歴Cookie(history)が無い/空のとき、見出しに加えて履歴無しメッセージ『最近見た商品はありません。』（英語『No Recently Seen Items』, キー history.no_content 相当）を表示する。」。実装は「build が history Cookie 無し/空・有効IDなし時に ProductClasses=[] を返し（PayloadBuilder.php:50-53,63-68）、recently_viewed.twig はブロック全体を `{% if ProductClasses|length > 0 %}`（:4）で囲み else 分岐を持たない（:58 で if 閉じ）。履歴が無い場合は見出しも履歴無しメッセージも一切描画されない。」。乖離理由は「recently_viewed.twig / RecentlyViewedBlockPayloadBuilder.php / messages.ja.yaml / messages.en.yaml を確認。no_content 相当の翻訳キーは存在せず（recently_viewed 系は title のみ, ja.yaml:1199 / en.yaml:979）、履歴無し表示の描画分岐も無く未実装。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "業務ロジック・外部連携未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "Repository・Entity・DB",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:2837\n2834:       </section>\n2835:       <!-- function-design-embed:end f03-05-f03-05_front_product_block_recommend -->\n2836: </section>\n2837:       <section class=\"sheet-panel\" id=\"sheet-8\">\n2838:         <div class=\"sheet-heading\">\n2839:           <h2>最近チェックした商品</h2>\n2840:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Block/recently_viewed.twig:4,58",
    "src/Eccube/Service/Block/RecentlyViewedBlockPayloadBuilder.php:50-68",
    "src/Eccube/Resource/template/default/Block/recently_viewed.twig",
    "src/Eccube/Service/Block/RecentlyViewedBlockPayloadBuilder.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Block/recently_viewed.twig:4\n1: {% set Products = (recentlyViewedBlockPayload|default({})).Products|default([]) %}\n2: {% set layout = (recentlyViewedBlockPayload|default({})).layout|default('detail') %}\n3: \n4: {% if Products|length > 0 %}\n5: \n6: {% if layout == 'list' %}\n7: <div class=\"p-hareruya-product-list__history\">",
    "src/Eccube/Service/Block/RecentlyViewedBlockPayloadBuilder.php:50\n47:             throw new \\RuntimeException('Request is not available.');\n48:         }\n49: \n50:         $historyCookie = $mainRequest->cookies->get('history', '');\n51:         if ($historyCookie === '') {\n52:             return [\n53:                 'Products' => [],",
    "src/Eccube/Resource/template/default/Block/recently_viewed.twig:1\n1: {% set Products = (recentlyViewedBlockPayload|default({})).Products|default([]) %}\n2: {% set layout = (recentlyViewedBlockPayload|default({})).layout|default('detail') %}\n3: \n4: {% if Products|length > 0 %}"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

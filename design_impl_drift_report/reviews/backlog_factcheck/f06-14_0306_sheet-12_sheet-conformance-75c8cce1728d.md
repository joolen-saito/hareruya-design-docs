# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-14_0306_sheet-12_sheet.json#f06-14_0306_sheet-12_sheet-conformance-75c8cce1728d`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-14_0306_sheet-12_sheet.json`
- sourceFindingId: `f06-14_0306_sheet-12_sheet-conformance-75c8cce1728d`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-14_0306_sheet-12_sheet` / F06-14 マイイベント・デッキ登録
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: (10)ページネーション：表示しきれないページが存在する場合、先頭方向に「＜最初」、末尾方向に「最後＞」のリンクを表示する。
- implementationActual: 先頭側は pages.first、末尾側は pages.last の数字リンクを出し、範囲外は『…』(ellipsis)を表示する。『＜最初』『最後＞』の文言リンクは存在しない。
- mismatchReason: 設計は明示的に『＜最初』『最後＞』の文言リンクを求めるが、共有pager.twigは数字ページ番号＋『…』のスタイル。利用者可視の文言・見た目が設計と異なる。
- designRefDetail: excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-12 画面部品(10)
- implRef: src/Eccube/Resource/template/default/pager.twig:22-33（先頭側）, :48-60（末尾側）

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-14_0306_sheet-12_sheet-conformance-75c8cce1728d",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "low",
  "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-12",
  "designRefDetail": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-12 画面部品(10)",
  "designExpectation": "(10)ページネーション：表示しきれないページが存在する場合、先頭方向に「＜最初」、末尾方向に「最後＞」のリンクを表示する。",
  "designQuote": "(10)ページネーション：表示しきれないページが存在する場合、先頭方向に「＜最初」、末尾方向に「最後＞」のリンクを表示する。",
  "implRef": "src/Eccube/Resource/template/default/pager.twig:22-33（先頭側）, :48-60（末尾側）",
  "implementationActual": "先頭側は pages.first、末尾側は pages.last の数字リンクを出し、範囲外は『…』(ellipsis)を表示する。『＜最初』『最後＞』の文言リンクは存在しない。",
  "difference": "設計は明示的に『＜最初』『最後＞』の文言リンクを求めるが、共有pager.twigは数字ページ番号＋『…』のスタイル。利用者可視の文言・見た目が設計と異なる。",
  "mismatchReason": "設計は明示的に『＜最初』『最後＞』の文言リンクを求めるが、共有pager.twigは数字ページ番号＋『…』のスタイル。利用者可視の文言・見た目が設計と異なる。",
  "comparisonRows": [
    {
      "item": "先頭/末尾ジャンプリンク",
      "design": "「＜最初」「最後＞」の文言リンク",
      "implementation": "先頭/最終ページ番号リンク + 『…』",
      "mismatch": "文言・見た目が相違"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-14_0306_sheet-12_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Resource/template/default/pager.twig:22-33（先頭側）, :48-60（末尾側）",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「(10)ページネーション：表示しきれないページが存在する場合、先頭方向に「＜最初」、末尾方向に「最後＞」のリンクを表示する。」。実装は「先頭側は pages.first、末尾側は pages.last の数字リンクを出し、範囲外は『…』(ellipsis)を表示する。『＜最初』『最後＞』の文言リンクは存在しない。」。乖離理由は「設計は明示的に『＜最初』『最後＞』の文言リンクを求めるが、共有pager.twigは数字ページ番号＋『…』のスタイル。利用者可視の文言・見た目が設計と異なる。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:3940\n3937:       </section>\n3938:       <!-- function-design-embed:end f06-13-f06-13_front_member_mypage_online_identification -->\n3939: </section>\n3940:       <section class=\"sheet-panel\" id=\"sheet-12\">\n3941:         <div class=\"sheet-heading\">\n3942:           <h2>マイイベント・デッキ登録</h2>\n3943:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/pager.twig:22-33",
    "src/Eccube/Resource/template/default/pager.twig"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/pager.twig:22\n19:         {% endif %}\n20: \n21:         {# 1ページリンクが表示されない場合、「...」を表示 #}\n22:         {% if pages.firstPageInRange != 1 %}\n23:         <li class=\"p-hareruya-pagination__item\">\n24:             <a class=\"p-hareruya-pagination__link\" href=\"{{ path(app.request.attributes.get('_route'), app.request.query.all|merge({'pageno': pages.first})) }}\" data-page=\"{{ pages.first }}\" aria-label=\"{{ 'common.pager.page_aria'|trans({'%page%': pages.first}) }}\"><span class=\"p-hareruya-pagination__number\">{{ pages.first }}</span></a>\n25:         </li>",
    "src/Eccube/Resource/template/default/pager.twig:1\n1: {#\n2: This file is part of EC-CUBE\n3: \n4: Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved."
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-06_0304_sheet-8_sheet.json#f06-06_0304_sheet-8_sheet-conformance-6dada7e76bf5`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-06_0304_sheet-8_sheet.json`
- sourceFindingId: `f06-06_0304_sheet-8_sheet-conformance-6dada7e76bf5`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-06_0304_sheet-8_sheet` / F06-06 注文購入履歴一覧
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: 一覧下部にも上部と同様のツールバーとして件数表示(要素15)と表示件数プルダウン(要素17)を配置する(全区分◯)。
- implementationActual: 下部ブロック(p-hareruya-history-list__pagination-wrap--bottom)はpager.twigのinclude(ページャ=要素16)のみを描画し、件数ラベルとform.disp_numberプルダウンを出力していない。件数/プルダウンは上部(:60-80)のみ。
- mismatchReason: 設計は上部(2件数/3ページング/4表示件数)と下部(15件数/16ページング/17表示件数)を対で列挙するが、実装下部はページャのみ。件数・表示件数プルダウンが下部で未実装。
- designRefDetail: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-8 レイアウト要素15(件数, 位置H78)・要素17(表示件数プルダウン, 位置AI79)
- implRef: src/Eccube/Resource/template/default/Mypage/shopping_history.twig:212-216

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-06_0304_sheet-8_sheet-conformance-6dada7e76bf5",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-8",
  "designRefDetail": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-8 レイアウト要素15(件数, 位置H78)・要素17(表示件数プルダウン, 位置AI79)",
  "designExpectation": "一覧下部にも上部と同様のツールバーとして件数表示(要素15)と表示件数プルダウン(要素17)を配置する(全区分◯)。",
  "designQuote": "一覧下部にも上部と同様のツールバーとして件数表示(要素15)と表示件数プルダウン(要素17)を配置する(全区分◯)。",
  "implRef": "src/Eccube/Resource/template/default/Mypage/shopping_history.twig:212-216",
  "implementationActual": "下部ブロック(p-hareruya-history-list__pagination-wrap--bottom)はpager.twigのinclude(ページャ=要素16)のみを描画し、件数ラベルとform.disp_numberプルダウンを出力していない。件数/プルダウンは上部(:60-80)のみ。",
  "difference": "設計は上部(2件数/3ページング/4表示件数)と下部(15件数/16ページング/17表示件数)を対で列挙するが、実装下部はページャのみ。件数・表示件数プルダウンが下部で未実装。",
  "mismatchReason": "設計は上部(2件数/3ページング/4表示件数)と下部(15件数/16ページング/17表示件数)を対で列挙するが、実装下部はページャのみ。件数・表示件数プルダウンが下部で未実装。",
  "comparisonRows": [
    {
      "item": "下部の件数表示(要素15)",
      "design": "配置あり",
      "implementation": "無し",
      "mismatch": "下部で未実装"
    },
    {
      "item": "下部の表示件数プルダウン(要素17)",
      "design": "配置あり",
      "implementation": "無し",
      "mismatch": "下部で未実装"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-06_0304_sheet-8_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Resource/template/default/Mypage/shopping_history.twig:212-216",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「一覧下部にも上部と同様のツールバーとして件数表示(要素15)と表示件数プルダウン(要素17)を配置する(全区分◯)。」。実装は「下部ブロック(p-hareruya-history-list__pagination-wrap--bottom)はpager.twigのinclude(ページャ=要素16)のみを描画し、件数ラベルとform.disp_numberプルダウンを出力していない。件数/プルダウンは上部(:60-80)のみ。」。乖離理由は「設計は上部(2件数/3ページング/4表示件数)と下部(15件数/16ページング/17表示件数)を対で列挙するが、実装下部はページャのみ。件数・表示件数プルダウンが下部で未実装。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "Form・入力項目",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2604\n2601:       </section>\n2602:       <!-- function-design-embed:end f04-04-f04-04_front_cart_shopping_complete -->\n2603: </section>\n2604:       <section class=\"sheet-panel\" id=\"sheet-8\">\n2605:         <div class=\"sheet-heading\">\n2606:           <h2>注文購入履歴一覧</h2>\n2607:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Mypage/shopping_history.twig:212-216",
    "src/Eccube/Resource/template/default/Mypage/shopping_history.twig"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Mypage/shopping_history.twig:212\n",
    "src/Eccube/Resource/template/default/Mypage/shopping_history.twig:1\n1: {#\n2: This file is part of EC-CUBE\n3: \n4: Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved."
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-06_0304_sheet-8_sheet.json#f06-06_0304_sheet-8_sheet-conformance-e156ea548423`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-06_0304_sheet-8_sheet.json`
- sourceFindingId: `f06-06_0304_sheet-8_sheet-conformance-e156ea548423`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-06_0304_sheet-8_sheet` / F06-06 注文購入履歴一覧
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: スマレジ取引データの場合のみ、一覧の列見出し文言を『注文内容→購入内容』『注文金額合計→支払金額合計』に変更する。
- implementationActual: col.items(=注文内容)/col.total(=注文金額合計)を無条件出力。isSmaregiTransactionOrder時の『購入内容』『支払金額合計』への切替が無く、locale(messages.ja.yaml)にも該当キーが未定義。
- mismatchReason: 当該2行にスマレジ分岐が無く常に同一キーを描画。購入日/支払方法はスマレジ分岐を持つのにこの2列のみ欠落。翻訳キーも不在。
- designRefDetail: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-8 図形注釈 AV49『スマレジの場合のみ文言を ・注文内容→購入内容 ・注文金額合計→支払金額合計 とする』
- implRef: src/Eccube/Resource/template/default/Mypage/shopping_history.twig:156,170

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-06_0304_sheet-8_sheet-conformance-e156ea548423",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-8",
  "designRefDetail": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-8 図形注釈 AV49『スマレジの場合のみ文言を ・注文内容→購入内容 ・注文金額合計→支払金額合計 とする』",
  "designExpectation": "スマレジ取引データの場合のみ、一覧の列見出し文言を『注文内容→購入内容』『注文金額合計→支払金額合計』に変更する。",
  "designQuote": "スマレジ取引データの場合のみ、一覧の列見出し文言を『注文内容→購入内容』『注文金額合計→支払金額合計』に変更する。",
  "implRef": "src/Eccube/Resource/template/default/Mypage/shopping_history.twig:156,170",
  "implementationActual": "col.items(=注文内容)/col.total(=注文金額合計)を無条件出力。isSmaregiTransactionOrder時の『購入内容』『支払金額合計』への切替が無く、locale(messages.ja.yaml)にも該当キーが未定義。",
  "difference": "当該2行にスマレジ分岐が無く常に同一キーを描画。購入日/支払方法はスマレジ分岐を持つのにこの2列のみ欠落。翻訳キーも不在。",
  "mismatchReason": "当該2行にスマレジ分岐が無く常に同一キーを描画。購入日/支払方法はスマレジ分岐を持つのにこの2列のみ欠落。翻訳キーも不在。",
  "comparisonRows": [
    {
      "item": "スマレジ時の注文内容見出し",
      "design": "購入内容",
      "implementation": "注文内容(col.items固定)",
      "mismatch": "文言切替なし"
    },
    {
      "item": "スマレジ時の金額合計見出し",
      "design": "支払金額合計",
      "implementation": "注文金額合計(col.total固定)",
      "mismatch": "文言切替なし"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-06_0304_sheet-8_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Resource/template/default/Mypage/shopping_history.twig:156,170",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「スマレジ取引データの場合のみ、一覧の列見出し文言を『注文内容→購入内容』『注文金額合計→支払金額合計』に変更する。」。実装は「col.items(=注文内容)/col.total(=注文金額合計)を無条件出力。isSmaregiTransactionOrder時の『購入内容』『支払金額合計』への切替が無く、locale(messages.ja.yaml)にも該当キーが未定義。」。乖離理由は「当該2行にスマレジ分岐が無く常に同一キーを描画。購入日/支払方法はスマレジ分岐を持つのにこの2列のみ欠落。翻訳キーも不在。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "業務ロジック・外部連携未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2604\n2601:       </section>\n2602:       <!-- function-design-embed:end f04-04-f04-04_front_cart_shopping_complete -->\n2603: </section>\n2604:       <section class=\"sheet-panel\" id=\"sheet-8\">\n2605:         <div class=\"sheet-heading\">\n2606:           <h2>注文購入履歴一覧</h2>\n2607:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Mypage/shopping_history.twig:156,170",
    "src/Eccube/Resource/template/default/Mypage/shopping_history.twig"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Mypage/shopping_history.twig:156\n",
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

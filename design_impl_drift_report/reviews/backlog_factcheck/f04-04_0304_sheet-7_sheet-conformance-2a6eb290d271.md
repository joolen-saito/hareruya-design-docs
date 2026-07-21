# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f04-04_0304_sheet-7_sheet.json#f04-04_0304_sheet-7_sheet-conformance-2a6eb290d271`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f04-04_0304_sheet-7_sheet.json`
- sourceFindingId: `f04-04_0304_sheet-7_sheet-conformance-2a6eb290d271`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f04-04_0304_sheet-7_sheet` / F04-04 決済~購入完了
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: 購入完了画面の画面部品『識別ID3 ヘルプページ リンク（ヘルプ画面へ遷移する）』。
- implementationActual: complete.twig の本文・操作領域にヘルプページ（help_guide 等）へ遷移する独立リンク部品が存在しない。操作領域の唯一のリンクは url('homepage') の『商品一覧へ戻る』ボタンのみで、テンプレート内に help/ヘルプ参照ゼロ、汎用ブロックでも代替なし。
- mismatchReason: テンプレート全体を確認したが、設計が独立部品(識別ID3)として要求する『ヘルプページ』リンク（ヘルプ画面遷移）が描画されておらず代替も無いため未実装。
- designRefDetail: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-7（項目表 識別ID3・ヘルプ画面へ遷移する）
- implRef: src/Eccube/Resource/template/default/Shopping/complete.twig 全体（本文 :99-118／actions :113-118）（不在）

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f04-04_0304_sheet-7_sheet-conformance-2a6eb290d271",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-7",
  "designRefDetail": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-7（項目表 識別ID3・ヘルプ画面へ遷移する）",
  "designExpectation": "購入完了画面の画面部品『識別ID3 ヘルプページ リンク（ヘルプ画面へ遷移する）』。",
  "designQuote": "購入完了画面の画面部品『識別ID3 ヘルプページ リンク（ヘルプ画面へ遷移する）』。",
  "implRef": "src/Eccube/Resource/template/default/Shopping/complete.twig 全体（本文 :99-118／actions :113-118）（不在）",
  "implementationActual": "complete.twig の本文・操作領域にヘルプページ（help_guide 等）へ遷移する独立リンク部品が存在しない。操作領域の唯一のリンクは url('homepage') の『商品一覧へ戻る』ボタンのみで、テンプレート内に help/ヘルプ参照ゼロ、汎用ブロックでも代替なし。",
  "difference": "テンプレート全体を確認したが、設計が独立部品(識別ID3)として要求する『ヘルプページ』リンク（ヘルプ画面遷移）が描画されておらず代替も無いため未実装。",
  "mismatchReason": "テンプレート全体を確認したが、設計が独立部品(識別ID3)として要求する『ヘルプページ』リンク（ヘルプ画面遷移）が描画されておらず代替も無いため未実装。",
  "comparisonRows": [
    {
      "item": "識別ID3 ヘルプページリンク",
      "design": "ヘルプ画面へ遷移するリンク部品を配置",
      "implementation": "リンク部品なし（help参照ゼロ）",
      "mismatch": "ヘルプページリンク未実装"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f04-04_0304_sheet-7_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Resource/template/default/Shopping/complete.twig 全体（本文 :99-118／actions :113-118）（不在）",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「購入完了画面の画面部品『識別ID3 ヘルプページ リンク（ヘルプ画面へ遷移する）』。」。実装は「complete.twig の本文・操作領域にヘルプページ（help_guide 等）へ遷移する独立リンク部品が存在しない。操作領域の唯一のリンクは url('homepage') の『商品一覧へ戻る』ボタンのみで、テンプレート内に help/ヘルプ参照ゼロ、汎用ブロックでも代替なし。」。乖離理由は「テンプレート全体を確認したが、設計が独立部品(識別ID3)として要求する『ヘルプページ』リンク（ヘルプ画面遷移）が描画されておらず代替も無いため未実装。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2353\n2350:       </section>\n2351:       <!-- function-design-embed:end f04-03-f04-03_front_cart_shopping_delivery_edit -->\n2352: </section>\n2353:       <section class=\"sheet-panel\" id=\"sheet-7\">\n2354:         <div class=\"sheet-heading\">\n2355:           <h2>決済~購入完了</h2>\n2356:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Shopping/complete.twig"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Shopping/complete.twig:1\n1: {#\n2: This file is part of EC-CUBE\n3: \n4: Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved."
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

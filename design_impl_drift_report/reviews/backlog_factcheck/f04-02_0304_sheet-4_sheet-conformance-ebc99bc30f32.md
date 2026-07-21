# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f04-02_0304_sheet-4_sheet.json#f04-02_0304_sheet-4_sheet-conformance-ebc99bc30f32`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f04-02_0304_sheet-4_sheet.json`
- sourceFindingId: `f04-02_0304_sheet-4_sheet-conformance-ebc99bc30f32`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f04-02_0304_sheet-4_sheet` / F04-02 ご注文方法指定
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: クレジットカード決済を選択した場合のみ「本人認証サービスリンク」を表示する。
- implementationActual: お支払い方法セクション(index.twig:416-555)にクレカ決済選択時の本人認証サービスリンクが存在しない。src/Eccube・html/template/default に本人認証/3Dセキュア相当の実装なし。
- mismatchReason: grep(本人認証/3dsecure/認証サービス)は messages.en.yaml のプライバシーポリシー文言のみで、Shopping テンプレート・front JS・locale・src/Eccube のクレカ決済処理に該当リンクなし。
- designRefDetail: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-4 (No.6-3 本人認証サービスリンク「クレジットカード決済を選択した場合のみ表示」)
- implRef: 不在

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f04-02_0304_sheet-4_sheet-conformance-ebc99bc30f32",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-4",
  "designRefDetail": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-4 (No.6-3 本人認証サービスリンク「クレジットカード決済を選択した場合のみ表示」)",
  "designExpectation": "クレジットカード決済を選択した場合のみ「本人認証サービスリンク」を表示する。",
  "designQuote": "クレジットカード決済を選択した場合のみ「本人認証サービスリンク」を表示する。",
  "implRef": "不在",
  "implementationActual": "お支払い方法セクション(index.twig:416-555)にクレカ決済選択時の本人認証サービスリンクが存在しない。src/Eccube・html/template/default に本人認証/3Dセキュア相当の実装なし。",
  "difference": "grep(本人認証/3dsecure/認証サービス)は messages.en.yaml のプライバシーポリシー文言のみで、Shopping テンプレート・front JS・locale・src/Eccube のクレカ決済処理に該当リンクなし。",
  "mismatchReason": "grep(本人認証/3dsecure/認証サービス)は messages.en.yaml のプライバシーポリシー文言のみで、Shopping テンプレート・front JS・locale・src/Eccube のクレカ決済処理に該当リンクなし。",
  "comparisonRows": [
    {
      "item": "本人認証サービスリンク",
      "design": "クレカ決済選択時のみ表示",
      "implementation": "リンク要素が不在",
      "mismatch": "未実装"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f04-02_0304_sheet-4_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "不在",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「クレジットカード決済を選択した場合のみ「本人認証サービスリンク」を表示する。」。実装は「お支払い方法セクション(index.twig:416-555)にクレカ決済選択時の本人認証サービスリンクが存在しない。src/Eccube・html/template/default に本人認証/3Dセキュア相当の実装なし。」。乖離理由は「grep(本人認証/3dsecure/認証サービス)は messages.en.yaml のプライバシーポリシー文言のみで、Shopping テンプレート・front JS・locale・src/Eccube のクレカ決済処理に該当リンクなし。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1180\n1177:       </section>\n1178:       <!-- function-design-embed:end f04-01-f04-01_front_cart_cart_index -->\n1179: </section>\n1180:       <section class=\"sheet-panel\" id=\"sheet-4\">\n1181:         <div class=\"sheet-heading\">\n1182:           <h2>ご注文方法指定</h2>\n1183:         </div>",
  "implementationRefs": [],
  "implementationSnippets": [],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

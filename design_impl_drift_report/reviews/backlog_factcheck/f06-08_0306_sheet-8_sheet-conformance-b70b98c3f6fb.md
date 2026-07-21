# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-08_0306_sheet-8_sheet.json#f06-08_0306_sheet-8_sheet-conformance-b70b98c3f6fb`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-08_0306_sheet-8_sheet.json`
- sourceFindingId: `f06-08_0306_sheet-8_sheet-conformance-b70b98c3f6fb`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-08_0306_sheet-8_sheet` / F06-08 入荷待ち商品一覧
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: 表示要素として『入荷通知登録の上限が拡張された旨の案内』を表示する。当該案内は一覧がある場合・無い場合のいずれでも表示する。
- implementationActual: notifylist.twigは一覧あり時にfront.mypage.notifylist.body（入荷時メール通知の旨）のみ、空時にfront.mypage.notifylist.emptyのみを表示。『登録上限が拡張された旨』の案内文言がテンプレート・翻訳(messages.ja.yaml)・コントローラのいずれにも存在しない。
- mismatchReason: 探索(notifylist.twig:24-33, messages.ja.yaml:944-964のfront.mypage.notifylist.*・front.product_request.*全キー, locale内『拡張』全出現)で該当文言・要素なし。over_request_count.messageは上限到達エラーで別物。CONFIRMED。
- designRefDetail: excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-8 (フロント挙動・表示要素／業務ルール・登録上限)
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
  "id": "f06-08_0306_sheet-8_sheet-conformance-b70b98c3f6fb",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-8",
  "designRefDetail": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-8 (フロント挙動・表示要素／業務ルール・登録上限)",
  "designExpectation": "表示要素として『入荷通知登録の上限が拡張された旨の案内』を表示する。当該案内は一覧がある場合・無い場合のいずれでも表示する。",
  "designQuote": "表示要素として『入荷通知登録の上限が拡張された旨の案内』を表示する。当該案内は一覧がある場合・無い場合のいずれでも表示する。",
  "implRef": "不在",
  "implementationActual": "notifylist.twigは一覧あり時にfront.mypage.notifylist.body（入荷時メール通知の旨）のみ、空時にfront.mypage.notifylist.emptyのみを表示。『登録上限が拡張された旨』の案内文言がテンプレート・翻訳(messages.ja.yaml)・コントローラのいずれにも存在しない。",
  "difference": "探索(notifylist.twig:24-33, messages.ja.yaml:944-964のfront.mypage.notifylist.*・front.product_request.*全キー, locale内『拡張』全出現)で該当文言・要素なし。over_request_count.messageは上限到達エラーで別物。CONFIRMED。",
  "mismatchReason": "探索(notifylist.twig:24-33, messages.ja.yaml:944-964のfront.mypage.notifylist.*・front.product_request.*全キー, locale内『拡張』全出現)で該当文言・要素なし。over_request_count.messageは上限到達エラーで別物。CONFIRMED。",
  "comparisonRows": [
    {
      "item": "上限拡張の案内",
      "design": "一覧有無いずれでも常時表示",
      "implementation": "文言・要素とも不在",
      "mismatch": "未実装"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-08_0306_sheet-8_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "不在",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「表示要素として『入荷通知登録の上限が拡張された旨の案内』を表示する。当該案内は一覧がある場合・無い場合のいずれでも表示する。」。実装は「notifylist.twigは一覧あり時にfront.mypage.notifylist.body（入荷時メール通知の旨）のみ、空時にfront.mypage.notifylist.emptyのみを表示。『登録上限が拡張された旨』の案内文言がテンプレート・翻訳(messages.ja.yaml)・コントローラのいずれにも存在しない。」。乖離理由は「探索(notifylist.twig:24-33, messages.ja.yaml:944-964のfront.mypage.notifylist.*・front.product_request.*全キー, locale内『拡張』全出現)で該当文言・要素なし。over_request_count.messageは上限到達エラーで別物。CONFIRMED。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "Repository・Entity・DB",
    "Twig・画面表示",
    "権限・セッション・副作用・エラー・ログ"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:2838\n2835:       </section>\n2836:       <!-- function-design-embed:end f06-05-f06-05_front_member_mypage_index -->\n2837: </section>\n2838:       <section class=\"sheet-panel\" id=\"sheet-8\">\n2839:         <div class=\"sheet-heading\">\n2840:           <h2>入荷待ち商品一覧</h2>\n2841:         </div>",
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

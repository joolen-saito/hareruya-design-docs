# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-23_0306_sheet-19_sheet.json#f06-23_0306_sheet-19_sheet-conformance-36b6634f820e`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-23_0306_sheet-19_sheet.json`
- sourceFindingId: `f06-23_0306_sheet-19_sheet-conformance-36b6634f820e`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-23_0306_sheet-19_sheet` / F06-23 お問い合わせ履歴
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: 詳細の『戻る』はブラウザ履歴を1つ戻すリンクのみ（history.go(-1)）。サーバへのリクエストは発生しない。
- implementationActual: 『戻る』は href="{{ url('contact_history') }}"(48-49行、ラベル common.back)の通常リンク。押下で一覧(contact_history)へGETが発生。history.go(-1)を呼ぶJS/onclickは history_detail.twig にも html 配下にも存在しない。
- mismatchReason: 設計は『戻る』を history.go(-1) によるブラウザ履歴戻り・サーバリクエストなしと明記。実装は一覧URLへの固定リンクでGETが発生し遷移機構が設計と異なる。
- designRefDetail: excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-19（利用者視点の入口/JS挙動/画面遷移）
- implRef: src/Eccube/Resource/template/default/Contact/history_detail.twig:47-51

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-23_0306_sheet-19_sheet-conformance-36b6634f820e",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-19",
  "designRefDetail": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-19（利用者視点の入口/JS挙動/画面遷移）",
  "designExpectation": "詳細の『戻る』はブラウザ履歴を1つ戻すリンクのみ（history.go(-1)）。サーバへのリクエストは発生しない。",
  "designQuote": "詳細の『戻る』はブラウザ履歴を1つ戻すリンクのみ（history.go(-1)）。サーバへのリクエストは発生しない。",
  "implRef": "src/Eccube/Resource/template/default/Contact/history_detail.twig:47-51",
  "implementationActual": "『戻る』は href=\"{{ url('contact_history') }}\"(48-49行、ラベル common.back)の通常リンク。押下で一覧(contact_history)へGETが発生。history.go(-1)を呼ぶJS/onclickは history_detail.twig にも html 配下にも存在しない。",
  "difference": "設計は『戻る』を history.go(-1) によるブラウザ履歴戻り・サーバリクエストなしと明記。実装は一覧URLへの固定リンクでGETが発生し遷移機構が設計と異なる。",
  "mismatchReason": "設計は『戻る』を history.go(-1) によるブラウザ履歴戻り・サーバリクエストなしと明記。実装は一覧URLへの固定リンクでGETが発生し遷移機構が設計と異なる。",
  "comparisonRows": [
    {
      "item": "詳細『戻る』の遷移機構",
      "design": "history.go(-1)（サーバリクエストなし）",
      "implementation": "url('contact_history') への通常リンク（GET発生）",
      "mismatch": "ブラウザ履歴戻りではなく固定URLへのGET遷移"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-23_0306_sheet-19_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Resource/template/default/Contact/history_detail.twig:47-51",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「詳細の『戻る』はブラウザ履歴を1つ戻すリンクのみ（history.go(-1)）。サーバへのリクエストは発生しない。」。実装は「『戻る』は href=\"{{ url('contact_history') }}\"(48-49行、ラベル common.back)の通常リンク。押下で一覧(contact_history)へGETが発生。history.go(-1)を呼ぶJS/onclickは history_detail.twig にも html 配下にも存在しない。」。乖離理由は「設計は『戻る』を history.go(-1) によるブラウザ履歴戻り・サーバリクエストなしと明記。実装は一覧URLへの固定リンクでGETが発生し遷移機構が設計と異なる。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "Twig・画面表示",
    "CSV・API・Batch・PDF・印刷"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:6605\n6602:       </section>\n6603:       <!-- function-design-embed:end f06-22-f06-22_front_member_mypage_contact -->\n6604: </section>\n6605:       <section class=\"sheet-panel\" id=\"sheet-19\">\n6606:         <div class=\"sheet-heading\">\n6607:           <h2>お問い合わせ履歴</h2>\n6608:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Contact/history_detail.twig:47-51",
    "src/Eccube/Resource/template/default/Contact/history_detail.twig"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Contact/history_detail.twig:47\n44:                     </div>\n45:                 </div>\n46:             </div>\n47:             <div class=\"p-hareruya-history-detail__btn\">\n48:                 <a class=\"c-hareruya-btn c-hareruya-btn--lg u-hareruya-w-full\" href=\"{{ url('contact_history') }}\">\n49:                     <span class=\"c-hareruya-btn__text\">{{ 'common.back'|trans }}</span>\n50:                 </a>",
    "src/Eccube/Resource/template/default/Contact/history_detail.twig:1\n1: {% extends 'default_frame.twig' %}\n2: \n3: {% set body_class = 'mypage' %}\n4: "
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

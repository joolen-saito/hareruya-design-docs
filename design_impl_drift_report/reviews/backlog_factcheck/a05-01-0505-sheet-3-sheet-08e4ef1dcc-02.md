# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/a05-01_0505_sheet-3_sheet.json#a05-01-0505-sheet-3-sheet-08e4ef1dcc-02`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/a05-01_0505_sheet-3_sheet.json`
- sourceFindingId: `a05-01-0505-sheet-3-sheet-08e4ef1dcc-02`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `a05-01_0505_sheet-3_sheet` / A05-01 注文印刷_印刷情報をプリンタへ送信
- issueCategory: 実装漏れ
- dimension: ②業務ルール・計算

## Finding Fields
- designExpectation: 配送がスムーズ店頭受取の場合は合計金額欄を「スムーズ店頭受取」とする。 / 旧根拠: function_spec_html_preview/pf-api/a05-01_api_order_print_direct.html:247
- implementationActual: 設計はスムーズ店頭受取の受注で合計金額欄を文言「スムーズ店頭受取」に置換すると規定。実装 getPrintData(行129)は配送方法を判定せず常に $paymentTotal(payment_total の生値)を出力。加えて取得元リポジトリ(getPrintOrderListMainShop:1517 / getDirectPrintOrderList:1575,1597)も payment_total を生値SELECTするのみで配送方法を印刷側に渡さず、置換ロジッ…
- mismatchReason: 設計はスムーズ店頭受取の受注で合計金額欄を文言「スムーズ店頭受取」に置換すると規定。実装 getPrintData(行129)は配送方法を判定せず常に $paymentTotal(payment_total の生値)を出力。加えて取得元リポジトリ(getPrintOrderListMainShop:1517 / getDirectPrintOrderList:1575,1597)も payment_total を生値SELECTするのみで配送方法を印刷側に渡さず、置換ロジッ…
- designRefDetail: excel_to_html/output/0505_基本設計仕様書(API_受注管理).html#sheet-3
- implRef: src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:129

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "dimension": "②業務ルール・計算",
  "severity": "high",
  "designRef": "excel_to_html/output/0505_基本設計仕様書(API_受注管理).html#sheet-3",
  "designQuote": "配送がスムーズ店頭受取の場合は合計金額欄を「スムーズ店頭受取」とする。 / 旧根拠: function_spec_html_preview/pf-api/a05-01_api_order_print_direct.html:247",
  "implRef": "src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:129",
  "difference": "設計はスムーズ店頭受取の受注で合計金額欄を文言「スムーズ店頭受取」に置換すると規定。実装 getPrintData(行129)は配送方法を判定せず常に $paymentTotal(payment_total の生値)を出力。加えて取得元リポジトリ(getPrintOrderListMainShop:1517 / getDirectPrintOrderList:1575,1597)も payment_total を生値SELECTするのみで配送方法を印刷側に渡さず、置換ロジック自体が存在しない。印字結果が設計と異なる。",
  "confidence": "CONFIRMED",
  "verdict": "CONFIRMED",
  "evidence": "OrderDirectPrintAction.php:74,129 で $paymentTotal=$Order['payment_total'] を無条件出力。OrderRepository.php:1517/1575/1597 で payment_total を生値SELECT、配送方法(delivery)は印刷データに渡らない。 / 旧レポート所見 a05-01_api_order_print_direct をExcelシート母数 a05-01_0505_sheet-3_sheet へ移行。",
  "id": "a05-01-0505-sheet-3-sheet-08e4ef1dcc-02",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "designExpectation": "配送がスムーズ店頭受取の場合は合計金額欄を「スムーズ店頭受取」とする。 / 旧根拠: function_spec_html_preview/pf-api/a05-01_api_order_print_direct.html:247",
  "implementationActual": "設計はスムーズ店頭受取の受注で合計金額欄を文言「スムーズ店頭受取」に置換すると規定。実装 getPrintData(行129)は配送方法を判定せず常に $paymentTotal(payment_total の生値)を出力。加えて取得元リポジトリ(getPrintOrderListMainShop:1517 / getDirectPrintOrderList:1575,1597)も payment_total を生値SELECTするのみで配送方法を印刷側に渡さず、置換ロジック自体が存在しない。印字結果が設計と異なる。",
  "fixTarget": "src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:129",
  "implementationRefs": [
    "src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:129"
  ],
  "implementationSnippets": [
    "src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:129\n126:                   <text>合計金額</text>\n127:                   <rectangle x1=\"210\" y1=\"550\" x2=\"511\" y2=\"600\" style=\"thin\"/>\n128:                   <position x=\"235\" y=\"584\"/>\n129:                   <text>{$paymentTotal}</text>\n130:                   <rectangle x1=\"0\" y1=\"600\" x2=\"210\" y2=\"650\" style=\"thin\"/>\n131:                   <position x=\"25\" y=\"634\"/>\n132:                   <text>変更後金額</text>"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ],
  "comparisonRows": [
    {
      "item": "②業務ルール・計算",
      "design": "配送がスムーズ店頭受取の場合は合計金額欄を「スムーズ店頭受取」とする。",
      "implementation": "設計はスムーズ店頭受取の受注で合計金額欄を文言「スムーズ店頭受取」に置換すると規定。実装 getPrintData(行129)は配送方法を判定せず常に $paymentTotal(payment_total の生値)を出力。加えて取得元リポジトリ(getPrintOrderListMainShop:1517 / getDirectPrintOrderList:1575,1597)も payment_total を生値SELECTするのみで配送方法を印刷側に渡さず、置換ロジック自体が存在しない。印字結果が設計と異な…",
      "mismatch": "設計はスムーズ店頭受取の受注で合計金額欄を文言「スムーズ店頭受取」に置換すると規定。実装 getPrintData(行129)は配送方法を判定せず常に $paymentTotal(payment_total の生値)を出力。加えて取得元リポジトリ(getPrintOrderListMainShop:1517 / getDirectPrintOrderList:1575,1597)も payment_total を生値SELECTするのみで配送方法を印刷側に渡さず、置換ロジック自体が存在しない。印字結果が設計と異なる。"
    }
  ],
  "comparisonSummary": "②業務ルール・計算：設計は「配送がスムーズ店頭受取の場合は合計金額欄を「スムーズ店頭受取」とする。」。実装は「設計はスムーズ店頭受取の受注で合計金額欄を文言「スムーズ店頭受取」に置換すると規定。実装 getPrintData(行129)は配送方法を判定せず常に $paymentTotal(payment_total の生値)を出力。加えて取得元リポジトリ(getPrintOrderListMainShop:1517 / getDirectPrintOrderList:1575,1597)も payment_total を生値SELECTするのみで配送方法を印刷側に渡さず、置換ロジック自体が存在しない。印字結果が設計と異な…」。乖離理由は「設計はスムーズ店頭受取の受注で合計金額欄を文言「スムーズ店頭受取」に置換すると規定。実装 getPrintData(行129)は配送方法を判定せず常に $paymentTotal(payment_total の生値)を出力。加えて取得元リポジトリ(getPrintOrderListMainShop:1517 / getDirectPrintOrderList:1575,1597)も payment_total を生値SELECTするのみで配送方法を印刷側に渡さず、置換ロジック自体が存在しない。印字結果が設計と異な…」。",
  "mismatchReason": "設計はスムーズ店頭受取の受注で合計金額欄を文言「スムーズ店頭受取」に置換すると規定。実装 getPrintData(行129)は配送方法を判定せず常に $paymentTotal(payment_total の生値)を出力。加えて取得元リポジトリ(getPrintOrderListMainShop:1517 / getDirectPrintOrderList:1575,1597)も payment_total を生値SELECTするのみで配送方法を印刷側に渡さず、置換ロジック自体が存在しない。印字結果が設計と異な…",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:833\n830:           </div>\n831:         </div>\n832:       </section>\n833:       <section class=\"sheet-panel\" id=\"sheet-3\">\n834:         <div class=\"sheet-heading\">\n835:           <h2>注文印刷_印刷情報をプリンタへ送信</h2>\n836:         </div>",
  "implementationGap": true,
  "implementationGapType": "業務ロジック・外部連携未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "Service・業務ルール",
    "CSV・API・Batch・PDF・印刷"
  ]
}
```

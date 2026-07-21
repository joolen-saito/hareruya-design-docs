# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/b02-05_0404_sheet-7_sheet.json#b02-05_0404_sheet-7_sheet-conformance-45599d05b629`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/b02-05_0404_sheet-7_sheet.json`
- sourceFindingId: `b02-05_0404_sheet-7_sheet-conformance-45599d05b629`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `b02-05_0404_sheet-7_sheet` / B02-05 お気に入り商品セール通知
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: 一定件数ごとに処理メモリを解放しながら集約する。
- implementationActual: findSaleFavoriteProducts() の全結果を $rows に取得し、groupByCustomer() で全件を $grouped 配列へ集約してから送信している。一定件数ごとの clear/detach/flush/バッチ分割などの処理はない。 設計要求に対応する実装が見当たらない（未実装）。
- mismatchReason: BatchFavoriteSaleNotificationAction と関連 Repository を clear, detach, batch, limit, offset, chunk, memory, 一定件数 で確認したが、本処理に一定件数ごとのメモリ解放は見つからない。
- designRefDetail: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-7:1416
- implRef: src/Eccube/Service/Product/BatchFavoriteSaleNotificationAction.php:38

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "b02-05_0404_sheet-7_sheet-conformance-45599d05b629",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-7:1416",
  "designRefDetail": null,
  "designExpectation": "一定件数ごとに処理メモリを解放しながら集約する。",
  "designQuote": "一定件数ごとに処理メモリを解放しながら集約する。",
  "implRef": "src/Eccube/Service/Product/BatchFavoriteSaleNotificationAction.php:38",
  "implementationActual": "findSaleFavoriteProducts() の全結果を $rows に取得し、groupByCustomer() で全件を $grouped 配列へ集約してから送信している。一定件数ごとの clear/detach/flush/バッチ分割などの処理はない。 設計要求に対応する実装が見当たらない（未実装）。",
  "difference": "BatchFavoriteSaleNotificationAction と関連 Repository を clear, detach, batch, limit, offset, chunk, memory, 一定件数 で確認したが、本処理に一定件数ごとのメモリ解放は見つからない。",
  "mismatchReason": "BatchFavoriteSaleNotificationAction と関連 Repository を clear, detach, batch, limit, offset, chunk, memory, 一定件数 で確認したが、本処理に一定件数ごとのメモリ解放は見つからない。",
  "comparisonRows": [
    {
      "item": "大量件数対応",
      "design": "一定件数ごとに処理メモリを解放しながら集約する",
      "implementation": "全件取得し全件配列に集約する",
      "mismatch": "メモリ解放・分割処理が実装されていない。"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "b02-05_0404_sheet-7_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Service/Product/BatchFavoriteSaleNotificationAction.php:38",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「一定件数ごとに処理メモリを解放しながら集約する。」。実装は「findSaleFavoriteProducts() の全結果を $rows に取得し、groupByCustomer() で全件を $grouped 配列へ集約してから送信している。一定件数ごとの clear/detach/flush/バッチ分割などの処理はない。 設計要求に対応する実装が見当たらない（未実装）。」。乖離理由は「BatchFavoriteSaleNotificationAction と関連 Repository を clear, detach, batch, limit, offset, chunk, memory, 一定件数 で確認したが、本処理に一定件数ごとのメモリ解放は見つからない。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "Repository・Entity・DB",
    "Twig・画面表示",
    "CSV・API・Batch・PDF・印刷"
  ],
  "designSnippet": "",
  "implementationRefs": [
    "src/Eccube/Service/Product/BatchFavoriteSaleNotificationAction.php:38",
    "src/Eccube/Service/Product/BatchFavoriteSaleNotificationAction.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Service/Product/BatchFavoriteSaleNotificationAction.php:38\n35:      */\n36:     public function handle(): int\n37:     {\n38:         $rows = $this->customerFavoriteProductRepository->findSaleFavoriteProducts();\n39: \n40:         if (empty($rows)) {\n41:             return 0;",
    "src/Eccube/Service/Product/BatchFavoriteSaleNotificationAction.php:22\n19: use Eccube\\Repository\\CustomerRepository;\n20: use Eccube\\Service\\MailService;\n21: \n22: class BatchFavoriteSaleNotificationAction\n23: {\n24:     public function __construct(\n25:         private readonly CustomerFavoriteProductRepository $customerFavoriteProductRepository,"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/b02-04_0404_sheet-6_sheet.json#b02-04_0404_sheet-6_sheet-conformance-77b701dbb664`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/b02-04_0404_sheet-6_sheet.json`
- sourceFindingId: `b02-04_0404_sheet-6_sheet-conformance-77b701dbb664`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `b02-04_0404_sheet-6_sheet` / B02-04 商品部門未設定チェック
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: コンソールのバッチコマンド product:batch checkNoSectionProduct で部門未設定チェックを実行し、公開中かつ部門未設定の商品を抽出して該当があれば管理者へアラートメールを送信する。
- implementationActual: 実装済みの近似コマンドは eccube:otc-buy-order:aggregate-summary で、商品管理バッチ product:batch checkNoSectionProduct は存在しない。
- mismatchReason: 設計は商品管理バッチのコマンド名 product:batch checkNoSectionProduct を外部契約としているが、Command 定義一覧に当該コマンドはなく、部門未設定通知は店頭買取集計バッチ eccube:otc-buy-order:aggregate-summary の副処理として実装されている。
- designRefDetail: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-6:1289
- implRef: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcBuyOrderAggregateSummaryCommand.php:45 / 不在（探索範囲: src/Eccube/Command, src/Eccube/Service/Product, src/Eccube/Repository/ProductClassRepository.php, src/Eccube/Repository/P…

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "b02-04_0404_sheet-6_sheet-conformance-77b701dbb664",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-6:1289",
  "designRefDetail": null,
  "designExpectation": "コンソールのバッチコマンド product:batch checkNoSectionProduct で部門未設定チェックを実行し、公開中かつ部門未設定の商品を抽出して該当があれば管理者へアラートメールを送信する。",
  "designQuote": "コンソールのバッチコマンド product:batch checkNoSectionProduct で部門未設定チェックを実行し、公開中かつ部門未設定の商品を抽出して該当があれば管理者へアラートメールを送信する。",
  "implRef": "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcBuyOrderAggregateSummaryCommand.php:45 / 不在（探索範囲: src/Eccube/Command, src/Eccube/Service/Product, src/Eccube/Repository/ProductClassRepository.php, src/Eccube/Repository/ProductRepository.php, html; 検索語: product:batch, checkNoSectionProduct, NoSection, 部門未設定, section_id）",
  "implementationActual": "実装済みの近似コマンドは eccube:otc-buy-order:aggregate-summary で、商品管理バッチ product:batch checkNoSectionProduct は存在しない。",
  "difference": "設計は商品管理バッチのコマンド名 product:batch checkNoSectionProduct を外部契約としているが、Command 定義一覧に当該コマンドはなく、部門未設定通知は店頭買取集計バッチ eccube:otc-buy-order:aggregate-summary の副処理として実装されている。",
  "mismatchReason": "設計は商品管理バッチのコマンド名 product:batch checkNoSectionProduct を外部契約としているが、Command 定義一覧に当該コマンドはなく、部門未設定通知は店頭買取集計バッチ eccube:otc-buy-order:aggregate-summary の副処理として実装されている。",
  "comparisonRows": [
    {
      "item": "コマンド名",
      "design": "product:batch checkNoSectionProduct",
      "implementation": "eccube:otc-buy-order:aggregate-summary",
      "mismatch": "設計された起動入口が存在しない"
    },
    {
      "item": "機能領域",
      "design": "商品管理バッチ B02-04",
      "implementation": "店頭買取集計バッチ",
      "mismatch": "別バッチの副処理になっている"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "b02-04_0404_sheet-6_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcBuyOrderAggregateSummaryCommand.php:45 / 不在（探索範囲: src/Eccube/Command, src/Eccube/Service/Product, src/Eccube/Repository/ProductClassRepository.php, src/Eccube/Repository/ProductRepository.php, html; 検索語: product:batch, checkNoSectionProduct, NoSection, 部門未設定, section_id）",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「コンソールのバッチコマンド product:batch checkNoSectionProduct で部門未設定チェックを実行し、公開中かつ部門未設定の商品を抽出して該当があれば管理者へアラートメールを送信する。」。実装は「実装済みの近似コマンドは eccube:otc-buy-order:aggregate-summary で、商品管理バッチ product:batch checkNoSectionProduct は存在しない。」。乖離理由は「設計は商品管理バッチのコマンド名 product:batch checkNoSectionProduct を外部契約としているが、Command 定義一覧に当該コマンドはなく、部門未設定通知は店頭買取集計バッチ eccube:otc-buy-order:aggregate-summary の副処理として実装されている。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "Twig・画面表示",
    "CSV・API・Batch・PDF・印刷"
  ],
  "designSnippet": "",
  "implementationRefs": [
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcBuyOrderAggregateSummaryCommand.php:45",
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcBuyOrderAggregateSummaryCommand.php",
    "src/Eccube/Repository/ProductClassRepository.php",
    "src/Eccube/Repository/ProductRepository.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Command/OtcBuyOrderAggregateSummaryCommand.php:45\n42:  *   - 集計処理でエラーが発生した場合: 集計エラー通知メールを送信\n43:  *   送信先: MtbOption の otc_summary_mail_address（カンマ区切りで複数指定可）\n44:  */\n45: #[AsCommand(name: 'eccube:otc-buy-order:aggregate-summary', description: '店頭買取集計バッチ')]\n46: class OtcBuyOrderAggregateSummaryCommand extends Command\n47: {\n48:     public function __construct(private readonly BatchAggregateSummaryAction $batchAggregateSummaryAction)",
    "src/Eccube/Command/OtcBuyOrderAggregateSummaryCommand.php:46\n43:  *   送信先: MtbOption の otc_summary_mail_address（カンマ区切りで複数指定可）\n44:  */\n45: #[AsCommand(name: 'eccube:otc-buy-order:aggregate-summary', description: '店頭買取集計バッチ')]\n46: class OtcBuyOrderAggregateSummaryCommand extends Command\n47: {\n48:     public function __construct(private readonly BatchAggregateSummaryAction $batchAggregateSummaryAction)\n49:     {",
    "src/Eccube/Repository/ProductClassRepository.php:53\n50:  *\n51:  * @extends AbstractRepository<ProductClass>\n52:  */\n53: class ProductClassRepository extends AbstractRepository\n54: {\n55:     public const RESULT_CACHING_TIME = 30;\n56:     public const IMAGE_CACHING_TIME = 3600;"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

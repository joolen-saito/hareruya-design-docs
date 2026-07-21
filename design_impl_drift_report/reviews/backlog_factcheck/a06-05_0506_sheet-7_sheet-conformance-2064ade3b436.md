# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/a06-05_0506_sheet-7_sheet.json#a06-05_0506_sheet-7_sheet-conformance-2064ade3b436`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/a06-05_0506_sheet-7_sheet.json`
- sourceFindingId: `a06-05_0506_sheet-7_sheet-conformance-2064ade3b436`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `a06-05_0506_sheet-7_sheet` / A06-05 店頭買取情報ステータス更新
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: 利用者視点の入口として、PUT /admin/otcBuyOrder/{id}/status の拡張子なし別名も /status.json と同一処理で提供する。
- implementationActual: 店頭買取ステータス更新の Route は /%eccube_api_v1_route%/admin/otcBuyOrder/{id}/status.json のみ定義され、拡張子なし /status の同一処理ルートは確認できない。
- mismatchReason: 設計は拡張子なし別名を明記しているが、属性ルートと routes.yaml の探索で該当ルートが存在しない。
- designRefDetail: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-7:1865
- implRef: 不在（探索範囲: src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php, app/config/eccube/routes.yaml, src/Eccube, html。検索語: otcBuyOrder/{id}/status, status.json, /status, api_admin_otc_buy_order_update_status）

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "a06-05_0506_sheet-7_sheet-conformance-2064ade3b436",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-7:1865",
  "designRefDetail": null,
  "designExpectation": "利用者視点の入口として、PUT /admin/otcBuyOrder/{id}/status の拡張子なし別名も /status.json と同一処理で提供する。",
  "designQuote": "利用者視点の入口として、PUT /admin/otcBuyOrder/{id}/status の拡張子なし別名も /status.json と同一処理で提供する。",
  "implRef": "不在（探索範囲: src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php, app/config/eccube/routes.yaml, src/Eccube, html。検索語: otcBuyOrder/{id}/status, status.json, /status, api_admin_otc_buy_order_update_status）",
  "implementationActual": "店頭買取ステータス更新の Route は /%eccube_api_v1_route%/admin/otcBuyOrder/{id}/status.json のみ定義され、拡張子なし /status の同一処理ルートは確認できない。",
  "difference": "設計は拡張子なし別名を明記しているが、属性ルートと routes.yaml の探索で該当ルートが存在しない。",
  "mismatchReason": "設計は拡張子なし別名を明記しているが、属性ルートと routes.yaml の探索で該当ルートが存在しない。",
  "comparisonRows": [
    {
      "item": "拡張子なしURL別名",
      "design": "PUT /admin/otcBuyOrder/{id}/status を /status.json と同一処理で提供",
      "implementation": "PUT /%eccube_api_v1_route%/admin/otcBuyOrder/{id}/status.json のみ",
      "mismatch": "拡張子なし別名が未実装"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "a06-05_0506_sheet-7_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "不在（探索範囲: src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php, app/config/eccube/routes.yaml, src/Eccube, html。検索語: otcBuyOrder/{id}/status, status.json, /status, api_admin_otc_buy_order_update_status）",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「利用者視点の入口として、PUT /admin/otcBuyOrder/{id}/status の拡張子なし別名も /status.json と同一処理で提供する。」。実装は「店頭買取ステータス更新の Route は /%eccube_api_v1_route%/admin/otcBuyOrder/{id}/status.json のみ定義され、拡張子なし /status の同一処理ルートは確認できない。」。乖離理由は「設計は拡張子なし別名を明記しているが、属性ルートと routes.yaml の探索で該当ルートが存在しない。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ルート・Controller",
    "Repository・Entity・DB",
    "CSV・API・Batch・PDF・印刷"
  ],
  "designSnippet": "",
  "implementationRefs": [
    "src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php",
    "app/config/eccube/routes.yaml"
  ],
  "implementationSnippets": [
    "src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:52\n49: use Symfony\\Component\\Security\\Http\\Attribute\\IsGranted;\n50: \n51: #[IsGranted('IS_AUTHENTICATED_FULLY')]\n52: class OtcBuyOrderController extends AbstractController\n53: {\n54:     public function __construct(\n55:         private readonly UpdateFreeCommentAction $updateFreeCommentAction,",
    "app/config/eccube/routes.yaml:1\n1: admin_controllers:\n2:     resource: '../../../src/Eccube/Controller/Admin'\n3:     type: attribute\n4: "
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

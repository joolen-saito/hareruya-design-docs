# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/a06-13_0506_sheet-13_sheet.json#a06-13_0506_sheet-13_sheet-conformance-d6fe27542ce6`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/a06-13_0506_sheet-13_sheet.json`
- sourceFindingId: `a06-13_0506_sheet-13_sheet-conformance-d6fe27542ce6`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `a06-13_0506_sheet-13_sheet` / A06-13 本人確認更新
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: 入口として PUT /admin/otcBuyOrder/{id}/identification と PUT /admin/otcBuyOrder/{id}/identification.json（同一処理）を提供し、受注IDの店頭買取受注に本人確認証明書を設定し、更新担当者・更新日時とともに保存して、成功時はコード200のJSONを返す。
- implementationActual: 本人確認更新APIのルートは #[Route('/%eccube_api_v1_route%/admin/otcBuyOrder/{id}/identification.json', name: 'api_admin_otc_buy_order_update_identification', methods: ['PUT'])] の1本だけで、拡張子なしの /admin/otcBuyOrder/{id}/identification または /%eccube_api_v1_…
- mismatchReason: 設計は拡張子なし入口と .json 別名を同一処理として列挙しているが、実装側で otcBuyOrder/{id}/identification、identification.json、api_admin_otc_buy_order_update_identification を検索して確認できた本人確認更新ルートは .json 付きのみ。Controller、Route属性、config/routes 系、Twig/JS 参照を再検索しても拡張子なし alias は見つか…
- designRefDetail: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-13:3421
- implRef: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube と /home/y-saito/Developments/ec-cube-enterprise/html。既存実装は /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.ph…

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "a06-13_0506_sheet-13_sheet-conformance-d6fe27542ce6",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-13:3421",
  "designRefDetail": null,
  "designExpectation": "入口として PUT /admin/otcBuyOrder/{id}/identification と PUT /admin/otcBuyOrder/{id}/identification.json（同一処理）を提供し、受注IDの店頭買取受注に本人確認証明書を設定し、更新担当者・更新日時とともに保存して、成功時はコード200のJSONを返す。",
  "designQuote": "入口として PUT /admin/otcBuyOrder/{id}/identification と PUT /admin/otcBuyOrder/{id}/identification.json（同一処理）を提供し、受注IDの店頭買取受注に本人確認証明書を設定し、更新担当者・更新日時とともに保存して、成功時はコード200のJSONを返す。",
  "implRef": "不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube と /home/y-saito/Developments/ec-cube-enterprise/html。既存実装は /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:273 の /%eccube_api_v1_route%/admin/otcBuyOrder/{id}/identification.json のみ）",
  "implementationActual": "本人確認更新APIのルートは #[Route('/%eccube_api_v1_route%/admin/otcBuyOrder/{id}/identification.json', name: 'api_admin_otc_buy_order_update_identification', methods: ['PUT'])] の1本だけで、拡張子なしの /admin/otcBuyOrder/{id}/identification または /%eccube_api_v1_route%/admin/otcBuyOrder/{id}/identification ルートは確認できない。",
  "difference": "設計は拡張子なし入口と .json 別名を同一処理として列挙しているが、実装側で otcBuyOrder/{id}/identification、identification.json、api_admin_otc_buy_order_update_identification を検索して確認できた本人確認更新ルートは .json 付きのみ。Controller、Route属性、config/routes 系、Twig/JS 参照を再検索しても拡張子なし alias は見つからなかった。",
  "mismatchReason": "設計は拡張子なし入口と .json 別名を同一処理として列挙しているが、実装側で otcBuyOrder/{id}/identification、identification.json、api_admin_otc_buy_order_update_identification を検索して確認できた本人確認更新ルートは .json 付きのみ。Controller、Route属性、config/routes 系、Twig/JS 参照を再検索しても拡張子なし alias は見つからなかった。",
  "comparisonRows": [
    {
      "item": "拡張子あり入口",
      "design": "PUT /admin/otcBuyOrder/{id}/identification.json は同一処理",
      "implementation": "PUT /%eccube_api_v1_route%/admin/otcBuyOrder/{id}/identification.json を実装",
      "mismatch": "API版数プレフィックス付きの .json ルートとして存在"
    },
    {
      "item": "拡張子なし入口",
      "design": "PUT /admin/otcBuyOrder/{id}/identification を同一処理として提供",
      "implementation": "該当Routeなし",
      "mismatch": "設計にある入口が未実装"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "a06-13_0506_sheet-13_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube と /home/y-saito/Developments/ec-cube-enterprise/html。既存実装は /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:273 の /%eccube_api_v1_route%/admin/otcBuyOrder/{id}/identification.json のみ）",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「入口として PUT /admin/otcBuyOrder/{id}/identification と PUT /admin/otcBuyOrder/{id}/identification.json（同一処理）を提供し、受注IDの店頭買取受注に本人確認証明書を設定し、更新担当者・更新日時とともに保存して、成功時はコード200のJSONを返す。」。実装は「本人確認更新APIのルートは #[Route('/%eccube_api_v1_route%/admin/otcBuyOrder/{id}/identification.json', name: 'api_admin_otc_buy_order_update_identification', methods: ['PUT'])] の1本だけで、拡張子なしの /admin/otcBuyOrder/{id}/identification または /%eccube_api_v1_route%/admin/otcBuyO…」。乖離理由は「設計は拡張子なし入口と .json 別名を同一処理として列挙しているが、実装側で otcBuyOrder/{id}/identification、identification.json、api_admin_otc_buy_order_update_identification を検索して確認できた本人確認更新ルートは .json 付きのみ。Controller、Route属性、config/routes 系、Twig/JS 参照を再検索しても拡張子なし alias は見つからなかった。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ルート・Controller",
    "Repository・Entity・DB",
    "Twig・画面表示",
    "CSV・API・Batch・PDF・印刷"
  ],
  "designSnippet": "",
  "implementationRefs": [
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:273",
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:273\n270:     /**\n271:      * 身分証明書種別の更新\n272:      */\n273:     #[Route('/%eccube_api_v1_route%/admin/otcBuyOrder/{id}/identification.json', name: 'api_admin_otc_buy_order_update_identification', methods: ['PUT'])]\n274:     public function updateIdentification(int $id, Request $request): JsonResponse\n275:     {\n276:         $OtcBuyOrder = $this->dtbOtcBuyOrderRepository->find($id);",
    "src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:52\n49: use Symfony\\Component\\Security\\Http\\Attribute\\IsGranted;\n50: \n51: #[IsGranted('IS_AUTHENTICATED_FULLY')]\n52: class OtcBuyOrderController extends AbstractController\n53: {\n54:     public function __construct(\n55:         private readonly UpdateFreeCommentAction $updateFreeCommentAction,"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/a06-04_0506_sheet-6_sheet.json#a06-04_0506_sheet-6_sheet-conformance-c3ac198f9319`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/a06-04_0506_sheet-6_sheet.json`
- sourceFindingId: `a06-04_0506_sheet-6_sheet-conformance-c3ac198f9319`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `a06-04_0506_sheet-6_sheet` / A06-04 店頭買取情報コメント更新
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: 店頭買取受注のコメント更新は拡張子なし別名 PUT /admin/otcBuyOrder/{id}/freeComment でも、拡張子ありと同一処理として呼び出せること。
- implementationActual: 実装されているのは拡張子ありの #[Route('/%eccube_api_v1_route%/admin/otcBuyOrder/{id}/freeComment.json', name: 'api_admin_otc_buy_order_update_free_comment', methods: ['PUT'])] のみ。拡張子なし /admin/otcBuyOrder/{id}/freeComment または /api/v1/admin/otcBuyOrder/{i…
- mismatchReason: 詳細設計の利用者視点の入口では拡張子なしパスと拡張子あり別名を同一処理として定義しているが、実装 Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php には .json 付きルートしかなく、app/config の追加 route も存在しない。
- designRefDetail: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-6:1689-1691,1697-1699
- implRef: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/html, /home/y-saito/Developments/ec-cube-enterprise/app/config; 検索語: otcBuyOrder/{id}/freeComment, freeComment.json, api_admin…

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "a06-04_0506_sheet-6_sheet-conformance-c3ac198f9319",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-6:1689-1691,1697-1699",
  "designRefDetail": null,
  "designExpectation": "店頭買取受注のコメント更新は拡張子なし別名 PUT /admin/otcBuyOrder/{id}/freeComment でも、拡張子ありと同一処理として呼び出せること。",
  "designQuote": "店頭買取受注のコメント更新は拡張子なし別名 PUT /admin/otcBuyOrder/{id}/freeComment でも、拡張子ありと同一処理として呼び出せること。",
  "implRef": "不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/html, /home/y-saito/Developments/ec-cube-enterprise/app/config; 検索語: otcBuyOrder/{id}/freeComment, freeComment.json, api_admin_otc_buy_order_update_free_comment, /api/admin/otcBuyOrder）",
  "implementationActual": "実装されているのは拡張子ありの #[Route('/%eccube_api_v1_route%/admin/otcBuyOrder/{id}/freeComment.json', name: 'api_admin_otc_buy_order_update_free_comment', methods: ['PUT'])] のみ。拡張子なし /admin/otcBuyOrder/{id}/freeComment または /api/v1/admin/otcBuyOrder/{id}/freeComment の Route 定義は確認できない。",
  "difference": "詳細設計の利用者視点の入口では拡張子なしパスと拡張子あり別名を同一処理として定義しているが、実装 Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php には .json 付きルートしかなく、app/config の追加 route も存在しない。",
  "mismatchReason": "詳細設計の利用者視点の入口では拡張子なしパスと拡張子あり別名を同一処理として定義しているが、実装 Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php には .json 付きルートしかなく、app/config の追加 route も存在しない。",
  "comparisonRows": [
    {
      "item": "拡張子なし入口",
      "design": "PUT /admin/otcBuyOrder/{id}/freeComment",
      "implementation": "該当 Route なし",
      "mismatch": "設計上の別名入口が未実装。"
    },
    {
      "item": "拡張子あり入口",
      "design": "PUT /admin/otcBuyOrder/{id}/freeComment.json は拡張子なしと同一処理",
      "implementation": "PUT /%eccube_api_v1_route%/admin/otcBuyOrder/{id}/freeComment.json のみ実装",
      "mismatch": "片方の別名だけ実装されている。"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "a06-04_0506_sheet-6_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/html, /home/y-saito/Developments/ec-cube-enterprise/app/config; 検索語: otcBuyOrder/{id}/freeComment, freeComment.json, api_admin_otc_buy_order_update_free_comment, /api/admin/otcBuyOrder）",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「店頭買取受注のコメント更新は拡張子なし別名 PUT /admin/otcBuyOrder/{id}/freeComment でも、拡張子ありと同一処理として呼び出せること。」。実装は「実装されているのは拡張子ありの #[Route('/%eccube_api_v1_route%/admin/otcBuyOrder/{id}/freeComment.json', name: 'api_admin_otc_buy_order_update_free_comment', methods: ['PUT'])] のみ。拡張子なし /admin/otcBuyOrder/{id}/freeComment または /api/v1/admin/otcBuyOrder/{id}/freeComment の Rou…」。乖離理由は「詳細設計の利用者視点の入口では拡張子なしパスと拡張子あり別名を同一処理として定義しているが、実装 Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php には .json 付きルートしかなく、app/config の追加 route も存在しない。」。",
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
    "不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/html, /home/y-saito/Developments/ec-cube-enterprise/app/config; 検索語: otcBuyOrder/{id}/freeComment, freeComment.json, api_admin_otc_buy_order_update_free_comment, /api/admin/otcBuyOrder）"
  ],
  "implementationSnippets": [],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

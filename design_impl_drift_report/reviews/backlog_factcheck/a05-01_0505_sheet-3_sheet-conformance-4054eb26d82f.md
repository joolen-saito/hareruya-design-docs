# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/a05-01_0505_sheet-3_sheet.json#a05-01_0505_sheet-3_sheet-conformance-4054eb26d82f`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/a05-01_0505_sheet-3_sheet.json`
- sourceFindingId: `a05-01_0505_sheet-3_sheet-conformance-4054eb26d82f`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `a05-01_0505_sheet-3_sheet` / A05-01 注文印刷_印刷情報をプリンタへ送信
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: A05-01 はエンドポイントURLを /order/prints/{店舗ID}、HTTPメソッドを GET とし、URLに店舗ID(shop_id)を引数として持つ。A05-02とはエンドポイントを分ける。
- implementationActual: 実装のルートは #[Route(path: '/api/order/prints/direct/{base_info_id}', name: 'order_direct_print', requirements: ['base_info_id' => '\d+'], methods: ['POST'])] で、A05-01(GetRequest) と A05-02(SetResponse) を同一POSTルート内の ConnectionType 分岐で処理している。
- mismatchReason: 設計は GET /order/prints/{店舗ID} と店舗ID(shop_id)パス引数、および A05-02 とのエンドポイント分離を要求するが、実装は POST /api/order/prints/direct/{base_info_id} の単一路線で、GETルートも /order/prints/{店舗ID} ルートも存在しない。探索範囲: src/Eccube, html の order/prints, prints/direct, order_direct_…
- designRefDetail: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html#sheet-3:855
- implRef: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:43

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "a05-01_0505_sheet-3_sheet-conformance-4054eb26d82f",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html#sheet-3:855",
  "designRefDetail": null,
  "designExpectation": "A05-01 はエンドポイントURLを /order/prints/{店舗ID}、HTTPメソッドを GET とし、URLに店舗ID(shop_id)を引数として持つ。A05-02とはエンドポイントを分ける。",
  "designQuote": "A05-01 はエンドポイントURLを /order/prints/{店舗ID}、HTTPメソッドを GET とし、URLに店舗ID(shop_id)を引数として持つ。A05-02とはエンドポイントを分ける。",
  "implRef": "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:43",
  "implementationActual": "実装のルートは #[Route(path: '/api/order/prints/direct/{base_info_id}', name: 'order_direct_print', requirements: ['base_info_id' => '\\d+'], methods: ['POST'])] で、A05-01(GetRequest) と A05-02(SetResponse) を同一POSTルート内の ConnectionType 分岐で処理している。",
  "difference": "設計は GET /order/prints/{店舗ID} と店舗ID(shop_id)パス引数、および A05-02 とのエンドポイント分離を要求するが、実装は POST /api/order/prints/direct/{base_info_id} の単一路線で、GETルートも /order/prints/{店舗ID} ルートも存在しない。探索範囲: src/Eccube, html の order/prints, prints/direct, order_direct_print, shop_id, base_info_id。",
  "mismatchReason": "設計は GET /order/prints/{店舗ID} と店舗ID(shop_id)パス引数、および A05-02 とのエンドポイント分離を要求するが、実装は POST /api/order/prints/direct/{base_info_id} の単一路線で、GETルートも /order/prints/{店舗ID} ルートも存在しない。探索範囲: src/Eccube, html の order/prints, prints/direct, order_direct_print, shop_id, base…",
  "comparisonRows": [
    {
      "item": "URL",
      "design": "/order/prints/{店舗ID}",
      "implementation": "/api/order/prints/direct/{base_info_id}",
      "mismatch": "パスが一致せず、設計の /order/prints/{店舗ID} は未登録。"
    },
    {
      "item": "HTTPメソッド",
      "design": "GET",
      "implementation": "POSTのみ",
      "mismatch": "A05-01のGET取得APIとして呼び出せない。"
    },
    {
      "item": "A05-02との分離",
      "design": "A05-02とエンドポイントを分ける",
      "implementation": "ConnectionType === 'GetRequest' / 'SetResponse' を同一メソッドで分岐",
      "mismatch": "設計の分離要求に反して同一エンドポイントで処理している。"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "a05-01_0505_sheet-3_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:43",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「A05-01 はエンドポイントURLを /order/prints/{店舗ID}、HTTPメソッドを GET とし、URLに店舗ID(shop_id)を引数として持つ。A05-02とはエンドポイントを分ける。」。実装は「実装のルートは #[Route(path: '/api/order/prints/direct/{base_info_id}', name: 'order_direct_print', requirements: ['base_info_id' => '\\d+'], methods: ['POST'])] で、A05-01(GetRequest) と A05-02(SetResponse) を同一POSTルート内の ConnectionType 分岐で処理している。」。乖離理由は「設計は GET /order/prints/{店舗ID} と店舗ID(shop_id)パス引数、および A05-02 とのエンドポイント分離を要求するが、実装は POST /api/order/prints/direct/{base_info_id} の単一路線で、GETルートも /order/prints/{店舗ID} ルートも存在しない。探索範囲: src/Eccube, html の order/prints, prints/direct, order_direct_print, shop_id, base…」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "業務ロジック・外部連携未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ルート・Controller",
    "CSV・API・Batch・PDF・印刷"
  ],
  "designSnippet": "",
  "implementationRefs": [
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:43",
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Controller/App/OrderController.php:43\n40:      *\n41:      * @return StreamedResponse\n42:      */\n43:     #[Route(path: '/api/order/prints/direct/{base_info_id}', name: 'order_direct_print', requirements: ['base_info_id' => '\\d+'], methods: ['POST'])]\n44:     public function orderDirectPrint(Request $request, int $base_info_id): StreamedResponse\n45:     {\n46:         $connectionType = $request->get('ConnectionType');",
    "src/Eccube/Controller/App/OrderController.php:28\n25: use Symfony\\Component\\HttpFoundation\\StreamedResponse;\n26: use Symfony\\Component\\Routing\\Attribute\\Route;\n27: \n28: class OrderController extends AbstractController\n29: {\n30:     public function __construct(\n31:         private readonly OrderDirectPrintAction $orderDirectPrintAction,"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

# a06-02_0506_sheet-4_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a06-02_0506_sheet-4_sheet.json#a06-02_0506_sheet-4_sheet-conformance-e31161ef4383`
- 機能: A06-02 A06-02 店頭買取情報取得
- 観点: ⑦要求網羅・実装違い

## 要旨
実装ルートは /api/v1/admin/otcBuyOrders.json のみで、設計の /api/admin/otcBuyOrders.json および拡張子なし別名 /admin/otcBuyOrders が存在しない。

## 判定理由
設計（基本設計）はエンドポイントURLを /api/admin/otcBuyOrders.json とし、詳細設計は GET /admin/otcBuyOrders.json と拡張子なし別名 GET /admin/otcBuyOrders を同一処理とする。実装では OtcBuyOrderController.php:69 に #[Route('/%eccube_api_v1_route%/admin/otcBuyOrders.json', ... methods:['GET'])] があるのみ。eccube.yaml:6 で env(ECCUBE_API_V1_ROUTE) の既定値が 'api/v1' のため実効パスは /api/v1/admin/otcBuyOrders.json となり、設計の /api プレフィックスと異なる。src/ 全体を 'admin/otcBuyOrders' で検索しても .json 付き api/v1 ルート1件のみで、拡張子なし別名も /api/admin ルートも存在しない。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:1078-1078` — 設計要求（エンドポイントURL / 拡張子なし別名）

```html
            <p class="doc-p" style="--lv:0">/api/admin/otcBuyOrders.json</p>
```

## ec-cube-enterprise 実装
api/v1 プレフィックス付き .json ルートのみ
`ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:69-69` — 実装ルート

```php
    #[Route('/%eccube_api_v1_route%/admin/otcBuyOrders.json', name: 'api_admin_otc_buy_orders', methods: ['GET'])]
```

既定値 api/v1
`ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:6-6` — APIプレフィックス既定値

```yaml
    env(ECCUBE_API_V1_ROUTE): 'api/v1'
```

## 不在確認コマンド

- `rg -n "admin/otcBuyOrders" /home/y-saito/Developments/ec-cube-enterprise/src`
- `rg -n "'/api/admin/otcBuyOrders" /home/y-saito/Developments/ec-cube-enterprise/src`

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証を試みたが崩せず。src全体で `rg -n "admin/otcBuyOrders"` は OtcBuyOrderController.php:69 の #[Route('/%eccube_api_v1_route%/admin/otcBuyOrders.json', methods:['GET'])] 1件のみ。拡張子なし別名 '/admin/otcBuyOrders' を `rg` しても0件。eccube.yaml:6 の env(ECCUBE_API_V1_ROUTE) 既定値は 'api/v1' で確認済み（他に 'api' 単独の上書きも無し）。実効パスは /api/v1/admin/otcBuyOrders.json となり、設計の /api/admin/otcBuyOrders.json および拡張子なし別名は実装されていない。指摘は維持。

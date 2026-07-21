# a07-06_0507_sheet-9_id 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a07-06_0507_sheet-9_id.json#a07-06_0507_sheet-9_id-conformance-ec3364efd43b`
- 機能: A07-06 A07-06 複数ネット買取IDから個別入力商品の一覧を取得
- 観点: ⑦要求網羅・実装違い

## 要旨
設計はエンドポイントを /api/admin/buyOrderIndivisualInputProduct.json とするが、実装は api/v1 プレフィックス付きの /api/v1/admin/buyOrderIndivisualInputProduct.json で公開している。

## 判定理由
設計HTMLのエンドポイントURL欄(line 1980)は /api/admin/buyOrderIndivisualInputProduct.json。一方 BuyOrderIndivisualInputProductController.php:37 の #[Route] は path を '/%eccube_api_v1_route%/admin/buyOrderIndivisualInputProduct.json' としており、パラメータ eccube_api_v1_route は app/config/eccube/packages/eccube.yaml:6 で env(ECCUBE_API_V1_ROUTE): 'api/v1' が既定値、同 72 行で eccube_api_v1_route に束縛される。したがって実際の入口は /api/v1/admin/... となり、設計の /api/admin/... と api/v1 プレフィックスの有無が食い違う。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html:1979-1980` — 設計要求(エンドポイントURL)

```html
            <h3 class="doc-h doc-h-section" style="--lv:0">エンドポイントURL</h3>
            <p class="doc-p" style="--lv:0">/api/admin/buyOrderIndivisualInputProduct.json</p>
```

## ec-cube-enterprise 実装
Route path に api/v1 プレフィックス
`ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderIndivisualInputProductController.php:37-38` — 実装ルート定義

```php
    #[Route(path: '/%eccube_api_v1_route%/admin/buyOrderIndivisualInputProduct.json', name: 'api_admin_buy_order_indivisual_input_product', methods: ['POST'])]
    public function getByBuyOrderIds(Request $request): JsonResponse
```

eccube_api_v1_route = api/v1
`ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:6-6` — プレフィックス既定値

```yaml
    env(ECCUBE_API_V1_ROUTE): 'api/v1'
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証失敗。指摘は維持。(1)別実装: rg 'buyOrderIndivisualInputProduct' で Controller/App 配下を横断したが Route 定義は BuyOrderIndivisualInputProductController.php:37 の1件のみで、別プレフィックスの代替ルートは存在しない。(2)引用の正しさ: 設計HTML line 1980 は実際に '/api/admin/buyOrderIndivisualInputProduct.json'(v1無し)、Controller line 37 は path: '/%eccube_api_v1_route%/admin/buyOrderIndivisualInputProduct.json' を確認。(3)設定値: eccube.yaml:6 env(ECCUBE_API_V1_ROUTE): 'api/v1'、72 で束縛。.env* 含め ECCUBE_API_V1_ROUTE の上書きは無く既定 'api/v1' が有効。よって実入口は /api/v1/admin/... となり設計の /api/admin/... と api/v1 プレフィックス有無が食い違う。(3)設計側除外の注記(Ph2/対象外/現行踏襲等)も近傍(line 1979-1982)に無し。実装が本当に v1 プレフィックスで公開されており、要求(v1無しURL)を満たす証拠は見つからなかった。

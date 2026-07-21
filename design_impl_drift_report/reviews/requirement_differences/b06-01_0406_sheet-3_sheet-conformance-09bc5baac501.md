# b06-01_0406_sheet-3_sheet 実装違い

- 判定: **CONFIRMED**（confidence: medium）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b06-01_0406_sheet-3_sheet.json#b06-01_0406_sheet-3_sheet-conformance-09bc5baac501`
- 機能: B06-01 B06-01 【新規】買取自動入庫バッチ
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は買取店舗のECCUBE在庫への登録を要求するが、店頭買取入庫処理は BaseInfo（店舗）一致だけで既存 ProductStock を選び stock_location_id を条件にせず、既存行のロケーションを引き継ぐため非ECCUBE在庫を更新し得る。

## 判定理由
設計書（HTML 851行・856行）は『実在庫情報を買取を行った店舗のECCUBE在庫に登録する』と要求する。実装 OtcBuyOrderStockInbound::process は $ProductClass->getProductStocks() を走査し $Stock->getBaseInfo()->getId() === $BaseInfo->getId() だけで既存 ProductStock を選択（56-61行）、保存時は stockLocationId として既存行の getStockLocationId() を引き継ぎ、既存行が無い場合のみ STOCK_LOCATION_ECCUBE を用いる（81行）。stock_location_id で ECCUBE 在庫に限定していないため、同一店舗にスマレジ等の非ECCUBE在庫行が存在する場合その行を更新し得る。ProductClass には base_info_id と stock_location_id=STOCK_LOCATION_ECCUBE の両方で在庫行を特定する専用メソッド getProductStockByEccube(ProductClass.php 618行、getProductStockByLocation で stock_location_id を判定 646-650行)が実装済みだが、自動入庫処理では使用されていない。設計要求（ECCUBE在庫への登録）と実装の在庫行選択条件が一致しないことは事実。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0406_基本設計仕様書(バッチ_店頭買取管理) .html:851-856` — 設計要求

```html
            <div class="doc-bullet" style="--lv:1"><span class="doc-marker">・</span><span>ステータスが入庫待ちの店頭買取情報を対象に、実在庫情報を買取を行った店舗のECCUBE在庫に登録する</span></div>
            <div class="doc-bullet" style="--lv:1"><span class="doc-marker">・</span><span>ステータスが入庫待ちのネット買取情報を対象に、実在庫情報を買取を本店のECCUBE在庫に登録する</span></div>
            <h3 class="doc-h doc-h-section doc-h-spec" id="sheet-3-spec-1" style="--lv:0"><span class="spec-badge">機能仕様</span>処理概要（★はカスタマイズ項目）</h3>
            <div class="doc-bullet" style="--lv:1"><span class="doc-marker">★</span><span>１．店頭買取の自動入庫</span></div>
            <p class="doc-p" style="--lv:2">①ステータスが入庫待ちの店頭買取情報を取得する</p>
            <h4 class="doc-h doc-h-sub" style="--lv:2">②ステータスが入庫待ちの店頭買取情報の実在庫情報を、店頭買取を行った店舗のECCUBE在庫に登録する</h4>
```

## ec-cube-enterprise 実装
BaseInfo一致のみで選択し stock_location_id を条件にしていない
`ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/OtcBuyOrderStockInbound.php:56-61` — 実装（在庫行選択条件）

```php
            foreach ($ProductClass->getProductStocks() as $Stock) {
                if ($Stock->getBaseInfo()->getId() === $BaseInfo->getId()) {
                    $ProductStock = $Stock;
                    break;
                }
            }
```

既存行があればその stockLocationId を引き継ぎ、未存在時のみ STOCK_LOCATION_ECCUBE
`ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/OtcBuyOrderStockInbound.php:81-81` — 実装（保存時ロケーション）

```php
                stockLocationId: $ProductStock?->getStockLocationId() ?? ProductStock::STOCK_LOCATION_ECCUBE,
```

base_info_id + stock_location_id=ECCUBE で在庫特定するメソッドが存在するが自動入庫処理では未使用
`ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:618-620` — 実装（未使用の専用ヘルパー）

```php
        public function getProductStockByEccube(?BaseInfo $baseInfo = null): ?ProductStock
        {
            return $this->getProductStockByLocation(ProductStock::STOCK_LOCATION_ECCUBE, $baseInfo);
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証を試みたが逆に確定的な裏付けが得られた。設計 HTML 851/856行は『買取を行った店舗のECCUBE在庫に登録する』を要求（引用正確）。実装 OtcBuyOrderStockInbound.php 56-61行は getProductStocks() を走査し $Stock->getBaseInfo()->getId() === $BaseInfo->getId() のみで選択し stock_location_id を条件にせず、81行で save 時に既存行の getStockLocationId() を引き継ぐ（未存在時のみ STOCK_LOCATION_ECCUBE）。ProductStockEntityManager::save も渡された stockLocationId をそのまま setStockLocationId するだけで補正しない。反証観点『同一(product_class, base_info)に複数行は無い』を検証すべくシード dtb_product_stock_1.sql を確認したところ、product_class_id=1/base_info_id=3 に対し id=1(stock_location_id=1=ECCUBE)と id=2(stock_location_id=2=スマレジ)の2行が実在（全base_infoで1/2の2行構成）。すなわち BaseInfo一致のみの選択はコレクション順次第で非ECCUBE(スマレジ)行を拾い得る。専用メソッド getProductStockByEccube(ProductClass.php:618, getProductStockByLocation 646-661 で base_info_id+stock_location_id=ECCUBE 判定)が実装済みだが本処理は未使用。別実装・ネット買取側含めrgしたが ECCUBE 限定選択の代替経路は無い。指摘維持。

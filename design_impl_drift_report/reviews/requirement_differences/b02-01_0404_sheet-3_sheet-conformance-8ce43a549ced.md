# b02-01_0404_sheet-3_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b02-01_0404_sheet-3_sheet.json#b02-01_0404_sheet-3_sheet-conformance-8ce43a549ced`
- 機能: B02-01 B02-01 期間別販売数集計
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は本店の支店IDを0として処理するが、実装は集計SQLが dtb_shipping.base_info_id をそのまま出力し、本店(通販+TC東京)は base_info_id=1、0 は人気商品リコメンド用に予約されている。

## 判定理由
設計(★カスタマイズ項目)は本店の支店IDを0と定める(line 875)。実装 getSalesForAggregate() は集計キーに `s.base_info_id`(dtb_shipping.base_info_id) をそのまま用い(DtbSalesQuantityRepository.php:438)、本店を0へ写像する処理がない。BaseInfo::TC_TOKYO_ID = 1(本店/通販+TC東京)で getMainSalesQuantitiesByProductClassIds はこれを本店集計に使用。さらに base_info_id=0 は POPULAR_PRODUCT_RECOMMEND_SHOP_ID = 0(人気商品リコメンド用)として予約され、clearSalesQuantityForAggregate() でも削除対象から除外される。よって本店の識別値が設計の0と一致しない実装違い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:875-875` — 設計要求

```html
            <div class="doc-bullet" style="--lv:0"><span class="doc-marker">★</span><span>本店の支店IDは0として処理する</span></div>
```

## ec-cube-enterprise 実装
dtb_shipping.base_info_id をそのまま集計キーに使用
`ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:437-438` — 集計SQLの店舗ID出力

```php
                oi.product_class_id,
                s.base_info_id,
```

本店(通販+TC東京)は 1
`ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:45-45` — 本店定数

```php
        public const TC_TOKYO_ID = 1;
```

人気商品リコメンド用店舗ID
`ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:39-39` — 0 は別用途に予約

```php
    public const POPULAR_PRODUCT_RECOMMEND_SHOP_ID = 0;
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。設計 line875『★本店の支店IDは0として処理する』を実在確認。実装 getSalesForAggregate() は SELECT で s.base_info_id をそのまま出力し GROUP BY oi.product_class_id, s.base_info_id、updateSalesQuantityColumns も base_info_id をそのまま INSERT/更新(DtbSalesQuantityRepository.php:436-458, 104-)。本店(TC_TOKYO)を0へ写像する CASE/COALESCE 等を rg したが皆無(base_info_id.*0 のヒットは削除除外コメントと支店取得の説明のみ)。BaseInfo::TC_TOKYO_ID=1(BaseInfo.php:45)、POPULAR_PRODUCT_RECOMMEND_SHOP_ID=0(同Repo:39)で clearSalesQuantityForAggregate は base_info_id!=0 のみ削除し0を人気リコメンド用に予約(:95-98)。本店識別値が設計の0と一致せず別実装も存在しない。指摘は維持。

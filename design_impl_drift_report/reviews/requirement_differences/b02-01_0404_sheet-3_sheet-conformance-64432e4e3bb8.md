# b02-01_0404_sheet-3_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b02-01_0404_sheet-3_sheet.json#b02-01_0404_sheet-3_sheet-conformance-64432e4e3bb8`
- 機能: B02-01 B02-01 期間別販売数集計
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は対象が無い場合は更新を行わずに終了するが、実装は集計対象取得の前に clearSalesQuantityForAggregate() を必ず呼び、既存集計行を DELETE してから対象を取得する。

## 判定理由
設計の処理フロー(line 927)とエラー処理表(line 952)は『対象が無い場合は更新を行わず完了する』を要求。実装 handle() は clearSalesQuantityForAggregate() を getSalesForAggregate() より前に無条件で実行(BatchAggregateSalesAction.php:46-47)。同メソッドは `DELETE FROM dtb_sales_quantity WHERE base_info_id != :popular_shop_id` を発行(DtbSalesQuantityRepository.php:96)。getSalesForAggregate() が空でも foreach が回らないだけで先行 DELETE は実行済みとなり、対象なしでも既存集計行(人気リコメンド以外)が消える。設計の『対象なしなら変更しない』より破壊的な実装違い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:927-927` — 設計要求

```html
          <ol><li>実行時間制限を解除し、SQLロガーを無効化する。</li><li>受注詳細を商品規格単位で集計し、期間別販売数（前日・3日・週・月・90日・180日・365日）の一覧を取得する。</li><li>対象が無い場合は更新を行わずに終了する。</li><li>集計結果の行ごとに、商品規格サブの販売数列を更新する。</li><li>100件ごとに変更を反映しキャッシュをクリアしながら処理する。</li><li>残りの変更を反映して終了する。</li></ol>
```

## ec-cube-enterprise 実装
clear→取得の順序
`ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateSalesAction.php:45-47` — 対象取得前に無条件で削除

```php
            // 集計前に既存の集計行を削除し、古い販売数が残らないようにする
            $this->salesQuantityRepository->clearSalesQuantityForAggregate();
            $salesData = $this->salesQuantityRepository->getSalesForAggregate();
```

人気リコメンド以外を全削除
`ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:95-98` — 削除処理の実体

```php
        $this->getEntityManager()->getConnection()->executeStatement(
            'DELETE FROM dtb_sales_quantity WHERE base_info_id != :popular_shop_id',
            ['popular_shop_id' => self::POPULAR_PRODUCT_RECOMMEND_SHOP_ID]
        );
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。設計 line927『対象が無い場合は更新を行わずに終了する』および line 949 付近のエラー処理『対象なし→更新を行わず完了』を実在確認。実装 BatchAggregateSalesAction::handle() は beginTransaction 後、対象取得 getSalesForAggregate() より前に clearSalesQuantityForAggregate() を無条件実行し(:44-45)、同メソッドは 'DELETE FROM dtb_sales_quantity WHERE base_info_id != :popular_shop_id' を発行(Repo:93-98)。salesData が空でも foreach が回らないだけで commit() は実行され DELETE が確定する。対象なしでも人気リコメンド以外の既存集計行が消える破壊的挙動で、条件付き削除や early-return も無い。指摘は維持。

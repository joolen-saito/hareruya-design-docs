/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ商品管理
機能：期間別販売数集計
課題カテゴリ：実装違い
課題：期間別販売数の反映先が設計のdtb_product_classではなくdtb_sales_quantityになっている
設計書：0404_基本設計仕様書(バッチ_商品管理).xlsx

# 再現手順【必須】
1. ec-cube-enterprise で bin/console eccube:aggregate-sales を実行する
2. 実行後に dtb_product_class.order_quantity_01〜order_quantity_08 が更新されるか確認する
3. 同時に dtb_sales_quantity.sales_quantity_01〜sales_quantity_08 が INSERT/UPDATE されているか確認する

# 期待される挙動【必須】
- 移行先では補助表を設けず、商品規格 dtb_product_class の order_quantity_01〜order_quantity_08 に期間別販売数を反映する
- 現行の dtb_product_sub_class から移行先の dtb_product_class へ販売数保持先を統合する
- B02-01の更新処理は dtb_product_class の販売数列を更新対象にする

# 現在の挙動【必須】
- ec-cube-enterprise では、B02-01本体の `BatchAggregateSalesAction::handle()` が `DtbSalesQuantityRepository::updateSalesQuantityColumns()` を呼び、同Repositoryが `dtb_sales_quantity` に `sales_quantity_01`〜`sales_quantity_08` を INSERT/UPDATE している。設計が指定する `dtb_product_class.order_quantity_01`〜`order_quantity_08` はB02-01実行経路では更新されない。

ec-cube-enterprise BatchAggregateSalesAction は DtbSalesQuantityRepository の更新処理を呼ぶ: `ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateSalesAction.php:45-50`
```php
            // 集計前に既存の集計行を削除し、古い販売数が残らないようにする
            $this->salesQuantityRepository->clearSalesQuantityForAggregate();
            $salesData = $this->salesQuantityRepository->getSalesForAggregate();
            foreach ($salesData as $data) {
                $this->salesQuantityRepository->updateSalesQuantityColumns($data);
            }
```

ec-cube-enterprise DtbSalesQuantityRepository は dtb_sales_quantity を INSERT/UPDATE する: `ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:93-153`
```php
    public function clearSalesQuantityForAggregate(): void
    {
        $this->getEntityManager()->getConnection()->executeStatement(
            'DELETE FROM dtb_sales_quantity WHERE base_info_id != :popular_shop_id',
            ['popular_shop_id' => self::POPULAR_PRODUCT_RECOMMEND_SHOP_ID]
        );
    }

    /**
     * Update salesQuantity clumns
     *
     * @param array<string, mixed> $salesQuantity
     */
    public function updateSalesQuantityColumns(array $salesQuantity): void
    {
        $date = (new \DateTime())->format('Y/m/d H:i:s');
        $salesQuantity['update_date'] = $date;
        $salesQuantityEntry = $this->findOneBy(['ProductClass' => $salesQuantity['product_class_id'], 'BaseInfo' => $salesQuantity['base_info_id']]);
        if (empty($salesQuantityEntry)) {
            $query = '
                INSERT INTO dtb_sales_quantity
                (
                    product_class_id,
                    base_info_id,
                    sales_quantity_01,
                    sales_quantity_02,
                    sales_quantity_03,
                    sales_quantity_04,
                    sales_quantity_05,
                    sales_quantity_06,
                    sales_quantity_07,
                    sales_quantity_08,
                    update_date
                ) VALUES (
                    :product_class_id,
                    :base_info_id,
                    0,
                    :sales_yesterday,
                    :sales_3day,
                    :sales_weekly,
                    :sales_month,
                    :sales_90day,
                    :sales_180day,
                    :sales_365day,
                    :update_date
                )';
        } else {
            $query = '
                UPDATE dtb_sales_quantity
                SET sales_quantity_01 = 0,
                    sales_quantity_02 = :sales_yesterday,
                    sales_quantity_03 = :sales_3day,
                    sales_quantity_04 = :sales_weekly,
                    sales_quantity_05 = :sales_month,
                    sales_quantity_06 = :sales_90day,
                    sales_quantity_07 = :sales_180day,
                    sales_quantity_08 = :sales_365day,
                    update_date = :update_date
                WHERE product_class_id = :product_class_id AND base_info_id = :base_info_id';
        }
        $this->getEntityManager()->getConnection()->executeUpdate($query, $salesQuantity);
```

ec-cube-enterprise ProductClass には order_quantity_01〜08 が存在する: `ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:325-347`
```php
        #[ORM\Column(name: 'order_quantity_01', type: Types::INTEGER, nullable: false, options: ['default' => 0, 'unsigned' => true, 'comment' => '当日販売数'])]
        private int $order_quantity_01 = 0;

        #[ORM\Column(name: 'order_quantity_02', type: Types::INTEGER, nullable: false, options: ['default' => 0, 'unsigned' => true, 'comment' => '昨日販売数'])]
        private int $order_quantity_02 = 0;

        #[ORM\Column(name: 'order_quantity_03', type: Types::INTEGER, nullable: false, options: ['default' => 0, 'unsigned' => true, 'comment' => '3日間販売数'])]
        private int $order_quantity_03 = 0;

        #[ORM\Column(name: 'order_quantity_04', type: Types::INTEGER, nullable: false, options: ['default' => 0, 'unsigned' => true, 'comment' => '1週間販売数'])]
        private int $order_quantity_04 = 0;

        #[ORM\Column(name: 'order_quantity_05', type: Types::INTEGER, nullable: false, options: ['default' => 0, 'unsigned' => true, 'comment' => '1ヶ月販売数'])]
        private int $order_quantity_05 = 0;

        #[ORM\Column(name: 'order_quantity_06', type: Types::INTEGER, nullable: false, options: ['default' => 0, 'unsigned' => true, 'comment' => '90日間販売数'])]
        private int $order_quantity_06 = 0;

        #[ORM\Column(name: 'order_quantity_07', type: Types::INTEGER, nullable: false, options: ['default' => 0, 'unsigned' => true, 'comment' => '180日間販売数'])]
        private int $order_quantity_07 = 0;

        #[ORM\Column(name: 'order_quantity_08', type: Types::INTEGER, nullable: false, options: ['default' => 0, 'unsigned' => true, 'comment' => '365日間販売数'])]
        private int $order_quantity_08 = 0;
```
- ベース実装(pf-eccube3)では、`DtbProductSubClassRepository::updateProductSummaryColumns()` が現行の販売数保持先である `dtb_product_sub_class.order_quantity_01`〜`order_quantity_08` を更新する。設計はこの現行保持先を、移行先では補助表ではなく `dtb_product_class.order_quantity_01`〜`order_quantity_08` に統合するとしている。

ベース実装 pf-eccube3 は dtb_product_sub_class.order_quantity_01〜08 を更新する: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:632-645`
```php
    public function updateProductSummaryColumns(Application $app, $productClass)
    {
        $query = "update dtb_product_sub_class
                  set order_quantity_01 = 0,
                      order_quantity_02 = :sales_yesterday,
                      order_quantity_03 = :sales_3day,
                      order_quantity_04 = :sales_weekly,
                      order_quantity_05 = :sales_month,
                      order_quantity_06 = :sales_90day,
                      order_quantity_07 = :sales_180day,
                      order_quantity_08 = :sales_365day
                  where product_class_id =:product_class_id";

        $app['orm.em']->getConnection()->executeUpdate($query, $productClass);
```

# 根拠
- 設計：
  - 設計HTMLは移行先で補助表を設けず dtb_product_class.order_quantity_01〜08 に統合すると明記する: `hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:914-916`
- ec-cube-enterprise：
  - enterprise のB02-01実行経路は dtb_sales_quantity の更新処理を呼ぶ: `ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateSalesAction.php:45-50`
  - enterprise は dtb_sales_quantity.sales_quantity_01〜08 を INSERT/UPDATE する: `ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:93-153`
  - ProductClass には設計が要求する order_quantity_01〜08 の列定義がある: `ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:325-347`
- ベース実装：
  - pf-eccube3 は現行保持先 dtb_product_sub_class の order_quantity_01〜08 を更新する: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:632-645`

# 確認メモ
- 確認コマンド: `rg -n "補助表を設けず|dtb_product_class|order_quantity_01|order_quantity_08|販売数の反映先" excel_to_html/output/0404_基本設計仕様書\(バッチ_商品管理\).html design_impl_drift_report/findings/b02-01_0404_sheet-3_sheet.json`
- 確認コマンド: `rg -n "updateProductSummaryColumns|dtb_product_sub_class|order_quantity_01|order_quantity_08" ../pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php`
- 確認コマンド: `rg -n "order_quantity_0[1-8]|sales_quantity_0[1-8]|dtb_sales_quantity|updateSalesQuantityColumns|updateProductSummaryColumns" ../ec-cube-enterprise/src/Eccube/Entity ../ec-cube-enterprise/src/Eccube/Repository ../ec-cube-enterprise/src/Eccube/Service/Product ../ec-cube-enterprise/app/DoctrineMigrations`
- enterprise の `ProductClass` には `order_quantity_01`〜`order_quantity_08` が存在するが、B02-01実行経路では更新されない。
- enterprise の `ProductClassRepository` には order_quantity 更新らしきコメントアウトがあるが、実行されるコードではなく、B02-01から呼ばれない。
- DtbSalesQuantityRepository には `dtb_sales_quantity` の値を `order_quantity_01` alias で返す参照メソッドがあるが、B02-01の保存・更新先は補助表 `dtb_sales_quantity` である。

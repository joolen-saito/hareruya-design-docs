/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ商品管理
機能：期間別販売数集計
課題カテゴリ：実装違い
課題：期間別販売数集計バッチが100件ごとの部分反映ではなく全体トランザクションで処理される
設計書：0404_基本設計仕様書(バッチ_商品管理).xlsx

# 再現手順【必須】
1. 期間別販売数集計バッチで複数件の集計結果が得られる受注データを用意する
2. ec-cube-enterprise で bin/console eccube:aggregate-sales を実行し、集計行の更新途中で例外が発生する条件を作る
3. dtb_sales_quantity に途中まで反映された行が残るか、または全体がロールバックされるかを確認する

# 期待される挙動【必須】
- 集計結果の行ごとに販売数列を更新する
- 100件ごとに変更を反映し、EntityManager のキャッシュをクリアしながら処理する
- 途中失敗時は反映済みの行のみ更新が残り、部分反映は次回実行で回収される

# 現在の挙動【必須】
- ec-cube-enterprise では `BatchAggregateSalesAction::handle()` が DB connection の明示トランザクションを開始し、既存集計行の削除、集計、各行更新をすべて同一トランザクション内で実行してから `commit()` する。例外時は `rollBack()` するため、設計のように途中まで反映済みの行だけが残る部分反映モデルではない。

ec-cube-enterprise BatchAggregateSalesAction は全体を1トランザクションで処理する: `ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateSalesAction.php:37-55`
```php
    public function handle(): void
    {
        // TODO: スマレジ実店舗販売を dtb_order に取り込む処理が実装されたら、
        //       getSalesForAggregate() がスマレジ受注も自動的に含むか確認する。
        //       スマレジ受注が別テーブルで管理される場合は別途集計処理を追加する。
        $connection = $this->entityManager->getConnection();
        $connection->beginTransaction();
        try {
            // 集計前に既存の集計行を削除し、古い販売数が残らないようにする
            $this->salesQuantityRepository->clearSalesQuantityForAggregate();
            $salesData = $this->salesQuantityRepository->getSalesForAggregate();
            foreach ($salesData as $data) {
                $this->salesQuantityRepository->updateSalesQuantityColumns($data);
            }
            $connection->commit();
        } catch (\Throwable $e) {
            $connection->rollBack();
            throw $e;
        }
```

ec-cube-enterprise DtbSalesQuantityRepository は各行を INSERT/UPDATE するが100件単位のflush/clearはない: `ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:106-153`
```php
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
- ベース実装(pf-eccube3)では、`UpdateProductSummary::execute()` が集計結果を1行ずつ更新し、`$index % 100 === 0` のタイミングで `flush()` と `EntityManagerUtil::clearCache()` を実行する。外側で全件を包む明示トランザクションはなく、設計の100件ごとの反映・キャッシュクリア要求の根拠になっている。

ベース実装 pf-eccube3 UpdateProductSummary は100件ごとにflushとキャッシュクリアを行う: `pf-eccube3/app/Plugin/HareruyaEc/Service/Product/UpdateProductSummary.php:30-43`
```php
    public function execute()
    {
        set_time_limit(0);
        $this->app['orm.em']->getConnection()->getConfiguration()->setSQLLogger(null);
        $orderDetails = $this->app['hareruya_ec.repository.order_detail']->getSaleForUpdateSummary($this->app);
        foreach ($orderDetails as $index => $detail) {
            $this->app['hareruya_ec.repository.product_sub_class']->updateProductSummaryColumns($this->app, $detail);
            if ($index % 100 === 0) {
                $this->app['orm.em']->flush();
                EntityManagerUtil::clearCache($this->app['orm.em']);
            }
        }
        $this->app['orm.em']->flush();
    }
```

ベース実装 pf-eccube3 DtbProductSubClassRepository は商品規格ごとに販売数列を更新する: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:632-645`
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
  - 設計HTMLは処理フローで100件ごとの反映とキャッシュクリアを要求する: `hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:925-927`
  - 設計HTMLは失敗時に反映済み行のみ更新が残り、部分反映は次回実行で回収されるとする: `hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:935-942`
- ec-cube-enterprise：
  - enterprise は明示トランザクションで全体を囲み、成功時 commit、例外時 rollBack する: `ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateSalesAction.php:42-55`
  - enterprise のB02-01更新処理は各行INSERT/UPDATEだが、100件単位のflush/clearは呼び出し元に存在しない: `ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:106-153`
- ベース実装：
  - pf-eccube3 は100件ごとに flush と EntityManagerUtil::clearCache を実行する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Product/UpdateProductSummary.php:30-43`

# 確認メモ
- 確認コマンド: `rg -n "100件ごと|部分反映|途中失敗|反映済み|キャッシュをクリア" excel_to_html/output/0404_基本設計仕様書\(バッチ_商品管理\).html design_impl_drift_report/findings/b02-01_0404_sheet-3_sheet.json`
- 確認コマンド: `rg -n "updateProductSummary|flush\(|clearCache|% 100|updateProductSummaryColumns" ../pf-eccube3/app/Plugin/HareruyaEc/Service/Product/UpdateProductSummary.php ../pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php`
- 確認コマンド: `rg -n "flush\(|clear\(|beginTransaction|commit\(|rollBack|100|setSQLLogger|set_time_limit" ../ec-cube-enterprise/src/Eccube/Command/AggregateSalesCommand.php ../ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateSalesAction.php ../ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php`
- B02-01のenterprise実行経路は `AggregateSalesCommand::execute()` から `BatchAggregateSalesAction::handle()` であり、同handle内に100件ごとのflush/clearはない。
- enterprise側の `set_time_limit`、`setSQLLogger(null)`、`flush()`、`clear()` は `DtbSalesQuantityRepository::updateRecommend()` 側に存在するが、B02-01の `BatchAggregateSalesAction::handle()` から呼ばれていない。
- DBAL `executeUpdate()` は呼び出し元の connection transaction 内で実行されるため、例外時は `rollBack()` により全体が戻る。

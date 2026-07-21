/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ商品管理
機能：期間別入庫数集計
課題カテゴリ：実装違い
課題：期間別入庫数集計バッチで100件ごとの反映・キャッシュクリアが実装されていない
設計書：0404_基本設計仕様書(バッチ_商品管理).xlsx

# 再現手順【必須】
1. ec-cube-enterprise の `BatchAggregateStockUpAction::handle()` と `DtbStockUpQuantityRepository::updateStockUpQuantityColumns()` を確認する
2. 集計結果の foreach 更新中に、100件ごとの反映境界や EntityManager clear / キャッシュクリア相当の処理があるか確認する
3. ベース実装(pf-eccube3)の `UpdateProductSummaryForStockUp::execute()` を確認し、100件ごとの `flush()` と `EntityManagerUtil::clearCache()` の有無を比較する
4. 0404 の B02-03 設計「100件ごとに変更を反映しキャッシュをクリア」と照合する

# 期待される挙動【必須】
- 集計結果を行ごとに更新し、100件ごとに変更を反映する
- 100件ごとの反映時にキャッシュをクリアしてメモリを管理する
- 残りの変更を最後に反映して終了する

# 現在の挙動【必須】
- ec-cube-enterprise の `BatchAggregateStockUpAction::handle()` は、全体を1トランザクションで開始し、集計結果を foreach で `updateStockUpQuantityColumns()` に渡した後、最後に一度だけ `commit()` する。100件単位の分岐、flush、EntityManager clear、キャッシュクリア相当の処理はない。

ec-cube-enterprise BatchAggregateStockUpAction は全件処理後に一度だけ commit する: `ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateStockUpAction.php:34-49`
```php
    public function handle(): void
    {
        $connection = $this->entityManager->getConnection();
        $connection->beginTransaction();
        try {
            $this->stockUpQuantityRepository->clearStockUpQuantityForAggregate();
            $stockUpData = $this->stockUpQuantityRepository->getStockUpForAggregate();
            foreach ($stockUpData as $data) {
                $this->stockUpQuantityRepository->updateStockUpQuantityColumns($data);
            }
            $connection->commit();
        } catch (\Throwable $e) {
            $connection->rollBack();
            throw $e;
        }
    }
```
- ec-cube-enterprise の `DtbStockUpQuantityRepository` は、集計用の既存行を一括削除し、各行の INSERT/UPDATE を `executeUpdate()` で実行する。Repository 内にも 100件単位の flush/clear/cache clear はない。

ec-cube-enterprise DtbStockUpQuantityRepository は集計用行を DELETE する: `ec-cube-enterprise/src/Eccube/Repository/DtbStockUpQuantityRepository.php:96-104`
```php
    /**
     * 集計用の既存行を削除する。
     */
    public function clearStockUpQuantityForAggregate(): void
    {
        $this->getEntityManager()->getConnection()->executeStatement(
            'DELETE FROM dtb_stock_up_quantity'
        );
    }
```

ec-cube-enterprise DtbStockUpQuantityRepository は各行を executeUpdate する: `ec-cube-enterprise/src/Eccube/Repository/DtbStockUpQuantityRepository.php:195-249`
```php
    public function updateStockUpQuantityColumns(array $stockUpQuantity): void
    {
        $date = (new \DateTime())->format('Y/m/d H:i:s');
        $stockUpQuantity['update_date'] = $date;
        $StockUpQuantityEntry = $this->findOneBy(['ProductClass' => $stockUpQuantity['product_class_id'], 'BaseInfo' => $stockUpQuantity['base_info_id']]);
        if ($StockUpQuantityEntry === null) {
            $query = '
                INSERT INTO dtb_stock_up_quantity
                (
                    product_class_id,
                    base_info_id,
                    stock_up_quantity_01,
                    stock_up_quantity_02,
                    stock_up_quantity_03,
                    stock_up_quantity_04,
                    stock_up_quantity_05,
                    stock_up_quantity_06,
                    stock_up_quantity_07,
                    stock_up_quantity_08,
                    stock_up_quantity_09,
                    stock_up_quantity_10,
                    update_date
                ) VALUES (
                    :product_class_id,
                    :base_info_id,
                    0,
                    :stock_up_yesterday,
                    :stock_up_3day,
                    :stock_up_weekly,
                    :stock_up_month,
                    :stock_up_90day,
                    :stock_up_180day,
                    :stock_up_365day,
                    :stock_up_2week,
                    :stock_up_3week,
                    :update_date
                )';
        } else {
            $query = '
                UPDATE dtb_stock_up_quantity
                SET stock_up_quantity_01 = 0,
                    stock_up_quantity_02 = :stock_up_yesterday,
                    stock_up_quantity_03 = :stock_up_3day,
                    stock_up_quantity_04 = :stock_up_weekly,
                    stock_up_quantity_05 = :stock_up_month,
                    stock_up_quantity_06 = :stock_up_90day,
                    stock_up_quantity_07 = :stock_up_180day,
                    stock_up_quantity_08 = :stock_up_365day,
                    stock_up_quantity_09 = :stock_up_2week,
                    stock_up_quantity_10 = :stock_up_3week,
                    update_date = :update_date
                WHERE product_class_id = :product_class_id AND base_info_id = :base_info_id';
        }
        $this->getEntityManager()->getConnection()->executeUpdate($query, $stockUpQuantity);
    }
```
- ベース実装(pf-eccube3)の `UpdateProductSummaryForStockUp::execute()` は、集計結果を foreach で更新し、`$index % 100 === 0` のタイミングで `flush()` と `EntityManagerUtil::clearCache()` を実行し、最後にも `flush()` する。

ベース実装 pf-eccube3 UpdateProductSummaryForStockUp は100件ごとに flush と clearCache を行う: `pf-eccube3/app/Plugin/HareruyaEc/Service/Product/UpdateProductSummaryForStockUp.php:28-41`
```php
    public function execute()
    {
        set_time_limit(0);
        $this->app['orm.em']->getConnection()->getConfiguration()->setSQLLogger(null);
        $stockHistories = $this->app['hareruya_ec.repository.stock_history']->getStockUpForUpdateSummary($this->app);
        foreach ($stockHistories as $index => $history) {
            $this->app['hareruya_ec.repository.product_sub_class']->updateProductSummaryColumnsForStockUp($this->app, $history);
            if ($index % 100 === 0) {
                $this->app['orm.em']->flush();
                EntityManagerUtil::clearCache($this->app['orm.em']);
            }
        }
        $this->app['orm.em']->flush();
    }
```

ベース実装 pf-eccube3 ProductBatch は updateProductSummaryForStockUp を処理本体に対応させる: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:12-20`
```php
    const BATCH_NAMES = [
        'displayReleasedProduct' => 'Plugin\HareruyaEc\Service\Product\DisplayReleasedProduct',
        'updateProductSummary' => 'Plugin\HareruyaEc\Service\Product\UpdateProductSummary',
        'attachCategory' => 'Plugin\HareruyaEc\Service\Product\AttachCategory',
        'deleteProductRequest' => 'Plugin\HareruyaEc\Service\Product\DeleteProductRequest',
        'exportWeeklyStockHistoryCsv' => 'Plugin\HareruyaEc\Service\Product\ExportWeeklyStockHistoryCsv',
        'ExportPopularProductRecommendCsv' => 'Plugin\HareruyaEc\Service\Product\ExportPopularProductRecommendCsv',
        'insertStockHistory' => 'Plugin\HareruyaEc\Service\Product\InsertStockHistory',
        'updateProductSummaryForStockUp' => 'Plugin\HareruyaEc\Service\Product\UpdateProductSummaryForStockUp',
```

# 根拠
- 設計：
  - 0404 の B02-03 は処理フローで100件ごとの変更反映とキャッシュクリア、最後の残り反映を要求している: `hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1163-1168`
  - 0404 の B02-03 は排他制御・トランザクションでも100件ごとに変更を反映しキャッシュをクリアしてメモリ管理するとしている: `hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1199-1201`
- ec-cube-enterprise：
  - enterprise は全体トランザクションで foreach 更新し、最後に一度だけ commit する: `ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateStockUpAction.php:34-49`
  - enterprise の Repository は DELETE と各行 executeUpdate を行うが、100件単位の flush/clear/cache clear は持たない: `ec-cube-enterprise/src/Eccube/Repository/DtbStockUpQuantityRepository.php:195-249`
- ベース実装：
  - pf-eccube3 は100件ごとに flush と EntityManagerUtil::clearCache を実行し、最後にも flush する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Product/UpdateProductSummaryForStockUp.php:28-41`
  - pf-eccube3 は ProductBatch から updateProductSummaryForStockUp を実行する: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:12-20`

# 確認メモ
- 確認コマンド: `rg -n "100件|キャッシュ|clearCache|flush|commit|beginTransaction|rollback|反映|updateProductSummaryForStockUp|BatchAggregateStockUpAction|clearStockUpQuantityForAggregate|updateStockUpQuantityColumns" excel_to_html/output/0404_基本設計仕様書\(バッチ_商品管理\).html excel_to_html/output/0402_基本設計仕様書\(バッチ_在庫管理\).html ../pf-eccube3/app/Plugin/HareruyaEc/Service/Product/UpdateProductSummaryForStockUp.php ../pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php ../ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateStockUpAction.php ../ec-cube-enterprise/src/Eccube/Command/AggregateStockUpCommand.php`
- 確認コマンド: `rg -n "function (clearStockUpQuantityForAggregate|getStockUpForAggregate|updateStockUpQuantityColumns)|clear\(|flush\(|commit\(|beginTransaction|persist\(|executeStatement|transaction|EntityManager" ../ec-cube-enterprise/src/Eccube/Repository/DtbStockUpQuantityRepository.php ../ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateStockUpAction.php ../ec-cube-enterprise/src/Eccube/Command/AggregateStockUpCommand.php`
- 確認コマンド: `rg -n "updateProductSummaryForStockUp|clearCache|flush\(|EntityManagerUtil|100|BatchAggregateStockUpAction|DtbStockUpQuantityRepository" ../pf-eccube3/app/Plugin/HareruyaEc ../ec-cube-enterprise/src/Eccube/Service/Product ../ec-cube-enterprise/src/Eccube/Repository ../ec-cube-enterprise/src/Eccube/Command`
- 0402 にも同じ100件ごとの反映・キャッシュクリア要求があるが、本件は 0404 の finding を代表にし、0402 は補助設計根拠として扱う。
- 同じ B02-03 にはコマンド名や開始・完了出力など別差分もあるが、本件は100件ごとの反映境界とキャッシュクリアだけを対象とする。
- 途中失敗時の反映済み行のみ残る要求とは同じトランザクション境界に起因するため、別途起票時は関連付ける。

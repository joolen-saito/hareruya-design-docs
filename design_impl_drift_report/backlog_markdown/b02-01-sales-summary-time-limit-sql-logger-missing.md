/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ商品管理
機能：期間別販売数集計
課題カテゴリ：実装漏れ
課題：期間別販売数集計バッチでSQLロガー無効化が行われない
設計書：0404_基本設計仕様書(バッチ_商品管理).xlsx

# 再現手順【必須】
1. ec-cube-enterprise の期間別販売数集計バッチ実行経路として AggregateSalesCommand::execute() から BatchAggregateSalesAction::handle() を確認する
2. 同実行経路で SQLLogger を null にする処理が呼ばれているか確認する
3. pf-eccube3 の UpdateProductSummary::execute() と照合し、設計フロー1番目の処理が移行先で実装されているか確認する

# 期待される挙動【必須】
- 期間別販売数集計バッチの開始時に Doctrine SQLロガーを無効化する
- 長時間・大量更新に備えたSQLログ抑制をB02-01の実行経路内で行う

# 現在の挙動【必須】
- ec-cube-enterprise では、`bin/console` 共通処理で `set_time_limit(0)` は実行される。一方、B02-01 の入口である `AggregateSalesCommand::execute()` は `BatchAggregateSalesAction::handle()` を呼ぶだけで、SQLロガー無効化を行っていない。`BatchAggregateSalesAction::handle()` 側も、明示トランザクション、集計行削除、集計、更新、commit/rollback のみで、SQLロガー無効化はない。

ec-cube-enterprise bin/console 共通処理では set_time_limit(0) が実行される: `ec-cube-enterprise/bin/console:10-11`
```php
umask(0000);
set_time_limit(0);
```

ec-cube-enterprise AggregateSalesCommand は BatchAggregateSalesAction::handle を呼ぶのみ: `ec-cube-enterprise/src/Eccube/Command/AggregateSalesCommand.php:43-58`
```php
    #[\Override]
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        try {
            $this->batchAggregateSalesAction->handle();
        } catch (\Exception $e) {
            $io->error('集計処理でエラーが発生しました: '.$e->getMessage());

            return Command::FAILURE;
        }

        $io->success('期間別販売数集計が完了しました。');

        return Command::SUCCESS;
```

ec-cube-enterprise BatchAggregateSalesAction には SQLロガー無効化がない: `ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateSalesAction.php:37-55`
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

ec-cube-enterprise の setSQLLogger は人気商品リコメンド更新用でB02-01から呼ばれない: `ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:305-315`
```php
    /**
     * 人気商品リコメンド更新
     */
    public function updateRecommend(): void
    {
        set_time_limit(0);
        ini_set('memory_limit', '-1');

        /** @var EntityManagerInterface $em */
        $em = $this->getEntityManager();
        $em->getConnection()->getConfiguration()->setSQLLogger(null);
```
- ベース実装(pf-eccube3)では、`UpdateProductSummary::execute()` の開始時に `set_time_limit(0)` と `$this->app['orm.em']->getConnection()->getConfiguration()->setSQLLogger(null)` を実行してから、期間別販売数の集計・更新に進む。今回の差分は、このうちSQLロガー無効化がec-cube-enterpriseのB02-01実行経路にない点である。

ベース実装 pf-eccube3 UpdateProductSummary は開始時に実行時間制限解除とSQLロガー無効化を行う: `pf-eccube3/app/Plugin/HareruyaEc/Service/Product/UpdateProductSummary.php:30-34`
```php
    public function execute()
    {
        set_time_limit(0);
        $this->app['orm.em']->getConnection()->getConfiguration()->setSQLLogger(null);
        $orderDetails = $this->app['hareruya_ec.repository.order_detail']->getSaleForUpdateSummary($this->app);
```

# 根拠
- 設計：
  - 設計HTMLはB02-01の処理フロー1番目でSQLロガー無効化を要求する: `hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:925-927`
- ec-cube-enterprise：
  - enterprise は bin/console 共通処理で set_time_limit(0) を実行しているため、実行時間制限解除は差分対象から外す: `ec-cube-enterprise/bin/console:10-11`
  - enterprise のB02-01コマンドは action を呼ぶのみで、SQLロガー無効化を行わない: `ec-cube-enterprise/src/Eccube/Command/AggregateSalesCommand.php:43-58`
  - enterprise のB02-01本体にも setSQLLogger はない: `ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateSalesAction.php:37-55`
- ベース実装：
  - pf-eccube3 はB02-01相当処理の開始時に SQLロガー無効化を行う: `pf-eccube3/app/Plugin/HareruyaEc/Service/Product/UpdateProductSummary.php:30-34`

# 確認メモ
- 確認コマンド: `rg -n "実行時間制限|SQLロガー|set_time_limit|setSQLLogger" excel_to_html/output/0404_基本設計仕様書\(バッチ_商品管理\).html design_impl_drift_report/findings/b02-01_0404_sheet-3_sheet.json`
- 確認コマンド: `rg -n "set_time_limit|setSQLLogger|getSaleForUpdateSummary|updateProductSummary" ../pf-eccube3/app/Plugin/HareruyaEc/Service/Product/UpdateProductSummary.php`
- 確認コマンド: `rg -n "set_time_limit|memory_limit|setSQLLogger|SQLLogger|BatchAggregateSalesAction|updateRecommend" ../ec-cube-enterprise/src/Eccube/Command/AggregateSalesCommand.php ../ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateSalesAction.php ../ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php`
- enterprise の `bin/console` 共通処理に `set_time_limit(0)` があるため、実行時間制限解除は差分対象から除外した。
- enterprise に `setSQLLogger(null)` は存在するが、`DtbSalesQuantityRepository::updateRecommend()` 用であり、B02-01の `BatchAggregateSalesAction::handle()` から呼ばれていない。
- B02-01実行経路の `AggregateSalesCommand::execute()` と `BatchAggregateSalesAction::handle()` には、SQLロガー無効化が存在しない。

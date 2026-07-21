/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ在庫管理
機能：期間別入庫数集計バッチ
課題カテゴリ：実装違い
課題：期間別入庫数集計バッチの開始・完了コンソール出力が設計と異なる
設計書：0402_基本設計仕様書(バッチ_在庫管理).xlsx

# 再現手順【必須】
1. ec-cube-enterprise のローカル環境で `bin/console eccube:aggregate-stock-up` を実行する
2. 処理開始前に日時付きの開始メッセージがコンソール出力されるか確認する
3. 処理完了時に日時付きの完了メッセージがコンソール出力されるか確認する
4. 0402 の B02-03 設計「開始・完了のコンソール出力（日時付き）」と、ec-cube-enterprise の `AggregateStockUpCommand` を照合する

# 期待される挙動【必須】
- 開始時に日時付きのコンソール出力を行う
- 完了時に日時付きのコンソール出力を行う
- ベース実装と同様に、バッチ名を含む開始・完了メッセージを日時プレフィックス付きで出力する

# 現在の挙動【必須】
- ec-cube-enterprise の `AggregateStockUpCommand::execute()` は、`SymfonyStyle` 生成後すぐに `BatchAggregateStockUpAction::handle()` を実行しており、処理前の開始出力がない。成功時の出力は `期間別入庫数集計が完了しました。` のみで、日時も出力されない。

ec-cube-enterprise AggregateStockUpCommand は開始出力なしで action を実行し、日時なしの完了メッセージを出す: `ec-cube-enterprise/src/Eccube/Command/AggregateStockUpCommand.php:43-58`
```php
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        try {
            $this->batchAggregateStockUpAction->handle();
        } catch (\Exception $e) {
            $io->error('集計処理でエラーが発生しました: '.$e->getMessage());

            return Command::FAILURE;
        }

        $io->success('期間別入庫数集計が完了しました。');

        return Command::SUCCESS;
    }
```
- ベース実装(pf-eccube3)では、`ProductBatch` が `updateProductSummaryForStockUp` を `UpdateProductSummaryForStockUp` に対応させ、`date('Y/m/d H:i')` で作成した日時プレフィックス付きで `updateProductSummaryForStockUp: Command start.` と `updateProductSummaryForStockUp: Command complete.` を出力する。

ベース実装 pf-eccube3 ProductBatch は updateProductSummaryForStockUp を対象サービスに対応させる: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:12-20`
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

ベース実装 pf-eccube3 ProductBatch は日時付きで開始・完了を出力する: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:43-58`
```php
        $name = $input->getArgument('batch_name');
        $batchNames = self::BATCH_NAMES;
        $resultMessage = '[' . date('Y/m/d H:i') . '] ';

        if (!isset($batchNames[$name])) {
            echo $resultMessage . " Nothing args or command.\n";

            return 1;
        }

        $product = new $batchNames[$name]($app, $this->createOptions($input));
        echo $resultMessage . "{$name}: Command start.\n";
        $product->execute();
        echo $product->getErrorMassage() ?? $resultMessage . "{$name}: Command complete.\n";

        return 0;
```

ベース実装 pf-eccube3 UpdateProductSummaryForStockUp は B02-03 の処理本体である: `pf-eccube3/app/Plugin/HareruyaEc/Service/Product/UpdateProductSummaryForStockUp.php:8-41`
```php
class UpdateProductSummaryForStockUp extends ProductBatchService
{
    protected $commandName = 'updateProductSummaryForStockUp';
    protected $app;
    protected $options = [];

    /**
     * Constructor
     * @param Eccube\Application $app
     * @param array $options
     */
    function __construct(Application $app, $options = [])
    {
        $this->app = $app;
        $this->options = $options;
    }

    /**
     * storage stock
     */
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

# 根拠
- 設計：
  - 0402 の B02-03 はログ・監査として開始・完了のコンソール出力を日時付きで行うとしている: `hareruya-design-docs/excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html:1205-1238`
  - 0404 の B02-03 にも同じ開始・完了の日時付きコンソール出力要求があるため、同一修正対象の重複候補として扱う: `hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1163-1196`
- ec-cube-enterprise：
  - enterprise は開始出力を持たず、完了出力にも日時を含めない: `ec-cube-enterprise/src/Eccube/Command/AggregateStockUpCommand.php:43-58`
- ベース実装：
  - pf-eccube3 は ProductBatch で日時プレフィックスを作り、開始・完了を出力する: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:12-58`
  - pf-eccube3 の updateProductSummaryForStockUp は ProductBatch 経由で実行される処理本体である: `pf-eccube3/app/Plugin/HareruyaEc/Service/Product/UpdateProductSummaryForStockUp.php:8-41`

# 確認メモ
- 確認コマンド: `rg -n "開始・完了|日時付き|コンソール出力|Command start|Command complete|期間別入庫数集計が完了|開始|完了" excel_to_html/output/0402_基本設計仕様書\(バッチ_在庫管理\).html excel_to_html/output/0404_基本設計仕様書\(バッチ_商品管理\).html design_impl_drift_report/findings/b02-03_0402_sheet-5_sheet.json design_impl_drift_report/findings/b02-03_0404_sheet-5_sheet.json`
- 確認コマンド: `rg -n "開始|完了|日時|date\(|DateTime|Command start|Command complete|期間別入庫数集計が完了|success\(|writeln|aggregate-stock-up|updateProductSummaryForStockUp" ../ec-cube-enterprise/src/Eccube/Command/AggregateStockUpCommand.php ../ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateStockUpAction.php ../pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php ../pf-eccube3/app/Plugin/HareruyaEc/Service/Product/UpdateProductSummaryForStockUp.php`
- 確認コマンド: `rg -n "AggregateStockUpCommand|BatchAggregateStockUpAction|aggregate-stock-up|期間別入庫数集計.*開始|開始.*期間別入庫数集計|Command start|Command complete|DateTime|date\(|success\(" ../ec-cube-enterprise/src/Eccube/Command ../ec-cube-enterprise/src/Eccube/Service/Product ../ec-cube-enterprise/app`
- 確認コマンド: `rg -n "updateProductSummaryForStockUp|product:batch|ProductBatch|Command start|Command complete|date\(" ../pf-eccube3/app/Plugin/HareruyaEc/Command ../pf-eccube3/app/Plugin/HareruyaEc/Service/Product`
- 0402 と 0404 の B02-03 に同じ開始・完了日時付きコンソール出力要求があるため、本件では 0402 の finding を代表にし、0404 側の同一要求は重複候補として統合する。
- 同じ B02-03 にはコマンド名や100件単位反映など別差分もあるが、本件は開始・完了日時付き出力だけを対象とする。

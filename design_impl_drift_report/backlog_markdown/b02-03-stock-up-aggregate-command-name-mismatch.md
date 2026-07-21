/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ商品管理
機能：期間別入庫数集計
課題カテゴリ：実装違い
課題：期間別入庫数集計バッチの実行コマンド名が設計・ベース実装と異なる
設計書：0404_基本設計仕様書(バッチ_商品管理).xlsx

# 再現手順【必須】
1. ec-cube-enterprise のローカル環境で、設計書に記載された `bin/console product:batch updateProductSummaryForStockUp` を実行できるか確認する
2. ec-cube-enterprise の実装済みコマンド一覧または `AggregateStockUpCommand` を確認し、B02-03 の実行コマンド名を確認する
3. ベース実装(pf-eccube3)の `ProductBatch` と `CommandRegister` を確認し、`product:batch updateProductSummaryForStockUp` が現行の実行入口であることを確認する
4. 0404 の B02-03 設計「コンソールのバッチコマンド product:batch updateProductSummaryForStockUp」と照合する

# 期待される挙動【必須】
- コンソールのバッチコマンドは `product:batch updateProductSummaryForStockUp` で実行できる
- コマンド名が一致しない場合は処理を行わずに終了する
- ベース実装と同じ外部実行契約で B02-03 の期間別入庫数集計を起動できる

# 現在の挙動【必須】
- ec-cube-enterprise の B02-03 は `AggregateStockUpCommand` として実装され、コマンド名は `eccube:aggregate-stock-up` である。設計・ベース実装の `product:batch updateProductSummaryForStockUp` では登録されていない。

ec-cube-enterprise AggregateStockUpCommand は eccube:aggregate-stock-up として登録されている: `ec-cube-enterprise/src/Eccube/Command/AggregateStockUpCommand.php:30-35`
```php
 * 【使い方】
 *
 *   bin/console eccube:aggregate-stock-up
 */
#[AsCommand(name: 'eccube:aggregate-stock-up', description: '期間別入庫数集計バッチ')]
class AggregateStockUpCommand extends Command
```

ec-cube-enterprise AggregateStockUpCommand は登録されたコマンドで集計処理を実行する: `ec-cube-enterprise/src/Eccube/Command/AggregateStockUpCommand.php:43-58`
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
- ベース実装(pf-eccube3)では `CommandRegister` が `ProductBatch` を console に登録し、`ProductBatch::configure()` がコマンド名 `product:batch` と任意引数 `batch_name` を定義する。`BATCH_NAMES` では `updateProductSummaryForStockUp` が `UpdateProductSummaryForStockUp` に対応しているため、現行の実行入口は `product:batch updateProductSummaryForStockUp` である。

ベース実装 pf-eccube3 CommandRegister は ProductBatch を console に登録する: `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/CommandRegister.php:15-24`
```php
    public function register(BaseApplication $app)
    {
        //コマンドライン以外STOPする
        if (!isset($app['console'])) {
            return;
        }

        foreach ($this->getCommands() as $command) {
            $app['console']->add($command);
        }
```

ベース実装 pf-eccube3 CommandRegister の登録コマンド一覧に ProductBatch がある: `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/CommandRegister.php:35-48`
```php
    private function getCommands()
    {
        return [
            new Command\EventEntryBatch(),
            new Command\ListTextBatch(),
            new Command\CleaningBatch(),
            new Command\CustomerBatch(),
            new Command\ProductBatch(),
            new Command\OrderBatch(),
            new Command\OtcBuyOrderBatch(),
            new Command\SmaregiBatch(),
            new Command\BranchUpdateBatch(),
            new Command\UnisearchBatch(),
        ];
```

ベース実装 pf-eccube3 ProductBatch は product:batch として登録される: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:28-36`
```php
    protected function configure()
    {
        $this->setName('product:batch')
            ->setDescription('product batchs')
            ->addArgument('batch_name', InputArgument::OPTIONAL);

        foreach (range(1, self::LAST_ARG) as $num) {
            $this->addArgument("arg-{$num}", InputArgument::OPTIONAL);
        }
```

ベース実装 pf-eccube3 ProductBatch は updateProductSummaryForStockUp を処理本体へ対応させる: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:12-20`
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

ベース実装 pf-eccube3 ProductBatch は batch_name 引数に対応する処理を実行する: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:43-58`
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

# 根拠
- 設計：
  - 0404 の B02-03 は実行方法を product:batch updateProductSummaryForStockUp とし、コマンド名が一致しない場合は処理しないとしている: `hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1085-1167`
  - 0402 の B02-03 にも同じ product:batch updateProductSummaryForStockUp の入口要求がある: `hareruya-design-docs/excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html:1180-1209`
- ec-cube-enterprise：
  - enterprise は B02-03 を eccube:aggregate-stock-up として登録している: `ec-cube-enterprise/src/Eccube/Command/AggregateStockUpCommand.php:30-35`
- ベース実装：
  - pf-eccube3 は ProductBatch を console に登録し、product:batch の batch_name で updateProductSummaryForStockUp を実行する: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:12-58`
  - CommandRegister は ProductBatch を console に追加する: `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/CommandRegister.php:15-48`

# 確認メモ
- 確認コマンド: `rg -n "product:batch updateProductSummaryForStockUp|updateProductSummaryForStockUp|eccube:aggregate-stock-up|AggregateStockUpCommand|aggregate-stock-up" excel_to_html/output/0404_基本設計仕様書\(バッチ_商品管理\).html excel_to_html/output/0402_基本設計仕様書\(バッチ_在庫管理\).html ../ec-cube-enterprise/src/Eccube ../ec-cube-enterprise/app ../pf-eccube3/app/Plugin/HareruyaEc`
- 確認コマンド: `rg -n "ProductBatch|product:batch|CommandRegister|add\(new .*Batch|console" ../pf-eccube3/app/Plugin/HareruyaEc ../pf-eccube3/src ../pf-eccube3/app/config`
- 確認コマンド: `rg -n "product:batch|updateProductSummaryForStockUp|aggregate-stock-up|AggregateStockUpCommand" ../ec-cube-enterprise/src/Eccube/Command ../ec-cube-enterprise/src/Eccube/Service/Product ../ec-cube-enterprise/app ../pf-eccube3/app/Plugin/HareruyaEc/Command ../pf-eccube3/app/Plugin/HareruyaEc/Service/Product`
- 0402 にも同じ入口要求があるが、本件は 0404 の finding を代表にし、0402 は補助設計根拠として併記する。
- 同じ B02-03 には開始・完了出力や100件単位反映など別差分もあるが、本件は外部実行コマンド名だけを対象とする。

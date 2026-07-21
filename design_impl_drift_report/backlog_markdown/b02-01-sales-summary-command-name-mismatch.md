/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ商品管理
機能：期間別販売数集計
課題カテゴリ：実装違い
課題：期間別販売数集計バッチの実行コマンド名が設計と異なる
設計書：0404_基本設計仕様書(バッチ_商品管理).xlsx

# 再現手順【必須】
1. ec-cube-enterprise のコンテナまたはローカル環境で bin/console product:batch updateProductSummary を実行する
2. 同じ環境で bin/console eccube:aggregate-sales を実行し、登録済みコマンド名を確認する
3. 設計書の B02-01 期間別販売数集計で指定されている実行方法と、ec-cube-enterprise の Symfony Console コマンド定義を照合する

# 期待される挙動【必須】
- 期間別販売数集計バッチは bin/console product:batch updateProductSummary で実行できる
- コマンド名または batch_name が一致しない場合は処理を行わず終了する
- ベース実装と同様に product:batch コマンドから updateProductSummary の処理へ分岐する

# 現在の挙動【必須】
- ec-cube-enterprise では、期間別販売数集計バッチの Symfony Console コマンド名が `eccube:aggregate-sales` として登録されている。`AggregateSalesCommand` のコメント上の使い方も `bin/console eccube:aggregate-sales` であり、設計が指定する `product:batch updateProductSummary` の入口ではない。

ec-cube-enterprise AggregateSalesCommand は eccube:aggregate-sales を登録している: `ec-cube-enterprise/src/Eccube/Command/AggregateSalesCommand.php:25-35`
```php
/**
 * 期間別販売数集計バッチ（B02-01）
 *
 * 商品規格・店舗ごとに期間別の販売数を集計し、dtb_sales_quantity を更新する。
 * 現在は EC 受注のみ対象。スマレジ実店舗販売は未実装のため除外される。
 *
 * 【使い方】
 *
 *   bin/console eccube:aggregate-sales
 */
#[AsCommand(name: 'eccube:aggregate-sales', description: '期間別販売数集計バッチ')]
```

ec-cube-enterprise AggregateSalesCommand は BatchAggregateSalesAction::handle を実行する: `ec-cube-enterprise/src/Eccube/Command/AggregateSalesCommand.php:43-58`
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
- ベース実装(pf-eccube3)では、`ProductBatch` が `product:batch` をコンソールコマンドとして登録し、第一引数 `updateProductSummary` を `Plugin\HareruyaEc\Service\Product\UpdateProductSummary` に対応させている。第一引数が未登録なら `Nothing args or command.` を出して処理せず return 1 となるため、設計の「コマンド名が一致しない場合は処理を行わずに終了」の根拠にもなっている。

ベース実装 pf-eccube3 ProductBatch は updateProductSummary をバッチ名として定義する: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:12-15`
```php
    const BATCH_NAMES = [
        'displayReleasedProduct' => 'Plugin\HareruyaEc\Service\Product\DisplayReleasedProduct',
        'updateProductSummary' => 'Plugin\HareruyaEc\Service\Product\UpdateProductSummary',
        'attachCategory' => 'Plugin\HareruyaEc\Service\Product\AttachCategory',
```

ベース実装 pf-eccube3 ProductBatch は product:batch コマンドを登録する: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:28-32`
```php
    protected function configure()
    {
        $this->setName('product:batch')
            ->setDescription('product batchs')
            ->addArgument('batch_name', InputArgument::OPTIONAL);
```

ベース実装 pf-eccube3 ProductBatch は未登録名なら処理せず終了し、登録名なら対象サービスを実行する: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:43-58`
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

ベース実装 pf-eccube3 CommandRegister は ProductBatch を console に追加する: `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/CommandRegister.php:35-43`
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
```

# 根拠
- 設計：
  - 設計HTMLはB02-01の機能名を期間別販売数集計とし、商品管理バッチ機能として定義する: `hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:848-857`
  - 詳細設計は利用者視点の入口を product:batch updateProductSummary とし、不一致時は処理せず終了すると明記する: `hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:921-927`
- ec-cube-enterprise：
  - enterprise の登録コマンド名は eccube:aggregate-sales で、設計の product:batch updateProductSummary ではない: `ec-cube-enterprise/src/Eccube/Command/AggregateSalesCommand.php:31-35`
- ベース実装：
  - pf-eccube3 は product:batch コマンドと updateProductSummary バッチ名の組み合わせで期間別販売数集計を起動する: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:12-32`
  - pf-eccube3 は ProductBatch を console に登録する: `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/CommandRegister.php:35-43`

# 確認メモ
- 確認コマンド: `rg -n "B02-01|期間別販売数集計|product:batch updateProductSummary|コマンド名が一致しない" excel_to_html/output/0404_基本設計仕様書\(バッチ_商品管理\).html design_impl_drift_report/findings/b02-01_0404_sheet-3_sheet.json`
- 確認コマンド: `rg -n "updateProductSummary|product:batch|ProductBatch|CommandRegister" ../pf-eccube3/app/Plugin/HareruyaEc/Command ../pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider`
- 確認コマンド: `rg -n "product:batch|updateProductSummary|aggregate-sales|AggregateSales|期間別販売数集計|BatchAggregateSales" ../ec-cube-enterprise/src ../ec-cube-enterprise/app`
- 設計HTMLの詳細設計は、B02-01のコンソール入口を `product:batch updateProductSummary` としている。
- pf-eccube3 では `ProductBatch::configure()` が `product:batch` を登録し、`BATCH_NAMES['updateProductSummary']` で販売数集計サービスへ分岐する。
- ec-cube-enterprise では `AggregateSalesCommand` の `AsCommand` 名が `eccube:aggregate-sales` であり、検索範囲内に `product:batch updateProductSummary` の互換入口は確認できなかった。

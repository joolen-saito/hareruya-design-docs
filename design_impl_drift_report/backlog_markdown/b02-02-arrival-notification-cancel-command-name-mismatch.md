/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ商品管理
機能：入荷通知キャンセル
課題カテゴリ：実装違い
課題：入荷通知キャンセルバッチの実行コマンド名が設計と異なる
設計書：0404_基本設計仕様書(バッチ_商品管理).xlsx

# 再現手順【必須】
1. ec-cube-enterprise のコンテナまたはローカル環境で bin/console product:batch deleteProductRequest を実行する
2. 同じ環境で bin/console eccube:cancel-product-request を実行し、登録済みコマンド名を確認する
3. 設計書の B02-02 入荷通知キャンセルで指定されている実行方法と、ec-cube-enterprise の Symfony Console コマンド定義を照合する

# 期待される挙動【必須】
- 入荷通知キャンセルバッチは bin/console product:batch deleteProductRequest で実行できる
- コマンド名または batch_name が一致しない場合は処理を行わず終了する
- ベース実装と同様に product:batch コマンドから deleteProductRequest の処理へ分岐する

# 現在の挙動【必須】
- ec-cube-enterprise では、入荷通知キャンセルバッチの Symfony Console コマンド名が `eccube:cancel-product-request` として登録されている。`CancelProductRequestCommand` のコメント上の使い方も `bin/console eccube:cancel-product-request` であり、設計が指定する `product:batch deleteProductRequest` の入口ではない。

ec-cube-enterprise CancelProductRequestCommand は eccube:cancel-product-request を登録している: `ec-cube-enterprise/src/Eccube/Command/CancelProductRequestCommand.php:25-35`
```php
/**
 * 入荷通知キャンセルバッチ（B02-02）
 *
 * 商品・商品規格の公開ステータスが非公開・廃止の入荷通知リクエストを論理削除する。
 *
 * 【使い方】
 *
 *   bin/console eccube:cancel-product-request
 */
#[AsCommand(name: 'eccube:cancel-product-request', description: '入荷通知キャンセルバッチ')]
class CancelProductRequestCommand extends Command
```

ec-cube-enterprise CancelProductRequestCommand は BatchCancelProductRequestAction::handle を実行する: `ec-cube-enterprise/src/Eccube/Command/CancelProductRequestCommand.php:43-58`
```php
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        try {
            $count = $this->batchCancelProductRequestAction->handle();
        } catch (\Exception $e) {
            $io->error('入荷通知キャンセル処理でエラーが発生しました: '.$e->getMessage());

            return Command::FAILURE;
        }

        $io->success(sprintf('入荷通知キャンセルが完了しました。（%d件）', $count));

        return Command::SUCCESS;
    }
```
- ベース実装(pf-eccube3)では、`ProductBatch` が `product:batch` をコンソールコマンドとして登録し、第一引数 `deleteProductRequest` を `Plugin\HareruyaEc\Service\Product\DeleteProductRequest` に対応させている。第一引数が未登録なら `Nothing args or command.` を出して処理せず return 1 となるため、設計の「コマンド名が一致しない場合は処理を行わずに終了」の根拠にもなっている。

ベース実装 pf-eccube3 ProductBatch は deleteProductRequest をバッチ名として定義する: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:12-16`
```php
    const BATCH_NAMES = [
        'displayReleasedProduct' => 'Plugin\HareruyaEc\Service\Product\DisplayReleasedProduct',
        'updateProductSummary' => 'Plugin\HareruyaEc\Service\Product\UpdateProductSummary',
        'attachCategory' => 'Plugin\HareruyaEc\Service\Product\AttachCategory',
        'deleteProductRequest' => 'Plugin\HareruyaEc\Service\Product\DeleteProductRequest',
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

ベース実装 pf-eccube3 DeleteProductRequest は deleteProductRequest の処理本体である: `pf-eccube3/app/Plugin/HareruyaEc/Service/Product/DeleteProductRequest.php:7-30`
```php
class DeleteProductRequest extends ProductBatchService
{
    protected $commandName = 'deleteProductRequest';
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
     * delete non product requests
     */
    public function execute()
    {
        $this->app['hareruya_ec.repository.product_request']->deleteRequestByNonProduct();
    }
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
  - 設計HTMLはB02-02の機能名を入荷通知キャンセルとし、商品管理バッチ機能として定義する: `hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:967-979`
  - 詳細設計は利用者視点の入口を product:batch deleteProductRequest とし、不一致時は処理せず終了すると明記する: `hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1042-1047`
- ec-cube-enterprise：
  - enterprise の登録コマンド名は eccube:cancel-product-request で、設計の product:batch deleteProductRequest ではない: `ec-cube-enterprise/src/Eccube/Command/CancelProductRequestCommand.php:30-35`
- ベース実装：
  - pf-eccube3 は product:batch コマンドと deleteProductRequest バッチ名の組み合わせで入荷通知キャンセルを起動する: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:12-32`
  - pf-eccube3 は ProductBatch を console に登録する: `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/CommandRegister.php:35-43`

# 確認メモ
- 確認コマンド: `rg -n "B02-02|入荷通知キャンセル|product:batch deleteProductRequest|コマンド名が一致しない" excel_to_html/output/0404_基本設計仕様書\(バッチ_商品管理\).html design_impl_drift_report/findings/b02-02_0404_sheet-4_sheet.json`
- 確認コマンド: `rg -n "product:batch|deleteProductRequest|DeleteProductRequest|ProductBatch|CommandRegister" ../pf-eccube3/app/Plugin/HareruyaEc`
- 確認コマンド: `rg -n "product:batch|deleteProductRequest|cancel-product-request|CancelProductRequestCommand|BatchCancelProductRequestAction" ../ec-cube-enterprise/src ../ec-cube-enterprise/app ../ec-cube-enterprise/bin`
- 設計HTMLの詳細設計は、B02-02のコンソール入口を `product:batch deleteProductRequest` としている。
- pf-eccube3 では `ProductBatch::configure()` が `product:batch` を登録し、`BATCH_NAMES['deleteProductRequest']` で入荷通知キャンセルサービスへ分岐する。
- ec-cube-enterprise では `CancelProductRequestCommand` の `AsCommand` 名が `eccube:cancel-product-request` であり、検索範囲内に `product:batch deleteProductRequest` の互換入口は確認できなかった。

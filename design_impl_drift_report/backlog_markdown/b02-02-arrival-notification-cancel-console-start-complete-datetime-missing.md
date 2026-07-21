/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ商品管理
機能：入荷通知キャンセル
課題カテゴリ：実装違い
課題：入荷通知キャンセルバッチの開始・完了コンソール出力が設計と異なる
設計書：0404_基本設計仕様書(バッチ_商品管理).xlsx

# 再現手順【必須】
1. ec-cube-enterprise のコンテナまたはローカル環境で bin/console eccube:cancel-product-request を実行する
2. 処理開始前に日時付きの開始メッセージが出力されるか確認する
3. 処理完了時に日時付きの完了メッセージが出力されるか確認する
4. 設計書の B02-02 入荷通知キャンセルのログ・監査要件と、ec-cube-enterprise の CancelProductRequestCommand を照合する

# 期待される挙動【必須】
- 開始時に日時付きのコンソール出力を行う
- 完了時に日時付きのコンソール出力を行う
- ベース実装と同様に、バッチ名を含む開始・完了メッセージを日時プレフィックス付きで出力する

# 現在の挙動【必須】
- ec-cube-enterprise の `CancelProductRequestCommand::execute()` は、`SymfonyStyle` 生成後すぐに `BatchCancelProductRequestAction::handle()` を実行しており、処理前の開始出力がない。成功時の出力は `入荷通知キャンセルが完了しました。（%d件）` のみで、日時も出力されない。例外時のエラー出力は存在するため、この課題は開始出力と日時付き完了出力の不足に限定する。

ec-cube-enterprise CancelProductRequestCommand は開始出力なしで action を実行し、日時なしの完了メッセージを出す: `ec-cube-enterprise/src/Eccube/Command/CancelProductRequestCommand.php:42-58`
```php
    #[\Override]
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
- ベース実装(pf-eccube3)では、`ProductBatch` が `date('Y/m/d H:i')` を使って日時プレフィックスを作成し、`deleteProductRequest: Command start.` と `deleteProductRequest: Command complete.` を出力する。`DeleteProductRequest` はこの `ProductBatch` 経由で実行されるため、B02-02でも日時付きの開始・完了出力が行われる。

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

ベース実装 pf-eccube3 ProductBatch は deleteProductRequest を対象サービスに対応させる: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:12-16`
```php
    const BATCH_NAMES = [
        'displayReleasedProduct' => 'Plugin\HareruyaEc\Service\Product\DisplayReleasedProduct',
        'updateProductSummary' => 'Plugin\HareruyaEc\Service\Product\UpdateProductSummary',
        'attachCategory' => 'Plugin\HareruyaEc\Service\Product\AttachCategory',
        'deleteProductRequest' => 'Plugin\HareruyaEc\Service\Product\DeleteProductRequest',
```

ベース実装 pf-eccube3 DeleteProductRequest は B02-02 の処理本体である: `pf-eccube3/app/Plugin/HareruyaEc/Service/Product/DeleteProductRequest.php:24-30`
```php
    /**
     * delete non product requests
     */
    public function execute()
    {
        $this->app['hareruya_ec.repository.product_request']->deleteRequestByNonProduct();
    }
```

# 根拠
- 設計：
  - 設計HTMLはログ・監査として開始・完了のコンソール出力を日時付きで行うとしている: `hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1070-1073`
- ec-cube-enterprise：
  - enterprise は開始出力を持たず、完了出力にも日時を含めない: `ec-cube-enterprise/src/Eccube/Command/CancelProductRequestCommand.php:42-58`
- ベース実装：
  - pf-eccube3 は ProductBatch で日時プレフィックスを作り、開始・完了を出力する: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:43-58`
  - pf-eccube3 は deleteProductRequest を ProductBatch の対象バッチとして定義する: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:12-16`

# 確認メモ
- 確認コマンド: `rg -n "開始|完了|日時|Command start|Command complete|Nothing args|入荷通知キャンセルが完了|DateTime|date\(" excel_to_html/output/0404_基本設計仕様書\(バッチ_商品管理\).html ../pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php ../pf-eccube3/app/Plugin/HareruyaEc/Service/Product/DeleteProductRequest.php ../ec-cube-enterprise/src/Eccube/Command/CancelProductRequestCommand.php ../ec-cube-enterprise/src/Eccube/Service/Product/BatchCancelProductRequestAction.php`
- 確認コマンド: `rg -n "CancelProductRequestCommand|BatchCancelProductRequestAction|cancel-product-request|入荷通知キャンセル.*開始|開始.*入荷通知キャンセル|Command start|Command complete|DateTime|date\(|success\(" ../ec-cube-enterprise/src/Eccube/Command ../ec-cube-enterprise/src/Eccube/Service/Product ../ec-cube-enterprise/app`
- 確認コマンド: `rg -n "deleteProductRequest|product:batch|ProductBatch|Command start|Command complete|date\(" ../pf-eccube3/app/Plugin/HareruyaEc/Command ../pf-eccube3/app/Plugin/HareruyaEc/Service/Product`
- 設計HTMLは B02-02 のログ・監査で開始・完了のコンソール出力を日時付きと指定している。
- pf-eccube3 は ProductBatch の共通処理で日時プレフィックス付きの start/complete を出力する。
- ec-cube-enterprise の CancelProductRequestCommand は開始出力を行わず、完了出力にも日時を含めない。

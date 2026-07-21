/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ店頭買取管理
機能：買取自動入庫バッチ
課題カテゴリ：実装漏れ
課題：買取自動入庫時に dtb_product_class.stock が更新されない
設計書：0406_基本設計仕様書(バッチ_店頭買取管理).xlsx

# 再現手順【必須】
1. 設計書 B06-01 の実行結果詳細とリニューアル移行時の扱いで、在庫数更新対象が `dtb_product_class.stock` と `dtb_product_stock.stock` の両方であることを確認する
2. ec-cube-enterprise で `bin/console eccube:buy-order:auto-stock` の実行経路を確認し、店頭買取・ネット買取の入庫処理が `ProductStockEntityManager::save()` に到達することを確認する
3. 自動入庫経路の `OtcBuyOrderStockInbound`、`BuyOrderStockInbound`、`ProductStockEntityManager`、周辺Repository/Listenerを検索し、`ProductClass->setStock(...)` または `UPDATE dtb_product_class SET stock ...` があるか確認する
4. 補助根拠として、標準EC-CUBEの在庫更新処理では `ProductStock->setStock(...)` と `ProductClass->setStock(...)` の両方を更新していることを確認する

# 期待される挙動【必須】
- 店頭買取の自動入庫では、買取店舗のECCUBE在庫に実在庫を登録し、総在庫・総原価・原価単価を更新する
- ネット買取の自動入庫では、本店のECCUBE在庫に実在庫を登録し、総在庫・総原価・原価単価を更新する
- 在庫数は `dtb_product_stock.stock` だけでなく `dtb_product_class.stock` も更新する

# 現在の挙動【必須】
- ec-cube-enterprise の買取自動入庫コマンドは店頭買取・ネット買取の各Actionを実行し、それぞれ `ProductStockEntityManager::save()` で `ProductStock` を保存している。しかし保存処理は `ProductStock->setStock($stock)` のみで、`ProductClass->setStock($stock)` または `dtb_product_class.stock` 更新SQLは自動入庫経路に確認できない。

ec-cube-enterprise の買取自動入庫コマンドは店頭・ネットのActionを実行する: `ec-cube-enterprise/src/Eccube/Command/BuyOrderAutoStockCommand.php:36-62`
```php
#[AsCommand(name: 'eccube:buy-order:auto-stock', description: '買取自動入庫バッチ')]
class BuyOrderAutoStockCommand extends Command
{
    public function __construct(
        private readonly OtcBatchAutoStockAction $otcBatchAutoStockAction,
        private readonly NetBatchAutoStockAction $netBatchAutoStockAction,
    ) {
        parent::__construct();
    }

    #[\Override]
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        try {
            $this->otcBatchAutoStockAction->handle();
            $this->netBatchAutoStockAction->handle();
        } catch (\Exception $e) {
            $io->error('入庫処理でエラーが発生しました: '.$e->getMessage());

            return Command::FAILURE;
        }

        $io->success('買取自動入庫が完了しました。');

        return Command::SUCCESS;
```

ec-cube-enterprise の店頭買取入庫は ProductStockEntityManager::save に stock を渡す: `ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/OtcBuyOrderStockInbound.php:50-83`
```php
        foreach ($OtcBuyOrder->getOtcBuyOrderStocks() as $OtcBuyOrderStock) {
            $ProductClass = $OtcBuyOrderStock->getProductClass();
            $stockChangeQuantity = (string) $OtcBuyOrderStock->getQuantity();

            // 買取店舗に対応するProductStockを取得
            $ProductStock = null;
            foreach ($ProductClass->getProductStocks() as $Stock) {
                if ($Stock->getBaseInfo()->getId() === $BaseInfo->getId()) {
                    $ProductStock = $Stock;
                    break;
                }
            }

            $oldStock = $ProductStock?->getStock() ?? '0';
            $unitCostPriceBefore = $ProductStock?->getUnitCost() ?? '0';
            $totalCostPriceBefore = $ProductStock?->getTotalCost() ?? '0';

            $newStock = $ProductStock !== null
                ? $ProductStock->getStockQuantityAfterChange($stockChangeQuantity)
                : $stockChangeQuantity;

            $newTotalCost = $ProductStock !== null
                ? bcadd($ProductStock->getTotalCost(), (string) $OtcBuyOrderStock->getSubtotal())
                : (string) $OtcBuyOrderStock->getSubtotal();

            $SavedProductStock = $this->productStockEntityManager->save(
                ProductStock: $ProductStock,
                ProductClass: $ProductClass,
                BaseInfo: $BaseInfo,
                stock: $newStock,
                pickUpFlg: $ProductStock?->getPickUpFlg() ?? false,
                stockLocationId: $ProductStock?->getStockLocationId() ?? ProductStock::STOCK_LOCATION_ECCUBE,
                totalCost: $newTotalCost,
            );
```

ec-cube-enterprise のネット買取入庫も ProductStockEntityManager::save に stock を渡す: `ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/BuyOrderStockInbound.php:50-83`
```php
        foreach ($BuyOrder->getBuyOrderStocks() as $BuyOrderStock) {
            $ProductClass = $BuyOrderStock->getProductClass();
            $stockChangeQuantity = (string) $BuyOrderStock->getQuantity();

            // ネット買取はメインショップに対応するProductStockを取得
            $ProductStock = null;
            foreach ($ProductClass->getProductStocks() as $Stock) {
                if ($Stock->getBaseInfo()->getId() === $MainBaseInfo->getId()) {
                    $ProductStock = $Stock;
                    break;
                }
            }

            $oldStock = $ProductStock?->getStock() ?? '0';
            $unitCostPriceBefore = $ProductStock?->getUnitCost() ?? '0';
            $totalCostPriceBefore = $ProductStock?->getTotalCost() ?? '0';

            $newStock = $ProductStock !== null
                ? $ProductStock->getStockQuantityAfterChange($stockChangeQuantity)
                : $stockChangeQuantity;

            $newTotalCost = $ProductStock !== null
                ? bcadd($ProductStock->getTotalCost(), (string) $BuyOrderStock->getSubtotal())
                : (string) $BuyOrderStock->getSubtotal();

            $SavedProductStock = $this->productStockEntityManager->save(
                ProductStock: $ProductStock,
                ProductClass: $ProductClass,
                BaseInfo: $MainBaseInfo,
                stock: $newStock,
                pickUpFlg: $ProductStock?->getPickUpFlg() ?? false,
                stockLocationId: $ProductStock?->getStockLocationId() ?? ProductStock::STOCK_LOCATION_ECCUBE,
                totalCost: $newTotalCost,
            );
```

ec-cube-enterprise の ProductStockEntityManager は ProductStock のみ更新する: `ec-cube-enterprise/src/Eccube/Service/EntityManager/ProductStockEntityManager.php:29-52`
```php
    public function save(
        ?ProductStock $ProductStock,
        ProductClass $ProductClass,
        BaseInfo $BaseInfo,
        string $stock,
        bool $pickUpFlg,
        int $stockLocationId,
        string $totalCost,
    ): ProductStock {
        if ($ProductStock === null) {
            $ProductStock = new ProductStock();
        }

        $ProductStock->setProductClass($ProductClass);
        $ProductStock->setBaseInfo($BaseInfo);
        $ProductStock->setStock($stock);
        $ProductStock->setPickUpFlg($pickUpFlg);
        $ProductStock->setStockLocationId($stockLocationId);
        $ProductStock->setTotalCost($totalCost);

        $this->entityManager->persist($ProductStock);

        return $ProductStock;
    }
```
- B06-01は新規機能であり、現行pf-eccube3に同一バッチは存在しない。補助根拠として、標準EC-CUBEの在庫更新処理では `ProductStock` と `ProductClass` の在庫値を同期して更新している。一方、enterpriseの自動入庫経路は設計が明示する `dtb_product_class.stock` への更新を行っていない。

ベース実装 ec-cube の通常在庫減算は ProductStock と ProductClass の両方を更新する: `ec-cube/src/Eccube/Service/PurchaseFlow/Processor/StockReduceProcessor.php:93-100`
```php
                $ProductClass = $item->getProductClass();
                $stock = $callback($productStock->getStock(), $item->getQuantity());
                if ($stock < 0) {
                    throw new ShoppingException(trans('purchase_flow.over_stock', ['%name%' => $ProductClass->formattedProductName()]));
                }
                $productStock->setStock($stock);
                $ProductClass->setStock($stock);
            }
```

ベース実装 ec-cube の在庫差分処理も ProductClass と ProductStock の両方を更新する: `ec-cube/src/Eccube/Service/PurchaseFlow/Processor/StockDiffProcessor.php:160-174`
```php
            $ProductClass = $this->productClassRepository->find($id);
            if ($ProductClass->isStockUnlimited()) {
                continue;
            }

            $stock = $ProductClass->getStock() - $quantity;
            $ProductStock = $ProductClass->getProductStock();
            if (!$ProductStock) {
                $ProductStock = new ProductStock();
                $ProductStock->setProductClass($ProductClass);
                $ProductClass->setProductStock($ProductStock);
            }
            $ProductClass->setStock($stock);
            $ProductStock->setStock($stock);
        }
```

# 根拠
- 設計：
  - B06-01 は店頭買取・ネット買取の実在庫をECCUBE在庫に登録し、総在庫を更新することを要求している: `hareruya-design-docs/excel_to_html/output/0406_基本設計仕様書(バッチ_店頭買取管理) .html:851-889`
  - B06-01 は新規実装で、在庫数更新対象として `dtb_product_class.stock` と `dtb_product_stock.stock` の両方を明示している: `hareruya-design-docs/excel_to_html/output/0406_基本設計仕様書(バッチ_店頭買取管理) .html:919-929`
- ec-cube-enterprise：
  - enterprise の自動入庫入口は店頭・ネット双方のActionを実行する: `ec-cube-enterprise/src/Eccube/Command/BuyOrderAutoStockCommand.php:36-62`
  - enterprise の店頭買取自動入庫は ProductStockEntityManager に在庫値を渡すが ProductClass は更新していない: `ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/OtcBuyOrderStockInbound.php:50-83`
  - enterprise のネット買取自動入庫も ProductStockEntityManager に在庫値を渡すが ProductClass は更新していない: `ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/BuyOrderStockInbound.php:50-83`
  - enterprise の保存処理は ProductStock を persist するだけで ProductClass.stock を設定しない: `ec-cube-enterprise/src/Eccube/Service/EntityManager/ProductStockEntityManager.php:29-52`
- ベース実装：
  - B06-01と同一バッチではないが、標準EC-CUBEの通常在庫更新では ProductStock と ProductClass の在庫値を同期している: `ec-cube/src/Eccube/Service/PurchaseFlow/Processor/StockReduceProcessor.php:93-100`
  - B06-01と同一バッチではないが、標準EC-CUBEの在庫差分処理でも ProductClass と ProductStock を同じ値で更新している: `ec-cube/src/Eccube/Service/PurchaseFlow/Processor/StockDiffProcessor.php:160-174`

# 確認メモ
- 確認コマンド: `rg -n "B06-01|買取自動入庫|dtb_buy_order_stock|dtb_otc_buy_order_stock|dtb_product_class|dtb_product_stock|在庫数" "excel_to_html/output/0406_基本設計仕様書(バッチ_店頭買取管理) .html"`
- 確認コマンド: `rg -n "BuyOrderAutoStock|auto-stock|BatchAutoStock|dtb_buy_order_stock|dtb_otc_buy_order_stock|ProductStockEntityManager|setStock\(|getStock\(|product_class\.stock|dtb_product_class" ../ec-cube-enterprise/src/Eccube ../ec-cube-enterprise/app -g '*.php' -g '*.yaml' -g '*.yml'`
- 確認コマンド: `rg -n "ProductClass->setStock|->setStock\(\$newStock|dtb_product_class SET stock|UPDATE dtb_product_class.*stock|setStock\(\$stock\)" ../ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder ../ec-cube-enterprise/src/Eccube/Service/Admin/Purchase ../ec-cube-enterprise/src/Eccube/Service/EntityManager ../ec-cube-enterprise/src/Eccube/Repository -g '*.php'`
- 確認コマンド: `rg -n "StockReduceProcessor|StockDiffProcessor|ProductClass->setStock|ProductStock->setStock" ../ec-cube/src/Eccube/Service/PurchaseFlow/Processor -g '*.php'`

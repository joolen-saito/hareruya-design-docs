/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ商品管理
機能：お気に入り商品セール通知
課題カテゴリ：実装漏れ
課題：お気に入り商品セール通知で一定件数ごとのメモリ解放を行わず全件を配列に集約している
設計書：0404_基本設計仕様書(バッチ_商品管理).xlsx

# 再現手順【必須】
1. ec-cube-enterprise の `FavoriteSaleNotificationCommand` から呼ばれる `BatchFavoriteSaleNotificationAction::handle()` を確認する
2. `findSaleFavoriteProducts()` の結果取得後、会員ごとの集約処理で一定件数ごとの `clear()` / `detach()` / チャンク分割が行われるか確認する
3. ベース実装(pf-eccube3)の `SaleNotificationService::execute()` を確認し、1000件ごとに EntityManager を clear していることを確認する
4. 0404 の B02-05 設計「一定件数ごとに処理メモリを解放しながら集約する」と照合する

# 期待される挙動【必須】
- セール中のお気に入り商品の情報を会員ごとに集約する際、一定件数ごとに処理メモリを解放する
- 大量件数でもメモリを保持し続けないよう、ベース実装と同等に一定件数ごとの `clear()` などを行う
- 会員ごとに対象商品をまとめたうえで、対象会員へセール通知メールを送信する

# 現在の挙動【必須】
- ec-cube-enterprise では `BatchFavoriteSaleNotificationAction::handle()` が `findSaleFavoriteProducts()` の全結果を `$rows` に取得し、`groupByCustomer($rows)` で全件を `$grouped` 配列に集約してからメール送信している。この処理範囲には一定件数ごとの `clear()` / `detach()` / チャンク分割がない。

ec-cube-enterprise は findSaleFavoriteProducts の全結果を取得してから groupByCustomer に渡す: `ec-cube-enterprise/src/Eccube/Service/Product/BatchFavoriteSaleNotificationAction.php:36-61`
```php
    public function handle(): int
    {
        $rows = $this->customerFavoriteProductRepository->findSaleFavoriteProducts();

        if (empty($rows)) {
            return 0;
        }

        $groupedByCustomer = $this->groupByCustomer($rows);

        $sentCount = 0;
        foreach ($groupedByCustomer as $customerId => $customerData) {
            $Customer = $this->customerRepository->find($customerId);
            if ($Customer === null) {
                continue;
            }

            try {
                $this->mailService->sendFavoriteSaleNotificationMail($Customer, $customerData);
                $sentCount++;
            } catch (\Throwable $e) {
                log_error('お気に入りセール通知メール送信失敗', ['customer_id' => $customerId, 'message' => $e->getMessage()]);
            }
        }

        return $sentCount;
```

ec-cube-enterprise は groupByCustomer で全 rows を grouped 配列へ集約する: `ec-cube-enterprise/src/Eccube/Service/Product/BatchFavoriteSaleNotificationAction.php:64-91`
```php
    /**
     * クエリ結果を会員ごとにまとめる。
     *
     * @param array<int, array{customer_id: int, name01: string, name02: string, email: string, pref_id: int|null, product_name: string, product_name_en: string|null, lang_code: string|null}> $rows
     *
     * @return array<int, array{name01: string, name02: string, products: array<int, array{langCode: string|null, name: string, nameEn: string|null}>}>
     */
    private function groupByCustomer(array $rows): array
    {
        $grouped = [];
        foreach ($rows as $row) {
            $customerId = $row['customer_id'];
            if (!isset($grouped[$customerId])) {
                $grouped[$customerId] = [
                    'name01' => $row['name01'],
                    'name02' => $row['name02'],
                    'products' => [],
                ];
            }
            $grouped[$customerId]['products'][] = [
                'langCode' => $row['lang_code'],
                'name' => $row['product_name'],
                'nameEn' => $row['product_name_en'],
            ];
        }

        return $grouped;
    }
```

ec-cube-enterprise の findSaleFavoriteProducts は getResult で配列を返す: `ec-cube-enterprise/src/Eccube/Repository/CustomerFavoriteProductRepository.php:230-254`
```php
    public function findSaleFavoriteProducts(): array
    {
        return $this->createQueryBuilder('cfp')
            ->select(
                'c.id AS customer_id',
                'c.name01',
                'c.name02',
                'c.email',
                'pref.id AS pref_id',
                'p.name AS product_name',
                'p.name_en AS product_name_en',
                'l.code AS lang_code',
            )
            ->join('cfp.Customer', 'c')
            ->join('cfp.Product', 'p')
            ->join('p.ProductClasses', 'pc')
            ->join('c.Pref', 'pref')
            ->leftJoin('pc.Language', 'l')
            ->where('pc.sale_flg = true')
            ->andWhere('c.Status = :regularStatus')
            ->setParameter('regularStatus', \Eccube\Entity\Master\CustomerStatus::REGULAR)
            ->groupBy('c.id, p.id, l.id, pref.id')
            ->orderBy('c.id', 'ASC')
            ->getQuery()
            ->getResult();
```
- ベース実装(pf-eccube3)では `SaleNotificationService::execute()` がセール中のお気に入り商品を会員ごとにまとめるループ内で件数をカウントし、1000件ごとに `$this->app['orm.em']->clear()` を呼び出している。

ベース実装 pf-eccube3 は findSaleFavoriteProducts を iterate で返す: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbFavoriteProductRepository.php:24-54`
```php
    public function findSaleFavoriteProducts()
    {
        $qb = $this->createQueryBuilder('fp')
            ->select(
                'fp.playerId AS playerId',
                'fp.productId AS productId',
                'p.name AS productName',
                'ps.nameEn As productNameEn',
                'c.name01',
                'c.name02',
                'c.email',
                'pr.id AS prefId',
                'l.code AS langCode',
            )
            ->join('fp.language', 'l')
            ->join('Plugin\HareruyaEc\Entity\Product', 'p', Join::WITH, 'fp.productId = p.id')
            ->join('p.productSub', 'ps')
            ->join('ps.productSubClasses', 'psc', Join::WITH, 'psc.saleFlg = :saleFlg AND psc.languageId = l.id')
            ->join('fp.player', 'pl')
            ->join('pl.customer', 'c')
            ->join('c.Pref', 'pr')
            ->join('pl.customerGroup', 'cg', Join::WITH, 'cg.shopFrontFlg = 0 AND cg.branchShopFrontFlg = 0')
            ->setParameter('saleFlg', DtbProductSubClass::SALE)
            ->groupBy('pl.playerId')
            ->addGroupBy('p.id')
            ->addGroupBy('l.id')
            ->distinct()
            ;

        return $qb->getQuery()->iterate();
    }
```

ベース実装 pf-eccube3 は saleNotification バッチ処理で1000件ごとに EntityManager を clear する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Product/SaleNotificationService.php:27-68`
```php
    public function execute()
    {
        // セール状態のお気に入り商品情報を取得
        $saleFavoriteProducts = $this->app['hareruya_ec.repository.favorite_product']->findSaleFavoriteProducts();
        $customerDataList = [];
        // 各顧客ごとに送り先・セール商品をまとめる
        $i = 0;
        foreach($saleFavoriteProducts as $saleFavoriteProduct) {
            $playerId = $saleFavoriteProduct[$i]['playerId'];
            if (!array_key_exists($playerId, $customerDataList)) {
                $customerDataList[$playerId] = [];
                $customerDataList[$playerId]['name01'] = $saleFavoriteProduct[$i]['name01'];
                $customerDataList[$playerId]['name02'] = $saleFavoriteProduct[$i]['name02'];
                $customerDataList[$playerId]['email'] = $saleFavoriteProduct[$i]['email'];
                $customerDataList[$playerId]['prefId'] = $saleFavoriteProduct[$i]['prefId'];
                $customerDataList[$playerId]['products'] = [];
            }

            $productData = [
                'productId' => $saleFavoriteProduct[$i]['productId'],
                'langCode' => $saleFavoriteProduct[$i]['langCode'],
                'name' => $saleFavoriteProduct[$i]['productName'],
                'nameEn' => $saleFavoriteProduct[$i]['productNameEn']
            ];
            $customerDataList[$playerId]['products'][] = $productData;
            $i++;

            if ($i % 1000 === 0) {
                $this->app['orm.em']->clear();
            }
        }

        $transport = new \Swift_SmtpTransport('localhost', 25);
        $transport->setUsername($this->app['config']['HareruyaEc']['const']['swiftmailer_user']);
        $transport->setPassword('');
        $this->app['mailer'] = new \Swift_Mailer($transport);

        // 各顧客情報ごとに通知メール送信処理
        foreach($customerDataList as $customerData) {
            $this->app['hareruya_ec.service.mail']->sendSaleProductNotification($customerData);
        }
    }
```

ベース実装 pf-eccube3 ProductBatch は saleNotification を処理本体へ対応させる: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:12-56`
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
        'checkNoSectionProduct' => 'Plugin\HareruyaEc\Service\Product\CheckNoSectionProduct',
        'saleNotification' => 'Plugin\HareruyaEc\Service\Product\SaleNotificationService',
        'inventoryReflection' => 'Plugin\HareruyaEc\Service\Product\InventoryReflectService',
    ];

    const LAST_ARG = 10;

    protected function configure()
    {
        $this->setName('product:batch')
            ->setDescription('product batchs')
            ->addArgument('batch_name', InputArgument::OPTIONAL);

        foreach (range(1, self::LAST_ARG) as $num) {
            $this->addArgument("arg-{$num}", InputArgument::OPTIONAL);
        }
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $app = $this->getSilexApplication();

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
```

# 根拠
- 設計：
  - 0404 の B02-05 は処理フローで一定件数ごとの処理メモリ解放を要求している: `hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1411-1422`
  - 0404 の B02-05 は排他制御・トランザクションでも集約処理中の一定件数ごとのメモリ解放を明記している: `hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1445-1449`
- ec-cube-enterprise：
  - enterprise は全件結果を取得して全件配列に集約してから送信する: `ec-cube-enterprise/src/Eccube/Service/Product/BatchFavoriteSaleNotificationAction.php:36-91`
  - enterprise の findSaleFavoriteProducts は getResult で配列を返し、limit/offset や iterate ではない: `ec-cube-enterprise/src/Eccube/Repository/CustomerFavoriteProductRepository.php:230-254`
- ベース実装：
  - pf-eccube3 の findSaleFavoriteProducts は Doctrine の iterate で結果を返す: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbFavoriteProductRepository.php:24-54`
  - pf-eccube3 は会員ごとの集約ループで1000件ごとに EntityManager を clear する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Product/SaleNotificationService.php:27-68`
  - pf-eccube3 は product:batch saleNotification を SaleNotificationService に対応させる: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:12-56`

# 確認メモ
- 確認コマンド: `rg -n "一定件数ごと|処理メモリ|メモリを解放|product:batch saleNotification|お気に入り商品セール通知を実行|大量件数対応" excel_to_html/output/0404_基本設計仕様書\(バッチ_商品管理\).html`
- 確認コマンド: `rg -n "clear\(|detach\(|flush\(|batch|chunk|limit|offset|一定件数|memory|findSaleFavoriteProducts|groupByCustomer|FavoriteSaleNotification" ../ec-cube-enterprise/src/Eccube/Command/FavoriteSaleNotificationCommand.php ../ec-cube-enterprise/src/Eccube/Service/Product/BatchFavoriteSaleNotificationAction.php ../ec-cube-enterprise/src/Eccube/Repository/CustomerFavoriteProductRepository.php ../ec-cube-enterprise/src/Eccube/Repository/DtbFavoriteProductRepository.php`
- 確認コマンド: `rg -n "repository.favorite_product|findSaleFavoriteProducts|saleNotification|SaleNotificationService|orm.em.*clear|\$i % 1000|product:batch" ../pf-eccube3/app/Plugin/HareruyaEc`
- B02-05 のコマンド名差分や dtb_favorite_product / dtb_player 参照差分は別候補として存在するが、本件は大量件数対応の一定件数ごとのメモリ解放に限定する。

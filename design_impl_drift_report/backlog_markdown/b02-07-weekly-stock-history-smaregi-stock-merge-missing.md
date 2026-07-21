/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ在庫管理
機能：週間在庫履歴更新バッチ
課題カテゴリ：実装漏れ
課題：週間在庫履歴更新でEC-CUBE在庫とスマレジ在庫を商品コード・店舗単位に合算していない
設計書：0402_基本設計仕様書(バッチ_在庫管理).xlsx

# 再現手順【必須】
1. ec-cube-enterprise で `bin/console eccube:update-weekly-stock-history` から呼ばれる `BatchUpdateWeeklyStockHistoryAction::handle()` を確認する
2. `DtbWeeklyStockHistoryTempRepository::getStockData()` のSQLが `product_stock_id` 単位で週次在庫を集計しているか、商品規格・店舗・在庫区分をJOINしてEC-CUBE在庫とスマレジ在庫を合算しているか確認する
3. `DtbWeeklyStockHistoryRepository::copyDataFromTemp()` が一時テーブルの `product_stock_id` 単位の結果をそのまま本テーブルへコピーしているか確認する
4. 0402 の B02-07 設計「ECCUBE、スマレジの在庫を合算して週間在庫履歴テーブルに登録する」と照合する

# 期待される挙動【必須】
- 週間在庫履歴更新バッチでは、商品コードごと・店舗ごとに在庫履歴を出力できるよう、EC-CUBE在庫とスマレジ在庫を合算して週間在庫履歴テーブルに登録する
- 在庫ごと(商品コードごと、店舗ごと、在庫区分ごと)に1週間前から11週間前までの最新在庫履歴を取得し、一時テーブルへ保存したうえで本テーブルへ反映する
- システム統合後は本店・支店の取得を1つのバッチで行い、週間在庫履歴テーブルのデータを洗い替える

# 現在の挙動【必須】
- ec-cube-enterprise では `BatchUpdateWeeklyStockHistoryAction::handle()` が `DtbWeeklyStockHistoryTempRepository::getStockData()` の結果をそのまま一時テーブルへINSERTし、本テーブルへ置き換える。コメント上もスマレジ在庫との合算はTODOで、B02-07内ではEC-CUBE在庫行とスマレジ在庫行を商品コード・店舗単位に合算する処理がない。

ec-cube-enterprise B02-07 はスマレジ在庫合算をTODOとしており getStockData の結果をそのまま登録する: `ec-cube-enterprise/src/Eccube/Service/Product/BatchUpdateWeeklyStockHistoryAction.php:33-80`
```php
    /**
     * 週間在庫履歴を更新する。
     *
     * 1. 一時テーブルを TRUNCATE
     * 2. dtb_stock_history から全店舗の在庫データを取得し一時テーブルへ INSERT（20,000件ずつ）
     * 3. 本テーブルを TRUNCATE
     * 4. 一時テーブルから本テーブルへコピー
     *
     * TODO: スマレジ在庫との合算対応
     *   設計書では「ECCUBEとスマレジの在庫を合算して週間在庫履歴テーブルに登録する」とあるが、
     *   現時点ではスマレジ在庫の取り込みが未実装のため、ECCUBE在庫のみを対象としている。
     *   スマレジ在庫が dtb_stock_history に取り込まれるようになった際は、
     *   同一 (product_class_id, base_info_id) の stock_location_id=1(ECCUBE) と
     *   stock_location_id=2(スマレジ) の在庫を合算する処理を追加すること。
     *
     * @throws \Exception 処理中に例外が発生した場合（エラーメール送信後に再スロー）
     */
    public function handle(): void
    {
        try {
            // ① 一時テーブル初期化
            $this->weeklyStockHistoryTempRepository->truncate();

            // ② 在庫履歴データ取得 → 一時テーブルINSERT
            $dateStr = (new \DateTime())->format('Y-m-d 00:00:00');
            $lastId = $this->weeklyStockHistoryTempRepository->getLastProductStockId();

            if ($lastId === 0) {
                // ProductStock が空の場合は処理不要
                $this->weeklyStockHistoryRepository->replaceFromTemp();

                return;
            }

            $count = (int) floor($lastId / self::BATCH_SIZE);
            $offset = 1;
            for ($i = 0; $i <= $count; ++$i) {
                $data = $this->weeklyStockHistoryTempRepository->getStockData($dateStr, self::BATCH_SIZE, $offset);
                $this->weeklyStockHistoryTempRepository->insertBatch($data);
                $offset += self::BATCH_SIZE;
            }

            // ③④ 本テーブル TRUNCATE → 一時テーブルからコピー（トランザクションでラップ）
            $this->weeklyStockHistoryRepository->replaceFromTemp();
        } catch (\Exception $e) {
            $this->mailService->sendWeeklyStockHistoryErrorMail($e->getMessage());
            throw $e;
        }
```

ec-cube-enterprise の getStockData は dtb_stock_history を product_stock_id 単位でGROUP BYする: `ec-cube-enterprise/src/Eccube/Repository/DtbWeeklyStockHistoryTempRepository.php:37-105`
```php
    /**
     * 全店舗の週間在庫履歴を取得する。
     *
     * dtb_stock_history から各 product_stock ごとに 1〜11 週間前時点の最新在庫数を取得する。
     * EXPONENT トリック: MAX(sh.id * 10^4 + sh.stock) で最新レコードの在庫を特定し、下4桁を在庫数とする。
     *
     * @return array<int, string> INSERT VALUES 用の文字列配列
     */
    public function getStockData(string $dateStr, int $limit, int $offset): array
    {
        $exp = self::EXPONENT;
        $pow = 10 ** $exp;
        $rsm = new ResultSetMapping();
        $rsm->addScalarResult('product_stock_id', 'product_stock_id');
        $queries = [];
        for ($i = 1; $i <= DtbWeeklyStockHistory::HISTORY_COUNT; ++$i) {
            $alias = sprintf('stock_%02d', $i);
            $rsm->addScalarResult($alias, $alias);
            $queries[] = <<<EOT
                MAX(
                    CASE WHEN
                        sh.create_date <= CAST(:dateStr AS timestamp) - INTERVAL '{$i} weeks'
                    THEN
                        sh.id * $pow + sh.stock
                    ELSE
                        NULL
                    END
                ) AS {$alias}
                EOT;
        }

        $query = implode(',', $queries);
        $sql = <<<EOT
            SELECT
                sh.product_stock_id AS product_stock_id,
                {$query}
            FROM
                dtb_stock_history sh
            WHERE
                sh.product_stock_id BETWEEN :start AND :end
            GROUP BY
                sh.product_stock_id
            EOT;

        $em = $this->getEntityManager();
        $products = $em->createNativeQuery($sql, $rsm)
            ->setParameters([
                'dateStr' => $dateStr,
                'start' => $offset,
                'end' => ($offset + $limit - 1),
            ])
            ->getResult();
        $em->clear();

        $params = [];
        foreach ($products as $product) {
            $values = [];
            foreach ($product as $key => $column) {
                if ($key === 'product_stock_id') {
                    $values[] = $column;
                } else {
                    // 下exp桁が商品在庫
                    $values[] = $column === null ? 0 : (int) substr((string) $column, -$exp);
                }
            }
            $params[] = '('.implode(',', $values).')';
        }

        return $params;
```

ec-cube-enterprise は一時テーブルの product_stock_id 単位の値をそのまま本テーブルへコピーする: `ec-cube-enterprise/src/Eccube/Repository/DtbWeeklyStockHistoryRepository.php:31-80`
```php
    /**
     * 週間在庫履歴一時テーブルからデータをコピーする。
     */
    public function copyDataFromTemp(): void
    {
        $insertParams = ['product_stock_id'];
        $selectParams = ['wsht.product_stock_id'];
        for ($i = 1; $i <= DtbWeeklyStockHistory::HISTORY_COUNT; ++$i) {
            $insertParams[] = sprintf('stock_%02d', $i);
            $selectParams[] = sprintf('wsht.stock_%02d', $i);
        }
        $insertQuery = implode(',', $insertParams);
        $selectQuery = implode(',', $selectParams);

        $sql = <<<EOT
            INSERT INTO
                dtb_weekly_stock_history (
                    {$insertQuery}
                )
            SELECT
                {$selectQuery}
            FROM
                dtb_weekly_stock_history_temp wsht
            EOT;

        $em = $this->getEntityManager();
        $em->getConnection()->executeStatement($sql);
        $em->clear();
    }

    /**
     * 本テーブルを TRUNCATE し、一時テーブルからデータをコピーする。
     *
     * TRUNCATE 後に COPY が失敗するとデータが空になるため、トランザクションでラップする。
     * PostgreSQL では TRUNCATE がトランザクション内でロールバック可能。
     */
    public function replaceFromTemp(): void
    {
        $em = $this->getEntityManager();
        $connection = $em->getConnection();
        $connection->beginTransaction();
        try {
            $connection->executeStatement('TRUNCATE TABLE dtb_weekly_stock_history');
            $this->copyDataFromTemp();
            $connection->commit();
        } catch (\Throwable $e) {
            $connection->rollBack();
            throw $e;
        }
        $em->clear();
```
- ベース実装(pf-eccube3)では `product:batch exportWeeklyStockHistoryCsv` が `ExportWeeklyStockHistoryCsv` を実行し、`DtbStockHistoryRepository::getWeeklyStockHistory()` が商品規格ID単位で `dtb_stock_history.product_class_id` の最新在庫を取得してCSVへ出力する。ベースはスマレジ在庫区分・店舗単位の合算を扱っておらず、0402のB02-07本文はシステム統合後の移行先要求としてEC-CUBE在庫とスマレジ在庫の合算を追加している。

ベース実装 pf-eccube3 は product:batch exportWeeklyStockHistoryCsv を登録する: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:12-56`
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

ベース実装 pf-eccube3 は getWeeklyStockHistory の結果をCSVへ出力する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Product/ExportWeeklyStockHistoryCsv.php:7-51`
```php
class ExportWeeklyStockHistoryCsv extends ProductBatchService
{
    const CSV_HEADER = [
        'product_class_id',
        'stock_01',
        'stock_02',
        'stock_03',
        'stock_04',
        'stock_05',
        'stock_06',
        'stock_07',
        'stock_08',
        'stock_09',
        'stock_10',
        'stock_11',
    ];

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
     * export weekly stock history csv
     */
    public function execute()
    {
        $weeklyStockHistories = $this->app['hareruya_ec.repository.stock_history']->getWeeklyStockHistory();

        $f = fopen(__DIR__ . '/../../../../..' . $this->app['config']['HareruyaEc']['const']['weekly_stock_history']['csv_path'], 'w');
        fputcsv($f, self::CSV_HEADER);
        foreach ($weeklyStockHistories as $weeklyStockHistory) {
            fputcsv($f, $weeklyStockHistory);
        }
        fclose($f);
    }
```

ベース実装 pf-eccube3 は product_class_id 単位で最新在庫履歴を取得する: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbStockHistoryRepository.php:203-243`
```php
    public function getWeeklyStockHistory()
    {
        ini_set('memory_limit', '-1');
        set_time_limit(0);

        $entityManager = $this->getEntityManager();
        $entityManager->getConnection()->getConfiguration()->setSQLLogger(null);

        $date = new \DateTime();
        $dateStr = $date->format('Y-m-d');
        $productClassIds = $entityManager->getRepository(ProductStock::class)->getAllProductClassId();

        $weeklyStockHistories = [];
        foreach ($productClassIds as $productClassId) {
            $weeklyStockHistory = [];
            $weeklyStockHistory['product_class_id'] = $productClassId;
            for ($i = 1; $i <= self::WEEKLY_STOCK_HISTORY_COUNT; $i++) {
                $sql = <<<EOT
                    SELECT
                        sh.stock
                    FROM
                        dtb_stock_history sh
                    WHERE
                        sh.product_class_id = :productClassId
                        AND DATE_FORMAT(sh.create_date, '%Y%m%d') <= DATE_FORMAT(DATE_SUB('{$dateStr}', INTERVAL {$i} WEEK), '%Y%m%d')
                    ORDER BY
                        sh.create_date DESC
                    LIMIT 1
                EOT;
                $rsm = new ResultSetMapping();
                $rsm->addScalarResult('stock', 'stock');
                $result = $entityManager->createNativeQuery($sql, $rsm)
                    ->setParameter('productClassId', $productClassId)
                    ->getOneOrNullResult();
                $weeklyStockHistory[sprintf('stock_%02d', $i)] = $result['stock'] ?? 0;
            }
            $weeklyStockHistories[] = $weeklyStockHistory;
            $entityManager->clear();
        }

        return $weeklyStockHistories;
```

# 根拠
- 設計：
  - 0402 の B02-07 本文はシステム統合に伴い本店・支店の週間在庫履歴取得を1つのバッチで行い、週間在庫履歴テーブルへ保存することを要求している: `hareruya-design-docs/excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html:1262-1277`
  - 0402 の B02-07 本文は商品コード・店舗単位の出力のためEC-CUBE在庫とスマレジ在庫を合算して週間在庫履歴テーブルに登録すると明記している: `hareruya-design-docs/excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html:1279-1306`
- ec-cube-enterprise：
  - enterprise のB02-07はスマレジ在庫との合算をTODOとしており、実処理はgetStockDataの結果をそのまま一時テーブルへINSERTする: `ec-cube-enterprise/src/Eccube/Service/Product/BatchUpdateWeeklyStockHistoryAction.php:33-80`
  - enterprise の週次在庫履歴集計SQLはdtb_stock_historyをproduct_stock_id単位でGROUP BYし、商品規格・店舗・在庫区分をJOINしてSUMしていない: `ec-cube-enterprise/src/Eccube/Repository/DtbWeeklyStockHistoryTempRepository.php:37-105`
  - enterprise には別用途のEC-CUBE+スマレジ合算メソッドがあるが、B02-07からは呼ばれていない: `ec-cube-enterprise/src/Eccube/Repository/ProductStockRepository.php:554-584`
  - enterprise にはスマレジ在庫変動をスマレジ在庫区分のProductStockへ反映する処理があり、課題は取り込み自体ではなくB02-07側の合算不在に限定する: `ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Stock/SmaregiStockChangeApplier.php:32-106`
- ベース実装：
  - pf-eccube3 は product:batch exportWeeklyStockHistoryCsv を ExportWeeklyStockHistoryCsv に対応させる: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:12-56`
  - pf-eccube3 は商品規格IDと週次在庫列をCSVへ出力する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Product/ExportWeeklyStockHistoryCsv.php:7-51`
  - pf-eccube3 はdtb_stock_history.product_class_id単位で最新在庫履歴を取得し、スマレジ在庫区分・店舗単位の合算は扱わない: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbStockHistoryRepository.php:203-243`

# 確認メモ
- 確認コマンド: `rg -n "週間在庫履歴更新バッチ|ECCUBE、スマレジの在庫を合算|在庫ごと（商品コードごと、店舗ごと、在庫区分ごと）|週間在庫履歴テーブルに結果を保存" excel_to_html/output/0402_基本設計仕様書\(バッチ_在庫管理\).html`
- 確認コマンド: `rg -n "BatchUpdateWeeklyStockHistoryAction|スマレジ在庫との合算対応|getStockData\(|product_stock_id|stock_location_id|STOCK_LOCATION_SMAREGI|getMainStoreDisplayStockByProductClassIds|SmaregiStockChangeApplier" ../ec-cube-enterprise/src/Eccube`
- 確認コマンド: `rg -n "exportWeeklyStockHistoryCsv|ExportWeeklyStockHistoryCsv|getWeeklyStockHistory|product_class_id|weekly_stock_history|stock_location|smaregi|スマレジ" ../pf-eccube3/app/Plugin/HareruyaEc`
- B02-07の command name mismatch / CSV vs DB mismatch 候補は、設計本文とリニューアル移行時の扱いがenterpriseのDB方式を正としているため過検知としてreject済み。本件はスマレジ在庫合算に限定する。

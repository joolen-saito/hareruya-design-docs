/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ商品管理
機能：商品部門未設定チェック
課題カテゴリ：実装漏れ
課題：商品部門未設定チェックが商品管理バッチとして実装されておらず、店頭買取集計の副処理になっている
設計書：0404_基本設計仕様書(バッチ_商品管理).xlsx

# 再現手順【必須】
1. ec-cube-enterprise のローカル環境で、設計書に記載された `bin/console product:batch checkNoSectionProduct` を実行できるか確認する
2. ec-cube-enterprise の `src/Eccube/Command` と関連 Service / Repository を確認し、B02-04 の商品管理バッチ入口と処理本体が存在するか確認する
3. ベース実装(pf-eccube3)の `ProductBatch`、`CheckNoSectionProduct`、`DtbProductSubClassRepository` を確認し、現行の実行入口・抽出条件・10000件単位取得・通知メール送信と照合する
4. 0404 の B02-04 設計「product:batch checkNoSectionProduct」「公開中かつ部門未設定の商品規格」「一定件数(10000件)ずつ取得」「開始・完了のコンソール出力」と照合する

# 期待される挙動【必須】
- コンソールのバッチコマンド `product:batch checkNoSectionProduct` で B02-04 商品部門未設定チェックを実行できる
- `dtb_product.product_status_id` と `dtb_product_class.section_id` を使い、公開中かつ部門未設定の商品規格を抽出する
- 部門未設定の商品規格を最大10000件ずつ取得し、該当がある場合は管理者へ「部門未設定商品通知メール」を送信する
- バッチの開始・完了は日時付きでコンソール出力し、コマンド名不一致時や抽出・送信時エラーはコンソールに出力する

# 現在の挙動【必須】
- ec-cube-enterprise には `product:batch checkNoSectionProduct` の有効な Command / Service がなく、検索で見つかる商品規格向けの `getNoSectionProductClassCount` / `getNoSectionProductClasses` は `ProductClassRepository` 内でコメントアウトされている。実装済みの近傍処理は `eccube:otc-buy-order:aggregate-summary` で、B02-04 の商品管理バッチ入口ではない。

ec-cube-enterprise の近傍 Command は店頭買取集計バッチとして登録されている: `ec-cube-enterprise/src/Eccube/Command/OtcBuyOrderAggregateSummaryCommand.php:40-45`
```php
 * 【メール通知】
 *   - 部門未設定の商品が存在する場合: 部門未設定商品通知メールを送信（集計は続行）
 *   - 集計処理でエラーが発生した場合: 集計エラー通知メールを送信
 *   送信先: MtbOption の otc_summary_mail_address（カンマ区切りで複数指定可）
 */
#[AsCommand(name: 'eccube:otc-buy-order:aggregate-summary', description: '店頭買取集計バッチ')]
```

ec-cube-enterprise の近傍 Command は OTC 集計処理を実行する: `ec-cube-enterprise/src/Eccube/Command/OtcBuyOrderAggregateSummaryCommand.php:60-90`
```php
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $dateArg = $input->getArgument('date');
        if ($dateArg !== null) {
            $summaryDate = \DateTime::createFromFormat('Y-m-d', $dateArg);
            if ($summaryDate === false) {
                $io->error('日付の形式が正しくありません。Y-m-d形式で指定してください。例: 2026-03-01');

                return Command::FAILURE;
            }
        } else {
            $summaryDate = new \DateTime('yesterday');
        }

        $summaryDate->setTime(0, 0, 0);

        $io->info('集計対象日: '.$summaryDate->format('Y-m-d'));

        try {
            $this->batchAggregateSummaryAction->handle($summaryDate);
        } catch (\Exception $e) {
            $io->error('集計処理でエラーが発生しました: '.$e->getMessage());

            return Command::FAILURE;
        }

        $io->success('店頭買取集計が完了しました。');

        return Command::SUCCESS;
```

ec-cube-enterprise の商品規格向け NoSection 取得処理はコメントアウトされている: `ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2325-2363`
```php
    // 	/**
    //      * 部門設定のない商品規格数を取得
    //      */
    //     public function getNoSectionProductClassCount() : int
    //     {
    //         $sql = <<<EOT
    //             SELECT
    //                 COUNT(psc.product_class_id) AS no_section_product_count
    //             FROM
    //                 dtb_product_sub_class psc
    //             JOIN
    //                 dtb_product_class pc ON pc.product_class_id = psc.product_class_id
    //             JOIN
    //                 dtb_product p ON p.product_id = pc.product_id
    //             WHERE
    //                 pc.del_flg = 0
    //                 AND p.del_flg = 0
    //                 AND p.Status = :showStatus
    //                 AND psc.section_id IS NULL
    //         EOT;

    //         $rsm = new ResultSetMapping();
    //         $rsm->addScalarResult('no_section_product_count', 'no_section_product_count', Types::INTEGER);

    //         $result = $this->getEntityManager()
    //             ->createNativeQuery($sql, $rsm)
    //             ->setParameters([
    //                 'showStatus' => MtbDisp::DISPLAY_SHOW,
    //             ])
    //             ->getSingleScalarResult();

    //         return $result;
    //     }

    //     /**
    //      * 部門設定のない商品の商品名と商品コードを取得
    //      */
    //     public function getNoSectionProductClasses(int $limit, int $offset) : mixed
    //     {
```
- ec-cube-enterprise で有効な通知処理は店頭買取集計の副処理であり、`dtb_otc_buy_order_detail.section_id` / `dtb_otc_buy_order_indivisual_input_product.section_id` が NULL の店頭買取データを対象にする。設計が要求する `dtb_product.product_status_id` による公開判定と、商品規格 `dtb_product_class.section_id` の未設定チェックではない。

ec-cube-enterprise の店頭買取集計副処理は OTC Repository の NoSection 取得結果でメール送信する: `ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/BatchAggregateSummaryAction.php:33-58`
```php
    /**
     * バッチ用の集計実行。
     * 集計完了後に部門未設定商品が存在する場合は通知メールを送信する。
     * 集計処理で例外が発生した場合はエラー通知メールを送信して例外を再スローする。
     *
     * @throws \Exception 集計処理で例外が発生した場合
     */
    public function handle(\DateTime $summaryDate): void
    {
        try {
            SummaryByDateAggregator::aggregate(
                $summaryDate,
                $this->otcBuyOrderRepository,
                $this->otcBuyOrderSummaryRepository,
                $this->mtbOptionRepository,
            );

            $noSectionProducts = $this->otcBuyOrderRepository->getNoSectionProducts($summaryDate);
            if (!empty($noSectionProducts)) {
                $this->mailService->sendNoSectionAlertMail($noSectionProducts);
            }
        } catch (\Exception $exception) {
            $this->mailService->sendUpdateOtcBuyOrderSummaryErrorMail($exception->getMessage());

            throw $exception;
        }
```

ec-cube-enterprise の NoSection 取得は店頭買取明細と個別入力商品の section_id を見る: `ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:949-1000`
```php
    public function getNoSectionProducts(\DateTime $summaryDate): array
    {
        // 集計区間
        $from = clone $summaryDate;
        $to = (clone $summaryDate)->modify('23:59:59');

        // 部門未設定(null)の商品データ
        $sql = <<<EOT
            SELECT
                p.name AS product_name,
                pc.product_code AS product_code
            FROM
                dtb_otc_buy_order obo
            JOIN
                dtb_otc_buy_order_detail obod
                ON obod.otc_buy_order_id = obo.id
                AND obod.section_id IS NULL
            JOIN
                dtb_product_class pc ON pc.id = obod.product_class_id
            JOIN
                dtb_product p ON p.id = pc.product_id
            WHERE
                AND obo.complete_date >= :from
                AND obo.complete_date <= :to
            UNION
            SELECT
                oboi.name AS product_name,
                '' AS product_code
            FROM
                dtb_otc_buy_order obo
            JOIN
                dtb_otc_buy_order_indivisual_input_product oboi
                ON oboi.otc_buy_order_id = obo.id
                AND oboi.section_id IS NULL
            WHERE
                AND obo.complete_date >= :from
                AND obo.complete_date <= :to
        EOT;

        $rsm = new ResultSetMapping();
        $rsm->addScalarResult('product_name', 'product_name')->addScalarResult(
            'product_code',
            'product_code',
        );

        return $this->getEntityManager()
            ->createNativeQuery($sql, $rsm)
            ->setParameters([
                'from' => $from,
                'to' => $to,
            ])
            ->getResult();
```

ec-cube-enterprise の通知メール送信処理自体は OTC 用テンプレートで呼ばれる: `ec-cube-enterprise/src/Eccube/Service/MailService.php:1183-1221`
```php
    /**
     * 部門未設定商品通知メール送信
     *
     * @param array<int, array{product_name: string, product_code: string}> $products
     */
    public function sendNoSectionAlertMail(array $products): void
    {
        log_info('部門未設定商品通知メール送信開始');

        $addresses = $this->resolveOtcSummaryMailAddresses();
        if (empty($addresses)) {
            log_info('部門未設定商品通知メールアドレス未設定のため送信せず終了');

            return;
        }

        $MailTemplate = $this->mailTemplateRepository->findOneBy([
            'mail_key' => $this->eccubeConfig['eccube_otc_buy_order_no_section_alert_mail_template_id'],
        ]);

        $body = $this->twig->render($MailTemplate->getFileName(), [
            'products' => $products,
        ]);

        $message = (new Email())
            ->subject('['.$this->BaseInfo->getShopName().'] '.$MailTemplate->getMailSubject())
            ->text($body)
            ->from(new Address($this->BaseInfo->getEmail01(), $this->BaseInfo->getShopName()))
            ->to(...$addresses)
            ->replyTo($this->BaseInfo->getEmail03())
            ->returnPath($this->BaseInfo->getEmail04());

        try {
            $this->mailer->send($message);
            log_info('部門未設定商品通知メール送信完了');
        } catch (TransportExceptionInterface $e) {
            log_critical($e->getMessage());
        }
    }
```
- ベース実装(pf-eccube3)では `CommandRegister` が `ProductBatch` を console に登録し、`product:batch` の `batch_name` として `checkNoSectionProduct` を `CheckNoSectionProduct` に対応させる。処理本体は 10000 件単位で公開中かつ部門未設定の商品規格を取得し、該当時に `sendNoSectionAlertMail` を呼び出す。

ベース実装 pf-eccube3 CommandRegister は ProductBatch を console に登録する: `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/CommandRegister.php:15-48`
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
    }

    public function boot(BaseApplication $app)
    {
    }

    /**
     * 登録するコマンド一覧
     * @return array
     */
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

ベース実装 pf-eccube3 ProductBatch は product:batch と checkNoSectionProduct を定義する: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:12-56`
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

ベース実装 pf-eccube3 CheckNoSectionProduct は 10000 件単位で商品規格を取得し通知する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Product/CheckNoSectionProduct.php:7-47`
```php
class CheckNoSectionProduct extends ProductBatchService
{
    const GET_PRODUCT_LIMIT = 10000;
    protected $commandName = 'checkNoSectionProduct';
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
     * Get products with not setting section and send alert mail
     */
    public function execute()
    {
        $transport = new \Swift_SmtpTransport('localhost', 25);
        $transport->setUsername($this->app['config']['HareruyaEc']['const']['swiftmailer_user']);
        $transport->setPassword('');
        $this->app['mailer'] = new \Swift_Mailer($transport);

        $noSectionProductCount = $this->app['hareruya_ec.repository.product_sub_class']->getNoSectionProductClassCount();
        $offset = 0;

        while ($offset < $noSectionProductCount) {
            // 部門未設定商品の一覧
            $noSectionProductClasses = $this->app['hareruya_ec.repository.product_sub_class']->getNoSectionProductClasses(self::GET_PRODUCT_LIMIT, $offset);
            // 部門未設定の商品がある場合は通知メールを送信
            if (!empty($noSectionProductClasses)) {
                $this->app['hareruya_ec.service.mail']->sendNoSectionAlertMail($noSectionProductClasses);
            }
            $offset += self::GET_PRODUCT_LIMIT;
        }
    }
```
- ベース実装(pf-eccube3)の抽出 SQL は公開中の商品を `p.Status = :showStatus` で絞り、商品規格側の部門未設定を `psc.section_id IS NULL` で判定し、`LIMIT :limit OFFSET :offset` で取得する。通知メールは件名「部門未設定商品通知メール」で商品名・商品コードを本文に含める。

ベース実装 pf-eccube3 は公開中かつ部門未設定の商品規格数を取得する: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:1481-1515`
```php
	/**
     * 部門設定のない商品規格数を取得
     *
     * @return int
     */
    public function getNoSectionProductClassCount() : int
    {
        $sql = <<<EOT
            SELECT
                COUNT(psc.product_class_id) AS no_section_product_count
            FROM
                dtb_product_sub_class psc
            JOIN
                dtb_product_class pc ON pc.product_class_id = psc.product_class_id
            JOIN
                dtb_product p ON p.product_id = pc.product_id
            WHERE
                pc.del_flg = 0
                AND p.del_flg = 0
                AND p.Status = :showStatus
                AND psc.section_id IS NULL
        EOT;

        $rsm = new ResultSetMapping();
        $rsm->addScalarResult('no_section_product_count', 'no_section_product_count', Type::INTEGER);

        $result = $this->getEntityManager()
            ->createNativeQuery($sql, $rsm)
            ->setParameters([
                'showStatus' => Disp::DISPLAY_SHOW,
            ])
            ->getSingleScalarResult();

        return $result;
    }
```

ベース実装 pf-eccube3 は LIMIT/OFFSET で部門未設定商品規格を取得する: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:1524-1561`
```php
    public function getNoSectionProductClasses($limit, $offset) : array
    {
        $sql = <<<EOT
            SELECT
                p.name AS 'product_name',
                pc.product_code AS 'product_code'
            FROM
                dtb_product_sub_class psc
            JOIN
                dtb_product_class pc ON pc.product_class_id = psc.product_class_id
            JOIN
                dtb_product p ON p.product_id = pc.product_id
            WHERE
                pc.del_flg = 0
                AND p.del_flg = 0
                AND p.Status = :showStatus
                AND psc.section_id IS NULL
            ORDER BY
                psc.product_class_id ASC
            LIMIT :limit
            OFFSET :offset
        EOT;

        $rsm = new ResultSetMapping();
        $rsm->addScalarResult('product_name', 'product_name')
            ->addScalarResult('product_code', 'product_code')
        ;

        $result = $this->getEntityManager()
            ->createNativeQuery($sql, $rsm)
            ->setParameters([
                'showStatus' => Disp::DISPLAY_SHOW,
                'limit' => $limit,
                'offset' => $offset,
            ])
            ->getResult();

        return $result;
```

ベース実装 pf-eccube3 は部門未設定商品通知メールを送信する: `pf-eccube3/app/Plugin/HareruyaEc/Service/MailService.php:1161-1201`
```php
    /**
     * 部門未設定商品通知メール送信
     */
    public function sendNoSectionAlertMail(array $products)
    {
        log_info('部門未設定商品通知メール送信開始');

        $lines = [];
        foreach ($products as $product) {
            $lines[] = "{$product['product_name']}, {$product['product_code']}";
        }
        $text = implode("\n", $lines);

        $body = <<<EOT
        商品名, 商品コード
        {$text}
        EOT;

        $mailAddressString = $this->app['hareruya_ec.repository.option']
            ->findOneByOptionKey(MtbOption::OTC_SUMMARY_MAIL_ADDRESS)
            ->getOptionValue();
        $address = array_filter(explode(',', $mailAddressString));
        if (empty($address)) {
            log_info('部門未設定商品通知メールアドレス未設定のため送信せず終了');

            return 0;
        }

        $message = \Swift_Message::newInstance()
            ->setSubject('部門未設定商品通知メール')
            ->setFrom([$this->baseInfo->getEmail01() => $this->baseInfo->getShopName()])
            ->setTo($address)
            ->setReplyTo($this->baseInfo->getEmail03())
            ->setReturnPath($this->baseInfo->getEmail04())
            ->setBody($body);

        MailUtil::convertMessage($this->app, $message);
        MailUtil::setParameterForCharset($this->app, $message);
        $count = $this->app->mail($message);

        log_info('部門未設定商品通知メール送信完了', ['count' => $count]);
```

# 根拠
- 設計：
  - 0404 の B02-04 は概要で公開中なのに部門未設定の商品を管理者にメール通知するとしている。同じシート内に「部門の登録が必須になったため、不要」という図形注記もあるため設計矛盾として扱う。: `hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1219-1254`
  - 0404 の埋め込み詳細設計は pf-eccube3 の現行踏襲として product:batch checkNoSectionProduct、10000件単位取得、アラートメール送信、開始・完了出力を要求している: `hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1265-1323`
- ec-cube-enterprise：
  - enterprise の近傍実装は店頭買取集計バッチであり、商品管理バッチ product:batch checkNoSectionProduct ではない: `ec-cube-enterprise/src/Eccube/Command/OtcBuyOrderAggregateSummaryCommand.php:40-90`
  - enterprise の有効な NoSection 取得は OTC 明細・個別入力商品を対象にしており、商品規格の公開ステータスと section_id の判定ではない: `ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:949-1000`
  - enterprise の商品規格向け NoSection 取得処理はコメントアウトされており有効実装ではない: `ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2325-2400`
- ベース実装：
  - pf-eccube3 は product:batch の batch_name として checkNoSectionProduct を処理本体に対応させる: `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:12-56`
  - pf-eccube3 の CheckNoSectionProduct は 10000 件単位で部門未設定商品規格を取得し、該当時に通知メールを送信する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Product/CheckNoSectionProduct.php:7-47`
  - pf-eccube3 の Repository は公開中かつ部門未設定の商品規格を LIMIT/OFFSET 付きで取得する: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:1481-1561`

# 確認メモ
- 確認コマンド: `rg -n "B02-04|商品部門未設定チェック|product:batch checkNoSectionProduct|公開中かつ部門未設定|10000件|部門の登録が必須になったため、不要" excel_to_html/output/0404_基本設計仕様書\(バッチ_商品管理\).html`
- 確認コマンド: `rg -n "checkNoSectionProduct|product:batch|NoSection|部門未設定|section_id|otc-buy-order:aggregate-summary|AggregateSummary|sendNoSectionAlertMail|ProductBatch|CommandRegister" ../ec-cube-enterprise/src ../ec-cube-enterprise/app ../pf-eccube3/app/Plugin/HareruyaEc ../pf-api ../pf-article ../ec-cube ../deck-api ../deck-builder`
- 確認コマンド: `rg -n "AsCommand\(name: 'product:batch'|product:batch|checkNoSectionProduct|CheckNoSectionProduct|getNoSectionProductClassCount|getNoSectionProductClasses" ../ec-cube-enterprise/src ../ec-cube-enterprise/app`
- 確認コマンド: `rg -n "checkNoSectionProduct|ProductBatch|GET_PRODUCT_LIMIT|getNoSectionProductClassCount|getNoSectionProductClasses|sendNoSectionAlertMail|部門未設定商品通知メール" ../pf-eccube3/app/Plugin/HareruyaEc`
- 同じ B02-04 の抽出条件差分、10000件単位取得差分、開始・完了コンソール出力差分は、商品管理バッチ B02-04 が enterprise で有効実装されていないことに起因するため、本件に統合する。
- 設計書内に「部門の登録が必須になったため、不要」という図形注記があるため、起票後に設計オーナーへ B02-04 が本当に必要か、廃止対象かを確認する余地がある。
- レビュー指摘: enterprise の DtbOtcBuyOrderRepository::getNoSectionProducts() は SQL 内に `WHERE AND` があり、近傍実装としても動作リスクがある。ただし本件の主論点は B02-04 商品管理バッチ不在である。

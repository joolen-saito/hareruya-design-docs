/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ受注管理
機能：ポイント利用未反映チェック
課題カテゴリ：実装違い
課題：ポイント利用未反映チェックバッチを設計どおり `order:batch checkNotReflectedPointUsage` で起動できない
設計書：0405_基本設計仕様書(バッチ_受注管理).xlsx

# 再現手順【必須】
1. 設計書 B05-07 の利用者視点の入口で、実行方法が `order:batch checkNotReflectedPointUsage` とされていることを確認する
2. ベース実装 pf-eccube3 の `OrderBatch` が `order:batch` コマンドの `batch_name` として `checkNotReflectedPointUsage` を受け付け、`CheckNotReflectedPointUsage` サービスへ対応付けることを確認する
3. ec-cube-enterprise の `src/Eccube/Command` と設定を検索し、`order:batch checkNotReflectedPointUsage` または同等 alias が登録されているか確認する
4. ec-cube-enterprise では `eccube:check-not-reflected-point-usage` だけが登録され、設計どおりの起動名ではポイント利用未反映チェックバッチに到達できないことを確認する

# 期待される挙動【必須】
- ポイント利用未反映チェックバッチは `order:batch checkNotReflectedPointUsage` で起動できる
- コマンド名が未指定または不一致の場合は、ポイント利用未反映チェック処理を行わずに終了する
- 起動後の処理ではポイント利用が正しく反映されていない注文を抽出し、該当があれば管理者へ通知メールを送信する

# 現在の挙動【必須】
- ec-cube-enterprise ではポイント利用未反映チェックの本体処理と通知処理は存在するが、Symfony Console の登録名は `eccube:check-not-reflected-point-usage` であり、設計とベース実装が外部入口としている `order:batch checkNotReflectedPointUsage` や alias は確認できない。

ec-cube-enterprise は別名の Symfony コマンドだけを登録している: `ec-cube-enterprise/src/Eccube/Command/CheckNotReflectedPointUsageCommand.php:30-72`
```php
 * 【使い方】
 *
 *   bin/console eccube:check-not-reflected-point-usage
 */
#[AsCommand(
    name: 'eccube:check-not-reflected-point-usage',
    description: 'ポイント利用未反映チェックバッチ',
)]
class CheckNotReflectedPointUsageCommand extends Command
{
    public function __construct(
        private readonly CheckNotReflectedPointUsageAction $checkNotReflectedPointUsageAction,
    ) {
        parent::__construct();
    }

    /**
     * {@inheritdoc}
     */
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->text('ポイント利用未反映チェックバッチ開始');

        try {
            $count = $this->checkNotReflectedPointUsageAction->handle();
        } catch (\Throwable $e) {
            $io->error([
                'ポイント利用未反映チェック処理でエラーが発生しました',
                $e->getMessage(),
            ]);

            return Command::FAILURE;
        }

        if ($count === 0) {
            $io->success('ポイント利用未反映は検出されませんでした。');
        } else {
            $io->success(sprintf('ポイント利用未反映が検出されました。（%d件）', $count));
        }

        return Command::SUCCESS;
    }
```

ec-cube-enterprise の本体処理は存在するため、差分は起動名に限定する: `ec-cube-enterprise/src/Eccube/Service/Admin/Order/CheckNotReflectedPointUsageAction.php:22-47`
```php
class CheckNotReflectedPointUsageAction
{
    public function __construct(
        private readonly OrderRepository $orderRepository,
        private readonly MailService $mailService,
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * @return int 検出した受注件数
     */
    public function handle(): int
    {
        $notReflectedPointsUsage = $this->orderRepository->getNotReflectedPointsUsage();

        if ($notReflectedPointsUsage === []) {
            $this->logger->info('ポイント利用未反映対象なし');

            return 0;
        }

        $this->mailService->sendNotReflectedPointUsageAlertMail($notReflectedPointsUsage);

        return count($notReflectedPointsUsage);
    }
```

ec-cube-enterprise の抽出SQLも存在するため、差分は起動名に限定する: `ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1840-1862`
```php
    public function getNotReflectedPointsUsage(): array
    {
        $sql = <<<EOT
            SELECT o.id AS order_id
            FROM dtb_order o
            JOIN plg_sln_order_payment_status sln ON sln.order_id = o.id
            LEFT JOIN dtb_stockout_history soh ON soh.order_id = o.id
            WHERE o.total != o.payment_total
            AND o.order_number IS NOT NULL
            AND o.note IS NULL
            AND o.discount > 0
            AND soh.order_id IS NULL
            AND GREATEST(o.total, o.payment_total) != (o.discount + LEAST(o.total, o.payment_total))
            AND sln.amount::numeric = GREATEST(o.total, o.payment_total)
            AND o.payment_date BETWEEN NOW() - INTERVAL '1 hour' AND NOW()
            AND o.deleted_at IS NULL
            ORDER BY o.id DESC
            EOT;

        $rsm = new ResultSetMapping();
        $rsm->addScalarResult('order_id', 'order_id', Types::INTEGER);

        return $this->getEntityManager()->createNativeQuery($sql, $rsm)->getResult();
```

ec-cube-enterprise の通知メール処理も存在するため、差分は起動名に限定する: `ec-cube-enterprise/src/Eccube/Service/MailService.php:2283-2320`
```php
    public function sendNotReflectedPointUsageAlertMail(array $notReflectedPointsUsage): void
    {
        log_info('ポイント利用が反映されない決済を通知するメール送信開始');

        $lines = [];
        foreach ($notReflectedPointsUsage as $notReflectedPointUsage) {
            $lines[] = $notReflectedPointUsage['order_id'];
        }
        $text = implode("\n", $lines);

        $body = <<<EOT
        オーダーID
        {$text}
        EOT;

        $mailAddressString = trim((string) ($this->mtbOptionRepository
            ->findOneBy(['option_key' => MtbOption::CHECK_NOT_REFLECTED_POINT_USAGE_MAIL_ADDRESS])
            ?->getOptionValue() ?? ''));

        if (empty($mailAddressString)) {
            log_info('ポイント利用が反映されない決済を通知するメールアドレス未設定のため送信せずに終了');

            return;
        }

        $message = (new Email())
            ->subject('ポイント利用が反映されない決済を通知するメール')
            ->from(new Address($this->BaseInfo->getEmail01(), $this->BaseInfo->getShopName()))
            ->to($this->convertRFCViolatingEmail($mailAddressString))
            ->replyTo($this->BaseInfo->getEmail03())
            ->returnPath($this->BaseInfo->getEmail04())
            ->text($body);

        MailUtil::convertMessage($this->eccubeConfig, $message);
        MailUtil::setParameterForCharset($this->eccubeConfig, $message);
        $this->mailer->send($message);

        log_info('ポイント利用が反映されない決済を通知するメール送信完了');
```
- ベース実装(pf-eccube3)では `order:batch` が `batch_name` 引数を受け取り、`checkNotReflectedPointUsage` を `CheckNotReflectedPointUsage` サービスへ対応付ける。未指定・不一致の場合は `Nothing args or command.` を出して処理せず終了するため、設計の起動契約と一致している。

ベース実装 pf-eccube3 は order:batch checkNotReflectedPointUsage を登録する: `pf-eccube3/app/Plugin/HareruyaEc/Command/OrderBatch.php:12-30`
```php
    const BATCH_NAMES = [
        'copyOrderNumber' => 'Plugin\HareruyaEc\Service\Order\CopyOrderNumber',
        'resendMail' => 'Plugin\HareruyaEc\Service\Order\ResendMail',
        'truncateWaitingNumber' => 'Plugin\HareruyaEc\Service\Order\TruncateWaitingNumber',
        'resendSmaregiProduct' => 'Plugin\HareruyaEc\Service\Order\ResendSmaregiProduct',
        'deleteSmaregiProduct' => 'Plugin\HareruyaEc\Service\Order\DeleteSmaregiProduct',
        'checkDuplicatePoint' => 'Plugin\HareruyaEc\Service\Order\CheckDuplicatePoint',
        'checkNotReflectedPointUsage' => 'Plugin\HareruyaEc\Service\Order\CheckNotReflectedPointUsage',
        'alertNoCreditOrder' => 'Plugin\HareruyaEc\Service\Order\AlertNoCreditOrder',
        'checkCreditPaidAndProcessingOrder' => 'Plugin\HareruyaEc\Service\Order\CheckCreditPaidAndProcessingOrder',
    ];

    const LAST_ARG = 10;

    protected function configure()
    {
        $this->setName('order:batch')
            ->setDescription('order batchs')
            ->addArgument('batch_name', InputArgument::OPTIONAL);
```

ベース実装 pf-eccube3 はコマンド名不一致時に処理せず終了する: `pf-eccube3/app/Plugin/HareruyaEc/Command/OrderBatch.php:41-54`
```php
        $name = $input->getArgument('batch_name');
        $batchNames = self::BATCH_NAMES;
        $resultMessage = '[' . date('Y/m/d H:i') . '] ';

        if (!isset($batchNames[$name])) {
            echo $resultMessage . " Nothing args or command.\n";

            return 1;
        }

        $batch = new $batchNames[$name]($app, $this->createOptions($input));
        $batch->execute();

        return 0;
```

ベース実装 pf-eccube3 のポイント利用未反映チェックサービス: `pf-eccube3/app/Plugin/HareruyaEc/Service/Order/CheckNotReflectedPointUsage.php:7-35`
```php
class CheckNotReflectedPointUsage
{
    protected $commandName = 'checkNotReflectedPointUsage';
    protected $app;

    /**
    * Constructor
    * @param Eccube\Application $app
    */
    function __construct(Application $app)
    {
        $this->app = $app;
    }

    /**
    * Get orders with not reflected point usage and send alert mail
    */
    public function execute()
    {
        $transport = new \Swift_SmtpTransport('localhost', 25);
        $transport->setUsername($this->app['config']['HareruyaEc']['const']['swiftmailer_user']);
        $transport->setPassword('');
        $this->app['mailer'] = new \Swift_Mailer($transport);
        //ポイント利用が反映されない決済の一覧
        $notReflectedPointsUsage = $this->app['hareruya_ec.repository.order']->getNotReflectedPointsUsage();
        //ポイント利用が反映されない決済存在する場合通知メールを送信する
        if (!empty($notReflectedPointsUsage)) {
            $this->app['hareruya_ec.service.mail']->sendNotReflectedPointUsageAlertMail($notReflectedPointsUsage);
        }
```

# 根拠
- 設計：
  - B05-07 はポイント利用が反映されていない注文を抽出し、該当注文IDを管理者へメール通知するバッチとして定義している: `hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1755-1808`
  - B05-07 は pf-eccube3 を挙動参照元としている: `hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1819-1827`
  - B05-07 の利用者視点の入口は `order:batch checkNotReflectedPointUsage`: `hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1838-1847`
- ec-cube-enterprise：
  - enterprise は `eccube:check-not-reflected-point-usage` として登録しており、`order:batch checkNotReflectedPointUsage` ではない: `ec-cube-enterprise/src/Eccube/Command/CheckNotReflectedPointUsageCommand.php:30-72`
  - enterprise の本体処理は存在するため、本件は起動入口の差分に限定する: `ec-cube-enterprise/src/Eccube/Service/Admin/Order/CheckNotReflectedPointUsageAction.php:22-47`
  - enterprise の抽出SQLと通知メール処理も存在するため、本件は起動入口の差分に限定する: `ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1840-1862`
  - enterprise の通知メール送信処理も存在するため、本件は起動入口の差分に限定する: `ec-cube-enterprise/src/Eccube/Service/MailService.php:2283-2320`
- ベース実装：
  - pf-eccube3 は `order:batch` の batch_name として `checkNotReflectedPointUsage` を受け付ける: `pf-eccube3/app/Plugin/HareruyaEc/Command/OrderBatch.php:12-30`
  - pf-eccube3 の `order:batch` は未指定・不一致の場合に処理せず終了する: `pf-eccube3/app/Plugin/HareruyaEc/Command/OrderBatch.php:41-54`
  - pf-eccube3 の実処理は未反映ポイント利用注文を取得し、管理者へ通知する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Order/CheckNotReflectedPointUsage.php:24-35`

# 確認メモ
- 確認コマンド: `rg -n "B05-07|ポイント利用未反映|checkNotReflectedPointUsage|check-not-reflected-point-usage|order:batch" excel_to_html/output/0405_基本設計仕様書\(バッチ_受注管理\).html`
- 確認コマンド: `rg -n "order:batch|checkNotReflectedPointUsage|eccube:check-not-reflected-point-usage|setAliases|aliases|addAlias|addAliases" ../ec-cube-enterprise/src/Eccube/Command ../ec-cube-enterprise/app/config 2>/dev/null`
- 確認コマンド: `rg -n "checkNotReflectedPointUsage|CheckNotReflectedPointUsage|ポイント利用未反映|order:batch|sendNotReflectedPointUsageAlertMail" ../pf-eccube3/app/Plugin/HareruyaEc ../ec-cube-enterprise/src/Eccube 2>/dev/null`
- codex gpt-5.5 high reviewer Zeno: VERIFIED。設計とpf-eccube3は `order:batch checkNotReflectedPointUsage` 入口で一致し、enterpriseは `#[AsCommand(name: 'eccube:check-not-reflected-point-usage')]` のみで aliases がない。`CheckNotReflectedPointUsageAction`、Repository抽出、通知メールは存在するため、バッチ本体・Repository・メール未実装とは書かない。
- impact は運用/cron等が設計コマンド名で実行した場合にバッチへ到達できない点に限定する。
- enterprise 側には `CheckNotReflectedPointUsageAction` と管理者通知メール呼び出しがあるため、処理そのものではなく設計どおりの起動名に限定した差分として起票する。

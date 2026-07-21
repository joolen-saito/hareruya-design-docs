/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ受注管理
機能：ポイント二重登録チェック
課題カテゴリ：実装違い
課題：ポイント二重登録チェックバッチを設計どおり `order:batch checkDuplicatePoint` で起動できない
設計書：0405_基本設計仕様書(バッチ_受注管理).xlsx

# 再現手順【必須】
1. 設計書 B05-06 の利用者視点の入口で、実行方法が `order:batch checkDuplicatePoint` とされていることを確認する
2. ベース実装 pf-eccube3 の `OrderBatch` が `order:batch` コマンドの `batch_name` として `checkDuplicatePoint` を受け付け、`CheckDuplicatePoint` サービスへ対応付けることを確認する
3. ec-cube-enterprise の `src/Eccube/Command` と設定を検索し、`order:batch checkDuplicatePoint` または同等 alias が登録されているか確認する
4. ec-cube-enterprise では `eccube:check-duplicate-point` だけが登録され、設計どおりの起動名ではポイント二重登録チェックバッチに到達できないことを確認する

# 期待される挙動【必須】
- ポイント二重登録チェックバッチは `order:batch checkDuplicatePoint` で起動できる
- コマンド名が未指定または不一致の場合は、ポイント二重登録チェック処理を行わずに終了する
- 起動後の処理では二重登録されたポイント履歴を検知し、該当があれば注文番号を添えて管理者へ通知メールを送信する

# 現在の挙動【必須】
- ec-cube-enterprise ではポイント二重登録チェックの本体処理と通知処理は存在するが、Symfony Console の登録名は `eccube:check-duplicate-point` であり、設計とベース実装が外部入口としている `order:batch checkDuplicatePoint` や alias は確認できない。

ec-cube-enterprise は別名の Symfony コマンドだけを登録している: `ec-cube-enterprise/src/Eccube/Command/CheckDuplicatePointCommand.php:30-66`
```php
 * 【使い方】
 *
 *   bin/console eccube:check-duplicate-point
 */
#[AsCommand(name: 'eccube:check-duplicate-point', description: 'ポイント二重登録チェックバッチ')]
class CheckDuplicatePointCommand extends Command
{
    public function __construct(
        private readonly CheckDuplicatePointAction $checkDuplicatePointAction,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->text('ポイント二重登録チェックバッチ開始');

        try {
            $count = $this->checkDuplicatePointAction->handle();
        } catch (\Throwable $e) {
            $io->error([
                'ポイント二重登録チェック処理でエラーが発生しました',
                $e->getMessage(),
            ]);

            return Command::FAILURE;
        }

        if ($count === 0) {
            $io->success('ポイント二重登録は検出されませんでした。');
        } else {
            $io->success(sprintf('ポイント二重登録が検出されました。（%d件）', $count));
        }

        return Command::SUCCESS;
    }
```

ec-cube-enterprise の本体処理は存在するため、差分は起動名に限定する: `ec-cube-enterprise/src/Eccube/Service/Admin/Order/CheckDuplicatePointAction.php:24-50`
```php
class CheckDuplicatePointAction
{
    public function __construct(
        private readonly DtbPointHistoryRepository $pointHistoryRepository,
        private readonly OrderRepository $orderRepository,
        private readonly MailService $mailService,
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * @return int 検出した受注件数（ユニーク）
     */
    public function handle(): int
    {
        $orderIds = $this->pointHistoryRepository->findDuplicatePoint();

        if ($orderIds === []) {
            $this->logger->info('ポイント二重登録対象なし');

            return 0;
        }

        $orderNumbers = OrderUtil::getOrderNumbers($this->orderRepository, $orderIds);
        $this->mailService->sendOrderDuplicateNotificationMail($orderNumbers);

        return count($orderIds);
```
- ベース実装(pf-eccube3)では `order:batch` が `batch_name` 引数を受け取り、`checkDuplicatePoint` を `CheckDuplicatePoint` サービスへ対応付ける。未指定・不一致の場合は `Nothing args or command.` を出して処理せず終了するため、設計の起動契約と一致している。

ベース実装 pf-eccube3 は order:batch checkDuplicatePoint を登録する: `pf-eccube3/app/Plugin/HareruyaEc/Command/OrderBatch.php:12-30`
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

ベース実装 pf-eccube3 のポイント二重登録チェックサービス: `pf-eccube3/app/Plugin/HareruyaEc/Service/Order/CheckDuplicatePoint.php:10-54`
```php
class CheckDuplicatePoint
{
    protected $commandName = 'checkDuplicatePoint';
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
     * Find duplicate point and send notification mail
     */
    public function execute()
    {
        $transport = new \Swift_SmtpTransport('localhost', 25);
        $transport->setUsername($this->app['config']['HareruyaEc']['const']['swiftmailer_user']);
        $transport->setPassword('');

        $this->app['mailer'] = new \Swift_Mailer($transport);

        $duplicatePointHistories = $this->app['hareruya_ec.repository.point_history']->findDuplicatePoint();

        if (empty($duplicatePointHistories)) {
            return;
        }

        $orderIds = [];
        foreach ($duplicatePointHistories as $pointHistory) {
            $orderIds[] = $pointHistory->getOrder()->getId();
        }

        // 注文番号を取得
        $orderNumbers = OrderUtil::getOrderNumbers($this->app, $orderIds);

        // 管理者へ通知メール送信
        $this->app['hareruya_ec.service.mail']->sendOrderDuplicateNotificationMail($orderNumbers);
    }
```

# 根拠
- 設計：
  - B05-06 はポイント二重登録を検知し、該当があれば管理者へ通知するバッチとして定義している: `hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1640-1679`
  - B05-06 は pf-eccube3 を挙動参照元とし、利用者視点の入口を `order:batch checkDuplicatePoint` と明記している: `hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1690-1718`
- ec-cube-enterprise：
  - enterprise は `eccube:check-duplicate-point` として登録しており、`order:batch checkDuplicatePoint` ではない: `ec-cube-enterprise/src/Eccube/Command/CheckDuplicatePointCommand.php:30-66`
  - enterprise の本体処理は存在するため、本件は起動入口の差分に限定する: `ec-cube-enterprise/src/Eccube/Service/Admin/Order/CheckDuplicatePointAction.php:24-50`
- ベース実装：
  - pf-eccube3 は `order:batch` の batch_name として `checkDuplicatePoint` を受け付ける: `pf-eccube3/app/Plugin/HareruyaEc/Command/OrderBatch.php:12-30`
  - pf-eccube3 の `order:batch` は未指定・不一致の場合に処理せず終了する: `pf-eccube3/app/Plugin/HareruyaEc/Command/OrderBatch.php:41-54`
  - pf-eccube3 の実処理は重複ポイント履歴を取得し、注文番号を添えて管理者へ通知する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Order/CheckDuplicatePoint.php:30-54`

# 確認メモ
- 確認コマンド: `rg -n "B05-06|ポイント二重登録|checkDuplicatePoint|check-duplicate-point|order:batch" excel_to_html/output/0405_基本設計仕様書\(バッチ_受注管理\).html`
- 確認コマンド: `rg -n "order:batch|checkDuplicatePoint|eccube:check-duplicate-point|setAliases|aliases|addAlias|addAliases" ../ec-cube-enterprise/src/Eccube/Command ../ec-cube-enterprise/app/config 2>/dev/null`
- 確認コマンド: `rg -n "checkDuplicatePoint|CheckDuplicatePoint|ポイント二重登録|ポイント重複|order:batch|sendDuplicate" ../pf-eccube3/app/Plugin/HareruyaEc 2>/dev/null`
- codex gpt-5.5 high reviewer Leibniz: VERIFIED。設計とpf-eccube3は `order:batch checkDuplicatePoint` 入口で一致し、enterpriseは `#[AsCommand(name: 'eccube:check-duplicate-point')]` のみで aliases がない。`CheckDuplicatePointAction` に本体処理はあるため、バッチ本体欠落ではなくコマンド入口差分に限定する。
- enterprise では `AsCommand(... aliases: ...)` を使う例があるが、`CheckDuplicatePointCommand` には設定されていない。
- enterprise 側には `CheckDuplicatePointAction` と管理者通知メール呼び出しがあるため、処理そのものではなく設計どおりの起動名に限定した差分として起票する。

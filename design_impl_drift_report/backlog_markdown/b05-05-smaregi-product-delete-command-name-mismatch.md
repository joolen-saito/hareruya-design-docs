/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ受注管理
機能：スマレジ商品削除
課題カテゴリ：実装違い
課題：スマレジ商品削除バッチの起動名と日時付き開始・完了出力が設計と不一致
設計書：0405_基本設計仕様書(バッチ_受注管理).xlsx

# 再現手順【必須】
1. 設計書 B05-05 の利用者視点の入口で、実行方法が `order:batch deleteSmaregiProduct` とされていることを確認する
2. ベース実装 pf-eccube3 の `OrderBatch` が `order:batch` コマンドの `batch_name` として `deleteSmaregiProduct` を受け付け、`DeleteSmaregiProduct` サービスへ対応付けることを確認する
3. ec-cube-enterprise の `src/Eccube/Command` と設定を検索し、`order:batch deleteSmaregiProduct` または同等 alias が登録されているか確認する
4. ec-cube-enterprise では `eccube:smaregi:otc:delete` だけが登録され、設計どおりの起動名ではスマレジ商品削除バッチに到達できないことを確認する
5. 設計書 B05-05 のログ・監査で、開始・完了のコンソール出力を日時付きで行うことを確認し、ec-cube-enterprise の `SmaregiOtcDeleteCommand::execute()` の出力内容と比較する

# 期待される挙動【必須】
- スマレジ商品削除バッチは `order:batch deleteSmaregiProduct` で起動できる
- コマンド名が未指定または不一致の場合は、スマレジ商品削除処理を行わずに終了する
- 起動後の処理では手続きが完了した店頭注文を対象に、スマレジへ削除区分で連携する
- ログ・監査として、開始と完了のコンソール出力を日時付きで行う

# 現在の挙動【必須】
- ec-cube-enterprise ではスマレジ商品削除の本体処理と対象抽出は存在するが、Symfony Console の登録名は `eccube:smaregi:otc:delete` であり、設計とベース実装が外部入口としている `order:batch deleteSmaregiProduct` や alias は確認できない。

ec-cube-enterprise は別名の Symfony コマンドだけを登録している: `ec-cube-enterprise/src/Eccube/Command/SmaregiOtcDeleteCommand.php:39-78`
```php
#[AsCommand(name: 'eccube:smaregi:otc:delete', description: '店頭受取注文スマレジ商品削除バッチ (MessengerJob を enqueue する)')]
final class SmaregiOtcDeleteCommand extends Command
{
    public function __construct(
        private readonly LoggerInterface $logger,
        private readonly SmaregiOtcDeleteDispatcher $dispatcher,
        private readonly OrderRepository $orderRepository,
    ) {
        parent::__construct();
    }

    #[\Override]
    protected function configure(): void
    {
        $this
            ->addOption('order-id', null, InputOption::VALUE_REQUIRED, '特定の受注 ID のみ enqueue する')
            ->addOption('limit', null, InputOption::VALUE_REQUIRED, '一括 enqueue する受注の最大件数', '100');
    }

    #[\Override]
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $orderIdOption = $input->getOption('order-id');
        if ($orderIdOption !== null) {
            $orders = $this->loadSingleOrder((string) $orderIdOption, $io);
            if ($orders === null) {
                return Command::FAILURE;
            }
        } else {
            $limitOption = $input->getOption('limit');
            if (!is_string($limitOption) || !ctype_digit($limitOption) || (int) $limitOption < 1) {
                $io->error('--limit は 1 以上の数値を指定してください。');

                return Command::FAILURE;
            }
            $limit = (int) $limitOption;
            $orders = $this->orderRepository->getDeleteSmaregiProduct($limit);
        }
```

ec-cube-enterprise のスマレジ商品削除対象抽出は存在するため、差分は起動名に限定する: `ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:868-884`
```php
    public function getDeleteSmaregiProduct(int $limit = 100): array
    {
        $qb = $this->createQueryBuilder('o');
        $qb
            ->where($qb->expr()->in('o.OrderStatus', ':statusIds'))
            ->andWhere('o.smaregi_code IS NOT NULL')
            ->andWhere('o.smaregi_del_flg = :flgFalse')
            ->setParameter('statusIds', [OrderStatus::CANCEL, OrderStatus::DELIVERED, OrderStatus::PASSED])
            ->setParameter('flgFalse', Constant::DISABLED)
            ->orderBy('o.id', 'ASC')
            ->setMaxResults($limit);

        /** @var list<Order> $result */
        $result = $qb->getQuery()->getResult();

        return $result;
    }
```
- ec-cube-enterprise の `SmaregiOtcDeleteCommand::execute()` は対象なしメッセージ、受注ごとの enqueue 行、完了サマリを出力するが、開始出力はなく、完了サマリにも日時は含まれない。設計の日時付き開始・完了出力は設計書上の要件であり、pf-eccube3 側も正常実行時の開始・完了日時出力は持たない。

ec-cube-enterprise の削除コマンドは開始出力なしで処理に入り、完了サマリにも日時がない: `ec-cube-enterprise/src/Eccube/Command/SmaregiOtcDeleteCommand.php:58-113`
```php
    #[\Override]
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $orderIdOption = $input->getOption('order-id');
        if ($orderIdOption !== null) {
            $orders = $this->loadSingleOrder((string) $orderIdOption, $io);
            if ($orders === null) {
                return Command::FAILURE;
            }
        } else {
            $limitOption = $input->getOption('limit');
            if (!is_string($limitOption) || !ctype_digit($limitOption) || (int) $limitOption < 1) {
                $io->error('--limit は 1 以上の数値を指定してください。');

                return Command::FAILURE;
            }
            $limit = (int) $limitOption;
            $orders = $this->orderRepository->getDeleteSmaregiProduct($limit);
        }

        if ($orders === []) {
            $io->success('対象受注はありません。');

            return Command::SUCCESS;
        }

        $enqueued = 0;
        $failed = 0;
        foreach ($orders as $Order) {
            try {
                $Job = $this->dispatcher->dispatch($Order);
                ++$enqueued;
                $io->writeln(sprintf('  - orderId=%d jobId=%d enqueued', $Order->getId() ?? 0, $Job->getId() ?? 0));
            } catch (\Throwable $e) {
                ++$failed;
                $this->logger->error('Smaregi OTC delete enqueue failed', [
                    'orderId' => $Order->getId(),
                    'error' => $e->getMessage(),
                ]);
                $io->writeln(sprintf('  - orderId=%d enqueue_failed: %s', $Order->getId() ?? 0, $e->getMessage()));
            }
        }

        $message = sprintf('OTC delete enqueue completed: enqueued=%d failed=%d', $enqueued, $failed);

        if ($failed > 0) {
            $io->error($message);

            return Command::FAILURE;
        }

        $io->success($message);

        return Command::SUCCESS;
```

ベース実装 pf-eccube3 の日時付き出力は未指定・不一致時だけで、正常実行時の開始・完了出力はない: `pf-eccube3/app/Plugin/HareruyaEc/Command/OrderBatch.php:41-54`
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

ベース実装 pf-eccube3 の削除サービス自体もコンソール出力を持たない: `pf-eccube3/app/Plugin/HareruyaEc/Service/Order/DeleteSmaregiProduct.php:27-36`
```php
    public function execute()
    {
        $transport = new \Swift_SmtpTransport('localhost', 25);
        $transport->setUsername($this->app['config']['HareruyaEc']['const']['swiftmailer_user']);
        $transport->setPassword('');
        $this->app['mailer'] = new \Swift_Mailer($transport);

        foreach ($this->app['hareruya_ec.repository.order_sub']->getDeleteSmaregiProduct() as $orderSub) {
            $this->app['hareruya_ec.service.smaregi']->postSmaregiProcess($orderSub, ['delete']);
        }
```
- ベース実装(pf-eccube3)では `order:batch` が `batch_name` 引数を受け取り、`deleteSmaregiProduct` を `DeleteSmaregiProduct` サービスへ対応付ける。未指定・不一致の場合は `Nothing args or command.` を出して処理せず終了するため、設計の起動契約と一致している。

ベース実装 pf-eccube3 は OrderBatch をコンソールへ登録する: `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/CommandRegister.php:15-24`
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

ベース実装 pf-eccube3 は order:batch deleteSmaregiProduct を登録する: `pf-eccube3/app/Plugin/HareruyaEc/Command/OrderBatch.php:12-30`
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

ベース実装 pf-eccube3 のスマレジ商品削除サービス: `pf-eccube3/app/Plugin/HareruyaEc/Service/Order/DeleteSmaregiProduct.php:7-36`
```php
class DeleteSmaregiProduct
{
    protected $commandName = 'deleteSmaregiProduct';
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
     * Update SmaregiDelFlg
     */
    public function execute()
    {
        $transport = new \Swift_SmtpTransport('localhost', 25);
        $transport->setUsername($this->app['config']['HareruyaEc']['const']['swiftmailer_user']);
        $transport->setPassword('');
        $this->app['mailer'] = new \Swift_Mailer($transport);

        foreach ($this->app['hareruya_ec.repository.order_sub']->getDeleteSmaregiProduct() as $orderSub) {
            $this->app['hareruya_ec.service.smaregi']->postSmaregiProcess($orderSub, ['delete']);
        }
```

# 根拠
- 設計：
  - B05-05 は pf-eccube3 を挙動の参照元とし、利用者視点の入口を `order:batch deleteSmaregiProduct` と明記している: `hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1578-1602`
  - B05-05 は入力をコマンド名とし、未指定・不一致なら処理しないことをエラー処理として定義している: `hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1607-1628`
- ec-cube-enterprise：
  - enterprise は `eccube:smaregi:otc:delete` として登録しており、`order:batch deleteSmaregiProduct` ではない: `ec-cube-enterprise/src/Eccube/Command/SmaregiOtcDeleteCommand.php:39-78`
  - enterprise のスマレジ商品削除対象抽出は存在するため、本件は起動入口の差分に限定する: `ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:868-884`
  - enterprise の削除コマンドは開始出力がなく、対象なし・enqueue・完了サマリの出力にも日時がない: `ec-cube-enterprise/src/Eccube/Command/SmaregiOtcDeleteCommand.php:58-113`
- ベース実装：
  - pf-eccube3 は `OrderBatch` をコンソールへ登録している: `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/CommandRegister.php:15-24`
  - pf-eccube3 は `order:batch` の batch_name として `deleteSmaregiProduct` を受け付ける: `pf-eccube3/app/Plugin/HareruyaEc/Command/OrderBatch.php:12-30`
  - pf-eccube3 の `order:batch` は未指定・不一致の場合に処理せず終了する: `pf-eccube3/app/Plugin/HareruyaEc/Command/OrderBatch.php:41-54`
  - pf-eccube3 の実処理は削除対象を取得し、スマレジへ `delete` 区分で連携する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Order/DeleteSmaregiProduct.php:27-36`

# 確認メモ
- 確認コマンド: `rg -n "B05-05|スマレジ商品削除|deleteSmaregiProduct|eccube:smaregi:otc:delete|コマンド名" excel_to_html/output/0405_基本設計仕様書\(バッチ_受注管理\).html`
- 確認コマンド: `rg -n "order:batch|deleteSmaregiProduct|eccube:smaregi:otc:delete|SmaregiOtcDelete|setAliases|aliases" ../ec-cube-enterprise/src/Eccube/Command ../ec-cube-enterprise/app/config ../ec-cube-enterprise/src/Eccube/Repository 2>/dev/null`
- 確認コマンド: `rg -n "deleteSmaregiProduct|DeleteSmaregiProduct|order:batch|postSmaregiProcess|Nothing args or command" ../pf-eccube3/app/Plugin/HareruyaEc`
- 確認コマンド: `rg -n "writeln|success|error|sprintf|date\(|DateTime|開始|完了|completed|対象受注|enqueued" ../ec-cube-enterprise/src/Eccube/Command/SmaregiOtcDeleteCommand.php`
- 確認コマンド: `rg -n "date\(|resultMessage|writeln|success|開始|完了|deleteSmaregiProduct|DeleteSmaregiProduct|echo|print" ../pf-eccube3/app/Plugin/HareruyaEc/Command/OrderBatch.php ../pf-eccube3/app/Plugin/HareruyaEc/Service/Order/DeleteSmaregiProduct.php ../pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/CommandRegister.php`
- codex gpt-5.5 high reviewer Mill: VERIFIED。enterprise の PHP/YAML/XML config/source を `order:batch`、`deleteSmaregiProduct`、`SmaregiOtcDelete`、`console.command`、`aliases`、`addAlias/addAliases/setAliases` 等で確認しても、`order:batch deleteSmaregiProduct` の alias は見つからない。Messenger routing は console alias ではないため反証にならない。
- codex gpt-5.5 high reviewer Huygens: VERIFIED。設計は日時付きの開始・完了コンソール出力を要求するが、enterprise の `SmaregiOtcDeleteCommand` は開始出力がなく、完了サマリにも日時がない。pf-eccube3 も正常系の開始・完了日時出力は持たないため、このログ要件は base 由来ではなく設計書上の要件として扱う。
- enterprise 側には `getDeleteSmaregiProduct()` と `SmaregiOtcDeleteCommand` があるため、削除処理そのものではなく設計どおりの起動名に限定した差分として起票する。
- B05-05 の日時付きコンソールログ候補 9f7af29316ff は、単独起票ではなく本チケットのコマンド/ログ契約差分へ統合する。エラーメールは削除専用失敗経路の別修正対象として別起票にする。

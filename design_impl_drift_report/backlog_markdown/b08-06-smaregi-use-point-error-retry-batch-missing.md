/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ会員
機能：スマレジ使用ポイント連携
課題カテゴリ：実装漏れ
課題：スマレジ使用ポイント連携の失敗受注を再連携するバッチ入口がない
設計書：0408_基本設計仕様書(バッチ_会員).xlsx

# 再現手順【必須】
1. 設計書 B08-06 の業務ルール・データ整合性で、連携失敗時にエラー状態を残し、スマレジEC受注連携エラー再連携バッチで再試行できる仕様であることを確認する
2. ベース実装 pf-eccube3 の `SmaregiBatch` を確認し、`smaregi:batch checkSmaregiErrorOrder` が `CheckSmaregiErrorOrder` に対応付けられていることを確認する
3. ベース実装 pf-eccube3 の `CheckSmaregiErrorOrder` を確認し、`getSmaregiErrorOrder()` でエラー受注を取得してスマレジポイント連携を再実行することを確認する
4. ec-cube-enterprise の `OrderRepository::getSmaregiErrorOrder()` と `SmaregiUpdatePointAction` を確認し、エラー保存と抽出メソッドは存在するが、その抽出メソッドを呼ぶ再連携Command/Action/Serviceが存在しないことを確認する
5. ec-cube-enterprise の `SmaregiStockBackfillCommand` は在庫変動Webhook用であり、使用ポイント連携のエラー受注を再連携しないことを確認する

# 期待される挙動【必須】
- スマレジ使用ポイント連携が失敗した受注は、`point_error_message` と `smaregi_error_flg` で後続の再連携対象として残る
- スマレジEC受注連携エラー再連携バッチが、エラー状態の受注を取得してスマレジポイント連携を再試行できる
- 再連携成功時はエラー状態を解除し、失敗時はエラー内容を更新して再連携対象として残す

# 現在の挙動【必須】
- ec-cube-enterprise の `SmaregiUpdatePointAction` は、使用ポイント連携の失敗時に `pointErrorMessage` と `smaregiErrorFlg` を保存する。これは設計の失敗記録には対応しているが、後続の再連携バッチ入口そのものではない。

ec-cube-enterprise の SmaregiUpdatePointAction は失敗時に受注へエラー状態を保存する: `ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php:53-78`
```php
        try {
            $response = $this->smaregiCustomerService->postSmaregiPoint($player->getSmaregiId(), -$suspendPoint, false);
        } catch (\Throwable $e) {
            try {
                $order->setPointErrorMessage(json_encode(['message' => $e->getMessage()], JSON_UNESCAPED_UNICODE))
                    ->setSmaregiErrorFlg(true);
                $this->entityManager->persist($order);
                $this->entityManager->flush();
            } catch (\Throwable $persistError) {
                log_error('スマレジポイント連携失敗後の注文更新に失敗しました', [
                    'orderId' => $orderId,
                    'error' => $persistError->getMessage(),
                ]);
            }

            throw $e;
        }

        if (array_key_exists('result', $response)) {
            return;
        }

        $order->setPointErrorMessage(json_encode($response, JSON_UNESCAPED_UNICODE))
            ->setSmaregiErrorFlg(true);
        $this->entityManager->persist($order);
        $this->entityManager->flush();
```

ec-cube-enterprise の OrderRepository にはエラー受注抽出メソッドだけが存在する: `ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:930-945`
```php
    /**
     * スマレジ連携エラーの受注を取得
     */
    public function getSmaregiErrorOrder(): mixed
    {
        $qb = $this->createQueryBuilder('o');

        $results = $qb->join('o.Customer', 'c')
            ->join(DtbPlayer::class, 'p', 'WITH', 'c = p.Customer')
            ->select('o', 'p', 'c')
            ->where('o.smaregi_error_flg = 1')
            ->getQuery()
            ->getResult();

        $orders = [];
        $players = [];
```
- ec-cube-enterprise で `getSmaregiErrorOrder()` を検索すると定義箇所しか見つからず、このメソッドを呼んで使用ポイント連携を再試行するCommand/Action/Serviceは確認できない。`SmaregiUpdatePointCommand` は受注IDを1件指定して実行する入口であり、エラー受注を抽出して再連携する入口ではない。

ec-cube-enterprise の SmaregiUpdatePointCommand は orderId 1件指定の使用ポイント連携バッチ: `ec-cube-enterprise/src/Eccube/Command/SmaregiUpdatePointCommand.php:26-66`
```php
#[AsCommand(name: 'eccube:smaregi:update-point', description: 'スマレジ使用ポイント連携バッチ')]
class SmaregiUpdatePointCommand extends Command
{
    public function __construct(
        private readonly SmaregiUpdatePointAction $smaregiUpdatePointAction,
    ) {
        parent::__construct();
    }

    #[\Override]
    protected function configure(): void
    {
        $this->addArgument('orderId', InputArgument::OPTIONAL, '対象受注ID', '');
    }

    #[\Override]
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $orderId = $input->getArgument('orderId');
        if ($orderId === '') {
            $io->success('orderId が未入力のため、処理をスキップして正常終了しました');

            return Command::SUCCESS;
        }

        if (!is_numeric($orderId)) {
            $io->error('orderId は数値で指定してください');

            return Command::FAILURE;
        }

        $io->text(sprintf('スマレジ使用ポイント連携バッチ開始 orderId=%s', $orderId));

        try {
            $this->smaregiUpdatePointAction->handle((int) $orderId);
        } catch (\Throwable $e) {
            $io->error([
                'スマレジ使用ポイント連携処理でエラーが発生しました',
                $e->getMessage(),
```

ec-cube-enterprise の既存再連携バッチは在庫変動Webhook用で使用ポイント連携ではない: `ec-cube-enterprise/src/Eccube/Command/SmaregiStockBackfillCommand.php:27-69`
```php
 * スマレジ在庫変動 Webhook 連携エラー再連携バッチ。
 *
 * スマレジ側 Webhook にリトライ機構が無いため、受信失敗した在庫変動を後追いで補完する。
 * 全店舗閉店後に 1 回起動する想定 (スケジュールは Step Functions 等の外部設定)。
 */
#[AsCommand(name: 'eccube:smaregi:stock:backfill', description: 'スマレジ在庫変動Webhook連携エラー再連携バッチ (未連携の在庫変動を子ジョブとして enqueue する)')]
class SmaregiStockBackfillCommand extends Command
{
    public function __construct(
        private readonly SmaregiStockBackfillAction $stockBackfillAction,
    ) {
        parent::__construct();
    }

    #[\Override]
    protected function configure(): void
    {
        $this->addArgument('target-date', InputArgument::OPTIONAL, '取得対象日 (未指定時は駆動日)', '');
    }

    #[\Override]
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        /** @var string $targetDate */
        $targetDate = $input->getArgument('target-date');

        $io->text('スマレジ在庫変動Webhook連携エラー再連携バッチ開始');

        try {
            $summary = $this->stockBackfillAction->handle($targetDate === '' ? null : $targetDate);
        } catch (\Throwable $e) {
            $io->error([
                'スマレジ在庫変動再連携処理でエラーが発生しました',
                $e->getMessage(),
            ]);

            return Command::FAILURE;
        }

        $message = sprintf(
            'スマレジ在庫変動再連携処理が完了しました。対象日=%s 対象(商品×店舗)=%d件 取得=%d件 再連携(enqueue)=%d件 スキップ=%d件 失敗=%d件',
```

ec-cube-enterprise の非同期ハンドラは個別メッセージ処理であり、エラー受注一覧を拾う再連携バッチではない: `ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:31-118`
```php
/**
 * 注文完了時の使用ポイントをスマレジ会員ポイントへ反映する非同期ハンドラ.
 *
 * MessengerJob 行を悲観ロックして重複実行を防ぎ、PENDING/FAILED のときのみ PROCESSING へ遷移する。
 * 失敗時は Order.smaregiErrorFlg / pointErrorMessage に記録したうえで FAILED にして例外を再送出し、
 * Messenger のリトライに委ねる（管理画面の受注編集画面で連携失敗を確認できるようにする）。
 */
#[AsMessageHandler]
final readonly class SmaregiOrderUsePointMessageHandler
{
    public function __construct(
        private LoggerInterface $logger,
        private EntityManagerInterface $entityManager,
        private SmaregiMessengerJobProcessingLock $smaregiMessengerJobProcessingLock,
        private MessengerJobRepository $messengerJobRepository,
        private OrderRepository $orderRepository,
        private SmaregiCustomerService $smaregiCustomerService,
        private SmaregiMessengerJobContext $smaregiMessengerJobContext,
        private SmaregiPointPushLogService $smaregiPointPushLogService,
    ) {
    }

    public function __invoke(SmaregiOrderUsePointMessage $message): void
    {
        $Job = $this->messengerJobRepository->find($message->getJobId());
        if (!$Job instanceof MessengerJob) {
            $this->logger->error('MessengerJob not found for SmaregiOrderUsePointMessage', [
                'jobId' => $message->getJobId(),
                'orderId' => $message->getOrderId(),
            ]);

            return;
        }

        $this->smaregiMessengerJobContext->setJobId((int) $Job->getId());
        try {
            if (!$this->smaregiMessengerJobProcessingLock->tryBeginProcessingJob($Job)) {
                return;
            }

            $Order = $this->orderRepository->find($message->getOrderId());
            if (!$Order instanceof Order) {
                $this->failJob($Job, '受注が見つかりません (orderId='.$message->getOrderId().').');

                return;
            }

            $smaregiId = $Order->getCustomer()?->getPlayer()?->getSmaregiId();
            if ($smaregiId === null || $smaregiId === '') {
                $this->completeJobSkipped($Job, 'スマレジ未連携の会員のため使用ポイント連携をスキップしました。');

                return;
            }

            $spendedPoints = $Order->getSpendedPoints();
            if ($spendedPoints === null || $spendedPoints === 0) {
                $this->completeJobSkipped($Job, '使用ポイントが 0 のため連携をスキップしました。');

                return;
            }

            try {
                // 使用ポイントはスマレジ会員ポイントから減算するため負値で連携する。
                $response = $this->smaregiCustomerService->postSmaregiPoint($smaregiId, -$spendedPoints, false);
            } catch (\Throwable $e) {
                // postSmaregiPoint は通常例外を投げないが、想定外例外は適用有無が不明なため自動リトライせず手動照合へ回す。
                $this->markOrderError($Order, $e->getMessage());
                $this->failJob($Job, 'スマレジ会員ポイント更新で想定外の例外が発生しました（適用有無不明・要手動照合）: '.$e->getMessage());

                return;
            }

            if (!array_key_exists('result', $response)) {
                $error = json_encode($response, JSON_UNESCAPED_UNICODE) ?: 'スマレジ会員ポイント更新に失敗しました。';
                $this->markOrderError($Order, $error);

                // ポイント加算API(point/add)は相対加算で非冪等。加算API実行後（statusCode あり）の失敗は
                // 適用済みの可能性があり、自動リトライすると二重加算になりうるため再送出せず FAILED にして手動照合へ回す。
                if (array_key_exists('statusCode', $response)) {
                    $this->failJob($Job, 'スマレジ会員ポイント更新が不確定な状態で失敗しました（自動リトライ不可・要手動照合）: '.$error);

                    return;
                }

                // 加算API実行前の失敗（トークン取得 / customerId 解決）＝外部未適用が確定しているため再送出して再試行する。
                $this->failJob($Job, 'スマレジ会員ポイント更新に失敗しました（外部未適用・再試行）: '.$error);

                throw new \RuntimeException($error);
```
- ベース実装 pf-eccube3 では、`SmaregiBatch` が `checkSmaregiErrorOrder` を `CheckSmaregiErrorOrder` に対応付けている。`CheckSmaregiErrorOrder` は `getSmaregiErrorOrder()` で `smaregiErrorFlg = 1` の受注を取得し、スマレジポイント連携を再実行して、成功時はエラーフラグを false に戻す。

ベース実装 pf-eccube3 は smaregi:batch checkSmaregiErrorOrder を登録する: `pf-eccube3/app/Plugin/HareruyaEc/Command/SmaregiBatch.php:12-44`
```php
    const BATCH_NAMES = [
        'createCustomer' => 'Plugin\HareruyaEc\Service\Smaregi\CreateCustomer',
        'checkCustomer' => 'Plugin\HareruyaEc\Service\Smaregi\CheckCustomer',
        'updatePoint' => 'Plugin\HareruyaEc\Service\Smaregi\UpdatePoint',
        'checkSmaregiErrorOrder' => 'Plugin\HareruyaEc\Service\Smaregi\CheckSmaregiErrorOrder',
        'checkSmaregiTransaction' => 'Plugin\HareruyaEc\Service\Smaregi\CheckSmaregiTransaction',
    ];

    const LAST_ARG = 10;

    protected function configure()
    {
        $this->setName('smaregi:batch')
            ->setDescription('smaregi batchs')
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
```

ベース実装 pf-eccube3 の CheckSmaregiErrorOrder はエラー受注を取得して再連携する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Smaregi/CheckSmaregiErrorOrder.php:24-49`
```php
    /**
     * Retry the linkage of an order where the Smaregi linkage failed
     */
    public function execute()
    {
        $app = $this->app;

        $orders = $app['hareruya_ec.repository.order_sub']->getSmaregiErrorOrder();

        foreach ($orders as $order) {
            $orderSub = $order['orderSub'];
            $player = $order['player'];
            $response = $app['hareruya_ec.service.smaregi_customer']->postSmaregiPoint($player->getSmaregiId(), $player->getPoint(), true);
            if (array_key_exists('result', $response)) {
                $orderSub->setSmaregiErrorFlg(false);
            } else {
                $orderSub->setPointErrorMessage(json_encode($response, JSON_UNESCAPED_UNICODE));
            }
            $app['orm.em']->persist($orderSub);

            // 1秒当たり10回のリクエストを超えないようにインターバルを調整
            // ref. https://www1.smaregi.jp/control/configuration/webapi/modal/downloadSpecModal.html?division=1
            usleep(100000);
        }

        $app['orm.em']->flush();
```

ベース実装 pf-eccube3 の DtbOrderSubRepository は smaregiErrorFlg=1 の受注を取得する: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbOrderSubRepository.php:177-190`
```php
    /**
     * スマレジ連携エラーの受注を取得
     *
     * @return array
     */
    public function getSmaregiErrorOrder()
    {
        $qb = $this->createQueryBuilder('os');
        $results = $qb->join('os.order', 'o')
            ->join('o.Customer', 'c')
            ->join('Plugin\HareruyaEc\Entity\DtbPlayer', 'p', 'WITH', 'c = p.customer')
            ->select('os', 'p', 'o', 'c')
            ->where('os.smaregiErrorFlg = 1')
            ->getQuery()
```

# 根拠
- 設計：
  - B08-06 は失敗時のエラー記録だけでなく、スマレジEC受注連携エラー再連携バッチで再試行できることを要求している: `hareruya-design-docs/excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html:1710-1730`
- ec-cube-enterprise：
  - エラー保存処理はあるが、これは再連携バッチ入口ではない: `ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php:53-78`
  - エラー受注抽出メソッドは存在するが、`rg getSmaregiErrorOrder\(` では定義箇所のみで呼び出し元が見つからない: `ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:930-945`
  - 既存の在庫変動Webhook再連携バッチは使用ポイント連携の再連携ではない: `ec-cube-enterprise/src/Eccube/Command/SmaregiStockBackfillCommand.php:27-69`
  - 非同期ハンドラのMessengerリトライは個別メッセージの再送であり、エラー受注一覧を抽出する再連携バッチではない: `ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:31-118`
- ベース実装：
  - pf-eccube3 は `smaregi:batch checkSmaregiErrorOrder` を登録している: `pf-eccube3/app/Plugin/HareruyaEc/Command/SmaregiBatch.php:12-44`
  - pf-eccube3 の `CheckSmaregiErrorOrder` はエラー受注を取得し、再連携成功時にエラーフラグを解除する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Smaregi/CheckSmaregiErrorOrder.php:24-49`
  - pf-eccube3 の再連携対象抽出は `smaregiErrorFlg = 1` を条件にしている: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbOrderSubRepository.php:177-190`

# 確認メモ
- 確認コマンド: `rg -n "8f137fc2f6f8|スマレジEC受注連携エラー再連携|再連携|SmaregiUpdatePointAction|point_error|smaregi_error|UpdatePoint|smaregi.*error" design_impl_drift_report/findings/b08-06_0408_sheet-8_sheet.json excel_to_html/output/0408_基本設計仕様書\(バッチ_会員\).html`
- 確認コマンド: `rg -n "getSmaregiErrorOrder\(|SmaregiUpdatePointAction|SmaregiUpdatePointCommand|SmaregiOrderUsePointMessageHandler|SmaregiStockBackfillCommand|stock:backfill|smaregi_error_flg|pointErrorMessage" ../ec-cube-enterprise/src/Eccube ../ec-cube-enterprise/app -g '*.php' -g '*.yaml'`
- 確認コマンド: `rg -n "CheckSmaregiErrorOrder|checkSmaregiErrorOrder|smaregi:batch|SmaregiBatch|getSmaregiErrorOrder|smaregiErrorFlg|postSmaregiPoint" ../pf-eccube3/app/Plugin/HareruyaEc/Command ../pf-eccube3/app/Plugin/HareruyaEc/Service/Smaregi ../pf-eccube3/app/Plugin/HareruyaEc/Repository -g '*.php'`

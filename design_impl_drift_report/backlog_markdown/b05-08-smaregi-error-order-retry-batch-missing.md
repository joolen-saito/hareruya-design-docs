/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ受注管理
機能：スマレジEC受注連携エラー再連携
課題カテゴリ：実装漏れ
課題：スマレジ連携エラーEC受注を一覧取得して再連携するバッチが未実装
設計書：0405_基本設計仕様書(バッチ_受注管理).xlsx

# 再現手順【必須】
1. 設計書 B05-08 の利用者視点の入口で、実行方法が `smaregi:batch checkSmaregiErrorOrder` とされていることを確認する
2. ベース実装 pf-eccube3 の `SmaregiBatch` が `checkSmaregiErrorOrder` を受け付け、エラー受注一覧を取得して受注ごとにスマレジポイント再連携を行うことを確認する
3. ec-cube-enterprise の `src/Eccube/Command` と設定を検索し、`smaregi:batch checkSmaregiErrorOrder` または同等のエラー受注再連携バッチが登録されているか確認する
4. ec-cube-enterprise では `OrderRepository::getSmaregiErrorOrder()` が存在するものの呼び出し元がなく、実行可能な近接処理は単一 `orderId` を受け取る `eccube:smaregi:update-point` であることを確認する

# 期待される挙動【必須】
- スマレジ連携エラーEC受注再連携は `smaregi:batch checkSmaregiErrorOrder` で実行できる
- スマレジ連携エラーフラグが立っているEC受注と会員情報を一覧取得する
- 受注ごとに会員のスマレジIDとポイント残高でスマレジポイント連携をリトライする
- 連携成功時は対象受注のスマレジ連携エラーフラグを解除し、連携失敗時はポイント連携エラーメッセージにレスポンス内容を記録する
- 1秒あたりのリクエスト上限を超えないよう、受注ごとに短いインターバルを挟む

# 現在の挙動【必須】
- ec-cube-enterprise には設計の `smaregi:batch checkSmaregiErrorOrder` コマンドや同等のエラー受注一覧再連携バッチがない。近接する `eccube:smaregi:update-point` は任意の `orderId` 1件を受け取る単一受注処理で、スマレジ連携エラー受注を一覧取得して走査する入口ではない。

ec-cube-enterprise の近接コマンドは単一 orderId のスマレジ使用ポイント連携: `ec-cube-enterprise/src/Eccube/Command/SmaregiUpdatePointCommand.php:26-74`
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
            ]);

            return Command::FAILURE;
        }

        $io->success(sprintf('スマレジ使用ポイント連携処理が完了しました。orderId=%s', $orderId));

        return Command::SUCCESS;
```

ec-cube-enterprise の近接Actionは単一 orderId を find して処理する: `ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php:32-79`
```php
    public function handle(int $orderId): void
    {
        $order = $this->orderRepository->find($orderId);
        if ($order === null) {
            return;
        }

        $suspendPoint = $order->getSpendedPoints();
        if ($suspendPoint === null || $suspendPoint === 0) {
            return;
        }

        $customer = $order->getCustomer();
        if ($customer === null) {
            return;
        }
        $player = $this->playerRepository->findOneByCustomer($customer);
        if ($player === null) {
            return;
        }

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
    }
```

ec-cube-enterprise にはエラー受注抽出メソッドがあるが呼び出し元がない: `ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:889-923`
```php
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

        foreach ($results as $result) {
            if ($result instanceof Order) {
                $orders[] = $result;
            }

            if ($result instanceof DtbPlayer) {
                $players[$result->getCustomer()->getId()] = $result;
            }
        }

        $returnArray = [];

        foreach ($orders as $order) {
            $returnArray[] = [
                'order' => $order,
                'player' => $players[$order->getCustomer()->getId()],
            ];
        }

        return $returnArray;
    }
```
- ベース実装(pf-eccube3)では `smaregi:batch` が `checkSmaregiErrorOrder` を受け付け、エラー受注一覧を取得して受注ごとに `postSmaregiPoint()` を実行する。成功時はエラーフラグを解除し、失敗時はレスポンスを `pointErrorMessage` に保存し、受注ごとに `usleep(100000)` でインターバルを挟む。

ベース実装 pf-eccube3 は smaregi:batch checkSmaregiErrorOrder を登録する: `pf-eccube3/app/Plugin/HareruyaEc/Command/SmaregiBatch.php:12-26`
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
```

ベース実装 pf-eccube3 は開始・完了日時を出してサービスを実行する: `pf-eccube3/app/Plugin/HareruyaEc/Command/SmaregiBatch.php:37-52`
```php
        $name = $input->getArgument('batch_name');
        $batchNames = self::BATCH_NAMES;
        $resultMessage = '[' . date('Y/m/d H:i') . '] ';

        if (!isset($batchNames[$name])) {
            echo $resultMessage . " Nothing args or command.\n";

            return 1;
        }

        $accountList = new $batchNames[$name]($app, $this->createOptions($input));
        echo sprintf("Command start:%s \n", date('Y/m/d H:i:s'));
        $accountList->execute();
        echo sprintf("Command complete:%s \n", date('Y/m/d H:i:s'));

        return 0;
```

ベース実装 pf-eccube3 はエラー受注一覧を走査し、成功/失敗で状態更新し、受注ごとにインターバルを挟む: `pf-eccube3/app/Plugin/HareruyaEc/Service/Smaregi/CheckSmaregiErrorOrder.php:27-50`
```php
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
    }
```

ベース実装 pf-eccube3 は smaregiErrorFlg=1 の受注サブと選手情報を取得する: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbOrderSubRepository.php:182-212`
```php
    public function getSmaregiErrorOrder()
    {
        $qb = $this->createQueryBuilder('os');
        $results = $qb->join('os.order', 'o')
            ->join('o.Customer', 'c')
            ->join('Plugin\HareruyaEc\Entity\DtbPlayer', 'p', 'WITH', 'c = p.customer')
            ->select('os', 'p', 'o', 'c')
            ->where('os.smaregiErrorFlg = 1')
            ->getQuery()
            ->getResult();

        $orderSubs = [];
        $players = [];
        foreach ($results as $result) {
            if ($result instanceof DtbOrderSub) {
                $orderSubs[] = $result;
            }
            if ($result instanceof DtbPlayer) {
                $players[$result->getCustomerId()] = $result;
            }
        }
        $returnArray = [];
        foreach ($orderSubs as $orderSub) {
            $returnArray[] = [
                'orderSub' => $orderSub,
                'player' => $players[$orderSub->getOrder()->getCustomer()->getId()]
            ];
        }

        return $returnArray;
    }
```

# 根拠
- 設計：
  - B05-08 はスマレジ連携エラーフラグが立っている注文を取得し、スマレジ連携をリトライすることを要求している: `hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1905-1924`
  - B05-08 の利用者視点の入口は `smaregi:batch checkSmaregiErrorOrder` で、受注ごとの再連携とインターバルを要求している: `hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1935-1965`
  - B05-08 は成功/失敗時の副作用と流量制御を定義している: `hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1967-1992`
- ec-cube-enterprise：
  - enterprise の実行可能な近接コマンドは単一 `orderId` の `eccube:smaregi:update-point` で、B05-08の一覧再連携入口ではない: `ec-cube-enterprise/src/Eccube/Command/SmaregiUpdatePointCommand.php:26-74`
  - enterprise の近接Actionは単一 `orderId` を処理し、B05-08のエラー受注一覧を走査しない: `ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php:32-79`
  - enterprise にエラー受注抽出メソッドは存在するが検索上呼び出し元がなく、B05-08バッチとして未配線: `ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:889-923`
  - 共通HTTPクライアントのRateLimiter待機はあるが、未実装のB05-08エラー受注一覧再連携フローに組み込まれた受注ごとのインターバルではない: `ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiGuzzleClientFactory.php:84-95`
- ベース実装：
  - pf-eccube3 は `isSync=true` の場合にスマレジポイント更新を絶対値モードにする: `pf-eccube3/app/Plugin/HareruyaEc/Service/Smaregi/CustomerService.php:570-578`
  - pf-eccube3 は `smaregi:batch` の batch_name として `checkSmaregiErrorOrder` を受け付ける: `pf-eccube3/app/Plugin/HareruyaEc/Command/SmaregiBatch.php:12-26`
  - pf-eccube3 はエラー受注一覧を走査してポイント再連携、成否更新、受注ごとのインターバルを行う: `pf-eccube3/app/Plugin/HareruyaEc/Service/Smaregi/CheckSmaregiErrorOrder.php:27-50`
  - pf-eccube3 は smaregiErrorFlg=1 の受注サブと選手情報を抽出する: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbOrderSubRepository.php:182-212`

# 確認メモ
- 確認コマンド: `rg -n "B05-08|スマレジEC受注連携エラー再連携|checkSmaregiErrorOrder|smaregi:batch|スマレジ連携エラーフラグ|インターバル" excel_to_html/output/0405_基本設計仕様書\(バッチ_受注管理\).html`
- 確認コマンド: `rg -n "checkSmaregiErrorOrder|smaregi:batch|SmaregiErrorOrder|getSmaregiErrorOrder|SmaregiUpdatePoint|update-point|sleep\(|usleep\(|RateLimiter|interval" ../ec-cube-enterprise/src ../ec-cube-enterprise/app/config 2>/dev/null`
- 確認コマンド: `rg -n "checkSmaregiErrorOrder|SmaregiErrorOrder|getSmaregiErrorOrder|smaregi:batch|postSmaregiPoint|usleep\(|sleep\(" ../pf-eccube3/app/Plugin/HareruyaEc 2>/dev/null`
- codex gpt-5.5 high reviewer Schrodinger: VERIFIED。B05-08のコマンド入口・エラー受注一覧処理・受注ごとのインターバルは、同一の `smaregi:batch checkSmaregiErrorOrder` バッチ未配線として統合するのが妥当。enterprise の共通RateLimiterはHTTPクライアントの待機であり、B05-08のエラー受注一覧再連携ループを提供しない。
- レビュー指摘どおり、設計HTMLの `DBへの登録・更新・削除は行わない` という生成文は、同じ設計内の成功時エラーフラグ解除・失敗時エラーメッセージ記録・pf-eccube3実装と矛盾するため根拠には使わない。
- B05-08の3候補（コマンド入口、エラー受注一覧処理、受注ごとのインターバル）は、同じ `smaregi:batch checkSmaregiErrorOrder` バッチ未配線を指すため1件に統合する。
- enterprise の `OrderRepository::getSmaregiErrorOrder()` は設計に近い抽出を持つが、検索上呼び出し元がなく、実行可能な近接処理は単一 `orderId` の `eccube:smaregi:update-point` である。

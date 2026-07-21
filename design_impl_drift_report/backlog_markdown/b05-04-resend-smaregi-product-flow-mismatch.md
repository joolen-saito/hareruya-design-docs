/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ受注管理
機能：スマレジ商品再連携
課題カテゴリ：実装違い
課題：スマレジ商品再連携バッチの入口・対象抽出・未連携区分別再連携が設計と不一致
設計書：0405_基本設計仕様書(バッチ_受注管理).xlsx

# 再現手順【必須】
1. 設計書 B05-04 の実行方法が `order:batch resendSmaregiProduct` で、スマレジ商品コード登録済み・削除フラグなし・商品または在庫が未連携の注文を対象にすることを確認する
2. ベース実装 pf-eccube3 の `OrderBatch` と `ResendSmaregiProduct` が、商品未連携なら `product`、在庫未連携なら `stock` だけを `postSmaregiProcess()` に渡すことを確認する
3. ec-cube-enterprise のコマンド・サービス・Repositoryを検索し、`order:batch resendSmaregiProduct` または同等のB05-04専用入口があるか確認する
4. ec-cube-enterprise で設計条件に近い `OrderRepository::getResendSmaregiProduct()` が存在するものの呼び出し元がなく、実行可能な近接経路は `eccube:order:otc-smaregi-post` から `findTargetOrdersForSmaregiPost()` を呼ぶ別条件の処理であることを確認する

# 期待される挙動【必須】
- スマレジ商品再連携は `order:batch resendSmaregiProduct` 相当のバッチ入口から実行できる
- 再連携対象は、スマレジ商品コードが登録済み、スマレジ削除フラグが未設定、かつスマレジ商品連携またはスマレジ在庫連携のどちらかが未連携の注文とする
- 商品連携が未完了の場合だけ商品連携を、在庫連携が未完了の場合だけ在庫連携を再実行する
- 商品または在庫の再連携に失敗した場合は、発生したスマレジ連携ごとに管理者へ通知する

# 現在の挙動【必須】
- ec-cube-enterprise にはB05-04条件に近い `OrderRepository::getResendSmaregiProduct()` があるが、検索上このメソッドを呼ぶコマンド/サービスがない。実行可能な近接経路は `eccube:order:otc-smaregi-post` で、`SmaregiOtcOrderPostAction` は `findTargetOrdersForSmaregiPost()` を呼ぶため、設計の `order:batch resendSmaregiProduct` 入口と未連携区分別再連携フローになっていない。

ec-cube-enterprise の実行可能な近接コマンドは別名の店頭受取スマレジ連携バッチ: `ec-cube-enterprise/src/Eccube/Command/OtcOrderSmaregiPostCommand.php:25-63`
```php
#[AsCommand(name: 'eccube:order:otc-smaregi-post', description: '店頭受取注文のスマレジ連携バッチ')]
class OtcOrderSmaregiPostCommand extends Command
{
    public function __construct(
        private readonly SmaregiOtcOrderPostAction $smaregiOtcOrderPostAction,
    ) {
        parent::__construct();
    }

    #[\Override]
    protected function configure(): void
    {
    }

    #[\Override]
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $io->text('店頭受取注文スマレジ連携バッチ開始');

        try {
            // 現在時刻から30分前の時刻を取得
            $now = new \DateTime();
            $thirtyMinutesAgo = $now->modify('-30 minutes');

            $this->smaregiOtcOrderPostAction->handle($thirtyMinutesAgo);
        } catch (\Throwable $e) {
            $io->error([
                '店頭受取注文スマレジ連携処理でエラーが発生しました',
                $e->getMessage(),
            ]);

            return Command::FAILURE;
        }

        $io->success('店頭受取注文スマレジ連携処理が完了しました。');

        return Command::SUCCESS;
```

ec-cube-enterprise の近接経路は findTargetOrdersForSmaregiPost を呼ぶ: `ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOtcOrderPostAction.php:39-82`
```php
    public function handle(\DateTime $targetDateTime): void
    {
        // 対象受注を取得
        $Orders = $this->orderRepository->findTargetOrdersForSmaregiPost($targetDateTime);

        if ($Orders === []) {
            log_info('対象受注はありません。', ['targetDateTime' => $targetDateTime]);

            return;
        }

        $failedOrderIds = [];
        foreach ($Orders as $Order) {
            // 抽出条件で店舗情報.スマレジ店舗IDと店舗コードをnot null指定で取得している
            $BaseInfo = $Order->getBaseInfo();
            $smaregiShopId = $BaseInfo->getSmaregiShopId();
            $orderNumber = $Order->getOrderNumber();

            // スマレジ商品用バーコードの採番
            $smaregiCode = $this->getProductBarcode('20', '1', sprintf('%03d', $smaregiShopId), $orderNumber);
            // スマレジ用商品コード(バーコード)登録
            $Order->setSmaregiCode($smaregiCode);
            $this->entityManager->persist($Order);

            try {
                $Job = $this->dispatcher->dispatch($Order);
                log_info('店頭受取注文スマレジ連携ジョブを enqueue しました', [
                    'orderId' => $Order->getId(),
                    'jobId' => $Job->getId(),
                    'smaregiCode' => $smaregiCode,
                ]);
            } catch (\Throwable $e) {
                $failedOrderIds[] = $Order->getId();
                log_error('店頭受取注文スマレジ連携ジョブの enqueue に失敗しました', [
                    'orderId' => $Order->getId(),
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if ($failedOrderIds !== []) {
            throw new \RuntimeException(sprintf('店頭受取注文スマレジ連携ジョブの enqueue に失敗した受注があります (orderIds=%s)', implode(',', $failedOrderIds)));
        }
    }
```

ec-cube-enterprise のB05-04形の対象抽出メソッドは存在するが呼び出し元がない: `ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:753-768`
```php
    public function getResendSmaregiProduct(): mixed
    {
        $qb = $this->createQueryBuilder('os');

        return $qb->where('os.smaregi_code is not null')
            ->andWhere('os.smaregi_del_flg = :delFlg')
            ->andWhere($qb->expr()->orX(
                $qb->expr()->eq('os.smaregi_product_flg', ':productFlg'),
                $qb->expr()->eq('os.smaregi_stock_flg', ':stockFlg')
            ))
            ->setParameter('delFlg', Constant::DISABLED)
            ->setParameter('productFlg', Constant::DISABLED)
            ->setParameter('stockFlg', Constant::DISABLED)
            ->getQuery()
            ->getResult();
    }
```

ec-cube-enterprise の実行経路側の抽出はB05-04のOR条件ではなく別条件: `ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1814-1832`
```php
    public function findTargetOrdersForSmaregiPost(\DateTime $targetDateTime): array
    {
        $qb = $this->createQueryBuilder('o');
        $qb->select('o, bi')
            ->where('o.order_date < :targetDateTime')
            ->join('o.baseInfo', 'bi')
            ->andWhere('bi.smaregi_shop_id IS NOT NULL')
            ->andWhere('bi.smaregi_shop_code IS NOT NULL')
            ->join('o.Shippings', 's')
            ->andWhere('s.Delivery IN (:delivery)')
            ->setParameter('delivery', [Delivery::OTC, Delivery::SMOOTH_OTC])
            ->andWhere('o.smaregi_product_flg = false')
            ->andWhere('o.smaregi_stock_flg = false')
            ->andWhere('o.order_number IS NOT NULL')
            ->andWhere('o.OrderStatus IN (:orderStatus)')
            ->setParameter('targetDateTime', $targetDateTime)
            ->setParameter('orderStatus', [OrderStatus::NEW, OrderStatus::PAY_WAIT, OrderStatus::PAID, OrderStatus::PICKED, OrderStatus::PICKING]);

        return $qb->getQuery()->getResult();
```
- ベース実装(pf-eccube3)では `order:batch resendSmaregiProduct` が `ResendSmaregiProduct` に対応し、対象抽出後に商品未連携なら `product`、在庫未連携なら `stock` を個別に `postSmaregiProcess()` へ渡す。設計の「未連携区分のみ再連携」と一致している。

ベース実装 pf-eccube3 は order:batch resendSmaregiProduct を登録する: `pf-eccube3/app/Plugin/HareruyaEc/Command/OrderBatch.php:12-30`
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

ベース実装 pf-eccube3 は未連携区分だけを再連携対象にする: `pf-eccube3/app/Plugin/HareruyaEc/Service/Order/ResendSmaregiProduct.php:27-43`
```php
    public function execute()
    {
        $transport = new \Swift_SmtpTransport('localhost', 25);
        $transport->setUsername($this->app['config']['HareruyaEc']['const']['swiftmailer_user']);
        $transport->setPassword('');
        $this->app['mailer'] = new \Swift_Mailer($transport);

        foreach ($this->app['hareruya_ec.repository.order_sub']->getResendSmaregiProduct() as $orderSub) {
            $processes = [];
            if (!$orderSub->getSmaregiProductFlg()) {
                $processes[] = 'product';
            }
            if (!$orderSub->getSmaregiStockFlg()) {
                $processes[] = 'stock';
            }
            $this->app['hareruya_ec.service.smaregi']->postSmaregiProcess($orderSub, $processes);
        }
```

ベース実装 pf-eccube3 はB05-04条件で再連携対象を抽出する: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbOrderSubRepository.php:137-154`
```php
    public function getResendSmaregiProduct()
    {
        $qb = $this->createQueryBuilder('os');

        return $qb->where('os.smaregiCode is not null')
            ->andWhere('os.smaregiDelFlg = :delFlg')
            ->andWhere($qb->expr()->orX(
                $qb->expr()->eq('os.smaregiProductFlg', ':productFlg'),
                $qb->expr()->eq('os.smaregiStockFlg', ':stockFlg')
            ))
            ->setParameters([
                'delFlg' => Constant::DISABLED,
                'productFlg' => Constant::DISABLED,
                'stockFlg' => Constant::DISABLED,
            ])
            ->getQuery()
            ->getResult();
    }
```

ベース実装 pf-eccube3 は商品/在庫連携失敗時にスマレジ通信エラーメールを送る: `pf-eccube3/app/Plugin/HareruyaEc/Service/SmaregiService.php:61-84`
```php
        // 商品情報更新
        if (in_array('product', $processes)) {
            $result = $this->cURLSmaregi($optionValues[MtbOption::SMAREGI_REQUEST_URL], $header, 'product_upd', json_encode($this->getProductParams($orderSub, $optionValues)));
            if (is_null($result) || !array_key_exists('result', $result)) {
                $app['hareruya_ec.service.mail']->sendSmaregiErrorMail($result, 'product_upd', $orderSub->getOrderNumber());

                return;
            }
            $orderSub->setSmaregiProductFlg(true)
                ->setSmaregiDelFlg(false);
            $app['orm.em']->persist($orderSub);
            $app['orm.em']->flush();
        }
        // 在庫情報更新
        if (in_array('stock', $processes)) {
            $result = $this->cURLSmaregi($optionValues[MtbOption::SMAREGI_REQUEST_URL], $header, 'stock_upd', json_encode($this->getStockParams($orderSub, $optionValues)));
            if (is_null($result) || !array_key_exists('result', $result)) {
                $app['hareruya_ec.service.mail']->sendSmaregiErrorMail($result, 'stock_upd', $orderSub->getOrderNumber());

                return;
            }
            $orderSub->setSmaregiStockFlg(true);
            $app['orm.em']->persist($orderSub);
            $app['orm.em']->flush();
```

# 根拠
- 設計：
  - B05-04 はスマレジ商品コード登録済み・削除フラグなし・商品または在庫が未連携の注文を取得し、未連携区分を再連携することを要求している: `hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1376-1431`
  - B05-04 のリバース詳細は pf-eccube3 を挙動参照元とし、入口を `order:batch resendSmaregiProduct` と定義している: `hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1453-1488`
- ec-cube-enterprise：
  - enterprise で実行可能な近接コマンドは `eccube:order:otc-smaregi-post` で、B05-04の設計入口ではない: `ec-cube-enterprise/src/Eccube/Command/OtcOrderSmaregiPostCommand.php:25-63`
  - enterprise の近接経路は `findTargetOrdersForSmaregiPost()` を呼び、B05-04の再連携対象抽出を呼ばない: `ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOtcOrderPostAction.php:39-82`
  - enterprise にB05-04条件の抽出メソッドは存在するが、検索上呼び出し元がなくバッチとして未配線: `ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:753-768`
  - enterprise の実行経路側の抽出は商品・在庫両方の未連携をAND条件で要求し、B05-04のOR条件・未連携区分のみ再連携とは異なる: `ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1814-1832`
- ベース実装：
  - pf-eccube3 は `order:batch resendSmaregiProduct` を登録し、B05-04の入口を提供している: `pf-eccube3/app/Plugin/HareruyaEc/Command/OrderBatch.php:12-30`
  - pf-eccube3 はB05-04条件で抽出し、商品/在庫の未連携区分だけを `postSmaregiProcess()` へ渡す: `pf-eccube3/app/Plugin/HareruyaEc/Service/Order/ResendSmaregiProduct.php:27-43`
  - pf-eccube3 の対象抽出はスマレジコードあり・削除なし・商品または在庫未連携のOR条件: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbOrderSubRepository.php:137-154`

# 確認メモ
- 確認コマンド: `rg -n "B05-04|スマレジ商品再連携|resendSmaregiProduct|再連携|スマレジ通信エラー|管理者に通知|エラーメール" excel_to_html/output/0405_基本設計仕様書\(バッチ_受注管理\).html`
- 確認コマンド: `rg -n "order:batch|resendSmaregiProduct|eccube:order:otc-smaregi-post|findOtcOrdersAwaitingSmaregiSync|getResendSmaregiProduct|SmaregiOtcOrderPostAction" ../ec-cube-enterprise/src/Eccube ../ec-cube-enterprise/app/config 2>/dev/null`
- 確認コマンド: `rg -n "resendSmaregiProduct|ResendSmaregiProduct|sendSmaregiErrorMail|スマレジ通信エラー|postSmaregiProcess|smaregiErrorFlg|product_upd|stock_upd" ../pf-eccube3/app/Plugin/HareruyaEc`
- B05-04の失敗時メール送信要求は本件の期待挙動に含めるが、メール送信単独候補 f001105d0d35 はB05-01の共通OTC同期メール漏れと重複しやすいため needs_review にした。

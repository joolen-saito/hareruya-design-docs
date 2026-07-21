/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ会員
機能：リニューアル時パスワードリセットメール送信
課題カテゴリ：実装漏れ
課題：リニューアル時パスワードリセットメール送信バッチが実装されていない
設計書：0408_基本設計仕様書(バッチ_会員).xlsx

# 再現手順【必須】
1. 設計書 B08-01 で、`customer:batch sendAccountMigration <基準日>` により基準日以降に更新された会員へ移行通知メールを送信する要求を確認する
2. ベース実装 pf-eccube3 の `CustomerBatch` が `sendAccountMigration` を `SendAccountMigration` に対応付けていることを確認する
3. ベース実装 pf-eccube3 の `SendAccountMigration`、`CustomerRepository::findByUpdateDateForAccountMigration()`、`MailService::sendCustomerMigrationNotificationMail()` が対象抽出・言語別テンプレート送信・履歴保存を実行することを確認する
4. ec-cube-enterprise の `src/Eccube/Command`、`src/Eccube/Service`、`src/Eccube/Repository` を検索し、`sendAccountMigration`、`customer:batch`、`CustomerMigration`、`customer_migration` を実行するバッチ入口・処理本体がないことを確認する

# 期待される挙動【必須】
- `customer:batch sendAccountMigration <基準日>` でリニューアル時パスワードリセットメール送信バッチを実行できる
- 基準日未指定時は日付指定を促して終了する
- `dtb_customer.update_date >= 基準日` かつ `reset_key IS NOT NULL` の会員を抽出し、会員ごとに移行通知メールを1通送信する
- 会員の言語・国情報に応じて `Mail/customer_migration.twig` または `Mail/customer_migration.en.twig` を使い分ける

# 現在の挙動【必須】
- ec-cube-enterprise には B08-01 用の `sendAccountMigration` コマンドや同等の移行通知バッチ本体がない。会員系バッチとしては必須項目空欄会員通知、ポイント失効、ポイント有効期限通知などが個別 Symfony Command として存在するが、`customer:batch sendAccountMigration <基準日>` または移行通知メール送信バッチは登録されていない。

ec-cube-enterprise の既存会員系バッチ例: 必須項目空欄会員通知: `ec-cube-enterprise/src/Eccube/Command/CheckBlankRequiredItemCustomerCommand.php:25-53`
```php
#[AsCommand(name: 'eccube:customer:check-blank-required-item', description: '必須項目空欄会員通知バッチ')]
class CheckBlankRequiredItemCustomerCommand extends Command
{
    public function __construct(
        private readonly CheckBlankRequiredItemCustomerAction $checkBlankRequiredItemCustomerAction,
    ) {
        parent::__construct();
    }

    #[\Override]
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->text('必須項目空欄会員通知バッチ開始');

        try {
            $this->checkBlankRequiredItemCustomerAction->handle();
        } catch (\Throwable $e) {
            $io->error([
                '必須項目空欄会員通知処理でエラーが発生しました',
                $e->getMessage(),
            ]);

            return Command::FAILURE;
        }

        $io->success('必須項目空欄会員通知処理が完了しました。');

        return Command::SUCCESS;
```

ec-cube-enterprise の既存会員系バッチ例: ポイント失効: `ec-cube-enterprise/src/Eccube/Command/LostPointsCommand.php:25-53`
```php
#[AsCommand(name: 'eccube:customer:lost-points', description: 'ポイント失効バッチ')]
class LostPointsCommand extends Command
{
    public function __construct(
        private readonly LostPointsAction $lostPointsAction,
    ) {
        parent::__construct();
    }

    #[\Override]
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->text('ポイント失効バッチ開始');

        try {
            $this->lostPointsAction->handle();
        } catch (\Throwable $e) {
            $io->error([
                'ポイント失効処理でエラーが発生しました',
                $e->getMessage(),
            ]);

            return Command::FAILURE;
        }

        $io->success('ポイント失効処理が完了しました。');

        return Command::SUCCESS;
```

ec-cube-enterprise の既存会員系バッチ例: ポイント有効期限通知: `ec-cube-enterprise/src/Eccube/Command/PointExpireNotificationCommand.php:25-53`
```php
#[AsCommand(name: 'eccube:customer:point-expire-notification', description: 'ポイント有効期限通知バッチ')]
class PointExpireNotificationCommand extends Command
{
    public function __construct(
        private readonly PointExpireNotificationAction $pointExpireNotificationAction,
    ) {
        parent::__construct();
    }

    #[\Override]
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->text('ポイント有効期限通知バッチ開始');

        try {
            $this->pointExpireNotificationAction->handle();
        } catch (\Throwable $e) {
            $io->error([
                'ポイント有効期限通知処理でエラーが発生しました',
                $e->getMessage(),
            ]);

            return Command::FAILURE;
        }

        $io->success('ポイント有効期限通知処理が完了しました。');

        return Command::SUCCESS;
```
- ec-cube-enterprise には通常のパスワード再発行メール送信処理と `customer_migration` テンプレートファイルはあるが、通常の `/forgot` フローは利用者操作で1会員へ送る処理であり、B08-01 の基準日抽出・一括送信バッチではない。`CustomerRepository` にも管理画面検索用の `update_date` 条件とユニーク reset_key 生成はあるが、`update_date >= 基準日 AND reset_key IS NOT NULL` のB08-01抽出メソッドは確認できない。

ec-cube-enterprise の通常パスワード再発行メール送信: `ec-cube-enterprise/src/Eccube/Service/MailService.php:636-689`
```php
    public function sendPasswordResetNotificationMail(Customer|RegisterCustomerView $Customer, string $reset_url): void
    {
        log_info('パスワード再発行メール送信開始');

        $MailTemplate = $this->mailTemplateRepository->findOneBy([
            'mail_key' => $this->eccubeConfig['eccube_forgot_mail_template_id'],
        ]);
        $body = $this->twig->render($MailTemplate->getFileName(), [
            'BaseInfo' => $this->BaseInfo,
            'Customer' => $Customer,
            'expire' => $this->eccubeConfig['eccube_customer_reset_expire'],
            'resetUrl' => $reset_url,
            'header' => $MailTemplate->getHeader(),
            'footer' => $MailTemplate->getFooter(),
        ]);

        $message = (new Email())
            ->subject('['.$this->BaseInfo->getShopName().'] '.$MailTemplate->getMailSubject())
            ->from(new Address($this->BaseInfo->getEmail01(), $this->BaseInfo->getShopName()))
            ->to($this->convertRFCViolatingEmail($Customer->getEmail()))
            ->bcc($this->BaseInfo->getEmail01())
            ->replyTo($this->BaseInfo->getEmail03())
            ->returnPath($this->BaseInfo->getEmail04());

        // HTMLテンプレートが存在する場合
        $htmlFileName = $this->getHtmlTemplate($MailTemplate->getFileName());
        if (!is_null($htmlFileName)) {
            $htmlBody = $this->twig->render($htmlFileName, [
                'BaseInfo' => $this->BaseInfo,
                'Customer' => $Customer,
                'expire' => $this->eccubeConfig['eccube_customer_reset_expire'],
                'reset_url' => $reset_url,
            ]);

            $message
                ->text($body)
                ->html($htmlBody);
        } else {
            $message->text($body);
        }

        $event = new EventArgs(
            [
                'message' => $message,
                'Customer' => $Customer,
                'BaseInfo' => $this->BaseInfo,
                'resetUrl' => $reset_url,
            ]
        );
        $this->eventDispatcher->dispatch($event, EccubeEvents::MAIL_PASSWORD_RESET);

        try {
            $this->mailer->send($message);
            log_info('パスワード再発行メール送信完了');
```

ec-cube-enterprise の CustomerRepository には汎用更新日検索と reset_key 生成のみがある: `ec-cube-enterprise/src/Eccube/Repository/CustomerRepository.php:277-508`
```php
        // update_date
        if (isset($searchData['update_date_start']) && StringUtil::isNotBlank($searchData['update_date_start'])) {
            $date = clone $searchData['update_date_start'];
            $qb
                ->andWhere('c.update_date >= :update_date_start')
                ->setParameter('update_date_start', $date);
        } elseif (!empty($searchData['update_date_start'])) {
            $date = clone $searchData['update_date_start'];
            $qb
                ->andWhere('c.update_date >= :update_date_start')
                ->setParameter('update_date_start', $date);
        }

        if (isset($searchData['update_date_end']) && StringUtil::isNotBlank($searchData['update_date_end'])) {
            $date = clone $searchData['update_date_end'];
            $date->modify('+1 days');
            $qb
            ->andWhere('c.update_date < :update_date_end')
            ->setParameter('update_date_end', $date);
        } elseif (!empty($searchData['update_date_end'])) {
            $date = clone $searchData['update_date_end'];
            $date->modify('+1 days');
            $qb
                ->andWhere('c.update_date < :update_date_end')
                ->setParameter('update_date_end', $date);
        }

        // last_buy
        if (isset($searchData['last_buy_date_start']) && StringUtil::isNotBlank($searchData['last_buy_date_start'])) {
            $date = $searchData['last_buy_date_start'];
            $qb
                ->andWhere('c.last_buy_date >= :last_buy_start')
                ->setParameter('last_buy_start', $date);
        } elseif (!empty($searchData['last_buy_start'])) {
            $qb
                ->andWhere('c.last_buy_date >= :last_buy_start')
                ->setParameter('last_buy_start', $searchData['last_buy_start']);
        }

        if (isset($searchData['last_buy_date_end']) && StringUtil::isNotBlank($searchData['last_buy_date_end'])) {
            $date = $searchData['last_buy_date_end'];
            $qb
                ->andWhere('c.last_buy_date < :last_buy_end')
                ->setParameter('last_buy_end', $date);
        } elseif (!empty($searchData['last_buy_end'])) {
            $date = clone $searchData['last_buy_end'];
            $date->modify('+1 days');
            $qb
                ->andWhere('c.last_buy_date < :last_buy_end')
                ->setParameter('last_buy_end', $date);
        }

        // country
        if (isset($searchData['country']) && StringUtil::isNotBlank($searchData['country'])) {
            $qb
                ->andWhere('c.Country = :country')
                ->setParameter('country', $searchData['country']);
        }

        // sell_times_start sell_times_end
        $hasSellTimeStart = isset($searchData['sell_times_start']) && StringUtil::isNotBlank($searchData['sell_times_start']);
        $hasSellTimeEnd = isset($searchData['sell_times_end']) && StringUtil::isNotBlank($searchData['sell_times_end']);

        // sell_total_start sell_total_end
        $hasSellTotalStart = isset($searchData['sell_total_start']) && StringUtil::isNotBlank($searchData['sell_total_start']);
        $hasSellTotalEnd = isset($searchData['sell_total_end']) && StringUtil::isNotBlank($searchData['sell_total_end']);

        $qb
            ->leftJoin('c.BuyOrders', 'bo')
            ->leftJoin('bo.BuyMainCards', 'bmc')
            ->leftJoin('c.Player', 'p')
            ->groupBy('c.id');

        $countExpression = 'COUNT(DISTINCT bo.id)';
        $sumExpression = 'SUM('
            .'COALESCE(bmc.price, 0) * '
            .'COALESCE(bmc.count, 0) * '
            .'CASE WHEN bmc.saleFlg = TRUE THEN 1 ELSE 0 END'
            .')';

        if ($hasSellTimeStart) {
            $qb->andHaving($qb->expr()->gte($countExpression, ':sellTimeStart'));
            $qb->setParameter('sellTimeStart', $searchData['sell_times_start']);
        }

        if ($hasSellTimeEnd) {
            $qb->andHaving($qb->expr()->lte($countExpression, ':sellTimeEnd'));
            $qb->setParameter('sellTimeEnd', $searchData['sell_times_end']);
        }

        if ($hasSellTotalStart) {
            $qb->andHaving($qb->expr()->gte($sumExpression, ':sellTotalStart'));
            $qb->setParameter('sellTotalStart', $searchData['sell_total_start']);
        }

        if ($hasSellTotalEnd) {
            $qb->andHaving($qb->expr()->lte($sumExpression, ':sellTotalEnd'));
            $qb->setParameter('sellTotalEnd', $searchData['sell_total_end']);
        }

        $qb->select('c');

        // smaregi_buy_total
        if (isset($searchData['smaregi_buy_total_start']) && StringUtil::isNotBlank($searchData['smaregi_buy_total_start'])) {
            $qb
                ->andWhere('c.smaregiBuyTotal >= :smaregi_buy_total_start')
                ->setParameter('smaregi_buy_total_start', $searchData['smaregi_buy_total_start']);
        } elseif (!empty($searchData['smaregi_buy_total_start'])) {
            $qb
                ->andWhere('c.smaregiBuyTotal >= :smaregi_buy_total_start')
                ->setParameter('smaregi_buy_total_start', $searchData['smaregi_buy_total_start']);
        }

        if (isset($searchData['smaregi_buy_total_end']) && StringUtil::isNotBlank($searchData['smaregi_buy_total_end'])) {
            $qb
                ->andWhere('c.smaregiBuyTotal <= :smaregi_buy_total_end')
                ->setParameter('smaregi_buy_total_end', $searchData['smaregi_buy_total_end']);
        } elseif (!empty($searchData['smaregi_buy_total_end'])) {
            $qb
                ->andWhere('c.smaregiBuyTotal <= :smaregi_buy_total_end')
                ->setParameter('smaregi_buy_total_end', $searchData['smaregi_buy_total_end']);
        }

        // smaregi_buy_times
        if (isset($searchData['smaregi_buy_times_start']) && StringUtil::isNotBlank($searchData['smaregi_buy_times_start'])) {
            $qb
                ->andWhere('c.smaregiBuyTimes >= :smaregi_buy_times_start')
                ->setParameter('smaregi_buy_times_start', $searchData['smaregi_buy_times_start']);
        } elseif (!empty($searchData['smaregi_buy_times_start'])) {
            $qb
                ->andWhere('c.smaregiBuyTimes >= :smaregi_buy_times_start')
                ->setParameter('smaregi_buy_times_start', $searchData['smaregi_buy_times_start']);
        }

        if (isset($searchData['smaregi_buy_times_end']) && StringUtil::isNotBlank($searchData['smaregi_buy_times_end'])) {
            $qb
                ->andWhere('c.smaregiBuyTimes <= :smaregi_buy_times_end')
                ->setParameter('smaregi_buy_times_end', $searchData['smaregi_buy_times_end']);
        } elseif (!empty($searchData['smaregi_buy_times_end'])) {
            $qb
                ->andWhere('c.smaregiBuyTimes <= :smaregi_buy_times_end')
                ->setParameter('smaregi_buy_times_end', $searchData['smaregi_buy_times_end']);
        }

        // identity_confirm_status
        if (isset($searchData['identity_confirm_status']) && StringUtil::isNotBlank($searchData['identity_confirm_status'])) {
            $qb
                ->andWhere($qb->expr()->in('p.IdentityConfirmStatus', ':identityConfirmStatuses'))
                ->setParameter('identityConfirmStatuses', $searchData['identity_confirm_status']);
        }

        // status
        if (isset($searchData['customer_status']) && StringUtil::isNotBlank($searchData['customer_status'])) {
            $qb
                ->andWhere($qb->expr()->in('c.Status', ':statuses'))
                ->setParameter('statuses', $searchData['customer_status']);
        }

        if (isset($searchData['dci_name']) && StringUtil::isNotBlank($searchData['dci_name'])) {
            $qb
                ->andWhere('LOWER(CONCAT(p.firstNameEn, p.lastNameEn)) LIKE LOWER(:dci_name)')
                ->setParameter('dci_name', '%'.str_replace(' ', '', $searchData['dci_name']).'%');
        }

        if (isset($searchData['close_reason']) && StringUtil::isNotBlank($searchData['close_reason'])) {
            $qb
                ->andWhere('c.close_reason LIKE :close_reason')
                ->setParameter('close_reason', '%'.$searchData['close_reason'].'%');
        }

        // buy_product_name
        if (isset($searchData['buy_product_name']) && StringUtil::isNotBlank($searchData['buy_product_name'])) {
            $qb
                ->leftJoin('c.Orders', 'o')
                ->leftJoin('o.OrderItems', 'oi')
                ->andWhere('oi.product_name LIKE :buy_product_name OR oi.product_code LIKE :buy_product_name')
                ->andWhere($qb->expr()->notIn('o.OrderStatus', ':order_status'))
                ->setParameter('buy_product_name', '%'.$searchData['buy_product_name'].'%')
                ->setParameter('order_status', [OrderStatus::PROCESSING, OrderStatus::PENDING]);
        }

        // Order By
        if (isset($searchData['sortkey']) && !empty($searchData['sortkey'])) {
            $sortOrder = (isset($searchData['sorttype']) && $searchData['sorttype'] == 'a') ? 'ASC' : 'DESC';
            $qb->orderBy(self::COLUMNS[$searchData['sortkey']], $sortOrder);
            $qb->addOrderBy('c.update_date', 'DESC');
            $qb->addOrderBy('c.id', 'DESC');
        } else {
            $qb->orderBy('c.update_date', 'DESC');
            $qb->addOrderBy('c.id', 'DESC');
        }

        return $this->queries->customize(QueryKey::CUSTOMER_SEARCH, $qb, $searchData);
    }

    /**
     * ユニークなシークレットキーを返す.
     */
    public function getUniqueSecretKey(): string
    {
        do {
            $key = StringUtil::random(32);
            $Customer = $this->findOneBy(['secret_key' => $key]);
        } while ($Customer);

        return $key;
    }

    /**
     * 仮会員をシークレットキーで検索する.
     *
     * @return Customer|null 見つからない場合はnullを返す.
     */
    public function getProvisionalCustomerBySecretKey(string $secretKey): ?Customer
    {
        return $this->findOneBy([
            'secret_key' => $secretKey,
            'Status' => CustomerStatus::PROVISIONAL,
        ]);
    }

    /**
     * ユニークなパスワードリセットキーを返す
     */
    public function getUniqueResetKey(): string
    {
        do {
            $key = StringUtil::random(32);
            $Customer = $this->findOneBy(['reset_key' => $key]);
        } while ($Customer);

        return $key;
```

ec-cube-enterprise には customer_migration テンプレート定数とファイルは存在する: `ec-cube-enterprise/src/Eccube/Entity/MailTemplate.php:71-72`
```php
        public const CUSTOMER_MIGRATION_JP = 36;
        public const CUSTOMER_MIGRATION_EN = 37;
```
- ベース実装(pf-eccube3)では `customer:batch` の第一引数 `sendAccountMigration` が移行通知サービスに対応付けられ、基準日未指定時の案内、対象会員抽出、会員ごとの移行通知メール送信、100件ごとの進捗出力まで実装されている。

ベース実装 pf-eccube3 の customer:batch 入口: `pf-eccube3/app/Plugin/HareruyaEc/Command/CustomerBatch.php:12-52`
```php
    const BATCH_NAMES = [
        'sendAccountMigration' => 'Plugin\HareruyaEc\Service\Customer\SendAccountMigration',
        'lostPoint' => 'Plugin\HareruyaEc\Service\Customer\LostPoints',
        'complementPointHistory' => 'Plugin\HareruyaEc\Service\Customer\ComplementPointHistory',
        'pointExpireNotification' => 'Plugin\HareruyaEc\Service\Customer\PointExpireNotification',
        'checkBlankRequiredItemCustomer' => 'Plugin\HareruyaEc\Service\Customer\CheckBlankRequiredItemCustomer',
        'adjustPointVariance' => 'Plugin\HareruyaEc\Service\Customer\AdjustPointVariance',
        'idExpireNotification' => 'Plugin\HareruyaEc\Service\Customer\IdExpireNotification',
    ];

    const LAST_ARG = 10;

    protected function configure()
    {
        $this->setName('customer:batch')
            ->setDescription('customer batchs')
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

        $accountList = new $batchNames[$name]($app, $this->createOptions($input));
        echo sprintf("Command start:%s \n", date('Y/m/d H:i:s'));
        $accountList->execute();
        echo sprintf("Command complete:%s \n", date('Y/m/d H:i:s'));
```

ベース実装 pf-eccube3 の移行通知バッチ本体: `pf-eccube3/app/Plugin/HareruyaEc/Service/Customer/SendAccountMigration.php:30-50`
```php
    public function execute()
    {
        $date = count($this->options) > 0 ? $this->options[0] : null;
        if (is_null($date)) {
            echo "日付を指定してください。\n";
            return;
        }
        $this->app['twig.loader']->addLoader(new \Twig_Loader_Filesystem([__DIR__.'/../../Resource/template/admin']));
        $i = 0;
        $transport = new \Swift_SmtpTransport('localhost', 25);
        $transport->setUsername($this->app['config']['HareruyaEc']['const']['swiftmailer_user']);
        $transport->setPassword('');

        $this->app['mailer'] = new \Swift_Mailer($transport);
        foreach ($this->app['hareruya_ec.repository.customer']->findByUpdateDateForAccountMigration($date) as $customer) {
            $this->app['hareruya_ec.service.mail']->sendCustomerMigrationNotificationMail($customer[$i]);
            $i++;
            if ($i % 100 === 0) {
                echo sprintf("Count : %s Memory : %s MB\n", $i,  memory_get_usage() / (1024 * 1024));
            }
        }
```

ベース実装 pf-eccube3 の移行通知対象抽出: `pf-eccube3/app/Plugin/HareruyaEc/Repository/CustomerRepository.php:39-52`
```php
    public function findByUpdateDateForAccountMigration(String $date)
    {
        $qb = $this->createQueryBuilder('c')
            ->leftJoin('c.Country', 'co')
            ->select('c.id, c.email, c.name01, c.name02, c.reset_key, co.id as country')
            ->where('c.update_date >= :update_date')
            ->andWhere('c.reset_key is not null')
            ->setParameter('update_date', DateTime::createFromFormat('YmdHi', $date));

        return $qb
            ->getQuery()
            ->setHydrationMode(\Doctrine\ORM\AbstractQuery::HYDRATE_SCALAR)
            ->setHint(SqlWalker::HINT_DISTINCT, true)
            ->iterate();
```

ベース実装 pf-eccube3 の移行通知メール送信: `pf-eccube3/app/Plugin/HareruyaEc/Service/MailService.php:891-935`
```php
    public function sendCustomerMigrationNotificationMail($Customer)
    {
        log_info('会員移行通知メール送信開始', ['customerId' => $Customer['id']]);

        $templateId = MailTemplate::CUSTOMER_MIGRATION_JP;
        $locale = $this->app['locale'];
        if (!is_null($Customer['country']) && $Customer['country'] !== $this->app['config']['HareruyaEc']['const']['country']['japan']['code']) {
            $templateId = MailTemplate::CUSTOMER_MIGRATION_EN;
            $locale = 'en';
        }
        $template = $this->app['eccube.repository.mail_template']->find($templateId);
        $body = $this->app->renderView($template->getFileName(), [
            'header' => $template->getHeader(),
            'footer' => $template->getFooter(),
            'Customer' => $Customer,
            'resetUrl' => UrlUtil::convDomainUrl($this->app, $this->app->url('forgot_reset', ['_locale' => $locale, 'resetKey' => $Customer['reset_key']])),
        ]);

        try {
            $message = \Swift_Message::newInstance()
                ->setSubject($template->getSubject())
                ->setFrom([$this->baseInfo->getEmail01() => $this->baseInfo->getShopName()])
                ->setTo([$Customer['email']])
                ->setReplyTo($this->baseInfo->getEmail03())
                ->setReturnPath($this->baseInfo->getEmail04())
                ->setBody($body);

            MailUtil::convertMessage($this->app, $message);
            MailUtil::setParameterForCharset($this->app, $message);

            $count = $this->app->mail($message);

            $query = "insert into dtb_user_mail_history(send_date,subject,mail_body,template_id,customer_id)
                      values(:send_date,:subject,:mail_body,:template_id,:customer_id)";
            $now = new \DateTime();
            $params = [
                'send_date' => $now->format('Y-m-d H:i:s'),
                'subject' => $template->getSubject(),
                'mail_body' => $message,
                'template_id' => $templateId,
                'customer_id' => $Customer['id'],
            ];
            $this->app['orm.em']->getConnection()->executeUpdate($query, $params);
            $this->app['orm.em']->flush();
            log_info('会員移行通知メール送信完了', ['count' => $count]);
```

# 根拠
- 設計：
  - B08-01 は pf-eccube3 を正として、基準日引数つきの移行通知メール送信バッチを要求している: `hareruya-design-docs/excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html:939-966`
  - B08-01 のAPI/バッチ結果は成功時に対象会員へ移行通知メールを送信することを定義している: `hareruya-design-docs/excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html:969-988`
- ec-cube-enterprise：
  - enterprise の会員系 Symfony Command には移行通知バッチがなく、別の会員バッチだけが登録されている: `ec-cube-enterprise/src/Eccube/Command/CheckBlankRequiredItemCustomerCommand.php:25-53`
  - enterprise の通常パスワード再発行メールは B08-01 の基準日一括送信バッチではない: `ec-cube-enterprise/src/Eccube/Service/MailService.php:636-689`
- ベース実装：
  - pf-eccube3 は `customer:batch sendAccountMigration` を登録する: `pf-eccube3/app/Plugin/HareruyaEc/Command/CustomerBatch.php:12-52`
  - pf-eccube3 は基準日未指定案内、対象抽出、メール送信、進捗出力を実装している: `pf-eccube3/app/Plugin/HareruyaEc/Service/Customer/SendAccountMigration.php:30-50`

# 確認メモ
- 確認コマンド: `rg -n "sendAccountMigration|customer:batch|customer_migration|リニューアル時パスワード|パスワード再設定キーコード|基準日" excel_to_html/output/0408_基本設計仕様書\(バッチ_会員\).html design_impl_drift_report/findings/b08-01_0408_sheet-3_sheet.json`
- 確認コマンド: `rg -n "sendAccountMigration|customer:batch|customer_migration|CustomerMigration|移行通知|日付を指定してください|CUSTOMER_MIGRATION|reset_key IS NOT NULL|reset_key.*null|update_date.*reset_key" ../ec-cube-enterprise/src/Eccube/Command ../ec-cube-enterprise/src/Eccube/Service ../ec-cube-enterprise/src/Eccube/Repository ../ec-cube-enterprise/src/Eccube/Resource ../ec-cube-enterprise/app/config -g '*.php' -g '*.twig' -g '*.yaml' -g '*.yml' -g '*.csv'`
- 確認コマンド: `rg -n "sendAccountMigration|customer:batch|customer_migration|CustomerMigration|移行通知|reset_key|パスワード再設定キー|dtb_user_mail_history" ../pf-eccube3/app/Plugin/HareruyaEc -g '*.php' -g '*.twig' -g '*.yml' -g '*.yaml' -g '*.csv'`
- 確認コマンド: `rg -n "#\[AsCommand|customer|Customer|migration|sendAccount" ../ec-cube-enterprise/src/Eccube/Command -g '*.php'`

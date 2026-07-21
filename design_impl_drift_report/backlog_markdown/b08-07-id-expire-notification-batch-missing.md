/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ会員
機能：身分証有効期限切れ通知
課題カテゴリ：実装漏れ
課題：身分証有効期限切れ通知バッチの実行処理がなく、対象者更新と通知メール送信が行われない
設計書：0408_基本設計仕様書(バッチ_会員).xlsx

# 再現手順【必須】
1. 設計書 B08-07 の処理内容で、身分証有効期限2週間前のユーザー取得、身分証有効期限のNULL更新、本人確認ステータス更新、会員向けメール、管理者向け一覧メールが要求されていることを確認する
2. ベース実装 pf-eccube3 の `CustomerBatch` を確認し、`customer:batch idExpireNotification` が `IdExpireNotification` に対応付けられていることを確認する
3. ベース実装 pf-eccube3 の `IdExpireNotification` を確認し、対象者取得、対象者なし終了、ユーザーごとの更新、会員向けメール送信、管理者向けメール送信を実行していることを確認する
4. ec-cube-enterprise の `DtbPlayerRepository::findCustomersForNotificationIdExpire()`、メールテンプレート、管理者宛先オプションを確認する
5. ec-cube-enterprise の `src/Eccube/Command`、`src/Eccube/Service/Admin/Customer`、`MailService.php` を検索し、B08-07相当のCommand/Action/Serviceおよび送信メソッドが存在しないことを確認する

# 期待される挙動【必須】
- 毎日8:00のスケジュール起動で身分証有効期限切れ通知バッチを実行できる
- 身分証有効期限が2週間前に到達したプレイヤーを取得し、対象者がいなければ処理を終了する
- 対象者ごとに `idExpirationDate` を null に更新し、オンライン本人確認の場合は本人確認ステータスを未設定または未確認へ戻す。簡易書留確認済みの場合はステータスを変更しない
- 対象会員のメールアドレス宛に件名「【晴れる屋】オンライン本人確認の更新手続きのお願い」の身分証有効期限切れ通知メールを送信する
- 処理後に対象者の会員ID・氏名一覧を作成し、`check_id_expired_mail_address` の管理者宛へ件名「身分証の有効期限切れ会員の存在を通知するメール」で送信する

# 現在の挙動【必須】
- ec-cube-enterprise には対象者抽出メソッド `findCustomersForNotificationIdExpire()`、会員向けメールテンプレート、管理者宛先オプションは存在する。しかし、これらを組み合わせてB08-07のバッチ処理として実行するCommand/Action/Serviceは確認できない。

ec-cube-enterprise には身分証有効期限2週間前相当の対象者抽出メソッドだけが存在する: `ec-cube-enterprise/src/Eccube/Repository/DtbPlayerRepository.php:155-167`
```php
    /**
     * 指定日までに有効期限を迎える身分証明書を持つプレイヤー一覧を取得
     */
    public function findCustomersForNotificationIdExpire(\DateTime $targetDate): mixed
    {
        $qb = $this->createQueryBuilder('p')
            ->select('p')
            ->where('p.idExpirationDate <= :target_date')
            ->setParameters(new ArrayCollection([
                'target_date' => $targetDate,
            ]));

        return $qb->getQuery()->getResult();
```

ec-cube-enterprise には会員向けメールテンプレート本文が存在する: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/id_expire_notification.twig:1-26`
```twig
大変お世話になっております。晴れる屋です。

平素より晴れる屋のネット買取サービスをご利用いただきまして誠にありがとうございます。

お客様が現在ご登録いただいている「オンライン本人確認」の身分証の有効期限が残り2週間を切っております。
お手数ですが下記のURLより、新しい身分証の登録をお願いします。
https://www.hareruyamtg.com/ja/mypage/identification

※現在お客様のオンライン本人確認のステータスは「未確認」に切り替わっています。
※現在進行中のお取引がある場合は身分証を更新いただくまで取引を進めることはできません。

■お問い合わせについて
ご不明な点がございましたら下記URLよりお問い合わせください。
https://www.hareruyamtg.com/ja/contact

よりよいショップを目指し、スタッフ一同頑張っていきますので、
今後とも、お引立ての程よろしくお願いいたします。

*************************************
《晴れる屋 トーナメントセンター 東京 ネット買取》
〒169-0075
東京都新宿区高田馬場3-12-2　OCビル3階
晴れる屋 ネット買取担当 宛
電話番号 03-5937-1588
URL :http://www.hareruyamtg.com/purchase/
*************************************
```

ec-cube-enterprise のメールマスタには身分証有効期限切れ通知メールが登録される: `ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:1773-1778`
```php
                'creator_id' => 1,
                'base_info_id' => 1,
                'mail_key' => 'eccube.mail.id_expire_notification',
                'name' => '身分証有効期限切れ通知メール',
                'file_name' => 'Mail/Mall/id_expire_notification.twig',
                'mail_subject' => '【晴れる屋】オンライン本人確認の更新手続きのお願い',
```

ec-cube-enterprise の管理者宛先オプションは存在する: `ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:280-284`
```php
            [
                'id' => 32,
                'option_key' => 'check_id_expired_mail_address',
                'option_value' => 'it_common@hareruyamtg.com',
                'member_id' => null,
```
- `rg` で `IdExpireNotification`、`id_expire_notification`、`sendIdExpire`、`findCustomersForNotificationIdExpire()`、件名文言を `src/Eccube/Command`、`src/Eccube/Service/Admin/Customer`、`src/Eccube/Service/MailService.php` から検索しても、B08-07の実行入口やメール送信メソッドは見つからない。B08-03/B08-04のような既存バッチCommand/Action構造はあるため、同種バッチの置き場所自体は存在するが、B08-07相当が欠落している。

ec-cube-enterprise には同種バッチのCommand構造はあるがB08-07ではない: `ec-cube-enterprise/src/Eccube/Command/PointExpireNotificationCommand.php:25-53`
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

ec-cube-enterprise には同種Action構造はあるがB08-07ではない: `ec-cube-enterprise/src/Eccube/Service/Admin/Customer/CheckBlankRequiredItemCustomerAction.php:31-42`
```php
    public function handle(): void
    {
        $blankRequiredItemCustomers = $this->customerRepository->getBlankRequiredItemCustomers();

        if (empty($blankRequiredItemCustomers)) {
            $this->logger->info('必須項目が空欄の会員は存在しません。');

            return;
        }

        $this->mailService->sendBlankRequiredItemCustomerAlertMail($blankRequiredItemCustomers);
    }
```

ec-cube-enterprise の本人確認ステータス定数は未確認=1、簡易書留確認済み=4: `ec-cube-enterprise/src/Eccube/Entity/Master/MtbIdentityConfirmStatus.php:29-36`
```php
class MtbIdentityConfirmStatus extends AbstractEntity implements \Stringable
{
    public const STATUS_UNCONFIRMED = 1;
    public const STATUS_NOW_CONFIRMING = 2;
    public const STATUS_CONFIRMED = 3;
    public const STATUS_REGISTERED_MAIL_CONFIRMED = 4;

    #[ORM\Column(name: 'id', type: Types::INTEGER, options: ['unsigned' => true, 'comment' => '本人確認ステータスID'])]
```
- ベース実装 pf-eccube3 では、`customer:batch idExpireNotification` が登録され、`IdExpireNotification` が対象者取得から更新、会員向け通知、管理者向け通知まで実行している。`MailService` には会員向け・管理者向けの専用送信メソッドがあり、管理者メール本文は `会員ID 氏名` から始まる一覧を作成する。

ベース実装 pf-eccube3 は customer:batch idExpireNotification を登録する: `pf-eccube3/app/Plugin/HareruyaEc/Command/CustomerBatch.php:12-52`
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

ベース実装 pf-eccube3 の IdExpireNotification は対象者取得・更新・通知を実行する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Customer/IdExpireNotification.php:31-64`
```php
    public function execute()
    {
        $app = $this->app;
        $now = new \DateTime();

        $app['twig.loader']->addLoader(new \Twig_Loader_Filesystem([__DIR__.'/../../Resource/template/default']));
        $transport = new \Swift_SmtpTransport('localhost', 25);
        $transport->setUsername($app['config']['HareruyaEc']['const']['swiftmailer_user']);
        $transport->setPassword('');
        $app['mailer'] = new \Swift_Mailer($transport);

        $daysBefore = $app['config']['HareruyaEc']['const']['days_before_expiration_warning'];
        $targetDate = (clone $now)->modify("+{$daysBefore} days")->setTime(0, 0, 0);
        $expiringPlayers = $app['hareruya_ec.repository.player']->findCustomersForNotificationIdExpire($targetDate);

        if (count($expiringPlayers) === 0) {
            return;
        }

        foreach ($expiringPlayers as $player) {
            // 身分証有効期限削除
            $player->setIdExpirationDate(null);
            // 本人確認ステータスを未確認にする（「簡易書留確認済み」の場合は変更しない）
            if ($player->getIdentityConfirmStatusId() !== MtbIdentityConfirmStatus::STATUS_REGISTERED_MAIL_CONFIRMED) {
                $player->setIdentityConfirmStatusId(MtbIdentityConfirmStatus::STATUS_UNCONFIRMED);
            }
            $app['orm.em']->persist($player);
            $app['orm.em']->flush();
            // 会員向け通知メール送信
            $app['hareruya_ec.service.mail']->sendIdExpireNotificationMailToCustomer($player);
        }
        // 管理者向け通知メール送信
        $app['hareruya_ec.service.mail']->sendIdExpireNotificationMailToAdmin($expiringPlayers);
    }
```

ベース実装 pf-eccube3 の対象者抽出は idExpirationDate <= target_date: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbPlayerRepository.php:155-164`
```php
    public function findCustomersForNotificationIdExpire($targetDate)
    {
        $qb = $this->createQueryBuilder('p')
            ->select('p')
            ->where('p.idExpirationDate <= :target_date')
            ->setParameters([
                'target_date' => $targetDate,
            ]);

        return $qb->getQuery()->getResult();
```

ベース実装 pf-eccube3 の MailService は会員向け・管理者向け通知を送信する: `pf-eccube3/app/Plugin/HareruyaEc/Service/MailService.php:1841-1913`
```php
    public function sendIdExpireNotificationMailToCustomer($player)
    {
        log_info('身分証有効期限通知メール（会員向け）送信開始');
        $customer = $player->getCustomer();
        $template = $this->app['eccube.repository.mail_template']->find(MailTemplate::ID_EXPIRE_NOTIFICATION);

        $body = $this->app->renderView($template->getFileName(), []);

        $message = \Swift_Message::newInstance()
            ->setSubject($template->getSubject())
            ->setFrom([$this->baseInfo->getEmail01() => $this->baseInfo->getShopName()])
            ->setTo([$customer->getEmail()])
            ->setReplyTo($this->baseInfo->getEmail03())
            ->setReturnPath($this->baseInfo->getEmail04())
            ->setBody($body);

        MailUtil::convertMessage($this->app, $message);
        MailUtil::setParameterForCharset($this->app, $message);
        $count = $this->app->mail($message);

        $this->saveUserMailHistory($message, $template, $customer);

        log_info('身分証有効期限通知メール（会員向け）送信完了', ['count' => $count]);

        return $count;
    }

    /**
     * 身分証の有効期限切れ会員通知メール（管理者向け）送信
     *
     * @param array $players
     */
    public function sendIdExpireNotificationMailToAdmin($players)
    {
        log_info('身分証の有効期限切れ会員の存在を通知するメール送信開始');

        $mailAddressString = $this->app['hareruya_ec.repository.option']
            ->findOneByOptionKey(MtbOption::CHECK_ID_EXPIRED_CUSTOMER_MAIL_ADDRESS)
            ->getOptionValue();

        if (empty($mailAddressString)) {
            log_info('身分証の有効期限切れ会員の存在を通知するメールアドレス未設定のため送信せず終了');

            return;
        }

        $lines = [];
        foreach ($players as $player) {
            $customer = $player->getCustomer();
            $lines[] = $customer->getId() . ' ' . $customer;
        }
        $text = implode("\n", $lines);

        $body = <<<EOT
        会員ID 氏名
        {$text}
        EOT;

        $address = array_filter(explode(',', $mailAddressString));

        $message = \Swift_Message::newInstance()
            ->setSubject('身分証の有効期限切れ会員の存在を通知するメール')
            ->setFrom([$this->baseInfo->getEmail01() => $this->baseInfo->getShopName()])
            ->setTo($address)
            ->setReplyTo($this->baseInfo->getEmail03())
            ->setReturnPath($this->baseInfo->getEmail04())
            ->setBody($body);

        MailUtil::convertMessage($this->app, $message);
        MailUtil::setParameterForCharset($this->app, $message);
        $count = $this->app->mail($message);

        log_info('身分証の有効期限切れ会員の存在を通知するメール送信完了', ['count' => $count]);
```

# 根拠
- 設計：
  - B08-07 は対象者取得、対象者なし終了、ユーザーごとの更新、会員向けメール、管理者向け一覧メールまでを要求している: `hareruya-design-docs/excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html:1748-1807`
- ec-cube-enterprise：
  - 対象者抽出Repositoryは存在するが、`rg findCustomersForNotificationIdExpire\(` ではこの定義以外の呼び出し元が見つからない: `ec-cube-enterprise/src/Eccube/Repository/DtbPlayerRepository.php:155-167`
  - メールテンプレートとメールマスタは存在するが、MailServiceの専用送信メソッドやB08-07 Actionからの呼び出しは見つからない: `ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:1773-1778`
  - 管理者宛先オプションは存在するが、対象者一覧メールを作成・送信する実装は見つからない: `ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:280-284`
- ベース実装：
  - pf-eccube3 は `customer:batch idExpireNotification` の入口を持つ: `pf-eccube3/app/Plugin/HareruyaEc/Command/CustomerBatch.php:12-52`
  - pf-eccube3 の `IdExpireNotification` はB08-07の対象者取得、更新、会員通知、管理者通知を実行する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Customer/IdExpireNotification.php:31-64`
  - pf-eccube3 の MailService にはB08-07専用の会員向け・管理者向け送信メソッドがある: `pf-eccube3/app/Plugin/HareruyaEc/Service/MailService.php:1841-1913`

# 確認メモ
- 確認コマンド: `rg -n "B08-07|身分証有効期限切れ通知|idExpirationDate|identity_confirm_status|check_id_expired|有効期限切れ|オンライン本人確認の更新" excel_to_html/output/0408_基本設計仕様書\(バッチ_会員\).html design_impl_drift_report/findings/b08-07_0408_sheet-9_sheet.json`
- 確認コマンド: `rg -n "idExpirationDate|IdExpiration|identity_confirm|IdentityConfirm|check_id_expired|id_expire|有効期限切れ|オンライン本人確認の更新|findCustomersForNotificationIdExpire|CheckId|Expired" ../ec-cube-enterprise/src/Eccube ../ec-cube-enterprise/app -g '*.php' -g '*.twig' -g '*.yaml'`
- 確認コマンド: `rg -n "id_expire_notification|sendIdExpire|IdExpireNotification|NotificationIdExpire|身分証有効期限通知|身分証の有効期限切れ会員" ../ec-cube-enterprise/src/Eccube/Service/MailService.php ../ec-cube-enterprise/src/Eccube/Command ../ec-cube-enterprise/src/Eccube/Service/Admin/Customer -g '*.php'`
- 確認コマンド: `rg -n "idExpirationDate|IdExpiration|identityConfirm|IdentityConfirm|check_id_expired|id_expire|有効期限切れ|オンライン本人確認|IdExpireNotification|sendIdExpireNotificationMail" ../pf-eccube3/app/Plugin/HareruyaEc ../pf-eccube3/app -g '*.php' -g '*.twig' -g '*.yml'`

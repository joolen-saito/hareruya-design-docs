/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ会員
機能：ポイント有効期限通知
課題カテゴリ：実装違い
課題：ポイント有効期限通知バッチを設計どおり `customer:batch pointExpireNotification` で起動できない
設計書：0408_基本設計仕様書(バッチ_会員).xlsx

# 再現手順【必須】
1. 設計書 B08-03 の利用者視点の入口で、実行方法が `customer:batch pointExpireNotification` とされていることを確認する
2. ベース実装 pf-eccube3 の `CustomerBatch` が `customer:batch` を登録し、`pointExpireNotification` を `PointExpireNotification` に対応付けていることを確認する
3. ec-cube-enterprise の `PointExpireNotificationCommand` を確認し、登録されている Symfony コマンド名が `eccube:customer:point-expire-notification` であることを確認する
4. ec-cube-enterprise の `src/Eccube/Command` と設定を検索し、`customer:batch pointExpireNotification` または同等 alias が登録されていないことを確認する

# 期待される挙動【必須】
- ポイント有効期限通知バッチは `customer:batch pointExpireNotification` で実行できる
- 設計コマンド名で、通知対象会員の抽出、失効予定ポイント算出、通知メール送信の処理へ到達できる

# 現在の挙動【必須】
- ec-cube-enterprise にはポイント有効期限通知バッチ本体は存在するが、登録されている Symfony コマンド名は `eccube:customer:point-expire-notification` である。`customer:batch`、`pointExpireNotification`、`aliases`、`setAliases` を検索しても設計コマンド名を受ける互換入口は確認できない。

ec-cube-enterprise のポイント有効期限通知コマンドは別名で登録されている: `ec-cube-enterprise/src/Eccube/Command/PointExpireNotificationCommand.php:25-53`
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

ec-cube-enterprise のポイント有効期限通知本体はActionとして存在する: `ec-cube-enterprise/src/Eccube/Service/Admin/Customer/PointExpireNotificationAction.php:33-57`
```php
    public function handle(): void
    {
        $noticePriors = [
            (int) $this->eccubeConfig->get('eccube_point_expire_prior_1'),
            (int) $this->eccubeConfig->get('eccube_point_expire_prior_2'),
        ];

        foreach ($noticePriors as $prior) {
            $expireDate = (new \DateTime())->modify("+{$prior} days")->setTime(0, 0, 0);
            $lostPointPlayers = $this->pointHistoryRepository->getPlayersForNotificationPointExpire($prior);

            foreach ($lostPointPlayers as $lostPointPlayer) {
                $player = $lostPointPlayer['player'];
                $lostPoint = min([
                    $player->getPoint(),
                    $lostPointPlayer['gainPoint'] + $lostPointPlayer['usedPoint'],
                    $lostPointPlayer['targetPoint'],
                ]);

                $this->mailService->sendPointExpireNotificationMail($player, $lostPoint, $expireDate);
            }
        }

        $this->logger->info('ポイント有効期限通知処理完了');
    }
```
- ベース実装(pf-eccube3)では `CustomerBatch` が `customer:batch` を登録し、第一引数 `pointExpireNotification` を `PointExpireNotification` に対応付ける。`PointExpireNotification` は通知日数ごとに対象者を取得し、失効予定ポイントを算出して通知メールを送信する。

ベース実装 pf-eccube3 は customer:batch pointExpireNotification を登録する: `pf-eccube3/app/Plugin/HareruyaEc/Command/CustomerBatch.php:12-52`
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

ベース実装 pf-eccube3 の PointExpireNotification は通知処理へ到達する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Customer/PointExpireNotification.php:29-54`
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

        $noticePriors = [
            $app['config']['HareruyaEc']['const']['point_expire_prior_1'],
            $app['config']['HareruyaEc']['const']['point_expire_prior_2'],
        ];
        foreach ($noticePriors as $prior) {
            $lostPointPlayers = $app['hareruya_ec.repository.point_history']->getPlayersForNotificationPointExpire($app, $prior);
            $expireDate = (clone $now)->modify("+{$prior} days")->setTime(0, 0, 0);
            foreach ($lostPointPlayers as $lostPointPlayer) {
                $player = $lostPointPlayer['player'];
                // gainPoint: 有効期限までのポイント取得量 (> 0), usedPoint: 全ポイント使用量 (< 0)
                $lostPoint = min([$player->getPoint(), ((int)$lostPointPlayer['gainPoint'] + (int)$lostPointPlayer['usedPoint']), (int)$lostPointPlayer['targetPoint']]);
                $app['hareruya_ec.service.mail']->sendPointExpireNotificationMail($player, $lostPoint, $expireDate);
            }
        }
    }
```

# 根拠
- 設計：
  - B08-03 は利用者視点の入口として `customer:batch pointExpireNotification` を要求している: `hareruya-design-docs/excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html:1317-1346`
- ec-cube-enterprise：
  - enterprise の登録コマンド名は設計と異なる `eccube:customer:point-expire-notification`: `ec-cube-enterprise/src/Eccube/Command/PointExpireNotificationCommand.php:25-53`
  - enterprise のポイント有効期限通知本体は存在するため、差分は本体欠落ではなく設計コマンド名の入口互換欠落に限定する: `ec-cube-enterprise/src/Eccube/Service/Admin/Customer/PointExpireNotificationAction.php:33-57`
- ベース実装：
  - pf-eccube3 は `customer:batch` の batch_name として `pointExpireNotification` を受け付ける: `pf-eccube3/app/Plugin/HareruyaEc/Command/CustomerBatch.php:12-52`
  - pf-eccube3 の PointExpireNotification は設計の通知処理へ到達する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Customer/PointExpireNotification.php:29-54`

# 確認メモ
- 確認コマンド: `rg -n "B08-03|ポイント有効期限通知|customer:batch pointExpireNotification|pointExpireNotification|point-expire-notification|PointExpireNotification" excel_to_html/output/0408_基本設計仕様書\(バッチ_会員\).html design_impl_drift_report/findings/b08-03_0408_sheet-5_sheet.json ../ec-cube-enterprise/src/Eccube/Command ../ec-cube-enterprise/src/Eccube/Service/Admin/Customer ../pf-eccube3/app/Plugin/HareruyaEc/Command ../pf-eccube3/app/Plugin/HareruyaEc/Service/Customer -g '*.php' -g '*.html' -g '*.json'`
- 確認コマンド: `rg -n "customer:batch|pointExpireNotification|point-expire-notification|aliases|setAliases|AsCommand" ../ec-cube-enterprise/src/Eccube/Command ../ec-cube-enterprise/app/config -g '*.php' -g '*.yaml' -g '*.yml'`
- 確認コマンド: `rg -n "customer:batch|pointExpireNotification|PointExpireNotification" ../pf-eccube3/app/Plugin/HareruyaEc/Command ../pf-eccube3/app/Plugin/HareruyaEc/Service/Customer -g '*.php'`

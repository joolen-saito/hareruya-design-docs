/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ会員
機能：ポイント失効
課題カテゴリ：実装違い
課題：ポイント失効バッチを設計どおり `customer:batch lostPoint` で起動できない
設計書：0408_基本設計仕様書(バッチ_会員).xlsx

# 再現手順【必須】
1. 設計書 B08-02 の利用者視点の入口で、実行方法が `customer:batch lostPoint` とされていることを確認する
2. ベース実装 pf-eccube3 の `CustomerBatch` が `customer:batch` を登録し、`lostPoint` を `LostPoints` に対応付けていることを確認する
3. ec-cube-enterprise の `LostPointsCommand` を確認し、登録されている Symfony コマンド名が `eccube:customer:lost-points` であることを確認する
4. ec-cube-enterprise の `src/Eccube/Command` と設定を検索し、`customer:batch lostPoint` または同等 alias が登録されていないことを確認する

# 期待される挙動【必須】
- ポイント失効バッチは `customer:batch lostPoint` で実行できる
- 設計コマンド名で、失効対象会員の抽出、スマレジ連携、保有ポイント更新、ポイント履歴記録の処理へ到達できる

# 現在の挙動【必須】
- ec-cube-enterprise にはポイント失効バッチ本体は存在するが、登録されている Symfony コマンド名は `eccube:customer:lost-points` である。`customer:batch`、`lostPoint`、`aliases`、`setAliases` を検索しても設計コマンド名を受ける互換入口は確認できない。

ec-cube-enterprise のポイント失効コマンドは別名で登録されている: `ec-cube-enterprise/src/Eccube/Command/LostPointsCommand.php:25-53`
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

ec-cube-enterprise のポイント失効本体はActionとして存在する: `ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:41-85`
```php
    public function handle(): void
    {
        $lostPointPlayers = $this->pointHistoryRepository->getPlayersForLostPoint();
        $PointType = $this->pointTypeRepository->find(MtbPointType::GRANTED_TYPE);

        if (empty($lostPointPlayers)) {
            $this->logger->info('ポイント失効処理対象なし');

            return;
        }

        foreach ($lostPointPlayers as $lostPointPlayer) {
            $Player = $lostPointPlayer['player'];
            $remainingPoint = (int) $lostPointPlayer['remainingPoint'];
            $losePoint = $remainingPoint - $Player->getPoint();

            if ($losePoint === 0) {
                // 失効分が無ければ EC・スマレジともに更新不要。
                continue;
            }

            $LostPointHistory = new DtbPointHistory();
            $job = null;

            try {
                $this->entityManager->beginTransaction();

                $Player->setPoint($remainingPoint);
                $this->entityManager->persist($Player);

                $this->pointHistoryEntityManager->save(
                    PointHistory: $LostPointHistory,
                    Customer: $Player->getCustomer(),
                    Order: null,
                    PointType: $PointType,
                    pointChange: $losePoint,
                    note: self::NOTE,
                    issueDate: (new \DateTime())->modify('+183 days'),
                    transactionId: null,
                );

                // EC 失効と同一トランザクションでスマレジ連携ジョブを積む（未連携・増減0は null）。
                $job = $this->smaregiCustomerPointEventService->registerPointAddJob($LostPointHistory);

                $this->entityManager->flush();
```
- ベース実装(pf-eccube3)では `CustomerBatch` が `customer:batch` を登録し、第一引数 `lostPoint` を `LostPoints` に対応付ける。`LostPoints` は失効対象会員を取得し、会員ごとにスマレジ連携、保有ポイント更新、履歴作成へ進む。

ベース実装 pf-eccube3 は customer:batch lostPoint を登録する: `pf-eccube3/app/Plugin/HareruyaEc/Command/CustomerBatch.php:12-52`
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

ベース実装 pf-eccube3 の LostPoints はポイント失効処理へ到達する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Customer/LostPoints.php:33-63`
```php
    public function execute()
    {
        $app = $this->app;
        $now = new \DateTime();

        $lostPointPlayers = $app['hareruya_ec.repository.point_history']->getPlayersForLostPoint($app);
        $grantedPointType = $app['hareruya_ec.repository.point_type']->find(MtbPointType::GRANTED_TYPE);
        foreach ($lostPointPlayers as $lostPointPlayer) {
            usleep(100000);
            $player = $lostPointPlayer['player'];
            $losePoint = $lostPointPlayer['remainingPoint'] - $player->getPoint();
            // スマレジ連携
            $response = $app['hareruya_ec.service.smaregi_customer']->postSmaregiPoint($player->getSmaregiId(), $losePoint, false);
            if (is_null($response) || !array_key_exists('result', $response)) {
                continue;
            }
            $player->setPoint($lostPointPlayer['remainingPoint']);

            $history = new DtbPointHistory();
            $history
                ->setCustomer($player->getCustomer())
                ->setPointChange($losePoint)
                ->setNote(self::NOTE)
                ->setIssueDate(new \DateTime())
                ->setCreateDate(new \DateTime())
                ->setPointType($grantedPointType);

            $app['orm.em']->persist($player);
            $app['orm.em']->persist($history);
        }
        $app['orm.em']->flush();
```

# 根拠
- 設計：
  - B08-02 は利用者視点の入口として `customer:batch lostPoint` を要求している: `hareruya-design-docs/excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html:1155-1185`
- ec-cube-enterprise：
  - enterprise の登録コマンド名は設計と異なる `eccube:customer:lost-points`: `ec-cube-enterprise/src/Eccube/Command/LostPointsCommand.php:25-53`
  - enterprise のポイント失効本体は存在するため、差分は本体欠落ではなく設計コマンド名の入口互換欠落に限定する: `ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:41-85`
- ベース実装：
  - pf-eccube3 は `customer:batch` の batch_name として `lostPoint` を受け付ける: `pf-eccube3/app/Plugin/HareruyaEc/Command/CustomerBatch.php:12-52`
  - pf-eccube3 の LostPoints は設計のポイント失効処理へ到達する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Customer/LostPoints.php:33-63`

# 確認メモ
- 確認コマンド: `rg -n "B08-02|ポイント失効|customer:batch lostPoint|lostPoint|lost-points|LostPoints" excel_to_html/output/0408_基本設計仕様書\(バッチ_会員\).html design_impl_drift_report/findings/b08-02_0408_sheet-4_sheet.json ../ec-cube-enterprise/src/Eccube/Command ../ec-cube-enterprise/src/Eccube/Service/Admin/Customer ../pf-eccube3/app/Plugin/HareruyaEc/Command ../pf-eccube3/app/Plugin/HareruyaEc/Service/Customer -g '*.php' -g '*.html' -g '*.json'`
- 確認コマンド: `rg -n "customer:batch|lostPoint|lost-points|aliases|setAliases|AsCommand" ../ec-cube-enterprise/src/Eccube/Command ../ec-cube-enterprise/app/config -g '*.php' -g '*.yaml' -g '*.yml'`
- 確認コマンド: `rg -n "customer:batch|lostPoint|LostPoints" ../pf-eccube3/app/Plugin/HareruyaEc/Command ../pf-eccube3/app/Plugin/HareruyaEc/Service/Customer -g '*.php'`

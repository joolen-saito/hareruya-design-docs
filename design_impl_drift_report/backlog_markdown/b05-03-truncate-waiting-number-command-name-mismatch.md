/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ受注管理
機能：店頭注文番号初期化
課題カテゴリ：実装違い
課題：店頭注文番号初期化バッチを設計どおり `order:batch truncateWaitingNumber` で起動できない
設計書：0405_基本設計仕様書(バッチ_受注管理).xlsx

# 再現手順【必須】
1. 設計書 B05-03 の利用者視点の入口で、実行方法が `order:batch truncateWaitingNumber` とされていることを確認する
2. ベース実装 pf-eccube3 の `OrderBatch` が `order:batch` コマンドの `batch_name` として `truncateWaitingNumber` を受け付けることを確認する
3. ec-cube-enterprise の `src/Eccube/Command` と設定を検索し、`order:batch truncateWaitingNumber` または同等 alias が登録されているか確認する
4. ec-cube-enterprise では `eccube:order:truncate-waiting-number` だけが登録され、設計どおりの起動名では到達できないことを確認する

# 期待される挙動【必須】
- 店頭注文番号初期化バッチは `order:batch truncateWaitingNumber` で起動できる
- コマンド名が未指定または不一致の場合は、店頭注文番号初期化処理を行わずに終了する
- 起動後の処理では店頭注文番号テーブルを空にし、採番カウンタを初期値に戻す

# 現在の挙動【必須】
- ec-cube-enterprise では店頭注文番号初期化の本体処理は存在するが、Symfony Console の登録名は `eccube:order:truncate-waiting-number` であり、設計とベース実装が外部入口としている `order:batch truncateWaitingNumber` や alias は確認できない。

ec-cube-enterprise は別名の Symfony コマンドだけを登録している: `ec-cube-enterprise/src/Eccube/Command/TruncateWaitingNumberCommand.php:25-53`
```php
#[AsCommand(name: 'eccube:order:truncate-waiting-number', description: '店舗注文番号初期化')]
class TruncateWaitingNumberCommand extends Command
{
    public function __construct(
        private readonly TruncateWaitingNumberAction $truncateWaitingNumberAction,
    ) {
        parent::__construct();
    }

    #[\Override]
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->text('店舗注文番号初期化バッチ開始');

        try {
            $this->truncateWaitingNumberAction->handle();
        } catch (\Throwable $e) {
            $io->error([
                '店舗注文番号初期化処理でエラーが発生しました',
                $e->getMessage(),
            ]);

            return Command::FAILURE;
        }

        $io->success('店舗注文番号初期化処理が完了しました。');

        return Command::SUCCESS;
```

ec-cube-enterprise の本体処理は存在するため、差分は起動名に限定する: `ec-cube-enterprise/src/Eccube/Service/Admin/Order/TruncateWaitingNumberAction.php:34-59`
```php
    public function handle(): void
    {
        $this->entityManager->beginTransaction();

        try {
            // 店舗販売用整理番号を物理削除
            $this->waitingNumberRepository->truncateWaitingNumber();
            $this->waitingNumberCounterRepository->truncateWaitingNumberCounter();

            // 店舗販売用整理番号カウンタを初期化
            $BaseInfos = $this->baseInfoRepository->findAll();
            foreach ($BaseInfos as $BaseInfo) {
                $WaitingNumberCounter = (new DtbWaitingNumberCounter())
                    ->setBaseInfo($BaseInfo)
                    ->setCurrentValue(0);
                $this->entityManager->persist($WaitingNumberCounter);
            }

            $this->entityManager->flush();
            $this->entityManager->commit();
        } catch (\Throwable $e) {
            $this->entityManager->rollback();

            throw $e;
        }
    }
```

ec-cube-enterprise は dtb_waiting_number を TRUNCATE する: `ec-cube-enterprise/src/Eccube/Repository/DtbWaitingNumberRepository.php:32-41`
```php
    /**
     * 店舗販売用整理番号を物理削除
     *
     * @return void
     */
    public function truncateWaitingNumber(): void
    {
        $connection = $this->getEntityManager()->getConnection();
        $connection->executeStatement('TRUNCATE TABLE dtb_waiting_number');
    }
```
- ベース実装(pf-eccube3)では `order:batch` が `batch_name` 引数を受け取り、`truncateWaitingNumber` を `TruncateWaitingNumber` サービスへ対応付ける。未指定・不一致の場合は `Nothing args or command.` を出して処理せず終了するため、設計の起動契約と一致している。

ベース実装 pf-eccube3 は order:batch truncateWaitingNumber を登録する: `pf-eccube3/app/Plugin/HareruyaEc/Command/OrderBatch.php:12-30`
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

ベース実装 pf-eccube3 の店頭注文番号初期化サービス: `pf-eccube3/app/Plugin/HareruyaEc/Service/Order/TruncateWaitingNumber.php:7-31`
```php
class TruncateWaitingNumber
{
    protected $commandName = 'truncateWaitingNumber';
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
     * Update display status
     *
     * @param array $option
     */
    public function execute()
    {
        $this->app['hareruya_ec.repository.waiting_number']->truncateWaitingNumber();
```

ベース実装 pf-eccube3 は dtb_waiting_number を削除し AUTO_INCREMENT を1へ戻す: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbWaitingNumberRepository.php:15-20`
```php
    public function truncateWaitingNumber()
    {
        $connection = $this->getEntityManager()->getConnection();
        $connection->query('DELETE FROM dtb_waiting_number');
        $connection->query('ALTER TABLE dtb_waiting_number AUTO_INCREMENT = 1');
    }
```

# 根拠
- 設計：
  - B05-03 は pf-eccube3 を挙動の参照元とし、利用者視点の入口を `order:batch truncateWaitingNumber` と明記している: `hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1306-1335`
  - B05-03 は入力をコマンド名とし、未指定・不一致なら処理しないことをエラー処理として定義している: `hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1341-1360`
- ec-cube-enterprise：
  - enterprise は `eccube:order:truncate-waiting-number` として登録しており、`order:batch truncateWaitingNumber` ではない: `ec-cube-enterprise/src/Eccube/Command/TruncateWaitingNumberCommand.php:25-53`
  - enterprise の店頭注文番号初期化本体は存在するため、本件は起動入口の差分に限定する: `ec-cube-enterprise/src/Eccube/Service/Admin/Order/TruncateWaitingNumberAction.php:34-59`
- ベース実装：
  - pf-eccube3 は `order:batch` の batch_name として `truncateWaitingNumber` を受け付ける: `pf-eccube3/app/Plugin/HareruyaEc/Command/OrderBatch.php:12-30`
  - pf-eccube3 の `order:batch` は未指定・不一致の場合に処理せず終了する: `pf-eccube3/app/Plugin/HareruyaEc/Command/OrderBatch.php:41-54`
  - pf-eccube3 の実処理は店頭注文番号の全削除とAUTO_INCREMENT初期化を行う: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbWaitingNumberRepository.php:15-20`

# 確認メモ
- 確認コマンド: `rg -n "B05-03|店頭注文番号初期化|truncateWaitingNumber|truncate-waiting-number|コマンド名" excel_to_html/output/0405_基本設計仕様書\(バッチ_受注管理\).html`
- 確認コマンド: `rg -n "order:batch|truncateWaitingNumber|eccube:order:truncate-waiting-number|setAliases|aliases" ../ec-cube-enterprise/src/Eccube/Command ../ec-cube-enterprise/app/config 2>/dev/null`
- 確認コマンド: `rg -n "truncateWaitingNumber|TruncateWaitingNumber|WaitingNumber|order:batch" ../pf-eccube3/app/Plugin/HareruyaEc`
- 本件は店頭注文番号初期化ロジックの欠落ではなく、設計・ベース実装の外部起動名との互換性差分に限定する。

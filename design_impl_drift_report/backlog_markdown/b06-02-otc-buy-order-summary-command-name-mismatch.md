/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ店頭買取管理
機能：買取集計バッチ
課題カテゴリ：実装漏れ
課題：買取集計バッチを設計どおり `otcBuyOrder:batch updateSummary` で起動できない
設計書：0406_基本設計仕様書(バッチ_店頭買取管理).xlsx

# 再現手順【必須】
1. 設計書 B06-02 の利用者視点の入口で、実行方法が `otcBuyOrder:batch updateSummary [YYYY-MM-DD]` とされていることを確認する
2. ベース実装 pf-eccube3 の `OtcBuyOrderBatch` が `otcBuyOrder:batch` を登録し、`updateSummary` を `SummaryService` に対応付けていることを確認する
3. ec-cube-enterprise の `src/Eccube/Command` と設定を検索し、`otcBuyOrder:batch`、`updateSummary`、または同等aliasが登録されているか確認する
4. ec-cube-enterprise では集計本体は `eccube:otc-buy-order:aggregate-summary [date]` として実装されているが、設計コマンド名の互換入口がないことを確認する

# 期待される挙動【必須】
- 買取集計バッチは `otcBuyOrder:batch updateSummary [YYYY-MM-DD]` で実行できる
- 任意の集計日引数を指定した場合はその日付を集計し、未指定時は前日を集計する
- 設計コマンド名で、集計日の店頭買取データを店舗・部門単位で集計し、既存集計を入れ替える処理へ到達できる

# 現在の挙動【必須】
- ec-cube-enterprise には買取集計バッチ本体は存在するが、登録されているSymfonyコマンド名は `eccube:otc-buy-order:aggregate-summary` である。`otcBuyOrder:batch`、`updateSummary`、`aliases`、`setAliases` を検索しても設計コマンド名を受ける互換入口は確認できない。

ec-cube-enterprise の買取集計コマンドは別名で登録されている: `ec-cube-enterprise/src/Eccube/Command/OtcBuyOrderAggregateSummaryCommand.php:45-90`
```php
#[AsCommand(name: 'eccube:otc-buy-order:aggregate-summary', description: '店頭買取集計バッチ')]
class OtcBuyOrderAggregateSummaryCommand extends Command
{
    public function __construct(private readonly BatchAggregateSummaryAction $batchAggregateSummaryAction)
    {
        parent::__construct();
    }

    #[\Override]
    protected function configure(): void
    {
        $this->addArgument('date', InputArgument::OPTIONAL, '集計対象日 (Y-m-d形式)。省略時は前日');
    }

    #[\Override]
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $dateArg = $input->getArgument('date');
        if ($dateArg !== null) {
            $summaryDate = \DateTime::createFromFormat('Y-m-d', $dateArg);
            if ($summaryDate === false) {
                $io->error('日付の形式が正しくありません。Y-m-d形式で指定してください。例: 2026-03-01');

                return Command::FAILURE;
            }
        } else {
            $summaryDate = new \DateTime('yesterday');
        }

        $summaryDate->setTime(0, 0, 0);

        $io->info('集計対象日: '.$summaryDate->format('Y-m-d'));

        try {
            $this->batchAggregateSummaryAction->handle($summaryDate);
        } catch (\Exception $e) {
            $io->error('集計処理でエラーが発生しました: '.$e->getMessage());

            return Command::FAILURE;
        }

        $io->success('店頭買取集計が完了しました。');

        return Command::SUCCESS;
```

ec-cube-enterprise の集計本体はActionとして存在する: `ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/BatchAggregateSummaryAction.php:34-60`
```php
     * バッチ用の集計実行。
     * 集計完了後に部門未設定商品が存在する場合は通知メールを送信する。
     * 集計処理で例外が発生した場合はエラー通知メールを送信して例外を再スローする。
     *
     * @throws \Exception 集計処理で例外が発生した場合
     */
    public function handle(\DateTime $summaryDate): void
    {
        try {
            SummaryByDateAggregator::aggregate(
                $summaryDate,
                $this->otcBuyOrderRepository,
                $this->otcBuyOrderSummaryRepository,
                $this->mtbOptionRepository,
            );

            $noSectionProducts = $this->otcBuyOrderRepository->getNoSectionProducts($summaryDate);
            if (!empty($noSectionProducts)) {
                $this->mailService->sendNoSectionAlertMail($noSectionProducts);
            }
        } catch (\Exception $exception) {
            $this->mailService->sendUpdateOtcBuyOrderSummaryErrorMail($exception->getMessage());

            throw $exception;
        }
    }
}
```
- ベース実装(pf-eccube3)では `OtcBuyOrderBatch` が `otcBuyOrder:batch` を登録し、第一引数 `updateSummary` を `SummaryService` に対応付ける。`SummaryService` は追加引数から集計日を受け取り、集計・既存削除・登録・部門未設定通知まで実行する。

ベース実装 pf-eccube3 は otcBuyOrder:batch updateSummary を登録する: `pf-eccube3/app/Plugin/HareruyaEc/Command/OtcBuyOrderBatch.php:10-47`
```php
class OtcBuyOrderBatch extends Command
{
    const BATCH_NAMES = [
        'updateSummary' => 'Plugin\HareruyaEc\Service\OtcBuyOrder\SummaryService',
    ];

    const LAST_ARG = 10;

    protected function configure()
    {
        $this->setName('otcBuyOrder:batch')
            ->setDescription('otcBuyOrder batchs')
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

        $batch = new $batchNames[$name]($app, $this->createOptions($input));
        $batch->execute();

        return 0;
    }
```

ベース実装 pf-eccube3 の SummaryService は集計日引数を使って集計処理を実行する: `pf-eccube3/app/Plugin/HareruyaEc/Service/OtcBuyOrder/SummaryService.php:29-61`
```php
    {
        set_time_limit(0);
        $this->app['orm.em']->getConnection()->getConfiguration()->setSQLLogger(null);
        $this->app['orm.em']->getConnection()->beginTransaction();

        $transport = new \Swift_SmtpTransport('localhost', 25);
        $transport->setUsername($this->app['config']['HareruyaEc']['const']['swiftmailer_user']);
        $transport->setPassword('');
        $this->app['mailer'] = new \Swift_Mailer($transport);

        try {
            // 集計日のコマンドライン引数(Y-m-d形式)
            $summaryDate = isset($this->options[0])
                ? \DateTime::createFromFormat('Y-m-d H:i:s', $this->options[0] . '00:00:00')
                : (new \DateTime())->modify('-1 days')->modify('00:00:00');

            // 集計結果
            $summary = $this->app['hareruya_ec.repository.otc_buy_order']->getSectionSummary($summaryDate);

            // 既存データ削除
            $this->app['hareruya_ec.repository.otc_buy_order_summary']->deleteOtcBuyOrderSummary($summaryDate);

            // 集計結果登録
            $this->app['hareruya_ec.repository.otc_buy_order_summary']->insertOtcBuyOrderSummary($summary, $summaryDate);

            // 部門未設定商品の一覧
            $noSectionProducts = $this->app['hareruya_ec.repository.otc_buy_order']->getNoSectionProducts($summaryDate);

            // 部門未設定の商品がある場合は通知メールを送信
            if (!empty($noSectionProducts)) {
                $this->app['hareruya_ec.service.mail']->sendNoSectionAlertMail($noSectionProducts);
            }
        } catch (\Exception $e) {
```

# 根拠
- 設計：
  - B06-02 は利用者視点の入口として `otcBuyOrder:batch updateSummary [YYYY-MM-DD]` を要求している: `hareruya-design-docs/excel_to_html/output/0406_基本設計仕様書(バッチ_店頭買取管理) .html:1053-1080`
  - B06-02 は入力としてコマンド名と任意の集計日引数を定義している: `hareruya-design-docs/excel_to_html/output/0406_基本設計仕様書(バッチ_店頭買取管理) .html:1089-1094`
- ec-cube-enterprise：
  - enterprise の登録コマンド名は設計と異なる `eccube:otc-buy-order:aggregate-summary`: `ec-cube-enterprise/src/Eccube/Command/OtcBuyOrderAggregateSummaryCommand.php:45-90`
  - enterprise の集計本体は存在するため、差分は本体欠落ではなく設計コマンド名の入口互換欠落に限定する: `ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/BatchAggregateSummaryAction.php:34-60`
- ベース実装：
  - pf-eccube3 は `otcBuyOrder:batch` の batch_name として `updateSummary` を受け付ける: `pf-eccube3/app/Plugin/HareruyaEc/Command/OtcBuyOrderBatch.php:10-47`
  - pf-eccube3 の SummaryService は設計の集計日引数・集計・既存削除・登録へ到達する: `pf-eccube3/app/Plugin/HareruyaEc/Service/OtcBuyOrder/SummaryService.php:29-61`

# 確認メモ
- 確認コマンド: `rg -n "B06-02|買取集計|otcBuyOrder:batch|updateSummary|実行時間|set_time_limit|部門未設定|件数|送信開始|送信完了" "excel_to_html/output/0406_基本設計仕様書(バッチ_店頭買取管理) .html"`
- 確認コマンド: `rg -n "OtcBuyOrderAggregateSummary|aggregate-summary|otcBuyOrder:batch|updateSummary|set_time_limit|max_execution_time|sendNoSectionAlertMail|部門未設定|noSection|NoSection|count\(|log_info" ../ec-cube-enterprise/src/Eccube ../ec-cube-enterprise/app -g '*.php' -g '*.yaml' -g '*.yml'`
- 確認コマンド: `rg -n "otcBuyOrder:batch|updateSummary|setAliases|aliases|aggregate-summary|OtcBuyOrderAggregateSummaryCommand" ../ec-cube-enterprise/src/Eccube ../ec-cube-enterprise/app -g '*.php' -g '*.yaml' -g '*.yml'`
- 確認コマンド: `rg -n "OtcBuyOrderBatch|otcBuyOrder:batch|updateSummary|SummaryService|sendNoSectionAlertMail|部門未設定|set_time_limit|max_execution_time|件数" ../pf-eccube3/app/Plugin/HareruyaEc ../pf-api ../ec-cube -g '*.php' -g '*.yml' -g '*.yaml'`

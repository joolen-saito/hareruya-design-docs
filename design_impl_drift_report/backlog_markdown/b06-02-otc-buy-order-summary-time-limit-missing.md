/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ店頭買取管理
機能：買取集計バッチ
課題カテゴリ：実装漏れ
課題：買取集計バッチ開始時に実行時間制限を解除していない
設計書：0406_基本設計仕様書(バッチ_店頭買取管理).xlsx

# 再現手順【必須】
1. 設計書 B06-02 の処理フローで、買取集計バッチ開始時に実行時間制限を解除する要求があることを確認する
2. ベース実装 pf-eccube3 の `SummaryService::execute()` が冒頭で `set_time_limit(0)` を実行していることを確認する
3. ec-cube-enterprise の `OtcBuyOrderAggregateSummaryCommand::execute()` から `BatchAggregateSummaryAction::handle()`、`SummaryByDateAggregator::aggregate()` までの実行経路を確認する
4. 同実行経路に `set_time_limit(0)`、`ini_set('max_execution_time', ...)`、または同等の実行時間制限解除処理がないことを確認する

# 期待される挙動【必須】
- 買取集計バッチは長時間処理に備えて、バッチ開始時に PHP の実行時間制限を解除する
- 設計が正とする pf-eccube3 と同様に、集計・削除・登録・通知へ入る前に `set_time_limit(0)` 相当の処理を実行する

# 現在の挙動【必須】
- ec-cube-enterprise の買取集計コマンドは日付を解決して `BatchAggregateSummaryAction::handle()` を呼ぶが、この入口に実行時間制限解除処理はない。

ec-cube-enterprise の買取集計コマンド入口: `ec-cube-enterprise/src/Eccube/Command/OtcBuyOrderAggregateSummaryCommand.php:60-90`
```php
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

ec-cube-enterprise のバッチAction: `ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/BatchAggregateSummaryAction.php:40-59`
```php
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
```

ec-cube-enterprise の集計本体: `ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/SummaryByDateAggregator.php:36-52`
```php
    public static function aggregate(
        \DateTime $summaryDate,
        DtbOtcBuyOrderRepository $otcBuyOrderRepository,
        DtbOtcBuyOrderSummaryRepository $otcBuyOrderSummaryRepository,
        MtbOptionRepository $mtbOptionRepository,
    ): void {
        $FixedPriceSectionOption = $mtbOptionRepository->findOneBy([
            'option_key' => MtbOption::FIXED_PRICE_SECTION,
        ]);
        if ($FixedPriceSectionOption === null) {
            throw new \RuntimeException('端数調整セクションの設定が見つかりません。MtbOption に fixed_price_section を登録してください。');
        }
        $fixedPriceSection = (int) $FixedPriceSectionOption->getOptionValue();

        $summary = $otcBuyOrderRepository->getSectionSummary($summaryDate, $fixedPriceSection);
        $otcBuyOrderSummaryRepository->replaceSummary($summary, $summaryDate);
    }
```
- ベース実装(pf-eccube3)では同じ買取集計処理の `SummaryService::execute()` 冒頭で `set_time_limit(0)` を実行し、その後にSQLロガー無効化、トランザクション開始、集計・削除・登録・通知へ進む。

ベース実装 pf-eccube3 の SummaryService は開始時に実行時間制限を解除する: `pf-eccube3/app/Plugin/HareruyaEc/Service/OtcBuyOrder/SummaryService.php:28-60`
```php
    public function execute()
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
```

# 根拠
- 設計：
  - B06-02 の処理フローはバッチ開始時の実行時間制限解除を要求している: `hareruya-design-docs/excel_to_html/output/0406_基本設計仕様書(バッチ_店頭買取管理) .html:1074-1081`
  - B06-02 の排他制御・トランザクション節も長時間処理に備えた実行時間制限解除を要求している: `hareruya-design-docs/excel_to_html/output/0406_基本設計仕様書(バッチ_店頭買取管理) .html:1118`
- ec-cube-enterprise：
  - enterprise の Command 入口には日付解決と Action 呼び出しはあるが `set_time_limit(0)` 相当がない: `ec-cube-enterprise/src/Eccube/Command/OtcBuyOrderAggregateSummaryCommand.php:60-90`
  - enterprise の Action 入口にも実行時間制限解除はない: `ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/BatchAggregateSummaryAction.php:40-59`
  - enterprise の集計本体にも実行時間制限解除はない: `ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/SummaryByDateAggregator.php:36-52`
- ベース実装：
  - pf-eccube3 は同バッチ本体の冒頭で `set_time_limit(0)` を実行する: `pf-eccube3/app/Plugin/HareruyaEc/Service/OtcBuyOrder/SummaryService.php:28-60`

# 確認メモ
- 確認コマンド: `rg -n "実行時間制限|set_time_limit|otcBuyOrder:batch updateSummary|排他制御・トランザクション" "excel_to_html/output/0406_基本設計仕様書(バッチ_店頭買取管理) .html"`
- 確認コマンド: `rg -n "set_time_limit|max_execution_time|ini_set|OtcBuyOrderAggregateSummaryCommand|BatchAggregateSummaryAction|SummaryByDateAggregator|aggregate-summary" ../ec-cube-enterprise/src/Eccube/Command/OtcBuyOrderAggregateSummaryCommand.php ../ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder ../ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php ../ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderSummaryRepository.php`
- 確認コマンド: `rg -n "set_time_limit|max_execution_time|SummaryService|otcBuyOrder:batch|updateSummary" ../pf-eccube3/app/Plugin/HareruyaEc/Command/OtcBuyOrderBatch.php ../pf-eccube3/app/Plugin/HareruyaEc/Service/OtcBuyOrder/SummaryService.php`

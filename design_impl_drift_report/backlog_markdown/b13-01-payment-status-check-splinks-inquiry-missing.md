/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチイベント
機能：決済処理中チェックバッチ
課題カテゴリ：実装漏れ
課題：決済処理中チェックバッチがSP.LINKS取引照会APIを実行せず例外で停止する
設計書：0413_基本設計仕様書(バッチ_イベント).xlsx

# 再現手順【必須】
1. 設計書 B13-01 の処理概要で、決済中のイベント申込についてSP.LINKSへ取引照会し、照会結果に応じてステータス整合・論理削除・エラー通知を行う仕様であることを確認する
2. ベース実装 pf-eccube3 の `EventEntryBatch` を確認し、`entry:batch checkProssesingPayment` が `CheckProcessingPaymentEntry` に対応付けられていることを確認する
3. ベース実装 pf-eccube3 の `CheckProcessingPaymentEntry` / `AbstractCheckPaymentEntry` / `SlnSearchHelper` を確認し、対象イベント申込を取得して `SearchLinkPayment()` で取引照会していることを確認する
4. ec-cube-enterprise の `PaymentStatusCheckCommand` と `PaymentStatusCheckAction` を確認し、`handle()` は `getApiResponse($paymentNo)` を呼ぶが、`getApiResponse()` が常に `LogicException` を投げることを確認する
5. ec-cube-enterprise の決済関連Service/Commandを検索し、`PaymentStatusCheckAction` から利用されるSP.LINKS取引照会実装が存在しないことを確認する

# 期待される挙動【必須】
- 決済処理中チェックバッチは、決済中かつ支払番号登録済みで、作成から30分以上経過したイベント申込を対象にする
- 対象申込ごとにSP.LINKSへ取引照会を行い、ResponseCdがOKの場合は申込ステータスを申込済みに更新し、申込履歴を追加し、クレジット決済完了メールを送信する
- 取引参照自体のエラーコードの場合は申込を保留し、取引不在・失敗の場合はイベント申込を論理削除する
- 取引照会処理自体でエラーが発生した場合は、イベント決済確認エラー通知メールを送信する

# 現在の挙動【必須】
- ec-cube-enterprise には `eccube:payment-status-check` コマンドと `PaymentStatusCheckAction` は存在する。`handle()` は対象イベント申込を取得し、各申込の `paymentNo` で `getApiResponse($paymentNo)` を呼んで照会結果を分岐する構造になっている。

ec-cube-enterprise の決済処理中チェックコマンドは PaymentStatusCheckAction を呼ぶ: `ec-cube-enterprise/src/Eccube/Command/PaymentStatusCheckCommand.php:25-60`
```php
/**
 * 決済処理中チェックバッチ
 *
 * イベント申込のリンク型決済で、通信障害や決済画面からの離脱で申込完了画面へ
 * 遷移しなかった申込についてSP.LINKSに取引照会を行い、照会結果に応じた処理を行う。
 *
 * 【使い方】
 *
 *   bin/console eccube:payment-status-check
 */
#[AsCommand(name: 'eccube:payment-status-check', description: '決済処理中チェックバッチ')]
class PaymentStatusCheckCommand extends Command
{
    public function __construct(
        private readonly PaymentStatusCheckAction $paymentStatusCheckAction,
    ) {
        parent::__construct();
    }

    #[\Override]
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        try {
            $result = $this->paymentStatusCheckAction->handle();
        } catch (\Throwable $e) {
            $io->error('決済処理中チェックでエラーが発生しました。 '.$e->getMessage());

            return Command::FAILURE;
        }

        if ($result['error'] > 0) {
            $io->error('決済処理中チェックでエラーが発生しました。 '.$result['detail']);

            return Command::FAILURE;
```

ec-cube-enterprise の PaymentStatusCheckAction は対象イベント申込ごとに getApiResponse を呼ぶ: `ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:76-108`
```php
        try {
            // イベント申込情報を取得
            $EventEntries = $this->eventEntryRepository->getBeforeMinutesEntry(30);

            // 件数(初期値)
            $cntEntries = count($EventEntries);
            $cntUpdate = 0;
            $cntPending = 0;
            $cntDeleted = 0;
            $cntError = 0;

            // 商品情報を取得
            foreach ($EventEntries as $EventEntry) {
                // イベント申込履歴の重複チェック：「申込ステータス＝申込済み(mtb_entry_status.id=4)」のレコード
                $EventHistories = $this->entryHistoryRepository->findBy([
                    'EventEntry' => $EventEntry->getId(),
                    'EntryStatus' => MtbEntryStatus::ENTERED,
                ]);
                if (count($EventHistories) > 0) {
                    $cntEntries--;
                    continue;
                }

                // SP.LINKS取引照会用データを取得
                $paymentNo = $EventEntry->getPaymentNo();
                $payingCustomerId = $EventEntry->getPayingCustomer()->getId();

                try {
                    // SP.LINKS取引照会API
                    $resultApi = $this->getApiResponse($paymentNo);  // TODO APIからのレスポンスから取得

                    // 取引が成功している場合
                    if ($resultApi === 'OK') {
```
- しかし `PaymentStatusCheckAction::getApiResponse()` はSP.LINKS取引照会APIを実行せず、常に `LogicException('SP.LINKS取引照会API未実装...')` を投げる。そのため、設計が要求する取引照会結果に応じたステータス更新・論理削除・履歴追加・メール送信には到達できない。

ec-cube-enterprise の getApiResponse は未実装例外を投げるだけ: `ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:186-196`
```php
    /**
     * @param ?string $paymentNo
     *
     * @return ?string
     */
    public function getApiResponse(?string $paymentNo): ?string
    {
        // SP.LINKS取引照会API未実装のため、後続PRで実装予定
        throw new \LogicException('SP.LINKS取引照会API未実装のため、決済処理中チェックはまだ実行できません。');
        // return 'OK'; // TODO: 後続PRでSP.LINKS APIのレスポンスを返す
    }
```
- ベース実装 pf-eccube3 では、`entry:batch checkProssesingPayment` が `CheckProcessingPaymentEntry` を起動する。対象申込は `getPassedLimitEntry()` で抽出され、`AbstractCheckPaymentEntry::check()` が `execSearch()` を呼び、`SlnSearchHelper::execSearch()` 内で `Credit::SearchLinkPayment()` により取引照会を実行する。

ベース実装 pf-eccube3 は entry:batch checkProssesingPayment を登録する: `pf-eccube3/app/Plugin/HareruyaEc/Command/EventEntryBatch.php:11-45`
```php
    const BATCH_NAMES = [
        'checkProssesingPayment' => 'Plugin\HareruyaEc\Service\Payment\CheckProcessingPaymentEntry',
        'checkCvsPayment' => 'Plugin\HareruyaEc\Service\Payment\CheckCvsPaymentEntry'
    ];

    const LAST_ARG = 10;

    protected function configure()
    {
        $this->setName('entry:batch')
            ->setDescription('event entry batchs')
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
            echo $resultMessage . "nothing args or command\n";

            return 1;
        }

        $payment = new $batchNames[$name]($app, $this->createOptions($input));
        $result = $payment->execute();
        echo $resultMessage . $result[1];
```

ベース実装 pf-eccube3 の CheckProcessingPaymentEntry は対象申込を取得して check に渡す: `pf-eccube3/app/Plugin/HareruyaEc/Service/Payment/CheckProcessingPaymentEntry.php:17-28`
```php
    protected $commandName = 'checkProssesingPayment';

    public function execute($option = [])
    {
        $entries = $this->app['hareruya_ec.repository.event_entry']->getPassedLimitEntry($this->app['config']['HareruyaEc']['const']['payment']['processing_limit_minute'], self::PAYMENT);

        if(count($entries) === 0) {
            return [0, "PROCESSING_PAYMENT is none\n"];
        }

        return $this->check($entries);
    }
```

ベース実装 pf-eccube3 の AbstractCheckPaymentEntry は取引照会結果に応じて更新・削除・通知する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Payment/AbstractCheckPaymentEntry.php:19-74`
```php
    protected function check($entries = [])
    {
        $this->initSearchHelper();

        $message = '';
        $messages = [];
        $errorMessages = [];
        $prePaymentNo = '';
        foreach ($entries as $entry) {
            // 1つ前のpaymentNoと同じ時に、前回の結果($message)から判断して同様の処理を行う
            if ($prePaymentNo === $entry->getPaymentNo()) {
                switch ($message) {
                    case '':
                        $this->execRecordOperation($entry, $newStatus);
                        break;
                    case $this->notExistingTransuctionMessage:
                        $this->removeRecord($entry);
                        break;
                }
                continue;
            }
            $result = $this->execSearch($entry, true);
            $message = $result[0];
            $newStatus = $result[1];
            $prePaymentNo = $entry->getPaymentNo();

            if ($message !== '') {
                if (
                    $message === $this->notExistingTransuctionMessage ||
                    $message === $this->transactionIncompleteMessage ||
                    $message === $this->transactionErrorMessage
                ) {
                    $messages[] = "OrderId<{$prePaymentNo}>{$message}";
                    continue;
                } elseif (!in_array($message, $errorMessages)) {
                    // SPLINKS取引不在/未完了 以外のエラーを1つにまとめてメールで通知する
                    $errorMessages[] = $message;
                }
            }

            $this->execRecordOperation($entry, $newStatus);
        }

        if (!empty($errorMessages)) {
            $transport = new \Swift_SmtpTransport('localhost', 25);
            $transport->setUsername($this->app['config']['HareruyaEc']['const']['swiftmailer_user']);
            $transport->setPassword('');
            $this->app['mailer'] = new \Swift_Mailer($transport);

            $this->app['hareruya_ec.service.mail']->sendCheckPaymentErrorMail($errorMessages);
        }

        $this->app['hareruya_ec.repository.entry_history']->createEntryHistory($this->app, $entries);
        $this->app['orm.em']->flush();

        return $this->createResult($messages);
```

ベース実装 pf-eccube3 の SlnSearchHelper は SearchLinkPayment で取引照会する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Payment/SlnSearchHelper.php:50-91`
```php
    private function execSearch($entry, $removeFlg = false)
    {
        if ($entry->getPaymentId() !== Payment::EC_CREDIT) {
            return [
                $this->notSplinksPaymentErrorMessage,
                null
            ];
        }

        try {
            // 取引参照を行う。レスポンスコードがOKでない場合は SlnShoppingException が投げられる
            $res = $this->credit->SearchLinkPayment($this->app, $entry, $this->config);

            // 例外が投げられなければOK=決済成功なので申込済みとする
            return [
                '',
                ES::ENTERED
            ];
        } catch (SlnShoppingException $exception) {
            $errorCode = $exception->getSlnErrorCode();
            // 1SSNSearch自体の異常レスポンスコードでなければ、取引が正常終了していないので削除対象とする
            if (!in_array($errorCode, Credit::SEARCH_ERROR_CODES)) {
                if ($removeFlg) {
                    $this->removeRecord($entry);
                }

                return [
                    $this->transactionErrorMessage,
                    ES::CANCELED
                ];
            }

            $errorMassage[] = $exception->getMessage() . '(' . $entry->getPaymentNo() . ')' . '[レスポンスコード:' . $errorCode . ']';
        } catch (Exception $exception) {
            $errorMassage[] = $exception->getMessage() . '(' . $entry->getPaymentNo() . ')';
        }

        // 参照失敗の場合は保留
        return [
            implode("\n", $errorMassage),
            Payment::ON_HOLD
        ];
```

# 根拠
- 設計：
  - B13-01 はSP.LINKS取引照会APIを入力データ元とし、照会結果に応じた処理を要求している: `hareruya-design-docs/excel_to_html/output/0413_基本設計仕様書(バッチ_イベント).html:832-898`
  - 詳細設計も決済サービスへの取引照会とステータス整合を要求している: `hareruya-design-docs/excel_to_html/output/0413_基本設計仕様書(バッチ_イベント).html:905-945`
- ec-cube-enterprise：
  - 実装は getApiResponse を呼ぶが、同メソッドはSP.LINKS照会をせず未実装例外を投げる: `ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:99-105`
  - SP.LINKS取引照会APIは未実装として例外停止する: `ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:191-196`
- ベース実装：
  - pf-eccube3 は `entry:batch checkProssesingPayment` を登録している: `pf-eccube3/app/Plugin/HareruyaEc/Command/EventEntryBatch.php:11-45`
  - pf-eccube3 は対象申込を取得し、共通check処理に渡している: `pf-eccube3/app/Plugin/HareruyaEc/Service/Payment/CheckProcessingPaymentEntry.php:17-28`
  - pf-eccube3 の取引照会は SearchLinkPayment を実行する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Payment/SlnSearchHelper.php:59-91`

# 確認メモ
- 確認コマンド: `rg -n "B13-01|決済処理中チェック|SP\\.LINKS|取引照会|payment_status|PaymentStatusCheck|getApiResponse|checkPayment" excel_to_html/output/0413_基本設計仕様書\(バッチ_イベント\).html design_impl_drift_report/findings/b13-01_0413_sheet-3_sheet.json`
- 確認コマンド: `rg -n "getApiResponse\\(|SP\\.LINKS取引照会API未実装|SearchPaymentByOrderId|PaymentStatusCheckAction|payment-status-check" ../ec-cube-enterprise/src/Eccube/Service/Admin/Payment ../ec-cube-enterprise/src/Eccube/Command ../ec-cube-enterprise/src/Eccube/Service/Payment -g '*.php'`
- 確認コマンド: `rg -n "entry:batch|checkProssesingPayment|checkProcessingPayment|ProcessingPayment|決済処理中チェック|payment_status_check|PaymentStatusCheck" ../pf-eccube3/app/Plugin/HareruyaEc/Command ../pf-eccube3/app/Plugin/HareruyaEc/Service ../pf-eccube3/app/Plugin/HareruyaEc/Repository -g '*.php'`
- 確認コマンド: `rg -n "SearchLinkPayment|SEARCH_ERROR_CODES|Payment::ON_HOLD|ES::ENTERED|sendCheckPaymentErrorMail|createEntryHistory" ../pf-eccube3/app/Plugin/HareruyaEc/Service/Payment ../pf-eccube3/app/Plugin/SlnPayment/Service/SlnAction -g '*.php'`

/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ受注管理
機能：スマレジ商品削除
課題カテゴリ：実装漏れ
課題：スマレジ商品削除の連携失敗時にスマレジ通信エラーメールが送信されない
設計書：0405_基本設計仕様書(バッチ_受注管理).xlsx

# 再現手順【必須】
1. 設計書 B05-05 のエラーハンドリングで、スマレジ連携エラーごとに管理者へメール通知することを確認する
2. ベース実装 pf-eccube3 の `DeleteSmaregiProduct` から `postSmaregiProcess(..., ['delete'])` が呼ばれ、削除連携失敗時に `sendSmaregiErrorMail(..., 'product_upd(delete)', ...)` が実行されることを確認する
3. ec-cube-enterprise の `SmaregiOtcDeleteService` で、スマレジ商品検索または削除API失敗時に `DELETE_FAILED` を返す経路を確認する
4. ec-cube-enterprise の `SmaregiOtcDeleteMessageHandler` で、`DELETE_FAILED` が `MessengerJob::STATUS_FAILED` 更新に留まり、MailService や mailer 送信へ到達しないことを確認する

# 期待される挙動【必須】
- スマレジ商品削除の連携に失敗した場合、スマレジ通信エラーメールを送信する
- エラーが発生したスマレジ連携ごとに、管理者へメール通知する
- 通知には対象注文番号、処理名、スマレジ側エラー情報が含まれる

# 現在の挙動【必須】
- ec-cube-enterprise のスマレジ商品削除サービスは、商品検索API失敗時と削除API失敗時に `logger->error()` して `SmaregiOtcDeleteResult::DELETE_FAILED` を返すが、このサービスの依存関係は Logger/EntityManager/SmaregiProductApiClient だけで、MailService や mailer 送信は呼ばない。

ec-cube-enterprise の削除サービスはメール送信サービスを注入していない: `ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcDeleteService.php:36-43`
```php
final readonly class SmaregiOtcDeleteService
{
    public function __construct(
        private LoggerInterface $logger,
        private EntityManagerInterface $entityManager,
        private SmaregiProductApiClient $productApiClient,
    ) {
    }
```

ec-cube-enterprise は商品検索API失敗時にログ出力して DELETE_FAILED を返すだけ: `ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcDeleteService.php:64-77`
```php
        // 商品コード → スマレジ商品 ID を解決
        $listResult = $this->productApiClient->listByProductCode($apiUrl, $contractId, $accessToken, $productCode);
        if (!$this->isHttpSuccess($listResult['statusCode'])) {
            // 通信/サーバ障害 (4xx/5xx) は「Smaregi 側に存在しない」とは区別する。
            // ここでフラグを ON にすると未削除のまま完了扱いになり再試行されないため、
            // フラグは据え置き DELETE_FAILED を返して MessengerJob の再試行に委ねる。
            $this->logger->error('Smaregi product lookup failed', [
                'orderId' => $Order->getId(),
                'productCode' => $productCode,
                'statusCode' => $listResult['statusCode'],
            ]);

            return SmaregiOtcDeleteResult::DELETE_FAILED;
        }
```

ec-cube-enterprise は商品削除API失敗時にログ出力して DELETE_FAILED を返すだけ: `ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcDeleteService.php:92-102`
```php
        $deleteResult = $this->productApiClient->delete($apiUrl, $contractId, $accessToken, $productId);
        if (!$this->isHttpSuccess($deleteResult['statusCode'])) {
            $this->logger->error('Smaregi product delete failed', [
                'orderId' => $Order->getId(),
                'productCode' => $productCode,
                'productId' => $productId,
                'statusCode' => $deleteResult['statusCode'],
            ]);

            return SmaregiOtcDeleteResult::DELETE_FAILED;
        }
```
- ec-cube-enterprise の Messenger ハンドラは `DELETE_FAILED` を `failJob()` に渡し、`MessengerJob` を `STATUS_FAILED` に更新する。ハンドラのコンストラクタにも MailService はなく、失敗経路でスマレジ通信エラーメールは送信されない。

ec-cube-enterprise の削除ハンドラはメール送信サービスを注入していない: `ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOtcDeleteMessageHandler.php:40-56`
```php
final readonly class SmaregiOtcDeleteMessageHandler
{
    public function __construct(
        private LoggerInterface $logger,
        private EntityManagerInterface $entityManager,
        private SmaregiMessengerJobProcessingLock $smaregiMessengerJobProcessingLock,
        private MessengerJobRepository $messengerJobRepository,
        private OrderRepository $orderRepository,
        private SmaregiAccessTokenService $accessTokenService,
        private SmaregiOtcDeleteService $deleteService,
        private SmaregiMessengerJobContext $smaregiMessengerJobContext,
        private string $smaregiApiIdUrl,
        private string $smaregiApiUrl,
        private string $smaregiApiClientId,
        private string $smaregiApiClientSecret,
        private string $smaregiApiContractId,
    ) {
```

ec-cube-enterprise は DELETE_FAILED を MessengerJob 失敗状態へ変換する: `ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOtcDeleteMessageHandler.php:113-124`
```php
    private function finalizeJob(MessengerJob $Job, SmaregiOtcDeleteResult $result, int $orderId): void
    {
        if ($result === SmaregiOtcDeleteResult::DELETE_FAILED) {
            $this->failJob($Job, sprintf('Smaregi OTC delete failed: result=%s', $result->value));

            return;
        }

        $Job->setStatus(MessengerJob::STATUS_COMPLETED);
        $Job->setCompletedAt(new \DateTime());
        $Job->setErrorMessage(null);
        $this->entityManager->flush();
```

ec-cube-enterprise の失敗確定処理は MessengerJob を FAILED に保存するだけ: `ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOtcDeleteMessageHandler.php:133-145`
```php
    private function failJob(MessengerJob $Job, string $message): void
    {
        try {
            $Job->setStatus(MessengerJob::STATUS_FAILED);
            $Job->setCompletedAt(new \DateTime());
            $Job->setErrorMessage($message);
            $this->entityManager->flush();
        } catch (\Throwable $persistError) {
            $this->logger->error('Failed to persist Smaregi OTC delete job failure state', [
                'jobId' => $Job->getId(),
                'error' => $persistError->getMessage(),
            ]);
        }
```
- ベース実装(pf-eccube3)では削除連携失敗時に `sendSmaregiErrorMail($result, 'product_upd(delete)', $orderNumber)` を呼び、スマレジ通信エラー件名で管理者宛メールを送信する。

ベース実装 pf-eccube3 は削除連携失敗時にスマレジ通信エラーメールを呼ぶ: `pf-eccube3/app/Plugin/HareruyaEc/Service/SmaregiService.php:49-56`
```php
        // 商品情報削除
        if (in_array('delete', $processes)) {
            $result = $this->cURLSmaregi($optionValues[MtbOption::SMAREGI_REQUEST_URL], $header, 'product_upd', json_encode($this->getProductDeleteParams($orderSub, $optionValues)));
            if (is_null($result) || !array_key_exists('result', $result)) {
                $app['hareruya_ec.service.mail']->sendSmaregiErrorMail($result, 'product_upd(delete)', $orderSub->getOrderNumber());

                return;
            }
```

ベース実装 pf-eccube3 のスマレジ通信エラーメール本文は注文番号と処理名を含む: `pf-eccube3/app/Plugin/HareruyaEc/Service/MailService.php:1379-1426`
```php
    public function sendSmaregiErrorMail($result, $process, $orderNumber)
    {
        $mailAddress = $this->app['hareruya_ec.repository.option']->findOneByOptionKey(MtbOption::SMAREGI_ERROR_MAIL_ADDRESS)->getOptionValue();
        // メールアドレスの設定がない場合はスキップ
        if (empty($mailAddress)) {
            return;
        }
        $smaregiMailAddress = [$mailAddress => 'スマレジ通信エラー'];

        switch (substr($result['error_code'], 0, 1)) {
            case '1':
                $errMessage = 'スマレジとの認証に失敗しました。';
                break;
            case '2':
                $errMessage = 'スマレジの設定に失敗しました。';
                break;
            case '3':
            case '4':
                $errMessage = 'データエラーが発生しました。';
                break;
            default:
                $errMessage = '例外エラーが発生しました。';
        }
        $body = <<<EOS
{$errMessage}
Sekappy担当に連絡してください。

注文番号：{$orderNumber}
処理名：{$process}
エラーコード：{$result['error_code']}
エラーメッセージ
{$result['error']}
{$result['error_description']}
EOS;

        $message = \Swift_Message::newInstance()
            ->setSubject('スマレジ通信エラー')
            ->setFrom([$this->baseInfo->getEmail01() => $this->baseInfo->getShopName()])
            ->setTo($smaregiMailAddress)
            ->setBcc($this->baseInfo->getEmail01())
            ->setReplyTo($this->baseInfo->getEmail03())
            ->setReturnPath($this->baseInfo->getEmail04())
            ->setBody($body);

        MailUtil::convertMessage($this->app, $message);
        MailUtil::setParameterForCharset($this->app, $message);

        $this->app->mail($message);
```

# 根拠
- 設計：
  - B05-05 はスマレジ連携エラーごとに管理者へメール通知することを要求している: `hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1550-1565`
  - B05-05 のリバース詳細は pf-eccube3 を挙動参照元としている: `hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1576-1578`
- ec-cube-enterprise：
  - enterprise の削除サービスは商品検索/削除API失敗時に `DELETE_FAILED` を返すがメール送信しない: `ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcDeleteService.php:36-102`
  - enterprise の削除ハンドラは `DELETE_FAILED` を MessengerJob の失敗状態にするだけでメール送信しない: `ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOtcDeleteMessageHandler.php:40-145`
  - Messenger の failure transport はコメントアウトされており、失敗メッセージの別通知経路も確認できない: `ec-cube-enterprise/app/config/eccube/packages/messenger.yaml:1-9`
- ベース実装：
  - pf-eccube3 は削除連携失敗時に `sendSmaregiErrorMail()` を呼び出す: `pf-eccube3/app/Plugin/HareruyaEc/Service/SmaregiService.php:49-56`
  - pf-eccube3 の `sendSmaregiErrorMail()` はスマレジ通信エラー件名で管理者宛に送信する: `pf-eccube3/app/Plugin/HareruyaEc/Service/MailService.php:1379-1426`

# 確認メモ
- 確認コマンド: `rg -n "B05-05|スマレジ商品削除|スマレジ通信エラー|管理者に通知|エラーが発生した場合" excel_to_html/output/0405_基本設計仕様書\(バッチ_受注管理\).html`
- 確認コマンド: `rg -n "sendSmaregiErrorMail|SmaregiErrorMail|スマレジ通信エラー|product_upd\(delete\)|MailService|mailer->send|->send\(|DELETE_FAILED|logger->error|STATUS_FAILED" ../ec-cube-enterprise/src/Eccube/Service/Smaregi ../ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOtcDeleteMessageHandler.php ../ec-cube-enterprise/src/Eccube/Command/SmaregiOtcDeleteCommand.php ../ec-cube-enterprise/src/Eccube/Service/MailService.php 2>/dev/null`
- 確認コマンド: `rg -n "sendSmaregiErrorMail|postSmaregiProcess|product_upd|product_upd\(delete\)|スマレジ通信エラー|管理者" ../pf-eccube3/app/Plugin/HareruyaEc/Service`
- codex gpt-5.5 high reviewer Lagrange: VERIFIED。設計はスマレジ連携失敗時の管理者メールを要求し、pf-eccube3 は `product_upd(delete)` で `sendSmaregiErrorMail()` を呼ぶ。enterprise の B05-05 経路は `SmaregiOtcDeleteCommand` / `SmaregiOtcDeleteService` / `SmaregiOtcDeleteMessageHandler` でログと MessengerJob 失敗更新に留まり、MailService/MailerInterface 注入もない。
- enterprise で `WorkerMessageFailedEvent` / `MessageFailed` / `sendSmaregiErrorMail` / `failure_transport` を確認したが、B05-05 の失敗を管理者メールへ変換する代替経路は見つからない。
- B05-01/B05-04 の共通OTC同期メール漏れとは別に、B05-05は削除専用の `SmaregiOtcDeleteService` / `SmaregiOtcDeleteMessageHandler` 失敗経路でメール送信がないため、削除連携固有の起票として扱う。

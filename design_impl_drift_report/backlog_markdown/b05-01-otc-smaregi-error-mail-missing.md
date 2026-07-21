/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ受注管理
機能：注文番号登録
課題カテゴリ：実装漏れ
課題：スマレジ商品/在庫連携失敗時にスマレジ通信エラー送信メールアドレスへエラーメールを送信していない
設計書：0405_基本設計仕様書(バッチ_受注管理).xlsx

# 再現手順【必須】
1. ec-cube-enterprise で `bin/console eccube:order:otc-smaregi-post` から起動される店頭受取注文のスマレジ連携処理を確認する
2. `SmaregiOtcOrderSyncService::sync()` の商品登録API失敗分岐と在庫登録API失敗分岐が、メール送信ではなく `markError()` と失敗Result返却だけで終了することを確認する
3. `SmaregiOtcSyncMessageHandler::finalizeJob()` / `failJob()` が `PRODUCT_FAILED` / `STOCK_FAILED` を MessengerJob の失敗状態へ記録するだけで、追加設定のスマレジ通信エラー送信メールアドレスへ送信していないことを確認する
4. ベース実装の `SmaregiService` と `MailService::sendSmaregiErrorMail()` が、`product_upd` / `stock_upd` 失敗時に追加設定メールアドレス宛へ送信していることと照合する

# 期待される挙動【必須】
- スマレジ商品登録APIの実行に失敗した場合、エラーメールを送信する
- スマレジ在庫登録APIの実行に失敗した場合、エラーメールを送信する
- エラーメールの送信先は、追加設定のスマレジ通信エラー送信メールアドレスとする

# 現在の挙動【必須】
- ec-cube-enterprise の B05-01 相当処理では、商品登録・在庫登録のAPI失敗時に `markError()` でログ出力と `smaregi_error_flg=true` を行い、`PRODUCT_FAILED` / `STOCK_FAILED` を返す。メッセージハンドラ側も失敗Resultを `MessengerJob` の失敗状態に記録するだけで、`MailService` 注入やスマレジ通信エラー送信メールアドレスの参照、メール送信処理がない。

ec-cube-enterprise の同期サービスはAPI失敗時にエラーフラグを立てる方針で、MailServiceを持たない: `ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:35-52`
```php
 *
 * 各ステップは独立に flush されるため、商品登録のみ完了して在庫登録が失敗しても
 * 次回バッチで在庫登録のみが再試行される (smaregi_product_flg / smaregi_stock_flg の状態に応じて)。
 *
 * API 呼び出し失敗時は smaregi_error_flg を true にし、{@see SmaregiOtcSyncResult} を返す。
 * エラー受注は次回バッチで自動再試行しない方針 (運用側でのフラグ解除を前提)。
 */
final readonly class SmaregiOtcOrderSyncService
{
    public function __construct(
        private LoggerInterface $logger,
        private EntityManagerInterface $entityManager,
        private DtbWaitingNumberRepository $waitingNumberRepository,
        private SmaregiOtcProductCodeGenerator $productCodeGenerator,
        private SmaregiProductApiClient $productApiClient,
        private SmaregiStockApiClient $stockApiClient,
    ) {
    }
```

ec-cube-enterprise の在庫登録失敗分岐は markError と STOCK_FAILED 返却のみ: `ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:112-139`
```php
        // Phase B: stock registration
        if (!$Order->isSmaregiStockFlg()) {
            if ($productId === null) {
                $productId = $this->resolveProductIdByCode($apiUrl, $contractId, $accessToken, $productCode);
                if ($productId === null) {
                    $this->markError($Order, 'Smaregi product id lookup failed for stock add');

                    return SmaregiOtcSyncResult::STOCK_FAILED;
                }
            }

            $stockResult = $this->stockApiClient->add(
                $apiUrl,
                $contractId,
                $accessToken,
                $storeId,
                $productId,
                1,
            );
            if (!$this->isHttpSuccess($stockResult['statusCode'])) {
                $this->markError($Order, sprintf('Smaregi stock add failed (status=%d)', $stockResult['statusCode']));

                return SmaregiOtcSyncResult::STOCK_FAILED;
            }

            $Order->setSmaregiStockFlg(true);
            $this->entityManager->flush();
        }
```

ec-cube-enterprise の商品登録失敗分岐は markError と PRODUCT_FAILED 返却のみ: `ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:165-194`
```php
        if ($categoryId === '') {
            $this->markError($Order, 'Smaregi OTC categoryId is empty');

            return SmaregiOtcSyncResult::PRODUCT_FAILED;
        }

        $body = $this->buildProductBody($Order, $productCode, $categoryId);
        $createResult = $this->productApiClient->create($apiUrl, $contractId, $accessToken, $body);

        if (!$this->isHttpSuccess($createResult['statusCode'])) {
            // create 失敗後にもう一度 listByProductCode で取り直す (競合作成の救済)。
            $retryId = $this->resolveProductIdByCode($apiUrl, $contractId, $accessToken, $productCode);
            if ($retryId !== null) {
                $Order->setSmaregiCode($productCode);
                $Order->setSmaregiProductFlg(true);
                $this->entityManager->flush();

                return $retryId;
            }

            $this->markError($Order, sprintf('Smaregi product create failed (status=%d)', $createResult['statusCode']));

            return SmaregiOtcSyncResult::PRODUCT_FAILED;
        }

        $newId = $this->extractProductId($createResult['json']);
        if ($newId === null) {
            $this->markError($Order, 'Smaregi product create response has no productId');

            return SmaregiOtcSyncResult::PRODUCT_FAILED;
```

ec-cube-enterprise の markError はログと smaregi_error_flg 更新のみ: `ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:323-332`
```php
    private function markError(Order $Order, string $message): void
    {
        $this->logger->error($message, [
            'orderId' => $Order->getId(),
            'orderNumber' => $Order->getOrderNumber(),
            'smaregiCode' => $Order->getSmaregiCode(),
        ]);
        $Order->setSmaregiErrorFlg(true);
        $this->entityManager->flush();
    }
```

ec-cube-enterprise のメッセージハンドラはMailServiceを注入せず同期サービスを呼ぶ: `ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOtcSyncMessageHandler.php:43-60`
```php
final readonly class SmaregiOtcSyncMessageHandler
{
    public function __construct(
        private LoggerInterface $logger,
        private EntityManagerInterface $entityManager,
        private SmaregiMessengerJobProcessingLock $smaregiMessengerJobProcessingLock,
        private MessengerJobRepository $messengerJobRepository,
        private OrderRepository $orderRepository,
        private MtbOptionRepository $mtbOptionRepository,
        private SmaregiAccessTokenService $accessTokenService,
        private SmaregiOtcOrderSyncService $syncService,
        private SmaregiMessengerJobContext $smaregiMessengerJobContext,
        private string $smaregiApiIdUrl,
        private string $smaregiApiUrl,
        private string $smaregiApiClientId,
        private string $smaregiApiClientSecret,
        private string $smaregiApiContractId,
    ) {
```

ec-cube-enterprise の失敗Result処理は failJob のみ: `ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOtcSyncMessageHandler.php:110-139`
```php
                $result = $this->syncService->sync(
                    $Order,
                    $this->smaregiApiUrl,
                    $this->smaregiApiContractId,
                    $accessToken,
                    (string) $smaregiShopId,
                    $categoryId,
                );

                $this->finalizeJob($Job, $result, $message->getOrderId());
            } catch (\Throwable $e) {
                $this->failJob($Job, $e->getMessage());
                $this->logger->error('Smaregi OTC sync handler failed', [
                    'jobId' => $Job->getId(),
                    'orderId' => $message->getOrderId(),
                    'exception' => $e,
                ]);
            }
        } finally {
            $this->smaregiMessengerJobContext->clear();
        }
    }

    private function finalizeJob(MessengerJob $Job, SmaregiOtcSyncResult $result, int $orderId): void
    {
        if (in_array($result, [SmaregiOtcSyncResult::PRODUCT_FAILED, SmaregiOtcSyncResult::STOCK_FAILED], true)) {
            $this->failJob($Job, sprintf('Smaregi OTC sync failed: result=%s', $result->value));

            return;
        }
```

ec-cube-enterprise の failJob はジョブ失敗状態を保存するだけ: `ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOtcSyncMessageHandler.php:163-176`
```php
    private function failJob(MessengerJob $Job, string $message): void
    {
        try {
            $Job->setStatus(MessengerJob::STATUS_FAILED);
            $Job->setCompletedAt(new \DateTime());
            $Job->setErrorMessage($message);
            $this->entityManager->flush();
        } catch (\Throwable $persistError) {
            $this->logger->error('Failed to persist Smaregi OTC sync job failure state', [
                'jobId' => $Job->getId(),
                'error' => $persistError->getMessage(),
            ]);
        }
    }
```
- ベース実装(pf-eccube3)では、スマレジ `product_upd` / `stock_upd` のAPI結果が失敗扱いの場合に `sendSmaregiErrorMail()` を呼び、同メソッドが `MtbOption::SMAREGI_ERROR_MAIL_ADDRESS` から送信先を取得して件名 `スマレジ通信エラー` のメールを送信している。

ベース実装 pf-eccube3 の注文番号登録バッチは店頭受取注文で product/stock のスマレジ連携を呼ぶ: `pf-eccube3/app/Plugin/HareruyaEc/Service/Order/CopyOrderNumber.php:44-55`
```php
        foreach ($orderIdList as $orderId) {
            $orderSub = $this->app['hareruya_ec.repository.order_sub']->find($orderId['id']);
            // スマレジ連携：店頭受取注文を対象とする
            if (in_array($orderSub->getOrder()->getShippings()[0]->getDelivery()->getId(), Delivery::OTC_GROUP)) {
                // スマレジ用商品コード(バーコード)生成＆登録
                $smaregiCode = OrderUtil::getProductBarcode('20', '1', sprintf('%03d', 1), $orderSub->getOrderNumber());
                $orderSub->setSmaregiCode($smaregiCode);
                $this->app['orm.em']->persist($orderSub);
                $this->app['orm.em']->flush();
                // スマレジ連携
                $this->app['hareruya_ec.service.smaregi']->postSmaregiProcess($orderSub, ['product', 'stock']);
            }
```

ベース実装 pf-eccube3 は product_upd / stock_upd 失敗時に sendSmaregiErrorMail を呼ぶ: `pf-eccube3/app/Plugin/HareruyaEc/Service/SmaregiService.php:49-84`
```php
        // 商品情報削除
        if (in_array('delete', $processes)) {
            $result = $this->cURLSmaregi($optionValues[MtbOption::SMAREGI_REQUEST_URL], $header, 'product_upd', json_encode($this->getProductDeleteParams($orderSub, $optionValues)));
            if (is_null($result) || !array_key_exists('result', $result)) {
                $app['hareruya_ec.service.mail']->sendSmaregiErrorMail($result, 'product_upd(delete)', $orderSub->getOrderNumber());

                return;
            }
            $orderSub->setSmaregiDelFlg(true);
            $this->app['orm.em']->persist($orderSub);
            $this->app['orm.em']->flush();
        }
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

ベース実装 pf-eccube3 の sendSmaregiErrorMail は追加設定メールアドレスを宛先にして送信する: `pf-eccube3/app/Plugin/HareruyaEc/Service/MailService.php:1372-1427`
```php
    /**
     * スマレジ通信エラーメール送信
     *
     * @param array  $result
     * @param string $process
     * @param string $orderNumber
     */
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
    }
```

ベース実装 pf-eccube3 は追加設定フォームにスマレジ通信エラー送信メールアドレスを持つ: `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/ConfigType.php:129-134`
```php
            ->add(Option::SMAREGI_ERROR_MAIL_ADDRESS, 'text', [
                'label' => 'スマレジ通信エラー送信メールアドレス',
                'required' => false,
                'constraints' => [
                    new Assert\Email(['strict' => true]),
                ],
```

# 根拠
- 設計：
  - B05-01 はスマレジ商品登録APIと在庫登録APIそれぞれについて、失敗時にエラーメールを送信し、送信先を追加設定のスマレジ通信エラー送信メールアドレスとすると明記している: `hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:960-979`
  - B05-01 のエラーハンドリングはAPI実行失敗時のエラーメール送信を要求している: `hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:997-1004`
- ec-cube-enterprise：
  - enterprise の同期サービスはAPI失敗時に markError と失敗Result返却を行うが、メール送信処理を持たない: `ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:35-52`
  - enterprise の商品登録/在庫登録失敗分岐は markError を呼んで PRODUCT_FAILED または STOCK_FAILED を返すだけ: `ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:112-194`
  - enterprise の markError はログ出力、smaregi_error_flg 更新、flush のみ: `ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:323-332`
  - enterprise のメッセージハンドラは失敗Resultを failJob へ渡し、failJob は MessengerJob の失敗状態だけを保存する: `ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOtcSyncMessageHandler.php:43-176`
  - enterprise にはスマレジ通信エラー送信先に相当する定数はあるが、B05-01のOTC同期経路では参照されていない: `ec-cube-enterprise/src/Eccube/Entity/Master/MtbOption.php:36-45`
- ベース実装：
  - pf-eccube3 の注文番号登録バッチは店頭受取注文を対象に product/stock のスマレジ連携を呼ぶ: `pf-eccube3/app/Plugin/HareruyaEc/Service/Order/CopyOrderNumber.php:44-55`
  - pf-eccube3 はスマレジ product_upd / stock_upd 失敗時にエラーメール送信メソッドを呼ぶ: `pf-eccube3/app/Plugin/HareruyaEc/Service/SmaregiService.php:49-84`
  - pf-eccube3 の sendSmaregiErrorMail は追加設定から宛先を取得し、件名スマレジ通信エラーで送信する: `pf-eccube3/app/Plugin/HareruyaEc/Service/MailService.php:1372-1427`
  - pf-eccube3 の追加設定フォームはスマレジ通信エラー送信メールアドレスを設定項目として持つ: `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/ConfigType.php:129-134`

# 確認メモ
- 確認コマンド: `rg -n "スマレジ連携が成功した場合|失敗した場合エラーメール|スマレジ通信エラー送信メールアドレス|APIの実行に失敗" excel_to_html/output/0405_基本設計仕様書\(バッチ_受注管理\).html`
- 確認コマンド: `rg -n "sendSmaregiErrorMail|スマレジ通信エラー|smaregi_error_mail|smaregi_error_send|MailService|markError|SmaregiOtcOrderSyncService|SmaregiOtcSyncMessageHandler|setSmaregiErrorFlg" ../ec-cube-enterprise/src/Eccube`
- 確認コマンド: `rg -n "sendSmaregiErrorMail|スマレジ通信エラー|SMAREGI_ERROR_MAIL_ADDRESS|product_upd|stock_upd|smaregiErrorFlg" ../pf-eccube3/app/Plugin/HareruyaEc`
- B05-01 の別候補(30分条件、商品コード、部門ID、商品名など)とは分離し、本件はスマレジAPI失敗時メール送信の有無だけを起票単位とする。

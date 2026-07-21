/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ店頭買取管理
機能：買取集計バッチ_部門未設定商品通知メール
課題カテゴリ：実装違い
課題：部門未設定商品通知メールの送信完了ログに件数を記録していない
設計書：0406_基本設計仕様書(バッチ_店頭買取管理).xlsx

# 再現手順【必須】
1. 設計書 B06-02 のログ・監査で、部門未設定商品通知メールは送信開始・送信完了・件数・宛先未設定時の送信せず終了をログに記録すると定義されていることを確認する
2. ベース実装 pf-eccube3 の `MailService::sendNoSectionAlertMail()` が送信完了時に `['count' => $count]` をログへ渡していることを確認する
3. ec-cube-enterprise の `MailService::sendNoSectionAlertMail()` を確認し、送信開始・宛先未設定・送信完了ログはあるが、件数をログコンテキストへ出していないことを確認する

# 期待される挙動【必須】
- 部門未設定商品通知メール送信時は、送信開始をログに記録する
- 宛先未設定時は送信せず終了したことをログに記録する
- 送信完了時は送信完了に加えて件数をログに記録する

# 現在の挙動【必須】
- ec-cube-enterprise の `sendNoSectionAlertMail()` は送信開始、宛先未設定、送信完了を `log_info` するが、送信完了ログは文字列のみで、`count($products)` やメーラーの送信件数などの件数コンテキストを記録していない。

ec-cube-enterprise の部門未設定商品通知メール送信ログ: `ec-cube-enterprise/src/Eccube/Service/MailService.php:1192-1222`
```php
    public function sendNoSectionAlertMail(array $products): void
    {
        log_info('部門未設定商品通知メール送信開始');

        $addresses = $this->resolveOtcSummaryMailAddresses();
        if (empty($addresses)) {
            log_info('部門未設定商品通知メールアドレス未設定のため送信せず終了');

            return;
        }

        $MailTemplate = $this->mailTemplateRepository->findOneBy([
            'mail_key' => $this->eccubeConfig['eccube_otc_buy_order_no_section_alert_mail_template_id'],
        ]);

        $body = $this->twig->render($MailTemplate->getFileName(), [
            'products' => $products,
        ]);

        $message = (new Email())
            ->subject('['.$this->BaseInfo->getShopName().'] '.$MailTemplate->getMailSubject())
            ->text($body)
            ->from(new Address($this->BaseInfo->getEmail01(), $this->BaseInfo->getShopName()))
            ->to(...$addresses)
            ->replyTo($this->BaseInfo->getEmail03())
            ->returnPath($this->BaseInfo->getEmail04());

        try {
            $this->mailer->send($message);
            log_info('部門未設定商品通知メール送信完了');
        } catch (TransportExceptionInterface $e) {
```
- ベース実装(pf-eccube3)では同じ `sendNoSectionAlertMail()` で送信結果を `$count` に受け、送信完了ログに `['count' => $count]` を付けている。

ベース実装 pf-eccube3 の部門未設定商品通知メール送信ログ: `pf-eccube3/app/Plugin/HareruyaEc/Service/MailService.php:1164-1203`
```php
    public function sendNoSectionAlertMail(array $products)
    {
        log_info('部門未設定商品通知メール送信開始');

        $lines = [];
        foreach ($products as $product) {
            $lines[] = "{$product['product_name']}, {$product['product_code']}";
        }
        $text = implode("\n", $lines);

        $body = <<<EOT
        商品名, 商品コード
        {$text}
        EOT;

        $mailAddressString = $this->app['hareruya_ec.repository.option']
            ->findOneByOptionKey(MtbOption::OTC_SUMMARY_MAIL_ADDRESS)
            ->getOptionValue();
        $address = array_filter(explode(',', $mailAddressString));
        if (empty($address)) {
            log_info('部門未設定商品通知メールアドレス未設定のため送信せず終了');

            return 0;
        }

        $message = \Swift_Message::newInstance()
            ->setSubject('部門未設定商品通知メール')
            ->setFrom([$this->baseInfo->getEmail01() => $this->baseInfo->getShopName()])
            ->setTo($address)
            ->setReplyTo($this->baseInfo->getEmail03())
            ->setReturnPath($this->baseInfo->getEmail04())
            ->setBody($body);

        MailUtil::convertMessage($this->app, $message);
        MailUtil::setParameterForCharset($this->app, $message);
        $count = $this->app->mail($message);

        log_info('部門未設定商品通知メール送信完了', ['count' => $count]);

        return $count;
```

# 根拠
- 設計：
  - B06-02 のログ・監査は部門未設定商品通知メールの件数ログを要求している: `hareruya-design-docs/excel_to_html/output/0406_基本設計仕様書(バッチ_店頭買取管理) .html:1109-1110`
- ec-cube-enterprise：
  - enterprise は送信完了ログに件数を付けていない: `ec-cube-enterprise/src/Eccube/Service/MailService.php:1192-1222`
- ベース実装：
  - pf-eccube3 は送信完了ログに `count` を付けている: `pf-eccube3/app/Plugin/HareruyaEc/Service/MailService.php:1164-1203`

# 確認メモ
- 確認コマンド: `rg -n "送信開始|送信完了|件数|宛先未設定|部門未設定商品通知メール|ログ" "excel_to_html/output/0406_基本設計仕様書(バッチ_店頭買取管理) .html"`
- 確認コマンド: `rg -n "sendNoSectionAlertMail|部門未設定商品通知メール|count\(|log_info" ../ec-cube-enterprise/src/Eccube/Service/MailService.php ../ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder ../ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php`
- 確認コマンド: `rg -n "sendNoSectionAlertMail|部門未設定商品通知メール|count\(|log_info" ../pf-eccube3/app/Plugin/HareruyaEc/Service/MailService.php ../pf-eccube3/app/Plugin/HareruyaEc/Service/OtcBuyOrder/SummaryService.php`

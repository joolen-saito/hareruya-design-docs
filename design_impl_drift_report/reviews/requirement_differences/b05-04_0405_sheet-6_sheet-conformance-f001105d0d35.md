# b05-04_0405_sheet-6_sheet 実装漏れ

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b05-04_0405_sheet-6_sheet.json#b05-04_0405_sheet-6_sheet-conformance-f001105d0d35`
- 機能: B05-04 B05-04 スマレジ商品再連携
- 観点: ⑦要求網羅・未実装

## 要旨
スマレジ再連携の失敗時に管理者へ通信エラーメールを送信する要求が、ec-cube-enterprise の OTC 連携実装では実装されていない。

## 判定理由
設計（基本設計）は商品連携・在庫連携それぞれの失敗時に『スマレジ通信エラーメール送信』し、エラー発生時は『発生したスマレジ連携ごとにメールで管理者に通知』すると明記（HTML 1406/1409/1431 行）。ec-cube-enterprise の該当実装 SmaregiOtcOrderSyncService::markError は logger->error と Order.setSmaregiErrorFlg(true) のみ（323-332行）、SmaregiOtcSyncMessageHandler::failJob は MessengerJob を STATUS_FAILED にして errorMessage を設定するのみ（163-171行）で、いずれもメール送信しない。Smaregi 配下のサービス／ハンドラに MailService 注入・mailer->send・Email 生成は無い（rg で 0 件）。MtbOption に SMAREGI_ERROR_MAIL_ADDRESS 定数は存在するが、これを参照する MailService の唯一のメソッドは sendOrderDuplicateNotificationMail（ポイント重複登録通知メール、MailService.php:2235-2276）で、呼び出し元は CheckDuplicatePointAction のみ。スマレジ連携失敗をトリガに管理者へ通信エラーメールを送る経路は存在しない。別ルート・別名（MailService/mailer/Email/SMAREGI_ERROR_MAIL_ADDRESS）も探索したが該当なし。よって実装漏れと確認。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:1406-1431` — 設計要求

```html
            <div class="doc-bullet" style="--lv:3"><span class="doc-marker">・</span><span>連携に失敗した場合はスマレジ通信エラーメール送信</span></div>
            <div class="doc-bullet" style="--lv:2"><span class="doc-marker">・</span><span>在庫情報の更新</span></div>
            <div class="doc-bullet" style="--lv:3"><span class="doc-marker">・</span><span>スマレジ在庫情報未連携の場合は、在庫情報の更新をする</span></div>
            <div class="doc-bullet" style="--lv:3"><span class="doc-marker">・</span><span>連携に失敗した場合はスマレジ通信エラーメール送信</span></div>
            <h3 class="doc-h doc-h-section" style="--lv:0">実行トリガー　スケジュール起動(Step Functions)　実行タイミング　10分ごと</h3>
            <h3 class="doc-h doc-h-section" style="--lv:0">入力データ元　DB　出力先(フォーマット)　DB, スマレジ</h3>
            <h3 class="doc-h doc-h-section" style="--lv:0">入力データ詳細</h3>
            <div class="doc-bullet" style="--lv:1"><span class="doc-marker">・</span><span>DBから下記条件を満たすスマレジ未連携の注文データを取得</span></div>
            <div class="doc-bullet" style="--lv:2"><span class="doc-marker">・</span><span>スマレジ商品コードが登録されている</span></div>
            <div class="doc-bullet" style="--lv:2"><span class="doc-marker">・</span><span>スマレジ削除フラグが立っていない</span></div>
            <div class="doc-bullet" style="--lv:2"><span class="doc-marker">・</span><span>スマレジ商品連携が未連携 もしくはスマレジ在庫連携が未連携</span></div>
            <h3 class="doc-h doc-h-section" style="--lv:0">入力データ検索条件</h3>
            <h3 class="doc-h doc-h-section" style="--lv:0">項目名　条件　備考</h3>
            <p class="doc-p" style="--lv:0">注文データ.スマレジ商品コード　スマレジ商品コードが登録されている</p>
            <p class="doc-p" style="--lv:0">注文データ.スマレジ削除フラグ　スマレジ削除フラグが立っていない</p>
            <p class="doc-p" style="--lv:0">注文データ.スマレジ商品連携フラグ or <br>注文データ.スマレジ在庫連携フラグ　スマレジ商品連携が未連携<br>もしくはスマレジ在庫連携が未連携</p>
            <h3 class="doc-h doc-h-section" style="--lv:0">実行結果詳細  ※主にDBの登録・更新結果について記載</h3>
            <h4 class="doc-h doc-h-sub" style="--lv:1">スマレジ商品連携が未連携の場合</h4>
            <p class="doc-p" style="--lv:2">スマレジプラットフォームAPIでスマレジに商品を登録する</p>
            <p class="doc-p" style="--lv:2">スマレジ登録が成功したら、当該注文データのスマレジ商品連携フラグを立てる</p>
            <h4 class="doc-h doc-h-sub" style="--lv:1">スマレジ在庫連携が未連携の場合</h4>
            <p class="doc-p" style="--lv:2">スマレジプラットフォームAPIでスマレジに在庫を登録する</p>
            <p class="doc-p" style="--lv:2">スマレジ登録が成功したら、当該注文データのスマレジ在庫連携フラグを立てる</p>
            <p class="doc-p" style="--lv:1">※ 一つの注文データで、スマジレ商品連携、スマレジ在庫連携どちらも未連携になっている状態も想定されるので注意</p>
            <h3 class="doc-h doc-h-section" style="--lv:0">エラーハンドリング</h3>
            <div class="doc-bullet" style="--lv:1"><span class="doc-marker">・</span><span>エラーが発生した場合、発生したスマレジ連携ごとにメールで管理者に通知</span></div>
```

## ec-cube-enterprise 実装
API失敗時はログ出力とsmaregi_error_flg設定のみ。メール送信なし。
`ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:323-332` — 実装（連携失敗処理・メール無し）

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

MessengerJobをFAILEDにしてerrorMessageを設定するのみ。管理者メール送信なし。
`ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOtcSyncMessageHandler.php:163-171` — 実装（ジョブ失敗化・メール無し）

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
```

この定数を参照する送信メソッドはポイント重複登録通知用であり、スマレジ連携失敗通知ではない。
`ec-cube-enterprise/src/Eccube/Service/MailService.php:2235-2247` — SMAREGI_ERROR_MAIL_ADDRESSの唯一の利用先（別用途）

```php
    public function sendOrderDuplicateNotificationMail(array $orderNumbers): void
    {
        log_info('ポイント重複登録通知メール送信開始');

        $address = $this->mtbOptionRepository
            ->findOneBy(['option_key' => MtbOption::SMAREGI_ERROR_MAIL_ADDRESS])
            ?->getOptionValue() ?? '';

        if ($address === '') {
            log_info('ポイント重複登録通知メールアドレス未設定のため送信せずに終了');

            return;
        }
```

## 不在確認コマンド

- `rg -n 'MailService|mailer|->send\(|Swift_|Email\b' /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOtcSyncMessageHandler.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOtcDeleteMessageHandler.php`
- `rg -rn 'sendOrderDuplicateNotificationMail' /home/y-saito/Developments/ec-cube-enterprise/src`
- `rg -n 'SMAREGI_ERROR_MAIL_ADDRESS|SMAREGI_ERROR_SEND_MAILADDRESS|smaregi_error_mail_address' /home/y-saito/Developments/ec-cube-enterprise/src`

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証4観点を試したが全て失敗。指摘は維持。(1)別実装探索: enterprise 全 src を sendSmaregiErrorMail / sendSmaregi* / send*ErrorMail / '通信エラー' / smaregi×mail で横断したが、スマレジ商品・在庫再連携の失敗を契機に管理者へ通信エラーメールを送る経路は皆無。MailService の smaregi 関連送信は sendOrderDuplicateNotificationMail のみで用途はポイント重複通知(2235-2276行)。B05-04 バッチ本体は OtcOrderSmaregiPostCommand→SmaregiOtcOrderPostAction→SmaregiOtcSyncMessageHandler→SmaregiOtcOrderSyncService で構成され、失敗時は markError(323-332: logger->error+setSmaregiErrorFlg のみ)/failJob(163-171: MessengerJob を FAILED+errorMessage のみ)/PostAction(72行: enqueue 失敗 log のみ)で、いずれもメール送信なし。OrderRepository::getSmaregiErrorOrder(933)・getResendSmaregiProduct(797)は存在するが呼び出し元ゼロ(dead code)で、エラー注文を集めてメール送信する別バッチも無い。(2)引用検証: markError/failJob/sendOrderDuplicateNotificationMail の該当行を実開封し記載通りと確認。(3)設計除外: 図形テキスト『こちらのバッチは不要となる』とリバース詳細設計の失敗時=コンソール出力記述は反証候補だが、バッチは実際に実装済み(OtcOrderSmaregiPostCommand)で除外は成立せず、権威ある基本設計(更新2025-10-02)は 1406/1409/1431 行で『連携に失敗した場合はスマレジ通信エラーメール送信』『発生したスマレジ連携ごとにメールで管理者に通知』を明記。(4)要求の読み違い検証: 現行正リポ pf-eccube3 の同一処理 SmaregiService::postSmaregiProcess(53/65/78行)が失敗時に sendSmaregiErrorMail を実際に呼んでおり、メール送信要求が実在かつ移行先で欠落していることを裏付け。よって実装漏れは確定。

# バッチ 会員管理 — 身分証有効期限切れ通知

## 業務ロジック

### 対象の判定

実行した日に事前通知日数を加えた日の0時0分を基準日時とし、身分証有効期限日が基準日時以前の会員を対象とする。身分証有効期限日が既に過ぎている会員も対象に含む。

対象は身分証有効期限日だけで決め、本人確認ステータスでは絞り込まない。身分証有効期限日が未設定の会員は対象にならない。

対象の並び順は定めていない。

### 会員ごとの更新と送信

対象の会員を1件ずつ処理する。会員ごとに、更新を確定してから、その会員へメールを送る。

途中で異常が起きて処理が中断したときは、その時点で打ち切る。それまでに処理した会員の更新と送信は取り消さない。打ち切ったときは管理者宛メールを送らない。

メールの送信結果が0通のときは異常として扱わない。配信履歴を保存して次の会員へ進み、最後に管理者宛メールも送る。

### 会員宛メール

会員宛メールの件名と本文は、メールテンプレート「身分証有効期限切れ通知メール」に登録されたものを使う。

本文に会員ごとの差し込みは無く、すべての会員に同じ文面を送る。会員の住所や表示言語によらず、日本語の文面を送る。

返信先には基本情報の返信受付メールアドレスを、送信エラーの戻り先には基本情報の送信エラー受付メールアドレスを設定する。

送信した件名・本文・送信日時を、その会員のメール配信履歴として保存する。配信履歴には使用したメールテンプレートを紐づけ、作成者は設定しない。

### 管理者宛メール

管理者宛メールは、対象の会員すべての処理が終わった後に1通だけ送る。

宛先は、追加システム設定の「身分証の有効期限切れ会員送信メールアドレス」に設定されたメールアドレスとする。カンマで区切った複数のメールアドレスが設定されているときは、そのすべてに送る。

この設定が空のときは、管理者宛メールを送らずに終える。このときも、会員の更新と会員宛メールの送信は済んでいる。

本文の氏名は、会員の姓と名を半角空白でつないだものとする。

返信先と送信エラーの戻り先は、会員宛メールと同じものを設定する。

管理者宛メールはメール配信履歴に保存しない。

### 実行するバッチの名前

実行するバッチの名前を引数で受け取る。引数が無いとき、または実行できるバッチの名前と一致しないときは、実行日時を添えたメッセージを出力し、何も処理せずに異常終了する。

バッチの名前に続けて追加の引数を指定できるが、このバッチでは使わない。追加の引数を9個まで指定したときは通常どおり処理する。10個すべてを指定したときは、処理を始める前に異常終了する。

## 入出力

| 種類 | 内容 |
| --- | --- |
| 入力 | 実行するバッチの名前。追加の引数（9個まで。このバッチでは使わない） |
| 成功時出力 | 開始時に「Command start:」に続けて年/月/日 時:分:秒を、完了時に「Command complete:」に続けて年/月/日 時:分:秒を出力する |
| 失敗時出力 | 実行するバッチの名前が一致しないときに、角括弧で囲んだ年/月/日 時:分に続けて「Nothing args or command.」を出力する |

本バッチでは、いずれの場合も他のAPIを呼び出さない。

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 登録 | 会員への通知を送信したときの、その会員の配信履歴（件名・本文・送信日時・使用したテンプレート） |

## 表示メッセージ

この機能は、いずれの場合も画面のメッセージを扱わない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 対象の判定 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Customer/IdExpireNotification.php:42 |
| 対象の判定 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbPlayerRepository.php:155 |
| 会員ごとの更新と送信 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Customer/IdExpireNotification.php:50 |
| 会員ごとの更新と送信 | P1 | pf-eccube3:src/Eccube/Application/ApplicationTrait.php:174 |
| 会員宛メール | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1841 |
| 会員宛メール | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/doctrine/migration/Version20250225160039.php:15 |
| 会員宛メール | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mail/id_expire_notification.twig:1 |
| 会員宛メール | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1799 |
| 管理者宛メール | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1873 |
| 管理者宛メール | P1 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/ConfigType.php:285 |
| 管理者宛メール | P1 | pf-eccube3:src/Eccube/Entity/Customer.php:254 |
| 実行するバッチの名前 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Command/CustomerBatch.php:43 |
| 実行するバッチの名前 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Command/CustomerBatch.php:28 |
| 実行するバッチの名前 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Command/CustomerBatch.php:62 |
| 会員宛メール | P1 | pf-eccube3:src/Eccube/Form/Type/Admin/ShopMasterType.php:115 |

# バッチ 受注管理 — ポイント利用未反映チェック

## 業務ロジック

### 通知先が未設定のとき

通知先メールアドレスが未設定のときは、該当する注文があってもメールを送らずに終了する。通知先はシステム設定の「ポイント利用が反映されない決済の送信先メールアドレス」から取り、カンマ区切りで複数のあて先を指定できる。

### 決済会社の出力情報との照合

決済会社の出力情報は、ソニーペイメントサービス決済プラグインが注文ごとに保持する決済状態から読む。決済状態の金額が、購入金額合計と支払合計のうち大きい方と一致する注文だけを対象にする。決済状態を持たない注文は対象にならない。

### 異常が起きたとき

注文の取得や通知メールの送信で例外が起きたときは、その時点で処理を打ち切る。例外の内容はコンソールの標準エラー出力へ出し、終了コードは0以外になる。異常を記録する専用の画面やログは無く、確認できるのはコンソールの出力だけである。

## 入出力

### 通知メールの内容

| 項目 | 内容 |
| --- | --- |
| 件名 | ポイント利用が反映されない決済を通知するメール |
| 差出人 | 店舗基本情報に登録された店名とメールアドレス。返信先・返送先も店舗基本情報の登録値を使う |
| 本文 | 先頭に見出し行「オーダーID」を置き、続けて抽出した注文IDを注文IDの降順で並べる |

## 表示メッセージ

本バッチは画面メッセージを扱わない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 通知先が未設定のとき | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1538 |
| 通知先が未設定のとき | P1 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/ConfigType.php:230 |
| 決済会社の出力情報との照合 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderRepository.php:1912 |
| 決済会社の出力情報との照合 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderRepository.php:1920 |
| 決済会社の出力情報との照合 | P1 | pf-eccube3:app/Plugin/SlnPayment/config.yml:1 |
| 異常が起きたとき | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Order/CheckNotReflectedPointUsage.php:24-36 |
| 異常が起きたとき | P2 | pf-eccube3:app/Plugin/HareruyaEc/Command/OrderBatch.php:51-54 |
| 通知メールの内容 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1529 |
| 通知メールの内容 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderRepository.php:1923 |
| 通知メールの内容 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1548 |
| 通知メールの内容 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1549 |

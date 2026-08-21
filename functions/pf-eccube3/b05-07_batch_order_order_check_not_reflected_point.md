# バッチ 受注管理 — ポイント利用未反映チェック

## 業務ロジック

### 通知先が未設定のとき

通知先メールアドレスが未設定のときは、該当する注文があってもメールを送らずに終了する。通知先はシステム設定の「ポイント利用が反映されない決済の送信先メールアドレス」から取り、カンマ区切りで複数のあて先を指定できる。

## 入出力

### 通知メールの内容

| 項目 | 内容 |
| --- | --- |
| 件名 | ポイント利用が反映されない決済を通知するメール |
| 差出人 | 店舗基本情報に登録された店名とメールアドレス。返信先・返送先も店舗基本情報の登録値を使う |
| 本文 | 先頭に見出し行「オーダーID」を置き、続けて抽出した注文IDを注文IDの降順で並べる |

### 入出力: 永続化

本バッチは受注・会員・ポイント履歴を更新しない。

## 表示メッセージ

本バッチは画面メッセージを扱わない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 通知先が未設定のとき | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1538 |
| 通知先が未設定のとき | P1 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/ConfigType.php:230 |
| 通知メールの内容 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1529 |
| 通知メールの内容 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderRepository.php:1923 |
| 通知メールの内容 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1548 |
| 通知メールの内容 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1549 |
| 入出力: 永続化 | P3 | 0405:sheet-9 |

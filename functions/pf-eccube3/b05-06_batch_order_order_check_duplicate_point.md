# バッチ 受注管理 — ポイント二重登録チェック

## 業務ロジック

### 通知メールの送信可否

通知先は、システム設定の「スマレジ通信エラー送信メールアドレス」に登録されたメールアドレスとする。この設定が空のときは、二重登録を検出していても通知メールを送らずに終了する。

### 通知後の扱い

ポイント残高の補正は、通知を受けた管理者の手作業に委ねる。本バッチは検出結果を通知するだけで、受注・会員のポイント残高・ポイント履歴のいずれも更新しない。

## 入出力

### 出力: メール

| 項目 | 内容 |
| --- | --- |
| 件名 | ポイント重複登録通知メール |
| 差出人 | 店舗基本情報に登録された店名とメールアドレス。返信先・返送先も店舗基本情報の登録値を使う |
| 本文 | 「ポイントの重複登録を検知しました。」「注文番号を確認してポイント残高を修正してください。」の2行に続けて、「注文番号:」の見出し行を置き、その後へ検出した注文番号を1行1件で並べる |

同じ受注が複数の組合せで検出されても、その注文番号は本文に1件だけ並ぶ。

### 入出力: 永続化

いずれの場合もデータを更新しない。

## 表示メッセージ

この機能は、いずれの場合も画面のメッセージを扱わない。

## 出典
| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 通知メールの送信可否 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1448 |
| 通知メールの送信可否 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/ConfigType.php:130 |
| 通知後の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Order/CheckDuplicatePoint.php:30-54 |
| 通知後の扱い | P3 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1441-1442 |
| 出力: メール | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1440-1460 |
| 出力: メール | P3 | pf-eccube3:app/Plugin/HareruyaEc/Util/OrderUtil.php:23 |

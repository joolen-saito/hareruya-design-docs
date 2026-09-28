# バッチ 受注管理 — 購入完了手続き再処理

## 業務ロジック

### 受注ごとの独立性

受注1件ごとに更新をまとめて確定するため、1件の失敗を他の受注へ波及させない。処理中に例外が発生した受注はエラーメッセージを出力し、次の受注へ進む。在庫の更新を確定したあとに注文完了メールを再送信するので、メールの再送信で例外が起きても、その受注の在庫履歴と販売数の更新は残る。対象の受注が無いときは何もせずに完了する。

### 受注番号の桁揃え

在庫履歴と注文完了メールに載せる受注番号は、8桁のゼロ埋めにする。受注番号がまだ採番されていない受注では空欄になる。

### 在庫履歴の登録内容

在庫履歴と販売数は、注文完了時と同じ処理で登録・更新する。登録する在庫履歴の内容は注文完了時と同じになる。

| 記録項目 | 値 |
| --- | --- |
| 件数 | 受注明細1行ごとに1件 |
| 変動種別 | 受注 |
| 変動後の在庫数 | 商品規格の現在の在庫数 |
| 変動前の在庫数 | 商品規格の現在の在庫数に明細の数量を足した値 |
| メモ | 「受注による減算 注文番号：<8桁の受注番号> 受注時価格：<明細の価格> 円」 |

### 再送するメールの言語

会員の都道府県が海外のときは英語、それ以外のときは日本語のテンプレートで再送する。テンプレートは支払方法ごとに定めたものを使う。

## 入出力

### 出力: 外部連携

在庫履歴を登録するとき、対象になった商品規格の在庫数を支店へ通知する。

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 更新 | 受注明細1行ごとに、その明細の数量を、商品規格の当日・3日間・1週間・1ヶ月・90日間・180日間・365日間の各販売数へ加算する。昨日販売数には加算しない |

## 表示メッセージ

本バッチは画面の文言を持たない。出力するのは未完了である旨と、受注ごとのエラーメッセージである。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 受注ごとの独立性 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Order/ResendMail.php:48 |
| 受注番号の桁揃え | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Order/ResendMail.php:62 |
| 在庫履歴の登録内容 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Order/ResendMail.php:64 |
| 在庫履歴の登録内容 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ShoppingController.php:538 |
| 在庫履歴の登録内容 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/ShoppingService.php:841-863 |
| 在庫履歴の登録内容 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbStockHistoryRepository.php:35-54 |
| 在庫履歴の登録内容 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:225 |
| 再送するメールの言語 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Order/ResendMail.php:77 |
| 再送するメールの言語 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:852 |
| 出力: 外部連携 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/ShoppingService.php:863 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/ShoppingService.php:847 |

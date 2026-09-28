# バッチ 商品管理 — お気に入り商品セール通知

## 業務ロジック

### 通知の対象

お気に入りは商品と言語の組で保持し、セール中かどうかもその組で判定する。お気に入りに登録した言語の側がセール中である商品だけが通知の対象になる。会員グループに「店内注文専用アカウント」または「支店店内注文専用アカウント」が設定されている会員は対象にしない。対象が無いときはメールを送らずに完了する。

### 通知メールの体裁

本文は会員の氏名で始まり（英語のメールは名・姓の順）、続けて対象商品を1商品1行で並べる。各行の先頭にはお気に入りを登録した言語のコードを付け、商品名は日本語のメールでは日本語名、英語のメールでは英語名を出す。差出人は基本情報設定のショップ名と代表メールアドレス、返信先とエラー戻し先も基本情報設定に従い、件名・ヘッダー・フッターはメールテンプレートに登録された内容を用いる。

### 再実行

同じ起動を繰り返すと、同じ対象へ再び通知することがある。

送信済みかどうかは判定しない。起動のたびに、その時点でセール中のお気に入り商品を持つ会員を抽出し直し、該当する会員へ通知メールを送る。通知回数の上限や重複の抑止は無い。メール送信履歴は送信のたびに残るが、会員には紐づけず、送信済みの判定には使わない。

### エラー時の扱い

| 事象 | 扱い |
| --- | --- |
| 起動時の指定が不正 | 処理を行わずに終了し、指定が不正である旨を出力する |
| 抽出・送信の途中で異常が起きた | その時点で処理が止まり、以降の会員には通知されない。完了の出力も行わない |

## 入出力

| 種類 | 内容 |
| --- | --- |
| 成功時出力 | 開始と完了の出力 |

開始と完了は、コンソールの標準出力へ1行ずつ出す。どちらの行も実行時刻とバッチ名（`saleNotification`）を含み、処理件数は含まない。

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 登録 | 通知メールを送信するたびに、件名・本文・送信日時と用いたメールテンプレートをメール送信履歴として残す |

## 表示メッセージ

この機能は画面を持たないためメッセージを扱わない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 通知の対象 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbFavoriteProductRepository.php:24-51 |
| 通知の対象 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/Customer/CustomerGroupType.php:50-57 |
| 通知メールの体裁 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1249-1272 |
| 通知メールの体裁 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mail/sale_notification.twig |
| 通知メールの体裁 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mail/sale_notification.en.twig |
| 再実行 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Product/SaleNotificationService.php:27-68 |
| 再実行 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1275 |
| 再実行 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1823-1824 |
| 入出力 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Command/ProductBatch.php:53-56 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Command/ProductBatch.php:39-58 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Product/SaleNotificationService.php:27-68 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1276 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1799-1825 |

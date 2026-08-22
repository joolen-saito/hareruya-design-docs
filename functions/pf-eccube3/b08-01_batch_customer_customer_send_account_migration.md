# バッチ 会員管理 — リニューアル時パスワードリセットメール送信

## 業務ロジック

### 本文の言語の決め方

会員に登録された国が日本以外のときは英語の本文とパスワード再設定URLを送る。国が日本のとき、および国が登録されていないときは日本語の本文とパスワード再設定URLを送る。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| コマンド名が未指定・不一致 | 実行日時を添えた案内をコンソールに出力し、対象の抽出も送信も行わずに終了する |
| 宛先のメールアドレスが電子メールの規格に沿わない | その会員への送信を飛ばし、会員IDを添えてコンソールに出力したうえで次の会員の処理へ進む。バッチは中断しない |

## 入出力

本バッチは外部のAPIを呼び出さない。

### 入力

実行するバッチのコマンド名と、抽出の基準日時。基準日時は年4桁・月2桁・日2桁・時2桁・分2桁を続けた12桁の数字で与える。

### コンソールへの出力

処理の開始時刻と終了時刻。送信が100件進むごとに、そこまでに処理した件数とメモリ使用量。

### 送信するメールの返信先とエラー返送先

返信先には基本情報に登録された返信先アドレスを、宛先不達の返送先には基本情報に登録されたエラー返送先アドレスを設定する。

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |

画面を持たないため利用者向けのメッセージを表示しない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 本文の言語の決め方 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:895-906 |
| エラー時の扱い | P1 | pf-eccube3:app/Plugin/HareruyaEc/Command/CustomerBatch.php:42-46 |
| エラー時の扱い | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:936-938 |
| 入力 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/CustomerRepository.php:46 |
| コンソールへの出力 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Command/CustomerBatch.php:50-52 |
| コンソールへの出力 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Service/Customer/SendAccountMigration.php:47-49 |
| 送信するメールの返信先とエラー返送先 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:914-915 |

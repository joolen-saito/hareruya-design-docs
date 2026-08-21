# バッチ 会員管理 — ポイント差分発生通知

## 業務ロジック

### 対象から外れる会員

ポイント履歴が1件も無い会員は、保有ポイントが0でなくても差分の対象にならない。

### 通知先が未設定のとき

通知先のメールアドレスが設定されていないときは、通知を行わずに終了する。このときも保有ポイントの補正は行われ、補正されたことは通知されない。通知先はカンマ区切りで複数を指定できる。

### 起動時の引数

実行するバッチ名が指定されていない、または該当するバッチが無いときは、何も処理せずに異常終了する。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 実行するバッチ名 |
| 出力 | 開始時刻と終了時刻をコンソールへ出力する。バッチ名が該当しないときは、その旨を時刻付きでコンソールへ出力する |

## 表示メッセージ

本バッチは画面メッセージを扱わない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 対象から外れる会員 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbPointHistoryRepository.php:197-210 |
| 通知先が未設定のとき | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/MailService.php:1569-1599 |
| 通知先が未設定のとき | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Customer/AdjustPointVariance.php:45-53 |
| 起動時の引数 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Command/CustomerBatch.php:35-55 |

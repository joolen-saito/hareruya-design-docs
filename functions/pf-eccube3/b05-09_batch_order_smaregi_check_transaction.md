# バッチ 受注管理 — スマレジ取引連携エラー再連携

## 業務ロジック

### 取引情報の取得

スマレジへの接続設定（接続先URL、契約ID、アクセストークン）をオプションマスタから取得し、取引情報の取得に用いる。取得する取引は、取引区分が通常のものに限る。

### 再連携結果の記録

再連携の対象と判定した取引の取引IDをログに出力する。再連携した取引が1件以上あるときは、その件数をログに出力する。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 実行時の指定が本バッチと一致しない | 実行日時を添えた該当なしのメッセージをコンソールへ出力し、再連携を行わずに終了する。終了コードは1 |
| 取引情報の取得失敗 | 失敗内容をコンソールへ出力し、再連携を行わずに終了する。終了コードは成功時と同じ0 |
| 取得結果が空 | 何もせず正常終了する |

## 入出力

### 入出力: 入力と出力

| 種類 | 内容 |
|------|------|
| 入力 | バッチ実行時に指定する対象バッチ名、スマレジ接続設定（接続先URL・契約ID・アクセストークン） |
| 成功時出力 | 再連携の対象と判定した取引IDと、再連携した件数のログ出力 |
| 失敗時出力 | 取得失敗内容のコンソール出力 |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |

本バッチは画面へメッセージを表示しない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 取引情報の取得 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Smaregi/CheckSmaregiTransaction.php:68-79 |
| 取引情報の取得 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Smaregi/CheckSmaregiTransaction.php:136-154 |
| 再連携結果の記録 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Service/Smaregi/CheckSmaregiTransaction.php:159-189 |
| エラー時の扱い | P1 | pf-eccube3:app/Plugin/HareruyaEc/Command/SmaregiBatch.php:41-52 |
| エラー時の扱い | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Smaregi/CheckSmaregiTransaction.php:46-56 |
| 入出力: 入力と出力 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Command/SmaregiBatch.php:33-52 |
| 入出力: 入力と出力 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Smaregi/CheckSmaregiTransaction.php:39-60 |

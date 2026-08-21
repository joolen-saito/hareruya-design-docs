# バッチ 受注管理 — スマレジEC受注連携エラー再連携

## 業務ロジック

### 対象

会員情報とプレイヤー情報を持たない受注は対象にならず、連携エラーフラグが立ったまま残る。対象が1件も無いときは何もせずに完了する。

### 再連携後の状態

再連携に成功しても、前回の失敗で記録されたポイント連携エラーメッセージは消えない。受注編集画面には、解消済みのエラー内容が残ったまま表示される。

### 流量制御

スマレジへのリクエストが1秒あたり10回を超えないよう、受注1件ごとに0.1秒のインターバルを置く。

## 入出力

### 実行時の指定

実行するバッチの名前を指定して起動する。名前の指定が無いとき、および定義されていない名前を指定したときは、何も処理せずに終了コード1で終了する。処理を終えたときは終了コード0を返す。

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |

本バッチは画面へメッセージを表示しない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 対象 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbOrderSubRepository.php:185-189 |
| 対象 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Smaregi/CheckSmaregiErrorOrder.php:31-33 |
| 再連携後の状態 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Smaregi/CheckSmaregiErrorOrder.php:37-41 |
| 再連携後の状態 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Order/EditController.php:104 |
| 流量制御 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Smaregi/CheckSmaregiErrorOrder.php:44-46 |
| 実行時の指定 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Command/SmaregiBatch.php:37-45 |
| 実行時の指定 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Command/SmaregiBatch.php:47-52 |

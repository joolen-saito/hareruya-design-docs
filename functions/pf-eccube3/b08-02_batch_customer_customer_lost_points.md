# バッチ 会員管理 — ポイント失効

## 業務ロジック

### 起動時のバッチ名

起動時に渡されたバッチ名が未指定のとき、または定義済みのバッチ名のいずれとも一致しないときは、失効処理を一切行わない。一致したときだけ失効処理を実行する。

### 対象会員の絞り込み

スマレジ会員IDが登録されていない会員は、有効期限を過ぎたポイントを持っていても対象に含めない。

有効期限の判定に用いる基準日時は、実行時刻の時分秒を切り捨てて0時0分0秒とする。

### 会員ごとの処理間隔

対象会員は1件ずつ順に処理し、1件を処理するごとに0.1秒の待ち時間を置いてから次の会員へ進む。

### 更新の確定

会員ごとの更新はその都度は確定せず、対象会員をすべて処理し終えた時点でまとめて確定する。処理の途中で異常終了した場合、その回の保有ポイントの更新もポイント履歴の記録も一件も残らない。

## 入出力

### 起動引数と終了状態

| 種類 | 内容 |
| --- | --- |
| 入力 | 起動時に渡すバッチ名 |
| 出力 | 終了状態。失効処理を実行したときは正常終了、バッチ名が未指定・不一致のときは異常終了とする |

## 表示メッセージ

このバッチは画面へ文言を表示しない。

## 出典
| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 起動時のバッチ名 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Command/CustomerBatch.php:43 |
| 対象会員の絞り込み | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbPointHistoryRepository.php:38 |
| 対象会員の絞り込み | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbPointHistoryRepository.php:225 |
| 会員ごとの処理間隔 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Customer/LostPoints.php:41 |
| 更新の確定 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Customer/LostPoints.php:63 |
| 起動引数と終了状態 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Command/CustomerBatch.php:46 |

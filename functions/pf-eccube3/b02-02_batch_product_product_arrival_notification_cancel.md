# バッチ 商品管理 — 入荷通知キャンセル

## 業務ロジック

### 対象の入荷通知リクエスト

削除日時が未設定の入荷通知リクエストのうち、次のいずれかに当てはまるものを対象とする。対象が無いときは何も更新せずに完了する。

- 紐づく商品規格が削除済みである
- 紐づく商品が存在しない
- 紐づく商品が削除済みである

紐づく商品規格のデータそのものが存在しない入荷通知リクエストは、対象にならない。

### 再実行の扱い

削除日時が未設定の行だけを対象とするため、既に論理削除済みの行が再び対象になることはなく、重複して削除することもない。

### エラー時の扱い

| 事象 | 扱い |
| --- | --- |
| 起動時の指定が不正 | 該当するバッチが無い旨を出力し、処理を行わずに終了する |
| 一括更新の失敗 | 更新は反映されず、完了の出力を行わずに終了する |

## 入出力

### 起動と実行結果

| 種類 | 内容 |
| --- | --- |
| 入力 | 起動時の指定のみで、引数は取らない |
| 実行結果 | 実行の開始時と完了時に、実行日時を添えて出力する |
| 失敗時 | 完了の出力を行わない |

## 表示メッセージ

この機能は画面を持たないためメッセージを扱わない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 対象の入荷通知リクエスト | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbProductRequestRepository.php:250-278 |
| 再実行の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbProductRequestRepository.php:261 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Command/ProductBatch.php:47-51 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Product/DeleteProductRequest.php:27-30 |
| 起動と実行結果 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Command/ProductBatch.php:42-57 |

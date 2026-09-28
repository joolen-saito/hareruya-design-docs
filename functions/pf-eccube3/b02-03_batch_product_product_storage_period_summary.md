# バッチ 商品管理 — 期間別入庫数集計

## 業務ロジック

### 集計値の求め方

集計値は、在庫が直前の在庫を上回った履歴だけを取り出し、その増加分（在庫と直前の在庫の差）を合計したものである。在庫が減った履歴・変わらない履歴は0として数え、減少分を差し引かない。

### 期間の数え方

期間に入るかどうかの判定は登録日時の日付部分だけで行い、時刻は見ない。

前日以外の各期間は、起動日からその期間の日数だけさかのぼった日を始点とし、その日を含めて起動日当日までの履歴を数える。

「1ヶ月」は暦の月ではなく28日として数える。

起動日の366日前の履歴は取得の対象に含むが、どの期間の集計値にも加えない。最も長い365日間の期間は、起動日の365日前を始点とする。

### 集計に現れない単位の扱い

対象の在庫変動履歴が1件も無い単位は集計結果に現れず、更新の対象にならない。前回の集計値がそのまま残る。

### 起動と異常時の扱い

| 状況 | ふるまい |
| --- | --- |
| 起動時に処理の名前が指定されていない、または対応する処理が無い名前である | 何も集計せず、その旨を実行結果として返して終了する |
| 集計結果が1件も無い | 何も更新せずに完了する |
| 処理の途中で異常が起きた | それまでに反映した分は残る。全体をまとめて取り消さない |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 起動時に受け取る処理の名前。集計のための引数は取らない。 |
| 成功時出力 | 集計結果に現れた単位の入庫数だけが、求め直した値で置き換わる。現れなかった単位は前回の値のまま残る。 |
| 失敗時出力 | 途中で異常が起きた場合、それまでに反映した分だけが残る。 |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 入庫数の集計値の反映 | 集計結果の1行ごと（行単位で確定する） |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |

画面を持たないため利用者向けのメッセージを表示しない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 集計値の求め方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbStockHistoryRepository.php:308-328 |
| 期間の数え方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbStockHistoryRepository.php:310-318 |
| 期間の数え方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbStockHistoryRepository.php:323-324 |
| 集計に現れない単位の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbStockHistoryRepository.php:327 |
| 起動と異常時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Command/ProductBatch.php:42-58 |
| 入出力: 永続化 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Product/UpdateProductSummaryForStockUp.php:28-41 |
| 入出力: 永続化 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:653-671 |

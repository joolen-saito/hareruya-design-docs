# バッチ 商品管理 — 期間別販売数集計

## 業務ロジック

### 販売数の数え方

販売数は、対象期間内の受注明細の数量を合計した値である。受注の件数ではない。

### 集計期間の取り方

各期間は実行日を基準に遡って数える。前日は実行日の前日1日分だけを数える。それ以外の期間は実行日から所定の日数を遡った日以降の受注日時を対象とするため、実行日当日の受注も含む。遡る日数は、週が7日、月が28日である。期間の判定は受注日時の日付部分だけで行い、時刻は見ない。

### 反映先

当日分の販売数の列は毎回0で初期化する。集計対象期間に受注明細が1件も無かった集計単位は更新の対象にならず、前回までの販売数がそのまま残る（0にはならない）。集計結果が1件も無いときは何も更新しない。

### 再実行

再実行すると実行時点のデータで集計し直し、対象の販売数を上書きする。重複して加算されることはない。途中で失敗したときは、それまでに反映した分の更新だけが残る。

販売数の更新は商品規格ごとに1件ずつ確定する。処理中に例外が起きたときは、それまでに更新した商品規格の販売数は反映済みのまま残り、未処理の商品規格は更新されない。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| コマンド名が未指定・不一致 | 集計を行わず、実行時刻を伴うエラーメッセージをコンソールへ出力して終了する |
| 集計対象なし | 更新を行わず完了する |
| 処理中の例外 | そこで処理を打ち切り、完了メッセージを出力しない。反映済みの分の更新は残る |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | コマンド名とバッチ名。第2引数以降は集計に使用しない |
| 実行時出力 | 実行時刻を伴う開始と完了のメッセージをコンソールへ出力する |
| 終了状態 | コマンド名が未指定・不一致のときは異常終了、それ以外は正常終了として返す |

起動するコマンドは `product:batch` で、第1引数のバッチ名に `updateProductSummary` を指定する。第2引数以降を指定したときも、集計の対象は変わらない。

## 表示メッセージ

本バッチは画面メッセージを扱わない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 販売数の数え方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderDetailRepository.php:334 |
| 集計期間の取り方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderDetailRepository.php:334-340 |
| 反映先 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:634-644 |
| 反映先 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderDetailRepository.php:341-350 |
| 再実行 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Product/UpdateProductSummary.php:31-41 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Command/ProductBatch.php:45-58 |
| 再実行 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Product/UpdateProductSummary.php:34-42 |
| 再実行 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:645 |
| 入出力 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Command/ProductBatch.php:12-24 |
| 入出力 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Command/ProductBatch.php:30-32 |
| 入出力 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Command/ProductBatch.php:33-36 |
| 入出力 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Command/ProductBatch.php:53 |
| 入出力 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Command/ProductBatch.php:66-73 |
| 入出力 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Product/UpdateProductSummary.php:19-23 |

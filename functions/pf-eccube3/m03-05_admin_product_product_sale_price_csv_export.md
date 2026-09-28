# 商品管理 — セール用価格変更CSV出力

## 業務ロジック

### 出力対象の決定

商品一覧で選択した商品IDを受け取り、その商品を出力対象とする。

| 判定 | 結果 |
|------|------|
| 商品IDを1件も受け取らなかったとき | 商品未選択のエラーを表示し、保持しているページ番号の商品一覧へ戻る |
| 指定IDに対応する商品が1件も無いとき | 出力せず、選択した商品が見つからない旨のエラーとする |
| 一部のIDが存在しないとき | 取得できた商品だけを出力対象とし、存在しないIDは無視する |
| 商品の規格が0件のとき | その商品は行を増やさない。選択した商品がすべて規格0件のときはヘッダ行だけのCSVとなり、エラーにはしない |

出力処理中は実行時間の上限を設けず、選択件数が多くても時間切れで打ち切らない。

### 出力する行と値

1行は状態NMの規格1件に対応する。同じ商品に状態NMの規格が複数あるときは、その件数だけ行が出る。規格があっても状態NMの規格が1件も無い商品は、行を出さない。規格の並び順は商品一覧の表示順との一致を保証しない。

価格・セールフラグ・帯URLは規格ごとの値、商品IDとタグ(ID)は商品ごとの値であり、同じ商品の各行に同じ値が繰り返される。

| 値 | 決め方 |
|----|--------|
| 言語(ID) | 規格の言語ID。設定が無いときは空欄 |
| セールフラグ | セールでないとき、および値が無いときは0、セール中のときは1 |
| 帯URL | 規格の帯URL。設定が無いときは空欄 |
| タグ(ID) | 商品に紐づくタグIDを並び順のままカンマで連結する。一意化しないため、同じIDが複数含まれることがある |

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 商品IDを1件も受け取らなかったとき | 商品未選択のエラーを表示し、保持しているページ番号の商品一覧へ戻る |
| 指定IDに対応する商品が1件も無いとき | 選択した商品が見つからない旨のエラーとする |
| その他の実行時エラーのとき | エラーメッセージを表示し、直前の画面へ戻る |

指定IDに対応する商品が1件も無いときは、CSV出力を要求した画面（要求元として送られた画面）へ戻す。商品一覧から出力したときは、出力を要求したページの商品一覧へ戻る。

## 入出力

### 入出力の対応

| 種類 | 内容 |
|------|------|
| 入力 | 商品一覧で選択した商品IDの並び |
| 成功時出力 | CSVファイル。ファイル名は接頭辞`product_price_`と出力日時と拡張子`.csv`を連結したもの。先頭にはBOMを付与する。値はUTF-8から設定の出力エンコーディングへ変換して出力し、区切り文字は出力用の設定値による |
| 失敗時出力 | エラーメッセージ付きで商品一覧または直前の画面へ戻る |

本機能はデータを更新しない。

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M03-05-MSG-001 | 管理画面上部 | 1つ以上の商品を選択してください | セール用価格変更CSVを出力するとき、商品を選択していないとき | エラーを表示し、商品一覧画面に遷移する |
| M03-05-MSG-002 | 管理画面では表示されない（フロント用の通知領域に格納） | 存在しないカードIDが含まれています。 | セール用価格変更CSVを出力するとき、選択した商品が見つからないとき | エラーを表示し、直前の画面または商品一覧画面に遷移する |

補足: M03-03-MSG-001・M03-03-MSG-002（カード商品CSV出力）と M03-04-MSG-002（グッズ商品CSV出力）は同一処理の別経路に由来し、本機能（セール用価格変更CSV出力）の画面フローでは表示されないため、m03-03・m03-04 へ再割当済みであり本表には含めない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 出力対象の決定 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1697 |
| 出力対象の決定 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/ProductPriceCsv.php:111 |
| 出力対象の決定 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1694 |
| 出力する行と値 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/ProductPriceCsv.php:148 |
| 出力する行と値 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:268 |
| 出力する行と値 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:2085 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:2269 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1704 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1706-1709 |
| 入出力の対応 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/ProductPriceCsv.php:133 |
| 入出力の対応 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/CsvExportService.php:369 |
| 入出力の対応 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Service/CsvExportService.php:362 |
| 入出力の対応 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Product/index.twig:355 |

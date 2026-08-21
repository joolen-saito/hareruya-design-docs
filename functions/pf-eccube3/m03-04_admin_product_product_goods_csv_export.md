# 商品管理 — グッズ商品CSV出力

## 業務ロジック

### 出力対象の決め方

商品一覧で選択した商品IDを受け取る。1件も選択されていないときは出力せず、商品一覧へ戻す。戻り先のページ番号は保持している商品検索のページ番号、無ければ1とする。

指定した商品IDのうち存在しないものは無視し、取得できた商品だけを出力する。指定が1件以上あるのに商品を1件も取得できないときは出力せずエラーとする。

### 出力しない商品

カード詳細が関連付けられている商品と、規格が0件の商品は出力しない。カード詳細ありと無しが混在するときは、カード詳細が無い商品だけが出力される。この除外の結果、出力する行が1行も無くなってもエラーにはならず、ヘッダ行だけのCSVを出力する。

### 行の単位

1商品につき規格の数だけ行を複製し、規格ごとに規格依存列を上書きする。行になるのは、商品に紐づく規格のうちカード状態がNMのものだけで、該当する規格が無い商品は行が作られない。規格の並びは一覧の表示順とは一致しない。

規格ごとに値が変わるのは 商品コード・発送日目安(ID)・販売制限数・販売価格・買取価格 で、それ以外の列は同一商品の全行で同じ値を繰り返す。

### 値の作り方

タグIDは重複を除いたうえでカンマ連結する。売上分析タグIDと商品画像ファイル名もカンマ連結し、カテゴリIDは空の値を除いてカンマ連結する。「規格画像」列には商品側の画像のファイル名が入り、一覧の規格単位画像とは別の値である。「発送日目安(ID)」列に入るのは発送日目安のIDではなく名称である。「略称タグ(ID)」列は未設定のとき空文字とする。

ヘッダ行にはグッズ商品CSV登録が受け取るヘッダ定義の項目名を同じ並びで出力し、データ行も同じ並びで値を並べる。

### ファイル名

接頭辞 product_goods_ と実行日時（年月日時分秒）と拡張子 .csv を連結する。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 商品IDが1件も選択されていない | 出力せず商品一覧へ戻す（ページ番号は保持値、無ければ1） |
| 指定IDに対応する商品が1件も無い | 出力せずエラーとし、直前画面へ戻す |

## 入出力

### 入力と出力

| 種類 | 内容 |
|------|------|
| 入力 | 商品IDの配列 |
| 成功時出力 | CSVのダウンロード。ファイル名は product_goods_（実行日時）.csv。先頭にBOMを付ける。区切り文字と文字コードは出力設定に従い、応答にも同じ文字コードを指定する |
| 失敗時出力 | エラーメッセージを表示し、商品一覧または直前画面へ戻す。CSVは出力しない |

### 入出力: 永続化

本機能は業務データを更新しない。

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M03-04-MSG-002 | 管理画面上部 | 1つ以上の商品を選択してください | CSV出力する商品を1件も選択せずに実行したとき | エラーを表示し、管理画面_商品管理_商品一覧画面に遷移する |
| M03-04-MSG-001 | 未表示（エラーとして保持されるが画面には出ない） | 存在しないカードIDが含まれています。 ／ admin.csv.error.export.no_goods_data | 選択した商品IDの中に存在しないIDが含まれる、または対象商品のグッズCSV出力行がない状態で、グッズ商品CSV出力を実行したとき | CSVは出力されず、リファラーがあればその画面へ、なければ商品一覧画面へリダイレクト |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 出力対象の決め方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1663-1666 |
| 出力対象の決め方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:2269-2275 |
| 出力対象の決め方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:85 |
| 出力対象の決め方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/ProductGoodsCsv.php:121-124 |
| 出力しない商品 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/ProductGoodsCsv.php:165-175 |
| 出力しない商品 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/ProductGoodsCsv.php:122-139 |
| 行の単位 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/ProductGoodsCsv.php:214-229 |
| 行の単位 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:268-284 |
| 値の作り方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/ProductGoodsCsv.php:176-212 |
| 値の作り方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/ProductGoodsCsv.php:221 |
| 値の作り方 | P2 | pf-eccube3:src/Eccube/Entity/DeliveryDate.php:15-18 |
| 値の作り方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:2000-2027 |
| 値の作り方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/ProductGoodsCsv.php:133-134 |
| ファイル名 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/AbstractCsvService.php:331-335 |
| エラー時の扱い | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1669-1677 |
| 入力と出力 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/ProductGoodsCsv.php:126-147 |
| 入力と出力 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/AbstractCsvService.php:343-353 |
| 入力と出力 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/CsvExportService.php:360-371 |

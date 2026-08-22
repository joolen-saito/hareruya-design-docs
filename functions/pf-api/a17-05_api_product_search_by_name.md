# API 店頭買取管理 — 商品名から商品詳細の情報を取得

## 業務ロジック

### 商品の絞り込み

検索する商品名は、空白またはカンマで区切って語に分ける。分けたすべての語を含む商品だけを対象とし、語は部分一致で判定する。各語は商品名（日本語）と商品名（英語）のどちらかに含まれていればよい。

対象になるのは、公開されているときで、かつ削除されていない商品に限る。商品規格も、削除されていないものだけを対象とする。販売価格が0以下のときは、その商品規格を対象から外す。

### 取得できる条件

| 順序 | 判定 | 結果 |
| --- | --- | --- |
| 1 | 商品名が未指定のとき | 該当なし（HTTP 404） |
| 2 | 商品名に一致する商品がないとき | 該当なし（HTTP 404） |
| 3 | 対象の商品サブクラス情報がないとき | 該当なし（HTTP 404） |
| 4 | 上記以外のとき | 商品配列を返す |

### 商品のまとめ方

商品ID・言語・高額商品コードの組み合わせを単位として商品をまとめ、商品ごとにカテゴリ・地域制限・商品名を設定する。カード詳細を持つ商品のときは、商品名の先頭に言語コードを付す。

### 商品規格の絞り込み

各商品規格のうち、良品（NM）であるもの、または販売価格が表示下限以上のものだけを商品規格として加える。画像はファイル名からURLへ変換して並べる。各商品の商品規格は、カードコンディションの昇順に並ぶ。

商品ごとに、良品（NM）以外の商品規格で在庫があり販売価格が表示下限以上のものが1件もないときは、良品（NM）の商品規格だけに絞る。高額商品コードを持つ商品のときは、この絞り込みを行わず、良品（NM）以外の商品規格もそのまま返す。

カードコンディションコードは、商品サブクラスにメモがあるときはメモの値を返し、無いときはカードコンディションのコードを返す。

## 入出力

### 出力: 失敗時の応答

該当なし（HTTP 404）のときは、処理結果コードとメッセージの2項目だけを返し、商品の配列は含めない。

### 入出力: 永続化

本APIはデータを更新しない。

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| — | API応答の処理結果メッセージ | Not Found | 商品名が未指定のとき、または該当する商品・商品サブクラスがないとき | 該当なし（HTTP 404）で終了する |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 商品の絞り込み | P1 | pf-api:src/Repository/DtbProductSubClassRepository.php:373 |
| 商品の絞り込み | P1 | pf-api:src/Repository/DtbProductSubClassRepository.php:425 |
| 商品の絞り込み | P1 | pf-api:src/Repository/DtbProductSubClassRepository.php:436 |
| 取得できる条件 | P1 | pf-api:src/Controller/ProductController.php:306 |
| 商品のまとめ方 | P2 | pf-api:src/Controller/ProductController.php:344 |
| 商品規格の絞り込み | P1 | pf-api:src/Controller/ProductController.php:358 |
| 商品規格の絞り込み | P1 | pf-api:src/Controller/ProductController.php:553 |
| 商品規格の絞り込み | P1 | pf-api:src/Controller/ProductController.php:586 |
| 商品規格の絞り込み | P2 | pf-api:src/Repository/DtbProductSubClassRepository.php:416 |
| 商品規格の絞り込み | P3 | pf-api:src/Repository/DtbProductSubClassRepository.php:437 |
| 出力: 失敗時の応答 | P2 | pf-api:src/Controller/ProductController.php:311 |
| 入出力: 永続化 | P3 | pf-api:src/Controller/ProductController.php:306 |

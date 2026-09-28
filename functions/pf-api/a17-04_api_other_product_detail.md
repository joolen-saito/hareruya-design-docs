# API その他 — 商品IDに紐づく商品詳細の情報を取得

## 業務ロジック

### 取得対象

対象は公開状態の商品に限る。削除済みの商品・商品規格、および販売価格が0以下の商品規格は取得しない。該当する明細が1件も無いときは該当なし（HTTP 404）とする。

商品本体の情報（商品名・言語コード・商品説明・カテゴリ・言語別販売分けフラグ）は、取得した明細の先頭から取る。

明細は言語ID、状態（カードコンディション）ID、商品規格IDの昇順に並べる。先頭の明細は、この並びで最初に来る明細である。

### カード商品の扱い

カード情報を持つ商品（カード商品）のときは、商品名の先頭に言語コードを付す。カード商品でないときはカード詳細情報を空（null）で返す。パワーとタフネスは値が無いとき空（null）とし、忠誠度も値が無いとき空（null）とする。

### 出力する商品規格

明細のうち、状態がニアミント（NM）であるもの、または販売価格が状態表示の下限価格以上のものだけを商品規格として返す。並び順は状態、商品規格IDの昇順とする。

状態コードは、商品規格に備考が登録されているときはその備考を、登録が無いときは状態マスタのコードを返す。販売制限数が未設定または0のときは空（null）を返す。商品画像はファイル名を配信URLへ変換した配列で返し、同一のファイル名は重複させない。

### 週間販売数

各明細の週間販売数を合算した値を返す。商品規格として出力しなかった明細の分も合算に含める。

### 値の取り方

応答の金額・数量は取得時点の値をそのまま返し、再計算や丸めは行わない。表示用の加工は呼び出し元の設計による。

## 入出力

### 失敗時の応答

該当する商品詳細が無いときは、レスポンス結果に404を、メッセージに「Not Found」を設定して返す。

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|
| A17-04-MSG-001 | API応答JSON（errors配列） | 商品詳細の取得に失敗しました | 商品詳細レスポンス生成中に例外が発生 | API呼出元でHTTP 500とerrors配列を処理する |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 取得対象 | P1 | pf-api:src/Repository/DtbProductRepository.php:343-362 |
| 取得対象 | P1 | pf-api:src/Controller/ProductController.php:410 |
| 取得対象 | P1 | pf-api:src/Repository/DtbProductRepository.php:365-368 |
| 取得対象 | P1 | pf-api:src/Controller/ProductController.php:421-422 |
| カード商品の扱い | P2 | pf-api:src/Controller/ProductController.php:425 |
| カード商品の扱い | P2 | pf-api:src/Controller/ProductController.php:433-444 |
| 出力する商品規格 | P1 | pf-api:src/Controller/ProductController.php:454 |
| 出力する商品規格 | P2 | pf-api:src/Controller/ProductController.php:462 |
| 出力する商品規格 | P3 | pf-api:src/Repository/DtbProductRepository.php:318 |
| 出力する商品規格 | P3 | pf-api:src/Repository/DtbProductRepository.php:313 |
| 出力する商品規格 | P3 | pf-api:src/Controller/ProductController.php:467-468 |
| 出力する商品規格 | P3 | pf-api:src/Repository/DtbProductRepository.php:365-367 |
| 週間販売数 | P2 | pf-api:src/Controller/ProductController.php:453 |
| 値の取り方 | P1 | pf-api:src/Controller/ProductController.php:456-463 |
| 失敗時の応答 | P2 | pf-api:src/Controller/ProductController.php:411 |

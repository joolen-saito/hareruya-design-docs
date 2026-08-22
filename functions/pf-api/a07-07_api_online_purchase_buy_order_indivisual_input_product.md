# API ネット買取管理 — 複数ネット買取IDから個別入力商品の一覧を取得

## 業務ロジック

### 取得の範囲と並び

指定されたネット買取受注IDのうち、紐づく個別入力商品が無いIDは結果に現れず、該当した分だけを返す。該当が1件も無いときは空配列を返し、エラーとしない。

返す順序は定めていない。

取得した値をそのまま応答へ整形する。金額の再計算・表示用の丸めは行わない。

### エラー時の扱い

| 事象 | 扱い |
| --- | --- |
| トークンが欠落しているとき、署名が不正なとき、該当する管理者アカウントが無いとき | 認証拒否（HTTP401）とする |
| 該当が0件のとき | エラーとせず、HTTP200で空配列を返す |
| 取得処理中に例外が起きたとき | 処理失敗（HTTP500）として共通例外処理に委ねる |

## 入出力

### 入力: 認証

| パラメータ | 位置 | 必須／任意 | 説明 |
| --- | --- | --- | --- |
| jwt-token | ヘッダ | 必須 | 認証用のトークン。署名方式はHS256。ペイロードの利用者IDに一致する管理者アカウントを引き当て、見つからないときは認証拒否とする |

### 出力: 値が未設定のときの扱い

買取金額・枚数・売却フラグは、値が未設定のときnullを返す。

## 表示メッセージ

この機能は、いずれの場合もメッセージを扱わない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 取得の範囲と並び | P1 | pf-api:src/Repository/DtbBuyOrderIndivisualInputProductRepository.php:16 |
| 取得の範囲と並び | P1 | pf-api:src/Controller/Admin/BuyOrderIndivisualInputProductController.php:23 |
| エラー時の扱い | P1 | pf-api:src/Controller/BaseController.php:23 |
| 入力: 認証 | P1 | pf-api:src/Controller/BaseController.php:26 |
| 出力: 値が未設定のときの扱い | P3 | pf-api:src/Resources/config/doctrine/DtbBuyOrderIndivisualInputProduct.orm.yml:30 |

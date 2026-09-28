# F05-04（ネット買取商品詳細）

## 業務ロジック

### 画面のふるまい

| 対象 | ふるまい |
|------|------|
| カートへの追加 | 非同期で買取カートへ登録し、完了・失敗・上限超過のダイアログを表示する（F05-05を正とする） |
| 買取数量 | 詳細画面で選べる買取数量は1〜20とする |
| カート追加の上限超過 | 同じ規格について、買取カート内の数量と追加する数量の合計が20点を超えるときは、数量を保存せず、上限超過のダイアログを表示する |
| カート追加の失敗 | 規格の指定が空の追加はエラー応答とし、押した「カートに追加」の付近に追加失敗を通知する。買取カートは変更しない |
| 商品クラスの切り替え | 選んだ商品クラスを選択状態にし、対応する商品画像へ切り替える。選択した言語・商品クラスは画面のURLの指定へ反映する |
| 同名カード一覧の商品画像 | 読み込み中の画像を先に出し、一覧に表示された時点で実画像へ差し替える |

### 初期表示の決め方

商品IDから商品詳細を取得する。取得できないときはページなし（HTTP404）とする。

| 項目 | 決め方 |
|------|------|
| 初期表示言語 | 指定された言語が有効ならその言語、無効・未指定なら先頭の言語とする |
| 初期表示の商品クラス | 指定されたクラスが有効ならそのクラス、無効・未指定なら当該言語の先頭クラスとする |

### 買取価格と同名カード

| 項目 | 内容 |
|------|------|
| 買取価格表示 | 状態ごとに登録済みの買取価格をそのまま表示する。本機能では価格を計算しない |
| 同名カードの抽出 | 基本土地のときは同名カードの一覧を取得しない |

### カテゴリ一覧

カテゴリ一覧は、販売側の商品カテゴリ一覧と同じデータ（カードセット、レアリティ、カテゴリ）から、同じツリー構造と表示項目で表示する。各カテゴリの遷移先は、販売側の商品検索に代えて買取商品検索とする。販売側と異なり、遷移先に並び順の指定を付けない。販売側だけが表示する決済・受取・発送・ポイントの販促バナーは表示しない。

### 旧商品コードからの転送

旧商品コードから新商品コードへの対応を取得する。対応が無いときはトップページへ戻す。新商品コードで商品を取得できないときもトップページへ戻す。取得できたときは、その商品の買取商品詳細（商品ID・言語付き）へ遷移する。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 商品IDの商品が無いとき | ページなし（HTTP404）とする |
| 旧コードに対応が無いとき、または商品を取得できないとき | トップページへ戻す |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 商品ID、言語・商品クラスの指定、転送時は旧商品コード |
| 成功時出力 | 買取商品詳細の画面、または転送先詳細への遷移 |
| 失敗時出力 | 商品が無いときはHTTP404、旧コードの対応が無いときはトップページへの遷移 |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|---|---|---|---|---|
| — | 詳細の価格表の見出し | 状態／数量／買取価格 等 | 価格表を表示したとき | 画面に留まる |
| — | 買取操作 | カートに追加 | 買取価格が買取最低価格以上の言語・状態のとき | 買取カートへ追加する |

カート追加結果の文言（追加完了・追加失敗・上限超過）はF05-05を正とする。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 画面のふるまい | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/purchase_js.twig:20-42 |
| 画面のふるまい | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Purchase/detail.twig:122-125 |
| 画面のふるまい | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/product_detail_js.twig:63-74 |
| 画面のふるまい | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/purchase_product.twig:9 |
| 初期表示の決め方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/PurchaseController.php:553-573 |
| 買取価格と同名カード | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Purchase/detail.twig:118 |
| 買取価格と同名カード | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/PurchaseController.php:583-598 |
| 旧商品コードからの転送 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/PurchaseController.php:634-646 |
| エラー時の扱い | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/PurchaseController.php:556-557 |
| カテゴリ一覧 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Block/CategoryController.php:10-32 |
| カテゴリ一覧 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/purchase_category.twig:6-25 |
| カテゴリ一覧 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/doctrine/migration/Version20190131015500.php:47-81 |
| 画面のふるまい | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/PurchaseController.php:420-454 |
| 画面のふるまい | P1 | pf-eccube3:app/Plugin/HareruyaEc/Entity/ProductClass.php:12 |

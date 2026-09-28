# F05-03（ネット買取商品一覧）

## 業務ロジック

### 表示の判定順序

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | 検索条件が空か | 空なら検索フォームだけを表示する |
| 2 | 総件数が0件か | 0件なら一覧を見つからない扱いとし、0件案内を表示する |
| 3 | 総件数が上限（9999）を超えるか | 超えるときは商品を取得せず、上限超過の案内を表示し、外部へ検索時のURLと件数を通知する。通知に失敗しても案内の表示は続ける |
| 4 | 上記を通過 | 件数・表示順・ページ送りとともに商品一覧を表示する |

### タグの説明文

タグが1件だけ指定されているときは、そのタグに登録された説明文を一覧の上部に表示する。

### 表示件数

1ページの件数は既定60件で、指定によって変更できる。

件数はURLのクエリパラメータ pageSize で指定する。pageSize が空または0のときは60件とする。それ以外の値は上限を設けずにそのまま1ページの件数とする。

### 画面の内容

絞り込みにはマナコストがあり、色の選択をすべて解除する操作を持つ。
商品画像は遅延読み込みし、読み込みが済むまで読み込み中の画像を表示する。
絞り込みの行と表示順の行は、PCとスマートフォンで表示する内容を出し分ける。
一覧の下部には検索フォームを表示する。

### カテゴリ一覧

カテゴリ一覧は、販売側の商品カテゴリ一覧と同じデータ（カードセット、レアリティ、カテゴリ）から、同じツリー構造と表示項目で表示する。各カテゴリの遷移先は、販売側の商品検索に代えて買取商品検索とする。販売側と異なり、遷移先に並び順の指定を付けない。販売側だけが表示する決済・受取・発送・ポイントの販促バナーは表示しない。

### 買取価格とカート追加

各商品規格に登録済みの買取価格を表示する。本機能では価格を計算しない。

数量欄の初期値は1点とする。数量上限の判定と、追加完了・追加失敗・上限超過のダイアログは、ネット買取カート（F05-05）を正とする。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 検索条件、表示順、ページ番号、1ページの表示件数。 |
| 成功時出力 | 件数・表示順・ページ送りを伴う買取商品一覧。 |
| 失敗時出力 | 0件のときは見つからない扱いの応答、上限超過のときは超過案内と外部への件数通知。 |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| — | 一覧上部 | 商品数: （件数）点 | 一覧表示時。上限超過時は「9999+」を表示する | 一覧に留まる |
| — | 一覧本文 | ご指定の条件に一致する商品が多すぎます。さらに絞り込むための条件を追加してください。 | 総件数が上限（9999）を超えるとき | 商品を取得せず一覧に留まる |
| — | 一覧本文 | お探しのカードは見つかりませんでした。（買取最低保証・ヘルプへの案内を含む） | 検索結果が0件のとき | ページ全体を見つからない扱いとする |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 表示の判定順序 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/PurchaseController.php:489-542 |
| 表示の判定順序 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ProductSearchTrait.php:30-84 |
| タグの説明文 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Purchase/product_list.twig:125-127 |
| 表示件数 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/PurchaseController.php:39 |
| 画面の内容 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Purchase/product_list.twig:155-165 |
| 画面の内容 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Purchase/product_list.twig:353 |
| 画面の内容 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/purchase_product.twig:9 |
| 買取価格とカート追加 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/purchase_product.twig:20 |
| 買取価格とカート追加 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/purchase_product.twig:30 |
| カテゴリ一覧 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Block/CategoryController.php:10-32 |
| カテゴリ一覧 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/purchase_category.twig:6-25 |
| カテゴリ一覧 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/doctrine/migration/Version20190131015500.php:47-81 |
| 表示件数 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/PurchaseController.php:522 |
| 表示件数 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ProductSearchTrait.php:40-42 |

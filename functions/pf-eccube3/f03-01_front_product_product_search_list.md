# F03-01（商品一覧）

## 業務ロジック

### 検索条件を指定せずに開いたとき

検索条件が1つも指定されていないときは、検索フォームとログイン用フォームだけを表示し、商品一覧・商品数・ページ送りを表示しない。

### カードセットを指定した検索での表示

カードセットを条件に指定した検索では、そのカードセットに登録された表示用のHTMLを、商品一覧より上に表示する。

### 検索結果から一覧に載せる商品

検索結果として返された商品のうち、商品情報を引き当てられなかったものは一覧に載せない。このため、一覧に並ぶ商品の数が、表示している商品数を下回ることがある。

### 価格・在庫の表示

一覧の各商品には、その商品規格の販売価格と在庫数量を表示する。

### 他の状態に載せる範囲

「他の状態」に並べるのは、販売価格が下限額（確認値 100 円）以上の状態に限る。下限額に満たない状態は「他の状態」に載せない。

### 総ページ数

総ページ数は、総件数を1ページあたりの件数で割って切り上げた数とする。

### 絞り込みの選択状態

選択中の絞り込み条件は、選択状態を示す画像に切り替えて示す。絞り込み条件の並びは、PC用とスマートフォン用で異なる。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 検索条件・並び順・ページ番号（いずれも未指定を許す） |
| 成功時出力 | 商品一覧の画面 |
| 失敗時出力 | なし（検索結果の有無で応答の種類を変えない） |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| F03-01-MSG-001 | 画面上部 | ご指定のカテゴリは存在しません | 存在しないカテゴリを指定して商品一覧を表示したとき | 商品一覧を表示せず、同じ画面に留まる |
| F03-01-MSG-002 | 商品一覧の結果領域 | お探しの商品は見つかりませんでした | 検索条件に一致する商品がないとき | 商品一覧を表示したまま、該当商品なしを案内する |
| F03-01-MSG-003 | 商品一覧のステータス表示領域 | "%original%"では商品が見つかりませんでした。 | 検索語、fallback情報および補正語が存在するとき | 補正語による検索結果（0件を含む）と案内を商品一覧内に表示する |
| F03-01-MSG-004 | 商品一覧のステータス表示領域 | "%fallback%"で検索結果を表示しています。 | 検索語、fallback情報および補正語が存在するとき | 補正語による検索結果（0件を含む）と案内を商品一覧内に表示する |
| F03-01-MSG-005 | 商品一覧のステータス表示領域 | ご指定の条件に一致する商品が多すぎます。 | 検索条件に一致する商品数が表示上限を超えたとき | 商品一覧を表示したまま、詳細検索で条件を追加して絞り込むよう案内する |
| F03-01-MSG-006 | 商品一覧のステータス表示領域 | さらに絞り込むための条件を追加してください。 | 検索条件に一致する商品数が表示上限を超えたとき | 商品一覧を表示したまま、詳細検索で条件を追加して絞り込むよう案内する |
| — | 商品数の表示領域 | 商品数:（件数）点 | 検索結果一覧の表示時 | — |
| — | 一覧領域 | ご指定の条件に一致する商品が見つかりませんでした。 | 抽出件数が0件のとき | 商品一覧を表示しない |
| — | 一覧領域 | ご指定の条件に一致する商品が多すぎます。さらに絞り込むための条件を追加してください。 | 抽出件数が上限超過のとき | 商品内容を表示しない。文言は改行を含む |

MSG-001 の英語の表示文言は No category is found、MSG-002 は No product is found、MSG-003 は Products matching keyword "%original%" could not be found.、MSG-004 は Showing search results for "%fallback%".、MSG-005 は Too many products match your criteria.、MSG-006 は Please add more criteria to further narrow down your search. である。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 検索条件を指定せずに開いたとき | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ProductController.php:130 |
| カードセットを指定した検索での表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Product/product_list_unisearch.twig:216 |
| 検索結果から一覧に載せる商品 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ProductController.php:546 |
| 価格・在庫の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/product.twig:41 |
| 他の状態に載せる範囲 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/product.twig:107 |
| 他の状態に載せる範囲 | P2 | pf-eccube3:app/Plugin/HareruyaEc/config.yml:319 |
| 総ページ数 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/product_unisearch_js.twig:636 |
| 絞り込みの選択状態 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Product/product_list_unisearch.twig:231 |
| 絞り込みの選択状態 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Product/product_list_unisearch.twig:328 |

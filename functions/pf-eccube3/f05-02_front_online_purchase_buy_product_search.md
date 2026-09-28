# F05-02（ネット買取商品検索）

## 業務ロジック

### 検索条件

カード名の入力には、カード名の一覧とサプライ名の一覧を用いた入力候補の表示を行う。

買取特集タグは、検索フォームに入力欄を出さずに、直前の検索条件から引き継いで再検索に持ち回す。

表示順、並び順、カードIDも入力欄を出さないが、検索ボタンからの再検索では引き継がない。一覧の絞り込み操作で検索し直すときにだけ引き継ぐ。

### 検索の成立条件

検索条件が空のときは、検索フォームだけを表示する。全件検索に相当する条件のときは検索を実行せず、空の結果として扱う。

全件検索に相当するのは、商品名・カテゴリ・カードセット・フォーマット・価格の下限・価格の上限・イラストレーター・サブタイプがいずれも空で、色・固有色・マナコスト・レアリティ・カードタイプ・Foil・言語・タグ・カードIDがいずれも指定されず、在庫の指定が無いか在庫あり・なしのすべてを表示する指定のときである。

検索結果が0件のときは、全件検索に相当する条件で空の結果としたときも含めて、該当なしの案内を付けた一覧を表示し、HTTPステータス404で応答する。

### 付随して取得するもの

買取特集タグが指定されているときは、対応する説明文（イベント・セールの説明）を取得する。カードIDが指定されているときは、対象のカード情報を取得する。

取得したカード情報の日本語名は、ページタイトルとパンくずの検索条件に表示する。カードIDは検索条件にも加わり、一覧はそのカードIDの商品だけに絞り込まれる。

### 色とカードタイプの論理演算子

色とカードタイプは、それぞれ論理演算子「or」「and」の単一選択を持ち、初期値は「or」とする。「and」のときは、選んだ色（カードタイプ）をすべて持つ商品だけを抽出する。「or」のときは、選んだ色（カードタイプ）を1つでも持つ商品を抽出する。色（カードタイプ）を1つも選ばないときは、論理演算子にかかわらずその条件では絞り込まない。

### 表示件数

1ページの表示件数は、指定がないときは60件とする。表示するページは、指定がないときは1ページ目とする。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 検索フォームの各条件。 |
| 成功時出力 | 検索フォーム、または絞り込み結果の一覧。 |
| 失敗時出力 | 検索結果が0件のときは、該当なしの案内を付けた一覧をHTTPステータス404で返す。 |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| — | 検索ボタン | 検索 | 検索フォームの表示時 | 指定した条件で検索する |
| — | カード名の入力欄 | カード名の入力欄に表示する案内文言 | 検索フォームの表示時 | 検索フォームに留まる |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 検索条件 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Purchase/search.twig:12-40 |
| 検索条件 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/assets/js/deck_card.js:194-208 |
| 検索条件 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/assets/js/product_list.js:15 |
| 検索の成立条件 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/PurchaseController.php:499 |
| 検索の成立条件 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ProductSearchTrait.php:33 |
| 付随して取得するもの | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/PurchaseController.php:505-514 |
| 表示件数 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/PurchaseController.php:521-522 |
| 検索の成立条件 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ProductSearchTrait.php:95-116 |
| 検索の成立条件 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/PurchaseController.php:530-542 |
| 付随して取得するもの | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Purchase/product_list.twig:20-22 |
| 付随して取得するもの | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/breadcrumb.twig:97-99 |
| 付随して取得するもの | P3 | pf-eccube3:app/Plugin/HareruyaEc/Util/ProductSearch/Event/Subscriber/CardIdSubscriber.php:33-48 |
| 色とカードタイプの論理演算子 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Front/Product/SearchType.php:226-238 |
| 色とカードタイプの論理演算子 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Util/ProductSearch/Event/Subscriber/ColorSubscriber.php:34-55 |
| 色とカードタイプの論理演算子 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Util/ProductSearch/Event/Subscriber/CardTypeSubscriber.php:34-55 |
| 色とカードタイプの論理演算子 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Purchase/search.twig:82-84 |
| 入出力 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/PurchaseController.php:530-542 |

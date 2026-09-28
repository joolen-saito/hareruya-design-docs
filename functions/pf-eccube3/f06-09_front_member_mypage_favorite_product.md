# F06-09（お気に入り商品一覧）

## 業務ロジック

### 刷新後は実装しない（廃止）
- Excel基本設計 0306 お気に入り商品一覧 識別ID:2 により廃止。刷新後は実装しない。

### 一覧に表示する対象

表示するのは、ログイン会員がお気に入りに登録した商品のうち公開中のものに限る。高額商品コードを持つ商品は、在庫があるものだけを表示する。同一商品でも言語が異なれば別の行として並べる。

### 状態ごとの明細

1件のお気に入り商品には、状態ごとの明細（状態・価格・在庫・商品数・カートに追加）を並べる。明細に出すのは、状態がニアミント、または販売価格が状態表示の下限価格（現行設定は100円）以上のものに限る。高額商品コードを持つ明細は、状態に続けて高額商品コードを併記する。

### カートへ追加できる数量

販売制限数が在庫数を下回る商品では、商品数の選択肢は販売制限数までとする。

### 絞り込みと表示順の保持

セール対象商品のみの絞り込みは、そのときの表示順を保ったまま絞り込みの有無を反転させる。表示順の切り替えも、そのときの絞り込みを保ったまま並びだけを変える。絞り込みと表示順の指定は画面のURLに残るため、再読込しても同じ絞り込み・並びで表示される。

### お気に入り登録の上限

お気に入り登録は1会員あたり100件までとする。登録済みが100件以上のときは、商品詳細などからの追加を受け付けず、登録操作の付近に「お気に入り登録は100件までです。」と表示する。このとき登録操作の表示は登録前の状態のまま変えない。

### 価格順の基準

価格順の並び替えは、同一商品の状態ごとの販売価格のうち最も高い価格を基準にする。

## 入出力

### 画面に出す見出し

一覧の見出しは「お気に入り登録商品一覧」と表示する。

### 一覧を表示できないときの扱い

| 条件 | 出力 |
|------|------|
| 未ログインでの参照 | 一覧を表示せず、会員ログイン画面へ誘導する |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| — | 一覧上部の案内 | お気に入り登録した商品がセール対象になった際、ご登録されているメールアドレスにお知らせをお送りいたします。 | 一覧表示時に常時 | — |
| — | 一覧上部の案内（英語ページ） | You will receive a notification to your registered e-mail address when your bookmarked items become on sale. | 一覧表示時に常時 | — |
| — | 商品数の表示 | 商品数: （件数） 点 | 一覧表示時に常時 | — |
| — | 商品数の表示（英語ページ） | Items: （件数） | 一覧表示時に常時 | — |
| F06-09-MSG-001 | 画面上部 | お気に入りは登録されていません。 | お気に入り商品一覧を表示したとき、お気に入り商品がない場合 | お気に入り商品一覧画面に留まる |
| F06-09-MSG-001 | 画面上部（英語ページ） | No item found in Favorites. | お気に入り商品一覧を表示したとき、お気に入り商品がない場合 | お気に入り商品一覧画面に留まる |
| F06-09-MSG-002 | モーダル内 | カートに追加しました。 | お気に入り商品一覧で商品をカートに追加したとき | 商品をカートに追加し、お気に入り商品一覧に留まる（カートへ移動可能）。 |
| F06-09-MSG-002 | モーダル内（英語ページ） | The item has been added to the cart. | お気に入り商品一覧で商品をカートに追加したとき | 商品をカートに追加し、お気に入り商品一覧に留まる（カートへ移動可能）。 |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 一覧に表示する対象 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:1602-1621 |
| 状態ごとの明細 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/favorite_product.twig:22-31 |
| 状態ごとの明細 | P2 | pf-eccube3:app/Plugin/HareruyaEc/config.yml:319 |
| カートへ追加できる数量 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Entity/DtbProductSubClass.php:1011-1021 |
| 絞り込みと表示順の保持 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/favorite_list.twig:41-58 |
| 価格順の基準 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:1628-1633 |
| 画面に出す見出し | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/favorite_list.twig:25 |
| 一覧を表示できないときの扱い | P1 | pf-eccube3:app/Plugin/HareruyaEc/ServiceProvider/HareruyaEcServiceProvider.php:315 |
| 一覧を表示できないときの扱い | P1 | pf-eccube3:app/Plugin/HareruyaEc/ServiceProvider/HareruyaEcServiceProvider.php:277 |
| お気に入り登録の上限 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ProductController.php:378-381 |
| お気に入り登録の上限 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Entity/DtbFavoriteProduct.php:10 |
| お気に入り登録の上限 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/product_js.twig:387-392 |

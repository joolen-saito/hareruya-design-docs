# フロント アクセス解析 — 閲覧商品の連携

## 業務ロジック

### 連携の仕組み

| 担い手 | 範囲 |
| --- | --- |
| 当機能 | 買い物かご・商品詳細・商品一覧・TOP画面で、利用者が見ている商品の値を、ページ内の受け渡し領域（`dataLayer`）へ積むところまでを担う |
| タグの管理サービス（Googleタグマネージャ） | 受け渡し領域を読み、アクセス解析（Googleアナリティクス）へ送る。送る内容はタグの管理サービス側の設定だけで決まる |
| 受け渡し領域がまだ無いとき | 空の領域を用意してから積む |
| 受け渡し領域がすでにあるとき | 既存の内容を残し、末尾へ足す |

### 画面ごとの値

| 画面 | 項目名 | 値 | 形式 |
| --- | --- | --- | --- |
| 買い物かご | `gtm_cart_ids` | かごに入っている商品の商品IDの並び | 数値の配列 |
| 買い物かご | `gtm_cart_value` | かごの合計金額（税込）。かごが空のときは0 | 数値 |
| 商品詳細 | `gtm_product_id` | 表示している商品の商品ID | 数値 |
| 商品詳細 | `gtm_product_value` | 初期表示する言語・商品規格の税抜の販売価格 | 数値 |
| 商品の並びを差し込む画面（商品一覧・TOP画面・商品詳細） | `gtm_search_ids` | 差し込む商品の商品IDの並び | 数値の配列 |

| 画面 | 1件の要素が持つ項目 |
| --- | --- |
| 買い物かご | `gtm_cart_ids` と `gtm_cart_value` の2項目を、同じ1つの要素にまとめて積む |
| 商品詳細 | `gtm_product_id` と `gtm_product_value` の2項目を、同じ1つの要素にまとめて積む |
| 商品の並びを差し込む画面 | `gtm_search_ids` の1項目だけを持つ要素を積む |

| 条件 | 扱い |
| --- | --- |
| 会員としてログインしていないとき | ログインしているときと同じ値を積む |
| 英語サイトのとき | 日本語サイトと同じ項目名で積む。商品詳細の販売価格だけは、英語サイトで初期表示する言語・商品規格の値になるため、日本語サイトと違う値になりうる |

### 買い物かご

買い物かご画面を表示するたびに1件だけ積む。かごの中身を画面上で変えたときは、画面を表示し直した時点で積み直す。

| 観点 | 扱い |
| --- | --- |
| 商品IDの並び順 | かごの明細の並び順。同じ商品IDが2回目以降に出たときは飛ばす |
| 同じ商品が複数の明細にあるとき | 同じ商品IDは1回だけ並べる。商品規格（言語・状態）が違っても、商品が同じなら1つにまとめる |
| かごの合計金額 | 税込の販売価格に数量を掛けた金額を、かごの明細の全行について合計した金額。送料・手数料がかかる場合もそれらは含めない |

### 商品詳細

商品詳細画面を表示するたびに、`gtm_product_id` と `gtm_product_value` を持つ値を1件だけ積む。同名の商品の並びを差し込む商品では、これとは別に `gtm_search_ids` も積む（下の「商品一覧」）。

| 観点 | 扱い |
| --- | --- |
| 商品ID | 表示している商品の商品ID。商品規格を切り替えたときも同じ値のまま |
| 販売価格 | 画面を開いた時点で選択された状態になる言語・商品規格の税抜の販売価格。利用者が画面上で言語や状態を切り替えても、積み直さない |

初期表示する言語・商品規格は次の順で決まる。

| 順序 | 条件 | 初期表示 |
| --- | --- | --- |
| 1 | 画面を開くときに言語の指定があり、その言語の商品があるとき | 指定された言語 |
| 2 | 言語の指定が無いとき | 日本語サイトでは日本語版、英語サイトでは英語版 |
| 3 | 上で決まった言語の商品が無いとき | 商品が持つ言語のうち先頭の言語 |
| 4 | 画面を開くときに商品規格の指定があり、決まった言語にその商品規格があるとき | 指定された商品規格 |
| 5 | 商品規格の指定が無い、または決まった言語にその商品規格が無いとき | 決まった言語の先頭の商品規格 |

### 商品一覧

商品の並びを画面の表示後に取得して差し込む箇所では、差し込む商品の並び1つにつき1件積む。1つの画面に商品の並びが複数あるときは、その数だけ積む。

| 画面 | 差し込む商品の並び |
| --- | --- |
| 商品一覧 | 一覧の商品の並び。検索結果の場合も同じ |
| TOP画面 | 画面に配置した商品リスト（新着・値下げ・おすすめ）ごとの商品の並び |
| 商品詳細 | 同名の商品の並び。カードの商品で、かつ基本土地でない場合だけ差し込む |
| お気に入り一覧・入荷通知一覧 | 商品の並びを後から差し込まないため、積まない |

| 観点 | 扱い |
| --- | --- |
| 商品IDの並び順 | 差し込む商品の並び順。同じ商品IDが2回目以降に出たときは飛ばす |
| 同じ商品が複数あるとき | 同じ商品IDは1回だけ並べる |
| 検索結果が0件のとき | 商品の並びを差し込まないため、`gtm_search_ids` を積まない |

### エッジケース

| ケース | 扱い |
| --- | --- |
| かごが空のとき | 買い物かご画面の扱いに従う。商品IDの並びは空、合計金額は0になる |
| 商品詳細で、商品が非公開などで表示できないとき | 商品詳細画面を表示しないため、値を積まない |
| 商品一覧で、検索結果が0件のとき | 商品の並びを差し込まず、値を積まない。空の並びも積まない |
| 商品一覧で、同じ商品が言語の違いで複数の行に出るとき | 同じ商品IDは1回だけ並べる |

## 入出力

| 種類 | 内容 |
| --- | --- |
| 入力 | 買い物かごの明細と合計金額／表示する商品の商品IDと初期表示の商品規格の販売価格／一覧に差し込む商品の並び |
| 出力 | 各画面に埋め込むスクリプト。各画面を表示するときだけ出力する |

### 入出力: 永続化

商品・買い物かごなどの業務データを登録・更新・削除しない。

## 表示メッセージ

本機能は画面へ文言を表示しない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 買い物かご | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/retargeting_cart_js.twig:4 |
| 買い物かご | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Cart/index.twig:13 |
| 買い物かご | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Cart/index.en.twig:13 |
| 商品詳細 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/retargeting_product_detail_js.twig:3 |
| 商品詳細 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Product/detail.twig:60 |
| 商品詳細 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Product/detail.en.twig:58 |
| 商品一覧 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/retargeting_product_list_js.twig:4 |
| 商品一覧 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/product_list.twig:5 |
| 商品一覧 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ProductController.php:485 |
| 商品一覧 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/ProductController.php:552 |
| 商品一覧 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/product_js.twig:31 |
| 商品一覧 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/ec_top_product.twig:14 |
| 商品一覧 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Product/detail.twig:787 |
| 商品一覧 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Mypage/favorite_list.twig:65 |

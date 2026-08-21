# 商品 — 商品リコメンド（おすすめ商品ブロック）

## 業務ロジック

### 基準商品を決める注文の絞り込み

マイページ・注文完了ページで基準商品を決めるとき、対象とする直近の注文から、注文ステータスが「処理中」の注文を除く。

### おすすめの並び順

おすすめ商品は、基準商品と同時に購入された数量の合計が多い順に並べる。

## 入出力

### 取得と描画

おすすめ枠が画面内に入った時点で、おすすめ内容を非同期に取得して枠内へ描画する。取得は1回の画面表示につき1度だけで、描画後は再取得しない。本機能は利用者入力のフォームを持たない。

### 表示内容

おすすめ商品は横スライダーで表示し、前送り・後送りのボタンを備える。商品画像は遅延読み込みで表示し、フォイル商品は画像にフォイル用の装飾を付す。枠の見出しには「あなたへのおすすめアイテム」（英語表示時は「Recommended items for you」）を表示する。英語表示時は商品名を英語名で表示する。本ブロック専用のモーダルは無い。

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| F03-05-MSG-001 | おすすめ商品枠内 | 表示するおすすめ商品はまだありません。 | 表示対象のおすすめ商品がないとき | おすすめ商品なしの案内を表示したまま、同じ画面に留まる |
| F03-05-MSG-001 | おすすめ商品枠内（英語表示時） | No recommended products to display. | 表示対象のおすすめ商品がないとき。英語ロケールへは言語切替で到達する | おすすめ商品なしの案内を表示したまま、同じ画面に留まる |
| — | おすすめ商品枠内（英語表示時） | No recommended items to display yet. | 表示対象のおすすめ商品がないとき（英語文言の別の確認値） | おすすめ商品なしの案内を表示したまま、同じ画面に留まる |

本ブロックはエラーのインライン表示やフラッシュ・トーストを生成しない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 基準商品を決める注文の絞り込み | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderDetailRepository.php:369 |
| おすすめの並び順 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderDetailRepository.php:446 |
| 取得と描画 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/js/recommend_js.twig:5-36 |
| 表示内容 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/recommend_detail.twig:1-23 |
| 表示内容 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/default/Block/user_recommend_product.twig:17 |
| 表示内容 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:326 |
| 表示内容 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/locale/message.en.yml:309 |
| 表示内容 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderDetailRepository.php:407 |

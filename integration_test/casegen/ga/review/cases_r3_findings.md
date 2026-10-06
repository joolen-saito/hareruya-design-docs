### 指摘1（IT-F10-03-044）
- 主張: 「同じカード（カードID 910030449）に紐付く」が「どちらもカード以外の商品」であり、`gtm_search_ids` は0件。
- 実際: カードとの関連は商品の `cardDetail` で表現される（`pf-eccube3/app/Plugin/HareruyaEc/Resource/doctrine/Plugin.HareruyaEc.Entity.DtbProductSub.dcm.yml:103`）。現行実装は `cardDetail` がある商品をカードとして同名商品検索へ渡し（`pf-eccube3/app/Plugin/HareruyaEc/Controller/ProductController.php:277`）、基本土地でなければ商品一覧を差し込む（`pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Product/detail.twig:639`）。したがって「同じカードに紐付く非カード商品」というシード自体が成立しない（`hareruya-design-docs/integration_test/casegen/ga/cases/F10-03_ga_seed_data.tsv:47`）。
- 判定: 成立しない前提・手順
- 修正案: 非カード条件の確認には、`cardDetail`／カード情報を持たない単独商品を使うこと。同じカードへの紐付けは削除する。

### 指摘2（IT-F10-02-028）
- 主張: 「`transactionId` を持つ要素の位置が、タグの管理サービス自身が積む要素のどれよりも前」。
- 実際: 設計書が規定するのは購入連携スクリプトが先頭部のレイアウトブロックより前に出力されることだけである（`hareruya-design-docs/functions/pf-eccube3/f10-02_front_analytics_purchase.md:21`）。現行ソースも購入連携を `top_javascript`、レイアウトブロックをその後に出力する（`pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/default_frame.twig:90`、同`:101`）。一方、シードはタグ管理ブロックの配置しか定義せず、同ブロックが積む要素の項目名・件数を定義していない（`hareruya-design-docs/integration_test/casegen/ga/cases/F10-02_ga_seed_data.tsv:3`）。タグ側が観測可能な要素を積まなければ、出力順が誤っていてもこの期待結果を満たしてしまう。
- 判定: 設計書に無い期待
- 修正案: タグ管理ブロックではなく、既知の marker 要素を積む試験用先頭部ブロックを置き、`transactionId` 要素が marker 要素より前であることを確認する。

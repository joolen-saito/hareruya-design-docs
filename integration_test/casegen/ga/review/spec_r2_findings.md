### 指摘1（f10-03_front_analytics_retargeting.md）
- 主張: 「買い物かご・商品詳細・商品一覧の各画面で、利用者が見ている商品の値を、ページ内の受け渡し領域（`dataLayer`）へ積む」
- 実際: TOP画面にもPC向け・スマートフォン向けの新着、値下げ、おすすめという6個の商品リストが配置される（pf-eccube3/app/Plugin/HareruyaEc/Resource/doctrine/migration/Version20190131015000.php:13-67、同:82-85、同:138-155）。TOP画面は各リストを遅延取得し（pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/index_top.twig:19-24、pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/ec_top_product.twig:14、pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/ec_sp_top_product.twig:13）、取得したリストごとに `gtm_search_ids` を積む（pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/product_js.twig:31-53、pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/product_list.twig:5）。
- 判定: 事実の欠落
- 修正案: 対象画面にTOP画面を追加する。TOP画面では、配置されたPC・スマートフォン向け各商品リストの取得ごとに `gtm_search_ids` を1件積む。

### 指摘2（f10-03_front_analytics_retargeting.md）
- 主張: 「商品詳細画面を表示するたびに1件だけ積む」
- 実際: 商品詳細自身の `gtm_product_id`・`gtm_product_value` は1件積む（pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Product/detail.twig:60）。しかし基本土地以外のカード商品では同名商品リストも生成され（pf-eccube3/app/Plugin/HareruyaEc/Controller/ProductController.php:277-293、pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Product/detail.twig:639-654、同:787-794）、その遅延取得でも `gtm_search_ids` を別途1件積む（pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/product_js.twig:31-53、pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/product_list.twig:5）。
- 判定: 事実の誤り
- 修正案: 商品詳細固有の値は1件だが、基本土地以外のカード商品では同名商品リストの `gtm_search_ids` も別に積む、と条件と回数を明記する。

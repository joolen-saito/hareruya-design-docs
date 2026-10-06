### 指摘1（IT-F10-02-016）
- 主張: 1件目の `sku` を `"F1002-A-016"` と期待している。
- 実際: 事前準備とシードの1件目の商品コードは `F1002-A-016A` であり、実装は受注明細の商品コードをそのまま積む（`hareruya-design-docs/integration_test/casegen/ga/cases/F10-02_ga_test_cases.tsv:17`、`hareruya-design-docs/integration_test/casegen/ga/cases/F10-02_ga_seed_data.tsv:19`、`pf-eccube3/app/Plugin/HareruyaEc/Controller/ShoppingController.php:479`）。
- 判定: 期待結果の誤り
- 修正案: 期待値を `"F1002-A-016A"` に直す。現在のままでは現行どおりに動くと不合格になる。

### 指摘2（IT-F10-03-023〜028・036・037）
- 主張: 管理画面で商品を登録すれば、商品一覧検索に指定した商品・言語行が所定順で現れる前提になっている。
- 実際: 現行の商品一覧は `/products/search` からユニサーチを使用し、外部APIの `docs` を基に商品行と `gtm_search_ids` を生成する（`pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php:48`、`pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/product_unisearch_js.twig:629`、`pf-eccube3/app/Plugin/HareruyaEc/Controller/ProductController.php:569`、同`:539`）。各シードの投入方法はEC-CUBEの商品登録だけで、ユニサーチの応答・索引反映を定めていない（`hareruya-design-docs/integration_test/casegen/ga/cases/F10-03_ga_seed_data.tsv:25`）。
- 判定: 成立しない前提・手順
- 修正案: ユニサーチ試験環境へ、商品ID・言語・並び順を含む応答をケースごとに投入する。0件ケースもDB上の不存在ではなく、ユニサーチ応答を0件にする。

### 指摘3（IT-F10-03-040）
- 主張: 「同じ商品名」の商品X・Yを登録すれば、両方が同名商品の並びに現れるとしている。
- 実際: 現行ソースは文字列の商品名ではなく、表示商品のカードIDを検索条件 `cardId` に設定して同名商品を取得する（`pf-eccube3/app/Plugin/HareruyaEc/Controller/ProductController.php:277`、同`:291`）。シードには商品X・Yが同一カードIDを共有する記述がなく、管理画面で別商品を登録するだけである（`hareruya-design-docs/integration_test/casegen/ga/cases/F10-03_ga_seed_data.tsv:42`）。
- 判定: 成立しない前提・手順
- 修正案: 商品X・Yを同一カードIDへ明示的に紐付け、表示対象Xのカード情報を「基本土地ではない」にする。商品名の一致だけを前提にしない。

### 指摘4（IT-F10-03-040）
- 主張: `gtm_search_ids` にX・Yが含まれればよく、「並び順は問わない」としている。
- 実際: 設計書は `gtm_search_ids` を「差し込む商品の並び順」で積むと明記している（`hareruya-design-docs/functions/pf-eccube3/f10-03_front_analytics_retargeting.md:66`、同`:77`）。report.md の「設計書に順序の記載が無い」という説明も誤っている（`hareruya-design-docs/integration_test/casegen/ga/gen_F10-03/report.md:40`）。
- 判定: 期待結果の誤り
- 修正案: X・Yに異なる価格などの一意な並び条件を設定し、期待値を具体的な配列にする。

### 指摘5（IT-F10-02-017）
- 主張: 「同じ商品が別の行にあるときもまとめない」を、同じ商品コード・商品名の2明細で確認するとしている。
- 実際: シードの2明細は商品IDが `93002017` と `93102017` で、別商品である（`hareruya-design-docs/integration_test/casegen/ga/cases/F10-02_ga_seed_data.tsv:20`）。設計書が要求するのは同じ商品が別行にある場合であり、実装は受注明細を行単位でそのまま配列化する（`hareruya-design-docs/functions/pf-eccube3/f10-02_front_analytics_purchase.md:49`、同`:59`、`pf-eccube3/app/Plugin/HareruyaEc/Controller/ShoppingController.php:479`）。
- 判定: 取りこぼし
- 修正案: 2明細を同じ商品IDへ紐付ける。必要なら同一商品の異なる商品規格を使い、数量2・1の2要素が残ることを確認する。

### 指摘6（IT-F10-01-023）
- 主張: 会員を登録するだけで、4画像を撮影して申請完了画面まで到達できるとしている。
- 実際: 完了処理は4画像を含むフォームの妥当性を検査し、画像をS3へ保存して完了メールを送信する（`pf-eccube3/app/Plugin/HareruyaEc/Controller/Mypage/IdentificationController.php:101`、同`:118`、同`:156`、同`:173`）。対象シードにはテスト用カメラ画像、書込可能な保存先、メール配送設定がなく、会員登録しか規定していない（`hareruya-design-docs/integration_test/casegen/ga/cases/F10-01_ga_seed_data.tsv:32`）。
- 判定: 成立しない前提・手順
- 修正案: 4画像のカメラ入力、書込可能な試験用保存先、完了メールを処理できる設定を事前準備へ追加する。

### 指摘7（F10-03）
- 主張: report.md は「入荷通知一覧へ到達する手順を既存ケースから決められない」ためケースを書かなかったとしている。
- 実際: F06-08には「マイページ→入荷待ち商品一覧」の到達手順が既にある（`hareruya-design-docs/integration_test/casegen/cases/F06-08_test_cases.tsv:2`）。設計書は入荷通知一覧では `gtm_search_ids` を積まないと明記しており、現行テンプレートも `data-nolazy="true"` のため商品一覧用Ajaxを実行しない（`hareruya-design-docs/functions/pf-eccube3/f10-03_front_analytics_retargeting.md:73`、`pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/notify_request_list.twig:39`、`pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/product_js.twig:31`）。
- 判定: 取りこぼし
- 修正案: F06-08の到達手順を用い、商品を含む入荷待ち商品一覧で `gtm_search_ids` が0件となるケースを追加する。

### 指摘8（IT-F10-03-038・039）
- 主張: TOP画面の新着・値下げ・おすすめ各リストに指定商品だけを表示するシードになっている。
- 実際: 現行ソースは各リストを固定タグIDで検索するが、シードには商品のタグ割当がなく、投入方法も商品登録とブロック配置だけである（`pf-eccube3/app/Plugin/HareruyaEc/Controller/Block/EcTopProductController.php:17`、同`:27`、同`:36`、`hareruya-design-docs/integration_test/casegen/ga/cases/F10-03_ga_seed_data.tsv:40`）。
- 判定: 成立しない前提・手順
- 修正案: X・Y・Zへ新着・値下げ・おすすめの対応タグを明記して投入し、各タグに該当する他商品がない状態も作る。

### 指摘9（IT-F10-02-022・025）
- 主張: 売上要素が7項目を「すべて持つ」、商品要素が5項目を「すべて持つ」ことだけを期待している。
- 実際: 設計書は売上要素を7項目だけで構成し、`transactionProducts` の各要素を5項目で構成すると定めている（`hareruya-design-docs/functions/pf-eccube3/f10-02_front_analytics_purchase.md:35`、同`:41`）。現在の期待結果では余分な項目や、`transactionProducts` 以外の不正な入れ子があっても合格する（`hareruya-design-docs/integration_test/casegen/ga/cases/F10-02_ga_test_cases.tsv:23`、同`:26`）。
- 判定: 取りこぼし
- 修正案: 売上要素の項目が正確に7個、商品要素が正確に5個であることを期待する。`transactionProducts` だけが入れ子であることも別ケースで判定する。

### 指摘10（IT-F10-03-030・033）
- 主張: 買い物かご・商品詳細の要素が、それぞれ指定された2項目を両方持つことだけを確認している。
- 実際: 設計書の構造表は、各要素が該当する2項目で構成されると定めている（`hareruya-design-docs/functions/pf-eccube3/f10-03_front_analytics_retargeting.md:24`）。現在の期待結果では余分な項目が追加されても合格する（`hareruya-design-docs/integration_test/casegen/ga/cases/F10-03_ga_test_cases.tsv:31`、同`:34`）。
- 判定: 取りこぼし
- 修正案: 各要素が指定された2項目だけを持つことへ期待結果を直す。

### 指摘11（IT-F10-03-044）
- 主張: 既存のmarkerを残して、その後ろへかご要素を積む確認をIT-0343に割り当てている。
- 実際: IT-0343はログイン・対象画面・言語などによる「積む／積まない」の切替を判定する単位である（`hareruya-design-docs/integration_test/viewpoint_canonical/viewpoints_canonical.tsv:344`）。当該ケースは常に積む条件で、確認対象は既存要素の保持と要素順である（`hareruya-design-docs/integration_test/casegen/ga/cases/F10-03_ga_test_cases.tsv:45`）。
- 判定: 判定IDの誤り
- 修正案: 項目・構造・順序を扱うIT-0341へ変更する。

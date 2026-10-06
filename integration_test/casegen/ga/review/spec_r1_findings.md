### 指摘1（f10-01_front_analytics_customer_id.md）
- 主張: 「導入時点で存在したPC向けの全ページについて、先頭部の1番目へ置く。先頭部の1番目に他のブロックがあるときは、そのブロックを2番目へ下げる」
- 実際: 会員IDブロックの追加対象はPCページだが、既存ブロックを2番目へ移す更新には端末種別・ページの条件がなく、全ページの先頭部1番目が対象になる（pf-eccube3/app/Plugin/HareruyaEc/Resource/doctrine/migration/Version20201218154154.php:98、pf-eccube3/app/Plugin/HareruyaEc/Resource/doctrine/migration/Version20201218154154.php:100、pf-eccube3/app/Plugin/HareruyaEc/Resource/doctrine/migration/Version20201218154154.php:104）。
- 判定: 事実の誤り
- 修正案: 既存ブロックを下げる処理はPC限定ではなく、端末種別を問わず先頭部1番目を更新する、と記載する。

### 指摘2（f10-02_front_analytics_purchase.md）
- 主張: 「`transactionMailaddress`｜注文した会員のメールアドレス」「入力｜…注文した会員のメールアドレス」
- 実際: 出力元は受注に保存されたメールアドレスではなく、表示時点のログイン利用者である `app.user.email`（pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/ecommerce_js.twig:9）。現行には非会員購入経路があり（pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider/Front/ShoppingControllerProvider.php:39、pf-eccube3/src/Eccube/Controller/ShoppingController.php:1001）、ゲストの入力メールは受注へコピーされる一方（pf-eccube3/src/Eccube/Controller/ShoppingController.php:1042、pf-eccube3/src/Eccube/Controller/ShoppingController.php:1050、pf-eccube3/src/Eccube/Service/ShoppingService.php:295）、その受注メールはこの連携では参照されない。非会員時にはゲスト入力メールアドレスが積まれない。
- 判定: 事実の誤り
- 修正案: 現行どおりなら「表示時点でログイン中の会員のメールアドレス。非会員購入時はゲスト入力メールを積まない」とする。

### 指摘3（f10-02_front_analytics_purchase.md）
- 主張: 「`transactionTotal`｜受注の商品小計」「`price`｜受注明細の単価」
- 実際: `transactionTotal` に渡す受注小計は、税込単価×数量の合計である（pf-eccube3/app/Plugin/HareruyaEc/Controller/ShoppingController.php:558、pf-eccube3/src/Eccube/Entity/Order.php:98、pf-eccube3/src/Eccube/Entity/Order.php:102）。一方、商品の `price` は税込単価ではなく税抜単価を取得している（pf-eccube3/app/Plugin/HareruyaEc/Controller/ShoppingController.php:484、pf-eccube3/src/Eccube/Entity/OrderDetail.php:304、pf-eccube3/src/Eccube/Doctrine/EventSubscriber/TaxRuleEventSubscriber.php:65）。
- 判定: 事実の欠落
- 修正案: `transactionTotal` は税込の商品小計、各商品の `price` は税抜単価と明記する。したがって課税注文では、商品の `price × quantity` の合計と `transactionTotal` は一致しない。

### 指摘4（f10-02_front_analytics_purchase.md）
- 主張: 「`transactionProducts` は、受注明細1行につき1件を、受注明細の並び順で並べる」
- 実際: 子項目の型が記載されていない。`price` と `quantity` は文字列を返す値で、数値へのキャストなしにJSON化されるためJSON文字列になる（pf-eccube3/src/Eccube/Entity/OrderDetail.php:287、pf-eccube3/src/Eccube/Entity/OrderDetail.php:304、pf-eccube3/src/Eccube/Entity/OrderDetail.php:310、pf-eccube3/src/Eccube/Entity/OrderDetail.php:327、pf-eccube3/app/Plugin/HareruyaEc/Controller/ShoppingController.php:480、pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/ecommerce_js.twig:10）。`sku`、`name`、`category` も文字列である。
- 判定: 事実の欠落
- 修正案: 商品子項目の形式を追加し、`sku`・`name`・`category`・`price`・`quantity` はいずれも文字列として積むと記載する。

### 指摘5（f10-02_front_analytics_purchase.md）
- 主張: 「受注ID。8桁になるよう左を0で埋める」
- 実際: `%08d` は最小表示幅を8桁にする指定であり、8桁を超える受注IDを切り詰めない（pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/ecommerce_js.twig:4）。
- 判定: 事実の誤り
- 修正案: 「8桁未満の場合は、8桁になるまで左を0で埋める。8桁を超える場合はそのまま」とする。

### 指摘6（f10-02_front_analytics_purchase.md）
- 主張: 「注文完了画面を再読み込みしたとき｜購入処理中の受注が無いため注文完了画面を表示せず、値を積まない」
- 実際: 受注自体が無くなるのではない。初回表示前に受注を永続化したまま、完了処理でセッション上の受注IDだけを削除する（pf-eccube3/app/Plugin/HareruyaEc/Controller/ShoppingController.php:550、pf-eccube3/app/Plugin/HareruyaEc/Controller/ShoppingController.php:1042、pf-eccube3/app/Plugin/HareruyaEc/Controller/ShoppingController.php:1045）。再読み込み時はそのセッション値が無いためトップへリダイレクトされる（pf-eccube3/app/Plugin/HareruyaEc/Controller/ShoppingController.php:407、pf-eccube3/app/Plugin/HareruyaEc/Controller/ShoppingController.php:409）。
- 判定: 事実の誤り
- 修正案: 「初回表示後にセッション上の受注IDを削除するため、再読み込み時はトップへ移動し、値を積まない」とする。

### 指摘7（f10-02_front_analytics_purchase.md）
- 主張: 「積む値｜…ShoppingController.php:556」
- 実際: 556行目は画面へ渡す `waitingNumber` であり、解析値ではない。解析値は `tTotal`、`tShipping`、`tProducts`、配送方法を設定する558～562行目にある（pf-eccube3/app/Plugin/HareruyaEc/Controller/ShoppingController.php:556、pf-eccube3/app/Plugin/HareruyaEc/Controller/ShoppingController.php:558）。
- 判定: 出典ずれ
- 修正案: 出典を `ShoppingController.php:558` に直す。

### 指摘8（f10-03_front_analytics_retargeting.md）
- 主張: 「かごの合計金額｜かごの明細の小計を合計した金額」
- 実際: かご明細には税込販売価格が設定され（pf-eccube3/src/Eccube/Service/CartService.php:307、pf-eccube3/src/Eccube/Service/CartService.php:311）、その価格×数量の合計を `Cart.total_price` として積む（pf-eccube3/src/Eccube/Entity/CartItem.php:124、pf-eccube3/src/Eccube/Entity/Cart.php:185、pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/retargeting_cart_js.twig:6）。
- 判定: 事実の欠落
- 修正案: かごの合計金額は「税込販売価格×数量の合計」であり、送料・手数料を含まないと明記する。

### 指摘9（f10-03_front_analytics_retargeting.md）
- 主張: 「`gtm_product_value`｜初期表示する言語・商品規格の販売価格」
- 実際: 税区分と初期選択規則が欠落している。価格は税込価格ではなく `price02` の税抜販売価格である（pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Product/detail.twig:60、pf-eccube3/src/Eccube/Entity/ProductClass.php:391）。言語はURL指定を優先し、未指定なら日本語サイトでJP、英語サイトでEN、該当言語が無ければ先頭言語を使う（pf-eccube3/app/Plugin/HareruyaEc/Controller/ProductController.php:256、pf-eccube3/app/Plugin/HareruyaEc/Controller/ProductController.php:260）。商品規格もURL指定が有効な場合はそれを使い、それ以外は当該言語の先頭規格を使う（pf-eccube3/app/Plugin/HareruyaEc/Controller/ProductController.php:264、pf-eccube3/app/Plugin/HareruyaEc/Controller/ProductController.php:266）。
- 判定: 事実の欠落
- 修正案: 税抜販売価格を積むことと、URL指定・サイト言語・先頭要素による言語／規格の決定順を記載する。

### 指摘10（f10-03_front_analytics_retargeting.md）
- 主張: 「英語サイトのとき｜日本語サイトと同じ項目名・同じ値で積む」
- 実際: 項目名は同じだが、商品詳細で言語指定がない場合、日本語サイトはJP、英語サイトはENを初期言語にする（pf-eccube3/app/Plugin/HareruyaEc/Controller/ProductController.php:256、pf-eccube3/app/Plugin/HareruyaEc/Controller/ProductController.php:258）。その言語の初期規格価格を積むため、`gtm_product_value` は日本語サイトと英語サイトで異なり得る（pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Product/detail.twig:60、pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Product/detail.en.twig:58）。
- 判定: 事実の誤り
- 修正案: 「項目名は共通。ただし商品詳細の価格はサイト言語に応じて選ばれた初期言語・規格の値になる」とする。

### 指摘11（f10-03_front_analytics_retargeting.md）
- 主張: 「差し込む商品が無いとき｜空の並びを積む」「商品一覧で、検索結果が0件のとき｜空の並びを積む」
- 実際: 現行の商品検索では検索結果0件の場合、処理をその場で終了し、商品一覧HTMLを作る処理を呼ばない（pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/product_unisearch_js.twig:675、pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/product_unisearch_js.twig:682）。`gtm_search_ids` を積むテンプレートは、後続の商品一覧作成が成功した場合にだけ差し込まれる（pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/product_unisearch_js.twig:716、pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/product_unisearch_js.twig:725、pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/product_list.twig:5）。したがって検索結果0件では空配列も積まれない。
- 判定: 事実の誤り
- 修正案: 「検索結果0件では商品一覧の連携処理を呼ばず、`gtm_search_ids` 自体を積まない」とする。

■管理-M16-07 買取価格対応表(編集)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）利用者視点の入口は GET /{admin_route}/buy_price_list/{id} と POST /{admin_route}/buy_price_list/{id}、戻り先は GET /{admin_route}/buy_price_list とする。
　一覧は /{admin_route}/data/buy_price_list、編集GETは /{admin_route}/data/buy_price_list/{id}/edit、更新POSTは /{admin_route}/data/buy_price_list/{id}/update で定義されている。確認お願いします。（設計根拠: excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-9:2125,2133 ／ 実装: src/Eccube/Controller/Admin/Data/BuyPriceListController.php:45,80,97）

■管理-M16-07 買取価格対応表(編集)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）画面タイトルは「買取価格対応表」、サブタイトルは「編集」。メニューは menus = ['data_menu', 'buy_price_list']。右カラムに「戻る」（type=button）を表示する。
　menus は ['data_management', 'buy_price_list_management']、title は admin.data.buy_price_list_edit（買取価格対応表編集）、sub_title は admin.data.data_management（データ管理）。戻るは button type="button" ではなく href 付き a 要素。確認お願いします。（設計根拠: excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-9:2136 ／ 実装: src/Eccube/Resource/template/admin/Data/buy_price_list_edit.twig:13,15,16,78,79; src/Eccube/Resource/locale/messages.ja.yaml:5873,5874）

■管理-M16-07 買取価格対応表(編集)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）フォーム種別名は admin_buy_price_list。POST は admin_buy_price_list[_token] と admin_buy_price_list[price]、CSRF はフォーム名 admin_buy_price_list に紐づく。
　Controller は createBuilder(BuyPriceListEditType::class, ...) でフォームを生成する。BuyPriceListEditType は getBlockPrefix() を実装しておらず、Symfony の既定ではクラス名から buy_price_list_edit がブロックプレフィックス/フォーム名になる。確認お願いします。（設計根拠: excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-9:2141,2154,2165,2175 ／ 実装: src/Eccube/Controller/Admin/Data/BuyPriceListController.php:84,101; src/Eccube/Form/Type/Admin/BuyPriceListEditType.php:25; vendor/symfony/form/FormFactory.php:51; vendor/symfony/form/AbstractType.php:62; vendor/symfony/form/Util/StringUtil.php:52）

■管理-M16-07 買取価格対応表(編集)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）買取価格(円)は required => true の number 型。Range や整数限定の明示制約は当該 Form 型に無く、フレームワークの変換・妥当性判定に従う。
　price は IntegerType::class で、required => true に加えて Assert\GreaterThanOrEqual(0) が明示されている。確認お願いします。（設計根拠: excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-9:2175 ／ 実装: src/Eccube/Form/Type/Admin/BuyPriceListEditType.php:20,33,35,36,37）

■管理-M03-01 商品マスター(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）表示データ切替え(ID:12)のラベルは「表示データ切替え」、選択項目は「販売数（通販＋TC東京）」「販売数（支店）」「入庫数」とする。
　Twigはadmin.product.list_display_data__title等の翻訳キーを表示し、翻訳値は「表示データ切り替え」「販売数（通販+TC東京）」になっている。確認お願いします。（設計根拠: excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-4:1388 ／ 実装: src/Eccube/Resource/template/admin/Product/index.twig:529 / src/Eccube/Resource/locale/messages.ja.yaml:2067 / src/Eccube/Resource/locale/messages.ja.yaml:2068）

■管理-M03-01 商品マスター(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索結果0件時は「検索結果がありません」メッセージを表示する。
　0件時はadmin.common.search_no_resultを表示し、翻訳値は「検索条件に合致するデータが見つかりませんでした」。確認お願いします。（設計根拠: excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-4:1518 ／ 実装: src/Eccube/Resource/template/admin/Product/index.twig:824 / src/Eccube/Resource/locale/messages.ja.yaml:1549）

■管理-M03-01 商品マスター(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）デフォルトで廃止となっている規格は表示されない。
　検索フォームの公開状態は商品本体ステータスを対象に廃止を選択肢から除外する一方、商品一覧クエリはProductClassesを結合するだけでProductClass.visibleやProductClass.Statusの廃止除外を行わず、TwigもLanguageとCardConditionの有無だけで規格行を表示する。確認お願いします。（設計根拠: excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-4:1339 ／ 実装: src/Eccube/Form/Type/Admin/SearchProductType.php:100 / src/Eccube/Repository/ProductRepository.php:1011 / src/Eccube/Resource/template/admin/Product/index.twig:575）

■管理-M03-01 商品マスター(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）一覧は言語ごとに分け、同一言語内でNM/SP/MP/HP等の通常規格の在庫数・販売数・入庫数を合算して出力し、通常以外の状態(高額商品等)は分けて表示する。
　一覧はProduct.ProductClassesを1規格ずつ行化し、在庫・販売数・入庫数はいずれもproduct_class_id単位で取得して表示している。確認お願いします。（設計根拠: excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-4:1342 / excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-4:1344 / excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-4:1361 ／ 実装: src/Eccube/Resource/template/admin/Product/index.twig:575 / src/Eccube/Resource/template/admin/Product/index.twig:624 / src/Eccube/Controller/Admin/Product/ProductController.php:268 / src/Eccube/Repository/ProductStockRepository.php:608 / src/Eccube/Repository/DtbSalesQuantityRepository.php:517 / src/Eccube/Repository/DtbStockUpQuantityRepository.php:266）

■管理-M03-01 商品マスター(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）表示順は、棚番号昇順とする。
　商品一覧クエリは指定sortkeyがあれば列マップでORDER BYし、未指定時はp.id DESC。その後、規格行はLanguage、CardCondition順で並べる。棚番号のsortNo昇順は検索条件プルダウンの選択肢にだけ使われている。確認お願いします。（設計根拠: excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-4:1345 / excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-4:1363 ／ 実装: src/Eccube/Repository/ProductRepository.php:1317 / src/Eccube/Repository/ProductRepository.php:1323 / src/Eccube/Repository/ProductRepository.php:1327 / src/Eccube/Repository/ProductRepository.php:1328 / src/Eccube/Form/Type/Admin/SearchProductType.php:387）

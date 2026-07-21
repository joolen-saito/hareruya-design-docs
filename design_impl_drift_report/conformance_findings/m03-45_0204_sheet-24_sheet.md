■管理-M03-45 カテゴリ一覧
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）フロント非表示フラグで全般的な表示制御を行い、親カテゴリが非表示なら子カテゴリも非表示とする。支店表示フラグも同様の制御を行う。
　管理画面のフラグ入力と、TopCategoryListBuilder/CategoryTreeResponseBuilder 系の一部フロントカテゴリ生成では front_search_hide_flg と branch_hide_flg を参照している。一方で商品検索フォーム、検索ブロック、フロント検索フォーム、SPカテゴリナビ、カテゴリサイトマップは CategoryRepository::getList(null, true) または getList() を未フィルタのまま使う。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-24:5857,5858,5859,5860,5966,5982 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CategoryType.php:64; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/TopCategoryListBuilder.php:101; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/SearchProductType.php:68; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/SearchProductBlockType.php:48; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/SearchType.php:95; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/category_nav_sp.twig:11; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/SitemapController.php:124）

■管理-M03-45 カテゴリ一覧
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）保存開始および完了ログは、メッセージとカテゴリ id が配列入りで記録関数へ渡される日本語短文とする。
　保存開始ログは log_info('カテゴリ登録開始') のみでカテゴリ id 配列を渡していない。保存完了ログは log_info('カテゴリ登録完了', [$TargetCategory->getId()]) で id を渡している。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-24:6004,6005 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/CategoryController.php:193; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/CategoryController.php:200）

■管理-M03-13 タグ登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）名称(英)は半角で入力する
　nameEn は TextType で、Length(255) と NotBlank のみを設定している。半角制約の Regex / pattern / 正規化処理はない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-27:6575 ／ 実装: src/Eccube/Form/Type/Admin/TagType.php:70）

■管理-M03-13 タグ登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）並び順は数値・必須・最大値0〜32767で入力する
　sortNo は IntegerType で NotBlank のみ。Entity は unsigned SMALLINT だが、フォームに Range(0,32767) や min/max 属性はない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-27:6576 ／ 実装: src/Eccube/Form/Type/Admin/TagType.php:78）

■管理-M03-13 タグ登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）タイトル(日)/(英)に値がある場合、それぞれ日本語/英語の商品検索ページのページタイトルとする
　管理画面では titleJp/titleEn を入力・保存できるが、商品検索ページのタイトルは default_frame.twig が BaseInfo.shop_name と subtitle/title から生成し、ProductController::getPageTitle は商品名検索・カテゴリ・全商品だけを返す。タグの title_jp/title_en は参照されない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-27:6583,6585 ／ 実装: src/Eccube/Controller/Front/ProductController.php:1170; src/Eccube/Resource/template/default/default_frame.twig:17）

■管理-M03-13 タグ登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）説明(日)/(英)に値がある場合、それぞれ日本語/英語の商品検索ページのページ説明文として指定する
　管理画面では descriptionJp/descriptionEn を入力・保存できるが、商品検索ページの meta description は meta.twig で Page.description を既定値として使うだけで、tag.description_jp/tag.description_en を参照しない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-27:6584,6586 ／ 実装: src/Eccube/Resource/template/default/meta.twig:14; src/Eccube/Resource/template/default/meta.twig:39）

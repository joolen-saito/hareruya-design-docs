■管理-M03-01 商品マスター(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）識別ID:1「商品名(日/英)」は、検索押下時に商品名(日)・商品名(英)を検索対象にする。
　表示フィールド product_name の検索条件は p.name LIKE :adminSearchProductName のみで、p.name_en は別の hidden keyword/id 検索側にだけ含まれている。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-3:1068 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1019）

■管理-M03-01 商品マスター(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）識別ID:3「カード名」は、検索押下時にカード名(日)・カード名(英)を検索対象にする。
　card_name の検索条件は ca_card.name_jp LIKE :adminSearchCardName のみ。MtbCard には name_en が存在するが、この検索条件では参照されない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-3:1070 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1026）

■管理-M03-01 商品マスター(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）GET /{admin_route}/product はデフォルトのフォーム表示データをセッションに設定し、1ページ目の商品一覧を表示する。
　初期GETは「検索前のため商品一覧を表示しない」として pagination => null を返し、ProductRepository 検索処理へ進まない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-3:1170 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:223）

■管理-M03-01 商品マスター(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）商品一覧の表示順は棚番号昇順とする。詳細仕様では未指定ソート時は p.update_date DESC、p.id DESC とする。
　未指定ソート時は p.id DESC、IDENTITY(pc.Language) ASC、IDENTITY(pc.CardCondition) ASC で並べ替える。ShelfNumber による昇順指定も p.update_date DESC の既定順もない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-3:1039 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1316）

■管理-M03-01 商品マスター(検索入力)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）デフォルトで廃止となっている規格は表示されない。
　ProductRepository は ProductClasses を pc として結合するが、pc.visible や pc.Status による廃止規格除外条件を付けていない。テンプレート側の規格表示も Language と CardCondition の存在だけを条件にしている。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-3:1033 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1011, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1088, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:573）

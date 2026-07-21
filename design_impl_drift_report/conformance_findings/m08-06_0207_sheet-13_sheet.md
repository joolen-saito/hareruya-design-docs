■管理-M08-06 ポイント履歴確認
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）「登録」ボタン（付与）は POST /{admin_route}/customer/point/{id}/update/{type} で入力したポイント変動を履歴に追加し、ポイント履歴画面へ戻る。
　POST ルートは /%eccube_admin_route%/customer/point/{id}/{type} で、フォーム action も admin_customer_point_update を生成するため /update/{type} を含まない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-13:3283,3292 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:51, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:18）

■管理-M08-06 ポイント履歴確認
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）ポイント種別ごとにポイント履歴を表示する。
　履歴一覧は Customer.PointHistories をそのままループ表示しており、Customer 側の関連は id DESC のみで point_type_id 条件を持たない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-13:3283,3296 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:123, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:1292, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:1293）

■管理-M08-06 ポイント履歴確認
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）入力項目「備考」は任意、初期値は空で、ポイント履歴の備考として扱う。
　備考は ChoiceType、required=true、NotBlank 制約付きで、テンプレートにも必須バッジが表示される。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-13:3298 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:85, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:87, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:91, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:92, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:69, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:70）

■管理-M08-06 ポイント履歴確認
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）会員・選手情報が無い場合はページが見つからない扱い（404）とする。
　Customer::getPlayer() は ?DtbPlayer を返すが、CustomerPointController は Player の null 判定や 404 変換を行わず getPlayer()->addPoint() を呼ぶ。テンプレートも Customer.Player.point を直接参照する。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-13:3293,3308,3321,3324 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:1015, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:1107, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:85, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:105）

■管理-M08-06 ポイント履歴確認
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）画面遷移の種別選択は種別選択画面（admin_customer_point_type_select）へ遷移する。
　種別選択画面の実装ルート名は admin_customer_point_select。会員編集画面からのリンクも admin_customer_point_select を参照する。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-13:3321 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:38, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig:1038）

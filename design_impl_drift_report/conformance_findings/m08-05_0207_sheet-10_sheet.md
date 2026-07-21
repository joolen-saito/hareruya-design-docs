■管理-M08-05 ポイント付与
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）「登録」ボタン（付与）は POST /{admin_route}/customer/point/{id}/update/{type} へ送信し、入力したポイント変動を履歴に追加してポイント履歴画面へ戻る。
　POST ルート admin_customer_point_update は /%eccube_admin_route%/customer/point/{id}/{type} に定義され、フォームもそのルートへ送信する。設計の /update/{type} セグメントが存在しない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-10:3118,3127 ／ 実装: src/Eccube/Controller/Admin/Customer/CustomerPointController.php:51 / src/Eccube/Resource/template/admin/Customer/point_update.twig:18）

■管理-M08-05 ポイント付与
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）種別選択時の遷移先は種別選択画面（admin_customer_point_type_select）とする。
　種別選択画面のルート名は admin_customer_point_select で実装され、会員編集画面からも admin_customer_point_select へリンクしている。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-10:3155 ／ 実装: src/Eccube/Controller/Admin/Customer/CustomerPointController.php:38 / src/Eccube/Resource/template/admin/Customer/edit.twig:1038）

■管理-M08-05 ポイント付与
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）当該会員・種別のポイント履歴一覧を新しい順に取得し、各履歴の注文番号を取得して表示する。ポイント種別ごとにポイント履歴を表示する。
　Controller は type をフォーム表示フラグとラベルに使うだけで、履歴取得条件には使っていない。Twig は Customer.PointHistories をそのまま全件表示し、Customer 側の関連は id DESC のみで、point_type_id 条件や issue_date DESC 取得はない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-10:3126,3131 ／ 実装: src/Eccube/Controller/Admin/Customer/CustomerPointController.php:100 / src/Eccube/Resource/template/admin/Customer/point_update.twig:123 / src/Eccube/Entity/Customer.php:1292）

■管理-M08-05 ポイント付与
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）会員・選手情報を取得する。いずれも無い場合はページが見つからない扱い（404）とする。
　Customer::getPlayer() は nullable だが、Controller は null 確認なしに $Customer->getPlayer()->addPoint(...) を呼び、Twig も Customer.Player.point を直接参照している。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-10:3128,3156,3159 ／ 実装: src/Eccube/Entity/Customer.php:1107 / src/Eccube/Controller/Admin/Customer/CustomerPointController.php:85 / src/Eccube/Resource/template/admin/Customer/point_update.twig:105）

■管理-M08-05 ポイント付与
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）入力項目『備考』は任意、初期値は空、保存先・扱いはポイント履歴の備考とする。
　備考は ChoiceType、required=true、NotBlank 制約付きで実装されており、キャンペーン/特別対応または返金理由の選択が必須になっている。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-10:3132 ／ 実装: src/Eccube/Form/Type/Admin/CustomerPointType.php:85）

■管理-M08-05 ポイント付与（余剰入金へのご返金、注文金額変更によるご返金
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）「登録」ボタン（付与）は POST /{admin_route}/customer/point/{id}/update/{type} に送信し、入力したポイント変動を履歴に追加してポイント履歴画面へ戻る。
　POST ルート admin_customer_point_update は /{admin_route}/customer/point/{id}/{type} で定義され、フォーム action もそのルートへ送信する。設計の /update/{type} セグメントが存在しない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-12:3118,3127 ／ 実装: src/Eccube/Controller/Admin/Customer/CustomerPointController.php:51, src/Eccube/Resource/template/admin/Customer/point_update.twig:17）

■管理-M08-05 ポイント付与（余剰入金へのご返金、注文金額変更によるご返金
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）当該会員・種別のポイント履歴一覧を表示し、ポイント種別ごとにポイント履歴を表示する。
　Controller は type を受け取るが履歴取得条件には使用していない。Twig は Customer.PointHistories をそのまま全件ループし、Customer 側関連は id 降順のみで point_type_id 条件が無い。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-12:3118,3131 ／ 実装: src/Eccube/Controller/Admin/Customer/CustomerPointController.php:53, src/Eccube/Resource/template/admin/Customer/point_update.twig:123, src/Eccube/Entity/Customer.php:1292）

■管理-M08-05 ポイント付与（余剰入金へのご返金、注文金額変更によるご返金
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）入力項目「備考」は任意、初期値は空、保存先はポイント履歴の備考。
　note は ChoiceType で required=true、NotBlank 制約付き。テンプレートでも備考に必須バッジを表示している。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-12:3133 ／ 実装: src/Eccube/Form/Type/Admin/CustomerPointType.php:85, src/Eccube/Form/Type/Admin/CustomerPointType.php:91, src/Eccube/Resource/template/admin/Customer/point_update.twig:67）

■管理-M08-05 ポイント付与（余剰入金へのご返金、注文金額変更によるご返金
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）会員・選手情報が無い場合はページが見つからない扱い（404）とする。
　Customer は引数の型解決で取得しているが、Player の存在確認は無い。getPlayer() は ?DtbPlayer を返すため null になり得るが、登録時に $Customer->getPlayer()->addPoint(...) を直接呼び出す。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-12:3128,3156,3159 ／ 実装: src/Eccube/Controller/Admin/Customer/CustomerPointController.php:53, src/Eccube/Controller/Admin/Customer/CustomerPointController.php:85, src/Eccube/Entity/Customer.php:1107）

■管理-M08-05 ポイント付与（余剰入金へのご返金、注文金額変更によるご返金
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）機能名・付与種別は「ポイント付与（余剰入金へのご返金、注文金額変更によるご返金）」として表示する。
　purchase 種別の画面タイトル用翻訳 admin.customer.point_update.purchase が「ポイント履歴追加（余剰入金へのご返金、注文金額変更によるご送金）」になっている。Controller は purchase 種別でこの翻訳キーを画面タイトルへ渡す。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-12:3091,3133 ／ 実装: src/Eccube/Resource/locale/messages.ja.yaml:2631, src/Eccube/Controller/Admin/Customer/CustomerPointController.php:100）

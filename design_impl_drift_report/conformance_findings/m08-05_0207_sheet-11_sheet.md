■管理-M08-05 ポイント付与（キャンペーン、特別対応）
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）「登録」ボタン（付与）は POST /{admin_route}/customer/point/{id}/update/{type} に送信し、入力したポイント変動を履歴に追加してポイント履歴画面へ戻る。
　POST の admin_customer_point_update は /%eccube_admin_route%/customer/point/{id}/{type} に定義され、フォームも同ルートへ送信する。設計にある /customer/point/{id}/update/{type} ではない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-11:2937,2946,3118,3127 ／ 実装: src/Eccube/Controller/Admin/Customer/CustomerPointController.php:51; src/Eccube/Resource/template/admin/Customer/point_update.twig:18）

■管理-M08-05 ポイント付与（キャンペーン、特別対応）
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）ポイント種別ごとにポイント履歴を表示し、当該会員・種別のポイント履歴一覧と付与フォームを表示する。
　画面は Customer.PointHistories をそのままループ表示する。Customer 側の PointHistories は id 降順の OneToMany で、point_type_id による種別絞り込みはない。Controller も type を表示ラベル/フォーム種別に使うのみで、一覧取得条件には使っていない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-11:2937,2950,3126,3131 ／ 実装: src/Eccube/Resource/template/admin/Customer/point_update.twig:123; src/Eccube/Entity/Customer.php:1292; src/Eccube/Controller/Admin/Customer/CustomerPointController.php:104）

■管理-M08-05 ポイント付与（キャンペーン、特別対応）
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）ポイント増減量は必須の数値で、最大値は 999999999（スマレジ連携に合わせる）。
　pointChange は IntegerType、NotBlank、整数Regexのみで、999999999 以下に制限する Range/LessThanOrEqual 等のバリデーションがない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-11:2858 ／ 実装: src/Eccube/Form/Type/Admin/CustomerPointType.php:74; src/Eccube/Form/Type/Admin/CustomerPointType.php:80）

■管理-M08-05 ポイント付与（キャンペーン、特別対応）
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）会員・選手情報が無い場合は404。
　Controller は Customer 引数で会員取得を行うが、Customer::getPlayer() は nullable であるにもかかわらず、POST時は $Customer->getPlayer()->addPoint(...)、表示時は Customer.Player.point を参照する。選手情報なしを404に変換する分岐はない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-11:2947,2962,3156,3159 ／ 実装: src/Eccube/Controller/Admin/Customer/CustomerPointController.php:53; src/Eccube/Controller/Admin/Customer/CustomerPointController.php:85; src/Eccube/Resource/template/admin/Customer/point_update.twig:105; src/Eccube/Entity/Customer.php:1107）

■管理-M08-05 ポイント付与（キャンペーン、特別対応）
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）追加するポイント履歴はスマレジ側の会員情報に連携する。
　ポイント履歴と会員側ポイントは persist/flush されるが、スマレジ連携は TODO コメントのみで未反映。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-11:2847 ／ 実装: src/Eccube/Controller/Admin/Customer/CustomerPointController.php:90）

■管理-M08-05 ポイント付与（キャンペーン、特別対応）
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）識別ID:6「保存ボタン」はボタンとして表示される。
　ボタンは admin.common.registration を表示しており、日本語翻訳は「登録」。設計上の「保存ボタン」文言ではない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-11:2861 ／ 実装: src/Eccube/Resource/template/admin/Customer/point_update.twig:82; src/Eccube/Resource/locale/messages.ja.yaml:1443）

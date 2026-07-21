■管理-M16-03 祝日管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）管理画面「データ管理」→「祝日管理」は GET /{admin_route}/holiday を入口とし、追加は POST /{admin_route}/holiday/add、削除は POST /{admin_route}/holiday/{id}/delete、期間一括登録は POST /{admin_route}/holiday/load として提供する。
　実装は一覧・手入力追加・期間一括登録を単一の /{admin_route}/data/holiday ルート（name=admin_data_holiday, methods GET/POST）でフォーム種別により分岐している。削除は /{admin_route}/data/holiday/{id}/delete の DELETE ルート（name=admin_data_holiday_delete）である。/{admin_route}/holiday、/holiday/add、/holiday/load、admin_holiday_* ルートは不在。確認お願いします。（設計根拠: excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-5:1360 ／ 実装: src/Eccube/Controller/Admin/Data/HolidayController.php:45, src/Eccube/Controller/Admin/Data/HolidayController.php:136, src/Eccube/Resource/template/admin/Data/holiday.twig:194）

■管理-M16-03 祝日管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）フロント挙動の表示要素として、{% block title %} は「データ管理」、サブタイトルは「祝日管理」、メニュー選択は menus = ['data_menu', 'holiday_list'] とする。
　テンプレートは menus = ['data_management', 'holiday_management']、title = 'admin.data.holiday_management'（祝日管理）、sub_title = 'admin.data.data_management'（データ管理）で定義している。ナビ定義も data_management 配下 holiday_management を使う。確認お願いします。（設計根拠: excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-5:1364 ／ 実装: src/Eccube/Resource/template/admin/Data/holiday.twig:13, src/Eccube/Resource/template/admin/Data/holiday.twig:15, src/Eccube/Resource/template/admin/Data/holiday.twig:16, app/config/eccube/packages/eccube_nav.yaml:349）

■管理-M16-03 祝日管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）日付重複時はプラグイン定義メッセージ鍵 hareruyaec.holiday.overlap を積み、一覧へリダイレクトする。
　重複検証は HolidayAddType で admin.data.holiday.overlap を violation として追加し、Controller も admin.data.holiday.overlap を判定して同キーを addError する。messages.ja.yaml にも admin.data.holiday.overlap が定義されている。hareruyaec.holiday.overlap は不在。確認お願いします。（設計根拠: excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-5:1370 ／ 実装: src/Eccube/Form/Type/Admin/HolidayAddType.php:73, src/Eccube/Controller/Admin/Data/HolidayController.php:102, src/Eccube/Resource/locale/messages.ja.yaml:6136）

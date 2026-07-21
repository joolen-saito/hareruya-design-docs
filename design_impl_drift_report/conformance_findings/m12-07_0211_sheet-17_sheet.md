■管理-M12-07 フォーマット売上分析 集計一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索画面初期表示は GET /{admin_route}/analysis/format_sales、集計実行・一覧表示は POST /{admin_route}/analysis/format_sales/result とする。
　実装は初期表示を `/%eccube_admin_route%/analysis/format-sales`、検索実行を `/%eccube_admin_route%/analysis/format-sales/search` としている。テンプレートのフォーム送信先も `admin_analysis_format_sales_search` を参照している（/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Analysis/format_sales.twig:94）。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-17:3715 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:44）

■管理-M12-07 フォーマット売上分析 集計一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）入力項目「集計月」の初期値は空（初回表示時は未設定）とする。
　初期表示で `$form->get('month')->setData((new \DateTime())->format('Y-m'));` を実行し、当月を設定している。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-17:3745 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:49）

■管理-M12-07 フォーマット売上分析 集計一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）表示要素は集計月入力欄、検索ボタン。集計条件は集計月であり、本店のほか支店やスマレジの取引情報も集計対象として取り扱う。
　実装は設計にない `mail_order_enabled` と `store_enabled` のチェックボックスを追加し、画面に「集計対象」として表示している（/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Analysis/format_sales.twig:108）。検索時はこの値で `base_info_id` を絞り込む（/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:79）。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-17:3731 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Analysis/FormatSalesType.php:48）

■管理-M12-07 フォーマット売上分析 集計一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）本機能は検索条件をセッションへ保存しない。副作用は無し（参照のみ。検索条件のセッション保存も行わない）。
　実装は `SESSION_KEY = 'eccube.admin.analysis.format_sales.search'` を定義し、検索時に `$this->session->set(self::SESSION_KEY, FormUtil::getViewData($form));` で検索条件を保存している（/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:83）。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-17:3715 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:31）

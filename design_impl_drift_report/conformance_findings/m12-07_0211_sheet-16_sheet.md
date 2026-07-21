■管理-M12-07 フォーマット売上分析 集計一覧(検索項目)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）利用者視点の入口は GET /{admin_route}/analysis/format_sales で検索画面を表示し、検索ボタン押下は POST /{admin_route}/analysis/format_sales/result で同一画面にグラフと表を表示する。
　実装は GET /%eccube_admin_route%/analysis/format-sales と POST /%eccube_admin_route%/analysis/format-sales/search を定義し、Twig も admin_analysis_format_sales_search に送信する。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-16:3533,3540,3542 ／ 実装: src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:44,64; src/Eccube/Resource/template/admin/Analysis/format_sales.twig:94）

■管理-M12-07 フォーマット売上分析 集計一覧(検索項目)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）集計月の初期値は空（初回表示時は未設定）とする。
　初期表示で FormatSalesType を作成した直後、month に (new \DateTime())->format('Y-m') をセットしている。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-16:3476,3552 ／ 実装: src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:48,49）

■管理-M12-07 フォーマット売上分析 集計一覧(検索項目)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）本機能は検索条件をセッションへ保存しない。CSVダウンロードへ引き継ぐ状態は持たず、CSVダウンロードは送信に含まれる集計月で再集計する。CSVダウンロードはM12-08で扱う。
　M12-07 の FormatSalesController が SESSION_KEY を持ち、検索時に FormUtil::getViewData($form) を session->set する。CSV出力は GET /analysis/format-sales/export で session->get した検索条件を form->submit して再集計し、M12-07 の画面内に CSVダウンロードリンクを表示している。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-16:3515,3534,3553,3558,3564,3581 ／ 実装: src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:31,83,98,101,109,110,117; src/Eccube/Resource/template/admin/Analysis/format_sales.twig:136,138）

■管理-M12-10 特集タグ編集CSVダウンロード CSV出力
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）CSVダウンロード（形式指定）は GET /{admin_route}/analysis/used_card/export/{mode} で、保持した出力条件に従い、指定形式（特集タグ編集用など）でCSVを出力する。{mode} は出力形式を表し、指定形式のヘッダと各行をCSVとしてストリーミング出力する（ファイル名は形式と日時を含む）。
　実装は POST /%eccube_admin_route%/analysis/used-card を name=admin_analysis_used_card_export とし、同一POSTでフォームデータからCSVを直接返す。GET /analysis/used_card/export/{mode} 相当のルート、{mode} パラメータ、形式別ファイル名はない。CSVサービスのファイル名も used_card_product_YYYYMMDDHHMMSS.csv 固定。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-20:4206 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/UsedCardController.php:52）

■管理-M12-10 特集タグ編集CSVダウンロード CSV出力
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）「検索」ボタン POST /{admin_route}/analysis/used_card は、指定した出力条件で集計結果を表示し、条件をセッションに保持する。初期表示 GET では保持していた出力条件を消去し、未指定の検索フォームを表示する。CSV出力では同じ出力条件を用いる。
　GET は SearchUsedCardType の空フォームを返すのみ。POST は searchForm->getData() を UsedCardCsvExportService に渡してCSVレスポンスを返すのみで、集計結果画面の表示、セッション保存、GET時のセッション消去がない。Twigにも集計結果表示領域はなく、検索フォームとCSVダウンロードボタンのみ。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-20:4206 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/UsedCardController.php:39）

■管理-M12-10 特集タグ編集CSVダウンロード CSV出力
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）入出力の入力には、出力条件、CSVの出力形式（mode）、なりすまし対策トークンを含む。
　SearchUsedCardType は csrf_protection=false を設定しており、フォームは start_date/end_date/formats/include_basic のみで mode フィールドもCSRFトークンも持たない。TwigのformもPOST送信するが form_rest や _token 出力はない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-20:4232 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Analysis/SearchUsedCardType.php:34）

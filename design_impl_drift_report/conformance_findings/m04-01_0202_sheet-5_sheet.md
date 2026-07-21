■管理-M04-01 在庫検索一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）メンバー管理で設定されているデフォルト検索表示店舗の在庫一覧を初期表示する。
　SearchStockListType は base_info の初期値にログインメンバーの DefaultSearchBaseInfo を設定しているが、StockListController の初回GETは検索条件セッションを破棄し pagination=[] を返すため、初期表示で在庫一覧は表示されない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-5:1898 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockListController.php:180）

■管理-M04-01 在庫検索一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）一覧の表示順はID降順で表示する。ID列は商品IDを表示する。
　一覧列のIDは Item.ProductClass.Product.id を表示している一方、検索QueryBuilderのORDER BYは pc.id DESC（商品規格ID降順）で、商品ID降順ではない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-5:1903,1940 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductStockRepository.php:314）

■管理-M04-01 在庫検索一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）在庫移動・振替登録選択時、複数の在庫区分の在庫が選択されている場合はエラー文言/アラートを表示し、在庫移動・振替登録画面へ遷移させない。
　在庫移動・振替ボタンのクリック処理は未編集権限、複数店舗、在庫0のみを判定し、data-zone は行チェックボックスに出力されているが複数在庫区分判定に使われていない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-5:1910,1912 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:815）

■管理-M04-01 在庫検索一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）在庫情報カスタムCSV出力はリンクで、押下時に「カスタムCSVで作成した各種出力フォーマット」「出力項目設定」のリンクを表示する。
　在庫情報カスタムCSV出力はリンクではなく select 要素として実装され、フォーマット名と出力項目設定は option に入っている。選択変更時に option value のURLへ遷移する。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-5:1919,1935 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:449）

■管理-M04-01 在庫検索一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索パターン名を入力することで検索条件保存ボタンが活性化する。
　検索条件保存ボタンは disabled 属性なしで常に押下可能。pattern_name 入力イベントで活性/非活性を切り替えるJSもなく、空の場合はController側で name_empty エラーにして戻す。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-5:2147 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:369）

■管理-M04-01 在庫検索一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）店舗は検索条件の保存に含めない。
　savePattern は FormUtil::getViewData($searchForm) の全体を $dataToStore に入れ、_token だけを unset して serialize($dataToStore) で保存する。SearchStockListType には base_info フィールドが含まれる。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-5:2034 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockListController.php:337）

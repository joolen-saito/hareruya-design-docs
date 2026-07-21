■管理-M12-05 入荷通知依頼 一覧表示(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）サイドメニュー「入荷通知依頼」は GET /{admin_route}/analysis/request、検索ボタン押下は POST /{admin_route}/analysis/request/result で検索・一覧表示する。
　実装ルートは GET /%eccube_admin_route%/analysis/product-request、POST /%eccube_admin_route%/analysis/product-request/search、CSV は GET /%eccube_admin_route%/analysis/product-request/export。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-14:3205 ／ 実装: src/Eccube/Controller/Admin/Analysis/ProductRequestController.php:46）

■管理-M12-05 入荷通知依頼 一覧表示(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索条件は商品名（日/英）・会員名、依頼日、販売金額、購入日、購入状況、並べ替え、昇順/降順、表示件数、売上分析タグを持ち、フォームキー multi/create_date_from/create_date_to/price_from/price_to/order_date_from/order_date_to/bought/sort_key/asc_desc/limit/tagSalesAnalyses として扱う。
　実装フォームは multi/create_date_from/create_date_to/price_from/price_to/language/sort_key/asc_desc/page_count/tag_sales_analysis を定義する。order_date_from、order_date_to、bought は未定義。multi のプレースホルダは商品名(日/英)のみで、会員名検索の表示・実装根拠がない。sort_key は product_name と price のみ。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-14:3210 ／ 実装: src/Eccube/Form/Type/Admin/Analysis/SearchProductRequestType.php:50）

■管理-M12-05 入荷通知依頼 一覧表示(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）一覧は入荷通知依頼を起点に会員・商品規格・商品・規格サブを結合し、依頼単位（依頼IDでグループ化）で1行表示し、購入実績は当該会員・当該規格の注文明細・注文を左結合して購入日・購入状況を判定する。
　getAnalysisSummary は dtb_product_request、dtb_product_class、dtb_product、mtb_language を結合し、p.id と l.id で groupBy する商品ID×言語の集計。dtb_player、dtb_order、dtb_order_item への結合がなく、購入日・購入状況の判定を行わない。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-14:3219 ／ 実装: src/Eccube/Repository/DtbProductRequestRepository.php:317）

■管理-M12-05 入荷通知依頼 一覧表示(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）一覧テーブルは商品コード・商品名・言語・状態・販売金額・在庫数・会員名・依頼日・購入日・通知日/通知設定削除日の各列と、行ごとの操作メニューを表示する。行操作は規格編集へ遷移でき、通知設定削除日が未設定の依頼には削除操作を表示する。
　実装テーブルの列は 商品ID、言語、商品名、通知待ち、削除 の5列のみ。行ごとの操作メニュー、規格編集リンク、削除操作、商品コード、状態、販売金額、在庫数、会員名、依頼日、購入日、通知日/通知設定削除日は表示されない。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-14:3210 ／ 実装: src/Eccube/Resource/template/admin/Analysis/product_request.twig:127）

■管理-M12-05 入荷通知依頼 一覧表示(検索結果)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）検索画面初期表示では検索条件セッションを破棄し、依頼日Fromに当月初日、依頼日Toに当月末日、並び順に昇順を設定し、一覧は無しとする。
　初期表示 index() は SearchProductRequestType を生成して searched=false を返すが、SESSION_KEY の削除処理を行わない。日付初期値と昇順初期値は FormType に存在する。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-14:3213 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin/Analysis/ProductRequestController.php, src/Eccube/Form/Type/Admin/Analysis/SearchProductRequestType.php, src/Eccube/Resource/template/admin/Analysis/product_request.twig; 検索語: SESSION_KEY, remove, invalidate, clear, product_request.search））

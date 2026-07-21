■管理-M12-05 入荷通知依頼 一覧表示(検索項目)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）利用者視点の入口は、サイドメニュー「入荷通知依頼」から GET /{admin_route}/analysis/request を開き、検索ボタン押下で POST /{admin_route}/analysis/request/result に送信する。
　実装ルートは GET /%eccube_admin_route%/analysis/product-request、POST /%eccube_admin_route%/analysis/product-request/search、CSV は GET /%eccube_admin_route%/analysis/product-request/export。ナビも admin_analysis_product_request を参照している。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-13:利用者視点の入口 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/ProductRequestController.php:46）

■管理-M12-05 入荷通知依頼 一覧表示(検索項目)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）入力項目として購入日From・購入日To、購入状況（購入済/未購入）、商品名（日/英）・会員名を持ち、購入日と購入状況、会員姓名でも絞り込める。並べ替えは商品名・会員名・販売金額を選択できる。
　SearchProductRequestType は multi/create_date_from/create_date_to/price_from/price_to/language/sort_key/asc_desc/page_count/tag_sales_analysis のみを定義し、sort_key は product_name と price のみ。Twig も購入日・購入状況・会員名欄を描画しない。Repository の multi 条件は p.name/p.name_en のみ。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-13:フロント挙動/入力項目/集計条件 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Analysis/SearchProductRequestType.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Analysis/product_request.twig, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbProductRequestRepository.php, messages.ja.yaml; 検索語: order_date_from, order_date_to, bought, customer, player, 会員名, 購入状況, 購入日, sort_key.customer_name））

■管理-M12-05 入荷通知依頼 一覧表示(検索項目)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索結果は入荷通知依頼の一覧を同一画面に表示し、一覧は依頼IDでグループ化した依頼1件を1行として、商品コード・商品名・言語・状態・販売金額・在庫数・会員名・依頼日・購入日・通知日/通知設定削除日、行ごとの操作メニューを表示する。
　Twig の一覧列は 商品ID、言語、商品名、通知待ち、削除 の5列のみ。Repository は product_id/product_name/language_id/language_code/pending_count/deleted_count/min_price を product_id と language_id で集計して返す。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-13:フロント挙動/業務ルール・計算 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Analysis/product_request.twig:130）

■管理-M12-05 入荷通知依頼 一覧表示(検索項目)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）検索・一覧表示では、購入実績を当該会員・当該規格の注文明細・注文と左結合し、依頼の通知設定削除日より後の注文日を持つ注文を購入とみなす。購入日の列は最も早い注文日を %Y/%m/%d %H:%i で表示する。
　実行中の getAnalysisSummary は dtb_product_request、dtb_product_class、dtb_product、mtb_language のみを結合し、dtb_order/dtb_order_item への結合、購入判定、購入日の MIN 表示を行わない。該当ロジックはコメントアウトされた旧実装片にのみ存在する。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-13:集計条件/業務ルール・計算 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbProductRequestRepository.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Analysis/product_request.twig; 検索語: dtb_order, dtb_order_item, order_date, deleted_at <, MIN, bought））

■管理-M12-05 入荷通知依頼 一覧表示(検索項目)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）行操作メニューでは、各行の操作メニューから規格編集へ遷移でき、通知設定削除日が未設定の依頼には削除操作を表示する。削除はなりすまし対策トークン付きで、確認ダイアログを経て実行する。
　ProductRequestController には index/search/export のみで、入荷通知依頼削除ルートはない。product_request.twig には規格編集リンク、削除フォーム、csrf_token、確認ダイアログがない。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-13:フロント挙動/画面遷移 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/ProductRequestController.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Analysis/product_request.twig, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbProductRequestRepository.php; 検索語: product_request delete, csrf_token, 規格, ProductClass edit, confirm, deleted_at IS NULL））

■管理-M12-05 入荷通知依頼 一覧表示(検索項目)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）検索画面初期表示では検索条件セッションを破棄し、依頼日Fromに当月初日、依頼日Toに当月末日、並び順に昇順を設定する。一覧は無しとする。
　index() は SearchProductRequestType を生成して searched=false を返すが、SESSION_KEY の remove/invalidate 等による検索条件セッション破棄を行わない。初期値そのものは FormType で当月初日・当月末日・ASC が設定されている。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-13:処理フロー/検索画面初期表示 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/ProductRequestController.php:48）

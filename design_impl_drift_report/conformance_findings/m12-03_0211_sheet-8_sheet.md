■管理-M12-03 受注売上分析 集計一覧(検索項目)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索ボタン押下は POST /{admin_route}/analysis/sales/result で集計し、同一画面に集計結果一覧を表示する。
　実装の検索POSTルートは /{admin_route}/analysis/sales/search、フォームactionも admin_analysis_sales_search を指している。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-8:2119,2128 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SalesAnalysisController.php:62 /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Analysis/sales.twig:105）

■管理-M12-03 受注売上分析 集計一覧(検索項目)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）入力項目として、都道府県、性別、誕生日From・To、利用端末を指定できる。
　SalesType は multi, summary_date_from/to, date_type, summary_type, sort_key, asc_desc, page_count, category_id, card_condition, tag_sales_analysis, cardset, price_from/to, quantity_from/to, mail_order_enabled, store_sales_all, store_sales_targets のみ定義している。都道府県・性別・誕生日From/To・利用端末のフォーム項目、Twig描画、Repository絞り込みがない。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-8:2123,2138,2160 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Analysis/SalesType.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Analysis/sales.twig, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php, messages.ja.yaml の admin.analysis.sales.*））

■管理-M12-03 受注売上分析 集計一覧(検索項目)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）各行に平均単価・数量・合計・件数とそれぞれの割合を表示し、割合（数量割合・合計割合・件数割合）は合計に対する各行の比率を100倍し小数点以下を切り捨てて算出する。
　Repository は total, sales, price, order_count のみ算出し、Twig も平均単価・数量・合計・件数のみ表示する。数量割合・合計割合・件数割合の算出、表示列、翻訳キーがない。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-8:2123,2133,2136 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Analysis/sales.twig, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml の admin.analysis.sales.result.*））

■管理-M12-03 受注売上分析 集計一覧(検索項目)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）期間は集計日Fromから集計日To未満まで、使用日付で選んだ日付列で絞り込む。
　summary_date_to がある場合、o.{dateType} <= :summaryDateTo で絞り込む。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-8:2132 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php:248）

■管理-M12-03 受注売上分析 集計一覧(検索項目)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）検索画面初期表示では検索条件セッションを破棄する。
　index() はフォーム生成と所属店舗初期値設定のみ行い、SESSION_KEY eccube.admin.analysis.sales.search を削除していない。検索時は session->set、CSV時は session->get だけが存在する。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-8:2126,2127 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SalesAnalysisController.php の SESSION_KEY/session remove/invalidate/clear））

■管理-M12-03 受注売上分析 集計一覧(検索項目)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）CSVダウンロードは同じセッションの検索条件で再集計する。ただしCSVは表示件数の上限を適用しない。
　CSV exporter はセッション由来の searchData をそのまま getAnalysisSummary() に渡し、getAnalysisSummary() は page_count が正数なら setMaxResults(page_count) を適用する。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-8:2144,2166,2168 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SalesAnalysisCsvExporterService.php:38 /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php:310）

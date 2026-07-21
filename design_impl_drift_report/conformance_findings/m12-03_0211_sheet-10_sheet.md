■管理-M12-03 受注売上分析 集計一覧(検索結果-集計単位 カテゴリ )
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索ボタン押下のURLエンドポイントは POST /{admin_route}/analysis/sales/result とする。
　実装は POST /{admin_route}/analysis/sales/search（admin_analysis_sales_search）へ送信する。/analysis/sales/result のルートは存在しない。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-10:2518,2527 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SalesAnalysisController.php:62, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Analysis/sales.twig:105）

■管理-M12-03 受注売上分析 集計一覧(検索結果-集計単位 カテゴリ )
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）各行に平均単価・数量・合計・件数とそれぞれの割合を表示し、数量割合・合計割合・件数割合は合計に対する各行の比率を100倍し小数点以下を切り捨てて算出する。
　集計結果テーブルはカテゴリ/商品コード/商品名、平均単価、数量、合計、件数のみを表示し、Repository も total, sales, price, order_count のみ算出する。割合列・割合算出結果は無い。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-10:2522,2532 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Analysis/sales.twig, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SalesAnalysisCsvExporterService.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml））

■管理-M12-03 受注売上分析 集計一覧(検索結果-集計単位 カテゴリ )
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）集計単位は商品・カテゴリ・支払方法・購入グループ・都道府県・性別・利用端末・年代（会員）から選択でき、指定に応じてグループ化キーを切り替える。
　SalesType::SUMMARY_TYPE は 商品(product_id) と カテゴリ(class_category_name) の2択のみ。Repository も product_id と class_category_name の分岐のみ実装している。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-10:2531 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Analysis/SalesType.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Analysis/sales.twig, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml））

■管理-M12-03 受注売上分析 集計一覧(検索結果-集計単位 カテゴリ )
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）入力項目として、カテゴリ、都道府県、性別、誕生日From・To、利用端末、売上分析タグ、カードセット、平均単価From・To、数量From・To、状態を持ち、絞り込みでは都道府県・性別・誕生日・利用端末も対応する結合・条件を追加する。
　フォームと検索条件はカテゴリ、状態、売上分析タグ、カードセット、平均単価、数量など一部のみ実装。都道府県、性別、誕生日From・To、利用端末のフォーム項目および検索条件追加は無い。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-10:2522,2531 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Analysis/SalesType.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Analysis/sales.twig, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php））

■管理-M12-03 受注売上分析 集計一覧(検索結果-集計単位 カテゴリ )
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）集計期間は集計日Fromから集計日To未満まで、使用日付で選んだ日付列で絞り込む。集計日Toの初期値は当月末日（初期値は翌月初日相当）とする。
　集計日Toの初期値は last day of this month 23:59:59。検索条件は o.{dateType} <= :summaryDateTo で上限を含む。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-10:2531,2536 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Analysis/SalesType.php:106, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php:248）

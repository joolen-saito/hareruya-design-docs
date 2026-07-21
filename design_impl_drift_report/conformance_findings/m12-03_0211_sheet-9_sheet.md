■管理-M12-03 受注売上分析 集計一覧(検索結果-集計単位 商品)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検索ボタン押下は POST /{admin_route}/analysis/sales/result で、入力された検索条件で集計し、同一画面に集計結果一覧を表示する。
　検索POSTの実装ルートは /{admin_route}/analysis/sales/search、フォームactionも admin_analysis_sales_search を向いている。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-9:2320,2329 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SalesAnalysisController.php:62; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Analysis/sales.twig:105）

■管理-M12-03 受注売上分析 集計一覧(検索結果-集計単位 商品)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）検索画面初期表示では検索条件セッションを破棄し、集計結果は無しとする。
　index() は検索フォームを作成して searched=false を返すが、SESSION_KEY(eccube.admin.analysis.sales.search) を remove/clear していない。検索時は session->set、CSV時は session->get している。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-9:2327-2328 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SalesAnalysisController.php:43）

■管理-M12-03 受注売上分析 集計一覧(検索結果-集計単位 商品)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）集計結果テーブルは、各行に平均単価・数量・合計・件数とそれぞれの割合を表示し、割合は合計に対する各行の比率を100倍し小数点以下を切り捨てて算出する。
　Twigの列は商品コード/商品名またはカテゴリ、平均単価、数量、合計、件数のみ。Repositoryは total/sales/price/order_count と合計値を返すだけで、数量割合・合計割合・件数割合を算出していない。翻訳キーにも割合列がない。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-9:2324,2330,2334,2337,2351 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Analysis/sales.twig:274; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php:317; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5929）

■管理-M12-03 受注売上分析 集計一覧(検索結果-集計単位 商品)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）入力項目は、汎用ワード、集計日From・To、使用日付、集計単位、並べ替え、昇順/降順、表示件数、カテゴリ、都道府県、性別、誕生日From・To、利用端末、売上分析タグ、カードセット、平均単価From・To、数量From・To、状態を備える。集計単位は商品/カテゴリ/支払方法/購入グループ/都道府県/性別/利用端末/年代（会員）で切り替える。
　SalesTypeのSUMMARY_TYPEは商品(product_id)とカテゴリ(class_category_name)のみ。フォーム/テンプレート/Repositoryには都道府県、性別、誕生日From・To、利用端末、支払方法、購入グループ、年代（会員）の集計・絞り込みがない。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-9:2324,2333,2339 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Analysis/SalesType.php:50; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Analysis/SalesType.php:94; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php:198; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Analysis/sales.twig:153）

■管理-M12-03 受注売上分析 集計一覧(検索結果-集計単位 商品)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）期間は集計日Fromから集計日To未満まで、使用日付で選んだ日付列で絞り込む。
　Fromは >= だが、Toは o.{dateType} <= :summaryDateTo で絞り込む。初期値も last day of this month 23:59:59。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-9:2333,2339 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php:244; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Analysis/SalesType.php:106）

■管理-M12-03 受注売上分析 集計一覧(検索結果-集計単位 商品)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）平均単価・数量のFrom・Toは任意の数値で、0以上を入力補助で促し、集計後の値に対する絞り込みとして適用する。
　price_from/price_to/quantity_from/quantity_to は IntegerType として定義され、RepositoryでHAVINGに使われるが、フォーム属性 min=0 や0以上制約は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-9:2333,2361 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Analysis/SalesType.php:193; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php:289）

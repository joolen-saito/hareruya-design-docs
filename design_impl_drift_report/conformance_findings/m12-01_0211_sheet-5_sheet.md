■管理-M12-01 日別・月別集計 集計一覧(検索結果-日別)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）販売関連の集計は注文データの注文ステータスが「出荷完了」のみ計上し、それ以外の注文ステータスは計上しない。
　aggregateOrderSummaryByBaseInfo は dtb_order を base_info_id と order_date 範囲で抽出しており、order_status_id = 出荷完了の条件がない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-5:1387 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDailySummaryRepository.php:62）

■管理-M12-01 日別・月別集計 集計一覧(検索結果-日別)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）買取関連の集計は買取データの買取ステータスが「買取成立」のみ計上し、それ以外の買取ステータスは計上しない。買取件数は、ネット買取は査定承諾日が入っているもの、店頭買取は買取成立日が入っているものを集計対象とし、キャンセル／管理者取消は含めない。
　aggregatePurchaseSummaryByBaseInfo はネット買取を bo.auto_approval_flg = TRUE かつ bo.order_date 範囲で集計し、店頭買取を obo.cancel_date IS NULL かつ obo.apply_date 範囲で集計する。買取成立ステータス、査定承諾日、買取成立日による限定ではない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-5:1363,1364,1366,1367,1388 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDailySummaryRepository.php:131）

■管理-M12-01 日別・月別集計 集計一覧(検索結果-日別)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）店舗の並び順は店舗の表示順の昇順。
　集計結果取得は s.summaryDate ASC の後に b.id ASC で並べており、店舗表示順を表す BaseInfo.rank は使用していない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-5:1383 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDailySummaryRepository.php:331）

■管理-M12-01 日別・月別集計 集計一覧(検索結果-日別)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）廃棄・欠品は、通販は本店EC在庫、TC東京のみスマレジ在庫のみ、その他店舗はEC在庫とスマレジ在庫を集計する。廃棄はイベント商品・他事業移動を除外し、欠品は欠品減算（受注）・欠品加算（移動）を対象とし、在庫変動履歴のマイナス値はプラスに反転する。
　廃棄・欠品の集計は DtbStockHistory の baseInfo、StockChangeTypeDetail、registeredAt、stockChangeQuantity を使う。ProductStock.stock_location_id は存在するが、集計クエリでは ProductStock へ結合せず、EC在庫／スマレジ在庫の店舗別選別を行っていない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-5:1370,1371,1372,1373,1375,1376,1377,1378,1379,1380,1381 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDailySummaryRepository.php:171）

■管理-M12-01 日別・月別集計 集計一覧(検索結果-日別)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）検索フォームは商品名（日/英）・商品コード、集計タイプ、集計日From/To、利用端末、表示項目（注文）、表示項目（明細）を持ち、表示項目には「全て選択」を併設する。入力は検索条件（集計タイプ・集計日・利用端末・表示項目・商品名/商品コード）として扱う。
　SummaryType は summary_type、summary_date_from、summary_date_to、mail_order_enabled、store_sales_all、store_sales_targets のみを定義する。summary.twig も同項目を描画し、結果列は SummaryController::RESULT_COLUMNS の固定列である。multi、device_type、columns_order、columns_product のフォームキーと処理は存在しない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-5:1493,1508,1520,1530 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SummaryController.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Analysis/SummaryType.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Analysis/summary.twig, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Analysis, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDailySummaryRepository.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbMonthlySummaryRepository.php））

■管理-M12-01 日別・月別集計 集計一覧(検索結果-月別)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）販売関連の集計は注文データの注文ステータスが「出荷完了」のみ計上し、それ以外の注文ステータスは計上しない。
　aggregateOrderSummaryByBaseInfo は order_date 範囲と base_info_id IS NOT NULL のみで dtb_order を集計し、order_status_id = 出荷完了 の条件を付けていない。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-6:1611 ／ 実装: src/Eccube/Repository/DtbDailySummaryRepository.php:62）

■管理-M12-01 日別・月別集計 集計一覧(検索結果-月別)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）買取関連の集計は買取データの買取ステータスが「買取成立」のみ計上し、それ以外の買取ステータスは計上しない。
　ネット買取は bo.auto_approval_flg = TRUE、店頭買取は obo.cancel_date IS NULL で集計しており、買取成立ステータスのみを指定していない。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-6:1612 ／ 実装: src/Eccube/Repository/DtbDailySummaryRepository.php:131）

■管理-M12-01 日別・月別集計 集計一覧(検索結果-月別)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）識別ID 2: 「支店名」を追加。「通販」もしくは指定された「店舗名」または「その他」を出力する。※「その他」は通販・各店舗に該当しない売上を計上。
　販売集計は o.base_info_id IS NOT NULL、店頭買取集計は obo.base_info_id IS NOT NULL を条件にし、表示名は AnalysisSummaryBuilder::resolveStoreName で「通販」または short_name_jp/shop_name を返すだけで「その他」を生成しない。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-6:1615 ／ 実装: src/Eccube/Repository/DtbDailySummaryRepository.php:63）

■管理-M12-01 日別・月別集計 集計一覧(検索結果-月別)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）識別ID 11「廃棄」は在庫変動区分が「廃棄」となっているものを集計し廃棄コスト合計を出力し、識別ID 12「欠品」は在庫変動区分が「欠品」となっているものを集計しコスト合計を出力する。
　廃棄は stockChangeQuantity の符号反転合計を waste_quantity とし、欠品も stockChangeQuantity の符号反転合計を shortage_quantity として保存・表示している。コスト合計は算出していない。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-6:1626 ／ 実装: src/Eccube/Repository/DtbDailySummaryRepository.php:177）

■管理-M12-01 日別・月別集計 集計一覧(検索結果-月別)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）平均単価は金額合計を数量合計で割った値とし、表示時に切り上げる。
　日次・月次集計バッチは grossSales / saleCount を PHP_ROUND_HALF_UP で丸め、画面合計行は intdiv(order_amount_order, buyer_count) で切り捨てている。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-6:1726 ／ 実装: src/Eccube/Service/Admin/Analysis/BatchAggregateDailySummaryAction.php:116）

■管理-M12-01 日別・月別集計 集計一覧(検索結果-月別)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）商品名（日/英）・商品コード、利用端末、表示項目（注文）、表示項目（明細）を検索条件として入力できる。フォームキーは multi、device_type、columns_order、columns_product。
　SummaryType は summary_type、summary_date_from、summary_date_to、mail_order_enabled、store_sales_all、store_sales_targets のみを定義している。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-6:1731 ／ 実装: 不在（探索範囲: src/Eccube/Form/Type/Admin/Analysis/SummaryType.php, src/Eccube/Resource/template/admin/Analysis/summary.twig, src/Eccube/Controller/Admin/Analysis/SummaryController.php; multi/device_type/columns_order/columns_product/商品名/商品コード/利用端末/表示項目 を検索））

■管理-M12-01 日別・月別集計 集計一覧(検索結果-月別)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）期間内で集計結果が無い日付・月は、件数等を0で補完して一覧に並べる。
　月別表示は DtbMonthlySummaryRepository::fetchSummaryRowsByMonthRangeAndTargets の取得行を AnalysisSummaryBuilder::fetchMonthlySummary がそのまま配列化して返す。欠落月を生成するループや0埋め処理は無い。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-6:1726 ／ 実装: 不在（探索範囲: src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php, src/Eccube/Repository/DtbMonthlySummaryRepository.php, src/Eccube/Repository/DtbDailySummaryRepository.php; DatePeriod/補完/zero fill/summary_month を検索））

■管理-M12-01 日別・月別集計 集計一覧(検索結果-月別)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）サイドメニュー「月別集計」は、集計タイプ月次、集計日を当月初日の2か月前〜当月末日とした検索画面を表示する。
　月別初期表示では dateFrom を2か月前にする一方、dateTo を new DateTime('first day of this month') に上書きしている。Twig側の切替JSも月次のToを当月1日に設定している。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-6:1712 ／ 実装: src/Eccube/Controller/Admin/Analysis/SummaryController.php:194）

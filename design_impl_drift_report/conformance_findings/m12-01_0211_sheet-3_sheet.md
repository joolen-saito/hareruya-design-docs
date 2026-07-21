■管理-M12-01 日別・月別集計 集計一覧(検索項目-日別)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）通販売上は配送方法が店頭受取（スムーズ店頭受取含む）・なし以外かつ対応状況が出荷完了、店舗売上は配送方法が店頭受取（スムーズ店頭受取含む）またはなし且つ対応状況が出荷完了のみを集計対象にする。
　日次集計バッチは dtb_order を base_info_id と order_date の範囲だけで集計し、配送方法や order_status_id による通販売上/店舗売上/出荷完了の絞り込みを行っていない。月次集計はこの日次集計を合算する。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-3:907,910,912,914,930,931 ／ 実装: src/Eccube/Repository/DtbDailySummaryRepository.php:42; src/Eccube/Repository/DtbDailySummaryRepository.php:62; src/Eccube/Repository/DtbDailySummaryRepository.php:66）

■管理-M12-01 日別・月別集計 集計一覧(検索項目-日別)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）期間内で集計結果が無い日付・月は、表示項目の各列を0として一覧へ補完する。集計対象が0件でも集計結果が無い日付・月の列を0で補完する。
　AnalysisSummaryBuilder はリポジトリが返した集計済み行だけを表示用配列へ変換する。リポジトリは dtb_daily_summary / dtb_monthly_summary に存在する行だけを期間条件で取得し、欠落日・欠落月の行生成をしない。summary が空の場合、Twig は結果表自体を描画しない。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-3:1055,1069,1096 ／ 実装: src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:75; src/Eccube/Repository/DtbDailySummaryRepository.php:329; src/Eccube/Repository/DtbMonthlySummaryRepository.php:106; src/Eccube/Resource/template/admin/Analysis/summary.twig:194）

■管理-M12-01 日別・月別集計 集計一覧(検索項目-月別)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）集計は売上として計上できるもののみとし、注文ステータスが「出荷完了」の注文だけを集計対象とする。
　日次集計バッチの受注集計SQLは dtb_order を order_date 範囲と base_info_id で集計しており、order_status_id や OrderStatus::DELIVERED の条件がない。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-4:1141 ／ 実装: src/Eccube/Repository/DtbDailySummaryRepository.php:42; src/Eccube/Repository/DtbDailySummaryRepository.php:62; src/Eccube/Service/Admin/Analysis/BatchAggregateDailySummaryAction.php:37）

■管理-M12-01 日別・月別集計 集計一覧(検索項目-月別)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）売上集計用に検索項目に出力するフラグを店舗管理に持たせ、そのフラグで集計対象(各店舗)の店舗一覧を出力する。
　集計対象(各店舗)の選択肢は BaseInfoRepository::getPublicTenantShopsForSummary が isPublicShop=true のテナント店舗を取得している。店舗管理フォームには is_public_shop/is_open_shop はあるが、売上集計用の検索項目出力フラグは見つからない。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-4:1149 ／ 実装: src/Eccube/Repository/BaseInfoRepository.php:198; src/Eccube/Repository/BaseInfoRepository.php:203; src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:117; src/Eccube/Entity/BaseInfo.php:1548）

■管理-M12-01 日別・月別集計 集計一覧(検索項目-月別)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）期間内で集計結果が無い日付・月は、表示項目の各列を0として一覧へ補完する。
　AnalysisSummaryBuilder は日次/月次ともサマリーテーブルから取得できた行だけを整形して返す。Repository も指定範囲の既存行を SELECT するだけで、期間内の日付・月を列挙して0行を生成する処理がない。確認お願いします。（設計根拠: excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html#sheet-4:1249 ／ 実装: src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:75; src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:126; src/Eccube/Repository/DtbDailySummaryRepository.php:304; src/Eccube/Repository/DtbMonthlySummaryRepository.php:83; src/Eccube/Service/Admin/Analysis/BatchAggregateDailySummaryAction.php:101）

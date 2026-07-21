■バッチ-B02-07 週間在庫履歴更新バッチ
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）コンソールのバッチコマンドは product:batch exportWeeklyStockHistoryCsv で、全商品規格の週次在庫を在庫履歴から集計し、設定された出力パスへCSVを出力する。
　実装コマンド名は eccube:update-weekly-stock-history。product:batch exportWeeklyStockHistoryCsv は src/Eccube/Command, src/Eccube/Service, src/Eccube/Repository, html/template 配下の再検索でも見つからない。確認お願いします。（設計根拠: excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html#sheet-6:1340 ／ 実装: src/Eccube/Command/UpdateWeeklyStockHistoryCommand.php:35）

■バッチ-B02-07 週間在庫履歴更新バッチ
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）商品コードごと、店舗ごとに在庫履歴の出力を行うため、ECCUBE、スマレジの在庫を合算して週間在庫履歴テーブルに登録する。
　BatchUpdateWeeklyStockHistoryAction は TODO コメントで「スマレジ在庫との合算対応」「現時点ではスマレジ在庫の取り込みが未実装のため、ECCUBE在庫のみを対象」と明記している。確認お願いします。（設計根拠: excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html#sheet-6:1297 ／ 実装: src/Eccube/Service/Product/BatchUpdateWeeklyStockHistoryAction.php:41）

■バッチ-B02-07 週間在庫履歴更新バッチ
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）成功時出力は、出力パス（設定キー HareruyaEc.const.weekly_stock_history.csv_path、既定 /html/csv/weekly_stock_history.csv）へのCSV書き出し。ヘッダは商品規格IDと週次在庫列。副作用はCSVファイルの生成・上書きで、DBは更新しない。
　実装は dtb_weekly_stock_history_temp を TRUNCATE/INSERT し、dtb_weekly_stock_history を TRUNCATE して一時テーブルからコピーする。CSV出力パス、設定キー、fopen/fputcsv、weekly_stock_history.csv への書き出しは対象実装範囲で確認できない。確認お願いします。（設計根拠: excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html#sheet-6:1357 ／ 実装: src/Eccube/Service/Product/BatchUpdateWeeklyStockHistoryAction.php:53）

■バッチ-B02-07 週間在庫履歴更新バッチ
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）対象データは商品在庫に存在する全商品規格ID。商品規格ごとに1週前から11週前までを集計し、対象の在庫履歴が無い週は在庫を0として扱う。
　getStockData は FROM dtb_stock_history sh を起点に sh.product_stock_id BETWEEN :start AND :end で GROUP BY sh.product_stock_id する。該当 product_stock_id に在庫履歴行が1件も無い場合、その商品在庫は結果行自体が生成されず、一時テーブルにも本テーブルにもコピーされない。確認お願いします。（設計根拠: excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html#sheet-6:1345 ／ 実装: src/Eccube/Repository/DtbWeeklyStockHistoryTempRepository.php:69）

■バッチ-B02-07 週間在庫履歴更新バッチ
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）メモリ制限と実行時間制限を解除し、SQLロガーを無効化する。
　B02-07 のコマンド、アクション、関連リポジトリにはメモリ制限解除・実行時間制限解除・SQLロガー無効化の処理がない。確認お願いします。（設計根拠: excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html#sheet-6:1345 ／ 実装: 不在（探索範囲: src/Eccube/Command/UpdateWeeklyStockHistoryCommand.php, src/Eccube/Service/Product/BatchUpdateWeeklyStockHistoryAction.php, src/Eccube/Repository/DtbWeeklyStockHistoryTempRepository.php, src/Eccube/Repository/DtbWeeklyStockHistoryRepository.php; 検索語: ini_set, memory_limit, set_time_limit, setSQLLogger, SQLLogger））

■バッチ-B02-07 週間在庫履歴更新バッチ
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）開始・完了のコンソール出力（日時付き）。
　完了時は「週間在庫履歴の更新が完了しました。」を success 出力し、例外時はエラーメッセージを出力するが、開始出力と日時付き出力はない。確認お願いします。（設計根拠: excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html#sheet-6:1374 ／ 実装: src/Eccube/Command/UpdateWeeklyStockHistoryCommand.php:56）

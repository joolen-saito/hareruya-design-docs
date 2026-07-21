■バッチ-B06-02 買取集計バッチ
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）入口はコンソールのバッチコマンド `otcBuyOrder:batch updateSummary [YYYY-MM-DD]` とし、引数に集計日（YYYY-MM-DD形式）を1つ指定できる。
　Symfony コマンド名は `eccube:otc-buy-order:aggregate-summary`。`otcBuyOrder:batch` / `updateSummary` / alias 実装は `src/Eccube` と `html` の再検索でも不在。確認お願いします。（設計根拠: excel_to_html/output/0406_基本設計仕様書(バッチ_店頭買取管理) .html#sheet-4:1074 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcBuyOrderAggregateSummaryCommand.php:45）

■バッチ-B06-02 買取集計バッチ
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）部門が登録されていない商品が存在する場合は、エラーメールを送信する。部門未設定商品通知メールには商品名・商品コードの一覧を本文に載せる。
　`BatchAggregateSummaryAction` は `getNoSectionProducts()` の戻り値があれば `sendNoSectionAlertMail()` を呼ぶが、`getNoSectionProducts()` の SQL は `WHERE AND obo.complete_date ...` となっており、WHERE 直後の AND により SQL として実行不能。確認お願いします。（設計根拠: excel_to_html/output/0406_基本設計仕様書(バッチ_店頭買取管理) .html#sheet-4:1039 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:956）

■バッチ-B06-02 買取集計バッチ
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）実行時間制限を解除する。長時間処理に備えて実行時間制限を解除する。
　該当バッチ経路に `set_time_limit(0)`、`ini_set('max_execution_time', ...)`、同等の実行時間制限解除処理が見つからない。確認お願いします。（設計根拠: excel_to_html/output/0406_基本設計仕様書(バッチ_店頭買取管理) .html#sheet-4:1079 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcBuyOrderAggregateSummaryCommand.php, src/Eccube/Service/Admin/OtcBuyOrder, src/Eccube/Repository/DtbOtcBuyOrderRepository.php, src/Eccube/Repository/DtbOtcBuyOrderSummaryRepository.php））

■バッチ-B06-02 買取集計バッチ
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）部門未設定商品通知メールは送信開始・送信完了・件数、宛先未設定時の送信せず終了をログに記録する。
　`sendNoSectionAlertMail()` は送信開始、宛先未設定、送信完了を `log_info` するが、部門未設定商品の件数をログ出力していない。確認お願いします。（設計根拠: excel_to_html/output/0406_基本設計仕様書(バッチ_店頭買取管理) .html#sheet-4:1110 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1190）

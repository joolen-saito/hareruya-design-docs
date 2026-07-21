■バッチ-B05-05 スマレジ商品削除
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）コンソールのバッチコマンドは order:batch deleteSmaregiProduct で実行し、手続きが完了した店頭注文をスマレジ商品から削除する。コマンド名が一致しない場合は処理を行わずに終了する。
　実装されている Symfony Console コマンド名は eccube:smaregi:otc:delete。src/Eccube/Command 配下の AsCommand 名を再検索しても order:batch または deleteSmaregiProduct のコマンド定義は見つからない。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-7:1596, excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-7:1597, excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-7:1598, excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-7:1601, excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-7:1625 ／ 実装: src/Eccube/Command/SmaregiOtcDeleteCommand.php:39）

■バッチ-B05-05 スマレジ商品削除
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）連携に失敗した場合はスマレジ通信エラーメールを送信し、エラーが発生したスマレジ連携ごとにメールで管理者に通知する。
　スマレジ商品検索または削除APIが失敗した場合、SmaregiOtcDeleteService は logger->error して DELETE_FAILED を返し、SmaregiOtcDeleteMessageHandler は MessengerJob を FAILED に更新する。MailService 注入、mailer->send、スマレジ通信エラーメール用メソッド、メールテンプレート呼び出しは関連処理に存在しない。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-7:1548, excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-7:1564, excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-7:1565 ／ 実装: 不在（探索範囲: src/Eccube/Command, src/Eccube/MessageHandler, src/Eccube/Service/Smaregi, src/Eccube/Service/MailService.php, src/Eccube/Resource。関連実装は src/Eccube/Service/Smaregi/Otc/SmaregiOtcDeleteService.php:66, src/Eccube/Service/Smaregi/Otc/SmaregiOtcDeleteService.php:70, src/Eccube/Service/Smaregi/Otc/SmaregiOtcDeleteService.php:92, src/Eccube/Service/Smaregi/Otc/SmaregiOtcDeleteService.php:94, src/Eccube/MessageHandler/SmaregiOtcDeleteMessageHandler.php:100, src/Eccube/MessageHandler/SmaregiOtcDeleteMessageHandler.php:133））

■バッチ-B05-05 スマレジ商品削除
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）ログ・監査として開始・完了のコンソール出力を日時付きで行う。
　コンソール出力は対象なしメッセージ、受注ごとの enqueue 行、完了サマリのみ。開始メッセージはなく、完了サマリにも日時は含まれない。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-7:1627, excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-7:1628 ／ 実装: src/Eccube/Command/SmaregiOtcDeleteCommand.php:80, src/Eccube/Command/SmaregiOtcDeleteCommand.php:92, src/Eccube/Command/SmaregiOtcDeleteCommand.php:103, src/Eccube/Command/SmaregiOtcDeleteCommand.php:111）

■バッチ-B05-05 スマレジ商品削除
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）本バッチは削除連携が主であり、楽観ロック・悲観ロックの対象は持たない。
　SmaregiOtcDeleteMessageHandler は SmaregiMessengerJobProcessingLock を注入し、tryBeginProcessingJob($Job) で同一ジョブの重複実行抑止ロックを取得してから削除処理を行う。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-7:1632, excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-7:1633 ／ 実装: src/Eccube/MessageHandler/SmaregiOtcDeleteMessageHandler.php:35, src/Eccube/MessageHandler/SmaregiOtcDeleteMessageHandler.php:45, src/Eccube/MessageHandler/SmaregiOtcDeleteMessageHandler.php:73）

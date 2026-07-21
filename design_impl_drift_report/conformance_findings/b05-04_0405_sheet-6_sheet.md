■バッチ-B05-04 スマレジ商品再連携
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）スマレジ商品再連携はコンソールコマンド order:batch resendSmaregiProduct で実行し、スマレジ商品コード登録済み・スマレジ削除フラグ未設定・スマレジ商品連携または在庫連携が未連携の注文を対象に、未連携区分のみ再連携する。
　実行可能な関連コマンドは eccube:order:otc-smaregi-post で、SmaregiOtcOrderPostAction は findTargetOrdersForSmaregiPost() を呼ぶ。設計条件に近い getResendSmaregiProduct() は存在するが、src/Eccube と html 内で呼び出し元が見つからない。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-6:1476,1481,1487,1490 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcOrderSmaregiPostCommand.php:25, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOtcOrderPostAction.php:42, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:741, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1798）

■バッチ-B05-04 スマレジ商品再連携
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）連携に失敗した場合はスマレジ通信エラーメール送信し、エラー発生時は発生したスマレジ連携ごとにメールで管理者に通知する。
　SmaregiOtcOrderSyncService は API 失敗時に logger->error と Order.smaregi_error_flg=true を行い、SmaregiOtcSyncMessageHandler は MessengerJob を FAILED にするが、スマレジ連携ごとの管理者向けメール送信は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-6:1408,1411,1443,1504 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/html。検索語: スマレジ通信エラー, 通信エラーメール, メールで管理者, smaregi_error_mail_address, smaregi_error_send_mailaddress, MailService, mailer, send, SmaregiOtcSyncMessageHandler, SmaregiOtcOrderSyncService））

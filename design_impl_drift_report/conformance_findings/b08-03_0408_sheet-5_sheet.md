■バッチ-B08-03 ポイント有効期限通知
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）コンソールのバッチコマンドは `customer:batch pointExpireNotification` として実行でき、コマンド名が一致しない場合は処理を行わずに終了する。
　実装の Symfony Console コマンド名は `eccube:customer:point-expire-notification`。`customer:batch pointExpireNotification` の AsCommand 名・alias・setName 実装は `src/Eccube/Command` 全体の検索で見つからない。確認お願いします。（設計根拠: excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-5:1342,1343,1346 ／ 実装: src/Eccube/Command/PointExpireNotificationCommand.php:25）

■バッチ-B08-03 ポイント有効期限通知
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）送信時のエラーはエラーメッセージをコンソールに出力する。
　`sendPointExpireNotificationMail()` は `TransportExceptionInterface` を catch すると `log_critical($e->getMessage())` を実行して return する。例外は `PointExpireNotificationCommand` へ再throwされないため、コマンド側の `$io->error(...)` には到達しない。確認お願いします。（設計根拠: excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-5:1363,1373 ／ 実装: src/Eccube/Service/MailService.php:1115）

■バッチ-B08-03 ポイント有効期限通知
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）開始・完了のコンソール出力は日時付きで行う。
　開始時は `$io->text('ポイント有効期限通知バッチ開始')`、完了時は `$io->success('ポイント有効期限通知処理が完了しました。')` を出力するが、いずれのコンソール文言にも日時は含まれない。確認お願いします。（設計根拠: excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-5:1375,1376 ／ 実装: src/Eccube/Command/PointExpireNotificationCommand.php:38）

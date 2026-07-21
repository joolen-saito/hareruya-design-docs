■バッチ-B08-05 ポイント差分発生通知
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）コンソールのバッチコマンドは customer:batch adjustPointVariance として実行する。
　Symfony Console コマンド名は #[AsCommand(name: 'eccube:customer:adjust-point-variance', ...)] として登録されている。確認お願いします。（設計根拠: excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-7:1570 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/AdjustPointVarianceCommand.php:25）

■バッチ-B08-05 ポイント差分発生通知
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）開始・完了のコンソール出力（日時付き）。
　開始時は「ポイント差分発生通知バッチ開始」、完了時は「ポイント差分発生通知処理が完了しました。」を出力するが、日時は付与していない。確認お願いします。（設計根拠: excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-7:1602 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/AdjustPointVarianceCommand.php:38）

■バッチ-B08-05 ポイント差分発生通知
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）取得・送信時のエラーはエラーメッセージをコンソールに出力する。
　メール送信時の TransportExceptionInterface は MailService 内で catch され、log_critical($e->getMessage()) を呼ぶだけで再throwしないため、Command 側の $io->error() に到達しない。確認お願いします。（設計根拠: excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-7:1599 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1356）

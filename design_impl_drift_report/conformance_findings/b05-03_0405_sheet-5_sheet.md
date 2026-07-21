■バッチ-B05-03 店頭注文番号初期化
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）コンソールのバッチコマンド `order:batch truncateWaitingNumber` で店頭注文番号初期化を実行し、コマンド名が一致しない場合は処理を行わずに終了する。
　Symfony Console コマンドは `eccube:order:truncate-waiting-number` として登録されている。`order:batch truncateWaitingNumber` または alias 登録は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-5:1330-1334 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/TruncateWaitingNumberCommand.php:25）

■バッチ-B05-03 店頭注文番号初期化
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）削除と採番カウンタ初期化は1トランザクションでまとめた更新ではなく、それぞれ独立した文として実行する。削除のみ成功してカウンタ初期化前に中断した場合でも、再実行で空テーブル・カウンタ1に収束する。
　`handle()` は `beginTransaction()` 後に `dtb_waiting_number` と `dtb_waiting_number_counter` の TRUNCATE、カウンタ再登録、`flush()` を行い、最後に `commit()` する。例外時は `rollback()` する。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-5:1349,1369 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/TruncateWaitingNumberAction.php:36）

■バッチ-B05-03 店頭注文番号初期化
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）削除またはカウンタ初期化の途中で例外が発生した場合は処理が中断する。本バッチは例外捕捉や通知を行わない。例外発生時はコンソールへ例外が伝播する。
　Command 側が `try` / `catch (\Throwable $e)` で action の例外を捕捉し、`$io->error()` でエラーメッセージを出力して `Command::FAILURE` を返す。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-5:1342,1345,1360 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/TruncateWaitingNumberCommand.php:40）

■バッチ-B05-03 店頭注文番号初期化
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）バッチコマンドの起動時に日時付きのコンソール出力を行う。本バッチ独自の件数ログ・完了ログは出力しない。
　起動時は `$io->text('店舗注文番号初期化バッチ開始')` を出力するが日時は含まない。成功時は `$io->success('店舗注文番号初期化処理が完了しました。')` で完了ログを出力する。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-5:1362-1364 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/TruncateWaitingNumberCommand.php:38）

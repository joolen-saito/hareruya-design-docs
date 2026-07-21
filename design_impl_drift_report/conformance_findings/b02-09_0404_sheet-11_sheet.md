■バッチ-B02-09 ユニサーチフィード送信
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）SCPでフィードファイルとdoneファイルをユニサーチのサーバに送信する。入力データ詳細および実行結果詳細では、ユニサーチフィード作成処理で作成したTSVファイル、doneファイルをSCPで送信するとされている。
　実装はTSVをgzip圧縮した .tsv.gz を作成し、phpseclib3\Net\SFTP の put() で gzipファイルとdoneファイルをSFTPアップロードしている。SCPコマンド実行は存在しない。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-11:1837,1844,1848 ／ 実装: src/Eccube/Service/UniSearch/UniSearchExportService.php:87,100,103 / src/Eccube/Service/UniSearch/UniSearchSftpService.php:23,48,66）

■バッチ-B02-09 ユニサーチフィード送信
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）実行トリガーはスケジュール起動(Step Functions)、実行タイミングは5分おき。現行Cron設定は「*/5 * * * * sh -x /home/ec2-user/feed_upload.sh > /home/ec2-user/feed.log 2>&1」。
　src/Eccube/Command/SendUnisearchProductFeedCommand.php:30 に unisearch:batch コマンドは存在するが、5分おきにStep FunctionsまたはCronから起動する設定・定義は指定探索範囲に存在しない。確認お願いします。（設計根拠: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-11:1839,1840,1841 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/html。検索語: feed_upload, feed.log, /home/ec2-user, */5, Step Functions, 5分, schedule, cron, unisearch:batch））

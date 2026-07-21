■バッチ-B08-02 ポイント失効
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）コンソールのバッチコマンドは customer:batch lostPoint で実行する。
　実装の Symfony Console コマンド名は eccube:customer:lost-points。customer:batch lostPoint の AsCommand 名または aliases は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-4:1180 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/LostPointsCommand.php:25）

■バッチ-B08-02 ポイント失効
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）ユーザーの失効ポイントの値をスマレジのポイント増減APIに送信し、失効ポイント分を差し引く。連携が成功しない場合は当該会員をスキップする。
　LostPointsAction は $losePoint を算出するが、postSmaregiPoint() を引数なしで呼び出す。SmaregiCustomerService::postSmaregiPoint は smaregiId/point を受け取れるシグネチャだが、TODO コメントの固定成功レスポンスを返すのみで実API送信を行わない。確認お願いします。（設計根拠: excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-4:1134 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:59, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:31）

■バッチ-B08-02 ポイント失効
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）開始・完了のコンソール出力（日時付き）。
　開始時は「ポイント失効バッチ開始」、完了時は「ポイント失効処理が完了しました。」を出力するが、日時を付与していない。確認お願いします。（設計根拠: excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-4:1210 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/LostPointsCommand.php:38, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/LostPointsCommand.php:51）

■バッチ-B08-02 ポイント失効
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）リクエスト上限に配慮し、会員ごとに短いインターバルを挟む。流量制御のため会員ごとにインターバルを挟む。
　LostPointsAction は foreach で会員ごとに処理するが、会員間の sleep/usleep 等の待機処理はない。確認お願いします。（設計根拠: excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-4:1185 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/LostPointsCommand.php, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php; キーワード: usleep, sleep, interval, インターバル, 流量制御, リクエスト上限））

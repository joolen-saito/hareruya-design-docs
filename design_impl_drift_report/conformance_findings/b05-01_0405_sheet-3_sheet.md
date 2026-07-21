■バッチ-B05-01 注文番号登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）スマレジ商品連携対象は「バッチ起動から30分前以降の注文」とする。
　コマンドは現在時刻から30分前を targetDateTime として渡し、Repository は `o.order_date < :targetDateTime` で30分前より古い注文を対象にしている。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-3:945,984,991 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcOrderSmaregiPostCommand.php:47, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1802）

■バッチ-B05-01 注文番号登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）スマレジ用商品コードは `20 + 1 + スマレジ店舗ID3桁0埋め + 注文番号8桁0埋め後の末尾6桁 + チェックディジット` で採番する。
　親バッチ側で `getProductBarcode('20','1',sprintf('%03d',$smaregiShopId),$orderNumber)` を呼び、`substr($orderNumber, -6)` をそのまま使う。同期サービスは既存 `smaregi_code` がある場合は再生成しない。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-3:950-956 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOtcOrderPostAction.php:58, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOtcOrderPostAction.php:94-98, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:77-80）

■バッチ-B05-01 注文番号登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）スマレジ商品登録APIへ送信する部門IDは `6: 店頭受取（固定）` とする。
　追加システム設定 `smaregi_category_id` から categoryId を取得し、商品登録リクエストの `categoryId` に設定している。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-3:962-963 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOtcSyncMessageHandler.php:96, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOtcSyncMessageHandler.php:153-160, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:250-268）

■バッチ-B05-01 注文番号登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）スマレジ商品登録APIへ送信する商品名は、店頭PCアカウントの場合「店頭注文: 店頭注文番号 のご注文」、通常会員の場合「注文者姓カナ 注文者名カナ 様のご注文」とする。
　商品名は常に `sprintf('店頭受取 %s', Order.orderNumber)` で生成している。店頭PCアカウント/通常会員の分岐や注文者カナの利用はない。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-3:965-967 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:250-259）

■バッチ-B05-01 注文番号登録
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）スマレジ連携APIの実行に失敗した場合はエラーメールを送信し、送信先は追加設定のスマレジ通信エラー送信メールアドレスとする。
　API失敗時は `smaregi_error_flg` を true にして logger/MessengerJob errorMessage に記録するのみで、メール送信処理と送信先設定の参照がない。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-3:972-979,1002-1004 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcOrderSmaregiPostCommand.php, src/Eccube/Service/Smaregi, src/Eccube/MessageHandler/SmaregiOtcSyncMessageHandler.php, src/Eccube/Repository/OrderRepository.php; 検索語: スマレジ通信エラー, 通信エラー送信, エラーメール, smaregi mail, MailService, sendMail, send））

■バッチ-B05-01 注文番号登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）ログ・監査として開始・完了のコンソール出力を日時付きで行う。
　開始時は `店頭受取注文スマレジ連携バッチ開始`、完了時は `店頭受取注文スマレジ連携処理が完了しました。` を出力するが、日時を付与していない。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-3:1095-1096 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcOrderSmaregiPostCommand.php:44, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcOrderSmaregiPostCommand.php:61）

■バッチ-B05-09 スマレジ取引連携エラー再連携
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）スマレジ取引連携エラー再連携は、コンソールのバッチコマンド `smaregi:batch checkSmaregiTransaction` から実行できること。
　`src/Eccube/Command` の AsCommand 一覧には `eccube:smaregi:stock:backfill`、`eccube:smaregi:update-point`、`eccube:smaregi:otc:delete` 等は存在するが、設計コマンド `smaregi:batch checkSmaregiTransaction` または取引再連携バッチ相当のコマンドは存在しない。取引処理の子ジョブハンドラは `src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:101` にあるが、コンソール入口ではない。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-11:2078,2082 ／ 実装: 不在（探索範囲: src/Eccube/Command, src/Eccube/Service, src/Eccube/MessageHandler, src/Eccube/Repository, src/Eccube/Entity, html。検索語: checkSmaregiTransaction / check_smaregi_transaction / check-smaregi-transaction / smaregi:batch / smaregi:transaction / 取引連携エラー / 取引.*再連携））

■バッチ-B05-09 スマレジ取引連携エラー再連携
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）APIでバッチ駆動時間から5時間前まで、または手動実行時に指定された期間内のスマレジ取引データを取得すること。
　`src/Eccube/Service/Smaregi/Api/SmaregiTransactionApiClient.php:99` に取引一覧API `listTransactions()` はあるが、コメントでページング未実装・期間指定クエリ正式名未確定とされている。同メソッドの使用箇所は検索上なく、現在時刻から5時間前または手動指定期間を組み立てるCommand/Serviceも見つからない。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-11:2024,2025,2031,2041,2083,2089 ／ 実装: 不在（探索範囲: src/Eccube/Command, src/Eccube/Service/Smaregi, src/Eccube/MessageHandler, src/Eccube/Repository, html。検索語: listTransactions / transaction_list / pos/transactions / updateDateTime / fromDate / toDate / 5時間 / hours / within / 期間指定））

■バッチ-B05-09 スマレジ取引連携エラー再連携
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）Webhookが失敗した可能性のある取引について、ポイント処理不整合、ECCUBE側にスマレジ取引ID未登録、登録済み取引の返品・キャンセル等による更新日時差異を検知し、スマレジ受信処理(A05-04)と同等の処理が完了した状態にすること。
　Webhook起点の子ジョブ処理は `src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:57` 以降にあり、単一 `transactionHeadId` の取得、`updateDateTime` による重複スキップ、`created/canceled/disposed` の処理分岐は存在する。しかし時間窓で取得した取引一覧から、ECCUBE未登録・更新日時差異・ポイント不整合を検出して子ジョブ化または同等処理へ投入する親バッチが存在しない。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-11:2026,2027,2032-2037,2043,2057,2072,2083,2102 ／ 実装: 不在（探索範囲: src/Eccube/Command, src/Eccube/Service/Smaregi/Webhook, src/Eccube/MessageHandler, src/Eccube/Repository, src/Eccube/Entity, html。検索語: 未連携.*取引 / スマレジ取引ID.*登録されていない / updateDateTime / transaction_update_date_time / canceled / disposed / point inconsistency / transactionHeadId））

■バッチ-B05-09 スマレジ取引連携エラー再連携
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）スマレジ接続設定（接続先URL・契約ID・アクセストークン等）はオプションマスタ `mtb_option` の `option_key`・`option_value` に保持し、API呼び出しに使用すること。
　取引処理ハンドラは `smaregiApiIdUrl`、`smaregiApiUrl`、`smaregiApiClientId`、`smaregiApiClientSecret`、`smaregiApiContractId` をコンストラクタ注入で受け、`SmaregiAccessTokenService::getAccessToken()` と `SmaregiTransactionApiClient::getTransaction()` に渡している。設定値は `app/config/eccube/services.yaml:27` 以降の `%env(SMAREGI_API_...)%` パラメータであり、`mtb_option` から取得していない。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-11:2072,2083,2092,2096 ／ 実装: src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:93,151; app/config/eccube/services.yaml:27）

■バッチ-B05-09 スマレジ取引連携エラー再連携
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）取引情報取得に失敗した場合は、失敗内容をログとコンソールに出力して異常終了（戻り値1）すること。取得結果が空の場合は正常終了すること。
　単一取引取得失敗時は `src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:165` でDTOがない場合に例外を投げ、`src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:133` でジョブ失敗ログと状態保存を行う。これはMessenger子ジョブの失敗処理であり、設計コマンドのコンソール出力・戻り値1・一覧取得結果空時の正常終了を実装するCommand処理は存在しない。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-11:2083,2089,2092,2106 ／ 実装: 不在（探索範囲: src/Eccube/Command, src/Eccube/Service/Smaregi, src/Eccube/MessageHandler, html。検索語: checkSmaregiTransaction / Command::FAILURE / return 1 / 異常終了 / コンソール出力 / listTransactions / 取得結果が空））

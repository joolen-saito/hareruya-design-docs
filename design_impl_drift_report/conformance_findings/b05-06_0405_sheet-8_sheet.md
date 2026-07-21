■バッチ-B05-06 ポイント二重登録チェック
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）コンソールのバッチコマンドは `order:batch checkDuplicatePoint` として実行する。
　実装の Symfony Console コマンド名は `eccube:check-duplicate-point`。`order:batch checkDuplicatePoint` のコマンド定義またはエイリアスは確認できない。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-8:1713,1717 ／ 実装: src/Eccube/Command/CheckDuplicatePointCommand.php:34 / 不在（探索範囲: src/Eccube/Command, src/Eccube, html; 検索語: order:batch, checkDuplicatePoint, eccube:check-duplicate-point））

■バッチ-B05-06 ポイント二重登録チェック
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）ポイント重複は、受注・会員・ポイント履歴の組み合わせで同一目的の付与または利用が複数成立している状態として検出し、`dtb_point_history` の `order_id`・`point_type_id`・`point_change` を二重登録の検知に使用する。
　`findDuplicatePoint()` は `ph.Order` を join し、`ph.pointChange < 0`、直近1日、`groupBy('o.id')` と `addGroupBy('ph.pointChange')`、`COUNT(DISTINCT ph.id) > 1` で判定している。`ph.Customer` や `ph.PointType` / `point_type_id` は検知キーに含めていない。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-8:1724,1736 ／ 実装: src/Eccube/Repository/DtbPointHistoryRepository.php:225）

■バッチ-B05-06 ポイント二重登録チェック
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）通知に用いる注文番号は `dtb_order.order_no` から取得する。
　`OrderUtil::getOrderNumbers()` は受注IDから Order を取得し、通知用の値として `$order->getOrderNumber()` を返す。Entity では `order_no` と `order_number` が別カラムとして存在する。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-8:1706,1736 ／ 実装: src/Eccube/Util/OrderUtil.php:33; src/Eccube/Entity/Order.php:450; src/Eccube/Entity/Order.php:633）

■バッチ-B05-06 ポイント二重登録チェック
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）取得・送信時のエラーはエラーメッセージをコンソールに出力する。
　Command 側は `handle()` から投げられた例外を `io->error()` で出力するが、メール送信時の `TransportExceptionInterface` は `MailService::sendOrderDuplicateNotificationMail()` 内で catch され、`log_critical($e->getMessage())` のみで再throwされない。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-8:1732,1742 ／ 実装: src/Eccube/Command/CheckDuplicatePointCommand.php:50; src/Eccube/Service/MailService.php:2266）

■バッチ-B05-06 ポイント二重登録チェック
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）開始・完了のコンソール出力は日時付きで行う。
　開始時は `ポイント二重登録チェックバッチ開始`、完了時は `ポイント二重登録は検出されませんでした。` または `ポイント二重登録が検出されました。（%d件）` を出力するが、日時は付与していない。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-8:1744,1745 ／ 実装: src/Eccube/Command/CheckDuplicatePointCommand.php:46）

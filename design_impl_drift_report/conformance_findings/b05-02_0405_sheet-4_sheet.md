■バッチ-B05-02 購入完了手続き再処理
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）コンソールのバッチコマンド `order:batch resendMail` で購入完了手続き再処理を実行し、メール未送信の受注についてポイント・在庫を整え、注文完了メールを再送信する。
　`src/Eccube/Command` 配下に B05-02 相当の `order:batch resendMail` / `ResendMailCommand` は存在しない。近接する実装は B05-07 の `eccube:check-not-reflected-point-usage` と、単体の `eccube:smaregi:update-point` のみ。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-4:1204 ／ 実装: 不在（探索範囲: src/Eccube/Command, src/Eccube/Service, src/Eccube/Repository, src/Eccube/Controller, html。検索語: order:batch resendMail / resendMail / ResendMail / 購入完了手続き再処理 / メール未送信受注 / 注文完了メールを再送 / eccube:resend / eccube:order:resend））

■バッチ-B05-02 購入完了手続き再処理
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）注文ステータスが「新規」「入金待ち」「ピック中」、注文完了メール送信履歴なし、注文日時がバッチ起動時間の5分前から1分前までの注文を処理対象として取得する。
　受注完了メール送信履歴は `MailService::sendOrderMail()` で保存されるが、B05-02 用に「送信履歴なし」「注文日時5分前〜1分前」「新規・入金待ち・ピック中」を組み合わせて抽出する実装は見つからない。近接する `OrderRepository::getNotReflectedPointsUsage()` は決済・金額差分・直近1時間を条件にした通知用抽出で、メール未送信受注の抽出ではない。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-4:1136 ／ 実装: 不在（探索範囲: src/Eccube/Repository/OrderRepository.php, src/Eccube/Command, src/Eccube/Service/Admin/Order, src/Eccube/Service。検索語: メール未送信 / MailHistories / MailHistory / dtb_mail_history / 5分前 / 1分前 / getNotReflectedPointsUsage / findTargetOrdersFor））

■バッチ-B05-02 購入完了手続き再処理
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）受注サブに消費ポイントがあり、かつポイント履歴が無い場合は、ポイント履歴を作成し、ポイント残高を減らし、ポイント処理を重複して行わない。移行先では `dtb_order.spended_points` と `dtb_point_history.order_id` を使用する。
　`Order` に `spended_points`、`DtbPointHistory` と `PointHistoryEntityManager` は存在するが、B05-02 の対象受注に対して `spended_points` と `dtb_point_history.order_id` を照合し、未履歴時だけポイント履歴作成・残高減算を行う再処理は見つからない。`CheckNotReflectedPointUsageAction` は対象検出後に通知メールを送るだけで、受注・会員・ポイント履歴を更新しない。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-4:1140 ／ 実装: 不在（探索範囲: src/Eccube/Command, src/Eccube/Service, src/Eccube/Repository, src/Eccube/Entity。検索語: spended_points / getSpendedPoints / DtbPointHistory / dtb_point_history / point_history.order_id / PointHistoryEntityManager / CheckNotReflectedPointUsage））

■バッチ-B05-02 購入完了手続き再処理
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）消費ポイントがある場合は、スマレジポイント連携を別プロセスのコマンドで実行する。
　スマレジポイント連携単体コマンド `eccube:smaregi:update-point` は存在するが、B05-02 の再処理バッチが消費ポイントありの受注ごとに別プロセスとして起動する実装は見つからない。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-4:1211 ／ 実装: src/Eccube/Command/SmaregiUpdatePointCommand.php:26）

■バッチ-B05-02 購入完了手続き再処理
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）受注ごとにトランザクションを開始し、在庫履歴と販売数を更新して確定する。失敗時は当該受注のみ巻き戻し、エラーメッセージを出力して次の受注へ進む。
　通常購入フロー用の在庫履歴処理やメール送信履歴保存は存在するが、B05-02 のメール未送信受注を受注単位トランザクションで処理し、1件失敗時に当該受注だけ rollback して継続するコマンド実装は見つからない。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-4:1210 ／ 実装: 不在（探索範囲: src/Eccube/Command, src/Eccube/Service/PurchaseFlow, src/Eccube/Service/EntityManager, src/Eccube/Repository。検索語: ResendMail / stock_history / StockHistoryEntityManager / sale_count / sales / transaction / beginTransaction / rollback / commit / sendOrderMail））

■バッチ-B05-02 購入完了手続き再処理
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）注文完了メールを再送信する。宛先言語は会員の都道府県が海外なら英語、それ以外は日本語とし、メール送信後に送信履歴を登録する。
　通常の `MailService::sendOrderMail()` は存在し、送信後に履歴を保存する。ただしテンプレート選択は現在ロケールで分岐しており、B05-02 の再送バッチから会員都道府県が海外かどうかで英語/日本語を選ぶ実装は見つからない。確認お願いします。（設計根拠: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-4:1211 ／ 実装: src/Eccube/Service/MailService.php:400）

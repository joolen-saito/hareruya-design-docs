# 付帯表4 バグ候補レジスタ（設計 vs 実装の乖離・裁定用）

> 更新: 2026-07-16 ／ 出典: `integration_test/_poc2_*.md` の付帯表4（69機能）

**目的**: オラクル独立アプローチで検出した設計(Excel/詳細設計)と実装の乖離を、業務側/設計オーナーが裁定するための一覧。
各行は「テスト期待には使っていない」実装事実の記録＝**バグか設計陳腐化かをここで確定**する。

**裁定の記入欄**（最右列）: `実バグ(実装修正)` / `設計修正(Excel誤り)` / `詳細設計修正` / `仕様どおり(対応不要)` / `保留` を記入。

## サマリ

- 付帯表4 総行数 **430**（69機能）。うち **一致(非バグ)=55** は実装が設計どおりの検証済み（裁定不要）。
- **要裁定 = 289件**

| 分類 | 優先 | 件数 | 説明 |
|---|---|---|---|
| 移行退行疑い | P1 | 39 | pf-eccube3→enterprise移行で挙動が変わった疑い（最重要） |
| 未実装疑い | P1 | 53 | 設計にあるが実装に無い疑い |
| 設計誤り疑い | P1 | 18 | 詳細設計/Excelのハルシネーション・不正確 |
| バグ候補 | P1 | 13 | 実装が仕様違反の疑い |
| 乖離 | P2 | 166 | 設計と実装の一般的な食い違い |
| その他 | P2 | 55 | 判定文が定型外 |
| 要実機確認 | P3 | 31 | オラクル沈黙・実機で確定 |
| 一致(非バグ) | — | 55 | 実装が設計どおり（裁定不要） |

## §1. 最優先バグ候補（移行退行・未実装・設計誤り・バグ候補＝P1）

（123件）

| 機能 | 区分 | 分類 | 乖離内容（設計→実装） | file:line | 対象RG | 裁定 |
|---|---|---|---|---|---|---|
| a01-02 | 新規実装 | 未実装疑い | 取得対象は「取引更新時間が バッチ駆動時間X 〜 X-Y hours(初期5h) の間」の時間窓（0501:L1498,L1517）。取得期間Yは可変（0501:L1503） | `src/Eccube/Command/SmaregiStockBackfillCommand.php:44, src/Eccube/Service/Smaregi/Stock/SmaregiStockBackfillAction.php:6` | RG-002 |  |
| a02-05 | 現行踏襲 | 設計誤り疑い | 参照系につき副作用なし・DB更新なし（詳細 L366「無し（参照のみ）」・L388「本APIは参照のみ」・L372「本APIはデータを更新しない」） | `src/Eccube/Controller/App/ProductController.php:232, ProductRepository.php:2194` | RG-013,016,017 |  |
| a05-01 | カスタマイズ | 未実装疑い | 印刷情報送信の入口を `GET /order/prints/{店舗ID}` へ変更しステータス更新API(A05-02)とエンドポイントを分離。ConnectionType分岐を廃止（Excel 0505:L970,L9 | `config/routes.yaml:73, src/Controller/Admin/OrderController.php:33` | RG-001,012,023 |  |
| a05-01 | カスタマイズ | 未実装疑い | URL引数の店舗ID(shop_id)で当該店舗の未印刷注文のみ抽出（Excel 0505:L992,L995） | `src/Repository/DtbOrderRepository.php:21` | RG-002 |  |
| a05-01 | カスタマイズ | 未実装疑い | バーコード未印刷不具合防止のためXML化前にスマレジ商品コード存在チェックし、無い場合は何もしない（Excel 0505:L993,L994） | `src/Controller/Admin/OrderController.php:73, OrderController.php:203` | RG-004 |  |
| a05-01 | カスタマイズ | 未実装疑い | 店舗IDが無い/整数以外の型/存在しない店舗IDは404（支店処理踏襲）（Excel 0505:L1017） | `src/Controller/Admin/OrderController.php:31` | RG-012 |  |
| a05-01 | カスタマイズ | 設計誤り疑い | 詳細設計 DB操作節（正本 L396）は「本機能は参照系でDBへの登録・更新・削除は行わない」と記す | `src/Controller/Admin/OrderController.php:120` | RG-015,021 |  |
| a05-01 | カスタマイズ | 設計誤り疑い | 詳細設計 業務ルール節（正本 L336）は「応答値…保存結果または取得結果をJSON応答へ整形する」と記す | `src/Controller/Admin/OrderController.php:54` | RG-013 |  |
| a05-01 | カスタマイズ | バグ候補 | 印刷対象抽出条件は「店頭受取かつ注文受領」または「スムーズ店頭受取かつ所定条件」または「ブラウザ印刷フラグ立ち」で、注文番号ありを必須とする（正本 L331,L394） | `src/Repository/DtbOrderRepository.php:21` | RG-001,004,011 |  |
| a05-02 | カスタマイズ | 未実装疑い | A05-02はPOST `/order/prints/status/printed` でA05-01とエンドポイントを分ける（本店/支店プリンタのURL設定変更が必要。一次根拠=エンドポイントURL値 Excel 050 | `config/routes.yaml:73, OrderController.php:33` | RG-012 |  |
| a05-02 | カスタマイズ | 未実装疑い | 認証方式は IP制限（認証有。Excel 0505:L1267） | `OrderController.php:31` | RG-011 |  |
| a05-02 | カスタマイズ | 未実装疑い | ★プリンタ側でエラーがあった場合、印刷結果XMLに返るエラーコードをログに追記する（Excel 0505:L1273,L1278。現行は印刷結果の詳細を参照してエラーの有無を確認していない＝Excel 0505:L127 | `OrderController.php:91` | RG-004 |  |
| a05-04 | カスタマイズ | 未実装疑い | Webhookの仕様を廃止予定のスマレジAPIからプラットフォームAPIへ変更し、Webhook返値が取引IDのみになるので別途APIを叩いて取引詳細を取得する（Excel 0505:L1660,L1661） | `app/Plugin/HareruyaEc/Controller/SmaregiController.php:28` | RG-011 |  |
| a05-04 | カスタマイズ | 未実装疑い | 本店側でwebhookを受けて支店へAPIで送っている処理を廃止し、webhook受信のみで本支店データ連携を実行する（本支店統合。Excel 0505:L1662,L1663） | `SmaregiController.php:66` | RG-010,012 |  |
| a05-04 | カスタマイズ | 未実装疑い | ★3 スマレジ取引詳細をECCUBEに登録＝スムーズ店頭受取以外は新規受注を出荷完了で作成、既存受注は受取方法により出荷完了/引き渡し済みに分岐、ついで買いは受注を新規作成し既存へ移行先受注IDを登録、会員状態（非会員含 | `SmaregiController.php:66` | RG-004,006,007,008,009 |  |
| a05-04 | カスタマイズ | 未実装疑い | 認証方式は IP制限（Excel 0505:L1658） | `SmaregiController.php:26` | RG-016 |  |
| a06-01 | 現行踏襲 | 移行退行疑い | 現行踏襲。応答JSON構築（memberName等）と店舗紐付けは中継先が担い、移行先はDBを ec-cube-enterprise・会員サブ dtb_member_sub 廃止で base_info_id/member | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Api/AdminLoginController.php:12` | RG-002 |  |
| a06-02 | カスタマイズ | 設計誤り疑い | 詳細設計 L389,L390「DB操作 … 検索 dtb_member / dtb_member_sub」＝検索対象テーブルを dtb_member / dtb_member_sub と記載 | `src/Repository/DtbOtcBuyOrderRepository.php:56, src/Controller/Admin/OtcBuyOrderController.php:35` | RG-020 |  |
| a06-03 | カスタマイズ | 未実装疑い | 経理払い出し待ち(7)ステータスにした際、経理チームのメールアドレスへ件名「店頭買取振込依頼 【査定ID: XXXXX】」の振込依頼メールを送信する（Excel 0506:L1485,L1512-1517） | `src/Controller/Admin/OtcBuyOrderController.php:58` | RG-021,022 |  |
| a06-03 | カスタマイズ | 未実装疑い | 買取成立(1)に変更された場合、個別入力商品ありなら受注ステータスを「未登録在庫あり」、なしなら「入庫待ち」に変更する（Excel 0506:L1486,L1487,L1518-1520） | `OtcBuyOrderController.php:199` | RG-023,024 |  |
| a06-03 | カスタマイズ | 未実装疑い | 端末取引ID(smaregi_transaction_id)をECCUBEに連携する（Excel 0506:L1488,L1521,L1534） | `src/Entity/Api/OtcBuyOrderEdit.php:11, OtcBuyOrderController.php:116` | RG-025 |  |
| a06-03 | カスタマイズ | 未実装疑い | 店頭買取実在庫登録時、買取価格と買取小計（買取価格×買取個数）を新たに登録する（Excel 0506:L1489,L1522-1523） | `OtcBuyOrderController.php:181, src/Entity/DtbOtcBuyOrderStock.php:17` | RG-011,026 |  |
| a06-03 | カスタマイズ | 未実装疑い | 登録情報に⑤-8出金コードを含む（Excel 0506:L1510） | `OtcBuyOrderController.php:199` | RG-033 |  |
| a06-16 | 新規実装 | 設計誤り疑い | リクエスト項目名: Excel `member_id`（0506:L3842,L3869）。詳細設計HTMLは移行先ボディを `doubleCheckMemberId` と記載（正本 L314） | `OtcBuyOrderController.php:239` | RG-004,005 |  |
| a07-02 | 現行踏襲 | 設計誤り疑い | 応答フィールド型：Excel 0507:L1145 netBuyOrderId／0507:L1149 netOrderStatusId は 文字列。詳細設計 L339 は integer と記す（オラクル間矛盾） | `src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:72` | RG-010,023 |  |
| a07-02 | 現行踏襲 | 設計誤り疑い | applyDate 形式：Excelサンプル 0507:L1171 は「2024/03/06 17:21:23」＝`Y/m/d H:i:s`。詳細設計 L339/L362 は ISO8601 と記す（矛盾） | `BuyOrderController.php:73` | RG-023 |  |
| a07-02 | 現行踏襲 | 移行退行疑い | 住所連結：詳細設計 L331／現行 pf-api は「都道府県名・住所1・住所2 を半角空白連結」。現行 `pf-api:src/Repository/DtbBuyOrderRepository.php:55` は `C | `BuyOrderController.php:65` | RG-004 |  |
| a17-03 | 現行踏襲 | バグ候補 | Excel 0517:L1817「下記の項目がなければエラー404を返す」／L1854「404 必須項目にデータがない場合」＝404 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Api/PointGranterController.php:27, ec-cube-enterprise/src/Eccube/Controller/` |  |  |
| a17-03 | 現行踏襲 | 設計誤り疑い | 詳細設計 L312/L359「会員ポイント残高 = dtb_customer.point」 | `PointGranterController.php:50, PointGranterAction.php:66, DtbPlayer.php:89` |  |  |
| a17-03 | 現行踏襲 | バグ候補 | Excel/詳細設計は `X_contract_id`／`X_access_token`（アンダースコア表記・0517:L1818/L1819・正本 L335） | `PointGranterController.php:26, PointGranterController.php:47` |  |  |
| a17-03 | 現行踏襲 | バグ候補 | 詳細設計 L351「値そのものの形式検証はスマレジ取引APIの判定に委ねる」（本APIは構造検証を規定せず） | `PointGranterController.php:45, PointGranterController.php:82` |  |  |
| a17-03 | 現行踏襲 | 移行退行疑い | 正本 L361「承認ワークフローを介さず persist/flush で直接確定」／L375「楽観・悲観ロックは持たない」 | `PointGranterController.php:59, PointGranterAction.php:57` |  |  |
| b02-07 | カスタマイズ | 移行退行疑い | 起動コマンドは `product:batch exportWeeklyStockHistoryCsv`（詳細設計 入口 L312,処理フロー L316） | `app/Plugin/HareruyaEc/Command/ProductBatch.php:17, src/Eccube/Command/UpdateWeeklyStockHistoryCommand.php:35` | RG-001,012 |  |
| b02-07 | カスタマイズ | 未実装疑い | ECCUBEとスマレジの在庫を合算して週間在庫履歴テーブルに登録する（Excel 0402:L1394,L1395） | `src/Eccube/Service/Product/BatchUpdateWeeklyStockHistoryAction.php:41, DtbWeeklyStockHistoryTempRepository.php:69` | RG-003,018 |  |
| b02-07 | カスタマイズ | 移行退行疑い | 各週は「当日−i週 以前で作成日が最も新しい在庫変動履歴」の在庫を採る（詳細設計 集計条件 L323／Excel 0402:L1379） | `app/Plugin/HareruyaEc/Repository/DtbStockHistoryRepository.php:227, src/Eccube/Repository/DtbWeeklyStockHistoryTempRepos` | RG-002(DW-01,02) |  |
| b05-01 | 現行踏襲 | 移行退行疑い | 詳細設計は入口コマンド `order:batch copyOrderNumber`（正本 L311,L312）。Excel はバッチ名称を「店頭受取注文商品スマレジ連携バッチ」に変更（0405:L1019） | `src/Eccube/Command/OtcOrderSmaregiPostCommand.php:25, app/Plugin/HareruyaEc/Command/OrderBatch.php:13` | RG-001,009 |  |
| b05-02 | 現行踏襲 | 移行退行疑い | 注文の更新時にエラーが発生した場合はロールバックを行い、当該受注のトランザクションを巻き戻す（Excel 0405:L1257／詳細設計L318,L341） | `pf-eccube3/app/Plugin/HareruyaEc/Service/Order/ResendMail.php:50, ec-cube-enterprise/src/Eccube/Service/Admin/Order/Rese` | RG-017,022 |  |
| b05-02 | 現行踏襲 | 移行退行疑い | 注文日時が「バッチ起動時間の5分前から1分前まで」（Excel 0405:L1223,L1246）＝起動時刻と同じ時間軸で判定 | `pf-eccube3/app/Plugin/HareruyaEc/Repository/OrderRepository.php:1445, ec-cube-enterprise/src/Eccube/Repository/OrderRepo` | RG-004(DV-07〜09) |  |
| b05-04 | 現行踏襲 | 移行退行疑い | スマレジ連携APIはプラットフォームAPIに変更する（呼び出しを廃止予定のスマレジAPIからプラットフォームAPIへ）（Excel カスタマイズ 0405:L1481,L1508,L1511） | `app/Plugin/HareruyaEc/Service/SmaregiService.php:63` | RG-001,002,011 |  |
| b05-05 | 現行踏襲 | 移行退行疑い | 起動コマンドは `order:batch deleteSmaregiProduct`（詳細設計 L311,L315／現行踏襲） | `app/Plugin/HareruyaEc/Command/OrderBatch.php:17, src/Eccube/Command/SmaregiOtcDeleteCommand.php:39` | RG-012,013 |  |
| b05-05 | 現行踏襲 | 移行退行疑い | 抽出する注文ステータスは「キャンセル」もしくは「引き渡し済み」（0405:L1629,L1639）。※検索条件表 0405:L1644 は「出荷完了」と表記が割れる（Excel 内不整合） | `app/Plugin/HareruyaEc/Repository/DtbOrderSubRepository.php:170, app/Plugin/HareruyaEc/Entity/OrderStatus.php:12, src/Ecc` | RG-004,005,006 / DP-03 |  |
| b05-05 | 現行踏襲 | 移行退行疑い | 連携に失敗した場合はスマレジ通信エラーメールを管理者に送信（0405:L1632,L1649） | `app/Plugin/HareruyaEc/Service/SmaregiService.php:53, src/Eccube/Service/Smaregi/Otc/SmaregiOtcDeleteService.php:70, src/` | RG-015,016 |  |
| b05-06 | 現行踏襲 | 移行退行疑い | 起動コマンドは `order:batch checkDuplicatePoint`（詳細設計 入口 L314,処理フロー L318） | `app/Plugin/HareruyaEc/Command/OrderBatch.php:28, src/Eccube/Command/CheckDuplicatePointCommand.php:34` | RG-009,011 |  |
| b05-06 | 現行踏襲 | 移行退行疑い | エラーハンドリングは特になし（外部連携も外部引数受領も無いため）（Excel 0405:L1763） | `app/Plugin/HareruyaEc/Service/Order/CheckDuplicatePoint.php:30, src/Eccube/Command/CheckDuplicatePointCommand.php:48` | RG-008 |  |
| b05-07 | 現行踏襲 | 移行退行疑い | 入口コマンドは `order:batch checkNotReflectedPointUsage`／コマンド名が一致しない場合は処理を行わずに終了する（正本 L314,L315） | `app/Plugin/HareruyaEc/Command/OrderBatch.php:19, src/Eccube/Command/CheckNotReflectedPointUsageCommand.php:34` |  |  |
| b05-07 | 現行踏襲 | 移行退行疑い | 抽出した注文IDをリストにして管理者へ送信（Excel 0405:L1890「注文IDのリストにして」） | `app/Plugin/HareruyaEc/Service/MailService.php:1531, src/Eccube/Service/MailService.php:2291` |  |  |
| b05-07 | 現行踏襲 | 設計誤り疑い | 詳細設計 L307：移行先 enterprise の抽出は `dtb_order` の `payment_id`・`payment_method`・`order_date`・`spended_points`・`point | `src/Eccube/Repository/OrderRepository.php:1934` |  |  |
| b05-07 | 現行踏襲 | 未実装疑い | 開始・完了のコンソール出力（日時付き）（正本 L346） | `OrderBatch.php:44, MailService.php:1525, CheckNotReflectedPointUsageCommand.php:52` |  |  |
| b05-07 | 現行踏襲 | 未実装疑い | 取得・送信時のエラーはエラーメッセージをコンソールに出力する（正本 L343） | `Service/Order/CheckNotReflectedPointUsage.php:24, OrderBatch.php:51, CheckNotReflectedPointUsageCommand.php:54` |  |  |
| b05-08 | 現行踏襲 | 移行退行疑い | スマレジ連携APIについて、呼び出しを廃止予定のスマレジAPIからプラットフォームAPIに変更（Excel 0405:L1990 カスタマイズ★） | `—` | RG-007,008 |  |
| b05-09 | 現行踏襲 | 未実装疑い | キャンセルの場合は対象の受注データをキャンセルにする（Excel 0405:L2122・L2121） | `CheckSmaregiTransaction.php:166` | RG-010 |  |
| b05-09 | 現行踏襲 | 未実装疑い | 手動でのバッチ実行時に期間指定があればその期間内の取引データを取得する（Excel 0405:L2109,L2115） | `CheckSmaregiTransaction.php:136, app/Plugin/HareruyaEc/config.yml:283` | RG-004 |  |
| b08-02 | 現行踏襲 | 移行退行疑い | 失効履歴の「有効期限＝本日+183日」（Excel L1225）。本コードベースの有効期限は issue_date + customer_point_expire(183)日で派生（`pf-eccube3:app/Plu | `app/Plugin/HareruyaEc/Service/Customer/LostPoints.php:56, src/Eccube/Service/Admin/Customer/LostPointsAction.php:78` | RG-007 |  |
| b08-02 | 現行踏襲 | 移行退行疑い | スマレジ連携が成功した会員のみ保有ポイントを更新する（連携成功を更新の前提とする＝Excel L1219→L1220 の順序／詳細設計L336） | `LostPoints.php:45, LostPointsAction.php:68` | RG-006,009 |  |
| b08-02 | 現行踏襲 | 移行退行疑い | 起動コマンドは `customer:batch lostPoint`（詳細設計L312） | `app/Plugin/HareruyaEc/Command/CustomerBatch.php:14, src/Eccube/Command/LostPointsCommand.php:25` | RG-011,012 |  |
| b08-03 | 現行踏襲 | 移行退行疑い | 実行コマンドは `customer:batch pointExpireNotification`（詳細設計 L313,L317。挙動参照=現行 L305） | `app/Plugin/HareruyaEc/Command/CustomerBatch.php:16, src/Eccube/Command/PointExpireNotificationCommand.php:25` | RG-001,012 |  |
| b08-03 | 現行踏襲 | 移行退行疑い | 開始・完了はコンソールに日時付きで出力（詳細設計 L347） | `...CustomerBatch.php:50, ...PointExpireNotificationCommand.php:38` | RG-013 |  |
| b08-05 | 現行踏襲 | 設計誤り疑い | 補正は保有ポイント（`dtb_player.point`）を履歴合計へ上書き（Excel 0408:L1586,L1607） | `AdjustPointVariance.php:35, src/Eccube/Service/Admin/Customer/AdjustPointVarianceAction.php:54, AdjustPointVariance.php:` | RG-016 |  |
| b08-05 | 現行踏襲 | 移行退行疑い | 起動コマンドは現行踏襲＝`customer:batch adjustPointVariance`（詳細設計 L313） | `app/Plugin/HareruyaEc/Command/CustomerBatch.php:26, src/Eccube/Command/AdjustPointVarianceCommand.php:25` | RG-012,013 |  |
| b08-05 | 現行踏襲 | 未実装疑い | 取得・送信時のエラーはエラーメッセージをコンソールに出力（詳細設計 L343）。Excel 0408:L1621-1622 は「エラーハンドリング 該当処理なし」 | `AdjustPointVarianceAction.php:67, AdjustPointVarianceCommand.php:42, AdjustPointVariance.php:30` | RG-014 |  |
| b08-05 | 現行踏襲 | 移行退行疑い | 通知メール宛先は mtb_option の設定値（Excel 0408:L1615,L1616・カンマ区切りで複数指定しうる） | `MailService.php:1594, MailService.php:1355` | RG-005 |  |
| b08-06 | 現行踏襲 | 移行退行疑い | 実行コマンドは `smaregi:batch updatePoint <受注ID>`（正本 L312,L316／現行踏襲） | `src/Eccube/Command/SmaregiUpdatePointCommand.php:26, app/Plugin/HareruyaEc/Command/SmaregiBatch.php:15` | RG-013,RG-014 |  |
| b08-06 | 現行踏襲 | 移行退行疑い | 連携量＝受注の消費ポイントを負の値で送信（Excel `0408:L1732`／正本 L320）。消費ポイント0のスキップは未規定 | `SmaregiUpdatePointAction.php:39, UpdatePoint.php:40` | RG-002,DV-04 |  |
| b08-06 | 現行踏襲 | 移行退行疑い | 受注IDが未指定または数値でない場合は「処理を終了する」（同列扱い・正常系の終了）（正本 L313,L317／Excel `0408:L1755`,`0408:L1756`） | `UpdatePoint.php:32, SmaregiBatch.php:52, SmaregiUpdatePointCommand.php:53` | RG-006 |  |
| b17-01 | 現行踏襲 | バグ候補 | 取得失敗時はエラー内容をコンソールに出力する（L251）。データ整合性上、jsonファイルは実行時点の最新20件で上書きされフロント表示が参照する（L248）＝有効な記事内容を保つべき。取得失敗後の書込み可否は詳細設計が | `app/Plugin/HareruyaEc/Service/ListText/CreateLatestArticleList.php:36, AbstractListText.php:30` | RG-007 |  |
| b17-01 | 現行踏襲 | 移行退行疑い | 同上（取得失敗時の扱い・L251/L248） | `src/Eccube/Service/CreateLatestArticleListAction.php:38, CreateLatestArticleListCommand.php:48` | RG-007,011 |  |
| b17-01 | 現行踏襲 | バグ候補 | 取得失敗（記事が取得できない状態）はエラーとして扱われるべき（L251）。HTTP異常応答も「取得失敗」に含みうる | `CreateLatestArticleList.php:36` | RG-007 |  |
| f04-04 | 現行踏襲 | 未実装疑い | ★店内アカウントの場合、画面表示から1分後に注文した店舗のTOP画面へ自動遷移（Excel 0304:L2566） | `app/Plugin/HareruyaEc/Resource/template/default/Shopping/complete.twig:1, src/Eccube/Resource/template/default/Shopping/` | RG-026 |  |
| f04-04 | 現行踏襲 | 未実装疑い | ★フリースペースを追加し、ブロック管理から文章設定できるようにする（Excel 0304:L2564,L2565,L2577） | `app/Plugin/HareruyaEc/Resource/template/default/Shopping/complete.twig:18, src/Eccube/Resource/template/default/Shopping` | RG-027 |  |
| f06-01 | カスタマイズ | 移行退行疑い | 海外住所表示時に海外住所用3カラム目（住所3）を表示し会員情報に登録する（Excel カスタマイズ要件 0306:L1103,L1104,L1171） | `app/Plugin/HareruyaEc/Controller/EntryController.php:117` | RG-026 |  |
| f06-02 | 現行踏襲 | 未実装疑い | 本会員化成功かつ商品検索の戻り先ありは、セッションの戻り先URLを取得・消去し直前の商品検索画面へリダイレクトする（詳細設計 L378,L380,L392「商品検索の戻り先があれば取得・消去しそこへリダイレクト」・現行踏 | `EntryController.php:234, EntryController.php:264` | RG-015 |  |
| f06-10 | カスタマイズ | 未実装疑い | 件数表示は「（開始）~（終了）件 ／ （総件数）件あります」（Excel `0306:L3590,L3591` 識別ID7表示範囲/ID8件数／正本 L348） | `...Mypage/point_history.twig:62, src/Eccube/Resource/locale/messages.ja.yaml:826` | RG-014 |  |
| f06-18 | カスタマイズ | 移行退行疑い | スマレジ連携失敗時は更新を確定せずエラーを表示して再描画する＝失敗が更新確定の妨げになる（詳細設計L357「失敗時はDBを変更しない」・L360「成功時のみ更新を確定」・L383。移行節は「現行挙動を正とする」と明記） | `app/Plugin/HareruyaEc/Controller/Mypage/ChangeController.php:161, src/Eccube/Controller/Front/Mypage/ChangeController.ph` | RG-017 |  |
| f06-21 | 現行踏襲 | 移行退行疑い | 支店システムへの会員情報連携はカスタマイズで行わない（Excel 0306:L6156,L6166「支店側に会員情報の連携を行っていたが、処理を行わないようにする」）。詳細設計L342/L364は「支店システムへ更新通知 | `app/Plugin/HareruyaEc/Controller/Mypage/WithdrawController.php:100, src/Eccube/Controller/Front/Mypage/WithdrawControlle` | RG-008,037 |  |
| f06-21 | 現行踏襲 | 移行退行疑い | 退会成立時に選手情報（dtb_player）を削除し、会員論理削除と同一トランザクションで確定する（詳細設計L342,L364,L375。移行後の削除方式は要確認と明記） | `WithdrawController.php:88, WithdrawController.php:90` | RG-006,027 |  |
| f06-21 | 現行踏襲 | 移行退行疑い | スマレジ連携失敗時のエラーは「退会確認画面上部のエラー枠」に「退会処理の途中でエラーが発生しました。」をフラッシュ（eccube.front.error）として表示する（詳細設計L352,L354・Excel 0306: | `WithdrawController.php:78, WithdrawController.php:112, src/Eccube/Resource/locale/messages.ja.yaml:734` | RG-013 |  |
| f06-21 | 現行踏襲 | 未実装疑い | パスワードは「半角・最大文字数32・必須◯」（Excel 0306:L6131）。詳細設計L359/L381は「フォーム定義上は任意（required=false）・フォーム上限なし」と矛盾 | `src/Eccube/Form/Type/Front/WithdrawType.php:37, WithdrawController.php:96, WithdrawController.php:28` | RG-023,024（DV-04） |  |
| m03-08 | カスタマイズ | 設計誤り疑い | 在庫数は本店のECCUBE在庫＋スマレジ在庫を表示する（Excel 0204:L5194）。※詳細設計 正本 L320 は「stock_unlimited が真なら無制限、偽なら（規格自身の）在庫数を表示」と規格単体の在 | `src/Eccube/Controller/Admin/Product/ProductClassController.php:88, src/Eccube/Repository/ProductStockRepository.php:561,` | RG-006,011(DD-02) |  |
| m03-18 | カスタマイズ | 設計誤り疑い | CSRF不正時は HTTP403（詳細設計 L376「CSRF 不正 HTTP 403」・L354「CSRF 失敗は 403」） | `SectionController.php:100, SectionController.php:137, src/Eccube/Controller/AbstractController.php:252` | RG-025 |  |
| m03-20 | カスタマイズ | 未実装疑い | CSVアップロードを実行し、部門登録および部門更新のタイミングでスマレジへ部門情報連携APIを呼び出す（Excel 0204:L7965-7967） | `src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1079, src/Eccube/Service/Csv/Importer/Event/SectionMaste` | RG-013 |  |
| m03-20 | カスタマイズ | バグ候補 | 免税区分は 0対象外・1一般品・2消耗品のみ登録可能とする（Excel 0204:L7970） | `CsvImportController.php:1167, SectionMasterImportHandler.php:57` | RG-010,027(DV-06) |  |
| m03-20 | カスタマイズ | バグ候補 | 部門CSV登録でデータ行が 0 なら形式エラー `admin.common.csv_invalid_format` を積む（正本 L340④「失敗時は csv_invalid_format。…データ行が 0 なら同様」） | `src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1126` | RG-017 |  |
| m03-26 | カスタマイズ | 未実装疑い | CSVアップロードボタン押下後に確認モーダルを表示する（Excel 0204:L2539） | `src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:30` | RG-004 |  |
| m03-26 | カスタマイズ | 未実装疑い | 商品公開ステータスを「廃止」に変更する場合、EC-CUBE・スマレジどちらの在庫も確認し1件以上でエラー（Excel 0204:L2480） | `src/Eccube/Service/Csv/Importer/Validator/AbolishedStatusStockValidator.php:75` | RG-014 |  |
| m03-27 | カスタマイズ | 未実装疑い | スマレジ連携フラグを手動で立てた規格のみ連携し、無効→有効変更時は連携キューを作成（Excel 0204:L3199,L3201） | `.../ProductGoodsImportHandler.php:616` | RG-015 |  |
| m03-27 | カスタマイズ | 未実装疑い | 商品公開ステータスを「廃止」とする場合、EC-CUBE・スマレジ「どちらの在庫も」確認し1件以上ならエラー（Excel 0204:L3185） | `src/Eccube/Service/Csv/Importer/Validator/AbolishedStatusStockValidator.php:75` | RG-005 |  |
| m03-27 | カスタマイズ | 未実装疑い | 基準価格の誤入力チェック: 原価(単価)の想定外の金額を登録しようとした場合エラー扱い（Excel 0204:L3189,L3190） | `.../ProductGoodsImportHandler.php:114` | RG-035（§5 数値バリデーション） |  |
| m03-27 | カスタマイズ | 未実装疑い | CSVアップロードボタン押下後に確認モーダルを表示する（Excel 0204:L3242 画面構成 識別ID2） | `src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:29, app/Plugin/HareruyaEc/Resource/template/admin/Produc` | RG-033（§5 画面遷移） |  |
| m03-30 | カスタマイズ | 未実装疑い | カスタマイズにより「価格変更」に「基準」を追加し「基準価格変更」へ改名、CSV列3「販売価格」を「基準価格」へ改名（Excel `0204:L9585,L10011`） | `src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php:100, ProductPriceCsvController.php:198, ProductPri` | RG-014,015 |  |
| m03-30 | カスタマイズ | 未実装疑い | セール区分いずれでも基準価格を CSV 基準価格へ更新する（Excel `0204:L10046,L10051`）。備考「基準価格から販売価格を上書き」（`0204:L10035`） | `ProductPriceImportHandler.php:372` | RG-001,002,006 |  |
| m03-33 | カスタマイズ | 未実装疑い | 全セール分岐で買取価格をCSV買取価格へ更新し dtb_product_class.buy_price に書き込む（Excel 0204:L11695,L11701,L11708,L11716・詳細設計 決定順序表 L3 | `src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:180, src/Eccube/Service/Csv/Importer/Event` | RG-006,014,016 |  |
| m03-33 | カスタマイズ | 未実装疑い | ★カスタマイズ: 識別ID:3 CSVフォーマットに「スマレジ連携フラグ」を追加し smaregi_alignment_flg へ反映、スマレジ連携コーディネータへ規格ID・スマレジフラグ・スマレジ商品コードを渡し予約（ | `ProductSaleHighPriceCsvController.php:180, SaleHighPriceImportHandler.php:51, ProductClassRepository.php:2590, SaleHighP` | RG-007,014 |  |
| m04-09 | 新規実装 | 未実装疑い | 振替点数が現在の最新の在庫よりも多い場合はエラー（Excel 0202:L6381） | `src/Eccube/Service/Admin/Stock/StockTransferStoreAction.php:82, src/Eccube/Form/Type/Admin/StockTransferNewDetailType.ph` | RG-026 |  |
| m04-09 | 新規実装 | 未実装疑い | 振替対象の商品と振替後商品コードが同一の場合はエラー（Excel 0202:L6383） | `StockTransferStoreAction.php:78` | RG-027 |  |
| m04-10 | 新規実装 | 未実装疑い | 出庫日＝移動は「移動中」/振替は「出庫承認済み」になった日時、入庫日＝「入庫完了」になった日時を出力（0202:L7066,L7067）。CSVは `getMoveFromStockAt()`／`getMoveToSto | `src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:171, src/Eccube/Entity/DtbStockMoveTransfer.ph` | RG-020,021 |  |
| m04-12 | 新規実装 | 未実装疑い | 表示件数(4-4・初期値10件・EC-CUBE標準の表示件数選択肢)とページング(5-13・選択ページへ遷移)を持つ（Excel 0202:L7463, L7477） | `src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:131, src/Eccube/Repository/DtbStockSplitJoinRepository.ph` | RG-015,016 |  |
| m04-14 | 新規実装 | バグ候補 | 列7「分割元・結合先商品の基準価格の合計」と列9「分割先・結合元商品の基準価格の合計」はいずれも "基準価格の合計"（Excel 0202:L9671,L9673）＝同種の集計で丸め方針は一貫すべき | `src/Eccube/Service/Csv/Exporter/StockSplitJoinCsvExportService.php:120` | RG-008,010,026 |  |
| m04-14 | 新規実装 | バグ候補 | 「検索結果のデータを取得しCSV出力する」＝一覧の検索結果と出力内容が一致すべき（Excel 0202:L9684） | `src/Eccube/Service/Admin/Stock/StockSplitJoinIndexAction.php:44, src/Eccube/Controller/Admin/Stock/StockSplitJoinControl` | RG-015,022 |  |
| m04-20 | 新規実装 | 未実装疑い | CSV列5＝「Foil」を出力（Excel 0202:L11100） | `StockHistoryDisposalCsv.php:104` | RG-001,007 |  |
| m04-22 | 新規実装 | 未実装疑い | 振替元商品と振替先商品がまったく同一の行が複数あった場合はエラー（Excel `0202:L12129`） | `src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:153` | RG-025 |  |
| m04-23 | 新規実装 | バグ候補 | 分割CSVの 分割数 は値域 0~999999999（下限0）、分割在庫数は値域 0~999999999（下限0）＝下限0はオラクル(Excel)上の有効境界（Excel 0202:L12502,0202:L12504） | `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitListCsvImportHandler.php:149` | RG-022B(DV-08,09),037B |  |
| m04-30 | 新規実装 | 未実装疑い | 価格変更発生期間は最大で1か月間を選択可能（Excel 0202:L14658）＝1か月超はエラー | `src/Eccube/Form/Type/Admin/BarcodeReplacementListType.php:77` | RG-006,022(DV-06) |  |
| m05-11 | カスタマイズ | 未実装疑い | 受注の新規登録は行えないようにする（Excel 0203:L4633、概要「※新規登録機能は廃止」L4563） | `src/Eccube/Controller/Admin/Order/EditController.php:146` | RG-006 |  |
| m05-11 | カスタマイズ | 未実装疑い | ログインメンバーの編集可能店舗に紐づく受注のみ編集可、権限外ユーザが登録押下でエラー（Excel 0203:L4661,L4678） | `—` | RG-004,008 |  |
| m05-11 | カスタマイズ | 未実装疑い | スマレジ取引の場合は編集不可（編集が必要ならスマレジ側で編集）（Excel 0203:L4662,L4638） | `—` | RG-005 |  |
| m05-11 | カスタマイズ | 未実装疑い | 受注データに対する変更が発生した場合に履歴として保持し、受注情報編集画面で手動変更された場合のみ登録する（Excel 0203:L4640,L5257） | `—` | RG-032,033 |  |
| m07-08 | 新規実装 | バグ候補 | CSV出力の副作用（状態更新）は Excel M07-08 に記載なし（沈黙） | `src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php:78, src/Eccube/Service/Admin/Purchase/BuyOrderRe` | RG-016 |  |
| m07-08 | 新規実装 | バグ候補 | 出力と状態更新の原子性は Excel M07-08 に記載なし（沈黙） | `BuyOrderRestockListCsvExportService.php:60, BuyOrderRestockListService.php:70` | RG-016 |  |
| m08-04 | カスタマイズ | 未実装疑い | 識別ID:37「本人確認ステータス」が未確認以外から未確認に変更、かつ身分証有効期限が入力済みの場合に身分証有効期限を空欄で更新する（Excel 0207:L2452） | `src/Eccube/Controller/Admin/Customer/CustomerEditController.php:156, src/Eccube/Resource/template/admin/Customer/edit.tw` | RG-011 |  |
| m08-04 | カスタマイズ | 設計誤り疑い | 海外用郵便番号は数字・最大文字数100（Excel 0207:L2477） | `app/config/eccube/packages/eccube.yaml:173, src/Eccube/Form/Type/Admin/CustomerType.php:154` | RG-029(DV-14,15) |  |
| m08-04 | カスタマイズ | 設計誤り疑い | 識別ID:31「DCIナンバー」・識別ID:35「DCI確認フラグ」を除去する（Excel 0207:L2436,L2437） | `src/Eccube/Form/Type/Admin/PlayerType.php:41` | RG-016 |  |
| m08-04 | カスタマイズ | 設計誤り疑い | 住所1・住所2・都道府県・電話番号は必須（Excel 0207:L2478,L2479,L2480,L2483-L2485 必須◯）・住所最大90（Excel 0207:L2479,L2480） | `src/Eccube/Form/Type/Admin/CustomerType.php:84, src/Eccube/Form/Type/AddressType.php:108, app/config/eccube/packages/ecc` | RG-028(DV-02,03,04,06) |  |
| m10-04 | 現行踏襲 | 移行退行疑い | 登録成功時は支払方法一覧（GET）へ戻る（詳細設計 L392,L344／現行pf plugin も一覧へ redirect） | `PaymentController.php:173` | RG-010 |  |
| m10-04 | 現行踏襲 | 設計誤り疑い | 支払方法（method）はSymfony Length制約が無い（詳細設計 L365「Symfony Length制約は無し（DBはtext）」） | `PaymentRegisterType.php:58, app/config/eccube/packages/eccube.yaml:137` | RG-027(DV-15) |  |
| m10-04 | 現行踏襲 | 設計誤り疑い | ロゴ非同期アップロードのルートは `POST /{admin_route}/setting/shop/payment/image/add`（詳細設計 L333,L348） | `PaymentController.php:191` | RG-013,015,016 |  |
| m10-16 | カスタマイズ | 未実装疑い | 買取査定申込み完了画面の自動遷移秒数は「数値(整数)・0以上」（Excel 0209:L4043） | `src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:72, app/Plugin/HareruyaEc/Form/Type/Admin/ConfigType.php:83` | RG-013 |  |
| m10-16 | カスタマイズ | 移行退行疑い | スマレジ契約IDの保存先論理キーは現行踏襲（`smaregi_contract_id`＝`pf-eccube3:ConfigType.php:87`） | `src/Eccube/Resource/locale/messages.ja.yaml:4208, AdditionalSystemFormType.php:80` | RG-014 |  |
| m10-16 | カスタマイズ | 設計誤り疑い | （詳細設計ハルシネーション是正）詳細設計 L346/L359 は「保存処理で update_date をセットしない」と記す | `src/Eccube/Controller/Admin/Setting/Shop/AdditionalSystemController.php:95, ConfigController.php:56` | RG-002 |  |
| m13-02 | カスタマイズ | 移行退行疑い | 申込済み日程がありかつ支払方法に差分がある更新は支払方法変更不可（Excel 0214:L1602／詳細設計 L359,L383） | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/EventController.php:115, ec-cube-enterprise/src/Eccube/Controller/Admi` | RG-006 |  |
| m13-02 | カスタマイズ | 移行退行疑い | メンバーが編集権限を保持する店舗のイベントのみ登録・編集・削除可能、編集権限のない店舗選択はエラー、各操作ボタンは編集権限店舗のみ表示（Excel 0214:L1592,L1608,L1610,L1671,L1674,L | `pf-eccube3/.../Admin/EventController.php:57, ec-cube-enterprise/.../Event/EventController.php:306` | RG-021,022 |  |
| m13-02 | カスタマイズ | 移行退行疑い | 削除対象が存在しないイベントは403、日程残のイベント削除は直前画面（referer）へ戻す（詳細設計 L363,L416＝現行踏襲。Excelは沈黙） | `pf-eccube3/.../Admin/EventController.php:162, ec-cube-enterprise/.../Event/EventController.php:304` | RG-011,012 |  |
| m13-02 | カスタマイズ | 移行退行疑い | イベント規模（event_scale_id）・フリー入力エリア（free_text_area1〜3）・定員接尾辞 人/組・チーム戦フラグ（is_team_battle）等のカスタマイズ追加項目（Excel 0214:L1 | `ec-cube-enterprise/src/Eccube/Service/Admin/Event/EventEditAction.php:61, pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Adm` | RG-031,033,034 |  |
| m13-04 | 現行踏襲 | 未実装疑い | ★メンバーが権限を保持している店舗のイベントのみ日程追加が可能（Excel 0214:L2456・カスタマイズ要件 0214:L2452） | `app/Plugin/HareruyaEc/Controller/Admin/RepeatScheduleController.php:29, src/Eccube/Controller/Admin/Event/RepeatSchedule` | RG-004 |  |

## §2. 一般乖離（P2）

（221件）

| 機能 | 区分 | 分類 | 乖離内容（設計→実装） | file:line | 対象RG | 裁定 |
|---|---|---|---|---|---|---|
| a01-02 | 新規実装 | 乖離 | 抽出時に「在庫変動区分が02:取引/12:返品」でかつ未保存のIDを抽出する（0501:L1499,L1513）＝抽出段でも区分を絞る | `SmaregiStockBackfillAction.php:228, src/Eccube/Service/Smaregi/Webhook/Stock/SmaregiStockChangeApplier.php:44` | RG-004,014 |  |
| a01-02 | 新規実装 | 乖離 | 抽出時に「店頭受取のデータではない」もののみ抽出する（0501:L1514） | `SmaregiStockBackfillAction.php:228, SmaregiStockChangeApplier.php:108` | RG-005 |  |
| a02-05 | 現行踏襲 | 乖離 | 応答 stock・price02 の型：オラクル内で不確定。Excel は型表 L1794/L1795「数値(整数)」と応答サンプル L1823『"stock":"1"』／L1824『"price02":"6000"』（ | `src/Eccube/Repository/ProductRepository.php:2252` | RG-006 |  |
| a02-05 | 現行踏襲 | 乖離 | ステータス：Excel 0502:L1774-1776「200/404/500」。不正パス値は解釈不能で異常（詳細 L329「日時として解釈できる文字列を渡す」）。該当なしは200空（詳細 L335） | `src/Eccube/Controller/App/ProductController.php:208` | RG-004,010,011 |  |
| a02-05 | 現行踏襲 | 乖離 | 取得開始日/終了日の最大文字数8（Excel 0502:L1762,L1763） | `src/Eccube/Controller/App/ProductController.php:208` | §5 台帳(要判定) |  |
| a02-05 | 現行踏襲 | 乖離 | 応答フィールド名 `strageCodeId`（Excel 0502:L1799・詳細 L333 とも "strage" 綴り＝保管コードID） | `src/Eccube/Repository/ProductRepository.php:2218` | RG-006 |  |
| a05-01 | カスタマイズ | 乖離 | 印刷情報XMLのログ保存先は `var/log/print_logs/` 配下（正本 L382・アプリ相対の想定） | `src/Controller/Admin/OrderController.php:41` | RG-005 |  |
| a05-02 | カスタマイズ | その他 | 直接印刷結果が偽の場合は更新を行わず記録して戻る（詳細設計 L333／Excel 0505:L1296 成功(true)/失敗(false)） | `OrderController.php:101` | ...)` は SimpleXMLElement |  |
| a05-02 | カスタマイズ | 乖離 | ResponseFileの解析に失敗した場合は内容とエラーを記録して更新を行わずに戻る（詳細設計 L333） | `OrderController.php:94` | RG-003 |  |
| a05-04 | カスタマイズ | 乖離 | レスポンス書式は「なし（ステータスコードのみ）」（Excel 0505:L1656,L1658） | `SmaregiController.php:103` | RG-014 |  |
| a05-04 | カスタマイズ | 乖離 | 高リスク（外部連携）＝同一取引の重複受信で二重加算を起こさない冪等が望ましい。正本は取消・打消のみ取引ID基準巻き戻しを保証（詳細設計 L382） | `SmaregiController.php:127` | RG-018 |  |
| a05-04 | カスタマイズ | その他 | 通常取引は付与・利用それぞれのポイント履歴を登録する（詳細設計 L329）。零ポイント（付与0 または 利用0）時に該当履歴行を生成するかはL329が零条件を規定せず・Excel 0505:L1717,L1718 も履歴 | `SmaregiController.php:141` | RG-001(DP-T02,T03) |  |
| a06-01 | 現行踏襲 | 乖離 | エンドポイントURL。Excel 0506:L972 は `/api/admin/login.json`／詳細設計 L319 は `POST /admin/login.json`（`/api` なし） | `pf-api/config/routes.yaml:2` | RG-001,012,017 |  |
| a06-01 | 現行踏襲 | 乖離 | 中継先への到達不可・処理中の例外はHTTP500（詳細設計 L340,L371） | `pf-api/src/Controller/Admin/LoginController.php:54` | RG-010 |  |
| a06-01 | 現行踏襲 | 乖離 | 認証失敗時、応答からエラー文言を抽出しmessageに用いる（画面文言から改行除去）（詳細設計 L340,L371） | `pf-api/src/Controller/Admin/LoginController.php:60` | RG-005,016 |  |
| a06-01 | 現行踏襲 | 乖離 | 認証失敗応答は `{code, message}` を返す（詳細設計 L340） | `pf-api/src/Controller/Admin/LoginController.php:61` | RG-005,016 |  |
| a06-01 | 現行踏襲 | 乖離 | 一時Cookieファイルは処理後に削除する（詳細設計 L328・成功経路前提） | `pf-api/src/Controller/Admin/LoginController.php:56` | RG-009 |  |
| a06-02 | カスタマイズ | 乖離 | エンドポイントURLは `/api/admin/otcBuyOrders.json`（Excel 0506:L1162） | `config/routes.yaml:30` | RG-022 |  |
| a06-02 | カスタマイズ | 乖離 | 認証方式は「IP制限 トークン」（Excel 0506:L1163） | `src/Controller/BaseController.php:23` | RG-016,017,018 |  |
| a06-02 | カスタマイズ | 乖離 | 取得対象ステータスは「査定前/査定中/査定中断/査定再開」の4種（Excel 0506:L1169,L1185） | `src/Repository/DtbOtcBuyOrderRepository.php:48, src/Entity/MtbOtcBuyOrderStatus.php:14` | RG-003 |  |
| a06-02 | カスタマイズ | 乖離 | レスポンス各フィールドの型は全て「文字列」（Excel 0506:L1186-1200） | `src/Repository/DtbOtcBuyOrderRepository.php:20` | RG-006,007,010 |  |
| a06-03 | カスタマイズ | 乖離 | 成立日時／キャンセル日時は買取成立→成立日、買取キャンセル→キャンセル日に限り記録（Excel 0506:L1507,L1508） | `OtcBuyOrderController.php:208` | RG-015,021 |  |
| a06-16 | 新規実装 | 乖離 | エンドポイント: Excel `PUT /api/otcBuyOrder/{id}/doublecheck.json`（0506:L3819,L3820）。詳細設計HTMLは移行先を `PUT /{api_v1_rout | `src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:231` | RG-004 |  |
| a06-16 | 新規実装 | 乖離 | ダブルチェック者の保存: Excel「ダブルチェック者は新規のカラムに追加する」（0506:L3833）。詳細設計HTMLは承認テーブルと記載（正本 L314,L315） | `src/Eccube/Service/EntityManager/OtcBuyOrderApproverEntityManager.php:33, UpdateDoubleCheckMemberAction.php:47` | RG-002 |  |
| a06-16 | 新規実装 | 乖離 | 更新担当者・更新日時: Excel A06-16 に記載なし（副作用は「新規カラム追加」のみ 0506:L3833） | `UpdateDoubleCheckMemberAction.php:42` | RG-002 |  |
| a06-16 | 新規実装 | 乖離 | 同一メンバー禁止: Excel A06-16 に記載なし。詳細設計HTMLは「更新者とダブルチェック者が同一の場合はエラー」と記載（正本 L305,L314） | `UpdateDoubleCheckMemberAction.php:36` | 台帳(要判定) |  |
| a06-16 | 新規実装 | 乖離 | 成功レスポンス: Excel「ステータスコード 200／レスポンスデータなし」（0506:L3848,L3851） | `OtcBuyOrderController.php:267` | RG-003 |  |
| a06-16 | 新規実装 | 乖離 | 認証方式: Excel「認証の有無=有／認証方式=IP制限／トークン」（0506:L3820） | `OtcBuyOrderController.php:244` | RG-006 |  |
| a07-02 | 現行踏襲 | 乖離 | null 保持：詳細設計 L339「freeComment 未設定時 null」「memberName 紐づく会員なし時 null」・L362「serialize_null 有効」（Excel は null 挙動に沈黙） | `BuyOrderController.php:74` | RG-005,006 |  |
| a07-02 | 現行踏襲 | 乖離 | 401 応答本体：詳細設計 L341「認証拒否（本文を持たない）」 | `src/Eccube/EventListener/ExceptionListener.php:77` | RG-014 |  |
| a17-01 | 現行踏襲 | 乖離 | 応答プロパティ名（詳細設計L347は「camelCase」と記述） | `src/Entity/DtbArticle.php:8` | RG-002 |  |
| a17-01 | 現行踏襲 | 乖離 | Excel項目表 `0517:L1011` が deleted_at を応答フィールドに列挙 | `src/Entity/DtbArticle.php:42` | RG-003 |  |
| a17-01 | 現行踏襲 | 乖離 | 「記事情報1件」を取得（Excel 0517:L979） | `src/Repository/DtbArticleRepository.php:21, src/Resources/config/doctrine/DtbArticle.orm.yml:17` | RG-001,014 |  |
| a17-01 | 現行踏襲 | 乖離 | メソッド=GET（Excel 0517:L975）／詳細設計 `GET /article`（L311,L315） | `config/routes.yaml:145, routes.yaml:148` | RG-009 |  |
| a17-01 | 現行踏襲 | 乖離 | wpPostId は必須・integer（Excel 0517:L988／詳細設計L323） | `src/Controller/ArticleController.php:88` | RG-008（DP-04,05） |  |
| a17-01 | 現行踏襲 | 乖離 | Excel `0517:L988` wpPostId(数値/整数)の備考が「jaもしくはenのいずれか」 | `src/Repository/DtbArticleRepository.php:23` | RG-008 |  |
| a17-02 | 現行踏襲 | 乖離 | `limit` 未指定時の取得件数は既定20件（Excel 0517:L1643「設定しない場合は取得件数20件とする」／詳細設計 L322「未指定時は20件」） | `src/Controller/ArticleController.php:119, src/Repository/DtbArticleRepository.php:37` | RG-005,017(DV-03) |  |
| a17-02 | 現行踏襲 | 乖離 | 共有フラグ `hasSameDeck` 等の型（Excel 0517:L1663-1666「文字型」／応答例 0517:L1675-1678 は `"0"` の文字列。詳細設計 L326 は「integer（1／0）」と | `src/Repository/DtbArticleRepository.php:51` | RG-007 |  |
| a17-02 | 現行踏襲 | 乖離 | 関連記事なし時は HTTP404（Excel 0517:L1653／詳細設計 レスポンス失敗表 L328「404 {code,message}"Not Found"」） | `src/Controller/ArticleController.php:120` | RG-008 |  |
| a17-02 | 現行踏襲 | 乖離 | 関連判定は「同一デッキ・アーキタイプ・カード・イベント詳細のいずれかを共有」（詳細設計 L325）。関連判定の内部詳細は「実装を確認値とする」（詳細設計 L304・仕様確定せず） | `src/Repository/DtbArticleRepository.php:60` | RG-002,012 |  |
| b02-07 | カスタマイズ | その他 | 本テーブルの洗い替え（全削除→登録）（Excel 0402:L1404） | `DtbWeeklyStockHistoryRepository.php:67` | RG-013 |  |
| b02-07 | カスタマイズ | 乖離 | 各週末時点の在庫数を取得し登録する（Excel 0402:L1379,L1388） | `DtbWeeklyStockHistoryTempRepository.php:30` | RG-002,004 |  |
| b05-01 | 現行踏襲 | 乖離 | 連携対象は注文日時が窓[T-30分, T]内の注文（Excel 0405:L1029＋入力データ検索条件 0405:L1075「注文データ.注文日時＝バッチ駆動時間からバッチ駆動時間より30分前」＝窓の下限をT-30分と | `src/Eccube/Repository/OrderRepository.php:1909, OtcOrderSmaregiPostCommand.php:48` | RG-002, DT-08 |  |
| b05-02 | 現行踏襲 | 乖離 | 注文番号は現行8桁、移行先 dtb_order.order_number は文字列・桁11で桁・型が現行と異なる（要確認）（詳細設計L305） | `ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:82` | RG-011 |  |
| b05-02 | 現行踏襲 | 乖離 | 「同名バッチが実行中（未完了の旨を出力して終了）」と「ロック取得失敗（異常として終了）」を区別（詳細設計L316,L341） | `ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:50, ResendMailCommand.php:59` | RG-018,019 |  |
| b05-04 | 現行踏襲 | その他 | 連携失敗時は発生したスマレジ連携ごとに管理者へエラーメールを送信する（Excel 0405:L1514,L1515） | `app/Plugin/HareruyaEc/Service/SmaregiService.php:64` | !array_key_exists('resul |  |
| b05-04 | 現行踏襲 | 乖離 | 連携失敗時は管理者へエラーメールを送信する（副作用保証）（Excel 0405:L1515） | `app/Plugin/HareruyaEc/Service/MailService.php:1381` | RG-007 |  |
| b05-04 | 現行踏襲 | 乖離 | 未連携区分（商品・在庫）それぞれについて再連携する。一注文で両方未連携の状態も想定される（Excel 0405:L1513／詳細設計 L316,L319） | `app/Plugin/HareruyaEc/Service/SmaregiService.php:67` | RG-008 |  |
| b05-04 | 現行踏襲 | その他 | 連携時のエラーは管理者へメールで通知する（Excel 0405:L1514,L1515） | `app/Plugin/HareruyaEc/Service/SmaregiService.php:53` | RG-007 |  |
| b05-04 | 現行踏襲 | その他 | （移行時の扱い）Excel 図形注記「注文番号登録バッチの仕様変更により、こちらのバッチは不要となる」（Excel 0405:L1526） | `app/Plugin/HareruyaEc/Command/OrderBatch.php:16` | §0 |  |
| b05-05 | 現行踏襲 | 乖離 | 受注ごとにスマレジへ商品削除の連携を行う（同期処理・詳細設計 L316） | `app/Plugin/HareruyaEc/Service/Order/DeleteSmaregiProduct.php:34, src/Eccube/Command/SmaregiOtcDeleteCommand.php:88` | RG-007,019 |  |
| b05-05 | 現行踏襲 | 乖離 | スマレジ登録が成功したら当該注文の削除フラグを立てる（0405:L1647＝成功時のみ） | `app/Plugin/HareruyaEc/Service/SmaregiService.php:57, src/Eccube/Service/Smaregi/Otc/SmaregiOtcDeleteService.php:79` | RG-009 |  |
| b05-06 | 現行踏襲 | その他 | 該当時は「管理者」へ通知メールを送信（Excel 0405:L1747／詳細設計 L319,L330） | `app/Plugin/HareruyaEc/Service/MailService.php:1448, src/Eccube/Service/MailService.php:2239` | RG-015 |  |
| b05-06 | 現行踏襲 | 乖離 | 成功時は二重登録があれば管理者へ通知メールを送信する（詳細設計 API/バッチ結果 L330） | `...MailService.php:1450, ...MailService.php:2243, src/Eccube/Service/Admin/Order/CheckDuplicatePointAction.php:48, Check` | RG-001,003,015 |  |
| b05-07 | 現行踏襲 | 乖離 | 決済会社出力情報の中に、購入金額合計もしくは支払合計のテキストが含まれている（Excel 0405:L1877,L1888） | `OrderRepository.php:1920, OrderRepository.php:1944` |  |  |
| b05-08 | 現行踏襲 | その他 | 成否で受注サブの `smaregi_error_flg` を更新し、失敗時は `point_error_message` を記録する（Excel 0405:L2005,L2007・詳細設計 処理フロー L317・入出力  | `../pf-eccube3/app/Plugin/HareruyaEc/Service/Smaregi/CheckSmaregiErrorOrder.php:38` | RG-004,005,011,015 |  |
| b05-08 | 現行踏襲 | 乖離 | エラー受注に紐づくユーザー情報（会員・選手情報）を取得してリトライする（Excel 0405:L1992,L2002） | `../pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbOrderSubRepository.php:184` | RG-002,012 |  |
| b05-08 | 現行踏襲 | 乖離 | すべての更新を確定する（詳細設計 L317 最終ステップ・成否を受注ごとに反映） | `../pf-eccube3/.../CheckSmaregiErrorOrder.php:33` | RG-010,011 |  |
| b05-08 | 現行踏襲 | 乖離 | （成否の反映のみ規定。成功時のメッセージ消去は設計沈黙） | `../pf-eccube3/.../CheckSmaregiErrorOrder.php:37` | RG-003(STALE),004 |  |
| b05-08 | 現行踏襲 | 乖離 | 連携の成否で処理を分岐する（Excel 0405:L2005,L2007・詳細設計 L339） | `../pf-eccube3/.../CheckSmaregiErrorOrder.php:37, SmaregiBatch.php:50` | RG-006,013 |  |
| b05-09 | 現行踏襲 | 乖離 | 本バッチは取得取引でポイント履歴を登録・取消し会員ポイントを更新する＝DBへ書き込む（Excel 0405:L2110,L2122,L2127・詳細設計 移行節 L306・DBカラム L330） | `app/Plugin/HareruyaEc/Service/Smaregi/CheckSmaregiTransaction.php:210` | RG-010,012,013 |  |
| b05-09 | 現行踏襲 | 乖離 | 取引情報取得失敗時は失敗内容をログ出力し異常終了（戻り値1）（詳細設計 API/バッチ結果 L323・エラー処理 L339／Excel 0405:L2129） | `CheckSmaregiTransaction.php:50, app/Plugin/HareruyaEc/Command/SmaregiBatch.php:49` | RG-006 |  |
| b05-09 | 現行踏襲 | その他 | 移行先（ec-cube-enterprise）でも取引取得・更新の挙動を踏襲し永続化する（詳細設計 L306,L332「テーブル名は ec-cube-enterprise を正典」／Excel 0405:L2110） | `—` | SmaregiBatch"` 該当なし）。ent |  |
| b06-01 | 新規実装 | 乖離 | 入力データ検索条件「店頭買取情報.ステータス 12: 入庫待ち」（0406:L967／詳細設計 L372も12） | `src/Eccube/Entity/Master/MtbOtcBuyOrderStatus.php:60, src/Eccube/Service/Admin/OtcBuyOrder/BatchAutoStockAction.php:45` | RG-001,012 |  |
| b06-01 | 新規実装 | 乖離 | ネット買取の在庫履歴は「仕入単価＝買取単価で登録」（0406:L954） | `src/Eccube/Service/Admin/Purchase/BuyOrderStockInbound.php:93, src/Eccube/Service/Admin/OtcBuyOrder/OtcBuyOrderStockInbo` | RG-008 |  |
| b06-01 | 新規実装 | 乖離 | ネット買取は「本店のECCUBE在庫に登録」（0406:L936,L951） | `src/Eccube/Service/Admin/Purchase/BatchAutoStockAction.php:48, BaseInfoRepository.php:165, src/Eccube/Entity/BaseInfo.ph` | RG-007 |  |
| b06-01 | 新規実装 | その他 | エラーハンドリング欄は空欄＝多重起動/途中失敗時の仕様を明示せず（0406:L974） | `.../OtcBuyOrder/BatchAutoStockAction.php:54, .../Purchase/BatchAutoStockAction.php:58, .../BatchAutoStockAction.php:68, ` | RG-018,019 |  |
| b08-02 | 現行踏襲 | その他 | スマレジ連携失敗＝タイムアウト または レスポンスステータスが失敗扱い（Excel L1230） | `LostPoints.php:46` | !array_key_exists('resul |  |
| b08-02 | 現行踏襲 | 乖離 | リクエスト上限に配慮し会員ごとに短いインターバルを挟む（詳細設計L320,L347） | `LostPoints.php:41, LostPointsAction.php:52` | RG-014 |  |
| b08-02 | 現行踏襲 | 乖離 | 有効期限が切れたポイントを失効処理する（Excel L1184。会員を smaregi_id 有無で限定する旨の明示なし） | `app/Plugin/HareruyaEc/Repository/DtbPointHistoryRepository.php:38, src/Eccube/Repository/DtbPointHistoryRepository.php:2` | RG-002／§5 要判定 |  |
| b08-03 | 現行踏襲 | 乖離 | 送信時のエラーは「エラーメッセージをコンソールに出力する」（Excel 0408:L1344／詳細設計 L344） | `src/Eccube/Service/MailService.php:1121, PointExpireNotificationCommand.php:42` | RG-014 |  |
| b08-03 | 現行踏襲 | 乖離 | 抽出条件は「①指定日獲得ポイント ②残ポイント ③会員ステータス（仮/退会でない）」の3条件のみ（Excel 0408:L1345-1352,L1361,L1362） | `src/Eccube/Repository/DtbPointHistoryRepository.php:328` | RG-003〜006 |  |
| b08-03 | 現行踏襲 | 乖離 | メール送信元は `info@hareruyamtg.com` に設定（Excel 0408:L1376） | `app/Plugin/HareruyaEc/Service/MailService.php:1144, src/Eccube/Service/MailService.php:1113` | RG-009 |  |
| b08-05 | 現行踏襲 | 乖離 | 会員毎に全期間ポイント合計（履歴合計値）と保有ポイントを照合し差異のある会員を抽出（Excel 0408:L1585,L1591）＝全会員を含意 | `app/Plugin/HareruyaEc/Repository/DtbPointHistoryRepository.php:199, src/Eccube/Repository/DtbPointHistoryRepository.php:` | RG-018(DV-04) |  |
| b08-05 | 現行踏襲 | 乖離 | 通知メールの送信元(From)は info@hareruyamtg.com（Excel 0408:L1617） | `app/Plugin/HareruyaEc/Service/MailService.php:1596, src/Eccube/Service/MailService.php:1352` | RG-007 |  |
| b08-05 | 現行踏襲 | 乖離 | 通知メール本文の差分行は「会員ID,履歴合計値,現在のポイント,差分」（Excel例 0408:L1620 は `11111,5340,5310,-30` 空白なし） | `MailService.php:1583, MailService.php:1338` | RG-008 |  |
| b08-06 | 現行踏襲 | 乖離 | 注文IDが「該当データなし」の場合は処理を終了する（正常終了扱い[return終了]）（Excel `0408:L1755`,`0408:L1756`） | `app/Plugin/HareruyaEc/Service/Smaregi/UpdatePoint.php:37, src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php:34` | RG-007 |  |
| b08-06 | 現行踏襲 | 乖離 | 注文サブのユーザーIDから選手データを抽出しスマレジ用ユーザーIDを取得する（＝会員・選手情報の存在前提）（Excel `0408:L1737`／正本 L330） | `UpdatePoint.php:38, SmaregiUpdatePointAction.php:44` | RG-003,RG-014 |  |
| b08-06 | 現行踏襲 | 乖離 | スマレジ連携API通信失敗時は point_error_message にエラー詳細JSONを記録する（Excel `0408:L1758`） | `app/Plugin/HareruyaEc/Service/Smaregi/CustomerService.php:379, UpdatePoint.php:41` | RG-008 |  |
| b13-01 | 現行踏襲 | 乖離 | 抽出条件の日時は「イベント申込.作成日時（申込日時）がバッチ起動時間の30分以上前」（Excel 0413:L955,L960） | `app/Plugin/HareruyaEc/Repository/DtbEventEntryRepository.php:70, config.yml:185` | RG-003,016 |  |
| b13-01 | 現行踏襲 | 乖離 | 取引照会の処理自体でエラー発生時は、想定外エラーとして集約し管理者へ通知メール（Excel 0413:L979-981／正本 L344-345） | `app/Plugin/HareruyaEc/Service/Payment/SlnSearchHelper.php:83` | RG-009,010 |  |
| b13-01 | 現行踏襲 | 乖離 | 本バッチは照会結果に応じて申込ステータス更新・論理削除・申込履歴追加を行う（更新系）（Excel 0413:L964-978／処理フロー 正本 L319） | `app/Plugin/HareruyaEc/Service/Payment/AbstractCheckPaymentEntry.php:59, AbstractPaymentService.php:43` | RG-012 |  |
| b13-01 | 現行踏襲 | 乖離 | 取引不在・失敗の申込は「削除（論理削除）」する（Excel 0413:L978／移行節 正本 L307「論理削除 deleted_at」） | `app/Plugin/HareruyaEc/Service/Payment/AbstractPaymentService.php:43` | RG-007 |  |
| b13-01 | 現行踏襲 | 乖離 | 取引不在・失敗の申込は（重複決済番号を含め）論理削除、成功は更新（Excel 0413:L977-978／正本 L319） | `app/Plugin/HareruyaEc/Service/Payment/AbstractCheckPaymentEntry.php:29, SlnSearchHelper.php:16` | RG-008 |  |
| b13-01 | 現行踏襲 | 乖離 | 本バッチ（決済処理中チェック）はリンク型決済（クレジット）の未完了申込を対象とする（Excel 0413:L937-938。コンビニ決済は別バッチ B13-02） | `app/Plugin/HareruyaEc/Service/Payment/CheckProcessingPaymentEntry.php:12, SlnSearchHelper.php:52, AbstractCheckPaymentEn` | RG-009,010 |  |
| b13-02 | 現行踏襲 | その他 | 本バッチは廃止する（Excel基本設計 B13-02・0413:L1078-1079）＝刷新後 ec-cube-enterprise に実装しない | `app/Plugin/HareruyaEc/Service/Payment/CheckCvsPaymentEntry.php:16, Command/EventEntryBatch.php:13` |  |  |
| b13-02 | 現行踏襲 | 乖離 | （現行挙動として）照会結果に応じ申込ステータス更新・記録除去・申込履歴追加を行う＝更新系（正本 処理フロー L319・副作用 L331） | `app/Plugin/HareruyaEc/Service/Payment/AbstractCheckPaymentEntry.php:95, CheckCvsPaymentEntry.php:37` |  |  |
| b13-02 | 現行踏襲 | 乖離 | 取引が存在しない場合は当該申込みの記録を取り除く／記録除去（正本 処理フロー L319・業務ルール L325・副作用 L331） | `CheckCvsPaymentEntry.php:34, MtbEntryStatus.php:21` |  |  |
| b13-02 | 現行踏襲 | 乖離 | 取引照会の処理自体でエラー発生時は想定外エラーとして集約し管理者へ通知メール（正本 L319,L345） | `app/Plugin/HareruyaEc/Service/Payment/SlnSearchHelper.php:83` |  |  |
| b13-02 | 現行踏襲 | 乖離 | （現行）コンビニ入金確認の完了はコンビニ決済に対応するメールで通知されるべき | `app/Plugin/HareruyaEc/Entity/Payment.php:79, AbstractCheckPaymentEntry.php:98` |  |  |
| b17-01 | 現行踏襲 | 乖離 | 詳細設計のエラー処理は「取得失敗→エラー出力」のみ（L251）。HTTPステータス・空レスポンス・JSON妥当性の検証は詳細設計に記述なし | `CreateLatestArticleListAction.php:66` | RG-007 |  |
| b17-01 | 現行踏襲 | その他 | 起動コマンドは現行 `list:batch createLatestArticleList`、移行先 `eccube:create:latest-article-list`（L221 が明示） | `app/Plugin/HareruyaEc/Command/ListTextBatch.php:23, src/Eccube/Command/CreateLatestArticleListCommand.php:34` | RG-001,013 |  |
| f04-04 | 現行踏襲 | 乖離 | TOPページへ戻るボタンは注文した店舗のTOP画面へ遷移（Excel 0304:L2578） | `...Shopping/complete.twig:63, ...Shopping/complete.twig:132` | RG-028 |  |
| f04-04 | 現行踏襲 | 乖離 | ★原価情報で総原価・総在庫を増減し、在庫履歴に商品情報（総在庫・総原価）と受注情報（注文数・総原価）を登録（Excel 0304:L2523,L2537-L2545） | `app/Plugin/HareruyaEc/Service/ShoppingService.php:827` | RG-008,009 |  |
| f06-01 | カスタマイズ | 乖離 | 会員登録完了時、支店への会員データ連携は不要となる（Excel カスタマイズ要件 0306:L1328,L1334） | `app/Plugin/HareruyaEc/Controller/EntryController.php:152` | RG-031 |  |
| f06-01 | カスタマイズ | その他 | 詳細設計 L323「郵便番号 … 移行先 単一列 postal_code（桁数8）／列の統合」（Excel 0306:L1167 は郵便番号 最大10文字） | `src/Eccube/Entity/Customer.php:74` | RG-014,024 |  |
| f06-02 | 現行踏襲 | 乖離 | スマレジ会員登録連携の成功を本会員化確定の前提とし、失敗時は会員ステータス変更を確定しない（詳細設計 L348,L354,L397／Excel 0306:L1769「スマレジ成功時のみステータスを本会員にして保存」）。会 | `src/Eccube/Controller/Front/EntryController.php:283` | RG-007,008,010,011 |  |
| f06-02 | 現行踏襲 | 乖離 | スマレジID既保有チェックは判定順序3として本会員化ステータス変更の前に行い、保有時は E-2「完了済みです。」を表示して処理中止（詳細設計 L338,L348／Excel 0306:L1760,L1761） | `EntryController.php:349, app/Plugin/HareruyaEc/Controller/EntryController.php:228` | RG-005 |  |
| f06-02 | 現行踏襲 | その他 | 本機能では楽観ロック・悲観ロックの対象は持たない（詳細設計 L397・現行踏襲） | `EntryController.php:354` | RG-010 |  |
| f06-10 | カスタマイズ | 乖離 | ポイント履歴のExcel基本設計は `0306 sheet-10 F06-10 ポイント履歴`（`0306:L968,L3500台の概要`）。詳細設計も廃止根拠に「0306 ポイント履歴 識別ID:2」を引用（正本 L3 | `—` | 全体（Excel源） |  |
| f06-10 | カスタマイズ | 乖離 | 会員氏名＋「様」表示は廃止（刷新後は実装不要）（正本 L300-303,L323／Excel `0306:L3585` 識別ID2「項目を除去」） | `—` | §0廃止 |  |
| f06-10 | カスタマイズ | 乖離 | 本機能は参照のみでデータを更新しない（正本 L364,L361,L395） | `src/Eccube/Controller/Front/Mypage/MypageController.php:393` | RG-024 |  |
| f06-10 | カスタマイズ | 乖離 | 表示件数の選択肢は 10・20・50・100（Excel `0306:L3589`／正本 L343,L374） | `...Mypage/point_history.twig:72, MypageController.php:403` | RG-017(DQ-06) |  |
| f06-10 | カスタマイズ | 乖離 | Excelは「ポイント履歴はポイント履歴IDの降順で表示する」（`0306:L3572`）／詳細設計は「発行日の降順、同日は履歴識別子の降順」（正本 L343,L352） | `src/Eccube/Repository/DtbPointHistoryRepository.php:88, app/Plugin/HareruyaEc/Repository/DtbPointHistoryRepository.php:2` | RG-001 |  |
| f06-10 | カスタマイズ | 乖離 | ページング用GETクエリのパラメータ名は `page`／`pageSize`（正本 L331,L340,L353,L374／§1,§3,§6,RG-017が一貫使用） | `src/Eccube/Controller/Front/Mypage/MypageController.php:403, ...Mypage/point_history.twig:24` | RG-017(§3・DQ-01〜06) |  |
| f06-18 | カスタマイズ | その他 | 更新時にスマレジへ会員情報更新を連携する（詳細設計L360＝連携は更新の一部・条件記載なし＝常時） | `ChangeController.php:161, src/Eccube/Controller/Front/Mypage/ChangeController.php:174` | $isTelChanged) ? registe |  |
| f06-18 | カスタマイズ | 乖離 | 氏名/住所/電話がブラックリストに該当する値に変更して「変更する」押下時、会員情報更新エラー画面に遷移する（Excel 0306:L5219 ★カスタマイズ要件） | `app/Plugin/HareruyaEc/Controller/EntryController.php:104` | RG-019 |  |
| f06-18 | カスタマイズ | 乖離 | ブラックリスト該当時の遷移先は「会員情報更新エラー画面」（専用エラー画面。Excel 0306:L5219,L5224＝image7 参照） | `src/Eccube/Controller/Front/Mypage/ChangeController.php:116` | RG-019 |  |
| f06-21 | 現行踏襲 | 乖離 | スマレジ連携は「スマレジ側の会員データを削除する」（Excel 0306:L6160）。詳細設計L367は「会員の利用停止を連携」と表現 | `WithdrawController.php:75, WithdrawController.php:111, src/Eccube/Service/Smaregi/SmaregiCustomerService.php:499` | RG-007 |  |
| f06-21 | 現行踏襲 | その他 | パンくずリスト新規追加・現在ページ押下不可・ホームアイコンで本店ECTOP（Excel 0306:L6081,L6129）／画面上部ユーザ名表示の削除（Excel 名前ラベル「項目を除去」） | `—` | RG-021,022 |  |
| m03-08 | カスタマイズ | 乖離 | 「その他」の状態のソート順は通常規格の後で、さらに価格ソートで高額順に表示する（Excel 0204:L5193） | `src/Eccube/Repository/ProductClassRepository.php:100` | RG-008 |  |
| m03-08 | カスタマイズ | その他 | 基準価格を一覧に追加（Excel 0204:L5185） | `index.twig:96` | **設計どおり✓** |  |
| m03-08 | カスタマイズ | 乖離 | 廃止規格一覧は公開ステータス廃止の規格を出力する（Excel 0204:L5190・NULL言語/カード状態への言及なし） | `ProductClassRepository.php:312` | RG-002,010 |  |
| m03-18 | カスタマイズ | 乖離 | 部門コードは「数字」で登録する（Excel 0204:L7610 書式=数字・最大値128） | `src/Eccube/Form/Type/Admin/ProductDepartmentType.php:51` | RG-014 |  |
| m03-18 | カスタマイズ | 乖離 | 部門削除のエラー条件は3種＝商品規格／店頭買取の買取商品／店頭買取の個別入力商品（Excel 0204:L7596,L7597,L7598） | `src/Eccube/Controller/Admin/Product/SectionController.php:147, src/Eccube/Entity/Master/MtbSection.php:251` | RG-006〜009 |  |
| m03-18 | カスタマイズ | 乖離 | スマレジ連携は「部門登録および部門更新実行時」に部門情報を連携（Excel 0204:L7585,L7586）。削除時のスマレジ連携はExcel／詳細設計とも沈黙 | `SectionController.php:184, src/Eccube/Service/Smaregi/SmaregiSectionEventService.php:85` | RG-006 |  |
| m03-18 | カスタマイズ | 乖離 | 画面/フォームの表示ラベルは「部門登録／編集」「MTGBuyer表示フラグ」等で一貫（詳細設計 L320,L321・Excel 0204:L7588） | `ProductDepartmentType.php:48, src/Eccube/Resource/template/admin/Product/section.twig:65, section.twig:122` | RG-022 |  |
| m03-18 | カスタマイズ | 乖離 | 免税区分の初期値は「-」（Excel 0204:L7611 初期値欄空欄）。詳細設計 L343 は新規=先頭選択肢(0) | `ProductDepartmentType.php:64, MtbSection.php:55` | RG-002 |  |
| m03-19 | 現行踏襲 | その他 | 出力5列＝ID/部門名/部門コード/免税区分/MTGBuyer表示フラグ（0204:L7794/L7795/L7796/L7797/L7798） | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/SectionController.php:19` |  |  |
| m03-19 | 現行踏襲 | その他 | 詳細設計は現行・移行先とも「部門コード昇順」と記述（L319「部門コード昇順かつ条件無しで全件取得」、L300「並び順…両者で同じ」） | `pf-eccube3/.../SectionController.php:154, ec-cube-enterprise/.../SectionController.php:218` |  |  |
| m03-19 | 現行踏襲 | その他 | 詳細設計 L315 はCSV出力ボタンの遷移先を `path('m03-18_admin_product_product_section_export')` と記述 | `ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/section.twig:44, ec-cube-enterprise/.../SectionController.` |  |  |
| m03-19 | 現行踏襲 | その他 | 詳細設計 L329「MTGBuyer表示フラグは真偽を1／0の整数で出力」 | `pf-eccube3/.../SectionController.php:166, ec-cube-enterprise/.../SectionController.php:225` |  |  |
| m03-20 | カスタマイズ | 乖離 | 部門登録CSVアップロード（Excel M03-20＝カスタマイズ：スマレジ連携＋免税区分＋MTGBuyer表示フラグを備える一括登録）（Excel 0204:L7954,L7966,L7970,L7971） | `SectionMasterImportHandler.php:57, src/Eccube/Controller/Admin/Product/SectionController.php:303, CsvImportController.ph` | RG-002,003,009,011,013 |  |
| m03-20 | カスタマイズ | 乖離 | 免税区分の追加（登録可能とし、0:対象外/1:一般品/2:消耗品）（Excel 0204:L7968-7970） | `CsvImportController.php:2158, messages.ja.yaml:2397` | RG-008,009 |  |
| m03-22 | 現行踏襲 | 乖離 | メモ最大長は 1024文字（Excel 0204:L8729 が一次オラクルで規定。現行 pf-eccube3 も string length 1024＝`pf-eccube3:app/Plugin/HareruyaEc | `src/Eccube/Entity/Master/MtbSellGroup.php:73, src/Eccube/Form/Type/Admin/ProductSellGroupType.php:46, app/config/eccube/` | RG-019(DV-08) |  |
| m03-22 | 現行踏襲 | 乖離 | 予約商品フラグが立っている購入グループの商品はフロントの買取一覧・買取詳細に表示させない（Excel 0204:L8714,L8728 カスタマイズ） | `src/Eccube/Controller/Admin/Product/SellGroupController.php:59, ProductSellGroupType.php:67, MtbSellGroup.php:149` | RG-002,RG-029 |  |
| m03-26 | カスタマイズ | 乖離 | スマレジ連携対象カードの部門は NMは「PCシングル」それ以外「ショーケース品」（Excel 0204:L2505） | `—` | RG-033 |  |
| m03-26 | カスタマイズ | 乖離 | スマレジ連携の表示仕様（取込後の連携反映）が確定していること（Excel 0204 スマレジ連携について） | `src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:199` | RG-030,031,032 |  |
| m03-26 | カスタマイズ | 乖離 | CSVフォーマット列は詳細設計 L357／Excel 0204 の見出し集合（発送日目安はダミー列） | `CardCsvController.php:348` | RG-018,043 |  |
| m03-27 | カスタマイズ | 乖離 | 新規登録はセールフラグ無効(セール外)処理を行い、基準価格の値を「販売価格」「基準価格」の双方へ反映（Excel 0204:L3192,L3195）＝新規規格の price02 も基準価格になる | `src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:586` | RG-009 |  |
| m03-27 | カスタマイズ | 乖離 | 登録・更新時にスマレジサーバに通信しスマレジ商品コードの登録状況を確認、登録時重複エラー・更新時情報なしエラー（Excel 0204:L3210,L3211,L3212） | `.../ProductGoodsImportHandler.php:604` | RG-013,RG-014 |  |
| m03-27 | カスタマイズ | 乖離 | 発送日目安(ID) は列定義・検証を持つ現行踏襲列 | `.../ProductGoodsImportHandler.php:112` | RG-029 |  |
| m03-30 | カスタマイズ | 乖離 | セールフラグ無効(通常)時は販売価格を CSV 基準価格へ更新（Excel `0204:L10047`）／有効時は販売価格を保持（Excel `0204:L10052`）。分岐は「現在登録済セールフラグ」参照（Excel | `ProductPriceImportHandler.php:327` | RG-001,002 |  |
| m03-30 | カスタマイズ | 乖離 | CSVアップロード実行による価格登録/更新のタイミングでスマレジAPIを呼び出し価格情報を連携（Excel `0204:L10038`）、条件を満たす場合のみ連携（`0204:L10031,L10032`） | `ProductPriceImportHandler.php:399` | RG-008 |  |
| m03-33 | カスタマイズ | 乖離 | CSVフォーマットは商品コード・販売価格・買取価格・セールフラグ・帯URL・タグ(ID)・スマレジ連携フラグの7列。列列挙の出所は詳細設計 CSV列表 L350（Excel M03-33本文 0204:L11729 は別 | `SaleHighPriceImportHandler.php:165, ProductSaleHighPriceCsvController.php:180` | RG-030,011(DV-05) |  |
| m03-44 | 新規実装 | その他 | 詳細設計 `:313`/`:319` はDB関連を「実装確認値」として `dtb_product_class.standard_price / price02`・`dtb_csv_import_history.membe | `../ec-cube-enterprise/src/Eccube/Entity/Master/MtbCsvImportType.php:28` |  |  |
| m03-44 | 新規実装 | その他 | 詳細設計 `:308`/`:315` はプロセスフロー・例外処理を現行挙動として記述（アップロード→検証→登録→履歴） | `../ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:50` |  |  |
| m03-44 | 新規実装 | その他 | 詳細設計 `:313`/`:319` は基準価格＝`standard_price`／販売価格＝`price02`／履歴＝`dtb_csv_import_history`（member_id記録）と断定 | `—` |  |  |
| m04-01 | 新規実装 | その他 | Excel 0202:L1315-1318 は入力上限（255文字）を規定するが超過時挙動の明示的否定文が正本に無い＝OUTにしない（ゲート規則2） | `—` | `要判定` |  |
| m04-01 | 新規実装 | その他 | M04-01 Excel に明示的否定文なし。検索条件は必須なし（Excel 0202:L1315-1343 の必須列=「-」）＝境界挙動は要実機確認 | `—` | `要判定` |  |
| m04-01 | 新規実装 | その他 | 本機能に該当I/Fなし（参照系管理画面。Excel M04-01 に該当記述なし） | `—` | `OUT` |  |
| m04-01 | 新規実装 | その他 | M04-01 Excel は入口のみ規定＝別範囲（対応機能/共通設計を正） | `—` | `OUT`（§0） |  |
| m04-01 | 新規実装 | その他 | 実装の実態（repo:file:line） | `—` | 設計（あるべき・オラクル＝M04-01 Exce |  |
| m04-01 | 新規実装 | その他 | 未達: パラメータ無しの初回GETは検索を実行せず空一覧を返す。`ec-cube-enterprise:src/Eccube/Controller/Admin/Stock/StockListController.php: | `—` | 初期表示（デフォルト表示）は「メンバー管理で設定 |  |
| m04-01 | 新規実装 | その他 | 乖離（店舗条件が保存に混入）: `ec-cube-enterprise:StockListController.php:338-340` は `$dataToStore = $viewData; unset($dataT | `—` | 検索パターン保存時、**店舗は検索条件の保存に含 |  |
| m04-01 | 新規実装 | その他 | 軽微な乖離（docblock不一致・ソートキー要確認）: `ec-cube-enterprise:src/Eccube/Repository/ProductStockRepository.php:314-315` は ` | `—` | 一覧の表示順はID降順（Excel 0202:L |  |
| m04-02 | 新規実装 | その他 | Excel 0202:L2526 は「合計総原価増減数を総原価増減数で登録」、L2533 は「変更前総原価は計算表示のためここでは登録しない」。詳細設計L312 は承認一覧に「変更前総原価」と記載 | `—` |  |  |
| m04-02 | 新規実装 | その他 | Excel 0202:L2503,L2597「廃棄区分は入力不可・値が入っていた場合は値を削除する」。詳細設計L310は「JS/Twig制御。サーバは廃棄時の仕入単価を計算に使用しない」 | `—` |  |  |
| m04-02 | 新規実装 | その他 | Excel 0202:L2497「入庫承認待ち在庫情報は承認状態が『却下』以外の情報を表示する」。詳細設計L304は「未承認の入庫」 | `—` |  |  |
| m04-02 | 新規実装 | その他 | 詳細設計L317「その他例外は HTTP 500」「成功は success=true と表示用整形理由をJSONで返す」 | `—` |  |  |
| m04-02 | 新規実装 | その他 | Excel 0202:L2595「65535byte」。詳細設計L307「Length(max=eccube_product_stock_change_reason_max_len)」 | `—` |  |  |
| m04-02 | 新規実装 | その他 | Excel 0202:L2481,L2597「在庫追加(入庫)時は原価を必須入力」。詳細設計L307は「仕入単価 任意」・相関一覧L309にbe_stocked_required記載なし | `—` |  |  |
| m04-02 | 新規実装 | その他 | Excelは後追い理由編集(0202:L2606)のみ規定しXHR/HTTPステータス/対象IDパラメータ名には沈黙。詳細設計L315,L316,L317が実装を正と明示 | `—` |  |  |
| m04-04 | 新規実装 | 乖離 | CSV出力項目の並び順はExcelの読み方で二通り：(a) 物理行記載順＝基準価格・販売価格・買取価格・原価単価・総原価・在庫・… (Excel 0202:L3130 原価単価／0202:L3131 総原価／0202:L | `src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:44` | RG-001,002 |  |
| m04-09 | 新規実装 | 乖離 | メモ（在庫移動・振替メモ）は「全角・半角 最大65535byte」（Excel 0202:L5037,L6465） | `src/Eccube/Form/Type/Admin/StockMoveNewType.php:75, src/Eccube/Form/Type/Admin/StockTransferNewType.php:45` | RG-019,030（§5 文字列長=要判定） |  |
| m04-09 | 新規実装 | 乖離 | 移動点数・振替点数の最大値は1000000（Excel 0202:L5031,L6462） | `src/Eccube/Form/Type/Admin/StockMoveQuantityType.php:40, StockTransferNewDetailType.php:41` | RG-004,024（DV-04＝件数外） |  |
| m04-09 | 新規実装 | 乖離 | 振替後商品コードが存在しない商品の場合はエラー（Excel 0202:L6382）＝画面上に該当エラーを案内 | `StockTransferStoreAction.php:91` | RG-028 |  |
| m04-09 | 新規実装 | 乖離 | 在庫振替ステータス一覧の数値IDは 振替承認待ち=7／入庫完了=8／却下=9（Excel 0202:L6635-6637。L6636/L6637は「在庫移動と共通ステータス」と明記） | `src/Eccube/Entity/Master/MtbStockMoveTransferStatus.php:29` | RG-014,021（SEED §2 ステータス |  |
| m04-10 | 新規実装 | 乖離 | 出庫日は移動タイプ（移動/振替）で起点ステータスが異なる（移動＝移動中／振替＝出庫承認済み）（0202:L7066） | `StockMoveTransferListCsvExportService.php:171` | RG-020 |  |
| m04-12 | 新規実装 | 乖離 | ステータス選択肢に「入庫完了」を含む（Excel 0202:L7450・分割系/結合系とも） | `app/DoctrineMigrations/Version20260519100000.php:70` | RG-009(DS-06) |  |
| m04-12 | 新規実装 | 乖離 | 検索条件クリア(3-7)は「押下すると3-1〜3-4の内容を空にする」＝詳細検索の一部項目のみクリア（Excel 0202:L7458） | `StockSplitJoinController.php:96` | RG-014 |  |
| m04-12 | 新規実装 | 乖離 | 商品名(2-2)の検索（Excel 0202:L7445）。※Excel部品表は2-2の書式を「数値」と記載（L7445） | `DtbStockSplitJoinRepository.php:257` | RG-004 |  |
| m04-13 | 新規実装 | その他 | 結合元商品CSVは10,000件を登録上限（Excel 0202:L8855） | `src/Eccube/Controller/Admin/Stock/StockJoinController.php:875, src/Eccube/Service/Csv/Importer/Event/StockJoinCsvImportH` |  |  |
| m04-13 | 新規実装 | その他 | 結合は「結合計画承認待ち→結合計画承認済み→結合完了承認待ち→入庫完了」の二段承認（結合計画承認と結合完了承認）＋ピック作業を規定（結合計画承認済み=Excel 0202:L9101,L9104／結合完了承認申請画面へ遷 | `src/Eccube/Entity/Master/MtbStockSplitJoinStatus.php:28` |  |  |
| m04-13 | 新規実装 | その他 | 結合元在庫数が在庫数を超える場合はエラーとする（Excel 0202:L8946 の7-14） | `src/Eccube/Service/Admin/Stock/StockJoinMoveToShortageEntryAction.php:187` |  |  |
| m04-13 | 新規実装 | その他 | 結合数は必須の入力チェック（Excel 0202:L8735）＝入力エラーとして扱う想定 | `src/Eccube/Service/Admin/Stock/StockJoinRegisterAction.php:43` |  |  |
| m04-13 | 新規実装 | その他 | 欠品点数は1～1,000,000（最小1・固定上限100万）（Excel 0202:L9052 の7-18） | `—` |  |  |
| m04-13 | 新規実装 | その他 | 分割数は数値1～99999999（Excel 0202:L7897 の2-10） | `src/Eccube/Service/Admin/Stock/StockSplitRegisterAction.php:81` |  |  |
| m04-13 | 新規実装 | その他 | Excelは「検品CSV出力/登録」（Excel 0202:L8985,L9009系） | `—` |  |  |
| m04-20 | 新規実装 | 乖離 | CSV列7＝「在庫区分」（EC-CUBE在庫／スマレジ在庫の区分）（Excel 0202:L11102,L11127） | `src/Eccube/Controller/Admin/Stock/StockHistoryController.php:447, src/Eccube/Service/Csv/StockHistoryDisposalCsv.php:106` | RG-001,003 |  |
| m04-20 | 新規実装 | 乖離 | CSV列9＝「登録元ID」を出力（Excel 0202:L11104,L11129） | `StockHistoryController.php:440, StockHistoryDisposalCsv.php:108, StockHistoryDisposalCsv.php:65` | RG-001,006 |  |
| m04-20 | 新規実装 | 乖離 | 出力対象は「在庫履歴検索一覧(検索入力)の検索条件でデータを取得」（Excel 0202:L11122） | `StockHistoryController.php:337, src/Eccube/Repository/DtbStockHistoryRepository.php:404` | RG-004 |  |
| m04-20 | 新規実装 | 乖離 | CSV行順は「一覧表示されている順番と同じ順」（Excel 0202:L11123）。具体ソートキーは Excel M04-20 非記載（別シート参照 0202:L11124） | `DtbStockHistoryRepository.php:411` | RG-005 |  |
| m04-22 | 新規実装 | 乖離 | 1ファイル登録上限は移動10,000件・振替2,000件（Excel `0202:L11781`,`0202:L12122`） | `src/Eccube/Controller/AbstractController.php:364, StockMoveTransferController.php:252` | RG-009,023 |  |
| m04-22 | 新規実装 | 乖離 | 1-4 承認通知先（メンバー選択）は必須（○）（Excel `0202:L12140`） | `src/Eccube/Form/Type/Admin/StockTransferCsvImportType.php:88` | RG-019 |  |
| m04-22 | 新規実装 | 乖離 | アップロードされたファイルがcsv以外の場合はエラー（Excel `0202:L11777`,`0202:L12119`） | `StockMoveCsvImportType.php:115, StockTransferCsvImportType.php:105` | RG-007,021 |  |
| m05-11 | カスタマイズ | 乖離 | 注文者/お届け先の氏名は全角半角50文字、フリガナ50文字、住所1/2/3は90文字（Excel 0203:L5098-5101,L5108-5110,L5209-5220） | `app/config/eccube/packages/eccube.yaml:171, src/Eccube/Form/Type/NameType.php:105, eccube.yaml:172, KanaType.php:62, src` | RG-049,050 |  |
| m06-10 | 新規実装 | 乖離 | 色/R は「商品名から取り出した色とレアリティを出力（例: 金R）」（Excel 0205:L1941） | `src/Eccube/Repository/DtbOtcBuyOrderRepository.php:589, src/Eccube/Service/Csv/Exporter/RestockListCsvRowFormatter.php:8` | RG-008 |  |
| m06-10 | 新規実装 | その他 | 商品名は「略称・言語・状態・色・レアリティを取り除く」（Excel 0205:L1943） | `RestockListCsvRowFormatter.php:174` | 青 |  |
| m06-10 | 新規実装 | 乖離 | 言語/状態は「言語/状態の形式で出力する（例: FoilJP/NM）」（Excel 0205:L1939） | `RestockListCsvRowFormatter.php:147` | RG-005 |  |
| m06-11 | 新規実装 | 乖離 | PDF出力の副作用をExcel未記載（0205:L2093-L2135 は表示・取得・整形・並びのみ。出力時の状態更新の記述なし） | `ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/OtcBuyOrderRestockListService.php:53` |  |  |
| m06-11 | 新規実装 | 乖離 | 「印刷する」ボタン押下→PC端末の印刷ダイアログ表示→印刷（0205:L2096・item1 0205:L2122）。機能名は「戻しリストPDF出力」（0205:L2038） | `OtcBuyOrderController.php:632` |  |  |
| m06-11 | 新規実装 | 乖離 | 対象ステータスの絞り込みをExcel未記載 | `OtcBuyOrderRestockListService.php:119` |  |  |
| m06-11 | 新規実装 | 乖離 | 「対象店舗ごとに指定された閾値情報で分けて取得」（0205:L2098）＝店舗ごとの帯分割は規定するが、単一店舗のみ許可の制約は未記載 | `OtcBuyOrderRestockListService.php:131` |  |  |
| m06-12 | 新規実装 | 乖離 | 基準価格：状態がない場合は何も出力しない（Excel `0205:L1753`） | `src/Eccube/Repository/DtbOtcBuyOrderRepository.php:507` | RG-002／DP-04 |  |
| m06-12 | 新規実装 | 乖離 | 言語ID：個別入力商品または状態がない場合は[1:日本語]固定（Excel `0205:L1755`） | `DtbOtcBuyOrderRepository.php:509` | RG-002,005／DP-06 |  |
| m06-12 | 新規実装 | 乖離 | 略称タグ：状態がない場合は何も出力しない（Excel `0205:L1756`） | `DtbOtcBuyOrderRepository.php:510` | RG-002／DP-07 |  |
| m06-12 | 新規実装 | 乖離 | レアリティ：状態がない場合は何も出力しない（Excel `0205:L1757`） | `DtbOtcBuyOrderRepository.php:511` | RG-002／DP-08 |  |
| m07-08 | 新規実装 | その他 | 出力対象のキャンセル除外は Excel M07-08 に記載なし（沈黙） | `src/Eccube/Repository/DtbBuyOrderRepository.php:848` | RG-015 |  |
| m08-04 | カスタマイズ | 乖離 | 郵便番号（識別ID:8/9）は任意（Excel 0207:L2474,L2475 必須-）／詳細設計も「氏名カナ・郵便番号の必須解除」（L351,L376） | `src/Eccube/Form/Type/Admin/CustomerType.php:79` | RG-028,DV-17 |  |
| m08-04 | カスタマイズ | 乖離 | 新規登録機能は廃止（Excel 0207:L2414） | `src/Eccube/Controller/Admin/Customer/CustomerEditController.php:64` | RG-004,017 |  |
| m08-04 | カスタマイズ | その他 | 退会区分（識別ID:42）を追加・最大255（Excel 0207:L2458,L2508）＝BANした会員の退会区分記載項目 | `src/Eccube/Form/Type/Admin/CustomerType.php:167, app/config/eccube/packages/eccube.yaml:137, src/Eccube/Entity/Customer.` | RG-015 |  |
| m10-04 | 現行踏襲 | 乖離 | 手数料は必須の数値（整数）（Excel 2-3 必須〇 0209:L2306／詳細設計 L365「手数料設定可のとき必須」） | `src/Eccube/Form/Type/Admin/PaymentRegisterType.php:124` | RG-012,027(DV-03) |  |
| m10-04 | 現行踏襲 | 乖離 | 利用条件の下限・上限はそれぞれ非負整数文字列（数字パターン）と桁上限を満たす（詳細設計 L365,L386／Excel 2-6 数値整数 0209:L2309） | `PaymentRegisterType.php:98` | RG-027(DV-13) |  |
| m10-04 | 現行踏襲 | 乖離 | 表示順は「上へ」「下へ」で隣接行とランクを入替（詳細設計 L351-354・L336「一覧のドラッグ並べ替え…は扱わない」／Excel 操作リンク 0209:L2294） | `PaymentController.php:378` | RG-020,021,022 |  |
| m10-04 | 現行踏襲 | 乖離 | 手数料設定可否が不可のとき保存直前に手数料0へ置換（詳細設計 L344,L360,L365／現行pf plugin 実装 chargeFlg==2→setCharge(0)） | `—` | RG-012 |  |
| m10-04 | 現行踏襲 | 乖離 | 削除は論理削除（del_flg→非表示）で物理削除は行わない（詳細設計 L330「物理削除は当機能では行わない」,L350） | `PaymentController.php:337, src/Eccube/Repository/AbstractRepository.php:48, src/Eccube/Controller/Admin/Setting/Shop/Pay` | RG-017 |  |
| m10-04 | 現行踏襲 | 乖離 | 削除後は論理削除されていない全行を昇順で取り直し「削除行を除いて」1から再採番（詳細設計 L350） | `PaymentController.php:324` | RG-017 |  |
| m10-04 | 現行踏襲 | 乖離 | 利用条件は両方入力かつ上限が下限未満ならエラー（詳細設計 L360 判定順序2,L386） | `PaymentRegisterType.php:131` | RG-027(DV-11) |  |
| m10-06 | 現行踏襲 | 乖離 | 登録（編集）成功時は「成功フラッシュを積んで配送方法一覧へリダイレクトする」（正本 L348 手順10／画面遷移表 L392「編集で登録に成功→配送方法一覧」） | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Setting/Shop/DeliveryController.php:159, pf-eccube3/src/Eccube/Control` | RG-011,025 |  |
| m10-06 | 現行踏襲 | 乖離 | 追加のフォーム項目は「追加フォーム枠にループ表示される条件がある」と総称的に触れるのみ（正本 L336）。基本情報項目は配送業者名/名称/伝票No.URL/商品種別のみ列挙（L364,L386） | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Setting/Shop/DeliveryController.php:84, ec-cube-enterprise/src/Eccube/` | RG-028 |  |
| m10-06 | 現行踏襲 | 乖離 | 配送業者名・名称は「Symfony Length制約は無し（DBはtext型）」＝文字数上限なし（正本 L364）。DBカラム節でも name/service_name に長さ記載なし（L380） | `ec-cube-enterprise/src/Eccube/Entity/Delivery.php:65` | RG-033 |  |
| m10-06 | 現行踏襲 | 乖離 | 編集画面組立時に「全ての都道府県について配送料を検索または作成し、金額が空の行のみ関連付け、都道府県ID昇順で並べ替える」（正本 L344 手順3-4・L346 手順2） | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Setting/Shop/DeliveryController.php:163, src/Eccube/Controller/Admin/S` | RG-008,009 |  |
| m10-16 | カスタマイズ | 乖離 | 査定払出し連絡用経理部門メールアドレスは「任意」（Excel 0209:L4058 必須列=-） | `src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:195` | RG-022 |  |
| m10-16 | カスタマイズ | 乖離 | 入荷通知メールの許可は Excel で「任意・全角半角許容」（Excel 0209:L4048） | `AdditionalSystemFormType.php:116, ConfigType.php:183` | RG-018 |  |
| m10-16 | カスタマイズ | 乖離 | スマレジ契約ID・アクセストークンは「半角英数、スペース」（Excel 0209:L4044,L4045） | `AdditionalSystemFormType.php:83, ConfigType.php:91` | RG-014,015 |  |
| m10-16 | カスタマイズ | 乖離 | 英語サイト専用タグID・固定価格商品部門IDは「必須」（Excel 0209:L4060,L4050） | `ConfigType.php:305, AdditionalSystemFormType.php:210` | RG-020,024 |  |
| m10-16 | カスタマイズ | 乖離 | （詳細設計ハルシネーション是正）成功フラッシュ翻訳キーは詳細設計 L355=`admin.register.complete` | `AdditionalSystemController.php:103, ConfigController.php:64` | RG-002 |  |
| m10-16 | カスタマイズ | 乖離 | Excel 入力項目表（0209:L4040–4062）が当画面の項目集合の正 | `AdditionalSystemFormType.php:76` | §5 台帳 |  |
| m10-16 | カスタマイズ | 乖離 | Excel 0209:L4013,L4014 は スマレジ店舗ID／スマレジ部門ID を「削除」と明示 | `AdditionalSystemFormType.php:80, messages.ja.yaml:4208` | §0 |  |
| m13-02 | カスタマイズ | 乖離 | クレジットカード決済をオフで更新時、紐づく日程に参加費が有料かつオンライン受付ありの日程が存在すればエラー（Excel 0214:L1607） | `pf-eccube3/.../Admin/EventController.php:115` | RG-007 |  |
| m13-04 | 現行踏襲 | 乖離 | 受付ありの場合、受付終了時間（entryEndDate）は受付終了時刻から生成して保存すべき（Excel 0214:L2477・正本 L346 entry_flg/日程作成） | `RepeatScheduleController.php:104, src/Eccube/Service/Admin/Event/RepeatScheduleStoreAction.php:70` | RG-007 |  |
| m13-04 | 現行踏襲 | 乖離 | 期間To（Excel 0214:L2472 必須〇）・開始時間（Excel 0214:L2474 必須〇）は必須 | `Form/Type/Admin/Schedule/RepeatScheduleType.php:40` | RG-002,DV-02,DV-03 |  |
| m13-04 | 現行踏襲 | 乖離 | 受付ありの場合、受付開始時間 < 受付終了時間（Excel 0214:L2476） | `RepeatScheduleType.php:60` | RG-008,DV-04 |  |
| m13-04 | 現行踏襲 | 乖離 | デッキ登録締切開始日前日数・オンライン受付各開始日前日数は数値（整数）（Excel 0214:L2479,L2482,L2484） | `RepeatScheduleType.php:112` | DV-07,DV-08 |  |
| m13-04 | 現行踏襲 | 乖離 | 受付終了時間 <= 開始時間であること（Excel 0214:L2477・等号を含む） | `RepeatScheduleType.php:68` | RG-008,DV-05 |  |
| m13-04 | 現行踏襲 | その他 | 設計（オラクル） | `—` |  |  |
| m13-04 | 現行踏襲 | その他 | 定員・参加費・公開状態・商品(日英)は親イベントのものをセット（Excel 0214:L2459） | `app/Plugin/HareruyaEc/Entity/DtbEventDetail.php:166` |  |  |
| m13-04 | 現行踏襲 | その他 | 期間内の選択曜日に該当する日に日程作成（Excel 0214:L2457,L2458） | `RepeatScheduleController.php:90` |  |  |
| m13-04 | 現行踏襲 | その他 | 存在しないイベントIDは404（正本 L325,L358） | `RepeatScheduleController.php:54` |  |  |
| m13-04 | 現行踏襲 | その他 | 申込受付有効で支払い方法未設定なら申込受付不可（正本 L328,L358） | `RepeatScheduleController.php:73` |  |  |

## §3. 要実機確認・軽微（P3）

（31件）

| 機能 | 区分 | 分類 | 乖離内容（設計→実装） | file:line | 対象RG | 裁定 |
|---|---|---|---|---|---|---|
| a01-02 | 新規実装 | 要実機確認 | 在庫変動区分の表記：A01-02本文は「02:取引」(0501:L1513)、A01-01 1-2/区分定義は「02:売上」(0501:L1091,L1092) | `SmaregiStockChangeApplier.php:45` | RG-004 |  |
| a01-02 | 新規実装 | 要実機確認 | 実行タイミングは「毎時16分」(0501:L1506) だが「バッチ処理は閉店後1回のみ」(0501:L1504) とも規定＝Excel内で競合 | `SmaregiStockBackfillCommand.php:30` | RG-015 |  |
| a06-02 | カスタマイズ | 要実機確認 | 所属店舗の絞り込みは会員サブ（dtb_member_sub）のshop_id、移行先 enterprise では会員（dtb_member）の base_info_id / member_base_info（詳細設計 L | `src/Controller/Admin/OtcBuyOrderController.php:35, src/Repository/DtbOtcBuyOrderRepository.php:50` | RG-001,002 |  |
| a07-02 | 現行踏襲 | 要実機確認 | memberName 意味：Excel 0507:L1148 は「memberName ＝ 査定担当者」、詳細設計 L339 は「申込者を登録した会員名」（オラクル間で意味が異なる） | `src/Repository/DtbBuyOrderRepository.php:53` | RG-005,010 |  |
| a07-02 | 現行踏襲 | 要実機確認 | 抽出対象ステータス：Excel 0507:L1128（概要）は 4種（商品到着・査定中・査定中断・査定再開）。応答配列説明 Excel 0507:L1144 は 5種（「商品到着・査定前・査定中・査定中断・査定再開」＝" | `src/Repository/DtbBuyOrderRepository.php:35` | RG-002 |  |
| a17-03 | 現行踏襲 | 要実機確認 | Excel 0517:L1843 は pointAttr を連携内容の1項目として例示（必須/任意の明示なし）／詳細設計 L359 は point_type_id を履歴列に記載 | `PointGranterController.php:58, PointGranterAction.php:50` |  |  |
| b05-01 | 現行踏襲 | 要実機確認 | 一次オラクル（Excel優先）: 連携（商品/在庫）失敗時はエラーメールを送信、送信先＝追加設定のスマレジ通信エラー送信メールアドレス（Excel 0405:L1056-1057,L1062-1063,L1087）。詳細 | `.../SmaregiOtcOrderPostAction.php:70, OtcOrderSmaregiPostCommand.php:52` | RG-011,023 |  |
| b13-02 | 現行踏襲 | 要実機確認 | 抽出対象はコンビニ決済で入金待ちのイベント申込（正本 集計条件 L319,L325）。時間窓は詳細設計では非明示 | `CheckCvsPaymentEntry.php:18, DtbEventEntryRepository.php:64` |  |  |
| b17-01 | 現行踏襲 | 要実機確認 | 出力ファイルは latestArticleList.json（現行/移行先で同一・L221）。保存先の格納機構は詳細設計が規定せず | `AbstractListText.php:23, CreateLatestArticleListAction.php:87` | RG-004 |  |
| f04-04 | 現行踏襲 | 要実機確認 | 店内アカウント=TC注文番号を表示（Excel 0304:L2562） | `...Shopping/complete.twig:34` | **設計どおり✓（下4桁表示は要実機確認）** |  |
| f06-21 | 現行踏襲 | 要実機確認 | 退会確定時に会員ステータスを退会状態で管理するか（詳細設計L322「customer_status_id・close_reason で併せて管理するかは要確認」） | `WithdrawController.php:126, WithdrawController.php:94` | RG-004 |  |
| m03-30 | カスタマイズ | 要実機確認 | セール中(有効)時の買取価格の扱い（Excel 内部矛盾：見出し `0204:L10050`「セール中商品の販売価格、買取価格は変更できない、参照販売価格、参照買取価格は変更できる。」＝実販売/実買取は変更不可・参照販売 | `ProductPriceImportHandler.php:349` | RG-002 |  |
| m04-09 | 新規実装 | 要実機確認 | 移動点数が現在の在庫より多い場合はエラー（Excel 0202:L4965＝汎用記述） | `—` | DV-03（RG-005） |  |
| m04-09 | 新規実装 | 要実機確認 | 在庫承認一覧（DtbStockApprovalList/dtb_stock_approval_list）への登録・確定、および「単一トランザクションで確定／失敗時に一切確定しない」というTX境界の断定 | `src/Eccube/Service/Admin/Stock/StockTransferStoreAction.php:163, src/Eccube/Service/Admin/Stock/StockMoveOutboundApprova` | RG-021,014,015・§1副作用 |  |
| m04-10 | 新規実装 | 要実機確認 | Excel基本設計（0202 M04-10 L7040-7084）はログ出力を規定しない（CSV出力項目14列＋カスタマイズ要件のみ）＝ログはExcel沈黙部の補完対象外の実装由来副作用 | `src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:112` | RG-010 |  |
| m04-14 | 新規実装 | 要実機確認 | 列8「分割先在庫数（分割）／結合元点数（結合）」（Excel 0202:L9672） | `StockSplitJoinCsvExportService.php:122` | RG-009,026 |  |
| m04-20 | 新規実装 | 要実機確認 | 出力対象は「欠品のみ」（Excel 0202:L11082） | `DtbStockHistoryRepository.php:143` | RG-002 |  |
| m04-23 | 新規実装 | 要実機確認 | CSRF保護の有無・方式は Excel M04-23 に記載なし（オラクル沈黙） | `ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:228` | RG-039 |  |
| m04-23 | 新規実装 | 要実機確認 | エラー時は「元画面でエラーを扱う・モーダル選択内容リセット」まで（Excel 0202:L12473,0202:L12474）。トランザクション原子性は非記載 | `—` | RG-011 |  |
| m04-23 | 新規実装 | 要実機確認 | 承認通知先メンバー選択フォームの選択肢供給元はExcel非記載（0202:L12487は用途のみ） | `ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:427` | RG-041 |  |
| m04-23 | 新規実装 | 要実機確認 | 取込履歴の記録有無はExcel非記載 | `—` | §5台帳(取込履歴) |  |
| m04-30 | 新規実装 | 要実機確認 | 対象0件時の挙動はExcel未規定（0202:L14649「商品コードリストを出力」のみ）＝要実機確認 | `src/Eccube/Service/Csv/Exporter/BarcodeReplacementListCsvExportService.php:73` | RG-023 |  |
| m04-30 | 新規実装 | 要実機確認 | CSRF保護はExcel未規定＝要実機確認 | `src/Eccube/Form/Type/Admin/BarcodeReplacementListType.php:101, src/Eccube/Controller/Admin/Stock/BarcodeReplacementListC` | RG-025 |  |
| m06-11 | 新規実装 | 要実機確認 | 権限（買取店舗の編集権限）をExcel未記載。正本 L302 は共通設計/実装に委譲 | `OtcBuyOrderRestockListService.php:101` |  |  |
| m06-11 | 新規実装 | 要実機確認 | 空選択・対象なし時の挙動をExcel未記載 | `OtcBuyOrderController.php:642, OtcBuyOrderRestockListService.php:96` |  |  |
| m06-11 | 新規実装 | 要実機確認 | CSRF・HTTPメソッド・routeをExcel未記載（実装を正とTODO・正本 L291,L312） | `OtcBuyOrderController.php:627` |  |  |
| m06-11 | 新規実装 | 要実機確認 | 基準価格nullの区分をExcel未記載（閾値区分は 0205:L2123 の3帯+サプライのみ） | `RestockListPdfSectionBuilder.php:31` |  |  |
| m07-08 | 新規実装 | 要実機確認 | 出力対象のステータス条件は Excel M07-08 に記載なし（沈黙） | `src/Eccube/Service/Admin/Purchase/BuyOrderRestockListService.php:30` | RG-015 |  |
| m07-08 | 新規実装 | 要実機確認 | サプライ品の商品名出力は Excel 0206:L2104 が非サプライのみ規定しサプライ品時を明示しない（沈黙） | `src/Eccube/Service/Csv/Exporter/RestockListCsvRowFormatter.php:84` | RG-014 |  |
| m07-08 | 新規実装 | 要実機確認 | ルート/メソッド/レスポンス形式/ファイル名/ヘッダ行は Excel M07-08 に記載なし（沈黙） | `src/Eccube/Controller/Admin/Purchase/PurchaseController.php:637, BuyOrderRestockListCsvExportService.php:79, PurchaseCon` | RG-017,018 |  |
| m07-08 | 新規実装 | 要実機確認 | 出力CSVの並び順は Excel M07-08 に記載なし（沈黙） | `src/Eccube/Repository/DtbBuyOrderRepository.php:844` | RG-019 |  |

## 参考: 一致(非バグ)＝実装が設計どおり検証済み

55件は実装が設計を満たすことを確認済み（裁定不要・網羅性の証跡）。詳細は各 `_poc2_*.md` の付帯表4を参照。

---

※ 本レジスタは _poc2（第1-4バッチ69機能）から機械抽出。承認済み4機能(_poc_)の乖離は各ファイル参照。
※ file:line は `../pf-eccube3`（現行）/`../ec-cube-enterprise`（移行先）。抽出の都合で一部欠落あり＝原文の付帯表4を正とする。
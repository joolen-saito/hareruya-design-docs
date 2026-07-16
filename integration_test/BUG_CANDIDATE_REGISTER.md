# 付帯表4 バグ候補レジスタ（設計 vs 実装の乖離・裁定用）

> 更新: 2026-07-16 ／ 出典: `integration_test/_poc2_*.md` の付帯表4（69機能・第1-4バッチ）

**目的**: オラクル独立アプローチで検出した設計(Excel/詳細設計)と実装の乖離を、業務側/設計オーナーが裁定するための一覧。各行は「テスト期待には使っていない」実装事実の記録＝**バグか設計陳腐化かをここで確定**する。

**裁定欄(最右)の記入例**: `実バグ→実装修正` / `設計修正(Excel誤り)` / `詳細設計修正` / `仕様どおり→対応不要` / `保留`。

**判定列の見方**: 「設計はこうあるべき」に対し「実装はこうなっている」の結論。file:line で実装箇所を特定できる。

## サマリ

- 付帯表4 総行数 **430**（69機能）。うち **一致(非バグ)=55** は実装が設計どおりの検証済み（裁定不要・網羅の証跡）。
- **要裁定 = 289件**（P1=123・P2=221）

| 分類 | 優先 | 件数 | 説明 |
|---|---|---|---|
| 移行退行疑い | P1 | 39 | pf-eccube3→enterprise移行で挙動が変わった疑い（最重要） |
| 未実装疑い | P1 | 53 | 設計にあるが実装に無い疑い |
| 設計誤り疑い | P1 | 18 | 詳細設計/Excelのハルシネーション・不正確 |
| バグ候補 | P1 | 13 | 実装が仕様違反の疑い |
| 乖離 | P2 | 166 | 設計と実装の一般的な食い違い |
| その他 | P2 | 55 | 判定文が定型外(要目視) |
| 要実機確認 | P3 | 31 | オラクル沈黙・実機で確定 |
| 一致(非バグ) | — | 55 | 実装が設計どおり（裁定不要） |

## §1. 最優先バグ候補（P1: 移行退行・未実装・設計誤り・バグ候補）（123件）

| 機能 | 区分 | 分類 | 判定（設計→実装の食い違い） | file:line | RG | 裁定 |
|---|---|---|---|---|---|---|
| a01-02 | 新規実装 | 未実装疑い | 乖離（取得期間の粒度違い・時間窓未実装） | `src/Eccube/Command/SmaregiStockBackfillCommand.php:44, src/Eccube/Service/Smaregi/Stock/SmaregiStockBackfillAction.php:6` | RG-002 |  |
| a02-05 | 現行踏襲 | 設計誤り疑い | 乖離（詳細設計の DB操作節 L378-379「登録/更新・persist/flush で直接確定」・業務ルール節 L370「保存する」は参照系APIに機械適用された総称テンプレ＝ハルシネーション。副作用L366/排他L388と自己矛盾。実装は read-on | `src/Eccube/Controller/App/ProductController.php:232, ProductRepository.php:2194` | RG-013,016,017 |  |
| a05-01 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ未実装） | `config/routes.yaml:73, src/Controller/Admin/OrderController.php:33` | RG-001,012,023 |  |
| a05-01 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ未実装） | `src/Repository/DtbOrderRepository.php:21` | RG-002 |  |
| a05-01 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ未実装・既知不具合残存） | `src/Controller/Admin/OrderController.php:73, OrderController.php:203` | RG-004 |  |
| a05-01 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ未実装） | `src/Controller/Admin/OrderController.php:31` | RG-012 |  |
| a05-01 | カスタマイズ | 設計誤り疑い | 乖離（詳細設計ハルシネーション・要是正） | `src/Controller/Admin/OrderController.php:120` | RG-015,021 |  |
| a05-01 | カスタマイズ | 設計誤り疑い | 乖離（詳細設計ハルシネーション・要是正） | `src/Controller/Admin/OrderController.php:54` | RG-013 |  |
| a05-01 | カスタマイズ | バグ候補 | 乖離（実装バグ候補・条件貫通）／要実機確認 | `src/Repository/DtbOrderRepository.php:21` | RG-001,004,011 |  |
| a05-02 | カスタマイズ | 未実装疑い | 乖離（エンドポイント分離 未実装） | `config/routes.yaml:73, OrderController.php:33` | RG-012 |  |
| a05-02 | カスタマイズ | 未実装疑い | 乖離（IP制限 アプリ側未実装・実機確認要） | `OrderController.php:31` | RG-011 |  |
| a05-02 | カスタマイズ | 未実装疑い | 乖離（★エラーコード検査・ログ追記 未実装） | `OrderController.php:91` | RG-004 |  |
| a05-04 | カスタマイズ | 未実装疑い | 乖離（プラットフォームAPI化 未実装） | `app/Plugin/HareruyaEc/Controller/SmaregiController.php:28` | RG-011 |  |
| a05-04 | カスタマイズ | 未実装疑い | 乖離（本支店統合 未実装・支店転送継続） | `SmaregiController.php:66` | RG-010,012 |  |
| a05-04 | カスタマイズ | 未実装疑い | 乖離（受注登録★3・購入パターン分岐 未実装） | `SmaregiController.php:66` | RG-004,006,007,008,009 |  |
| a05-04 | カスタマイズ | 未実装疑い | 乖離（IP制限 アプリ側未実装・実機確認要） | `SmaregiController.php:26` | RG-016 |  |
| a06-01 | 現行踏襲 | 移行退行疑い | 乖離（移行先の中継先未実装・現行の会員サブ依存が移行先仕様と不整合） | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Api/AdminLoginController.php:12` | RG-002 |  |
| a06-02 | カスタマイズ | 設計誤り疑い | 乖離（詳細設計の記述漏れ・ハルシネーション是正） | `src/Repository/DtbOtcBuyOrderRepository.php:56, src/Controller/Admin/OtcBuyOrderController.php:35` | RG-020 |  |
| a06-03 | カスタマイズ | 未実装疑い | 乖離（未実装・カスタマイズ未達） | `src/Controller/Admin/OtcBuyOrderController.php:58` | RG-021,022 |  |
| a06-03 | カスタマイズ | 未実装疑い | 乖離（未実装・カスタマイズ未達） | `OtcBuyOrderController.php:199` | RG-023,024 |  |
| a06-03 | カスタマイズ | 未実装疑い | 乖離（未実装・入力項目/連携欠落） | `src/Entity/Api/OtcBuyOrderEdit.php:11, OtcBuyOrderController.php:116` | RG-025 |  |
| a06-03 | カスタマイズ | 未実装疑い | 乖離（未実装・エンティティ列欠落） | `OtcBuyOrderController.php:181, src/Entity/DtbOtcBuyOrderStock.php:17` | RG-011,026 |  |
| a06-03 | カスタマイズ | 未実装疑い | 乖離（未実装・要実機確認） | `OtcBuyOrderController.php:199` | RG-033 |  |
| a06-16 | 新規実装 | 設計誤り疑い | 乖離（3者不一致・詳細設計ハルシネーション是正） | `OtcBuyOrderController.php:239` | RG-004,005 |  |
| a07-02 | 現行踏襲 | 設計誤り疑い | 詳細設計のハルシネーション（Excel＝実装＝文字列。競合ルールでExcel採用） | `src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:72` | RG-010,023 |  |
| a07-02 | 現行踏襲 | 設計誤り疑い | 詳細設計のハルシネーション/乖離（Excel採用） | `BuyOrderController.php:73` | RG-023 |  |
| a07-02 | 現行踏襲 | 移行退行疑い | 乖離（移行での連結挙動差）／要実機確認 | `BuyOrderController.php:65` | RG-004 |  |
| a17-03 | 現行踏襲 | バグ候補 | バグ候補（要確定）: Excel基本設計は404を要求するが実装は両系とも400。実バグ（実装が仕様違反）か、Excelの誤り（実運用は400が正）かは連携元(PointGranter)期待値で要確定。詳細設計HTMLはExcelに合わせ404へ是正すべき | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Api/PointGranterController.php:27, ec-cube-enterprise/src/Eccube/Controller/` |  |  |
| a17-03 | 現行踏襲 | 設計誤り疑い | 設計書乖離: 実際に加算されるのはプレイヤー(`dtb_player.point`)。詳細設計DBカラム表の `dtb_customer.point` は不正確。履歴の customer_id は `$Player->getCustomer()` 由来で会員に | `PointGranterController.php:50, PointGranterAction.php:66, DtbPlayer.php:89` |  |  |
| a17-03 | 現行踏襲 | バグ候補 | バグ候補（要検証）: 連携元(PointGranter)が送るヘッダ名と移行先の受信キーが不一致だと、必須ヘッダ欠落と誤判定し全リクエストが400/404に落ちうる。移行時の受信キー整合を要確認 | `PointGranterController.php:26, PointGranterController.php:47` |  |  |
| a17-03 | 現行踏襲 | バグ候補 | バグ候補（現行）: 現行は堅牢性欠如（構造不正で異常終了しうる）。移行先は是正済み。オラクル沈黙部のため期待は要実機確認（§3 DP-05） | `PointGranterController.php:45, PointGranterController.php:82` |  |  |
| a17-03 | 現行踏襲 | 移行退行疑い | 参考（乖離軽微）: 移行先は加算＋履歴をトランザクションで原子化し片側更新を防止（RG-015連携整合の実装が堅牢化）。現行はflush一括で概ね同等。裏取り記録 | `PointGranterController.php:59, PointGranterAction.php:57` |  |  |
| b02-07 | カスタマイズ | 移行退行疑い | 乖離（詳細設計のコマンド名が移行先実装と不一致） | `app/Plugin/HareruyaEc/Command/ProductBatch.php:17, src/Eccube/Command/UpdateWeeklyStockHistoryCommand.php:35` | RG-001,012 |  |
| b02-07 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ未達・スマレジ合算未実装）／要実機確認 | `src/Eccube/Service/Product/BatchUpdateWeeklyStockHistoryAction.php:41, DtbWeeklyStockHistoryTempRepository.php:69` | RG-003,018 |  |
| b02-07 | カスタマイズ | 移行退行疑い | 乖離（移行先の「最新」がidベースで作成日順と乖離しうる）／要実機確認 | `app/Plugin/HareruyaEc/Repository/DtbStockHistoryRepository.php:227, src/Eccube/Repository/DtbWeeklyStockHistoryTempRepos` | RG-002(DW-01,02) |  |
| b05-01 | 現行踏襲 | 移行退行疑い | 乖離（詳細設計の入口記述が移行先実装と不一致） | `src/Eccube/Command/OtcOrderSmaregiPostCommand.php:25, app/Plugin/HareruyaEc/Command/OrderBatch.php:13` | RG-001,009 |  |
| b05-02 | 現行踏襲 | 移行退行疑い | 乖離（現行バグ・移行先で是正） | `pf-eccube3/app/Plugin/HareruyaEc/Service/Order/ResendMail.php:50, ec-cube-enterprise/src/Eccube/Service/Admin/Order/Rese` | RG-017,022 |  |
| b05-02 | 現行踏襲 | 移行退行疑い | 乖離疑義（TZ不一致・移行退行）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Repository/OrderRepository.php:1445, ec-cube-enterprise/src/Eccube/Repository/OrderRepo` | RG-004(DV-07〜09) |  |
| b05-04 | 現行踏襲 | 移行退行疑い | 乖離（Excelカスタマイズ未実装／プラットフォームAPI移行未完） | `app/Plugin/HareruyaEc/Service/SmaregiService.php:63` | RG-001,002,011 |  |
| b05-05 | 現行踏襲 | 移行退行疑い | 乖離（移行でコマンド体系変更・詳細設計コマンド名は移行先に不在） | `app/Plugin/HareruyaEc/Command/OrderBatch.php:17, src/Eccube/Command/SmaregiOtcDeleteCommand.php:39` | RG-012,013 |  |
| b05-05 | 現行踏襲 | 移行退行疑い | 乖離（Excel内不整合＋現行/移行先で抽出ステータス集合が相違） | `app/Plugin/HareruyaEc/Repository/DtbOrderSubRepository.php:170, app/Plugin/HareruyaEc/Entity/OrderStatus.php:12, src/Ecc` | RG-004,005,006 / DP-03 |  |
| b05-05 | 現行踏襲 | 移行退行疑い | 乖離（Excel要求のエラーメール通知が移行先で未実装） | `app/Plugin/HareruyaEc/Service/SmaregiService.php:53, src/Eccube/Service/Smaregi/Otc/SmaregiOtcDeleteService.php:70, src/` | RG-015,016 |  |
| b05-06 | 現行踏襲 | 移行退行疑い | 乖離（詳細設計のコマンド名が移行先実装と不一致） | `app/Plugin/HareruyaEc/Command/OrderBatch.php:28, src/Eccube/Command/CheckDuplicatePointCommand.php:34` | RG-009,011 |  |
| b05-06 | 現行踏襲 | 移行退行疑い | 乖離（Excel「特になし」に対し移行先はエラーハンドリング追加・現行踏襲でない） | `app/Plugin/HareruyaEc/Service/Order/CheckDuplicatePoint.php:30, src/Eccube/Command/CheckDuplicatePointCommand.php:48` | RG-008 |  |
| b05-07 | 現行踏襲 | 移行退行疑い | 乖離（コマンド名相違・移行で入口変更） | `app/Plugin/HareruyaEc/Command/OrderBatch.php:19, src/Eccube/Command/CheckNotReflectedPointUsageCommand.php:34` |  |  |
| b05-07 | 現行踏襲 | 移行退行疑い | 乖離（現行 pf-eccube3 の実装バグ・移行で是正） | `app/Plugin/HareruyaEc/Service/MailService.php:1531, src/Eccube/Service/MailService.php:2291` |  |  |
| b05-07 | 現行踏襲 | 設計誤り疑い | 乖離（詳細設計のハルシネーション・実装と不一致） | `src/Eccube/Repository/OrderRepository.php:1934` |  |  |
| b05-07 | 現行踏襲 | 未実装疑い | 乖離（現行 pf-eccube3 正常系のコンソール出力未実装） | `OrderBatch.php:44, MailService.php:1525, CheckNotReflectedPointUsageCommand.php:52` |  |  |
| b05-07 | 現行踏襲 | 未実装疑い | 乖離（現行 pf-eccube3 のエラーハンドリング未実装） | `Service/Order/CheckNotReflectedPointUsage.php:24, OrderBatch.php:51, CheckNotReflectedPointUsageCommand.php:54` |  |  |
| b05-08 | 現行踏襲 | 移行退行疑い | 乖離（移行時カスタマイズ要件・現行未実装） | `—` | RG-007,008 |  |
| b05-09 | 現行踏襲 | 未実装疑い | 乖離（未実装・受注キャンセル欠落） | `CheckSmaregiTransaction.php:166` | RG-010 |  |
| b05-09 | 現行踏襲 | 未実装疑い | 乖離（未実装・手動期間指定不可） | `CheckSmaregiTransaction.php:136, app/Plugin/HareruyaEc/config.yml:283` | RG-004 |  |
| b08-02 | 現行踏襲 | 移行退行疑い | 乖離（enterpriseで退行・要実機確認） | `app/Plugin/HareruyaEc/Service/Customer/LostPoints.php:56, src/Eccube/Service/Admin/Customer/LostPointsAction.php:78` | RG-007 |  |
| b08-02 | 現行踏襲 | 移行退行疑い | 乖離（enterpriseで外部連携整合退行・要実機確認） | `LostPoints.php:45, LostPointsAction.php:68` | RG-006,009 |  |
| b08-02 | 現行踏襲 | 移行退行疑い | 乖離（コマンド名の移行差異・要実機確認） | `app/Plugin/HareruyaEc/Command/CustomerBatch.php:14, src/Eccube/Command/LostPointsCommand.php:25` | RG-011,012 |  |
| b08-03 | 現行踏襲 | 移行退行疑い | 乖離（移行でコマンド名改称・設計/現行と不一致）／要実機確認 | `app/Plugin/HareruyaEc/Command/CustomerBatch.php:16, src/Eccube/Command/PointExpireNotificationCommand.php:25` | RG-001,012 |  |
| b08-03 | 現行踏襲 | 移行退行疑い | 乖離（移行先の開始/完了ログに日時なし） | `...CustomerBatch.php:50, ...PointExpireNotificationCommand.php:38` | RG-013 |  |
| b08-05 | 現行踏襲 | 設計誤り疑い | 乖離（詳細設計HTMLのハルシネーション：dtb_point_history更新なし） | `AdjustPointVariance.php:35, src/Eccube/Service/Admin/Customer/AdjustPointVarianceAction.php:54, AdjustPointVariance.php:` | RG-016 |  |
| b08-05 | 現行踏襲 | 移行退行疑い | 乖離（移行での起動コマンド不一致） | `app/Plugin/HareruyaEc/Command/CustomerBatch.php:26, src/Eccube/Command/AdjustPointVarianceCommand.php:25` | RG-012,013 |  |
| b08-05 | 現行踏襲 | 未実装疑い | 乖離（現行pfはエラーハンドリング未実装／設計三者で不一致） | `AdjustPointVarianceAction.php:67, AdjustPointVarianceCommand.php:42, AdjustPointVariance.php:30` | RG-014 |  |
| b08-05 | 現行踏襲 | 移行退行疑い | 乖離（複数宛先の分割挙動が移行で退行）／要実機確認 | `MailService.php:1594, MailService.php:1355` | RG-005 |  |
| b08-06 | 現行踏襲 | 移行退行疑い | 乖離（移行先のコマンド名が設計と不一致） | `src/Eccube/Command/SmaregiUpdatePointCommand.php:26, app/Plugin/HareruyaEc/Command/SmaregiBatch.php:15` | RG-013,RG-014 |  |
| b08-06 | 現行踏襲 | 移行退行疑い | 乖離（現行↔移行先の挙動差・要仕様確定） | `SmaregiUpdatePointAction.php:39, UpdatePoint.php:40` | RG-002,DV-04 |  |
| b08-06 | 現行踏襲 | 移行退行疑い | 乖離（非数値時の終了ステータスが現行↔移行先で相違・軽微） | `UpdatePoint.php:32, SmaregiBatch.php:52, SmaregiUpdatePointCommand.php:53` | RG-006 |  |
| b17-01 | 現行踏襲 | バグ候補 | 乖離（実装バグ候補・失敗時の破壊的上書き）／要実機確認 | `app/Plugin/HareruyaEc/Service/ListText/CreateLatestArticleList.php:36, AbstractListText.php:30` | RG-007 |  |
| b17-01 | 現行踏襲 | 移行退行疑い | 乖離（移行での挙動変更・現行踏襲からの差） | `src/Eccube/Service/CreateLatestArticleListAction.php:38, CreateLatestArticleListCommand.php:48` | RG-007,011 |  |
| b17-01 | 現行踏襲 | バグ候補 | 乖離（実装バグ候補・HTTP異常未検知）／要実機確認 | `CreateLatestArticleList.php:36` | RG-007 |  |
| f04-04 | 現行踏襲 | 未実装疑い | 乖離（pf未実装・遅延秒 要実機確認・詳細設計記述漏れ） | `app/Plugin/HareruyaEc/Resource/template/default/Shopping/complete.twig:1, src/Eccube/Resource/template/default/Shopping/` | RG-026 |  |
| f04-04 | 現行踏襲 | 未実装疑い | 乖離（pf未実装・enterpriseで充足・詳細設計記述漏れ） | `app/Plugin/HareruyaEc/Resource/template/default/Shopping/complete.twig:18, src/Eccube/Resource/template/default/Shopping` | RG-027 |  |
| f06-01 | カスタマイズ | 移行退行疑い | 乖離（カスタマイズ未達・移行時対応要）／要実機確認 | `app/Plugin/HareruyaEc/Controller/EntryController.php:117` | RG-026 |  |
| f06-02 | 現行踏襲 | 未実装疑い | 乖離（戻り先遷移 未実装）／要実機確認 | `EntryController.php:234, EntryController.php:264` | RG-015 |  |
| f06-10 | カスタマイズ | 未実装疑い | 乖離（表示範囲 未実装） | `...Mypage/point_history.twig:62, src/Eccube/Resource/locale/messages.ja.yaml:826` | RG-014 |  |
| f06-18 | カスタマイズ | 移行退行疑い | 乖離（enterprise退行・現行オラクルとの挙動差） | `app/Plugin/HareruyaEc/Controller/Mypage/ChangeController.php:161, src/Eccube/Controller/Front/Mypage/ChangeController.ph` | RG-017 |  |
| f06-21 | 現行踏襲 | 移行退行疑い | 乖離（詳細設計の記述誤り＋現行未達・移行先で是正） | `app/Plugin/HareruyaEc/Controller/Mypage/WithdrawController.php:100, src/Eccube/Controller/Front/Mypage/WithdrawControlle` | RG-008,037 |  |
| f06-21 | 現行踏襲 | 移行退行疑い | 乖離（移行先で選手情報削除が欠落・退行） | `WithdrawController.php:88, WithdrawController.php:90` | RG-006,027 |  |
| f06-21 | 現行踏襲 | 移行退行疑い | 乖離（移行先の表示位置/形式が設計と相違）／要実機確認 | `WithdrawController.php:78, WithdrawController.php:112, src/Eccube/Resource/locale/messages.ja.yaml:734` | RG-013 |  |
| f06-21 | 現行踏襲 | 未実装疑い | 乖離（オラクル間矛盾・書式サーバ強制は未実装）／要実機確認 | `src/Eccube/Form/Type/Front/WithdrawType.php:37, WithdrawController.php:96, WithdrawController.php:28` | RG-023,024（DV-04） |  |
| m03-08 | カスタマイズ | 設計誤り疑い | 乖離（詳細設計ハルシネーション・実装はExcel準拠で是正済） | `src/Eccube/Controller/Admin/Product/ProductClassController.php:88, src/Eccube/Repository/ProductStockRepository.php:561,` | RG-006,011(DD-02) |  |
| m03-18 | カスタマイズ | 設計誤り疑い | 乖離（詳細設計ハルシネーション・登録フォームの403は不正確） | `SectionController.php:100, SectionController.php:137, src/Eccube/Controller/AbstractController.php:252` | RG-025 |  |
| m03-20 | カスタマイズ | 未実装疑い | 乖離（Excelカスタマイズが m03-20 ルートで未実装）／要実機確認 | `src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1079, src/Eccube/Service/Csv/Importer/Event/SectionMaste` | RG-013 |  |
| m03-20 | カスタマイズ | バグ候補 | 乖離（Excel 0/1/2制約が m03-20 で未検証・バグ候補）／要実機確認 | `CsvImportController.php:1167, SectionMasterImportHandler.php:57` | RG-010,027(DV-06) |  |
| m03-20 | カスタマイズ | バグ候補 | 乖離（データ0行のエラーキー不一致・バグ候補）／要実機確認 | `src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1126` | RG-017 |  |
| m03-26 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ未達・未実装） | `src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:30` | RG-004 |  |
| m03-26 | カスタマイズ | 未実装疑い | 乖離（スマレジ在庫チェック未実装）／要実機確認 | `src/Eccube/Service/Csv/Importer/Validator/AbolishedStatusStockValidator.php:75` | RG-014 |  |
| m03-27 | カスタマイズ | 未実装疑い | 乖離（無効→有効の連携キュー作成が未実装）／要実機確認 | `.../ProductGoodsImportHandler.php:616` | RG-015 |  |
| m03-27 | カスタマイズ | 未実装疑い | 乖離（Excel要件のスマレジ在庫確認が未実装）／要実機確認 | `src/Eccube/Service/Csv/Importer/Validator/AbolishedStatusStockValidator.php:75` | RG-005 |  |
| m03-27 | カスタマイズ | 未実装疑い | 乖離疑義（原価想定外金額チェックが未実装の疑い）／要実機確認 | `.../ProductGoodsImportHandler.php:114` | RG-035（§5 数値バリデーション） |  |
| m03-27 | カスタマイズ | 未実装疑い | 乖離（Excel要件の確認モーダルが未実装の疑い・詳細設計もExcelと矛盾）／要実機確認 | `src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:29, app/Plugin/HareruyaEc/Resource/template/admin/Produc` | RG-033（§5 画面遷移） |  |
| m03-30 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ未達・改名未実装） | `src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php:100, ProductPriceCsvController.php:198, ProductPri` | RG-014,015 |  |
| m03-30 | カスタマイズ | 未実装疑い | 乖離（基準価格 更新未実装） | `ProductPriceImportHandler.php:372` | RG-001,002,006 |  |
| m03-33 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ未実装・買取価格更新が無い） | `src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:180, src/Eccube/Service/Csv/Importer/Event` | RG-006,014,016 |  |
| m03-33 | カスタマイズ | 未実装疑い | 乖離（★カスタマイズ未実装・スマレジ連携フラグ処理が無い） | `ProductSaleHighPriceCsvController.php:180, SaleHighPriceImportHandler.php:51, ProductClassRepository.php:2590, SaleHighP` | RG-007,014 |  |
| m04-09 | 新規実装 | 未実装疑い | 乖離（在庫超過バリデーション未実装・在庫が負値化しうる） | `src/Eccube/Service/Admin/Stock/StockTransferStoreAction.php:82, src/Eccube/Form/Type/Admin/StockTransferNewDetailType.ph` | RG-026 |  |
| m04-09 | 新規実装 | 未実装疑い | 乖離（同一コード検証未実装） | `StockTransferStoreAction.php:78` | RG-027 |  |
| m04-10 | 新規実装 | 未実装疑い | 乖離（未実装・カラム未充填）／要実機確認 | `src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:171, src/Eccube/Entity/DtbStockMoveTransfer.ph` | RG-020,021 |  |
| m04-12 | 新規実装 | 未実装疑い | 乖離（表示件数・ページング未実装） | `src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:131, src/Eccube/Repository/DtbStockSplitJoinRepository.ph` | RG-015,016 |  |
| m04-14 | 新規実装 | バグ候補 | 乖離（丸め非対称・実装バグ候補）／要実機確認 | `src/Eccube/Service/Csv/Exporter/StockSplitJoinCsvExportService.php:120` | RG-008,010,026 |  |
| m04-14 | 新規実装 | バグ候補 | 乖離（正規化不一致・実装バグ候補）／要実機確認 | `src/Eccube/Service/Admin/Stock/StockSplitJoinIndexAction.php:44, src/Eccube/Controller/Admin/Stock/StockSplitJoinControl` | RG-015,022 |  |
| m04-20 | 新規実装 | 未実装疑い | 乖離（値未実装・TODO） | `StockHistoryDisposalCsv.php:104` | RG-001,007 |  |
| m04-22 | 新規実装 | 未実装疑い | 乖離（未実装） | `src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:153` | RG-025 |  |
| m04-23 | 新規実装 | バグ候補 | 乖離（Excel値域下限0=有効 vs 実装>0で弾く＝バグ候補） | `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitListCsvImportHandler.php:149` | RG-022B(DV-08,09),037B |  |
| m04-30 | 新規実装 | 未実装疑い | 乖離（未実装・仕様未達） | `src/Eccube/Form/Type/Admin/BarcodeReplacementListType.php:77` | RG-006,022(DV-06) |  |
| m05-11 | カスタマイズ | 未実装疑い | 乖離（廃止未達・カスタマイズ未実装） | `src/Eccube/Controller/Admin/Order/EditController.php:146` | RG-006 |  |
| m05-11 | カスタマイズ | 未実装疑い | 乖離（編集権限制御 未実装） | `—` | RG-004,008 |  |
| m05-11 | カスタマイズ | 未実装疑い | 乖離（スマレジ取引編集不可 未実装） | `—` | RG-005 |  |
| m05-11 | カスタマイズ | 未実装疑い | 乖離（受注更新履歴 未実装疑い）／要実機確認 | `—` | RG-032,033 |  |
| m07-08 | 新規実装 | バグ候補 | 乖離（設計未記載の状態更新副作用・バグ候補） | `src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php:78, src/Eccube/Service/Admin/Purchase/BuyOrderRe` | RG-016 |  |
| m07-08 | 新規実装 | バグ候補 | 乖離（原子性未保証・バグ候補）／要実機確認 | `BuyOrderRestockListCsvExportService.php:60, BuyOrderRestockListService.php:70` | RG-016 |  |
| m08-04 | カスタマイズ | 未実装疑い | 乖離（未実装・カスタマイズ未達） | `src/Eccube/Controller/Admin/Customer/CustomerEditController.php:156, src/Eccube/Resource/template/admin/Customer/edit.tw` | RG-011 |  |
| m08-04 | カスタマイズ | 設計誤り疑い | 乖離（最大長 値相違・詳細設計ハルシネーション併発） | `app/config/eccube/packages/eccube.yaml:173, src/Eccube/Form/Type/Admin/CustomerType.php:154` | RG-029(DV-14,15) |  |
| m08-04 | カスタマイズ | 設計誤り疑い | 設計どおり✓（Excel）／詳細設計ハルシネーション（DCI項目残置） | `src/Eccube/Form/Type/Admin/PlayerType.php:41` | RG-016 |  |
| m08-04 | カスタマイズ | 設計誤り疑い | 設計どおり✓（Excel）／詳細設計ハルシネーション（必須→任意の誤り） | `src/Eccube/Form/Type/Admin/CustomerType.php:84, src/Eccube/Form/Type/AddressType.php:108, app/config/eccube/packages/ecc` | RG-028(DV-02,03,04,06) |  |
| m10-04 | 現行踏襲 | 移行退行疑い | 乖離（遷移先退行） | `PaymentController.php:173` | RG-010 |  |
| m10-04 | 現行踏襲 | 設計誤り疑い | 乖離（詳細設計ハルシネーション・実装は上限あり） | `PaymentRegisterType.php:58, app/config/eccube/packages/eccube.yaml:137` | RG-027(DV-15) |  |
| m10-04 | 現行踏襲 | 設計誤り疑い | 乖離（詳細設計ハルシネーション・ルート名/実装方式相違） | `PaymentController.php:191` | RG-013,015,016 |  |
| m10-16 | カスタマイズ | 未実装疑い | 乖離（0以上バリデーション未実装） | `src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:72, app/Plugin/HareruyaEc/Form/Type/Admin/ConfigType.php:83` | RG-013 |  |
| m10-16 | カスタマイズ | 移行退行疑い | 乖離（永続化キーの転用・移行データ整合リスク） | `src/Eccube/Resource/locale/messages.ja.yaml:4208, AdditionalSystemFormType.php:80` | RG-014 |  |
| m10-16 | カスタマイズ | 設計誤り疑い | 詳細設計ハルシネーション（DB正=enterprise では update_date 更新される） | `src/Eccube/Controller/Admin/Setting/Shop/AdditionalSystemController.php:95, ConfigController.php:56` | RG-002 |  |
| m13-02 | カスタマイズ | 移行退行疑い | 乖離（移行先で退行・未実装）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/EventController.php:115, ec-cube-enterprise/src/Eccube/Controller/Admi` | RG-006 |  |
| m13-02 | カスタマイズ | 移行退行疑い | 乖離（現行未実装／移行先の更新は表示のみ強制）／要実機確認 | `pf-eccube3/.../Admin/EventController.php:57, ec-cube-enterprise/.../Event/EventController.php:306` | RG-021,022 |  |
| m13-02 | カスタマイズ | 移行退行疑い | 乖離（移行先でHTTP/遷移先が現行と相違） | `pf-eccube3/.../Admin/EventController.php:162, ec-cube-enterprise/.../Event/EventController.php:304` | RG-011,012 |  |
| m13-02 | カスタマイズ | 移行退行疑い | 乖離（現行未実装・移行先は一部実装）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Admin/Event/EventEditAction.php:61, pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Adm` | RG-031,033,034 |  |
| m13-04 | 現行踏襲 | 未実装疑い | 乖離（★カスタマイズ pf未実装／enterprise実装済み） | `app/Plugin/HareruyaEc/Controller/Admin/RepeatScheduleController.php:29, src/Eccube/Controller/Admin/Event/RepeatSchedule` | RG-004 |  |

## §2. 一般乖離（P2）（221件）

| 機能 | 区分 | 分類 | 判定（設計→実装の食い違い） | file:line | RG | 裁定 |
|---|---|---|---|---|---|---|
| a01-02 | 新規実装 | 乖離 | 乖離（抽出条件の実装位置差・非対象区分の反復enqueue） | `SmaregiStockBackfillAction.php:228, src/Eccube/Service/Smaregi/Webhook/Stock/SmaregiStockChangeApplier.php:44` | RG-004,014 |  |
| a01-02 | 新規実装 | 乖離 | 乖離（抽出条件の実装位置差・OTCの反復enqueue） | `SmaregiStockBackfillAction.php:228, SmaregiStockChangeApplier.php:108` | RG-005 |  |
| a02-05 | 現行踏襲 | 乖離 | 乖離／要実機確認（Excel 型表 integer vs Excel サンプル string の自己矛盾＋詳細 string。オラクルで型を一意化できず。実装 integer は本ポインタに留め期待へ持ち込まない＝#5 最大文字数8 と同じ扱い） | `src/Eccube/Repository/ProductRepository.php:2252` | RG-006 |  |
| a02-05 | 現行踏襲 | 乖離 | 乖離（詳細 L335「専用の失敗ステータスは返さない」は該当なし=200空に限った記述で、不正日付=404・内部エラー=500は返す。また詳細 L329「日時として解釈できる文字列」は緩いパースを示唆するが実装は厳密Y-m-dで `2026/06/01`等を4 | `src/Eccube/Controller/App/ProductController.php:208` | RG-004,010,011 |  |
| a02-05 | 現行踏襲 | 乖離 | 乖離（Excel仕様自己矛盾・最大8文字は入力例と不整合）／要実機確認 | `src/Eccube/Controller/App/ProductController.php:208` | §5 台帳(要判定) |  |
| a02-05 | 現行踏襲 | 乖離 | 乖離（応答フィールド名の綴り不一致・API契約差） | `src/Eccube/Repository/ProductRepository.php:2218` | RG-006 |  |
| a05-01 | カスタマイズ | 乖離 | 乖離（実装リスク・環境依存/権限過大） | `src/Controller/Admin/OrderController.php:41` | RG-005 |  |
| a05-02 | カスタマイズ | その他 | 直接印刷結果が偽の場合は更新を行わず記録して戻る（詳細設計 L333／Excel 0505:L1296 成功(true)/失敗(false)） | `OrderController.php:101` | ...)` は SimpleXMLElement |  |
| a05-02 | カスタマイズ | 乖離 | 乖離（解析失敗のcatch/記録が機能しない・バグ） | `OrderController.php:94` | RG-003 |  |
| a05-04 | カスタマイズ | 乖離 | 乖離（レスポンス書式差・要仕様確認） | `SmaregiController.php:103` | RG-014 |  |
| a05-04 | カスタマイズ | 乖離 | 乖離（通常取引の重複受信で冪等性欠如）／要実機確認 | `SmaregiController.php:127` | RG-018 |  |
| a05-04 | カスタマイズ | その他 | オラクル沈黙（実装観測・期待に不採用） | `SmaregiController.php:141` | RG-001(DP-T02,T03) |  |
| a06-01 | 現行踏襲 | 乖離 | 乖離（Excel記載の`/api/`プレフィクスが実装/詳細設計と不一致・要確認） | `pf-api/config/routes.yaml:2` | RG-001,012,017 |  |
| a06-01 | 現行踏襲 | 乖離 | 乖離（実装バグ・到達不可が401化／500未達） | `pf-api/src/Controller/Admin/LoginController.php:54` | RG-010 |  |
| a06-01 | 現行踏襲 | 乖離 | 乖離（実装バグ懸念・正規表現の過剰取得） | `pf-api/src/Controller/Admin/LoginController.php:60` | RG-005,016 |  |
| a06-01 | 現行踏襲 | 乖離 | 乖離（実装バグ懸念・未定義添字でmessage欠落） | `pf-api/src/Controller/Admin/LoginController.php:61` | RG-005,016 |  |
| a06-01 | 現行踏襲 | 乖離 | 乖離（軽微・例外経路の堅牢性） | `pf-api/src/Controller/Admin/LoginController.php:56` | RG-009 |  |
| a06-02 | カスタマイズ | 乖離 | 乖離疑義（Excel URLと実ルート定義の差・要実機確認） | `config/routes.yaml:30` | RG-022 |  |
| a06-02 | カスタマイズ | 乖離 | 乖離（Excel記載のIP制限が実装/詳細設計に無い）／要実機確認（インフラ層IP制限の有無） | `src/Controller/BaseController.php:23` | RG-016,017,018 |  |
| a06-02 | カスタマイズ | 乖離 | 乖離（Excel設計が対象ステータスを1種欠落・名称不一致） | `src/Repository/DtbOtcBuyOrderRepository.php:48, src/Entity/MtbOtcBuyOrderStatus.php:14` | RG-003 |  |
| a06-02 | カスタマイズ | 乖離 | 乖離（Excel型表記が実返却型と不一致） | `src/Repository/DtbOtcBuyOrderRepository.php:20` | RG-006,007,010 |  |
| a06-03 | カスタマイズ | 乖離 | 乖離（実装バグ・要実機確認） | `OtcBuyOrderController.php:208` | RG-015,021 |  |
| a06-16 | 新規実装 | 乖離 | 乖離（Excel設計 vs 実装パス相違） | `src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:231` | RG-004 |  |
| a06-16 | 新規実装 | 乖離 | 乖離（Excel「新規カラム」 vs 実装 別テーブルUPSERT） | `src/Eccube/Service/EntityManager/OtcBuyOrderApproverEntityManager.php:33, UpdateDoubleCheckMemberAction.php:47` | RG-002 |  |
| a06-16 | 新規実装 | 乖離 | 乖離（Excel沈黙・実装が追加更新／要実機確認） | `UpdateDoubleCheckMemberAction.php:42` | RG-002 |  |
| a06-16 | 新規実装 | 乖離 | 乖離（Excel沈黙・実装が追加検証／要実機確認） | `UpdateDoubleCheckMemberAction.php:36` | 台帳(要判定) |  |
| a06-16 | 新規実装 | 乖離 | 乖離（Excel「なし」 vs 実装 codeボディ返却） | `OtcBuyOrderController.php:267` | RG-003 |  |
| a06-16 | 新規実装 | 乖離 | 乖離疑義（Excel「IP制限」 vs 実装 セッション認証／要実機確認） | `OtcBuyOrderController.php:244` | RG-006 |  |
| a07-02 | 現行踏襲 | 乖離 | 乖離（実装が null→空文字置換）／要実機確認 | `BuyOrderController.php:74` | RG-005,006 |  |
| a07-02 | 現行踏襲 | 乖離 | 乖離（401に本文あり） | `src/Eccube/EventListener/ExceptionListener.php:77` | RG-014 |  |
| a17-01 | 現行踏襲 | 乖離 | 乖離（詳細設計の記述誤り・Excel+実装がsnake_case） | `src/Entity/DtbArticle.php:8` | RG-002 |  |
| a17-01 | 現行踏襲 | 乖離 | 乖離（Excel項目表の誤り・実装は非公開） | `src/Entity/DtbArticle.php:42` | RG-003 |  |
| a17-01 | 現行踏襲 | 乖離 | 乖離（一意性未担保・重複時500懸念）／要実機確認 | `src/Repository/DtbArticleRepository.php:21, src/Resources/config/doctrine/DtbArticle.orm.yml:17` | RG-001,014 |  |
| a17-01 | 現行踏襲 | 乖離 | 乖離（/article.json が非GETも受理）／軽微 | `config/routes.yaml:145, routes.yaml:148` | RG-009 |  |
| a17-01 | 現行踏襲 | 乖離 | 乖離（必須・型の入力検証なし）／要実機確認 | `src/Controller/ArticleController.php:88` | RG-008（DP-04,05） |  |
| a17-01 | 現行踏襲 | 乖離 | 乖離（Excel備考の誤転記）／要確認 | `src/Repository/DtbArticleRepository.php:23` | RG-008 |  |
| a17-02 | 現行踏襲 | 乖離 | 乖離（実装バグ・null上書きでデフォルト20が不発）／要実機確認 | `src/Controller/ArticleController.php:119, src/Repository/DtbArticleRepository.php:37` | RG-005,017(DV-03) |  |
| a17-02 | 現行踏襲 | 乖離 | 乖離（詳細設計の型記述誤り・Excel/実装は文字列） | `src/Repository/DtbArticleRepository.php:51` | RG-007 |  |
| a17-02 | 現行踏襲 | 乖離 | 乖離（詳細設計 エラー処理表の記述矛盾・正はL328/Excel/実装の404） | `src/Controller/ArticleController.php:120` | RG-008 |  |
| a17-02 | 現行踏襲 | 乖離 | 乖離（spec沈黙の実装条件・要仕様反映確認） | `src/Repository/DtbArticleRepository.php:60` | RG-002,012 |  |
| b02-07 | カスタマイズ | その他 | 注記（移行先はtxラップ・現行はtxなし・正本に固定オラクルなし） | `DtbWeeklyStockHistoryRepository.php:67` | RG-013 |  |
| b02-07 | カスタマイズ | 乖離 | 乖離（実装バグ懸念・在庫10000以上で桁あふれ）／要実機確認 | `DtbWeeklyStockHistoryTempRepository.php:30` | RG-002,004 |  |
| b05-01 | 現行踏襲 | 乖離 | 乖離（実装の比較方向がExcel窓[T-30分,T]と逆・要実機確認は等号のみ） | `src/Eccube/Repository/OrderRepository.php:1909, OtcOrderSmaregiPostCommand.php:48` | RG-002, DT-08 |  |
| b05-02 | 現行踏襲 | 乖離 | 乖離疑義（型キャスト・要実機確認） | `ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:82` | RG-011 |  |
| b05-02 | 現行踏襲 | 乖離 | 乖離（詳細設計の2状態を折り畳み・Excel準拠では軽微） | `ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:50, ResendMailCommand.php:59` | RG-018,019 |  |
| b05-04 | 現行踏襲 | その他 | \ | `app/Plugin/HareruyaEc/Service/SmaregiService.php:64` | !array_key_exists('resul |  |
| b05-04 | 現行踏襲 | 乖離 | 乖離（通知先未設定時にエラーメール副作用が欠落・サイレント）／要実機確認 | `app/Plugin/HareruyaEc/Service/MailService.php:1381` | RG-007 |  |
| b05-04 | 現行踏襲 | 乖離 | 乖離（部分失敗時に後続区分を当該実行でスキップ・設計未記載）／要実機確認 | `app/Plugin/HareruyaEc/Service/SmaregiService.php:67` | RG-008 |  |
| b05-04 | 現行踏襲 | その他 | 詳細設計の記述誤り（Excel・実装ともメール通知／L339は不採用） | `app/Plugin/HareruyaEc/Service/SmaregiService.php:53` | RG-007 |  |
| b05-04 | 現行踏襲 | その他 | 注記（移行先では不要・現行のみ有効）／§0で明示 | `app/Plugin/HareruyaEc/Command/OrderBatch.php:16` | §0 |  |
| b05-05 | 現行踏襲 | 乖離 | 乖離（アーキ変更・バッチ副作用が削除実行→enqueueに変化） | `app/Plugin/HareruyaEc/Service/Order/DeleteSmaregiProduct.php:34, src/Eccube/Command/SmaregiOtcDeleteCommand.php:88` | RG-007,019 |  |
| b05-05 | 現行踏襲 | 乖離 | 乖離（フラグ設定契機の拡張・要確認） | `app/Plugin/HareruyaEc/Service/SmaregiService.php:57, src/Eccube/Service/Smaregi/Otc/SmaregiOtcDeleteService.php:79` | RG-009 |  |
| b05-06 | 現行踏襲 | その他 | 注記（宛先設定は L303 で対象外・スマレジエラー宛先を流用） | `app/Plugin/HareruyaEc/Service/MailService.php:1448, src/Eccube/Service/MailService.php:2239` | RG-015 |  |
| b05-06 | 現行踏襲 | 乖離 | 乖離（宛先未設定時に通知副作用が欠落・成功終了）／要実機確認 | `...MailService.php:1450, ...MailService.php:2243, src/Eccube/Service/Admin/Order/CheckDuplicatePointAction.php:48, Check` | RG-001,003,015 |  |
| b05-07 | 現行踏襲 | 乖離 | 乖離（照合方式の設計文言と実装の意味相違）／要実機確認 | `OrderRepository.php:1920, OrderRepository.php:1944` |  |  |
| b05-08 | 現行踏襲 | その他 | 詳細設計の誤り（Excel優先で是正・期待には不採用） | `../pf-eccube3/app/Plugin/HareruyaEc/Service/Smaregi/CheckSmaregiErrorOrder.php:38` | RG-004,005,011,015 |  |
| b05-08 | 現行踏襲 | 乖離 | 乖離疑義（要実機確認・対象漏れ） | `../pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbOrderSubRepository.php:184` | RG-002,012 |  |
| b05-08 | 現行踏襲 | 乖離 | 乖離疑義（要実機確認・部分反映不可） | `../pf-eccube3/.../CheckSmaregiErrorOrder.php:33` | RG-010,011 |  |
| b05-08 | 現行踏襲 | 乖離 | 乖離疑義（設計沈黙・要実機確認/要仕様確認） | `../pf-eccube3/.../CheckSmaregiErrorOrder.php:37` | RG-003(STALE),004 |  |
| b05-08 | 現行踏襲 | 乖離 | 乖離疑義（要実機確認・エラー分類/終了コード） | `../pf-eccube3/.../CheckSmaregiErrorOrder.php:37, SmaregiBatch.php:50` | RG-006,013 |  |
| b05-09 | 現行踏襲 | 乖離 | 乖離（詳細設計の内部矛盾・誤記／Excel優先で書き込みあり） | `app/Plugin/HareruyaEc/Service/Smaregi/CheckSmaregiTransaction.php:210` | RG-010,012,013 |  |
| b05-09 | 現行踏襲 | 乖離 | 乖離（実装バグ・異常終了コードが伝播しない） | `CheckSmaregiTransaction.php:50, app/Plugin/HareruyaEc/Command/SmaregiBatch.php:49` | RG-006 |  |
| b05-09 | 現行踏襲 | その他 | smaregi:batch\ | `—` | SmaregiBatch"` 該当なし）。ent |  |
| b06-01 | 新規実装 | 乖離 | 乖離（設計採番12 vs 実装13・要是正） | `src/Eccube/Entity/Master/MtbOtcBuyOrderStatus.php:60, src/Eccube/Service/Admin/OtcBuyOrder/BatchAutoStockAction.php:45` | RG-001,012 |  |
| b06-01 | 新規実装 | 乖離 | 乖離（丸め差・方式不統一）／要実機確認 | `src/Eccube/Service/Admin/Purchase/BuyOrderStockInbound.php:93, src/Eccube/Service/Admin/OtcBuyOrder/OtcBuyOrderStockInbo` | RG-008 |  |
| b06-01 | 新規実装 | 乖離 | 乖離疑義（本店 vs モールルートの同一性）／要実機確認 | `src/Eccube/Service/Admin/Purchase/BatchAutoStockAction.php:48, BaseInfoRepository.php:165, src/Eccube/Entity/BaseInfo.ph` | RG-007 |  |
| b06-01 | 新規実装 | その他 | 設計沈黙 vs 実装挙動（要仕様確定） | `.../OtcBuyOrder/BatchAutoStockAction.php:54, .../Purchase/BatchAutoStockAction.php:58, .../BatchAutoStockAction.php:68, ` | RG-018,019 |  |
| b08-02 | 現行踏襲 | その他 | スマレジ連携失敗＝タイムアウト または レスポンスステータスが失敗扱い（Excel L1230） | `LostPoints.php:46` | !array_key_exists('resul |  |
| b08-02 | 現行踏襲 | 乖離 | 乖離（enterpriseで流量制御欠落・要実機確認） | `LostPoints.php:41, LostPointsAction.php:52` | RG-014 |  |
| b08-02 | 現行踏襲 | 乖離 | 乖離疑義（限定条件・要実機確認） | `app/Plugin/HareruyaEc/Repository/DtbPointHistoryRepository.php:38, src/Eccube/Repository/DtbPointHistoryRepository.php:2` | RG-002／§5 要判定 |  |
| b08-03 | 現行踏襲 | 乖離 | 乖離（送信エラーのコンソール非出力・握り潰し） | `src/Eccube/Service/MailService.php:1121, PointExpireNotificationCommand.php:42` | RG-014 |  |
| b08-03 | 現行踏襲 | 乖離 | 乖離（設計未記載のsmaregi_id必須抽出・通知漏れ）／要実機確認 | `src/Eccube/Repository/DtbPointHistoryRepository.php:328` | RG-003〜006 |  |
| b08-03 | 現行踏襲 | 乖離 | 乖離疑義（送信元がテンプレ非依存の運用設定値）／要実機確認 | `app/Plugin/HareruyaEc/Service/MailService.php:1144, src/Eccube/Service/MailService.php:1113` | RG-009 |  |
| b08-05 | 現行踏襲 | 乖離 | 乖離（履歴0件会員が未検出）／要実機確認 | `app/Plugin/HareruyaEc/Repository/DtbPointHistoryRepository.php:199, src/Eccube/Repository/DtbPointHistoryRepository.php:` | RG-018(DV-04) |  |
| b08-05 | 現行踏襲 | 乖離 | 乖離（送信元がBaseInfo設定値・Excel固定値と不一致の可能性）／要実機確認 | `app/Plugin/HareruyaEc/Service/MailService.php:1596, src/Eccube/Service/MailService.php:1352` | RG-007 |  |
| b08-05 | 現行踏襲 | 乖離 | 乖離（本文数値区切りの書式差・軽微） | `MailService.php:1583, MailService.php:1338` | RG-008 |  |
| b08-06 | 現行踏襲 | 乖離 | 乖離（現行バグ・Excel未達） | `app/Plugin/HareruyaEc/Service/Smaregi/UpdatePoint.php:37, src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php:34` | RG-007 |  |
| b08-06 | 現行踏襲 | 乖離 | 乖離（現行の異常系未ガード） | `UpdatePoint.php:38, SmaregiUpdatePointAction.php:44` | RG-003,RG-014 |  |
| b08-06 | 現行踏襲 | 乖離 | 乖離（現行バグ疑い・要実機確認） | `app/Plugin/HareruyaEc/Service/Smaregi/CustomerService.php:379, UpdatePoint.php:41` | RG-008 |  |
| b13-01 | 現行踏襲 | 乖離 | 乖離（抽出基準の列違い・作成日時→更新日時）／要実機確認 | `app/Plugin/HareruyaEc/Repository/DtbEventEntryRepository.php:70, config.yml:185` | RG-003,016 |  |
| b13-01 | 現行踏襲 | 乖離 | 乖離（実装バグ・想定外エラーの取りこぼし） | `app/Plugin/HareruyaEc/Service/Payment/SlnSearchHelper.php:83` | RG-009,010 |  |
| b13-01 | 現行踏襲 | 乖離 | 乖離（詳細設計 L338 の記述が Excel・実装と矛盾） | `app/Plugin/HareruyaEc/Service/Payment/AbstractCheckPaymentEntry.php:59, AbstractPaymentService.php:43` | RG-012 |  |
| b13-01 | 現行踏襲 | 乖離 | 乖離（論理削除仕様に反する物理削除）／enterprise要確認 | `app/Plugin/HareruyaEc/Service/Payment/AbstractPaymentService.php:43` | RG-007 |  |
| b13-01 | 現行踏襲 | 乖離 | 乖離（重複決済番号の失敗申込が削除されない）／要実機確認 | `app/Plugin/HareruyaEc/Service/Payment/AbstractCheckPaymentEntry.php:29, SlnSearchHelper.php:16` | RG-008 |  |
| b13-01 | 現行踏襲 | 乖離 | 乖離疑義（CVS抽出とクレジット限定照会の不整合）／要実機確認 | `app/Plugin/HareruyaEc/Service/Payment/CheckProcessingPaymentEntry.php:12, SlnSearchHelper.php:52, AbstractCheckPaymentEn` | RG-009,010 |  |
| b13-02 | 現行踏襲 | その他 | CheckCvsPayment' ec-cube-enterprise/src ec-cube-enterprise/app` が0件）。※詳細設計HTML L294 の区分「現行踏襲」および superseded-notice 非設置（HTMLのL176-2 | `app/Plugin/HareruyaEc/Service/Payment/CheckCvsPaymentEntry.php:16, Command/EventEntryBatch.php:13` |  |  |
| b13-02 | 現行踏襲 | 乖離 | 乖離（詳細設計 L338 の記述が処理フロー・実装と矛盾） | `app/Plugin/HareruyaEc/Service/Payment/AbstractCheckPaymentEntry.php:95, CheckCvsPaymentEntry.php:37` |  |  |
| b13-02 | 現行踏襲 | 乖離 | 乖離（「記録除去」表現と実装のステータス変更の不一致）／要実機確認 | `CheckCvsPaymentEntry.php:34, MtbEntryStatus.php:21` |  |  |
| b13-02 | 現行踏襲 | 乖離 | 乖離（実装バグ・想定外エラーの取りこぼし） | `app/Plugin/HareruyaEc/Service/Payment/SlnSearchHelper.php:83` |  |  |
| b13-02 | 現行踏襲 | 乖離 | 乖離疑義（CVS入金完了にクレカ完了メールを送信）／要実機確認 | `app/Plugin/HareruyaEc/Entity/Payment.php:79, AbstractCheckPaymentEntry.php:98` |  |  |
| b17-01 | 現行踏襲 | 乖離 | 乖離（実装が設計外の検証を保持・設計記述不足） | `CreateLatestArticleListAction.php:66` | RG-007 |  |
| b17-01 | 現行踏襲 | その他 | 設計どおり✓（バグでない） | `app/Plugin/HareruyaEc/Command/ListTextBatch.php:23, src/Eccube/Command/CreateLatestArticleListCommand.php:34` | RG-001,013 |  |
| f04-04 | 現行踏襲 | 乖離 | 乖離（pf店舗別TOP未達・ラベル差） | `...Shopping/complete.twig:63, ...Shopping/complete.twig:132` | RG-028 |  |
| f04-04 | 現行踏襲 | 乖離 | 乖離疑義（総原価反映箇所 要実機確認） | `app/Plugin/HareruyaEc/Service/ShoppingService.php:827` | RG-008,009 |  |
| f06-01 | カスタマイズ | 乖離 | 乖離（カスタマイズ未達） | `app/Plugin/HareruyaEc/Controller/EntryController.php:152` | RG-031 |  |
| f06-01 | カスタマイズ | その他 | 詳細設計の記述誤り（実ソースで是正・Excelは整合） | `src/Eccube/Entity/Customer.php:74` | RG-014,024 |  |
| f06-02 | 現行踏襲 | 乖離 | 乖離（重大・確定失敗の未ロールバック） | `src/Eccube/Controller/Front/EntryController.php:283` | RG-007,008,010,011 |  |
| f06-02 | 現行踏襲 | 乖離 | 乖離（判定順序の位置ずれ）／要実機確認 | `EntryController.php:349, app/Plugin/HareruyaEc/Controller/EntryController.php:228` | RG-005 |  |
| f06-02 | 現行踏襲 | その他 | 差異（記述と実装差・安全側） | `EntryController.php:354` | RG-010 |  |
| f06-10 | カスタマイズ | 乖離 | 乖離（オラクル取り違え・ID衝突／要台帳修正） | `—` | 全体（Excel源） |  |
| f06-10 | カスタマイズ | 乖離 | 乖離（詳細設計内の記述矛盾・実装は廃止準拠） | `—` | §0廃止 |  |
| f06-10 | カスタマイズ | 乖離 | 乖離（詳細設計テンプレ由来の誤記・実装は参照のみ） | `src/Eccube/Controller/Front/Mypage/MypageController.php:393` | RG-024 |  |
| f06-10 | カスタマイズ | 乖離 | 乖離（選択肢のサーバ側検証なし）／要実機確認 | `...Mypage/point_history.twig:72, MypageController.php:403` | RG-017(DQ-06) |  |
| f06-10 | カスタマイズ | 乖離 | 乖離（Excel簡略記述と実装の並びキー差）／要実機確認 | `src/Eccube/Repository/DtbPointHistoryRepository.php:88, app/Plugin/HareruyaEc/Repository/DtbPointHistoryRepository.php:2` | RG-001 |  |
| f06-10 | カスタマイズ | 乖離 | 乖離（設計/実装のパラメータ名差）／要実機確認 | `src/Eccube/Controller/Front/Mypage/MypageController.php:403, ...Mypage/point_history.twig:24` | RG-017(§3・DQ-01〜06) |  |
| f06-18 | カスタマイズ | その他 | 更新時にスマレジへ会員情報更新を連携する（詳細設計L360＝連携は更新の一部・条件記載なし＝常時） | `ChangeController.php:161, src/Eccube/Controller/Front/Mypage/ChangeController.php:174` | $isTelChanged) ? registe |  |
| f06-18 | カスタマイズ | 乖離 | 乖離（pf-eccube3 カスタマイズ未達） | `app/Plugin/HareruyaEc/Controller/EntryController.php:104` | RG-019 |  |
| f06-18 | カスタマイズ | 乖離 | 乖離（enterprise 遷移先が専用エラー画面でなくフォーム再描画・要実機確認） | `src/Eccube/Controller/Front/Mypage/ChangeController.php:116` | RG-019 |  |
| f06-21 | 現行踏襲 | 乖離 | 乖離（用語/対象の不一致・要実機確認） | `WithdrawController.php:75, WithdrawController.php:111, src/Eccube/Service/Smaregi/SmaregiCustomerService.php:499` | RG-007 |  |
| f06-21 | 現行踏襲 | その他 | 未確認（オラクル規定あり・実装到達未検証） | `—` | RG-021,022 |  |
| m03-08 | カスタマイズ | 乖離 | 乖離疑義（要実機確認・card_conditionマスタ順序に依存） | `src/Eccube/Repository/ProductClassRepository.php:100` | RG-008 |  |
| m03-08 | カスタマイズ | その他 | number_format`）・ヘッダ `:8`（`admin.product.standard_price`） | `index.twig:96` | **設計どおり✓** |  |
| m03-08 | カスタマイズ | 乖離 | 乖離疑義（要実機確認・NULL属性の廃止規格が不可視） | `ProductClassRepository.php:312` | RG-002,010 |  |
| m03-18 | カスタマイズ | 乖離 | 乖離（Excel「数字」に対し文字種検証欠落） | `src/Eccube/Form/Type/Admin/ProductDepartmentType.php:51` | RG-014 |  |
| m03-18 | カスタマイズ | 乖離 | 乖離（仕様外の追加削除ガード）／要仕様確認 | `src/Eccube/Controller/Admin/Product/SectionController.php:147, src/Eccube/Entity/Master/MtbSection.php:251` | RG-006〜009 |  |
| m03-18 | カスタマイズ | 乖離 | 乖離（設計沈黙・削除連携が実装先行）／要仕様確認 | `SectionController.php:184, src/Eccube/Service/Smaregi/SmaregiSectionEventService.php:85` | RG-006 |  |
| m03-18 | カスタマイズ | 乖離 | 乖離（翻訳キー体系の二重化・表示不整合リスク）／低優先 | `ProductDepartmentType.php:48, src/Eccube/Resource/template/admin/Product/section.twig:65, section.twig:122` | RG-022 |  |
| m03-18 | カスタマイズ | 乖離 | 乖離（Excel初期値「-」と実装の既定0の差）／低優先・要実機確認 | `ProductDepartmentType.php:64, MtbSection.php:55` | RG-002 |  |
| m03-19 | 現行踏襲 | その他 | 出力5列＝ID/部門名/部門コード/免税区分/MTGBuyer表示フラグ（0204:L7794/L7795/L7796/L7797/L7798） | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/SectionController.php:19` |  |  |
| m03-19 | 現行踏襲 | その他 | 詳細設計は現行・移行先とも「部門コード昇順」と記述（L319「部門コード昇順かつ条件無しで全件取得」、L300「並び順…両者で同じ」） | `pf-eccube3/.../SectionController.php:154, ec-cube-enterprise/.../SectionController.php:218` |  |  |
| m03-19 | 現行踏襲 | その他 | 詳細設計 L315 はCSV出力ボタンの遷移先を `path('m03-18_admin_product_product_section_export')` と記述 | `ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/section.twig:44, ec-cube-enterprise/.../SectionController.` |  |  |
| m03-19 | 現行踏襲 | その他 | 詳細設計 L329「MTGBuyer表示フラグは真偽を1／0の整数で出力」 | `pf-eccube3/.../SectionController.php:166, ec-cube-enterprise/.../SectionController.php:225` |  |  |
| m03-20 | カスタマイズ | 乖離 | 乖離（ルート同定の不整合・機能実体の二重化）／要実機確認 | `SectionMasterImportHandler.php:57, src/Eccube/Controller/Admin/Product/SectionController.php:303, CsvImportController.ph` | RG-002,003,009,011,013 |  |
| m03-20 | カスタマイズ | 乖離 | 設計どおり✓（列追加）／値検証は#2で乖離 | `CsvImportController.php:2158, messages.ja.yaml:2397` | RG-008,009 |  |
| m03-22 | 現行踏襲 | 乖離 | 乖離（実装がExcel上限1024を超過許容）／要実機確認 | `src/Eccube/Entity/Master/MtbSellGroup.php:73, src/Eccube/Form/Type/Admin/ProductSellGroupType.php:46, app/config/eccube/` | RG-019(DV-08) |  |
| m03-22 | 現行踏襲 | 乖離 | 乖離疑義（フロント連動の実装到達は本機能外・実機再現で確定）／要実機確認 | `src/Eccube/Controller/Admin/Product/SellGroupController.php:59, ProductSellGroupType.php:67, MtbSellGroup.php:149` | RG-002,RG-029 |  |
| m03-26 | カスタマイズ | 乖離 | 乖離（オラクル内部矛盾・NM部門は到達不能） | `—` | RG-033 |  |
| m03-26 | カスタマイズ | 乖離 | 乖離（仕様未確定TODO）／要実機確認 | `src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:199` | RG-030,031,032 |  |
| m03-26 | カスタマイズ | 乖離 | 乖離（設計書未記載の実装列）／軽微 | `CardCsvController.php:348` | RG-018,043 |  |
| m03-27 | カスタマイズ | 乖離 | 乖離（Excel L3195のセール外反映が新規で欠落）／要実機確認 | `src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:586` | RG-009 |  |
| m03-27 | カスタマイズ | 乖離 | 乖離疑義（サーバ通信による事前確認の実装到達が不明）／要実機確認 | `.../ProductGoodsImportHandler.php:604` | RG-013,RG-014 |  |
| m03-27 | カスタマイズ | 乖離 | 乖離（現行踏襲列がサイレントに欠落・詳細設計も追認）／要実機確認 | `.../ProductGoodsImportHandler.php:112` | RG-029 |  |
| m03-30 | カスタマイズ | 乖離 | 乖離（セール区分の販売価格ロジック差・カスタマイズ未達） | `ProductPriceImportHandler.php:327` | RG-001,002 |  |
| m03-30 | カスタマイズ | 乖離 | 乖離疑義（同期呼び出し vs 遅延連携・実機再現で確定） | `ProductPriceImportHandler.php:399` | RG-008 |  |
| m03-33 | カスタマイズ | 乖離 | 乖離（フォーマット列数 設計7 vs 実装5） | `SaleHighPriceImportHandler.php:165, ProductSaleHighPriceCsvController.php:180` | RG-030,011(DV-05) |  |
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
| m04-04 | 新規実装 | 乖離 | 要業務確認（確定乖離ではない）: Excel識別ID順(b)＝主たる候補読解では実装＝Excelで整合し、詳細設計L293/L313も列の並び順を実装正とする。物理行記載順(a)をCSV列順として唯一正とみなす読解でのみ差異が生じるため、どちらの読解を採るかを | `src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:44` | RG-001,002 |  |
| m04-09 | 新規実装 | 乖離 | 乖離（上限未強制）／要実機確認 | `src/Eccube/Form/Type/Admin/StockMoveNewType.php:75, src/Eccube/Form/Type/Admin/StockTransferNewType.php:45` | RG-019,030（§5 文字列長=要判定） |  |
| m04-09 | 新規実装 | 乖離 | 乖離疑義（上限値の一致 要実機確認） | `src/Eccube/Form/Type/Admin/StockMoveQuantityType.php:40, StockTransferNewDetailType.php:41` | RG-004,024（DV-04＝件数外） |  |
| m04-09 | 新規実装 | 乖離 | 乖離（項目別エラーの汎用化）／要実機確認 | `StockTransferStoreAction.php:91` | RG-028 |  |
| m04-09 | 新規実装 | 乖離 | 乖離（ステータス数値IDがExcel L6635-6637 vs 実装 L327 で不一致）／要実機確認 | `src/Eccube/Entity/Master/MtbStockMoveTransferStatus.php:29` | RG-014,021（SEED §2 ステータス |  |
| m04-10 | 新規実装 | 乖離 | 乖離（移動/振替の起点分岐が実装に存在しない）／要実機確認 | `StockMoveTransferListCsvExportService.php:171` | RG-020 |  |
| m04-12 | 新規実装 | 乖離 | 乖離（ステータス表記差）／要実機確認 | `app/DoctrineMigrations/Version20260519100000.php:70` | RG-009(DS-06) |  |
| m04-12 | 新規実装 | 乖離 | 乖離（クリア範囲の差）／要実機確認 | `StockSplitJoinController.php:96` | RG-014 |  |
| m04-12 | 新規実装 | 乖離 | 乖離（Excel書式記載の矛盾・要Excel修正／実装は文字列一致） | `DtbStockSplitJoinRepository.php:257` | RG-004 |  |
| m04-13 | 新規実装 | その他 | 結合元商品CSVは10,000件を登録上限（Excel 0202:L8855） | `src/Eccube/Controller/Admin/Stock/StockJoinController.php:875, src/Eccube/Service/Csv/Importer/Event/StockJoinCsvImportH` |  |  |
| m04-13 | 新規実装 | その他 | 結合は「結合計画承認待ち→結合計画承認済み→結合完了承認待ち→入庫完了」の二段承認（結合計画承認と結合完了承認）＋ピック作業を規定（結合計画承認済み=Excel 0202:L9101,L9104／結合完了承認申請画面へ遷 | `src/Eccube/Entity/Master/MtbStockSplitJoinStatus.php:28` |  |  |
| m04-13 | 新規実装 | その他 | 結合元在庫数が在庫数を超える場合はエラーとする（Excel 0202:L8946 の7-14） | `src/Eccube/Service/Admin/Stock/StockJoinMoveToShortageEntryAction.php:187` |  |  |
| m04-13 | 新規実装 | その他 | 結合数は必須の入力チェック（Excel 0202:L8735）＝入力エラーとして扱う想定 | `src/Eccube/Service/Admin/Stock/StockJoinRegisterAction.php:43` |  |  |
| m04-13 | 新規実装 | その他 | 欠品点数は1～1,000,000（最小1・固定上限100万）（Excel 0202:L9052 の7-18） | `—` |  |  |
| m04-13 | 新規実装 | その他 | 分割数は数値1～99999999（Excel 0202:L7897 の2-10） | `src/Eccube/Service/Admin/Stock/StockSplitRegisterAction.php:81` |  |  |
| m04-13 | 新規実装 | その他 | Excelは「検品CSV出力/登録」（Excel 0202:L8985,L9009系） | `—` |  |  |
| m04-20 | 新規実装 | 乖離 | 乖離（列名/粒度違い） | `src/Eccube/Controller/Admin/Stock/StockHistoryController.php:447, src/Eccube/Service/Csv/StockHistoryDisposalCsv.php:106` | RG-001,003 |  |
| m04-20 | 新規実装 | 乖離 | 乖離（出力列欠落・射影で脱落） | `StockHistoryController.php:440, StockHistoryDisposalCsv.php:108, StockHistoryDisposalCsv.php:65` | RG-001,006 |  |
| m04-20 | 新規実装 | 乖離 | 乖離（取得方式・要実機確認） | `StockHistoryController.php:337, src/Eccube/Repository/DtbStockHistoryRepository.php:404` | RG-004 |  |
| m04-20 | 新規実装 | 乖離 | 要実機確認（乖離ではない） | `DtbStockHistoryRepository.php:411` | RG-005 |  |
| m04-22 | 新規実装 | 乖離 | 乖離（上限値不一致・両方向にズレ） | `src/Eccube/Controller/AbstractController.php:364, StockMoveTransferController.php:252` | RG-009,023 |  |
| m04-22 | 新規実装 | 乖離 | 乖離（必須が任意になっている） | `src/Eccube/Form/Type/Admin/StockTransferCsvImportType.php:88` | RG-019 |  |
| m04-22 | 新規実装 | 乖離 | 乖離疑義（拡張子検証なし・間接排除）／要実機確認 | `StockMoveCsvImportType.php:115, StockTransferCsvImportType.php:105` | RG-007,021 |  |
| m05-11 | カスタマイズ | 乖離 | 乖離（バリデーション最大長 設計≠実装） | `app/config/eccube/packages/eccube.yaml:171, src/Eccube/Form/Type/NameType.php:105, eccube.yaml:172, KanaType.php:62, src` | RG-049,050 |  |
| m06-10 | 新規実装 | 乖離 | 乖離（導出源相違）／影響は要実機確認 | `src/Eccube/Repository/DtbOtcBuyOrderRepository.php:589, src/Eccube/Service/Csv/Exporter/RestockListCsvRowFormatter.php:8` | RG-008 |  |
| m06-10 | 新規実装 | その他 | 白 | `RestockListCsvRowFormatter.php:174` | 青 |  |
| m06-10 | 新規実装 | 乖離 | 乖離（端ケースの書式）／低・要実機確認 | `RestockListCsvRowFormatter.php:147` | RG-005 |  |
| m06-11 | 新規実装 | 乖離 | 乖離（オラクル未記載の状態更新・要件追認/バグ判断要） | `ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/OtcBuyOrderRestockListService.php:53` |  |  |
| m06-11 | 新規実装 | 乖離 | 乖離（応答実体がPDFでなくHTML+JSON）／要実機確認 | `OtcBuyOrderController.php:632` |  |  |
| m06-11 | 新規実装 | 乖離 | 乖離（オラクル未記載のステータス制限）／要実機確認 | `OtcBuyOrderRestockListService.php:119` |  |  |
| m06-11 | 新規実装 | 乖離 | 乖離（オラクル未記載の複数店舗制限）／要実機確認 | `OtcBuyOrderRestockListService.php:131` |  |  |
| m06-12 | 新規実装 | 乖離 | 乖離（状態なし通常品で空欄化されない） | `src/Eccube/Repository/DtbOtcBuyOrderRepository.php:507` | RG-002／DP-04 |  |
| m06-12 | 新規実装 | 乖離 | 乖離（状態なし通常品で1固定にならない） | `DtbOtcBuyOrderRepository.php:509` | RG-002,005／DP-06 |  |
| m06-12 | 新規実装 | 乖離 | 乖離（状態なし通常品で空欄化されない） | `DtbOtcBuyOrderRepository.php:510` | RG-002／DP-07 |  |
| m06-12 | 新規実装 | 乖離 | 乖離（状態なし通常品で空欄化されない） | `DtbOtcBuyOrderRepository.php:511` | RG-002／DP-08 |  |
| m07-08 | 新規実装 | その他 | 設計沈黙・実装のみ／二重フィルタの冗長性疑義 | `src/Eccube/Repository/DtbBuyOrderRepository.php:848` | RG-015 |  |
| m08-04 | カスタマイズ | 乖離 | 乖離（必須解除 未達）／要実機確認 | `src/Eccube/Form/Type/Admin/CustomerType.php:79` | RG-028,DV-17 |  |
| m08-04 | カスタマイズ | 乖離 | 乖離（廃止 未達）／要実機確認（導線制御の有無） | `src/Eccube/Controller/Admin/Customer/CustomerEditController.php:64` | RG-004,017 |  |
| m08-04 | カスタマイズ | その他 | 設計どおり✓（Excel）／詳細設計の記載漏れ | `src/Eccube/Form/Type/Admin/CustomerType.php:167, app/config/eccube/packages/eccube.yaml:137, src/Eccube/Entity/Customer.` | RG-015 |  |
| m10-04 | 現行踏襲 | 乖離 | 乖離（必須未強制） | `src/Eccube/Form/Type/Admin/PaymentRegisterType.php:124` | RG-012,027(DV-03) |  |
| m10-04 | 現行踏襲 | 乖離 | 乖離（片側バリデーション欠落） | `PaymentRegisterType.php:98` | RG-027(DV-13) |  |
| m10-04 | 現行踏襲 | 乖離 | 乖離（操作方式の相違） | `PaymentController.php:378` | RG-020,021,022 |  |
| m10-04 | 現行踏襲 | 乖離 | 乖離（現行踏襲未達） | `—` | RG-012 |  |
| m10-04 | 現行踏襲 | 乖離 | 乖離（削除方式の変化・要実機確認） | `PaymentController.php:337, src/Eccube/Repository/AbstractRepository.php:48, src/Eccube/Controller/Admin/Setting/Shop/Pay` | RG-017 |  |
| m10-04 | 現行踏襲 | 乖離 | 乖離（採番方式差） | `PaymentController.php:324` | RG-017 |  |
| m10-04 | 現行踏襲 | 乖離 | 乖離（境界値バグ・要実機確認） | `PaymentRegisterType.php:131` | RG-027(DV-11) |  |
| m10-06 | 現行踏襲 | 乖離 | 乖離（設計 vs 稼働プラグイン実装・遷移先）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Setting/Shop/DeliveryController.php:159, pf-eccube3/src/Eccube/Control` | RG-011,025 |  |
| m10-06 | 現行踏襲 | 乖離 | 乖離（現行踏襲対象の実項目が仕様書外）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Setting/Shop/DeliveryController.php:84, ec-cube-enterprise/src/Eccube/` | RG-028 |  |
| m10-06 | 現行踏襲 | 乖離 | 乖離（設計の型/長さ記述が DB正典と不一致）／要実機確認 | `ec-cube-enterprise/src/Eccube/Entity/Delivery.php:65` | RG-033 |  |
| m10-06 | 現行踏襲 | 乖離 | 乖離（設計はコア挙動・稼働はプラグイン別実装）／保存経路は要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Setting/Shop/DeliveryController.php:163, src/Eccube/Controller/Admin/S` | RG-008,009 |  |
| m10-16 | カスタマイズ | 乖離 | 乖離（Excel任意と実装required=trueの矛盾／NotBlank欠落） | `src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:195` | RG-022 |  |
| m10-16 | カスタマイズ | 乖離 | 乖離（Excel記載と実装仕様の不整合・要仕様確定） | `AdditionalSystemFormType.php:116, ConfigType.php:183` | RG-018 |  |
| m10-16 | カスタマイズ | 乖離 | 乖離（許可文字集合の相違） | `AdditionalSystemFormType.php:83, ConfigType.php:91` | RG-014,015 |  |
| m10-16 | カスタマイズ | 乖離 | 乖離（現行の必須未達・enterprise で Excel 一致に是正） | `ConfigType.php:305, AdditionalSystemFormType.php:210` | RG-020,024 |  |
| m10-16 | カスタマイズ | 乖離 | 乖離（成功メッセージ翻訳キーの相違）／要実機確認 | `AdditionalSystemController.php:103, ConfigController.php:64` | RG-002 |  |
| m10-16 | カスタマイズ | 乖離 | 乖離（Excel列挙とのフィールド差・要確認） | `AdditionalSystemFormType.php:76` | §5 台帳 |  |
| m10-16 | カスタマイズ | 乖離 | 乖離（Excel削除指示 vs 実装のキー転用） | `AdditionalSystemFormType.php:80, messages.ja.yaml:4208` | §0 |  |
| m13-02 | カスタマイズ | 乖離 | 乖離（カスタマイズ未達・新規要件） | `pf-eccube3/.../Admin/EventController.php:115` | RG-007 |  |
| m13-04 | 現行踏襲 | 乖離 | 乖離（実装バグ・pf／enterpriseで修正済み） | `RepeatScheduleController.php:104, src/Eccube/Service/Admin/Event/RepeatScheduleStoreAction.php:70` | RG-007 |  |
| m13-04 | 現行踏襲 | 乖離 | 乖離（必須バリデーション未達）／要実機確認 | `Form/Type/Admin/Schedule/RepeatScheduleType.php:40` | RG-002,DV-02,DV-03 |  |
| m13-04 | 現行踏襲 | 乖離 | 乖離（相関バリデーション未達） | `RepeatScheduleType.php:60` | RG-008,DV-04 |  |
| m13-04 | 現行踏襲 | 乖離 | 乖離（実装バグ・制約型の誤用）／要実機確認 | `RepeatScheduleType.php:112` | DV-07,DV-08 |  |
| m13-04 | 現行踏襲 | 乖離 | 乖離疑義（境界差・過剰実装）／要実機確認 | `RepeatScheduleType.php:68` | RG-008,DV-05 |  |
| m13-04 | 現行踏襲 | その他 | 設計（オラクル） | `—` |  |  |
| m13-04 | 現行踏襲 | その他 | 定員・参加費・公開状態・商品(日英)は親イベントのものをセット（Excel 0214:L2459） | `app/Plugin/HareruyaEc/Entity/DtbEventDetail.php:166` |  |  |
| m13-04 | 現行踏襲 | その他 | 期間内の選択曜日に該当する日に日程作成（Excel 0214:L2457,L2458） | `RepeatScheduleController.php:90` |  |  |
| m13-04 | 現行踏襲 | その他 | 存在しないイベントIDは404（正本 L325,L358） | `RepeatScheduleController.php:54` |  |  |
| m13-04 | 現行踏襲 | その他 | 申込受付有効で支払い方法未設定なら申込受付不可（正本 L328,L358） | `RepeatScheduleController.php:73` |  |  |

## §3. 要実機確認・軽微（P3）（31件）

| 機能 | 区分 | 分類 | 判定（設計→実装の食い違い） | file:line | RG | 裁定 |
|---|---|---|---|---|---|---|
| a01-02 | 新規実装 | 要実機確認 | Excel内部不整合（実装は02:売上で整合）／要実機確認 | `SmaregiStockChangeApplier.php:45` | RG-004 |  |
| a01-02 | 新規実装 | 要実機確認 | Excel内部不整合／運用確定は要実機確認 | `SmaregiStockBackfillCommand.php:30` | RG-015 |  |
| a06-02 | カスタマイズ | 要実機確認 | 移行差（現行実装確認済／移行先未確認・要実機確認） | `src/Controller/Admin/OtcBuyOrderController.php:35, src/Repository/DtbOtcBuyOrderRepository.php:50` | RG-001,002 |  |
| a07-02 | 現行踏襲 | 要実機確認 | オラクル間競合／要実機確認（返却値は dtb_member.name・意味づけ要確認） | `src/Repository/DtbBuyOrderRepository.php:53` | RG-005,010 |  |
| a07-02 | 現行踏襲 | 要実機確認 | Excel記述揺れ（L1144の"査定前"）／要実機確認（抽出は4種で確定） | `src/Repository/DtbBuyOrderRepository.php:35` | RG-002 |  |
| a17-03 | 現行踏襲 | 要実機確認 | 要確認: pointAttr欠落時の履歴ポイント種別の扱いが現行/移行先で異なる。オラクルに必須/デフォルトの明示なし＝要実機確認 | `PointGranterController.php:58, PointGranterAction.php:50` |  |  |
| b05-01 | 現行踏襲 | 要実機確認 | 一次=エラーメール送信（Excel記載あり）／エラー後の継続・終了ステータスは要実機確認 | `.../SmaregiOtcOrderPostAction.php:70, OtcOrderSmaregiPostCommand.php:52` | RG-011,023 |  |
| b13-02 | 現行踏襲 | 要実機確認 | 差異（抽出の時間閾値0・更新日時基準が設計で沈黙）／要実機確認 | `CheckCvsPaymentEntry.php:18, DtbEventEntryRepository.php:64` |  |  |
| b17-01 | 現行踏襲 | 要実機確認 | 実装差（設計沈黙・要実機確認・バグでない） | `AbstractListText.php:23, CreateLatestArticleListAction.php:87` | RG-004 |  |
| f04-04 | 現行踏襲 | 要実機確認 | format(waitingNumber % 10000) }}</td>{% elseif orderNumber %}<th>ご注文番号</th>...`）＝呼び出し番号ありでTC注文番号、なしでご注文番号。ただし `waitingNumber % 100 | `...Shopping/complete.twig:34` | **設計どおり✓（下4桁表示は要実機確認）** |  |
| f06-21 | 現行踏襲 | 要実機確認 | 設計の要確認に対する実態＝enterpriseはstatus実装/close_reason未設定 | `WithdrawController.php:126, WithdrawController.php:94` | RG-004 |  |
| m03-30 | カスタマイズ | 要実機確認 | オラクル矛盾（要実機確認・実装バグとは断定しない） | `ProductPriceImportHandler.php:349` | RG-002 |  |
| m04-09 | 新規実装 | 要実機確認 | 実装固有値（メッセージキー・期待に断定しない）／要実機確認 | `—` | DV-03（RG-005） |  |
| m04-09 | 新規実装 | 要実機確認 | 実装/ナラティブ由来（Excel業務仕様に非在）／要実機確認 | `src/Eccube/Service/Admin/Stock/StockTransferStoreAction.php:163, src/Eccube/Service/Admin/Stock/StockMoveOutboundApprova` | RG-021,014,015・§1副作用 |  |
| m04-10 | 新規実装 | 要実機確認 | 実装由来副作用（Excel規定外）／要実機確認 | `src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:112` | RG-010 |  |
| m04-14 | 新規実装 | 要実機確認 | 要実機確認（オラクル化しない） | `StockSplitJoinCsvExportService.php:122` | RG-009,026 |  |
| m04-20 | 新規実装 | 要実機確認 | 要実機確認（区分定義） | `DtbStockHistoryRepository.php:143` | RG-002 |  |
| m04-23 | 新規実装 | 要実機確認 | 設計書の記載欠落（実装は保護あり）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:228` | RG-039 |  |
| m04-23 | 新規実装 | 要実機確認 | 設計書の記載欠落（実装は全件ロールバック）／要実機確認 | `—` | RG-011 |  |
| m04-23 | 新規実装 | 要実機確認 | 実装事実（期待に使わない）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:427` | RG-041 |  |
| m04-23 | 新規実装 | 要実機確認 | 実装事実（期待に使わない）／要実機確認 | `—` | §5台帳(取込履歴) |  |
| m04-30 | 新規実装 | 要実機確認 | Excel沈黙・実装既定（要実機確認） | `src/Eccube/Service/Csv/Exporter/BarcodeReplacementListCsvExportService.php:73` | RG-023 |  |
| m04-30 | 新規実装 | 要実機確認 | Excel沈黙・実装既定（要実機確認） | `src/Eccube/Form/Type/Admin/BarcodeReplacementListType.php:101, src/Eccube/Controller/Admin/Stock/BarcodeReplacementListC` | RG-025 |  |
| m06-11 | 新規実装 | 要実機確認 | 実装事実（要実機確認の裏取り） | `OtcBuyOrderRestockListService.php:101` |  |  |
| m06-11 | 新規実装 | 要実機確認 | 実装事実（要実機確認の裏取り） | `OtcBuyOrderController.php:642, OtcBuyOrderRestockListService.php:96` |  |  |
| m06-11 | 新規実装 | 要実機確認 | 実装事実（要実機確認の裏取り） | `OtcBuyOrderController.php:627` |  |  |
| m06-11 | 新規実装 | 要実機確認 | 実装事実（要実機確認の裏取り） | `RestockListPdfSectionBuilder.php:31` |  |  |
| m07-08 | 新規実装 | 要実機確認 | 設計沈黙・実装のみ判定条件（要実機確認で妥当性検証） | `src/Eccube/Service/Admin/Purchase/BuyOrderRestockListService.php:30` | RG-015 |  |
| m07-08 | 新規実装 | 要実機確認 | 設計沈黙・実装のみ（原文表示の妥当性は要実機確認） | `src/Eccube/Service/Csv/Exporter/RestockListCsvRowFormatter.php:84` | RG-014 |  |
| m07-08 | 新規実装 | 要実機確認 | 設計沈黙・実装事実の記録（要実機確認） | `src/Eccube/Controller/Admin/Purchase/PurchaseController.php:637, BuyOrderRestockListCsvExportService.php:79, PurchaseCon` | RG-017,018 |  |
| m07-08 | 新規実装 | 要実機確認 | 設計沈黙・実装事実の記録（要実機確認） | `src/Eccube/Repository/DtbBuyOrderRepository.php:844` | RG-019 |  |

## 参考: 一致(非バグ) 55件

実装が設計を満たすことを確認済み（裁定不要・網羅性の証跡）。詳細は各 `_poc2_*.md` の付帯表4。

---
※ _poc2(69機能)から機械抽出。承認済み4機能(_poc_)の乖離は各ファイル参照。file:lineは `../pf-eccube3`(現行)/`../ec-cube-enterprise`(移行先)。抽出欠落時は原文の付帯表4を正とする。
# 付帯表4 バグ候補レジスタ（設計 vs 実装の乖離・裁定用）【全機能版】

> 更新: 2026-07-17 ／ 出典: `integration_test/_poc2_*.md`（**336機能・C-2量産 全19バッチ完走**）

**目的**: オラクル独立アプローチで検出した設計(Excel/詳細設計)と実装の乖離を、業務側/設計オーナーが裁定するための一覧。各行は「テスト期待には使っていない」実装事実の記録＝**バグか設計陳腐化かをここで確定**する。

**裁定欄(最右)の記入例**: `実バグ→実装修正` / `設計修正(Excel誤り)` / `詳細設計修正` / `仕様どおり→対応不要` / `保留`。

## サマリ

- 付帯表4 総行数 **2,210**（336機能）。うち **一致(非バグ)=241** は実装が設計どおりの検証済み（裁定不要）。
- **要裁定 = 1,887件**（**P1=588** / P2=1299）

| 分類 | 優先 | 件数 | 説明 |
|---|---|---|---|
| 移行退行疑い | P1 | 297 | pf-eccube3→enterprise移行で挙動が変わった疑い（最重要） |
| 未実装疑い | P1 | 208 | 設計にあるが実装に無い疑い |
| 設計誤り疑い | P1 | 42 | 詳細設計/Excelのハルシネーション・不正確 |
| バグ候補 | P1 | 41 | 実装が仕様違反の疑い |
| 乖離 | P2 | 1,111 | 設計と実装の一般的な食い違い |
| その他 | P2 | 188 | 判定文が定型外(要目視) |
| 要実機確認 | P3 | 82 | オラクル沈黙・実機で確定 |
| 一致(非バグ) | — | 241 | 実装が設計どおり（裁定不要） |

## §1. 最優先バグ候補（P1: 移行退行・未実装・設計誤り・バグ候補）（588件）

| 機能 | 区分 | 分類 | 判定（設計→実装の食い違い） | file:line | RG | 裁定 |
|---|---|---|---|---|---|---|
| a01-02 | 新規実装 | 未実装疑い | 乖離（取得期間の粒度違い・時間窓未実装） | `src/Eccube/Command/SmaregiStockBackfillCommand.php:44, src/Eccube/Service/Smaregi/Stock/SmaregiStockBackfillAction.php:6` | RG-002 |  |
| a02-01 | 現行踏襲 | 未実装疑い | 乖離（Excel設計が規定する応答項目が実装・詳細設計の双方に存在しない＝未実装の疑い）／要実機確認 | `pf-api/src/Repository/DtbProductSubClassRepository.php:52, pf-api/src/Controller/ProductController.php:61` | RG-004 |  |
| a02-03 | 現行踏襲 | 移行退行疑い | 乖離（設計間の交差・要実機確認）: Excel＋移行先実装は「商品＝言語付き／カード＝言語なし」、詳細設計は「商品＝言語なし」。A02-03 がどちらのURLを指すかが未確定。本書は正本(詳細)の明示的限定に従い言語なしURLを対象としたが、Excel基準では | `pf-api/config/routes.yaml:97, ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:317` | RG-001,004,005,015／§5 |  |
| a02-03 | 現行踏襲 | 移行退行疑い | 退行（現行踏襲違反・要実機確認）: 同一URLで現行の `cardId` が移行先で消失し、応答が14項目のカード応答へ変質。現行の消費側（記事ポップアップ）が cardId を参照していると移行後に取得不可。なお移行先の応答項目は Excel A02-03  | `pf-api/src/Repository/DtbProductRepository.php:101, pf-api/src/Controller/ProductController.php:113, ec-cube-enterprise/` | RG-004,010 |  |
| a02-03 | 現行踏襲 | 移行退行疑い | 乖離／要実機確認（Excel型表 integer vs Excelサンプル string vs 詳細 string の三者矛盾でオラクル一意化不可。加えて移行先が stock のみ int 化＝現行(string)との型差＝現行踏襲差。実装値は本ポインタに留め | `pf-api/src/Repository/DtbProductRepository.php:104, ec-cube-enterprise/src/Eccube/Service/App/Popup/PopupResponseBuilder` | RG-014,004 |  |
| a02-03 | 現行踏襲 | 移行退行疑い | 乖離（現行の非決定性・要実機確認）: 現行は並び順未指定のため複数規格/画像時にどの1件が返るかDB依存で非決定。移行先は優先順を定義しており、同一データでも返る規格/画像が現行と変わりうる＝現行踏襲差。設計(L325)は選択規則を規定していない | `pf-api/src/Repository/DtbProductRepository.php:114, ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2491` | RG-001,004／§5（要判定） |  |
| a02-04 | 現行踏襲 | バグ候補 | 乖離（Excel規定の応答フィールド欠落。特に `productUrl` は 0502:L1564 が本機能の主目的「商品ページURLを含む商品情報」として規定するもので、未返却ならポップアップから商品ページへ遷移できない＝バグ候補。詳細設計も同じ欠落を追認） | `pf-api/src/Repository/DtbProductSubClassRepository.php:194` | RG-006,007 |  |
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
| a05-03 | カスタマイズ | 移行退行疑い | 乖離（現行未実装・移行先で実装。パス形も相違） | `pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php:284, pf-eccube3/app/Plugin/HareruyaEc/Re` | RG-003,014 |  |
| a05-03 | カスタマイズ | 移行退行疑い | 乖離（IP制限認証 未実装・現行/移行先とも匿名） | `pf-eccube3/app/Plugin/HareruyaEc/Controller/WaitingNumberController.php:22, FrontControllerProvider.php:284, ec-cube-ent` | RG-010 |  |
| a05-03 | カスタマイズ | 移行退行疑い | 乖離（要素型の不定・要実機確認。移行先は(int)是正済み） | `pf-eccube3/app/Plugin/HareruyaEc/Controller/WaitingNumberController.php:45, pf-eccube3/app/Plugin/HareruyaEc/Entity/DtbW` | RG-008 |  |
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
| a06-04 | 現行踏襲 | 未実装疑い | 乖離（Excel記載のIP制限がアプリ未実装・要実機確認） | `src/Controller/Admin/OtcBuyOrderFreeCommentController.php:21, src/Controller/BaseController.php:24` | RG-008〜010 |  |
| a06-04 | 現行踏襲 | バグ候補 | 乖離（実装バグ候補・非署名系JWT例外で500／要実機確認） | `src/Controller/BaseController.php:31` | RG-009・§5「期限切れ/不正形式トークン」 |  |
| a06-05 | カスタマイズ | 未実装疑い | 乖離（現在ステータス制限がpf-api未実装） | `OtcBuyOrderStatusController.php:33, UpdateStatusAction.php:88` | RG-024,TR-14 |  |
| a06-05 | カスタマイズ | 移行退行疑い | 乖離（enterprise移行でメッセージ書式が退行・要実機確認で確定） | `OtcBuyOrderStatusController.php:68, UpdateStatusAction.php:101` | RG-006 |  |
| a06-07 | 現行踏襲 | 移行退行疑い | 乖離（現行pf-apiは基準価格カスタマイズ未実装／詳細設計HTMLも取りこぼし。移行先で是正済み） | `pf-api/src/Repository/DtbProductRepository.php:218, ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.ph` | RG-002,012 |  |
| a06-07 | 現行踏襲 | 移行退行疑い | 乖離（現行pf-apiは本店/所属店舗EC在庫カスタマイズ未実装／詳細設計HTMLも取りこぼし。移行先で是正済み） | `pf-api/src/Repository/DtbProductRepository.php:221, ec-cube-enterprise/.../BuyingController.php:125, MtbCardRepository.p` | RG-003,012 |  |
| a06-07 | 現行踏襲 | 移行退行疑い | 乖離（移行先の0件レスポンス形状が設計/現行の`[]`と不一致・`{"cards":[]}`） | `pf-api/src/Repository/HierarchicalDataTrait.php:19, ec-cube-enterprise/.../BuyingController.php:82` | RG-004,005,013 |  |
| a06-07 | 現行踏襲 | 移行退行疑い | 乖離懸念（現行postに認証チェック不在／移行先は認証あり） | `pf-api/src/Controller/ProductController.php:181, ec-cube-enterprise/.../BuyingController.php:83` | RG-015 |  |
| a06-07 | 現行踏襲 | 移行退行疑い | 乖離（リクエスト書式＝ids位置のExcel=クエリ／詳細設計=ボディの競合。実装は現行がクエリ・ボディ両取り、移行先はボディ限定。契約オラクルはExcel優先で＝クエリを正とし、ボディ実挙動は補完・要実機確認に縮退） | `pf-api/src/Controller/ProductController.php:183, ec-cube-enterprise/.../BuyingController.php:70` | RG-011 |  |
| a06-08 | 現行踏襲 | 未実装疑い | 乖離（必須制約未実装）／要実機確認 | `src/Controller/ProductController.php:197, src/Repository/DtbProductRepository.php:246` | RG-010 |  |
| a06-11 | 現行踏襲 | 移行退行疑い | 乖離（移行退行・API契約破壊） | `src/Controller/ProductController.php:486, src/Eccube/Controller/App/MTGBuyer/V1/Admin/SectionController.php:40` | RG-001,004,006,007,008 |  |
| a06-11 | 現行踏襲 | 移行退行疑い | 乖離（現行アプリ層で認証未強制・インフラ依存／移行で強制層が変化）／要実機確認 | `config/routes.yaml:239, config/packages/security.yaml:10, SectionController.php:25` | RG-010 |  |
| a06-12 | 現行踏襲 | 移行退行疑い | 乖離（移行先の契約破壊・退行） | `ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OptionController.php:60, pf-api/src/Controller/ProductCon` | RG-001,002,004 |  |
| a06-16 | 新規実装 | 設計誤り疑い | 乖離（3者不一致・詳細設計ハルシネーション是正） | `OtcBuyOrderController.php:239` | RG-004,005 |  |
| a07-01 | 現行踏襲 | 設計誤り疑い | 乖離（詳細設計ハルシネーション・実装は参照のみ） | `OptionController.php:20, OptionController.php:36` | RG-007 |  |
| a07-01 | 現行踏襲 | 移行退行疑い | 乖離（Excelパスと現行pf-api入口の差・移行先とは一致） | `config/routes.yaml:10, src/Eccube/Controller/App/MTGBuyer/V1/Admin/OptionController.php:35` | RG-001,002 |  |
| a07-02 | 現行踏襲 | 設計誤り疑い | 詳細設計のハルシネーション（Excel＝実装＝文字列。競合ルールでExcel採用） | `src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:72` | RG-010,023 |  |
| a07-02 | 現行踏襲 | 設計誤り疑い | 詳細設計のハルシネーション/乖離（Excel採用） | `BuyOrderController.php:73` | RG-023 |  |
| a07-02 | 現行踏襲 | 移行退行疑い | 乖離（移行での連結挙動差）／要実機確認 | `BuyOrderController.php:65` | RG-004 |  |
| a07-03 | 現行踏襲 | バグ候補 | 乖離（改ざん/期限切れ/形式不正トークンが401にならないバグ候補）／要実機確認 | `src/Controller/BaseController.php:30` | RG-007（DA-02） |  |
| a07-04 | 現行踏襲 | 移行退行疑い | 乖離（現行↔移行先の挙動差・要仕様確定） | `src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateStatusAction.php:28` | RG-012,DT-10 |  |
| a07-04 | 現行踏襲 | 移行退行疑い | 乖離（設計と実装の差・移行先） | `.../BuyOrder/UpdateStatusAction.php:110, BuyOrderController.php:159, BuyOrderStatusController.php:96` | RG-010,RG-009 |  |
| a07-05 | 現行踏襲 | 未実装疑い | 乖離（★カスタマイズ未実装・リクエスト値直使用／厳密比較の型不一致） | `src/Controller/Admin/BuyOrderController.php:186` | RG-015 |  |
| a14-01 | 現行踏襲 | 未実装疑い | 未実装（カスタマイズ要件未反映）／要実機確認 | `ec-cube-enterprise/src/Eccube/Entity/Master/MtbCard.php:333` | RG-011 |  |
| a14-01 | 現行踏襲 | 未実装疑い | 未実装（カスタマイズ要件未反映・API/DB間の列名不整合）／要実機確認 | `pf-api/src/Entity/MtbColorSequence.php:23, pf-api/src/Resources/config/doctrine/MtbColorSequence.orm.yml:22, ec-cube-ent` | RG-016 |  |
| a14-01 | 現行踏襲 | 未実装疑い | 未実装（カスタマイズ要件未反映・値2を表現不可）／要実機確認 | `pf-api/src/Entity/MtbCardDetail.php:94, pf-api/src/Resources/config/doctrine/MtbCardDetail.orm.yml:96, ec-cube-enterpris` | RG-012,013 |  |
| a14-01 | 現行踏襲 | 未実装疑い | 未実装（カスタマイズ要件未反映・除去漏れ）／要実機確認 | `pf-api/src/Entity/MtbCardDetail.php:99, pf-api/src/Resources/config/doctrine/MtbCardDetail.orm.yml:103, ec-cube-enterpri` | RG-015 |  |
| a14-01 | 現行踏襲 | 未実装疑い | 未実装＋乖離（カスタマイズ要件未反映・名称/型不一致）／要実機確認 | `ec-cube-enterprise/src/Eccube/Entity/Master/MtbCardDetail.php:308` | RG-014 |  |
| a14-02 | 現行踏襲 | 未実装疑い | 乖離（カスタマイズ未実装・項目名/値域）／要実機確認 | `pf-api/src/Entity/MtbCardDetail.php:94, pf-api/config/bundles.php:15, ec-cube-enterprise/src/Eccube/Entity/Master/MtbCar` | RG-008,009(DV-04〜06) |  |
| a14-02 | 現行踏襲 | 未実装疑い | 乖離（カスタマイズ未実装＋DB列名/型とExcel応答型の不一致・変換規則未定義）／要実機確認 | `ec-cube-enterprise/src/Eccube/Entity/Master/MtbCardDetail.php:308` | RG-010 |  |
| a14-02 | 現行踏襲 | 未実装疑い | 乖離（カスタマイズ未実装・除去対象項目が応答に残存）／要実機確認 | `pf-api/src/Entity/MtbCardDetail.php:99, ec-cube-enterprise/src/Eccube/Entity/Master/MtbCardDetail.php:293` | RG-011 |  |
| a15-01 | 現行踏襲 | 移行退行疑い | 乖離（移行非対応・移行先DBでは現行の検索条件が成立しない）／要実機確認 | `deck-api/src/Controller/LoginController.php:43, deck-api/src/Entity/DtbCustomer.php:173, ec-cube-enterprise/src/Eccube/E` | RG-026,RG-009,RG-010 |  |
| a15-02 | 現行踏襲 | 移行退行疑い | 乖離（移行時のトークン互換が未確定・設計が明示的に先送り）／要実機確認 | `deck-api/src/Controller/LoginController.php:60, src/Service/AuthService.php:21, deck-api/src/Entity/DtbPlayer.php:87, de` | RG-011,020 |  |
| a15-03 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・認証拒否ステータスの退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/GetUserAction.php:43, src/Eccube/Controller/App/DeckBuilder/UserCo` | RG-006(DV-03),RG-010,RG- |  |
| a15-04 | 現行踏襲 | 移行退行疑い | 乖離（設計の確定漏れ・論理削除の扱いが未記述＝移行時に挙動が変わりうる）／要実機確認 | `deck-api/config/packages/doctrine.yaml:41, deck-api/src/Entity/DtbPlayer.php:14, src/Controller/CustomerController.php:5` | DV-06 |  |
| a15-04 | 現行踏襲 | バグ候補 | 一致（バグ候補ではない・裏取りのみ） | `deck-api/src/Resources/config/doctrine/DtbPlayer.orm.yml:22, ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:43, orm.` | RG-010,022 |  |
| a15-05 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・認証失敗ステータスの退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/UserController.php:122, ec-cube-enterprise/src/Eccube/Service/A` | RG-009,012,020（DV-11） |  |
| a15-07 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・404メッセージ契約の退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/ArchetypeController.php:47, ec-cube-enterprise/src/Eccube/Resou` | RG-004,010 |  |
| a15-09 | 現行踏襲 | 移行退行疑い | 乖離（公開範囲のDB表現の記述不整合・移行先 NOT NULL 制約）／要実機確認 | `ec-cube-enterprise/src/Eccube/Entity/DtbDeck.php:129, deck-api/src/Service/DeckService.php:195` | RG-038, RG-003（DV-01〜03） |  |
| a15-14 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・占有率の分母退行）＋正本の記述不整合／要実機確認・仕様確定要 | `deck-api/src/Repository/DtbDeckRepository.php:746, deck-api/src/Controller/MetagameController.php:49, ec-cube-enterprise` | RG-016 |  |
| a15-14 | 現行踏襲 | 移行退行疑い | 乖離（移行先でエンドポイントパス変更・現行踏襲差）／要実機確認 | `deck-api/config/routes.yaml:49, ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:556` | RG-001,026 |  |
| a15-14 | 現行踏襲 | 移行退行疑い | 乖離（移行先でエラーメッセージ文言変更・現行踏襲違反）／要実機確認 | `deck-api/src/Controller/MetagameController.php:29, ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckControll` | RG-017,018 |  |
| a15-14 | 現行踏襲 | 移行退行疑い | 乖離（移行先で結果キャッシュ消失・現行踏襲違反）／要実機確認 | `deck-api/src/Repository/DtbDeckRepository.php:750, ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:526` | RG-024,025 |  |
| a15-14 | 現行踏襲 | 移行退行疑い | 乖離（400/404の分岐境界が移行先で変化・現行踏襲差）／要実機確認 | `deck-api/src/Controller/MetagameController.php:25, ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckControll` | RG-017,018,030 |  |
| a15-15 | 現行踏襲 | 移行退行疑い | 乖離（移行先に当該エンドポイント未実装・件数上限/絞り込み/論理削除条件の差）／要実機確認 | `deck-api/config/routes.yaml:53, ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:1062, deck-api/src/Reposi` | RG-001,008,009,016 |  |
| a15-16 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・応答日時形式の退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:653` | RG-011,012 |  |
| a15-17 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・部分成功コードの退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:727` | RG-011（DV-05） |  |
| a15-17 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・下書き整合の退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/ImportDeckAction.php:100, ec-cube-enterprise/src/Eccube/Service/De` | RG-020 |  |
| a15-17 | 現行踏襲 | 移行退行疑い | 乖離（リクエスト本文形式の退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:688` | RG-026,027・§1 |  |
| a15-18 | 現行踏襲 | 移行退行疑い | 乖離（重大・移行先の実装漏れ／更新のたびに明細が重複蓄積）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/ImportDeckAction.php:100, deck-api/src/Service/DeckService.php:86,` | RG-020,021,029 |  |
| a15-18 | 現行踏襲 | 移行退行疑い | 乖離（重大・移行先の実装漏れ／部分成功が常に200＝呼び出し元が解読失敗を検知できない）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:729, deck-api/src/Controller/DeckController.` | RG-011 |  |
| a15-18 | 現行踏襲 | 移行退行疑い | 乖離（重大・移行先の実装漏れ／更新後も旧下書きが残り不整合）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/DeckService.php:287, deck-api/src/Controller/DeckController.php:400` | RG-022 |  |
| a15-18 | 現行踏襲 | 移行退行疑い | 乖離（現行の実装不備・移行先で是正／設計の400が現行で満たされない）／要実機確認 | `deck-api/src/Controller/DeckController.php:396, ec-cube-enterprise/.../ImportDeckAction.php:82` | RG-017,DV-06 |  |
| a16-02 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・404本文のキーと文言の退行）／要実機確認 | `pf-api/src/Controller/BannerController.php:53, ec-cube-enterprise/src/Eccube/Controller/App/ContentController.php:114` | RG-009,010 |  |
| a17-03 | 現行踏襲 | バグ候補 | バグ候補（要確定）: Excel基本設計は404を要求するが実装は両系とも400。実バグ（実装が仕様違反）か、Excelの誤り（実運用は400が正）かは連携元(PointGranter)期待値で要確定。詳細設計HTMLはExcelに合わせ404へ是正すべき | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Api/PointGranterController.php:27, ec-cube-enterprise/src/Eccube/Controller/` |  |  |
| a17-03 | 現行踏襲 | 設計誤り疑い | 設計書乖離: 実際に加算されるのはプレイヤー(`dtb_player.point`)。詳細設計DBカラム表の `dtb_customer.point` は不正確。履歴の customer_id は `$Player->getCustomer()` 由来で会員に | `PointGranterController.php:50, PointGranterAction.php:66, DtbPlayer.php:89` |  |  |
| a17-03 | 現行踏襲 | バグ候補 | バグ候補（要検証）: 連携元(PointGranter)が送るヘッダ名と移行先の受信キーが不一致だと、必須ヘッダ欠落と誤判定し全リクエストが400/404に落ちうる。移行時の受信キー整合を要確認 | `PointGranterController.php:26, PointGranterController.php:47` |  |  |
| a17-03 | 現行踏襲 | バグ候補 | バグ候補（現行）: 現行は堅牢性欠如（構造不正で異常終了しうる）。移行先は是正済み。オラクル沈黙部のため期待は要実機確認（§3 DP-05） | `PointGranterController.php:45, PointGranterController.php:82` |  |  |
| a17-03 | 現行踏襲 | 移行退行疑い | 参考（乖離軽微）: 移行先は加算＋履歴をトランザクションで原子化し片側更新を防止（RG-015連携整合の実装が堅牢化）。現行はflush一括で概ね同等。裏取り記録 | `PointGranterController.php:59, PointGranterAction.php:57` |  |  |
| a17-04 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・404応答本文の退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:60, ec-cube-enterprise/src/Eccube/EventListener/Excep` | RG-005 |  |
| a17-04 | 現行踏襲 | 未実装疑い | 乖離（設計規定の並び順rank未実装・順序不定）／要実機確認 | `pf-api/src/Repository/DtbProductRepository.php:313, ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:270` | RG-017 |  |
| a17-04 | 現行踏襲 | 移行退行疑い | 乖離（設計のDBカラム記述と移行先実装の不一致・拠点/ロケーション条件が設計に無い）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:278, pf-api/src/Repository/DtbProductRepository.php:321` | RG-018 |  |
| b02-01 | カスタマイズ | 未実装疑い | 乖離（★カスタマイズ未実装）／要実機確認 | `ec-cube-enterprise/src/Eccube/Command/AggregateSalesCommand.php:29, ec-cube-enterprise/src/Eccube/Service/Product/BatchA` | RG-013 |  |
| b02-02 | カスタマイズ | 未実装疑い | 乖離（★カスタマイズ未実装・データ設計）／要実機確認 | `ec-cube-enterprise/src/Eccube/Entity/DtbProductRequest.php:34, pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbProductReq` | RG-008 |  |
| b02-02 | カスタマイズ | 未実装疑い | 乖離（★カスタマイズ未実装・対象取りこぼし）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/DtbProductRequestRepository.php:475` | RG-007 |  |
| b02-03 | カスタマイズ | 未実装疑い | 乖離（当日集計未実装） | `DtbStockUpQuantityRepository.php:230` | RG-006,DDT DB-04 |  |
| b02-03 | カスタマイズ | 未実装疑い | 乖離（メール通知未実装） | `src/Eccube/Command/AggregateStockUpCommand.php:49` | RG-014 |  |
| b02-03 | カスタマイズ | 移行退行疑い | 乖離（詳細設計の記述が移行先と不一致） | `src/Eccube/Command/AggregateStockUpCommand.php:34, app/Plugin/HareruyaEc/Command/ProductBatch.php:20` | RG-001,015 |  |
| b02-04 | 現行踏襲 | 未実装疑い | 乖離（単独バッチ未実装／設計内矛盾＝本機能の要否が未確定）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2335, ec-cube-enterprise/src/Eccube/Service/Admin/Ot` | 全RG（特に RG-001,015） |  |
| b02-04 | 現行踏襲 | 移行退行疑い | 乖離（抽出条件の退行・公開判定欠落）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:935` | RG-002,008,016 |  |
| b02-04 | 現行踏襲 | バグ候補 | バグ候補（構文エラーで通知経路が動作しない疑い）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:956` | RG-002,007 |  |
| b02-04 | 現行踏襲 | 移行退行疑い | 乖離（部門保持先の記述差・移行時の読み替え未反映）／要実機確認 | `app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:1501, ec-cube-enterprise/src/Eccube/Repository/Product` | RG-003,016 |  |
| b02-04 | 現行踏襲 | 移行退行疑い | 乖離（移行先で件名がExcelと不一致）／要実機確認 | `app/Plugin/HareruyaEc/Service/MailService.php:1190, ec-cube-enterprise/src/Eccube/Service/MailService.php:1212, ec-cube-` | RG-004 |  |
| b02-04 | 現行踏襲 | 未実装疑い | 乖離（エラーハンドリング未実装）／要実機確認 | `app/Plugin/HareruyaEc/Service/Product/CheckNoSectionProduct.php:28, app/Plugin/HareruyaEc/Command/ProductBatch.php:39, a` | RG-013 |  |
| b02-05 | 現行踏襲 | 移行退行疑い | 乖離（★カスタマイズ要件が現行に未実装／移行先はREGULAR限定で範囲差）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbFavoriteProductRepository.php:24, ec-cube-enterprise/src/Eccube/Repositor` | RG-005,006,007（DV-04〜06, |  |
| b02-05 | 現行踏襲 | 移行退行疑い | 乖離（詳細設計のDBカラム/集約単位記述と移行先実装の不一致）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/CustomerFavoriteProductRepository.php:230, BatchFavoriteSaleNotificationAction.` | RG-008,012,013 |  |
| b02-05 | 現行踏襲 | 移行退行疑い | 乖離（大量件数対応の退行）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Service/Product/SaleNotificationService.php:54, ec-cube-enterprise/src/Eccube/Repositor` | RG-019 |  |
| b02-05 | 現行踏襲 | 移行退行疑い | 乖離（現行のエラー出力欠落／移行先は個別失敗をログのみで継続＝失敗の可視性差）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Service/Product/SaleNotificationService.php:27, pf-eccube3/app/Plugin/HareruyaEc/Servic` | RG-023,024 |  |
| b02-06 | カスタマイズ | 未実装疑い | 乖離（Excel基本設計とその詳細設計/実装が別処理を指す・Excel記述機能の未実装疑い）／要実機確認（どちらが真のB02-06かの確定が必要） | `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:12, pf-eccube3/app/Plugin/HareruyaEc/Service/Product/InsertSto` | RG-031〜037 |  |
| b02-06 | カスタマイズ | 移行退行疑い | 乖離（移行先バッチ未実装・移行漏れ疑い）／要実機確認 | `ec-cube-enterprise/src/Eccube/Command/InventoryReflectionCommand.php:29, ec-cube-enterprise/src/Eccube/Entity/DtbStockHi` | RG-027,028,029 |  |
| b02-07 | カスタマイズ | 移行退行疑い | 乖離（詳細設計のコマンド名が移行先実装と不一致） | `app/Plugin/HareruyaEc/Command/ProductBatch.php:17, src/Eccube/Command/UpdateWeeklyStockHistoryCommand.php:35` | RG-001,012 |  |
| b02-07 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ未達・スマレジ合算未実装）／要実機確認 | `src/Eccube/Service/Product/BatchUpdateWeeklyStockHistoryAction.php:41, DtbWeeklyStockHistoryTempRepository.php:69` | RG-003,018 |  |
| b02-07 | カスタマイズ | 移行退行疑い | 乖離（移行先の「最新」がidベースで作成日順と乖離しうる）／要実機確認 | `app/Plugin/HareruyaEc/Repository/DtbStockHistoryRepository.php:227, src/Eccube/Repository/DtbWeeklyStockHistoryTempRepos` | RG-002(DW-01,02) |  |
| b05-01 | 現行踏襲 | 移行退行疑い | 乖離（詳細設計の入口記述が移行先実装と不一致） | `src/Eccube/Command/OtcOrderSmaregiPostCommand.php:25, app/Plugin/HareruyaEc/Command/OrderBatch.php:13` | RG-001,009 |  |
| b05-02 | 現行踏襲 | 移行退行疑い | 乖離（現行バグ・移行先で是正） | `pf-eccube3/app/Plugin/HareruyaEc/Service/Order/ResendMail.php:50, ec-cube-enterprise/src/Eccube/Service/Admin/Order/Rese` | RG-017,022 |  |
| b05-02 | 現行踏襲 | 移行退行疑い | 乖離疑義（TZ不一致・移行退行）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Repository/OrderRepository.php:1445, ec-cube-enterprise/src/Eccube/Repository/OrderRepo` | RG-004(DV-07〜09) |  |
| b05-03 | カスタマイズ | バグ候補 | 乖離（バグ候補・要修正確認） | `pf-eccube3/app/Plugin/HareruyaEc/Service/Order/TruncateWaitingNumber.php:29, pf-eccube3/app/Plugin/HareruyaEc/Command/Or` | RG-009 |  |
| b05-03 | カスタマイズ | 移行退行疑い | 乖離（現行の過渡的不整合・移行先で是正／PG前提要確認） | `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbWaitingNumberRepository.php:15, ec-cube-enterprise/src/Eccube/Service/Adm` | RG-010 |  |
| b05-03 | カスタマイズ | 移行退行疑い | 乖離（コマンド名・移行実装値・要実機確認） | `ec-cube-enterprise/src/Eccube/Command/TruncateWaitingNumberCommand.php:25` | RG-001,007 |  |
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
| b06-02 | カスタマイズ | 移行退行疑い | 乖離（pf-eccube3 現行はカスタマイズ未達／移行先 enterprise で是正済み・詳細設計HTMLの記述も旧ステータスで陳腐化） | `app/Plugin/HareruyaEc/Repository/DtbOtcBuyOrderRepository.php:338, src/Eccube/Entity/Master/MtbOtcBuyOrderStatus.php:66,` | RG-014, DS-01〜06 |  |
| b06-02 | カスタマイズ | 移行退行疑い | 乖離（実装バグ・通知対象がステータス無条件で集計対象と不整合・移行先も未修正）／要実機確認 | `DtbOtcBuyOrderRepository.php:370, src/Eccube/Repository/DtbOtcBuyOrderRepository.php:957` | RG-009 |  |
| b08-02 | 現行踏襲 | 移行退行疑い | 乖離（enterpriseで退行・要実機確認） | `app/Plugin/HareruyaEc/Service/Customer/LostPoints.php:56, src/Eccube/Service/Admin/Customer/LostPointsAction.php:78` | RG-007 |  |
| b08-02 | 現行踏襲 | 移行退行疑い | 乖離（enterpriseで外部連携整合退行・要実機確認） | `LostPoints.php:45, LostPointsAction.php:68` | RG-006,009 |  |
| b08-02 | 現行踏襲 | 移行退行疑い | 乖離（コマンド名の移行差異・要実機確認） | `app/Plugin/HareruyaEc/Command/CustomerBatch.php:14, src/Eccube/Command/LostPointsCommand.php:25` | RG-011,012 |  |
| b08-03 | 現行踏襲 | 移行退行疑い | 乖離（移行でコマンド名改称・設計/現行と不一致）／要実機確認 | `app/Plugin/HareruyaEc/Command/CustomerBatch.php:16, src/Eccube/Command/PointExpireNotificationCommand.php:25` | RG-001,012 |  |
| b08-03 | 現行踏襲 | 移行退行疑い | 乖離（移行先の開始/完了ログに日時なし） | `...CustomerBatch.php:50, ...PointExpireNotificationCommand.php:38` | RG-013 |  |
| b08-04 | 現行踏襲 | 移行退行疑い | 乖離（移行でコマンド名改称・設計/現行と不一致）／要実機確認 | `app/Plugin/HareruyaEc/Command/CustomerBatch.php:17, src/Eccube/Command/CheckBlankRequiredItemCustomerCommand.php:25` | RG-001,007 |  |
| b08-04 | 現行踏襲 | 移行退行疑い | 乖離（現行pfが空文字未検出・移行先は検出） | `app/Plugin/HareruyaEc/Repository/CustomerRepository.php:143, src/Eccube/Repository/CustomerRepository.php:658` | RG-003(DB-02) |  |
| b08-04 | 現行踏襲 | 移行退行疑い | 乖離（必須列集合/郵便番号判定が現行と移行先で不一致・現行はzip部分空欄を見逃す） | `...CustomerRepository.php:155, ...CustomerRepository.php:678` | RG-003,006,015 |  |
| b08-04 | 現行踏襲 | 移行退行疑い | 乖離（移行先の送信エラーがコンソール非出力・握り潰し） | `src/Eccube/Service/MailService.php:1305, CheckBlankRequiredItemCustomerCommand.php:40, ...MailService.php:1474` | RG-008 |  |
| b08-04 | 現行踏襲 | 移行退行疑い | 乖離（移行先の開始/完了ログに日時なし） | `...CustomerBatch.php:50, ...CheckBlankRequiredItemCustomerCommand.php:38` | RG-009 |  |
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
| f02-02 | カスタマイズ | 未実装疑い | 未実装（Excelカスタマイズ要件の実装差分）／新規実装が必要 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/base_sp_navigator.twig:5, base_sp_navigator_unisuggest.` | RG-005,007〜014,018〜033 |  |
| f02-03 | カスタマイズ | 未実装疑い | 乖離（(10-3)フォーマットメニューの6番目「その他」が未実装）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Block/CategoryListBlockPayloadBuilder.php:81, ec-cube-enterprise/src/Eccube/Resour` | RG-036 |  |
| f03-01 | カスタマイズ | 移行退行疑い | 乖離（0件時応答ステータスの退行・経路差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:140, pf-eccube3/app/Plugin/HareruyaEc/Controller/Pr` | RG-008,010 |  |
| f03-02 | カスタマイズ | 移行退行疑い | 乖離（履歴上限の退行 18→15・未使用定数との二重管理）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/product_detail_js.twig:419, ec-cube-enterprise/src/Eccu` | RG-075(DV-13),RG-074 |  |
| f03-02 | カスタマイズ | 未実装疑い | 乖離（旧コード転送の未実装・入口欠落）／要実機確認 | `ec-cube-enterprise/src/Eccube/Entity/Master/MtbProductCodeMapping.php:23, ec-cube-enterprise/src/Eccube/Repository/Maste` | RG-003,004,005 |  |
| f03-03 | カスタマイズ | 移行退行疑い | 乖離（Excel廃止要件の未反映・刷新後に実装不要な項目が移行先に存在）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Front/SearchType.php:116, pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Front/Produ` | §0（廃止・生成せず） |  |
| f03-03 | カスタマイズ | 未実装疑い | 現行のみ未実装（カスタマイズ新規＝想定内）／移行先はExcel充足。要実機確認は「特殊」の絞り込み結果 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Front/Product/SearchType.php:171, pf-eccube3/app/Plugin/HareruyaEc/config.yml` | RG-016・DV-14 |  |
| f03-03 | カスタマイズ | 未実装疑い | 現行のみ未実装（カスタマイズ新規＝想定内）／移行先はExcel充足。クエリ名 `frameFlg` は設計書に記載が無く要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Front/SearchType.php:231` | RG-017・DV-15 |  |
| f03-03 | カスタマイズ | 移行退行疑い | 乖離（現行未実装＝想定内／移行先はパス順・書式がExcel例示と不一致）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php:48, pf-eccube3/app/Plugin/HareruyaEc/Con` | RG-009,010 |  |
| f03-05 | 現行踏襲 | 移行退行疑い | 乖離（Excel明示の表示ページ欠落・退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:21, ec-cube-enterprise/src/Eccube/Controller/F` | RG-001,RG-002 |  |
| f03-05 | 現行踏襲 | 移行退行疑い | 乖離（表示件数の目減り・退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php:119, ec-cube-enterprise/src/Eccube/Service/RecommendSer` | RG-016 |  |
| f03-06 | カスタマイズ | 未実装疑い | 乖離（Excelカスタマイズ要件の表示上限15件が未実装・16〜18件目が表示されうる）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Block/HistoryController.php:16, pf-eccube3/app/Plugin/HareruyaEc/Controller/` | RG-003(DV-05,06),RG-004 |  |
| f03-06 | カスタマイズ | 未実装疑い | 乖離（Excelカスタマイズ要件の公開/非公開制御が未実装・非公開商品の露出）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Repository/ProductRepository.php:500` | RG-005 |  |
| f03-06 | カスタマイズ | 未実装疑い | 乖離（Excelカスタマイズ要件★の支店表示フラグ制御が未実装）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Repository/ProductRepository.php:520, pf-eccube3/app/Plugin/HareruyaEc/Controller/Block` | RG-006,RG-007 |  |
| f03-06 | カスタマイズ | 未実装疑い | 乖離（Excel画面項目4件が未実装・商品一覧と同じ体裁になっていない）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/history.twig:1, ProductRepository.php:502, history.twig` | RG-009,RG-012,RG-013,RG- |  |
| f03-06 | カスタマイズ | 移行退行疑い | 乖離（詳細設計の日本語見出し文言と実装の差・移行時の文言確定要）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:328, message.en.yml:312` | RG-020 |  |
| f03-08 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・解除の未ログイン扱いの退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:861` | RG-010,014 |  |
| f04-01 | カスタマイズ | 未実装疑い | 乖離（★カスタマイズ未実装・画面再読み込みが残存）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Cart/index.twig:17, pf-eccube3/app/Plugin/HareruyaEc/Controll` | RG-014,015 |  |
| f04-01 | カスタマイズ | 未実装疑い | 乖離（★カスタマイズ未実装・入力制御なし／送信後クランプ）／要実機確認 | `pf-eccube3/.../Cart/index.twig:41, pf-eccube3/src/Eccube/Service/CartService.php:656` | RG-016,017,022(DV-02,03) |  |
| f04-01 | カスタマイズ | 未実装疑い | 乖離（★カスタマイズ未実装・入力制御なし／送信後クランプ）／要実機確認 | `pf-eccube3/.../Cart/index.twig:41, pf-eccube3/src/Eccube/Service/CartService.php:679` | RG-018,019,022(DV-04,05) |  |
| f04-01 | カスタマイズ | 未実装疑い | 乖離（★カスタマイズ未実装・0以下入力で削除が発生）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/CartController.php:268` | RG-020,022(DV-06,07) |  |
| f04-01 | カスタマイズ | 未実装疑い | 乖離（★カスタマイズ未実装・店舗別カート機構なし）／要実機確認 | `—` | RG-002,003,024,028 |  |
| f04-01 | カスタマイズ | 未実装疑い | 乖離（★カスタマイズ未実装・削除範囲が閲覧店舗に限定されない）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/CartController.php:202, pf-eccube3/app/Plugin/HareruyaEc/Service/CartService` | RG-024,028 |  |
| f04-01 | カスタマイズ | 未実装疑い | 乖離（★カスタマイズ未実装・閲覧店舗別TOPへ遷移しない）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Cart/index.twig:95` | RG-032 |  |
| f04-02 | カスタマイズ | 未実装疑い | 乖離（★カスタマイズ要件の未実装・文言分岐なし）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/index.twig:329, pf-eccube3/app/Plugin/HareruyaEc/Res` | RG-068,RG-069 |  |
| f04-02 | カスタマイズ | 未実装疑い | 乖離（★カスタマイズ要件の未実装疑い）／要実機確認（レイアウト管理側でブロック配置される可能性を実機で確認する） | `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Model/ColumnDefinitions.php:422` | RG-060 |  |
| f04-03 | カスタマイズ | 移行退行疑い | 乖離（詳細設計HTMLの記述漏れ＝Excelカスタマイズ要件の未反映。実装は移行先で充足・現行は未対応で想定内）／要実機確認（enterprise 確認画面の addr03 表示が `if addr03` のデータ有無条件であり、Excel L2108 の「国 | `ec-cube-enterprise/src/Eccube/Form/Type/AddressType.php:48, ec-cube-enterprise/src/Eccube/Resource/template/default/Shop` | RG-006,029,036 |  |
| f04-04 | 現行踏襲 | 未実装疑い | 乖離（pf未実装・遅延秒 要実機確認・詳細設計記述漏れ） | `app/Plugin/HareruyaEc/Resource/template/default/Shopping/complete.twig:1, src/Eccube/Resource/template/default/Shopping/` | RG-026 |  |
| f04-04 | 現行踏襲 | 未実装疑い | 乖離（pf未実装・enterpriseで充足・詳細設計記述漏れ） | `app/Plugin/HareruyaEc/Resource/template/default/Shopping/complete.twig:18, src/Eccube/Resource/template/default/Shopping` | RG-027 |  |
| f05-01 | カスタマイズ | 移行退行疑い | 乖離（現行pf未実装・移行先要実機確認） | `PurchaseController.php:58, DtbProductSubClassRepository.php:861, src/Eccube/Resource/template/default/Purchase/index.twi` | RG-003,004 |  |
| f05-01 | カスタマイズ | 未実装疑い | 乖離（強化買取コーナー 未実装懸念・要実機確認） | `PurchaseController.php:58, PurchaseController.php:368` | RG-010 |  |
| f05-01 | カスタマイズ | 設計誤り疑い | 乖離（詳細設計ハルシネーション・是正済） | `PurchaseController.php:58, PurchaseController.php:368` | RG-022,024 |  |
| f05-01 | カスタマイズ | 設計誤り疑い | 乖離（詳細設計 用語ハルシネーション・機能差なし） | `Tag.php:14, Tag.php:59` | RG-001 |  |
| f05-02 | カスタマイズ | 移行退行疑い | 乖離（現行カスタマイズ未達・移行先で対応） | `app/Plugin/HareruyaEc/Controller/ProductSearchTrait.php:96, FrontProductSearchRequestQueryNormalizer.php:51` | RG-027 |  |
| f05-02 | カスタマイズ | 移行退行疑い | 乖離（現行カスタマイズ未達・移行先で対応） | `PurchaseController.php:489, src/Eccube/Controller/Front/Purchase/PurchaseController.php:425` | RG-001,002,003 |  |
| f05-02 | カスタマイズ | 移行退行疑い | 乖離（現行カスタマイズ未達・移行先で対応） | `PurchaseController.php:489, PurchaseController.php:400` | RG-005 |  |
| f05-02 | カスタマイズ | 移行退行疑い | 乖離（現行カスタマイズ未達・移行先で対応） | `ProductSearchTrait.php:36, PurchaseController.php:523, PurchaseController.php:48` | RG-007 |  |
| f05-02 | カスタマイズ | 移行退行疑い | 乖離（現行の0件404・移行先で解消）／要実機確認 | `PurchaseController.php:542, PurchaseController.php:404` | RG-029,030 |  |
| f05-04 | カスタマイズ | 未実装疑い | 乖離(詳細設計stale＋pf-eccube3現行未実装・enterprise実装済) | `src/.../Purchase/PurchaseController.php:985` | RG-025,026,027,028,029,0 |  |
| f05-05 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ未実装） | `app/Plugin/HareruyaEc/Resource/template/default/Purchase/cart.twig:82, app/Plugin/HareruyaEc/Controller/PurchaseControll` | RG-006,020,024 |  |
| f05-05 | カスタマイズ | 未実装疑い | 要確認（移行先未実装） | `ProductClass.php:12` | RG-010,019 |  |
| f05-06 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ未実装） | `app/Plugin/HareruyaEc/Resource/template/default/Purchase/confirm.twig:81, src/Eccube/Entity/Customer.php:1029` | RG-034 |  |
| f05-06 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ未実装） | `.../Purchase/complete.twig:42, complete.twig:43` | RG-024,026 |  |
| f05-06 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ未実装） | `.../Purchase/confirm.twig:259` | RG-033 |  |
| f06-01 | カスタマイズ | 移行退行疑い | 乖離（カスタマイズ未達・移行時対応要）／要実機確認 | `app/Plugin/HareruyaEc/Controller/EntryController.php:117` | RG-026 |  |
| f06-02 | 現行踏襲 | 未実装疑い | 乖離（戻り先遷移 未実装）／要実機確認 | `EntryController.php:234, EntryController.php:264` | RG-015 |  |
| f06-03 | カスタマイズ | 未実装疑い | 乖離（Excel★カスタマイズ未実装）／要実機確認（enterprise側での実装有無） | `app/Plugin/HareruyaEc/Service/Security/FrontLoginSuccessHandler.php:21` | RG-018 |  |
| f06-03 | カスタマイズ | 未実装疑い | 乖離（新規追加カスタマイズ未実装）／要実機確認 | `—` | RG-019 |  |
| f06-04 | 現行踏襲 | 移行退行疑い | 乖離（移行退行）／L321が移行上書きを免責するが Excel 24h と不一致 | `app/Plugin/HareruyaEc/Controller/ForgotController.php:48, config.yml:46, src/Eccube/Controller/Front/ForgotController.ph` | RG-006 |  |
| f06-04 | 現行踏襲 | 移行退行疑い | 乖離（移行退行）／L321免責あるが Excel/詳細と不一致 | `src/Eccube/Form/Type/RepeatedPasswordType.php:49, eccube.yaml:195` | RG-009,RG-017(DV-PW-*) |  |
| f06-04 | 現行踏襲 | 移行退行疑い | 乖離（エラー画面の差別化欠落・移行退行） | `HareruyaEc/Controller/ForgotController.php:76, src/Eccube/Controller/Front/ForgotController.php:186` | RG-007,008,013,023 |  |
| f06-05 | カスタマイズ | 移行退行疑い | 乖離（未移行・退行） | `src/Eccube/Controller/Front/Mypage/MypageController.php:127, app/Plugin/HareruyaEc/Controller/Mypage/MypageController.ph` | RG-006,007 |  |
| f06-05 | カスタマイズ | 未実装疑い | 乖離（未実装・空リンク） | `src/Eccube/Resource/template/default/Mypage/index.twig:172` | RG-017 |  |
| f06-06 | カスタマイズ | 移行退行疑い | 乖離（移行で再購入APIが退行・非JSON化） | `app/Plugin/HareruyaEc/Controller/Mypage/ShoppingController.php:124, app/Plugin/HareruyaEc/ControllerProvider/FrontContro` | RG-028,029,030 |  |
| f06-06 | カスタマイズ | 移行退行疑い | 乖離（詳細遷移ルート形の移行差）／要実機確認 | `MypageController.php:482` | RG-020,031 |  |
| f06-06 | カスタマイズ | 移行退行疑い | 乖離（領収書ルート形の移行差）／要実機確認 | `MypageController.php:523` | RG-032 |  |
| f06-06 | カスタマイズ | 移行退行疑い | 乖離（ページングクエリ名の移行差）／要実機確認 | `src/Eccube/Form/Type/Front/ShoppingHistoryType.php:57, MypageController.php:454` | RG-003,025 |  |
| f06-07 | カスタマイズ | 未実装疑い | 乖離（未実装・プレースホルダ露出） | `src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:192` | RG-015 |  |
| f06-07 | カスタマイズ | 移行退行疑い | 乖離（注記の退行・未表示） | `src/Eccube/Resource/locale/messages.ja.yaml:1436` | RG-025 |  |
| f06-07 | カスタマイズ | 未実装疑い | 乖離（店頭受取の非表示未実装）／要実機確認 | `shopping_history_detail.twig:176` | RG-017 |  |
| f06-07 | カスタマイズ | 移行退行疑い | 乖離（ルートパス命名変更・移行仕様の要確認） | `src/Eccube/Controller/Front/Mypage/MypageController.php:482` | RG-003,013,029,030 |  |
| f06-07 | カスタマイズ | 移行退行疑い | 乖離（詳細設計記載ルートの移行先非存在／ボタン削除自体はExcel整合） | `...MypageController.php:195` | RG-014 |  |
| f06-08 | カスタマイズ | 設計誤り疑い | 乖離（詳細設計のハルシネーション。Excelと実装が一致・詳細設計が過小記述） | `src/Eccube/Controller/Front/Mypage/NotifylistController.php:105, src/Eccube/Resource/template/default/Mypage/notifylist.` | RG-012〜015 |  |
| f06-08 | カスタマイズ | 設計誤り疑い | 乖離（詳細設計のハルシネーション） | `notifylist.twig:16, NotifylistController.php:106` | RG-018 |  |
| f06-09 | カスタマイズ | 設計誤り疑い | 乖離（詳細設計ハルシネーション是正・Excelと実装が一致） | `app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:1633, src/Eccube/Repository/DtbFavoriteProductReposito` | RG-007,024（DQ-sortColor/ |  |
| f06-10 | カスタマイズ | 未実装疑い | 乖離（表示範囲 未実装） | `...Mypage/point_history.twig:62, src/Eccube/Resource/locale/messages.ja.yaml:826` | RG-014 |  |
| f06-11 | カスタマイズ | 移行退行疑い | 現行は乖離（カスタマイズ未達）／移行先で是正 | `app/Plugin/HareruyaEc/Repository/DtbBuyOrderRepository.php:242, src/Eccube/Repository/MypagePurchaseHistoryRepository.ph` | RG-004,005,006,007 |  |
| f06-11 | カスタマイズ | 移行退行疑い | 現行は乖離（カスタマイズ未達）／移行先で是正 | `.../DtbBuyOrderRepository.php:235, app/Plugin/HareruyaEc/Resource/template/default/Mypage/purchase_history.twig:74, .../` | RG-008,009 |  |
| f06-11 | カスタマイズ | 移行退行疑い | 現行は乖離（条件未達）／移行先で是正 | `.../PurchaseHistoryRowBuilder.php:94, src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:13` | RG-011,012 |  |
| f06-11 | カスタマイズ | 移行退行疑い | 現行は乖離（選択肢不一致）／移行先はseed依存で要確認 | `.../purchase_history.twig:30, src/Eccube/Controller/Front/Mypage/PurchaseHistoryController.php:75` | RG-022,029(DP-04) |  |
| f06-11 | カスタマイズ | 移行退行疑い | 現行は乖離（文言未変更）／移行先で是正 | `.../purchase_history.twig:74, .../PurchaseHistoryRowBuilder.php:101` | RG-010 |  |
| f06-12 | カスタマイズ | 未実装疑い | 乖離（未実装懸念・要実機確認） | `app/Plugin/HareruyaEc/Controller/Mypage/PurchaseController.php:69` | RG-024 |  |
| f06-13 | 現行踏襲 | 移行退行疑い | 乖離（カスタマイズ未達＋移行退行） | `src/Eccube/Form/Type/Master/IdentificationType.php:36, app/Plugin/HareruyaEc/Form/Type/Front/Identification/Identificati` | RG-003 |  |
| f06-13 | 現行踏襲 | 移行退行疑い | 乖離（実装バグ・型不一致・移行退行） | `src/Eccube/Controller/Front/Mypage/IdentificationController.php:109, src/Eccube/Form/Type/Front/IdentificationImageType.` | RG-022 |  |
| f06-14 | カスタマイズ | 設計誤り疑い | 乖離（詳細設計ハルシネーション・要実機確認） | `src/Eccube/Controller/Front/Mypage/EventHistoryController.php:44` | RG-005,017 |  |
| f06-14 | カスタマイズ | バグ候補 | 乖離（バグ候補・(6)非表示未実装） | `event_history.twig:148` | RG-012,013,014 |  |
| f06-14 | カスタマイズ | バグ候補 | 乖離（バグ候補・終了境界の定義差） | `src/Eccube/Entity/DtbEventDetail.php:554` | RG-007・DDT-A DA-02 |  |
| f06-16 | カスタマイズ | 未実装疑い | 乖離（未実装・カスタマイズ/現行踏襲未達） | `src/Eccube/Controller/Front/Mypage/DeckEntryController.php:145, src/Eccube/Service/Front/Mypage/DeckEntryAction.php:39, ` | RG-019,020,021,030,DV-02 |  |
| f06-16 | カスタマイズ | 未実装疑い | 乖離（未実装） | `DeckEntryAction.php:47, DeckentryController.php:11` | RG-013,014,017,018,034 |  |
| f06-16 | カスタマイズ | 未実装疑い | 乖離（サーバ側未実装・クライアント依存） | `DeckEntryAction.php:47, DeckentryController.php:171, src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:83` | RG-013,023 |  |
| f06-16 | カスタマイズ | 未実装疑い | 乖離（フォーマット併記未実装）／要実機確認 | `deck_entry_edit.twig:165` | RG-001 |  |
| f06-17 | カスタマイズ | 未実装疑い | 乖離（書式エラー→編集画面復帰が未実装／要実機確認） | `src/Eccube/Controller/Front/Mypage/DeckEntryController.php:137, src/Eccube/Service/Front/Mypage/DeckEntryAction.php:37, ` | RG-007,019 |  |
| f06-18 | カスタマイズ | 移行退行疑い | 乖離（enterprise退行・現行オラクルとの挙動差） | `app/Plugin/HareruyaEc/Controller/Mypage/ChangeController.php:161, src/Eccube/Controller/Front/Mypage/ChangeController.ph` | RG-017 |  |
| f06-19 | 標準 | バグ候補 | 乖離（バグ候補） | `Form/Type/CardType.php:219, Controller/MypageController.php:90, Controller/MypageController.php:80` | RG-016 |  |
| f06-19 | 標準 | バグ候補 | 乖離（バグ候補）／要実機確認 | `Form/Type/CardType.php:275` | RG-016(DV-07) |  |
| f06-19 | 標準 | バグ候補 | 乖離（バグ候補）／要実機確認（応答仕様） | `Resource/template/sln_edit_card.twig:473, Service/Util.php:327, Controller/MypageController.php:122` | RG-006 |  |
| f06-20 | カスタマイズ | 移行退行疑い | 乖離（メッセージ非表示／enterpriseは404退行） | `../pf-eccube3/app/Plugin/HareruyaEc/Controller/Mypage/DeliveryController.php:46, ../ec-cube-enterprise/src/Eccube/Contro` | RG-006 |  |
| f06-20 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ未実装）／要実機確認 | `DeliveryController.php:77, DeliveryController.php:171` | RG-023 |  |
| f06-21 | 現行踏襲 | 移行退行疑い | 乖離（詳細設計の記述誤り＋現行未達・移行先で是正） | `app/Plugin/HareruyaEc/Controller/Mypage/WithdrawController.php:100, src/Eccube/Controller/Front/Mypage/WithdrawControlle` | RG-008,037 |  |
| f06-21 | 現行踏襲 | 移行退行疑い | 乖離（移行先で選手情報削除が欠落・退行） | `WithdrawController.php:88, WithdrawController.php:90` | RG-006,027 |  |
| f06-21 | 現行踏襲 | 移行退行疑い | 乖離（移行先の表示位置/形式が設計と相違）／要実機確認 | `WithdrawController.php:78, WithdrawController.php:112, src/Eccube/Resource/locale/messages.ja.yaml:734` | RG-013 |  |
| f06-21 | 現行踏襲 | 未実装疑い | 乖離（オラクル間矛盾・書式サーバ強制は未実装）／要実機確認 | `src/Eccube/Form/Type/Front/WithdrawType.php:37, WithdrawController.php:96, WithdrawController.php:28` | RG-023,024（DV-04） |  |
| f06-22 | カスタマイズ | 移行退行疑い | 乖離（実装挙動・退行/設計不一致）／要実機確認 | `src/Eccube/Service/Front/Mypage/ContactCreateAction.php:39, src/Eccube/Controller/Front/ContactController.php:167, app/P` | RG-018,013 |  |
| f06-22 | カスタマイズ | 移行退行疑い | 乖離（実装挙動・移行退行）／要実機確認 | `src/Eccube/Service/Front/Mypage/ContactCreateAction.php:59, ...ContactController.php:93` | RG-017 |  |
| f06-23 | 現行踏襲 | 移行退行疑い | 乖離（現行がExcel★カスタマイズ未実装。移行先で充足済＝現行のみ不足）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact/history.twig:1, ec-cube-enterprise/src/Eccube/Resourc` | RG-009,015 |  |
| f06-23 | 現行踏襲 | 移行退行疑い | 乖離（現行＝設計の未ログイン誘導が成立しない疑い・未認証アクセス時の実応答は要実機確認。移行先で充足）／要実機確認 | `pf-eccube3/src/Eccube/Application.php:596, pf-eccube3/app/Plugin/HareruyaEc/Controller/ContactController.php:136, pf-ecc` | RG-017 |  |
| f06-24 | 現行踏襲 | 未実装疑い | 乖離（★カスタマイズ未実装）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact/history_detail.twig:8, Contact/history_detail.en.twig` | RG-002,003,004 |  |
| f06-24 | 現行踏襲 | 未実装疑い | 乖離（★カスタマイズ未実装・Excel/詳細設計の競合）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact/history_detail.twig:12, Contact/history_detail.en.twi` | RG-005 |  |
| f06-26 | カスタマイズ | 移行退行疑い | 乖離（毎リクエスト→ログイン時のみへ退行）／要実機確認 | `src/Eccube/Event/IpCheckSubscriber.php:35` | RG-002,003,005 |  |
| f07-01 | カスタマイズ | 未実装疑い | 乖離（Excel設計の抽出条件が未実装）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/Master/MtbBannerRepository.php:52, ec-cube-enterprise/src/Eccube/Controller/Fro` | RG-050 |  |
| f07-01 | カスタマイズ | 未実装疑い | 乖離（Excel設計のクエリ引継ぎが未実装）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/default/Event/index.twig:304` | RG-006,RG-015 |  |
| f07-02 | カスタマイズ | 移行退行疑い | 乖離（現行踏襲されていない・0件時HTTPステータスの退行。Excelが沈黙のため設計上の是非は要判断）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/EventController.php:714, ec-cube-enterprise/src/Eccube/Controller/Front/Even` | RG-030 |  |
| f07-03 | カスタマイズ | 移行退行疑い | 乖離（Excel仕様違反・戻り先の退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/default/Event/_event_detail_actions.twig:60, pf-eccube3/app/Plugin/Harer` | RG-040 |  |
| f07-03 | カスタマイズ | 移行退行疑い | 乖離（人数換算欠落・定員判定の退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Front/Event/EventDetailButtonStateResolver.php:30, ec-cube-enterprise/src/Eccube/R` | RG-023,026,027 |  |
| f07-04 | カスタマイズ | 未実装疑い | 乖離（Excelカスタマイズ未反映・画面統合が未実装）／要実機確認 | `—` | RG-001,003,004,021 |  |
| f07-04 | カスタマイズ | 未実装疑い | 乖離（Excel規定のモーダルが未実装）／要実機確認 | `—` | RG-009,010,011 |  |
| f07-04 | カスタマイズ | 未実装疑い | 乖離（動的エラー表示の未実装/文言未定義）／要実機確認 | `—` | RG-007（DV-02） |  |
| f08-01 | 現行踏襲 | 設計誤り疑い | 乖離（詳細設計 DB操作節の誤記＝ハルシネーション。実装は正しくDB更新しない） | `app/Plugin/HareruyaEc/Controller/OtcBuyController.php:42` | RG-003,011（期待はL363副作用を採用 |  |
| f08-02 | カスタマイズ | 設計誤り疑い | 乖離（詳細設計 DB操作節の誤記＝ハルシネーション。実装は正しく本画面でDB確定しない） | `app/Plugin/HareruyaEc/Controller/OtcBuyController.php:72` | RG-014,015（期待はL364副作用を採用 |  |
| f08-02 | カスタマイズ | 移行退行疑い | 乖離（Excelカスタマイズ「住所3追加」が現行pf-eccube3・詳細設計とも未反映。移行実装時に要反映＝要実機確認） | `—` | RG-001,018（期待はExcel入力項目表 |  |
| f08-03 | カスタマイズ | 移行退行疑い | 乖離（移行での排他方式変更・一意性担保が弱まる懸念）／要実機確認 | `OtcBuyController.php:286, OtcBuyController.php:417` | RG-015,RG-016 |  |
| m02-01 | 標準 | バグ候補 | 乖離（設計が規定する導線の主目的が不成立・バグ候補）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/admin/index.twig:130, ec-cube-enterprise/src/Eccube/Controller/Admin/Ord` | RG-015,RG-016 |  |
| m03-06 | カスタマイズ | 移行退行疑い | 乖離（Excel規定違反・並び順の退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:1160, pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/ProductAllCsv` | RG-008 |  |
| m03-06 | カスタマイズ | 移行退行疑い | 乖離（現行との差・設計は移行先準拠）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:736, pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/ProductAllCsv.` | RG-022 |  |
| m03-06 | カスタマイズ | 移行退行疑い | 乖離（現行との差・設計＝移行先準拠の強化。現行側の欠陥）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:214, pf-eccube3/app/Plugin/HareruyaE` | RG-011,012 |  |
| m03-08 | カスタマイズ | 設計誤り疑い | 乖離（詳細設計ハルシネーション・実装はExcel準拠で是正済） | `src/Eccube/Controller/Admin/Product/ProductClassController.php:88, src/Eccube/Repository/ProductStockRepository.php:561,` | RG-006,011(DD-02) |  |
| m03-10 | カスタマイズ | 設計誤り疑い | 乖離（詳細設計ハルシネーション・実装/Excelは買取vs基準のみ） | `src/Eccube/Form/Type/Admin/BulkUpdateProductPriceType.php:89, src/Eccube/Form/Type/Admin/BulkUpdateProductPriceDetailTyp` | RG-005 |  |
| m03-10 | カスタマイズ | 未実装疑い | 乖離（Excel/詳細設計の上限が未実装）／要実機確認 | `src/Eccube/Form/Type/Admin/BulkUpdateProductPriceDetailType.php:38` | RG-003(DV1-6) |  |
| m03-10 | カスタマイズ | 設計誤り疑い | 乖離（詳細設計ハルシネーション・実装/Excelは条件別計算値） | `src/Eccube/Repository/ProductClassRepository.php:1936, BulkUpdateProductPriceDetailType.php:48` | RG-013,015 |  |
| m03-11 | カスタマイズ | 未実装疑い | 乖離（Excel書式制限の未実装）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/CategoryType.php:151` | RG-016,029（DV-12） |  |
| m03-11 | カスタマイズ | 移行退行疑い | 乖離（詳細設計の記述がExcel・実装の双方と矛盾＝文書側の退行。実装はExcel準拠）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/CategoryController.php:630, ec-cube-enterprise/src/Eccube/Resourc` | RG-008,019 |  |
| m03-13 | 現行踏襲 | 未実装疑い | 乖離（Excel明示の制限が未実装）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/TagType.php:78, pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Product/T` | RG-014・§3 DV-11,DV-12 |  |
| m03-13 | 現行踏襲 | 未実装疑い | 乖離（Excel明示の書式制限が未実装）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/TagType.php:70, pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Product/T` | RG-014・§3 DV-14 |  |
| m03-14 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・一意制約の喪失＝データ品質退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Entity/Master/MtbStorageCode.php:40, ec-cube-enterprise/src/Eccube/Form/Type/Admin/Storage` | §5 相関バリデーション（要判定） |  |
| m03-14 | 現行踏襲 | 移行退行疑い | 乖離（現行実装のExcel未充足・移行先で是正）／要実機確認（現行側の負値送信時挙動） | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Product/StorageCodeType.php:30, ec-cube-enterprise/src/Eccube/Form/Type` | RG-010（DV-06〜09） |  |
| m03-14 | 現行踏襲 | 移行退行疑い | 乖離（現行実装のExcel未充足・移行先で実装）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/StorageCodeController.php:36, ec-cube-enterprise/src/Eccube/Co` | RG-018,RG-019 |  |
| m03-14 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・保存後の編集状態の退行／余剰クエリ）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/StorageCodeController.php:69` | RG-024 |  |
| m03-15 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・BOM出力条件の退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/StorageCodeController.php:169, ec-cube-enterprise/src/Eccube/Serv` | RG-011（§5 文字コード・BOM＝要判定） |  |
| m03-16 | 現行踏襲 | 移行退行疑い | 乖離（Excel設計の画面部品が現行に欠落・移行先で解消）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Product/csv_product_storage_code.twig:1, pf-eccube3/app/Plugin/` | RG-004 |  |
| m03-16 | 現行踏襲 | バグ候補 | 乖離（設計のエラー処理に反する現行バグ候補・移行先で解消）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/StorageCodeController.php:174, pf-eccube3/app/Plugin/HareruyaE` | RG-012,013 |  |
| m03-17 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲差・失敗時応答とHTTPステータスが変化。Excelは沈黙のため詳細設計＝移行先を期待に採用）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/TagSalesAnalysisController.php:54, ec-cube-enterprise/src/Eccu` | RG-016,RG-017 |  |
| m03-17 | 現行踏襲 | 移行退行疑い | 乖離（現行はExcel未充足・移行先で解消済み＝リグレッションではない。現行比較テスト時に差分が出る点に注意） | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/TagSalesAnalysisController.php:32, pf-eccube3/app/Plugin/Harer` | RG-004〜011 |  |
| m03-18 | カスタマイズ | 設計誤り疑い | 乖離（詳細設計ハルシネーション・登録フォームの403は不正確） | `SectionController.php:100, SectionController.php:137, src/Eccube/Controller/AbstractController.php:252` | RG-025 |  |
| m03-20 | カスタマイズ | 未実装疑い | 乖離（Excelカスタマイズが m03-20 ルートで未実装）／要実機確認 | `src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1079, src/Eccube/Service/Csv/Importer/Event/SectionMaste` | RG-013 |  |
| m03-20 | カスタマイズ | バグ候補 | 乖離（Excel 0/1/2制約が m03-20 で未検証・バグ候補）／要実機確認 | `CsvImportController.php:1167, SectionMasterImportHandler.php:57` | RG-010,027(DV-06) |  |
| m03-20 | カスタマイズ | バグ候補 | 乖離（データ0行のエラーキー不一致・バグ候補）／要実機確認 | `src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1126` | RG-017 |  |
| m03-25 | 現行踏襲 | 移行退行疑い | 乖離（現行の欠陥／移行先で是正済み・要実機確認） | `pf-eccube3/app/Plugin/HareruyaEc/Repository/ProductClassRepository.php:301, ec-cube-enterprise/src/Eccube/Repository/Pro` | RG-005（DV-04,05）, RG-013 |  |
| m03-25 | 現行踏襲 | 移行退行疑い | 乖離（現行の順序無保証／移行先で明示・要実機確認） | `pf-eccube3/.../ProductClassRepository.php:301, ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2921` | RG-010 |  |
| m03-25 | 現行踏襲 | 移行退行疑い | 乖離（現行の未記載結合・誤重複判定の恐れ／移行先で除去・要実機確認） | `pf-eccube3/app/Plugin/HareruyaEc/Repository/ProductClassRepository.php:308, ec-cube-enterprise/src/Eccube/Repository/Pro` | RG-004, RG-008（DV-08） |  |
| m03-26 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ未達・未実装） | `src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:30` | RG-004 |  |
| m03-26 | カスタマイズ | 未実装疑い | 乖離（スマレジ在庫チェック未実装）／要実機確認 | `src/Eccube/Service/Csv/Importer/Validator/AbolishedStatusStockValidator.php:75` | RG-014 |  |
| m03-27 | カスタマイズ | 未実装疑い | 乖離（無効→有効の連携キュー作成が未実装）／要実機確認 | `.../ProductGoodsImportHandler.php:616` | RG-015 |  |
| m03-27 | カスタマイズ | 未実装疑い | 乖離（Excel要件のスマレジ在庫確認が未実装）／要実機確認 | `src/Eccube/Service/Csv/Importer/Validator/AbolishedStatusStockValidator.php:75` | RG-005 |  |
| m03-27 | カスタマイズ | 未実装疑い | 乖離疑義（原価想定外金額チェックが未実装の疑い）／要実機確認 | `.../ProductGoodsImportHandler.php:114` | RG-035（§5 数値バリデーション） |  |
| m03-27 | カスタマイズ | 未実装疑い | 乖離（Excel要件の確認モーダルが未実装の疑い・詳細設計もExcelと矛盾）／要実機確認 | `src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:29, app/Plugin/HareruyaEc/Resource/template/admin/Produc` | RG-033（§5 画面遷移） |  |
| m03-28 | 現行踏襲 | 移行退行疑い | 乖離（Excel記載と実装が不一致・かつ現行→移行先で見出し名変更＝既存CSV資産が取込不能になる退行）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1987, pf-eccube3/app/Plugin/HareruyaE` | RG-005,008,021 |  |
| m03-28 | 現行踏襲 | 移行退行疑い | 乖離（Excel明記の処理概要が移行先で未実装＝タグ更新が支店側へ伝播しない退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductTagUpdateImportHandler.php:43, ec-cube-enterprise/src/Ec` | RG-027 |  |
| m03-28 | 現行踏襲 | 移行退行疑い | 乖離（現行の運用「CSVでタグ全解除」が移行先で不可能になる退行／Excel必須欄は沈黙のため確定にはユーザー判断が必要）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductTagUpdateImportHandler.php:111, ec-cube-enterprise/src/E` | RG-051,008 |  |
| m03-29 | 現行踏襲 | 移行退行疑い | 乖離（現行実装 vs Excel 0204:L4449／移行先はExcel準拠。件数表示の非互換）／要実機確認 | `pf-eccube3/.../ProductTagSalesAnalysisUpdateImportHandler.php:96, ec-cube-enterprise/.../ProductTagSalesAnalysisUpdateIm` | RG-037 |  |
| m03-30 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ未達・改名未実装） | `src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php:100, ProductPriceCsvController.php:198, ProductPri` | RG-014,015 |  |
| m03-30 | カスタマイズ | 未実装疑い | 乖離（基準価格 更新未実装） | `ProductPriceImportHandler.php:372` | RG-001,002,006 |  |
| m03-31 | 現行踏襲 | 移行退行疑い | 乖離（表示メッセージの退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php:176, ec-cube-enterprise/src/Ecc` | RG-038 |  |
| m03-32 | カスタマイズ | 未実装疑い | 乖離（Excelカスタマイズ要求の未実装・監査証跡欠落）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php:29, ec-cube-enterprise/src/Ecc` | RG-015 |  |
| m03-33 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ未実装・買取価格更新が無い） | `src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:180, src/Eccube/Service/Csv/Importer/Event` | RG-006,014,016 |  |
| m03-33 | カスタマイズ | 未実装疑い | 乖離（★カスタマイズ未実装・スマレジ連携フラグ処理が無い） | `ProductSaleHighPriceCsvController.php:180, SaleHighPriceImportHandler.php:51, ProductClassRepository.php:2590, SaleHighP` | RG-007,014 |  |
| m03-34 | 現行踏襲 | 移行退行疑い | 乖離（移行先での機能欠落候補・現行踏襲未達）／要実機確認（別経路での代替提供有無） | `ec-cube-enterprise/src/Eccube/Entity/Master/MtbCsvImportType.php:37` | RG-060,018 |  |
| m03-34 | 現行踏襲 | 移行退行疑い | 乖離（存在判定の意味変質・移行時の判定境界差）／要実機確認（移行先での代替判定列の確定） | `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductDiscountImportHandler.php:158` | RG-030,018 |  |
| m03-34 | 現行踏襲 | 移行退行疑い | 乖離（更新経路の再設計要・移行先の対応列未確定）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:210, ec-cube-enterprise/src/Eccub` | RG-017,018,044 |  |
| m03-35 | カスタマイズ | 未実装疑い | 乖離（Excel明示要件の未実装・スマレジ連携欠落／結果表示・非同期ステータスも無し）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSectionCsvController.php:113, ec-cube-enterprise/src/E` | RG-024,025,026,027 |  |
| m03-36 | 現行踏襲 | 移行退行疑い | 乖離（移行未対応・要実機確認） | `—` | RG-013 |  |
| m03-37 | 現行踏襲 | 未実装疑い | 乖離（Excel設計の画面項目が未実装／設計にも未記載）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1860` | RG-011〜015 |  |
| m03-37 | 現行踏襲 | 移行退行疑い | 乖離（機能区分と移行スコープの矛盾）／上位決裁事項・要判定 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/StorageCodeController.php:224` | RG-033,034 |  |
| m03-38 | カスタマイズ | 未実装疑い | 乖離（Excel画面構成の未実装・誤操作で全商品の公開状態を一括変更しうる保護の欠落）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:53` | RG-003 |  |
| m03-38 | カスタマイズ | 未実装疑い | 乖離（Excel画面構成の未実装）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_import_history.twig:2` | RG-007 |  |
| m03-40 | 現行踏襲 | 移行退行疑い | 乖離（設計書の現行記述誤り・移行時のデータ移送要確認）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:1422, ec-cube-enterprise/src/Eccube/Reposit` | RG-019,040 |  |
| m03-40 | 現行踏襲 | 移行退行疑い | 乖離（現行の異常系欠落／移行先で是正）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ShelfNumberImportHandler.php:155, ec-cube-enterprise/src/Ecc` | RG-018 |  |
| m03-40 | 現行踏襲 | 移行退行疑い | 乖離（現行がExcel設計未充足・移行先で充足）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:392, ec-cube-enterprise/src/Eccube/Co` | RG-027,028,029 |  |
| m04-03 | カスタマイズ | 移行退行疑い | 乖離（詳細設計現行記述と移行先実装差・Excel承認は実装で充足） | `src/Eccube/Service/Admin/Stock/StockBulkApprovalStoreAction.php:46, ...Controller/Admin/Stock/StockBulkApprovalControlle` | RG-003,004,019 |  |
| m04-03 | カスタマイズ | 移行退行疑い | 乖離（詳細設計の区分名と移行先実装差／Excel未列挙） | `StockBulkApprovalType.php:71` | RG-008 |  |
| m04-03 | カスタマイズ | 移行退行疑い | 乖離（除外 vs 拒否・現行と移行先差） | `StockBulkApprovalItemType.php:60, StockBulkApprovalType.php:145` | RG-012 |  |
| m04-03 | カスタマイズ | 移行退行疑い | 乖離（現行 pf-eccube3 の戻り先記述と移行先実装差） | `StockBulkApprovalController.php:63` | RG-011,020 |  |
| m04-03 | カスタマイズ | 移行退行疑い | 乖離（現行文言記述と移行先実装キー差） | `StockBulkApprovalController.php:61` | RG-011,020 |  |
| m04-09 | 新規実装 | 未実装疑い | 乖離（在庫超過バリデーション未実装・在庫が負値化しうる） | `src/Eccube/Service/Admin/Stock/StockTransferStoreAction.php:82, src/Eccube/Form/Type/Admin/StockTransferNewDetailType.ph` | RG-026 |  |
| m04-09 | 新規実装 | 未実装疑い | 乖離（同一コード検証未実装） | `StockTransferStoreAction.php:78` | RG-027 |  |
| m04-10 | 新規実装 | 未実装疑い | 乖離（未実装・カラム未充填）／要実機確認 | `src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:171, src/Eccube/Entity/DtbStockMoveTransfer.ph` | RG-020,021 |  |
| m04-11 | 現行踏襲 | 未実装疑い | 乖離（カスタムCSV出力項目変更 未実装・上位で削除記録）／要実機確認 | `../pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/HistoryCsv.php:23` | RG-004 |  |
| m04-12 | 新規実装 | 未実装疑い | 乖離（表示件数・ページング未実装） | `src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:131, src/Eccube/Repository/DtbStockSplitJoinRepository.ph` | RG-015,016 |  |
| m04-14 | 新規実装 | バグ候補 | 乖離（丸め非対称・実装バグ候補）／要実機確認 | `src/Eccube/Service/Csv/Exporter/StockSplitJoinCsvExportService.php:120` | RG-008,010,026 |  |
| m04-14 | 新規実装 | バグ候補 | 乖離（正規化不一致・実装バグ候補）／要実機確認 | `src/Eccube/Service/Admin/Stock/StockSplitJoinIndexAction.php:44, src/Eccube/Controller/Admin/Stock/StockSplitJoinControl` | RG-015,022 |  |
| m04-16 | 現行踏襲 | 未実装疑い | 乖離疑義（在庫レコメンドチェック絞り込み未実装・文言両義・要実機確認） | `StockRecommendCsvExportService.php:201` | RG-014 |  |
| m04-17 | カスタマイズ | 未実装疑い | 乖離（変更後原価単価・原価率・承認日の絞り込み未実装） | `StockHistoryType.php:256, DtbStockHistoryRepository.php:96` | RG-012,013,018 |  |
| m04-17 | カスタマイズ | 未実装疑い | 乖離（所属選択・承認者の絞り込み未実装） | `DtbStockHistoryRepository.php:304, StockHistoryType.php:375` | RG-016,017 |  |
| m04-18 | カスタマイズ | 移行退行疑い | 乖離（出力対象＝選択行のみ・検索条件全件出力が未達／移行での仕様変更） | `src/Eccube/Controller/Admin/Stock/StockHistoryController.php:285, src/Eccube/Service/Csv/StockHistoryCsv.php:53` | RG-001,004 |  |
| m04-18 | カスタマイズ | 未実装疑い | 乖離（Foil列 未実装・空固定） | `StockHistoryCsv.php:104` | RG-005 |  |
| m04-18 | カスタマイズ | 移行退行疑い | 乖離（日付区切り書式差・移行での退行懸念）／要実機確認 | `StockHistoryCsv.php:121, app/Plugin/HareruyaEc/Service/Csv/HistoryCsv.php:112` | RG-005 |  |
| m04-18 | カスタマイズ | 移行退行疑い | 乖離（ルート/メソッド/ファイル名接頭辞の差・移行での経路変更） | `StockHistoryController.php:284, StockHistoryCsv.php:75, HistoryCsv.php:68` | RG-009,017 |  |
| m04-19 | カスタマイズ | 移行退行疑い | 乖離（3段ソート未実装・退行） | `DtbStockoutHistoryRepository.php:40, SearchControllerTrait.php:374` | RG-008 |  |
| m04-19 | カスタマイズ | 未実装疑い | 乖離（追加表示列 未実装・カスタマイズ未達） | `app/Plugin/HareruyaEc/Resource/template/admin/Product/stockout_historylist.twig:88, DtbStockoutHistoryRepository.php:41,` | RG-011,RG-012 |  |
| m04-19 | カスタマイズ | 未実装疑い | 乖離（編集機能 未実装・カスタマイズ未達） | `stockout_historylist.twig:100` | RG-013,RG-026 |  |
| m04-19 | カスタマイズ | 未実装疑い | 乖離（CSV出力 未実装・カスタマイズ未達） | `ProductServiceProvider.php:236` | RG-017 |  |
| m04-19 | カスタマイズ | 未実装疑い | 乖離（横断検索 未実装・カスタマイズ未達） | `app/Plugin/HareruyaEc/Form/Type/Admin/Product/StockoutHistoryType.php:33` | RG-005,RG-011 |  |
| m04-20 | 新規実装 | 未実装疑い | 乖離（値未実装・TODO） | `StockHistoryDisposalCsv.php:104` | RG-001,007 |  |
| m04-21 | カスタマイズ | 未実装疑い | 乖離（承認ワークフロー未実装・即時更新） | `app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductStockImportHandler.php:195, app/Plugin/HareruyaEc/Controller/Adm` | RG-028,029,031,032 |  |
| m04-21 | カスタマイズ | 未実装疑い | 乖離（仕入単価/原価列 未実装） | `ProductCsvController.php:2163, ProductStockImportHandler.php:71, app/Plugin/HareruyaEc/Form/Type/Admin/Product/StockCsvI` | RG-013,016,035,038 |  |
| m04-21 | カスタマイズ | 未実装疑い | 乖離（確認モーダル 未実装） | `ProductStockImportHandler.php:134` | RG-026,027 |  |
| m04-21 | カスタマイズ | 未実装疑い | 乖離（表ヘッダー部フォーム部品 未実装） | `StockCsvImportType.php:15, ProductStockImportHandler.php:204` | RG-005〜010 |  |
| m04-21 | カスタマイズ | 未実装疑い | 乖離（承認通知メール 未実装） | `ProductStockImportHandler.php:109` | RG-033 |  |
| m04-21 | カスタマイズ | 未実装疑い | ProductStockImportHandler' ../ec-cube-enterprise/app` はマスタ登録マイグレーション `app/DoctrineMigrations/Version20260106155157.php:70`（`mtb_st | `—` | **乖離（移行先 取込処理未移植）／要実機確認* |  |
| m04-22 | 新規実装 | 未実装疑い | 乖離（未実装） | `src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:153` | RG-025 |  |
| m04-23 | 新規実装 | バグ候補 | 乖離（Excel値域下限0=有効 vs 実装>0で弾く＝バグ候補） | `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitListCsvImportHandler.php:149` | RG-022B(DV-08,09),037B |  |
| m04-24 | 新規実装 | 未実装疑い | 乖離（未実装） | `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveInstructionCsvImportHandler.php:73` | RG-026 |  |
| m04-24 | 新規実装 | 未実装疑い | 乖離（未実装） | `StockMoveInstructionController.php:368` | RG-027 |  |
| m04-24 | 新規実装 | 未実装疑い | 乖離（チェック打ち切り未実装・表示のみ制限） | `StockMoveInstructionCsvImportHandler.php:73, StockMoveInstructionController.php:383` | RG-028 |  |
| m04-24 | 新規実装 | 未実装疑い | 乖離（ページング未実装・表示件数無効の疑い） | `—` | RG-015,RG-011 |  |
| m04-25 | 新規実装 | バグ候補 | 乖離（削除条件の一部未実装・コードバグ候補） | `StockMoveInstructionController.php:290` | RG-014 |  |
| m04-30 | 新規実装 | 未実装疑い | 乖離（未実装・仕様未達） | `src/Eccube/Form/Type/Admin/BarcodeReplacementListType.php:77` | RG-006,022(DV-06) |  |
| m04-31 | カスタマイズ | 設計誤り疑い | 乖離（詳細設計DB操作表のハルシネーション） | `InventoryPlanController.php:181, src/Eccube/Controller/Admin/Stock/InventoryPlanController.php:286` | RG-004（明細非生成） |  |
| m04-31 | カスタマイズ | 移行退行疑い | 乖離（移行先が設計非記載の店舗スコープ制約を追加）／要実機確認 | `src/Eccube/Controller/Admin/Stock/InventoryPlanController.php:298, src/Eccube/Form/Type/Admin/Stock/InventoryPlanType.ph` | RG-006,007,009 |  |
| m04-33 | 新規実装 | 設計誤り疑い | 乖離（詳細設計ハルシネーション・メソッド名相違） | `src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:76, src/Eccube/Repository/DtbStockMoveTr` |  |  |
| m04-34 | 新規実装 | 設計誤り疑い | 詳細設計ハルシネーション（クラス名不一致） | `src/Eccube/Service/Pdf/Exporter/StockMoveTransferListPdfFormatter.php:53, src/Eccube/Controller/Admin/Stock/StockMoveTra` | 全般（正本ナビの信頼性） |  |
| m05-02 | カスタマイズ | 移行退行疑い | 乖離（二重BOM・退行／要実機確認：出力バイト確認） | `src/Eccube/Service/CsvExportService.php:162, CsvExportService.php:267` | RG-006 |  |
| m05-04 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ未実装疑い）／要実機確認（dtb_csv 特殊定義や未検出リスナで担保される余地を実機確認） | `src/Eccube/Controller/Admin/Order/OrderController.php:441, src/Eccube/Service/CsvExportService.php:215, OrderController.` | RG-004 |  |
| m05-06 | カスタマイズ | 移行退行疑い | 乖離（メッセージのラベル/値不一致・退行） | `src/Eccube/Resource/locale/messages.ja.yaml:2719, src/Eccube/Controller/Admin/Order/MailController.php:316, app/Plugin/H` | RG-011 |  |
| m05-08 | 現行踏襲 | 設計誤り疑い | 乖離（詳細設計ハルシネーション・要是正） | `UpdateStackListAction.php:48` | §1,§5,RG-004,005 |  |
| m05-09 | カスタマイズ | 未実装疑い | 乖離（支店の棚番ソート抑止 未実装）／要実機確認（支店データで shelfNumberSortNo が null 揃いなら実害が出ない可能性） | `src/Eccube/Repository/Traits/SortProductTrait.php:72, src/Eccube/Repository/DtbShippingStandbyRepository.php:332` | RG-010 |  |
| m05-10 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ未達・支店例外未実装） | `src/Eccube/Repository/Traits/SortProductTrait.php:72, src/Eccube/Repository/DtbShippingStandbyRepository.php:311` | RG-004 |  |
| m05-10 | カスタマイズ | 未実装疑い | 乖離（CSRF検証未実装）／要実機確認 | `src/Eccube/Controller/Admin/Order/OrderController.php:742` | RG-023 |  |
| m05-11 | カスタマイズ | 未実装疑い | 乖離（廃止未達・カスタマイズ未実装） | `src/Eccube/Controller/Admin/Order/EditController.php:146` | RG-006 |  |
| m05-11 | カスタマイズ | 未実装疑い | 乖離（編集権限制御 未実装） | `—` | RG-004,008 |  |
| m05-11 | カスタマイズ | 未実装疑い | 乖離（スマレジ取引編集不可 未実装） | `—` | RG-005 |  |
| m05-11 | カスタマイズ | 未実装疑い | 乖離（受注更新履歴 未実装疑い）／要実機確認 | `—` | RG-032,033 |  |
| m05-12 | 標準 | 設計誤り疑い | 乖離（設計ハルシネーション・限定過小）／要実機確認 | `src/Eccube/Service/OrderStateMachine.php:73, app/config/eccube/packages/order_state_machine.php:66` | DV-02,RG-010,012,037 |  |
| m05-14 | 標準 | 設計誤り疑い | 乖離（詳細設計ハルシネーション・現在ステータスがプルダウンに残る）／要実機確認 | `src/Eccube/Form/Type/Admin/OrderType.php:417` | RG-021,RG-022 |  |
| m05-15 | 標準 | 設計誤り疑い | 詳細設計ハルシネーション（要是正） | `src/Eccube/Controller/Admin/Order/MailController.php:161` | RG-017 |  |
| m05-19 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・注文番号検索の意味退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:85` | RG-002 |  |
| m05-19 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・既定並び順の退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:38` | RG-011 |  |
| m05-21 | 現行踏襲 | 設計誤り疑い | 乖離（pf現行バグ・null fatal／詳細設計ハルシネーション是正／enterpriseで是正）／要実機確認 | `...ShippingStandbyController.php:210` | RG-037 |  |
| m05-21 | 現行踏襲 | 移行退行疑い | 乖離（移行での判定ロジック変更・オラクル不一致）／要実機確認 | `...ShippingStandbyController.php:250, ...ShippingStandbyController.php:343` | RG-004 |  |
| m05-22 | 現行踏襲 | 未実装疑い | 乖離（支店棚番非ソート未実装）／要実機確認（支店品目のShelfNumber有無に依存） | `src/Eccube/Repository/Traits/SortProductTrait.php:72` | RG-006 |  |
| m05-24 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・文言退行）／要実機確認 | `...OrderCsvController.php:174, ...OrderCsvController.php:204` | RG-007,008 |  |
| m05-27 | カスタマイズ | 未実装疑い | 乖離（初期店舗の参照先違い・全店フォールバック未実装） | `src/Eccube/Controller/Admin/Order/WaitingTagController.php:52, src/Eccube/Entity/Member.php:195, Member.php:269, SearchO` | RG-001,002 |  |
| m06-05 | カスタマイズ | 未実装疑い | 乖離疑義（全店未選択 未実装の可能性・要実機確認） | `src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderHistoryType.php:130, src/Eccube/Entity/BaseInfo.php:47` | RG-007 |  |
| m06-05 | カスタマイズ | 未実装疑い | 乖離（Excel書式規定 未実装・要実機確認） | `.../OtcBuyOrderHistoryType.php:81, src/Eccube/Dto/Admin/OtcBuyOrder/HistorySearchDataDto.php:24` | RG-003,DV-04 |  |
| m06-06 | カスタマイズ | バグ候補 | 要実ソース確認（計算バグ候補） | `—` | RG-012 |  |
| m06-06 | カスタマイズ | バグ候補 | 要実ソース確認（符号バグ候補） | `—` | RG-013 |  |
| m06-06 | カスタマイズ | バグ候補 | 要実ソース確認（フィルタ列切替バグ候補） | `—` | RG-027 |  |
| m06-08 | 現行踏襲 | 移行退行疑い | 乖離（Excel基本設計 単一選択 vs 現行/移行実装 複数選択） | `src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderSummaryType.php:68` | RG-002,003,004 |  |
| m07-03 | カスタマイズ | バグ候補 | 乖離（Excel明示の最大長未強制・バグ候補） | `src/Eccube/Form/Type/Admin/Purchase/PurchaseDetailType.php:139` | RG-028(DV-06) |  |
| m07-03 | カスタマイズ | バグ候補 | 乖離（状態変更POSTのCSRF保護欠落・セキュリティ・バグ候補） | `src/Eccube/Controller/Admin/Purchase/PurchaseController.php:519` | RG-033 |  |
| m07-03 | カスタマイズ | 設計誤り疑い | 設計どおり✓（詳細設計ハルシネーションなし） | `MtbBuyOrderStatus.php:92, PurchaseDetailType.php:334` | RG-014,015 |  |
| m07-04 | カスタマイズ | バグ候補 | 乖離（実装バグ候補・履歴未保存）／要実機確認 | `src/Eccube/Service/MailService.php:1589, src/Eccube/Controller/Admin/Purchase/MailController.php:87, src/Eccube/EventLis` | RG-008,009 |  |
| m07-05 | 現行踏襲 | 移行退行疑い | 乖離（GROUP BY欠落・重複行/非決定的選択・現行からの退行） | `DtbBuyOrderRepository.php:459, BuyOrderDepositCsvExportService.php:66, app/Plugin/HareruyaEc/Repository/DtbBuyOrderRepos` | RG-006,RG-007 |  |
| m07-06 | 現行踏襲 | 移行退行疑い | 乖離（現行未実装機能を設計が記述・移行先で新規追加） | `app/Plugin/HareruyaEc/Controller/Admin/Purchase/PurchaseController.php:558` | RG-002,RG-004,RG-013,RG- |  |
| m07-06 | 現行踏襲 | 移行退行疑い | 乖離（現行と移行先でメッセージキー/リダイレクト先が相違） | `PurchaseController.php:563, PurchaseController.php:605` | RG-024,RG-036,RG-039(DV- |  |
| m07-08 | 新規実装 | バグ候補 | 乖離（設計未記載の状態更新副作用・バグ候補） | `src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php:78, src/Eccube/Service/Admin/Purchase/BuyOrderRe` | RG-016 |  |
| m07-08 | 新規実装 | バグ候補 | 乖離（原子性未保証・バグ候補）／要実機確認 | `BuyOrderRestockListCsvExportService.php:60, BuyOrderRestockListService.php:70` | RG-016 |  |
| m08-01 | カスタマイズ | 設計誤り疑い | 設計どおり✓（Excel）／詳細設計ハルシネーション（DCI項目残置） | `app/Plugin/HareruyaEc/Form/Extension/Admin/CustomerSearchTypeExtension.php:49` | RG-022,DV-15 |  |
| m08-01 | カスタマイズ | 設計誤り疑い | 設計どおり✓（Excel）／詳細設計ハルシネーション（DCI確認フラグ残置） | `...CustomerSearchTypeExtension.php:61` | RG-022 |  |
| m08-01 | カスタマイズ | 移行退行疑い | 乖離（文字種検証 未移植・カスタマイズ退行）／要実機確認 | `...SearchCustomerType.php:497, app/config/eccube/packages/eccube.yaml:177, ...CustomerSearchTypeExtension.php:37` | RG-037(DV-07) |  |
| m08-01 | カスタマイズ | 設計誤り疑い | 設計どおり✓（Excel）／詳細設計ハルシネーション（誕生月残置） | `—` | RG-020 |  |
| m08-01 | カスタマイズ | バグ候補 | 乖離（重複/孤児フィールド定義・保守性バグ候補）／要実機確認 | `—` | RG-025,RG-002 |  |
| m08-02 | 現行踏襲 | 移行退行疑い | 乖離（移行での構造差・要移行確認） | `src/Eccube/Controller/Admin/Customer/CustomerMailController.php:49, app/Plugin/HareruyaEc/ServiceProvider/Admin/Customer` | RG-002,003,004,017 |  |
| m08-04 | カスタマイズ | 未実装疑い | 乖離（未実装・カスタマイズ未達） | `src/Eccube/Controller/Admin/Customer/CustomerEditController.php:156, src/Eccube/Resource/template/admin/Customer/edit.tw` | RG-011 |  |
| m08-04 | カスタマイズ | 設計誤り疑い | 乖離（最大長 値相違・詳細設計ハルシネーション併発） | `app/config/eccube/packages/eccube.yaml:173, src/Eccube/Form/Type/Admin/CustomerType.php:154` | RG-029(DV-14,15) |  |
| m08-04 | カスタマイズ | 設計誤り疑い | 設計どおり✓（Excel）／詳細設計ハルシネーション（DCI項目残置） | `src/Eccube/Form/Type/Admin/PlayerType.php:41` | RG-016 |  |
| m08-04 | カスタマイズ | 設計誤り疑い | 設計どおり✓（Excel）／詳細設計ハルシネーション（必須→任意の誤り） | `src/Eccube/Form/Type/Admin/CustomerType.php:84, src/Eccube/Form/Type/AddressType.php:108, app/config/eccube/packages/ecc` | RG-028(DV-02,03,04,06) |  |
| m08-07 | 現行踏襲 | バグ候補 | 乖離（並び順の実装バグ候補）／要実機確認 | `src/Eccube/Controller/Admin/Customer/CustomerMailController.php:135, src/Eccube/Entity/DtbUserMailHistory.php:33` | RG-007 |  |
| m08-07 | 現行踏襲 | 移行退行疑い | 乖離（移行でのルート再構成・低影響）／要実機確認 | `.../ServiceProvider/Admin/CustomerServiceProvider.php:30, src/Eccube/Controller/Admin/Customer/CustomerMailController.ph` | RG-001,008 |  |
| m08-08 | カスタマイズ | 移行退行疑い | 乖離（カスタマイズ要件が現行に未実装・移行先で実装済／詳細設計がExcelカスタマイズ要件を反映していない）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Customer/manual_mail.twig:70, pf-eccube3/app/Plugin/HareruyaEc/` | RG-014,016,028 |  |
| m08-09 | 現行踏襲 | 未実装疑い | 乖離（最大文字数100が未実装・整数書式の検証なし）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Extension/Front/CustomerAddressTypeExtension.php:131, ec-cube-enterprise/src/Eccub` | RG-022(DV-10) |  |
| m08-09 | 現行踏襲 | 移行退行疑い | 乖離（現行は会員スコープ検証欠落・移行先で強化）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/CustomerController.php:469, ec-cube-enterprise/src/Eccube/Controller/A` | RG-002,029,030 |  |
| m08-12 | 現行踏襲 | 移行退行疑い | 乖離（Excel「すべて表示」との差／現行・移行先間でも除外集合が相違）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Repository/PaymentRepository.php:24, ec-cube-enterprise/src/Eccube/Form/Type/Admin/Cust` | RG-018 |  |
| m08-12 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲差・URL構成／詳細設計L319の入口表が移行先と不一致）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerGroupController.php:39` | RG-001, RG-005, RG-006,  |  |
| m08-14 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・成功メッセージキー/文言の退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerController.php:219, ec-cube-enterprise/src/Eccube/Resour` | RG-008 |  |
| m08-14 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・HTTPメソッドPUT→GETの退行／安全でないメソッド設計）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerController.php:185, ec-cube-enterprise/src/Eccube/Resour` | RG-006,RG-007 |  |
| m09-04 | カスタマイズ | 移行退行疑い | 乖離（Excel未充足・日英2ファイル未作成／移行先の日本語拡張子差）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Content/ContentController.php:255, pf-eccube3/app/Plugin/HareruyaEc/Co` | RG-035,038 |  |
| m09-04 | カスタマイズ | 未実装疑い | 乖離（Excelカスタマイズ要件の未実装・編集不可ページのコード保護なし）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Content/PageController.php:180, pf-eccube3/app/Plugin/HareruyaEc/Resou` | RG-043,044 |  |
| m09-04 | カスタマイズ | バグ候補 | 乖離（現行実装の論理反転＝バグ候補・優先度高）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Content/PageController.php:166, pf-eccube3/src/Eccube/Entity/PageLayou` | RG-042,045,046,047 |  |
| m09-07 | カスタマイズ | 未実装疑い | 乖離（Excel記載の検索ボックス未実装）／要実機確認 | `pf-eccube3/src/Eccube/Controller/Admin/Content/BlockController.php:40, pf-eccube3/src/Eccube/Repository/BlockRepository.` | RG-004,005,006,007 |  |
| m09-07 | カスタマイズ | 未実装疑い | 乖離（Excel記載のファイル名列未実装）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Content/block.twig:24, ec-cube-enterprise/src/Eccube/Resource/t` | RG-002 |  |
| m09-07 | カスタマイズ | 未実装疑い | 乖離（Excel記載の連続スラッシュ禁止が現行に未実装）／要実機確認 | `pf-eccube3/src/Eccube/Form/Type/Admin/BlockType.php:61, ec-cube-enterprise/src/Eccube/Form/Type/Admin/BlockType.php:71` | RG-039（§3 DV-10） |  |
| m09-07 | カスタマイズ | 未実装疑い | 乖離（Excel記載のコード必須・twig構文チェックが現行に未実装／詳細設計HTMLがExcelと相反）／要実機確認 | `pf-eccube3/src/Eccube/Form/Type/Admin/BlockType.php:74, ec-cube-enterprise/src/Eccube/Form/Type/Admin/BlockType.php:76` | RG-039（§3 DV-13,14,15）,  |  |
| m09-07 | カスタマイズ | 未実装疑い | 乖離（Excel記載の日英2ファイル作成が現行に未実装）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Content/ContentController.php:244, pf-eccube3/app/Plugin/HareruyaEc/Co` | RG-036,038 |  |
| m09-09 | 標準 | 移行退行疑い | 乖離（移行対照表の現行列が現行リポで裏取れない＝実質「現行に該当機能なし・移行先で新規」の可能性）／要実機確認（現行の別環境・別ブランチにのみ存在する可能性を排除できないため断定しない） | `—` | RG-019（停止画面）・§1 状態の持ち方 |  |
| m09-10 | カスタマイズ | 移行退行疑い | 乖離（メッセージ条件対応の退行・未選択時の固有文言が消失）／要実機確認 | `ec-cube/app/Customize/Resource/locale/messages.ja.yaml:202, TopPageController.php:138, ec-cube-enterprise/src/Eccube/Con` | RG-015,016 |  |
| m09-10 | カスタマイズ | バグ候補 | 乖離（現行のCSRF未検証＝セキュリティ上のバグ候補／移行先で是正）／要実機確認 | `ec-cube/app/Customize/Controller/Admin/Integration/TopPageController.php:67, ec-cube-enterprise/src/Eccube/Controller/Ad` | RG-013,046 |  |
| m09-10 | カスタマイズ | 移行退行疑い | 乖離（現行=0210:L2842のサーバ側担保なし／移行先で是正）／要実機確認 | `ec-cube/app/Customize/Controller/Admin/Integration/TopPageController.php:67, ec-cube-enterprise/src/Eccube/Controller/Ad` | RG-012 |  |
| m09-10 | カスタマイズ | バグ候補 | 乖離（支店共通識別子の 0→1 変更／ラベルと判定の参照元不一致＝バグ候補）／要実機確認（デプロイ時の `BASE_INFO_ID` 値） | `ec-cube/app/Customize/Entity/BaseInfoTrait.php:13, ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:45, BranchTopPageCo` | RG-001,009,012 |  |
| m09-10 | カスタマイズ | バグ候補 | 乖離（現行の拡張子制約が意図どおり機能しない疑い＝バグ候補／移行先で是正・許可される集合も変化）／要実機確認 | `ec-cube/app/Customize/Form/Type/Admin/Integration/TopPageManagementType.php:69, ec-cube-enterprise/src/Eccube/Form/Type/` | RG-030（DV-03,04,16） |  |
| m09-10 | カスタマイズ | 移行退行疑い | 乖離（詳細設計 L379「集約を行わない」との差・移行先で集約を追加）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:106` | RG-047 |  |
| m10-01 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・任意→必須の退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:57` | RG-021, DV-04 |  |
| m10-01 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・任意→必須の退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:75` | RG-021, DV-12 |  |
| m10-01 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・任意→必須の退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:88` | RG-021,024, DV-15,20 |  |
| m10-01 | 現行踏襲 | 移行退行疑い | 乖離（Excel設計 vs 現行・移行先の双方／Excel初期値の意図が新規行既定か画面初期選択か要確定）／要実機確認 | `pf-eccube3/src/Eccube/Resource/doctrine/Eccube.Entity.BaseInfo.dcm.yml:134, ec-cube-enterprise/src/Eccube/Entity/BaseInf` | RG-004, DV-51,52 |  |
| m10-01 | 現行踏襲 | 移行退行疑い | 乖離（設計の対象外宣言と移行先実装の不一致・税ルールが意図せず変更されうる）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:280` | §0（税率・税ルール） |  |
| m10-02 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・画面項目構造の退行。Excel/詳細設計が規定する固定21項目が移行先に存在しない）／要実機確認 | `pf-eccube3/src/Eccube/Form/Type/Admin/TradelawType.php:44, ec-cube-enterprise/src/Eccube/Entity/TradeLaw.php:33, ec-cube` | RG-013,048 |  |
| m10-02 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・必須検証の喪失＝データ欠落を許す退行）／要実機確認 | `pf-eccube3/src/Eccube/Form/Type/Admin/TradelawType.php:44, ec-cube-enterprise/src/Eccube/Form/Type/Admin/TradeLawMallTyp` | RG-017（DV-01,04,08,13,17 |  |
| m10-03 | 現行踏襲 | 移行退行疑い | 乖離（詳細設計の移行先記述が実装と一致しない／保持形態の変質）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Front/HelpController.php:63, ec-cube-enterprise/src/Eccube/Resource/template/de` | RG-001,023 |  |
| m10-04 | 現行踏襲 | 移行退行疑い | 乖離（遷移先退行） | `PaymentController.php:173` | RG-010 |  |
| m10-04 | 現行踏襲 | 設計誤り疑い | 乖離（詳細設計ハルシネーション・実装は上限あり） | `PaymentRegisterType.php:58, app/config/eccube/packages/eccube.yaml:137` | RG-027(DV-15) |  |
| m10-04 | 現行踏襲 | 設計誤り疑い | 乖離（詳細設計ハルシネーション・ルート名/実装方式相違） | `PaymentController.php:191` | RG-013,015,016 |  |
| m10-07 | 現行踏襲 | 移行退行疑い | 既知差（設計に明記・退行ではない） | `—` | RG-012,024 |  |
| m10-08 | 現行踏襲 | 移行退行疑い | 乖離候補（現行=任意／移行先=必須。Excel `-` の解釈が未確定のため断定せず）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/AutoMailType.php:57, pf-eccube3/app/Plugin/HareruyaEc/Form/Extension/Admin` | RG-022（DV-12） |  |
| m10-08 | 現行踏襲 | 移行退行疑い | 乖離（移行先の退行・null参照でサーバエラーとなる疑い）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/MallAutoMailController.php:91, pf-eccube3/app/Plugin/HareruyaEc/Cont` | RG-018 |  |
| m10-09 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・結果キャッシュ退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/BaseInfoRepository.php:165, ec-cube-enterprise/src/Eccube/Controller/Admin/Sett` | RG-008,038 |  |
| m10-10 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・成功メッセージ文言の退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/CsvController.php:160, ec-cube-enterprise/src/Eccube/Resourc` | RG-012 |  |
| m10-13 | カスタマイズ | 移行退行疑い | 退行（バグ・機能の中核が無効化）: 利用者が「項目順序」で並べ替えても、保存される rank は dtb_csv 主キー昇順相当になり指定順が失われる。再現: 右リストを csv_id=7002→7001 の順で保存 → 期待 rank(7002)=0/ran | `ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/CustomerCsvUpdateAction.php:77, ec-cube-enterprise/src/Eccube/S` | RG-020, RG-041 |  |
| m10-13 | カスタマイズ | 移行退行疑い | 退行（バグ・セキュリティ／CSRF保護の欠落）: 認証済み管理者に細工ページを踏ませると任意のカスタム定義を削除できる。トークン送出だけ残り検証が抜けた片側実装 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/CustomerCsvController.php:90, ec-cube-enterprise/src/Eccube/` | RG-029 |  |
| m10-15 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ未実装・画面項目欠落／列長不足） | `ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:1088, ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php` | RG-008, §3-A DV-1-6-* |  |
| m10-15 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ未実装・画面項目欠落） | `ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:1533, ShopMasterType.php:56` | RG-009,010,011,012 |  |
| m10-15 | カスタマイズ | 移行退行疑い | 乖離（現行項目の移行時廃止・移行設計で確定要）／要実機確認 | `pf-eccube3/src/Eccube/Form/Type/Admin/ShopMasterType.php:247` | §3-C DX-02 |  |
| m10-15 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ未実装・認可欠落／縦深防御の穴） | `ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/ShopController.php:45` | RG-005,006 |  |
| m10-15 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ未実装・在庫＝高リスク） | `ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/ShopController.php:68` | RG-028, §3-C DX-07 |  |
| m10-15 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ未実装・画面項目欠落） | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:56` | RG-024 |  |
| m10-15 | カスタマイズ | 未実装疑い | 乖離（最大値未実装） | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:129, Entity/BaseInfo.php:75` | §3-A DV-1-16-*〜DV-1-19-* |  |
| m10-15 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ未実装・画面項目欠落） | `ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:1193, ShopMasterType.php:56` | RG-014,015 |  |
| m10-16 | カスタマイズ | 未実装疑い | 乖離（0以上バリデーション未実装） | `src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:72, app/Plugin/HareruyaEc/Form/Type/Admin/ConfigType.php:83` | RG-013 |  |
| m10-16 | カスタマイズ | 移行退行疑い | 乖離（永続化キーの転用・移行データ整合リスク） | `src/Eccube/Resource/locale/messages.ja.yaml:4208, AdditionalSystemFormType.php:80` | RG-014 |  |
| m10-16 | カスタマイズ | 設計誤り疑い | 詳細設計ハルシネーション（DB正=enterprise では update_date 更新される） | `src/Eccube/Controller/Admin/Setting/Shop/AdditionalSystemController.php:95, ConfigController.php:56` | RG-002 |  |
| m11-03 | カスタマイズ | 未実装疑い | リニューアル差（現行未実装・移行先実装済）／正本L327と整合 | `pf-eccube3/src/Eccube/Controller/Admin/Setting/System/AuthorityController.php:40, ec-cube-enterprise/src/Eccube/Controll` | §0 |  |
| m11-03 | カスタマイズ | 未実装疑い | 乖離（正本の未実装断定が誤り＝設計記述誤り）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/Admin/SettingServiceProvider.php:81, pf-eccube3/app/Plugin/HareruyaEc/C` | §0・§5 |  |
| m11-03 | カスタマイズ | 未実装疑い | リニューアル差（現行未実装・既定可否が逆）／正本L327と整合 | `pf-eccube3/src/Eccube/Security/Voter/AuthorityVoter.php:66` | §0 |  |
| m11-03 | カスタマイズ | 移行退行疑い | 乖離（移行時の一覧差・不可視ルール）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/AuthorityRoleRepository.php:52, pf-eccube3/src/Eccube/Repository/AuthorityRoleR` | RG-001,RG-039 |  |
| m12-01 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ要件の未実装・公開状態で代替）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/BaseInfoRepository.php:203, ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:1` | RG-011 |  |
| m12-02 | カスタマイズ | 移行退行疑い | 乖離（現行=カスタマイズ未実装／詳細設計とExcelの競合）／移行先で充足・要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Analysis/SummaryController.php:116, ec-cube-enterprise/src/Eccube/Serv` | RG-005〜019 |  |
| m12-02 | カスタマイズ | 未実装疑い | 乖離（Excelカスタマイズ要件の未実装・CSV最終行の総合計欠落）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Analysis/SummaryController.php:108, ec-cube-enterprise/src/Eccube/Serv` | RG-018 |  |
| m12-03 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ要件の未実装）／要実機確認 | `SalesType.php:71, OrderDetailRepository.php:72, pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Analysis/SalesControll` | RG-005,006 |  |
| m12-03 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ要件の未実装）／要実機確認 | `sales.twig:164` | RG-007 |  |
| m12-03 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ要件の未実装または前提未記載）／要実機確認 | `OrderDetailRepository.php:76` | RG-050 |  |
| m12-05 | カスタマイズ | 未実装疑い | 乖離（Excel要件違反・「初期値に戻す」未実装） | `ec-cube-enterprise/html/template/admin/assets/js/function.js:187, ec-cube-enterprise/src/Eccube/Resource/template/admin/` | RG-020 |  |
| m12-06 | カスタマイズ | 移行退行疑い | 乖離（設計違反・BOM欠落の退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ProductRequestCsvExportService.php:47, pf-eccube3/app/Plugin/Hareruya` | RG-011 |  |
| m12-07 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ要件①未実装）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Analysis/FormatSalesType.php:19, pf-eccube3/app/Plugin/HareruyaEc/Contr` | RG-004〜007・DDT-TARGET |  |
| m12-07 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ要件②未実装・集計対象の欠落）／要実機確認（支店・スマレジ売上の格納先） | `pf-eccube3/app/Plugin/HareruyaEc/Repository/OrderRepository.php:1640, pf-eccube3/app/Plugin/HareruyaEc/Service/Smaregi/C` | RG-008 |  |
| m12-08 | カスタマイズ | 移行退行疑い | 乖離（設計違反・条件の取得元の退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:101, pf-eccube3/app/Plugin/HareruyaEc/` | RG-002 |  |
| m12-08 | カスタマイズ | 移行退行疑い | 乖離（現行踏襲違反・ファイル名の退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:139, pf-eccube3/.../FormatSalesControl` | RG-016,034 |  |
| m12-09 | 現行踏襲 | 移行退行疑い | 乖離（現行はサーバ側の必須検証が無くExcelの必須〇を満たさない／移行先は適合）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Analysis/UsedCardController.php:96, pf-eccube3/.../UsedCardType.php:32` | RG-007, DV-01, DV-04 |  |
| m12-09 | 現行踏襲 | 移行退行疑い | 乖離（設計はトークンありだが現行・移行先ともCSRF無効。現行はexport側のみ有効で内部不整合）／要実機確認 | `pf-eccube3/.../Form/Type/Admin/Analysis/UsedCardType.php:19, ec-cube-enterprise/.../SearchUsedCardType.php:34, pf-eccube` | RG-021 |  |
| m12-09 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・セッション保持/引き継ぎの消失＝設計の中核仕様が移行先に無い）／要実機確認 | `pf-eccube3/.../Controller/Admin/Analysis/UsedCardController.php:14, ec-cube-enterprise/src/Eccube/Controller/Admin/Analy` | RG-011,013,017,023 |  |
| m12-09 | 現行踏襲 | 移行退行疑い | 乖離（設計の「集計結果の表示」が現行・移行先とも存在しない＝設計過剰記述か実装欠落／要実機確認・仕様確認） | `pf-eccube3/.../Controller/Admin/Analysis/UsedCardController.php:104, pf-eccube3/.../template/admin/Analysis/used_card.tw` | RG-010,024 |  |
| m12-09 | 現行踏襲 | 移行退行疑い | 適合（カスタマイズ＝略式廃止が移行先で適用済み・乖離なし） | `pf-eccube3/.../Controller/Admin/Analysis/UsedCardController.php:58, pf-eccube3/.../template/admin/Analysis/used_card.twi` | §0（廃止につき生成なし） |  |
| m12-10 | 現行踏襲 | 移行退行疑い | 乖離（設計と実装の不一致・必須/初期値／移行先は現行より厳格化）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Analysis/UsedCardType.php:33, ec-cube-enterprise/src/Eccube/Form/Type/A` | RG-020（§3 DV-05,DV-06） |  |
| m13-01 | カスタマイズ | 移行退行疑い | 乖離（現行=★カスタマイズ未達／移行先で対応済）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Event/EventListType.php:62, pf-eccube3/app/Plugin/HareruyaEc/Repository` | RG-011,013 |  |
| m13-01 | カスタマイズ | 移行退行疑い | 乖離（現行=★カスタマイズ未達／移行先で対応済）／要実機確認 | `pf-eccube3/.../EventListType.php:62, ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventController.php:70, Search` | RG-012 |  |
| m13-01 | カスタマイズ | 移行退行疑い | 乖離（現行=Excel明示のエラー要件が未実装／移行先で対応済）／要実機確認 | `pf-eccube3/.../EventListType.php:30, ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchEventType.php:118` | RG-007・§3 DV-09 |  |
| m13-01 | カスタマイズ | 移行退行疑い | 乖離（現行・移行先とも★表示制御が未実装＝Excel 0214:L1033 未達）／要実機確認 | `pf-eccube3/.../DtbEventRepository.php:39, ec-cube-enterprise/src/Eccube/Repository/DtbEventRepository.php:122, EventCont` | RG-014 |  |
| m13-01 | カスタマイズ | 移行退行疑い | 乖離（移行先=Excel明示の略称検索が欠落・退行）／要実機確認 | `pf-eccube3/.../DtbEventRepository.php:56, ec-cube-enterprise/src/Eccube/Repository/DtbEventRepository.php:74` | RG-002 |  |
| m13-02 | カスタマイズ | 移行退行疑い | 乖離（移行先で退行・未実装）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/EventController.php:115, ec-cube-enterprise/src/Eccube/Controller/Admi` | RG-006 |  |
| m13-02 | カスタマイズ | 移行退行疑い | 乖離（現行未実装／移行先の更新は表示のみ強制）／要実機確認 | `pf-eccube3/.../Admin/EventController.php:57, ec-cube-enterprise/.../Event/EventController.php:306` | RG-021,022 |  |
| m13-02 | カスタマイズ | 移行退行疑い | 乖離（移行先でHTTP/遷移先が現行と相違） | `pf-eccube3/.../Admin/EventController.php:162, ec-cube-enterprise/.../Event/EventController.php:304` | RG-011,012 |  |
| m13-02 | カスタマイズ | 移行退行疑い | 乖離（現行未実装・移行先は一部実装）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Admin/Event/EventEditAction.php:61, pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Adm` | RG-031,033,034 |  |
| m13-03 | 現行踏襲 | 未実装疑い | 乖離（★カスタマイズ要件 未実装・認可欠落）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/ScheduleController.php:26` | RG-012,013 |  |
| m13-03 | 現行踏襲 | 未実装疑い | 乖離（★カスタマイズ要件 未実装）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Schedule/schedule.twig:175` | RG-008,009 |  |
| m13-04 | 現行踏襲 | 未実装疑い | 乖離（★カスタマイズ pf未実装／enterprise実装済み） | `app/Plugin/HareruyaEc/Controller/Admin/RepeatScheduleController.php:29, src/Eccube/Controller/Admin/Event/RepeatSchedule` | RG-004 |  |
| m13-05 | カスタマイズ | 未実装疑い | 乖離（Excel必須項目の欠落＝未実装／現行踏襲差）／要実機確認 | `ec-cube-enterprise/app/DoctrineMigrations/Version20260611000000.php:27, ec-cube-enterprise/src/Eccube/Form/Type/Admin/Ev` | RG-003(DV-C04),040(DV-R0 |  |
| m13-06 | カスタマイズ | 移行退行疑い | 乖離（現行未実装・詳細設計の記述漏れ／移行先で充足）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Entry/EntryListType.php:146, pf-eccube3/app/Plugin/HareruyaEc/Entity/Dt` | RG-003 |  |
| m13-06 | カスタマイズ | 未実装疑い | 乖離（Excelカスタマイズ要件の未実装・権限による情報露出の可能性）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryController.php:102, ec-cube-enterprise/src/Eccube/Repository/D` | RG-044,045 |  |
| m13-06 | カスタマイズ | 移行退行疑い | 乖離（現行に廃止対象が残存＝移行先で解消済。刷新後の実装対象ではない） | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Entry/EntryListType.php:88, pf-eccube3/app/Plugin/HareruyaEc/Resource/t` | §0（テスト生成せず） |  |
| m13-06 | カスタマイズ | 移行退行疑い | 乖離（現行未実装・詳細設計の記述漏れ／移行先で充足。エラー文言はExcelに明示なし）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Entry/EntryListType.php:96, ec-cube-enterprise/src/Eccube/Form/Type/Adm` | RG-009・DV-04 |  |
| m13-06 | カスタマイズ | 移行退行疑い | 乖離（入力長制限の消失／L331「移行で変わらない」に反するキー改名・既定ソートキーの退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchEntryType.php:98, pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbEnt` | RG-006,007,017,019・DV-08 |  |
| m13-07 | 現行踏襲 | 移行退行疑い | 乖離（詳細設計の★要件記載漏れ／現行はカスタマイズ未適用・移行先のみ充足）／要実機確認（混在選択時に全体拒否か権限内のみ更新かはExcelが未規定） | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:607, ec-cube-enterprise/src/Eccube/Service/Admin/E` | RG-001,002,003 |  |
| m13-07 | 現行踏襲 | 移行退行疑い | 乖離（詳細設計 L318 と L325 の内部不整合／移行先のパス変更・現行踏襲差）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/Admin/EntryServiceProvider.php:75, ec-cube-enterprise/src/Eccube/Contro` | RG-033 |  |
| m13-07 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・移行先で非同期ガードが消失／設計 L319,L326,L359 の第2段が移行先で未充足）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:595, ec-cube-enterprise/src/Eccube/Controller/Admi` | RG-006,013 |  |
| m13-08 | カスタマイズ | 未実装疑い | 未実装（カスタマイズ要件未達・権限外店舗のデッキが閲覧可能＝認可の穴）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbDeckRepository.php:682, pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/` | RG-004 |  |
| m13-08 | カスタマイズ | 移行退行疑い | 乖離（現行=カスタマイズ要件未達／移行先=充足）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Util/CardUtil.php:34, pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Entry/de` | RG-011 |  |
| m13-08 | カスタマイズ | 移行退行疑い | 乖離（現行=カスタマイズ要件未達／移行先=充足）／要実機確認 | `pf-eccube3/.../decklist.twig:35, CardUtil.php:65, ec-cube-enterprise/.../EntryDeckListDisplayBuilder.php:317, ec-cube-en` | RG-012,RG-013 |  |
| m13-08 | カスタマイズ | 移行退行疑い | 乖離（現行=削除要件未達／移行先=充足だが未使用データ残置）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:794, pf-eccube3/.../decklist.twig:24, ec-cube-ente` | §0・RG-005 |  |
| m13-08 | カスタマイズ | 移行退行疑い | 乖離（現行=削除要件未達／移行先=充足）／要実機確認 | `pf-eccube3/.../decklist.twig:49` | §0・RG-005 |  |
| m13-08 | カスタマイズ | 移行退行疑い | 乖離（移行先=Excel画面項目違反・Event欄の日英退行）／要実機確認 | `pf-eccube3/.../decklist.twig:25, ec-cube-enterprise/.../EntryDeckListDisplayBuilder.php:144, ec-cube-enterprise/.../deck` | RG-009 |  |
| m13-08 | カスタマイズ | 移行退行疑い | 乖離（移行先=現行踏襲違反・サイドボード欠落）／要実機確認 | `pf-eccube3/.../EntryController.php:777, pf-eccube3/.../decklist.twig:39, ec-cube-enterprise/.../EntryDeckListDisplayBuil` | RG-017,RG-018 |  |
| m13-08 | カスタマイズ | 移行退行疑い | 乖離（移行先=現行踏襲違反・プレイヤー名の決定順逆転）／要実機確認 | `pf-eccube3/.../EntryController.php:793, ec-cube-enterprise/.../EntryDeckListDisplayBuilder.php:338` | RG-006,RG-007 |  |
| m13-09 | カスタマイズ | 未実装疑い | 乖離（カスタマイズ要件の未実装/未反映の疑い・権限外店舗のデータ露出リスク）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbEntryPlayerRepository.php:148, ec-cube-enterprise/src/Eccube/Controller/A` | RG-004 |  |
| m13-09 | カスタマイズ | 移行退行疑い | 乖離（移行先の並び順固定の退行）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:848, ec-cube-enterprise/src/Eccube/Controller/Admi` | RG-005 |  |
| m13-09 | カスタマイズ | 移行退行疑い | 乖離（移行先の出力対象欠落の疑い・現行踏襲違反）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:816, ec-cube-enterprise/src/Eccube/Controller/Admi` | RG-020,021 |  |
| m13-09 | カスタマイズ | 移行退行疑い | 乖離（移行先の入口URL差・詳細指定エクスポートの導線欠落の疑い）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/Admin/EntryServiceProvider.php:44, ec-cube-enterprise/src/Eccube/Contro` | RG-002,014,016,017 |  |
| m13-10 | カスタマイズ | 移行退行疑い | 乖離（移行先で支払会員が更新される＝更新対象外の退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Admin/Event/EntryUpdateAction.php:54, pf-eccube3/.../EntryController.php:526` | RG-016 |  |
| m13-10 | カスタマイズ | 移行退行疑い | 乖離（移行先でチーム複数参加者の編集が不可＝機能退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryController.php:296, src/Eccube/Form/Type/Admin/EventEntryDetai` | RG-008,025,026,027 |  |
| m13-10 | カスタマイズ | 移行退行疑い | 乖離（現行踏襲の成功文言が移行先で変化）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryController.php:286, src/Eccube/Resource/locale/messages.ja.yam` | RG-018 |  |
| m13-11 | 現行踏襲 | 移行退行疑い | 乖離（現行=カスタマイズ未反映／移行先モーダル版=Excel初期値と不一致）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Event/EventListType.php:51, pf-eccube3/app/Plugin/HareruyaEc/config.yml` | RG-009 |  |
| m13-11 | 現行踏襲 | 移行退行疑い | 乖離（★カスタマイズ未実装・移行先の申込登録検索で権限外店舗のイベントが見える）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:196, pf-eccube3/app/Plugin/HareruyaEc/Repository/D` | RG-007・DV-06 |  |
| m13-11 | 現行踏襲 | 未実装疑い | 乖離（★カスタマイズ未実装・権限外店舗のイベントで登録導線が露出）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Entry/search_event.twig:41, ec-cube-enterprise/src/Eccube/Resou` | RG-019 |  |
| m13-11 | 現行踏襲 | 未実装疑い | 乖離（現行=エラー未実装・From>To でエラーにならず0件になりうる）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:194, pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Ad` | RG-004・DV-11 |  |
| m13-11 | 現行踏襲 | 移行退行疑い | 乖離（直接検索の「ID」の意味が現行=日程ID／設計・移行先=イベントIDで不一致・CSRF有無も差）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:281, pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Ad` | RG-024 |  |
| m13-12 | カスタマイズ | 移行退行疑い | 乖離（現行=カスタマイズ未反映／詳細設計=記述が刷新要件を反映せず。移行先は要件充足）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Entry/EntryDetailType.php:57, ec-cube-enterprise/src/Eccube/Form/Type/A` | RG-005,023,028・DV-06 |  |
| m13-12 | カスタマイズ | 移行退行疑い | 乖離（Excel／詳細設計／移行先の三者不一致・遷移先未確定）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:480, ec-cube-enterprise/src/Eccube/Controller/Admi` | RG-033 |  |
| m13-12 | カスタマイズ | 移行退行疑い | 乖離（現行=設計の「必須」がサーバ側未強制。直POSTで致命エラーに到達しうる／移行先は是正済み）／要実機確認 | `pf-eccube3/.../EntryDetailType.php:74, EntryDuplicateValidator.php:31, EntryController.php:456, Resource/template/admin/` | RG-029・DV-02,DV-08 |  |
| m13-12 | カスタマイズ | 設計誤り疑い | 乖離（詳細設計のラベル表記が不正確。Excel＝「申込済み」「管理者追加」が正・値の固定登録自体は現行/移行先とも整合）／軽微 | `pf-eccube3/app/Plugin/HareruyaEc/Entity/MtbEntryStatus.php:14, pf-eccube3/app/Plugin/HareruyaEc/Resource/doctrine/migrat` | RG-003,004,021,022 |  |
| m13-13 | カスタマイズ | 未実装疑い | 乖離（Excel固有業務ルールの未実装＝カスタマイズ仕様欠落）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/BulkEntryImportHandler.php:226, pf-eccube3/app/Plugin/Hareru` | RG-026 |  |
| m13-14 | 現行踏襲 | 移行退行疑い | 乖離（現行=Excel★カスタマイズ未適合／移行先=適合・差分は設計どおり） | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Banner/BannerType.php:104, ec-cube-enterprise/src/Eccube/Form/Type/Admi` | RG-009 |  |
| m13-14 | 現行踏襲 | 移行退行疑い | 乖離（現行=Excel「半角」未適合／移行先=設計外の追加制約）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/Event/EventBannerSettingType.php:95, pf-eccube3/app/Plugin/HareruyaEc/Form` | RG-005(DV-05) |  |
| m13-14 | 現行踏襲 | 移行退行疑い | 乖離（設計URLと移行先実装の不一致）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/Admin/BannerServiceProvider.php:19, ec-cube-enterprise/src/Eccube/Contr` | RG-017,018,020,022,035 |  |
| m13-15 | カスタマイズ | 未実装疑い | 未実装（カスタマイズ要件未反映・メニュー配置）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/Admin/SidebarProvider.php:436` | RG-039 |  |
| m13-15 | カスタマイズ | 未実装疑い | 未実装（カスタマイズ要件未反映・フォルダ分離）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/BannerController.php:20, pf-eccube3/app/Plugin/HareruyaEc/Service/S3Ac` | RG-002,036,037 |  |
| m13-15 | カスタマイズ | 未実装疑い | 未実装（カスタマイズ要件未反映・権限による表示絞り込み）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/BannerController.php:51, pf-eccube3/app/Plugin/HareruyaEc/Resource/tem` | RG-025,027 |  |
| m13-15 | カスタマイズ | 未実装疑い | 未実装（カスタマイズ要件未反映・登録権限の欠落＝縦深防御の穴）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/BannerController.php:168` | RG-023,024 |  |
| m13-15 | カスタマイズ | 未実装疑い | 未実装（カスタマイズ要件未反映・削除権限の欠落＝縦深防御の穴・URL直接アクセス）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Banner/banner.twig:209, pf-eccube3/app/Plugin/HareruyaEc/Contro` | RG-026,027 |  |
| m14-01 | カスタマイズ | 移行退行疑い | 乖離（現行未実装／移行先で充足・詳細設計HTMLに記載漏れ）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Card/SearchCardType.php:38, pf-eccube3/app/Plugin/HareruyaEc/Repository` | RG-006,007 |  |
| m14-01 | カスタマイズ | 移行退行疑い | 乖離（現行未実装／移行先で充足・詳細設計HTMLに記載漏れ）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Card/SearchCardType.php:38, ec-cube-enterprise/src/Eccube/Form/Type/Adm` | RG-022 |  |
| m14-01 | カスタマイズ | 移行退行疑い | 乖離（現行未実装／移行先で充足・詳細設計HTMLに記載漏れ）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Card/SearchCardType.php:38, ec-cube-enterprise/src/Eccube/Form/Type/Adm` | RG-023 |  |
| m14-01 | カスタマイズ | 移行退行疑い | 乖離（現行未実装／移行先で条件式は充足するが活性制御・初期選択が未確認）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Card/SearchCardType.php:151, pf-eccube3/app/Plugin/HareruyaEc/Repositor` | RG-018,019,020,021 |  |
| m14-01 | カスタマイズ | 移行退行疑い | 乖離（現行未実装／移行先の照合方式が仕様未定義）／要仕様確認・要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Card/SearchCardType.php:77, pf-eccube3/app/Plugin/HareruyaEc/Repository` | RG-008・§3 DV-08 |  |
| m14-01 | カスタマイズ | 移行退行疑い | 乖離（詳細設計HTMLがExcelと矛盾・現行はExcel要件違反／移行先で充足）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Repository/MtbCardRepository.php:116, ec-cube-enterprise/src/Eccube/Repository/Master/M` | RG-004 |  |
| m14-01 | カスタマイズ | 移行退行疑い | 乖離（現行踏襲違反・移行先の退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:225, pf-eccube3/app/Plugin/HareruyaEc/Repository/M` | RG-001,002・§3 DV-05 |  |
| m14-02 | カスタマイズ | 移行退行疑い | 乖離（現行=カスタマイズ未適用／移行先=Excel適合）。詳細設計HTML L340・L342 の列一覧が Excel カスタマイズに追随しておらず、正本として使うと設計違反の期待を生む | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/CardCsvController.php:136, Service/Csv/CardCsv.php:273, ec-cube-enterp` | RG-009,010,018／DDT-A |  |
| m14-02 | カスタマイズ | 移行退行疑い | 乖離（現行=リーガリティ絞り込み未実装／移行先=Excel適合） | `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/CardCsv.php:240, ec-cube-enterprise/.../CardCsv.php:337, src/Eccube/Entity/` | RG-015／DDT-C |  |
| m14-02 | カスタマイズ | 移行退行疑い | 乖離（移行先・入口パス/ルート名/CSRF の変更）。Excel は入口パスとCSRFに沈黙／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardCsvController.php:143, pf-eccube3/.../Card/card.twig:175` | RG-004,008 |  |
| m14-02 | カスタマイズ | 移行退行疑い | 乖離（移行先・メッセージキー差＋クライアント側ガード追加）。表示文言はExcel適合／要実機確認 | `ec-cube-enterprise/.../CardCsvController.php:150, ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2445, e` | RG-030 |  |
| m14-03 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・入口のHTTPメソッド/パス退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardController.php:308, pf-eccube3/app/Plugin/HareruyaEc/ServiceProv` | RG-001,042 |  |
| m14-03 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・未選択時のフラッシュ有無退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardController.php:318, pf-eccube3/app/Plugin/HareruyaEc/Controller/` | RG-005,006 |  |
| m14-03 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・ブロック時の打ち切り→継続への退行）／要実機確認 | `/Card/CardController.php:330, /Admin/CardController.php:184` | RG-008,009,012,013,020 |  |
| m14-03 | 現行踏襲 | 移行退行疑い | 乖離（設計記述と移行先実装の不一致・NULL切り離しの欠落）／要実機確認 | `/Card/CardController.php:336, ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:400, /Admin/CardCont` | RG-015,016,049 |  |
| m14-03 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・ブロック時Referer遷移と空page_no分岐の退行）／要実機確認 | `/Card/CardController.php:316, /Admin/CardController.php:166, /Admin/CardController.php:189` | RG-013,014,006 |  |
| m14-03 | 現行踏襲 | 移行退行疑い | 乖離（意図と実装の不一致・買取紐付けカードの誤削除リスク／現行・移行先の双方に残存）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Repository/MtbCardRepository.php:301, pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin` | RG-011 |  |
| m14-04 | カスタマイズ | 未実装疑い | 乖離（現行踏襲違反・支店連携の欠落＝連携未実装）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/CardController.php:14` | RG-043,044,045,046 |  |
| m14-05 | カスタマイズ | 移行退行疑い | 乖離（現行踏襲違反・支店連携の退行）／要実機確認（M14-05の取込で支店へ通知されず支店側カードが更新されない疑い。意図的な移設なら設計への明記が必要） | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/CardCsvController.php:87, ec-cube-enterprise/src/Eccube/Controller/Adm` | RG-031,032 |  |
| m14-05 | カスタマイズ | 未実装疑い | カスタマイズ未実装（現行・想定内）／移行先は適合。ただし移行先も `ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php:189` に `tsv` → タブ区切りの分岐が残存（カード取 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardCsvController.php:96, ec-cube-enterprise/src/Eccube/Resource/tem` | RG-002,003,005,038 |  |
| m14-06 | 現行踏襲 | 移行退行疑い | 乖離（現行実装のタイプミス由来バグ・移行先で解消）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Cardset/card_set.twig:26, ec-cube-enterprise/app/template/admin` | RG-034 |  |
| m14-07 | 現行踏襲 | 未実装疑い | 乖離（宣言意図と実装の不一致・英語優先が未実装）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Repository/MtbCardImageRepository.php:184, pf-eccube3/app/Plugin/HareruyaEc/Entity/MtbL` | RG-010, RG-008 |  |
| m14-08 | カスタマイズ | 移行退行疑い | 乖離（現行踏襲違反・データ損失を伴う退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardsetController.php:198` | RG-030,031 |  |
| m14-08 | カスタマイズ | 移行退行疑い | 乖離（現行踏襲違反・戻り先の退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardsetController.php:224` | RG-031,032 |  |
| m14-09 | 現行踏襲 | バグ候補 | バグ候補（誤誘導メッセージ・未使用メッセージ定義の放置）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/FormatController.php:161, pf-eccube3/app/Plugin/HareruyaEc/Resource/lo` | RG-019, DV-07, DV-08 |  |
| m14-10 | カスタマイズ | 未実装疑い | 乖離（現行踏襲違反・文字数上限の未実装）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/FormatType.php:58, pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Format` | RG-045(DV-03,04) |  |
| m14-10 | カスタマイズ | 未実装疑い | 乖離（現行踏襲違反・文字数上限の未実装）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/FormatType.php:68, pf-eccube3/.../Format/FormatType.php:47` | RG-045(DV-07,08) |  |
| m14-10 | カスタマイズ | 未実装疑い | 乖離（現行踏襲違反・文字数上限の未実装）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/FormatType.php:82, pf-eccube3/.../Format/FormatType.php:61` | RG-045(DV-10,11)・RG-048( |  |
| m14-10 | カスタマイズ | 未実装疑い | 乖離（現行踏襲違反・レンジ検証の未実装）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/FormatType.php:96, pf-eccube3/.../Format/FormatType.php:70, pf-eccube3/app` | RG-046(DV-16,17) |  |
| m14-10 | カスタマイズ | 未実装疑い | 乖離（現行踏襲違反・必須検証の未実装）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/FormatType.php:272, pf-eccube3/.../Format/FormatType.php:218` | RG-044(DV-27) |  |
| m14-10 | カスタマイズ | 未実装疑い | 乖離（現行踏襲違反・文字数上限の未実装）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/FormatType.php:289, pf-eccube3/.../Format/FormatType.php:236, config.yml:2` | RG-045(DV-32〜35) |  |
| m14-10 | カスタマイズ | 未実装疑い | 乖離（初期値14の未実装）／要実機確認 | `ec-cube-enterprise/src/Eccube/Entity/Master/MtbFormat.php:312` | RG-005 |  |
| m14-10 | カスタマイズ | 移行退行疑い | 乖離（既定並び順の退行・同順時の順序不定）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/FormatController.php:45` | RG-001 |  |
| m15-01 | カスタマイズ | 移行退行疑い | 乖離（既定表示件数の退行・セッションキー接頭辞の不整合）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:114, ec-cube-enterprise/src/Eccube/Controller/Adm` | RG-032,035,036,048 |  |
| m15-02 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・メッセージキーと戻り先の退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4373, ec-cube-enterprise/src/Eccube/Controller/Admin/Deck` | RG-009, DV-01 |  |
| m15-02 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・エラー識別性の退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:699` | RG-010, DV-04 |  |
| m15-03 | 現行踏襲 | 移行退行疑い | 乖離（現行踏襲違反・CSRF失敗時ステータス退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:143` | RG-010,029・DV-08 |  |
| m15-06 | カスタマイズ | 未実装疑い | カスタマイズ未反映（TSV廃止・拡張子エラー化が未実装）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/AbstractCsvService.php:156, Service/Csv/Importer/CsvImporter.php:162, Contr` | RG-002,031 |  |
| m15-06 | カスタマイズ | 未実装疑い | カスタマイズ未反映（項目削除・厳密処理除去が未実装）。かつ 0212:L2504 の枚数チェックが現行では厳密時のみ有効＝§6の要仕様確認と直結／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/DeckCsvController.php:27, Service/Csv/DeckCsv.php:89, Service/Csv/Deck` | RG-003,026 |  |
| m15-06 | カスタマイズ | 未実装疑い | カスタマイズ未反映（項目除去5件・追加1件が未実装）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/DeckCsvController.php:184, Service/Csv/DeckCsv.php:122, Service/Csv/De` | RG-004,016,033 |  |
| m15-07 | 現行踏襲 | 移行退行疑い | 乖離（現行実装の欠陥・設計が有効とする値が保存不能／移行先は解消）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/doctrine/Plugin.HareruyaEc.Entity.MtbDeckTag.dcm.yml:40, pf-eccube3/app/Plugin` | RG-029(DV-10) |  |
| m15-08 | カスタマイズ | 移行退行疑い | 乖離（現行踏襲違反・選択肢ラベルの退行）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Deck/SearchDeckType.php:66, ec-cube-enterprise/src/Eccube/Form/Type/Adm` | RG-008 |  |
| m15-08 | カスタマイズ | 移行退行疑い | 乖離（現行踏襲違反・フロント連動の未移行。本機能の中心的挙動が欠落）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Deck/SearchDeckType.php:69, pf-eccube3/app/Plugin/HareruyaEc/Resource/t` | RG-011〜014, RG-016 |  |
| m15-09 | カスタマイズ | 移行退行疑い | 乖離（現行踏襲違反・削除失敗時の遷移先退行）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Archetype/ArchetypeController.php:191` | RG-027 |  |
| m15-09 | カスタマイズ | 未実装疑い | 乖離（Excel記載の分割AND LIKE未実装・検索結果が変わる）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Archetype/ArchetypeController.php:277` | RG-033, RG-034 |  |
| o01-01 | カスタマイズ | バグ候補 | 乖離（実装バグ候補・非成立=一律キャンセル日時）／要実機確認 | `src/Controller/Admin/OtcBuyOrderController.php:208` | RG-011,013 |  |

## §2. 一般乖離（P2）（1,299件）

| 機能 | 区分 | 分類 | 判定（設計→実装の食い違い） | file:line | RG | 裁定 |
|---|---|---|---|---|---|---|
| a01-02 | 新規実装 | 乖離 | 乖離（抽出条件の実装位置差・非対象区分の反復enqueue） | `SmaregiStockBackfillAction.php:228, src/Eccube/Service/Smaregi/Webhook/Stock/SmaregiStockChangeApplier.php:44` | RG-004,014 |  |
| a01-02 | 新規実装 | 乖離 | 乖離（抽出条件の実装位置差・OTCの反復enqueue） | `SmaregiStockBackfillAction.php:228, SmaregiStockChangeApplier.php:108` | RG-005 |  |
| a02-01 | 現行踏襲 | 乖離 | 乖離（エンドポイント表記差・`/api` 接頭辞の付与主体が不明）／要実機確認 | `pf-api/config/routes.yaml:85` | RG-001,016 |  |
| a02-01 | 現行踏襲 | 乖離 | 乖離（Excel設計の `ja` と実装/詳細設計の `jp` が不一致・差し替え仕様の実在も未確認）／要実機確認 | `pf-api/src/Repository/DtbProductSubClassRepository.php:17` | RG-011,020／DV-01,02,03 |  |
| a02-01 | 現行踏襲 | 乖離 | 乖離（Excel=未使用/null に対し実装は商品規格の値を返す）／要実機確認 | `pf-api/src/Repository/DtbProductSubClassRepository.php:56, pf-api/src/Controller/ProductController.php:61` | RG-005 |  |
| a02-01 | 現行踏襲 | 乖離 | 乖離（オラクル未規定の抽出条件・選択優先順位が実装に存在＝設計未記載／シングルカード限定の実現方式も未記載）／要実機確認 | `pf-api/src/Repository/DtbProductSubClassRepository.php:35` | RG-010,012 |  |
| a02-01 | 現行踏襲 | 乖離 | 乖離（Excelの型定義「文字型」とExcel自身のサンプル/詳細設計の boolean が不一致＝Excel型定義の誤記疑い）／要実機確認 | `pf-api/src/Repository/DtbProductSubClassRepository.php:65` | RG-003 |  |
| a02-02 | 現行踏襲 | 乖離 | 乖離（Excel規定フィールドの欠落／Excel内部矛盾）／要実機確認 | `pf-api/src/Repository/DtbProductSubClassRepository.php:129` | RG-009 |  |
| a02-02 | 現行踏襲 | 乖離 | 乖離（未使用項目の実値返却・型差）／要実機確認 | `pf-api/src/Repository/DtbProductSubClassRepository.php:133` | RG-008,RG-007 |  |
| a02-02 | 現行踏襲 | 乖離 | 乖離（記載URLの層が不明確・接頭辞差）／要実機確認 | `pf-api/config/routes.yaml:89` | RG-001,§1 |  |
| a02-02 | 現行踏襲 | 乖離 | 乖離（既定値・値域検証の不在／DQL文字列連結）／要実機確認 | `pf-api/config/routes.yaml:90, pf-api/src/Controller/ProductController.php:87, pf-api/src/Repository/DtbProductSubClassRe` | RG-003,DV-09,DV-10,DV-12 |  |
| a02-02 | 現行踏襲 | 乖離 | 乖離（設計の記述不足＝抽出条件・並び順の一部が設計に存在しない）／要実機確認 | `pf-api/src/Repository/DtbProductSubClassRepository.php:107` | RG-002,RG-014,RG-015,DV- |  |
| a02-03 | 現行踏襲 | 乖離 | 乖離（詳細設計の型誤記／要実機確認）: 詳細 L323 の integer は実データ（`AER000022JN`）と整合せず、Excel の「文字型」が実態に合致。詳細設計の型記述が誤りである可能性が高い（現行PHPDocの誤記を転記したものと見られる） | `pf-api/src/Repository/DtbProductRepository.php:97, pf-api/config/routes.yaml:97, pf-api/src/Controller/ProductController` | RG-002／§3・§5 |  |
| a02-03 | 現行踏襲 | 乖離 | 乖離（詳細設計の記載漏れ）: 実在する `.json` ルートが詳細設計の入口表（L311）に無い。Excel は記載しており Excel が正。テスト面として `.json` 変種の同一応答確認が必要＝要実機確認 | `pf-api/config/routes.yaml:93, ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:318` | §5（要判定） |  |
| a02-03 | 現行踏襲 | 乖離 | 乖離（設計の記載漏れ）: 論理削除された商品/規格の旧商品IDを指定した場合、実装は該当なし＝404 となるが設計は沈黙。抽出条件の限定が設計に落ちていない＝要実機確認 | `pf-api/src/Repository/DtbProductRepository.php:98` | RG-003／§5（要判定） |  |
| a02-04 | 現行踏襲 | 乖離 | 乖離（Excel基本設計のA02-03/A02-04間で機能とエンドポイントの割当が入替＝機能同定に影響）／要仕様確認 | `pf-api/config/routes.yaml:97, pf-api/config/routes.yaml:105, pf-api/src/Controller/ProductController.php:137` | RG-016・§5(要判定) |  |
| a02-04 | 現行踏襲 | 乖離 | 乖離（詳細設計の型記載 integer が誤り。Excel「文字型」が実データ型と整合＝Excel優先で正）／要実機確認 | `pf-api/src/Entity/MtbCard.php:88, pf-api/src/Repository/DtbProductSubClassRepository.php:183, pf-api/config/routes.yaml:` | RG-002・DDT |  |
| a02-04 | 現行踏襲 | 乖離 | 乖離（Excelは未使用/null・詳細設計と実装は実値返却。price01 を業務値として消費する契約かが不明確）／要実機確認 | `pf-api/src/Repository/DtbProductSubClassRepository.php:198` | RG-010 |  |
| a02-04 | 現行踏襲 | 乖離 | 乖離／要実機確認（Excel 型表 integer vs Excel サンプル string の自己矛盾＋詳細 string。オラクルで型を一意化できず。実装値は本ポインタに留め期待へ持ち込まない） | `pf-api/src/Repository/DtbProductSubClassRepository.php:198` | RG-011,017 |  |
| a02-04 | 現行踏襲 | 乖離 | 乖離（Excel注記の `ja` と詳細設計・実装の `jp` が不一致。想定外 lang 受領時の挙動が設計に未規定）／要実機確認 | `pf-api/src/Repository/DtbProductSubClassRepository.php:17, pf-api/src/Repository/DtbProductSubClassRepository.php:232` | RG-004・DV-04 |  |
| a02-04 | 現行踏襲 | 乖離 | 乖離（複数該当時の選択優先順位・削除フラグ/公開ステータスの絞り込みが設計に未規定＝設計の記述不足。どの1件が返るか設計から予測できない）／要実機確認 | `pf-api/src/Repository/DtbProductSubClassRepository.php:171` | RG-008・§5(要判定) |  |
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
| a06-04 | 現行踏襲 | 乖離 | 乖離（Excel文書のパス表記差・要実機確認） | `config/routes.yaml:42` | RG-016,017 |  |
| a06-04 | 現行踏襲 | 乖離 | 乖離（実装の順序誤り・現状は無害だが要是正） | `src/Controller/Admin/OtcBuyOrderFreeCommentController.php:44` | RG-001,003 |  |
| a06-05 | カスタマイズ | 乖離 | 乖離（カスタマイズ未達＝現行pf-apiで新設ステータスへ更新可能。enterpriseでは実装） | `src/Controller/Admin/OtcBuyOrderStatusController.php:74, src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateStat` | RG-023,024,TR-10〜14 |  |
| a06-05 | カスタマイズ | 乖離 | 乖離（ステータスマスタ/査定終了集合の定義不一致・Excel優先で上書き） | `src/Entity/MtbOtcBuyOrderStatus.php:10, src/Eccube/Entity/Master/MtbOtcBuyOrderStatus.php:45` | RG-004,005,009,023,TR-* |  |
| a06-05 | カスタマイズ | 乖離 | 乖離（enterpriseで明示トランザクション・例外整形を追加・軽微／要実機確認） | `OtcBuyOrderStatusController.php:74, UpdateStatusAction.php:106` | RG-022 |  |
| a06-06 | 現行踏襲 | 乖離 | 乖離（カスタマイズ未達） | `src/Repository/DtbProductRepository.php:157` | RG-005 |  |
| a06-06 | 現行踏襲 | 乖離 | 乖離（カスタマイズ未達・店舗スコープ無） | `src/Repository/DtbProductRepository.php:159, src/Controller/ProductController.php:161` | RG-006 |  |
| a06-06 | 現行踏襲 | 乖離 | 乖離疑義（内部結合で偽404／実機再現で確定） | `src/Repository/DtbProductRepository.php:131` | RG-001,012 |  |
| a06-06 | 現行踏襲 | 乖離 | 乖離（設計間の記述不一致・軽微／要実機確認） | `src/Controller/ProductController.php:161, DtbProductRepository.php:145` | RG-015 |  |
| a06-07 | 現行踏襲 | 乖離 | 乖離（Excel記載の`/api/`プレフィクスが現行実装/詳細設計と不一致・要確認） | `pf-api/config/routes.yaml:113, ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyingController.php:67` | RG-001,014,015 |  |
| a06-07 | 現行踏襲 | 乖離 | 乖離（ids必須性のExcel/詳細設計/実装三者不整合・現行はnull時に非推奨警告） | `pf-api/src/Controller/ProductController.php:183, .../BuyingController.php:70` | RG-005,011 |  |
| a06-08 | 現行踏襲 | 乖離 | 乖離（メソッド/パス相違）／要実機確認 | `config/routes.yaml:134` | 共通前提（全RG） |  |
| a06-08 | 現行踏襲 | 乖離 | 乖離（★カスタマイズ未達・販売価格のまま） | `src/Repository/DtbProductRepository.php:276` | RG-006 |  |
| a06-08 | 現行踏襲 | 乖離 | 乖離（★カスタマイズ未達・汎用在庫のまま） | `src/Repository/DtbProductRepository.php:279` | RG-007 |  |
| a06-11 | 現行踏襲 | 乖離 | 乖離（設計内部不一致・型齟齬）／要実機確認 | `src/Repository/MtbSectionRepository.php:21, SectionController.php:42` | RG-008 |  |
| a06-11 | 現行踏襲 | 乖離 | 乖離（エンドポイント文字列差・要実機確認） | `config/routes.yaml:240, SectionController.php:35` | RG-011 |  |
| a06-12 | 現行踏襲 | 乖離 | 乖離（現行踏襲の逸脱・設定なし時の契約差） | `OptionController.php:57, ProductController.php:497` | RG-007,008 |  |
| a06-12 | 現行踏襲 | 乖離 | 乖離（Excelエンドポイント記載と実装パス不一致）／要実機確認 | `pf-api/config/routes.yaml:244, OptionController.php:50` | RG-013 |  |
| a06-12 | 現行踏襲 | 乖離 | 乖離疑義（認可は適用されるが Excel の IP制限/トークン方式との一致がコード上未確認）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OptionController.php:25` | RG-014 |  |
| a06-12 | 現行踏襲 | 乖離 | 実装確認（要確認の解消・乖離なし） | `pf-api/src/Entity/MtbOption.php:31, ec-cube-enterprise/src/Eccube/Entity/Master/MtbOption.php:31` | RG-008,012 |  |
| a06-13 | 現行踏襲 | その他 | 証明書IDがマスタに存在しない場合は入力不正 HTTP 400（Excel 0506:L3458「400 証明書IDがマスタに登録されていないものだった場合」／詳細L340,L351,L367「入力不正 HTTP 400 | `ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:288, src/Eccube/Exception/App/N` |  |  |
| a06-13 | 現行踏襲 | その他 | 処理フローは(1)トークン検証→401を最初、(2)受注取得→404、(3)証明書→400 の順（詳細L328）。認証拒否が404/400に優先する | `OtcBuyOrderController.php:293, ec-cube-enterprise/app/config/eccube/packages/security.yaml:32` |  |  |
| a06-13 | 現行踏襲 | その他 | 詳細L340は 401=認証拒否（本文を持たない）・404=該当なし（本文を持たない）・400のみ `{code,errors}` | `—` |  |  |
| a06-16 | 新規実装 | 乖離 | 乖離（Excel設計 vs 実装パス相違） | `src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:231` | RG-004 |  |
| a06-16 | 新規実装 | 乖離 | 乖離（Excel「新規カラム」 vs 実装 別テーブルUPSERT） | `src/Eccube/Service/EntityManager/OtcBuyOrderApproverEntityManager.php:33, UpdateDoubleCheckMemberAction.php:47` | RG-002 |  |
| a06-16 | 新規実装 | 乖離 | 乖離（Excel沈黙・実装が追加更新／要実機確認） | `UpdateDoubleCheckMemberAction.php:42` | RG-002 |  |
| a06-16 | 新規実装 | 乖離 | 乖離（Excel沈黙・実装が追加検証／要実機確認） | `UpdateDoubleCheckMemberAction.php:36` | 台帳(要判定) |  |
| a06-16 | 新規実装 | 乖離 | 乖離（Excel「なし」 vs 実装 codeボディ返却） | `OtcBuyOrderController.php:267` | RG-003 |  |
| a06-16 | 新規実装 | 乖離 | 乖離疑義（Excel「IP制限」 vs 実装 セッション認証／要実機確認） | `OtcBuyOrderController.php:244` | RG-006 |  |
| a07-01 | 現行踏襲 | 乖離 | 乖離（Excel型記述と実装/詳細設計の不一致） | `src/Entity/MtbOption.php:46, src/Controller/Admin/OptionController.php:26, src/Eccube/Entity/Master/MtbOption.php:154, .` | RG-001,006 |  |
| a07-01 | 現行踏襲 | 乖離 | 乖離（認証失敗ハンドリングの網羅漏れ）／要実機確認 | `src/Controller/BaseController.php:30` | RG-003 |  |
| a07-01 | 現行踏襲 | その他 | 移行差異（L312記載済・バグではない）／挙動オラクルは現行を採用 | `OptionController.php:26, BaseController.php:23, OptionController.php:42, OptionController.php:25, MtbOption.php:29, MtbO` | RG-005 |  |
| a07-02 | 現行踏襲 | 乖離 | 乖離（実装が null→空文字置換）／要実機確認 | `BuyOrderController.php:74` | RG-005,006 |  |
| a07-02 | 現行踏襲 | 乖離 | 乖離（401に本文あり） | `src/Eccube/EventListener/ExceptionListener.php:77` | RG-014 |  |
| a07-03 | 現行踏襲 | 乖離 | 乖離（Excelパスprefixが現行実装と不一致）／要実機確認 | `config/routes.yaml:17` | RG-019・§1 |  |
| a07-03 | 現行踏襲 | 乖離 | 乖離疑義（401/404が本文を持つ可能性）／実機再現で確定 | `src/Controller/BaseController.php:27, src/Controller/Admin/BuyOrderFreeCommentController.php:28` | RG-017 |  |
| a07-03 | 現行踏襲 | 乖離 | 軽微乖離（オラクル間の書式記述差・実装は両対応） | `src/Controller/Admin/BuyOrderFreeCommentController.php:31` | RG-018 |  |
| a07-03 | 現行踏襲 | その他 | 実装詳細（クレーム名はオラクル非記載・実装で `aud` 解決）／オラクル化しない | `src/Controller/BaseController.php:38` | RG-006・§1・§2 |  |
| a07-04 | 現行踏襲 | 乖離 | 乖離（Excelカスタマイズ未達・現行） | `src/Controller/Admin/BuyOrderStatusController.php:49` | RG-013,DT-11 |  |
| a07-04 | 現行踏襲 | 乖離 | 乖離疑義（文言・設計も踏襲のため要判断） | `BuyOrderStatusController.php:42, .../BuyOrderController.php:137` | RG-004,DT-09 |  |
| a07-04 | 現行踏襲 | 乖離 | 乖離（型チェック有無・設計沈黙）／要実機確認 | `.../BuyOrderController.php:134, BuyOrderStatusController.php:35` | RG-004 |  |
| a07-05 | 現行踏襲 | 乖離 | 乖離解消済み（743で廃止・仕様書鮮度） | `src/Controller/Admin/BuyOrderController.php:57` | §0 OUT |  |
| a07-05 | 現行踏襲 | 乖離 | 乖離（詳細設計L355の狭小化＝仕様書側の記述誤り／実装・ExcelはL1692側で一致） | `src/Controller/Admin/BuyOrderController.php:242` | RG-004・§1副作用 |  |
| a07-06 | 現行踏襲 | その他 | Excel `0507:L2064` `/api/admin/buyOrderIndivisualInputProduct.json` | `pf-api/config/routes.yaml:70` |  |  |
| a07-06 | 現行踏襲 | その他 | Excel `0507:L2087` `ids` 必須〇 | `pf-api/src/Controller/Admin/BuyOrderIndivisualInputProductController.php:23` |  |  |
| a07-06 | 現行踏襲 | その他 | Excel `0507:L2110` saleFlg 型＝文字列（true,false） | `pf-api/src/Entity/DtbBuyOrderIndivisualInputProduct.php:150` |  |  |
| a07-06 | 現行踏襲 | その他 | Excel `0507:L2065` 認証方式＝IP制限／トークン | `pf-api/src/Controller/BaseController.php:23` |  |  |
| a07-06 | 現行踏襲 | その他 | 詳細設計 `:328`（業務ルール・計算）「金額・税・ポイント・在庫数量の再計算は行わない／表示用の丸め・税計算・ポイント計算は本APIでは行わない」＝買取代表カード(buyMainCard)固有記述 | `—` |  |  |
| a07-06 | 現行踏襲 | その他 | Excel A07-06＝個別入力商品一覧（`buyOrderIndivisualInputProduct.json`／項目 buyOrderIndivisualInputProductId,name,price,cou | `routes.yaml:66` |  |  |
| a07-07 | 現行踏襲 | 乖離 | 乖離（認証例外の網羅不足・期限切れ/不正形式が401でなく500）／要実機確認 | `src/Controller/BaseController.php:30` | RG-006,007,008 |  |
| a07-07 | 現行踏襲 | 乖離 | 乖離疑義（content-type依存で常時0件になりうる・実機再現で確定）／要実機確認 | `src/Controller/Admin/BuyOrderIndivisualInputProductController.php:23` | RG-004(DP-04),RG-010 |  |
| a14-01 | 現行踏襲 | 乖離 | 乖離（設計間・命名規則）／要実機確認（実応答キーの実測が必要） | `pf-api/src/Entity/MtbCard.php:6` | RG-009 |  |
| a14-02 | 現行踏襲 | 乖離 | 乖離（設計文書間の不整合・詳細設計の更新漏れ）／要実機確認 | `—` | RG-007,019,030 |  |
| a14-02 | 現行踏襲 | 乖離 | 乖離（Excel内部の型/名称/書式の表記ゆれ）／要実機確認 | `—` | RG-008,009,019 |  |
| a14-03 | 現行踏襲 | 乖離 | 乖離（条件生成の不具合・`empty()` 判定であるべき箇所が `is_null()`）／要実機確認（空 name_jp/name_en 行の実在有無で顕在化） | `pf-api/src/Repository/MtbCardRepository.php:29` | RG-001,004（DV-01,DV-02） |  |
| a14-03 | 現行踏襲 | 乖離 | 乖離（入力デコードの二重適用・分割カード入力形の不成立）／要実機確認 | `pf-api/src/Repository/MtbCardRepository.php:28` | RG-002（DV-05） |  |
| a14-03 | 現行踏襲 | 乖離 | 乖離（レスポンス項目名の表記不整合・Excel項目名表 vs サンプル vs camelCase規約の三者不一致）／要実機確認（どの表記が正かをExcel改訂で確定する必要） | `pf-api/src/Repository/MtbCardRepository.php:99` | RG-008 |  |
| a14-03 | 現行踏襲 | 乖離 | 乖離（検索対象の内部結合により画像/カードセット未整備カードが404になる）／要実機確認 | `pf-api/src/Repository/MtbCardRepository.php:60` | RG-005,015 |  |
| a15-01 | 現行踏襲 | 乖離 | 乖離（設計内部矛盾・DB操作表の雛形誤適用）／要実機確認（設計修正候補） | `deck-api/src/Controller/LoginController.php:42` | RG-021 |  |
| a15-01 | 現行踏襲 | 乖離 | 乖離（設計内部矛盾・camelCase規約と応答実体の不一致）／要実機確認 | `deck-api/src/Controller/LoginController.php:68, deck-api/config/packages/fos_rest.yaml:16` | RG-019 |  |
| a15-01 | 現行踏襲 | 乖離 | 乖離（共通仕様との不整合・アルゴリズム固定/ソルト空フォールバック欠落）／要実機確認 | `deck-api/src/Controller/LoginController.php:52, ec-cube-enterprise/src/Eccube/Security/PasswordHasher/PasswordHasher.php` | RG-001,RG-012 |  |
| a15-01 | 現行踏襲 | 乖離 | 乖離（設計未確定・Cookie結合規則/属性の記述欠落。トークンCookieに HttpOnly/Secure 指定が無い点はセキュリティ観点で要確認）／要実機確認 | `deck-api/src/Controller/LoginController.php:96, deck-api/src/Service/AuthService.php:10, deck-api/src/Controller/LoginCo` | RG-003 |  |
| a15-02 | 現行踏襲 | 乖離 | 乖離（設計前提の欠落・トークン無期限＝セキュリティ影響）／要実機確認 | `deck-api/src/Service/AuthService.php:23, deck-api/src/Controller/LoginController.php:60, deck-api/src/Controller/BaseCon` | RG-016,015 |  |
| a15-02 | 現行踏襲 | 乖離 | 乖離候補（401/500の切り分けが設計で未確定）／要実機確認 | `deck-api/src/Controller/BaseController.php:68` | RG-006,013,014・DV-06 |  |
| a15-02 | 現行踏襲 | 乖離 | 乖離候補（設定の裏付け不在・本APIでは観測不能）／要実機確認 | `deck-api/config/packages/fos_rest.yaml:16, deck-api/config/packages/doctrine.yaml:31, deck-api/src/Controller/LoginContr` | RG-018 |  |
| a15-03 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・認証クレーム名の変更 aud→sub）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/GetUserAction.php:71, src/Eccube/Service/App/DeckBuilder/JwtPlayer` | RG-007,RG-013 |  |
| a15-03 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・失敗メッセージ文言のロケール依存化／文言消滅）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/UserController.php:59, src/Eccube/Resource/locale/messages.ja.y` | RG-006,RG-012 |  |
| a15-03 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・エンドポイントパス変更＋設計外のOPTIONS/CORS追加）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/UserController.php:43, deck-api/config/routes.yaml:9` | RG-001,RG-013,RG-022 |  |
| a15-03 | 現行踏襲 | 乖離 | 乖離（設計の400経路が現行の自分参照で到達不能＝設計過剰記述 or 実装欠落）／要実機確認 | `deck-api/src/Controller/CustomerController.php:45, src/Controller/BaseController.php:76, src/Controller/CustomerControll` | RG-011 |  |
| a15-03 | 現行踏襲 | その他 | \RuntimeException)`）と捕捉範囲が異なる。正本 L239/L256 の明示列挙は3種のみで期限切れ等を規定しない | `deck-api/src/Controller/BaseController.php:68, ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/GetUserAction.php:6` | **乖離（設計「検証できない=401」に対する現 |  |
| a15-03 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・論理削除プレイヤーの参照可否／設計は沈黙＝要仕様確定）／要実機確認 | `deck-api/src/Resources/config/doctrine/DtbPlayer.orm.yml:210, deck-api/config/packages/doctrine.yaml:42, src/Controller/` | RG-006(DV-03),RG-007 |  |
| a15-03 | 現行踏襲 | 乖離 | 乖離（内部差・customer_id のマッピング変更／設計L228「差分なし」は列名のみを指す）／要実機確認 | `deck-api/src/Resources/config/doctrine/DtbPlayer.orm.yml:95, ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:66, src/` | RG-007,RG-017,RG-026 |  |
| a15-04 | 現行踏襲 | 乖離 | 乖離（設計の確定漏れ・空文字の分岐仕様が未記述）／要実機確認（期待は断定しない） | `deck-api/src/Controller/CustomerController.php:43` | DV-04 |  |
| a15-04 | 現行踏襲 | 乖離 | 乖離（設計の確定漏れ・重複時の選択規則が未記述）／要実機確認 | `deck-api/src/Resources/config/doctrine/DtbPlayer.orm.yml:11, ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:114, dec` | DV-05 |  |
| a15-04 | 現行踏襲 | 乖離 | 乖離（設計記述と実装の入力源の差・内部差）／要実機確認 | `deck-api/src/Controller/CustomerController.php:43, deck-api/config/routes.yaml:9` | RG-007 |  |
| a15-05 | 現行踏襲 | その他 | `user_name` の空文字や最大長（255桁）の上限はコントローラでは判定せず、DB保存時の制約に委ねる（L266）＝空文字で入力不正(400)にしない。現行も null 判定のみ（`deck-api/src/Co | `ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/UserController.php:97` | $nicknameRaw === '')` →  |  |
| a15-05 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・対象特定キーの変更）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/UpdateUserAction.php:95` | RG-009,010（DV-11） |  |
| a15-05 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・成功メッセージの変更）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/UserController.php:134, ec-cube-enterprise/src/Eccube/Resource/` | RG-001,002 |  |
| a15-05 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・失敗メッセージの変更）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/UserController.php:86, ec-cube-enterprise/src/Eccube/Resource/l` | RG-007,008,020（DV-02,09, |  |
| a15-05 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・500の契機とメッセージの変更／保存失敗の未捕捉）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/UpdateUserAction.php:51, ec-cube-enterprise/src/Eccube/Controller/` | RG-013,020 |  |
| a15-05 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・トランザクション制御の欠落）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/UpdateUserAction.php:44` | RG-013,014 |  |
| a15-05 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・追加バリデーション／更新範囲の限定と実装の粒度差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/UserController.php:104, ec-cube-enterprise/src/Eccube/Service/A` | RG-006,015（DV-08） |  |
| a15-05 | 現行踏襲 | 乖離 | 乖離（パス変更／認証失敗網羅性の差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/UserController.php:78, deck-api/src/Controller/BaseController.p` | RG-007,008,024 |  |
| a15-06 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・サブテーブル取得の欠落）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/MasterController.php:100, deck-api/src/Repository/DtbCategoryRe` | RG-004・DV-03,DV-04 |  |
| a15-06 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・公開対象マスタの404化）／要実機確認 | `ec-cube-enterprise/.../MasterController.php:85, src/Eccube/Entity/Category.php:16, src/Eccube/Entity/Tag.php:14, deck-ap` | RG-004,RG-005・DV-03,DV-0 |  |
| a15-06 | 現行踏襲 | 乖離 | 乖離（入口パス差＋設計未記載のOPTIONS/CORS）／要実機確認 | `ec-cube-enterprise/.../MasterController.php:77` | RG-001,RG-014・§1入口 |  |
| a15-06 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・404メッセージのロケール依存化）／要実機確認 | `ec-cube-enterprise/.../MasterController.php:92, src/Eccube/Resource/locale/messages.ja.yaml:6309, messages.en.yaml:3869,` | RG-010,RG-011・DV-07〜10 |  |
| a15-06 | 現行踏襲 | 乖離 | 乖離（応答キー形式・日時形式・サンプルの公開項目誤り）／要実機確認 | `ec-cube-enterprise/.../MasterController.php:151, deck-api/config/packages/fos_rest.yaml:17, deck-api/src/Entity/MtbForma` | RG-007,RG-008 |  |
| a15-06 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・結果キャッシュの欠落）／要実機確認 | `ec-cube-enterprise/.../MasterController.php:99, deck-api/src/Repository/MtbFormatRepository.php:24, deck-api/src/Control` | RG-019,RG-029 |  |
| a15-06 | 現行踏襲 | 乖離 | 乖離（設計書の記載漏れ・現行にはある派生値）／要実機確認 | `ec-cube-enterprise/.../MasterController.php:109, deck-api/src/Entity/MtbCampaignTag.php:167` | RG-007 |  |
| a15-07 | 現行踏襲 | 乖離 | 乖離（正本記述と実装の入口URL不一致／現行踏襲差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/ArchetypeController.php:38` | RG-001,014,028 |  |
| a15-07 | 現行踏襲 | 乖離 | 乖離（設計未記載の入口/応答ヘッダ追加）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/ArchetypeController.php:41, .../AbstractDeckBuilderController.p` | RG-014,015,028 |  |
| a15-07 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・論理削除行の除外欠落の疑い）／要実機確認（SEED-ARC-DEL で確認） | `ec-cube-enterprise/src/Eccube/Entity/DtbArchetype.php:87, ec-cube-enterprise/src/Eccube/Repository/DtbArchetypeRepositor` | RG-002,013 |  |
| a15-08 | 現行踏襲 | 乖離 | 乖離（キャッシュキー不足によるページ／並び順の誤返却）／要実機確認 | `deck-api/src/Repository/MtbCardRepository.php:84` | RG-022,025,026,040 |  |
| a15-08 | 現行踏襲 | 乖離 | 乖離（キャッシュキーの値潰れによる別条件の結果返却）／要実機確認 | `deck-api/src/Repository/MtbCardRepository.php:149` | RG-012,015,016,017,018,0 |  |
| a15-08 | 現行踏襲 | 乖離 | 乖離（キャッシュキー不足による結合論理違いの誤返却）／要実機確認 | `deck-api/src/Repository/MtbCardRepository.php:97` | RG-005,006,007,008,013,0 |  |
| a15-08 | 現行踏襲 | 乖離 | 乖離（識別子を持たないカードで実在しない値0を返す）／要実機確認（設計側の非該当時表現の明記も必要） | `deck-api/src/Repository/MtbCardRepository.php:87` | RG-029 |  |
| a15-09 | 現行踏襲 | 乖離 | 乖離（必須/任意の記述不整合）／要実機確認 | `deck-api/src/Entity/DtbDeck.php:218, deck-api/src/Service/DeckService.php:212` | RG-033（DV-15）, RG-026 |  |
| a15-09 | 現行踏襲 | 乖離 | 乖離（必須/任意の記述不整合・区分値の未規定）／要実機確認 | `deck-api/src/Entity/DtbDeck.php:236, deck-api/src/Service/DeckService.php:212` | RG-033（DV-18）, RG-026 |  |
| a15-09 | 現行踏襲 | 乖離 | 乖離（必須/任意の記述不整合＋400/500の分岐差）／要実機確認 | `deck-api/src/Entity/DtbDeckCard.php:51, deck-api/src/Service/DeckService.php:140` | RG-025, RG-033（DV-19） |  |
| a15-09 | 現行踏襲 | その他 | 採用カードを受け取り、ボード区分ごとに採用カード・メイビー・アトラクション・ステッカーとして組み立てる（`a15-09_...html:242`）。ボードはメイン(1)・サイド(2)・統率領域(3)・メイビー(4)・アト | `deck-api/src/Service/DeckService.php:100` | ... === MtbBoard::ATTRAC |  |
| a15-09 | 現行踏襲 | 乖離 | 乖離（列名の記述不整合・軽微だがDB検証手順に影響）／要実機確認 | `ec-cube-enterprise/src/Eccube/Entity/DtbDeck.php:40` | RG-007, RG-038 |  |
| a15-09 | 現行踏襲 | 乖離 | 乖離（設計の副作用テーブル記載もれ）／要実機確認 | `ec-cube-enterprise/src/Eccube/Entity/DtbDeck.php:194, deck-api/src/Service/DeckService.php:173` | RG-013, RG-019, RG-020 |  |
| a15-10 | 現行踏襲 | 乖離 | 乖離（限定公開時に display_token が返らない疑い・更新APIのみキャスト欠落＝実装漏れ）／要実機確認 | `deck-api/src/Controller/DeckController.php:314, deck-api/src/Entity/MtbDisp.php:12, deck-api/src/Controller/DeckControll` | RG-004,035（§3 DV-03） |  |
| a15-10 | 現行踏襲 | 乖離 | 乖離（必須項目の検証欠落・400であるべき入力不正が500になる疑い）／要実機確認 | `deck-api/src/Controller/DeckController.php:314, deck-api/src/Service/DeckService.php:161, ec-cube-enterprise/src/Eccube/` | RG-014,036（§3 DV-08） |  |
| a15-10 | 現行踏襲 | 乖離 | 乖離（非公開(2)が private_flg に反映されない疑い＝公開範囲の表現が設計どおりでない）／要実機確認 | `deck-api/src/Service/DeckService.php:198, ec-cube-enterprise/src/Eccube/Entity/DtbDeck.php:87` | RG-027 |  |
| a15-10 | 現行踏襲 | その他 | 採用カードは「ボード区分ごとに採用カード・メイビー・アトラクション・ステッカーとして組み立て」る（同:268）／メイビーカード（`dtb_maybe_card`）・アトラクションカード（`dtb_attraction_c | `deck-api/src/Service/DeckService.php:100` | ... === MtbBoard::ATTRAC |  |
| a15-10 | 現行踏襲 | 乖離 | 乖離（設計の受領形式（フォーム）と呼び出し元の送信形式（JSON）が不一致の疑い＝ボディが空で受領される可能性）／要実機確認 | `deck-api/src/Controller/DeckController.php:287` | RG-033 |  |
| a15-10 | 現行踏襲 | 乖離 | 乖離（既定値の所在が設計と実装で不一致・環境依存）／要実機確認 | `deck-api/src/Service/DeckService.php:256, deck-api/config/services.yaml:14` | RG-021 |  |
| a15-11 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・成功メッセージ literal の変更／ロケール依存化）／要実機確認 | `deck-api/src/Controller/DeckController.php:158, ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.` | RG-002,003 |  |
| a15-11 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・404メッセージ literal の変更）／要実機確認 | `deck-api/src/Controller/DeckController.php:135, ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.` | RG-007,008 |  |
| a15-11 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・JWTクレームが aud→sub へ変質。現行発行トークンでの認証互換が切れる可能性）／要実機確認 | `deck-api/src/Controller/BaseController.php:69, ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/JwtPlayerAuthentica` | RG-011 |  |
| a15-11 | 現行踏襲 | その他 | PlayerNotFoundException`・`DeckAccessDeniedException`・`DeckNotFoundException` のみ捕捉し、`DeckService::deleteDeck` が再送出する例外（`ec-cube-ent | `deck-api/src/Controller/DeckController.php:149, BaseController.php:97` | **乖離（現行踏襲違反・500応答本文の形が非保 |  |
| a15-11 | 現行踏襲 | 乖離 | 乖離（入口パスの差／設計に無い OPTIONS 応答の追加）／要実機確認 | `deck-api/config/routes.yaml:37, ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:177` | RG-028 |  |
| a15-11 | 現行踏襲 | 乖離 | 乖離（削除済みデッキが「検索・参照の対象から外れる」規定と不整合・再削除で deleted_at 上書き）／要実機確認 | `deck-api/src/Controller/DeckController.php:134, ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/DeleteDeckAction.p` | RG-020／DV-08 |  |
| a15-11 | 現行踏襲 | 乖離 | 乖離（トランザクション規定と実態の不一致・失敗時の下書き喪失）／要実機確認 | `deck-api/src/Service/DeckService.php:277, ec-cube-enterprise/src/Eccube/Service/DeckService.php:281` | RG-017 |  |
| a15-11 | 現行踏襲 | その他 | \RuntimeException` を捕捉して 401 化（`ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/JwtPlayerAuthenticator.php:42-49`） | `deck-api/src/Controller/BaseController.php:68, DeckController.php:149` | **乖離（現行のトークン不正形式時の応答が401 |  |
| a15-11 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・401メッセージの割当変更）／要実機確認 | `deck-api/src/Controller/BaseController.php:81, ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.p` | RG-011 |  |
| a15-12 | 現行踏襲 | 乖離 | 乖離（scope_id組み立ての欠落・公開範囲判定の齟齬）／要実機確認 | `—` | RG-028, RG-002(DS) |  |
| a15-12 | 現行踏襲 | 乖離 | 乖離（非公開フラグ時の cards 欠落・応答契約違反）／要実機確認 | `—` | RG-018, RG-019 |  |
| a15-12 | 現行踏襲 | 乖離 | 乖離（論理削除デッキの除外なし・検索系との不整合／設計の記述欠落）／要実機確認 | `—` | RG-029 |  |
| a15-12 | 現行踏襲 | 乖離 | 乖離（応答フィールドのELSE値が削除日時・型/意味の逸脱）／要実機確認 | `—` | RG-014, RG-015 |  |
| a15-12 | 現行踏襲 | 乖離 | 乖離（下書きあり×DB該当なし時の未定義動作／設計の記述欠落）／要実機確認 | `—` | RG-003(DS-13〜17), RG-020 |  |
| a15-13 | 現行踏襲 | 乖離 | 乖離（開催中/開催前の判定誤り・is_during が設計の3状態を正しく表さない）／要実機確認 | `deck-api/src/Repository/DtbDeckRepository.php:670, deck-api/src/Entity/MtbCampaignTag.php:14` | RG-043 |  |
| a15-13 | 現行踏襲 | 乖離 | 乖離（DQL連結不備・private検索の成否に影響しうる）／要実機確認 | `deck-api/src/Repository/DtbDeckRepository.php:509, deck-api/src/Entity/MtbDisp.php:12` | RG-002,041 |  |
| a15-13 | 現行踏襲 | その他 | sortNo" deck-api/src` は別リポジトリの tag/category のみ該当）、`sort_no` 列は移行先 `ec-cube-enterprise/src/Eccube/Entity/Master/MtbCampaignTag.php: | `deck-api/src/Repository/DtbDeckRepository.php:469` | **乖離（キャンペーンタグ並び順が設計記述どおり |  |
| a15-13 | 現行踏襲 | 乖離 | 乖離（認証失敗の一部が設計の401にならない可能性）／要実機確認 | `deck-api/src/Controller/BaseController.php:68` | RG-003,004,005,044 |  |
| a15-13 | 現行踏襲 | 乖離 | 乖離（タグ配列の id と名称の対応が崩れうる）／要実機確認 | `deck-api/src/Repository/DtbDeckRepository.php:466, ec-cube-enterprise/src/Eccube/Entity/Master/MtbCampaignTag.php:36` | RG-042,043 |  |
| a15-14 | 現行踏襲 | 乖離 | 乖離（現行の型不整合・下限境界が設計どおり効かない可能性）／要実機確認 | `deck-api/src/Repository/DtbDeckRepository.php:760, ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:528` | RG-008(DV-01,DV-02) |  |
| a15-15 | 現行踏襲 | 乖離 | 乖離（絞り込み条件の迂回＝集計結果の誤り）／要実機確認 | `deck-api/src/Repository/DtbDeckRepository.php:124, ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:1084` | RG-012（DV-05併用） |  |
| a15-15 | 現行踏襲 | 乖離 | 乖離（参照時点の規定と結果キャッシュの不整合・設計未記載）／要実機確認 | `deck-api/src/Repository/DtbDeckRepository.php:196` | RG-036 |  |
| a15-15 | 現行踏襲 | 乖離 | 乖離（該当なし時のnull規定違反・別言語URLの混入）／要実機確認 | `deck-api/src/Repository/DtbDeckRepository.php:148` | RG-023 |  |
| a15-15 | 現行踏襲 | 乖離 | 乖離（設計のDBカラム表に参照テーブルの欠落・テスト前提データの取りこぼし要因）／要実機確認 | `deck-api/src/Repository/DtbDeckRepository.php:172` | RG-013,014,023,031 |  |
| a15-16 | 現行踏襲 | 乖離 | 乖離（設計の抽出条件に無い暗黙除外＝設計記述漏れ疑い）／要実機確認 | `deck-api/src/Repository/MtbLatestEventDeckRepository.php:29, ec-cube-enterprise/src/Eccube/Repository/Master/MtbLatestEv` | RG-004・§3 DV-07 |  |
| a15-16 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・設計未記載のOPTIONS/CORS）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:643` | RG-001,007 |  |
| a15-16 | 現行踏襲 | 乖離 | 乖離（内部差・エンドポイントパス）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:643` | RG-001 |  |
| a15-16 | 現行踏襲 | 乖離 | 乖離（設計の型規定と実データの整合・null返却の可能性）／要実機確認 | `deck-api/src/Resources/config/doctrine/MtbLatestEventDeck.orm.yml:43` | RG-010 |  |
| a15-16 | 現行踏襲 | 乖離 | 乖離ではない（設計沈黙・現行踏襲は保たれる）／TTLは要実機確認 | `deck-api/src/Repository/MtbLatestEventDeckRepository.php:15, ec-cube-enterprise/src/Eccube/Repository/Master/MtbLatestEv` | RG-015 |  |
| a15-17 | 現行踏襲 | 乖離 | 乖離（設計に無い404・現行踏襲差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/ImportDeckAction.php:87, ec-cube-enterprise/src/Eccube/Controller/` | RG-015・DV-06 |  |
| a15-17 | 現行踏襲 | 乖離 | 乖離（入口パス・許容メソッドの差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:667` | §1（入口） |  |
| a15-17 | 現行踏襲 | 乖離 | 乖離（設計記述と実データモデルの不一致・公開区分の保持先）／要実機確認 | `ec-cube-enterprise/src/Eccube/Entity/DtbDeck.php:87, deck-api/src/Service/DeckService.php:187` | RG-034 |  |
| a15-17 | 現行踏襲 | 乖離 | 乖離（任意項目の未指定時挙動が設計と不整合）／要実機確認 | `deck-api/src/Controller/DeckController.php:419, ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.` | RG-013,026 |  |
| a15-17 | 現行踏襲 | 乖離 | 乖離（設計の過大記載・マスタ更新の事実なし）／要実機確認 | `deck-api/src/Controller/DeckController.php:396, ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/ImportDeckAction.p` | RG-028 |  |
| a15-17 | 現行踏襲 | 乖離 | 乖離（500応答本文の形・例外メッセージ欠落）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/ImportDeckAction.php:149, ec-cube-enterprise/src/Eccube/Controller` | RG-016,022 |  |
| a15-18 | 現行踏襲 | 乖離 | 乖離（設計=0始まり vs 実装=1始まり／呼び出し元のエラー行ハイライトが1行ずれる）／要実機確認 | `deck-api/src/Util/CardUtil.php:64, deck-api/src/Util/CardUtil.php:133, ec-cube-enterprise/src/Eccube/Util/CardUtil.php:7` | RG-011（期待はオラクル=0始まり） |  |
| a15-18 | 現行踏襲 | その他 | PlayerNotFoundException`(:698)・`DeckAccessDeniedException`(:703)・`DeckNotFoundException`(:708)・`FormatNotFoundException`(:713)・`In | `ec-cube-enterprise/.../ImportDeckAction.php:149, ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController` | **乖離（移行先の実装漏れ／500時の本文形が設 |  |
| a15-18 | 現行踏襲 | 乖離 | 乖離（設計の失敗表に無い404／要実機確認） | `ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:713` | RG-005,DV-06 |  |
| a15-18 | 現行踏襲 | 乖離 | 乖離（文言がロケール依存・設計は固定文言を規定）／要実機確認 | `ec-cube-enterprise/.../DeckController.php:684, ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3881, mess` | RG-009,010 |  |
| a15-18 | 現行踏襲 | 乖離 | 乖離（トークン不正の一部が401にならない／設計は「署名不正」以外の不正形式に沈黙＝要実機確認） | `deck-api/src/Controller/BaseController.php:68` | RG-002,003 |  |
| a15-18 | 現行踏襲 | その他 | 影響 | `—` |  |  |
| a16-01 | 現行踏襲 | 乖離 | 乖離（詳細設計の記述誤り・Excel+実装がsnake_case）／要実機確認 | `pf-api/src/Entity/MtbTopBanner.php:6, pf-api/src/Entity/MtbLanguage.php:6, pf-api/config/packages/fos_rest.yaml:16` | RG-002 |  |
| a16-01 | 現行踏襲 | 乖離 | 乖離（詳細設計サンプルの記述誤り・Excel+実マスタが正） | `ec-cube-enterprise/app/DoctrineMigrations/Version20251125143744.php:63, pf-api/src/Resources/config/doctrine/MtbLanguage` | RG-002,003 |  |
| a16-01 | 現行踏襲 | 乖離 | 乖離（必須・型の入力検証なし）／要実機確認 | `pf-api/config/routes.yaml:156, pf-api/src/Controller/BannerController.php:20` | RG-008（DP-04,05） |  |
| a16-01 | 現行踏襲 | 乖離 | 乖離（並び順が設計・実装とも未定義）／要実機確認 | `pf-api/src/Resources/config/doctrine/MtbTopBanner.orm.yml:38, ec-cube-enterprise/src/Eccube/Entity/Master/MtbLanguage.ph` | RG-003 |  |
| a16-01 | 現行踏襲 | 乖離 | 乖離（Excel記述の誤り・軽微） | `pf-api/config/routes.yaml:157` | RG-006,008 |  |
| a16-02 | 現行踏襲 | 乖離 | 乖離（詳細設計の記述誤り・Excel優先で不採用）／詳細設計HTMLの是正が必要 | `pf-api/src/Entity/MtbTopBanner.php:24, ec-cube-enterprise/src/Eccube/Service/App/Content/TopBannerResponseBuilder.php:43` | RG-002,003,004 |  |
| a16-02 | 現行踏襲 | 乖離 | 乖離（現行実装がExcel 404条件と不一致・詳細設計も自己矛盾）／要実機確認 | `pf-api/src/Controller/BannerController.php:50, ec-cube-enterprise/src/Eccube/Controller/App/ContentController.php:95` | RG-010（DV-03） |  |
| a16-02 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・「設定済み」絞り込みの消失＝非表示バナー露出）／要実機確認 | `pf-api/src/Repository/MtbTopBannerRepository.php:20, ec-cube-enterprise/src/Eccube/Controller/App/ContentController.php:` | RG-021（SEED-TB-HIDDEN/SE |  |
| a16-02 | 現行踏襲 | 乖離 | 乖離（Excel メソッド規定違反・.jsonルートのGET非限定）／要実機確認 | `pf-api/config/routes.yaml:160, ec-cube-enterprise/src/Eccube/Controller/App/ContentController.php:86` | RG-013 |  |
| a16-02 | 現行踏襲 | 乖離 | 乖離（仕様欠落＋現行踏襲違反・並び順の非決定化）／要実機確認・設計への並び順追記が必要 | `pf-api/src/Repository/MtbTopBannerRepository.php:28, ec-cube-enterprise/src/Eccube/Controller/App/ContentController.php:` | RG-020 |  |
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
| a17-04 | 現行踏襲 | 乖離 | 乖離（詳細設計の記述欠落・入口パスの二重定義）／要実機確認（現行の`/api`付与箇所） | `pf-api/config/routes.yaml:231, ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:50` | RG-002,023 |  |
| a17-04 | 現行踏襲 | 乖離 | 乖離（詳細設計の型記述誤り。期待はExcel＝文字列を採用）／要実機確認 | `pf-api/src/Repository/DtbProductRepository.php:335, pf-api/src/Controller/ProductController.php:448, ec-cube-enterprise/` | RG-014 |  |
| a17-04 | 現行踏襲 | 乖離 | 乖離（Excel必須規定と実装・詳細設計の不一致。未指定時の応答は断定せず要実機確認） | `pf-api/src/Controller/ProductController.php:400, ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:54` | RG-021, DV-06 |  |
| a17-04 | 現行踏襲 | 乖離 | 乖離（Excel項目表の型・説明誤り。期待はExcelサンプル＝名称文字列を採用）／要実機確認 | `pf-api/src/Controller/ProductController.php:430, ec-cube-enterprise/.../ProductDetailResponseBuilder.php:57` | RG-016 |  |
| a17-04 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・言語絞り込みの欠落＝誤データ応答）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:301, ec-cube-enterprise/.../ProductDetailResponseBuilder.` | RG-020, RG-001 |  |
| a17-04 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・非公開/削除商品の露出／設計の抽出条件記述欠落）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:297` | RG-001,004,034 |  |
| a17-04 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・NM判定基準の変質＝表示規格の増減）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:275, ec-cube-enterprise/.../ProductDetailResponseBuilder.` | RG-007, DV-01〜04 |  |
| a17-05 | 現行踏襲 | 乖離 | 乖離（Excel全件 vs 実装100/410件上限）／要実機確認 | `src/Controller/ProductController.php:373, src/Repository/DtbProductSubClassRepository.php:391` | RG-006 |  |
| a17-05 | 現行踏襲 | 乖離 | 乖離（実装バグ・100番目商品の規格欠落）／要実機確認 | `ProductController.php:373` | RG-006 |  |
| a17-05 | 現行踏襲 | その他 | その他コンディション表示不可時は「良品(NM)の規格のみに絞る」（詳細設計 L325,L328） | `ProductController.php:590` | !is_null($product['high_ |  |
| a17-05 | 現行踏襲 | 乖離 | 乖離（実装バグ・死コード/意図不整合）／要実機確認 | `ProductController.php:558` | RG-005 |  |
| a17-05 | 現行踏襲 | 乖離 | 乖離（異常系500の明示規定なし・Excelと詳細設計/実装で異常コードの網羅が不一致）／要実機確認 | `ProductController.php:310` | RG-010,013 |  |
| a17-05 | 現行踏襲 | 乖離 | 乖離（Excel応答説明の誤記・実装は正） | `ProductController.php:349` | RG-008 |  |
| a17-05 | 現行踏襲 | 乖離 | 乖離（Excelスキーマ表 count vs サンプル/詳細設計 code の内部矛盾・count フィールド有無=要実機確認） | `—` | RG-008 |  |
| b02-01 | カスタマイズ | 乖離 | 乖離（現行挙動との差・除外条件の欠落）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:429, pf-eccube3/app/Plugin/HareruyaEc/Repository` | RG-015 |  |
| b02-01 | カスタマイズ | 乖離 | 乖離（詳細設計の記述誤り＝設計書側の要修正）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:106` | RG-016 |  |
| b02-01 | カスタマイズ | 乖離 | 乖離（コマンド名変更・設計書/ジョブ設定との不整合）／要実機確認 | `ec-cube-enterprise/src/Eccube/Command/AggregateSalesCommand.php:33, pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatc` | RG-001,RG-002 |  |
| b02-01 | カスタマイズ | 乖離 | 乖離（失敗時の反映粒度の差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateSalesAction.php:42, pf-eccube3/app/Plugin/HareruyaEc/Service` | RG-020,RG-021 |  |
| b02-01 | カスタマイズ | 乖離 | 乖離（処理方式の差・長時間/大量件数時のメモリ挙動が未担保）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateSalesAction.php:37, pf-eccube3/app/Plugin/HareruyaEc/Service` | RG-023,RG-024 |  |
| b02-01 | カスタマイズ | 乖離 | 乖離（設計に無い一括削除・非更新前提との不整合）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:93, BatchAggregateSalesAction.php:46` | RG-018 |  |
| b02-01 | カスタマイズ | 乖離 | 乖離（本店の支店ID表現の差・ID0の用途競合）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:39, ec-cube-enterprise/src/Eccube/Entity/BaseInf` | RG-011 |  |
| b02-01 | カスタマイズ | 乖離 | 乖離（期間境界の粒度差・現行挙動との差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:440, pf-eccube3/app/Plugin/HareruyaEc/Repository` | RG-007(DP-09) |  |
| b02-01 | カスタマイズ | 乖離 | 乖離（設計に無い集計キー・明細限定）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:446` | RG-010,RG-012 |  |
| b02-02 | カスタマイズ | 乖離 | 乖離（現行踏襲違反・条件の脱落）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/DtbProductRequestRepository.php:481` | RG-006, RG-004(DV-07) |  |
| b02-02 | カスタマイズ | 乖離 | 乖離（起動I/Fの変更・運用影響）／要実機確認 | `ec-cube-enterprise/src/Eccube/Command/CancelProductRequestCommand.php:32` | RG-016, RG-018, RG-021 |  |
| b02-02 | カスタマイズ | 乖離 | 乖離（現行踏襲差・ログ欠落）／要実機確認 | `ec-cube-enterprise/src/Eccube/Command/CancelProductRequestCommand.php:55` | RG-022 |  |
| b02-03 | カスタマイズ | 乖離 | 乖離（カスタマイズ未達・買取欠落） | `src/Eccube/Repository/DtbStockUpQuantityRepository.php:150, src/Eccube/Entity/Master/MtbStockChangeType.php:27, app/Plug` | RG-003,016 |  |
| b02-03 | カスタマイズ | 乖離 | 乖離（在庫区分次元欠落・閉店除外は仕様外） | `DtbStockUpQuantityRepository.php:159` | RG-005,009 |  |
| b02-03 | カスタマイズ | 乖離 | 乖離（期間区分の構成差）／要実機確認 | `DtbStockUpQuantityRepository.php:148` | RG-006,007,008 |  |
| b02-03 | カスタマイズ | 乖離 | 乖離（全件DELETEでのデータ消失懸念）／要実機確認 | `src/Eccube/Service/Product/BatchAggregateStockUpAction.php:38, DtbStockUpQuantityRepository.php:97` | RG-010,011,012 |  |
| b02-03 | カスタマイズ | 乖離 | 乖離（詳細設計の記述と実装差） | `src/Eccube/Service/Product/BatchAggregateStockUpAction.php:35` | §5 排他制御 要判定 |  |
| b02-03 | カスタマイズ | 乖離 | 乖離（詳細設計の誤記・オラクルはExcel「更新/新規登録」） | `DtbStockUpQuantityRepository.php:97, UpdateProductSummaryForStockUp.php:33` | RG-015 |  |
| b02-03 | カスタマイズ | その他 | — | `—` | — |  |
| b02-04 | 現行踏襲 | 乖離 | 乖離（10,000件上限の解釈差・分割送信）／要実機確認 | `app/Plugin/HareruyaEc/Service/Product/CheckNoSectionProduct.php:9` | RG-009(DB-04),010 |  |
| b02-05 | 現行踏襲 | 乖離 | 乖離（現行の集約が2件目以降で成立しない恐れ）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Service/Product/SaleNotificationService.php:34, DtbFavoriteProductRepository.php:53, ec` | RG-008,009,019 |  |
| b02-05 | 現行踏襲 | 乖離 | 乖離（設計の副作用/DB操作記述と実装の不一致）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Service/MailService.php:1275, ec-cube-enterprise/src/Eccube/Service/MailService.php:182` | RG-016,017 |  |
| b02-05 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・起動コマンド名／不正コマンド時出力）／要実機確認 | `ec-cube-enterprise/src/Eccube/Command/FavoriteSaleNotificationCommand.php:34` | RG-001,002,003 |  |
| b02-05 | 現行踏襲 | 乖離 | 乖離（Excel内部不整合・起動頻度未確定）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Command/ProductBatch.php:28, ec-cube-enterprise/src/Eccube/Command/FavoriteSaleNotifica` | RG-031 |  |
| b02-05 | 現行踏襲 | 乖離 | 乖離（住所ではなく都道府県=海外での判定・未設定時の既定挙動が設計に無い）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Service/MailService.php:1253, pf-eccube3/app/Plugin/HareruyaEc/Entity/MailTemplate.php:` | RG-010,011,012 |  |
| b02-06 | カスタマイズ | 乖離 | 乖離（設計間の機能区分記述の不一致・オラクル選択には影響なし）／要実機確認 | `—` | 全般（§ヘッダ） |  |
| b02-06 | カスタマイズ | 乖離 | 乖離（引数不足が成功扱い・運用検知不能）／要実機確認 | `InsertStockHistory.php:34, ProductBatch.php:56` | RG-002,003,020 |  |
| b02-06 | カスタマイズ | 乖離 | 乖離（確定手段がネイティブINSERT・設計はpersist/flushと記述）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbStockHistoryRepository.php:63, InsertStockHistory.php:71` | RG-026,022 |  |
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
| b06-02 | カスタマイズ | 乖離 | 乖離（pf-eccube3 実装バグ・引数指定時に集計日決定が破綻／enterprise で是正）／要実機確認 | `app/Plugin/HareruyaEc/Service/OtcBuyOrder/SummaryService.php:41, src/Eccube/Repository/DtbOtcBuyOrderRepository.php:827` | RG-001 |  |
| b06-02 | カスタマイズ | 乖離 | 乖離（pf-eccube3 実装バグ・例外後の無条件commit／enterprise で是正）／要実機確認 | `SummaryService.php:32, src/Eccube/Service/Admin/OtcBuyOrder/BatchAggregateSummaryAction.php:54` | RG-010 |  |
| b06-02 | カスタマイズ | 乖離 | 乖離（詳細設計HTMLの記述誤り・DB操作を検索のみと誤記／実装はDML実行・Excelと矛盾） | `SummaryService.php:49, DtbOtcBuyOrderSummaryRepository.php:92` | RG-017 |  |
| b08-01 | 現行踏襲 | 乖離 | 乖離（実装バグ・重大／全員送信未達） | `app/Plugin/HareruyaEc/Service/Customer/SendAccountMigration.php:44` | RG-001,011,004 |  |
| b08-01 | 現行踏襲 | 乖離 | 乖離（実装バグ懸念・本文全文と不一致）／要実機確認 | `MailService.php:929` | RG-015 |  |
| b08-01 | 現行踏襲 | 乖離 | 乖離（設計記述と実装の粒度差）／要実機確認 | `MailService.php:930` | RG-016 |  |
| b08-01 | 現行踏襲 | 乖離 | 乖離（詳細設計HTMLの記述誤り・Excelと実装が一致） | `MailService.php:923` | RG-012 |  |
| b08-01 | 現行踏襲 | 乖離 | 乖離（未使用コード残存・実害小） | `SendAccountMigration.php:10` | — |  |
| b08-01 | 現行踏襲 | 乖離 | 乖離（設定値依存・L980の固定値規定と実装取得元が不一致になり得る）／要実機確認 | `app/Plugin/HareruyaEc/Service/MailService.php:912` | RG-007 |  |
| b08-02 | 現行踏襲 | その他 | スマレジ連携失敗＝タイムアウト または レスポンスステータスが失敗扱い（Excel L1230） | `LostPoints.php:46` | !array_key_exists('resul |  |
| b08-02 | 現行踏襲 | 乖離 | 乖離（enterpriseで流量制御欠落・要実機確認） | `LostPoints.php:41, LostPointsAction.php:52` | RG-014 |  |
| b08-02 | 現行踏襲 | 乖離 | 乖離疑義（限定条件・要実機確認） | `app/Plugin/HareruyaEc/Repository/DtbPointHistoryRepository.php:38, src/Eccube/Repository/DtbPointHistoryRepository.php:2` | RG-002／§5 要判定 |  |
| b08-03 | 現行踏襲 | 乖離 | 乖離（送信エラーのコンソール非出力・握り潰し） | `src/Eccube/Service/MailService.php:1121, PointExpireNotificationCommand.php:42` | RG-014 |  |
| b08-03 | 現行踏襲 | 乖離 | 乖離（設計未記載のsmaregi_id必須抽出・通知漏れ）／要実機確認 | `src/Eccube/Repository/DtbPointHistoryRepository.php:328` | RG-003〜006 |  |
| b08-03 | 現行踏襲 | 乖離 | 乖離疑義（送信元がテンプレ非依存の運用設定値）／要実機確認 | `app/Plugin/HareruyaEc/Service/MailService.php:1144, src/Eccube/Service/MailService.php:1113` | RG-009 |  |
| b08-04 | 現行踏襲 | 乖離 | 乖離疑義（宛先未設定時の無言非送信・宛先設定は別範囲）／要実機確認 | `...MailService.php:1490, ...MailService.php:1275` | RG-001 |  |
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
| f01-01 | カスタマイズ | 乖離 | 乖離（対象タグの取り違え疑い）／要実機確認（mtb/dtb タグマスタの id=2 の名称を確認） | `ec-cube-enterprise/src/Eccube/Service/Block/RestockedBlockPayloadBuilder.php:50, ec-cube-enterprise/src/Eccube/Entity/Ta` | RG-040, RG-016(DV-05) |  |
| f01-01 | カスタマイズ | 乖離 | 乖離（Excelに無い限定の追加）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/CustomerFavoriteProductRepository.php:120` | RG-017, RG-024, §3 DV-06 |  |
| f01-01 | カスタマイズ | 乖離 | 乖離（タグ指定方式の差・設定値依存）／要実機確認（MtbOption SLIDER_EN_ONLY_TAG_ID の設定値が「Trending Now」タグIDか） | `ec-cube-enterprise/src/Eccube/Service/Block/NewItemsBlockPayloadBuilder.php:59, pf-eccube3/app/Plugin/HareruyaEc/Control` | RG-020, RG-016(DV-02) |  |
| f01-01 | カスタマイズ | 乖離 | 乖離（参照先未確定・実装側TODOで404を自認）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Block/LatestArticlesBlockPayloadBuilder.php:27, HareruyaChannelBlockPayloadBuilder` | RG-046 |  |
| f01-01 | カスタマイズ | 乖離 | 乖離（Excel=非表示 vs 詳細設計=0件描画の競合・Excel優先で解決済み）／要実機確認（0件時に見出し枠が残るか） | `—` | RG-018 |  |
| f01-02 | カスタマイズ | 乖離 | 乖離（文言不一致）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1268, Block/shop_order_method.twig:23` | RG-003,004 |  |
| f01-02 | カスタマイズ | 乖離 | 乖離（PC版限定の未反映）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recruit.twig:11` | RG-048 |  |
| f01-02 | カスタマイズ | 乖離 | 乖離（遷移先URL未設定）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:18` | RG-044 |  |
| f01-02 | カスタマイズ | 乖離 | 乖離（判定経路差・Player未設定時の取りこぼし）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Shop/ShopTopController.php:177, src/Eccube/Entity/DtbCustomerGroup.php:100` | RG-002,047 |  |
| f01-02 | カスタマイズ | 乖離 | 乖離（支店別公開ステータスの粒度差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:401, src/Eccube/Repository/DtbSalesQuantityRepository.php` | RG-012,033 |  |
| f01-02 | カスタマイズ | 乖離 | 乖離（設計書の対象画面不一致・入口URL差）／要実機確認（詳細設計HTMLの是正要否を含む） | `pf-eccube3/app/Plugin/HareruyaEc/Controller/ShopPageController.php:20, pf-eccube3/app/Plugin/HareruyaEc/ControllerProvid` | RG-007,049,050／§0・§5（右カラ |  |
| f02-01 | カスタマイズ | その他 | trans : 'front.nav.lang.en' | `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/header.twig:100` | trans %}`）／同 `header.en. |  |
| f02-01 | カスタマイズ | 乖離 | 乖離（カスタマイズ要件の適用範囲不足）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/header.twig:164, header.en.twig:137` | RG-054 |  |
| f02-01 | カスタマイズ | 乖離 | 乖離（並び順の保証欠落）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/cart.twig:38` | RG-042 |  |
| f02-01 | カスタマイズ | 乖離 | 乖離（条件数表示の実装確証なし）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/header.twig:145, pf-eccube3/app/Plugin/HareruyaEc/Resource` | RG-026 |  |
| f02-01 | カスタマイズ | 乖離 | 乖離（買取画面での言語切替欠落）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/header.twig:96` | RG-016,RG-017 |  |
| f02-01 | カスタマイズ | その他 | 確認事項（カスタマイズ要件の実装先は移行先側／現行踏襲ではない） | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/ec_header_unisuggest.twig:9, base_header.twig:51, ec-cu` | RG-021,036,041,054 |  |
| f02-01 | カスタマイズ | 乖離 | 乖離（詳細設計HTMLのナビ項目一覧がExcelと不一致・Excel優先で解決）／設計書是正が必要 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/ec_navigator.twig:4, ec-cube-enterprise/src/Eccube/Reso` | RG-014,RG-015 |  |
| f02-02 | カスタマイズ | 乖離 | 乖離（詳細設計の記述がExcelカスタマイズ要件と競合・Excelが正）／詳細設計HTMLの更新要 | `pf-eccube3/.../base_sp_navigator.twig:5` | RG-020,022〜024 |  |
| f02-02 | カスタマイズ | 乖離 | 乖離（DBカラム節がExcel参照要件を落としている・Excelが正）／参照先テーブル・列の設計追記要（DBの正はenterprise） | `pf-eccube3/.../base_sp_navigator.twig:27` | RG-007,013,018,021 |  |
| f02-02 | カスタマイズ | 乖離 | 乖離（en版の項目構成をExcelが規定せず＝要判定）／要実機確認・Excel追記要 | `pf-eccube3/.../base_sp_navigator.en.twig:8, base_sp_navigator.twig:8` | RG-038 |  |
| f02-02 | カスタマイズ | その他 | sp_navigator\ | `—` | cardNameBoxSp" --include |  |
| f02-03 | カスタマイズ | 乖離 | 乖離の疑い（遷移先が支店ECTOPである保証がテンプレートに無い）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_header.twig:16, ec-cube-enterprise/src/Eccube/Resou` | RG-004,005 |  |
| f02-03 | カスタマイズ | 乖離 | 乖離（並び順キーが追加日時でない）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Cart/CartHeaderViewService.php:41` | RG-020 |  |
| f02-03 | カスタマイズ | 乖離 | 乖離（支店別の送料無料条件が反映されない）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Cart/CartHeaderViewService.php:57` | RG-022（DV-06〜08,DV-10） |  |
| f02-03 | カスタマイズ | 乖離 | 乖離（Excel記述と実装の遷移先不一致・Excel側の記述誤りの可能性含む）／設計要確認・要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_footer.twig:29` | RG-046 |  |
| f02-04 | カスタマイズ | その他 | カードセット\ | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/base_sp_navigator.twig:25` | 通販サイト" pf-eccube3/app/Pl |  |
| f02-04 | カスタマイズ | 乖離 | 乖離（Excel設計書の記載誤り・機能取り違え）／要文書修正 | `—` | 全般（§1） |  |
| f02-04 | カスタマイズ | 乖離 | 乖離（Excel設計書の記載誤り・範囲表記(13-4)が過剰）／要文書修正 | `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_footer.twig:51` | RG-025 |  |
| f02-04 | カスタマイズ | 乖離 | 乖離（遷移先の不一致・Excel記載誤りの疑い）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_footer.twig:29, ec-cube-enterprise/src/Eccube/Resou` | RG-022 |  |
| f02-04 | カスタマイズ | その他 | url_encode : '' %}`）・`:80`（未設定なら fallback を採用）・`:81-82`（http(s) 以外は fallback へ差し戻し）。またDB列コメントは「Google map埋め込みURL」（`ec-cube-enterpr | `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_footer.twig:79` | **乖離（Excelに無い実装挙動＝仕様追加／埋 |  |
| f02-04 | カスタマイズ | 乖離 | 乖離（設計の沈黙・実装先行）／要仕様確定＋要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_header.twig:30, branch_footer.twig:86` | RG-003, RG-035 |  |
| f03-01 | カスタマイズ | 乖離 | 乖離（Excel記載のURL表記差・SEO正準URLに影響）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:141, pf-eccube3/app/Plugin/HareruyaEc/ControllerPro` | RG-018 |  |
| f03-01 | カスタマイズ | 乖離 | 乖離（副作用の欠落・検索負荷の検知が失われる）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Front/ProductSearchTrait.php:59, pf-eccube3/app/Plugin/HareruyaEc/Controller/Pr` | RG-049 |  |
| f03-01 | カスタマイズ | 乖離 | 乖離（上限の保持先差・既定フォールバック値の不一致）／要実機確認 | `ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:396, ec-cube-enterprise/src/Eccube/Controller/Front/ProductSea` | RG-005,007,049 |  |
| f03-02 | カスタマイズ | 乖離 | 乖離（★カスタマイズ「価格降順」未反映）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/default/Product/detail.twig:263` | RG-013 |  |
| f03-02 | カスタマイズ | 乖離 | 乖離（デッキ取得件数 4→3・Excel未反映）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:87, pf-eccube3/app/Plugin/HareruyaEc/Controller/Pro` | RG-046 |  |
| f03-02 | カスタマイズ | 乖離 | 乖離（正本の設計内矛盾・DB操作節が汎用テンプレ）／設計書修正要 | `ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:495` | RG-082（§5で`要判定`） |  |
| f03-03 | カスタマイズ | 乖離 | 乖離（Excelカスタマイズ要件が現行実装・詳細設計いずれにも未反映）／要実機確認 | `—` | RG-011,012 |  |
| f03-03 | カスタマイズ | 乖離 | 乖離（詳細設計HTMLがExcelのモーダル化要件を未反映＝設計書間の矛盾。期待にはExcelを採用）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/default/Product/list.twig:546` | RG-002,003,004 |  |
| f03-04 | カスタマイズ | 乖離 | 乖離（参照列の不一致・設計書の列名が実装と別／`display_flg` と `front_search_hide_flg` の二重管理リスク）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/TopCategoryListBuilder.php:96, ec-cube-enterprise/src/Eccube/Entity/Category.php:4` | RG-008（DV-14,15） |  |
| f03-04 | カスタマイズ | 乖離 | 乖離（フラグ極性・命名の反転／設定値の解釈誤りリスク）／要実機確認 | `ec-cube-enterprise/src/Eccube/Entity/Category.php:459, ec-cube-enterprise/src/Eccube/Service/TopCategoryListBuilder.php:` | RG-009（DV-16,17） |  |
| f03-04 | カスタマイズ | 乖離 | 乖離（「固定表示」がマスタ名称一致に依存し、名称変更・非表示・欠落で無言で消える）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/TopCategoryListBuilder.php:39` | RG-004（DV-09〜13） |  |
| f03-04 | カスタマイズ | 乖離 | 乖離（最新セット判定の名称一致依存／カードセット合成子要素とL2644削除要件の整合が設計上未定義）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/TopCategoryListBuilder.php:36` | RG-003,RG-017 |  |
| f03-04 | カスタマイズ | 乖離 | 乖離（詳細設計書がExcelカスタマイズ未反映＝設計書間の不整合／旧URLの存続と挙動変更がどの設計にも明示なし）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/TopCategoryListBuilder.php:75, ec-cube-enterprise/src/Eccube/Controller/Front/Prod` | RG-001,RG-017,RG-033 |  |
| f03-04 | カスタマイズ | 乖離 | 乖離（Excel内部の付番不整合により対象範囲が確定できない・設計不整合）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/TopCategoryListBuilder.php:145` | RG-015（§5要判定） |  |
| f03-05 | 現行踏襲 | 乖離 | 乖離（現行実装がExcel設計の支店条件を満たさない）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Repository/OrderDetailRepository.php:426, ec-cube-enterprise/src/Eccube/Repository/Prod` | RG-026 |  |
| f03-05 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・同一カード除外のNULL挙動）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Repository/OrderDetailRepository.php:443, ec-cube-enterprise/src/Eccube/Repository/Orde` | RG-010（DV-08） |  |
| f03-05 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・期間起点）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Repository/OrderDetailRepository.php:401, ec-cube-enterprise/src/Eccube/Repository/Orde` | RG-009,RG-027（DV-11） |  |
| f03-05 | 現行踏襲 | 乖離 | 乖離（未登録時の耐性差・現行はエラー化の可能性）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Repository/OrderDetailRepository.php:386, ec-cube-enterprise/src/Eccube/Service/Recomme` | RG-027 |  |
| f03-05 | 現行踏襲 | 乖離 | 乖離（「表示時点で在庫があり公開中」との差・鮮度）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Repository/OrderDetailRepository.php:24, ec-cube-enterprise/src/Eccube/Repository/Order` | RG-013,RG-029 |  |
| f03-05 | 現行踏襲 | 乖離 | 乖離（英語文言の現行踏襲差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1003, pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/me` | RG-018,RG-019 |  |
| f03-05 | 現行踏襲 | 乖離 | 乖離（取得方式の現行踏襲差＋カート空時の表示差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Block/ProductRecommendController.php:42, ec-cube-enterprise/src/Eccube/Resource` | RG-007,RG-022 |  |
| f03-06 | カスタマイズ | 乖離 | 乖離（Excelと実装/詳細設計の競合・画像押下の期待挙動が拡大表示か詳細遷移か）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/history.twig:6` | RG-010,RG-011,RG-015 |  |
| f03-07 | カスタマイズ | 乖離 | 乖離（カスタマイズ要件違反・上限カウント単位）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/product_js.twig:328, ec-cube-enterprise/src/Eccube/Cont` | RG-009,010 |  |
| f03-07 | カスタマイズ | 乖離 | 乖離（上限境界の不整合・まとめて経路で1件少なく制限）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/NotifylistController.php:235, CartController.php:479` | RG-009・§3 DV-06,DV-07 |  |
| f03-07 | カスタマイズ | 乖離 | 乖離（文言差・上限件数の非埋め込み）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1339, NotifylistController.php:157` | RG-004,036・§3 DV-07 |  |
| f03-07 | カスタマイズ | 乖離 | 乖離（表示要件のみでサーバ側の防御が仕様化されていない・仕様の穴）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Product/ProductRestockNotifyPolicy.php:44, ec-cube-enterprise/src/Eccube/Entity/Pr` | RG-014・§3 DV-12 |  |
| f03-07 | カスタマイズ | 乖離 | 乖離（カスタマイズ要件違反・一覧の通知単位）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/default/Product/list.twig:108, ec-cube-enterprise/src/Eccube/Resource/te` | RG-012 |  |
| f03-07 | カスタマイズ | 乖離 | 乖離（画面遷移仕様との差・Excel未記載の試行回数超過表示）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1247, ec-cube-enterprise/src/Eccube/Resource/template/def` | RG-022・§5「試行制限=要判定」 |  |
| f03-07 | カスタマイズ | 乖離 | 乖離（ルートパス差）／設計沈黙の追加挙動（CSRF・支店404）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Front/CartController.php:420, ec-cube-enterprise/app/config/eccube/routes.yaml:` | RG-001,015・§5「CSRF=要判定」「 |  |
| f03-08 | 現行踏襲 | 乖離 | 乖離（入口URL・パラメータ契約差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:779` | RG-001〜015 |  |
| f03-08 | 現行踏襲 | 乖離 | 乖離（一覧URL・絞り込みパラメータ契約差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:291, ec-cube-enterprise/src/Eccube/Repository` | RG-016〜019,022,035,036 |  |
| f03-08 | 現行踏襲 | 乖離 | 乖離（状態値の誤り＝失敗を成功として返す）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:828` | RG-005,013 |  |
| f03-08 | 現行踏襲 | 乖離 | 乖離（Excel★言語別登録の反映漏れ・画面間不整合）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:391` | RG-024,025,026 |  |
| f03-08 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・CSRF有効化）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:786` | §5『要判定』（CSRF） |  |
| f03-08 | 現行踏襲 | 乖離 | 適合（乖離なし・参考記録） | `pf-eccube3/app/Plugin/HareruyaEc/Controller/ProductController.php:366, ec-cube-enterprise/src/Eccube/Controller/Front/Pr` | RG-023 |  |
| f04-01 | カスタマイズ | その他 | price }}で送料無料になります。`）。いずれも店舗種別による分岐を持たない（#5 のとおり店舗概念自体が無い） | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Cart/index.twig:61` | **乖離（★カスタマイズ未実装・支店でも送料案内 |  |
| f04-01 | カスタマイズ | その他 | 本書の扱い | `—` |  |  |
| f04-01 | カスタマイズ | その他 | Excel優先＝RG-014,015 の期待は再読み込みなし。詳細設計の記述はカスタマイズ前の姿として付帯表4#1 に整理 | `—` |  |  |
| f04-01 | カスタマイズ | その他 | Excel優先＝RG-020・DV-06,07 の期待は入力不可。詳細設計の削除挙動は付帯表4#4 に整理 | `—` |  |  |
| f04-01 | カスタマイズ | その他 | Excel優先＝RG-032 の期待は閲覧店舗のTOP。付帯表4#8 に整理 | `—` |  |  |
| f04-02 | カスタマイズ | 乖離 | 乖離（初期値の算出規則がExcel記載と不一致・再表示時に顕在化）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Extension/Front/ShoppingTypeExtension.php:41` | RG-055（DV-02） |  |
| f04-02 | カスタマイズ | 乖離 | 乖離（設計に無い下限制約・設定値の取り違え疑い）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Extension/Front/ShoppingTypeExtension.php:61, pf-eccube3/app/Plugin/HareruyaEc/con` | RG-055（DV-05,DV-12） |  |
| f04-02 | カスタマイズ | 乖離 | 乖離（Excel が限定しない対象を会員のみへ限定＝非会員で30分超過が素通り）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Event/ShoppingEvent.php:59, pf-eccube3/app/Plugin/HareruyaEc/Service/ShoppingService.ph` | RG-070,RG-071 |  |
| f04-02 | カスタマイズ | その他 | date_modify("+6 days") | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/index.twig:182` | date("n月j日") }}` を「・「商品取 |  |
| f04-03 | カスタマイズ | 乖離 | 乖離（詳細設計HTMLがカスタマイズ前挙動を記述＋Excel内で処理概要と画面項目表が不整合）／要実機確認（画面項目表の残置が意図的か否かの設計確認が必要） | `ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:32, ec-cube-enterprise/src/Eccube/Fo` | RG-010,011 |  |
| f04-03 | カスタマイズ | 乖離 | 乖離（Excelの遷移先とオラクル差。配送先選択が中間画面としてご注文方法指定へ戻る導線であればExcel記述と実質整合しうるが、画面遷移の粒度が一致しない）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/ShoppingController.php:1011` | RG-030,040 |  |
| f04-03 | カスタマイズ | 乖離 | 乖離（登録タイミングの設計違反＝戻る/検証不備でも住所が永続化される副作用。Excel L2311-2312 の「登録するボタン押下→配送先登録」に反する）／要実機確認（新規時に空行が挿入されるか、NOT NULL制約で失敗するかは実機確認） | `pf-eccube3/app/Plugin/HareruyaEc/Controller/ShoppingController.php:987, pf-eccube3/app/Plugin/HareruyaEc/Service/Deliver` | RG-031,032,034 |  |
| f04-03 | カスタマイズ | 乖離 | 乖離（Excel画面項目表 vs 詳細設計/実装の必須差。郵便番号2が任意なら「169-」のみでの登録が通ることになり、Excelの記載漏れの可能性が高い）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/delivery_edit.twig:111` | RG-020(DV-14) |  |
| f04-04 | 現行踏襲 | 乖離 | 乖離（pf店舗別TOP未達・ラベル差） | `...Shopping/complete.twig:63, ...Shopping/complete.twig:132` | RG-028 |  |
| f04-04 | 現行踏襲 | 乖離 | 乖離疑義（総原価反映箇所 要実機確認） | `app/Plugin/HareruyaEc/Service/ShoppingService.php:827` | RG-008,009 |  |
| f05-02 | カスタマイズ | 乖離 | 乖離（現行カスタマイズ未達） | `app/Plugin/HareruyaEc/Form/Type/Front/Product/SearchType.php:171, src/Eccube/Service/Front/FrontProductSearchRequestQuer` | RG-026 |  |
| f05-03 | カスタマイズ | 乖離 | 乖離（0件HTTPステータスが現行404→ユニサーチ200へ変化・Excel未規定）／要実機確認 | `app/Plugin/HareruyaEc/Controller/PurchaseController.php:542, src/Eccube/Controller/Front/Purchase/PurchaseController.php` | RG-010 |  |
| f05-03 | カスタマイズ | 乖離 | 乖離（上限値 9999 vs ユニサーチ 4000）／要実機確認 | `app/config/eccube/packages/eccube.yaml:394, ProductSearchTrait.php:59, src/Eccube/Service/UniSearch/UniSearchService.php` | RG-008,009 |  |
| f05-03 | カスタマイズ | 乖離 | 乖離（上限超過の外部件数通知が現行→ユニサーチで消失）／要実機確認 | `app/Plugin/HareruyaEc/Controller/ProductSearchTrait.php:55, PurchaseController.php:404` | RG-035 |  |
| f05-04 | カスタマイズ | 乖離 | 乖離(詳細設計stale＋pf-eccube3現行未達・enterprise是正済) | `app/Plugin/HareruyaEc/Controller/PurchaseController.php:575, app/Plugin/HareruyaEc/Resource/template/default/Purchase/de` | RG-005,017 |  |
| f05-04 | カスタマイズ | 乖離 | 乖離(pf-eccube3実装バグ・型不整合)／要実機確認 | `PurchaseController.php:597, ...Purchase/detail.twig:299, src/.../Purchase/PurchaseController.php:996` | RG-004 |  |
| f05-04 | カスタマイズ | 乖離 | 乖離(pf-eccube3実装不備・未初期化参照)／軽微 | `PurchaseController.php:577` | RG-003 |  |
| f05-04 | カスタマイズ | 乖離 | 乖離(pf-eccube3現行 6≠仕様8・enterprise是正済)／要実機確認 | `PurchaseController.php:41, ...Purchase/detail.twig:442, src/.../Purchase/PurchaseController.php:85` | RG-024,033 |  |
| f05-05 | カスタマイズ | その他 | length > 0 %}` のときのみ表示＝数量0（カート空）ではボタン自体が非表示。空カートで手続きへ進んだ場合は `PurchaseController::login`（`pf-eccube3:app/Plugin/HareruyaEc/Controll | `cart.twig:97` | **乖離（経路差・要実機確認）** |  |
| f05-05 | カスタマイズ | その他 | 削除はなりすまし対策トークンを検証し、対象が無ければ変更せずカート表示へ戻す（詳細設計 L344,L365,L384） | `PurchaseController.php:466` | !array_key_exists($id,$o |  |
| f05-05 | カスタマイズ | その他 | 更新時、数字でない・1未満はカートから外し、20点超過は更新中断（詳細設計 L346,L360,L384） | `PurchaseController.php:664` | $quantity < 1` → `unset` |  |
| f05-05 | カスタマイズ | その他 | length > 0 %}` でカート用JS読込）・`app/Plugin/HareruyaEc/Resource/template/default/Block/js/purchase_cart_js.twig:7`（load時 `dialogBulkPurc | `cart.twig:11` | **設計どおり✓** |  |
| f05-06 | カスタマイズ | その他 | 詳細設計の描写要是正（実装にハイフンあり） | `PurchaseController.php:373` | RG-024 |  |
| f06-01 | カスタマイズ | 乖離 | 乖離（カスタマイズ未達） | `app/Plugin/HareruyaEc/Controller/EntryController.php:152` | RG-031 |  |
| f06-01 | カスタマイズ | その他 | 詳細設計の記述誤り（実ソースで是正・Excelは整合） | `src/Eccube/Entity/Customer.php:74` | RG-014,024 |  |
| f06-02 | 現行踏襲 | 乖離 | 乖離（重大・確定失敗の未ロールバック） | `src/Eccube/Controller/Front/EntryController.php:283` | RG-007,008,010,011 |  |
| f06-02 | 現行踏襲 | 乖離 | 乖離（判定順序の位置ずれ）／要実機確認 | `EntryController.php:349, app/Plugin/HareruyaEc/Controller/EntryController.php:228` | RG-005 |  |
| f06-02 | 現行踏襲 | その他 | 差異（記述と実装差・安全側） | `EntryController.php:354` | RG-010 |  |
| f06-03 | カスタマイズ | 乖離 | 乖離（Excel★カスタマイズ未達・回数/時間/キー/文言すべて相違） | `app/Plugin/HareruyaEc/config.yml:337, app/Plugin/HareruyaEc/Service/Security/FrontLoginFailureHandler.php:27, app/Plugin` | RG-007,008 |  |
| f06-03 | カスタマイズ | 乖離 | 乖離（実装バグ・支店自動ログイン到達不可の疑い）／要実機確認 | `app/Plugin/HareruyaEc/EventListener/SecurityEventListener.php:39, app/Plugin/HareruyaEc/Event/AutoLoginEvent.php:29` | RG-012 |  |
| f06-03 | カスタマイズ | その他 | 詳細設計の記述誤り（登録/更新は当機能に不該当）＋Excel L2084 登録/更新は定型ゆえ不該当 | `app/Plugin/HareruyaEc/EventListener/SecurityEventListener.php:35` | RG-024 |  |
| f06-03 | カスタマイズ | その他 | 設計どおり✓（#4の読取名不一致を除く） | `app/Plugin/HareruyaEc/EventListener/SecurityEventListener.php:35, config.yml:327` | RG-011 |  |
| f06-04 | 現行踏襲 | 乖離 | 乖離（ルート構造差） | `app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php:120, src/Eccube/Controller/Front/ForgotController.p` | RG-012,022 |  |
| f06-04 | 現行踏襲 | 乖離 | 乖離（設計は非照合・enterpriseは照合必須） | `HareruyaEc/Controller/ForgotController.php:127, src/Eccube/Controller/Front/ForgotController.php:206, src/Eccube/Reposit` | RG-016 |  |
| f06-04 | 現行踏襲 | 乖離 | 乖離（注意表示 vs バリデーションエラーの機構差） | `src/Eccube/Form/Type/Front/PasswordResetType.php:54, HareruyaEc/Controller/ForgotController.php:97` | RG-010,014 |  |
| f06-05 | カスタマイズ | 乖離 | 乖離（エンドポイント未提供・要実機確認） | `app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php:129, .../Controller/Mypage/MypageController.php:181` | RG-031 |  |
| f06-05 | カスタマイズ | 乖離 | 設計注記（GMO→SP.LINKSで解消・乖離ではない） | `src/Eccube/Resource/template/default/Mypage/index.twig:196, plugin_repos/SlnPayment42/Resource/config/routes.yaml:23` | RG-025 |  |
| f06-06 | カスタマイズ | 乖離 | 乖離疑義（マスタ実データで確定） | `ShoppingHistoryType.php:49, MypageController.php:454` | RG-004 |  |
| f06-07 | カスタマイズ | 乖離 | 乖離疑義（画像マッピング粒度・要実機確認） | `shopping_history_detail.twig:41` | RG-024 |  |
| f06-08 | カスタマイズ | 乖離 | 乖離（上限カウント単位が仕様と不一致）／要実機確認 | `NotifylistController.php:235` | RG-016(DV-03) |  |
| f06-08 | カスタマイズ | その他 | length`（`NotifylistController.php:66` の `$key=Product.id-languageId` 単位グループ数）を件数表示。一方で登録上限判定は個々の依頼数（`:156` `count(...getProductReq | `notifylist.twig:41` | **乖離疑義（件数の定義曖昧・カウント基準二重化 |  |
| f06-08 | カスタマイズ | 乖離 | 乖離（画像の押下挙動が仕様と異なる）／要実機確認 | `notifylist.twig:51` | RG-004 |  |
| f06-08 | カスタマイズ | 乖離 | 乖離（詳細リンクの言語/規格パラメータ欠落）／要実機確認 | `notifylist.twig:59` | RG-004,006 |  |
| f06-08 | カスタマイズ | 乖離 | 乖離（未文書化の店舗限定挙動）／要実機確認 | `NotifylistController.php:52` | §5 HTTPステータス行 |  |
| f06-09 | カスタマイズ | 乖離 | 乖離（route変更・実ソースを正・機能影響なし） | `app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php:155, src/Eccube/Controller/Front/Mypage/MypageContr` | RG-001,027,028 |  |
| f06-09 | カスタマイズ | 乖離 | 乖離（実装バグ懸念・案内文言が通知内容と不一致）／要実機確認 | `src/Eccube/Resource/locale/messages.ja.yaml:700, messages.en.yaml:623, src/Eccube/Service/Product/BatchFavoriteSaleNotif` | RG-005 |  |
| f06-10 | カスタマイズ | 乖離 | 乖離（オラクル取り違え・ID衝突／要台帳修正） | `—` | 全体（Excel源） |  |
| f06-10 | カスタマイズ | 乖離 | 乖離（詳細設計内の記述矛盾・実装は廃止準拠） | `—` | §0廃止 |  |
| f06-10 | カスタマイズ | 乖離 | 乖離（詳細設計テンプレ由来の誤記・実装は参照のみ） | `src/Eccube/Controller/Front/Mypage/MypageController.php:393` | RG-024 |  |
| f06-10 | カスタマイズ | 乖離 | 乖離（選択肢のサーバ側検証なし）／要実機確認 | `...Mypage/point_history.twig:72, MypageController.php:403` | RG-017(DQ-06) |  |
| f06-10 | カスタマイズ | 乖離 | 乖離（Excel簡略記述と実装の並びキー差）／要実機確認 | `src/Eccube/Repository/DtbPointHistoryRepository.php:88, app/Plugin/HareruyaEc/Repository/DtbPointHistoryRepository.php:2` | RG-001 |  |
| f06-10 | カスタマイズ | 乖離 | 乖離（設計/実装のパラメータ名差）／要実機確認 | `src/Eccube/Controller/Front/Mypage/MypageController.php:403, ...Mypage/point_history.twig:24` | RG-017(§3・DQ-01〜06) |  |
| f06-11 | カスタマイズ | 乖離 | 乖離疑義（net金額の内容・実機/査定承諾値で確定）／要実機確認 | `.../PurchaseHistoryRowBuilder.php:95` | RG-013 |  |
| f06-12 | カスタマイズ | 乖離 | 乖離（URL/ルート体系差・要実機確認） | `src/Eccube/Controller/Front/Mypage/PurchaseHistoryController.php:99, app/Plugin/HareruyaEc/Controller/Mypage/PurchaseCon` | RG-004,RG-015,RG-020 |  |
| f06-12 | カスタマイズ | 乖離 | 乖離疑義（ファイアウォール依存・要実機確認） | `src/Eccube/Controller/Front/Mypage/PurchaseHistoryController.php:217` | RG-023 |  |
| f06-12 | カスタマイズ | 乖離 | 乖離（実装バグ懸念・堅牢性欠如）／要実機確認 | `src/Eccube/Controller/Front/Mypage/PurchaseHistoryController.php:110` | RG-019 |  |
| f06-12 | カスタマイズ | 乖離 | 乖離疑義（マスタ依存の可能性・要実機確認） | `src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetDetailAction.php:161` | RG-006,DV-S3 |  |
| f06-13 | 現行踏襲 | 乖離 | 乖離（メール送信順の不整合懸念／現行トークン未検証）／要実機確認 | `src/Eccube/Service/Front/Mypage/IdentificationUpdateAction.php:82, ...IdentificationController.php:54` | RG-012,023 |  |
| f06-13 | 現行踏襲 | 乖離 | 乖離疑義（静的QR・要実機確認） | `src/Eccube/Resource/template/default/Mypage/online_identification.twig:40, ...online_identification_start.twig:82` | RG-002 |  |
| f06-14 | カスタマイズ | 乖離 | 乖離（詳細設計陳腐化・Excel=実装で満たされる） | `EventHistoryController.php:55, event_history.twig:58` | RG-015,016 |  |
| f06-14 | カスタマイズ | 乖離 | 乖離（詳細設計欠落・Excel=実装で満たされる） | `EventHistoryController.php:76, event_history.twig:142, DtbDeckRepository.php:146` | RG-001,010,011 |  |
| f06-14 | カスタマイズ | 乖離 | 乖離（文言差・要実機確認） | `event_history.twig:120, src/Eccube/Resource/locale/messages.ja.yaml:660, messages.ja.yaml:665` | RG-008・DDT-A DA-03 |  |
| f06-14 | カスタマイズ | 乖離 | 乖離（軽微な文言差・要実機確認） | `messages.ja.yaml:664` | RG-010 |  |
| f06-14 | カスタマイズ | 乖離 | 乖離（軽微な文言差・要実機確認） | `messages.ja.yaml:663` | RG-006・DDT-A DA-01 |  |
| f06-16 | カスタマイズ | 乖離 | 乖離（順序差・結果影響小／要実機確認） | `DeckEntryController.php:110` | RG-030 |  |
| f06-16 | カスタマイズ | 乖離 | 乖離（カスタマイズ未達） | `src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:165` | RG-001,002 |  |
| f06-16 | カスタマイズ | その他 | 選択可能フォーマットのフィルタは rankingFlg または otherMetaFlg がオン（Excel 0306:L4424） | `DeckEntryController.php:118` | $f->isOtherMetaFlg()`）・t |  |
| f06-17 | カスタマイズ | 乖離 | 乖離（カスタマイズ未達・開催店舗未表示） | `src/Eccube/Resource/template/default/Mypage/deck_entry_check.twig:14` | RG-002 |  |
| f06-17 | カスタマイズ | 乖離 | 乖離（4枚制限メッセージ文言差・軽微）／要実機確認 | `src/Eccube/Service/Deck/DeckValidationService.php:254, src/Eccube/Resource/locale/messages.ja.yaml:4398` | RG-016(DD-09) |  |
| f06-17 | カスタマイズ | その他 | フォーマット指定は「当該イベントのフォーマットに一致すること」を要し、一致しなければ404（L371／getSelectedFormat は全フォーマットから一致を探す：`pf-eccube3:DeckentryCont | `DeckEntryController.php:118` | isOtherMetaFlg())` で選択可能 |  |
| f06-17 | カスタマイズ | その他 | 現行pfバグ（移行先enterpriseで是正済み・回帰確認要） | `DeckentryController.php:158, DeckEntryController.php:110` | RG-015 相当（update側） |  |
| f06-17 | カスタマイズ | その他 | 完了画面 所有者確認（デッキの選手とログイン会員選手が不一致なら404）・デッキ/イベント詳細取得不可なら404（L337,L348,L382） | `DeckEntryController.php:170` | $Deck->getPlayer()?->get |  |
| f06-18 | カスタマイズ | その他 | 更新時にスマレジへ会員情報更新を連携する（詳細設計L360＝連携は更新の一部・条件記載なし＝常時） | `ChangeController.php:161, src/Eccube/Controller/Front/Mypage/ChangeController.php:174` | $isTelChanged) ? registe |  |
| f06-18 | カスタマイズ | 乖離 | 乖離（pf-eccube3 カスタマイズ未達） | `app/Plugin/HareruyaEc/Controller/EntryController.php:104` | RG-019 |  |
| f06-18 | カスタマイズ | 乖離 | 乖離（enterprise 遷移先が専用エラー画面でなくフォーム再描画・要実機確認） | `src/Eccube/Controller/Front/Mypage/ChangeController.php:116` | RG-019 |  |
| f06-19 | 標準 | 乖離 | 乖離（セキュリティ・設計沈黙）／要実機確認（脅威評価） | `Controller/MypageController.php:66` | RG-018 |  |
| f06-19 | 標準 | 乖離 | 乖離（設計未記載・性能懸念） | `Service/Util.php:220` | RG-012 |  |
| f06-20 | カスタマイズ | 乖離 | 乖離（enterprise 400・仕様は404） | `DeliveryController.php:142, DeliveryController.php:219` | RG-002,013 |  |
| f06-20 | カスタマイズ | 乖離 | 乖離（enterprise 物理削除・現行論理から変更） | `DeliveryController.php:151, ../ec-cube-enterprise/src/Eccube/Repository/CustomerAddressRepository.php:43` | RG-014 |  |
| f06-20 | カスタマイズ | 乖離 | 軽微乖離（未使用注入・意図不明確）／要実機確認 | `DeliveryController.php:26` | RG-030 |  |
| f06-21 | 現行踏襲 | 乖離 | 乖離（用語/対象の不一致・要実機確認） | `WithdrawController.php:75, WithdrawController.php:111, src/Eccube/Service/Smaregi/SmaregiCustomerService.php:499` | RG-007 |  |
| f06-21 | 現行踏襲 | その他 | 未確認（オラクル規定あり・実装到達未検証） | `—` | RG-021,022 |  |
| f06-22 | カスタマイズ | 乖離 | 乖離（設計意図に対しサーバ無担保）／要実機確認 | `src/Eccube/Service/Front/Mypage/ContactCreateAction.php:61, app/Plugin/HareruyaEc/Controller/ContactController.php:101` | RG-006,025,017 |  |
| f06-22 | カスタマイズ | 乖離 | 乖離（実装が設計より制約強）／要実機確認 | `src/Eccube/Form/Type/Front/ContactType.php:79, src/Eccube/Form/Type/Front/ContactType.php:68` | DV-12 |  |
| f06-22 | カスタマイズ | 乖離 | 乖離（実装挙動・条件付き）／要実機確認 | `src/Eccube/Form/Type/Front/ContactType.php:76, src/Eccube/Form/Type/Front/ContactType.php:65` | DV-06 |  |
| f06-22 | カスタマイズ | その他 | RG-002,019,020,022,024 | `—` |  |  |
| f06-23 | 現行踏襲 | 乖離 | 乖離（現行＝Excel★カスタマイズ未適用／詳細設計HTMLの記述もExcelと競合＝Excelが正）／要実機確認 | `pf-eccube3/.../Contact/history.twig:7, ec-cube-enterprise/.../Contact/history.twig:5` | RG-010 |  |
| f06-23 | 現行踏襲 | 乖離 | 乖離（現行がExcel画面項目を未充足）／要実機確認 | `pf-eccube3/.../Contact/history.twig:19, ec-cube-enterprise/.../Contact/history.twig:30` | RG-013 |  |
| f06-23 | 現行踏襲 | その他 | date('Y年m月d日 H:i') }}`）。移行先は `Y/m/d H:i`（ja）／`m/d/Y H:i`（en）（`ec-cube-enterprise/.../Contact/history.twig:33,35`）＝一覧の日時書式が現行踏襲から変化 | `pf-eccube3/.../Contact/history.twig:17` | **乖離（移行先の現行踏襲違反・日時書式の退行） |  |
| f06-23 | 現行踏襲 | その他 | length }}` ＋「件」を無条件出力）。移行先は0件時に件数ブロックを描画せず空メッセージのみ表示（`ec-cube-enterprise/.../Contact/history.twig:11-15`＝`{% if contactHistories i | `pf-eccube3/.../Contact/history.twig:10` | **乖離（移行先の現行踏襲違反・0件時「0件」非 |  |
| f06-24 | 現行踏襲 | 乖離 | 乖離（遷移先の不一致・直リンク流入時に顕在化）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact/history_detail.twig:35, Contact/history_detail.en.twi` | RG-015 |  |
| f06-24 | 現行踏襲 | 乖離 | 乖離（未ログイン時のログイン誘導が設計どおり成立しない疑い・ルート未保護）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/ContactController.php:155, pf-eccube3/app/Plugin/HareruyaEc/Util/LoginUtil.p` | RG-020 |  |
| f06-24 | 現行踏襲 | その他 | date('Y/m/d H:i') }}`』・`:19`『`contact.subject.subject`』・`:20`『`contact.id`』・`:25,26,29`）ため、「明示エラーを出さずに内容だけを出さない」ではなく画面エラーになる可能性がある | `pf-eccube3/app/Plugin/HareruyaEc/Controller/ContactController.php:156, pf-eccube3/app/Plugin/HareruyaEc/Resource/templat` | **乖離（不在/他会員ID時の応答が設計と異なる |  |
| f06-24 | 現行踏襲 | その他 | date('m/d/Y H:i') }}`）。日本語版は `Y/m/d H:i`（`Contact/history_detail.twig:18,26`）。詳細設計はロケール別の書式差を規定していない（`:342` は単一書式のみ記述） | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact/history_detail.en.twig:18` | **乖離（設計未記述のロケール別書式差・軽微）／ |  |
| f06-25 | カスタマイズ | その他 | 店舗ごとにそれぞれ異なる店頭注文番号を表示可能とする（Excel 0306:L7170,L7176）。拠点別 base_info_id で採番・表示（詳細 L315,L356） | `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/waiting_get_js.twig:96, waiting_number.twig:45, waiting` |  |  |
| f06-25 | カスタマイズ | その他 | 本店ではWiFiパスワードを表示・支店では非表示（Excel 0306:L7171,L7172,L7186）。現行の支店WiFiを除去（Excel 0306:L7195） | `ec-cube-enterprise/html/template/default/assets/js/waiting_monitor.js:26, waiting_monitor.js:14, waiting_number.twig:46` |  |  |
| f06-25 | カスタマイズ | その他 | 本店URL＝`/ja/waiting_number_1`（Excel 0306:L7189） | `ec-cube-enterprise/src/Eccube/Controller/Front/WaitingNumberController.php:42, pf-eccube3/app/Plugin/HareruyaEc/Controll` |  |  |
| f06-25 | カスタマイズ | その他 | 注文番号取得API＝`GET /{_locale}/waiting_api/get_waiting`（詳細 L321,L333） | `ec-cube-enterprise/src/Eccube/Controller/Front/WaitingNumberController.php:56, pf-eccube3/.../WaitingNumberController.ph` |  |  |
| f06-25 | カスタマイズ | その他 | DB操作＝登録/更新 dtb_order/dtb_waiting_number/dtb_waiting_tag を persist/flush で直接確定（詳細 L358,L359）※誤記 | `ec-cube-enterprise/src/Eccube/Controller/Front/WaitingNumberController.php:44` |  |  |
| f06-26 | カスタマイズ | 乖離 | 乖離（IP取得方式差・信頼プロキシ設定依存）／要実機確認 | `src/Eccube/Event/IpCheckSubscriber.php:54` | RG-004 |  |
| f06-26 | カスタマイズ | 乖離 | 乖離（HTTPステータス 200→403 の変更）／要実機確認 | `src/Eccube/EventListener/CustomerGroupAccessListener.php:120` | RG-009,025 |  |
| f06-26 | カスタマイズ | 乖離 | 乖離疑義（本店注文導線の過剰遮断・実機で注文完遂可否を要確認） | `src/Eccube/Service/Front/CustomerGroupAccessRouteRegistry.php:83` | RG-013,014 |  |
| f07-01 | カスタマイズ | 乖離 | 乖離（固定文言の相違）／要実機確認 | `ec-cube-enterprise/html/template/default/assets/hareruya/js/hareruya-event.js:1` | RG-024 |  |
| f07-01 | カスタマイズ | 乖離 | 乖離（第2ソートキー欠落の疑い）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/DtbEventRepository.php:307, ec-cube-enterprise/html/template/default/assets/har` | RG-012 |  |
| f07-01 | カスタマイズ | 乖離 | 乖離（現行踏襲差・クッキー更新契機の拡大）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Front/EventTopController.php:76, pf-eccube3/app/Plugin/HareruyaEc/Util/CookieUt` | RG-002,RG-004 |  |
| f07-01 | カスタマイズ | 乖離 | 乖離（既定店舗の決定方法の相違）／要実機確認（設定値の実値） | `ec-cube-enterprise/src/Eccube/Controller/Front/EventTopController.php:100, src/Eccube/Controller/App/EventScheduleContro` | RG-001 |  |
| f07-02 | カスタマイズ | その他 | カスタマイズ差分（設計どおり・移行先で実装済）／詳細設計HTMLの記述が Excel と矛盾＝詳細設計の更新漏れ | `pf-eccube3/app/Plugin/HareruyaEc/Controller/EventController.php:36, ec-cube-enterprise/src/Eccube/Service/Front/Event/Ev` | RG-026,029,035,063 |  |
| f07-02 | カスタマイズ | その他 | 過去表示のクエリ名は `allowPast`（`0307:L1881`「allowPast 過去」） | `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbEventDetailRepository.php:341` | !$params['isPast'])`）／`a |  |
| f07-02 | カスタマイズ | その他 | カスタマイズ差分（設計どおり・移行先で実装済）／詳細設計HTMLの「部分一致」記述（L344）は Excel L1892 と矛盾＝詳細設計の更新漏れ | `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbEventDetailRepository.php:306, ec-cube-enterprise/src/Eccube/Service/Fron` | RG-001,003 |  |
| f07-02 | カスタマイズ | 乖離 | 乖離（Excel条件の解釈が実装で確定できない／マジックナンバー依存）／要実機確認（「オンライン受付あり」に対応する項目の同定、イベント規模ID=4 が「大型イベント」であることの確認） | `ec-cube-enterprise/src/Eccube/Repository/DtbEventDetailRepository.php:560, ec-cube-enterprise/src/Eccube/Entity/DtbEvent` | RG-011,012,017 |  |
| f07-02 | カスタマイズ | 乖離 | 乖離（マジックナンバー依存・マスタ非追随）／要実機確認（ルール適用度ID 6/7/2 が「初心者歓迎」「カジュアル対戦」「競技」であることの確認） | `ec-cube-enterprise/src/Eccube/Repository/DtbEventDetailRepository.php:585, ec-cube-enterprise/src/Eccube/Entity/Master/M` | RG-010,012 |  |
| f07-03 | カスタマイズ | 乖離 | 乖離（Excel仕様違反・パンくず構成と絞り込み遷移）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/default/Event/detail.twig:67, detail.twig:50, detail.twig:60` | RG-001,002 |  |
| f07-03 | カスタマイズ | 乖離 | 乖離（機能欠落・残り予約数と事前予約情報の非表示）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/default/Event/detail.twig:92, pf-eccube3/.../Event/show.twig:84` | RG-021,022,023,024,025 |  |
| f07-03 | カスタマイズ | その他 | number_format }}` と表示（`ec-cube-enterprise/src/Eccube/Resource/template/default/Event/detail.twig:132-136`）。「（金額）円」書式でない。現行は `{{ ev | `—` | number_format() }}円`（`pf |  |
| f07-03 | カスタマイズ | 乖離 | 乖離（Excel仕様違反・ラベル文言）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6593, detail.twig:107` | RG-009 |  |
| f07-03 | カスタマイズ | 乖離 | 乖離（Excel仕様との挙動差・コピー以外の分岐）／要実機確認 | `ec-cube-design-assets/assets/js/hareruya-main.js:1, ec-cube-enterprise/html/template/default/assets/hareruya/js/hareruya` | RG-044,057 |  |
| f07-03 | カスタマイズ | 乖離 | 乖離（設定名と挙動の不一致・Excelの設定名と不一致）／要実機確認 | `ec-cube-enterprise/src/Eccube/Entity/DtbEvent.php:96, ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:600` | RG-017,018 |  |
| f07-03 | カスタマイズ | 乖離 | 乖離（備考のフリーエリアへの置換がオラクルに明示されず）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/default/Event/detail.twig:140, pf-eccube3/.../Event/show.twig:80` | §5「備考」要判定 |  |
| f07-04 | カスタマイズ | 乖離 | 乖離（決済事業者/プラグインの対応が未明示）／要実機確認 | `—` | RG-022,023,025,026,048〜0 |  |
| f08-01 | 現行踏襲 | 乖離 | 乖離（実装バグ・クライアント入力チェックが no-op）／サーバ側 NotBlank は機能するため実害はUXのみ | `app/Plugin/HareruyaEc/Resource/template/default/OtcBuy/entry.twig:24, entry.en.twig:24, html/template/default/js/eccube.` | RG-005,015（DP-03 要実機確認に反 |  |
| f08-01 | 現行踏襲 | 乖離 | 乖離（Excel最大320のサーバ非強制）／要実機確認（実害はログイン検証・DB列長依存） | `src/Eccube/Form/Type/Front/CustomerLoginType.php:47` | DP-04（要実機確認・件数外） |  |
| f08-02 | カスタマイズ | 乖離 | 乖離（Excelカスタマイズ「個人情報取り扱い削除・共通利用規約のみ」が現行pf-eccube3・詳細設計とも未反映＝要実機確認） | `app/Plugin/HareruyaEc/Resource/template/default/OtcBuy/index.twig:192` | RG-001,016（期待はExcelカスタマイ |  |
| f08-02 | カスタマイズ | 乖離 | 乖離（10分制限がクライアント側のみで強制・サーバ非強制。直リクエストで超過受理の可能性＝要実機確認・セキュリティ観点） | `app/Plugin/HareruyaEc/Resource/template/default/Block/js/otc_buy_order_js.twig:145` | RG-009,015（期待は設計どおり10分でエ |  |
| f08-03 | カスタマイズ | 乖離 | 乖離（pf-eccube3 実装バグ・enterprise で是正） | `app/Plugin/HareruyaEc/Controller/OtcBuyController.php:276, src/Eccube/Controller/Front/Purchase/OtcBuyController.php:404` | RG-014,DV-03 |  |
| f08-03 | カスタマイズ | 乖離 | 乖離（設計は固定15秒・実装は可変オプション）／要実機確認（オプション実値） | `OtcBuyController.php:327, OtcBuyController.php:485` | RG-025 |  |
| f08-03 | カスタマイズ | 乖離 | 乖離（リポ間 挙動非一貫・設計は完了時店舗404を未規定） | `OtcBuyController.php:315, OtcBuyController.php:456` | RG-024 |  |
| m01-01 | 標準 | 乖離 | 乖離（成功履歴の多重登録・最終ログイン日時の毎リクエスト更新＝設計「1件登録」に反する）／要実機確認 | `ec-cube-enterprise/src/Eccube/EventListener/SecurityListener.php:47, src/Eccube/Common/Constant.php:47, SecurityListener` | RG-020,022,044 |  |
| m01-01 | 標準 | 乖離 | 乖離（設計記述と実装のフラグ意味が反転）／要実機確認 | `ec-cube-enterprise/src/Eccube/EventListener/AdminAutoLogoutListener.php:81, src/Eccube/Entity/Member.php:121` | RG-040 |  |
| m01-01 | 標準 | 乖離 | 乖離（本番環境で設計の 5 回上限が成立しない・E2E用オーバーライドの残存＝セキュリティ影響）／要実機確認 | `ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:284, app/config/eccube/packages/framework.yaml:75, app/config/` | RG-034,036 |  |
| m01-01 | 標準 | 乖離 | 乖離（最大長のサーバ側非強制＝クライアント側 maxlength のみ）／DV-05,06 の実機挙動確認で確定 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/LoginType.php:39, app/config/eccube/packages/security.yaml:43, src/Eccube/` | RG-004(DV-04,05,06),RG-0 |  |
| m01-02 | 標準 | 乖離 | 乖離（バリデーション欠落・文言分岐が設計どおりに出ない）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/TwoFactorAuthType.php:37, Controller/Admin/Setting/System/TwoFactorAuthCon` | RG-047／§3 DV-04,DV-09,DV |  |
| m01-02 | 標準 | 乖離 | 乖離（誘導漏れ・秘密鍵未設定者に無意味な入力画面）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/TwoFactorAuthController.php:46, EventListener/TwoFactorAut` | RG-010 |  |
| m01-02 | 標準 | 乖離 | 乖離（表示位置・二重表示）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/TwoFactorAuthController.php:109, src/Eccube/Resource/templ` | RG-028 |  |
| m01-02 | 標準 | 乖離 | 乖離（正本内不整合・設計記述の死文）／要実機確認・設計要修正 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/TwoFactorAuthController.php:93` | RG-026 |  |
| m02-01 | 標準 | 乖離 | 乖離（設計が規定する拡張点が実装で機能しない）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:171` | RG-024 |  |
| m02-01 | 標準 | 乖離 | 乖離（設計書内部矛盾・DB操作節の記述誤り）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:104` | RG-019・§5「登録内容／更新内容／削除」= |  |
| m02-02 | 標準 | 乖離 | 乖離（CSRF不成立時の応答形式が設計の「JSONエラー相当の本文」と異なる／設計・実装いずれの誤りかは要判断）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:213, ec-cube-enterprise/src/Eccube/Controller/Abstrac` | RG-030（RG-029・RG-031と対比） |  |
| m02-02 | 標準 | その他 | flush" src/Eccube/Controller/Admin/AdminController.php` → 0件）。dtb_order への登録・更新は行われない | `ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:369` | **乖離（設計書DB操作節の誤記＝参照系の記述と |  |
| m02-03 | 標準 | 乖離 | 乖離（正本の記述誤り・参照系に登録/更新の副作用を規定）／設計書側の是正が必要／要実機確認 | `—` | RG-038（§1・§5にも注記） |  |
| m02-03 | 標準 | 乖離 | 乖離（正本の記述矛盾・週間区間の開始境界）／設計書側の是正が必要／要実機確認 | `—` | RG-008・§3 DV-01,DV-02,DV |  |
| m02-03 | 標準 | 乖離 | 乖離候補（縦軸0基点指定のキー名不一致）／要実機確認（Chart.jsのバージョン固有の表示仕様の細部は正本 :231 で対象外のため、実機で目盛り基点を確認） | `—` | RG-022・RG-012 |  |
| m02-03 | 標準 | 乖離 | 乖離候補（ツールチップの桁区切り二重適用）／要実機確認（Chart.jsの`formattedValue`の実際の返却値に依存。正本 :231 によりChart.jsのバージョン固有仕様は本書対象外のため実機で表示を確認） | `—` | RG-021 |  |
| m02-04 | 標準 | 乖離 | 乖離（正本のDBカラム表・集計条件の誤記／在庫数量の所在テーブル相違）／要実機確認 | `—` | RG-003（DV-01〜09）,DV-15 |  |
| m02-04 | 標準 | 乖離 | 乖離（正本の集計条件が限定を落としている＝記載漏れ）／要実機確認 | `—` | RG-001,RG-003,DV-15 |  |
| m02-04 | 標準 | 乖離 | 乖離（正本 DB操作節の定型注入誤記＝本機能に不適合。参照系との自己矛盾）／要実機確認 | `—` | RG-021,RG-031 |  |
| m02-05 | 標準 | その他 | info_url" ec-cube-enterprise/.env ec-cube-enterprise/app/config/eccube/packages/.yaml` → 当該行のみ）、上書きには設定ファイル自体の編集または追加のパラメータ定義を要する | `ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:165` | **乖離（設計が述べる「環境別設定での置き換え」 |  |
| m02-05 | 標準 | 乖離 | 乖離（「そのまま出力」の記述精度不足・HTMLソース等値照合時に不一致となりうる）／要実機確認（`&` 等を含む設定値での HTML ソースおよび実リクエストURLの確認が必要） | `ec-cube-enterprise/src/Eccube/Resource/template/admin/index.twig:311` | RG-003（DS-02,DS-04）,RG-0 |  |
| m02-05 | 標準 | その他 | trans }}`（訳語は `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1891` `admin.home.news_title: お知らせ`）、`:310` `card-bo | `ec-cube-enterprise/src/Eccube/Resource/template/admin/index.twig:304` | link_list_wrap" index.tw |  |
| m02-05 | 標準 | 乖離 | 乖離なし | `ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:102` | RG-001,002,026,034,035 |  |
| m02-06 | 標準 | 乖離 | 乖離（レスポンス処理例外でホーム画面全体が落ちる）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:189, src/Eccube/Service/PluginApiService.php:127` | RG-007,011 |  |
| m02-06 | 標準 | 乖離 | 乖離（欠落時の判定が未定義・購入導線へ倒れる恐れ）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/PluginApiService.php:155` | RG-041, DV-09 |  |
| m02-06 | 標準 | 乖離 | 乖離（対応バージョン項目欠落でホーム画面全体が落ちる）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/PluginApiService.php:309` | RG-019, DV-08,DV-09 |  |
| m02-06 | 標準 | その他 | trans }}</a>{ }}`）。問い合わせURLがあるプラグインのモーダルで、ボタン直後に文字列 `{ }}` がそのまま描画される。設計のモーダル内容に存在しない表示物 | `ec-cube-enterprise/src/Eccube/Resource/template/admin/Store/plugin_detail_modal.twig:26` | **乖離（テンプレート残骸の意図しない描画）／要 |  |
| m02-06 | 標準 | 乖離 | 乖離（認証キー送信路のピア検証無効＝秘密値の保護不足）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/PluginApiService.php:257` | RG-002,037 |  |
| m03-06 | カスタマイズ | 乖離 | 乖離（オラクル内部の参照先誤り）／要仕様確認 | `—` | RG-008 |  |
| m03-06 | カスタマイズ | 乖離 | 乖離（内部差・セッション互換）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:256, pf-eccube3/app/Plugin/HareruyaE` | RG-027 |  |
| m03-06 | カスタマイズ | 乖離 | 乖離候補（カスタマイズ項目の値汚染リスク）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:336` | RG-016,017 |  |
| m03-08 | カスタマイズ | 乖離 | 乖離疑義（要実機確認・card_conditionマスタ順序に依存） | `src/Eccube/Repository/ProductClassRepository.php:100` | RG-008 |  |
| m03-08 | カスタマイズ | その他 | number_format`）・ヘッダ `:8`（`admin.product.standard_price`） | `index.twig:96` | **設計どおり✓** |  |
| m03-08 | カスタマイズ | 乖離 | 乖離疑義（要実機確認・NULL属性の廃止規格が不可視） | `ProductClassRepository.php:312` | RG-002,010 |  |
| m03-09 | カスタマイズ | 乖離 | 乖離（遷移先の差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductClassController.php:263` | RG-044 |  |
| m03-09 | カスタマイズ | 乖離 | 乖離（メッセージキー/文言の差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductClassController.php:262` | RG-043,044 |  |
| m03-09 | カスタマイズ | 乖離 | 乖離（保護欠落・データ破壊リスク）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductClassController.php:265, ec-cube-enterprise/src/Eccube/Ser` | RG-047 |  |
| m03-09 | カスタマイズ | 乖離 | 乖離（削除方式・復元不能）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Admin/Product/ProductClassDeleteAction.php:63, ec-cube-enterprise/src/Eccube/Entit` | RG-048 |  |
| m03-09 | カスタマイズ | その他 | スマレジ商品コードは ①シングルカードの場合は読み取り専用・その他は編集可能 ②スマレジ連携フラグをONにした際にコードがない場合はエラー ③シングルカードの場合は自動採番（Excel `0204:L5507`） | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:283, ec-cube-enterprise/src/Eccube/Resource/template/` | trim($smaregiProductCode |  |
| m03-09 | カスタマイズ | 乖離 | 乖離（適用範囲の差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Admin/Product/ProductClassUpdateAction.php:54, ec-cube-enterprise/src/Eccube/Servi` | RG-022,023,031 |  |
| m03-09 | カスタマイズ | 乖離 | 乖離（設計未記載の追加契機）／要実機確認・設計側の追記要否を確認 | `ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/ProductClass/edit.twig:190` | RG-029,030 |  |
| m03-09 | カスタマイズ | 乖離 | 乖離（URL体系の差・内部差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductClassController.php:72` | RG-001〜004,043,044,047,0 |  |
| m03-09 | カスタマイズ | 乖離 | 乖離（必須の差）／要実機確認・Excel必須列との整合を設計側で確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:277` | RG-037 |  |
| m03-10 | カスタマイズ | 乖離 | 乖離（Excel必須 vs 実装/詳細設計 任意）／要実機確認 | `src/Eccube/Form/Type/Admin/BulkUpdateProductPriceDetailType.php:30` | RG-004(DV2-2) |  |
| m03-10 | カスタマイズ | 乖離 | 乖離（全体原子性の欠如・部分コミット）／要実機確認 | `BulkUpdateProductPriceType.php:89, src/Eccube/Controller/Admin/Product/ProductBulkUpdateBuyPriceController.php:85, src/E` | RG-006,030,031 |  |
| m03-11 | カスタマイズ | 乖離 | 乖離（詳細設計の画像処理記述が実装と別物・保存パス形式も相違）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/CategoryController.php:294` | RG-008,017,031 |  |
| m03-11 | カスタマイズ | 乖離 | 乖離（設計どおりの後始末が無く孤児ファイルが残留）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/CategoryController.php:190` | RG-036 |  |
| m03-11 | カスタマイズ | 乖離 | 乖離（設計に無い入口ルート群・`load` 系の認可が設計未定義）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/CategoryController.php:294` | RG-008,017,031 |  |
| m03-12 | カスタマイズ | 乖離 | 乖離（詳細設計の記述欠落／出力値が空セル・0 のいずれかで未確定）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/CategoryController.php:784` | RG-004（§3 DC-05） |  |
| m03-12 | カスタマイズ | 乖離 | 乖離（Excelが委譲した定義が詳細設計に不在＝設計書間の欠落。実装は存在するがオラクル化できない）／要実機確認 | `ec-cube-enterprise/app/DoctrineMigrations/Version20260401120000.php:42` | RG-002,003（列⇔フィールド対応の裏取り |  |
| m03-12 | カスタマイズ | 乖離 | 乖離（ヘッダ文言の表記未確定・Excel内でも表記揺れ）／要実機確認 | `ec-cube-enterprise/app/DoctrineMigrations/Version20260401120000.php:46` | RG-001,002,011 |  |
| m03-12 | カスタマイズ | 乖離 | 乖離（内部差・拡張点の消失。設計書が沈黙）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/CategoryController.php:760` | RG-002,027 |  |
| m03-13 | 現行踏襲 | 乖離 | 乖離（カスタマイズ指示の未反映・既存値の意図せぬ上書きリスク）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/TagType.php:103, ec-cube-enterprise/src/Eccube/Resource/template/admin/Pro` | RG-008 |  |
| m03-13 | 現行踏襲 | 乖離 | 乖離（Excel明示の選択肢限定が未強制・URL直指定で回避可能）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/TagController.php:80, ec-cube-enterprise/src/Eccube/Resource/temp` | RG-006 |  |
| m03-13 | 現行踏襲 | 乖離 | 乖離（改行種別の限定＝現行踏襲だがExcel指示より狭い・コード呼称の不一致）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Admin/Product/TagStoreAction.php:52, pf-eccube3/app/Plugin/HareruyaEc/Controller/A` | RG-016,RG-022 |  |
| m03-13 | 現行踏襲 | その他 | $id <= Tag::FIXED_FORM_NUM | `—` |  |  |
| m03-13 | 現行踏襲 | 乖離 | 乖離（設計記述と実挙動の差・rank飛び番/0値の可能性）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Admin/Product/TagStoreAction.php:53, pf-eccube3/app/Plugin/HareruyaEc/Controller/A` | RG-017,RG-018 |  |
| m03-14 | 現行踏襲 | 乖離 | 乖離（Excel基本設計 未充足）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/storage_code.twig:114` | RG-018 |  |
| m03-14 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・削除判定対象とメッセージ鍵の変更）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/StorageCodeController.php:143, ec-cube-enterprise/src/Eccube/Enti` | RG-013,RG-014 |  |
| m03-15 | 現行踏襲 | 乖離 | 乖離（内部差・異常時の部分出力リスク）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/StorageCodeController.php:172` | RG-009,RG-019 |  |
| m03-15 | 現行踏襲 | 乖離 | 乖離（内部差・レスポンス送出方式）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/StorageCodeController.php:192` | RG-009 |  |
| m03-16 | 現行踏襲 | 乖離 | 乖離（設計/現行踏襲違反・入口URL変更）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/StorageCodeController.php:224` | RG-001,016,017,018 |  |
| m03-16 | 現行踏襲 | 乖離 | 乖離（設計に無い検証の存在＝設計追記または仕様確認が必要）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/StorageCodeCsv.php:32, ec-cube-enterprise/src/Eccube/Service/Csv/StorageCod` | §5「相関バリデーション＝要判定」 |  |
| m03-16 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・ID空/0の判定経路）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/StorageCodeCsv.php:41, ec-cube-enterprise/src/Eccube/Service/Csv/StorageCod` | RG-006（DV-01） |  |
| m03-17 | 現行踏襲 | 乖離 | 乖離（Excel設計違反・入力範囲の両端不一致）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/TagSalesAnalysisType.php:52, pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Ad` | RG-015・§3 DV-07,DV-08,DV |  |
| m03-17 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・一意制約の消失／設計記載の分岐が到達不能の疑い）／要実機確認 | `ec-cube-enterprise/src/Eccube/Entity/Master/MtbTagSalesAnalysis.php:27, pf-eccube3/app/Plugin/HareruyaEc/Resource/doctri` | RG-017・§3 DV-05 |  |
| m03-17 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・メッセージキー）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/TagSalesAnalysisController.php:104, ec-cube-enterprise/src/Ecc` | RG-019 |  |
| m03-17 | 現行踏襲 | 乖離 | 乖離（Excel概要の記載不整合＝機能範囲の誤記の疑い）／要実機確認・設計側の確認要 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/TagSalesAnalysisController.php:51` | §0（CSVは別範囲） |  |
| m03-17 | 現行踏襲 | 乖離 | 乖離（詳細設計の現行側テーブル名誤記・「同一」判定の誤り）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/doctrine/Plugin.HareruyaEc.Entity.MtbTagSalesAnalysis.dcm.yml:37, ec-cube-ente` | RG-020,RG-021（SEED定義の紐付け |  |
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
| m03-21 | 現行踏襲 | その他 | 実装の実態（repo:file:line） | `—` |  |  |
| m03-21 | 現行踏襲 | その他 | 未実装（両リポ共通）: 画面フォームは NotBlank のみで Range/PositiveOrZero 検証が無い — 現行 `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/A | `—` |  |  |
| m03-21 | 現行踏襲 | その他 | 記述と矛盾（両リポとも検証あり）: 移行先 `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ShelfNumberMasterImportHandler | `—` |  |  |
| m03-21 | 現行踏襲 | その他 | 現行に未実装: 現行は一覧を全件描画し件数セレクト・ページャを持たない — `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ShelfNumberCo | `—` |  |  |
| m03-21 | 現行踏襲 | その他 | 未強制: 移行先はクエリ `page_count` を整数化してそのままセッションへ格納し許容一覧との照合が無い — `ec-cube-enterprise/src/Eccube/Controller/Admin/Pro | `—` |  |  |
| m03-21 | 現行踏襲 | その他 | 差異: 移行先は `admin.common.delete_complete` — `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ShelfNumberC | `—` |  |  |
| m03-21 | 現行踏襲 | その他 | 差異: 移行先は商品規格 `ProductClasses` の有無で判定 — `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ShelfNumberCont | `—` |  |  |
| m03-21 | 現行踏襲 | その他 | 差異: 移行先は BOM を付与しない — `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ShelfNumberController.php:214-22 | `—` |  |  |
| m03-22 | 現行踏襲 | 乖離 | 乖離（実装がExcel上限1024を超過許容）／要実機確認 | `src/Eccube/Entity/Master/MtbSellGroup.php:73, src/Eccube/Form/Type/Admin/ProductSellGroupType.php:46, app/config/eccube/` | RG-019(DV-08) |  |
| m03-22 | 現行踏襲 | 乖離 | 乖離疑義（フロント連動の実装到達は本機能外・実機再現で確定）／要実機確認 | `src/Eccube/Controller/Admin/Product/SellGroupController.php:59, ProductSellGroupType.php:67, MtbSellGroup.php:149` | RG-002,RG-029 |  |
| m03-23 | 現行踏襲 | 乖離 | 乖離疑義（Excelの「検索項目追加」は変更後レンジのみで変更前レンジ検索は未提供・要実機/仕様確認） | `BuySalePriceHistoryController.php:45, DtbPriceHistoryRepository.php:427` | RG-014,026／§5 変更前レンジ要判定 |  |
| m03-23 | 現行踏襲 | 乖離 | 乖離（詳細設計 L346 の記述誇張・実装/ Excel は公開のみ） | `SearchProductType.php:110` | RG-007 |  |
| m03-23 | 現行踏襲 | その他 | 'code' | `BuySalePriceHistoryController.php:135` | 'card_condition')`のみ分岐、` |  |
| m03-23 | 現行踏襲 | 乖離 | 乖離（Excel の最大値欄表記が曖昧・実装は Length 8 桁）／要実機確認 | `SearchProductType.php:225, app/config/eccube/packages/eccube.yaml:126` | RG-030,DA-06,DA-07 |  |
| m03-24 | 現行踏襲 | 乖離 | 乖離（null安全性の非対称・要実機確認） | `BuySalePriceHistoryController.php:281` | RG-004 |  |
| m03-24 | 現行踏襲 | 乖離 | 乖離疑義（仕様追認済み・相互運用は要実機確認） | `CsvExportService.php:290` | RG-010 |  |
| m03-25 | 現行踏襲 | 乖離 | 乖離（ルート名・パラメータ名の変更／要実機確認） | `pf-eccube3/app/Plugin/HareruyaEc/Repository/ProductClassRepository.php:319, ec-cube-enterprise/src/Eccube/Controller/Adm` | RG-016 |  |
| m03-25 | 現行踏襲 | 乖離 | 乖離（詳細設計の記述誤り・実装は正・要設計書修正） | `pf-eccube3/.../ProductClassRepository.php:311, ec-cube-enterprise/.../ProductClassRepository.php:2915` | RG-004 |  |
| m03-26 | カスタマイズ | 乖離 | 乖離（オラクル内部矛盾・NM部門は到達不能） | `—` | RG-033 |  |
| m03-26 | カスタマイズ | 乖離 | 乖離（仕様未確定TODO）／要実機確認 | `src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:199` | RG-030,031,032 |  |
| m03-26 | カスタマイズ | 乖離 | 乖離（設計書未記載の実装列）／軽微 | `CardCsvController.php:348` | RG-018,043 |  |
| m03-27 | カスタマイズ | 乖離 | 乖離（Excel L3195のセール外反映が新規で欠落）／要実機確認 | `src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:586` | RG-009 |  |
| m03-27 | カスタマイズ | 乖離 | 乖離疑義（サーバ通信による事前確認の実装到達が不明）／要実機確認 | `.../ProductGoodsImportHandler.php:604` | RG-013,RG-014 |  |
| m03-27 | カスタマイズ | 乖離 | 乖離（現行踏襲列がサイレントに欠落・詳細設計も追認）／要実機確認 | `.../ProductGoodsImportHandler.php:112` | RG-029 |  |
| m03-28 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・設計了解済みだが対象商品範囲が拡大／Excelは沈黙）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1459` | RG-025,020 |  |
| m03-28 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・エラー表示位置と再送信挙動およびログ/フラッシュ文言が変化）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductTagCsvController.php:124` | RG-015,030,045,046 |  |
| m03-28 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・上限直下の大量取込がタイムアウトし得る）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductTagCsvController.php:111` | RG-018,023 |  |
| m03-29 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・支店連携の欠落＝CSV経由のタグ更新が支店側へ伝播しない）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductTagSalesAnalysisUpdateImportHandler.php:49` | RG-067 |  |
| m03-29 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・スキーマ由来の意図的変更だがExcel/詳細設計に削除済み商品の扱いの記述なし）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1459` | RG-032 |  |
| m03-29 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・雛形ファイル名変更）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/TagSalesAnalysisCsvController.php:50` | RG-018 |  |
| m03-29 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・メッセージキー/ログ文言変更）／要実機確認 | `ec-cube-enterprise/.../TagSalesAnalysisCsvController.php:141` | RG-038,RG-041,RG-042 |  |
| m03-29 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・PRG化とエラー提示形式の変更）／要実機確認 | `ec-cube-enterprise/.../TagSalesAnalysisCsvController.php:124` | RG-041,RG-051 |  |
| m03-29 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・大量CSVでのタイムアウトリスク）／要実機確認 | `ec-cube-enterprise/.../TagSalesAnalysisCsvController.php:111` | RG-050 |  |
| m03-30 | カスタマイズ | 乖離 | 乖離（セール区分の販売価格ロジック差・カスタマイズ未達） | `ProductPriceImportHandler.php:327` | RG-001,002 |  |
| m03-30 | カスタマイズ | 乖離 | 乖離疑義（同期呼び出し vs 遅延連携・実機再現で確定） | `ProductPriceImportHandler.php:399` | RG-008 |  |
| m03-31 | 現行踏襲 | 乖離 | 乖離（機能欠落・移植漏れ）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:87` | RG-042 |  |
| m03-31 | 現行踏襲 | 乖離 | 乖離（入口URL・レスポンス方式・エラー表示形態の差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php:75` | RG-001,013,014,019,020,0 |  |
| m03-31 | 現行踏襲 | 乖離 | 乖離（必須/任意の差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php:213` | RG-002,021（DV-06） |  |
| m03-31 | 現行踏襲 | 乖離 | 設計未確定＋乖離候補／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:359` | RG-022,023,024,030 |  |
| m03-31 | 現行踏襲 | 乖離 | 乖離候補（現行踏襲の入力チェック消失）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:401` | DV-12（要判定） |  |
| m03-32 | カスタマイズ | 乖離 | 乖離（Excel規定値と実装上限の不一致・Excel記載自体も桁/値が曖昧）／要実機確認・Excel記載の確認要 | `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:434` | RG-022（§3 DV-03,DV-04） |  |
| m03-32 | カスタマイズ | 乖離 | 乖離（Excel規定の最大文字数が未強制）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:58, ec-cube-enterprise/src/Eccube/Entity/` | RG-023（§3 DV-11） |  |
| m03-32 | カスタマイズ | 乖離 | 乖離（Excel要求の表示手段が確定できず・未参照フラグの残置）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:101, ec-cube-enterpri` | RG-010 |  |
| m03-32 | カスタマイズ | 乖離 | 乖離（詳細設計・文言が謳う公開状態の絞り込みが実装に不在）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2208, ec-cube-enterprise/src/Eccube/Resource/locale/` | RG-038 |  |
| m03-33 | カスタマイズ | 乖離 | 乖離（フォーマット列数 設計7 vs 実装5） | `SaleHighPriceImportHandler.php:165, ProductSaleHighPriceCsvController.php:180` | RG-030,011(DV-05) |  |
| m03-34 | 現行踏襲 | 乖離 | 乖離（他列不変の原則違反・意図しない販売制限緩和）／要実機確認（既存NULL行の実在有無と業務影響） | `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbProductSubRepository.php:208, pf-eccube3/app/Plugin/HareruyaEc/Service/Cs` | RG-017,019 |  |
| m03-35 | カスタマイズ | 乖離 | 乖離（必須チェック欠落。設計上は入力不可のはずの空値が意図せぬNULLクリアを起こしうる）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductSectionUpdateImportHandler.php:117, ec-cube-enterprise/s` | RG-011（DV-05） |  |
| m03-35 | カスタマイズ | 乖離 | 乖離（入力値の意味がID→コードへ変質・書式検証欠落）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductSectionUpdateImportHandler.php:110, pf-eccube3/app/Plugi` | RG-011（DV-07）,RG-006 |  |
| m03-35 | カスタマイズ | 乖離 | 乖離（項目名不一致・ヘッダ対応に影響）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSectionCsvController.php:181` | RG-005,RG-013 |  |
| m03-35 | カスタマイズ | 乖離 | 乖離（現行差・PRG化。機能区分カスタマイズのため意図的変更の可能性あり）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:826, ec-cube-enterprise/src/Eccube/Co` | RG-031 |  |
| m03-35 | カスタマイズ | 乖離 | 乖離（現行差・メッセージキー変更）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:852, ec-cube-enterprise/src/Eccube/Co` | RG-006,RG-031 |  |
| m03-35 | カスタマイズ | 乖離 | 乖離（現行差・ログ文言変更）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:850, ec-cube-enterprise/src/Eccube/Co` | RG-034 |  |
| m03-35 | カスタマイズ | 乖離 | 乖離（上限判定の語義差・境界±1／現行の外部コマンド実行は要セキュリティ確認）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/AbstractController.php:364, pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/P` | RG-010（DV-02,DV-03,DV-13 |  |
| m03-36 | 現行踏襲 | その他 | ProductBuyDiscountImport | `app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1486, app/Plugin/HareruyaEc/Service/Csv/Importer` | product_buy_discount_csv |  |
| m03-36 | 現行踏襲 | 乖離 | 乖離（現行実装バグ・設計が明記） | `app/Plugin/HareruyaEc/Repository/DtbProductSubRepository.php:69, .../ProductBuyDiscountImportHandler.php:176` | RG-018 |  |
| m03-37 | 現行踏襲 | 乖離 | 乖離（設計書の主題取り違え・M03-37の正本欠落）／最優先で設計是正が必要 | `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/Admin/ProductServiceProvider.php:178, pf-eccube3/app/Plugin/HareruyaEc/` | RG-001,002,010,011〜015,0 |  |
| m03-37 | 現行踏襲 | 乖離 | 乖離（詳細設計の記述欠落＋境界定義の曖昧）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:391` | RG-003, DV-01〜03,07 |  |
| m03-37 | 現行踏襲 | 乖離 | 乖離（設計文言の曖昧・重複抑止対象が不明確）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/StorageCodeImportHandler.php:262` | RG-004 |  |
| m03-37 | 現行踏襲 | 乖離 | 乖離（副作用・外部連携の設計欠落／正本の否定文と実装が不整合）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/StorageCodeImportHandler.php:60` | RG-029,020 |  |
| m03-37 | 現行踏襲 | 乖離 | 乖離（エラー処理の設計欠落・全体中断が未記載）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/StorageCodeImportHandler.php:144` | DV-08,09 |  |
| m03-38 | カスタマイズ | 乖離 | 乖離（オラクル間不一致・Excel内部矛盾。運用者がExcel記載どおり0で「非公開」を投入すると全行エラー／2で誤って非公開化しうる）／要実機確認・設計側の確定が必要 | `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStatusUpdateImportHandler.php:122, ec-cube-enterprise/sr` | RG-014, RG-017(DV-11,DV- |  |
| m03-38 | カスタマイズ | 乖離 | 乖離（Excelの区分ID表記の誤り疑い・#3と同根）／要実機確認・設計側の確定が必要 | `ec-cube-enterprise/src/Eccube/Entity/Master/ProductStatus.php:61, /ProductStatusUpdateImportHandler.php:122, /ProductSta` | RG-019, RG-017(DV-05,DV- |  |
| m03-38 | カスタマイズ | 乖離 | 乖離（現行踏襲差・遷移方式と完了文言の変更。エラー一覧の見え方が変わる）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStatusCsvController.php:171` | RG-022, RG-034 |  |
| m03-38 | カスタマイズ | その他 | \n | `ec-cube-enterprise/src/Eccube/Controller/AbstractController.php:369` | \r\n |  |
| m03-38 | カスタマイズ | 乖離 | 乖離（Excel未規定・無言スキップの通知欠落）／要実機確認・設計側の確定が必要 | `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStatusUpdateImportHandler.php:83` | RG-019, RG-018 |  |
| m03-40 | 現行踏襲 | 乖離 | 乖離（詳細設計の記述誤り＝設計書バグ）／要実機確認 | `—` | RG-019,021,DV-07 |  |
| m03-40 | 現行踏襲 | 乖離 | 乖離（Excel必須◯ vs 実装は任意・空欄でNULL更新）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ShelfNumberImportHandler.php:194, ec-cube-enterprise/src/Ecc` | DV-06 |  |
| m03-40 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・書式検証の追加）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:478` | DV-07,RG-020 |  |
| m03-40 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・抽出条件の緩和）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2153` | RG-017,018 |  |
| m03-40 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・PRG化）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1435, ec-cube-enterprise/src/Eccube/C` | RG-025,RG-013,RG-020 |  |
| m03-40 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・メッセージキー変更）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1459, ec-cube-enterprise/src/Eccube/C` | RG-006 |  |
| m03-40 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・雛形名/見出しの変更）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:499, ec-cube-enterprise/src/Eccube/Co` | RG-005,RG-002 |  |
| m03-41 | カスタマイズ | 乖離 | 乖離（設計書の機能帰属誤り／M03-41の実体URL不定）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:673, ec-cube-enterprise/src/Eccube/Co` | RG-004,005,006,003 |  |
| m03-41 | カスタマイズ | 乖離 | 乖離（雛形の列構成・ファイル名差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1212, ec-cube-enterprise/src/Eccube/C` | RG-007 |  |
| m03-41 | カスタマイズ | 乖離 | 乖離（削除フラグ列の有無差・機能範囲不定）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:736, CategoryCsvController.php:188` | RG-038 |  |
| m03-41 | カスタマイズ | 乖離 | 乖離（最大長の未検証・Excel規定との矛盾）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/CategoryCsvImportHandler.php:37` | RG-018(DV-08,09,11,12),D |  |
| m03-41 | カスタマイズ | 乖離 | 乖離（階層のCSV値採用＝Excelカスタマイズ規定違反）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:799, ec-cube-enterprise/src/Eccube/Se` | RG-015,018(DV-31) |  |
| m03-44 | 新規実装 | その他 | 詳細設計 `:313`/`:319` はDB関連を「実装確認値」として `dtb_product_class.standard_price / price02`・`dtb_csv_import_history.membe | `../ec-cube-enterprise/src/Eccube/Entity/Master/MtbCsvImportType.php:28` |  |  |
| m03-44 | 新規実装 | その他 | 詳細設計 `:308`/`:315` はプロセスフロー・例外処理を現行挙動として記述（アップロード→検証→登録→履歴） | `../ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:50` |  |  |
| m03-44 | 新規実装 | その他 | 詳細設計 `:313`/`:319` は基準価格＝`standard_price`／販売価格＝`price02`／履歴＝`dtb_csv_import_history`（member_id記録）と断定 | `—` |  |  |
| m03-45 | カスタマイズ | 乖離 | 乖離（詳細設計の内部矛盾・偽OUT誘発）／設計書修正要 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/CategoryController.php:258` | RG-017,022,024,026,036〜0 |  |
| m03-45 | カスタマイズ | 乖離 | 乖離（詳細設計が旧実装を記述・DB負荷/件数依存の説明が誤り）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/CategoryRepository.php:133, ec-cube-enterprise/src/Eccube/Controller/Admin/Prod` | RG-001,009 |  |
| m03-45 | カスタマイズ | 乖離 | 乖離（設計記述の誤り・他階層の表示ランクが動く副作用が未記述）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/CategoryRepository.php:396` | RG-036 |  |
| m03-45 | カスタマイズ | 乖離 | 乖離（詳細設計が実装と別方式・未記載ルートあり）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/CategoryController.php:294` | RG-032,055,DV-10〜12,14,1 |  |
| m03-45 | カスタマイズ | 乖離 | 乖離（設計の記述漏れ・CSV取込との往復整合に影響）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/CategoryController.php:784` | RG-041 |  |
| m03-45 | カスタマイズ | 乖離 | 乖離（未検証の異常系・500の可能性）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/CategoryController.php:726` | RG-017,019 |  |
| m03-45 | カスタマイズ | 乖離 | 乖離（Excel指定のUI部品/操作起点の不履行・軽微）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/category.twig:69, ec-cube-enterprise/src/Eccube/Resource/t` | RG-011,007 |  |
| m03-45 | カスタマイズ | 乖離 | 乖離（Excel誤記・実装は妥当）／設計書修正要 | `ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/category.twig:93` | RG-014,015 |  |
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
| m04-03 | カスタマイズ | 乖離 | 乖離（実装バグ疑い・必須未達） | `src/Eccube/Form/Type/Admin/StockBulkApprovalType.php:92` | RG-006 |  |
| m04-03 | カスタマイズ | 乖離 | 乖離（詳細設計条件付き記述 vs Excel/実装の無条件必須） | `src/Eccube/Form/Type/Admin/StockBulkApprovalItemType.php:52` | RG-013(DV-05) |  |
| m04-03 | カスタマイズ | 乖離 | 乖離（Excel未規定の追加制約・要実機確認） | `StockBulkApprovalType.php:149` | RG-013 |  |
| m04-04 | 新規実装 | 乖離 | 要業務確認（確定乖離ではない）: Excel識別ID順(b)＝主たる候補読解では実装＝Excelで整合し、詳細設計L293/L313も列の並び順を実装正とする。物理行記載順(a)をCSV列順として唯一正とみなす読解でのみ差異が生じるため、どちらの読解を採るかを | `src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:44` | RG-001,002 |  |
| m04-05 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・エンドポイント路線変更/POST廃止/書式制約追加）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockListController.php:275` | RG-017,025,DV-04 |  |
| m04-05 | 現行踏襲 | 乖離 | 乖離（現行踏襲の前提破綻・現行に在庫CSV種別/分岐が存在しない）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/CustomExportCsvController.php:24, pf-eccube3/src/Eccube/Entity/Master/` | RG-001,003,006 |  |
| m04-05 | 現行踏襲 | 乖離 | 乖離（設計沈黙部の実装追加条件）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockListController.php:287` | RG-024,DV-03 |  |
| m04-05 | 現行踏襲 | 乖離 | 乖離（設計沈黙部の実装追加前提・要事前検索リダイレクト）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockListController.php:278` | RG-027 |  |
| m04-05 | 現行踏襲 | 乖離 | 乖離（設計未規定・実装依存のファイル名/形式差）／要実機確認・参考 | `ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:59` | RG-028 |  |
| m04-09 | 新規実装 | 乖離 | 乖離（上限未強制）／要実機確認 | `src/Eccube/Form/Type/Admin/StockMoveNewType.php:75, src/Eccube/Form/Type/Admin/StockTransferNewType.php:45` | RG-019,030（§5 文字列長=要判定） |  |
| m04-09 | 新規実装 | 乖離 | 乖離疑義（上限値の一致 要実機確認） | `src/Eccube/Form/Type/Admin/StockMoveQuantityType.php:40, StockTransferNewDetailType.php:41` | RG-004,024（DV-04＝件数外） |  |
| m04-09 | 新規実装 | 乖離 | 乖離（項目別エラーの汎用化）／要実機確認 | `StockTransferStoreAction.php:91` | RG-028 |  |
| m04-09 | 新規実装 | 乖離 | 乖離（ステータス数値IDがExcel L6635-6637 vs 実装 L327 で不一致）／要実機確認 | `src/Eccube/Entity/Master/MtbStockMoveTransferStatus.php:29` | RG-014,021（SEED §2 ステータス |  |
| m04-10 | 新規実装 | 乖離 | 乖離（移動/振替の起点分岐が実装に存在しない）／要実機確認 | `StockMoveTransferListCsvExportService.php:171` | RG-020 |  |
| m04-11 | 現行踏襲 | 乖離 | 乖離疑義（移動・振替限定 未強制）／要実機確認 | `../pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Product/HistoryController.php:107, ../pf-eccube3/app/Plugin/Hareruy` | RG-002,003 |  |
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
| m04-16 | 現行踏襲 | 乖離 | 乖離（詳細設計HTMLの起動形態記述が陳腐化・実装はExcel★どおり✓） | `src/Eccube/Controller/Admin/Stock/StockListController.php:248, src/Eccube/Resource/template/admin/Stock/stock_list_index` | RG-013,018 |  |
| m04-16 | 現行踏襲 | 乖離 | 乖離疑義（販売/入庫の合算方式・要実機確認） | `StockRecommendCsvExportService.php:140` | RG-009,005 |  |
| m04-16 | 現行踏襲 | 乖離 | 乖離疑義（オラクル未規定・要実機確認） | `StockListController.php:252` | §5 要判定 |  |
| m04-16 | 現行踏襲 | 乖離 | 乖離（起動形態差に伴う上書き非該当・要実機確認） | `StockRecommendCsvExportService.php:63` | §5 要判定 |  |
| m04-16 | 現行踏襲 | 乖離 | 乖離（詳細設計HTMLの権限節が陳腐化・実装は管理画面認証下✓） | `StockListController.php:248` | RG-018 |  |
| m04-17 | カスタマイズ | 乖離 | 乖離（詳細設計HTMLが旧画面・Excelが新画面）／本書はExcelを正 | `app/Plugin/HareruyaEc/Controller/Admin/Product/HistoryController.php:45, src/Eccube/Controller/Admin/Stock/StockHistoryC` | 全般(§1前提) |  |
| m04-17 | カスタマイズ | 乖離 | 乖離（Foil絞り込み未適用） | `src/Eccube/Form/Type/Admin/StockHistoryType.php:175, src/Eccube/Repository/DtbStockHistoryRepository.php:96` | RG-007 |  |
| m04-17 | カスタマイズ | 乖離 | 乖離（相関from>toチェック4項目欠落） | `StockHistoryType.php:486` | RG-030(DV-05,07,08,09) |  |
| m04-18 | カスタマイズ | 乖離 | 乖離（0件時にエラーで、ヘッダ行のみ正常出力が未達） | `StockHistoryCsv.php:55, StockHistoryController.php:315` | RG-010 |  |
| m04-18 | カスタマイズ | 乖離 | 乖離（列名/意味相違・要設計確認） | `StockHistoryController.php:389, StockHistoryCsv.php:106` | RG-005 |  |
| m04-18 | カスタマイズ | 乖離 | 乖離（設計は監査ログ追加なしだが実装はlog_info出力）／軽微 | `StockHistoryCsv.php:78` | RG-019 |  |
| m04-19 | カスタマイズ | 乖離 | 乖離（カスタマイズ未達・対象範囲差） | `app/Plugin/HareruyaEc/Repository/DtbStockoutHistoryRepository.php:40` | RG-005 |  |
| m04-19 | カスタマイズ | 乖離 | 乖離疑義（要実機確認） | `DtbStockoutHistoryRepository.php:64` | RG-006 |  |
| m04-19 | カスタマイズ | 乖離 | 乖離（入口/導線差） | `app/Plugin/HareruyaEc/ServiceProvider/Admin/ProductServiceProvider.php:236` | RG-007 |  |
| m04-19 | カスタマイズ | 乖離 | 乖離疑義（既定値・要実機確認） | `app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:70` | RG-016 |  |
| m04-19 | カスタマイズ | その他 | 所在記録（本機能対象外・要別機能検証） | `app/Plugin/HareruyaEc/Controller/Admin/Order/EditController.php:468` | （§0 対象外） |  |
| m04-20 | 新規実装 | 乖離 | 乖離（列名/粒度違い） | `src/Eccube/Controller/Admin/Stock/StockHistoryController.php:447, src/Eccube/Service/Csv/StockHistoryDisposalCsv.php:106` | RG-001,003 |  |
| m04-20 | 新規実装 | 乖離 | 乖離（出力列欠落・射影で脱落） | `StockHistoryController.php:440, StockHistoryDisposalCsv.php:108, StockHistoryDisposalCsv.php:65` | RG-001,006 |  |
| m04-20 | 新規実装 | 乖離 | 乖離（取得方式・要実機確認） | `StockHistoryController.php:337, src/Eccube/Repository/DtbStockHistoryRepository.php:404` | RG-004 |  |
| m04-20 | 新規実装 | 乖離 | 要実機確認（乖離ではない） | `DtbStockHistoryRepository.php:411` | RG-005 |  |
| m04-21 | カスタマイズ | 乖離 | 乖離（上限値5010≠10000） | `ProductCsvController.php:391` | RG-018 |  |
| m04-22 | 新規実装 | 乖離 | 乖離（上限値不一致・両方向にズレ） | `src/Eccube/Controller/AbstractController.php:364, StockMoveTransferController.php:252` | RG-009,023 |  |
| m04-22 | 新規実装 | 乖離 | 乖離（必須が任意になっている） | `src/Eccube/Form/Type/Admin/StockTransferCsvImportType.php:88` | RG-019 |  |
| m04-22 | 新規実装 | 乖離 | 乖離疑義（拡張子検証なし・間接排除）／要実機確認 | `StockMoveCsvImportType.php:115, StockTransferCsvImportType.php:105` | RG-007,021 |  |
| m04-24 | 新規実装 | 乖離 | 乖離疑義（文言/位置・移動指示ID併記） | `StockMoveInstructionController.php:386, StockMoveInstructionCsvImportHandler.php:118` | RG-029 |  |
| m04-24 | 新規実装 | 乖離 | 乖離（原子性未達・部分コミット） | `StockMoveInstructionCsvImportHandler.php:83, StockMoveInstructionController.php:392` | RG-030 |  |
| m04-24 | 新規実装 | 乖離 | 乖離（必須ヘッダ列数の相違） | `StockMoveInstructionCsvImportHandler.php:38` | RG-031 |  |
| m04-24 | 新規実装 | その他 | 実装確認（オラクル外） | `—` | RG-034 |  |
| m04-24 | 新規実装 | 乖離 | 乖離（詳細画面側・参考） | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockMoveInstructionDetailType.php:34` | 対象外(詳細=M04-25) |  |
| m04-25 | 新規実装 | その他 | 機能スコープ整理（送り状CSV=M04-28／雛形=M04-27 廃止）＝M04-25 の設計未記載ではない。本書 §0 対象外 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:317` | §0（旧 RG-023〜033） |  |
| m04-25 | 新規実装 | 乖離 | 乖離（詳細設計HTMLの機能ID誤記） | `StockMoveInstructionController.php:367` | RG-005（雛形取込先は §0 対象外） |  |
| m04-25 | 新規実装 | 乖離 | オラクル内矛盾＋実装乖離（要実機確認） | `—` | RG-015 |  |
| m04-25 | 新規実装 | 乖離 | 乖離疑義（設計 vs 実装の画面帰属差・要実機確認） | `StockMoveInstructionController.php:228` | RG-005 |  |
| m04-25 | 新規実装 | 乖離 | 乖離（廃止設計 vs 実装存置）。期待には使わない（廃止=§0 対象外） | `StockMoveInstructionController.php:334` | §0（旧 RG-031〜033） |  |
| m04-28 | 新規実装 | 乖離 | 乖離（第1列ヘッダー文言差・受注送り状に寄せた意図的変更の可能性）。ゆうプリR取込時に列名解決へ影響しないか要実機確認 | `src/Eccube/Service/Csv/Exporter/StockMoveInstructionLabelCsvExporterService.php:33` | RG-001 |  |
| m04-28 | 新規実装 | 乖離 | 乖離疑義（ゆうプリR互換要件がExcel/実装いずれにも定量記載なく、取込互換は要実機確認） | `—` | RG-006,013 |  |
| m04-31 | カスタマイズ | 乖離 | 乖離（現行バグ・enterpriseで是正）／要実機確認 | `app/Plugin/HareruyaEc/Form/Type/Admin/Product/InventoryPlanType.php:31, src/Eccube/Form/Type/Admin/Stock/InventoryPlanTy` | RG-012,007 |  |
| m04-31 | カスタマイズ | 乖離 | 乖離（必須のサーバ検証欠落・設計内部齟齬）／要実機確認 | `InventoryPlanType.php:26, InventoryPlanType.php:59` | RG-015,DV-05 |  |
| m04-31 | カスタマイズ | 乖離 | 乖離（設計記述の誤解誘発・実効上限は不変） | `InventoryPlanType.php:44` | RG-014,DV-04 |  |
| m04-33 | 新規実装 | 乖離 | 乖離（詳細設計⇔実装・ステータス集合不一致）／要実機確認 | `src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:43, src/Eccube/Entity/Master/MtbStockMov` |  |  |
| m04-34 | 新規実装 | 乖離 | 乖離疑義（マスタ整備依存・要実機確認） | `src/Eccube/Repository/DtbStockMoveTransferRepository.php:244` | RG-008,009,012 |  |
| m04-34 | 新規実装 | 乖離 | 乖離疑義（本店複数フロアモデルとの不整合・要実機確認） | `src/Eccube/Service/Csv/Exporter/RestockListCsvRowFormatter.php:78, src/Eccube/Repository/DtbStockMoveTransferRepository.` | RG-007,023 |  |
| m04-34 | 新規実装 | その他 | オラクル内部矛盾（Excel誤記・逐語引用+L16830で裏取り） | `—` | RG-001 |  |
| m05-02 | カスタマイズ | 乖離 | 乖離（ルート衝突・要実機確認：解決順） | `src/Eccube/Controller/Admin/Order/OrderController.php:385, src/Eccube/Controller/Admin/Order/OrderCsvController.php:193,` | RG-001,013,018,019 |  |
| m05-03 | カスタマイズ | 乖離 | 乖離（カスタマイズ未達・出力側で非会員置換なし）／要実機確認 | `src/Eccube/Service/CsvExportService.php:410, src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderFactory.php:49` | RG-006 |  |
| m05-03 | カスタマイズ | 乖離 | 乖離（エラー処理の実挙動が設計の含意と不一致・破損DL）／要実機確認 | `CustomExportCsvController.php:87, CsvExportService.php:162` | RG-014, DDT DE-03 |  |
| m05-03 | カスタマイズ | 乖離 | 乖離（配送0件で致命例外・防御なし）／要実機確認 | `CsvExportService.php:413` | RG-024 |  |
| m05-04 | カスタマイズ | その他 | 要データ確認（コードバグではない・seedと設定に依存） | `CsvExportService.php:121, OrderController.php:474` | RG-001,005,012 |  |
| m05-04 | カスタマイズ | 乖離 | 乖離（拡張ポイント不整合・詳細設計 L385 も「未使用であることをコードで確認した」と明記＝設計は既知） | `OrderController.php:462, src/Eccube/Event/EccubeEvents.php:175` | RG-002,014 |  |
| m05-04 | カスタマイズ | その他 | Excel文書内不整合（実装バグでない・テスト時は項目表 0203:L2676-2765 の項目名を採用）／要業務確認 | `—` | RG-005 |  |
| m05-05 | カスタマイズ | 乖離 | 乖離（実装バグ・二重BOM） | `CsvExportService.php:162, CsvExportService.php:184` | RG-012 |  |
| m05-05 | カスタマイズ | 乖離 | 乖離（一律非会員表示 未達） | `CsvExportService.php:215, src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderFactory.php:49` | RG-016 |  |
| m05-06 | カスタマイズ | 乖離 | 乖離疑義（フォーム未検証×DB上限・要実機確認） | `src/Eccube/Form/Type/Admin/OrderManualMailAllType.php:56, src/Eccube/Entity/MailHistory.php:53` | RG-016,028 |  |
| m05-06 | カスタマイズ | 乖離 | 乖離（宛先未検証×無トランザクションで部分送信）／要実機確認 | `src/Eccube/Controller/Admin/Order/MailController.php:391` | RG-023 |  |
| m05-07 | 現行踏襲 | 乖離 | 乖離（実装バグ・ファンアウト二重計上）／要実機確認 | `—` | RG-005,006 |  |
| m05-07 | 現行踏襲 | 乖離 | 乖離（完了ログがデータ出力前に発火・誤解を招く） | `—` | RG-032 |  |
| m05-07 | 現行踏襲 | 乖離 | 乖離疑義（CSRFサーバ検証なし・GET実行可）／要実機確認 | `—` | RG-026／§5 CSRF |  |
| m05-07 | 現行踏襲 | その他 | ids が配列でない/空 → HTTP404（L347,L377） | `—` | $ids === []) throw new N |  |
| m05-08 | 現行踏襲 | 乖離 | 乖離（既知バグ・高額印字が非機能） | `src/Eccube/Repository/OrderRepository.php:1418, app/Plugin/HareruyaEc/Repository/OrderRepository.php:1780` | RG-004,008 |  |
| m05-08 | 現行踏襲 | 乖離 | 乖離（実装バグ疑い・例外写し替え不発）／要実機確認 | `src/Eccube/Controller/Admin/Order/OrderController.php:919, src/Eccube/Service/Admin/Order/UpdateStackListAction.php:60` | RG-014,021 |  |
| m05-08 | 現行踏襲 | その他 | json_encode | `OrderController.php:864, src/Eccube/Resource/template/admin/Order/print_stack_window.twig:28` | raw`＝JSONエスケープ）で描画し実害は限定 |  |
| m05-09 | カスタマイズ | 乖離 | 乖離（ゲスト注文の非会員表示未達・INNER JOIN で欠落）／要実機確認 | `DtbShippingStandbyRepository.php:303, src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:86` | RG-013,019 |  |
| m05-09 | カスタマイズ | 乖離 | 乖離（複数配送の注文キー上書き）／要実機確認 | `DtbShippingStandbyRepository.php:250` | RG-020 |  |
| m05-09 | カスタマイズ | 乖離 | 乖離（コレクター番号の数値昇順未達懸念・DB方言差）／要実機確認 | `SortProductTrait.php:65` | RG-009 |  |
| m05-10 | カスタマイズ | 乖離 | 乖離（実装バグ・キー上書き）／要実機確認 | `DtbShippingStandbyRepository.php:250` | RG-009 |  |
| m05-10 | カスタマイズ | 乖離 | 乖離疑義（内部結合による脱落・実機再現で確定） | `DtbShippingStandbyRepository.php:303` | RG-002 |  |
| m05-10 | カスタマイズ | 乖離 | 乖離（実装バグ・算出値の破棄） | `DtbShippingStandbyRepository.php:341` | RG-007 |  |
| m05-11 | カスタマイズ | 乖離 | 乖離（バリデーション最大長 設計≠実装） | `app/config/eccube/packages/eccube.yaml:171, src/Eccube/Form/Type/NameType.php:105, eccube.yaml:172, KanaType.php:62, src` | RG-049,050 |  |
| m05-12 | 標準 | 乖離 | 乖離（ログ発火条件・軽微） | `src/Eccube/Controller/Admin/Order/OrderController.php:562` | RG-030 |  |
| m05-12 | 標準 | 乖離 | 乖離疑義（サーバ側未ガード・要実機/セキュリティ確認） | `src/Eccube/Controller/Admin/Order/OrderController.php:485` | RG-018,034 |  |
| m05-12 | 標準 | 乖離 | 乖離（実装上の潜在NPE・エッジ・要実機確認） | `src/Eccube/Controller/Admin/Order/OrderController.php:530` | RG-016,023 |  |
| m05-13 | 標準 | 乖離 | 乖離（UI未配置・機能未到達） | `src/Eccube/Resource/template/admin/Order/index.twig:178, OrderController.php:576` | RG-016,017,018 |  |
| m05-13 | 標準 | その他 | 非同期保存で空文字は文字種検証に一致せず検証エラーとなり保存しない。空での消去はこの経路では成立しない（L348） | `OrderController.php:583, vendor/symfony/validator/Constraints/RegexValidator.php:33` | ''===$value) return;`）、L |  |
| m05-13 | 標準 | 乖離 | 乖離（実装バグ・未定義参照）／要実機確認 | `index.twig:193, OrderController.php:580` | RG-018,005,006 |  |
| m05-14 | 標準 | 乖離 | 乖離（強制送信インラインエラーが status_change 経路で未表示・リダイレクトで消失）／要実機確認 | `src/Eccube/Controller/Admin/Order/EditController.php:769, src/Eccube/Form/Type/Admin/OrderType.php:524, EditController.p` | RG-014,RG-022 |  |
| m05-14 | 標準 | 乖離 | 乖離（status_change 経路の購入処理例外が未捕捉・graceful 再表示にならず 500）／要実機確認 | `EditController.php:760, src/Eccube/Service/OrderStateMachine.php:45, OrderStateMachine.php:123, EditController.php:691` | RG-033 |  |
| m05-14 | 標準 | その他 | 変更前後同一・変更前/後ステータス取得不可時は変更せずリダイレクト（HTML:336,351,359） | `EditController.php:765` | $newStatusId === null |  |
| m05-15 | 標準 | 乖離 | 乖離（フォーム/DB長不整合・設計自認リスク）／要実機確認 | `src/Eccube/Form/Type/Admin/OrderMailType.php:50, src/Eccube/Entity/MailHistory.php:53, src/Eccube/Service/MailService.ph` | RG-010,018 (要判定=件名長) |  |
| m05-15 | 標準 | 乖離 | 乖離（データ整合性の解釈差・低確度）／要実機確認 | `src/Eccube/Service/MailService.php:616, MailController.php:148` | RG-014,018 |  |
| m05-15 | 標準 | 乖離 | 乖離（境界・低確度）／要実機確認 | `MailController.php:154, src/Eccube/Entity/MailHistory.php:33` | RG-010,017 |  |
| m05-16 | 標準 | 乖離 | 乖離（実装バグ・a11y／軽微） | `src/Eccube/Resource/template/admin/Order/edit.twig:1803` | RG-015 |  |
| m05-17 | 標準 | 乖離 | 乖離（受注編集画面での表示・編集未達） | `src/Eccube/Form/Type/Admin/OrderType.php:446, ShippingType.php:207, shipping.twig:686` | RG-001,002 |  |
| m05-17 | 標準 | 乖離 | 乖離疑義（実機再現で確定・要実機確認） | `src/Eccube/Controller/Admin/Order/EditController.php:657, ShippingController.php:177` | RG-003,015 |  |
| m05-18 | 現行踏襲 | 乖離 | 乖離（Excelは受注商品名／実装は先頭明細のみ・両リポ同一） | `src/Eccube/Repository/OrderRepository.php:1290, app/Plugin/HareruyaEc/Repository/OrderRepository.php:147` | RG-005,008 |  |
| m05-18 | 現行踏襲 | 乖離 | 乖離（Excel=購入種類数／実装=明細総件数・両リポ同一） | `OrderRepository.php:1297, src/Eccube/Entity/Order.php:2311, src/Eccube/Entity/Master/MtbOrderType.php:38, OrderRepositor` | RG-006 |  |
| m05-18 | 現行踏襲 | 乖離 | 乖離疑義（明細0件でエラー・実機再現で確定） | `OrderRepository.php:1290, OrderRepository.php:147` | RG-026 |  |
| m05-18 | 現行踏襲 | 乖離 | 乖離疑義（文字列列への数値比較・要実機確認・両リポ同一） | `OrderRepository.php:1264, OrderRepository.php:121` | RG-014(DV-02),001 |  |
| m05-18 | 現行踏襲 | 乖離 | 乖離疑義（受注重複登録・実機再現で確定・両リポ同一） | `OrderRepository.php:1258` | RG-027 |  |
| m05-18 | 現行踏襲 | 乖離 | 乖離（作成日時 未設定・詳細設計が既知として明記） | `src/Eccube/Service/Admin/Order/GenerateShippingStandbyListAction.php:47, src/Eccube/Entity/DtbShippingStandby.php:26` | RG-023 |  |
| m05-19 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・日時境界の時刻丸め差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:92` | RG-003,004,027(DV) |  |
| m05-19 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・CSRF有効化）／要実機確認 | `—` | RG-028 |  |
| m05-19 | 現行踏襲 | 乖離 | 乖離（内部差・セッション互換）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/SearchControllerTrait.php:110` | RG-031 |  |
| m05-20 | 現行踏襲 | 乖離 | 乖離（実装バグ・未定義ルート参照／現行踏襲の持込） | `src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:261, app/Plugin/HareruyaEc/Controller/Admin/Order/Shippi` | RG-018 |  |
| m05-20 | 現行踏襲 | 乖離 | 乖離（実装バグ・セッションキー不一致で機能死／現行踏襲） | `ShippingStandbyController.php:259, src/Eccube/Controller/Admin/SearchControllerTrait.php:112, ...ShippingStandbyControll` | RG-018 |  |
| m05-20 | 現行踏襲 | 乖離 | 整合（乖離なし・設計正確）／更新日時の結果反映は要実機確認 | `src/Eccube/Service/Admin/ShippingStandby/UpdateCommentAction.php:33, src/Eccube/Entity/DtbShippingStandby.php:26` | RG-010 |  |
| m05-21 | 現行踏襲 | 乖離 | 乖離（pf現行バグ・位置依存／enterpriseで是正）／要実機確認 | `app/Plugin/HareruyaEc/Repository/DtbShippingStandbyRepository.php:149, src/Eccube/Repository/DtbShippingStandbyRepositor` | RG-037 |  |
| m05-21 | 現行踏襲 | 乖離 | 乖離（pf現行バグ・二経路不整合／enterpriseで是正） | `...ShippingStandbyController.php:210` | RG-037 |  |
| m05-21 | 現行踏襲 | 乖離 | 乖離（両系現存バグ・未定義インデックス）／要実機確認 | `...ShippingStandbyController.php:236, ...ShippingStandbyController.php:325` | RG-038 |  |
| m05-21 | 現行踏襲 | 乖離 | 乖離（両系現存・空IN未ガード）／要実機確認 | `—` | RG-025 |  |
| m05-21 | 現行踏襲 | 乖離 | 乖離（設計想定と実装・CSRF非強制／低リスク）／要実機確認 | `—` | RG-036 |  |
| m05-22 | 現行踏襲 | 乖離 | 乖離（未使用デッドコード・意図不明）／要実機確認 | `src/Eccube/Repository/DtbShippingStandbyRepository.php:341, OrderRepository.php:2087, delivery_slips.ja.twig:130` | RG-010 |  |
| m05-22 | 現行踏襲 | 乖離 | 乖離（ゲスト受注欠落リスク・Excel非会員表示に未到達）／要実機確認 | `DtbShippingStandbyRepository.php:303, delivery_slips.ja.twig:86` | RG-009,021 |  |
| m05-22 | 現行踏襲 | 乖離 | 乖離（複数配送/明細のキー衝突・設計が既知リスクとして明記）／要実機確認 | `DtbShippingStandbyRepository.php:250` | RG-005,022 |  |
| m05-22 | 現行踏襲 | その他 | en'], methods:['GET','POST'])]` | `ShippingStandbyController.php:400` | **設計どおり✓** |  |
| m05-23 | 現行踏襲 | 乖離 | 乖離（詳細設計DB操作節の記述誤り／実装＝画面表示が正） | `src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:438` | RG-001,019 |  |
| m05-23 | 現行踏襲 | その他 | generateDeliverySlips\ | `—` | delivery_slips.en.twig"  |  |
| m05-24 | 現行踏襲 | 乖離 | 乖離（Excel/現行から+1列・現行踏襲違反） | `src/Eccube/Controller/Admin/Order/OrderCsvController.php:97, src/Eccube/Repository/OrderRepository.php:1525` | RG-002 |  |
| m05-24 | 現行踏襲 | 乖離 | 乖離（記述と実装表現の差・実効挙動は設計どおり）／低 | `src/Eccube/Repository/OrderRepository.php:1548` | RG-010 |  |
| m05-24 | 現行踏襲 | その他 | 現行の潜在バグ・移行先で是正／低 | `...OrderCsvController.php:206, ...OrderCsvController.php:176` | RG-007,018 |  |
| m05-26 | 現行踏襲 | 乖離 | 乖離（実装バグ・確定） | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Order/OrderCsvController.php:223, pf-eccube3/app/Plugin/HareruyaEc/Ser` | RG-019 |  |
| m05-26 | 現行踏襲 | 乖離 | 乖離（実装バグ・確定） | `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/AbstractCsvService.php:109` | RG-019 |  |
| m05-26 | 現行踏襲 | 乖離 | 乖離（実装の資源解放漏れ・確定） | `OrderCsvController.php:236` | RG-020 |  |
| m05-26 | 現行踏襲 | 乖離 | 乖離（doc前提と実装差・確定）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/OrderCsv.php:92` | RG-001,RG-002,RG-008 |  |
| m05-26 | 現行踏襲 | 乖離 | 乖離（部分更新の非対称・確定）／要実機確認 | `OrderCsv.php:103` | RG-004,RG-008 |  |
| m05-27 | カスタマイズ | 乖離 | 乖離（コメント/実装不一致・過剰制限の疑い）／要実機確認 | `src/Eccube/Service/Admin/Order/WaitingTagStoreAction.php:42, DtbWaitingTag.php:52` | RG-008 |  |
| m05-27 | カスタマイズ | 乖離 | 乖離（権限判定ロジック違い・編集権限未反映） | `src/Eccube/Resource/template/admin/Order/waiting_tag.twig:118, src/Eccube/Entity/Member.php:78` | RG-012 |  |
| m05-27 | カスタマイズ | 乖離 | 乖離（認可の縦深防御欠如）／要実機確認 | `WaitingTagController.php:129` | RG-013 |  |
| m05-27 | カスタマイズ | 乖離 | 乖離（コメント/実装不一致・店舗横断確認）／要実機確認 | `src/Eccube/Service/Admin/Order/WaitingTagDeleteAction.php:42` | RG-011 |  |
| m05-27 | カスタマイズ | 乖離 | 乖離（仮実装・店舗CD未使用）／要実機確認 | `waiting_tag.twig:92` | RG-015 |  |
| m06-02 | カスタマイズ | 乖離 | 乖離（詳細設計HTMLの記述漏れ・Excel/実装は職業列あり） | `src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:45, src/Eccube/Repository/DtbOtcBuyOrderRepository.php:3` | RG-002,015 |  |
| m06-04 | カスタマイズ | 乖離 | 乖離（カスタマイズ未達・役割分離が汎用ルート権限任せ）／要実機確認（ルート権限運用で代替可否） | `src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:387` | RG-014 |  |
| m06-04 | カスタマイズ | 乖離 | 乖離（権限ゲート非対称・入庫側未分離） | `OtcBuyOrderController.php:411, src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:448` | RG-014 |  |
| m06-04 | カスタマイズ | 乖離 | 乖離（詳細設計の過小記述・実装は汎用ルート権限あり） | `src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:302` | RG-013,014 |  |
| m06-05 | カスタマイズ | 乖離 | 乖離（実装バグ・表示重複／重複id） | `src/Eccube/Resource/template/admin/OtcBuyOrder/history.twig:196` | RG-026 |  |
| m06-05 | カスタマイズ | 乖離 | 乖離（並び第2キー相違・要実機確認） | `src/Eccube/Repository/DtbOtcBuyOrderStockHistoryRepository.php:283` | RG-018 |  |
| m06-05 | カスタマイズ | 乖離 | 乖離（空文字→意図せず0件の可能性・要実機確認） | `.../DtbOtcBuyOrderStockHistoryRepository.php:98` | RG-001,003,DV-05 |  |
| m06-05 | カスタマイズ | 乖離 | 乖離疑義（表示単価と検索基準の非等価・要実機確認） | `.../history.twig:234, .../DtbOtcBuyOrderStockHistoryRepository.php:368` | RG-013,RG-026 |  |
| m06-05 | カスタマイズ | 乖離 | 乖離（詳細設計の記述矛盾・オラクルは参照系） | `—` | RG-037 |  |
| m06-06 | カスタマイズ | その他 | 設計上の差異（実装確認で確定） | `—` | RG-014,036 |  |
| m06-06 | カスタマイズ | 乖離 | 乖離候補（Excel規定 vs 会員文字列化・要実ソース確認） | `—` | RG-015 |  |
| m06-06 | カスタマイズ | その他 | 設計自認（CSRF無効・実装確認） | `—` | RG-037 |  |
| m06-06 | カスタマイズ | その他 | 要実ソース確認（列混入なし） | `—` | RG-011 |  |
| m06-07 | カスタマイズ | 乖離 | 乖離（設計未記載の値変換）／要実機確認 | `src/Eccube/Repository/DtbOtcBuyOrderStockHistoryRepository.php:366` | RG-002 |  |
| m06-07 | カスタマイズ | 乖離 | 乖離（実装バグ・選択IDの黙示欠落／防御分岐の矛盾） | `DtbOtcBuyOrderStockHistoryRepository.php:341, src/Eccube/Entity/ProductClass.php:266` | RG-001,007 |  |
| m06-07 | カスタマイズ | 乖離 | 乖離疑義（要実機確認） | `DtbOtcBuyOrderStockHistoryRepository.php:337` | RG-001 |  |
| m06-08 | 現行踏襲 | 乖離 | 乖離（カスタマイズ未達懸念）／要実機確認 | `OtcBuyOrderSummaryType.php:96, src/Eccube/Entity/BaseInfo.php:47` | RG-011 |  |
| m06-09 | 現行踏襲 | 乖離 | 乖離疑義（ログ文言と実タイミング・低）／要実機確認 | `OtcBuyOrderSummaryCsvExportService.php:111` | RG-023 |  |
| m06-09 | 現行踏襲 | 乖離 | 乖離疑義（datetime粒度グループ化・実機/バッチ確認要） | `DtbOtcBuyOrderSummaryRepository.php:50` | RG-002,007 |  |
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
| m07-01 | カスタマイズ | 乖離 | 乖離（Excel最大値 未強制） | `src/Eccube/Form/Type/Admin/Purchase/PurchaseListType.php:125, src/Eccube/Repository/DtbBuyOrderRepository.php:127` | DV-05,RG-002 |  |
| m07-01 | カスタマイズ | 乖離 | 乖離（件数二重計上リスク）／要実機確認 | `DtbBuyOrderRepository.php:82` | RG-035,005,006,009 |  |
| m07-01 | カスタマイズ | 乖離 | 乖離（詳細設計の記述誤り疑い・要実機確認） | `DtbBuyOrderRepository.php:161` | RG-005,006 |  |
| m07-02 | カスタマイズ | 乖離 | 乖離（実装バグ・Excel仕様未達） | `src/Eccube/Service/Csv/Exporter/BuyOrderCsvExportService.php:143, tests/Eccube/Tests/Service/Csv/BuyOrderCsvExportServic` | RG-007 |  |
| m07-02 | カスタマイズ | 乖離 | 乖離（プレイヤー未登録会員で過少カウント）／要実機確認 | `src/Eccube/Repository/DtbBuyOrderRepository.php:344` | RG-016,018 |  |
| m07-03 | カスタマイズ | 乖離 | 乖離（選択肢下限の1年ズレ・軽微・要実機確認） | `PurchaseDetailType.php:204` | RG-028(DV-08) |  |
| m07-04 | カスタマイズ | 乖離 | 乖離（詳細設計記述誤り・実装が正） | `src/Eccube/Form/Type/Admin/Purchase/PurchaseManualMailType.php:93` | RG-001,017 |  |
| m07-04 | カスタマイズ | その他 | 設計どおり（懸念注記・新規バグではない） | `MailController.php:99, MailService.php:1559` | RG-010,011 |  |
| m07-05 | 現行踏襲 | 乖離 | 乖離（列名と出力値の意味不一致・要実機確認：意図的仕様か要確認） | `src/Eccube/Service/Csv/Exporter/BuyOrderDepositCsvExportService.php:34, src/Eccube/Repository/DtbBuyOrderRepository.php:` | RG-005 |  |
| m07-05 | 現行踏襲 | 乖離 | 乖離（INNER結合による銀行情報の巻き添え欠落・要実機確認） | `DtbBuyOrderRepository.php:459, BuyOrderDepositCsvExportService.php:120` | RG-007 |  |
| m07-06 | 現行踏襲 | 乖離 | 乖離（文言不一致・句点欠落） | `src/Eccube/Controller/Admin/Purchase/PurchaseController.php:620` | RG-025,RG-039(DV-03,04) |  |
| m07-06 | 現行踏襲 | 乖離 | 乖離（CSRF保護の非一貫・要実機確認） | `PurchaseController.php:595` | RG-037,RG-038（CSRF=§5要判定 |  |
| m07-08 | 新規実装 | その他 | 設計沈黙・実装のみ／二重フィルタの冗長性疑義 | `src/Eccube/Repository/DtbBuyOrderRepository.php:848` | RG-015 |  |
| m08-01 | カスタマイズ | 乖離 | 乖離（最小1 サーバ側未強制）／要実機確認 | `...SearchCustomerType.php:392, ...CustomerSearchTypeExtension.php:86` | RG-037(DV-11,13) |  |
| m08-01 | カスタマイズ | 乖離 | 乖離（最大長 値相違・Excel100 vs 実装255） | `...SearchCustomerType.php:60, app/config/eccube/packages/eccube.yaml:137` | RG-036(DV-01,02) |  |
| m08-01 | カスタマイズ | 乖離 | 乖離（最大長 値相違・Excel50 vs 実装255） | `...SearchCustomerType.php:134` | RG-036(DV-03,04) |  |
| m08-01 | カスタマイズ | 乖離 | 乖離（ボタン除去 未達の疑い）／要実機確認 | `—` | RG-026 |  |
| m08-01 | カスタマイズ | その他 | 設計どおり✓（Excel）／詳細設計の記載漏れ | `...SearchCustomerType.php:508` | RG-023,DV-08,09 |  |
| m08-01 | カスタマイズ | その他 | 設計どおり✓（Excel）／詳細設計の記載漏れ | `...SearchCustomerType.php:440` | RG-024 |  |
| m08-02 | 現行踏襲 | その他 | Excel設計書の記載不整合（行混線）／オラクルは概要L6500＋詳細設計に限定 | `—` | 全RG（採用範囲の限定） |  |
| m08-02 | 現行踏襲 | 乖離 | 乖離（現行の実装バグ・CSRF/必須未検証）／要実機確認 | `app/Plugin/HareruyaEc/Controller/Admin/CustomerController.php:163, src/Eccube/Controller/Admin/Customer/CustomerMailCont` | RG-009,010,018 |  |
| m08-02 | 現行踏襲 | 乖離 | 乖離（現行の実装バグ懸念・null→TypeError）／要実機確認 | `CustomerController.php:172, app/Plugin/HareruyaEc/Service/MailService.php:614` | RG-021（§5「存在しないID」要判定） |  |
| m08-03 | 現行踏襲 | 乖離 | 乖離（player無し会員の欠落）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Repository/CustomerRepository.php:81` | RG-016,001 |  |
| m08-03 | 現行踏襲 | 乖離 | 乖離（堅牢性・未設定時の未定義キー参照）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/CustomerController.php:642, pf-eccube3/app/Plugin/HareruyaEc/Repositor` | RG-015 |  |
| m08-03 | 現行踏襲 | 乖離 | 乖離（設計のDBカラム記載不足）／要仕様追記 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/CustomerController.php:651, Repository/CustomerRepository.php:82` | RG-004,005 |  |
| m08-04 | カスタマイズ | 乖離 | 乖離（必須解除 未達）／要実機確認 | `src/Eccube/Form/Type/Admin/CustomerType.php:79` | RG-028,DV-17 |  |
| m08-04 | カスタマイズ | 乖離 | 乖離（廃止 未達）／要実機確認（導線制御の有無） | `src/Eccube/Controller/Admin/Customer/CustomerEditController.php:64` | RG-004,017 |  |
| m08-04 | カスタマイズ | その他 | 設計どおり✓（Excel）／詳細設計の記載漏れ | `src/Eccube/Form/Type/Admin/CustomerType.php:167, app/config/eccube/packages/eccube.yaml:137, src/Eccube/Entity/Customer.` | RG-015 |  |
| m08-07 | 現行踏襲 | 乖離 | 乖離（詳細設計の誤記述・オラクルはExcelを採用） | `app/Plugin/HareruyaEc/Resource/template/admin/Customer/mail_history.twig:53, Block/js/mail_modal_js.twig:3, src/Eccube/R` | RG-005,006 |  |
| m08-07 | 現行踏襲 | その他 | trans | `src/Eccube/Resource/template/admin/Customer/mail_history.twig:75` | nl2br }}`）。ユーザー宛に送信済みの本文 |  |
| m08-08 | カスタマイズ | 乖離 | 乖離（本文のサーバ側必須検証欠落＝Excel L3676/L3687 違反・クライアント側のみで迂回可能）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Customer/manual_mail.twig:51, pf-eccube3/src/Eccube/Form/Type/A` | RG-015,018(DV-03) |  |
| m08-08 | カスタマイズ | 乖離 | 乖離（検証エラーのサイレント破棄・入力チェック結果が提示されない）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/CustomerController.php:242, ec-cube-enterprise/src/Eccube/Controller/A` | RG-017 |  |
| m08-08 | カスタマイズ | 乖離 | 乖離（現行踏襲差・送信後の遷移先が作成画面→会員編集画面へ変更）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/CustomerController.php:253, ec-cube-enterprise/src/Eccube/Controller/A` | RG-028 |  |
| m08-08 | カスタマイズ | 乖離 | 乖離（現行踏襲差・入口URL形状の変更／観測結果の404自体は同じ）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/Admin/CustomerServiceProvider.php:45, pf-eccube3/app/Plugin/HareruyaEc/` | RG-007 |  |
| m08-09 | 現行踏襲 | 乖離 | 乖離（Excel必須 vs 現行任意・詳細設計HTMLがExcelと矛盾）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Extension/Front/CustomerAddressTypeExtension.php:123, pf-eccube3/app/Plugin/Hareru` | RG-010,014(DV-01) |  |
| m08-09 | 現行踏襲 | 乖離 | 乖離（最大文字数の設計不一致・現行はサーバ側長さ検証なし）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Extension/Front/CustomerAddressTypeExtension.php:99, ec-cube-enterprise/src/Eccube` | RG-018(DV-07) |  |
| m08-09 | 現行踏襲 | 乖離 | 乖離（URL体系変更・独立した配送先一覧画面の消失）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/Admin/CustomerServiceProvider.php:102, ec-cube-enterprise/src/Eccube/Co` | RG-001,003,028 |  |
| m08-09 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・成功メッセージのロケールキー変更）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/CustomerController.php:490, ec-cube-enterprise/src/Eccube/Controller/A` | RG-011 |  |
| m08-09 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・郵便番号エラー文言の変更）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/CustomerController.php:475, ec-cube-enterprise/src/Eccube/Controller/A` | RG-013,021,022 |  |
| m08-09 | 現行踏襲 | 乖離 | 乖離（詳細設計HTMLがExcelと矛盾・現行はExcel未追従）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/CustomerController.php:609, ec-cube-enterprise/src/Eccube/Controller/A` | RG-027,031 |  |
| m08-10 | カスタマイズ | 乖離 | 乖離（現行踏襲違反・CSRF保護の欠落＝本人確認ステータスを外部サイトから改変され得る）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig:82, ec-cube-enterprise/src/Eccube/Controller/Ad` | RG-026,RG-013 |  |
| m08-10 | カスタマイズ | 乖離 | 乖離（現行踏襲違反・閲覧不可文言の不表示）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerEditController.php:306, app/config/eccube/packages/eccub` | RG-007 |  |
| m08-10 | カスタマイズ | 乖離 | 乖離（現行踏襲違反・選手情報なし時の応答が404→リダイレクト）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerEditController.php:264` | RG-025 |  |
| m08-10 | カスタマイズ | 乖離 | 乖離（現行踏襲差・成功文言の変更）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerEditController.php:299, ec-cube-enterprise/src/Eccube/Re` | RG-021 |  |
| m08-10 | カスタマイズ | 乖離 | 乖離（Excel設計書内の記述不整合・オラクル自体の欠陥）／要設計確認＋要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Customer/edit.twig:559` | RG-003 |  |
| m08-12 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・必須/最大長サーバ検証の欠落）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerGroupType.php:36, ec-cube-enterprise/src/Eccube/Entity/DtbCustomer` | RG-009（DV-02,DV-04） |  |
| m08-12 | 現行踏襲 | その他 | 0)$/'])`。先頭の `[-]?` により `-1` がフォーム検証を通過する）。一方で列は `unsigned` のため（`ec-cube-enterprise/src/Eccube/Entity/DtbCustomerGroup.php:70-71`） | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerGroupType.php:43` | **乖離（現行踏襲違反・負値許容）／要実機確認* |  |
| m08-12 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・桁縮小／詳細設計の「同一スキーマ」記述の誤り）／要実機確認 | `ec-cube-enterprise/src/Eccube/Entity/DtbCustomerGroup.php:70` | RG-010（DV-08,DV-09）, RG- |  |
| m08-12 | 現行踏襲 | その他 | 差異: 移行先はBootstrapモーダルで別文言を表示 — `ec-cube-enterprise/src/Eccube/Resource/template/admin/CustomerGroup/index.twig:110`（`{{ 'admin.com | `pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:1036` | trans({'%name%': Custome |  |
| m08-12 | 現行踏襲 | 乖離 | 乖離（設計書の記載漏れ疑い＋現行のルート名誤記）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/CustomerGroupController.php:83, ec-cube-enterprise/src/Eccube/Controll` | RG-037 |  |
| m08-12 | 現行踏襲 | 乖離 | 乖離（詳細設計HTMLの記述誤り＝設計書内不整合・Excel優先で解決）／設計書要修正 | `pf-eccube3/.../CustomerGroup/index.twig:90, ec-cube-enterprise/.../CustomerGroup/index.twig:98` | RG-012, RG-034 |  |
| m08-13 | 現行踏襲 | 乖離 | 乖離（Excel明示仕様の欠落・現行踏襲違反／P1）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/BlacklistController.php:59, ec-cube-enterprise/src/Eccube/Form/Type/Ad` | RG-007,017（DV-09） |  |
| m08-13 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・空白整形の欠落）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/BlacklistController.php:56, ec-cube-enterprise/src/Eccube/Form/Type/Ad` | RG-014 |  |
| m08-13 | 現行踏襲 | 乖離 | 乖離（詳細設計の記述が現行挙動を過小記述）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Util/StringUtil.php:76` | RG-014 |  |
| m08-13 | 現行踏襲 | 乖離 | 乖離（現行がExcel必須○に違反・サイレント削除／P1・現行踏襲すると不具合を継承）／要人手判断 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/BlacklistController.php:49, ec-cube-enterprise/src/Eccube/Form/Type/Ad` | RG-020 |  |
| m08-13 | 現行踏襲 | 乖離 | 乖離（現行がExcel「サーバ側で行う」L4875・必須○ L4900 に違反）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/BlacklistController.php:82, pf-eccube3/app/Plugin/HareruyaEc/Form/Type` | RG-011 |  |
| m08-13 | 現行踏襲 | 乖離 | 乖離（Excel明示の最大文字数がサーバ側で未強制・DB設定依存）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Customer/BlacklistType.php:33, ec-cube-enterprise/src/Eccube/Form/Type/` | RG-013,022（DV-03,05,07） |  |
| m08-13 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・メッセージキー変更）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/BlacklistController.php:108, ec-cube-enterprise/src/Eccube/Controller/` | RG-026 |  |
| m08-13 | 現行踏襲 | その他 | 扱い | `—` |  |  |
| m08-14 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・仕様外のDB更新／旧URL無効化の副作用）＋正本内矛盾／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerController.php:196` | RG-012,RG-026,RG-027 |  |
| m08-14 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・確認ダイアログの実現方式変更／設計外文言の追加。文言自体は一致）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/index.twig:485, ec-cube-enterprise/src/Eccube/Resource/lo` | RG-003,RG-004,RG-005 |  |
| m08-14 | 現行踏襲 | 乖離 | 乖離（詳細設計HTMLの限定欠落・Excel規定との矛盾＝文書不備。実装は設計(Excel)に適合）／設計書修正要 | `—` | RG-001,RG-002,RG-003,RG- |  |
| m08-14 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反の疑い・ドメイン変換の欠落）／要実機確認（SEED-DOMAIN 環境で確認） | `ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerController.php:201` | RG-010,RG-022 |  |
| m09-01 | 標準 | 乖離 | 乖離（設計記述と表示位置の不一致）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/news.twig:31` | RG-006 |  |
| m09-01 | 標準 | 乖離 | 乖離（判定順序の逆転・設計と実装の不一致）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Content/NewsController.php:142, ec-cube-enterprise/vendor/symfony/doctrin` | RG-022,023 |  |
| m09-01 | 標準 | 乖離 | 乖離（設計内部不整合・DB操作節の削除欠落）／設計側の修正要 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Content/NewsController.php:149, ec-cube-enterprise/src/Eccube/Repository/` | RG-020 |  |
| m09-01 | 標準 | 乖離 | 乖離（初期選択の成立根拠が設計記述と不一致・表示は要実機確認）／要実機確認 | `ec-cube-enterprise/src/Eccube/Entity/News.php:71, NewsController.php:90` | RG-007 |  |
| m09-01 | 標準 | 乖離 | 乖離ではない（設定依存・低）／設定値変更時は要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Content/NewsController.php:61, ec-cube-enterprise/app/config/eccube/packa` | RG-004 |  |
| m09-02 | 標準 | 乖離 | 乖離（設計の403範囲と実装の制限対象が不一致・機能無効化が不完全＝セキュリティ影響）／要実機確認 | `ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:260, ec-cube-enterprise/src/Eccube/EventListener/RestrictFileU` | RG-050 |  |
| m09-02 | 標準 | 乖離 | 乖離（サーバ側の空判定欠落・設計が明記する再判定が存在しない＝データ消失リスク）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Content/FileController.php:218, ec-cube-enterprise/src/Eccube/Resource/te` | RG-056,RG-032 |  |
| m09-02 | 標準 | その他 | trans }}` でも解決できずキー文字列がそのまま画面に出る。設計の表示メッセージ節（同:362）にも当該文言の列挙が無い | `ec-cube-enterprise/src/Eccube/Controller/Admin/Content/FileController.php:315, ec-cube-enterprise/src/Eccube/Resource/te` | **乖離（文言未定義・設計の表示メッセージ節に該 |  |
| m09-02 | 標準 | 乖離 | 乖離（アダプタキー組み立ての不整合・設計が規定するアダプタ削除が期待どおり働かない可能性）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Content/FileController.php:234` | RG-038,RG-033 |  |
| m09-02 | 標準 | 乖離 | 乖離（表示のフォルダ指定が設計の404規定と不一致・表示/DLで判定が非対称）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Content/FileController.php:136` | RG-041 |  |
| m09-02 | 標準 | 乖離 | 乖離候補（正本はContent-Typeを規定せずMIME誤綴の影響は要確認）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Content/FileController.php:277` | RG-043 |  |
| m09-03 | 標準 | 乖離 | 乖離（正本が沈黙する更新対象の相違・id0への予期しない副作用）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Content/LayoutController.php:111` | RG-031 |  |
| m09-03 | 標準 | 乖離 | 乖離（設計が規定するサーバ側再検証の不在）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/BlockPositionRepository.php:64` | RG-018,RG-045,RG-047 |  |
| m09-03 | 標準 | 乖離 | 乖離（除外条件の実装差・堅牢性）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/BlockPositionRepository.php:64` | RG-018 |  |
| m09-03 | 標準 | 乖離 | 乖離（送信行の読み取り上限＝設計の「順に読み」と不一致）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/BlockPositionRepository.php:61, .../Content/LayoutController.php:118` | RG-018,RG-020 |  |
| m09-04 | カスタマイズ | 乖離 | 乖離（Excel未充足・検索対象項目の過剰／現行は機能欠落）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/page.twig:21, ec-cube-enterprise/src/Eccube/Controller/Adm` | RG-005,006,007 |  |
| m09-04 | カスタマイズ | 乖離 | 乖離（Excelと判定基準が不一致）／要実機確認（Excelの「最後のパスセグメント」の判定対象が一意に読めず、Excel側の記述精度も要確認） | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Content/page_edit.twig:62, PageController.php:180` | RG-045,046 |  |
| m09-05 | 標準 | 乖離 | 乖離（成功メッセージの表示条件違反・アップロード失敗が成功と誤認されうる）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Content/CssController.php:62, src/Eccube/Service/Upload/Adapters/S3FileAd` | RG-M09-05-012,020,027 |  |
| m09-05 | 標準 | 乖離 | 乖離（制限403と共通認証の優先順・未ログイン時の応答差）／要実機確認 | `ec-cube-enterprise/src/Eccube/EventListener/RestrictFileUploadListener.php:40` | RG-M09-05-021,023,024 |  |
| m09-05 | 標準 | 乖離 | 乖離（例外捕捉範囲が正本の切り分けと不一致）／要実機確認 | `CssController.php:60` | RG-M09-05-017,020 |  |
| m09-05 | 標準 | 乖離 | 乖離（アダプタ構成依存でアップロードが成立しない・構成前提が正本に未記載）／要実機確認 | `ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:289, src/Eccube/Service/Upload/Adapters/LocalSystemFileAdapter` | RG-M09-05-012,016,020 |  |
| m09-06 | 標準 | 乖離 | 乖離（既定構成での配置先がオラクル記述と異なる）／要実機確認 | `ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:289, ec-cube-enterprise/src/Eccube/Service/Upload/FileManager.` | RG-014,035,036 |  |
| m09-06 | 標準 | 乖離 | 乖離（ローカルアダプタ選択時に配置が成立しない／編集対象ファイル消失リスク）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Upload/Adapters/LocalSystemFileAdapter.php:49, JsController.php:53` | RG-014,035,036 |  |
| m09-06 | 標準 | 乖離 | 乖離（配置失敗時の画面挙動がオラクル記述と異なる）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Content/JsController.php:75, LocalSystemFileAdapter.php:38, S3FileAdapter` | RG-018,036 |  |
| m09-06 | 標準 | 乖離 | 乖離（配置失敗時に保存完了メッセージが残る・正本に規定なし）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Content/JsController.php:62` | RG-016,036 |  |
| m09-06 | 標準 | 乖離 | 乖離（フロントの読み込み元が設計の「フロント公開先」と一致しない）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/default/default_frame.twig:303, ec-cube-enterprise/app/config/eccube/pac` | RG-035 |  |
| m09-07 | カスタマイズ | 乖離 | 乖離（Excelの表示3条件未達＝ブロック名リンク化・編集/削除の非表示）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Content/block.twig:24, ec-cube-enterprise/src/Eccube/Resource/t` | RG-002,008,010 |  |
| m09-07 | カスタマイズ | 乖離 | 乖離（Excel記載のuser_data条件が現行に無く、Excel文言も解釈不定）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Content/block_edit.twig:65, pf-eccube3/app/Plugin/HareruyaEc/Co` | §3 DV-16（件数外・要判定） |  |
| m09-07 | カスタマイズ | 乖離 | 乖離（保存側と削除側でファイル名規則が不一致＝孤立twigファイルの残存）／要実機確認 | `pf-eccube3/src/Eccube/Controller/Admin/Content/BlockController.php:174, ContentController.php:244` | RG-015,018 |  |
| m09-07 | カスタマイズ | 乖離 | 乖離（詳細設計HTMLのカスタマイズ要件記述漏れ＝文書不備。期待はExcelを正とする） | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Content/block_edit.twig:24, pf-eccube3/app/Plugin/HareruyaEc/Co` | RG-026,027,037 |  |
| m09-08 | 標準 | 乖離 | 乖離（正本の識別子記述誤り・照合不能）／要実機確認 | `—` | RG-048 |  |
| m09-08 | 標準 | 乖離 | 乖離（正本の否定文が過大・限定漏れ。OUT根拠の偽陰性リスク）／要実機確認 | `—` | RG-044 |  |
| m09-08 | 標準 | その他 | 「メンテナンスモード許可設定が有効な場合、自動メンテナンスモードへ切り替える。無効な場合は切り替えない」（`…m09-08_admin_content_content_cache.html:338`）／「削除前に自動メン | `—` | !$this->isMaintenanceMod |  |
| m09-08 | 標準 | 乖離 | 乖離（正本の権限記述が過大・拒否経路の欠落）／要実機確認 | `—` | RG-036,037 |  |
| m09-08 | 標準 | その他 | auto_maintenance | `—` | auto_maintenance_update` |  |
| m09-09 | 標準 | 乖離 | 乖離候補（設計沈黙の境界・末尾スラッシュ有無で停止可否が変わる）／要実機確認 | `—` | RG-020・DDT DP-09 |  |
| m09-09 | 標準 | 乖離 | 乖離候補（設計沈黙・秘密トークンCookieの属性が設計で確定していない／付与と破棄で属性が非対称）／要実機確認 | `—` | RG-027,028 |  |
| m09-09 | 標準 | 乖離 | 乖離候補（設計沈黙・競合時のトークン失効という利用者影響が設計に現れていない）／要実機確認 | `—` | RG-010・DDT DP-01 |  |
| m09-10 | カスタマイズ | 乖離 | 乖離（現行踏襲違反・302→200／二重登録リスク）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:89` | RG-029,015,016,017,018 |  |
| m09-10 | カスタマイズ | 乖離 | 乖離（現行踏襲差・Length上限の基準変更）／要実機確認（両設定値） | `ec-cube/app/Customize/Form/Type/Admin/Integration/TopPageManagementType.php:59, ec-cube-enterprise/src/Eccube/Form/Type/` | RG-031（DV-05,06,17） |  |
| m09-10 | カスタマイズ | 乖離 | 乖離（現行踏襲差・S3操作順序の反転／堅牢性は向上）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:318` | RG-023,025,043 |  |
| m09-10 | カスタマイズ | 乖離 | 乖離（文言差・等値照合するテストが失敗しうる）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4168` | RG-018（DV-11） |  |
| m09-10 | カスタマイズ | 乖離 | 乖離（設計沈黙部への実装追加）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/Content/BranchTopPageManagementType.php:91` | RG-037（§5「タイルの削除」＝要判定） |  |
| m10-01 | 現行踏襲 | その他 | [0-9]?)[0-9]\.?[0-9]{0,6}\ | `—` | 180\.?0{0,6})$/`） |  |
| m10-01 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・既定値の反転／設計書内の記述不整合）／要実機確認 | `ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:135` | RG-004,027, DV-51,52 |  |
| m10-01 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・画面部品種別の変更）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:258` | RG-003,027, DV-51 |  |
| m10-01 | 現行踏襲 | その他 | trans }}`）。詳細設計も「登録ボタン」と記述（`m10-01_admin_shop_setting_setting_shop.html:327,334`）＝Excel規定と不一致 | `pf-eccube3/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:186, ec-cube-enterprise/src/Eccube/Resource/` | **乖離（Excel規定ラベルと実装・詳細設計の |  |
| m10-01 | 現行踏襲 | 乖離 | 乖離（Excel規定の名称変更が未反映）／要実機確認 | `pf-eccube3/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:28` | RG-001 |  |
| m10-01 | 現行踏襲 | 乖離 | 乖離（成功メッセージ文言差・キャッシュ機構と発火条件の差）／要実機確認 | `pf-eccube3/src/Eccube/Controller/Admin/Setting/Shop/ShopController.php:71, ec-cube-enterprise/src/Eccube/Controller/Admi` | RG-013,015,016 |  |
| m10-01 | 現行踏襲 | 乖離 | 乖離（設計未記載項目の追加・設計書の網羅性不足）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:173` | RG-002,011 |  |
| m10-02 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・成功メッセージ文言の変化）／要実機確認 | `pf-eccube3/src/Eccube/Controller/Admin/Setting/Shop/TradelawController.php:77, pf-eccube3/src/Eccube/Resource/locale/mes` | RG-007 |  |
| m10-02 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・更新日時の副作用喪失＝更新履歴の追跡不能）／要実機確認 | `pf-eccube3/src/Eccube/Entity/Help.php:176, ec-cube-enterprise/src/Eccube/Entity/TradeLaw.php:33` | RG-010 |  |
| m10-02 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・プラグイン拡張点の喪失）／要実機確認 | `pf-eccube3/src/Eccube/Controller/Admin/Setting/Shop/TradelawController.php:48, ec-cube-enterprise/src/Eccube/Controller/` | RG-011,012 |  |
| m10-02 | 現行踏襲 | その他 | trans }}`。Excel「設定」／詳細設計・現行「登録」／移行先「保存」の三者三様 | `pf-eccube3/src/Eccube/Resource/template/admin/Setting/Shop/tradelaw.twig:131, ec-cube-enterprise/src/Eccube/Resource/tem` | **乖離（Excel設計 vs 実装のラベル不一 |  |
| m10-02 | 現行踏襲 | 乖離 | 乖離（Excel設計 vs 実装・M10-01 からの写し込み疑い＝Excel側の是正候補）／要実機確認 | `pf-eccube3/src/Eccube/Form/Type/Admin/TradelawType.php:44, ec-cube-enterprise/src/Eccube/Form/Type/Admin/TradeLawMallTyp` | §5-A#1 |  |
| m10-02 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・住所補完機能の喪失。#1 の構造差に随伴）／要実機確認 | `pf-eccube3/src/Eccube/Resource/template/admin/Setting/Shop/tradelaw.twig:33, ec-cube-enterprise/src/Eccube/Resource/temp` | RG-004 |  |
| m10-02 | 現行踏襲 | 乖離 | 乖離（設計の処理順序と不一致・二重バインドの副作用は未確認）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/TradeLawController.php:57` | RG-011 |  |
| m10-03 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・機能および保存先の欠落／最重要）／要実機確認 | `ec-cube-enterprise/codeception/_support/Page/Admin/CustomerAgreementSettingPage.php:29, ec-cube-enterprise/src/Eccube/Se` | RG-001,011,012 |  |
| m10-03 | 現行踏襲 | 乖離 | 乖離（Excel画面項目とのラベル不一致・未使用フィールドの残存）／要実機確認 | `pf-eccube3/src/Eccube/Resource/template/admin/Setting/Shop/customer_agreement.twig:67, pf-eccube3/src/Eccube/Form/Type/A` | RG-004 |  |
| m10-03 | 現行踏襲 | その他 | 設計側の記載欠落（Excel画面項目の必須列を補正要）／要設計確認 | `pf-eccube3/src/Eccube/Form/Type/Admin/CustomerAgreementType.php:46` | RG-018(DV-01),019 |  |
| m10-03 | 現行踏襲 | その他 | raw | `pf-eccube3/src/Eccube/Resource/template/default/Help/agreement.twig:34` | nl2br }}`）が `raw` によりマーク |  |
| m10-04 | 現行踏襲 | 乖離 | 乖離（必須未強制） | `src/Eccube/Form/Type/Admin/PaymentRegisterType.php:124` | RG-012,027(DV-03) |  |
| m10-04 | 現行踏襲 | 乖離 | 乖離（片側バリデーション欠落） | `PaymentRegisterType.php:98` | RG-027(DV-13) |  |
| m10-04 | 現行踏襲 | 乖離 | 乖離（操作方式の相違） | `PaymentController.php:378` | RG-020,021,022 |  |
| m10-04 | 現行踏襲 | 乖離 | 乖離（現行踏襲未達） | `—` | RG-012 |  |
| m10-04 | 現行踏襲 | 乖離 | 乖離（削除方式の変化・要実機確認） | `PaymentController.php:337, src/Eccube/Repository/AbstractRepository.php:48, src/Eccube/Controller/Admin/Setting/Shop/Pay` | RG-017 |  |
| m10-04 | 現行踏襲 | 乖離 | 乖離（採番方式差） | `PaymentController.php:324` | RG-017 |  |
| m10-04 | 現行踏襲 | 乖離 | 乖離（境界値バグ・要実機確認） | `PaymentRegisterType.php:131` | RG-027(DV-11) |  |
| m10-05 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・金額の最大長/文字種検証の消失）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:246, ec-cube-enterprise/src/Eccube/Form/Type/PriceType.` | RG-011（DV-03,DV-04,DV-06 |  |
| m10-05 | 現行踏襲 | その他 | \ | `ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeFreePreprocessor.php:42, .../DeliveryFeeFreeBySh` | $this->BaseInfo->getDeli |  |
| m10-05 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・比較対象が小計→合計へ変質）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeFreePreprocessor.php:43` | RG-016,RG-017,RG-021,RG- |  |
| m10-05 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・適用手段と判定粒度の変更）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeFreePreprocessor.php:57, .../DeliveryFeeFreeBySh` | RG-016,RG-019,RG-021 |  |
| m10-05 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・カート案内の数量分岐/併記の消失）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/default/Cart/index.twig:280` | RG-027,RG-028 |  |
| m10-05 | 現行踏襲 | その他 | 差異: 移行先の既定テンプレートに当該ブロックが見当たらない — `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/` に `free.twig` 相当が無く、`delivery_fr | `—` | **乖離（現行踏襲差・フロント文言ブロックの消失 |  |
| m10-06 | 現行踏襲 | 乖離 | 乖離（設計 vs 稼働プラグイン実装・遷移先）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Setting/Shop/DeliveryController.php:159, pf-eccube3/src/Eccube/Control` | RG-011,025 |  |
| m10-06 | 現行踏襲 | 乖離 | 乖離（現行踏襲対象の実項目が仕様書外）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Setting/Shop/DeliveryController.php:84, ec-cube-enterprise/src/Eccube/` | RG-028 |  |
| m10-06 | 現行踏襲 | 乖離 | 乖離（設計の型/長さ記述が DB正典と不一致）／要実機確認 | `ec-cube-enterprise/src/Eccube/Entity/Delivery.php:65` | RG-033 |  |
| m10-06 | 現行踏襲 | 乖離 | 乖離（設計はコア挙動・稼働はプラグイン別実装）／保存経路は要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Setting/Shop/DeliveryController.php:163, src/Eccube/Controller/Admin/S` | RG-008,009 |  |
| m10-07 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・Excel画面項目1-1/1-2の欠落＝最重要）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/TaxRuleType.php:46, ec-cube-enterprise/src/Eccube/Controller/Admin/Setting` | RG-002,019,020,021,022,0 |  |
| m10-07 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・上限検証の欠落）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/TaxRuleType.php:51` | RG-028（DV-02,DV-03） |  |
| m10-07 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・編集導線の変更）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/TaxRuleController.php:51, ec-cube-enterprise/src/Eccube/Cont` | RG-004,006,007 |  |
| m10-07 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・削除対象不存在時の応答差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/TaxRuleController.php:147` | RG-026 |  |
| m10-07 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・新規既定値の変質）／要実機確認 | `ec-cube-enterprise/src/Eccube/Entity/Master/RoundingType.php:34, ec-cube-enterprise/src/Eccube/Repository/TaxRuleReposit` | RG-003 |  |
| m10-07 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・重複判定範囲と文言）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/TaxRuleType.php:73, pf-eccube3/.../TaxRuleController.php:235, ec-cube-ente` | RG-016 |  |
| m10-07 | 現行踏襲 | 乖離 | 乖離（軽微・成功メッセージキーの汎用化）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/TaxRuleController.php:89` | RG-013,024 |  |
| m10-08 | 現行踏襲 | 乖離 | 乖離（Excel「全種」≠実装の自動送信限定）／要実機確認（Excel記載が literal な「全種」か、自動送信メール画面の文脈で「自動送信テンプレ全種」の意かが未確定） | `pf-eccube3/app/Plugin/HareruyaEc/Form/Extension/Admin/MailTypeExtension.php:49, pf-eccube3/app/Plugin/HareruyaEc/Control` | RG-006,009 |  |
| m10-08 | 現行踏襲 | 乖離 | 乖離（現行の上限50 ≠ Excel 255・現行踏襲すると仕様未達）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Extension/Admin/MailTypeExtension.php:35, ec-cube-enterprise/src/Eccube/Form/Type/` | RG-022（DV-01,02） |  |
| m10-08 | 現行踏襲 | 乖離 | 乖離（現行は上限未強制・256文字以上が保存され得る）／要実機確認 | `pf-eccube3/src/Eccube/Form/Type/Admin/MailType.php:47, ec-cube-enterprise/src/Eccube/Form/Type/Admin/AutoMailType.php:66` | RG-023（DV-03,04） |  |
| m10-08 | 現行踏襲 | 乖離 | 乖離（両系で上限32768が未強制・32769文字以上が保存され得る）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Extension/Admin/MailTypeExtension.php:66, pf-eccube3/src/Eccube/Form/Type/Admin/Ma` | RG-024（DV-05〜08） |  |
| m10-08 | 現行踏襲 | その他 | date('Y') > 2018 ? '最終更新日: '~ mail.updateDate | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Setting/Shop/auto_mail.twig:42` | date('Y-m-d H:i:s') : '' |  |
| m10-08 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・候補の並び順が名称昇順→ID昇順へ変化）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/AutoMailType.php:55, pf-eccube3/app/Plugin/HareruyaEc/Form/Extension/Admin` | RG-007 |  |
| m10-08 | 現行踏襲 | 乖離 | 乖離候補（「最終更新者」を作成者列に保存する設計＝作成者の追跡不能。Excelは保存先列に沈黙のため断定せず）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Setting/Shop/MailController.php:167, /Resource/template/admin/Setting/` | RG-015 |  |
| m10-09 | 現行踏襲 | 乖離 | 乖離（設計書の機能ID/範囲の割当欠落＝M10-09の詳細設計が不在・Excel規定の最大長が実装に無い・本文欄構成差）／要起票・要実機確認 | `pf-eccube3/src/Eccube/ControllerProvider/AdminControllerProvider.php:183, pf-eccube3/src/Eccube/Form/Type/Admin/MailType` | §0・§5（別範囲・未カバー） |  |
| m10-09 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・キャッシュ削除の契機と条件が変質）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/ShopController.php:86` | RG-016,017 |  |
| m10-09 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・単一行編集前提の崩れ／対象行がセッション依存）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/BaseInfoRepository.php:65` | RG-035,008 |  |
| m10-09 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・検証強度が設定依存へ弱化）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:129` | RG-012,022(DV-05〜08) |  |
| m10-09 | 現行踏襲 | 乖離 | 乖離（Excel設計と実装の並び順・ラベル差／識別ID↔列対応の規定欠落）／要実機確認 | `pf-eccube3/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:110, pf-eccube3/src/Eccube/Form/Type/Admin/S` | RG-001,002,022(DV-10) |  |
| m10-09 | 現行踏襲 | 乖離 | 乖離（Excel設計とUIラベル差・軽微）／要実機確認 | `pf-eccube3/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:186` | RG-011 |  |
| m10-10 | 現行踏襲 | 乖離 | 乖離（Excel「登録されているCSV全種」違反・現行踏襲違反）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/CsvController.php:52, ec-cube-enterprise/src/Eccube/Entity/M` | RG-003 |  |
| m10-10 | 現行踏襲 | その他 | trans }}`）＋ `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1629`（`admin.common.registration: 登録`）。Excel画面項目の「設定」→ | `ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:200` | **乖離（Excel画面項目2-1違反・現行踏襲 |  |
| m10-10 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・CSRF有効化＋トークン不正時が無言no-op）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/CsvController.php:123` | RG-027 |  |
| m10-11 | 標準 | 乖離 | 乖離（既定データで受注対応状況設定が保存不能・設計が例外扱いする状態が常態）／要実機確認 | `ec-cube-enterprise/app/DoctrineMigrations/Version20251125150428.php:59, ec-cube-enterprise/app/DoctrineMigrations/Versio` | RG-007,016,020,021,023 |  |
| m10-11 | 標準 | 乖離 | 乖離（マスタデータの整合性・設計前提違反／画面影響なし）／要実機確認 | `—` | RG-001,026 |  |
| m10-11 | 標準 | 乖離 | 乖離（色の形式検証がサーバ側で成立せず・正本に規定なし）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderStatusSettingType.php:58, ec-cube-enterprise/vendor/symfony/form/Exte` | RG-004,015,020(DV-12) |  |
| m10-11 | 標準 | 乖離 | 乖離（設計が記述しない防御層の存在・deny_url除去時の挙動が設計から追跡不能）／要実機確認 | `ec-cube-enterprise/app/DoctrineMigrations/Version20240930235959_03.php:37` | RG-038,039,040,041 |  |
| m10-12 | 標準 | 乖離 | 乖離（更新時の同日重複チェック不発の疑い＝一意性ルールの穴）／要実機確認 | `—` | RG-029,028,016（DV-07） |  |
| m10-12 | 標準 | 乖離 | 乖離（タイトル必須のサーバ側検証欠落の疑い＝NULL許容列への空タイトル混入）／要実機確認 | `—` | RG-013（DV-03,DV-04） |  |
| m10-12 | 標準 | 乖離 | 乖離（インライン編集行でタイトルのエラー文言が入力欄近傍に出ない）／要実機確認 | `—` | RG-027,018,013（DV-03） |  |
| m10-12 | 標準 | 乖離 | 乖離（設計DB操作表の記述漏れ＝削除行の欠落・正本内不整合）／要実機確認 | `—` | RG-039,031 |  |
| m10-13 | カスタマイズ | 乖離 | 乖離（オラクル外の選択肢混入）／要実機確認: Excel・詳細設計の双方が出さないとする会員CSVが選択可能。意図的な仕様追加なら基本設計の改訂が必要 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomCsvType.php:33, /Form/Type/Admin/Setting/Shop/CustomCsvType.php:53` | RG-002 |  |
| m10-13 | カスタマイズ | その他 | 設計文書の陳腐化（詳細設計 vs Excel）: 詳細設計 `…m10-13_…html:345` の「商品・受注・配送の3種に限定」「会員CSV・カテゴリCSVは選択肢に出さない」は現行(pf-eccube3)基準の記述でExcelのカスタマイズを反映してい | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Setting/Shop/CustomCsvType.php:50, ec-cube-enterprise/src/Eccube/Form/T` | RG-002, RG-003 |  |
| m10-13 | カスタマイズ | 乖離 | 乖離（同一 sort_no 時の並びが不定）／要実機確認: `sort_no` 重複時に左リストの表示順がDB依存で揺れる | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomCsvType.php:76, /Form/Type/Admin/Setting/Shop/CustomCsvType.php:40` | RG-007 |  |
| m10-13 | カスタマイズ | 乖離 | 乖離（軽微・表示文言差） | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomCsvType.php:110, /Form/Type/Admin/Setting/Shop/CustomCsvType.php:80` | RG-009 |  |
| m10-13 | カスタマイズ | 乖離 | 乖離（宣言済み必須制約が実効しない）／要実機確認: 宣言と実効の不一致。現行踏襲ではあるが、Excel/詳細設計の必須要件を満たさない | `ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/CustomerCsvController.php:65, /Service/Admin/Setting/Shop/Cu` | RG-028, DV-04 |  |
| m10-13 | カスタマイズ | 乖離 | 乖離（エラー処理表に無い未捕捉例外＝500の可能性）／要実機確認: 正本のエラー表に該当がなく、想定外の応答になりうる | `ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/CustomerCsvUpdateAction.php:56, /CustomerCsvController.php:80, ` | RG-028 |  |
| m10-14 | 標準 | 乖離 | 乖離（正本の記述矛盾・DB操作節が論理削除を落としている／偽OUTを誘発する記述）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/TenantController.php:397` | RG-033,034（§5 `要判定`） |  |
| m10-14 | 標準 | 乖離 | 乖離（CSRF未送信かつ未検証・状態変更APIの保護欠如）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/tenant/index.twig:43, TenantController.php:396` | RG-040 |  |
| m10-14 | 標準 | 乖離 | 乖離（モールルートの論理削除ガード欠如・一覧の限定が削除側に伝播していない）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/TenantController.php:396, src/Eccube/Repository/BaseInfoRepository.p` | RG-033,034 |  |
| m10-14 | 標準 | 乖離 | 乖離（空検索で shop_name NULL 行が欠落・全件表示の不成立）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/BaseInfoRepository.php:234, src/Eccube/Entity/BaseInfo.php:87` | RG-006（DV-04・SEED-T4） |  |
| m10-14 | 標準 | その他 | L320「`resume` 付きGETにおける検索条件セッションとページ番号の更新・復元」を扱う／L333「`resume` フラグまたはパスパラメタに応じてセッション上の検索条件を復元して再クエリする」／L346「`p | `ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/TenantController.php:141` | $request->get('resume')  |  |
| m10-14 | 標準 | 乖離 | 乖離候補（ページング安定性が保証されない・設計沈黙部）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/BaseInfoRepository.php:176` | RG-011,027 |  |
| m10-14 | 標準 | 乖離 | 乖離（無効時のエラー状態明示が成立せず0件表示と区別できない・返却キーの不整合）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/TenantController.php:131` | RG-018 |  |
| m10-14 | 標準 | 乖離 | 乖離（32bit範囲外IDの無効化がPostgreSQL限定・DBMS依存の分岐が正本に無い）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/BaseInfoRepository.php:230, src/Eccube/Repository/AbstractRepository.php:109` | RG-005（DV-07） |  |
| m10-15 | カスタマイズ | 乖離 | 乖離（Excel画面項目の記載漏れ疑い）／要実機確認 | `ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:60, ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:8` | RG-038, §3-C DX-02 |  |
| m10-15 | カスタマイズ | 乖離 | 乖離（フラッシュキーの変更）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/ShopController.php:87` | RG-031 |  |
| m10-15 | カスタマイズ | 乖離 | 乖離（キャッシュクリア契機の変更）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/ShopController.php:85` | RG-034,046 |  |
| m10-15 | カスタマイズ | 乖離 | 乖離（最大値の不一致・4項目群） | `ShopMasterType.php:80, ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:118, eccube.yaml:138, eccube.yaml:114, ` | §3-A DV-1-5-*, DV-1-11-* |  |
| m10-15 | カスタマイズ | 乖離 | 乖離（必須制約の欠落・表示順は画面項目欠落） | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:302, Entity/BaseInfo.php:1043` | §3-A DV-1-2-REQ, DV-1-4- |  |
| m10-15 | カスタマイズ | 乖離 | 乖離（内部差・列の残置）／要実機確認 | `ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:1518` | RG-022 |  |
| m10-16 | カスタマイズ | 乖離 | 乖離（Excel任意と実装required=trueの矛盾／NotBlank欠落） | `src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:195` | RG-022 |  |
| m10-16 | カスタマイズ | 乖離 | 乖離（Excel記載と実装仕様の不整合・要仕様確定） | `AdditionalSystemFormType.php:116, ConfigType.php:183` | RG-018 |  |
| m10-16 | カスタマイズ | 乖離 | 乖離（許可文字集合の相違） | `AdditionalSystemFormType.php:83, ConfigType.php:91` | RG-014,015 |  |
| m10-16 | カスタマイズ | 乖離 | 乖離（現行の必須未達・enterprise で Excel 一致に是正） | `ConfigType.php:305, AdditionalSystemFormType.php:210` | RG-020,024 |  |
| m10-16 | カスタマイズ | 乖離 | 乖離（成功メッセージ翻訳キーの相違）／要実機確認 | `AdditionalSystemController.php:103, ConfigController.php:64` | RG-002 |  |
| m10-16 | カスタマイズ | 乖離 | 乖離（Excel列挙とのフィールド差・要確認） | `AdditionalSystemFormType.php:76` | §5 台帳 |  |
| m10-16 | カスタマイズ | 乖離 | 乖離（Excel削除指示 vs 実装のキー転用） | `AdditionalSystemFormType.php:80, messages.ja.yaml:4208` | §0 |  |
| m11-03 | カスタマイズ | 乖離 | 乖離（正本の画面記述漏れ）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Setting/System/AuthorityController.php:99, Resource/template/admin/Set` | §0・RG-003 |  |
| m11-03 | カスタマイズ | 乖離 | 乖離（Excel仕様未充足）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Setting/System/AuthorityCopyType.php:29` | §0 |  |
| m11-03 | カスタマイズ | 乖離 | 乖離（Excel未記載の破壊的上書き）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Setting/System/AuthorityController.php:132, authority.twig:139` | §0 |  |
| m11-03 | カスタマイズ | 乖離 | 乖離（正本の記述不足・現行の非NULL制約リスク）／要実機確認 | `pf-eccube3/src/Eccube/Doctrine/EventSubscriber/SaveEventSubscriber.php:55, pf-eccube3/src/Eccube/Resource/doctrine/Eccub` | RG-040 |  |
| m11-03 | カスタマイズ | 乖離 | 乖離（正本の記述漏れ・拒否範囲が設計より広い）／要実機確認 | `pf-eccube3/src/Eccube/Security/Voter/AuthorityVoter.php:74, ec-cube-enterprise/src/Eccube/Security/Voter/AuthorityVoter.` | RG-025,026 |  |
| m11-04 | 標準 | 乖離 | 乖離（設計書の記述誤り＝汎用テンプレ混入の疑い・DB操作節が本文3箇所と矛盾）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/LoginHistoryController.php:105, src/Eccube/Repository/Logi` | RG-039,RG-055 |  |
| m11-04 | 標準 | その他 | 一覧を開く（素のGET）は「セッションに保存済みの検索条件があればその条件で、なければ全件を作成日時の新しい順で1ページ目に表示する」（`m11-04_..._login_history.html:329` 入口表） | `ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/LoginHistoryController.php:89` | $request->get('resume')) |  |
| m11-04 | 標準 | 乖離 | 乖離（設計の日本語文言が実装と不一致・英語は一致）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1734, messages.en.yaml:1763, src/Eccube/Resource/template` | RG-020,RG-032 |  |
| m11-04 | 標準 | 乖離 | 乖離（設計の表示メッセージ表に未記載の文言を表示）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/System/login_history.twig:194, messages.ja.yaml:1737, mess` | RG-032 |  |
| m11-04 | 標準 | 乖離 | 乖離（設計に無い表示条件＝限定の記載欠落）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/System/login_history.twig:125` | RG-032,RG-034 |  |
| m11-04 | 標準 | 乖離 | 乖離（入口表に無いHTTPメソッドを受理）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/LoginHistoryController.php:48` | RG-017,RG-018 |  |
| m11-04 | 標準 | 乖離 | 乖離（設計に無い検索キー・終了境界の意味が日単位で異なる）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/LoginHistoryRepository.php:86, src/Eccube/Form/Type/Admin/SearchLoginHistoryTyp` | RG-006,RG-007,RG-008 |  |
| m11-04 | 標準 | その他 | [　]+/u', '', ...)` で、半角スペースに加えタブ・改行・復帰等の空白文字全般も除去する。設計の「半角・全角スペース」より広い入力が正規化される | `ec-cube-enterprise/src/Eccube/Repository/LoginHistoryRepository.php:52` | **乖離（除去対象が設計の記述より広い）／要実機 |  |
| m11-04 | 標準 | 乖離 | 乖離（設計の記載欠落＝沈黙）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/System/login_history.twig:36, src/Eccube/Form/Type/Admin/S` | §5 `要判定`（CSRF） |  |
| m11-05 | 標準 | 乖離 | 乖離（正本内の不整合＋L342 vs 実装／意図せぬ行削除の可能性）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/MasterdataController.php:151, MasterdataDataType.php:64` | RG-014 |  |
| m11-05 | 標準 | 乖離 | 乖離（`0` の扱いが正本の「非空」定義と不一致・境界欠落）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/MasterdataController.php:143, tests/Eccube/Tests/Web/Admin` | RG-026,RG-025(DV-02) |  |
| m11-05 | 標準 | 乖離 | 乖離（設計の値域記述欠落／フォーム制約とDB列値域の不整合）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/MasterdataDataType.php:49, ec-cube-enterprise/app/config/eccube/packages/e` | RG-021(DV-03) |  |
| m11-05 | 標準 | 乖離 | 乖離（軽微・記述の正確性／挙動影響なし） | `ec-cube-enterprise/src/Eccube/Entity/Master/AbstractMasterEntity.php:34` | RG-012 |  |
| m11-05 | 標準 | 乖離 | 乖離（正本の未確定記述＋誤導／保存導線は単一）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/System/masterdata.twig:46, MasterdataController.php:36` | RG-017,RG-024 |  |
| m11-06 | 標準 | 乖離 | 乖離（フラグ無効時もphpinfo到達可・情報漏えい面）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/System/system.twig:61, ec-cube-enterprise/src/Eccube/Contr` | RG-016,017,020,021 |  |
| m11-06 | 標準 | 乖離 | 乖離（フォールバック不達・拒否失効の恐れ）／要実機確認 | `ec-cube-enterprise/src/Eccube/Security/Voter/AuthorityVoter.php:57, ec-cube-enterprise/src/Eccube/Twig/Extension/IsAcces` | RG-031 |  |
| m11-06 | 標準 | 乖離 | 乖離候補（将来互換・現時点の挙動差なし）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/SystemService.php:56, ec-cube-enterprise/vendor/doctrine/dbal/src/Platforms/Abstra` | RG-004(DV-01〜03) |  |
| m12-01 | カスタマイズ | 乖離 | 乖離（初期チェックの要件差・TC東京所属時）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SummaryController.php:321` | RG-007 |  |
| m12-01 | カスタマイズ | 乖離 | 乖離（丸め方式の不一致・金額系）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Admin/Analysis/AnalysisSummaryBuilder.php:192` | RG-029・DV-01,02 |  |
| m12-01 | カスタマイズ | 乖離 | 乖離（日次の入力書式差・表示規約か受理書式かが不明確）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/Analysis/SummaryType.php:46` | RG-049・DV-10 |  |
| m12-02 | カスタマイズ | 乖離 | 乖離（現行踏襲違反・BOM欠落）／要実機確認 | `pf-eccube3/.../Analysis/SummaryController.php:114, pf-eccube3/app/Plugin/HareruyaEc/Service/CsvExportService.php:369, ec` | RG-022 |  |
| m12-02 | カスタマイズ | 乖離 | 乖離（現行踏襲違反・ファイル名差）／要実機確認 | `pf-eccube3/.../Analysis/SummaryController.php:134, ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SummaryCsvExporter` | RG-023 |  |
| m12-02 | カスタマイズ | 乖離 | 乖離（設計違反・セッション空時に出力しない／設計外のエラー分岐追加）／要実機確認 | `pf-eccube3/.../Analysis/SummaryController.php:104, ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SummaryContro` | RG-026 |  |
| m12-02 | カスタマイズ | 乖離 | 乖離（詳細設計とExcelの競合・Excel優先で解決／旧列の扱いはExcel沈黙）／要実機確認 | `pf-eccube3/.../Analysis/SummaryController.php:123, ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SummaryCsvExporter` | §5 要判定 |  |
| m12-02 | カスタマイズ | 乖離 | 乖離（Excel内部の記述不整合・列見出し未確定）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:28` | DV-07 |  |
| m12-02 | カスタマイズ | 乖離 | 乖離（Excel内部の定義不整合・総売上の単位未確定）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:29` | RG-008 |  |
| m12-03 | カスタマイズ | 乖離 | 乖離（Excel廃止宣言の未反映）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Analysis/SalesType.php:21, pf-eccube3/app/Plugin/HareruyaEc/Repository/` | §0・RG-011,020 |  |
| m12-03 | カスタマイズ | 乖離 | 乖離（Excel廃止宣言の未反映）／要実機確認 | `SalesType.php:116, SalesType.php:101, SalesType.php:73, OrderDetailRepository.php:159` | §0 |  |
| m12-03 | カスタマイズ | その他 | store | `SalesType.php:71` | smaregi |  |
| m12-03 | カスタマイズ | 乖離 | 乖離（既定値の不一致・集計範囲に影響）／要実機確認 | `SalesController.php:31, SalesType.php:68, OrderDetailRepository.php:144` | RG-002 |  |
| m12-03 | カスタマイズ | 乖離 | 乖離（Excel廃止宣言の未反映）／要実機確認 | `sales.twig:211, OrderDetailRepository.php:297` | §0・RG-030,031 |  |
| m12-03 | カスタマイズ | 乖離 | 乖離（選択肢の出所と値域の不一致）／要実機確認 | `SalesType.php:61` | RG-029 |  |
| m12-03 | カスタマイズ | 乖離 | 乖離（検索対象の欠落・正本内不整合）／要実機確認 | `OrderDetailRepository.php:126` | RG-009 |  |
| m12-04 | カスタマイズ | 乖離 | 乖離（本機能の中核要件違反・CSVが全件にならない）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SalesAnalysisController.php:117, src/Eccube/Service/Csv/Exporter` | RG-006 |  |
| m12-04 | カスタマイズ | 乖離 | 乖離（BOM欠落・文字化け）／要実機確認（当該環境の encoding 設定値） | `ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SalesAnalysisCsvExporterService.php:41, src/Eccube/Service/CsvExportS` | RG-009 |  |
| m12-04 | カスタマイズ | 乖離 | 乖離（設計のエラー処理と逆・出力されない）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SalesAnalysisController.php:100, SalesController.php:90` | RG-018 |  |
| m12-04 | カスタマイズ | 乖離 | 乖離（集計単位判定の反転・ヘッダ列数が仕様と不一致）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SalesAnalysisCsvExporterService.php:37, src/Eccube/Repository/OrderIt` | RG-011,012,018 |  |
| m12-04 | カスタマイズ | 乖離 | 乖離（現行踏襲違反・集計単位6軸の消失）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/Analysis/SalesType.php:51, src/Eccube/Repository/OrderItemRepository.php:1` | RG-012,007 |  |
| m12-04 | カスタマイズ | 乖離 | 乖離（Excel項目名 vs 詳細設計・現行のヘッダ文言／要実機確認・要仕様確定） | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Analysis/SalesController.php:106, ec-cube-enterprise/src/Eccube/Servic` | RG-011 |  |
| m12-04 | カスタマイズ | 乖離 | 乖離（集計対象の絞り込みが設計に無い／0行化の危険）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SalesAnalysisController.php:112, src/Eccube/Repository/OrderItem` | RG-016,025 |  |
| m12-04 | カスタマイズ | 乖離 | 乖離（現行のみ・メソッド無制限）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/Admin/AnalysisServiceProvider.php:43, ec-cube-enterprise/src/Eccube/Con` | RG-001 |  |
| m12-04 | カスタマイズ | 乖離 | 乖離（デッドコード相当・CSRF指定の無効化／設計はフォームを持たないと規定）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Analysis/SalesController.php:91, app/Plugin/HareruyaEc/Form/Type/Admin` | §5 CSRF(要判定) |  |
| m12-04 | カスタマイズ | 乖離 | 乖離（現行のみ・失敗時に共通例外処理へ委ねられない）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Analysis/SalesController.php:133, ec-cube-enterprise/src/Eccube/Servic` | RG-019 |  |
| m12-05 | カスタマイズ | 乖離 | 乖離（現行踏襲違反・セッション残存によるCSV誤抽出）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/ProductRequestController.php:48` | RG-002,004 |  |
| m12-05 | カスタマイズ | 乖離 | 乖離（Excel要件違反・会員名検索の欠落／現行踏襲違反・分割検索の欠落） | `ec-cube-enterprise/src/Eccube/Repository/DtbProductRequestRepository.php:338` | RG-006,007,008,009 |  |
| m12-05 | カスタマイズ | 乖離 | 乖離（現行踏襲違反・境界の含み方が変化）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/DtbProductRequestRepository.php:361` | RG-012（DV-10） |  |
| m12-05 | カスタマイズ | 乖離 | 乖離（現行踏襲差・会員名並べ替えの欠落）／要実機確認（RG-015,027と連動） | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/Analysis/SearchProductRequestType.php:33, ec-cube-enterprise/src/Eccube/Re` | RG-015 |  |
| m12-05 | カスタマイズ | 乖離 | 乖離（副作用の非発生・現行踏襲差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/ProductRequestController.php:64, ec-cube-enterprise/src/Eccube/R` | RG-005 |  |
| m12-05 | カスタマイズ | その他 | \ | `ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/ProductRequestController.php:69` | !$searchForm->isValid()) |  |
| m12-06 | カスタマイズ | 乖離 | 乖離（設計違反・エラー処理の分岐差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/ProductRequestController.php:96` | RG-021 |  |
| m12-06 | カスタマイズ | 乖離 | 乖離（項目名不一致）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ProductRequestCsvExportService.php:29` | RG-001,RG-005 |  |
| m12-06 | カスタマイズ | 乖離 | 乖離（現行=カスタマイズ未反映／詳細設計HTMLがカスタマイズ要件と競合）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Analysis/RequestController.php:15, pf-eccube3/app/Plugin/HareruyaEc/Re` | RG-001〜006,013 |  |
| m12-06 | カスタマイズ | 乖離 | 乖離（入口パス差・設計の記載と不一致）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/ProductRequestController.php:92, pf-eccube3/app/Plugin/HareruyaE` | RG-027 |  |
| m12-06 | カスタマイズ | 乖離 | 乖離（計上式の解釈差・併存時に取りこぼし）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/DtbProductRequestRepository.php:327` | RG-005（§3 DV-07） |  |
| m12-06 | カスタマイズ | 乖離 | 乖離（CSVが表示件数で打ち切られる懸念・全件化の意図が不達）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbProductRequestRepository.php:241, pf-eccube3/.../RequestController.php:91` | RG-015 |  |
| m12-06 | カスタマイズ | 乖離 | 乖離（行の分割単位・重複排除キーが設計に明示なし）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/DtbProductRequestRepository.php:334` | RG-001,RG-006（§3 DV-08） |  |
| m12-07 | カスタマイズ | 乖離 | 乖離（フォーマット列順が rank 昇順にならない）／要実機確認（vendor未取得のため実行確認が必要） | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Analysis/FormatSalesController.php:72, pf-eccube3/app/Plugin/HareruyaE` | RG-022 |  |
| m12-07 | カスタマイズ | 乖離 | 乖離（必須検証がサーバ側で効かない）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Analysis/FormatSalesType.php:20, pf-eccube3/app/Plugin/HareruyaEc/Contr` | RG-009・DM-03 |  |
| m12-07 | カスタマイズ | 乖離 | 乖離（タグ無し売上の欠落可能性）／要実機確認（全商品に dtb_product_sub 行が存在するか） | `pf-eccube3/app/Plugin/HareruyaEc/Repository/OrderRepository.php:1697, pf-eccube3/app/Plugin/HareruyaEc/Entity/DtbProduct` | RG-015,016,017 |  |
| m12-07 | カスタマイズ | 乖離 | 設計沈黙・実装はCSRF未描画/未検証／要仕様確認・要実機確認（乖離判定にはCSRF方針の確定が必要） | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Analysis/format_sales.twig:23, FormatSalesController.php:39` | §1・§5（CSRF=要判定） |  |
| m12-08 | カスタマイズ | 乖離 | 乖離（設計違反・入口メソッド/パスの差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:98, pf-eccube3/app/Plugin/HareruyaEc/S` | RG-001,034 |  |
| m12-08 | カスタマイズ | 乖離 | 乖離（設計違反・画面遷移/エラー種別の追加）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:103` | RG-019,026,027 |  |
| m12-08 | カスタマイズ | 乖離 | 乖離（設計と実装の不一致・M12-08への集計対象指定の波及がオラクル未確定）／要実機確認・人手判断 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/Analysis/FormatSalesType.php:48, .../FormatSalesController.php:112, ec-cub` | RG-040, DV-07 |  |
| m12-08 | カスタマイズ | 乖離 | 乖離（設計違反・必須検証の欠落／未入力時の挙動が共通例外処理か否か不明）／要実機確認 | `pf-eccube3/.../FormatSalesController.php:157, ec-cube-enterprise/.../FormatSalesController.php:109` | RG-023, DV-05 |  |
| m12-09 | 現行踏襲 | その他 | date("Y-m-d") }}`）。移行先も同じく2週間前 — `ec-cube-enterprise/src/Eccube/Form/Type/Admin/Analysis/SearchUsedCardType.php:47`（`'data' => new | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Analysis/UsedCardType.php:39, pf-eccube3/app/Plugin/HareruyaEc/Resource` | **乖離（Excel画面項目の初期値未実装・現行 |  |
| m12-09 | 現行踏襲 | 乖離 | 乖離（表示・入力書式の区切りがExcel規定と不一致）／要実機確認 | `pf-eccube3/.../Form/Type/Admin/Analysis/UsedCardType.php:37, pf-eccube3/.../template/admin/Analysis/used_card.twig:22, e` | RG-009, DV-02 |  |
| m12-09 | 現行踏襲 | 乖離 | 乖離（画面項目ラベルの不一致）／要実機確認 | `pf-eccube3/.../Form/Type/Admin/Analysis/UsedCardType.php:56, ec-cube-enterprise/.../SearchUsedCardType.php:67, ec-cube-e` | RG-006 |  |
| m12-09 | 現行踏襲 | 乖離 | 乖離（入口URL・HTTPメソッド・{mode}指定の消失／ルート名変更）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/Admin/AnalysisServiceProvider.php:71, ec-cube-enterprise/.../Controller` | RG-012,016 |  |
| m12-09 | 現行踏襲 | 乖離 | 乖離（ナビ名称が詳細設計と不一致・Excel機能名とは一致＝設計間の不整合）／要実機確認・仕様確認 | `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/Admin/SidebarProvider.php:336, ec-cube-enterprise/app/config/eccube/pac` | RG-001 |  |
| m12-09 | 現行踏襲 | その他 | simple$'` でアンカーが片側のみ（`^product` または `simple$`＝"simpl"+"e"の0回以上）＝想定外値を通し得る — `pf-eccube3/.../ServiceProvider/Admin/AnalysisServiceP | `—` | **乖離候補（不正mode時の挙動が未定義・オラ |  |
| m12-10 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・セッション保持と引き継ぎの喪失／設計の副作用・遷移前後の状態が成立しない）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Analysis/UsedCardController.php:14, ec-cube-enterprise/src/Eccube/Cont` | RG-002,004,005,014 |  |
| m12-10 | 現行踏襲 | その他 | simple$')`）／`UsedCardController.php:16-69`（`EXPORT_DATA` に `product`＝Excel同一の17列ヘッダ `:19-37` と `simple`＝「カード名・採用枚数」の2列 `:58-68`）／` | `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/Admin/AnalysisServiceProvider.php:71` | **乖離（現行踏襲違反・形式別出力/略式CSVの |  |
| m12-10 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・集計結果画面の喪失／画面遷移表と不一致）／要実機確認 | `pf-eccube3/.../AnalysisServiceProvider.php:67, UsedCardController.php:96, ec-cube-enterprise/.../UsedCardController.php:` | RG-003,023 |  |
| m12-10 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・URL/ルート名の変更）／要実機確認 | `pf-eccube3/.../AnalysisServiceProvider.php:67, ec-cube-enterprise/.../UsedCardController.php:39` | RG-001,003,005,023 |  |
| m12-10 | 現行踏襲 | 乖離 | 乖離（設計と実装の不一致・CSRFトークン不在／現行内部でも検索とCSV出力でフォーム定義が不整合）／要実機確認 | `pf-eccube3/.../UsedCardType.php:19, UsedCardController.php:124, ec-cube-enterprise/.../SearchUsedCardType.php:34` | RG-018,024 |  |
| m13-01 | カスタマイズ | 乖離 | 乖離（詳細設計の記述と実装の不一致＝詳細設計側の誤り疑い）／要実機確認 | `pf-eccube3/.../DtbEventRepository.php:55, ec-cube-enterprise/src/Eccube/Repository/DtbEventRepository.php:83` | RG-003・§3 DV-11 |  |
| m13-02 | カスタマイズ | 乖離 | 乖離（カスタマイズ未達・新規要件） | `pf-eccube3/.../Admin/EventController.php:115` | RG-007 |  |
| m13-03 | 現行踏襲 | 乖離 | 乖離（★カスタマイズ要件の判定条件差・過検知/検知漏れの双方）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Schedule/PaymentExistenceValidator.php:26, pf-eccube3/app/Plugin/Hareru` | RG-028,029 |  |
| m13-03 | 現行踏襲 | 乖離 | 乖離（条件付き必須がサーバ側で成立せずJS迂回で欠落登録が通りうる）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Schedule/ScheduleType.php:41, pf-eccube3/app/Plugin/HareruyaEc/Resource` | RG-023（DV-22,DV-24,DV-26 |  |
| m13-03 | 現行踏襲 | 乖離 | 乖離（数値下限がサーバ側で成立せず定員0の登録が通りうる）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Schedule/ScheduleType.php:91, pf-eccube3/app/Plugin/HareruyaEc/config.y` | RG-025（DV-02） |  |
| m13-03 | 現行踏襲 | 乖離 | 乖離（Excel未規定の相関制約＝設計に無いエラーが発生しうる）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Schedule/ScheduleType.php:59` | RG-026,027 |  |
| m13-03 | 現行踏襲 | 乖離 | 乖離（定員/参加費/公開状態の初期値がExcel定数と一致しない可能性）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Entity/DtbEventDetail.php:402, ScheduleController.php:34, schedule.twig:96, ScheduleCon` | RG-004 |  |
| m13-03 | 現行踏襲 | 乖離 | 乖離（カスタマイズ注記のボタン表示名 未反映・軽微）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Schedule/schedule.twig:242` | RG-011 |  |
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
| m13-05 | カスタマイズ | 乖離 | 乖離（必須/任意の相違）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:100` | RG-020,042(DV-O01) |  |
| m13-05 | カスタマイズ | 乖離 | 乖離（最大桁数の相違）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:149, ec-cube-enterprise/app/config/eccube/packages/eccube.ya` | RG-041(DV-M21) |  |
| m13-05 | カスタマイズ | 乖離 | 乖離（プルダウン絞り込みの欠落・縦深防御の片肺）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:88` | RG-024 |  |
| m13-05 | カスタマイズ | 乖離 | 乖離（入口URL・ルート名・ID制約の相違）／要実機確認（id=0・007 の応答） | `ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventController.php:245` | RG-001,039 |  |
| m13-05 | カスタマイズ | 乖離 | 乖離（設計未確定＋現行踏襲差・要設計判断）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:76, pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Event/E` | DV-X01 |  |
| m13-05 | カスタマイズ | 乖離 | 乖離（Excel規定項目の欠落／対応関係が要設計確認）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:76` | RG-003(DV-C17,C18),041(D |  |
| m13-06 | カスタマイズ | その他 | DESC | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:140` | asc |  |
| m13-06 | カスタマイズ | 乖離 | 乖離（正本 `superseded-notice` が Excel 削除項目3-3 を取りこぼし＝詳細設計の記述漏れ）／要実機確認・要設計確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Entry/EntryListType.php:117, pf-eccube3/app/Plugin/HareruyaEc/Repositor` | §0・§5（要判定） |  |
| m13-06 | カスタマイズ | 乖離 | 乖離（Excel指定外の項目まで操作不可＝デッキ登録有無で絞り込めない）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/assets/js/entrylist.js:104, pf-eccube3/app/Plugin/HareruyaEc/Fo` | RG-047,010 |  |
| m13-07 | 現行踏襲 | 乖離 | 乖離（詳細設計 L347 の記述誤り・L326/L332 と競合／Excel L3681 の限定「変更された申込」が詳細設計に反映されていない）／要実機確認（「変更された」の判定基準がExcel未規定） | `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbEntryHistoryRepository.php:31, ec-cube-enterprise/src/Eccube/Repository/D` | RG-016,017,021 |  |
| m13-07 | 現行踏襲 | 乖離 | 乖離（設計の必須（L334）に対し現行はサーバ側検証を持たず、対象0件でも完了応答＝設計と不一致）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Entry/BulkUpdateType.php:20, pf-eccube3/app/Plugin/HareruyaEc/Controlle` | RG-010 |  |
| m13-07 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・部分成功 vs 全体拒否／設計が沈黙のため意図オラクル未確定）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:607, ec-cube-enterprise/src/Eccube/Service/Admin/E` | RG-018 |  |
| m13-09 | カスタマイズ | 乖離 | 乖離（設計どおり絞られない疑い）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/Admin/EntryServiceProvider.php:47, pf-eccube3/app/Plugin/HareruyaEc/Con` | RG-002 |  |
| m13-09 | カスタマイズ | 乖離 | 乖離（データ設定依存・未設定なら要件違反で3項目が出力される）／要実機確認（本番 dtb_csv.enable_flg の実値確認が必須） | `pf-eccube3/app/Plugin/HareruyaEc/Resource/doctrine/migration/Version20180514185400.php:66` | RG-009（§3 DI-10,24,32） |  |
| m13-10 | カスタマイズ | 乖離 | 乖離（カスタマイズ要件が現行未反映／詳細設計HTMLがExcelと矛盾）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Entry/EntryDetailType.php:57, Controller/Admin/EntryController.php:509,` | RG-006,024・DV-12 |  |
| m13-10 | カスタマイズ | その他 | Store\ | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:330` | shop"` の該当は一覧検索の絞り込み `:2 |  |
| m13-10 | カスタマイズ | 乖離 | 乖離（一致対象がExcel規定より広い／廃止項目が検索に残存）／要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/DtbPlayerRepository.php:63` | RG-033・DV-07〜11 |  |
| m13-10 | カスタマイズ | 乖離 | 乖離（URL構成・HTTPメソッドが現行踏襲から変化）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryController.php:259, src/Eccube/Controller/Admin/Event/EntryReg` | RG-001,017,038 |  |
| m13-10 | カスタマイズ | 乖離 | 乖離（既定が仕様と逆・オプション依存で要件が失われうる）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventEntryDetailType.php:73, src/Eccube/Controller/Admin/Event/EntryContro` | RG-004,014・DV-01〜06 |  |
| m13-11 | 現行踏襲 | 乖離 | 乖離（モーダル版が本機能の画面に該当する場合は複数選択要件に不一致）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Event/EventListType.php:62, ec-cube-enterprise/src/Eccube/Form/Type/Adm` | RG-002,010・DV-05 |  |
| m13-11 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・部分一致の検索対象列の縮小）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbEventDetailRepository.php:246, ec-cube-enterprise/src/Eccube/Repository/D` | RG-001・DV-01 |  |
| m13-11 | 現行踏襲 | 乖離 | 乖離（現行=検索対象の限定がパラメータ依存＝限定が外れうる）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:205, pf-eccube3/app/Plugin/HareruyaEc/Repository/D` | RG-005 |  |
| m13-11 | 現行踏襲 | 乖離 | 乖離（実装不備・非同期でない要求で未定義変数参照が発生）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:182` | RG-026 |  |
| m13-11 | 現行踏襲 | 乖離 | 乖離（入口URL・HTTPメソッド・非同期方式の変更＝詳細設計の記述と不一致）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/Admin/EntryServiceProvider.php:35, ec-cube-enterprise/src/Eccube/Contro` | RG-022,023,024,030 |  |
| m13-12 | カスタマイズ | その他 | 権限を保持している店舗のイベントのみ登録が可能（Excel 0214:L4967,0214:L4975,0214:L4976）。識別ID:2-3/2-4/3-1 は権限を保持している店舗のイベントの申込のみ表示（0214 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:347, ec-cube-enterprise/src/Eccube/Controller/Admi` | !$this->getMember()->isE |  |
| m13-12 | カスタマイズ | 乖離 | 乖離（初期値の取得元が イベント→イベント詳細 へ変化・日程個別参加費の反映有無が変わる）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:447, ec-cube-enterprise/src/Eccube/Form/Type/Admin` | RG-005,023 |  |
| m13-13 | カスタマイズ | 乖離 | 乖離（オンライン受付の有効化が反映されない）／要実機確認 | `BulkEntryImportHandler.php:373, pf-eccube3/app/Plugin/HareruyaEc/Entity/DtbEventDetail.php:51, DtbEventDetail.php:840` | RG-027,024／DV-05 |  |
| m13-13 | カスタマイズ | 乖離 | 乖離（前提検証の検出条件・メッセージ・検出段階が設計と不一致）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:190, MessageStore.php:75, pf-eccube3/src/Eccube/Se` | RG-011,010 |  |
| m13-13 | カスタマイズ | その他 | \ | `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:272` | !$hasBreak;` は「エラーなし **ま |  |
| m13-13 | カスタマイズ | 乖離 | 乖離（エラーメッセージの内容不整合）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/Importer/Validator/RequireWhenYesValidator.php:63` | RG-033／DV-04,05 |  |
| m13-13 | カスタマイズ | 乖離 | 乖離（境界の文言と条件の不一致・行数の数え方が改行依存／環境依存）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:670, CsvImporter.php:138` | RG-009／DV-11,12,13 |  |
| m13-14 | 現行踏襲 | 乖離 | 乖離（設計記述と実装の不一致・絞り込み機能の不成立）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/BannerController.php:103, ec-cube-enterprise/src/Eccube/Controller/Adm` | RG-019,036 |  |
| m13-14 | 現行踏襲 | 乖離 | 乖離（設計記述の誤り・削除対象の取り違え／設計書内不整合）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/BannerController.php:132, pf-eccube3/app/Plugin/HareruyaEc/Resource/te` | RG-021,022,016 |  |
| m13-14 | 現行踏襲 | その他 | 並び順（識別ID:10）の制限は 数値(整数)・必須〇 のみ。Excel `:5623` の最大値列は空欄で、範囲（1〜15）の規定は無い | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/Event/EventBannerSettingType.php:204` | $sortNo > $slotCount)` で |  |
| m13-14 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・エラー提示経路の追加）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Banner/banner.twig:31, ec-cube-enterprise/src/Eccube/Resource/t` | RG-008(DV-10,DV-11) |  |
| m13-14 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・管理者の選択値が書き換わる）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Admin/Event/EventBannerStoreAction.php:62, pf-eccube3/app/Plugin/HareruyaEc/Contro` | RG-033,011 |  |
| m13-14 | 現行踏襲 | 乖離 | 乖離（現行=Excel「半角」未適合・検査の実質不成立）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Banner/BannerType.php:74, ec-cube-enterprise/src/Eccube/Form/Type/Admin` | RG-006 |  |
| m13-14 | 現行踏襲 | 乖離 | 乖離（設計に無い店舗別認可の追加・現行踏襲差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Event/BannerController.php:134, pf-eccube3/app/Plugin/HareruyaEc/Controll` | RG-029,028 |  |
| m13-14 | 現行踏襲 | 乖離 | 乖離（設計の沈黙・並び順の保存有無と再表示値が正本から追跡不能）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/BannerController.php:291, ec-cube-enterprise/src/Eccube/Service/Admin/` | RG-008,RG-038 |  |
| m13-15 | カスタマイズ | 乖離 | 乖離（Excel必須 vs 実装任意・表示/処理の不整合）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/BannerController.php:174` | RG-020,DV-09 |  |
| m13-15 | カスタマイズ | 乖離 | 乖離の疑い（一覧整列キー）／要実機確認（実データでの並びを実測して確定） | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/BannerController.php:77` | RG-004 |  |
| m13-15 | カスタマイズ | 乖離 | 乖離（失敗再描画時の一覧が設計と不一致）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/BannerController.php:267` | RG-035,005,002 |  |
| m14-01 | カスタマイズ | 乖離 | 乖離（現行で未除去・詳細設計HTMLがExcelの除去要件と矛盾）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Card/SearchCardType.php:151, pf-eccube3/app/Plugin/HareruyaEc/Repositor` | RG-024 |  |
| m14-01 | カスタマイズ | 乖離 | 乖離（現行踏襲差・CSRF有効化）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Card/SearchCardType.php:20, ec-cube-enterprise/src/Eccube/Form/Type/Adm` | RG-054 |  |
| m14-01 | カスタマイズ | その他 | DESC | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/SearchControllerTrait.php:140` | asc |  |
| m14-02 | カスタマイズ | 乖離 | 乖離（現行・項目名不一致／論理キーはオラクル未規定）／要実機確認 | `pf-eccube3/.../CardCsvController.php:161, ec-cube-enterprise/.../CardCsv.php:94` | RG-010／DDT-A #28 |  |
| m14-03 | 現行踏襲 | その他 | `cardIds` の各要素が空文字相当、またはカードマスタが取得できないとき HTTP 404 で打ち切る（L326 手順5・L334 順序3・L360・L371「対象カード不在 HTTP 404」） | `/Card/CardController.php:327, /Admin/CardController.php:179` | !$mtbCard = $app['hareru |  |
| m14-03 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・外部連携の欠落＝支店側にカード削除が伝播しない）／要実機確認 | `/Card/CardController.php:309, ec-cube-enterprise/src/Eccube/Service/Product/InventoryReflectService.php:111, ec-cube-ent` | RG-023,024,025,026,027 |  |
| m14-04 | カスタマイズ | 乖離 | 乖離（Excel指定文言の不一致）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardController.php:300, ec-cube-enterprise/src/Eccube/Resource/local` | RG-030 |  |
| m14-04 | カスタマイズ | 乖離 | 乖離（Excel指定文言の不一致）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/edit.twig:216, ec-cube-enterprise/src/Eccube/Resource/locale/` | RG-029 |  |
| m14-04 | カスタマイズ | 乖離 | 乖離（詳細設計のメッセージキー名のみ・利用者非観測）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardController.php:285, messages.ja.yaml:4280` | RG-031,032 |  |
| m14-04 | カスタマイズ | 乖離 | 乖離（現行踏襲違反・エラーステータスの区別喪失）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardController.php:192` | RG-027,003 |  |
| m14-04 | カスタマイズ | 乖離 | 乖離（ルート・パス体系差＝詳細設計の記述が現行3系のまま）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardController.php:204` | RG-001,002,023,024,030,0 |  |
| m14-04 | カスタマイズ | 乖離 | 乖離（内部差・セッション互換）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardController.php:53` | RG-021,049 |  |
| m14-05 | カスタマイズ | 乖離 | 乖離（設計未記載の上限・5010行以上のカードCSVが取込不可）／要実機確認（設計に上限が無い以上、業務上の想定行数と 5010 の妥当性は要確認。設計書への追記が必要） | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardCsvController.php:102, ec-cube-enterprise/src/Eccube/Controller/` | RG-011,013,014 |  |
| m14-05 | カスタマイズ | 乖離 | 乖離（Excelの最大文字数が取込で検証されない・超過時はDB側エラーか切り詰めに委ねられる）／要実機確認 | `—` | RG-010（§3-5 DL-06） |  |
| m14-05 | カスタマイズ | 乖離 | 設計書間の乖離（詳細設計HTMLがカスタマイズ前の現行を記述・Excel優先で無効）／設計書更新が必要（実装＝enterpriseはExcelに適合） | `ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:110, pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/CardCsvCont` | RG-006（§3-1） |  |
| m14-05 | カスタマイズ | 乖離 | 設計書間の乖離（詳細設計HTMLがカスタマイズ前の現行を記述・Excel優先で無効）／除外列一覧は実装と設計の双方で要更新・要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:63, pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/CardCsvContr` | RG-009,011（§3-4） |  |
| m14-06 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・セッション初期化機構の欠落）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardsetController.php:52` | RG-001,007（DV-13〜15） |  |
| m14-06 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・不正値の非無視／未検証値のセッション保存）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardsetController.php:55, ec-cube-enterprise/src/Eccube/Repository/M` | RG-006,032（DV-07〜12） |  |
| m14-06 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・パラメータ名/セッションキー/URL互換）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardsetController.php:81, ec-cube-enterprise/app/DoctrineMigrations/` | RG-005,027,028（DV-01〜06） |  |
| m14-06 | 現行踏襲 | その他 | trans({ "%name%" : Cardset.nameJp }) }}"`、実文言は `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1786`「この操作はあとから取り消す | `ec-cube-enterprise/app/template/admin/Cardset/index.twig:176` | **乖離（Excel文言・確定ボタン名・3点リー |  |
| m14-07 | 現行踏襲 | 乖離 | 乖離（実装誤記・未選択DL経路が偶然動作に依存）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Cardset/card_set.twig:26` | RG-034 |  |
| m14-07 | 現行踏襲 | 乖離 | 乖離（実装誤記・不正MIME）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/CardSetController.php:377` | RG-021 |  |
| m14-07 | 現行踏襲 | 乖離 | 乖離（コメント陳腐化・実装はExcel適合＝仕様変更時の誤読リスク）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/CardSetController.php:280, pf-eccube3/app/Plugin/HareruyaEc/Service/S3` | RG-004 |  |
| m14-07 | 現行踏襲 | 乖離 | 乖離（未初期化変数・前ループ残値のディレクトリへ混入し得る）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/CardSetController.php:311, MtbCardDetailRepository.php:355` | RG-025（DV-08） |  |
| m14-07 | 現行踏襲 | 乖離 | 乖離（非対称・作業ファイル残置）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/event.yml:23, Event/Admin/CardSetEvent.php:21, CardSetController.php:411` | RG-019 |  |
| m14-07 | 現行踏襲 | 乖離 | 乖離（設計書内矛盾・L361が誤り）／設計書修正要 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/CardSetController.php:344` | RG-016, RG-017 |  |
| m14-07 | 現行踏襲 | 乖離 | 乖離（実装の脆弱性・スコープ漏れ依存）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/CardSetController.php:360` | RG-013 |  |
| m14-08 | カスタマイズ | 乖離 | 乖離（Excelカスタマイズ要件違反・確認文言差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1786, ec-cube-enterprise/app/template/admin/Cardset/edit.` | RG-025 |  |
| m14-08 | カスタマイズ | 乖離 | 乖離（Excelカスタマイズ要件違反・完了文言差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardsetController.php:211, ec-cube-enterprise/src/Eccube/Resource/lo` | RG-029,038 |  |
| m14-08 | カスタマイズ | 乖離 | 乖離（Excel明示文言との差・どのドメインが表示されるかも要確認）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/CardsetType.php:91, ec-cube-enterprise/src/Eccube/Resource/locale/validato` | RG-012(DV-10) |  |
| m14-08 | カスタマイズ | 乖離 | 乖離（現行踏襲差・ルート体系の不整合）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardsetController.php:186` | RG-026,028,033,035 |  |
| m14-08 | カスタマイズ | 乖離 | 乖離（現行踏襲差・送信ルート構造と完了文言）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardsetController.php:116, ec-cube-enterprise/src/Eccube/Resource/lo` | RG-008〜011,013 |  |
| m14-08 | カスタマイズ | 乖離 | 乖離（設計指摘の解消＝改善方向。ただしDV-16の固定オラクルは無い）／要実機確認 | `ec-cube-enterprise/src/Eccube/Entity/Master/MtbCardset.php:109, ec-cube-enterprise/src/Eccube/Form/Type/Admin/CardsetTyp` | RG-012(DV-08,DV-16) |  |
| m14-09 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・並び順の非決定化）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/FormatController.php:45` | RG-002, DV-02 |  |
| m14-09 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・拒否時の戻り先変化）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/FormatController.php:142` | RG-021, RG-019 |  |
| m14-09 | 現行踏襲 | 乖離 | 乖離（設計記載URLとの不一致・削除のみパス体系不統一）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/FormatController.php:130` | RG-024, RG-022 |  |
| m14-09 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・削除成功パスの喪失／連鎖削除欠落）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/FormatController.php:158, ec-cube-enterprise/src/Eccube/Entity/Maste` | RG-017, DV-09 |  |
| m14-10 | カスタマイズ | 乖離 | 乖離（文言差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1786, app/template/admin/Format/format_list.twig:65, edit` | RG-021 |  |
| m14-10 | カスタマイズ | 乖離 | 乖離（文言/キー差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/FormatController.php:161, src/Eccube/Resource/locale/messages.ja.yam` | RG-022 |  |
| m14-10 | カスタマイズ | 乖離 | 乖離（文言差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/FormatType.php:76, src/Eccube/Resource/locale/messages.ja.yaml:4319` | RG-047(DV-09,12) |  |
| m14-10 | カスタマイズ | 乖離 | 乖離（遷移先の差・リファラ復帰なし）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/FormatController.php:145` | RG-025,026,027,028 |  |
| m14-10 | カスタマイズ | 乖離 | 乖離（キー/文言の内部差・利用者可観測）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/FormatController.php:143, src/Eccube/Resource/locale/messages.ja.yam` | RG-025,026,027 |  |
| m14-10 | カスタマイズ | 乖離 | 乖離（削除前処理の欠落・削除不能化のおそれ）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/FormatController.php:158, messages.ja.yaml:1595` | RG-023 |  |
| m14-10 | カスタマイズ | 乖離 | 乖離（経路の不整合）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/FormatController.php:130` | RG-022,029,030 |  |
| m14-10 | カスタマイズ | 乖離 | 乖離（キー/文言差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/FormatController.php:72, src/Eccube/Resource/locale/messages.ja.yaml` | RG-009,010 |  |
| m14-10 | カスタマイズ | 乖離 | 乖離（失敗フラッシュの欠落）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Card/FormatController.php:77` | RG-011 |  |
| m15-01 | カスタマイズ | 乖離 | 乖離（入力最大長の上限超過・Excel設計値と実設定値の不一致）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchDeckType.php:47, ec-cube-enterprise/app/config/eccube/packages/eccub` | RG-041(DV-02,06,08,10,12 |  |
| m15-01 | カスタマイズ | 乖離 | 乖離（入力最大長の上限超過）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchDeckType.php:164, ec-cube-enterprise/app/config/eccube/packages/eccu` | RG-041(DV-14) |  |
| m15-01 | カスタマイズ | 乖離 | 乖離（Excel指定マスタ MtbShop の不在・選択肢母集合の変質）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchDeckType.php:179, ec-cube-enterprise/src/Eccube/Repository/DtbDeckRe` | RG-025 |  |
| m15-01 | カスタマイズ | 乖離 | 乖離（1以上がサーバ側で強制されない・0が黙って無視）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchDeckType.php:132, ec-cube-enterprise/src/Eccube/Repository/DtbDeckRe` | RG-021(DV-23) |  |
| m15-01 | カスタマイズ | 乖離 | 乖離（入力書式の表記差・Excel設計値と実装の不一致）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchDeckType.php:110` | RG-018(DV-18〜20)・RG-041( |  |
| m15-01 | カスタマイズ | 乖離 | 乖離（page_no=0 到達可・編集URL形の不一致）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:75` | RG-034,046 |  |
| m15-02 | 現行踏襲 | その他 | 設計書不整合（詳細設計がExcelのカスタマイズ除去を未反映）／実装はExcel準拠。詳細設計HTMLの旧サイト節に除去注記が必要 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/DeckCsvController.php:150, pf-eccube3/app/Plugin/HareruyaEc/ServicePro` | §0（旧サイト全系統） |  |
| m15-02 | 現行踏襲 | 乖離 | 乖離（URLパス差・外部ブックマーク/直リンク非互換）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:677` | RG-006 |  |
| m15-02 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・CSRFトークン粒度と失敗時遷移先）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:680, ec-cube-enterprise/src/Eccube/Resource/templ` | RG-026 |  |
| m15-02 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・Content-Type/charset表明の欠落）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/DeckCsvExporterService.php:86` | RG-020, RG-021 |  |
| m15-02 | 現行踏襲 | 乖離 | 乖離（現行踏襲差・入力正規化の追加。品質向上だが挙動差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:690` | DV-06 |  |
| m15-02 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・クライアント未選択ガードの欠落）／要実機確認 | `—` | RG-003, DV-01 |  |
| m15-03 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・入口URL変更）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:139` | RG-008,029 |  |
| m15-03 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・トークンID/リフレッシュ差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:143` | RG-009,011 |  |
| m15-03 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・遷移分岐の消失）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:149` | RG-012,013・DV-01 |  |
| m15-03 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・空配列時の成功フラッシュ喪失）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:154` | RG-020・DV-04 |  |
| m15-03 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・エラーメッセージキー変更）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Admin/Deck/DeckBulkDeleteAction.php:56, ec-cube-enterprise/src/Eccube/Controller/A` | RG-015・DV-05 |  |
| m15-03 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・ブロック時遷移先変更）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:169` | RG-015,021,022,025・DV-05 |  |
| m15-03 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・部分確定→全件ロールバック）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Admin/Deck/DeckBulkDeleteAction.php:41` | RG-016,021,026,034 |  |
| m15-03 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・成功キー変更／設計沈黙部への独自規則追加）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:177, ec-cube-enterprise/src/Eccube/Service/Admin/` | RG-017,029・DV-02,DV-07 |  |
| m15-03 | 現行踏襲 | その他 | m15-01_admin_deck_deck_search' pf-eccube3/app/` → 0件）。実際のbind名は `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/Admin/DeckServic | `—` | **乖離（設計文書の記述不整合・調査導線が無効） |  |
| m15-06 | カスタマイズ | 乖離 | 乖離（限定条件の逸脱・非公開デッキのリスト情報が明細として残る）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/DeckCsv.php:160` | RG-012,024 |  |
| m15-06 | カスタマイズ | 乖離 | 乖離（更新セマンティクスと明細の不整合＝明細増殖）／設計の穴（削除要否が未規定）／要実機確認・仕様確認 | `pf-eccube3/app/Plugin/HareruyaEc/Util/CardUtil.php:103, Service/Csv/DeckCsv.php:156` | RG-042 |  |
| m15-06 | カスタマイズ | 乖離 | 乖離（型/定数の取り違え・現状は値の偶然一致で顕在化せず＝潜在バグ）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/DeckCsv.php:61, Entity/DtbDeck.php:16, pf-eccube3/src/Eccube/Entity/Master/` | RG-011,012 |  |
| m15-07 | 現行踏襲 | 乖離 | 乖離（現行踏襲違反・論理sortKey改名で並び順が不定化）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Repository/MtbDeckTagRepository.php:23, ec-cube-enterprise/src/Eccube/Repository/Master` | RG-009,RG-010,RG-048 |  |
| m15-07 | 現行踏襲 | その他 | length > 0 %}`＝0より大きいとき表示。→ 件数1件でもページネーション（番号リンク1個）が出る。設計文（>1）と実装（>0）で1件時の表示有無が食い違う | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/DeckTag/deckTag.twig:89` | **乖離（表示条件の境界差 >1 vs >0）／ |  |
| m15-07 | 現行踏襲 | 乖離 | 乖離（メニュー導線と本書主題画面の不一致・POST専用bindのURL生成に依存する脆い構成／ルート登録順が変われば405となりうる）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider/Admin/SidebarProvider.php:416, pf-eccube3/app/Plugin/HareruyaEc/Service` | RG-001,RG-036 |  |
| m15-07 | 現行踏襲 | 乖離 | 乖離（表示順重複チェックが実行時エラーとなる疑い・要PHPバージョンと実機での確認）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Repository/MtbDeckTagRepository.php:53, RankDuplicateValidator.php:21, DeckTagControlle` | RG-027,RG-029(DV-12) |  |
| m15-08 | カスタマイズ | 乖離 | 乖離（Excel「DtbArchetypeから選択」に対する現行の暗黙の絞り込み。色未設定アーキタイプで検索不能）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Deck/SearchDeckType.php:82, ec-cube-enterprise/src/Eccube/Form/Type/Adm` | RG-009, DA-01 |  |
| m15-08 | カスタマイズ | 乖離 | 乖離（現行踏襲差・CSRF有効化）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Deck/SearchDeckType.php:25, ec-cube-enterprise/src/Eccube/Form/Type/Adm` | RG-031 |  |
| m15-08 | カスタマイズ | 乖離 | 乖離（境界条件の取り違え・大会開始ちょうどのデッキが欠落）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbDeckRepository.php:127, ec-cube-enterprise/src/Eccube/Repository/DtbDeckR` | RG-004, DA-01 |  |
| m15-08 | カスタマイズ | 乖離 | 要実機確認（設計が沈黙のため乖離とは断定しない。重複が出る場合は該当件数と一覧の不整合＝L341 のデータ整合性に反する） | `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbDeckRepository.php:169, ec-cube-enterprise/src/Eccube/Repository/DtbDeckR` | DA-08 |  |
| m15-09 | カスタマイズ | 乖離 | 乖離（Excel画面項目表と実装/詳細設計の必須・任意不一致）／仕様確認要・要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/ArchetypeType.php:80, pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Arc` | DV-12, RG-042 |  |
| m15-09 | カスタマイズ | 乖離 | 乖離（Excel上限255が実現不能・フォーム/スキーマ二重定義）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/ArchetypeType.php:44, ec-cube-enterprise/src/Eccube/Entity/DtbArchetype.ph` | DV-02, DV-16 |  |
| m15-09 | カスタマイズ | 乖離 | 乖離（現行踏襲違反・削除後のページ復帰欠落）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Archetype/ArchetypeController.php:203` | RG-025, RG-026 |  |
| m15-09 | カスタマイズ | 乖離 | 乖離（入口URL・HTTPメソッド構成の差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Archetype/ArchetypeController.php:179` | RG-008, RG-010, RG-023,  |  |
| m15-09 | カスタマイズ | 乖離 | 乖離（CSRF不正時の応答が403→フラッシュ+リダイレクトへ変化）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Archetype/ArchetypeController.php:182` | RG-045 |  |
| m15-09 | カスタマイズ | 乖離 | 乖離（内部差・フラッシュ/メッセージキーの変更）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Archetype/ArchetypeController.php:232, ec-cube-enterprise/src/Eccube/Serv` | RG-007, RG-024, RG-027 |  |
| m15-09 | カスタマイズ | 乖離 | 乖離（XHR入口構成・セッション保持の差）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Archetype/ArchetypeController.php:253` | RG-032〜041 |  |
| m15-09 | カスタマイズ | その他 | 設計書間不整合（詳細設計HTMLがExcelカスタマイズ未反映・Excelが正／詳細設計の更新要） | `ec-cube-enterprise/src/Eccube/Entity/DtbArchetype.php:106, .../Archetype/ArchetypeType.php:127, pf-eccube3/app/Plugin/Ha` | RG-018〜021 |  |
| o01-01 | カスタマイズ | 乖離 | 乖離（本書沈黙の遷移ガード・振込前の区分不整合）／A06-05設計を正・要実機確認 | `src/Controller/Admin/OtcBuyOrderStatusController.php:48, src/Entity/MtbOtcBuyOrderStatus.php:24, DtbOtcBuyOrderRepositor` | RG-006,016 |  |
| o01-01 | カスタマイズ | 乖離 | 乖離（設計「ロックなし後勝ち」と実装占有ガードの不一致・経路間非対称）／要実機確認 | `src/Controller/Admin/OtcBuyOrderStatusController.php:61` | RG-021 |  |
| o01-01 | カスタマイズ | 乖離 | 乖離疑義（空数量許容で合計0・実機再現で確定）／要実機確認 | `src/Entity/Api/OtcBuyOrderDetail.php:30, src/Controller/Admin/OtcBuyOrderController.php:128` | RG-010(DT-N1) |  |
| o01-01 | カスタマイズ | 乖離 | 乖離（低severity・コードスメル・機能影響なし） | `src/Controller/Admin/OtcBuyOrderFreeCommentController.php:44` | RG-019 |  |

## §3. 要実機確認・軽微（P3）（82件）

| 機能 | 区分 | 分類 | 判定（設計→実装の食い違い） | file:line | RG | 裁定 |
|---|---|---|---|---|---|---|
| a01-02 | 新規実装 | 要実機確認 | Excel内部不整合（実装は02:売上で整合）／要実機確認 | `SmaregiStockChangeApplier.php:45` | RG-004 |  |
| a01-02 | 新規実装 | 要実機確認 | Excel内部不整合／運用確定は要実機確認 | `SmaregiStockBackfillCommand.php:30` | RG-015 |  |
| a06-02 | カスタマイズ | 要実機確認 | 移行差（現行実装確認済／移行先未確認・要実機確認） | `src/Controller/Admin/OtcBuyOrderController.php:35, src/Repository/DtbOtcBuyOrderRepository.php:50` | RG-001,002 |  |
| a07-02 | 現行踏襲 | 要実機確認 | オラクル間競合／要実機確認（返却値は dtb_member.name・意味づけ要確認） | `src/Repository/DtbBuyOrderRepository.php:53` | RG-005,010 |  |
| a07-02 | 現行踏襲 | 要実機確認 | Excel記述揺れ（L1144の"査定前"）／要実機確認（抽出は4種で確定） | `src/Repository/DtbBuyOrderRepository.php:35` | RG-002 |  |
| a15-02 | 現行踏襲 | 要実機確認 | 要実機確認（設計の沈黙・現行/移行先で削除条件の扱いが非対称） | `deck-api/src/Controller/BaseController.php:77, deck-api/src/Entity/DtbPlayer.php:145, ec-cube-enterprise/src/Eccube/Repo` | RG-011・DV-05 |  |
| a15-02 | 現行踏襲 | 要実機確認 | 要実機確認（設計文言の解釈差・Cookie削除ではなく空値上書き） | `deck-api/src/Controller/LoginController.php:88, deck-api/src/Controller/LoginController.php:62` | RG-002 |  |
| a15-06 | 現行踏襲 | 要実機確認 | 正本の前提誤り（設計書の要修正）／要実機確認 | `deck-api/src/Controller/MasterController.php:61, deck-api/config/routes.yaml:17` | RG-030・DV-13 |  |
| a15-18 | 現行踏襲 | 要実機確認 | 「削除は含まない」を根拠に初期化を省略実装する誤読を招きうる（付帯表4#1 の移行先実装漏れと整合する疑い）。設計側の要確認 | `—` |  |  |
| a17-03 | 現行踏襲 | 要実機確認 | 要確認: pointAttr欠落時の履歴ポイント種別の扱いが現行/移行先で異なる。オラクルに必須/デフォルトの明示なし＝要実機確認 | `PointGranterController.php:58, PointGranterAction.php:50` |  |  |
| b02-04 | 現行踏襲 | 要実機確認 | 仕様沈黙（設計に無い抽出条件）／要実機確認 | `app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:1498` | DDT DA-05 |  |
| b02-04 | 現行踏襲 | 要実機確認 | 仕様沈黙（宛先マスタ流用・未設定時の無送信）／要実機確認 | `app/Plugin/HareruyaEc/Service/MailService.php:1179, ec-cube-enterprise/src/Eccube/Service/MailService.php:1196` | RG-006 |  |
| b02-06 | カスタマイズ | 要実機確認 | 設計沈黙（境界の開閉が未規定）／要実機確認（実装の境界を期待に採らない・§3 DP-04） | `pf-eccube3/app/Plugin/HareruyaEc/Repository/OrderRepository.php:1562, OrderRepository.php:1822` | RG-005／DP-04 |  |
| b02-06 | カスタマイズ | 要実機確認 | 設計沈黙（出力・終了コード未規定）／要実機確認 | `ProductBatch.php:47` | RG-004 |  |
| b02-06 | カスタマイズ | 要実機確認 | 設計沈黙（sell_price/member_id の値の出所が未規定）／要実機確認（実装値を期待に採らない） | `InsertStockHistory.php:67, DtbStockHistoryRepository.php:63, InsertStockHistory.php:62` | RG-009,010／§5 |  |
| b05-01 | 現行踏襲 | 要実機確認 | 一次=エラーメール送信（Excel記載あり）／エラー後の継続・終了ステータスは要実機確認 | `.../SmaregiOtcOrderPostAction.php:70, OtcOrderSmaregiPostCommand.php:52` | RG-011,023 |  |
| b13-02 | 現行踏襲 | 要実機確認 | 差異（抽出の時間閾値0・更新日時基準が設計で沈黙）／要実機確認 | `CheckCvsPaymentEntry.php:18, DtbEventEntryRepository.php:64` |  |  |
| b17-01 | 現行踏襲 | 要実機確認 | 実装差（設計沈黙・要実機確認・バグでない） | `AbstractListText.php:23, CreateLatestArticleListAction.php:87` | RG-004 |  |
| f03-01 | カスタマイズ | 要実機確認 | 要実機確認（Excel記載のページング範囲・+表記の実装有無が未確定） | `pf-eccube3/app/Plugin/HareruyaEc/Controller/ProductController.php:25` | RG-006,007 |  |
| f04-01 | カスタマイズ | 要実機確認 | Excelが沈黙（`-`）のため詳細設計で補完（`0304:1022`「カスタマイズ要件に記載の内容以外は現行踏襲とする」）＝§3 DV-09 は要実機確認 | `—` |  |  |
| f04-04 | 現行踏襲 | 要実機確認 | format(waitingNumber % 10000) }}</td>{% elseif orderNumber %}<th>ご注文番号</th>...`）＝呼び出し番号ありでTC注文番号、なしでご注文番号。ただし `waitingNumber % 100 | `...Shopping/complete.twig:34` | **設計どおり✓（下4桁表示は要実機確認）** |  |
| f05-01 | カスタマイズ | 要実機確認 | 要実機確認（リンクURLの所在未確定） | `index.twig:27` | RG-013 |  |
| f05-03 | カスタマイズ | 要実機確認 | default(500)` で 500円ゲートを適用。ただしユニサーチ一覧カード `purchase_product_list_unisearch.twig:34` は買取価格を `card.buyPrice > 0` で表示分岐しており、当該フラグメントでの | `src/Eccube/Controller/Front/Purchase/PurchaseController.php:80, _purchase_product_card.twig:27` | **設計どおり✓／一覧カードのゲート適用は要実機 |  |
| f05-03 | カスタマイズ | 要実機確認 | オラクル未規定（表示機構は要実機確認・断定せず縮退） | `—` | RG-039 |  |
| f06-09 | カスタマイズ | 要実機確認 | 要実機確認（ページング仕様が正本沈黙） | `DtbProductSubClassRepository.php:1635, MypageController.php:293` | §5台帳(ページング) |  |
| f06-21 | 現行踏襲 | 要実機確認 | 設計の要確認に対する実態＝enterpriseはstatus実装/close_reason未設定 | `WithdrawController.php:126, WithdrawController.php:94` | RG-004 |  |
| m03-30 | カスタマイズ | 要実機確認 | オラクル矛盾（要実機確認・実装バグとは断定しない） | `ProductPriceImportHandler.php:349` | RG-002 |  |
| m03-31 | 現行踏襲 | 要実機確認 | 設計側の不整合（要仕様確認）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:337` | RG-026 |  |
| m03-41 | カスタマイズ | 要実機確認 | Excel内不整合（列数の記述矛盾）／要実機確認 | `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/CategoryCsvImportHandler.php:224` | RG-013,018(DV-24〜26) |  |
| m04-09 | 新規実装 | 要実機確認 | 実装固有値（メッセージキー・期待に断定しない）／要実機確認 | `—` | DV-03（RG-005） |  |
| m04-09 | 新規実装 | 要実機確認 | 実装/ナラティブ由来（Excel業務仕様に非在）／要実機確認 | `src/Eccube/Service/Admin/Stock/StockTransferStoreAction.php:163, src/Eccube/Service/Admin/Stock/StockMoveOutboundApprova` | RG-021,014,015・§1副作用 |  |
| m04-10 | 新規実装 | 要実機確認 | 実装由来副作用（Excel規定外）／要実機確認 | `src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:112` | RG-010 |  |
| m04-14 | 新規実装 | 要実機確認 | 要実機確認（オラクル化しない） | `StockSplitJoinCsvExportService.php:122` | RG-009,026 |  |
| m04-20 | 新規実装 | 要実機確認 | 要実機確認（区分定義） | `DtbStockHistoryRepository.php:143` | RG-002 |  |
| m04-23 | 新規実装 | 要実機確認 | 設計書の記載欠落（実装は保護あり）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:228` | RG-039 |  |
| m04-23 | 新規実装 | 要実機確認 | 設計書の記載欠落（実装は全件ロールバック）／要実機確認 | `—` | RG-011 |  |
| m04-23 | 新規実装 | 要実機確認 | 実装事実（期待に使わない）／要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:427` | RG-041 |  |
| m04-23 | 新規実装 | 要実機確認 | 実装事実（期待に使わない）／要実機確認 | `—` | §5台帳(取込履歴) |  |
| m04-25 | 新規実装 | 要実機確認 | オラクル内矛盾（否定境界のみ要実機確認）。陽性側は RG-009 で EXEC 化 | `—` | RG-011（RG-009は陽性側のみ固定） |  |
| m04-28 | 新規実装 | 要実機確認 | 実装事実の記録（Excel沈黙・要実機確認）。期待には使わない | `src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:323, tests/Eccube/Tests/Web/Admin/Stock/StockMoveIn` | RG-010 |  |
| m04-28 | 新規実装 | 要実機確認 | 実装事実の記録（Excel沈黙・要実機確認） | `...StockMoveInstructionLabelCsvExporterService.php:74, src/Eccube/Repository/DtbStockMoveInstructionRepository.php:221` | RG-012 |  |
| m04-30 | 新規実装 | 要実機確認 | Excel沈黙・実装既定（要実機確認） | `src/Eccube/Service/Csv/Exporter/BarcodeReplacementListCsvExportService.php:73` | RG-023 |  |
| m04-30 | 新規実装 | 要実機確認 | Excel沈黙・実装既定（要実機確認） | `src/Eccube/Form/Type/Admin/BarcodeReplacementListType.php:101, src/Eccube/Controller/Admin/Stock/BarcodeReplacementListC` | RG-025 |  |
| m04-33 | 新規実装 | 要実機確認 | Excel沈黙域の実装補完（要実機確認） | `RestockListCsvRowFormatter.php:146` |  |  |
| m05-02 | カスタマイズ | 要実機確認 | 要確認（カスタマイズ達成の付与経路が dtb_csv シード/イベント/エンティティアクセサのいずれかに依存・実機/DBフィクスチャで確定） | `OrderController.php:430, OrderController.php:453` | RG-002,010,011 |  |
| m05-05 | カスタマイズ | 要実機確認 | 設定依存/要実機確認 | `CsvExportService.php:494` | RG-017 |  |
| m05-06 | カスタマイズ | 要実機確認 | 要実機確認（設計沈黙・送信元運用の妥当性） | `MailController.php:308` | RG-017,021 |  |
| m06-02 | カスタマイズ | 要実機確認 | 差異（記述差・Excel優先ルール下の未表明の一次/二次オラクル競合）／最終セグメント直前の空白有無は要実機確認 | `src/Eccube/Repository/DtbOtcBuyOrderRepository.php:340` | RG-010,011 |  |
| m06-09 | 現行踏襲 | 要実機確認 | 注記（データ系譜・本機能は合算のみ）／要実機確認 | `DtbOtcBuyOrderSummaryRepository.php:43` | RG-006 |  |
| m06-11 | 新規実装 | 要実機確認 | 実装事実（要実機確認の裏取り） | `OtcBuyOrderRestockListService.php:101` |  |  |
| m06-11 | 新規実装 | 要実機確認 | 実装事実（要実機確認の裏取り） | `OtcBuyOrderController.php:642, OtcBuyOrderRestockListService.php:96` |  |  |
| m06-11 | 新規実装 | 要実機確認 | 実装事実（要実機確認の裏取り） | `OtcBuyOrderController.php:627` |  |  |
| m06-11 | 新規実装 | 要実機確認 | 実装事実（要実機確認の裏取り） | `RestockListPdfSectionBuilder.php:31` |  |  |
| m07-02 | カスタマイズ | 要実機確認 | 要実機確認（フィールド対応の妥当性） | `BuyOrderCsvExportService.php:150` | RG-014 |  |
| m07-03 | カスタマイズ | 要実機確認 | 実装事実の記録（要実機確認の付番） | `src/Eccube/Entity/Master/MtbBuyOrderStatus.php:29` | 全状態遷移RG |  |
| m07-08 | 新規実装 | 要実機確認 | 設計沈黙・実装のみ判定条件（要実機確認で妥当性検証） | `src/Eccube/Service/Admin/Purchase/BuyOrderRestockListService.php:30` | RG-015 |  |
| m07-08 | 新規実装 | 要実機確認 | 設計沈黙・実装のみ（原文表示の妥当性は要実機確認） | `src/Eccube/Service/Csv/Exporter/RestockListCsvRowFormatter.php:84` | RG-014 |  |
| m07-08 | 新規実装 | 要実機確認 | 設計沈黙・実装事実の記録（要実機確認） | `src/Eccube/Controller/Admin/Purchase/PurchaseController.php:637, BuyOrderRestockListCsvExportService.php:79, PurchaseCon` | RG-017,018 |  |
| m07-08 | 新規実装 | 要実機確認 | 設計沈黙・実装事実の記録（要実機確認） | `src/Eccube/Repository/DtbBuyOrderRepository.php:844` | RG-019 |  |
| m08-08 | カスタマイズ | 要実機確認 | 要実機確認（詳細設計が自ら要確認とする箇所・移行先で作成者が記録される可能性） | `pf-eccube3/app/Plugin/HareruyaEc/Service/MailService.php:1799, ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/C` | RG-026 |  |
| m08-08 | カスタマイズ | 要実機確認 | 設計間不整合（詳細設計L342の件名欄非表示がExcel L3686・実装と矛盾／本文欄の表示有無はExcelが沈黙で詳細設計補完＝テンプレ選択時のみ表示）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Customer/manual_mail.twig:46` | RG-002,011 |  |
| m08-13 | 現行踏襲 | 要実機確認 | 要実機確認（正本沈黙のため断定しない） | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/BlacklistUpdateType.php:85, ec-cube-enterprise/src/Eccube/Service/Admin/Cu` |  |  |
| m08-13 | 現行踏襲 | 要実機確認 | 要実機確認（RG-034・正本が両立しないため断定しない） | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/BlacklistController.php:45, ec-cube-enterprise/src/Eccube/Controller/A` |  |  |
| m08-13 | 現行踏襲 | 要実機確認 | 要実機確認（正本沈黙・RG-001） | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/BlacklistController.php:25, ec-cube-enterprise/src/Eccube/Controller/A` |  |  |
| m08-13 | 現行踏襲 | 要実機確認 | 要実機確認（RG-023,024・Excelの字義解釈が要確定） | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Block/js/blacklist_js.twig:7, pf-eccube3/app/Plugin/HareruyaEc/` |  |  |
| m09-10 | カスタマイズ | 要実機確認 | オラクル内競合（Excel 0210:L2843 vs 詳細設計 L336）／期待は断定せず要実機確認（設計側の確認要） | `ec-cube/app/Customize/Controller/Admin/Integration/TopPageController.php:70, ec-cube-enterprise/src/Eccube/Controller/Ad` | RG-013 |  |
| m09-10 | カスタマイズ | 要実機確認 | オラクル内競合（採番不整合）／要実機確認（設計側の確認要） | `—` | RG-027 |  |
| m10-03 | 現行踏襲 | 要実機確認 | 仕様欠落（設計が条件式をオラクル化せず期待を断定できない）／要実機確認 | `pf-eccube3/src/Eccube/Resource/template/admin/Setting/Shop/customer_agreement.twig:49` | RG-010 |  |
| m10-03 | 現行踏襲 | 要実機確認 | 差異（Excel書式・制限に対応する検証が無く、範囲外文字の可否が未規定）／要判定・要実機確認 | `pf-eccube3/src/Eccube/Form/Type/Admin/CustomerAgreementType.php:45` | RG-018(DV-02,DV-03) |  |
| m11-06 | 標準 | 要実機確認 | 設計書の誤り（定型ブロック混入・参照専用と矛盾）／要設計修正・要実機確認 | `ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/SystemController.php:36, ec-cube-enterprise/src/Eccube/Ser` | RG-042 |  |
| m12-01 | カスタマイズ | 要実機確認 | 想定内（リニューアル前の現行状態）／移行先で要検証。詳細設計HTMLが現行を記述している根拠でもあり、詳細設計の当該記述を期待に採らない判断の裏付け | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Analysis/SummaryType.php:57, pf-eccube3/app/Plugin/HareruyaEc/Controlle` | §5 旧指標の非生成 |  |
| m12-05 | カスタマイズ | 要実機確認 | 仕様確認要（Excel列挙とマスタ由来の衝突・Excel記述の内部不整合）／要実機確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/Analysis/SearchProductRequestType.php:103` | RG-019（DV-13） |  |
| m12-05 | カスタマイズ | 要実機確認 | 仕様未確定（設計側で確定させるべき論点・実装解釈を期待に採用しない）／要仕様確定＋要実機確認 | `ec-cube-enterprise/src/Eccube/Repository/DtbProductRequestRepository.php:326` | RG-026 |  |
| m12-08 | カスタマイズ | 要実機確認 | 要実機確認（設計沈黙・出現条件の明文化が必要） | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Analysis/format_sales.twig:47` | RG-020 |  |
| m13-08 | カスタマイズ | 要実機確認 | length }}`）。移行先は40枚分割を行わず1デッキ=1ページとし、`pageNo`/`totalPages` をデッキ通番/総デッキ数へ意味変更している（`ec-cube-enterprise/.../EntryDeckListDisplayBuild | `pf-eccube3/.../EntryController.php:784, pf-eccube3/.../decklist.twig:19` | **乖離（移行先=現行踏襲違反・40枚分割の欠落 |  |
| m13-11 | 現行踏襲 | 要実機確認 | 設計内矛盾（汎用テンプレ節の混入・設計是正が必要）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/EntryController.php:176, ec-cube-enterprise/src/Eccube/Controller/Admi` | RG-033 |  |
| m14-02 | カスタマイズ | 要実機確認 | バグ（現行・列数不足＋未定義変数参照）／要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Service/Csv/CardCsv.php:292, CardCsvController.php:136, ec-cube-enterprise/.../CardCsv.` | RG-012 |  |
| m14-02 | カスタマイズ | 要実機確認 | バグ（現行・empty()判定順序による未選択ガードの無効化）。Excel自身が L1522 で即時エラー表示を規定しつつ L1524 で当挙動の踏襲を記す＝設計が両義的／要実機確認 | `pf-eccube3/.../Service/Csv/CardCsv.php:176, Controller/Admin/CardCsvController.php:110, CardCsv.php:137, ec-cube-enterpr` | RG-030,031,036 |  |
| m14-02 | カスタマイズ | 要実機確認 | バグ（現行・誤文言＋到達不能分岐）／要実機確認 | `pf-eccube3/.../CardCsvController.php:112, pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:1134` | RG-035,036 |  |
| m14-04 | カスタマイズ | 要実機確認 | Excel記載の疑義（画面項目表の誤記の可能性）／要実機確認・要設計確認 | `ec-cube-enterprise/src/Eccube/Form/Type/Admin/CardType.php:141, pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/Card/Ca` | RG-018 |  |
| m14-06 | 現行踏襲 | 要実機確認 | 文書不整合（詳細設計HTMLがExcel★カスタマイズ未反映）／実装は移行先で適合済み・要実機確認 | `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/admin/Cardset/card_set.twig:93, ec-cube-enterprise/app/template/admin` | RG-012 |  |
| m15-07 | 現行踏襲 | 要実機確認 | 正本内不整合（下限句 vs 範囲結論）＋設計文と実装の不一致／要実機確認・設計文の是正が必要 | `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Admin/DeckTag/DeckTagType.php:63` | RG-029(DV-13) |  |

## 参考: 一致(非バグ) 241件

実装が設計を満たすことを確認済み（裁定不要・網羅性の証跡）。

---
※ 336機能の_poc2から機械抽出。承認済み4機能(_poc_)の乖離は各ファイル参照。file:lineは `../pf-eccube3`(現行)/`../ec-cube-enterprise`(移行先)。
# B1候補: a01-01 スマレジ連携処理（API/在庫管理・Webhook受信＋在庫同期） — 実行可能グレード候補（母集合32全量踏破）

> 2026-07-26 ／ **候補グレード（candidate・D6前・O5未確定・実装/実走なし）**
> 区分=**新規実装**（現行pfに対応実装なし）。source_class routing=**ee-native API/バッチ（標準系）**。
> オラクル（期待値の正）=**基本設計仕様書（Excel・0501 API在庫管理）＋設計md `functions/ec-cube-enterprise/a01-01_api_stock_smaregi_stock_sync.md`＋観点表**。
> 本機能は**新規実装**につき、標準系routingに従い**ee実ソースをL1根拠に使用してよい**（file:lineで裏取り）。ただし
> 実装の不具合／実装既定値をそのまま期待値化せず、仕様（Excel/設計md）との乖離は**不具合候補（BC-DRAFT・§9）へ別掲**し
> オラクル独立性を維持する。SUT/オラクル不変・母集合期待（テストケース）は改変しない。
> **画面を伴わない機能＝両レイヤ網羅（§3）**: (a)API/統合レイヤ（Playwright `request`でWebhook `POST` 送信→HTTPステータス・
> 受信履歴DB・非同期ジョブ・冪等性を観測／バッチ=`eccube:smaregi:stock:backfill`起動観測）、(b)UIレイヤ（管理画面
> メッセンジャーダッシュボード=Webhook受信一覧/詳細・ジョブ一覧/詳細、在庫検索一覧の在庫数・在庫変動履歴）に分類。
> スマレジ実POSの実連携・実API実応答・実webhook到達は要実機/手動（理由付き・§4.3）。
> fixture_version 全て `@TBD-D5`。外部副作用の隔離ハーネス（Messenger in-memory＋worker非起動／SmaregiStockApiClient・
> AccessTokenServiceのテストダブル）は**現状ee側未整備＝`@TBD(ハーネス)`**（§2・f04-04と同水準）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。出力隔離: 本md＝`_drafts/`。
>
> **母集合32の会計（差分0）**: bound成功 **18**（直接6＋読替12）＋partial **8**＋要実機 **2**＋excluded **4**。
> 18+8+2+4=32・差分0（§8でpython検算済・欠番0/重複0/001..032全被覆）。**未解決D5あり**
> （本文exact値・認証方式IP制限vs secretヘッダ・在庫金額算式・スキーマCREATE所在＝§9 BC-DRAFT。codex R1是正で明示化）。
> **bound(EEドリフト)**: codex R2でドリフト候補を特定＝(i)エンドポイント `/smaregi/stocks`(Excel)vs `smaregi/webhook`(EE実装)＝BC-DRAFT③を**ドリフト確定候補へ格上げ**（旧「ドリフト0」を撤回）／
> (ii)在庫増減の符号: applierは`amount`を`bcadd`で無条件加算し**区分02/12で符号反転しない**（`ProductStock.php:328-333`）＝「区分02で減算」はスマレジ応答の符号契約依存＝@TBD-D5（BC-DRAFT⑨）／
> (iii)在庫負値防止なし: `getStockQuantityAfterChange`に下限検査なし＝悲観ロックは直列化のみで負値/オーバーコミットを防がない（残1に-2で-1可能）＝-031負値防止は**未保証ドリフト**（BC-DRAFT⑩）。
> **codex R2追加是正**: -003/-023/-014/-009/-011/-012/-013の実装既定値(未知項目許容・ids空・増減符号・金額算式)は仕様未確定としfirm期待値化しない旨を各所へ明記。S0対象に`dtb_smaregi_platform_api_call_log`追加。C-P7失敗捕捉は子handler。
> **⚠codex R1/R2いずれも「妥当（候補確定）」明言に至らず（未解決Blocker残・§9末尾に逐語記録）。本候補は_drafts据置・確定はコーディネータ裁定**。
> **codex R1是正反映**: (a)スマレジ**アクセストークン外部キャッシュ**実在（`SmaregiAccessTokenService.php:62-68,154-156`）＝-018/-019をexcludedからpartialへ／
> (b)`dtb_messenger_job`親行は**handler内生成**（`SmaregiWebhookEventMessageHandler.php:59-79`）でありControllerのdispatch(:102)だけでは作られない＝
> **ジョブ投入もハーネス前提**（ハーネス非依存boundはHTTP応答＋受信履歴＋重複判定のみ）／(c)-007タイムアウトはHTTPクライアントダブルで例外化しjob FAILEDを隔離観測可＝partialへ／
> (d)S0実表名 `dtb_product_stock`/`dtb_stock_history`（`ProductStock.php:25`/`DtbStockHistory.php:25`）・`parent_job_id`はFKなし論理親子／
> (e)applier実パス `src/Eccube/Service/Smaregi/Webhook/Stock/SmaregiStockChangeApplier.php`／(f)-023は空bodyでなく `{...,"ids":[]}` 有効JSONに限定（空body=null→setRequestBody(array)でTypeError→500）。

---

## §0 版固定・判定原則・外部依存の切り分け

- **設計オラクル（正）**:
  - 基本設計Excel抽出（設計md内 `<details>` 原典・md:96-217）: エンドポイント=`/smaregi/stocks`（記載）・メソッド`POST`・
    認証`有`・認証方式`IP制限`・リクエスト書式`JSON`・レスポンス書式`なし(ステータスコードのみ)`（md:120-123）。在庫連携3方式
    （Webhook/API個別/Patch一括・md:133-153）。Webhook受信データ（契約ID・イベント名・アクション・在庫変動履歴IDリスト・
    md:194-217）。在庫区分`02:売上`→出庫(減算)/`12:返品`→入庫(加算)、それ以外無視・店頭受取分無視（md:189-191）。
  - 設計md本文: 目的=スマレジWebhookを受け、取引・在庫の連携を**非同期**で実行（md:29）。永続化先=`dtb_smaregi_webhook_request`
    （md:31,35・列= id/contract_id/smaregi_event_id/event/action/request_headers/request_body/received_at/started_at/
    completed_at/status/create_date/update_date）。実装確認値=`POST /%eccube_smaregi_webhook_route%`（既定 `smaregi/webhook`）・
    WebhookController/Smaregi Webhook Transaction handlers（md:71）。
- **観点表**: `integration_test/integration-test-viewpoints.md`（IT-08/09/10/32/33等）。
- **ee実ソース（新規実装＝標準系routingでL1根拠に使用可。file:lineで裏取り）**: `/home/y-saito/Developments/ec-cube-enterprise`。
  - Controller: `src/Eccube/Controller/Smaregi/WebhookController.php`（`#[Route('', name: 'smaregi_webhook', methods: ['POST'])]`=**:41**）。
    プレフィックス=`app/config/eccube/routes.yaml:12`（`/%eccube_smaregi_webhook_route%`）＋`app/config/eccube/packages/eccube.yaml:7,73`
    （既定 `smaregi/webhook`）。処理: 受信ログ(:44)→認証(:52)→smaregi-event-idヘッダ(:67)→重複判定(:80)→
    受信履歴persist/flush(:92-94)→`SmaregiWebhookEventMessage`dispatch(:102)→200(:107)。分岐レスポンス=
    401 `Authentication failed`(:61-64)・400 `Smaregi-Event-Id header is required`(:74-77)・200 `Event is duplicate`(:85-88)・
    200 `{status:ok}`(:107-109)・500 `Error processing webhook`(:117-120)。
  - 認証: `src/Eccube/Service/Smaregi/Webhook/AuthenticationService.php:33-46`（**secretヘッダ`hash_equals`**）。※Excel記載`IP制限`と実装が相違＝§9 BC-DRAFT①。
  - 受信履歴生成: `src/Eccube/Service/Smaregi/Webhook/EventService.php:29-48`（body json_decode→contractId/event/action/headers/body/
    receivedAt/status=PENDING）・重複判定 `:52-55`（`findBySmaregiEventId`）。
  - Entity: `src/Eccube/Entity/SmaregiWebhookEvent.php`（`#[ORM\Table(name:'dtb_smaregi_webhook_request')]`=**:22**・
    `smaregi_event_id` **unique:true**=**:40**・STATUS_PENDING/PROCESSING/COMPLETED/FAILED=**:27-30**・messenger_job_id=:78）。
    ※テーブルCREATEは migrations に無く（`Version20260312151141.php`/`20260317120648.php`はGRANTのみ）ORM定義がスキーマ権威＝§9 BC-DRAFT⑤。
  - Repository: `SmaregiWebhookEventRepository.php:66-73`（findBySmaregiEventId）・`:37-55`（getCountsByStatus）・`:60-64`（一覧QB）。
  - 非同期親: `src/Eccube/MessageHandler/SmaregiWebhookEventMessageHandler.php`（status PROCESSING(:54)→親`dtb_messenger_job`
    作成(:59-75)→transaction/stock dispatcher(:97-98)→COMPLETED(:104)/FAILED(:117)）。
  - 在庫子: `StockEventDispatcher.php`（EVENT_NAME `pos:stock`=:34・ACTION `edited`=:36・ids[]毎に子ジョブ:81-90）→
    `SmaregiStockProcessDispatcher.php:42-100`（子`dtb_messenger_job` PENDING投入）→`SmaregiStockProcessMessageHandler.php`
    （:72 悲観ロック取得、:76 `fetchStockChange`＝**スマレジAPI GET**、:79-94 tx内reflect+rollback、:137-138 2xx以外→例外→FAILED）→
    `src/Eccube/Service/Smaregi/Webhook/Stock/SmaregiStockChangeApplier.php`（**実パス。旧記載`SmaregiStockChangeApplier.php`直下はcodex R1で訂正**。
    区分`02`=DIVISION_SALES:45・`12`=DIVISION_RETURN:48・区分外無視・:102-119 区分2 ProductStock解決/OTC無視・
    :122 PESSIMISTIC_WRITE・:129-135 同一stockChangeId二重反映防止・:141-142 `getStockQuantityAfterChange`/`getTotalCostAfterChange($amount)`・
    :154-172 在庫変動履歴save〔:165 reason `resolveStockChangeReason`・:167-168 HistorySourceType=SMAREGI_SYNC/historySourceId=stockChangeId=連携元ID〕）。
    **在庫数・原価は`amount`と既存総原価から算出。`sellPrice`は履歴の売価(record['price'])で、金額算式(評価額/金額合計＝実数小計)の一致はExcel/mdに算式規定が無く@TBD-D5（BC-DRAFT⑦）**。
  - 再連携バッチ: `src/Eccube/Command/SmaregiStockBackfillCommand.php:32`（`#[AsCommand(name: 'eccube:smaregi:stock:backfill', …)]`）。
  - 管理UI（メッセンジャーダッシュボード）: `src/Eccube/Controller/Admin/Messenger/DashboardController.php`
    （`admin_messenger`=:52 GET `/%eccube_admin_route%/%eccube_messenger_route%/`・webhookCounts:56／`admin_messenger_webhooks`=:107
    webhook_list.twig／`admin_messenger_webhook_detail`=:144 webhook_detail.twig・secretヘッダmask:181,205／`admin_messenger_jobs`=:70／
    `admin_messenger_job_detail`=:224＋platform API call log:233）。プレフィックス既定=`admin`/`messenger`（eccube.yaml:3,4）。
  - Messenger transport: `app/config/eccube/packages/messenger.yaml`（`SmaregiWebhookEventMessage`=async :16・`SmaregiStockProcessMessage`=async :20。
    `when@test` in-memory は **コメントのみ**（:41-47）＝**未整備**＝§2 `@TBD(ハーネス)`）。
  - ロケール: Webhookルートは locale 補正の対象外（`src/Eccube/Request/Context.php:109`／`InvalidLocaleRedirectListener.php:50`）＝
    本機能にロケール依存表示は無い（LS=0）。
  - 既存テスト（観測パターン源・L1出典にしない）: `tests/Eccube/Tests/Web/Smaregi/WebhookControllerTest.php`（401/400/duplicate200/success200/500の
    assertResponseStatusCodeSame＋JSON body・dispatch検証）。
- **母集合**: 本§対象スライス32行（`…_mother_slice.tsv`。IT-A01-01-…-001〜-032）。
- **判定原則**: 母集合の観点ラベル・前提列・操作手順列は**生成器ノイズ**。bindは各行の**「期待結果／レスポンス」実テキスト**で判定し、
  極性も期待テキストで確認する（§8に全32行併記）。「HTTPステータスとレスポンス本文が〜処理結果と一致すること」型は
  Webhook HTTP契約（ステータス）で bind、レスポンス本文exact文字列は §0 の`ステータスコードのみ`（Excel）とEE実装（JSON body）が
  相違するため**本文exact値は`@TBD-D5`**（BC-DRAFT②）とし、HTTPステータスを firm オラクルとする。
  **⚠codex R2留保**: Excelが確定するのは「認証有／リクエストJSON／レスポンスはステータスのみ」までであり、具体的な**数値コード(400/200/500)・
  ヘッダ名`smaregi-event-id`・status値`pending`・3秒以内**はExcel確定値でなく**EE照合値（実装確認値）**。新規実装routingにより裏取りには用いるが、
  これら具体値の仕様適合はD5で確定するものとし、firm主張は「認証必須→未認証拒否／必須キー欠落→登録対象を確定しない／正常→成功応答＋非同期投入／
  受信処理例外→エラー応答で部分確定を残さない」という**質的HTTP契約**に置く（数値・ヘッダ名exactはEE照合値・BC-DRAFT②⑧）。
- **外部依存の切り分け（本機能の中核）**:
  - **要実機＝真の外部送達/実応答のみ**: ①スマレジプラットフォームAPIの**実応答**（在庫変動履歴詳細の実GET＝`getStockChange`）、
    ②スマレジ**実POS**の実連携・実webhook到達・実取引整合、③外部**タイムアウト**の実発生、④外部決済/取引の実補償（取消・返金）。
  - **bound＝自社DB/HTTP/管理画面で観測可能**: Webhook受信のHTTPステータス（401/400/200/500）・受信履歴
    （`dtb_smaregi_webhook_request`）作成/列値・冪等（unique/duplicate→200・二重作成なし）・非同期ジョブ（`dtb_messenger_job`）
    投入/ステータス・在庫更新（`ProductStock` 区分2）・在庫変動履歴・悲観ロックによる直列化・トランザクションロールバック・
    再連携バッチ起動。**破壊的だが**隔離テストDB＋seed＋S0復元＋DBアサーションで観測でき**要実機でない**。
    **スマレジAPI応答は`SmaregiStockApiClient`のテストダブル（@TBD ハーネス）で canned 応答を与えれば applier のロジック
    （区分別増減・履歴・非対象不変）は決定的にDB観測可能**（f04-04のUniSearch/Messenger遮断土台と同型）。
  - **partial＝1行の期待テキストが自社DB観測部分（bound枝）と外部実応答部分（要実機枝）を混在**（例: -015 外部取得・-010 連携先整合・
    -028 転送先成否・-031 実POS同時・-032 外部補償）。bound枝と要実機枝を明記し会計を分ける（§4.2）。

---

## §1 L1原子オラクル表（出典=基本設計Excel＋設計md＋観点表。新規実装につきee実ソースをfile:lineで裏取り）

全20 claim。LS（locale_sensitive）=**0件**（Webhookルートはロケール補正対象外・Context.php:109）。「外部依存」列＝当該claimの
観測可能な最終値が**真の外部送達/実応答**を要するか（自社DBで観測できる破壊系は「否＝隔離DBで観測可」）。

| oracle_id | 観点 | claim（オラクル） | 根拠 | 外部依存 |
|---|---|---|---|---|
| L1-A0101-001 | route/entry | スマレジWebhook受信は `POST /%eccube_smaregi_webhook_route%`（既定 `smaregi/webhook`）・認証有・リクエスト書式JSON | Excel md:120-123／md:71（ee照合: WebhookController.php:41・eccube.yaml:7,73） | 否 |
| L1-A0101-002 | auth | 認証を通過しないリクエストは受理せずエラーとする（認証`有`） | Excel md:123・md:49（ee照合: AuthenticationService.php:33-46 secretヘッダhash_equals→401 Controller:52-64） | 否（認証判定は自系）／方式は§9 BC-DRAFT① |
| L1-A0101-003 | required_header | スマレジイベントID（冪等キー）が無い受信は不正として処理し、登録・更新対象を確定しない | md:83（ee照合: Controller.php:67-78→400 `Smaregi-Event-Id header is required`） | 否 |
| L1-A0101-004 | idempotency | 同一スマレジイベントIDの重複到達は重複として扱い、受信履歴を二重作成しない（冪等キー=`smaregi_event_id`） | 観点表IT-08/29・md可観測性（ee照合: Entity:40 unique・EventService:52-55 isDuplicate・Controller:80-89→200 `Event is duplicate`） | 否 |
| L1-A0101-005 | receive_record | 受信Webhookを受信履歴 `dtb_smaregi_webhook_request` へ記録する（`smaregi_event_id, event, action, request_headers, request_body, status`） | md:31,35,79・観点-027,-030（ee照合: Entity:22,40-71・EventService:38-48） | 否 |
| L1-A0101-006 | async_dispatch | 受信後、非同期処理へ投入し（`SmaregiWebhookEventMessage`）短時間で成功レスポンス（200）を返す | Excel md:176・md:29,50（ee照合: Controller.php:102-109 dispatch+200） | 否（dispatch/HTTP応答は自系。ジョブ実処理は§4.3） |
| L1-A0101-007 | status_lifecycle | 受信履歴のステータスは pending→processing→completed/failed と遷移する | md:79 status列（ee照合: Entity:27-30・WebhookEventMessageHandler:54,104,117） | 否（自社DBで観測。processing→completedはジョブ完走が前提＝§4.2） |
| L1-A0101-008 | stock_division | 在庫変動区分 `02:売上`／`12:返品`のみ在庫反映、それ以外（修正/ロス/棚卸等）は無視 | Excel md:189-190（ee照合: StockChangeApplier:75-85 区分外無視・247-248 理由文言） | 否（区分別の反映有無はDB観測）。**⚠increase/decrease方向はEEが`amount`を符号反転せず加算するため@TBD-D5（BC-DRAFT⑨）** |
| L1-A0101-009 | stock_target | 対象は在庫場所区分=スマレジ（区分2）のProductStockに限定。店頭受取分/スマレジ商品ID未保持の通常商品は無視 | Excel md:191（ee照合: StockChangeApplier:36,102-109 STOCK_LOCATION_SMAREGI） | 否 |
| L1-A0101-010 | stock_history | 在庫更新時に連携元ID・変動理由付きの在庫変動履歴を作成し、スマレジ在庫変動履歴IDをECCUBE在庫変動履歴へ紐づける | Excel md:192-193（ee照合: StockChangeApplier:155-182,247-248） | 否 |
| L1-A0101-011 | division_integrity | 更新対象外のシステム・区分・状態の数量/金額は変動しない | 観点IT-33 -009（ee照合: applierは区分2のみ更新） | 否 |
| L1-A0101-012 | concurrency | 在庫行更新は悲観ロック下で直列化される（同一stockChangeId二重反映防止あり） | 観点IT-08 -031（ee照合: StockChangeApplier:121-135 PESSIMISTIC_WRITE+refresh+既適用スキップ） | 否（2ジョブ直列化は観測可）／実POS同時は§4.2要実機枝。**⚠負値/オーバーコミット防止は下限検査が無く未保証＝ドリフト候補（BC-DRAFT⑩）** |
| L1-A0101-013 | rollback | 数量更新失敗/検証エラー/外部連携エラー時は部分更新を残さずロールバックし、片側更新を残さない | md:64・観点IT-33 -010（ee照合: StockProcessMessageHandler:79-94 tx rollback・ジョブFAILED） | 否（自系ロールバック/ジョブFAILEDは観測可）／連携先実整合は§4.2要実機枝 |
| L1-A0101-014 | retry_backfill | 連携エラーは再連携バッチ `eccube:smaregi:stock:backfill` で未連携分を子ジョブへ再投入でき、再実行可否が仕様通り | Excel例外(md:86)・観点IT-08 -028,-032（ee照合: SmaregiStockBackfillCommand.php:32・SmaregiStockProcessDispatcher再利用） | 否（バッチ起動/子ジョブ投入は観測可） |
| L1-A0101-015 | external_fetch | 在庫変動履歴の詳細はスマレジプラットフォームAPIから取得し、2xx以外はジョブをFAILEDとする | Excel md:159-167 B/C（ee照合: StockProcessMessageHandler:118-142 getStockChange） | **要（スマレジAPI実応答）** |
| L1-A0101-016 | external_integrity | 外部（スマレジ）の処理結果と自システム状態/金額/履歴が同一取引として整合し、通信エラー/業務エラー/タイムアウト/外部成功後の自系更新失敗で二重課金・二重返金・状態不整合を起こさない | 観点IT-10 -024,-025（手動） | **要（実POS/実取引・実補償）** |
| L1-A0101-017 | response_contract | レスポンスは基本設計上ステータスコードのみ（本文書式は未定義） | Excel md:123 レスポンス書式=なし(ステータスコードのみ) | 否／本文exact値は`@TBD-D5`（EE実装はJSON body＝§9 BC-DRAFT②） |
| L1-A0101-018 | no_versioning | APIバージョニングは基本設計に定義が無い | Excel（versioning記載なし・grep0） | 否（referent不在＝-008 excluded） |
| L1-A0101-019 | token_cache | 在庫同期の子ジョブはスマレジAPI呼出のため**アクセストークン外部キャッシュ**（`smaregi_access_token_<contractId>`）を参照し、キャッシュ値が配列かつ`token`保持でなければ**成功扱いせず外部再取得**、取得失敗はジョブFAILED（**codex R1で「外部キャッシュ不在」主張を訂正**） | ee照合: SmaregiAccessTokenService.php:62-68（hit時のみ返却・不正値は素通り再取得）・:132-158（非200/解析不能→例外）・:154-156 保存 | **一部要（実トークンエンドポイント再取得）**／キャッシュ不正値素通り・FAILED遷移は隔離観測可＝-018/-019はpartial |
| L1-A0101-020 | no_aggregated_validation | レスポンスはステータスコードのみで、複数バリデーションエラーを集約返却するweb service契約を持たない（単一の失敗で早期に該当ステータスを返す） | Excel md:123（ee照合: Controller.php:52-78 単一失敗fail-fast） | 否（集約返却referent不在＝-004,-005,-006 excluded） |

---

## §2 SEED三段参照設計・破壊系S0・隔離ハーネス

三段参照: **期待の正=L1オラクルID（§1） → 前提状態=SEEDセットID → 観測=実値（HTTP／db.ts／管理画面）**。

| SEEDセットID | 目的 | 内容（要点） |
|---|---|---|
| SEED-WH-VALID | 認証通過・正常受信 | 正しいsecretヘッダ（`smaregi_webhook_secret`／`smaregi_webhook_secret_header`＝services.yaml:26-27,631-632）＋`smaregi-event-id`ヘッダ＋JSON body `{contractId,event,action,ids[]}`。受信履歴が新規作成される状態 |
| SEED-WH-DUP | 冪等（重複到達） | `dtb_smaregi_webhook_request` に同一 `smaregi_event_id` の行を事前投入し、同一IDで再送→重複として200・二重作成なしを検証 |
| SEED-WH-AUTHFAIL | 認証失敗 | secretヘッダ不一致/欠落で送信→401 |
| SEED-WH-NOHDR | 必須ヘッダ欠落 | `smaregi-event-id` ヘッダ無しで送信→400 |
| SEED-WH-ERR | 受信処理例外 | EventService/persistで例外を誘発（隔離ハーネスでEventServiceダブルが例外throw＝WebhookControllerTest:188-217方式）→500 |
| SEED-STOCK-SMAREGI | 在庫同期（区分2） | `ProductClass.smaregiProductId` を持つ商品＋在庫場所区分=スマレジの `ProductStock`（既知stock/unitCost/totalCost）＋`BaseInfo.smaregiShopId`＋在庫変動理由区分マスタ。`SmaregiStockApiClient` テストダブルが `{division:'02'|'12', amount:N}` の canned 応答を返す状態（@TBD ハーネス） |
| SEED-STOCK-NONTARGET | 非対象不変 | 区分2以外/スマレジ商品ID未保持の通常商品・店頭受取分を併存させ、それらの数量/金額が変動しないことを検証 |

### 破壊系S0スナップショット・復元設計（対象・順序・SQL骨子）

**S0対象テーブル（操作直前に raw psql=db.ts でスナップショット）**:
| 対象 | スナップショット項目 | 復元方法 |
|---|---|---|
| `dtb_smaregi_webhook_request` | 受信で作成された行（S0=当該 `smaregi_event_id` 行なし。SEED-WH-DUPは事前1行あり） | 作成分を `DELETE FROM dtb_smaregi_webhook_request WHERE smaregi_event_id = $1`（バインド）。SEED-WH-DUPの事前行は復元対象として別管理 |
| `dtb_messenger_job`（親＋子） | 作成された親/子ジョブ（S0=なし） | 子→親順に `DELETE`。親: `messenger_job_id` で受信履歴から辿るか、`payload_summary LIKE 'webhookEventId=%'` で特定。子: `parent_job_id = :parentId`。**削除順=子DELETE→親DELETE（安全策）。ただし `parent_job_id` はDB上FKなし論理親子**（`MessengerJob.php:64-69` FK未設定・codex R1で「FK子→親順」表現を訂正）。表存在チェック（`to_regclass`別クエリ→存在時バインドDELETE。`DO $$`は`:oid`バインド不可のため不採用＝f04-04 S0と同方式で確定） |
| `dtb_product_stock`（区分2）／`dtb_stock_history` | 対象ProductStockの `stock`・`unit_cost`・`total_cost`（S0値）／作成された在庫変動履歴行 | **実表名=`dtb_product_stock`/`dtb_stock_history`（`ProductStock.php:25`/`DtbStockHistory.php:25`・codex R1で `product_stock` 誤記を訂正）**。履歴を先に `DELETE FROM dtb_stock_history`（識別=`history_source_id=:stockChangeId AND history_source_type=SMAREGI_SYNC`・applier:167-168）→ `UPDATE dtb_product_stock SET stock=:s0, unit_cost=:c0, total_cost=:t0 WHERE id=:psid`。raw SQLで復元しSaveEventSubscriber等の再発火を避ける |
| `dtb_smaregi_platform_api_call_log` | 実`SmaregiStockApiClient`/`SmaregiAccessTokenService`使用時に記録されるAPI呼出ログ（S0=なし。**codex R2追加**: `SmaregiPlatformApiCallRecorder.php:54,63`で子ジョブ文脈から書込） | 子job ID/操作種別で `DELETE`（子ジョブ復元より先に削除）。**実クライアントを完全にダブル化しログを生成しない場合はその旨をハーネス契約に明記**（未生成なら本表は不要） |
| セッション/採番 | `dtb_smaregi_webhook_request_id_seq`（migration :36 GRANT対象） | シーケンスは前進し**復元しない**（f06-19のmem_id前進と同型・受信削除後も採番値は戻らないが業務影響なし＝安全境界） |

- **raw SQLで復元**（ORM/Doctrine非経由）。**db.tsの実配線のみ `@TBD-D5`**（対象・順序・SQL骨子は本§で特定済み）。
  冪等性担保: 各SEEDは使い捨て・独立・afterEach復元。

### 外部副作用の隔離ハーネス設計（f04-04 checkout系T2と共有の土台・`@TBD(ハーネス)`）

**問題（ee実測）**: `SmaregiWebhookEventMessage`/`SmaregiStockProcessMessage` は **async**（messenger.yaml:16,20）＝実env `MESSENGER_TRANSPORT_DSN`。
在庫子ジョブの実処理は **スマレジプラットフォームAPI実GET**（`getStockChange`）＋アクセストークン取得を伴う。
**したがって在庫同期の bound観測は、下記の共有隔離ハーネスを前提とする（現状ee側未整備＝`@TBD(ハーネス)`）**:

| 外部副作用 | 隔離設計（何を・どこに） | ee現状（実測） | 整備状態 |
|---|---|---|---|
| Messenger async（親/子ジョブ実処理） | E2E用servicesで async transport を `in-memory://` へ上書き＋worker（`messenger:consume`）非起動。受信の`dtb_messenger_job`投入までを観測、実処理は明示的に手動consume/ダブル経由 | `messenger.yaml:16,20`=async（実env DSN）。`when@test` in-memoryは**コメントのみ**（:41-47）＝**未整備** | **未整備（@TBD(ハーネス)）** |
| スマレジAPI実応答（在庫変動履歴詳細GET） | `SmaregiStockApiClient`・`SmaregiAccessTokenService` をテストダブルへ差替（canned `{division,amount}` 応答）。applierロジックをDB観測可能化 | 実DI（services.yaml）。E2E用差替は**未整備**（grep0） | **未整備（@TBD(ハーネス)）** |
| 起動時検査 | テスト起動時に外部host（スマレジAPI/IDサーバ）へ出ない構成をアサートし、未成立なら在庫同期boundを実行しない | 未実装 | **未整備（@TBD(ハーネス)）** |

- **本ハーネスはA01-01固有でなく全スマレジ/外部連携T2で共有する土台**（f04-04で確立したMailer/Messenger/UniSearch遮断と同系）。
- 結論の言い方（統一）: 在庫同期boundは**「（隔離ハーネス整備を前提に）bound観測可能。ハーネス未整備のため現時点で実走不可＝
  `@TBD(ハーネス)`」**。「今すぐ実行可能」等の現在形断定はしない。**ハーネス非依存で観測可能なのはWebhook受信の同期部分のみ＝
  HTTPステータス（401/400/200/500）・受信履歴DB（`dtb_smaregi_webhook_request`）・冪等（unique/duplicate→200）**。
  **`dtb_messenger_job`（親/子）の生成・status遷移・在庫反映はいずれもmessage handler内（`SmaregiWebhookEventMessageHandler.php:59-79`ほか）で起き、
  Controllerのdispatch(:102)だけでは作られない＝ジョブ投入もハーネス前提（codex R1で「ジョブ投入はハーネス非依存」主張を訂正）**。
  routingはasync（messenger.yaml:16,20）で、in-memory化しない限り単なるPOSTでは子ジョブ・親ジョブは生成されない。

---

## §3 両レイヤ分類（画面を伴わない機能＝(a)API/統合レイヤ＋(b)UIレイヤ を漏れなく分類）

| 候補 | (a) API/統合レイヤ観測 | (b) UIレイヤ観測 | 観測不能（DB/ログのみ・要実機） |
|---|---|---|---|
| C-AUTH（認証） | `POST` 受信→401/200のHTTPステータス（Playwright request） | 管理 `admin_messenger_webhook_detail`（secretヘッダmask表示・DashboardController:181,205） | — |
| C-HDR（必須ヘッダ） | 400 `Smaregi-Event-Id header is required` | —（受信履歴に残らない=UI非表示も観測点） | — |
| C-RECV（受信履歴） | 200 `{status:ok}`＋`dtb_smaregi_webhook_request` 行/列 DBアサーション | `admin_messenger_webhooks`一覧/`_webhook_detail`（event/action/status/body表示）・`admin_messenger`ダッシュボードのwebhookCounts | — |
| C-DUP/C-IDEM（冪等） | 重複→200 `Event is duplicate`・二重作成なし（DB件数） | webhook一覧に重複行が増えないこと | — |
| C-ERR（異常応答） | 500 `Error processing webhook`・401・400 | —（500は受信履歴未作成） | — |
| C-STATUS（正常HTTP契約） | 200＋ステータスコード（本文exact=@TBD-D5） | ダッシュボードのpending件数増 | — |
| C-STOCK（在庫増減） | 子`dtb_messenger_job`投入（**ハーネス前提**）・（ダブル経由consume後）`dtb_product_stock.stock`差分 DBアサーション | 在庫検索一覧の在庫数反映（管理: `src/Eccube/Controller/Admin/Stock/StockListController.php`＝在庫一覧の実在Controller。route/twigの具体表示キーは@TBD-D5で要確認） | スマレジ**実POS/実API**の実在庫整合＝要実機 |
| C-STOCK-HIST（履歴） | `dtb_stock_history`行（理由・連携元ID `history_source_id`）DBアサーション | 管理画面での在庫変動履歴表示（**専用Controllerを本調査でfile:line特定できず＝UI表示経路は@TBD-D5で要確認。DBアサーションを主観測点とし、UI表示網羅は未立証部分を撤回**・codex R1） | — |
| C-JOB（非同期ジョブ/ステータス遷移） | `dtb_messenger_job` 親/子 status・`dtb_smaregi_webhook_request.status`遷移 DBアサーション | `admin_messenger_jobs`一覧/`_job_detail`（status・platform API call log） | 実処理完走はハーネス/実API前提 |
| C-BACKFILL（再連携バッチ） | `eccube:smaregi:stock:backfill` 起動（コンソール）→未連携分の子ジョブ投入 DBアサーション | `admin_messenger_jobs` に再投入ジョブ出現 | 実API再取得は要実機 |
| partial外部枝（C-P1〜C-P5） | webhook 200／ジョブFAILED は観測可 | ジョブ詳細のエラーメッセージ | 外部実応答（実GET/実POS/実補償/実タイムアウト）＝要実機 |

---

## §4 実行可能グレード候補（自己完結＝全候補ケースを実体掲載）

記法: 期待結果セルは `…実値… [L1:<oracle_id>]`。ee参照は「（ee照合: file:line）」＝**新規実装につき裏取り**（実装既定値/不具合は期待値化しない）。

### §4.1 母集合対応・bound成功（現EEで隔離DB＋seed＋S0復元＋HTTP/DBアサーションで観測可能。直接6＋読替12＝18母集合行）

| C-ID | 対象観点 | 前提/手順 | 期待結果（三段参照） | レイヤ | 対応母集合 |
|---|---|---|---|---|---|
| C-AUTH | 認証（資格情報） | SEED-WH-AUTHFAIL（不正secret）／SEED-WH-VALID（正secret）で `POST` | **firmオラクル=「認証必須（有）→未認証は受理せずエラー・認証通過時のみ後続受信へ進む」`[L1:A0101-002]`（Excel/md：認証`有`）**。認証**方式**はExcel=IP制限／EE実装=secretヘッダ`hash_equals`で相違（§9①）＝**方式exactは@TBD-D5でfirm期待値化しない**。現EEで観測できる具体的401判定はsecretヘッダ経路（AuthenticationService.php:33-46・Controller:52-64）だが、これは**EEドリフト観測**であり仕様オラクルはあくまで「認証有→未認証拒否」。本文exact=@TBD-D5 | (a)＋(b) | -001（資格情報・直接）／-026（受信検証・読替 注1） |
| C-HDR | 必須ヘッダ（必須条件） | SEED-WH-NOHDR（`smaregi-event-id`欠落）で `POST` | 冪等キー（イベントID）欠落は不正として処理し登録対象を確定しない（HTTP 400）`[L1:A0101-003]`（ee照合: Controller.php:67-78） | (a) | -021（必須条件・直接） |
| C-RECV | 受信履歴の記録 | SEED-WH-VALID で `POST`→受信履歴DBアサーション | 200＋`dtb_smaregi_webhook_request` に `smaregi_event_id/event/action/request_headers/request_body/status(pending)` を記録 `[L1:A0101-005]`（ee照合: Entity:22,40-71・EventService:38-48） | (a)＋(b) | -027（DB列直接：`smaregi_event_id,event,action,request_headers,request_body,status`）／-030（副作用=受信履歴の記録・直接）／-003（想定外項目を加えても受理し記録・読替 注2）／-023（データなし=**有効JSONだがids空**でも受理・読替 注3） |
| C-IDEM | 冪等（重複・順序/可観測性） | **duplicate側**: SEED-WH-DUP（同一`smaregi_event_id`事前行）で同一ID再送／**非重複側（-017）**: SEED-WH-VALID（未使用の新規ID）で `POST` | 重複到達は200 `Event is duplicate`＋受信履歴を二重作成しない（冪等キー=`smaregi_event_id` unique）`[L1:A0101-004]`。非重複の新規IDは200 `{status:ok}`＋受信履歴新規1件作成（-017担保・注4）（ee照合: Entity:40 unique・EventService:52-55・Controller:80-89,102-109） | (a)＋(b) | -029（可観測性冪等キー・直接）／-017（正常のレスポンス確認＝非重複ID受理・読替 注4） |
| C-ERR | 異常応答 | SEED-WH-ERR（受信処理で例外）で `POST` | 受信処理中の例外は500 `Error processing webhook`（本文exact=@TBD-D5）、部分的な受信確定を残さない `[L1:A0101-013,017]`（ee照合: Controller.php:110-120） | (a) | -020（異常系のレスポンス確認・読替 注5） |
| C-STATUS | 正常HTTP契約 | SEED-WH-VALID で `POST` | 正常受信で成功ステータス（200）＋短時間応答、非同期投入する `[L1:A0101-006,017]`（ee照合: Controller.php:102-109）。本文exact=@TBD-D5 | (a) | -002（HTTPステータス・読替 注6）／-016（通信・読替 注6）／-022（レスポンス・読替 注6） |
| C-STOCK | 在庫増減（区分別） | SEED-STOCK-SMAREGI＋SmaregiStockApiClientダブル（canned `{stockDivision, amount}`。**符号検出のため`02:+N`と`02:-N`双方投入**）→受信→（ハーネスでconsume）→`dtb_product_stock.stock`差分 | firmオラクル=**区分02/12のみ反映・区分外無視・非対象区分/通常商品/OTCは不変**（applier: `Webhook/Stock/SmaregiStockChangeApplier.php:75-85,102-119`）。**⚠codex R2: 増減の向き（02で減算/12で加算）はapplierが`amount`を`bcadd`で無条件加算し区分で符号反転しないため（`ProductStock.php:328-333`）、スマレジ応答の`amount`符号契約に依存＝方向assertionは@TBD-D5（BC-DRAFT⑨）。金額算式も@TBD-D5（注7）** | (a)＋(b) | -014（売上・返品／方向は@TBD-D5）／-009（区分整合＝非対象不変・読替 注7）／-011（外部取引の売上/返品計算／方向@TBD・読替 注7）／-013（実数更新＝履歴反映まで・金額一致@TBD-D5・読替 注7） |
| C-STOCK-HIST | 在庫変動履歴 | 同上→`dtb_stock_history`DBアサーション | 在庫更新時に連携元ID（`history_source_id=stockChangeId`）・`history_source_type=SMAREGI_SYNC`・変動理由付きの在庫変動履歴を作成 `[L1:A0101-010]`（ee照合: 実パス `Webhook/Stock/SmaregiStockChangeApplier.php:154-172`〔:165 reason・:167-168 sourceType/sourceId〕）。理由文言exact（「スマレジ連携…」）は `resolveStockChangeReason` 由来で本文exact=@TBD-D5 | (a)＋(b) | -012（自動加算＝連携元ID付き履歴・読替 注7） |

**注1（読替・C-AUTH）**: -026「受信検証のレスポンス確認＝HTTPステータスと本文が受信検証の処理結果と一致」は、受信の入口検証
（認証＋ヘッダ＋受理）へ写像。認証枝をC-AUTH、ヘッダ枝をC-HDR、受理枝をC-RECVで担保。
**注2（読替・C-RECV）**: -003「想定外項目を加えて実行した結果が期待通り」は、EventServiceが未知キーを `?? ''` 既定で受理し body全体を
`request_body` に保存（json型）する挙動（ee照合: EventService.php:40-45）＝**未知項目を許容し200＋記録**へ写像。**ただし「未知項目許容」はEE実装挙動由来で
Excel/mdに明示規定が無く、firm期待値化せず未知項目方針は @TBD-D5（BC-DRAFT⑧）**。bound主張は「未知項目付きでも受理し200＋body保存」の観測レベルに留める（codex R1）。
**注3（読替・C-RECV）**: -023「データなしのレスポンス確認」は、**有効JSONの空配列 `{"contractId":..,"event":..,"action":..,"ids":[]}`**（データ実体なし）で
受信自体は200・受理・記録し在庫子ジョブは生成されない（StockEventDispatcher:64-71 no ids→warning return）挙動へ写像。
**⚠codex R1: 完全な空body（`""`）は `json_decode`=null → `setRequestBody(array)` でTypeError → 500 になる**（EventService.php:31,45／SmaregiWebhookEvent.php:169 typed `array`）。
よって-023は「空body」でなく「有効JSONだが在庫データ無し（ids空）」に限定して記述する。空body自体はC-ERR(500)の別事象。
**注4（読替・C-IDEM）**: -017「正常で対象条件に該当する値」は、重複でない正当な`smaregi_event_id`受理（非重複経路）へ写像。
**codex R1是正: C-IDEMに非重複ブランチを明示追加**——SEED-WH-VALID（未使用の新規`smaregi_event_id`）で `POST`→200 `{status:ok}`＋受信履歴が**新規作成**される
アサーションを-017の担保とする（C-IDEMのduplicate側=-029と前提・アサーションを分離）。C-STATUS(-002/-016/-022)ともcross-ref。
**注5（読替・C-ERR）**: -020「異常系のレスポンス確認」は受信処理例外→500へ写像。401/400はC-AUTH/C-HDRで別担保。
**注6（読替・C-STATUS）**: -002/-016/-022（HTTPステータス/通信/レスポンスの「ステータスと本文が処理結果と一致」）は、正常受信の
HTTP契約（200＋短時間応答）へ写像。本文exact値はEEのJSON body（`{status:ok}`）が観測できるがExcel=ステータスのみ＝`@TBD-D5`。
**注7（読替・C-STOCK/C-STOCK-HIST）**: -009/-011/-013/-012 はIT-33の数量・金額・履歴の一般観点。本機能の実挙動＝
在庫変動区分02/12の増減・非対象不変・連携元ID/理由付き履歴（applier: `getStockQuantityAfterChange`/`getTotalCostAfterChange($amount)`:141-142・historySourceId=stockChangeId:168）へ写像。
**codex R1是正: -011/-013の「評価額」「連携元金額合計＝実数小計の一致」は算式がExcel/mdに規定されず（applierはamountと既存総原価から算出しsellPriceは履歴売価）＝
firm期待値化せず金額算式は @TBD-D5（BC-DRAFT⑦）**。bound主張は「区分02減算/12加算・非対象不変・連携元ID/理由付き履歴の作成」に限定。**スマレジAPI応答はダブル前提（@TBD ハーネス）**。

### §4.2 母集合対応・partial（1 test_id内に bound枝／要実機枝 を混在。5 C-ID・5母集合行）

母集合の1行が**現EEで観測可能な部分（bound枝）と外部実応答依存部分（要実機枝）を混在**するもの。会計は`partial`（1 test_id=1会計）。

| C-ID | 前提/手順 | bound枝（現EEで観測可・隔離ハーネス前提） | 要実機枝（外部実応答・観測不能） | 対応母集合 |
|---|---|---|---|---|
| C-P1 | 外部取得のレスポンス確認 | Webhook受信は200＋受信履歴まで**ハーネス非依存で観測可**。`dtb_messenger_job`親/子の投入・status遷移は**handler内生成のためハーネス前提（in-memory Messenger＋手動consume）で観測可** `[L1:A0101-006]`（codex R1: 子ジョブ投入はController dispatch単独では起きない） | **在庫変動履歴詳細のスマレジAPI実GET応答**（`getStockChange`の実応答・2xx以外→FAILED）`[L1:A0101-015]` | -015（外部取得） |
| C-P2 | 数量更新失敗/検証/外部連携エラー時の整合 | 自システムはトランザクションでロールバックし部分更新を残さない・ジョブFAILED（`dtb_messenger_job.status`）を観測可 `[L1:A0101-013]` | **連携先（スマレジ）側の実整合**（片側更新を残さない双方整合の外部側）`[L1:A0101-016]` | -010（エラー＝部分更新なし双方整合） |
| C-P3 | 部分失敗の区別 | ids[]毎の子ジョブが独立にsuccess/FAILED（`dtb_messenger_job` per child）・再連携バッチで再投入を観測可 `[L1:A0101-014]` | **転送先（スマレジ）への実転送成否・タイムアウト・部分成功**の外部側整合 `[L1:A0101-016]` | -028（部分失敗） |
| C-P4 | 同時購入（残1）でのオーバーコミット防止 | 2つの在庫同期ジョブが**悲観ロックで直列化される**ことは観測可（`Applier:121-123` PESSIMISTIC_WRITE＋refresh／同一stockChangeId二重反映防止:129-135）`[L1:A0101-012]`。**⚠codex R2: ただし`getStockQuantityAfterChange`は`bcadd`で下限検査が無く（`ProductStock.php:328-333`）、残1に売上量2を適用すれば-1になる＝「負値/オーバーコミットにならない」はコードで未保証のドリフト候補（BC-DRAFT⑩）。この観点は現EEで再現テスト化し、負値防止未成立を検出可能にする（負値防止をbound合格根拠にしない）** | **フロント購入＋管理画面在庫編集＋実POS同期の三者同時**の実タイミング競合 `[L1:A0101-016]` | -031（同時購入） |
| C-P5 | 補償（saga）の収束 | 自系更新失敗時のロールバック・ジョブFAILED・再連携バッチ再実行を観測可 `[L1:A0101-013,014]` | **外部側の取消・返金・引当解放の実補償**と最終収束 `[L1:A0101-016]` | -032（補償） |
| C-P6 | 外部（トークン）キャッシュ形式不正時の分岐 | アクセストークンキャッシュのダブルに**不正値（`token`欠落/配列でない/期限切れ）**を入れると `SmaregiAccessTokenService.php:64-69` が成功扱いせず再取得へ進む＝**キャッシュ素通り→再取得分岐**を隔離観測可 `[L1:A0101-019]`（codex R1で外部キャッシュ実在を反映） | **実トークンエンドポイント再取得の実応答**（再取得先=スマレジIDサーバの実HTTP。ダブルなら近似） | -018（形式不正・外部キャッシュ） |
| C-P7 | 外部（トークン）キャッシュ障害時の代替動作 | キャッシュpoolダブルが `getItem`/`save` で例外を投げる場合、`getAccessToken`で例外伝播→**トークン取得は子`SmaregiStockProcessMessageHandler.php:95,120`で行われるため子ジョブがFAILED化**（codex R2で親handler誤記を訂正）・未定義エラーで停止しないことを隔離観測可 `[L1:A0101-019]` | **実キャッシュ基盤（Redis等・framework.yaml）の実接続障害**。本機能はWebhook受信でフロント表示は無い（LS=0）＝「フロント表示」枝はreferent不在 | -019（障害・外部キャッシュ） |
| C-P8 | タイムアウト時の結果 | スマレジAPIのHTTPクライアントダブルで**timeout例外を発生**させると `SmaregiStockProcessMessageHandler.php:118-142`（2xx以外/例外→FAILED）でジョブFAILED・tx rollback・後続バッチ回収を**隔離DB観測可** `[L1:A0101-015]`（codex R1: 擬似遅延でなく例外注入で自系結果は観測可＝要実機は実タイムアウトのみ） | **スマレジAPIの実タイムアウト発生**（実応答時間・実網状態はローカルで確定不能） | -007（エラーのタイムアウト） |

### §4.3 母集合対応・要実機（真の外部実応答/手動のみ。2 C-ID・2母集合行）

**codex R1是正**: -007タイムアウトは§4.2 C-P8（partial）へ移設（HTTPクライアントダブルの例外注入で自系のFAILED/rollbackは隔離観測可・要実機は実網タイムアウトのみ）。要実機は**手動指定の-024/-025のみ**に限定。

| C-ID | 前提/手順 | 期待結果（三段参照） | 外部依存の観測対象（観測不能な最終値） | 対応母集合 |
|---|---|---|---|---|
| C-R2 | 外部連携 正常系（手動） | 外部（スマレジ）への登録/照会/取引成功時、外部側処理結果と自システム状態/金額/履歴/画面表示が同一取引として整合 `[L1:A0101-016]` | **スマレジ実POS/実取引の成功応答と実整合**（母集合 実行方法=手動） | -024（正常系・手動） |
| C-R3 | 外部連携 異常系（手動） | 外部との通信/業務/タイムアウトエラー・外部成功後の自系更新失敗で二重課金・二重返金・状態不整合を起こさない `[L1:A0101-016]` | **スマレジ実POS/実取引の異常応答と実補償**（母集合 実行方法=手動） | -025（異常系・手動） |

### §4.4 母集合対応・excluded（4母集合行・per-ID実引き・過剰除外禁止）

**codex R1是正**: 旧-018/-019は「外部キャッシュ不在」を根拠にexcludedとしていたが、スマレジ**アクセストークン外部キャッシュ**（`SmaregiAccessTokenService.php:62-68,154-156`）が実在するため**partial（C-P6/C-P7）へ移設**。excludedは以下4件に縮小。

| test_id | 期待テキスト要旨（観点） | 除外理由（一次資料実引き） |
|---|---|---|
| -004 | 複数の単項目バリデーションをまとめて返却し、エラー複数件すべて送出（IT-10） | 基本設計はレスポンス書式=**なし(ステータスコードのみ)**（Excel md:123）。本機能は単一失敗でfail-fast（Controller.php:52-78）で**集約多エラー返却のweb service契約を持たない** `[L1:A0101-020]`。入口検証（401/400）はC-AUTH/C-HDRでbound |
| -005 | 複数の相関バリデーションをまとめて返却し全送出（IT-10） | 同上（集約返却referent不在）。相関検証の実体は認証/ヘッダ/JSON整合で、集約多エラー返却挙動なし `[L1:A0101-020]` |
| -006 | DB相関バリデーションを複数実施し全送出（IT-10） | 同上（集約返却referent不在）。DB相関=`smaregi_event_id`重複判定は単一（C-IDEMでbound）で集約多エラー返却でない `[L1:A0101-020]` |
| -008 | バージョニングが行われている場合、バージョンに応じた実行結果（IT-32） | 基本設計にAPIバージョニングの定義が無く（Excel・記載なし）、Webhookは単一エンドポイント。**「行われている場合」の条件が不成立＝referent不在** `[L1:A0101-018]` |

**過剰除外でないことの傍証**: excluded 4件はいずれも(a)集約多エラー返却の契約が無い（-004,-005,-006＝Excelレスポンス=ステータスのみ）
／(b)バージョニング条件不成立（-008）を実引きで示す。各観点の実在挙動（認証/必須ヘッダ/JSON不正/DB重複）は他候補
（C-AUTH/C-HDR/C-ERR/C-IDEM）でbound化済み＝偽陰性なし。外部キャッシュ観点（-018/-019）はアクセストークンキャッシュを
referentとしてpartial化済（C-P6/C-P7）。

---

## §5 locale・翻訳・応答本文（実装照合補助・オラクルの正としない）

- **LS=0**: WebhookルートはロケールURL補正の対象外（ee照合: Context.php:109 `_route==='smaregi_webhook'`→true・
  InvalidLocaleRedirectListener.php:50）。本機能に多言語表示要件は無い。
- **応答本文**: Excel md:123=レスポンス書式`なし(ステータスコードのみ)`。EE実装は JSON body（`{status:ok}`／
  `{status:error,message:...}`）を返す（Controller.php:61-120）が、**本文exact文字列はオラクル未確定＝`@TBD-D5`**
  （§9 BC-DRAFT②）。候補テストは**HTTPステータスコードを firm オラクル**とし、本文文字列は実装照合補助にとどめる。

---

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

- request契約: Webhook受信=`POST /%eccube_smaregi_webhook_route%`（既定 `smaregi/webhook`・ee照合 routes.yaml:12・
  WebhookController.php:41）。ヘッダ=secretヘッダ（services.yaml:26-27,631-632）＋`smaregi-event-id`。body=JSON。
  期待値は `o("L1-A0101-xxx")`（L1解決器）経由・リテラル直書き禁止。
- バッチ契約: `eccube:smaregi:stock:backfill`（ee照合 SmaregiStockBackfillCommand.php:32）をコンソール起動→子ジョブ投入を観測。
- db.ts（`e2e/helpers/db.ts`）: `dtb_smaregi_webhook_request`（受信履歴・列/件数/status）／`dtb_messenger_job`（親/子・status/
  parent_job_id/payload_summary）／`ProductStock`（区分2 stock/unit_cost/total_cost）／在庫変動履歴 のS0取得・アサーション・
  raw SQL復元の専用便宜関数は**未実装**（実装waveで追加。対象・順序・SQL骨子は§2で特定済み＝配線のみ `@TBD-D5`）。
- 隔離ハーネス（§2）: Messenger in-memory＋worker非起動・`SmaregiStockApiClient`/`SmaregiAccessTokenService` テストダブル。
  **現状ee未整備＝`@TBD(ハーネス)`**。在庫同期boundの実処理完走はこれを前提とし、現時点で実走不可（現在形断定しない）。
- 管理UI観測: `admin_messenger`（webhookCounts）・`admin_messenger_webhooks`/`_webhook_detail`・`admin_messenger_jobs`/
  `_job_detail`（ee照合 DashboardController.php:52,70,107,144,224）。secretヘッダは詳細でmask（:181,205）。
- **オラクル独立性（新規実装routing）**: 期待値は基本設計Excel＋設計md＋観点表由来。ee実装は裏取り（file:line）に用いるが、
  実装既定値/JSON body exact/実装挙動を**そのまま**期待値化しない（Excelと乖離する認証方式・応答本文は§9へ別掲）。

**_drafts/隔離lint証跡**: (1)正式消費側（`oracle.ts`/`db.ts`/既存spec/pages）に本書`_drafts`参照は作成していない。
(2)正式パス `e2e/fixtures/oracle/` 直下・`integration_test/e2e/exec/` 直下に本機能ファイルは作成していない。
(3)本md出力先は `_drafts/` 配下のみ。先例=`_drafts/f04-04_front_cart_shopping_complete_executable_draft.md`。

---

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

| ケース群 | 実行区分（候補） | 観測層 | 備考 |
|---|---|---|---|
| C-AUTH,C-HDR,C-ERR,C-STATUS,C-IDEM,C-RECV | Playwright `request`（Webhook `POST`）＋db.ts | HTTP＋DB（＋管理UI） | 受信のHTTP契約・受信履歴・冪等。**ハーネス非依存で観測可（同期部分のみ）。ジョブ投入以降はハーネス前提** |
| C-STOCK,C-STOCK-HIST | Playwright request＋隔離ハーネス（in-memory Messenger＋API ダブル）＋db.ts | HTTP＋DB＋管理UI（在庫一覧: StockListController。履歴UI経路は@TBD） | 在庫増減・履歴。**@TBD(ハーネス)**・afterEach S0復元 |
| C-P1〜C-P8 | bound枝=request+db.ts（ハーネス前提）／要実機枝=外部実応答 | HTTP＋DB＋外部 | 外部取得/整合/部分失敗/同時/補償/**トークンキャッシュ形式不正・障害(C-P6/C-P7)/タイムアウト(C-P8)**。要実機枝は実POS/実API/実キャッシュ基盤 |
| C-R2,C-R3 | 要実機/手動（スマレジ実POS・実取引） | 外部 | 実応答・実整合・実補償（**-007=C-P8へ移設・codex R1**） |
| C-BACKFILL（§3・-028/-032のbound枝内） | コンソール（`eccube:smaregi:stock:backfill`）＋db.ts | CLI＋DB | 再連携バッチ起動→子ジョブ投入 |

聖域判定・多軸属性の正式付与はD14 v2合格後（本表は暫定）。

---

## §8 func_scope_check 完了表（機能スコープ自己検査。正式O6ではない）

判定はすべて**期待テキスト実内容**による（§0判定原則）。参照先の全候補行は§4に実体掲載済み。

### 集計（32 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound成功（直接一致）** | **6** | 期待テキストが具体挙動の逐語/明確な言い換えで、現EEでseed→HTTP/DB/管理UI観測可能（在庫系はS0復元・@TBD ハーネス前提）。001,014,021,027,029,030 |
| **bound成功（読み替え）** | **12** | グロッサリ/一般観点テンプレ（IT-09/10/32/33）を具体挙動へ写像。現EEで観測可能。002,003,009,011,012,013,016,017,020,022,023,026 |
| **partial** | **8** | 1行の期待テキストが自社DB観測部分（bound枝）と外部実応答部分（要実機枝）を混在。別勘定。010,015,028,031,032＋**codex R1追加: 007（タイムアウト＝ダブル例外注入でFAILED観測可）・018/019（アクセストークン外部キャッシュ実在）** |
| **要実機** | **2** | スマレジ実POS/実取引（-024/-025=手動）。自社側で最終応答を確定できない。**codex R1: -007はpartialへ移設** |
| **excluded** | **4** | 集約多エラー返却契約なし（Excel=ステータスのみ・004/005/006）／バージョニング条件不成立（008）（per-ID実引き・§4.4）。**codex R1: 外部キャッシュ実在で018/019をexcludedから除外** |
| 合計 | **32** | 欠落0・理由なし重複0 |

bound成功18＋partial8＋要実機2＋excluded4＝32（差分0）。※bound成功18の直接/読替内訳は補助分類（会計はbound成功18で1本）。

### 32対応表（No→期待テキスト要旨→会計→候補）

| No | 期待テキスト要旨 | 会計 | 対応候補 |
|---|---|---|---|
| 001 | 資格情報のレスポンス確認（ステータスと本文が一致） | bound(直接) | C-AUTH |
| 002 | HTTPステータスのレスポンス確認 | bound(読替) | C-STATUS |
| 003 | 想定外項目を加えて実行した結果が期待通り | bound(読替) | C-RECV |
| 004 | 複数の単項目バリデーションを集約返却・全送出 | excluded | — |
| 005 | 複数の相関バリデーションを集約返却・全送出 | excluded | — |
| 006 | DB相関バリデーションを集約返却・全送出 | excluded | — |
| 007 | タイムアウトした場合、期待される結果 | partial | C-P8 |
| 008 | バージョニングが行われている場合の実行結果 | excluded | — |
| 009 | 更新対象外のシステム・区分・状態の数量/金額が不変 | bound(読替) | C-STOCK |
| 010 | 部分更新されず連携元・自系・連携先が双方整合 | partial | C-P2 |
| 011 | 外部取引で売上減算・返品加算を別取引と混同しない | bound(読替) | C-STOCK |
| 012 | 連携元ID付き履歴が作成される（自動加算） | bound(読替) | C-STOCK-HIST |
| 013 | 連携元金額合計と実数小計が一致し履歴反映（実数更新） | bound(読替) | C-STOCK |
| 014 | 売上で減算・返品で加算金額により数量と金額を戻す | bound(直接) | C-STOCK |
| 015 | 外部取得のレスポンス確認 | partial | C-P1 |
| 016 | 通信のレスポンス確認 | bound(読替) | C-STATUS |
| 017 | 正常のレスポンス確認 | bound(読替) | C-IDEM |
| 018 | 外部キャッシュのJSON不正/欠落/期限切れ分岐 | partial | C-P6 |
| 019 | 外部キャッシュ接続障害時の代替動作 | partial | C-P7 |
| 020 | 異常系のレスポンス確認 | bound(読替) | C-ERR |
| 021 | 必須条件のレスポンス確認 | bound(直接) | C-HDR |
| 022 | レスポンスのレスポンス確認 | bound(読替) | C-STATUS |
| 023 | データなしのレスポンス確認 | bound(読替) | C-RECV |
| 024 | 外部登録/照会/決済/取消/返金成功時の同一取引整合（手動） | 要実機 | C-R2 |
| 025 | 外部通信/業務/タイムアウト/自系更新失敗時の不整合防止（手動） | 要実機 | C-R3 |
| 026 | 受信検証のレスポンス確認 | bound(読替) | C-AUTH |
| 027 | dtb_smaregi_webhook_request の列（重複・順序） | bound(直接) | C-RECV |
| 028 | 転送先の成功/失敗/タイムアウト/部分成功を区別し整合 | partial | C-P3 |
| 029 | 横断冪等キー定義・重複検知が履歴/相関IDで追跡（可観測性） | bound(直接) | C-IDEM |
| 030 | 対象データ更新・外部連携履歴/受信履歴の記録（販売可能数） | bound(直接) | C-RECV |
| 031 | 同一在庫にフロント/管理/POS同時でも二重成立せず負値なし | partial | C-P4 |
| 032 | 各補償ケースで最終状態収束・補償/再実行が定義通り | partial | C-P5 |

`func_scope_check` 判定: 親32/32会計済み・欠落0・理由なし重複0。O6は主張しない。

### 会計内訳（確定・python検算済み）

- **bound成功（合計18）**: 001,002,003,009,011,012,013,014,016,017,020,021,022,023,026,027,029,030
  - 直接一致（6）: 001,014,021,027,029,030／読み替え（12）: 002,003,009,011,012,013,016,017,020,022,023,026
    （直接/読替は補助分類・会計はbound成功18で1本）
- **partial（8）**: 010,015,028,031,032,**007,018,019**（codex R1で007を要実機から・018/019をexcludedから移設）
- **要実機（2）**: 024,025
- **excluded（4）**: 004,005,006,008
- 18+8+2+4=32・差分0（001..032連番を全被覆・重複なし）

---

## §9 要実機・partial・excluded・BC-DRAFT（正直な分離）

### 要実機（母集合対応・2 test_id・§4.3）
-024（C-R2・実POS/実取引 正常・手動）・-025（C-R3・実POS/実取引 異常・手動）。
**外部の実応答/実整合が観測対象**で自社側で最終値を確定できない。**codex R1: -007（タイムアウト）はダブル例外注入で自系FAILEDを隔離観測可＝partial(C-P8)へ移設**。

### partial（母集合対応・8 test_id・§4.2）
-015（C-P1・外部取得実応答）・-010（C-P2・連携先実整合）・-028（C-P3・転送先実成否）・-031（C-P4・実POS同時競合）・
-032（C-P5・外部実補償）・**-018（C-P6・トークンキャッシュ形式不正→再取得分岐）・-019（C-P7・トークンキャッシュ障害→FAILED代替）・
-007（C-P8・タイムアウト例外→FAILED/rollback）**（codex R1追加）。**各行はbound枝（現EEで観測可・隔離ハーネス前提）／要実機枝（外部実応答）を持つ**（§4.2）。

### excluded（4 test_id・§4.4で詳述・per-ID実引き）
-004,-005,-006（集約多エラー返却契約なし＝Excelレスポンス=ステータスのみ）・-008（バージョニング条件不成立）。
各観点の実在挙動は他候補でbound化済み＝偽陰性なし。**codex R1: 外部キャッシュ観点(-018/-019)はアクセストークンキャッシュ実在によりpartialへ移設**。

### インフラ水準の要実機・ハーネス前提（特定test_idに紐付かない・実装waveの前提事項）

| # | 事項 | 状態 |
|---|---|---|
| 0 | **共有隔離ハーネス（全スマレジ/外部連携T2で共有）** | 在庫同期boundの実処理完走前提。**現状ee未整備＝`@TBD(ハーネス)`**。設計は§2に具体化: Messenger async→`in-memory://`上書き＋worker非起動（messenger.yaml:16,20は実env DSN・:41-47コメントのみ）／`SmaregiStockApiClient`・`SmaregiAccessTokenService` テストダブル／起動時外部非到達アサート。**現在形「実行可能」断定はしない** |
| 1 | スマレジAPIダブル（在庫変動履歴詳細GETのcanned応答） | C-STOCK/C-STOCK-HIST/C-P1の在庫反映前提。`@TBD(ハーネス)` |
| 2 | スマレジ実POS/実webhook/実タイムアウト/実補償/実キャッシュ基盤 | C-R2/C-R3/C-P6/C-P7/C-P8/partial要実機枝。実サンドボックス必要 |
| 3 | 破壊系S0のdb.ts配線 | 対象テーブル・FK削除順序（子ジョブ→親ジョブ、履歴→ProductStock UPDATE、受信履歴DELETE）は§2で特定済み＝配線のみ `@TBD-D5` |
| 4 | secretヘッダ/webhook設定のシード投入 | C-AUTHの前提（`smaregi_webhook_secret`/`_secret_header`＝services.yaml:26-27）。`@TBD-D5` |

### BC-DRAFT / DOC-DRAFT（基本設計/設計md〔オラクル〕と ee実装の乖離候補・断定回避）

**新規実装routing**: オラクル=基本設計Excel＋設計md。以下はee実装を裏取り中に観察した乖離候補で、**テストは
オラクルどおりに書き**、乖離は不具合候補として別掲。ee側の断定は避ける。

| # | オラクル（Excel/md） | ee観察（実測） | 乖離候補・区分 |
|---|---|---|---|
| ① | 認証方式=**IP制限**（Excel md:123） | 認証は**共有secretヘッダの`hash_equals`**（AuthenticationService.php:33-46）＝IP制限でない | 認証方式の相違。候補テストは「認証必須→失敗時401」のみをオラクル（両者一致=認証`有`）とし、方式exactは要確認 |
| ② | レスポンス書式=**なし(ステータスコードのみ)**（Excel md:123） | EEは JSON body を返す（`{status:ok}`／`{status:error,message:...}`・Controller:61-120） | 応答本文の相違。**本文exact値=`@TBD-D5`**。HTTPステータスを firm オラクルとする |
| ③ | エンドポイント=**`/smaregi/stocks`**（Excel md:121-122）・イベント名`pos:stock`（1-1 A・md:194-201）／別記`固定[pos:transactions]`（md:199） | 実ルート=`POST /%eccube_smaregi_webhook_route%`（既定 `smaregi/webhook`・WebhookController.php:41・eccube.yaml:7・routes.yaml:12）。在庫は event=`pos:stock`/action=`edited`（StockEventDispatcher:34,36） | **エンドポイントパスの相違（`/smaregi/stocks` vs `smaregi/webhook`）＝ドリフト確定候補へ格上げ（codex R2）**。テストの仕様ルートはExcel `/smaregi/stocks` を正とし、現実装 `smaregi/webhook` への送信は「現実装の回帰確認」として別ケース化し仕様適合bound数へ混入させない。md:199の`pos:transactions`は在庫節の記載ゆれ |
| ④ | 在庫区分 02:売上→出庫(減算)・12:返品→入庫(加算)（Excel md:189-190） | applier: DIVISION_SALES `02`→減算・DIVISION_RETURN `12`→加算（StockChangeApplier:44-48,247-248） | **一致**（乖離なし・整合確認） |
| ⑤ | 永続化先=`dtb_smaregi_webhook_request`（列一覧 md:35） | Entity定義がスキーマ権威（Entity:22,32-85）。テーブルCREATEは migrations に無く GRANT のみ（Version20260312151141/20260317120648） | テーブル生成マイグレーションの所在が未確認（ORM/schema diff生成の可能性）。列自体は設計md列一覧と一致。要確認（断定回避） |
| ⑥ | Excel記載の在庫連携3方式のうち **API個別(2)・Patch一括(3)**（管理画面在庫編集/一括編集/CSV登録/在庫移動/分割結合/棚卸し・md:135-153） | 本スライスのee実装確認範囲は **Webhook受信(1)＋pos:stock在庫同期** が中心。API個別/Patch一括の管理画面トリガ側実装は本調査で未確認（別機能/別スライスの可能性） | 処理範囲の実装確認漏れの可能性。設計md TODO（md:22,35「未確認の処理範囲は実装確認後に確定」）に整合。本スライス母集合32はWebhook受信/在庫同期の観点で会計済み。要確認（断定回避・ドリフト断定はしない） |
| ⑦ | 在庫金額の算式（評価額/連携元金額合計＝実数小計の一致・-011/-013の一般観点） | applierは在庫数を `getStockQuantityAfterChange($amount)`、総原価を `getTotalCostAfterChange($amount)` で算出し、`sellPrice` は履歴の売価(record['price'])として保存（`Webhook/Stock/SmaregiStockChangeApplier.php:141-142,160`）。Excel/mdに「金額合計＝実数小計」の算式規定なし | **金額算式=@TBD-D5**（codex R1）。bound主張は区分別増減・非対象不変・連携元ID/理由付き履歴に限定し、金額一致はfirm期待値化しない |
| ⑧ | Webhook受信データの必須項目（契約ID/イベント名/アクション/在庫変動履歴IDリスト・Excel md:194-217） | EE `EventService.php:40-45` は各キーを `?? ''` 既定で受理し未知キーも含む body全体を `request_body`(JSON) に保存＝**未知項目許容・欠落キーは空文字既定** | **未知項目許容/欠落キー方針=@TBD-D5**（codex R1/R2）。-003/-023 bound主張は「未知項目付き/ids空でも受理し200＋body保存」の観測レベルに限定し、Excel必須項目との整合方針はD5で確定。空body(`""`)は `setRequestBody(array)` にnull不可でTypeError→500（C-ERR事象） |
| ⑨ | 在庫増減の向き=02:売上→減算/12:返品→加算（Excel md:189-190） | applier `apply()` は区分で`StockChangeTypeDetail`と理由のみ選び、在庫数は`amount`を`getStockQuantityAfterChange`（`ProductStock.php:328-333`＝`bcadd`）へ無条件加算。**区分による符号反転処理なし**（`Applier:75-95,141`）。実際の増減方向はスマレジ応答`amount`の符号契約に依存 | **増減方向=@TBD-D5（codex R2）**。canned応答は`02:+N`/`02:-N`双方を投入し、仕様(02=減算)にならない現EEを検出可能にする。-014/-009/-011/-013の方向assertionはfirm化しない |
| ⑩ | 残数の負値/オーバーコミット防止（観点IT-08 -031） | `getStockQuantityAfterChange`＝単純`bcadd`で**下限検査なし**（`ProductStock.php:328-333`）。悲観ロック（`Applier:121-123`）は直列化のみ。残1に-2適用で-1になり得る | **負値防止は現EE未保証＝ドリフト候補（codex R2）**。-031は再現テストとして残し、負値防止をbound合格根拠にしない。要仕様確定（下限0でエラー/クランプ等の期待） |

候補規律: 全行 `@TBD-D5`・O5未確定・実装/実走なし・O6/聖域/多軸/C6C7を主張しない。

### codex敵対レビュー結果（R1/R2）・未解決指摘の逐語記録（確定はコーディネータ裁定）

**codexは R1・R2いずれも「妥当（候補確定）」と明言せず**（候補確定不可）。R1指摘は本版で会計移設・パス/表名/ハーネス是正済。R2で新規に以下が未解決。

- **[R2 Blocker] エンドポイントすり替え**: Excel `/smaregi/stocks` を実装ルート `smaregi/webhook` で bound会計している＝仕様ルートで固定し実装ルートは回帰確認へ分離せよ／`bound(EEドリフト)0`は不成立（→BC-DRAFT③格上げで是正・ただしbound会計本数の再仕分けはD5/コーディネータ判断に留保）。
- **[R2 Blocker] -031 負値/オーバーコミット防止は実装根拠に反する**: `getStockQuantityAfterChange`は`bcadd`で下限検査なし・悲観ロックは直列化のみ＝残1に-2で-1可能（→BC-DRAFT⑩・C-P4で未保証ドリフト明記で是正）。
- **[R2 Major] 実装既定値のfirmオラクル化**: 400/200/500・ヘッダ名`smaregi-event-id`・status`pending`・3秒はExcel確定値でなくEE照合値＝bound成功件数へ算入せずD5未確定契約へ分離せよ（→§0留保追記で是正・bound18の再仕分けはコーディネータ裁定に留保）。
- **[R2 Major] -003/-023読替が留保と矛盾**: 未知項目許容/ids空受理は現EE既定挙動でExcel期待値でない＝D5保留か回帰別建て（→BC-DRAFT⑧で@TBD明記・bound据置はコーディネータ裁定に留保）。
- **[R2 Major] 売上02/返品12の増減を符号契約なしに主張**: applierは区分で符号反転せず`amount`を加算＝方向はスマレジ応答符号依存（→BC-DRAFT⑨・C-STOCKで方向@TBD化で是正）。
- **[R2 Major] S0が副作用全復元でない**: 実クライアント使用時`dtb_smaregi_platform_api_call_log`が残る（→S0対象に追加で是正）。
- **[R2 Minor] C-P7失敗捕捉箇所誤り**: 親でなく子`SmaregiStockProcessMessageHandler`でFAILED（→是正済）。
- **[R2 Minor] UI両レイヤ網羅未達**: 在庫履歴UIのfile:line未特定（→C-STOCK-HISTのUI網羅主張を撤回・DBアサーション主観測へ）。
- **[R2 Minor] ja/en混在**（firm/bound/partial等）＝候補段階は許容だが最終は和文統一推奨。

**オペレータ見解（却下せず記録）**: R2 Blocker/Majorのうち「bound会計本数の再仕分け」（エンドポイント・実装既定値・-003/-023）は、母集合の期待テキストが一般テンプレ（「HTTPステータスと本文が一致」）であり新規実装routingでEE裏取りを許す本枠組みとの解釈差がある。本版は各assertionを@TBD-D5へ降格し質的契約へ寄せる保守是正に留め、**bound18/partial8/要実機2/excluded4の会計本数は据置**。会計本数を動かすか否かの最終裁定はコーディネータに委ねる。

---

## 付録: 作業実測

- 参照物: 設計md（Excel原典含む）1／観点表1／母集合スライス1（32行）／先例1（f04-04）／
  ee裏取り約16（WebhookController.php・AuthenticationService.php・EventService.php・SmaregiWebhookEvent.php・
  SmaregiWebhookEventRepository.php・SmaregiWebhookEventMessageHandler.php・StockEventDispatcher.php・
  SmaregiStockProcessDispatcher.php・SmaregiStockProcessMessageHandler.php・SmaregiStockChangeApplier.php・
  SmaregiStockBackfillCommand.php・DashboardController.php・MessengerJob.php・messenger.yaml・eccube.yaml・
  routes.yaml／既存 WebhookControllerTest.php〔観測パターン源〕）。
- L1 claim数: **20確定・未解決D5あり**（本文exact/認証方式/金額算式/未知項目方針/スキーマ所在＝BC-DRAFT①②⑤⑦⑧）。候補ケース: bound 8 C-ID（C-AUTH/C-HDR/C-RECV/C-IDEM/C-ERR/C-STATUS/C-STOCK/
  C-STOCK-HIST。C-BACKFILLはpartial(-028/-032)のbound枝内で参照）・partial 8（C-P1〜C-P8）・要実機 2（C-R2/C-R3）。
  母集合対応=bound成功18・partial 8・要実機 2・excluded 4（差分0）。**codex R1是正反映済**。
- **未検証事項（codex再レビュー/実機で要確認）**: BC-DRAFT①〜⑧（特に①認証方式IP制限vs secretヘッダ・③エンドポイント/イベント名の記載ゆれ・⑤テーブルCREATE所在・⑦金額算式・⑧未知項目方針・
  ⑥API個別/Patch一括の実装範囲）、隔離ハーネス・S0の実配線（@TBD-D5）、スマレジAPIダブル整備。
  過剰主張なし・数値は実測・grep0件は「見当たらない（断定回避）」として記載。
</content>
</invoke>

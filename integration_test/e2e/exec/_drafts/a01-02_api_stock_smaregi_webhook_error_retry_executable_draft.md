# A01-02候補: スマレジwebhook連携エラー再連携 — 実行可能グレード候補（母集合29全量踏破）

> 2026-07-26 ／ **候補グレード（candidate・D6前・O5未確定・実装/実走なし）**
> fid=`a01-02_api_stock_smaregi_webhook_error_retry`・区分=**新規実装**（現行pfに対応なし）・母集合**29件**。
> **source_class routing（新規実装=ee-native API/バッチ）**: オラクル（期待値の正）＝基本設計（Excel）＋設計md＋観点表。
> 標準系routingにつき**ee実ソースをL1根拠に使ってよい**（file:lineで裏取り）。実装の不具合はそのまま期待値化せず
> 不具合候補（BC-DRAFT・§9）へ別掲しオラクル独立性を維持。**画面を伴わない機能=両レイヤ網羅（必須）**: (a)API/統合
> レイヤ（Playwright `request`でWebhook受信HTTP＋バッチ起動〔コンソール〕→HTTPステータス/レスポンス本文/終了ステータス/
> 出力/冪等性を観測）、(b)UIレイヤ（結果が管理画面に現れる範囲=**Messengerダッシュボードの受信履歴/ステータス**・
> **在庫（ProductStock）反映**をブラウザ観測）に分類。DB/ログのみ・スマレジ実POS実連携は要実機。
>
> **本機能の実体（ee実測で確定・創作なし）**: 「webhook連携エラー再連携」は2つの実装からなる。
> ①**Webhook受信エンドポイント** `POST /smaregi/webhook`（route名`smaregi_webhook`・`WebhookController.php:41`。prefix=
>   `routes.yaml:12` `/%eccube_smaregi_webhook_route%`＝`eccube.yaml:7` 既定`'smaregi/webhook'`）。認証（`AuthenticationService::verify`）
>   →`smaregi-event-id`必須→重複判定→`dtb_smaregi_webhook_request`へ受信履歴を永続化→`SmaregiWebhookEventMessage`を非同期投入。
> ②**再連携バッチ**（コンソール）`eccube:smaregi:stock:backfill [target-date]`（`SmaregiStockBackfillCommand.php:32`
>   `#[AsCommand(name:'eccube:smaregi:stock:backfill' …)]`→本体`SmaregiStockBackfillAction::handle()`）。スマレジ在庫一覧API/
>   在庫変動履歴APIを取得し、**EC-CUBE側在庫履歴（`dtb_stock_history`）に未保存の在庫変動IDを抽出**して、Webhook受信と同じ
>   子ジョブ（`SmaregiStockProcessMessage`）へ`enqueue`する（`SmaregiStockBackfillAction.php:65-96,228-262`）。在庫変動区分
>   `02`/`12`のみ反映・店頭受取(OTC)除外は**下流の`SmaregiStockChangeApplier`**（`:35,45,48,75-82,108-109`）で行う。
>
> **母集合29の会計（差分0・python検算§8）**: bound成功（API受信）**7**（§4.1・001/002/003/021/022/023/027）＋
> bound成功（バッチ）**7**（§4.2・015/016/018/019/020/024/029）＋bound成功（在庫DB効果）**4**（§4.3・009/012/014/028）＋
> bound成功（読替）**2**（§4.4・011/013）＋partial **2**（§4.5・010/017）＋要実機 **3**（§4.6・007/025/026）＋
> excluded **4**（§4.7・004/005/006/008）。**7+7+4+2+2+3+4=29・差分0**（§8で機械実証・欠番0/重複0/001..029全被覆）。
> bound(EEドリフト)は**0**（本機能は設計記載の主要挙動が現EEに実装済み。設計と実装の乖離〔5時間窓/区分ラベル/status列の
> 位置づけ〕はBC-DRAFT §9へ別掲。いずれも母集合29行のどれをも失敗期待化しない）。
>
> **候補規律**: O5非主張・全fixture_version `@TBD-D5`・`_drafts/`隔離。O6/聖域/多軸join/C6C7通過を主張しない。
> 隔離ハーネス（スマレジAPIスタブ・Messenger in-memory+worker非起動・Webhook secret env）は現状ee側で**E2E用は未整備＝
> `@TBD(ハーネス)`**（§2）。「今すぐ実走可能」と現在形断定しない。

---

## §0 版固定・判定原則・両レイヤ切り分け

- **オラクル（期待値の正）**: 基本設計仕様書（Excel・`excel_to_html/output/0501_基本設計仕様書(API_在庫管理).html`）＋
  設計md `functions/ec-cube-enterprise/a01-02_api_stock_smaregi_webhook_error_retry.md`（本repo・以下「md:行」）＋観点表
  `integration_test/integration-test-viewpoints.md`。**新規実装routing**につき、ee実装は**L1根拠に使ってよい**（file:lineで裏取り）。
- **ee実ソース（版固定=作業ツリー実測D5/D6）**: `/home/y-saito/Developments/ec-cube-enterprise`。
  - Webhook受信: `src/Eccube/Controller/Smaregi/WebhookController.php`（`index()`＝POST受信）／
    `src/Eccube/Service/Smaregi/Webhook/AuthenticationService.php`（`verify`）／`.../Webhook/EventService.php`
    （`createEventFromRequest`/`isDuplicate`）／`src/Eccube/Entity/SmaregiWebhookEvent.php`（table=`dtb_smaregi_webhook_request`）／
    `src/Eccube/MessageHandler/SmaregiWebhookEventMessageHandler.php`（親ジョブ・ステータス遷移）
  - 再連携バッチ: `src/Eccube/Command/SmaregiStockBackfillCommand.php`／
    `src/Eccube/Service/Smaregi/Stock/SmaregiStockBackfillAction.php`（本体）／
    `src/Eccube/Service/Smaregi/Webhook/Stock/SmaregiStockProcessDispatcher.php`（子ジョブenqueue）／
    `.../Webhook/Stock/SmaregiStockChangeApplier.php`（在庫反映＝区分02/12・OTC除外）／
    `src/Eccube/Repository/DtbStockHistoryRepository.php`（`existsBySmaregiStockChangeId`＝未保存判定）
  - 管理画面（UI観測点）: `src/Eccube/Controller/Admin/Messenger/DashboardController.php`（Webhook受信履歴・ステータス集計・
    ジョブ一覧）／在庫（ProductStock）反映は商品在庫管理画面
- **母集合**: 上記スライスTSV全**29行**（-001〜-029。実行方法列＝-025/-026のみ「手動」・他27件「非UI」）。全観点が
  IT-09/IT-10/IT-32/IT-33（ウェブサービス／数量・金額系）で、テスト項目名・前提条件・入力データ列は**生成器テンプレノイズ**。
  bindは各行の**「期待結果／レスポンス」実テキスト**と**観点(IT-ID/中項目)**で判定する（§8に全29行併記）。
- **判定原則（両レイヤ網羅・必須）**: 各観点を
  - **(a) API/統合レイヤ**: Webhook受信は`POST /smaregi/webhook`にPlaywright `request`でHTTP送信し**HTTPステータス・
    レスポンス本文（JSON `status`/`message`）**を観測。バッチは`eccube:smaregi:stock:backfill`をコンソール起動し
    **終了ステータス（SUCCESS/FAILURE）・サマリ出力（`対象/取得/再連携/スキップ/失敗`件数）**を観測。
  - **(b) UIレイヤ**: 受信履歴/ステータスは**管理画面Messengerダッシュボード**（`DashboardController.php:52` `admin_messenger`／
    `:107` `admin_messenger_webhooks`／`:56` `getCountsByStatus`）で観測。在庫反映は**商品在庫（ProductStock）一覧**で観測。
  - どちらでも観測不能でスマレジ**実POS/実プラットフォームAPIの実応答/実タイムアウト**に依存する期待は**要実機**（§4.6）。
- **外部依存の切り分け**:
  - **要実機＝真の外部実応答/実タイムアウト/実POS連携のみ**: スマレジプラットフォームAPIの実タイムアウト・実通信例外・
    実POS取引の外部側整合。「状態（受信失敗の在庫変動が未保存であること／webhookペイロード）」はローカルseed/スタブで表現でき要実機でない。
  - **bound＝自社DB/HTTP応答/管理画面で観測可能**: Webhook受信のHTTPステータス/応答本文/受信履歴（`dtb_smaregi_webhook_request`）・
    バッチの終了ステータス/サマリ・在庫（ProductStock）反映・在庫履歴（`dtb_stock_history`）・子ジョブ（`dtb_messenger_job`）。
    これらは破壊的でも隔離テストDB＋seed＋S0復元＋DB/UIアサーションで観測でき要実機でない。

---

## §1 L1原子オラクル表（出典=基本設計/設計md/観点表・ee実装をfile:lineで裏取り）

全16 claim。「観測層」列は本機能の両レイヤ網羅の第一分類（API=受信HTTP or バッチ起動／UI=管理画面）。

| oracle_id | 観点 | claim（期待値の正） | 根拠（md / ee file:line） | 観測層 | 外部依存 |
|---|---|---|---|---|---|
| L1-A0102-001 | route/entry(webhook) | Webhook受信は`POST /smaregi/webhook`（route名`smaregi_webhook`）。認証・`smaregi-event-id`必須・重複判定を通過後、受信内容を`dtb_smaregi_webhook_request`（初期status=`pending`）へ永続化し`MessageBus::dispatch`で非同期投入し、同期で`200`＋`{"status":"ok"}`（JSON）を返す。※WebhookController.php:106「3秒以内に空のレスポンス」は**コメント**でありタイムアウト制御・時間計測は実装されず（応答本文も空でなく`{"status":"ok"}`）＝性能SLOはテスト層でアサートしない別途性能検証枠（§9 DOC-DRAFT⑤） | md:49-50 ／ WebhookController.php:41,91-109・EventService.php:47・routes.yaml:12・eccube.yaml:7 | API受信 | 否 |
| L1-A0102-002 | auth/資格情報 | 認証（署名シークレット）が欠落/不正な場合は対象処理を実行せず`401`（`{"status":"error","message":"Authentication failed"}`）を返す | md:49,56・観点514/504 ／ AuthenticationService.php:33-45（`hash_equals`）・WebhookController.php:52-65 | API受信 | 否 |
| L1-A0102-003 | 必須/受信検証 | `smaregi-event-id`ヘッダが欠落の場合は業務更新を行わず`400`（`{"status":"error","message":"Smaregi-Event-Id header is required"}`）を返す | md:83・観点497,515 ／ WebhookController.php:67-78 | API受信 | 否 |
| L1-A0102-004 | 重複・順序/冪等 | 同一`smaregi-event-id`の再送は重複反映せず`200`（`{"status":"ok","message":"Event is duplicate"}`）を返し新規受信履歴を作成しない。バッチ側は在庫変動IDが在庫履歴に既存なら再連携をスキップ | md:139-142・観点515,516 ／ WebhookController.php:80-89・EventService.php:52-57・SmaregiStockBackfillAction.php:237-243・DtbStockHistoryRepository.php:371-383 | API受信/バッチ | 否 |
| L1-A0102-005 | 想定外項目 | 受信本文に想定外の追加キーを含めても、実体へは規定フィールド（contractId/event/action/requestBody/…）のみ設定し、追加キーは受信本文JSONとして保存されるだけで意図しない項目設定は起こさない（マスアサインメント無し） | 観点472 ／ EventService.php:29-49（明示setterのみ・`setRequestBody($body)`） | API受信 | 否 |
| L1-A0102-006 | 正常応答/レスポンス | 正常受信は`200`＋`{"status":"ok"}`（Content-Type JSON）を返す | md:42・観点498 ／ WebhookController.php:107-109 | API受信 | 否 |
| L1-A0102-007 | 異常系応答 | 受信処理中に例外が発生した場合は`500`（`{"status":"error","message":"Error processing webhook"}`）を返す | md:64,86・観点474 ／ WebhookController.php:110-121 | API受信 | 否 |
| L1-A0102-008 | 受信履歴/ステータス | 受信・処理の状態は`dtb_smaregi_webhook_request`の`status`（pending/processing/completed/failed）・`started_at`・`completed_at`で管理する | md:35,79 ／ SmaregiWebhookEvent.php:22,27-30,64-71・SmaregiWebhookEventMessageHandler.php:54-55,104-105,117-119 | UI(管理画面)/DB | 否 |
| L1-A0102-009 | batch/entry | 再連携バッチは`eccube:smaregi:stock:backfill [target-date]`で起動し、未指定時は駆動日を対象日とする。処理結果は「対象(商品×店舗)/取得/再連携(enqueue)/スキップ/失敗」件数のサマリで返す | md:35,60-64,127-136 ／ SmaregiStockBackfillCommand.php:32,44-47,68-84・SmaregiStockBackfillAction.php:65-96 | バッチ | 否（API取得はスタブ化） |
| L1-A0102-010 | 抽出条件 | 取得した在庫変動のうち、EC-CUBE側在庫履歴に**未保存**の在庫変動IDを抽出して再連携（enqueue）し、既保存はスキップする | md:129,142,149・★1 ／ SmaregiStockBackfillAction.php:228-243・DtbStockHistoryRepository.php:371-383 | バッチ/DB | 否 |
| L1-A0102-011 | 区分整合/反映対象 | 在庫反映対象は在庫変動区分`02`・`12`のみ。それ以外（修正/ロス/棚卸等）・店頭受取(OTC)用スマレジ商品は在庫反映しない（更新対象外の数量は不変） | md:129,143-144・★1・観点483,112 ／ SmaregiStockChangeApplier.php:35,45,48,75-82,108-109 | バッチ/DB/UI | 否 |
| L1-A0102-012 | 数量・金額更新 | 反映時、対象`ProductStock`の在庫数量を`現在在庫＋stockChangeQuantity`で更新（増減の符号はスマレジAPIの数量に含まれ、区分02/12は反映対象の選別）し、総原価(`total_cost`)を`getTotalCostAfterChange`で仕様通り再計算する（`unit_cost`は総原価/在庫の算出値＝保存列でない） | md:77,149・観点485,486 ／ SmaregiStockChangeApplier.php:137-153・ProductStock.php:328-345,352 | バッチ/DB/UI | 否 |
| L1-A0102-013 | 履歴（連携元ID付） | 反映ごとに在庫履歴（`dtb_stock_history`）を作成し、履歴ソース種別=SMAREGI_SYNC・ソースID=スマレジ在庫変動IDを持つ（連携元ID付き履歴） | md:78・観点406,487 ／ SmaregiStockChangeApplier.php:155-178・DtbStockHistoryRepository.php:373-380 | バッチ/DB | 否 |
| L1-A0102-014 | バッチ異常終了/部分失敗 | 外部API取得でHTTP 200以外・一部ペア失敗が発生しても未処理例外で停止せず、失敗件数を記録し`failed>0`のとき非正常終了（FAILURE）として監視で検知できるようにする。成功/失敗/スキップを区別し再実行可（冪等） | md:64,84-86・観点491,492,517 ／ SmaregiStockBackfillCommand.php:79-90・SmaregiStockBackfillAction.php:120-123,183-194,209-219,245-261 | バッチ | 否（実タイムアウト/実通信は要実機） |
| L1-A0102-015 | データなし | 未保存の在庫変動が0件（または取得0件）の場合は正常終了（SUCCESS）し、再連携件数0のサマリを返す | 観点499 ／ SmaregiStockBackfillAction.php:80-96・SmaregiStockBackfillCommand.php:85-88 | バッチ | 否 |
| L1-A0102-016 | 外部実応答/実POS | 決済代行/外部決済・スマレジ実POSの実連携（外部側成功後の自システム更新失敗を含む）や実タイムアウト/実通信例外時の整合は、外部側の実処理結果に依存し自社側で最終確定できない | md:86・観点508,509,481,492 ／ 上記スタブ範囲外 | 外部 | **要（外部実応答）** |

---

## §2 SEED三段参照設計・隔離ハーネス・破壊系S0

三段参照: **期待の正=L1オラクルID（§1） → 前提状態=SEEDセットID → 観測=実値（HTTP応答/コンソール出力/db.ts/管理画面）**。

| SEEDセットID | 目的 | 内容（要点） |
|---|---|---|
| SEED-A0102-WHSECRET | Webhook認証の正/不正 | `SMAREGI_WEBHOOK_SECRET`/`SMAREGI_WEBHOOK_SECRET_HEADER`（services.yaml:26-27）を既知値に固定し、正しいsecretヘッダ／不正・欠落を送り分ける |
| SEED-A0102-WHDUP | 重複受信 | `dtb_smaregi_webhook_request`に既存の`smaregi_event_id`を1件seedし、同一IDのwebhookを再送 |
| SEED-A0102-STOCKAPI | バッチのスマレジAPI応答 | スマレジ在庫一覧API/在庫変動履歴APIの応答を**テストスタブ**（既知の(productId,storeId)・在庫変動行・区分・ID）で供給（実POS非依存） |
| SEED-A0102-UNSAVED | 未保存の在庫変動 | 上記スタブの在庫変動IDのうち一部を`dtb_stock_history`（SMAREGI_SYNC・sourceId）に既保存、一部を未保存にして抽出/スキップの分岐を作る |
| SEED-A0102-PRODSTOCK | 在庫反映対象 | スマレジ区分の`ProductStock`（`smaregiProductId`・`STOCK_LOCATION_SMAREGI`・既知stock/unitCost）を用意し反映差分を検証可能にする |
| SEED-A0102-DIV | 区分別 | 区分`02`/`12`/その他（修正等）・OTC商品を混在させ、反映対象/非対象を作る |

### 外部副作用の隔離ハーネス設計（共有@TBD・現在形断定なし）

**問題（ee実測）**: Webhook受信は`MessageBusInterface::dispatch`で非同期投入（WebhookController.php:102）、バッチは
`SmaregiStockProcessDispatcher::dispatch`で子ジョブを`MessageBus`へ投入（SmaregiStockProcessDispatcher.php:64-71）し、
本体（`SmaregiStockBackfillAction`）は**スマレジプラットフォームAPI**（`SmaregiAccessTokenService`/`SmaregiStockApiClient`）を
呼ぶ。従ってAPI/バッチboundは下記の共有隔離ハーネスを前提とする。**現状ee側にE2E用は未整備＝`@TBD(ハーネス)`**。

| 外部副作用 | 隔離設計（何を・どこに） | 整備状態 |
|---|---|---|
| スマレジ プラットフォームAPI（在庫一覧/在庫変動履歴/アクセストークン） | E2E services上書きで`SmaregiStockApiClient`/`SmaregiAccessTokenService`を**テストダブル**へ差替え、既知応答・非2xx・例外・0件を注入。※**共通モック基盤は既存**（クライアントID未設定時に`SmaregiHttpClientPass`が`SmaregiMockResponder`へ差替え・services.yaml:639）だが**在庫一覧/在庫変動ルート・非2xx/例外/429の可変制御は当該モックに未実装**＝C-07〜C-13向けのstock/stock-change可変応答E2Eスタブは未整備 | **一部既存・在庫用は未整備（@TBD(ハーネス)）** |
| Messenger（Webhook親ジョブ/子ジョブの実処理） | async transportを`in-memory://`へE2E上書き。**観測は2フェーズに分離**: (P1)worker非起動＝Webhook受信直後は`dtb_smaregi_webhook_request`が**status=`pending`・started_at/completed_at=null・messenger_job_id=null**で作成され、親メッセージがin-memory transportにenqueueされた状態のみ観測可（**親`dtb_messenger_job`はまだ作成されない**）。(P2)`messenger:consume`を**明示起動**して初めて`SmaregiWebhookEventMessageHandler`が親`dtb_messenger_job`を作成しstatusを`processing→completed/failed`へ遷移させ、子ジョブenqueue・在庫反映が走る。§4.3/§4.5のjob行・status遷移・在庫反映は**P2（worker明示起動）フェーズの観測**である | **未整備（@TBD(ハーネス)）** |
| Webhook secret | `SMAREGI_WEBHOOK_SECRET`/`_HEADER`をE2E env固定（認証の正/不正を決定的化） | env設定のみ（起動時確認要） |

- 結論の言い方（統一）: API/バッチboundは**「（隔離ハーネス整備を前提に）bound観測可能。ハーネス未整備のため現時点で
  実走不可＝@TBD(ハーネス)」**。アサーションは自社HTTP応答/コンソール出力/自社DB/管理画面で完結（スマレジ外部への実送達/
  実応答成否はアサーションに含めない）。

### 破壊系S0スナップショット・復元設計

**S0対象テーブル（操作直前にraw psql=db.tsでスナップショット・作成した子→親の順で削除復元）**。※`dtb_messenger_job.parent_job_id`は**DB制約上のFKを張らない**（`MessengerJob.php:64-69`「FKは貼らず」）ため「FK依存順」ではなく、**テスト内で作成した親子job IDを子→親順で削除する運用規約**として扱う:
| 対象 | スナップショット項目 | 復元方法（実行可能形） |
|---|---|---|
| `dtb_smaregi_webhook_request` | 受信で作成された行（S0=当該`smaregi_event_id`行なし） | 存在照会→`DELETE FROM dtb_smaregi_webhook_request WHERE smaregi_event_id = $1`（バインド）。重複seed行はS0で用意した既知IDのみ復元 |
| `dtb_messenger_job` | enqueueで作成された子/親ジョブ（S0=当該payload_summary行なし） | テスト内で作成したジョブIDを記録→`DELETE FROM dtb_messenger_job WHERE id = ANY($1)`。※`messenger_messages`transportは`in-memory`のためDB残存なし |
| `dtb_stock_history` | 反映で作成された在庫履歴（S0=当該SMAREGI_SYNC/sourceId行なし） | `DELETE FROM dtb_stock_history WHERE history_source_type = :smaregi_sync AND history_source_id = $1` |
| `dtb_product_stock` | 対象`ProductStock`の`stock`/`total_cost`/`update_date`（S0値）。※`unit_cost`は**保存列でなく`getUnitCost()`=総原価/在庫の算出メソッド**（ProductStock.php:352）でありDB復元対象に含めない。`total_cost`のみ保存列（:288）。`dtb_product_class.stock`は本反映経路（`SmaregiStockChangeApplier`→`ProductStock`更新）では更新されないため対象外 | `UPDATE dtb_product_stock SET stock=:s0, total_cost=:t0, update_date=:d0 WHERE id=:psid`（ORM経由せずraw SQL。実行前後SQLは実DBスキーマで検証） |

- **raw SQLで復元**（Doctrineイベント非発火）。db.ts実配線のみ`@TBD-D5`（対象・順序・SQL骨子は本§で特定済み）。
  冪等性担保: 各SEEDは使い捨て・独立・afterEach復元。
- **戻せない副作用（安全境界）**: `dtb_smaregi_webhook_request_id_seq`等の採番は前進し復元しない（業務影響なし）。
  スマレジ外部側状態は自社DB復元では戻らない（要実機枠のみ該当・本機能のboundはスタブ応答で完結）。

---

## §3 入力I/F（本機能はHTMLフォームなし・Webhook本文/バッチ引数）

本機能は管理画面入力フォームを持たない。入力I/Fは(a)**Webhook受信のHTTPリクエスト**（`smaregi-event-id`ヘッダ・
署名シークレットヘッダ・JSON本文`contractId/event/action/…`）と(b)**バッチ引数**`target-date`（省略時=駆動日）のみ。
よって画面項目の三値比較（設計/eeフォーム/eeDB）の対象入力項目は存在しない。母集合の「単項目/相関/DB相関バリデーションを
まとめて返却するウェブサービス」テンプレ（IT-10・004/005/006）は、本機能が**フォーム集約バリデーション型のウェブサービスでない**
（Webhookは単一の順次ガード＝認証→ヘッダ必須→重複、で最初の不成立で即応答）ため対応実挙動を持たない＝§4.7 excludedの根拠。

---

## §4 実行可能グレード候補（自己完結＝全候補ケースを実体掲載）

記法: 期待結果セルは `…実値… [L1:<oracle_id>]`。ee参照は`（ee: file:line）`。各行の観測層（API受信/バッチ/UI/DB）を明記。

### §4.1 bound成功・API受信レイヤ（`POST /smaregi/webhook`・Playwright request・7母集合行）

| C-ID | 対象観点 | 前提/手順 | 期待結果（三段参照） | 観測層 | 対応母集合 |
|---|---|---|---|---|---|
| C-01 | 認証/資格情報 | SEED-A0102-WHSECRETで、署名シークレットヘッダを不正/欠落にして`POST /smaregi/webhook` | HTTP`401`＋本文`{"status":"error","message":"Authentication failed"}`。受信履歴（`dtb_smaregi_webhook_request`）を作成しない `[L1:A0102-002]`（ee: WebhookController.php:52-65・AuthenticationService.php:33-45） | API受信 | -001（資格情報のレスポンス確認） |
| C-02 | HTTPステータス | 正しいsecret＋`smaregi-event-id`＋正常JSONで`POST /smaregi/webhook` | HTTP`200`＋`{"status":"ok"}`。異常入力では下記C-03/C-05/C-07の各ステータス `[L1:A0102-001,006]`（ee: WebhookController.php:107-109） | API受信 | -002（HTTPステータスのレスポンス確認） |
| C-03 | 想定外項目/マスアサインメント | 正常受信のJSONに想定外の追加キー（例`"isAdmin":true`等）を加えて`POST /smaregi/webhook` | HTTP`200`＋`{"status":"ok"}`。実体には規定フィールドのみ設定され、追加キーは`request_body`JSONとして保存されるだけで意図しない項目設定は起きない `[L1:A0102-005]`（ee: EventService.php:29-49＝明示setterのみ・`setRequestBody($body)`） | API受信/DB | -003（想定外項目を加えた結果） |
| C-04 | 異常系応答 | 受信処理中に内部例外を誘発（例: 永続化失敗をスタブで注入）して`POST /smaregi/webhook` | HTTP`500`＋`{"status":"error","message":"Error processing webhook"}` `[L1:A0102-007]`（ee: WebhookController.php:110-121） | API受信 | -021（異常系のレスポンス確認） |
| C-05 | 必須条件/受信検証 | 正しいsecret・**`smaregi-event-id`ヘッダ欠落**で`POST /smaregi/webhook` | HTTP`400`＋`{"status":"error","message":"Smaregi-Event-Id header is required"}`。業務更新（受信履歴作成・非同期投入）を行わない `[L1:A0102-003]`（ee: WebhookController.php:67-78） | API受信 | -022（必須条件のレスポンス確認）／-027（受信検証のレスポンス確認・注1） |
| C-06 | 正常応答/レスポンス | 正常受信で`POST /smaregi/webhook` | HTTP`200`・Content-Type=application/json・本文`{"status":"ok"}` `[L1:A0102-006]`（ee: WebhookController.php:107-109＝`JsonResponse`） | API受信 | -023（レスポンスのレスポンス確認） |

**注1（-027受信検証）**: 観点515（Webhook受信検証=メソッド/ヘッダ/署名/識別子を検証し不正な通知では業務更新せず仕様通り応答）は、
本機能では**認証（署名）→`smaregi-event-id`必須→重複**の順次ガードとして実装され、不成立時に業務更新せず401/400/200を返す
（ee: WebhookController.php:52-89）。逐語の「受信検証の処理結果と一致」を、この受信検証ガード群の応答（-001/-022と同観測点＝
特に必須ヘッダ検証400）へ写像しC-05へ束ねる（認証側はC-01と同観測）。

### §4.2 bound成功・バッチレイヤ（`eccube:smaregi:stock:backfill`・コンソール起動＋スタブAPI・7母集合行）

| C-ID | 対象観点 | 前提/手順 | 期待結果（三段参照） | 観測層 | 対応母集合 |
|---|---|---|---|---|---|
| C-07 | 外部取得/正常バッチ | SEED-A0102-STOCKAPI/UNSAVEDで`eccube:smaregi:stock:backfill <date>`起動（スタブAPIが在庫一覧＋在庫変動履歴を返す） | 終了`SUCCESS`。サマリに`対象(商品×店舗)`・`取得`件数が出力され、未保存分が`再連携(enqueue)`・既保存分が`スキップ`に計上 `[L1:A0102-009,010]`（ee: SmaregiStockBackfillAction.php:65-96,197-201・Command:68-88） | バッチ | -015（外部取得のレスポンス確認） |
| C-08 | HTTPステータス（異常終了） | スタブAPIが在庫一覧で**非2xx**を返す状態で起動 | 200以外を成功データとして保存/enqueueせず、`RuntimeException`→Commandが捕捉し終了`FAILURE`（エラー出力）。`dtb_stock_history`/子ジョブに新規行を作らない `[L1:A0102-014]`（ee: SmaregiStockBackfillAction.php:120-123・Command:57-65） | バッチ/DB | -016（HTTPステータスのレスポンス確認） |
| C-09 | 正常（対象条件該当値） | 未保存の在庫変動を含むスタブ応答で起動 | 終了`SUCCESS`。未保存の在庫変動IDが`再連携(enqueue)`件数に計上され、対応する子ジョブ（`dtb_messenger_job`・`SmaregiStockProcessMessage`）が作成される `[L1:A0102-009,010]`（ee: SmaregiStockBackfillAction.php:245-252・SmaregiStockProcessDispatcher.php:50-63） | バッチ/DB | -018（正常のレスポンス確認） |
| C-10 | 形式不正（行レベル） | スタブAPIが**有効なJSON配列**の中に非配列行・`id`欠落/非数字行を混在させて返す（HTTP 2xx） | 未定義エラー（PHP warning/例外）にならず、`extractRows`が非配列行を除外し、`id`欠落/非数字行は`スキップ`に計上、正常行のみenqueue。処理は継続し終了`SUCCESS` `[L1:A0102-010]`（ee: SmaregiStockBackfillAction.php:271-285＝extractRows非配列除外／:230-235＝id欠落・非数字skip）。**注**: レスポンス本文**全体**がJSONパース不能な場合は`decodeJson`が`null`→`extractRows(null)`が空配列→`失敗0`のまま`SUCCESS`で**黙って0件扱い**になり、観点019テンプレの「成功扱いせず外部再取得/エラー表示へ分岐」とは**乖離**する（現EEに全体不正JSONを異常終了させる分岐なし）＝§9 BC-DRAFT⑥へ別掲（実装追従の成功期待に流用しない） | バッチ | -019（形式不正の結合確認） |
| C-11 | 障害（接続障害） | スタブAPI/トークン取得が例外（接続障害相当）を投げる状態で起動 | バッチが未処理例外で異常停止せず、Commandが`\Throwable`を捕捉して終了`FAILURE`（エラーメッセージ出力）。DB副作用を残さない `[L1:A0102-014]`（ee: SmaregiStockBackfillCommand.php:57-65） | バッチ | -020（障害の結合確認） |
| C-12 | データなし | スタブAPIが在庫変動0件（または全件が既保存）を返す状態で起動 | 終了`SUCCESS`。`再連携(enqueue)=0`件のサマリを返し、子ジョブ・在庫履歴を新規作成しない `[L1:A0102-015]`（ee: SmaregiStockBackfillAction.php:80-96・Command:85-88） | バッチ/DB | -024（データなしのレスポンス確認） |
| C-13 | 部分失敗/再実行可否 | 複数(productId,storeId)ペアのうち一部で在庫変動履歴APIが非2xxを返すスタブ応答 | 成功ペアはenqueue、失敗ペアは`失敗`件数に計上（全体は停止せず次ペアへ）。`failed>0`で終了`FAILURE`。再実行時は既enqueue/既保存分を`existsBy`でスキップし二重反映しない（冪等） `[L1:A0102-014,004]`（ee: SmaregiStockBackfillAction.php:183-194,237-243） | バッチ/DB | -029（部分失敗の結合確認） |

### §4.3 bound成功・在庫DB効果レイヤ（子ジョブ処理後の反映＝worker起動時／Applier直接・4母集合行）

**前提**: これらは子ジョブ（`SmaregiStockProcessMessage`）が処理された後の在庫反映を観測する。隔離ハーネスでは
`messenger:consume`を明示起動する（またはApplierを直接実行する）ことで、スタブAPI応答→反映までを決定的に評価する。

| C-ID | 対象観点 | 前提/手順 | 期待結果（三段参照） | 観測層 | 対応母集合 |
|---|---|---|---|---|---|
| C-14 | 区分整合 | SEED-A0102-DIV/PRODSTOCKで区分`02`/`12`/その他/OTCを混在させ反映処理 | 反映対象は区分`02`・`12`かつ非OTCのみ。それ以外（修正/ロス/棚卸）・OTC商品のスマレジ在庫は在庫数量が変動しない（更新対象外の区分/商品は不変） `[L1:A0102-011]`（ee: SmaregiStockChangeApplier.php:75-82,108-109）。UI=商品在庫一覧で対象/非対象の在庫数を確認 | バッチ/DB/UI | -009（区分整合の結合確認） |
| C-15 | 自動加算（連携元ID付履歴） | 区分`12`（返品）の在庫変動を反映 | 対象`ProductStock`の在庫が加算相当で更新され、`dtb_stock_history`に履歴ソース種別=SMAREGI_SYNC・ソースID=スマレジ在庫変動IDを持つ履歴が1件作成される（連携元ID付き） `[L1:A0102-012,013]`（ee: SmaregiStockChangeApplier.php:137-178・DtbStockHistoryRepository.php:373-380） | バッチ/DB | -012（自動加算の結合確認） |
| C-16 | 売上・返品 | 区分`02`（売上）と`12`（返品）の在庫変動をそれぞれ反映 | 反映後在庫=現在在庫＋`stockChangeQuantity`（`getStockQuantityAfterChange`=`bcadd(stock, qty)`・ProductStock.php:328-333）。**増減の符号はスマレジAPIの`amount`/数量に含まれる**（区分`02`/`12`は反映対象の選別のみ・SmaregiStockChangeApplier.php:75-82,141-153）。よってseedは「`02`には負、`12`には正の`amount`」を与え、売上で数量減・返品で数量増＋原価を`getTotalCostAfterChange`で戻すことを検証する `[L1:A0102-012]` | バッチ/DB/UI | -014（売上・返品の結合確認） |
| C-17 | 重複・順序/受信履歴 | (a)同一`smaregi-event-id`を再送 (b)同一スマレジ在庫変動IDを再バッチ | (a)Webhookは重複判定で200・新規受信履歴を作らない (b)バッチは`existsBySmaregiStockChangeId`で既保存をスキップし在庫履歴/在庫を二重更新しない。受信履歴（`dtb_smaregi_webhook_request`）と処理は管理画面Messengerダッシュボードで確認 `[L1:A0102-004]`（ee: WebhookController.php:80-89・SmaregiStockBackfillAction.php:237-243・DashboardController.php:52-56） | API受信/バッチ/DB/UI | -028（重複・順序の操作結果確認） |

### §4.4 bound成功・読替（テンプレを本機能の在庫反映挙動へ写像・2母集合行）

| C-ID | 対象観点 | 前提/手順 | 期待結果（三段参照） | 観測層 | 対応母集合 |
|---|---|---|---|---|---|
| C-18 | 外部取引（売上/返品加減算） | 区分`02`/`12`の在庫変動を反映（C-16と同観測点） | 外部連携（スマレジ）由来の売上/返品で、現在数量・現在原価から加算/減算額を仕様通り計算し反映する（別取引の値と混同しない＝在庫変動IDごとに独立処理） `[L1:A0102-012]`（ee: SmaregiStockChangeApplier.php:141-178）。※本機能の在庫反映の「金額」は原価(unitCost/totalCost)。販売金額概念は本機能に無い→原価再計算へ読替 | バッチ/DB | -011（外部取引の結合確認・読替） |
| C-19 | 実数更新/履歴反映 | 在庫変動の反映で在庫履歴を作成（C-13/C-15と同観測点） | 外部連携由来の在庫更新が、対象区分の在庫履歴（`dtb_stock_history`）へ反映される（履歴に更新前後・ソースID） `[L1:A0102-013]`（ee: SmaregiStockChangeApplier.php:155-178）。※「実数反映(棚卸)」区分そのものは反映対象外（§9 DOC-DRAFT）。テンプレの「対象区分の履歴へ反映」を在庫履歴作成へ読替 | バッチ/DB | -013（実数更新の結合確認・読替） |

### §4.5 partial（1 test_id内に bound枝／要実機枝 を混在・2母集合行）

| C-ID | 前提/手順 | bound枝（自社DBで観測可・成功） | 要実機枝（外部実応答・観測不能） | 対応母集合 |
|---|---|---|---|---|
| C-P1 | 連携エラー時の部分更新防止 | 反映失敗時（例: マスタ不整合で`RuntimeException`）、**子ジョブ処理（`SmaregiStockProcessMessageHandler`）内トランザクションがrollback**し在庫/在庫履歴を部分更新しない（PESSIMISTIC_WRITEロック・ee: SmaregiStockProcessMessageHandler.php:79-94）。**子`dtb_messenger_job`=FAILED・error_message記録**（:103,144-150）。管理画面Messengerダッシュボードで子ジョブのFAILEDを確認 `[L1:A0102-008,014]`。**⚠実装乖離（§9 BC-DRAFT⑦）**: 親Webhookイベント（`dtb_smaregi_webhook_request.status`）は子ジョブdispatch成功後に`completed`へ遷移し（SmaregiWebhookEventMessageHandler.php:104）、**子ジョブの反映失敗は親statusへ伝播しない**。親statusが`failed`になるのは親ハンドラのdispatch自体が失敗した場合に限る（:109-131）。よって「連携元・自・連携先の双方整合」のうち自社側で観測できるのは子ジョブFAILED＋在庫ロールバックまで | **連携元・連携先（スマレジ外部）側の整合＝外部実応答が必要**（子ジョブfailed・在庫ロールバックは観測可だが、連携先スマレジ側の状態は外部側処理で自社確定不能） | -010（エラーの結合確認＝「連携元・自システム・連携先のいずれにも片側更新を残さず双方で整合」） |
| C-P2 | 通信例外時の失敗処理と再試行/通知 | スタブAPI/トークン取得が**例外/statusCode=0/429/5xx**（実HTTPクライアントは通信例外を捕捉し`statusCode=0`を返す・ee: SmaregiStockApiClient.php:208-223／`SmaregiGuzzleClientFactory`が429/5xx/接続失敗を最大3回リトライ・:32,39,112-116）を返す状態で処理。子ジョブは非2xxを`RuntimeException`にしジョブFAILED＋rollback（SmaregiStockProcessMessageHandler.php:137-139,95-105）／バッチは`failed`計上＋FAILURE（SmaregiStockBackfillAction.php:182-194・Command:57-65）。**HTTPリトライ回数・失敗記録・終了コードFAILURE・DB非更新はテストダブルでbound観測可** `[L1:A0102-014]` | **(1)実ネットワークのタイムアウト時間/実通信例外の実挙動**（実クライアント設定・実遅延依存で決定的再現不能）＋**(2)エラーメール通知の仕様/実装が当該経路で未確認**（§9 BC-DRAFT④。HTTPリトライは実装済みだが「通知」referentが未確認） | -017（通信のレスポンス確認＝IT-10通信） |

### §4.6 要実機（真の外部実応答/実タイムアウト/実POS連携のみ・3母集合行）

| C-ID | 前提/手順 | 期待結果（三段参照） | 外部依存の観測対象（観測不能な最終値） | 対応母集合 |
|---|---|---|---|---|
| C-R1 | 外部APIタイムアウト時の挙動 | 外部スマレジAPI呼出でタイムアウトした場合の期待結果 `[L1:A0102-014,016]`（設計mdは具体的タイムアウト時挙動/リトライを規定せず＝委譲。実HTTPクライアントのタイムアウト設定・実応答時間に依存）。※タイムアウトを例外/`statusCode=0`として注入した「失敗記録・FAILURE・DB非更新」のboundな近似はC-P2/C-11で担保。本行の逐語は**実タイムアウト時間そのもの** | **スマレジプラットフォームAPIの実タイムアウト**（実クライアント設定・実ネットワーク遅延に依存し決定的に再現不能） | -007（タイムアウト時） |
| C-R3 | 外部決済/実POS連携 正常系 | 外部側の登録/照会/決済等が成功した場合、外部側処理結果と自システム状態/金額/履歴/通知/画面表示が同一取引として整合すること `[L1:A0102-016]`（母集合実行方法=**手動**） | **スマレジ実POS/外部決済の実連携・実応答**（外部側で成立する結果を自社側で確定不能） | -025（正常系の結合確認・手動） |
| C-R4 | 外部決済/実POS連携 異常系 | 通信エラー/業務エラー/タイムアウト/外部側成功後の自システム更新失敗時に、二重反映（二重課金/二重返金）を起こさず利用者表示/ログ/通知/再実行可否が仕様通り `[L1:A0102-016,004]`（母集合実行方法=**手動**。二重反映防止のローカル部分はC-17/C-P1でboundだが、外部側成功後の自社更新失敗の整合は外部実応答依存） | **外部側成功後の自システム更新失敗の整合**（外部実応答が必要）。二重反映防止（`existsBy`/`isDuplicate`）はローカルでbound観測可だが、本行の逐語は外部実連携を主張 | -026（異常系の結合確認・手動） |

### §4.7 excluded（本機能に対応実挙動なし／条件偽・4母集合行・per-ID実引き）

| test_id | 期待テキスト要旨（前提列） | 除外理由（一次資料実引き） |
|---|---|---|
| -004 | 複数の単項目バリデーションをまとめて返却するWSでエラーが複数件すべて送出（前提=副作用） | 本機能は**フォーム集約バリデーション型WSでない**。Webhookは認証→ヘッダ必須→重複の順次ガードで最初の不成立で即応答（ee: WebhookController.php:52-89）、バッチは入力フォーム検証を持たない。複数エラー集約送出の対応実挙動なし。必須/検証系はC-05でbound |
| -005 | 複数の相関バリデーションをまとめて返却…すべて送出（前提=終了条件） | 同上（相関バリデーション集約WSが本機能に無い） |
| -006 | DBとの相関バリデーションを複数…すべて送出（前提=主データ） | 同上（DB相関バリデーション集約WSが本機能に無い）。DB既存判定（`existsBy`）は単一のスキップ判定でありエラー集約送出でない＝C-13/C-17でbound |
| -008 | バージョニングが行われている場合、バージョンに応じた実行結果（前提=DB関連実装確認値） | 条件節「バージョニングが行われている場合」が偽。Webhook受信/再連携バッチにAPIバージョニング機構は見当たらない（ee: WebhookController/BackfillActionにバージョン分岐なし）＝該当実挙動なし。断定回避（未探索領域の可能性は排除しない） |

**過剰除外でないことの傍証**: excluded 4件はいずれも(a)フォーム集約バリデーション型WSでないため複数エラー集約送出の
referentが無い（-004/-005/-006）／(b)バージョニング機構が本機能に無く条件偽（-008）を実引きで示す。各前提が指す実在挙動
（副作用・終了条件・主データ・DB確認値）は他候補（C-03/C-05/C-13/C-15/C-17）でbound化済み＝偽陰性なし。

---

## §5 レスポンス/文言・観測資源（実装照合）

本機能はEC本体の翻訳キー文言（購入完了系）を用いない。Webhook応答は**固定JSON**（英語メッセージ）で、ロケール依存しない:

| L1 | 応答/出力 | 実値（ee） | ee file:line |
|---|---|---|---|
| A0102-002 | 認証失敗 | `401` `{"status":"error","message":"Authentication failed"}` | WebhookController.php:61-64 |
| A0102-003 | ヘッダ欠落 | `400` `{"status":"error","message":"Smaregi-Event-Id header is required"}` | WebhookController.php:74-77 |
| A0102-004 | 重複 | `200` `{"status":"ok","message":"Event is duplicate"}` | WebhookController.php:85-88 |
| A0102-006 | 正常 | `200` `{"status":"ok"}` | WebhookController.php:107-109 |
| A0102-007 | 内部例外 | `500` `{"status":"error","message":"Error processing webhook"}` | WebhookController.php:117-120 |
| A0102-009 | バッチサマリ | 「スマレジ在庫変動再連携処理が完了しました。対象日=… 対象(商品×店舗)=…件 取得=…件 再連携(enqueue)=…件 スキップ=…件 失敗=…件」 | SmaregiStockBackfillCommand.php:68-84 |

- これらの応答文言は**ee実装の固定値**（英語・ロケール非依存）。設計md/Excelは応答本文の逐語を規定していない（md:42「成功・
  失敗の詳細は実装を正とする」）ため、**期待の逐語はee実装値を正**とする（新規実装routing）。将来仕様書側で応答形式が明文化
  された場合はそちらへ整合（§9 DOC-DRAFT⑤）。

---

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

- request契約:
  - Webhook受信=`POST /smaregi/webhook`（Playwright `request.post`）。ヘッダ=署名シークレット（`SMAREGI_WEBHOOK_SECRET_HEADER`）・
    `smaregi-event-id`・`Content-Type: application/json`。本文=JSON（contractId/event/action/…）。応答=HTTPステータス＋JSON本文。
  - バッチ=`eccube:smaregi:stock:backfill [target-date]`（コンソール起動）。観測=終了コード（SUCCESS=0/FAILURE!=0）＋標準出力サマリ。
  - **API/バッチboundの実走は、§2の共有隔離ハーネス（スマレジAPIテストダブル／Messenger in-memory+worker制御／Webhook secret env。
    現状未整備＝`@TBD(ハーネス)`）を前提とする。ハーネス未整備のため現時点で実走不可**。期待値は`o("L1-A0102-xxx")`（L1解決器）経由。
- db.ts（`e2e/helpers/db.ts`）: `dtb_smaregi_webhook_request`（status/started_at/completed_at）・`dtb_messenger_job`・
  `dtb_stock_history`（history_source_type=SMAREGI_SYNC/history_source_id）・`dtb_product_stock`（stock/total_cost・`unit_cost`は算出値で保存列でない）の
  S0取得・アサーション・raw SQL復元の専用便宜関数は**未実装**（実装waveで追加。対象・順序・SQL骨子は§2で特定済み＝配線のみ`@TBD-D5`）。
- UI観測: 管理画面Messengerダッシュボード（`admin_messenger`／`admin_messenger_webhooks`＝DashboardController.php:52,107）で
  受信履歴・ステータス集計・ジョブ一覧を観測。**このダッシュボードは`ROLE_SYSTEM`必須**（DashboardController.php:32）のため、
  UIケースは`ROLE_SYSTEM`保有の管理者をseedしてログインする。**Webhook一覧（`admin_messenger_webhooks`）は新着順ページングのみで`smaregi_event_id`列/絞込フォームを持たない**（webhook_list.twig:31）ため、
  対象行の特定は**seed直後に取得したWebhook ID（またはジョブID）で詳細画面（`admin_messenger_webhook_detail`）を直接開く**か、隔離DB前提で一覧先頭行/件数を検証する。
  在庫反映は商品在庫（ProductStock）一覧`admin_stock_list`（StockListController.php:94-98）で対象`ProductClass`を検索絞り込みして観測。
- **オラクル独立性**: 期待値は基本設計/設計md/観点表＋ee実装（新規実装routingで裏取り）。実装の不具合（設計との乖離）は
  期待値に流用せず§9 BC-DRAFTへ別掲（例: 5時間窓 vs target_date・区分ラベル「取引」vs「売上」・リトライ未実装）。

**_drafts/隔離lint証跡**: (1)正式消費側（`oracle.ts`/`db.ts`/既存spec/pages）に本書`_drafts`参照は作成していない。
(2)正式パス`e2e/fixtures/oracle/`直下・`integration_test/e2e/exec/`直下に本機能ファイルは作成していない。
(3)本md出力先は`_drafts/`配下のみ。

---

## §7 実行区分・両レイヤ属性（暫定・D14 v2合格前は正式会計に使わない）

| ケース群 | 実行区分（候補） | 観測層 | 備考 |
|---|---|---|---|
| C-01〜C-06 | Playwright `request`（HTTP） | API受信 | Webhook受信の認証/必須/重複/正常/異常/想定外項目。HTTPステータス＋JSON本文アサート |
| C-07〜C-13 | コンソール起動＋スタブAPI（隔離ハーネス前提）＋db.ts | バッチ/DB | 再連携バッチの正常/異常/形式不正/障害/データなし/部分失敗。終了コード＋サマリ＋DB（子ジョブ/履歴）アサート |
| C-14〜C-17 | 子ジョブ処理（worker起動 or Applier直接）＋db.ts＋管理画面 | バッチ/DB/UI | 区分整合・履歴・売上返品・重複冪等・受信履歴。在庫(ProductStock)/在庫履歴/受信履歴をDB＋管理画面で観測 |
| C-18,C-19 | 上記と同観測点（読替） | バッチ/DB | 外部取引→原価再計算・実数更新→在庫履歴反映 |
| C-P1,C-P2 | bound枝=db.ts＋管理画面（子ジョブFAILED/在庫ロールバック/FAILURE）／要実機枝=外部整合・実通信時間・リトライ通知未確定 | DB/UI/外部 | C-P1=子ジョブ部分更新防止bound・連携先整合要実機（親status非伝播はBC-DRAFT⑦）／C-P2=通信例外の失敗記録bound・実時間/リトライ通知要実機 |
| C-R1,C-R3,C-R4 | 要実機（実タイムアウト時間/実POS連携） | 外部 | -025/-026は母集合「手動」。実応答依存 |

聖域判定・多軸属性の正式付与はD14 v2合格後（本表は暫定）。

---

## §8 母集合29 全数会計（差分0・python検算済）

判定はすべて**期待テキスト実内容＋観点(IT-ID/中項目)**による。参照先の全候補行は§4に実体掲載済み。

### 集計

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound成功（API受信）** | **7** | Webhook受信HTTPで観測可（隔離ハーネス前提）。§4.1 |
| **bound成功（バッチ）** | **7** | コンソール起動＋スタブAPIで終了コード/サマリ/DB観測可（隔離ハーネス前提）。§4.2 |
| **bound成功（在庫DB効果）** | **4** | 子ジョブ処理後の在庫/在庫履歴/受信履歴をDB＋管理画面で観測可。§4.3 |
| **bound成功（読替）** | **2** | 数量・金額テンプレを在庫反映（原価再計算/在庫履歴）へ写像。§4.4 |
| **partial** | **2** | 自社DB観測部分（bound枝）と連携先スマレジ整合/実通信・リトライ通知未確定（要実機枝）を混在。§4.5 |
| **要実機** | **3** | 真の外部実タイムアウト/実POS連携（-025/-026は手動）。§4.6 |
| **excluded** | **4** | フォーム集約バリデーション型WSでない/バージョニング機構なし。§4.7 |
| **bound(EEドリフト)** | **0** | 設計記載の主要挙動は現EEに実装済み。乖離はBC-DRAFT（母集合行を失敗期待化しない） |
| 合計 | **29** | 欠落0・理由なし重複0 |

7+7+4+2+2+3+4=29（差分0）。python検算=欠番0/重複0/001..029全被覆・OK（`excel_to_html/.venv/bin/python`で実行確認）。

### 会計内訳（機械実証・再現用）

- bound成功API（7）: 001,002,003,021,022,023,027
- bound成功バッチ（7）: 015,016,018,019,020,024,029
- bound成功在庫DB（4）: 009,012,014,028
- bound成功読替（2）: 011,013
- partial（2）: 010,017
- 要実機（3）: 007,025,026
- excluded（4）: 004,005,006,008
- 7+7+4+2+2+3+4=29・差分0

### 29対応表（No→期待テキスト要旨→観点→会計→候補）

| No | 期待テキスト要旨 | 観点 | 会計 | 対応候補 |
|---|---|---|---|---|
| 001 | 資格情報の処理結果と一致（認証） | IT-32 資格情報 | bound(API) | C-01 |
| 002 | HTTPステータスの処理結果と一致 | IT-09 HTTPステータス | bound(API) | C-02 |
| 003 | 想定外項目を加えた結果が期待どおり | IT-32 リクエスト | bound(API) | C-03 |
| 004 | 複数の単項目バリを全送出 | IT-10 エラー | excluded | — |
| 005 | 複数の相関バリを全送出 | IT-10 エラー | excluded | — |
| 006 | DB相関バリを複数全送出 | IT-10 エラー | excluded | — |
| 007 | タイムアウト時に期待結果 | IT-10 エラー | 要実機 | C-R1 |
| 008 | バージョニングに応じた実行結果 | IT-32 バージョニング | excluded | — |
| 009 | 更新対象外の区分/数量が不変 | IT-33 区分整合 | bound(DB) | C-14 |
| 010 | 連携元・自・連携先で片側更新残さず整合 | IT-33 エラー | partial | C-P1 |
| 011 | 外部取引の加算・減算を仕様通り計算 | IT-33 外部取引 | bound(読替) | C-18 |
| 012 | 連携元ID付き履歴で加算金額を反映 | IT-33 自動加算 | bound(DB) | C-15 |
| 013 | 実数更新で対象区分の履歴へ反映 | IT-33 実数更新 | bound(読替) | C-19 |
| 014 | 売上で減算・返品で加算し戻す | IT-33 売上・返品 | bound(DB) | C-16 |
| 015 | 外部取得の処理結果と一致（バッチ） | IT-09 外部取得 | bound(バッチ) | C-07 |
| 016 | 200以外は保存せず異常系へ分岐 | IT-10 HTTPステータス | bound(バッチ) | C-08 |
| 017 | 通信例外時に停止せずリトライ/通知 | IT-10 通信 | partial | C-P2 |
| 018 | 正常受信/正常バッチの処理結果と一致 | IT-10 正常 | bound(バッチ) | C-09 |
| 019 | 形式不正を成功扱いせず分岐 | IT-10 形式不正 | bound(バッチ) | C-10 |
| 020 | 接続障害で未定義エラーにせず代替動作 | IT-10 障害 | bound(バッチ) | C-11 |
| 021 | 異常系の処理結果と一致 | IT-10 異常系 | bound(API) | C-04 |
| 022 | 必須条件の処理結果と一致 | IT-32 必須条件 | bound(API) | C-05 |
| 023 | レスポンスの処理結果と一致 | IT-32 レスポンス | bound(API) | C-06 |
| 024 | データなしの処理結果と一致 | IT-32 データなし | bound(バッチ) | C-12 |
| 025 | 外部決済成功時に同一取引で整合 | IT-10 正常系(手動) | 要実機 | C-R3 |
| 026 | 外部決済異常時に二重反映せず整合 | IT-10 異常系(手動) | 要実機 | C-R4 |
| 027 | 受信検証の処理結果と一致 | IT-32 受信検証 | bound(API) | C-05 |
| 028 | 対象データ更新/受信履歴の記録 | IT-10 重複・順序 | bound(DB) | C-17 |
| 029 | 転送先の成功/失敗/部分成功を区別し整合 | IT-10 部分失敗 | bound(バッチ) | C-13 |

`func_scope_check` 判定: 親29/29会計済み・欠落0・理由なし重複0。**差分0を本文内で実証可能**。O6は主張しない。

---

## §9 TBD・要実機・partial・excluded・BC-DRAFT（正直な分離）

### 要実機（母集合対応・3 test_id・§4.6）
-007（C-R1・実タイムアウト）・-025（C-R3・実POS/外部決済正常系・手動）・-026（C-R4・同異常系・手動）。
**外部スマレジ実応答/実POS連携が観測対象**で自社側で最終確定できない。スタブによる近似（非2xx/例外注入）はbound枠
（C-08/C-11/C-P2 bound枝）で別途担保するが、**実タイムアウト時間/実POS**の逐語は要実機。

### partial（母集合対応・2 test_id・§4.5）
-010（C-P1）: **子ジョブの部分更新防止（子`dtb_messenger_job`=FAILED・在庫/在庫履歴ロールバック）**はbound
（`SmaregiStockProcessMessageHandler.php:79-105`）、**連携先スマレジ側の整合**は外部実応答が必要＝要実機枝。なお親Webhook
イベントstatusは子失敗を伝播しない（BC-DRAFT⑦）。／-017（C-P2）: **通信例外/statusCode=0による失敗記録・終了FAILURE・
DB非更新**はbound（`SmaregiStockApiClient.php:208-223`・`SmaregiStockBackfillCommand.php:57-65`）、**実ネットワークの
タイムアウト時間＋「定められたリトライ・通知（エラーメール）」の未実装/仕様未確定**（BC-DRAFT④）は要実機枝。各1 test_id=1会計（partial）。

### インフラ水準の要実機・ハーネス前提（特定test_idに紐付かない・実装waveの前提事項）

| # | 事項 | 状態 |
|---|---|---|
| 0 | **共有隔離ハーネス（スマレジAPIテストダブル・Messenger in-memory+worker制御・Webhook secret env）** | API/バッチboundの実走前提。**現状ee側にE2E用は未整備＝`@TBD(ハーネス)`**。設計は§2に具体化。**現在形「実行可能」断定はしない** |
| 1 | スマレジプラットフォームAPIスタブ（在庫一覧/在庫変動履歴/トークン） | #0の一部。既知応答・非2xx・例外・0件を注入（`@TBD(ハーネス)`） |
| 2 | Messenger transport（in-memory・worker制御） | #0の一部。enqueue件数/`dtb_messenger_job`観測（子ジョブ実処理はworker明示起動時に評価）（`@TBD(ハーネス)`） |
| 3 | 破壊系S0のdb.ts配線 | 対象テーブル・削除/更新順序・条件付きDELETE/UPDATEは§2で特定済み＝配線のみ`@TBD-D5` |
| 4 | 受信履歴/在庫/在庫履歴のseed投入手順 | C-01〜C-17の前提。`@TBD-D5` |

### excluded（4件・§4.7で詳述・per-ID実引き）
-004,-005,-006,-008。理由=フォーム集約バリデーション型WSでない（複数エラー集約送出の対応挙動なし）／バージョニング機構なし。
各前提の実在挙動は他候補でbound化済み＝偽陰性なし。

### TBD（0件）
本機能は主要挙動がee実装で確定しており、母集合29行に非アサーション（「移行先で要確認であること」型）の期待テキストは無い。

### BC-DRAFT / DOC-DRAFT（設計（オラクル）と ee実装の乖離候補・**断定回避**）

**routing規律**: オラクルは基本設計/設計md/観点表（ee実装で裏取り）。以下はeeを観察した乖離候補で、テストは設計＋実装確定値で
書き、乖離は不具合/文書化候補として別掲する。断定は避ける。

| # | 設計（オラクル） | ee観察 | 乖離候補・区分 |
|---|---|---|---|
| ① | ★1「バッチ駆動時間から**5時間前まで**（X〜X-Y hours）の在庫変動履歴を取得」（md:128,147・Excel） | `SmaregiStockBackfillAction`は**対象日（target_date=1日単位）**で在庫変動履歴APIを問い合わせる（:65-69,176）。5時間窓（X-Y hours）でなく日次 | 取得期間の粒度差（5時間窓 vs 日次target_date）。取りこぼし/重複範囲に影響しうる。**BC-DRAFT（要確認）**。断定回避（Excelの可変期間実装＝運用設定で確定の余地・md:35） |
| ② | ★1 在庫変動区分「**02:取引**」もしくは「12:返品」（md:129,143・Excel） | Applierの反映対象区分は`02`=`DIVISION_SALES`（コメント「**02:売上**」）／`12`=`DIVISION_RETURN`（:35,45,48）。コード`02`は一致だがラベルが「取引」vs「売上」で相違 | 区分ラベルの表記差（コード02は一致）。**DOC-DRAFT（用語整合・要確認）**。反映挙動の判定はコード値`02`/`12`一致で成立 |
| ③ | リニューアル移行: 再連携の状態管理に`dtb_smaregi_webhook_request.status/started_at/completed_at`を用いる（md:35） | 再連携バッチ（`SmaregiStockBackfillAction`）は**`dtb_smaregi_webhook_request`を参照せず**、`dtb_stock_history.existsBySmaregiStockChangeId`（在庫履歴の存在）で未保存を判定して再連携する。`status`列は**Webhook受信処理**（`SmaregiWebhookEventMessageHandler`）のジョブ状態管理に使われる | 再連携の「未連携判定」方式が status列でなく在庫履歴存在ベース。設計の状態管理記述と実装の再連携判定基盤が異なる。**BC-DRAFT（要確認）**。断定回避（status列はWebhook側で実在・用途が異なるだけの可能性） |
| ④ | 例外処理: 外部連携失敗時は「実装側の**再連携・エラーログ・エラーメール・ステータス更新仕様**を正とする」（md:86）／観点492「定められたリトライ・通知」 | **HTTP通信リトライは実装済み**: `SmaregiGuzzleClientFactory`が429/5xx/接続失敗を最大3回（`MAX_RETRY_ATTEMPTS=3`・指数バックオフ/Retry-After）リトライする（SmaregiGuzzleClientFactory.php:32,39,55,112-116）。リトライ枯渇後はバッチが非2x/例外を`failed`計上＋ログ＋FAILURE終了（:183-194,209-219・Command:57-65）。一方で**エラーメール送信（通知）の実装は当該経路で未確認**（grep範囲で未検出） | HTTPリトライは実装確認済み＝観点492「リトライ」の一部は充足。ただし「通知（エラーメール）」のreferentは当該経路で未確認。-017（C-P2）の要実機枝は**(1)実ネットワークでの実リトライ挙動/実タイムアウト時間の観測＋(2)エラーメール通知の仕様/実装未確認**に限定される（HTTPリトライ回数・最終FAILUREはテストダブルでbound観測可）。**BC-DRAFT（要確認・通知のみ）**。断定回避 |
| ⑤ | Webhook応答本文/バッチ出力の逐語は設計/Excelで明文化なし（md:42「実装を正とする」） | 応答=固定英語JSON（WebhookController）／バッチサマリ=固定日本語文（Command:68-84）。加えて`WebhookController.php:106`「3秒以内に空のレスポンス」はコメントで、実際の応答は`{"status":"ok"}`（非空）・タイムアウト制御/時間計測なし | 応答形式・性能SLO（3秒）が設計書未記載かつ実装に計測なし。期待の逐語はee実装値を正とし、3秒はテスト層でアサートせず別途性能検証。**DOC-DRAFT** |
| ⑥ | 観点019テンプレ「（外部データが）JSON不正・必須キー欠落など利用不可なら成功扱いせず外部再取得/エラー表示へ分岐」 | 行レベルの非配列/`id`欠落・非数字は除外/スキップ（`SmaregiStockBackfillAction.php:271-285,230-235`）＝bound。しかしレスポンス**本文全体がJSONパース不能**な場合は`SmaregiStockApiClient::decodeJson`が`null`→`extractRows(null)`が空配列→`失敗0`のまま`SUCCESS`で**黙って0件扱い**（異常終了/エラー分岐なし） | 全体不正JSONを異常終了させる分岐が現EEに無い。C-10は行レベルのみboundとし、全体不正JSONの黙殺は**BC-DRAFT（要確認）**。断定回避（外部再取得/エラー分岐が別層に無いかは未探索余地） |
| ⑦ | 「連携元・自システム・連携先のいずれにも片側更新を残さず双方で整合」（母集合-010・観点） | 子ジョブ反映失敗は子`dtb_messenger_job`をFAILEDにし在庫/在庫履歴をrollback（`SmaregiStockProcessMessageHandler.php:79-105`）するが、親`dtb_smaregi_webhook_request.status`は子ジョブdispatch成功後に`completed`遷移済み（`SmaregiWebhookEventMessageHandler.php:104`）で**子失敗が親statusへ伝播しない**。親が`failed`になるのは親ハンドラ内dispatch自体の失敗時のみ（:109-131） | 親Webhookイベントと子ジョブの成否が非整合になり得る（子FAILEDでも親COMPLETED）。C-P1は子ジョブFAILED＋在庫ロールバックまでをboundとし、親子状態整合の設計期待との差は**BC-DRAFT（要確認）**。断定回避（親子整合の再集計を別バッチ/運用で担保する可能性） |

候補規律: 全行 `@TBD-D5`・O5未確定・実装/実走なし・O6/聖域/多軸/C6C7を主張しない。

---

## 付録: 作業実測

- 参照物: 基本設計（Excel抽出・設計md内details）／設計md 1／観点表 1／母集合スライス 1（29行）／先例 1（f04-04）／
  ee実装 約14（WebhookController・AuthenticationService・EventService・SmaregiWebhookEvent・SmaregiWebhookEventMessageHandler・
  SmaregiStockBackfillCommand・SmaregiStockBackfillAction・SmaregiStockProcessDispatcher・SmaregiStockChangeApplier・
  DtbStockHistoryRepository・SmaregiWebhookEventRepository・DashboardController・routes.yaml・eccube.yaml/services.yaml）。
- L1 claim数: **16確定・TBD 0**。候補ケース**24**（bound成功API 6〔C-01〜C-06〕・bound成功バッチ7〔C-07〜C-13〕・
  bound成功在庫DB 4〔C-14〜C-17〕・bound読替2〔C-18/C-19〕・partial 2〔C-P1/C-P2〕・要実機3〔C-R1/C-R3/C-R4〕）。
  母集合対応=bound成功API 7・bound成功バッチ7・bound成功在庫DB 4・bound読替2・partial 2・要実機3・excluded 4（差分0）。
- 両レイヤ分類: (a)API/統合＝Webhook受信HTTP（001/002/003/021/022/023/027）＋バッチ起動（015/016/018/019/020/024/029・
  partial017・要実機007/025/026）／(b)UI＝管理画面Messengerダッシュボードの受信履歴・ステータス（008/028）＋在庫(ProductStock)反映
  （009/012/014）。DB/ログのみ・スマレジ実POS実連携は要実機（§4.6）。
- **未検証事項（codexレビュー/実機で要確認）**: BC-DRAFT①〜⑦（特に③再連携判定基盤・④リトライ/通知の有無・⑥全体不正JSON黙殺・
  ⑦子失敗の親status非伝播）、隔離ハーネス
  （スマレジAPIスタブ・Messenger制御）の実配線（@TBD-D5）、子ジョブ処理後の在庫反映をworker起動で決定的に評価する手順。
  過剰主張なし・数値は実測・「見当たらない」は断定回避として記載。

# B0候補: m05-12 対応状況一括変更 — 実行可能グレード候補（母集合90全量踏破）

> 2026-07-23 ／ **候補グレード（candidate・D6前・O5未確定・実装/実走なし）**／ B0（具体化先行の量産・標準）。
> **codexレビュー: R1要修正（Blocker1＋Major2）→改訂1で是正・再確認待ち**:
> (1) **Blocker**: 状態遷移マトリクスに `cancel_return`（RETURNED(15)→DELIVERED(5)・
> order_state_machine.php:75-78）の見落とし→配送完了への遷移可能元を**11状態
> {1,2,3,4,6,9,10,12,13,14,15}** へ訂正（§3.1・L1-010・oracle JSON）。DOC-DRAFT-M05-12-01の結論
> （設計書の3状態限定は設定と矛盾）は不変・PENDING/PROCESSINGのfrom不出現も現物どおり維持。
> (2) **Major1**: 「本機能の変更は全てUPDATE／行追加経路なし」の一般主張を撤回（キャンセル遷移は
> StockReduceProcessor:140-153 の saveStockHistory で在庫履歴を**INSERT**する）。行数不変claimは
> `dtb_order`/`dtb_shipping` 2表限定で維持（L1-021/C-062妥当=codex確認）。EX-D根拠をケース別限定に
> 訂正・破壊系cleanup（副産物削除対象/復元順序/失敗時teardown）のD5契約を§2/§6に具体化。
> (3) **Major2**: BC-1影響bindの導出表を§9に掲載（**GUI専属20行＋GUI併用6行**。旧記載「17行」は
> 誤集計＝撤回）。excluded=29・BC-DRAFT-1/2・EX-A/EX-F/EX-D結論はcodex妥当確認済み=維持。
> source_class=standard-src+design は fid_kubun.tsv（D1・fid_kubun.tsv:256）による**暫定付与**（確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> fixture_version は全て `@TBD-D5`。統治: `integration_test/CONCRETIZATION_ROLLOUT_PLAN.md`（B0）＋
> `integration_test/CONCRETIZATION_FIRST_PLAN.md`（改訂2・三段会計）。
> 正典（型）: `integration_test/e2e/PILOT_m09_01_news_executable_grade.md`／同型見本:
> `_drafts/m10-11_admin_base_setting_setting_shop_order_status_executable_draft.md`・
> `_drafts/m05-16_admin_order_order_shop_memo_executable_draft.md`（codex承認済み候補）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m05-12_admin_order_order_bulk_status_change_oracle_draft.json`。
> **正式パス `e2e/fixtures/oracle/` 直下には書かない**。
> **最重要検出（本候補作成時の実ソース調査）**:
> - **BC-DRAFT-M05-12-01**: 設計書が規定する受注一覧の一括操作GUI（一括操作見出し・対応状況プルダウン
>   `#option_bulk_status`・決定ボタン・確認モーダルの一括起動＝BulkStatusUpdate）は、ee HEAD
>   （9dbc4dd）の `index.twig` から**コミット c51e2bda15（2026-07-09「一括操作ボタンを削除、メール通知等の
>   不要なボタンを削除」）で削除済み**。サーバ側エンドポイント（PUT）と行チェックボックスは現存。
>   期待値は仕様側のまま（ROLLOUT §7）。GUI系候補行は本BCの影響下（実走で×見込み）と明記。
> - **BC-DRAFT-M05-12-02**: 設計書「トークン不正→HTTP400」に対し、実装はトークン不正で
>   `AccessDeniedHttpException`（=HTTP 403系）をthrowし400を返さない（AbstractController.php:252-263）。
> - **DOC-DRAFT-M05-12-01**: 設計書md:144「配送完了へは新規受付・入金済み・対応中から遷移でき、
>   それ以外の対応状況からは遷移できない」は、設計書自身が確認値と宣言するワークフロー設定
>   （md:45,63,190）の `admin_to_delivered`（order_state_machine.php:161-174）と矛盾（設計自己矛盾）。
> **行数集計**: 候補ケース行総数**33**＝bound対応32（ja26＋-EN 6）＋補完1。
> 母集合90全数会計＝bound 61／TBD 0／excluded 29（§8）。

## §0 版固定

- 設計書正本: `functions/ec-cube-enterprise/m05-12_admin_order_order_bulk_status_change.md`（345行・
  最終コミット ea56f47・本repo HEAD d1e94c5。以下「md:行」）。
- ee `/home/y-saito/Developments/ec-cube-enterprise` コミット `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51`
  （W0/W1と同一）。GUI削除コミット `c51e2bda15e03ecd011c8cacc485658e2415ab81`（2026-07-09・HEAD祖先）。
- fid_kubun.tsv（D1・SHA先頭 `44fbf02f1e4c`）: `M05-12｜対応状況一括変更｜対象｜標準｜standard-src+design`
  （fid_kubun.tsv:256）→ **標準＝ee実ソース直接可＋設計書md**（暫定付与・確定はD6）。
- 母集合: baseline `integration_test/all_it_cases.tsv`（SHA先頭 `7911f190d273`）M05-12全**90行**
  （IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-001〜090。以下「-nnn」）。
- **判定原則（W0教訓1）**: 観点ラベル・前提/入力列はノイズ。bindは各行の**「期待結果」実テキスト**で判定
  （§8に全90行の期待要旨を併記し極性も期待テキストで確認）。
- 主要一次資料の略記:
  - Controller = `src/Eccube/Controller/Admin/Order/OrderController.php`（updateOrderStatus=483-571）
  - Abstract = `src/Eccube/Controller/AbstractController.php`（isTokenValid=252-263）
  - SM = `src/Eccube/Service/OrderStateMachine.php`
  - config = `app/config/eccube/packages/order_state_machine.php`（workflow `order` 全定義）
  - Stock = `src/Eccube/Service/PurchaseFlow/Processor/StockReduceProcessor.php`
  - Repo = `src/Eccube/Repository/OrderRepository.php`（updateOrderSummary=645-670）
  - twig = `src/Eccube/Resource/template/admin/Order/index.twig`（受注一覧・HEAD版）
  - cmJS = `src/Eccube/Resource/template/admin/Order/confirmationModal_js.twig`
    （**HEADの index.twig から include されない**＝grep 0件。shipping.twig:170 のみが include）
  - frame = `src/Eccube/Resource/template/admin/default_frame.twig`（csrf meta=16・ajaxSetup=81-88）
  - Entity = `src/Eccube/Entity/`（Shipping.php・Order.php・OrderItem.php・ProductClass.php・Master/OrderStatus.php）
  - ja/en = `src/Eccube/Resource/locale/messages.{ja,en}.yaml`
  - 削除diff = `git show c51e2bda15 -- src/Eccube/Resource/template/admin/Order/index.twig`（削除行の逐語）
- 既存資産（参考・変更なし）: `e2e/spec/admin/m05/m05_12_*.spec.ts`・`e2e/pages/admin/m05/m05_12_*.page.ts`
  （**旧twig行番号注記＝c51e2bda15以前の版**。`.btn-bulk-wrapper`/`#option_bulk_status`/`#btn_bulk_status` は
  HEADに不存在）・`integration_test/e2e/m05_12_*_e2e_cases.md`（実行実績: 2026-07-06 に 7〇/18×。
  **〇だったプルダウン系はGUI削除（2026-07-09）以前の実走**＝版差の傍証）・SEED-M05-ORDERS
  （`e2e/seed/sets/m05/SEED-M05-ORDERS.sql`・m05-01系共有シード。**本機能の破壊系では使わない**=§2）。

## §1 L1原子オラクル表

全31claim。en文言はen一次資料逐語（ja翻訳ゼロ）。BC/DOC印は§9に詳細。
期待値の正は本表のオラクルID（SEED値を期待の正にしない三段参照）。

| oracle_id | 観点 | claim | 逐語quote | 根拠(file:line) | LS |
|---|---|---|---|---|---|
| L1-M0512-001 | auth_rule | 未認証の GET `/%eccube_admin_route%/order` は admin firewall の form_login により admin_login のログイン画面へリダイレクト（受注一覧・一括変更とも利用不可） | `admin:`…`pattern: ['^/%eccube_admin_route%/',…]`…`login_path: admin_login`／「未認証｜利用不可。管理領域の認証要件によりログイン等へ誘導される。」 | security.yaml:40-47／md:79,287 | 0 |
| L1-M0512-002 | auth_rule | 更新エンドポイント（PUT）も `%eccube_admin_route%` 配下＝認証配下。未認証の直接呼出は処理されず、成功JSON（status OK）は返らない・DB不変（**具体応答形（302/401等）は未契約＝要実機。claimは「処理されない」に限定**） | 「管理側URLは%eccube_admin_route%配下として認証配下に置かれる。」／「非管理者・未認証｜…本操作も利用できない。」 | md:287,79／security.yaml:40-47 | 0 |
| L1-M0512-003 | http_status | エンドポイントは `PUT /%eccube_admin_route%/shipping/{id}/order_status`（route `admin_shipping_update_order_status`・id=数値=**出荷ID**・PUTのみ）。応答はJSON | `#[Route(path: '/%eccube_admin_route%/shipping/{id}/order_status', name: 'admin_shipping_update_order_status', requirements: ['id' => '\d+'], methods: ['PUT'])]`／「各更新エンドポイントのパスのidは出荷のIDである。受注のIDではない。」 | Controller:483-484／md:77,81 | 0 |
| L1-M0512-004 | api_contract | XHR でないリクエストは HTTP400 `{"status":"NG"}`（トークン検証前に短絡）・DB不変 | `if (!($request->isXmlHttpRequest() && $this->isTokenValid())) { return $this->json(['status' => 'NG'], 400); }`／「XHR以外のリクエスト、またはトークン不正｜当該出荷の更新は異常応答（HTTP400）となる。」 | Controller:486-488／md:208,120,318 | 0 |
| L1-M0512-005 | api_contract | CSRFトークンは `_token` パラメータ（Constant::TOKEN_NAME='_token'）または `ECCUBE-CSRF-TOKEN` ヘッダで供給（正規値は管理画面 `meta[name="eccube-csrf-token"]`）。**設計書はトークン不正→HTTP400と規定するが、実装は isTokenValid が false を返さず `AccessDeniedHttpException('CSRF token is invalid.')` をthrow（=400にならない）＝BC-DRAFT-M05-12-02**。期待値は仕様側（400・DB不変）のまま | `$token = $request->get(Constant::TOKEN_NAME) ?: $request->headers->get('ECCUBE-CSRF-TOKEN'); if (!$this->isCsrfTokenValid(Constant::TOKEN_NAME, $token)) { throw new AccessDeniedHttpException('CSRF token is invalid.'); }`／`public const TOKEN_NAME = '_token';`／`<meta name="eccube-csrf-token" content="{{ csrf_token(constant('Eccube\\Common\\Constant::TOKEN_NAME')) }}">` | Abstract:252-263／Constant.php:41／frame:16,81-88／md:120,208,318 | 0 |
| L1-M0512-006 | api_contract | 送信された `order_status` の対応状況IDが存在しないとき HTTP400 `{"status":"NG"}`・DB不変 | `$OrderStatus = $this->entityManager->find(OrderStatus::class, $request->get('order_status')); if (!$OrderStatus) { return $this->json(['status' => 'NG'], 400); }`／「変更先の対応状況IDが存在しない｜当該出荷の更新は異常応答（HTTP400）となり、結果一覧へシステムエラーを表示する。」 | Controller:491-495／md:205,319 | 0 |
| L1-M0512-007 | behavior | 受注の現在の対応状況＝変更先のときは変更せずスキップ: HTTP200 JSON `{"status":"OK","message":…}`・message=`admin.order.skip_change_status` ja「%name%: ステータス変更をスキップしました」／en "%name%: Status change has been skipped"（%name%=**出荷ID**）・DB不変 | `if ($Order->getOrderStatus()->getId() == $OrderStatus->getId()) { log_info('対応状況一括変更スキップ'); $result = ['message' => trans('admin.order.skip_change_status', ['%name%' => $Shipping->getId()])]; }`／`admin.order.skip_change_status: "%name%: ステータス変更をスキップしました"`／`"%name%: Status change has been skipped"` | Controller:499-501／ja:2610／en:2450／md:123,166,189,320 | 1 |
| L1-M0512-008 | behavior | 遷移不可の組合せは変更せず: HTTP200 JSON OK＋message=`admin.order.failed_to_change_status` ja「%name%: %from% から %to% にはステータス変更できません」／en "%name%: You are not allowed to change the status from %from% to %to%"（%name%=出荷ID・%from%/%to%=**mtb_order_status.name のDB現在値**）・DB不変 | `$from = $Order->getOrderStatus()->getName(); $to = $OrderStatus->getName(); $result = ['message' => trans('admin.order.failed_to_change_status', ['%name%' => …, '%from%' => $from, '%to%' => $to,])];`／`admin.order.failed_to_change_status: "%name%: %from% から %to% にはステータス変更できません"`／en:2445逐語 | Controller:552-560／ja:2608／en:2445／md:124,167,259,321 | 1 |
| L1-M0512-009 | state_machine | 遷移可否は Symfony workflow `order`（state_machine）の transitions 定義で決まる（`can`= enabled transition の to に変更先idが含まれるか）。**L1の遷移規則の正はこの設定**（設計書md:45,63,190が自らワークフロー設定を確認値と宣言） | `public function can(Order $Order, OrderStatus $OrderStatus, …): bool { return $this->getEnabledTransition(…) !== null; }`…`if (in_array($OrderStatus->getId(), $t->getTos())) { return $t; }`／「状態遷移の定義そのものの妥当性（ワークフロー定義はインフラ設定を確認値とする）」 | SM:57-85／config:19-217／md:45,63,190 | 0 |
| L1-M0512-010 | state_machine | 配送完了 DELIVERED(5) への遷移可能元＝`ship`(from 1,6,4)∪`admin_to_delivered`(from 1,2,6,9,10,13,14,12,3)∪`cancel_return`(from 15)＝**{1,2,3,4,6,9,10,12,13,14,15}（11状態）**。7(PENDING)・8(PROCESSING)からは不可。**md:144「新規受付・入金済み・対応中から…それ以外からは遷移できない」はこの設定と矛盾＝DOC-DRAFT-M05-12-01**（正は設定=md:45の自己宣言） | `'ship' => ['from' => [(string) Status::NEW, (string) Status::PAID, (string) Status::IN_PROGRESS], 'to' => [(string) Status::DELIVERED],]`／`'admin_to_delivered' => ['from' => [NEW,PAY_WAIT,PAID,PRE_DELIV,PICKING,PICKED,PASSED,OTC_RSV,CANCEL], 'to' => DELIVERED]`／`'cancel_return' => ['from' => (string) Status::RETURNED, 'to' => (string) Status::DELIVERED,]`（定数値=OrderStatus.php:31-57） | config:67-70,161-174,75-78／OrderStatus.php:31-57／md:144（矛盾側） | 0 |
| L1-M0512-011 | state_machine | 決済処理中 PENDING(7)・購入処理中 PROCESSING(8) は**どの transition の from にも現れない**＝これらを現在状況とする受注はいかなる変更先へも遷移不可（常に L1-008 の failed message） | config:46-214 の全 transitions に `(string) Status::PENDING`・`(string) Status::PROCESSING` が from として0出現（placesのみ=config:37-38。grep実測） | config:30-45,46-214／OrderStatus.php:43-45 | 0 |
| L1-M0512-012 | behavior | 変更先=配送完了(5)のとき、当該出荷が未出荷（`shipping_date IS NULL`＝`isShipped()`偽）なら出荷日に現在日時を設定 | `if ($OrderStatus->getId() == OrderStatus::DELIVERED) { if (!$Shipping->isShipped()) { $Shipping->setShippingDate(new \DateTime()); }`／`public function isShipped(): bool { return !is_null($this->shipping_date); }`／「配送完了で、当該出荷がまだ出荷済みでないか｜出荷済みでなければ、当該出荷に出荷日として現在日時を設定する。」 | Controller:504-507／Shipping.php:701-704,114-115／md:141,253 | 0 |
| L1-M0512-013 | behavior | 配送完了は**受注配下の全出荷が出荷済みのときのみ**受注へ適用（1件でも未出荷が残れば `dtb_order.order_status_id` は不変のままJSON OK） | `$allShipped = true; foreach ($Order->getShippings() as $Ship) { if (!$Ship->isShipped()) { $allShipped = false; break; } } if ($allShipped) { $this->orderStateMachine->apply($Order, $OrderStatus); }`／「全出荷が出荷済みのときのみ、受注へ配送完了を適用する。1件でも未出荷の出荷が残るときは受注の対応状況を配送完了に進めない。」 | Controller:508-517／md:142,191,206 | 0 |
| L1-M0512-014 | behavior | 変更先が配送完了以外で遷移可なら受注へ即適用 | `} else { $this->orderStateMachine->apply($Order, $OrderStatus); }`／「配送完了でなければ、受注へ変更先の対応状況を適用する。」 | Controller:518-520／md:140 | 0 |
| L1-M0512-015 | db_effect | apply 完了で `Order.OrderStatus` が変更先へ再設定され（workflow.order.completed→onCompleted）、persist/flush により `dtb_order.order_status_id`（JoinColumn）が変更先idへ更新される | `$CompletedOrderStatus = $this->orderStatusRepository->find($context->getStatus()); $Order->setOrderStatus($CompletedOrderStatus);`／`$this->entityManager->persist($Order); $this->entityManager->persist($Shipping); $this->entityManager->flush();`／`#[ORM\JoinColumn(name: 'order_status_id', referencedColumnName: 'id')]` | SM:187-194／Controller:542-544／Order.php:640-641／md:256,268 | 0 |
| L1-M0512-016 | db_effect | 一括変更は `notificationMail` を送信しない（BulkStatusUpdate の送信データは `{'order_status': …}` のみ）→サーバは `sendShippingNotifyMail` を呼ばず `dtb_shipping.mail_send_date` を更新しない・JSONに `"mail":false` | `if ($request->get('notificationMail')) { … } else { $result['mail'] = false; }`／`'data': {'order_status': $('#option_bulk_status').val()}`（notificationMail非含有）／`#[ORM\Column(name: 'mail_send_date', …, nullable: true)]`／「一括変更では送信データに出荷お知らせメールの送信指定を含めない。このためサーバ側ではメール送信を行わず、メール送信日も更新しない。」 | Controller:522-528／cmJS:162-170／Shipping.php:141-142／md:130,94,194,254 | 0 |
| L1-M0512-017 | db_effect | 変更先が対応中(4)/キャンセル(3)のとき、在庫無制限でない商品明細の `ProductClass`・`ProductStock` を persist/flush（商品情報更新） | `if ($OrderStatus->getId() == OrderStatus::IN_PROGRESS \|\| $OrderStatus->getId() == OrderStatus::CANCEL) { foreach ($Order->getOrderItems() as $OrderItem) { … if ($OrderItem->isProduct() && !$ProductClass->isStockUnlimited()) { …persist($ProductClass); …persist($ProductStock); …flush(); } } }`／「変更先が対応中またはキャンセルのとき、商品規格・在庫情報を更新する。」 | Controller:529-541／OrderItem.php:75-78／ProductClass.php:187-188／md:126,192 | 0 |
| L1-M0512-018 | db_effect | キャンセルへの遷移（`cancel`/`admin_cancel`）のtransitionリスナ=rollbackStock＋rollbackUsePoint。rollbackStock は在庫無制限でない明細の受注店舗対応 `dtb_product_stock.stock` を**明細数量ぶん加算**（bcadd） | `'workflow.order.transition.cancel' => [['rollbackStock'], ['rollbackUsePoint']], 'workflow.order.transition.admin_cancel' => [['rollbackStock'], ['rollbackUsePoint']],`／`$newStock = bcadd($currentStock, $quantity, 0);`…`$ProductStock->setStock($newStock);`／「在庫の戻し・引き当てが伴うため対象の商品規格・在庫情報を更新する。」 | SM:96-97,155-160／Stock:65-68,126-138／md:126,192 | 0 |
| L1-M0512-019 | db_effect | 受注に会員がひもづくとき、変更後に `updateOrderSummary` で `dtb_customer` の buy_times=対象受注COUNT・buy_total=対象受注SUM(total) を再計算（対象status={NEW(1),PAID(6),DELIVERED(5),IN_PROGRESS(4)}。集計対象外status（例: キャンセル3）へ抜けた受注は分母から外れる） | `if ($Customer = $Order->getCustomer()) { $this->orderRepository->updateOrderSummary($Customer); …flush(); }`／`updateOrderSummary(Customer $Customer, array $OrderStatuses = [OrderStatus::NEW, OrderStatus::PAID, OrderStatus::DELIVERED, OrderStatus::IN_PROGRESS])`…`COUNT(o.id) AS buy_times, SUM(o.total) AS buy_total` | Controller:546-551／Repo:645-670／md:127,193,220,257 | 0 |
| L1-M0512-020 | api_contract | 処理正常終了時のJSONは `{"status":"OK"}` にスキップ/遷移不可の `message`・`mail` を合成した形（HTTP200） | `return $this->json(array_merge(['status' => 'OK'], $result));`／「成功時はステータスOKのJSONを返す。スキップ・遷移不可時はOKに加えてメッセージを返す。」 | Controller:570／md:128,229,240 | 0 |
| L1-M0512-021 | db_effect | **`dtb_order`・`dtb_shipping` の2表に限定した行数不変**: updateOrderStatus本体はfind済み既存エンティティのみpersist（new生成なし=Controller:497-560実測）で両表へINSERT/DELETEしない。**「全変更UPDATE／行追加経路なし」の一般主張はしない**: キャンセル系遷移はリスナ経由で `StockReduceProcessor::saveStockHistory` が在庫履歴行を**INSERT**する（Stock:140-153。2表限定claimの外側・C-062は非キャンセル遷移で観測） | 「登録/更新｜dtb_order / dtb_shipping / mtb_order_status｜当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。」／`// 在庫履歴の作成 $this->saveStockHistory(…)` | Controller:497-560／Stock:140-153／md:264-268 | 0 |
| L1-M0512-022 | display_field | 受注一覧の各出荷行の**先頭セル**にチェックボックス `input#check_{出荷ID}`（`name="ids[]"`・`value={出荷ID}`・`data-id`・`data-order-id`・`data-update-status-url`=当該出荷の更新エンドポイントURL）が現存する（HEADで実在） | `<input type="checkbox" id="check_{{ Shipping.id }}" data-id="{{ Shipping.id }}" data-order-id="{{ Order.id }}" name="ids[]" value="{{ Shipping.id }}" … data-update-status-url="{{ url('admin_shipping_update_order_status', { id: Shipping.id}) }}"/>`／「一覧の各出荷行の左端にチェックボックスを表示する。」「チェックボックスの値は出荷のIDである。」 | twig:1196-1202／md:89,61,252 | 0 |
| L1-M0512-023 | display_field | ヘッダ全選択 `#toggle_check_all`（現存）: オンで全行チェック・オフで全解除。個別チェックの変更時は全選択チェックが外れる | `<input type="checkbox" id="toggle_check_all" name="filter" value="open">`／`$('#toggle_check_all').on('change', function() { var checked = $(this).prop('checked'); if (checked) { $('input[id^="check_"]').prop('checked', true); } else { …false); } });`／`$('input[id^="check_"]').on('change', function() { $('#toggle_check_all').prop('checked', false); });` | twig:1179,113-119,100-102／md:89,90 | 0 |
| L1-M0512-024 | display_field(BC-1) | 【仕様側期待・実装は削除済み】1件以上チェックで一括操作領域を表示（見出し `admin.common.bulk_actions` ja「一括操作」/en "All"・決定 `admin.common.decision` ja「決定」/en "Submit"）・0件で隠す。**ee HEADのindex.twigに該当要素0件**（c51e2bda15で `.btn-bulk-wrapper`・`#btn_bulk_status`・toggleBtnBulk 呼出を削除）＝BC-DRAFT-M05-12-01 | 削除diff逐語: `-<div class="col-auto d-none btn-bulk-wrapper"> -<label …>{{ 'admin.common.bulk_actions'\|trans }}…` `-<button type="button" id="btn_bulk_status" class="btn btn-ec-regular me-2 progressModal" data-type="status" data-bulk-update="true" …>{{ 'admin.common.decision'\|trans }}`／`admin.common.bulk_actions: 一括操作`・`All`／`admin.common.decision: 決定`・`Submit`／「1件以上チェックすると一括操作の領域が表示される。」 | 削除diff（c51e2bda15）／ja:1722,1645／en:1750,1676／md:75,89,90,152-156,201 | 1 |
| L1-M0512-025 | display_field(BC-1) | 【仕様側期待・実装は削除済み】対応状況プルダウン `#option_bulk_status`: 初期行 value=""=`admin.order.change_status` ja「対応状況の変更」/en "Update Status"・続けて登録済み対応状況を並び順（sort_no）で列挙。HEADに要素0件（同BC-1） | 削除diff逐語: `-<select class="form-select" id="option_bulk_status"> -<option value="" selected>{{ 'admin.order.change_status'\|trans }}</option> -{% for status in OrderStatuses %} -<option value="{{ status.id }}">{{ status.name }}</option>`／`admin.order.change_status: 対応状況の変更`・`Update Status` | 削除diff（c51e2bda15）／ja:2572／en:2409／md:62,89,155,260 | 1 |
| L1-M0512-026 | behavior(BC-1) | 【仕様側期待・現行導線なし】変更先未選択のまま決定→ブラウザ標準アラート「対応状況を選択してください」（**スクリプト直書き・enロケール資源なし**）を出しサーバへ送信せず中断。cmJSに実装は現存するがHEADのindex.twigがincludeしない＝発火導線なし（同BC-1） | `if (type == 'status' && eventTarget.data('bulk-update') && $('#option_bulk_status').val() === '') { alert('対応状況を選択してください'); return; }`／「対応状況を選択してください｜-｜変更先プルダウンが未選択のまま決定ボタンを押したとき｜ブラウザ標準のアラート｜サーバへ送信せず中断する。スクリプト直書きの文言で英語ロケール資源を持たない。」 | cmJS:46-49／md:91,165,202,301,317 | 0 |
| L1-M0512-027 | display_field(BC-1) | 【仕様側期待・現行導線なし】確認モーダル `#sentUpdateModal`（markupはHEADに現存=twig:1291-1327）: 送信中は本文 `admin.order.bulk_action__in_progress_message` ja「処理中...」/en "Processing ..."＋進捗バー表示、全件終了で進捗バーを隠し本文 `admin.order.bulk_action__complete_message` ja「完了しました。」/en "Completed."＋閉じるボタン `#bulkChangeComplete`=`admin.common.close` ja「閉じる」/en "Close" を表示。**index.twigにcmJSのinclude 0件＝ボタン群にバインドなし**（同BC-1） | `$('.modal-body > p.modal-message', modal).text("{{ 'admin.order.bulk_action__in_progress_message'\|trans }}"); …$('.progress', modal).show();`／`$('.progress', this.modal).hide(); …text("{{ 'admin.order.bulk_action__complete_message'\|trans }}"); $('#bulkChangeComplete').show();`／ja:2562「処理中...」2563「完了しました。」1643「閉じる」／en:2399,2400,1674 | cmJS:66-69,119-123／twig:1291-1327／ja:2562,2563,1643／en:2399,2400,1674／md:64,91,93,96,157-159 | 1 |
| L1-M0512-028 | behavior(BC-1) | 【仕様側期待・現行導線なし】一括送信は `input[data-id]:checked` の集合を対象に、各出荷の `data-update-status-url` へ `{'order_status': 選択値}` のみを1件ずつPUTし、**1件の応答完了後に次の1件を送る逐次処理**（同期直列・在庫/ポイント整合のため） | `getTotalCount: … return $('input[data-id]:checked').length;`／`$('input[data-id]:checked').each(function () { statuses.push({'url': $(this).data('update-status-url'), 'data': {'order_status': $('#option_bulk_status').val()}}); }); // ポイントや在庫の加算・減算は非同期で実行できないため、同期処理で実行 var callback = function () { var status = statuses.shift(); …done(function () { if (statuses.length) { callback(); } })`／「1件の応答が返ってから次の1件を送る逐次処理とする。」 | cmJS:157-186,124-140／md:92,112-113,65,218 | 0 |
| L1-M0512-029 | display_field(BC-1) | 【仕様側期待・現行導線なし】応答に `message` があれば結果一覧 `#sentUpdateModal #bulkErrors` へ **NOTICE** として追記（スキップ/遷移不可）。HTTP失敗（400/500系）は **ERROR**「`admin.common.system_error`」ja「システムエラーが発生しました」/en "System error occurred" を追記し、他出荷の処理は続行 | `if (result['message']) { $('<li><span class="badge bg-warning">NOTICE</span> </li>').append($('<span></span>').text(result['message'])).appendTo('#bulkErrors'); }`／`fail: … $('<li><span class="badge bg-danger">ERROR</span> </li>').append($('<span></span>').text("{{ 'admin.common.system_error'\|trans }}")).appendTo('#bulkErrors');`／ja:1607／en:1653 | cmJS:103-118／ja:1607／en:1653／md:114,168,178-179,203-204 | 1 |
| L1-M0512-030 | nav | 閉じるボタンは受注一覧 `GET /%eccube_admin_route%/order?resume=1` へ戻る（旧実装削除diff逐語）。**resume=1 のセッション復旧（検索条件・ページ番号・表示件数）はサーバ側に現存**（HEADで有効） | 削除diff: `-$('#bulkChangeComplete').on('click', function() { -location.href = '{{ url('admin_order', { 'resume': 1 }) }}';`／「クエリパラメータでresume=1が指定された場合、検索条件, ページ番号, 表示件数をセッションから復旧します.」／`if (null !== $page_no \|\| $request->get('resume')) { /* …セッションから検索条件を復旧する. */` | 削除diff（c51e2bda15）／Controller:121,212-215／md:78,116,300,307 | 0 |
| L1-M0512-031 | db_effect | 一括は出荷ごとに独立確定（単一トランザクションでまとめてロールバックしない）。一部の出荷がスキップ・遷移不可・エラーでも他の出荷の変更は確定する | 「一部の出荷がスキップ・遷移不可・エラーでも、他の出荷の変更は確定する。一括全体を一つのトランザクションでまとめてロールバックはしない。」／各PUTは独立リクエスト（L1-028の逐次送信＋Controller:483-571の単発処理） | md:221,179,345／cmJS:171-184 | 0 |

## §2 SEED三段参照設計（全て `@TBD-D5`・**破壊系の使い捨て隔離＋復元**）

期待値の正は**L1オラクルID**（三段参照: 期待=L1→前提状態=SEED→実測=db.ts観測値）。
本機能は **`dtb_order.order_status_id`・`dtb_shipping.shipping_date`・`dtb_product_stock.stock`・
`dtb_customer.buy_times/buy_total` を更新する破壊的操作**。次を厳守する:

1. **書込対象は専用の使い捨てSEED帯のみ**（新設 SEED-M05-12-*・id帯9000012xx）。共有シード
   SEED-M05-ORDERS（900000311-350・m05-01一覧系が消費）と**帯を分離**し、共有帯・実データには書かない。
2. **afterEach/teardownでSEED再適用（UPSERT）＋副産物削除**で初期状態へ復元する。主対象の
   `dtb_order.order_status_id`・`dtb_shipping.shipping_date/mail_send_date`・
   `dtb_product_stock.stock`・`dtb_customer.buy_times/buy_total` はUPDATEのみのためUPSERT再適用で
   戻る。**ただし「本機能の変更は全てUPDATE」ではない**: キャンセル系遷移は
   `StockReduceProcessor::saveStockHistory`（Stock:140-153）が**在庫履歴行をINSERT**する（C-044/045で
   発生）→UPSERT復元だけでは不十分。**D5 manifestで次を契約**（`@TBD-D5`）:
   (a) **削除対象の特定**=在庫履歴等の副産物行をSEED帯キー（product_class_id=900001232・
   受注ID帯9000012xx）÷実行run-idで特定するDELETE条件
   (b) **復元順序**=①副産物行DELETE→②dtb_product_stock UPSERT→③dtb_order/dtb_shipping UPSERT→
   ④dtb_customer UPSERT（FK依存順・履歴を先に消してから在庫値を戻す）
   (c) **失敗時cleanup**=テスト失敗・中断時も必ず走るteardownで(a)(b)を実行し、適用後に
   検証クエリ（帯行の初期値一致・副産物0件）でズレを検知する。
3. 共有環境では実行しない（フレッシュDB/serial前提。`e2e-standard-run-requirements` 準拠）。

| SEEDセットID | 内容（初期値） | 用途 |
|---|---|---|
| SEED-M01-ADMIN | 管理者ログイン（共通） | 全ケースの認証 |
| SEED-M05-12-PRODUCT | 商品帯: dtb_product 900001231／dtb_product_class 900001232（`stock_unlimited=false`）／dtb_product_stock 900001233（stock=50・**受注店舗のbase_infoに対応する在庫**=StockReduceProcessorはgetProductStockByEccube(BaseInfo)で引くため店舗対応必須〔Stock:91〕） | C-044在庫戻し |
| SEED-M05-12-ORDERS | 使い捨て受注帯（order_no接頭辞 `E2E-M0512-`）: **ORD-NEW**=dtb_order 900001211（order_status_id=1・customer_id=900001201・明細→900001232 qty=2・出荷 dtb_shipping 900001221 shipping_date=NULL, mail_send_date=NULL）／**ORD-PENDING**=900001212（order_status_id=7・出荷900001222）／**ORD-MULTI**=900001213（order_status_id=1・出荷900001223と900001224、とも shipping_date=NULL）。会員 dtb_customer 900001201（buy_times/buy_totalはSEED適用時にORD群と整合する初期値をD5で確定）。受注のNOT NULL/FK完全行セット（pref/country等はSEED-M05-ORDERSの実在様式を踏襲）は**D5 manifest契約で確定**（ここではセット設計のみ・捏造しない） | 遷移系・skip・400系・配送完了系・会員集計 |

- **期待値にSEED初期値を使わない**: 遷移後の期待は L1-009〜015（遷移規則・適用規則）から導出し、
  SEED初期statusはあくまで前提状態。message中の状況名（%from%/%to%）は**db.tsで読んだ
  mtb_order_status.name のDB現在値**を埋め込む（L1-008。名称マスタはインストール経路で異なる:
  import_csv=旧名8行〔mtb_order_status.csv〕vs migrations=注文受領/出荷完了ほか
  〔Version20251125150428・Version20260220000001:47-50〕→名称リテラルを期待に焼き込まない）。
- GUI系ケース（BC-1影響下）が実走可能になった場合も、選択対象は本帯の出荷行に限定する
  （全選択チェック使用ケースは検索で `E2E-M0512-` に絞ってから操作する）。

## §3 状態遷移マトリクス・一括選択マトリクス

### §3.1 状態遷移マトリクス（正=order_state_machine.php。DOC-DRAFT-M05-12-01参照）

変更先（to）ごとの遷移可能元（from・id表記。名称はDB照会値=§2）:

| to | 遷移可能な from | transition名（config行） |
|---|---|---|
| 1 NEW | 2,3,5,6,9,10,12,13,14 | admin_to_new（79-92） |
| 2 PAY_WAIT | 1,3,5,6,9,10,12,13,14 | admin_to_pay_wait（93-106） |
| 3 CANCEL | 1,4,6（cancel・59-62）＋1,2,5,6,9,10,12,13,14（admin_cancel・200-213） | cancel／admin_cancel |
| 4 IN_PROGRESS | 1,6（packing・55-58）＋3（back_to_in_progress・63-66） | packing／back_to_in_progress |
| 5 DELIVERED | 1,4,6（ship・67-70）＋1,2,3,6,9,10,12,13,14（admin_to_delivered・161-174）＋**15（cancel_return・75-78）**＝有効from **{1,2,3,4,6,9,10,12,13,14,15}（11状態）** | ship／admin_to_delivered／cancel_return |
| 6 PAID | 1（pay・47-50）＋2（paywait・51-54）＋1,2,3,5,9,10,12,13,14（admin_to_paid・107-120） | pay／paywait／admin_to_paid |
| 9 PRE_DELIV | 2,3,5,6,10,12,13,14 | admin_to_pre_deliv（121-133） |
| 10 PICKING | 2,3,5,6,9,12,13,14 | admin_to_picking（134-146） |
| 12 OTC_RSV | 3,5,9,10,13,14 | admin_to_otc_rsv（189-199） |
| 13 PICKED | 1,2,3,5,6,9,10,12,14 | admin_to_picked（147-160） |
| 14 PASSED | 1,2,3,5,6,9,10,12,13 | admin_to_passed（175-188） |
| 15 RETURNED | 5 | return（71-74） |
| 7 PENDING／8 PROCESSING | **到達不可**（toに現れない） | — |
| from 7・from 8 | **全変更先へ遷移不可**（fromに現れない=L1-011） | — |

- 同一idへの変更は遷移判定前にスキップ（L1-007）。キャンセル系遷移のみ在庫/ポイント戻しリスナ
  （L1-018）、back_to_in_progress は commitStock/commitUsePoint（SM:98）、cancel_return（15→5）は
  commitUsePoint/commitAddPoint（SM:101）。
- 候補ケースの代表遷移: **許可**=1→6（pay）・**禁止**=7→6（from 7 遷移0件）・**配送完了**=1→5。

### §3.2 一括選択マトリクス（選択パターン→観測。GUI起動系はBC-1影響下）

| 選択 | 変更先 | 期待観測（L1） | ケース |
|---|---|---|---|
| 1件（ORD-NEW出荷） | 6（許可） | JSON OK・order_status_id 1→6・逐次1件 | C-040 |
| 1件（ORD-PENDING出荷） | 6（禁止） | JSON OK+failed message・DB不変 | C-041 |
| 1件（ORD-NEW出荷） | 1（同一） | JSON OK+skip message・DB不変 | C-047 |
| 1件（単一出荷受注） | 5 | shipping_date設定＋受注5へ | C-042 |
| 複数出荷受注の1件のみ | 5 | 当該出荷のみshipping_date・受注不変→残出荷も送ると受注5へ | C-043 |
| 混在（成功＋禁止/同一） | 同一変更先 | NOTICE追記・他出荷は確定（部分失敗continue） | C-028(GUI)／C-040+C-041+C-047(非UIで等価) |
| 0件 | — | 一括操作領域が隠れる（BC-1） | C-025 |

## §4 実行可能グレード14列TSV（候補・**自己完結＝全33行を実体掲載**）

- 期待値の正は `[L1:...]`（§1）。fixtureは `@TBD-D5`。URLの `%eccube_admin_route%` は環境値。
- request契約は§6.1（PUT・XHRヘッダ・`ECCUBE-CSRF-TOKEN`ヘッダ or `_token`・body `order_status=<id>`）。
- **（BC-1）印の行は BC-DRAFT-M05-12-01 の影響下＝ee HEADでは対象GUI要素が存在せず実走×見込み**
  （期待は仕様側のまま維持。裁定=codex/発注者）。破壊系は§2の使い捨てSEED帯＋afterEach復元前提。

### §4.1 bound対応候補行（32行=ja26＋-EN6。§8の90対応表が参照する全行）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-001	IT-15	権限	P1	未認証で受注一覧URLへ直接アクセス→ログイン画面へリダイレクト	未ログイン	—	1. GET /%eccube_admin_route%/order	admin_login のログイン画面へリダイレクトされ受注一覧（一括変更の入口）へ到達しない [L1:L1-M0512-001]				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-002	IT-15	権限	P1	未認証で更新エンドポイントへ直接PUT→処理されない（非UI）	未ログイン／SEED-M05-12-ORDERS	§6.1契約: 認証Cookieなしで PUT /shipping/900001221/order_status（order_status=6）	1. 未認証セッションでPUT送信 2. 応答bodyを読む 3. db.tsで order_status_id 照会	応答は `{"status":"OK"}` 形にならず（認証配下＝処理されない。具体応答形は要実機=§9）・dtb_order.order_status_id=1 のまま不変 [L1:L1-M0512-002; fixture:SEED-M05-12-ORDERS@TBD-D5]				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-010	IT-25	表示	P1	受注一覧に出荷行チェックボックス（行先頭セル）とヘッダ全選択が表示される	ログイン済(SEED-M01-ADMIN)／SEED-M05-12-ORDERS	検索で E2E-M0512- に絞る	1. 受注一覧を開き対象行を表示 2. 各行先頭セルの input[id^="check_"] と #toggle_check_all の存在を読む	各出荷行の先頭セルにチェックボックス・ヘッダに全選択チェックボックスが表示され、一覧はエラーなく表示される [L1:L1-M0512-022,L1-M0512-023; fixture:SEED-M05-12-ORDERS@TBD-D5]				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-011	IT-25	属性	P1	チェックボックスは出荷単位（value=出荷ID・data-update-status-url=出荷IDのエンドポイント）	ログイン済／SEED-M05-12-ORDERS	—	1. 受注一覧で帯出荷行（id=900001221）の checkbox 属性を読む	input#check_900001221 の value="900001221"（出荷ID・受注IDでない）・name="ids[]"・data-update-status-url が /%eccube_admin_route%/shipping/900001221/order_status を指す [L1:L1-M0512-022,L1-M0512-003; fixture:SEED-M05-12-ORDERS@TBD-D5]				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-040	IT-26	更新成功	P1	許可遷移（1→6）のPUTでJSON OK・dtb_order.order_status_idが変更先へ更新	ログイン済セッション／SEED-M05-12-ORDERS(ORD-NEW=1)	§6.1契約: XHR+正規token・PUT /shipping/900001221/order_status body order_status=6	1. db.tsで更新前 order_status_id=1 を確認 2. PUT送信 3. 応答JSONを読む 4. db.tsで再照会（afterEach: SEED再適用）	HTTP200 `{"status":"OK","mail":false}`＋dtb_order.order_status_id（id=900001211）=6（遷移規則=§3.1 pay。エラー表示なく継続） [L1:L1-M0512-020,L1-M0512-014,L1-M0512-015,L1-M0512-009,L1-M0512-016; fixture:SEED-M05-12-ORDERS@TBD-D5]				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-041	IT-22	遷移不可	P1	禁止遷移（7→6）はOK+failedメッセージ・DB不変（ja）	ログイン済セッション／SEED-M05-12-ORDERS(ORD-PENDING=7)	XHR+正規token・PUT /shipping/900001222/order_status body order_status=6	1. db.tsで mtb_order_status.name(id=7)=FROM名・name(id=6)=TO名 を取得 2. PUT送信 3. 応答JSON message を読む 4. db.tsで order_status_id 照会	HTTP200 OK＋message=「900001222: <FROM名> から <TO名> にはステータス変更できません」（%from%/%to%=DB名の埋込・完全一致）・order_status_id=7 のまま不変（from7の遷移は0件=§3.1） [L1:L1-M0512-008,L1-M0512-011,L1-M0512-009; fixture:SEED-M05-12-ORDERS@TBD-D5]				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-041-EN	IT-22	遷移不可	P2	failedメッセージ（en）	ログイン済（en管理UIセッション）／SEED-M05-12-ORDERS	同上	同上	message="900001222: You are not allowed to change the status from <FROM名> to <TO名>"（枠文言=en逐語） [L1:L1-M0512-008]				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-042	IT-26	配送完了	P1	単一出荷受注へ5: 出荷日設定＋受注が配送完了へ	ログイン済セッション／SEED-M05-12-ORDERS(ORD-NEW: 出荷900001221 shipping_date=NULL)	XHR+正規token・PUT /shipping/900001221/order_status body order_status=5	1. db.tsでT1=now()記録・shipping_date IS NULL確認 2. PUT送信 3. db.tsでT2=now()・shipping_date・order_status_id照会（afterEach: SEED再適用）	JSON OK＋dtb_shipping.shipping_date が T1≦値≦T2 に設定＋全出荷（1件）出荷済みのため dtb_order.order_status_id=5 [L1:L1-M0512-012,L1-M0512-013,L1-M0512-010,L1-M0512-015; fixture:SEED-M05-12-ORDERS@TBD-D5]				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-043	IT-26	配送完了	P1	複数出荷の一部のみ5: 受注は進まず、残出荷送信で受注が5へ（逐次完了）	ログイン済セッション／SEED-M05-12-ORDERS(ORD-MULTI: 出荷900001223/900001224とも未出荷)	XHR+正規token・PUT order_status=5 を 900001223→900001224 の順に2回	1. PUT(900001223)送信 2. db.tsで 900001223.shipping_date設定済み・900001224 IS NULL・order_status_id=1不変を照会 3. PUT(900001224)送信 4. db.tsで order_status_id 再照会（afterEach: SEED再適用）	1回目: 当該出荷のみ出荷日設定・未出荷が残るため受注は5へ進まない（order_status_id=1不変）。2回目: 全出荷出荷済みとなり order_status_id=5（全出荷済み時点の出荷で進む） [L1:L1-M0512-013,L1-M0512-012,L1-M0512-031; fixture:SEED-M05-12-ORDERS@TBD-D5]				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-044	IT-22	在庫戻し	P1	キャンセル(3)への変更で在庫無制限でない明細の在庫が数量ぶん加算される	ログイン済セッション／SEED-M05-12-ORDERS(ORD-NEW qty=2)＋SEED-M05-12-PRODUCT(stock=50)	XHR+正規token・PUT /shipping/900001221/order_status body order_status=3	1. db.tsで dtb_product_stock.stock(900001233)=50 を確認 2. PUT送信 3. db.tsで stock・order_status_id 照会（afterEach: SEED再適用＋在庫履歴等の副産物掃除=@TBD-D5）	JSON OK＋order_status_id=3（§3.1 cancel: from1可）＋stock=52（50+明細qty2=bcadd加算・rollbackStock） [L1:L1-M0512-017,L1-M0512-018,L1-M0512-015; fixture:SEED-M05-12-ORDERS@TBD-D5,SEED-M05-12-PRODUCT@TBD-D5]				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-045	IT-28	会員集計	P2	会員受注の変更後にbuy_times/buy_totalが再計算される	ログイン済セッション／SEED-M05-12-ORDERS(ORD-NEW: customer=900001201)	XHR+正規token・PUT /shipping/900001221/order_status body order_status=3（集計対象status{1,6,5,4}外へ）	1. db.tsで dtb_customer(900001201) の buy_times/buy_total と対象status受注の COUNT/SUM(total) を記録 2. PUT送信 3. db.tsで再照会（afterEach: SEED再適用）	キャンセルへ抜けた受注が集計から外れ、buy_times=変更後の対象status{1,6,5,4}受注COUNT・buy_total=同SUM(total) と一致（updateOrderSummaryの再計算） [L1:L1-M0512-019; fixture:SEED-M05-12-ORDERS@TBD-D5]				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-046	IT-26	メール非送信	P1	notificationMailなしのPUTはmail:false・mail_send_date不変	ログイン済セッション／SEED-M05-12-ORDERS(ORD-NEW: mail_send_date=NULL)	XHR+正規token・PUT /shipping/900001221/order_status body order_status=6（notificationMail非含有=一括契約） 	1. PUT送信 2. 応答JSONの mail を読む 3. db.tsで mail_send_date 照会（afterEach: SEED再適用）	JSON `"mail":false`＋dtb_shipping.mail_send_date=NULL のまま不変（一括はメールを送らない） [L1:L1-M0512-016; fixture:SEED-M05-12-ORDERS@TBD-D5]				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-047	IT-22	同一スキップ	P1	現在と同一の変更先はスキップ: OK+skipメッセージ・DB不変（ja）	ログイン済セッション／SEED-M05-12-ORDERS(ORD-NEW=1)	XHR+正規token・PUT /shipping/900001221/order_status body order_status=1	1. PUT送信 2. 応答JSON message を読む 3. db.tsで order_status_id 照会	HTTP200 OK＋message=「900001221: ステータス変更をスキップしました」（%name%=出荷ID・完全一致）・order_status_id=1 不変 [L1:L1-M0512-007; fixture:SEED-M05-12-ORDERS@TBD-D5]				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-047-EN	IT-22	同一スキップ	P2	skipメッセージ（en）	ログイン済（en管理UIセッション）／SEED-M05-12-ORDERS	同上	同上	message="900001221: Status change has been skipped" [L1:L1-M0512-007]				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-050	IT-33	request契約	P1	送信契約=出荷IDパスと order_status のみ（XHR・PUT・JSON応答）	ログイン済セッション／SEED-M05-12-ORDERS	§6.1契約全文	1. C-040と同契約でPUT 2. 応答Content-TypeとJSON形を読む	出荷IDごとのURL（/shipping/{出荷ID}/order_status）に対し order_status（変更先ID）のみで処理が成立し、JSON（statusキー）が返る [L1:L1-M0512-003,L1-M0512-020,L1-M0512-028; fixture:SEED-M05-12-ORDERS@TBD-D5]（GUI側の同契約送信はBC-1=C-022）				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-060	IT-15	XHR要件	P1	XHRでないPUTはHTTP400 NG・DB不変（非UI）	ログイン済セッション／SEED-M05-12-ORDERS	正規token同梱・X-Requested-Withヘッダ**なし**で PUT body order_status=6	1. PUT送信 2. HTTP statusとbodyを読む 3. db.tsで order_status_id 照会	HTTP400 `{"status":"NG"}`・order_status_id=1 不変 [L1:L1-M0512-004; fixture:SEED-M05-12-ORDERS@TBD-D5]				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-060B	IT-15	CSRF	P1	トークン不正のXHR PUTは異常応答・DB不変（仕様=400。実装は403系throw=BC-2）	ログイン済セッション／SEED-M05-12-ORDERS	XHR・ECCUBE-CSRF-TOKENヘッダ=正規値の末尾1文字置換・PUT body order_status=6	1. PUT送信 2. HTTP statusを読む 3. db.tsで order_status_id 照会	【仕様側期待】HTTP400の異常応答・order_status_id不変 [L1:L1-M0512-005]。【実装検出】isTokenValidはAccessDeniedHttpExceptionをthrow（400を返す分岐なし）＝**BC-DRAFT-M05-12-02**（実観測はHTTP403系見込み・要実機確定=§9。DB不変はいずれでも成立） [fixture:SEED-M05-12-ORDERS@TBD-D5]				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-061	IT-22	不存在ID	P1	不存在の対応状況IDはHTTP400 NG・DB不変（非UI）	ログイン済セッション／SEED-M05-12-ORDERS	XHR+正規token・PUT body order_status=99999	1. db.tsで SELECT COUNT(*) FROM mtb_order_status WHERE id=99999 が0を確認 2. PUT送信 3. HTTP status/body 4. db.tsで order_status_id 照会	HTTP400 `{"status":"NG"}`・order_status_id=1 不変（DBに存在しないIDは引当失敗） [L1:L1-M0512-006; fixture:SEED-M05-12-ORDERS@TBD-D5]				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-062	IT-26	行数不変	P1	変更成功してもdtb_order/dtb_shippingの行数は不変（INSERT/DELETEなし）	ログイン済セッション／SEED-M05-12-ORDERS	XHR+正規token・PUT /shipping/900001221/order_status body order_status=6	1. db.tsで両表のCOUNT(*)記録 2. PUT送信（OK確認） 3. db.tsで再照会（afterEach: SEED再適用）	dtb_order・dtb_shipping とも COUNT不変（新規行は追加されない・削除もされない） [L1:L1-M0512-021; fixture:SEED-M05-12-ORDERS@TBD-D5]				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-020	IT-25	一括操作UI	P1	（BC-1）1件チェックで一括操作領域（見出し・プルダウン・決定）が表示される（ja）	ログイン済／SEED-M05-12-ORDERS	帯出荷行を1件チェック	1. 受注一覧で1件チェック 2. 一括操作領域の見出し・#option_bulk_status・決定ボタンの文言を読む	【仕様側期待】見出し「一括操作」・対応状況プルダウン・決定ボタン「決定」が表示される [L1:L1-M0512-024,L1-M0512-025]（**BC-DRAFT-M05-12-01: HEADは要素削除済み＝実走×見込み**） [fixture:SEED-M05-12-ORDERS@TBD-D5]				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-020-EN	IT-25	一括操作UI	P3	（BC-1）一括操作見出し・決定ボタン（en）	ログイン済／locale=en	同上	同上	【仕様側期待】"All"・"Submit" が表示される [L1:L1-M0512-024]（BC-1）				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-021	IT-25	確認モーダル	P1	（BC-1）決定→確認モーダルが開き処理中...→進捗→完了しました。→閉じる表示（ja）	ログイン済／SEED-M05-12-ORDERS	1件チェック＋変更先選択→決定	1. 決定押下 2. #sentUpdateModal の本文・進捗バーを読む 3. 全件送信後の本文と閉じるボタンを読む（afterEach: SEED再適用）	【仕様側期待】モーダルが開き本文「処理中...」＋進捗バー→全件終了で進捗バーが隠れ本文「完了しました。」＋閉じるボタン「閉じる」表示 [L1:L1-M0512-027]（BC-1: cmJS未include＝実走×見込み） [fixture:SEED-M05-12-ORDERS@TBD-D5]				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-021-EN	IT-25	確認モーダル	P3	（BC-1）モーダル文言（en）	ログイン済／locale=en	同上	同上	【仕様側期待】"Processing ..."→"Completed."＋"Close" [L1:L1-M0512-027]（BC-1）				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-022	IT-03	逐次送信	P1	（BC-1）チェック集合を1件ずつPUTし応答後に次を送る（network観測）	ログイン済／SEED-M05-12-ORDERS	帯出荷を2件チェック＋変更先=6→決定	1. network監視でPUT系列を記録 2. 各リクエストのURL/bodyを読む（afterEach: SEED再適用）	【仕様側期待】チェックした各出荷の /shipping/{出荷ID}/order_status へ body=order_status のみのPUTが**直列**（前の応答完了後に次）で送られる [L1:L1-M0512-028]（BC-1＝実走×見込み。サーバ側契約はC-050で自立） [fixture:SEED-M05-12-ORDERS@TBD-D5]				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-023	IT-22	未選択中断	P1	（BC-1）変更先未選択で決定→アラートを出しサーバへ送信しない	ログイン済／SEED-M05-12-ORDERS	1件チェック・変更先=未選択→決定	1. dialogイベントとnetworkを監視して決定押下 2. アラート文言と送信有無を読む	【仕様側期待】ブラウザ標準アラート「対応状況を選択してください」（スクリプト直書き・en資源なし）が表示され、更新エンドポイントへのリクエストは発生しない（処理未完了） [L1:L1-M0512-026]（BC-1＝実走×見込み）				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-024	IT-16	復帰	P2	閉じる→受注一覧resume=1で検索条件がセッションから復旧（主判定=非UIでresume現存）	ログイン済／SEED-M05-12-ORDERS／事前に検索条件（order_no=E2E-M0512-）で検索済み	—	1. 検索条件を設定して検索 2. 【主判定】同一セッションで GET /%eccube_admin_route%/order?resume=1 を開く 3. 検索条件・結果が復旧されていることを読む 4. 【副観測=BC-1】一括変更完了後の閉じるボタン押下で同URLへ遷移すること	【主判定・HEADで成立】resume=1 のGETで直前の検索条件・ページ番号がセッションから復旧され再表示される [L1:L1-M0512-030]。【副観測】閉じるボタン起点の遷移はBC-1（ボタン導線削除＝実走×見込み） [fixture:SEED-M05-12-ORDERS@TBD-D5]				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-025	IT-03	表示切替	P2	（BC-1）チェック0件で一括操作領域が隠れ、1件以上で表示される	ログイン済／SEED-M05-12-ORDERS	チェック0件→1件→0件	1. 0件時の一括操作領域の表示状態を読む 2. 1件チェック後を読む 3. 解除後を読む	【仕様側期待】0件のとき一括操作領域は隠れ（d-none）、1件以上で表示される [L1:L1-M0512-024]（BC-1: 領域・toggleBtnBulk削除済み＝実走×見込み）				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-026	IT-02	プルダウン	P2	（BC-1）プルダウン初期行「対応状況の変更」＋選択肢がsort_no順（ja）	ログイン済／SEED-M05-12-ORDERS	—	1. #option_bulk_status の option 列を読む 2. db.tsで SELECT id,name FROM mtb_order_status ORDER BY sort_no を照会し突合	【仕様側期待】初期行 value=""「対応状況の変更」・続く選択肢の並びと表示名がDB照会列（sort_no昇順）と一致 [L1:L1-M0512-025]（BC-1: select削除済み＝実走×見込み。名称はDB照会値=§2）				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-026-EN	IT-02	プルダウン	P3	（BC-1）プルダウン初期行（en）	ログイン済／locale=en	—	同上	【仕様側期待】"Update Status" [L1:L1-M0512-025]（BC-1）				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-027	IT-28	エラー表示	P2	（BC-1）400応答の出荷は結果一覧へERROR「システムエラーが発生しました」（ja）	ログイン済／SEED-M05-12-ORDERS	不存在ID系の一括実行（順次送信中に400発生）	1. 一括実行で400を発生させる 2. #sentUpdateModal #bulkErrors のERROR行文言を読む（#bulkErrorsは一括削除モーダルにも存在＝必ず#sentUpdateModal配下に限定）	【仕様側期待】結果一覧にERROR「システムエラーが発生しました」が追記される（HTTP400/500系はfailハンドラ） [L1:L1-M0512-029,L1-M0512-006]（BC-1＝実走×見込み。400応答自体はC-061で自立）				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-027-EN	IT-28	エラー表示	P3	（BC-1）ERROR文言（en）	ログイン済／locale=en	同上	同上	【仕様側期待】"System error occurred" [L1:L1-M0512-029]（BC-1）				
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-028	IT-28	部分失敗	P1	（BC-1）混在バッチでスキップ/遷移不可はNOTICE追記・他出荷の変更は確定	ログイン済／SEED-M05-12-ORDERS(ORD-NEW=1・ORD-PENDING=7)	両受注の出荷をチェック＋変更先=6→決定	1. 一括実行 2. #sentUpdateModal #bulkErrors のNOTICE行を読む 3. db.tsで両受注の order_status_id 照会（afterEach: SEED再適用）	【仕様側期待】ORD-PENDING側はNOTICE「900001222: <FROM名> から <TO名> にはステータス変更できません」が追記され order_status_id=7 不変・ORD-NEW側は order_status_id=6 へ確定（全体ロールバックなし） [L1:L1-M0512-029,L1-M0512-031,L1-M0512-008]（BC-1: GUI起動不可＝実走×見込み。DB面の等価検証はC-040+C-041の連続実行で自立） [fixture:SEED-M05-12-ORDERS@TBD-D5]				
```

### §4.2 補完行（1行。**親test_idなし・母集合会計に算入しない**。理由=設計書補完〔md:90の全選択/個別解除JSは一次資料に規定があり**HEADにも現存**するが、母集合90行の期待テキストに対応する親が存在しない〕）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m05-12_admin_order_order_bulk_status_change	E2E-M0512C-030	IT-03	選択JS	P2	全選択オンで全行選択・オフで全解除・個別変更で全選択が外れる（HEAD現存）	ログイン済／SEED-M05-12-ORDERS	検索で帯行に絞る	1. #toggle_check_all をオン→全行checked確認 2. オフ→全行解除確認 3. 再度オン後、1行を個別解除→#toggle_check_all のchecked状態を読む	オンで全 input[id^="check_"] がchecked・オフで全解除・個別チェック変更で #toggle_check_all が false になる [L1:L1-M0512-023; fixture:SEED-M05-12-ORDERS@TBD-D5]（補完行・親test_idなし・設計書補完）				
```

## §5 locale対応表

LS=1 claim（6件）: L1-007（skip）・L1-008（failed）・L1-024（一括操作/決定）・L1-025（プルダウン初期行）・
L1-027（処理中/完了/閉じる）・L1-029（system_error）。
→ **-EN 6行**（C-041-EN／C-047-EN／C-020-EN／C-021-EN／C-026-EN／C-027-EN。全行§4.1に実体掲載）。

- en文言はすべてen一次資料逐語（messages.en.yaml:2450,2445,1750,1676,2409,2399,2400,1674,1653）。
  **ja翻訳による生成ゼロ**。
- **未選択アラート（L1-026）はLS=0**: スクリプト直書きでenロケール資源を持たない（cmJS:47逐語＋
  md:165「英語ロケール資源を持たない」）→ -EN行を作らない（enでも同一日本語文言の見込み・要実機）。
- %from%/%to%（L1-008）の状況名はロケール資源でなく `mtb_order_status.name` のDB値（Controller:553-554）
  ＝en UIでも名称部はDB値のまま（枠文言のみen）。
- サーバJSON messageのlocale解決は管理セッションのロケールに依存（-EN 2行はD15前提）。
  -EN実行前提はD15（M0 Go/No-Go。文言確定は本書で6/6=100%完了・実行のみ保留）。

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

### §6.1 request契約（非UI系 C-002/040〜047/050/060/060B/061/062）

- URL: `PUT /%eccube_admin_route%/shipping/{出荷ID}/order_status`（Controller:483。PUTのみ・id=\d+）。
- ヘッダ: `X-Requested-With: XMLHttpRequest`（isXmlHttpRequest要件=Controller:486）＋
  `ECCUBE-CSRF-TOKEN: <正規token>`（Abstract:256。または body `_token`）。
  正規tokenは同一ログインセッションで管理画面GET→`meta[name="eccube-csrf-token"]` の content（frame:16。
  管理JSの実装様式と同一=frame:81-88 ajaxSetup）。
- body（urlencoded）: `order_status=<変更先id>` のみ（一括契約=cmJS:168。notificationMailを**送らない**）。
- 改変系: C-060=XHRヘッダ除去（token正規）／C-060B=tokenヘッダの末尾1文字置換（XHR維持）／
  C-061=order_status=99999（db.tsで不存在を前提確認）。
- 応答判定: HTTP status＋JSON body（`status`/`message`/`mail`キー。L1-020）。

### §6.2 db.ts状態照会（三段参照の観測層）

- `e2e/helpers/db.ts`（docker exec psql・読取と後始末のみ。db.ts:1-30）。照会列:
  `dtb_order.order_status_id`／`dtb_shipping.shipping_date, mail_send_date`／
  `dtb_product_stock.stock`／`dtb_customer.buy_times, buy_total`／`mtb_order_status.id, name, sort_no`／
  両表 `COUNT(*)`（C-062）。
- **SEED初期値を期待の正にしない**: 遷移後の期待値はL1（§1・§3.1の遷移規則）から導出。
  message中の状況名はdb.ts照会の `mtb_order_status.name` を実行時に埋め込む（名称マスタは
  インストール経路依存=§2）。時刻系（shipping_date）はブラケット法（T1≦値≦T2）。
- **復元・cleanup**: §2-2の契約（副産物DELETE→UPSERT復元の順序・失敗時も走るteardown・
  適用後検証クエリ）に従う。キャンセル系ケース（C-044/045）は在庫履歴INSERT（Stock:140-153）の
  副産物削除を伴う（削除条件=D5 manifest契約 `@TBD-D5`）。
- オラクル解決: `e2e/helpers/oracle.ts` の `o(id, …)` 方式（**正式fixtureは未作成**。候補段階では消費なし）。

### §6.3 _drafts/隔離lint証跡（実測・本候補作成時に確認）

1. oracle草案は `e2e/fixtures/oracle/_drafts/m05-12_admin_order_order_bulk_status_change_oracle_draft.json`
   のみに生成。**正式パス `e2e/fixtures/oracle/` 直下への書込なし**。
2. 正式解決器 `e2e/helpers/oracle.ts:16-25` の隔離ガード（`_drafts`・パス区切り・`..` をthrow）により
   正式specから本草案は解決不能（機械強制・W0で実在確認済み）。
3. 本候補は spec/page 実装・実走なし。既存 `e2e/spec/admin/m05/m05_12_*.spec.ts`・page への変更なし。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

- 非UI（request契約+db.ts）・**ee HEADで成立**: C-002/040/041(+EN)/042/043/044/045/046/047(+EN)/050/
  060/060B/061/062。
- Playwright(GUI)・HEADで成立: C-001/010/011/030（補完）・C-024主判定（resume GET）。
- Playwright(GUI)・**BC-DRAFT-M05-12-01影響下＝実走×見込み**: C-020(+EN)/021(+EN)/022/023/025/
  026(+EN)/027(+EN)/028・C-024副観測（閉じるボタン導線）。
- 破壊的（使い捨てSEED帯のみ更新・afterEach SEED再適用・フレッシュDB/serial前提）:
  C-040〜047/050/062/028（＋GUI系が実走可能になった場合の全一括実行系）。
- 実行保留: -EN 6行（D15）・C-060Bの実応答確定（BC-2裁定待ち）・C-002の具体応答形（要実機）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（観点ラベル不使用）。1候補ケース行=1 assertion bundle・
多対一は shared-observation・-EN行は対応ja行と同一親のlocale多重。**参照先の全候補行は§4に実体掲載済み
＝90↔候補の期待テキスト突合が本文内で完結する**。

### 集計（90 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **61** | 下表（うちBC-DRAFT-M05-12-01影響=**GUI専属20行＋GUI併用6行**。test_id単位の導出表=§9） |
| **TBD** | **0** | —（全bound行はL1で拘束済み。BC影響・要実機は§9に別掲＝オラクル化不能ではない） |
| **excluded** | **29** | EX-A 検索系18（020〜037）／EX-D 行追加(INSERT)肯定7（038,040,042,043,045,047,048）／EX-F メール件名・本文4（070,071,073,074） |
| 合計 | **90** | 欠落0・理由なし重複0 |

- excluded根拠（**各カテゴリの全test_idを実引きし期待テキストで確認済み**）:
  - **EX-A（020〜037・18件）**: 期待は全行「検索条件／実行結果の該当レコードが取得結果に含まれる
    （含まれない）こと」（項目名も全行「検索時の…確認」）。本機能に検索機能なし:
    「受注一覧の検索フォーム、ページネーション、表示件数、並び替え、検索条件セッションの詳細」は
    **本書で扱わない**（md:43＝m05-01へ委譲）・updateOrderStatus（Controller:483-571）に検索処理0件（実測）。
    検索という操作自体が不存在のため過剰生成。**偽陰性なし**: 変更結果の一覧反映（md:219）は
    C-024（resume再表示）＋C-040系DB照会でbound済み・両極性とも除外（片極性のみ除外する誤りなし）。
  - **EX-D（7件・ケース別限定）**: 期待は全行「登録内容/実行結果の対象レコードが**追加されること**」
    （肯定側）。**各ケースが要求する対象レコード＝本機能の主対象表（dtb_order/dtb_shipping・
    md:264-268の「登録/更新」対象）への追加経路が確認できない**: updateOrderStatus本体は
    find済み既存エンティティのみpersist・new生成なし（Controller:497-560実測・L1-021）。
    **注（捏造ゼロ・在庫履歴INSERTを無視しない）**: キャンセル系遷移では在庫履歴行のINSERTが実在する
    （Stock:140-153・L1-021注記）。ただしこれは遷移副産物の別表行であり、母集合の「登録内容の
    対象レコードが追加されること」（本機能の登録対象＝md:264-268の主対象表）には該当しない＝
    **一般不能でなくケース別の限定判断**。
    **更新の成立という意味成分は050系（C-040〜045）がboundで被覆**（偽陰性なし）。
    否定側「追加されないこと」（039,044,046）は2表の行数不変assertionへ**bound**（C-062・
    非キャンセル遷移1→6で観測・外さない）。
  - **EX-F（070,071,073,074・4件）**: 期待「件名/本文でエラーが表示され（ず）…」。本機能にメールの
    件名・本文入力は不存在: 「一括の対応状況変更ではメール送信のチェックは表示せず、送信もしない」
    （md:94）・「メール一括通知…」は対象外（md:41）・一括送信データは order_status のみ（cmJS:168・
    L1-016）＝件名/本文という入力自体が不存在のため両極性とも過剰生成。**偽陰性なし**:
    メール非送信の実体（mail:false・mail_send_date不変）はC-046でbound済み。

### 90対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | （対応状況）受注の進行状態を表す区分であること | bound | C-040（order_status_id遷移の実観測=区分の実証・shared） |
| 002 | （出荷）受注配下の発送単位であること | bound | C-011（checkbox value=出荷ID・行=出荷単位） |
| 003 | （プルダウン）一覧上部の変更先選択セレクトであること | bound | C-020,C-026（BC-1） |
| 004 | （状態遷移ルール）変更できる組み合わせの定義であること | bound | C-040,C-041 (shared・§3.1マトリクス) |
| 005 | （確認モーダル）進捗バーと結果一覧を出すダイアログであること | bound | C-021（BC-1） |
| 006 | （一括対象）チェックを入れた出荷行の集合であること | bound | C-022（BC-1） |
| 007 | チェックボックス・プルダウン・決定ボタンを含む一覧を表示 | bound | C-010（チェック=HEAD現存）＋C-020（プルダウン/決定=BC-1） |
| 008 | 変更先未選択なら警告を出して中断 | bound | C-023（BC-1） |
| 009 | 出荷IDごとに変更先の対応状況IDを送信 | bound | C-050 |
| 010 | 必須バリでエラー表示・処理未完了 | bound | C-023（未選択=唯一の必須相当・警告で中断=BC-1）＋C-060 (shared・サーバ側前提不成立400) |
| 011 | 必須バリでエラー表示され**ず**継続 | bound | C-040（変更先選択済み=処理継続） |
| 012 | 一覧の各出荷行の左端にチェックボックスを表示 | bound | C-010 |
| 013 | 相関バリでエラー・処理未完了 | bound | C-041（現在状況×変更先の遷移不可=本機能の相関検証） |
| 014 | 相関バリでエラーなし継続 | bound | C-040（遷移可の組合せ） |
| 015 | 相関バリでエラーなし継続 | bound | C-040 (shared) |
| 016 | 相関バリでエラー・処理未完了 | bound | C-041 (shared) |
| 017 | DB相関バリでエラーなし継続 | bound | C-040 (shared・呼出時点のDB現在状況で判定=md:217) |
| 018 | DB相関バリでエラー・処理未完了 | bound | C-061（DBに不存在の変更先ID=引当失敗400） |
| 019 | （部分入力）確認モーダルを表示すること | bound | C-021 (shared・BC-1) |
| 020〜037 | 検索条件/実行結果の該当レコードが取得結果に含まれる（含まれない） | **excluded** EX-A | — |
| 038 | 対象レコードが**追加される**こと | **excluded** EX-D | — |
| 039 | 追加され**ない**こと | bound | C-062（行数不変） |
| 040 | 追加されること | excluded EX-D | — |
| 041 | （対応状況）進行状態を表す区分であること | bound | C-040 (shared) |
| 042 | 追加されること | excluded EX-D | — |
| 043 | 追加されること | excluded EX-D | — |
| 044 | 追加され**ない**こと | bound | C-062 (shared) |
| 045 | 追加されること | excluded EX-D | — |
| 046 | 追加され**ない**こと | bound | C-062 (shared) |
| 047 | 追加されること | excluded EX-D | — |
| 048 | （実行結果）追加されること | excluded EX-D | — |
| 049 | 出荷IDごとに変更先の対応状況IDを送信 | bound | C-050 (shared) |
| 050 | 更新内容の値が変更されること | bound | C-040（order_status_id更新） |
| 051 | 値が変更され**ない**こと | bound | C-041,C-047 (shared・遷移不可/スキップでDB不変) |
| 052 | 値が変更されること | bound | C-042（shipping_date設定） |
| 053 | 1件以上で一括操作領域を表示し0件で隠す | bound | C-025（BC-1） |
| 054 | 値が変更されること | bound | C-042,C-043 (shared・受注の配送完了適用) |
| 055 | 値が変更されること | bound | C-044（在庫戻し=ProductStock更新） |
| 056 | 値が変更され**ない**こと | bound | C-043（未出荷が残る間は受注不変） |
| 057 | 値が変更されること | bound | C-044 (shared・商品規格/在庫情報の更新) |
| 058 | 値が変更され**ない**こと | bound | C-046（mail_send_date不変）＋C-047 (shared) |
| 059 | 値が変更されること | bound | C-045（buy_times/buy_total再計算） |
| 060 | （実行結果）値が変更されること | bound | C-040 (shared) |
| 061 | （一括操作見出し）1件以上チェックで表示 | bound | C-020(+EN)（BC-1） |
| 062 | （プルダウン初期行）未選択時に表示 | bound | C-026(+EN)（BC-1） |
| 063 | （決定ボタン）一括操作領域に常時表示 | bound | C-020 (shared・BC-1) |
| 064 | （処理中...）送信中にモーダル本文へ表示 | bound | C-021(+EN) (shared・BC-1) |
| 065 | （完了しました。）全件終了でモーダル本文へ表示 | bound | C-021 (shared・BC-1) |
| 066 | （閉じる）完了後に表示 | bound | C-021 (shared・BC-1) |
| 067 | サーバへ送信せず中断 | bound | C-023 (shared・BC-1) |
| 068 | ロケールキーadmin.common.system_errorであること | bound | C-027(+EN)（BC-1・ja:1607/en:1653逐語） |
| 069 | 当該出荷の注意行を結果一覧へ追記 | bound | C-028（BC-1） |
| 070 | 件名でエラー表示・処理未完了 | **excluded** EX-F | — |
| 071 | 件名でエラー表示されず継続 | excluded EX-F | — |
| 072 | 会員ひもづき時に購入回数・購入金額集計を更新 | bound | C-045 |
| 073 | 本文でエラー表示・処理未完了 | excluded EX-F | — |
| 074 | 本文でエラー表示されず継続 | excluded EX-F | — |
| 075 | 一括操作領域はチェック0件のとき隠れる | bound | C-025 (shared・BC-1) |
| 076 | 警告を出しサーバへ送信せず中断 | bound | C-023 (shared・BC-1) |
| 077 | 当該出荷をスキップし注意メッセージを結果一覧へ表示 | bound | C-047(+EN)（message実体・非UI）＋C-028 (shared・表示面=BC-1) |
| 078 | 変更せず変更できない旨のメッセージを結果一覧へ表示 | bound | C-041(+EN)（message実体・非UI）＋C-028 (shared・表示面=BC-1) |
| 079 | HTTP400となり結果一覧へシステムエラーを表示 | bound | C-061（400実体・非UI）＋C-027 (shared・表示面=BC-1) |
| 080 | 当該出荷の更新は異常応答（HTTP400）となること | bound | C-060（非XHR=400）＋C-060B（token不正・仕様側400=BC-2） |
| 081 | （対応状況）進行状態を表す区分であること | bound | C-040 (shared) |
| 082 | （出荷）受注配下の発送単位であること | bound | C-011 (shared) |
| 083 | （プルダウン）変更先選択セレクトであること | bound | C-026 (shared・BC-1) |
| 084 | （状態遷移ルール）組み合わせの定義であること | bound | C-040,C-041 (shared) |
| 085 | 画面表示データでエラー表示されず継続 | bound | C-010 (shared・一覧正常表示) |
| 086 | （一括対象）チェックを入れた出荷行の集合であること | bound | C-022 (shared・BC-1) |
| 087 | 画面表示データでエラー表示されず継続 | bound | C-010 (shared) |
| 088 | 受注一覧へ戻り検索条件をセッションから復旧して再表示 | bound | C-024（主判定=resume GET現存・副観測=閉じる導線BC-1） |
| 089 | 受注一覧画面へ到達できないため本操作も利用できない | bound | C-001,C-002 |
| 090 | 1件以上で一括操作領域を表示し0件で隠す | bound | C-025 (shared・BC-1) |

`func_scope_check` 判定: 親90/90会計済み・欠落0・理由なし重複0・補完1行（C-030）は§4.2に実体掲載
（親空・設計書補完・母集合会計外）→ **差分0を本文内で実証可能**。O6は主張しない。

## §9 TBD・要実機・BC/DOC-DRAFT・excluded（正直な分離）

- **TBD=0件**: 全bound行はL1（§1）で期待値拘束済み。excluded 29件は§8の一次資料根拠つき。
- **BC-DRAFT（設計書↔実装の乖離候補。正式採番はcodex承認時=ROLLOUT §7）**:
  1. **BC-DRAFT-M05-12-01（GUI導線の削除）**: 設計書（md:75-76,89-93,96,105-116,152-159,165,299-307）が
     規定する受注一覧の一括操作GUI一式（一括操作領域・`#option_bulk_status`・決定ボタン・
     確認モーダル一括起動・閉じる→resume）は、ee HEAD（9dbc4dd）で**不存在**。根拠両側:
     設計書側=上記md行／実装側=コミット c51e2bda15（2026-07-09「一括操作ボタンを削除…」・
     index.twigから91行削除。削除diffに `#option_bulk_status`・`#btn_bulk_status`・
     `{{ include('@admin/Order/confirmationModal_js.twig') }}`・`#bulkChangeComplete` ハンドラを逐語確認）＋
     HEAD grep 0件（実測）。**現存する構成部品**: サーバエンドポイント（Controller:483-571）・
     行チェックボックス+data-update-status-url（twig:1196-1202）・全選択JS（twig:100-102,113-119）・
     モーダルmarkup（twig:1291-1327・バインドなし）・cmJS本体（shipping.twig:170のみinclude=
     個別「出荷済にする」M05-15用・data-bulk-update="false"）。
     **傍証**: 既存e2e実走（2026-07-06）ではプルダウン系3件が〇＝削除コミット（07-09）以前のSUT。
     影響候補ケース行=C-020/021/022/023/025/026/027/028（+EN4行）・C-024副観測（§4に個別明記）。
     期待値は仕様側のまま維持（設計書の陳腐化 or 機能廃止かは**発注者裁定事項**）。

     **BC-1影響bindの導出表（test_id単位・90対応表と1:1対応。旧記載「17行」は誤集計＝撤回）**:
     - **GUI専属bind（bind先がBC-1影響ケースのみ・非UI等価観測なし）＝20行**:

       | bind先（BC-1影響ケース） | 親test_id | 行数 |
       |---|---|---:|
       | C-020（一括操作領域・決定） | 003,061,063 | 3 |
       | C-021（確認モーダル・処理中/完了/閉じる） | 005,019,064,065,066 | 5 |
       | C-022（逐次送信のGUI観測） | 006,086 | 2 |
       | C-023（未選択alert・送信中断） | 008,067,076 | 3 |
       | C-025（領域の表示/非表示切替） | 053,075,090 | 3 |
       | C-026（プルダウン初期行・sort_no順） | 062,083 | 2 |
       | C-027（結果一覧ERROR表示） | 068 | 1 |
       | C-028（NOTICE追記・混在バッチ表示面） | 069 | 1 |
       | **計** | | **20** |

     - **GUI併用bind（BC-1影響ケースと非BC観測の両方にbind・主判定は現HEADで自立）＝6行**:
       007（C-010現存GUI＋C-020）・010（C-060非UI＋C-023）・077（C-047非UI＋C-028）・
       078（C-041非UI＋C-028）・079（C-061非UI＋C-027）・088（C-024主判定=resume GET現存＋副観測）。
     - 算式: BC-1接触親行=20＋6=**26行**／bound 61行のうちBC-1非接触=35行。
       -EN側の影響=C-020-EN/C-021-EN/C-026-EN/C-027-EN の4行（C-041-EN/C-047-ENはサーバmessage=非影響）。
  2. **BC-DRAFT-M05-12-02（トークン不正の応答コード）**: 設計書=HTTP400（md:120,208,229,241,278,289,318）／
     実装=isTokenValidがfalseを返す分岐を持たず `AccessDeniedHttpException('CSRF token is invalid.')` を
     throw（Abstract:252-263）＝Symfony既定でHTTP403系見込み。C-060Bの実応答は要実機確定。
     DB不変・処理不成立はいずれの解釈でも成立（主判定は自立）。
- **DOC-DRAFT（設計書の自己矛盾候補）**:
  1. **DOC-DRAFT-M05-12-01**: md:144「配送完了へは新規受付・入金済み・対応中から遷移でき、それ以外の
     対応状況からは遷移できない」⇔ md:45,63,190が確認値と宣言するワークフロー設定には
     `admin_to_delivered`（from 2,9,10,13,14,12,3も可=config:161-174）が存在。L1-010は設定側を正とした
     （設計書自身の委譲宣言に従う）。
- **要実機（実行面の保留＝オラクル化不能ではない）**:
  1. C-002の未認証PUTの具体応答形（302/401等。claimは「処理されない・DB不変」に限定済み）。
  2. C-060Bの実応答コード（BC-2。403系見込み）。
  3. GUI系セレクタの実DOM（BC-1裁定後。現状は削除diff由来の旧markupのみ）。
  4. SEED-M05-12-ORDERSの完全行セット（受注のNOT NULL/FK一式・base_info対応在庫を含む）=D5 manifest契約。
  5. キャンセル系ケース（C-044/045）の副産物（在庫履歴等の別表行）の掃除契約=D5。
  6. -EN 6行=D15（管理画面en切替。文言確定は本書で完了）。
- **excluded=29件**: §8集計表・根拠のとおり（EX-A 18/EX-D 7/EX-F 4）。
- **候補規律**: 全行 `@TBD-D5`・O5非主張・spec/page実装なし・実走なし。想定外例外→HTTP500
  （md:209,322・Controller:564-568）は母集合90行に対応する期待テキストが存在せず、障害注入ハーネスも
  未契約のため候補化せず（補完も不作成。理由記録のみ。旧e2e_cases.mdのE2E-M05-12-042=手動扱いと同判断）。
  ログ・監査（md:328-339）も観測手段未契約＋対応期待テキストなしのため候補化せず（理由記録のみ）。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象構文（肯定/否定・許可/拒否の対）を列挙し、claim単位で期待テキストとの極性一致を目視確認した:

| 極性対 | 該当行 | 判定 |
|---|---|---|
| エラー表示**され**/表示され**ず** | 010 vs 011・013/016 vs 014/015・018 vs 017・070/073 vs 071/074・085/087 | 010→C-023/C-060（拒否側）・011→C-040（許可側）・013/016→C-041（遷移不可）・014/015/017→C-040（遷移可）・018→C-061（不存在ID）。070/073 vs 071/074は**両極とも入力自体が不存在**（EX-F・片極性のみ除外する誤りなし）。085/087→C-010（正常表示）。取り違えなし |
| 追加され**る**/され**ない** | 038,040,042,043,045,047,048（肯定）vs 039,044,046（否定） | 肯定=EX-D（INSERT経路なし=成立不能）・否定=行数不変assertionへbound（C-062）。**肯定側をboundにする取り違えなし** |
| 変更され**る**/され**ない** | 050,052,054,055,057,059,060（肯定）vs 051,056,058（否定） | 肯定→C-040/042/043/044/045（更新成立系）・否定→C-041/047（不成立でDB不変）・C-043（**部分配送完了時の受注不変**=否定が仕様の正常動作である点に注意）・C-046（mail_send_date非更新）。整合 |
| 許可/拒否（認証・要件） | 089（未認証拒否）・080（XHR/token不正拒否） | 089→C-001/C-002（拒否側）・080→C-060/C-060B（拒否側。C-060Bは仕様400 vs 実装403のBC-2を明記し期待は仕様側）。ログイン済み正規契約の許可側はC-040系。分離済み |
| 含まれる/含まれない（検索） | 020〜037 | 両極性ともEX-A（検索機能不存在）＝極性によらず除外。片極性のみ除外する誤りなし |
| 表示する/隠す・中断する/継続する | 053/075/090（表示/隠す）・008/067/076（中断）vs 011/014等（継続） | 表示/隠すは同一claim（L1-024）の両面としてC-025へ・中断→C-023（送信0件の観測）・継続→C-040。BC-1の影響は極性判定に影響しない（期待は仕様側のまま） |
| 用語定義行（〜であること） | 001/041/081・002/082・003/083・004/084・005・006/086 | 定義の**観測可能な発現**へbind（区分→遷移観測・出荷単位→checkbox値/URL・セレクト→BC-1のUI・定義→§3.1マトリクス・モーダル/一括対象→BC-1のGUI）。定義文を「表示文言の一致」と誤読していない |

- **本候補はcodex敵対レビュー未実施**（この後レビュー予定）。C4対象の極性取り違えは自己検査では
  検出されず（未検出の可能性は残る）。
- BC-1裁定の分岐を明記（再会計は§9導出表から機械的に導出可能）:
  (a)設計書が正（GUI復活すべき）→GUI系候補行はそのまま実装waveへ／
  (b)実装が正（機能縮退・設計書改訂）→**GUI専属20行**（§9導出表）を「機能廃止に伴うexcluded」へ
  再会計（bound 61→41・excluded 29→49）。**GUI併用6行**は非UI/現存GUI側の主判定でbound維持。
  候補ケース行はBC-1影響のja8行（C-020/021/022/023/025/026/027/028）＋EN4行を撤去し、
  C-024は主判定（resume GET）のみ残す＝現HEADで成立する候補行はja18行（C-024含む）＋
  EN2行（C-041-EN/C-047-EN）＋補完1行。
  **本候補はROLLOUT §7の規約に従い(a)の形で保持**。

---

## 付録: 作業実測（B0係数計測用）

- 読了した一次資料: 設計書md 1本（345行）／ee実ソース14
  （OrderController・AbstractController・Constant・OrderStateMachine・order_state_machine.php・
  StockReduceProcessor・OrderRepository・index.twig・confirmationModal_js.twig・shipping.twig・
  default_frame.twig・Entity5種・security.yaml）／locale 2（messages ja/en）／初期データ・migrations 4
  （import_csv mtb_order_status.csv・Version20251125150428/20260220000001/20251125163314）／
  **git履歴調査**（c51e2bda15削除diffの逐語確認=本機能固有の追加固定費）／既存資産5
  （旧e2e_cases.md・spec・page・SEED-M05-ORDERS.sql・db.ts/oracle.ts）／統治・見本4＝**計約31ファイル**。
- L1 claim数: **31**。難所: (1)**GUI削除の発見と立証**（HEAD grep→削除コミット特定→削除diff逐語→
  旧e2e実走〇との時系列整合まで）(2)状態遷移マトリクスの全数確定とmd:144矛盾の切り分け（DOC-DRAFT）
  (3)isTokenValidのthrow仕様（400にならない）の発見（BC-2）(4)在庫戻しのbase_info対応在庫
  （getProductStockByEccube）のSEED制約 (5)名称マスタのインストール経路依存（期待に焼き込まない設計）。
- 母集合90行の期待テキスト読解・分類: bound61/excluded29（EX-Fの両極除外と、BC-1影響下bindの
  「除外せず仕様側で保持」の裁定が最大の判断点）。

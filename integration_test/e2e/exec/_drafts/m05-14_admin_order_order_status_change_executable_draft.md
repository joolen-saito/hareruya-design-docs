# B0候補: m05-14 受注対応状況の変更（個別） — 実行可能グレード候補（母集合101全量踏破）

> 2026-07-24 ／ **候補グレード（candidate・D6前・O5未確定・実装/実走なし）**／ B0（具体化先行の量産・標準）。
> codexレビュー: **R1要修正（Blocker2＋Major）→改訂1で是正・再確認待ち**（`REVIEW_LEDGER.md`と同期）:
> (1)【Blocker】excluded=29のカテゴリ一括説明→**per-ID実引き表を§9に新設**（29 IDごとの前提列項目・
> 期待逐語・除外理由・一次資料対応・実項目の代替bound先。EX-Dは各IDで「主対象表への追加経路が
> 確認できない」を明記・副産物INSERTは隠蔽せず別掲）
> (2)【Blocker】C-048の二重期待（在庫変動なし⇔stock減算の併記=実行可能オラクルでない）→**分離**:
> C-048=実装観測ケース（3→4のcommitStockで**stock=S0−2・在庫履歴+1行INSERTを確定期待**）／
> 設計書MSG-003「在庫変動なし」との乖離は**BC-DRAFT-M05-14-03へ設計側期待として隔離**（×確定・BC登録・
> 1行に混ぜない）
> (3)【Major】BC-5の在庫不足引用を訂正: Stock:93-95（**在庫レコード不存在**）→在庫数量不足は
> **Stock:108-113**（bcsub後の負値チェックでShoppingException）。catchなし主張・500は断定しない扱いは維持
> (4)【Major】L1-019の条件欠落を補完（**会員受注かつplayer存在時のみ**発火・ゲスト受注は何もしない・
> **Σpoint_change=0のときは残高不変**〔行削除とgained_points=0は実施〕=PtSvc:98-106,120-122逐語）
> (5)【Major】C-045/C-048の期待をSEED値でなく**S0スナップショットからのΔ**（stock=S0±qty・履歴+1行）へ書換。
> **BC-DRAFT 1〜5（引用除く）・DOC-DRAFT 1/2・067/069の削除経路bound・遷移マトリクス再利用+PRG差・
> 破壊系隔離（9000014xx+S0+副産物cleanup）はcodex妥当確認済み=維持**。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> fixture_version は全て `@TBD-D5`。統治: `integration_test/CONCRETIZATION_ROLLOUT_PLAN.md`（B0）＋
> `integration_test/CONCRETIZATION_FIRST_PLAN.md`（三段会計）。
> 正典（型）: `integration_test/e2e/PILOT_m09_01_news_executable_grade.md`／同型見本:
> `_drafts/m05-12_admin_order_order_bulk_status_change_executable_draft.md`（遷移マトリクスの正・破壊系SEED隔離）・
> `_drafts/m05-13_admin_order_order_tracking_number_executable_draft.md`（S0スナップショット同値方式）
> （いずれもcodex承認済み候補）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m05-14_admin_order_order_status_change_oracle_draft.json`。
> **正式パス `e2e/fixtures/oracle/` 直下には書かない**。
> **最重要検出（本候補作成時の実ソース調査）**:
> - **BC-DRAFT-M05-14-01（プルダウンに現在ステータス自身が残る）**: 設計書md:84,184「現在のステータス自身は
>   選択肢に出さない。OrderTypeが同一ステータスを除外する」に対し、実装は同一ステータスを**除外処理から
>   スキップして選択肢に残す**（OrderType.php:417-421の`continue`＋`'data' => $Order->getOrderStatus()`=429-439
>   ＝初期選択値として現在ステータスがプルダウンに含まれる）。
> - **BC-DRAFT-M05-14-02（検証エラーはエラー表示なしのリダイレクト）**: 設計書md:151,302「許可されない遷移先を
>   強制送信→受注ステータス検証エラーを対応状況プルダウン直下に表示」・md:277「空送信は検証エラー」に対し、
>   実装は status_change モードで form invalid のとき**エラーを表示せず受注編集画面へ302リダイレクト**
>   （EditController.php:769-771・PRGでフォームエラー消失）。さらに `failed_to_change_status__short` の
>   FormError分岐（OrderType.php:520-531）は、choices自体が同一リクエスト内で同じ`can()`により
>   フィルタ済み（OrderType.php:422-424）のため **status_change経路では実質到達不能**。
> - **BC-DRAFT-M05-14-03（MSG-003文言と3→4遷移の在庫挙動の矛盾＝ee内部矛盾・不具合候補）**: 確認ダイアログ
>   「キャンセルからステータスを変更する場合は、在庫の変動はありません。」（edit.twig:663・設計書md:159逐語）に対し、
>   取消(3)→対応中(4)は transition `back_to_in_progress` のリスナ **commitStock（在庫再減算＋在庫履歴INSERT）**
>   ＋commitUsePoint が発火する（OrderStateMachine.php:98・StockReduceProcessor）。
> - **BC-DRAFT-M05-14-04（1→6の入金日上書き）**: 設計書md:186,206「入金日は既設定のとき上書きしない」に対し、
>   新規受付(1)→入金済み(6)は transition `pay` が選択され、リスナ `updatePaymentDate` が
>   **payment_date を無条件に現在日時でセット（既設定でも上書き）**（OrderStateMachine.php:95,111-116・
>   order_state_machine.php:47-50）。2→6(`paywait`)・他from(`admin_to_paid`)はリスナなし＝上書きなし。
> - **BC-DRAFT-M05-14-05（購入例外の未捕捉）**: 設計書md:314「購入処理上の例外時もエラーを表示して画面を
>   再表示」に対し、tryCommitOrderStatusChange（EditController.php:760-839）には register 経路（690-697）に
>   あるような catch がなく、例外（例: 3→4 在庫数量不足時の ShoppingException=StockReduceProcessor:108-113〔負値判定throw=111-113。93-95は在庫レコード不存在の別分岐〕）は
>   未捕捉で伝播（HTTP500系見込み・要実機）。
> - **DOC-DRAFT-M05-14-01（設計自己矛盾）**: md:108「受注フォーム全体が妥当でない場合は…リダイレクトする」
>   ⇔ md:151/205/302「検証エラーを表示し…遷移適用が失敗してトランザクションを巻き戻す」。invalid なら
>   確定処理（トランザクション）に入らないため両立しない。実装は「OrderItems明細サブフォーム невалид→
>   HTTP200再表示（エラー表示あり=EditController.php:500-502）／それ以外のform invalid→302リダイレクト
>   （表示なし=769-771）」の2経路。
> - **DOC-DRAFT-M05-14-02（設計書の記載が一次資料と不一致）**: md:144「ロケールキーadmin.order.cancel.completeは
>   日本語のみで英語ロケール資源を持たない」に対し、`messages.en.yaml:2447` に
>   `admin.order.cancel.complete: Order cancellation completed.` が**実在**する。
> **行数集計**: 候補ケース行総数**34**＝bound対応34（ja30＋-EN 4）＋補完0。
> 母集合101全数会計＝bound 72／TBD 0／excluded 29（§8）。

## §0 版固定

- 設計書正本: `functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md`（335行・
  最終コミット ec17cd0・本repo HEAD 017ab3b。以下「md:行」）。
- ee `/home/y-saito/Developments/ec-cube-enterprise` コミット `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51`
  （W0/W1・m05-12/13と同一checkout）。
- fid_kubun.tsv（D1・SHA先頭 `44fbf02f1e4c`）: `M05-14｜対応状況設定｜対象｜標準｜standard-src+design`
  （fid_kubun.tsv:258）→ **標準＝ee実ソース直接可＋設計書md**（暫定付与・確定はD6）。
- 母集合: baseline `integration_test/all_it_cases.tsv`（SHA先頭 `7911f190d273`）M05-14全**101行**
  （IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-001〜101。以下「-nnn」）。
- **判定原則（W0教訓1）**: 観点ラベル・前提/入力列はノイズ。bindは各行の**「期待結果」実テキスト**で判定
  （§8に全101行の期待要旨を併記し極性も期待テキストで確認）。
- 主要一次資料の略記:
  - Edit = `src/Eccube/Controller/Admin/Order/EditController.php`
    （route=146-147・submitガード=500-502・mode分岐=504-505・tryCommitOrderStatusChange=760-839・
    404=204-217,144）
  - OT = `src/Eccube/Form/Type/Admin/OrderType.php`
    （listener登録=327-331・addOrderStatusForm=405-440・copyFields=470-500・validateOrderStatus=505-533・
    validateOrderItems=539-557）
  - SM = `src/Eccube/Service/OrderStateMachine.php`（apply=39-47・can=57-70・購読=91-103・
    updatePaymentDate=111-116・commitUsePoint=123-128・rollbackUsePoint=133-138・commitStock=145-150・
    rollbackStock=155-160・commitAddPoint=168-172（no-op）・rollbackAddPoint=178-182（no-op）・
    onCompleted=187-195）
  - config = `app/config/eccube/packages/order_state_machine.php`（workflow `order` 全定義。
    transitions=46-214。m05-12と同一版）
  - Stock = `src/Eccube/Service/PurchaseFlow/Processor/StockReduceProcessor.php`
    （prepare=56-58・rollback=65-67・店舗対応在庫=91・悲観ロック=97・在庫戻し=126・saveStockHistory呼出=141-153）
  - PtSvc = `src/Eccube/Service/PointService.php`（gainPoints=42-73・cancelOrderPoints=96-127・
    rollbackSpentPoints=88-92→changeSpentPoints=129-160）
  - PtProc = `src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php`（prepare=108-115・rollback=125-132）
  - Smaregi = `src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php`
    （registerGainPointJob=45-65・dispatchGainPointMessage=71-108）
  - twig = `src/Eccube/Resource/template/admin/Order/edit.twig`（form1=789-790・submitボタンmode同期=525-527・
    change-statusボタンJS=530-536・ダイアログ判定=617-663・submitフック=739-745・
    現在のステータス=833-837・対応状況ラベル/widget=840-845・変更ボタン=985-991・
    PENDING/PROCESSING disabled=757-762,1927）
  - Order = `src/Eccube/Entity/Order.php`（operator_id=649-651・update_date=542-543・payment_date=554-555・
    confirm_date=666-667・shipping_date=672-673・cancel_date=684-685・gained_points=653-654）
  - Player = `src/Eccube/Entity/DtbPlayer.php`（dtb_player=27・point=89-90）
  - PtHist = `src/Eccube/Entity/DtbPointHistory.php`（dtb_point_history=23）
  - Job = `src/Eccube/Entity/MessengerJob.php`（dtb_messenger_job=25）
  - ja/en = `src/Eccube/Resource/locale/messages.{ja,en}.yaml`
  - sec = `app/config/eccube/packages/security.yaml`（admin firewall=40-47）
- 既存資産（参考・変更なし）: `e2e/spec/admin/m05/m05_14_admin_order_order_status_change.spec.ts`・
  `integration_test/e2e/m05_14_admin_order_order_status_change_e2e_cases.md`（セレクタ様式の参考。
  一部行番号注記は旧版=本書§0実測が正）・SEED-M05-ORDERS（m05-01系共有シード。**本機能の破壊系では使わない**=§2）。

## §1 L1原子オラクル表

全31claim。en文言はen一次資料逐語（ja翻訳ゼロ）。BC/DOC印は§9に詳細。
期待値の正は本表のオラクルID（SEED値を期待の正にしない三段参照・不変側はS0スナップショット同値）。

| oracle_id | 観点 | claim | 逐語quote | 根拠(file:line) | LS |
|---|---|---|---|---|---|
| L1-M0514-001 | auth_rule | 未認証の GET `/%eccube_admin_route%/order/{id}/edit` は admin firewall（pattern `^/%eccube_admin_route%/`）の form_login により admin_login のログイン画面へ誘導（受注編集画面へ到達不可＝本操作利用不可） | `admin:`…`pattern: ['^/%eccube_admin_route%/',…]`…`login_path: admin_login`／「未認証｜利用不可。管理画面の認証要件によりログインへ誘導される。」 | sec:40-47／md:73,287 | 0 |
| L1-M0514-002 | auth_rule | 未認証の直接POST（mode=status_change）も認証配下＝処理されず、DB不変（**具体応答形（302/401等）は未契約＝要実機。claimは「処理されない」に限定**） | 「未認証・管理画面へ到達できない利用者｜受注編集（詳細）画面自体に到達できないため、本操作も利用できない。」 | md:73,287／sec:40-47 | 0 |
| L1-M0514-003 | http_status | 入口は `GET/POST /%eccube_admin_route%/order/{id}/edit`（route `admin_order_edit`・id=\d+=受注ID）。新規は `/order/new`（admin_order_new）。不存在idは NotFoundHttpException（HTTP404） | `#[Route(path: '/%eccube_admin_route%/order/{id}/edit', name: 'admin_order_edit', requirements: ['id' => '\d+'], methods: ['GET', 'POST'])]`／`throw new NotFoundHttpException();`／「指定 ID の受注が存在しない｜受注が見つからない（HTTP 404）として扱う。」 | Edit:146-147,204-217／md:70-71,315 | 0 |
| L1-M0514-004 | request契約 | 対応状況変更は受注編集フォーム（`#form1`・hidden `mode`）の **POST mode=status_change**。変更ボタン `.change-status` のJSが hidden mode を status_change にし、actionを受注編集画面パスへ戻して送信（clear_dateのtargetクエリを引き継がない）。変更先は `order[OrderStatus]`=対応状況ID（mapped=false）・フォームCSRF `order[_token]` 同梱 | `<form name="form1" id="form1" method="post" action="?">`＋`<input type="hidden" name="mode" value="">`／`$(document).on('click', '.change-status', function () { const $form = $('#form1'); $form.find('input[name="mode"]').val('status_change'); // clear-date 押下後の target 付き action を引きずらないように毎回ベースURLへ戻す $form.attr('action', '{{ url('admin_order_edit', {'id': Order.id }) }}').submit();`／`if ($request->get('mode') === 'status_change') { return $this->tryCommitOrderStatusChange(…); }`／「押下すると受注編集フォームの送信種別を status_change にし、フォームのアクションを受注編集（詳細）画面のパスへ戻したうえでフォームを送信する。」 | twig:789-790,530-536／Edit:504-505／OT:429-439／md:75,85,105,239 | 0 |
| L1-M0514-005 | display_field | 既存受注（Order.idあり）のみ、受注情報領域に「現在のステータス」行（見出し・値=`Order.OrderStatus.name`=mtb_order_status.nameのDB現在値）を表示。見出し文字列はテンプレート直書き（ロケール資源なし） | `{% if Order.id is not empty %}`…`<div class="col-3" data-bs-placement="top" title="現在のステータス">現在のステータス<i class="fa fa-lg ms-1"></i></div>`＋`<div class="col">{{ Order.OrderStatus.name }}</div>`／「受注情報領域に「現在のステータス」として現在の対応状況の表示名を表示し、その下に「対応状況」プルダウンを表示する。」 | twig:833-837／md:83,99,60 | 0 |
| L1-M0514-006 | display_field | 対応状況欄: ラベル=`admin.order.order_status` ja「対応状況」/en "Order Status"・tooltip=`tooltip.order.order_status` ja「新規受注登録以外は受注の対応状況を変更できます。1受注で出荷先が複数ある場合は、全て出荷されると対応状況が「出荷済」となります。」/en逐語・widget直下に `form_errors(form.OrderStatus)` | `<label class="col-3 col-form-label" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.order.order_status'\|trans }}">{{ 'admin.order.order_status'\|trans }}<i class="fa fa-question-circle fa-lg ms-1"></i></label>`＋`{{ form_widget(form.OrderStatus) }} {{ form_errors(form.OrderStatus) }}`／`admin.order.order_status: 対応状況`・`Order Status`／`tooltip.order.order_status:`（ja:3613/en:3227逐語） | twig:840-845／ja:2523,3613／en:2360,3227／md:83 | 1 |
| L1-M0514-007 | display_field | プルダウン（`#order_OrderStatus`・EntityType単一選択・NotBlank）: 選択肢=mtb_order_status全行を`sort_no`昇順で取得し、**遷移不可（can()偽）のステータスを除外**。**現在のステータス自身は除外処理をスキップして選択肢に残し、初期選択値になる（実装）＝設計書md:84,184「現在のステータス自身は出さない」と乖離=BC-DRAFT-M05-14-01**。仕様側期待=遷移可能な遷移先のみ | `$OrderStatuses = $this->orderStatusRepository->findBy([], ['sort_no' => 'ASC']);`…`// 同一ステータスはスキップ if ($Order->getOrderStatus()->getId() == $Status->getId()) { continue; } // 遷移できないステータスはリストから除外する. if (!$this->orderStateMachine->can($Order, $Status)) { $OrderStatuses->removeElement($Status); }`／`'constraints' => [new Assert\NotBlank()], 'mapped' => false, 'data' => $Order->getOrderStatus(),`／「選択肢は受注ステータス遷移の許可規則で絞り込まれた遷移先ステータスのみで構成する（現在のステータス自身は…選択肢に出さない…）。表示順は受注対応状況マスタの並び順の昇順。」 | OT:405-440（loop 417-425・add 429-439）／md:84,184,195 | 0 |
| L1-M0514-008 | state_machine | 遷移可否は Symfony workflow `order`（state_machine）の transitions 定義（`can`=enabled transition の to に変更先idが含まれるか）。遷移マトリクスの正は§3.1（m05-12 codex承認済み候補と同一config・cancel_return(15→5)含む） | `public function can(Order $Order, OrderStatus $OrderStatus, …): bool { return $this->getEnabledTransition(…) !== null; }`／「受注ステータス遷移の許可規則｜状態遷移の定義により、現在のステータスから到達できる遷移先を限定する仕組み。」 | SM:57-70／config:46-214／md:58,184 | 0 |
| L1-M0514-009 | state_machine | 決済処理中 PENDING(7)・購入処理中 PROCESSING(8) はどの transition の from にも現れない＝これらが現在状況の受注は遷移先0件（プルダウンの遷移先選択肢なし。実装では現在ステータスのみ残る=L1-007）。なお編集画面はこの2状態で登録系ボタンをdisabledにする | config:46-214 に from としての `(string) Status::PENDING`・`(string) Status::PROCESSING` 0出現（grep実測・m05-12 L1-011と同一根拠）／`{% set action_disabled = true %}`（PROCESSING/PENDING時）＋`… name="mode" value="register"{{ action_disabled ? ' disabled="disabled"' }}` | config:30-45,46-214／twig:757-762,1927 | 0 |
| L1-M0514-010 | behavior | 変更前後いずれかのステータスが取得できない（例: 空送信でOrderStatus=null）または**両者が同一**のとき: 何も変更せず当該受注の受注編集画面へ302リダイレクト（フラッシュなし・日時セットなし・更新者/更新日時の更新なし） | `$prevStatusId = $OriginOrder->getOrderStatus()?->getId(); $newStatusId = $TargetOrder->getOrderStatus()?->getId(); if ($prevStatusId === null \|\| $newStatusId === null \|\| $prevStatusId === $newStatusId) { return $this->redirectToRoute('admin_order_edit', ['id' => $TargetOrder->getId()]); }`／「変更前と変更後が同一ステータス｜変更せず受注編集（詳細）画面へリダイレクトする。日時セット・遷移適用・更新者更新を行わない。」「変更前後が同一ステータス｜メッセージなしで受注編集（詳細）画面を再表示する。」 | Edit:762-767／md:107,165,203-204 | 0 |
| L1-M0514-011 | behavior | フォーム不妥当の2経路: (a)**OrderItems明細サブフォーム невалид**→mode分岐前に return null＝**HTTP200で同画面再表示**（フォームエラー表示あり・DB不変） (b)**それ以外のform invalid**（OrderStatus空のNotBlank・choices外id・トークン不正等）→**エラー表示なしで302リダイレクト**・DB不変。設計書は(a)(b)を区別せず「エラー表示」（md:151,277,302）と「リダイレクト」（md:108）を併記＝**DOC-DRAFT-M05-14-01／表示なし側はBC-DRAFT-M05-14-02** | `if (!$form->isSubmitted() \|\| !$form['OrderItems']->isValid()) { return null; }`（→Template再表示）／`if (!$form->isValid()) { return $this->redirectToRoute('admin_order_edit', …); }`／「受注フォーム全体が妥当でない場合は、何も変更せず受注編集（詳細）画面へリダイレクトする。」⇔「許可されない遷移先を強制送信｜受注ステータス検証でステータス変更不可のエラーを表示し…」 | Edit:500-502,769-771／md:106-108,151,166,277,302 | 0 |
| L1-M0514-012 | validation_rule | 許可されない遷移先の強制送信（レンダリングされた選択肢に無いid）: EntityTypeのchoices違反でform invalid→L1-011(b)の**無表示リダイレクト・DB不変**。`admin.order.failed_to_change_status__short` のFormError分岐（変更先がchoices内かつcan()偽）は、choicesが同一リクエスト内で同じcan()により構築されるため**status_change経路では実質到達不能**（=BC-DRAFT-M05-14-02の一部） | `if ($oldStatus->getId() != $newStatus->getId()) { if (!$this->orderStateMachine->can($Order, $newStatus)) { $form['OrderStatus']->addError(new FormError(trans('admin.order.failed_to_change_status__short', ['%from%' => $oldStatus->getName(), '%to%' => $newStatus->getName(),]))); } }`／「許可されない遷移はステータス変更不可のエラーを受注ステータス項目に表示する。」 | OT:505-533（error 520-531）・417-425／Edit:769-771／md:151,205,278,302 | 0 |
| L1-M0514-013 | db_effect | 変更成立時: workflow適用（onCompletedでOrderStatus再設定）→ `dtb_order.order_status_id`=変更先id・`dtb_order.operator_id`=操作中の管理者（getMember）・`dtb_order.update_date`=現在日時（T1≦値≦T2）で永続化 | `$this->orderStateMachine->apply($TargetOrder, $NewOrderStatus);`…`$TargetOrder->setMember($this->getMember())->setUpdateDate(new \DateTime()); $this->entityManager->persist($TargetOrder);`／`#[ORM\JoinColumn(name: 'operator_id', referencedColumnName: 'id')] #[ORM\ManyToOne(targetEntity: Member::class)]`／「変更成立時に受注の更新者を操作中の管理者、更新日時を現在日時で更新する。」 | Edit:800-808／SM:187-195／Order:649-651,542-543／md:111,130,188,257 | 0 |
| L1-M0514-014 | db_effect | 変更後=発送済みDELIVERED(5)かつ変更前≠5のとき: `dtb_order.shipping_date` と**受注配下の全 `dtb_shipping.shipping_date`** に**同一の現在日時**（単一の`$now`）を**無条件セット**（既存値も上書き=「条件成立時に常にセット」） | `$now = new \DateTime(); $statusChangedToDelivered = $newStatusId === OrderStatus::DELIVERED && $prevStatusId !== OrderStatus::DELIVERED; if ($statusChangedToDelivered) { $TargetOrder->setShippingDate($now); foreach ($TargetOrder->getShippings() as $Shipping) { $Shipping->setShippingDate($now); } }`／「出荷完了へ遷移したとき、受注の出荷日と各配送の出荷日に同一の現在日時をセットする。」「出荷日は条件成立時に常にセットする。」 | Edit:773-780／md:124,186,219,256,258 | 0 |
| L1-M0514-015 | db_effect | 変更後=取消CANCEL(3)かつ変更前≠3かつ**取消日未設定**のとき（=初回キャンセル）: `dtb_order.cancel_date`=現在日時。取消日設定済みならセットしない（上書きなし） | `$isFirstCancellation = $newStatusId === OrderStatus::CANCEL && $prevStatusId !== OrderStatus::CANCEL && $TargetOrder->getCancelDate() === null; if ($isFirstCancellation) { $TargetOrder->setCancelDate($now); }`／「取消（CANCEL）かつ変更前が取消でなく、取消日が未設定｜受注の取消日に現在日時をセットする。」「取消日・入金日・確認日は既設定のときは上書きしない。」 | Edit:782-785／md:125,186,206,254 | 0 |
| L1-M0514-016 | db_effect | 変更後=入金済みPAID(6)かつ変更前≠6かつ入金日未設定のとき: `dtb_order.payment_date`=現在日時（コントローラ側の補完）。**2→6（`paywait`）・3等→6（`admin_to_paid`）はリスナなし＝既設定payment_dateは不変**。**1→6は transition `pay` が選択されリスナ `updatePaymentDate` が payment_date を無条件セット＝既設定でも上書き（BC-DRAFT-M05-14-04: md:186,206「上書きしない」と乖離）** | `if ($newStatusId === OrderStatus::PAID && $prevStatusId !== OrderStatus::PAID && $TargetOrder->getPaymentDate() === null) { $TargetOrder->setPaymentDate($now); }`／`'workflow.order.transition.pay' => ['updatePaymentDate'],`＋`public function updatePaymentDate(Event $event): void { … $Order->setPaymentDate(new \DateTime()); }`／`'pay' => ['from' => (string) Status::NEW, 'to' => (string) Status::PAID,]`／「入金日は受注ステータス遷移側でも入金遷移時にセットされるが、本操作では遷移適用の前に未設定時の入金日を補完する。」 | Edit:786-788／SM:95,111-116／config:47-50／md:126,134,186,206,253 | 0 |
| L1-M0514-017 | db_effect | 変更後=ピック中PICKING(10)かつ変更前≠10かつ確認日未設定のとき: `dtb_order.confirm_date`=現在日時（既設定は上書きなし・PICKINGのリスナなし） | `if ($newStatusId === OrderStatus::PICKING && $prevStatusId !== OrderStatus::PICKING && $TargetOrder->getConfirmDate() === null) { $TargetOrder->setConfirmDate($now); }`／「ピック中（PICKING）かつ変更前がピック中でなく、確認日が未設定｜受注の確認日に現在日時をセットする。」 | Edit:789-791／SM:91-103（PICKINGリスナ0件）／md:127,186,255 | 0 |
| L1-M0514-018 | db_effect | 取消系遷移（`cancel`/`admin_cancel`）のリスナ=rollbackStock＋rollbackUsePoint: (a)在庫無制限でない明細の受注店舗対応 `dtb_product_stock.stock` を明細数量ぶん**bcadd加算**（悲観ロック・在庫総原価戻し）＋**在庫履歴行INSERT**（キャンセル時の在庫戻し） (b)使用ポイント（Order.spended_points≠0・会員+player存在時）を `dtb_player.point` へ**返却**＋`dtb_point_history` へ+行INSERT | `'workflow.order.transition.cancel' => [['rollbackStock'], ['rollbackUsePoint']], 'workflow.order.transition.admin_cancel' => [['rollbackStock'], ['rollbackUsePoint']],`／`$newStock = bcadd($currentStock, $quantity, 0);`…`$stockChangeReason = "キャンセル時の在庫戻し 注文番号：…"`…`$this->saveStockHistory(`／`public function rollback(…): void { … $this->pointService->rollbackSpentPoints($itemHolder); }`（rollbackSpentPoints→player.point+spended・履歴save） | SM:96-97,133-138,155-160／Stock:65-67,91,97,126,141-153／PtProc:125-132／PtSvc:88-92,129-160／md:242,40 | 0 |
| L1-M0514-019 | db_effect | **初回キャンセル時**（L1-015成立時）は追加で `cancelOrderPoints`。**発火条件=会員受注（Customer実体）かつ対応するplayer行が存在するときのみ**（ゲスト受注・player不在時は早期returnで**何もしない**=gained_points不変・履歴も残る）。条件成立時: `dtb_order.gained_points`=0・当該受注の `dtb_point_history` **全行をDELETE**（リスナが同一トランザクション内でINSERTした返却行を含む・削除はΣ判定より前のループで実施）・**Σpoint_change≠0のときのみ** `dtb_player.point` からΣを差し戻し（**Σ=0のときは残高不変のまま早期return**〔行削除とgained_points=0は実施済み〕）。本機能唯一の行削除経路 | `$Customer = $Order->getCustomer(); if (!$Customer instanceof Customer) { return; } $Player = $this->playerRepository->findOneByCustomer($Customer); if ($Player === null) { return; }`／`$Order->setGainedPoints(0); $this->entityManager->persist($Order);`／`$pointDiffTotal = 0; $PointHistories = …findBy(['Order' => $Order]); foreach ($PointHistories as $PointHistory) { $pointDiffTotal += (int) $PointHistory->getPointChange(); $this->entityManager->remove($PointHistory); }`／`if ($pointDiffTotal === 0) { return; }`／`$Player->setPoint($Player->getPoint() - $pointDiffTotal); $this->entityManager->persist($Player);`／`if ($isFirstCancellation) { $this->pointService->cancelOrderPoints($TargetOrder); }` | PtSvc:96-126（ガード98-106・gained_points=108-109・削除ループ111-118・Σ=0早期return=120-122・差戻し124-125）／Edit:782-784,816-818／md:242 | 0 |
| L1-M0514-020 | db_effect | 取消(3)→対応中(4)は transition `back_to_in_progress` のリスナ **commitStock＋commitUsePoint**が発火する（**実装観測の確定期待**）: 在庫無制限でない明細について `dtb_product_stock.stock` を明細数量ぶん**再減算**（`stock=S0−qty` のΔ・bcsub）＋**受注減算種別の在庫履歴+1行INSERT**・使用ポイント再徴収（spended≠0の会員+player時）。**設計書MSG-003「在庫の変動はありません」（md:159）はこの挙動と乖離＝設計側期待はBC-DRAFT-M05-14-03へ隔離（×確定・§9）＝本claimと混在させない**。在庫数量不足時（bcsub後に負値）は ShoppingException throw・status_change経路にcatchなし＝未捕捉伝播（BC-DRAFT-M05-14-05・実応答は断定せず要実機） | `'workflow.order.transition.back_to_in_progress' => [['commitStock'], ['commitUsePoint']],`／`public function commitStock(…) { … $this->stockReduceProcessor->prepare(…); }`／`if ($reduceStock) { // 在庫数・原価を引き落とし $newStock = bcsub($currentStock, $quantity, 0); if (bccomp($newStock, '0', 0) < 0) { throw new ShoppingException(trans('purchase_flow.over_stock', ['%name%' => $ProductClass->formattedProductName()])); }`／ダイアログ逐語=L1-026 | SM:98,145-150,123-128／Stock:56-58,**108-113**（数量不足throw=111-113。93-95は**在庫レコード不存在**の別分岐）・141-153／twig:660-666／md:159,40,314 | 0 |
| L1-M0514-021 | db_effect | 発送済みへ新規遷移時（L1-014条件）: `gainPoints`=会員受注かつplayerありかつ `gained_points`≠0 のときのみ `dtb_player.point += gained_points`＋`dtb_point_history` へ購入種別の+行INSERT。さらに player の `smaregi_id` 非空かつgained≠0なら **`dtb_messenger_job` へ連携ジョブ行INSERT（status=PENDING・同一トランザクション）**・commit成功後にメッセージ投入（dispatch後のジョブ状態遷移は要実機）。workflow側の commitAddPoint/rollbackAddPoint は**no-op**（Hareruyaは Order.gained_points/Player.point 側で扱う） | `if ($statusChangedToDelivered) { $this->pointService->gainPoints($TargetOrder); … $gainPointJob = $this->smaregiOrderGainPointEventService->registerGainPointJob($TargetOrder); }`／`$Player->setPoint($Player->getPoint() + $gainedPoints);`…`$this->pointHistoryEntityManager->save(`／`$job = new MessengerJob(); … $job->setStatus(MessengerJob::STATUS_PENDING); … $this->entityManager->persist($job);`／`public function commitAddPoint(Event $event): void { // 何もしない }` | Edit:810-815,827-830／PtSvc:42-73／Smaregi:45-65,71-108／SM:168-172,178-182／md:112,131,187 | 0 |
| L1-M0514-022 | db_effect | 受注に外部連携コード（smaregi_code）がありかつ変更後≠取消のとき、外部連携サービスへ商品情報連携を呼び出す（`postSmaregiProcess(['product'])`）。連携の成否・内容は別機能の設計が正（本候補のSEEDは smaregi_code=NULL で外部呼出を回避） | `if ($TargetOrder->getSmaregiCode() && $TargetOrder->getOrderStatus() !== null && $TargetOrder->getOrderStatus()->getId() !== OrderStatus::CANCEL) { $this->smaregiApiService->postSmaregiProcess($TargetOrder, ['product']); }`／「受注に外部連携コードがあり、かつ変更後ステータスが取消でない場合は、外部連携サービスへ商品情報を連携する。」「連携の成否判定と再実行の扱いは各連携機能の設計を正とする。」 | Edit:820-824／md:113,132,189,221,229 | 0 |
| L1-M0514-023 | tx | 遷移適用・更新者/更新日時・ポイント反映・連携ジョブ積みは `wrapInTransaction` の**単一トランザクション内**（成功時に最終flush+commit・失敗時rollback）。apply失敗（`\InvalidArgumentException` throw=SM:39-47）はstatus_change経路ではform段の遮断（L1-012）により実質到達不能＝md:110,134の「遷移適用失敗→巻き戻し」シナリオはこの経路で観測不能（DB不変が代理観測） | `$this->entityManager->wrapInTransaction(function () use (…) { … });`／`$transition = $this->getEnabledTransition(…); if ($transition) { … } else { throw new \InvalidArgumentException(); }`／「遷移適用・更新者更新・ポイント反映・外部連携はひとつのトランザクション内で行い、遷移適用が失敗したときは巻き戻す。」 | Edit:800-825／SM:39-47／md:110,134,218,335 | 0 |
| L1-M0514-024 | message | 成立時フラッシュ: 変更後=取消→`admin.order.cancel.complete` ja「全キャンセルが完了しました。」／en "Order cancellation completed."（**en:2447実在＝md:144「日本語のみ」はDOC-DRAFT-M05-14-02**）・取消以外→`admin.order.save.complete` ja「保存しました」／en "Saved" | `if ($newStatusId === OrderStatus::CANCEL) { $this->addSuccess('admin.order.cancel.complete', 'admin'); } else { $this->addSuccess('admin.order.save.complete', 'admin'); }`／`admin.order.cancel.complete: 全キャンセルが完了しました。`・`Order cancellation completed.`／`admin.order.save.complete: 保存しました`・`Saved` | Edit:832-836／ja:2612,2614／en:2447,2449／md:143-145 | 1 |
| L1-M0514-025 | message | 遷移不可エラー文言（キー`admin.order.failed_to_change_status__short`）: ja「%from% から %to% にはステータス変更できません」／en "You are not allowed to change the status from %from% to %to%"（%from%/%to%=mtb_order_status.nameのDB現在値）。表示位置=プルダウン直下 `form_errors(form.OrderStatus)`。**ただしstatus_change経路では表示に到達しない（L1-011(b)/L1-012=BC-DRAFT-M05-14-02。期待は仕様側のまま保持）** | `admin.order.failed_to_change_status__short: "%from% から %to% にはステータス変更できません"`／`"You are not allowed to change the status from %from% to %to%"`／表示位置=twig:844 | ja:2609／en:2446／OT:520-531／twig:844／md:151,178 | 1 |
| L1-M0514-026 | dialog | 確認ダイアログ（`#form1` submit時・mode=register/status_changeのみ発火・ブラウザconfirm・**スクリプト直書きjaでenロケール資源なし**）: **MSG-001**=選択=取消∧変更前≠取消∧取消日設定済み→「過去にキャンセルされているため、在庫数やポイントの変動はありません。\nキャンセルしてもよろしいですか？」／**MSG-002**=選択=取消∧変更前≠取消（取消日未設定）→「全キャンセル時、在庫数等は以下のように変動します。\nキャンセルしてもよろしいですか？\n在庫数：キャンセル分増加\n使用ポイント：払い戻し\n付与済みポイント：取り消し」／**MSG-003**=変更前=取消∧選択≠取消→「キャンセルからステータスを変更する場合は、在庫の変動はありません。\n別途、在庫の減算操作を行ってください。」。OK→送信続行・キャンセル→送信中止（サーバへ届かない） | `return targetMode === 'register' \|\| targetMode === 'status_change';`／`if ($orderStatus.length && orderStatusVal === orderStatusCancelId && renderedInitialOrderStatusId !== … CANCEL && hasCancelDate) { if (!confirm("過去にキャンセルされているため、…")) { return false; } } else if (… ) { if (!confirm("全キャンセル時、…")) { return false; } } else if ($orderStatus.length && renderedInitialOrderStatusId === … CANCEL && String(renderedInitialOrderStatusId) !== orderStatusVal) { if (!confirm("キャンセルからステータスを変更する場合は、…")) { return false; } … }`／`$('#form1').on('submit', function (e) { if (!shouldRunRegisterValidationChecks(e, this)) { return true; } return runRegisterValidationChecks(); });` | twig:617-666（判定634・MSG-001=646-652・MSG-002=653-659・MSG-003=660-666）・739-745／md:86,104,155-159,171-177 | 0 |
| L1-M0514-027 | nav | 変更成立時は当該受注の受注編集画面へ**302リダイレクト**（`admin_order_edit` 同一id）し、リダイレクト後画面にフラッシュ（L1-024）を表示 | `return $this->redirectToRoute('admin_order_edit', ['id' => $TargetOrder->getId()]);`／「対応状況変更が成立｜同じ受注編集（詳細）画面へリダイレクトし、フラッシュメッセージを表示。」 | Edit:838／md:71,114,300 | 0 |
| L1-M0514-028 | display_field | 新規受注登録画面（/order/new・Order.idなし）: OrderStatusフォーム自体を追加しない＝対応状況プルダウン非表示・「現在のステータス」行非表示・変更ボタン（`.change-status`）非表示 | `if (null === $Order \|\| null === $Order->getId()) { return; }`（addOrderStatusForm冒頭）／`{% if Order.id is not empty %}`（現在のステータス・widget・ボタンの各ガード）／「新規受注では対応状況プルダウンと対応状況変更操作を表示しない。」 | OT:408-411／twig:833,842,985-991／md:72,289 | 0 |
| L1-M0514-029 | 整合 | プルダウン選択肢と現在のステータス表示は**画面表示時点**の受注ステータスに基づく（表示後に他操作で変わっても表示中の画面は自動更新されない=再読込で反映）。表示領域を再取得するJS機構はedit.twigに存在しない | 「参照時点｜遷移先プルダウンの選択肢と現在のステータス表示は、受注編集（詳細）画面表示時点の受注ステータスに基づく。表示後に他操作でステータスが変わっても、表示中のプルダウンは自動更新しない。」 | md:217／twig:833-845（サーバレンダのみ・ポーリング/リロードJS 0件=実測） | 0 |
| L1-M0514-030 | 整合 | 受注一覧で表示するステータス・各日時は本操作の保存完了後の永続化済みデータに従う（変更後に一覧を開くとDB現在値が表示される） | 「一覧との整合｜受注一覧で表示するステータス・各日時は、本操作の保存完了後の永続化済みデータに従う。」 | md:220 | 0 |
| L1-M0514-031 | db_effect | 本操作は `dtb_order`・`dtb_shipping` に行を追加・削除しない（行数不変。tryCommitOrderStatusChangeはfind済みエンティティのsetterのみ・new/removeなし=Edit:760-839実測）。変更列は order_status_id・各日時・operator_id・update_date（＋遷移副産物の別表）に限られ、**それ以外の列はS0スナップショットと同値**。メール送信呼出なし（メールはM05-15別機能）。※行削除は別表 `dtb_point_history` のみに存在（L1-019）・行追加は副産物別表（在庫履歴・ポイント履歴・messenger job）のみ | 「登録/更新｜dtb_order / dtb_shipping / mtb_order_status｜当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。」／「受注完了・出荷完了等に伴うメール送信（M05-15）」=本書で扱わない | Edit:760-839（mail呼出0件・new/remove 0件=実測）／md:37,264-269 | 0 |

## §2 SEED三段参照設計（全て `@TBD-D5`・**破壊系の使い捨て隔離＋復元**）

期待値の正は**L1オラクルID**（三段参照: 期待=L1→前提状態=SEED→実測=db.ts観測値）。
本機能は **`dtb_order`（order_status_id・各日時・operator_id・update_date・gained_points）・
`dtb_shipping.shipping_date`・`dtb_product_stock.stock`・`dtb_player.point`・`dtb_point_history`（INSERT/DELETE）・
在庫履歴（INSERT）・`dtb_messenger_job`（INSERT）に触れる破壊的操作**。次を厳守する（m05-12のD5契約踏襲）:

1. **書込対象は専用の使い捨てSEED帯のみ**（新設 SEED-M05-14-*・id帯9000014xx）。共有シード
   SEED-M05-ORDERS（900000311-350）・m05-12帯（9000012xx）と**帯を分離**し、共有帯・実データには書かない。
2. **afterEach/teardownでSEED再適用（UPSERT）＋副産物削除**。主対象列はUPDATEのみのためUPSERT再適用で戻るが、
   **本機能はINSERT副産物（在庫履歴・dtb_point_history返却行・dtb_messenger_job）とDELETE
   （dtb_point_history既存行=L1-019）の両方を持つ**。D5 manifestで次を契約（`@TBD-D5`）:
   (a) **削除対象の特定**=在庫履歴（product_class_id=900001432）・dtb_messenger_job（payload_summaryの
   orderId帯9000014xx）・dtb_point_history（order_id帯9000014xx）をSEED帯キー÷run-idで特定するDELETE条件
   (b) **復元順序**=①副産物行DELETE→②dtb_product_stock UPSERT→③dtb_order/dtb_shipping UPSERT→
   ④dtb_player/dtb_customer UPSERT→⑤dtb_point_history**初期行の再INSERT**（ORD-MEMの-100行）
   （FK依存順・履歴を先に消してから在庫値・ポイント残高を戻す）
   (c) **失敗時cleanup**=テスト失敗・中断時も必ず走るteardownで(a)(b)を実行し、適用後に検証クエリ
   （帯行の初期値一致・副産物0件・point_history初期行1件）でズレを検知する。
3. 共有環境では実行しない（フレッシュDB/serial前提。`e2e-standard-run-requirements` 準拠）。
4. **SEED初期値を期待の正にしない（S0スナップショット同値方式=m05-13踏襲）**: 各ケースは操作前に対象行を
   db.tsでスナップショット（S0）し、「不変」の期待は**S0との同値**で判定する（SEED定義値との比較はしない）。
   変更側の期待はL1（§1・§3）から導出する。
5. **外部連携の遮断**: 全SEED受注は `smaregi_code=NULL`（L1-022の外部API呼出を発生させない）。
   スマレジ連携ジョブ観測ケース（C-046）のみ player.smaregi_id を非空にし、**DB内のジョブ行INSERT**だけを
   観測する（メッセージバス以降は要実機=§9）。

| SEEDセットID | 内容（初期値） | 用途 |
|---|---|---|
| SEED-M01-ADMIN | 管理者ログイン（共通・member既知id） | 全ケースの認証・operator_id期待 |
| SEED-M05-14-PRODUCT | 商品帯: dtb_product 900001431／dtb_product_class 900001432（`stock_unlimited=false`）／dtb_product_stock 900001433（stock=50・**受注店舗base_infoに対応する在庫**=getProductStockByEccube(BaseInfo)で引くため店舗対応必須〔Stock:91〕） | C-045在庫戻し・C-048在庫再減算 |
| SEED-M05-14-ORDERS | 使い捨て受注帯（order_no接頭辞 `E2E-M0514-`・全受注 smaregi_code=NULL・明細→900001432 qty=2・登録POSTでなくstatus_change POSTが検証成功する完全受注行セット）: **ORD-NEW**=dtb_order 900001411（status=1・payment/cancel/confirm/shipping_date=NULL・ゲスト・出荷 dtb_shipping 900001421 shipping_date=NULL）／**ORD-PEND**=900001412（status=7・出荷900001422）／**ORD-CXL**=900001413（status=3・cancel_date設定済み・出荷900001423）／**ORD-PAYW**=900001414（status=2・payment_date=NULL・出荷900001424）／**ORD-PAYW2**=900001415（status=2・**payment_date=設定済み**・出荷900001425）／**ORD-NEW2**=900001416（status=1・**payment_date=設定済み**・出荷900001426）／**ORD-DLV**=900001417（status=5・shipping_date設定済み・出荷900001427 shipping_date設定済み）／**ORD-RECXL**=900001418（status=4・**cancel_date=設定済み**〔過去に取消→対応中へ戻した受注の再現〕・出荷900001428）／**ORD-PAID**=900001419（status=6・confirm_date=NULL・出荷900001429）／**ORD-MULTI**=900001420（status=1・出荷900001430と900001434、とも shipping_date=NULL） | 遷移系・同一スキップ・日時セット系・配送完了系 |
| SEED-M05-14-MEMBER | 会員帯: dtb_customer 900001401＋dtb_player 900001402（point=1000・**smaregi_id='E2E-SMRG-1'**）／**ORD-MEM**=dtb_order 900001435（status=1・customer=900001401・**gained_points=50・spended_points=100**・出荷900001436）＋dtb_point_history 900001441（Order=900001435・point_change=-100〔購入時使用〕）。受注のNOT NULL/FK完全行セットは**D5 manifest契約で確定**（ここではセット設計のみ・捏造しない） | ポイント付与・取消時ポイント削除・messenger job |

## §3 状態遷移マトリクス・遷移連動マトリクス

### §3.1 状態遷移マトリクス（正=order_state_machine.php。m05-12 codex承認済み候補の§3.1と同一configを再利用・cancel_return含む）

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
| from 7・from 8 | **全変更先へ遷移不可**（fromに現れない=L1-009） | — |

- 同一idは遷移定義に現れず、プルダウンには実装が現在ステータスを残す（L1-007・BC-1）。同一送信は
  遷移判定前に無変更リダイレクト（L1-010）。
- transitionは config 順の先勝ち（SM:72-85）: 1→6=`pay`（updatePaymentDateリスナ=BC-4）・2→6=`paywait`・
  1→3=`cancel`・1→5=`ship`・3→4=`back_to_in_progress`（commitStock/commitUsePoint=BC-3）。

### §3.2 遷移連動マトリクス（本機能=status_change経路の副作用。正=EditController+SM）

| 変更先（新規遷移） | 日時セット（コントローラ） | ポイント | 在庫 | 外部連携 | メール |
|---|---|---|---|---|---|
| 5 DELIVERED | order.shipping_date＋全shipping.shipping_date=同一now（無条件・L1-014） | gainPoints: player.point+=gained_points＋履歴INSERT（L1-021） | なし（commitAddPointはno-op） | smaregi_id有→dtb_messenger_job INSERT＋commit後dispatch／smaregi_code有→product連携（L1-021,022） | なし（L1-031） |
| 3 CANCEL | cancel_date（null時のみ・L1-015） | rollbackUsePoint: player.point+=spended＋履歴INSERT→初回のみcancelOrderPointsが履歴全DELETE・gained_points=0・player.point差戻し（L1-018,019） | rollbackStock: stock+=qty＋在庫履歴INSERT（L1-018） | 取消は連携対象外（L1-022） | なし |
| 6 PAID | payment_date（null時のみ）。**1→6はpayリスナが無条件上書き=BC-4**（L1-016） | なし | なし | smaregi_code有→product連携 | なし |
| 10 PICKING | confirm_date（null時のみ・L1-017） | なし | なし | 同上 | なし |
| 4 IN_PROGRESS（from 3） | なし | commitUsePoint: 使用ポイント再徴収（L1-020） | commitStock: stock=S0−qty＋在庫履歴+1行INSERT（**実装観測の確定期待**。MSG-003文言との乖離はBC-3へ隔離=§9） | 同上 | なし |
| その他（1,2,9,12,13,14,15） | なし | なし（15→5=cancel_returnはcommitUsePoint/commitAddPoint〔後者no-op〕） | なし | 同上 | なし |

## §4 実行可能グレード14列TSV（候補・**自己完結＝全34行を実体掲載**）

- 期待値の正は `[L1:...]`（§1）。fixtureは `@TBD-D5`。URLの `%eccube_admin_route%` は環境値。
- request契約は§6.1（**レンダ済みフォームの再送信方式**: GET編集画面→全 `order[...]` フィールド＋`_token` を
  収穫→`order[OrderStatus]` と hidden `mode=status_change` を設定してPOST）。
- **（BC-n）印の行は §9 の BC-DRAFT-M05-14-0n の影響下＝ee HEADでは実走×見込み**（期待は仕様側のまま維持。
  裁定=codex/発注者）。破壊系は§2の使い捨てSEED帯＋S0スナップショット＋afterEach復元前提。

### §4.1 bound対応候補行（34行=ja30＋-EN4。§8の101対応表が参照する全行）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m05-14_admin_order_order_status_change	E2E-M0514C-001	IT-15	権限	P1	未認証で受注編集画面URLへ直接アクセス→ログイン画面へ誘導	未ログイン／SEED-M05-14-ORDERS	—	1. GET /%eccube_admin_route%/order/900001411/edit	admin_login のログイン画面へリダイレクトされ受注編集画面（本操作の入口）へ到達しない [L1:L1-M0514-001; fixture:SEED-M05-14-ORDERS@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-002	IT-15	権限	P1	未認証で status_change POSTを直接送信→処理されない（非UI）	未ログイン／SEED-M05-14-ORDERS(ORD-NEW=1)	認証Cookieなしで POST /order/900001411/edit（mode=status_change・order[OrderStatus]=6）	1. 未認証セッションでPOST送信 2. db.tsで order_status_id 照会	処理されない（保存フラッシュ・変更が発生しない。具体応答形は要実機=§9）・dtb_order.order_status_id=1 のままS0同値 [L1:L1-M0514-002; fixture:SEED-M05-14-ORDERS@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-010	IT-25	表示	P1	受注編集画面に「現在のステータス」表示・対応状況ラベル・プルダウン・変更ボタンが表示される（ja）	ログイン済(SEED-M01-ADMIN)／SEED-M05-14-ORDERS(ORD-NEW=1)	—	1. GET /order/900001411/edit 2. db.tsで SELECT name FROM mtb_order_status WHERE id=1 を照会 3. 現在のステータス行・ラベル「対応状況」・tooltip・#order_OrderStatus・.change-status の存在と文言を読む	「現在のステータス」行の値=DB照会名と一致・ラベル「対応状況」＋tooltip（ja:3613逐語）・プルダウン#order_OrderStatusと変更ボタンが表示され、画面はエラーなく表示される。本操作の入力UIは対応状況プルダウンのみ [L1:L1-M0514-005,L1-M0514-006,L1-M0514-029; fixture:SEED-M05-14-ORDERS@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-010-EN	IT-25	表示	P3	対応状況ラベル・tooltip（en）	ログイン済（en管理UIセッション）／SEED-M05-14-ORDERS	—	同上	ラベル"Order Status"・tooltip=en:3227逐語。「現在のステータス」見出しはテンプレート直書きjaのままの見込み（ロケール資源なし=L1-005・要実機） [L1:L1-M0514-006,L1-M0514-005]				
m05-14_admin_order_order_status_change	E2E-M0514C-011	IT-02	プルダウン	P1	プルダウンは単一選択・sort_no昇順・遷移不可ステータスを含まない	ログイン済／SEED-M05-14-ORDERS(ORD-NEW=1)	—	1. GET /order/900001411/edit 2. #order_OrderStatus の option 列（value,text）を読む 3. db.tsで SELECT id,name FROM mtb_order_status ORDER BY sort_no と§3.1の from=1 の到達可能集合 {2,3,4,5,6,13,14,15…※§3.1導出} を突合	select要素は単一選択（multiple属性なし）・optionの並びはsort_no昇順の部分列・§3.1で from=1 から到達不可のステータス（7,8,9,10,12等）が選択肢に現れない [L1:L1-M0514-007,L1-M0514-008; fixture:SEED-M05-14-ORDERS@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-012	IT-02	プルダウン	P2	（BC-1）現在のステータス自身は選択肢に出さない【仕様側期待】	ログイン済／SEED-M05-14-ORDERS(ORD-NEW=1)	—	1. GET /order/900001411/edit 2. #order_OrderStatus の option value 集合に現在ステータスid=1 が含まれないことを読む	【仕様側期待】選択肢は遷移先のみで現在のステータス自身（id=1）を含まない [L1:L1-M0514-007]（**BC-DRAFT-M05-14-01: 実装は現在ステータスを選択肢に残し初期選択にする＝実走×見込み**）				
m05-14_admin_order_order_status_change	E2E-M0514C-013	IT-15	遷移限定	P1	決済処理中(7)の受注は遷移先の選択肢が存在しない	ログイン済／SEED-M05-14-ORDERS(ORD-PEND=7)	—	1. GET /order/900001412/edit 2. #order_OrderStatus の option 列を読む	from=7 はどのtransitionのfromにも現れないため遷移先の選択肢が0件（実装では現在ステータスのみ残る=L1-007。登録系ボタンはdisabled） [L1:L1-M0514-009,L1-M0514-007; fixture:SEED-M05-14-ORDERS@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-014	IT-25	新規画面	P1	新規受注登録画面はプルダウン・現在のステータス・変更ボタンを表示しない	ログイン済	—	1. GET /%eccube_admin_route%/order/new 2. #order_OrderStatus・「現在のステータス」行・.change-status の不存在を読む	いずれも表示されない（OrderStatusフォーム自体が追加されない） [L1:L1-M0514-028]				
m05-14_admin_order_order_status_change	E2E-M0514C-015	IT-25	参照時点	P1	表示後に他セッションで変更されても表示中の画面は自動更新されない	ログイン済（セッションA/B）／SEED-M05-14-ORDERS(ORD-NEW=1)	Bは§6.1契約で 1→6 のstatus_change POST	1. Aで GET /order/900001411/edit（現在のステータス表示を記録） 2. Bで 1→6 を成立させる（db.tsで=6確認） 3. Aの表示中画面の現在のステータス・プルダウンが表示時点のまま変わらないことを読む 4. Aで再読込→DB現在値で再表示（afterEach: SEED再適用）	手順3で表示は自動更新されない（表示時点の値のまま）・手順4の再読込後は変更後ステータスに基づく表示 [L1:L1-M0514-029,L1-M0514-030; fixture:SEED-M05-14-ORDERS@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-016	IT-12	ボタンJS	P1	変更ボタン押下で mode=status_change・actionが編集画面パスへ戻り送信される	ログイン済／SEED-M05-14-ORDERS(ORD-NEW=1)	プルダウンで遷移可能先を選択	1. GET /order/900001411/edit 2. network監視で .change-status 押下 3. 送信リクエストのURL・mode・order[OrderStatus] を読む	POST先=/%eccube_admin_route%/order/900001411/edit（targetクエリなし）・body に mode=status_change と選択した order[OrderStatus] が含まれる [L1:L1-M0514-004; fixture:SEED-M05-14-ORDERS@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-040	IT-26	更新成功	P1	許可遷移（1→6）で保存フラッシュ・リダイレクト・order_status_id/operator_id/update_dateが更新（ja）	ログイン済セッション／SEED-M05-14-ORDERS(ORD-NEW=1)	§6.1契約: mode=status_change・order[OrderStatus]=6	1. db.tsでS0スナップショット取得・T1=now()記録 2. POST送信 3. 302で /order/900001411/edit へ戻りフラッシュを読む 4. db.tsでT2=now()・order_status_id・operator_id・update_date・payment_date・他列を照会（afterEach: SEED再適用）	302→同一受注の編集画面・フラッシュ「保存しました」・order_status_id=6（§3.1 pay）・operator_id=ログイン管理者id・update_date∈[T1,T2]・payment_date∈[T1,T2]（初期NULL→payリスナ/補完でセット）・**上記以外の列はS0同値**（本操作の入力=プルダウン選択のみ・保存先列=dtb_order.order_status_id） [L1:L1-M0514-013,L1-M0514-016,L1-M0514-024,L1-M0514-027,L1-M0514-031,L1-M0514-008; fixture:SEED-M05-14-ORDERS@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-040-EN	IT-26	更新成功	P2	保存フラッシュ（en）	ログイン済（en管理UIセッション）／SEED-M05-14-ORDERS	同上	同上	フラッシュ="Saved"（en:2449逐語） [L1:L1-M0514-024]				
m05-14_admin_order_order_status_change	E2E-M0514C-041	IT-33	不正遷移	P1	禁止遷移の強制送信（7→6）は変更されず受注編集画面へ戻る・全列S0同値	ログイン済セッション／SEED-M05-14-ORDERS(ORD-PEND=7)	§6.1契約で order[OrderStatus]=6 を強制設定（レンダ選択肢に無いid）	1. db.tsでS0スナップショット（日時列含む全対象列） 2. POST送信 3. 応答（リダイレクト先）を読む 4. db.tsで全対象列を再照会	【主判定・HEADで成立】変更されず /order/900001412/edit へ戻る（成立フラッシュなし）・order_status_id=7 のまま**日時列含め全列S0同値**（from7の遷移0件=§3.1・トランザクション未突入=メモリ上の日時セットも非永続化）。【仕様側期待=BC-2】プルダウン直下に「<FROM名> から <TO名> にはステータス変更できません」（%from%/%to%=DB名）を表示（**BC-DRAFT-M05-14-02: 実装は無表示リダイレクト＝表示成分は実走×見込み**） [L1:L1-M0514-012,L1-M0514-011,L1-M0514-025,L1-M0514-023,L1-M0514-009; fixture:SEED-M05-14-ORDERS@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-041-EN	IT-33	不正遷移	P3	（BC-2）遷移不可エラー文言（en・仕様側期待）	ログイン済（en管理UIセッション）／SEED-M05-14-ORDERS	同上	同上	【仕様側期待】"You are not allowed to change the status from <FROM名> to <TO名>"（en:2446逐語・名称部はDB値） [L1:L1-M0514-025]（BC-2）				
m05-14_admin_order_order_status_change	E2E-M0514C-042	IT-22	同一スキップ	P1	現在と同一の変更先は何も変更せずリダイレクト・フラッシュなし	ログイン済セッション／SEED-M05-14-ORDERS(ORD-NEW=1)	§6.1契約: order[OrderStatus]=1（現在と同一）	1. db.tsでS0取得 2. POST送信 3. リダイレクト先とフラッシュ有無を読む 4. db.tsで再照会	/order/900001411/edit へ戻り**フラッシュなし**・エラー表示なし（操作は継続可能）・order_status_id=1・update_date/operator_id含め**全列S0同値**（日時セット・更新者更新を行わない） [L1:L1-M0514-010; fixture:SEED-M05-14-ORDERS@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-043	IT-22	フォーム不妥当	P1	明細サブフォーム不正+status_changeはHTTP200再表示・エラー表示・DB不変	ログイン済セッション／SEED-M05-14-ORDERS(ORD-NEW=1)	§6.1契約の収穫フォームから OrderItems の数量欄1つを不正値（空等）へ改変・order[OrderStatus]=6	1. db.tsでS0取得 2. POST送信 3. HTTP statusと画面を読む 4. db.tsで再照会	**リダイレクトせずHTTP200で同画面再表示**・フォームエラーが表示される（明細サブフォーム невалид→mode分岐前にreturn null。具体文言は改変入力に依存＝文言は主張しない）・order_status_id=1 のまま全列S0同値（変更の成立条件=フォーム妥当性を満たさない） [L1:L1-M0514-011; fixture:SEED-M05-14-ORDERS@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-044	IT-22	必須	P1	変更先空送信（OrderStatus未選択相当）は変更されずリダイレクト	ログイン済セッション／SEED-M05-14-ORDERS(ORD-NEW=1)	§6.1契約で order[OrderStatus]='' を強制設定	1. db.tsでS0取得 2. POST送信 3. 応答を読む 4. db.tsで再照会	【主判定・HEADで成立】変更後ステータス取得不可→変更せず /order/900001411/edit へリダイレクト・フラッシュなし・全列S0同値。【仕様側期待=BC-2】必須（未選択不可）の検証エラーが表示される（**BC-DRAFT-M05-14-02: 実装は無表示リダイレクト＝表示成分は実走×見込み**） [L1:L1-M0514-010,L1-M0514-011,L1-M0514-007; fixture:SEED-M05-14-ORDERS@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-045	IT-26	取消成立	P1	初回キャンセル（1→3）: MSG-002ダイアログOK→在庫戻し・取消日・取消フラッシュ（ja）	ログイン済／SEED-M05-14-MEMBER(ORD-MEM=1・spended=100・gained=50)＋SEED-M05-14-PRODUCT(stock=50)	GUI: プルダウン=取消→変更ボタン→confirm OK	1. db.tsでS0（stock=50・player.point・cancel_date=NULL）取得・T1記録 2. 変更ボタン押下→ダイアログ文言を読みOK 3. リダイレクト後フラッシュを読む 4. db.tsで order_status_id・cancel_date・stock・在庫履歴件数を照会（afterEach: SEED再適用＋副産物掃除=§2）	ダイアログ=MSG-002逐語「全キャンセル時、在庫数等は以下のように変動します。…」→OKで送信され、フラッシュ「全キャンセルが完了しました。」・order_status_id=3（§3.1 cancel: from1可）・cancel_date∈[T1,T2]・**stock=S0+2（明細qty2のbcadd加算・S0=手順1のスナップショット値）・キャンセル戻し種別の在庫履歴が+1行**（S0比のΔで判定・SEED値を期待に使わない） [L1:L1-M0514-026,L1-M0514-015,L1-M0514-018,L1-M0514-024,L1-M0514-013; fixture:SEED-M05-14-MEMBER@TBD-D5,SEED-M05-14-PRODUCT@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-045-EN	IT-26	取消成立	P3	取消フラッシュ（en）	ログイン済（en管理UIセッション）／SEED-M05-14-MEMBER	同上（非UI可）	同上	フラッシュ="Order cancellation completed."（en:2447逐語。**md:144「日本語のみ」はDOC-DRAFT-M05-14-02＝正はee実装宣言md:15に従いen資源実在**） [L1:L1-M0514-024]				
m05-14_admin_order_order_status_change	E2E-M0514C-045B	IT-25	取消中断	P1	MSG-002ダイアログでキャンセル→送信されず値は変更されない	ログイン済／SEED-M05-14-MEMBER(ORD-MEM=1)	GUI: プルダウン=取消→変更ボタン→confirmキャンセル	1. db.tsでS0取得 2. networkとdialogを監視し変更ボタン押下→ダイアログでキャンセル 3. POSTが発生しないことを読む 4. db.tsで再照会	ダイアログ（警告表示）でキャンセルすると status_change POST は送信されず処理未完了・画面は編集画面に留まる・order_status_id=1 含め全列S0同値 [L1:L1-M0514-026; fixture:SEED-M05-14-MEMBER@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-046	IT-26	配送完了	P1	1→5: 受注と出荷の出荷日に同一now・ポイント付与・連携ジョブINSERT	ログイン済セッション／SEED-M05-14-MEMBER(ORD-MEM=1・gained=50・player.point=1000・smaregi_id有)	§6.1契約: order[OrderStatus]=5	1. db.tsでS0（player.point=P0・point_history件数H0・messenger_job件数J0）取得・T1記録 2. POST送信 3. db.tsでT2・order_status_id・dtb_order.shipping_date・dtb_shipping.shipping_date・player.point・point_history・messenger_job を照会（afterEach: SEED再適用＋副産物掃除）	order_status_id=5（§3.1 ship: from1可）・dtb_order.shipping_date と出荷900001436のshipping_dateが**同一値**でT1≦値≦T2・player.point=P0+50（gained_points付与）・当該受注のdtb_point_historyに+50行が1件増加・dtb_messenger_jobに1行INSERT（status=PENDING。dispatch後の状態遷移は要実機=§9） [L1:L1-M0514-014,L1-M0514-021,L1-M0514-013; fixture:SEED-M05-14-MEMBER@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-046B	IT-26	配送完了	P1	複数出荷受注の1→5: 全出荷の出荷日に同一nowが入る	ログイン済セッション／SEED-M05-14-ORDERS(ORD-MULTI=1・出荷900001430/900001434とも未出荷)	§6.1契約: order[OrderStatus]=5	1. db.tsでS0取得・T1記録 2. POST送信 3. db.tsで受注shipping_dateと両出荷のshipping_dateを照会（afterEach: SEED再適用）	個別変更は出荷単位でなく**受注単位**: 1回のPOSTで受注と**両出荷**のshipping_dateに**同一の**現在日時（T1≦値≦T2）が入り、order_status_id=5 [L1:L1-M0514-014; fixture:SEED-M05-14-ORDERS@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-047	IT-26	再取消	P1	取消日設定済み受注の取消（4→3）: MSG-001ダイアログ・取消日を上書きしない	ログイン済／SEED-M05-14-ORDERS(ORD-RECXL=4・cancel_date=C0設定済み)	GUI: プルダウン=取消→変更ボタン→confirm OK	1. db.tsでS0（cancel_date=C0）取得 2. 変更ボタン押下→ダイアログ文言を読みOK 3. db.tsで order_status_id・cancel_date を照会（afterEach: SEED再適用）	ダイアログ=MSG-001逐語「過去にキャンセルされているため、在庫数やポイントの変動はありません。…」（エラーではない・OKで継続）→order_status_id=3（§3.1 cancel: from4可）・**cancel_date=C0のままS0同値（上書きしない）**・初回キャンセルでないためcancelOrderPoints非発火 [L1:L1-M0514-026,L1-M0514-015,L1-M0514-019; fixture:SEED-M05-14-ORDERS@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-048	IT-26	取消から復帰	P1	3→4: MSG-003ダイアログ表示→OKで成立・在庫はcommitStockで再減算（実装観測の確定期待）	ログイン済／SEED-M05-14-ORDERS(ORD-CXL=3)＋SEED-M05-14-PRODUCT	GUI: プルダウン=対応中→変更ボタン→confirm OK	1. db.tsでS0（stock・在庫履歴件数H0）取得 2. 変更ボタン押下→ダイアログ文言を読みOK 3. db.tsで order_status_id・stock・在庫履歴件数を照会（afterEach: SEED再適用＋副産物掃除）	ダイアログ=MSG-003逐語「キャンセルからステータスを変更する場合は、在庫の変動はありません。…」→OKで order_status_id=4（§3.1 back_to_in_progress）・**stock=S0−2（明細qty2のbcsub減算）・受注減算種別の在庫履歴=H0+1行**（S0比のΔで確定判定）。**設計書MSG-003文言「在庫の変動はありません」との乖離は本行の期待にせずBC-DRAFT-M05-14-03へ隔離（×確定・設計側期待=在庫S0同値・裁定待ち=§9）** [L1:L1-M0514-026,L1-M0514-020; fixture:SEED-M05-14-ORDERS@TBD-D5,SEED-M05-14-PRODUCT@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-048B	IT-25	取消から復帰	P2	MSG-003ダイアログでキャンセル→送信されず留まる	ログイン済／SEED-M05-14-ORDERS(ORD-CXL=3)	GUI: プルダウン=対応中→変更ボタン→confirmキャンセル	1. db.tsでS0取得 2. dialog/network監視で押下→キャンセル 3. POST不発生を読む 4. db.tsで再照会	送信されず編集画面に留まり order_status_id=3 含め全列S0同値（OKなら遷移・キャンセルなら留まる、の否定側） [L1:L1-M0514-026; fixture:SEED-M05-14-ORDERS@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-049	IT-26	出荷完了同一	P1	既に発送済み(5)の受注へ5を送信→変更不成立・出荷日再セットもポイント付与もなし	ログイン済セッション／SEED-M05-14-ORDERS(ORD-DLV=5・shipping_date=S0値)	§6.1契約: order[OrderStatus]=5（現在と同一）	1. db.tsでS0（shipping_date・player系）取得 2. POST送信 3. db.tsで再照会	同一ステータスのため変更不成立（無変更リダイレクト・フラッシュなし）・shipping_date=S0同値（再セットなし）・ポイント関連（dtb_point_history/dtb_messenger_job）の行数不変 [L1:L1-M0514-010,L1-M0514-014,L1-M0514-021; fixture:SEED-M05-14-ORDERS@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-050	IT-26	入金日	P1	2→6（paywait・入金日未設定）: payment_dateに現在日時がセットされる	ログイン済セッション／SEED-M05-14-ORDERS(ORD-PAYW=2・payment_date=NULL)	§6.1契約: order[OrderStatus]=6	1. db.tsでS0・T1記録 2. POST送信 3. db.tsで order_status_id・payment_date 照会（afterEach: SEED再適用）	order_status_id=6（§3.1 paywait: from2）・payment_date∈[T1,T2]（未設定時の補完セット） [L1:L1-M0514-016,L1-M0514-013; fixture:SEED-M05-14-ORDERS@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-050B	IT-26	入金日	P1	2→6（入金日設定済み）: payment_dateを上書きしない	ログイン済セッション／SEED-M05-14-ORDERS(ORD-PAYW2=2・payment_date=P0設定済み)	§6.1契約: order[OrderStatus]=6	1. db.tsでS0（payment_date=P0）取得 2. POST送信 3. db.tsで再照会	order_status_id=6・**payment_date=P0のままS0同値**（2→6=paywaitはリスナなし・コントローラはnull時のみセット） [L1:L1-M0514-016; fixture:SEED-M05-14-ORDERS@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-051	IT-26	入金日	P2	（BC-4）1→6（入金日設定済み）: 仕様側=上書きしない【実装はpayリスナが上書き】	ログイン済セッション／SEED-M05-14-ORDERS(ORD-NEW2=1・payment_date=P0設定済み)	§6.1契約: order[OrderStatus]=6	1. db.tsでS0（payment_date=P0）取得 2. POST送信 3. db.tsで再照会	【仕様側期待】payment_date=P0のまま上書きしない（md:186,206） [L1:L1-M0514-016]（**BC-DRAFT-M05-14-04: 実装は1→6でtransition `pay` のupdatePaymentDateが無条件セット＝上書き見込み・実走×見込み。order_status_id=6 は両解釈で成立**） [fixture:SEED-M05-14-ORDERS@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-052	IT-26	確認日	P1	6→10（確認日未設定）: confirm_dateに現在日時がセットされる	ログイン済セッション／SEED-M05-14-ORDERS(ORD-PAID=6・confirm_date=NULL)	§6.1契約: order[OrderStatus]=10	1. db.tsでS0・T1記録 2. POST送信 3. db.tsで order_status_id・confirm_date 照会（afterEach: SEED再適用）	order_status_id=10（§3.1 admin_to_picking: from6）・confirm_date∈[T1,T2]（ピック中への新規遷移で未設定時セット） [L1:L1-M0514-017,L1-M0514-013; fixture:SEED-M05-14-ORDERS@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-055	IT-25	一覧整合	P2	変更後の受注一覧はDB永続化済みのステータス・日時を表示	ログイン済セッション／SEED-M05-14-ORDERS(ORD-NEW=1)	C-040成立後	1. C-040同様に 1→6 を成立させる 2. GET /%eccube_admin_route%/order で対象行（order_no=E2E-M0514-…）を検索表示 3. db.tsの現在値と一覧の表示ステータスを突合	一覧の当該受注のステータス表示がdb.ts照会の変更後値（入金済み系名称=DB名）と一致（保存完了後の永続化済みデータに従う） [L1:L1-M0514-030; fixture:SEED-M05-14-ORDERS@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-057	IT-15	request契約	P1	送信契約=編集画面POST・mode=status_change・order[OrderStatus]（非UI・サーバ側で処理される）	ログイン済セッション／SEED-M05-14-ORDERS(ORD-NEW=1)	§6.1契約全文（収穫フォーム再送信）	1. GET /order/900001411/edit でフォーム収穫 2. mode=status_change・order[OrderStatus]=6 でPOST 3. 302とdb.ts変化を読む	フォーム送信（POST mode=status_change）がサーバ側で処理され、302リダイレクト＋DB変更（C-040と同観測）が成立する＝本操作の入口契約 [L1:L1-M0514-004,L1-M0514-003,L1-M0514-027; fixture:SEED-M05-14-ORDERS@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-060	IT-26	行数不変	P1	非キャンセル遷移で dtb_order/dtb_shipping/dtb_point_history の行数不変（追加も削除もない）	ログイン済セッション／SEED-M05-14-ORDERS(ORD-NEW=1)	§6.1契約: order[OrderStatus]=6	1. db.tsで3表のCOUNT(*)を記録 2. POST送信（成立確認） 3. db.tsで再照会（afterEach: SEED再適用）	dtb_order・dtb_shipping・dtb_point_history とも COUNT不変（受注行は削除状態にならない・新規行も追加されない。1→6は在庫/ポイントリスナなし=§3.2） [L1:L1-M0514-031; fixture:SEED-M05-14-ORDERS@TBD-D5]				
m05-14_admin_order_order_status_change	E2E-M0514C-061	IT-05	ポイント履歴削除	P1	初回キャンセル（1→3・会員受注）で当該受注のポイント履歴行が削除状態になる	ログイン済セッション／SEED-M05-14-MEMBER(ORD-MEM=1・point_history初期1行=-100・player.point=P0)	§6.1契約: order[OrderStatus]=3	1. db.tsでS0（point_history件数=1・point_change合計・P0・gained_points=50）取得 2. POST送信 3. db.tsで dtb_point_history（order_id=900001435）・gained_points・player.point を照会（afterEach: SEED再適用＋初期履歴行の再INSERT=§2）	当該受注の dtb_point_history が**0行**（リスナが同一トランザクションでINSERTした返却行も含め全行DELETE）・gained_points=0・player.point=P0+100（使用ポイント返却の純効果=rollbackUsePoint+cancelOrderPointsの差戻し合成） [L1:L1-M0514-019,L1-M0514-018; fixture:SEED-M05-14-MEMBER@TBD-D5]				
```

### §4.2 補完行（0行）

補完なし。母集合101行の期待テキストに対応しない一次資料規定のうち、404（L1-003）・PENDING/PROCESSING
のボタンdisabled（L1-009後段）・トークン不正POST（フォームCSRF・L1-011(b)の一種）は、
対応する期待テキストが母集合に存在せず観測手段も既存行で被覆されるため候補化しない（理由記録のみ。
§9の候補規律参照）。

## §5 locale対応表

LS=1 claim（3件）: L1-006（対応状況ラベル/tooltip）・L1-024（保存/取消フラッシュ）・L1-025（遷移不可エラー）。
→ **-EN 4行**（C-010-EN／C-040-EN／C-045-EN／C-041-EN。全行§4.1に実体掲載）。

- en文言はすべてen一次資料逐語（messages.en.yaml:2360,3227,2449,2447,2446）。**ja翻訳による生成ゼロ**。
- **確認ダイアログ（L1-026）はLS=0**: edit.twigスクリプト直書きでenロケール資源なし（twig:650,657,663逐語）
  → -EN行を作らない（enでも同一日本語文言の見込み・要実機）。
- **「現在のステータス」見出し・変更ボタン「受注ステータス変更」はテンプレート直書き（LS=0）**:
  twig:835,990逐語。ロケールキー不使用（設計書はボタンを「対応状況変更ボタン」と呼ぶが表示文言は
  規定していない=矛盾ではない・L1-005注記）。
- `admin.order.cancel.complete` のen資源は**実在**（en:2447）＝md:144の「日本語のみ」はDOC-DRAFT-M05-14-02
  （C-045-ENの期待はee実装正典宣言md:15に従いen逐語）。
- %from%/%to%（L1-025）の状況名はロケール資源でなく `mtb_order_status.name` のDB値（OT:526-530）＝
  名称リテラルを期待に焼き込まない（インストール経路依存=m05-12 §2と同一論点）。
- -EN実行前提はD15（M0 Go/No-Go。文言確定は本書で4/4=100%完了・実行のみ保留）。

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

### §6.1 request契約（非UI系 C-002/040(+EN)/041(+EN)/042/043/044/046/046B/049/050/050B/051/052/055/057/060/061）

- **収穫フォーム再送信方式**: 同一ログインセッションで `GET /%eccube_admin_route%/order/{受注ID}/edit` を取得し、
  `#form1` 配下の全入力（`order[...]` 一式・`order[_token]`）を収穫→`order[OrderStatus]=<変更先id>`・
  hidden `mode=status_change` を設定して同URLへ `application/x-www-form-urlencoded` でPOST
  （twig:789-790・Edit:504-505。受注フォームは全項目送信が前提のため部分送信しない）。
- 改変系: C-041=order[OrderStatus]をレンダ選択肢に無いidへ置換／C-044=order[OrderStatus]=''／
  C-043=OrderItemsの数量欄1つを不正値へ改変（mode=status_change維持）。
- 応答判定: HTTP status（302/200）＋Locationヘッダ＋リダイレクト後画面のフラッシュ
  （`.alert-success`系・文言完全一致=L1-024）。
- GUI系（C-010/011/012/013/014/015/016/045/045B/047/048/048B）はPlaywright操作＋dialogイベント監視
  （confirm文言の完全一致=L1-026）＋network監視（送信有無）。

### §6.2 db.ts状態照会（三段参照の観測層）

- `e2e/helpers/db.ts`（docker exec psql・読取と後始末のみ）。照会列:
  `dtb_order.order_status_id, payment_date, cancel_date, confirm_date, shipping_date, update_date, operator_id, gained_points, spended_points`／
  `dtb_shipping.shipping_date`／`dtb_product_stock.stock`／`dtb_player.point`／
  `dtb_point_history`（order_id別 件数・point_change）／`dtb_messenger_job`（件数・status）／
  `mtb_order_status.id, name, sort_no`／各表 `COUNT(*)`（C-060）。
- **SEED初期値を期待の正にしない**: 変更側の期待はL1（§1・§3）から導出し、不変側は**操作前S0スナップショット
  との同値**で判定（m05-13のS0方式）。表示名・%from%/%to%はdb.ts照会の `mtb_order_status.name` を実行時に
  埋め込む。時刻系（各日時・update_date）はブラケット法（T1≦値≦T2）。「同一now」判定（C-046/046B）は
  受注と出荷の列値の**相互一致**で行う（絶対値の焼き込みなし）。
- **復元・cleanup**: §2-2の契約（副産物DELETE→UPSERT復元→point_history初期行再INSERT→検証クエリ・
  失敗時も走るteardown）に従う。取消系（C-045/047/061）は在庫履歴INSERT＋point_history DELETE/INSERTの
  両面掃除を伴う（削除条件=D5 manifest契約 `@TBD-D5`）。
- オラクル解決: `e2e/helpers/oracle.ts` の `o(id, …)` 方式（**正式fixtureは未作成**。候補段階では消費なし）。

### §6.3 _drafts/隔離lint証跡（実測・本候補作成時に確認）

1. oracle草案は `e2e/fixtures/oracle/_drafts/m05-14_admin_order_order_status_change_oracle_draft.json`
   のみに生成。**正式パス `e2e/fixtures/oracle/` 直下への書込なし**。
2. 正式解決器 `e2e/helpers/oracle.ts` の隔離ガード（`_drafts`・パス区切り・`..` をthrow）により
   正式specから本草案は解決不能（機械強制・W0で実在確認済み）。
3. 本候補は spec/page 実装・実走なし。既存 `e2e/spec/admin/m05/m05_14_*.spec.ts` への変更なし。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

- 非UI（収穫フォーム再送信+db.ts）・**ee HEADで成立**: C-002/040/041(主判定)/042/043/044/046/046B/049/
  050/050B/052/055/057/060/061。
- Playwright(GUI)・HEADで成立: C-001/010/011/013/014/015/016/045/045B/047/048（ダイアログ文言＋
  在庫Δ=実装観測の確定期待）/048B。
- **BC影響下＝実走×見込み（期待は仕様側のまま）**: C-012（BC-1）・C-041/C-044のエラー表示成分＋
  C-041-EN（BC-2）・C-051（BC-4）。BC-3は候補行に混ぜず**§9で設計側期待（在庫S0同値）を×確定で隔離**
  （C-048自体は実装観測でHEAD成立）。
- 破壊的（使い捨てSEED帯のみ更新・S0スナップショット・afterEach SEED再適用＋副産物掃除・
  フレッシュDB/serial前提）: C-040〜061の全DB変更系（とくにC-045/047/048/061=在庫履歴・ポイント履歴の
  副産物あり）。
- 実行保留: -EN 4行（D15）・C-002の具体応答形（要実機）・C-046のmessenger job dispatch後状態（要実機）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（観点ラベル不使用）。1候補ケース行=1 assertion bundle・
多対一は shared-observation・-EN行は対応ja行と同一親のlocale多重。**参照先の全候補行は§4に実体掲載済み
＝101↔候補の期待テキスト突合が本文内で完結する**。

### 集計（101 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **72** | 下表（うちBC影響=BC-1併用4行・BC-2専属2行/併用1行・BC-4併用1行。導出表=§9） |
| **TBD** | **0** | —（全bound行はL1で拘束済み。BC影響・要実機は§9に別掲＝オラクル化不能ではない） |
| **excluded** | **29** | EX-A 検索系18（020〜037）／EX-D 行追加(INSERT)肯定7（038,040,042,043,045,047,048）／EX-F メール件名・本文4（080,081,083,084） |
| 合計 | **101** | 欠落0・理由なし重複0 |

- excluded根拠（カテゴリ要約。**29 test_id全件のper-ID実引き表（前提列項目・期待逐語・除外理由・
  一次資料対応・実項目の代替bound先）は§9-EXに掲載**＝per-ID証跡はそちらが正）:
  - **EX-A（020〜037・18件）**: 期待は全行「検索条件／実行結果の該当レコードが取得結果に含まれる
    （含まれない）こと」（項目名も全行「検索時の…確認」）。本機能に検索機能なし: 対象は受注編集画面の
    対応状況変更のみで、受注検索は m05-01/02 の範囲・会員/商品検索モーダルも「本操作では使わない」
    （md:87,11,34-42）。status_change経路（Edit:760-839）に検索処理0件（実測）。検索という操作自体が
    不存在のため過剰生成・両極性とも除外（片極性のみ除外する誤りなし）。**偽陰性なし**: 変更結果の
    一覧反映（md:220）はC-055でbound・変更後DB状態は040系db.ts照会でbound。
  - **EX-D（7件・ケース別限定）**: 期待は全行「登録内容/実行結果の対象レコードが**追加されること**」
    （肯定側）。**本機能の登録・更新対象表（md:269: dtb_order/dtb_shipping/mtb_order_status）への
    行追加経路が存在しない**: tryCommitOrderStatusChangeはfind済みエンティティのsetterのみ・new/persist新規
    なし（Edit:760-839実測・L1-031）。**注（捏造ゼロ・副産物INSERTを無視しない）**: 遷移副産物として
    在庫履歴（L1-018,020）・dtb_point_history（L1-018,021）・dtb_messenger_job（L1-021）への**INSERTは実在**
    し§4の候補行（C-045/046/061）で明示的に観測する。ただしこれらは購入フロー/ポイント/連携側の別表
    （md:40「在庫・ポイントの内部計算…は購入フローの設計を正とする」）であり、母集合の「登録内容の
    対象レコード」（本機能の登録対象＝md:269の主対象表）には該当しない＝**一般不能でなくケース別の限定判断**
    （m05-12 EX-Dのcodex承認済み判断と同型）。否定側「追加されないこと」（039,044,046）は行数不変assertion
    へ**bound**（C-060・外さない）。
  - **EX-F（080,081,083,084・4件）**: 期待「件名/本文でエラーが表示され（ず）…」。本機能にメールの
    件名・本文入力は不存在: メール送信はM05-15別機能（md:37）・status_change経路にメール送信呼出0件
    （Edit:760-839実測・L1-031）＝件名/本文という入力自体が不存在のため両極性とも過剰生成。
    **偽陰性なし**: メール以外の「エラー表示/継続」の意味成分は010-019系の必須/相関行でbound済み。

### 101対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | （遷移先ステータス）プルダウンで選べる、現在から変更可能なステータスであること | bound | C-011（フィルタ実証）＋C-012（現在自身の非表示=BC-1） |
| 002 | （許可規則）現在から到達できる遷移先を限定する仕組みであること | bound | C-013（from7=0件）＋C-041 (shared・§3.1マトリクス) |
| 003 | （対応状況変更操作）対応状況だけを変更して保存する操作であること | bound | C-040（status関連列のみ変更・他列S0同値） |
| 004 | （現在のステータス）画面表示時点の受注の対応状況であること | bound | C-010＋C-015 (shared) |
| 005 | 現在の対応状況を表示名で表示し、プルダウンに遷移可能なステータスを表示 | bound | C-010＋C-011 |
| 006 | 変更・保存し、同じ編集画面へリダイレクトしフラッシュ表示 | bound | C-040 |
| 007 | 新規受注ではプルダウンと変更操作を表示しない | bound | C-014 |
| 008 | 編集画面自体に到達できないため本操作も利用できない | bound | C-001,C-002 |
| 009 | 「現在のステータス」を表示し、その下に「対応状況」プルダウンを表示 | bound | C-010 |
| 010 | 必須バリでエラー表示・処理未完了 | bound | C-044（空送信・DB不変=主判定成立。**表示成分はBC-2**） |
| 011 | 必須バリでエラー表示され**ず**継続 | bound | C-040（変更先選択済み=処理継続） |
| 012 | 取消へ/取消からの変更で確認ダイアログを表示 | bound | C-045＋C-048 (shared) |
| 013 | 相関バリでエラー・処理未完了 | bound | C-043（明細不正=エラー表示+未完了・HEAD成立）＋C-041（仕様側の遷移不可表示=BC-2） |
| 014 | 相関バリでエラーなし継続 | bound | C-040（遷移可の組合せ） |
| 015 | 相関バリでエラーなし継続 | bound | C-042（同一→エラー表示なし・操作継続可能） |
| 016 | 相関バリでエラー・処理未完了 | bound | C-043 (shared) |
| 017 | （MSG-001）DB相関バリでエラーなし継続 | bound | C-047（確認ダイアログはエラーでない・OKで継続） |
| 018 | （MSG-002）エラーが表示され・処理未完了 | bound | C-045B（警告ダイアログ表示＋キャンセルで未完了） |
| 019 | （MSG-003）OKなら遷移・キャンセルなら留まる | bound | C-048,C-048B |
| 020〜037 | 検索条件/実行結果の該当レコードが取得結果に含まれる（含まれない） | **excluded** EX-A | — |
| 038 | 対象レコードが**追加される**こと | **excluded** EX-D | — |
| 039 | 追加され**ない**こと | bound | C-060（行数不変） |
| 040 | 追加されること | excluded EX-D | — |
| 041 | （遷移先ステータス）変更可能なステータスであること | bound | C-011＋C-012（BC-1・shared） |
| 042 | 追加されること | excluded EX-D | — |
| 043 | 追加されること | excluded EX-D | — |
| 044 | 追加され**ない**こと | bound | C-060 (shared) |
| 045 | 追加されること | excluded EX-D | — |
| 046 | 追加され**ない**こと | bound | C-060 (shared) |
| 047 | 追加されること | excluded EX-D | — |
| 048 | （実行結果）追加されること | excluded EX-D | — |
| 049 | 現在の対応状況を表示名で表示し、プルダウンに遷移可能なステータスを表示 | bound | C-010＋C-011 (shared) |
| 050 | 更新内容の値が変更されること | bound | C-040（order_status_id更新） |
| 051 | 値が変更され**ない**こと | bound | C-041,C-042 (shared・不成立でDB不変) |
| 052 | 値が変更されること | bound | C-045（取消成立=状態/在庫/取消日の変更） |
| 053 | 入力は対応状況プルダウンの選択のみであること | bound | C-010（入力UI）＋C-040 (shared・他列S0同値) |
| 054 | 値が変更されること | bound | C-040 (shared) |
| 055 | 値が変更されること | bound | C-040 (shared) |
| 056 | 値が変更され**ない**こと | bound | C-043,C-041 (shared・不妥当/不正遷移でDB不変) |
| 057 | （MSG-001）値が変更されること | bound | C-047（再取消成立） |
| 058 | （MSG-002）値が変更され**ない**こと | bound | C-045B（キャンセルでDB不変） |
| 059 | （MSG-003）値が変更されること | bound | C-048（3→4成立） |
| 060 | （実行結果）値が変更されること | bound | C-040 (shared) |
| 061 | プルダウン選択肢は許可規則で到達できる遷移先に限る | bound | C-011＋C-012（「遷移先に限る」の厳密形=現在自身除外はBC-1） |
| 062 | 成立条件=両ステータス取得・両者相違・フォーム妥当 | bound | C-040（成立側）＋C-042/C-043/C-044 (shared・各不成立側) |
| 063 | 出荷完了・取消・入金済み・ピック中で各日時をセット | bound | C-046,C-045,C-050,C-052 (shared・4日時全被覆) |
| 064 | 出荷完了へ新たに遷移したときのみポイント反映+外部連携 | bound | C-046（player.point/履歴/messenger job）＋C-049（「のみ」の否定側=同一時は付与なし） |
| 065 | 更新者=操作管理者・更新日時=現在日時で更新 | bound | C-040 (shared・operator_id/update_date) |
| 066 | 削除条件の対象レコードが削除状態にならないこと | bound | C-060（行数不変・受注行残存） |
| 067 | 対象レコードが削除状態になること | bound | C-061（初回キャンセルでdtb_point_history全行DELETE=本機能唯一の削除経路） |
| 068 | （取得不可）変更せず受注編集画面へリダイレクト | bound | C-044（OrderStatus空=取得不可→リダイレクト） |
| 069 | 対象レコードが削除状態になること | bound | C-061 (shared) |
| 070 | （既設定の取消日・入金日・確認日）これらは上書きしないこと | bound | C-050B（2→6入金日）,C-047（取消日）＋C-051（1→6=仕様側・BC-4） |
| 071 | 変更前が既に出荷完了→変更不成立・出荷日セットもポイント付与もなし | bound | C-049 |
| 072 | （取消から戻す）在庫変動なしの確認ダイアログを表示 | bound | C-048（MSG-003表示。在庫実挙動はBC-3両論併記） |
| 073 | プルダウン・現在表示は画面表示時点のステータスに基づく | bound | C-015 |
| 074 | 日時は判定前にメモリセット・遷移適用〜連携は単一トランザクション・失敗時巻き戻し | bound | C-041（強制送信後の日時列含む全列S0同値=非永続化の代理観測）＋L1-023（境界のソース実証。apply失敗経路は実装上form段遮断=§9） |
| 075 | 出荷完了時、受注の出荷日と各配送の出荷日に同一の現在日時 | bound | C-046B（複数出荷）＋C-046 (shared) |
| 076 | 受注一覧の表示は保存完了後の永続化済みデータに従う | bound | C-055 |
| 077 | 本操作はサーバ側でフォーム送信を受けて処理する | bound | C-057 |
| 078 | 許可規則に反する遷移は適用失敗・巻き戻して編集画面へ戻す | bound | C-041（DB不変+編集画面へ戻る=同観測。機構差は§9 DOC注記） |
| 079 | 送信種別 status_change のPOSTであること | bound | C-057＋C-016（GUI面） |
| 080 | 件名でエラー表示・処理未完了 | **excluded** EX-F | — |
| 081 | 件名でエラー表示されず継続 | excluded EX-F | — |
| 082 | （許可規則）到達できる遷移先を限定する仕組みであること | bound | C-013 (shared) |
| 083 | 本文でエラー表示・処理未完了 | excluded EX-F | — |
| 084 | 本文でエラー表示されず継続 | excluded EX-F | — |
| 085 | 現在の対応状況を表示名で表示し、プルダウンに遷移可能なステータスを表示 | bound | C-010＋C-011 (shared) |
| 086 | 変更・保存・リダイレクト・フラッシュ表示 | bound | C-040 (shared) |
| 087 | 単一選択のプルダウンであること | bound | C-011（multiple属性なし） |
| 088 | 押下でmode=status_change・action戻し・送信 | bound | C-016 |
| 089 | 入力はプルダウン選択のみであること | bound | C-010＋C-040 (shared) |
| 090 | （MSG-004）受注編集フォームの受注ステータス検証で表示すること | bound | C-041（仕様側の表示期待=**BC-2専属**・実走×見込み） |
| 091 | 画面表示データでエラー表示されず継続 | bound | C-042 (shared・エラーなし) |
| 092 | フラッシュなしで受注編集画面を再表示 | bound | C-042,C-044 (shared・リダイレクト後フラッシュ0) |
| 093 | （MSG-001）エラー表示されず継続 | bound | C-047 (shared) |
| 094 | （MSG-002）OKなら遷移・キャンセルなら留まる | bound | C-045,C-045B (shared) |
| 095 | （MSG-004）変更せず受注編集画面に遷移 | bound | C-041 (shared・リダイレクト面=実装整合・HEAD成立) |
| 096 | プルダウン選択肢は許可規則の遷移先に限る | bound | C-011＋C-012（BC-1・shared） |
| 097 | 成立条件=両取得・相違・フォーム妥当 | bound | C-040,C-043 (shared) |
| 098 | 出荷完了・取消・入金済み・ピック中で各日時セット | bound | C-046,C-045,C-050,C-052 (shared) |
| 099 | 出荷完了へ新たに遷移したときのみポイント反映+外部連携 | bound | C-046 (shared)＋C-049（否定側） |
| 100 | 更新者・更新日時の更新 | bound | C-040 (shared) |
| 101 | （対応状況の保存先）dtb_order.order_status_idであること | bound | C-040 (shared・db.ts照会列そのもの) |

`func_scope_check` 判定: 親101/101会計済み・欠落0・理由なし重複0・補完0行
→ **差分0を本文内で実証可能**。O6は主張しない。

## §9 TBD・要実機・BC/DOC-DRAFT・excluded（正直な分離）

- **TBD=0件**: 全bound行はL1（§1）で期待値拘束済み。excluded 29件は§8の一次資料根拠つき。
- **BC-DRAFT（設計書↔実装の乖離候補。正式採番はcodex承認時=ROLLOUT §7）**:
  1. **BC-DRAFT-M05-14-01（現在ステータスが選択肢に残る）**: 設計書側=md:84「現在のステータス自身は
     遷移定義に含まれないため選択肢に出さない。OrderTypeが同一ステータスを除外する」・md:184同旨／
     実装側=OT:417-421の`continue`は同一ステータスを**除外対象から外す**（残す）＋`'data' =>
     $Order->getOrderStatus()`（OT:438）で初期選択値になる。影響bind: **専属=なし／併用=001,041,061,096
     の4行**（各行の許可規則フィルタ面はC-011でHEAD成立・「遷移先に限る」の厳密形のみC-012=実走×見込み）。
     期待値は仕様側のまま（設計書の誤記 or 実装改修すべきかは発注者裁定事項）。
  2. **BC-DRAFT-M05-14-02（検証エラーの無表示リダイレクト）**: 設計書側=md:151,302（遷移不可エラーを
     プルダウン直下に表示）・md:277（空送信は検証エラー）／実装側=Edit:769-771（form invalid→302
     リダイレクト・PRGでフォームエラー消失）＋failed_shortのFormError分岐はchoicesと同源のcan()のため
     status_change経路で実質到達不能（OT:417-425,520-531）。影響bind: **専属=010,090の2行／
     併用=013**（C-043のエラー表示はHEAD成立）。DB不変・リダイレクトの主判定は実装でも成立（C-041/C-044）。
  3. **BC-DRAFT-M05-14-03（MSG-003文言 vs 3→4の在庫挙動＝ee内部矛盾・不具合候補）**: ダイアログ文言
     「在庫の変動はありません。別途、在庫の減算操作を行ってください。」（twig:663・md:159が仕様として逐語
     採録）に対し、3→4は`back_to_in_progress`のcommitStockが**在庫を自動再減算＋在庫履歴INSERT**
     （SM:98,145-150・Stock:56-58,108-113）。3→4以外の取消からの遷移（admin_to_*）はリスナなし＝
     文言どおり変動なし。**期待の分離（codex R1是正）**: C-048は**実装観測を確定期待**
     （stock=S0−qty・在庫履歴+1行）とし、**設計側期待「在庫はS0同値（変動なし）」は本BCに×確定として
     隔離**（候補行に混在させない）。裁定=(a)実装が正→ダイアログ文言の改修起票／(b)文言が正→
     commitStockリスナの改修起票（NEW_BUG_CANDIDATES登録候補・発注者裁定事項）。
  4. **BC-DRAFT-M05-14-04（1→6の入金日上書き）**: 設計書側=md:186,206（入金日は既設定のとき上書きしない）／
     実装側=1→6はtransition`pay`（config:47-50・先勝ち選択=SM:72-85）でリスナ`updatePaymentDate`が
     **無条件セット**（SM:95,111-116）。2→6（paywait）・3等→6（admin_to_paid）はリスナなし＝設計どおり。
     md:134自身が「入金日は受注ステータス遷移側でも入金遷移時にセットされる」と部分的に認めており
     設計内の張力もある。影響bind: **併用=070**（C-050B/C-047で主判定成立・C-051=実走×見込み）。
  5. **BC-DRAFT-M05-14-05（購入例外の未捕捉）**: 設計書側=md:314「購入処理上の例外時もエラーを表示して
     画面を再表示」／実装側=tryCommitOrderStatusChange（Edit:760-839）にcatchなし（register経路の
     PurchaseException/ShoppingException catch=Edit:690-697と非対称）。3→4の**在庫数量不足**
     （bcsub後の負値チェックでShoppingException throw=**Stock:108-113**〔`$newStock = bcsub($currentStock,
     $quantity, 0); if (bccomp($newStock, '0', 0) < 0) { throw new ShoppingException(…over_stock…); }`〕。
     ※Stock:93-95は**在庫レコード不存在**の別分岐=codex R1で引用訂正）等で未捕捉伝播（**実応答コードは
     断定しない=要実機**）。母集合101行に対応する期待テキストが存在しないため候補行は作らない
     （理由記録のみ・障害注入ではなくSEED在庫0で決定的に誘発可能=実装waveで追加検討）。
- **DOC-DRAFT（設計書の自己矛盾・誤記候補）**:
  1. **DOC-DRAFT-M05-14-01**: md:108「受注フォーム全体が妥当でない場合は…リダイレクトする」⇔
     md:151/205/302「検証エラーを表示し…確定処理に入っても遷移適用が失敗してトランザクションを巻き戻す」。
     invalidなら確定処理（トランザクション）に入らないため後段は成立せず、エラー表示とリダイレクト（PRG）も
     両立しない。実装の実挙動はL1-011の2経路。
  2. **DOC-DRAFT-M05-14-02**: md:144「admin.order.cancel.completeは日本語のみで英語ロケール資源を
     持たない」⇔ `messages.en.yaml:2447` に `Order cancellation completed.` が実在（md:15の
     「ee実装を正とする」宣言に従いen資源実在を正とした=C-045-EN）。
- **要実機（実行面の保留＝オラクル化不能ではない）**:
  1. C-002の未認証POSTの具体応答形（302/401等。claimは「処理されない・DB不変」に限定済み）。
  2. BC-2の実観測確定（リダイレクト後画面でエラー非表示・フラッシュなしの確認）。
  3. BC-4の実観測確定（1→6でのpayment_date上書き値）。
  4. BC-5の実応答（在庫不足3→4の500系）。
  5. C-046のmessenger job dispatch後のジョブ状態遷移（PENDING→完了/FAILED）とメッセージバス消費。
  6. en UIでの確認ダイアログ・「現在のステータス」見出しの表示（直書きja文言のままの見込み）。
  7. SEED-M05-14-*の完全行セット（受注のNOT NULL/FK一式・base_info対応在庫・player/point_history）
     =D5 manifest契約。
  8. -EN 4行=D15（管理画面en切替。文言確定は本書で完了）。
### §9-EX excluded 29件のper-ID実引き表（Blocker1是正・per-ID証跡の正）

各行=母集合test_id（-nnn）の実引き。「前提列項目」=当該行の前提/入力列が指す設計書項目ラベル（ノイズ側）・
「期待逐語」=判定対象の期待テキスト（bindの正）。**除外は期待逐語に対する判定**であり、前提列項目の
実内容（実項目）は右端の代替bound先で被覆する（**偽陰性なしの個別立証**）。

**EX-A（18件）共通根拠**: 期待が要求する「検索」操作が本機能に不存在＝本機能は受注編集画面の
status_change送信のみで検索機能を持たない（対象限定=md:11・検索モーダル不使用=md:87・
tryCommitOrderStatusChange=Edit:760-839に検索処理0件〔実測〕。受注検索はm05-01/02の別機能）。
両極性（含まれる/含まれない）とも操作不存在による過剰生成。

| ID | 前提列項目 | 期待逐語 | 除外理由（一次資料） | 実項目の代替bound先 |
|---|---|---|---|---|
| 020 | M05-14-MSG-004 | 検索条件の該当レコードが取得結果に含まれること。 | EX-A共通（検索不存在=md:11,87・Edit:760-839） | MSG-004実体→C-041（BC-2） |
| 021 | 遷移先の絞り込み | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上 | 絞り込み実体→C-011/C-012 |
| 022 | 変更の成立条件 | 検索条件の該当レコードが取得結果に含まれること。 | 同上 | 成立条件→C-040/C-042/C-043/C-044 |
| 023 | 日時の自動セット | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上 | 日時セット→C-045/C-046/C-050/C-052 |
| 024 | 出荷完了時のポイント | 検索条件の該当レコードが取得結果に含まれること。 | 同上 | ポイント→C-046/C-049 |
| 025 | 更新者・更新日時 | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上 | 更新者/日時→C-040 |
| 026 | 対応状況 | 検索条件の該当レコードが取得結果に含まれること。 | 同上 | 対応状況の保存/観測→C-040 |
| 027 | 変更前と変更後が同一ステータス | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上 | 同一スキップ→C-042/C-049 |
| 028 | 変更前または変更後のステータスが取得できない | 検索条件の該当レコードが取得結果に含まれること。 | 同上 | 取得不可→C-044 |
| 029 | 許可されない遷移先を強制送信 | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上 | 強制送信→C-041 |
| 030 | 取消日・入金日・確認日が既に設定済み | 検索条件の該当レコードが取得結果に含まれること。 | 同上 | 非上書き→C-047/C-050B（＋C-051=BC-4） |
| 031 | 出荷完了へ遷移、ただし変更前が既に出荷完了 | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上 | 出荷完了同一→C-049 |
| 032 | 取消から他ステータスへ戻す | 検索条件の該当レコードが取得結果に含まれること。 | 同上 | 3→4復帰→C-048/C-048B |
| 033 | 参照時点 | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上 | 参照時点→C-015 |
| 034 | 変更の原子性 | 実行結果の該当レコードが取得結果に含まれること。 | 同上（「取得結果」=検索系の定型・検索不存在） | 原子性→C-041＋L1-023 |
| 035 | 出荷日の整合 | 実行結果の該当レコードが取得結果に含まれること。 | 同上 | 出荷日整合→C-046/C-046B |
| 036 | 一覧との整合 | 実行結果の該当レコードが取得結果に含まれること。 | 同上 | 一覧整合→C-055 |
| 037 | API | 実行結果の該当レコードが取得結果に含まれること。 | 同上 | フォーム送信処理→C-057（外部連携=L1-022・SEED回避） |

**EX-D（7件）共通根拠**: 期待が要求する「対象レコードの追加（INSERT）」は、**本機能の登録・更新対象表
（md:269: dtb_order/dtb_shipping/mtb_order_status）への追加経路が確認できない**＝
tryCommitOrderStatusChangeはfind済みエンティティのsetterのみでnew/persist新規・remove（主対象表）0件
（Edit:760-839実測・L1-031）。**副産物INSERTは実在するが別表**（在庫履歴=Stock:141-153・
dtb_point_history=PtSvc:60-72,150-159・dtb_messenger_job=Smaregi:58-63。購入フロー/ポイント/連携側の
別設計正=md:40）であり、**C-045/C-046/C-061の候補行で明示的に観測する（隠蔽なし）**＝ケース別限定判断。

| ID | 前提列項目 | 期待逐語 | 除外理由（一次資料） | 実項目の代替bound先 |
|---|---|---|---|---|
| 038 | 失敗時 | 登録内容の対象レコードが追加されること。 | 主対象表（dtb_order/dtb_shipping）への追加経路が確認できない（Edit:760-839実測・md:269）。失敗時に至っては変更自体が発生しない | 失敗時の実挙動→C-041/C-043（DB不変・リダイレクト/再表示） |
| 040 | 成功時出力 | 登録内容の対象レコードが追加されること。 | 主対象表への追加経路が確認できない（同上。成功時もUPDATEのみ=L1-031） | 成功時出力→C-040（フラッシュ・リダイレクト・DB更新） |
| 042 | 受注ステータス遷移の許可規則 | 登録内容の対象レコードが追加されること。 | 主対象表への追加経路が確認できない（同上。許可規則は判定であり行追加を伴わない=SM:57-70） | 許可規則→C-013/C-041＋§3.1 |
| 043 | 対応状況変更操作 | 登録内容の対象レコードが追加されること。 | 主対象表への追加経路が確認できない（同上。本操作の確定はorder_status_id等のUPDATE=L1-013） | 操作実体→C-040 |
| 045 | 受注編集（詳細）画面を開く | 登録内容の対象レコードが追加されること。 | 主対象表への追加経路が確認できない（同上。画面表示(GET)は読取のみ=Edit:149-196） | 画面表示→C-010/C-011 |
| 047 | 新規受注登録画面を開く | 登録内容の対象レコードが追加されること。 | 主対象表への追加経路が確認できない（同上。新規画面は本操作対象外=md:72・L1-028。新規登録のINSERTはregisterモード=M05-11範囲） | 新規画面の非表示→C-014 |
| 048 | 未認証・管理画面へ到達できない利用者 | 実行結果の対象レコードが追加されること。 | 主対象表への追加経路が確認できない（同上。未認証は処理自体が実行されない=L1-002） | 未認証拒否→C-001/C-002 |

**EX-F（4件）共通根拠**: 期待が要求する「件名/本文」というメール入力項目が本機能に不存在＝メール送信は
M05-15別機能（md:37）・tryCommitOrderStatusChangeにメール送信呼出0件（Edit:760-839実測・L1-031）。
両極性とも入力不存在による過剰生成。

| ID | 前提列項目 | 期待逐語 | 除外理由（一次資料） | 実項目の代替bound先 |
|---|---|---|---|---|
| 080 | 成功時出力 | 件名でエラーが表示され、対象処理が完了しないこと。 | 件名入力が不存在（md:37・Edit:760-839にメール呼出0件） | 成功時出力→C-040 |
| 081 | 遷移先ステータス | 件名でエラーが表示されず、対象処理を継続できること。 | 同上 | 遷移先選択肢→C-011 |
| 083 | 対応状況変更操作 | 本文でエラーが表示され、対象処理が完了しないこと。 | 本文入力が不存在（同上） | 操作実体→C-040 |
| 084 | 現在のステータス | 本文でエラーが表示されず、対象処理を継続できること。 | 同上 | 現在のステータス表示→C-010 |

- 集計整合: EX-A 18＋EX-D 7＋EX-F 4＝**29件**（§8集計表と一致・重複なし・bound 72と合わせて101）。
- **候補規律**: 全行 `@TBD-D5`・O5非主張・spec/page実装なし・実走なし。404（L1-003）・PENDING/PROCESSINGの
  登録ボタンdisabled（L1-009）・フォームCSRF不正・想定外例外→500系は、母集合101行に対応する期待テキストが
  存在しないため候補化せず（補完も不作成・理由記録のみ）。ログ・監査（md:319-329）も観測手段未契約＋
  対応期待テキストなしのため候補化せず（理由記録のみ）。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象構文（肯定/否定・許可/拒否の対）を列挙し、claim単位で期待テキストとの極性一致を目視確認した:

| 極性対 | 該当行 | 判定 |
|---|---|---|
| エラー表示**され**/表示され**ず** | 010/013/016/018 vs 011/014/015/017/091/093・080/083 vs 081/084 | 010→C-044（拒否側・表示成分BC-2）・013/016→C-043（明細不正の実表示）・018→C-045B（警告+中断）・011/014→C-040（許可側）・015→C-042・017/093→C-047（ダイアログ=エラーでない・継続）・091→C-042。080/083 vs 081/084は**両極とも入力自体が不存在**（EX-F・片極性のみ除外する誤りなし）。取り違えなし |
| 追加され**る**/され**ない** | 038,040,042,043,045,047,048（肯定）vs 039,044,046（否定） | 肯定=EX-D（主対象表へのINSERT経路なし・副産物INSERTはC-045/046/061で別途観測=隠蔽なし）・否定=行数不変assertionへbound（C-060）。**肯定側をboundにする取り違えなし** |
| 変更され**る**/され**ない** | 050,052,054,055,057,059,060（肯定）vs 051,056,058（否定） | 肯定→C-040/045/047/048（成立系）・否定→C-041/C-042（不成立でS0同値）・C-043（不妥当）・C-045B（ダイアログ中断）。整合 |
| 削除状態に**なる**/なら**ない** | 067,069（なる）vs 066（ならない） | なる→C-061（初回キャンセルのdtb_point_history全行DELETE=実在の削除経路へbind・偽陰性回避）・ならない→C-060（行数不変）。**削除経路が実在するのに「削除機能なし」でexcludedにする誤りを犯していない** |
| 上書き**しない**/セット**する** | 070（しない）vs 063,098（する） | しない→C-050B/C-047（null時のみ分岐の否定側・S0同値）＋C-051（1→6はBC-4=実装が上書き見込み）・する→C-045/046/050/052（null→セット側・ブラケット法）。「常にセット」（出荷日=L1-014）と「null時のみ」（取消/入金/確認日）の区別を維持 |
| 許可/拒否（認証・遷移） | 008（未認証拒否）・002/082（限定の仕組み） | 008→C-001/C-002（拒否側）・限定→C-013（from7=0件）+C-041（禁止遷移拒否）。ログイン済み正規契約の許可側はC-040系。分離済み |
| OK継続/キャンセル中断（ダイアログ） | 019,094（両面）・012,072（表示） | OK→C-045/C-047/C-048（成立）・キャンセル→C-045B/C-048B（送信0件の観測）・表示→同行のダイアログ文言完全一致。MSG-001〜003の発火条件（cancel_date有無・from=取消）をSEED 3受注（ORD-MEM/ORD-RECXL/ORD-CXL）で分離 |
| 用語定義行（〜であること） | 001/041・002/082・003・004・053/089・087・101 | 定義の**観測可能な発現**へbind（遷移先→プルダウンoption集合・許可規則→§3.1と遷移可否観測・操作→他列S0同値の単項目変更・現在のステータス→表示値=DB名・入力→UI唯一性+他列不変・単一選択→multiple属性・保存先→db.ts照会列）。定義文を「表示文言の一致」と誤読していない |

- **本候補はcodex敵対レビュー未実施**（この後レビュー予定）。C4対象の極性取り違えは自己検査では
  検出されず（未検出の可能性は残る）。
- BC裁定の分岐（再会計は§9導出表から機械的に導出可能）:
  (a)設計書が正→BC影響行はそのまま実装waveへ（実走で×=不具合起票）／
  (b)実装が正（設計書改訂）→C-012撤去＋C-041/C-044の表示成分・C-051を実装側期待へ書換
  （bound 72は不変・専属excluded化は010,090の表示成分のみで行単位の再会計なし=いずれもDB不変の
  主判定が残るため）。**本候補はROLLOUT §7の規約に従い(a)の形で保持**。

---

## 付録: 作業実測（B0係数計測用）

- 読了した一次資料: 設計書md 1本（335行）／ee実ソース13
  （EditController・OrderType・OrderStateMachine・order_state_machine.php・StockReduceProcessor・
  PointService・PointProcessor・SmaregiOrderGainPointEventService・edit.twig・Order/DtbPlayer/
  DtbPointHistory/MessengerJob Entity・security.yaml）／locale 2（messages ja/en）／既存資産3
  （旧e2e_cases.md・spec・SEED-M05-ORDERS）／統治・見本4（ROLLOUT/FIRST/m05-12/m05-13）＝**計約23ファイル**。
- L1 claim数: **31**。難所: (1)**status_change経路とregister経路の非対称**（catch有無・エラー表示経路・
  部分キャンセルフラッシュはregister専用）の切り分け (2)**プルダウンに現在ステータスが残る**実装の発見
  （`continue`の意味の読み違え防止・BC-1） (3)**form invalid→無表示リダイレクト**とfailed_short表示の
  実質到達不能性の立証（BC-2） (4)**1→6のpayリスナによる入金日上書き**（transition先勝ち選択の追跡・BC-4）
  (5)**MSG-003文言と3→4のcommitStock矛盾**（BC-3） (6)Hareruya固有のポイント系
  （Player.point/DtbPointHistory/cancelOrderPointsの行削除・messenger jobのアウトボックス）の
  観測点設計 (7)m05-12（出荷単位・PUT・JSON）との**操作単位の違い**（本機能は受注単位・フォームPOST・
  PRG）を期待に混入させない規律。
- 母集合101行の期待テキスト読解・分類: bound72/excluded29（削除系067/069を「削除機能なし」で
  excludedにせずdtb_point_history削除へbindした判断・EX-Dの副産物INSERT明示が最大の判断点）。

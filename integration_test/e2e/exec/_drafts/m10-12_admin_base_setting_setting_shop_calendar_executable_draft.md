# B0候補: m10-12 定休日カレンダー設定 — 実行可能グレード候補（母集合87全量踏破）

> 2026-07-24 ／ **候補グレード（candidate・D6前・O5未確定・実装/実走なし）**
> codexレビュー: **R1要修正（Blocker1＋Major3）→改訂1で是正→R2=R1指摘4件すべて閉塞・小修正2点→改訂2で是正→
> R3=正式spec相互参照は閉塞・残1点小修正→改訂3で是正済み・R4再確認待ち**
> （`REVIEW_LEDGER.md`と同期させること）。
> **改訂3（codex R3是正・小修正1点）**: md付録「5補完専用」とJSONの`supplement_only`分類の不一致を解消。
> §4のTSV実測（§4.1 bound・§4.2 補完それぞれのL1参照を機械抽出）でL1-001（認証）・L1-014（タイトル長境界）は
> **bound側からの参照が0件・補完行（S-001/S-002、S-004/S-004-EN）のみ**からの参照と確認。JSON側の
> `L1-M1012-001`・`L1-M1012-014`に`"supplement_only": true`を付与し、md↔JSONのsupplement_only集合を
> `{001,014,025,026,027}`（5件）で一致させた。md内訳式「21確定＋2 DOC-DRAFT＋1 BC-DRAFT＋5補完専用＝29」は
> 実体と一致していたためmd側の変更なし（JSON側のみ是正）。
> **改訂2（codex R2是正・小修正2点）**:
> (1) 付録のL1内訳算術矛盾を訂正（旧「26確定＋2+1+1」=算術上30の誤り→**21確定＋2 DOC-DRAFT＋1 BC-DRAFT＋
>     5補完専用（L1-001認証・L1-014タイトル長境界・L1-025同時更新・L1-026ラベル流用quirk・L1-027一覧見出し列）
>     ＝29**とTSV実測で機械再確認）。
> (2) BC-DRAFT-M1012-02（§1 L1-M1012-029・§9項目5）に、既存正式`e2e/spec/admin/m10/
>     m10_12_admin_base_setting_setting_shop_calendar.spec.ts:353-358`の`test.fixme(E2E-M10-12-033)`が
>     旧断定（読みAのみ前提）でBC-DRAFT-M1012-02（読みBの可能性）と矛盾する旨を**相互参照として追記**
>     （正式ファイルは`_drafts/`隔離規律により無変更・整合はD6/D8のBC裁定へ委譲）。
> **改訂1（codex R1是正）**:
> (1)【Blocker】更新側（インライン編集）の重複日付拒否を**過剰bound**していた是正。`CalendarController.php:87`は
>     編集フォームを`CalendarType::class, $Calendar`のみで生成し**`BaseInfo`オプションを渡していない**（実測）。
>     POST_SUBMITは`$options['BaseInfo']`をそのまま`c.baseInfo = :baseInfo`へ束縛する（`CalendarType.php:98-115`）ため、
>     編集側は`baseInfo=null`が束縛され、DQL `c.baseInfo = :baseInfo`（null）はSQL三値論理で常にUNKNOWN/false評価となり
>     重複カウントが常に0になる可能性がある（＝更新側の重複拒否は**静的確定不能**）。**新設BC-DRAFT-M1012-02**とし、
>     C-013を「重複拒否が起きる」と断定するbound行から**実機裁定行**へ変更（会計はbound維持・断定内容のみ変更）。
>     C-008（has-errorトグル確認）のトリガーも同様の理由で重複日付から**日付範囲外（0002-12-31）**へ差替え
>     （こちらはフィールド制約のRangeでありBaseInfoに依存しないため両経路で確定的）。
> (2)【Major】§6「page/spec 0件」の誤り是正。実際は`e2e/spec/admin/m10/m10_12_..._spec.ts`・
>     `e2e/pages/admin/m10/m10_12_..._page.ts`が実在（未実行フィクスチャ・test.fixme多数）。§6を訂正し、
>     既存page.tsが記録するDOM id重複quirk（同一block prefix `calendar` により新規行・各既存行のid要素が
>     重複しスコープが必須＝既存page.tsの「不具合候補#1」注記）を参照追記。
> (3)【Major】L1-003の出典行ずれ是正。`create_date`/`update_date`は`Calendar.php:61-68`（旧誤記=44-56に含めていた）。
> (4)【Major】DB復元契約の補強。`dtb_calendar`にはRLSポリシー3件が実在する
>     （`policy_on_dtb_calendar_to_mall_operator`／`_to_tenant_user`（`base_info_id = current_setting(...)`条件）／
>     `_to_customer`＝`Version20240930235959_04.php:1130-1154`実測）が、後続`Version20260319061014.php:62`
>     （2026-03-19「RLSによる制御を不要とするため、Row Level Securityを無効化する」）で`dtb_calendar`のRLSは
>     **現行migration chain上は無効化**されており、以降これを再有効化する migration は無い（実測）。
>     復元契約に(i)全列復元(ii)固定ID(iii)RLS適用可否の実行時確認(iv)sequence影響の留意点を明記（§2）。
> source_class=standard-src+design は fid_kubun.tsv（D1・fid_kubun.tsv:334）による**暫定付与**（確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> fixture_version は全て `@TBD-D5`。統治: `integration_test/CONCRETIZATION_ROLLOUT_PLAN.md`（B0）＋
> `integration_test/CONCRETIZATION_FIRST_PLAN.md`（三段会計）。
> 最強参照=m05-13（破壊系DB更新・S0規律・db.ts三段参照の同型）・m05-17（DB更新のafterEach復元・per-ID excluded表）・
> m09-01（CRUD系の型・§8/§9様式）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m10-12_admin_base_setting_setting_shop_calendar_oracle_draft.json`。
> **正式パス `e2e/fixtures/oracle/` 直下・`e2e/helpers/db.ts` 等の正式ファイルには一切書込まない**。
> **本機能の要点（他機能との違い）**:
> (1) 観測は**DB（db.ts）が主**（CRUD系・`dtb_calendar`への挿入・更新・削除）。
> (2) この機能には**相関バリデーションが実在する**（同一店舗・同一`holiday`の重複禁止チェック＝
>     `CalendarType.php`のPOST_SUBMITイベント）。母集合012〜017（相関／DB相関）はm05-13/m05-17の先例
>     （相関constraint不存在→excluded）とは異なり**bound**とする（過剰除外にしない＝偽陰性回避）。
> (3) **DOC-DRAFT-M1012-01**: 設計書md:168-169は「未入力および空白のみはフレームワークの必須検証により無効」
>     「日付｜必須」と規定するが、`CalendarType.php`のtitle/holidayとも`'required' => true`のみでNotBlank制約が
>     存在しない（vendor実測=`required`オプションはビュー専用でありNotBlankを自動付与しない）。空入力の実際の
>     帰結は静的推論に留め、C-007を実機裁定行とする（テストケースが正の原則）。
> (4) 破壊的更新（登録・更新・削除）は**使い捨てSEED行に限定**し、S0スナップショット同値比較で不変性を判定する
>     （SEED値を期待の正にしない＝三段参照）。`dtb_calendar`には副産物（履歴等）側テーブルは存在しない
>     （grep実測・関連ファイルは`Calendar.php`単体）ため、削除系の復元は単純re-INSERT（DELETE→UPSERT→
>     re-INSERTの多段順序は不要）。
> **行数集計（改訂1）**: 候補ケース行総数**34**＝bound対応23（ja19＋-EN4）＋補完11（ja7＋-EN4）。母集合87=bound70＋TBD0＋excluded17
> （会計自体は改訂1で不変・C-008/C-013の**断定内容のみ**是正）。

## §0 版固定

- 設計書正本: `functions/ec-cube-enterprise/m10-12_admin_base_setting_setting_shop_calendar.md`（本repo HEAD
  `017ab3be9aac7d234838ef0fd3132ac9c36923b8` 時点・322行）。
- ee実ソース: `/home/y-saito/Developments/ec-cube-enterprise/` コミット `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51`
  （W0/W1/B0各機能と同一checkout）。
- fid_kubun.tsv（D1）: `M10-12｜m10-12_admin_base_setting_setting_shop_calendar｜定休日カレンダー設定｜対象｜標準｜
  standard-src+design｜0`（fid_kubun.tsv:334。fid_kubun.tsv sha256先頭=44fbf02f1e4c）。
- 母集合: baseline `all_it_cases.tsv`（sha256先頭 `7911f190d273`）M10-12全**87行**
  （IT-M10-12-ADMIN-BASE-SETTING-SETTING-SHOP-CALENDAR-001〜087）。
- **判定原則（W0教訓）**: 観点（IT-XXコード）・前提条件列のシナリオ語は**生成器ノイズ**。bindは各行の
  **「期待結果／レスポンス」実テキスト**で判定し、極性も期待テキストで確認する（§8に全87行の期待要旨併記）。
  本機能は前提列に設計書の項目名（タイトル・日付・M10-12-MSG-00N・一覧のソース・日表示・成功後遷移・
  CSRFトークン等）が実際の期待内容と対応しない形で循環転記されている（例: 054の前提「M10-12-MSG-002」×
  期待「変更されないこと」＝メッセージ観点と更新失敗観点の取り違え）。§10 C4-manualで極性を確定する。
- **相関バリデーションが実在する機能である点（本機能固有の統治）**: `CalendarType.php`のPOST_SUBMITイベント
  （79-117行）が同一`holiday`値・同一`baseInfo`の既存行数をDBクエリで数え、1件以上あれば
  `admin.setting.shop.calendar.holiday.available_error`をholiday欄へ積む。更新時は自IDを`c.id <> :id`で除外する。
  母集合012〜017（相関／DB相関の4値）はこの単一メカニズムへ**bound**する（m05-13/m05-17の「相関constraint
  不存在→excluded」先例をそのまま踏襲すると偽陰性になるため、本機能では踏襲しない）。

## §1 L1原子オラクル表

規約: claimは検査可能な期待実値まで分解。quoteは一次資料の逐語。unitは文字数系のみ必須。
LS=locale_sensitive（0は理由コード）。**期待値の正は本表のオラクルIDでありSEED値ではない（三段参照）**。
不変性の期待は操作前スナップショット `S0`（db.ts照会値）との同値比較で書く（m05-13/m05-17教訓）。

| oracle_id | 観点 | claim（検査可能な期待） | source_class(暫定) | 逐語quote | 根拠(file:line) | unit | LS |
|---|---|---|---|---|---|---|---|
| L1-M1012-001 | auth_rule | 未ログインで一覧GET・新規POST・削除DELETEへアクセスすると、admin firewall（pattern `^/%eccube_admin_route%/`）のform_loginエントリポイントにより**ログイン画面（route `admin_login`）へリダイレクト**され本機能を利用できない（母集合に直接対応するtest_idなし＝補完S-001/S-002のみで使用） | 設計書md＋standard-src | 「未認証または管理画面に入れない権限｜（到達前）｜当画面に到達できない。」／`admin:`…`pattern: ['^/%eccube_admin_route%/','^/%eccube_messenger_route%/']`…`form_login:`…`login_path: admin_login` | m10-12md:74／security.yaml:40-46 | — | 0 `non-translated` |
| L1-M1012-002 | http_status | 入口URL: 一覧・新規=`GET/POST /%eccube_admin_route%/setting/shop/calendar`（route `admin_setting_shop_calendar`）と`GET/POST .../calendar/new`（route `admin_setting_shop_calendar_new`）はいずれも同一`index()`で処理・削除=`DELETE /%eccube_admin_route%/setting/shop/calendar/{id}/delete`（route `admin_setting_shop_calendar_delete`・`id`=数字のみ）は`delete()`で処理 | standard-src | `#[Route(path: '/%eccube_admin_route%/setting/shop/calendar', name: 'admin_setting_shop_calendar', methods: ['GET', 'POST'])]`／`#[Route(path: '/%eccube_admin_route%/setting/shop/calendar/new', name: 'admin_setting_shop_calendar_new', methods: ['GET', 'POST'])]`／`#[Route(path: '/%eccube_admin_route%/setting/shop/calendar/{id}/delete', name: 'admin_setting_shop_calendar_delete', requirements: ['id' => '\d+'], methods: ['DELETE'])]` | CalendarController.php:46-48,132 | — | 0 `non-ui-observable` |
| L1-M1012-003 | display_field | `dtb_calendar`の1レコードは、`id`（自動採番）・`title`（文字列・NULL許容）・`holiday`（タイムゾーン付き日時・NOT NULL）・`base_info_id`（店舗FK・NOT NULL）・`create_date`／`update_date`（同型・タイムゾーン付き日時・NOT NULL）を持つ | standard-src＋設計書md | `#[ORM\Column(name: 'id', type: Types::INTEGER, options: ['unsigned' => true])] #[ORM\Id] #[ORM\GeneratedValue(strategy: 'IDENTITY')]`／`#[ORM\Column(name: 'title', type: Types::STRING, length: 255, nullable: true)]`／`#[ORM\Column(name: 'holiday', type: Types::DATETIMETZ_MUTABLE)]`（nullable未指定=NOT NULL）／`#[ORM\Column(name: 'create_date', type: Types::DATETIMETZ_MUTABLE)]`／`#[ORM\Column(name: 'update_date', type: Types::DATETIMETZ_MUTABLE)]`／「`dtb_calendar` の1レコードで、タイトル文字列・日時型の祝日もしくは休業日表示用日付・店舗紐付けをもつ。」 | **Calendar.php:44-56（id/title/holiday）・61-68（create_date/update_date・codex R1是正=旧誤記44-56を訂正）**／m10-12md:58 | — | 0 `non-ui-observable` |
| L1-M1012-004 | display_field | 一覧は`getListOrderByIdDesc($BaseInfo)`により**ID降順**で取得される。`baseInfo`が渡されればその店舗の行のみに絞る | standard-src＋設計書md | `$qb = $this->createQueryBuilder('c')->orderBy('c.id', 'DESC'); if ($baseInfo !== null) { $qb->andWhere('c.baseInfo = :baseInfo')->setParameter(':baseInfo', $baseInfo); }`／「IDの降順であること。」 | CalendarRepository.php:62-75／m10-12md:59 | — | 0 `non-ui-observable` |
| L1-M1012-005 | message | 保存成功時（新規・インライン更新とも）: `admin.common.save_complete` ja「保存しました」／en "Saved"。削除成功時: `admin.common.delete_complete` ja「削除しました」／en "Deleted" | standard-src＋設計書md | `$this->addSuccess('admin.common.save_complete', 'admin');`（71,105行）／`$this->addSuccess('admin.common.delete_complete', 'admin');`（137行）／`admin.common.save_complete: 保存しました`／`admin.common.save_complete: Saved`／`admin.common.delete_complete: 削除しました`／`admin.common.delete_complete: Deleted` | CalendarController.php:71,105,137／messages.ja.yaml:1591,1593／messages.en.yaml:1636,1638／m10-12md:60 | — | 1 |
| L1-M1012-006 | display_field | GETは`$BaseInfo`が引数で解決されない場合`baseInfoRepository->getMallBaseInfo()`を既定値とし、一覧はその店舗に紐付く行のみをテーブルに表示する。画面上部には新規登録用の空白行（`#calendar_item_new`）が常に存在する | standard-src＋設計書md | `if ($BaseInfo === null) { $BaseInfo = $this->baseInfoRepository->getMallBaseInfo(); }`／`$Calendars = $this->calendarRepository->getListOrderByIdDesc($BaseInfo);`／`<tr id="calendar_item_new">`／「現在のログインコンテキストに応じて解決した店舗に紐付く一覧がテーブルに表示される。最上段には新規用の空白行がある。」 | CalendarController.php:49-53,78-81,116-122／calendar.twig:82／m10-12md:69 | — | 0 `non-ui-observable` |
| L1-M1012-007 | status_transition/db_effect | 新規作成: `mode!='edit_inline'`のとき通常モードでフォームが束ねられ、送信済みかつ検証済みなら`baseInfo`をセットし`persist`/`flush`、成功フラッシュ後`admin_homepage`へリダイレクトする。テナント自動補填リスナは`Calendar`を明示的に除外しており（`$entity instanceof Calendar === false`が偽になる条件）、baseInfoはコントローラが明示セットする必要がある | standard-src＋設計書md | `if ($mode != 'edit_inline') { $form->handleRequest($request); if ($form->isSubmitted() && $form->isValid()) { $Calendar->setBaseInfo($BaseInfo); $this->entityManager->persist($Calendar); $this->entityManager->flush(); $this->addSuccess('admin.common.save_complete', 'admin'); return $this->redirectToRoute('admin_homepage'); } }`／`&& $entity instanceof Calendar === false`／「入力がすべて有効かつ同日の別行が無いとき、新規レコードとして保存される。」 | CalendarController.php:63-76／TenantEventSubscriber.php:57-68（Calendar除外行=67）／m10-12md:70 | — | 0 `non-ui-observable` |
| L1-M1012-008 | display_field | 鉛筆アイコン押下でJSが当該行の`.list`を隠し`.edit`を表示する（サーバ往復なし）。「キャンセル」押下は一覧設定画面へのフルGETリロード | standard-src＋設計書md | `$('.calendar_list_item td.action a.edit-button').click(function() { var id = $(this).data('id'); var tr = $('#ex-calendar-' + id); $(tr).find('.list').hide(); $(tr).find('.edit').show(); });`／`$('.calendar_list_item .cancel').click(function() { location.href = '{{ url('admin_setting_shop_calendar') }}'; });`／「当該行は閲覧用の単純表示が隠れ、テキストと日付ピッカーが現れる。」 | calendar.twig:39-49／m10-12md:71 | — | 0 `non-translated` |
| L1-M1012-009 | request_contract | インライン編集「決定」送信のPOSTには当該行専用の隠しフィールド`calendar_id=<id>`と`mode=edit_inline`が含まれる。サーバは`mode=='edit_inline' && method==='POST' && (string)Calendar.id === request.get('calendar_id')`の行にのみリクエストを束ねる | standard-src＋設計書md | `<input type="hidden" value="{{ Calendar.id }}" name="calendar_id"> <input type="hidden" value="edit_inline" name="mode"/>`／`if ($mode == 'edit_inline' && $request->getMethod() === 'POST' && (string) $Calendar->getId() === $request->get('calendar_id')) {`／「対象行IDとモードを示す隠しフィールドを含むPOSTが飛ぶ。」 | calendar.twig:109-110／CalendarController.php:93-96／m10-12md:72 | — | 0 `non-translated` |
| L1-M1012-010 | display_field | 削除リンクは`csrf_token_for_anchor()`によるCSRF属性と`data-method="delete"`・`data-confirm="false"`を持ち、行ごとに独立したモーダル（`#DeleteModal_{id}`）から送信される | standard-src＋設計書md | `<a class="btn btn-ec-delete" href="{{ url('admin_setting_shop_calendar_delete', { id : Calendar.id }) }}" {{ csrf_token_for_anchor() }} data-method="delete" data-confirm="false">`／`<div class="modal fade" id="DeleteModal_{{ Calendar.id }}" ...>`／「モーダル内の削除リンクはCSRF用属性を持ち、画面共通のスクリプトが隠しフォームを生成してメソッド上書き付きで送信する。」 | calendar.twig:147,152-153,169-172／m10-12md:73 | — | 0 `non-translated` |
| L1-M1012-011 | **DOC-DRAFT-M1012-01** | 設計書md:168-169は title「未入力および空白のみはフレームワークの必須検証により無効」・holiday「必須」と規定するが、`CalendarType.php`のtitleフィールドは`'required' => true`（HTML5属性・ビュー用）のみで`constraints`は`Assert\Length(max)`のみ＝**NotBlank制約が存在しない**。vendor実測: `required`オプションは`Form::setRequired()`／ビューの`isRequired()`にのみ使われ、サーバ側の空文字拒否を自動生成しない。空文字はLengthが長さ0として検査するがmaxを超えないため単独では無効化されない可能性がある（確定期待にしない・実機裁定＝C-007） | standard-src vs 設計書md | `->add('title', TextType::class, [ 'required' => true, 'constraints' => [ new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]) ] ])`（NotBlank不在）／`->setRequired($options['required'])`／`'required' => $form->isRequired(),`／「未入力および空白のみはフレームワークの必須検証により無効。」 | CalendarType.php:50-58／vendor/symfony/form/Extension/Core/Type/FormType.php:48,95／m10-12md:168 | — | — |
| L1-M1012-012 | **DOC-DRAFT-M1012-01（holiday側）** | 同様にholidayフィールドも`'required' => true`（ビュー用）のみで`constraints`は`Assert\Range(min: '0003-01-01')`のみ＝NotBlank不在。かつ`dtb_calendar.holiday`列はDB上**NOT NULL**（`nullable`未指定）であるため、もし空値がフォーム層を素通りすればDB制約違反（ORM例外相当）に至る余地があり得る。確定期待にしない（実機裁定＝C-007） | standard-src vs 設計書md | `->add('holiday', DateType::class, [ 'required' => true, ..., 'constraints' => [ new Assert\Range(['min' => '0003-01-01', 'minMessage' => 'form_error.out_of_range']) ] ])`（NotBlank不在）／`#[ORM\Column(name: 'holiday', type: Types::DATETIMETZ_MUTABLE)] private $holiday;`（nullable未指定=NOT NULL）／「日付｜必須」 | CalendarType.php:59-70／Calendar.php:55-56／m10-12md:169 | — | — |
| L1-M1012-013 | display_field | インライン編集の当該行に検証エラーがある場合（`errors[Calendar.id] > 0`）、行に`has-error`クラスが付き、CSS規則により`.list`が非表示・`.edit`のみ表示される単純トグルとなる | standard-src＋設計書md | `.has-error .list { display: none; } .has-error .edit { display: block; }`／`class="calendar_list_item {% if errors[Calendar.id] %}has-error{% endif %}"`／`$error = count($editCalendarForm->getErrors(true));`／「行にバリデーションエラーがあるとき has-error を付け、閲覧用ブロックを隠して編集ブロックだけを残す単純トグルがある。」 | calendar.twig:26-32,106／CalendarController.php:109／m10-12md:84 | — | 0 `non-translated` |
| L1-M1012-014 | validation_rule/message | titleのForm層最大長=**255文字**（`Assert\Length(max: eccube_stext_len)`・`eccube_stext_len: 255`）。超過時のメッセージ（Symfony既定カタログ・choice・limit=255解決後）: ja「長すぎます。この値は255文字以下で入力してください。」／en "This value is too long. It should have 255 characters or less." | standard-src（vendor翻訳含む）＋設計書md | `new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']])`／`eccube_stext_len: 255`／choice原文＋ja/en target（trans-unit id=19、W0/m05-13と同一vendor v7.4.3）／「共通設定項 `eccube_stext_len` の値（環境既定の確認値として255）」 | CalendarType.php:51-58／eccube.yaml:137／vendor/symfony/validator/Resources/translations/validators.ja.xlf:78-79・validators.en.xlf:78-79／m10-12md:168 | **文字** | 1 |
| L1-M1012-015 | validation_rule/message | holidayのRange制約: `min: '0003-01-01'`未満は`form_error.out_of_range` ja「不正な日付です。」／en "Invalid DateTime."（POST_SUBMITで再検証、エラーなら同日重複チェックへ進まず打ち切る） | standard-src＋設計書md | `new Assert\Range(['min' => '0003-01-01', 'minMessage' => 'form_error.out_of_range'])`／`form_error.out_of_range: 不正な日付です。`／`form_error.out_of_range: Invalid DateTime.`／「日付の下限が内部で許容される最小日以降であるか個別チェック…不一致なら同日重複判定へ進まず打ち切る。」 | CalendarType.php:65-70,84-96／validators.ja.yaml:60／validators.en.yaml:47／m10-12md:134 | — | 1 |
| L1-M1012-016 | validation_rule/message（**本機能固有の相関バリ・新規側で確定**） | POST_SUBMITイベントが同一`holiday`値・同一`baseInfo`の既存行数をカウントし、1件以上あれば`holiday`欄へ`admin.setting.shop.calendar.holiday.available_error` ja「同日の定休日が既に存在しているため、設定できません。」／en "Date is already existed." を積む。**新規作成側はコントローラが`['BaseInfo' => $BaseInfo]`をオプション明示し（`CalendarController.php:56-59`）`$options['BaseInfo']`が実店舗を指すため、この重複チェックは新規側で確定的に機能する**。**更新（インライン編集）側の挙動はL1-M1012-029（BC-DRAFT-M1012-02）を参照＝静的確定不能** | standard-src＋設計書md | `$qb->select('count(c.id)')->where('c.holiday = :holiday')->andWhere('c.baseInfo = :baseInfo')->setParameter('holiday', $Calendar->getHoliday())->setParameter('baseInfo', $options['BaseInfo']); if ($Calendar->getId()) { $qb->andWhere('c.id <> :id')->setParameter('id', $Calendar->getId()); } $count = ...; if ($count > 0) { $form['holiday']->addError(new FormError(trans('admin.setting.shop.calendar.holiday.available_error'))); }`／`->createBuilder(CalendarType::class, $Calendar, [ 'BaseInfo' => $BaseInfo, ])`（新規側のみ）／`admin.setting.shop.calendar.holiday.available_error: 同日の定休日が既に存在しているため、設定できません。`／en: `Date is already existed.` | CalendarType.php:79-117／CalendarController.php:56-59／messages.ja.yaml:3192／messages.en.yaml:2828／m10-12md:135 | — | 1 |
| L1-M1012-017 | db_effect | 保存列: `title`→`dtb_calendar.title`（STRING255・NULL許容・恒等写像）／`holiday`→`dtb_calendar.holiday`（DATETIMETZ・NOT NULL・恒等写像）／`base_info_id`（`TenantTrait`のJoinColumn・`nullable: false`）。行の追加・削除はこの保存操作では発生しない（不要な削除は含まない＝L1-028） | standard-src＋設計書md | `#[ORM\Column(name: 'title', type: Types::STRING, length: 255, nullable: true)]`／`#[ORM\Column(name: 'holiday', type: Types::DATETIMETZ_MUTABLE)]`／`#[ORM\JoinColumn(name: 'base_info_id', referencedColumnName: 'id', nullable: false)]`／「`dtb_calendar.title` に保存される。」／「`dtb_calendar.holiday` に日時値として保存。」 | Calendar.php:49-56／TenantTrait.php:24-26／m10-12md:60,61,168-169 | 文字 | 0 `non-ui-observable` |
| L1-M1012-018 | db_effect | `create_date`／`update_date`はコントローラが直接セットせず、汎用Doctrineリスナ`SaveEventSubscriber`（`method_exists`判定・全エンティティ共通）が`prePersist`で両方・`preUpdate`で`update_date`のみ設定する。`Calendar`はこの両メソッドを持つため対象になる | standard-src＋設計書md | `if (method_exists($entity, 'setCreateDate')) { $entity->setCreateDate(new \DateTime()); } if (method_exists($entity, 'setUpdateDate')) { $entity->setUpdateDate(new \DateTime()); }`（prePersist）／`if (method_exists($entity, 'setUpdateDate')) { $entity->setUpdateDate(new \DateTime()); }`（preUpdate、setCreateDate呼出なし）／「`create_date` と `update_date` を画面上の処理がどの共通機構…で埋めるか」 | SaveEventSubscriber.php:37-46,62-68／Calendar.php:117-140／m10-12md:40 | — | 0 `non-ui-observable` |
| L1-M1012-019 | status_transition | インラインPOSTの`calendar_id`が表示中のどの行のIDとも一致しない場合、いずれの`editCalendarForm`も`handleRequest`されず、`persist`/`flush`/フラッシュ/リダイレクトは一切発生しない。ループは各行の未束縛フォームを再生成するのみで一覧を再構成する | standard-src＋設計書md | `if ($mode == 'edit_inline' && $request->getMethod() === 'POST' && (string) $Calendar->getId() === $request->get('calendar_id')) { ... }`（一致しなければ分岐に入らずforms/errorsのみ構築を継続）／「インラインPOSTが特定行だけにヒットしない｜全行とも更新せず一覧を再ビルドするだけ。」 | CalendarController.php:93-114／m10-12md:175 | — | 0 `non-ui-observable` |
| L1-M1012-020 | http_status/security | 削除は`isTokenValid()`を明示的に呼び出し、CSRFトークンが不正・欠落なら`AccessDeniedHttpException`をthrowする（新規・インライン更新はSymfony Formの`_token`フィールドによる自動CSRF検証＝`isValid()`の一部） | standard-src＋設計書md | `$this->isTokenValid(); $this->calendarRepository->delete($Calendar);`／`if (!$this->isCsrfTokenValid(Constant::TOKEN_NAME, $token)) { throw new AccessDeniedHttpException('CSRF token is invalid.'); }`／「削除前検証のみ明示的サービス関数を叩く。」 | CalendarController.php:135／AbstractController.php:252-262／m10-12md:235 | — | 0 `non-ui-observable` |
| L1-M1012-021 | db_effect | 削除は`CalendarRepository::delete()`が`remove`直後に即時`flush`する物理削除（論理削除フラグを`Calendar`エンティティは持たない） | standard-src＋設計書md | `$em = $this->getEntityManager(); $em->remove($Calendar); $em->flush();`／「リポジトリ実装は `remove` のあと即座に `flush` する。」 | CalendarRepository.php:127-139／m10-12md:118 | — | 0 `non-ui-observable` |
| L1-M1012-022 | display_field | 一覧の非編集状態表示は`date_day`フィルタにより日粒度で`holiday`を表示する（DB内部値はタイムゾーン付き日時のまま） | standard-src＋設計書md | `<span>{{ Calendar.holiday|date_day }}</span>`／「画面上の保存済み一覧はフィルタ `date_day` により日粒度で表示値を決める（内部は日時）。」 | calendar.twig:126／m10-12md:160 | — | 0 `non-translated` |
| L1-M1012-023 | message/display_field | カード見出し=`admin.setting.shop.calendar_setting` ja「定休日カレンダー設定」／en "Calendar"＋ツールチップ（title属性）=`tooltip.setting.shop.calendar_setting` ja「定休日カレンダーに表示する定休日を設定できます。」／en "You can set regular holidays for displaying in the business days calendar." | standard-src＋設計書md | `<span>{{ 'admin.setting.shop.calendar_setting'|trans }}</span>`／`data-bs-toggle="tooltip" ... title="{{ 'tooltip.setting.shop.calendar_setting'|trans }}"`／`admin.setting.shop.calendar_setting: "定休日カレンダー設定"`／en: `"Calendar"`／`tooltip.setting.shop.calendar_setting: "定休日カレンダーに表示する定休日を設定できます。"`／en: `"You can set regular holidays for displaying in the business days calendar."` | calendar.twig:58-61／messages.ja.yaml:2986,3681／messages.en.yaml:2673,3293／m10-12md:82 | — | 1 |
| L1-M1012-024 | status_transition | 新規作成成功・インライン更新成功のいずれも`admin_homepage`ルートへリダイレクトする。検証失敗時はリダイレクトしない（同一設定画面の再構成） | standard-src＋設計書md | `return $this->redirectToRoute('admin_homepage');`（74,107行）／「新規保存およびインライン更新の成功のみで管理者向けホームへ転送される。」 | CalendarController.php:74,107／m10-12md:162 | — | 0 `non-ui-observable` |
| L1-M1012-025 | concurrency（**補完専用**） | 同一行への複数管理セッションの連続保存は最後の保存が残る（後勝ち）。`Calendar`エンティティに`#[ORM\Version]`列は無く（grep実測0件）、保存は単一`flush`のみでロック取得呼出は無い | 設計書md＋standard-src（傍証） | 「同一行への同時POSTの順序競合については、アプリケーション側で順序を保証する記述がなく、データベースの最終書き込み勝ちに依存する。」／ee傍証: `Calendar.php`にVersion注釈なし・保存経路は`setBaseInfo→persist→flush`のみ | m10-12md:319-322／Calendar.php（全文実測=Version注釈0件） | — | 0 `non-ui-observable` |
| L1-M1012-026 | display_field（**補完専用・字面quirk**） | holiday入力欄のラベルは`admin.common.create_date__start` ja「登録日(開始)」／en "Registration Date (Start)" を流用しており、画面ラベルと項目意味（休業日）が字面上一致しない | standard-src＋設計書md | `'label' => 'admin.common.create_date__start',`／`admin.common.create_date__start: 登録日(開始)`／en: `Registration Date (Start)`／「一覧の編集済み状態では入力のラベルは翻訳上『登録日(開始)』キー由来の文言が再利用されており、画面ラベルと項目意味が字面では一致しない。」 | CalendarType.php:60／messages.ja.yaml:1834／messages.en.yaml:1831／m10-12md:86 | — | 1 |
| L1-M1012-027 | message（**補完専用**） | 一覧見出し列: `admin.setting.shop.calendar.title` ja「タイトル」／en "Title"・`admin.setting.shop.calendar.holiday` ja「日付」／en "Date" | standard-src | `{{ 'admin.setting.shop.calendar.title'|trans }}`／`{{ 'admin.setting.shop.calendar.holiday'|trans }}`／`admin.setting.shop.calendar.title: "タイトル"`／en: `"Title"`／`admin.setting.shop.calendar.holiday: "日付"`／en: `"Date"` | calendar.twig:75-76／messages.ja.yaml:3190-3191／messages.en.yaml:2826-2827 | — | 1 |
| L1-M1012-028 | db_effect | 登録・更新の保存操作自体は不要な削除を含まない（`index()`内に`remove()`呼出は無く、`persist`/`flush`のみ）。既存の他行数は変化しない | standard-src＋設計書md | `index()`全文実測（`remove`呼出0件・`persist`/`flush`のみ）／「当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。」 | CalendarController.php:32-123（実測）／m10-12md:225 | — | 0 `non-ui-observable` |
| L1-M1012-029 | **BC-DRAFT-M1012-02（codex R1新設）** | インライン編集の`editCalendarForm`は`$this->formFactory->createBuilder(CalendarType::class, $Calendar)`のみで生成され**`BaseInfo`オプションを渡していない**（新規側=`CalendarController.php:56-59`との対比で確認）。`configureOptions`既定は`'BaseInfo' => null`のため、POST_SUBMITの重複カウントクエリは編集時`$options['BaseInfo']`=null を束縛する。DQL `c.baseInfo = :baseInfo`にnullを束縛した場合SQL三値論理では比較結果が真になり得ず（`= NULL`は常にUNKNOWN）、重複カウントは常に0となり**更新側の重複日付拒否は実質的に働かない可能性がある**（＝設計書md:161「新規と更新共通のロジック骨格だが編集側は店舗オプション未設定」という自認の帰結が、エラー無効化という形で顕在化する候補）。**Doctrineのnullパラメータ束縛の正確な変換結果（型例外の可能性を含む）は静的推論では確定できず実機裁定**（C-013）。真であれば「更新（インライン編集）は重複日付でも常に保存できてしまう」という実装挙動側の不具合候補（テストケースが正の原則により確定期待にしない）。**【正式spec相互参照・codex R2是正・正式ファイルは無変更】** 既存の正式ファイル`e2e/spec/admin/m10/m10_12_admin_base_setting_setting_shop_calendar.spec.ts:353-358`の`test.fixme("E2E-M10-12-033 インライン編集 同日重複(自ID除外)→「同日の定休日が既に存在しているため、設定できません。」")`は、本BC-DRAFT-M1012-02発見以前に書かれた**旧断定（読みAのみを前提とした期待）**であり、BC-DRAFT-M1012-02（読みBの可能性）と**内容が矛盾する**。正式spec自体は候補フェーズでは`_drafts/`隔離規律により改変しない。**両者の整合はD6/D8のBC裁定（実機実行によりどちらの読みが真か確定した時点）で取る**ものとし、本書はその相互参照のみを記録する（旧断定を候補側の確定期待として引き継がない＝§4.1 C-013は両論併記のまま） | standard-src（静的解析・実機裁定） | `$builder = $this->formFactory->createBuilder(CalendarType::class, $Calendar);`（editCalendarForm生成・オプション無し）／`$builder = $this->formFactory->createBuilder(CalendarType::class, $Calendar, [ 'BaseInfo' => $BaseInfo, ]);`（新規側=対比）／`'BaseInfo' => null,`（既定値）／「編集フォーム生成時、`BaseInfo` オプションをフォームタイプへ渡していない。同日チェック処理はフォームオプション内の店舗参照値に依存するため、編集側のクエリでの店舗条件の解釈はORMの規則に従う（新規側では店舗を明示的にオプション渡ししている）。」 | CalendarController.php:87／CalendarType.php:98-104,126-129／m10-12md:113／**e2e/spec/.../m10_12_..._shop_calendar.spec.ts:353-358（相互参照・既存正式spec・無変更）** | — | — |

## §2 SEED三段参照設計（★破壊的更新系＝CRUD直接反映）

三段参照: `L1恒等写像claim（passthrough_basis=m10-12md:166-169入力項目表・208-217DBカラム表） →
fixture_version（SEEDセットID@manifest_sha1） → 実値`。固定値は**入力の再現手段**であり期待値の正にしない
（不変性の期待は操作前スナップショットS0との同値比較=m05-13/m05-17教訓）。全て `@TBD-D5`。

**破壊系の統治**: `dtb_calendar`への登録・更新・削除は承認ワークフローを介さず`persist/flush`で直接確定する
（md:221）。対象は**使い捨てSEED行（帯900101201〜900101231）に限定**し、新規作成ケースは
`title`に`E2E-<runid>-`prefixを用いて後始末を特定可能にする（afterEachでtitle prefix該当行を削除）。
既存行を書き換えるケースは**afterEachでSEED値へUPSERT復元**、削除ケースは**afterEachで同一idへre-INSERT復元**。
`dtb_calendar`には履歴・監査側テーブルが存在しない（grep実測=関連ファイルは`Calendar.php`単体・
`CalendarHistory`等は0件）ため、m09-03等で必要な「DELETE→UPSERT→re-INSERT」の多段復元順序は**本機能では不要**。

**復元契約の明記（codex R1是正・DB側のRLS実在を踏まえた補強）**:
1. **全列復元**: re-INSERT/UPSERTは`id`・`title`・`holiday`・`base_info_id`・`create_date`・`update_date`の**全列を
   明示指定**する（`create_date`/`update_date`はSaveEventSubscriberが自動設定するため、復元SQLでは元のSEED投入時
   タイムスタンプへ明示的に戻す＝アプリ経由でなくpsql直接UPDATEで全列を指定）。
2. **固定ID**: 900101201〜900101231の帯を用い、対象行の一意特定は常に固定idで行う（§2冒頭表のとおり）。
3. **RLS適用可否（実行時確認が必須）**: `dtb_calendar`には行レベルセキュリティのポリシーが3件実在する
   （`policy_on_dtb_calendar_to_mall_operator`（FOR ALL・`mall_operator`/`mall_owner`・`USING(TRUE)`）／
   `policy_on_dtb_calendar_to_tenant_user`（FOR ALL・`tenant_owner`/`tenant_operator`・
   `USING(base_info_id = current_setting('custom.eccube.base_info_id')::integer)`）／
   `policy_on_dtb_calendar_to_customer`（FOR SELECT・`customer`/`guest`・`USING(TRUE)`）＝
   `Version20240930235959_04.php:1130-1154`実測）。ただし**後続`Version20260319061014.php:62`
   （2026-03-19「RLSによる制御を不要とするため、Row Level Securityを無効化する」）が`ALTER TABLE dtb_calendar
   DISABLE ROW LEVEL SECURITY;`を実行し、以降これを再有効化するmigrationは無い（実測）**。よって**現行migration
   chain上はRLSが無効**でありdb.ts経由のpsql直接操作はRLSに妨げられない見込みだが、これは「現時点の
   migration適用状態」に依存する事実であり断定しない。D8実装時に`SELECT relrowsecurity FROM pg_class WHERE
   relname='dtb_calendar';`で都度確認したうえで復元処理を組む。
4. **sequence影響**: `id`は`#[ORM\GeneratedValue(strategy: 'IDENTITY')]`（`Calendar.php:46`）。固定idを明示指定した
   re-INSERTはDoctrineのID生成経路を経由しないため、基盤のsequence（またはIDENTITY内部カウンタ）の`nextval`状態
   には影響しない想定だが、正確な採番方式（プレーンsequence+DEFAULT／SQL標準GENERATED AS IDENTITY）はD8実装時に
   `\d dtb_calendar`相当で確認し、断定しない（900101201〜のような大きい帯を使うことでアプリ側の通常採番との
   衝突は避けている）。

| SEEDセットID | 目的 | 固定値（設計） | 後始末 |
|---|---|---|---|
| SEED-M01-ADMIN | 管理者ログイン | W0/B0各機能と共通（管理画面ログイン可能なmember） | 不変 |
| SEED-M10-12-LIST | 一覧ID降順・店舗絞込の観測 | `dtb_calendar` 3件（帯@TBD-D5）: id=900101201(holiday=2026-08-01)・id=900101202(holiday=2026-08-05)・id=900101203(holiday=2026-08-09)。いずれも同一`base_info_id`=解決される既定店舗 | UPSERTべき等・不変（読取専用） |
| SEED-M10-12-ROW | インライン編集の対象行（成功・失敗・has-error表示） | `dtb_calendar` 1件: id=900101211・title=`M1012初期タイトル`・holiday=2026-08-11・base_info_id=既定店舗 | **UPSERTべき等・保存系ケース後にafterEachで同値へ再適用**（title/holiday復元を含む） |
| SEED-M10-12-ROW2 | 他行不変の対照（calendar_id不一致・行数不変の確認） | `dtb_calendar` 1件: id=900101212・title=`M1012行2`・holiday=2026-08-12・base_info_id=既定店舗 | UPSERTべき等・再適用 |
| SEED-M10-12-DUP | 同日重複拒否（作成・更新の両経路で使用する既存の重複対象） | `dtb_calendar` 1件: id=900101221・title=`M1012重複対象`・holiday=2026-09-01・base_info_id=既定店舗 | 不変（読取専用の重複判定対象。書換なし） |
| SEED-M10-12-DELETE | 削除成功／CSRF不正削除 | `dtb_calendar` 1件: id=900101231・title=`M1012削除対象`・holiday=2026-09-11・base_info_id=既定店舗 | **削除系ケース後にafterEachで同一id・同一値へre-INSERT復元** |

- **S0規律**: 「保存されない/変更されない/削除されない」の期待は、操作前にdb.tsで取得したスナップショット
  （例 `S0=SELECT title, holiday FROM dtb_calendar WHERE id=900101211`）との同値比較で書く。SEED投入値の
  リテラルは前提・復元にのみ使う（期待値の正はL1オラクルID）。
- 新規作成の後始末は`title LIKE 'E2E-<runid>-%'`該当行の削除（既存の`e2e/helpers/db.ts`が持つ
  `queryRows`/`queryScalar`等の汎用関数を使い、`dtb_news`専用ラッパーと同様の専用ラッパーは実装フェーズ
  （D8以降）で追加する。本候補段階では正式ファイルへの追記は行わない）。
- 対象行の一意特定は**固定id**で決定的。存在しない出荷/行id相当の参照には`999999901`（帯衝突なし）を用いる。

## §3 画面項目マトリクス（任意/必須/最大長/文字種/所在）

三値比較: 設計書md（入力項目表:166-169）／ee Form（`CalendarType.php`）／ee DB（`Calendar.php`・`TenantTrait.php`）。

| 項目 | 任意/必須（**DOC-DRAFT**注記） | 最大文字数（Form層/DB層・unit=文字） | 文字種・範囲 | 所在 | 境界・代表値 | メッセージ（ja/en・L1参照） |
|---|---|---|---|---|---|---|
| タイトル（title） | 設計書=必須（md:168）／ee=`required=>true`はビュー用のみ・**NotBlank制約なし**＝**DOC-DRAFT-M1012-01**（C-007実機裁定） | **Form 255**（`eccube_stext_len`）**／DB 255**（`Calendar.php:50`）→**段差0** | 制約なし（`Assert\Length`のみ。文字種検証は不存在） | 新規行フォーム＋各行のインライン編集フォーム（同一`CalendarType`） | `runFill(255,mixed,"E2E-<runid>-")`受理＋DB char_length=255（補完S-004）／`runFill(256,ascii,…)`拒否・DB不到達（補完S-004-EN） | 超過: L1-014（欄直下`form_errors(form.title)`） |
| 日付（holiday） | 設計書=必須（md:169）／ee=`required=>true`はビュー用のみ・**NotBlank制約なし**＝**DOC-DRAFT-M1012-01（holiday側）**（C-007実機裁定）。DB列はNOT NULL | Form層は文字数制約なし（日付型・単一入力DateType） | `Assert\Range(min:'0003-01-01')`のみ。相関: 同一`holiday`+同一店舗の重複は別途POST_SUBMITでbound済み（L1-016） | 同上 | `0002-12-31`拒否（補完S-005・C-008も同トリガーを流用）／`2026-08-11`等の通常値は受理／同日重複値は新規側で拒否確認（C-010）・**更新側は実機裁定**（C-013・BC-DRAFT-M1012-02） | 範囲外: L1-015（`form_error.out_of_range`）／重複: L1-016（新規側確定）・L1-029（更新側裁定） |

## §4 実行可能グレード14列TSV（候補・**自己完結＝全34行を実体掲載**）

記法: 期待結果セルは三段参照 `…実値… [L1:<oracle_id>; fixture:<SEEDセットID>@TBD-D5]`。
`%eccube_admin_route%` は環境値（既定 `admin`）。ROW=id900101211（SEED-M10-12-ROW）・ROW2=id900101212
（SEED-M10-12-ROW2）・DUP=id900101221（SEED-M10-12-DUP、holiday=2026-09-01）・DEL=id900101231
（SEED-M10-12-DELETE）・LIST=id900101201/202/203（SEED-M10-12-LIST）。
登録操作=「新規行フォーム（`#calendar_item_new`）へ入力し`admin.common.create__new`ボタン押下（POST `.../calendar/new`）」。
インライン編集操作=「鉛筆押下→編集欄へ入力→`admin.common.decision`ボタン押下（POST `.../calendar`、
`calendar_id`＋`mode=edit_inline`同梱）」。en行はD15前提。

記法追記: **不変性の期待は操作前スナップショット `S0`（db.ts照会値）との同値比較**で書く
（`S0=SELECT title, holiday FROM dtb_calendar WHERE id=<id>` を操作前に取得）。SEED固定値は前提・復元にのみ使う。

### §4.1 bound対応候補行（23行=ja19＋-EN4。§8の87対応表が参照する全行）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012C-001	IT-23	表示順	P1	一覧がID降順で表示される	ログイン済(SEED-M01-ADMIN)／SEED-M10-12-LIST	—	1. GET /%eccube_admin_route%/setting/shop/calendar 2. 一覧行のtr id="ex-calendar-{id}"順にidを取得	取得id列が900101203,900101202,900101201の順（ID降順）と完全一致 [L1:L1-M1012-004; fixture:SEED-M10-12-LIST@TBD-D5]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012C-002	IT-20	出力抑止	P1	一覧は解決された店舗に紐付く行のみ表示され画面はエラーなく継続する	ログイン済／SEED-M10-12-LIST	—	1. GET /%eccube_admin_route%/setting/shop/calendar 2. 一覧行数と新規用空白行(#calendar_item_new)の存在を確認	HTTP200・一覧にSEED-M10-12-LISTの3行のみ表示（他店舗行が無いこと=単一店舗環境での実証）・#calendar_item_newが存在。※複数モール構成での店舗切替の読み替え（md:186）はTBD・要実機（単一店舗解決の範囲で自立） [L1:L1-M1012-006; fixture:SEED-M10-12-LIST@TBD-D5]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012C-003	IT-25	識別子	P1	新規行にタイトルと日付を入力し送信→新規レコードとして保存されフラッシュ後ホームへ遷移	ログイン済	title=`E2E-<runid>-新規`／holiday=2026-10-01	1. 新規行フォームへ入力 2. 登録ボタン押下 3. 遷移先とフラッシュを読む 4. db.tsで該当行(title prefix)を照会（afterEach: title prefix該当行を削除）	「保存しました」フラッシュ＋admin_homepageへ遷移＋dtb_calendarに新規行が1件追加され title=入力値・holiday=入力値(日時)・base_info_id=解決店舗のid・create_date/update_dateが設定される（T1≦値≦T2のブラケット判定） [L1:L1-M1012-003,L1-M1012-005,L1-M1012-007,L1-M1012-006,L1-M1012-017,L1-M1012-018,L1-M1012-024,L1-M1012-028]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012C-003-EN	IT-25	識別子	P2	新規作成成功フラッシュ（en）	ログイン済／locale=en	同上	同上	"Saved" 表示＋admin_homepageへ遷移（主判定はC-003と同一） [L1:L1-M1012-005]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012C-004	IT-25	状態変化	P1	既存行の鉛筆押下で閲覧表示が隠れ編集用テキスト・日付ピッカーが現れる（JSのみ・DB不変）	ログイン済／SEED-M10-12-ROW	—	1. GET一覧を開く 2. db.tsでS0=title,holidayを照会 3. 当該行のa.edit-button押下 4. 当該行の.list/.editのCSS表示状態を読む 5. db.tsで再照会	当該行の.listが非表示・.editが表示（サーバ往復なし）＋dtb_calendar(id=900101211)=S0と同値（表示切替のみでDB不変） [L1:L1-M1012-008; fixture:SEED-M10-12-ROW@TBD-D5]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012C-005	IT-23	確認ダイアログ	P1	インライン編集「決定」送信のPOSTにcalendar_id・mode=edit_inlineの隠しフィールドが含まれる	ログイン済／SEED-M10-12-ROW	—	1. 当該行を編集状態にする 2. POST送信直前のフォームDOMで input[name=calendar_id] の値と input[name=mode] の値を読む（またはネットワークキャプチャでリクエストボディを読む）	input[name=calendar_id]の値=900101211・input[name=mode]の値=edit_inline（request契約の実体） [L1:L1-M1012-009; fixture:SEED-M10-12-ROW@TBD-D5]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012C-006	IT-25	HTTPステータス	P1	削除リンクがCSRF属性とdata-method=deleteを持ちモーダルから送信される	ログイン済／SEED-M10-12-DELETE	—	1. GET一覧を開く 2. 削除アイコン押下でモーダル(#DeleteModal_900101231)を開く 3. モーダル内 a.btn-ec-delete の href・data-method・CSRF用属性(csrf_token_for_anchor由来の属性)を読む	href が admin_setting_shop_calendar_delete(id=900101231) を指す・data-method="delete"・CSRF属性が付与されている [L1:L1-M1012-010; fixture:SEED-M10-12-DELETE@TBD-D5]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012C-007	IT-22	必須	P1	タイトル・日付を空にして送信（必須制約の実機裁定・DOC-DRAFT-M1012-01）	ログイン済	title=空／holiday=空	1. 新規行フォームでtitle・holidayを空にして送信を試みる（HTML5必須属性のブラウザブロックを回避する直接POSTも試す） 2. 応答・エラー表示を読む 3. db.tsで新規行が追加されていないか照会	【実機裁定・確定期待にしない】設計書期待=「未入力および空白のみはフレームワークの必須検証により無効」（md:168-169）で保存されない／eeソース読み=titleはNotBlank不在（Length(max=255)は空文字を長さ0として許容）・holidayもNotBlank不在（Range(min)はvendor実測要確認だがnull/空をスキップし得る）でエラーにならない可能性があり、holidayがNOT NULL DB列であるため空値がフォーム層を素通りした場合はORM例外（500相当）に至る可能性もある。実機結果で裁定し、設計書側または実装側の是正候補を記録する [L1:L1-M1012-011,L1-M1012-012]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012C-008	IT-22	文字列長	P2	インライン編集でバリデーション失敗（日付範囲外・フィールド制約でBaseInfoに非依存＝両経路で確定的）→has-errorが付き編集ブロックのみ残る（codex R1是正: トリガーを重複日付から日付範囲外へ差替）	ログイン済／SEED-M10-12-ROW	holiday=0002-12-31（Range(min='0003-01-01')違反）	1. db.tsでS0=title,holiday(id=900101211)を照会 2. 当該行(900101211)を編集し範囲外日付を入力して決定押下 3. tr#ex-calendar-900101211 のclass一覧を読む 4. .list/.editの表示状態とholiday欄直下のエラー文言を読む 5. db.tsで再照会	tr要素にhas-errorクラスが付与され .list が非表示・.edit のみ表示される・holiday欄直下に「不正な日付です。」・dtb_calendar(id=900101211)=S0と同値（操作前スナップショットと同値=保存されない）。※このRange制約はholidayフィールドに直接付与され`$options['BaseInfo']`に依存しないため、L1-M1012-029（BC-DRAFT-M1012-02）の影響を受けず両経路で確定的 [L1:L1-M1012-013,L1-M1012-015; fixture:SEED-M10-12-ROW@TBD-D5]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012C-009	IT-25	相関	P2	カード見出しにツールチップ付きの画面名が表示される（ja）	ログイン済	—	1. GET一覧を開く 2. カード見出しのspanテキストとdata-bs-toggle="tooltip"のtitle属性を読む	見出し「定休日カレンダー設定」・title属性「定休日カレンダーに表示する定休日を設定できます。」（完全一致） [L1:L1-M1012-023]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012C-009-EN	IT-25	相関	P3	カード見出し・ツールチップ（en）	ログイン済／locale=en	—	同上	見出し "Calendar"・title属性 "You can set regular holidays for displaying in the business days calendar."（完全一致） [L1:L1-M1012-023]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012C-010	IT-22	相関	P1	新規作成で同一店舗・同一日付の既存行があると保存されずエラー文言が表示される（ja）	ログイン済／SEED-M10-12-DUP(holiday=2026-09-01)	title=`E2E-<runid>-重複`／holiday=2026-09-01	1. db.tsでN1=COUNT(*) FROM dtb_calendar照会 2. 新規行フォームで同日を入力し送信 3. 同一画面のholiday欄直下のエラー文言を読む 4. db.tsでN2=COUNT(*)とtitle prefix該当行の有無を照会	同一設定画面に留まり holiday欄直下に「同日の定休日が既に存在しているため、設定できません。」・admin_homepageへ遷移せずフラッシュも積まれない・N1=N2（新規行は追加されない） [L1:L1-M1012-016,L1-M1012-024; fixture:SEED-M10-12-DUP@TBD-D5]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012C-010-EN	IT-22	相関	P2	新規作成の重複日付エラー文言（en）	ログイン済／SEED-M10-12-DUP／locale=en	同上	同上	holiday欄直下に "Date is already existed."（完全一致。主判定=保存されないことはC-010と同一） [L1:L1-M1012-016]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012C-011	IT-22	部分入力	P2	一覧の非編集表示は日粒度(date_dayフィルタ)でholidayを表示する	ログイン済／SEED-M10-12-ROW(holiday=2026-08-11)	—	1. GET一覧を開く 2. 当該行(900101211)の.list内のholiday表示テキストを読む 3. db.tsでholidayの実値(タイムゾーン付き日時)を照会	表示テキストは日単位（2026-08-11相当の日付表現・時刻部分を含まない）・DB実値はタイムゾーン付き日時のまま（表示は丸め・保存は丸めない） [L1:L1-M1012-022; fixture:SEED-M10-12-ROW@TBD-D5]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012C-012	IT-26	更新内容	P1	インライン編集で既存行のタイトル・日付を変更し決定→DB反映・フラッシュ・ホーム遷移	ログイン済／SEED-M10-12-ROW	title=`E2E-<runid>-更新`／holiday=2026-08-21	1. 当該行(900101211)を編集し新値を入力して決定押下 2. 遷移先とフラッシュを読む 3. db.tsでtitle/holidayを照会（実行後SEED再適用） 4. db.tsでupdate_dateがcreate_dateより後で変化していることを照会	「保存しました」フラッシュ＋admin_homepageへ遷移＋dtb_calendar(id=900101211)のtitle/holidayが入力値に一致・update_dateが更新され現在時刻に近い（create_dateは不変） [L1:L1-M1012-007,L1-M1012-009,L1-M1012-017,L1-M1012-018,L1-M1012-024,L1-M1012-005; fixture:SEED-M10-12-ROW@TBD-D5]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012C-013	IT-26	更新内容	P1	【実機裁定・BC-DRAFT-M1012-02・codex R1是正】インライン編集で同一店舗・同一日付の他行と重複させたときの帰結を実機で確認する（更新側は`BaseInfo`未設定のため確定期待にしない）	ログイン済／SEED-M10-12-ROW＋SEED-M10-12-DUP(holiday=2026-09-01)	holiday=2026-09-01（DUPと同日）	1. db.tsでS0=title,holiday(id=900101211)を照会 2. 当該行を編集し重複日付を入力して決定押下 3. 応答（同一画面滞留かadmin_homepageへの遷移か）とholiday欄直下のエラー文言有無を読む 4. db.tsで再照会（更新が成立していればSEED再適用） 5. db.tsでDUP側(id=900101221)が変化していないことも照会	【確定期待にしない・両論併記】読みA(設計書の実装意図どおりなら)=同一設定画面に留まりholiday欄直下に「同日の定休日が既に存在しているため、設定できません。」・dtb_calendar(id=900101211)=S0と同値（保存されない）。読みB(BC-DRAFT-M1012-02のとおり`baseInfo=null`束縛でWHERE句が常に不成立なら)=重複チェックが働かずadmin_homepageへ遷移・dtb_calendar(id=900101211).holiday=2026-09-01(入力値)へ更新される（同日でも保存できてしまう＝実装バグ候補）。いずれの読みが実際に起きるかを実行結果で記録し、DOC-DRAFT/BC-DRAFT裁定として`BUG_CANDIDATE_REGISTER.md`系への転記要否を判断する。DUP側(id=900101221)はいずれの読みでも不変（S0と同値） [L1:L1-M1012-029,L1-M1012-016,L1-M1012-024; fixture:SEED-M10-12-ROW@TBD-D5,SEED-M10-12-DUP@TBD-D5]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012C-014	IT-25	モーダル	P2	新規作成POSTでCSRFトークンを改変すると保存されない	ログイン済	title=`E2E-<runid>-CSRF改変`／holiday=2026-10-11／_tokenを末尾1文字置換した改変値	1. GET一覧でtoken初期値を取得 2. 改変tokenで新規行POSTを送信 3. 応答（同一画面再構成）を読む 4. db.tsでtitle prefix該当行が0件であることを照会	フォーム検証（Symfony CSRF拡張）が不正と判定し保存されない（同一設定画面に留まりadmin_homepageへ遷移しない）・dtb_calendarに新規行が追加されない [L1:L1-M1012-002(Form経由のCSRF＝index()のisValid()に内包)]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012C-015	IT-25	必須バリデーション	P1	削除実行（正規CSRF）→対象行がDBから削除されフラッシュが積まれる（ja）	ログイン済／SEED-M10-12-DELETE	—	1. モーダル内の削除実行リンク(csrf_token_for_anchor正規トークン付き)押下でDELETE送信 2. フラッシュを読む 3. db.tsで id=900101231 の不存在を照会（afterEach: 同一id・同一値でre-INSERT復元）	「削除しました」フラッシュ＋dtb_calendarに id=900101231 が存在しない（remove+flushの即時反映）。応答本体（画面遷移の有無）はソース上明示のリダイレクトが無く要実機（§9-4） [L1:L1-M1012-005,L1-M1012-021; fixture:SEED-M10-12-DELETE@TBD-D5]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012C-015-EN	IT-25	必須バリデーション	P2	削除成功フラッシュ（en）	ログイン済／SEED-M10-12-DELETE(再適用後)／locale=en	—	同上	"Deleted" 表示（主判定=DB行削除はC-015と同一） [L1:L1-M1012-005]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012C-016	IT-22	文字列長	P1	削除実行時CSRFトークンが不正・欠落→アクセス拒否例外となり行は削除されない	ログイン済／SEED-M10-12-DELETE	_tokenを末尾1文字置換した改変値でDELETE送信	1. 改変tokenでDELETE /%eccube_admin_route%/setting/shop/calendar/900101231/delete を送信 2. 応答ステータスを読む 3. db.tsで id=900101231 の存在を照会	`AccessDeniedHttpException`相当のアクセス拒否応答（403系）・dtb_calendarに id=900101231 が引き続き存在する（削除されない） [L1:L1-M1012-020,L1-M1012-021; fixture:SEED-M10-12-DELETE@TBD-D5]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012C-017	IT-13	相関バリデーション	P2	インラインPOSTのcalendar_idがどの行のIDとも一致しない→全行とも更新されず一覧が再構成されるのみ	ログイン済／SEED-M10-12-ROW＋SEED-M10-12-ROW2	calendar_id=999999901（存在しないid）／mode=edit_inline／POSTボディの他フィールドは任意の変更値	1. db.tsでS0_1(id=900101211)・S0_2(id=900101212)を照会 2. mode=edit_inline・calendar_id=999999901でPOST送信 3. 応答（一覧再表示）を読む 4. db.tsで両行を再照会	フラッシュ・リダイレクトは発生せず同一設定画面が再構成される・dtb_calendar(id=900101211,900101212)=それぞれS0_1,S0_2と同値（操作前スナップショットと同値=いずれの行も更新されない） [L1:L1-M1012-019; fixture:SEED-M10-12-ROW@TBD-D5,SEED-M10-12-ROW2@TBD-D5]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012C-018	IT-26	削除条件	P2	削除確認モーダルに削除対象タイトルを差し込んだ確認文言が表示される	ログイン済／SEED-M10-12-DELETE(title=`M1012削除対象`)	—	1. 削除アイコン押下でモーダル(#DeleteModal_900101231)を開く 2. h5.modal-titleとp.modal-messageのテキストを読む	見出し「削除します」・本文「この操作はあとから取り消すことができません。「M1012削除対象」を削除してよろしいですか？」（%name%差込がSEEDのtitleと一致） [L1:L1-M1012-010; fixture:SEED-M10-12-DELETE@TBD-D5]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012C-019	IT-20	内部情報	P2	DBカラムの型・意味を検証する（holiday=タイムゾーン付き日時・base_info_id=店舗FK・update_date=更新タイムスタンプ）	ログイン済／SEED-M10-12-ROW	—	1. db.tsで information_schema.columns（table_name='dtb_calendar'）のholiday/base_info_id/update_dateのdata_type・is_nullableを照会 2. dtb_calendar(id=900101211).base_info_idが現在解決されている店舗のidと一致することを照会	holiday: data_type=timestamp with time zone・is_nullable=NO／base_info_id: 数値型・is_nullable=NO・値=解決店舗id／update_date: timestamp with time zone・is_nullable=NO [L1:L1-M1012-003,L1-M1012-017; fixture:SEED-M10-12-ROW@TBD-D5]				
```

### §4.2 補完行（11行=ja7＋-EN4。**親test_idなし・母集合会計に算入しない**。理由=設計書に規定はあるが
母集合87行の期待テキストに対応する親が存在しない実在項目）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012S-001	IT-15	権限	P1	未ログインで一覧URL直接アクセス→ログイン画面へリダイレクト	未ログイン	—	1. GET /%eccube_admin_route%/setting/shop/calendar	admin_login のログイン画面へリダイレクトされ一覧は表示されない（補完行・親test_idなし・設計書md:74の到達前拒否規定） [L1:L1-M1012-001,L1-M1012-002]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012S-002	IT-15	権限	P2	未ログインで削除URLへDELETE→到達せず削除されない	未ログイン（cookie無しrequest）／SEED-M10-12-DELETE	DELETE /calendar/900101231/delete（cookie無し）	1. 認証cookie無しでDELETE送信 2. 応答とDBを確認	削除処理へ到達せず admin_login への誘導応答相当・行は削除されない（補完行・親test_idなし） [L1:L1-M1012-001,L1-M1012-020,L1-M1012-021; fixture:SEED-M10-12-DELETE@TBD-D5]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012S-003	IT-26	同時更新	P2	同一行への複数管理セッションの連続保存は最後の保存が残る（後勝ち・ロックなし）	ログイン済×2管理セッション(A/B・いずれもSEED-M01-ADMIN)／SEED-M10-12-ROW	A: title=`E2E-<runid>-CCA`／B: title=`E2E-<runid>-CCB`（holidayは重複しない値に各自変更）	1. セッションA・Bそれぞれで一覧を開きtoken取得 2. 同一行(900101211)へ A→B の順で連続インライン編集保存（真の同時実行は非決定的のため順序を確定） 3. db.tsでtitleを照会（実行後SEED再適用）	両保存ともエラーにならず admin_homepage へ遷移・dtb_calendar(id=900101211).title=`E2E-<runid>-CCB`（最後の保存が残る=後勝ち。ロック競合エラーは発生しない） [L1:L1-M1012-025,L1-M1012-009,L1-M1012-018; fixture:SEED-M10-12-ROW@TBD-D5]（補完行・親test_idなし）				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012S-004	IT-22	境界	P2	タイトル255字(上限)は受理されDBへ保存	ログイン済	title=runFill(255,mixed,"E2E-<runid>-")／holiday=2026-10-21	1. 新規行フォームへ255字を入力し送信 2. フラッシュ・遷移確認 3. db.tsでchar_length(title)=255を照会（afterEach: title prefix該当行を削除）	保存成功（「保存しました」）＋admin_homepageへ遷移＋DB文字長=255（補完行・親test_idなし・設計書md:168の最大長規定） [L1:L1-M1012-014,L1-M1012-017]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012S-004-EN	IT-22	境界	P2	タイトル256字の超過文言（en）	ログイン済／locale=en	title=runFill(256,ascii,"E2E-<runid>-")／holiday=2026-10-22	1. 新規行フォームへ256字を入力し送信 2. エラー表示を読む 3. db.tsでtitle prefix該当行が0件であることを照会	"This value is too long. It should have 255 characters or less." が表示され保存されない（補完行・親test_idなし） [L1:L1-M1012-014]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012S-005	IT-22	境界	P2	日付が0003-01-01未満は範囲エラーとなり保存されない（ja）	ログイン済	title=`E2E-<runid>-日付下限`／holiday=0002-12-31	1. 新規行フォームへ下限未満の日付を入力し送信 2. holiday欄直下のエラー文言を読む 3. db.tsでtitle prefix該当行が0件であることを照会	「不正な日付です。」が表示され保存されない（補完行・親test_idなし・設計書md:134の下限規定） [L1:L1-M1012-015]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012S-005-EN	IT-22	境界	P3	日付下限違反の文言（en）	ログイン済／locale=en	title=`E2E-<runid>-日付下限en`／holiday=0002-12-31	同上	"Invalid DateTime." が表示される（補完行・親test_idなし） [L1:L1-M1012-015]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012S-006	IT-25	画面レイアウト	P3	一覧見出し列が「タイトル」「日付」である（ja）	ログイン済	—	1. GET一覧を開く 2. thead th のテキストを読む	見出しに「タイトル」「日付」（ID列を含む）が存在（補完行・親test_idなし） [L1:L1-M1012-027]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012S-006-EN	IT-25	画面レイアウト	P3	一覧見出し列（en）	ログイン済／locale=en	—	同上	見出しに "Title"・"Date" が存在（補完行・親test_idなし） [L1:L1-M1012-027]				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012S-007	IT-25	画面レイアウト	P3	編集フォームの日付欄ラベルが「登録日(開始)」を再利用している（字面不一致の記録・ja）	ログイン済／SEED-M10-12-ROW	—	1. 当該行を編集状態にする 2. holiday入力欄のlabelテキストを読む	ラベルが「登録日(開始)」（休業日入力欄でありながら登録日ラベルを流用＝設計書md:86が明記する字面quirk） [L1:L1-M1012-026; fixture:SEED-M10-12-ROW@TBD-D5]（補完行・親test_idなし）				
m10-12_admin_base_setting_setting_shop_calendar	E2E-M1012S-007-EN	IT-25	画面レイアウト	P3	日付欄ラベル再利用（en）	ログイン済／SEED-M10-12-ROW／locale=en	—	同上	ラベルが "Registration Date (Start)"（補完行・親test_idなし） [L1:L1-M1012-026]				
```

## §5 locale対応表

LS=1 claim: **L1-005（保存/削除フラッシュ）・L1-014（title超過メッセージ）・L1-015（holiday範囲メッセージ）・
L1-016（重複日付メッセージ）・L1-023（カード見出し/ツールチップ）・L1-026（ラベル流用quirk・補完専用）・
L1-027（一覧見出し列・補完専用）** の7claim → -EN 8行（bound4＋補完4）。
- bound従属: C-003-EN（L1-005）／C-009-EN（L1-023）／C-010-EN（L1-016）／C-015-EN（L1-005）。
- 補完従属: S-004-EN（L1-014）／S-005-EN（L1-015）／S-006-EN（L1-027）／S-007-EN（L1-026）。
- 全行§4に実体掲載（自己完結）。文言はen一次資料逐語（ja翻訳ゼロ）。
- L1-014の超過メッセージはW0/m05-13と同一vendor（symfony/validator v7.4.3）のchoice複数側を再利用（limit=255）。
- -EN実行前提はD15（M0 Go/No-Go。管理画面のen切替口なし＝W0実測を継承）。

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

- page/spec: **【codex R1是正・誤り訂正】本機能専用のpage/specは実在する**
  （`e2e/pages/admin/m10/m10_12_admin_base_setting_setting_shop_calendar.page.ts`・
  `e2e/spec/admin/m10/m10_12_admin_base_setting_setting_shop_calendar.spec.ts`・実測で確認。前版の
  「0件」記載は誤り）。ただし両ファイルは**別の既存ケース表**（`integration_test/e2e/m10_12_..._e2e_cases.md`・
  test id体系=`E2E-M10-12-NNN`）に対応する既存の未実行フィクスチャであり、本候補（test id体系=
  `E2E-M1012C-NNN`・`E2E-M1012S-NNN`）とは**別系統**。本候補_drafts/はこれらのファイルを消費しておらず、
  逆にこれらのファイルも本候補_drafts/を参照していない（隔離維持・grep相互参照0件）。既存page.tsは
  有用な実装事実を記録している: (a) 新規行・各既存行とも`CalendarType::getBlockPrefix()`が同一`'calendar'`
  のため生成されるDOM id（`#calendar_title`・`#calendar_holiday`・`#calendar__token`）が**行ごとに重複**し、
  祖先要素（`#calendar_item_new`または`tr#ex-calendar-{id}`）でスコープする必要がある（既存page.ts内
  「不具合候補#1」注記・実測で確認）。本候補のC-005/C-008/C-012/C-013等のDOM参照も同様に**行スコープ必須**
  である旨を明記する。 (b) 既存spec.tsのtest.fixme（E2E-M10-12-033）は本候補のC-013と同じ「インライン編集
  同日重複（自ID除外）」を主題にしているが、**BaseInfoオプション未設定（BC-DRAFT-M1012-02）には言及していない**
  （既存spec.tsは設計書どおりの帰結を前提にしたfixmeであり、本候補はcodex R1指摘によりこの前提を検証対象に
  格上げしている点で既存artifactより踏み込んでいる）。
  実装フェーズ（D8以降）でセレクタは上記の行スコープ規約を踏まえて導出する（本書§1のtwig引用箇所からも
  導出可能）。
- db.ts: 既存の汎用関数（`queryScalar`/`queryNumber`/`queryRows`/`sqlLiteral`）を`dtb_calendar`向けの生SQLで
  直接使う（`dtb_news`専用ラッパーと同様の専用ラッパー追加は実装フェーズの作業であり、本候補段階では
  正式ファイル`e2e/helpers/db.ts`への追記を行わない＝正式パス書込禁止の遵守）。
- 境界値は`runFill(n, repertoire, prefix)`（決定的生成、既存ヘルパの型を踏襲）。
- **不変性の判定規約**: 「保存されない・変更されない・削除されない」の期待は**操作前スナップショットS0
  （db.ts照会値）との同値比較**で判定し、SEED初期値リテラルを期待の正にしない（三段参照）。
- **破壊系の実装規約**: 保存系ケース（C-003,010,012,013,014／補完S-003,004,005）は対象=固定idのSEED行のみ・
  新規作成は`title prefix`で対象を特定してafterEachで削除、既存行更新は**afterEachでSEED値へUPSERT復元**。
  削除系ケース（C-015,016）は**afterEachで同一id・同一値へre-INSERT復元**（`dtb_calendar`に履歴側テーブルは
  存在しないため単純復元で足りる＝§2参照）。

**_drafts/隔離lintの実施証跡（実測・実施済み）**:
1. 正式消費側（`e2e/helpers/oracle.ts`・`db.ts`・spec・pages）に本草案を消費する`_drafts`参照は**0件**
   （隔離ガード自体のリテラル〔oracle.ts側〕は機械強制であり消費参照ではない）。
2. 正式パス`e2e/fixtures/oracle/`直下に本機能のjsonは**作成していない**（草案は`_drafts/`のみ）。
3. `e2e/helpers/db.ts`への追記・変更は**行っていない**（`git status`相当の確認＝本セッションでの編集対象は
   `_drafts/`配下の2ファイルのみ）。
4. 本md・oracle草案jsonの出力先はともに`_drafts/`配下のみ。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

| ケース群 | 実行区分（候補） | 観測層 | 備考 |
|---|---|---|---|
| C-001,002,009(+EN),011,019 | Playwright+db.ts | GUI+DB | 表示・DBカラム型確認 |
| C-003(+EN),012 | Playwright+db.ts | GUI+DB | 作成/更新成功。実行後SEED再適用または title prefix削除 |
| C-004,005,006,018 | Playwright | GUI/DOM | JS/DOM確認（サーバ往復・DB関与なし） |
| C-007 | 実機裁定（DOC-DRAFT-M1012-01） | HTTP+DB | 確定期待にしない |
| C-008,010(+EN),017 | Playwright+db.ts | GUI+DB | 検証失敗・DB不変（S0同値）。C-008は日付範囲外がトリガー（BaseInfoに非依存で確定的・codex R1是正） |
| C-013 | **実機裁定（BC-DRAFT-M1012-02）** | GUI+DB | 更新側`BaseInfo`未設定の帰結は確定不能。両論併記・DB不変側(DUP行)のみ確定 |
| C-014 | Playwright(request契約)+db.ts | HTTP+DB | CSRF改変・Form層拒否 |
| C-015(+EN),016 | Playwright(request契約)+db.ts | HTTP+DB | 削除成功/CSRF拒否。実行後re-INSERT復元 |
| 補完S-001,002 | Playwright | HTTP | 認証（親test_idなし） |
| 補完S-003 | Playwright+db.ts | HTTP+DB | 並行実行serial必須（親test_idなし） |
| 補完S-004(+EN),005(+EN),006(+EN),007(+EN) | Playwright+db.ts | GUI+DB | 境界・字面quirk（親test_idなし） |

聖域判定・多軸属性の正式付与はD14 v2合格後（本表は暫定・正式会計に使わない）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（§0判定原則。前提/入力列のシナリオ語・観点ラベルはノイズ）。
1候補ケース行=1 assertion bundle・多対一は`shared-observation`・-EN行は対応ja行と同一親のlocale多重。
**参照先の全候補行は§4に実体掲載済み＝87↔候補の期待テキスト突合が本文内で完結する**。

### 集計（87 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **70** | 下表（うちDOC-DRAFT裁定行bind=2〔009,075→C-007〕・**BC-DRAFT裁定行bind=1〔015→C-013・codex R1新設〕**。C-013は更新側`BaseInfo`未設定により確定期待にしない実機裁定行だが、母集合015の「相関バリデーションでエラーが表示され完了しない」という**主題（更新側の重複チェックの帰結）自体はC-013で扱う**ため会計はbound維持（m05-13のDOC-DRAFT裁定行bind先例と同型）） |
| **TBD** | **0** | — |
| **excluded** | **17** | EX-A 検索・実行結果取得系17（019〜035。母集合md:37相当の対象外規定に加え、本機能一覧に検索フォーム・
  ページングが実装上存在しない＝calendar.twigにform要素の検索入力0件・`getListOrderByIdDesc`は
  ユーザー指定の検索条件を取らない。**per-IDの実引きは下表**） |
| 合計 | **87** | 欠落0・理由なし重複0 |

- 候補ケース行総数**34**（§4.1 bound対応23＝ja19＋-EN4／§4.2 補完11＝ja7＋-EN4）。
- **相関バリデーション（012〜017）はbound**（本機能固有）: `CalendarType.php`のPOST_SUBMITイベントに
  同一`holiday`+同一店舗の重複チェックが実在する（79-117行逐語）ため、m05-13/m05-17の「相関constraint
  不存在→excluded」先例をそのまま適用すると偽陰性になる。期待テキストの極性（エラーあり/なし）を
  **確定的なのは新規側のみ**（`CalendarController.php:56-59`が`BaseInfo`を明示的にオプション渡ししているため）
  C-010（新規側・確定bound）へ、更新側は`CalendarController.php:87`が`BaseInfo`を渡さないため確定不能と判明し
  （**codex R1新設のBC-DRAFT-M1012-02**）、C-013（更新側・実機裁定行）へbindする（過剰boundにしないための
  是正・§9参照）。

### EX-A 17件の実引き表（test_idごとのTSV実引き・偽陰性なしの根拠）

全17行の**操作手順列は同一の生成器定型**（逐語）: 「1. 検索条件〔033-035は「実行結果」〕の対象レコードと
前提状態を用意する / 2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる / 3. 対象テーブルの
レコード（区分・件数・更新値）を確認する」＝機能固有の操作を指定しない定型。除外判定は期待テキスト
実内容（検索取得の主張）による。

| test_id | 前提列の項目（ノイズ列・実引き） | 期待結果（逐語） | 除外根拠（一次資料実引き） | 実項目の代替bound先 |
|---|---|---|---|---|
| 019 | 同一日の禁止 | 検索条件の該当レコードが取得結果に含まれること。 | 「検索条件の…取得結果」＝検索取得主張。calendar.twigに検索フォーム0件（grep実測）・`getListOrderByIdDesc`はユーザー検索条件を取らない | 同一日の禁止→C-010,C-013 |
| 020 | 成功後遷移 | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上 | 成功後遷移→C-003,C-012 |
| 021 | タイトル | 検索条件の該当レコードが取得結果に含まれること。 | 同上 | タイトル保存→C-003 |
| 022 | 日付 | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上 | 日付保存→C-003 |
| 023 | インラインPOSTが特定行だけにヒットしない | 検索条件の該当レコードが取得結果に含まれること。 | 同上 | エッジケース→C-017 |
| 024 | CSRFが欠けるまたは不正な削除 | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上 | CSRF削除拒否→C-016 |
| 025 | 論理削除や複数法人のクロス混入 | 検索条件の該当レコードが取得結果に含まれること。 | 同上（design mdも当画面クエリのみを根拠に書かないと自己宣言=md:177） | 削除の拒否側→C-016 |
| 026 | 画面上の一覧と永続データ | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上 | 削除成功→C-015 |
| 027 | 店舗切替 | 検索条件の該当レコードが取得結果に含まれること。 | 同上（design mdも複数モール構成は読み替えがあると自己宣言=md:186） | 店舗切替→C-002(partial/TBD注記) |
| 028 | フロントブロック側 | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上（design mdもサイト側は別機能の正と自己宣言=md:187） | 削除成功側→C-015(shared) |
| 029 | 成功時出力 | 検索条件の該当レコードが取得結果に含まれること。 | 同上 | 成功時出力→C-003,C-012 |
| 030 | 失敗時出力 | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上 | 失敗時出力→C-010,C-013 |
| 031 | 副作用 | 検索条件の該当レコードが取得結果に含まれること。 | 同上 | 副作用(DB増減)→C-003,C-012,C-015 |
| 032 | dtb_calendar | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上 | DBカラム→C-019 |
| 033 | dtb_calendar | 実行結果の該当レコードが取得結果に含まれること。 | 「実行結果の…取得結果」＝同型の検索取得主張（m05-13/m09-01が同skeletonを除外した先例と同型）。本機能に033の前提（他行に対応期待の無い実在仕様）は存在しない＝偽陰性の懸念なし（同時更新はL1-025として補完S-003で別途bound済み） | DBカラム→C-019(shared) |
| 034 | 登録/更新 | 実行結果の該当レコードが取得結果に含まれること。 | 同上 | 登録/更新→C-003,C-012 |
| 035 | 日付 | 実行結果の該当レコードが取得結果に含まれること。 | 同上 | 日付必須→C-007(DOC-DRAFT) |

（境界判定の確認）**m05-13のR1教訓（「同時更新」等の実在仕様が前提列にのみ現れ他行に対応期待が無い場合は
bound化する）を本機能でも適用検証済み**: 母集合87行の前提列を全数走査した結果、m10-12には「同時更新」
「排他制御」等の実在仕様を指す前提語は存在しない（該当母集合行が無い）。したがって033〜035の除外に
偽陰性は生じない。同時更新（後勝ち・ロックなし=md:319-322）は母集合に対応行を持たない実在仕様のため
**補完S-003**として別途bound（母集合会計には算入しない）。

### 87対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | dtb_calendarの1レコード定義（タイトル・日付・店舗紐付け） | bound | C-003 (shared・エンティティ形状の実証) |
| 002 | IDの降順であること | bound | C-001 |
| 003 | 保存完了/削除完了の共通成功文言キー | bound | C-003,C-015 (shared) |
| 004 | 現在のログインコンテキストで解決した店舗に紐付く一覧表示 | bound | C-002 |
| 005 | 入力がすべて有効かつ同日の別行が無いとき新規保存される | bound | C-003 |
| 006 | 当該行の閲覧表示が隠れテキスト・日付ピッカーが現れる | bound | C-004 |
| 007 | 対象行IDとモードを示す隠しフィールドを含むPOSTが飛ぶ | bound | C-005 |
| 008 | 削除リンクのCSRF属性・隠しフォーム生成・メソッド上書き送信 | bound | C-006 |
| 009 | 必須バリデーションでエラーが表示され完了しない | bound | C-007（**DOC-DRAFT-M1012-01裁定行**） |
| 010 | 必須バリデーションでエラーが表示されず継続できる | bound | C-003 (shared・有効入力の継続) |
| 011 | has-errorが付き閲覧ブロックを隠し編集ブロックのみ残す | bound | C-008 |
| 012 | 相関バリデーションでエラーが表示され完了しない | bound | C-010 (shared) |
| 013 | 相関バリデーションでエラーが表示されず継続できる | bound | C-003 (shared・重複なしの継続) |
| 014 | 相関バリデーションでエラーが表示されず継続できる | bound | C-012 (shared・更新側の継続) |
| 015 | 相関バリデーションでエラーが表示され完了しない | bound | C-013（**BC-DRAFT-M1012-02裁定行・codex R1新設**。更新側の重複チェックの帰結を主題とするが確定期待にしない） |
| 016 | DBとの相関バリデーションでエラーが表示されず継続できる | bound | C-003,C-012 (shared) |
| 017 | DBとの相関バリデーションでエラーが表示され完了しない | bound | C-010 (新規側・確定bound)・C-013 (更新側・裁定行として補助参照) |
| 018 | 保存済み一覧はdate_dayで日粒度表示（内部は日時） | bound | C-011 |
| 019〜035 | 検索条件/実行結果の該当レコードが取得結果に含まれる(ない) | **excluded** EX-A（§9実引き表） | — |
| 036 | 登録内容の対象レコードが追加されること | bound | C-003 (shared) |
| 037 | 登録内容の対象レコードが追加されないこと | bound | C-014（CSRF改変で拒否） |
| 038 | 登録内容の対象レコードが追加されること | bound | C-003 (shared) |
| 039 | 管理者向けホームであること（インライン更新成功の遷移先） | bound | C-012 (shared) |
| 040 | 登録内容の対象レコードが追加されること | bound | C-003 (shared) |
| 041 | 登録内容の対象レコードが追加されること | bound | C-003 (shared) |
| 042 | 登録内容の対象レコードが追加されないこと | bound | C-010 (shared・重複拒否) |
| 043 | 登録内容の対象レコードが追加されること | bound | C-003 (shared・画面を開く前提はノイズ・極性のみ採用) |
| 044 | 登録内容の対象レコードが追加されないこと | bound | C-010 (shared・新規側の重複拒否と直接対応) |
| 045 | 登録内容の対象レコードが追加されること | bound | C-003 (shared) |
| 046 | 実行結果の対象レコードが追加されること（前提=インライン決定送信） | bound | C-012 (shared・「追加」は generator の verb不一致だが実質は行内容の変更＝C4-manual注記) |
| 047 | 削除リンクのCSRF属性・隠しフォーム生成・メソッド上書き送信 | bound | C-006 (shared・008の重複) |
| 048 | 更新内容の対象レコードの値が変更されること | bound | C-012 (shared) |
| 049 | 更新内容の対象レコードの値が変更されないこと | bound | C-008 (shared・**codex R1是正**: 更新側の確定的な検証失敗＝日付範囲外トリガー。旧版は更新側重複拒否〔C-013〕を充てていたが同経路は確定不能のため差替) |
| 050 | 更新内容の対象レコードの値が変更されること | bound | C-012 (shared) |
| 051 | 削除の確認モーダルであること | bound | C-018 |
| 052 | 更新内容の対象レコードの値が変更されること | bound | C-012 (shared) |
| 053 | 更新内容の対象レコードの値が変更されること | bound | C-012 (shared) |
| 054 | 更新内容の対象レコードの値が変更されないこと | bound | C-008 (shared・**codex R1是正**・上記049と同型の差替) |
| 055 | 更新内容の対象レコードの値が変更されること | bound | C-012 (shared) |
| 056 | 更新内容の対象レコードの値が変更されないこと | bound | C-008 (shared・**codex R1是正**・上記049と同型の差替) |
| 057 | 更新内容の対象レコードの値が変更されること | bound | C-012 (shared・日付変更の実証) |
| 058 | 実行結果の対象レコードの値が変更されること（前提=同一日の禁止・極性は肯定） | bound | C-012 (shared・前提をノイズとして棄却し期待極性のみ採用=§10) |
| 059 | 新規保存・インライン更新の成功のみで管理者向けホームへ転送 | bound | C-003,C-012 (shared) |
| 060 | dtb_calendar.title に保存される | bound | C-003 (shared) |
| 061 | dtb_calendar.holiday に日時値として保存される | bound | C-003 (shared) |
| 062 | 全行とも更新せず一覧を再ビルドするだけ | bound | C-017 |
| 063 | アクセス拒否例外方針 | bound | C-016 |
| 064 | 削除条件の対象レコードが削除状態にならない | bound | C-016 (shared) |
| 065 | 実行結果の対象レコードが削除状態になること | bound | C-015 |
| 066 | 店舗解決はハンドラの引数解決および既定の店舗取得規則に依存 | bound(partial/要実機) | C-002（単一店舗解決は自立検証。複数モール構成の読み替えはTBD=§9） |
| 067 | 実行結果の対象レコードが削除状態になること | bound | C-015 (shared) |
| 068 | 新規・インライン成功は302相当のホーム転送および成功フラッシュ | bound | C-003,C-012 (shared) |
| 069 | 同一画面でのフォーム無効状態と入力欄近傍エラー文言 | bound | C-008,C-010 (shared・確定的な検証失敗経路の代表。C-013は裁定行のため主判定には含めない) |
| 070 | RDBへの挿入・更新・削除 | bound | C-003(挿入),C-012(更新),C-015(削除) (shared) |
| 071 | タイムゾーン付き日時（holiday列） | bound | C-019 (shared w/C-003) |
| 072 | 店舗外部キー（base_info_id列） | bound | C-019 |
| 073 | 更新タイムスタンプ列（update_date） | bound | C-019 (shared w/C-012) |
| 074 | 登録・更新で対象テーブルを直接保存（不要な削除は含まない） | bound | C-003,C-012 (shared) |
| 075 | 必須であること（日付） | bound | C-007（**DOC-DRAFT-M1012-01裁定行・holiday側**） |
| 076 | 削除前検証のみ明示的サービス関数を叩く | bound | C-016 (shared) |
| 077 | （該当操作が送信・削除のみ）削除は拒否 | bound | C-016 (shared) |
| 078 | 管理者向けホーム（新規送信成功の遷移先） | bound | C-003 (shared) |
| 079 | 管理者向けホーム（インライン更新成功の遷移先） | bound | C-012 (shared) |
| 080 | dtb_calendarの1レコード定義（001の重複） | bound | C-003 (shared) |
| 081 | 画面表示データでエラーが表示されず継続できる | bound | C-002 (shared) |
| 082 | 保存完了/削除完了の共通成功文言キー（003の重複） | bound | C-003,C-015 (shared) |
| 083 | 画面表示データでエラーが表示されず継続できる | bound | C-002 (shared) |
| 084 | 入力がすべて有効かつ同日の別行が無いとき新規保存される（005の重複） | bound | C-003 (shared) |
| 085 | 当該行の閲覧表示が隠れテキスト・日付ピッカーが現れる（006の重複） | bound | C-004 (shared) |
| 086 | カード見出しにツールチップ付きの画面名 | bound | C-009(+EN) |
| 087 | jQueryで鉛筆押下時に閲覧ブロックを隠し編集ブロックを表示 | bound | C-004 (shared) |

`func_scope_check` 判定: 親87/87会計済み・欠落0・理由なし重複0・補完11行は§4.2に実体掲載
（親空・設計書補完・母集合会計外）→ **差分0を本文内で実証可能**。O6は主張しない。

## §9 TBD・要実機・DOC-DRAFT・excluded（正直な分離）

| # | 事項 | 状態 |
|---|---|---|
| 1 | **DOC-DRAFT-M1012-01**: title/holidayの必須検証 | 設計書md:168-169「未入力および空白のみはフレームワークの必須検証により無効」「日付｜必須」に対し、`CalendarType.php`のtitle/holidayとも`'required'=>true`はビュー専用（vendor実測=`FormType.php:48,95`）でNotBlank制約が存在しない。Length（title）は空文字を長さ0として許容（max=255に違反しない）・Range（holiday）も空/null値をどう扱うかはvendor詳細未確認。holidayはDB列がNOT NULLのため、空値がフォーム層を素通りした場合はORM例外に至る可能性もあるBC-DRAFT候補。**C-007を実機裁定行とし確定期待にしない** |
| 2 | 複数モール構成での店舗解決の読み替え（066） | 設計書自身が「実データ集合と画面上の単一選択店舗との間に読み替えがある場合がある」（md:186）と自認。単一店舗環境での解決（C-002）は自立検証済みだが、複数モール構成での具体的挙動は**要実機** |
| 3 | 削除成功後の画面遷移・応答形式 | ソース上`delete()`は配列`['success'=>true]`のみを返しリダイレクトを明示しない（md:119,266）。ブラウザ上の実際の遷移・表示は**要実機**（C-015の主判定=DB削除+フラッシュで自立） |
| 4 | フロントブロック側の店舗非絞込クエリとの不一致 | `CalendarRepository::getHolidayList()`は`baseInfo`条件を持たない（103-116行）。本機能の一覧クエリとサイト表示側の集合が一致しない可能性は設計書md:187も自認・別機能（フロントカレンダーブロック）の検証範囲であり本書では扱わない |
| 5 | **BC-DRAFT-M1012-02（codex R1新設・実機裁定=C-013）**: 相関バリデーションの編集側BaseInfo未設定の帰結 | `CalendarController.php:87`は編集フォームを`CalendarType::class, $Calendar`のみで生成し`BaseInfo`オプションを渡さない（新規側=`:56-59`との対比で確認）。既定値`'BaseInfo' => null`（`CalendarType.php:128`）がPOST_SUBMITの`$options['BaseInfo']`としてそのままDQL `c.baseInfo = :baseInfo`へ束縛される。SQL三値論理では`= NULL`は常にUNKNOWN/falseのため、重複カウントが常に0になり**更新側の重複日付拒否が実質的に無効化される可能性**がある（Doctrineがnullパラメータ束縛時に例外を投げる可能性も排除できない）。C-013をこの二択（読みA=設計書意図どおり拒否される／読みB=拒否が働かず保存されてしまう）を実機で確認する裁定行とした（確定期待にしない）。読みBが真であれば`BUG_CANDIDATE_REGISTER.md`系への転記を要する実装バグ候補。**【正式spec相互参照・codex R2是正・正式ファイル無変更】** 既存正式`e2e/spec/admin/m10/m10_12_admin_base_setting_setting_shop_calendar.spec.ts:353-358`の`test.fixme(E2E-M10-12-033)`は本BC-DRAFT発見以前の**旧断定（読みAのみ前提）**であり矛盾する。正式spec自体は`_drafts/`隔離規律により改変せず、**整合はD6/D8のBC裁定（実機実行後）で取る**（本書は相互参照の記録に留める） |
| 6 | 削除の物理応答コード（403系の具体的ステータス値） | `AccessDeniedHttpException`が最終的にどのHTTPステータスへ変換されるかはSymfonyの例外リスナー既定に依存し、一次資料に逐語の数値記載なし＝**要実機副観測**（C-016の主判定=DB不変で自立） |
| excluded | 019〜035（検索・実行結果取得系17） | 期待テキスト=「検索条件/実行結果の該当レコードが取得結果に含まれる（ない）こと」＝検索取得の主張。本機能の一覧はユーザー指定検索条件を取らない固定クエリ（`getListOrderByIdDesc`）であり、検索フォーム・ページングはcalendar.twigに存在しない（grep実測0件）。per-IDの実引きは§8のEX-A表 |

候補規律: 全行 `@TBD-D5`・O5未確定（D6後に確定検査）・実装/実走なし・O6/聖域/多軸/C6C7を主張しない。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象構文の列挙とclaim別判定（本機能は前提列に設計書の項目名・メッセージIDが実際の期待内容と
無関係に循環転記されているため、極性衝突・観点/期待の取り違えが多い）:

| 対象 | 極性判定 | 判定根拠（一次資料） |
|---|---|---|
| 009（必須エラーあり）/010（必須エラーなし）/075（必須・holiday側） | 009,075は**DOC-DRAFT-M1012-01**（NotBlank不在のため確定期待にせずC-007へ実機裁定行としてbind）。010は有効入力の継続としてC-003へbind（極性=肯定） | CalendarType.php:50-58,59-70／m10-12md:168-169 |
| 012〜017（相関/DB相関バリの両極） | 本機能には相関バリデーション（重複日付チェック）が実在するため**excludedにしない**（m05-13/m05-17の「相関constraint不存在→excluded」先例を機械的に踏襲すると偽陰性になる）。エラーあり側→C-010(新規)/C-013(更新)、エラーなし側→C-003/C-012の継続観測へbind | CalendarType.php:79-117（POST_SUBMITの重複カウント実装）／m10-12md:135 |
| 019〜035（検索・実行結果取得系の両極） | 検索は本機能に実装が存在しない（calendar.twigに検索フォーム0件・`getListOrderByIdDesc`はユーザー検索条件非対応）→両極ともEX-A。033〜035の「実行結果」skeletonについても、m10-12の母集合全87行の前提列を走査した結果「同時更新」等の実在仕様を指す語が存在しないため、m05-13のR1教訓（偽陰性となる前提語がある場合はbound化）を適用する対象が無い＝excludedのまま維持。同時更新（実在仕様md:319-322）は母集合に対応行が無いため補完S-003で別途bound | calendar.twig（grep実測）／CalendarRepository.php:62-75／m10-12md:319-322 |
| 036〜058の「追加/変更される・されない」 | 期待テキスト極性を正としてbind。肯定→C-003/C-012、否定→C-010/C-013/C-014。前提列の項目名（M10-12-MSG-00N・一覧のソース・日表示・CSS・レイアウト等）は実際の期待内容と無関係な循環転記のため**棄却**し、期待文の「追加される/されない」「変更される/されない」のみで判定する | m10-12md:70,113,135（重複拒否条件の一次資料） |
| 037（前提=CSRFのみ欠落または不正→期待=追加されない） | 前提列とセクション見出し「登録時の登録内容確認」が一致しているため素直にbind: 新規作成POSTのCSRF不正→Symfony Form CSRF拡張により`isValid()`が偽となり保存されない | ShippingType等の先例と同型の`_token`フィールド機構／CalendarType.phpに`csrf_protection=>false`の指定なし（既定=true） |
| 046（前提=編集内容を「決定」で送信→期待=「追加される」） | 前提はインライン更新の確定操作だが期待verbは「追加」（生成器の verb不一致・実際の意味は「行内容の変更」）。棄却せず、期待の実質（対象レコードの内容がPOST内容へ変わること）としてC-012の更新成功観測へbind。C4-manualとして本行に verb不一致を明記する | CalendarController.php:97-108（editCalendarForm処理） |
| 058（前提=同一日の禁止→期待=「実行結果の対象レコードの値が変更される」肯定） | 前提語（重複禁止）と期待極性（肯定=変更される）が逆方向（本来重複なら変更されないはず）。前提をノイズとして棄却し、期待テキストの肯定極性のみを採ってC-012（正常な更新成功）へbind。前提を採用すると「重複禁止なのに変更される」という一次資料に矛盾する期待を捏造することになるため採用しない | m10-12md:135（重複時は無効化するとの規定と矛盾しない読みを維持） |
| 064（前提=論理削除や複数法人のクロス混入→期待=削除状態にならない） | 前提語は設計書自身が「Doctrineのグローバル規則とDBポリシーに依存し、ここでは当画面のクエリだけを根拠に書かない」（md:177）と自認する範囲。前提の具体的意味（論理削除機構）は本機能に存在しない（`Calendar`に`del_flg`等なし）ため、期待の実質（削除条件が満たされない＝CSRF不正での削除拒否）としてC-016（既に規定された削除拒否経路）へbind。過剰な論理削除機構の存在を捏造しない | Calendar.php全文実測（del_flg等の論理削除列0件）／m10-12md:177 |
| 066（前提=店舗切替→期待=店舗解決規則への依存） | 前提と期待が一致（生成器の循環転記が偶然一致した数少ない例）。単一店舗環境での解決はC-002で自立検証・複数モール構成の読み替えはTBD（§9-2） | m10-12md:186 |
| **015/049/054/056/069（更新側の相関バリ・検証失敗の両極）＝codex R1是正** | 改訂前は全行をC-013（更新側の重複日付拒否）へbindしていたが、`CalendarController.php:87`実測により編集フォームは`BaseInfo`オプション未設定と判明（BC-DRAFT-M1012-02）。049/054/056/069は「更新側で検証失敗しDB不変」という**主題自体**は他の確定的経路（日付範囲外＝Rangeはフィールド制約でBaseInfoに非依存）で成立するため**C-008へ差替**（過剰boundの是正）。015のみ「相関バリデーション」という**主題そのもの**を問う行のため、確定した代替経路に逃さず**C-013（裁定行）へ残す**のが最も正直な処置と判断した | CalendarController.php:56-59,87,98-115／CalendarType.php:65-70,126-129 |

**codex敵対レビュー実施状況: R1要修正（Blocker1＋Major3）→改訂1で全数是正・R2再確認待ち**。
R1の指摘（更新側相関バリの過剰bound・page/spec実在誤認・L1-003行ずれ・DB復元契約の甘さ）はいずれも
実ソース再確認（`CalendarController.php:87`のオプション比較・既存page/spec.tsの実在確認・`Calendar.php`
行番号のnl実測・`Version20240930235959_04.php`／`Version20260319061014.php`のRLS migration実測）で
裏付けたうえで是正した。会計（bound70/excluded17/差分0）は不変（過剰boundは断定内容の是正であり会計
区分の組み替えではない）。結果は`REVIEW_LEDGER.md`と本ヘッダに同期する。

---

## 付録: 作業実測（B0係数計測用）

- 読んだ一次資料・参照物: 設計書md 1／ee実ソース 8（CalendarController・CalendarType・Calendar・
  CalendarRepository・TenantTrait・TenantEventSubscriber・SaveEventSubscriber・AbstractController(抜粋)）＋
  calendar.twig／locale 2（messages ja/en）＋vendor 2（validators xlf ja/en・FormType.php抜粋）＋
  eccube.yaml／migrations 2（Version20240930235959_04.php・Version20260319061014.php＝RLS実測・改訂1追加）／
  母集合・台帳 3（all_it_cases・fid_kubun・REVIEW_LEDGER）／統治 2（CRP・CFP）／
  同型見本 3（m05-13・m05-17・m09-01草案）／既存実装 3（db.ts・改訂1で既存page.ts/spec.ts実測を追加）＝
  **計25ファイル**。
- L1 claim数: **21確定＋2 DOC-DRAFT＋1 BC-DRAFT＋5 補完専用**（=29行・改訂1でL1-029追加。R2是正: 旧「26確定＋2+1+1」
  は算術上30で誤り。補完専用5件の内訳=L1-001認証・L1-014タイトル長境界・L1-025同時更新・L1-026ラベル流用quirk・
  L1-027一覧見出し列。§4.1/§4.2のTSV実測でbound側専用参照21＋DOC-DRAFT2＋BC-DRAFT1=bound側24件、補完側のみ
  参照5件、21+2+1+5=29を機械確認）。
  候補ケース行34（bound19＋EN4＋補完7＋EN4・件数不変・C-008/C-013の内容のみ改訂）。file:line claim引用 約65箇所
  （改訂1でCalendarController.php:87比較・RLS migration2ファイル追加）。
- 難所（係数悪化要因）: (1) 相関バリデーションが**実在する**ことの発見と、m05-13/m05-17の「相関constraint
  不存在→excluded」先例を機械的に踏襲しないための再判定（過剰除外の回避） (2) title/holidayとも
  `required=>true`だがNotBlank不在という**設計書との食い違い候補**の発見（vendor FormType.php実測での
  `required`オプションのビュー専用性の確認込み） (3) 母集合87行の前提列が実際の期待内容と大きく乖離しており
  （観点コードIT-15・IT-20等の主張が期待文に一切現れない）、auth/認証系の母集合行が実質存在しないという
  珍しいパターンの識別（→補完S-001/S-002へ切替） (4) 「同時更新」等の実在仕様を指す前提語が母集合に
  一切存在しないことの全87行走査による確認（m05-13のR1教訓の適用検証・偽陰性なしの立証） (5) 削除系に
  履歴側テーブルが存在しないことの確認（m09-03等の多段復元が不要と判断する根拠）。
  **【R1教訓】(6) 新規側に相関バリが実在することの発見に満足し、更新側フォームビルダのオプション引数を
  新規側と横並びで比較検証しなかったため、更新側でも同一に機能すると誤って過剰boundした（Blocker）。
  「同一メカニズムに見える処理でも呼出し元のオプション引数が経路ごとに違う場合がある」ことをcodex R1が
  検出・以降は両経路のコントローラ呼出し行を必ず並べて比較する規律とする。 (7) 既存の`e2e/pages`・
  `e2e/spec`をfind実行せずに「0件」と書いてしまった（Major）。参照ファイルの不存在主張は肯定的grep実測を
  経ずに書かない。 (8) DB復元契約を「関連ファイルが単体だから単純」と早合点し、RLSのようなテーブル単位の
  周辺制御（migrationsディレクトリ）を見ずに済ませてしまった（Major）。復元契約を書く際はテーブル名で
  migrationsディレクトリ全体を横断grepする規律とする。
- 楽だった点（再利用効果）: L1表・三段参照・S0規律・choice解決・runFill・隔離lint・§構成・SEED復元規約は
  m05-13/m05-17/m09-01の型をそのまま流用。TenantEventSubscriberのCalendar明示除外は設計書md:303の記述と
  完全一致し、追加調査なしで裏付けが取れた。

# B0候補: m05-13 問い合わせ番号入力（送り状No.） — 実行可能グレード候補（母集合89全量踏破）

> 2026-07-23 ／ **候補グレード（candidate・D6前・O5未確定・実装/実走なし）**
> codexレビュー: **R1要修正（Blocker1＋Major3）→改訂1で是正済み・R2再確認待ち**（`REVIEW_LEDGER.md`と同期させること）
> **改訂1（codex R1是正）**: (1)【Blocker】033「同時更新」のEX-A除外は**偽陰性**（前提列の指す「同時更新」は
> md:172「後勝ち・ロックなし」の実在仕様）→**boundへ移動**・新設C-029（2管理セッションの順序確定PUTで
> 後勝ち/ロックなしをdb.ts観測・L1-023新設）・会計 bound67→68/excluded22→21
> (2)【Major1】空文字vendor根拠の誤り訂正: 「Regex/Lengthとも検証スキップ」→**正=Regexは空文字でreturn(skip・
> RegexValidator.php:33-35)、Lengthはnullのみreturnし空文字は長さ0として検査するがmax=255/200に違反しない
> （LengthValidator.php:30-38）＝違反0件**（DOC-DRAFT-1の結論=''保存の読みは維持）
> (3)【Major2】SEED初期値`M0513-INIT-1`を期待値の正にしていた箇所（C-003/012/021/022/024/027/028/043/045）を
> **操作前スナップショットS0との同値比較（DB不変・保存されない）へ書換**（三段参照違反の是正。SEED値は
> fixture前提・復元値に留める） (4)【Major3】EX-A 17件のtest_id実引き表を§9に新設（操作・期待逐語・md:37対応）。
> EX-A検索(033除く)/EX-B相関・破壊系SEED隔離・DOC-DRAFT-2の非XHR限定はcodex妥当確認済み=維持。
> source_class=standard-src+design は fid_kubun.tsv（D1・fid_kubun.tsv:257）による**暫定付与**（確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> fixture_version は全て `@TBD-D5`。統治: `integration_test/CONCRETIZATION_ROLLOUT_PLAN.md`（B0）＋
> `integration_test/CONCRETIZATION_FIRST_PLAN.md`（三段会計）。
> 正典: `integration_test/e2e/PILOT_m09_01_news_executable_grade.md`／同型見本:
> `_drafts/m05-16_admin_order_order_shop_memo_executable_draft.md`（W1 codex承認済み・受注編集の単項目同型）＋
> `_drafts/m09-01_admin_content_content_news_executable_draft.md`（Form/DB段差・request契約の先例）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m05-13_admin_order_order_tracking_number_oracle_draft.json`。
> 正式パス `e2e/fixtures/oracle/` 直下には書かない。
> **本機能の特記（3系統の不確定を分離）**:
> (1) **BC-DRAFT（実装未配置・設計書自認)**: 受注一覧の出荷行内の入力欄・更新ボタンのマークアップは
>     Enterprise一覧テンプレートに**未配置**（grep実測0件・設計書md:79自体が「未配置である」と明記）。
>     JS実体は実在するため、UI操作系2行（011/087/088）はBC-DRAFT行として仕様どおりの期待を掲載し実行不能を明示。
> (2) **DOC-DRAFT-1（設計書とvendor実装の矛盾候補）**: 一覧非同期保存の空文字。設計書md:155「文字種検証が
>     空文字に一致せず検証エラーとなり保存しない」に対し、ee vendorでは**Regexは空文字でreturn（skip・
>     RegexValidator.php:33-35逐語）・Lengthはnullのみreturnし空文字は長さ0として検査するがmax=255に
>     違反しない（LengthValidator.php:30-38）＝違反0件でOK・''保存（空消去成立）の読み**。
>     C-022は両論併記・確定期待とせず実機裁定待ち。
> (3) **DOC-DRAFT-2（同上）**: 設計書md:96,247「XHR要求でない／トークン不正→ステータスNGのHTTP400」に対し、
>     ee実装はトークン不正時 `AccessDeniedHttpException` をthrow（AbstractController.php:258-259）＝
>     400 NG JSONにならない読み（非XHR側のみ400 NGが短絡評価で確定）。補完行C-030は非XHR側のみ主張。
> **行数集計（改訂1）**: 候補ケース行総数**33**＝bound対応32（ja27＋-EN5）＋補完1。母集合89=bound68＋TBD0＋excluded21。

## §0 版固定

- 設計書正本: `functions/ec-cube-enterprise/m05-13_admin_order_order_tracking_number.md`（本repo HEAD `d1e94c5e38246d0eff45b4079ee42397c994e69d` 時点）。
- ee実ソース: `/home/y-saito/Developments/ec-cube-enterprise/` コミット `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51`（W0/W1と同一）。
- vendor翻訳: `vendor/symfony/validator/Resources/translations/validators.{ja,en}.xlf`＝symfony/validator v7.4.3（W0と同一版・同一checkout）。
- fid_kubun.tsv（D1）: `M05-13｜m05-13_admin_order_order_tracking_number｜問い合わせ番号（出荷伝票番号）入力機能｜対象｜標準｜standard-src+design`（fid_kubun.tsv:257。fid_kubun.tsv sha256先頭=44fbf02f1e4c）。
- 母集合: baseline `all_it_cases.tsv`（sha256先頭 `7911f190d273`）M05-13全**89行**（IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-001〜089）。
- 既存実行実績の参考: `integration_test/e2e/m05_13_admin_order_order_tracking_number_e2e_cases.md`（2〇/27×）・
  `e2e/spec/admin/m05/m05_13_*.spec.ts`・`e2e/pages/admin/m05/m05_13_*.page.ts`。既存page/specのtwig・PHP行番号注記は
  **旧版**（edit.twig:1762-1765・OrderController.php:565-566・messages.ja.yaml:2331-2332等）であり、
  **本書§1の実測行番号（edit.twig:1780-1784・OrderController.php:576-619・messages.ja.yaml:2531-2532）が正**。
- **判定原則（W0教訓）**: 観点ラベル・前提条件/入力データ列のシナリオ語は**生成器ノイズ**。bindは各行の
  **「期待結果／レスポンス」実テキスト**で判定し、極性も期待テキストで確認する（§8に全89行の期待要旨併記）。
- **破壊的更新の統治（本機能の要点）**: 送り状No.保存は `dtb_shipping.tracking_number` を**確定保存する破壊的操作**
  （persist/flush即時・承認ワークフローなし=md:204）。保存系は**使い捨て専用SEED受注（SEED-M05-13-ORDER/ORDER2）に限定し
  afterEachでSEED再適用（復元）**。既存specの既知の穴（「一覧の先頭受注を開いて保存するため実行すると当該受注の
  データを書き換える」＝spec.ts:18実注記）を**回避**する（§2・§6）。

## §1 L1原子オラクル表

規約: claimは検査可能な期待実値まで分解。quoteは一次資料の逐語。unitは文字数系のみ必須（ee=PostgreSQL/Symfony Length=文字長）。
LS=locale_sensitive（0は理由コード）。**期待値の正は本表のオラクルIDでありSEED値ではない（三段参照）**。

| oracle_id | 観点 | claim（検査可能な期待） | source_class(暫定) | 逐語quote | 根拠(file:line) | unit | LS |
|---|---|---|---|---|---|---|---|
| L1-M0513-001 | auth_rule | 未認証で管理側URL（受注一覧GET・受注編集GET・非同期保存PUT）へアクセスすると、admin firewall（pattern `^/%eccube_admin_route%/`）のform_loginエントリポイントにより**ログイン画面（route `admin_login`）へ誘導**され本機能を利用できない | 設計書md＋standard-src | 「非管理者・未認証｜上記の管理側URL｜管理用ファイアウォールにより到達できず、本機能を利用できない。」／「未認証｜利用不可。管理用ファイアウォールにより管理側URLへ到達できずログインへ誘導される。」／`admin:`…`pattern: ['^/%eccube_admin_route%/','^/%eccube_messenger_route%/']`…`form_login:`…`login_path: admin_login` | m05-13md:69,226／security.yaml:40-46 | — | 0 `non-translated` |
| L1-M0513-002 | http_status | 入口URL3系統: 一覧=`GET/POST /%eccube_admin_route%/order`（route `admin_order`）・非同期保存=`PUT /%eccube_admin_route%/shipping/{id}/tracking_number`（route `admin_shipping_update_tracking_number`・**id=数字のみ=出荷識別子**）・編集=`GET/POST /%eccube_admin_route%/order/{id}/edit`（route `admin_order_edit`・id=受注識別子） | standard-src＋設計書md | `#[Route(path: '/%eccube_admin_route%/order', name: 'admin_order', methods: ['GET', 'POST'])]`／`#[Route(path: '/%eccube_admin_route%/shipping/{id}/tracking_number', name: 'admin_shipping_update_tracking_number', requirements: ['id' => '\d+'], methods: ['PUT'])]`／「非同期保存の`{id}`は出荷識別子（数字のみ）である。受注編集側の`{id}`は受注識別子である。」 | OrderController.php:138,576／EditController.php:146-147／m05-13md:65-68,71 | — | 0 `non-ui-observable` |
| L1-M0513-003 | display_field | 受注一覧は**出荷行単位**（1行=1出荷）で表示される。行のtbody生成は `{% for Order in pagination %}{% for Shipping in Order.Shippings %}` の二重ループ・各行のcheckboxは `id="check_{{ Shipping.id }}" data-id="{{ Shipping.id }}"`（出荷id基準） | standard-src＋設計書md | `{% for Order in pagination %}`＋`{% for Shipping in Order.Shippings %}`＋`<input type="checkbox" id="check_{{ Shipping.id }}" data-id="{{ Shipping.id }}" data-order-id="{{ Order.id }}"`／「受注一覧｜出荷行を一覧表示する管理画面。1行が1出荷に対応する。」 | index.twig:1193-1197／m05-13md:55 | — | 0 `non-translated` |
| L1-M0513-004 | display_field | 一覧ページのインラインJSに送り状No.更新の設計実体が**実在**する: `updateTrackingNumber` 関数（`type: 'PUT'`・`data: {'tracking_number': ...}`・成功時 `#tracking_number_<id>` へ応答値反映）・`button.update_tracking_number` 初期無効・`input.update_tracking_number` keyupでボタン有効化＋アイコン `text-secondary`→`text-success`・Enter（code==13）で保存後次入力欄へフォーカス・OK以外は `alert('Update failed.')`・fail時は応答JSONの `messages` を改行連結してalert。**一方、行内マークアップ（`input.update_tracking_number`・`button.update_tracking_number`・`#tracking_number_<id>` の要素）はテンプレートに0件（grep実測=当該クラス/idの出現はJSセレクタ行185,219-261のみ）＝未配置**。設計書md:79自体が未配置を明記＝**BC-DRAFT基盤（不具合候補#1承継）** | standard-src＋設計書md | `var updateTrackingNumber = function(id, url, tracking_number, callback) {`／`type: 'PUT',`／`data: {'tracking_number': tracking_number}`／`if (data['status'] == 'OK') {`…`$('#tracking_number_' + id).val(data['tracking_number']);`／`alert('Update failed.');`／`}).fail(function(jqXHR, textStatus, errorThrown) {`…`for (var i = 0; i < response.messages.length; i++) {`…`alert(messages);`／`$('button.update_tracking_number').prop('disabled', true);`／`.removeClass('text-secondary').addClass('text-success');`／`if (code == 13) { // on press to enter`…`$('input.update_tracking_number:gt(' + index + '):first').focus();`／「現Enterprise版の一覧テンプレートでは出荷行に…入力欄・更新ボタンの行内マークアップは未配置である。」 | index.twig:178-201,219-261（関数178・PUT180・data182・OK184-185・alert190・fail193-199・初期無効219・keyup221-227・Enter236-243・click250-261）／m05-13md:79-82 | — | 0 `non-translated`（Update failed.は日英共通固定文言=md:119） |
| L1-M0513-005 | display_field | 受注編集画面の出荷情報（**単一配送branchのみ**）に送り状No.欄: ラベル=ロケール `admin.order.tracking_number` ja「送り状No.」／en "Tracking No."・ラベルは `data-bs-toggle="tooltip"` でtitle=ツールチップ文言（L1-006）＋説明アイコン（fa-question-circle）・欄は `form.Shipping.tracking_number` のTextType=**1行テキスト**（id=`order_Shipping_tracking_number`〔block prefix `order`＞子`Shipping`〕）・**直下に `form_errors(form.Shipping.tracking_number)`**。複数配送（`Order.isMultiple`）は「配送先の表示のみ」で欄なし・Shippingサブフォーム自体を追加しない（サブフォームは `mapped=false`・data=先頭Shipping実体） | standard-src＋設計書md | `<label class="col-3 col-form-label" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.order.shipping_info.tracking_number'\|trans }}">{{ 'admin.order.tracking_number'\|trans }}<i class="fa fa-question-circle fa-lg ms-1"></i></label>`／`{{ form_widget(form.Shipping.tracking_number) }}`＋`{{ form_errors(form.Shipping.tracking_number) }}`／`{% if Order.isMultiple %}`＋`{# 複数配送の場合は配送先の表示のみ #}`／`if ($Order && $Order->isMultiple()) { return; }`…`$form->add('Shipping', ShippingType::class, [ 'mapped' => false, 'data' => $data, ]);`／`admin.order.tracking_number: 送り状No.`／`admin.order.tracking_number: Tracking No.`／「出荷情報の中に「送り状No.」ラベルとツールチップ付きの1行テキスト欄を表示する。」 | edit.twig:1780-1783,1601-1602,1617,1788／OrderType.php:451-461（isMultipleガード451-453・add 458-461）／ShippingType.php:394-397（block prefix）・OrderType.php:378-381／messages.ja.yaml:2531・messages.en.yaml:2368／m05-13md:83 | — | 1 |
| L1-M0513-006 | display_field(文言) | 送り状No.ラベルのツールチップ（title属性）＝`tooltip.order.shipping_info.tracking_number` ja「お問い合せ番号（出荷伝票番号）がある場合、こちらから入力できます。受注一覧からまとめて入力することも可能です。」／en "If you have a tracking number (delivery slip number), you can enter from here. You can also bulk-input from All Orders." | standard-src＋設計書md | `tooltip.order.shipping_info.tracking_number: お問い合せ番号（出荷伝票番号）がある場合、こちらから入力できます。受注一覧からまとめて入力することも可能です。`／`tooltip.order.shipping_info.tracking_number: If you have a tracking number (delivery slip number), you can enter from here. You can also bulk-input from All Orders.` | messages.ja.yaml:3616・messages.en.yaml:3230／edit.twig:1780／m05-13md:53,83 | — | 1 |
| L1-M0513-007 | validation_rule | 編集フォーム経路: 送り状No.は**任意**（`required => false`・NotBlank不在）。制約は `Assert\Length(max: eccube_mtext_len)`＝**200文字**と `Assert\Regex(pattern: '/^[0-9a-zA-Z-]+$/u')` のみ。**空文字はRegexが検証skip・Lengthは長さ0として検査するがmax=200に違反しない＝違反0件**のため空のまま保存でき、既存値を空へ更新（消去）できる | standard-src＋設計書md | `->add('tracking_number', TextType::class, [ 'required' => false, 'constraints' => [ new Assert\Length(max: $this->eccubeConfig['eccube_mtext_len']), new Assert\Regex( pattern: '/^[0-9a-zA-Z-]+$/u', message: 'form_error.graph_and_hyphen_only' ), ], ])`／`eccube_mtext_len: 200`／`if (null === $value \|\| '' === $value) { return; }`（RegexValidator）／`if (null === $value) { return; }`…`$stringValue = (string) $value;`（LengthValidator=nullのみreturn・空文字は長さ0検査） | ShippingType.php:197-206／eccube.yaml:118／vendor/symfony/validator/Constraints/RegexValidator.php:33-35・LengthValidator.php:30-38／m05-13md:147,156,217 | **文字** | 0 `non-translated` |
| L1-M0513-008 | message | 編集フォーム経路の文字種エラー文言（キー`form_error.graph_and_hyphen_only`）: ja「半角英数字かハイフンのみを入力してください。」／en "Entry must be alphanumeric characters or hyphens."。表示位置=**問い合わせ番号欄の直下**（`form_errors(form.Shipping.tracking_number)` がtwigに実在） | standard-src＋設計書md | `form_error.graph_and_hyphen_only: 半角英数字かハイフンのみを入力してください。`／`form_error.graph_and_hyphen_only: Entry must be alphanumeric characters or hyphens.`／「半角英数字かハイフンのみを入力してください。｜…｜問い合わせ番号欄の直下」 | validators.ja.yaml:41・validators.en.yaml:36／edit.twig:1783／m05-13md:118 | — | 1 |
| L1-M0513-009 | message | 編集フォーム経路のLength超過文言（Symfony既定カタログ・choice形式・v7.4.3・limit=200解決後）: ja「長すぎます。この値は200文字以下で入力してください。」／en "This value is too long. It should have 200 characters or less."。表示位置=欄直下（L1-008と同じ `form_errors`） | standard-src（vendor翻訳）＋設計書md | source=`This value is too long. It should have {{ limit }} character or less.\|This value is too long. It should have {{ limit }} characters or less.`／ja target=`長すぎます。この値は{{ limit }}文字以下で入力してください。`／「最大長超過時はSymfonyの文字数超過メッセージを返す。」 | vendor/symfony/validator/Resources/translations/validators.ja.xlf:78-79・validators.en.xlf:78-79（trans-unit id=19）／m05-13md:121,160 | — | 1 |
| L1-M0513-010 | validation_rule | 一覧非同期経路: XHRかつトークン正当の場合、受信値を `mb_convert_kana($v,'a')` で**全角英数→半角へ変換してから** `Assert\Length(max: eccube_stext_len)`＝**255文字**と `Assert\Regex('/^[0-9a-zA-Z-]+$/u', message=admin.order.tracking_number_error)` で検証する（検証はコントローラ内でvalidator直接呼出し・Formなし） | standard-src＋設計書md | `$trackingNumber = $request->get('tracking_number') ?? '';`／`$trackingNumber = mb_convert_kana((string) $trackingNumber, 'a', 'utf-8');`／`new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),`／`new Assert\Regex( ['pattern' => '/^[0-9a-zA-Z-]+$/u', 'message' => trans('admin.order.tracking_number_error')] ),`／`eccube_stext_len: 255`／「半角変換後に文字種`/^[0-9a-zA-Z-]+$/u`と最大長255文字を検証する。」 | OrderController.php:583-593（get583・変換584・Length590・Regex591-593）／eccube.yaml:137／m05-13md:146,216 | **文字** | 0 `non-translated` |
| L1-M0513-011 | message | 一覧非同期経路の文字種エラー文言（キー`admin.order.tracking_number_error`）: ja「送り状No.は半角英数字かハイフンのみを入力してください。」／en "Only Roman alphabets, numbers and hyphens are accepted for tracking numbers."。応答JSONの `messages` 配列の要素として返る（表示=UI側でアラート〔UI未配置=BC-DRAFT・L1-004〕） | standard-src＋設計書md | `admin.order.tracking_number_error: 送り状No.は半角英数字かハイフンのみを入力してください。`／`admin.order.tracking_number_error: Only Roman alphabets, numbers and hyphens are accepted for tracking numbers.` | messages.ja.yaml:2532・messages.en.yaml:2369／OrderController.php:592／m05-13md:117 | — | 1 |
| L1-M0513-012 | message | 一覧非同期経路のLength超過文言（同カタログ・limit=255解決後）: ja「長すぎます。この値は255文字以下で入力してください。」／en "This value is too long. It should have 255 characters or less."。応答JSONの `messages` 配列要素 | standard-src（vendor翻訳）＋設計書md | （L1-009と同一カタログ・limit=255） | vendor validators.ja.xlf:78-79・validators.en.xlf:78-79／OrderController.php:590／m05-13md:121,135 | — | 1 |
| L1-M0513-013 | json | 非同期保存の成功応答＝HTTP200 JSON `{"status":"OK","shipping_id":<出荷id>,"tracking_number":<半角変換後の保存値>}`。画面遷移しない（同一画面内更新=md:236。入力欄への値反映はJS挙動＝UI未配置でBC-DRAFT副観測） | standard-src＋設計書md | `$message = ['status' => 'OK', 'shipping_id' => $shipping->getId(), 'tracking_number' => $trackingNumber];`／`return $this->json($message);`／「成功結果はステータスOKと保存後の値」／「受注一覧で問い合わせ番号を更新｜画面遷移しない。」 | OrderController.php:613,615／m05-13md:178,187,236 | — | 0 `non-ui-observable` |
| L1-M0513-014 | json | 非同期保存の失敗応答: (a)検証エラー時=HTTP400 JSON `{"status":"NG","messages":[<エラー文言>...]}` (b)**非XHR要求時**=HTTP400 JSON `{"status":"NG"}`（短絡評価で非XHRのみ確定・messagesなし） (c)保存中例外時=HTTP500 JSON `{"status":"NG"}`（**例外の決定的誘発手段なし=要実機副観測**） | standard-src＋設計書md | `if (!($request->isXmlHttpRequest() && $this->isTokenValid())) { return $this->json(['status' => 'NG'], 400); }`／`return $this->json(['status' => 'NG', 'messages' => $messages], 400);`／`} catch (\Exception $e) { log_error('予期しないエラー', [$e->getMessage()]); return $this->json(['status' => 'NG'], 500); }`／「受注一覧では検証エラー時にステータスNGとエラー文言配列をHTTP400、保存例外時にステータスNGをHTTP500」 | OrderController.php:579-581,605,616-619／m05-13md:188,248-249 | — | 0 `non-ui-observable` |
| L1-M0513-015 | **DOC-DRAFT-2** | 設計書md:96,247は「XHR要求でない／なりすまし対策トークン不正｜ステータスNGのJSONをHTTP400で返す」とするが、ee実装は**XHRかつトークン不正**の場合 `isTokenValid()` が `AccessDeniedHttpException` を**throw**（`return false`しない）＝NG400 JSONに到達しない読み（フレームワークの403系応答）。**設計書とeeの不一致候補・実機確定待ち**。非XHR側（L1-014b）は短絡評価で400 NGが確定 | standard-src vs 設計書md | `$token = $request->get(Constant::TOKEN_NAME) ?: $request->headers->get('ECCUBE-CSRF-TOKEN');`／`if (!$this->isCsrfTokenValid(Constant::TOKEN_NAME, $token)) { throw new AccessDeniedHttpException('CSRF token is invalid.'); }`／「XHR要求でない／なりすまし対策トークン不正｜ステータスNGのJSONをHTTP400で返す。」 | AbstractController.php:252-263（throw 258-259）／Constant.php:41（TOKEN_NAME='_token'）／m05-13md:96,247 | — | — |
| L1-M0513-016 | db_effect | 保存先＝`dtb_shipping.tracking_number`（STRING **255文字**・NULL許容）。**出荷単位で1値**（受注ではなく各出荷に1つ）・保存は当該出荷行の同列を**受信値で上書き**・`persist/flush` で即時確定（承認ワークフローなし）・削除は行わない（行数不変）。一覧非同期経路の上限255=DB255（段差0）／編集経路200<DB255（**段差55文字**） | standard-src＋設計書md | `#[ORM\Column(name: 'tracking_number', type: Types::STRING, length: 255, nullable: true)] private ?string $tracking_number = null;`／`$shipping->setTrackingNumber($trackingNumber); $this->entityManager->persist($shipping); $this->entityManager->flush();`／「保存単位｜問い合わせ番号は出荷単位で保持する。受注ではなく各出荷に1つずつ保存する。」／「既存値の上書き｜保存時は当該出荷の伝票番号列を受信値で上書きする。」／「当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。」 | Shipping.php:117-118／OrderController.php:609-611／m05-13md:137-138,149,200,204-208 | **文字** | 0 `non-ui-observable` |
| L1-M0513-017 | db_effect | 経路別の値変換: **一覧非同期経路は半角変換後の値**を保存（全角英数字`ＡＢＣ１２３`→`ABC123`。変換後が`/^[0-9a-zA-Z-]+$/u`の範囲なら保存）。**編集フォーム経路は変換を行わない恒等写像**（全角はそのままRegex検証にかかり文字種エラー）。受理値は改変なくDB列へ保存 | standard-src＋設計書md | `mb_convert_kana((string) $trackingNumber, 'a', 'utf-8');`（'a'=全角英数→半角。一覧経路のみ）／「半角変換｜受注一覧の非同期保存では、受け取った値を全角英数字から半角英数字へ変換してから検証・保存する。受注編集フォーム経路ではこの変換を行わない。」／「全角英数字を入力（受注編集フォーム）｜半角変換を行わないため、半角英数字とハイフン以外と判定され検証エラーとなる。」（ShippingTypeに変換処理なし=ShippingType.php:197-206に変換記述0件） | OrderController.php:584／ShippingType.php:197-206／m05-13md:133,157-158 | 文字 | 0 `data-passthrough` |
| L1-M0513-018 | **DOC-DRAFT-1** | 一覧非同期経路の**空文字**: 設計書md:155は「文字種検証が空文字に一致せず検証エラーとなり保存しない。空での消去はこの経路では成立しない」とするが、vendorでは **`RegexValidator` が空文字でreturn（skip）**・**`LengthValidator` はnullのみreturnし空文字は長さ0として検査するがmax=255に違反しない**＝**違反0件→`''`が保存される（空消去が成立する）読み**。**設計書とvendor実装の矛盾候補・実機確定待ち**（確定期待にしない） | standard-src vs 設計書md | `if (null === $value \|\| '' === $value) { return; }`（RegexValidator）／`if (null === $value) { return; }`…`$stringValue = (string) $value;`（LengthValidator）／`$trackingNumber = $request->get('tracking_number') ?? '';`／「値が空（受注一覧の非同期保存）｜文字種検証が空文字に一致せず検証エラーとなり保存しない。空での消去はこの経路では成立しない。」 | vendor/symfony/validator/Constraints/RegexValidator.php:33-35・LengthValidator.php:30-38／OrderController.php:583／m05-13md:155,216 | — | — |
| L1-M0513-019 | http_status | 存在しない出荷識別子への非同期保存PUTは、出荷エンティティ解決に失敗し**フレームワークの未検出応答（404）**となり保存されない（route要件 `id=\d+`・エンティティ引数 `Shipping $shipping`。XHR/トークン判定より前に解決） | standard-src＋設計書md | `requirements: ['id' => '\d+']`＋`public function updateTrackingNumber(Request $request, Shipping $shipping): Response`／「存在しない出荷識別子（非同期保存）｜出荷の取得に失敗し、フレームワークの未検出応答となる。」 | OrderController.php:576-577／m05-13md:161 | — | 0 `non-ui-observable`（応答本文の形式=JSON/HTMLは要実機・§9-6） |
| L1-M0513-020 | status_transition | 編集フォーム経路: 問い合わせ番号は受注編集フォームの通常送信（登録=`mode=register`）で受注全体の保存と同時に検証・保存。**成功時は当該受注の編集画面（`admin_order_edit`）へリダイレクト**。**検証エラー時は問い合わせ番号欄の直下に項目エラーを表示し、受注を保存しない**（同一画面再表示） | standard-src＋設計書md | `return $this->redirectToRoute('admin_order_edit', ['id' => $TargetOrder->getId()]);`／「サーバは出荷情報フォームの一項目として問い合わせ番号を検証する。…検証エラー時はフォーム直下に項目エラーを表示し、受注を保存しない。」／「受注編集で受注を保存｜受注編集機能の保存後遷移に従う。問い合わせ番号は同時に保存される。」 | EditController.php:754／m05-13md:104-107,237,250 | — | 0 `non-ui-observable` |
| L1-M0513-021 | 整合 | 一覧と編集は**同一の `dtb_shipping.tracking_number` を参照・更新**（片方で保存した値は他方を次に開いたときの初期値）。一覧・編集とも**画面表示時点の永続化済みの値**を表示。**最大長の差**: 200文字を超え255文字以下の値は非同期保存でのみ保存され、その出荷を編集フォームで再保存する際に最大長検証（200）に掛かり得る | 設計書md | 「一覧と編集の一致｜受注一覧と受注編集はいずれも同一の出荷情報の伝票番号列を参照・更新する。片方で保存した値は、他方を次に開いたときの初期値に反映される。」／「参照時点｜一覧・編集とも画面表示時点の永続化済みの値を表示する。」／「最大長の差｜非同期保存は255文字まで、編集フォームは200文字までを許す。200文字を超え255文字以下の値は非同期保存でのみ保存され、その出荷を編集フォームで再保存する際に最大長検証に掛かり得る。」 | m05-13md:169-171／（列の同一性はShipping.php:117-118＋OrderController.php:609＋ShippingType.php:197で立証） | — | 0 `non-ui-observable` |
| L1-M0513-023 | concurrency | 同一出荷への競合保存は**後勝ち**＝最後に保存した受信値が `dtb_shipping.tracking_number` に確定し、**楽観・悲観ロックを取らない**（複数管理者の保存がいずれもロック競合エラーにならず、後の保存が前の保存を上書きする）。真の同時実行は非決定的のため、決定的観測は**順序確定した連続保存**（2管理セッションA→B）で行う | 設計書md＋standard-src（傍証） | 「同時更新｜出荷単位の上書き保存であり、同一出荷を複数の管理者が同時に保存した場合は後勝ちとなる。ロックは取らない。」／「本機能は問い合わせ番号の保存で楽観ロック・悲観ロックを取らない。出荷単位の上書き保存であり、同一出荷への同時保存は後勝ちとなる。」／ee傍証: 保存経路は `setTrackingNumber`→`persist`→`flush` のみで、ロック取得（`LockMode`等）の呼出なし（OrderController.php:608-612実測） | m05-13md:172,272／OrderController.php:608-612 | — | 0 `non-ui-observable` |
| L1-M0513-022 | request契約 | 非同期保存のrequest契約: 管理画面は `<meta name="eccube-csrf-token" content="{{ csrf_token(TOKEN_NAME) }}">` を持ち、adminの全ajaxに `ECCUBE-CSRF-TOKEN` ヘッダを付与する（`$.ajaxSetup`）。トークンはヘッダ `ECCUBE-CSRF-TOKEN` またはパラメータ `_token` で受理。XHR判定は `isXmlHttpRequest()`（`X-Requested-With: XMLHttpRequest`）。ボディはform形式 `tracking_number=<値>` | standard-src | `<meta name="eccube-csrf-token" content="{{ csrf_token(constant('Eccube\\Common\\Constant::TOKEN_NAME')) }}">`／`$.ajaxSetup({ 'headers': { 'ECCUBE-CSRF-TOKEN': $('meta[name="eccube-csrf-token"]').attr('content') } });`／`$token = $request->get(Constant::TOKEN_NAME) ?: $request->headers->get('ECCUBE-CSRF-TOKEN');` | default_frame.twig:16,83-87／AbstractController.php:256／Constant.php:41／index.twig:180-182 | — | 0 `non-translated` |

## §2 SEED三段参照設計

三段参照: `L1恒等写像claim（passthrough_basis=m05-13md:146-147入力項目表・169整合表） → fixture_version（SEEDセットID@manifest_sha1） → 実値`。
固定値は**入力の再現手段**であり期待値の正にしない。全て `@TBD-D5`。

| SEEDセットID | 目的 | 固定値（設計） | 後始末 |
|---|---|---|---|
| SEED-M01-ADMIN | 管理者ログイン | W0/W1と共通（管理画面ログイン可能なmember） | 不変 |
| SEED-M05-13-ORDER | 保存系（PUT/編集登録）・初期表示の対象受注 | `dtb_order` 1件: id=900051301（帯@TBD-D5）・**単一配送（isMultiple=false・編集画面に送り状No.欄が出る前提=L1-005）**・**登録POST（mode=register）が検証成功する完全受注**（必須FK: order_status/payment等・明細を含む）＋`dtb_shipping` 1件: id=900051311・**tracking_number=`M0513-INIT-1`**（半角英数ハイフン=編集再保存でも検証通過する初期値）。受注はNOT NULL/FK関連行が多く**行セットの完全定義はD5 manifest契約で確定**（ここではセット設計のみ・捏造しない） | UPSERTべき等・**保存系ケース後にafterEachで同値へ再適用（tracking_number復元を含む）** |
| SEED-M05-13-ORDER2 | 空初期値・保存単位の不変側対照 | 同型の完全受注1件: id=900051302・`dtb_shipping` id=900051312・**tracking_number=NULL** | 再適用 |

- **破壊系の統治**: 送り状No.保存（PUT・編集登録とも）は `dtb_shipping.tracking_number` の**確定上書き**。対象は
  **固定idのSEED出荷（900051311/900051312）に限定**し、一覧先頭受注・実データの出荷は**書き換えない**
  （既存spec.ts:18の既知の穴の回避）。各保存系ケースは実行後にSEED再適用（`UPDATE dtb_shipping SET tracking_number=...`）で復元。
- 対象行の一意特定は**固定id**で決定的。新規行を作らないためrun-id prefixの残骸掃除は不要。入力値には
  `E2E-<runid>-` prefixを用い、他行への誤書込をdb.tsの否定照会（当該id以外に`E2E-<runid>-%`が0行）で検出可能にする。
- 存在しない出荷id=**999999901**（SEED帯と衝突しない値・D5帯確定時に再割当可）。

## §3 画面項目マトリクス

三値比較: 設計書md（入力項目表:146-149）／ee Form・コントローラ検証（ShippingType.php／OrderController.php）／ee DB（Shipping.php）。
本機能の画面項目は送り状No.1項目×**2経路**（受注編集フォームの他項目はM05-11の正=md:38）。

| 項目（経路） | 任意/必須 | 最大文字数（検証層/DB層・unit=文字） | 文字種 | 境界・代表値 | メッセージ（ja/en・L1参照) |
|---|---|---|---|---|---|
| 送り状No.（受注一覧の非同期保存・PUT） | **任意**（md:146「任意」。ただし**空文字の帰結はDOC-DRAFT-1**: 設計書=文字種エラーで保存しない(md:155)/eeソース読み=Regexはskip・Lengthは長さ0でmax違反なし＝違反0件で``''``保存〔RegexValidator.php:33-35・LengthValidator.php:30-38〕→C-022実機裁定） | **検証255**（OrderController.php:590＋eccube.yaml:137）**／DB255**（Shipping.php:117）→**段差0**: 255受理=DB上限一致 | 半角変換後 `/^[0-9a-zA-Z-]+$/u`（OrderController.php:584,591-593）。**全角英数は変換して受理**（`ＡＢＣ１２３`→`ABC123`=L1-017）・記号/空白は拒否 | `runFill(255,ascii,"E2E-<runid>-")`受理＋DB char_length=255／`runFill(256,ascii,…)`拒否・DB不変／`E2E@123`拒否／`ＡＢＣ１２３`→`ABC123`保存 | 文字種: L1-011（JSON messages配列）／超過: L1-012（limit=255）／非XHR: L1-014b（NG400・文言なし） |
| 送り状No.（受注編集の出荷情報・フォーム） | **任意**（ShippingType.php:198 `required=>false`・NotBlank不在=L1-007。空保存・空へ消去とも可=md:156） | **Form200**（ShippingType.php:200＋eccube.yaml:118）**／DB255**（同上）→**段差55文字**: 201..255字はFormで拒否されDB到達しない。**逆向き段差**: 一覧経由で保存済みの201..255字は編集再保存時に200超過エラー（md:171=L1-021・C-046） | `/^[0-9a-zA-Z-]+$/u`（ShippingType.php:202）。**半角変換なし**＝全角は文字種エラー（md:158=L1-017） | `runFill(200,ascii,…)`受理＋DB char_length=200／`runFill(201,ascii,…)`拒否・DB不変／`E2E@123`拒否／`ＡＢＣ１２３`拒否 | 文字種: L1-008（欄直下・edit.twig:1783）／超過: L1-009（limit=200・欄直下） |

## §4 実行可能グレード14列TSV（候補・**自己完結＝全32行を実体掲載**）

記法: 期待結果セルは三段参照 `…実値… [L1:<oracle_id>; fixture:<SEEDセットID>@TBD-D5]`。
`%eccube_admin_route%` は環境値（既定 `admin`）。ORDER=受注900051301/出荷900051311（SEED-M05-13-ORDER）・
ORDER2=受注900051302/出荷900051312（SEED-M05-13-ORDER2）。
「PUT契約」=L1-M0513-022のrequest契約（管理セッション＋ヘッダ `X-Requested-With: XMLHttpRequest`・`ECCUBE-CSRF-TOKEN`=meta実値・form body `tracking_number=<値>`）。
登録操作=「`button[name="mode"][value="register"]`（edit.twig:1927・最下部）押下」。en行はD15前提。

記法追記（改訂1）: **不変性の期待はSEED初期値リテラルでなく操作前スナップショット `S0`（db.ts照会値）との同値比較**で書く
（`S0=SELECT tracking_number FROM dtb_shipping WHERE id=<出荷id>` を操作前に取得）。SEED固定値は前提・復元にのみ使う。

### §4.1 bound対応候補行（32行=ja27＋-EN5。§8の89対応表が参照する全行）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m05-13_admin_order_order_tracking_number	E2E-M0513C-001	IT-15	権限	P1	未ログインで受注一覧URLへ直接アクセス→ログイン画面へ	未ログイン	—	1. GET /%eccube_admin_route%/order	admin_login のログイン画面へ誘導され受注一覧（送り状No.機能）へ到達しない [L1:L1-M0513-001,L1-M0513-002]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-002	IT-15	権限	P1	未ログインで受注編集URLへ直接アクセス→ログイン画面へ	未ログイン／SEED-M05-13-ORDER	—	1. GET /%eccube_admin_route%/order/900051301/edit	admin_login のログイン画面へ誘導され送り状No.欄へ到達しない [L1:L1-M0513-001,L1-M0513-002; fixture:SEED-M05-13-ORDER@TBD-D5]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-003	IT-15	権限	P1	未認証で非同期保存PUTを直接送信→保存されない	未ログイン（セッションなしのrequestコンテキスト）／SEED-M05-13-ORDER	tracking_number=`E2E-<runid>-NOAUTH`	1. db.tsで操作前スナップショット S0=tracking_number照会 2. セッションなしで PUT /%eccube_admin_route%/shipping/900051311/tracking_number（PUT契約のヘッダなし相当でも可） 3. 応答とdb.tsで再照会	status:OK のJSONは返らず admin_login への誘導応答（管理FW保護）・dtb_shipping.tracking_number=S0（操作前スナップショットと同値=保存されない） [L1:L1-M0513-001,L1-M0513-016; fixture:SEED-M05-13-ORDER@TBD-D5]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-010	IT-25	表示	P1	受注一覧が出荷行単位（1行=1出荷）で表示される	ログイン済(SEED-M01-ADMIN)／SEED-M05-13-ORDER＋ORDER2	—	1. GET /order 2. tbody行の構造（行内checkboxの data-id=出荷id・data-order-id=受注id）を読む	一覧は出荷行単位で表示され、行のcheckboxは id=check_<出荷id>・data-id=<出荷id>（1行が1出荷に対応）。SEED出荷行の可視性（初期表示の絞込条件）は§9-7の要実機注記に従う [L1:L1-M0513-003; fixture:SEED-M05-13-ORDER@TBD-D5,SEED-M05-13-ORDER2@TBD-D5]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-011	IT-25	表示	P2	一覧ページに送り状No.更新JSの設計実体が存在する（＋マークアップ未配置の実測記録）	ログイン済	—	1. GET /order 2. ページHTML（インラインscript）に updateTrackingNumber 定義・type:'PUT'・tracking_number送信・input/button.update_tracking_number セレクタ参照が含まれることを確認 3. 行内に input.update_tracking_number / button.update_tracking_number / #tracking_number_* の要素が存在するか数える	【主判定】HTMLに設計JS（updateTrackingNumber・PUT・tracking_number）が実在する [L1:L1-M0513-004]。【実測記録・BC-DRAFT基盤】行内マークアップは0件=未配置（設計書md:79自認・不具合候補#1承継）。UI操作系の期待はC-060/C-061（BC-DRAFT行）へ				
m05-13_admin_order_order_tracking_number	E2E-M0513C-012	IT-25	初期表示	P1	受注編集の送り状No.欄が永続化済みDB値を初期表示する（表示のみ・書込なし）	ログイン済／SEED-M05-13-ORDER	—	1. db.tsで S0=SELECT tracking_number FROM dtb_shipping WHERE id=900051311 2. GET /order/900051301/edit 3. #order_Shipping_tracking_number の値を読む 4. db.tsで再照会	欄の初期値=S0（DB現行値との恒等表示・L1経由）・表示後の再照会もS0と同値（表示のみではDBが変化しない=レコード追加・更新なし） [L1:L1-M0513-005,L1-M0513-017,L1-M0513-016; fixture:SEED-M05-13-ORDER@TBD-D5]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-013	IT-25	表示	P1	受注編集に「送り状No.」ラベル・ツールチップ・1行テキスト欄が表示される（ja）	ログイン済／SEED-M05-13-ORDER（単一配送）	—	1. 編集画面を開く 2. ラベル文言・label[data-bs-toggle="tooltip"] の title属性・入力欄の要素型（input[type=text]）・説明アイコン(i.fa-question-circle)を読む	ラベル「送り状No.」・title属性=「お問い合せ番号（出荷伝票番号）がある場合、こちらから入力できます。受注一覧からまとめて入力することも可能です。」（完全一致）・欄は #order_Shipping_tracking_number の1行テキスト（input[type=text]）・直下にエラー描画位置（form_errors）が実在 [L1:L1-M0513-005,L1-M0513-006,L1-M0513-008; fixture:SEED-M05-13-ORDER@TBD-D5]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-013-EN	IT-25	表示	P3	送り状No.ラベル・ツールチップ（en）	ログイン済／SEED-M05-13-ORDER／locale=en	—	同上	ラベル "Tracking No."・title属性="If you have a tracking number (delivery slip number), you can enter from here. You can also bulk-input from All Orders."（完全一致） [L1:L1-M0513-005,L1-M0513-006]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-014	IT-23	整合	P1	非同期保存した値が編集画面の初期値に反映される（同一列参照・表示時点の永続値）	ログイン済／SEED-M05-13-ORDER	tracking_number=`E2E-<runid>-SYNC1`	1. PUT契約で 900051311 へ保存 2. GET /order/900051301/edit 3. #order_Shipping_tracking_number の値を読む（実行後SEED再適用）	編集画面の初期値=`E2E-<runid>-SYNC1`（一覧・編集は同一の dtb_shipping.tracking_number を参照。表示時点の永続化済み値） [L1:L1-M0513-021,L1-M0513-013,L1-M0513-016; fixture:SEED-M05-13-ORDER@TBD-D5]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-020	IT-26	保存	P1	PUT契約で半角英数ハイフンを保存→OK応答・DB更新	ログイン済／SEED-M05-13-ORDER	tracking_number=`E2E-<runid>-TN1`	1. GET /order で meta[name="eccube-csrf-token"] を取得 2. PUT契約で 900051311 へ送信 3. 応答JSONを読む 4. db.tsで tracking_number照会（実行後SEED再適用）	HTTP200・JSON {"status":"OK","shipping_id":900051311,"tracking_number":"E2E-<runid>-TN1"}＋dtb_shipping.tracking_number=同値（画面遷移を伴わない非同期保存。入力欄への反映はUI未配置=BC副観測） [L1:L1-M0513-013,L1-M0513-010,L1-M0513-016,L1-M0513-022; fixture:SEED-M05-13-ORDER@TBD-D5]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-021	IT-26	上書き	P1	既存値ありの出荷へPUT→受信値で上書き・行の追加/削除なし	ログイン済／SEED-M05-13-ORDER(tracking_number=`M0513-INIT-1`)	tracking_number=`E2E-<runid>-OVR1`	1. db.tsで S0=tracking_number（非空=SEED前提）と N1=COUNT(*) FROM dtb_shipping を照会 2. PUT契約で保存 3. db.tsで値と N2=COUNT(*) を照会（実行後SEED再適用）	dtb_shipping.tracking_number=入力値（S0≠入力値からの受信値上書き。S0はスナップショット参照であり期待の正はL1）・N1=N2（行の追加・削除なし=更新のみ） [L1:L1-M0513-016,L1-M0513-013; fixture:SEED-M05-13-ORDER@TBD-D5]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-022	IT-22	空入力	P2	PUT契約で空文字を送信（DOC-DRAFT-1・実機裁定行）	ログイン済／SEED-M05-13-ORDER	tracking_number=``（空文字）	1. db.tsで S0=tracking_number照会 2. PUT契約で空文字を送信 3. 応答JSONとdb.tsで再照会（実行後SEED再適用）	【確定期待とせず実機裁定・DOC-DRAFT-1】設計書期待=NG400（文字種エラー）で保存されず S0（操作前スナップショット）と同値のまま（m05-13md:155）／eeソース読み=Regexは空文字をskip・Lengthは長さ0でmax違反なし＝違反0件でHTTP200 OK・空文字が保存（空消去成立。RegexValidator.php:33-35・LengthValidator.php:30-38）。実機結果で裁定し、設計書側またはee側の是正を§9-1に記録する [L1:L1-M0513-018; fixture:SEED-M05-13-ORDER@TBD-D5]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-023	IT-13	対象データ	P2	存在しない出荷idへのPUT→未検出応答・保存されない	ログイン済	tracking_number=`E2E-<runid>-NF1`／id=999999901（不存在）	1. PUT契約で /shipping/999999901/tracking_number へ送信 2. 応答ステータスを読む 3. db.tsで tracking_number=`E2E-<runid>-NF1` の行が0件であることを照会	フレームワークの未検出応答（HTTP404）となり処理は完了しない・どの出荷行にも値が書き込まれない（応答本文の形式=JSON/HTMLは§9-6要実機） [L1:L1-M0513-019]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-024	IT-22	文字種	P1	PUT契約で記号入りを送信→NG400・文字種文言・DB不変（ja）	ログイン済／SEED-M05-13-ORDER	tracking_number=`E2E@123`（@含む）	1. db.tsで S0=tracking_number照会 2. PUT契約で送信 3. 応答JSONを読む 4. db.tsで再照会	HTTP400・JSON {"status":"NG","messages":["送り状No.は半角英数字かハイフンのみを入力してください。"]}＋dtb_shipping.tracking_number=S0（操作前スナップショットと同値=保存されない）。【要実機副観測】保存例外時のNG500は決定的誘発手段がなく未検証（§9-5） [L1:L1-M0513-011,L1-M0513-014,L1-M0513-016; fixture:SEED-M05-13-ORDER@TBD-D5]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-024-EN	IT-22	文字種	P3	PUT検証エラー文言（en・文言確定行）	ログイン済／SEED-M05-13-ORDER／locale=en	同上	同上	messages=["Only Roman alphabets, numbers and hyphens are accepted for tracking numbers."]（実行D15前提。主判定=NG400/DB不変はC-024と同一） [L1:L1-M0513-011]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-025	IT-26	半角変換	P2	PUT契約で全角英数字を送信→半角変換後に保存される	ログイン済／SEED-M05-13-ORDER	tracking_number=`ＡＢＣ１２３`（全角）	1. PUT契約で送信 2. 応答JSONの tracking_number を読む 3. db.tsで照会（実行後SEED再適用）	HTTP200 OK・応答 tracking_number=`ABC123`（半角変換後値）＋dtb_shipping.tracking_number=`ABC123`（半角英数字とハイフンの範囲へ変換後に保存） [L1:L1-M0513-017,L1-M0513-010,L1-M0513-013; fixture:SEED-M05-13-ORDER@TBD-D5]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-026	IT-22	境界	P1	PUT契約で255字（上限）→受理・DB文字長=255	ログイン済／SEED-M05-13-ORDER	tracking_number=runFill(255,ascii,"E2E-<runid>-")	1. PUT契約で送信 2. 応答JSON確認 3. db.tsで char_length(tracking_number) 照会（実行後SEED再適用）	HTTP200 OK＋DB文字長=255（検証255=DB255・段差0。エラーなく処理継続） [L1:L1-M0513-010,L1-M0513-016; fixture:SEED-M05-13-ORDER@TBD-D5]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-027	IT-22	境界	P1	PUT契約で256字→NG400・Length文言(255)・DB不変（ja）	ログイン済／SEED-M05-13-ORDER	tracking_number=runFill(256,ascii,"E2E-<runid>-")	1. db.tsで S0=tracking_number照会 2. PUT契約で送信 3. 応答JSONを読む 4. db.tsで再照会	HTTP400・JSON {"status":"NG","messages":["長すぎます。この値は255文字以下で入力してください。"]}＋DB=S0（操作前スナップショットと同値=保存されない） [L1:L1-M0513-012,L1-M0513-014,L1-M0513-016; fixture:SEED-M05-13-ORDER@TBD-D5]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-027-EN	IT-22	境界	P3	PUT256字の超過文言（en・文言確定行）	ログイン済／SEED-M05-13-ORDER／locale=en	同上	同上	messages=["This value is too long. It should have 255 characters or less."]（choice複数側・実行D15前提） [L1:L1-M0513-012]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-028	IT-23	保存単位	P1	保存は出荷単位・当該出荷行の tracking_number 列のみ更新	ログイン済／SEED-M05-13-ORDER＋ORDER2(tracking_number=NULL)	tracking_number=`E2E-<runid>-UNIT1`（900051311側のみ）	1. db.tsで両行の操作前スナップショット S11（id=900051311）・S12（id=900051312）を照会 2. PUT契約で 900051311 へ保存 3. db.tsで両行を同一クエリで再照会（実行後SEED再適用）	900051311=入力値へ更新・900051312=S12（操作前スナップショットと同値=不変）（保存先=dtb_shipping.tracking_number 列・idが対象出荷の特定キー・出荷を表す台帳の当該行のみ） [L1:L1-M0513-016,L1-M0513-013; fixture:SEED-M05-13-ORDER@TBD-D5,SEED-M05-13-ORDER2@TBD-D5]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-029	IT-26	同時更新	P2	同一出荷への複数管理セッションの保存は後勝ち・ロックなし	ログイン済×2管理セッション（A/B・いずれもSEED-M01-ADMIN）／SEED-M05-13-ORDER	A: tracking_number=`E2E-<runid>-CCA`／B: tracking_number=`E2E-<runid>-CCB`	1. セッションA・BそれぞれでPUT契約のトークンを取得 2. 同一出荷 900051311 へ A→B の順で連続PUT（真の同時実行は非決定的のため順序を確定して後勝ち意味論を観測） 3. 両応答を読む 4. db.tsで tracking_number照会（実行後SEED再適用）	両PUTともHTTP200 {"status":"OK",...}（ロックを取らない=いずれの保存もロック競合エラーにならない）＋dtb_shipping.tracking_number=`E2E-<runid>-CCB`（最後に保存した受信値が確定=後勝ちの上書き。Aの値は残らない） [L1:L1-M0513-023,L1-M0513-013,L1-M0513-016; fixture:SEED-M05-13-ORDER@TBD-D5]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-040	IT-26	保存	P1	受注編集で送り状No.を入力して登録→受注保存と同時に保存・編集画面へリダイレクト	ログイン済／SEED-M05-13-ORDER	#order_Shipping_tracking_number=`E2E-<runid>-ED1`（他項目は既存値のまま）	1. 編集画面で欄を書き換え 2. button[name="mode"][value="register"]（edit.twig:1927）押下 3. 遷移先URLを読む 4. db.tsで tracking_number照会（実行後SEED再適用）	/order/900051301/edit へリダイレクト（受注全体の保存成功）＋dtb_shipping.tracking_number=`E2E-<runid>-ED1`（変換なしの恒等保存） [L1:L1-M0513-020,L1-M0513-016,L1-M0513-017; fixture:SEED-M05-13-ORDER@TBD-D5]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-041	IT-22	任意	P1	受注編集で空へ更新→必須エラーなしで保存され空になる（編集経路の消去）	ログイン済／SEED-M05-13-ORDER(tracking_number=`M0513-INIT-1`)	#order_Shipping_tracking_number=空（全消去）	1. 編集画面で欄を空にして登録押下 2. リダイレクト確認 3. db.tsで COALESCE(tracking_number,'')照会（実行後SEED再適用）	必須・文字種エラーは表示されず保存成功（編集画面へリダイレクト）＋dtb_shipping.tracking_number が空（COALESCE=''。任意項目・空はRegexがskip・Lengthは長さ0でmax違反なし） [L1:L1-M0513-007,L1-M0513-020,L1-M0513-016; fixture:SEED-M05-13-ORDER@TBD-D5]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-042	IT-22	境界	P2	受注編集で200字（上限）→受理・DB文字長=200	ログイン済／SEED-M05-13-ORDER	#order_Shipping_tracking_number=runFill(200,ascii,"E2E-<runid>-")	1. 編集画面で200字を入力し登録 2. リダイレクト確認 3. db.tsで char_length照会（実行後SEED再適用）	エラーなく保存成功＋DB文字長=200（確認値200=eccube_mtext_len。文字長意味論） [L1:L1-M0513-007,L1-M0513-016; fixture:SEED-M05-13-ORDER@TBD-D5]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-043	IT-22	境界	P1	受注編集で201字→欄直下にLength文言(200)・受注保存されずDB不変（ja）	ログイン済／SEED-M05-13-ORDER	#order_Shipping_tracking_number=runFill(201,ascii,"E2E-<runid>-")	1. db.tsで S0=tracking_number照会 2. 編集画面で201字を入力し登録押下 3. 同一画面再表示と #order_Shipping_tracking_number 直下のエラー文言を読む 4. db.tsで再照会	同一編集画面を再表示・欄直下（form_errors・edit.twig:1783）に「長すぎます。この値は200文字以下で入力してください。」・dtb_shipping.tracking_number=S0（操作前スナップショットと同値=受注を保存しない） [L1:L1-M0513-009,L1-M0513-020,L1-M0513-016; fixture:SEED-M05-13-ORDER@TBD-D5]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-043-EN	IT-22	境界	P3	編集201字の超過文言（en・文言確定行）	ログイン済／SEED-M05-13-ORDER／locale=en	同上	同上	"This value is too long. It should have 200 characters or less."（欄直下・実行D15前提） [L1:L1-M0513-009]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-044	IT-22	文字種	P1	受注編集で記号入り→欄直下に文字種文言・受注保存されない（ja）	ログイン済／SEED-M05-13-ORDER	#order_Shipping_tracking_number=`E2E@123`	1. db.tsで S0=tracking_number照会 2. 編集画面で記号入りを入力し登録押下 3. 欄直下のエラー文言を読む 4. db.tsで再照会	同一編集画面再表示・欄直下に「半角英数字かハイフンのみを入力してください。」・DB=S0（操作前スナップショットと同値=受注を保存しない） [L1:L1-M0513-008,L1-M0513-020,L1-M0513-016; fixture:SEED-M05-13-ORDER@TBD-D5]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-044-EN	IT-22	文字種	P3	編集文字種エラー文言（en・文言確定行）	ログイン済／SEED-M05-13-ORDER／locale=en	同上	同上	"Entry must be alphanumeric characters or hyphens."（欄直下・実行D15前提） [L1:L1-M0513-008]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-045	IT-22	半角変換なし	P2	受注編集で全角英数字→変換されず文字種エラー・DB不変	ログイン済／SEED-M05-13-ORDER	#order_Shipping_tracking_number=`ＡＢＣ１２３`（全角）	1. db.tsで S0=tracking_number照会 2. 編集画面で全角を入力し登録押下 3. 欄直下のエラー文言を読む 4. db.tsで再照会	編集経路は半角変換を行わないため欄直下に「半角英数字かハイフンのみを入力してください。」・DB=S0（操作前スナップショットと同値・`ABC123`が保存されていない=変換保存されない。一覧経路C-025との経路差） [L1:L1-M0513-017,L1-M0513-008,L1-M0513-020; fixture:SEED-M05-13-ORDER@TBD-D5]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-046	IT-22	段差	P1	一覧経由255字保存済みの出荷を編集で再保存→200超過エラー（最大長の差）	ログイン済／SEED-M05-13-ORDER	前段: PUT契約で runFill(255,ascii,"E2E-<runid>-") を保存	1. PUT契約で255字を保存（一覧経路は受理） 2. GET /order/900051301/edit（初期値に255字が載る） 3. 欄を変更せず登録押下 4. 欄直下エラーとdb.tsで char_length照会（実行後SEED再適用）	編集フォームの最大長検証（200）に掛かり欄直下に「長すぎます。この値は200文字以下で入力してください。」・受注は保存されずDB文字長=255のまま（201..255字は非同期でのみ保存可・編集で再保存不可=Form200/DB255の逆向き段差の実証） [L1:L1-M0513-021,L1-M0513-009,L1-M0513-020,L1-M0513-016; fixture:SEED-M05-13-ORDER@TBD-D5]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-060	IT-25	一覧UI操作	P2	【BC-DRAFT】一覧の更新ボタンは初期無効・入力で有効化＋アイコン色変化	ログイン済／SEED-M05-13-ORDER	入力欄へ任意の1字	1. GET /order 2. button.update_tracking_number の disabled を読む 3. input.update_tracking_number へkeyup入力 4. ボタンのdisabled解除と i要素のclass（text-secondary→text-success）を読む	【仕様どおりの期待（JS実体=index.twig:219,221-227）】更新ボタンは初期状態で無効・keyupで有効化されアイコンが text-secondary から text-success へ変わる。【BC-DRAFT・実行不能】行内マークアップ未配置（grep実測0件・md:79自認=不具合候補#1）のため現状は対象要素が存在せず実行不能（fixme相当）。実装配置後に解禁 [L1:L1-M0513-004]				
m05-13_admin_order_order_tracking_number	E2E-M0513C-061	IT-25	一覧UI操作	P2	【BC-DRAFT】非同期保存の失敗応答で messages改行連結アラート／OK以外で Update failed.	ログイン済／SEED-M05-13-ORDER	入力欄へ `E2E@123`（4xx誘発）	1. 一覧の入力欄へ記号入りを入力し更新ボタン押下 2. アラート文言を読む	【仕様どおりの期待（JS実体=index.twig:184-201）】4xx/5xx応答時は応答JSONの messages 配列を改行連結してアラート表示（記号入りなら「送り状No.は半角英数字かハイフンのみを入力してください。」）・応答が到達しstatusがOK以外のときは固定文言 `Update failed.`（日英共通）をアラート表示。【BC-DRAFT・実行不能】同上マークアップ未配置のため現状実行不能（fixme相当。文言はL1-011で確定済み・サーバ側挙動はC-024で自立検証） [L1:L1-M0513-004,L1-M0513-011]				
```

### §4.2 補完行（1行。**親test_idなし・母集合会計に算入しない**。理由=設計書補完〔md:96,218,247に非XHR拒否の規定があるが母集合89行の期待テキストに存在しない〕）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m05-13_admin_order_order_tracking_number	E2E-M0513C-030	IT-15	要求正当性	P2	非XHR要求のPUTはNG400で拒否される（トークン有・XHRヘッダなし）	ログイン済／SEED-M05-13-ORDER	tracking_number=`E2E-<runid>-NOXHR`／ヘッダ: ECCUBE-CSRF-TOKEN=正値・X-Requested-Withなし	1. PUT契約から X-Requested-With のみ除いて送信 2. 応答を読む 3. db.tsで tracking_number照会	HTTP400・JSON {"status":"NG"}（messagesなし・短絡評価で非XHR側が確定）＋DB不変（補完行・親test_idなし・設計書補完）。※XHRあり+トークン不正の応答は設計書とeeの不一致候補=DOC-DRAFT-2（§9-2）のため本行の期待にしない [L1:L1-M0513-014,L1-M0513-022; fixture:SEED-M05-13-ORDER@TBD-D5]				
```

## §5 locale対応表

LS=1 claim: **L1-005（ラベル）・L1-006（ツールチップ）・L1-008・L1-009・L1-011・L1-012 の6claim → -EN 5行**
（C-013-EN〔ラベル＋ツールチップの2claim同居〕／C-044-EN／C-043-EN／C-024-EN／C-027-EN。
全行§4.1に実体掲載・文言はen一次資料逐語＝ja翻訳ゼロ）。
- messages.en.yaml:2368 `Tracking No.`／en:3230 tooltip／en:2369 `Only Roman alphabets, numbers and hyphens are accepted for tracking numbers.`／
  validators.en.yaml:36 `Entry must be alphanumeric characters or hyphens.`／validators.en.xlf:78-79（choice解決→"200 characters"/"255 characters"複数側）。
- `Update failed.` は**翻訳キーを介さない日英共通の固定文言**（md:119・index.twig:190）＝LS=0扱い・-EN行不要（C-061に内包）。
- -EN行の実行前提はD15（M0 Go/No-Go。管理画面のen切替口なし＝W0実測を継承）。文言確定は本書で完了（6claim/6=100%）。

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

- page: 既存 `e2e/pages/admin/m05/m05_13_admin_order_order_tracking_number.page.ts` を再利用可能
  （`#order_Shipping_tracking_number`・`input.update_tracking_number`・`button.update_tracking_number` 等実装済み。
  ただし同ファイル内のtwig/PHP行番号注記は**旧版**であり、本書§1の実測行番号が正=§0）。
- request契約（PUT）: 管理セッション（storageState）でGET /orderし `meta[name="eccube-csrf-token"]` の実値を取得→
  `request.put('/%eccube_admin_route%/shipping/{id}/tracking_number', { headers: {'X-Requested-With':'XMLHttpRequest','ECCUBE-CSRF-TOKEN':<meta値>}, form: {tracking_number: v} })`
  （L1-M0513-022根拠: default_frame.twig:16,83-87／AbstractController.php:256）。**一覧UIが未配置でも
  非同期保存のサーバ側仕様を全数観測できる**（本機能でrequest契約が必須である理由）。
- spec: 候補の追加ケースspecは**未実装・実走なし**。期待値は `o("L1-M0513-xxx")`（L1解決器）経由・リテラル直書き禁止。
  db.ts（`e2e/helpers/db.ts`）で `SELECT tracking_number / char_length(tracking_number) / COUNT(*) FROM dtb_shipping WHERE id=...` を照会。
  境界値は `runFill(n, repertoire, prefix)`（決定的生成）。
- **不変性の判定規約（改訂1）**: 「保存されない・DB不変」の期待は**操作前スナップショットS0（db.ts照会値）との
  同値比較**で判定し、SEED初期値リテラルを期待の正にしない（三段参照。SEED値はfixture前提・afterEach復元値のみ）。
- **破壊系の実装規約**: 保存系ケース（C-014/020/021/022/025/026/029/040/041/042/046＋失敗系のDB不変確認）は
  対象=固定idのSEED出荷のみ・**afterEachでSEED再適用**（`UPDATE dtb_shipping SET tracking_number='M0513-INIT-1' WHERE id=900051311`／
  `... SET tracking_number=NULL WHERE id=900051312`）。一覧先頭受注を書き換える既存specの穴を構造的に再発させない。
- 編集経路の登録は受注編集フォーム全体の送信（他項目はSEEDの既存値のまま=検証成功する完全受注が前提・@TBD-D5）。

**_drafts/隔離lintの実施証跡（実測・実施済み）**:
1. 正式消費側（`e2e/helpers/oracle.ts`・`db.ts`・spec・pages）に本草案を消費する `_drafts` 参照は**0件**
   （隔離ガード自体のリテラル〔oracle.ts:19〕は機械強制であり消費参照ではない）。
2. 正式パス `e2e/fixtures/oracle/` 直下に本機能のjsonは**作成していない**（草案は `_drafts/` のみ）。
3. 本md・oracle草案jsonの出力先はともに `_drafts/` 配下のみ。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

| ケース群 | 実行区分（候補） | 観測層 | 備考 |
|---|---|---|---|
| C-001,002,010,011,012,013（＋EN） | Playwright | GUI/HTTP | 認証リダイレクト・表示・静的JS確認 |
| C-003,014,020,021,022,023,024,025,026,027,028,029,030（＋EN） | Playwright(request契約)+db.ts | HTTP(JSON)+DB | 非同期保存の全数。UI未配置に依存しない。実行後SEED再適用（C-029は2管理セッション） |
| C-040,041,042,043,044,045,046（＋EN） | Playwright+db.ts | GUI+DB | 編集フォーム経路（登録押下）。実行後SEED再適用 |
| C-060,061 | **実行不能（BC-DRAFT・fixme相当）** | GUI | 一覧UIマークアップ未配置（L1-004・md:79自認）。実装配置後に解禁 |
| C-022 | 実機裁定（DOC-DRAFT-1） | HTTP+DB | 設計書とvendor実装の矛盾候補。結果で正本を裁定 |
| -EN 5行 | 実行保留（D15） | GUI/HTTP | 文言確定100%・実行のみ保留 |

聖域判定・多軸属性の正式付与はD14 v2合格後（本表は暫定・正式会計に使わない）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（§0判定原則。前提/入力列のシナリオ語・観点ラベルはノイズ）。
1候補ケース行=1 assertion bundle・多対一は `shared-observation`・-EN行は対応ja行と同一親のlocale多重。
**参照先の全候補行は§4に実体掲載済み＝89↔候補の期待テキスト突合が本文内で完結する**。

### 集計（89 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **68** | 下表（うちDOC-DRAFT裁定行bind=2〔009,063→C-022〕・BC-DRAFT行bind=3〔011,087→C-060／088→C-061〕・**改訂1で033を追加**〔同時更新=md:172実在仕様→C-029〕） |
| **TBD** | **0** | — |
| **excluded** | **21** | EX-A 検索取得系**17**（019〜032・034〜036。**033は改訂1でboundへ移動**。md:37逐語「受注一覧の検索・絞り込み・ページング・CSV出力・納品書出力」=本書対象外＋受注検索の実装所在はSearchOrderType.php:190-191=M05-01の正。m09-01 EX-A先例と同型。**17件の実引きは§9のEX-A実引き表**）／EX-B 相関バリ4（012〜015。ShippingType.php:197-206・OrderController.php:587-595実測=制約はLength+Regexの単項目のみ・相関constraint不存在・md本文に相関規定なし） |
| 合計 | **89** | 欠落0・理由なし重複0 |

- 候補ケース行総数**33**（§4.1 bound対応32＝ja27＋-EN5／§4.2 補完1）。
- **EX-Aの偽陰性回避の傍証（改訂1）**: 019〜032・034〜036の前提列が指す実項目（保存単位/上書き/空/全角/記号/
  最大長超/存在しないid/一致/参照時点/最大長の差/成功・失敗出力/副作用）は、**すべて別の母集合行（037〜086）の
  期待テキストでbound済み**（保存単位→059/C-028・上書き→060/C-021・空→063-064/C-022,C-041・全角→065-066/C-025,C-045・
  記号→067/C-024,C-044・最大長→068/C-027,C-043・不存在id→069/C-023・一致/参照→071/C-014・段差→072/C-046・
  出力→074-075/C-020,C-024）＝除外による検証範囲の欠落なし。**「同時更新」（033の前提列）だけは他行に対応する
  期待テキストが存在しない実在仕様（md:172）だったため、codex R1指摘によりboundへ移動しC-029を新設**（除外すると
  偽陰性になる唯一の項目＝Blocker是正）。per-ID実引きは§9のEX-A実引き表。
- **DBとの相関バリデーション（016〜017）はbound**: 本機能には出荷エンティティの存在解決（不存在→未検出応答=md:161）が
  実在するため、m09-01のEX-C（不存在）とは異なり期待テキスト（エラーなし継続/エラーで完了しない）を
  C-020/C-023へbindできる（偽陰性回避）。
- **極性・ノイズ処理の明示**（C4-manual対象=§10）: 009（必須エラーあり）はメモ様の必須制約が両経路とも不存在
  （L1-007/L1-010）だが、**一覧経路の空入力は設計書md:155が「検証エラーとなり保存しない」と規定**するため
  C-022へbind（ただしvendor実装と矛盾候補=DOC-DRAFT-1・実機裁定）。047（前提=非管理者・未認証、期待=追加されること）は
  前提列をノイズとして棄却し期待極性（肯定）でC-020へbind。

### 89対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 出荷行を一覧表示する管理画面であること | bound | C-010 |
| 002 | 出荷情報=出荷を表す台帳であること | bound | C-028 (shared・dtb_shipping行の実照会) |
| 003 | 出荷行を含む受注一覧を表示すること | bound | C-010 (shared) |
| 004 | 入力欄の値を非同期（XHR）で送信し当該出荷の問い合わせ番号を保存すること | bound | C-020 |
| 005 | 編集画面に送り状No.欄を現在の保存値を初期値として表示すること | bound | C-012 |
| 006 | 出荷情報フォームを受注全体の保存と同時に検証・保存すること | bound | C-040 |
| 007 | 管理用FWにより到達できず利用不可であること | bound | C-001,C-002,C-003 |
| 008 | 入力欄と更新ボタンを表示する設計のJSを持つこと | bound | C-011 |
| 009 | 必須バリでエラーが表示され完了しないこと | bound | C-022（**DOC-DRAFT-1裁定行**。一覧経路空入力=md:155の拒否規定へbind・vendor実装と矛盾候補） |
| 010 | 必須バリでエラーが表示されず継続できること | bound | C-041（編集経路空=任意） |
| 011 | アイコン未変更時text-secondary・変更検知時text-successであること | bound | C-060（**BC-DRAFT**・UI未配置で実行不能） |
| 012〜015 | 相関バリでエラーあり/なし | **excluded** EX-B | — |
| 016 | DB相関バリでエラー表示されず継続できること | bound | C-020 (shared・実在出荷idで処理継続) |
| 017 | DB相関バリでエラーが表示され完了しないこと | bound | C-023（不存在id→未検出応答） |
| 018 | 確認値200文字であること | bound | C-042,C-043（200/201境界対） |
| 019〜032 | 検索条件の該当レコードが取得結果に含まれる/含まれないこと | **excluded** EX-A（§9実引き表） | — |
| 033 | 実行結果の該当レコードが取得結果に含まれること（**前提=同時更新**） | bound | C-029（**改訂1・Blocker是正**: 前提列の「同時更新」はmd:172「後勝ち・ロックなし」の実在仕様。保存実行結果のレコードをdb.ts取得で観測） |
| 034〜036 | 実行結果の該当レコードが取得結果に含まれること | **excluded** EX-A（§9実引き表） | — |
| 037 | 登録内容の対象レコードが追加されること | bound | C-040 (shared) |
| 038 | 追加され**ない**こと | bound | C-044 (shared・拒否でDB不変) |
| 039 | 追加されること | bound | C-020 (shared) |
| 040 | 半角変換後に文字種`/^[0-9a-zA-Z-]+$/u`と最大長255文字を検証すること | bound | C-024,C-025,C-026,C-027 (shared) |
| 041 | 追加されること | bound | C-020 (shared) |
| 042 | 追加されること | bound | C-040 (shared) |
| 043 | 追加され**ない**こと | bound | C-024 (shared) |
| 044 | 追加されること（前提=一覧で入力し更新） | bound | C-020 (shared) |
| 045 | 追加され**ない**こと（前提=編集を開く） | bound | C-012 (shared・表示のみでDB不変) |
| 046 | 追加されること（前提=編集で保存） | bound | C-040 (shared) |
| 047 | 実行結果の対象レコードが追加されること | bound | C-020 (shared・前提列ノイズ=§10) |
| 048 | 入力欄と更新ボタンを表示する設計のJSを持つこと | bound | C-011 (shared) |
| 049 | 更新内容の値が変更されること | bound | C-020 (shared) |
| 050 | 値が変更され**ない**こと | bound | C-024 (shared) |
| 051 | 値が変更されること | bound | C-021 (shared) |
| 052 | 「送り状No.」ラベルとツールチップ付きの1行テキスト欄を表示すること | bound | C-013(+EN) |
| 053 | 値が変更されること | bound | C-040 (shared) |
| 054 | 値が変更されること | bound | C-040 (shared) |
| 055 | 値が変更され**ない**こと（前提=半角変換） | bound | C-045（編集経路は変換せず拒否=極性でbind） |
| 056 | 値が変更されること（前提=文字種） | bound | C-025 (shared・変換後範囲内は保存) |
| 057 | 値が変更され**ない**こと（前提=最大長・一覧） | bound | C-027 |
| 058 | 値が変更されること（前提=最大長・編集） | bound | C-042 |
| 059 | 実行結果の対象レコードの値が変更されること（前提=保存単位） | bound | C-028 |
| 060 | 保存時は当該出荷の伝票番号列を受信値で上書きすること | bound | C-021 |
| 061 | dtb_shipping.tracking_numberであること | bound | C-028 (shared・保存先列の実証) |
| 062 | dtb_shipping.tracking_numberであること | bound | C-040 (shared・編集経路も同一列へ保存) |
| 063 | 文字種検証が空文字に一致せず検証エラーとなり保存しないこと | bound | C-022（**DOC-DRAFT-1裁定行**） |
| 064 | 任意項目のため空のまま保存し得ること | bound | C-041 |
| 065 | 半角へ変換してから検証するため範囲なら保存されること | bound | C-025 |
| 066 | 半角変換を行わないため検証エラーとなること | bound | C-045 |
| 067 | いずれの経路でも文字種検証エラーとなり保存しないこと | bound | C-024,C-044（両経路） |
| 068 | 文字数超過の検証エラーとなり保存しないこと | bound | C-027,C-043（両経路・255/200） |
| 069 | エラーが表示され完了しないこと（前提=存在しないid） | bound | C-023 (shared) |
| 070 | エラーが表示されず継続できること | bound | C-020 (shared) |
| 071 | 一覧・編集とも画面表示時点の永続化済みの値を表示すること | bound | C-014（一覧側の欄表示はUI未配置=BC副観測・§9-4） |
| 072 | エラーが表示され完了しないこと（前提=最大長の差） | bound | C-046 |
| 073 | エラーが表示されず継続できること | bound | C-026 (shared・255受理で継続) |
| 074 | ステータスOK・出荷識別子・保存後の値を持つJSONであること | bound | C-020 |
| 075 | 検証エラー時NG+文言配列をHTTP400、保存例外時NGをHTTP500であること | bound | C-024（400側=主判定。**500側は要実機副観測**=§9-5） |
| 076 | 出荷情報の伝票番号列の更新であること | bound | C-020 (shared) |
| 077 | 非同期保存の対象出荷を特定するキーであること | bound | C-028 (shared・id指定で当該行のみ) |
| 078 | 問い合わせ番号の保存先であること | bound | C-028 (shared) |
| 079 | 登録・更新で対象テーブルを直接保存する（不要な削除は含まない）こと | bound | C-021（行数不変assert） |
| 080 | 半角変換後に文字種と最大長255文字を検証すること | bound | C-024,C-025,C-026,C-027 (shared・040と同集合) |
| 081 | 出荷行を一覧表示する管理画面であること | bound | C-010 (shared) |
| 082 | 出荷を表す台帳であること | bound | C-028 (shared) |
| 083 | 出荷行を含む受注一覧を表示すること | bound | C-010 (shared) |
| 084 | 画面表示データでエラーが表示されず継続できること（前提=一覧で更新） | bound | C-010,C-020 (shared) |
| 085 | 送り状No.欄を現在の保存値を初期値として表示すること | bound | C-012 (shared) |
| 086 | 画面表示データでエラーが表示されず継続できること（前提=編集で保存） | bound | C-040 (shared) |
| 087 | 更新ボタンは初期状態で無効であること | bound | C-060（**BC-DRAFT**） |
| 088 | 4xx/5xx時に応答JSONのmessages配列を改行連結してアラート表示すること | bound | C-061（**BC-DRAFT**・文言/サーバ側はC-024で自立） |
| 089 | 「送り状No.」ラベルとツールチップ付きの1行テキスト欄を表示すること | bound | C-013 (shared) |

`func_scope_check` 判定: 親89/89会計済み・欠落0・理由なし重複0・補完1行は§4.2に実体掲載
（親空・設計書補完・母集合会計外）→ **差分0を本文内で実証可能**。O6は主張しない。

## §9 TBD・要実機・DOC/BC-DRAFT・excluded（正直な分離）

| # | 事項 | 状態 |
|---|---|---|
| 1 | **DOC-DRAFT-1**: 一覧非同期の空文字の帰結 | 設計書md:155「検証エラーとなり保存しない」vs vendor実装＝**Regexは空文字でreturn（skip・RegexValidator.php:33-35）・Lengthはnullのみreturnし空文字は長さ0として検査するがmax=255に違反しない（LengthValidator.php:30-38）**＝違反0件で''保存の読み。**C-022を裁定行として実機確定**→結果に応じ設計書是正またはBC起票 |
| 2 | **DOC-DRAFT-2**: XHRあり+トークン不正の応答 | 設計書md:96,247「NGのJSONをHTTP400」vs ee=AccessDeniedHttpExceptionをthrow（AbstractController.php:258-259・403系）。**要実機**。補完行C-030は短絡評価で確定する非XHR側のみ主張 |
| 3 | **BC-DRAFT（不具合候補#1承継）**: 一覧の出荷行内 入力欄・更新ボタンのマークアップ未配置 | grep実測（`update_tracking_number`/`tracking_number_` の出現=JS行185,219-261のみ・行内マークアップ0件）＋md:79自認。C-060/C-061は仕様どおりの期待で掲載し**実行不能（fixme相当）**。実装配置で解禁。JS実体・サーバ側仕様（PUT契約）は現状でも検証可能=C-011/C-020系で自立 |
| 4 | 一覧側の保存値表示（071の一覧半分・004の入力欄反映） | 入力欄=表示手段が未配置のため一覧側表示は観測不能。**C-014は編集側初期値で同一列参照を自立検証**・一覧側はBC-DRAFT副観測 |
| 5 | 保存例外時のNG500（075後段・md:249） | 決定的な障害注入手段なし＝**要実機副観測**（C-024の主判定=400側で自立）。エラーログ・情報ログ（md:256-260）の観測手段も未整備＝観測外（ログ出力禁止事項md:263-266はE2E観測対象外） |
| 6 | 存在しないid（404）の応答本文形式 | JSON/HTML（フレームワーク既定エラー画面）かは一次資料に規定なし＝**要実機**。C-023の主判定=HTTP404+DB無影響で自立 |
| 7 | 一覧初期表示にSEED出荷行が含まれるか（絞込既定値） | 一覧の既定検索条件は受注一覧機能（本書対象外=md:37）の正。C-010の主判定=行構造（1行1出荷）で自立し、SEED行の可視性は要実機で補強 |
| 8 | 全角ハイフン等の `mb_convert_kana('a')` 個別文字の変換範囲 | 一次資料は「全角英数字→半角英数字」のみ規定（md:133）。C-025は全角英数字（`ＡＢＣ１２３`）に限定し、全角ハイフン・全角スペース等の帰結は**要実機**（断定しない） |
| 9 | 管理画面のenロケール切替口 | 要D15（-EN 5行の実行前提。W0実測を継承） |
| 10 | SEED-M05-13-ORDER/ORDER2の完全行セット（登録POSTが検証成功する完全受注・単一配送） | D5 manifest契約で確定（`@TBD-D5`。本書はセット設計のみ） |
| 11 | manifest_sha1（fixture_version確定） | D5後（現状 `@TBD-D5`） |
| excluded | 012〜015（相関バリ4）＝EX-B | 送り状No.の制約は Length+Regex の単項目のみ（ShippingType.php:197-206・OrderController.php:587-595逐語）・相関constraint不存在・md本文に相関規定なし→対応する検証が実在せず過剰生成（m09-01/m05-16 EX-Bの先例と同型） |
| excluded | 019〜032・034〜036（検索取得系**17**）＝EX-A | 期待テキスト=「検索条件/実行結果の該当レコードが取得結果に含まれる（ない）こと」＝検索取得の主張。本機能正本は検索をスコープ外と明記（md:37逐語「受注一覧の検索・絞り込み・ページング・CSV出力・納品書出力」）・受注検索の実装所在は SearchOrderType.php:190-191（M05-01の正）。m09-01 EX-A（codex承認済み）と同型。**per-IDの実引きは下表**。033は改訂1でboundへ移動（C-029） |

### EX-A 17件の実引き表（改訂1・Major3是正。test_idごとのTSV実引き）

全17行の**操作手順列は同一の生成器定型**（逐語）: 「1. 検索条件〔034-036は「実行結果」〕の対象レコードと前提状態を
用意する / 2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる / 3. 対象テーブルのレコード（区分・件数・
更新値）を確認する」＝**機能固有の操作を指定しない定型**。除外判定は期待テキスト実内容（検索取得の主張）による。
md:37対応=「受注一覧の検索・絞り込み・ページング・CSV出力・納品書出力」は本書対象外（実装または別機能の設計を正とする）。

| test_id | 前提列の項目（ノイズ列・実引き） | 期待結果（逐語） | 除外理由 | 実項目の代替bound先 |
|---|---|---|---|---|
| 019 | 保存単位 | 検索条件の該当レコードが取得結果に含まれること。 | 「検索条件の…取得結果」＝検索取得主張。本機能に検索仕様なし（md:37対象外・M05-01の正） | 保存単位→059/C-028 |
| 020 | 既存値の上書き | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上（否定側=絞込条件の主張。絞込仕様も本機能に不存在） | 上書き→060/C-021 |
| 021 | 送り状No.（受注一覧の出荷行） | 検索条件の該当レコードが取得結果に含まれること。 | 同上 | 一覧経路保存→004,044/C-020 |
| 022 | 送り状No.（受注編集の出荷情報） | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上 | 編集経路保存→006,046/C-040 |
| 023 | 値が空（受注一覧の非同期保存） | 検索条件の該当レコードが取得結果に含まれること。 | 同上 | 空(一覧)→063/C-022（DOC-DRAFT-1裁定） |
| 024 | 値が空（受注編集フォーム） | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上 | 空(編集)→064/C-041 |
| 025 | 全角英数字を入力（受注一覧） | 検索条件の該当レコードが取得結果に含まれること。 | 同上 | 全角(一覧)→065/C-025 |
| 026 | 全角英数字を入力（受注編集フォーム） | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上 | 全角(編集)→066/C-045 |
| 027 | ハイフン以外の記号・空白を含む | 検索条件の該当レコードが取得結果に含まれること。 | 同上 | 記号→067/C-024,C-044 |
| 028 | 最大長を超える | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上 | 最大長超→068/C-027,C-043 |
| 029 | 存在しない出荷識別子（非同期保存） | 検索条件の該当レコードが取得結果に含まれること。 | 同上 | 不存在id→017,069/C-023 |
| 030 | 一覧と編集の一致 | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上 | 一致→071/C-014 |
| 031 | 参照時点 | 検索条件の該当レコードが取得結果に含まれること。 | 同上 | 参照時点→071/C-014・085/C-012 |
| 032 | 最大長の差 | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上 | 段差→072/C-046 |
| 034 | 成功時出力 | 実行結果の該当レコードが取得結果に含まれること。 | 「実行結果の…取得結果」＝同型の検索取得主張（m09-01 EX-Aが019〜036を同一skeletonとして除外した先例と同型） | 成功時出力→074/C-020 |
| 035 | 失敗時出力 | 実行結果の該当レコードが取得結果に含まれること。 | 同上 | 失敗時出力→075/C-024 |
| 036 | 副作用 | 実行結果の該当レコードが取得結果に含まれること。 | 同上 | 副作用（列更新）→076/C-020 |

（参考・境界判定）**033（前提=同時更新・期待=034-036と同skeleton）は除外しない**: 前提列の「同時更新」に対応する
実在仕様（md:172「後勝ち・ロックなし」）が**他のどの母集合行の期待テキストにも現れない**ため、除外すると当該仕様が
検証範囲から欠落する（偽陰性）。期待skeletonの「実行結果の該当レコードが取得結果に含まれる」は後勝ち保存の実行結果
レコードのdb.ts取得で肯定的に観測可能→C-029へbind（codex R1 Blocker是正）。

候補規律: 全行 `@TBD-D5`・O5未確定（D6後に確定検査）・実装/実走なし・O6/聖域/多軸/C6C7を主張しない。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象構文の列挙とclaim別判定（本機能は前提/入力列と期待列の対応ずれ＋2件の設計書/実装矛盾候補が焦点）:

| 対象 | 極性判定 | 判定根拠（一次資料） |
|---|---|---|
| 009（必須エラーあり）vs 010（必須エラーなし） | 必須制約は両経路とも不存在（required:false・NotBlank無し）。009は**一覧経路の空入力拒否規定（md:155）**が肯定側に実在するためC-022へbind（ただしvendor実装と矛盾=DOC-DRAFT-1・実機裁定）。010=編集経路の空許容（md:156）でC-041 | ShippingType.php:197-206／OrderController.php:587-595／md:155-156 |
| 037〜058の「追加/変更される・されない」 | 期待テキスト極性を正としてbind。肯定→C-020/021/025/026/040/042、否定→C-012(表示のみ)/C-024/027/043/044/045 | md:137-138（上書き保存）・155-161（拒否条件） |
| 045（前提=編集を開く→追加されない） | 表示のみでは書き込まない（md:104=初期表示は現保存値）。C-012にDB不変assertを同居させ極性成立 | md:104,170 |
| 047（前提=非管理者・未認証→期待=追加される） | 前提列をシナリオ語として**棄却**（未認証で追加される、と読むと一次資料md:69,226と矛盾する期待を捏造することになる）。期待極性（肯定）のみでC-020へbind | md:69,226 |
| 055（前提=半角変換→変更されない）/056（前提=文字種→変更される） | 前提と期待の対応ずれ。極性を正とし、055=編集経路全角拒否（変換しない経路=md:158）・056=一覧経路変換後保存（md:157）へ振り分け | md:157-158 |
| 016/017（DB相関の両極） | 出荷エンティティ解決（存在→継続/不存在→未検出）が実在するため**除外せずbind**（m09-01 EX-Cとの差=検証実体の実在） | OrderController.php:576-577／md:161 |
| 019〜032・034〜036（検索取得系の両極） | 検索は本機能スコープ外の明記（md:37）＝両極とも検証対象が本機能に不存在→EX-A（極性以前）。偽陰性回避の傍証は§8・per-ID実引きは§9 | md:37／SearchOrderType.php:190-191 |
| 033（前提=同時更新・期待=検索系と同skeleton） | **R1 Blocker検出→bound是正**: 前提列の「同時更新」は実在仕様（後勝ち・ロックなし=md:172,272）で、他行に対応期待が無い→除外は偽陰性。期待skeleton（実行結果レコードの取得）は後勝ち保存結果のdb.ts取得で成立→C-029新設 | md:172,272／OrderController.php:608-612 |
| 063（空文字→エラーで保存しない=否定期待） | 否定期待は設計書に実在（md:155）だがvendor実装が矛盾（RegexValidator.php:33-35）→**棄却も確定bindもせず裁定行C-022**（DOC-DRAFT-1） | md:155／RegexValidator.php:33-35 |
| 088（4xx/5xx→アラート=肯定期待） | JS実体は実在（index.twig:193-201）・UI未配置で発火不能→BC-DRAFT行C-061（仕様どおり期待を保持・実行不能を明示） | index.twig:193-201／md:79,81 |

**codex敵対レビュー実施状況: R1要修正（Blocker1=033のEX-A偽陰性＋Major3=空文字vendor根拠の捏造/SEED値の期待混入/EX-A実引き不足）→改訂1で全件是正・R2再確認待ち**。
R1でBlocker（除外側の偽陰性）を検出・是正した記録がC4-manual運用の実効性証跡を兼ねる（未検出の可能性は残る）。
なお EX-A検索（033除く）/EX-B相関の除外・破壊系SEED隔離・DOC-DRAFT-2の非XHR限定はcodex妥当確認済み（維持）。

---

## 付録: 作業実測（B0係数計測用）

- 読んだ一次資料・参照物: 設計書md 1／ee実ソース 13（OrderController・EditController・ShippingType・OrderType・
  SearchOrderType・Shipping・AbstractController・Constant・index.twig・edit.twig・shipping.twig・default_frame.twig・
  security.yaml）＋eccube.yaml／locale 4（messages ja/en・validators ja/en）＋vendor 3（xlf ja/en・RegexValidator）／
  母集合・台帳 2（all_it_cases・fid_kubun）／統治・見本 3（m05-16草案・m09-01草案・REVIEW_LEDGER）／
  既存実装 4（spec・page・e2e_cases.md・helpers db/oracle）＝**計31ファイル**。
- L1 claim数: **21確定＋2 DOC-DRAFT**（=23行・改訂1でL1-023追加）。候補ケース行33（ja27・EN5・補完1）。file:line claim引用 約75箇所（改訂1でLengthValidator.php:30-38追加＝vendor 4ファイル）。
- 難所（係数悪化要因）: (1) **一覧UI未配置**（BC-DRAFT）とサーバ側仕様（request契約で全数観測可能）の切り分け
  (2) **空文字の設計書/vendor矛盾**（DOC-DRAFT-1）の発見と裁定行方式の設計 (3) **トークン不正のthrow**（DOC-DRAFT-2）
  と非XHR短絡評価の分離 (4) 検索取得系18行の除外判断（m02-01は逆にbound＝機能ごとの実体有無で判定が反転する）
  (5) 2経路×（変換有無・最大長差55）のマトリクス整理と段差ケースC-046の前段PUT依存設計
  (6) 【R1教訓】検索系skeletonの範囲除外に「同時更新」（実在仕様md:172）が紛れた偽陰性＝**範囲除外は
  per-ID実引きが必須**（Major3の実引き表で再発防止）。
- 楽だった点（再利用効果）: L1表・三段参照・choice解決・runFill・隔離lint・§構成・SEED復元規約はW0/W1の型を流用。
  受注編集フォーム・登録ボタン・admin firewallの根拠はm05-16と同一箇所の再確認のみ。既存page.tsのセレクタ導出が有効。

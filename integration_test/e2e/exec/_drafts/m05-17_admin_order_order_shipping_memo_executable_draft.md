# B0候補: m05-17 配達用メモ登録（出荷用メモ欄） — 実行可能グレード候補（母集合82全量踏破）

> 2026-07-24 ／ **候補グレード（candidate・D6前・O5未確定・実装/実走なし）**
> codexレビュー: **R1要修正（Major4・Blockerなし）→改訂1で全数是正（R2再確認待ち）**（`REVIEW_LEDGER.md`と同期）。
> **改訂1（codex R1是正・Major4件）**: (1) DOC-DRAFT-01の削除行数を現物訂正（旧「-10行」→**numstat実測:
> edit.twig全体2追加・8削除／メモブロック自体の削除は7物理行**・削除diffを§9-1補足に逐語掲載）
> (2) BC-DRAFT-01のclearMissing静的連鎖に**Symfony vendor一次根拠を追加**（HttpFoundationRequestHandler.php:107＋
> Form.php:423,494-497・symfony/form v7.4.3） (3) EX-D（059/060/062/063）の不存在証明を強化（出荷編集画面の
> **メール送信UI実在（プレビュー/送信専用・subject/body編集field不存在）**まで実引き=shipping.twig:214-239,327-332＋
> ShippingController.php:233-248） (4) C-032の残存出荷不変期待を固定SEED値比較から**S0スナップショット同値へ是正**。
> codex妥当確認済み（維持）: DOC-01削除決着・メモ所在(shipping.twig)・excluded方向・078二重bind・最大長段差・破壊系隔離。
> source_class=standard-src+design は fid_kubun.tsv（D1・fid_kubun.tsv:261）による**暫定付与**（確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> fixture_version は全て `@TBD-D5`。統治: `integration_test/CONCRETIZATION_ROLLOUT_PLAN.md`（B0）＋
> `integration_test/CONCRETIZATION_FIRST_PLAN.md`（改訂2・三段会計）。
> DoD正典: codex承認済み候補（`REVIEW_LEDGER.md`）。最強参照=m05-16（同型メモ機能）・m05-13（同一出荷テーブル破壊系・S0規律）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m05-17_admin_order_order_shipping_memo_oracle_draft.json`。
> 正式パス `e2e/fixtures/oracle/` 直下には書かない。
> **本機能の最重要発見**: 設計書が規定する「受注編集画面の出荷用メモ欄」は ee 実装に**存在しない**
> （ee コミット `aebc5ff2c6`「出荷メモは不要の為、削除」で edit.twig から意図的に削除・§9-1=DOC-DRAFT-m05-17-01）。
> さらに Form定義（ShippingType.note）は残存したまま widget のみ削除されているため、**受注編集の保存
> （mode=register）が dtb_shipping.note をNULL化する可能性**（Symfony handleRequest の clearMissing 意味論による
> 静的推論・§9-2=BC-DRAFT-m05-17-01・実機裁定行 C-040）。
> **行数集計**: 候補ケース行総数**29**＝bound対応28（ja24＋-EN4）＋補完1。母集合82=bound72＋TBD0＋excluded10。

## §0 版固定

- 設計書正本: `functions/ec-cube-enterprise/m05-17_admin_order_order_shipping_memo.md`（本repo HEAD `017ab3be9aac7d234838ef0fd3132ac9c36923b8` 時点）。
- ee実ソース: `/home/y-saito/Developments/ec-cube-enterprise/` コミット `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51`（W0/W1と同一）。
- vendor翻訳: `vendor/symfony/validator/Resources/translations/validators.{ja,en}.xlf`＝symfony/validator **v7.4.3**（composer.lock実測・W0と同一版）。
- fid_kubun.tsv（D1）: `M05-17｜m05-17_admin_order_order_shipping_memo｜配達用メモ登録機能｜対象｜標準｜standard-src+design`（fid_kubun.tsv:261。
  target_sha256=4a255392…・todo_sha256=5452cf67…＝ファイル冒頭ヘッダ実測。fid_kubun.tsv sha256先頭=44fbf02f1e4c）。
- 母集合: baseline `all_it_cases.tsv`（sha256先頭 `7911f190d273`）M05-17全**82行**（IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-001〜082）。
- **判定原則（W0教訓）**: 観点ラベル・前提条件/入力データ列のシナリオ語は**生成器ノイズ**。bindは各行の
  **「期待結果／レスポンス」実テキスト**で判定し、極性も期待テキストで確認する（§8に全82行の期待要旨併記）。
  本機能の母集合は前提列に設計書の節名が循環転記されており（例: 023 前提「3000文字を超える」×期待「追加されること」、
  025 前提「お届け先を追加」×期待「追加されないこと」）、シナリオ語と期待極性の衝突が多い（§10 C4-manual）。

## §1 L1原子オラクル表

規約: claimは検査可能な期待実値まで分解。quoteは一次資料の逐語。unitは文字数系のみ必須（ee=PostgreSQL/Symfony Length=文字長）。
LS=locale_sensitive（0は理由コード）。**期待値の正は本表のオラクルIDでありSEED値ではない（三段参照）**。
不変性の期待は操作前スナップショット `S0`（db.ts照会値）との同値比較で書く（m05-13教訓・SEED値を期待の正にしない）。

| oracle_id | 観点 | claim（検査可能な期待） | source_class(暫定) | 逐語quote | 根拠(file:line) | unit | LS |
|---|---|---|---|---|---|---|---|
| L1-M0517-001 | auth_rule | 未ログインで出荷編集URL・受注編集URLへアクセスすると、admin firewall（pattern `^/%eccube_admin_route%/`）のform_loginエントリポイントにより**ログイン画面（route `admin_login`）へリダイレクト**され、出荷用メモ欄へ到達しない | 設計書md＋standard-src | 「未ログインまたは権限・IP制限で拒否される利用者｜上記パス（到達前）｜管理画面の共通ルールに従いアクセスできない。」／「未ログイン｜管理画面の共通認証により利用不可｜同左」／`admin:`…`pattern: ['^/%eccube_admin_route%/','^/%eccube_messenger_route%/']`…`form_login:`…`login_path: admin_login` | m05-17md:71,213／security.yaml:40-46 | — | 0 `non-translated` |
| L1-M0517-002 | http_status | 出荷編集の入口=`GET/POST /%eccube_admin_route%/shipping/{id}/edit`（route `admin_shipping_edit`・`{id}`=**受注**の識別子・`\d+`）。出荷用メモ単独の専用URL・専用API・専用バッチは無い（保存は出荷編集フォーム全体の送信＝`mode=register`に同梱） | standard-src＋設計書md | `#[Route(path: '/%eccube_admin_route%/shipping/{id}/edit', name: 'admin_shipping_edit', requirements: ['id' => '\d+'], methods: ['GET', 'POST'])]`／「`{id}`は受注編集系では受注の識別子、出荷編集系では受注の識別子である。」／「出荷用メモ単独の保存ボタン・専用APIは持たない。」 | ShippingController.php:60／m05-17md:69-70,73,128,166 | — | 0 `non-ui-observable` |
| L1-M0517-003 | http_status | 受注編集系の入口=`GET/POST /%eccube_admin_route%/order/new`（`admin_order_new`）・`GET/POST /%eccube_admin_route%/order/{id}/edit`（`admin_order_edit`・id=数値）（DOC-01裁定行 C-040/C-041 の到達根拠） | standard-src＋設計書md | `#[Route(path: '/%eccube_admin_route%/order/new', name: 'admin_order_new', methods: ['GET', 'POST'])]`／`#[Route(path: '/%eccube_admin_route%/order/{id}/edit', name: 'admin_order_edit', requirements: ['id' => '\d+'], methods: ['GET', 'POST'])]` | EditController.php:146-147／m05-17md:66-68 | — | 0 `non-ui-observable` |
| L1-M0517-004 | display_field | 出荷編集画面は出荷ごとにカードを描画し、カード見出し=`admin.order.shipping__card_title` ja「出荷情報」／en "Shipping Info"＋`({{ loop.index }})`（例「出荷情報(1)」）。カード内の出荷用メモブロックはラベル=`admin.order.shop_memo_for_shipped` ja「出荷用メモ欄」／en "Shipping Notes"＋textarea（`form_widget(shippingForm.note, { attr: { rows: 8 }})`＝行数8）＋直下に `form_errors(shippingForm.note)`（エラー描画位置が実在） | standard-src＋設計書md | `<span class="card-title">{{ 'admin.order.shipping__card_title'\|trans }}({{ loop.index }})</span>`／`{{ 'admin.order.shop_memo_for_shipped'\|trans }}`／`{{ form_widget(shippingForm.note, { attr: { rows: 8 }}) }}`／`{{ form_errors(shippingForm.note) }}`／`admin.order.shipping__card_title: 出荷情報`／`admin.order.shop_memo_for_shipped: 出荷用メモ欄`／en `Shipping Info`・`Shipping Notes`／「各出荷ブロックの中に、ラベル『出荷用メモ欄』と複数行入力欄（行数8）を表示する。出荷が複数あるときは出荷ごとに入力欄を表示する。」 | shipping.twig:266,686,689,690／messages.ja.yaml:2554,2553・messages.en.yaml:2391,2390／m05-17md:69,82 | — | 1 |
| L1-M0517-005 | display_field | メモ欄のレイアウト=同一 `.row` 内に `label.col-3.col-form-label`（ラベル）と `div.col`（入力欄）を並べる（ラベルと入力欄を1行に並べる標準フォームレイアウト） | standard-src＋設計書md | `<div class="row mb-3"> <label class="col-3 col-form-label">`…`<div class="col">`…／「管理画面標準のフォームレイアウトに従い、ラベルと入力欄を1行に並べる。」 | shipping.twig:684-691／m05-17md:85 | — | 0 `non-translated` |
| L1-M0517-006 | display_field | 各出荷ブロックのメモ欄初期値=当該出荷の永続化済み `dtb_shipping.note`（DB現行値の恒等表示・出荷ごとに独立）。表示のみではDBは変化しない。表示後に別経路で更新されても表示中の値は自動更新しない | 設計書md＋standard-src | 「各出荷ブロックの出荷用メモ欄に、当該出荷に保存済みのメモが初期値として載る。」／「出荷用メモ欄の表示値は、画面を開いた時点で出荷に保存済みのメモである。表示後に別経路で出荷が更新されても表示中の値は自動更新しない。」／`->add('shippings', CollectionType::class, [ 'entry_type' => ShippingType::class, 'data' => $TargetShippings,`… | m05-17md:109,157／ShippingController.php:88-95 | — | 0 `data-passthrough` |
| L1-M0517-007 | validation_rule | メモは**任意**（`required => false`・NotBlank不在・constraintsは**Lengthのみ**＝文字種・形式・相関・DB相関の検証は不存在）。未入力でも保存でき、既存メモを空へ更新することも可 | standard-src＋設計書md | `->add('note', TextareaType::class, [ 'required' => false, 'constraints' => [ new Assert\Length(max: $this->eccubeConfig['eccube_ltext_len']), ], ])`（NotBlank不在）／「出荷用メモ欄は任意項目。未入力のまま保存すると保存先列はNULL相当となる。」／「textarea（複数行）。任意項目でNotBlankは課さない。Length上限3000文字」 | ShippingType.php:207-212／m05-17md:129,205 | — | 0 `non-translated` |
| L1-M0517-008 | validation_rule | メモのForm層最大長=**3000文字**（`Assert\Length(max: eccube_ltext_len)`・`eccube_ltext_len: 3000`）。3000受理・3001拒否 | standard-src＋設計書md | `new Assert\Length(max: $this->eccubeConfig['eccube_ltext_len']),`／`eccube_ltext_len: 3000`／「最大長3000は受注・出荷編集フォームのLength上限であり、`app/config/eccube/packages/eccube.yaml`の`eccube_ltext_len`（確認値3000）を用いる。」 | ShippingType.php:210／eccube.yaml:114／m05-17md:135-139 | **文字** | 0 `non-translated`（超過文言はL1-009・LS=1） |
| L1-M0517-009 | message | Length超過時のエラー文言（Symfony既定カタログ・choice形式・v7.4.3）。原文=`This value is too long. It should have {{ limit }} character or less.\|…characters or less.`。**解決後の期待実値**: ja「長すぎます。この値は3000文字以下で入力してください。」／en "This value is too long. It should have 3000 characters or less."。**表示位置は立証済み**=欄直下 `form_errors(shippingForm.note)`（shipping.twig:690。m05-16のedit.twigと異なりnoteのエラー描画箇所がテンプレートに実在） | standard-src（vendor翻訳）＋設計書md | choice原文＋ja/en target（trans-unit id=19）／「出荷用メモが3000文字を超える｜フォームのLength検証で違反となり、保存しない。同一画面にエラーを表示する。」／「上限超過時は該当項目にエラーを表示し保存しない。」 | validators.ja.xlf:78-79・validators.en.xlf:78-79／shipping.twig:690／m05-17md:146,205,239 | — | 1 |
| L1-M0517-010 | db_effect | 保存先 `dtb_shipping.note`＝STRING **4000文字**・NULL許容。Form3000<DB4000の段差1000文字＝実効上限はForm側で決まる | standard-src＋設計書md | `#[ORM\Column(name: 'note', type: Types::STRING, length: 4000, nullable: true)] private ?string $note = null;`／「`dtb_shipping.note` は文字列型・桁4000・NULL許容（ec-cube-enterprise 実装確認値）であり、フォーム側の最大長（`eccube_ltext_len` 確認値3000文字）の方が小さいため、保存可能な実効上限はフォーム側で決まる。」 | Shipping.php:120-121／m05-17md:45,139,187 | **文字** | 0 `non-ui-observable` |
| L1-M0517-011 | db_effect | Form受理されたメモ入力値は**そのまま**（textarea複数行入力＝改行含む）対応する出荷の `dtb_shipping.note` へ保存される（恒等写像。フォームキー `note`＝`form[shippings][{N}][note]`） | 設計書md＋standard-src | 「`dtb_shipping.note`（フォームキー `note`、複数行入力textarea）。…受注編集または出荷編集の保存に同梱して保存。」／「textareaによる複数行入力。」／「入力｜受注編集画面または出荷編集画面のフォーム送信に含まれる出荷用メモ欄の文字列。」 | m05-17md:135-137,83,174／ShippingType.php:207 | 文字 | 0 `data-passthrough` |
| L1-M0517-012 | message | 保存成功（`mode=register` かつ購入フロー検証エラーなし）時: flush後に **Infoフラッシュ** `admin.order.shipping_save_message` ja「出荷に関わる情報が変更されました。送料の変更が必要な場合は、受注管理より手動で変更してください。」／en "Shipping related information has been changed. If the shipping charge also changes, please update it from 'Orders' manually." ＋ **Successフラッシュ** `admin.common.save_complete` ja「保存しました」／en "Saved" を積み、`admin_shipping_edit`（同一受注の出荷編集画面）へ**リダイレクト** | standard-src＋設計書md | `if (!$flowResult->hasError() && $request->get('mode') == 'register')`…`$this->entityManager->flush();`／`$this->addInfo('admin.order.shipping_save_message', 'admin');`／`$this->addSuccess('admin.common.save_complete', 'admin');`／`return $this->redirectToRoute('admin_shipping_edit', ['id' => $Order->getId()]);`／「保存に成功した場合、出荷登録の情報フラッシュと保存完了フラッシュを積み、出荷編集画面へリダイレクトする。」 | ShippingController.php:177,193,195,196,199／messages.ja.yaml:2465,1591・messages.en.yaml:2309,1636／m05-17md:116,175,228 | — | 1 |
| L1-M0517-013 | status_transition | フォーム検証失敗（Length超過等で `isValid()` false）時: 保存分岐へ入らず同一出荷編集画面を再描画し、入力値とエラーを表示する。出荷用メモは保存されない（DB不変） | standard-src＋設計書md | `if ($form->isSubmitted() && $form->isValid()) {`（false時は保存処理全体をスキップしテンプレート再描画）／「検証または保存に失敗した場合、エラーフラッシュを積み、同一画面を再描画する。出荷用メモは保存しない。」／「失敗時出力｜検証失敗時は同一画面を再描画し、入力値とエラーを表示する。出荷用メモは保存しない。」／「出荷編集画面で検証失敗｜同一出荷編集画面」 | ShippingController.php:119／m05-17md:117,176,229-230,239-240 | — | 0 `non-ui-observable` |
| L1-M0517-014 | db_effect | 保存単位=**出荷ごとにメモ1つ**（`dtb_shipping` の当該出荷行の `note` 列のみ更新。1受注に複数出荷があれば出荷の数だけ独立。保存操作で行の追加・削除は発生しない=不要な削除は含まない） | 設計書md＋standard-src | 「出荷用メモは出荷ごとに1つ持つ。1受注に複数の出荷があれば、出荷の数だけ独立してメモを持つ。」／「登録/更新｜dtb_shipping｜当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。」／`->add('shippings', CollectionType::class,`… | m05-17md:125,197,187-189／ShippingController.php:88 | — | 0 `non-ui-observable` |
| L1-M0517-015 | db_effect | メモを空のまま保存（未入力・全消去とも）→保存先列は**NULL相当**となりエラーにならない | 設計書md＋standard-src | 「出荷用メモを空のまま保存｜保存先列はNULL相当となる。エラーにはならない。」／`'required' => false`（NotBlank不在＝L1-007） | m05-17md:145,129／ShippingType.php:207-212 | — | 0 `non-ui-observable` |
| L1-M0517-016 | db_effect | 新規出荷（お届け先追加で作られた `id` 未採番の出荷）の保存時は `create_date`/`update_date` が手動設定されて永続化される | standard-src＋設計書md | `if (null === $TargetShipping->getId()) { $TargetShipping->setCreateDate(new \DateTime()); $TargetShipping->setUpdateDate(new \DateTime()); }`…`$this->entityManager->persist($TargetShipping);`／「新規の出荷は作成日時・更新日時を設定する。」 | ShippingController.php:186-191／m05-17md:115,177 | — | 0 `non-ui-observable` |
| L1-M0517-017 | db_effect | お届け先削除で登録すると、削除された出荷行とそれに紐づく明細が削除され、その出荷の出荷用メモも保持されない（行ごと消滅）。**UI上の前提**=出荷が2件以上のときのみ削除ボタンが表示され、当該出荷に明細が残っていると削除不可のモーダル（`admin.order.delete_shipping_error__confirm_title`）が出る＝明細を先に削除してから出荷を削除する | standard-src＋設計書md | `if (false === $TargetShippings->contains($OriginShipping)) {`…`$this->entityManager->remove($OriginOrderItem);`…`$this->entityManager->remove($OriginShipping);`／`{% if form.shippings\|length > 1 %}`…`{% if shippingForm.OrderItems\|length > 0 %}`（エラーモーダル）`{% else %}`（確認モーダル＋`.delete-shipping`）／「出荷編集画面でお届け先を削除｜削除対象の出荷は明細とともに削除され、その出荷の出荷用メモも保持されない。」 | ShippingController.php:121-131／shipping.twig:270,279,304／m05-17md:149 | — | 0 `non-ui-observable` |
| L1-M0517-018 | display_field | お届け先追加: `#addShipping` 押下→JSが `#form_add_shipping` に "1" を入れてフォーム送信→PRE_SUBMITリスナが空の出荷ブロックを追加して再描画→**追加ブロックの出荷用メモ欄は空**で表示される（登録時に当該出荷へ保存される=L1-011,016） | standard-src＋設計書md | `$('#addShipping').on('click', function() { $('#form_add_shipping').val("1"); $("#form1").submit();`／`if ($data['add_shipping']) { $Shippings = $data['shippings']; $newShipping = ['Delivery' => '']; $Shippings[] = $newShipping;`／「出荷編集画面でお届け先を追加｜追加された出荷の出荷用メモ欄は空で表示され、登録時に当該出荷へ保存される。」 | shipping.twig:146-148,701／ShippingController.php:103-113／m05-17md:148 | — | 0 `data-passthrough` |
| L1-M0517-019 | auth_rule | ログイン済み管理者（受注管理を許可）は出荷編集画面で出荷ごとにメモを表示・編集・保存できる（メモ欄単独の権限制御なし＝出荷編集画面の認可に従う） | 設計書md | 「ログイン済み管理者（受注管理を許可）｜…｜出荷ごとに表示・編集・保存できる」／「出荷用メモ欄に独立した権限は持たず、受注編集画面・出荷編集画面それぞれの認可に従う。」 | m05-17md:214,217 | — | 0 `non-translated` |
| L1-M0517-020 | auth_rule | ログイン済みだが権限マスタで当該パス（`/shipping`）が拒否された管理者は、AuthorityVoterのdeny判定（`^/{adminRoute}{denyUrl}` 前方一致）により出荷編集画面へ到達できず、メモも変更されない（拒否時の具体的な表示画面・HTTPステータスは要実機副観測=§9-5） | standard-src＋設計書md | `$AuthorityRoles = $this->authorityRoleRepository->findBy(['Authority' => $Member->getAuthority()]);`…`$denyUrl = str_replace('/', '\/', $AuthorityRole->getDenyUrl()); if (preg_match("/^(\/{$adminRoute}{$denyUrl})/i", (string) $path)) { return VoterInterface::ACCESS_DENIED; }`／「ログイン済みだが権限マスタで当該パスが拒否｜受注編集画面に到達できず利用不可｜出荷編集画面に到達できず利用不可」 | AuthorityVoter.php:52-67／m05-17md:215 | — | 0 `non-translated` |
| L1-M0517-021 | db_effect | 同一出荷を複数の管理者（セッション）が編集した場合は**最後に保存された内容が残る**（後勝ち）。メモ単独の楽観・悲観ロックは持たない（Shippingエンティティに `#[ORM\Version]` 列は不存在=grep実測0件） | 設計書md＋standard-src | 「同一出荷を複数の管理者が同時に編集した場合、最後に保存された内容が残る。出荷用メモ単独の楽観ロックは持たない。」／「出荷用メモ欄に固有の楽観ロック・悲観ロックは持たない。同一出荷を同時に編集した場合は最後に保存された内容が残る。」 | m05-17md:160,291／Shipping.php（ORM\Version 0件・grep実測） | — | 0 `non-ui-observable` |
| L1-M0517-022 | db_effect | CSV項目「配達用メモ」= `dtb_csv` 上の受注CSV（csv_type_id=3=CSV_TYPE_ORDER）と出荷CSV（csv_type_id=4=CSV_TYPE_SHIPPING）の行（entity_name=`Eccube\Entity\Shipping`・field_name=`note`・disp_name=`配達用メモ`・sort_no=70・enabled=True）＝出荷用メモを保存する列に対するCSV項目の表示名。CSV出力の実値確認は別機能（CSV出力）の実行を要するため副観測（§9-6） | standard-src＋設計書md | `INSERT INTO dtb_csv (csv_type_id, …) VALUES (3, NULL,'Eccube\\\\Entity\\\\Shipping', 'note', NULL,'配達用メモ', 70, True, NOW(), NOW());`／`VALUES (4,NULL,'Eccube\\\\Entity\\\\Shipping', 'note',NULL,'配達用メモ',70, True,NOW(),NOW());`／`public const CSV_TYPE_ORDER = 3;`・`public const CSV_TYPE_SHIPPING = 4;`／「配達用メモ｜出荷用メモを保存する列に対するCSV項目の表示名。CSVマスタ上の項目名が『配達用メモ』となっている。」／「保存した出荷用メモは出荷用CSV・受注用CSVの項目『配達用メモ』として出力で参照できる。」 | Version20260224000000.php:209・Version20260226000001.php:232／CsvType.php:42,47／m05-17md:55,130,159 | — | 0 `non-ui-observable` |
| L1-M0517-023 | display_field | 出荷用メモ欄に固有のJavaScriptイベント・非同期取得・表示切替・入力補助・文字数カウンタは無い。メモ欄はモーダル・ポップアップ・トースト・確認ダイアログを表示しない（shipping.twig:681-692のメモブロックにJS属性・data-bs-toggle等の付与なし。登録ボタン `#btn_save` はtype=submitでdata-action属性なし＝確認ダイアログ介在なし。widget付与属性は `rows: 8` のみ＝maxlength属性なし〔twig根拠・実DOMは要実機副観測=§9-4〕） | 設計書md＋standard-src | 「出荷用メモ欄に固有のJavaScriptイベント、非同期取得、表示切替、入力補助は持たない。」／「出荷用メモ欄はモーダル、ポップアップ、トースト、確認ダイアログを表示しない。ラベルのツールチップのみ表示する。」（※ツールチップ記述は受注編集欄に紐づきee不存在=§9-1）／`{{ form_widget(shippingForm.note, { attr: { rows: 8 }}) }}` | m05-17md:84,86／shipping.twig:681-692,724 | — | 0 `non-translated` |
| L1-M0517-024 | display_field(**乖離確定**) | **受注編集画面（`/order/{id}/edit`・`/order/new`）に出荷用メモ欄は描画されない**（ee準拠期待）。根拠: edit.twigに `form.Shipping.note`・`shop_memo_for_shipped`・`tooltip.order.shipping_info.shop_memo` とも**0件（grep実測）**・フォームは生タグ `<form name="form1"…>` で `form_rest`/`form_end` 不在＝未描画childの自動出力なし・eeコミット `aebc5ff2c6`（2026-06-19「[不具合修正] 出荷かなの必須を解除 / 出荷メモは不要の為、削除」）で当該ブロック（ラベル+widget+errors+tooltip）を**意図的に削除**。設計書md（受注編集画面のメモ欄表示・編集・同梱保存の全記述）との乖離=**DOC-DRAFT-m05-17-01**（§9-1）。複数お届け先時の受注編集画面はee上も表示のみ＋「お届け先を編集」導線（設計書md:147と一致） | standard-src（設計書mdは乖離側） | 削除diff逐語: `- <label …title="{{ 'tooltip.order.shipping_info.shop_memo'\|trans }}">{{ 'admin.order.shop_memo_for_shipped'\|trans }}…` `- {{ form_widget(form.Shipping.note) }}` `- {{ form_errors(form.Shipping.note) }}`／`{% if Order.isMultiple %}`（表示のみ分岐）／`<form name="form1" id="form1" method="post" action="?">` | commit aebc5ff2c6（numstat実測: edit.twig **2追加・8削除**〔うち**メモブロック削除=7物理行**=@@ -1765,13 +1766,6・他はかな必須バッジ除去1行置換＋無関係TODOコメント追加1行〕・ShippingType.php 0追加5削除〔かなNotBlank解除〕。削除diff逐語=§9-1補足）／edit.twig:789,1594,1601,1641-1783,1954（Shipping系widgetはname〜tracking_numberのみ・note不在）／m05-17md:66,81,83,96,101,126,128,147 | — | 0 `non-translated` |
| L1-M0517-025 | **実機裁定（BC-DRAFT-m05-17-01）** | 受注編集画面（出荷1件）の保存（`mode=register`）後に当該出荷の `dtb_shipping.note` がどうなるかは**確定期待とせず実機裁定**。設計書期待=メモを含む出荷情報が受注の保存に同梱されて保存される（md:68。ただし欄が無いため入力は不可能）／ee静的連鎖（**各段はvendor一次根拠で立証・連鎖の帰結のみ実機裁定**）=①OrderTypeのShipping埋込フォーム（POST_SET_DATAで単一配送時に追加）に `note` childが**残存**（ShippingType.php:207）・widgetのみ削除→POSTに `order[Shipping][note]` が含まれない ②Symfony POST handlerは `submit($data, 'PATCH' !== $method)`＝POSTでは**clearMissing=true** ③`Form::submit()` はclearMissing=trueのとき**欠落childを `null` でsubmit**→**note=null→保存時にNULL化**の可能性。真なら受注編集での保存操作が配達用メモを消す実バグ | standard-src＋vendor（symfony/form v7.4.3・帰結の断定はしない） | `$builder->addEventListener(FormEvents::POST_SET_DATA, $this->addShippingForm(...));`／`$form->add('Shipping', ShippingType::class,`…／`$form->submit($data, 'PATCH' !== $method);`／`public function submit(mixed $submittedData, bool $clearMissing = true): static`／`$isSubmitted = \array_key_exists($name, $submittedData); if ($isSubmitted || $clearMissing) { $child->submit($isSubmitted ? $submittedData[$name] : null, $clearMissing); }` | OrderType.php:328,443-458／ShippingType.php:207-212／EditController.php:545,754／vendor/symfony/form/Extension/HttpFoundation/HttpFoundationRequestHandler.php:107／vendor/symfony/form/Form.php:423,494-497（composer.lock: symfony/form v7.4.3） | — | — |
| L1-M0517-026 | status_transition | 受注編集画面で登録（`mode=register`）に成功すると同一受注の編集画面（`/order/{id}/edit`）へリダイレクトする（C-040の裁定手順の確定部分） | standard-src＋設計書md | `return $this->redirectToRoute('admin_order_edit', ['id' => $TargetOrder->getId()]);`／「受注編集画面で登録に成功｜受注編集画面（同一受注）」 | EditController.php:754／m05-17md:225 | — | 0 `non-translated` |
| L1-M0517-027 | validation_rule | 出荷編集フォームの他項目必須の実在根拠=氏名（`name` NameType）は `required => false`（HTML5必須属性なし→空値がサーバ層まで到達）だが NotBlank制約あり。空で送信するとサーバ検証エラー ja「入力されていません。」／en "No value found." が表示され、フォーム全体が検証失敗となりメモも保存されない（=L1-013） | standard-src | `->add('name', NameType::class, [ 'required' => false, 'options' => [ 'constraints' => [ new Assert\NotBlank(), ], ], ])`／`This value should not be blank.: 入力されていません。`／`This value should not be blank.: No value found.` | ShippingType.php:74-80／validators.ja.yaml:17・validators.en.yaml:17 | — | 1 |

## §2 SEED三段参照設計（★破壊的更新系）

三段参照: `L1恒等写像claim（passthrough_basis=m05-17md:135-137入力項目表・157整合表） → fixture_version（SEEDセットID@manifest_sha1） → 実値`。
固定値は**入力の再現手段**であり期待値の正にしない（不変性の期待は操作前スナップショットS0との同値比較=m05-13教訓）。全て `@TBD-D5`。
**配達用メモ保存は dtb_shipping.note の破壊的更新**のため、保存・追加・削除系は**使い捨て専用SEED出荷に限定**し、
**各ケース実行後（afterEach）にSEED再適用（UPSERTべき等）で同値へ復元**する。共有SEED（SEED-M05-ORDERS等）は書込対象にしない。

| SEEDセットID | 目的 | 固定値（設計） | 後始末 |
|---|---|---|---|
| SEED-M01-ADMIN | 管理者ログイン | W0/W1と共通（管理画面ログイン可能なmember・受注管理許可） | 不変 |
| SEED-M05-17-ORDER | 単一出荷の表示・保存・境界・同時更新系 | `dtb_order` 1件: id=900051701（帯@TBD-D5）・**単一お届け先（isMultiple=false）**・**出荷編集の登録POST（mode=register）が購入フロー検証を通過する完全受注**（必須FK: order_status/payment等・明細1件以上）＋`dtb_shipping` 1件: id=900051711・**note=`M0517出荷メモ`**・name01等の必須項目充足。受注はNOT NULL/FK関連行が多く**行セットの完全定義はD5 manifest契約で確定**（ここではセット設計のみ・捏造しない） | UPSERTべき等・**保存系ケース後にafterEachで同値へ再適用（note復元を含む）** |
| SEED-M05-17-ORDER2 | 空メモ（NULL）初期表示・空のまま登録 | 同型の完全受注1件: id=900051702・`dtb_shipping` id=900051712・**note=NULL** | 再適用 |
| SEED-M05-17-ORDER3 | 複数出荷（出荷ごと独立・追加・削除系） | 同型の完全受注1件: id=900051703・**複数お届け先（isMultiple=true）**・`dtb_shipping` 2件: id=900051713（note=`M0517メモA`）・id=900051714（note=`M0517メモB`）・**各出荷に明細あり**（削除系は明細を先に削除するUI前提=L1-017） | 再適用（**削除・追加ケース後は行セットごと再構築**） |
| SEED-M05-17-DENY | 権限マスタ拒否 | 管理member 1件: id=900051721（ログイン可）＋当該memberのAuthorityに `dtb_authority_role` 1行: deny_url=`/shipping`（@TBD-D5。受注管理の他パスは不干渉の帯で設計） | 不変（読み取りのみ） |

- 対象行の一意特定は**固定id**で決定的。保存系は新規行を作らない（例外=C-031お届け先追加: 追加行は `order_id=900051703` で特定し、afterEachのSEED再構築で除去）。
- **S0規律**: 「保存されない/変更されない/不変」の期待は、操作前に db.ts で取得したスナップショット（例 `S0=SELECT note FROM dtb_shipping WHERE id=900051711`）との同値比較で書く。SEED投入値リテラルは前提・復元にのみ使う。

## §3 画面項目マトリクス（任意/最大長/文字種/所在）

三値比較: 設計書md（入力項目表:135-139）／ee Form（ShippingType.php）／ee DB（Shipping.php）。本機能の画面項目は
出荷用メモ欄1項目（他項目は出荷編集M05-11系の正。ただし他項目検証失敗の実在根拠として name のみ§1 L1-027で確定）。

| 項目 | 任意/必須 | 最大文字数（Form層/DB層・unit=文字） | 文字種 | 所在（**本機能の要点**） | 境界3種 | メッセージ（ja/en・L1参照） |
|---|---|---|---|---|---|---|
| 出荷用メモ欄（note） | **任意**（md:129,205「NotBlankは課さない」=ShippingType.php:208 `required=>false`・NotBlank不在=L1-007。空登録・空へ更新とも可・NULL相当=L1-015） | **Form 3000**（ShippingType.php:210＋eccube.yaml:114）**／DB 4000**（Shipping.php:120）→**段差1000文字**: 3001..4000字はFormで拒否されDBに到達しない。maxlength属性なし（L1-023・twig根拠）のため3001字入力はブラウザで可能 | **制約なし**（constraintsはLengthのみ=L1-007。文字種・形式・相関・DB相関の検証は不存在→§9-EX 012-017の除外根拠） | **出荷編集画面（`/shipping/{id}/edit`）の各出荷ブロックのみ**（shipping.twig:686-690・見出し「出荷情報(N)」）。**受注編集画面には無い**（ee準拠=L1-024。設計書md:66,81,126,128の受注編集側記述はDOC-DRAFT-m05-17-01=§9-1。commit aebc5ff2c6 で意図的削除） | `runFill(3000,mixed,"E2E-<runid>-")`受理＋**DB char_length=3000**（文字長意味論）／`runFill(3001,ascii,"E2E-<runid>-")`拒否・S0同値（DB不変）／1字受理（最小系。最小長制約は不存在=L1-007） | 超過: L1-009（欄直下 form_errors・表示位置立証済み）／必須メッセージ: **なし**（必須制約が不存在のため=L1-007） |
| （参照）氏名 name01/name02 | 必須（NotBlank=L1-027。**他項目検証失敗の誘発手段**としてのみ使用） | —（本機能スコープ外=md:35） | — | 出荷編集の各出荷ブロック | 空のみ使用 | 空: L1-027「入力されていません。」/"No value found." |

## §4 実行可能グレード14列TSV（候補・**自己完結＝全29行を実体掲載**）

記法: 期待結果セルは三段参照 `…実値… [L1:<oracle_id>; fixture:<SEEDセットID>@TBD-D5]`。
`%eccube_admin_route%` は環境値（既定 `admin`）。ORDER=受注900051701/出荷900051711・ORDER2=受注900051702/出荷900051712・
ORDER3=受注900051703/出荷900051713,900051714。
メモ欄セレクタ=`#form_shippings_{N}_note`（導出: root form名`form`=JS `#form_add_shipping` shipping.twig:147実測＋collection `shippings`=ShippingController.php:88＋field `note`=ShippingType.php:207。JS傍証 `formIdPrefix='#form_shippings_'+no+'_OrderItems_'` shipping.twig:30。**実DOM idは要実機副観測=§9-4**）。
登録操作=「`#btn_save`（`button[name="mode"][value="register"]`・shipping.twig:724）押下」。en行はD15前提。
不変性期待の `S0` は操作前に db.ts で取得したスナップショット値（§2）。

### §4.1 bound対応候補行（28行=ja24＋-EN4。§8の82対応表が参照する全行）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m05-17_admin_order_order_shipping_memo	E2E-M0517C-001	IT-15	権限	P1	未ログインで出荷編集URL直接アクセス→ログイン画面へリダイレクト	未ログイン／SEED-M05-17-ORDER	—	1. db.tsで S0=SELECT note FROM dtb_shipping WHERE id=900051711 2. GET /%eccube_admin_route%/shipping/900051701/edit 3. db.tsで再照会	admin_login のログイン画面へリダイレクトされ出荷編集画面（メモ欄）へ到達しない・dtb_shipping.note=S0（不変） [L1:L1-M0517-001,L1-M0517-002; fixture:SEED-M05-17-ORDER@TBD-D5]				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-010	IT-25	表示	P1	出荷編集画面（単一出荷）にメモ欄が表示される（ja・見出し/ラベル/textarea/エラー位置）	ログイン済(SEED-M01-ADMIN)／SEED-M05-17-ORDER	—	1. GET /shipping/900051701/edit 2. 出荷ブロックの span.card-title（shipping.twig:266）・メモブロックのlabel（:686）・textarea（:689）とrows属性・form_errors描画位置（:690）を読む	お届け先（出荷）を編集する画面が開き、見出し「出荷情報(1)」のブロック内にラベル「出荷用メモ欄」と複数行入力欄（textarea `#form_shippings_0_note`・rows=8）が表示され、欄直下にエラー描画位置が実在する（エラー表示なし=画面表示データで処理継続） [L1:L1-M0517-004,L1-M0517-019,L1-M0517-002; fixture:SEED-M05-17-ORDER@TBD-D5]				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-010-EN	IT-25	表示	P2	見出し・ラベル（en）	ログイン済／SEED-M05-17-ORDER／locale=en	—	1. en UIで出荷編集画面を開く 2. 見出しとラベルを読む	見出し "Shipping Info(1)"・ラベル "Shipping Notes" [L1:L1-M0517-004]				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-011	IT-25	表示	P1	複数出荷の受注では出荷ごとにメモ欄が表示され各初期値が独立	ログイン済／SEED-M05-17-ORDER3	—	1. GET /shipping/900051703/edit 2. 出荷ブロック数と各ブロックの見出し（出荷情報(1)/(2)）を読む 3. #form_shippings_0_note と #form_shippings_1_note の値を読む 4. db.tsで両出荷のnoteを照会	受注に紐づく各出荷のブロックに出荷用メモ欄が出荷ごとに表示され（ラベル「出荷用メモ欄」・rows=8）、各欄の初期値=各出荷の dtb_shipping.note（恒等・db.ts照会値と一致・出荷ごとに独立） [L1:L1-M0517-004,L1-M0517-006,L1-M0517-014; fixture:SEED-M05-17-ORDER3@TBD-D5]				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-012	IT-25	初期表示	P1	初期表示が永続化済みdtb_shipping.noteと一致（恒等・表示のみでDB不変）	ログイン済／SEED-M05-17-ORDER	—	1. db.tsで S0=SELECT note FROM dtb_shipping WHERE id=900051711 2. GET /shipping/900051701/edit 3. #form_shippings_0_note の値を読む 4. db.tsで再照会	欄の初期値=S0（画面を開いた時点で出荷に保存済みのメモ・DB現行値との恒等表示）・表示後の再照会もS0と同値（表示のみではDBが変化しない）・エラー表示なし [L1:L1-M0517-006; fixture:SEED-M05-17-ORDER@TBD-D5]				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-013	IT-12	レイアウト	P2	ラベルと入力欄が同一行（標準フォームレイアウト）	ログイン済／SEED-M05-17-ORDER	—	1. 出荷編集画面でメモブロックの構造（.row 内の label.col-3.col-form-label と div.col・shipping.twig:684-691）を読む	ラベル（label.col-3.col-form-label）と入力欄（div.col 内 textarea）が同一 .row 内に並ぶ（1行配置） [L1:L1-M0517-005; fixture:SEED-M05-17-ORDER@TBD-D5]				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-014	IT-22	JS挙動	P2	メモ欄に固有JS（非同期保存・入力補助・カウンタ）が無い	ログイン済／SEED-M05-17-ORDER	#form_shippings_0_note へ `E2E-<runid>-js` を入力（送信しない）	1. 出荷編集画面で入力し、ネットワーク監視で保存系リクエストが発生しないことを確認 2. メモブロック内に文字数カウンタ等の入力補助要素が無いことを確認 3. （要実機副観測）textareaのmaxlength属性有無を記録	【主判定】入力のみでは保存リクエストが発生しない（非同期保存・非同期取得なし）＋メモブロック内に入力補助・カウンタ要素がない [L1:L1-M0517-023]。【要実機副観測】maxlength属性の不在はtwig根拠のみ（shipping.twig:689 attr=rows:8）＝確定期待にしない・実DOM確認=§9-4				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-015	IT-12	モーダル	P3	メモ欄はモーダル・トースト・確認ダイアログを表示しない	ログイン済／SEED-M05-17-ORDER	#form_shippings_0_note=`E2E-<runid>-nodialog`	1. 出荷編集画面でメモブロック内のmodal/dialog/トースト要素有無を確認 2. メモ変更して #btn_save 押下時にダイアログ介在なく送信されることを確認（実行後SEED再適用）	メモブロック内に modal/dialog/トースト要素が存在せず、登録は確認ダイアログなしで送信される（#btn_save はtype=submit・data-action属性なし） [L1:L1-M0517-023; fixture:SEED-M05-17-ORDER@TBD-D5]				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-020	IT-26	保存	P1	メモを入力して登録→成功フラッシュ2種・出荷編集画面へリダイレクト・DB反映（ja）	ログイン済／SEED-M05-17-ORDER	form[shippings][0][note]=`E2E-<runid>-配達メモ更新`（他項目は既存値のまま）	1. /shipping/900051701/edit で #form_shippings_0_note を書き換え 2. #btn_save（button[name="mode"][value="register"]・shipping.twig:724）押下 3. 遷移先URLとフラッシュを読む 4. db.tsで SELECT note FROM dtb_shipping WHERE id=900051711（実行後SEED再適用）	「保存しました」（Success）と「出荷に関わる情報が変更されました。送料の変更が必要な場合は、受注管理より手動で変更してください。」（Info）が表示され /shipping/900051701/edit へリダイレクト＋dtb_shipping.note=入力値と完全一致（フォーム送信に含まれるメモ文字列の恒等保存・dtb_shipping.noteの更新） [L1:L1-M0517-012,L1-M0517-011,L1-M0517-002; fixture:SEED-M05-17-ORDER@TBD-D5]				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-020-EN	IT-26	保存	P2	保存成功フラッシュ（en）	ログイン済／SEED-M05-17-ORDER／locale=en	同上	同上	"Saved" と "Shipping related information has been changed. If the shipping charge also changes, please update it from 'Orders' manually." が表示される [L1:L1-M0517-012]				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-021	IT-22	任意	P1	メモ未入力（空・NULL初期値）のまま登録→必須エラーなしで保存成功	ログイン済／SEED-M05-17-ORDER2(note=NULL)	note=空のまま（他項目は既存値）	1. /shipping/900051702/edit で #form_shippings_0_note が空表示であることを確認 2. 空のまま #btn_save 押下 3. フラッシュ・遷移を確認 4. db.tsで COALESCE(note,'') 照会	空の出荷用メモ欄が表示され、必須エラーが表示されず「保存しました」＋出荷編集画面へ＋dtb_shipping.note が空（NULL相当）のまま（任意項目・エラーにならない） [L1:L1-M0517-007,L1-M0517-015,L1-M0517-012; fixture:SEED-M05-17-ORDER2@TBD-D5]				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-022	IT-26	更新	P1	既存メモを空へ更新→保存先列がNULL相当となる	ログイン済／SEED-M05-17-ORDER(note=`M0517出荷メモ`)	note=空（全消去）	1. /shipping/900051701/edit で #form_shippings_0_note を空にして登録 2. db.tsで COALESCE(note,'') 照会（実行後SEED再適用）	保存成功＋dtb_shipping.note が空（COALESCE(note,'')=''・NULL相当） [L1:L1-M0517-007,L1-M0517-015,L1-M0517-011; fixture:SEED-M05-17-ORDER@TBD-D5]				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-023	IT-26	境界	P2	1字メモが保存される（最小系・最小長制約なし）	ログイン済／SEED-M05-17-ORDER	note=`あ`（1字）	1. メモを1字にして登録 2. db.tsで note と char_length(note) 照会（実行後SEED再適用）	保存成功＋dtb_shipping.note=`あ`・文字長1（最小長制約は存在しない） [L1:L1-M0517-008,L1-M0517-011,L1-M0517-007; fixture:SEED-M05-17-ORDER@TBD-D5]				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-024	IT-26	境界	P1	3000字(mixed)が受理されDB文字長=3000（文字長意味論）	ログイン済／SEED-M05-17-ORDER	note=runFill(3000,mixed,"E2E-<runid>-")（UTF-8バイト長>3000）	1. メモを3000字にして登録 2. フラッシュ確認 3. db.tsで char_length(note) 照会（実行後SEED再適用）	保存成功（「保存しました」）＋DB文字長=3000（バイト長でなく文字長で判定・Form3000/DB4000段差の受理側） [L1:L1-M0517-008,L1-M0517-010,L1-M0517-011; fixture:SEED-M05-17-ORDER@TBD-D5]				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-025	IT-22	境界	P1	3001字はForm層で拒否→欄直下にエラー・同一画面再描画・入力値保持・DB不変（ja）	ログイン済／SEED-M05-17-ORDER	note=runFill(3001,ascii,"E2E-<runid>-")	1. db.tsで S0=note照会 2. メモを3001字にして #btn_save 押下（twig上maxlength付与なし=L1-023。実DOMで付与が確認された場合の入力手段は§9-4に従う） 3. 同一画面再描画・成功フラッシュ無し・#form_shippings_0_note 直下のエラー文言・入力値の再表示を確認 4. db.tsで再照会	同一出荷編集画面を再描画し、欄直下（form_errors・shipping.twig:690）に「長すぎます。この値は3000文字以下で入力してください。」・入力値は再表示・成功フラッシュ無し・dtb_shipping.note=S0（操作前スナップショットと同値=保存されない。Form3000/DB4000段差の拒否側） [L1:L1-M0517-008,L1-M0517-009,L1-M0517-013; fixture:SEED-M05-17-ORDER@TBD-D5]				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-025-EN	IT-22	境界	P2	3001字拒否メッセージ（en・文言確定行）	ログイン済／SEED-M05-17-ORDER／locale=en	同上	同上	欄直下に "This value is too long. It should have 3000 characters or less."（choice複数側・実行D15前提。主判定=保存不成立/S0同値はC-025と同一） [L1:L1-M0517-009]				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-026	IT-26	改行	P1	複数行（改行含む）メモが入力どおり保存される（恒等）	ログイン済／SEED-M05-17-ORDER	note=`E2E-<runid>-1行目\n2行目\n3行目`	1. 複数行メモを入力し登録 2. db.tsで note照会（実行後SEED再適用）	保存成功＋dtb_shipping.note が改行（LF）を含め入力値と完全一致（textarea複数行入力の恒等保存） [L1:L1-M0517-011; fixture:SEED-M05-17-ORDER@TBD-D5]				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-027	IT-22	他項目必須	P1	他項目（氏名）空の検証失敗で出荷が保存されずメモも保存されない	ログイン済／SEED-M05-17-ORDER	#form_shippings_0_name_name01=空・note=`E2E-<runid>-notsaved`	1. db.tsで S0=note照会 2. 出荷編集画面で氏名を空・メモを新値にして #btn_save 押下（nameはrequired:false=HTML5必須属性なし→サーバ層到達=L1-027） 3. 応答画面のエラー文言と編集画面滞留を確認 4. db.tsで再照会	同一出荷編集画面を再描画・氏名欄に「入力されていません。」（必須バリデーションエラー表示・処理は完了しない）・dtb_shipping.note=S0（操作前スナップショットと同値=フォーム全体の検証失敗でメモも保存されない） [L1:L1-M0517-027,L1-M0517-013; fixture:SEED-M05-17-ORDER@TBD-D5]				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-027-EN	IT-22	他項目必須	P2	他項目必須エラー文言（en）	ログイン済／SEED-M05-17-ORDER／locale=en	同上	同上	"No value found."（氏名欄・実行D15前提） [L1:L1-M0517-027]				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-028	IT-23	保存単位	P1	保存は出荷単位・当該出荷行のnote列のみ更新（行の追加・削除なし）	ログイン済／SEED-M05-17-ORDER3	#form_shippings_0_note=`E2E-<runid>-unit`（出荷Aのみ変更・Bは触らない）	1. db.tsで S13=note(id=900051713)・S14=note(id=900051714)・N1=COUNT(*) FROM dtb_shipping WHERE order_id=900051703 を照会 2. /shipping/900051703/edit で出荷Aのメモのみ変更し登録 3. db.tsで両行のnoteと N2=COUNT(*) を再照会（実行後SEED再適用）	900051713のnote=入力値へ更新・900051714のnote=S14（同値=不変）・N1=N2（行の追加・削除なし=直接保存・不要な削除は含まない。出荷ごとにメモ1つの実証） [L1:L1-M0517-014,L1-M0517-011; fixture:SEED-M05-17-ORDER3@TBD-D5]				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-029	IT-26	出荷ごと保存	P1	複数出荷のメモを同時に編集→1回の登録で各出荷へ独立に保存	ログイン済／SEED-M05-17-ORDER3	#form_shippings_0_note=`E2E-<runid>-A`・#form_shippings_1_note=`E2E-<runid>-B`	1. /shipping/900051703/edit で両ブロックのメモを変更 2. #btn_save 押下 3. フラッシュ・リダイレクト確認 4. db.tsで両行のnoteを同一クエリで照会（実行後SEED再適用）	検証成功で各出荷の出荷用メモを含む出荷情報が保存され（「保存しました」＋出荷編集画面へ）、dtb_shipping.note が 900051713=`E2E-<runid>-A`・900051714=`E2E-<runid>-B`（出荷ごとに表示・編集・保存できる） [L1:L1-M0517-014,L1-M0517-012,L1-M0517-011,L1-M0517-019; fixture:SEED-M05-17-ORDER3@TBD-D5]				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-030	IT-26	同時更新	P2	同一出荷への複数管理セッションの保存は後勝ち・ロックなし	ログイン済×2管理セッション（A/B・いずれもSEED-M01-ADMIN）／SEED-M05-17-ORDER	A: note=`E2E-<runid>-CCA`／B: note=`E2E-<runid>-CCB`	1. セッションA・Bそれぞれで /shipping/900051701/edit を開く（同一出荷を同時に編集中の状態） 2. A→B の順で連続して登録（真の同時実行は非決定的のため順序を確定して後勝ち意味論を観測） 3. 両応答を読む 4. db.tsで note照会（実行後SEED再適用）	両登録とも保存成功（ロックを取らない=ロック競合エラーにならない）＋dtb_shipping.note=`E2E-<runid>-CCB`（最後に保存された内容が残る=後勝ち。Aの値は残らない） [L1:L1-M0517-021,L1-M0517-012; fixture:SEED-M05-17-ORDER@TBD-D5]				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-031	IT-26	お届け先追加	P1	お届け先追加→新ブロックのメモ欄は空表示→登録で新出荷行にメモ保存・タイムスタンプ設定	ログイン済／SEED-M05-17-ORDER3	追加ブロック: 必須項目（氏名・住所・電話・配送業者等）を入力・明細1件を新ブロックへ追加・note=`E2E-<runid>-added`	1. /shipping/900051703/edit で #addShipping（shipping.twig:701）押下→#form_add_shipping="1" でフォーム再送信され新出荷ブロックが追加表示される 2. 追加ブロックの #form_shippings_2_note が空であることを確認 3. 追加ブロックの必須項目と明細・メモを入力し #btn_save 押下（購入フロー検証の通過条件はD5 SEED契約＝§9-7） 4. db.tsで order_id=900051703 の新出荷行（id≠900051713,900051714）の note・create_date・update_date を照会（実行後SEED行セット再構築）	追加された出荷の出荷用メモ欄は空で表示され、登録後に新しい dtb_shipping 行が追加されて note=入力値・create_date/update_date が設定される（登録内容の対象レコードが追加される） [L1:L1-M0517-018,L1-M0517-016,L1-M0517-011; fixture:SEED-M05-17-ORDER3@TBD-D5]				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-032	IT-05	お届け先削除	P1	お届け先削除→出荷行が削除されメモも保持されない（残存出荷はS0同値）	ログイン済／SEED-M05-17-ORDER3（出荷2件・各明細あり）	削除対象=出荷B（id=900051714）	1. db.tsで操作前スナップショットを取得: S0_A=SELECT note FROM dtb_shipping WHERE id=900051713・削除対象行の存在（id=900051714の行とそのnote）・N1=COUNT(*) FROM dtb_shipping WHERE order_id=900051703 2. /shipping/900051703/edit で出荷Bブロックの明細を先に削除（明細ありでは削除不可のモーダル=L1-017のUI前提） 3. 「出荷情報を削除」→確認モーダル（「出荷情報は注文から削除されます。…」）で削除（.delete-shipping・shipping.twig:304） 4. #btn_save 押下 5. db.tsで id=900051714 の行有無・note(id=900051713)・N2=COUNT(*) を再照会（実行後SEED行セット再構築）	削除対象の出荷行（dtb_shipping id=900051714）が**不存在**となり（対象レコードが削除状態・明細とともに削除）、その出荷の出荷用メモ（note）も保持されない・残る出荷 900051713 の note=S0_A（操作前スナップショットと同値=不変）・N2=N1-1（削除は対象1行のみ） [L1:L1-M0517-017,L1-M0517-014; fixture:SEED-M05-17-ORDER3@TBD-D5]				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-033	IT-12	CSV項目	P1	CSV項目「配達用メモ」がdtb_shipping.noteのCSV表示名である（受注CSV/出荷CSVマスタ）	ログイン済（db.ts照会は認証不要）／マスタ=マイグレーション適用済みDB	—	1. db.tsで SELECT csv_type_id, entity_name, field_name, disp_name, enabled FROM dtb_csv WHERE entity_name LIKE '%Shipping' AND field_name='note' 2. （要実機副観測）保存済みメモを持つ出荷を含む出荷用CSVを出力し「配達用メモ」列の値を確認	csv_type_id=3（受注CSV）と4（出荷CSV）の両方に entity=Eccube\Entity\Shipping・field_name=note・disp_name=`配達用メモ`・enabled=True の行が存在する（=出荷用メモを保存する列に対するCSV項目の表示名）。【要実機副観測】CSV出力実値（出力時点の保存済みメモが「配達用メモ」列に出る）はCSV出力機能（別機能）実行を要する=§9-6 [L1:L1-M0517-022]				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-034	IT-15	権限拒否	P1	権限マスタで/shipping拒否の管理者は出荷編集画面に到達できない	ログイン済（SEED-M05-17-DENY・deny_url=/shipping）／SEED-M05-17-ORDER	—	1. db.tsで S0=note(id=900051711)照会 2. DENY memberでログイン 3. GET /%eccube_admin_route%/shipping/900051701/edit 4. db.tsで再照会	出荷編集画面に到達できず利用不可（AuthorityVoterのACCESS_DENIEDによりアクセス拒否・出荷編集画面のフォームは表示されない）・dtb_shipping.note=S0（変更されない）。【要実機副観測】拒否時の具体表示（403エラーページ等）=§9-5 [L1:L1-M0517-020; fixture:SEED-M05-17-DENY@TBD-D5,SEED-M05-17-ORDER@TBD-D5]				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-040	IT-25	受注編集裁定	P1	【DOC/BC裁定行】受注編集画面（出荷1件）に出荷用メモ欄が描画されない（ee準拠）＋登録後のnote挙動を実機裁定	ログイン済／SEED-M05-17-ORDER	（登録時）他項目は既存値のまま	1. db.tsで S0=note(id=900051711)照会 2. GET /order/900051701/edit（受注編集画面が開く=単一お届け先受注の編集画面） 3. 画面内の「出荷用メモ欄」ラベル・#order_Shipping_note 相当のtextarea有無を確認 4. GET /order/new でも同様に確認 5. /order/900051701/edit で button[name="mode"][value="register"]（edit.twig:1927）押下 6. 遷移先URLを確認 7. db.tsで note再照会（実行後SEED再適用）	【主判定・ee準拠】受注編集画面・受注新規登録画面の出荷情報ブロックに出荷用メモ欄（ラベル「出荷用メモ欄」・textarea）は**描画されない**（edit.twigにform.Shipping.note/shop_memo_for_shipped 0件・commit aebc5ff2c6 で意図的削除=DOC-DRAFT-m05-17-01。設計書md:66,81,126,128の受注編集側規定と乖離）＋登録成功時 /order/900051701/edit へリダイレクト [L1:L1-M0517-024,L1-M0517-026,L1-M0517-003; fixture:SEED-M05-17-ORDER@TBD-D5]。【実機裁定・確定期待とせずBC-DRAFT-m05-17-01】手順5-7で dtb_shipping.note が S0のまま維持されるか **NULL化されるか** を記録し裁定する（設計書期待=同梱保存で維持／ee静的推論=Form残存+widget不在→clearMissingでNULL化の可能性）。結果で設計書側またはee側の是正を§9-2に記録 [L1:L1-M0517-025]				
m05-17_admin_order_order_shipping_memo	E2E-M0517C-041	IT-25	複数時受注編集	P2	複数お届け先の受注編集画面は出荷表示のみ・メモ欄なし・出荷編集への導線	ログイン済／SEED-M05-17-ORDER3	—	1. GET /order/900051703/edit 2. 出荷情報カード（edit.twig:1594）の isMultiple 分岐表示（:1601）を読む 3. メモ欄（textarea）が無いこと・「お届け先を編集」導線（admin_shipping_edit へのリンク）を確認	複数お届け先の受注編集画面では出荷は表示のみ（各出荷の氏名・住所等の一覧）で出荷用メモ欄を表示せず、出荷編集画面（admin_shipping_edit）への導線が表示される（当画面からは出荷用メモを編集しない=設計書md:147とee実装が一致する側） [L1:L1-M0517-024,L1-M0517-003; fixture:SEED-M05-17-ORDER3@TBD-D5]				
```

### §4.2 補完行（1行。**親test_idなし・母集合会計に算入しない**。理由=設計書補完〔md:71,213は受注編集系URLの未ログイン到達不可も規定するが、母集合82行の期待テキストに受注編集側の到達不可が存在しない。出荷編集側の到達不可=078はC-001/C-034でbound済み〕）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m05-17_admin_order_order_shipping_memo	E2E-M0517C-002	IT-15	権限	P1	未ログインで受注編集/新規URL直接アクセス→ログイン画面へリダイレクト	未ログイン／SEED-M05-17-ORDER	—	1. GET /%eccube_admin_route%/order/900051701/edit 2. GET /%eccube_admin_route%/order/new	いずれも admin_login のログイン画面へリダイレクトされる [L1:L1-M0517-001,L1-M0517-003]（補完行・親test_idなし・設計書補完）				
```

その他の設計書規定のうち母集合の期待テキストに現れない観測（例: ログ出力md:255）は今回補完対象にしない
（補完は親空会計外・必要性が生じたら追補）。検証失敗時の入力値再表示は母集合072が明示要求するため
C-025本体に含む（補完不要）。

## §5 locale対応表

LS=1 claim: **L1-004・L1-009・L1-012・L1-027 の4claim → -EN 4行**（C-010-EN／C-025-EN／C-020-EN／C-027-EN。
全行§4.1に実体掲載・文言はen一次資料逐語＝ja翻訳ゼロ）。
- messages.en.yaml:2391 `Shipping Info`・2390 `Shipping Notes`／1636 `Saved`・2309 shipping_save_message／
  validators.en.yaml:17 `No value found.`／validators.en.xlf:78-79（choice解決→"3000 characters"複数側）。
- **保留（claim単位・理由明記）**: なし（本機能のLS=1 claimは4件とも文言確定=4/4=100%）。
  `tooltip.order.shipping_info.shop_memo`（ja:3618／en:3232）は文言実在だが**参照テンプレート0件**（受注編集欄の
  削除に伴い表示箇所なし=§9-1）のためツールチップ観測ケースは作らない（母集合にも該当期待行なし）。
- -EN行の実行前提はD15（管理画面のen切替口なし＝W0実測を継承）。文言確定は本書で完了。

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

- page: 既存 `e2e/pages/admin/m05/m05_17_admin_order_order_shipping_memo.page.ts` は部分再利用可
  （gotoShippingEdit・#btn_save・保存フラッシュ等）。ただし同ファイルの受注編集系セレクタ
  （`#order_Shipping_note`・edit.twig:1769-1772等の行番号注記）は**旧版edit.twig前提で現eeでは不存在**
  （commit aebc5ff2c6 で削除済み=L1-024）。本書§1の実測行番号が正。
- spec: 候補の追加ケースspecは**未実装・実走なし**。期待値は `o("L1-M0517-xxx")`（L1解決器）経由・
  リテラル直書き禁止。db.ts（`e2e/helpers/db.ts`）でDB層照会（note・char_length・COUNT・create/update_date・dtb_csv）。
  境界値は `runFill(n, repertoire, prefix)`。不変性はS0スナップショット同値（§2）。
- 直接POSTのrequest契約は**本機能では使わない**: 出荷編集フォームはshippingsコレクション＋OrderItems
  コレクション＋CSRFを含む巨大フォームで直接POST契約の再現コストが高く、必須/Length検証は
  `required:false`（HTML5素通し）のため**UI経由でサーバ層観測が可能**（L1-027根拠）。全ケースUI+db.tsで完結する。
- 破壊系の後始末: 保存系=afterEachでSEED再適用（UPSERT）・追加/削除系（C-031/C-032）=SEED行セット再構築（§2）。

**_drafts/隔離lintの実施証跡（実測・実施済み）**:
1. 正式消費側（`e2e/helpers/oracle.ts`・`e2e/helpers/db.ts`・spec・pages）に草案を消費する `_drafts` 参照は
   **0件**（隔離ガード自体のリテラル〔oracle.ts:17-19・grep実測〕を除く。ガードは `_drafts`・パス区切り・`..` を
   含む fileKey の解決をthrowで拒否する機械強制＝消費参照ではない）。
2. 正式パス `e2e/fixtures/oracle/` 直下に本機能のjsonは**作成していない**（草案は `_drafts/` のみ。
   既存正式物 `m09_01_oracle.json` は未変更）。
3. 本md・oracle草案jsonの出力先はともに `_drafts/` 配下のみ。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

| ケース群 | 実行区分（候補） | 観測層 | 備考 |
|---|---|---|---|
| C-001,002 | Playwright | GUI/HTTP+DB | 認証リダイレクト・S0不変 |
| C-010,011,012,013,041（＋EN） | Playwright | GUI(+DB照会) | 表示・初期値恒等・レイアウト |
| C-014,015 | Playwright | GUI+network | 非同期保存なし監視。maxlength実DOMは要実機 |
| C-020,021,022,023,024,025,026,027,028,029,030（＋EN） | Playwright+手動確認→**db.ts実装後Playwright単独へ降格候補** | GUI+DB | 使い捨てSEED出荷の破壊系。afterEach SEED再適用・S0規律 |
| C-031,032 | Playwright+手動確認 | GUI+DB | 追加/削除=行セット再構築。購入フロー通過条件はD5契約（§9-7） |
| C-033 | 非UI（db.ts）＋要実機副観測（CSV出力実値） | DB | dtb_csvマスタ照会が主判定 |
| C-034 | Playwright | GUI/HTTP+DB | 権限拒否。拒否時表示の詳細=要実機（§9-5） |
| C-040 | Playwright+手動確認 | GUI+DB | **DOC/BC裁定行**（主判定=メモ欄不在＋リダイレクト・裁定=note維持/NULL化） |
| -EN 4行 | 実行保留（D15） | GUI | 文言確定100%・実行のみ保留 |

聖域判定・多軸属性の正式付与はD14 v2合格後（本表は暫定・正式会計に使わない）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（§0判定原則。前提/入力列のシナリオ語はノイズ）。
1候補ケース行=1 assertion bundle・多対一は `shared-observation`・-EN行は対応ja行と同一親のlocale多重。
**参照先の全候補行は§4に実体掲載済み＝82↔候補の期待テキスト突合が本文内で完結する**。

### 集計（82 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **72** | 下表 |
| **TBD** | **0** | — |
| **excluded** | **10** | EX-B 相関バリ4（012〜015）／EX-C DB相関2（016〜017）／EX-D 件名・本文4（059,060,062,063）。per-ID実引き根拠=§9-EX |
| 合計 | **82** | 欠落0・理由なし重複0 |

- 候補ケース行総数**29**（§4.1 bound対応28＝ja24＋-EN4／§4.2 補完1）。
- **極性・ノイズ処理の明示**（C4-manual対象=§10）: 前提列は設計書節名の循環転記であり期待列と大規模に不一致
  （例: 023 前提「3000文字超」×期待「追加される」→シナリオ語を棄却し3000字受理C-024へ／025 前提「お届け先追加」×
  期待「追加されない」→極性を正とし拒否系C-025へ）。009（必須エラーあり）は**メモ自体に必須制約が不存在**
  （L1-007）だが、期待テキストは**同一フォームの他項目必須（氏名NotBlank=L1-027）で成立**するためC-027へbind
  （除外しない=偽陰性回避）。受注編集側の期待（005/007/018/045/046/057/067等）は**ee実装に欄が無い**（L1-024）ため
  excludedにせず**DOC/BC裁定行C-040へbind**（実在要求の除外禁止・裁定はC-040の実機記録で行う）。

### 82対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 出荷情報ブロックに置かれる入力欄であること | bound | C-010 |
| 002 | 出荷用メモを保存する列に対するCSV項目の表示名であること | bound | C-033 |
| 003 | 単一のお届け先を持つ受注を編集する画面であること | bound | C-040 (shared) |
| 004 | お届け先（出荷）を編集する画面であること | bound | C-010 (shared) |
| 005 | 出荷1件の受注では出荷情報ブロックにメモ欄表示・保存済みメモ初期表示 | bound | C-040（**DOC-01裁定**: ee期待=受注編集に欄なし。出荷編集側の同観測はC-010/C-012） |
| 006 | 出荷情報ブロックに空の出荷用メモ欄が表示される | bound | C-021,C-031 (shared・受注新規側の解釈はC-040 DOC-01) |
| 007 | 検証成功で出荷用メモを含む出荷情報が受注の保存に同梱されて保存される | bound | C-040（**BC-1裁定**） |
| 008 | 各出荷のブロックにメモ欄が出荷ごとに表示・保存済みメモ初期表示 | bound | C-011 |
| 009 | 必須バリでエラー表示・対象処理が完了しない | bound | C-027（他項目必須=L1-027。メモ自体は必須なし=L1-007） |
| 010 | 必須バリでエラー表示されず継続できる | bound | C-021 |
| 011 | 見出し「出荷情報」の中にラベル「出荷用メモ欄」と複数行入力欄 | bound | C-010 (shared・見出しは出荷編集の「出荷情報(N)」=L1-004。受注編集側解釈はDOC-01) |
| 012〜015 | 相関バリでエラー表示/なし | **excluded** EX-B | — |
| 016〜017 | DB相関バリでエラーなし/あり | **excluded** EX-C | — |
| 018 | 受注編集画面では受注の保存に同梱して保存する | bound | C-040（DOC-01/BC-1裁定） |
| 019 | 対象レコードが追加されること | bound | C-020 (shared) |
| 020 | 追加され**ない**こと | bound | C-025 (shared・前提「CSV出力での参照」はノイズ) |
| 021 | 追加されること | bound | C-020,C-024 (shared) |
| 022 | 保存先列はNULL相当となること | bound | C-021,C-022 |
| 023 | 追加されること（前提「3000文字超」はノイズ=採ると一次資料と矛盾） | bound | C-024（3000字受理・§10） |
| 024 | 追加されること | bound | C-020 (shared) |
| 025 | 追加され**ない**こと（前提「お届け先追加」はノイズ・極性でbind） | bound | C-025,C-027 (shared) |
| 026 | 追加されること（前提「お届け先削除」はノイズ・極性でbind） | bound | C-031 (shared・新出荷行の追加) |
| 027 | 追加され**ない**こと | bound | C-025 (shared) |
| 028 | 追加されること | bound | C-020 (shared) |
| 029 | 実行結果の対象レコードが追加されること | bound | C-020,C-031 (shared) |
| 030 | 同一出荷を複数管理者が同時編集→最後に保存された内容が残る | bound | C-030 |
| 031 | 更新内容の値が変更されること | bound | C-020 (shared) |
| 032 | 値が変更され**ない**こと | bound | C-025 (shared) |
| 033 | 値が変更されること | bound | C-020,C-026 (shared・改行含む恒等更新も実証) |
| 034 | dtb_shipping.noteの更新であること | bound | C-020（db.ts照会） |
| 035 | 値が変更されること | bound | C-020,C-026 (shared) |
| 036 | 値が変更されること | bound | C-024 (shared) |
| 037 | 値が変更され**ない**こと | bound | C-025 (shared) |
| 038 | 値が変更されること | bound | C-023 (shared) |
| 039 | 値が変更され**ない**こと（前提=権限マスタ拒否） | bound | C-034（拒否でDB不変・S0同値） |
| 040 | 値が変更されること | bound | C-020 (shared) |
| 041 | 実行結果の値が変更されること | bound | C-020 (shared) |
| 042 | CSV項目の表示名であること | bound | C-033 (shared) |
| 043 | 単一のお届け先を持つ受注を編集する画面であること | bound | C-040 (shared) |
| 044 | お届け先（出荷）を編集する画面であること | bound | C-010 (shared) |
| 045 | 出荷1件の受注ではメモ欄表示・初期表示 | bound | C-040（DOC-01裁定・shared） |
| 046 | 出荷情報ブロックに空のメモ欄表示 | bound | C-021,C-031 (shared・受注新規側はC-040 DOC-01) |
| 047 | 削除条件の対象レコードが削除状態にならないこと | bound | C-028（保存で行の削除なし=N1=N2） |
| 048 | 対象レコードが削除状態になること | bound | C-032 |
| 049 | 検証成功で各出荷の出荷用メモを含む出荷情報が保存される | bound | C-029 |
| 050 | 対象レコードが削除状態になること（前提=未ログインはノイズ） | bound | C-032 (shared) |
| 051 | 見出し「出荷情報」内にラベルと複数行入力欄 | bound | C-010 (shared) |
| 052 | 各出荷ブロックにラベルと複数行入力欄（行数8） | bound | C-011,C-010 (shared) |
| 053 | 固有のJSイベント・非同期取得・表示切替・入力補助なし | bound | C-014 |
| 054 | 標準フォームレイアウト・ラベルと入力欄を1行に並べる | bound | C-013 |
| 055 | モーダル・ポップアップ・トースト・確認ダイアログを表示しない | bound | C-015 |
| 056 | 出荷用メモは出荷ごとに1つ持つこと | bound | C-028,C-029 (shared) |
| 057 | 複数お届け先でない場合のみ受注編集画面で先頭出荷のメモを編集できる | bound | C-040,C-041（DOC-01裁定: 単一側=ee上編集不可・複数側の非表示はC-041で一致） |
| 058 | 出荷用メモ欄は任意項目であること | bound | C-021 (shared) |
| 059〜060 | 件名でエラー表示/なし | **excluded** EX-D | — |
| 061 | 保存先列はNULL相当となること | bound | C-021,C-022 (shared) |
| 062〜063 | 本文でエラー表示/なし | **excluded** EX-D | — |
| 064 | 追加出荷のメモ欄は空表示・登録時に当該出荷へ保存 | bound | C-031 |
| 065 | 削除出荷は明細とともに削除されメモも保持されない | bound | C-032 (shared) |
| 066 | 表示値は画面を開いた時点で保存済みのメモ | bound | C-012 |
| 067 | 両画面のどちらから編集しても同じ保存先列を更新 | bound | C-040（DOC-01/BC-1裁定: 受注編集経路がee不存在） |
| 068 | 出荷用CSV「配達用メモ」列は出力時点の保存済みメモを出力 | bound | C-033（主判定=dtb_csvマッピング・出力実値=要実機副観測） |
| 069 | 同時編集は最後に保存された内容が残る | bound | C-030 (shared) |
| 070 | フォーム送信に含まれる出荷用メモ欄の文字列であること | bound | C-020 (shared) |
| 071 | 検証成功時保存＋保存完了フラッシュ＋再表示/リダイレクト | bound | C-020 (shared) |
| 072 | 検証失敗時は同一画面再描画・入力値とエラー表示 | bound | C-025 |
| 073 | dtb_shipping.noteの更新であること | bound | C-020 (shared) |
| 074 | 画面表示データでエラーなく継続できる | bound | C-010,C-012 (shared) |
| 075 | 登録・更新で対象テーブルを直接保存（不要な削除は含まない） | bound | C-028 (shared) |
| 076 | 画面表示データでエラーなく継続できる | bound | C-012 (shared) |
| 077 | 出荷ごとに表示・編集・保存できること | bound | C-029,C-011 (shared) |
| 078 | 出荷編集画面に到達できず利用不可であること | bound | C-034,C-001 (shared・未ログイン=md:213/権限拒否=md:215の両principalで同一到達不可観測) |
| 079 | 受注編集画面（同一受注）であること | bound | C-040（登録成功リダイレクト=L1-026） |
| 080 | 出荷情報ブロックに置かれる入力欄であること | bound | C-010 (shared) |
| 081 | CSV項目の表示名であること | bound | C-033 (shared) |
| 082 | 単一のお届け先を持つ受注を編集する画面であること | bound | C-040 (shared) |

`func_scope_check` 判定: 親82/82会計済み・欠落0・理由なし重複0・補完1行は§4.2に実体掲載
（親空・設計書補完・母集合会計外）→ **差分0を本文内で実証可能**。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

| # | 事項 | 状態 |
|---|---|---|
| 1 | **DOC-DRAFT-m05-17-01**: 受注編集画面の出荷用メモ欄 | **設計書とeeの乖離確定（静的）**: 設計書md:66,81,83,96,101,126,128,135,146,158,214,225の受注編集側記述に対し、ee edit.twigは `form.Shipping.note`・`shop_memo_for_shipped`・tooltipキーとも0件（grep実測）・form_rest/form_end不在・**commit `aebc5ff2c6`（2026-06-19「出荷メモは不要の為、削除」）で意図的削除**（numstat実測: edit.twig全体**2追加・8削除**・うち**メモブロック削除=7物理行**〔@@ -1765,13 +1766,6〕・残りはかな必須バッジ除去1行置換＋無関係TODO追加1行・ShippingType.php 0追加5削除。**削除diff逐語=§9-1補足**）。標準機能の正典=ee（md:13,45）のため候補期待はee準拠（C-040/C-041主判定）。設計書の是正候補として `BUG_CANDIDATE_REGISTER.md` 系へcodex承認時に転記（乖離種別=設計書過剰記述/実装意図変更）。実機確認（C-040手順2-4）で最終確定 |
| 2 | **BC-DRAFT-m05-17-01**: 受注編集の保存で `dtb_shipping.note` がNULL化される可能性 | **要実機（C-040裁定手順5-7）**: 静的連鎖の各段は一次根拠で立証済み=①note child残存（ShippingType.php:207-212）×widget削除（§9-1）→POSTにnote不在 ②POSTはclearMissing=true（`$form->submit($data, 'PATCH' !== $method);`＝vendor/symfony/form/Extension/HttpFoundation/HttpFoundationRequestHandler.php:107） ③clearMissing=trueは欠落childを`null`でsubmit（`if ($isSubmitted \|\| $clearMissing) { $child->submit($isSubmitted ? $submittedData[$name] : null, $clearMissing); }`＝vendor/symfony/form/Form.php:423,494-497・symfony/form v7.4.3）。**帰結（実際にNULL化するか＝transformer/empty_data/保存経路の合成結果）のみ実機裁定**。真なら受注編集の保存操作が配達用メモを消す実バグ（m05-13 C-040等「受注編集で登録」を行う他機能ケースにも波及）。確定期待にしない（§4 C-040は主判定と裁定を分離） |
| 3 | ツールチップ `tooltip.order.shipping_info.shop_memo` | 文言はlocaleに実在（ja:3618／en:3232・設計書md:81の文言と一致）だが**参照テンプレート0件**（grep実測・受注編集欄削除に伴う）。表示箇所が無いため観測ケースなし（母集合に該当期待行もなし）。DOC-01の付帯事実として記録 |
| 4 | `#form_shippings_{N}_note` の実DOM id・maxlength属性不在 | id はroot form名`form`（JS `#form_add_shipping`=shipping.twig:147実測）＋Symfony命名規約からの導出＋JS傍証（formIdPrefix=shipping.twig:30）。**実DOMでの最終確認=要実機**（C-010副観測）。maxlength不在もtwig根拠のみ（C-014/C-025の前提・付与が確認された場合は3001字入力手段をDOM属性除去またはrequest層で代替） |
| 5 | 権限拒否時の具体表示 | ACCESS_DENIED後の応答（403エラーページの見た目・HTTPステータス・リダイレクト有無）は一次資料に逐語なし=**要実機副観測**（C-034主判定は「出荷編集画面のフォームが表示されない＋DB不変」で自立） |
| 6 | CSV出力実値 | C-033主判定はdtb_csvマスタ行（migration逐語根拠）。**出力ファイル内の「配達用メモ」列実値はCSV出力機能（別機能=md:37対象外宣言）の実行を要する**ため要実機副観測（実装waveでm05-04系と共同検証） |
| 7 | SEED完全行セット・購入フロー通過条件 | 完全受注（NOT NULL/FK・明細・支払）・お届け先追加登録が purchaseFlow validate/prepare/commit を通過する条件は**D5 manifest契約で確定**（`@TBD-D5`。本書はセット設計のみ・捏造しない）。C-031は特に依存が強い（明細移動・必須入力） |
| 8 | 管理画面のenロケール切替口 | 要D15（-EN 4行の実行前提。W0実測を継承） |
| 9 | manifest_sha1（fixture_version確定） | D5後（現状 `@TBD-D5`） |
| 10 | `admin.flash.register_failed`（出荷保存例外時のエラーフラッシュキー） | ShippingController.php:202で使用されるがlocale ja/enに**キー定義なし**（grep実測）＝例外経路でキー生文字列が出る可能性。ただし例外の決定的誘発手段がなく母集合にも該当期待行がないためケース化しない（記録のみ） |

### §9-1補足: DOC-DRAFT-m05-17-01 の削除diff逐語（`git show aebc5ff2c6 -- src/Eccube/Resource/template/admin/Order/edit.twig` 実測・メモブロック削除hunk=7物理行）

```diff
@@ -1765,13 +1766,6 @@ tr.last_border{
                                                     {{ form_errors(form.Shipping.tracking_number) }}
                                                 </div>
                                             </div>
-                                            <div class="row mb-3">
-                                                <label class="col-3 col-form-label" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.order.shipping_info.shop_memo'|trans }}">{{ 'admin.order.shop_memo_for_shipped'|trans }}<i class="fa fa-question-circle fa-lg ms-1"></i></label>
-                                                <div class="col">
-                                                    {{ form_widget(form.Shipping.note) }}
-                                                    {{ form_errors(form.Shipping.note) }}
-                                                </div>
-                                            </div>
                                         </div>
                                     </div>
                                 {% endif %}
```

（同コミットの他変更=かな必須バッジ除去の1行置換〔@@ -1631,7 +1632,7〕・無関係TODOコメント追加1行〔@@ -1050,6 +1050,7〕・
ShippingType.phpのかなNotBlank解除5行削除。numstat: `0 5 ShippingType.php`／`2 8 edit.twig`）

### §9-EX excluded per-ID表（全10件・一次資料実引き・偽陰性なしの根拠）

| test_id | 期待テキスト（逐語） | 除外根拠（一次資料実引き） | 偽陰性でない傍証 |
|---|---|---|---|
| 012 | 相関バリデーションでエラーが表示され、対象処理が完了しないこと。 | noteの制約は `Assert\Length` **1件のみ**（ShippingType.php:207-212逐語＝NotBlank/Callback/Expression等の相関constraint不存在）。設計書バリデーション表（md:203-205）もLength上限のみ規定し相関の規定なし | 検証失敗系の実在要求は072/009/020等としてC-025/C-027でbound済み（拒否観測は除外していない） |
| 013 | 相関バリデーションでエラーが表示されず、対象処理を継続できること。 | 同上（相関バリデーション自体が不存在＝「相関バリを通過して継続」という観測が定義不能） | 継続系の実在要求は010/074等としてC-021/C-010でbound済み |
| 014 | 相関バリデーションでエラーが表示されず、対象処理を継続できること。 | 同上 | 同上 |
| 015 | 相関バリデーションでエラーが表示され、対象処理が完了しないこと。 | 同上 | 同012 |
| 016 | DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。 | noteにDB照会を伴うバリデーション（UniqueEntity・存在チェック等）は不存在（ShippingType.php:207-212逐語）。設計書md:203-205にもDB相関の規定なし | 継続系は010/074等でbound済み |
| 017 | DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。 | 同上 | 拒否系は072等でbound済み |
| 059 | 件名でエラーが表示され、対象処理が完了しないこと。 | 「件名」の**編集field・当該バリデーションは画面全体で不存在**を二層で実引き: ①フォームfield全列挙=shippings collection〔ShippingType: name/kana/company_name/postalCode/address/tel/Delivery/shipping_delivery_date/tracking_number/note/OrderItems/OrderItemsErrors/notify_email/Country/abroad_postal_code/DeliveryTime〕＋add_shipping（ShippingType.php:74-242・ShippingController.php:88-100）にsubject/body系fieldなし ②出荷編集画面に**メール送信UIは実在するがプレビュー/送信専用**: 出荷済にする/出荷メール送信モーダル（`#sentUpdateModal`）の「メール詳細」collapse `#viewEmail` の中身は**空の `<pre></pre>`**（JSで流し込む表示専用・input/textarea無し）＝shipping.twig:214-239／出荷メール送信ボタン（`data-preview-notify-mail-url`/`data-notify-mail-url`）＝shipping.twig:327-332／`admin_shipping_preview_notify_mail`（GET・`getShippingNotifyMailBody(...)`をResponseで返す**表示のみ**）・`admin_shipping_notify_mail`（PUT・`sendShippingNotifyMail($Shipping)`＝**送信のみ・subject/bodyのリクエスト入力もバリデーションも無し**）＝ShippingController.php:233-248。加えてメール送信の詳細は設計書スコープ外宣言（md:36） | 「エラーで完了しない」系の実在要求は009/072等でbound済み（**編集入力の不存在**による除外であり観測の除外ではない） |
| 060 | 件名でエラーが表示されず、対象処理を継続できること。 | 同上（件名の編集field・バリデーション不存在=059の二層証明） | 継続系は010等でbound済み |
| 062 | 本文でエラーが表示され、対象処理が完了しないこと。 | 同上（「本文」の編集field不存在=059の二層証明〔#viewEmailは表示専用pre・notify_mailは送信のみ〕。noteは「出荷用メモ欄」であり件名/本文対の「本文」ではない=IT-28メール系IF雛形のノイズ） | 拒否系は072等でbound済み |
| 063 | 本文でエラーが表示されず、対象処理を継続できること。 | 同上 | 継続系は010等でbound済み |

候補規律: 全行 `@TBD-D5`・O5未確定（D6後に確定検査）・実装/実走なし・O6/聖域/多軸/C6C7を主張しない。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象構文の列挙とclaim別判定（本機能は前提列=設計書節名の循環転記のため期待列との極性衝突が特に多い）:

| 対象 | 極性判定 | 判定根拠（一次資料） |
|---|---|---|
| 009（必須エラーあり）vs 010（必須エラーなし） | 009=他項目必須（氏名NotBlank）で肯定側成立→C-027／010=メモ任意→C-021 | ShippingType.php:74-80（name NotBlank実在）／207-212（note NotBlank不在）・md:129,205 |
| 019〜029・031〜041の「追加/変更される・されない」 | 期待テキスト極性を正としてbind。肯定→C-020/023/024/031、否定→C-025/C-027/C-034 | md:135-137（保存）・146（3001拒否）・215（権限拒否） |
| 023（前提=3000超→期待=追加される）・025（前提=お届け先追加→期待=追加されない）・026（前提=お届け先削除→期待=追加される）・050（前提=未ログイン→期待=削除状態になる） | シナリオ語を**棄却**（採ると一次資料と矛盾する期待を捏造することになる: 3001字は保存されない=md:146・追加出荷は保存される=md:148・削除出荷は残らない=md:149）。期待極性のみでbind | md:146,148,149 |
| 012〜017（相関・DB相関の両極） | 両極とも対応constraint不存在→excluded（極性以前に検証自体が不存在） | ShippingType.php:207-212・md:203-205 |
| 059〜063（件名/本文の両極・061除く） | 件名/本文の**編集field・当該バリデーションが画面全体で不存在**→excluded（メール送信UIは実在するがプレビュー/送信専用=§9-EX 059の二層証明）。**061のみ期待テキストが実在要求（NULL相当）のためbound**（C-021/C-022）＝観点ラベル（IT-28件名）に引きずられない | ShippingType.php:74-242全列挙（builderのadd全件）＋ShippingController.php:88-100（root=shippings/add_shipping）＋shipping.twig:214-239,327-332（#viewEmail=表示専用pre・送信ボタン）＋ShippingController.php:233-248（preview=GET表示のみ・notify_mail=PUT送信のみ）・md:36,145 |
| 受注編集系期待（005/007/018/045/046/057/067/079）の肯定極性 | 設計書上は実在要求＝**excludedにしない**。ee実装との乖離が確定しているため期待をee準拠（欄なし）に置き、設計書期待はDOC-01/BC-1として裁定行C-040/C-041で記録・実機裁定 | commit aebc5ff2c6・edit.twig grep0件・md:13「ec-cube-enterprise の実装を正とする」 |
| 039（権限拒否→変更されない） | 否定は実在（AuthorityVoter deny）→C-034でbound（DB不変=S0同値） | AuthorityVoter.php:52-67・md:215 |

**codex敵対レビュー: R1要修正（Major4・Blockerなし）→改訂1で全数是正（ヘッダ記載）→R2再確認待ち**。
R1でMajor4件（DOC-01行数の捏造是正・BC-01のvendor根拠欠如・EX-Dの不存在証明不足・C-032のS0穴）を検出・是正した
記録がC4-manual運用の実効性証跡を兼ねる。結果は`REVIEW_LEDGER.md`と本ヘッダに同期する。

---

## 付録: 作業実測（B0係数計測用）

- 読んだ一次資料・参照物: 設計書md 1／ee実ソース 13（ShippingType・ShippingController・Shipping・OrderType・
  EditController・edit.twig・shipping.twig・AuthorityVoter・security.yaml・eccube.yaml・CsvType・
  DoctrineMigrations×2）＋git履歴（aebc5ff2c6のdiff実読）／locale 4（messages ja/en・validators ja/en）＋
  vendor xlf 2／母集合・台帳 3（all_it_cases・fid_kubun・REVIEW_LEDGER）／統治 2（CRP・CFP）／
  同型見本 2（m05-16・m05-13草案）／既存実装 2（page.ts・oracle草案json見本）＝**計29ファイル**。
- L1 claim数: **26確定＋1実機裁定**（=27行）。候補ケース行29（ja25・EN4・補完0）。file:line claim引用 約70箇所。
- 難所（係数悪化要因）: (1) **受注編集側メモ欄のee不存在の確定**（grep陰性証明→form_rest不在確認→
  git log -S でコミット特定まで三段階） (2) その帰結のBC-1（clearMissingによるNULL化リスク）の切り分け
  （静的推論を確定期待にしない規律） (3) 既存page.tsのセレクタが旧版edit.twig前提で現eeと矛盾
  （`#order_Shipping_note` は不存在）＝再利用可否の峻別 (4) 削除系のUIゲート（明細ありでは出荷削除不可の
  エラーモーダル）の発見 (5) お届け先追加ケースの購入フロー依存（D5送り）。
- 楽だった点（再利用効果）: L1表・S0規律・三段参照・choice解決・runFill・隔離lint・§構成はm05-16/m05-13の型を
  そのまま流用。vendor xlf・validators・security.yaml・Length意味論はW0/W1と同一箇所の再確認のみ。
  m05-16が先行検出していた「出荷用メモ所在のmd/twig不一致」が本機能で根本原因（意図的削除コミット）まで確定できた。

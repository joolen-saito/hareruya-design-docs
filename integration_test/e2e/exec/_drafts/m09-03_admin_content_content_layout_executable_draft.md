# B0候補: m09-03 レイアウト管理 — 実行可能グレード候補（母集合88全量踏破）

> 2026-07-24 ／ **候補グレード（candidate・D6前）**／
> **codexレビュー: R1要修正（Blocker2/Major3/Minor1）→R1是正版（本版）**（`REVIEW_LEDGER.md`と同期）
> R1是正: **(B1) C-032/L1-032の到達性誤りを訂正**（不存在Page idはEntityType choices検証で弾かれ404分岐へ
> 到達しない=LayoutType.php:60-71・LC:130。C-032は要実機へ降格・063はpartialへ）
> **(B2) S0同値の定義を全列化**（id0のcreate_date/update_date含む全永続列＋配置全列の取得・復元・全列比較。
> preUpdateがupdate_dateを書き換えるため=SaveEventSubscriber.php:62-74）
> **(M3) DOC-DRAFT 3件を「設計・実装矛盾（未解決）」へ表現変更**（どちらが正かは本候補単独で確定しない=
> テストケースが正の原則。実装挙動をテスト期待の正にしない）
> **(M4) partial/unresolved 6件（018/043/055/060/063/064）をboundから分離会計**
> **(M5) 読み替えbound 16件をboundから別掲会計**（合計88=差分0維持）
> **(M6) BC-DRAFT-M0903-01の「DB FK層で拒否」断定を撤回**（推定・要実機に留める）。
> excluded=4・版固定/sha1/母集合SHA256はcodex妥当確認済み=維持。
> O5未確定・source_class=standard-src+design は fid_kubun.tsv（D1）による**暫定付与**（確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> 実装・実走なし。fixture_version は全て `@TBD-D5`。
> 統治: `integration_test/CONCRETIZATION_ROLLOUT_PLAN.md`（B0）＋`CONCRETIZATION_FIRST_PLAN.md`（三段会計）。
> 手本（DoD正典・同型）: `m09-01_admin_content_content_news_executable_draft.md`（フォーム/メッセージ/Form-DB段差）・
> `m09-02_admin_content_content_file_executable_draft.md`（per-ID excluded表・読み替えbound明示）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m09-03_admin_content_content_layout_oracle_draft.json`。
> **正式パス（`e2e/fixtures/oracle/*.json`・`e2e/spec/**`）には書かない**。
> **本機能の特性（破壊系＋配置系）**: レイアウト保存＝`dtb_layout`／`dtb_block_position` の破壊的更新
> （保存のたび当該レイアウトの配置全削除→再作成）。**プレビューはレイアウトid0（プレビュー用固定）を
> 上書きする**（LayoutController.php:111）。よって §2 の使い捨て専用SEEDレイアウト＋afterEach復元＋
> **S0スナップショット同値**（m05-13教訓）を必須とし、ブロック配置（drag-drop）の観測は
> **保存後のDB block_position**（db.ts三段参照・§6.2）で確定する。SEED値を期待の正にしない（S0同値）。

## §0 版固定

- 設計書 `functions/ec-cube-enterprise/m09-03_admin_content_content_layout.md`（最終コミット ec17cd0・repo HEAD 017ab3b）。
- ee `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51`／symfony/validator v7.4.3（composer.lock実測）。
- 一次資料sha1（実測・先頭12桁）: LayoutController.php=`2b22ebac93fd`／layout.twig=`09f0a7cbc6b3`／
  layout_list.twig=`c863131019f4`／layout_block.twig=`a2890cff937f`／layout_design.js=`1f133e9c1101`／
  LayoutType.php=`dccb4f8611df`／Layout.php=`a618a18b339c`／BlockPositionRepository.php=`fd091de0cf6b`／
  messages.ja.yaml=`b7c78070afaa`／messages.en.yaml=`d7cf92a1de8c`／validators.ja.yaml=`8cc5a327231c`／validators.en.yaml=`694fff6cd7b7`。
- fid_kubun.tsv（D1）: `M09-03｜標準｜standard-src+design｜区分不明=0`（実引き確認済み）。
- 母集合: baseline `all_it_cases.tsv`（SHA256先頭 `7911f190d273d4cf`）M09-03全**88行**（IT-M09-03-ADMIN-CONTENT-CONTENT-LAYOUT-001〜088）。
- **判定原則**: 観点ラベル・前提条件ラベルはノイズ（前提列は設計書subject名の機械循環。例: 088は前提「一覧の削除モーダル」で期待も削除モーダル＝整合、046は前提「削除を押下」で期待「追加されること」＝ノイズ）。bindは各行の**「期待結果」実テキスト**で判定（§8に全88行の期待要旨併記）。

## §1 L1原子オラクル表（43claim・全行逐語+file:line）

パス表記: LC=`src/Eccube/Controller/Admin/Content/LayoutController.php`／lt=`src/Eccube/Resource/template/admin/Content/layout.twig`／
ll=`…/layout_list.twig`／lb=`…/layout_block.twig`／ldjs=`html/template/admin/assets/js/layout_design.js`／
fnjs=`html/template/admin/assets/js/function.js`／LT=`src/Eccube/Form/Type/Admin/LayoutType.php`／LE=`src/Eccube/Entity/Layout.php`／
BPR=`src/Eccube/Repository/BlockPositionRepository.php`／BR=`src/Eccube/Repository/BlockRepository.php`／
DT=`src/Eccube/Entity/Master/DeviceType.php`／AC=`src/Eccube/Controller/AbstractController.php`／
SES=`src/Eccube/Doctrine/EventSubscriber/SaveEventSubscriber.php`／sec=`app/config/eccube/packages/security.yaml`／
ja=`src/Eccube/Resource/locale/messages.ja.yaml`／en=`messages.en.yaml`／vja=`validators.ja.yaml`／ven=`validators.en.yaml`／
plcsv=`src/Eccube/Resource/doctrine/import_csv/ja/dtb_page_layout.csv`／
md=`functions/ec-cube-enterprise/m09-03_admin_content_content_layout.md`。

| oracle_id | 観点 | claim | 逐語quote | 根拠(file:line) | LS |
|---|---|---|---|---|---|
| L1-M0903-001 | auth_rule | 未認証は管理ログインへ誘導され本画面へ到達しない | 「未認証｜利用不可。管理領域の認証要件に従いログイン等へ誘導される。」／`pattern: ['^/%eccube_admin_route%/',…] … login_path: admin_login` | md:321／sec:41-46 | 0 |
| L1-M0903-002 | http_status | 一覧GET=HTTP200（ルートadmin_content_layout・GETのみ） | `#[Route(path: '/%eccube_admin_route%/content/layout', name: 'admin_content_layout', methods: ['GET'])]` | LC:55-57／md:71 | 0 |
| L1-M0903-003 | db_effect | 一覧取得=プレビュー用固定レイアウト（id0）除外・端末種別降順・id昇順（PC(10)がモバイル(2)より前・同種別内はid小が先） | `->where('l.id != :DefaultLayoutPreviewPage') ->orderBy('l.DeviceType', 'DESC') ->addOrderBy('l.id', 'ASC') ->setParameter('DefaultLayoutPreviewPage', Layout::DEFAULT_LAYOUT_PREVIEW_PAGE)`／「プレビュー用固定レイアウト（id0）を除く全レイアウトを対象とする。端末種別降順・id昇順で並べる。」 | LC:59-65／LE:51／md:116-117,212 | 0 |
| L1-M0903-004 | display_field | 一覧カードのアイコン=PC(id10)は`fa-desktop`・それ以外は`fa-mobile` | `{% if Layout.DeviceType.id == constant('…DeviceType::DEVICE_TYPE_PC') %}{% set icon = 'fa-desktop' %}{% else %}{% set icon = 'fa-mobile' %}`／`public const DEVICE_TYPE_MB = 2; … public const DEVICE_TYPE_PC = 10;` | ll:47-52／DT:29-31／md:87 | 0 |
| L1-M0903-005 | display_field | カード見出しのレイアウト名は編集画面へのリンク | `<a class="card-title align-middle" href="{{ url('admin_content_layout_edit', { id : Layout.id } ) }}">{{ Layout.name }}</a>` | ll:53-54／md:87 | 0 |
| L1-M0903-006 | display_field | 削除ボタンは既定レイアウト（id0・1・2）で非表示（isDefault判定・UI出し分け） | `{% if Layout.isDefault() == false %}<button … data-bs-target="#DeleteModal"`／`return in_array($this->id, [self::DEFAULT_LAYOUT_PREVIEW_PAGE, self::DEFAULT_LAYOUT_TOP_PAGE, self::DEFAULT_LAYOUT_UNDERLAYER_PAGE]);` | ll:57-64／LE:69-72／md:118,213,238 | 0 |
| L1-M0903-007 | display_field | 展開で割当ページ名（ページ編集リンク）一覧・割当なしは「ページが登録されていません」/"Page not registered" | `<a href="{{ url('admin_content_page_edit', { id: Page.id }) }}">{{ Page.name }}</a>`／`{{ 'admin.content.layout_no_page'\|trans }}` | ll:73-93／ja:2876／en:2563／md:87 | 1 |
| L1-M0903-008 | display_field | 見出し「レイアウト管理」「コンテンツ管理」・新規作成ボタン「新規作成」/"Layouts"・"Contents"・"Create New" | `{{ 'admin.content.layout_management'\|trans }}`／`{{ 'admin.content.contents_management'\|trans }}`／`{{ 'admin.common.create__new'\|trans }}` | ll:15-16,39／ja:2850,2847,1647／en:2537,2534,1678 | 1 |
| L1-M0903-009 | message | 削除モーダル: 表示時にdata-url→削除リンクhref・data-message→本文へ差替。見出し「削除します」/"Delete"・本文「この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？」/"You can not revert this action. Are you sure to delete %name%?"・キャンセル(data-bs-dismiss)・実行はtoken-for-anchor+`data-method="delete"` | `$(this).find('[data-method="delete"]').attr('href', target.data('url')); … $(this).find('p.modal-message').text(target.data('message'));`／`<a href="#" class="btn btn-ec-delete" {{ csrf_token_for_anchor() }} data-method="delete" data-confirm="false">` | ll:22-29,97-115／ja:1785-1786／en:1793-1794／md:88,197 | 1 |
| L1-M0903-010 | http_status | 新規/編集=GET・POST両受け。新規は空Layout・編集はget(id)でnullならHTTP404 | `#[Route(path: '…/content/layout/{id}/edit', … methods: ['GET', 'POST'])] #[Route(path: '…/content/layout/new', …)]`／`if (is_null($id)) { $Layout = new Layout(); } else { $Layout = $this->layoutRepository->get($this->isPreview ? 0 : $id); if (is_null($Layout)) { throw new NotFoundHttpException(); } }` | LC:103-115／md:72,74,123,234 | 0 |
| L1-M0903-011 | display_field | 未使用ブロック=配置が空なら全ブロック（findAll）・配置ありなら配置済みを除いた残り（not in） | `if (empty($Blocks)) { $UnusedBlocks = $this->blockRepository->findAll(); } else { $UnusedBlocks = $this->blockRepository->getUnusedBlocks($Blocks); }`／`->where('b not in (:blocks)')` | LC:117-123／BR getUnusedBlocks／md:124,235 | 0 |
| L1-M0903-012 | display_field | 概要カード=名称text入力＋「必須」/"Required"バッジ・端末種別（新規=プルダウン・既存編集=名称表示＋hiddenで現値保持） | `{{ form_widget(form.name) }}`／`<span class="badge bg-primary ms-1">{{ 'admin.common.required'\|trans }}</span>`／`{% if Layout.id %}{{ form.DeviceType.vars.data.name }}<input type="hidden" name="{{ form.DeviceType.vars.full_name }}" value="{{ form.DeviceType.vars.value }}" />{% else %}{{ form_widget(form.DeviceType) }}{% endif %}` | lt:204-226／ja:1721／en:1749／md:89,95,217,224 | 1 |
| L1-M0903-013 | display_field | 編集カード=12配置セクション枠（`#position_1`〜`#position_12`）＋未使用欄（`#position_0`）・各枠にセクション名見出し（`<head></head>タグ内`・`#header`等。en="Within the <head></head> tags"等） | `{% set target_id = constant('Eccube\\Entity\\Layout::TARGET_ID_HEAD') %}<div id="position_{{ target_id }}" … ui-sortable">`（12枠）／`<div id="position_{{ unused_target_id }}" …`／TARGET_ID_UNUSED=0〜CLOSE_BODY_BEFORE=12 | lt:259-434／LE:33-46／ja:2894-2907／en:2581-2594／md:59,89 | 1 |
| L1-M0903-014 | display_field | 空セクションはプレースホルダ「ブロックをドラッグ＆ドロップ」/"Drag & Drop a Block"・ブロック投入で除去・空化で挿入 | `<div class="target-placeholder …"><span class="text-ec-gray">{{ 'admin.content.layout_drag_and_drop_message'\|trans }}</span></div>`／`if ($(this).children('.block').length <= 0) { $(this).append($('#target-placeholder').html()); } if (ui.item.parent().children('.block').length > 0) { ui.item.parent().children('.target-placeholder').remove(); }` | lt:267,544／ldjs:50-60／ja:2880／en:2567／md:89-90,177 | 1 |
| L1-M0903-015 | display_field | D&D=jQuery UI sortable・connectWithで全セクション相互接続・確定時に各ブロックのhidden target-id=移動先枠id・block-row再採番・firstクラス更新 | `$els.sortable({ items: '> div.block', … connectWith: window.els, … update: sortableUpdate });`／`.children('input.target-id').val(sortable.id.replace('position_', ''));` | ldjs:33-62,12-24／lt:39-41／md:90,101 | 0 |
| L1-M0903-016 | display_field | 行番号はクライアントが0始まりで再採番（`input.block-row`へインデックス値を設定） | `$(sortable).find('input.block-row').each(function(i) { $(this).val(i); });`／「クライアントが0始まりで再採番した行番号（block_row）として送信し、保存する。」 | ldjs:20-23／md:101,216 | 0 |
| L1-M0903-017 | display_field | コンテキストメニュー=「上に移動」「下に移動」「セクションに移動」「コードプレビュー」/"Move up"・"Move Down"・"Move to Section"・"Preview Codes" | `class='context-moveup …'>…{{ 'admin.content.layout_up'\|trans }}`（4項目） | lt:523-538／ja:2881-2884,2887／en:2568-2571,2574／md:91,179 | 1 |
| L1-M0903-018 | display_field | 上下移動は同一セクション内の隣接ブロックがある場合のみ入替え・移動後に再採番 | `if (block.prev.length) { block.current.insertBefore(block.prev); … window.updateUpDown($block.parent('.ui-sortable').first()); }`（downは対称） | lt:63-76／md:91,102 | 0 |
| L1-M0903-019 | display_field | セクション移動=モーダル（見出し「ブロックを移動」・本文「ブロックの移動先を選択してください」・実行「移動」/"Move a Block"・"Please select where to move the block"・"Move"）で移動先選択→append・再採番・元/先のプレースホルダ調整 | `$position.append($target); window.updateUpDown($position); window.updateUpDown($parent); if ($position.children('.block').length > 0) { $position.children('.target-placeholder').remove(); } if ($parent.children('.block').length <= 0) { $parent.append($('#target-placeholder').html()); }` | lt:77-106,483-504／ja:2891-2893／en:2578-2580／md:91,103 | 1 |
| L1-M0903-020 | display_field | 未使用ブロック検索=入力でsearchWord実行・小文字化部分一致で表示/非表示のみ切替・サーバ問い合わせなし | `$('#search-block').on('input', function () { searchWord($(this).val(), $('#unused-block .sort')); });`／`if (targetText.toLowerCase().indexOf(searchText.toLowerCase()) != -1) { $(this).show(); }`／「サーバ問い合わせはしない。」「再検証なし。…送信値は更新しない。」 | lt:180-183／fnjs:271-294／md:92,104 | 0 |
| L1-M0903-021 | request_contract | 送信契約: form1=POST（action=編集は`{id}/edit`・新規は`new`）・`admin_layout[_token]`＋ブロックごとの隠しフィールド連番`name_<n>`・`block_id_<n>`・`section_<n>`・`block_row_<n>` | `<form name="form1" id="form1" method="post" action="…">`＋`{{ form_widget(form._token) }}`／`<input type="hidden" class="block-id" name="block_id_{{ loop_index }}" …/><input type="hidden" class="target-id" name="section_{{ loop_index }}" …/><input type="hidden" class="block-row" name="block_row_{{ loop_index }}" …/>` | lt:186-193／lb:24-27／lt:462-471／md:95,226 | 0 |
| L1-M0903-022 | validation_rule | レイアウト名必須（NotBlank）→ja「入力されていません。」/en "No value found."（validatorsドメイン既定文言）・保存しない | `->add('name', TextType::class, ['constraints' => [new Assert\NotBlank(),],])`／`This value should not be blank.: 入力されていません。`／`This value should not be blank.: No value found.` | LT:42-50／vja:17／ven:17／md:187,310 | 1 |
| L1-M0903-023 | validation_rule | 端末種別=NotBlank制約あり・`'required' => false`（HTML required無効だが未入力はサーバ検証エラー） | `->add('DeviceType', DeviceTypeType::class, ['constraints' => [new Assert\NotBlank(),], 'required' => false,])` | LT:51-59／md:224,311 | 0 |
| L1-M0903-024 | validation_rule | レイアウト名にForm側Length制約なし（constraints=NotBlankのみ=実引き）・DB列は`layout_name` varchar(255)→入力上限はDB列長依存（255文字は受理・保存可）。**256文字の「行を作れない」はスキーマ由来の推定であり実走未確認・画面応答も一次資料に規定なし＝partial/要実機（R1是正M4）** | `#[ORM\Column(name: 'layout_name', type: Types::STRING, length: 255, nullable: true)]`／「フォーム側のLength制約は無いため、入力上限はDB列長に依存する。」 | LT:42-51（Length不存在の実引き）／LE:248／md:223,228 | 0 |
| L1-M0903-025 | db_effect | 保存=Layout本体をpersist/flush→当該レイアウトの既存BlockPositionを**全件削除**→送信値からregisterで再作成（差分更新しない） | `$this->entityManager->persist($Layout); $this->entityManager->flush(); … foreach ($BlockPositions as $BlockPosition) { $Layout->removeBlockPosition($BlockPosition); $this->entityManager->remove($BlockPosition); $this->entityManager->flush(); } … $this->blockPositionRepository->register($data, $Blocks, $UnusedBlocks, $Layout);`／「保存のたびに当該レイアウトの既存配置を全削除し、送信値から作り直す。」 | LC:130-147／md:131-133,214 | 0 |
| L1-M0903-026 | db_effect | register除外規則: `block_id_<i>`が取れない行はinsertしない・`section_<i>`=0（未使用）はinsertしない | `if (!isset($data['block_id_'.$i])) { continue; } // 未使用ブロックはinsertしない if ($data['section_'.$i] == Layout::TARGET_ID_UNUSED) { continue; }`／`public const TARGET_ID_UNUSED = 0;` | BPR:62-69／LE:34／md:133,215 | 0 |
| L1-M0903-027 | db_effect | 配置保存列=dtb_block_position（block_id・layout_id・block_row・section）＝送信hidden値をそのまま設定 | `$BlockPosition->setBlockId($data['block_id_'.$i])->setLayoutId($Layout->getId())->setBlockRow($data['block_row_'.$i])->setSection($data['section_'.$i])` | BPR:71-83／md:226,289-292 | 0 |
| L1-M0903-028 | security_rule | **registerにブロック存在・重複・配置先妥当性の検証コードなし**: `find()`結果nullを検査せず・重複チェックなし・section値の範囲検査なし（md:101「ブロック存在、レイアウト存在、配置先妥当性、重複はサーバ側で保存時に判定する」／md:103「保存時にサーバ側で配置先と対象ブロックを検証する」との**設計・実装矛盾=DOC-DRAFT-M0903-01・未解決**。実装側で確認できる判定は除外規則L1-026のみ。不存在block_id送信時の実挙動〔DB制約・HTTP応答〕は**未確認=BC-DRAFT-M0903-01・要実機**〔断定しない〕） | `$Block = $this->blockRepository->find($data['block_id_'.$i]); $BlockPosition = new BlockPosition(); …setBlock($Block)…`（BPR:57-84全実引き=null検査・重複検査・section範囲検査の文なし） | BPR:57-84／md:101,103 | 0 |
| L1-M0903-029 | message | 通常保存成功=「保存しました」/"Saved"フラッシュ＋当該レイアウトの編集画面へリダイレクト | `$this->addSuccess('admin.common.save_complete', 'admin'); return $this->redirectToRoute('admin_content_layout_edit', ['id' => $Layout->getId()]);` | LC:180-182／ja:1591／en:1636／md:135,194 | 1 |
| L1-M0903-030 | request_contract | プレビュー=POST `…/content/layout/{id}/preview`（isPreview=true・previewPageId=`admin_layout[Page]`でeditを実行） | `#[Route(path: '…/content/layout/{id}/preview', name: 'admin_content_layout_preview', … methods: ['POST'])] … $form = $request->get('admin_layout'); $this->isPreview = true; return $this->edit($request, $cacheUtil, $id, $form['Page']);` | LC:226-233／md:77 | 0 |
| L1-M0903-031 | db_effect | **プレビューの保存先=レイアウトid0（プレビュー用固定レイアウト）**: isPreview時は`get(0)`で読み、名称・端末種別・配置がid0側へ保存される（編集中idのレコードは更新されない）。プレビューでは「保存しました」を積まない | `$Layout = $this->layoutRepository->get($this->isPreview ? 0 : $id);`／`if ($this->isPreview) { … return …; } $this->addSuccess(…)`（プレビュー分岐はaddSuccess前にreturn）／「プレビューでは保存しましたのフラッシュを積まない。」 | LC:111,152-178／LE:51／md:145,252 | 0 |
| L1-M0903-032 | http_status | プレビュー遷移: 保存後にページ取得null=HTTP404。編集種別が既定以上かつURL=product_detailは公開商品1件で`preview=1`付き商品詳細へ（表示商品なし=404）・その他既定以上は当該ページrouteへ`preview=1`・既定未満はuser_dataルートへ`route=<url>&preview=1`。**到達条件の限定（R1是正）**: 本分岐は`$form->isValid()`通過後（LC:130）にのみ到達する。`Page`はEntityType（choices=当該レイアウトの割当ページに限定=L1-034）のため、**不存在page idの直接POSTはフォーム検証で拒否され本分岐に到達しない**。空Page（""）は検証を通る（NotBlankなし）が、その場合の`find('')`の挙動はソース単独で未確定＝**404の到達可能条件は一次資料から立証できず要実機** | `try { $Page = $this->pageRepository->find($previewPageId); if ($Page === null) { throw new NoResultException(); } } catch (NoResultException) { throw new NotFoundHttpException(); } if ($Page->getEditType() >= Page::EDIT_TYPE_DEFAULT) { if ($Page->getUrl() === 'product_detail') { … } … return $this->redirectToRoute($Page->getUrl(), ['preview' => 1]); } return $this->redirectToRoute('user_data', ['route' => $Page->getUrl(), 'preview' => 1]);`／`if ($form->isSubmitted() && $form->isValid()) {`（この内側でのみ156-177へ到達） | LC:130,156-177／LT:60-71／md:141-144,240 | 0 |
| L1-M0903-033 | message | プレビューUI: ページ未選択はalert「プレビューするページを選択してください」/"Please select a page for preview"を出し送信しない。選択済みはform1のaction/targetをプレビューURL/_blankへ一時差替→submit→編集URL/_selfへ戻す（**md:206 メッセージID対応表の「画面上の文言(英語)」列は日本語のまま=en正はmessages.en.yaml:2573＝DOC-DRAFT-M0903-03**） | `if (!page_id) { alert("{{ 'admin.content.layout_preview_select_page'\|trans }}"); return false; } $('#form1').attr('action', "{{ url('admin_content_layout_preview', {id: Layout.id}) }}"); $('#form1').attr('target', '_blank'); $('#form1').submit(); $('#form1').attr('action', "{{ url('admin_content_layout_edit', {id: Layout.id}) }}"); $('#form1').attr('target', '_self');` | lt:158-177／ja:2886／en:2573／md:94,188,206 | 1 |
| L1-M0903-034 | display_field | プレビューブロック（ページ選択＋プレビューボタン）はLayout.idありかつPage choices>0のときのみ表示。選択肢=当該レイアウトの割当ページ（page_id昇順・mapped無効） | `{% if Layout.id and form.Page.vars.choices\|length > 0 -%}<div id="preview-block" …`／`->add('Page', EntityType::class, ['mapped' => false, … 'query_builder' => fn (…) => $er->createQueryBuilder('pl')->orderBy('pl.page_id', 'ASC')->where('pl.layout_id = :layout_id')…])` | lt:419-430／LT:60-71／md:94,180,225 | 0 |
| L1-M0903-035 | auth_rule | 削除=DELETEメソッド＋トークン検証。token不正=HTTP403 `AccessDeniedHttpException('CSRF token is invalid.')`。不存在id=HTTP404（`requirements: ['id' => '\d+']`のエンティティ解決） | `#[Route(path: '…/content/layout/{id}/delete', name: 'admin_content_layout_delete', requirements: ['id' => '\d+'], methods: ['DELETE'])] public function delete(Layout $Layout, …) { $this->isTokenValid();`／`throw new AccessDeniedHttpException('CSRF token is invalid.');` | LC:72-75／AC:252-263／md:76,150,312 | 0 |
| L1-M0903-036 | db_effect | 削除可否=割当ページ（PageLayouts）が空か否か。割当あり→警告「関連するデータがあるため「%name%」を削除できませんでした」/"Sorry, we are unable to delete %name%, because it has related data."を積み一覧へ・削除しない | `if (!$Layout->isDeletable()) { $this->addWarning(trans('admin.common.delete_error_foreign_key', ['%name%' => $Layout->getName()]), 'admin'); return $this->redirectToRoute('admin_content_layout'); }`／`if (!$this->getPageLayouts()->isEmpty()) { return false; }` | LC:78-82／LE:436-443／ja:1595／en:1642／md:151,196,213 | 1 |
| L1-M0903-037 | db_effect | 削除可能→remove/flush＋「削除しました」/"Deleted"＋Doctrineキャッシュ削除＋一覧へ | `$this->entityManager->remove($Layout); $this->entityManager->flush(); $this->addSuccess('admin.common.delete_complete', 'admin'); … $cacheUtil->clearDoctrineCache(); return $this->redirectToRoute('admin_content_layout');` | LC:84-92／ja:1593／en:1638／md:152,195 | 1 |
| L1-M0903-038 | security_rule | **サーバ側deleteに既定レイアウト（初期データ）判定なし**: delete()の判定はトークン・エンティティ解決（404）・isDeletable（割当ページ）のみで、isDefault検査は一覧のボタン非表示（L1-006）だけ（md:107「削除対象、初期データ削除制限、トークン、権限はサーバ側で判定する」と実装が齟齬=**DOC-DRAFT-M0903-02**。標準データではid0・1・2全てにdtb_page_layout割当があり、結果的にisDeletableで拒否される） | `public function delete(Layout $Layout, CacheUtil $cacheUtil): RedirectResponse { $this->isTokenValid(); if (!$Layout->isDeletable()) {…} $this->entityManager->remove($Layout); …}`（LC:72-93全実引き=isDefault検査の文なし）／plcsv:2-5（`"0","0"`・`"1","1"`・`"2","2"`・`"3","2"`） | LC:72-93／ll:57／plcsv:2-5／md:107 | 0 |
| L1-M0903-039 | http_status | view_block: 非Ajax=HTTP400・id無し=HTTP400・ブロック不存在=HTTP404 | `if (!$request->isXmlHttpRequest()) { throw new BadRequestHttpException(); } $id = $request->get('id'); if (is_null($id)) { throw new BadRequestHttpException(); } $Block = $this->blockRepository->find($id); if (null === $Block) { throw new NotFoundHttpException(); }` | LC:195-209／md:157-159,241,357-358 | 0 |
| L1-M0903-040 | api | view_block成功=JSON `{id, source}`（sourceは`Block/<file_name>.twig`のテンプレートソース） | `$source = $twig->getLoader()->getSourceContext('Block/'.$Block->getFileName().'.twig')->getCode(); return $this->json(['id' => $Block->getId(), 'source' => $source,]);` | LC:211-218／md:78,160,262 | 0 |
| L1-M0903-041 | display_field | コードプレビューモーダル: ace読み取り専用twigモードエディタへsource表示・失敗時はstatusText+errorThrown表示・補足文言「編集が必要な場合は…保存されません）」・「コードを編集」はDUMMY_BLOCK_ID(9999999999)を実ブロックIDへ置換したブロック編集URLへ遷移 | `editor.setOptions({ readOnly: true, …});`／`.done(function(json, …) { editor.setValue(json.source); …}).fail(function(jqXHR, statusText, errorThrown) { editor.setValue(statusText + ' ' + errorThrown); });`／`const href = $block_edit.data('href').replace(/{{ constant('…LayoutController::DUMMY_BLOCK_ID') }}/, block_id);`／`public const DUMMY_BLOCK_ID = 9999999999;` | lt:121-152,505-522／LC:41／ja:2888-2890／en:2575-2577／md:93,181 | 1 |
| L1-M0903-042 | db_effect | 保存（通常・プレビューとも）でDoctrineキャッシュを削除する | `// キャッシュの削除 $cacheUtil->clearDoctrineCache();` | LC:149-150／md:134,253 | 0 |
| L1-M0903-043 | db_effect | dtb_layoutのcreate_date/update_dateはDoctrine prePersist/preUpdateイベントで自動設定 | `if (method_exists($entity, 'setCreateDate')) { $entity->setCreateDate(new \DateTime()); } if (method_exists($entity, 'setUpdateDate')) { $entity->setUpdateDate(new \DateTime()); }` | SES:37-55／md:287-288,368 | 0 |

**既知バグ候補（BC-DRAFT・仕様側を期待値の正とし分離）**:
- **BC-DRAFT-M0903-01（要実機・未確定・断定なし=R1是正M6）**: 不存在block_idを含む配置送信時、registerは`find()`結果nullを検査せず（L1-028実引き）そのままpersist経路に入る。**その後の実挙動（DB制約による拒否の有無・例外/HTTP応答の形）はソースからは確定できず実走未確認＝推定を期待値にしない**。期待値の正=テストケース（母集合018系譜）と設計書md:101「ブロック存在…はサーバ側で保存時に判定する」（判定結果の文言・提示は未定義）。

**設計・実装矛盾（DOC-DRAFT・未解決。どちらが正かは本候補単独で確定しない＝テストケースが正の原則・実装挙動をテスト期待の正にしない=R1是正M3）**:
- **DOC-DRAFT-M0903-01（未解決）**: md:101「ブロック存在、レイアウト存在、配置先妥当性、重複はサーバ側で保存時に判定する」・md:103「保存時にサーバ側で配置先と対象ブロックを検証する」⇔BPR:57-84の実装はblock_id欠落行と未使用（section=0）行の除外のみ（存在・重複・配置先範囲の検証コードなし=L1-028）。**不整合の記録に留める**（設計誤りともテスト期待誤りとも確定しない）。該当部分（018/060の当該観点）は**partial/unresolved会計**とし、bound完了に数えない。
- **DOC-DRAFT-M0903-02（未解決）**: md:107「初期データ削除制限…はサーバ側で判定する」⇔LC:72-93のdelete()にisDefault（既定レイアウト）判定の文なし（L1-038。実装で確認できる判定はトークン・404・割当ページのみ。UI非表示=ll:57）。**不整合の記録に留める**。該当部分（064の当該観点）は**partial/unresolved会計**。
- **DOC-DRAFT-M0903-03（未解決）**: md:206 M09-03-MSG-001の「画面上の文言(英語)」列は「プレビューするページを選択してください」（日本語のまま）⇔en一次資料messages.en.yaml:2573は "Please select a page for preview"（L1-033）。**どちらを-EN期待の正とするかは未解決**（C-031-ENはen辞書逐語を候補値として置くが未解決マーク付き・D6/正式化で裁定）。

## §2 SEED三段参照設計（使い捨て専用レイアウト＋afterEach復元＋S0スナップショット同値）

期待値の正はL1オラクルID（SEED値を期待の正にしない三段参照）。全て`@TBD-D5`。id帯900000931〜は既存SEED帯（m09-01の9000003xx）と衝突しない予約帯として仮置き（確定はD5）。ブロックは**既存標準ブロック（dtb_block）を参照のみ**し、本機能SEEDでdtb_blockを作らない（block_id実値はD5確定）。

| SEED | 内容 | 用途・規律 |
|---|---|---|
| SEED-M0903-EDIT@TBD-D5 | dtb_layout: id=900000931・layout_name=`E2E-M0903編集対象`・device_type_id=10(PC)＋dtb_block_position 2行（既存標準ブロック2件をsection=6(MAIN_TOP)・block_row=0,1で配置） | 編集表示・編集保存・D&D・上下移動・セクション移動・配置再構築の**破壊対象（使い捨て）**。各テストafterEachでSEED再適用（配置含む） |
| SEED-M0903-DEL@TBD-D5 | dtb_layout: id=900000932・layout_name=`E2E-M0903削除対象`・device_type_id=10・配置1行（既存ブロック1件・section=10(FOOTER)） | 削除成功系の使い捨て。削除後afterEachで再適用 |
| SEED-M0903-ASSIGNED@TBD-D5 | dtb_layout: id=900000933・layout_name=`E2E-M0903割当あり`・device_type_id=10＋dtb_page_layout 1行（layout_id=900000933・page_id=既存標準ページ1件〔編集種別=既定以上・D5確定〕・sort_no=99） | 削除拒否（L1-036）とプレビュー（L1-032・Page choicesの供給=L1-034）。**dtb_page_layout行はafterEachで必ず撤去**（フロント表示への影響を残さない） |
| SEED-M0903-MB@TBD-D5 | dtb_layout: id=900000934・layout_name=`E2E-M0903モバイル`・device_type_id=2(MB)・配置なし | 一覧順序（端末種別降順=PC群が先・L1-003）の観測用（読取専用） |
| **S0スナップショット（m05-13教訓・R1是正B2=全列化）** | 試験開始前に db.ts で ①dtb_layout id=0行の**全永続列**（id・layout_name・device_type_id・**create_date・update_date**）②dtb_block_position layout_id=0の全行×**全列**（section・block_id・layout_id・block_row=複合PK3列+block_row。BlockPosition.php:29-44実引き）③既定レイアウトid=1,2の同**全列** を記録 | **プレビュー（C-030）はid0本体をflushしpreUpdateが`update_date`を書き換える（SaveEventSubscriber.php:62-74・Layout.php:260）**ため、名称・配置だけの復元では同値にならない。復元=SQLで dtb_layout id0を**create_date/update_date含む全列UPDATE**＋layout_id=0配置を**DELETE→記録全列でINSERT**し、afterEachで**全列比較の同値検証**を必須とする。S0はSUT観測値であり期待の正はL1 |

- 新規保存系（C-005/006/021/023等）で採番されたidは、リダイレクトURLから取得しafterEachでdtb_block_position（layout_id=当該id）→dtb_layoutの順に削除。
- 並行実行: 本機能は一覧全件と id0 を共有するため **serial実行必須**（並行書込で一覧順序・S0同値検査が壊れる）。

## §3 操作×配置/破壊マトリクス（新規/複製相当は本機能に不存在＝複製機能なし。マトリクスは実在操作のみ）

| 操作 | メソッド/経路 | DB書込 | 破壊範囲 | 防御・判定（実装実引き） |
|---|---|---|---|---|
| 一覧GET | GET /content/layout | なし | なし | 未認証誘導（L1-001）・id0除外（L1-003） |
| 新規表示GET | GET /content/layout/new | なし | なし | 未認証誘導 |
| 編集表示GET | GET /content/layout/{id}/edit | なし | なし | 不存在404（L1-010） |
| 保存POST（新規/編集） | POST new／{id}/edit | dtb_layout upsert＋当該layoutの配置全削除→再作成 | **当該レイアウトのみ**（使い捨てSEED限定） | _token（form）・name/DeviceType NotBlank（L1-022/023）・除外規則（L1-026）。存在/重複/範囲検証なし=DOC-DRAFT-01 |
| プレビューPOST | POST {id}/preview | **dtb_layout id=0本体（update_date含む）＋配置を上書き**（L1-031） | **id0（共有既定データ）→S0全列復元必須** | 不存在Page idはフォーム検証（choices限定）で拒否＝404分岐へ到達しない・404の到達可能条件は要実機（L1-032・R1是正B1）・未選択はクライアント中止（L1-033） |
| 削除DELETE | DELETE {id}/delete | dtb_layout＋配置（cascade remove） | 当該レイアウトのみ | token403（L1-035）・不存在404・割当あり拒否（L1-036）。既定判定なし=DOC-DRAFT-02 |
| view_block GET | GET view_block（Ajax） | なし | なし | 非Ajax400・id無し400・不存在404（L1-039） |
| 端末種別 | — | dtb_layout.device_type_id | — | 新規=選択（PC=10/MB=2）・既存編集=hidden保持で変更不可（L1-012）・一覧はDESC順とアイコン出し分け（L1-003/004） |

入力項目検証（md:223-226・L1-022/023/024）: レイアウト名=必須・Length制約なし（DB255）／端末種別=NotBlank（required=false）／プレビュー対象ページ=任意・mapped無効・永続化しない／ブロック配置=hidden連番（除外規則のみ）。

## §4 実行可能グレード14列TSV（候補・**自己完結＝全46行を実体掲載**）

### §4.1 bound対応候補行（33行。§8の88対応表が参照する全ja行）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m09-03_admin_content_content_layout	E2E-M0903C-001	IT-23	一覧	P1	一覧が端末種別降順・id昇順で表示されid0（プレビュー用）を含まない	ログイン済(SEED-M01-ADMIN)／SEED-M0903-EDIT/DEL/ASSIGNED(PC)＋SEED-M0903-MB	—	1. GET /%eccube_admin_route%/content/layout 2. 全カードの並び（アイコン種別とdata順）を文書順に取得 3. id0のカード不在を確認 4. db.tsで dtb_layout の(device_type_id DESC, id ASC)ソート結果（id0除外）と突合	HTTP200・カード順がDB取得規則（端末種別降順→id昇順）と全順序一致（PC群3件が先・MB=900000934が後）・「プレビュー用レイアウト」（id0）は表示されない [L1:L1-M0903-002,L1-M0903-003; fixture:SEED-M0903-EDIT@TBD-D5]				
m09-03_admin_content_content_layout	E2E-M0903C-002	IT-25	画面レイアウト	P2	一覧カード=端末種別アイコン出し分け・名称は編集リンク・割当ページ折りたたみ	ログイン済／SEED-M0903-ASSIGNED＋SEED-M0903-EDIT	—	1. 一覧を開く 2. SEED-EDIT(PC)カードのi.faクラスを読む 3. SEED-MBカードのi.faクラスを読む 4. カード名称aのhrefを読む 5. ASSIGNEDカードを展開し割当ページリンクを読む 6. EDITカード（割当なし）を展開する	PC=fa-desktop・MB=fa-mobile・名称href=/content/layout/{id}/edit・展開で割当ページ名（page編集リンク）表示・割当なしは「ページが登録されていません」 [L1:L1-M0903-004,L1-M0903-005,L1-M0903-007; fixture:SEED-M0903-ASSIGNED@TBD-D5]				
m09-03_admin_content_content_layout	E2E-M0903C-003	IT-25	新規画面	P1	新規作成で空のレイアウト編集画面・全ブロックが未使用欄・エラーなし	ログイン済	—	1. 一覧の「新規作成」押下（GET /content/layout/new） 2. 名称入力欄が空・端末種別がselect（プルダウン）であることを確認 3. db.tsで dtb_block 全件数を取得し#position_0内の.block件数と一致を確認 4. #position_1〜12に.blockが無いことを確認	HTTP200・名称空・端末種別プルダウン・未使用欄のブロック数=dtb_block全件数・各セクション枠は空（プレースホルダのみ）・エラー表示なし [L1:L1-M0903-010,L1-M0903-011,L1-M0903-012]				
m09-03_admin_content_content_layout	E2E-M0903C-004	IT-20	編集画面	P1	レイアウト名押下で編集画面が開き配置済み/未使用が振り分け表示（非UI併用）	ログイン済／SEED-M0903-EDIT	GET /content/layout/900000931/edit（request APIでstatus取得） 	1. 一覧でSEED-EDITの名称リンク押下 2. #position_6内にSEED配置2ブロックがblock_row順で表示されることを確認 3. #position_0（未使用欄）に配置済み2件が含まれないことを確認 4. request APIで同URL GET=200を確認	編集画面が開き配置済みブロックは配置セクションへ・残りが未使用欄へ・HTTP200・エラー表示なし [L1:L1-M0903-010,L1-M0903-011; fixture:SEED-M0903-EDIT@TBD-D5]				
m09-03_admin_content_content_layout	E2E-M0903C-005	IT-26	登録内容	P1	新規保存で dtb_layout 行追加＋配置行作成＋「保存しました」＋編集画面へリダイレクト	ログイン済	name=`E2E-<runid>-新規`・DeviceType=PC(10)・ブロック1件をsection=6へ配置	1. 新規画面で名称入力・端末種別PC選択 2. 未使用ブロック先頭1件を#position_6へD&D 3. 登録押下 4. フラッシュとリダイレクト先URL（/{id}/edit）を確認 5. リダイレクトidでdb.ts照会: dtb_layout(layout_name, device_type_id)・dtb_block_position(layout_id=当該id) （afterEach: 配置行→layout行の順に削除）	「保存しました」＋/content/layout/{新id}/editへ遷移＋dtb_layout.layout_name=入力値・device_type_id=10＋dtb_block_positionに(section=6, block_row=0, block_id=配置ブロック)の1行 [L1:L1-M0903-029,L1-M0903-027,L1-M0903-021]				
m09-03_admin_content_content_layout	E2E-M0903C-006	IT-26	登録内容	P1	全ブロック未使用のまま新規保存→layout行は追加され配置行は1件も作られない	ログイン済	name=`E2E-<runid>-配置なし`・DeviceType=PC(10)・全ブロック未使用のまま	1. 新規画面で名称・端末種別のみ入力し登録押下 2. リダイレクトidを取得 3. db.tsで dtb_layout 行存在と dtb_block_position(layout_id=当該id) 件数=0 を照会（afterEach: layout行削除）	保存成功（「保存しました」）＋dtb_layout行が追加され dtb_block_position は0件（section=0行はinsertされない） [L1:L1-M0903-026,L1-M0903-029]				
m09-03_admin_content_content_layout	E2E-M0903C-007	IT-26	更新内容	P1	編集保存で名称・配置が更新され同じ編集画面へリダイレクト・一覧にも新名称	ログイン済／SEED-M0903-EDIT	name=`E2E-<runid>-改名`・配置1件をsection=6→7へD&D	1. 編集画面(900000931)で名称変更・ブロック1件を#main_bottomへ移動し登録 2. リダイレクト先が/content/layout/900000931/editであることとフラッシュを確認 3. db.tsでlayout_name・block_position(section)を照会 4. 一覧を開き当該カード名称を読む（afterEach: SEED再適用）	「保存しました」＋同じ編集画面へ＋dtb_layout.layout_name=更新値＋当該ブロックのsection=7＋一覧カード名称も更新値 [L1:L1-M0903-029,L1-M0903-025,L1-M0903-027; fixture:SEED-M0903-EDIT@TBD-D5]				
m09-03_admin_content_content_layout	E2E-M0903C-008	IT-25	画面レイアウト	P2	保存のたび既存配置を全削除し送信値から再作成する（delete/insert）	ログイン済／SEED-M0903-EDIT	配置構成を変更して保存（2ブロックの片方を未使用へ）	1. db.tsで保存前の dtb_block_position(layout_id=900000931) 全行（block_id,section,block_row）を記録 2. 編集画面で1ブロックを未使用欄へ移動し登録 3. db.tsで再照会	保存後の配置行集合が送信構成（残1件のみ）と一致し、旧構成の行（移動したブロックの行）が存在しない（全削除→再作成） [L1:L1-M0903-025,L1-M0903-027; fixture:SEED-M0903-EDIT@TBD-D5]（afterEach: SEED再適用）				
m09-03_admin_content_content_layout	E2E-M0903C-009	IT-25	画面レイアウト	P1	未使用（section=0）行とblock_id欠落行は配置として保存されない（非UI直POST）	ログイン済／SEED-M0903-EDIT	POST /content/layout/900000931/edit（§6.1契約・正規admin_layout[_token]）: name=`E2E-<runid>-除外`・DeviceType=10・block_id_0=既存ブロックid&section_0=0&block_row_0=0（未使用行）・section_1=6&block_row_1=0（block_id_1を送らない=欠落行）	1. 直接POST送信 2. リダイレクト（保存成功）を確認 3. db.tsで dtb_block_position(layout_id=900000931) 件数=0 を照会（afterEach: SEED再適用）	保存自体は成功し、未使用行・block_id欠落行のいずれも配置行として作成されない（件数0）。※存在しないblock_idの送信はBC-DRAFT-M0903-01（要実機）＝本行では試験しない。※本行が実証するのは除外規則（L1-026）のみで、018/060の「ブロック存在・重複・配置先妥当性のサーバ判定」観点はDOC-DRAFT-M0903-01（未解決）＝**partial/unresolved会計**（本行のbound完了に含めない=R1是正M3/M4） [L1:L1-M0903-026,L1-M0903-028; fixture:SEED-M0903-EDIT@TBD-D5]				
m09-03_admin_content_content_layout	E2E-M0903C-010	IT-12	画面レイアウト	P2	行番号=クライアント0始まり再採番で送信されDBのblock_rowに保存	ログイン済／SEED-M0903-EDIT	2ブロックを同一セクション(#position_6)に配置	1. 編集画面で#position_6内2ブロックのinput.block-row値を読む（0,1） 2. 登録押下 3. db.tsで dtb_block_position(layout_id=900000931, section=6) のblock_rowをblock_id別に照会	hidden block_rowが文書順0,1・保存後DBのblock_rowも0,1（0始まり連番） [L1:L1-M0903-016,L1-M0903-027; fixture:SEED-M0903-EDIT@TBD-D5]（afterEach: SEED再適用）				
m09-03_admin_content_content_layout	E2E-M0903C-011	IT-26	更新内容	P1	ドラッグ＆ドロップで未使用→セクションへ移動でき保存でDBに反映	ログイン済／SEED-M0903-EDIT	未使用ブロック1件を#position_3(#header)へdragTo	1. 編集画面で未使用欄の先頭ブロックを#position_3へPlaywright drag操作 2. 当該ブロックのinput.target-id値=3・input.block-row=0を確認 3. 登録押下 4. db.tsで当該block_idの行(section=3, block_row=0)を照会（afterEach: SEED再適用）	D&Dでブロックが移動しhidden target-id=3へ更新・保存後dtb_block_positionに(section=3,block_row=0)行が存在（観測の確定はDB） [L1:L1-M0903-015,L1-M0903-027; fixture:SEED-M0903-EDIT@TBD-D5]				
m09-03_admin_content_content_layout	E2E-M0903C-012	IT-26	更新内容	P1	コンテキストメニュー「上に移動」「下に移動」で同一セクション内入替→保存でblock_row入替	ログイン済／SEED-M0903-EDIT（section=6にblock_row=0,1の2件）	下側ブロックの三点メニュー→「上に移動」	1. 編集画面で下側（block_row=1）ブロックの.block-context-menu押下 2. ポップオーバーの「上に移動」押下 3. 表示順が入れ替わりinput.block-rowが再採番されることを確認 4. 登録押下 5. db.tsで両block_idのblock_rowを照会（afterEach: SEED再適用）	表示順入替＋保存後のblock_rowが入替済み（旧1→0・旧0→1） [L1:L1-M0903-017,L1-M0903-018,L1-M0903-016; fixture:SEED-M0903-EDIT@TBD-D5]				
m09-03_admin_content_content_layout	E2E-M0903C-013	IT-26	更新内容	P1	「セクションに移動」モーダルで移動先を選び保存でsectionが変わる	ログイン済／SEED-M0903-EDIT	移動先=#footer(target_id=10)	1. 配置ブロックの三点メニュー→「セクションに移動」押下 2. モーダル（見出し「ブロックを移動」）で#footerを選択し「移動」押下 3. ブロックが#position_10へ移りinput.target-id=10を確認 4. 登録押下 5. db.tsで当該block_idのsection=10を照会（afterEach: SEED再適用）	モーダル選択で移動・保存後DBのsection=10・行番号再採番 [L1:L1-M0903-019,L1-M0903-027; fixture:SEED-M0903-EDIT@TBD-D5]				
m09-03_admin_content_content_layout	E2E-M0903C-014	IT-23	検索	P2	未使用ブロック検索が部分一致で絞り込み表示しサーバ送信しない	ログイン済／SEED-M0903-EDIT	検索文字列=未使用欄の実在ブロック名の部分文字列／2回目=`zzz-not-exist`	1. 編集画面で#search-blockへ実在名の一部を入力 2. 一致ブロックが表示(show)・不一致ブロックが非表示(hide)を確認 3. page.on(request)で入力中にサーバへのリクエストが発生しないことを確認 4. `zzz-not-exist`入力で全未使用ブロック非表示を確認 5. 空に戻すと全件再表示	一致のみ表示・不一致非表示・サーバ問い合わせ0件・空入力で全件表示（クライアント側のみ） [L1:L1-M0903-020; fixture:SEED-M0903-EDIT@TBD-D5]				
m09-03_admin_content_content_layout	E2E-M0903C-015	IT-05	削除	P1	割当なしレイアウトの削除実行→「削除しました」・一覧へ・DB行と配置行消滅	ログイン済／SEED-M0903-DEL	—	1. 一覧でSEED-DELカードの「レイアウトを削除」押下 2. モーダルの削除実行（token-for-anchor正規トークン+_method=delete）押下 3. フラッシュと遷移先（一覧）を確認 4. 一覧に当該カードが無いことを確認 5. db.tsで dtb_layout(id=900000932) と dtb_block_position(layout_id=900000932) の不存在を照会（afterEach: SEED再適用）	「削除しました」＋一覧へ戻る＋DB本体行・配置行とも消滅（削除可能=割当ページ0件のとき削除される） [L1:L1-M0903-037,L1-M0903-036; fixture:SEED-M0903-DEL@TBD-D5]				
m09-03_admin_content_content_layout	E2E-M0903C-016	IT-05	削除条件	P1	割当ページありレイアウトの削除→警告フラッシュ・削除されず一覧に残存	ログイン済／SEED-M0903-ASSIGNED	—	1. 一覧でSEED-ASSIGNEDの削除→モーダル実行 2. 警告フラッシュ文言を読む 3. 一覧に当該カードが残ることを確認 4. db.tsで dtb_layout(id=900000933) 残存を照会	「関連するデータがあるため「E2E-M0903割当あり」を削除できませんでした」＋一覧へ＋DB残存（割当ページが1件でもあると削除しない） [L1:L1-M0903-036; fixture:SEED-M0903-ASSIGNED@TBD-D5]				
m09-03_admin_content_content_layout	E2E-M0903C-017	IT-25	確認ダイアログ	P2	削除モーダル=押下で開き対象名差込文言・キャンセルで閉じ削除されない	ログイン済／SEED-M0903-DEL	—	1. SEED-DELカードの削除ボタン押下 2. #DeleteModalが開き見出しh5と p.modal-message を読む 3. キャンセル(data-bs-dismiss)押下でモーダルが閉じることを確認 4. db.tsで dtb_layout(id=900000932) 残存を照会	見出し「削除します」・本文「この操作はあとから取り消すことができません。「E2E-M0903削除対象」を削除してよろしいですか？」（data-message差込）・キャンセルで閉じDB不変 [L1:L1-M0903-009; fixture:SEED-M0903-DEL@TBD-D5]				
m09-03_admin_content_content_layout	E2E-M0903C-018	IT-15	CSRF	P1	token不正のDELETE→HTTP403・不存在idの正規DELETE→HTTP404・DB不変（非UI）	ログイン済セッション（同一context）／SEED-M0903-DEL	DELETE /content/layout/900000932/delete（_token=正規値の末尾1文字置換）／DELETE /content/layout/900000999/delete（正規_token・不存在id）（§6.1契約）	1. 改変tokenでDELETE送信→status確認 2. db.tsで900000932残存確認 3. 正規tokenで不存在idへDELETE送信→status確認	改変token=HTTP403（AccessDeniedHttpException 'CSRF token is invalid.'）・不存在id=HTTP404・行は削除されない（削除対象・トークンのサーバ側判定。※「初期データ削除制限」のサーバ判定は実装に確認できず=DOC-DRAFT-M0903-02（未解決）・064の当該観点は**partial/unresolved会計**＝本行の対象外・bound完了に含めない） [L1:L1-M0903-035; fixture:SEED-M0903-DEL@TBD-D5]				
m09-03_admin_content_content_layout	E2E-M0903C-019	IT-22	必須	P1	レイアウト名空で登録→「入力されていません。」・行が追加されない	ログイン済	name=空・DeviceType=PC(10)	1. 新規画面で名称空のまま登録押下（HTML required無しのため送信到達） 2. 名称欄直下のエラー文言を読む 3. db.tsで dtb_layout に`E2E-<runid>`系の行が無いことを照会	「入力されていません。」が名称欄直下に表示・保存されずDB行追加なし [L1:L1-M0903-022]				
m09-03_admin_content_content_layout	E2E-M0903C-020	IT-22	必須	P1	端末種別未入力（非UI直POST）→検証エラー・行が追加されない	ログイン済	POST /content/layout/new（§6.1契約・正規_token）: admin_layout[name]=`E2E-<runid>-dt空`・admin_layout[DeviceType]=""	1. 直接POST送信 2. 応答HTMLが編集画面再表示（リダイレクトなし）でエラーを含むことを確認 3. db.tsで当該nameの行が無いことを照会	保存されず検証エラー（DeviceType欄）・DB行追加なし（required=falseでもNotBlankで拒否） [L1:L1-M0903-023]				
m09-03_admin_content_content_layout	E2E-M0903C-021	IT-26	登録内容	P1	レイアウト名255字（DB列長上限）で新規保存成功・DB文字長=255	ログイン済	name=runFill(255,ascii,"E2E-<runid>-")・DeviceType=PC(10)	1. 新規登録送信 2. フラッシュ確認 3. リダイレクトidでdb.ts char_length(layout_name)照会（afterEach: id削除）	保存成功＋DB文字長=255（Form側Length制約なし・上限はDB列長） [L1:L1-M0903-024,L1-M0903-029]				
m09-03_admin_content_content_layout	E2E-M0903C-022	IT-26	登録内容	P1	レイアウト名256字（DB列長+1）は行が追加されない（DB層拒否・応答提示は要実機）	ログイン済	name=runFill(256,ascii,"E2E-<runid>-")・DeviceType=PC(10)	1. 新規登録送信 2. db.tsで当該prefix行が存在しないことを照会 3. 応答の提示（エラー画面等）を記録する（期待値は立てない=要実機）	dtb_layoutに行が追加されない見込み（varchar(255)超過のDB層拒否は**スキーマ由来の推定**であり実走未確認）。画面応答の形は一次資料に規定なし。**本行はpartial/unresolved会計（D6/実機確認まで完了として数えない=R1是正M4）** [L1:L1-M0903-024]				
m09-03_admin_content_content_layout	E2E-M0903C-023	IT-26	登録内容	P1	レイアウト名1字（最小）で新規保存成功	ログイン済	name=`E`（1字）・DeviceType=PC(10)	1. 新規登録送信 2. フラッシュ・リダイレクト確認 3. db.tsでlayout_name=`E`の当該id行を照会（afterEach: id削除）	保存成功＋DB値=入力値（NotBlank以外の下限制約なし） [L1:L1-M0903-022,L1-M0903-024,L1-M0903-029]				
m09-03_admin_content_content_layout	E2E-M0903C-024	IT-26	更新内容	P1	更新経路で255字へ変更→DB値が変更される	ログイン済／SEED-M0903-EDIT	name=runFill(255,ascii,"E2E-<runid>-")	1. 編集画面(900000931)で名称を255字に変更し登録 2. フラッシュ確認 3. db.tsで char_length(layout_name)=255 を照会（afterEach: SEED再適用）	「保存しました」＋DB文字長=255（値が変更される） [L1:L1-M0903-024,L1-M0903-029; fixture:SEED-M0903-EDIT@TBD-D5]				
m09-03_admin_content_content_layout	E2E-M0903C-025	IT-26	更新内容	P1	更新経路で256字→DB値が変更されない（旧値のまま・応答提示は要実機）	ログイン済／SEED-M0903-EDIT	name=runFill(256,ascii,"E2E-<runid>-")	1. db.tsで更新前layout_nameを記録 2. 編集画面で256字に変更し登録 3. db.tsで再照会し旧値のままを確認（応答の提示は記録のみ・assertしない=要実機）	dtb_layout.layout_nameが更新前の値のままの見込み（DB層拒否は**スキーマ由来の推定**・実走未確認）。**本行はpartial/unresolved会計（R1是正M4）** [L1:L1-M0903-024; fixture:SEED-M0903-EDIT@TBD-D5]（afterEach: SEED再適用）				
m09-03_admin_content_content_layout	E2E-M0903C-026	IT-26	更新内容	P1	更新経路で1字へ変更→DB値が変更される	ログイン済／SEED-M0903-EDIT	name=`E`	1. 編集画面で名称を1字に変更し登録 2. フラッシュ確認 3. db.tsでlayout_name=`E`を照会（afterEach: SEED再適用）	「保存しました」＋DB値=1字の入力値 [L1:L1-M0903-022,L1-M0903-029; fixture:SEED-M0903-EDIT@TBD-D5]				
m09-03_admin_content_content_layout	E2E-M0903C-027	IT-22	必須	P1	更新経路で名称空→「入力されていません。」・DB値が変更されない	ログイン済／SEED-M0903-EDIT	name=空	1. db.tsで更新前layout_nameを記録 2. 編集画面で名称を空にし登録 3. エラー文言を読む 4. db.tsで再照会	「入力されていません。」表示＋dtb_layout.layout_nameが更新前の値のまま [L1:L1-M0903-022; fixture:SEED-M0903-EDIT@TBD-D5]				
m09-03_admin_content_content_layout	E2E-M0903C-028	IT-25	HTTPステータス	P2	コードプレビュー=AjaxでJSON{id,source}を取得しモーダルのエディタへ表示	ログイン済／SEED-M0903-EDIT	view_block?id=配置済みブロックid（Ajax・§6.1契約）	1. 編集画面で配置ブロックの三点メニュー→「コードプレビュー」押下 2. page.on(response)で /content/layout/view_block 応答（HTTP200・JSONのid/sourceキー）を捕捉 3. #codePreviewモーダルの#block-source-code（aceエディタ）に応答sourceが表示されることを確認	HTTP200のJSON{id,source}が返り、モーダル内読み取り専用エディタへテンプレートソースが表示される [L1:L1-M0903-039,L1-M0903-040,L1-M0903-041; fixture:SEED-M0903-EDIT@TBD-D5]				
m09-03_admin_content_content_layout	E2E-M0903C-029	IT-05	削除条件	P1	view_blockの防御=非Ajax400・id無し400・不存在id404（非UI）	ログイン済	GET /content/layout/view_block?id=1（X-Requested-Withなし）／同ヘッダ付きid無し／同ヘッダ付きid=999999999（§6.1契約）	1. request APIで3通りをGET 2. 各statusを読む	非Ajax=HTTP400・id無し=HTTP400・ブロック不存在=HTTP404（Ajax要求か・ID存在か・読込可能かのサーバ側判定） [L1:L1-M0903-039]				
m09-03_admin_content_content_layout	E2E-M0903C-030	IT-25	確認ダイアログ	P1	画面プレビュー=別タブでpreview=1のフロント画面・フラッシュなし・保存先はid0（S0復元）	ログイン済／SEED-M0903-ASSIGNED／S0スナップショット取得済み	Page=割当ページを選択	1. 編集画面(900000933)でプレビュー対象ページを選択 2. プレビュー押下でpopup（別タブ）を捕捉しURLに`preview=1`が付くこと・選択ページ種別のフロントURLであることを確認 3. 元タブのform1 actionが編集URL・target=_selfへ戻ることを確認 4. 「保存しました」フラッシュが出ないことを確認 5. db.tsで dtb_layout(id=0).layout_name が送信値へ更新されたこと・dtb_block_position(layout_id=0)が送信構成であることを照会 6. **S0記録値でid0本体を全列UPDATE・配置をDELETE→全列INSERTで復元し、全列比較のS0同値を検証**（afterEach必須・update_dateはpreUpdateで書き換わるため全列復元でのみ同値化=R1是正B2）	別タブでプレビュー付きフロント画面・フラッシュなし・更新されるのはid0（編集中900000933のDB行は不変） [L1:L1-M0903-031,L1-M0903-032,L1-M0903-033; fixture:SEED-M0903-ASSIGNED@TBD-D5]				
m09-03_admin_content_content_layout	E2E-M0903C-031	IT-12	エラー継続	P1	プレビューでページ未選択→アラート表示・送信されない	ログイン済／SEED-M0903-ASSIGNED	Page=未選択	1. 編集画面でページ未選択のままプレビュー押下 2. dialogイベントでalert文言を捕捉 3. page.on(request)で /preview へのPOSTが発生しないことを確認 4. 画面が編集画面のままであることを確認	alert「プレビューするページを選択してください」・送信せず現在の画面に留まる（クライアント側中止） [L1:L1-M0903-033; fixture:SEED-M0903-ASSIGNED@TBD-D5]				
m09-03_admin_content_content_layout	E2E-M0903C-032	IT-05	削除条件	P1	プレビューのページ存在判定（404）＝到達可能条件が一次資料から立証できず**要実機**	ログイン済／SEED-M0903-ASSIGNED	（到達可能条件の確定後に設計）	（R1是正B1: 前版の「admin_layout[Page]=999999999→404」は誤り。不存在Page idはEntityType choices検証〔LayoutType.php:60-71〕でフォーム不成立となり、404分岐〔LC:156-162〕は`$form->isValid()`通過後にのみ到達する〔LC:130〕。空Page("")は検証を通るが`find('')`の挙動はソース単独で未確定）	ページ存在のサーバ側判定（404）の到達可能条件を実機で確定するまで実行しない [L1:L1-M0903-032]（実行可能グレード対象外=fixme相当・**要実機**）				
m09-03_admin_content_content_layout	E2E-M0903C-033	IT-22	画面レイアウト	P2	編集の表示要素=概要カード（名称+必須バッジ・端末種別）・12セクション枠+未使用欄・プレースホルダ	ログイン済／SEED-M0903-EDIT	—	1. 編集画面を開く 2. 概要カード内の名称入力欄・「必須」バッジ・端末種別（既存編集=テキスト表示+hidden）を確認 3. #position_1〜#position_12の12枠と#position_0（未使用欄）の存在・各枠見出し（`<head></head>タグ内`・`#header`等）を読む 4. 空セクションに「ブロックをドラッグ＆ドロップ」プレースホルダを確認	概要カードに名称欄+必須バッジ+端末種別（hidden保持）・12セクション枠+未使用欄・空枠にプレースホルダが表示される [L1:L1-M0903-012,L1-M0903-013,L1-M0903-014; fixture:SEED-M0903-EDIT@TBD-D5]				
```

### §4.2 補完行（5行。**親test_idなし・母集合会計に算入しない**。理由=設計書補完〔一次資料に規定があるが母集合88行の期待テキストに対応する親が存在しない〕）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m09-03_admin_content_content_layout	E2E-M0903C-101	IT-15	未認証	P1	未認証で各URL直接アクセス→管理ログインへ	未ログイン（cookie無しrequest）	GET /content/layout／GET /content/layout/new／DELETE /content/layout/900000932/delete（cookie無し）	1. 認証cookie無しで各URLへアクセス 2. 応答を確認	いずれもadmin_loginへ誘導され本機能へ到達しない [L1:L1-M0903-001]（補完行・親test_idなし・設計書補完）				
m09-03_admin_content_content_layout	E2E-M0903C-102	IT-20	異常系	P2	編集の不存在id→HTTP404（非UI）	ログイン済	GET /content/layout/900000999/edit	1. request APIでGET 2. statusを読む	HTTP404（存在しないとして扱う） [L1:L1-M0903-010]（補完行・親test_idなし・設計書補完）				
m09-03_admin_content_content_layout	E2E-M0903C-103	IT-25	更新抑止	P2	既定レイアウト（id1・2）は一覧で削除ボタン非表示・SEEDには表示	ログイン済／SEED-M0903-DEL	—	1. 一覧を開く 2. id1（トップページ用レイアウト）・id2（下層ページ用レイアウト）カードに削除ボタンが無いことを確認 3. SEED-DELカードに削除ボタンがあることを確認	既定カードに「レイアウトを削除」ボタンなし・非既定にはあり（UI出し分け。サーバ側の既定判定は無い=DOC-DRAFT-M0903-02） [L1:L1-M0903-006,L1-M0903-038; fixture:SEED-M0903-DEL@TBD-D5]（補完行・親test_idなし・設計書補完）				
m09-03_admin_content_content_layout	E2E-M0903C-104	IT-25	画面レイアウト	P3	プレースホルダの挿抜=ブロック投入で除去・空化で再表示	ログイン済／SEED-M0903-EDIT	—	1. 編集画面で空セクション#position_1のプレースホルダ存在を確認 2. ブロックを#position_1へD&D→プレースホルダ除去を確認 3. 同ブロックを未使用欄へ戻す→プレースホルダ再表示を確認（保存しない）	空セクションのみプレースホルダ表示（投入で除去・空化で挿入。クライアント側のみ・DB不変） [L1:L1-M0903-014,L1-M0903-015; fixture:SEED-M0903-EDIT@TBD-D5]（補完行・親test_idなし・設計書補完）				
m09-03_admin_content_content_layout	E2E-M0903C-105	IT-26	登録内容	P2	新規保存でcreate_date/update_dateが自動設定される	ログイン済	name=`E2E-<runid>-dt`・DeviceType=PC(10)	1. db.tsでT1=SELECT now() 2. 新規登録送信 3. リダイレクトid取得 4. db.tsでcreate_date/update_date照会（afterEach: id削除）	両列が設定され T1≦値≦照会時now()（ブラケット法・Doctrine prePersist） [L1:L1-M0903-043]（補完行・親test_idなし・設計書補完）				
```

### §4.3 -EN行（8行。LS=1 claimのlocale多重・対応ja行と同一親）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m09-03_admin_content_content_layout	E2E-M0903C-002-EN	IT-25	画面レイアウト	P2	一覧見出し・新規作成・未割当文言（en）	ログイン済／SEED-M0903-EDIT／locale=en	—	同C-001/C-002	"Layouts"・"Contents"・"Create New"・割当なし展開に "Page not registered" [L1:L1-M0903-008,L1-M0903-007]				
m09-03_admin_content_content_layout	E2E-M0903C-005-EN	IT-26	登録内容	P2	保存成功フラッシュ（en）	ログイン済／locale=en	同C-005	同C-005	"Saved" [L1:L1-M0903-029]				
m09-03_admin_content_content_layout	E2E-M0903C-015-EN	IT-05	削除	P2	削除成功フラッシュ（en）	ログイン済／SEED-M0903-DEL／locale=en	—	同C-015	"Deleted" [L1:L1-M0903-037]				
m09-03_admin_content_content_layout	E2E-M0903C-016-EN	IT-05	削除条件	P2	削除拒否警告（en）	ログイン済／SEED-M0903-ASSIGNED／locale=en	—	同C-016	"Sorry, we are unable to delete E2E-M0903割当あり, because it has related data." [L1:L1-M0903-036]				
m09-03_admin_content_content_layout	E2E-M0903C-017-EN	IT-25	確認ダイアログ	P2	削除モーダル（en）	ログイン済／SEED-M0903-DEL／locale=en	—	同C-017	"Delete"・"You can not revert this action. Are you sure to delete E2E-M0903削除対象?" [L1:L1-M0903-009]				
m09-03_admin_content_content_layout	E2E-M0903C-019-EN	IT-22	必須	P2	名称必須エラー（en）	ログイン済／locale=en	同C-019	同C-019	"No value found." [L1:L1-M0903-022]				
m09-03_admin_content_content_layout	E2E-M0903C-031-EN	IT-12	エラー継続	P2	プレビュー未選択アラート（en）	ログイン済／SEED-M0903-ASSIGNED／locale=en	—	同C-031	alert "Please select a page for preview"（en辞書messages.en.yaml:2573逐語を候補値として置く。md:206のen列は日本語のままで**矛盾・未解決=DOC-DRAFT-M0903-03**＝どちらを正とするかはD6/正式化で裁定・本行は未解決マーク付き） [L1:L1-M0903-033]				
m09-03_admin_content_content_layout	E2E-M0903C-033-EN	IT-22	画面レイアウト	P2	編集画面の文言一式（en）	ログイン済／SEED-M0903-EDIT／locale=en	—	同C-033＋三点メニュー展開	セクション見出し "Within the <head></head> tags"・"#header" 等・プレースホルダ "Drag & Drop a Block"・必須バッジ "Required"・コンテキストメニュー "Move up"/"Move Down"/"Move to Section"/"Preview Codes" [L1:L1-M0903-013,L1-M0903-014,L1-M0903-012,L1-M0903-017]				
```

## §5 locale対応表

LS=1: 13claim（L1-007/008/009/012/013/014/017/019/022/029/033/036/037）→ **-EN 8行**（§4.3）。
-EN行を作らないLS=1: L1-019（セクション移動モーダル文言=単独caseなし・C-013の部品。ja/en逐語は§1に確定）・L1-041（コードプレビューモーダル補足文言=C-028の部品。ja:2888-2890/en:2575-2577確定済み）。
en文言はすべてen一次資料逐語（messages.en.yaml/validators.en.yaml。ja翻訳ゼロ）。-EN実行前提はD15（M0 Go/No-Go）。
DOC-DRAFT-M0903-03（未解決）: 設計書md:206の英語列（日本語のまま）とmessages.en.yaml:2573が矛盾。C-031-ENはen辞書逐語を候補値として置くが、どちらを正とするかは本候補単独で確定せずD6/正式化で裁定する（テストケースが正の原則）。

## §6 判定手段骨子（候補=未実装）＋db.ts配置照会＋_drafts隔離lint証跡

### §6.1 request契約

- 保存直POST: `POST /%eccube_admin_route%/content/layout/new`／`…/{id}/edit`（urlencoded）。フィールド=`admin_layout[name]`・`admin_layout[DeviceType]`（値=mtb_device_type id: PC=10/MB=2）・`admin_layout[Page]`（任意）・`admin_layout[_token]`（lt:193）＋フラット連番`name_<n>`・`block_id_<n>`・`section_<n>`・`block_row_<n>`（lb:24-27／lt:462-471）。
- 削除: `DELETE`相当=`POST /content/layout/{id}/delete` with `_token`＋`_method=delete`（`csrf_token_for_anchor()`＝ll:109・fnjs:161-177の裏フォーム再現）。token改変=正規値の末尾1文字置換。
- プレビュー: `POST /content/layout/{id}/preview`（保存POSTと同フィールド＋`admin_layout[Page]`必須相当）。
- view_block: Playwright request APIのGET＋ヘッダ`X-Requested-With: XMLHttpRequest`（isXmlHttpRequest判定=LC:195）。非Ajax試験は同ヘッダ無しで送る。
- 未実装・実走なし（候補規律）。ログイン済みcontextのcookie共有で送信（m09-01と同方式）。

### §6.2 db.ts配置照会（三段参照・SEED値を期待の正にしない）

- 本体: `SELECT layout_name, device_type_id FROM dtb_layout WHERE id=<id>`／文字長=`char_length(layout_name)`。
- 配置: `SELECT block_id, section, block_row FROM dtb_block_position WHERE layout_id=<id> ORDER BY section, block_row`（配置の観測はUI drag-drop後の**保存後DB**で確定）。件数=`COUNT(*)`。
- 一覧順序の突合: `SELECT id FROM dtb_layout WHERE id <> 0 ORDER BY device_type_id DESC, id ASC`（L1-003のquery規則を照会側でも再現し、画面順序と比較。期待の正はL1-003）。
- S0（R1是正B2=全列）: `SELECT id, layout_name, device_type_id, create_date, update_date FROM dtb_layout WHERE id IN (0,1,2)`＋`SELECT section, block_id, layout_id, block_row FROM dtb_block_position WHERE layout_id=0`（全列）を試験前に記録→C-030後に、dtb_layout id0を**全列UPDATE**（create_date/update_date含む）・配置を**DELETE→全列INSERT**で復元→**全列比較の同値検証**（update_dateはpreUpdate〔SaveEventSubscriber.php:62-74〕で書き換わるため全列復元が必須）。
- 既存 `e2e/helpers/db.ts`（queryScalar/queryNumber・docker exec psql・E2E_DB_*上書き）をそのまま使用。書込はSEED適用/afterEach復元のcleanup限定。

### §6.3 _drafts/隔離lintの実施証跡（実測・実施済み）

1. 正式消費側（`e2e/helpers/oracle.ts`・spec・pages）に本草案を消費する参照は**0件**（隔離ガード自体のリテラル`_drafts`〔oracle.ts:17,20実在〕を除く。ガードは`_drafts`・パス区切り・`..`を含むfileKeyの解決をthrowで拒否する機械強制）。
2. 正式パス（`e2e/fixtures/oracle/*.json`・`e2e/spec/**`・`e2e/pages/**`）は**未変更**。本waveの生成物は`_drafts/`の2ファイルのみ。
3. 既存の参考物（`e2e/spec/admin/m09/m09_03_*.spec.ts`・`integration_test/e2e/m09_03_admin_content_content_layout_e2e_cases.md`）は読取参照のみで不変。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

- Playwright（GUI）: C-002・C-003・C-014・C-017・C-031・C-033・C-103・C-104。
- Playwright+DB確認（db.ts）: C-001・C-004〜C-013・C-015・C-016・C-019〜C-027・C-030・C-105。
- 非UI（request契約）: C-004（併用）・C-009・C-018・C-020・C-029・C-101・C-102。
- **要実機**: **C-032（プレビュー404の到達可能条件が一次資料から立証不能=R1是正B1・実行対象外）**・C-022/C-025（256字時の画面応答が一次資料に規定なし、かつDB層拒否自体もスキーマ由来の推定=partial）・BC-DRAFT-M0903-01（不存在block_id送信の実挙動=DB制約・応答とも未確認・断定なし）・DOC-DRAFT-M0903-02関連（既定レイアウトのサーバ直DELETE実挙動=未実証）・D&D/ポップオーバーのPlaywright操作安定性（sortable/popoverの実DOM挙動）。
- **実行保留**: -EN 8行（D15）。
- 並行実行注意: **本機能はserial必須**（一覧全件突合C-001・S0同値検査C-030/C-032が他テストの書込と衝突。SEED再適用・id0復元をafterEachで担保）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（観点ラベル・前提ラベルはノイズ=前提列は設計書subject名の機械循環。前提が期待テキストと整合する場合のみ配分の参考）。1候補ケース行=1 assertion bundle・多対一は`shared-observation`・-EN行は対応ja行と同一親のlocale多重。**参照先の全候補行は§4に実体掲載済み＝88↔候補の期待テキスト突合が本文内で完結する**。

### 集計（88 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound（完全）** | **62** | 下表（読み替え・partialを**含まない**） |
| **読み替えbound（別掲=R1是正M5）** | **16** | 016・017・019〜032（per-ID表=§9.3。原文期待からの距離を別会計で明示・妥当性はD6/正式化で再裁定） |
| **partial/unresolved（別掲=R1是正M4）** | **6** | 018・060・064（DOC-DRAFT-01/02未解決の観点部分）・043・055（DB層拒否=スキーマ推定・応答未確定）・063（ページ存在判定の到達性未立証=R1是正B1）。**D6/実機確定までbound完了に数えない**（§9.1） |
| **TBD** | **0** | — |
| **excluded** | **4** | EX-B 相関バリデーション4（012〜015。LayoutType実引き=相関constraint不存在） |
| 合計 | **88** | 62＋16＋6＋0＋4＝88・欠落0・理由なし重複0 |

- 候補ケース行総数**46**（§4.1 bound対応33＋§4.2 補完5＋§4.3 -EN 8）。

### 88対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 端末種別降順・id昇順で一覧表示 | bound | C-001 |
| 002 | 空のレイアウト編集画面を開く | bound | C-003 |
| 003 | 検証を通れば新規レイアウトと配置を保存し編集画面へリダイレクト | bound | C-005 |
| 004 | 指定レイアウトの編集画面を開く（非UI） | bound | C-004 |
| 005 | 検証を通れば名称と配置を更新し同じ編集画面へリダイレクト（非UI） | bound | C-007 |
| 006 | 削除可能なら削除し一覧へ戻る | bound | C-015 |
| 007 | ページ種別に応じたフロント画面をプレビュー付き別タブで開く | bound | C-030 |
| 008 | Ajaxでテンプレートソース JSON→モーダルのエディタへ | bound | C-028 |
| 009 | 必須バリでエラー表示・完了しない | bound | C-019,C-020,C-027 |
| 010 | 必須バリでエラー表示されず継続 | bound | C-005 (shared・有効値で成功) |
| 011 | 概要カードに名称欄と端末種別・編集カードにセクション枠と未使用欄 | bound | C-033 |
| 012 | 相関バリでエラー・完了しない | **excluded** EX-B | — |
| 013 | 相関バリでエラーなく継続 | **excluded** EX-B | — |
| 014 | 相関バリでエラーなく継続 | **excluded** EX-B | — |
| 015 | 相関バリでエラー・完了しない | **excluded** EX-B | — |
| 016 | DBとの相関バリでエラーなく継続 | bound(**読み替え**) | C-015（割当ページ0件=DB状態が削除条件に該当→エラーなく削除継続。§9.3） |
| 017 | DBとの相関バリでエラー・完了しない | bound(**読み替え**) | C-016（割当ページあり=DB状態該当せず→警告・削除完了しない。§9.3） |
| 018 | ブロック存在・レイアウト存在・配置先妥当性・重複はサーバ側で保存時判定 | **partial**(未解決・要実機) | C-009（実証できるのは除外規則のみ。存在/重複/範囲検証は実装に確認できず=DOC-DRAFT-M0903-01**未解決**・不正block_id実挙動はBC-DRAFT-M0903-01要実機。bound完了に数えない） |
| 019 | 検索条件該当→取得結果に含まれる | bound(**読み替え**) | C-001 (shared・id≠0のSEEDレイアウトが一覧に含まれる) |
| 020 | 検索条件非該当→含まれない | bound(**読み替え**) | C-001 (shared・id0が一覧に含まれない) |
| 021 | 該当→含まれる | bound(**読み替え**) | C-014 (shared・検索一致ブロックが表示に含まれる) |
| 022 | 非該当→含まれない | bound(**読み替え**) | C-014 (shared・不一致ブロック非表示) |
| 023 | 該当→含まれる | bound(**読み替え**) | C-001 (shared) |
| 024 | 非該当→含まれない | bound(**読み替え**) | C-001 (shared) |
| 025 | 該当→含まれる | bound(**読み替え**) | C-014 (shared) |
| 026 | 非該当→含まれない | bound(**読み替え**) | C-014 (shared) |
| 027 | 該当→含まれる | bound(**読み替え**) | C-001 (shared) |
| 028 | 非該当→含まれない | bound(**読み替え**) | C-001 (shared) |
| 029 | 該当→含まれる | bound(**読み替え**) | C-014 (shared) |
| 030 | 非該当→含まれない | bound(**読み替え**) | C-014 (shared) |
| 031 | 該当→含まれる | bound(**読み替え**) | C-001 (shared) |
| 032 | 非該当→含まれない | bound(**読み替え**) | C-001 (shared) |
| 033 | 実行結果の該当レコードが取得結果に含まれる（削除可否前提） | bound | C-016 (shared・削除不可→一覧/DBに残存し続ける) |
| 034 | 含まれる（再構築前提） | bound | C-008 (shared・再作成後の配置行がDBに存在) |
| 035 | 含まれる（未使用扱い前提） | bound | C-009 (shared・配置対象行のみが結果に含まれる) |
| 036 | 含まれる（行番号前提） | bound | C-010 (shared・block_row=0始まり行が存在) |
| 037 | 登録内容の対象レコードが追加される | bound | C-005 |
| 038 | 追加され**ない**（ブロック配置前提） | bound | C-006,C-009（未使用行は配置として追加されない） |
| 039 | 追加される（配置なし新規前提） | bound | C-006（layout行は追加・配置0件） |
| 040 | 配置行を1件も作らない | bound | C-006 (shared) |
| 041 | 追加される（一覧前提=ノイズ） | bound | C-005 (shared) |
| 042 | 最大長で追加される | bound | C-021（255字=DB列長） |
| 043 | 最大長+1で追加され**ない** | **partial**(未解決・要実機) | C-022（DB層拒否はスキーマ由来の推定・実走未確認。画面応答も要実機。bound完了に数えない） |
| 044 | 最小長で追加される | bound | C-023（1字） |
| 045 | 最小長-1で追加され**ない** | bound | C-019 (shared・空=必須エラーで追加なし) |
| 046 | 追加される（削除前提=ノイズ・C4記録=§10） | bound | C-005 (shared) |
| 047 | 実行結果の対象レコードが追加される（プレビュー押下前提） | bound | C-030 (shared・プレビュー保存でid0の配置行が作られる) |
| 048 | AjaxでJSON→モーダル表示 | bound | C-028 (shared) |
| 049 | 更新内容の値が変更される（一覧表示要素前提） | bound | C-007 (shared・改名が一覧カードに反映) |
| 050 | 変更され**ない**（削除モーダル前提） | bound | C-017（キャンセルでDB不変） |
| 051 | 変更される（編集表示要素前提） | bound | C-007 (shared) |
| 052 | jQuery UI sortableでセクション枠と未使用欄のあいだをドラッグ移動できる | bound | C-011 |
| 053 | 変更される（コンテキストメニュー前提） | bound | C-012,C-013 |
| 054 | 最大長で変更される | bound | C-024 |
| 055 | 最大長+1で変更され**ない** | **partial**(未解決・要実機) | C-025（DB旧値のままはスキーマ由来の推定・実走未確認。画面応答も要実機。bound完了に数えない） |
| 056 | 最小長で変更される | bound | C-026 |
| 057 | 最小長-1で変更され**ない** | bound | C-027（空=必須エラー・旧値のまま） |
| 058 | 変更される（D&D完了前提） | bound | C-011 (shared・保存でDB反映) |
| 059 | 実行結果の値が変更される（上下移動前提） | bound | C-012（block_row入替） |
| 060 | 保存時にサーバ側で配置先と対象ブロックを検証 | **partial**(未解決・要実機) | C-009,C-013 (shared・実証できるのは除外規則と送信値保存のみ。「検証」の実装は確認できず=DOC-DRAFT-M0903-01**未解決**。bound完了に数えない) |
| 061 | 再検証なしであること | bound | C-014 (shared・検索入力でサーバ送信なし) |
| 062 | Ajax要求か・ブロックID存在か・読込可能かをサーバ側判定 | bound | C-029 |
| 063 | プレビュー表示可否・ページ存在・レイアウト反映内容はサーバ側判定 | **partial**(未解決・要実機) | C-030 (shared・反映内容=id0のDB反映は実証可能)。ページ存在判定（404）=C-032が**要実機**（不存在Page idはフォーム検証で弾かれ404分岐へ到達しない=R1是正B1・到達可能条件未立証。bound完了に数えない） |
| 064 | 削除対象・初期データ削除制限・トークン・権限はサーバ側判定 | **partial**(未解決・要実機) | C-018（トークン403・不存在404は実証可能）,C-101（権限=補完参照）。「初期データ削除制限」のサーバ判定は実装に確認できず=DOC-DRAFT-M0903-02**未解決**（要実機。bound完了に数えない） |
| 065 | 削除条件の対象レコードが削除状態にならない | bound | C-016,C-017 (shared・残存) |
| 066 | 削除状態になる | bound | C-015 (shared) |
| 067 | クライアント側で送信を中止する | bound | C-031 |
| 068 | 削除状態になる（保存しました前提=ノイズ・C4記録=§10） | bound | C-015 (shared) |
| 069 | 「削除しました」=レイアウトを削除したとき | bound | C-015 (shared・成功時のみフラッシュ) |
| 070 | 警告=割当ページがあるレイアウトを削除しようとしたとき | bound | C-016 (shared) |
| 071 | 「この操作は…」=一覧の削除確認モーダル内の文言 | bound | C-017 (shared) |
| 072 | 送信せず現在の画面に留まる（M09-03-MSG-001） | bound | C-031 (shared) |
| 073 | 割当ページが1件でもあるレイアウトは削除しない | bound | C-016 (shared) |
| 074 | 保存のたび既存配置を全削除し送信値から作り直す | bound | C-008 |
| 075 | 未使用（target_id0）行とブロックID不取得行は保存しない | bound | C-009 (shared) |
| 076 | 0始まり再採番の行番号（block_row）として送信し保存 | bound | C-010 (shared) |
| 077 | dtb_layout.layout_name（フォームキーname）であること | bound | C-005 (shared・保存先列の実証+§6.1 request契約) |
| 078 | dtb_block_position（block_id・section・block_row・layout_id）であること | bound | C-005,C-010 (shared・4列の保存実証) |
| 079 | 全ブロックを未使用ブロックとして表示 | bound | C-003 (shared) |
| 080 | 配置行を1件も作らない | bound | C-006 (shared) |
| 081 | 端末種別降順・id昇順で一覧表示 | bound | C-001 (shared) |
| 082 | 画面表示データでエラーなく継続（新規押下前提） | bound | C-003 (shared・エラーなし表示) |
| 083 | 新規保存→保存し編集画面へリダイレクト | bound | C-005 (shared) |
| 084 | 画面表示データでエラーなく継続（編集押下前提） | bound | C-004 (shared) |
| 085 | 編集保存→更新し同じ編集画面へリダイレクト | bound | C-007 (shared) |
| 086 | 削除可能なら削除し一覧へ戻る | bound | C-015 (shared) |
| 087 | カード表示・PC=デスクトップ/他=モバイルアイコン | bound | C-002 |
| 088 | 削除ボタン押下で確認モーダルを開く | bound | C-017 (shared) |

`func_scope_check` 判定: 親88/88会計済み（bound62＋読み替え16＋partial6＋TBD0＋excluded4＝88）・欠落0・理由なし重複0・補完5行は§4.2に実体掲載（親空・設計書補完・母集合会計外）→ **差分0を本文内で実証可能**。O6は主張しない。読み替え・partialはbound完了に数えない別掲会計（R1是正M4/M5）。

## §9 TBD・要実機・excluded・読み替え（正直な分離）

### §9.1 partial/unresolved（6件・per-ID）と要実機・実行保留

**partial/unresolved per-ID表（R1是正M4。D6/実機確定までbound完了に数えない）**:

| No | 未解決/推定の内容 | 実証済みの部分（bound側に数えない補助観測） |
|---|---|---|
| 018 | 存在・重複・配置先妥当性の「サーバ判定」=DOC-DRAFT-M0903-01（未解決）・不正block_id実挙動=BC-DRAFT-M0903-01（要実機） | C-009の除外規則（L1-026） |
| 060 | 「配置先と対象ブロックの検証」の実装が確認できず=DOC-DRAFT-M0903-01（未解決） | C-009/C-013の除外規則・送信値保存 |
| 064 | 「初期データ削除制限」のサーバ判定=DOC-DRAFT-M0903-02（未解決）。既定レイアウトへのサーバ直DELETE実挙動は要実機 | C-018のトークン403・不存在404 |
| 043 | 256字の「行が追加されない」=スキーマ（varchar(255)）由来の推定・実走未確認。画面応答も一次資料に規定なし | C-022の観測手順（assertは行不存在照会のみ・応答は記録） |
| 055 | 256字の「変更されない」=同上の推定・実走未確認 | C-025の観測手順 |
| 063 | ページ存在判定（404）の到達可能条件が一次資料から立証不能（R1是正B1: 不存在Page idはchoices検証で拒否・空Page時のfind('')挙動未確定）→C-032は要実機・実行対象外 | C-030の反映内容（id0のDB反映） |

**その他の要実機・実行保留**:

| 対象 | 理由 |
|---|---|
| C-011〜C-013のD&D/ポップオーバー操作 | jQuery UI sortable・popoverのPlaywright操作（dragTo・popover表示待ち）の実DOM安定性は要実機確認（観測の確定はDB照会で担保） |
| SEED-M0903-ASSIGNEDのpage_id・配置block_id実値 | 既存標準データ参照のためD5で確定（@TBD-D5）。SEED値を期待の正にしない |
| C-031-ENの期待文言 | DOC-DRAFT-M0903-03（未解決）＝en辞書逐語を候補値とし裁定はD6/正式化 |
| -EN 8行 | D15（管理画面en切替）待ち |

### §9.2 §9-EX excluded per-ID表（全4件・実引き根拠。範囲一括でなく各IDを個別に正当化）

根拠の実引き:
(a) **相関constraint不存在**: LayoutType（LT:42-72全実引き）のconstraintsは`name`のNotBlankと`DeviceType`のNotBlankのみ。`Page`はmapped無効・constraint無し。項目間（入力×入力）の相関検証・Callback・Expression等の相関constraintは0件。
(b) **設計書にも相関規定なし**: md:306-313（バリデーション節）の規定は名称未入力・端末種別未入力・トークン・配置hidden除外のみで、項目間相関の規定なし。
（なお「DBとの相関」（016/017）は削除可否=dtb_page_layout参照（L1-036）が実在するため読み替えboundとし、excludedにしない=偽陰性防御）

| No | 会計コード | 個別正当化（期待テキスト×根拠） |
|---|---|---|
| 012 | EX-B | 「相関バリデーションでエラーが表示され、対象処理が完了しないこと」→エラーを発生させる相関constraintが不存在（根拠a・b）のため検証を構成不能 |
| 013 | EX-B | 「相関バリデーションでエラーが表示されず、対象処理を継続できること」→同上。「相関エラーが出ない」ことは相関検証の不存在そのものであり、通常保存成功（010でbound済み）と区別できる観測が構成不能（根拠a・b） |
| 014 | EX-B | 同013（根拠a・b） |
| 015 | EX-B | 同012（根拠a・b） |

### §9.3 読み替えbound per-ID表（全16件。期待極性を実在の観測へ再解釈したbind・隠さない。**R1是正M5: bound（完全）と混ぜず別掲会計**）

| No | 母集合の前提ラベル | 読み替え内容 |
|---|---|---|
| 016 | 画面プレビュー | 「DBとの相関」→削除可否のDB参照判定（dtb_page_layout 0件=該当→エラーなく削除継続）へ再解釈（C-015）。前提ラベルと不一致 |
| 017 | 入力項目 | 同上の拒否側（割当あり→警告・削除されない）へ再解釈（C-016）。前提ラベルと不一致 |
| 019/023/027/031 | 上下移動/画面プレビュー押下/プレビューするページ…/この操作は… | 「検索条件該当→取得結果に含まれる」→一覧取得の実在条件（`l.id != 0`・LC:60-63）に該当するレイアウトが一覧に含まれる、へ再解釈（C-001）。UI検索機能は本機能に不存在（layout_list.twigに検索入力0件=ll全文実引き） |
| 020/024/028/032 | セクション移動確定/削除ボタン押下/保存しました/M09-03-MSG-001 | 同条件の非該当側（id0が一覧に含まれない）へ再解釈（C-001） |
| 021/025/029 | 未使用ブロック検索入力/配置プレースホルダ/削除しました | 「検索条件該当→含まれる」→未使用ブロック検索（クライアント絞込・L1-020）の一致ブロックが**表示**に含まれる、へ再解釈（C-014）。「取得」でなく表示絞込＝サーバ取得は発生しない |
| 022/026/030 | コードプレビュー押下/プレビューボタン/関連するデータ… | 同絞込の非該当側（不一致ブロック非表示）へ再解釈（C-014） |

読み替えの妥当性はD6/正式化時に再裁定する（原文どおりの「検索機能」検証ではないことを隠さない）。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象極性対の列挙と判定:

| 対象 | 極性判定 | 記録 |
|---|---|---|
| 009/010（必須: 完了しない/継続） | 009=拒否側→C-019/C-020/C-027／010=成功側→C-005 | 取り違えなし（エラー行と成功行を別ケースへ） |
| 012〜015（相関: エラー/継続） | 全4行excluded（EX-B） | 相関constraint不存在のため両極性とも構成不能（§9.2） |
| 016/017（DB相関: 継続/完了しない） | 016=継続側→C-015（削除成功）／017=拒否側→C-016（警告・残存） | 「該当する値→エラーなし」「該当しない値→エラー」の対応を、削除条件（割当0件=削除できる状態）への該当として判定。逆読み（該当=割当あり）の場合は016↔017が入れ替わるが、いずれでもC-015/C-016の観測対で両極性を被覆（取り違えても検証は同一の対） |
| 019〜032（含まれる/含まれない） | 奇数=肯定側・偶数=否定側 | 肯定→C-001の包含assert/C-014のshow・否定→C-001のid0不在assert/C-014のhide。否定側は「表示されない」の実assert必須（C-001手順3・C-014手順4） |
| 038/043/045（追加されない） | 否定側 | C-006/C-009=配置行0件のCOUNT assert・C-022=行不存在assert・C-019=行不存在assert（DB照会の否定側実証） |
| 046（前提=削除・期待=追加される） | 前提と期待が矛盾→前提はノイズ | 期待テキスト優先で肯定側C-005へbind（削除ケースへの誤bindを回避） |
| 050/055/057（変更されない） | 否定側 | C-017/C-025/C-027すべてに「DB値が旧値のまま」assertを明記 |
| 065（削除状態にならない） | 否定側 | C-016/C-017にDB残存assertを明記 |
| 068（前提=保存しました・期待=削除状態になる） | 前提ノイズ | 期待優先でC-015（削除成功）へbind |
| 047（プレビュー押下→追加される） | 肯定側だが追加先はid0 | C-030でid0の配置行追加をassert（編集中idではない=L1-031。誤って編集中idの追加を期待しない） |
| 018/060/064（サーバ側で判定する=拒否側含意） | 実装に判定が確認できない部分あり | 「判定される」と断定する期待を立てず、実証可能な判定（除外規則・トークン・404・割当拒否）を補助観測に留め、**当該3件はpartial/unresolved会計**（DOC-DRAFT-01/02=未解決へ分離・R1是正M3/M4） |
| 063（ページ存在判定=404の拒否側） | 到達性の取り違え（R1検出） | 前版は不存在Page idの直接POSTで404到達と誤認。codex R1がEntityType choices検証による事前拒否（LC:130の`isValid()`ガード）を指摘→C-032を要実機へ降格・063をpartialへ。C4検出実績として記録 |

機械検査結果（工程6自己検査・R1是正版で再実施済み）: §8参照ケースIDの§4実在=全一致／bound62＋読み替え16＋partial6＋TBD0＋excluded4=88=母集合件数一致／補完5行は親空で母集合会計外／oracle.json草案は本md§1から導出・claim数43一致。未検出の極性取り違えが残る可能性は否定しない（codex R2で検証されたい）。

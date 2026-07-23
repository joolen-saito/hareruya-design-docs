# W1候補: m05-16 ショップ用メモ登録 — 実行可能グレード候補（母集合59全量踏破）

> 2026-07-23 ／ **候補グレード（candidate・D6前・O5未確定・実装/実走なし）**
> source_class=standard-src+design は fid_kubun.tsv（D1・fid_kubun.tsv:260）による**暫定付与**（確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> fixture_version は全て `@TBD-D5`。統治: `integration_test/CONCRETIZATION_FIRST_PLAN.md`（改訂2・三段会計）。
> 正典: `integration_test/e2e/PILOT_m09_01_news_executable_grade.md`／同型見本:
> `integration_test/e2e/exec/_drafts/m09-01_admin_content_content_news_executable_draft.md`（W0 codex承認済み）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m05-16_admin_order_order_shop_memo_oracle_draft.json`。
> 正式パス `e2e/fixtures/oracle/` 直下には書かない。
> **改訂1（codexレビュー是正・Major2件＋運用明確化1件）**: (1) C-010の `HTTP200` を**除去**（一次資料に
> 200の逐語根拠なし=EditController.php:148は`#[Template]`描画のみ・設計mdはHTTPメソッド/パスのみ記載） 
> (2) C-014のmaxlength等**実DOM未確認属性を要実機副観測へ格下げ**（主判定=ネットワーク観測で自立） 
> (3) C-025を**主判定（一次資料確定=保存不成立/DB不変）と要実機副観測（エラー文言表示）に分離**。
> excluded=6・TBD=053・bound極性裁定は codex確認済み・維持。
> **行数集計**: 候補ケース行総数**28**＝bound対応27（ja22＋-EN5）＋補完1。母集合59=bound52＋TBD1＋excluded6。

## §0 版固定

- 設計書正本: `functions/ec-cube-enterprise/m05-16_admin_order_order_shop_memo.md`（本repo HEAD `8e4e5dea3c9cc96d65db6e4c7be8e2b0977ba48d` 時点）。
- ee実ソース: `/home/y-saito/Developments/ec-cube-enterprise/` コミット `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51`（W0と同一）。
- vendor翻訳: `vendor/symfony/validator/Resources/translations/validators.{ja,en}.xlf`＝symfony/validator v7.4.3（W0と同一版）。
- fid_kubun.tsv（D1）: `M05-16｜ショップ用メモ登録機能｜対象｜標準｜standard-src+design`（fid_kubun.tsv:260。
  target_sha256=4a255392…・todo_sha256=5452cf67…＝ファイル冒頭ヘッダ実測。fid_kubun.tsv sha256先頭=44fbf02f1e4c）。
- 母集合: baseline `all_it_cases.tsv`（sha256先頭 `7911f190d273`）M05-16全**59行**（IT-M05-16-ADMIN-ORDER-ORDER-SHOP-MEMO-001〜059）。
- **判定原則（W0教訓）**: 観点ラベル・前提条件/入力データ列のシナリオ語は**生成器ノイズ**。bindは各行の
  **「期待結果／レスポンス」実テキスト**で判定し、極性（肯定/否定）も期待テキストで確認する（§8に全59行の期待要旨併記）。
  本機能の母集合は前提/入力列と期待列の対応ずれが大きい（例: 020「改行を含むメモ」前提に期待「追加されないこと」）。

## §1 L1原子オラクル表

規約: claimは検査可能な期待実値まで分解。quoteは一次資料の逐語。unitは文字数系のみ必須（ee=PostgreSQL/Symfony Length=文字長）。
LS=locale_sensitive（0は理由コード）。**期待値の正は本表のオラクルIDでありSEED値ではない（三段参照）**。

| oracle_id | 観点 | claim（検査可能な期待） | source_class(暫定) | 逐語quote | 根拠(file:line) | unit | LS |
|---|---|---|---|---|---|---|---|
| L1-M0516-001 | auth_rule | 未ログインで受注編集URL（編集GET・新規GET）へアクセスすると、admin firewall（pattern `^/%eccube_admin_route%/`）のform_loginエントリポイントにより**ログイン画面（route `admin_login`）へリダイレクト**され受注編集画面へ到達しない（メモ欄も利用不可） | 設計書md＋standard-src | 「未ログイン・権限不足・IP制限で拒否される利用者｜上記パス（到達前）｜管理画面の共通認証・認可ルールにより受注編集画面に到達できないため、メモ欄も利用できない。」／`admin:`…`pattern: ['^/%eccube_admin_route%/','^/%eccube_messenger_route%/']`…`form_login:`…`login_path: admin_login` | m05-16md:65,198／security.yaml:40-46 | — | 0 `non-translated` |
| L1-M0516-002 | http_status | 入口URLは `GET/POST /%eccube_admin_route%/order/new`（route `admin_order_new`）・`GET/POST /%eccube_admin_route%/order/{id}/edit`（route `admin_order_edit`・id=数値）。メモ単独の専用URLは無い | standard-src＋設計書md | `#[Route(path: '/%eccube_admin_route%/order/new', name: 'admin_order_new', methods: ['GET', 'POST'])]`／`#[Route(path: '/%eccube_admin_route%/order/{id}/edit', name: 'admin_order_edit', requirements: ['id' => '\d+'], methods: ['GET', 'POST'])]`／「メモ単独の専用URLは持たない」 | EditController.php:146-147／m05-16md:62-67 | — | 0 `non-ui-observable` |
| L1-M0516-003 | display_field | 受注編集（詳細）画面右カラムに「ショップ用メモ欄」カード。見出し=ロケール `admin.common.shop_memo` ja「ショップ用メモ欄」／en "Notes (Store Use)"＋説明アイコン（fa-question-circle）。カード本体はテキストエリア1個（`form.note`・rows=8・id=`order_note`〔block prefix `order`〕） | 設計書md＋standard-src | 「受注編集（詳細）画面の右カラムに『ショップ用メモ欄』カードを置く。…カード本体は複数行入力のテキストエリア1個（表示行数は8行）」／`<span class="card-title">{{ 'admin.common.shop_memo'\|trans }}<i class="fa fa-question-circle fa-lg ms-1"></i></span>`／`{{ form_widget(form.note, {'attr': {'rows': 8}}) }}`／`admin.common.shop_memo: ショップ用メモ欄`／`admin.common.shop_memo: Notes (Store Use)`／`return 'order';` | m05-16md:75／edit.twig:1794-1805（見出し1798・widget1805）／messages.ja.yaml:1832・messages.en.yaml:1829／OrderType.php:378-381,233 | — | 1 |
| L1-M0516-004 | display_field(文言) | 見出しのツールチップ（`div[data-bs-toggle="tooltip"]` の title属性）＝`tooltip.order.shop_memo` ja「店舗用メモを保存しておけます。フロント画面には表示されません。」／en "You can save notes for store use. They are not displayed on the Front Screen." | 設計書md＋standard-src | 「見出しにマウスを重ねると、ロケール `tooltip.order.shop_memo` の『店舗用メモを保存しておけます。フロント画面には表示されません。』を表示する。」／`title="{{ 'tooltip.order.shop_memo'\|trans }}"`／`tooltip.order.shop_memo: 店舗用メモを保存しておけます。フロント画面には表示されません。`／`tooltip.order.shop_memo: You can save notes for store use. They are not displayed on the Front Screen.` | m05-16md:76／edit.twig:1798／messages.ja.yaml:3620・messages.en.yaml:3234 | — | 1 |
| L1-M0516-005 | display_field | カード見出し右の折りたたみリンク（`a[data-bs-toggle="collapse"][href="#freeArea"]`）で本文（`#freeArea`）を開閉できる。初期状態は展開（`class="collapse show"`）。開閉状態は保存されない（再読込で展開へ戻る） | 設計書md＋standard-src | 「カード見出し右の折りたたみリンク（対象領域 `#freeArea`）で本文を開閉できる。初期状態は展開（表示）である。開閉状態は保存されない。」／`<a data-bs-toggle="collapse" href="#freeArea" aria-expanded="false" aria-controls="freeArea">`／`<div class="collapse show ec-cardCollapse" id="freeArea">` | m05-16md:77／edit.twig:1800,1803 | — | 0 `non-translated` |
| L1-M0516-006 | validation_rule | メモは**任意**（`required => false`・NotBlank不在・制約はLengthのみ）。未入力でも保存でき、空入力時は `dtb_order.note` が空（NULL許容列）として保持される（既存メモを空へ更新することも可） | standard-src＋設計書md | `->add('note', TextareaType::class, [ 'required' => false, 'constraints' => [ new Assert\Length(max: $this->eccubeConfig['eccube_ltext_len']), ], ])`（NotBlank不在）／「任意項目のため空のまま保存できる。空入力時は当該列が空（NULL許容列）として保持される。」／「任意（必須制約なし）」 | OrderType.php:233-238／m05-16md:114,122,190 | — | 0 `non-translated` |
| L1-M0516-007 | validation_rule | メモのForm層最大長=**3000文字**（`Assert\Length(max: eccube_ltext_len)`・`eccube_ltext_len: 3000`）。3000受理・3001拒否 | standard-src＋設計書md | `new Assert\Length(max: $this->eccubeConfig['eccube_ltext_len']),`／`eccube_ltext_len: 3000`／「フォーム上限3000文字（Length制約 `eccube_ltext_len`、`eccube.yaml` 確認値3000）」 | OrderType.php:236／eccube.yaml:114／m05-16md:122,124 | **文字** | 0 `non-translated`（超過文言はL1-008・LS=1） |
| L1-M0516-008 | message | Length超過時のエラー文言（Symfony既定カタログ・choice形式・v7.4.3）。カタログ原文（逐語）: source=`This value is too long. It should have {{ limit }} character or less.\|This value is too long. It should have {{ limit }} characters or less.`。ja target（単一形）=`長すぎます。この値は{{ limit }}文字以下で入力してください。`／en target=choice形式（limit=3000→複数側）。**解決後の期待実値**: ja「長すぎます。この値は3000文字以下で入力してください。」／en "This value is too long. It should have 3000 characters or less."。**表示位置は未立証**: edit.twigに `form_errors(form.note)`・`form_errors(form)` とも**0件（grep実測）**＝noteのエラー描画箇所がテンプレート上に無く、form theme依存の描画有無は要実機（設計書md:220は「項目にエラーを表示する」と規定＝**設計書とtwigの不一致候補**として§9に記録） | standard-src（vendor翻訳）＋設計書md | 上記choice原文＋ja/en target（trans-unit id=19）／「メモが最大長（3000文字）を超過｜同一編集画面を再表示し、項目にエラーを表示する。受注は保存しない。」 | vendor/symfony/validator/Resources/translations/validators.ja.xlf:78-79・validators.en.xlf:78-79／m05-16md:220 | — | 1 |
| L1-M0516-009 | db_effect | 保存先 `dtb_order.note`＝STRING **4000文字**・NULL許容。Form3000<DB4000の段差1000文字＝実効上限はForm側で決まる（Form層通過値は常にDB制約内） | standard-src＋設計書md | `#[ORM\Column(name: 'note', type: Types::STRING, length: 4000, nullable: true)] private ?string $note = null;`／「`dtb_order.note` は文字列型・桁4000・NULL許容…フォーム側の最大長…3000…の方が小さいため、保存可能な実効上限はフォーム側で決まる」 | Order.php:530-531／m05-16md:43,122,171 | **文字** | 0 `non-ui-observable` |
| L1-M0516-010 | db_effect | Form受理されたメモ入力値は**改行を含めそのまま** `dtb_order.note` へ保存される（恒等写像。フォームキー `note`） | 設計書md | 「`dtb_order.note`（フォームキー `note`）。複数行入力のテキストエリア。受注編集の保存処理に同梱して永続化する。」／「複数行入力のテキストエリアのため改行を含めて保存する。」 | m05-16md:122,132,81 | 文字 | 0 `data-passthrough` |
| L1-M0516-011 | message | 登録（`mode=register`）の保存成功時フラッシュ ja「保存しました」／en "Saved"（キー`admin.order.save.complete`。キャンセル系遷移を除く保存成功時） | standard-src＋設計書md | `if ($request->get('mode') === 'register')`／`$this->addSuccess('admin.order.save.complete', 'admin');`／`admin.order.save.complete: 保存しました`／`admin.order.save.complete: Saved`／「検証成功時はメモを含む受注が永続化され、同一受注の編集画面へリダイレクトする」 | EditController.php:545,736／messages.ja.yaml:2614・messages.en.yaml:2449／m05-16md:64,159 | — | 1 |
| L1-M0516-012 | status_transition | 保存成功時は当該受注の編集画面（`/order/{id}/edit`）へリダイレクト | standard-src＋設計書md | `return $this->redirectToRoute('admin_order_edit', ['id' => $TargetOrder->getId()]);`／「メモを含む受注編集の登録に成功｜同一受注の編集画面（リダイレクト）。」 | EditController.php:754／m05-16md:64,211 | — | 0 `non-translated` |
| L1-M0516-013 | status_transition | 検証失敗時は同一編集画面を再表示し、入力したメモは再表示される。受注（メモ含む）は保存されない | 設計書md | 「検証失敗時は同一画面に留まり、入力したメモは再表示される。」／「フォームの最大長検証でエラーとなり保存しない。同一編集画面を再表示する。」／「メモまたは受注他項目の検証に失敗｜同一編集画面（再表示、入力値を保持）。」 | m05-16md:64,131,212 | — | 0 `non-ui-observable` |
| L1-M0516-014 | db_effect | メモは受注の他項目と**同一トランザクション・同一flush**で保存され、登録成功時は一括で確定する。メモ単独の保存処理・専用flushは無い | 設計書md＋standard-src | 「検証成功時、受注編集の保存処理（購入フローの prepare・commit を含む同一DBトランザクション）の中で受注を永続化する。…同じ flush で `dtb_order.note` に保存される。メモ単独の保存処理・専用 flush は持たない。」／`// StockDiffProcessor 等が悲観ロックを使うため、prepare/commit から永続化まで同一 DB トランザクション内で行う`／`// wrapInTransaction が成功時に最終 flush + DB commit する（失敗時は rollback）` | m05-16md:97,142／EditController.php:592,689 | — | 0 `non-ui-observable` |
| L1-M0516-015 | db_effect | 受注編集の**他項目**の検証失敗時は受注全体が保存されず、メモも保存されない（DB不変） | 設計書md | 「受注編集の他項目で検証失敗｜受注全体が保存されないため、メモも保存されない。入力したメモは再表示される。」／「途中で検証・購入フローのエラーが起きた場合は受注全体が保存されず、メモも確定しない。」 | m05-16md:133,142,221 | — | 0 `non-ui-observable` |
| L1-M0516-016 | validation_rule | 他項目必須の実在根拠=氏名（`name` NameType）は `required => false`（**HTML5必須属性なし→空値はサーバ層まで到達**）だがNotBlank制約あり。空で送信するとサーバ検証エラー ja「入力されていません。」／en "No value found." が `form_errors(form.name.name01)`（項目直下）に描画され、保存されない | standard-src | `->add('name', NameType::class, [ 'required' => false, 'options' => [ 'constraints' => [ new Assert\NotBlank(), ], ], ])`／`{{ form_widget(form.name.name01) }}`＋`{{ form_errors(form.name.name01) }}`／`This value should not be blank.: 入力されていません。`／`This value should not be blank.: No value found.` | OrderType.php:69-76／edit.twig:1370-1371／validators.ja.yaml:17・validators.en.yaml:17 | — | 1 |
| L1-M0516-017 | display_field | 新規受注の登録画面（`/order/new`）ではメモ欄は**空**で表示される（`new Order()`・noteプロパティ初期値null） | standard-src＋設計書md | `if ($id === null) { $TargetOrder = new Order();`／`private ?string $note = null;`／「新規受注の登録画面が開き、ショップ用メモ欄は空で表示される。」 | EditController.php:204-212／Order.php:531／m05-16md:63,90 | — | 0 `data-passthrough` |
| L1-M0516-018 | display_field | 既存受注の編集画面の初期表示は**永続化済みの `dtb_order.note`** を読む（DB現行値の恒等表示。保存成功後の再表示も同一列） | 設計書md | 「ショップ用メモ欄には受注の現行メモ（`dtb_order.note`）が初期値として載る。」／「編集画面の初期表示は永続化済みの `dtb_order.note` を読む。保存成功後の再表示も同一列を読むため一致する。」 | m05-16md:62,90,141 | — | 0 `data-passthrough` |
| L1-M0516-019 | db_effect | 保存（メモ更新を含む受注編集の保存）で `dtb_order.update_date` が更新される（Doctrine preUpdateイベントで自動設定） | 設計書md＋standard-src | 「dtb_order｜update_date｜受注編集の保存時に更新される。メモ更新もこの保存に含まれる。」／`public function preUpdate(LifecycleEventArgs $args): void {`…`$entity->setUpdateDate(new \DateTime());` | m05-16md:172／SaveEventSubscriber.php:62-67 | — | 0 `non-ui-observable` |
| L1-M0516-020 | db_effect | 出荷用メモ欄（ロケール `admin.order.shop_memo_for_shipped` ja「出荷用メモ欄」／en "Shipping Notes"）は**別項目・別保存先**（出荷側 `dtb_shipping.note`）。ショップ用メモの保存は出荷側noteを変更しない。**UI上の所在は設計書とeeで記述が異なる**（md:52=受注編集画面の出荷情報ブロック／ee実測=shipping.twig:686〔出荷登録画面テンプレート〕・edit.twig内に該当ロケールキー0件〔grep実測〕）→所在の断定は要実機・「別項目・別列」は確定 | 設計書md＋standard-src | 「出荷用メモ欄…これは出荷に紐づく別項目であり、保存先も別である。」／`{{ 'admin.order.shop_memo_for_shipped'\|trans }}`／`admin.order.shop_memo_for_shipped: 出荷用メモ欄`／`admin.order.shop_memo_for_shipped: Shipping Notes`／Shipping側 `#[ORM\Column(name: 'note', type: Types::STRING, length: 4000, nullable: true)]` | m05-16md:33,52,174／shipping.twig:686／messages.ja.yaml:2553・messages.en.yaml:2390／Shipping.php:120／Order.php:530 | — | 0 `non-ui-observable`（ラベル文言はLS=1だがUI所在未確定のため-EN行は保留=§5） |
| L1-M0516-021 | display_field | メモ欄に固有の入力補助・非同期保存・文字数カウンタ・動的バリデーションは無い。widget付与属性は `rows: 8` のみ＝**maxlength属性の付与なし**（twig根拠。実DOMは要実機）。送信は受注編集フォーム全体の送信に含まれる | 設計書md＋standard-src | 「ショップ用メモ欄に固有の入力補助・非同期保存・文字数カウンタ・動的バリデーションは持たない。入力値の送信は受注編集フォーム全体の送信に含まれる。」／`{{ form_widget(form.note, {'attr': {'rows': 8}}) }}` | m05-16md:78／edit.twig:1805 | — | 0 `non-translated` |
| L1-M0516-022 | display_field | ショップ用メモ欄はモーダル・ポップアップ・トースト・確認ダイアログを表示しない（観測範囲=メモカード内の要素と登録押下時の挙動に限定） | 設計書md | 「ショップ用メモ欄はモーダル・ポップアップ・トースト・確認ダイアログを表示しない。」 | m05-16md:80 | — | 0 `non-translated` |
| L1-M0516-023 | db_effect | 保存単位=**受注1件につきメモ1件**（`dtb_order.note` の1列に自由文を保持。当該受注行のみ更新・他受注のnoteへ影響しない） | 設計書md | 「メモの保存単位｜受注1件につきメモ1件。`dtb_order.note` の1列に自由文を保持する。」 | m05-16md:113,51 | — | 0 `non-ui-observable` |
| L1-M0516-024 | auth_rule | ログイン済み管理者（受注編集の権限あり）はメモ欄を表示・入力・保存できる（メモ欄単独の権限制御なし＝受注編集画面の認可に従う） | 設計書md | 「ログイン済み管理者（受注編集の権限あり）｜メモ欄を表示・入力・保存できる。」／「メモ欄単独の権限制御は持たず、受注編集（詳細）画面の認可に従う。」 | m05-16md:199,202 | — | 0 `non-translated` |
| L1-M0516-025 | **TBD** | フロント（購入者側）画面にメモを表示しない＝**universal negative**。正本は観測対象画面を規定しない（「メモを表示・検索・出力する他画面…の表示ルール」は各機能の設計を正とする＝本書対象外）→観測範囲が契約できず具体オラクル化不能。**未確定オラクル台帳へ**（特定フロント画面での非表示検証は当該画面機能の設計確定後） | 設計書md | 「入力した内容はフロント画面（購入者側）には表示しない。」／「メモを表示・検索・出力する他画面（受注一覧、CSV出力など）の表示ルール」（対象外宣言） | m05-16md:7,115,37 | — | — |

## §2 SEED三段参照設計

三段参照: `L1恒等写像claim（passthrough_basis=m05-16md:122入力項目表・141整合表） → fixture_version（SEEDセットID@manifest_sha1） → 実値`。
固定値は**入力の再現手段**であり期待値の正にしない。全て `@TBD-D5`。

| SEEDセットID | 目的 | 固定値（設計） | 後始末 |
|---|---|---|---|
| SEED-M01-ADMIN | 管理者ログイン | W0/パイロットと共通（管理画面ログイン可能なmember） | 不変 |
| SEED-M05-16-ORDER | 編集初期表示・保存/更新系の対象受注 | `dtb_order` 1件: id=900051601（帯@TBD-D5）・note=`M0516既存メモ`・name01/name02=`M0516姓`/`M0516名`・**登録POST（mode=register）が検証成功する完全受注**（必須FK: order_status/payment等・明細・出荷 `dtb_shipping` id=900051611〔note=`M0516出荷メモ`〕を含む）。受注はNOT NULL/FK関連行が多く、**行セットの完全定義はD5 manifest契約で確定**（ここではセット設計のみ・捏造しない） | UPSERTべき等・更新系ケース後に同値へ再適用 |
| SEED-M05-16-ORDER2 | 空メモ登録（必須エラーなしの実証） | 同型の完全受注1件: id=900051602・**note=NULL** | 再適用 |

- 保存系ケースは全て**既存SEED受注の編集（更新経路）**で行う。新規受注の登録POSTは顧客・明細・支払等の
  他項目入力を要し本機能スコープ外（md:34-35）のため、新規経路はGET表示（L1-017）のみ検証する。
- 対象行の一意特定は**固定id（900051601/900051602）**で決定的。run-id prefixによる残骸掃除は不要
  （新規行を作らないため）。cleanup=SEED再適用。

## §3 画面項目マトリクス

三値比較: 設計書md（入力項目表:122）／ee Form（OrderType.php）／ee DB（Order.php）。本機能の画面項目は
ショップ用メモ欄1項目（他項目は受注編集M05-11の正。ただし他項目検証失敗の実在根拠としてnameのみ§1 L1-016で確定）。

| 項目 | 任意/必須 | 最大文字数（Form層/DB層・unit=文字） | 境界3種 | メッセージ（ja/en・L1参照） |
|---|---|---|---|---|
| ショップ用メモ欄（note） | **任意**（md:122「任意」=OrderType.php:234 `required=>false`・NotBlank不在=L1-006。空登録・空へ更新とも可） | **Form 3000**（OrderType.php:236＋eccube.yaml:114）**／DB 4000**（Order.php:530）→**段差1000文字**: 3001..4000字はFormで拒否されDBに到達しない（3001字拒否が段差の実証）。maxlength属性なし（L1-021・twig根拠）のため3001字入力はブラウザで可能 | `runFill(3000,mixed,"E2E-<runid>-")`受理＋**DB char_length=3000**（文字長意味論）／`runFill(3001,ascii,"E2E-<runid>-")`拒否・DB不変／1字受理（最小系。最小長制約は不存在=L1-006） | 超過: L1-008（表示位置は要実機=twigにform_errors(form.note)不在）／必須メッセージ: **なし**（必須制約が不存在のため。L1-006） |
| （参照）氏名 name01/name02 | 必須（NotBlank=L1-016。**他項目検証失敗の誘発手段**としてのみ使用） | —（本機能スコープ外=md:34） | 空のみ使用 | 空: L1-016「入力されていません。」/"No value found."（edit.twig:1371項目直下） |
| （参照）message | 任意・Length max=eccube_ltext_len=3000（OrderType.php:203-208。**他項目Length検証失敗の誘発手段**としてのみ使用。widget/errors=edit.twig:1504-1505） | — | 3001字のみ使用 | 超過: L1-008と同カタログ（limit=3000） |

## §4 実行可能グレード14列TSV（候補・**自己完結＝全28行を実体掲載**）

記法: 期待結果セルは三段参照 `…実値… [L1:<oracle_id>; fixture:<SEEDセットID>@TBD-D5]`。
`%eccube_admin_route%` は環境値（既定 `admin`）。ORDER=900051601（SEED-M05-16-ORDER）・ORDER2=900051602。
登録操作=「`button[name="mode"][value="register"]`（edit.twig:1927）押下」。en行はD15前提。

### §4.1 bound対応候補行（27行=ja22＋-EN5。§8の59対応表が参照する全行）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m05-16_admin_order_order_shop_memo	E2E-M0516C-001	IT-15	権限	P1	未ログインで編集URL直接アクセス→ログイン画面へリダイレクト	未ログイン／SEED-M05-16-ORDER	—	1. GET /%eccube_admin_route%/order/900051601/edit	admin_login のログイン画面へリダイレクトされ受注編集画面（メモ欄）へ到達しない [L1:L1-M0516-001,L1-M0516-002]				
m05-16_admin_order_order_shop_memo	E2E-M0516C-002	IT-15	権限	P1	未ログインで新規URL直接アクセス→ログイン画面へリダイレクト	未ログイン	—	1. GET /%eccube_admin_route%/order/new	admin_login のログイン画面へリダイレクトされる [L1:L1-M0516-001,L1-M0516-002]				
m05-16_admin_order_order_shop_memo	E2E-M0516C-010	IT-25	表示	P1	編集画面にショップ用メモ欄カードが展開状態で表示される（ja・ログイン済み管理者）	ログイン済(SEED-M01-ADMIN)／SEED-M05-16-ORDER	—	1. GET /order/900051601/edit 2. #freeArea を含むカードの見出し（div[data-bs-toggle="tooltip"] 内 span.card-title・edit.twig:1798）と #order_note・説明アイコン(i.fa-question-circle)を読む 3. #freeArea のclassを読む	見出し「ショップ用メモ欄」・カード内にテキストエリア #order_note（rows=8）と説明アイコンが存在・#freeArea が collapse show（展開）＝受注編集画面が表示されている（HTTPステータス値は期待にしない=一次資料に200の逐語根拠なし） [L1:L1-M0516-003,L1-M0516-005,L1-M0516-024,L1-M0516-002; fixture:SEED-M05-16-ORDER@TBD-D5]				
m05-16_admin_order_order_shop_memo	E2E-M0516C-010-EN	IT-25	表示	P2	カード見出し（en）	ログイン済／SEED-M05-16-ORDER／locale=en	—	1. en UIで編集画面を開く 2. 見出しを読む	見出しに "Notes (Store Use)" [L1:L1-M0516-003]				
m05-16_admin_order_order_shop_memo	E2E-M0516C-011	IT-12	ツールチップ	P2	見出しツールチップ文言（ja）	ログイン済／SEED-M05-16-ORDER	—	1. 編集画面を開く 2. 見出しの div[data-bs-toggle="tooltip"]（edit.twig:1798）の title属性を読む	title属性=「店舗用メモを保存しておけます。フロント画面には表示されません。」（完全一致） [L1:L1-M0516-004]				
m05-16_admin_order_order_shop_memo	E2E-M0516C-011-EN	IT-12	ツールチップ	P3	ツールチップ文言（en）	ログイン済／SEED-M05-16-ORDER／locale=en	—	同上	title属性="You can save notes for store use. They are not displayed on the Front Screen."（完全一致） [L1:L1-M0516-004]				
m05-16_admin_order_order_shop_memo	E2E-M0516C-012	IT-12	開閉	P2	折りたたみリンクで開閉でき状態は保存されない	ログイン済／SEED-M05-16-ORDER	—	1. 編集画面で a[data-bs-toggle="collapse"][href="#freeArea"]（edit.twig:1800）をクリック 2. #freeArea の表示状態を読む 3. 再クリックで展開を確認 4. ページ再読込後の #freeArea class を読む	クリックで本文が折りたたまれ、再クリックで展開。再読込後は collapse show（初期展開へ戻る=状態非保存） [L1:L1-M0516-005]				
m05-16_admin_order_order_shop_memo	E2E-M0516C-013	IT-12	モーダル	P3	メモ欄はモーダル・確認ダイアログを表示しない	ログイン済／SEED-M05-16-ORDER	note=`E2E-<runid>-nodialog`	1. 編集画面でメモカード内のmodal/dialog要素有無を確認 2. メモ変更して登録押下時にダイアログ介在なく送信されることを確認	メモカード内に modal/dialog/トースト要素が存在せず、登録は確認ダイアログなしで送信される [L1:L1-M0516-022]（実行後SEED再適用）				
m05-16_admin_order_order_shop_memo	E2E-M0516C-014	IT-22	JS挙動	P2	メモ欄に固有JS（非同期保存・入力補助）が無い	ログイン済／SEED-M05-16-ORDER	—	1. 編集画面で #order_note へ入力し、ネットワーク監視で保存系リクエストが発生しないことを確認 2. メモカード（#freeArea内）に文字数カウンタ等の入力補助要素が無いことを確認 3. （要実機副観測）#order_note のmaxlength属性有無を記録	【主判定】入力のみでは保存リクエストが発生しない（非同期保存なし）＋メモカード内に文字数カウンタ等の入力補助要素がない [L1:L1-M0516-021]。【要実機副観測】maxlength属性の不在はtwig根拠のみ（edit.twig:1805 attr=rows:8）＝**確定期待にしない**・実DOM確認=§9-4				
m05-16_admin_order_order_shop_memo	E2E-M0516C-015	IT-25	初期値	P1	新規受注登録画面でメモ欄が空	ログイン済	—	1. GET /order/new 2. #order_note の値を読む	新規登録画面が開き #order_note の値が空 [L1:L1-M0516-017,L1-M0516-002]				
m05-16_admin_order_order_shop_memo	E2E-M0516C-016	IT-25	初期表示	P1	編集画面初期表示が永続化済みdtb_order.noteと一致（恒等）	ログイン済／SEED-M05-16-ORDER	—	1. GET /order/900051601/edit 2. #order_note の値を読む 3. db.tsで SELECT note FROM dtb_order WHERE id=900051601	画面の値=DB現行値=SEED投入値 `M0516既存メモ`（恒等写像・エラー表示なし） [L1:L1-M0516-018; fixture:SEED-M05-16-ORDER@TBD-D5]				
m05-16_admin_order_order_shop_memo	E2E-M0516C-020	IT-26	保存	P1	メモを入力して登録→成功フラッシュ・同一編集画面へ・DB反映（ja）	ログイン済／SEED-M05-16-ORDER	note=`E2E-<runid>-メモ更新`（他項目は既存値のまま）	1. 編集画面で #order_note を書き換え 2. button[name="mode"][value="register"]（edit.twig:1927）押下 3. 遷移先URLとフラッシュを読む 4. db.tsで note照会（実行後SEED再適用）	「保存しました」表示＋/order/900051601/edit へリダイレクト＋dtb_order.note=入力値と完全一致 [L1:L1-M0516-011,L1-M0516-012,L1-M0516-010; fixture:SEED-M05-16-ORDER@TBD-D5]				
m05-16_admin_order_order_shop_memo	E2E-M0516C-020-EN	IT-26	保存	P2	保存成功フラッシュ（en）	ログイン済／SEED-M05-16-ORDER／locale=en	同上	同上	"Saved" 表示 [L1:L1-M0516-011]				
m05-16_admin_order_order_shop_memo	E2E-M0516C-021	IT-22	任意	P1	メモ未入力（空）のまま登録→必須エラーなしで保存成功	ログイン済／SEED-M05-16-ORDER2(note=NULL)	note=空のまま（他項目は既存値）	1. /order/900051602/edit で #order_note が空のまま登録押下 2. フラッシュ・遷移を確認 3. db.tsで note照会	必須エラーが表示されず「保存しました」＋編集画面へ＋dtb_order.note が空（NULL許容列）のまま [L1:L1-M0516-006,L1-M0516-011,L1-M0516-012; fixture:SEED-M05-16-ORDER2@TBD-D5]				
m05-16_admin_order_order_shop_memo	E2E-M0516C-022	IT-26	更新	P1	既存メモを空へ更新→列が空として保持される	ログイン済／SEED-M05-16-ORDER(note=`M0516既存メモ`)	note=空（全消去）	1. 編集画面で #order_note を空にして登録 2. db.tsで note照会（実行後SEED再適用）	保存成功＋dtb_order.note が空（COALESCE(note,'')=''） [L1:L1-M0516-006,L1-M0516-010; fixture:SEED-M05-16-ORDER@TBD-D5]				
m05-16_admin_order_order_shop_memo	E2E-M0516C-023	IT-26	境界	P2	1字メモが保存される（最小系・最小長制約なし）	ログイン済／SEED-M05-16-ORDER	note=`あ`（1字）	1. 編集画面でメモを1字にして登録 2. db.tsで note と char_length(note) 照会（実行後SEED再適用）	保存成功＋dtb_order.note=`あ`・文字長1（最小長制約は存在しない） [L1:L1-M0516-007,L1-M0516-010,L1-M0516-006; fixture:SEED-M05-16-ORDER@TBD-D5]				
m05-16_admin_order_order_shop_memo	E2E-M0516C-024	IT-26	境界	P1	3000字(mixed)が受理されDB文字長=3000（文字長意味論）	ログイン済／SEED-M05-16-ORDER	note=runFill(3000,mixed,"E2E-<runid>-")（UTF-8バイト長>3000）	1. 編集画面でメモを3000字にして登録 2. フラッシュ確認 3. db.tsで char_length(note) 照会（実行後SEED再適用）	保存成功（「保存しました」）＋DB文字長=3000（バイト長でなく文字長で判定） [L1:L1-M0516-007,L1-M0516-009,L1-M0516-010; fixture:SEED-M05-16-ORDER@TBD-D5]				
m05-16_admin_order_order_shop_memo	E2E-M0516C-025	IT-22	境界	P1	3001字はForm層で拒否（Form3000/DB4000段差）・編集画面再表示・DB不変（ja）	ログイン済／SEED-M05-16-ORDER	note=runFill(3001,ascii,"E2E-<runid>-")	1. 編集画面でメモを3001字にして登録押下（twig上maxlength付与なし=L1-021。実DOMで付与が確認された場合の入力手段は§9-4に従う） 2. 遷移せず編集画面に留まること・成功フラッシュ無しを確認 3. db.tsで note照会	【主判定・一次資料確定】保存されず同一編集画面を再表示・成功フラッシュ無し・dtb_order.note=`M0516既存メモ` のまま（DB不変） [L1:L1-M0516-007,L1-M0516-013; fixture:SEED-M05-16-ORDER@TBD-D5]。【要実機副観測】エラー文言 ja「長すぎます。この値は3000文字以下で入力してください。」の表示（表示位置未立証=edit.twigにform_errors(form.note)不在・§9-3） [L1:L1-M0516-008]				
m05-16_admin_order_order_shop_memo	E2E-M0516C-025-EN	IT-22	境界	P2	3001字拒否メッセージ（en・文言確定行）	ログイン済／SEED-M05-16-ORDER／locale=en	同上	同上	【要実機副観測・文言確定行】"This value is too long. It should have 3000 characters or less."（表示位置未立証＋実行D15前提。主判定はC-025 ja側と同一=保存不成立/DB不変） [L1:L1-M0516-008]				
m05-16_admin_order_order_shop_memo	E2E-M0516C-027	IT-26	改行	P1	改行を含むメモが改行を含めて保存される	ログイン済／SEED-M05-16-ORDER	note=`E2E-<runid>-1行目\n2行目\n3行目`	1. 編集画面で複数行メモを入力し登録 2. db.tsで note照会（実行後SEED再適用）	保存成功＋dtb_order.note が改行（LF）を含め入力値と完全一致 [L1:L1-M0516-010; fixture:SEED-M05-16-ORDER@TBD-D5]				
m05-16_admin_order_order_shop_memo	E2E-M0516C-028	IT-22	他項目必須	P1	他項目（氏名）空の検証失敗で受注もメモも保存されない	ログイン済／SEED-M05-16-ORDER	氏名 #order_name_name01=空・note=`E2E-<runid>-notsaved`	1. 編集画面で氏名を空にしメモを新値にして登録押下（nameはrequired:false=HTML5必須属性なし→サーバ層到達=L1-016） 2. 応答画面で form_errors(form.name.name01)（edit.twig:1371）の文言と入力メモの再表示を確認 3. db.tsで note照会	同一編集画面再表示・氏名欄直下に「入力されていません。」・入力メモは画面に再表示・dtb_order.note=`M0516既存メモ` のまま（受注全体・メモとも未保存） [L1:L1-M0516-016,L1-M0516-015,L1-M0516-013; fixture:SEED-M05-16-ORDER@TBD-D5]				
m05-16_admin_order_order_shop_memo	E2E-M0516C-028-EN	IT-22	他項目必須	P2	他項目必須エラー文言（en）	ログイン済／SEED-M05-16-ORDER／locale=en	同上	同上	"No value found."（氏名欄直下） [L1:L1-M0516-016]				
m05-16_admin_order_order_shop_memo	E2E-M0516C-029	IT-22	他項目検証	P2	他項目（message）3001字のLength検証失敗でメモも保存されない	ログイン済／SEED-M05-16-ORDER	#order_message=runFill(3001,ascii,"E2E-<runid>-")・note=`E2E-<runid>-notsaved2`	1. 編集画面で message を3001字・メモを新値にして登録押下 2. form_errors(form.message)（edit.twig:1505）のエラーと編集画面滞留を確認 3. db.tsで note照会	同一編集画面再表示・message欄直下に「長すぎます。この値は3000文字以下で入力してください。」・dtb_order.note 不変（受注全体が保存されない） [L1:L1-M0516-015,L1-M0516-013,L1-M0516-008; fixture:SEED-M05-16-ORDER@TBD-D5]				
m05-16_admin_order_order_shop_memo	E2E-M0516C-030	IT-26	整合	P1	メモ＋他項目（氏名）の同時変更が一括で確定する（同一flush）	ログイン済／SEED-M05-16-ORDER	note=`E2E-<runid>-一括`・#order_name_name01=`E2E一括姓`	1. 編集画面でメモと氏名を同時に変更し登録 2. db.tsで note と name01 を同一クエリで照会（実行後SEED再適用）	保存成功＋dtb_order.note と dtb_order.name01 が**両方**入力値へ更新（一括確定） [L1:L1-M0516-014,L1-M0516-010; fixture:SEED-M05-16-ORDER@TBD-D5]				
m05-16_admin_order_order_shop_memo	E2E-M0516C-031	IT-05	副作用	P2	メモ保存でdtb_order.update_dateが更新される（ブラケット法）	ログイン済／SEED-M05-16-ORDER	note=`E2E-<runid>-ud`	1. db.tsでT1=SELECT now() 2. メモ変更して登録 3. db.tsでT2=SELECT now()・update_date照会（実行後SEED再適用）	T1≦dtb_order.update_date≦T2（保存で更新される） [L1:L1-M0516-019; fixture:SEED-M05-16-ORDER@TBD-D5]				
m05-16_admin_order_order_shop_memo	E2E-M0516C-032	IT-05	別項目	P2	ショップ用メモ保存は出荷用メモ（dtb_shipping.note）を変更しない	ログイン済／SEED-M05-16-ORDER(dtb_shipping id=900051611 note=`M0516出荷メモ`)	note=`E2E-<runid>-shopmemo`	1. メモ変更して登録 2. db.tsで dtb_order.note（id=900051601）と dtb_shipping.note（id=900051611）を照会（実行後SEED再適用）	dtb_order.note=入力値へ更新・dtb_shipping.note=`M0516出荷メモ` のまま不変（別項目・別保存先） [L1:L1-M0516-020,L1-M0516-010; fixture:SEED-M05-16-ORDER@TBD-D5]				
m05-16_admin_order_order_shop_memo	E2E-M0516C-033	IT-23	保存先	P1	保存先はdtb_order.note列・当該受注行のみ（受注1件メモ1件）	ログイン済／SEED-M05-16-ORDER＋SEED-M05-16-ORDER2	note=`E2E-<runid>-col`（900051601側のみ変更）	1. /order/900051601/edit でメモ変更し登録 2. db.tsで id=900051601 と id=900051602 の note を照会（実行後SEED再適用）	900051601のnote=入力値・900051602のnote=NULLのまま（当該受注行のnote列のみ更新=保存単位の実証） [L1:L1-M0516-009,L1-M0516-023; fixture:SEED-M05-16-ORDER@TBD-D5,SEED-M05-16-ORDER2@TBD-D5]				
```

### §4.2 補完行（1行。**親test_idなし・母集合会計に算入しない**。理由=設計書補完〔一次資料md:64,133に規定があるが母集合59行の期待テキストに「入力メモの再表示」が存在しない〕）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m05-16_admin_order_order_shop_memo	E2E-M0516C-040	IT-22	エラー継続	P2	検証失敗後も入力したメモがフォームに再表示される	ログイン済／SEED-M05-16-ORDER	氏名空＋note=`E2E-<runid>-redisplay`	1. C-028と同手順で検証失敗させる 2. 応答画面の #order_note の値を読む	#order_note の値=入力したメモ（`E2E-<runid>-redisplay`）が保持されている [L1:L1-M0516-013]（補完行・親test_idなし・設計書補完）				
```

## §5 locale対応表

LS=1 claim: **L1-003・L1-004・L1-008・L1-011・L1-016 の5claim → -EN 5行**（C-010-EN／C-011-EN／
C-025-EN／C-020-EN／C-028-EN。全行§4.1に実体掲載・文言はen一次資料逐語＝ja翻訳ゼロ）。
- messages.en.yaml:1829 `Notes (Store Use)`／en:3234 tooltip／en:2449 `Saved`／validators.en.yaml:17 `No value found.`／
  validators.en.xlf:78-79（choice解決→"3000 characters"複数側）。
- **保留（claim単位・理由明記）**: L1-M0516-020 のラベル文言（ja「出荷用メモ欄」/en "Shipping Notes"）は
  文言確定済みだが、**UI所在が設計書md:52とee twig（shipping.twig:686）で不一致**のためラベル表示の
  観測ケース（ja/-ENとも）は作らない（C-032はDB層観測で自立）。所在確定（要実機）後に解禁。
- -EN行の実行前提はD15（M0 Go/No-Go。管理画面のen切替口なし＝W0実測を継承）。文言確定は本書で完了（5/5=100%）。

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

- page: 既存 `e2e/pages/admin/m05/m05_16_admin_order_order_shop_memo.page.ts` を再利用可能
  （#order_note・登録ボタン・#freeArea等のセレクタ実装済み。ただし同ファイル内のtwig行番号注記は旧版
  〔edit.twig:1787等〕であり、本書§1の実測行番号〔1794-1805,1927〕が正）。
- spec: 候補の追加ケースspecは**未実装・実走なし**。期待値は `o("L1-M0516-xxx")`（L1解決器）経由・
  リテラル直書き禁止。db.ts（`e2e/helpers/db.ts`）でDB層照会。境界値は `runFill(n, repertoire, prefix)`。
- 直接POST/DELETEのrequest契約は**本機能では使わない**: 受注編集フォームはOrderItems collection等を含む
  巨大フォームで直接POST契約の再現コストが高く、必須/Length検証は `required:false`（HTML5素通し）のため
  **UI経由でサーバ層観測が可能**（L1-016根拠）。全ケースUI+db.tsで完結する。

**_drafts/隔離lintの実施証跡（実測・実施済み）**:
1. 正式消費側（`e2e/helpers/oracle.ts`・`e2e/helpers/db.ts`・spec・pages）に草案を消費する `_drafts` 参照は
   **0件**（隔離ガード自体のリテラル〔oracle.ts:19・grep実測〕を除く。ガードは `_drafts`・パス区切り・`..` を含む
   fileKey の解決をthrowで拒否する機械強制＝消費参照ではない）。
2. 正式パス `e2e/fixtures/oracle/` 直下に本機能のjsonは**作成していない**（草案は `_drafts/` のみ）。
   既存正式物 `m09_01_oracle.json` は未変更（git status確認）。
3. 本md・oracle草案jsonの出力先はともに `_drafts/` 配下のみ（§7出力規約に適合）。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

| ケース群 | 実行区分（候補） | 観測層 | 備考 |
|---|---|---|---|
| C-001,002,010,011,012,015（＋EN） | Playwright | GUI/HTTP | 認証リダイレクト・表示・属性読取 |
| C-013,014 | Playwright | GUI+network | 非同期保存なしの監視。maxlength実DOMは要実機 |
| C-016,020,021,022,023,024,025,027,028,029,030,031,032,033,040（＋EN） | Playwright+手動確認→**db.ts実装後Playwright単独へ降格候補** | GUI+DB | SEED受注の更新系。実行後SEED再適用 |
| C-025/C-028/C-029のエラー文言表示 | —（文言オラクル確定・**noteの表示位置のみ要実機**） | GUI | edit.twigにform_errors(form.note)不在（§9-3）。name01/messageは項目直下描画が実在（edit.twig:1371,1505） |
| -EN 5行 | 実行保留（D15） | GUI | 文言確定100%・実行のみ保留 |

聖域判定・多軸属性の正式付与はD14 v2合格後（本表は暫定・正式会計に使わない）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（§0判定原則。前提/入力列のシナリオ語はノイズ）。
1候補ケース行=1 assertion bundle・多対一は `shared-observation`・-EN行は対応ja行と同一親のlocale多重。
**参照先の全候補行は§4に実体掲載済み＝59↔候補の期待テキスト突合が本文内で完結する**。

### 集計（59 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **52** | 下表 |
| **TBD** | **1** | 053（フロント非表示=universal negative・観測対象画面未規定=L1-025） |
| **excluded** | **6** | EX-B 相関バリ4（012〜015。OrderType.php:233-238実測=noteの制約はLengthのみ・相関constraint不存在・md:190「形式チェックは課さない」）／EX-C DB相関2（016〜017。同根拠=DB相関バリデーション不存在） |
| 合計 | **59** | 欠落0・理由なし重複0 |

- 候補ケース行総数**28**（§4.1 bound対応27＝ja22＋-EN5／§4.2 補完1）。
- **極性・ノイズ処理の明示**（C4-manual対象=§10）: 009（必須エラーあり）は**メモ自体に必須制約が不存在**
  （L1-006）だが、期待テキストの「必須バリデーションでエラーが表示され、対象処理が完了しない」は
  **同一フォームの他項目必須（氏名NotBlank=L1-016・md:133のエッジケース）で成立**するためC-028へbind
  （除外しない=偽陰性回避）。020/025/027/032/037/039の否定行は前提/入力列のシナリオ語（改行・最小長-1等）が
  期待極性と矛盾するため**期待テキスト極性を正**として実在の拒否ケース（C-025/C-028/C-029）へbind
  （空入力・改行の「保存されない」は一次資料と矛盾=md:114,132のためシナリオ語を採らない）。

### 59対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 右カラムのカード（admin.common.shop_memoの「ショップ用メモ欄」）に置かれたテキストエリアであること | bound | C-010 |
| 002 | 出荷用メモ欄は別項目（admin.order.shop_memo_for_shipped）であること | bound | C-032 |
| 003 | 管理者=管理画面にログイン可能な利用者であること | bound | C-010 (shared) |
| 004 | 受注編集画面が開き右カラムにカードが展開状態で表示される | bound | C-010 (shared) |
| 005 | 新規受注の登録画面が開きメモ欄は空で表示される | bound | C-015 |
| 006 | 受注情報の保存に同梱してメモが保存される | bound | C-020 |
| 007 | 共通認証・認可により受注編集画面に到達できずメモ欄も利用できない | bound | C-001,C-002 |
| 008 | 右カラムに「ショップ用メモ欄」カードを置く | bound | C-010 (shared) |
| 009 | 必須バリでエラー表示・対象処理が完了しない | bound | C-028（他項目必須=L1-016。メモ自体は必須なし=L1-006） |
| 010 | 必須バリでエラー表示されず継続できる | bound | C-021 |
| 011 | 固有の入力補助・非同期保存・文字数カウンタ・動的バリを持たない | bound | C-014 |
| 012〜015 | 相関バリでエラー表示/なし | **excluded** EX-B | — |
| 016〜017 | DB相関バリでエラーなし/あり | **excluded** EX-C | — |
| 018 | 任意項目のため空のまま保存する | bound | C-021,C-022 (shared) |
| 019 | 対象レコードが追加されること | bound | C-020 (shared) |
| 020 | 追加され**ない**こと | bound | C-025 (shared・シナリオ語「改行」はノイズ=§8注記) |
| 021 | 追加されること | bound | C-020,C-030 (shared) |
| 022 | 初期表示は永続化済み dtb_order.note を読む | bound | C-016 |
| 023 | 追加されること | bound | C-030 (shared) |
| 024 | 追加されること（入力=最大長） | bound | C-024 |
| 025 | 追加され**ない**こと（入力=最大長+1） | bound | C-025 |
| 026 | 追加されること（入力=最小長） | bound | C-023 |
| 027 | 追加され**ない**こと（入力=最小長-1） | bound | C-025 (shared・空入力拒否は一次資料と矛盾=極性でbind) |
| 028 | 追加されること | bound | C-020 (shared) |
| 029 | 実行結果の対象レコードが追加されること（前提=副作用） | bound | C-031,C-020 (shared) |
| 030 | dtb_order=ショップ用メモ欄の保存先であること | bound | C-033 |
| 031 | 更新内容の値が変更されること | bound | C-020 (shared) |
| 032 | 値が変更され**ない**こと | bound | C-025,C-029 (shared) |
| 033 | 値が変更されること | bound | C-020 (shared) |
| 034 | 受注編集画面に到達できないため利用不可 | bound | C-001 (shared) |
| 035 | （ログイン済み管理者で）値が変更されること | bound | C-020 (shared・L1-024) |
| 036 | 値が変更されること（入力=最大長） | bound | C-024 (shared) |
| 037 | 値が変更され**ない**こと（入力=最大長+1） | bound | C-025 (shared) |
| 038 | 値が変更されること（入力=最小長） | bound | C-023 (shared) |
| 039 | 値が変更され**ない**こと（入力=最小長-1） | bound | C-025,C-029 (shared・極性でbind) |
| 040 | 値が変更されること | bound | C-020,C-024 (shared) |
| 041 | 実行結果の値が変更されること | bound | C-020 (shared) |
| 042 | 出荷用メモ欄は別項目（shop_memo_for_shipped）であること | bound | C-032 (shared) |
| 043 | 管理者=ログイン可能な利用者であること | bound | C-010 (shared) |
| 044 | カードが展開状態で表示される | bound | C-010 (shared) |
| 045 | 新規登録画面でメモ欄は空 | bound | C-015 (shared) |
| 046 | 保存に同梱してメモが保存される | bound | C-020 (shared) |
| 047 | ツールチップ tooltip.order.shop_memo の文言 | bound | C-011(+EN) |
| 048 | 折りたたみリンク（#freeArea）で開閉できる | bound | C-012 |
| 049 | モーダル・ポップアップ・トースト・確認ダイアログを表示しない | bound | C-013 |
| 050 | 「登録」押下時に保存に同梱して保存する | bound | C-020 (shared) |
| 051 | 受注1件につきメモ1件であること | bound | C-033 (shared) |
| 052 | 画面表示データでエラーなく継続できる | bound | C-010,C-016 (shared) |
| 053 | 購入者側フロント画面には表示しないこと | **TBD**（L1-025） | — |
| 054 | 画面表示データでエラーなく継続できる | bound | C-016 (shared) |
| 055 | フォームの最大長検証でエラーとなり保存しない | bound | C-025 (shared) |
| 056 | テキストエリアのため改行を含めて保存する | bound | C-027 |
| 057 | 受注全体が保存されないためメモも保存されない | bound | C-028,C-029 (shared) |
| 058 | 初期表示は永続化済み dtb_order.note を読む | bound | C-016 (shared) |
| 059 | 同一トランザクション・同一flushで一括確定する | bound | C-030 |

`func_scope_check` 判定: 親59/59会計済み・欠落0・理由なし重複0・補完1行は§4.2に実体掲載
（親空・設計書補完・母集合会計外）→ **差分0を本文内で実証可能**。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

| # | 事項 | 状態 |
|---|---|---|
| 1 | フロント非表示（053） | **TBD**=L1-025（universal negative・観測対象画面が正本で未規定=md:37。捏造せず未確定オラクル台帳へ） |
| 2 | 出荷用メモ欄のUI所在 | **設計書とeeの不一致候補**: md:52「受注編集（詳細）画面の出荷情報ブロック」／ee実測=shipping.twig:686（出荷登録画面テンプレート）・edit.twig内に `admin.order.shop_memo_for_shipped` 0件（grep）。**要実機**（別項目・別列の事実はDB層で確定=L1-020・C-032は自立） |
| 3 | noteのLength超過エラー文言の**表示位置** | edit.twigに `form_errors(form.note)`・`form_errors(form)` とも0件（grep実測）＝設計書md:220「項目にエラーを表示する」との**不一致候補**。form themeによる描画有無は**要実機**。C-025の主判定は「保存されない＋編集画面再表示＋DB不変」で自立 |
| 4 | #order_note の maxlength 属性不在の実DOM確認 | twig根拠（attr=rows:8のみ）のみ。実DOM=要実機（C-014・C-025の前提） |
| 5 | 管理画面のenロケール切替口 | 要D15（-EN 5行の実行前提。W0実測を継承） |
| 6 | SEED-M05-16-ORDER の完全行セット（受注のNOT NULL/FK関連行一式・登録POSTが検証成功する状態） | D5 manifest契約で確定（`@TBD-D5`。本書はセット設計のみ） |
| 7 | manifest_sha1（fixture_version確定） | D5後（現状 `@TBD-D5`） |
| excluded | 012〜015（相関バリ4）・016〜017（DB相関2） | noteの制約は `Assert\Length` のみ（OrderType.php:233-238逐語・NotBlank/相関/DB相関constraint不存在）＋md:190「形式チェックは課さない」＋md本文に相関・DB相関の規定なし → 対応する検証が実在せず過剰生成（m09-01 EX-B/EX-Cの先例と同型）。偽陰性でないことの傍証: 他項目起因の検証失敗は009/057としてC-028/C-029でbound済み |

候補規律: 全行 `@TBD-D5`・O5未確定（D6後に確定検査）・実装/実走なし・O6/聖域/多軸/C6C7を主張しない。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象構文の列挙とclaim別判定（本機能は生成器ノイズにより前提/入力列と期待列の極性衝突が多い）:

| 対象 | 極性判定 | 判定根拠（一次資料） |
|---|---|---|
| 009（必須エラーあり）vs 010（必須エラーなし） | 009=他項目必須（肯定側成立・C-028）／010=メモ任意（エラーなし・C-021） | OrderType.php:69-76（name NotBlank実在）／233-238（note NotBlank不在）・md:114,133 |
| 019〜029・031〜041の「追加/変更される・されない」 | 期待テキスト極性を正としてbind。肯定→C-020/023/024/030/031、否定→C-025/028/029 | md:122（保存）・131（3001拒否）・133（他項目失敗） |
| 020（前提=改行→期待=されない）・027/039（前提=最小長-1→期待=されない） | シナリオ語を**棄却**（改行は保存される=md:132・空入力は保存される=md:114のため、シナリオ語を採ると一次資料と矛盾する期待を捏造することになる）。期待極性のみでbind | md:132,114 |
| 012〜017（相関・DB相関の両極） | 両極とも対応constraint不存在→excluded（極性以前に検証自体が不存在） | OrderType.php:233-238・md:190 |
| 053（フロント「表示しない」=否定期待） | 否定は実在（md:115）だがuniversal negativeで観測契約不能→TBD（excludedにしない=実在仕様の除外禁止） | md:115,37 |

**codex敵対レビューは未実施**（本書は候補。この後codexレビュー予定。C4検出実績は同レビュー後に追記する）。

---

## 付録: 作業実測（W1係数計測用）

- 読んだ一次資料・参照物: 設計書md 1／ee実ソース 10（OrderType・Order・Shipping・EditController・
  edit.twig・shipping.twig・SaveEventSubscriber・security.yaml・eccube.yaml・NameType経由確認）／
  locale 4（messages ja/en・validators ja/en）＋vendor xlf 2／母集合・台帳 3（all_it_cases・fid_kubun・
  it-target系）／統治・見本 3（CFP・PILOT・W0草案）／既存実装 3（spec・page・helpers）＝**計26ファイル**。
- L1 claim数: **24確定＋1 TBD**（=25行）。候補ケース行28（ja22・EN5・補完1）。file:line claim引用 約60箇所。
- 難所（係数悪化要因）: (1) 母集合の前提/入力列と期待列の**大規模ミスマッチ**（噛み合わせ判定に極性規律が必須）
  (2) noteエラー描画箇所がtwigに無い発見（設計書との不一致候補の切り分け） (3) 出荷用メモ所在のmd/twig不一致
  (4) 受注SEEDの複雑性（完全受注が前提=D5送り） (5) 巨大フォームゆえ直接POST契約を放棄しUI経由設計へ転換。
- 楽だった点（再利用効果）: L1表・三段参照・choice解決・runFill・隔離lint・§構成はW0の型をそのまま流用。
  vendor xlf・validators・security.yaml・save系イベントの根拠はW0と同一箇所で再確認のみ。

# B0候補: m11-05 マスタデータ管理 — 実行可能グレード候補（母集合88全量踏破）

> 2026-07-24 ／ **候補グレード（candidate・D6前・O5未確定・実装/実走なし）**
> codexレビュー: **R1要修正（Blocker3＋Major3）→改訂1で是正済み・R2再確認待ち**（`REVIEW_LEDGER.md`と同期させること）。
> **改訂1（codex R1是正・要旨）**:
> (A)【Blocker A1】旧C-018（既存4行を逆順送信してsort_no再割当を実証）が既存基準データ（id1-4）のsort_noを
>     一時的に書き換えるS0違反だった→**既存4行を一切送信順に変更しない設計へ全面差替**（SEED帯行9010-9012の
>     みを並べ替え。既存4行は常に元順序・元値のまま先頭に同梱）。
> (B)【Blocker A2】旧C-017（除外クラスOrderStatusのdtb_order_statusへ直接POST）がmtb_sex使い捨て帯の外を
>     破壊していた→**候補ケースから削除し§9-4の要実機残（本書では未実行）へ格下げ**。静的根拠（L1-020）は
>     維持するが実行を主張しない。
> (C)【Major A3】旧C-006/C-013/C-023が他ケースの残置行に依存しafterEach順序次第で前提が壊れ得た→
>     **各ケースが自ケース内でSEED行を自己生成する自己完結設計へ再設計**（C-006=id9002自己生成、
>     C-013=id0を自ケースでcreate+delete、C-023=id9013を自ケース内で作成してから2セッション連続保存）。
> (D)【Blocker B1】行数会計の虚偽（本文の「23=ja19+EN4」表記と実TSV行数が不一致・C-021/C-022が親test_id
>     対応から欠落）→**§4.1=20 ja+4 EN=24行、§4.2=補完3行（S-001/S-002/S-003）、合計27行**へ実体と本文を
>     全整合（C-021/C-022は母集合の直接対応先を持たないため§4.2補完へ移設）。
> (E)【Blocker B2】069（参照整合性の例外化）を実証（追加SEED未設計）のまま bound完全としていた→
>     **TBDへ降格**（削除自体はC-011で実証済みだが「参照先残存で例外化」側は未実証のため救済先なきbind
>     を避ける）。
> (F)【Major B3】読み替え30件のうち017（DB相関バリ→smallint超過。候補自身が「相関の字義に厳密には合致
>     しない」と認めていた）・058（削除行→「値が変更される」という自己矛盾極性）・066（除外マスタ削除→
>     旧C-017が新規追加のみで削除を実証しない）の3件は救済先が実在しない過剰bound→**excludedへ移設**
>     （EX-B・per-ID実引きは§8）。
> (G)【Major C1・最重要】旧L1-021/旧C-014の「無効なマスタキーはMappingExceptionを握り潰す」は**捏造**。
>     `MasterdataType`のChoiceType選択肢外の値は`$form['masterdata']->isValid()`が偽になり
>     `getRepository()`呼出し（および`catch (MappingException)`ブロック）自体に到達しない（実際は
>     `TransformationFailedException`→`invalid_message`のChoiceType標準機構）。**md・JSON双方でメカニズム
>     記述を是正**（観測できる事実＝HTTP200・編集テーブル非表示・選択肢エラー表示のみを主張し、
>     「マッピング例外を握り潰し」という設計書md:169の記述とは異なる読みをDOC-DRAFTとして分離）。
> (H)【Major C2】067 partial是正後も「候補ゼロ」の残存記述が複数箇所にあった→**全箇所を統一**。
>     `Authority`の「既存7行」は未照会（コード定数`SYSTEM_ID`〜`GUEST_ID`の存在のみ確認）と明記。
> (I)【Major C3】DB実測の表現を「執筆時点のpsqlワンショット照会（再現性はD5実装時に再確認・@TBD-D5）」へ
>     全箇所降格。ORM静的定義（`Types::SMALLINT`等）とpsql照会結果を明確に区別する表記へ統一。
> (J)【D】6dispatch↔設計書5項目の記述を「矛盾でない」という断定から「**粒度差の可能性・乖離断定なし
>     （未解決の中立記録）**」へ弱める。
> (K)【E】§10の読み替え件数表記を実数（27）に統一。旧C-021（検証失敗時のマスタ選択保持）はS-002へ
>     移設し§4でも要実機ヘッジ文言に統一（§9と表現を揃える）。
> source_class=standard-src+design は fid_kubun.tsv（D1・fid_kubun.tsv:343）による**暫定付与**（確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> fixture_version は全て `@TBD-D5`。統治: `integration_test/CONCRETIZATION_ROLLOUT_PLAN.md`（B0）＋
> `integration_test/CONCRETIZATION_FIRST_PLAN.md`（三段会計）。
> 最強参照=m05-13／m05-17（破壊系DB更新・S0規律・db.ts三段参照・afterEach復元の同型）・
> m10-12（DB破壊系CRUD・相関バリ実在時の判定・§0-§10の型・EX-A per-ID実引き表）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝
> `e2e/fixtures/oracle/_drafts/m11-05_admin_system_setting_setting_system_masterdata_oracle_draft.json`。
> **正式パス `e2e/fixtures/oracle/` 直下・`e2e/helpers/db.ts` 等の正式ファイルには一切書込まない**。
> **本機能の要点（他機能との違い・予防注入の反映）**:
> (1) 本機能は**汎用マスタ編集**であり、対象テーブルは実行時に選択された `mtb_*`（`AbstractMasterEntity` 系）
>     である。**編集対象マスタの選定が本書の安全設計の核**（後述§0-1・§2）。
> (2) 保存ループは `id`・`name`・`sort_no` の3列のみを `setId`/`setName`/`setSortNo` する
>     （`MasterdataController.php:156-158` 逐語・他の setter 呼出し0件を実測）。**「全経路無書込」は主張しない**
>     （保存経路は実在し破壊系である。無書込の断定はしない＝予防注入(4)）。
> (3) DB段差（新発見・本機能固有）: Form層 `Length(max=eccube_int_len=9)` は9桁までの数字を許すが、
>     `AbstractMasterEntity.id` のORM静的定義は `Types::SMALLINT` であり、執筆時点のpsqlワンショット照会
>     （`information_schema.columns`）でも`mtb_sex.id`の`data_type=smallint`（範囲-32768〜32767。Doctrine
>     `options:['unsigned'=>true]` はPostgreSQLでは効果を持たず、`pg_constraint` 照会でも
>     CHECK制約は0件＝主キー制約のみ）を確認した（**再現性・最終確定はD5実装時**）。5〜9桁の値はForm検証を
>     通過するがDB書込で失敗し得る（`flush` 時の例外→`admin.common.save_error`）。
> (4) 拡張イベントは6箇所dispatchされる（`EccubeEvents.php:381-388`）。設計書（md:312-316）の列挙は5項目。
>     「マスタ選択フォーム生成直前」という意味的段階が `index()` と `edit()` の双方（別の識別子＝
>     `ADMIN_SETTING_SYSTEM_MASTERDATA_INDEX_INITIALIZE` と `ADMIN_SETTING_SYSTEM_MASTERDATA_EDIT_FORM_INITIALIZE`）
>     から起きるための粒度差の**可能性がある**（設計書は識別子の完全列挙を明示的には要求していないため）。
>     **乖離を断定せず、未解決の中立記録として扱う**（読取系の予防注入(2)適用＝片側断定しない）。
> (5) 破壊的更新（新規・更新・削除）は**使い捨てSEED行に限定**し、S0スナップショット同値比較で不変性を判定する
>     （SEED値を期待の正にしない＝三段参照）。**既存4行（id=1〜4）はいかなる候補ケースでも送信順・値ともに
>     一切変更しない**（コミットA1是正の核）。編集対象マスタは `Eccube-Entity-Master-Sex`（`mtb_sex`）を用いる。
>     **選定根拠は「使い捨て/影響の小さいマスタ」の当方判断ではなく、ee自身のPHPUnitが採用する既定の安全な
>     試験対象**であること（`MasterdataControllerTest.php:70` `protected $entityTest = 'Eccube-Entity-Master-Sex';`）
>     を一次資料として引用する（§2で詳述）。
> (6) `id` 列は `GeneratedValue: NONE`（アプリがID指定）のため、SEED帯（9001〜9013）・`0`（PK=0確認・ee
>     PHPUnit踏襲）・`32767`（smallint境界内）・`32768`（smallint境界外・保存されない入力）を使い分ける。
>     既存の実マスタ行（id=1〜4）へは新規行の**追加専用**で介入し、既存4行自体の送信順・値は全候補ケースで
>     不変に保つ（詳細は§2）。
> **行数集計（改訂1）**: 候補ケース行総数**27**＝§4.1 bound対応24（ja20＋-EN4）＋§4.2補完3（親test_idなし）。
> 母集合88=bound完全37＋読み替え28＋partial1＋TBD1＋excluded21（EX-A18＋EX-B3）
> （§8の88対応表を機械集計し実測・本ヘッダ値と一致）。

## §0 版固定

- 設計書正本: `functions/ec-cube-enterprise/m11-05_admin_system_setting_setting_system_masterdata.md`
  （本repo HEAD `ec17cd0e419824c2741804abe6f649ed71df0216` 時点・318行）。
- ee実ソース: `/home/y-saito/Developments/ec-cube-enterprise/` コミット `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51`
  （W0/B0各機能と同一checkout）。
- fid_kubun.tsv（D1）: `M11-05｜m11-05_admin_system_setting_setting_system_masterdata｜マスタデータ管理｜対象｜標準｜
  standard-src+design｜0`（fid_kubun.tsv:343）。
- 母集合: baseline `all_it_cases.tsv`（sha256先頭 `7911f190d273`）M11-05全**88行**
  （IT-M11-05-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-MASTERDATA-001〜088）。
- **判定原則（W0教訓・踏襲）**: 観点（IT-XXコード）・前提条件列のシナリオ語は**生成器ノイズ**。bindは各行の
  **「期待結果／レスポンス」実テキスト**で判定し、極性も期待テキストで確認する（§8に全88行の期待要旨併記）。
  本機能は前提列に設計書の項目名・メッセージID・観点語（表示要素・JS挙動・モーダル・M11-05-MSG-00N・検索条件
  ラベル等）が実際の期待内容と対応しない形で転記されている行が多い（例: 009の前提「店舗側権種で許可された
  ログイン状態」×期待「必須バリデーションでエラーが表示され完了しない」＝権限観点と必須バリ観点の取り違え）。
  §10 C4-manualで極性・reinterpretationを個別に記録する。
- **テストケースが正の原則**: 設計書と実装の食い違いは断定せず、DOC-DRAFT（未解決の矛盾候補）として両論併記
  する。§0-1・§9の`Authority`・6dispatch・旧L1-021の3件で本原則を適用した（読取/断定系の予防注入を踏まえ、
  「片側が正」と決め打ちしない）。

### §0-1 編集対象マスタの安全性（破壊系統治の核）

- `MasterdataType.php:50-71` のメタデータ走査条件: 具象クラス（`$rc->isAbstract()` が真なら除外）・
  `$meta->rootEntityName` に文字列 `Master` を含む・`id`/`name`/`sort_no` フィールドを持つ。かつ除外クラス5つ
  （`OrderStatus`・`OrderStatusColor`・`CustomerOrderStatus`・`MtbColorSequence`・`Country`、いずれも
  `MasterdataType.php:59` の配列に列挙）は候補から外れる。
- **全 `AbstractMasterEntity` 具象サブクラスを実測**（`Eccube/Entity/Master/*.php`（`AbstractMasterEntity.php`
  含め91ファイル）のうち、`extends AbstractMasterEntity` を持つ25クラスを`grep`で確定し、各クラスの
  `#[ORM\Column]`宣言数を実測）した結果、`id`/`name`/`sort_no` 以外に永続化列を追加で持つ具象クラスは
  **`Country`（1列・除外5クラスの1つ）・`OrderStatus`（`display_order_count`列を1つ追加・除外5クラスの1つ）・
  `Authority`（`role_key`・`is_viewable`の2列を追加）**の3クラスのみ。**`Authority`（テーブル`mtb_authority`・
  マスタキー`Eccube-Entity-Master-Authority`）は除外5クラスに含まれず、プルダウンから選択可能な候補である**
  （実測・grep結果）。
- **編集対象として`Authority`を採用しない理由**: `Authority`クラスは管理者権限の役割定義であり、
  `Authority::SYSTEM_ID`(=1)〜`Authority::GUEST_ID`(=7)という**コード上の定数**（`Authority.php:40-46`）が
  管理画面全体の認可判定で整数IDとして直接参照される実装になっている。**`mtb_authority`テーブルの実際の
  行数・行内容は本書では未照会**（`Authority`クラスのPHP定数を読んだのみで、`SELECT * FROM mtb_authority`は
  実行していない＝断定しない）。この定数依存の存在自体（コード上の事実）を根拠に、本書は`Authority`を
  破壊的編集の実証対象に**採用しない**という安全側の判断を下す（実データを壊すリスクの検証を優先し、
  未照会のDB行数を根拠にしない）。
  → 「具象マスタの追加列」というエッジケース（設計書md:171・母集合027/067）は、**選択可能な候補として
  `Authority`が実在するが、本書は安全上の理由でこれを実証対象に採用しない**ため、`id`/`name`/`sort_no`
  以外の列が変更されないことをdb.tsで実データ観測することを本書の範囲では行わない（§8 partial区分の根拠。
  §9で詳述）。
- **編集対象の選定**: `Eccube-Entity-Master-Sex`（テーブル `mtb_sex`）を用いる。根拠は当方の相対的安全性判断
  ではなく、ee自身のPHPUnit `MasterdataControllerTest.php:70` が `protected $entityTest =
  'Eccube-Entity-Master-Sex';` として既定の試験対象に採用している一次資料（source_class=standard-src）。
- **安全性（執筆時点のpsqlワンショット照会・再現性はD5実装時に再確認）**: `mtb_sex` は照会時点で4行
  （id=1〜4・sort_no=0〜3。`docker exec ... psql`で1回照会）。FK参照は `dtb_customer.sex_id`・
  `dtb_order.sex_id`（`pg_constraint` 照会=`fk_8298bbe35a2db2a0`・`fk_1d66d8075a2db2a0`）。既存4行
  （男性・女性・その他・回答しない）は**削除せず、送信順・値とも一切変更しない**（実データに参照され得る
  ため。A1是正の核）。破壊操作はすべて**使い捨てSEED帯（id=9001〜9013・0・32767・32768）に限定**し、
  既存4行は毎回のPOSTボディに元の順序・元の値のまま同梱する。
- ORM静的定義＋執筆時点のpsql照会: `mtb_sex.id`=`smallint`・`mtb_sex.sort_no`=`smallint`・`mtb_sex.name`=
  `character varying`。制約は `mtb_sex_pkey PRIMARY KEY (id)` のみ（`unsigned` オプション由来のCHECK制約は
  0件）。

## §1 L1原子オラクル表

規約: claimは検査可能な期待実値まで分解。quoteは一次資料の逐語。unitは文字数系のみ必須。
LS=locale_sensitive（0は理由コード）。**期待値の正は本表のオラクルIDでありSEED値ではない（三段参照）**。
不変性の期待は操作前スナップショット `S0`（db.ts照会値）との同値比較で書く（m05-13/m05-17/m10-12教訓）。

| oracle_id | 観点 | claim（検査可能な期待） | source_class(暫定) | 逐語quote | 根拠(file:line) | unit | LS |
|---|---|---|---|---|---|---|---|
| L1-M1105-001 | auth_rule | 未認証で `GET /%eccube_admin_route%/setting/system/masterdata` へアクセスすると、admin firewall（pattern `^/%eccube_admin_route%/`）のform_loginエントリポイントにより**ログイン画面（route `admin_login`）へ誘導**され本機能を利用できない | 設計書md＋standard-src | 「非管理者・未認証｜（到達前）｜管理画面の認証要件に従い利用できない。」／「未認証｜利用不可。管理画面のログイン要件に従う。」／`admin:`…`pattern: ['^/%eccube_admin_route%/','^/%eccube_messenger_route%/']`…`form_login:`…`login_path: admin_login` | m11-05md:75,230／security.yaml:40-46 | — | 0 `non-translated` |
| L1-M1105-002 | http_status | 入口URL3系統: `GET/POST /%eccube_admin_route%/setting/system/masterdata`（route `admin_setting_system_masterdata`）と`GET/POST .../masterdata/{entity}/edit`（route `admin_setting_system_masterdata_view`）はいずれも同一`index()`で処理・`GET/POST .../masterdata/edit`（route `admin_setting_system_masterdata_edit`）は`edit()`で処理 | standard-src | `#[Route(path: '/%eccube_admin_route%/setting/system/masterdata', name: 'admin_setting_system_masterdata', methods: ['GET', 'POST'])]`／`#[Route(path: '/%eccube_admin_route%/setting/system/masterdata/{entity}/edit', name: 'admin_setting_system_masterdata_view', methods: ['GET', 'POST'])]`／`#[Route(path: '/%eccube_admin_route%/setting/system/masterdata/edit', name: 'admin_setting_system_masterdata_edit', methods: ['GET', 'POST'])]` | MasterdataController.php:35-37,119 | — | 0 `non-ui-observable` |
| L1-M1105-003 | term/display_field | マスタキー=プルダウンおよびhidden項目に用いる、FQCNをハイフン区切りにした識別子（例`Eccube-Entity-Master-Sex`）。保存時はバックスラッシュへ戻す。マスタ選択`select`は`ChoiceType`・`choices`はメタデータ走査結果の反転配列・`NotBlank`制約 | standard-src＋設計書md | 「マスタキー｜プルダウンおよび hidden 項目に用いる、FQCN をハイフン区切りにした識別子（例: `Eccube-Entity-Master-Sex`）。保存時にバックスラッシュへ戻してクラス名とする。」／`$metadataName = str_replace('\\', '-', $meta->getName());`／`->add('masterdata', ChoiceType::class, [ 'choices' => array_flip($masterdata), ..., 'constraints' => [ new Assert\NotBlank() ], ])` | m11-05md:59／MasterdataType.php:68,73-81 | — | 0 `non-translated` |
| L1-M1105-004 | term/display_field | 編集コレクション=保存用フォームの`data`配列（`CollectionType`・`entry_type=MasterdataDataType`・`allow_add`/`allow_delete`/`prototype`いずれも有効）。1要素が1行に対応し`id`と`name`を持つ | 設計書md＋standard-src | 「編集コレクション｜保存用フォームの `data` 配列。1要素が1行に対応し、`id` と `name` を持つ。」／`->add('data', CollectionType::class, [ 'entry_type' => MasterdataDataType::class, 'allow_add' => true, 'allow_delete' => true, 'prototype' => true, ])` | m11-05md:60／MasterdataEditType.php:34-40 | — | 0 `non-translated` |
| L1-M1105-005 | term/db_effect | 行キー=編集コレクションの配列キー。一覧初期表示ではエンティティの主キーと一致（`$data['data'][$value['id']]`）。新規追加行は末尾採番。削除相当の処理ではこのキーで`find`する | 設計書md＋standard-src | 「行キー｜編集コレクションの配列キー。…削除相当の処理ではこのキーで `find` する。」／`$data['data'][$value['id']]['id'] = $value['id'];`／`$delKey = $this->entityManager->getRepository($entityName)->find($key);` | m11-05md:61／MasterdataController.php:86-87,162 | — | 0 `non-ui-observable` |
| L1-M1105-006 | status_transition | マスタ未選択GET（`entity=null`）→ `$data=[]`のまま`builder2`が構築され、`form2.data`は空。twigは`{% if form2.data is not empty %}`が偽となり編集テーブルを出さない。第1カードのマスタ選択select・tooltip見出しは常に表示 | standard-src＋設計書md | 「マスタデータ管理を開く（マスタ未選択）｜…マスタ選択フォームとツールチップ付き見出しが表示される。編集テーブルは表示されない。」／`{% if form2.data is not empty %}` | m11-05md:70／masterdata.twig:45 | — | 0 `non-ui-observable` |
| L1-M1105-007 | status_transition | マスタ選択POST検証成功 → `redirectToRoute('admin_setting_system_masterdata_view', ['entity' => $form['masterdata']->getData()])` | standard-src＋設計書md | `return $this->redirectToRoute( 'admin_setting_system_masterdata_view', ['entity' => $form['masterdata']->getData()] );`／「プルダウンでマスタを選び「選択」を送信｜…同一機能の別入口へリダイレクトされ…」 | MasterdataController.php:69-71／m11-05md:71 | — | 0 `non-ui-observable` |
| L1-M1105-008 | status_transition/display_field | 既にentityが選ばれた状態のGET（`{entity}`パス引数が有効なマスタキー）→ 当該エンティティのリポジトリで`sort_no`昇順`findBy`・各行を行キー=主キーで格納・配列末尾にID/名称とも空の1行を追加。マスタ選択欄には当該entityが選択済みで表示 | standard-src＋設計書md | `$masterdata = $this->entityManager->getRepository($entityName)->findBy([], ['sort_no' => 'ASC']);`／`$data['data'][] = ['id' => '', 'name' => ''];`／「既にマスタが選ばれた状態の入口へ遷移｜…行は `sort_no` 昇順の全件に相当する。末尾に ID・名称とも空の1行が付く。」 | MasterdataController.php:79-92／m11-05md:72 | — | 0 `non-ui-observable` |
| L1-M1105-009 | status_transition/db_effect | 編集テーブル保存POST検証成功 → 永続化処理（L1-015）実行後、選択中マスタの一覧表示入口（`admin_setting_system_masterdata_view`）へリダイレクト | standard-src＋設計書md | `return $this->redirectToRoute( 'admin_setting_system_masterdata_view', ['entity' => $data['masterdata_name']] );`／「編集テーブルで「登録」（保存）を送信｜検証に成功すると永続化処理が走り、続いて選択中マスタの一覧表示入口へリダイレクトされる。」 | MasterdataController.php:189-191／m11-05md:73 | — | 0 `non-ui-observable` |
| L1-M1105-010 | message | 保存成功時: `admin.common.save_complete` ja「保存しました」／en "Saved"。`flush`失敗時: `admin.common.save_error` ja「保存に失敗しました」／en "Failed to save" | standard-src＋設計書md | `$this->addSuccess('admin.common.save_complete', 'admin');`／`$this->addError('admin.common.save_error', 'admin');`／`admin.common.save_complete: 保存しました`／en: `Saved`／`admin.common.save_error: 保存に失敗しました`／en: `Failed to save` | MasterdataController.php:183,186／messages.ja.yaml:1591-1592／messages.en.yaml:1636-1637／m11-05md:表示メッセージ M11-05-MSG-001/002 | — | 1 |
| L1-M1105-011 | validation_rule | マスタ選択`select`は`NotBlank`。未選択でPOSTすると検証失敗 | standard-src＋設計書md | `new Assert\NotBlank(),`／「マスタ選択｜select｜`NotBlank`。」 | MasterdataType.php:78-80／m11-05md:219 | — | 0 `non-translated` |
| L1-M1105-012 | validation_rule/message | 行IDは`required=>false`（任意）・`Assert\Length(max: eccube_int_len)`（確認値9）・`Assert\Regex('/^\d+$/u', message:'form_error.numeric_only')`。数字以外はja「数字で入力してください。」／en "Entry must be numbers."（=M11-05-MSG-003）。超過はSymfony既定カタログのLength超過文言（limit=9解決後） | standard-src＋設計書md | `->add('id', TextType::class, [ 'required' => false, 'constraints' => [ new Assert\Length(['max' => $this->eccubeConfig['eccube_int_len']]), new Assert\Regex(['pattern' => '/^\d+$/u', 'message' => 'form_error.numeric_only']), ], ])`／`eccube_int_len: 9`／`form_error.numeric_only: 数字で入力してください。`／en: `Entry must be numbers.` | MasterdataDataType.php:45-57／eccube.yaml:111／validators.ja.yaml:37／validators.en.yaml:32／m11-05md:220,M11-05-MSG-003 | **文字（桁）** | 0 `non-translated` |
| L1-M1105-013 | validation_rule/message | 行名称は`required=>false`（フォーム上は長さ制約なし）。POST_SUBMITで`isset(id)`かつ`strlen(name)==0`なら`name`欄へ`trans('This value should not be blank.',[],'validators')`エラー付与。ja「入力されていません。」／en "No value found."（=M11-05-MSG-004。※アプリの`validators.en.yaml:17`はvendor既定と別に独自定義した原文） | standard-src＋設計書md | `if (isset($data['id']) && strlen($data['name'] ?? '') == 0) { $form['name']->addError(new FormError(trans('This value should not be blank.', [], 'validators'))); }`／`This value should not be blank.: 入力されていません。`（ja）／`This value should not be blank.: No value found.`（en）／「行名称｜text｜任意。ただし POST_SUBMIT で、ID が存在する行に名称が空なら `validators` 域のブランクエラー。」 | MasterdataDataType.php:61-67／validators.ja.yaml:17／validators.en.yaml:17／m11-05md:221,M11-05-MSG-004 | — | 1 |
| L1-M1105-014 | validation_rule/message | POST_SUBMITで送信中のID値（`isset($value['id'])`の行）を集計し、同一ID値が2件以上ある場合は**該当する全行のID欄**へ`trans('admin.setting.system.master_data.duplicate_id')` ja「重複したIDを登録することはできません。」／en "You are not allowed to register duplicated IDs."（=M11-05-MSG-005） | standard-src＋設計書md | `if ($count >= 2) { $keys = array_keys($ids, $id); foreach ($keys as $key) { $form['data'][$key]['id']->addError(new FormError(trans('admin.setting.system.master_data.duplicate_id'))); } }`／`admin.setting.system.master_data.duplicate_id: 重複したIDを登録することはできません。`／en: `You are not allowed to register duplicated IDs.` | MasterdataEditType.php:54-67／messages.ja.yaml:3339／messages.en.yaml:2953／m11-05md:222,M11-05-MSG-005 | — | 1 |
| L1-M1105-015 | db_effect | 保存ループ（検証成功後）: 各行につき`id!==null && name!==null`なら`repository->find(id)`し無ければ`new $entityName()`、`setId`・`setName`のあとループの0起算連番で`setSortNo`・`persist`。`id`/`name`のいずれかが欠ける行のうち行キーが「送信中の非空ID一覧」に含まれないものは`find(key)`し在れば`remove`（削除行の業務ルール逐語） | standard-src＋設計書md | `if ($value['id'] !== null && $value['name'] !== null) { $entity = $repository->find($value['id']); if ($entity === null) { $entity = new $entityName(); } $entity->setId($value['id']); $entity->setName($value['name']); $entity->setSortNo($sortNo++); $this->entityManager->persist($entity); } elseif (!in_array($key, $ids)) { $delKey = ...->find($key); if ($delKey) { $this->entityManager->remove($delKey); } }`／「削除行｜行の ID と名称が両方 null で、かつその行キーが「送信中の非空 ID 一覧」に含まれない場合、行キーを主キーとして `find` し、存在すれば削除する。」 | MasterdataController.php:143-167／m11-05md:151 | — | 0 `non-ui-observable` |
| L1-M1105-016 | db_effect | `flush`成功時: 保存完了イベント(`ADMIN_SETTING_SYSTEM_MASTERDATA_EDIT_COMPLETE`)をdispatchし成功フラッシュ。`flush`例外時(`catch(\Exception)`・コメント上は外部キー制約等): 例外を握り潰しエラーフラッシュ。いずれもL1-009のリダイレクトへ進む | standard-src＋設計書md | `try { $this->entityManager->flush(); ...dispatch(...EDIT_COMPLETE); $this->addSuccess(...); } catch (\Exception) { // 外部キー制約などで削除できない場合に例外エラーになる $this->addError('admin.common.save_error', 'admin'); }`／「`flush` が例外｜エラーフラッシュを積み、リダイレクトは同様に行う。」 | MasterdataController.php:169-187／m11-05md:168 | — | 0 `non-ui-observable` |
| L1-M1105-017 | db_effect | 保存対象列は選択中マスタに対応するテーブルの`id`・`name`・`sort_no`のみ（`AbstractMasterEntity`）。ORM静的定義: `id`=`Types::SMALLINT`（`GeneratedValue: NONE`＝アプリ指定）・`name`=`Types::STRING(length:255)`・`sort_no`=`Types::SMALLINT`。他の列は保存ループで変更しない | standard-src＋設計書md | `#[ORM\Id] #[ORM\Column(name: 'id', type: Types::SMALLINT, options: ['unsigned' => true])] #[ORM\GeneratedValue(strategy: 'NONE')]`／`#[ORM\Column(name: 'name', type: Types::STRING, length: 255)]`／`#[ORM\Column(name: 'sort_no', type: Types::SMALLINT, options: ['unsigned' => true])]`／「具象マスタの追加列｜本画面の保存処理は `id`・`name`・`sort_no` のみをセットする。その他の列は変更しない。」 | AbstractMasterEntity.php:32-41／m11-05md:171／執筆時点のpsql照会（`information_schema.columns` table_name='mtb_sex'・再現性はD5で再確認） | 文字 | 0 `non-ui-observable` |
| L1-M1105-018 | db_effect（**段差・本機能固有の新発見**） | Form層`Length(max=9桁)`はDBの`smallint`範囲（-32768〜32767）より広い。5〜9桁の値（例32768〜999999999）はForm検証を通過するが、`smallint`範囲外のINSERT/UPDATEはPostgreSQLが数値オーバーフローエラーを返し`flush`が例外化（L1-016のcatch経路）→保存されずエラーフラッシュ。32767は境界内で成功する | standard-src＋執筆時点のpsql照会 | `eccube_int_len: 9`（Form層上限）／`information_schema.columns`照会: `id`列`data_type=smallint`（範囲-32768〜32767）／`pg_constraint`照会: CHECK制約0件（`unsigned`オプションはPostgreSQLでは効果なし） | eccube.yaml:111／AbstractMasterEntity.php:33／執筆時点のpsql照会（`information_schema.columns`/`pg_constraint`。再現性はD5実装時に再確認） | **桁** | 0 `non-ui-observable` |
| L1-M1105-019 | db_effect | マスタ候補条件: 具象クラス（抽象クラス除外）・ルートエンティティ名に`Master`を含む・`id`/`name`/`sort_no`フィールドを持つメタデータ。除外クラス5つ（`OrderStatus`・`OrderStatusColor`・`CustomerOrderStatus`・`MtbColorSequence`・`Country`）は候補から外れる | standard-src＋設計書md | `if ($rc->isAbstract()) { continue; }`／`if (in_array($meta->getName(), [OrderStatus::class, OrderStatusColor::class, CustomerOrderStatus::class, MtbColorSequence::class, Country::class], true)) { continue; }`／`if (str_contains($meta->rootEntityName, 'Master') && $meta->hasField('id') && $meta->hasField('name') && $meta->hasField('sort_no')) {`／「マスタ候補｜具象クラス（抽象クラス除外）、ルートエンティティ名に `Master` を含み、`id`・`name`・`sort_no` フィールドを持つメタデータを候補とする。除外クラスは候補から外す。」 | MasterdataType.php:53-67／m11-05md:147,除外クラス定義(用語表62) | — | 0 `non-ui-observable` |
| L1-M1105-020 | status_transition（エッジケース・**本書では未実行＝§9残**） | 保存処理は編集フォームのhidden `masterdata_name`文字列を`str_replace('-','\\',...)`で解釈するだけであり、マスタ選択フォームの検証・除外クラス判定を経由しない（静的読解）。プルダウンには出ない除外クラス（例`OrderStatus`）でも、hidden値を直接構築してPOSTすれば当該クラスを対象に保存され得る、という静的な読み。**mtb_sex以外のテーブルを対象とするため本書のSEED帯統治の対象外とし、候補ケースとしては実行しない**（§9-4） | 設計書md＋standard-src（静的解析） | 「プルダウンでは選べない除外マスタ｜保存処理は hidden のマスタキー文字列を解釈するため、リクエストを構築できれば当該クラスを対象に保存し得る。」／`$entityName = str_replace('-', '\\', $data['masterdata_name']);`（`edit()`はマスタ選択フォームを経由せず`masterdata_name`をそのまま解釈） | m11-05md:170／MasterdataController.php:141 | — | — |
| L1-M1105-021 | status_transition（**改訂1でメカニズム記述を是正・DOC-DRAFT**） | GET `/masterdata/{entity}/edit`で`{entity}`が`MasterdataType`の候補choicesに含まれない値の場合、`$form->submit(['masterdata' => $entity])`の時点でChoiceTypeの未知値検出が`TransformationFailedException`を投げ、Symfonyがこれを`invalid_message`（既定`'The selected choice is invalid.'`）に基づくフィールドエラーへ変換する（`$form['masterdata']->isValid()`が偽になる）。この結果`if ($form['masterdata']->isValid())`の分岐に入らず、**`getRepository()`呼出し（および`catch (MappingException)`ブロック自体）に到達しない**。`$data`は初期値`[]`のままで`form2.data`は空→編集テーブルは表示されない。HTTP200で応答。ja「選択した値は無効です。」／en "The selected choice is invalid."が`select`欄のエラーとして表示され得る。**設計書md:169「マッピング例外を握り潰し」という記述は、このGET`/{entity}/edit`エントリポイントの到達可能な経路とは異なるメカニズムを指しているように読める（この経路ではMappingExceptionは到達しない、というのが静的解析上の結論）。設計書側の記述の正確性は未確定のため断定せず、DOC-DRAFTとして両論併記する（テストケースが正の原則）** | standard-src（静的解析）vs 設計書md | `if (\count($unknownValues) > 0 && !$options['multiple']) { throw new TransformationFailedException(...); }`／`'invalid_message' => 'The selected choice is invalid.',`／`<source>The selected choice is invalid.</source><target>選択した値は無効です。</target>`／「無効なマスタキーでパス引数だけ開く｜マッピング例外を握り潰し、編集表が出ない状態に寄せ得る。」 | vendor/symfony/form/Extension/Core/Type/ChoiceType.php:161-163,379／vendor/symfony/form/Resources/translations/validators.ja.xlf:25-28（trans-unit id=101）／validators.en.xlf同id／MasterdataController.php:73-96／m11-05md:169 | — | — |
| L1-M1105-022 | concurrency | 行バージョン・楽観ロックは持たない（`AbstractMasterEntity`に`#[ORM\Version]`列なし・保存経路は`persist`→`flush`のみでロック取得呼出なし）。同一行への複数管理セッションの連続保存は最後の`flush`が残る（後勝ち） | 設計書md＋standard-src（傍証） | 「同時更新｜行バージョンや楽観ロックは持たない。同時編集は後勝ちになる。」／「本機能はエンティティマネージャの既定境界で `flush` するだけであり、行バージョン列や楽観ロックを持たない。同時保存は最後に成功した `flush` が残る。」／ee傍証: `AbstractMasterEntity.php`全文実測（Version注釈0件）・保存経路は`setId→setName→setSortNo→persist→flush`のみ | m11-05md:181,304／AbstractMasterEntity.php（全文実測） | — | 0 `non-ui-observable` |
| L1-M1105-023 | request_contract（**補完専用**） | 拡張イベントは6箇所dispatchされる: `INDEX_INITIALIZE`（マスタ選択ビルダ生成直前・`index()`）／`INDEX_FORM2_INITIALIZE`（編集ビルダ生成直前・一覧表示フロー）／`INDEX_COMPLETE`（マスタ選択POST検証成功直後）／`EDIT_INITIALIZE`（編集ビルダ生成直前・保存アクション）／`EDIT_FORM_INITIALIZE`（マスタ選択ビルダ生成直前・`edit()`内の再構成）／`EDIT_COMPLETE`（保存flush成功直後）。設計書md:312-316は5つの意味段階として列挙するが「マスタ選択フォーム生成直前」はコード上2識別子（`INDEX_INITIALIZE`と`EDIT_FORM_INITIALIZE`）に対応する**可能性がある**（乖離断定なし・中立記録） | standard-src＋設計書md | `public const ADMIN_SETTING_SYSTEM_MASTERDATA_INDEX_INITIALIZE = ...`／`_INDEX_FORM2_INITIALIZE`／`_INDEX_COMPLETE`／`_EDIT_INITIALIZE`／`_EDIT_FORM_INITIALIZE`／`_EDIT_COMPLETE`（6定数） | EccubeEvents.php:381-388／MasterdataController.php:44-50,63,100-106,125-131,172-180,197-203／m11-05md:308-316 | — | 0 `non-ui-observable` |
| L1-M1105-024 | display_field | フロント: 第1カードはマスタ選択`select`＋「選択」ボタン（`admin.setting.system.master_data.select`）・カード見出しに`data-bs-toggle="tooltip"`。第2カードは`form2.data`が空でなければ表示・カード見出し下に説明文（`nl2br`）・列見出し「ID」「Name」・各行にID/名称のテキスト入力 | standard-src＋設計書md | `<button class="btn btn-primary" type="submit">{{ 'admin.setting.system.master_data.select'\|trans }}</button>`／`{% if form2.data is not empty %}`／`{{ 'admin.setting.system.master_data.description'\|trans\|nl2br }}`／「表示要素｜第1カードにマスタ選択の `select` と「選択」ボタン。…第2カードは `form2.data` が空でなければ表示…」 | masterdata.twig:33-38,45,52,59-64／m11-05md:84 | — | 0 `non-translated` |
| L1-M1105-025 | message | 説明文（description）: ja「マスターデータの値を設定できます。重複したIDを登録することはできません。空のIDを登録すると、値は削除されます。設定値によってはサイトが機能しなくなる場合もありますので、十分ご注意下さい。」／en "You can set the value to the master data. You are not allowed to register duplicated IDs. If you leave the ID empty, the value will be deleted. Warning: Your store may not work depending on the value you set." | standard-src | `admin.setting.system.master_data.description: |`＋4行（ja）／同キーen4行 | messages.ja.yaml:3332-3336／messages.en.yaml:2946-2950／m11-05md:152 | — | 1 |
| L1-M1105-026 | message | カード見出し=`admin.setting.system.master_data_management` ja「マスタデータ管理」／en "Master Data"＋tooltip=`tooltip.setting.system.master_data_management` ja「各種マスターデータを管理します。」／en "Manage all Master Data here." | standard-src | `{{ 'admin.setting.system.master_data_management'\|trans }}`／`title="{{ 'tooltip.setting.system.master_data_management'\|trans }}"`／`admin.setting.system.master_data_management: マスタデータ管理`／en: `Master Data`／`tooltip.setting.system.master_data_management: 各種マスターデータを管理します。`／en: `Manage all Master Data here.` | masterdata.twig:16,27-28／messages.ja.yaml:2995,3695／messages.en.yaml:2681,3307 | — | 1 |
| L1-M1105-027 | http_status/security | 店舗側権種（確認テストでは`tenant_owner`）でログインし`GET /%eccube_admin_route%/setting/system/masterdata`を送ると`Response::HTTP_FORBIDDEN`（403）。ee PHPUnit `#[Group('Enterprise_Mall')] testTenantCannotAccessMasterdata()`で確認済み | standard-src＋設計書md | `$this->assertEquals(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());`／`$admin = $this->createMember(tenantID: $tenant->getId(), authRole: Authority::TENANT_OWNER);`（`tenantOnlyAllowedTest()`）／「店舗側の権種（確認テストでは `tenant_owner` でログイン）｜`Enterprise_Mall` グループの PHPUnit で、マスタデータ管理への GET が HTTP 403 となることを確認する。」 | MasterdataControllerTest.php:496-507／AbstractAdminWebTestCase.php:57-69／m11-05md:232 | — | 0 `non-ui-observable` |
| L1-M1105-028 | db_effect（エッジケース・ee先例） | 主キー`0`は整数として有効な値であり、ee自身のPHPUnit（`testZeroEdit`／`testZeroRemove`）が「名称を伴う0の保存」および「ID0行の削除」を確認している実装挙動 | standard-src＋設計書md | `$editForm['data'][$id]['id'] = 0; $editForm['data'][$id]['name'] = '0削除テスト';`（`testZeroEdit`）／`$sex->setId(0); ...`／`$this->assertNull($this->entityManager->getRepository($entityName)->find(0));`（`testZeroRemove`）／「主キーとして 0 を使う｜自動テスト上、名称を伴う 0 の保存や、ID 0 行の削除が確認されている。」 | MasterdataControllerTest.php:334-421／m11-05md:167 | — | 0 `non-ui-observable` |

## §2 SEED三段参照設計（★破壊的更新系＝mtb_sex直接反映・改訂1でS0規律を全面再設計）

三段参照: `L1恒等写像claim（passthrough_basis=m11-05md:216-222入力項目表・207-211DBカラム表） →
fixture_version（SEEDセットID@manifest_sha1） → 実値`。固定値は**入力の再現手段**であり期待値の正にしない
（不変性の期待は操作前スナップショットS0との同値比較=m05-13/m05-17/m10-12教訓）。全て `@TBD-D5`。

**破壊系の統治（改訂1・S0絶対規律）**: `mtb_sex`（`Eccube-Entity-Master-Sex`）への登録・更新・削除は承認
ワークフローを介さず`persist/flush`で直接確定する（md:73「検証に成功すると永続化処理が走り」）。
**既存4行（id=1〜4）は全候補ケースを通じて送信順序・値ともに一切変更しない**（codex R1 Blocker A1是正）。
編集テーブルは常に全行を再送信する構造（`form2.data`はGET時に全行+空行、POST時もその全行を編集して送信
する設計）であるため、破壊系ケースは毎回のPOSTボディに**既存4行を元の順序・元の値のまま常に先頭に同梱**し、
SEED帯の行のみを追加・変更・空欄化する。並べ替えの実証（旧C-018）も**SEED帯の行同士の並べ替えのみ**で行い、
既存4行の相対順序には一切触れない設計へ変更した（詳細はC-018参照）。

**id帯の使い分け（`mtb_sex.id`はSMALLINT・GeneratedValue:NONE＝アプリ指定。改訂1でケースごとに専用idへ
再割当し自己完結性を確保）**:

| SEEDセットID | 目的 | 固定値（設計） | 後始末 |
|---|---|---|---|
| SEED-M01-ADMIN | 管理者ログイン | W0/B0各機能と共通（管理画面ログイン可能なmember） | 不変 |
| SEED-M1105-SEX-BASE | 既存4行（不可触・毎回同梱・順序不変） | `mtb_sex`: id=1(男性,sort_no=0)・id=2(女性,sort_no=1)・id=3(その他,sort_no=2)・id=4(回答しない,sort_no=3)（照会値そのまま） | **書換禁止・送信順不変**。S0=毎テスト前に4行全部を照会し、POSTボディへ同一順序・同値で同梱 |
| SEED-M1105-C005 | C-005専用（新規作成） | `mtb_sex` id=9001（初期状態=DBに存在しない） | afterEachで`DELETE FROM mtb_sex WHERE id=9001` |
| SEED-M1105-C006 | C-006専用（自己完結の作成+更新） | `mtb_sex` id=9002（ケース内step1で自ら作成） | afterEachで`DELETE FROM mtb_sex WHERE id=9002` |
| SEED-M1105-C007〜010 | C-007/008/009/010専用（検証失敗・未persist） | id=9003(C-007)/9004(C-008)/9005(C-009)/9006(C-010)。いずれも検証失敗により実際には保存されない想定値 | 保存不成立が期待のため後始末不要（安全網として`SELECT count(*) FROM mtb_sex WHERE id IN (9003,9004,9005,9006)`が0であることをafterEachで確認） |
| SEED-M1105-C011 | C-011専用（自己完結の作成+削除） | `mtb_sex` id=9007（ケース内step1で自ら作成） | afterEachで`DELETE FROM mtb_sex WHERE id=9007`（安全網。正常系では既にケース内で削除済み） |
| SEED-M1105-ZERO-C012 | C-012専用（PK=0新規作成） | `mtb_sex` id=0（ケース内で自ら作成） | afterEachで`DELETE FROM mtb_sex WHERE id=0` |
| SEED-M1105-ZERO-C013 | C-013専用（PK=0の自己完結の作成+削除・C-012に依存しない） | `mtb_sex` id=0（ケース内step1で自ら作成） | afterEachで`DELETE FROM mtb_sex WHERE id=0`（安全網） |
| SEED-M1105-BOUND | smallint境界値確認（C-019/C-020） | `mtb_sex`: id=32767（境界内・C-020）／id=32768（境界外・C-019、保存試行のみで行として残らない想定） | 32767は**afterEachで`DELETE FROM mtb_sex WHERE id=32767`**。32768は保存失敗が期待のため後始末不要（安全網で`SELECT count(*) FROM mtb_sex WHERE id=32768`が0であることを確認） |
| SEED-M1105-REORDER | C-018専用（SEED帯行のみの並べ替え・既存4行には一切触れない） | `mtb_sex` id=9010(name=R1)・id=9011(name=B2)・id=9012(name=Y3)（ケース内step1で自ら作成） | afterEachで`DELETE FROM mtb_sex WHERE id IN (9010,9011,9012)` |
| SEED-M1105-C023 | C-023専用（同時更新・自己完結の作成後に2セッション連続保存） | `mtb_sex` id=9013（ケース内step1で自ら作成） | afterEachで`DELETE FROM mtb_sex WHERE id=9013` |

- **S0規律**: 「保存されない・変更されない・削除されない」の期待は、操作前にdb.tsで取得したスナップショット
  （例 `S0=SELECT id,name,sort_no FROM mtb_sex ORDER BY id`）との同値比較で書く。SEED投入値のリテラルは
  前提・復元にのみ使う（期待値の正はL1オラクルID）。
- **既存4行の不変性の検証（全ケース共通の安全網）**: 各候補ケースは実行前後で
  `SELECT id,name,sort_no FROM mtb_sex WHERE id IN (1,2,3,4) ORDER BY id`を照会しS0との同値比較を安全網
  として行う（不一致ならテスト失敗として扱い、UPSERTで即時復元・インシデントとして記録。これは「afterEach
  で既存行を書き戻す」設計ではなく「既存行がそもそも変化しないことを毎回確認する」設計である点が改訂前との
  違い）。
- **各候補ケースは自ケース内でSEED行を自己生成する**（codex R1 Blocker A3是正）: C-006/C-011/C-013/C-018/
  C-023はいずれも他ケースの残置行に依存せず、自分自身のstep1で対象行を作成してから本題の操作を行う設計に
  改めた（実行順序・afterEachタイミングに依存しない自己完結性）。
- **参照整合性テスト（母集合069）に必要な追加SEED**: `mtb_sex`は`dtb_customer.sex_id`／`dtb_order.sex_id`から
  FK参照される。「参照先が残ると削除がflush例外になる」ことを実証するには、SEED帯の`mtb_sex`行を参照する
  `dtb_customer`または`dtb_order`のSEED行が必要。**本書では未設計**（`dtb_customer`/`dtb_order`のSEED行構築
  はM05/M03系機能のSEED設計と重複するため本機能では自己完結させず、TBD・追加SEED要として§9に記録。069は
  bound完全からTBDへ降格した＝§8参照）。
- **除外クラス直接POSTの検証（旧C-017）は本書では実行しない**: `OrderStatus`の`dtb_order_status`は`mtb_sex`
  とは別テーブルであり、本書が統治するSEED帯（9001〜9013・0・32767・32768、いずれも`mtb_sex`限定）の外側に
  ある。`dtb_order_status`は業務ステータス表示に使われる実データテーブルであり、同水準のS0/afterEach復元
  契約（対象テーブル全行の照会・専用SEED帯の設計）を本書の範囲では設計しない。静的根拠（L1-020）は維持する
  が、実行される候補ケースとしては提示しない（§9-4に要実機残として記録）。
- **flush例外(DB段差)の再現（C-019）**: id=32768（5桁・`eccube_int_len=9`以内だが`smallint`範囲外）を新規行
  として送信すると、PostgreSQLの数値範囲エラーによりINSERT自体が失敗し`flush`が例外化する設計（L1-018）。
  この経路は外部キー制約ではなくDB型範囲によるものだが、`catch (\Exception)`は型を問わず捕捉するため同じ
  エラーフラッシュ経路を通る。
- 対象行の一意特定は**固定id**で決定的。db.tsは既存の汎用関数（`queryScalar`/`queryNumber`/`queryRows`/
  `sqlLiteral`）を`mtb_sex`向けの生SQLで直接使う（`dtb_news`専用ラッパーと同様の専用ラッパー追加は実装フェーズ
  （D8以降）の作業であり、本候補段階では正式ファイル`e2e/helpers/db.ts`への追記を行わない＝正式パス書込禁止）。

## §3 画面項目マトリクス（任意/必須/最大長/文字種/所在）

三値比較: 設計書md（入力項目表:216-222）／ee Form（`MasterdataType.php`／`MasterdataDataType.php`／
`MasterdataEditType.php`）／ee DB（`AbstractMasterEntity.php`＋執筆時点のpsql照会）。

| 項目 | 任意/必須 | 最大文字数（Form層/DB層・unit） | 文字種・範囲 | 所在 | 境界・代表値 | メッセージ（ja/en・L1参照） |
|---|---|---|---|---|---|---|
| マスタ選択（`masterdata`） | **必須**（`NotBlank`） | 選択肢に依存（`ChoiceType`・自由入力なし） | メタデータ走査結果の候補キーのみ（除外5クラス排除） | 第1カード`select` | 未選択→エラー／有効キー選択→成功 | NotBlank: L1-011（Symfony既定・欄直下） |
| 行ID（`data[n][id]`） | 任意（`required=>false`） | **Form 9桁**（`eccube_int_len`）**／DB `smallint`＝実質5桁上限（32767）**→**段差あり（L1-018・本機能固有の新発見）** | `Regex('/^\d+$/u')`＝十進非負整数のみ（先頭ゼロ・空白等は不可） | 第2カード各行`data.id` | `"32767"`受理・DB保存成功／`"32768"`はForm受理・DB書込失敗（flush例外・L1-018）／`"999999999"`（9桁）はForm受理・DB書込失敗／`"abc"`拒否（Regex）／10桁`"1234567890"`拒否（Length） | 数字以外: L1-012（`form_error.numeric_only`＝M11-05-MSG-003）／超過: L1-012のLength側 |
| 行名称（`data[n][name]`） | **条件付き**（`required=>false`だがPOST_SUBMITでID入力済み行は空を禁止＝実質「IDがあれば必須」） | フォーム上は長さ制約なし（DB列は`varchar(255)`だがForm/Validatorに長さ制約の実装なし＝Form層は無制限） | 制約なし（自由文字列） | 第2カード各行`data.name` | ID入力+名称空欄→エラー（L1-013）／ID空欄+名称空欄→削除相当（他行に当該IDが無ければ、L1-015） | ブランク: L1-013（`This value should not be blank.`＝M11-05-MSG-004） |
| 行ID（集合・重複検査） | — | — | POST_SUBMITで送信中の全行ID値を集計 | フォーム全体 | 同一ID値2行→両方エラー | 重複: L1-014（`admin.setting.system.master_data.duplicate_id`＝M11-05-MSG-005） |

## §4 実行可能グレード14列TSV（候補・**自己完結＝全27行を実体掲載**）

記法: 期待結果セルは三段参照 `…実値… [L1:<oracle_id>; fixture:<SEEDセットID>@TBD-D5]`。
`%eccube_admin_route%` は環境値（既定 `admin`）。SEX=既存4行（SEED-M1105-SEX-BASE・常に元の順序・元の値で
同梱）。各ケースは自ケース専用のSEEDセットID（§2）に基づき自ら対象行を作成する（他ケースの残置に依存しない）。
不変性の期待は**操作前スナップショットS0**（db.ts照会値）との同値比較で書く。en行はD15前提。

### §4.1 bound対応候補行（24行=ja20＋-EN4。§8の88対応表が参照する全行）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105C-001	IT-20	出力抑止	P1	マスタ未選択GETで選択フォームのみ表示され編集テーブルは出ない	ログイン済(SEED-M01-ADMIN)	—	1. GET /%eccube_admin_route%/setting/system/masterdata 2. 第1カードのselect・「選択」ボタン・tooltip(title属性)・description文言・第2カード(table.table-sm)の有無を読む	第1カードにselect+「選択」ボタン表示・tooltipのtitle属性が「各種マスターデータを管理します。」・見出し「マスタデータ管理」・第2カード(編集テーブル)は非表示 [L1:L1-M1105-006,L1-M1105-024,L1-M1105-026]				
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105C-002	IT-22	必須	P1	マスタ選択を空のままPOST→NotBlankエラーで同一画面に留まる	ログイン済	masterdata=(空)	1. POST /%eccube_admin_route%/setting/system/masterdata へmasterdata未指定で送信 2. 応答（リダイレクトの有無）とselect欄直下のエラー文言を読む	リダイレクトされず200で同一画面が再表示され、select欄にNotBlankの検証エラーが付く [L1:L1-M1105-011]				
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105C-003	IT-15	識別子	P1	マスタ選択でEccube-Entity-Master-Sexを選び送信→検証成功しentity付きでリダイレクト	ログイン済	masterdata=Eccube-Entity-Master-Sex	1. POST /%eccube_admin_route%/setting/system/masterdata へ送信 2. 応答ヘッダのLocationを読む	`admin_setting_system_masterdata_view`（entity=Eccube-Entity-Master-Sex）へのリダイレクト（302相当） [L1:L1-M1105-007,L1-M1105-003]				
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105C-004	IT-25	状態変化	P1	既存マスタ選択済みのGETで選択欄反映+編集テーブル(sort_no昇順+空末尾行)が表示される	ログイン済／SEED-M1105-SEX-BASE	—	1. GET /%eccube_admin_route%/setting/system/masterdata/Eccube-Entity-Master-Sex/edit 2. select要素の選択値と編集テーブルの各行tr id="ex-masterdata-{key}"の順序・件数・末尾行の入力値を読む	select値=Eccube-Entity-Master-Sex・編集テーブルにid1,2,3,4(sort_no昇順)の4行+末尾に空行(id/nameとも空)の計5行が表示される [L1:L1-M1105-008,L1-M1105-005; fixture:SEED-M1105-SEX-BASE@TBD-D5]				
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105C-005	IT-26	登録内容	P1	編集テーブル末尾行に新規ID/名称を入力し登録送信→新規persist・sort_no連番・保存成功フラッシュ・一覧へリダイレクト（既存4行は不変）	ログイン済／SEED-M1105-SEX-BASE	既存4行はS0のまま元の順序で同梱／末尾行: id=9001,name=`E2E-<runid>-新規`	1. db.tsでS0=id,name,sort_no(id1-4) を照会 2. 編集フォームへ既存4行(S0のまま・元の順序)+末尾行(id=9001,name入力)を投入し登録ボタン押下 3. 遷移先とフラッシュを読む 4. db.tsでid=9001の行を照会しid1-4のsort_noがS0と同値であることを確認（afterEach: id=9001を削除）	「保存しました」フラッシュ＋`admin_setting_system_masterdata_view`(entity=Sex)へリダイレクト＋mtb_sexにid=9001の新規行が追加(name=入力値・sort_no=4=送信順の5番目)・id1-4のsort_no=S0と完全一致（既存4行は一切変化しない） [L1:L1-M1105-009,L1-M1105-015,L1-M1105-016,L1-M1105-010; fixture:SEED-M1105-C005@TBD-D5]				
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105C-005-EN	IT-26	登録内容	P2	新規登録成功フラッシュ（en）	ログイン済／locale=en	同上	同上	"Saved" 表示＋一覧へリダイレクト（主判定=DB新規行はC-005と同一） [L1:L1-M1105-010]				
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105C-006	IT-26	更新内容	P1	【自己完結】自ケースで新規行(id=9002)を作成した後にその名称を変更し登録送信→find(id)で既存ヒットしsetName更新（既存4行は不変）	ログイン済	既存4行はS0のまま元の順序で同梱／step1: id=9002,name=`E2E-<runid>-初期` を作成／step2: id=9002のname=`E2E-<runid>-更新後`	1. db.tsでS0=id,name,sort_no(id1-4)を照会 2.(setup)編集フォームへ既存4行(S0のまま)+末尾行(id=9002,name=初期値)を投入し登録送信 3. db.tsでname(id=9002)=初期値を確認 4. 編集フォームで既存4行(S0のまま)+id=9002行のnameを新値に変更して登録送信 5. 遷移先とフラッシュを読む 6. db.tsでid=9002のnameとid1-4のsort_noを照会（afterEach: id=9002を削除）	いずれの保存も「保存しました」フラッシュ＋一覧へリダイレクト＋mtb_sex(id=9002).name=最終入力値へ更新・id1-4のsort_noはS0と完全一致（既存4行は一切変化しない） [L1:L1-M1105-015,L1-M1105-016,L1-M1105-010,L1-M1105-017; fixture:SEED-M1105-C006@TBD-D5]				
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105C-007	IT-22	必須	P1	IDのみ入力し名称を空欄で登録送信→POST_SUBMITでname欄にブランクエラー・DB不変	ログイン済	既存4行はS0のまま元の順序で同梱／末尾行: id=9003,name=(空)	1. db.tsでS0=count(*) FROM mtb_sex照会 2. 編集フォームで既存4行(S0のまま)+末尾行(id=9003のみ入力・name空欄)を投入し登録送信 3. 応答（リダイレクトの有無）とname欄直下のエラー文言を読む 4. db.tsでid=9003の不存在を照会	リダイレクトされず200で同一画面が再表示され、当該行のname欄直下に「入力されていません。」・mtb_sexにid=9003の行は追加されない（S0と同件数） [L1:L1-M1105-013]				
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105C-007-EN	IT-22	必須	P2	名称ブランクエラー文言（en）	ログイン済／locale=en	同上	同上	name欄直下に "No value found."（完全一致。主判定=DB不変はC-007と同一） [L1:L1-M1105-013]				
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105C-008	IT-22	文字列長	P1	行IDに数字以外("abc")を入力(名称は入力)して登録送信→Regexエラー・DB不変	ログイン済	既存4行はS0のまま元の順序で同梱／末尾行: id=`abc`,name=`E2E-<runid>-非数字`	1. db.tsでS0=count(*) FROM mtb_sex照会 2. 編集フォームで既存4行(S0のまま)+末尾行(id="abc",name入力)を投入し登録送信 3. id欄直下のエラー文言を読む 4. db.tsで当該nameの行が0件であることを照会	リダイレクトされず200で同一画面が再表示され、id欄直下に「数字で入力してください。」・mtb_sexに新規行は追加されない [L1:L1-M1105-012]				
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105C-008-EN	IT-22	文字列長	P2	行ID数字以外エラー文言（en）	ログイン済／locale=en	同上	同上	id欄直下に "Entry must be numbers."（完全一致） [L1:L1-M1105-012]				
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105C-009	IT-22	文字列長	P1	行IDに10桁の数字("1234567890")を入力して登録送信→Length超過エラー・DB不変	ログイン済	既存4行はS0のまま元の順序で同梱／末尾行: id=`1234567890`(10桁),name=`E2E-<runid>-超過`	1. db.tsでS0=count(*)照会 2. 編集フォームで既存4行(S0のまま)+末尾行(id=10桁,name入力)を投入し登録送信 3. id欄直下のエラー文言を読む 4. db.tsで当該nameの行が0件であることを照会	リダイレクトされず200で同一画面が再表示され、id欄直下にSymfony既定のLength超過文言（limit=9解決後）・mtb_sexに新規行は追加されない [L1:L1-M1105-012]				
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105C-010	IT-23	検索条件	P1	同一送信内で2行に同じID値を入力して登録送信→両行のID欄に重複エラー・DB不変	ログイン済	既存4行はS0のまま元の順序で同梱／末尾2行にid=9006を重複入力（name共に入力）	1. db.tsでS0=count(*)照会 2. 編集フォームで既存4行(S0のまま)+末尾2行(いずれもid=9006・nameは異なる値)を投入し登録送信 3. 両方のid欄直下のエラー文言を読む 4. db.tsでid=9006の不存在を照会	リダイレクトされず200で同一画面が再表示され、両方のid欄直下に「重複したIDを登録することはできません。」・mtb_sexにid=9006の行は追加されない [L1:L1-M1105-014]				
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105C-010-EN	IT-23	検索条件	P2	行ID重複エラー文言（en）	ログイン済／locale=en	同上	同上	id欄直下に "You are not allowed to register duplicated IDs."（完全一致） [L1:L1-M1105-014]				
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105C-011	IT-23	検索条件	P1	【自己完結】自ケースで作成した行(id=9007)のIDと名称を両方空にして(他行に同IDが無い状態で)登録送信→find(key)で削除	ログイン済	既存4行はS0のまま元の順序で同梱／step1: id=9007,name=`E2E-<runid>-削除対象` を作成／step2: id=9007のid/name欄を両方空欄化	1. db.tsでS0=count(*) WHERE id=9007を照会(0件のはず) 2.(setup)編集フォームへ既存4行(S0のまま)+末尾行(id=9007,name入力)を投入し登録送信 3. db.tsでcount(*) WHERE id=9007=1を確認 4. 編集フォームで既存4行(S0のまま)+id=9007行のid/name欄を両方空欄にして登録送信 5. フラッシュを読む 6. db.tsでid=9007の不存在を照会（afterEach: 安全網としてid=9007を削除）	いずれの保存も「保存しました」フラッシュ＋一覧へリダイレクト＋最終的にmtb_sexからid=9007の行が削除される [L1:L1-M1105-015,L1-M1105-016; fixture:SEED-M1105-C011@TBD-D5]				
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105C-012	IT-23	検索条件	P2	主キー0の行を新規追加して登録送信→id=0がpersistされる（ee PHPUnit `testZeroEdit` 踏襲）	ログイン済	既存4行はS0のまま元の順序で同梱／末尾行: id=0,name=`E2E-<runid>-ゼロ`	1. db.tsでS0=count(*) WHERE id=0照会(0件のはず) 2. 編集フォームで既存4行(S0のまま)+末尾行(id=0,name入力)を投入し登録送信 3. フラッシュを読む 4. db.tsでid=0の行のnameを照会（afterEach: id=0を削除）	「保存しました」フラッシュ＋一覧へリダイレクト＋mtb_sex(id=0).name=入力値（0が主キーとして有効に保存される） [L1:L1-M1105-028; fixture:SEED-M1105-ZERO-C012@TBD-D5]				
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105C-013	IT-23	検索条件	P2	【自己完結・C-012に依存しない】自ケースでid=0の行を作成した直後にid/name両方空欄で登録送信→削除される（`testZeroRemove`踏襲）	ログイン済	既存4行はS0のまま元の順序で同梱／step1: id=0,name=`E2E-<runid>-ゼロ削除用` を作成／step2: id=0のid/name欄を両方空欄化	1. db.tsでS0=count(*) WHERE id=0照会(0件のはず) 2.(setup)編集フォームへ既存4行(S0のまま)+末尾行(id=0,name入力)を投入し登録送信 3. db.tsでcount(*) WHERE id=0=1を確認 4. 編集フォームで既存4行(S0のまま)+id=0行のid/name欄を両方空欄にして登録送信 5. フラッシュを読む 6. db.tsでid=0の不存在を照会（afterEach: 安全網としてid=0を削除）	いずれの保存も「保存しました」フラッシュ＋一覧へリダイレクト＋最終的にmtb_sexからid=0の行が削除される [L1:L1-M1105-028,L1-M1105-015; fixture:SEED-M1105-ZERO-C013@TBD-D5]				
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105C-014	IT-25	識別子	P2	【改訂1でメカニズム記述を是正】存在しない不正なマスタキー文字列でパス引数だけ開く→ChoiceType選択肢外エラーによりgetRepository到達前に検証失敗・編集テーブル非表示	ログイン済	entity=`Eccube-Entity-Master-NonExistentXyz`（候補choicesに含まれない値）	1. GET /%eccube_admin_route%/setting/system/masterdata/Eccube-Entity-Master-NonExistentXyz/edit 2. 応答ステータス・マスタ選択select欄のエラー文言・第2カード(table.table-sm)の有無を読む	HTTP200で応答し、マスタ選択select欄に「選択した値は無効です。」（ChoiceType既定invalid_message・vendor訳）のエラーが表示され、編集テーブルは表示されない。**「MappingExceptionが握り潰される」という旧記述は本経路では到達しないため主張しない（DOC-DRAFT・両論併記）** [L1:L1-M1105-021]				
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105C-015	IT-15	CSRF	P1	未認証でGET→ログイン画面へ誘導	未認証	—	1. 認証Cookie無しでGET /%eccube_admin_route%/setting/system/masterdata	`admin_login`のログイン画面へリダイレクトされ本画面は表示されない [L1:L1-M1105-001]				
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105C-016	IT-22	相関バリデーション	P1	tenant_ownerでログインしGET→HTTP403	ログイン済(tenant_owner・Enterprise_Mall)	—	1. tenant_ownerでログイン 2. GET /%eccube_admin_route%/setting/system/masterdata 3. 応答ステータスを読む	HTTP403（Forbidden） [L1:L1-M1105-027]				
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105C-018	IT-26	更新内容	P2	【全面差替・既存4行は一切送信順を変えない】自ケースでSEED帯3行(9010,9011,9012)を作成した後にSEED帯内でのみ並び順を入れ替えて送信→SEED帯行のsort_noのみ送信順で再割当・既存4行のsort_noは無変化	ログイン済	既存4行は常にS0のまま元の順序で先頭に同梱（本ケースを通じて一切変更しない）／step1: 既存4行+9010(name=R1)+9011(name=B2)+9012(name=Y3)をこの順で投入／step2: 既存4行(元の順序のまま)+9012+9010+9011の順で再送信	1. db.tsでS0=id,sort_no(id1-4)を照会 2.(setup)既存4行(S0のまま・元の順序)+9010+9011+9012をこの順で投入し登録送信 3. db.tsでsort_no(9010,9011,9012)=4,5,6を確認・id1-4のsort_noがS0と同値であることも確認 4. 既存4行(S0のまま・元の順序を一切変えず)+9012+9010+9011の順で再送信 5. db.tsでsort_no(9010,9011,9012)を再照会・id1-4のsort_noを再照会（afterEach: id∈{9010,9011,9012}を削除）	いずれの保存も「保存しました」フラッシュ。最終的にmtb_sexのsort_noは送信順どおり再割当される（9012→4,9010→5,9011→6）が、**id1-4のsort_noはstep2の前後でS0と完全一致し一切変化しない**（既存4行は常に先頭・元順序で送信されるため） [L1:L1-M1105-015,L1-M1105-017; fixture:SEED-M1105-REORDER@TBD-D5]				
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105C-019	IT-23	検索条件	P2	新規行にid=32768(9桁以内だがsmallint範囲外)を入力して登録送信→flush例外→エラーフラッシュ・DB不変	ログイン済	既存4行はS0のまま元の順序で同梱／末尾行: id=32768,name=`E2E-<runid>-桁溢れ`	1. db.tsでS0=count(*) WHERE id=32768照会(0件のはず) 2. 編集フォームで既存4行(S0のまま)+末尾行(id=32768,name入力)を投入し登録送信 3. フラッシュと遷移先を読む 4. db.tsでid=32768の不存在を照会	「保存に失敗しました」エラーフラッシュ＋一覧へリダイレクト（L1-016の例外分岐どおりリダイレクトは行われる）＋mtb_sexにid=32768の行は追加されない（DB smallint範囲外による書込失敗） [L1:L1-M1105-018,L1-M1105-016; fixture:SEED-M1105-BOUND@TBD-D5]				
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105C-020	IT-23	検索条件	P3	新規行にid=32767(smallint境界内)を入力して登録送信→正常保存	ログイン済	既存4行はS0のまま元の順序で同梱／末尾行: id=32767,name=`E2E-<runid>-境界内`	1. 編集フォームで既存4行(S0のまま)+末尾行(id=32767,name入力)を投入し登録送信 2. フラッシュを読む 3. db.tsでid=32767の行を照会（afterEach: id=32767を削除）	「保存しました」フラッシュ＋mtb_sex(id=32767).name=入力値で保存される [L1:L1-M1105-018; fixture:SEED-M1105-BOUND@TBD-D5]				
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105C-023	IT-26	同時更新	P3	【自己完結】自ケースで作成した行(id=9013)へ複数管理セッションの連続保存を行うと最後の保存が残る（後勝ち）	ログイン済×2管理セッション(A/B・いずれもSEED-M01-ADMIN)	既存4行はS0のまま元の順序で同梱／step1: id=9013,name=`E2E-<runid>-初期` を作成／A: name=`E2E-<runid>-CCA`／B: name=`E2E-<runid>-CCB`	1. db.tsでS0=count(*) WHERE id=9013照会(0件のはず) 2.(setup)編集フォームへ既存4行(S0のまま)+末尾行(id=9013,name=初期値)を投入し登録送信 3. セッションA・Bそれぞれで編集画面を開きtoken取得 4. 同一行(id=9013)へ A→B の順で連続して登録送信（真の同時実行は非決定的のため順序を確定。既存4行はS0のまま・元の順序で毎回同梱） 5. db.tsでnameを照会（afterEach: id=9013を削除）	いずれの保存もエラーにならず一覧へリダイレクト・mtb_sex(id=9013).name=`E2E-<runid>-CCB`（最後の保存が残る=後勝ち。ロック競合エラーは発生しない） [L1:L1-M1105-022,L1-M1105-015; fixture:SEED-M1105-C023@TBD-D5]				
```

### §4.2 補完行（3行=ja3。**親test_idなし・母集合会計に算入しない**。改訂1でC-021/C-022をここへ移設）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105S-001	IT-12	内部情報	P3	拡張イベントが6箇所dispatchされる（静的確認・非Playwright）	—	—	1. `EccubeEvents.php:381-388`の定数定義とコントローラの各dispatch呼出し箇所を確認する（実装フェーズでリスナーを仕込みdispatch有無を検証する設計とする） 2. 母集合には拡張イベント自体を主題とする行が無いことを確認する	6識別子（INDEX_INITIALIZE/INDEX_FORM2_INITIALIZE/INDEX_COMPLETE/EDIT_INITIALIZE/EDIT_FORM_INITIALIZE/EDIT_COMPLETE）がそれぞれ実装済みコード上の該当箇所でdispatchされる（補完行・親test_idなし・設計書md:308-316の5項目列挙との対応は本書冒頭(4)参照。乖離断定なし） [L1:L1-M1105-023]				
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105S-002	IT-25	状態変化	P3	【要実機・確定期待にしない】編集POSTが検証失敗した直後もマスタ選択欄には直前に選択していたマスタが保持されたまま同一画面が再表示されるか	ログイン済／SEED-M1105-SEX-BASE	C-008と同一（id="abc"でRegexエラーを誘発）	1. C-008の手順でRegexエラーを誘発 2. 応答内のマスタ選択select要素の選択値を読む	`edit()`の`$parameter = array_merge($request->request->all(), ['masterdata' => $form2['masterdata_name']->getData()]); $form->submit($parameter);`（`MasterdataController.php:206-207`）により選択状態がhiddenから再構成される設計だが、`select`要素の選択済み表示（`selected`属性）へ正しく反映されるかはSymfony FormのChoiceType描画に依存し**未確認（要実機・確定期待にしない）**（補完行・親test_idなし・§9-5と同一の要実機区分） [L1:L1-M1105-012（背景として処理フロー「検証失敗時のhidden merge」を利用）]				
m11-05_admin_system_setting_setting_system_masterdata	E2E-M1105S-003	IT-25	識別子	P3	編集専用入口へのGET（データ未指定）はHTTP200で応答し編集テーブルは出ない	ログイン済	—	1. GET /%eccube_admin_route%/setting/system/masterdata/edit（Refererやセッションにマスタ選択状態を残さない単純GET） 2. 応答ステータスと第2カードの有無を読む	HTTP200・編集テーブルは表示されない（`data`未指定のため`form2.data`が空）（補完行・親test_idなし） [L1:L1-M1105-002]				
```

## §5 locale対応表

LS=1 claim: **L1-010（保存成功/失敗フラッシュ）・L1-013（名称ブランクエラー）・L1-012（数字以外エラー・
超過メッセージ）・L1-014（重複IDエラー）・L1-025（description）・L1-026（カード見出し/tooltip）** の6claim
→ -EN 4行（すべてbound従属）。
- bound従属: C-005-EN（L1-010）／C-007-EN（L1-013）／C-008-EN（L1-012）／C-010-EN（L1-014）。
- L1-025・L1-026はC-001（ja側）に統合掲載のみで-EN個別行を新設しない（背景説明文言はC-001の主判定に
  従属する副次観測のため、locale別の専用行を割かず本表に記録するに留める＝過剰な行数膨張の回避）。
- 全行§4に実体掲載（自己完結）。文言はen一次資料逐語（ja翻訳ゼロ）。
- L1-012の超過メッセージ（Length limit=9解決後）はvendor `validators.ja/en.xlf`のchoice側を再利用
  （W0/m05-13/m10-12と同一vendor＝symfony/validator v7.4.3）。
- -EN実行前提はD15（M0 Go/No-Go。管理画面のen切替口なし＝W0実測を継承）。

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

- page/spec: 本機能専用のpage/specは**未確認**（`e2e/pages/admin/m11/`・`e2e/spec/admin/m11/`配下の
  `m11_05_*`ファイルはfind未実施のため存在有無を断定しない＝予防注入(4)。実装フェーズ（D8以降）で
  `find e2e -iname "*m11_05*"`を実施し、既存artifactの有無を確認したうえでセレクタを設計する）。
- db.ts: 既存の汎用関数（`queryScalar`/`queryNumber`/`queryRows`/`sqlLiteral`）を`mtb_sex`向けの生SQLで
  直接使う（`dtb_order_status`向けの拡張は旧C-017の削除に伴い不要になった。§9-4参照）。`dtb_news`専用
  ラッパーと同様の専用ラッパー追加は実装フェーズの作業であり、本候補段階では正式ファイル
  `e2e/helpers/db.ts`への追記を行わない（＝正式パス書込禁止の遵守）。
- 境界値は`runFill(n, repertoire, prefix)`（決定的生成、既存ヘルパの型を踏襲）。数値境界（32767/32768等）は
  リテラル指定（`runFill`の対象外）。
- **不変性の判定規約**: 「保存されない・変更されない・削除されない」の期待は**操作前スナップショットS0
  （db.ts照会値）との同値比較**で判定し、SEED初期値リテラルを期待の正にしない（三段参照）。
- **破壊系の実装規約（改訂1）**: 保存系ケース（C-005,006,011,012,013,018,020,023）は対象=各ケース専用の
  固定idのSEED行のみ・**各ケースが自ケース内で対象行を作成してから操作する自己完結設計**（他ケースの
  残置に依存しない）。新規作成・削除・並べ替えいずれもafterEachで当該idを削除。**既存4行（id1-4）は
  全ケースで毎回同一順序・同一値のまま同梱し、送信順序も一切変更しない**（§2）。C-019（DB段差の失敗確認）・
  C-007〜010（検証失敗）は保存が発生しないため後始末不要（安全網として件数不変の照会のみ）。
- **serial実行必須**: 同一`mtb_sex`テーブルを複数ケースが共有する（既存4行の共通再送信）ため、破壊系ケースは
  serial実行必須（並列実行不可。m05-13/m05-17/m10-12と同じ規律）。

**_drafts/隔離lintの実施証跡（実測・実施済み）**:
1. 正式消費側（`e2e/helpers/oracle.ts`・`db.ts`・spec・pages）に本草案を消費する`_drafts`参照は**0件**
   （隔離ガード自体のリテラル〔oracle.ts側〕は機械強制であり消費参照ではない）。
2. 正式パス`e2e/fixtures/oracle/`直下に本機能のjsonは**作成していない**（草案は`_drafts/`のみ）。
3. `e2e/helpers/db.ts`への追記・変更は**行っていない**（本セッションでの編集対象は`_drafts/`配下の
   2ファイルのみ）。
4. 本md・oracle草案jsonの出力先はともに`_drafts/`配下のみ。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

| ケース群 | 実行区分（候補） | 観測層 | 備考 |
|---|---|---|---|
| C-001,004,014,015,016 | Playwright | GUI/HTTP | 表示・遷移・権限確認（DB不関与または読取専用） |
| C-002,007(+EN),008(+EN),009,010(+EN) | Playwright+db.ts | GUI+DB | 検証失敗・DB不変（S0同値=件数照会） |
| C-003,005(+EN),006,011,012,013,018,020,023 | Playwright+db.ts | GUI+DB | 作成/更新/削除成功。各ケース自己完結（自ら作成→操作→afterEachで削除） |
| C-019 | Playwright+db.ts | HTTP+DB | DB段差（smallint超過）によるflush例外の確認。DB不変（件数照会） |
| 補完S-001 | 静的確認（非Playwright） | ソースコード | 拡張イベント6点dispatchの存在確認（親test_idなし） |
| 補完S-002 | Playwright（**要実機・確定期待にしない**） | GUI | 検証失敗時のマスタ選択select保持（親test_idなし） |
| 補完S-003 | Playwright | HTTP | 編集専用入口へのGET（親test_idなし） |

聖域判定・多軸属性の正式付与はD14 v2合格後（本表は暫定・正式会計に使わない）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（§0判定原則。前提/入力列のシナリオ語・観点ラベルはノイズ）。
1候補ケース行=1 assertion bundle・多対一は`shared-observation`・-EN行は対応ja行と同一親のlocale多重。
**参照先の全候補行は§4に実体掲載済み＝88↔候補の期待テキスト突合が本文内で完結する**。

### 集計（88 test_id 全数会計・差分0・改訂1で再計算）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound完全** | **37** | 前提列と期待テキストが自然に一致する行（下表参照）。設計書表の項目名（行ID・行名称・削除行・同時更新・成功時出力等）が前提列にそのまま現れ、期待テキストも当該表の逐語と一致する行群（改訂1で066をexcluded・069をTBDへ移設し39→37） |
| **読み替え** | **28** | 前提列が期待内容と無関係な生成器ノイズ（観点コード循環転記・M11-05-MSG-00N誤結合等）であり、**期待テキストのみを正として**候補ケースへbindした行（下表参照。§10 C4-manualに個別根拠。改訂1で017/058をexcludedへ移設し30→28） |
| **partial** | **1** | 067（具象マスタの追加列＝id/name/sort_noのみセット）。保存ループの実装（`setId`/`setName`/`setSortNo`のみ・他setter呼出し0件=`MasterdataController.php:150-167`実測）は静的に確認済み。選択可能な候補として`Authority`（`mtb_authority`）が実在するが、管理者権限の根幹テーブルであるため本書は実証対象に採用しない（安全上の意図的見送り。§0-1・§9参照）。よって「他列不変」をdb.tsで実データ観測することは本書の範囲では行わない |
| **TBD** | **1** | 069（参照整合性の例外化側）。削除自体はC-011で実証済みだが「参照先が残ると例外化する」側の実機観測には`dtb_customer`/`dtb_order`のSEED行構築が必要で本書では未設計（§9-3。改訂1でbound完全から降格） |
| **excluded** | **21** | EX-A 検索・実行結果取得系18（019〜036）＋EX-B 3（017・058・066。改訂1で読み替えから移設・救済先なきbindの是正）。**per-IDの実引きは下表** |
| 合計 | **88** | 欠落0・理由なし重複0 |

- 候補ケース行総数**27**（§4.1 bound対応24＝ja20＋-EN4／§4.2 補完3＝S-001/S-002/S-003）。

### EX-A 18件の実引き表（test_idごとのTSV実引き・偽陰性なしの根拠）

全18行の**操作手順列は同一の生成器定型**（逐語）: 「1. 検索条件〔033-036は「実行結果」〕の対象レコードと
前提状態を用意する / 2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる / 3. 対象テーブルの
レコード（区分・件数・更新値）を確認する」＝機能固有の操作を指定しない定型。除外判定は期待テキスト
実内容（検索取得の主張）による。本機能の画面（`masterdata.twig`）には検索フォーム・ページングが
存在しない（grep実測0件。一覧は`findBy([], ['sort_no' => 'ASC'])`固定クエリのみ＝`MasterdataController.php:79-82`）。

| test_id | 前提列の項目（ノイズ列・実引き） | 期待結果（逐語） | 除外根拠（一次資料実引き） | 実項目の代替bound先 |
|---|---|---|---|---|
| 019 | 説明文 | 検索条件の該当レコードが取得結果に含まれること。 | 「検索条件の…取得結果」＝検索取得主張。masterdata.twigに検索フォーム0件（grep実測）・一覧は固定クエリ | 説明文→C-001(shared・L1-025) |
| 020 | 行ID | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上 | 行ID保存→C-005,C-008,C-009 |
| 021 | 行名称 | 検索条件の該当レコードが取得結果に含まれること。 | 同上 | 行名称保存→C-006,C-007 |
| 022 | 同一送信内で同じIDが複数行 | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上 | 重複ID→C-010 |
| 023 | 主キーとして0を使う | 検索条件の該当レコードが取得結果に含まれること。 | 同上 | PK=0→C-012,C-013 |
| 024 | flushが例外 | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上 | flush例外→C-019 |
| 025 | 無効なマスタキーでパス引数だけ開く | 検索条件の該当レコードが取得結果に含まれること。 | 同上 | 無効マスタキー→C-014 |
| 026 | プルダウンでは選べない除外マスタ | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上 | 除外マスタ直接POST→L1-020（静的根拠のみ・本書では未実行＝§9-4） |
| 027 | 具象マスタの追加列 | 検索条件の該当レコードが取得結果に含まれること。 | 同上 | 追加列→partial（067と同一主題の重複） |
| 028 | 一覧とDB | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上 | 一覧とDB一致→C-005,C-006(shared・保存後リダイレクト先での再クエリ) |
| 029 | 参照整合性 | 検索条件の該当レコードが取得結果に含まれること。 | 同上 | 参照整合性→TBD（069と同一主題・§9） |
| 030 | 同時更新 | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上 | 同時更新→C-023 |
| 031 | 成功時出力 | 検索条件の該当レコードが取得結果に含まれること。 | 同上 | 成功時出力→C-005,C-006(shared) |
| 032 | 失敗時出力 | 検索条件の該当レコードが取得結果に含まれないこと。 | 同上 | 失敗時出力→C-007,C-008,C-010,C-019(shared) |
| 033 | 副作用 | 実行結果の該当レコードが取得結果に含まれること。 | 「実行結果の…取得結果」＝同型の検索取得主張（m05-13/m09-01/m10-12が同skeletonを除外した先例と同型） | 副作用（追加・更新・削除・sort_no更新）→C-005,C-006,C-011,C-018(shared) |
| 034 | 選択中のマスタに対応するテーブル | 実行結果の該当レコードが取得結果に含まれること。 | 同上 | DBカラム→C-006,C-018(shared) |
| 035 | 行名称 | 実行結果の該当レコードが取得結果に含まれること。 | 同上 | 行名称（DBカラム逐語）→C-006(shared) |
| 036 | 行ID（集合） | 実行結果の該当レコードが取得結果に含まれること。 | 同上 | 行ID重複検査→C-010(shared・062と同一主題の重複) |

（境界判定の確認）**m05-13/m10-12のR1教訓（「同時更新」等の実在仕様が前提列にのみ現れ他行に対応期待が
無い場合はbound化する）を本機能でも適用検証済み**: 母集合88行の前提列を全数走査した結果、行030の前提
「同時更新」は期待テキストが検索取得の定型文であり実在仕様（排他制御表の「後勝ち・ロックなし」＝md:181,304）
そのものを問う行ではない。一方、**行070（会計区分=IT-23だが期待テキストが「行バージョンや楽観ロックは
持たないこと。」という排他制御表の逐語）は別行として存在し自然bound**であるため、同時更新の実在仕様は
行070で確保済み（030をexcludedにしても偽陰性は生じない）。C-023（同時更新の実行観測）は行070の期待
テキストに対応するbound候補ケースである。

### EX-B 3件の実引き表（改訂1新設・救済先なき読み替えbindのexcluded化）

codex R1 Major B3是正: 017・058・066は当初「読み替え」として候補ケースへbindしていたが、いずれも
bind先の主題と期待テキストの実質が一致しない過剰boundと判明した。救済先が実在しないため除外する。

| test_id | 前提列 | 期待結果（逐語） | 除外根拠 |
|---|---|---|---|
| 017 | 更新行 | DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。 | 本機能に「DBとの相関バリデーション」に厳密対応する機構が存在しない（唯一の相関チェックはPOST_SUBMITの重複ID検査＝メモリ内チェックでDB照会を伴わない）。当初smallint超過(flush例外)への読替bindを試みたが、これは「フォームバリデーションでエラーが表示される」ではなく「DB書込エラー」であり期待テキストの含意（フォームエラー表示）と性質が異なる（候補自身も「厳密には合致しない」と付記していた過剰bind）。救済先なしと判断 |
| 058 | 削除行 | 更新内容の対象レコードの値が変更されること。 | 前提（削除行）と期待（値が変更される・肯定極性）の組合せが自己矛盾（削除されたレコードの「値」は存在しなくなるため「変更される」という主張と両立しない）。C-011（削除成功）は「削除される」ことを示すのみで「値が変更される」ことを示すものではなく、無理な極性合わせは過剰bound。救済先なしと判断 |
| 066 | プルダウンでは選べない除外マスタ | 実行結果の対象レコードが削除状態になること。 | 除外マスタへの直接POST(L1-020)は静的根拠のみで本書は実行対象としない（§9-4・旧C-017は候補ケースから削除）。実行しない候補ケースへの「削除状態になる」というbindは主張できない。救済先なしと判断 |

### 88対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**。改訂1で017/058/066/069を更新）

| No | 期待テキスト要旨（逐語短縮） | 前提列との整合 | 会計 | 対応候補ケース |
|---|---|---|---|---|
| 001 | マスタキー定義（FQCNハイフン識別子） | 自然（前提=マスタキー） | bound完全 | C-003 (shared) |
| 002 | 編集コレクション定義（data配列） | 自然（前提=編集コレクション） | bound完全 | C-005 (shared) |
| 003 | 行キー定義（配列キー） | 自然（前提=行キー） | bound完全 | C-004,C-011 (shared) |
| 004 | マスタ選択フォーム+tooltip見出し表示・編集テーブル非表示 | 自然（前提=出力抑止／マスタ未選択） | bound完全 | C-001 |
| 005 | 検証成功→リダイレクト+行一覧+空追加行 | 自然（前提=識別子／選択送信） | bound完全 | C-003 |
| 006 | マスタ選択欄反映+編集テーブル表示 | 自然（前提=状態変化／既選択入口） | bound完全 | C-004 |
| 007 | 検証成功→永続化+一覧へリダイレクト | 自然（前提=確認ダイアログ観点だが対象=登録送信で一致） | bound完全 | C-005 |
| 008 | 管理画面の認証要件により利用不可 | 自然（前提=非管理者・未認証） | bound完全 | C-015 |
| 009 | 必須バリデーションでエラーあり完了しない | **不一致**（前提=tenant_owner権種） | 読み替え | C-002（NotBlank） |
| 010 | 必須バリデーションでエラーなし継続 | **不一致**（前提=表示要素） | 読み替え | C-003 (shared・有効選択の継続) |
| 011 | JS挙動: 専用スクリプトを持たない | 自然（前提=JS挙動） | bound完全 | C-001 (shared・L1-024) |
| 012 | 相関バリエラーあり完了しない | **不一致**（前提=モーダル・ポップアップ） | 読み替え | C-010（重複ID） |
| 013 | 相関バリエラーなし継続 | **不一致**（前提=入力項目） | 読み替え | C-005 (shared・重複なしの継続) |
| 014 | 相関バリエラーなし継続 | **不一致**（前提=M11-05-MSG-001） | 読み替え | C-005 (shared) |
| 015 | 相関バリエラーあり完了しない | **不一致**（前提=M11-05-MSG-002） | 読み替え | C-010 (shared) |
| 016 | DB相関バリエラーなし継続 | **不一致**（前提=表示順） | 読み替え | C-006（既存id find→更新継続） |
| 017 | DB相関バリエラーあり完了しない | **不一致**（前提=更新行） | **excluded**（EX-B・改訂1） | — |
| 018 | 削除行の業務ルール逐語（ID/名称null・find・remove） | 自然（前提=削除行） | bound完全 | C-011 |
| 019〜036 | 検索条件/実行結果の該当レコードが取得結果に含まれる(ない) | — | **excluded** EX-A（上表） | — |
| 037 | 登録内容の対象レコードが追加されること | **不一致**（前提=未認証） | 読み替え | C-005 (shared・期待極性のみ採用) |
| 038 | 登録内容の対象レコードが追加されないこと | **不一致**（前提=拒否リストなし権種） | 読み替え | C-008 (shared・検証失敗の代表) |
| 039 | 登録内容の対象レコードが追加されること | **不一致**（前提=tenant_owner） | 読み替え | C-005 (shared) |
| 040 | 「同上であること」＝画面遷移表の保存POST成功行を指す | 自然（前提=保存POSTが成功。画面遷移表md:243と一致） | bound完全 | C-005,C-006 (shared) |
| 041 | 登録内容の対象レコードが追加されること | 自然（前提=マスタキー・hidden経由の保存対象識別） | bound完全 | C-005 (shared) |
| 042 | 登録内容の対象レコードが追加されること（最大長） | **不一致**（前提=編集コレクション） | 読み替え | C-005 (shared・境界近傍の追加成功) |
| 043 | 登録内容の対象レコードが追加されないこと（最大長+1） | **不一致**（前提=行キー） | 読み替え | C-009（Length超過） |
| 044 | 登録内容の対象レコードが追加されること（最小長） | **不一致**（前提=マスタ未選択） | 読み替え | C-005 (shared・空文字扱い含む最小構成での追加成功) |
| 045 | 登録内容の対象レコードが追加されないこと（最小長-1） | **不一致**（前提=選択送信） | 読み替え | C-007 (shared・名称欠落による失敗) |
| 046 | 登録内容の対象レコードが追加されること | **不一致**（前提=既選択入口への遷移） | 読み替え | C-005 (shared) |
| 047 | 実行結果の対象レコードが追加されること | 自然（前提=編集テーブルで登録送信） | bound完全 | C-005 (shared) |
| 048 | 管理画面の認証要件により利用不可 | 自然（前提=非管理者・未認証。008と同義） | bound完全 | C-015 (shared) |
| 049 | 更新内容の対象レコードの値が変更されること | **不一致**（前提=tenant_owner） | 読み替え | C-006 (shared) |
| 050 | 更新内容の対象レコードの値が変更されないこと | **不一致**（前提=表示要素） | 読み替え | C-007 (shared・検証失敗でDB不変の代表) |
| 051 | 更新内容の対象レコードの値が変更されること | **不一致**（前提=JS挙動） | 読み替え | C-006 (shared) |
| 052 | モーダルや確認ダイアログを出さない | 自然（前提=モーダル・ポップアップ） | bound完全 | C-001 (shared・L1-024) |
| 053 | 更新内容の対象レコードの値が変更されること | **不一致**（前提=入力項目） | 読み替え | C-006 (shared) |
| 054 | 更新内容の対象レコードの値が変更されること（最大長） | **不一致**（前提=M11-05-MSG-001） | 読み替え | C-006 (shared) |
| 055 | 更新内容の対象レコードの値が変更されないこと（最大長+1） | **不一致**（前提=M11-05-MSG-002） | 読み替え | C-009 (shared・Length超過でDB不変) |
| 056 | 更新内容の対象レコードの値が変更されること（最小長） | **不一致**（前提=表示順） | 読み替え | C-006 (shared) |
| 057 | 更新内容の対象レコードの値が変更されないこと（最小長-1） | **不一致**（前提=更新行） | 読み替え | C-008 (shared・Regex失敗でDB不変) |
| 058 | 更新内容の対象レコードの値が変更されること（実質=削除） | **不一致**（前提=削除行） | **excluded**（EX-B・改訂1） | — |
| 059 | 実行結果の対象レコードの値が変更されること | **不一致**（前提=説明文） | 読み替え | C-006 (shared) |
| 060 | 「エンティティの主キーであること」（行IDの業務ルール逐語） | 自然（前提=行ID） | bound完全 | C-005 (shared・id=主キーとして機能する実証) |
| 061 | 「name列であること」（DBカラム表逐語） | 自然（前提=行名称） | bound完全 | C-006 (shared) |
| 062 | 「各行のIDフィールドに重複エラーが付く」（エッジケース表逐語） | 自然（前提=同一送信内で同じIDが複数行） | bound完全 | C-010 (shared) |
| 063 | 「0の保存・削除が確認されている」（エッジケース表逐語） | 自然（前提=主キーとして0を使う） | bound完全 | C-012,C-013 |
| 064 | 「エラーフラッシュを積みリダイレクトは同様」（エッジケース表逐語） | 自然（前提=flushが例外） | bound完全 | C-019 |
| 065 | 削除条件の対象レコードが削除状態にならない | 自然（前提=無効なマスタキーでパス引数だけ開く。保存POST自体を経由しないため削除は起きない） | bound完全 | C-014 (shared) |
| 066 | 実行結果の対象レコードが削除状態になること | **不一致**（前提=除外マスタだが救済候補ケース〔旧C-017〕が本書で未実行のため対応先なし） | **excluded**（EX-B・改訂1） | — |
| 067 | 「id/name/sort_noのみセット」（業務ルール/エッジケース表逐語） | 自然（前提=具象マスタの追加列） | **partial** | — |
| 068 | 実行結果の対象レコードが削除状態になること | **不一致**（前提=一覧とDB） | 読み替え | C-011 (shared) |
| 069 | 「remove/flush依存・参照先残存で例外」（データ整合性表逐語） | 自然（前提=参照整合性） | **TBD**（改訂1でbound完全から降格。§9-3） | — |
| 070 | 「行バージョンや楽観ロックは持たない」（排他制御表逐語） | 自然（前提=同時更新） | bound完全 | C-023 |
| 071 | 「HTML画面である」（入出力表逐語） | 自然（前提=成功時出力） | bound完全 | C-003,C-005 (shared) |
| 072 | 「同一レスポンスでフィールドエラー」（入出力表逐語） | 自然（前提=失敗時出力） | bound完全 | C-007,C-008,C-009,C-010 (shared・代表C-008) |
| 073 | 「追加・更新・削除・sort_no更新」（入出力表逐語） | 自然（前提=副作用） | bound完全 | C-005,C-006,C-011,C-018 (shared) |
| 074 | 「保存完了時に0起算で振り直す」（DBカラム表sort_no逐語） | 自然（前提=選択中のマスタに対応するテーブル） | bound完全 | C-018 |
| 075 | 「任意であること」（行名称） | **字面簡略**（設計書入力項目表は「条件付き」＝IDが空なら実質任意・IDがあれば実質必須。前提=行名称は一致するが期待の表現が簡略化されている） | 読み替え | C-005（ID空・名称空の行=削除/無視で「任意」が成立するケース）およびC-007（ID有り名称無=エラーで「条件付き」の別側）の両方に架橋（§10で詳述・DOC-DRAFTではなく期待テキストの簡略表現と解釈） |
| 076 | 「POST_SUBMITでID重複検査・重複分にフォームエラー」（バリデーション表逐語） | 自然（前提=行ID（集合）） | bound完全 | C-010 (shared) |
| 077 | 「利用不可であること」（権限表逐語） | 自然（前提=未認証） | bound完全 | C-015 (shared) |
| 078 | 「画面表示・送信が許可される実装」（権限表逐語） | 自然（前提=拒否リストなし権種） | bound完全 | C-003 (shared・通常権限での動作確認) |
| 079 | tenant_owner・Enterprise_Mall・HTTP403（権限表逐語） | 自然（前提=tenant_owner） | bound完全 | C-016 |
| 080 | 「同上であること」＝画面遷移表 | 自然（前提=保存POSTが成功。040と同義） | bound完全 | C-005,C-006 (shared) |
| 081 | マスタキー定義（001の重複） | 自然 | bound完全 | C-003 (shared) |
| 082 | 画面表示データでエラーなし継続 | **不一致**（前提=編集コレクション） | 読み替え | C-004 (shared・正常表示) |
| 083 | 行キー定義（003の重複） | 自然 | bound完全 | C-004,C-011 (shared) |
| 084 | 画面表示データでエラーなし継続 | **不一致**（前提=マスタデータ管理を開く(マスタ未選択)。テンプレ化により004の内容と表現が乖離） | 読み替え | C-001 (shared) |
| 085 | プルダウン選択送信成功（005の重複） | 自然 | bound完全 | C-003 (shared) |
| 086 | 既選択入口への遷移（006の重複） | 自然 | bound完全 | C-004 (shared) |
| 087 | tenant_owner・HTTP403（079の簡略再掲） | 自然 | bound完全 | C-016 (shared) |
| 088 | 「第1カードにマスタ選択selectと選択ボタン」（フロント挙動表逐語） | 自然（前提=表示要素） | bound完全 | C-001 (shared) |

`func_scope_check` 判定: 親88/88会計済み・欠落0・理由なし重複0・補完3行は§4.2に実体掲載
（親空・設計書補完・母集合会計外）→ **差分0を本文内で実証可能**。O6は主張しない。
機械実証（改訂1）: bound完全37＋読み替え28＋partial1＋TBD1＋excluded21（EX-A18＋EX-B3）＝**88**（python3で88対応表を機械集計し実測）。

## §9 TBD・要実機・DOC-DRAFT・BC-DRAFT・excluded（正直な分離・改訂1で全面更新）

| # | 事項 | 状態 |
|---|---|---|
| 1 | 拡張イベントの設計書5項目↔実装6識別子の粒度差（DOC-DRAFT） | 設計書md:312-316は5つの意味段階として拡張イベントを列挙するが、実装は6つの識別子をdispatchする（`EccubeEvents.php:381-388`）。「マスタ選択フォーム生成直前」が`index()`の`INDEX_INITIALIZE`と`edit()`の`EDIT_FORM_INITIALIZE`の2箇所から起きるための粒度差の**可能性がある**が、設計書が識別子の完全列挙を明示的に要求しているかは不確定であり**乖離を断定しない**（未解決の中立記録・予防注入(2)適用）。母集合に直接対応する行は無く補完S-001のみで扱う |
| 2 | partial（067）: 具象マスタの追加列 | 保存ループが`id`/`name`/`sort_no`のみをセットすることは静的に確認済み（`MasterdataController.php:150-167`実測・他setter呼出し0件）。選択可能な候補マスタ集合には追加列を持つ具象クラスとして**`Authority`（`mtb_authority`・`role_key`/`is_viewable`の2列を追加。除外5クラスに含まれず選択可能）が実在する**が、`Authority::SYSTEM_ID`(=1)〜`Authority::GUEST_ID`(=7)という**コード上の定数**が管理画面全体の認可判定で参照される実装であるため（`mtb_authority`テーブルの実際の行数・行内容は本書では未照会）、本書は破壊的編集の実証対象に採用しない（安全上不採用。DB行数を根拠にせず、コード定数の存在のみを根拠とする）。よって「他列不変」をdb.tsで実データ観測することを本書では見送る。`Authority`以外の追加列候補（`Country`・`OrderStatus`）はいずれも除外5クラスであり選択不可 |
| 3 | TBD（069・改訂1でbound完全から降格）: 参照整合性の例外化 | 「削除は`remove`と`flush`に依存し、参照先が残ると例外となりエラーフラッシュに落ちる」（データ整合性表逐語=m11-05md:180）の**削除される側**はC-011で実証済み。「参照が残っている場合に例外化する」側は、`mtb_sex`を参照する`dtb_customer`/`dtb_order`のSEED行構築が必要（本書§2で「未設計」と明記）。**救済先なきboundを避けるためTBDへ降格**（要実機・追加SEED要。M03/M05系のSEED設計と重複するため本機能では自己完結させない） |
| 4 | 除外クラスへの直接POST（旧C-017・要実機・本書では未実行） | エッジケース表（m11-05md:170）と静的解析（L1-020）を根拠に「保存処理はhiddenのmasterdata_nameを解釈するのみでマスタ選択フォームの検証を経由しない」ことは静的に確認できるが、`dtb_order_status`（`OrderStatus`エンティティ由来）は`mtb_sex`の使い捨てSEED帯（9001〜9013・0・32767・32768）とは別テーブルであり、本書のS0/afterEach復元契約の対象外。**codex R1 Blocker A2是正により候補ケースから削除**し、実行を主張しない（要実機残）。実行する場合は`dtb_order_status`専用のS0スナップショット・専用SEED帯・復元契約を別途設計する必要がある |
| 5 | S-002（旧C-021・検証失敗時のマスタ選択保持・要実機） | `edit()`の`$parameter = array_merge($request->request->all(), ['masterdata' => $form2['masterdata_name']->getData()]); $form->submit($parameter);`（`MasterdataController.php:206-207`）により、`edit()`経路の検証失敗では選択状態が`form2`のhiddenから復元される設計だが、この`submit()`が`select`要素の選択済み表示（`selected`属性）へ正しく反映されるかはSymfony FormのChoiceType描画に依存し、レンダリング結果は要実機確認とする（**確定期待にしない**。§4.2 S-002も同一のヘッジ文言に統一） |
| 6 | Length超過メッセージの逐語未確定（C-009,055） | `eccube_int_len=9`解決後のSymfony既定Length超過文言はvendor `validators.ja/en.xlf`のchoice形式（limitに応じ単数/複数形が変わる）に従うが、本書ではlimit=9解決後の具体的な単数/複数形態文言をvendorファイルから直接引用していない（m05-13/m10-12はlimit=200/255で単数形に該当しない値だったため複数形側のみ確認したが、本機能はlimit=9のためvendor choiceの単数側条件〔limit=1〕には該当せず複数形が適用される想定。実機確認で確定する） |
| 7 | 旧L1-021の設計書記述との読みの相違（DOC-DRAFT・改訂1新設） | 設計書md:169「マッピング例外を握り潰し、編集表が出ない状態に寄せ得る」に対し、静的解析ではGET`/masterdata/{entity}/edit`で`{entity}`がChoiceType候補外の場合`$form['masterdata']->isValid()`が偽になり`getRepository()`（および`catch (MappingException)`）自体に到達しないという読みになる（L1-021詳細）。**どちらの記述がより正確かを実機で確定しない限り断定しない**（両論併記・テストケースが正の原則）。観測できる事実（HTTP200・編集テーブル非表示・選択肢エラー表示）はC-014で確定的に主張する |
| excluded (EX-A) | 019〜036（検索・実行結果取得系18） | 期待テキスト=「検索条件/実行結果の該当レコードが取得結果に含まれる（ない）こと」＝検索取得の主張。本機能の一覧はユーザー指定検索条件を取らない固定クエリ（`findBy([], ['sort_no'=>'ASC'])`）であり、検索フォーム・ページングはmasterdata.twigに存在しない（grep実測0件）。per-IDの実引きは§8のEX-A表 |
| excluded (EX-B) | 017・058・066（改訂1新設） | 読み替えbindが救済先の実質と一致しない過剰boundと判明した3件。per-IDの実引きは§8のEX-B表 |

候補規律: 全行 `@TBD-D5`・O5未確定（D6後に確定検査）・実装/実走なし・O6/聖域/多軸/C6C7を主張しない。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象構文の列挙とclaim別判定（本機能は前提列に設計書の項目名・メッセージIDが実際の期待内容と
無関係に循環転記されている行が多いため、極性衝突・観点/期待の取り違えが§8で「読み替え」28件と
多数に及ぶ。個別根拠を以下に記録する。改訂1で012〜017・058・066のエントリを是正）:

| 対象 | 極性判定 | 判定根拠（一次資料） |
|---|---|---|
| 009（必須エラーあり）/010（必須エラーなし） | 前提（tenant_owner／表示要素）は期待内容と無関係。期待テキストの極性のみを正としてbind: 009=マスタ選択NotBlank違反時のエラー（C-002）、010=有効選択時の継続（C-003） | MasterdataType.php:78-80（NotBlank制約） |
| 012〜016（相関/DB相関バリの両極。**017は改訂1でexcludedへ分離＝EX-B**） | 012,015=IDの重複検査（唯一実在する相関バリ＝`MasterdataEditType.php`のPOST_SUBMIT）のエラー側→C-010。013,014=重複なし継続→C-005(shared)。016=DB既存行のfind一致による更新継続→C-006。**017（DB相関バリエラーあり）は救済先が実質的に不一致（DB書込エラーはフォームエラー表示ではない）と判明したためEX-Bへ分離**（§8参照。当初の読替bindは過剰boundだった） | MasterdataEditType.php:42-68／MasterdataController.php:152-158 |
| 019〜036（検索・実行結果取得系の両極） | 検索は本機能に実装が存在しない（masterdata.twigに検索フォーム0件・一覧は固定クエリ）→両極ともEX-A。母集合88行の前提列を全数走査した結果、「同時更新」の実在仕様（排他制御表）は別行070（自然bound）で確保済みのため、030をexcludedにしても偽陰性は生じない | masterdata.twig（grep実測）／MasterdataController.php:79-82／m11-05md:181,304 |
| 037〜059の「追加/変更される・されない」（**058は改訂1でexcludedへ分離＝EX-B**） | 期待テキスト極性を正としてbind。肯定→C-005/C-006、否定→C-007/C-008/C-009/C-010。前提列の項目名（tenant_owner・表示要素・JS挙動・M11-05-MSG-00N等）は実際の期待内容と無関係な循環転記のため**棄却**し、期待文の「追加される/されない」「変更される/されない」のみで判定する。**058（前提=削除行→期待=値が変更される・肯定）は削除と値変更が意味的に両立しない自己矛盾でありC-011への読替は過剰boundと判明したためEX-Bへ分離** | m11-05md:151（削除行の業務ルール）・166-171（エッジケース表） |
| 065（前提=無効なマスタキーでパス引数だけ開く→期待=削除状態にならない） | 前提と期待は整合（この経路は保存POSTを経由しないGET専用の分岐であるため、削除は起き得ない＝真に自然な帰結）。C-014（改訂1でメカニズム記述を是正）で削除非発生も自明に成立するため同一ケースへshared bind | MasterdataController.php:73-96（`entity`が非nullかつGETの分岐。保存処理`edit()`とは別関数） |
| 066（前提=除外マスタ→期待=削除状態になること。**改訂1でexcludedへ分離＝EX-B**） | エッジケース表（md:170）は「保存し得る」の一般表現であり読めなくはないが、救済先だった旧C-017（除外クラス直接POST）はcodex R1 Blocker A2是正により候補ケースから削除された（§9-4）。実行しない候補ケースへ「削除状態になる」というboundを維持することはできないためEX-Bへ分離 | MasterdataController.php:150-167（同一保存ループが新規/更新/削除いずれも処理する、という静的事実自体は残るが実行されないため会計上はexcluded） |
| 069（前提=参照整合性→期待=データ整合性表の参照整合性行逐語。**改訂1でTBDへ降格**） | 前提と期待は完全一致（自然な対応）。ただし「参照先が残ると例外となる」側の実機観測には`dtb_customer`/`dtb_order`のSEED行構築が必要で本書は未設計（§9-3）。削除自体（C-011で実証済み）とは別の主題であり、救済先なきboundを避けるためbound完全からTBDへ降格した（過大な確定主張をしない＝予防注入） | m11-05md:180 |
| 075（前提=行名称→期待=「任意であること」） | 設計書入力項目表（md:221）は行名称を「条件付き」と規定する（IDが空なら実質任意・IDがあれば実質必須）。母集合の期待テキスト「任意であること」はこの条件付き規定の**片側（IDが空の場合の任意性）のみを字面簡略した表現**と解釈し、DOC-DRAFT（設計書と実装の矛盾候補）ではなく読み替えbindとした（設計書と実装は一致しており、母集合側の要約が粗いだけと判断＝断定を避けつつ最も自然な解釈を採用） | m11-05md:221（「行名称｜text｜任意。ただし POST_SUBMIT で、ID が存在する行に名称が空なら…ブランクエラー」） |
| 082,084（前提=編集コレクション／マスタデータ管理を開く（マスタ未選択）→期待=「画面表示データでエラーなし継続」） | 前提語と期待テキストの結合が生成器の定型（テンプレ簡略化）であり、実質は「正常表示が継続する」という一般的な確認に帰着する。082は編集コレクションが正しく表示される文脈としてC-004（既存選択済み表示）へ、084はマスタ未選択時の表示継続としてC-001（未選択GET表示）へ、それぞれの主題に最も近い候補ケースへ読み替えbindした | masterdata.twig（第1・第2カードの表示条件） |
| C-014のメカニズム記述（改訂1・**捏造の訂正**） | 旧版は「無効なマスタキーでMappingExceptionが握り潰される」と断定していたが、静的解析の結果`$form['masterdata']->isValid()`のゲートによりこの経路ではMappingExceptionへ到達しないことが判明（L1-021詳細）。観測できる事実（HTTP200・編集テーブル非表示・ChoiceType既定のinvalid_messageエラー表示）のみを主張する形へ訂正し、設計書側の記述との相違はDOC-DRAFTとして両論併記に留めた | vendor/symfony/form/Extension/Core/Type/ChoiceType.php:161-163,379／MasterdataController.php:73-96 |

**codex敵対レビュー実施状況: R1要修正（Blocker3＋Major3）→改訂1で是正済み・R2再確認待ち**。
R1の指摘（S0規律の全面違反・行数会計の虚偽・L1-021/C-014の捏造・DB実測表現の誇張・過剰bound3件・
BC/DOC-DRAFT中立化不足）はいずれも実ソース再確認（`ChoiceType.php`の`TransformationFailedException`
経路実測・`Authority.php`の定数実測・全88行の会計再集計）で裏付けたうえで是正した。結果は
`REVIEW_LEDGER.md`と本ヘッダに同期する。

---

## 付録: 作業実測（B0係数計測用）

- 読んだ一次資料・参照物（改訂1で追加）: 設計書md 1／ee実ソース 9（MasterdataController・MasterdataType・
  MasterdataEditType・MasterdataDataType・AbstractMasterEntity・Sex・Authority・
  MasterdataControllerTest・AbstractAdminWebTestCase）＋masterdata.twig／
  locale 4（messages ja/en・validators ja/en）／eccube.yaml／security.yaml／EccubeEvents.php／
  vendor 2（`symfony/form/Extension/Core/Type/ChoiceType.php`・`symfony/form/Resources/translations/
  validators.ja/en.xlf`＝改訂1で新規追加・C1是正の根拠）／執筆時点のpsql照会（`information_schema.columns`・
  `pg_constraint`・`mtb_sex`実データ・`AbstractMasterEntity`拡張25クラスのORM\Column数走査）／
  母集合・台帳 3（all_it_cases・fid_kubun・REVIEW_LEDGER）／統治 2（CRP・CFP）／
  同型見本 3（m05-13・m05-17・m10-12草案）／既存実装 1（db.ts）＝**計28ファイル＋psql照会4クエリ系統**。
- L1 claim数: **27確定＋1補完専用**（=28行。補完専用=L1-023拡張イベント6点dispatch＝母集合に対応行なし）。
  候補ケース行27（bound20＋EN4＋補完3）。file:line claim引用 約58箇所（改訂1でChoiceType関連2箇所追加）。
- 難所（改訂1・codex R1是正で新たに判明した論点）: (1) S0規律の理解不足——「afterEachで元に戻す」ことと
  「そもそも変更しない」ことは異なる、という規律をC-018（sort_no再割当）で当初混同していた。既存4行を
  逆順送信して一時的にsort_noを書き換え、afterEachで戻す設計は「一時破壊してから復元する」ものであり
  S0保護ではない。全面的にSEED帯行のみで並べ替えを実証する設計へ差し替えた (2) 候補ケース間の暗黙の
  実行順序依存（C-006がC-005の残置行に依存する等）に気づかず自己完結性を破っていた。各ケースが自ケース
  内でSEED行を作成する設計へ修正 (3) `$form['masterdata']->isValid()`のゲートを見落とし、ChoiceType選択肢
  外の値が`catch (MappingException)`ブロックに到達すると誤って断定していた（L1-021捏造の原因）。
  `vendor/symfony/form/Extension/Core/Type/ChoiceType.php`のトランスフォーマー実装を実測して訂正した
  (4) 破壊操作の対象テーブル統治範囲（`mtb_sex`のSEED帯限定）を自分で宣言しながら、旧C-017で
  `dtb_order_status`という別テーブルへの書込を候補ケースに含めてしまっていた（統治範囲の逸脱） (5) 「DB実測」
  という表現が、ORM静的定義の読解と実際のpsql照会結果を混同させる書き方になっていた（両者を明確に区別する
  表記へ全箇所修正）。
- 楽だった点（再利用効果）: L1表・三段参照・S0規律の型・choice解決・runFill・隔離lint・§構成・
  EX-A/EX-B実引き表・C4-manual構成は m05-13/m05-17/m10-12 の型をそのまま流用。ee自身のPHPUnit
  （`MasterdataControllerTest.php`）が編集対象マスタ選定・PK=0エッジケース・tenant_owner 403確認の
  一次資料として直接使え、当方の相対的安全性判断に頼らずに済んだ。codexの指摘は具体的なfile:line込みで
  検証可能だったため、是正の裏付け取りが効率的だった。

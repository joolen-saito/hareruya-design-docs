# B0候補: m11-04 ログイン履歴 — 実行可能グレード候補（母集合87全量踏破）

> 2026-07-24 ／ **候補グレード（candidate・D6前・O5未確定・実装/実走なし）**
> codexレビュー: **R1要修正（Blocker1＋Major1＋捏造/引用ずれ5件）→改訂1で是正→R2=Blocker/Major閉塞・残3点
> 是正指示→改訂2で是正・R3再監査待ち**。
> **改訂2（codex R2是正・残3点）**: (1) §10の031/071行に残っていたL1-029の撤回済み断定（「DB書込失敗の
> 誘発手段が無い」）を削除し、主表・JSONと同じ「本候補では観測契約を定義できていない」へ統一。(2) L1-008
> 「セッションへの保存は行われない」を「検索条件・ページ番号への保存は行われない」に限定（`page_count`は
> フォーム検証より前の55-65行で評価・保存され得るため対象から除外）。(3) L1-009「マスタnameと完全一致」を
> 「PHPの緩い比較`==`で等価（数値等価であり文字列としての厳密一致ではない）」に訂正（`LoginHistoryController.php:59`
> `if ($pageCountParam == $pageMax->getName())`実測。m10-14の同型`page_count`緩い比較指摘と同種）。
> §3表・md・oracle JSON双方を同時修正。**L1全29claim再度全数照合済み・残存ずれ0**（下記報告参照）。
> **改訂1（codex R1是正）**: (1)【Blocker】DOC-DRAFT-M1104-01の断定（「テンプレノイズ」「read-onlyが正」
> 「実装是正不要」）を撤回し**未解決の設計内矛盾**として残置。確認できる事実は①参照専用宣言5箇所との矛盾
> ②Controller全文に無書込③`LoginHistoryListener`が`KernelEvents::REQUEST`経由で別途書込を行う実装経路が
> 実在、の3点のみとし、C-028等の期待を「Controller経由の一覧・検索・ページング操作の前後で対象テーブルが
> 不変」という観測挙動に限定（§0/L1-022/C-018/C-025/C-028/§8/§9/§10/付録を是正）。(2)【Major】「全経路
> 無書込」の主張を撤回し「Controller経由の観測範囲での無書込」に限定（§2/§6.1/L1-022/C-018/C-025/C-028）。
> (3) L1-026: `data-toggle="datetimepicker"`の出典をtwigから`SearchLoginHistoryType.php:81-85,98-102`へ訂正。
> (4) L1-003: `update_date`の引用行`LoginHistory.php:52-53`を追加。(5) L1-017: 「後勝ちで両方適用」を
> 「第1・第2ソートキーとして順に追加される」へ訂正。(6) L1-027: 誤引用`md:86`を`md:75`へ差替。
> (7) L1-029: 「標準環境で安全な誘発手段が無い」の断定を撤回し「本候補では観測契約を定義できていない」へ
> 限定。
> source_class=standard-src+design は fid_kubun.tsv（D1・fid_kubun.tsv:342）による**暫定付与**（確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> fixture_version は全て `@TBD-D5`。統治: `integration_test/CONCRETIZATION_ROLLOUT_PLAN.md`（B0）＋
> `integration_test/CONCRETIZATION_FIRST_PLAN.md`（三段会計）。
> 最強参照=m02-02（read-only・DOC-DRAFT裁定・db.ts無書込観測の型）・m10-12（87全量踏破・per-ID excluded表・
> §8/§9様式・func_scope_check差分0の実証）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m11-04_admin_system_setting_setting_system_login_history_oracle_draft.json`。
> **正式パス `e2e/fixtures/oracle/` 直下・`e2e/helpers/db.ts` 等の正式ファイルには一切書込まない**（本セッションで
> 新規作成したのはこの2ファイルのみ。既存の正式ファイルは一切変更していない）。
> **本機能の要点（他機能との違い）**:
> (1) 本機能は**読取専用**（一覧・検索・ページングの表示のみ）。ee実ソース実測: `LoginHistoryController.php`
>     （120行全文）に `persist`/`flush`/`INSERT`/`UPDATE`/`remove(` が**0件**（grep実測・exit code 1）。
> (2) 検索条件は**実在する**（`multi`／`user_name`／`client_ip`／`create_datetime_start`／`create_datetime_end`／
>     `Status` の6キー・`LoginHistoryRepository::getQueryBuilderBySearchDataForAdmin()`で実装済み）。
>     このため母集合の「検索条件（14行）」「実行結果（検索時）（4行）」計18行（018-035）は、検索が実在しない
>     m10-12先例（excluded）とは異なり**bound**とする（過剰除外にしない）。
> (3) 一方で「登録内容」「更新内容」「削除条件」とその実行結果（計33行・036-068）は、本機能に登録・更新・削除の
>     UI操作が一切存在しない（`login_history.twig` 207行全文に検索フォーム以外のform/新規/編集/削除要素が0件）
>     ため、大半（23行）を**excluded**とする。ただし33行中10行は生成器の定型文ではなく設計書の実文言をそのまま
>     再掲しており（039,047,051,059,060,061,062,063,066,068）、これらは実内容でbindする（過剰除外にしない）。
> (4) **DOC-DRAFT-M1104-01（未解決・断定しない＝codex R1是正）**: 設計書md:251-257「DB操作」節は「登録/更新｜
>     dtb_login_history / mtb_login_history_status｜…persist/flush による即時反映」と記すが、同一設計書の
>     **5箇所**（md:7,211,231,284,364）は本機能を参照専用と明記する（**設計内部の矛盾**）。確認できる事実は
>     以下の3点のみ: ①上記の設計内矛盾 ②`LoginHistoryController.php`全文（120行）に persist/flush/INSERT/
>     UPDATE/remove(が**0件**（grep実測）③別クラス`LoginHistoryListener`が`KernelEvents::REQUEST`（全リクエスト
>     で発火しうるグローバルイベント）を購読し`onPostLogin`（54-90行）でpersist/flush、`LoginFailureEvent`で
>     `onAuthenticationFailure`（94-142行）で生SQL INSERTを行う**実装上の書込経路が別途実在する**（本コントローラ
>     の`index()`からは呼ばれないが、同一リクエストのカーネルレベルで発火しうる）。**この3点は設計内矛盾と
>     書込経路の存在を示すのみであり、「テンプレノイズ」「read-onlyが正」「実装是正不要」は導けない（断定しない・
>     テストケースが正の原則）**。母集合039/079はDOC-DRAFT-M1104-01の実引き対象行としてboundとするが、期待は
>     「Controller経由の一覧・検索・ページング操作の前後で対象テーブルが不変」という**観測できる挙動のみ**に
>     限定し、設計書DB操作節の正誤・テンプレ由来・是正要否は裁定しない（全経路・全テーブルの無書込も主張しない）。
> (5) **DOC-DRAFT-M1104-02**: 設計書md:155-157の検証失敗・0件時のja文言（「検索条件が無効です。」
>     「検索条件を変えてお試しください。」「検索結果がありませんでした。」）は、実カタログ値
>     （messages.ja.yaml:1734-1736＝「検索条件に誤りがあります」「検索条件を変えて、再度検索をお試しください」
>     「検索条件に合致するデータが見つかりませんでした」）と**逐語不一致**（意味は同じだが文言が異なる）。
>     en側は完全一致（messages.en.yaml:1763-1765）。オラクルの正はソース実値（messages.ja.yaml）とし、
>     設計書のja文言は要約パラフレーズと裁定する（実装是正は不要・設計書側の記述精度の問題）。
> **行数集計**: 候補ケース行総数**53**＝bound対応40（ja31＋-EN9）＋補完13（ja8＋-EN5）。
> 母集合87=bound56＋TBD2＋excluded29。

## §0 版固定

- 設計書正本: `functions/ec-cube-enterprise/m11-04_admin_system_setting_setting_system_login_history.md`（本repo HEAD
  `ea56f4725d5621e40acf3b390759091da6eb64a3` 時点・364行）。
- ee実ソース: `/home/y-saito/Developments/ec-cube-enterprise/` コミット `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51`
  （W0-B0既候補と同一checkout）。
- fid_kubun.tsv（D1）: `M11-04｜m11-04_admin_system_setting_setting_system_login_history｜ログイン履歴｜対象｜標準｜
  ec-cube-enterprise/m11-04_admin_system_setting_setting_system_login_history.md｜standard-src+design｜0`
  （fid_kubun.tsv:342。fid_kubun.tsv sha256先頭=44fbf02f1e4c＝既候補と同一版）。
- 母集合: baseline `all_it_cases.tsv`（sha256先頭 `7911f190d273`＝既候補と同一版）M11-04全**87行**
  （IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-001〜087。grep実測=87行、ヘッダ0行）。
- **判定原則（W0-B0教訓の継承）**: 観点（IT-XXコード）・前提条件列のシナリオ語は**生成器ノイズ**。bindは各行の
  **「期待結果／レスポンス」実テキスト**で判定し、極性も期待テキストで確認する（§8に全87行の期待要旨併記）。
  本機能は母集合018-035（検索条件・実行結果）で前提列が設計書の「エッジケース」「データ整合性」「入出力」節の
  項目名を順に転記しつつ、期待列は生成器の定型文（「検索条件の該当レコードが取得結果に含まれる（ない）こと」）
  になっている箇所が多い。この定型文自体は本機能では**実在する検索機能を指す真の記述**（m10-12の「検索が
  存在しないのに検索skeletonが出る」ケースとは逆）であるため、前提列の実在する設計項目名を手がかりに
  実内容へ読み替えてbindする（読み替えは§9/§10のC4-manualで明示）。
- **相関バリデーションは実在しない機能である点**: `SearchLoginHistoryType.php`（115行全文）には
  `PostSubmit`イベント・相関チェック・DB一意性チェックの類が存在しない（grep実測=イベントリスナ0件）。
  よって母集合012-016（相関／DB相関バリデーションの5行）は m02-02/m05-13の「相関constraint不存在→excluded」
  先例をそのまま踏襲する（m10-12は逆に相関バリが実在したため踏襲しなかった。機能ごとに実引きで判定した結果、
  本機能は m02-02 側の先例に合致）。
- **必須バリデーションも実在しない**: `SearchLoginHistoryType.php`の6フィールド（multi/user_name/client_ip/
  create_datetime_start/create_datetime_end/Status）は全て`'required' => false`（43-69,70-103行実測）。
  NotBlank等の必須制約は0件。よって母集合008（必須バリデーションでエラーが出て完了しない）はexcluded。

## §1 L1原子オラクル表

規約: claimは検査可能な期待実値まで分解。quoteは一次資料の逐語。LS=locale_sensitive（0は理由コード）。
**期待値の正は本表のオラクルIDでありSEED値ではない（三段参照）**。`%eccube_admin_route%` は環境値
（既定 `admin`・env `ECCUBE_ADMIN_ROUTE`＝eccube.yaml:3,69）。locale既定=ja（messages.ja.yaml優先）。

| oracle_id | 観点 | claim（検査可能な期待） | source_class(暫定) | 逐語quote | 根拠(file:line) | LS |
|---|---|---|---|---|---|---|
| L1-M1104-001 | auth_rule | **補完専用**（母集合に直接対応するbind先なし）。未ログインで一覧GET/POST・ページ送りGETへアクセスすると、admin firewall（pattern `^/%eccube_admin_route%/`・form_loginエントリポイント`admin_login`）によりログイン画面へ誘導され本機能を利用できない | 設計書md＋standard-src | 「未認証｜利用不可。管理画面の認証要件に従いログイン等へ誘導される。」／`admin:`＋`    pattern: ['^/%eccube_admin_route%/','^/%eccube_messenger_route%/']`＋`    provider: member_provider`＋`    form_login:`＋`        login_path: admin_login` | m11-04md:280／security.yaml:40-46 | 0 `non-translated` |
| L1-M1104-002 | http_status | 一覧・検索=`GET/POST /%eccube_admin_route%/setting/system/login_history`（route `admin_setting_system_login_history`）／ページ送り=`GET/POST .../login_history/{page_no}`（route `admin_setting_system_login_history_page`・`page_no`は数字のみ）。いずれも`index()`単一メソッドで処理 | standard-src | `#[Route(path: '/%eccube_admin_route%/setting/system/login_history', name: 'admin_setting_system_login_history', methods: ['GET', 'POST'])]`／`#[Route(path: '/%eccube_admin_route%/setting/system/login_history/{page_no}', name: 'admin_setting_system_login_history_page', requirements: ['page_no' => '\d+'], methods: ['GET', 'POST'])]` | LoginHistoryController.php:47-48 | 0 `non-ui-observable` |
| L1-M1104-003 | display_field | `dtb_login_history`の1レコードは、`id`（自動採番）・`user_name`（TEXT・NULL許容）・`client_ip`（TEXT・NULL許容）・`create_date`／`update_date`（タイムゾーン付き日時）・`Status`（`login_history_status_id`FK・NOT NULL）・`LoginUser`（`member_id`FK・`onDelete: 'SET NULL'`）を持つ | standard-src＋設計書md | `#[ORM\Table(name: 'dtb_login_history')]`／`#[ORM\Column(type: Types::TEXT, nullable: true)] private ?string $user_name`／`#[ORM\Column(type: Types::TEXT, nullable: true)] private ?string $client_ip`／`#[ORM\Column(name: 'create_date', type: Types::DATETIMETZ_MUTABLE)]`／`#[ORM\Column(name: 'update_date', type: Types::DATETIMETZ_MUTABLE)]`／`#[ORM\ManyToOne(targetEntity: LoginHistoryStatus::class)] #[ORM\JoinColumn(name: 'login_history_status_id', referencedColumnName: 'id', nullable: false)]`／`#[ORM\ManyToOne(targetEntity: Member::class)] #[ORM\JoinColumn(name: 'member_id', referencedColumnName: 'id', onDelete: 'SET NULL')]`／「ログイン履歴｜管理画面へのログイン試行で記録された行を…一覧で閲覧し」 | LoginHistory.php:26,32-35,37-41,46-47,52-53,55-61／m11-04md:7,57 | 0 `non-ui-observable` |
| L1-M1104-004 | display_field | `mtb_login_history_status`はテーブル`mtb_login_history_status`・`FAILURE=0`・`SUCCESS=1`の2値マスタ（CSV初期データ: id=0 name=失敗/Failure、id=1 name=成功/Success） | standard-src＋設計書md | `#[ORM\Table(name: 'mtb_login_history_status')]`／`public const FAILURE = 0;`／`public const SUCCESS = 1;`／CSV(ja)`0,失敗,0` `1,成功,1`／CSV(en)`0,Failure,0` `1,Success,1`／「区分の保存値は失敗が0、成功が1」 | LoginHistoryStatus.php:23,32,37／mtb_login_history_status.csv(ja/en)全文／m11-04md:61,174 | 1 |
| L1-M1104-005 | status_transition | ページ番号も`resume`も無い初回表示（GET・POSTでない）: 検索条件を空にしてセッション`eccube.admin.login_history.search`へ保存、`page_no`を1にしてセッション保存。絞り込みは全件対象・作成日時降順・id降順で1ページ目を表示 | standard-src＋設計書md | `} else {`＋`    $pageNo = 1;`＋`    $viewData = FormUtil::getViewData($searchForm);`＋`    $session->set('eccube.admin.login_history.search', $viewData);`＋`    $session->set('eccube.admin.login_history.search.page_no', $pageNo);`＋`}`／「ページ番号も再表示指定もない初回表示では、検索条件を空にしてセッションへ保存し、1ページ目を全件対象で表示する。」 | LoginHistoryController.php:96-101／m11-04md:99 | 0 `non-ui-observable` |
| L1-M1104-006 | status_transition | `page_no`指定またはGET `?resume=1`のとき: `page_no`があればそれをセッション`eccube.admin.login_history.search.page_no`へ保存し、無ければセッション既存値（既定1）を使用。検索条件はセッション`eccube.admin.login_history.search`（既定`[]`）から読み出す | standard-src＋設計書md | `if (null !== $pageNo || $request->get('resume')) {`＋`    if ($pageNo) {`＋`        $session->set('eccube.admin.login_history.search.page_no', (int) $pageNo);`＋`    } else {`＋`        $pageNo = $session->get('eccube.admin.login_history.search.page_no', 1);`＋`    }`＋`    $viewData = $session->get('eccube.admin.login_history.search', []);`＋`}`／「ページ番号付きURLまたは`resume`での再表示では、保存済みの検索条件…と保存済みページ番号を読み出して絞り込む。」 | LoginHistoryController.php:88-95／m11-04md:98 | 0 `non-ui-observable` |
| L1-M1104-007 | status_transition | POST検索が検証成功: 検索データをセッション`eccube.admin.login_history.search`（`FormUtil::getViewData`経由）へ保存・`page_no`を1にしてセッション保存。絞り込み結果の1ページ目を表示 | standard-src＋設計書md | `if ($searchForm->isSubmitted() && $searchForm->isValid()) {`＋`    $searchData = $searchForm->getData();`＋`    $pageNo = 1;`＋`    $session->set('eccube.admin.login_history.search', FormUtil::getViewData($searchForm));`＋`    $session->set('eccube.admin.login_history.search.page_no', $pageNo);`＋`}`／「入力値の検証に成功した場合、検索条件をセッション…へ保存し、ページ番号を1へ初期化してセッションへ保存する。」 | LoginHistoryController.php:73-78／m11-04md:105 | 0 `non-ui-observable` |
| L1-M1104-008 | status_transition | POST検索が検証失敗: `pagination`は空配列・`has_errors`は`true`で返り、一覧テーブルは表示されない。**検索条件（`eccube.admin.login_history.search`）・ページ番号（`.search.page_no`）への保存は行われない**（elseブランチ自体にセッション書込みコードは無い＝codex R2是正：ただし表示件数`.search.page_count`は同一リクエスト内でフォーム検証より前の55-65行で評価・保存され得るため、この不保存の対象に含めない） | standard-src＋設計書md | `} else {`＋`    return [`＋`        'searchForm' => $searchForm->createView(),`＋`        'pagination' => [],`＋`        'pageMaxis' => $pageMaxis,`＋`        'page_no' => $pageNo ?: 1,`＋`        'page_count' => $pageCount,`＋`        'has_errors' => true,`＋`    ];`＋`}`／「入力値の検証に失敗した場合は一覧を出さず…この場合は検索条件をセッションへ保存しない。」 | LoginHistoryController.php:78-87／m11-04md:107 | 0 `non-ui-observable` |
| L1-M1104-009 | page_count_rule | `page_count`パラメータは`is_numeric()`かつ表示件数マスタ（`PageMaxRepository::findAll()`）の`name`と**PHPの緩い比較`==`で等価**（数値としての等価判定であり文字列としての厳密一致ではない＝codex R2是正）の場合のみ採用され、セッション`eccube.admin.login_history.search.page_count`へ保存される。不一致・非数値は不採用（既定はセッション既存値、無ければ`eccube_default_page_count`=10）。マスタ値=10/50/100/300/500/1000/2000/10000/12000 | standard-src＋設計書md | `$pageCount = $session->get('eccube.admin.login_history.search.page_count', $this->eccubeConfig['eccube_default_page_count']);`＋`$pageCountParam = $request->get('page_count');`＋`if ($pageCountParam && is_numeric($pageCountParam)) {`＋`    foreach ($pageMaxis as $pageMax) {`＋`        if ($pageCountParam == $pageMax->getName()) {`＋`            $pageCount = $pageMax->getName();`＋`            $session->set('eccube.admin.login_history.search.page_count', $pageCount);`＋`            break;`＋`        }`＋`    }`＋`}`／`eccube_default_page_count: 10`／CSV: `"10","10","1"`…`"12000","12000","9"`／「表示件数マスタの値のみ採用する。リクエストの`page_count`がマスタ値に一致しない場合は採用せず…」 | LoginHistoryController.php:55-65／eccube.yaml:142／mtb_page_max.csv(ja)全文／m11-04md:175 | 0 `non-translated`（値のみ）※既存PHPUnit `LoginHistoryControllerTest.php:96-98`は素のPOST直後の既定選択値として「50件」を観測しており設定値10と数値が異なる（要実機で解消・§9） |
| L1-M1104-010 | js_rule | 表示件数プルダウン（`#page_count_pulldown`）の`change`イベントで、選択肢の`value`（`page_count`付きURL）へ`window.location.href`で遷移する | standard-src＋設計書md | `$('#page_count_pulldown').on('change', function () {`＋`    const targetUrl = $(this).val();`＋`    if (targetUrl) {`＋`        window.location.href = targetUrl;`＋`    }`＋`});`／「表示件数プルダウンを変更すると、選択肢の値に設定したURLへ`window.location.href`で遷移する。」 | login_history.twig:24-29／m11-04md:85 | 0 `non-translated` |
| L1-M1104-011 | display | 詳細検索ブロック（`#searchDetail`）はBootstrap collapseクラス付与のCSSで初期折りたたみ、`has_errors`が真のときのみ`show`クラスが追加され開いた状態になる | standard-src＋設計書md | `<div class="c-subContents ec-collapse collapse{{ has_errors ? ' show' }}" id="searchDetail">`／「詳細検索ブロックはBootstrapのcollapseで折りたたみ、初期は閉じる。検索バリデーションエラーがある場合は詳細検索ブロックを開いた状態で表示する。」 | login_history.twig:50／m11-04md:86 | 0 `non-translated` |
| L1-M1104-012 | search_rule | `multi`（キーワード）検索: 入力から半角・全角スペースを`preg_replace('/\s+|[　]+/u', '', ...)`で除去した文字列で`lh.user_name LIKE %...%  OR lh.client_ip LIKE %...%`の部分一致 | standard-src＋設計書md | `$clean_key_multi = preg_replace('/\s+|[　]+/u', '', (string) $searchData['multi']);`＋`$qb`＋`    ->andWhere('lh.user_name LIKE :multi_key OR lh.client_ip LIKE :multi_key')`＋`    ->setParameter('multi_key', '%'.$clean_key_multi.'%')`／「入力からスペース（半角・全角）を除去した文字列で、ログインIDまたはIPアドレスのいずれかに部分一致する行を対象とする。」 | LoginHistoryRepository.php:50-57／m11-04md:122,173 | 0 `non-translated` |
| L1-M1104-013 | search_rule | `user_name`単独検索: スペース除去なしで`lh.user_name LIKE %入力値%`の部分一致 | standard-src＋設計書md | `$qb`＋`    ->andWhere('lh.user_name LIKE :user_name')`＋`    ->setParameter('user_name', '%'.$searchData['user_name'].'%');`／「入力文字列でログインIDに部分一致する行を対象とする。」 | LoginHistoryRepository.php:65-69／m11-04md:123 | 0 `non-translated` |
| L1-M1104-014 | search_rule | `client_ip`単独検索: スペース除去なしで`lh.client_ip LIKE %入力値%`の部分一致 | standard-src＋設計書md | `$qb`＋`    ->andWhere('lh.client_ip LIKE :client_ip')`＋`    ->setParameter('client_ip', '%'.$searchData['client_ip'].'%');`／「入力文字列でIPアドレスに部分一致する行を対象とする。」 | LoginHistoryRepository.php:59-63／m11-04md:124 | 0 `non-translated` |
| L1-M1104-015 | search_rule | 期間検索: `create_datetime_start`指定時は`lh.create_date >= :create_datetime_start`（以上）。`create_datetime_end`指定時は値を`clone`し`+1日`調整を**せず**そのまま`lh.create_date < :create_datetime_end`（未満）。既存PHPUnit実測: `-1hour`→3件ヒット・`+1hour`→0件ヒット（start）／`+1hour`→3件・`-1hour`→0件（end） | standard-src＋設計書md | `if (!empty($searchData['create_datetime_start'])) {`＋`    $qb->andWhere('lh.create_date >= :create_datetime_start')->setParameter('create_datetime_start', $searchData['create_datetime_start']);`＋`}`＋`if (!empty($searchData['create_datetime_end'])) {`＋`    $date = clone $searchData['create_datetime_end'];`＋`    $qb->andWhere('lh.create_date < :create_datetime_end')->setParameter('create_datetime_end', $date);`＋`}`／`yield ['create_datetime_start', '- 1 hour', 3]; yield ['create_datetime_start', '+ 1 hour', 0]; yield ['create_datetime_end', '+ 1 hour', 3]; yield ['create_datetime_end', '- 1 hour', 0];`／「開始｜ログイン試行日時が開始指定値以上の行を対象とする。」「終了｜…終了指定値より前の行を対象とする。終了値はそのまま比較に用いる。」 | LoginHistoryRepository.php:72-83／LoginHistoryRepositoryGetQueryBuilderBySearchDataAdminTest.php:172-178／m11-04md:125-126 | 0 `non-translated` |
| L1-M1104-016 | search_rule | `Status`（複数選択）: `count($searchData['Status'])`が真のときのみ`lh.Status IN (:Status)`を適用。空／未チェックのときは絞り込みをせず成功・失敗の双方を対象にする。既存PHPUnit実測: `[SUCCESS]`→1件・`[FAILURE]`→2件・両方→3件（フィクスチャ内訳=成功1+失敗2の計3件） | standard-src＋設計書md | `if (!empty($searchData['Status']) && count($searchData['Status'])) {`＋`    $qb->andWhere($qb->expr()->in('lh.Status', ':Status'))->setParameter('Status', $searchData['Status']);`＋`}`／`yield [[LoginHistoryStatus::SUCCESS], 1]; yield [[LoginHistoryStatus::FAILURE], 2]; yield [[LoginHistoryStatus::SUCCESS, LoginHistoryStatus::FAILURE], 3];`／「チェックされた区分のいずれかに一致する行を対象とする。未チェックなら区分での絞り込みをしない。」 | LoginHistoryRepository.php:100-105／LoginHistoryRepositoryGetQueryBuilderBySearchDataAdminTest.php:114-118／m11-04md:127,197 | 0 `non-translated` |
| L1-M1104-017 | sort_rule | 並び順は`create_date`降順を第1キー、`id`降順を第2キー（`addOrderBy`を2回呼び出し、第1・第2ソートキーとして順に追加される） | standard-src＋設計書md | `$qb`＋`    ->addOrderBy('lh.create_date', 'DESC')`＋`    ->addOrderBy('lh.id', 'DESC');`／「ログイン試行日時の降順、同一日時内はID降順で並べる。」 | LoginHistoryRepository.php:108-110／m11-04md:100,128,172 | 0 `non-translated` |
| L1-M1104-018 | ext_hook | 検索クエリは最終行で`Queries::customize(QueryKey::LOGIN_HISTORY_SEARCH_ADMIN, $qb, $searchData)`を経由し、拡張ポイントによる差し替えが可能（`QueryKey::LOGIN_HISTORY_SEARCH_ADMIN = 'LoginHistory.getQueryBuilderBySearchDataForAdmin'`） | standard-src＋設計書md | `return $this->queries->customize(QueryKey::LOGIN_HISTORY_SEARCH_ADMIN, $qb, $searchData);`／`public const string LOGIN_HISTORY_SEARCH_ADMIN = 'LoginHistory.getQueryBuilderBySearchDataForAdmin';`／「検索条件は拡張ポイントを通じて差し替え可能であり、追加の絞り込みが入る場合はその拡張側の実装を正とする。」 | LoginHistoryRepository.php:112／QueryKey.php:26／m11-04md:130 | 0 `non-ui-observable` |
| L1-M1104-019 | validation_rule | `multi`／`user_name`／`client_ip`はいずれも`Assert\Length(max: eccube_stext_len)`のみ（`eccube_stext_len=255`）。NotBlank等の必須制約は無し（`required=>false`） | standard-src＋設計書md | `->add('multi', TextType::class, [ 'required' => false, 'constraints' => [ new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]) ] ])`（user_name/client_ip同型）／`eccube_stext_len: 255`／「最大255文字。超過時はフォーム検証エラー。」 | SearchLoginHistoryType.php:43-63／eccube.yaml:137／m11-04md:182-184,265-267 | 0 `non-translated`（値のみ） |
| L1-M1104-020 | validation_rule/message | `create_datetime_start`／`create_datetime_end`は`Assert\Range(min: '0003-01-01', minMessage: 'form_error.out_of_range')`。超過時メッセージ: ja「不正な日付です。」／en "Invalid DateTime."。母集合059は「期間欄に範囲下限の検証がある」がほぼ逐語で対応 | standard-src＋設計書md | `->add('create_datetime_start', DateTimeType::class, [ 'required' => false, ..., 'constraints' => [ new Assert\Range(['min' => '0003-01-01', 'minMessage' => 'form_error.out_of_range']) ] ])`（endも同型）／`form_error.out_of_range: 不正な日付です。`／en: `Invalid DateTime.`／「期間欄に範囲下限の検証がある。」 | SearchLoginHistoryType.php:70-103／validators.ja.yaml:60／validators.en.yaml:47／m11-04md:158,185-186,268 | 1 |
| L1-M1104-021 | message/display | 成功区分バッジ: `LoginHistory.Status.id == LoginHistoryStatus::SUCCESS`のとき`badge-ec-blue`＋区分名「成功」/"Success"。それ以外（失敗）は`badge-ec-red`＋「失敗」/"Failure" | standard-src＋設計書md | `<span class="badge {% if LoginHistory.Status.id == constant('Eccube\\Entity\\Master\\LoginHistoryStatus::SUCCESS') %}badge-ec-blue{% else %}badge-ec-red{% endif %}">`＋`    {{ LoginHistory.Status }}`＋`</span>`／CSV: `1,成功,1`／`0,失敗,0`／「成功区分バッジ｜成功｜Success｜行の区分が成功のとき。青系バッジで表示する。」「失敗区分バッジ｜失敗｜Failure｜行の区分が失敗のとき。赤系バッジで表示する。」 | login_history.twig:171-174／mtb_login_history_status.csv(ja/en)／m11-04md:148-149 | 1 |
| L1-M1104-022 | db_effect(observed-scope) | `LoginHistoryController::index()`（`LoginHistoryController.php`120行全文）に`persist`/`flush`/`INSERT`/`UPDATE`/`->remove(`が**0件**（grep実測・exit code 1＝非該当）。**DOC-DRAFT-M1104-01（未解決・断定しない）**: 設計書DB操作節（md:255-257）は同一設計書5箇所（md:7,211,231,284,364）の参照専用宣言と矛盾する（設計内矛盾）。別クラス`LoginHistoryListener`が`KernelEvents::REQUEST`（全リクエストで発火しうる）を購読し`onPostLogin`（54-90行）でpersist/flush、`LoginFailureEvent`で`onAuthenticationFailure`（94-142行）で生SQL INSERTを行う実装上の書込経路が別途実在する（本コントローラの`index()`からは呼ばれない）。**本claimが保証する観測範囲は「Controller経由の一覧・検索・ページング操作」に限定し、全経路・全テーブルの無書込は主張しない。設計書DB操作節の正誤・テンプレ由来・是正要否も裁定しない** | standard-src vs 設計書md | 「記録の発生源は認証処理側であり、本機能はその記録を読み取って表示する。」（md:7）／「表示する履歴は認証処理側が記録した行であり、本機能は更新しない。」（md:211）／「台帳・履歴の更新はしない。」（md:231）／「本機能は参照のみで、履歴の編集・削除操作を持たない。」（md:284）／「本機能は一覧表示と検索のみの参照であり、業務データを更新しない。」（md:364）／（対比・設計書側）「登録/更新｜dtb_login_history / mtb_login_history_status｜当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。」（md:257）／`KernelEvents::REQUEST => 'onPostLogin', LoginFailureEvent::class => 'onAuthenticationFailure',`／`$this->entityManager->persist($LoginHistory);`（LoginHistoryListener.php:85＝別クラス・別イベント経路の実装事実） | LoginHistoryController.php:1-120（全文grep0件）／m11-04md:7,211,231,257,284,364／LoginHistoryListener.php:49-51,54-90,94-142 | 0 `non-ui-observable` |
| L1-M1104-023 | empty_rule | 検索結果0件（`pagination.totalItemCount`が0または falsy）: 一覧テーブルを出さず、`admin.common.search_no_result`＋`admin.common.search_try_change_condition`＋`admin.common.search_try_advanced_search`を表示。ja「検索条件に合致するデータが見つかりませんでした」/「検索条件を変えて、再度検索をお試しください」/「[詳細検索]も試してみましょう」。en "Sorry, no data matches your search condition(s)" / "Please change the search condition(s) and try again." / "Try [Advanced Search]" | standard-src＋設計書md | `{% else %}`＋`    <div class="text-center text-muted mb-4 h5">{{ 'admin.common.search_no_result'|trans }}</div>`＋`    <div class="text-center text-muted">{{ 'admin.common.search_try_change_condition'|trans }}</div>`＋`    <div class="text-center text-muted">{{ 'admin.common.search_try_advanced_search'|trans }}</div>`／`admin.common.search_no_result: 検索条件に合致するデータが見つかりませんでした`／en: `Sorry, no data matches your search condition(s)`／「検索結果が0件のとき｜一覧表を出さず、0件メッセージを表示する。」 | login_history.twig:194-201／messages.ja.yaml:1735-1737／messages.en.yaml:1764-1766／m11-04md:200,316 | 1 |
| L1-M1104-024 | display_field | 一覧列（`pagination`が1件以上）: `ID`＝`LoginHistory.id`／`ログインID`＝`user_name`／`IPアドレス`＝`client_ip`／`ログイン試行日`＝`create_date`を`date_format('','Y/m/d H:i:s')`で整形／`ステータス`＝バッジ（L1-021）。列見出しは`admin.common.id`（ja/en共に"ID"）・`admin.setting.system.login_history.user_name`（ja「ログインID」/en "ID"）・`.client_ip`（ja「IPアドレス」/en "IP Address"）・`.create_date`（ja「ログイン試行日」/en "Login Attempt Date"）・`.status`（ja「ステータス」/en "Status"） | standard-src＋設計書md | `<td class="align-middle ps-3">{{ LoginHistory.id }}</td>`＋`<td class="align-middle">{{ LoginHistory.user_name }}</td>`＋`<td class="align-middle">{{ LoginHistory.client_ip }}</td>`＋`<td class="align-middle">{{ LoginHistory.create_date|date_format('','Y/m/d H:i:s') }}</td>`／`admin.setting.system.login_history.user_name: ログインID`／en: `ID`／`admin.setting.system.login_history.client_ip: IPアドレス`／en: `IP Address`／`admin.setting.system.login_history.create_date: ログイン試行日`／en: `Login Attempt Date`／「検索条件に一致する履歴行を、ID・ログインID・IPアドレス・ログイン試行日時・成功失敗区分の列でページ表示する。」 | login_history.twig:149-174／messages.ja.yaml:1805,3313,3316-3318／messages.en.yaml:1805,2927,2930-2932／m11-04md:229 | 1 |
| L1-M1104-025 | data_integrity | `LoginHistory.LoginUser`は`onDelete: 'SET NULL'`のFK。管理者削除後も`user_name`・`client_ip`・`Status`はプレーン列のためレコードごと保持され一覧に表示され続ける（`member_id`のみNULL化） | standard-src＋設計書md | `#[ORM\JoinColumn(name: 'member_id', referencedColumnName: 'id', onDelete: 'SET NULL')]`／「管理者削除済みの履歴行｜履歴行のログインID・IPアドレス・区分は保持されるため一覧に表示する。管理者参照は削除時にNULLとなる。」 | LoginHistory.php:59-61／m11-04md:202 | 0 `non-ui-observable` |
| L1-M1104-026 | display | 表示要素一式: キーワード欄（`multi`・ツールチップ付きヘルプアイコン）・詳細検索開閉リンク・詳細検索内の`user_name`欄・`client_ip`欄・期間欄（開始/終了・フォームtype側`attr`で`data-toggle: datetimepicker`付与）・`Status`チェックボックス群・検索ボタン・検索結果件数・表示件数プルダウン・履歴一覧表・ページャ | standard-src＋設計書md | `{{ form_widget(searchForm.multi) }}`＋`<i class="fa fa-question-circle fa-lg ms-1"></i>`／`<div ... data-bs-toggle="collapse" href="#searchDetail" ...>`／`{{ form_widget(searchForm.user_name) }}`／`{{ form_widget(searchForm.client_ip) }}`／`{{ form_widget(searchForm.create_datetime_start) }}`（twig側は`form_widget()`呼出のみ。`data-toggle="datetimepicker"`属性の実体はtwigでなくFormType側）／`'data-toggle' => 'datetimepicker',`（start/end両方の`attr`）／`{{ form_widget(searchForm.Status, ...) }}`／`<button type="submit" class="btn btn-ec-conversion px-5">{{ 'admin.common.search'|trans }}</button>`／`<span class="fw-bold ms-2">{{ 'admin.common.search_result'|trans(...) }}</span>`／`<select id="page_count_pulldown" ...>`／`<table class="table">`／`{% include "@admin/pager.twig" ... %}`／「キーワード検索欄、詳細検索の開閉リンク、詳細検索内のログインID欄・IPアドレス欄・期間欄・ステータスのチェックボックス、検索ボタン、検索結果件数、表示件数プルダウン、履歴の一覧表、ページャを表示する。」 | login_history.twig:42-183（全文実測）／SearchLoginHistoryType.php:81-85,98-102（**codex R1是正: data-toggle属性の出典はtwigでなくFormType**）／m11-04md:84 | 0 `non-translated`（要素の有無。文言はL1-024/S-005〜S-007） |
| L1-M1104-027 | session_rule | `GET .../login_history?resume=1`は`resume`パラメータが真値のためL1-006の分岐へ入り、セッション保存済みの検索条件・ページ番号で一覧を再表示する（`page_no`未指定の場合の枝） | standard-src＋設計書md | `if (null !== $pageNo || $request->get('resume')) {`＋`    ... } else { $pageNo = $session->get('eccube.admin.login_history.search.page_no', 1); }`＋`    $viewData = $session->get('eccube.admin.login_history.search', []);`／「前回条件で再表示｜`GET .../login_history?resume=1`｜セッションに保存済みの検索条件・ページ番号で一覧を再表示する。」 | LoginHistoryController.php:88-95／m11-04md:75（**codex R1是正: 旧引用md:86は詳細検索collapseのCSS節でありresumeの根拠でない。resumeの設計根拠はmd:75のみ**） | 0 `non-ui-observable` |
| L1-M1104-028 | **DOC-DRAFT-M1104-02** | 設計書md:155-157の検証失敗・0件時ja文言（「検索条件が無効です。」「検索条件を変えてお試しください。」「検索結果がありませんでした。」）は実カタログ値（messages.ja.yaml:1734-1736）と逐語不一致（意味は同一だが文言が異なる）。en側（md:155-157のen列）は実カタログ（messages.en.yaml:1763-1765）と完全一致。オラクルの正はソース実値とし、設計書ja文言は要約パラフレーズと裁定（実装是正は不要） | standard-src vs 設計書md | 「検索条件が無効です。｜Error found in the search condition(s)」（md:155）／「検索条件を変えてお試しください。｜Please change the search condition(s) and try again.」（md:156）／「検索結果がありませんでした。｜Sorry, no data matches your search condition(s)」（md:157）／（対比）`admin.common.search_invalid_condition: 検索条件に誤りがあります`／`admin.common.search_try_change_condition: 検索条件を変えて、再度検索をお試しください`／`admin.common.search_no_result: 検索条件に合致するデータが見つかりませんでした`／en側は完全一致: `Error found in the search condition(s)`／`Please change the search condition(s) and try again.`／`Sorry, no data matches your search condition(s)` | m11-04md:155-157／messages.ja.yaml:1734-1736／messages.en.yaml:1763-1766 | 1 |
| L1-M1104-029 | **TBD** | 失敗履歴の書き込み失敗（md:212「失敗履歴の書き込みに失敗した場合は履歴行が作られず、認証機能側でサーバログに記録される。本機能はその場合に該当行を表示しない。」）は実claimである。書き込み失敗は`LoginHistoryListener::onAuthenticationFailure`（本機能の外・認証機能側、107-142行はtry-catchでlog_error）のDB例外に依存するが、**本候補では安全な誘発手段の設計・観測契約を定義できていない**（誘発手段の有無自体は断定しない＝codex R1是正）。**未確定オラクル台帳へ**（excludedにしない=実在仕様の除外禁止） | 設計書md | 「失敗履歴の保存失敗｜失敗履歴の書き込みに失敗した場合は履歴行が作られず、認証機能側でサーバログに記録される。本機能はその場合に該当行を表示しない。」 | m11-04md:212／LoginHistoryListener.php:107-142（例外はcatchしlog_error・呼び出し元は認証機能） | — |

計**29行＝27claim確定＋1 DOC-DRAFT-M1104-01（L1-022に統合）＋1 DOC-DRAFT-M1104-02（L1-028）＋1 TBD（L1-029）**。
L1-001は補完専用（母集合に直接対応するbind先なし。§8実測で確認）。

## §2 SEED三段参照設計（★読取専用＝db.tsは無書込観測＋検索照会の三段参照）

三段参照: `L1claim（期待の正） → fixture_version（SEEDセットID@manifest_sha1） → 実値`。**SEED固定値は入力の
再現手段であり期待値の正にしない**。集計・検索ケースの期待は「L1の検索/並び替え規則をdb.tsで実DB状態に対して
独立評価した値」または「操作前後のスナップショット同値比較（無書込確認）」であり、SEED既知値はブラケット
（適用前後差分）のサニティ確認にのみ使う。全て `@TBD-D5`。

**本機能の統治（Controller経由の操作範囲で無書込・codex R1是正で全経路主張を撤回）**: `LoginHistoryController::index()`
（一覧・検索・ページング・表示件数変更）からは`dtb_login_history`／`mtb_login_history_status`への登録・更新・削除
が発生しない（L1-022・grep実測）。ただし別クラス`LoginHistoryListener`が`KernelEvents::REQUEST`という全リクエスト
共通のカーネルイベントを購読しており、**全経路・全テーブルの無書込は主張しない**（DOC-DRAFT-M1104-01は未解決の
まま=§0参照）。よってm10-12/m05-13型の「破壊系→afterEach復元」規律は（Controller経由の操作に限れば）不要。
代わりに**db.tsによる直接INSERT/DELETEでSEED行を用意**し（本機能を経由しない投入・後始末は`user_name`にrunidマ
ーカーprefixを用いた`title`相当の識別＝`user_name LIKE 'E2E-<runid>-%'`該当行の削除）、検索・並び順・ページング
を**読取のみ**で検証する。無書込確認（C-018/C-025/C-028相当）は「**指定した一覧・検索・ページング操作の前後**で
`dtb_login_history`の行数・主キー順全列ダイジェストが不変」という観測できる挙動のみを決定的差分照会で確認する
（m02-02のC-036と同型の手法だが、本機能では観測範囲をController経由操作に明示的に限定する）。

| SEEDセットID | 目的 | 固定値（設計） | 後始末 |
|---|---|---|---|
| SEED-M01-ADMIN | 管理者ログイン | W0/B0各機能と共通（管理画面ログイン可能なmember） | 不変・既存利用 |
| SEED-M1104-LIST | 並び順（create_date DESC, id DESC）観測用 | `dtb_login_history` 3件（帯900110401〜03・base_info_id=既定店舗・login_history_status_id=1）: id=900110401(create_date=2026-08-01 10:00:00)・id=900110402(create_date=2026-08-01 10:00:00・**同一日時でidタイブレーク観測用**)・id=900110403(create_date=2026-08-02 09:00:00) | db.ts直接DELETE（帯id指定）。読取専用のため書換不要 |
| SEED-M1104-SEARCH | 検索条件（multi/user_name/client_ip/Status/期間）観測用 | `dtb_login_history` 4件（帯900110411〜14）: id=900110411(user_name=`E2E-<runid>-alice`,client_ip=`10.0.0.1`,status=1〔成功〕,create_date=2026-08-11 09:00:00)・id=900110412(user_name=`E2E-<runid>-bob`,client_ip=`10.0.0.2`,status=0〔失敗〕,create_date=2026-08-11 10:00:00)・id=900110413(user_name=`E2E-<runid>-alice2`〔前後全角スペース入り〕,client_ip=`10.0.0.1`,status=1,create_date=2026-08-12 09:00:00)・id=900110414(user_name=`E2E-<runid>-carol`,client_ip=`10.0.0.3`,status=0,create_date=2026-08-13 09:00:00) | db.ts直接DELETE（`user_name LIKE 'E2E-<runid>-%'`該当行） |
| SEED-M1104-DELMEMBER | 管理者削除済み履歴行（member_id=NULL）観測用 | `dtb_login_history` 1件: id=900110421・user_name=`E2E-<runid>-deletedadmin`・client_ip=`10.0.0.9`・status=1・member_id=NULL（削除済み管理者を模す＝直接NULLで投入し実削除フローは経由しない） | db.ts直接DELETE |
| SEED-M1104-EMPTY | 検索結果0件観測 | `dtb_login_history`に`user_name LIKE 'E2E-<runid>-nomatch-%'`該当行が存在しない状態（状態の不在） | 実体データなし。共有DBでは単独保証不能＝隔離条件（runid固有文字列）で回避 |

- **S0規律（無書込確認）**: 「更新しない」の期待は、操作前にdb.tsで取得したスナップショット
  （`S0=(SELECT count(*) FROM dtb_login_history, md5(string_agg(lh::text,',' ORDER BY lh.id)) FROM dtb_login_history lh)`）
  との操作後同値比較で書く（m02-02のC-036・§6.3c型）。
- 対象行の一意特定は**固定id（900110401〜900110421帯）**または`user_name`のrunidマーカーprefixで決定的。

## §3 検索マトリクス（フィールド×極性×観測面）

三値比較: 設計書md（業務ルール・計算:167-202・DBカラム:239-249）／ee Form（`SearchLoginHistoryType.php`）／
ee Repository（`LoginHistoryRepository.php`）。

| 区分 | フィールド | 極性 | 挙動 | L1 |
|---|---|---|---|---|
| キーワード | multi | 一致 | スペース除去後`user_name OR client_ip`部分一致 | L1-012 |
| ログインID | user_name | 一致 | スペース除去なし部分一致 | L1-013 |
| IPアドレス | client_ip | 一致 | スペース除去なし部分一致 | L1-014 |
| 期間開始 | create_datetime_start | 以上 | `>= start` | L1-015 |
| 期間終了 | create_datetime_end | 未満 | `< end`（clone・+1日調整なし） | L1-015 |
| ステータス | Status | IN一致／未指定は絞込なし | `IN (:Status)`または条件を付けない | L1-016 |
| 並び順 | create_date, id | — | DESC, DESC（タイブレーク） | L1-017 |
| 表示件数 | page_count | マスタ値と`==`等価（数値等価・厳密一致ではない） | 不一致は不採用 | L1-009 |

## §4 実行可能グレード14列TSV（候補・**自己完結＝全53行を実体掲載**）

記法: 期待結果セルは三段参照 `…実値… [L1:<oracle_id>; fixture:<SEEDセットID>@TBD-D5]`。
`%eccube_admin_route%` は環境値（既定 `admin`）。LIST=id900110401-403（SEED-M1104-LIST）・
SEARCH=id900110411-414（SEED-M1104-SEARCH）・DELMEMBER=id900110421（SEED-M1104-DELMEMBER）。
en行はD15前提。

### §4.1 bound対応候補行（40行=ja31＋-EN9。§8の87対応表が参照する全行）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-001	IT-15	識別子	P1	dtb_login_historyの1レコードが一覧の各列に反映される	ログイン済(SEED-M01-ADMIN)／SEED-M1104-LIST	—	1. db.tsでid=900110401の全列（id/user_name/client_ip/create_date/login_history_status_id/member_id）を照会 2. GET一覧を開き当該行の表示値を読む	一覧行のID・ログインID・IPアドレス・ログイン試行日・ステータスがdtb_login_history/mtb_login_history_statusの保存値と一致する [L1:L1-M1104-003,L1-M1104-004; fixture:SEED-M1104-LIST@TBD-D5]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-002	IT-15	対象データ	P1	ログイン試行日時列は履歴行のcreate_dateであり一覧にY/m/d H:i:s形式で表示される	ログイン済／SEED-M1104-LIST(id=900110401,create_date=2026-08-01 10:00:00)	—	1. db.tsでcreate_dateを照会 2. 一覧の当該行「ログイン試行日」表示値を読む	表示値が「2026/08/01 10:00:00」形式（date_format('','Y/m/d H:i:s')）でDB実値と一致する [L1:L1-M1104-003; fixture:SEED-M1104-LIST@TBD-D5]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-003	IT-20	出力抑止	P2	詳細検索ブロックにログインID単独欄・IPアドレス単独欄・期間欄・ステータスのチェックボックスが存在する	ログイン済	—	1. GET一覧を開く 2. 詳細検索リンクを押下し展開する 3. user_name欄・client_ip欄・期間欄2つ・Statusチェックボックス群の存在を確認	詳細検索ブロック内にログインID欄・IPアドレス欄・期間欄（開始/終了）・ステータスのチェックボックス群が表示される [L1:L1-M1104-026]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-003-EN	IT-20	出力抑止	P3	詳細検索欄ラベル（en）	ログイン済／locale=en	—	同上	ラベルが "ID" / "IP Address" / "Login Attempt Date" / "Status" で表示される [L1:L1-M1104-024]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-004	IT-20	識別子	P1	初回表示（page_no/resume無し）はセッションを空にし全件を作成日時降順id降順で1ページ目に表示する	ログイン済（当セッション初回アクセス）／SEED-M1104-LIST	—	1. GET /%eccube_admin_route%/setting/system/login_history 2. 一覧行のid順を読む 3. db.tsでセッション相当の初期状態を推定（検索フォーム全欄が空であることを画面で確認）	一覧のid順が900110403,900110402,900110401（create_date降順・同日時はid降順）と一致し、検索欄は全て空 [L1:L1-M1104-005,L1-M1104-017; fixture:SEED-M1104-LIST@TBD-D5]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-005	IT-15	状態変化	P1	検索実行(POST)は検証成功時に絞り込んだ1ページ目を表示しセッションへ保存する	ログイン済／SEED-M1104-SEARCH	user_name=`E2E-<runid>-alice`（部分一致）	1. 詳細検索でuser_nameへ入力し検索ボタン押下 2. 表示された一覧行を読む 3. GET /login_history（page_no無し）で再訪しフォーム欄の値を確認	検索結果にid=900110411,900110413（user_name部分一致）が含まれ、他機能非対象行は含まれない。再訪時にフォームへ入力値が復元される（セッション保存の確認） [L1:L1-M1104-007,L1-M1104-013; fixture:SEED-M1104-SEARCH@TBD-D5]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-006	IT-25	確認ダイアログ	P2	ページ送り(GET .../{page_no})は保存済みの検索条件のまま指定ページを表示する	ログイン済／SEED-M1104-SEARCH／page_count=1(1件表示)	—	1. user_nameでSEARCH行(2件ヒット)を検索 2. GET .../login_history/2 でページ送り 3. 2ページ目の行を読む	2ページ目に検索条件を維持したままの2件目の行が表示される（検索条件はページ送りで失われない） [L1:L1-M1104-006; fixture:SEED-M1104-SEARCH@TBD-D5]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-007	IT-25	HTTPステータス	P2	表示件数プルダウン選択のURL(page_count=マスタ値)遷移は件数をセッションへ保存し1ページ目を表示する	ログイン済／SEED-M1104-LIST	page_count=50	1. GET .../login_history/1?page_count=50 2. プルダウンの選択状態を読む 3. 同一セッションでGET .../login_history（page_countパラメータ無し）を再訪し選択状態を読む	1回目・2回目とも表示件数プルダウンの選択値が「50件」（セッション`eccube.admin.login_history.search.page_count`保存の確認）[L1:L1-M1104-009; fixture:SEED-M1104-LIST@TBD-D5]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-007-EN	IT-25	HTTPステータス	P3	表示件数ラベル（en）	ログイン済／locale=en	page_count=50	同上	プルダウン選択肢テキストが "50 items"（`admin.common.count`のen値）で表示される [L1:L1-M1104-009]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-008	IT-22	JS挙動	P2	表示件数プルダウンのchangeでwindow.location.hrefへ遷移する	ログイン済	—	1. GET一覧を開く 2. プルダウンで別件数を選択（changeイベント発火） 3. 遷移先URLに選択値のpage_countが含まれることを確認	選択直後にページ遷移し、遷移先URLのpage_countクエリが選択した件数と一致する [L1:L1-M1104-010]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-009	IT-22	相関バリデーション	P2	詳細検索ブロックは初期折りたたみ・検証エラー時は開いた状態で表示される	ログイン済	create_datetime_start=`0002-12-31`（範囲外・検証失敗誘発）	1. GET一覧を開き#searchDetailにshowクラスが無いことを確認 2. 範囲外日付で検索送信 3. #searchDetailにshowクラスが付与されていることを確認	初回表示時は#searchDetailが閉じた状態（showクラス無し）・検証失敗後は開いた状態（showクラス付与） [L1:L1-M1104-011,L1-M1104-020]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-009-EN	IT-22	相関バリデーション	P3	詳細検索リンク文言（en）	ログイン済／locale=en	—	1. GET一覧を開く 2. 詳細検索リンクのテキストを読む	リンクテキストが "Advanced Search" [L1:L1-M1104-026]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-010	IT-22	必須バリデーション/検索条件	P2	検索フォーム全項目が任意であり全欄空で検索しても全件が表示される	ログイン済／SEED-M1104-LIST	全欄空	1. 詳細検索欄を全て空のまま検索ボタン押下 2. 一覧の件数と行を読む	検証エラーは発生せず（必須制約が無いため）、全件が作成日時降順で表示される [L1:L1-M1104-019; fixture:SEED-M1104-LIST@TBD-D5]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-011	IT-22	部分入力	P2	成功区分バッジは青系(badge-ec-blue)で「成功」と表示される	ログイン済／SEED-M1104-SEARCH(id=900110411,status=1)	—	1. GET一覧を開く 2. id=900110411の行のステータス列classとテキストを読む	classに`badge-ec-blue`を含み、テキストが「成功」 [L1:L1-M1104-021; fixture:SEED-M1104-SEARCH@TBD-D5]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-011-EN	IT-22	部分入力	P3	成功バッジ文言（en）	ログイン済／SEED-M1104-SEARCH／locale=en	—	同上	テキストが "Success" [L1:L1-M1104-021; fixture:SEED-M1104-SEARCH@TBD-D5]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-012	IT-23	検索条件	P2	失敗区分バッジは赤系(badge-ec-red)で「失敗」と表示される	ログイン済／SEED-M1104-SEARCH(id=900110412,status=0)	—	1. GET一覧を開く 2. id=900110412の行のステータス列classとテキストを読む	classに`badge-ec-red`を含み、テキストが「失敗」 [L1:L1-M1104-021; fixture:SEED-M1104-SEARCH@TBD-D5]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-012-EN	IT-23	検索条件	P3	失敗バッジ文言（en）	ログイン済／SEED-M1104-SEARCH／locale=en	—	同上	テキストが "Failure" [L1:L1-M1104-021; fixture:SEED-M1104-SEARCH@TBD-D5]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-013	IT-23	検索条件	P2	表示対象は検索条件一致行（成功・失敗双方を含む）でありステータス保存値の意味は失敗0成功1	ログイン済／SEED-M1104-SEARCH	client_ip=`10.0.0.1`	1. client_ipで検索（900110411,900110413が一致=いずれもstatus=1） 2. db.tsで両行のlogin_history_status_idを照会 3. 一覧結果と両行のバッジ表示を確認	検索結果にid=900110411,900110413が含まれ（成功・失敗の別を問わず一致条件のみで抽出）、両行ともlogin_history_status_id=1・バッジ「成功」表示 [L1:L1-M1104-014,L1-M1104-004; fixture:SEED-M1104-SEARCH@TBD-D5]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-014	IT-23	検索条件	P2	ステータス未チェックは区分での絞り込みをせず成功・失敗の双方を表示する	ログイン済／SEED-M1104-SEARCH	Statusチェックボックス全て未チェック（client_ip=`10.0.0.1`のみ指定）	1. client_ip指定・Status未チェックで検索 2. 結果にstatus=1の行のみが含まれる（client_ip条件のみで絞られる）ことを確認 3. Statusを何もチェックしていない状態で全件検索し成功・失敗双方が含まれることを確認	Status未チェック時は区分での絞り込みが行われず、client_ip等の他条件のみで絞り込まれる。全件検索では成功(id=900110411,413)・失敗(id=900110412,414)の双方が結果に含まれる [L1:L1-M1104-016; fixture:SEED-M1104-SEARCH@TBD-D5]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-015	IT-23	検索条件	P2	検索結果0件のとき一覧表を出さず0件メッセージを表示する（ja）	ログイン済	user_name=`E2E-<runid>-nomatch-xyz`（SEED-M1104-EMPTY相当・非存在文字列）	1. 存在しないuser_nameで検索 2. 一覧テーブルの非表示・メッセージ文言を読む	一覧テーブルは表示されず「検索条件に合致するデータが見つかりませんでした」「検索条件を変えて、再度検索をお試しください」「[詳細検索]も試してみましょう」が表示される [L1:L1-M1104-023]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-015-EN	IT-23	検索条件	P3	0件時メッセージ（en）	ログイン済／locale=en	同上	同上	"Sorry, no data matches your search condition(s)" / "Please change the search condition(s) and try again." / "Try [Advanced Search]" [L1:L1-M1104-023]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-016	IT-23	検索条件	P2	表示件数に不正値(マスタ非該当)を渡すと不採用となり既定/保存済みの件数で表示する	ログイン済／SEED-M1104-LIST	page_count=999999（マスタ非該当）	1. GET .../login_history/1?page_count=999999 2. プルダウンの選択状態と一覧の表示件数を読む	page_count=999999は不採用となり、プルダウンの選択値は既定または直前セッション保存値のまま（999999は選択肢に存在しない） [L1:L1-M1104-009; fixture:SEED-M1104-LIST@TBD-D5]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-017	IT-23	検索条件	P2	管理者削除済みの履歴行（member_id=NULL）もログインID・IPアドレス・区分を保持し一覧に表示される	ログイン済／SEED-M1104-DELMEMBER(id=900110421,member_id=NULL)	—	1. db.tsで対象行のmember_idがNULLであることを照会 2. GET一覧（またはuser_name検索）で当該行の表示を読む	一覧に当該行が表示され、ログインID・IPアドレス・ステータスバッジが保存値どおり表示される（member_idがNULLでも表示が欠落しない） [L1:L1-M1104-025; fixture:SEED-M1104-DELMEMBER@TBD-D5]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-018	IT-05	実行結果	P2	記録との整合性: 一覧表示・検索操作はdtb_login_historyを更新しない（読取専用の無書込確認）	ログイン済／SEED-M1104-LIST	—	1. db.tsでS0=(count(*), md5(string_agg(lh::text,',' ORDER BY lh.id))) FROM dtb_login_history を照会 2. 一覧表示・詳細検索展開・検索実行・ページ送り・表示件数変更を一通り操作 3. db.tsでS1を再照会	S0=S1（一覧表示・詳細検索展開・検索実行・ページ送り・表示件数変更というController経由の操作の前後で行数・全列ダイジェストとも完全一致）。全経路・全テーブルの無書込は主張しない（DOC-DRAFT-M1104-01は未解決のまま=§0参照。codex R1是正） [L1:L1-M1104-022; fixture:SEED-M1104-LIST@TBD-D5]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-019	IT-23	検索条件	P2	期間欄には範囲下限(0003-01-01)の検証がありcreate_datetime_start/endとも0003-01-01未満はエラーとなる	ログイン済	create_datetime_start=`0002-12-31 00:00:00`	1. 開始欄へ範囲外日付を入力し検索送信 2. 開始欄直下のエラー文言を読む 3. 一覧が表示されないことを確認	開始欄直下に「不正な日付です。」が表示され、一覧テーブルは表示されない（詳細検索は開いた状態） [L1:L1-M1104-020,L1-M1104-011]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-019-EN	IT-23	検索条件	P3	期間下限エラー文言（en）	ログイン済／locale=en	create_datetime_start=`0002-12-31 00:00:00`	同上	開始欄直下に "Invalid DateTime." [L1:L1-M1104-020]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-020	IT-23	実行結果	P2	表示列との整合性: 一覧の各列は履歴行の保存値をそのまま表示する（内部情報の透過性）	ログイン済／SEED-M1104-SEARCH	—	1. db.tsで4行の全列を照会 2. 一覧の対応する行・列のテキストを1件ずつ突合	4行とも一覧のID・ログインID・IPアドレス・ログイン試行日・ステータス列がDB保存値と完全一致する（変換・丸めは日時表示形式以外に存在しない） [L1:L1-M1104-003,L1-M1104-024; fixture:SEED-M1104-SEARCH@TBD-D5]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-021	IT-23	実行結果	P2	件数との整合性: 検索結果件数はページネーション部品の総件数でありページの行数とは別	ログイン済／SEED-M1104-SEARCH(4件)／page_count=2	—	1. 全件検索でpage_count=2に設定 2. 検索結果件数表示（%count%件が該当しました）を読む 3. 1ページ目の行数(2行)と比較	検索結果件数表示は「4」（総件数）であり、1ページ目の表示行数（2行）とは一致しない（総件数≠ページ内行数） [L1:L1-M1104-023; fixture:SEED-M1104-SEARCH@TBD-D5]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-022	IT-23	実行結果	P2	入力契約: 一覧表示要求・検索条件のPOST・ページ番号/表示件数を含むGETの3種の入力を受け付ける	ログイン済	—	1. GET .../login_history（一覧表示要求） 2. POST .../login_history（検索条件） 3. GET .../login_history/2?page_count=50（ページ番号・表示件数）	3種の入力すべてが200 OKで一覧画面を返す（HTTPメソッド・パラメータ契約の実証） [L1:L1-M1104-002]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-023	IT-23	実行結果	P1	成功時出力: 検索条件に一致する履歴行をID・ログインID・IPアドレス・ログイン試行日時・成功失敗区分の列でページ表示する	ログイン済／SEED-M1104-SEARCH	user_name=`E2E-<runid>-alice`	1. user_nameで検索 2. 一致した各行の5列（ID/ログインID/IPアドレス/ログイン試行日/ステータス）が表示されていることを確認	id=900110411,900110413の行がID・ログインID・IPアドレス・ログイン試行日・ステータスの5列でページ表示される [L1:L1-M1104-024; fixture:SEED-M1104-SEARCH@TBD-D5]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-023-EN	IT-23	実行結果	P3	一覧列見出し（en）	ログイン済／locale=en	—	1. GET一覧を開く 2. thead th のテキストを読む	見出しが "ID" / "ID" / "IP Address" / "Login Attempt Date" / "Status" [L1:L1-M1104-024]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-024	IT-12	画面レイアウト	P2	検索条件の検証失敗時は一覧を出さず詳細検索を開いた状態で見直しメッセージを表示する（ja）	ログイン済	create_datetime_start=`0002-12-31`（範囲外）	1. 範囲外日付で検索送信 2. 一覧テーブルの非表示・#searchDetailのshowクラス・見直しメッセージを読む	一覧は表示されず#searchDetailにshowクラスが付与され、「検索条件に誤りがあります」「検索条件を変えて、再度検索をお試しください」が表示される（DOC-DRAFT-M1104-02: 設計書ja文言と実カタログ文言は逐語不一致だが本テストはソース実値を正とする） [L1:L1-M1104-008,L1-M1104-011,L1-M1104-028]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-024-EN	IT-12	画面レイアウト	P3	検証失敗メッセージ（en）	ログイン済／locale=en	同上	同上	"Error found in the search condition(s)" / "Please change the search condition(s) and try again." [L1:L1-M1104-028]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-025	IT-12	画面レイアウト	P2	副作用は検索条件・ページ番号・表示件数のセッション保存のみでありDBは更新されない	ログイン済／SEED-M1104-LIST	user_name=`E2E-<runid>-x`	1. db.tsでS0（無書込確認と同型）を照会 2. 検索実行・ページ送り・表示件数変更を行う 3. db.tsでS1を照会し不変を確認 4. セッション由来の再訪（GET .../login_history）でフォーム欄・ページ番号・表示件数が保持されていることを確認	dtb_login_history/mtb_login_history_statusは、この検索実行・ページ送り・表示件数変更というController経由の操作の前後でS0=S1（不変）。全経路の無書込は主張しない。一方でセッション経由の検索条件・ページ番号・表示件数は次回表示に引き継がれる [L1:L1-M1104-022,L1-M1104-007; fixture:SEED-M1104-LIST@TBD-D5]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-026	IT-26	登録内容	P3	本機能は金額・在庫等の業務計算を行わない（件数表示はページネーション部品の総件数に従う）	ログイン済／SEED-M1104-SEARCH	—	1. 検索結果件数表示の値がSUM/AVG等の金額集計でなく単純な行数カウントであることをdb.tsのCOUNT(*)照会と突合	検索結果件数表示はCOUNT(*)相当の単純行数と一致し、金額・在庫の集計処理は行われない [L1:L1-M1104-009; fixture:SEED-M1104-SEARCH@TBD-D5]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-027	IT-12	画面レイアウト	P3	mtb_login_history_status.nameがバッジの表示文言（区分名）である	ログイン済／SEED-M1104-SEARCH	—	1. db.tsでmtb_login_history_status全行のid/nameを照会 2. 一覧の各行バッジテキストとid=login_history_status_idで対応するname値を突合	バッジのテキストがmtb_login_history_status.nameの値（id=0→「失敗」・id=1→「成功」）と一致する [L1:L1-M1104-004,L1-M1104-021; fixture:SEED-M1104-SEARCH@TBD-D5]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-028	IT-26	登録内容	P2	DOC-DRAFT-M1104-01（未解決）: 設計書DB操作節の記述と参照専用宣言5箇所は矛盾するが、どちらが正しいかは本候補で裁定せず、Controller経由の通常操作の前後で対象テーブルが不変であることのみを観測する	ログイン済／SEED-M1104-LIST	—	1. db.tsでS0=(count(*),全列md5ダイジェスト) FROM dtb_login_history/mtb_login_history_status を照会 2. 一覧表示・検索・ページ送り・表示件数変更・詳細検索開閉を一通り操作 3. db.tsでS1を再照会	S0=S1（両テーブルとも、一覧表示・検索・ページ送り・表示件数変更・詳細検索開閉というController経由の操作の前後で完全不変）。設計書md:257「登録/更新｜…persist/flushによる即時反映」は同一文書5箇所（md:7,211,231,284,364）の参照専用宣言と矛盾する（設計内矛盾・未解決）が、どちらが誤記か・テンプレ由来か・是正要否かは本候補では裁定しない。本ケースが確認するのは「指定した一覧・検索・ページング操作の前後で対象テーブルが不変」という観測できる事実のみであり、全経路（`LoginHistoryListener`のKernelEvents::REQUEST経由の書込を含む）の無書込は主張しない。期待を「登録される」側にも「read-onlyが正である」側にも捏造しない [L1:L1-M1104-022; fixture:SEED-M1104-LIST@TBD-D5]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-029	IT-12	画面表示データ	P2	通常表示・詳細検索表示のいずれもエラーが表示されず処理が継続する	ログイン済／SEED-M1104-LIST	—	1. GET一覧を開き画面全体にエラー表示が無いことを確認 2. 詳細検索を展開し同様にエラー表示が無いことを確認	通常の一覧表示・詳細検索の展開表示のいずれもエラーメッセージを伴わず正常に継続する [L1:L1-M1104-011,L1-M1104-026; fixture:SEED-M1104-LIST@TBD-D5]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-030	IT-12	エラー継続	P2	前回条件で再表示(resume=1)はセッション保存済みの検索条件・ページ番号で一覧を再表示する	ログイン済／SEED-M1104-SEARCH	user_name=`E2E-<runid>-alice`／page_no=2相当のセッション状態を作る	1. user_nameで検索しpage_no=1を保存 2. GET .../login_history/2 でpage_noを2へ更新保存 3. GET .../login_history?resume=1 で再訪 4. 表示された検索条件（フォーム値）とページ番号を読む	resume=1での再表示は、フォームにuser_name=`E2E-<runid>-alice`が復元され、ページは2ページ目のまま表示される（セッションのsearch＋search.page_noの両方を読み出す） [L1:L1-M1104-027,L1-M1104-006; fixture:SEED-M1104-SEARCH@TBD-D5]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104C-031	IT-02	公開コンテンツ	P1	表示要素一式（キーワード欄+tooltip/詳細検索リンク/欄群/検索ボタン/件数表示/表示件数プルダウン/一覧表/ページャ）が揃って表示される	ログイン済／SEED-M1104-LIST	—	1. GET一覧を開く 2. キーワード欄・ヘルプアイコン・詳細検索リンク・検索ボタン・検索結果件数・表示件数プルダウン・一覧テーブル・ページャの各要素の存在を確認	全要素（キーワード検索欄・詳細検索の開閉リンク・詳細検索内のログインID欄/IPアドレス欄/期間欄/ステータスのチェックボックス・検索ボタン・検索結果件数・表示件数プルダウン・履歴の一覧表・ページャ）が表示される [L1:L1-M1104-026; fixture:SEED-M1104-LIST@TBD-D5]				
```

### §4.2 補完行（13行=ja8＋-EN5。**親test_idなし・母集合会計に算入しない**。理由=設計書に規定はあるが
母集合87行の期待テキストに対応する親が存在しない実在項目）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104S-001	IT-15	権限	P1	未ログインで一覧URLへ直接アクセスするとログイン画面へ誘導される	未ログイン	—	1. GET /%eccube_admin_route%/setting/system/login_history	admin_login のログイン画面へ誘導され一覧は表示されない（補完行・親test_idなし・設計書md:280の到達前拒否規定） [L1:L1-M1104-001,L1-M1104-002]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104S-002	IT-22	境界	P2	multi/user_name/client_ip欄は255文字(上限)を受理し検索が成立する	ログイン済	multi=runFill(255,mixed,"E2E-<runid>-")	1. multi欄へ255字を入力し検索送信 2. 検証エラーが無いこと・検索が実行されることを確認	検証エラーは発生せず検索が実行される（255文字はLength上限内） [L1:L1-M1104-019]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104S-002-EN	IT-22	境界	P2	256文字超過の文言（en）	ログイン済／locale=en	multi=runFill(256,ascii,"E2E-<runid>-")	1. multi欄へ256字を入力し検索送信 2. エラー文言を読む	"This value is too long. It should have 255 characters or less." が表示される（補完行・親test_idなし） [L1:L1-M1104-019]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104S-003	IT-20	内部情報	P3	検索クエリは拡張ポイント(QueryKey::LOGIN_HISTORY_SEARCH_ADMIN)を経由する（非UI・ソース確認）	—	—	1. LoginHistoryRepository.php:112 の customize 呼び出しをソースで確認	`Queries::customize(QueryKey::LOGIN_HISTORY_SEARCH_ADMIN, $qb, $searchData)` が最終行で呼ばれ拡張差し替えが可能である（補完行・親test_idなし・非UI観測=ソース確認のみ） [L1:L1-M1104-018]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104S-004	IT-20	内部情報	P3	リポジトリはフォーム非公開の legacy create_date_start/end パラメータも処理する（非UI・実装詳細）	—	—	1. LoginHistoryRepository.php:85-98 をソースで確認（SearchLoginHistoryType.phpにcreate_date_start/endフィールドが存在しないことも確認）	`create_date_start`/`create_date_end`のクエリ分岐が存在するが検索フォームからは到達しない（`create_date_end`側は+1日調整あり=`create_datetime_end`側の非調整と異なる。フォームからは呼ばれないため画面挙動には影響しない）（補完行・親test_idなし） [L1:L1-M1104-015]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104S-005	IT-25	画面レイアウト	P3	画面タイトル・サブタイトルが表示される（ja）	ログイン済	—	1. GET一覧を開く 2. titleブロック・sub_titleブロックのテキストを読む	タイトル「ログイン履歴」・サブタイトル「システム情報設定」が表示される（補完行・親test_idなし） [L1:L1-M1104-003]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104S-005-EN	IT-25	画面レイアウト	P3	画面タイトル（en）	ログイン済／locale=en	—	同上	タイトル "Login History" が表示される（補完行・親test_idなし） [L1:L1-M1104-003]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104S-006	IT-25	画面レイアウト	P3	キーワード検索欄のツールチップ文言が表示される（ja）	ログイン済	—	1. GET一覧を開く 2. ヘルプアイコンへマウスオーバーしtitle属性を読む	「情報を入力して一覧の絞り込み検索ができます。より詳細な条件を指定するには［詳細検索］を開いてください。」（補完行・親test_idなし） [L1:L1-M1104-026]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104S-006-EN	IT-25	画面レイアウト	P3	ツールチップ文言（en）	ログイン済／locale=en	—	同上	"You can filter the list with keywords. For more search options, open [Advanced Search]." （補完行・親test_idなし） [L1:L1-M1104-026]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104S-007	IT-25	画面レイアウト	P3	一覧見出し列「ログインID」「IPアドレス」「ログイン試行日」「ステータス」が表示される（ja）	ログイン済	—	1. GET一覧を開く 2. thead th のテキストを読む	見出しに「ID」「ログインID」「IPアドレス」「ログイン試行日」「ステータス」が存在（補完行・親test_idなし） [L1:L1-M1104-024]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104S-007-EN	IT-25	画面レイアウト	P3	一覧見出し列（en）	ログイン済／locale=en	—	同上	見出しに "ID" "ID" "IP Address" "Login Attempt Date" "Status" が存在（補完行・親test_idなし） [L1:L1-M1104-024]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104S-008	IT-12	画面レイアウト	P3	検証失敗・0件時の共通メッセージのja文言は設計書と実カタログで逐語不一致（DOC-DRAFT-M1104-02の確認）	—	—	1. messages.ja.yaml:1734-1736 の値を照会 2. m11-04md:155-157のja列と突合	設計書ja文言（「検索条件が無効です。」等）と実カタログ値（「検索条件に誤りがあります」等）は意味同一だが逐語不一致。en側（messages.en.yaml:1763-1766とmd:155-157のen列）は完全一致（補完行・親test_idなし・DOC-DRAFT-M1104-02の実引き） [L1:L1-M1104-028]				
m11-04_admin_system_setting_setting_system_login_history	E2E-M1104S-008-EN	IT-12	画面レイアウト	P3	共通メッセージen列は設計書と実カタログで完全一致	—	—	同上	"Error found in the search condition(s)" / "Please change the search condition(s) and try again." / "Sorry, no data matches your search condition(s)" がいずれも設計書en列と完全一致（補完行・親test_idなし） [L1:L1-M1104-028]				
```

## §5 locale対応表

- LS=1 claim: **L1-004（ステータスマスタ名）・L1-009（表示件数プルダウン文言）・L1-020（期間下限メッセージ）・
  L1-021（バッジ文言）・L1-023（0件メッセージ）・L1-024（列見出し・データ表示）・L1-028（検証失敗メッセージ・
  DOC-DRAFT-M1104-02）** の7claim → -EN 14行（bound9＋補完5）。
- bound従属: C-003-EN（L1-024）／C-007-EN（L1-009）／C-009-EN（L1-026）／C-011-EN（L1-021）／
  C-012-EN（L1-021）／C-015-EN（L1-023）／C-019-EN（L1-020）／C-023-EN（L1-024）／C-024-EN（L1-028）。
- 補完従属: S-002-EN（L1-019）／S-005-EN（L1-003）／S-006-EN（L1-026）／S-007-EN（L1-024）／S-008-EN（L1-028）。
- 全行§4に実体掲載（自己完結）。文言はen一次資料逐語（ja翻訳ゼロ）。
- L1-019（Length超過メッセージ）はW0/m05-13/m10-12と同一vendor（symfony/validator）のchoice複数側を再利用
  （limit=255）想定・実装waveで確定（choice原文照合は未実施のためS-002-ENの文言はvalidators.*.xlfの
  trans-unit id=19系を実装時に再確認する注記付き）。
- -EN実行前提はD15（M0 Go/No-Go。管理画面のen切替口なし＝W0実測を継承）。

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

### §6.1 db.ts無書込確認（決定的差分照会。C-018/C-025/C-028で使用）

期待の正は「**指定した一覧・検索・ページング操作（Controller経由）の前後**でdtb_login_history/
mtb_login_history_statusが不変」という**観測できる挙動そのもの**（m02-02のC-036・§6.3cと同型の手法）。
SUM/MAX等の要約値では相殺更新・過去行更新を検知できないため、主キー順・全列の決定的ダイジェストで判定する。
**本節はKernelEvents::REQUESTを購読する`LoginHistoryListener`等の全経路・全テーブルの無書込を主張するもの
ではなく、DOC-DRAFT-M1104-01（未解決）の裁定にも用いない（§0参照）**:

```sql
-- (1) 行数
SELECT COUNT(*) FROM dtb_login_history;
-- (2) dtb_login_history 全列ダイジェスト（主キー順・全列）
SELECT md5(COALESCE(string_agg(lh::text, ',' ORDER BY lh.id), '')) FROM dtb_login_history lh;
-- (3) マスタ不変性: mtb_login_history_status（LoginHistoryStatus.php:23 Table(name:'mtb_login_history_status')）
SELECT md5(COALESCE(string_agg(s::text, ',' ORDER BY s.id), '')) FROM mtb_login_history_status s;
```

「マスタ」の観測範囲は本機能が参照する`mtb_login_history_status`（設計の語「記録」〔md:211等〕の最小実体）。
`LoginHistoryController.php`全文のgrep（persist/flush/INSERT/UPDATE 0件=L1-022）が担保するのは**Controller
経由の観測範囲での無書込**のみであり、全テーブル全表のダイジェスト照会や全経路（`LoginHistoryListener`の
`KernelEvents::REQUEST`経由を含む）の無書込までは主張しない（**codex R1是正**）。

### §6.2 検索フィールド突合（C-005/C-011〜C-017/C-020/C-023等で使用）

期待の正はL1-012〜017の検索/並び替え規則をdb.tsで独立評価した集合（LIKE/範囲/IN条件をSQLで再現し、
UI一覧表示行のid集合と突合）。SEED固定値は入力の再現手段であり期待値の正にしない。

```sql
-- multi相当（スペース除去後の部分一致・OR）
SELECT id FROM dtb_login_history
WHERE (user_name LIKE '%' || :clean || '%' OR client_ip LIKE '%' || :clean || '%')
ORDER BY create_date DESC, id DESC;
```

### §6.3 実装方針（候補=未実装・実走なし）

- page/spec: 本機能専用のpage/specは本セッションの調査範囲では未確認（既存`e2e/pages/admin/m11/`・
  `e2e/spec/admin/m11/`配下の実在有無は実装waveでfind実行して再確認する。誤って「0件」と断定しない
  よう、実装フェーズの着手時にまずfindで確認する規律とする＝m10-12のcodex R1 Major教訓を継承）。
- db.ts: 既存の汎用関数（`queryScalar`/`queryNumber`/`queryRows`/`sqlLiteral`）を`dtb_login_history`向けの
  生SQLで直接使う（`dtb_news`専用ラッパーと同様の専用ラッパー追加は実装フェーズの作業であり、本候補段階
  では正式ファイル`e2e/helpers/db.ts`への追記を行わない＝正式パス書込禁止の遵守）。
- 境界値は`runFill(n, repertoire, prefix)`（決定的生成、既存ヘルパの型を踏襲）。
- SEED投入・後始末はdb.ts直接INSERT/DELETE（本機能を経由しない）。本機能自体はCRUD操作を持たないため
  m10-12型のUPSERT復元・re-INSERT復元は不要（§2参照）。

### §6.4 _drafts/隔離lintの実施証跡（実測・実施済み）

1. 正式消費側（`e2e/helpers/oracle.ts`・`e2e/helpers/db.ts`・spec・pages）に本草案を消費する`_drafts`参照は
   **0件**（隔離ガード自体のリテラルは機械強制であり消費参照ではない）。
2. 正式パス`e2e/fixtures/oracle/`直下に本機能のjsonは**作成していない**（草案は`_drafts/`のみ）。
3. `e2e/helpers/db.ts`への追記・変更は**行っていない**（本セッションでの編集対象は`_drafts/`配下の2ファイル
   のみ。既存spec/pages/oracle正式ファイルは未変更）。
4. 本md・oracle草案jsonの出力先はともに`_drafts/`配下のみ。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

| ケース群 | 実行区分（候補） | 観測層 | 備考 |
|---|---|---|---|
| C-001,002,003(+EN),011(+EN),012(+EN),020,023(+EN),027,029,031 | Playwright+db.ts | GUI+DB | 表示・列突合 |
| C-004,013,014 | Playwright+db.ts | GUI+DB | 並び順・Status絞込 |
| C-005,006,030 | Playwright+db.ts | GUI+DB | 検索実行・ページ送り・resume |
| C-007(+EN),016,026 | Playwright | GUI | page_count採用/不採用 |
| C-008 | Playwright | GUI/JS | pulldown change |
| C-009(+EN),019(+EN),024(+EN) | Playwright | GUI | collapse・validation失敗 |
| C-015(+EN) | Playwright | GUI | 0件メッセージ |
| C-017 | Playwright+db.ts | GUI+DB | member_id NULL行の表示継続 |
| C-018,025,028 | Playwright+db.ts | GUI+DB | 無書込確認（§6.1決定的差分照会） |
| C-021,022 | Playwright | GUI/HTTP | 件数整合性・入力契約 |
| 補完S-001 | Playwright | HTTP | 認証（親test_idなし） |
| 補完S-002(+EN) | Playwright | GUI | 境界値（親test_idなし） |
| 補完S-003,004 | ソース確認（非UI） | — | 実装詳細（親test_idなし） |
| 補完S-005(+EN),006(+EN),007(+EN),008(+EN) | Playwright | GUI | 文言確認（親test_idなし） |

聖域判定・多軸属性の正式付与はD14 v2合格後（本表は暫定・正式会計に使わない）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（§0判定原則。前提/入力列のシナリオ語・観点ラベルはノイズ）。
1候補ケース行=1 assertion bundle・多対一は`shared-observation`・-EN行は対応ja行と同一親のlocale多重。
**参照先の全候補行は§4に実体掲載済み＝87↔候補の期待テキスト突合が本文内で完結する**。

### 集計（87 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **56** | 下表。うちDOC-DRAFT実引き行bind=2（039,079→C-028。観測範囲限定・未解決のまま裁定しない）・母集合018-035（検索条件14＋実行結果検索時4）は
  検索が実在するためbound（m10-12の検索非実在excluded先例とは逆の裁定＝§0参照） |
| **TBD** | **2** | 031,071（失敗履歴の書き込み失敗＝別機能=認証機能側のDB例外注入が必要で観測契約が定義不能。L1-M1104-029） |
| **excluded** | **29** | EX-A 必須/相関バリデーション不存在6（008,012,013,014,015,016）＋
  EX-B 登録・更新・削除UI操作が存在しないCRUDテンプレ23（036-068のうち23行・下表） |
| 合計 | **87** | 欠落0・理由なし重複0 |

- 候補ケース行総数**53**（§4.1 bound対応40＝ja31＋-EN9／§4.2 補完13＝ja8＋-EN5）。
- **検索が実在する機能である点（本機能固有の統治）**: `LoginHistoryRepository::getQueryBuilderBySearchDataForAdmin`
  （45-113行逐語）が`multi`/`user_name`/`client_ip`/`create_datetime_start`/`create_datetime_end`/`Status`の
  6条件を実装済みであるため、m10-12の「検索スケルトンが実在しない画面→excluded」先例をそのまま適用すると
  偽陰性になる。母集合018-035（18行）はboundとする。

### EX-A 必須/相関バリデーション不存在6件の実引き表

| test_id | 期待結果（逐語） | 除外根拠（一次資料実引き） |
|---|---|---|
| 008 | 必須バリデーションでエラーが表示され、対象処理が完了しないこと。 | `SearchLoginHistoryType.php`の全6フィールドが`'required' => false`（43-69,70-103行実測）。NotBlank等の必須制約0件（grep実測）。必須バリデーション自体が実装上存在しない |
| 012 | 相関バリデーションでエラーが表示されず、対象処理を継続できること。 | `SearchLoginHistoryType.php`（115行全文）にPOST_SUBMIT等の相関チェックイベントが0件（grep実測）。相関バリデーション自体が実装上存在しない |
| 013 | 相関バリデーションでエラーが表示されず、対象処理を継続できること。 | 同上 |
| 014 | 相関バリデーションでエラーが表示され、対象処理が完了しないこと。 | 同上 |
| 015 | DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。 | 同上（DBに問い合わせて一意性等をチェックする処理も0件） |
| 016 | DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。 | 同上 |

### EX-B 登録・更新・削除UI操作不存在23件の実引き表

全23行の期待結果は生成器の定型文（「登録内容／更新内容／削除条件の対象レコードが追加・変更・削除状態に
なる（ならない）こと」）であり、`login_history.twig`（207行全文）に検索フォーム以外の新規登録・編集・削除
UI要素（`<form>`の追加、入力欄以外のsubmit、削除リンク等）が0件（grep実測）のため、いずれも本機能に
対応する実操作が存在しない。

| test_id | 期待結果（逐語・要約） | 除外根拠 |
|---|---|---|
| 036 | 登録内容の対象レコードが追加されること。 | 登録UI操作が本機能に存在しない（twigに新規/編集/削除フォーム0件） |
| 037 | 登録内容の対象レコードが追加されないこと。 | 同上 |
| 038 | 登録内容の対象レコードが追加されること。（mtb_login_history_status文脈） | 同上 |
| 040 | 登録内容の対象レコードが追加されること。 | 同上 |
| 041 | 登録内容の対象レコードが追加されること。（最大長） | 同上 |
| 042 | 登録内容の対象レコードが追加されないこと。（最大長+1） | 同上 |
| 043 | 登録内容の対象レコードが追加されること。（最小長） | 同上 |
| 044 | 登録内容の対象レコードが追加されないこと。（最小長-1） | 同上 |
| 045 | 登録内容の対象レコードが追加されること。 | 同上 |
| 046 | 実行結果の対象レコードが追加されること。（登録時） | 同上 |
| 048 | 更新内容の対象レコードの値が変更されること。 | 更新UI操作が本機能に存在しない（一覧に編集リンク・編集フォーム0件） |
| 049 | 更新内容の対象レコードの値が変更されないこと。 | 同上 |
| 050 | 更新内容の対象レコードの値が変更されること。 | 同上 |
| 052 | 更新内容の対象レコードの値が変更されること。 | 同上 |
| 053 | 更新内容の対象レコードの値が変更されること。（最大長） | 同上 |
| 054 | 更新内容の対象レコードの値が変更されないこと。（最大長+1） | 同上 |
| 055 | 更新内容の対象レコードの値が変更されること。（最小長） | 同上 |
| 056 | 更新内容の対象レコードの値が変更されないこと。（最小長-1） | 同上 |
| 057 | 更新内容の対象レコードの値が変更されること。 | 同上 |
| 058 | 実行結果の対象レコードの値が変更されること。（更新時） | 同上 |
| 064 | 削除条件の対象レコードが削除状態にならないこと。 | 削除UI操作が本機能に存在しない（一覧に削除リンク・削除確認モーダル0件） |
| 065 | 実行結果の対象レコードが削除状態になること。（削除時） | 同上 |
| 067 | 実行結果の対象レコードが削除状態になること。（削除時） | 同上 |

（境界判定の確認）**m02-02のDOC-DRAFT-m02-02-1教訓を本機能でも適用検証済み**: 036-068の33行のうち10行
（039,047,051,059,060,061,062,063,066,068）は生成器の定型文ではなく設計書の実文言をそのまま再掲していた
ため過剰除外せずboundとした。残り23行は真正のCRUD定型ノイズであり除外に偽陰性は無い。

### 87対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 管理画面ログインの各試行を1行として記録した履歴であること（ログイン履歴の定義） | bound | C-001 |
| 002 | 履歴行の作成日時であること（ログイン試行日時の定義） | bound | C-002 |
| 003 | ログインID単独・IPアドレス単独・期間・成功失敗区分による絞り込み（詳細検索の定義） | bound | C-003(+EN) |
| 004 | セッションに保存済みの検索条件があればその条件で、なければ全件を作成日時降順で1ページ目に表示 | bound | C-004 |
| 005 | 入力した検索条件で絞り込み、1ページ目を表示 | bound | C-005 |
| 006 | 保存済みの検索条件のまま指定ページを表示 | bound | C-006 |
| 007 | 表示件数プルダウンの選択でURLへ遷移し、件数をセッションへ保存して1ページ目を表示 | bound | C-007(+EN) |
| 008 | 必須バリデーションでエラーが表示され完了しない | **excluded** EX-A | — |
| 009 | 必須バリデーションでエラーが表示されず継続できる | bound | C-010（全項目任意・全空検索の継続） |
| 010 | 表示件数プルダウン変更でwindow.location.hrefへ遷移 | bound | C-008 |
| 011 | 詳細検索ブロックはBootstrapのcollapseで折りたたみ、初期は閉じる | bound | C-009(+EN) |
| 012 | 相関バリデーションでエラーが表示されず継続できる | **excluded** EX-A | — |
| 013 | 相関バリデーションでエラーが表示されず継続できる | **excluded** EX-A | — |
| 014 | 相関バリデーションでエラーが表示され完了しない | **excluded** EX-A | — |
| 015 | DBとの相関バリデーションでエラーが表示されず継続できる | **excluded** EX-A | — |
| 016 | DBとの相関バリデーションでエラーが表示され完了しない | **excluded** EX-A | — |
| 017 | 行の区分が成功のとき（成功区分バッジ） | bound | C-011(+EN) |
| 018 | 検索条件の該当レコードが取得結果に含まれること（前提=失敗区分バッジ） | bound(読替) | C-012（失敗区分バッジ） |
| 019 | 検索条件の該当レコードが取得結果に含まれないこと（前提=期間の値が範囲外のとき） | bound(読替) | C-019(+EN)（期間下限バリデーション） |
| 020 | 検索条件の該当レコードが取得結果に含まれること（前提=表示対象） | bound(読替) | C-013（表示対象＝一致行） |
| 021 | 検索条件の該当レコードが取得結果に含まれないこと（前提=成功失敗区分の意味） | bound(読替) | C-013（区分の意味・shared） |
| 022 | 検索条件の該当レコードが取得結果に含まれること（前提=表示件数） | bound(読替) | C-007（マスタ値のみ採用・shared） |
| 023 | 検索条件の該当レコードが取得結果に含まれないこと（前提=業務計算） | bound(読替) | C-026（業務計算を行わない） |
| 024 | 検索条件の該当レコードが取得結果に含まれること（前提=検索条件をすべて空で検索） | bound(読替) | C-010（全件表示・shared） |
| 025 | 検索条件の該当レコードが取得結果に含まれないこと（前提=ステータスを未チェック） | bound(読替) | C-014（未チェック=絞込なし） |
| 026 | 検索条件の該当レコードが取得結果に含まれること（前提=検索結果が0件） | bound(読替) | C-015(+EN)（0件メッセージ） |
| 027 | 検索条件の該当レコードが取得結果に含まれないこと（前提=表示件数に不正値を渡す） | bound(読替) | C-016（不正page_count不採用） |
| 028 | 検索条件の該当レコードが取得結果に含まれること（前提=管理者削除済みの履歴行） | bound(読替) | C-017（member_id NULL行の表示継続） |
| 029 | 検索条件の該当レコードが取得結果に含まれないこと（前提=参照時点） | bound(読替) | C-004（要求時点の読取・shared） |
| 030 | 検索条件の該当レコードが取得結果に含まれること（前提=記録との整合性） | bound(読替) | C-018（無書込確認・shared） |
| 031 | 検索条件の該当レコードが取得結果に含まれないこと（前提=失敗履歴の保存失敗） | **TBD** | L1-M1104-029（観測契約未定義） |
| 032 | 実行結果の対象レコードが取得結果に含まれること（前提=表示列との整合性） | bound(読替) | C-020（表示列の透過性） |
| 033 | 実行結果の対象レコードが取得結果に含まれること（前提=件数との整合性） | bound(読替) | C-021（件数の整合性） |
| 034 | 実行結果の対象レコードが取得結果に含まれること（前提=入力） | bound(読替) | C-022（入力契約） |
| 035 | 実行結果の対象レコードが取得結果に含まれること（前提=成功時出力） | bound(読替) | C-023(+EN)（成功時出力＝表示列・shared） |
| 036 | 登録内容の対象レコードが追加されること | **excluded** EX-B | — |
| 037 | 登録内容の対象レコードが追加されないこと | **excluded** EX-B | — |
| 038 | 登録内容の対象レコードが追加されること（mtb_login_history_status文脈） | **excluded** EX-B | — |
| 039 | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）であること | bound | C-028（**DOC-DRAFT-M1104-01実引き行・未解決**） |
| 040 | 登録内容の対象レコードが追加されること | **excluded** EX-B | — |
| 041 | 登録内容の対象レコードが追加されること（最大長） | **excluded** EX-B | — |
| 042 | 登録内容の対象レコードが追加されないこと（最大長+1） | **excluded** EX-B | — |
| 043 | 登録内容の対象レコードが追加されること（最小長） | **excluded** EX-B | — |
| 044 | 登録内容の対象レコードが追加されないこと（最小長-1） | **excluded** EX-B | — |
| 045 | 登録内容の対象レコードが追加されること | **excluded** EX-B | — |
| 046 | 実行結果の対象レコードが追加されること（登録時） | **excluded** EX-B | — |
| 047 | 表示件数プルダウンの選択でURLへ遷移し、件数をセッションへ保存して1ページ目を表示（047重複） | bound | C-007（shared） |
| 048 | 更新内容の対象レコードの値が変更されること | **excluded** EX-B | — |
| 049 | 更新内容の対象レコードの値が変更されないこと | **excluded** EX-B | — |
| 050 | 更新内容の対象レコードの値が変更されること | **excluded** EX-B | — |
| 051 | 詳細検索ブロックはBootstrapのcollapseで折りたたみ、初期は閉じる（051重複） | bound | C-009（shared） |
| 052 | 更新内容の対象レコードの値が変更されること | **excluded** EX-B | — |
| 053 | 更新内容の対象レコードの値が変更されること（最大長） | **excluded** EX-B | — |
| 054 | 更新内容の対象レコードの値が変更されないこと（最大長+1） | **excluded** EX-B | — |
| 055 | 更新内容の対象レコードの値が変更されること（最小長） | **excluded** EX-B | — |
| 056 | 更新内容の対象レコードの値が変更されないこと（最小長-1） | **excluded** EX-B | — |
| 057 | 更新内容の対象レコードの値が変更されること | **excluded** EX-B | — |
| 058 | 実行結果の対象レコードの値が変更されること（更新時） | **excluded** EX-B | — |
| 059 | 期間欄に範囲下限の検証があること | bound | C-019（shared） |
| 060 | ログイン履歴のうち検索条件に一致する行を表示すること（表示対象） | bound | C-013（shared） |
| 061 | 区分の保存値は失敗が0、成功が1であること | bound | C-013（shared） |
| 062 | 表示件数マスタの値のみ採用すること | bound | C-007（shared） |
| 063 | 本機能では金額・在庫などの業務計算を行わないこと | bound | C-026（shared） |
| 064 | 削除条件の対象レコードが削除状態にならないこと | **excluded** EX-B | — |
| 065 | 実行結果の対象レコードが削除状態になること（削除時） | **excluded** EX-B | — |
| 066 | 一覧表を出さず、0件メッセージを表示すること | bound | C-015（shared） |
| 067 | 実行結果の対象レコードが削除状態になること（削除時） | **excluded** EX-B | — |
| 068 | 履歴行のログインID・IPアドレス・区分は保持されるため一覧に表示すること | bound | C-017（shared） |
| 069 | 一覧は表示要求時点でdtb_login_historyから読み取った行であること | bound | C-004（shared） |
| 070 | 表示する履歴は認証処理側が記録した行であり、本機能は更新しないこと | bound | C-018（shared） |
| 071 | 失敗履歴の書き込みに失敗した場合は履歴行が作られず、認証機能側でサーバログに記録されること | **TBD** | L1-M1104-029 |
| 072 | 一覧の各列は履歴行の保存値をそのまま表示すること | bound | C-020（shared） |
| 073 | 検索結果件数はページネーション部品が数えた総件数であり、表示中ページの行数とは別であること | bound | C-021（shared） |
| 074 | 一覧表示要求、検索条件のPOST、ページ番号・表示件数を含むGETであること | bound | C-022（shared） |
| 075 | 検索条件に一致する履歴行を、ID・ログインID・IPアドレス・ログイン試行日時・成功失敗区分の列でページ表示すること | bound | C-023(+EN)（主判定） |
| 076 | 検索条件の検証失敗時は一覧を出さず、詳細検索を開いた状態で見直しメッセージを表示すること | bound | C-024(+EN) |
| 077 | 検索条件・ページ番号・表示件数のセッション保存のみであること | bound | C-025 |
| 078 | 区分名であること（mtb_login_history_status.name） | bound | C-027 |
| 079 | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）であること（039重複） | bound | C-028（shared・DOC-DRAFT） |
| 080 | 任意であること（ログインID・IPアドレス欄） | bound | C-010（shared） |
| 081 | 画面表示データでエラーが表示されず継続できること | bound | C-029 |
| 082 | 履歴行の作成日時であること（002重複） | bound | C-002（shared） |
| 083 | 画面表示データでエラーが表示されず継続できること（081重複） | bound | C-029（shared） |
| 084 | セッションに保存済みの検索条件があればその条件で、なければ全件を作成日時降順で1ページ目に表示（004重複） | bound | C-004（shared） |
| 085 | 入力した検索条件で絞り込み、1ページ目を表示（005重複） | bound | C-005（shared） |
| 086 | セッションに保存済みの検索条件・ページ番号で一覧を再表示すること | bound | C-030 |
| 087 | キーワード検索欄、詳細検索の開閉リンク、詳細検索内の各欄、検索ボタン、検索結果件数、表示件数プルダウン、履歴の一覧表、ページャを表示すること | bound | C-031 |

`func_scope_check` 判定: 親87/87会計済み・欠落0・理由なし重複0・補完13行は§4.2に実体掲載
（親空・設計書補完・母集合会計外）→ **差分0を本文内で実証可能**（56 bound + 2 TBD + 29 excluded = 87）。
O6は主張しない。

## §9 TBD・要実機・DOC-DRAFT・excluded（正直な分離）

| # | 事項 | 状態 |
|---|---|---|
| 1 | **DOC-DRAFT-M1104-01（未解決・断定しない＝codex R1是正）**: 設計書DB操作節（md:255-257）の「登録/更新」記述 | 確認できる事実は3点のみ: ①同一設計書5箇所（md:7,211,231,284,364）が参照専用を明記し、DB操作節（md:257）と矛盾する（**設計内矛盾**）②`LoginHistoryController.php`全文（120行）にpersist/flush/INSERT/UPDATE/removeが0件（grep実測）③別クラス`LoginHistoryListener`が`KernelEvents::REQUEST`（全リクエストで発火しうる）で`onPostLogin`（54-90行）のpersist/flush、`LoginFailureEvent`で`onAuthenticationFailure`（94-142行）の生SQL INSERTという**実装上の書込経路が別途実在する**（本コントローラの`index()`からは呼ばれないが、同一リクエストのカーネルレベルで発火しうる）。**この3点は設計内矛盾と書込経路の存在を示すのみであり、「テンプレノイズ」「read-onlyが正」「実装是正不要」は導けない（断定しない）**。母集合039/079はboundするが、期待は「Controller経由の一覧・検索・ページング操作の前後で対象テーブルが不変」という観測できる挙動のみに限定し、全経路・全テーブルの無書込・設計書側の正誤は主張しない（C-028で観測範囲を明記して実証） |
| 2 | **DOC-DRAFT-M1104-02**: 検証失敗・0件時のja共通メッセージが設計書と実カタログで逐語不一致 | md:155-157のja文言（「検索条件が無効です。」「検索条件を変えてお試しください。」「検索結果がありませんでした。」）とmessages.ja.yaml:1734-1736の実値（「検索条件に誤りがあります」「検索条件を変えて、再度検索をお試しください」「検索条件に合致するデータが見つかりませんでした」）は意味同一だが逐語不一致。en側は完全一致（messages.en.yaml:1763-1766）。**裁定: オラクルの正はソース実値。設計書ja文言は要約パラフレーズであり実装是正は不要** |
| 3 | 失敗履歴の書き込み失敗（031,071） | md:212「失敗履歴の書き込みに失敗した場合は履歴行が作られず…」は実claimだが、書き込み失敗の誘発は本機能の外（認証機能側のDB例外）に依存し、**本候補では観測契約を定義できていない**（安全な誘発手段の有無自体は断定しない＝codex R1是正）。**TBD（L1-M1104-029）** |
| 4 | `eccube_default_page_count`の実効既定値 | eccube.yaml:142の設定値は10だが、既存PHPUnit`LoginHistoryControllerTest.php:96-98`は素のPOST直後の既定選択値として「50件」を観測しており数値が食い違う。本書のC-007/016/026は具体的な既定数値に依存しない判定（マスタ一致可否・不変性）で設計しており、この食い違いは主判定に影響しないが**要実機**で解消する |
| 5 | 本機能専用のe2e page/spec実在有無 | 本セッションの調査範囲では`e2e/pages/admin/m11/`・`e2e/spec/admin/m11/`のfind実行による確認を行っていない。m10-12のcodex R1教訓（「0件」誤記＝Major指摘）を踏まえ、実装waேvで着手前に必ずfind実行して実在を確認する（§6.3に明記） |
| excluded EX-A | 008,012-016（必須/相関バリデーション不存在6件） | `SearchLoginHistoryType.php`全6フィールドが`required=>false`・POST_SUBMIT等の相関チェック0件（grep実測）。実装上存在しない検証を期待にしない |
| excluded EX-B | 036-068のうち23件（登録・更新・削除UI操作不存在） | `login_history.twig`全文に検索フォーム以外の新規/編集/削除UI要素が0件（grep実測）。実装上存在しない操作を期待にしない |

候補規律: 全行 `@TBD-D5`・O5未確定（D6後に確定検査）・実装/実走なし・O6/聖域/多軸/C6C7を主張しない。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象構文の列挙とclaim別判定（本機能は前提列に設計書の項目名〔エッジケース・データ整合性・入出力の各節見出し〕
が実際の期待内容と無関係に循環転記されているため、極性衝突・観点/期待の取り違えが多い）:

| 対象 | 極性判定 | 判定根拠（一次資料） |
|---|---|---|
| 008（必須エラーあり）/009（必須エラーなし） | 008はexcluded（必須制約が実装上存在しない）。009は「全項目任意で全空検索が成立する」極性肯定としてC-010へbind | SearchLoginHistoryType.php:43-103（全`required=>false`） |
| 012〜016（相関/DB相関バリの両極） | 本機能に相関バリデーション（フィールド間・DB一意性チェック）が実在しないためexcludedにする（m10-12は相関バリが実在したためbound。機能ごとの実引きの結果、本機能はm02-02/m05-13型） | SearchLoginHistoryType.php全文（POST_SUBMIT等0件） |
| 018〜035（検索条件・実行結果検索時の両極。前提列=設計書のエッジケース/データ整合性/入出力節の項目名循環転記） | 本機能は検索が実在するため、生成器の定型文（「検索条件の該当レコードが取得結果に含まれる（ない）こと」）を字義通りには使わず、**前提列の実在する設計項目名**を手がかりに実内容へ読み替えてbindする（前提列は他機能では観点ノイズだが、本機能では設計書の実項目名を正しく順送りしているため読替の足がかりとして採用可＝m10-12の037/046/058と同型の読替） | 前提列の各値が m11-04md のエッジケース表（191-202行）・データ整合性表（206-214行）・入出力表（224-231行）の見出し語と1対1で対応することを全18行で確認済み |
| 031/071（失敗履歴の保存失敗の両出現） | 実在仕様だが、書き込み失敗の誘発は本機能の外（認証機能側のDB例外）に依存し、**本候補では観測契約を定義できていない**（誘発手段の有無自体は断定しない＝codex R1是正・§10でも統一）ため両方TBD。excludedにはしない（実在仕様の除外禁止） | m11-04md:212／LoginHistoryListener.php:107-142（例外はcatchしlog_error） |
| 036〜068の「追加/変更される・されない」「削除状態になる・ならない」 | 33行のうち10行（039,047,051,059,060,061,062,063,066,068）は生成器定型文でなく設計書の実文言をそのまま再掲しておりbind。残り23行は真正のCRUD定型ノイズで、本機能に登録・更新・削除のUI操作が一切存在しない（twig全文にform/編集/削除リンク0件）ためexcluded | login_history.twig（207行全文・検索フォーム以外のform要素0件=grep実測） |
| 039/079（DB操作節の登録/更新記述の重複出現） | 生成器定型文ではなく設計書md:257の実文言の逐語転記。DOC-DRAFT-M1104-01（未解決）としてbindするが、期待は「Controller経由の一覧・検索・ページング操作の前後で対象テーブルが不変」という観測できる挙動のみに限定し、設計書側の記述の正誤・是正要否は裁定しない（実装挙動を無条件の正にせず、設計書側も誤記と断定しない＝両論併記のまま） | m11-04md:257 vs LoginHistoryController.php全文（persist/flush等0件） vs LoginHistoryListener.php（KernelEvents::REQUEST経由の別実装経路が実在） |
| 060（前提=表示対象→期待=検索条件の該当レコードが含まれる） | 前提語は「削除条件」ラベルの並びに現れるが、期待内容は md:171「表示対象」の実文言。ラベルを無視し実内容でC-013へbind（過剰除外・誤bind回避） | m11-04md:171 |
| 064/065/067（削除状態になる・ならない） | 「削除条件」ラベル自体は他の実内容行（060-063,066,068）と混在するが、064/065/067は生成器の定型「削除状態」ボイラープレートであり本機能に削除UI操作が無いため実内容が伴わない。ラベルの並びだけで安易にbindしない | login_history.twig全文（削除リンク0件） |

**codex敵対レビュー実施状況: 未実施（初稿）**。本書はcodexレビュー投入前の状態であり、
「妥当（候補確定）」は主張しない。レビュー結果は`REVIEW_LEDGER.md`と本ヘッダに追記予定。

---

## 付録: 作業実測（B0係数計測用）

- 読んだ一次資料・参照物: 設計書md 1（364行全文）／ee実ソース 8（LoginHistoryController・
  SearchLoginHistoryType・LoginHistoryRepository・LoginHistory・LoginHistoryStatus・
  LoginHistoryStatusRepository・LoginHistoryStatusType・LoginHistoryListener）＋login_history.twig（207行全文）／
  locale 4（messages.ja/en.yaml抜粋・validators.ja/en.yaml抜粋）＋CSV 2（mtb_login_history_status ja/en）＋
  eccube.yaml／security.yaml／EccubeExtension.php／QueryKey.php／既存PHPUnitテスト4
  （LoginHistoryRepositoryGetQueryBuilderBySearchDataAdminTest・LoginHistoryControllerTest・
  SearchLoginHistoryTypeTest・LoginHistoryListenerTest抜粋）／母集合・台帳3（all_it_cases・fid_kubun・
  REVIEW_LEDGER）／統治2（CRP・CFP）／同型見本2（m02-02・m10-12草案）／既存実装1（db.ts）＝**計28ファイル**。
- L1 claim数: **27確定＋1 DOC-DRAFT-M1104-02（L1-028として独立計上）＋1 TBD（L1-029）＋DOC-DRAFT-M1104-01は
  L1-022に統合**（=29行）。うちL1-001は補完専用（母集合に直接bindなし）。候補ケース行53
  （bound31＋EN9＋補完8＋EN5）。file:line claim引用 約60箇所。
- 難所（係数悪化要因）: (1) 母集合018-035（18行）の前提列が生成器ノイズではなく設計書の実項目名を順送り
  しており、期待列側だけが定型ボイラープレートという特殊な非対称パターンの識別（m10-12/m02-02とも異なる
  第三のパターン）。(2) 036-068（33行）のうち10行が同じCRUD-ラベル文脈に埋もれつつ実文言を再掲していた
  ため、ラベルだけで一括excludedにすると偽陰性になるところを全行の期待テキストを逐語で読んで峻別した。
  (3) DOC-DRAFT-M1104-01（DB操作節）とDOC-DRAFT-M1104-02（メッセージ文言パラフレーズ）という**2種類の
  設計書側の不整合**を発見・分離記録した（前者はm02-02のDOC-DRAFT-m02-02-1と構造は類似〔参照専用宣言複数
  vs DB操作節1箇所〕だが、m11-04では`LoginHistoryListener`という実際の書込経路が別途実在するためm02-02の
  ような「テンプレノイズ・read-only正」の裁定はせず**未解決のまま残置**＝codex R1是正。後者は本機能固有の
  新パターン）。(4) 031/071の
  「失敗履歴の保存失敗」が実在仕様でありながら観測契約を安全に組めないことを確認しTBDへ分離した。
  (5) 相関バリデーションの有無をm10-12（実在）と混同しないよう`SearchLoginHistoryType.php`を実測して
  本機能では非実在と確認した。
- 楽だった点（再利用効果）: L1表・三段参照・§構成・隔離lint・func_scope_check様式はm02-02/m10-12の型を
  そのまま流用。既存PHPUnitテスト（Repository/Controller/FormType）が検索条件・並び順・page_count挙動の
  傍証として極めて有効で、追加のソース推測なしにL1-009,015,016の具体値を裏付けられた。

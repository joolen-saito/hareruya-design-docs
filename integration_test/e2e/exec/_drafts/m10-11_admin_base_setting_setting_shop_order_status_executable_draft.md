# W1候補: m10-11 受注対応状況設定 — 実行可能グレード候補（母集合81全量踏破）

> 2026-07-23 ／ **候補グレード（candidate・D6前）**／ W1バッチ1号（工数係数実測用）。
> **改訂1: codexレビュー是正（Major4＋引用補足2・Blockerなし）**＝
> (1) C-003の同一sort_no内順序の過大主張を撤回（実装はORDER BY sort_noのみ＝タイブレーク未契約）
> (2) 母集合002をC-034＋C-061A/Bへbind（C-061を補完からbound対応へ移動・観測を二分）
> (3) C-061を表示有無（GUI・要実機）とクエリ非実行（非UI・ログ観測）に分離
> (4) C-030のリダイレクト先を管理ルート接頭辞込み/route名で拘束
> (5) Length単位=コードポイントの逐語根拠（Length.php:59/LengthValidator.php:53-57）
> (6) en複数形決定根拠 `setPlural($constraint->max)`（LengthValidator.php:74,85）を追加。
> excluded=32（EX-A18/EX-B4/EX-C2/EX-D7/EX-E1）はcodex妥当確認済み＝維持。
> O5未確定・source_class=standard-src+design は fid_kubun.tsv（D1）による**暫定付与**（確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> 実装・実走なし。fixture_version は全て `@TBD-D5`。
> 統治: `integration_test/CONCRETIZATION_FIRST_PLAN.md`（改訂2・三段会計）。
> 正典（型）: `integration_test/e2e/PILOT_m09_01_news_executable_grade.md`＋
> W0承認済み見本 `integration_test/e2e/exec/_drafts/m09-01_admin_content_content_news_executable_draft.md`（同型）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m10-11_admin_base_setting_setting_shop_order_status_oracle_draft.json`。
> **正式パス `e2e/fixtures/oracle/` 直下には書かない**。
> **行数集計（改訂1）**: 候補ケース行総数**42**＝bound対応29＋補完7＋-EN 6（bound親従属4＋補完従属2）。
> 母集合81全数会計＝bound49／TBD 0／excluded 32（§8）。

## §0 版固定

- 設計書 `functions/ec-cube-enterprise/m10-11_admin_base_setting_setting_shop_order_status.md`
  （最終コミット8e4e5de・リポジトリHEAD 754a591。以下「md:行」）。
- ee `/home/y-saito/Developments/ec-cube-enterprise` コミット `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51`。
  symfony/validator **v7.4.3**（composer.lock実測）。
- fid_kubun.tsv（D1・SHA 44fbf02f1e4c…）: `M10-11｜対象｜標準｜standard-src+design｜区分不明=0`
  （target_sha256=4a255392…・todo_sha256=5452cf67…）→ **標準＝ee実ソース直接可＋設計書md**（暫定付与・確定はD6）。
- 母集合: baseline `integration_test/all_it_cases.tsv`（SHA 7911f190d273…）M10-11全**81行**
  （IT-M10-11-ADMIN-BASE-SETTING-SETTING-SHOP-ORDER-STATUS-001〜081。以下「-nnn」）。
- **判定原則（W0教訓1）**: 観点ラベルはノイズ。bindは各行の**「期待結果」実テキスト**で判定
  （§8に全81行の期待要旨を併記し極性も期待テキストで確認）。
- 主要一次資料の略記:
  - Controller = `src/Eccube/Controller/Admin/Setting/Shop/OrderStatusController.php`
  - Form = `src/Eccube/Form/Type/Admin/OrderStatusSettingType.php`
  - Toggle = `src/Eccube/Form/Type/ToggleSwitchType.php`
  - twig = `src/Eccube/Resource/template/admin/Setting/Shop/order_status.twig`
  - Entity = `src/Eccube/Entity/Master/OrderStatus.php`／`CustomerOrderStatus.php`／`OrderStatusColor.php`／`AbstractMasterEntity.php`
  - Voter = `src/Eccube/Security/Voter/AuthorityVoter.php`
  - PHPUnit = `tests/Eccube/Tests/Web/Admin/Setting/Shop/OrderStatusControllerTest.php`
  - ja/en = `src/Eccube/Resource/locale/messages.{ja,en}.yaml`・`validators.{ja,en}.yaml`
  - xlf = `vendor/symfony/validator/Resources/translations/validators.{ja,en}.xlf`
  - csv = `src/Eccube/Resource/doctrine/import_csv/ja/`（初期データ）

## §1 L1原子オラクル表

全38claim。unitは文字＝**コードポイント**（Symfony `Length` 既定 `countUnit = self::COUNT_CODEPOINTS`
〔vendor Length.php:59〕・計数は `Length::COUNT_CODEPOINTS => mb_strlen($stringValue, $constraint->charset)`
〔vendor LengthValidator.php:53-57〕。L1-017〜019に適用。DB name列も文字長255＝Form255と段差なし〔L1-038〕）。
観測層は §7 に併記。en文言はen一次資料逐語（ja翻訳ゼロ）。

| oracle_id | 観点 | claim | 逐語quote | 根拠(file:line) | LS |
|---|---|---|---|---|---|
| L1-M1011-001 | auth_rule | 未認証の GET/POST `/%eccube_admin_route%/setting/shop/order_status` は admin_login のログイン画面へリダイレクト（到達不可） | `admin:`…`form_login:`…`login_path: admin_login`／「未認証 \| 利用不可。管理画面のログイン要件に従う。」 | security.yaml:40-47／md:248 | 0 |
| L1-M1011-002 | http_status | 認証済み許可権種のGETはHTTP200で本画面を表示 | `$this->assertTrue($this->client->getResponse()->isSuccessful());`／`#[Route(path: '/%eccube_admin_route%/setting/shop/order_status', name: 'admin_setting_shop_order_status', methods: ['GET', 'POST'])]` | PHPUnit:46-50／Controller:38,80-82 | 0 |
| L1-M1011-003 | display_field | 一覧行= `mtb_order_status` 全件・`sort_no` 昇順（検索・絞込なし）。**同一sort_no内の順序は未契約**（実装はORDER BY sort_no相当のみ＝タイブレーク指定なし。検証はsort_no単調昇順・表示ID集合のDB集合一致・帯行の相対位置に限定） | `$OrderStatuses = $this->orderStatusRepository->findBy([], ['sort_no' => 'ASC']);`（第2ソートキーなし）／「全受注ステータス行が`sort_no`昇順で表示され」 | Controller:42／md:65,147 | 0 |
| L1-M1011-004 | display_field | ページ見出し ja「受注対応状況設定」／en "Order Status" | `{% block title %}{{ 'admin.setting.shop.order_status_setting'\|trans }}{% endblock %}`／`受注対応状況設定`／`Order Status` | twig:16／ja:2985／en:2672 | 1 |
| L1-M1011-005 | display_field | サブ見出し ja「基本情報設定」／en "Basic Information Settings" | `{% block sub_title %}{{ 'admin.setting.basic_info'\|trans }}{% endblock %}`／`基本情報設定`／`Basic Information Settings` | twig:17／ja:2973／en:2660 | 1 |
| L1-M1011-006 | display_field | カードヘッダ見出し ja「受注対応状況」／en "Order Status"＋質問アイコン(i.fa-question-circle)＋tooltip title逐語（ja「受注管理およびマイページで表示される対応状況の設定を行います。名称、色、件数表示の設定が可能です。」／en "Set the order status used in order management and my page. You can set the name, color, and number display."） | `title="{{ 'tooltip.setting.shop.order_status.order_status'\|trans }}"`…`<i class="fa fa-question-circle fa-lg ms-1"></i>` | twig:29-31／ja:3179,3677／en:2815,3289 | 1 |
| L1-M1011-007 | display_field | 列ヘッダは左から ID／名称(マイページ)／名称(受注管理)／色／件数表示（en: ID／Name(My page)／Name(Order management)／Color／Number display）。名称(マイページ)・色・件数表示はツールチップ付き、IDと名称(受注管理)はツールチップなし | twig:37-39(id・tooltipなし),41-43(customer・tooltip付),45-47(name・tooltipなし),48-52(color・tooltip付),53-57(count・tooltip付)／「名称(マイページ)・色・件数表示のヘッダはツールチップ付き、IDおよび名称(受注管理)のヘッダはツールチップなし」 | twig:37-57／ja:3180-3184／en:2816-2820／md:76 | 1 |
| L1-M1011-008 | display_field | 列ヘッダツールチップtitle逐語3種（ja:3678「対応状況の名称を設定できます。ここで設定した名称は会員ログイン後のマイページで表示されます。」/3679「受注管理の対応状況の色を設定できます。」/3680「受注管理の対応状況ごとの受注件数の表示・非表示を設定できます。」／en:3290-3292逐語） | `title="{{ 'tooltip.setting.shop.order_status.customer_order_status_name'\|trans }}"` 等 | twig:41,49,54／ja:3678-3680／en:3290-3292 | 1 |
| L1-M1011-009 | display_field | IDセルは `OrderStatus` 主キーの参照表示のみ（入力要素なし） | `{{ OrderStatus.vars.data.id }}`（widgetなし）／「IDセルは`OrderStatus`の主キーを表示のみ。」「識別子 \| ステータスの`id`は編集しない。画面上は参照表示のみ。」 | twig:63-65／md:76,148 | 0 |
| L1-M1011-010 | display_field | 各行の入力4欄のDOM id= `#form_OrderStatuses_<i>_{customer_order_status_name\|name\|color\|display_order_count}`（rootフォーム名`form`・collection名`OrderStatuses`）・`<form id="form">`・CSRF hidden `input[name="_token"]` | `<form id="form" method="post" action="{{ url('admin_setting_shop_order_status') }}">`・`{{ form_widget(form._token) }}`／`->add('OrderStatuses', CollectionType::class, …)` | twig:25-26,66-83／Controller:43-52／Form:44-70（実DOM未検証=§9） | 0 |
| L1-M1011-011 | display_field | 色入力は Symfony `ColorType`（input type=color）で class `form-control-color` 付与＝ブラウザ標準カラーピッカー | `->add('color', ColorType::class, …)`／`{{ form_widget(OrderStatus.color, {'attr': {'class': 'form-control-color'}}) }}`／「色入力ウィジェットに`form-control-color`を付与し、ブラウザ標準のカラーピッカーで選色する。」 | Form:58-64／twig:74-79／md:78 | 0 |
| L1-M1011-012 | display_field | 件数表示は `ToggleSwitchType`（親=CheckboxType）で `label_on`/`label_off` とも空文字＝ラベル文字なしのスイッチ表示 | `->add('display_order_count', ToggleSwitchType::class, ['required' => false, 'label_on' => '', 'label_off' => '',])`／`return CheckboxType::class;` | Form:65-69／Toggle:50-53／md:80 | 0 |
| L1-M1011-013 | display_field | 送信ボタンは `button[type=submit].btn-ec-conversion` で ja「登録」／en "Register" | `<button class="btn btn-ec-conversion px-5" type="submit">{{ 'admin.common.registration'\|trans }}</button>`／`admin.common.registration: 登録`／`admin.common.registration: Register` | twig:101／ja:1629／en:1661 | 1 |
| L1-M1011-014 | display_field | モーダル・ポップアップは利用しない（本画面twigにモーダル要素0件） | 「モーダル・ポップアップ \| 利用しない。」／twig全文grep `modal`=0件（実測） | md:79／twig全文 | 0 |
| L1-M1011-015 | display_field | GET初期値: 名称(受注管理)=`mtb_order_status.name`。名称(マイページ)・色は `POST_SET_DATA` で同一IDの `CustomerOrderStatus.name`・`OrderStatusColor.name` が存在すれば充填 | `$OrderStatusColor = $this->orderStatusColorRepository->find($data->getId()); if (null !== $OrderStatusColor) { $form->get('color')->setData($OrderStatusColor->getName()); }`（customer側同形） | Form:72-88／md:90 | 0 |
| L1-M1011-016 | display_field | 欠損行（同一IDの行が無い）では初期表示で当該列が値未セットのまま | 「欠け側は初期表示では当該列が値未セットのままとなる。」（POST_SET_DATAのnullガードで充填せず） | md:170／Form:80-87 | 0 |
| L1-M1011-017 | validation | 名称(受注管理)は `NotBlank`＋`Length(max=eccube_stext_len=255)`。**計数単位=コードポイント**（Length既定countUnit） | `new Assert\NotBlank(), new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),`／`eccube_stext_len: 255`／`public string $countUnit = self::COUNT_CODEPOINTS;`／`Length::COUNT_CODEPOINTS => mb_strlen($stringValue, $constraint->charset),` | Form:45-50／eccube.yaml:137／vendor Length.php:59／vendor LengthValidator.php:53-57／md:237 | 0 |
| L1-M1011-018 | validation | 名称(マイページ)（mapped=false）も同一制約（計数単位=コードポイント。根拠はL1-017と同一のvendor行） | `->add('customer_order_status_name', TextType::class, ['mapped' => false, 'constraints' => [new Assert\NotBlank(), new Assert\Length(…)],])` | Form:51-57／vendor Length.php:59／LengthValidator.php:53-57／md:238 | 0 |
| L1-M1011-019 | validation | 色（mapped=false・ColorType）も同一制約（計数単位=コードポイント。同上） | `->add('color', ColorType::class, ['mapped' => false, 'constraints' => [new Assert\NotBlank(), new Assert\Length(…)],])` | Form:58-64／vendor Length.php:59／LengthValidator.php:53-57／md:239 | 0 |
| L1-M1011-020 | validation | 件数表示は `required: false`＝未チェックでもエラーにならず偽として解釈 | `'required' => false,`／「件数表示 \| checkbox系トグル \| `required false`。未チェック時は偽として解釈される。」 | Form:66／md:240,163 | 0 |
| L1-M1011-021 | message | NotBlank文言 ja「入力されていません。」／en "No value found." | `This value should not be blank.: 入力されていません。`／`This value should not be blank.: No value found.`／PHPUnit `assertStringContainsString('入力されていません。', $crawler->text())` | validators.ja.yaml:17／validators.en.yaml:17／PHPUnit:95 | 1 |
| L1-M1011-022 | message | Length超過文言 ja「長すぎます。この値は255文字以下で入力してください。」（{{ limit }}=255解決）／en "This value is too long. It should have 255 characters or less."（**複数形の決定根拠**: 違反生成時に `->setPlural($constraint->max)` で複数形カウント=max=255が渡され、255≠1でcharacters側が選択される。パイロットX-033-EN実走successの選択実績とも一致） | `<target>長すぎます。この値は{{ limit }}文字以下で入力してください。</target>`／`<target>This value is too long. It should have {{ limit }} character or less.\|This value is too long. It should have {{ limit }} characters or less.</target>`／`$builder = $this->context->buildViolation(…$constraint->maxMessage);`…`->setPlural($constraint->max)` | xlf ja:78-79／xlf en:78-79（ee validators.yamlに上書きなし=grep実測）／vendor LengthValidator.php:74,85／md:139 | 1 |
| L1-M1011-023 | behavior | 検証失敗時はHTTP200で同一画面再描画・エラーは当該フィールドのform_errors位置（各widget直後）に表示・リダイレクトなし | `if ($form->isSubmitted() && $form->isValid()) {…} return ['form' => $form->createView()];`／`{{ form_errors(OrderStatus.name) }}` 等／`$this->assertFalse($this->client->getResponse()->isRedirection());` | Controller:56,80-82／twig:68,72,78,82／PHPUnit:94-95／md:107,201 | 0 |
| L1-M1011-024 | db_effect | 検証失敗時は `flush` 前に停止しDB不変（部分保存なし＝1行でも違反があればフォーム全体無効） | 「いずれかの子フィールドが`NotBlank`または`Length`最大超過に該当すると、フォーム全体は無効となり`flush`は行われない。」「`flush`前に停止し、DBは不変。」 | md:106,172／Controller:56-73 | 0 |
| L1-M1011-025 | db_effect | 検証成功時、各行の名称(受注管理)→`mtb_order_status.name`・件数表示→`mtb_order_status.display_order_count` へ上書き保存 | `$OrderStatus = $child->getData(); $this->entityManager->persist($OrderStatus);`（data_class=OrderStatus・name/display_order_countはmapped） | Controller:57-59／Form:45-50,65-69,97-99／md:160,163 | 0 |
| L1-M1011-026 | db_effect | 同一IDの `CustomerOrderStatus` が存在するときのみ名称(マイページ)を `mtb_customer_order_status.name` へ上書きpersist。無ければ入力は反映されない（失われる） | `$CustomerOrderStatus = $this->customerOrderStatusRepository->find($OrderStatus->getId()); if (null !== $CustomerOrderStatus) { $CustomerOrderStatus->setName($child['customer_order_status_name']->getData()); … }` | Controller:61-65／md:98,161,170 | 0 |
| L1-M1011-027 | db_effect | 同一IDの `OrderStatusColor` が存在するときのみ色を `mtb_order_status_color.name` へ上書きpersist。無ければ反映されない | `$OrderStatusColor = $this->orderStatusColorRepository->find($OrderStatus->getId()); if (null !== $OrderStatusColor) { $OrderStatusColor->setName($child['color']->getData()); … }` | Controller:67-71／md:99,162,170 | 0 |
| L1-M1011-028 | db_effect | 本機能に行の追加(INSERT)・削除(DELETE)経路は無い（更新のみ。保存前後で3表の行数不変） | 「行の追加削除や並び順の変更はこの画面では行わず」／「当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。」（Controllerはfind済み既存エンティティのみpersist・new生成なし=Controller:57-72実測） | md:7,229／Controller:57-72 | 0 |
| L1-M1011-029 | db_effect | `sort_no` は3表とも本機能では更新しない（Formに対応フィールドなし） | 「mtb_order_status \| sort_no \| 一覧取得の並べ替えキー。この画面では更新しない。」「mtb_customer_order_status \| sort_no \| 本機能では更新しない。」「mtb_order_status_color \| sort_no \| 本機能では更新しない。」 | md:214,218,221／Form:44-70（sort_noフィールド不存在＝実測） | 0 |
| L1-M1011-030 | message | 保存成功フラッシュ ja「保存しました」／en "Saved"（キー`admin.common.save_complete`・adminフラッシュ名前空間 `eccube.admin.success`） | `$this->addSuccess('admin.common.save_complete', 'admin');`／`$this->addFlash('eccube.'.$namespace.'.success', $message);`／`admin.common.save_complete: 保存しました`／`admin.common.save_complete: Saved` | Controller:75／AbstractController.php:106-109／ja:1591／en:1636 | 1 |
| L1-M1011-031 | nav | 保存成功時は同一画面（admin_setting_shop_order_status）へリダイレクトし、再GETでDBから読み直した更新値のHTMLを表示 | `return $this->redirectToRoute('admin_setting_shop_order_status');`／「成功時リダイレクト後は改めてDBから読むため、そのレスポンスのHTMLは確定済み変更を反映した値を基点に組み立てる。」 | Controller:77／md:100-101,182,200,263／PHPUnit:66 | 0 |
| L1-M1011-032 | auth_rule | authority id=4(tenant_owner)・id=5(tenant_operator)は初期データ `dtb_authority_role` の deny_url `/setting/shop` 前方一致でHTTP403（owner側はPHPUnitで確認・operator側はVoter+初期データによる導出で同型） | `if (preg_match("/^(\/{$adminRoute}{$denyUrl})/i", (string) $path)) { return VoterInterface::ACCESS_DENIED; }`／`"8","4",,"/setting/shop",…`・`"9","5",,"/setting/shop",…`／`$this->assertEquals(Response::HTTP_FORBIDDEN, …)` | Voter:52-66／csv dtb_authority_role.csv:10-11／csv mtb_authority.csv:5-6(4=tenant_owner,5=tenant_operator)／PHPUnit:126-132／md:250 | 0 |
| L1-M1011-033 | auth_rule | 拒否パターンが紐付かない権種（システム管理者等）は画面表示・登録送信とも許可 | `return VoterInterface::ACCESS_GRANTED;`（deny_url非一致時の既定）／「画面表示および登録送信が評価上許可される。」 | Voter:73／md:249 | 0 |
| L1-M1011-034 | csrf | フォームCSRF有効（`form[_token]`）。トークン無効のPOSTはフォーム無効＝flushされず200再描画（本twigはroot form_errors非描画のためエラー文言表示は観測非契約→文言をclaimしない） | `csrf_protection: { enabled: true }`／`{{ form_widget(form._token) }}`／`if ($form->isSubmitted() && $form->isValid()) {…}`（invalid時はflush・redirectなしで再描画） | framework.yaml:7／twig:26／Controller:56,80-82／md:67,282 | 0 |
| L1-M1011-035 | db_schema | `mtb_order_status.display_order_count` はboolean列（default false） | `#[ORM\Column(name: 'display_order_count', type: Types::BOOLEAN, options: ['default' => false])]` | Entity OrderStatus.php:78-79／md:215 | 0 |
| L1-M1011-036 | initial_data | 初期データ `dtb_authority_role` に id=8(authority_id=4)・id=9(authority_id=5)×deny_url `/setting/shop` の2行が存在（非UI/DB照会で観測） | `"8","4",,"/setting/shop","2024-07-25 01:27:09 +00:00","2024-07-25 01:29:22 +00:00","false"`・`"9","5",,…` | csv dtb_authority_role.csv:10-11／md:250 | 0 |
| L1-M1011-037 | integration | `display_order_count` が真の `OrderStatus` のみ、マスタ受注ステータス選択Form（受注検索等）で `countByOrderStatus` により件数を取得し選択肢に件数を載せる（偽は件数クエリ実行せず非表示）＝当画面フラグの論理的出口 | `if ($OrderStatus->isDisplayOrderCount()) { $count = $this->orderRepository->countByOrderStatus($id); $view->vars['order_count'][$id]['display'] = true; … } else { …['display'] = false; …['count'] = null; }` | src/Eccube/Form/Type/Master/OrderStatusType.php:41-53／md:56,115（観測は二分=C-061A表示有無〔GUI・要実機〕／C-061Bクエリ非実行〔非UI・SQLログ観測未契約〕＝§9） | 0 |
| L1-M1011-038 | db_schema | 3表とも `id`=smallint(採番なし=GeneratedValue NONE)・`name`=string(255)・`sort_no`=smallint（共通基底）。Form最大長255=DB255で段差なし（文字長意味論） | `#[ORM\Column(name: 'id', type: Types::SMALLINT, options: ['unsigned' => true])] #[ORM\GeneratedValue(strategy: 'NONE')]`…`#[ORM\Column(name: 'name', type: Types::STRING, length: 255)]`…`#[ORM\Column(name: 'sort_no', type: Types::SMALLINT, …)]` | Entity AbstractMasterEntity.php:32-41／md:42 | 0 |

## §2 SEED三段参照設計（全て `@TBD-D5`）

期待値の正は**L1オラクルID**（SEED値を期待値の正にしない三段参照: 期待=L1→前提状態=SEED→実測=観測値）。
本機能は**既存マスタ行の更新のみ**（L1-028）のため、SEEDは「試験帯の専用行」を追加し実マスタ行を汚さない。
`id` はsmallint（L1-038）のため帯は **990〜993**（初期データ最大id=15と衝突しない。9桁帯は型上限32767超で使用不可）。

| SEED | 内容 | 用途 |
|---|---|---|
| SEED-M01-ADMIN | 管理者ログイン（パイロット共通・拒否パターンなし権種） | 全ケースの認証 |
| SEED-M1011-BAND | `mtb_order_status`(id=990,name=`E2E受注名990`,sort_no=990,display_order_count=false)＋`mtb_customer_order_status`(id=990,name=`E2Eマイページ990`,sort_no=990)＋`mtb_order_status_color`(id=990,name=`#123456`,sort_no=990)。3表そろい行 | 初期表示恒等（C-009）・更新系（C-031〜039）・帯行はsort_no最大で一覧末尾（順序検証C-003） |
| SEED-M1011-MISSING | `mtb_order_status`(id=991,name=`E2E欠損990`,sort_no=991)のみ（customer/color側に同一id行なし） | 欠損行の初期表示（C-012）・欠損側へ反映されない保存（C-040） |
| SEED-M1011-TENANT | `dtb_member` に authority_id=4(tenant_owner)・authority_id=5(tenant_operator) の試験アカウント各1（ログイン可能な資格情報。パスワードハッシュ等のmember生成契約は`@TBD-D5`） | 403検証（C-050/051） |

- 更新系ケースは**帯行(990/991)のみ**を書き換え、afterEachでSEED再適用（帯行DELETE→再INSERT）。実マスタ行(id≦15)には書き込まない。
- **注意（隔離）**: 帯行追加は受注検索の選択肢等（L1-037の出口）へ露出するため、共有環境では実行しない（フレッシュDB/serial前提。`e2e-standard-run-requirements` 準拠）。
- 初期マスタの行集合は環境依存（インストール経路=import_csv と migrations のinsert-if-absentで差が出る:
  import_csv/ja/mtb_order_status.csv=8行 vs Version20251125150428/Version20260220000001)。よって
  **「全◯行」の全数一致はSEED帯の相対検証に限定**し、母集合の「全件・昇順」は「帯行が既知sort_noの位置（末尾）に現れる＋DB照会の全id集合と画面行集合の一致」で観測する（分母はdb.ts照会値）。

## §3 画面項目マトリクス

| 項目 | 必須 | Form最大長 | DB列(型/長) | 初期値 | 保存先 | 境界値(255/256/1/0) | 根拠 |
|---|---|---|---|---|---|---|---|
| 名称(受注管理) `name` | 必須(NotBlank) | 255 | mtb_order_status.name varchar(255) | GET時点のmtb_order_status.name | mtb_order_status.name | 255受理/256拒否/1受理/0(空)拒否 | L1-017,038／md:160 |
| 名称(マイページ) `customer_order_status_name`（mapped=false） | 必須 | 255 | mtb_customer_order_status.name varchar(255) | 同一ID行があればその name（POST_SET_DATA） | 同一ID行が存在するときのみ上書き（無ければ消失） | 同上 | L1-018,015,026／md:161 |
| 色 `color`（mapped=false・ColorType） | 必須 | 255 | mtb_order_status_color.name varchar(255) | 同一ID行があればその name | 同一ID行が存在するときのみ上書き | 同上（UI経由は input[type=color] がブラウザで #rrggbb 正規化→256字注入はrequest契約の直接POSTで実施） | L1-019,015,027／md:162 |
| 件数表示 `display_order_count`（ToggleSwitchType=checkbox） | 任意(required false) | —（専用長制約なし） | mtb_order_status.display_order_count boolean default false | GET時点の同列値 | 同列へ上書き（オン=真/オフ=偽） | — | L1-020,035／md:163,240 |
| ID | —（参照表示のみ・入力なし） | — | mtb_order_status.id smallint・採番なし | 主キー表示 | 更新しない | — | L1-009,038／md:148,212 |
| sort_no（画面非表示） | — | —（Formフィールドなし） | 3表とも smallint | — | 更新しない | — | L1-029／md:214,218,221 |

一覧/追加/削除の別: **一覧表示＋一括更新のみ**。行追加・削除・並び順変更の機能なし（L1-028,029／md:7）。

## §4 実行可能グレード14列TSV（候補・**自己完結＝全42行を実体掲載**）

- 期待値の正は `[L1:...]`（§1）。fixtureは `@TBD-D5`。URLの `%eccube_admin_route%` は環境値（.envのECCUBE_ADMIN_ROUTE）。
- request契約（§6.1）: rootフォーム名 `form`。POSTボディ `form[_token]`・`form[OrderStatuses][<i>][name]`・
  `…[customer_order_status_name]`・`…[color]`・`…[display_order_count]`（'1'=オン/欠落=オフ）。
- セレクタは page 実装様式（`e2e/pages/admin/m10/m10_11_admin_base_setting_setting_shop_order_status.page.ts`）に整合。実DOM検証は未実施（§9）。

### §4.1 bound対応候補行（29行。§8の81対応表が参照する全行）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-001	IT-15	権限	P1	未認証で当画面URLへ直接アクセス→ログイン画面へリダイレクト	未ログイン	—	1. GET /%eccube_admin_route%/setting/shop/order_status	admin_login のログイン画面へリダイレクトされ本画面は表示されない [L1:L1-M1011-001]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-002	IT-25	表示	P1	GETでHTTP200・見出し「受注対応状況設定」・サブ見出し「基本情報設定」（ja）	ログイン済(SEED-M01-ADMIN)	—	1. 当画面を開く 2. HTTP status・block title/sub_title描画領域の文言を読む	HTTP200＋「受注対応状況設定」＋「基本情報設定」が表示 [L1:L1-M1011-002,L1-M1011-004,L1-M1011-005]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-002-EN	IT-25	表示	P2	見出し・サブ見出し（en）	ログイン済／locale=en	—	1. en UIで当画面を開く 2. 見出しを読む	"Order Status"・"Basic Information Settings" が表示 [L1:L1-M1011-004,L1-M1011-005]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-003	IT-23	表示順	P1	全ステータス行がsort_no昇順（単調）で表示・各行にID表示と4入力欄・「登録」ボタン	ログイン済／SEED-M1011-BAND＋SEED-M1011-MISSING（帯sort_no=990,991は既存最大より大）	—	1. 当画面を開く 2. db.tsで SELECT id, sort_no FROM mtb_order_status を取得（id→sort_no対応表） 3. tbody各行のIDセル文書順を読み、対応表でsort_no列に写像 4. 帯行990,991の出現位置を確認 5. 行0の4入力欄と登録ボタンの存在確認	(a) 画面順のsort_noが単調非減少（**同一sort_no内の順序は未契約=検証しない**） (b) 表示ID集合=DB全id集合と一致 (c) 帯行990,991が末尾側（sort_no最大帯の相対位置） (d) 各行に4入力欄＋「登録」(btn-ec-conversion) [L1:L1-M1011-003,L1-M1011-009,L1-M1011-010,L1-M1011-013; fixture:SEED-M1011-BAND@TBD-D5]（分母はdb.ts照会値=§2の環境依存対策）				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-006	IT-25	UI部品	P2	色入力がinput[type=color]でform-control-color付与	ログイン済	—	1. 当画面を開く 2. #form_OrderStatuses_0_color のtype属性とclassを読む	type="color" かつ class に form-control-color を含む [L1:L1-M1011-011]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-008	IT-25	表示	P3	モーダル・ポップアップを利用しない	ログイン済	—	1. 当画面を開く 2. .modal 要素数を数える 3. 各UI部品（色・トグル）操作後も再確認	.modal が0件のまま（本画面用モーダルなし） [L1:L1-M1011-014]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-009	IT-25	初期表示	P1	GET初期表示で3欄がDB既知値と一致（恒等写像）	ログイン済／SEED-M1011-BAND	—	1. 当画面を開く 2. 帯行(id=990)の行indexをID列から特定 3. name/customer_order_status_name/color 各valueを読む	name=`E2E受注名990`・マイページ名=`E2Eマイページ990`・色=`#123456`（SEED投入値との恒等。期待の正はL1-015の写像規則） [L1:L1-M1011-015; fixture:SEED-M1011-BAND@TBD-D5]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-012	IT-25	初期表示	P2	欠損行（customer/color側なし）は当該欄が値未セットで表示	ログイン済／SEED-M1011-MISSING	—	1. 当画面を開く 2. 帯行(id=991)の customer_order_status_name / color のvalueを読む	両欄とも値未セット（空value。name欄はmtb_order_status.nameの`E2E欠損990`） [L1:L1-M1011-016,L1-M1011-015; fixture:SEED-M1011-MISSING@TBD-D5]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-020	IT-22	必須	P1	名称(受注管理)空で登録→「入力されていません。」・成功フラッシュなし・200滞留（ja）	ログイン済	行0 name=空・他は現行値	1. 当画面で #form_OrderStatuses_0_name を空にし登録押下 2. 応答と文言を読む	保存されず「入力されていません。」が表示・成功フラッシュなし・同一URLでHTTP200 [L1:L1-M1011-017,L1-M1011-021,L1-M1011-023]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-020-EN	IT-22	必須	P2	必須エラーメッセージ（en）	ログイン済／locale=en	同上	同上	"No value found." が表示される [L1:L1-M1011-021]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-021	IT-22	必須	P1	名称(マイページ)空で登録→必須エラー・保存されない	ログイン済	行0 customer_order_status_name=空	1. 空にして登録押下 2. エラーと成功フラッシュ有無を確認	「入力されていません。」表示・成功フラッシュなし [L1:L1-M1011-018,L1-M1011-021,L1-M1011-023]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-022	IT-22	必須	P1	色空で登録→必須エラー（request契約直POST・ColorType正規化回避）	ログイン済セッション	§6.1契約: form[OrderStatuses][0][color]="" 他は現行値・正規_token同梱でPOST	1. GETで正規_tokenと現行値を取得 2. color空でPOST 3. 応答HTMLを読む	保存されず「入力されていません。」を含むHTTP200応答 [L1:L1-M1011-019,L1-M1011-021,L1-M1011-023]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-023	IT-22	最大長	P1	名称(受注管理)256字→「長すぎます。この値は255文字以下で入力してください。」（ja）	ログイン済／SEED-M1011-BAND	帯行 name=runFill(256,ascii,"E2E-<runid>-")	1. 帯行(id=990)のnameを256字にして登録押下 2. エラー文言を読む	保存されず「長すぎます。この値は255文字以下で入力してください。」表示 [L1:L1-M1011-017,L1-M1011-022,L1-M1011-023; fixture:SEED-M1011-BAND@TBD-D5]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-023-EN	IT-22	最大長	P2	最大長超過メッセージ（en）	ログイン済／locale=en	同上	同上	"This value is too long. It should have 255 characters or less." 表示 [L1:L1-M1011-022]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-024	IT-22	更新抑止	P1	検証失敗時はflush前停止＝DB不変・行数不変	ログイン済／SEED-M1011-BAND	帯行 name=runFill(256,ascii,"E2E-<runid>-")	1. db.tsで更新前の帯行name・3表の行数を記録 2. 256字で登録押下しエラー確認 3. db.tsで再照会	帯行nameが更新前と同値・3表の行数不変（部分保存なし） [L1:L1-M1011-024,L1-M1011-028; fixture:SEED-M1011-BAND@TBD-D5]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-025	IT-22	境界	P1	空欄（最小長-1=0字）→NotBlankエラー・DB不変	ログイン済／SEED-M1011-BAND	帯行 name=""	1. db.tsで更新前値記録 2. 空で登録押下 3. エラー確認 4. db.ts再照会	「入力されていません。」表示・帯行name不変・行数不変 [L1:L1-M1011-017,L1-M1011-021,L1-M1011-024,L1-M1011-028; fixture:SEED-M1011-BAND@TBD-D5]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-030	IT-26	保存成功	P1	有効値一式で登録→「保存しました」＋同一画面へリダイレクト＋再GETで更新値表示（ja）	ログイン済／SEED-M1011-BAND	帯行 name=`E2E-<runid>-保存`・他現行値	1. 帯行nameを変更し登録押下 2. 遷移先URLとフラッシュを読む 3. リダイレクト後の同欄valueを読む（afterEach: SEED再適用）	「保存しました」＋ /%eccube_admin_route%/setting/shop/order_status（route: admin_setting_shop_order_status）へリダイレクト＋再表示欄に更新値（DB読み直し） [L1:L1-M1011-030,L1-M1011-031; fixture:SEED-M1011-BAND@TBD-D5]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-030-EN	IT-26	保存成功	P2	保存成功フラッシュ（en）	ログイン済／SEED-M1011-BAND／locale=en	同上	同上	"Saved" 表示＋同一画面へリダイレクト [L1:L1-M1011-030,L1-M1011-031]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-031	IT-26	更新内容	P1	名称(受注管理)更新がmtb_order_status.nameへ反映される	ログイン済／SEED-M1011-BAND	帯行 name=`E2E-<runid>-受注名`	1. 帯行nameを変更し登録 2. db.tsで SELECT name FROM mtb_order_status WHERE id=990 照会（afterEach: SEED再適用）	mtb_order_status.name=入力値と完全一致 [L1:L1-M1011-025; fixture:SEED-M1011-BAND@TBD-D5]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-032	IT-26	更新内容	P1	名称(マイページ)更新がmtb_customer_order_status.nameへ反映される	ログイン済／SEED-M1011-BAND	帯行 customer_order_status_name=`E2E-<runid>-MP名`	1. 帯行の同欄を変更し登録 2. db.tsで SELECT name FROM mtb_customer_order_status WHERE id=990 照会（afterEach: SEED再適用）	mtb_customer_order_status.name=入力値と完全一致（同一ID行が存在するため上書き） [L1:L1-M1011-026; fixture:SEED-M1011-BAND@TBD-D5]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-033	IT-26	更新内容	P1	色更新がmtb_order_status_color.nameへ反映される	ログイン済／SEED-M1011-BAND	帯行 color=`#abcdef`	1. 帯行の色を変更し登録 2. db.tsで SELECT name FROM mtb_order_status_color WHERE id=990 照会（afterEach: SEED再適用）	mtb_order_status_color.name=`#abcdef` と完全一致 [L1:L1-M1011-027; fixture:SEED-M1011-BAND@TBD-D5]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-034	IT-26	更新内容	P1	件数表示ON→display_order_count=true／OFF→false（フラグの保存先列）	ログイン済／SEED-M1011-BAND(display_order_count=false)	1回目: 帯行トグルON／2回目: OFF	1. トグルONで登録→db.tsで SELECT display_order_count FROM mtb_order_status WHERE id=990 2. トグルOFFで登録→再照会（afterEach: SEED再適用）	1回目=true・2回目=false（チェック=真/未チェック=偽の上書き） [L1:L1-M1011-025,L1-M1011-020,L1-M1011-035; fixture:SEED-M1011-BAND@TBD-D5]（受注検索側の件数表示出口はL1-M1011-037＝C-061A/B・実行保留）				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-035	IT-22	任意	P1	件数表示未チェックのままでも必須エラーにならず保存成功（required false）	ログイン済／SEED-M1011-BAND	帯行トグル未チェック・他有効値	1. トグルを外したまま登録押下 2. フラッシュとエラー有無を確認（afterEach: SEED再適用）	必須エラーが表示されず「保存しました」＋リダイレクト（未チェック=偽で保存） [L1:L1-M1011-020,L1-M1011-030; fixture:SEED-M1011-BAND@TBD-D5]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-036	IT-22	最大長	P1	名称(受注管理)255字(ascii)が受理されDBへ保存（文字長=255）	ログイン済／SEED-M1011-BAND	帯行 name=runFill(255,ascii,"E2E-<runid>-")	1. 255字で登録 2. フラッシュ確認 3. db.tsで char_length(name) 照会（afterEach: SEED再適用）	保存成功＋DB文字長=255（Form255/DB255段差なし） [L1:L1-M1011-017,L1-M1011-038,L1-M1011-030; fixture:SEED-M1011-BAND@TBD-D5]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-037	IT-22	境界	P2	名称(受注管理)1字（最小長）が受理される	ログイン済／SEED-M1011-BAND	帯行 name=`A`	1. 1字で登録 2. フラッシュ確認 3. db.tsでname照会（afterEach: SEED再適用）	保存成功＋mtb_order_status.name=`A`（min制約なし＝NotBlankのみ） [L1:L1-M1011-017,L1-M1011-025; fixture:SEED-M1011-BAND@TBD-D5]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-038	IT-26	更新内容	P1	保存成功後も3表の行数不変（行追加・削除なし＝更新のみ）	ログイン済／SEED-M1011-BAND	帯行 name=`E2E-<runid>-行数`	1. db.tsで3表のCOUNT(*)を記録 2. 有効値で登録し成功確認 3. db.tsで再照会（afterEach: SEED再適用）	3表ともCOUNT不変（INSERT/DELETEなし） [L1:L1-M1011-028; fixture:SEED-M1011-BAND@TBD-D5]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-039	IT-26	更新内容	P1	保存してもsort_noは3表とも変更されない	ログイン済／SEED-M1011-BAND	帯行 name/customer名/色を全て変更	1. db.tsで3表の帯行sort_noを記録 2. 登録し成功確認 3. db.tsで再照会（afterEach: SEED再適用）	3表とも sort_no=990 のまま不変 [L1:L1-M1011-029; fixture:SEED-M1011-BAND@TBD-D5]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-040	IT-26	更新内容	P1	欠損行に入力して保存→OrderStatus側のみ保存・欠損テーブルへは反映されない	ログイン済／SEED-M1011-MISSING	欠損行(id=991) name=`E2E-<runid>-欠損`・customer_order_status_name=`E2E消失`・color=`#222222`（全必須を充足）	1. 欠損行の3欄を入力し登録 2. フラッシュ確認 3. db.tsで mtb_order_status.name(id=991)＋mtb_customer_order_status/mtb_order_status_color の id=991 行の不存在を照会（afterEach: SEED再適用）	保存成功＋mtb_order_status.name=入力値。customer/color側には id=991 行が生成されず入力は反映されない（消失） [L1:L1-M1011-026,L1-M1011-027,L1-M1011-028; fixture:SEED-M1011-MISSING@TBD-D5]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-050	IT-15	権限	P1	tenant_owner(authority id=4)でGET→HTTP403	SEED-M1011-TENANT(tenant_owner)でログイン	—	1. tenant_ownerでログイン 2. GET /%eccube_admin_route%/setting/shop/order_status 3. HTTP statusを読む	HTTP403（deny_url `/setting/shop` 前方一致で拒否） [L1:L1-M1011-032; fixture:SEED-M1011-TENANT@TBD-D5]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-052	IT-20	初期データ	P2	dtb_authority_roleに/setting/shop×authority4,5の拒否行が存在（非UI/DB照会）	DB接続可（SUT不変・読取のみ）	—	1. db.tsで SELECT authority_id FROM dtb_authority_role WHERE deny_url='/setting/shop' ORDER BY authority_id を照会	結果が {4,5} を含む（初期データの拒否紐付け） [L1:L1-M1011-036]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-053	IT-15	権限	P1	拒否パターンなし権種（システム管理者）はGET表示と登録送信の両方が許可される	ログイン済(SEED-M01-ADMIN=拒否パターンなし)／SEED-M1011-BAND	帯行 name=`E2E-<runid>-許可`	1. GETでHTTP200確認 2. 帯行を変更し登録 3. 成功フラッシュ確認（afterEach: SEED再適用）	GET=200＋登録成功「保存しました」（表示・送信とも許可） [L1:L1-M1011-033,L1-M1011-002,L1-M1011-030; fixture:SEED-M1011-BAND@TBD-D5]				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-061A	IT-24	外部出口	P3	display_order_count=trueのステータスのみ受注検索の選択肢に件数が表示される（GUI・cross-feature観測）	ログイン済／SEED-M1011-BAND	帯行トグルON保存→受注一覧(別機能M04系)の検索エリアを開く	（受注一覧側セレクタ未確定＝要実機）1. 帯行ONで保存 2. 受注一覧検索エリアで帯ステータス選択肢の件数表示有無を読む 3. OFF保存後に再表示し件数表示が無いことを読む	ON時のみ帯ステータスに件数表示・OFF時は件数表示なし（**表示有無のみ。クエリ非実行はC-061Bへ分離**） [L1:L1-M1011-037; fixture:SEED-M1011-BAND@TBD-D5]（実行保留=観測面が別機能画面でセレクタ未契約）				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-061B	IT-24	外部出口	P3	display_order_count=falseのステータスでは件数集計クエリが実行されない（非UI・クエリログ観測）	ログイン済／SEED-M1011-BAND(帯行=false)／PG statement log有効	—	1. PGのstatement logを観測開始 2. 受注一覧検索エリアの描画を発生させる 3. ログにcountByOrderStatus相当の件数クエリが帯ステータスidに対して現れないことを確認（ON時は現れることを対照）	false時は当該idの件数クエリ非実行・true時のみ実行（OrderStatusType.php:45-52のisDisplayOrderCount分岐） [L1:L1-M1011-037; fixture:SEED-M1011-BAND@TBD-D5]（実行保留=SQLログ観測手段未契約）				
```

### §4.2 補完行（7行＋補完従属-EN 2行。**親test_idなし・母集合会計に算入しない**。理由=設計書補完〔一次資料に規定があるが、母集合81行の期待テキストに対応する親が存在しない〕。改訂1: C-061は母集合002のbind先としてbound対応〔§4.1のC-061A/B〕へ移動）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-004	IT-25	UI部品	P2	カードヘッダ見出し「受注対応状況」＋質問アイコン＋ツールチップ逐語（ja）	ログイン済	—	1. 当画面を開く 2. .card-header のspan文言・i.fa-question-circle・親div[data-bs-toggle=tooltip]のtitle属性を読む	「受注対応状況」＋質問アイコン＋title=「受注管理およびマイページで表示される対応状況の設定を行います。名称、色、件数表示の設定が可能です。」 [L1:L1-M1011-006]（補完行・親test_idなし・設計書補完）				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-004-EN	IT-25	UI部品	P3	カードヘッダ（en）	ログイン済／locale=en	—	同上	"Order Status"＋title="Set the order status used in order management and my page. You can set the name, color, and number display." [L1:L1-M1011-006]（補完行・親test_idなし・設計書補完）				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-005	IT-25	画面レイアウト	P2	列ヘッダ5列の文言・順序・ツールチップ有無（ja）	ログイン済	—	1. 当画面を開く 2. thead th を文書順に読む 3. 各thのツールチップ属性有無と title逐語（マイページ/色/件数表示の3種=L1-008）を読む	左から「ID」「名称(マイページ)」「名称(受注管理)」「色」「件数表示」・ツールチップはマイページ/色/件数表示のみ（title逐語一致） [L1:L1-M1011-007,L1-M1011-008]（補完行・親test_idなし・設計書補完）				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-005-EN	IT-25	画面レイアウト	P3	列ヘッダ（en）	ログイン済／locale=en	—	同上	"ID"・"Name(My page)"・"Name(Order management)"・"Color"・"Number display"（tooltip title=en逐語） [L1:L1-M1011-007,L1-M1011-008]（補完行・親test_idなし・設計書補完）				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-007	IT-25	UI部品	P3	件数表示がcheckbox型トグルでラベル文字なし	ログイン済	—	1. 当画面を開く 2. #form_OrderStatuses_0_display_order_count のtype属性を読む 3. トグルのlabel_on/label_off文言領域が空であることを確認	type="checkbox"（ToggleSwitchType）かつON/OFFラベル文字なし [L1:L1-M1011-012]（補完行・親test_idなし・設計書補完）				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-010	IT-25	初期表示	P2	件数表示チェック状態がGET時点のdisplay_order_count値と一致	ログイン済／SEED-M1011-BAND(false)＋既定初期行	—	1. 当画面を開く 2. 帯行(id=990)のトグルchecked状態を読む 3. db.tsで同列を照会し突合	checked=DB値（帯行=false=未チェック） [L1:L1-M1011-015,L1-M1011-035; fixture:SEED-M1011-BAND@TBD-D5]（補完行・親test_idなし・設計書補完=md:163初期値規定）				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-011	IT-25	画面レイアウト	P2	IDセルは参照表示のみで入力要素を持たない	ログイン済	—	1. 当画面を開く 2. 行0のIDセル内 input/select/textarea 要素数を数える	0件（表示のみ・編集不可） [L1:L1-M1011-009]（補完行・親test_idなし・設計書補完）				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-051	IT-15	権限	P2	tenant_operator(authority id=5)でGET→HTTP403	SEED-M1011-TENANT(tenant_operator)でログイン	—	1. tenant_operatorでログイン 2. GET当画面 3. HTTP statusを読む	HTTP403 [L1:L1-M1011-032; fixture:SEED-M1011-TENANT@TBD-D5]（補完行・親test_idなし・設計書補完。PHPUnit明示はowner側のみ＝operator側はVoter:52-66＋csv:11からの導出。乖離時は不具合候補起票）				
m10-11_admin_base_setting_setting_shop_order_status	E2E-M1011C-060	IT-03	CSRF	P1	_token改変のPOSTは保存されず200再描画（非UI）	ログイン済セッション（同一context）／SEED-M1011-BAND	§6.1契約: 正規_tokenの末尾1文字を置換し form[OrderStatuses][*]（帯行name=`E2E-CSRF改変`）と共にPOST	1. GETで正規tokenと現行値取得 2. 改変tokenでPOST 3. 応答statusとdb.tsで帯行name照会	リダイレクトされずHTTP200・成功フラッシュなし・mtb_order_status.name不変（フォーム無効=flushなし。root form_errors非描画のため文言はclaimしない） [L1:L1-M1011-034,L1-M1011-024; fixture:SEED-M1011-BAND@TBD-D5]（補完行・親test_idなし・設計書補完）				
```

## §5 locale対応表

LS=1 claim（9件）: L1-004（見出し）・L1-005（サブ見出し）・L1-006（カードヘッダ+tooltip）・
L1-007（列ヘッダ）・L1-008（列tooltip）・L1-013（登録ボタン）・L1-021（NotBlank）・L1-022（Length）・
L1-030（保存フラッシュ）。

→ **-EN 6行**（bound親従属4: C-002-EN／C-020-EN／C-023-EN／C-030-EN。補完従属2: C-004-EN／C-005-EN）。
L1-013（登録ボタンen "Register"）・L1-007/008の分はC-002-EN/C-005-ENに包含。
en文言はすべてen一次資料逐語（messages.en.yaml:1636,1661,2660,2672,2815-2820,3289-3292／
validators.en.yaml:17／validators.en.xlf:79）。**ja翻訳による生成ゼロ**。
L1-022 enの複数形分岐は limit=255>1 でcharacters側（パイロットX-033-EN実走successの選択実績踏襲）。
-EN実行前提はD15（M0 Go/No-Go。文言確定は本書で完了＝実行のみ保留）。

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

### §6.1 request契約

- POST先: `POST /%eccube_admin_route%/setting/shop/order_status`（Controller:38。GET/POST同一route）。
- ボディ（urlencoded）: rootフォーム名 **`form`**（`createBuilder()`既定=FormTypeのblock prefix。
  page.ts:12-13にFormFactory.php:53の根拠記載済み）。PHPUnit:98-121が同形を逐語実証:
  `'_token' => …`＋`'OrderStatuses' => [ [ 'name'=>…, 'customer_order_status_name'=>…, 'color'=>…, 'display_order_count'=>'1'|'' ], … ]`
  → HTTPボディでは `form[_token]`・`form[OrderStatuses][<i>][name]` 等。
- collection index `<i>` はGET描画順（=sort_no昇順・Controller:42）に一致。POST側も同じfindByで
  コレクションを組むため、**GET→即POSTの同一セッション内で index↔id 対応を固定**する
  （帯行はsort_no最大で末尾index。indexずれ防止のため実行中に他プロセスがマスタを変更しない前提=§2隔離）。
- CSRF: 正規`_token`はGET応答の `#form input[name="_token"]` から取得（twig:26）。C-060は末尾1文字置換。
- DB照会: `e2e/helpers/db.ts`（docker exec psql・読取と後始末のみ）。オラクル解決: `e2e/helpers/oracle.ts` の
  `o(id, "m10_11_oracle")` 方式（**正式fixtureは未作成**。候補段階ではspec未実装のため消費なし）。
  境界値生成: `runFill(255|256, ascii, "E2E-<runid>-")`（oracle.ts:110-116）。

### §6.2 _drafts/隔離lint証跡（実測・本候補作成時に確認）

1. oracle草案は `e2e/fixtures/oracle/_drafts/m10-11_admin_base_setting_setting_shop_order_status_oracle_draft.json`
   のみに生成。**正式パス `e2e/fixtures/oracle/` 直下への書込なし**（git statusで確認可能）。
2. 正式解決器 `e2e/helpers/oracle.ts:16-25` の隔離ガード（`_drafts`・パス区切り・`..` をthrow）は
   本草案にも適用される＝正式specから本草案は解決不能（機械強制・W0で実在確認済み）。
3. 本候補は spec/page 実装・実走なし。既存 `e2e/spec/admin/m10/m10_11_*.spec.ts`・page への変更なし。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

- Playwright(GUI): C-001〜012系・C-020/021/023/025・C-030〜039・C-050/051/053・-EN各行。
- Playwright+DB照会(db.ts): C-003/009/012/024/025/031〜040/053。
- 非UI(request契約): C-022（ColorType正規化回避）・C-060（CSRF改変）。C-052（DB照会のみ）・
  C-061B（SQLログ観測＝非UI）。
- 破壊的（SEED帯行のみ更新・afterEach SEED再適用・フレッシュDB/serial前提）: C-030〜040/053/061A/061B。
- 実行保留: C-061A（cross-feature GUI観測=受注一覧セレクタ未契約）・C-061B（SQLログ観測手段未契約）・
  -EN 6行（D15待ち）。
- 聖域判定・多軸属性の正式付与はD14後（本節は候補の参考情報であり正式会計に使わない）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（観点ラベル不使用）。1候補ケース行=1 assertion bundle・
多対一は shared-observation・-EN行は対応ja行と同一親のlocale多重。**参照先の全候補行は§4に実体掲載済み
＝81↔候補の期待テキスト突合が本文内で完結する**。

### 集計（81 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **49** | 下表 |
| **TBD** | **0** | —（全bound行は§1のL1で拘束済み。実行面の保留=要実機は§9に別掲＝オラクル化不能ではない） |
| **excluded** | **32** | EX-A 検索系18（019〜036）／EX-B 相関バリ4（012〜015）／EX-C DB相関2（016〜017）／EX-D 行追加(INSERT)肯定7（037,039,041,042,044,046,047）／EX-E 委譲文1（062） |
| 合計 | **81** | 欠落0・理由なし重複0 |

- 候補ケース行総数**42**（§4.1 bound対応29＋§4.2 補完7＋-EN 6）。改訂1: C-061（旧補完）を
  母集合002のbind先C-061A/Bとしてbound対応へ移動・観測を二分（表示有無=GUI／クエリ非実行=非UI）。
- excluded根拠（各カテゴリの一次資料。**全категор実test_idを引いて期待テキストで確認済み**）:
  - **EX-A（019〜036・18件）**: 期待は全行「検索条件／実行結果の該当レコードが取得結果に含まれる（含まれない）こと」。
    本機能に検索機能なし＝GETは `findBy([], ['sort_no' => 'ASC'])`（無条件全件・Controller:42）・
    twig全文に検索フォーム要素0件（実測）・「検索条件セッションなどは本機能では更新しない」（md:273）。
    検索という操作自体が存在しないため過剰生成（一覧表示自体は001/003/081がboundで被覆＝偽陰性なし）。
  - **EX-B（012〜015・4件）**: 期待「相関バリデーションでエラー…」。Form:44-70の制約は各フィールド独立の
    NotBlank/Lengthのみ（相関constraint不存在=実測）＋「本機能では画面内の業務状態機械による順序判定はない。入力検証のみを行う。」（md:123）。
  - **EX-C（016〜017・2件）**: 期待「DBとの相関バリデーション…」。同上（UniqueEntity等DB照合constraintなし=Form:44-70実測）。
  - **EX-D（7件）**: 期待は全行「登録内容/実行結果の対象レコードが**追加されること**」（肯定側）。
    本機能に行追加経路なし: 「行の追加削除や並び順の変更はこの画面では行わず」（md:7）＋Controllerは
    findで取得した既存エンティティのみpersist・new生成なし（Controller:57-72）＝INSERTは発生し得ず
    「追加される」期待は成立不能。**最大長/最小長の受理という意味成分は更新側054/056がboundで被覆**
    （偽陰性なし）。否定側「追加されないこと」（038/043/045）は行数不変assertionへ**bound**（外さない）。
  - **EX-E（062・1件）**: 期待「OrderStatusとCustomerOrderStatus・OrderStatusColor以外のコードパスでの参照
    タイミングは各画面の実装を正とすること」＝設計書自身の他機能委譲文（md:181逐語）。本機能スコープの
    検証命題を含まない（キャッシュ反映遅れの可能性も同文の委譲範囲）。

### 81対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 「受注対応状況設定」見出し・mtb_order_status全件昇順テーブル・まとめて保存するページ | bound | C-002,C-003 (shared) |
| 002 | display_order_countが真のとき受注検索Form等で件数集計対象となるフラグ | bound | C-034（保存先列）＋C-061A/B（受注検索側出口の実体検証。実行保留＝§9） |
| 003 | 全行sort_no昇順・ID・4種入力欄・「登録」送信ボタンが見える | bound | C-003 |
| 004 | 検証通過で関連テーブル更新・成功フラッシュ「保存しました」・この画面へリダイレクト | bound | C-030(+EN) |
| 005 | 管理共通の認可失敗としてHTTP403 | bound | C-050 |
| 006 | 見出し「受注対応状況設定」・サブ見出し「基本情報設定」 | bound | C-002(+EN) |
| 007 | 色入力にform-control-color・ブラウザ標準カラーピッカー | bound | C-006 |
| 008 | （モーダル・ポップアップ）利用しないこと | bound | C-008 |
| 009 | 必須バリでエラー表示・処理未完了 | bound | C-020(+EN),C-021,C-022 |
| 010 | 必須バリでエラー表示され**ず**継続 | bound | C-035（件数表示=唯一の任意項目） |
| 011 | （MSG-001後続）当画面に遷移すること | bound | C-030 (shared) |
| 012〜015 | 相関バリでエラー（あり/なし） | **excluded** EX-B | — |
| 016〜017 | DBとの相関バリ（あり/なし） | **excluded** EX-C | — |
| 018 | mtb_order_status.display_order_countへ上書きであること | bound | C-034 (shared) |
| 019〜036 | 検索条件/実行結果の該当レコードが取得結果に含まれる（含まれない） | **excluded** EX-A | — |
| 037 | 対象レコードが**追加される**こと | **excluded** EX-D | — |
| 038 | 対象レコードが追加され**ない**こと | bound | C-038（行数不変） |
| 039 | 追加されること | excluded EX-D | — |
| 040 | フラッシュ設定後この画面へリダイレクトしGETで一覧を組み立て直す | bound | C-030 (shared) |
| 041 | 追加されること | excluded EX-D | — |
| 042 | （最大長）追加されること | excluded EX-D（受理成分は054=C-036が被覆） | — |
| 043 | （最大長+1）追加され**ない**こと | bound | C-024（拒否+行数不変） |
| 044 | （最小長）追加されること | excluded EX-D（受理成分は056=C-037が被覆） | — |
| 045 | （最小長-1）追加され**ない**こと | bound | C-025 |
| 046 | 追加されること | excluded EX-D | — |
| 047 | 追加されること | excluded EX-D | — |
| 048 | （モーダル）利用しないこと | bound | C-008 (shared) |
| 049 | 値が変更されること | bound | C-031 |
| 050 | 値が変更され**ない**こと | bound | C-024 (shared) |
| 051 | （MSG-001）値が変更されること | bound | C-030 (shared) |
| 052 | （MSG-003断片）`）を含み単一表示文言を確定できないため要ソース確認 | bound | C-023(+EN)（前提列=MSG-003。en複数形分岐はL1-022でcharacters側に確定＝要ソース確認を解消） |
| 053 | 値が変更されること | bound | C-032 (shared) |
| 054 | （最大長）値が変更されること | bound | C-036 |
| 055 | （最大長+1）値が変更され**ない**こと | bound | C-023,C-024 (shared) |
| 056 | （最小長）値が変更されること | bound | C-037 |
| 057 | （最小長-1）値が変更され**ない**こと | bound | C-020,C-025 (shared) |
| 058 | （件数表示）値が変更されること | bound | C-034 (shared) |
| 059 | 値が変更されること | bound | C-033 (shared) |
| 060 | 欠け側は初期表示では当該列が値未セットのまま | bound | C-012 |
| 061 | flush前に停止しDBは不変 | bound | C-024 (shared) |
| 062 | 以外のコードパスの参照タイミングは各画面の実装を正とする | **excluded** EX-E | — |
| 063 | 成功リダイレクト後はDBから読み直し確定済み変更を反映したHTML | bound | C-030 (shared) |
| 064 | GETによる画面表示要求であること | bound | C-002 (shared) |
| 065 | リダイレクト応答後、成功フラッシュ・更新済み入力欄を含むHTML | bound | C-030,C-031 (shared) |
| 066 | バリデーション失敗時は200でフィールドエラーを含むHTML | bound | C-020 (shared) |
| 067 | 各行OrderStatusをpersistし、同一IDの行が存在するときだけ名称・色を更新してpersist | bound | C-031,C-032,C-033（肯定側）＋C-040（否定側） |
| 068 | （sort_no）一覧取得の並べ替えキーであること | bound | C-003 (shared) |
| 069 | （display_order_count）件数表示フラグであること | bound | C-034 (shared) |
| 070 | （mtb_customer_order_status.name）名称(マイページ)であること | bound | C-032 (shared) |
| 071 | （mtb_customer_order_status.sort_no）本機能では更新しないこと | bound | C-039 |
| 072 | （mtb_order_status_color.name）色の文字列であること | bound | C-033 (shared) |
| 073 | エラー表示されず継続（画面表示データ=色） | bound | C-009 (shared) |
| 074 | 登録・更新で対象テーブルを直接保存（不要な削除は含まない） | bound | C-031〜034,C-038 (shared) |
| 075 | エラー表示されず継続（名称(受注管理)） | bound | C-009 (shared) |
| 076 | （件数表示）required falseであること | bound | C-035 (shared) |
| 077 | （未認証）利用不可であること | bound | C-001 |
| 078 | 画面表示および登録送信が評価上許可される | bound | C-053 |
| 079 | 初期データでdtb_authority_roleに/setting/shop前方一致deny_urlが紐付く | bound | C-052 |
| 080 | フラッシュ設定後この画面へリダイレクトしGETで組み立て直す | bound | C-030 (shared) |
| 081 | 「受注対応状況設定」見出し・全件昇順テーブル・まとめて保存ページ | bound | C-002,C-003 (shared) |

`func_scope_check` 判定: 親81/81会計済み・欠落0・理由なし重複0・補完9行（-EN従属2含む）は§4.2に
実体掲載（親空・設計書補完・母集合会計外）→ **差分0を本文内で実証可能**。O6は主張しない。
（改訂1再計算: bound49/TBD0/excluded32は不変。変更はbind先のみ=002へC-061A/B追加）

## §9 TBD・要実機・excluded（正直な分離）

- **TBD=0件**: 全bound行はL1（§1）で期待値拘束済み。excluded 32件は§8の一次資料根拠つき。
- **要実機（実行面の保留＝オラクル化不能ではない）**:
  1. **実DOM未検証**: L1-010のDOM id規約（`#form_OrderStatuses_<i>_…`）はtwig+Form+FormFactory由来の
     導出＋既存page実装様式。実機読取検証（CFP§5・読取専用）は未実施。
  2. **C-061A/B（cross-feature出口・母集合002のbind先）**: C-061A=受注一覧検索エリアの件数**表示有無**
     （GUI観測。別機能画面のセレクタ未契約→要実機）／C-061B=false時の件数集計クエリ**非実行**
     （GUI表示だけでは検証不能のため非UIのSQLログ観測へ分離。PG statement log等の観測手段未契約→実行保留）。
  3. **-EN 6行**: 管理画面en切替はD15（M0 Go/No-Go）待ち。文言確定は本書で100%完了。
  4. **SEED-M1011-TENANT**: dtb_memberの生成契約（パスワードハッシュ・必須列）は`@TBD-D5`。
  5. **C-051（tenant_operator 403）**: PHPUnit明示はowner側のみ。operator側はVoter+初期データからの
     導出claim（L1-032に限定を明記）。実走で乖離すれば不具合候補起票。
- **excluded=32件**: §8集計表・根拠のとおり（EX-A 18/EX-B 4/EX-C 2/EX-D 7/EX-E 1）。
- **候補規律**: 全行 `@TBD-D5`・O5未確定（暫定source_class）・spec/page実装なし・実走なし。
  0件エッジ（md:169）は破壊的（全マスタ行削除）かつ「通常起こりにくい」明記のため候補化せず
  （母集合に対応期待テキストなし＝補完も不作成。理由記録のみ）。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象構文（肯定/否定・許可/拒否の対）を列挙し、claim単位で期待テキストとの極性一致を目視確認した:

| 極性対 | 該当行 | 判定 |
|---|---|---|
| エラー表示**され**/表示され**ず** | 009 vs 010・073/075（されず） | 009→C-020/021/022（拒否側）・010→C-035（required false=許可側・L1-020）・073/075→C-009（初期表示正常系）。取り違えなし |
| 追加され**る**/され**ない** | 037,039,041,042,044,046,047（肯定）vs 038,043,045（否定） | 肯定=EX-D（INSERT経路なし=成立不能）・否定=行数不変assertionへbound。**肯定側をboundにする取り違えなし** |
| 変更され**る**/され**ない** | 049,051,053,054,056,058,059（肯定）vs 050,055,057（否定） | 肯定→C-031〜037（保存成功系）・否定→C-020/023/024/025（検証失敗DB不変系）。整合 |
| 許可/拒否 | 005,079（拒否側=403/deny初期データ）vs 078（許可側） | 005→C-050・079→C-052・078→C-053。L1-032（DENIED）/L1-033（GRANTED）に分離済み |
| 含まれる/含まれない（検索） | 019〜036 | 両極性ともEX-A（検索機能不存在）＝極性によらず除外。片極性のみ除外する誤りなし |
| 利用する/しない | 008,048,077 | 「利用しない」=モーダル不使用（C-008・L1-014）／077「利用不可」=未認証拒否（C-001・L1-001）。同語異義の混同なし |

- 052（設計書備考の断片文）は前提列のMSG-003参照から主題=Length文言と同定し、en複数形分岐を
  L1-022で解決（xlf:79逐語＋`setPlural($constraint->max)`〔LengthValidator.php:74,85〕＋パイロット-EN
  実走実績）。**憶測でなく一次資料で閉じたことを記録**。
- **codex敵対レビューR1（改訂1で反映済み・Blockerなし）**: 検出=①C-003のIDタイブレーク過大主張
  （`sort_no ASC, id ASC` の完全一致要求は未契約→撤回・検証限定）②母集合002のbind不足
  （C-061が補完のままだった→C-061A/Bとしてboundへ）③C-061の観測混同（表示有無とクエリ非実行の分離）
  ④C-030リダイレクト先の管理ルート接頭辞欠落。**excluded=32とEX-Dの肯定/否定非対称bindはcodexが
  妥当確認**（偽陰性なし）。C4対象の極性取り違えは検出されず（未検出の可能性は残る）。

---

## 作業時間・工数係数の実測記録（W1目的）

- **読了した一次資料**: 設計書md 1本（327行）／eeソース13ファイル（Controller・Form・Toggle・twig・
  Entity4・Voter・AbstractController・OrderStatusType(master)・PHPUnit・FormFactory参照は既存page注記で代替）／
  設定3（eccube.yaml・framework.yaml・security.yaml）／locale4（messages/validators ja・en）／
  vendor xlf 2／初期データcsv 4＋migrations 3／既存資産4（spec・page・db.ts・oracle.ts）／
  統治・見本3（CFP・PILOT・W0草案）＝**計約37ファイル**。
- **L1 claim数**: 38（うち新規調査を要した難所: L1-032 authority403の初期データ+Voter+PHPUnitの三点交差、
  L1-022 en複数形、L1-028 INSERT経路不存在の立証、L1-034 CSRFのroot errors非描画確認）。
- **母集合81行の期待テキスト読解・分類**: bound49/excluded32の判定（EX-Dの偽陰性回避検討が最大の難所）。
- **推定実働**: 資料読解・実測 ≈2.5h相当／L1表・TSV・81対応表の起草 ≈2.5h相当（m09-01比で
  型再利用により文書構成の設計コストはほぼゼロ）。

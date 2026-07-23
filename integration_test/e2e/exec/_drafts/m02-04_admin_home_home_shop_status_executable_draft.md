# B0候補: m02-04 管理画面_トップショップ状況 — 実行可能グレード候補（母集合81全量踏破）

> 2026-07-23 ／ **候補グレード（candidate・D6前・O5未確定・実装/実走なし）**
> codexレビュー: **R1=要修正（Major1のみ）→改訂1→R2=未閉包（対照SEEDの規格数非対称）→改訂2で是正・R3再確認待ち**
> （excluded=23/TBD=017・DOC-DRAFT-1/-2裁定・href/route識別・捏造ゼロ・extra-data根拠はcodex妥当確認済み。
> 台帳 `REVIEW_LEDGER.md` への記帳は判定確定後）。
> **改訂1（codex R1是正・Major1件）**: BC-DRAFT-m02-04-1の確定観測C-021が非識別的
> （stock=0商品の「出現」だけでは無フィルタでも真になり乖離を判別不能）→
> (1) **対照商品（同一他条件・ps.stock>0）をSEED追加**し、観測を「設計期待=対照商品が遷移後一覧に**不在**／
> 現実装乖離時=フィルタ無視で**出現**」の2商品在/不在判定へ拡張（SEED-M0204-STOCK-CONTROL新設・C-021書換）
> (2) **BC根拠の精度是正**: 「Form submitで未知キー脱落」は不正確→ 管理側SearchProductTypeは `stock` 未定義かつ
> `allow_extra_fields` 未設定（Symfony既定 **false**=FormTypeValidatorExtension.php:58-59）＝submitされた `stock` は
> **formのextra dataとなり検証エラー対象**（FormValidator.php:191-200）で、`getData()` は検索条件へ渡さず、
> `getQueryBuilderBySearchDataForAdmin()` に `stock` 分岐なし、へ差し替え（L1-011/§9-3/oracle json同期）。
> **改訂2（codex R2是正・対照SEEDの規格数対称化）**: SEED-M0204-STOCK-CONTROLの規格が単数で
> NONSTOCK（規格2件）と非対称＝C-021の「在庫以外同一条件」がSEED契約で裏付かなかった→
> **CONTROLをNONSTOCKと同数・同属性の規格2件（pc=900002413/900002414・商品/規格/ps全属性一致）とし、
> 対応する ps.stock のみ相違（NONSTOCK=各規格0／CONTROL=各規格10）** を§2のSEED契約に明記。
> C-021の同一条件記述をSEED契約由来へ更新し、在庫切れ判定EXISTS（Controller:441-463）が規格単位である
> ことを識別成立の根拠として付記（§2/§4 C-021/§1 L1-011/§9-3/oracle json同期）。
> source_class=standard-src+design は fid_kubun.tsv（D1・fid_kubun.tsv:166）による**暫定付与**（確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> fixture_version は全て `@TBD-D5`。統治: `integration_test/CONCRETIZATION_FIRST_PLAN.md`（三段会計）＋
> `integration_test/CONCRETIZATION_ROLLOUT_PLAN.md`（B0。B0確定25 fidリスト=M02-04を含む）。
> 正典: `integration_test/e2e/PILOT_m09_01_news_executable_grade.md`／同型見本: codex承認済み候補8本
> （m09-01・m05-16・m10-11・m03-11・m01-01・m01-02・m02-01・m02-02 の各 `_drafts/*_executable_draft.md`。
> 特に m02-01〔href/id識別・環境依存マスタ〕・m02-02〔read-only裁定・digest SQL〕と同型）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m02-04_admin_home_home_shop_status_oracle_draft.json`。
> 正式パス `e2e/fixtures/oracle/` 直下には書かない。
> **行数集計**: 候補ケース行総数**27**＝bound対応24（ja23＋-EN1）＋補完3（ja3）。
> 母集合81=bound57＋TBD1＋excluded23。
> **不具合候補/設計書矛盾候補**: BC-DRAFT-m02-04-1（在庫なし条件の商品一覧側不消費疑い=§9-3）・
> DOC-DRAFT-m02-04-1（設計書DBカラム節の `dtb_product_class.stock` はeeに不実在=§9-1）・
> DOC-DRAFT-m02-04-2（DB操作節のread-onlyテンプレ矛盾=§9-2）。

## §0 版固定

- 設計書正本: `functions/ec-cube-enterprise/m02-04_admin_home_home_shop_status.md`（本repo HEAD
  `d1e94c5e38246d0eff45b4079ee42397c994e69d` 時点。以下「md:行」）。
- ee実ソース: `/home/y-saito/Developments/ec-cube-enterprise/` コミット
  `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51`（W0-B0既候補と同一）。
- fid_kubun.tsv（D1・sha256先頭 `44fbf02f1e4c`）:
  `M02-04｜m02-04_admin_home_home_shop_status｜ショップ状況｜対象｜標準｜ec-cube-enterprise/m02-04_admin_home_home_shop_status.md｜standard-src+design｜0`（fid_kubun.tsv:166）→ **標準＝ee実ソース直接可＋設計書md**（暫定付与・確定はD6）。
- 母集合: baseline `integration_test/all_it_cases.tsv`（sha256先頭 `7911f190d273`）M02-04全**81行**
  （IT-M02-04-ADMIN-HOME-HOME-SHOP-STATUS-001〜081。以下「-nnn」）。
- 本機能はカスタマイズ区分=**標準**（md:17「挙動・画面とも移行先のec-cube-enterpriseの実装を正とする。
  DB関連の記述（テーブル名・列名・集計列）もec-cube-enterpriseを正とする」）。
- **判定原則（W0-W2教訓）**: 観点ラベル・前提条件/入力データ列のシナリオ語は**生成器ノイズ**。bindは各行の
  **「期待結果／レスポンス」実テキスト**で判定し、極性も期待テキストで確認する（§8に全81行の期待要旨併記）。
  例: -001は観点ラベル「CSRF」だが期待テキストは在庫切れ商品数の定義＝集計ケースへbind（CSRFは本機能に
  フォームPOSTがなく非該当）。IT-26系の「追加される/変更される」定型はread-only機能への過剰生成（§9-2裁定）。
- 既存実行実績（参考・本候補の会計外）: `integration_test/e2e/m02_04_admin_home_home_shop_status_e2e_cases.md`
  （2026-07-06 Codex実走 **10〇/17×**。×は集計値突合・0件保証・非管理者シード・一覧側反映確認・障害注入の
  ハーネス/SEED未実装による未実施＝実装乖離の検出ではない。本候補は×側のうち集計値突合を**db.ts三段参照**で、
  検索条件上書き反映を**cross-feature観測（要実機・BC-DRAFT付き）**で実行可能グレードへ引き上げる）。
- 既存道具（実装済み・再利用）: `e2e/helpers/db.ts`（psql照会）・`e2e/helpers/oracle.ts`（L1解決器＋_drafts
  隔離ガード）・`e2e/pages/admin/m02/m02_04_admin_home_home_shop_status.page.ts`（#shop-statistical・
  行リンク・.h4件数・アイコンのセレクタ実装済み・2026-07-06実走10〇で実機実績）。SEED実体は**未実装**
  （§2は設計・D5型契約）。
- 主要一次資料の略記:
  - Controller = `src/Eccube/Controller/Admin/AdminController.php`
  - twig = `src/Eccube/Resource/template/admin/index.twig`（ショップ状況カード=218-271）
  - ProductStock = `src/Eccube/Entity/ProductStock.php`（dtb_product_stock）／TenantTrait = `src/Eccube/Entity/Traits/TenantTrait.php`
  - ProductStatus = `src/Eccube/Entity/Master/ProductStatus.php`／CustomerStatus = `src/Eccube/Entity/Master/CustomerStatus.php`
  - ProductCtl = `src/Eccube/Controller/Admin/Product/ProductController.php`（商品一覧側・cross-feature確認用）
  - CustomerCtl = `src/Eccube/Controller/Admin/Customer/CustomerController.php`（会員一覧側・cross-feature確認用）
  - SearchProductType = `src/Eccube/Form/Type/Admin/SearchProductType.php`／SearchCustomerType = `src/Eccube/Form/Type/Admin/SearchCustomerType.php`
  - ja/en = `src/Eccube/Resource/locale/messages.{ja,en}.yaml`
- **設計書矛盾の裁定2件（詳細§9-1/§9-2。両方とも期待値を捏造しないための裁定）**:
  - **DOC-DRAFT-m02-04-1（在庫数量の実体列）**: 設計書DBカラム節は `dtb_product_class`の`stock` を在庫切れ条件列と
    明記し（md:204）、リニューアル節は「いずれもec-cube-enterpriseのエンティティ定義で実在を確認した名称」
    （md:50）と主張する。しかし**ee実体の `ProductClass` に `stock` 列は存在しない**（ProductClass.php全文grep=
    stock_unlimited:187-188・visible:202-203のみ。在庫は `ProductStock`〔dtb_product_stock〕へ分離）。実装の
    在庫切れ集計は `dtb_product_stock.stock = 0`（**EC-CUBE拠点・ルート店舗限定**）で判定する
    （Controller:441-463）。md:17/md:50自身が「DB関連はec-cube-enterpriseを正とする」「確認できない差分が生じた
    場合は推測でスキーマを補わず、ec-cube-enterprise実装で要確認とする」と宣言しているため、**裁定: 集計式の
    観測SQLは実装（dtb_product_stock）を正**とし、設計書DBカラム節の列名は上流是正の申し送り（DOC-DRAFT）。
    利用者観点の期待（「在庫無制限でなく在庫数量が0の規格を持つ商品の件数」md:59）は維持し、「在庫数量」の
    実体解決のみ実装層条件として§6.3に明示する。
  - **DOC-DRAFT-m02-04-2（read-only裁定）**: DB操作節（md:216）は
    `登録/更新｜dtb_customer / dtb_product / dtb_product_class｜当機能が行う登録・更新で対象テーブルを直接保存する…persist/flush による即時反映` と記すが、同一設計書の**4箇所**（md:27「台帳・マスタの更新…が無いことの明示」・
    md:169「本ブロックは参照のみであり、商品、商品規格、会員の更新は行わない」・md:191「ホーム表示処理だけを
    見ると、商品・会員・受注等の台帳を更新しない」・md:315「参照のみであり、業務トランザクションを張って商品・
    会員を変更しない」）が**参照のみ**と明記し、ee実装も index/searchNonStockProducts/searchCustomer/count系に
    persist/flush/INSERT/UPDATE が**0件**（grep実測。countクエリ＋session.set＋redirectのみ）。既存記録
    `m02_04_..._e2e_cases.md` 付帯表4#5も同矛盾を要確認登録済み。**裁定: read-onlyを正**とし、DB操作節はテンプレ
    ノイズと判定（期待値を「登録される」側に捏造しない）。リンク経由の副作用は**検索条件セッション書込のみ**
    （md:191後段）であり台帳更新ではない。この裁定が§8のIT-26/IT-05系肯定14行のexcluded判定根拠。

## §1 L1原子オラクル表

全24行=**23claim確定＋L1-M0204-024 TBD**。本機能はフォーム・入力・保存を持たない参照＋導線ブロックのため
文字数系unitなし。LS=locale_sensitive（0は理由コード）。en文言はen一次資料逐語（ja翻訳ゼロ）。
**期待値の正は本表のオラクルID**（SEED値・DB照会値は入力再現手段/観測値＝三段参照）。`%eccube_admin_route%` は
環境値（既定 `admin`・env ECCUBE_ADMIN_ROUTE=eccube.yaml:69）。root店舗ID=環境値（`eccube_root_base_info_id`＝
env BASE_INFO_ID・既定 `1`＝eccube.yaml:59,303。実環境値はD5確認=§9-6）。

| oracle_id | 観点 | claim | 逐語quote | 根拠(file:line) | LS |
|---|---|---|---|---|---|
| L1-M0204-001 | auth_rule | 未認証の `GET /%eccube_admin_route%/` は admin firewall（`^/%eccube_admin_route%/`=ROLE_ADMIN必須）の form_login により admin_login のログイン画面へ誘導され、ホーム（ショップ状況カード #shop-statistical）へ到達しない。各行リンク先（/search_nonstock・/product・/search_customer）も同一firewall配下 | `admin:`＋`    pattern: ['^/%eccube_admin_route%/','^/%eccube_messenger_route%/']`＋`    provider: member_provider`＋`    form_login:`…`        login_path: admin_login`／`['path' => '^/%eccube_admin_route%/', 'roles' => 'ROLE_ADMIN'],`／「非管理者・未認証｜`GET /%eccube_admin_route%/` などの管理側URL｜ホーム画面自体に到達できないため、本カードも利用できない」「未認証｜利用不可。管理領域の認証要件に従いログイン等へ誘導される」 | security.yaml:40-47／EccubeExtension.php:81-88／md:75,233 | 0 `non-translated` |
| L1-M0204-002 | http_status | ホーム=`GET /%eccube_admin_route%/`（route `admin_homepage`・GETのみ）。認証済み管理者にHTTP200でダッシュボードを表示し、ショップ状況カードはその一部ブロック | `#[Route(path: '/%eccube_admin_route%/', name: 'admin_homepage', methods: ['GET'])]`＋`#[Template(template: '@admin/index.twig')]`／「ホーム画面を開く｜`GET /%eccube_admin_route%/`」「ホーム画面｜管理者認証後に表示されるダッシュボード。ショップ状況はその一部ブロックである」 | Controller:102-104／md:71,63 | 0 `non-ui-observable` |
| L1-M0204-003 | display_field | カードDOM一式: `#shop-statistical`（card共通クラス）内に、見出し `.card-title`＝`admin.home.shop_status_title` ja「ショップ状況」/en "Shop Status"（リンクでないspan・card-header内）と、card-body内に**縦3行**。各行= `a`（行リンク・`p-3 d-block`）内に アイコン `i.fa`（fa-inbox/fa-cubes/fa-users）＋ラベル `span`＋件数 `span.h4`。ラベル= ja「在庫切れ商品数」「取扱商品数」「会員数」/en "Number of Out-of-Stock Items"/"Number of Products"/"Number of Customers"（会員数行の見出しは「会員数」だが集計は本会員限定=md:61）。行リンクhref= `url('admin_homepage_nonstock')`／`url('admin_product')`／`url('admin_homepage_customer')`。カード内に form/input/textarea/select/modal 要素0件（grep実測） | `<div id="shop-statistical" class="card rounded border-0 h-100">`／`<span class="card-title">{{ 'admin.home.shop_status_title'\|trans }}</span>`／`<a href="{{ url('admin_homepage_nonstock') }}" class="p-3 d-block">`…`<i class="fa fa-inbox fa-2x text-secondary" aria-hidden="true"></i>`…`<span class="align-middle">{{ 'admin.home.shop_status_out_of_stock'\|trans }}</span>`…`<span class="h4 align-middle fw-normal text-dark">{{ countNonStockProducts\|number_format }}</span>`（products/customers行は fa-cubes/fa-users・url('admin_product')/url('admin_homepage_customer') で同型）／`admin.home.shop_status_title: ショップ状況`・`admin.home.shop_status_out_of_stock: 在庫切れ商品数`・`admin.home.shop_status_products: 取扱商品数`・`admin.home.shop_status_customers: 会員数`／`admin.home.shop_status_title: Shop Status`・`admin.home.shop_status_out_of_stock: Number of Out-of-Stock Items`・`admin.home.shop_status_products: Number of Products`・`admin.home.shop_status_customers: Number of Customers`／「ショップ状況カードには、見出しと、在庫切れ商品数・取扱商品数・本会員数に対応する3行を表示する。各行はアイコン・ラベル・件数で構成し」「管理画面共通のカード、行、アイコン、余白、枠線のクラスを使い、3行を縦に並べて表示する」 | twig:218-271（title:221・links:226,241,256・icons:229,244,259・labels:232,247,262・counts:235,250,265）／ja:1875-1878／en:1853-1856／md:58,61,83,85 | 1 |
| L1-M0204-004 | display_format | 件数3指標は `number_format` フィルタ（Twig既定 `[0, '.', ',']`＝小数0桁・3桁カンマ区切り）による**整数・桁区切り**表示。金額・税・丸め計算なし。正規形= `^(0\|[1-9][0-9]{0,2}(,[0-9]{3})*)$`（カンマが実際に現れるのは1,000以上） | `{{ countNonStockProducts\|number_format }}`（countProducts/countCustomers同型）／`private $numberFormat = [0, '.', ','];`＋`return number_format((float) $number, $decimal, $decimalPoint, $thousandSep);`／「3 指標はいずれも整数件数として表示し、画面では桁区切りを適用する。金額計算、税計算、丸め処理は行わない」 | twig:235,250,265／vendor/twig/twig/src/Extension/CoreExtension.php:133,690／md:141,83 | 0 `non-translated` |
| L1-M0204-005 | aggregation_rule | 在庫切れ商品数= `COUNT(DISTINCT p.id)`: 商品pと商品規格pcを**内部結合**し、`pc.stock_unlimited = false` かつ `pc.visible = true` かつ **EXISTS（`dtb_product_stock` ps: `ps.product_class_id = pc.id` かつ `ps.stock = 0` かつ `ps.base_info_id = root店舗` かつ `ps.stock_location_id = 1`〔EC-CUBE拠点〕）** を満たす規格を少なくとも1つ持つ商品を**商品ID一意**で数える。商品本体のステータス条件なし（廃止でも算入）。商品p側にテナント（base_info）条件なし（在庫EXISTSのみroot店舗×EC-CUBE拠点に限定）。**在庫数量の実体列は dtb_product_stock.stock（DECIMAL(10,0) NULL可）＝設計書DBカラム節のdtb_product_class.stockは不実在（DOC-DRAFT-m02-04-1・§9-1裁定=実装を正）** | `$qb = $this->productRepository->createQueryBuilder('p')`＋`    ->select('count(DISTINCT p.id)')`＋`    ->innerJoin('p.ProductClasses', 'pc')`＋`    ->where('pc.stock_unlimited = :StockUnlimited')`＋`    ->andWhere('pc.visible = :visible')`＋`    ->andWhere('EXISTS ( SELECT 1 FROM \Eccube\Entity\ProductStock ps WHERE ps.ProductClass = pc AND ps.stock = 0 AND IDENTITY(ps.baseInfo) = :baseInfoId AND ps.stockLocationId = :eccubeStockLocationId )')`＋`->setParameter('StockUnlimited', false)->setParameter('visible', true)`／`public const STOCK_LOCATION_ECCUBE = 1;`／「在庫切れ商品数｜商品とその商品規格を内部結合する。規格について `stock_unlimited` が偽、かつ `stock` が 0、かつ `visible` が真である行が存在する商品について、商品 ID を一意に数える。商品本体のステータスでさらに絞り込む条件は課していない」「同一商品に複数規格が該当しても商品は 1 として数える」 | Controller:441-463／ProductStock.php:25,39,80-81,263-264／TenantTrait.php:24-26／ProductClass.php:34,187-188,202-203,236-237／eccube.yaml:59,303／md:59,126,138,152 | 0 `non-translated` |
| L1-M0204-006 | aggregation_edge | 在庫切れに**数えない**規格/商品: ①在庫無制限（stock_unlimited=true）は在庫数量0でも不算入 ②非表示規格（visible=false）は在庫数量0でも不算入 ③在庫数量が0でない（正数・負数・NULL）は不算入（`ps.stock = 0` に不一致。NULLは比較不成立） ④商品規格を持たない商品は内部結合により不算入 ⑤同一商品の複数在庫切れ規格は商品1件（DISTINCT） | 「在庫無制限の商品規格｜在庫数量が 0 でも在庫切れ商品数には数えない」「在庫数量が 0 ではない商品規格｜在庫数量が正数、負数、NULL のいずれでも…数えない」「非表示の商品規格｜在庫数量が 0 でも在庫切れ商品数には数えない」「商品規格を持たない商品｜在庫切れ商品数では商品規格と内部結合するため数えない」「1 商品に複数の在庫切れ商品規格がある｜商品 ID を一意に数えるため…1 件として数える」 | md:148-152／Controller:445-460（式の対偶＝L1-005） | 0 `non-translated` |
| L1-M0204-007 | aggregation_rule | 取扱商品数= `COUNT(p.id)`: 商品ステータスが公開（DISPLAY_SHOW=1）または非公開（DISPLAY_HIDE=2）の商品。廃止（DISPLAY_ABOLISHED=3）は不算入。商品規格の有無を条件にしない（規格なし商品も公開/非公開なら算入）。テナント条件なし | `$qb = $this->productRepository->createQueryBuilder('p')->select('count(p.id)')->where('p.Status in (:Status)')->setParameter('Status', [ProductStatus::DISPLAY_SHOW, ProductStatus::DISPLAY_HIDE]);`／`public const DISPLAY_SHOW = 1;`・`public const DISPLAY_HIDE = 2;`・`public const DISPLAY_ABOLISHED = 3;`／「取扱商品数｜商品のステータスが「公開」または「非公開」に属する商品を数える。「廃止」は対象外とする」「商品規格を持たない商品｜…取扱商品数では商品規格の有無を条件にしないため、商品ステータスが公開または非公開なら数える」「廃止ステータスの商品｜取扱商品数には数えない」 | Controller:470-478／ProductStatus.php:25,39,49,61／Product.php:36,577-578／md:60,127,139,148,153 | 0 `non-translated` |
| L1-M0204-008 | aggregation_rule | 本会員数= `COUNT(c.id)`: 会員ステータス=本会員（REGULAR=2）のみ。仮会員（PROVISIONAL=1）・退会（WITHDRAWING=3）は不算入。**ORM共通フィルタ customer_delete_filter（enabled: true）により `del_flg = 0` が実効条件に加わる**（論理削除済み会員は不算入=db.ts突合SQLの条件整合のための実装層claim。設計はグローバルフィルタの詳細列挙をスコープ外と明記=md:130） | `$qb = $this->customerRepository->createQueryBuilder('c')->select('count(c.id)')->where('c.Status = :Status')->setParameter('Status', CustomerStatus::REGULAR);`／`public const PROVISIONAL = 1;`・`public const REGULAR = 2;`・`public const WITHDRAWING = 3;`／`customer_delete_filter:`＋`    class: Eccube\Doctrine\Filter\CustomerDeleteFilter`＋`    enabled: true`＋`return sprintf('%s.del_flg = 0', $alias);`／「本会員数｜会員のステータスが本会員である行のみを数える」「仮会員・退会会員｜本会員数には数えない」「グローバルフィルタや永続化層の共通規則による対象行の扱いは、各共通機能の設計を正とする」 | Controller:485-493／CustomerStatus.php:23,46,51,56／Customer.php:38,187-188,1286／doctrine.yaml:81-83／CustomerDeleteFilter.php:31／md:61,128,140,154,130 | 0 `non-translated` |
| L1-M0204-009 | empty_rule | 該当データ0件の指標は件数 **0** を表示（COUNT集約は常に1行を返し0・number_format(0)="0"）。エラー表示なしで画面継続（DB照会が空集合でも相関系のエラーにならない） | 「該当データが 0 件｜件数は 0 として表示する」／`->select('count(DISTINCT p.id)')`等（COUNT集約=空集合でも0を返す）＋`{{ …\|number_format }}` | md:155／Controller:446,473,488／twig:235,250,265 | 0 `non-translated` |
| L1-M0204-010 | nav | 在庫切れ商品数行リンク= `GET /%eccube_admin_route%/search_nonstock`（route `admin_homepage_nonstock`・GET）→ セッションキー `eccube.admin.product.search` を **`['stock' => [ProductStock::OUT_OF_STOCK(=2)]]` のみの配列で set（上書き・マージなし）** → `admin_product_page`（`/product/page/1`）へリダイレクト（商品一覧の1ページ目） | `#[Route(path: '/%eccube_admin_route%/search_nonstock', name: 'admin_homepage_nonstock', methods: ['GET'])]`＋`$searchData = [];`＋`$searchData['stock'] = [ProductStock::OUT_OF_STOCK];`＋`$session->set('eccube.admin.product.search', $searchData);`＋`return $this->redirectToRoute('admin_product_page', ['page_no' => 1,]);`／`public const OUT_OF_STOCK = 2;`／「在庫切れ商品数の行を押下｜`GET /%eccube_admin_route%/search_nonstock`｜在庫なし条件を商品一覧向け検索条件として保存し、商品一覧へ遷移する」「既存の検索条件は本処理ではマージせず、当該セッション領域をこの配列で上書きする」「商品一覧の1ページ目へリダイレクトする」 | Controller:302-314／ProductStock.php:32／twig:226／md:72,102-104,156,252 | 0 `non-translated` |
| L1-M0204-011 | cross_feature（**乖離検出対象**） | 設計md:252「商品一覧の1ページ目で、保存した在庫なし条件を初期条件として扱う」。**一方 ee商品一覧の受け側は当該条件を消費しない疑い**: page_no付きGETはセッションviewDataを `SearchProductType` へ submit して復元するが、**SearchProductType に `stock` フィールドが不存在**（フィールド全列挙grep: 在庫系は stock_from/stock_to のみ）かつ `allow_extra_fields` 未設定（Symfony既定 **false**）＝submitされた `stock` は**formのextra dataとなり検証エラー対象**（NO_SUCH_FIELD_ERROR）で、`getData()` の検索条件には含まれない。さらに `getQueryBuilderBySearchDataForAdmin` にも `searchData['stock']` の処理（分岐）が不存在（`'stock'`キー処理はフロント用 applyFrontProductListInStockOnlyFilter のみ）→ **設計期待と実装の乖離＝BC-DRAFT-m02-04-1**。期待値は設計側のまま（実装へ寄せない）。観測は商品一覧側（cross-feature）＝要実機で乖離確定（**識別観測=対照商品方式**: §2の対称SEED契約〔規格数2・商品/規格/ps全属性一致・対応するps.stockのみ0/10で相違〕に基づく対照商品が、設計期待では遷移後一覧に**不在**・現実装ではフィルタ無視で**出現**＝2商品の在/不在で判別。EXISTS判定が規格単位のため対称契約下で識別が成立。C-021・改訂1/改訂2） | 「商品一覧の1ページ目で、保存した在庫なし条件を初期条件として扱う」／`$viewData = $this->session->get('eccube.admin.product.search', []);`＋`$searchData = FormUtil::submitAndGetData($searchForm, $viewData);`（ProductCtl）＋`public static function submitAndGetData(FormInterface $form, mixed $viewData): mixed { $form->submit($viewData); return $form->getData(); }`／SearchProductType.php:74-402（`->add('stock'…` 不出現・stock_from:267/stock_to:275のみ・`allow_extra_fields` 不出現=grep実測）／`'allow_extra_fields' => false,`＋`'extra_fields_message' => 'This form should not contain extra fields.',`（Symfony既定）／`// Mark the form with an error if it contains extra fields`＋`if (!$config->getOption('allow_extra_fields') && \count($form->getExtraData()) > 0) {`…`->setCode(Form::NO_SUCH_FIELD_ERROR)`／ProductRepository.php:1071-（ForAdminに `searchData['stock']` 不出現。890はフロント用） | md:252,105／ProductCtl:209-221,246／FormUtil.php:47-52／SearchProductType.php:74-402／vendor/symfony/form/Extension/Validator/Type/FormTypeValidatorExtension.php:58-59／vendor/symfony/form/Extension/Validator/Constraints/FormValidator.php:191-200／ProductRepository.php:888-902,1071,1287-1298 | 0 `non-ui-observable` |
| L1-M0204-012 | nav | 取扱商品数行リンク= `url('admin_product')`＝`GET /%eccube_admin_route%/product` への**直リンク**（専用GETルート不経由・リダイレクトなし）。ショップ状況側では検索条件セッションを書き込まない（Controllerの `session->set` は searchNonStockProducts:309／searchCustomer:325 の2箇所のみ=grep実測）。遷移後の初期状態は商品一覧機能の既定動作（ee既定: page_no/resumeなしGETは「初期表示の場合は検索前のため商品一覧を表示しない」＋検索フォーム初期値のviewDataでセッションを上書き）に従う=委譲（一覧側の既定動作自体の正は商品一覧機能設計） | `<a href="{{ url('admin_product') }}" class="p-3 d-block">`／`#[Route(path: '/%eccube_admin_route%/product', name: 'admin_product', methods: ['POST', 'GET'])]`／`// 初期表示の場合は検索前のため商品一覧を表示しない.`＋`$viewData = FormUtil::getViewData($searchForm);`＋`$this->session->set('eccube.admin.product.search', $viewData);`／「取扱商品数の行を押下｜`GET /%eccube_admin_route%/product`｜商品一覧へ遷移する。ショップ状況側では商品一覧向けの検索条件を事前に書き込まない」「取扱商品数のリンク押下前に商品一覧検索条件が残っている｜ショップ状況側では検索条件セッションを更新しない。遷移後の初期状態は商品一覧機能の既定動作に従う」 | twig:241／ProductCtl:122-123,209,223-227／Controller:302-330（set 2箇所のみ）／md:73,109-111,158,253 | 0 `non-translated` |
| L1-M0204-013 | nav＋cross_feature | 会員数行リンク= `GET /%eccube_admin_route%/search_customer`（route `admin_homepage_customer`・GET）→ セッションキー `eccube.admin.customer.search` を **`['customer_status' => [CustomerStatus::REGULAR(=2)]]` のみの配列で set（上書き・マージなし）** → `admin_customer_page`（`/customer/page/1`）へリダイレクト。**受け側（会員一覧）は当該条件を消費する**: page_no付きGETでセッションviewDataを `SearchCustomerType` へ submit（`customer_status` フィールド実在・multiple）し、`CustomerRepository` が `c.Status IN (:statuses)` を適用→ 本会員のみが初期検索条件として扱われる（一覧側の具体的な画面観測面=セレクタは要実機=§9-4） | `#[Route(path: '/%eccube_admin_route%/search_customer', name: 'admin_homepage_customer', methods: ['GET'])]`＋`$searchData = [];`＋`$searchData['customer_status'] = [CustomerStatus::REGULAR];`＋`$session->set('eccube.admin.customer.search', $searchData);`＋`return $this->redirectToRoute('admin_customer_page', ['page_no' => 1,]);`／`->add('customer_status', CustomerStatusType::class, [ … 'multiple' => true,`／`$viewData = $session->get('eccube.admin.customer.search', []);`＋`$searchData = FormUtil::submitAndGetData($searchForm, $viewData);`／`if (isset($searchData['customer_status']) && StringUtil::isNotBlank($searchData['customer_status'])) { $qb->andWhere($qb->expr()->in('c.Status', ':statuses'))->setParameter('statuses', $searchData['customer_status']); }`／「会員数の行を押下｜`GET /%eccube_admin_route%/search_customer`｜本会員条件を会員一覧向け検索条件として保存し、会員一覧へ遷移する」「会員一覧の1ページ目で、保存した本会員条件を初期条件として扱う」 | Controller:319-330／twig:256／CustomerCtl:69-70,142-160／SearchCustomerType.php:69-75／CustomerRepository.php:429-433／md:74,115-118,157,254 | 0 `non-translated` |
| L1-M0204-014 | nav_rule | 上書きの意味論（在庫切れ・会員数リンク共通）: `$searchData = []` から**当該条件1キーだけ**を構築した配列で `session->set` する＝既存の検索条件セッションとの**マージなし・完全上書き**（他キーは消える）。既存条件が何であっても遷移後の初期条件は当該条件のみ | `$searchData = [];`＋`$searchData['stock'] = [ProductStock::OUT_OF_STOCK];`＋`$session->set(…)`（customer側も同型）／「在庫切れ商品数のリンク押下前に商品一覧検索条件が残っている｜既存の検索条件をマージせず、在庫なし条件だけの検索条件で上書きする」「会員数のリンク押下前に…｜既存の検索条件をマージせず、本会員条件だけの検索条件で上書きする」 | Controller:306-309,322-325／md:156-157,103,116 | 0 `non-ui-observable` |
| L1-M0204-015 | db_effect(read-only) | ホーム表示・3リンク遷移のいずれも `dtb_product`・`dtb_product_class`・`dtb_product_stock`・`dtb_customer` および参照マスタ（`mtb_product_status`・`mtb_customer_status`）へ**登録/更新/削除を行わない**（index/searchNonStockProducts/searchCustomer/count系に persist/flush/INSERT/UPDATE 0件=grep実測。処理はSELECT＋session.set＋redirectのみ）。観測契約: 表示＋リンク操作の前後で各テーブルの行数・主キー順全列ダイジェスト不変（§6.3c）。**前提=標準環境**: index()は `ADMIN_ADMIM_INDEX_COMPLETE` 等をdispatchするため（L1-022）、書込みlistenerを差し込むプラグイン導入環境では無書込を主張できない。設計書DB操作節（md:216）は**DOC-DRAFT-m02-04-2（§0裁定）のテンプレノイズ**であり期待にしない。リンク経由の副作用=検索条件セッション書込とリダイレクトのみ（台帳更新でない） | 「本ブロックは参照のみであり、商品、商品規格、会員の更新は行わない」「ホーム表示処理だけを見ると、商品・会員・受注等の台帳を更新しない。リンク経由では検索条件セッションへの書き込みとリダイレクトが起きる」「本ブロックの件数表示は参照のみであり、業務トランザクションを張って商品・会員を変更しない」「台帳・マスタの更新、専用の業務監査ログが無いことの明示」／Controller:104-205,302-330,441-493（persist/flush不出現=grep 0件） | md:169,191,315,27／Controller:104-205,302-330,441-493 | 0 `non-ui-observable` |
| L1-M0204-016 | refresh | 表示中の3指標は**自動更新しない**（本ブロック専用JSなし・ポーリング/Ajax更新なし。index.twigのJSはグラフ用sale_chart=別ブロックのみ）。表示後に商品・商品規格・会員が更新されても表示中の数値は不変で、ホーム再表示時にその時点の永続化済みデータを読んだ再集計値を表示する | 「参照時点｜ショップ状況の3指標は、ホーム画面表示時にそれぞれデータベースから読み取った件数である。表示後に商品・商品規格・会員が更新されても、表示中の数値は自動更新しない」「バッチによって商品・商品規格・会員が更新済みの場合、次回のホーム画面表示時にその時点の永続化済みデータを読む」「本ブロックは表示時点の永続化済みデータだけを読む」「ホーム表示時点のスナップショットであり、リアルタイムダッシュボードではない」 | md:166,179,170,265／twig:218-271（script 0件=grep実測） | 0 `data-passthrough` |
| L1-M0204-017 | ssr/no_api | 3指標の件数はホーム画面HTMLの**サーバ側レンダリング**に含まれ（twigが `countNonStockProducts` 等を直埋め・index()同期実行）、本ブロックは件数表示のための**専用APIを呼び出さない**（XHR/fetchなし。`admin_homepage_sale` は売上グラフ=別機能md:12） | 「API｜本ブロックは件数表示のために専用 API を呼び出さない。ホーム画面の画面全体をサーバ側で HTML として組み立てる処理のなかで、件数だけをデータベースから読み取る」「成功時出力｜ホーム画面ではサーバ側が HTML を組み立て、その一部としてショップ状況カードに…各件数を載せる」／`$countNonStockProducts = $this->countNonStockProducts();`（index内同期）＋`{{ countNonStockProducts\|number_format }}` | md:178,189,12／Controller:159-169,193-204／twig:235,250,265 | 0 `non-ui-observable` |
| L1-M0204-018 | no_batch | 本ブロックはバッチを起動しない（Controller:104-205,302-330にコマンド/プロセス起動なし=静的実測で確定）。**サーバ側バッチ起動有無の実行時観測手段は未契約**（§9-8。DB不変の部分観測はC-030が被覆） | 「バッチ｜本ブロックはバッチを起動しない。バッチによって商品・商品規格・会員が更新済みの場合、次回のホーム画面表示時にその時点の永続化済みデータを読む」 | md:179／Controller:104-205,302-330 | 0 `non-ui-observable` |
| L1-M0204-019 | isolation | API呼び出しやバッチ実行の成否を本ブロック内で判定しない（カード内に成否判定に基づく表示分岐・専用フォールバック/エラー文言を持たない。twig:218-271に条件分岐によるエラー表示要素なし=静的実測）。DB読み取り失敗時はアプリ共通例外処理へ委譲（本ブロック専用の利用者向けメッセージなし）。一次資料から確定できるのはここまで（他ブロック失敗時の挙動は導けない=m02-01改訂1と同判断） | 「失敗時｜API 呼び出しやバッチ実行の成否を本ブロック内で判定しない。件数取得のデータベース読み取りに失敗した場合は、アプリケーションの共通例外処理に委ねる」「失敗時出力｜…本ブロック単体のフォールバック文言は専用に定義しない」 | md:180,190／twig:218-271 | 0 `non-translated` |
| L1-M0204-020 | input | 入力=ホーム画面表示要求および各リンクのGET要求のみ。フォームPOSTなし。ホーム表示はクエリ/ボディ入力で本ブロックの表示を制御しない（index()の `$request` 使用はEventArgs引渡しのみ=クエリ読取なし・実測）→ 不要クエリを付与してもカードの行・件数は不変 | 「入力｜ホーム画面表示要求、および各リンクの GET 要求。フォーム POST は持たない」／`public function index(Request $request): array`（$requestはEventArgs組立てのみに使用=Controller:121-127,143-148,171-184） | md:188／Controller:104-205 | 0 `non-translated` |
| L1-M0204-021 | session/cookie | ホーム画面**表示時**はショップ状況ブロックのためのセッション書込を行わない（session.setは行リンク先の searchNonStockProducts/searchCustomer のみ=grep実測）。本機能はショップ状況表示のための新規Cookieを設定しない（セッションCookieは管理画面全体の認証用） | 「ホーム画面表示時｜ショップ状況ブロックの表示のためだけにセッションを更新しない」「本機能はショップ状況表示のためだけに新たな Cookie を設定しない。ブラウザのセッション Cookie はフレームワークおよび管理画面全体の認証に用いられる」／Controller:104-205にsession->set不出現（set=309,325のみ） | md:298,301,309／Controller:104-205,309,325 | 0 `non-ui-observable` |
| L1-M0204-022 | ext_hook | ホーム組み立て終盤の拡張イベント `ADMIN_ADMIM_INDEX_COMPLETE` に3指標（countNonStockProducts/countProducts/countCustomers）がイベント引数として公開される。**画面へ渡すテンプレート変数はdispatch直前のローカル変数から組み立てられ、リスナーが引数を書き換えても画面表示は自動追随しない**（return配列はローカル変数を使用）。プラグイン依存＝標準環境（差し替えlistenerなし）では観測外→C-030等の前提条件 | `$event = new EventArgs([ … 'countNonStockProducts' => $countNonStockProducts, 'countProducts' => $countProducts, 'countCustomers' => $countCustomers, ], $request);`＋`$this->eventDispatcher->dispatch($event, EccubeEvents::ADMIN_ADMIM_INDEX_COMPLETE);`＋`return [ … 'countNonStockProducts' => $countNonStockProducts, …];`／「ホーム表示組み立ての終盤で、ダッシュボード全体向けの拡張イベントが発火し、イベント引数として…3指標も渡される」「リスナーがイベント引数内の集計値を書き換えても、dispatch 後にその引数から再読込しない限り、画面表示は自動では変わらない」 | Controller:171-184,193-204／md:97-98,26 | 0 `non-ui-observable` |
| L1-M0204-023 | no_ui | 本ブロックはフォーム・テキスト入力を持たず（操作は件数行リンク押下のみ）、モーダル・ポップアップ・トースト・確認ダイアログを表示せず、**本ブロック専用のJavaScriptを持たない**（件数の取得・表示切替・非同期更新なし。twig:218-271に form/input/script/inline handler 0件=grep実測） | 「JS 挙動｜本ブロック専用の JavaScript は持たない。件数の取得、表示切替、非同期更新は行わない」「モーダル・ポップアップ｜本ブロックはモーダル、ポップアップ、トースト、確認ダイアログを表示しない」「入力項目｜本ブロックはフォーム・テキスト入力を持たない。件数行のリンク押下のみ」 | md:84,86,87／twig:218-271 | 0 `non-translated` |
| L1-M0204-024 | **TBD** | データベース読み取りの障害時は「アプリケーションの共通例外処理に委ねる。本ブロック専用の利用者向けメッセージは設けない」「ホーム画面全体の表示が成立しないことがある」＝**実claimだが観測契約が定義不能**: HTTPステータス・例外型の列挙は設計書が明示的にスコープ外（md:42）とし、DB障害の安全な誘発手段も標準環境に無い。**未確定オラクル台帳へ**（excludedにしない=実在仕様の除外禁止。m02-02 L1-028と同型） | 「データベース読み取りの障害｜アプリケーションの共通例外処理に委ねる。本ブロック専用の利用者向けメッセージは設けない」「失敗時出力｜データ取得失敗時はフレームワークの例外処理に委ねられ、ホーム画面全体の表示が成立しないことがある」「データベース接続失敗時の HTTP ステータスや例外型の列挙」（=扱わないこと） | md:264,190,42 | — |

## §2 SEED三段参照設計（SEED-M0204系・全て `@TBD-D5`・**SQL実体は未実装**）

三段参照: **期待の正=L1オラクルID（§1） → 前提状態=SEEDセットID@manifest_sha1 → 観測=実値**。
SEED固定値は入力の再現手段であり期待値の正にしない。**集計ケースの判定は「UI表示値 = §6.3のdb.ts式評価値
（number_format書式適用後）」の突合**とし、共有DB上の既存データはrun内ブラケット（適用前後差分）で吸収する。
帯ID=900002400番台（dtb_product/dtb_product_class/dtb_product_stock/dtb_customer）・マーカー接頭辞
`E2E-M0204-`。NOT NULL列の全充足・IDENTITY明示id投入方式・FK/base_info整合は**D5型SEED契約で確定=@TBD-D5**（§9-7）。

| SEEDセットID | 目的 | 固定値（設計・ショップ状況集計への寄与） | 後始末 |
|---|---|---|---|
| SEED-M02-ADMIN | 2FA OFFの有効管理者 | `config/default.config.ts` の ECCUBE_ADMIN_USER/PASS 既定（既存共通） | 既存利用・撤去不要 |
| SEED-M0204-NONSTOCK | 在庫切れ算入＋商品単位一意（＋C-021のPAIR片側） | 公開商品1（id=900002401・商品名マーカー `E2E-M0204-PAIR-`=CONTROLと対）＋在庫切れ規格**2件**（pc=900002411/900002412: stock_unlimited=false・visible=true。各pcに dtb_product_stock: **stock=0**・base_info_id=root・stock_location_id=1）→ **在庫切れ+1（+2でない）**・取扱+1 | マーカー/帯ID DELETE（down） |
| SEED-M0204-NONSTOCK-EDGE | 在庫切れ不算入エッジ | 公開商品3: ①無制限規格（stock_unlimited=true・visible=true・ps.stock=0） ②非表示規格（visible=false・ps.stock=0） ③stock≠0規格3種（ps.stock=5/-1/NULL・visible=true）→ **在庫切れ+0**・取扱+3 | 同上 |
| SEED-M0204-STOCK-CONTROL | **BC識別用の対照商品**（改訂1/改訂2・C-021） | 公開商品1（id=900002409）＋規格**2件**（pc=900002413/900002414）＝**NONSTOCKと規格数・全属性対称のSEED契約**: 商品属性（公開）・各規格の stock_unlimited=false・visible=true・各規格に対応する ps（base_info_id=root・stock_location_id=1）まで**すべてNONSTOCK側と同一**とし、**対応する ps.stock のみ相違**（NONSTOCK=各規格0／CONTROL=各規格**10（>0）**）。商品名は共通マーカー `E2E-M0204-PAIR-` 接頭辞（NONSTOCK側と対で一覧上の同定に使用）→ **在庫切れ+0**・取扱+1。**識別の根拠**: 在庫切れ判定EXISTS（Controller:441-463）は**規格単位**のため、同数規格で ps.stock だけ異なるこの対称契約下では「stock=0側=在庫なし条件の該当（設計期待で一覧に出る）／stock>0側=非該当（設計期待で出ない）／現実装フィルタ無視なら対照も出る」の在/不在識別が成立する。設計期待では在庫なし条件適用時に一覧へ**出ない**側 | 同上 |
| SEED-M0204-PRODUCT-STATUS | 取扱の状態別 | 公開1（900002404）・非公開1（900002405）・廃止1（900002406。規格なし）→ **取扱+2**（廃止不算入） | 同上 |
| SEED-M0204-NOCLASS | 規格なし商品 | 商品規格行を1件も持たない公開商品1（900002407）→ **在庫切れ+0・取扱+1**（内部結合で不算入/ステータスのみで算入） | 同上 |
| SEED-M0204-DISCONTINUED-NONSTOCK | 廃止×在庫切れ | 廃止商品1（900002408）＋在庫切れ規格1（visible=true・ps.stock=0・root×EC-CUBE拠点）→ **在庫切れ+1・取扱+0**（在庫切れは商品ステータス不問） | 同上 |
| SEED-M0204-CUSTOMER-STATUS | 本会員の状態別 | 会員3: 本会員（customer_status_id=2・del_flg=0）・仮会員（=1）・退会（=3）各1 → **本会員+1** | 同上 |
| SEED-M0204-LIST-COND | 一覧側の残存検索条件 | SQL実体なし（**UI操作で生成**: 商品一覧/会員一覧の検索フォームへ別条件をPOSTしセッションに保存させる。synthetic） | テスト内生成・使い捨て |
| SEED-M0204-EMPTY | 3指標とも0件 | 実体データなし（**状態の不在**。共有DBでは保証不能＝**隔離DB/フレッシュDB必須**=C-017の実行前提・§9-5） | — |

- 集計ケース（C-011〜C-016）の照会は**run内ブラケット**（SEED適用前後のdb.ts式評価差分＋UI表示値と式評価値の
  突合）で行い、共有DB上の他商品・他会員に依存しない（式が同一のため既存分は差分で相殺）。
- 帯商品はテナント条件なしの分母（L1-005/007）に載るため、他機能の商品一覧・フロント表示へ露出し得る→
  **フレッシュDB/serial前提・共有環境では実行しない**（`e2e-standard-run-requirements` 準拠）。
- root店舗ID（ps.base_info_id）は環境値（env BASE_INFO_ID 既定1=eccube.yaml:59）。SEEDのpsはこの解決値で投入
  （D5確認=§9-6）。

## §3 表示/集計/遷移マトリクス（本機能はフォームなし＝入力制約マトリクスは非該当）

### 3a. 集計3指標×算入/不算入（三値比較: 設計md 126-128/138-155 ⇔ ee Controller 441-493 ⇔ 観測=db.ts §6.3）

| 入力状態 | 在庫切れ商品数 | 取扱商品数 | 本会員数 | L1 |
|---|---|---|---|---|
| 公開商品＋在庫切れ規格2（無制限でない・表示・ps.stock=0・root×EC-CUBE拠点） | **+1**（商品単位一意） | +1 | — | L1-005,006 |
| 在庫無制限規格のみ（ps.stock=0） | +0 | +1 | — | L1-006 |
| 非表示規格のみ（ps.stock=0） | +0 | +1 | — | L1-006 |
| ps.stock=5/-1/NULL の規格のみ | +0 | +1 | — | L1-006 |
| 規格なし公開商品 | +0（内部結合） | **+1**（規格不問） | — | L1-006,007 |
| 廃止商品＋在庫切れ規格 | **+1**（商品ステータス不問） | **+0**（廃止除外） | — | L1-005,007 |
| 公開/非公開/廃止 各1 | — | **+2** | — | L1-007 |
| 本会員/仮会員/退会 各1（del_flg=0） | — | — | **+1** | L1-008 |
| 該当0件 | 「0」表示 | 「0」表示 | 「0」表示 | L1-009 |

### 3b. 表示

| 面 | 内容 | L1 |
|---|---|---|
| カード | #shop-statistical・見出し「ショップ状況」/"Shop Status"・縦3行（アイコンi.fa＋ラベル＋件数.h4）・共通クラス（card/card-header/card-body/border/p-3/d-block） | L1-003 |
| 件数書式 | number_format（整数・3桁カンマ）`^(0\|[1-9][0-9]{0,2}(,[0-9]{3})*)$` | L1-004 |
| 供給 | サーバ側レンダリング（初期HTMLに実体・専用API/専用JSなし・自動更新なし） | L1-016,017,023 |

### 3c. 遷移×セッション

| 起点 | 経路 | セッション効果 | 遷移後 | 一覧側の消費 | L1 |
|---|---|---|---|---|---|
| 在庫切れ商品数行 | GET /search_nonstock → redirect /product/page/1 | `eccube.admin.product.search` を `['stock'=>[2]]` で**上書き**（マージなし） | 商品一覧1ページ目 | **不消費疑い（BC-DRAFT-m02-04-1）**: SearchProductTypeに'stock'なし＋ForAdminに処理なし | L1-010,011,014 |
| 取扱商品数行 | GET /product（直リンク・リダイレクトなし） | **書込なし** | 商品一覧（ee既定: 初期表示=検索未実行・セッションを初期viewDataで上書き） | 委譲（商品一覧既定動作） | L1-012 |
| 会員数行 | GET /search_customer → redirect /customer/page/1 | `eccube.admin.customer.search` を `['customer_status'=>[2]]` で**上書き**（マージなし） | 会員一覧1ページ目 | **消費する**（customer_statusフィールド実在＋repo適用=本会員のみ） | L1-013,014 |
| ホーム表示のみ | GET / | **書込なし**（表示のためのセッション更新なし） | — | — | L1-021 |

## §4 実行可能グレード14列TSV（候補・**自己完結＝全27行を実体掲載**）

記法: 期待結果セルは三段参照 `…実値… [L1:<oracle_id>; fixture:<SEEDセットID>@TBD-D5]`。
`%eccube_admin_route%` は環境値（既定 `admin`）。セレクタ（page実装済み・twig由来・2026-07-06実走10〇で実機実績）:
カード `#shop-statistical`（twig:218）・見出し `.card-title`（:221）・行リンク `a[href*="/search_nonstock"]`（:226）／
`a[href$="/product"]`（:241）／`a[href*="/search_customer"]`（:256）・各行アイコン `i`（:229,244,259）・
ラベル `span`（:232,247,262）・件数 `.h4`（:235,250,265）。db.ts集計照会は§6.3。en行はD15前提。
一覧側（cross-feature）の観測面セレクタは未契約=要実機（§9-4）。

### §4.1 bound対応候補行（24行=ja23＋-EN1。§8の81対応表が参照する全行）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m02-04_admin_home_home_shop_status	E2E-M0204C-001	IT-15	未認証	P1	未認証でホームへアクセスすると管理ログインへ誘導されショップ状況カードを利用できない	未ログイン（cookieなしcontext）	—	1. GET /%eccube_admin_route%/ 2. 遷移先URLと画面を確認 3. #shop-statistical の不在を確認	admin_login のログイン画面へ誘導され、ショップ状況カード（#shop-statistical）を含むホーム画面は表示されない（利用不可） [L1:L1-M0204-001]				
m02-04_admin_home_home_shop_status	E2E-M0204C-002	IT-25	表示	P1	ログイン後ホームにショップ状況カード一式が表示される（ja）	管理者ログイン済（SEED-M02-ADMIN・2FA OFF）	—	1. ログインし GET /%eccube_admin_route%/ 2. #shop-statistical 内の .card-title 文言・縦3行（各行=リンクa内に i アイコン＋ラベルspan＋.h4件数）・カード共通クラス（card/card-header/card-body/border/p-3/d-block）を確認 3. カード内にエラー/フォールバック文言が無いことを確認	管理者認証後のダッシュボード（ホーム）に #shop-statistical カードが表示され、見出し「ショップ状況」・3行のラベル「在庫切れ商品数」「取扱商品数」「会員数」・各行のアイコン（i.fa）と件数（.h4）が管理共通クラスで縦に並び、エラー文言なく表示される [L1:L1-M0204-003,L1-M0204-002; fixture:SEED-M02-ADMIN@TBD-D5]				
m02-04_admin_home_home_shop_status	E2E-M0204C-002-EN	IT-25	表示	P3	ショップ状況カード文言（en）	管理者ログイン済／locale=en	—	1. en UIでホームを開く 2. カード見出し・3ラベルを読む	見出し="Shop Status"・ラベル="Number of Out-of-Stock Items"/"Number of Products"/"Number of Customers"（件数は数値=locale非依存） [L1:L1-M0204-003; fixture:SEED-M02-ADMIN@TBD-D5]				
m02-04_admin_home_home_shop_status	E2E-M0204C-003	IT-23	集計突合	P1	3指標が桁区切り整数形式で表示されdb.ts式評価値と一致する（ホーム表示時のDB読取値）	管理者ログイン済／標準環境（拡張hook差替なし=L1-022）	—	1. db.tsで§6.3の式評価（在庫切れ/取扱/本会員）を取得 2. ホームを開き .h4 3要素のテキストを読む 3. 各テキストが ^(0|[1-9][0-9]{0,2}(,[0-9]{3})*)$ の桁区切り整数形式であることを確認 4. number_format適用後の期待文字列と突合（表示とdb照会の間のDB変更混入時はリトライ）	3つの .h4 がいずれも整数・桁区切り形式で、在庫切れ商品数・取扱商品数・本会員数の各値が§6.3のdb.ts式評価値と一致する（ホーム画面表示時にそれぞれDBから読み取った件数。期待の正はL1式でありSEED値ではない） [L1:L1-M0204-004,L1-M0204-005,L1-M0204-007,L1-M0204-008,L1-M0204-016]				
m02-04_admin_home_home_shop_status	E2E-M0204C-004	IT-22	JS挙動	P2	本ブロック専用のJavaScriptを持たない（カード内script/inline handler 0件・追加リクエストなし）	管理者ログイン済	—	1. ネットワーク監視下でホームを開く 2. #shop-statistical 内の script 要素数と on* インライン属性数を数える 3. 表示完了後、本ブロック起因の追加リクエスト（件数取得XHR等）が発生しないことを確認（sale_chart=売上グラフ別ブロックは除外して評価）	#shop-statistical 内に script 要素・インラインイベントハンドラが存在せず（0件）、件数の取得・表示切替・非同期更新のためのリクエストも発生しない [L1:L1-M0204-023,L1-M0204-017]				
m02-04_admin_home_home_shop_status	E2E-M0204C-005	IT-25	UI部品	P2	本ブロックはフォーム・入力・モーダル類を持たない	管理者ログイン済	—	1. ホームを開く 2. #shop-statistical 内の form/input/textarea/select/.modal/[role=dialog] 要素数を数える 3. 行リンクhover後も再確認	いずれも0件（本ブロックはフォーム・テキスト入力を持たず、モーダル・ポップアップ・トースト・確認ダイアログを表示しない。操作は件数行リンク押下のみ） [L1:L1-M0204-023]				
m02-04_admin_home_home_shop_status	E2E-M0204C-011	IT-23	集計包含	P1	在庫切れ規格を持つ商品が在庫切れ商品数に算入され複数規格でも商品1件で数えられる	管理者ログイン済／標準環境	SEED-M0204-NONSTOCK（公開商品1＋在庫切れ規格2・§2）	1. db.tsで§6.3a式評価T0を記録 2. apply SEED-M0204-NONSTOCK 3. db.ts式評価T1で**在庫切れ+1（+2でない=商品単位一意）・取扱+1**の差分をサニティ確認 4. ホームを開き在庫切れ商品数/取扱商品数の .h4 がT1式評価値と一致することを確認 5. teardown	在庫無制限でなく表示対象で在庫数量0（dtb_product_stock・root店舗×EC-CUBE拠点）の規格を持つ商品が在庫切れ商品数に算入され、同一商品の複数在庫切れ規格でも商品IDを一意に数えて1件（UI表示=db.ts式評価値） [L1:L1-M0204-005,L1-M0204-006; fixture:SEED-M0204-NONSTOCK@TBD-D5]				
m02-04_admin_home_home_shop_status	E2E-M0204C-012	IT-23	集計除外	P1	在庫無制限・非表示・在庫数量が0でない（正/負/NULL）規格は在庫切れ商品数に算入されない	管理者ログイン済／標準環境	SEED-M0204-NONSTOCK-EDGE（無制限/非表示/stock=5・-1・NULLの各規格・§2）	1. db.ts式評価T0を記録 2. apply SEED-M0204-NONSTOCK-EDGE 3. db.ts式評価T1で**在庫切れ+0（不変）・取扱+3**を確認 4. ホーム表示の .h4 がT1式評価値と一致（EDGE分が在庫切れに現れない）ことを確認 5. teardown	在庫無制限（stock_unlimited=true）・非表示（visible=false）・在庫数量が0でない（正数/負数/NULL）の規格はいずれも在庫切れ商品数に数えられない（式評価・UI表示とも） [L1:L1-M0204-006; fixture:SEED-M0204-NONSTOCK-EDGE@TBD-D5]				
m02-04_admin_home_home_shop_status	E2E-M0204C-013	IT-23	集計対象	P1	取扱商品数は公開・非公開のみを数え廃止を数えない	管理者ログイン済／標準環境	SEED-M0204-PRODUCT-STATUS（公開/非公開/廃止 各1・§2）	1. db.ts式評価T0を記録 2. apply SEED-M0204-PRODUCT-STATUS 3. db.ts式評価T1で**取扱+2（公開+非公開。廃止は不算入）**を確認 4. ホーム表示の取扱商品数 .h4 がT1式評価値と一致することを確認 5. teardown	商品ステータスが公開（=1）・非公開（=2）の商品のみが取扱商品数に算入され、廃止（=3）は算入されない [L1:L1-M0204-007; fixture:SEED-M0204-PRODUCT-STATUS@TBD-D5]				
m02-04_admin_home_home_shop_status	E2E-M0204C-014	IT-23	集計対象	P1	本会員数は会員ステータスが本会員の会員のみを数える（仮会員・退会は不算入）	管理者ログイン済／標準環境	SEED-M0204-CUSTOMER-STATUS（本会員/仮会員/退会 各1・del_flg=0・§2）	1. db.ts式評価T0を記録 2. apply SEED-M0204-CUSTOMER-STATUS 3. db.ts式評価T1で**本会員+1のみ**を確認 4. ホーム表示の会員数 .h4 がT1式評価値と一致することを確認 5. teardown	会員ステータス=本会員（REGULAR=2）の会員のみが会員数（表示見出しは「会員数」・集計は本会員限定）に算入され、仮会員（=1）・退会（=3）は算入されない（実効条件にdel_flg=0=L1-008実装層） [L1:L1-M0204-008; fixture:SEED-M0204-CUSTOMER-STATUS@TBD-D5]				
m02-04_admin_home_home_shop_status	E2E-M0204C-016	IT-23	集計交差	P2	廃止ステータスの商品でも在庫切れ規格があれば在庫切れ商品数に算入され取扱商品数には算入されない	管理者ログイン済／標準環境	SEED-M0204-DISCONTINUED-NONSTOCK（廃止商品＋在庫切れ規格・§2）	1. db.ts式評価T0を記録 2. apply SEED-M0204-DISCONTINUED-NONSTOCK 3. db.ts式評価T1で**在庫切れ+1・取扱+0**を確認 4. ホーム表示の両 .h4 がT1式評価値と一致することを確認 5. teardown	在庫切れ商品数は商品本体のステータスを条件にしないため廃止商品でも表示対象の在庫切れ規格があれば算入され、取扱商品数には廃止のため算入されない [L1:L1-M0204-005,L1-M0204-007; fixture:SEED-M0204-DISCONTINUED-NONSTOCK@TBD-D5]				
m02-04_admin_home_home_shop_status	E2E-M0204C-017	IT-12	空集計	P2	該当データ0件のとき各指標は0と表示されエラーなく継続する	管理者ログイン済／**隔離DB/フレッシュDB必須**（SEED-M0204-EMPTY=状態の不在。共有DBでは0件を保証できない=§9-5）	対象データ0件（db.tsで§6.3式評価=3指標とも0を前提確認）	1. db.ts式評価で3指標とも0を確認（0でなければskip） 2. ホームを開く 3. .h4 3要素の表示を読む 4. エラー表示が無いことを確認	3指標がいずれも「0」と表示され、エラーは表示されず画面継続する（DB照会が空でも相関系のエラーにならない） [L1:L1-M0204-009,L1-M0204-004]				
m02-04_admin_home_home_shop_status	E2E-M0204C-020	IT-15	状態変化	P1	在庫切れ商品数の行押下で商品一覧1ページ目へ遷移する（専用GETルート経由・リダイレクト）	管理者ログイン済	—	1. ホームを開く 2. 在庫切れ行リンクの href が /%eccube_admin_route%/search_nonstock であることを確認 3. 行を押下 4. 遷移過程（redirect）と最終URLを確認	GET /search_nonstock（admin_homepage_nonstock）を経て /%eccube_admin_route%/product/page/1（admin_product_page・商品一覧の1ページ目）へリダイレクト遷移する [L1:L1-M0204-010]				
m02-04_admin_home_home_shop_status	E2E-M0204C-021	IT-13	検索条件上書き	P2	【BC-DRAFT-m02-04-1】在庫切れ遷移では既存条件をマージせず在庫なし条件だけが初期条件として扱われる（設計期待・**対照商品による識別観測**）	管理者ログイン済／SEED-M0204-NONSTOCK（各規格ps.stock=0のPAIR商品）＋**SEED-M0204-STOCK-CONTROL（§2の対称SEED契約: 規格数2・全属性一致・対応するps.stockのみ10のPAIR対照商品）**＋SEED-M0204-LIST-COND（商品一覧で別条件を事前に検索実行しセッション残存）	§2対称SEED契約に基づき在庫のみ相違のPAIR2商品（各規格stock=0／各規格stock=10・共通マーカー名）	（商品一覧側の観測=cross-feature・要実機）1. apply SEED-M0204-NONSTOCK＋SEED-M0204-STOCK-CONTROL（**§2の対称SEED契約**=規格数2・商品/規格/ps属性すべて同一・対応するps.stockのみ0/10で相違） 2. 商品一覧で別条件（例: 商品名に別マーカー）をPOST検索しセッションに保存させる 3. ホームへ戻り在庫切れ行を押下 4. 遷移先商品一覧（/product/page/1）の一覧結果を読む: (a) stock=0のPAIR商品が**含まれる** (b) **stock>0のPAIR対照商品が含まれない**（在庫なし条件が実際に絞りとして働く=識別点。在庫切れ判定EXISTS〔Controller:441-463〕は規格単位のため、対称契約下ではps.stockの0/10だけで在/不在が分かれる） (c) 旧条件（別マーカー）だけに該当するレコードが結果を支配しない=旧条件はマージされず消えている 5. teardown	設計期待: 旧条件はマージされず、在庫なし条件だけが初期検索条件として扱われる＝stock=0のPAIR商品は取得結果に含まれ、**§2対称SEED契約（規格数・全属性一致・ps.stockのみ相違）に基づく在庫のみ相違のstock>0対照商品は取得結果に含まれない**（2商品の在/不在で条件反映の有無を識別。含まれる側だけでは無フィルタ表示と区別不能=改訂1。「在庫以外同一条件」はSEED契約由来の保証であり実データへの断定ではない） [L1:L1-M0204-010,L1-M0204-014,L1-M0204-011; fixture:SEED-M0204-STOCK-CONTROL@TBD-D5]（**乖離見込み: SearchProductTypeにstockフィールド不存在＋allow_extra_fields既定false=extra dataとして検証エラー対象・getData()の検索条件に非含有＋ForAdminにstock分岐なし→現実装では対照商品も出現しフィルタ無視が観測される疑い＝BC-DRAFT-m02-04-1。期待値は設計側のまま・実走で×確定し不具合候補登録**）				
m02-04_admin_home_home_shop_status	E2E-M0204C-022	IT-25	状態変化	P1	取扱商品数の行押下は商品一覧へ直接遷移しショップ状況側では検索条件セッションを更新しない	管理者ログイン済／SEED-M0204-LIST-COND（商品一覧に別条件残存）	—	1. 商品一覧で別条件をPOST検索しセッションに保存させる 2. ホームへ戻り取扱商品数行の href が /%eccube_admin_route%/product（直リンク・search系ルート不経由）であることを確認 3. 行を押下し遷移後URLを確認（リダイレクトなしで /product） 4. 遷移後の一覧初期状態を確認	/%eccube_admin_route%/product へ直接遷移し（在庫切れ/会員数のような専用GETルートを経由しない=ショップ状況側の検索条件事前セットなし）、遷移後の初期状態は商品一覧機能の既定動作に従う（ee既定: page_noなしGETは検索未実行の初期表示） [L1:L1-M0204-012]				
m02-04_admin_home_home_shop_status	E2E-M0204C-023	IT-25	状態変化	P1	会員数の行押下で本会員条件だけを保存し会員一覧1ページ目へ遷移し初期条件として扱われる（旧条件マージなし）	管理者ログイン済／SEED-M0204-LIST-COND（会員一覧に別条件残存）＋SEED-M0204-CUSTOMER-STATUS	—	1. 会員一覧で別条件（例: 仮会員を含む状態）をPOST検索しセッションに保存させる 2. ホームへ戻り会員数行の href が /%eccube_admin_route%/search_customer であることを確認 3. 行を押下し /customer/page/1 への遷移を確認 4. （cross-feature・要実機）会員一覧の検索フォームの会員ステータス選択状態と一覧結果を読む: 本会員のみが選択され、非本会員（仮会員/退会）のレコードが取得結果に含まれないこと	GET /search_customer を経て /%eccube_admin_route%/customer/page/1 へリダイレクトし、旧条件はマージされず本会員条件だけが初期検索条件として扱われる（会員一覧側はcustomer_statusを消費=本会員のみの検索状態。商品一覧・会員一覧が初回表示や再表示で参照する検索条件セッション領域への上書きの実観測） [L1:L1-M0204-013,L1-M0204-014; fixture:SEED-M0204-CUSTOMER-STATUS@TBD-D5]				
m02-04_admin_home_home_shop_status	E2E-M0204C-030	IT-26	無書込	P1	ホーム表示と3行リンク遷移は商品・商品規格・在庫・会員・マスタへ登録/更新を行わない（標準環境）	管理者ログイン済／**標準環境（ADMIN_ADMIM_INDEX_COMPLETE等へ書込みlistenerを差し込むプラグインなし=L1-022。§9-9）**	—	1. db.tsでT0=§6.3cの決定的差分照会（dtb_product/dtb_product_class/dtb_product_stock/dtb_customer の行数＋主キー順全列ダイジェスト、参照マスタ mtb_product_status/mtb_customer_status の全列ダイジェスト）を記録 2. ホーム表示→在庫切れ行押下→戻る→取扱行押下→戻る→会員数行押下→戻る 3. db.tsでT1を再照会	T0=T1（全テーブルの行数・全列ダイジェスト完全一致=登録/更新/削除なし。主キー順・全列のため相殺更新・過去行更新も検知）。リンク経由の副作用は検索条件セッション書込とリダイレクトのみで台帳更新ではない。設計書DB操作節の「登録/更新」はDOC-DRAFT-m02-04-2のテンプレノイズであり書込を期待しない。無書込の主張は標準環境に限定 [L1:L1-M0204-015,L1-M0204-022]				
m02-04_admin_home_home_shop_status	E2E-M0204C-031	IT-23	参照時点	P2	表示中の件数は自動更新せず・別処理で永続化された後の再表示はその時点の読み取り値を反映する	管理者ログイン済／標準環境	db.tsで本会員1件（帯ID・E2E-M0204-RUNマーカー・customer_status_id=2・del_flg=0）を直接INSERT	1. ホームを開き会員数 .h4 とdb.ts式評価T0を記録・ネットワーク監視開始 2. db.tsで本会員を直接INSERT（本ブロック外部の更新を再現） 3. 無操作で待機（監視窓）: 表示値が記録値のまま不変・追加リクエストが発生しないことを確認 4. ホームを**再表示**し .h4 がdb.ts式評価T1（=INSERT反映後）と一致することを確認 5. INSERT行を後始末	表示中の数値は自動更新されず（表示値不変・ポーリング等なし）、再表示時はその時点の永続化済みデータを読んだ再集計値になる（外部連携/バッチの反映タイミング自体の正は当該機能設計=委譲宣言はオラクル化しない） [L1:L1-M0204-016; fixture:SEED-M0204-CUSTOMER-STATUS@TBD-D5]				
m02-04_admin_home_home_shop_status	E2E-M0204C-033	IT-02	サーバ側レンダリング	P2	3指標の件数はホームHTML表示時のサーバ側読み取り結果として初期HTMLに含まれる	管理者ログイン済	—	1. JS無効context（javaScriptEnabled:false）または応答HTML直接取得でホームをGET 2. JS実行前のHTML本文に #shop-statistical と3件数の実体（書式済み数値）が含まれることを確認	件数はサーバ側がHTMLを組み立てる過程でDBから読み取られ初期HTML応答に含まれる（クエリ/ボディ入力なし・JS不要で表示成立） [L1:L1-M0204-017]				
m02-04_admin_home_home_shop_status	E2E-M0204C-034	IT-12	非同期なし	P1	件数表示のための専用APIを呼び出さない（ネットワーク記録）	管理者ログイン済	—	1. page.on('request')で全リクエストを記録しつつホームをGET 2. 記録にショップ状況件数取得のXHR/fetchが存在しないことを確認（売上グラフの admin_homepage_sale=別ブロックは除外して評価） 3. 初期HTMLに件数実体が含まれること（C-033と同観測）を対に確認	本ブロックは件数表示のために専用APIを呼び出さない（利用不可ではなく不存在=リクエスト0件。件数はHTML組み立て内のDB読取のみ） [L1:L1-M0204-017]				
m02-04_admin_home_home_shop_status	E2E-M0204C-035	IT-12	バッチなし	P3	本ブロックはバッチを起動しない（観測手段未契約=実行保留）	管理者ログイン済	—	（サーバ側バッチ起動有無の実行時観測手段が未契約のため実行保留=§9-8。claimはController:104-205,302-330にコマンド/プロセス起動なし=静的実測で拘束済み）	ホーム表示・リンク遷移によりバッチが起動されない [L1:L1-M0204-018]（**実行保留: 観測手段未契約。DB不変の部分観測はC-030が被覆**）				
m02-04_admin_home_home_shop_status	E2E-M0204C-036	IT-12	成否非判定	P3	カード内に成否判定に基づく表示分岐・専用エラー/フォールバック文言が存在しない	管理者ログイン済	—	1. ホームを開く 2. #shop-statistical 内の .alert 等のエラー表示要素と、エラー/失敗/フォールバックに類する文言の不在を検査（通常表示での観測。twig:218-271に成否分岐要素なし=静的実測に対応する実機確認）	カード内に成否判定に基づく表示分岐・専用エラー/フォールバック文言が存在しない（API/バッチの成否を本ブロック内で判定しない・本ブロック単体のフォールバック文言は専用に定義しない） [L1:L1-M0204-019]				
m02-04_admin_home_home_shop_status	E2E-M0204C-037	IT-22	入力非受理	P2	入力はホーム表示要求と各リンクのGET要求のみで不要クエリ付きGETでもカードの行・件数が不変	管理者ログイン済	GET /%eccube_admin_route%/?stock=0&dummy=1	1. 通常GETでカードの3ラベルと3件数を記録 2. 不要クエリ付きGETで再表示 3. 両者を比較（表示間のDB変更混入時はリトライ）	行構成・ラベル・各件数とも通常表示と一致（入力はホーム画面表示要求および各リンクのGET要求のみ・フォームPOSTなし・クエリで本ブロックの表示を制御しない） [L1:L1-M0204-020]				
m02-04_admin_home_home_shop_status	E2E-M0204C-038	IT-16	一覧不一致許容	P3	在庫切れ商品数（商品単位）と遷移先一覧の行数の一致は保証されないことの構成的観測	管理者ログイン済／SEED-M0204-NONSTOCK（複数規格が在庫切れの商品=商品1件・規格2行）	—	（一覧側行数の観測=cross-feature・要実機）1. apply SEED-M0204-NONSTOCK 2. ホームの在庫切れ商品数を記録（db.ts式評価と一致=C-011） 3. 在庫切れ行から商品一覧へ遷移し一覧の表示行数/件数表示を読む 4. カード件数と一覧行数が一致しなくてもエラー・不整合表示が無いことを確認 5. teardown	在庫切れ件数は「商品単位」の件数であり、一覧側の表示単位・検索条件・表示ルールによる行数との一致は保証されない（**一致を期待値にしない**。乖離が発生しても両画面ともエラーなく表示継続。BC-DRAFT-m02-04-1により一覧側が在庫なしで絞られない場合も本ケースの合否には使わない） [L1:L1-M0204-005; fixture:SEED-M0204-NONSTOCK@TBD-D5]				
```

### §4.2 補完行（3行=ja3。**親test_idなし・母集合会計に算入しない**。理由=設計書補完〔一次資料に規定があるが、母集合81行の期待テキストに対応する親が存在しない〕）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m02-04_admin_home_home_shop_status	E2E-M0204C-015	IT-23	規格なし商品	P3	商品規格を持たない商品は在庫切れ商品数に数えず取扱商品数には数える	管理者ログイン済／標準環境	SEED-M0204-NOCLASS（規格行を持たない公開商品1・§2）	1. db.ts式評価T0を記録 2. apply SEED-M0204-NOCLASS 3. db.ts式評価T1で**在庫切れ+0・取扱+1**を確認 4. ホーム表示の両 .h4 がT1式評価値と一致することを確認 5. teardown	規格なし商品は在庫切れ商品数（商品規格と内部結合）には数えられず、取扱商品数（ステータスのみで判定）には数えられる [L1:L1-M0204-006,L1-M0204-007; fixture:SEED-M0204-NOCLASS@TBD-D5]（補完行・親test_idなし・設計書補完=md:148）				
m02-04_admin_home_home_shop_status	E2E-M0204C-040	IT-15	セッション非更新	P3	ホーム表示のみでは検索条件セッションを更新しない	管理者ログイン済／SEED-M0204-LIST-COND（商品一覧・会員一覧に別条件残存）	—	1. 商品一覧・会員一覧で別条件をPOST検索しセッションに保存させる 2. ホームを表示する（カード行は押下しない） 3. 商品一覧を `/product/page/1`（または ?resume=1）で開き、手順1の条件が維持されていることを確認 4. 会員一覧も同様に確認（一覧側セレクタ=要実機）	ホーム表示処理ではショップ状況ブロックのために検索条件セッション（eccube.admin.product.search / eccube.admin.customer.search）を書き換えず、両一覧の復元条件がホーム表示の前後で変化しない [L1:L1-M0204-021]（補完行・親test_idなし・設計書補完=md:298）				
m02-04_admin_home_home_shop_status	E2E-M0204C-042	IT-20	Cookie	P3	本ブロックの表示・リンク遷移で専用Cookieが新規設定されない	管理者ログイン済	—	1. ログイン完了後 context.cookies() のCookie集合T0を記録 2. ホーム表示→3行リンク遷移→戻る 3. context.cookies() T1を取得しT0との差分を確認	認証/セッション系（フレームワーク由来）以外に本機能起因の新規Cookieが増えない（検索条件はサーバ側セッションでありCookie新設ではない） [L1:L1-M0204-021]（補完行・親test_idなし・設計書補完=md:309）				
```

## §5 locale対応表

- **LS=1 claim（1件）**: L1-M0204-003（カード見出し・3行ラベル。ja「ショップ状況」「在庫切れ商品数」
  「取扱商品数」「会員数」＝messages.ja.yaml:1875-1878／en "Shop Status"・"Number of Out-of-Stock Items"・
  "Number of Products"・"Number of Customers"＝messages.en.yaml:1853-1856。すべてen一次資料逐語・ja翻訳ゼロ）
  → **-EN 1行**（C-002-EN）。
- **LS=0（理由コード付き）**:
  - `non-translated`: L1-001/004/005/006/007/008/009/010/012/013/019/020/023（URL・集計式・定数・書式・要素有無
    ＝文言非依存。件数はnumber_format数値でlocale切替の対象文言なし）。
  - `non-ui-observable`: L1-002/011/014/015/017/018/021/022（HTTP/DB/セッション/静的実装事実）。
  - `data-passthrough`: L1-016（表示値はDB読取値の反映）。
- -EN 1行の実行前提はD15（M0 Go/No-Go。管理画面のen切替口なし＝W0実測を継承）。文言確定は本書で完了
  （実行のみ保留）。

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

### §6.1 観測契約（本機能はフォームPOSTなし＝CSRF request契約は非該当）

- **GETのみ**: `GET /%eccube_admin_route%/`（admin_homepage）・`GET /search_nonstock`・`GET /product`・
  `GET /search_customer`。直接送信系（POST/CSRF）の契約は不要（母集合-001の観点ラベル「CSRF」は期待テキストが
  集計定義＝ノイズ処理済み・§8）。
- **セレクタ**（既存page再利用・twig由来・2026-07-06実走10〇で実機実績）: §4冒頭に列挙。
- **行識別子契約（m02-01先例の踏襲）**: カード3行の識別は**行リンクhrefのroute実体**
  （`/search_nonstock`・`/product`・`/search_customer`＝twig:226,241,256が `url()` を直埋め）で行い、
  ラベル文言→行の復元を判定キーにしない（文言はL1-003の検証対象として独立に突合）。
  リダイレクト先の画面同定はURL（`/product/page/1`・`/customer/page/1`）を正とし、一覧側画面の見出し文言は
  補助観測（判定要素にしない）。
- **cross-feature観測（C-021/023/038/040の一覧側）**: 商品一覧・会員一覧の検索フォーム/結果行のセレクタは
  本候補では**未契約=要実機**（§9-4）。判定骨子のみ確定: 会員一覧=検索フォームの会員ステータスchoice選択状態
  ＋結果行の会員ステータス（SearchCustomerType:69-75がexpanded/multiple=チェックボックス群）。
  商品一覧=検索フォームの復元状態と結果有無（BC-DRAFT-m02-04-1の乖離確定観測）。

### §6.2 一覧側残存条件の生成（SEED-M0204-LIST-COND・C-021/022/023/040で使用）

1. 同一contextで商品一覧 `/product`（または会員一覧 `/customer`）を開き、検索フォームへ**在庫/会員ステータス
   以外の別条件**（例: 商品名/会員名にマーカー文字列）を入力してPOST検索を実行（一覧側が
   `eccube.admin.product.search`／`eccube.admin.customer.search` へ保存する=ProductCtl:189／CustomerCtl:109）。
2. `/product/page/1`（page_no付きGET）で条件が復元されることを事前確認（残存の成立確認）。
3. その後ホームへ遷移して各ケースの手順を実行。afterEachは通常の検索クリア操作（またはcontext破棄）。
   セッションはサーバ側のためdb.tsでは観測しない（観測は一覧側の復元表示=間接）。

### §6.3 db.ts集計照会（三段参照の式評価。C-003/011/012/013/014/015/016/017/031で使用）

期待の正はL1の集計式。db.tsはその式をSQLで独立評価し、**UI表示値（number_format書式適用後）と突合**する
（SEED固定値は適用前後差分のサニティにのみ使用）。実装層条件として在庫実体=`dtb_product_stock`
（DOC-DRAFT-m02-04-1裁定=L1-005）と `del_flg=0`（L1-008）を含める。`:root_base_info_id` は環境値
（env BASE_INFO_ID 既定1=eccube.yaml:59。D5で実環境値確認=§9-6）。

a. 在庫切れ商品数（L1-005/006）:

```sql
SELECT COUNT(DISTINCT p.id)
FROM dtb_product p
JOIN dtb_product_class pc ON pc.product_id = p.id
WHERE pc.stock_unlimited = false
  AND pc.visible = true
  AND EXISTS (
    SELECT 1 FROM dtb_product_stock ps
    WHERE ps.product_class_id = pc.id
      AND ps.stock = 0                      -- DECIMAL・NULLは不一致=不算入
      AND ps.base_info_id = :root_base_info_id
      AND ps.stock_location_id = 1          -- EC-CUBE拠点（ProductStock.php:39）
  );
```

b. 取扱商品数（L1-007）／本会員数（L1-008）:

```sql
SELECT COUNT(p.id) FROM dtb_product p WHERE p.product_status_id IN (1, 2);
SELECT COUNT(c.id) FROM dtb_customer c WHERE c.customer_status_id = 2 AND c.del_flg = 0;
```

（数値リテラル 1/2/3・stock_location=1 は spec では `o('L1-M0204-005'…)` 等のL1解決値で供給＝直書き禁止。
本SQLは自己完結掲載のための実体）

c. 無書込ブラケット（C-030。**決定的差分照会を実体掲載=自己完結**。m02-02 §6.3cと同方式=SUM/MAX要約は
相殺更新・過去行更新を検知できないため主キー順・全列ダイジェスト）:

```sql
-- (1) 行数
SELECT COUNT(*) FROM dtb_product;         -- 同型で dtb_product_class / dtb_product_stock / dtb_customer
-- (2) 全列ダイジェスト（主キー順・全列。相殺更新・過去行更新も検知）
SELECT md5(COALESCE(string_agg(t::text, ',' ORDER BY t.id), '')) FROM dtb_product t;
--   同型で dtb_product_class / dtb_product_stock / dtb_customer
-- (3) マスタ不変性（本機能の集計・表示が照合する2マスタ）
SELECT md5(COALESCE(string_agg(s::text, ',' ORDER BY s.id), '')) FROM mtb_product_status s;
SELECT md5(COALESCE(string_agg(s::text, ',' ORDER BY s.id), '')) FROM mtb_customer_status s;
```

「マスタ」の観測範囲: 本機能の集計条件が参照する `mtb_product_status`（ProductStatus.php:25）・
`mtb_customer_status`（CustomerStatus.php:23）の2表（設計の語「マスタ」〔md:27〕の最小実体）。
それ以外への書込不存在はソース側grep（L1-015）で担保し、全マスタ照会までは求めない（観測契約の過大化回避）。

d. C-031の直接INSERT/後始末は帯ID・`E2E-M0204-RUN-<runid>` マーカー条件DELETE（dtb_customerのNOT NULL列
   充足はD5型SEED契約=@TBD-D5）。

### §6.4 実装方針（候補=未実装・実走なし）

- page: 既存 `e2e/pages/admin/m02/m02_04_admin_home_home_shop_status.page.ts` を再利用（カード・行リンク・
  件数・アイコン実装済み）。一覧側（商品/会員）のpageは未実装=cross-feature要実機（§9-4）。
- spec: 既存 `e2e/spec/admin/m02/m02_04_*.spec.ts` は**旧ケース表（E2E-M02-04-xxx）1:1**の実装であり本候補の
  実装ではない（ログインヘルパ・待機ガードの参考のみ。既存×のE2E-M02-04-010=クリック後の遷移待ちタイムアウト
  はリダイレクト2段の完了待ち指定で是正予定）。本候補の期待値は `o("L1-M0204-xxx", "m02_04_oracle")` 相当の
  L1解決器経由・リテラル直書き禁止（三段参照ゲートD9）。
- 集計突合は「UI表示文字列 ⇔ db.ts式評価値にnumber_format相当（3桁カンマ）を適用した文字列」の完全一致＋
  書式骨格正規表現の2段判定（Twig既定書式はja/en非依存=L1-004のためlocale分岐不要）。
- 共有DB上で表示とdb照会の間に他プロセスのDB変更が混入し得るケース（C-003/C-037）は**再照会リトライ**で
  収束判定（run内ブラケットのSEED系ケースは差分判定のため影響小）。

### §6.5 _drafts/隔離lintの実施証跡（実測・実施済み）

1. 正式消費側（`e2e/helpers/oracle.ts`・`e2e/helpers/db.ts`・spec・pages）に本草案を消費する `_drafts` 参照は
   **0件**（隔離ガード自体のリテラル〔oracle.ts:19〕を除く。ガードは `_drafts`・パス区切り・`..` を含む
   fileKeyの解決をthrowで拒否する機械強制＝消費参照ではない）。
2. 正式パス `e2e/fixtures/oracle/` 直下に本機能のjsonは**作成していない**（草案は `_drafts/` のみ）。
3. 本md・oracle草案json（`e2e/fixtures/oracle/_drafts/m02-04_admin_home_home_shop_status_oracle_draft.json`）の
   出力先はともに `_drafts/` 配下のみ（CFP §7出力規約に適合）。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

| ケース群 | 実行区分（候補） | 観測層 | 備考 |
|---|---|---|---|
| C-001,002(-EN),004,005,020,022,033,036 | Playwright | GUI/HTTP | 表示・遷移・要素不在。C-033はJS無効context |
| C-034,004(後半) | Playwright+network | GUI+network | リクエスト記録（sale_chart除外評価） |
| C-003,011,012,013,014,015,016,031,037 | Playwright+db.ts（式評価突合） | GUI+DB | §6.3三段参照（SEED非正）。SEED apply/teardown同梱 |
| C-017 | Playwright+db.ts・**隔離DB必須** | GUI+DB | 0件前提の環境保証（§9-5）。前提不成立時skip |
| C-021,023,038,040 | Playwright（cross-feature・**一覧側セレクタ要実機**） | GUI(+DB) | C-021=BC-DRAFT乖離確定枠。C-023=会員側は消費実在で自動化見込み |
| C-030 | Playwright+db.ts（決定的差分） | GUI+DB | §6.3c。標準環境限定 |
| C-035 | 実行保留 | — | バッチ起動観測未契約（§9-8） |
| C-042 | Playwright | Cookie | context.cookies差分 |
| -EN 1行 | 実行保留（D15） | GUI | 文言確定済み |

聖域判定・多軸属性の正式付与はD14 v2合格後（本表は暫定・正式会計に使わない）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（§0判定原則。観点ラベル・前提/入力列のシナリオ語はノイズ）。
1候補ケース行=1 assertion bundle・多対一は `shared-observation`・-EN行は対応ja行と同一親のlocale多重。
**参照先の全候補行は§4に実体掲載済み＝81↔候補の期待テキスト突合が本文内で完結する**。

### 集計（81 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **57** | 下表 |
| **TBD** | **1** | 017（DB相関エラー側=DB障害の共通例外委譲・観測契約未定義=L1-024） |
| **excluded** | **23** | EX-A フォーム/バリデーション不存在6（009,010,012,013,014,015）＋EX-B read-only機能への書込肯定14（037,039,041,042,044,046,047,049,051,053,054,056,058,059）＋EX-C 他機能委譲文2（040,080）＋EX-D 設計内矛盾定型1（076）。各行の実引き正当化は§9-2/下記 |
| 合計 | **81** | 欠落0・理由なし重複0 |

- 候補ケース行総数**27**（§4.1 bound対応24＝ja23＋-EN1／§4.2 補完3）。
- **excluded根拠（実引き・偽陰性チェック付き）**:
  - **EX-A（009,010,012,013,014,015・6件）**: 期待は「必須／相関バリデーションでエラーが表示され（ず）…」の
    定型。本ブロックは**フォーム・テキスト入力を持たない**（md:87「本ブロックはフォーム・テキスト入力を
    持たない。件数行のリンク押下のみ」・md:224「利用者入力｜本ブロックはフォームを持たない。リンク経由の遷移
    のみ」・twig:218-271にinput/form要素0件=grep実測・Controllerにフォーム生成なし〔createBuilder/createForm
    不出現=index/searchNonStock/searchCustomer実測〕）＝必須/相関バリデーションという観測主語が不存在
    （constraint不存在型=m05-16/m02-02 EX-Aと同型）。エラーあり側は発生手段なし・エラーなし側は
    「〜バリデーションで」の限定が構成不能のため両極性とも過剰生成。偽陰性チェック: 「エラーなく継続」の
    意味成分は073/075がC-002へ、「フォームを持たない」事実は077がC-005へbound済み。
  - **EX-B（037,039,041,042,044,046,047,049,051,053,054,056,058,059・14件）**: 期待は「登録内容/実行結果/
    更新内容の対象レコードが追加される/値が変更されること」の**肯定**定型（-059はIT-05だが同型の肯定文）。
    §0裁定（DOC-DRAFT-m02-04-2: 設計4箇所md:27,169,191,315＋実装grep 0件）のとおり本機能に登録/更新は不存在
    ＝肯定側の観測対象が不存在で過剰生成。**否定側6行（038,043,045,050,055,057「追加/変更されない」）は
    全行C-030へbound**（無書込ブラケットが期待テキストどおりの観測）＝否定側を除外しない（偽陰性ゼロ）。
  - **EX-C（040,080・2件）**: 期待は両行とも「ホームの件数表示自体とは別レイヤであること」＝設計書権限節の
    委譲文の転記（md:235「一覧・編集での操作権限｜ホームの件数表示自体とは別レイヤ。商品一覧・会員一覧・
    商品編集の可否はそれぞれの機能の権限設計に従う」逐語）。本機能スコープの検証命題を含まない
    （m02-01 EX-E/m10-11 EX-Eと同型）。偽陰性チェック: 認可の実在成分（未認証は利用不可）は079がC-001へ
    bound済み。
  - **EX-D（076・1件）**: 期待「当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）で
    あること」＝設計書DB操作節（md:216）の定型文で、同一設計書のread-only明記4箇所と**設計内で矛盾**
    （DOC-DRAFT-m02-04-2）。「当機能が行う登録・更新」=空集合のため検証命題不成立＝設計書errata候補
    （既存 `m02_04_..._e2e_cases.md` 付帯表4#5で要確認登録済み）。負成分「不要な削除は含まない」は
    C-030（行数不変=削除もない）が被覆＝偽陰性なし。
- **極性・ノイズ処理の明示（C4-manual対象=§10）**:
  - **016（DB相関エラーなし）はexcludedにしない=semantic bind**: 本機能の処理本体はDB照会（3指標count）であり、
    「DBとの相関でエラーが出ず継続」の実在対応は「照会結果が空でもエラーなく0表示で継続」（md:155=L1-009）
    →C-017。Symfony Form制約の存在は意味しない（過大主張しない）。対の**017はTBD**（DB障害→共通例外委譲・
    md:42がHTTP/例外列挙をスコープ外と明記＝オラクル化不能。excludedにしない=実在仕様）。
  - **IT-23系の定型「検索条件/実行結果の該当レコードが取得結果に含まれる（含まれない）」**: 本機能の「取得」は
    3指標の集計読取（md:96,126-128）と遷移先一覧の初期検索（md:250-254）。実フィルタが実在するため
    「含まれる/含まれない」は**算入/不算入・上書き反映として実現・反証可能**＝bound（m02-01の判定と同根拠。
    m10-11型の無条件全件取得ではない）。前提列が具体機能語と噛み合う行（019=廃止・020=0件・021/022/023=
    リンク前残存条件）は当該観測へ、それ以外の汎用行は算入側=C-011/C-013/C-014・不算入側=C-012/C-013/C-014へ
    shared bind。
  - **067（外部連携委譲文）はboundだが限定**: 委譲宣言（他設計を正とする）は検証対象外とし、同一設計文の
    観測可能部分「本ブロックは表示時点の永続化済みデータだけを読む」（md:170後段）をC-031で担保
    （m02-02 058と同処理）。
  - **052（CSS・共通クラス）・072（SSR）・64（参照時点）は具体観測へ**: C-002（クラス・3行縦）・C-033・
    C-003/C-031。

### 81対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 表示可能な規格のうち在庫無制限でなく在庫数量0の規格を持つ商品の件数であること | bound | C-011,C-012 (shared・定義の算入/不算入両面) |
| 002 | 会員ステータスが本会員である会員の件数であること | bound | C-014 |
| 003 | 商品一覧・会員一覧が初回表示や再表示で参照する検索条件セッション領域であること | bound | C-023（会員側=参照の実観測）,C-021（商品側=BC-DRAFT） (shared) |
| 004 | 管理者認証後に表示されるダッシュボードであること | bound | C-002 |
| 005 | ショップ状況カードに3指標が数値で表示されること | bound | C-002,C-003 (shared) |
| 006 | 在庫なし条件を商品一覧向け検索条件として保存し商品一覧へ遷移すること | bound | C-020（遷移・redirect）＋C-021（保存の反映=BC-DRAFT・要実機） |
| 007 | 商品一覧へ遷移すること | bound | C-022 |
| 008 | 本会員条件を会員一覧向け検索条件として保存し会員一覧へ遷移すること | bound | C-023 |
| 009 | 必須バリでエラーが表示され完了しないこと | **excluded** EX-A | — |
| 010 | 必須バリでエラーが表示されず継続できること | **excluded** EX-A | — |
| 011 | 本ブロック専用の JavaScript は持たないこと | bound | C-004 |
| 012 | 相関バリでエラーが表示され完了しないこと | **excluded** EX-A | — |
| 013 | 相関バリでエラーが表示されず継続できること | **excluded** EX-A | — |
| 014 | 相関バリでエラーが表示されず継続できること | **excluded** EX-A | — |
| 015 | 相関バリでエラーが表示され完了しないこと | **excluded** EX-A | — |
| 016 | DB相関バリでエラーが表示されず継続できること | bound | C-017（semantic bind: 照会空でもエラーなく0表示継続） |
| 017 | DB相関バリでエラーが表示され完了しないこと | **TBD**（L1-024） | —（DB障害→共通例外委譲。観測契約が設計スコープ外=md:42） |
| 018 | 在庫数量が 0 でも在庫切れ商品数には数えないこと（非表示規格） | bound | C-012 |
| 019 | 該当レコードが取得結果に含まれること（前提=廃止ステータスの商品） | bound | C-016（廃止でも在庫切れに算入） |
| 020 | 含まれないこと（前提=該当データ0件） | bound | C-017（0件=取得結果に該当なし→0表示） |
| 021 | 含まれること（前提=在庫切れリンク押下前に商品一覧条件残存） | bound | C-021（上書き後の在庫なし該当が一覧取得結果に含まれる=設計期待・BC-DRAFT） |
| 022 | 含まれないこと（前提=会員数リンク押下前に会員一覧条件残存） | bound | C-023（旧条件は使われず非本会員は取得結果に含まれない） |
| 023 | 含まれること | bound | C-011,C-013,C-014 (shared・算入側) |
| 024 | 含まれないこと | bound | C-012,C-013,C-014 (shared・不算入側) |
| 025 | 含まれること | bound | C-011,C-013,C-014 (shared) |
| 026 | 含まれないこと | bound | C-012,C-013,C-014 (shared) |
| 027 | 含まれること | bound | C-011,C-013,C-014 (shared) |
| 028 | 含まれないこと | bound | C-012,C-013,C-014 (shared) |
| 029 | 含まれること | bound | C-011,C-013,C-014 (shared) |
| 030 | 含まれないこと | bound | C-012,C-013,C-014 (shared) |
| 031 | 含まれること | bound | C-011,C-013,C-014 (shared) |
| 032 | 含まれないこと | bound | C-012,C-013,C-014 (shared) |
| 033 | 実行結果の該当レコードが取得結果に含まれること | bound | C-011,C-013,C-014 (shared) |
| 034 | 含まれること | bound | C-011,C-013,C-014 (shared) |
| 035 | 含まれること（前提=dtb_product_class） | bound | C-011 (shared・規格結合の実体) |
| 036 | 含まれること | bound | C-011,C-013,C-014 (shared) |
| 037 | 登録内容の対象レコードが**追加される**こと | **excluded** EX-B | — |
| 038 | 追加され**ない**こと | bound | C-030（無書込ブラケット） |
| 039 | 追加されること | excluded EX-B | — |
| 040 | ホームの件数表示自体とは別レイヤであること | **excluded** EX-C | —（権限委譲文=検証命題なし） |
| 041 | 追加されること | excluded EX-B | — |
| 042 | 追加されること | excluded EX-B | — |
| 043 | 追加され**ない**こと | bound | C-030 (shared) |
| 044 | 追加されること | excluded EX-B | — |
| 045 | 追加され**ない**こと | bound | C-030 (shared) |
| 046 | 追加されること | excluded EX-B | — |
| 047 | 実行結果の対象レコードが追加されること | excluded EX-B | — |
| 048 | 本会員条件を保存し会員一覧へ遷移すること（008と同文） | bound | C-023 (shared) |
| 049 | 更新内容の対象レコードの値が**変更される**こと | **excluded** EX-B | — |
| 050 | 変更され**ない**こと | bound | C-030 (shared) |
| 051 | 変更されること | excluded EX-B | — |
| 052 | 管理画面共通のカード・行・アイコン・余白・枠線のクラスで3行を縦に並べて表示すること | bound | C-002（クラス・行構成の実観測） |
| 053 | 変更されること | excluded EX-B | — |
| 054 | 変更されること | excluded EX-B | — |
| 055 | 変更され**ない**こと | bound | C-030 (shared) |
| 056 | 変更されること | excluded EX-B | — |
| 057 | 変更され**ない**こと | bound | C-030 (shared) |
| 058 | 変更されること | excluded EX-B | — |
| 059 | 実行結果の対象レコードの値が変更されること | excluded EX-B | — |
| 060 | 件数は 0 として表示すること | bound | C-017 |
| 061 | 既存条件をマージせず在庫なし条件だけで上書きすること | bound | C-021（上書き=旧条件消滅の観測＋反映=BC-DRAFT） |
| 062 | 既存条件をマージせず本会員条件だけで上書きすること | bound | C-023 |
| 063 | ショップ状況側では検索条件セッションを更新しないこと（取扱） | bound | C-022 |
| 064 | 3指標はホーム画面表示時にそれぞれDBから読み取った件数であること | bound | C-003,C-031 (shared) |
| 065 | 在庫切れ商品数は商品単位で数えるであること | bound | C-011（複数規格→商品1件） |
| 066 | 本ブロックは参照のみであり商品・商品規格・会員の更新は行わないこと | bound | C-030 |
| 067 | 外部連携の反映タイミングは外部連携/バッチ機能の設計を正とすること | bound | C-031（観測可能部分=表示時点の永続化済みデータ読取。委譲宣言は非オラクル化） |
| 068 | 本ブロックは件数表示のために専用 API を呼び出さないこと | bound | C-034 |
| 069 | 本ブロックはバッチを起動しないこと | bound | C-035（**実行保留=観測未契約**・§9-8） |
| 070 | API/バッチ実行の成否を本ブロック内で判定しないこと | bound | C-036 |
| 071 | ホーム画面表示要求および各リンクの GET 要求であること | bound | C-037,C-020,C-022,C-023 (shared・入力=GETのみ) |
| 072 | サーバ側がHTMLを組み立てその一部としてカードに各件数を載せるであること | bound | C-033 |
| 073 | 画面表示データでエラーが表示されず継続できること | bound | C-002 (shared・正常表示エラーなし) |
| 074 | ホーム表示処理だけを見ると商品・会員・受注等の台帳を更新しないこと | bound | C-030 (shared) |
| 075 | 画面表示データでエラーが表示されず継続できること | bound | C-002 (shared) |
| 076 | 当機能が行う登録・更新で対象テーブルを直接保存すること | **excluded** EX-D | —（設計内矛盾の定型文=errata候補・DOC-DRAFT-m02-04-2） |
| 077 | 本ブロックはフォームを持たないこと | bound | C-005 |
| 078 | 在庫切れ件数は商品単位であり一覧が在庫なしで絞った行数との一致を保証しないこと | bound | C-038（一致を期待にしない構成的観測） |
| 079 | 利用不可であること（未認証） | bound | C-001 |
| 080 | ホームの件数表示自体とは別レイヤであること（040と同文） | **excluded** EX-C | — |
| 081 | 在庫無制限でなく在庫数量0の規格を持つ商品の件数であること（001と同文） | bound | C-011,C-012 (shared) |

`func_scope_check` 判定: 親81/81会計済み（bound57＋TBD1＋excluded23=81・差分0）・欠落0・理由なし重複0・
補完3行（C-015/C-040/C-042）は§4.2に実体掲載（親空・設計書補完md:148/298/309・母集合会計外）→
**差分0を本文内で実証可能**。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

| # | 事項 | 状態 |
|---|---|---|
| 1 | **DOC-DRAFT-m02-04-1（設計書DBカラム節の列名誤り・要修正候補）** | 設計md:204は在庫切れ条件列を `dtb_product_class`の`stock` と明記し、md:50は「エンティティ定義で実在を確認した名称」と主張するが、**ee `ProductClass` に `stock` 列は不実在**（ProductClass.php全文grep）。実装の在庫実体は `dtb_product_stock.stock`（EC-CUBE拠点=stock_location_id 1・root店舗=base_info_id・DECIMAL NULL可）＝Controller:441-463。md:17/50の自己宣言（DBはee正・確認できない差分は実装で要確認）により**裁定: 観測SQLは実装を正**（L1-005）。利用者観点の期待（md:59定義）は不変。設計書の列名是正は上流（設計書保守）へ申し送り |
| 2 | **DOC-DRAFT-m02-04-2（DB操作節のread-only矛盾・要修正候補）** | md:216 DB操作節「登録/更新｜dtb_customer/dtb_product/dtb_product_class…persist/flush」は、同設計書のread-only明記4箇所（md:27,169,191,315）およびee実装（index/search系/count系にpersist/flush/INSERT/UPDATE 0件=grep実測）と矛盾。既存記録=`m02_04_..._e2e_cases.md`付帯表4#5。**裁定: read-onlyを正**（§0）。IT-26/IT-05系肯定14行のexcluded根拠（§8 EX-B）。期待値を「登録される」側に捏造しない |
| 3 | **BC-DRAFT-m02-04-1（C-021・L1-011）** | 設計md:252「商品一覧の1ページ目で、保存した在庫なし条件を初期条件として扱う」⇔ ee商品一覧の受け側: `SearchProductType` に `stock` フィールド不存在（74-402のadd全列挙。在庫系はstock_from/stock_toのみ）かつ `allow_extra_fields` 未設定＝**Symfony既定false**（FormTypeValidatorExtension.php:58-59）→ submitされた `stock` は**formのextra dataとなり検証エラー対象**（NO_SUCH_FIELD_ERROR=FormValidator.php:191-200）で `getData()` の検索条件へ渡らない（FormUtil.php:47-52経由）。＋`getQueryBuilderBySearchDataForAdmin` に `searchData['stock']` 分岐不存在（ProductRepository.php:1071-。`'stock'`処理はフロント用:888-902のみ）→ ホーム側は書く（Controller:307-309）が**受け側で死んでいる疑い**（「未知キー脱落」でなくextra-data検証エラー経路=codex R1是正・改訂1）。**確定観測は対照商品方式（C-021・改訂1/改訂2）**: 在庫のみ相違のPAIR2商品を投入し、設計期待=対照商品**不在**／現実装=フィルタ無視で**出現**の在/不在で乖離を識別（stock=0商品の出現だけでは無フィルタ表示と区別不能なため判定に使わない）。「在庫のみ相違」は**§2の対称SEED契約**（NONSTOCK/CONTROLとも規格2件・商品/規格/psの全属性一致・対応するps.stockのみ0/10）で担保＝実データへの断定ではなくSEED契約由来。在庫切れ判定EXISTS（Controller:441-463）は規格単位のため、同数規格でps.stockだけ異なる両商品は設計期待側で在/不在が確定的に分かれる（改訂2=codex R2是正: 旧版はCONTROL規格が単数でNONSTOCK〔2規格〕と非対称＝「在庫以外同一条件」がSEED契約で裏付かなかった）。期待値は設計側のまま。実走（cross-feature観測）で乖離を確定し `BUG_CANDIDATE_REGISTER` 系へ正式採番。なお**会員側（L1-013）は消費実在**（SearchCustomerType:69-75＋CustomerRepository:429-433）＝2導線で受け側実装が非対称であることを把握済み（会員側の期待をBC側へ流用しない） |
| 4 | cross-feature観測面（C-021/023/038/040） | 商品一覧・会員一覧の検索フォーム/結果行セレクタは本候補では未契約→**要実機**。判定骨子は§6.1/§6.2で確定（会員側=customer_statusチェック状態＋結果行ステータス／商品側=フォーム復元状態＋結果有無）。既存×（E2E-M02-04-015/016/017/008相当）の失敗理由「一覧側セレクタ/ハーネス未実装」への是正枠 |
| 5 | C-017（0件0表示）の環境前提 | 共有DBでは「3指標とも0件」を保証できない（既存E2E-M02-04-021×と同根）。**隔離DB（フレッシュDB）が実行前提**＝前提不成立時はskip（db.ts式評価0の事前確認をガード）。SEED-M0204-EMPTYは「状態の不在」でありSQL適用では作れない |
| 6 | root店舗ID（環境値） | 在庫切れ式の `ps.base_info_id` は `eccube_root_base_info_id`=env BASE_INFO_ID（既定 `1`=eccube.yaml:59,303。ee側.envに上書きなし=grep実測）。**稼働環境の実効値はD5で確認**し、SEED-M0204-NONSTOCK系のps投入値・db.ts式評価の `:root_base_info_id` を同値に固定（不一致だと集計が0側へ偽って収束するため事前サニティ=SEED適用後に式評価+1を確認する手順3が防御） |
| 7 | SEED生成契約 | dtb_product/dtb_product_class/dtb_product_stock/dtb_customer のNOT NULL列全充足・IDENTITY明示id投入方式・FK整合（pc→p・ps→pc・ps→base_info）・dtb_product/dtb_product_class の base_info_id（TenantTrait=NOT NULL）＝**@TBD-D5**。「規格なし商品」（C-015）はアプリ経由では規格なし登録が通常作れないためSQL直接投入で構成（実データ分布と乖離し得る点はD5で要確認） |
| 8 | C-035（バッチ起動なし） | サーバ側バッチ/プロセス起動の実行時観測手段が未契約→実行保留（claim自体はController静的実測で拘束。DB不変の部分観測はC-030が被覆）。m02-01 C-061と同型 |
| 9 | 拡張フック差し替え環境 | L1-022（ADMIN_ADMIM_INDEX_COMPLETE等）はプラグイン導入環境でのみ発生し標準環境では画面値=ローカル変数由来＝**差し替え環境での実行は対象外**（C-003/C-030は標準環境前提を明記）。「リスナー書換の画面非追随」（md:98）自体はプラグイン導入時のみ観測可能=候補化しない（理由記録。既存記録=付帯表4#4と同判断） |
| 10 | 指標間の整合性（md:167「3指標は独立した問い合わせで同一トランザクションのスナップショットを固定しない」） | 母集合81行に対応する期待テキストが**ない**ため候補化せず（補完も不作成）: 3クエリは単一リクエスト内で連続実行され、クエリ間へ外部からDB変更を注入する決定的手段が標準環境に無い＝観測契約が構成不能（m02-02 C-040のような別リクエスト遅延保留も使えない）。理由記録のみ |
| 11 | マルチテナント分母 | countProducts/countNonStockProductsの商品p側に**テナント条件なし**（在庫EXISTSのみroot店舗×EC-CUBE拠点限定=L1-005/007）＝多店舗データ環境では他店舗商品も分母に入る。db.ts式評価も同一式のため突合は成立するが、業務値としての妥当性は本候補のスコープ外（乖離観測時はBC-DRAFT起票・現時点で乖離主張はしない） |
| 12 | 管理画面のenロケール切替口 | 要D15（-EN 1行の実行前提。W0実測を継承） |
| 13 | manifest_sha1（fixture_version確定） | D5後（現状 `@TBD-D5`。SEED-M0204系SQLは未実装=§2は設計） |
| TBD | 017（L1-M0204-024） | DB読み取り障害→共通例外委譲・専用メッセージなし（md:264,190）。HTTPステータス/例外型の列挙は設計スコープ外（md:42）で観測契約が定義不能＋安全な障害誘発手段なし＝未確定オラクル台帳へ（excludedにしない） |

候補規律: 全行 `@TBD-D5`・O5未確定（D6後に確定検査）・実装/実走なし・O6/聖域/多軸/C6C7を主張しない。
既知バグ: 実装側BC-DRAFTは**1件**（BC-DRAFT-m02-04-1=在庫なし条件の受け側不消費疑い・期待は設計側のまま）。
設計書側DOC-DRAFTは**2件**（#1列名・#2 read-onlyテンプレ）。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象構文（肯定/否定・許可/拒否の対）を列挙し、claim単位で期待テキストとの極性一致を目視確認した:

| 極性対 | 該当行 | 判定 |
|---|---|---|
| 含まれる/含まれ**ない** | 019,021,023,025,027,029,031,033,034,035,036（含まれる）vs 020,022,024,026,028,030,032（含まれない） | 含まれる→算入側（C-011/C-013/C-014・021はC-021の一覧反映）・含まれない→不算入側（C-012/C-013/C-014・020はC-017の0件・022はC-023の旧条件不使用）。実フィルタ（規格条件・ステータスIN・status=2・セッション上書き）実在のためbound（m10-11型の実現不能とは前提が異なる）。取り違えなし |
| 追加され**る**/され**ない** | 037,039,041,042,044,046,047（肯定）vs 038,043,045（否定） | 肯定=EX-B（INSERT経路なし=成立不能・DOC-DRAFT-m02-04-2裁定）・否定=C-030（行数+全列ダイジェスト不変）へbound。**肯定側をboundにする取り違えなし** |
| 変更され**る**/され**ない** | 049,051,053,054,056,058,059（肯定）vs 050,055,057（否定） | 肯定=EX-B（UPDATE経路なし）・否定=C-030。整合 |
| エラー表示され/表示され**ず** | 009,012,015,017（拒否側）vs 010,013,014,016（継続側）vs 073,075（表示データのエラーなし継続） | バリデーション系はフォーム不存在で**両極性とも**EX-A（片極性のみ除外する誤りなし）。016はDB照会実在によるsemantic bind（C-017）・対の017は実在仕様だがオラクル化不能=TBD（excludedにしない）。073/075は主語が「画面表示データ」＝正常表示継続としてC-002へbound |
| 保存する/保存し**ない**（セッション） | 006,061（在庫なし保存・上書き）・008,048,062（本会員保存・上書き）vs 063（取扱=更新しない）・（補完C-040=ホーム表示は更新しない） | 保存側→C-020/C-021（商品・**受け側不消費疑い=BC-DRAFT。判定は対照商品の在/不在=識別観測・改訂1**）・C-023（会員・消費実在）。不保存側→C-022（直リンク・専用ルート不経由の実観測）・C-040（残存条件維持の実観測）。**2導線の受け側実装が非対称（商品=不消費疑い/会員=消費）であることを実装から把握し、会員側の「反映される」観測をBC側の期待に流用しない**（1つの「反映」に丸めると偽オラクル） |
| 数える/数え**ない**（集計） | 001,081,065（在庫切れ算入・商品単位）・019（廃止でも在庫切れ算入）vs 018（非表示は数えない）・（廃止は取扱に数えない=C-013/C-016） | 算入側→C-011/C-016・不算入側→C-012/C-013。**同一入力（廃止×在庫切れ規格）が指標により算入/不算入へ分かれる交差**（md:153）はC-016が両指標同時観測で被覆（指標の取り違えなし） |
| 呼び出す/呼び出さ**ない**・起動する/し**ない**・判定する/し**ない**・持た**ない** | 011（専用JSなし）,068（API呼ばず）,069（バッチ起動せず）,070（成否判定せず）,077（フォームなし） | すべて否定claim。観測契約を有限に限定して構成（C-004=カード内script/handler 0件＋追加リクエスト0件・C-034=リクエスト記録・C-036=カード内要素/文言不在・C-005=要素0件）。C-035のみ観測未契約=実行保留（無限の否定は主張しない）。肯定側の母集合行なし=対不成立の単極。極性反転なし |
| 一致を保証し**ない** | 078 | 非保証の誤反転（「一致すること」を期待化）を回避: C-038は一致を期待値にせず「乖離してもエラーなく継続」の構成的観測（md:225,168の記載どおり） |
| 別レイヤであること | 040,080 | 委譲文=EX-C。「別レイヤ」を権限テストの期待に反転させない（他機能の権限設計はスコープ外） |

- 見出し文言の呼称差（用語「本会員数」vs 画面文言「会員数」=md:61明記）は L1-003 で画面文言側に確定
  （messages.ja.yaml:1878逐語）。**集計対象（本会員限定）と表示見出し（会員数）の非対称を仕様どおりとして
  記録**（憶測でなく一次資料で閉じた）。
- 在庫数量の実体列（設計=dtb_product_class.stock／実装=dtb_product_stock.stock）はDOC-DRAFT-m02-04-1の
  裁定（§9-1）で実装側に確定。**設計の利用者観点定義は維持し、式の実体解決のみ実装層**（期待の書き換えではなく
  観測条件の整合＝m02-02 L1-027と同じ扱い）。
- codex敵対レビュー: **R1=要修正（Major1のみ。excluded=23/TBD=017・DOC-DRAFT-1/-2・href/route識別・捏造ゼロは
  妥当確認済み）→改訂1→R2=未閉包（対照SEED規格数非対称）→改訂2で是正**。R1/R2検出の記録（C4-manual実効性証跡）:
  ①C-021が非識別的（stock=0商品の「出現」は無フィルタでも真＝**確定観測が反証不能な設計になっていた検出例**）
  →対照商品（stock>0）の在/不在判定へ拡張 ②BC根拠の「未知キー脱落」が不正確（実経路は
  allow_extra_fields既定false→extra data検証エラー＝**機構帰属の精度の検出例**）→Symfony実装のfile:lineへ差し替え。
  R2追加検出（改訂2で是正）: ③対照SEEDの規格数が非対称（NONSTOCK=2規格/CONTROL=1規格）＝「在庫以外同一条件」
  の断定がSEED契約で裏付かない（**前提保証と観測主張の不一致の検出例**）→CONTROLを規格2件・全属性一致・
  対応するps.stockのみ相違の対称契約へ修正し、同一条件記述をSEED契約由来と明示。
  →ヘッダ/§1 L1-011/§2/§4 C-021/§9-3/oracle jsonへ反映済み。**R3再確認待ち**。

---

## 付録: 作業実測（B0係数計測用）

- 読んだ一次資料・参照物: 設計書md 1（317行全文）／ee実ソース・設定 20超（AdminController〔index/
  searchNonStockProducts/searchCustomer/countNonStockProducts/countProducts/countCustomers〕・index.twig
  ショップ状況カード全文・ProductStock+TenantTrait・ProductClass・Product・Customer・ProductStatus・
  CustomerStatus・CustomerDeleteFilter・doctrine.yaml・security.yaml・eccube.yaml・ProductController〔一覧側
  GET/POST分岐〕・CustomerController〔同〕・SearchProductType〔add全列挙〕・SearchCustomerType・
  ProductRepository〔ForAdmin/front stock filter〕・CustomerRepository・FormUtil・Twig CoreExtension〕／
  locale 2（messages ja/en該当帯）／母集合・fid_kubun 2／統治・見本 4（CFP・ROLLOUT・m02-01・m02-02草案）／
  既存資産 4（e2e_cases md・page・spec・db.ts/oracle.ts）。
- L1 claim数: **23確定＋1 TBD**（=24行）。候補ケース行27（ja26・-EN1）。
- ショップ状況特有の難所: (1) **在庫実体列の設計書誤記**（dtb_product_class.stock不実在→dtb_product_stock＋
  拠点/店舗スコープ）＝裁定なしには集計オラクルのSQLが書けない（DOC-DRAFT起票で裁定を監査可能化）
  (2) **2導線の受け側非対称**: 会員一覧は customer_status を消費（フィールド実在+repo適用）・商品一覧は
  'stock' を消費しない疑い（フィールド不在→allow_extra_fields既定falseでextra data検証エラー対象＋repo分岐なし）
  ＝BC-DRAFT-m02-04-1。「検索条件セッション」系の期待を1つの観測に丸めると偽オラクルになる。乖離の確定観測は
  対照商品（同一他条件・stock>0）の在/不在=識別観測（codex R1是正）
  (3) **環境依存の分母**: 商品側にテナント条件なし・在庫EXISTSのみroot店舗×EC-CUBE拠点＝db.ts式評価は
  実装層条件（base_info_id/stock_location_id/del_flg）まで明示して初めて突合可能
  (4) IT-26系の肯定/否定とIT-23系の含む/含まれないが混在する母集合で、read-only裁定と算入/不算入bindの
  仕分けが最大の読解コスト（m02-01/m02-02の先例でパターン化済み）。

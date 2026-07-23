# B0候補: m02-01 管理画面_トップ受注状況 — 実行可能グレード候補（母集合80全量踏破）

> 2026-07-23 ／ **候補グレード（candidate・D6前・O5未確定・実装/実走なし）**
> codexレビュー: 未実施（本版=R0著作。台帳 `REVIEW_LEDGER.md` への記帳はレビュー後）。
> source_class=standard-src+design は fid_kubun.tsv（D1・fid_kubun.tsv:163）による**暫定付与**（確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> fixture_version は全て `@TBD-D5`。統治: `integration_test/CONCRETIZATION_FIRST_PLAN.md`（改訂2・三段会計）＋
> `integration_test/CONCRETIZATION_ROLLOUT_PLAN.md`（改訂2・B0バッチ2＝M02×6の先頭）。
> 正典: `integration_test/e2e/PILOT_m09_01_news_executable_grade.md`／同型見本: codex承認済み候補6本
> （m09-01・m05-16・m10-11・m03-11・m01-01・m01-02 の各 `_drafts/*_executable_draft.md`）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m02-01_admin_home_home_order_status_oracle_draft.json`。
> 正式パス `e2e/fixtures/oracle/` 直下には書かない。
> **行数集計**: 候補ケース行総数**23**＝bound対応21＋-EN 1（bound親従属）＋補完1。
> 母集合80全数会計＝**bound 55／TBD 0／excluded 25**（§8）。
> **不具合候補**: BC-DRAFT-m02-01-1（ステータス行クエリの一覧側不消費＝設計md:75と実装の乖離。§9-1）。
> **改訂1: codexレビューR1「要修正」（Blocker1＋Major3＋Minor1）の全数是正**＝
> (1) L1-M0201-017/C-062の過大claim撤回（「他ブロックAjax失敗時もカードは初期HTMLのまま」は一次資料から
> 導けない→期待から除去し、通常表示での成否分岐/専用文言不在の観測へ限定。abort観測は§9-4の要確認へ分離）
> (2) 059根拠の付け直し（Order.php:630誤引用とFK断定を撤回。「除外により表示対象マスタ一覧に出ない」形＝
> 設計md:143判定順序#3/md:164の文脈で根拠付け）
> (3) 行識別子をDOM各行リンクの`order_status_id`クエリ値へ統一（C-010/011/012/013/014/015/021/022/050/005。
> `mtb_order_status.name`に一意制約なし＝名称→id復元を廃止）
> (4) 母集合003の対応強化（C-020に受注一覧の画面識別子`#search_form`観測を追加）
> (5) L1-M0201-005出典に集計側引数渡し`AdminController.php:131`を追加。
> **excluded=25・検索系019-035のbound・m10-11対比はcodex妥当確認済み=維持**。

## §0 版固定

- 設計書正本: `functions/ec-cube-enterprise/m02-01_admin_home_home_order_status.md`
  （本repo HEAD `d1e94c5e38246d0eff45b4079ee42397c994e69d` 時点。以下「md:行」）。
- ee実ソース: `/home/y-saito/Developments/ec-cube-enterprise/` コミット
  `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51`（W0-W2・B0バッチ1と同一）。
- fid_kubun.tsv（D1・sha256先頭 `44fbf02f1e4c`）:
  `M02-01｜m02-01_admin_home_home_order_status｜受注状況｜対象｜標準｜standard-src+design｜区分不明=0`
  （fid_kubun.tsv:163）→ **標準＝ee実ソース直接可＋設計書md**（暫定付与・確定はD6）。
- 母集合: baseline `integration_test/all_it_cases.tsv`（sha256先頭 `7911f190d273`）M02-01全**80行**
  （IT-M02-01-ADMIN-HOME-HOME-ORDER-STATUS-001〜080＝tsv行4129〜4208。以下「-nnn」）。
- 本機能は**カスタマイズ区分=標準**（md:17「挙動・画面とも移行先のec-cube-enterpriseの実装を正とする」）。
- **判定原則（W0-W2教訓）**: 観点ラベル・前提条件列のシナリオ語は生成器ノイズ。bindは各行の
  **「期待結果／レスポンス」実テキスト**で判定し、極性も期待テキストで確認する（§8に全80行の期待要旨併記）。
- 既存実行実績（参考・本候補の会計外）: `integration_test/e2e/m02_01_admin_home_home_order_status_e2e_cases.md`
  （2026-07-06 Codex実走 **12〇/5×**。×=件数厳密系021/022/023/024〔SEED未作成でfixme〕・050〔障害注入手動〕）。
  セレクタ（#order-status 等）は同実走で実機実績あり。本候補の行としては未実走。
- 主要一次資料の略記:
  - Controller = `src/Eccube/Controller/Admin/AdminController.php`（route `admin_homepage`）
  - twig = `src/Eccube/Resource/template/admin/index.twig`（受注状況カード=121-143）
  - OrderStatus = `src/Eccube/Entity/Master/OrderStatus.php`／基底 = `src/Eccube/Entity/Master/AbstractMasterEntity.php`
  - Order = `src/Eccube/Entity/Order.php`（dtb_order）
  - OrderCtl = `src/Eccube/Controller/Admin/Order/OrderController.php`（受注一覧側・cross-feature確認用）
  - ja/en = `src/Eccube/Resource/locale/messages.{ja,en}.yaml`
  - csv = `src/Eccube/Resource/doctrine/import_csv/{ja,en}/mtb_order_status.csv`
  - mig = `app/DoctrineMigrations/Version20251125150428.php`・`Version20260220000001.php`
  - page = `e2e/pages/admin/m02/m02_01_admin_home_home_order_status.page.ts`（既存・変更なし）

## §1 L1原子オラクル表

全20claim。本機能は**フォーム・入力・保存を持たない参照専用ブロック**のため文字数系unitなし。
LS=locale_sensitive（0は理由コード）。en文言はen一次資料逐語（ja翻訳ゼロ）。
**期待値の正は本表のオラクルID**（SEED値・DB照会値は入力再現手段/観測値であり期待の正にしない＝三段参照）。

| oracle_id | 観点 | claim | 逐語quote | 根拠(file:line) | LS |
|---|---|---|---|---|---|
| L1-M0201-001 | auth_rule | 未認証の `GET /%eccube_admin_route%/` は admin firewall の form_login により admin_login のログイン画面へリダイレクトされ、ホーム（受注状況カード #order-status）へ到達しない | `admin:`…`pattern: ['^/%eccube_admin_route%/',…]`…`form_login:`…`login_path: admin_login`／「非管理者・未認証 \| `GET /%eccube_admin_route%/` 等（到達前にログインへ） \| ホーム画面自体に到達できないため、本カードも利用できない。」 | security.yaml:40-47／md:76,240 | 0 `non-translated` |
| L1-M0201-002 | http_status | 認証済み管理者の `GET /%eccube_admin_route%/`（route `admin_homepage`・methods GET）はHTTP200でダッシュボード（@admin/index.twig）を表示し、受注状況カードを含む | `#[Route(path: '/%eccube_admin_route%/', name: 'admin_homepage', methods: ['GET'])]`・`#[Template(template: '@admin/index.twig')]`／「ホーム画面 \| 管理者認証後に表示されるダッシュボード。受注状況はその一部ブロックである。」 | Controller:102-104／md:64,241 | 0 `non-ui-observable` |
| L1-M0201-003 | display_field | カード根は `#order-status`。card-header の見出しは `admin_order` へのリンクで、文言はキー `admin.home.order_status_title`＝ja「注文状況」／en "Order Status"（設計上の呼称「受注状況」に対し画面文言は「注文状況」＝md:7明記） | `<div id="order-status" class="card rounded border-0 h-100">`…`<a href="{{ url('admin_order') }}"><span class="card-title">{{ 'admin.home.order_status_title'\|trans }}</span></a>`／`admin.home.order_status_title: 注文状況`／`admin.home.order_status_title: Order Status`／「日本語ロケールではカード見出しが「注文状況」となる」 | twig:121-125／ja:1874／en:1852／md:7,60 | 1 |
| L1-M0201-004 | display_field | card-body は OrderStatuses（除外通過済み）を行ループし、各行= `a`（行リンク）内に 名称 `span`＋件数 `span.h4`。件数は整数（Twig出力そのまま・整形なし）。カード内に見出しと受注ステータス別の行のみ | `{% for OrderStatus in OrderStatuses %}`…`<span class="align-middle">{{ OrderStatus.name }}</span>`…`<span class="h4 align-middle fw-normal text-dark">{{ Orders is not empty and Orders[OrderStatus.id] is defined ? Orders[OrderStatus.id] : 0 }}</span>`／「受注状況カードには、見出しと受注ステータス別の行を表示する。各行はステータス名と件数で構成し、件数は整数として表示する。」 | twig:128-141／md:84,73 | 0 `data-passthrough` |
| L1-M0201-005 | business_rule | 除外ステータス集合＝**{CANCEL=3, DELIVERED=5, PENDING=7, PROCESSING=8, RETURNED=15}**（既定値）。同一の `$excludes` 配列が**件数集計（`getOrderEachStatus($excludes)` への引数渡し→SQL NOT IN）と表示行マスタ取得（Criteria notIn）の双方**に適用される。拡張フック `ADMIN_ADMIM_INDEX_ORDER` が配列を差し替え得る（プラグイン未導入環境では既定値＝本候補の前提） | `$excludes[] = OrderStatus::CANCEL; $excludes[] = OrderStatus::DELIVERED; $excludes[] = OrderStatus::PENDING; $excludes[] = OrderStatus::PROCESSING; $excludes[] = OrderStatus::RETURNED;`…`$this->eventDispatcher->dispatch($event, EccubeEvents::ADMIN_ADMIM_INDEX_ORDER); $excludes = $event->getArgument('excludes');`…`$Orders = $this->getOrderEachStatus($excludes);`…`->where($Criteria::expr()->notIn('id', $excludes))`／`public const CANCEL = 3;`・`DELIVERED = 5;`・`PENDING = 7;`・`PROCESSING = 8;`・`RETURNED = 15;`／「件数集計と表示対象ステータスは同一の除外リストを使う」 | Controller:114-119,121-128,**131**,136／OrderStatus.php:35,39,43,45,57／md:97-99,153,175,231 | 0 `non-translated` |
| L1-M0201-006 | aggregation | 件数= `dtb_order` を `order_status_id` でGROUP BYし `COUNT(t1.id)`（除外はWHERE `NOT IN (:excludes)`）。期間・会員・支払方法・配送先・店舗の絞り込み条件は**課さない**（SQLにこれらの条件が存在しない＝全件集計） | `SELECT t1.order_status_id as status, COUNT(t1.id) as count FROM dtb_order t1 WHERE t1.order_status_id NOT IN (:excludes) GROUP BY t1.order_status_id ORDER BY t1.order_status_id`／「期間による絞り込み、会員、宛先、支払方法、店舗などの業務的条件は課さない。台帳に存在する受注行を対象とする。」 | Controller:337-362(SQL:339-349)／md:103-105,130 | 0 `data-passthrough` |
| L1-M0201-007 | display | 件数対応表に当該識別子が無いステータス行は件数 **0** を表示（マスタに存在し除外されないステータスは0件でも行として残る） | `{{ Orders is not empty and Orders[OrderStatus.id] is defined ? Orders[OrderStatus.id] : 0 }}`／「マスタに存在し、該当受注が 0 件のステータス \| 除外リストに含まれなければ、行を表示し、件数は 0 とする。」 | twig:136／md:110,155,162 | 0 `data-passthrough` |
| L1-M0201-008 | display_order | 行の並び＝`sort_no` 昇順（`orderBy(['sort_no' => 'ASC'])`）。**マスタ行集合は環境依存**（インストール経路: csv ja/en=8行〔id 1,3,4,5,6,7,8,9〕 vs mig=insert-if-absent 13行〔+2,10,12,13,14,15〕＋名称UPDATE 4件）のため、全行一致の分母は**db.ts照会値**とし、帯行の相対位置と単調性で観測する | `$Criteria->where($Criteria::expr()->notIn('id', $excludes))->orderBy(['sort_no' => 'ASC']);`／「ステータス行の順序は受注ステータスマスタの表示順に従う。件数の多い順には並べ替えない。」／`UPDATE mtb_order_status SET name = '注文受領' WHERE id = 1;` 等 | Controller:134-138／md:109,154,213／csv ja:1-9／mig Version20251125150428:59-116・Version20260220000001:47-50,64-75 | 0 `data-passthrough` |
| L1-M0201-009 | nav | カード見出しリンクの遷移先= `url('admin_order')`＝`GET /%eccube_admin_route%/order`（受注一覧＝**検索フォームを持つ検索・一覧表示画面**。画面識別子=検索フォーム `#search_form`）。**order_status_id クエリを付与しない** | `<a href="{{ url('admin_order') }}">`（url第2引数なし）／`#[Route(path: '/%eccube_admin_route%/order', name: 'admin_order', …)]`／`<form name="search_form" id="search_form" method="POST" action="{{ url('admin_order') }}">`／「受注状況カードの見出しを押下 \| 受注一覧へ遷移する。ステータス条件は付与されない」／「受注一覧 \| 受注を検索・一覧表示する管理画面。」 | twig:123／OrderCtl:138／Order/index.twig:349／md:74,115,156,250,65 | 0 `non-translated`（画面同定はURL/route＋`#search_form`存在＝locale非依存で自立。見出し文言 ja「受注一覧」/en "All Orders"〔Order/index.twig:14・ja:2455・en:2302〕は補助観測＝判定要素にしない） |
| L1-M0201-010 | nav | 各ステータス行リンクの href= `url('admin_order', {'order_status_id': OrderStatus.id})`＝`/order?order_status_id=<当該ステータスid>`（行ごとに当該idが載る） | `<a href="{{ url('admin_order', { 'order_status_id': OrderStatus.id }) }}" class="p-3 d-block">`／「ステータス行 \| 当該ステータス識別子を一覧へ渡す。」 | twig:130／md:75,121,156,259 | 0 `non-translated` |
| L1-M0201-011 | cross_feature（**乖離検出対象**） | 設計md:75「（ステータス識別子が）クエリで渡されている場合は一覧の初期検索条件に反映される」。**一方 ee受注一覧実装は `order_status_id` を消費しない**（OrderCtl全文に `order_status_id` 出現0件=grep実測。GET初期表示は「検索を実行しない」＋検索セッション削除）→ **設計期待と実装の乖離＝BC-DRAFT-m02-01-1**。期待値は設計側のまま（実装へ寄せない）。観測は受注一覧側（cross-feature）＝要実機で乖離確定 | 「受注一覧へ遷移し、そのステータス識別子がクエリで渡されている場合は一覧の初期検索条件に反映される」／`// 初期表示か否か. 初期表示の場合は検索を実行しない.`…`$isInitialDisplay = true; $this->session->remove('eccube.admin.order.search');`…`// 初期表示では検索を実行しない.` | md:75,122／OrderCtl:181,226-241,244（`order_status_id` 出現0件=実測） | 0 `non-ui-observable` |
| L1-M0201-012 | no_ui | カード内にフォーム・テキスト入力（form/input/textarea/select）・モーダル・ポップアップ・トースト・確認ダイアログ・本ブロック専用JSは存在しない | 「本ブロックはモーダル、ポップアップ、トースト、確認ダイアログを表示しない。」「本ブロックはフォーム・テキスト入力を持たない。ステータス行のリンク押下のみ。」「本ブロック専用の JavaScript は持たない。」／twig:121-143に form/input/modal 要素0件（実測） | md:85-88／twig:121-143 | 0 `non-translated` |
| L1-M0201-013 | no_api | 件数はホーム画面HTMLのサーバ側レンダリングに含まれ、本ブロックは件数表示のための専用APIを呼び出さない（売上グラフのAjax `admin_homepage_sale` は別ブロック=md:12） | 「本ブロックは件数表示のために専用 API を呼び出さない。ホーム画面の HTML レンダリング時にサーバ側で件数を取得する。」／`$Orders = $this->getOrderEachStatus($excludes);`（index()同期実行）＋return配列で twig へ | md:186,12／Controller:131,193-204／twig:136 | 0 `non-ui-observable` |
| L1-M0201-014 | read_only | 表示処理は `dtb_order`・`mtb_order_status` を更新しない（INSERT/UPDATE/DELETEなし。本ブロックのためのセッション書換もない）。Controller::index は SELECT系のみで persist/flush 出現なし（実測） | 「本ブロックは参照のみであり、受注やステータスマスタを更新しない。」「本ブロックの表示処理だけを見ると、受注台帳やマスタを更新しない。セッションも本ブロックの表示のためには書き換えない。」 | md:177,199／Controller:104-205（persist/flush不出現=実測） | 0 `non-ui-observable` |
| L1-M0201-015 | refresh | 表示中の件数は自動更新しない（ポーリング/Ajax更新なし）。ホーム画面再表示時にその時点の台帳を再集計した結果を表示する | 「表示後に受注ステータスが更新された \| 表示中の件数は自動更新しない。ホーム画面再表示時に再集計される。」「受注状況の件数は、ホーム画面表示時にデータベースから読み取った結果である。」 | md:166,174,252 | 0 `data-passthrough` |
| L1-M0201-016 | input | 入力=ホーム画面表示要求（GET）のみ。ボディ入力なし。**クエリでステータスを本ブロックが受け取る設計にしない**（index() の `$request` 使用はEventArgs引渡しのみ＝クエリ読取なし・実測）→ 不要クエリを付与してもカードの行・件数は不変 | 「入力 \| ホーム画面表示要求。ボディ入力はない。クエリでステータスを本ブロックが受け取る設計にはしない。」／`public function index(Request $request): array`（$requestはnew EventArgs(…, $request)のみに使用） | md:196,230／Controller:104,121-127,143-148,171-184 | 0 `non-translated` |
| L1-M0201-017 | isolation | API呼び出しやバッチ実行の成否を本ブロック内で判定しない（カード内に成否判定に基づく表示分岐・専用フォールバック/エラー文言を持たない）。DB読み取り失敗時はアプリケーション共通例外処理へ委譲。**一次資料から確定できるのはここまで**＝「他ブロックのAjax失敗時もカードは初期HTMLのまま」は導けないため**claimに含めない**（改訂1でBlocker是正・abort観測は§9-4の要確認へ分離） | 「API 呼び出しやバッチ実行の成否を本ブロック内で判定しない。」「本ブロック単体のフォールバック文言は専用に定義しない。」「アプリケーションの共通例外処理に委ねる。本ブロック専用の利用者向けメッセージは設けない。」 | md:188,198,267 | 0 `non-translated` |
| L1-M0201-018 | db_schema | `mtb_order_status`: id=smallint（採番なし=GeneratedValue NONE）・name=string(255)・sort_no=smallint（共通基底）。`display_order_count`（boolean・default false）は**ホームの受注状況カード行生成では参照しない**（twig全文にdisplay_order_count出現0件=実測） | `#[ORM\Column(name: 'id', type: Types::SMALLINT, …)] #[ORM\GeneratedValue(strategy: 'NONE')]`…`name…length: 255`…`sort_no…SMALLINT`／`#[ORM\Column(name: 'display_order_count', type: Types::BOOLEAN, options: ['default' => false])]`／「display_order_count \| 他画面用途の列としてエンティティに存在する。ホーム画面の受注状況テンプレートの行生成ではこの列を参照しない実装である。」 | AbstractMasterEntity.php:32-41／OrderStatus.php:78-79／md:205-214／twig全文grep=0件 | 0 `non-ui-observable` |
| L1-M0201-019 | no_batch | 本ブロックはバッチを起動しない（バッチ更新済みデータは次回表示時に読むだけ）。**サーバ側バッチ起動有無の実行時観測手段は未契約**（§9-3。claim自体はController:104-205にコマンド起動なし=静的実測で確定） | 「バッチ \| 本ブロックはバッチを起動しない。バッチによって受注が更新済みの場合、次回のホーム画面表示時にその時点の永続化済みデータを読む。」 | md:187／Controller:104-205 | 0 `non-ui-observable` |
| L1-M0201-020 | data | 行のステータス名= `mtb_order_status.name` のpassthrough表示。名称は**翻訳カタログでなくマスタデータ**（インストール経路依存: csv ja「新規受付」等8行／csv en "New"等8行／mig名称UPDATE「注文受領」「キャンセル」「出荷完了」「出荷指示」）→ 文言比較の基準は**db.ts実値**（固定リテラルを期待にしない） | `{{ OrderStatus.name }}`／csv ja:`"1","新規受付","0","1"`…／csv en:`1,New,0,1`…／`UPDATE mtb_order_status SET name = '注文受領' WHERE id = 1;` | twig:133／csv ja:1-9・en:1-9／mig Version20260220000001:47-50／md:212 | 0 `data-passthrough`（ロケール差はデータ差＝翻訳分岐でない） |

## §2 SEED三段参照設計（全て `@TBD-D5`）

三段参照: **期待の正=L1オラクルID（§1） → 前提状態=SEEDセットID@manifest_sha1 → 観測=実値**。
下表の固定値は**入力の再現手段**であり期待値の正にしない。**集計件数の判定は「画面件数 = db.tsで同一SQL意味論
（L1-006の集計）を照会した値」との突合**とし、SEED設計値N=3は投入の再現手段（三段の中段）に留める。

| SEED | 内容 | 用途 |
|---|---|---|
| SEED-M01-ADMIN | 管理者ログイン（既存共通・2FAなし） | 全認証済みケース |
| SEED-M0201-STATUS | `mtb_order_status` 帯行2件: id=**980**（name=`E2E受注状況980`, sort_no=980, display_order_count=false）・id=**981**（name=`E2E受注状況981`, sort_no=981, display_order_count=false）。両idとも除外集合{3,5,7,8,15}に非該当＝カード表示対象・sort_no最大帯で末尾表示。id帯980-981はsmallint上限32767内・初期データ最大id=15と衝突せず、m10-11帯（990-993）とも重複しない | 0件表示（C-013）・件数一致（C-014）・並び（C-011）・display_order_count非参照（C-005補完） |
| SEED-M0201-ORDERS | `dtb_order` 帯行5件: id=900002101〜900002103（order_status_id=**981**・3件。**属性を意図的に異種化**: 会員紐付き/ゲスト・支払方法違い・900002103は order_date=2000-01-01 の古日付）＋id=900002104〜900002105（order_status_id=**3**〔CANCEL=除外〕・2件）。name01/name02/create_date/update_date等の必須列充足と IDENTITY 明示id投入方式（OVERRIDING等）は**D5型SEED契約で確定=@TBD-D5**（§9-5） | 件数一致=3（C-014: 属性差で間引かない・期間で間引かない を同一SEEDで被覆）・除外不算入（C-015）・自動更新なし（C-050の+1追加はdb.tsで id=900002106 を都度投入→afterEach削除） |
| SEED-M0201-NONE | 追加データなし（帯外は投入しない） | 未認証系・表示系の非破壊ケース |

- **隔離**: 帯status行980/981は受注一覧の検索選択肢等（他機能）へ露出し、帯orderは売上集計ブロック
  （m02-02/03）の分母に影響し得る → **フレッシュDB/serial前提・共有環境では実行しない**
  （`e2e-standard-run-requirements` 準拠）。afterEachで帯行DELETE→SEED再適用（べき等）。
- 集計分母の環境依存（L1-008）対策: 「全行」系の観測は分母をdb.ts照会値にする（固定行数を期待にしない）。

## §3 表示項目／集計マトリクス（本機能はフォームなし＝入力制約マトリクスは非該当）

| 項目 | 表示/挙動 | 観測 | 根拠 |
|---|---|---|---|
| カード見出し | 「注文状況」(ja)/"Order Status"(en)・admin_orderへのリンク | #order-status .card-title文言・.card-header a[href] | L1-003,009 |
| ステータス行（行集合） | 除外{3,5,7,8,15}を除くマスタ全行・0件でも行表示 | 行集合=db.ts `SELECT id,name FROM mtb_order_status WHERE id NOT IN (3,5,7,8,15)` と一致 | L1-005,007 |
| 行の並び | sort_no昇順（単調・帯980/981は末尾側） | 行順→db.ts id→sort_no写像で単調非減少 | L1-008 |
| ステータス名 | mtb_order_status.name passthrough（データ・翻訳でない） | 行内span文言=db.ts name実値 | L1-020 |
| 件数 | dtb_order全件をorder_status_idでGROUP BY・COUNT(id)・除外NOT IN・期間/会員/支払/店舗条件なし・整数表示・対応表になければ0 | .h4文言 ^\d+$ ＝db.ts集計値。0件ステータスは「0」 | L1-006,007,004 |
| 行リンク | href=/order?order_status_id=<当該id>（このクエリ値を**行識別子**として全DB照合に用いる=改訂1） | a[href]のクエリ | L1-010 |
| 見出しリンク遷移 | /order（クエリなし）へ遷移・遷移先は検索フォームを持つ受注一覧画面 | 遷移後URL＋#search_form存在 | L1-009 |
| 行リンク遷移 | /order?order_status_id=<id> へ遷移。一覧初期検索条件への反映=設計期待（実装乖離=BC-DRAFT-m02-01-1） | 遷移後URL＋（要実機）一覧側検索状態 | L1-010,011 |
| 入力 | GETホーム表示要求のみ・クエリ不受理・フォーム/モーダル/専用JS/専用APIなし | 不要クエリ付きGETで不変・カード内要素検査・ネットワーク記録 | L1-012,013,016 |
| 更新 | なし（参照のみ・自動更新なし・バッチ起動なし） | db.tsスナップショット不変・表示中件数静止→再表示で再集計 | L1-014,015,019 |

## §4 実行可能グレード14列TSV（候補・**自己完結＝全23行を実体掲載**）

- 期待値の正は `[L1:...]`（§1）。fixtureは `@TBD-D5`。URLの `%eccube_admin_route%` は環境値（.envのECCUBE_ADMIN_ROUTE）。
- セレクタは既存page（`e2e/pages/admin/m02/m02_01_admin_home_home_order_status.page.ts`）のtwig由来値
  （#order-status／.card-header a／.card-title／.card-body a／.card-body .h4）。2026-07-06実走12〇の実機実績あり。
- 本機能はPOST/フォームなし＝CSRF request契約は非該当。非UI観測はネットワーク記録・db.ts照会（§6）。

### §4.1 bound対応候補行（21行＋-EN 1行=計22行。§8の80対応表が参照する全行）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m02-01_admin_home_home_order_status	E2E-M0201C-001	IT-15	権限	P1	未認証でホームURL直接アクセス→ログイン画面へ誘導・カード不在	未ログイン	—	1. GET /%eccube_admin_route%/ 2. 遷移先と#order-statusの有無を確認	admin_login のログイン画面へリダイレクトされ、#order-status（受注状況カード）は存在しない [L1:L1-M0201-001]				
m02-01_admin_home_home_order_status	E2E-M0201C-002	IT-25	表示	P1	認証済みGETでHTTP200・カード見出し「注文状況」・見出しは受注一覧リンク・カード内にエラー文言なし（ja）	ログイン済(SEED-M01-ADMIN)	—	1. GET /%eccube_admin_route%/ 2. HTTP status・#order-status .card-title文言・.card-header a のhref・カード内のエラー/フォールバック文言有無を読む	HTTP200＋#order-status表示＋.card-titleが「注文状況」＋見出しリンクhrefが /%eccube_admin_route%/order（order_status_idクエリなし）＋カード内にエラー文言なし（正常表示継続） [L1:L1-M0201-002,L1-M0201-003,L1-M0201-009,L1-M0201-017]				
m02-01_admin_home_home_order_status	E2E-M0201C-002-EN	IT-25	表示	P2	カード見出し（en）	ログイン済／locale=en	—	1. en UIでホームを開く 2. .card-title文言を読む	"Order Status" が表示される（ステータス名はマスタデータ由来=L1-020のため本行の判定対象は見出しのみ） [L1:L1-M0201-003]				
m02-01_admin_home_home_order_status	E2E-M0201C-010	IT-25	表示	P1	カード行集合=非除外マスタ全行（行識別子=hrefのorder_status_id）・各行にステータス名(同一idのDB実値)と整数件数	ログイン済／SEED-M0201-STATUS	—	1. db.tsで SELECT id,name FROM mtb_order_status WHERE id NOT IN (3,5,7,8,15) を取得（除外集合はL1-005解決値） 2. ホームを開き .card-body a 各行の href から order_status_id クエリ値を行識別子として抽出（twig:130） 3. 行id集合と手順1のid集合を突合 4. 各行の名称spanを**当該idの**db.ts name と突合し、.h4 件数文言を読む	行のid集合=非除外マスタid集合と完全一致（行数一致・分母はdb.ts照会値=L1-008の環境依存対策）＋各行の名称=同一idのDB name実値（名称→id復元はしない=nameに一意制約なしのため）＋各行の件数が ^\d+$ の整数 [L1:L1-M0201-004,L1-M0201-005,L1-M0201-010,L1-M0201-020; fixture:SEED-M0201-STATUS@TBD-D5]				
m02-01_admin_home_home_order_status	E2E-M0201C-011	IT-23	表示順	P1	行の並びがsort_no昇順（単調・帯行は末尾側。行識別子=hrefのorder_status_id）	ログイン済／SEED-M0201-STATUS（sort_no=980,981は既存最大より大）	—	1. db.tsで id→sort_no 対応表を取得 2. ホームのカード行を文書順に読み、各行 href の order_status_id → sort_no へ写像 3. 帯id 980,981 の行の出現位置を確認	(a) 画面順のsort_noが単調非減少 (b) 帯id=980,981の行が末尾側（sort_no最大帯の相対位置・980が981より先） [L1:L1-M0201-008,L1-M0201-010; fixture:SEED-M0201-STATUS@TBD-D5]				
m02-01_admin_home_home_order_status	E2E-M0201C-012	IT-03	除外表示	P1	除外5区分(id=3,5,7,8,15)の行がカードに存在しない（hrefのIDで検査）	ログイン済	—	1. 除外集合はL1-005解決値（{3,5,7,8,15}） 2. ホームを開き .card-body a 各行 href の order_status_id 集合を抽出 3. 除外集合との交差が空であることを検査（名称非依存=IDで判定）	除外5区分のidを行識別子に持つステータス行が存在しない（表示側の除外） [L1:L1-M0201-005,L1-M0201-010]				
m02-01_admin_home_home_order_status	E2E-M0201C-013	IT-25	0件表示	P2	該当受注0件の非除外ステータス行が表示され件数「0」	ログイン済／SEED-M0201-STATUS（id=980・対応するdtb_order行なし）	—	1. db.tsで SELECT COUNT(*) FROM dtb_order WHERE order_status_id=980 が0であることを前提確認 2. ホームを開き href の order_status_id=980 の行（名称=db.ts実値`E2E受注状況980`）の .h4 を読む	id=980の行が表示され件数が「0」（件数対応表に無い識別子→0表示） [L1:L1-M0201-007,L1-M0201-010; fixture:SEED-M0201-STATUS@TBD-D5]				
m02-01_admin_home_home_order_status	E2E-M0201C-014	IT-23	件数一致	P1	非除外ステータスの受注が全件集計に含まれ行件数=DB集計値（属性差・期間で間引かない）	ログイン済／SEED-M0201-STATUS＋SEED-M0201-ORDERS（981に3件=会員/ゲスト・支払方法違い・1件は order_date=2000-01-01 の古日付）	—	1. db.tsで SELECT COUNT(id) FROM dtb_order WHERE order_status_id=981 を照会 2. ホームを開き href の order_status_id=981 の行の .h4 を読む 3. 両者を突合	行件数=db.ts集計値（SEED設計上3。**期待の正はL1-006の集計写像でありSEED値ではない**）。属性の異なる3件と古日付1件がすべて算入される（会員・支払方法・期間で間引かれない） [L1:L1-M0201-006,L1-M0201-004,L1-M0201-010; fixture:SEED-M0201-ORDERS@TBD-D5]				
m02-01_admin_home_home_order_status	E2E-M0201C-015	IT-23	除外不算入	P1	除外ステータスの受注は行としても件数としても取得結果に含まれない（hrefのIDで検査）	ログイン済／SEED-M0201-STATUS＋SEED-M0201-ORDERS（CANCEL=3 に2件投入済み）	—	1. db.tsで SELECT COUNT(id) FROM dtb_order WHERE order_status_id=3 が2以上であることを前提確認 2. ホームを開く 3. .card-body a 各行 href の order_status_id 集合に 3 が不在であることを検査 4. 非除外の各行（href id基準）の件数が db.ts の当該id集計値と一致すること（=除外分がどの行にも加算されない）を確認	除外ステータス(id=3)は行として存在せず（=利用者は本ブロックから当該ステータス件数を確認できない）、その受注は他行の件数にも算入されない（集計側の除外。表示側除外C-012と併せて**同一除外リストの双方適用**を実証） [L1:L1-M0201-005,L1-M0201-006,L1-M0201-010; fixture:SEED-M0201-ORDERS@TBD-D5]				
m02-01_admin_home_home_order_status	E2E-M0201C-020	IT-03	画面遷移	P1	カード見出し押下→受注一覧（検索・一覧表示画面）へ遷移・ステータス条件なし	ログイン済	—	1. ホームを開く 2. .card-header a（見出し「注文状況」）を押下 3. 遷移後URLを読む 4. 遷移先が受注一覧画面であることを画面識別子で確認: 検索フォーム `#search_form`（Order/index.twig:349・locale非依存）の存在＋見出し領域の文言（ja環境では「受注一覧」=admin.order.order_list・ja:2455。文言は補助観測であり判定は URL＋#search_form で自立）	/%eccube_admin_route%/order（route admin_order）へ遷移し、URLに order_status_id が付与されない＋遷移先に検索フォーム #search_form が存在する（=受注を検索・一覧表示する管理画面） [L1:L1-M0201-009]				
m02-01_admin_home_home_order_status	E2E-M0201C-021	IT-03	画面遷移	P1	ステータス行押下→受注一覧へ当該idクエリ付きで遷移	ログイン済／SEED-M0201-STATUS	—	1. ホームを開く 2. .card-body a[href*="order_status_id=981"]（帯行981・行識別子=href）を押下 3. 遷移後URLを読む	/%eccube_admin_route%/order?order_status_id=981 へ遷移する（当該ステータス識別子がクエリで渡される） [L1:L1-M0201-010; fixture:SEED-M0201-STATUS@TBD-D5]				
m02-01_admin_home_home_order_status	E2E-M0201C-022	IT-15	リンク属性	P2	全ステータス行のhrefに当該行の order_status_id クエリのみが載る	ログイン済	—	1. ホームを開く 2. db.tsで非除外マスタの id 集合を取得 3. .card-body a 各行の href を読み、(a) クエリキーが order_status_id のみ (b) href の id 集合=手順2のid集合と一致、を全行検査	各行 href が /order?order_status_id=<当該行のid> 形式で他の検索条件クエリを載せない（本ブロックが渡すのはクエリのステータス識別子のみ。既存検索条件の上書き・マージは受注一覧機能の実装に従う=委譲・md:165） [L1:L1-M0201-010]				
m02-01_admin_home_home_order_status	E2E-M0201C-023	IT-03	初期検索反映	P2	【BC-DRAFT-m02-01-1】行押下後の受注一覧初期検索条件に当該ステータスが反映される（設計期待）	ログイン済／SEED-M0201-STATUS＋SEED-M0201-ORDERS	—	（受注一覧側の観測=cross-feature・要実機）1. 行981を押下し /order?order_status_id=981 へ遷移 2. 受注一覧の検索フォームのステータス選択状態・一覧の絞り込み結果を読む	設計期待: 一覧の初期検索条件のステータスに981が含まれた状態で表示される [L1:L1-M0201-011]（**乖離見込み: ee OrderControllerは order_status_id を消費しない=grep0件・初期表示は検索実行なし＝BC-DRAFT-m02-01-1。期待値は設計側のまま・実走で乖離を確定し不具合候補登録**）				
m02-01_admin_home_home_order_status	E2E-M0201C-030	IT-25	UI部品	P3	カード内にモーダル・ポップアップ・トースト・確認ダイアログが存在しない	ログイン済	—	1. ホームを開く 2. #order-status 内の .modal/.toast/[role=dialog] 要素数を数える 3. 行リンクhover等の後も再確認	いずれも0件（本ブロックはモーダル・ポップアップ・トースト・確認ダイアログを表示しない） [L1:L1-M0201-012]				
m02-01_admin_home_home_order_status	E2E-M0201C-031	IT-25	UI部品	P3	カード内にフォーム・入力要素が存在しない	ログイン済	—	1. ホームを開く 2. #order-status 内の form/input/textarea/select 要素数を数える	いずれも0件（本ブロックはフォーム・テキスト入力を持たない。操作はリンク押下のみ） [L1:L1-M0201-012]				
m02-01_admin_home_home_order_status	E2E-M0201C-040	IT-26	更新なし	P1	ホーム表示のみではdtb_order/mtb_order_statusが変更されない（参照のみ）	ログイン済／SEED-M0201-STATUS＋SEED-M0201-ORDERS	—	1. db.tsで dtb_order・mtb_order_status の COUNT(*) と帯行（900002101〜/980,981）の update_date・値を記録 2. ホームを表示（複数回） 3. db.tsで再照会	両テーブルとも行数不変・帯行の値/update_date不変（追加・変更・削除いずれもなし=表示処理は読み取りのみ） [L1:L1-M0201-014; fixture:SEED-M0201-ORDERS@TBD-D5]				
m02-01_admin_home_home_order_status	E2E-M0201C-041	IT-26	更新なし	P1	見出し押下・行押下の遷移操作後もDBが変更されない	ログイン済／SEED-M0201-STATUS＋SEED-M0201-ORDERS	—	1. db.tsで両テーブルのCOUNT(*)と帯行値を記録 2. 見出し押下→戻る→行981押下→戻る 3. db.tsで再照会	行数・帯行値とも不変（本ブロック起点の操作はリンク遷移のみでDB書き込みを伴わない。受注一覧側のセッション更新は受注一覧の副作用=md:199） [L1:L1-M0201-014; fixture:SEED-M0201-ORDERS@TBD-D5]				
m02-01_admin_home_home_order_status	E2E-M0201C-050	IT-25	参照時点	P2	表示中の件数は自動更新せず・再表示でその時点の再集計値	ログイン済／SEED-M0201-STATUS＋SEED-M0201-ORDERS	db.tsで dtb_order 帯行 id=900002106（order_status_id=981）を1件追加投入	1. ホームを開き href の order_status_id=981 の行の件数を読む（=db.ts集計値・SEED設計上3） 2. db.tsで+1件投入し5秒待つ 3. 画面無操作のまま同行件数を再読取 4. ページ再読込後に同行件数を読む（afterEach: id=900002106削除）	手順3=投入前と同値（自動更新しない・ポーリング/Ajaxなし）／手順4=db.ts再集計値（+1後の値。表示時点のDB読み取り結果） [L1:L1-M0201-015,L1-M0201-006; fixture:SEED-M0201-ORDERS@TBD-D5]				
m02-01_admin_home_home_order_status	E2E-M0201C-060	IT-20	非同期なし	P2	件数は初期HTMLに含まれ専用API呼出がない（非UI・ネットワーク記録）	ログイン済／SEED-M0201-STATUS	—	1. page.on('request')で全リクエストを記録しつつホームをGET 2. 初期HTML応答本文に #order-status と件数実体が含まれることを確認 3. 記録に受注状況件数取得のXHR/fetchが存在しないことを確認（売上グラフの admin_homepage_sale=Controller:210 は別ブロックのため除外して評価）	件数はサーバ側レンダリングの初期HTMLに含まれ、本ブロック用の専用APIリクエストが発生しない [L1:L1-M0201-013]				
m02-01_admin_home_home_order_status	E2E-M0201C-061	IT-20	バッチなし	P3	本ブロックはバッチを起動しない（観測手段未契約=実行保留）	ログイン済	—	（サーバ側バッチ起動有無の実行時観測手段が未契約のため実行保留=§9-3。claimはController:104-205にコマンド/プロセス起動なし=静的実測で拘束済み）	ホーム表示によりバッチが起動されない [L1:L1-M0201-019]（**実行保留: 観測手段未契約。DB不変の部分観測はC-040が被覆**）				
m02-01_admin_home_home_order_status	E2E-M0201C-062	IT-20	成否非判定	P3	カード内に成否判定に基づく表示分岐・専用エラー/フォールバック文言が存在しない	ログイン済／SEED-M0201-STATUS	—	1. ホームを開く 2. #order-status 内の .alert 等のエラー表示要素と、エラー/失敗/フォールバックに類する文言の不在を検査（通常表示での観測。twig:121-143に成否分岐要素なし=静的実測に対応する実機確認）	カード内に成否判定に基づく表示分岐・専用エラー/フォールバック文言が存在しない（API/バッチ成否を本ブロック内で判定しない・専用フォールバック文言を定義しない） [L1:L1-M0201-017]（他ブロックAjax失敗時のカード表示維持は一次資料から導けないため**期待に含めない**。実走時の探索的観測=§9-4要確認）				
m02-01_admin_home_home_order_status	E2E-M0201C-070	IT-22	入力非受理	P2	不要クエリ付きホームGETでもカードの行・件数が不変（クエリを受け取らない）	ログイン済／SEED-M0201-STATUS＋SEED-M0201-ORDERS	GET /%eccube_admin_route%/?order_status_id=981&dummy=1	1. 通常GETでカードの行名称列と件数列を記録 2. 不要クエリ付きGETで再表示 3. 両者を比較	行集合・並び・各行件数とも通常表示と完全一致（入力はホーム画面表示要求のみ・クエリでステータスを本ブロックが受け取る設計にしない） [L1:L1-M0201-016; fixture:SEED-M0201-ORDERS@TBD-D5]				
```

### §4.2 補完行（1行。**親test_idなし・母集合会計に算入しない**。理由=設計書補完〔一次資料に規定があるが母集合80行の期待テキストに対応する親が存在しない〕）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m02-01_admin_home_home_order_status	E2E-M0201C-005	IT-25	表示	P3	display_order_countの値はカード行生成に影響しない（非参照）	ログイン済／SEED-M0201-STATUS＋SEED-M0201-ORDERS	db.tsで帯行980の display_order_count を true へ変更（afterEach: false へ復元）	1. false状態でホームを表示し、href の order_status_id=980/981 の行の表示・名称・件数を記録 2. db.tsで980をtrueへ変更 3. ホーム再表示で再記録 4. 両者を比較	true/falseいずれでも行の表示有無・名称・件数が不変（ホームの受注状況テンプレートは display_order_count を参照しない） [L1:L1-M0201-018; fixture:SEED-M0201-STATUS@TBD-D5]（補完行・親test_idなし・設計書補完=md:214）				
```

## §5 locale対応表

- **LS=1 claim（1件）**: L1-M0201-003（カード見出し ja「注文状況」／en "Order Status"）→ **-EN 1行**（C-002-EN）。
  en文言は `messages.en.yaml:1852` の逐語（ja翻訳による生成ゼロ）。
- **LS=0（理由コード付き）**:
  - `data-passthrough`: L1-004/006/007/008/015/020（件数・並び・0表示・**ステータス名**。名称は翻訳カタログで
    なく `mtb_order_status.name` のマスタデータ＝インストール経路（csv ja/en・mig UPDATE）依存。比較基準は
    db.ts実値であり、ja/en固定リテラルを期待にしない→ -EN行を作らない）。
  - `non-translated`: L1-001/005/009/010/012/016/017（URL・除外集合・リンク・要素有無＝文言非依存）。
  - `non-ui-observable`: L1-002/011/013/014/018/019（HTTP/DB/静的実装事実）。
- -EN 1行の実行前提はD15（M0 Go/No-Go）。文言確定は本書で完了（実行のみ保留）。

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

### §6.1 観測契約（本機能はPOST/フォームなし＝CSRF request契約は非該当）

- **GETのみ**: `GET /%eccube_admin_route%/`（admin_homepage・Controller:102）。直接送信系の契約は不要。
- **セレクタ**（既存page再利用・twig由来）: カード根 `#order-status`（twig:121）／見出しリンク
  `.card-header a`（:123）／見出し `.card-title`（:124）／行リンク `.card-body a`（:130）／
  件数 `.card-body .h4`（:136）。2026-07-06実走12〇でセレクタ実機実績あり（本候補行は未実走）。
- **行識別子契約（改訂1・Major3是正）**: カード各行の識別子は**行リンクhrefの `order_status_id` クエリ値**
  （twig:130が `OrderStatus.id` を直埋め）。db.tsの id/name/sort_no/count との照合はすべて**このid**を
  結合キーとし、名称→id復元は行わない（`mtb_order_status.name` に一意制約なし=AbstractMasterEntity.php:37-38
  はlength指定のみ・環境依存マスタ前提と矛盾するため）。名称の検証は「当該idのdb.ts name実値との一致」。
- **db.ts照会**（`e2e/helpers/db.ts`・読取と後始末のみ）:
  - 非除外マスタ: `SELECT id, name, sort_no FROM mtb_order_status WHERE id NOT IN (3,5,7,8,15) ORDER BY sort_no`
    （除外集合リテラルは spec では `o('L1-M0201-005','m02_01_oracle').get('excludes')` で解決＝直書き禁止）。
  - 件数集計（L1-006と同一意味論）: `SELECT COUNT(id) FROM dtb_order WHERE order_status_id = <id>`。
  - スナップショット: `COUNT(*)`＋帯行の値/update_date。
- **ネットワーク記録**（C-060）: Playwright `page.on('request')` 記録。新規ヘルパ不要（Playwright標準API）。
  ※改訂1: `page.route()` による `**/sale_chart` abort はC-062の判定手段から**撤回**（§9-4の要確認=探索的
  観測のみ・合否判定に使わない）。
- オラクル解決: `e2e/helpers/oracle.ts` の `o(id, "m02_01_oracle")` 方式（**正式fixtureは未作成**。
  候補段階ではspec未実装のため消費なし）。期待値リテラルのspec直書き禁止（三段参照ゲートD9）。

### §6.2 _drafts/隔離lint証跡（実測・本候補作成時に確認）

1. oracle草案は `e2e/fixtures/oracle/_drafts/m02-01_admin_home_home_order_status_oracle_draft.json` のみに生成。
   **正式パス `e2e/fixtures/oracle/` 直下への書込なし**（git statusで確認可能）。
2. 正式解決器 `e2e/helpers/oracle.ts:16-25` の隔離ガード（`_drafts`・パス区切り・`..` をthrow）が本草案にも
   適用される＝正式specから本草案は解決不能（機械強制・W0で実在確認済み）。
3. 本候補は spec/page 実装・実走なし。既存 `e2e/spec/admin/m02/m02_01_*.spec.ts`・page への変更なし。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

- Playwright(GUI): C-001/002(+EN)/010〜013/020〜022/030/031/062/070（C-062は改訂1で通常表示観測へ変更）。
- Playwright+DB照会(db.ts): C-010〜015/040/041/050/070/005(補完)。
- 非UI(ネットワーク記録): C-060。
- 破壊的（SEED帯行の投入/削除・afterEach再適用・**フレッシュDB/serial前提**）: C-014/015/040/041/050/005。
- 実行保留: C-061（バッチ起動観測未契約）・C-023（cross-feature=受注一覧側観測・乖離確定は実走時=BC-DRAFT）・
  -EN 1行（D15待ち）。
- 聖域判定・多軸属性の正式付与はD14後（本節は候補の参考情報であり正式会計に使わない）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（観点ラベル・前提列は不使用）。1候補ケース行=1 assertion bundle・
多対一は shared-observation・-EN行は対応ja行と同一親のlocale多重。**参照先の全候補行は§4に実体掲載済み
＝80↔候補の期待テキスト突合が本文内で完結する**。

### 集計（80 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **55** | 下表 |
| **TBD** | **0** | —（全bound行は§1のL1で拘束済み。実行面の保留=C-023/C-061等は§9に別掲＝オラクル化不能ではない） |
| **excluded** | **25** | EX-A バリデーション6（009,010,012,013,014,015）／EX-B DB相関2（016,017）／EX-C 追加(INSERT)肯定7（036,038,040,041,043,045,046）／EX-D 更新(UPDATE)肯定7（048,050,052,053,055,057,058）／EX-E 他機能委譲文2（064,066）／EX-F 設計内矛盾定型1（076） |
| 合計 | **80** | 欠落0・理由なし重複0 |

- excluded根拠（各カテゴリの全test_idを実引きし期待テキストで確認済み）:
  - **EX-A（009,010,012,013,014,015・6件）**: 期待は「必須／相関バリデーションでエラーが表示され（ず）、
    対象処理が完了しない（継続できる）こと」。本機能は**フォーム・入力を持たない**（md:88「本ブロックは
    フォーム・テキスト入力を持たない」・md:230「利用者入力｜本ブロックはフォームを持たない」・
    twig:121-143に入力要素0件=実測・Controller::index にフォーム生成なし〔createBuilder/createForm不出現=
    Controller:104-205実測〕）。バリデーション自体が存在せず**両極性とも成立不能**＝過剰生成
    （m10-11 EX-Bと同型だが本機能は任意項目すら無いため肯定側も除外）。偽陰性チェック: 「エラーなし
    継続」の意味成分は072/074がC-002へbound・「フォームを持たない」事実は051/077がC-031へbound。
  - **EX-B（016,017・2件）**: 期待「DBとの相関バリデーション…」。同上（DB照合constraintを持つフォーム自体
    が不存在）。設計md:231の「件数とマスタの整合」は入力検証でなく除外配列共有＝063/078がboundで被覆。
  - **EX-C（036,038,040,041,043,045,046・7件）**: 期待は全行「登録内容/実行結果の対象レコードが**追加される
    こと**」（肯定側）。本機能にINSERT経路なし（md:177「本ブロックは参照のみであり、受注やステータス
    マスタを更新しない」・md:199「受注台帳やマスタを更新しない」・Controller::index はSELECT系のみで
    persist/flush不出現=Controller:104-205実測）＝「追加される」期待は成立不能。否定側037/042/044は
    行数不変assertion（C-040/C-041）へ**bound**（外さない＝偽陰性なし）。
  - **EX-D（048,050,052,053,055,057,058・7件）**: 期待は全行「更新内容/実行結果の対象レコードの値が
    **変更されること**」（肯定側）。UPDATE経路なし（同上）＝成立不能。否定側049/054/056はC-040/C-041へbound。
  - **EX-E（064,066・2件）**: 期待は設計書自身の他機能委譲文の転記。064「…検索条件、一覧件数、ページング、
    セッション復元は**受注一覧機能の実装に従う**」（md:176逐語）・066「…反映タイミングは、**外部連携機能
    もしくはバッチ機能の設計を正とする**」（md:178逐語）＝本機能スコープの検証命題を含まない
    （m10-11 EX-Eと同型）。偽陰性チェック: 064の「遷移」成分はC-021が、060のクエリ付与はC-022がbound済み。
  - **EX-F（076・1件）**: 期待「当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）で
    あること」＝設計書DB操作節（md:218-222）の定型文。同じ設計書の処理フロー（md:103-110=読み取りのみ）・
    入出力副作用（md:199「更新しない」）・データ整合性（md:177「参照のみ」）と**設計内で矛盾**し、実装も
    参照のみ（persist/flush不出現=実測）。「当機能が行う登録・更新」=空集合のため検証命題不成立＝
    **設計書errata候補**（既存 `m02_01_..._e2e_cases.md` 付帯表4 #6 で要確認登録済み。実装乖離ではないため
    BC-DRAFTでなく設計書側の是正対象として記録）。負成分「不要な削除は含まない」はC-040（行数不変=削除
    もない）が被覆＝偽陰性なし。
- **バインド方針の対m10-11差分（検索条件系を除外しない理由）**: m10-11は取得が無条件全件
  （`findBy([])`）で「含まれない」が実現不能のためEX-A除外が妥当だった。本機能は取得に**実フィルタ
  （`NOT IN (:excludes)`）が実在**し（Controller:345）、「該当レコードが取得結果に含まれる／含まれない」は
  集計算入（C-014）／除外不算入（C-015）として**実現・反証可能**→ boundが正（除外すると偽陰性）。

### 80対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 「表示対象マスタ行」と「件数集計」の双方から除く受注ステータス識別子の集合 | bound | C-012＋C-015（双方適用の実証） |
| 002 | 管理者認証後に表示されるダッシュボード | bound | C-002 |
| 003 | 受注を検索・一覧表示する管理画面（=受注一覧） | bound | C-020（URL/route＋画面識別子`#search_form`存在で「検索・一覧表示画面」性を観測=改訂1で強化） |
| 004 | 除外を通過した各ステータスがマスタ並び順で表示・件数が数値 | bound | C-010,C-011,C-012 (shared) |
| 005 | 受注一覧へ遷移すること | bound | C-020 |
| 006 | 受注一覧へ遷移し、クエリの識別子が初期検索条件に反映される | bound | C-021（遷移+クエリ）＋C-023（反映=**BC-DRAFT-m02-01-1**・要実機） |
| 007 | ホーム画面自体に到達できず本カードも利用不可 | bound | C-001 |
| 008 | カードに見出しと受注ステータス別の行を表示 | bound | C-002,C-010 (shared) |
| 009 | 必須バリでエラー表示・処理未完了 | **excluded** EX-A | — |
| 010 | 必須バリでエラー表示され**ず**継続 | **excluded** EX-A | — |
| 011 | モーダル・ポップアップ・トースト・確認ダイアログを表示しない | bound | C-030 |
| 012〜015 | 相関バリでエラー（あり/なし） | **excluded** EX-A | — |
| 016〜017 | DBとの相関バリ（なし/あり） | **excluded** EX-B | — |
| 018 | 除外リストに含まれなければ行を表示し件数は0 | bound | C-013 |
| 019 | 検索条件の該当レコードが取得結果に含まれる | bound | C-014（非除外の受注が集計に算入） |
| 020 | 含まれない | bound | C-015（除外の受注は不算入・行不在） |
| 021 | 含まれる | bound | C-014 (shared) |
| 022 | 含まれない | bound | C-015 (shared) |
| 023 | 含まれる | bound | C-014 (shared) |
| 024 | 含まれない | bound | C-015 (shared) |
| 025 | 含まれる | bound | C-014 (shared) |
| 026 | 含まれない | bound | C-015 (shared) |
| 027 | 含まれる | bound | C-014 (shared) |
| 028 | 含まれない | bound | C-015 (shared) |
| 029 | 含まれる | bound | C-014 (shared) |
| 030 | 含まれない | bound | C-015 (shared) |
| 031 | 含まれる | bound | C-014 (shared) |
| 032 | 含まれない | bound | C-015 (shared) |
| 033 | 実行結果の該当レコードが取得結果に含まれる | bound | C-014 (shared) |
| 034 | 含まれる | bound | C-014 (shared) |
| 035 | 含まれる | bound | C-014 (shared) |
| 036 | 対象レコードが**追加される** | **excluded** EX-C | — |
| 037 | 追加され**ない** | bound | C-040（行数不変） |
| 038 | 追加される | excluded EX-C | — |
| 039 | 利用不可であること | bound | C-001 |
| 040 | 追加される | excluded EX-C | — |
| 041 | 追加される | excluded EX-C | — |
| 042 | 追加され**ない** | bound | C-040,C-041 (shared) |
| 043 | 追加される | excluded EX-C | — |
| 044 | 追加され**ない** | bound | C-041（遷移操作後も不変） |
| 045 | 追加される | excluded EX-C | — |
| 046 | 実行結果の対象レコードが追加される | excluded EX-C | — |
| 047 | カードに見出しと受注ステータス別の行を表示 | bound | C-002,C-010 (shared) |
| 048 | 値が**変更される** | **excluded** EX-D | — |
| 049 | 変更され**ない** | bound | C-040 (shared) |
| 050 | 変更される | excluded EX-D | — |
| 051 | 本ブロックはフォーム・テキスト入力を持たない | bound | C-031 |
| 052 | 変更される | excluded EX-D | — |
| 053 | 変更される | excluded EX-D | — |
| 054 | 変更され**ない** | bound | C-040 (shared) |
| 055 | 変更される | excluded EX-D | — |
| 056 | 変更され**ない** | bound | C-041 (shared) |
| 057 | 変更される | excluded EX-D | — |
| 058 | 実行結果の値が変更される | excluded EX-D | — |
| 059 | カードの行として表示されないため当該ステータス件数を確認できない | bound | C-015（除外id=3の行不在=確認手段なし。md:164「受注台帳に存在するがマスタ一覧に出ないステータス」を、**除外により表示対象マスタ一覧に出ない**形〔md:143判定順序#3〕で実現。実現形の限定は§10注記） |
| 060 | クエリでステータスを渡すだけ・上書き/マージは受注一覧の実装に従う | bound | C-022（渡す側=href検証。マージは委譲注記） |
| 061 | 表示中の件数は自動更新しない | bound | C-050 |
| 062 | 件数はホーム表示時にDBから読み取った結果 | bound | C-050,C-014 (shared) |
| 063 | 件数集計と表示対象ステータスは同一の除外リストを使う | bound | C-012＋C-015（表示側+集計側の同一適用） |
| 064 | 遷移後の検索条件・件数・ページング・セッション復元は受注一覧の実装に従う | **excluded** EX-E | — |
| 065 | 参照のみ・受注やステータスマスタを更新しない | bound | C-040 |
| 066 | 外部連携/バッチの反映タイミングは各機能の設計を正とする | **excluded** EX-E | — |
| 067 | 件数表示のために専用APIを呼び出さない | bound | C-060 |
| 068 | バッチを起動しない | bound | C-061（**実行保留=観測未契約**・§9-3） |
| 069 | API/バッチの成否を本ブロック内で判定しない | bound | C-062（通常表示での成否分岐/専用文言不在の観測=改訂1で限定。abort系は§9-4要確認） |
| 070 | ホーム画面表示要求であること | bound | C-070,C-002 (shared)（入力=GET表示要求のみ・クエリ不受理） |
| 071 | 受注状況カードにステータス名と件数 | bound | C-010 (shared) |
| 072 | 画面表示データでエラーが表示されず継続 | bound | C-002 (shared)（正常表示・カード内エラー文言なし） |
| 073 | 表示処理だけを見ると受注台帳やマスタを更新しない | bound | C-040 (shared) |
| 074 | 画面表示データでエラーが表示されず継続 | bound | C-002 (shared) |
| 075 | 表示行の並びであること（sort_no） | bound | C-011 |
| 076 | 当機能が行う登録・更新で対象テーブルを直接保存する | **excluded** EX-F | —（設計内矛盾の定型文=errata候補） |
| 077 | 本ブロックはフォームを持たない | bound | C-031 (shared) |
| 078 | 集計とマスタ取得は同一の除外配列に基づく | bound | C-012＋C-015 (shared) |
| 079 | 利用不可であること（未認証） | bound | C-001 (shared) |
| 080 | 双方から除く受注ステータス識別子の集合（001と同文） | bound | C-012＋C-015 (shared) |

`func_scope_check` 判定: 親80/80会計済み・欠落0・理由なし重複0・補完1行（C-005）は§4.2に実体掲載
（親空・設計書補完md:214・母集合会計外）→ **差分0を本文内で実証可能**。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

- **TBD=0件**: 全bound行はL1（§1）で期待値拘束済み。excluded 25件は§8の一次資料根拠つき。
- **不具合候補（乖離検出=期待を実装に寄せない）**:
  1. **BC-DRAFT-m02-01-1（C-023・L1-011）**: 設計md:75「クエリで渡されている場合は一覧の初期検索条件に
     反映される」⇔ ee受注一覧実装は `order_status_id` を**消費しない**（OrderController.php全文grep 0件・
     GET初期表示は「検索を実行しない」＋検索セッション削除=OrderCtl:181,226-241,244）。ホーム側は
     クエリを付与する（twig:130=C-021/C-022で検証）が、受け側で死んでいる疑い。期待値は設計側のまま。
     実走（cross-feature観測）で乖離を確定し `BUG_CANDIDATE_REGISTER` 系へ正式採番。なおmd:122は
     「保存される**場合がある**」・md:165/176は受注一覧への委譲を明記しており、設計内でも確定度が
     揺れている（乖離確定時は設計書側の表現整合も要確認）。
- **要実機（実行面の保留＝オラクル化不能ではない）**:
  2. **C-023**: 受注一覧側（別機能）の検索フォーム状態の観測面=セレクタ未契約→要実機。
  3. **C-061（バッチ起動なし）**: サーバ側バッチ/プロセス起動の実行時観測手段が未契約→実行保留
     （claim自体はController:104-205の静的実測で拘束。DB不変の部分観測はC-040が被覆）。
  4. **要確認（改訂1でC-062の期待から分離）**: 「他ブロックのAjax（`admin_homepage_sale`）失敗時も
     カードは初期HTMLのまま」は設計md:188,198,267から**導けない未実証推論**のため期待から除去した。
     実走時に `page.route()` abortでの画面挙動を**探索的観測**として記録してよいが、合否判定には使わない
     （観測結果が得られたら仕様確認として起票し、必要ならL1追補を別途レビューに掛ける）。
  5. **SEED-M0201-ORDERS の dtb_order 生成契約**: NOT NULL列の全充足（name01/name02/create_date/
     update_date=Order.php:470-473,536-542 ほか）・IDENTITY列（Order.php:456-459）への明示id投入方式
     （OVERRIDING SYSTEM VALUE等）・`order_status_id` 列の帯status(981/3)参照整合＝**@TBD-D5**
     （同列はOrderStatus/CustomerOrderStatus/OrderStatusColorの3関連が共有=Order.php:629-642。
     **Doctrine属性のJoinColumnは実DBのFK制約の実在を立証しない**＝制約有無はD5実機確認）。
  6. **帯データの露出**: 帯status行980/981は受注一覧の検索選択肢等（他機能）へ、帯orderは売上集計
     （m02-02/03）の分母へ露出→フレッシュDB/serial前提・共有環境では実行しない。
  7. **-EN 1行**: 管理画面en切替はD15待ち。文言確定は本書で100%完了。
  8. **マスタ行集合の環境依存**（csv 8行 vs mig 13行＋名称UPDATE 4件=L1-008/020）: 「全行」「名称」系の
     期待は分母・基準をdb.ts照会値に固定（固定行数・固定名称リテラルを期待にしない）。
  9. **拡張フックによる除外差替**（md:98-99・L1-005）: プラグイン依存で管理画面操作では再現不可→
     プラグイン未導入環境の既定値{3,5,7,8,15}を前提（導入環境では前提不成立として停止・理由記録）。
- **候補規律**: 全行 `@TBD-D5`・O5未確定（暫定source_class）・spec/page実装なし・実走なし。
  DB読み取り障害時の共通例外委譲（md:267・既存e2e 050は手動×）は母集合80に対応する期待テキストが
  ないため候補化せず（補完も不作成。障害注入は非破壊前提に反するため理由記録のみ）。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象構文（肯定/否定・許可/拒否の対）を列挙し、claim単位で期待テキストとの極性一致を目視確認した:

| 極性対 | 該当行 | 判定 |
|---|---|---|
| 含まれる/含まれ**ない** | 019,021,023,025,027,029,031,033,034,035（含まれる）vs 020,022,024,026,028,030,032（含まれない） | 含まれる→C-014（非除外の算入側）・含まれない→C-015（除外の不算入側）。実フィルタ（NOT IN）実在のためbound（m10-11とは前提が異なる=§8注記）。取り違えなし |
| 追加され**る**/され**ない** | 036,038,040,041,043,045,046（肯定）vs 037,042,044（否定） | 肯定=EX-C（INSERT経路なし=成立不能）・否定=C-040/C-041（行数不変）へbound。**肯定側をboundにする取り違えなし** |
| 変更され**る**/され**ない** | 048,050,052,053,055,057,058（肯定）vs 049,054,056（否定） | 肯定=EX-D（UPDATE経路なし）・否定=C-040/C-041。整合 |
| エラー表示され/表示され**ず** | 009,012,015,017（拒否側）vs 010,013,014,016（継続側）vs 072,074（表示データのエラーなし継続） | バリデーション系はフォーム不存在で**両極性とも**EX-A/EX-B（片極性のみ除外する誤りなし）。072/074は主語が「画面表示データ」＝正常表示継続としてC-002へbound（取り違えなし） |
| 利用不可/閲覧できる | 007,039,079（不可=未認証）vs 002（認証済みダッシュボード） | 不可側→C-001（L1-001）・可側→C-002（L1-002）。分離済み |
| 表示する/表示し**ない** | 004,008,047,071（表示する）vs 011（モーダル表示しない）・001,059,063,078,080（除外行を出さない）・061（自動更新しない） | 表示側→C-002/C-010/C-011・不表示側→C-030（モーダル）/C-012・C-015（除外行）/C-050（自動更新なし）。同語異義の混同なし |
| 呼び出す/呼び出さ**ない**・起動する/し**ない**・判定する/し**ない** | 067,068,069（すべて否定側） | C-060/C-061/C-062（否定claim L1-013/019/017）。肯定側の母集合行なし=対不成立の単極。極性反転なし |

- 見出し文言の呼称差（設計上の呼称「受注状況」vs 画面文言「注文状況」=md:7）は L1-003 で画面文言側に
  確定（messages.ja.yaml:1874逐語）。**憶測でなく一次資料で閉じたことを記録**。
- 059「受注台帳に存在するがマスタ一覧に出ないステータス」は、**「除外により表示対象マスタ一覧に出ない」形**
  （=C-015）で実現する。根拠は設計文脈: カードの行はマスタから「除外リストに含まれない行」だけを取得する
  （md:143判定順序#3「除外に含まれるステータス識別子はマスタ行としても出さない」・md:131）ため、除外
  ステータスは台帳に受注が存在しても「マスタ一覧（表示対象）に出ない」＝md:164の帰結「カードの行として
  表示されないため…件数を確認できない」がそのまま成立する。他の実現形（マスタ行自体が存在しない受注）は
  本候補では扱わない＝**実現手段を断定しない**（改訂1: 旧記載のOrder.php:630引用は誤り〔630は
  CustomerOrderStatus側・OrderStatus関連は640-642〕で、かつDoctrine属性は実DB FK制約の実在を立証しない
  ため「FKで不能」の断定を撤回）。
- codex敵対レビュー: 未実施（R0）。C4対象の極性取り違えは自己検査では検出されず（未検出の可能性は残る）。

---

## 作業時間・工数係数の実測記録（B0バッチ2係数用）

- **読了した一次資料**: 設計書md 1本（315行）／eeソース: AdminController・index.twig・OrderStatus・
  AbstractMasterEntity・Order・OrderController（受注一覧側cross-feature確認）・security.yaml／locale 2
  （messages ja/en）／初期データcsv 2＋migrations 2（Version20251125150428/20260220000001）／
  既存資産4（e2e_cases md・page・db.ts・oracle.ts）／統治・見本4（CFP・ROLLOUT・PILOT・m10-11/m01-01草案）。
- **L1 claim数**: 20（新規調査の難所: L1-011 受注一覧側の `order_status_id` 不消費の立証〔grep0件+初期表示
  分岐の実読〕、L1-008/020 マスタ行集合・名称の環境依存〔csv vs migrations突合〕、L1-005 除外集合の
  定数交差〔Controller×OrderStatus定数×イベント差替〕）。
- **母集合80行の期待テキスト読解・分類**: bound55/excluded25（検索条件系17行をm10-11と逆にbound判定した
  根拠整理〔実フィルタ実在〕と、EX-C/EX-Dの偽陰性回避検討が最大の難所）。

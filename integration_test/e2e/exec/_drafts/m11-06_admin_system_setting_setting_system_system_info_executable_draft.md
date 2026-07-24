# B0候補: m11-06 管理画面_設定_システム設定_システム情報 — 実行可能グレード候補（母集合61全量踏破）

> 2026-07-24 ／ **候補グレード（candidate・D6前・O5未確定・実装/実走なし）**
> codexレビュー: **R1=要修正（Blocker1＋Major5＋Minor2）→改訂1で是正・R2再確認待ち**。
> **改訂1（codex R1是正）**: (1) **【Blocker】C-017の観測範囲超過是正**: 「いかなるテーブルへの登録/更新も
> 発生しない」の期待を**`dtb_authority_role`テーブルの行数・全列ダイジェスト不変**（観測した唯一の表）へ縮小し、
> 読み替えbound6件（019/024/026/031/036/038）の再bind根拠もこれに合わせて限定（§4.1/§8/§10）。
> (2) **DOC-DRAFT-m11-06-1を未解決の矛盾として明記し直し**、「read-onlyが設計として正しい」という断定を撤回
> （実装挙動を設計の正にしない・片側を誤記と断定しない）。期待は`SystemController.php`単体で観測された
> 読取専用の実装経路に限定（§0/L1-M1106-016/§9-1）。
> (3) **L1-M1106-001の根拠をEccubeExtension.php（動的access_control注入・ROLE_ADMIN要件の実体）へ訂正**
> （security.yamlはfirewall/form_loginのみでROLE_ADMIN要件自体は含まない）。
> (4) **L1-M1106-018/C-019を静的構造の確認までに限定**し「完全一致」の誤記を「先頭一致（終端非アンカー）」へ訂正
> （不正な正規表現から実際に例外送出・フォールバック実行に至る動的再現は要実機）。
> (5) **WEBサーバー行（SERVER_SOFTWARE）をL1-M1106-011から分離しL1-M1106-026を新設**、テスト側が値を制御できない
> 環境観測として扱い、C-012からSERVER_SOFTWAREの一致主張を削除（User Agentのみに限定）。
> (6) **C-016の期待をCookie値不変に限定**（同一Cookie値でもサーバ側セッションストアの更新有無は別命題・
> セッション書込なしの断定は静的grepのみに限定して併記）。
> (7) **C-015の期待を応答ヘッダの専用キャッシュ指定不在の確認に限定**（「専用キャッシュなし/毎回再構築」という
> 積極断定を撤回）。→ ヘッダ/§0/§1 L1-001,011,016,018,026新設/§4/§5/§7/§8/§9/§10/oracle jsonへ反映済み。
> source_class=standard-src+design は fid_kubun.tsv（D1・fid_kubun.tsv:344）による**暫定付与**（確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> fixture_version は全て `@TBD-D5`。統治: `integration_test/CONCRETIZATION_FIRST_PLAN.md`（三段会計）＋
> `integration_test/CONCRETIZATION_ROLLOUT_PLAN.md`（B0）。
> 正典: `integration_test/e2e/PILOT_m09_01_news_executable_grade.md`／同型見本: `_drafts/m02-04_..._executable_draft.md`
> （read-only表示・動的値の恒等写像claim・DOC-DRAFT裁定の型）・`_drafts/m02-02_..._executable_draft.md`
> （read-only裁定・per-ID読み替え・IT-26系bind/exclude振り分けの型）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m11-06_admin_system_setting_setting_system_system_info_oracle_draft.json`。
> 正式パス `e2e/fixtures/oracle/` 直下には書かない。
> **行数集計**: 候補ケース行総数**28**＝bound対応22（ja21＋-EN1）＋補完6（ja6）。
> 母集合61=bound35＋TBD1＋excluded25（EX-A=10／EX-B=14／EX-D=1）。差分0（改訂1でも会計は不変・観測範囲の限定のみ）。
> **不具合候補/設計書矛盾候補**: なし（BC-DRAFTなし）。**DOC-DRAFT-m11-06-1**（DB操作節のread-only明記との矛盾・
> **未解決**＝§9-1。実装がread-onlyであることの正しさは断定しない）。
> **動的値の扱い**: EC-CUBEバージョン・php_uname()・DBバージョン・User-Agent・get_loaded_extensions() は
> 環境/実行時依存の値であり、SEED/期待リテラルに固定しない。期待は「取得元関数・書式・恒等写像（表示値＝実行時に
> 読み取った値そのもの）」に限定する（三段参照）。**SERVER_SOFTWARE（WEBサーバー行）はテスト側が値を制御できない
> ため、表示経路の静的確認までに限定し値の一致検証はE2Eの範囲外とする**（L1-M1106-026・改訂1）。

## §0 版固定

- 設計書正本: `functions/ec-cube-enterprise/m11-06_admin_system_setting_setting_system_system_info.md`
  （本repo HEAD `017ab3be9aac7d234838ef0fd3132ac9c36923b8` 時点。以下「md:行」）。
- ee実ソース: `/home/y-saito/Developments/ec-cube-enterprise/` コミット
  `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51`（既候補と同一）。
- fid_kubun.tsv（D1・sha256先頭 `44fbf02f1e4c`）:
  `M11-06｜m11-06_admin_system_setting_setting_system_system_info｜システム情報｜対象｜標準｜ec-cube-enterprise/m11-06_admin_system_setting_setting_system_system_info.md｜standard-src+design｜0`（fid_kubun.tsv:344）
  → **標準＝ee実ソース直接可＋設計書md**（暫定付与・確定はD6）。
- 母集合: baseline `integration_test/all_it_cases.tsv`（sha256先頭 `7911f190d273`）の機能名
  `m11-06_admin_system_setting_setting_system_system_info（管理画面_設定_システム設定_システム情報）`全**61行**
  （IT-M11-06-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-SYSTEM-INFO-001〜061。以下「-nnn」）。
- 本機能はカスタマイズ区分=**標準**（md:12「本機能のカスタマイズ区分は標準であり、挙動・DB関連ともに
  リニューアル後（ec-cube-enterprise）の標準実装を正とする」・md:46「現行との具体差は ec-cube-enterprise
  実装を正として移行設計で確認する」）。
- **判定原則（W0-B0教訓の踏襲）**: 観点ラベル・前提条件/入力データ列のシナリオ語は**生成器ノイズ**。bindは各行の
  **「期待結果／レスポンス」実テキスト**で判定し、極性も期待テキストで確認する（§8に全61行の期待要旨併記）。
  本機能の母集合は「必須/相関/DBとの相関バリデーション」定型（フォームを持たない機能への過剰生成）と
  「登録内容/更新内容の対象レコードが追加される/変更される」IT-26系定型（read-only機能への過剰生成）が
  母集合の大半（41/61）を占める点がm02-02/m02-04と同型。
- **既存参考物（本候補の会計外）**:
  - `integration_test/e2e/m11_06_admin_system_setting_setting_system_system_info_e2e_cases.md`
    （旧母集合90観点行を対象にした未実行TSV雛形。「Playwrightは本リポジトリでは実行しない（構造参考のみ）」と
    明記され実走実績なし。本候補は現行baseline母集合**61行**を対象とし直接の会計継承はしない）。
  - `e2e/pages/admin/m11/m11_06_admin_system_setting_setting_system_system_info.page.ts`／
    `e2e/spec/admin/m11/m11_06_admin_system_setting_setting_system_system_info.spec.ts`（未実行雛形・実装済み
    セレクタは本候補で再利用するが、コメント内のmessages.yaml行番号は旧ee snapshot依存で現行コミットとは
    **約200行ずれている**ため本書では自前でnl -ba再照合した行番号のみを正とする）。
- 主要一次資料の略記:
  - Controller = `src/Eccube/Controller/Admin/Setting/System/SystemController.php`
  - SystemService = `src/Eccube/Service/SystemService.php`（`getDbversion()`）
  - twig = `src/Eccube/Resource/template/admin/Setting/System/system.twig`
  - default_frame = `src/Eccube/Resource/template/admin/default_frame.twig`
  - AuthorityVoter = `src/Eccube/Security/Voter/AuthorityVoter.php`（管理画面パスの拒否判定）
  - TwigInitializeListener = `src/Eccube/EventListener/TwigInitializeListener.php`（サイドナビ権限フィルタ）
  - AuthorityRole = `src/Eccube/Entity/AuthorityRole.php`（`dtb_authority_role`）
  - mtb_authority/dtb_authority_role初期データ = `src/Eccube/Resource/doctrine/import_csv/ja/{mtb_authority,dtb_authority_role}.csv`
  - eccube_nav = `app/config/eccube/packages/eccube_nav.yaml`
  - security.yaml = `app/config/eccube/packages/security.yaml`（admin firewall）
  - eccube.yaml = `app/config/eccube/packages/eccube.yaml`（`eccube_admin_route`・`eccube_phpinfo_enabled`）
  - ja/en = `src/Eccube/Resource/locale/messages.{ja,en}.yaml`
- **設計書内矛盾1件（詳細§9-1。DOC-DRAFTとして未解決のまま残し、期待値を捏造しないための限定）**:
  - **DOC-DRAFT-m11-06-1（DB操作節のread-only明記との矛盾・codex R1是正=未解決化）**: 設計書のDB操作節
    （md:188-192）は`登録/更新｜dtb_authority_role｜当機能が行う登録・更新で対象テーブルを直接保存する
    （不要な削除は含まない）。確定は persist/flush による即時反映。` と記すが、同一設計書の**5箇所**
    （md:7「フォームによる保存やマスタ更新は行わない」・md:110「本機能は台帳件数の集計や業務判定を行わない。
    画面に出すのは実行時に取得した文字列の表示のみ」・md:142「本機能は表示のみで、システム情報の内容をDBに
    書き戻さない」・md:159「DB更新｜行わない。DBバージョン取得のための読み取りのみ」・md:15「権限設定画面での
    URL許可マスタ編集…の各機能は別途切り離す」）が**参照専用**と明記する。**この2群は設計書内で矛盾しており、
    本候補はどちらが設計として正しいかを断定しない**（実装挙動を設計の正にしない・片側を誤記と断定しない＝
    テストケースが正の原則）。一方、ee実装（`SystemController.php`単体・全文）は persist/flush/INSERT/UPDATE
    呼び出しが**0件**（同ファイルの静的grep範囲。`index()`/`phpinfo()`ともDoctrine EntityManagerを注入されて
    おらずSELECT系のDB利用も`SystemService::getDbversion()`のネイティブSELECTのみ）という**観測可能な事実**
    であり、これは当該コントローラ経由で登録・更新呼び出しが発生しないことの静的根拠にとどまる（依存先
    `SystemService`等を含む全呼び出し経路の無書込証明ではなく、「read-onlyが設計として正しい」ことの証明でも
    ない）。`dtb_authority_role`の実際の登録・更新は別機能（権限設定画面=AuthorityController等。md:15で本書
    スコープ外と明記）が担う。**本候補の期待は、この観測範囲（`SystemController.php`単体に登録/更新呼び出しが
    ないという静的事実、および`dtb_authority_role`テーブルの行数・全列ダイジェストが表示前後で不変という
    db.ts観測）に限定する**（「登録される」側に捏造しない・「read-onlyが正しい」とも断定しない）。この限定された
    観測が§8のIT-26系肯定14行のexcluded判定根拠（EX-B＝現行実装のこの経路には「登録される」の観測対象が
    存在しないため）。負極性（追加されない/変更されない）6行は`dtb_authority_role`不変の観測へ限定してbind
    （偽陰性なし・過大主張なし＝codex R1 Blocker是正）。DOC-DRAFT-m11-06-1自体は**未解決**として上流へ申し送る。

## §1 L1原子オラクル表

全26行=**25claim確定＋L1-M1106-022 TBD**（codex R1是正・改訂1でL1-M1106-026新設=SERVER_SOFTWARE分離）。
本機能はフォーム・入力・保存を持たない参照＋iframe埋め込み機能のため
文字数系unitなし。LS=locale_sensitive（0は理由コード）。en文言はen一次資料逐語（ja翻訳ゼロ）。
**期待値の正は本表のオラクルID**（実行時取得値は入力再現手段/観測値ではなく「取得元・書式」までを期待の正とし、
値そのものは環境依存の恒等写像claimに留める＝三段参照）。`%eccube_admin_route%` は環境値（既定 `admin`・env
ECCUBE_ADMIN_ROUTE=eccube.yaml:3,69）。

| oracle_id | 観点 | claim | 逐語quote | 根拠(file:line) | LS |
|---|---|---|---|---|---|
| L1-M1106-001 | auth_rule | 未認証の `GET /%eccube_admin_route%/setting/system/system` は、`EccubeExtension`がコンテナ構築時に`security`設定へ動的注入する`access_control`エントリ（`path: ^/%eccube_admin_route%/, roles: ROLE_ADMIN`。`security.yaml`自体にはROLE_ADMIN要件の記述はなくfirewall/form_loginのみを定義=codex R1是正）により認可要求され、admin firewall（`^/%eccube_admin_route%/`）の`form_login`により`admin_login`のログイン画面へ誘導され、システム情報画面へ到達しない | `$accessControl = [ … ['path' => '^/%eccube_admin_route%/', 'roles' => 'ROLE_ADMIN'], … ];`＋`// security.ymlでは制御できないため, ここで定義する.`＋`$container->prependExtensionConfig('security', [ 'access_control' => $accessControl, ]);`＋`admin:`＋`    pattern: ['^/%eccube_admin_route%/','^/%eccube_messenger_route%/']`＋`    provider: member_provider`＋`    form_login:`…`        login_path: admin_login`／「未認証｜`GET /%eccube_admin_route%/setting/system/system`（到達前）｜管理領域の認証要件に従い、画面に到達できない」 | EccubeExtension.php:81-94,101-104 / security.yaml:40-46 / md:72,209 | 0 `non-translated` |
| L1-M1106-002 | http_status | システム情報画面=`GET /%eccube_admin_route%/setting/system/system`（route `admin_setting_system_system`・GETのみ）。権限が許可されればHTTP200で管理画面共通レイアウト（`@admin/default_frame.twig`拡張）のHTMLを応答する | `#[Route(path: '/%eccube_admin_route%/setting/system/system', name: 'admin_setting_system_system', methods: ['GET'])]`＋`#[Template(template: '@admin/Setting/System/system.twig')]`／`{% extends '@admin/default_frame.twig' %}`／「システム設定メニューからシステム情報を開く｜`GET /%eccube_admin_route%/setting/system/system`｜権限により許可される場合、システム情報カードに複数行のラベルと値が出る」「成功時出力｜システム情報は管理画面共通レイアウトのHTML」 | Controller:36-38 / twig:12 / md:68,172 | 0 `non-ui-observable` |
| L1-M1106-003 | display_structure | システム情報カードは画面本体の先頭カード（`.c-primaryCol`内の最初の`.card`）で、見出し`.card-title`（リンクでないspan・ツールチップ付き・問い合わせアイコン`.fa-question-circle`同伴）・見出し右の折りたたみトグル`a[data-bs-toggle=collapse][href="#systemInfo"]`（アイコン`.fa-angle-up`）・本文`#systemInfo`（`collapse show`＝既定で開いた状態）を持つ。本文内は`#server_info_box__body_inner`にラベル(左2グリッド`col-2`)＋値(右`col`・`id="server_info_box__value--{{loop.index}}"`)の行を縦に並べる | `<div class="card rounded border-0 mb-4">`＋`<div class="col-8" id="server_info_box__header">`…`<span class="card-title ">{{ 'admin.setting.system.system_info'\|trans }}</span>`＋`<i class="fa fa-question-circle fa-lg ms-1"></i>`＋`<a data-bs-toggle="collapse" href="#systemInfo" …><i class="fa fa-angle-up fa-lg"></i></a>`＋`<div class="collapse show ec-cardCollapse" id="systemInfo" >`＋`<div class="card-body" id="server_info_box__body_inner">`…`<div class="col-2"><span>{{item.title}}</span></div>`…`<div class="col" id="server_info_box__value--{{ loop.index }}">`／「システム情報カード｜画面本体の先頭カード。見出しはロケールにより「システム情報」等。Bootstrapの折りたたみ領域を持ち、既定では本文が開いた状態で表示される」 | twig:23-54（header:24-39・collapse:33-40・body:41-56） / md:57 | 1 |
| L1-M1106-004 | display_rows | 権限が許可される場合、システム情報カードに**固定6行**（EC-CUBE／サーバーOS／DBサーバー／WEBサーバー／PHP／User Agent、この順）のラベルと値が表示される。行数・順序は`$info[]`への無条件push順で固定（条件分岐なし） | `$info[] = ['title' => trans('admin.setting.system.system.eccube'), …];`＋`$info[] = [… 'server_os' …];`＋`$info[] = [… 'database_server' …];`＋`$info[] = [… 'web_server' …];`＋`$info[] = [… 'php' …];`＋`$info[] = [… 'user_agent' …];`／「権限により許可される場合、システム情報カードに複数行のラベルと値が出る」 | Controller:40-48 / md:68,93 | 1 |
| L1-M1106-005 | collapse_toggle | 見出し右の角度アイコン（`a[href="#systemInfo"][data-bs-toggle=collapse]`）押下で、Bootstrap collapseによりカード本文（`#systemInfo`）が折りたたまれ、再度押下すると展開される（同一ページ内のDOM操作のみ・サーバ問い合わせなし） | `<a data-bs-toggle="collapse" href="#systemInfo" aria-expanded="false" aria-controls="systemInfo"><i class="fa fa-angle-up fa-lg"></i></a>`／「システム情報カード見出し右の角度アイコンを押下｜—（同一ページ内の折りたたみ）｜カード本文の表示領域が折りたたまれたり展開されたりする」 | twig:33-40 / md:69,81 | 0 `non-ui-observable` |
| L1-M1106-006 | conditional_display | PHP情報カード（`#php_info_box__header`＋iframe）は設定パラメータ`eccube_phpinfo_enabled`（既定=環境変数`ECCUBE_PHPINFO_ENABLED`既定'0'→bool偽）が**真のときのみ**DOM上に出力される。偽のときは当該カードのDOM要素自体が0件（システム情報カードのみ表示） | `{% if phpinfo_enabled %}`…`<div class="col-8" id="php_info_box__header" >`…`<span class="card-title">{{ 'admin.setting.system.system.php_info'\|trans }}</span>`…`<iframe name="php_info" src="{{ url('admin_setting_system_system_phpinfo') }}" …>`…`{% endif %}`／`env(ECCUBE_PHPINFO_ENABLED): '0'`＋`eccube_phpinfo_enabled: '%env(bool:ECCUBE_PHPINFO_ENABLED)%'`／「PHP情報カード｜`eccube_phpinfo_enabled` が真のときのみ表示されるカード」「設定パラメータ eccube_phpinfo_enabled が真のときのみPHP情報カードとiframeを出力する」「phpinfoを無効にした運用｜システム情報カードのみ表示し、PHP情報カードはDOM上も出さない」 | twig:61-80 / eccube.yaml:13,79 / md:58,98,124,132 | 1 |
| L1-M1106-007 | phpinfo_response | phpinfo用ルート（`GET /%eccube_admin_route%/setting/system/system/phpinfo`・route `admin_setting_system_system_phpinfo`）は`ob_start`+`phpinfo()`+`ob_get_contents`で得たHTML断片をそのまま生の`Response`として返す（`@admin/default_frame.twig`等の共通フレームを経由しない）。iframeの`src`はこのルートを指す | `#[Route(path: '/%eccube_admin_route%/setting/system/system/phpinfo', name: 'admin_setting_system_system_phpinfo', methods: ['GET'])]`＋`ob_start(); phpinfo(); $phpinfo = ob_get_contents(); ob_end_clean(); return new Response($phpinfo);`／`<iframe name="php_info" src="{{ url('admin_setting_system_system_phpinfo') }}" height="500" frameborder="0" …>`／「iframeが別のGETで取得したHTMLを表示する」「phpinfo応答が管理画面共通レイアウトを経由せず生のHTMLであること」 | Controller:56-65 / twig:75 / md:28,70,99 | 0 `non-ui-observable` |
| L1-M1106-008 | field_eccube_version | EC-CUBE行の値は`Constant::VERSION`（製品定数バージョン文字列）。**リテラル固定しない**（実装コミット依存の恒等写像claim=表示値とソース定数の一致のみを検査） | `$info[] = ['title' => trans('admin.setting.system.system.eccube'), 'value' => Constant::VERSION];`／「EC-CUBE｜製品が定数として保持するバージョン文字列を表示する」 | Controller:41 / Constant.php:26 / md:118 | 0 `non-translated` |
| L1-M1106-009 | field_server_os | サーバーOS行の値は`php_uname()`の戻り値をそのまま表示する（**恒等写像**・環境依存でリテラル固定しない） | `$info[] = ['title' => trans('admin.setting.system.system.server_os'), 'value' => php_uname()];`／「サーバーOS｜`php_uname()` の戻り値をそのまま表示する」 | Controller:42 / md:119 | 0 `non-translated` |
| L1-M1106-010 | field_db_server | DBサーバー行の値は`SystemService::getDbversion()`：Doctrine既定接続のプラットフォーム名により接頭辞を切替（SQLite=`"SQLite version "`+`sqlite_version()`／MySQL=`"MySQL "`+`version()`／それ以外=空文字+`version()`）、ネイティブクエリで1スカラー取得して連結する（**値は恒等写像**・接頭辞ルールのみリテラル固定） | `case 'sqlite': $prefix = 'SQLite version '; $func = 'sqlite_version()';`＋`case 'mysql': $prefix = 'MySQL '; $func = 'version()';`＋`default: $prefix = ''; $func = 'version()';`＋`$version = $this->entityManager->createNativeQuery('select '.$func.' as v', $rsm)->getSingleScalarResult(); return $prefix.$version;`／「DBサーバー｜SQLiteの場合は接頭辞「SQLite version 」に `sqlite_version()` の結果を連結する。MySQLの場合は接頭辞「MySQL 」に `version()` の結果を連結する。上記以外のプラットフォーム名の場合は接頭辞を空にし `version()` の結果を用いる。いずれもDoctrineの接続に対するネイティブ問い合わせで1スカラー取得する」「表示はDoctrineの既定接続に対する問い合わせ結果である」 | SystemService.php:51-79 / Controller:43 / md:120,141 | 0 `non-translated` |
| L1-M1106-011 | field_user_agent | User Agent行の値は要求ヘッダ`User-Agent`をそのまま表示（無ければnull）。**恒等写像**（要求内容のパススルー）。テスト側が送信ヘッダを制御できるためE2Eで完全一致検証が可能（codex R1是正・改訂1でWEBサーバー行はL1-M1106-026へ分離） | `$info[] = ['title' => …, 'value' => $request->headers->get('User-Agent')];`／「User Agent｜当該HTTP要求のUser-Agentヘッダー値。システム情報の1行としてそのまま表示する」「User Agent｜要求ヘッダUser-Agentを読む。無い場合は null となり得る」 | Controller:48 / md:60,121,123 | 0 `non-translated` |
| L1-M1106-012 | field_php_row_format | PHP行の値は`phpversion()`の文字列に空白＋丸括弧で`get_loaded_extensions()`の各要素をカンマ区切り連結したもの（`"X.Y.Z (ext1, ext2, …)"`形式）。拡張が多い環境では長大な一行文字列となり得る（**書式のみ固定・値は恒等写像**） | `$value = phpversion().' ('.implode(', ', get_loaded_extensions()).')'; $info[] = ['title' => …, 'value' => $value];`／「PHP｜phpversion() の文字列の後に、カンマ区切りの空白付きで `get_loaded_extensions()` の各要素を連結し、全体を丸括弧で包んで連結する」「拡張が非常に多い｜PHP行は長大な一行文字列となり得る」 | Controller:46-47 / md:122,131 | 0 `non-translated` |
| L1-M1106-013 | snapshot_no_refresh | 各行の値はその要求処理中に取得したスナップショットであり、画面を開いたままサーバ環境が変わっても自動更新しない（専用JS・ポーリングなし＝L1-024と表裏） | 「参照時点｜各行の値はその要求処理中に取得したスナップショットである。画面を開いたままサーバ環境が変わっても自動更新しない」 | md:140 / twig:23-83（script不存在） | 0 `data-passthrough` |
| L1-M1106-014 | no_cache | 本機能の表示結果を専用にキャッシュしない | 「キャッシュ｜本機能の表示結果を専用にキャッシュしない」 | md:160 | 0 `non-translated` |
| L1-M1106-015 | no_session_write | 本機能のコントローラ（`index`/`phpinfo`）はセッションを更新する処理を持たない（`$session`/`session->set`不出現=grep実測）。認証済みセッションの検証は管理領域の共通処理に従う | `SystemController.php`全文にセッション操作不存在（コンストラクタ引数は`EccubeConfig`/`SystemService`のみ）／「セッション｜本機能のコントローラがセッションを更新する処理は持たない。認証済みセッションの検証は管理領域の共通処理に従う」 | Controller:1-66（全文） / md:161,255 | 0 `non-ui-observable` |
| L1-M1106-016 | db_effect_observed | `SystemController.php`（index/phpinfo）**単体**の静的grep範囲内でpersist/flush/INSERT/UPDATE呼び出しが**0件**（同ファイル全文）。DB利用は`SystemService::getDbversion()`のSELECT一回のみ。**この観測は当該コントローラ経由で登録・更新呼び出しが発生しないという静的事実にとどまり、依存先を含む全呼び出し経路の無書込証明ではなく、設計書DB操作節（md:188-192）とread-only明記5箇所（md:7,15,110,142,159）のどちらが設計として正しいかを断定するものでもない**（DOC-DRAFT-m11-06-1は矛盾のまま未解決＝codex R1是正。期待は本観測範囲＝`SystemController.php`単体の無登録呼び出しと、`dtb_authority_role`テーブルの行数・全列ダイジェスト不変〔C-017〕に限定する） | 「DB更新｜行わない。DBバージョン取得のための読み取りのみ」「永続化｜本機能は表示のみで、システム情報の内容をDBに書き戻さない」「本機能は台帳件数の集計や業務判定を行わない。画面に出すのは実行時に取得した文字列の表示のみである」 | md:110,142,159,7 / Controller:1-66（persist/flush不出現・単体grep範囲） | 0 `non-ui-observable` |
| L1-M1106-017 | authority_deny_schema | 権限別拒否URLは`dtb_authority_role`（列`authority_id`・`deny_url`）に保存され、ログイン中メンバーの権限（`Member::getAuthority()`）に紐付く | `#[ORM\Table(name: 'dtb_authority_role')]`＋`#[ORM\Column(name: 'deny_url', type: Types::STRING, length: 4000)]`＋`#[ORM\JoinColumn(name: 'authority_id', referencedColumnName: 'id')]`／「権限別拒否URL｜`dtb_authority_role` に保存され、ログイン中メンバーの権限に紐付く。要求パスが管理ルート接頭辞および拒否URLパターンと先頭一致すれば認可で拒否される」 | AuthorityRole.php:25,30,35-36,50-51 / md:59,183-184 | 0 `non-ui-observable` |
| L1-M1106-018 | authority_deny_matching_structure | `AuthorityVoter`のソース上には、要求パス（パス情報のみ・クエリ除く）と管理ルート接頭辞＋拒否URLパターンとの**先頭一致**（正規表現・`^`のみで終端`$`アンカーなし）を全拒否行に対し検査し一致が一つでもあれば`ACCESS_DENIED`とするtryブロック、および拒否URLが正規表現として不正な場合に`\Exception`を捕捉し`preg_quote`でエスケープした文字列に対する**先頭一致**（同じく終端非アンカー・**「完全一致」ではない**=codex R1是正）へフォールバックするcatchブロックが**静的に存在する**。**本候補はこの構造の存在確認までであり、実際に不正な正規表現の拒否URLがロードされた際に例外が送出されフォールバック分岐まで実行されることの動的再現・観測は行わない（要実機）** | `$denyUrl = str_replace('/', '\/', $AuthorityRole->getDenyUrl()); if (preg_match("/^(\/{$adminRoute}{$denyUrl})/i", (string) $path)) { return VoterInterface::ACCESS_DENIED; }`＋`} catch (\Exception) { $denyUrl = preg_quote((string) $AuthorityRole->getDenyUrl(), '/'); if (preg_match(...)) { return VoterInterface::ACCESS_DENIED; } }`／「一致する拒否が一つでもあればアクセス拒否となり…403応答となる」「保存値が正規表現として解釈できない場合は例外を捕まえ、文字列の完全一致エスケープによる先頭一致検査にフォールバックする実装がある」（※design側の「完全一致エスケープ」は`preg_quote`のエスケープ手法を指す語であり、マッチ自体は先頭一致＝design文自身も「先頭一致検査」と明記） | AuthorityVoter.php:55-70 / md:103-104,201 | 0 `non-translated` |
| L1-M1106-019 | authority_deny_initial_data | 初期データでは店舗オーナー（`tenant_owner`・`authority_id=4`）・店舗オペレーター（`tenant_operator`・`authority_id=5`）に`deny_url=/setting/system/system`が設定される。`AuthorityVoter`の先頭一致（L1-018）は接頭辞アンカーのみで終端非アンカーのため、システム情報画面（`/setting/system/system`）と同一先頭パスを持つphpinfo応答（`/setting/system/system/phpinfo`）の**両方**が403拒否となる。システム管理者（`system`=1）・モールオーナー（`mall_owner`=2）・モールオペレーター（`mall_operator`=3）には当該deny_urlが設定されておらず本機能を閲覧可能 | `"20","4",,"/setting/system/system",…` / `"21","5",,"/setting/system/system",…`（authority_id=4,5の行のみ`/setting/system/system`を持つ。1/2/3の行に同deny_urlは不存在=CSV全文grep）／「店舗オーナーまたは店舗オペレーターでログイン｜`GET /%eccube_admin_route%/setting/system/system` および上記 phpinfo｜初期データではシステム情報パスが拒否リストに含まれるため、この画面と同じ先頭パスを持つphpinfo応答にも到達できずHTTP 403となる」「店舗オーナー、店舗オペレーター（初期データ）｜システム情報パスに対する拒否行があるため、当該画面および同拒否の先頭に一致するphpinfo応答は403となる」 | dtb_authority_role.csv:20-21 / mtb_authority.csv:2-6 / md:71,211 | 0 `non-ui-observable` |
| L1-M1106-020 | nav_filter | `TwigInitializeListener::setAdminGlobals`が`eccube_nav`設定（`setting > system_setting > system_index`＝ルート`admin_setting_system_system`）からログイン中メンバーの拒否URLに合致するメニュー項目を`getDisplayEccubeNav()`で除去してから`eccubeNav`をTwigへ渡す。拒否URLに合致する権限（店舗オーナー・店舗オペレーター＝L1-019）ではサイドナビに「システム情報」項目が生成されない | `$AuthorityRoles = $this->authorityRoleRepository->findBy(['Authority' => $Member->getAuthority()]); $baseUrl = …; $eccubeNav = $this->getDisplayEccubeNav($eccubeNav, $AuthorityRoles, $baseUrl);`＋`foreach ($AuthorityRoles as $AuthorityRole) { $denyUrl = str_replace('/', '\/', $baseUrl.$AuthorityRole->getDenyUrl()); if (preg_match("/^({$denyUrl})/i", $url)) { unset($parentNav[$key]); break; } }`＋eccube_nav.yaml: `system_setting: … system_index: name: admin.setting.system.system_info url: admin_setting_system_system`／「メンバー権限に応じてサイドナビを生成する処理があり、拒否URLに合致する項目は表示されない場合がある」「ナビ表示｜メンバー権限に応じてサイドナビを生成する処理があり、拒否URLに合致する項目は表示されない場合がある。URLを直接知っていても拒否時は403」 | TwigInitializeListener.php:176-194,204-254（deny_url一致foreach=238-245） / eccube_nav.yaml:204,275-277 / md:212 | 0 `non-translated` |
| L1-M1106-021 | page_transition | メニューからシステム情報を選ぶと、専用の別画面へは遷移せず同一画面としてシステム情報を表示する（本機能内に403以外の代替画面はない） | 「メニューからシステム情報を選ぶ｜同一画面としてシステム情報を表示」 | md:220 / eccube_nav.yaml:275-277（url=admin_setting_system_system） | 0 `non-translated` |
| L1-M1106-022 | **TBD** | DB接続やバージョン取得に失敗した場合はアプリケーションの例外処理に委ねる（本機能専用の利用者向けメッセージなし）＝**実claimだが観測契約が定義不能**: HTTPステータス・例外型の列挙は設計書が明示的にスコープ外と明記（md:38「Doctrine接続失敗時のHTTPステータス、例外型、エラーページの文言」は扱わない）とし、DB障害の安全な誘発手段も標準環境に無い。**未確定オラクル台帳へ**（excludedにしない=実在仕様の除外禁止） | 「DB接続やversion取得に失敗｜アプリケーションの例外処理に委ねる。本機能専用の利用者向けメッセージは定義しない」「失敗時出力｜認可失敗時は403。DB障害時は共通例外処理に委ねる」「DB読み取り失敗｜共通例外処理」 | md:130,173,230,38 | — |
| L1-M1106-023 | no_form_no_validation | 本機能はフォーム・テキスト入力を持たないため入力検証（必須/相関/DBとの相関）は成立しない（`system.twig`にinput/form/textarea/select 0件=grep実測。コントローラに`createBuilder`/`createForm`不出現） | 「入力項目｜本機能はフォームを持たない」「利用者入力｜本機能はフォームを持たないため、入力検証はない」 | md:84,196-200 / twig:1-85（input/form不存在） | 0 `non-translated` |
| L1-M1106-024 | no_modal_no_dedicated_js | 本機能はモーダル・確認ダイアログ・トーストを表示せず、本画面専用の独自スクリプトを持たない（折りたたみはBootstrapのcollapse、ツールチップはBootstrapのdata属性のみ。twigにscript/inline handler 0件=grep実測） | 「モーダル・ポップアップ｜本機能はモーダル、確認ダイアログ、トーストを表示しない」「JS 挙動｜本画面専用の独自スクリプトは持たない。折りたたみはBootstrapのcollapse。ツールチップはBootstrapのdata属性」 | md:81,83 / twig:1-85（script不存在） | 0 `non-translated` |
| L1-M1106-025 | display_page_title | ページタイトル領域（`h2.c-pageTitle__title`）に「システム情報」、サブタイトル領域（`span.c-pageTitle__subTitle`）に「システム設定」が表示される（`block title`/`block sub_title`をdefault_frame.twigが埋め込む） | `<h2 class="c-pageTitle__title">{{ block('title') }}</h2><span class="c-pageTitle__subTitle">{{ block('sub_title') }}</span>`＋`{% block title %}{{ 'admin.setting.system.system_info'\|trans }}{% endblock %}`＋`{% block sub_title %}{{ 'admin.setting.system'\|trans }}{% endblock %}`／「表示要素｜ページタイトルにシステム情報、サブタイトルにシステム設定」 | default_frame.twig:195-196 / twig:16-17 / md:80 | 1 |
| L1-M1106-026 | field_web_server_env_only | WEBサーバー行の値は要求のサーバ変数`SERVER_SOFTWARE`（無ければnull相当）をそのまま表示する（表示経路自体はController:44で静的確認済み）。**値そのものはE2Eテスト実行環境のWebサーバー/PHPプロセス設定に依存し、Playwright側から送信内容を制御できない＝表示経路の存在確認までとし、値の一致検証はE2Eの検証範囲外（環境観測・サーバ側契約）とする**（codex R1是正・改訂1でL1-M1106-011から分離。User Agentとの非対称性はテスト側が入力を制御できるか否かに起因し矛盾ではない） | `$info[] = ['title' => trans('admin.setting.system.system.web_server'), 'value' => $request->server->get('SERVER_SOFTWARE')];`／「WEBサーバー｜要求のサーバ変数SERVER_SOFTWAREを読み、無ければ null 相当の表現になり得る」 | Controller:44 / md:121 | 0 `non-ui-observable`（値は環境依存・E2E非制御） |

## §2 SEED三段参照設計（SEED-M1106系・全て `@TBD-D5`・**SQL実体は未実装**）

三段参照: **期待の正=L1オラクルID（§1） → 前提状態=SEEDセットID@manifest_sha1 → 観測=実値**。
本機能は集計を持たないため（md:110）、m02-04/m02-02のようなdb.ts式評価突合は不要。SEEDは主に**権限（Authority）
の違い**を再現するための管理者アカウントのみ。動的値系（EC-CUBE/サーバーOS/DBサーバー/WEBサーバー/PHP/User Agent）
はSEEDでなく「取得元関数と一致すること」（三段参照の恒等写像確認・§6.3）で判定する。

| SEEDセットID | 目的 | 固定値（設計） | 後始末 |
|---|---|---|---|
| SEED-M1106-ADMIN | システム管理者（authority_id=1・deny_urlなし・2FA OFF） | `config/default.config.ts` の ECCUBE_ADMIN_USER/PASS 既定（既存共通） | 既存利用・撤去不要 |
| SEED-M1106-TENANT-OWNER | 店舗オーナー（authority_id=4）ログイン用会員（403確認・補完C-101/C-105） | `dtb_member` 帯ID・login_id=`e2e-m1106-tenant-owner`・Authority=4・稼働。初期データの`dtb_authority_role` id=20（deny_url=`/setting/system/system`）をそのまま利用（新規deny行の追加は不要） | マーカー/帯ID DELETE（down） |
| SEED-M1106-TENANT-OPERATOR | 店舗オペレーター（authority_id=5）ログイン用会員（403確認・補完C-102） | 同上・Authority=5・初期データ`dtb_authority_role` id=21をそのまま利用 | 同上 |
| （env専用・SEEDでない）ECCUBE_PHPINFO_ENABLED=1 | PHP情報カード/iframe表示（真側）の確認 | コンテナ環境変数の切替（既定'0'）＝**DB SEEDではなく環境プロファイル**。標準の共有DB/共有envでは切替不可＝別プロファイル起動が前提（§9-2） | 環境プロファイル復元（既定へ戻す） |

- SEED-M1106-TENANT-OWNER/OPERATORはパスワードハッシュ生成（`Eccube\Security\PasswordHasher\PasswordHasher`
  互換）を要するため実体はD5型SEED契約＝`@TBD-D5`。dtb_authority_roleの新規行追加は**不要**（初期データの
  id=20/21をそのまま前提にできる＝標準環境の初期データが崩れていないことのみが前提。§9-3）。
- 動的値フィールド（L1-008〜012）は「表示された文字列」を直接SEED値と突合しない。判定は
  「表示値が`phpversion()`/`php_uname()`等の**呼び出し規約と書式**に整合すること」（§6.3の恒等写像チェック）
  とし、値そのものをexpected literalに固定しない（動的値の三段参照＝タスク前提）。

## §3 表示/権限/遷移マトリクス

### 3a. 権限×画面到達可否（三値比較: 設計md 209-212 ⇔ ee AuthorityVoter/初期データ ⇔ 観測=HTTPステータス/DOM）

| 利用者状態 | システム情報画面 | phpinfo応答 | サイドナビ「システム情報」項目 | L1 |
|---|---|---|---|---|
| 未認証 | admin_loginへ誘導・到達不可 | 同左（到達前） | （ログイン前のため評価対象外） | L1-001 |
| システム管理者/モールオーナー/モールオペレーター（authority_id 1/2/3・当該deny_urlなし） | 200・カード表示 | 200・phpinfo HTML（phpinfo_enabled真の場合のみ意味を持つ） | 表示される | L1-002,004,019,020 |
| 店舗オーナー（authority_id=4） | **403**（deny_url=/setting/system/system） | **403**（同一先頭パス） | **表示されない** | L1-018,019,020 |
| 店舗オペレーター（authority_id=5） | **403** | **403** | **表示されない** | L1-018,019,020 |

### 3b. PHP情報カードの条件表示

| `eccube_phpinfo_enabled` | システム情報カード | PHP情報カード（DOM） | iframe内容 | L1 |
|---|---|---|---|---|
| 偽（既定） | 表示 | **DOM上に存在しない**（0件） | — | L1-006 |
| 真（別環境プロファイル・要実機） | 表示 | 表示（見出し「PHP情報」+iframe） | phpinfoの生HTML | L1-006,007 |

### 3c. 表示・副作用（read-only）

| 面 | 内容 | L1 |
|---|---|---|
| カード構造 | `#server_info_box__header`見出し（span+ツールチップ+問い合わせアイコン）・折りたたみ`#systemInfo`（既定open）・本文6行（`col-2`ラベル+`col#server_info_box__value--N`値） | L1-003,004,025 |
| 動的値 | EC-CUBE/サーバーOS/DBサーバー/WEBサーバー/PHP/User Agentは恒等写像（値固定なし） | L1-008〜012 |
| 副作用 | DB更新なし・専用キャッシュなし・セッション書込なし・自動更新なし・専用JSなし・モーダルなし | L1-013,014,015,016,024 |

## §4 実行可能グレード14列TSV（候補・**自己完結＝全28行を実体掲載**）

記法: 期待結果セルは三段参照 `…実値… [L1:<oracle_id>; fixture:<SEEDセットID>@TBD-D5]`。
`%eccube_admin_route%` は環境値（既定 `admin`）。セレクタ（既存page実装済み・twig由来。旧page.tsコメントの
messages.yaml行番号は現行コミットとずれているため本書のnl -ba再照合値を正とする）:
`#server_info_box__header .card-title`（twig:28）・折りたたみトグル`a[href="#systemInfo"][data-bs-toggle=collapse]`
（twig:33）・折りたたみ本文`#systemInfo`（twig:40）・本文`#server_info_box__body_inner`（twig:41）・
値コンテナ`[id^="server_info_box__value--"]`（twig:49）・PHP情報ヘッダ`#php_info_box__header`（twig:66）・
iframe`#php_info_box__frame iframe[name=php_info]`（twig:75）・ページタイトル`.c-pageTitle__title`／
サブタイトル`.c-pageTitle__subTitle`（default_frame.twig:196）。en行はD15前提。

### §4.1 bound対応候補行（22行=ja21＋-EN1。§8の61対応表が参照する全行）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-001	IT-15	未認証	P1	未認証でシステム情報画面へアクセスすると管理ログインへ誘導され到達できない	未ログイン（cookieなしcontext）	—	1. GET /%eccube_admin_route%/setting/system/system 2. 遷移先URLと画面を確認	admin_login のログイン画面へ誘導され、システム情報画面（システム情報カード）は表示されない [L1:L1-M1106-001]				
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-002	IT-25	成功時出力	P1	ログイン後にシステム情報画面が管理画面共通レイアウトのHTMLとしてHTTP200で表示される	管理者ログイン済（SEED-M1106-ADMIN・2FA OFF）	—	1. ログインし GET /%eccube_admin_route%/setting/system/system 2. HTTPステータスと画面が管理共通ヘッダ/サイドナビを含むことを確認	HTTP200で応答し、画面は管理画面共通レイアウト（サイドナビ・ヘッダを含む@admin/default_frame.twig拡張）のHTMLである [L1:L1-M1106-002; fixture:SEED-M1106-ADMIN@TBD-D5]				
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-003	IT-25	表示	P1	システム情報カードが画面本体の先頭カードとして見出し・折りたたみ本文とともに表示される（ja）	管理者ログイン済（SEED-M1106-ADMIN）	—	1. システム情報画面を開く 2. #c-primaryCol内の最初の.cardが#server_info_box__headerを含むことを確認 3. .card-title文言・ツールチップアイコン・折りたたみトグル・#systemInfoがcollapse showクラスで既定展開されていることを確認	システム情報カードが画面本体の先頭カードとして表示され、見出し「システム情報」・問い合わせアイコン・折りたたみトグルを持ち、本文（#systemInfo）は既定で展開（collapse show）状態である [L1:L1-M1106-003; fixture:SEED-M1106-ADMIN@TBD-D5]				
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-003-EN	IT-25	表示	P3	システム情報カード見出し文言（en）	管理者ログイン済／locale=en	—	1. en UIでシステム情報画面を開く 2. カード見出し文言を読む	見出し="System Info"（messages.en.yaml:2682） [L1:L1-M1106-003; fixture:SEED-M1106-ADMIN@TBD-D5]				
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-004	IT-25	表示	P1	権限が許可される場合システム情報カードに6行の固定ラベルと値が順序どおり表示される	管理者ログイン済（SEED-M1106-ADMIN）	—	1. システム情報画面を開く 2. #server_info_box__body_inner内の行順を上から確認	「EC-CUBE」「サーバーOS」「DBサーバー」「WEBサーバー」「PHP」「User Agent」の6行がこの順に表示され、各値コンテナに#server_info_box__value--1〜6の連番idが付与されている [L1:L1-M1106-004; fixture:SEED-M1106-ADMIN@TBD-D5]				
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-005	IT-15	状態変化	P2	折りたたみアイコン押下でカード本文が折りたたまれ再押下で展開される	管理者ログイン済	—	1. システム情報画面を開く 2. 角度アイコンを押下 3. #systemInfoがcollapse（showなし）になることを確認 4. 再度押下し#systemInfoがcollapse showに戻ることを確認	押下のたびにカード本文（#systemInfo）が折りたたまれたり展開されたりし、追加のサーバ問い合わせは発生しない [L1:L1-M1106-005]				
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-006	IT-25	表示順	P1	既定環境（eccube_phpinfo_enabled=偽）ではPHP情報カードがDOM上に存在しない	管理者ログイン済（SEED-M1106-ADMIN・既定env ECCUBE_PHPINFO_ENABLED=0）	—	1. システム情報画面を開く 2. #php_info_box__header および iframe[name=php_info] の要素数を確認	PHP情報カード（#php_info_box__header・iframeとも）がDOM上に0件で、システム情報カードのみが表示される [L1:L1-M1106-006; fixture:SEED-M1106-ADMIN@TBD-D5]				
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-007	IT-25	表示順	P2	【要環境プロファイル】eccube_phpinfo_enabled=真の環境ではPHP情報カードとiframeが表示される	管理者ログイン済／**ECCUBE_PHPINFO_ENABLED=1の別環境プロファイル**（標準共有env=既定'0'では実行不可・§9-2）	—	1. phpinfo_enabled=真のプロファイルでシステム情報画面を開く 2. #php_info_box__header の見出し文言と iframe[name=php_info] の src 属性を確認	PHP情報カード（見出し「PHP情報」）が表示され、iframeのsrcが /%eccube_admin_route%/setting/system/system/phpinfo を指す [L1:L1-M1106-006]				
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-008	IT-25	HTTPステータス	P2	【要環境プロファイル】phpinfoルートは共通フレームを経由しない生HTML応答をiframeが表示する	管理者ログイン済／ECCUBE_PHPINFO_ENABLED=1の別環境プロファイル	—	1. iframeのsrc URLへ直接GET 2. 応答本文に管理共通フレーム要素（サイドナビ・.c-pageTitle等）が含まれないこと、phpinfo標準出力（<title>phpinfo()</title>等）が含まれることを確認	応答は生のHTML（管理画面共通レイアウト非経由）であり、iframe内にその内容がそのまま表示される [L1:L1-M1106-007]				
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-009	IT-22	文字列長バリデーション	P2	EC-CUBE行に製品バージョン文字列が表示される（恒等写像・リテラル固定なし）	管理者ログイン済	—	1. システム情報画面を開く 2. EC-CUBE行の値テキストを取得 3. ee実ソースのConstant::VERSIONの値と一致することを確認（実値は環境/コミット依存）	EC-CUBE行の値はソース定数Constant::VERSIONの現在値と一致する空でない文字列である（値そのものをSEED/期待リテラルに固定しない） [L1:L1-M1106-008]				
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-010	IT-05	実行結果	P1	サーバーOS行にphp_uname()の戻り値がそのまま表示される（恒等写像）	管理者ログイン済	—	1. システム情報画面を開く 2. サーバーOS行の値テキストを取得 3. 空でない文字列であることを確認（サーバ側php_uname()実行値との一致はD5でサーバ側検証併用）	サーバーOS行の値はphp_uname()の戻り値がそのまま表示され空でない [L1:L1-M1106-009]				
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-011	IT-02	初期行数	P2	DBサーバー行がDoctrine既定接続のプラットフォーム別接頭辞ルールに従って表示される	管理者ログイン済	—	1. システム情報画面を開く 2. DBサーバー行の値テキストを取得 3. PostgreSQL環境では接頭辞なし（version()結果のみ）、SQLite環境では"SQLite version "接頭辞、MySQL環境では"MySQL "接頭辞であることを書式パターンで確認	DBサーバー行の値はDoctrine既定接続のプラットフォームに応じた接頭辞ルール（SQLite="SQLite version "+sqlite_version()／MySQL="MySQL "+version()／それ以外=接頭辞なし+version()）に従う空でない文字列である [L1:L1-M1106-010]				
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-012	IT-20	識別子	P1	User Agent行が送信ヘッダの恒等写像として表示される（WEBサーバー行の値一致検証は範囲外=改訂1）	管理者ログイン済	リクエストヘッダ User-Agent = "E2E-M1106-UA-<marker>"	1. 固定User-Agent文字列を付与してシステム情報画面を開く 2. User Agent行の値テキストが手順1で送信した文字列と完全一致することを確認（WEBサーバー行はL1-M1106-026により本ケースでは値一致を主張しない。表示欄の存在のみC-004で確認済み）	User Agent行は送信したUser-Agentヘッダ値をそのままエスケープ済みプレーンテキストで表示する（完全一致） [L1:L1-M1106-011]				
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-013	IT-12	内部情報	P1	PHP行がphpversion()+拡張一覧の書式で表示され拡張が多い場合は長大な一行文字列となる	管理者ログイン済	—	1. システム情報画面を開く 2. PHP行の値テキストを取得 3. 正規表現 ^[0-9][^ ]* \(.*\)$ 相当の書式（バージョン文字列+空白+丸括弧内カンマ区切り拡張一覧）に一致することを確認 4. サーバ側get_loaded_extensions()件数が多い場合でも表示・折り返しが崩れず1行文字列として保持されることを確認	PHP行の値はphpversion()文字列に空白と丸括弧付きの拡張一覧（カンマ区切り）を連結した書式であり、拡張数が多い場合は長大な一行文字列となり得る（値そのものは環境依存） [L1:L1-M1106-012]				
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-014	IT-22	部分入力	P2	各行の値は要求処理中に取得したスナップショットであり画面を開いたまま自動更新しない	管理者ログイン済	—	1. システム情報画面を開き6行の値テキストを記録 2. 画面を開いたまま一定時間待機（ポーリング等が発生しないことを監視） 3. 追加のネットワークリクエストが発生しないこと・値テキストが不変であることを確認	表示中に追加リクエストは発生せず、値テキストは開いた時点のスナップショットのまま自動更新されない [L1:L1-M1106-013]				
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-015	IT-26	登録内容	P2	応答ヘッダに本機能専用のキャッシュ指定が存在しない（観測範囲を限定=改訂1）	管理者ログイン済	—	1. システム情報画面を表示し応答ヘッダを取得 2. 本機能専用のCache-Control/ETag等の指定が無いことを確認（フレームワーク共通ヘッダは対象外・積極的な「専用キャッシュ機構が存在しないこと」自体の網羅証明はしない）	応答ヘッダに本機能固有のキャッシュ制御指定は存在しない（「専用キャッシュ機構を持たない」という積極断定はソース側grep(cache関連API不出現)による静的補完に委ね、本ケースは応答ヘッダの限定観測にとどめる） [L1:L1-M1106-014]				
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-016	IT-12	画面レイアウト	P2	セッションCookie値が表示前後で不変（静的grepと役割分担・改訂1）	管理者ログイン済	—	1. 静的確認: SystemController.php全文にsession->set等のセッション書込呼び出しが0件であることをgrepで確認（実装確認） 2. ログイン完了後のセッションCookie値T0を記録 3. システム情報画面を開く（表示のみ・折りたたみ操作なし） 4. セッションCookie値がT0と不変であることを確認	静的確認: SystemController.phpにセッション書込呼び出しは存在しない。E2E補助観測: 表示前後でセッションCookie値は不変である（**Cookie値の不変は同一セッション内のサーバ側セッションストア更新の不在までは保証しない別命題であり、「セッションキーが書き込まれない」の直接証明はしない**） [L1:L1-M1106-015]				
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-017	IT-12	画面レイアウト	P1	dtb_authority_roleテーブルが表示前後で不変（観測範囲をこの1表に限定=codex R1 Blocker是正・改訂1）	管理者ログイン済／標準環境	—	1. dtb_authority_role の行数＋主キー順全列ダイジェスト（db.ts）T0を記録 2. システム情報画面を開く（折りたたみ操作・複数回表示含む） 3. dtb_authority_role のT1を再照会	T0=T1（行数・全列ダイジェスト完全一致）＝本機能の表示によって**dtb_authority_role（設計書DB操作節md:192が名指す対象表・本観測が照会する唯一の表）**の行数・全列は不変である。**本観測はdtb_authority_role以外のテーブルへの影響については何も主張しない**（「いかなるテーブルへの登録/更新も発生しない」という全表を跨ぐ主張はしない＝観測範囲超過の是正）。設計書DB操作節（md:188-192）とread-only明記5箇所（md:7,15,110,142,159）は同一設計書内で矛盾しており**未解決のままDOC-DRAFT-m11-06-1として上流へ申し送る**（期待値を「登録される」側に捏造せず、かつ「read-onlyが設計として正しい」とも断定しない。期待は本観測事実＝dtb_authority_role不変、に限定） [L1:L1-M1106-016]				
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-018	IT-20	出力抑止	P1	権限別拒否URLはdtb_authority_role（authority_id・deny_url列）に保存されメンバー権限に紐付く（非UI・DBスキーマ確認）	—	db.tsで dtb_authority_role の authority_id=4,5 の行を照会	1. db.tsで dtb_authority_role WHERE authority_id IN (4,5) を照会 2. deny_url列に '/setting/system/system' を含む行が存在することを確認	dtb_authority_role テーブルに authority_id（店舗オーナー=4／店舗オペレーター=5）と deny_url 列（'/setting/system/system' を含む）を持つ行が存在し、権限に紐付いて保存されている [L1:L1-M1106-017]				
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-019	IT-26	画面表示データ	P2	拒否URLが正規表現として不正な場合に例外を捕まえエスケープ済み先頭一致検査へフォールバックする構造がソース上に存在する（静的確認のみ・「完全一致」表現は誤り=改訂1）	—	AuthorityVoter.php:55-69 の try/catch 構造とpreg_quoteフォールバックの存在を確認（静的確認のみ・db.ts併用）	1. AuthorityVoter::vote 内で preg_match が try ブロック内にあり catch(\Exception) で preg_quote によるエスケープ済み文字列に対する先頭一致（終端非アンカー）へフォールバックする実装であることをソースコード上で確認する（実行時に不正な正規表現から実際に例外が送出されフォールバック分岐まで到達することの動的再現は本ケースでは行わない）	不正な正規表現の拒否URLに対しては例外を捕捉し preg_quote によるエスケープ済み文字列に対する**先頭一致**（終端非アンカー・「完全一致」ではない）検査へフォールバックする実装がソース上に存在する（**静的確認**。この分岐が実行時に実際に発火することの動的観測は要実機＝§9） [L1:L1-M1106-018]				
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-020	IT-23	実行結果	P1	メンバー権限に応じてサイドナビが生成され拒否URLに合致する「システム情報」項目は表示されない場合がある	管理者ログイン済（SEED-M1106-ADMIN・deny_urlなし）	—	1. ログイン後の管理画面でサイドナビの「設定＞システム設定」配下を展開 2. 「システム情報」項目が表示されることを確認（deny_urlなしの権限での対照）	deny_urlに該当しない権限（システム管理者等）ではサイドナビに「システム情報」項目が生成され表示される [L1:L1-M1106-020; fixture:SEED-M1106-ADMIN@TBD-D5]				
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-021	IT-12	非同期更新	P2	メニューからシステム情報を選ぶと同一画面としてシステム情報が表示される	管理者ログイン済	—	1. サイドナビの「システム情報」項目を押下 2. 遷移先URLが /%eccube_admin_route%/setting/system/system であり専用の別画面へ遷移しないことを確認	メニュー選択により専用の別画面へは遷移せず、同一のシステム情報画面が表示される [L1:L1-M1106-021]				
```

### §4.2 補完行（6行=ja6。**親test_idなし・母集合会計に算入しない**。理由=設計書補完〔一次資料に規定があるが、母集合61行の期待テキストに対応する親が存在しない〕）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-101	IT-15	権限拒否	P1	店舗オーナーはシステム情報画面へのアクセスが403で拒否される	SEED-M1106-TENANT-OWNER（authority_id=4）でログイン済	—	1. 店舗オーナーでログイン 2. GET /%eccube_admin_route%/setting/system/system 3. HTTPステータス/エラー画面を確認	初期データの拒否行（dtb_authority_role authority_id=4・deny_url=/setting/system/system）により403でアクセス拒否される [L1:L1-M1106-018,L1-M1106-019; fixture:SEED-M1106-TENANT-OWNER@TBD-D5]（補完行・親test_idなし・設計書補完=md:71,211）				
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-102	IT-15	権限拒否	P1	店舗オペレーターはシステム情報画面とphpinfo応答の両方が403で拒否される	SEED-M1106-TENANT-OPERATOR（authority_id=5）でログイン済	—	1. 店舗オペレーターでログイン 2. GET /%eccube_admin_route%/setting/system/system → 403を確認 3. GET /%eccube_admin_route%/setting/system/system/phpinfo → 403を確認	AuthorityVoterの先頭一致（末尾非アンカー）により、システム情報画面（/setting/system/system）とphpinfo応答（/setting/system/system/phpinfo）の両方が同一拒否行で403拒否される [L1:L1-M1106-018,L1-M1106-019; fixture:SEED-M1106-TENANT-OPERATOR@TBD-D5]（補完行・親test_idなし・設計書補完=md:71,104,211）				
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-103	IT-15	権限拒否対照	P2	店舗オーナー/オペレーターではサイドナビの「システム情報」項目が生成されない	SEED-M1106-TENANT-OWNER／SEED-M1106-TENANT-OPERATOR	—	1. 店舗オーナーでログインしサイドナビの「設定＞システム設定」配下を展開 2. 「システム情報」項目が存在しないことを確認 3. 店舗オペレーターでも同様に確認	deny_urlに合致する権限（authority_id=4,5）ではサイドナビに「システム情報」項目が生成されない（TwigInitializeListener::getDisplayEccubeNavによる除去） [L1:L1-M1106-020; fixture:SEED-M1106-TENANT-OWNER@TBD-D5]（補完行・親test_idなし・設計書補完=md:212）				
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-104	IT-22	no-form	P3	本機能はフォーム・テキスト入力を持たないため入力検証は成立しない	管理者ログイン済	—	1. システム情報画面を開く 2. input/form/textarea/select要素数を確認	画面内にinput/form/textarea/select要素が0件であり、本機能にフォーム入力・入力検証は存在しない [L1:L1-M1106-023]（補完行・親test_idなし・設計書補完=md:84,196-200）				
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-105	IT-25	no-modal	P3	本機能はモーダル・確認ダイアログ・トーストを表示せず本画面専用のJavaScriptを持たない	管理者ログイン済	—	1. システム情報画面を開く 2. .modal/[role=dialog]/toast相当要素数を確認 3. 折りたたみ操作を行いモーダル等が介在しないことを確認 4. 本画面専用のscript要素/インラインハンドラが無いことを確認（Bootstrap collapse/tooltip由来のdata属性のみ許容）	モーダル・確認ダイアログ・トースト要素は0件であり、折りたたみ・ツールチップはBootstrapの標準機構（data属性）のみで実現され本画面専用スクリプトは存在しない [L1:L1-M1106-024]（補完行・親test_idなし・設計書補完=md:81,83）				
m11-06_admin_system_setting_setting_system_system_info	E2E-M1106C-106	IT-25	ページタイトル	P3	ページタイトルに「システム情報」サブタイトルに「システム設定」が表示される	管理者ログイン済	—	1. システム情報画面を開く 2. .c-pageTitle__title と .c-pageTitle__subTitle のテキストを確認	ページタイトル領域に「システム情報」、サブタイトル領域に「システム設定」が表示される [L1:L1-M1106-025]（補完行・親test_idなし・設計書補完=md:80）				
```

## §5 locale対応表

- **LS=1 claim（3件）**: L1-M1106-003（カード見出し。ja「システム情報」＝messages.ja.yaml:2996／en "System Info"
  ＝messages.en.yaml:2682）・L1-M1106-004（行ラベル6件。ja「EC-CUBE」「サーバーOS」「DBサーバー」「WEBサーバー」
  「PHP」「User Agent」＝messages.ja.yaml:3345-3350／en "EC-CUBE"・"Server OS"・"DB Server"・"WEB Server"・"PHP"・
  "User Agent"＝messages.en.yaml:2959-2964。"EC-CUBE"/"PHP"/"User Agent"はja/en同綴）・L1-M1106-025（ページタイトル/
  サブタイトル。ja「システム情報」「システム設定」＝messages.ja.yaml:2996,2987／en "System Info"・
  "System Settings"＝messages.en.yaml:2682,2674）。すべてen一次資料逐語・ja翻訳ゼロ。
  → **-EN 1行**（C-003-EN。行ラベル・ページタイトルのen確認は候補規律上-EN追加は最小限に留め、
  L1-M1106-004/025のen値は§1で確定済みだが専用候補行までは追加しない＝行数過大化回避。値はここに記録済みで
  D15移行時に必要なら追加可能）。
- **LS=0（理由コード付き）**:
  - `non-translated`: L1-001/002(HTTP経路のみ)/005/006/007/008/009/010/011/012/013/014/018/020/021/023/024
    （URL・関数呼び出し規約・書式・要素有無＝文言非依存。動的値は関数の恒等写像でありlocale切替対象文言ではない）。
  - `non-ui-observable`: L1-005/007/015/016/017/019/026（HTTP/DB/セッション/静的実装事実・L1-026はSERVER_SOFTWARE
    の環境依存値でE2E非制御=改訂1）。
  - `data-passthrough`: L1-013（表示値はリクエスト時点のサーバ状態の反映）。
- -EN行の実行前提はD15（管理画面のen切替口。W0実測を継承）。文言確定は本書で完了（実行のみ保留）。

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

### §6.1 観測契約（本機能はフォームPOSTなし＝CSRF request契約は非該当）

- **GETのみ**: `GET /%eccube_admin_route%/setting/system/system`（admin_setting_system_system）・
  `GET /%eccube_admin_route%/setting/system/system/phpinfo`（admin_setting_system_system_phpinfo）。
- **セレクタ**（既存page.ts再利用・twig由来。旧page.tsコメント中のmessages.yaml行番号は現行コミットと
  約200行ずれているため不採用、本書のnl -ba確認値のみ採用）: §4冒頭に列挙。
- **恒等写像判定**: 動的値6項目（EC-CUBE/サーバーOS/DBサーバー/WEBサーバー/PHP/User Agent）のうち、EC-CUBE・
  サーバーOS・DBサーバー・PHP・WEBサーバーは「値の完全一致」でなく「取得元関数・書式パターンへの適合」で判定する
  （§6.3）。**User Agentのみ**、テスト側でリクエストヘッダを制御できるためE2E内で完全一致判定が可能（C-012）。
  **WEBサーバー（SERVER_SOFTWARE）はテスト側から値を供給できない環境依存値のため、C-012の対象から除外し
  表示欄の存在確認（C-004）までに限定する**（L1-M1106-026・codex R1是正=改訂1）。
- **権限確認**: AuthorityVoterの拒否判定は認証・認可レイヤであり本機能固有のUIではないため、403応答の
  確認はHTTPステータスの直接観測（page.tsのgoto後のresponse.status()相当）で行う。

### §6.2 動的値の恒等写像チェック（三段参照。C-009〜013で使用）

- EC-CUBE行: 表示文字列がee実ソース `Constant::VERSION` の現在値と**文字列完全一致**すること（サーバ側の
  ソース参照はD5でCI環境と揃える。値そのものはSEED化しない）。
- サーバーOS行/DBサーバー行: 表示文字列が空でないこと＋DBサーバー行は接頭辞ルール（§1 L1-010）に沿う正規表現
  `^(SQLite version .+|MySQL .+|.+)$`（実プラットフォームに応じ1パターンのみ真になる想定・要実機で使用DBを確認）
  に一致すること。
- User Agent行: テスト側で送信したUser-Agentヘッダ文字列が**完全一致**で反映されること（C-012。テスト側が
  入力を制御できるためリテラル一致判定が可能）。
- WEBサーバー行: **本候補では値の一致検証を行わない**（L1-M1106-026）。表示欄が`SERVER_SOFTWARE`由来である
  ことはController:44の静的確認とC-004（行構成確認）にとどめ、値そのものはサーバ環境依存として扱う。
- PHP行: `^\S+ \(.*\)$` 相当（バージョン文字列＋空白＋丸括弧内カンマ区切り一覧）の書式一致（C-013）。

### §6.3 実装方針（候補=未実装・実走なし）

- page: 既存 `e2e/pages/admin/m11/m11_06_admin_system_setting_setting_system_system_info.page.ts` を再利用
  （カードタイトル・折りたたみ・値コンテナ連番・PHP情報カード/iframeのセレクタは既に実装済み）。
  ただしコメント中のmessages.yaml行番号（system_info:2796等）は本書のnl -ba確認値（system_info:2996等）と
  ずれるため、page.ts側コメントの是正は別途実装フェーズで行う（本候補はmd/oracle jsonの行番号を正とする）。
- spec: 既存 `e2e/spec/admin/m11/m11_06_admin_system_setting_setting_system_system_info.spec.ts` は未実行雛形
  （旧母集合90行対象）であり本候補の実装ではない。本候補の期待値は `o("L1-M1106-xxx", "m11_06_oracle")` 相当の
  L1解決器経由・リテラル直書き禁止（三段参照ゲートD9）。
- 権限別SEED（店舗オーナー/オペレーター）のログインヘルパは既存 `SEED-M02-ADMIN` 系のログインフロー
  （ログインID/パスワード投入→2FA OFF確認）を流用可能な設計とする。

### §6.4 _drafts/隔離lintの実施証跡（実測・実施済み）

1. 正式消費側（`e2e/helpers/oracle.ts`・`e2e/helpers/db.ts`・spec・pages）に本草案を消費する `_drafts` 参照は
   **0件**（隔離ガード自体のリテラル〔oracle.ts:19〕を除く。ガードは `_drafts`・パス区切り・`..` を含む
   fileKeyの解決をthrowで拒否する機械強制＝消費参照ではない）。
2. 正式パス `e2e/fixtures/oracle/` 直下に本機能のjsonは**作成していない**（草案は `_drafts/` のみ）。
3. 本md・oracle草案json（`e2e/fixtures/oracle/_drafts/m11-06_admin_system_setting_setting_system_system_info_oracle_draft.json`）
   の出力先はともに `_drafts/` 配下のみ（CFP §7出力規約に適合）。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

| ケース群 | 実行区分（候補） | 観測層 | 備考 |
|---|---|---|---|
| C-001,003(-EN),004,005,020,021 | Playwright | GUI | 表示・遷移・要素有無 |
| C-002,006 | Playwright | GUI/HTTP | HTTPステータス+DOM |
| C-007,008 | Playwright・**別環境プロファイル必須** | GUI/HTTP | ECCUBE_PHPINFO_ENABLED=1（§9-2） |
| C-009,010,011,013 | Playwright（恒等写像・書式一致） | GUI | 値そのものはSEED化しない（§6.2） |
| C-012 | Playwright（ヘッダ制御） | GUI | テスト側送信User Agentとの完全一致（WEBサーバー値は対象外=L1-026） |
| C-014 | Playwright+network | GUI+network | 追加リクエスト不在の監視窓 |
| C-015 | Playwright+network | GUI | 応答ヘッダの専用キャッシュ指定不在（限定観測・改訂1） |
| C-016 | Playwright+Cookie／静的grep | GUI/ソース | Cookie値不変（限定）＋静的セッション書込不在（役割分担・改訂1） |
| C-017 | Playwright+db.ts（決定的差分） | GUI+DB | **dtb_authority_role単表**の行数+全列ダイジェスト不変（標準環境限定・観測範囲をこの1表に限定=改訂1） |
| C-018,019 | db.ts／静的確認（非UI） | DB/ソース | スキーマ・実装事実の直接確認（C-019は構造存在の静的確認まで・動的発火は要実機） |
| C-101,102 | Playwright（権限アカウント） | GUI/HTTP | 店舗オーナー/オペレーターの403確認 |
| C-103 | Playwright | GUI | サイドナビ項目の不在確認 |
| C-104,105,106 | Playwright | GUI | 要素不在・文言確認 |

聖域判定・多軸属性の正式付与はD14 v2合格後（本表は暫定・正式会計に使わない）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（§0判定原則。観点ラベル・前提/入力列のシナリオ語はノイズ）。
1候補ケース行=1 assertion bundle・多対一は `shared-observation`・-EN行は対応ja行と同一親のlocale多重。
**参照先の全候補行は§4に実体掲載済み＝61↔候補の期待テキスト突合が本文内で完結する**。

### 集計（61 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **35** | 下表 |
| **TBD** | **1** | 044（DB接続/version取得失敗→アプリ例外処理委譲・観測契約未定義=L1-M1106-022） |
| **excluded** | **25** | EX-A フォーム/相関/DB相関バリデーション不存在10件（008,009,011,012,013,014,015,016,053,055）＋EX-B read-only機能への登録/更新肯定14件（018,020,022,023,025,027,028,030,032,034,035,037,039,040）＋EX-D 設計内矛盾定型1件（054） |
| 合計 | **61** | 欠落0・理由なし重複0 |

- 候補ケース行総数**28**（§4.1 bound対応22＝ja21＋-EN1／§4.2 補完6）。
- **excluded根拠（実引き・偽陰性チェック付き）**:
  - **EX-A（008,009,011,012,013,014,015,016,053,055・10件）**: 期待は「必須／相関／DBとの相関バリデーションで
    エラーが表示され（ず）…」および「画面表示データでエラーが表示されず、対象処理を継続できる」の定型。
    本機能は**フォーム・テキスト入力を持たない**（md:84「本機能はフォームを持たない」・md:196-200
    「利用者入力｜本機能はフォームを持たないため、入力検証はない」・system.twig全文にinput/form/textarea/select
    0件=grep実測・SystemControllerにcreateBuilder/createForm不出現）＝必須/相関/DBとの相関バリデーションという
    観測主語が不存在（constraint不存在型=m02-02/m02-04 EX-Aと同型）。両極性とも過剰生成。偽陰性チェック:
    「フォームを持たない」事実そのものは補完C-104へbound済み。013（PHP情報の表示可否・相関）・014（DB接続/
    version失敗・相関）の実在成分はそれぞれC-006/C-007（phpinfo条件）とTBD 044（DB障害）へ既にbound/TBD済み。
    015（拡張が非常に多い・DB相関）・016（phpinfoを無効にした運用・DB相関）の実在成分はC-013/C-006へ
    既にbound済み（重複計上ではなくEX-A側は「バリデーション」という観測主語自体が不存在なための除外）。
  - **EX-B（018,020,022,023,025,027,028,030,032,034,035,037,039,040・14件）**: 期待は「登録内容/実行結果/
    更新内容の対象レコードが**追加される/値が変更される**こと」の**肯定**定型。設計書DB操作節（md:188-192）
    は`dtb_authority_role`への登録・更新をこの文言どおり主張するが、同一設計書のread-only明記5箇所
    （md:7,15,110,142,159）と矛盾する（DOC-DRAFT-m11-06-1・**未解決**＝§0/§9-1）。実装側は`SystemController.php`
    単体にpersist/flush呼び出しが0件（静的grep範囲）という観測事実があり、この観測範囲内では肯定側
    （「追加される」）の対象が現れない＝過剰生成として除外（「read-onlyが設計として正しい」という断定はしない。
    現行実装のこの経路に登録の痕跡が無いという限定された事実による除外）。**負極性6件（019,024,026,031,036,038
    「追加/変更されない」）はC-017（`dtb_authority_role`単表の行数・全列ダイジェスト不変という限定観測）へ
    bound**＝負極性側を除外しない（偽陰性ゼロ。ただし期待は`dtb_authority_role`という単一表の不変に限定し、
    「いかなるテーブルへの書込も発生しない」という全表を跨ぐ主張はしない＝codex R1 Blocker是正・改訂1）。
  - **EX-D（054・1件）**: 期待「当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）で
    あること」＝設計書DB操作節（md:192）の定型文で、同一設計書のread-only明記5箇所と**設計内で矛盾**
    （DOC-DRAFT-m11-06-1・未解決）。実装観測範囲（`SystemController.php`単体・`dtb_authority_role`単表）では
    「当機能が行う登録・更新」に対応する事実が現れないため検証命題として肯定側を構成できず除外（設計書の
    どちらが誤りかは断定しない＝errata候補として上流へ申し送り）。負成分「不要な削除は含まない」は
    C-017（`dtb_authority_role`の行数不変=削除もない、という同一表内での限定観測）が被覆＝偽陰性なし。
- **極性・ノイズ処理の明示（C4-manual対象=§10）**:
  - **019,024,026,031,036,038（登録/更新の負極性6行）はexcludedにしない=semantic bind（観測範囲を限定して
    再bind＝codex R1 Blocker是正）**: 「対象レコードが追加されない/値が変更されない」はEX-Bと同じIT-26系定型
    だが、本機能で実際に観測可能な対応は「`dtb_authority_role`（設計書DB操作節md:192が名指す唯一の対象表）の
    行数・全列ダイジェストが表示前後で不変」（C-017）という**単表内の限定事実**であり、この観測へbindする
    （「いかなるテーブルへの書込もない」という主張はC-017の観測範囲を超えるため採用しない）。
  - **044のみTBD**: DB接続/version取得失敗は実在仕様（md:130,173,230）だがHTTP/例外型の列挙が設計スコープ外
    （md:38）＋安全な障害誘発手段が標準環境に無い＝オラクル化不能。excludedにしない。

### 61対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 画面本体の先頭カードであること | bound | C-003,C-021(shared同一定義) |
| 002 | eccube_phpinfo_enabledが真のときのみ表示されるカードであること | bound | C-006,C-007 |
| 003 | dtb_authority_roleに保存されログイン中メンバーの権限に紐付くこと | bound | C-018 |
| 004 | 当該HTTP要求のUser-Agentヘッダー値であること | bound | C-012 |
| 005 | 権限により許可される場合システム情報カードに複数行のラベルと値が出ること | bound | C-004 |
| 006 | カード本文の表示領域が折りたたまれたり展開されたりすること | bound | C-005 |
| 007 | iframeが別のGETで取得したHTMLを表示すること | bound | C-008 |
| 008 | 必須バリデーションでエラーが表示され完了しないこと | **excluded** EX-A | — |
| 009 | 必須バリデーションでエラーが表示されず継続できること | **excluded** EX-A | — |
| 010 | 製品が定数として保持するバージョン文字列を表示すること | bound | C-009 |
| 011 | 相関バリデーションでエラーが表示され完了しないこと（サーバーOS） | **excluded** EX-A | — |
| 012 | 相関バリデーションでエラーが表示されず継続できること（DBサーバー） | **excluded** EX-A | — |
| 013 | 相関バリデーションでエラーが表示されず継続できること（PHP情報の表示可否） | **excluded** EX-A | —（実在成分はC-006/C-007） |
| 014 | 相関バリデーションでエラーが表示され完了しないこと（DB接続/version失敗） | **excluded** EX-A | —（実在成分はTBD 044） |
| 015 | DBとの相関バリデーションでエラーが表示されず継続できること（拡張多数） | **excluded** EX-A | —（実在成分はC-013） |
| 016 | DBとの相関バリデーションでエラーが表示され完了しないこと（phpinfo無効運用） | **excluded** EX-A | —（実在成分はC-006） |
| 017 | 各行の値はその要求処理中に取得したスナップショットであること | bound | C-014 |
| 018 | 登録内容の対象レコードが追加されること（DBバージョンと接続） | **excluded** EX-B | —（実在成分はC-011） |
| 019 | 追加され**ない**こと（永続化） | bound | C-017（dtb_authority_role不変・単表限定） |
| 020 | 追加されること（DB更新） | **excluded** EX-B | —（実在成分はC-017） |
| 021 | 本機能の表示結果を専用にキャッシュしないこと（キャッシュ） | bound | C-015 |
| 022 | 追加されること（セッション） | **excluded** EX-B | —（実在成分はC-016） |
| 023 | 追加されること（成功時出力） | **excluded** EX-B | —（実在成分はC-002） |
| 024 | 追加され**ない**こと（失敗時出力） | bound | C-017（dtb_authority_role不変・単表限定。実在の失敗系はTBD 044/C-001） |
| 025 | 追加されること（登録/更新） | **excluded** EX-B | —（DOC-DRAFT-m11-06-1・未解決・実在成分はC-017/054のEX-D注記） |
| 026 | 追加され**ない**こと（利用者入力） | bound | C-017（dtb_authority_role不変・単表限定。フォーム不存在自体は補完C-104） |
| 027 | 追加されること（拒否URLパターン） | **excluded** EX-B | —（実在成分はC-019） |
| 028 | 追加されること（実行結果・未認証） | **excluded** EX-B | —（実在成分はC-001） |
| 029 | メンバー権限に応じてサイドナビを生成しdeny項目は表示されない場合があること | bound | C-020,C-103(shared) |
| 030 | 変更されること（メニューからシステム情報を選ぶ） | **excluded** EX-B | —（実在成分はC-021） |
| 031 | 変更され**ない**こと（システム情報カード） | bound | C-017 |
| 032 | 変更されること（PHP情報カード） | **excluded** EX-B | —（実在成分はC-006/C-007） |
| 033 | dtb_authority_roleに保存されログイン中メンバーの権限に紐付くこと（更新内容・003と同文） | bound | C-018(shared) |
| 034 | 変更されること（User Agent） | **excluded** EX-B | —（実在成分はC-012） |
| 035 | 変更されること（システム設定メニューからシステム情報を開く・最大長） | **excluded** EX-B | —（実在成分はC-021） |
| 036 | 変更され**ない**こと（角度アイコン押下・最大長+1） | bound | C-017 |
| 037 | 変更されること（PHP情報が有効な環境で画面を開く・最小長） | **excluded** EX-B | —（実在成分はC-007/C-008） |
| 038 | 変更され**ない**こと（表示要素・最小長-1） | bound | C-017（実在成分は補完C-106） |
| 039 | 変更されること（モーダル・ポップアップ） | **excluded** EX-B | —（実在成分は補完C-105） |
| 040 | 変更されること（実行結果・EC-CUBE） | **excluded** EX-B | —（実在成分はC-009） |
| 041 | php_uname()の戻り値をそのまま表示すること | bound | C-010 |
| 042 | SQLiteの場合は接頭辞「SQLite version 」にsqlite_version()の結果を連結すること | bound | C-011 |
| 043 | 設定パラメータeccube_phpinfo_enabledが真のときのみPHP情報カードとiframeを出力すること | bound | C-006,C-007(shared) |
| 044 | アプリケーションの例外処理に委ねるであること（DB接続/version失敗） | **TBD**（L1-M1106-022） | —（HTTP/例外列挙が設計スコープ外md:38・安全な誘発手段なし） |
| 045 | PHP行は長大な一行文字列となり得るであること | bound | C-013 |
| 046 | システム情報カードのみ表示しPHP情報カードはDOM上も出さないこと | bound | C-006 |
| 047 | 表示はDoctrineの既定接続に対する問い合わせ結果であること | bound | C-011(shared) |
| 048 | 本機能は表示のみでシステム情報の内容をDBに書き戻さないこと | bound | C-017(shared) |
| 049 | 行わないこと（DB更新） | bound | C-017(shared) |
| 050 | 本機能の表示結果を専用にキャッシュしないこと（重複=021と同文） | bound | C-015(shared) |
| 051 | 本機能のコントローラがセッションを更新する処理は持たないこと | bound | C-016 |
| 052 | システム情報は管理画面共通レイアウトのHTMLであること | bound | C-002 |
| 053 | 画面表示データでエラーが表示されず継続できること（失敗時出力） | **excluded** EX-A | —（実在成分はTBD 044/C-001） |
| 054 | 当機能が行う登録・更新で対象テーブルを直接保存すること | **excluded** EX-D | —（設計内矛盾の定型文=errata候補・DOC-DRAFT-m11-06-1。負成分はC-017被覆） |
| 055 | 画面表示データでエラーが表示されず継続できること（利用者入力） | **excluded** EX-A | —（実在成分は補完C-104） |
| 056 | 保存値が正規表現として解釈できない場合は例外を捕まえ完全一致エスケープの先頭一致検査にフォールバックする実装があること | bound | C-019 |
| 057 | 管理領域の要件に従い利用不可であること（未認証） | bound | C-001 |
| 058 | メンバー権限に応じてサイドナビを生成しdeny項目は表示されない場合があること（重複=029と同文） | bound | C-020,C-103(shared) |
| 059 | 同一画面としてシステム情報を表示であること | bound | C-021(shared) |
| 060 | 画面本体の先頭カードであること（重複=001と同文） | bound | C-003(shared) |
| 061 | eccube_phpinfo_enabledが真のときのみ表示されるカードであること（重複=002と同文） | bound | C-006(shared) |

`func_scope_check` 判定: 親61/61会計済み（bound35＋TBD1＋excluded25=61・差分0）・欠落0・理由なし重複0・
補完6行（C-101〜C-106）は§4.2に実体掲載（親空・設計書補完md:71,104,211,212,84,196-200,81,83,80・母集合会計外）→
**差分0を本文内で実証可能**。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

| # | 事項 | 状態 |
|---|---|---|
| 1 | **DOC-DRAFT-m11-06-1（DB操作節とread-only明記5箇所の設計内矛盾・未解決・codex R1是正=改訂1）** | md:188-192のDB操作節「登録/更新｜dtb_authority_role｜…persist/flushによる即時反映」は、同設計書のread-only明記5箇所（md:7,15,110,142,159）と**矛盾する**。**本候補はどちらが設計として正しいかを断定しない**（実装挙動を設計の正にしない・片側を誤記と断定しない＝テストケースが正の原則）。実装観測事実として`SystemController.php`単体（静的grep範囲）にpersist/flush/INSERT/UPDATE呼び出しが0件、かつ`dtb_authority_role`テーブルの行数・全列ダイジェストが表示前後でC-017により不変であることは確認できるが、これは「当該コントローラ経由の書込呼び出しがない」という限定範囲の事実にとどまり、依存先を含む全経路の無書込証明でも「read-onlyが設計として正しい」ことの証明でもない。dtb_authority_roleの実登録・更新は権限設定画面（別機能・md:15でスコープ外と明記）が担う。矛盾は**未解決のまま上流（設計書保守）へ申し送る**。IT-26/IT-05系肯定14行のexcluded根拠（§8 EX-B＝この限定観測範囲に肯定側の対象が現れないため）。期待値を「登録される」側に捏造せず「read-onlyが正しい」とも断定しない |
| 2 | **要環境プロファイル（C-007,C-008）** | `eccube_phpinfo_enabled`の真側検証はDB SEEDでなくコンテナ環境変数`ECCUBE_PHPINFO_ENABLED=1`の切替を要する。標準の共有DB/共有env（既定'0'）では実行不可＝別環境プロファイルの起動が前提。EA08SysteminfoCest.php（codeception既存資産）も`if ($config['eccube_phpinfo_enabled'] == 1)`で条件分岐しており同じ制約を持つ（実測確認済みの既存パターン） |
| 3 | **SEED-M1106-TENANT-OWNER/OPERATORの前提** | 初期データの`dtb_authority_role` id=20（authority_id=4）・id=21（authority_id=5）が`/setting/system/system`のdeny_urlを持つことに依存（dtb_authority_role.csv:20-21で確認済み）。標準環境の初期データが変更されていないことが実行前提（変更されていた場合は本候補のC-101/C-102/C-103が前提不成立でskip） |
| 4 | 動的値のサーバ側検証（サーバーOS行・DBサーバー行） | C-010/C-011は「空でない文字列であること」＋「書式パターン一致」までをE2E側で確認する。`php_uname()`/`getDbversion()`の戻り値そのものとサーバ側の実行結果との一致は、テスト実行環境とサーバ環境が同一プロセス空間にない前提ではE2E単独で完全確認できない＝D5でサーバ側検証（CI環境のphp_uname等をログ取得し突合）を併用する運用を推奨（要実機） |
| 5 | C-015（応答ヘッダの専用キャッシュ指定不在）の観測限界（改訂1で期待を縮小） | 「専用にキャッシュしない」は否定claimであり、Cache-Control等の応答ヘッダに本機能固有の指定が無いことの確認に限定する（フレームワーク共通のno-cache系ヘッダ設定はスコープ外）。**「専用キャッシュ機構を持たない/毎回再構築される」という積極断定はC-015のE2E観測だけでは行わず**、ソース側grep（cache関連API不出現=grep実測）による静的補完と役割分担する |
| 6 | C-013（PHP行の長大化） | 「拡張が非常に多い」場合の実機観測は稼働環境の`get_loaded_extensions()`件数に依存し、標準テスト環境で意図的に多数の拡張をロードさせる手段は本候補では設計しない（書式パターン一致の確認のみで足りるとし、長さそのものの閾値検証は行わない） |
| 7 | manifest_sha1（fixture_version確定） | D5後（現状 `@TBD-D5`。SEED-M1106系SQL/パスワードハッシュ生成は未実装=§2は設計） |
| 8 | **L1-M1106-018/C-019の動的発火は要実機（改訂1で追加）** | `AuthorityVoter`のtry/catch+preg_quoteフォールバック構造はソース上に確認できる（静的事実）が、不正な正規表現の拒否URLを実際にDBへ投入して例外送出→フォールバック分岐の実行→アクセス拒否結果、まで一連の動的再現は本候補では行わない（安全な不正パターン投入手順の設計・後始末を含め要実機で別途検討） |
| 9 | **WEBサーバー行（SERVER_SOFTWARE）の値検証は範囲外（改訂1で追加）** | L1-M1106-026。テスト実行環境のWebサーバー/PHPプロセス設定に依存しPlaywrightから制御できないため、値の一致検証はE2Eの範囲外とする。表示欄の存在自体はC-004（行構成確認）で担保 |
| 10 | **C-016のセッション書込なし主張の分離（改訂1で追加）** | セッションCookie値が表示前後で不変であることと、同一セッション内のサーバ側ストアが更新されないことは別命題（同一Cookie値のままキー更新は可能）。「セッションキーが書き込まれない」という結論はC-016単独のE2E観測では導出せず、静的grep（SystemController.phpにsession操作0件）と役割分担する |
| TBD | 044（L1-M1106-022） | DB接続/version取得失敗→共通例外委譲・専用メッセージなし（md:130,173,230）。HTTPステータス/例外型の列挙は設計スコープ外（md:38）で観測契約が定義不能＋安全な障害誘発手段なし＝未確定オラクル台帳へ（excludedにしない） |

候補規律: 全行 `@TBD-D5`・O5未確定（D6後に確定検査）・実装/実走なし・O6/聖域/多軸/C6C7を主張しない。
既知バグ: 実装側BC-DRAFTは**0件**（本機能はread-only表示に限定され、m02-04のような検索条件セッションの
受け側消費といったクロスフィーチャー処理を持たないためBC-DRAFT対象の処理経路が存在しない）。
設計書側DOC-DRAFTは**1件**（DB操作節とread-only明記5箇所の設計内矛盾・**未解決**）。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象構文（肯定/否定・許可/拒否の対）を列挙し、claim単位で期待テキストとの極性一致を目視確認した:

| 極性対 | 該当行 | 判定 |
|---|---|---|
| 追加され**る**/され**ない** | 018,020,022,023,025,027,028（肯定）vs 019,024,026（否定） | 肯定=EX-B（`SystemController.php`単体の静的grep範囲にpersist/flush経路が現れない＝この限定観測範囲では成立不能。DOC-DRAFT-m11-06-1は未解決のまま）・否定=C-017（`dtb_authority_role`単表の行数+全列ダイジェスト不変・観測範囲をこの1表に限定＝改訂1）へbound。**肯定側をboundにする取り違えなし** |
| 変更され**る**/され**ない** | 030,032,034,035,037,039,040（肯定）vs 031,036,038（否定） | 肯定=EX-B（UPDATE経路なし）・否定=C-017。整合 |
| エラー表示され/表示され**ず** | 008,011,014（拒否側）vs 009,012,013,015,016,053,055（継続側） | バリデーション系はフォーム不存在で**両極性とも**EX-A（片極性のみ除外する誤りなし）。013/015/016は実在成分をC-006/C-007/C-013へ、014の実在成分はTBD 044へ、053/055の実在成分はTBD 044・C-001・補完C-104へそれぞれ回付済み（除外理由と実在成分の宛先を分離して記録） |
| 表示する/表示し**ない**（PHP情報カード） | 002,043,061（真→表示）vs 046（偽→非表示） | 真側→C-006/C-007（要環境プロファイル注記付き）・偽側→C-006（既定env・直接実行可）。002/043/061をC-006へ集約し046はC-006の否定側観測として同一ケース内で確認（1機構の両面を1candidateに丸めても偽オラクルにならない＝条件分岐が単純if/elseのため。m02-04のような2導線非対称の丸め込み危険とは前提が異なる） |
| 拒否する/し**ない**（権限） | 003,033（権限別拒否URLの保存事実）・057（未認証は利用不可） vs 020(=補完C-103・deny_urlなし側は許可) | 保存事実側→C-018（非UI・DBスキーマ）・未認証側→C-001・許可側（対照）→補完C-103。403そのものの直接観測は母集合の期待テキストに存在しないため**補完C-101/C-102**で追加（偽陰性回避。設計md:71,211の実在claimを候補化） |
| 数える/数え**ない**・集計 | （該当なし） | 本機能は集計を持たない（md:110）ため該当構文なし。IT-26/IT-23の「登録内容/実行結果の対象レコード」定型はいずれも集計でなく登録・更新の有無を問う定型であり上記「追加/変更される」対で処理済み |
| 呼び出す/呼び出さ**ない**・持た**ない** | 021,050（キャッシュしない）・051（セッション更新処理を持たない）・039(=補完C-105でモーダル/JS持たない) | すべて否定claim。観測契約を有限に限定して構成（C-015=応答ヘッダの専用キャッシュ指定不在＋grep静的補完・C-016=セッションCookie不変〔限定〕＋静的grepでセッション書込0件を分離併記・補完C-105=要素0件+script不在）。肯定側の母集合行なし=対不成立の単極。極性反転なし |
| 同一画面である/別画面でない | 059 | 「同一画面としてシステム情報を表示」を「専用の別画面へ遷移しない」の否定形に反転させない（設計文どおり同一画面表示の確認としてC-021を構成） |

- カード見出しの用語対応（用語表md:57「システム情報カード」と画面文言trans key `admin.setting.system.system_info`
  「システム情報」）に呼称差はない（L1-003で確認）。
- 動的値の恒等写像は「値そのものをオラクルの正にしない」という本タスクの前提指示を、EC-CUBE/サーバーOS/
  DBサーバー/WEBサーバー/PHP行の5項目全てに一貫適用した（憶測でリテラル値を書かない・関数呼び出し規約と書式
  のみを期待の正とする）。**User Agentのみ**テスト側が入力（送信ヘッダ）を制御できるため完全一致判定が可能で
  あり、**WEBサーバー（SERVER_SOFTWARE）はテスト側が値を制御できない環境依存値のためL1-M1106-026として
  分離し値の一致検証をE2Eの範囲外とした**（codex R1是正・改訂1）。この非対称性は実装の恒等写像実装
  （パススルー）に起因し矛盾ではない。
- codex敵対レビュー: **R1=要修正（Blocker1＋Major5＋Minor2）→改訂1で是正・R2再確認待ち**（詳細は本書冒頭）。

---

## 付録: 作業実測（B0係数計測用）

- 読んだ一次資料・参照物: 設計書md 1（268行全文）／ee実ソース・設定 15超（SystemController・SystemService・
  system.twig全文・default_frame.twig抜粋・AuthorityVoter・IsAccessibleRouteExtension・AuthorityRole・
  TwigInitializeListener（setAdminGlobals/getDisplayEccubeNav）・eccube_nav.yaml・mtb_authority.csv・
  dtb_authority_role.csv・security.yaml・eccube.yaml・Constant.php）／locale 2（messages ja/en該当帯）／
  母集合・fid_kubun 2／統治・見本 2（CFP・m02-04/m02-02草案）／既存資産 3（旧e2e_cases.md・page.ts・spec.ts）／
  既存codeception資産 1（EA08SysteminfoCest.php・phpinfo_enabled条件分岐パターンの参考）。
- L1 claim数: **25確定＋1 TBD**（=26行。改訂1でL1-M1106-026新設）。候補ケース行28（ja26・-EN1・実質bound対応21+EN1、補完6）。
- 本機能特有の難所: (1) **動的値の恒等写像化**: EC-CUBE/php_uname/DBバージョン/PHP拡張一覧は環境・実行時
  依存でありSEED固定値化すると捏造になるため、期待を「取得元関数＋書式」まで分解し値そのものは検査対象外とした
  (2) **IT-26/IT-22系の過剰生成が母集合の67%（41/61）**: フォームを持たない・登録更新を持たない機能への
  定型過剰生成をEX-A/EX-B/EX-Dへ仕分け、かつ負極性（追加/変更されない）は`dtb_authority_role`単表への
  観測範囲限定（DOC-DRAFT-m11-06-1は未解決のまま）を経てC-017へbind（m02-04/m02-02の先例パターンを踏襲しつつ
  codex R1 Blocker是正で観測範囲を1表に限定） (3) **権限拒否の母集合被覆漏れ**: 設計書は店舗オーナー/
  オペレーターの403（md:71,211）とナビ非表示（md:212）を明記するが、母集合61行にはHTTP403そのものを問う
  期待テキストが存在しない（003/033はdtb_authority_role保存事実のみ、029/058はナビ生成メカニズムのみ）ため
  補完C-101/C-102/C-103で偽陰性を回避した (4) **既存page.ts/旧e2e_cases.mdの行番号ドリフト**: 旧資産の
  messages.yaml行番号が現行ee commitと約200行ずれており、本書は独自にnl -ba再照合した値のみを採用した。

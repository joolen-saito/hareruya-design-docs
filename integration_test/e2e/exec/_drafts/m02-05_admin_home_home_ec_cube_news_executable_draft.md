# B0候補: m02-05 管理画面_EC-CUBEお知らせ — 実行可能グレード候補（母集合35全量踏破）

> 2026-07-23 ／ **候補グレード（candidate・D6前・O5未確定・実装/実走なし）**
> codex敵対レビュー: **R1=要修正（Major1のみ）→改訂1で是正・R2再確認待ち**
> （iframe裁定・EX-A(6)/EX-B(2)・捏造ゼロ・外部契約の要実機分離はcodex妥当確認済み。
> 台帳 `REVIEW_LEDGER.md` への記帳は判定確定後）。
> **改訂1（codex R1是正・Major1件）**: 旧版は -003/-024/-031（iframe内の閲覧・操作/内部ナビ・新規タブ）を
> 全面excluded（EX-C委譲文）としたが、C-011/C-013は**iframe内操作に対する親側の非反応を観測していない**＝
> アプリ側で観測可能な実在成分（md:67後段/97/190「サーバ側はiframe内操作を解釈しない・セッション独立」）の
> 部分被覆でのexcludedは偽陰性禁止に抵触（codex正）→ 各test_idを**2成分に分離**:
> (1) 外部内容・遷移結果そのものに従う部分＝**EX-C成分維持（非オラクル化・オラクル外）**
> (2) アプリ側不作為成分＝**L1-M0205-016新設＋C-016（分離bind行）**: iframe内操作（内部ナビ・新規タブ・
> スクロール）をスタブ供給で決定的に発生させ、親が (i)遷移しない（親URL・カードDOM不変）
> (ii)管理画面オリジンへサーバリクエストを発しない (iii)状態変更しない（Cookie/DB不変）を観測。
> → -003/-024/-031は**bound（成分分離）**へ会計変更（excluded 11→8）。§1/§2/§4/§8/§9/§10/oracle json同期。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> fixture_version は全て `@TBD-D5`。統治: `integration_test/CONCRETIZATION_FIRST_PLAN.md`（三段会計）＋
> `integration_test/CONCRETIZATION_ROLLOUT_PLAN.md`（B0）。
> 正典: `integration_test/e2e/PILOT_m09_01_news_executable_grade.md`／同型見本: codex承認済み候補10本
> （m09-01・m05-16・m10-11・m03-11・m01-01・m01-02・m02-01・m02-02・m02-03・m02-04 の各
> `_drafts/*_executable_draft.md`。特に m02-04〔同一ホーム画面・read-onlyカード・EX-A/EX-B仕分け〕と同型）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m02-05_admin_home_home_ec_cube_news_oracle_draft.json`。
> 正式パス `e2e/fixtures/oracle/` 直下には書かない。
> **行数集計**: 候補ケース行総数**17**＝bound対応15（ja14＋-EN1）＋補完2（ja2）。
> 母集合35=bound27（うち3行=成分分離bind）＋TBD0＋excluded8。
> **不具合候補/設計書矛盾候補**: **0件**（BC-DRAFTなし・DOC-DRAFTなし。設計md⇔ee実装の突合で乖離・設計内矛盾を
> 検出せず。本機能はサーバ側処理を持たないtwig単独カードのため突合面自体が小さい＝§9-12に検出範囲の限定を記録）。
> **★外部連携の要点（本機能の性格）**: お知らせ本文は**外部URL（`eccube_info_url`）の応答**であり、サーバは
> 取得・整形を一切しない（**ブラウザがiframeでGET**する）。外部応答の**内容**は期待値の正にしない（オラクル外）。
> 本候補がL1化するのは**アプリ側の描画契約**（src出力・カード構成・空URL時のsrc=""・失敗時にサーバが
> フォールバック文言を補わない）と**iframe内操作に対する親側の非反応**（L1-016・改訂1）のみで、
> 外部応答そのもの・ブラウザのブロック/エラー描画は要実機/外部スタブ（route interception）へ
> 分離する（§9に独立集計）。

## §0 版固定

- 設計書正本: `functions/ec-cube-enterprise/m02-05_admin_home_home_ec_cube_news.md`（本repo HEAD
  `d1e94c5e38246d0eff45b4079ee42397c994e69d` 時点・全244行。以下「md:行」）。
- ee実ソース: `/home/y-saito/Developments/ec-cube-enterprise/` コミット
  `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51`（W0-B0既候補と同一）。
- fid_kubun.tsv（D1・sha256先頭 `44fbf02f1e4c`）:
  `M02-05｜m02-05_admin_home_home_ec_cube_news｜EC-CUBEのお知らせ｜対象｜標準｜ec-cube-enterprise/m02-05_admin_home_home_ec_cube_news.md｜standard-src+design｜0`（fid_kubun.tsv:167）→ **標準＝ee実ソース直接可＋設計書md**（暫定付与・確定はD6）。
- 母集合: baseline `integration_test/all_it_cases.tsv`（sha256先頭 `7911f190d273`）M02-05全**35行**
  （IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-001〜035。以下「-nnn」）。
- カスタマイズ区分=**標準**（md:17「挙動・画面とも移行先のec-cube-enterpriseの実装を正とする。本カードは
  サイト内DBを読み書きせず、設定値`eccube_info_url`の参照のみで成立するため、DB関連の正典指定は対象としない」）。
- **判定原則（W0-W2教訓）**: 観点ラベル・前提条件/入力データ列のシナリオ語は**生成器ノイズ**。bindは各行の
  **「期待結果／レスポンス」実テキスト**で判定し、極性も期待テキストで確認する（§8に全35行の期待要旨併記）。
  例: -008の観点ラベルは「必須バリデーション」・前提は「外部サイトが iframe 埋め込みを拒否する」だが、期待
  テキストは「必須バリデーションでエラーが表示され…」の定型＝フォーム不存在の本機能では観測主語なし→EX-A。
  埋め込み拒否の実在挙動は-034（期待テキストが埋め込み拒否）が担う。
- 既存実行実績（参考・本候補の会計外）: `integration_test/e2e/m02_05_admin_home_home_ec_cube_news_e2e_cases.md`
  （2026-07-06 Codex実走 **7〇/3×**。×=Cookie差分切り分け・CSS数値目視・外部失敗再現の手動/ハーネス未実装＝
  実装乖離の検出ではない。本候補は×側のうちCookie差分をcontext.cookies()契約で、外部失敗を
  **Playwright route interception（設定変更不要の決定的注入）**で実行可能グレードへ引き上げる。空URL・TLSは
  引き続き実行保留=§9）。
- 既存道具（実装済み・再利用）: `e2e/helpers/db.ts`（psql照会）・`e2e/helpers/oracle.ts`（L1解決器＋_drafts
  隔離ガード）・`e2e/pages/admin/m02/m02_05_admin_home_home_ec_cube_news.page.ts`（#ec-cube-news・
  .card-title・.card-body・.card-footer・iframe[name="information"] のセレクタ実装済み・2026-07-06実走7〇で
  実機実績）。SEED実体のうちINFOURL系は**環境契約**（§2。SQLでは作れない）。
- 主要一次資料の略記:
  - Controller = `src/Eccube/Controller/Admin/AdminController.php`（ホーム=index()。**本カード専用の処理は不存在**）
  - twig = `src/Eccube/Resource/template/admin/index.twig`（お知らせカード=304-314）
  - eccube.yaml = `app/config/eccube/packages/eccube.yaml`（eccube_info_url:165・eccube_admin_route:69・
    env既定:3）
  - security.yaml = `app/config/eccube/packages/security.yaml`／EccubeExtension = `src/Eccube/DependencyInjection/EccubeExtension.php`
  - ja/en = `src/Eccube/Resource/locale/messages.{ja,en}.yaml`
- **実装確認サマリ（本カードの実体はtwig 11行のみ）**: index.twig:304-314 が本カードの全実装。サーバ側
  （Controller index:102-205）はお知らせカード用の変数・問い合わせ・外部HTTP呼び出しを**一切持たない**
  （EventArgs/return配列にお知らせ系キー不出現・`eccube_info_url|Guzzle|HttpClient|file_get_contents|curl` の
  grepはController内0件=実測）。よって「外部お知らせ取得ロジック」はサーバに存在せず、**取得主体はブラウザ**
  （iframeのsrcへのGET）である。設計md:7「お知らせ本文の取得・整形・一覧化はアプリケーションのサーバ側では
  行わず、埋め込み先の応答に依存する」と実装一致（BC-DRAFTなし）。

## §1 L1原子オラクル表

全16行=**16claim確定・TBD0**（L1-016は改訂1新設）。本機能はフォーム・入力・保存・DB参照を持たない参照専用iframeカードのため
文字数系・集計系unitなし。LS=locale_sensitive（0は理由コード）。en文言はen一次資料逐語（ja翻訳ゼロ）。
**期待値の正は本表のオラクルID**（環境の設定値・スタブ応答は入力再現手段/観測値＝三段参照）。
`%eccube_admin_route%` は環境値（既定 `admin`＝env ECCUBE_ADMIN_ROUTE・eccube.yaml:3,69）。
`eccube_info_url` の**実効値は環境値**（パッケージ既定 `https://www.ec-cube.net/info/4/`=eccube.yaml:165・
環境別設定で上書き可=md:25。実環境値はD5確認=§9-7）。

| oracle_id | 観点 | claim | 逐語quote | 根拠(file:line) | LS |
|---|---|---|---|---|---|
| L1-M0205-001 | auth_rule | 未認証の `GET /%eccube_admin_route%/` は admin firewall（`^/%eccube_admin_route%/`=ROLE_ADMIN必須）の form_login により admin_login のログイン画面へ誘導され、ホーム（お知らせカード #ec-cube-news）へ到達しない | `admin:`＋`    pattern: ['^/%eccube_admin_route%/','^/%eccube_messenger_route%/']`＋`    provider: member_provider`＋`    form_login:`…`        login_path: admin_login`／`['path' => '^/%eccube_admin_route%/', 'roles' => 'ROLE_ADMIN'],`／「非管理者・未認証｜`GET /%eccube_admin_route%/` 等の管理側 URL（到達前にログインへ）｜ホーム画面自体に到達できないため、本カードも利用できない」「未認証｜利用不可。管理領域の認証要件に従いログイン等へ誘導される」 | security.yaml:40-46／EccubeExtension.php:84／md:68,175 | 0 `non-translated` |
| L1-M0205-002 | http_status | ホーム=`GET /%eccube_admin_route%/`（route `admin_homepage`・GETのみ）。認証済み管理者にHTTP200でダッシュボードを表示し、お知らせカードはその一部ブロック（本カード専用のURL・クエリパラメータなし） | `#[Route(path: '/%eccube_admin_route%/', name: 'admin_homepage', methods: ['GET'])]`＋`#[Template(template: '@admin/index.twig')]`／「ホーム画面を開く｜`GET /%eccube_admin_route%/`｜EC-CUBEお知らせカードが表示され、情報iframe が設定された URL を読み込み開始する」「入力｜ホーム画面の GET 表示要求。本カード専用のクエリパラメータやフォーム入力はない」 | Controller:102-104／md:66,147 | 0 `non-ui-observable` |
| L1-M0205-003 | display_field | カードDOM一式: `#ec-cube-news`（`card rounded border-0 h-100`）内に、card-header内の見出し `.card-title`＝`admin.home.news_title` ja「お知らせ」/en "What's New"、card-body（**`p-0`=余白なし**）内に**情報iframe `iframe[name="information"]`**（`class="link_list_wrap"`・`style="width:100%; border:0; min-height:390px;"`＝横幅いっぱい・枠線なし・最小高さピクセル指定）、card-footer＝`style="height:43px;box-sizing: border-box;"` の**固定高さ空領域**。カード内に form/input/textarea/select/button/script/modal 要素0件（twig:304-314 grep実測） | `<div id="ec-cube-news" class="card rounded border-0 h-100">`／`<span class="card-title">{{ 'admin.home.news_title'\|trans }}</span>`／`<div class="card-body p-0">`／`<iframe name="information" class="link_list_wrap" src="{{ eccube_config.eccube_info_url }}" style="width:100%; border:0; min-height:390px;"></iframe>`／`<div class="card-footer" style="height:43px;box-sizing: border-box;"></div>`／`admin.home.news_title: お知らせ`／`admin.home.news_title: What's New`／「カード見出しは翻訳キーに基づくタイトル。カード本体は余白なし（`p-0`）で情報iframe を敷き詰める。フッタは固定高さの空領域として描画される」「情報iframe は横幅いっぱい、枠線なし、最小高さがピクセル指定される」 | twig:304,307,310,311,313／ja:1891／en:1869／md:56,57,76,78 | 1 |
| L1-M0205-004 | config_source | `eccube_info_url` はアプリケーション設定に保持される**文字列**。パッケージ同梱の eccube.yaml で既定 `https://www.ec-cube.net/info/4/` が宣言され、環境別設定でこの宣言は置き換えられる（**実効値は環境値=D5確認**。DB列ではない=SQL SEEDで変更不能） | `eccube_info_url: 'https://www.ec-cube.net/info/4/'`／「eccube_info_url｜アプリケーション設定に保持される文字列。Twig から参照され iframe の `src` にそのまま出力される」「パッケージ同梱の `eccube.yaml` において `eccube_info_url` の既定として `https://www.ec-cube.net/info/4/` が宣言されていること（環境別設定でこの宣言は置き換えられる）」 | eccube.yaml:165／md:58,25 | 0 `non-translated` |
| L1-M0205-005 | passthrough | twigは `eccube_config.eccube_info_url` の値を**形式検証・スキーム/ホスト妥当性検証・許可リスト制限なし**で情報iframeの `src` 属性値としてそのまま出力する（DOM上 `getAttribute('src')` === 設定文字列。twig自動エスケープはHTMLソース上の属性エスケープのみで値は変わらない=`&`を含むURLはソース上`&amp;`・DOM値は原文） | `src="{{ eccube_config.eccube_info_url }}"`／「テンプレートは設定から `eccube_info_url` を読み取り、その文字列を情報iframe の `src` 属性値として出力する」「`eccube_info_url` が運用設定で別 URL に差し替えられる｜iframe は設定された文字列をそのまま `src` に使う。スキームやホストの妥当性検証、許可リストによる制限は本カードの Twig では行わない」「`eccube_info_url`｜本カードの Twig は値の形式検証を行わず、そのまま `src` に出力する」 | twig:311／md:90,116,167 | 0 `non-translated` |
| L1-M0205-006 | no_server_fetch | サーバはお知らせ本文の取得・整形・一覧化を行わない: index()にお知らせカード用のテンプレート変数・DB問い合わせ・外部HTTP呼び出しが**不存在**（EventArgs/return配列にお知らせ系キーなし・`eccube_info_url`/Guzzle/HttpClient/file_get_contents/curl のController内grep 0件=実測）。外部URLへのGETは**ブラウザがiframeのsrcに対して行う**（専用API・Ajax・バッチなし。同twigのsale_chart用scriptブロック=twig:16-103は売上グラフ別機能で本カードを操作しない） | 「お知らせ本文の取得・整形・一覧化はアプリケーションのサーバ側では行わず、埋め込み先の応答に依存する」「サーバはホーム画面用テンプレートをレンダリングする。お知らせカード用に追加の問い合わせ結果や専用の配列変数を渡さない」「API｜本カードはお知らせ取得のための専用 API を呼び出さない。ブラウザが iframe の `src` に対して HTTP GET を行う」「バッチ｜本カードはバッチを起動しない」 | md:7,89,137,138／Controller:102-205（grep 0件）／twig:16-103,304-314 | 0 `non-ui-observable` |
| L1-M0205-007 | empty_rule | `eccube_info_url` が空文字になる運用設定では iframe の `src` が**空**になり（`src=""` 出力）、ブラウザは空の文書を読み込む。**本カードはエラー文言を補わない**（twigに空判定分岐なし=304-314に `{% if %}` 不出現） | 「`eccube_info_url` が空文字になる運用設定｜iframe の `src` が空になり、ブラウザは空の文書を読み込む。本カードはエラー文言を補わない」／`src="{{ eccube_config.eccube_info_url }}"`（分岐なし直埋め） | md:115／twig:311,304-314 | 0 `non-translated` |
| L1-M0205-008 | ext_failure_no_fallback | 情報iframeの読み込み失敗・埋め込み拒否・ネットワーク不通・TLS証明書エラーのいずれでも、**サーバ側は検知せず・リトライせず・代替HTML/専用フォールバック文言を出さない**（カードDOM構成は通常時と同一=L1-003のまま）。失敗の表示はブラウザ（TLSはインタースティシャル）に委ねる（**ブラウザ側の描画自体は本claimの検証対象外**） | 「外部サイトが iframe 埋め込みを拒否する｜…サーバ側では検知・代替 HTML は出さない」「ネットワーク不通・タイムアウト｜ブラウザのエラー表示に委ねる。サーバ側ではリトライしない」「情報iframe の読み込み失敗・拒否｜ブラウザの表示に委ねる。サーバは検知しない」「TLS 証明書エラー等｜ブラウザのインタースティシャルに委ねる」「失敗時出力｜…iframe の読み込み失敗はブラウザ側の表示に委ね、本カード専用のサーバ側フォールバック文言は設けない」「失敗時｜…iframe 向け GET の失敗・拒否はブラウザの表示に委ねる」 | md:117,118,199,200,149,139／twig:304-314（成否分岐要素なし） | 0 `non-translated` |
| L1-M0205-009 | browser_embed_block | 外部サイトがiframe埋め込みを拒否する（X-Frame-Options等）場合、**ブラウザがコンテンツを表示しない、またはエラー表示にする**＝ブラウザ/外部層の挙動claim（アプリ実装の外。観測はXFO付きスタブ応答の注入＋フレームのブロック状態検出=判定契約は要実機・§9-4） | 「外部サイトが iframe 埋め込みを拒否する｜ブラウザがコンテンツを表示しない、またはエラー表示にする」／（スコープ外宣言:「…クリックジャッキング対策（`X-Frame-Options` 等）により iframe が拒否または空白になる場合の詳細」） | md:117,37 | 0 `non-translated` |
| L1-M0205-010 | no_auto_refresh | ホームを開いたまま時間が経過しても情報iframe内のコンテンツは**アプリ側からは自動更新されない**（本カード専用JSなし・ポーリング/Ajaxなし・iframeのsrc属性不変・アプリ起因の再読み込み要求なし）。最新表示にはページ全体の再読込またはiframe内での操作が必要。**外部ページ自身のスクリプトによる内部更新は外部依存=本claimの対象外** | 「ホーム画面を開いたまま時間が経過する｜情報iframe 内のコンテンツは自動では更新されない。最新表示にはページ全体の再読込または iframe 内での操作が必要になる」「JS 挙動｜本カード専用の JavaScript は持たない。ホーム画面共通のスクリプト（売上チャート等）は本カードの iframe 内容を操作しない」「設定との関係｜ページレンダリング時の `eccube_info_url` が iframe の `src` に反映される。実行中に設定だけが変わっても、開いたままのホーム HTML は自動では書き換わらない」 | md:119,77,128／twig:304-314（script 0件） | 0 `data-passthrough` |
| L1-M0205-011 | no_ui | 本カードはフォーム・自由記述入力を持たず（form/input/textarea/select/button 0件）、モーダル・ポップアップ・トーストを自ら開かず、本カード専用のJavaScriptを持たない（iframe内で表示されるモーダル等は外部ページの実装=対象外） | 「入力項目｜本カードはフォーム・自由記述入力を持たない。情報iframe 内の操作は外部ページに従う」「モーダル・ポップアップ｜本カード自体はモーダルやトーストを開かない。iframe 内でモーダルが表示される場合は外部ページの実装に従う」「利用者入力｜本カードはフォームを持たない」 | md:80,79,166／twig:304-314（grep実測0件） | 0 `non-translated` |
| L1-M0205-012 | no_db_effect | 本カードはサイト内DB列を**読みも書きもしない**（お知らせ本文は外部URLの応答にのみ存在）。レンダリングのみではお知らせ内容に関するDB更新・キャッシュ書き込みを行わない。サイト内 `News` エンティティ（dtb_news）やその公開状態と**連動しない**（両者の内容一致は保証しない）。観測契約: ホーム表示前後で dtb_news の行数+主キー順全列ダイジェスト不変（§6.3）＋dtb_newsへ行を投入してもカード表示（src・DOM構成）不変 | 「—｜—｜当機能はサイト内 DB 列を読み書きしない。お知らせ本文は外部 URL の応答にのみ存在する」「副作用｜本カードのレンダリングのみでは、お知らせ内容に関するデータベース更新やキャッシュ書き込みは行わない」「サイト内 DB の新着情報との関係｜本カードはサイト内 `News` エンティティやその公開状態と連動しない。両者の内容一致は保証しない」 | md:158,150,129／twig:304-314（DB参照はtwig変数 eccube_config のみ=設定値） | 0 `non-ui-observable` |
| L1-M0205-013 | session_cookie | ホーム画面表示時、お知らせカードの表示のためだけにセッションを更新しない（index()に `session->set` 不出現=Controller:102-205 grep実測。setはショップ状況行リンク先302-330のみ=別機能）。本機能はお知らせ表示のためだけに新たなCookieを設定しない（セッションCookieは管理画面全体の認証用。iframeオリジン側のCookieは外部サイトのポリシー=対象外） | 「ホーム画面表示時｜お知らせカードの表示のためだけにセッションを更新しない」「本機能はお知らせ表示のためだけに新たな Cookie を設定しない。ブラウザのセッション Cookie はフレームワークおよび管理画面全体の認証に用いられる。情報iframe のオリジン側で Cookie が設定される場合は、そのサイトのポリシーに従う」 | md:230,236／Controller:102-205 | 0 `non-ui-observable` |
| L1-M0205-014 | no_audit_log | お知らせカードの表示のみでは業務監査ログを追加で書く処理を持たない（本カードにサーバ側専用処理が不存在=twigのみ=L1-006のため、ログを書くコード経路自体がない=静的拘束。サーバログの実行時観測手段は未契約=実行保留・§9-6） | 「お知らせカードの表示のみ｜本ブロック単体では業務監査ログを追加で書く処理は持たない」 | md:214／Controller:102-205・twig:304-314（専用処理0件） | 0 `non-ui-observable` |
| L1-M0205-015 | authorized_view | 管理者として認証済みの利用者は、ホーム画面が表示される範囲で本カードを閲覧できる。ホーム上の**カード単位で表示を切り替える実装は本カードに無い**（twig:304-314に権限・条件分岐 `{% if %}` 不出現=カードは無条件レンダリング。管理領域全体の権限設計は別機能=委譲） | 「管理者として認証済み｜ホーム画面が表示される範囲で本カードを閲覧できる」「細粒度の権限｜ホーム上のカード単位で表示を切り替える実装は本カードに無い。管理領域全体の権限設計に従う」 | md:176,177／twig:304-314（`{% if %}` 0件=grep実測。index.twig内の`{% if is_danger_admin_url %}`:107は警告バナー別ブロック） | 0 `non-ui-observable` |
| L1-M0205-016 | iframe_isolation（**改訂1新設**） | iframe内の閲覧・操作（内部ナビゲーション・新規タブ・スクロール・リンク押下）に対して**親ページ（ホーム）とアプリのサーバは非反応**: (i) 親ページは遷移しない（親URL不変・#ec-cube-newsのDOM構成/src属性不変） (ii) アプリケーションのサーバはiframe内のナビゲーション要求を受け取らない（=管理画面オリジン `/%eccube_admin_route%/` 配下への追加リクエストが発生しない。別オリジンの場合は同一オリジンポリシーによりアプリ側からの読み取りも行わない） (iii) 親側の状態を変更しない（iframe内遷移は親のサーバ側セッションと独立・親contextの新規Cookieなし・お知らせ関連DB不変）。**iframe内で何が描画され・どこへ遷移するかは読み込み先ドキュメント/ブラウザに従う=外部成分（EX-C成分）は本claimの対象外・非オラクル化** | 「情報iframe 内を閲覧・操作する｜…表示される内容・遷移・スクロールは、読み込み先ドキュメントおよびブラウザのふるまいに従う。**アプリケーションのサーバ側は iframe 内の操作を解釈しない**」「遷移・ポップアップ・フォーム送信は読み込み先ドキュメントのマークアップとスクリプトに従う」「**アプリケーションのサーバは iframe 内のナビゲーション要求を受け取らない（別オリジンの場合は同一オリジンポリシーにより読み取りも行わない）**」「情報iframe 内のリンクを押下｜iframe 内のナビゲーションまたは新規タブ等、読み込み先 HTML の指定に従う」「**情報iframe 内での遷移もアプリケーションのサーバ側セッションとは独立する**」 | md:67,96,97,186,190／twig:304-314（iframe以外の連結要素なし）／Controller:102-205（iframe内要求を受けるルート不存在=本カード専用ルート0件） | 0 `non-ui-observable` |

## §2 SEED三段参照設計（全て `@TBD-D5`）

三段参照: **期待の正=L1オラクルID（§1） → 前提状態=SEEDセットID@manifest_sha1 → 観測=実値**。
本機能は**サイト内DBを読まない**ため、m02-01〜04型の「集計値のdb.ts式評価突合」は存在しない。前提の実体は
(a) 管理者アカウント（SQL）(b) **アプリ設定 `eccube_info_url`（DB外=環境契約。SQL SEEDでは変更不能）**
(c) **route interception（Playwright実行時のリクエスト注入=設定変更不要）** の3種で、性格が異なることを明示する。

| SEEDセットID | 種別 | 目的 | 固定値（設計） | 後始末 |
|---|---|---|---|---|
| SEED-M02-ADMIN | SQL（既存） | 2FA OFFの有効管理者 | `config/default.config.ts` の ECCUBE_ADMIN_USER/PASS 既定（既存共通・`e2e/seed/sets/m01/SEED-M01-ADMIN.sql` エイリアス） | 既存利用・撤去不要 |
| SEED-M02-INFOURL-DEFAULT | **環境契約**（no-op・既存） | 実効 `eccube_info_url` が**非空の既知値**であることのrun前提（既定 `https://www.ec-cube.net/info/4/`。環境別設定で上書きされ得るため**実効値はD5で確認し突合値に採用**） | DB変更なし（`e2e/seed/sets/m02/SEED-M02-INFOURL-DEFAULT.sql`=no-op fixture既存） | 参照のみ・撤去不要 |
| SEED-M0205-INFOURL-EMPTY | **環境契約**（未整備） | `eccube_info_url` を空文字にした専用環境（C-007用）。アプリ設定のためデプロイ/環境変数層の変更が必要=**SQL不可・実行保留** | 環境別設定 `eccube_info_url: ''` | テスト後に既定へ復元（専用環境前提） |
| SEED-M0205-INFOURL-NONURL | **環境契約**（未整備） | `eccube_info_url` を非URL文字列（例 `E2E-M0205-RAW-STRING`）にした専用環境（C-004パススルー識別用） | 環境別設定で任意文字列 | 同上 |
| SEED-M0205-ROUTE-STUB | **route interception**（実行時・synthetic） | 実効info URLへのブラウザ要求を `page.route()` で決定的に注入: (a) abort（C-009不通） (b) fulfill＋`X-Frame-Options: DENY` ヘッダ（C-008埋め込み拒否） (c) **fulfill＋synthetic HTML文書（C-016 iframe内操作用・改訂1）**: 内部リンク（同スタブ配下の別パス）・`target="_blank"` リンク・スクロール要素を含むテスト所有の文書を供給し、iframe内ナビ/新規タブ/スクロールを**外部応答に依存せず決定的に発生**させる。**設定変更不要・外部ネットワーク不要**。iframe（subframe）要求へのroute適用可否はD5で実機確認（§9-4） | patternは実効 `eccube_info_url` のオリジン配下（環境値から構成）。(c)の文書はマーカー `E2E-M0205-STUB-` を含むsynthetic | テスト内・context破棄で消滅 |
| SEED-M0205-NEWS | SQL | サイト内News非連動の識別（C-015補完用）: dtb_news 1行（帯ID=900002501・タイトルマーカー `E2E-M0205-NEWS-`・公開状態） | NOT NULL列全充足・IDENTITY明示id投入=@TBD-D5 | マーカー/帯ID DELETE（down） |

- **TLS証明書エラー（C-010）はSEED未定義=実行保留**: route interceptionではTLSハンドシェイク失敗を偽装できず、
  自己署名証明書のローカルHTTPSスタブ＋INFOURL差し替え環境の両方が必要（§9-5）。
- 通常run（DEFAULT環境）ではiframeが**実外部サイトへGET**する＝外部可用性依存。読み込み完了を合否に使う
  ケースは無い（src属性・DOM構成のみ判定=外部応答内容へ依存しない設計）が、ネットワーク遮断環境では
  route abortを常用してもよい（表示系ケースの判定はsrc属性でありiframe内容でないため影響なし）。

## §3 表示/取得/フォールバックマトリクス（本機能はフォームなし＝入力制約マトリクスは非該当）

### 3a. 表示（三値比較: 設計md 56-58/76-80 ⇔ ee twig:304-314 ⇔ 観測=DOM）

| 面 | 内容 | L1 |
|---|---|---|
| カード | `#ec-cube-news`（card rounded border-0 h-100）・card-header内 `.card-title`＝「お知らせ」/"What's New" | L1-003 |
| 本体 | card-body **p-0** に `iframe[name="information"]`（link_list_wrap・width:100%・border:0・min-height:390px）を敷き詰め | L1-003 |
| フッタ | `.card-footer`＝height:43px の固定高さ**空領域** | L1-003 |
| src | `getAttribute('src')` === 実効 `eccube_info_url`（そのまま・無検証） | L1-004,005 |
| 供給 | サーバ側レンダリング（twig直埋め）・専用API/専用JS/自動更新なし | L1-006,010,011 |
| UI部品 | form/input/button/modal/script 0件（操作面なし） | L1-011 |
| iframe内操作への親非反応 | 内部ナビ/新規タブ/スクロールでも親URL・カードDOM不変・管理画面オリジンへの追加リクエスト0件・親Cookie/セッション/DB独立（**表示・遷移の結果そのものは外部成分=非オラクル化**） | L1-016 |

### 3b. 取得（お知らせ本文の取得主体）

| 段 | 主体 | 内容 | 期待値の正 | L1 |
|---|---|---|---|---|
| 設定読取 | サーバ(twig) | eccube_config.eccube_info_url を src へ出力 | L1-005（アプリ契約） | L1-004,005 |
| 本文GET | **ブラウザ** | src のURLへHTTP GET・応答ボディをiframe内に描画 | **外部応答の内容はオラクル外**（要実機/スタブ） | L1-006 |
| サーバ関与 | なし | 取得・整形・キャッシュ・API・バッチ・成否判定なし | L1-006,012（不存在claim） | L1-006 |

### 3c. フォールバック（分岐×アプリ側期待×ブラウザ側委譲）

| 入力状態 | src出力（アプリ契約=L1化） | カードのフォールバック（アプリ契約=L1化） | ブラウザ側表示（委譲=非assert） | 実行性 | L1 |
|---|---|---|---|---|---|
| 既定/差替URL（非空） | 設定文字列そのまま | —（正常） | 外部応答に依存（オラクル外） | 実行可（C-003） | L1-004,005 |
| 空文字 | `src=""` | エラー文言を**補わない** | 空文書 | **実行保留**（INFOURL-EMPTY環境） | L1-007 |
| 埋め込み拒否（XFO） | 通常どおり | 代替HTML/検知**なし**（DOM不変） | コンテンツ非表示orエラー表示（L1-009=ブラウザ層） | route stubで注入可・ブロック判定は**要実機** | L1-008,009 |
| ネットワーク不通 | 通常どおり | リトライ/フォールバック**なし**（DOM不変）・ホーム自体は継続 | ブラウザのエラー表示 | route abortで注入可（C-009） | L1-008 |
| TLS証明書エラー | 通常どおり | 検知**なし** | インタースティシャル | **実行保留**（TLSスタブ未整備） | L1-008 |
| 時間経過 | src不変 | アプリ起因の自動更新**なし** | 外部ページ自身の内部更新は対象外 | 実行可（C-011・監視窓） | L1-010 |

## §4 実行可能グレード14列TSV（候補・**自己完結＝全17行を実体掲載**）

記法: 期待結果セルは三段参照 `…実値… [L1:<oracle_id>; fixture:<SEEDセットID>@TBD-D5]`。
`%eccube_admin_route%` は環境値（既定 `admin`）。セレクタ（page実装済み・twig由来・2026-07-06実走7〇で実機実績）:
カード `#ec-cube-news`（twig:304）・見出し `.card-title`（:307）・本体 `.card-body`（:310）・
情報iframe `iframe[name="information"]`（:311）・フッタ `.card-footer`（:313）。
route interceptionのpattern・フレームブロック判定は要実機（§9-4）。en行はD15前提。

### §4.1 bound対応候補行（15行=ja14＋-EN1。§8の35対応表が参照する全行。C-016=改訂1新設の分離bind行）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m02-05_admin_home_home_ec_cube_news	E2E-M0205C-001	IT-15	未認証	P1	未認証でホームへアクセスすると管理ログインへ誘導されお知らせカードを利用できない	未ログイン（cookieなしcontext）	—	1. GET /%eccube_admin_route%/ 2. 遷移先URLと画面を確認 3. #ec-cube-news の不在を確認	admin_login のログイン画面へ誘導され、お知らせカード（#ec-cube-news）を含むホーム画面は表示されない（利用不可） [L1:L1-M0205-001]				
m02-05_admin_home_home_ec_cube_news	E2E-M0205C-002	IT-25	表示	P1	ログイン後ホームにお知らせカード一式が表示される（ja・エラーなし継続・同一画面にカードとiframe）	管理者ログイン済（SEED-M02-ADMIN・2FA OFF）	—	1. ログインし GET /%eccube_admin_route%/ 2. #ec-cube-news 内の .card-title 文言・card-body 内の iframe[name="information"]・.card-footer の存在を確認 3. カードとiframeが同一画面（同一DOM）内に共存することを確認 4. カード内にエラー/フォールバック文言が無いことを確認	管理者認証後のダッシュボード（ホーム）に #ec-cube-news カードが表示され、見出し「お知らせ」・card-body内の情報iframe（name="information"）・フッタ領域が同一画面内に描画され、エラー文言なく表示が継続する（カードは無条件レンダリング=カード単位の表示切替分岐なし） [L1:L1-M0205-002,L1-M0205-003,L1-M0205-015; fixture:SEED-M02-ADMIN@TBD-D5]				
m02-05_admin_home_home_ec_cube_news	E2E-M0205C-002-EN	IT-25	表示	P3	お知らせカード見出し文言（en）	管理者ログイン済／locale=en	—	1. en UIでホームを開く 2. #ec-cube-news .card-title を読む	見出し="What's New"（en一次資料逐語=messages.en.yaml:1869） [L1:L1-M0205-003; fixture:SEED-M02-ADMIN@TBD-D5]				
m02-05_admin_home_home_ec_cube_news	E2E-M0205C-003	IT-25	src出力	P1	情報iframeのsrcに設定値eccube_info_urlがそのまま出力され読み込みが開始される	管理者ログイン済／SEED-M02-INFOURL-DEFAULT（実効info URL=非空の既知値・D5確認済環境）	—	1. ホームを開く 2. iframe[name="information"] の getAttribute('src') を読む 3. 実効設定値（環境契約の既知値）と文字列完全一致を確認 4. ネットワーク記録で当該srcへのブラウザ発リクエスト（読み込み開始）を確認（応答の成否・内容は判定に使わない）	情報iframe の src に実効 eccube_info_url の文字列がそのまま出力され（getAttribute値=設定値の完全一致・DOM値は無エスケープ原文）、ブラウザがその URL への読み込みを開始する。期待の正はL1（設定値そのまま出力）であり特定URLリテラルではない（実効値は環境契約=D5確認。既知値が確認できないrunは非空+読み込み開始のみの部分判定に降格し要実機注記） [L1:L1-M0205-004,L1-M0205-005,L1-M0205-006; fixture:SEED-M02-INFOURL-DEFAULT@TBD-D5]				
m02-05_admin_home_home_ec_cube_news	E2E-M0205C-004	IT-22	無検証出力	P2	eccube_info_urlが非URL文字列でも形式検証されずそのままsrcに出力される（パススルー識別・実行保留）	管理者ログイン済／SEED-M0205-INFOURL-NONURL（実効info URL=非URL文字列マーカーの専用環境・未整備）	環境設定 eccube_info_url=E2E-M0205-RAW-STRING（例）	（実行保留=INFOURL差替環境未整備・§9-3）1. 専用環境でホームを開く 2. iframe の getAttribute('src') が設定した非URL文字列と完全一致することを確認 3. カードにエラー文言が出ないことを確認	設定文字列が形式検証・許可リスト制限なしでそのまま src に出力される（非URL文字列でも原文一致・サーバ/カードはエラーを出さない）。既定URL環境のC-003では「妥当なURLだから通った」可能性を排除できないため、非URL文字列による識別観測を分離（**実行保留: アプリ設定はDB外でSQL SEED不可=環境差替契約が未整備**） [L1:L1-M0205-005; fixture:SEED-M0205-INFOURL-NONURL@TBD-D5]				
m02-05_admin_home_home_ec_cube_news	E2E-M0205C-005	IT-25	UI部品	P2	本カードはフォーム・入力・モーダル類・専用JSを持たない	管理者ログイン済	—	1. ホームを開く 2. #ec-cube-news 内の form/input/textarea/select/button/.modal/[role=dialog]/script 要素数と on* インライン属性数を数える 3. 表示完了後、本カード起因のモーダル/トースト出現が無いことを確認（iframe内部は評価対象外=外部ページ実装）	いずれも0件（本カードはフォーム・自由記述入力を持たず、モーダル・ポップアップ・トーストを自ら開かず、専用JavaScriptを持たない。操作面なし） [L1:L1-M0205-011]				
m02-05_admin_home_home_ec_cube_news	E2E-M0205C-007	IT-25	空URL	P2	eccube_info_urlが空文字の運用設定ではsrcが空になりカードはエラー文言を補わない（実行保留）	管理者ログイン済／SEED-M0205-INFOURL-EMPTY（eccube_info_url=''の専用環境・未整備）	環境設定 eccube_info_url=''	（実行保留=INFOURL-EMPTY環境未整備・§9-3）1. 専用環境でホームを開く 2. iframe の getAttribute('src') が空文字であることを確認 3. カードDOMが通常構成（見出し・本体・フッタ）のままでエラー/案内文言が追加されないことを確認	iframe の src が空（src=""出力）になり、ブラウザは空の文書を読み込む。本カードはエラー文言を補わない（DOM構成は通常時と同一） [L1:L1-M0205-007,L1-M0205-003; fixture:SEED-M0205-INFOURL-EMPTY@TBD-D5]				
m02-05_admin_home_home_ec_cube_news	E2E-M0205C-008	IT-12	埋め込み拒否	P1	外部サイトが埋め込みを拒否するとブラウザがコンテンツを表示せずカードは代替HTML・フォールバック文言を出さない	管理者ログイン済／SEED-M0205-ROUTE-STUB（実効info URLへの応答を X-Frame-Options: DENY 付きで注入）	route fulfill: status200+ヘッダ X-Frame-Options: DENY	（ブロック状態の機械判定契約=要実機・§9-4）1. page.route で実効info URLへの要求に XFO: DENY 応答を注入 2. ホームを開く 3. カードDOM（見出し・iframe・フッタ）が通常構成のままでエラー/代替文言が追加されないことを確認 4. フレームのブロック状態（フレーム文書への到達不能・コンソールの拒否メッセージ等=判定手段は要実機確認）を記録	ブラウザがiframeコンテンツを表示しない（またはエラー表示にする）＝ブラウザ層の拒否が起き、サーバ側は検知せず代替HTMLを出さない（カードDOMは通常時と同一・ホーム自体はエラーなく継続）。ブラウザのブロック描画の詳細は設計スコープ外=判定はカード側不変+フレーム非表示の事実まで [L1:L1-M0205-009,L1-M0205-008; fixture:SEED-M0205-ROUTE-STUB@TBD-D5]				
m02-05_admin_home_home_ec_cube_news	E2E-M0205C-009	IT-12	外部不通	P2	ネットワーク不通・タイムアウト時はブラウザのエラー表示に委ねサーバはリトライ・フォールバックせずホームは継続する	管理者ログイン済／SEED-M0205-ROUTE-STUB（実効info URLへの要求をabort）	route abort（接続失敗の決定的注入）	1. page.route で実効info URLへの要求を abort 2. ホームを開く 3. ホーム自体（管理画面・他カード）が正常表示されることを確認 4. #ec-cube-news のDOM構成が通常時と同一（エラー/リトライ/代替文言の追加なし）であることを確認 5. ネットワーク記録でアプリ起因の再試行リクエストが発生しないことを確認	iframe向けGETが失敗してもホーム画面は継続表示され、本カードはサーバ側の検知・リトライ・代替HTML・専用フォールバック文言を持たない（カードDOM不変）。失敗の描画自体はブラウザに委ねる=ブラウザのエラー表示内容は期待値にしない [L1:L1-M0205-008; fixture:SEED-M0205-ROUTE-STUB@TBD-D5]				
m02-05_admin_home_home_ec_cube_news	E2E-M0205C-010	IT-12	TLSエラー	P3	TLS証明書エラー等はブラウザのインタースティシャルに委ねる（実行保留）	管理者ログイン済／TLS失敗を誘発する自己署名HTTPSスタブ＋INFOURL差替環境（未整備）	—	（実行保留=TLSエラーの決定的注入手段未契約・§9-5。route interceptionではTLSハンドシェイク失敗を偽装できない）	TLS証明書エラー時もサーバ側は検知・代替表示せず（カードDOM不変）、表示はブラウザのインタースティシャルに委ねる [L1:L1-M0205-008]（**実行保留: 自己署名HTTPSスタブ＋info URL差替環境の両方が必要=未整備**）				
m02-05_admin_home_home_ec_cube_news	E2E-M0205C-011	IT-22	自動更新なし	P2	ホームを開いたまま時間が経過しても情報iframeはアプリ側から自動更新されない	管理者ログイン済	—	1. ホームを開き iframe の src属性値とネットワーク監視を開始 2. 無操作で待機（監視窓・例: 60秒） 3. src属性が不変であることを確認 4. アプリ（ホームHTML/カード）起因のiframe再読み込み・ポーリングリクエストが発生しないことを確認（外部ページ内部のスクリプト起因の通信は評価対象外=外部依存） 5. ページ全体を再読込し、その時点の設定値でsrcが再出力されることを確認	情報iframeのコンテンツはアプリ側からは自動更新されない（本カード専用JSなし・src不変・ポーリングなし）。最新表示にはページ全体の再読込（またはiframe内での操作=外部依存で対象外）が必要 [L1:L1-M0205-010]				
m02-05_admin_home_home_ec_cube_news	E2E-M0205C-012	IT-12	無書込	P2	ホーム表示（お知らせカードのレンダリング）はお知らせ内容に関するDB更新・キャッシュ書き込みを行わない	管理者ログイン済	—	1. db.tsでT0=dtb_newsの行数＋主キー順全列ダイジェスト（§6.3）を記録 2. ホームを表示し、iframe読み込み開始まで待つ 3. ホームを再読込 4. db.tsでT1を再照会	T0=T1（dtb_newsの行数・全列ダイジェスト完全一致=お知らせ関連の登録/更新/削除なし）。本カードはサイト内DB列を読み書きせず、レンダリングのみではDB更新・キャッシュ書き込みを行わない（DB外のキャッシュ書込の不在は静的根拠=本カードにサーバ側専用処理なし・実行時のファイル系観測は未契約=§9-6） [L1:L1-M0205-012]				
m02-05_admin_home_home_ec_cube_news	E2E-M0205C-013	IT-20	セッション/Cookie	P3	お知らせカード表示のためだけにセッションを更新せず新規Cookieも設定しない	管理者ログイン済	—	1. ログイン完了後 context.cookies() のCookie集合T0を記録 2. ホームを表示（お知らせカード表示を含む） 3. ホームを再表示 4. context.cookies() T1を取得しT0との差分を確認（認証/セッション系フレームワーク由来Cookieの値更新は除外して評価。iframeの外部オリジンCookieはブラウザ管理=評価対象外）	本機能起因の新規Cookieが増えない。セッション更新なしの根拠は静的（index()にsession->set不出現=Controller:102-205 grep実測）＋Cookie差分の実測で観測（サーバ側セッション内部は直接観測不能=有限観測に限定） [L1:L1-M0205-013]				
m02-05_admin_home_home_ec_cube_news	E2E-M0205C-014	IT-12	監査ログなし	P3	お知らせカードの表示のみでは業務監査ログを追加で書かない（観測手段未契約=実行保留）	管理者ログイン済	—	（サーバログの実行時観測手段が未契約のため実行保留=§9-6。claimは静的拘束済み: 本カードにサーバ側専用処理が不存在〔twig:304-314のみ・Controller内にお知らせ系処理0件〕＝ログを書くコード経路がない）	お知らせカードの表示のみでは業務監査ログを追加で書く処理を持たない [L1:L1-M0205-014]（**実行保留: ログ観測未契約。静的実測で拘束済み**）				
m02-05_admin_home_home_ec_cube_news	E2E-M0205C-016	IT-12	iframe内操作への親非反応	P2	【改訂1・分離bind】iframe内の閲覧・操作（内部ナビ・新規タブ・スクロール）に対し親ページとアプリサーバが非反応である	管理者ログイン済／SEED-M0205-ROUTE-STUB(c)（iframeへ内部リンク・target=_blankリンク・スクロール要素を含むsynthetic文書をfulfill供給=外部応答非依存）	route fulfill: マーカー E2E-M0205-STUB- 付きsynthetic HTML（同スタブ配下への内部リンク＋新規タブリンク）	（subframeへのroute適用・cross-origin frame操作の可否=要実機・§9-4）1. page.routeで実効info URL配下にsynthetic文書を供給しホームを開く 2. 親URL・#ec-cube-newsのDOM構成/src属性・context.cookies() T0・ネットワーク監視（管理画面オリジン宛の記録）を開始 3. frameLocatorでiframe内の内部リンクを押下しiframe内遷移（スタブ配下の別パス）を発生させる 4. 新規タブリンクを押下（popupイベントで検出し閉じる） 5. iframe内をスクロール 6. 親URL不変・カードDOM/src不変・管理画面オリジン（/%eccube_admin_route%/配下）への追加リクエスト0件・cookies差分なしを確認 7. （DB独立=db.tsでdtb_newsダイジェストT0=T1を併観測）	iframe内の閲覧・操作に対し、親ページは遷移せず（親URL・カードDOM・src属性不変）、アプリのサーバはiframe内のナビゲーション要求を受け取らず（管理画面オリジンへの追加リクエスト0件）、親側の状態も変更しない（新規Cookieなし・セッション独立・お知らせ関連DB不変）。**iframe内で何が表示され・どこへ遷移するか自体は読み込み先ドキュメント/ブラウザに従う=外部成分は期待値にしない（非オラクル化。観測入力はテスト所有のsynthetic文書で外部契約に依存しない）** [L1:L1-M0205-016,L1-M0205-013; fixture:SEED-M0205-ROUTE-STUB@TBD-D5]				
```

### §4.2 補完行（2行=ja2。**親test_idなし・母集合会計に算入しない**。理由=設計書補完〔一次資料に規定があるが、母集合35行の期待テキストに対応する親が存在しない〕）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m02-05_admin_home_home_ec_cube_news	E2E-M0205C-006	IT-25	レイアウト実測	P3	情報iframeとフッタのレイアウト属性が実装既定どおりである	管理者ログイン済	—	1. ホームを開く 2. iframe[name="information"] のstyle/計算スタイル（width:100%・border:0・min-height:390px）とclass（link_list_wrap）を確認 3. .card-body が p-0（余白なし）であること・.card-footer のstyle（height:43px）と内包テキストが空であることを確認	情報iframeは横幅いっぱい・枠線なし・最小高さ390pxのピクセル指定で敷き詰められ（card-body p-0）、フッタは高さ43pxの固定高さ空領域として描画される（style値はtwig:311,313の実装既定=標準区分のためee実装を正。テーマ/CSS上書き環境では計算スタイルが変わり得る=判定はstyle属性値を主・計算値を従） [L1:L1-M0205-003]（補完行・親test_idなし・設計書補完=md:76,78）				
m02-05_admin_home_home_ec_cube_news	E2E-M0205C-015	IT-12	News非連動	P3	サイト内の新着情報（dtb_news）を投入してもお知らせカードの表示は変化しない（非連動）	管理者ログイン済／SEED-M0205-NEWS（dtb_news 1行・帯ID/マーカー）	—	1. ホームを開き iframe の src属性値とカードDOM構成を記録 2. apply SEED-M0205-NEWS（db.tsでdtb_newsへ投入） 3. ホームを再読込 4. src属性値・カードDOM構成が手順1と同一（サイト内Newsの内容がカードに現れない）ことを確認 5. teardown	本カードはサイト内Newsエンティティやその公開状態と連動しない（dtb_news投入前後でsrc・カード構成不変。カード内容は外部URL応答にのみ依存し、両者の内容一致は保証しない） [L1:L1-M0205-012; fixture:SEED-M0205-NEWS@TBD-D5]（補完行・親test_idなし・設計書補完=md:129）				
```

## §5 locale対応表

- **LS=1 claim（1件）**: L1-M0205-003（カード見出し。ja「お知らせ」＝messages.ja.yaml:1891／
  en "What's New"＝messages.en.yaml:1869。en一次資料逐語・ja翻訳ゼロ）→ **-EN 1行**（C-002-EN）。
- **LS=0（理由コード付き）**:
  - `non-translated`: L1-001/004/005/007/008/009/011（URL・設定値・src属性・要素有無・失敗時の不作為
    ＝文言非依存。空URL/失敗時に**表示すべき文言が存在しない**こと自体が仕様=対象文言なし）。
  - `non-ui-observable`: L1-002/006/012/013/014/015/016（HTTP/サーバ不存在claim/DB/セッション/親非反応/静的実装事実）。
  - `data-passthrough`: L1-010（iframe内容は外部応答の反映）。
- -EN 1行の実行前提はD15（管理画面のen切替口なし＝W0実測を継承）。文言確定は本書で完了（実行のみ保留）。

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

### §6.1 観測契約（本機能はフォームPOSTなし＝CSRF request契約は非該当）

- **GETのみ**: `GET /%eccube_admin_route%/`（admin_homepage）。本カード専用のPOST/Ajax/APIルートは不存在
  （L1-006）。直接送信系（POST/CSRF）の契約は不要。
- **セレクタ**（既存page再利用・twig由来・2026-07-06実走7〇で実機実績）: §4冒頭に列挙。
- **src突合契約**: 判定は `getAttribute('src')`（DOM値=無エスケープ原文）を正とし、HTMLソース上の
  `&amp;` エスケープ表現と混同しない（L1-005）。実効設定値との突合は環境契約（SEED-M02-INFOURL-DEFAULT）の
  既知値で行い、既知値が確認できないrunは「非空＋読み込み開始」の部分判定に降格して要実機注記（§9-7）。
- **route interception契約（C-008/C-009/C-016）**: `page.route()` は実効info URLのオリジン配下パターンに適用。
  Playwrightのrouteはsubframe（iframe）発リクエストにも適用される想定だが、**本ハーネスでの適用実績が
  未確認=D5で実機確認**（§9-4）。abort=不通・fulfill(XFOヘッダ)=埋め込み拒否・fulfill(synthetic文書)=
  iframe内操作（C-016）の3モード。
- **iframe内操作契約（C-016・改訂1）**: iframe内の操作は `frameLocator('iframe[name="information"]')` 経由。
  操作対象はスタブ供給のsynthetic文書（テスト所有・マーカー付き）＝**外部応答内容に依存しない**。
  新規タブは `context.on('page')`（popup）で検出し即クローズ。「親非反応」の観測は
  (i)親 `page.url()` 不変＋カードDOM/src属性不変 (ii)ネットワーク記録で管理画面オリジン
  （`/%eccube_admin_route%/` 配下）宛の追加リクエスト0件（iframe内遷移によるスタブオリジン宛リクエストは
  発生してよい=評価対象外） (iii)context.cookies()差分なし＋dtb_newsダイジェスト不変、の有限集合に限定。
  cross-origin frameへのPlaywright操作可否も含めD5実機確認（§9-4）。
- **フレームブロック判定（C-008）**: XFO拒否時の「ブラウザがコンテンツを表示しない」の機械判定手段
  （フレーム文書への到達不能／コンソールの `Refused to display` 系メッセージ／frame要素の空描画）は
  ブラウザ実装依存＝**判定契約は要実機**（§9-4）。カード側不変（アプリ契約）は通常セレクタで判定可能。

### §6.2 外部応答内容の非オラクル化（本機能の分離線）

- 期待値の正にするもの（L1化済み）: src属性値・カードDOM構成・失敗/空URL時の**カード側不作為**・
  アプリ起因リクエストの有無・**iframe内操作に対する親側の非反応（L1-016・改訂1。観測入力はsynthetic
  スタブ文書=外部非依存）**。
- 期待値の正にしないもの: 外部URLの応答内容（記事一覧・HTML構造・リンク挙動・多言語・メンテ表示=md:36）・
  ブラウザのエラー描画の細目・iframe内で**何が表示され・どこへ遷移するかの結果そのもの**（md:37,38=EX-C成分）。
  これらは要実機（目視）または外部スタブ整備後の対象で、**自動判定の合否に混ぜない**
  （C-016はこの外部成分を判定に使わず、親側非反応のみをassertする分離設計）。

### §6.3 db.ts照会（C-012/C-015で使用。決定的差分照会を実体掲載=自己完結）

```sql
-- (1) 行数
SELECT COUNT(*) FROM dtb_news;
-- (2) 全列ダイジェスト（主キー順・全列。相殺更新・過去行更新も検知）
SELECT md5(COALESCE(string_agg(t::text, ',' ORDER BY t.id), '')) FROM dtb_news;
```

観測範囲の限定: 本カードはサイト内DBを読み書きしない（md:158）ため、「お知らせ内容に関するDB」の最小実体
＝サイト内新着情報 `dtb_news`（設計md:129が非連動を明記する唯一のお知らせ系テーブル）に限定する。
それ以外のテーブルへの書込不存在は静的根拠（本カードにサーバ側処理が不存在=L1-006）で担保し、
全テーブル照会までは求めない（観測契約の過大化回避。ホーム表示全体のDB無書込はm02-01〜04側の会計）。
SEED-M0205-NEWSの投入/後始末は帯ID900002501・`E2E-M0205-NEWS-` マーカー条件DELETE（NOT NULL列充足=@TBD-D5）。

### §6.4 実装方針（候補=未実装・実走なし）

- page: 既存 `e2e/pages/admin/m02/m02_05_admin_home_home_ec_cube_news.page.ts` を再利用（カード・見出し・
  本体・フッタ・iframe・src取得の全セレクタ実装済み）。route interceptionヘルパは未実装（D5）。
- spec: 既存 `e2e/spec/admin/m02/m02_05_*.spec.ts` は**旧ケース表（E2E-M02-05-xxx）1:1**の実装であり本候補の
  実装ではない（参考のみ。旧004の「非空判定」は本候補C-003で「実効既知値との完全一致」へ引き上げ）。
  本候補の期待値は `o("L1-M0205-xxx", ...)` 相当のL1解決器経由・リテラル直書き禁止（三段参照ゲートD9）。
- 通常runのiframe実外部GETは合否に使わない（判定はsrc属性=外部可用性と独立）。外部遮断環境では
  SEED-M0205-ROUTE-STUBのabortを常用可。

### §6.5 _drafts/隔離lintの実施証跡（実測・実施済み）

1. 正式消費側（`e2e/helpers/oracle.ts`・`e2e/helpers/db.ts`・spec・pages）に本草案を消費する `_drafts` 参照は
   **0件**（隔離ガード自体のリテラル〔oracle.ts:19〕を除く）。
2. 正式パス `e2e/fixtures/oracle/` 直下に本機能のjsonは**作成していない**（草案は `_drafts/` のみ）。
3. 本md・oracle草案json（`e2e/fixtures/oracle/_drafts/m02-05_admin_home_home_ec_cube_news_oracle_draft.json`）の
   出力先はともに `_drafts/` 配下のみ（CFP §7出力規約に適合）。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

| ケース群 | 実行区分（候補） | 観測層 | 備考 |
|---|---|---|---|
| C-001,002,005,006 | Playwright | GUI/HTTP | 表示・要素有無・未認証誘導 |
| C-003,011 | Playwright+network | GUI+network | src突合＋読み込み開始/追加リクエスト監視 |
| C-008,009 | Playwright+route interception | GUI+network | 決定的失敗注入（設定変更不要）。C-008のブロック判定契約=要実機 |
| C-016 | Playwright+route interception+db.ts | GUI+network+Cookie+DB | 改訂1新設。syntheticスタブでiframe内操作を注入し親非反応を観測（subframe route/cross-origin frame操作=要実機） |
| C-012,015 | Playwright+db.ts | GUI+DB | §6.3ダイジェスト（SEED非正） |
| C-013 | Playwright | Cookie | context.cookies差分＋静的根拠 |
| C-004,007 | **実行保留** | GUI | INFOURL差替/空の専用環境未整備（アプリ設定=DB外・SQL不可） |
| C-010 | **実行保留** | — | TLSエラー注入手段未契約（自己署名HTTPSスタブ＋差替環境） |
| C-014 | **実行保留** | — | サーバログ観測未契約（静的拘束済み） |
| -EN 1行 | 実行保留（D15） | GUI | 文言確定済み |

聖域判定・多軸属性の正式付与はD14 v2合格後（本表は暫定・正式会計に使わない）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（§0判定原則。観点ラベル・前提/入力列のシナリオ語はノイズ）。
1候補ケース行=1 assertion bundle・多対一は `shared-observation`・-EN行は対応ja行と同一親のlocale多重。
**参照先の全候補行は§4に実体掲載済み＝35↔候補の期待テキスト突合が本文内で完結する**。

### 集計（35 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **27** | 下表（うち003,024,031の3行=**成分分離bind**〔改訂1〕: アプリ側不作為成分→C-016／外部内容成分→EX-C成分として非オラクル化） |
| **TBD** | **0** | —（実在仕様で観測契約が定義不能な行なし。実行保留はbound側に留め置き=C-004/007/010/014） |
| **excluded** | **8** | EX-A フォーム/バリデーション不存在6（008,009,011,012,013,014）＋EX-B DB相関の観測主語不存在2（015,016）。各行の実引き正当化は下記。**旧EX-C 3行（003,024,031）は改訂1でbound（成分分離）へ変更=excludedから除外** |
| 合計 | **35** | 欠落0・理由なし重複0 |

- 候補ケース行総数**17**（§4.1 bound対応15＝ja14＋-EN1〔C-016含む〕／§4.2 補完2）。
- **excluded根拠（実引き・偽陰性チェック付き）**:
  - **EX-A（008,009,011,012,013,014・6件）**: 期待は「必須／相関バリデーションでエラーが表示され（ず）…」の
    定型。本カードは**フォーム・自由記述入力を持たない**（md:80「本カードはフォーム・自由記述入力を持たない」・
    md:166「利用者入力｜本カードはフォームを持たない」・twig:304-314にform/input要素0件=grep実測・本カードに
    Symfony Form生成コード自体が不存在〔サーバ側専用処理なし=L1-006〕）＝必須/相関バリデーションという観測主語が
    不存在（constraint不存在型=m02-04 EX-Aと同型）。エラーあり側（008,011,014）は発生手段なし・エラーなし側
    （009,012,013）は「〜バリデーションで」の限定が構成不能のため両極性とも過剰生成。偽陰性チェック:
    「エラーなく継続」の意味成分は030/032がC-002へ、「フォームを持たない」事実は018がC-005へbound済み。
    各行の前提列（埋め込み拒否/不通/時間経過/参照時点/API/失敗時/入力）は生成器が別行の機能語を流用した
    ノイズであり、当該実在挙動は期待テキストが当該内容である行（034/035/010等）が別途bound済み＝意味の取り逃しなし。
  - **EX-B（015,016・2件）**: 期待は「DBとの相関バリデーションでエラーが表示され（ず）…」の定型。本カードは
    **サイト内DBを読みも書きもしない**（md:17・md:158「当機能はサイト内 DB 列を読み書きしない」・twig:304-314の
    参照は設定値eccube_configのみ）＝「DBとの相関」の観測主語が不存在。m02-04では処理本体がDB照会だったため
    エラーなし側をsemantic bindしたが（C-017）、本機能はDB照会自体が0件のため両極性とも過剰生成
    （semantic bind先が構成不能）。偽陰性チェック: 「成功時出力/失敗時出力」（前提列の機能語）の実在成分は、
    成功時出力=ホームHTML+src出力（md:148）が030/032/001/029経由でC-002/C-003へ、失敗時出力=フォールバック
    なし（md:149）が025/035経由でC-009へbound済み。
- **成分分離bind（003,031,024・3件・改訂1=codex R1是正）**: 期待は「表示される内容・遷移・スクロールは、
  読み込み先ドキュメントおよびブラウザのふるまいに従うであること」（003/031同文=md:67逐語）・「iframe 内の
  ナビゲーションもしくは新規タブ等、読み込み先 HTML の指定に従うであること」（024=md:186逐語）。旧版は全面
  excluded（EX-C委譲文）としたが、同一設計文はアプリ側の実在成分**「アプリケーションのサーバ側は iframe 内の
  操作を解釈しない」（md:67後段）「サーバは iframe 内のナビゲーション要求を受け取らない」（md:97）「iframe内の
  遷移もサーバ側セッションとは独立」（md:190）**を含み、これはsyntheticスタブ供給によるiframe内操作の決定的
  発生＋親側非反応の有限観測（親URL/DOM不変・管理画面オリジン宛リクエスト0件・Cookie/DB不変）で**反証可能**
  ＝C-011/C-013の部分被覆（iframe内操作を発生させない受動観測）のみでのexcludedは偽陰性（codex R1指摘・正）。
  → 各行を2成分に分離: **(1) 外部成分**（iframe内で何が表示され・どこへ遷移するかの結果そのもの）＝
  **EX-C成分として非オラクル化維持**（いかなる外部挙動でも真になる無反証部分・md:36-38のスコープ外宣言どおり
  期待値にしない） **(2) アプリ側不作為成分**＝**L1-016＋C-016へbind**。会計は3行とも**bound（成分分離）**
  （excludedにしない。C-016の期待結果セルに外部成分の非オラクル化を明記=二重計上なし）。

### 35対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | アプリケーション設定に保持される文字列であること | bound | C-003（設定文字列がsrcへ出力=設定実体の観測） |
| 002 | EC-CUBEお知らせカードが表示され、情報iframe が設定された URL を読み込み開始すること | bound | C-002（カード表示）＋C-003（src=設定URL・読み込み開始） (shared) |
| 003 | 表示される内容・遷移・スクロールは読み込み先ドキュメントおよびブラウザのふるまいに従うであること | bound（**成分分離**・改訂1） | C-016（アプリ側不作為成分=同一設計文md:67後段「サーバ側はiframe内操作を解釈しない」の親非反応観測）。外部内容成分はEX-C成分=非オラクル化 |
| 004 | ホーム画面自体に到達できないため、本カードも利用できないこと | bound | C-001 |
| 005 | カード見出しは翻訳キーに基づくタイトルであること | bound | C-002（ja「お知らせ」）＋C-002-EN |
| 006 | 本カード自体はモーダルやトーストを開かないこと | bound | C-005 |
| 007 | iframe の src が空になり、ブラウザは空の文書を読み込むであること | bound | C-007（**実行保留**=INFOURL-EMPTY環境） |
| 008 | 必須バリでエラーが表示され完了しないこと | **excluded** EX-A | — |
| 009 | 必須バリでエラーが表示されず継続できること | **excluded** EX-A | — |
| 010 | 情報iframe 内のコンテンツは自動では更新されないこと | bound | C-011 |
| 011 | 相関バリでエラーが表示され完了しないこと | **excluded** EX-A | — |
| 012 | 相関バリでエラーが表示されず継続できること | **excluded** EX-A | — |
| 013 | 相関バリでエラーが表示されず継続できること | **excluded** EX-A | — |
| 014 | 相関バリでエラーが表示され完了しないこと | **excluded** EX-A | — |
| 015 | DB相関バリでエラーが表示されず継続できること | **excluded** EX-B | —（DB照会自体が不存在） |
| 016 | DB相関バリでエラーが表示され完了しないこと | **excluded** EX-B | — |
| 017 | 本カードのレンダリングのみではお知らせ内容に関するDB更新やキャッシュ書き込みは行わないこと | bound | C-012 |
| 018 | 本カードはフォームを持たないこと | bound | C-005 |
| 019 | 本カードの Twig は値の形式検証を行わず、そのまま src に出力すること | bound | C-003（既定値の原文一致=部分）＋C-004（非URL文字列の識別観測=**実行保留**） |
| 020 | 利用不可であること（未認証） | bound | C-001 (shared) |
| 021 | ホーム画面が表示される範囲で本カードを閲覧できること | bound | C-002 (shared) |
| 022 | ホーム上のカード単位で表示を切り替える実装は本カードに無いであること | bound | C-002 (shared・無条件レンダリング＋twig静的0分岐=L1-015。単一管理者での実測は有限観測=全権限構成の網羅は主張しない) |
| 023 | 同一画面内にお知らせカードと情報iframe を表示すること | bound | C-002 (shared・同一DOM共存) |
| 024 | iframe 内のナビゲーションもしくは新規タブ等、読み込み先 HTML の指定に従うであること | bound（**成分分離**・改訂1） | C-016（内部ナビ・新規タブを実発生させ親非遷移・サーバ非受信を観測=md:97,186,190）。遷移先の結果そのものはEX-C成分=非オラクル化 |
| 025 | ブラウザの表示に委ねるであること（読み込み失敗・拒否） | bound | C-009（semantic bind: 委譲文中のアプリ側実在成分=サーバ非検知・フォールバックなし・ホーム継続を観測。ブラウザ描画自体は非assert） |
| 026 | ブラウザのインタースティシャルに委ねるであること（TLS） | bound | C-010（**実行保留**=TLS注入手段未契約） |
| 027 | 本ブロック単体では業務監査ログを追加で書く処理は持たないこと | bound | C-014（**実行保留**=ログ観測未契約・静的拘束済み） |
| 028 | お知らせカードの表示のためだけにセッションを更新しないこと | bound | C-013（Cookie差分実測＋静的根拠の有限観測） |
| 029 | アプリケーション設定に保持される文字列であること（001と同文） | bound | C-003 (shared) |
| 030 | 画面表示データでエラーが表示されず継続できること | bound | C-002 (shared・正常表示エラーなし) |
| 031 | 表示される内容・遷移・スクロールは…従うであること（003と同文） | bound（**成分分離**・改訂1） | C-016 (shared・003と同文) |
| 032 | 画面表示データでエラーが表示されず継続できること（前提=非管理者・未認証はノイズ） | bound | C-002 (shared) |
| 033 | カード見出しは翻訳キーに基づくタイトルであること（005と同文） | bound | C-002,C-002-EN (shared) |
| 034 | ブラウザがコンテンツを表示しない、もしくはエラー表示にすること（埋め込み拒否） | bound | C-008（XFOスタブ注入・ブロック判定契約=**要実機**） |
| 035 | ブラウザのエラー表示に委ねるであること（ネットワーク不通） | bound | C-009 (shared) |

`func_scope_check` 判定: 親35/35会計済み（bound27〔うち成分分離3〕＋TBD0＋excluded8=35・差分0）・欠落0・
理由なし重複0・補完2行（C-006/C-015）は§4.2に実体掲載（親空・設計書補完md:76,78/md:129・母集合会計外）。
成分分離3行（003/024/031）の分離bind先C-016は親test_idを持つため§4.1に実体掲載→
**差分0を本文内で実証可能**。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）＋**外部契約の独立集計**

### 9-A 外部連携（外部URL/ブラウザ層）の要実機・保留 独立集計

| 区分 | 対象 | 内容 | 状態 |
|---|---|---|---|
| 外部応答内容 | （全ケース共通） | iframe内に描画される記事・リンク・レイアウト等の**内容**は外部URLの応答＝期待値の正にしない（md:36-38が明示的スコープ外）。オラクル化対象外=候補にも含めない | **オラクル外**（恒久） |
| ブラウザブロック判定 | C-008 | XFO拒否時の「表示しない/エラー表示」の機械判定手段（フレーム到達不能/コンソール文言）はブラウザ実装依存 | **要実機**（D5で判定契約確定） |
| route適用可否 | C-008,C-009,C-016 | page.route()のsubframe（iframe）発リクエストへの適用は本ハーネス未実績 | **要実機**（D5） |
| cross-origin frame操作 | C-016 | frameLocatorによるスタブ供給iframe内のリンク押下/スクロール・popup検出の本ハーネス実績なし | **要実機**（D5・改訂1） |
| TLSエラー注入 | C-010 | routeでは偽装不能。自己署名HTTPSスタブ＋INFOURL差替環境の両方が必要 | **実行保留**（スタブ未整備） |
| INFOURL差替/空環境 | C-004,C-007 | `eccube_info_url` はアプリ設定（DB外）＝SQL SEED不可。環境別設定の差し替え契約が必要 | **実行保留**（環境契約未整備・@TBD-D5） |
| 実外部への依存 | C-003ほか | 通常runはiframeが実外部（既定 www.ec-cube.net）へGET。判定はsrc属性のため合否は外部可用性と独立だが、ネットワーク遮断環境ではroute abort併用 | 注記（`e2e-standard-run-requirements` 準拠） |

### 9-B 個別事項

| # | 事項 | 状態 |
|---|---|---|
| 1 | BC-DRAFT/DOC-DRAFT | **0件**。設計md⇔ee実装の突合（twig:304-314・Controller:102-205・eccube.yaml:165・locale）で乖離・設計内矛盾なし。設計md:25の「eccube.yaml」の実パスは `app/config/eccube/packages/eccube.yaml`（既定値・宣言内容は一致=矛盾ではない） |
| 2 | 旧成果物のstale行番号 | 旧 `m02_05_..._e2e_cases.md`/page.ts が引く `messages.ja.yaml:1698`・`eccube.yaml:146` は旧時点の行番号（現コミットでは ja:1891・eccube.yaml:165=本書§1が正）。旧成果物は参考のため上書きしない（実装時にpage.tsコメントを現行値へ更新） |
| 3 | INFOURL系SEEDの型 | アプリ設定はDB外＝SQLで投入不能。環境別設定（env/packages上書き）の差し替え・復元手順を**環境契約**としてD5で定義（EMPTY/NONURLの2種）。整備までC-004/C-007は実行保留（excludedにしない=実在仕様） |
| 4 | route interception契約 | §6.1のとおり。subframe適用・XFOブロック検出の2点をD5実機で確定。確定までC-008は「カード側不変」のみ自動・ブロック状態は記録扱い |
| 5 | TLSスタブ | 未整備（自己署名HTTPSサーバ＋差替環境）。C-010実行保留 |
| 6 | サーバログ/キャッシュの実行時観測 | ログ観測（C-014）・キャッシュファイル書込の実行時観測（C-012の一部）は未契約=静的根拠（本カードにサーバ側専用処理なし）で拘束し実行保留/部分観測に限定 |
| 7 | 実効 `eccube_info_url` 値の取得 | アプリ設定はDB外のためdb.tsで読めない。C-003の完全一致判定は環境契約の既知値（D5確認）を前提とし、未確認runは非空+読み込み開始の部分判定へ降格（§6.1） |
| 8 | index()内の外部API呼び出し | `pluginApiService->getRecommended()`（Controller:186-191）は**推奨プラグインカード=別機能**（設計md:12が切り離しを明記）。本カードの「サーバ非取得」claimの評価から除外（サーバ側呼び出しはブラウザ観測外でもある） |
| 9 | 設定変更の表示中非反映（md:128前段の残余） | 「実行中に設定だけが変わっても開いたままのホームHTMLは自動では書き換わらない」のうち**設定変更の注入**はアプリ設定=デプロイ層のため実行中変更が構成不能＝候補化せず理由記録（src不変・自動更新なしの観測可能部分はC-011が被覆） |
| 10 | iframe内操作のサーバ非解釈（md:67,97,190） | **改訂1で構成的観測へ引き上げ（C-016）**: 旧版は「外部オリジンの性質上、構成的観測不能＝C-011/C-013の部分被覆で理由記録」としたが、syntheticスタブ供給（SEED-M0205-ROUTE-STUB(c)）でiframe内操作を決定的に発生させれば、親側非反応（親URL/DOM不変・管理画面オリジン宛リクエスト0件・Cookie/DB不変）の**有限観測が構成可能**（codex R1指摘・正）。残余: 「別オリジンでの同一オリジンポリシーによる読み取り不能」自体（md:97括弧内）はブラウザ仕様への委譲でありassertしない（C-016は不読取の帰結=親非反応のみ観測）。実外部オリジンでの再現はスタブと等価性未検証=要実機注記 |
| 11 | 排他・試行制限・集計・業務計算（md:242-243,206,103,109） | いずれも「行わない/扱わない/持たない」の不存在宣言で母集合35行に対応する期待テキストなし＝候補化不要（補完も不作成。観測契約が構成できる実在挙動がない） |
| 12 | 検出範囲の限定（BC/DOC 0件の但し書き） | 本機能の実装面はtwig11行＋設定1行で、サーバ側ロジック・DB・フォームが無い＝設計⇔実装の突合面が小さく「乖離0」の主張は当該範囲に限る（外部サイト側の挙動・ブラウザ実装は突合対象外） |
| 13 | manifest_sha1（fixture_version確定） | D5後（現状 `@TBD-D5`。SEED-M0205-NEWS SQL・INFOURL環境契約・route契約は未実装=§2は設計） |

候補規律: 全行 `@TBD-D5`・O5未確定（D6後に確定検査）・実装/実走なし・O6/聖域/多軸/C6C7を主張しない。
既知バグ: BC-DRAFT **0件**・DOC-DRAFT **0件**（§9-B-1/-12）。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象構文（肯定/否定・許可/拒否の対）を列挙し、claim単位で期待テキストとの極性一致を目視確認した:

| 極性対 | 該当行 | 判定 |
|---|---|---|
| エラー表示され/表示され**ず** | 008,011,014,016（あり側）vs 009,012,013,015（なし側）vs 030,032（表示データのエラーなし継続） | バリデーション系はフォーム不存在（EX-A）・DB不存在（EX-B）で**両極性とも**excluded（片極性のみ除外する誤りなし）。030/032は主語が「画面表示データ」＝正常表示継続としてC-002へbound |
| 表示される/されない | 002,005,021,023,033（表示側）vs 004,020（未認証=不表示側） | 表示側→C-002/C-003・不表示側→C-001（#ec-cube-news不在の確認）。取り違えなし |
| 更新しない/書かない/持たない/開かない/読み書きしない | 006（モーダル開かない）,010（自動更新しない）,017（DB/キャッシュ書かない）,018（フォーム持たない）,022（切替実装無い）,027（ログ書かない）,028（セッション更新しない） | すべて否定claim。観測契約を**有限に限定**して構成（C-005=要素0件・C-011=監視窓内のsrc不変+リクエスト0件・C-012=dtb_newsダイジェスト不変・C-002=無条件レンダリング+静的0分岐・C-014=静的拘束+実行保留・C-013=Cookie差分+静的根拠）。無限の否定は主張しない。肯定側の母集合行なし=対不成立の単極。極性反転なし |
| 委ねる（委譲）系 | 003,024,031（外部文書に従う=**成分分離bind・改訂1**）vs 025,026,035（ブラウザに委ねる=bound）vs 034（ブラウザが表示しない/エラー表示=bound） | **同じ「委ねる」語でも仕分けが異なる**: 003/024/031は「読み込み先に従う」＝無反証の全面委譲**成分**と、同一設計文中のアプリ側不作為（サーバ非解釈・非受信・セッション独立=md:67後段,97,190）という**反証可能な実在成分**の複合→改訂1で2成分に分離し、外部成分=非オラクル化（EX-C成分）・アプリ成分=C-016へbind（旧版の全面excludedはcodex R1で偽陰性と判定・是正済み）。025/035も委譲文だがアプリ側の不作為（サーバ非検知・リトライなし・フォールバック文言なし・ホーム継続）を含む→semantic bindでC-009へ（ブラウザ描画は非assert）。026は同成分だが注入手段未契約→C-010実行保留。034は期待テキスト自体がブラウザ挙動の主張（md:117逐語）→ブラウザ層claim（L1-009）として分離しC-008（判定契約要実機）。「委ねる」を「エラーが表示されること」へ反転させない（C-009はブラウザのエラー描画内容を期待値にしない）。**C-016でも外部成分（何が表示され・どこへ遷移するか）を期待値へ反転させない**（親非反応のみassert） |
| 空になる | 007 | src=""という**正の主張**＋「エラー文言を補わない」の否定を両方期待化（C-007）。「空URLはエラーになる」への反転なし |
| そのまま出力（無検証） | 019 | 「検証しない」の識別観測は非URL文字列の原文出力（C-004）で構成（既定URLの一致だけでは「検証を通った」可能性と区別不能=識別性の限界をC-003/C-004の分離で明示）。実行保留の理由は環境契約未整備であり観測契約は定義済み=TBDにしない |
| 読み込み開始 | 002 | 「読み込み開始」＝ブラウザ発リクエストの発生まで（応答の成否・内容は判定外=外部依存）。「読み込み完了/内容表示」へ拡大しない（C-003手順4の限定） |

- -008/-009等の**前提列と期待列の対応ズレ**（前提=埋め込み拒否/不通、期待=バリデーション定型）は生成器の
  行ズレノイズと判定し、期待テキストを正としてEX-A処理・前提列の機能語（埋め込み拒否/不通）の実在挙動は
  期待テキストが当該内容である-034/-035側でbound済み＝**意味成分の二重計上も取り逃しもない**ことを行単位で確認。
- 見出し文言はja「お知らせ」（ja:1891）/en "What's New"（en:1869）の一次資料逐語で確定（旧成果物のstale行番号
  1698は§9-B-2で是正記録）。
- codex敵対レビュー: **R1=要修正（Major1のみ）→改訂1で是正・R2再確認待ち**（iframe裁定・EX-A(6)/EX-B(2)・
  捏造ゼロ・外部契約の要実機分離〔INFOURL/TLS/subframe/ログ/-EN〕はR1で妥当確認済み）。R1検出の記録
  （C4-manual実効性証跡）: **旧EX-C 3行（003/024/031）の全面excludedが偽陰性**＝C-011/C-013はiframe内操作を
  発生させない受動観測であり、設計文中のアプリ側不作為成分（サーバ非解釈=md:67後段,97,190）は
  syntheticスタブによる操作注入＋親非反応の有限観測で**反証可能に構成できた**（「委譲文だから無反証」の
  判定を成分単位で行わず行単位で丸めた誤り＝**部分被覆をexcludedの根拠にした検出例**）→
  L1-016新設・C-016分離bind・会計bound27/excluded8へ是正（ヘッダ/§1/§2/§3b/§4.1/§6/§7/§8/§9/oracle json
  反映済み）。**R2再確認待ち**。

---

## 付録: 作業実測（B0係数計測用）

- 読んだ一次資料・参照物: 設計書md 1（244行全文）／ee実ソース・設定 8（index.twig お知らせカード全文+
  周辺構造/scriptブロック確認・AdminController index全文+外部HTTP呼出grep・eccube.yaml〔info_url/admin_route/env既定〕・
  security.yaml firewall・EccubeExtension access_control・messages.ja/en該当行・twig条件分岐grep）／
  母集合・fid_kubun 2／統治・見本 3（CFP・ROLLOUT・m02-04草案+oracle json）／既存資産 3（e2e_cases md・page・spec）。
- L1 claim数: **16確定＋TBD0**（L1-016は改訂1新設）。候補ケース行17（ja16・-EN1）。
- 本機能特有の難所: (1) **実装がtwig11行のみ**＝オラクルの大半が「不存在claim」になり、観測契約を有限に
  限定する規律（§10）が本体 (2) **外部連携の分離線**: 同じ「委ねる」文でも外部委譲成分（無反証=非オラクル化）と
  アプリ側不作為（反証可能=bind）を**成分単位**で仕分ける必要（003/024/031=成分分離・025/026/035=semantic
  bind・034=ブラウザ層claimの3群。行単位で丸めるとcodex R1のとおり偽陰性=改訂1の教訓）
  (3) **前提の実体が3種混在**（SQL SEED／アプリ設定=環境契約／route interception）＝SEED表に種別列を新設して
  「SQLでは作れない前提」を明示しないとD5で破綻する (4) 空URL/非URL文字列の識別観測はアプリ設定差替が必須で、
  DB主体の従来SEED契約では表現できない（実行保留の正直な理由） (5) 母集合35行に生成器の行ズレノイズ
  （前提列と期待列の不一致）が多く、期待テキスト正の判定原則が無いと埋め込み拒否/不通系を誤ってEX化する。

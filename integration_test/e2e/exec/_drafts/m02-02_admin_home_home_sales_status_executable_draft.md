# B0候補: m02-02 管理画面_トップ売上状況 — 実行可能グレード候補（母集合59全量踏破）

> 2026-07-23 ／ **候補グレード（candidate・D6前・O5未確定・実装/実走なし）**
> codexレビュー: **R1=要修正（Blocker2＋Major2）→改訂1で全数是正・R2再確認待ち**（read-only裁定・
> excluded=20・TBD=017・境界式・CSRF2系統はR1でcodex妥当確認済み。台帳記帳は判定確定後）。
> **改訂1（codex R1是正）**:
> (1) **read-only根拠の出典を5箇所→4箇所へ訂正**（md:303はログ・監査節「業務監査ログを追加で書く処理は
> 持たない」でありDB無更新の根拠ではない→出典から除外。正=md:31,206,229,334。§0/§9-1/§9-2b/§10/付録）
> (2) **C-036にマスタ不変性観測を追加**（mtb_order_status全列ダイジェスト。親030/057の「マスタを更新しない」を実観測化）
> (3) **決定的差分照会を§6.3cに実体掲載**（主キー順・全列 `md5(string_agg(レコード::text))`＝相殺更新・
> 過去行更新も検知。SUM/MAX要約値の検知漏れを是正・自己完結化）
> (4) **C-036/L1-020の無書込主張を標準環境（拡張hook差替・書込みlistenerなし=L1-030）に限定**（期待の過大回避）。
> source_class=standard-src+design は fid_kubun.tsv（D1・fid_kubun.tsv:164）による**暫定付与**（確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> fixture_version は全て `@TBD-D5`。統治: `integration_test/CONCRETIZATION_FIRST_PLAN.md`（三段会計）＋
> `integration_test/CONCRETIZATION_ROLLOUT_PLAN.md`（B0。B0確定25 fidリスト:112行=M02-02）。
> 正典: `integration_test/e2e/PILOT_m09_01_news_executable_grade.md`／同型見本: codex承認済み候補6本
> （m09-01・m05-16・m10-11・m03-11・m01-01・m01-02 の各 `_drafts/*_executable_draft.md`）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m02-02_admin_home_home_sales_status_oracle_draft.json`。
> 正式パス `e2e/fixtures/oracle/` 直下には書かない。
> **行数集計**: 候補ケース行総数**28**＝bound対応23（ja21＋-EN2）＋補完5（ja5）。
> 母集合59=bound38＋TBD1＋excluded20。

## §0 版固定

- 設計書正本: `functions/ec-cube-enterprise/m02-02_admin_home_home_sales_status.md`（本repo HEAD `d1e94c5e38246d0eff45b4079ee42397c994e69d` 時点。以下 m02-02md）。
- ee実ソース: `/home/y-saito/Developments/ec-cube-enterprise/` コミット `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51`（W0-B0既候補と同一）。
- fid_kubun.tsv（D1）: `M02-02｜m02-02_admin_home_home_sales_status｜売上状況｜対象｜標準｜ec-cube-enterprise/m02-02_admin_home_home_sales_status.md｜standard-src+design｜0`（fid_kubun.tsv:164。fid_kubun.tsv sha256先頭=44fbf02f1e4c）。
- 母集合: baseline `all_it_cases.tsv`（sha256先頭 `7911f190d273`）M02-02全**59行**（IT-M02-02-ADMIN-HOME-HOME-SALES-STATUS-001〜059）。
- 既存実行実績（参考・本候補の会計外）: `integration_test/e2e/m02_02_admin_home_home_sales_status_e2e_cases.md`
  （2026-07-06 Codex実走 **14〇/11×**。×はいずれも「DB集計値の厳密判定・失敗誘発・拡張フック環境・Cookie差分」を
  手動へ退避した未実施＝観測ハーネス不足であり実装乖離の検出ではない。本候補は×側11件のうち
  集計値検証（040/041/045/046/047/049相当）を **db.ts三段参照** で、失敗誘発（022相当）を **Playwright route介入** で
  実行可能化する設計に引き上げる）。
- 既存道具（実装済み・再利用）: `e2e/helpers/db.ts`（psql照会）・`e2e/helpers/oracle.ts`（L1解決器＋_drafts隔離ガード）・
  `e2e/pages/admin/m02/m02_02_admin_home_home_sales_status.page.ts`（セレクタ実機確認済み）・
  `e2e/seed/sets/m02/SEED-M02-SALES-DASHBOARD.sql`（±down.sql）。
- **判定原則（W0-W2教訓）**: 観点ラベル・前提条件/入力データ列のシナリオ語は**生成器ノイズ**。bindは各行の
  **「期待結果／レスポンス」実テキスト**で判定し、極性も期待テキストで確認する（§8に全59行の期待要旨併記）。
  本機能の母集合は前提列（例: 024「バッチ」/036「管理者として認証済み」）と期待列の噛み合わせずれが特に大きい
  （IT-26系29行の期待列が read-only 機能に対する「追加される/変更される」定型文）。
- **設計書内矛盾の裁定（DOC-DRAFT-m02-02-1・§9-1）**: m02-02md:245-249「DB操作」節は
  `登録/更新｜dtb_order｜当機能が行う登録・更新で対象テーブルを直接保存する…persist/flush による即時反映` と記すが、
  同一設計書の**4箇所**（md:31「本ブロックが受注台帳やマスタを更新しないこと」・md:206「本ブロックは参照のみであり、
  受注台帳やマスタを更新しない」・md:229 副作用「受注台帳やマスタを更新しない」・md:334「参照のみであり、
  業務トランザクションを張って受注を変更しない」。※md:303はログ・監査節「業務監査ログを追加で書く処理は持たない」
  であり参照のみ/DB無更新の根拠ではない=codex R1是正で出典から除外）が**参照のみ**と明記し、ee実装も
  `AdminController.php` 全体に persist/flush/INSERT/UPDATE が**0件**（grep実測。index/sale/getSalesByDay/
  getSalesByMonth/getData/convert は SELECT のみ）。既存記録 `m02_02_..._e2e_cases.md` 付帯表4#6 も同矛盾を
  「設計テンプレ矛盾・本文は参照のみ」と記録済み。**裁定: 本機能は read-only を正**とし、DB操作節の登録/更新行は
  共通テンプレ由来のノイズと判定（期待値を「登録される」側に捏造しない）。この裁定が §8 の IT-26系「追加される/
  変更される」20行の excluded 判定根拠（§9-2）。

## §1 L1原子オラクル表

規約: claimは検査可能な期待実値まで分解。quoteは一次資料の逐語。LS=locale_sensitive（0は理由コード）。
**期待値の正は本表のオラクルIDでありSEED値ではない（三段参照）**。`%eccube_admin_route%` は環境値
（既定 `admin`・env `ECCUBE_ADMIN_ROUTE`＝eccube.yaml:69）。locale/currency/timezone は環境値
（既定 ja／JPY／Asia/Tokyo＝services.yaml:8-13）。

| oracle_id | 観点 | claim（検査可能な期待） | source_class(暫定) | 逐語quote | 根拠(file:line) | LS |
|---|---|---|---|---|---|---|
| L1-M0202-001 | auth_rule | 未認証で `GET /%eccube_admin_route%/`（ホーム）または `GET /%eccube_admin_route%/sale_chart` へアクセスすると、admin firewall（`^/%eccube_admin_route%/` はROLE_ADMIN必須）により `admin_login` のログイン画面へ誘導され、売上状況ブロック／グラフ用データは利用できない | standard-src＋設計書md | `admin:`＋`    pattern: ['^/%eccube_admin_route%/','^/%eccube_messenger_route%/']`＋`    provider: member_provider`／`['path' => '^/%eccube_admin_route%/', 'roles' => 'ROLE_ADMIN'],`／「非管理者・未認証｜`GET /%eccube_admin_route%/` 等（到達前にログインへ）｜ホーム画面自体に到達できないため、本ブロックも利用できない」「未認証｜利用不可。管理領域の認証要件に従う」 | security.yaml:40-46／EccubeExtension.php:81-88／m02-02md:81,267 | 0 `non-translated` |
| L1-M0202-002 | http_status | ホーム画面=`GET /%eccube_admin_route%/`（route `admin_homepage`・GETのみ）。売上状況カードはこの1画面内のブロック | standard-src＋設計書md | `#[Route(path: '/%eccube_admin_route%/', name: 'admin_homepage', methods: ['GET'])]`／「ホーム画面を開く｜`GET /%eccube_admin_route%/`」 | AdminController.php:102-104／m02-02md:77 | 0 `non-ui-observable` |
| L1-M0202-003 | http_status | グラフ用データ=`GET /%eccube_admin_route%/sale_chart`（route `admin_homepage_sale`・GETのみ・XHR＋CSRF前提） | standard-src＋設計書md | `#[Route(path: '/%eccube_admin_route%/sale_chart', name: 'admin_homepage_sale', methods: ['GET'])]`／「売上グラフ用データの非同期取得｜`GET /%eccube_admin_route%/sale_chart`（XHR・CSRF 付与が前提）」 | AdminController.php:210-211／m02-02md:78 | 0 `non-ui-observable` |
| L1-M0202-004 | display_field | 売上状況カードのDOM一式: `#chart-statistics` 内に、見出し `.card-title`＝`admin.home.sales_summary_title` ja「売上状況」/en "Sales"・サマリ3ブロック（`.h3` 値＋`small` ラベル: this_month ja「今月の売上金額 / 売上件数」/en "This Month: Sales Amount / Volume"・today ja「今日の売上金額 / 売上件数」/en "Today: Sales Amount / Volume"・yesterday ja「昨日の売上金額 / 売上件数」/en "Yesterday: Sales Amount / Volume"）・タブ3個（`#pills-weekly-tab`「週間」/"Weekly"・`#pills-monthly-tab`「月間」/"Monthly"・`#pills-year-tab`「年間」/"Yearly"）・タブペイン `#pills-weekly/#pills-monthly/#pills-year` 内の `canvas#chart-0/#chart-1/#chart-2`・読み込み中 `#loading`。クラスは管理画面共通（`card`/`card-title`/`nav-link btn btn-ec-tab`/`tab-content`/`tab-pane`） | standard-src＋設計書md | `<div id="chart-statistics" class="card rounded border-0 h-100">`／`<span class="card-title">{{ 'admin.home.sales_summary_title'|trans }}</span>`／`<small>{{ 'admin.home.sales_summary_this_month'|trans }}</small>`（today/yesterday同型）／`<a class="nav-link active btn btn-ec-tab py-2 ps-4 pe-4" id="pills-weekly-tab" data-bs-toggle="pill" href="#pills-weekly" …>`／`<canvas id="chart-0"></canvas>`／`<div id="loading" class="text-center pt-5">`／`admin.home.sales_summary_title: 売上状況`・`admin.home.sales_summary_this_month: 今月の売上金額 / 売上件数`・`admin.home.sales_summary_today: 今日の売上金額 / 売上件数`・`admin.home.sales_summary_yesterday: 昨日の売上金額 / 売上件数`・`admin.home.sales_summary_weekly: 週間`・`admin.home.sales_summary_monthly: 月間`・`admin.home.sales_summary_yearly: 年間`／`admin.home.sales_summary_title: Sales`・`admin.home.sales_summary_this_month: "This Month: Sales Amount / Volume"`・`admin.home.sales_summary_today: "Today: Sales Amount / Volume"`・`admin.home.sales_summary_yesterday: "Yesterday: Sales Amount / Volume"`・`admin.home.sales_summary_weekly: Weekly`・`admin.home.sales_summary_monthly: Monthly`・`admin.home.sales_summary_yearly: Yearly`／「売上状況カードには、今月・今日・昨日の売上金額と件数、週間・月間・年間のタブ、グラフ描画用 canvas、読み込み中表示を配置する」「管理画面共通のカード、タブ、グラフ領域、ローディング表示のクラスを使う」 | index.twig:146-207／messages.ja.yaml:1879-1886／messages.en.yaml:1857-1864／m02-02md:89,91 | 1 |
| L1-M0202-005 | display_field | サマリ値の書式（3ブロック共通）: `.h3`＝`admin.home.sales_summary_value` ja「%amount% / %count% 件」／en "%amount% / %count% item(s) sold"。`%amount%`=金額を `price` フィルタ（`NumberFormatter(locale, CURRENCY)::formatCurrency((float)($number ?? 0), currency)`＝通貨記号＋3桁区切り。locale/currency既定 ja/JPY。**具体記号グリフ（全角￥等）はICU実装値=要実機確定**）・`%count%`=件数を `number_format`（整数・桁区切り） | standard-src＋設計書md | `{{ 'admin.home.sales_summary_value'|trans({ '%amount%': amount|price, '%count%': count|number_format }) }}`／`admin.home.sales_summary_value: "%amount% / %count% 件"`／`admin.home.sales_summary_value: "%amount% / %count% item(s) sold"`／`$formatter = new \NumberFormatter($locale, \NumberFormatter::CURRENCY); return $formatter->formatCurrency((float) ($number ?? 0), $currency);`／`env(ECCUBE_LOCALE): 'ja'`・`env(ECCUBE_CURRENCY): 'JPY'`／「金額は通貨表示として整形し、件数は整数として表示する」 | index.twig:155-176／messages.ja.yaml:1880／messages.en.yaml:1858／EccubeExtension.php:89,178-187／services.yaml:8-13／m02-02md:184 | 1 |
| L1-M0202-006 | display | 売上状況カード見出しはリンクでない静的文言（`<span class="card-title">`・祖先に `<a>` なし＝受注状況カード見出し〔index.twig:123-125は`<a>`内〕との対比）。押下による画面遷移なし | standard-src＋設計書md | `<div class="card-header">`＋`    <div class="d-inline-block">`＋`        <span class="card-title">{{ 'admin.home.sales_summary_title'|trans }}</span>`／「見出しはリンクではなく静的文言であり、押下による画面遷移は設けられない」 | index.twig:147-151／m02-02md:80 | 0 `non-translated`（文言実値はL1-004） |
| L1-M0202-007 | display | 本ブロックはモーダル・ポップアップ・トースト・確認ダイアログを表示せず、フォーム・テキスト入力を持たない（`#chart-statistics` 内〔index.twig:146-213〕に `input`/`form`/`.modal` 要素0件=grep実測）。グラフ取得失敗時も利用者向けの専用通知を表示しない | standard-src＋設計書md | 「本ブロックはモーダル、ポップアップ、トースト、確認ダイアログを表示しない。グラフ取得失敗時も利用者向けの専用通知は表示しない」「本ブロックはフォーム・テキスト入力を持たない。タブ切替は表示領域の切替のみで、新たな利用者入力は発生しない」／index.twig:146-213（カード全体にinput/form/modal不存在） | m02-02md:92-93／index.twig:146-213 | 0 `non-translated` |
| L1-M0202-008 | aggregation_rule | 売上対象外ステータス（既定）＝キャンセル(CANCEL=3)・決済処理中(PENDING=7)・購入処理中(PROCESSING=8)・返品(RETURNED=15) の4区分。**サマリ集計とグラフ用データ取得の双方に同一配列**（コントローラのプロパティ `$this->excludes` を両経路で使用） | standard-src＋設計書md | `private array $excludes = [OrderStatus::CANCEL, OrderStatus::PENDING, OrderStatus::PROCESSING, OrderStatus::RETURNED];`／`public const CANCEL = 3;`・`public const PENDING = 7;`・`public const PROCESSING = 8;`・`public const RETURNED = 15;`／「既定ではキャンセル、決済処理中、購入処理中、返品に相当するステータスを除外する」「売上対象外ステータスは既定値を持つが…差し替え後のリストをサマリ集計とグラフ用データ取得の双方に適用する」 | AdminController.php:55,145,219,382,419,506／OrderStatus.php:34-57／m02-02md:102,142,161,182 | 0 `non-translated` |
| L1-M0202-009 | aggregation_rule | 売上集計に含める（既定）＝注文受領(NEW=1)・入金待ち(PAY_WAIT=2)・対応中(IN_PROGRESS=4)・**出荷完了(DELIVERED=5)**・入金済み(PAID=6)・出荷指示(PRE_DELIV=9)・ピック中(PICKING=10)・店頭予約(OTC_RSV=12)・ピック完了(PICKED=13)・引渡し済み(PASSED=14) の10区分。**出荷完了は同一ホームの受注状況カード側excludes（CANCEL/DELIVERED/PENDING/PROCESSING/RETURNED=AdminController.php:114-119）には含まれるが、売上状況の既定除外には含まれず売上に算入**される | standard-src＋設計書md | `/** 注文受領. */ public const NEW = 1;`〜`/** 返品 */ public const RETURNED = 15;`（OrderStatus.php:30-57の全定数）／受注状況カード側: `$excludes[] = OrderStatus::CANCEL; $excludes[] = OrderStatus::DELIVERED; $excludes[] = OrderStatus::PENDING; $excludes[] = OrderStatus::PROCESSING; $excludes[] = OrderStatus::RETURNED;`／「注文受領、入金待ち、対応中、出荷完了、入金済み、出荷指示、ピック中、店頭予約、ピック完了、引渡し済みは、既定の売上集計対象に含まれる」「出荷完了相当のステータス｜（受注状況カード）既定の除外に含まれ…｜（売上状況）既定の売上対象外には含まれず、該当受注は売上に含まれる」 | OrderStatus.php:30-57／AdminController.php:55,114-119／m02-02md:102,160,171 | 0 `non-translated` |
| L1-M0202-010 | aggregation_rule | 「今日」「昨日」のサマリ集計式: 対象日の0時0分0秒（`setTime(0,0,0,0)`）以上・翌日0時**未満**の `order_date` を持ち、売上対象外ステータスに該当しない `dtb_order` について `SUM(payment_total) AS order_amount`・`COUNT(o) AS order_count`（昨日=`new \DateTime('-1 day')` で同型）。境界は `開始以上 <= order_date < 終了未満`（終了ちょうどは不算入） | standard-src＋設計書md | `$dateTimeStart->setTime(0, 0, 0, 0);`＋`$dateTimeEnd->modify('+1 days');`＋`SUM(o.payment_total) AS order_amount, COUNT(o) AS order_count`＋`->andWhere(':targetDateStart <= o.order_date and o.order_date < :targetDateEnd')`＋`->andWhere('o.OrderStatus NOT IN (:excludes)');`／`$salesToday = $this->getSalesByDay(new \DateTime());`・`$salesYesterday = $this->getSalesByDay(new \DateTime('-1 day'));`／「当日 0 時から翌日 0 時未満の `order_date` を持ち、売上対象外ステータスに含まれない受注について、`payment_total` の合計と受注件数を求める」 | AdminController.php:153-155,369-387／m02-02md:108-109,136-137 | 0 `non-translated` |
| L1-M0202-011 | aggregation_rule | 「今月」のサマリ集計式: 当月1日0時（`modify('first day of this month')`）以上・実装の相対日付指定 `modify('first day of 1 month')` による終端**未満**（設計書は「終端日の解釈は実装が用いる相対日付指定に依存」とヘッジ。設計上の期待は翌月1日0時未満＝当月全体）・除外/SUM/COUNTは L1-010 と同型 | standard-src＋設計書md | `$dateTimeStart->modify('first day of this month');`＋`$dateTimeEnd->modify('first day of 1 month');`＋（クエリ本体はgetSalesByDayと同型=AdminController.php:414-423）／`$salesThisMonth = $this->getSalesByMonth(new \DateTime());`／「当月 1 日 0 時から翌月 1 日 0 時未満の `order_date` を持つ受注のうち…合計と件数を求める。終端日の解釈は実装が用いる相対日付指定に依存し、タイムゾーンは永続化層および実行環境の設定に従う」 | AdminController.php:157,404-423／m02-02md:110,135 | 0 `non-translated` |
| L1-M0202-012 | empty_rule | 該当受注が無いとき、サマリは金額・件数とも **0 表示**。実装経路は2通りとも0に収束: ①`NoResultException` → 空配列 → twig `is empty ? 0` ②集約行（`order_amount=NULL`/`order_count=0`）→ `amount|price` が `(float)($number ?? 0)` でNULL→0扱い。いずれもエラー表示なしで画面継続 | standard-src＋設計書md | `} catch (NoResultException) { // 結果がない場合は空の配列を返す. }`／`{% set amount = salesToday is empty ? 0 : salesToday.order_amount %}`＋`{% set count = salesToday is empty ? 0 : salesToday.order_count %}`（this_month/yesterday同型）／`return $formatter->formatCurrency((float) ($number ?? 0), $currency);`／「問い合わせ結果が無い場合、実装は空の結果として扱い、画面は 0 を表示する」「該当受注が 0 件｜サマリは金額・件数とも 0 として表示する」「集計の空｜該当受注が無いとき、サマリは 0 表示」 | AdminController.php:389-396,426-433／index.twig:155-176／EccubeExtension.php:186／m02-02md:111,190,259 | 0 `non-translated`（書式はL1-005） |
| L1-M0202-013 | ajax_rule | グラフ用XHRのCSRF供給機構: 管理共通レイアウトが `<meta name="eccube-csrf-token" content="{{ csrf_token(constant('Eccube\\Common\\Constant::TOKEN_NAME')) }}">` を出力し、`$.ajaxSetup` で全Ajaxに `ECCUBE-CSRF-TOKEN` ヘッダを付与。サーバ側 `isTokenValid()` は `_token` リクエストパラメータ**または** `ECCUBE-CSRF-TOKEN` ヘッダのトークンを `Constant::TOKEN_NAME`（`'_token'`）IDで検証 | standard-src＋設計書md | `<meta name="eccube-csrf-token" content="{{ csrf_token(constant('Eccube\\Common\\Constant::TOKEN_NAME')) }}">`／`$.ajaxSetup({ 'headers': { 'ECCUBE-CSRF-TOKEN': $('meta[name="eccube-csrf-token"]').attr('content') } });`／`$token = $request->get(Constant::TOKEN_NAME) ?: $request->headers->get('ECCUBE-CSRF-TOKEN');`／`public const TOKEN_NAME = '_token';`／「ホーム画面のレイアウトで共通設定されている Ajax 用ヘッダにより CSRF トークンが付与され」 | default_frame.twig:16,83-87／AbstractController.php:252-263／Constant.php:41／m02-02md:78,258 | 0 `non-ui-observable` |
| L1-M0202-014 | ajax_rule | **非XHR**で `GET /sale_chart`（認証済みでも）→ `isXmlHttpRequest()` が偽（短絡でCSRF評価前）→ **HTTP 400・本文 `{"status":"NG"}`**。グラフ用JSON配列は返らない | standard-src＋設計書md | `if (!($request->isXmlHttpRequest() && $this->isTokenValid())) {`＋`    return $this->json(['status' => 'NG'], 400);`＋`}`／「サーバは XMLHttpRequest かつ CSRF が妥当な場合にのみ JSON を返す」「グラフ用データが Ajax 要件を満たさない場合、グラフデータは取得できず JSON エラー相当の本文が返る」 | AdminController.php:213-215／m02-02md:78,228,287 | 0 `non-translated` |
| L1-M0202-015 | ajax_rule | **XHRだがCSRF欠落/不正**→ `isTokenValid()` が `AccessDeniedHttpException('CSRF token is invalid.')` を**throw**（returnでなく例外）→ アプリ共通例外処理に委譲され、グラフ用JSON配列は返らない（データ取得不可）。**画面応答のHTTP実効ステータス・本文形式は共通例外処理依存＝要実機**（設計はデータ取得不可のみ規定・DBやHTTP詳細の列挙は設計スコープ外） | standard-src＋設計書md | `if (!$this->isCsrfTokenValid(Constant::TOKEN_NAME, $token)) {`＋`    throw new AccessDeniedHttpException('CSRF token is invalid.');`＋`}`／「条件を満たさない場合はグラフ用データは得られず」「グラフ用 Ajax が CSRF または XMLHttpRequest 条件を満たさない｜グラフデータを返さない」 | AbstractController.php:258-261／AdminController.php:213／m02-02md:78,218,287 | 0 `non-translated` |
| L1-M0202-016 | json_contract | 成功時のJSON: **3要素配列 `[週間, 月間, 年間]`**。各要素は `{ "<バケットキー>": { "price": <売上金額合計>, "count": <件数> }, … }` のバケット集合（`price`/`count` 双方を保持） | standard-src＋設計書md | `$datas = [$rawWeekly, $rawMonthly, $rawYear];`＋`return $this->json($datas);`／`$raw[$date->format($format)]['price'] = 0;`＋`$raw[$date->format($format)]['count'] = 0;`…`$raw[$Order->getOrderDate()->format($format)]['price'] += $Order->getPaymentTotal();`＋`++$raw[$Order->getOrderDate()->format($format)]['count'];`／「返却される JSON は三つのバケット集合からなる配列であり、画面側はこれを順に週間・月間・年間の canvas に対応付けて棒グラフを生成する」「グラフ用 JSON に件数が含まれる｜画面の棒グラフ描画では売上金額のみを使う」 | AdminController.php:239-241,523-537／m02-02md:121,195 | 0 `non-ui-observable` |
| L1-M0202-017 | bucket_rule | グラフ3区間の定義とバケット: 週間=`Carbon::today()->subWeek()`（7日前0時）〜`Carbon::now()`・キー `Y/m/d`／月間=`Carbon::now()->startOfMonth()`〜now・キー `Y/m/d`／年間=`Carbon::now()->subYear()->startOfMonth()`（1年前の月初）〜now・キー `Y/m`。対象抽出は `order_date >= fromDate` **かつ `order_date <= toDate`（上限は以下＝サマリの「未満」と非対称・現在時刻まで）**＋除外ステータス。範囲内の全キーを `price=0,count=0` で事前生成（売上ゼロ期間も0バケット＝横軸ラベル欠落なし） | standard-src＋設計書md | `$toDate = Carbon::now(); $fromDate = Carbon::today()->subWeek(); $rawWeekly = $this->getData($fromDate, $toDate, 'Y/m/d');`＋`$fromDate = Carbon::now()->startOfMonth(); $rawMonthly = …'Y/m/d');`＋`$fromDate = Carbon::now()->subYear()->startOfMonth(); $rawYear = …'Y/m');`／`->andWhere('o.order_date >= :fromDate')`＋`->andWhere('o.order_date <= :toDate')`＋`->andWhere('o.OrderStatus NOT IN (:excludes)')`／`for ($date = $fromDate; $date <= $toDate; $date = $date->addDay()) { $raw[$date->format($format)]['price'] = 0; …}`／「週間相当。当日から見て過去にさかのぼった約一週間の範囲と当日現在までの upper bound を持つ区間。バケットキーは日単位」「月間相当。当月 1 日から現在まで」「年間相当。現在から過去にさかのぼった約一年」「範囲内の各日または各年月キーに対し、売上が無い期間も値が 0 のバケットとして用意される。これによりグラフの横軸ラベルが欠けない」 | AdminController.php:226-237,500-513,523-529／m02-02md:117-120,138-140 | 0 `non-translated` |
| L1-M0202-018 | js_rule | 描画のJS挙動: ページ表示後（`$(function)` 内で1回）`admin_homepage_sale` へ `$.ajax`（GET/json）→ `done` で配列を順に `#chart-` + i（0/1/2）のcanvasへ `new Chart(type:'bar')`。**datasetsは1系列のみ・`data: prices`（各バケットの `price` のみ。`count` は系列に使わない）・label=`admin.home.sales_summary_amount`** ja「売上金額」/en "Sales Amount"・ツールチップ/Y軸は `currency_symbol()`（`Currencies::getSymbol(currency)`）付き整形。**`fail` ハンドラは空**・`always` で `$('#loading').hide()`（成功・失敗とも読み込み表示は消える。失敗時グラフ未描画・専用通知なし） | standard-src＋設計書md | `$.ajax({ url: '{{ url('admin_homepage_sale') }}', type: 'GET', dataType: 'json' }).done(function(datas) {`…`prices.push(data[key].price);`…`var ctx = $('#chart-' + i)[0].getContext('2d');`…`type: 'bar',`…`datasets: [ { type: 'bar', label: '{{ 'admin.home.sales_summary_amount'|trans }}', data: prices, …} ]`…`}).fail(function(data) { }).always(function() { $('#loading').hide(); });`／`return '{{ currency_symbol() }}' + tooltipItem.formattedValue…`／`admin.home.sales_summary_amount: 売上金額`／`admin.home.sales_summary_amount: Sales Amount`／「ページ表示後にグラフ用データを非同期取得し、取得成功時に三つの canvas へ棒グラフを描画する」「グラフは売上金額のみを縦棒として表示する。ツールチップは通貨記号付きで値を整形する」「非同期取得が完了すると読み込みインジケータが非表示となる。取得に失敗した場合も読み込み表示は消えるが、グラフは描画されない」 | index.twig:28-35,55-99／EccubeExtension.php:67,372-378／messages.ja.yaml:1887／messages.en.yaml:1865／m02-02md:90,126-127 | 1（label/tooltipのみ。描画内部の読取は要実機=§9-8） |
| L1-M0202-019 | tab_rule | タブ切替は Bootstrap pill（`data-bs-toggle="pill"` / `href="#pills-*"`）による**同一ページ内の表示切替のみ**。押下でペインの `active` が切り替わり、**追加のサーバ問い合わせは発生しない**（データは初期表示時の1回のXHRで取得済み） | standard-src＋設計書md | `<a class="nav-link active btn btn-ec-tab …" id="pills-weekly-tab" data-bs-toggle="pill" href="#pills-weekly" role="tab" …>`（monthly/year同型）／「同一ページ内でタブ表示が切り替わり、事前に取得済みのデータセットに対応する canvas にグラフが描画されている。タブ切替自体で追加のサーバ問い合わせは行わない」「週間・月間・年間タブ操作｜同一画面内のタブ表示切替。サーバへの追加遷移はない」 | index.twig:182-190,199-208／m02-02md:79,90,278 | 0 `non-translated` |
| L1-M0202-020 | db_effect(read-only) | ホーム表示・グラフ取得のいずれも `dtb_order`・マスタへ**登録/更新/削除を行わない**（AdminController.php全体に persist/flush/INSERT/UPDATE 0件=grep実測。両経路はSELECTのみ）。観測契約: 表示＋XHR前後で `dtb_order` の行数・主キー順全列ダイジェスト、および参照マスタ `mtb_order_status` の全列ダイジェストが不変（§6.3c）。**前提=標準環境**: index()/sale() は `ADMIN_ADMIM_INDEX_SALES`/`ADMIN_ADMIM_INDEX_COMPLETE` をdispatchするため（L1-030）、書込みlistenerを差し込むプラグイン導入環境では無書込を主張できない=標準環境（差替listenerなし）に限定。設計書DB操作節（md:245-249）の「登録/更新」行は**DOC-DRAFT-m02-02-1（§0裁定・§9-1）のテンプレノイズ**であり期待にしない | standard-src＋設計書md | 「本ブロックの処理だけを見ると、受注台帳やマスタを更新しない」「本ブロックは参照のみであり、受注台帳やマスタを更新しない」「本ブロックの売上表示とグラフデータ生成は参照のみであり、業務トランザクションを張って受注を変更しない」／AdminController.php（538行全文にpersist/flush不存在=grep 0件） | m02-02md:31,206,229,334／AdminController.php:104-241,369-537 | 0 `non-ui-observable` |
| L1-M0202-021 | data_rule | 本ブロックは**読み取り時点の永続化済みデータだけを読む**: 別処理（管理操作・外部連携・バッチ等）で受注が更新済みの場合、次回のホーム再表示またはグラフ再取得時に、その時点のDB値が集計へ反映される。反映タイミングそのものの正は外部連携/バッチ機能の設計（本claimの検証対象は「読取時点の永続化済み値を読む」ことに限定＝委譲宣言部分はオラクル化しない） | standard-src＋設計書md | 「外部連携やバッチにより受注が更新される場合の反映タイミングは、外部連携機能またはバッチ機能の設計を正とする。本ブロックは読み取り時点の永続化済みデータだけを読む」「バッチによって受注が更新済みの場合、次回のサマリ取得またはグラフ取得時にその時点の永続化済みデータを読む」「ホーム画面再表示またはグラフ再取得時の読み取り結果に従う」 | m02-02md:193,207,216／AdminController.php:369-434（毎リクエストでDBを読む・キャッシュ層なし） | 0 `non-ui-observable` |
| L1-M0202-022 | data_rule | **表示中のサマリとグラフは自動更新しない**: グラフ用XHRは初期表示時の1回のみ（`$(function)`直下・ポーリング/interval/websocket なし=index.twig:16-103のJS全文にsetInterval等0件）。表示後にDBの受注が変わっても、再表示/再取得までは画面値・追加リクエストとも発生しない | standard-src＋設計書md | `$(function() { … $.ajax({ url: '{{ url('admin_homepage_sale') }}', … }) … });`（1回のみ・再取得コードなし）／「表示後に受注が更新された｜表示中のサマリとグラフは自動更新しない。ホーム画面再表示またはグラフ再取得時の読み取り結果に従う」「リアルタイムダッシュボードではない」 | index.twig:16-103／m02-02md:193,289 | 0 `non-translated` |
| L1-M0202-023 | data_rule | サマリ（ホームHTML生成時にサーバ側で読取）とグラフ（表示後の別XHRで読取）は**別リクエスト・同一トランザクション非固定**: 2つの読取の間に受注が変わると両者の値は一致しない場合がある（スナップショット一致は非保証＝「一致すること」を期待にしない。乖離が発生し得ることの実証は2読取間へのDB変更注入で観測） | standard-src＋設計書md | 「参照時点｜売上サマリはホーム画面 HTML 表示時に読み取った結果である。グラフ用データはページ表示後の Ajax で別途読み取る」「サマリとグラフは同一トランザクションで固定しない。表示直後に受注が更新された場合、両者の値が一致しない場合がある」「サマリとグラフは別リクエストで取得されるため、同一スナップショットで一致することは保証しない」 | m02-02md:194,203-204／AdminController.php:153-157（index内）と210-241（sale別route） | 0 `non-ui-observable` |
| L1-M0202-024 | display | 売上サマリは**サーバ側レンダリング**: ホームの初期HTML応答（グラフ用XHRの完了前・JS実行前）に今月/今日/昨日のサマリ値が含まれる（twigが `salesThisMonth/salesToday/salesYesterday` を埋め込み済み。クエリ/ボディ入力は受け取らない） | standard-src＋設計書md | `{{ 'admin.home.sales_summary_value'|trans({ '%amount%': amount|price, '%count%': count|number_format }) }}`（サーバ側twig出力）／「売上サマリはホーム画面 HTML 表示時に読み取った結果である」「API｜売上サマリはホーム画面 HTML レンダリング時にサーバ側で取得する」「入力｜ホーム画面の GET 表示。売上サマリはクエリやボディ入力を受け取らない」 | index.twig:155-176／AdminController.php:153-157,193-204／m02-02md:203,215,226 | 0 `non-translated` |
| L1-M0202-025 | edge_rule | `payment_total=0` の受注（ステータス・期間条件一致）は**売上件数に1件として算入**され、**売上金額には0として加算**（COUNT対象・SUM寄与0） | standard-src＋設計書md | `SUM(o.payment_total) AS order_amount, COUNT(o) AS order_count`（0円行もCOUNTに入りSUMへ0寄与）／「`payment_total` が 0 の受注｜ステータスと期間条件に一致する場合、売上件数には含め、売上金額には 0 として加算する」 | AdminController.php:379-381／m02-02md:192 | 0 `non-translated` |
| L1-M0202-026 | edge_rule | 売上件数は**受注行（dtb_order 1行）単位**で数える（`COUNT(o)`＝受注エンティティのカウント）。受注明細行数・商品点数・配送件数では数えない（複数明細・複数配送の受注1件は件数1） | standard-src＋設計書md | `COUNT(o) AS order_count`（oは `orderRepository->createQueryBuilder('o')`＝dtb_order行）／「売上件数｜条件に一致する受注行を数える。受注明細行数、商品点数、配送件数では数えない」 | AdminController.php:377-381／m02-02md:181 | 0 `non-translated` |
| L1-M0202-027 | orm_layer | 集計クエリの実効条件にはORM共通フィルタ **soft_deleteable（`enabled: true`）** が加わる: `Eccube\Entity\Order` は `Gedmo\SoftDeleteable(fieldName: 'deletedAt')` のため、論理削除済み受注（`deleted_at IS NOT NULL`）は集計対象外。設計書はソフトデリート等の条件列挙をスコープ外と明記（md:45）＝本claimは**db.ts突合SQLの条件整合のための実装層claim**（standard-srcのみ・設計期待の上書きではない）。なお `incomplete_order_status_hidden`（PENDING/PROCESSING隠蔽フィルタ）は既定 `enabled: false` で、当該2ステータスは既定excludes（L1-008）側で除外される | standard-src | `soft_deleteable:`＋`    class: Gedmo\SoftDeleteable\Filter\SoftDeleteableFilter`＋`    enabled: true`／`#[Gedmo\SoftDeleteable(fieldName: 'deletedAt', timeAware: false)]`／`private ?\DateTime $deletedAt = null;`（`name: 'deleted_at'`）／`incomplete_order_status_hidden:`＋`    class: Eccube\Doctrine\Filter\OrderStatusFilter`＋`    enabled: false`／（設計側）「ソフトデリットやマルチテナント等により受注が一覧から除外される場合の詳細な条件列挙」は本書で扱わない | doctrine.yaml:78-86／Order.php:153,771-772／m02-02md:45 | 0 `non-ui-observable` |
| L1-M0202-028 | **TBD** | データベース読み取り障害時は「アプリケーションの共通例外処理に委ねる。本ブロック専用の利用者向けメッセージは設けない」「ホーム全体が表示されないことがある」＝**実claimだが観測契約が定義不能**: HTTPステータス・例外型の列挙は設計書が明示的にスコープ外（md:46）とし、DB障害の安全な誘発手段も標準環境に無い。**未確定オラクル台帳へ**（excludedにしない=実在仕様の除外禁止） | 設計書md | 「データベース読み取りの障害｜アプリケーションの共通例外処理に委ねる。本ブロック専用の利用者向けメッセージは設けない」「データベース障害時はアプリケーションの共通例外処理に委ねられ、ホーム全体が表示されないことがある」「データベース接続失敗時の HTTP ステータスや例外型の列挙」（=扱わないこと） | m02-02md:288,228,46 | — |
| L1-M0202-029 | cookie/session | 本機能は売上表示のための**専用Cookieを新規設定せず**、本ブロック専用のセッションキー書き込みも持たない（セッションCookieは管理画面全体の認証用＝本機能スコープ外）。観測契約: ホーム表示＋グラフXHRの前後で context のCookie集合に認証/セッション系以外の新規Cookieが増えない | standard-src＋設計書md | 「本機能は売上表示のためだけに新たな Cookie を設定しない。ブラウザのセッション Cookie はフレームワークおよび管理画面全体の認証に用いられる」「ホーム画面表示時｜売上サマリのためだけにセッションを更新しない」「グラフ用 Ajax｜認証済みセッションのもとで実行されるが、本ブロック専用のセッションキー書き込みは持たない」「グラフ取得でもセッションを本ブロック専用に書き換えない」／AdminController::index/sale に `$session->set` 不存在（setはsearchNonStock/searchCustomer=別route:302-330のみ） | m02-02md:321-328,229／AdminController.php:104-241 | 0 `non-ui-observable` |
| L1-M0202-030 | ext_hook | 拡張フック `ADMIN_ADMIM_INDEX_SALES` が売上対象外配列を、`ADMIN_ADMIM_INDEX_COMPLETE` がダッシュボード値を差し替える場合があり、差し替え後の値がサマリ・グラフ双方に使われる。**標準環境（プラグイン差し替えなし）では既定値（L1-008/009）が実効**＝本claimはC-030/C-031の前提条件（差し替え環境での実行は対象外=§9-7） | standard-src＋設計書md | `$this->eventDispatcher->dispatch($event, EccubeEvents::ADMIN_ADMIM_INDEX_SALES); $this->excludes = $event->getArgument('excludes');`（index:143-150／sale:217-224の両方）／`$this->eventDispatcher->dispatch($event, EccubeEvents::ADMIN_ADMIM_INDEX_COMPLETE);`／「売上向けの拡張フックにより、プラグイン等が上記配列を差し替える場合がある。差し替え後の配列が、その後のサマリ集計とグラフ用データ取得の双方に使われる」「ホーム全体のコンテキストを公開する別の拡張フックにより…最終的に上書きされる場合がある」 | AdminController.php:143-150,171-184,217-224／m02-02md:103-104,142,150 | 0 `non-translated` |

計**30行＝29claim確定＋L1-M0202-028 TBD**。

## §2 SEED三段参照設計（SEED-M02-SALES系）

三段参照: `L1 claim（期待の正） → fixture_version（SEEDセットID@manifest_sha1） → 実値`。**SEED固定値は入力の
再現手段であり期待値の正にしない**: 集計ケースの期待は「L1の集計式をdb.tsで実DB状態に対して独立評価した値」
（§6.3）であり、SEED既知値はブラケット（適用前後差分）のサニティ確認にのみ使う。全て `@TBD-D5`。
**SEED実体は `e2e/seed/sets/m02/SEED-M02-SALES-DASHBOARD.sql`（±down.sql）が実装済み**（サブID
INCLUDE/EXCLUDE/EMPTY/ZERO/MULTILINE/BOUNDARY は同一実体・`e2e/seed/lib/apply.sh`/`teardown.sh` で適用/撤去）。

| SEEDセットID | 目的 | 固定値（実SQL実測） | 後始末 |
|---|---|---|---|
| SEED-M02-ADMIN | 2FA OFFの有効管理者（ログイン直後にホーム到達） | `config/default.config.ts` の ECCUBE_ADMIN_USER/PASS 既定 | 既存利用・撤去不要 |
| SEED-M02-SALES-INCLUDE | 含める10ステータス各1件（今日10-11時台・出荷完了含む） | dtb_order id=900000021〜30・status_id=1,2,4,5,6,9,10,12,13,14・payment_total=1000〜10000（計55,000円/10件）・order_no=`E2E-M02-SALES-INCLUDE-*` | ON CONFLICT UPSERTべき等・down.sqlでマーカー`E2E-M02-SALES-%`＋帯ID撤去 |
| SEED-M02-SALES-EXCLUDE | 既定除外4ステータス各1件（今日12時台・期間内） | id=900000031〜34・status_id=3,7,8,15・payment_total=3100/3200/3300/3400 | 同上 |
| SEED-M02-SALES-ZERO | payment_total=0の対象受注 | id=900000035・status_id=1・payment_total=0 | 同上 |
| SEED-M02-SALES-MULTILINE | 複数明細・複数配送の対象受注1件 | id=900000036・payment_total=1234・dtb_shipping/dtb_order_item 複数行（900000021〜44帯） | 同上 |
| SEED-M02-SALES-BOUNDARY | 期間境界受注6件 | id=900000037〜42: 当日0時ちょうど(100円)・翌日0時-1秒(200円)・**翌日0時ちょうど(300円=今日に不算入)**・前日0時(400円)・当月1日0時(500円)・**翌月1日0時(600円=今月に不算入)** | 同上 |
| SEED-M02-SALES-EMPTY | 対象期間に売上対象受注0件 | 実体データなし（状態の不在）。**共有DBでは単独保証不能＝隔離DB/期間窓必須**（C-035の実行前提=§9-5） | — |

- 集計ケース（C-030/031/032/033/034）の照会は **run内ブラケット**（SEED適用前後のdb.ts式評価差分＋
  UI表示値と式評価値の突合）で行い、共有DB上の他受注に依存しない。
- BOUNDARY系は**時刻依存**: 月末日・日付跨ぎ実行では「翌日0時」行が翌月に落ちる等の窓問題がある
  （§9-6。spec実装waveで実行時刻ガード必須）。

## §3 売上集計マトリクス（本日/月/年・返品除外・通貨書式）

三値比較: 設計書md（集計条件:135-140・判定順序:150-152・集計対象表:160-161）／ee Controller
（AdminController.php）／ee twig・locale。除外/包含のid実値はL1-008/009。

### 3a. 期間×境界×観測面

| 区分 | 区間（開始） | 区間（終了） | 境界極性 | バケット | 観測面 | L1 |
|---|---|---|---|---|---|---|
| 今日サマリ | 当日0:00:00 | 翌日0:00:00 | 開始**以上**・終了**未満**（翌日0時ちょうど不算入） | なし（単一値） | HTML `.h3`（サーバ側レンダリング） | L1-010,024 |
| 昨日サマリ | 前日0:00:00 | 当日0:00:00 | 同上 | なし | 同上 | L1-010 |
| 今月サマリ | 当月1日0:00:00 | `first day of 1 month`（設計期待=翌月1日0時） | 開始以上・終了未満（翌月1日0時不算入） | なし | 同上 | L1-011 |
| 週間グラフ | 7日前0:00（today−1week） | **now（以下=含む）** | `>= from`・`<= to`（サマリと非対称） | 日 `Y/m/d`・0埋め | sale_chart JSON `datas[0]` | L1-017 |
| 月間グラフ | 当月1日0:00（startOfMonth） | now（以下） | 同上 | 日 `Y/m/d`・0埋め | JSON `datas[1]` | L1-017 |
| 年間グラフ | 1年前の月初（subYear→startOfMonth） | now（以下） | 同上 | 年月 `Y/m`・0埋め | JSON `datas[2]` | L1-017 |

### 3b. ステータス×金額×件数

| 入力 | サマリ金額 | サマリ件数 | グラフbucket | L1 |
|---|---|---|---|---|
| 含める10ステータス（NEW/PAY_WAIT/IN_PROGRESS/**DELIVERED**/PAID/PRE_DELIV/PICKING/OTC_RSV/PICKED/PASSED） | payment_totalを加算 | +1/件 | price加算・count+1 | L1-009 |
| 除外4ステータス（CANCEL=3/PENDING=7/PROCESSING=8/**RETURNED=15**） | 加算しない | 数えない | 加算しない | L1-008 |
| payment_total=0（対象ステータス・期間内） | +0 | **+1** | price+0・count+1 | L1-025 |
| 複数明細・複数配送の受注1件 | payment_total（受注単位） | **+1**（明細/配送数でない） | 同 | L1-026 |
| 論理削除済み（deleted_at NOT NULL） | 対象外（ORM共通フィルタ） | 対象外 | 対象外 | L1-027 |
| 該当0件 | 0表示 | 0表示 | 全キー0バケット | L1-012,017 |

### 3c. 表示書式

| 面 | 書式 | 根拠 |
|---|---|---|
| サマリ値 | ja「{price書式金額} / {number_format件数} 件」／en "… item(s) sold"。price=`NumberFormatter(locale,CURRENCY)`（ja/JPY→通貨記号＋3桁区切り・小数なし。記号グリフはICU実装値=要実機） | L1-005 |
| グラフ | 縦棒=売上金額のみ（1系列・label ja「売上金額」/en "Sales Amount"）。ツールチップ/Y軸=`currency_symbol()`＋3桁区切り | L1-018 |

## §4 実行可能グレード14列TSV（候補・**自己完結＝全28行を実体掲載**）

記法: 期待結果セルは三段参照 `…実値… [L1:<oracle_id>; fixture:<SEEDセットID>@TBD-D5]`。
`%eccube_admin_route%` は環境値（既定 `admin`）。セレクタ（page実装済み・Twig由来）:
`#chart-statistics`（index.twig:146）・`.card-title`（:149）・サマリ値 `.h3`（:155,163,171）・
`small` ラベル（:160,168,176）・`#pills-weekly-tab/#pills-monthly-tab/#pills-year-tab`（:182,185,188）・
ペイン `#pills-weekly/#pills-monthly/#pills-year`（:200,203,206）・`#chart-0/#chart-1/#chart-2`（:201,204,207）・
`#loading`（:196）。直接GET/XHR偽装のrequest契約は§6.1-6.2・db.ts集計照会は§6.3。en行はD15前提。

### §4.1 bound対応候補行（23行=ja21＋-EN2。§8の59対応表が参照する全行）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m02-02_admin_home_home_sales_status	E2E-M0202C-001	IT-15	未認証	P1	未認証でホームへアクセスすると管理ログインへ誘導され本ブロックを利用できない	未ログイン（cookieなしcontext）	—	1. GET /%eccube_admin_route%/ 2. 遷移先URLと画面を確認	admin_login のログイン画面へ誘導され、売上状況カード（#chart-statistics）を含むホーム画面は表示されない [L1:L1-M0202-001]				
m02-02_admin_home_home_sales_status	E2E-M0202C-002	IT-13	URL直接アクセス	P2	未認証でグラフ用データURLへ直接アクセスするとログインへ誘導されデータを得られない	未ログイン	—	1. GET /%eccube_admin_route%/sale_chart 2. 遷移先とレスポンスを確認	グラフ用JSON配列は返らず admin_login のログイン画面へ誘導される [L1:L1-M0202-001,L1-M0202-003]				
m02-02_admin_home_home_sales_status	E2E-M0202C-010	IT-25	表示	P1	ログイン後ホームに売上状況カード一式が表示される（ja）	管理者ログイン済（SEED-M02-ADMIN・2FA OFF）	—	1. ログインし GET /%eccube_admin_route%/ 2. #chart-statistics 内の .card-title 文言・サマリ3ブロック（.h3+small）・3タブ・3ペイン内canvas・#loading の存在とクラスを確認	管理者認証後のダッシュボード（ホーム）に #chart-statistics カードが表示され、見出し「売上状況」・ラベル「今月の売上金額 / 売上件数」「今日の売上金額 / 売上件数」「昨日の売上金額 / 売上件数」・タブ「週間」「月間」「年間」・canvas#chart-0/1/2・#loading が管理共通クラス（card/btn-ec-tab/tab-pane）で配置される [L1:L1-M0202-004,L1-M0202-002; fixture:SEED-M02-ADMIN@TBD-D5]				
m02-02_admin_home_home_sales_status	E2E-M0202C-010-EN	IT-25	表示	P3	売上状況カード文言（en）	管理者ログイン済／locale=en	—	1. en UIでホームを開く 2. カード見出し・3ラベル・3タブ文言を読む	見出し="Sales"・ラベル="This Month: Sales Amount / Volume"/"Today: Sales Amount / Volume"/"Yesterday: Sales Amount / Volume"・タブ="Weekly"/"Monthly"/"Yearly" [L1:L1-M0202-004; fixture:SEED-M02-ADMIN@TBD-D5]				
m02-02_admin_home_home_sales_status	E2E-M0202C-011	IT-25	表示形式	P1	サマリ値が「{通貨書式金額} / {桁区切り件数} 件」の書式で表示される（ja）	管理者ログイン済／SEED-M02-SALES-INCLUDE適用済	—	1. ホームを開く 2. #chart-statistics 内の .h3 3要素のテキストを読む 3. db.tsで§6.3の式評価値（今月/今日/昨日）を取得しprice/number_format書式を適用した期待文字列と突合	3つの .h3 がいずれも「{通貨記号+3桁区切り金額} / {桁区切り整数件数} 件」形式で、金額・件数とも§6.3のdb.ts式評価値と一致する（通貨記号グリフの確定は§9-4=要実機。SEED値は期待の正にしない） [L1:L1-M0202-005,L1-M0202-010,L1-M0202-011; fixture:SEED-M02-SALES-INCLUDE@TBD-D5]				
m02-02_admin_home_home_sales_status	E2E-M0202C-011-EN	IT-25	表示形式	P3	サマリ値書式（en）	管理者ログイン済／locale=en	—	1. en UIでホームを開く 2. .h3 のテキストを読む	各値が "%amount% / %count% item(s) sold" の解決形（"{金額} / {件数} item(s) sold"）で表示される [L1:L1-M0202-005]				
m02-02_admin_home_home_sales_status	E2E-M0202C-012	IT-15	状態変化	P2	売上状況カード見出しは静的文言でリンクでなく押下遷移しない	管理者ログイン済	—	1. ホームを開く 2. .card-title（売上状況）の要素タグと祖先に a 要素が無いことを確認 3. 押下してURL不変を確認	見出しは span 要素の静的文言でリンク（a）ではなく、押下しても画面遷移しない（受注状況カード見出し=aタグとの対比） [L1:L1-M0202-006]				
m02-02_admin_home_home_sales_status	E2E-M0202C-013	IT-25	モーダル	P2	本ブロックはモーダル・トースト・確認ダイアログ・フォーム入力を持たない	管理者ログイン済	—	1. ホームを開く 2. #chart-statistics 内の input/form/.modal 要素数を確認 3. タブ操作時もダイアログ介在が無いことを確認	#chart-statistics 内に input・form・modal/dialog 要素が存在せず（0件）、表示・タブ操作でモーダル/トースト/確認ダイアログが表示されない [L1:L1-M0202-007]				
m02-02_admin_home_home_sales_status	E2E-M0202C-020	IT-25	操作起点	P1	ページ表示後にグラフ用XHRが自動発生し3区間のJSON配列が返る	管理者ログイン済	共通レイアウト由来: XHR＋ECCUBE-CSRF-TOKENヘッダ	1. ネットワーク監視下でホームを開く 2. admin_homepage_sale へのリクエストのヘッダ（X-Requested-With/ECCUBE-CSRF-TOKEN）を確認 3. 応答status/bodyを確認	GET /%eccube_admin_route%/sale_chart がXHR＋CSRFヘッダ付きで1回発生し、応答は成功（200）で [週間,月間,年間] の3要素配列・各要素は {キー:{price,count}} のバケット集合 [L1:L1-M0202-013,L1-M0202-016,L1-M0202-003]				
m02-02_admin_home_home_sales_status	E2E-M0202C-021	IT-12	JS挙動	P1	取得成功で3つのcanvasに棒グラフが描画され読み込み中表示が消える	管理者ログイン済	—	1. ホームを開き sale_chart XHRの完了を待つ 2. #loading の非表示を確認 3. #chart-0/1/2 のcanvas描画（サイズ設定・非空）を確認	XHR完了後 #loading が非表示になり、週間・月間・年間タブに応じた棒グラフとして #chart-0/#chart-1/#chart-2 へ描画される（canvas内部ピクセルの系列判定はC-042/§9-8） [L1:L1-M0202-018; fixture:SEED-M02-ADMIN@TBD-D5]				
m02-02_admin_home_home_sales_status	E2E-M0202C-022	IT-25	タブ切替	P2	タブ切替は同一ページ内の表示切替で追加サーバ問い合わせが発生しない	管理者ログイン済（初期XHR完了後）	—	1. ネットワーク監視下で「月間」タブ押下→#pills-monthly がactive 2. 「年間」タブ押下→#pills-year がactive 3. 押下前後で追加リクエスト（sale_chart再取得含む）が発生しないことを確認	同一ページ内でタブのactiveペインが切り替わり（取得済みデータセットに対応するcanvasが表示され）、タブ操作による追加のサーバリクエストは発生しない [L1:L1-M0202-019]				
m02-02_admin_home_home_sales_status	E2E-M0202C-023	IT-15	CSRF	P1	非XHRでグラフ用データURLへ直接アクセスすると400 {"status":"NG"} でJSON配列を返さない	管理者ログイン済（同一context）	§6.1契約: XHRヘッダなしの通常GET	1. §6.1手順でログイン済セッションのまま /sale_chart を通常GET 2. 応答status/bodyを確認	HTTP 400・本文 {"status":"NG"}（XMLHttpRequest条件未充足の短絡）でありグラフ用の3要素配列は返らない [L1:L1-M0202-014]				
m02-02_admin_home_home_sales_status	E2E-M0202C-024	IT-15	CSRF	P1	XHRヘッダがあってもCSRFトークン欠落/不正ならグラフ用データを返さない	管理者ログイン済（同一context）	§6.2契約: X-Requested-With: XMLHttpRequest＋ECCUBE-CSRF-TOKENなし（または改変値）	1. §6.2手順でCSRF欠落XHRを送信 2. 応答がエラー応答（グラフ用3要素配列でない）ことを確認	グラフ用JSON配列は返らずエラー応答となる（isTokenValidのAccessDeniedHttpException throw→共通例外処理。実効HTTPステータス/本文形式は§9-3=要実機のため「配列を返さない・成功しない」までを判定） [L1:L1-M0202-015]				
m02-02_admin_home_home_sales_status	E2E-M0202C-025	IT-12	エラー継続	P2	グラフ取得失敗時も同一画面のままグラフ未描画・読み込み表示は消え・専用通知を出さない	管理者ログイン済／Playwright routeで /sale_chart を失敗させる（abort/500応答注入）	route介入によるXHR失敗	1. page.route で sale_chart を失敗化しホームを開く 2. #loading が（always経由で）非表示になることを確認 3. #chart-0/1/2 に描画が無いことを確認 4. モーダル/トースト/アラート等の専用通知が出ず同一画面に留まることを確認	ホーム画面は同一画面のまま・グラフは未描画・#loading は消え・利用者向け専用メッセージ/トースト/ダイアログは表示されない（failハンドラ空・always→hide） [L1:L1-M0202-018,L1-M0202-007]				
m02-02_admin_home_home_sales_status	E2E-M0202C-030	IT-26	集計包含	P1	含める10ステータスの受注（出荷完了含む）が今日/今月サマリに金額・件数とも算入される	管理者ログイン済／標準環境（拡張フック差替なし=L1-030）	SEED-M02-SALES-INCLUDE（id=900000021〜30・§2）	1. db.tsで§6.3式評価（今日/今月）のT0値を記録 2. apply.sh SEED-M02-SALES-INCLUDE 3. db.tsで式評価T1値を取得（差分=SEED10件分の増分であることをサニティ確認） 4. ホームを開き .h3 の今日/今月値を読む 5. UI表示値とT1式評価値（price/number_format書式適用後）の一致を確認 6. teardown.sh	今日・今月サマリの金額・件数がdb.ts式評価値（含める10ステータスを算入・出荷完了=DELIVERED含む）と一致する。期待の正はL1式でありSEED固定値ではない [L1:L1-M0202-009,L1-M0202-010,L1-M0202-011,L1-M0202-030; fixture:SEED-M02-SALES-INCLUDE@TBD-D5]				
m02-02_admin_home_home_sales_status	E2E-M0202C-031	IT-25	集計除外	P1	既定除外4ステータス（キャンセル/決済処理中/購入処理中/返品）の受注は金額・件数に算入されない	管理者ログイン済／標準環境	SEED-M02-SALES-EXCLUDE（id=900000031〜34・status=3,7,8,15・期間内）	1. db.tsで式評価T0を記録 2. apply.sh SEED-M02-SALES-EXCLUDE 3. db.tsで式評価T1を取得し**T0=T1（除外行は式評価に寄与しない）**を確認 4. ホーム再表示で .h3 の今日/今月値がT1式評価値と一致（EXCLUDE行の3100〜3400円が金額にも件数にも現れない）ことを確認 5. teardown.sh	除外4ステータスの受注は今日・今月サマリの金額・件数のいずれにも算入されない（式評価・UI表示とも不変） [L1:L1-M0202-008,L1-M0202-010; fixture:SEED-M02-SALES-EXCLUDE@TBD-D5]				
m02-02_admin_home_home_sales_status	E2E-M0202C-035	IT-12	空集計	P2	該当受注0件のときサマリが金額・件数とも0表示でエラーなく継続する	管理者ログイン済／**隔離DB/期間窓必須**（SEED-M02-SALES-EMPTY=状態の不在。共有DBでは0件を保証できない=§9-5）	対象期間に売上対象受注なし（db.tsで§6.3式評価=金額0/件数0を前提確認）	1. db.ts式評価で今日/昨日/今月とも0件0円を確認（0でなければskip） 2. ホームを開く 3. .h3 3要素の表示を読む 4. エラー表示が無いことを確認	今月・今日・昨日のサマリがいずれも金額0（通貨書式の0）・件数0の「0値表示」となり、エラーは表示されず画面継続する（DB照会が空でも相関系のエラーにならない） [L1:L1-M0202-012,L1-M0202-005]				
m02-02_admin_home_home_sales_status	E2E-M0202C-036	IT-26	無書込	P1	ホーム表示とグラフ取得はdtb_order・マスタへ登録/更新を行わない（標準環境）	管理者ログイン済／**標準環境（拡張hook差替・書込みlistenerを導入したプラグインなし=L1-030。§9-7）**	—	1. db.tsでT0=§6.3cの決定的差分照会（dtb_order行数＋dtb_order全列ダイジェスト＋マスタmtb_order_status全列ダイジェスト）を記録 2. ホーム表示→sale_chart XHR完了→タブ操作 3. db.tsでT1を再照会	T0=T1（dtb_orderの行数・全列ダイジェスト、参照マスタmtb_order_statusの全列ダイジェストとも完全一致=登録/更新/削除なし。主キー順・全列のダイジェストのため相殺更新・過去行更新も検知）。設計書DB操作節の「登録/更新」はDOC-DRAFT-m02-02-1のテンプレノイズであり書込を期待しない。無書込の主張は標準環境に限定（ADMIN_ADMIM_INDEX_SALES/COMPLETEへ書込みlistenerを差し込むプラグイン導入環境は対象外=期待の過大回避） [L1:L1-M0202-020,L1-M0202-030]				
m02-02_admin_home_home_sales_status	E2E-M0202C-037	IT-26	最新データ	P2	別処理で受注が永続化された後の再表示は、その時点の永続化済みデータを読んで反映する	管理者ログイン済	db.tsで対象ステータス・今日期間の受注1件（帯ID・run接尾辞付きorder_no）を直接INSERT	1. ホーム表示で .h3 今日値と db.ts式評価T0を記録 2. db.tsで対象受注を直接INSERT（本ブロック外部の更新を再現） 3. ホームを**再表示** 4. .h3 今日値がdb.ts式評価T1（=INSERT反映後）と一致することを確認 5. INSERT行を後始末	再表示時のサマリはINSERT済み受注を含む読み取り時点の値になる（金額・件数がT1式評価値と一致。反映タイミングの正である外部連携/バッチ設計自体は検証対象外=委譲宣言はオラクル化しない） [L1:L1-M0202-021; fixture:SEED-M02-SALES-INCLUDE@TBD-D5]				
m02-02_admin_home_home_sales_status	E2E-M0202C-038	IT-25	自動更新なし	P2	表示中のサマリとグラフは自動更新されない	管理者ログイン済（初期XHR完了後）	db.tsで対象受注1件を直接INSERT（表示後）	1. ホーム表示完了後 .h3 値を記録・ネットワーク監視開始 2. db.tsで受注INSERT 3. 無操作で待機（監視窓） 4. .h3 表示値が記録値のまま不変・sale_chartへの追加リクエストが発生しないことを確認 5. 後始末	表示中の画面は自動更新されず（表示値不変・ポーリング等の追加リクエストなし）、反映は再表示/再取得時のみ [L1:L1-M0202-022]				
m02-02_admin_home_home_sales_status	E2E-M0202C-039	IT-02	サーバ側レンダリング	P2	売上サマリはホームHTML表示時のサーバ側読み取り結果である	管理者ログイン済	—	1. JS無効context（javaScriptEnabled:false）または応答HTML直接取得でホームをGET 2. XHR実行前のHTML本文に .h3 サマリ値（書式済み文字列）が含まれることを確認 3. グラフ描画はJS依存（canvas未描画）であることを対比確認	サマリ値は初期HTML応答に含まれ（サーバ側レンダリング・クエリ/ボディ入力なし）、グラフ用データのみが表示後の別Ajaxで取得される [L1:L1-M0202-024]				
m02-02_admin_home_home_sales_status	E2E-M0202C-040	IT-12	スナップショット分離	P3	サマリとグラフは別リクエストで同一トランザクションに固定されず、間の受注変更で乖離してもエラーなく継続する	管理者ログイン済／Playwright routeで sale_chart 応答を遅延保留	遅延中にdb.tsで対象受注1件をINSERT	1. page.routeで sale_chart を保留にしてホームを開く（サマリHTMLは先に確定） 2. db.tsで今日期間の対象受注をINSERT 3. 保留を解放しXHR完了 4. サマリ.h3（INSERT前の読取値）とグラフJSONの当日バケット（INSERT後の読取値）が乖離することを観測 5. エラー表示なく画面継続を確認 6. 後始末	サマリ=HTML生成時点・グラフ=XHR時点の別読取であり、間のDB変更により両者の値が一致しない状態が観測でき、その場合もエラーは表示されない（一致は非保証=一致期待を置かない） [L1:L1-M0202-023]				
m02-02_admin_home_home_sales_status	E2E-M0202C-042	IT-22	グラフ系列	P3	グラフ用JSONにはprice/count双方が含まれるが棒グラフの系列は売上金額のみ	管理者ログイン済	—	1. sale_chart XHR応答を捕捉し各バケットに price と count の両キーが存在することを確認 2. 描画後、Chartインスタンス（Chart.getChart等）のdatasetsが1系列・data=各バケットのprice列・label=「売上金額」であることを確認（Chart内部読取APIの可用性=§9-8要実機）	JSONは件数（count）を保持するが、棒グラフのdatasetsは売上金額（price）のみの1系列（labelはja「売上金額」）で、件数は表示系列に使われない [L1:L1-M0202-016,L1-M0202-018]				
```

### §4.2 補完行（5行=ja5。**親test_idなし・母集合会計に算入しない**。理由=設計書補完〔一次資料に規定が
あるが、母集合59行の期待テキストに対応する親が存在しない〕）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m02-02_admin_home_home_sales_status	E2E-M0202C-032	IT-26	0円受注	P3	payment_total=0の対象受注は件数に算入され金額には0として加算される	管理者ログイン済／標準環境	SEED-M02-SALES-ZERO（id=900000035・payment_total=0・対象ステータス・今日）	1. db.ts式評価T0（今日の金額/件数）を記録 2. apply.sh SEED-M02-SALES-ZERO 3. db.ts式評価T1で**件数+1・金額+0**の差分を確認 4. ホーム表示の .h3 今日値がT1と一致することを確認 5. teardown.sh	0円受注により今日サマリの件数のみ1増え金額は増えない（UI表示もdb.ts式評価値と一致） [L1:L1-M0202-025; fixture:SEED-M02-SALES-ZERO@TBD-D5]（補完行・親test_idなし・設計書補完）				
m02-02_admin_home_home_sales_status	E2E-M0202C-033	IT-26	件数定義	P3	複数明細・複数配送の受注1件は売上件数1として数えられる	管理者ログイン済／標準環境	SEED-M02-SALES-MULTILINE（id=900000036・複数dtb_shipping/dtb_order_item付き・1234円）	1. db.ts式評価T0を記録 2. apply.sh SEED-M02-SALES-MULTILINE 3. db.ts式評価T1で**件数+1（明細数/配送数でない）・金額+1234**の差分を確認 4. ホーム表示値がT1と一致することを確認 5. teardown.sh	複数明細・複数配送でも売上件数は受注行1件として+1のみ（受注明細行数・商品点数・配送件数で加算されない） [L1:L1-M0202-026; fixture:SEED-M02-SALES-MULTILINE@TBD-D5]（補完行・親test_idなし・設計書補完）				
m02-02_admin_home_home_sales_status	E2E-M0202C-034	IT-25	期間境界	P3	サマリ期間は開始以上・終了未満で判定され終了境界ちょうどの受注は算入されない	管理者ログイン済／標準環境／**実行時刻ガード必須**（月末日・0時近傍は窓問題=§9-6）	SEED-M02-SALES-BOUNDARY（当日0時=100・翌日0時-1秒=200・翌日0時=300・前日0時=400・当月1日0時=500・翌月1日0時=600）	1. db.ts式評価T0を記録 2. apply.sh SEED-M02-SALES-BOUNDARY 3. db.ts式評価T1の差分で: 今日=+300円/2件（100+200。300は不算入）・昨日=+400円/1件・今月=当月内行の合計（600=翌月1日0時は不算入）を確認 4. ホーム表示値がT1と一致することを確認 5. teardown.sh	当日0時ちょうど・翌日0時直前は「今日」に算入され、翌日0時ちょうどは算入されない。当月1日0時は「今月」に算入され、翌月1日0時は算入されない（開始以上・終了未満） [L1:L1-M0202-010,L1-M0202-011; fixture:SEED-M02-SALES-BOUNDARY@TBD-D5]（補完行・親test_idなし・設計書補完）				
m02-02_admin_home_home_sales_status	E2E-M0202C-043	IT-25	グラフバケット	P3	グラフJSONは3区間のキー構成が連続し売上ゼロ期間も0バケットで埋まる	管理者ログイン済	—	1. sale_chart XHR応答を捕捉 2. datas[0]（週間）のキーが7日前〜当日の連続日付（Y/m/d）であること 3. datas[1]（月間）のキーが当月1日〜当日の連続日付であること 4. datas[2]（年間）のキーが1年前の月〜当月のY/m連続であること 5. 受注が無い日/月も {price:0,count:0} で存在すること（欠落なし）を確認	3区間ともバケットキーが範囲内で連続し（週間/月間=日単位Y/m/d・年間=年月Y/m）、売上が無い期間も価0件0のバケットとして存在し横軸ラベルが欠けない [L1:L1-M0202-017,L1-M0202-016]（補完行・親test_idなし・設計書補完）				
m02-02_admin_home_home_sales_status	E2E-M0202C-044	IT-20	Cookie	P3	本ブロックの表示・グラフ取得で専用Cookieが新規設定されない	管理者ログイン済	—	1. ログイン完了後 context.cookies() のCookie集合T0を記録 2. ホーム表示→sale_chart XHR完了→タブ操作 3. context.cookies() T1を取得しT0との差分を確認	認証/セッション系（フレームワーク由来）以外に本機能起因の新規Cookieが増えない（本ブロック専用のセッションキー書込なしはブラウザ観測外=判定対象にしない） [L1:L1-M0202-029]（補完行・親test_idなし・設計書補完）				
```

## §5 locale対応表

- LS=1 claim: **L1-M0202-004・L1-M0202-005・L1-M0202-018 の3claim**。
- -EN行=**2行**（C-010-EN・C-011-EN）。en文言はすべてen一次資料逐語
  （messages.en.yaml:1857-1864。ja翻訳ゼロ）。
- **保留（claim単位・理由明記）**: **L1-M0202-018（グラフ系列label "Sales Amount"=messages.en.yaml:1865）の
  -EN行は作らない**。文言自体はen一次資料で確定済みだが、観測面がChart.js描画内部（canvas）であり、
  Chartインスタンス読取APIの可用性が未確定（§9-8）＝ja側C-042も同制約下。locale差分だけを増やさない。
- -EN行の実行前提はD15（M0 Go/No-Go。管理画面のen切替口なし＝W0実測を継承）。
- 通貨書式のlocale依存（L1-005）: `price` フィルタは `NumberFormatter(locale, CURRENCY)` のため
  en切替時は通貨書式も変わる（例: JPYでの記号/位置）。-EN行C-011-ENは「item(s) sold」定型の骨格までを
  判定し、en通貨書式の具体値はICU実装値=要実機（§9-4）。

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

### §6.1 非XHR直接GETのrequest契約（C-023で使用）

1. 同一BrowserContextでログイン済み状態を確立（セッションCookie保持）。
2. `page.request.get('/%eccube_admin_route%/sale_chart')` を**XHRヘッダなし**で送信
   （`X-Requested-With` を付けない＝`isXmlHttpRequest()` 偽）。
3. 応答 `status()===400`・`json()` が `{"status":"NG"}` であること、および3要素配列で**ない**ことを判定
   （根拠=AdminController.php:213-215＝L1-014）。

### §6.2 XHR偽装＋CSRF欠落のrequest契約（C-024で使用）

1. 同一contextで `page.request.get` に `headers: { 'X-Requested-With': 'XMLHttpRequest' }` を付け、
   `ECCUBE-CSRF-TOKEN` ヘッダ・`_token` パラメータを**付けない**（または末尾1文字改変値を付ける）。
2. 応答が「成功のグラフ用3要素配列」でないことを判定（isTokenValidがAccessDeniedHttpExceptionをthrow
   =AbstractController.php:258-261＝L1-015。実効ステータス/本文形式は共通例外処理依存=§9-3のため
   ステータス数値を固定期待にしない）。
3. トークン供給機構の正（meta＋ajaxSetupヘッダ）はC-020の正常系ヘッダ観測で対にする（L1-013）。

### §6.3 db.ts集計照会（三段参照の式評価。C-011/030/031/032/033/034/035/036/037/038/040で使用）

期待の正はL1の集計式。db.tsはその式をSQLで独立評価し、**UI表示値/JSON値と突合**する（SEED固定値は
適用前後差分のサニティにのみ使用）。実装層条件として `deleted_at IS NULL`（L1-027）を含める。
**セッションTZを必ずアプリTZ（`Asia/Tokyo`=services.yaml:9）に一致させる**（§9-6）。

a. 今日/昨日/今月サマリ（L1-010/011。`<日基準>`=当日/前日、月は date_trunc('month')）:

```sql
SET TIME ZONE 'Asia/Tokyo';
SELECT COALESCE(SUM(payment_total), 0) AS order_amount, COUNT(*) AS order_count
FROM dtb_order
WHERE deleted_at IS NULL
  AND order_status_id NOT IN (3, 7, 8, 15)
  AND order_date >= date_trunc('day', now())              -- 今日: 開始以上
  AND order_date <  date_trunc('day', now()) + interval '1 day';  -- 終了未満
-- 昨日: now()-interval '1 day' 基準で同型／今月: date_trunc('month', now()) 〜 +interval '1 month'
```

※db.tsは `SET TIME ZONE` を単一 `-tAc` に連結できないため、実装waveでは `queryScalar` へ
`SELECT ... AT TIME ZONE` 形へ書換えるか複文対応を追加する（§9-6に明記・未実装）。

b. グラフ区間の式評価（L1-017。上限は `<= now()`＝サマリと非対称）:

```sql
SELECT to_char(order_date, 'YYYY/MM/DD') AS bucket,
       COALESCE(SUM(payment_total), 0), COUNT(*)
FROM dtb_order
WHERE deleted_at IS NULL
  AND order_status_id NOT IN (3, 7, 8, 15)
  AND order_date >= date_trunc('day', now()) - interval '7 days'
  AND order_date <= now()
GROUP BY bucket ORDER BY bucket;   -- 年間は to_char(order_date,'YYYY/MM') で同型
```

c. 無書込ブラケット（C-036。**決定的差分照会を実体掲載=自己完結**）: SUM/MAXの要約値では
相殺更新（+n/−nで合計不変）・過去行更新（MAXに現れない）を検知できないため、**主キー順・全列の
決定的ダイジェスト**で判定する。`レコード::text` はPostgreSQLの行テキスト表現（update_date・deleted_at
含む全列）であり、同一スキーマのrun内ブラケット（T0/T1）では決定的:

```sql
-- (1) 行数
SELECT COUNT(*) FROM dtb_order;
-- (2) dtb_order 全列ダイジェスト（主キー順・全列。相殺更新・過去行更新も検知）
SELECT md5(COALESCE(string_agg(o::text, ',' ORDER BY o.id), '')) FROM dtb_order o;
-- (3) マスタ不変性: 受注ステータスマスタ mtb_order_status（OrderStatus.php:24 Table(name:'mtb_order_status')）
SELECT md5(COALESCE(string_agg(s::text, ',' ORDER BY s.id), '')) FROM mtb_order_status s;
```

「マスタ」の観測範囲: 本機能の集計が照合し同一ホーム画面が参照する受注ステータスマスタ
`mtb_order_status`（設計の語「マスタ」〔md:206,229〕の最小実体）。それ以外のマスタへの書込不存在は
ソース側grep（L1-020=AdminController.php全文にpersist/flush/INSERT/UPDATE 0件）で担保し、
全マスタ全表のダイジェスト照会までは求めない（観測契約の過大化を避ける）。

d. C-037/038/040 の直接INSERTは SEED-M02-SALES-DASHBOARD.sql の列契約
   （base_info_id=2・customer_id=900000021・order_no=`E2E-M02-SALES-RUN-<runid>`マーカー）を再利用し、
   後始末はマーカー条件DELETE（down.sql同型）。

### §6.4 実装方針（候補=未実装・実走なし）

- page: 既存 `e2e/pages/admin/m02/m02_02_admin_home_home_sales_status.page.ts` を再利用
  （#chart-statistics・.h3・タブ・canvas・#loading 実装済み・実機確認済み注記あり）。
- spec: 既存 `e2e/spec/admin/m02/m02_02_*.spec.ts` は**旧ケース表（E2E-M02-02-xxx）1:1**の実装であり
  本候補の実装ではない（ログインヘルパ・skipガードの参考のみ）。本候補の期待値は
  `o("L1-M0202-xxx", "m02_02_oracle")` 相当のL1解決器経由・リテラル直書き禁止。
- 集計突合は「UI表示文字列 ⇔ db.ts式評価値に price/number_format 相当の書式を適用した文字列」の
  完全一致でなく、**数値部の抽出一致＋書式骨格の正規表現**の2段判定を推奨
  （通貨記号グリフのICU依存=§9-4を吸収。実装waveで確定）。
- route介入（C-025 abort・C-040 遅延保留）は Playwright `page.route`/`route.fulfill` の標準機能で
  ハーネス追加不要（既存×だったE2E-M02-02-022の失敗理由「安定注入ハーネス未実装」への是正）。

### §6.5 _drafts/隔離lintの実施証跡（実測・実施済み）

1. 正式消費側（`e2e/helpers/oracle.ts`・`e2e/helpers/db.ts`・spec・pages）に草案を消費する `_drafts` 参照は
   **0件**（隔離ガード自体のリテラル〔oracle.ts:19〕を除く。ガードは `_drafts`・パス区切り・`..` を含む
   fileKeyの解決をthrowで拒否する機械強制＝消費参照ではない。grep実測）。
2. 正式パス `e2e/fixtures/oracle/` 直下に本機能のjsonは**作成していない**（直下の実体は既存正式物
   `m09_01_oracle.json` のみ＝ls実測・未変更。草案は `_drafts/` のみ）。
3. 本md・oracle草案json（`e2e/fixtures/oracle/_drafts/m02-02_admin_home_home_sales_status_oracle_draft.json`）の
   出力先はともに `_drafts/` 配下のみ（CFP §7出力規約に適合）。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

| ケース群 | 実行区分（候補） | 観測層 | 備考 |
|---|---|---|---|
| C-001,002,010,012,013,021,022,039 | Playwright | GUI/HTTP | 表示・遷移・タブ・非リンク |
| C-020,043 | Playwright | GUI+network | XHR捕捉・JSON構造 |
| C-023,024 | 非UI（request契約＋応答判定） | HTTP | §6.1/6.2契約 |
| C-025,040 | Playwright（route介入） | GUI+network(+DB) | abort/遅延保留。C-040はdb.ts注入併用 |
| C-011,030,031,032,033,034,036,037,038 | Playwright+db.ts（式評価突合） | GUI+DB | §6.3。三段参照（SEED非正）。SEED apply/teardown同梱 |
| C-035 | Playwright+db.ts・**隔離DB/期間窓必須** | GUI+DB | 0件前提の環境保証（§9-5）。前提不成立時skip |
| C-042 | Playwright＋Chart内部読取（要実機=§9-8） | GUI+JS | JSON側判定は自動・datasets読取は可用性未確定 |
| C-044 | Playwright | Cookie | context.cookies差分 |
| -EN 2行 | 実行保留（D15） | GUI | 文言確定済み |

聖域判定・多軸属性の正式付与はD14 v2合格後（本表は暫定・正式会計に使わない）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（§0判定原則。前提/入力列のシナリオ語はノイズ）。
1候補ケース行=1 assertion bundle・多対一は `shared-observation`・-EN行は対応ja行と同一親のlocale多重。
**参照先の全候補行は§4に実体掲載済み＝59↔候補の期待テキスト突合が本文内で完結する**。

### 集計（59 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **38** | 下表 |
| **TBD** | **1** | 017（DB相関エラー側=DB障害の共通例外委譲・観測契約未定義=L1-028） |
| **excluded** | **20** | フォーム/バリデーション不存在6（009,010,012,013,014,015）＋read-only機能への書込期待14（019,021,023,024,026,028,029,031,033,035,036,038,040,041）。各行の実引き正当化は§9-2 |
| 合計 | **59** | 欠落0・理由なし重複0 |

- 候補ケース行総数**28**（§4.1 bound対応23＝ja21＋-EN2／§4.2 補完5）。
- **極性・ノイズ処理の明示**（C4-manual対象=§10）:
  - **016（DB相関エラーなし）はexcludedにしない=semantic bind**: 本機能の処理本体はDB照会（集計）であり、
    「DBとの相関でエラーが出ず継続」の実在対応は「照会結果が空でもエラーなく0表示で継続」
    （md:111,190,259=L1-012）→C-035。Symfony Form制約の存在は意味しない（過大主張しない）。
    対の**017（DB相関エラーあり）は実在仕様（DB障害→共通例外委譲）が対応するがオラクル化不能=TBD**
    （偽陰性回避のためexcludedにしない）。
  - **009-015のフォーム系バリデーション6行はexcluded**: 本ブロックはフォーム・テキスト入力を持たず
    （md:93,257・index.twig:146-213にinput/form 0件）、必須/相関バリデーション自体が不存在
    （m05-16のconstraint不存在excluded判定と同型）。「エラーなし継続」側も『必須/相関バリデーションで』
    という観測契約が定義できないため両極性とも除外（画面がエラーなく継続すること自体はC-010等が
    付随的に観測=bindは主張しない）。
  - **019〜041のIT-26系「追加される/変更される」肯定14行はexcluded**: read-only裁定
    （DOC-DRAFT-m02-02-1=§0。設計4箇所＋実装grep 0件）により本機能が行う登録/更新が存在しない
    =肯定側の観測対象が不存在。**否定側（020,025,027,030,032,037,039,057「追加/変更されない」）は
    全行bound**（C-036の無書込ブラケットが期待テキストどおりの観測）＝否定側を除外しない
    （偽陰性ゼロ）。
  - **022/058（外部連携/バッチ委譲）はboundだが限定**: 委譲宣言（他設計を正とする）は検証対象外とし、
    同一設計文の観測可能部分「読み取り時点の永続化済みデータだけを読む」（md:207,216）をC-037で担保。
  - **034（集計の空=0表示）・053（自動更新なし）・055/059（サーバ側レンダリング）・056（トランザクション
    非固定）は具体観測へ**: 各C-035/C-038/C-039/C-040。056は「非固定」の直接証明でなく
    「別リクエスト＋間のDB変更で乖離が発生し得る」の構成的観測（md:204の後段文どおり）。

### 59対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 週間・月間・年間タブに応じた棒グラフであること | bound | C-021,C-022 (shared) |
| 002 | 管理者認証後に表示されるダッシュボードであること | bound | C-010 (shared) |
| 003 | 売上状況カードに今月・今日・昨日の売上金額と件数が表示される | bound | C-010,C-011,C-030 (shared・表示値の集計実体=C-030) |
| 004 | Ajax用ヘッダでCSRF付与・XHRかつCSRF妥当な場合にのみJSONを返すこと | bound | C-020（正）,C-023,C-024（負） (shared) |
| 005 | 同一ページ内でタブ切替・取得済みデータセットのcanvasに描画済み | bound | C-022 |
| 006 | 見出しはリンクでなく静的文言・押下遷移なし | bound | C-012 |
| 007 | ホーム画面自体に到達できず本ブロックも利用できない | bound | C-001,C-002 (shared) |
| 008 | サマリ・タブ・canvas・読み込み中表示を配置すること | bound | C-010 |
| 009 | 必須バリでエラーが表示され完了しないこと | **excluded**（§9-2-a） | — |
| 010 | 必須バリでエラーが表示されず継続できること | **excluded**（§9-2-a） | — |
| 011 | モーダル・ポップアップ・トースト・確認ダイアログを表示しないこと | bound | C-013,C-025（取得失敗時も通知なし） (shared) |
| 012 | 相関バリでエラーが表示され完了しないこと | **excluded**（§9-2-a） | — |
| 013 | 相関バリでエラーが表示されず継続できること | **excluded**（§9-2-a） | — |
| 014 | 相関バリでエラーが表示されず継続できること | **excluded**（§9-2-a） | — |
| 015 | 相関バリでエラーが表示され完了しないこと | **excluded**（§9-2-a） | — |
| 016 | DB相関バリでエラーが表示されず継続できること | bound | C-035（semantic bind: 照会空でもエラーなく0表示継続） |
| 017 | DB相関バリでエラーが表示され完了しないこと | **TBD**（L1-028） | —（DB障害→共通例外委譲。観測契約が設計スコープ外=md:46） |
| 018 | 画面の棒グラフ描画では売上金額のみを使うこと | bound | C-042 |
| 019 | 登録内容の対象レコードが追加されること | **excluded**（§9-2-b） | — |
| 020 | 追加され**ない**こと | bound | C-036（無書込ブラケット） |
| 021 | 追加されること | **excluded**（§9-2-b） | — |
| 022 | 外部連携/バッチによる受注更新の反映タイミングは当該機能設計を正とすること | bound | C-037（観測可能部分=永続化済みデータ読取。委譲宣言は非オラクル化） |
| 023 | 追加されること | **excluded**（§9-2-b） | — |
| 024 | 追加されること（前提=最大長） | **excluded**（§9-2-b） | — |
| 025 | 追加され**ない**こと（前提=最大長+1） | bound | C-036 (shared) |
| 026 | 追加されること（前提=最小長） | **excluded**（§9-2-b） | — |
| 027 | 追加され**ない**こと（前提=最小長-1） | bound | C-036 (shared) |
| 028 | 追加されること | **excluded**（§9-2-b） | — |
| 029 | 実行結果の対象レコードが追加されること | **excluded**（§9-2-b） | — |
| 030 | 本ブロックの処理だけを見ると受注台帳やマスタを更新しないこと | bound | C-036 |
| 031 | 更新内容の対象レコードの値が変更されること | **excluded**（§9-2-b） | — |
| 032 | 値が変更され**ない**こと | bound | C-036 (shared) |
| 033 | 値が変更されること（前提=Ajax妥当性） | **excluded**（§9-2-b） | — |
| 034 | 該当受注が無いときサマリは0表示であること | bound | C-035 |
| 035 | 値が変更されること（前提=未認証） | **excluded**（§9-2-b） | — |
| 036 | 値が変更されること（前提=認証済み） | **excluded**（§9-2-b） | — |
| 037 | 値が変更され**ない**こと（前提=最大長+1） | bound | C-036 (shared) |
| 038 | 値が変更されること（前提=最小長） | **excluded**（§9-2-b） | — |
| 039 | 値が変更され**ない**こと（前提=最小長-1） | bound | C-036 (shared) |
| 040 | 値が変更されること（前提=グラフAjax CSRF/XHR条件） | **excluded**（§9-2-b） | — |
| 041 | 実行結果の対象レコードの値が変更されること | **excluded**（§9-2-b） | — |
| 042 | 管理者認証後に表示されるダッシュボードであること | bound | C-010 (shared) |
| 043 | 売上状況カードに今月・今日・昨日の売上金額と件数が表示される | bound | C-010,C-011,C-030 (shared・表示値の集計実体=C-030) |
| 044 | Ajax用ヘッダでCSRF付与・XHR+CSRF妥当時のみJSONを返すこと | bound | C-020,C-023,C-024 (shared) |
| 045 | 同一ページ内でタブ切替・取得済みデータセットのcanvasに描画済み | bound | C-022 (shared) |
| 046 | 見出しは静的文言・押下遷移なし | bound | C-012 (shared) |
| 047 | ページ表示後に非同期取得し成功時に三つのcanvasへ棒グラフ描画 | bound | C-020,C-021 (shared) |
| 048 | 管理画面共通のカード・タブ・グラフ領域・ローディングのクラスを使うこと | bound | C-010 (shared・クラス確認を含む) |
| 049 | 本ブロックはフォーム・テキスト入力を持たないこと | bound | C-013 (shared) |
| 050 | 既定ではキャンセル・決済処理中・購入処理中・返品を除外すること | bound | C-031 |
| 051 | 金額は通貨表示・件数は整数として表示すること | bound | C-011(+EN) |
| 052 | 画面表示データでエラーが表示されず継続できること（前提=該当受注0件） | bound | C-035 (shared) |
| 053 | 表示中のサマリとグラフは自動更新しないこと | bound | C-038 |
| 054 | 画面表示データでエラーが表示されず継続できること（前提=取得間に受注が変化） | bound | C-040 (shared・乖離発生時もエラーなし) |
| 055 | 売上サマリはホーム画面HTML表示時に読み取った結果であること | bound | C-039 |
| 056 | サマリとグラフは同一トランザクションで固定しないこと | bound | C-040（別リクエスト分離＋乖離の構成的観測） |
| 057 | 本ブロックは参照のみで受注台帳やマスタを更新しないこと | bound | C-036 (shared) |
| 058 | 外部連携/バッチの反映タイミングは当該機能設計を正とすること | bound | C-037 (shared) |
| 059 | 売上サマリはホームHTMLレンダリング時にサーバ側で取得すること | bound | C-039 (shared) |

`func_scope_check` 判定: 親59/59会計済み（bound38＋TBD1＋excluded20=59・差分0）・欠落0・理由なし重複0・
補完5行は§4.2に実体掲載（親空・設計書補完・母集合会計外）→ **差分0を本文内で実証可能**。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

| # | 事項 | 状態 |
|---|---|---|
| 1 | **DOC-DRAFT-m02-02-1（設計書内矛盾・要修正候補）** | m02-02md:245-249 DB操作節「登録/更新｜dtb_order｜persist/flush による即時反映」は、同設計書の read-only 明記**4箇所**（md:31,206,229,334。md:303は監査ログの不在でありread-only根拠に含めない=codex R1是正）およびee実装（AdminController.php全文にpersist/flush/INSERT/UPDATE 0件=grep実測）と矛盾。既存記録=`m02_02_..._e2e_cases.md`付帯表4#6（「設計テンプレ矛盾・本文は参照のみ」）。**裁定: read-onlyを正**（§0）。期待値を「登録される」側に寄せない。設計書修正の要否は上流（設計書保守）へ申し送り |
| 2a | excluded 6行（009,010,012,013,014,015）の実引き正当化 | 期待列は「必須/相関バリデーションでエラーが表示され（ず）…」の定型。本ブロックには**フォーム・テキスト入力が不存在**（md:93「本ブロックはフォーム・テキスト入力を持たない」・md:257「利用者入力｜本ブロックはフォームを持たない。売上サマリは表示のみ」・index.twig:146-213のカード全域にinput/form要素0件=grep実測）＝必須/相関バリデーションという観測契約の主語が不存在（constraint不存在型=m05-16と同型）。エラーあり側は発生手段なし・エラーなし側は「〜バリデーションで」の限定が構成不能のため両極性とも過剰生成と判定。なお「エラーなく画面継続」自体はC-010/C-035が付随観測（bindは主張しない=過大bind回避） |
| 2b | excluded 14行（019,021,023,024,026,028,029,031,033,035,036,038,040,041）の実引き正当化 | 期待列は「登録内容/更新内容/実行結果の対象レコードが追加される/値が変更されること」の肯定定型。#1裁定のとおり本機能に登録/更新は不存在（md:206「本ブロックは参照のみであり、受注台帳やマスタを更新しない」・md:229・md:334・実装grep 0件）＝肯定側の観測対象が不存在で過剰生成。**否定側8行（020,025,027,030,032,037,039,057）は全行C-036へbound**しており、除外は肯定側に限定（偽陰性ゼロ。「追加/変更されない」を実観測で担保） |
| 3 | XHR＋CSRF不正の実効応答（C-024） | `isTokenValid()` はreturnでなく `AccessDeniedHttpException` をthrow（AbstractController.php:258-261）→HTTP実効ステータス（403等）と本文形式は共通例外処理・環境（APP_ENV/debug）依存＝**要実機**。候補の期待は「グラフ用3要素配列を返さない・成功しない」まで（設計md:78,287の規定範囲）。非XHR側（C-023）は `json(['status'=>'NG'],400)` で**確定** |
| 4 | 通貨書式の具体グリフ | `price`=NumberFormatter(ICU)のformatCurrency＝通貨記号・位置・区切りはICU/locale実装値（ja/JPY想定の全角￥等）＝**要実機確定**。候補の判定は「数値部の式評価一致＋書式骨格」の2段（§6.4）。`currency_symbol()`（Currencies::getSymbol）も同様 |
| 5 | C-035（0件0表示）の環境前提 | 共有DBでは「今日/昨日/今月に売上対象受注0件」を保証できない（既存E2E-M02-02-041×の失敗理由と同根）。**隔離DB（フレッシュDB）または期間窓固定が実行前提**＝前提不成立時はskip（db.ts式評価0の事前確認をガードに使う）。SEED-M02-SALES-EMPTYは「状態の不在」でありSQL適用では作れない |
| 6 | 時刻・タイムゾーン依存 | ①BOUNDARY系（C-034）は実行時刻窓ガード必須（月末日実行では「翌月1日0時」行の意味が変わる・0時近傍実行では「今日」窓が跨る） ②db.ts突合SQLはセッションTZをアプリTZ（Asia/Tokyo=services.yaml:9,12）に一致させる必要があり、現行db.tsは単一コマンド実行のため `SET TIME ZONE` 連結不可＝**式評価ヘルパの複文/AT TIME ZONE対応が実装waveの前提整備**（設計md:110「タイムゾーンは永続化層および実行環境の設定に従う」） ③「今月」終端の実装表記 `modify('first day of 1 month')`（AdminController.php:412）は設計が「実装が用いる相対日付指定に依存」とヘッジ＝db.ts突合は設計期待（翌月1日0時未満）で置き、乖離観測時はBC-DRAFT起票（現時点で乖離主張はしない） |
| 7 | 拡張フック差し替え環境 | L1-030（ADMIN_ADMIM_INDEX_SALES/COMPLETE差し替え）はプラグイン導入環境でのみ発生し標準環境では既定値が実効＝**差し替え環境での実行は対象外**（C-030/C-031は標準環境前提を明記。既存E2E-M02-02-043×と同判断） |
| 8 | Chart.js内部読取（C-042後半・C-021の描画詳細） | datasets（1系列・price・label）の実機読取は `Chart.getChart()` 等のグローバルAPI可用性に依存＝**要実機**。JSON側（price/count双方保持）は自動判定可。canvas描画有無はサイズ/ピクセル非空で近似判定（Chart.jsバージョン固有仕様は設計スコープ外=md:47） |
| 9 | ORM層条件（L1-027） | soft_deleteable有効（doctrine.yaml:84-86）のため論理削除受注は集計対象外＝db.ts式評価に `deleted_at IS NULL` を含めて突合（設計はスコープ外明記=md:45。設計期待の上書きではなく観測条件の整合）。乖離が出た場合の帰属判定（フィルタ/テナント等）は要実機 |
| 10 | 管理画面のenロケール切替口 | 要D15（-EN 2行の実行前提。W0実測を継承） |
| 11 | manifest_sha1（fixture_version確定） | D5後（現状 `@TBD-D5`。SEED-M02-SALES-DASHBOARD.sqlは実装済みだがfixture_version契約は未確定） |
| TBD | 017（L1-M0202-028） | DB読み取り障害→共通例外委譲・専用メッセージなし（md:288,228）。HTTPステータス/例外型の列挙は設計スコープ外（md:46）で観測契約が定義不能＋安全な障害誘発手段なし＝未確定オラクル台帳へ（excludedにしない） |

候補規律: 全行 `@TBD-D5`・O5未確定（D6後に確定検査）・実装/実走なし・O6/聖域/多軸/C6C7を主張しない。
既知バグ: 実装側BC-DRAFTは**0件**（本機能で実装乖離の主張はしない。#1は設計書側のDOC-DRAFT、#6③は
ヘッジ済み表現の突合方針であり乖離主張ではない）。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象構文の列挙とclaim別判定（本機能は「エラーが表示され（ず）」対と「追加/変更される（されない）」対、
および否定claim（自動更新しない・固定しない・持たない・返さない）が多数）:

| 対象 | 極性判定 | 判定根拠（一次資料） |
|---|---|---|
| 009/012/015（バリエラーあり）vs 010/013/014（エラーなし） | 両極性とも**excluded**: フォーム不存在＝「必須/相関バリデーションで」という観測主語が構成不能（エラーあり側は発生手段なし・なし側は限定不能）。m05-16のconstraint不存在型と同型。実在の入力検証はAjax妥当性のみで、それは004/044の期待テキストが独立に保持（C-020/023/024でbound） | m02-02md:93,257-258／index.twig:146-213（input/form 0件） |
| 016（DB相関エラーなし）vs 017（DB相関エラーあり） | 016=**semantic bind**（照会空でも0表示・エラーなし継続=C-035）／017=**TBD**（DB障害→共通例外委譲。md:46がHTTP/例外の列挙をスコープ外と明記＝オラクル化不能。excludedにしない=実在仕様） | m02-02md:111,190,259,288,46 |
| 019〜041の「追加される/変更される」（肯定14行） | **excluded**: read-only裁定（設計4箇所＋実装grep 0件＝DOC-DRAFT-m02-02-1）。「登録される」期待の捏造をしない | m02-02md:31,206,229,334／AdminController.php全文 |
| 020/025/027/030/032/037/039/057の「追加/変更されない」（否定8行） | **bound**: 無書込はdb.tsブラケット（dtb_order行数＋全列ダイジェスト＋マスタmtb_order_status全列ダイジェスト不変=C-036・§6.3c。相殺更新/過去行更新も検知）で実観測可能な否定＝除外しない。主張は標準環境に限定（改訂1） | AdminController.php:104-241（SELECTのみ）／m02-02md:229 |
| 011/049「モーダル・入力を持たない」 | 否定期待だが観測範囲が#chart-statistics内DOMに限定され観測可能→bound（C-013。グラフ取得失敗時の「専用通知なし」はC-025でroute介入により失敗状態を構成して観測） | m02-02md:92-93／index.twig:96-99,146-213 |
| 053「自動更新しない」 | 否定期待。観測契約を「監視窓内の表示値不変＋追加リクエスト0件」に限定して構成（無限の否定は主張しない）→bound（C-038） | index.twig:16-103（再取得コードなし）／m02-02md:193 |
| 056「同一トランザクションで固定しない」 | 非固定の直接証明は不能。設計の後段文「両者の値が一致しない場合がある」を**構成的に発生させて観測**（XHR遅延保留＋間のINSERT→乖離）→bound（C-040）。「一致すること」を期待にしない（非保証の誤反転を回避） | m02-02md:204,194 |
| 004/044「XHRかつCSRF妥当な場合**にのみ**JSONを返す」 | 「のみ」の全称部は正例（C-020）＋負例2系統（非XHR=C-023確定400NG／XHR+CSRF不正=C-024・実効ステータス要実機）で被覆。負例2系統の応答が**異なる**（400 JSON vs 例外委譲）ことを実装から把握し、C-024へ400NG期待を誤流用しない | AdminController.php:213-215／AbstractController.php:252-263 |
| 050「既定では〜除外する」 | 「既定では」の限定＝拡張フック差し替え（L1-030）が無い標準環境を前提条件に明記（C-030/C-031）。差し替え環境の挙動は対象外（§9-7） | AdminController.php:143-150,217-224／m02-02md:102-103,142 |
| 018「売上金額のみを使う」 | 「のみ」＝JSONにcountが**含まれる**事実（L1-016）とdatasetsがpriceのみ（L1-018）の両観測で構成（countがJSONに無いことを期待にしない誤反転を回避）→C-042 | AdminController.php:527-537／index.twig:80-92 |

codex敵対レビュー: **R1=要修正（Blocker2＋Major2。read-only裁定・excluded=20・TBD=017・境界式・CSRF2系統は
妥当確認済み）→改訂1で全数是正**。R1検出の記録（C4-manual実効性証跡）: ①read-only出典の過大列挙
（md:303=監査ログ不在をDB無更新根拠へ誤算入=**出典粒度の検出例**） ②C-036の観測がdtb_orderのみで
「マスタを更新しない」を立証不能（**観測契約とclaim範囲の不一致の検出例**） ③SUM/MAX要約値の
相殺更新・過去行更新検知漏れ＋参照先SQL未掲載（自己完結違反） ④hookのdispatch経路がある以上
無書込は標準環境限定でしか主張できない（**期待の過大**）。→§0/§4 C-036/§6.3c/§9-1/§10へ反映済み。
**R2再確認待ち**。判定確定後に `REVIEW_LEDGER.md` と同期する。

---

## 付録: 作業実測（B0係数計測用）

- 読んだ一次資料・参照物: 設計書md 1／ee実ソース・設定 15超（AdminController〔index/sale/getSalesByDay/
  getSalesByMonth/getData/convert全文〕・AbstractController(isTokenValid)・OrderStatus・Order(SoftDeleteable)・
  OrderStatusFilter・index.twig全文・default_frame.twig(meta/ajaxSetup/title)・EccubeExtension(price/
  currency_symbol)・Constant・security.yaml・services.yaml・doctrine.yaml・eccube.yaml）／locale 2
  （messages.ja/en.yaml該当帯）／母集合・fid_kubun 2／統治・見本 3／既存実装 5（e2e_cases md・spec・page・
  SEED-M02-SALES-DASHBOARD.sql・db.ts/oracle.ts）。
- L1 claim数: **29確定＋1 TBD**（=30行）。候補ケース行28（ja26・-EN2）。
- 売上集計系特有の難所: (1) **設計書自身が read-only 明記4箇所とDB操作節テンプレの登録/更新で自己矛盾**
  →裁定なしにはIT-26系29行のbind/excludedが決まらない（DOC-DRAFT起票で裁定を監査可能化）
  (2) **境界の非対称**: サマリは `開始以上・終了未満`（翌日0時不算入）だがグラフは `>= from かつ <= to(now)`
  で上限が「以下」＝同じ「期間境界」でも式が2種
  (3) **集計オラクルの三段参照**: SEED固定値を期待にせず「L1式のdb.ts独立評価⇔UI表示」突合に置く。
  そのためにはORM共通フィルタ（soft_deleteable）とセッションTZの整合という**設計スコープ外の実装層条件**を
  観測条件として明示する必要があった（L1-027・§9-6・§9-9）
  (4) CSRF負例が**2系統で応答が異なる**（非XHR=400 {"status":"NG"} 確定／XHR+不正CSRF=例外throw→共通例外
  委譲で要実機）＝1つの「エラー応答」に丸めると偽オラクルになる。

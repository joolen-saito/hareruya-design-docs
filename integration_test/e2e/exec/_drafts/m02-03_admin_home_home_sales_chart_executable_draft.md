# B0候補: m02-03 管理画面_トップ売上状況グラフ — 実行可能グレード候補（母集合59全量踏破）

> 2026-07-23 ／ **候補グレード（candidate・D6前・O5未確定・実装/実走なし）**
> codexレビュー: **R1=要修正（Blocker1=now時点非固定）→改訂1→R2=未達（skew窓ガードの論理不足）→
> 改訂2で根本是正・R3再確認待ち**（excluded=20/TBD=1・DOC-DRAFT2件裁定・捏造ゼロはR1で妥当確認済み）。
> **改訂2（codex R2是正・now依存を絶対値一致の対象から外す）**:
> 改訂1の「1時間skew窓に対象行0件→全バケット完全一致が決定的」は、**サーバCarbon::now()
> （AdminController.php:227）とdb.ts評価の実時差が1時間以内であることを証明できない**（実行遅延が
> それを超えれば将来日時の既存行が後続サーバ集計に入る余地）ため**撤回**（codex R2指摘・正当）。
> 是正=**バケット二層方式へ一本化**（§6.3e。縮退分岐も廃止）:
> (1) **過去確定バケット**（週間/月間の今日キーより前の全日キー・年間の当月キーより前の全月キー）＝
> 集計対象が `order_date < 当日0時/当月1日0時` の行のみでtoのnow実値に依存しない→
> **隔離・凍結DB前提で絶対値の完全一致**を主張
> (2) **現在期間バケット**（週間/月間の今日キー・年間の当月キー=nowを含む端バケット）＝
> **絶対値一致を一切主張しない**。SEED適用前後のJSON応答差分**Δのみ**を検証（既存now近傍行は
> 両応答に等しく含まれ相殺されるためΔは決定的。DB凍結に依存しない検証形）
> (3) ガードは「未来日付行0件」（skew仮定不要）＋同一日run確認へ差替え。サーバ基準時刻の直接束縛は
> **要実機のまま**（確定すれば現在期間バケットも絶対一致へ引き上げ可と留保=§9-8⑤）。
> 期待の正はL1集計式のまま（実装に寄せない・SEED非正の三段参照維持）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> source_class=standard-src+design は fid_kubun.tsv（D1・fid_kubun.tsv:165）による**暫定付与**（確定はD6）。
> fixture_version は全て `@TBD-D5`。統治: `integration_test/CONCRETIZATION_FIRST_PLAN.md`（三段会計）＋
> `integration_test/CONCRETIZATION_ROLLOUT_PLAN.md`（B0）。
> 正典: `integration_test/e2e/PILOT_m09_01_news_executable_grade.md`／同型見本: codex承認済み候補
> （m09-01・m05-16・m10-11・m03-11・m01-01・m01-02・m02-01・**m02-02** の各 `_drafts/*_executable_draft.md`）。
> **同一ホーム画面の売上系ブロックである m02-02（売上状況）候補の境界式・三段参照・decisive digest SQL・
> read-only裁定を強く参照**（本機能は同一カード内の「グラフ部分」のみが対象＝設計書md:12）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m02-03_admin_home_home_sales_chart_oracle_draft.json`。
> 正式パス `e2e/fixtures/oracle/` 直下には書かない。
> **行数集計**: 候補ケース行総数**26**＝bound対応20（ja19＋-EN1）＋補完6（ja6）。
> 母集合59=bound38＋TBD1＋excluded20。

## §0 版固定

- 設計書正本: `functions/ec-cube-enterprise/m02-03_admin_home_home_sales_chart.md`（本repo HEAD `d1e94c5e38246d0eff45b4079ee42397c994e69d` 時点。以下 m02-03md）。
- ee実ソース: `/home/y-saito/Developments/ec-cube-enterprise/` コミット `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51`（W0-B0既候補と同一）。
- fid_kubun.tsv（D1）: `M02-03｜m02-03_admin_home_home_sales_chart｜売上状況グラフ｜対象｜標準｜ec-cube-enterprise/m02-03_admin_home_home_sales_chart.md｜standard-src+design｜0`（fid_kubun.tsv:165。fid_kubun.tsv sha256先頭=44fbf02f1e4c）。
- 母集合: baseline `all_it_cases.tsv`（sha256先頭 `7911f190d273`）M02-03全**59行**（IT-M02-03-ADMIN-HOME-HOME-SALES-CHART-001〜059）。
- **スコープ委譲（m02-03md:12・39-41）**: 本機能は売上状況カードの**グラフ部分のみ**。今月/今日/昨日サマリの集計・表示、売上対象外ステータスの既定集合の確定列挙・拡張差し替えは **m02-02md を正**とし、本書は区間バケットとグラフ描画に限定（除外集合の実装実値は照合補助として§1に併記）。
- 既存実行実績（参考・本候補の会計外）: `integration_test/e2e/m02_03_admin_home_home_sales_chart_e2e_cases.md`
  （2026-07-06 Codex実走 **11〇/2×**。×は ①E2E-M02-03-003=`sale_chart`200でも`#loading`が非表示にならずタイムアウト
  ＝**BC-DRAFT-m02-03-1（§9-3）** ②E2E-M02-03-013=XHR+CSRF欠落で期待400に対し**実測HTTP403**
  ＝設計書の400全称記載との乖離＝**DOC-DRAFT-m02-03-2（§9-2）**。いずれも期待値を実装へ寄せない）。
- 既存道具（実装済み・再利用）: `e2e/helpers/db.ts`（psql照会）・`e2e/helpers/oracle.ts`（L1解決器＋_drafts隔離ガード）・
  `e2e/pages/admin/m02/m02_03_admin_home_home_sales_chart.page.ts`（セレクタ実機確認済み。※コメント中の
  messages.ja.yaml:1691-1693 は旧checkout値＝現行は:1884-1886。§9-11）・
  `e2e/seed/sets/m02/SEED-M02-SALES-DASHBOARD.sql`（±down.sql。m02-02と共用）。
- **判定原則（W0-W2教訓）**: 観点ラベル・前提条件/入力データ列のシナリオ語は**生成器ノイズ**。bindは各行の
  **「期待結果／レスポンス」実テキスト**で判定し、極性も期待テキストで確認する（§8に全59行の期待要旨併記）。
  本機能もm02-02と同じく、IT-26系の期待列が read-only 機能に対する「追加される/変更される」定型文
  （前提列「バッチ」「未認証」等との噛み合わせずれが大きい）。
- **設計書内矛盾の裁定（DOC-DRAFT-m02-03-1・§9-1）**: m02-03md:210-216「DB操作」節は
  `登録/更新｜dtb_order｜当機能が行う登録・更新で対象テーブルを直接保存する…persist/flush による即時反映` と記すが、
  同一設計書の**4箇所**（md:30「本グラフが受注台帳やマスタを更新せず、専用の業務監査ログを持たないこと」・
  md:173「本グラフは参照のみであり、受注台帳やマスタを更新しない」・md:196「本グラフの処理だけを見ると、
  受注台帳やマスタを更新しない」・md:306「本グラフのデータ生成は参照のみであり、業務トランザクションを張って
  受注を変更しない」）が**参照のみ**と明記し、ee実装も `AdminController.php` 全文に persist/flush/INSERT/UPDATE が
  **0件**（grep実測。sale/getData/convert は SELECT のみ）。既存記録 `m02_03_..._e2e_cases.md` 付帯表4#1 も同矛盾を
  「正本の節間矛盾・支配的記述は参照のみ」と記録済み。**裁定: 本機能は read-only を正**とし、DB操作節の
  登録/更新行は共通テンプレ由来のノイズと判定（期待値を「登録される」側に捏造しない）。この裁定が §8 の
  IT-26系「追加される/変更される」肯定14行の excluded 判定根拠（§9-2b）。m02-02のDOC-DRAFT-m02-02-1
  （codex R1で裁定妥当確認済み）と完全同型。

## §1 L1原子オラクル表

規約: claimは検査可能な期待実値まで分解。quoteは一次資料の逐語。LS=locale_sensitive（0は理由コード）。
**期待値の正は本表のオラクルIDでありSEED値ではない（三段参照）**。`%eccube_admin_route%` は環境値
（既定 `admin`・env `ECCUBE_ADMIN_ROUTE`＝eccube.yaml:69）。locale/currency/timezone は環境値
（既定 ja／JPY／Asia/Tokyo＝services.yaml:8-13）。

| oracle_id | 観点 | claim（検査可能な期待） | source_class(暫定) | 逐語quote | 根拠(file:line) | LS |
|---|---|---|---|---|---|---|
| L1-M0203-001 | auth_rule | 未認証で `GET /%eccube_admin_route%/`（ホーム）または `GET /%eccube_admin_route%/sale_chart` へアクセスすると、admin firewall（`^/%eccube_admin_route%/` はROLE_ADMIN必須）により `admin_login` のログイン画面へ誘導され、本グラフ・グラフ用データは利用できない | standard-src＋設計書md | `admin:`＋`    pattern: ['^/%eccube_admin_route%/','^/%eccube_messenger_route%/']`／`['path' => '^/%eccube_admin_route%/', 'roles' => 'ROLE_ADMIN'],`／「非管理者・未認証｜`GET /%eccube_admin_route%/`等（到達前にログインへ）｜ホーム画面自体に到達できないため、本グラフも利用できない」「未認証｜利用不可。管理領域の認証要件に従う。グラフ用データのAjaxにも到達できない」 | security.yaml:40-46／EccubeExtension.php:81-88／m02-03md:80,234 | 0 `non-translated` |
| L1-M0203-002 | http_status | ホーム画面=`GET /%eccube_admin_route%/`（route `admin_homepage`・GETのみ）。売上状況グラフはこの1画面内のカード内グラフ領域 | standard-src＋設計書md | `#[Route(path: '/%eccube_admin_route%/', name: 'admin_homepage', methods: ['GET'])]`／「ホーム画面を開く｜`GET /%eccube_admin_route%/`｜売上状況カードに週間・月間・年間のタブと読み込み中表示を含むグラフ領域が描画される」 | AdminController.php:102-104／m02-03md:77 | 0 `non-ui-observable` |
| L1-M0203-003 | http_status | グラフ用データ=`GET /%eccube_admin_route%/sale_chart`（route `admin_homepage_sale`・GETのみ・XHR＋CSRF前提・クエリ/ボディの利用者入力なし） | standard-src＋設計書md | `#[Route(path: '/%eccube_admin_route%/sale_chart', name: 'admin_homepage_sale', methods: ['GET'])]`／「売上グラフ用データの非同期取得｜`GET /%eccube_admin_route%/sale_chart`（XHR・CSRFトークン付与が前提）」「グラフ用データはクエリやボディでの利用者入力を受け取らず」 | AdminController.php:210-211／m02-03md:78,193 | 0 `non-ui-observable` |
| L1-M0203-004 | display_field | グラフ部分のDOM一式（`#chart-statistics` カード内）: pill型3タブ `#pills-weekly-tab`（ja「週間」/en "Weekly"・**初期 `active`・`aria-selected="true"`**）・`#pills-monthly-tab`（「月間」/"Monthly"）・`#pills-year-tab`（「年間」/"Yearly"）＝クラス `nav-link btn btn-ec-tab`・`data-bs-toggle="pill"`／タブペイン `#pills-weekly`（初期 `tab-pane fade show active`）・`#pills-monthly`・`#pills-year`（`tab-pane fade`）内に `canvas#chart-0/#chart-1/#chart-2`／読み込み中 `#loading`（`text-center pt-5`・img）。管理画面共通のカード・タブ・グラフ領域・ローディングのクラスを使う | standard-src＋設計書md | `<a class="nav-link active btn btn-ec-tab py-2 ps-4 pe-4" id="pills-weekly-tab" data-bs-toggle="pill" href="#pills-weekly" role="tab" aria-controls="pills-weekly" aria-selected="true">`＋`{{ 'admin.home.sales_summary_weekly'|trans }}`（monthly/year同型・aria-selected="false"）／`<div id="loading" class="text-center pt-5">`／`<div class="tab-pane fade show active" id="pills-weekly" …><canvas id="chart-0"></canvas></div>`（monthly=chart-1/year=chart-2は`tab-pane fade`）／`admin.home.sales_summary_weekly: 週間`・`admin.home.sales_summary_monthly: 月間`・`admin.home.sales_summary_yearly: 年間`／`admin.home.sales_summary_weekly: Weekly`・`admin.home.sales_summary_monthly: Monthly`・`admin.home.sales_summary_yearly: Yearly`／「売上状況カードのグラフ部分には、週間・月間・年間の3タブ、各タブに対応する canvas（`chart-0`・`chart-1`・`chart-2`）、読み込み中インジケータ（`#loading`）を配置する。初期状態は週間タブが選択済みである」「週間・月間・年間タブは管理画面共通のピル型タブとして表示領域を切り替える」「管理画面共通のカード、タブ、グラフ領域、ローディング表示のクラスを使う」 | index.twig:146,180-208／messages.ja.yaml:1884-1886／messages.en.yaml:1862-1864／m02-03md:88,91-92 | 1 |
| L1-M0203-005 | ajax_rule | グラフ用XHRのCSRF供給機構: 管理共通レイアウトが `<meta name="eccube-csrf-token">` を出力し `$.ajaxSetup` で全Ajaxに `ECCUBE-CSRF-TOKEN` ヘッダを付与。サーバ側 `isTokenValid()` は `_token` パラメータ**または**同ヘッダのトークンを `Constant::TOKEN_NAME`（`'_token'`）IDで検証 | standard-src＋設計書md | `<meta name="eccube-csrf-token" content="{{ csrf_token(constant('Eccube\\Common\\Constant::TOKEN_NAME')) }}">`／`$.ajaxSetup({ 'headers': { 'ECCUBE-CSRF-TOKEN': $('meta[name="eccube-csrf-token"]').attr('content') } });`／`$token = $request->get(Constant::TOKEN_NAME) ?: $request->headers->get('ECCUBE-CSRF-TOKEN');`／`public const TOKEN_NAME = '_token';`／「ホーム画面のレイアウトで共通設定されているAjax用ヘッダにCSRFトークンが付与され」 | default_frame.twig:16,83-87／AbstractController.php:252-263／Constant.php:41／m02-03md:78,108 | 0 `non-ui-observable` |
| L1-M0203-006 | ajax_rule | **非XHR**で `GET /sale_chart`（認証済みでも）→ `isXmlHttpRequest()` が偽（短絡でCSRF評価前）→ **HTTP 400・本文 `{"status":"NG"}`**・以降の集計を行わない。グラフ用JSON配列は返らない（既存実走E2E-M02-03-010で〇実証済み） | standard-src＋設計書md | `if (!($request->isXmlHttpRequest() && $this->isTokenValid())) {`＋`    return $this->json(['status' => 'NG'], 400);`＋`}`／「サーバはXMLHttpRequestかつCSRFが妥当な場合にのみ週間・月間・年間のバケット集合をJSONで返す。条件を満たさない場合はHTTP400で`{"status":"NG"}`を返し」「いずれかを満たさない場合はHTTP400で`{"status":"NG"}`を返し、以降の集計を行わない」 | AdminController.php:213-215／m02-03md:78,109,185 | 0 `non-translated` |
| L1-M0203-007 | ajax_rule | **XHRだがCSRF欠落/不正**→ `isTokenValid()` が `AccessDeniedHttpException('CSRF token is invalid.')` を**throw**（returnでなく例外）→ 共通例外処理に委譲され、グラフ用JSON配列は返らない。**設計書はこの分岐も「HTTP400 `{"status":"NG"}`」と記す（md:109の全称）が、実装は例外委譲で既存実走2026-07-06はHTTP403を実測＝DOC-DRAFT-m02-03-2（§9-2）**。候補の期待は「成功配列を返さない・成功しない」まで（実効ステータス/本文形式は要実機・共通例外処理依存） | standard-src＋設計書md | `if (!$this->isCsrfTokenValid(Constant::TOKEN_NAME, $token)) {`＋`    throw new AccessDeniedHttpException('CSRF token is invalid.');`＋`}`／「サーバはXMLHttpRequestかつCSRFが妥当かを判定する。いずれかを満たさない場合はHTTP400で`{"status":"NG"}`を返し」（=設計書の全称・実装と乖離）／既存記録「実レスポンスはHTTP403。CSRF不成立時のエラー応答が設計書と異なる」 | AbstractController.php:256-261／AdminController.php:213／m02-03md:78,109／`integration_test/e2e/m02_03_..._e2e_cases.md` E2E-M02-03-013失敗理由 | 0 `non-translated` |
| L1-M0203-008 | json_contract | 成功時のJSON: **3要素配列 `[週間, 月間, 年間]`**。各要素は `{ "<バケットキー>": { "price": <売上金額合計>, "count": <件数> }, … }` のバケット集合（金額と件数の双方を保持） | standard-src＋設計書md | `$datas = [$rawWeekly, $rawMonthly, $rawYear];`＋`return $this->json($datas);`／`$raw[$date->format($format)]['price'] = 0;`＋`$raw[$date->format($format)]['count'] = 0;`…`$raw[$Order->getOrderDate()->format($format)]['price'] += $Order->getPaymentTotal();`＋`++$raw[$Order->getOrderDate()->format($format)]['count'];`／「三つのバケット集合を週間・月間・年間の順に並べた配列をJSONで返す」「成功時出力｜週間・月間・年間のバケット集合を並べたJSON配列。各バケットはキーごとに売上金額と件数を持つ」 | AdminController.php:239-241,526-535／m02-03md:116,194 | 0 `non-ui-observable` |
| L1-M0203-009 | bucket_rule | 3区間の定義: 週間=`Carbon::today()->subWeek()`（当日から約一週間さかのぼった日の0時）〜`Carbon::now()`・キー `Y/m/d`／月間=`Carbon::now()->startOfMonth()`（当月1日0時）〜now・キー `Y/m/d`／年間=`Carbon::now()->subYear()->startOfMonth()`（約一年さかのぼった月の1日0時）〜now・キー `Y/m`。終了境界はいずれも**取得処理開始時の現在時刻**（3区間で同一の `$toDate`） | standard-src＋設計書md | `$toDate = Carbon::now(); $fromDate = Carbon::today()->subWeek(); $rawWeekly = $this->getData($fromDate, $toDate, 'Y/m/d');`＋`$fromDate = Carbon::now()->startOfMonth(); $rawMonthly = …'Y/m/d');`＋`$fromDate = Carbon::now()->subYear()->startOfMonth(); $rawYear = …'Y/m');`／「週間相当。当日0時から現在時刻までの区間。開始は当日から過去へ約一週間さかのぼった日とし、バケットキーは日単位（`Y/m/d`）」「月間相当。当月1日0時から現在時刻まで…日単位」「年間相当。現在時刻から過去へ約一年さかのぼった月の1日0時から現在時刻まで…年月単位（`Y/m`）」「終了境界はいずれも取得処理開始時の現在時刻に基づく」 | AdminController.php:226-237／m02-03md:111-113,131-133,169 | 0 `non-translated` |
| L1-M0203-010 | boundary_rule | 対象抽出は `order_date >= fromDate` **かつ** `order_date <= toDate`＝**開始日時以上かつ終了日時以下・両端を含む**（m02-02サマリの「終了未満」と非対称）。並びは `order_date` 昇順で読み取り | standard-src＋設計書md | `->andWhere('o.order_date >= :fromDate')`＋`->andWhere('o.order_date <= :toDate')`＋`->orderBy('o.order_date');`／「各区間とも開始日時以上かつ終了日時以下の`order_date`を対象とし、両端を含む範囲条件で受注を読み取る。終了日時は取得処理開始時の現在時刻である」 | AdminController.php:503-504,509／m02-03md:135 | 0 `non-translated` |
| L1-M0203-011 | bucket_rule | バケットの0初期化: 各区間で開始日から終了日まで**1日ずつ**進めてキーを生成し `price=0,count=0` で初期化→売上が無い日/月も0バケットとして残り**横軸ラベルが欠けない**（該当受注0件なら全バケット0・棒の高さ0） | standard-src＋設計書md | `for ($date = $fromDate; $date <= $toDate; $date = $date->addDay()) { $raw[$date->format($format)]['price'] = 0; $raw[$date->format($format)]['count'] = 0; }`／「各区間について開始日から終了日まで1日ずつ進めてバケットキーを生成し、売上金額・件数を0で初期化する。これにより売上が無い期間も横軸ラベルとして残る」「該当受注が0件｜各区間のバケットはすべて0で埋まる。横軸ラベルは区間内の各日（年間は各月）が残り、棒の高さは0になる」 | AdminController.php:526-529／m02-03md:145,155,158 | 0 `non-translated` |
| L1-M0203-012 | bucket_rule | 年間の月集約: 年間区間はキー書式 `Y/m` のため、日単位で進めても同一月の各日が**同一キーへ集約**され、結果として年間グラフは**月単位の棒**になる（週間・月間は `Y/m/d` で日ごとの棒） | standard-src＋設計書md | `$rawYear = $this->getData($fromDate, $toDate, 'Y/m');`＋（convertはformatにY/mを適用=AdminController.php:526-529）／「年間区間はバケットキーを年月（`Y/m`）で生成するため、日単位で進めても同一月の各日が同一キーへ集約される。結果として年間グラフは月単位の棒になる」「月末・月またぎ｜…年間は年月単位のため、同一月内の受注が同一バケットへ集約される」 | AdminController.php:237,526-529／m02-03md:24,114,146,159 | 0 `non-translated` |
| L1-M0203-013 | aggregation_rule | 加算式: 範囲・ステータス条件に合う各受注について、`order_date` をキー書式へ変換した該当バケットに `price += payment_total`・`count += 1`。`payment_total=0` の受注は件数+1・金額+0（棒の高さ0扱い）。税/送料等の内訳は再計算しない | standard-src＋設計書md | `$raw[$Order->getOrderDate()->format($format)]['price'] += $Order->getPaymentTotal();`＋`++$raw[$Order->getOrderDate()->format($format)]['count'];`／「範囲内の各受注を、その受注日をバケットキー書式へ変換して該当バケットへ加算する。売上金額はバケットの値へ加算し、件数はバケットの件数を1増やす」「`payment_total`が0の受注｜ステータスと期間条件に一致する場合、バケットの件数を1増やし、売上金額には0を加算する。棒グラフでは高さ0として扱う」「税、送料、値引、手数料の内訳は本グラフでは再計算しない」 | AdminController.php:531-534／m02-03md:115,144,157 | 0 `non-translated` |
| L1-M0203-014 | aggregation_rule | 売上対象外ステータスの受注は `OrderStatus NOT IN (:excludes)` でバケットへ加算しない。実装既定=CANCEL(3)/PENDING(7)/PROCESSING(8)/RETURNED(15)（コントローラのプロパティ `$this->excludes`＝照合補助の実装実値）。**既定集合の確定列挙・拡張差し替えの正は m02-02md へ委譲**（m02-02候補L1-M0202-008/009が正本） | standard-src＋設計書md | `->andWhere('o.OrderStatus NOT IN (:excludes)')`＋`->setParameter(':excludes', $this->excludes)`／`private array $excludes = [OrderStatus::CANCEL, OrderStatus::PENDING, OrderStatus::PROCESSING, OrderStatus::RETURNED];`／「売上対象外ステータスの受注｜バケットへ加算しない。除外集合の確定は m02-02_admin_home_home_sales_status.md を正とする」「売上対象外ステータスの既定集合と拡張差し替えは m02-02_admin_home_home_sales_status.md を正とする」 | AdminController.php:55,505-506／OrderStatus.php:34-57／m02-03md:68,135,156 | 0 `non-translated` |
| L1-M0203-015 | js_rule | 描画のJS挙動: ページ表示後 `$(function)` 内で**1回だけ** `admin_homepage_sale` へ `$.ajax`（GET/json）→ `done` で配列を順に `#chart-` + i（0/1/2）へ対応づけ `new Chart(type:'bar')` を生成。データは `labels=バケットキー`・**datasets 1系列のみ `data: prices`（各バケットの `price` のみ。`count` は系列に使わない）**・系列label=`admin.home.sales_summary_amount` ja「売上金額」/en "Sales Amount" | standard-src＋設計書md | `$.ajax({ url: '{{ url('admin_homepage_sale') }}', type: 'GET', dataType: 'json' }).done(function(datas) { for (var i = 0; i < datas.length; i++) {`…`labels.push(key); prices.push(data[key].price);`…`var ctx = $('#chart-' + i)[0].getContext('2d');`…`type: 'bar',`…`datasets: [ { type: 'bar', label: '{{ 'admin.home.sales_summary_amount'|trans }}', data: prices, …} ]`／`admin.home.sales_summary_amount: 売上金額`／`admin.home.sales_summary_amount: Sales Amount`／「ホーム画面表示後にグラフ用データを非同期で1回取得する。取得成功時、返却された配列の各要素を順に`chart-0`・`chart-1`・`chart-2`へ対応づけ、各canvasにChart.jsの棒グラフを生成する。各グラフはバケットキーを横軸ラベル、売上金額を縦棒の値とする」「縦棒の系列ラベルは売上金額を示す文言とする」「グラフ系列｜棒グラフの縦棒は売上金額のみを用いる。バケットの件数はJSONに含まれるが、グラフの系列としては使わない」 | index.twig:19,55-94／messages.ja.yaml:1887／messages.en.yaml:1865／m02-03md:89,120-122,143 | 1（labelのみ。描画内部の読取は要実機=§9-8） |
| L1-M0203-016 | js_rule | 失敗時挙動: `fail` ハンドラは**空**・`always` で `$('#loading').hide()`＝**取得の成否にかかわらず完了時に読み込み中インジケータは非表示**になる。失敗時はグラフ未描画のまま同一画面・利用者向け専用通知（モーダル/トースト/アラート/フラッシュ）を表示しない。※既存実走で「200でも#loadingが消えない」×実績あり=BC-DRAFT-m02-03-1（§9-3。期待は設計側を維持） | standard-src＋設計書md | `}).fail(function(data) { }).always(function() { $('#loading').hide(); });`／「取得の成否にかかわらず完了時に読み込み中インジケータを非表示にする」「取得に失敗した場合も読み込み表示は消えるが、グラフは描画されない」「フロント側は専用の利用者向けメッセージを表示せず、グラフ未描画の状態になる」「グラフ取得失敗｜同一画面のまま。グラフ未描画。利用者向けメッセージは表示しない」 | index.twig:96-98／m02-03md:89,123,185,247,257,261 | 0 `non-translated` |
| L1-M0203-017 | tab_rule | タブ切替は Bootstrap pill（`data-bs-toggle="pill"`/`href="#pills-*"`）による**同一ページ内の表示切替のみ**。押下でペインの `active` が切り替わり、**追加のサーバ問い合わせもグラフ再生成も行わない**（サーバへ送る入力値も生成しない） | standard-src＋設計書md | `<a class="nav-link active btn btn-ec-tab …" id="pills-weekly-tab" data-bs-toggle="pill" href="#pills-weekly" …>`（monthly/year同型）／「同一ページ内でタブ表示が切り替わり、対応するcanvasに描画済みのグラフが表示される。タブ切替自体で追加のサーバ問い合わせは行わない」「タブ切替では追加のサーバ問い合わせやグラフ再生成を行わない」「タブ切替は表示領域の切替のみであり、サーバへ送る入力値を生成しない」 | index.twig:182-190／m02-03md:79,91,149,245 | 0 `non-translated` |
| L1-M0203-018 | display | グラフ整形: ツールチップの値は `currency_symbol()`（`Currencies::getSymbol(currency)`）を前置し3桁区切りカンマを付す。縦軸目盛りは `Math.floor(value)===value`（**整数値のときのみ**）通貨記号＋桁区切りでラベル表示し、整数でない目盛り値はラベルなし。横軸ラベルはバケットキーそのまま。**各canvasの高さは100**（`ctx.canvas.height = 100`）。通貨記号の具体グリフはICU実装値=要実機（§9-7） | standard-src＋設計書md | `label: function(tooltipItem) { return '{{ currency_symbol() }}' + tooltipItem.formattedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }`／`ticks: { callback: function(value, index, ticks) { if (Math.floor(value) === value) { return '{{ currency_symbol() }}' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); } } }`／`ctx.canvas.height = 100;`／「ツールチップの値は通貨記号を前置し、3桁区切りのカンマを付して整形する。縦軸目盛りは整数値のときのみ通貨記号と桁区切りを付して表示し、整数でない目盛り値はラベルを表示しない。各canvasの高さは100に設定する」「横軸ラベルはバケットキー（週間・月間は`Y/m/d`、年間は`Y/m`）をそのまま用いる」 | index.twig:29-49,76／EccubeExtension.php:67,372-378／m02-03md:90,147 | 0 `non-translated`（記号グリフは環境値・§9-7） |
| L1-M0203-019 | db_effect(read-only) | ホーム表示・グラフ取得のいずれも `dtb_order`・マスタへ**登録/更新/削除を行わない**（AdminController.php全文に persist/flush/INSERT/UPDATE 0件=grep実測。sale/getData/convert はSELECTのみ）。観測契約: 表示＋XHR＋タブ操作の前後で `dtb_order` の行数・主キー順全列ダイジェスト、参照マスタ `mtb_order_status` の全列ダイジェストが不変（§6.3c）。**前提=標準環境**（sale()は `ADMIN_ADMIM_INDEX_SALES` をdispatchするため書込みlistenerを差し込むプラグイン導入環境では主張しない=L1-M0203-025）。設計書DB操作節（md:210-216）の「登録/更新」行は**DOC-DRAFT-m02-03-1（§0裁定・§9-1）のテンプレノイズ**であり期待にしない | standard-src＋設計書md | 「本グラフが受注台帳やマスタを更新せず、専用の業務監査ログを持たないこと」「本グラフは参照のみであり、受注台帳やマスタを更新しない」「本グラフの処理だけを見ると、受注台帳やマスタを更新しない」「本グラフのデータ生成は参照のみであり、業務トランザクションを張って受注を変更しない。受注台帳に対する楽観ロックや悲観ロックの対象ではない」／AdminController.php（全文にpersist/flush/INSERT/UPDATE不存在=grep 0件） | m02-03md:30,173,196,306／AdminController.php:210-241,500-537 | 0 `non-ui-observable` |
| L1-M0203-020 | data_rule | 本グラフは**読み取り時点の永続化済みデータだけを読む**・**バッチを起動しない**: 外部連携/バッチ等の別処理で受注が更新済みの場合、次回のグラフ取得時にその時点のDB値がバケットへ反映される。反映タイミングそのものの正は外部連携/バッチ機能の設計（委譲宣言部分はオラクル化しない）。「バッチを起動しない」の観測契約は限定構成（§10）: ①取得は同期JSONで完結（C-020）②取得前後で受注台帳・マスタ無変化（C-036）③バッチ相当のDB直接更新は次回取得時の読取で反映（C-037） | standard-src＋設計書md | 「バッチ｜本グラフはバッチを起動しない。バッチによって受注が更新済みの場合、次回のグラフ取得時にその時点の永続化済みデータを読む」「外部連携やバッチにより受注が更新される場合の反映タイミングは、外部連携機能またはバッチ機能の設計を正とする。本グラフは読み取り時点の永続化済みデータだけを読む」 | m02-03md:174,183／AdminController.php:210-241（毎リクエストでDBを読む・キャッシュ層/ジョブ投入なし） | 0 `non-ui-observable` |
| L1-M0203-021 | data_rule | **描画済みのグラフは自動更新しない**: グラフ用XHRは初期表示時の1回のみ（`$(function)`直下・ポーリング/interval/websocketなし=index.twig:16-103のJS全文に再取得コード0件）。表示後にDBの受注が変わっても、ホーム画面再表示（再度の非同期取得）までは画面値・追加リクエストとも発生しない。リアルタイムダッシュボードではない | standard-src＋設計書md | `$(function() { … $.ajax({ url: '{{ url('admin_homepage_sale') }}', … }) … });`（1回のみ）／「表示後に受注が更新された｜描画済みのグラフは自動更新しない。ホーム画面再表示時に再度非同期取得した結果に従う」「表示直後に台帳が変化｜描画済みのグラフは同一瞬間のスナップショットではない。リアルタイムダッシュボードではない」 | index.twig:16-103／m02-03md:160,259 | 0 `non-translated` |
| L1-M0203-022 | data_rule | サマリ（ホームHTML表示時にサーバ側で読取=m02-02側）とグラフ（表示後の別Ajaxで読取）は**別リクエスト・同一トランザクション非固定**: 表示直後に受注が更新された場合は値が一致しないことがある（一致は非保証＝「一致すること」を期待にしない。乖離が発生し得ることの実証は2読取間へのDB変更注入で観測）。区間間（週/月/年）も独立した問い合わせでスナップショット非固定＝重なる期間の厳密一致は非保証（等式期待を置かない=§10） | standard-src＋設計書md | 「今月・今日・昨日の売上サマリはホーム画面HTML表示時に読み取り、グラフは別リクエストで読み取る。両者を同一トランザクションで固定せず、表示直後に受注が更新された場合は値が一致しないことがある」「週間・月間・年間は同一リクエスト内で順に集計するが、それぞれ独立した問い合わせ結果であり、スナップショットを固定しない」 | m02-03md:170-171／AdminController.php:153-157（index内サマリ）と210-241（sale別route） | 0 `non-ui-observable` |
| L1-M0203-023 | empty_rule | 該当受注が無いときもエラーにならず継続: 集計クエリ結果が空でも0初期化済みバケット（L1-011）がそのまま返り、画面は棒高さ0のグラフを描画する（「集計の空｜該当受注が無いとき、各区間のバケットは期間内キーを0で埋める」） | standard-src＋設計書md | `for ($date = $fromDate; …) { $raw[…]['price'] = 0; … }`＋`foreach ($result as $Order) {…}`（空配列なら加算なしで0のまま）／「集計の空｜該当受注が無いとき、各区間のバケットは期間内キーを0で埋める」「該当受注が0件｜各区間のバケットはすべて0で埋まる」 | AdminController.php:512-535／m02-03md:155,226 | 0 `non-translated` |
| L1-M0203-024 | cookie/session | 本機能はグラフ表示のための**専用Cookieを新規設定せず**、本グラフ専用のセッションキー書き込みも持たない（セッションCookieは管理画面全体の認証用）。観測契約: ホーム表示＋グラフXHR＋タブ操作の前後で context のCookie集合に認証/セッション系以外の新規Cookieが増えない | standard-src＋設計書md | 「本機能はグラフ表示のためだけに新たなCookieを設定しない。ブラウザのセッションCookieはフレームワークおよび管理画面全体の認証に用いられる」「ホーム画面表示時｜売上状況グラフのためだけにセッションを更新しない」「グラフ用Ajax｜認証済みセッションのもとで実行されるが、本グラフ専用のセッションキー書き込みは持たない」「グラフ取得でもセッションを本グラフ専用に書き換えない」／AdminController::sale に `$session->set` 不存在 | m02-03md:293-294,300,196／AdminController.php:210-241 | 0 `non-ui-observable` |
| L1-M0203-025 | ext_hook | 売上対象外ステータスは取得のたび拡張フック `ADMIN_ADMIM_INDEX_SALES` で確定してから集計に使う（プラグインが差し替える場合がある）。**標準環境（差し替えプラグインなし）では既定値（L1-014）が実効**＝集計系ケースの前提条件。差し替え仕様の正は m02-02md | standard-src＋設計書md | `$this->eventDispatcher->dispatch($event, EccubeEvents::ADMIN_ADMIM_INDEX_SALES); $this->excludes = $event->getArgument('excludes');`／「条件を満たす場合、サーバは売上対象外ステータスを拡張フックで確定したうえで…受注を読み取り」「売上対象外ステータスの既定集合の確定列挙、拡張フックによる差し替え…（m02-02_admin_home_home_sales_status.mdを正とする）」 | AdminController.php:217-224／m02-03md:110,40 | 0 `non-translated` |
| L1-M0203-026 | orm_layer | 集計クエリの実効条件にはORM共通フィルタ **soft_deleteable（`enabled: true`）** が加わる: 論理削除済み受注（`deleted_at IS NOT NULL`）は集計対象外。設計書はソフトデリート等の条件列挙をスコープ外と明記（md:45）＝本claimは**db.ts突合SQLの条件整合のための実装層claim**（standard-srcのみ・設計期待の上書きではない） | standard-src | `soft_deleteable:`＋`    class: Gedmo\SoftDeleteable\Filter\SoftDeleteableFilter`＋`    enabled: true`／`#[Gedmo\SoftDeleteable(fieldName: 'deletedAt', timeAware: false)]`／（設計側）「Doctrineのクエリキャッシュ、ソフトデリートやマルチテナント等により受注が集計から除外される場合の詳細な条件列挙」は本書で扱わない | doctrine.yaml:78-86／Order.php:153,771-772／m02-03md:45 | 0 `non-ui-observable` |
| L1-M0203-027 | **TBD** | データベース読み取り障害時は「アプリケーションの共通例外処理に委ねる。本グラフ専用の利用者向けメッセージは設けない」＝**実claimだが観測契約が定義不能**: HTTPステータス・例外型の列挙は設計書が明示的にスコープ外（md:46）とし、DB障害の安全な誘発手段も標準環境に無い。**未確定オラクル台帳へ**（excludedにしない=実在仕様の除外禁止。m02-02 L1-M0202-028と同型） | 設計書md | 「データベース読み取りの障害｜アプリケーションの共通例外処理に委ねる。本グラフ専用の利用者向けメッセージは設けない」「データベース障害時はアプリケーションの共通例外処理に委ねられる」「データベース接続失敗時のHTTPステータスや例外型の列挙」（=扱わないこと） | m02-03md:258,195,46 | — |

計**27行＝26claim確定＋L1-M0203-027 TBD**。

## §2 SEED三段参照設計（SEED-M02-SALES系＋グラフ期間別）

三段参照: `L1 claim（期待の正） → fixture_version（SEEDセットID@manifest_sha1） → 実値`。**SEED固定値は入力の
再現手段であり期待値の正にしない**: グラフ集計ケースの期待は「L1の区間式・加算式をdb.tsで実DB状態に対して
独立評価したバケット値」（§6.3）であり、SEED既知値はブラケット（適用前後差分）のサニティ確認にのみ使う。
全て `@TBD-D5`。**実装済み実体は m02-02 と共用の `e2e/seed/sets/m02/SEED-M02-SALES-DASHBOARD.sql`（±down.sql）**。
グラフ境界用サブセットのみ**新規（未実装・実装waveで追加）**。

| SEEDセットID | 目的 | 固定値（実SQL実測/新規は仕様） | 後始末 |
|---|---|---|---|
| SEED-M02-ADMIN | 2FA OFFの有効管理者（ログイン直後にホーム到達） | `config/default.config.ts` の ECCUBE_ADMIN_USER/PASS 既定 | 既存利用・撤去不要 |
| SEED-M02-SALES-INCLUDE | 売上算入ステータスの受注（今日=週間・月間・年間の全区間に入る） | dtb_order id=900000021〜30・status_id=1,2,4,5,6,9,10,12,13,14・payment_total=1000〜10000（計55,000円/10件）・order_no=`E2E-M02-SALES-INCLUDE-*`（実装済み・m02-02と共用） | ON CONFLICT UPSERTべき等・down.sqlでマーカー`E2E-M02-SALES-%`＋帯ID撤去 |
| SEED-M02-SALES-EXCLUDE | 既定除外4ステータス各1件（今日・期間内） | id=900000031〜34・status_id=3,7,8,15・payment_total=3100/3200/3300/3400（実装済み） | 同上 |
| SEED-M02-SALES-ZERO | payment_total=0の対象受注（今日） | id=900000035・status_id=1・payment_total=0（実装済み） | 同上 |
| SEED-M0203-CHART-SPREAD | **新規**: 週間区間の複数日バケット分布（当日・1日前・3日前・6日前に各1件）＋前月内1件（年間のみに入る）＝バケット別合計の突合とY/m集約の観測用 | 900000045〜49帯・order_no=`E2E-M0203-CHART-%`・対象ステータス（status_id=1）・金額は日毎に異なる素数系値（衝突検出性） | マーカー条件DELETE（down.sql同型・未実装） |
| SEED-M0203-CHART-BOUNDARY | **新規**: グラフ境界受注=「7日前0時ちょうど」（週間fromちょうど=**算入**・両端含む）・「7日前0時の1秒前」（週間**不算入**・年間には算入）・「1年前の月初0時ちょうど」（年間**算入**）・「その1秒前」（年間**不算入**） | 900000050〜53帯・order_no=`E2E-M0203-CHART-B-%`。※`<= now`側（上限）はSEEDで作れない（未来時刻は挿入しても取得時nowに依存）＝上限境界は式評価一致のみで担保 | 同上（未実装） |
| （0件状態） | 対象期間に売上対象受注0件（C-035前提） | 実体データなし（状態の不在）。**共有DBでは単独保証不能＝隔離DB/期間窓必須**（§9-6） | — |

- 集計ケース（C-030/031/032/033/034）の照会は **run内ブラケット**（SEED適用前後のdb.ts式評価差分＋
  sale_chart JSON応答値と式評価値の突合）で行い、共有DB上の他受注に依存しない。**実行前提=隔離・凍結DB＋§6.3e二層方式**
  （codex R2是正。過去確定バケット=絶対値完全一致／現在期間バケット〔今日キー/当月キー〕=SEED適用前後の
  JSON差分Δのみ。全SEED・直接INSERTの `order_date` は前日以前〔過去確定用〕または当日0時台〜〔Δ用〕に
  配置し未来日時は使わない・未来日付行0件を機械ガードで実行時証明する）。
- BOUNDARY/SPREAD系は**時刻依存**: 0時近傍・月初日・月末日の実行では窓がずれる（§9-8。spec実装waveで
  実行時刻ガード必須。「7日前0時ちょうど」はrun時に動的算出してINSERTする=静的SQLでは表現不能）。

## §3 グラフ表示/期間/集計マトリクス

三値比較: 設計書md（区間:111-113,131-133・境界:135・バケット:145-146・エッジ:153-161）／ee Controller
（AdminController.php:226-237,500-535）／ee twig（index.twig:19-99,180-208）。除外集合の正はm02-02md（委譲=L1-014）。

### 3a. 区間×境界×バケット×観測面

| 区分 | 区間開始 | 区間終了 | 境界極性 | バケットキー | canvas | 観測面（正） | L1 |
|---|---|---|---|---|---|---|---|
| 週間 | 当日0時−1週間（`today()->subWeek()`） | 取得時now | `>= from`・**`<= to`（両端含む）** | 日 `Y/m/d`・0埋め連続 | #chart-0（初期表示ペイン） | sale_chart JSON `datas[0]`（決定的） | L1-009,010,011 |
| 月間 | 当月1日0時（`startOfMonth`） | 同一now | 同上 | 日 `Y/m/d`・0埋め連続 | #chart-1 | JSON `datas[1]` | L1-009,010,011 |
| 年間 | 1年前の月初0時（`subYear()->startOfMonth()`） | 同一now | 同上 | 年月 `Y/m`・**月集約** | #chart-2 | JSON `datas[2]` | L1-009,010,012 |

※ 同一ホームのサマリ（m02-02）は終了「未満」＝**本グラフの「以下」と非対称**（m02-02候補§9-6と対）。

### 3b. 入力×バケット反映

| 入力 | price | count | 出典 |
|---|---|---|---|
| 売上算入ステータスの受注（期間内） | +payment_total | +1 | L1-013,014 |
| 既定除外4ステータス（3/7/8/15。正はm02-02md） | 加算なし | 加算なし | L1-014 |
| payment_total=0（対象ステータス・期間内） | +0（棒高さ0） | **+1** | L1-013 |
| 論理削除済み（deleted_at NOT NULL） | 対象外（ORM共通フィルタ） | 対象外 | L1-026 |
| 該当0件 | 全キー0 | 全キー0（キー欠落なし） | L1-011,023 |
| 7日前0時ちょうど（週間from） | 週間に**算入**（両端含む） | 同 | L1-010 |
| 1年前月初0時ちょうど（年間from） | 年間に**算入** | 同 | L1-010 |

### 3c. 表示整形（canvas内部=要実機領域）

| 面 | 書式 | 観測手段 | L1 |
|---|---|---|---|
| 系列 | 1系列のみ・data=各バケットprice・label ja「売上金額」/en "Sales Amount" | Chartインスタンス読取（要実機=§9-8）。JSON側のprice/count保持は自動 | L1-015 |
| ツールチップ | `currency_symbol()`前置＋3桁カンマ | Chart options/callback読取（要実機） | L1-018 |
| 縦軸目盛り | 整数値のみラベル（`Math.floor(value)===value`）・通貨記号＋桁区切り | 同上 | L1-018 |
| 横軸 | バケットキーそのまま（Y/m/d・Y/m） | Chart labels読取（要実機）。JSONキーは自動 | L1-015,018 |
| canvas | `height=100`属性 | DOM属性読取（自動可） | L1-018 |

## §4 実行可能グレード14列TSV（候補・**自己完結＝全26行を実体掲載**）

記法: 期待結果セルは三段参照 `…実値… [L1:<oracle_id>; fixture:<SEEDセットID>@TBD-D5]`。
`%eccube_admin_route%` は環境値（既定 `admin`）。セレクタ（page実装済み・Twig由来）:
`#chart-statistics`（index.twig:146）・`#pills-weekly-tab/#pills-monthly-tab/#pills-year-tab`（:182,185,188）・
ペイン `#pills-weekly/#pills-monthly/#pills-year`（:200,203,206）・`#chart-0/#chart-1/#chart-2`（:201,204,207）・
`#loading`（:196）。直接GET/XHR偽装のrequest契約は§6.1-6.2・db.ts区間集計照会は§6.3。en行はD15前提。

### §4.1 bound対応候補行（20行=ja19＋-EN1。§8の59対応表が参照する全行）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m02-03_admin_home_home_sales_chart	E2E-M0203C-001	IT-15	未認証	P1	未認証でホームへアクセスすると管理ログインへ誘導され本グラフを利用できない	未ログイン（cookieなしcontext）	—	1. GET /%eccube_admin_route%/ 2. 遷移先URLと画面を確認	admin_login のログイン画面へ誘導され、売上状況グラフ領域（#chart-statistics内のタブ/canvas）を含むホーム画面は表示されない [L1:L1-M0203-001]				
m02-03_admin_home_home_sales_chart	E2E-M0203C-002	IT-13	URL直接アクセス	P1	未認証でグラフ用データURLへ直接アクセスするとログインへ誘導されデータを得られない	未ログイン	—	1. GET /%eccube_admin_route%/sale_chart 2. 遷移先とレスポンスを確認	グラフ用JSON配列は返らず admin_login のログイン画面へ誘導される（グラフ用データのAjaxにも到達できない） [L1:L1-M0203-001,L1-M0203-003]				
m02-03_admin_home_home_sales_chart	E2E-M0203C-010	IT-25	表示	P1	ログイン後ホームにグラフ領域一式（3タブ・canvas・読み込み中・初期週間選択）が表示される（ja）	管理者ログイン済（SEED-M02-ADMIN・2FA OFF）	—	1. ログインし GET /%eccube_admin_route%/ 2. #chart-statistics 内のタブ3個の文言・クラス・aria-selected、ペイン3個とcanvas、#loading の存在を確認 3. 初期状態の active が週間側にあることを確認	管理者認証後のダッシュボード（ホーム）と同一画面内にグラフ領域が表示され、pill型タブ「週間」「月間」「年間」（nav-link btn btn-ec-tab・data-bs-toggle="pill"）・ペイン#pills-weekly/#pills-monthly/#pills-year 内の canvas#chart-0/#chart-1/#chart-2・#loading が管理共通クラス（tab-content/tab-pane）で配置され、初期状態は #pills-weekly-tab が active（aria-selected="true"）・#pills-weekly が show active [L1:L1-M0203-004,L1-M0203-002; fixture:SEED-M02-ADMIN@TBD-D5]				
m02-03_admin_home_home_sales_chart	E2E-M0203C-010-EN	IT-25	表示	P3	タブ文言（en）	管理者ログイン済／locale=en	—	1. en UIでホームを開く 2. 3タブの文言を読む	タブ文言="Weekly"/"Monthly"/"Yearly" [L1:L1-M0203-004; fixture:SEED-M02-ADMIN@TBD-D5]				
m02-03_admin_home_home_sales_chart	E2E-M0203C-013	IT-25	モーダル	P2	本グラフはモーダル・トースト・確認ダイアログ・フォーム入力を持たない	管理者ログイン済	—	1. ホームを開きXHR完了を待つ 2. #chart-statistics 内の input/textarea/form/.modal 要素数を確認 3. タブ操作時もダイアログ介在が無いことを確認	#chart-statistics 内に input・textarea・form・modal/dialog 要素が存在せず（0件）、表示・タブ操作でモーダル/ポップアップ/トースト/確認ダイアログが表示されない（本グラフはフォームを持たない） [L1:L1-M0203-004（DOM範囲）,L1-M0203-017]※フォーム/モーダル不存在の一次根拠=m02-03md:93-94,224・index.twig:146-213 grep0件				
m02-03_admin_home_home_sales_chart	E2E-M0203C-020	IT-25	操作起点	P1	ページ表示後にグラフ用XHRが自動で1回だけ発生し3区間のJSON配列が返る	管理者ログイン済	共通レイアウト由来: XHR＋ECCUBE-CSRF-TOKENヘッダ	1. ネットワーク監視下でホームを開く 2. admin_homepage_sale へのリクエスト回数（=1回）とヘッダ（X-Requested-With/ECCUBE-CSRF-TOKEN）を確認 3. 応答status/bodyを確認	GET /%eccube_admin_route%/sale_chart がホーム表示後にXHR＋CSRFヘッダ付きで**1回だけ**発生し、応答は成功（200）で [週間,月間,年間] の3要素配列・各要素は {キー:{price,count}} のバケット集合 [L1:L1-M0203-005,L1-M0203-008,L1-M0203-003,L1-M0203-015]				
m02-03_admin_home_home_sales_chart	E2E-M0203C-021	IT-12	JS挙動	P1	取得成功で配列が順にchart-0/1/2へ対応づき棒グラフが描画され#loadingが消える	管理者ログイン済	—	1. ホームを開き sale_chart XHRの完了を待つ 2. #loading の非表示を確認（※既存実走×=BC-DRAFT-m02-03-1・§9-3。期待は設計側を維持） 3. #chart-0/1/2 のcanvas描画（描画済み状態・非空）を確認	XHR完了後 #loading が非表示になり、返却配列の各要素が順に #chart-0（週間）/#chart-1（月間）/#chart-2（年間）へ対応づけられ縦棒グラフとして描画される（canvas内部の系列判定はC-042/§9-8） [L1:L1-M0203-016,L1-M0203-015; fixture:SEED-M02-SALES-INCLUDE@TBD-D5]				
m02-03_admin_home_home_sales_chart	E2E-M0203C-022	IT-25	タブ切替	P1	タブ切替は同一ページ内の表示切替で追加サーバ問い合わせ・グラフ再生成が発生しない	管理者ログイン済（初期XHR完了後）	—	1. ネットワーク監視下で「月間」タブ押下→#pills-monthly がactive 2. 「年間」タブ押下→#pills-year がactive 3. 押下前後で追加リクエスト（sale_chart再取得含む）が発生しないことを確認	同一ページ内でpillタブのactiveペインが切り替わり（描画済みのcanvasが表示され）、タブ操作による追加のサーバリクエスト・グラフ再生成は発生しない [L1:L1-M0203-017,L1-M0203-004]				
m02-03_admin_home_home_sales_chart	E2E-M0203C-023	IT-15	CSRF	P1	非XHRでグラフ用データURLへ直接アクセスすると400 {"status":"NG"} でJSON配列を返さない	管理者ログイン済（同一context）	§6.1契約: XHRヘッダなしの通常GET	1. §6.1手順でログイン済セッションのまま /sale_chart を通常GET 2. 応答status/bodyを確認	HTTP 400・本文 {"status":"NG"}（XMLHttpRequest条件未充足の短絡・以降の集計を行わない）でありグラフ用の3要素配列は返らない（既存実走E2E-M02-03-010で〇実証済み） [L1:L1-M0203-006]				
m02-03_admin_home_home_sales_chart	E2E-M0203C-024	IT-15	CSRF	P1	XHRヘッダがあってもCSRFトークン欠落/不正ならグラフ用データを返さない	管理者ログイン済（同一context）	§6.2契約: X-Requested-With: XMLHttpRequest＋ECCUBE-CSRF-TOKENなし（または改変値）	1. §6.2手順でCSRF欠落XHRを送信 2. 応答がエラー応答（グラフ用3要素配列でない・成功しない）ことを確認	グラフ用JSON配列は返らずエラー応答となる（isTokenValidのAccessDeniedHttpException throw→共通例外処理。設計md:109はこの分岐も400 {"status":"NG"}と記すが実装は例外委譲・既存実走2026-07-06は403実測=DOC-DRAFT-m02-03-2・§9-2。実効ステータス/本文は要実機のため「配列を返さない・成功しない」までを判定し400を固定期待にしない） [L1:L1-M0203-007]				
m02-03_admin_home_home_sales_chart	E2E-M0203C-025	IT-12	エラー継続	P2	グラフ取得失敗時も同一画面のままグラフ未描画・#loadingは消え・専用通知を出さない	管理者ログイン済／Playwright routeで /sale_chart を失敗させる（400 {"status":"NG"} fulfillまたはabort）	route介入によるXHR失敗	1. page.route で sale_chart を失敗化しホームを開く 2. #loading が（always経由で）非表示になることを確認 3. #chart-0/1/2 に描画が無いことを確認 4. モーダル/トースト/アラート/フラッシュ等の専用通知が出ず同一画面（ホーム）に留まることを確認	同一画面のまま・グラフは未描画・#loading は消え・利用者向け専用メッセージ/トースト/ダイアログは表示されない（failハンドラ空・always→hide。既存実走E2E-M02-03-012で〇実証済み） [L1:L1-M0203-016]				
m02-03_admin_home_home_sales_chart	E2E-M0203C-030	IT-26	集計突合	P1	sale_chart JSONの過去確定バケットがdb.ts式評価値と一致し現在期間バケットにSEED差分Δが現れる（グラフ内部値の決定的照会・二層方式）	管理者ログイン済／標準環境（拡張フック差替なし=L1-025）／**隔離・凍結DB＋§6.3e前提（未来日付行ガード0件・同一日run確認・0時近傍/月境界日abort）**	SEED-M02-SALES-INCLUDE（今日=現在期間Δ用）＋SEED-M0203-CHART-SPREAD（前日以前・前月=過去確定バケット用／当日分=Δ用。§2）	1. db.tsで§6.3eガード（未来日付行0件・同一日run記録開始）を確認 2. ホームを開き**SEED適用前**の sale_chart JSON応答T0を捕捉・db.ts式評価T0を記録 3. apply.sh で両SEED適用 4. db.ts式評価T1を取得（差分=SEED増分のサニティ確認） 5. ホーム再表示で**適用後**JSON応答T1を捕捉 6. **過去確定バケット**（今日キーより前の全日キー・当月キーより前の全月キー）: JSON T1がdb.ts式評価T1と完全一致することを確認 7. **現在期間バケット**（週間/月間の今日キー・年間の当月キー）: Δ=JSON T1−JSON T0 がSEED投入分の既知寄与（price/count増分）と一致することを確認 8. 同一日run確認・teardown	【過去確定バケット】キー・price・countがdb.ts区間式評価値（>=from・<=to両端含む・除外ステータス非算入・soft delete除外）と**完全一致**する（これらの集計対象は当日0時/当月1日0時より過去の行のみ=toのnow実値に依存せず決定的）。【現在期間バケット=週間/月間の今日キー・年間の当月キー】**絶対値一致は主張しない**: SEED適用前後のJSON応答差分Δが SEED投入分（INCLUDE今日分・SPREAD当日分のprice/count増分）と一致する（既存now近傍行は両応答で相殺されΔは決定的）。期待の正はL1式でありSEED固定値ではない（Δの照合値もL1加算式から導出）。canvas目視/VRTは補助でありJSON突合が正。サーバ基準時刻の直接束縛=要実機（確定すれば現在期間も絶対一致へ引き上げ=§9-8⑤） [L1:L1-M0203-008,L1-M0203-009,L1-M0203-010,L1-M0203-013,L1-M0203-014,L1-M0203-025,L1-M0203-026; fixture:SEED-M02-SALES-INCLUDE+SEED-M0203-CHART-SPREAD@TBD-D5]				
m02-03_admin_home_home_sales_chart	E2E-M0203C-035	IT-12	空集計	P2	該当受注0件でも3区間とも全キー0バケットが返りエラーなく継続する	管理者ログイン済／**隔離・凍結DB必須**（0件=状態の不在。共有DBでは保証できない=§9-6）／§6.3e未来日付行ガード0件（対象行が全区間+未来に1件も無ければ現在期間バケットの0もnow非依存で決定的=§6.3e）	対象期間に売上対象受注なし（db.tsで§6.3式評価=全バケット0を前提確認）	1. db.ts式評価で3区間とも0件0円・§6.3e未来日付行0件を確認（0でなければskip） 2. ホームを開き sale_chart 応答を捕捉 3. datas[0]/[1]/[2] の全キーが price=0/count=0 であること・キー自体は区間内に連続して存在することを確認 4. エラー表示なく画面継続（#loading消・棒高さ0グラフ）を確認	3区間ともバケットはすべて0で埋まり（横軸キーは残る）、エラーは表示されず画面継続する（DB照会が空でもエラーにならない） [L1:L1-M0203-011,L1-M0203-023]				
m02-03_admin_home_home_sales_chart	E2E-M0203C-036	IT-26	無書込	P1	ホーム表示とグラフ取得はdtb_order・マスタへ登録/更新を行わない（標準環境）	管理者ログイン済／**標準環境（ADMIN_ADMIM_INDEX_SALESへ書込みlistenerを差し込むプラグインなし=L1-025。§9-9）**	—	1. db.tsでT0=§6.3cの決定的差分照会（dtb_order行数＋dtb_order全列ダイジェスト＋mtb_order_status全列ダイジェスト）を記録 2. ホーム表示→sale_chart XHR完了→タブ操作 3. db.tsでT1を再照会	T0=T1（dtb_orderの行数・主キー順全列ダイジェスト、参照マスタmtb_order_statusの全列ダイジェストとも完全一致=登録/更新/削除なし。相殺更新・過去行更新も検知）。設計書DB操作節の「登録/更新」はDOC-DRAFT-m02-03-1のテンプレノイズであり書込を期待しない。無書込の主張は標準環境に限定 [L1:L1-M0203-019,L1-M0203-025]				
m02-03_admin_home_home_sales_chart	E2E-M0203C-037	IT-26	最新データ	P2	バッチ/外部連携相当の別処理で受注が永続化された後の再取得は、その時点の永続化済みデータを読んで反映する	管理者ログイン済	db.tsで対象ステータス・週間期間内の受注1件（帯ID・run接尾辞付きorder_no）を直接INSERT（バッチ/外部連携更新の再現）	1. sale_chart 応答T0（該当日バケット）とdb.ts式評価T0を記録 2. db.tsで対象受注を直接INSERT 3. ホームを**再表示**し sale_chart 応答T1を捕捉 4. 該当日バケットのprice/countがdb.ts式評価T1（=INSERT反映後）と一致することを確認 5. INSERT行を後始末	再取得時のバケットはINSERT済み受注を含む読み取り時点の値になる（本グラフはバッチを起動せず、反映タイミングの正である外部連携/バッチ設計自体は検証対象外=委譲宣言はオラクル化しない。観測はL1-020の限定構成①〜③） [L1:L1-M0203-020; fixture:SEED-M02-SALES-INCLUDE@TBD-D5]				
m02-03_admin_home_home_sales_chart	E2E-M0203C-038	IT-25	自動更新なし	P2	表示中の描画済みグラフは自動更新されない	管理者ログイン済（初期XHR完了後）	db.tsで対象受注1件を直接INSERT（表示後）	1. ホーム表示完了後 sale_chart 応答値を記録・ネットワーク監視開始 2. db.tsで受注INSERT 3. 無操作で待機（監視窓） 4. sale_chartへの追加リクエストが発生せず描画済みグラフが再生成されないことを確認 5. 後始末	表示中の画面は自動更新されず（ポーリング等の追加リクエスト0件・再描画なし）、反映はホーム画面再表示時の再取得のみ（リアルタイムダッシュボードではない） [L1:L1-M0203-021]				
m02-03_admin_home_home_sales_chart	E2E-M0203C-039	IT-02	参照時点	P2	サマリは初期HTML・グラフは表示後の別Ajaxで読み取られる	管理者ログイン済	—	1. JS無効context（javaScriptEnabled:false）または応答HTML直接取得でホームをGET 2. 初期HTML本文にサマリ値（m02-02側）が含まれる一方、グラフデータは含まれず canvas が空であることを確認 3. JS有効時のみ sale_chart XHRが発生しグラフが描画されることを対比確認	売上サマリはホーム画面HTML表示時に読み取った結果として初期HTMLに含まれ、グラフ用データは別リクエスト（表示後のAjax）で読み取る [L1:L1-M0203-022,L1-M0203-003]				
m02-03_admin_home_home_sales_chart	E2E-M0203C-040	IT-12	スナップショット分離	P3	サマリとグラフは別リクエストで同一トランザクションに固定されず、間の受注変更で乖離してもエラーなく継続する	管理者ログイン済／Playwright routeで sale_chart 応答を遅延保留	遅延中にdb.tsで対象受注1件をINSERT	1. page.routeで sale_chart を保留にしてホームを開く（サマリHTMLは先に確定） 2. db.tsで週間期間内の対象受注をINSERT 3. 保留を解放しXHR完了 4. サマリ（INSERT前の読取値）とグラフJSONの該当バケット（INSERT後の読取値）が乖離することを観測 5. エラー表示なく画面継続を確認 6. 後始末	サマリ=HTML生成時点・グラフ=XHR時点の別読取であり、間のDB変更により両者の値が一致しない状態が観測でき、その場合もエラーは表示されず処理を継続する（一致は非保証=一致期待を置かない） [L1:L1-M0203-022]				
m02-03_admin_home_home_sales_chart	E2E-M0203C-042	IT-22	グラフ系列	P2	縦棒はJSONのprice列のみを系列とし件数countは系列に使わない	管理者ログイン済	—	1. sale_chart XHR応答を捕捉し各バケットに price と count の両キーが存在することを確認 2. 描画後、Chartインスタンス（Chart.getChart等）のdatasetsが1系列・data=各バケットのprice列・label=「売上金額」であることを確認（Chart内部読取APIの可用性=§9-8要実機）	JSONは件数（count）を保持するが、棒グラフのdatasetsは売上金額（price）のみの1系列（labelはja「売上金額」）で、件数は表示系列に使われない [L1:L1-M0203-008,L1-M0203-015]				
m02-03_admin_home_home_sales_chart	E2E-M0203C-044	IT-12	表示形式	P2	ツールチップと縦軸目盛りは通貨記号前置＋3桁区切りで、縦軸は整数値のみラベル表示する	管理者ログイン済	—	1. 描画後 Chartインスタンスの options を読み取り、tooltip.callbacks.label / scales.y.ticks.callback を実値で評価（例: 1234567→"{通貨記号}1,234,567"・非整数値→ラベルなし）することを確認（Chart内部読取=§9-8要実機。通貨記号グリフ=§9-7要実機） 2. 補助: ツールチップ表示のスクリーンショット目視	ツールチップの値・縦軸目盛りとも通貨記号を前置し3桁区切りカンマを付し、縦軸目盛りは整数値のときのみラベルを表示する（整数でない目盛り値はラベルなし） [L1:L1-M0203-018]				
```

### §4.2 補完行（6行=ja6。**親test_idなし・母集合会計に算入しない**。理由=設計書補完〔一次資料に規定が
あるが、母集合59行の期待テキストに対応する親が存在しない〕）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m02-03_admin_home_home_sales_chart	E2E-M0203C-031	IT-26	集計除外	P2	売上対象外ステータスの受注はどの区間のバケットにも加算されない	管理者ログイン済／標準環境／**隔離・凍結DB＋§6.3e前提（二層方式・未来日付行ガード・同一日run確認）**	SEED-M02-SALES-EXCLUDE（id=900000031〜34・status=3,7,8,15・今日=現在期間バケット帯）	1. db.tsで§6.3eガードを確認 2. SEED適用前の sale_chart JSON応答T0を捕捉・db.ts式評価T0を記録 3. apply.sh SEED-M02-SALES-EXCLUDE 4. db.ts式評価T1で**T0=T1（除外行は式評価に寄与しない）**を確認 5. ホーム再表示で適用後JSON応答T1を捕捉 6. **現在期間バケット（今日キー/当月キー）: Δ=JSON T1−JSON T0 が0**（3100〜3400円がprice/countに現れない）ことを確認 7. **過去確定バケット**: JSON T1がdb.ts式評価T1と完全一致（変化なし）を確認 8. teardown	売上対象外ステータス（既定4区分。確定列挙・差替の正はm02-02md）の受注は3区間いずれのバケットのprice/countにも加算されない＝現在期間バケットはSEED適用前後のΔが0（絶対値一致は主張しない=§6.3e）・過去確定バケットはdb.ts式評価との完全一致が不変 [L1:L1-M0203-014; fixture:SEED-M02-SALES-EXCLUDE@TBD-D5]（補完行・親test_idなし・設計書補完）				
m02-03_admin_home_home_sales_chart	E2E-M0203C-032	IT-26	0円受注	P3	payment_total=0の対象受注はバケットのcountのみ+1されpriceは+0（棒高さ0）	管理者ログイン済／標準環境／**隔離・凍結DB＋§6.3e前提（当日=現在期間バケットのため判定は**Δ差分のみ**・絶対値一致は要求しない）**	SEED-M02-SALES-ZERO（id=900000035・payment_total=0・対象ステータス・今日=当日0時台）	1. db.tsで§6.3eガードを確認 2. SEED適用前の sale_chart JSON応答T0を捕捉・db.ts式評価T0を記録 3. apply.sh SEED-M02-SALES-ZERO 4. db.ts式評価T1で当日の**count+1・price+0**の増分をサニティ確認 5. ホーム再表示で適用後JSON応答T1を捕捉 6. **当日バケットのΔ=JSON T1−JSON T0 が count+1・price+0** であることを確認（当日バケットの絶対値とdb.ts値の一致確認は行わない=§6.3e） 7. teardown	0円受注により当日バケット（現在期間バケット）のSEED適用前後Δがcount+1・price+0となる（棒グラフでは高さ0扱い。絶対値一致は主張しない=Δのみで決定的） [L1:L1-M0203-013; fixture:SEED-M02-SALES-ZERO@TBD-D5]（補完行・親test_idなし・設計書補完）				
m02-03_admin_home_home_sales_chart	E2E-M0203C-033	IT-22	バケット構造	P2	3区間のバケットキーが連続し（週/月=Y/m/d・年=Y/m）売上ゼロ期間も0で埋まり年間は月集約される	管理者ログイン済／**隔離・凍結DB＋§6.3e前提（二層方式・同一日run確認=今日/当月キー同定の根拠）**	SEED-M0203-CHART-SPREAD（前月内受注1件を含む・過去確定バケット帯中心）	1. §6.3eガードを確認 2. sale_chart XHR応答を捕捉 3. datas[0]（週間）のキーが約7日前〜当日のY/m/d連続であること 4. datas[1]（月間）のキーが当月1日〜当日のY/m/d連続であること 5. datas[2]（年間）のキーが1年前の月〜当月のY/m連続であること 6. **過去確定バケット**のうち受注が無い日/月が {price:0,count:0} で存在（欠落なし）すること 7. SPREADの前月受注が年間のY/mバケット（過去確定）へ月集約（同一月キーに合算・絶対値一致）されることを確認	3区間ともバケットキーが範囲内で連続し（週間/月間=日単位Y/m/d・年間=年月Y/m・**今日キー/当月キーは存在と粒度のみ判定し値の絶対一致は判定しない**=§6.3e）、売上が無い過去期間は価0件0のバケットとして存在し横軸ラベルが欠けず、年間は同一月内の受注が同一キー（過去確定バケット=絶対値で確認可能）へ集約され月単位の棒になる [L1:L1-M0203-011,L1-M0203-012,L1-M0203-008; fixture:SEED-M0203-CHART-SPREAD@TBD-D5]（補完行・親test_idなし・設計書補完）				
m02-03_admin_home_home_sales_chart	E2E-M0203C-034	IT-22	期間境界	P3	区間は開始日時以上かつ終了日時以下（両端含む）で判定される	管理者ログイン済／標準環境／**隔離・凍結DB＋§6.3e前提（二層方式）**・**実行時刻ガード必須**（0時近傍・月初日・月末日は窓問題=§9-8）	SEED-M0203-CHART-BOUNDARY（run時動的算出: 7日前0時ちょうど・その1秒前・1年前月初0時ちょうど・その1秒前=**全て過去確定バケット帯の過去時刻**）	1. db.tsで§6.3eガードを確認・式評価T0を記録 2. BOUNDARY適用（動的INSERT） 3. db.ts式評価T1の差分で: 週間=「7日前0時ちょうど」行のみ算入（1秒前行は不算入・年間には算入）・年間=「1年前月初0時ちょうど」行は算入（1秒前行は不算入）を確認 4. sale_chart JSON応答の**過去確定バケット**（境界行の属する7日前キー・1年前月キー）がdb.ts式評価T1と完全一致することを確認（**今日キー/当月キーは本ケースの判定対象に含めない**。含める場合はΔ差分のみ=§6.3e） 5. teardown	【二層方式=§6.3e】**過去側境界バケット（7日前キー・1年前月キー=過去確定）**: 開始境界ちょうど（7日前0時・1年前月初0時）の受注は各区間に算入され、開始直前1秒の受注は算入されない（開始以上・終了以下=両端含む。サマリ側の「終了未満」と非対称であることの週間側実証）＝db.ts式評価との**完全一致**で判定。**現在期間バケット（今日キー/当月キー）**: 本ケースの判定対象外（絶対値一致を要求しない。上限=取得時nowちょうどの境界はSEEDで構成不能＝直接束縛が要実機のため観測対象にしない・§2/§9-8⑤） [L1:L1-M0203-010,L1-M0203-009; fixture:SEED-M0203-CHART-BOUNDARY@TBD-D5]（補完行・親test_idなし・設計書補完）				
m02-03_admin_home_home_sales_chart	E2E-M0203C-041	IT-25	canvas属性	P3	描画時に各canvasの高さが100に設定される	管理者ログイン済	—	1. ホームを開きXHR完了・描画完了を待つ 2. #chart-0/#chart-1/#chart-2 の canvas height 属性（ctx.canvas.height=100の反映値）を読む	各canvasの高さは100に設定される（DOM属性で自動判定可。Chart.jsが属性を再計算する場合の実効値は要実機=§9-8） [L1:L1-M0203-018]（補完行・親test_idなし・設計書補完）				
m02-03_admin_home_home_sales_chart	E2E-M0203C-045	IT-20	Cookie	P3	本グラフの表示・データ取得で専用Cookieが新規設定されない	管理者ログイン済	—	1. ログイン完了後 context.cookies() のCookie集合T0を記録 2. ホーム表示→sale_chart XHR完了→タブ操作 3. context.cookies() T1を取得しT0との差分を確認	認証/セッション系（フレームワーク由来）以外に本機能起因の新規Cookieが増えない（本グラフ専用のセッションキー書込なしはブラウザ観測外=判定対象にしない） [L1:L1-M0203-024]（補完行・親test_idなし・設計書補完）				
```

## §5 locale対応表

- LS=1 claim: **L1-M0203-004（タブ文言）・L1-M0203-015（系列label）の2claim**。
- -EN行=**1行**（C-010-EN）。en文言はすべてen一次資料逐語（messages.en.yaml:1862-1864。ja翻訳ゼロ）。
- **保留（claim単位・理由明記）**: **L1-M0203-015（系列label "Sales Amount"=messages.en.yaml:1865）の-EN行は
  作らない**。文言自体はen一次資料で確定済みだが、観測面がChart.js描画内部（canvas/Chartインスタンス）であり
  読取APIの可用性が未確定（§9-8）＝ja側C-042も同制約下。locale差分だけを増やさない（m02-02候補と同判断）。
- -EN行の実行前提はD15（M0 Go/No-Go。管理画面のen切替口なし＝W0実測を継承）。
- 通貨記号（L1-018）はlocale/currency環境値由来の**環境値**であり文言オラクルにしない（§9-7要実機）。

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

### §6.1 非XHR直接GETのrequest契約（C-023で使用）

1. 同一BrowserContextでログイン済み状態を確立（セッションCookie保持）。
2. `page.request.get('/%eccube_admin_route%/sale_chart')` を**XHRヘッダなし**で送信
   （`X-Requested-With` を付けない＝`isXmlHttpRequest()` 偽・短絡でCSRF評価前）。
3. 応答 `status()===400`・`json()` が `{"status":"NG"}` であること、および3要素配列で**ない**ことを判定
   （根拠=AdminController.php:213-215＝L1-006。既存実走E2E-M02-03-010〇と同型）。

### §6.2 XHR偽装＋CSRF欠落のrequest契約（C-024で使用）

1. 同一contextで `page.request.get` に `headers: { 'X-Requested-With': 'XMLHttpRequest' }` を付け、
   `ECCUBE-CSRF-TOKEN` ヘッダ・`_token` パラメータを**付けない**（または末尾1文字改変値を付ける）。
2. 応答が「成功のグラフ用3要素配列」でないことを判定（isTokenValidがAccessDeniedHttpExceptionをthrow
   =AbstractController.php:256-261＝L1-007。既存実走は403実測・設計書は400記載=DOC-DRAFT-m02-03-2の
   ため**ステータス数値を固定期待にしない**。403/400いずれでも「成功しない」判定は通る）。
3. トークン供給機構の正（meta＋ajaxSetupヘッダ）はC-020の正常系ヘッダ観測で対にする（L1-005）。

### §6.3 db.ts区間集計照会（三段参照の式評価。C-030/031/032/033/034/035/037/038/040で使用）

期待の正はL1の区間式・加算式。db.tsはその式をSQLで独立評価し、**sale_chart JSON応答値と突合**する
（SEED固定値は適用前後差分のサニティにのみ使用。canvas目視/VRTは補助）。実装層条件として
`deleted_at IS NULL`（L1-026）を含める。**セッションTZを必ずアプリTZ（`Asia/Tokyo`=services.yaml:9）に
一致させる**（§9-8。m02-02候補§6.3と同じ複文/AT TIME ZONE対応が実装waveの前提整備）。
**基準時刻の扱い（codex R1→R2是正）**: サーバは `$toDate = Carbon::now()`（リクエスト開始時の1時点・
AdminController.php:227）を3集計に固定使用するが、db.ts SQLの `now()` は**別時点**であり、この2つの
基準時刻は直接束縛できない（同一観測手段なし=§9-8⑤）。よって**now依存バケットは絶対値一致の対象から
外す**: 判定は常に§6.3eの**二層方式**＝過去確定バケット（絶対値の完全一致）／現在期間バケット
（SEEDブラケット差分Δのみ）で行う。

a. 週間/月間（日バケット `Y/m/d`。**上限は `<= now()`＝両端含む**）:

```sql
SET TIME ZONE 'Asia/Tokyo';
-- 週間: from = 当日0時 - 7日（Carbon today()->subWeek() 相当）
SELECT to_char(order_date, 'YYYY/MM/DD') AS bucket,
       COALESCE(SUM(payment_total), 0) AS price, COUNT(*) AS count
FROM dtb_order
WHERE deleted_at IS NULL
  AND order_status_id NOT IN (3, 7, 8, 15)          -- 既定除外（正はm02-02md=L1-014。標準環境前提）
  AND order_date >= date_trunc('day', now()) - interval '7 days'
  AND order_date <= now()                            -- 両端含む（サマリの「未満」と非対称）
GROUP BY bucket ORDER BY bucket;
-- 月間: order_date >= date_trunc('month', now()) AND order_date <= now() で同型
```

b. 年間（年月バケット `Y/m`・月集約）:

```sql
SELECT to_char(order_date, 'YYYY/MM') AS bucket,
       COALESCE(SUM(payment_total), 0), COUNT(*)
FROM dtb_order
WHERE deleted_at IS NULL
  AND order_status_id NOT IN (3, 7, 8, 15)
  AND order_date >= date_trunc('month', now()) - interval '1 year'   -- subYear()->startOfMonth() 相当
  AND order_date <= now()
GROUP BY bucket ORDER BY bucket;
```

- **0バケット合成**: SQLのGROUP BYは受注のある日/月しか返さないため、突合側（ヘルパ）で区間内の
  全キー（週間/月間=日・年間=月）を `price=0,count=0` で合成してからJSONと全キー比較する（L1-011の
  「0埋めで横軸欠落なし」自体がJSON側の検査対象＝式評価側も同じキー全集合で比較する）。

### §6.3e バケット二層方式＝過去確定/現在期間の主張分離（codex R2是正・C-030〜035の実行前提）

**撤回（codex R2指摘・正当）**: 改訂1の「1時間skew窓に対象行0件→全バケット完全一致が決定的」の論理は
撤回する。「サーバCarbon::now()とdb.ts評価の実時差が1時間以内」は証明不能（実行遅延がそれを超えれば
将来日時の既存行が後続サーバ集計に入る余地）＝**now依存バケットを絶対値一致の対象から外す**。

**バケット二層分類（現在期間キーの定義を明示）**:
- **過去確定バケット**: 対象期間がnowより完全に過去のバケット＝週間`datas[0]`・月間`datas[1]`の
  **今日キー（当日Y/m/d）より前の全日キー**・年間`datas[2]`の**当月キー（当月Y/m）より前の全月キー**。
  これらの集計対象は `order_date < 当日0時`（年間過去月は `< 当月1日0時`）の行のみで構成され、
  `<= to` のto実値（どちらのnowか）に**依存しない**→**隔離・凍結DB前提で絶対値の完全一致を主張してよい**
  （now非依存で決定的）。
- **現在期間バケット**: nowを含む端バケット＝週間・月間の**今日キー**、年間の**当月キー**。
  **絶対値一致を一切主張しない**。検証は**SEEDブラケット差分Δのみ**: SEED適用の前後で sale_chart JSON
  応答を各1回捕捉し、`Δ = 適用後JSON − 適用前JSON` が SEED投入分の既知寄与（price増分・count増分）と
  一致することを確認する。既存のnow近傍行はSEED適用前後の両応答に（含まれるなら）等しく含まれて
  Δで相殺されるため、その有無に関わらずΔは決定的（DB凍結に依存しない検証形。下記残余前提のみ）。

**前提**:
1. **隔離・凍結DB**（並行更新なし）＝**過去確定バケットの完全一致の根拠**（現在期間Δの決定性は
   Δ形式自体が担保し、凍結は挿入がSEEDのみであることの保証に使う）。
2. **未来日付行ガード**（db.tsで実行・skew仮定不要。非0ならΔ検証もskip）:

```sql
-- 現時点で未来日付のorder_dateを持つ集計対象行が無いこと（Δ汚染＝2回の取得の間に
-- 「toを跨いで新たに算入される既存行」が生じないことの実行時証明）
SELECT COUNT(*) FROM dtb_order
WHERE deleted_at IS NULL
  AND order_status_id NOT IN (3, 7, 8, 15)
  AND order_date > now();   -- 0件であること
```

3. **同一日run確認**: run開始・終了時にdb.tsで現在日時を記録し**同一日**（年間系は同一月）で
   あることを確認（0時近傍23:50〜00:10・月初日/月末日はabort/skip=§9-8①）。これにより「今日キー/
   当月キー」の同定がサーバ・db.ts間で一致することを確定する。
4. **SEEDのorder_date配置規約**: 過去確定バケット検証用のSEED行は前日以前・現在期間Δ検証用の
   SEED行は当日0時台〜（未来日時は使わない）。C-037/038/040の直接INSERTも同様。
5. **アプリ/DB時計の整合**（同一ホスト/NTP・オフセットが無視できること）＝環境前提として**要実機
   確認**（§9-8⑤。ガード2はDB時計基準のため、アプリ時計が大きく先行する環境では別途検証が要る）。

**縮退なしの一本化**: 改訂1の「ガード成立時=全バケット完全一致／不成立時=縮退」の二段構えは廃止し、
**常に二層方式**（過去確定=絶対一致・現在期間=Δのみ）で判定する（成立条件の証明不能な分岐を残さない）。

**直接束縛は要実機のまま（§9-8⑤）**: sale_chart応答にはtoDate実値が含まれず（バケットキーは日/月粒度）、
HTTP `Date` ヘッダは応答生成時刻でありCarbon::now()実値と同一観測にならない。実機でサーバ基準時刻の
観測手段（デバッグ応答等）が確定すれば、**現在期間バケットも絶対値一致へ引き上げ可**、と留保する。

c. 無書込ブラケット（C-036。**決定的差分照会を実体掲載=自己完結**。m02-02候補§6.3cと同一式）:
SUM/MAXの要約値では相殺更新・過去行更新を検知できないため、**主キー順・全列の決定的ダイジェスト**で判定:

```sql
-- (1) 行数
SELECT COUNT(*) FROM dtb_order;
-- (2) dtb_order 全列ダイジェスト（主キー順・全列。相殺更新・過去行更新も検知）
SELECT md5(COALESCE(string_agg(o::text, ',' ORDER BY o.id), '')) FROM dtb_order o;
-- (3) マスタ不変性: 受注ステータスマスタ mtb_order_status（OrderStatus.php:24 Table(name:'mtb_order_status')）
SELECT md5(COALESCE(string_agg(s::text, ',' ORDER BY s.id), '')) FROM mtb_order_status s;
```

「マスタ」の観測範囲: 本機能の集計が照合する受注ステータスマスタ `mtb_order_status`（設計の語「マスタ」
〔md:173,196〕の最小実体）。それ以外のマスタへの書込不存在はソース側grep（L1-019=AdminController.php全文に
persist/flush/INSERT/UPDATE 0件）で担保し、全マスタ全表のダイジェスト照会までは求めない（過大化回避）。

d. C-037/038/040 の直接INSERTは SEED-M02-SALES-DASHBOARD.sql の列契約
   （base_info_id=2・customer_id=900000021・order_no=`E2E-M02-SALES-RUN-<runid>`マーカー）を再利用し、
   後始末はマーカー条件DELETE（down.sql同型）。

### §6.4 実装方針（候補=未実装・実走なし）

- page: 既存 `e2e/pages/admin/m02/m02_03_admin_home_home_sales_chart.page.ts` を再利用（#chart-statistics・
  3タブ・3ペイン・canvas・#loading・csrfMeta 実装済み・実機確認済み注記あり。コメント中の
  messages行番号のみ旧値=§9-11）。
- spec: 既存 `e2e/spec/admin/m02/m02_03_*.spec.ts` は**旧ケース表（E2E-M02-03-xxx）1:1**の実装であり
  本候補の実装ではない（ログインヘルパ・route stub・skipガードの参考のみ）。本候補の期待値は
  `o("L1-M0203-xxx", "m02_03_oracle")` 相当のL1解決器経由・リテラル直書き禁止。
- JSON捕捉は `page.waitForResponse(/sale_chart/)`（ブラウザ発XHRの応答をそのまま読む=CSRF正常系の
  副産物として決定的）。request契約系（C-023/024）のみ `page.request` を使う。
- route介入（C-025 fulfill/abort・C-040 遅延保留）は Playwright `page.route`/`route.fulfill` の標準機能で
  ハーネス追加不要。
- Chart内部読取（C-042/C-044）は `Chart.getChart('#chart-0')` 等のグローバルAPI可用性に依存＝要実機
  （§9-8）。JSON側判定（price/count保持・バケット値）は可用性に依存せず自動。

### §6.5 _drafts/隔離lintの実施証跡（実測・実施済み）

1. 正式消費側（`e2e/helpers/oracle.ts`・`e2e/helpers/db.ts`・spec・pages）に草案を消費する `_drafts` 参照は
   **0件**（隔離ガード自体のリテラル〔oracle.ts:17,19〕を除く。ガードは `_drafts`・パス区切り・`..` を含む
   fileKeyの解決をthrowで拒否する機械強制＝消費参照ではない。grep実測）。
2. 正式パス `e2e/fixtures/oracle/` 直下に本機能のjsonは**作成していない**（直下の実体は既存正式物
   `m09_01_oracle.json` のみ＝ls実測・未変更。草案は `_drafts/` のみ）。
3. 本md・oracle草案json（`e2e/fixtures/oracle/_drafts/m02-03_admin_home_home_sales_chart_oracle_draft.json`）の
   出力先はともに `_drafts/` 配下のみ（CFP §7出力規約に適合）。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

| ケース群 | 実行区分（候補） | 観測層 | 備考 |
|---|---|---|---|
| C-001,002,010,013,022 | Playwright | GUI/HTTP | 表示・遷移・タブ・DOM不在判定 |
| C-020,021 | Playwright | GUI+network | XHR回数/ヘッダ・JSON構造・#loading（BC-DRAFT-1再検証を含む） |
| C-023,024 | 非UI（request契約＋応答判定） | HTTP | §6.1/6.2契約。C-024はDOC-DRAFT-2によりステータス非固定 |
| C-025,040 | Playwright（route介入） | GUI+network(+DB) | fulfill/abort/遅延保留。C-040はdb.ts注入併用 |
| C-030,031,032,033,034 | Playwright+db.ts（区間式評価突合）・**隔離・凍結DB＋§6.3e二層方式** | network(JSON)+DB | §6.3/§6.3e。過去確定バケット=絶対一致／現在期間バケット=Δのみ。三段参照（SEED非正）。SEED apply/teardown同梱 |
| C-037,038 | Playwright+db.ts（差分/監視窓） | network(JSON)+DB | 直接INSERTはskew窓外配置（§6.3e-3） |
| C-035 | Playwright+db.ts・**隔離DB/期間窓必須** | network+DB | 0件前提の環境保証（§9-6）。前提不成立時skip |
| C-036 | Playwright+db.ts（決定的ダイジェスト） | GUI+DB | §6.3c |
| C-039 | Playwright（JS無効context） | HTML | 初期HTML直読 |
| C-041 | Playwright | DOM属性 | canvas height=100 |
| C-042,044 | Playwright＋Chart内部読取（要実機=§9-8） | GUI+JS | JSON側判定は自動・Chartインスタンス読取は可用性未確定 |
| C-045 | Playwright | Cookie | context.cookies差分 |
| -EN 1行 | 実行保留（D15） | GUI | 文言確定済み |

聖域判定・多軸属性の正式付与はD14 v2合格後（本表は暫定・正式会計に使わない）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（§0判定原則。前提/入力列のシナリオ語はノイズ）。
1候補ケース行=1 assertion bundle・多対一は `shared-observation`・-EN行は対応ja行と同一親のlocale多重。
**参照先の全候補行は§4に実体掲載済み＝59↔候補の期待テキスト突合が本文内で完結する**。

### 集計（59 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **38** | 下表 |
| **TBD** | **1** | 017（DB相関エラー側=DB障害の共通例外委譲・観測契約未定義=L1-027） |
| **excluded** | **20** | フォーム/バリデーション不存在6（009,010,012,013,014,015）＋read-only機能への書込期待14（019,021,023,024,026,028,029,031,033,035,036,038,040,041）。各行の実引き正当化は§9-4/9-5 |
| 合計 | **59** | 欠落0・理由なし重複0 |

- 候補ケース行総数**26**（§4.1 bound対応20＝ja19＋-EN1／§4.2 補完6）。
- **極性・ノイズ処理の明示**（C4-manual対象=§10）:
  - **016（DB相関エラーなし）はexcludedにしない=semantic bind**: 本機能の処理本体はDB照会（区間集計）であり、
    「DBとの相関でエラーが出ず継続」の実在対応は「照会結果が空でも全キー0バケットでエラーなく描画継続」
    （md:155,226=L1-011/023）→C-035。Symfony Form制約の存在は意味しない（過大主張しない）。
    対の**017（DB相関エラーあり）は実在仕様（DB障害→共通例外委譲）が対応するがオラクル化不能=TBD**。
  - **009-015のフォーム系バリデーション6行はexcluded**: 本グラフはフォーム・テキスト入力を持たず
    （md:94,149,224・index.twig:146-213にinput/form 0件）、必須/相関バリデーション自体が不存在。
    実在の入力検証はAjax妥当性のみで、それは004/044の期待テキストが独立に保持（C-020/023/024でbound）。
  - **019〜041のIT-26系「追加される/変更される」肯定14行はexcluded**: read-only裁定
    （DOC-DRAFT-m02-03-1=§0。設計4箇所＋実装grep 0件）により本機能が行う登録/更新が存在しない。
    **否定側（020,025,027,032,037,039,055「追加/変更されない/参照のみ」）は全行bound**（C-036の無書込
    ブラケットが期待テキストどおりの観測）＝否定側を除外しない（偽陰性ゼロ）。
  - **022/058（バッチを起動しない）はboundだが限定構成**: 「起動しない」の全称否定は直接観測不能のため、
    観測契約をL1-020の限定構成（同期完結C-020・無書込C-036・バッチ相当更新の次回取得反映C-037）で
    構成（§10）。056（外部連携委譲）は委譲宣言部分を検証対象外とし観測可能部分をC-037で担保。
  - **004/044のCSRF負例は2系統で応答が異なる**: 非XHR=400 {"status":"NG"}確定（C-023）／XHR+CSRF不正=
    例外委譲・実測403（C-024・DOC-DRAFT-m02-03-2）。1つの「400」に丸めない。

### 59対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 週間・月間・年間タブに応じた縦棒グラフであること | bound | C-021,C-022 (shared) |
| 002 | 管理者認証後に表示されるダッシュボードであること | bound | C-010 (shared) |
| 003 | 売上状況カードに週・月・年タブと読み込み中表示を含むグラフ領域が描画される | bound | C-010 |
| 004 | Ajax用ヘッダでCSRF付与・XHRかつCSRF妥当な場合にのみバケット集合をJSONで返すこと | bound | C-020（正）,C-023,C-024（負2系統）,C-030（バケット集合の実値） (shared) |
| 005 | 同一ページ内でタブ切替・対応canvasに描画済みグラフ表示 | bound | C-022 |
| 006 | ホーム画面自体に到達できず本グラフも利用できないこと | bound | C-001,C-002 (shared) |
| 007 | グラフ部分に3タブ・canvas(chart-0/1/2)・#loadingを配置すること | bound | C-010 (shared) |
| 008 | ホーム画面表示後にグラフ用データを非同期で1回取得すること | bound | C-020（回数=1の観測を含む） |
| 009 | 必須バリでエラーが表示され完了しないこと | **excluded**（§9-4） | — |
| 010 | 必須バリでエラーが表示されず継続できること | **excluded**（§9-4） | — |
| 011 | 管理画面共通のカード・タブ・グラフ領域・ローディングのクラスを使うこと | bound | C-010 (shared・クラス確認を含む) |
| 012 | 相関バリでエラーが表示され完了しないこと | **excluded**（§9-4） | — |
| 013 | 相関バリでエラーが表示されず継続できること | **excluded**（§9-4） | — |
| 014 | 相関バリでエラーが表示されず継続できること | **excluded**（§9-4） | — |
| 015 | 相関バリでエラーが表示され完了しないこと | **excluded**（§9-4） | — |
| 016 | DB相関バリでエラーが表示されず継続できること | bound | C-035（semantic bind: 照会空でも全キー0バケット・エラーなし継続） |
| 017 | DB相関バリでエラーが表示され完了しないこと | **TBD**（L1-027） | —（DB障害→共通例外委譲。観測契約が設計スコープ外=md:46） |
| 018 | サマリはホームHTML表示時に読み取り・グラフは別リクエストで読み取る | bound | C-039 |
| 019 | 登録内容の対象レコードが追加されること | **excluded**（§9-5） | — |
| 020 | 追加され**ない**こと | bound | C-036（無書込ブラケット） |
| 021 | 追加されること | **excluded**（§9-5） | — |
| 022 | 本グラフはバッチを起動しないこと | bound | C-037＋C-020,C-036（L1-020限定構成=§10） |
| 023 | 追加されること（前提=成功時） | **excluded**（§9-5） | — |
| 024 | 追加されること（前提=最大長） | **excluded**（§9-5） | — |
| 025 | 追加され**ない**こと（前提=最大長+1） | bound | C-036 (shared) |
| 026 | 追加されること（前提=最小長） | **excluded**（§9-5） | — |
| 027 | 追加され**ない**こと（前提=最小長-1） | bound | C-036 (shared) |
| 028 | 追加されること（前提=副作用） | **excluded**（§9-5） | — |
| 029 | 実行結果の対象レコードが追加されること | **excluded**（§9-5） | — |
| 030 | 本グラフはフォームを持たないこと | bound | C-013 |
| 031 | 更新内容の対象レコードの値が変更されること（前提=Ajax妥当性） | **excluded**（§9-5） | — |
| 032 | 値が変更され**ない**こと（前提=未認証） | bound | C-036 (shared) |
| 033 | 値が変更されること（前提=認証済み） | **excluded**（§9-5） | — |
| 034 | 同一画面内に売上状況グラフ領域を表示であること | bound | C-010 (shared) |
| 035 | 値が変更されること（前提=タブ操作） | **excluded**（§9-5） | — |
| 036 | 値が変更されること（前提=グラフ取得成功・最大長） | **excluded**（§9-5） | — |
| 037 | 値が変更され**ない**こと（前提=グラフ取得失敗・最大長+1） | bound | C-036 (shared) |
| 038 | 値が変更されること（前提=CSRF/XHR不成立・最小長） | **excluded**（§9-5） | — |
| 039 | 値が変更され**ない**こと（前提=DB障害・最小長-1） | bound | C-036 (shared) |
| 040 | 値が変更されること（前提=表示直後に台帳変化） | **excluded**（§9-5） | — |
| 041 | 実行結果の対象レコードの値が変更されること | **excluded**（§9-5） | — |
| 042 | 管理者認証後に表示されるダッシュボードであること | bound | C-010 (shared) |
| 043 | 売上状況カードに週・月・年タブと読み込み中表示を含むグラフ領域が描画される | bound | C-010 (shared) |
| 044 | Ajax用ヘッダでCSRF付与・XHR+CSRF妥当時のみバケット集合をJSONで返すこと | bound | C-020,C-023,C-024,C-030 (shared) |
| 045 | 同一ページ内でタブ切替・対応canvasに描画済みグラフ表示 | bound | C-022 (shared) |
| 046 | ホーム画面自体に到達できず本グラフも利用できないこと | bound | C-001,C-002 (shared) |
| 047 | 縦棒の値は売上金額のみを用いること | bound | C-042 |
| 048 | 週・月・年タブは管理画面共通のピル型タブとして表示領域を切り替えるであること | bound | C-010（pill型・クラス）,C-022（切替動作） (shared) |
| 049 | モーダル・ポップアップ・トースト・確認ダイアログを表示しないこと | bound | C-013,C-025（取得失敗時も通知なし） (shared) |
| 050 | 本グラフはフォーム・テキスト入力を持たないこと | bound | C-013 (shared) |
| 051 | ツールチップと縦軸目盛りは通貨記号前置＋3桁区切りカンマであること | bound | C-044（Chart内部読取=要実機・§9-8） |
| 052 | 画面表示データでエラーが表示されず継続できること（前提=表示後に受注が更新された） | bound | C-038（semantic bind: 表示後更新→自動更新なし・エラーなし） |
| 053 | 棒グラフ描画では売上金額のみを使うこと | bound | C-042 (shared) |
| 054 | 画面表示データでエラーが表示されず継続できること（前提=参照時点） | bound | C-040 (shared・読取時点乖離が発生してもエラーなし) |
| 055 | 本グラフは参照のみで受注台帳やマスタを更新しないこと | bound | C-036 (shared) |
| 056 | 外部連携/バッチの反映タイミングは当該機能設計を正とすること | bound | C-037（観測可能部分=読取時点の永続化済みデータ。委譲宣言は非オラクル化） |
| 057 | グラフ用データはホーム表示後に管理画面内のAjaxとしてJSONを取得すること | bound | C-020 (shared) |
| 058 | 本グラフはバッチを起動しないこと | bound | C-037＋C-020,C-036 (shared・022と同一期待) |
| 059 | 取得成功で週・月・年のバケット集合を返し対応canvasに棒グラフを描画すること | bound | C-020,C-021,C-030 (shared) |

`func_scope_check` 判定: 親59/59会計済み（bound38＋TBD1＋excluded20=59・差分0）・欠落0・理由なし重複0・
補完6行は§4.2に実体掲載（親空・設計書補完・母集合会計外）→ **差分0を本文内で実証可能**。O6は主張しない。

## §9 TBD・要実機・excluded・既知乖離（正直な分離）

| # | 事項 | 状態 |
|---|---|---|
| 1 | **DOC-DRAFT-m02-03-1（設計書内矛盾・要修正候補）** | m02-03md:210-216 DB操作節「登録/更新｜dtb_order｜persist/flush による即時反映」は、同設計書の read-only 明記**4箇所**（md:30,173,196,306）およびee実装（AdminController.php全文にpersist/flush/INSERT/UPDATE 0件=grep実測）と矛盾。既存記録=`m02_03_..._e2e_cases.md`付帯表4#1（「正本の節間矛盾・支配的記述は参照のみ」）。**裁定: read-onlyを正**（§0）。期待値を「登録される」側に寄せない。m02-02のDOC-DRAFT-m02-02-1（codex裁定妥当確認済み）と完全同型。設計書修正の要否は上流へ申し送り |
| 2 | **DOC-DRAFT-m02-03-2（設計書の400全称とCSRF分岐実装の乖離）** | 設計書はXHR/CSRF「いずれかを満たさない場合はHTTP400で`{"status":"NG"}`」（md:78,109,185,195,225,257）と**両分岐とも400**に一般化するが、実装は ①非XHR→`json(['status'=>'NG'],400)`（短絡・確定=L1-006） ②XHR＋CSRF欠落/不正→`isTokenValid()`が`AccessDeniedHttpException`をthrow（AbstractController.php:256-261）→共通例外委譲＝既存実走2026-07-06で**HTTP403実測**（E2E-M02-03-013×）。本機能は区分=標準で「挙動・画面とも移行先ec-cube-enterpriseの実装を正とする」（md:16）＋同一経路をm02-02md:78/287はヘッジ済み＝**設計書側の過大一般化と裁定**（実装バグ=BC-DRAFTとしない）。C-024の期待は「成功配列を返さない・成功しない」まで・実効ステータスは要実機のまま非固定。設計書md:109等の表現是正を上流へ申し送り |
| 3 | **BC-DRAFT-m02-03-1（既知の実行時異常・原因未特定）** | 既存実走E2E-M02-03-003×: `sale_chart`が200を返しても`#loading`が非表示にならず`toBeHidden()`タイムアウト（2026-07-06環境）。設計（md:89,123「取得の成否にかかわらず完了時に非表示」）とソース（index.twig:97-98 `always→$('#loading').hide()`）はともに非表示を規定＝**期待は非表示のまま維持（実装/環境に寄せない）**。原因は未特定（Chart.js読み込み失敗・JS例外等の環境要因の可能性）。C-021/C-025実行時に再現観測し、再現すれば実装/環境切り分けの上で正式BC起票 |
| 4 | excluded 6行（009,010,012,013,014,015）の実引き正当化 | 期待列は「必須/相関バリデーションでエラーが表示され（ず）…」の定型。本グラフには**フォーム・テキスト入力が不存在**（md:94「本グラフはフォーム・テキスト入力を持たない」・md:149「入力フォームを持たないため、保存・更新に紐づく入力項目表は持たない」・md:224「利用者入力｜本グラフはフォームを持たない」・index.twig:146-213のカード全域にinput/form要素0件=grep実測）＝必須/相関バリデーションという観測契約の主語が不存在（constraint不存在型=m05-16/m02-02と同型）。エラーあり側は発生手段なし・エラーなし側は「〜バリデーションで」の限定が構成不能のため両極性とも過剰生成と判定。実在の入力検証（Ajax妥当性=md:225）は004/044の期待テキストが独立保持しC-020/023/024でbound |
| 5 | excluded 14行（019,021,023,024,026,028,029,031,033,035,036,038,040,041）の実引き正当化 | 期待列は「登録内容/更新内容/実行結果の対象レコードが追加される/値が変更されること」の肯定定型。#1裁定のとおり本機能に登録/更新は不存在（md:173「本グラフは参照のみであり、受注台帳やマスタを更新しない」・md:30,196,306・実装grep 0件）＝肯定側の観測対象が不存在で過剰生成。**否定側7行（020,025,027,032,037,039,055）は全行C-036へbound**しており、除外は肯定側に限定（偽陰性ゼロ） |
| 6 | C-035（0件0バケット）の環境前提 | 共有DBでは「週間/月間/年間の全区間に売上対象受注0件」を保証できない（年間区間は過去1年に及ぶため特に困難）。**隔離DB（フレッシュDB）が実行前提**＝前提不成立時はskip（db.ts式評価0の事前確認をガードに使う）。「0件状態」はSQL適用では作れない（状態の不在） |
| 7 | 通貨記号の具体グリフ | `currency_symbol()`=`Currencies::getSymbol(currency)`（EccubeExtension.php:372-378）＝記号グリフはICU/locale実装値（ja/JPY想定の全角￥等）＝**要実機確定**。C-044の判定は「記号1文字以上の前置＋3桁カンマ骨格」の正規表現＋数値部一致の2段（実装waveで確定） |
| 8 | 時刻・タイムゾーン・Chart内部読取 | ①BOUNDARY/SPREAD系（C-033/034）は実行時刻窓ガード必須（0時近傍・月初日・月末日実行では区間所属が変わる。「7日前0時」等はrun時動的算出でINSERT） ②db.ts突合SQLはセッションTZをアプリTZ（Asia/Tokyo=services.yaml:9,12）に一致させる必要（現行db.tsは単一コマンド実行のため複文/AT TIME ZONE対応が実装waveの前提整備=m02-02候補§9-6と同一） ③db.ts評価時刻とサーバ取得時刻の**now非同時性はcodex R1/R2のBlocker**→改訂2で**二層方式へ一本化**（§6.3e）: 過去確定バケット（今日/当月キーより前）のみ絶対値完全一致・現在期間バケット（今日/当月キー）はSEED適用前後のJSON差分Δのみ（絶対値一致を一切主張しない。「skew≤1時間」型の証明不能な仮定は撤回済み） ④Chartインスタンス読取（C-042/C-044のdatasets/options・C-041のheight実効値）は`Chart.getChart()`等のAPI可用性に依存＝**要実機**（Chart.jsバージョン固有仕様は設計スコープ外=md:44）。JSON側判定は自動 ⑤**サーバ基準時刻（Carbon::now()@AdminController.php:227実値）の外部観測手段なし＝直接束縛は要実機**: sale_chart応答のバケットキーは日/月粒度・HTTP Dateヘッダは応答生成時刻で同一観測にならない。実機で観測手段が確定すればdb.ts SQLの`:to`バインド方式へ引き上げ＝**現在期間バケットも絶対値一致へ引き上げ可**（§6.3e） ⑥**アプリ/DB時計の整合**（§6.3e前提5）: 未来日付行ガードはDB時計基準のため、アプリ時計がDB時計より大きく先行する環境ではΔ決定性の別途検証が要る＝同一ホスト/NTP同期の確認を実機導入時のチェック項目に含める |
| 9 | 拡張フック差し替え環境 | L1-025（ADMIN_ADMIM_INDEX_SALES差し替え）はプラグイン導入環境でのみ発生し標準環境では既定値が実効＝**差し替え環境での実行は対象外**（C-030/031/036は標準環境前提を明記）。差し替え仕様の正はm02-02md（委譲） |
| 10 | 管理画面のenロケール切替口 | 要D15（-EN 1行の実行前提。W0実測を継承） |
| 11 | 既存page.tsコメントの行番号ずれ | `m02_03_..._page.ts` 冒頭コメントの `messages.ja.yaml:1691-1693` は旧checkout値（現行ee `9dbc4dd1` では **:1884-1886**=grep実測）。セレクタ実体には影響なし（実装waveでコメント更新） |
| 12 | manifest_sha1（fixture_version確定） | D5後（現状 `@TBD-D5`。SEED-M02-SALES-DASHBOARD.sqlは実装済みだがSEED-M0203-CHART-SPREAD/BOUNDARYは**未実装**・fixture_version契約は未確定） |
| TBD | 017（L1-M0203-027） | DB読み取り障害→共通例外委譲・専用メッセージなし（md:258,195）。HTTPステータス/例外型の列挙は設計スコープ外（md:46）で観測契約が定義不能＋安全な障害誘発手段なし＝未確定オラクル台帳へ（excludedにしない） |

候補規律: 全行 `@TBD-D5`・O5未確定（D6後に確定検査）・実装/実走なし・O6/聖域/多軸/C6C7を主張しない。
既知バグ: 実装側の確定BC-DRAFTは**0件**（#3は原因未特定の実行時異常として分離・#2は設計書側のDOC-DRAFT
と裁定＝実装乖離の主張はしない）。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象構文の列挙とclaim別判定（本機能は「エラーが表示され（ず）」対・「追加/変更される（されない）」対・
否定claim（起動しない/更新しない/表示しない/持たない/返さない/再生成しない）・「のみ」限定が多数）:

| 対象 | 極性判定 | 判定根拠（一次資料） |
|---|---|---|
| 009/012/015（バリエラーあり）vs 010/013/014（エラーなし） | 両極性とも**excluded**: フォーム不存在＝「必須/相関バリデーションで」という観測主語が構成不能。実在の入力検証はAjax妥当性のみで004/044が独立保持（C-020/023/024でbound） | m02-03md:94,149,224／index.twig:146-213（input/form 0件） |
| 016（DB相関エラーなし）vs 017（DB相関エラーあり） | 016=**semantic bind**（照会空でも全キー0バケット・エラーなし継続=C-035）／017=**TBD**（DB障害→共通例外委譲。md:46がHTTP/例外の列挙をスコープ外と明記＝オラクル化不能。excludedにしない=実在仕様） | m02-03md:155,226,258,46 |
| 019〜041の「追加される/変更される」（肯定14行） | **excluded**: read-only裁定（設計4箇所＋実装grep 0件＝DOC-DRAFT-m02-03-1）。「登録される」期待の捏造をしない | m02-03md:30,173,196,306／AdminController.php全文 |
| 020/025/027/032/037/039/055の「追加/変更されない/参照のみ」（否定7行） | **bound**: 無書込はdb.tsブラケット（行数＋dtb_order全列ダイジェスト＋mtb_order_status全列ダイジェスト不変=C-036・§6.3c）で実観測可能な否定＝除外しない。主張は標準環境に限定 | AdminController.php:210-241,500-537（SELECTのみ）／m02-03md:173 |
| 022/058「バッチを起動しないこと」 | **bound（限定構成）**: 「起動しない」の全称否定は直接観測不能。設計同節の観測可能部分（「バッチによって受注が更新済みの場合、次回のグラフ取得時にその時点の永続化済みデータを読む」=md:183後段）をC-037で実観測し、同期完結（C-020）＋無書込（C-036）を併置して構成。無限の否定は主張しない | m02-03md:183／AdminController.php:210-241（Process/dispatch類の起動コード不存在=grep） |
| 030/050「フォーム・入力を持たない」／049「モーダル等を表示しない」 | 否定期待だが観測範囲が#chart-statistics内DOMに限定され観測可能→bound（C-013。取得失敗時の「専用通知なし」はC-025でroute介入により失敗状態を構成して観測） | m02-03md:93-94／index.twig:146-213 |
| 052「表示後に受注が更新された→エラーなし継続」 | semantic bind: 実在対応は「描画済みグラフは自動更新しない（エラーも出ない）」（md:160）→C-038。観測契約は「監視窓内の追加リクエスト0件＋再描画なし」に限定（無限の否定は主張しない） | m02-03md:160／index.twig:16-103（再取得コードなし） |
| 054「参照時点→エラーなし継続」／018「サマリ=HTML時読取・グラフ=別リクエスト」 | 054はC-040（別読取間のDB変更で乖離が発生してもエラーなし=構成的観測）・018はC-039（初期HTML直読との対比）。「サマリとグラフが一致すること」を期待にしない（md:170「一致しないことがある」の誤反転回避）。区間間の厳密一致（md:171）も**等式期待を置かない**（非保証） | m02-03md:170-171 |
| 004/044「XHRかつCSRF妥当な場合**にのみ**返す」 | 「のみ」の全称部は正例（C-020）＋負例2系統（非XHR=C-023確定400NG／XHR+CSRF不正=C-024・例外委譲・実測403=DOC-DRAFT-m02-03-2）で被覆。**負例2系統の応答が異なる**ことを実装＋実走実績から把握し、C-024へ400NG期待を流用しない（設計書逐語をそのまま期待化すると既知403で偽オラクルになる） | AdminController.php:213-215／AbstractController.php:256-261／既存実走E2E-M02-03-013 |
| 047/053「売上金額のみを使う」 | 「のみ」＝JSONにcountが**含まれる**事実（L1-008）とdatasetsがpriceのみ（L1-015）の両観測で構成（countがJSONに無いことを期待にしない誤反転を回避）→C-042 | AdminController.php:527-535／index.twig:63-94 |
| 008「非同期で**1回**取得」／005/045「タブ切替で追加問い合わせなし」 | 回数限定はネットワーク監視の回数計測で観測可能→C-020（=1回）・C-022（タブ操作起因の増分0）。「再生成しない」もChart再生成なし（同一インスタンス）を含めC-022の監視窓に限定 | index.twig:19,55-99／m02-03md:89,91 |
| 001「タブに**応じた**縦棒グラフ」 | 「応じた」＝配列順（週/月/年）とcanvas番号（0/1/2）の対応（L1-015）を C-021（描画対応）＋C-022（タブとペインの対応）で構成。集計値の正しさはC-030が独立に担保 | index.twig:60-77,200-207／m02-03md:120 |

codex敵対レビュー: **R1=要修正（Blocker1のみ。excluded=20/TBD=1・DOC-DRAFT2件裁定・捏造ゼロは
妥当確認済み）→改訂1→R2=未達→改訂2で根本是正・R3再確認待ち**。検出の記録（C4-manual実効性証跡）:
- **R1: グラフ全バケット突合のnow時点非固定**＝Controllerのリクエスト開始時 `$toDate=Carbon::now()`
  （AdminController.php:226-241）とdb.ts SQLの `now()` が別時点であり、「SEEDをnow近傍に置かない」だけでは
  既存データ/並行更新のnow近傍行差を排除できず「全キー・price・count完全一致」が保証不能
  （**観測契約の時刻基準不一致の検出例**）。
- **R2: skew窓ガードの論理不足**＝改訂1の「1時間skew窓0件」ガードは**実時差≤1時間を証明できない**
  （実行遅延が上回れば将来日時の既存行が後続サーバ集計に入る＝**証明不能な仮定に依存した決定性主張の
  検出例**）。→改訂2=now依存を絶対値一致の対象から外す**バケット二層方式へ一本化**（§6.3e）:
  過去確定バケット（今日/当月キーより前・now非依存で決定的）=隔離・凍結DB前提の絶対値完全一致／
  現在期間バケット（今日/当月キー）=SEED適用前後のJSON差分Δのみ（既存now近傍行は両応答で相殺・
  DB凍結に依存しない決定性）。ガードは「未来日付行0件」（skew仮定不要）＋同一日run確認へ差替え。
  サーバ基準時刻の直接束縛は要実機のまま（確定すれば現在期間も絶対一致へ引き上げ=§9-8⑤）。
  C-030〜035の前提・手順・期待セルへ反映済み（C-032は当日バケットの絶対値一致要求を削除しΔのみ・
  C-034は過去側境界=完全一致/現在期間側=判定対象外の二段構造を明示）。
判定確定後に `REVIEW_LEDGER.md` と同期する。

---

## 付録: 作業実測（B0係数計測用）

- 読んだ一次資料・参照物: 設計書md 1（m02-03md全308行）／ee実ソース・設定 12超（AdminController
  〔sale/getData/convert全文＋excludes〕・AbstractController(isTokenValid)・OrderStatus・Order(SoftDeleteable)・
  index.twig全文〔JS 16-103・カード146-213〕・default_frame.twig(meta/ajaxSetup)・EccubeExtension
  (currency_symbol)・Constant・security.yaml・services.yaml・doctrine.yaml・eccube.yaml）／locale 2
  （messages.ja/en.yaml該当帯・行番号grep実測）／母集合・fid_kubun 2（sha256実測）／統治・見本 3
  （CFP/CRP/m02-02候補全文）／既存実装・記録 5（m02_03 e2e_cases md〔11〇/2×実績〕・spec・page・
  SEED-M02-SALES-DASHBOARD.sql・db.ts/oracle.ts）。
- L1 claim数: **26確定＋1 TBD**（=27行）。候補ケース行26（ja25・-EN1）。
- 売上グラフ特有の難所: (1) **グラフ内部値は決定的照会で**: canvas内部ピクセルは判定に使わず、
  sale_chart JSON応答（ブラウザ発XHRの捕捉）⇔db.ts区間式評価の全バケット突合を正にした
  （既存e2e_casesが「集計値そのものは検証しない」と退避した領域を実行可能化）。ただし**サーバtoDateと
  db.ts nowの時点非固定がcodex R1/R2 Blocker**＝skew上限は証明不能のため全バケット完全一致を撤回し、
  過去確定バケット=絶対値完全一致／現在期間バケット=SEED前後のJSON差分Δのみ、の**二層方式**へ
  （§6.3e。基準時刻の直接束縛は観測手段なし=要実機・確定すれば引き上げ）
  (2) **CSRF負例2系統の応答差**: 非XHR=400 {"status":"NG"}確定／XHR+CSRF不正=例外委譲・**実測403**。
  設計書は両方400と全称記載＝逐語をそのまま期待化すると偽オラクル→DOC-DRAFT-m02-03-2で分離
  (3) **境界の非対称**: 本グラフは `>= from かつ <= to（両端含む）`＝同一画面のサマリ（終了未満）と逆極性。
  開始境界ちょうど（7日前0時・1年前月初0時）算入をSEEDで実証・上限nowちょうどはSEED構成不能と明記
  (4) **既知の実行時異常**: #loading非表示×実績（BC-DRAFT-m02-03-1）は設計・ソースとも非表示規定＝期待を
  実装/環境へ寄せず再現観測項目として分離
  (5) 除外集合・拡張差し替えは**m02-02mdへの委譲**が設計書に明記＝実装実値（3,7,8,15）は照合補助に留め
  重複オラクル化しない（正本の一意性維持）。

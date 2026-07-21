OpenAI Codex v0.142.5
--------
workdir: /home/y-saito/Developments/hareruya-design-docs
model: gpt-5.5
provider: openai
approval: never
sandbox: read-only
reasoning effort: medium
reasoning summaries: none
session id: 019f26ae-295f-7252-9203-6477a4b0ba4f
--------
user
あなたは設計書vs実装の差分監査に対する**批判的レビュア**です。読み取り専用で検証してください。創作禁止・確認できないものは「確認不能」と明記。

## 対象機能: m05-21_admin_order_order_shipping_standby_picking_list_print
- 差分候補JSON(検証対象): /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-21_admin_order_order_shipping_standby_picking_list_print.json
- 設計書HTML(正): /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-21_admin_order_order_shipping_standby_picking_list_print.html
- 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube （必要に応じ /home/y-saito/Developments/ec-cube-enterprise 全体）

## 手順
1. 差分候補JSONの各findingについて、designRef(設計書 file:line)とimplRef(実装 file:line)を**実際に開いて**突き合わせる。
2. 次の観点で批判的に指摘（各指摘に file:line 根拠を付ける）:
   - 誤検知(FALSE_POSITIVE): 実装は別ファイル/別ルート/別名で設計どおり実現、または引用/行番号が誤り。
   - 見落とし(MISSED): 設計書の重要節（処理フロー/判定順序/バリデーション/DB操作/権限/エラー処理/セッション等）で実装と異なるのにfindingsに無い差分。
   - 根拠不備(WEAK_EVIDENCE): designRef/implRefが存在しない・的外れ・引用が創作。
   - 重要度誤り(SEVERITY): high/med/lowが業務影響と不整合。
3. 各指摘を「種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応」で簡潔に列挙。
4. 最後に必ず1行: VERDICT: false_positive=<n>, missed=<n>, weak_evidence=<n>, 総合=<信頼できる|要修正|大幅要修正>

warning: Codex could not find bubblewrap on PATH. Install bubblewrap with your OS package manager. See the sandbox prerequisites: https://developers.openai.com/codex/concepts/sandboxing#prerequisites. Codex will use the bundled bubblewrap in the meantime.
codex
読み取り専用で、まず候補JSONと設計HTML、関連実装の参照先を確認します。行番号の正確性も含めて見るため、対象ファイルを行番号付きで開きます。
exec
/bin/bash -lc "nl -ba function_spec_html_preview/pf-eccube3/m05-21_admin_order_order_shipping_standby_picking_list_print.html | sed -n '1,260p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<!doctype html>
     2	<html lang="ja">
     3	<head>
     4	  <meta charset="utf-8">
     5	  <meta name="viewport" content="width=device-width, initial-scale=1">
     6	  <title>m05-21_admin_order_order_shipping_standby_picking_list_print（管理画面_受注管理_ピッキングリスト印刷） - 機能仕様書</title>
     7	  <style>
     8	:root {
     9	  --bg: #ffffff;
    10	  --panel: #fffdf8;
    11	  --text: #2b2a26;
    12	  --muted: #7a756a;
    13	  --line: #d6cdbd;
    14	  --line-soft: #ebe2d3;
    15	  --band: #f3ede1;
    16	  --clay: #c25a37;
    17	  --clay-soft: #f4e6dd;
    18	  --olive: #5f7048;
    19	  --olive-soft: #e9ecdf;
    20	}
    21	* { box-sizing: border-box; }
    22	body {
    23	  margin: 0;
    24	  background: var(--bg);
    25	  color: var(--text);
    26	  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Yu Gothic", Meiryo, sans-serif;
    27	  font-size: 14px;
    28	  line-height: 1.7;
    29	}
    30	.page {
    31	  display: grid;
    32	  grid-template-columns: 280px minmax(0, 1fr);
    33	  gap: 32px;
    34	  max-width: 1480px;
    35	  margin: 0 auto;
    36	  padding: 28px 28px 64px;
    37	}
    38	.sidebar {
    39	  position: sticky;
    40	  top: 24px;
    41	  align-self: start;
    42	  max-height: calc(100vh - 48px);
    43	  overflow-y: auto;
    44	  padding-right: 12px;
    45	  border-right: 1px solid var(--line-soft);
    46	}
    47	.sidebar-title {
    48	  margin: 0 0 10px;
    49	  color: var(--muted);
    50	  font-size: 12px;
    51	  font-weight: 700;
    52	  letter-spacing: .06em;
    53	  text-transform: uppercase;
    54	}
    55	.toc a {
    56	  display: block;
    57	  padding: 4px 0 4px 12px;
    58	  border-left: 2px solid var(--line-soft);
    59	  color: var(--muted);
    60	  text-decoration: none;
    61	}
    62	.toc a:hover { color: var(--clay); border-left-color: var(--clay); }
    63	.toc .lv3 { padding-left: 24px; font-size: 13px; }
    64	.doc-content { min-width: 0; }
    65	header.page-header {
    66	  margin-bottom: 24px;
    67	  padding-bottom: 18px;
    68	  border-bottom: 1px solid var(--line);
    69	}
    70	.crumb {
    71	  margin: 0 0 8px;
    72	  color: var(--muted);
    73	  font-size: 13px;
    74	}
    75	h1 { margin: 0; font-size: 28px; line-height: 1.3; }
    76	h2 {
    77	  margin: 34px 0 12px;
    78	  padding-bottom: 7px;
    79	  border-bottom: 2px solid var(--clay);
    80	  font-size: 21px;
    81	}
    82	h3 { margin: 26px 0 10px; font-size: 17px; color: var(--olive); }
    83	h4 { margin: 20px 0 8px; font-size: 15px; color: var(--muted); }
    84	p { margin: 9px 0; }
    85	a { color: var(--clay); }
    86	code {
    87	  padding: 1px 5px;
    88	  border-radius: 5px;
    89	  background: var(--band);
    90	  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    91	  font-size: 90%;
    92	}
    93	pre {
    94	  overflow-x: auto;
    95	  padding: 12px 14px;
    96	  border: 1px solid var(--line);
    97	  border-radius: 8px;
    98	  background: var(--panel);
    99	}
   100	pre code { padding: 0; background: transparent; }
   101	hr { margin: 26px 0; border: 0; border-top: 1px solid var(--line); }
   102	ul, ol { margin: 9px 0; padding-left: 26px; }
   103	li { margin: 3px 0; }
   104	.table-wrap {
   105	  overflow-x: auto;
   106	  margin: 14px 0 22px;
   107	  border: 1px solid var(--line);
   108	  border-radius: 8px;
   109	  background: var(--panel);
   110	}
   111	table {
   112	  width: 100%;
   113	  min-width: 760px;
   114	  border-collapse: collapse;
   115	  font-size: 13px;
   116	}
   117	th, td {
   118	  border: 1px solid var(--line-soft);
   119	  padding: 7px 9px;
   120	  text-align: left;
   121	  vertical-align: top;
   122	}
   123	th {
   124	  position: sticky;
   125	  top: 0;
   126	  background: var(--band);
   127	  font-weight: 700;
   128	  white-space: nowrap;
   129	}
   130	tbody tr:nth-child(even) { background: #fffaf0; }
   131	.screen-item-table table { min-width: 1120px; }
   132	.section-row td {
   133	  background: var(--olive-soft);
   134	  color: var(--olive);
   135	  font-weight: 700;
   136	}
   137	.tabbed-note {
   138	  white-space: pre-wrap;
   139	  overflow-x: auto;
   140	  padding: 10px 12px;
   141	  border-left: 3px solid var(--olive);
   142	  background: var(--panel);
   143	}
   144	details {
   145	  margin: 34px 0 12px;
   146	}
   147	details > summary {
   148	  cursor: pointer;
   149	  padding-bottom: 7px;
   150	  border-bottom: 2px solid var(--clay);
   151	  font-size: 21px;
   152	  font-weight: 700;
   153	  list-style: revert;
   154	}
   155	details[open] > summary { margin-bottom: 12px; }
   156	footer {
   157	  margin-top: 48px;
   158	  padding-top: 16px;
   159	  border-top: 1px solid var(--line);
   160	  color: var(--muted);
   161	  font-size: 12px;
   162	}
   163	@media (max-width: 900px) {
   164	  .page { display: block; padding: 20px 16px 48px; }
   165	  .sidebar {
   166	    position: static;
   167	    max-height: none;
   168	    margin-bottom: 24px;
   169	    padding-right: 0;
   170	    border-right: 0;
   171	    border-bottom: 1px solid var(--line-soft);
   172	    padding-bottom: 16px;
   173	  }
   174	  h1 { font-size: 23px; }
   175	}
   176	  </style>
   177	</head>
   178	<body>
   179	  <div class="page">
   180	    <aside class="sidebar">
   181	      <p class="sidebar-title">On this page</p>
   182	      <nav class="toc"><a class="lv2" href="#概要">概要</a>
   183	<a class="lv2" href="#リニューアル移行時の扱い">リニューアル移行時の扱い</a>
   184	<a class="lv2" href="#利用者視点の入口">利用者視点の入口</a>
   185	<a class="lv2" href="#フロント挙動">フロント挙動</a>
   186	<a class="lv2" href="#処理フロー">処理フロー</a>
   187	<a class="lv3" href="#編集から別ウィンドウで印刷ページを開くまで">編集から別ウィンドウで印刷ページを開くまで</a>
   188	<a class="lv3" href="#サーバがピッキングリストHTMLを返すまで-admin-shipping-standby-print-picking-list">サーバがピッキングリストHTMLを返すまで（`admin_shipping_standby_print_picking_list`）</a>
   189	<a class="lv2" href="#集計条件">集計条件</a>
   190	<a class="lv2" href="#価格帯とサプライ振り分けの判定順序">価格帯とサプライ振り分けの判定順序</a>
   191	<a class="lv2" href="#業務ルール・計算">業務ルール・計算</a>
   192	<a class="lv3" href="#画面上の一覧列とデータ対応-低・中・高">画面上の一覧列とデータ対応（低・中・高）</a>
   193	<a class="lv2" href="#データ整合性">データ整合性</a>
   194	<a class="lv2" href="#API-バッチ結果">API/バッチ結果</a>
   195	<a class="lv2" href="#入出力">入出力</a>
   196	<a class="lv2" href="#バリデーション">バリデーション</a>
   197	<a class="lv2" href="#権限・認可">権限・認可</a>
   198	<a class="lv2" href="#画面遷移">画面遷移</a>
   199	<a class="lv3" href="#遷移時に引き継ぐ状態">遷移時に引き継ぐ状態</a>
   200	<a class="lv2" href="#エラー処理">エラー処理</a>
   201	<a class="lv2" href="#DBカラム">DBカラム</a>
   202	<a class="lv3" href="#DB操作">DB操作</a>
   203	<a class="lv2" href="#ログ・監査">ログ・監査</a>
   204	<a class="lv3" href="#ログに出してはいけないもの">ログに出してはいけないもの</a>
   205	<a class="lv2" href="#試行制限">試行制限</a>
   206	<a class="lv2" href="#セッション">セッション</a>
   207	<a class="lv3" href="#セッションへ保存しない情報">セッションへ保存しない情報</a>
   208	<a class="lv2" href="#Cookie">Cookie</a>
   209	<a class="lv2" href="#排他制御・トランザクション">排他制御・トランザクション</a>
   210	<a class="lv2" href="#調査補助">調査補助</a>
   211	<a class="lv3" href="#HTTPルート名とパス-コード探索用・旧入口節より退避">HTTPルート名とパス（コード探索用・旧入口節より退避）</a></nav>
   212	    </aside>
   213	    <main class="doc-content">
   214	      <header class="page-header">
   215	        <p class="crumb">Source:<br>/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-21_admin_order_order_shipping_standby_picking_list_print.md</p>
   216	        <h1>m05-21_admin_order_order_shipping_standby_picking_list_print（管理画面_受注管理_ピッキングリスト印刷）</h1>
   217	      </header>
   218	      <h2 id="概要">概要</h2>
   219	<p>管理画面の「受注管理」メニュー配下にある「出荷指示リスト」（ナビ定義上は <code>admin.order.shipping_instructions</code> と同じブロック）の編集画面から、一覧に並ぶ受注のうちチェックが付いたものだけを対象に、ピッキング用の単体HTMLを別ウィンドウで開き、ブラウザの印刷機能で用紙に落とすための機能である。メニュー項目名では「ピッキングリスト印刷」と翻訳キー <code>admin.order.shipping_standby_list_print</code> が使われている。</p>
   220	<p>本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値とするソースはSymfony管理画面チャネルの出荷指示編集ルート、<code>print/picking</code> ルート、出荷指示保存先を扱うリポジトリの一覧取得処理、印刷用 Twig、共通管理JS、印刷用CSSとする。</p>
   221	<p>対象はブラウザ経由の管理画面のみとする。</p>
   222	<p>本機能のカスタマイズ区分は現行踏襲であり、画面挙動と処理フローは現行リポ pf-eccube3 の実装を確認値とし、永続化に関わるテーブル・列の記述は ec-cube-enterprise を正とする。</p>
   223	<p>コントローラの関数一覧は本文の主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。</p>
   224	<hr>
   225	<h2 id="リニューアル移行時の扱い">リニューアル移行時の扱い</h2>
   226	<p>DB関連の記述は ec-cube-enterprise を正とする。本機能が参照する永続化先は確認時点で現行（pf-eccube3）と移行先（ec-cube-enterprise）で同一スキーマである。</p>
   227	<div class="table-wrap"><table><thead><tr><th>観点</th><th>現行（pf-eccube3）</th><th>移行先（ec-cube-enterprise）</th></tr></thead><tbody><tr><td>出荷指示リスト本体</td><td><code>dtb_shipping_standby</code>（主キー <code>id</code>、備考 <code>comment</code>、最終更新者 <code>member_id</code>）</td><td>同一スキーマ。テーブル名・列名とも一致する。</td></tr><tr><td>出荷指示と受注の対応</td><td>受注との多対多結合表 <code>dtb_order_shipping_standby</code></td><td>同一スキーマ。結合表名・対応関係とも一致する。</td></tr><tr><td>価格帯しきい値</td><td><code>mtb_option.option_key</code> の <code>order_list_threshold_price_1</code> / <code>order_list_threshold_price_2</code>、値は <code>option_value</code></td><td>同一スキーマ。オプションキー・値列とも一致する。</td></tr><tr><td>参照する受注・カード明細</td><td><code>dtb_order</code> ほかカード詳細マスタ群（並び順用の箔フラグ列等）</td><td>同一スキーマ。並び順用の列も移行先に存在する。</td></tr></tbody></table></div>
   228	<p>しきい値2行の束ね順に起因する挙動上の論点は現行・移行先とも同一であり、DBスキーマ差としては扱わない。</p>
   229	<hr>
   230	<h2 id="利用者視点の入口">利用者視点の入口</h2>
   231	<div class="table-wrap"><table><thead><tr><th>入口</th><th>URLエンドポイント</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>ナビから受注管理に相当するメニューを開き、「出荷指示リスト」一覧からスタンバイを選んで編集を開く</td><td><code>GET /{admin_route}/standby/{id}/edit</code>（ルート名 <code>admin_shipping_standby_edit</code>）</td><td>コメント用フォームと、紐づく受注表（チェックは初期ですべてオン）、一括操作ボタン行が現れる（詳細は出荷指示編集の別設計を正）。</td></tr><tr><td>印刷に含める受注だけチェックを残し、「ピッキングリスト印刷」を押す</td><td><code>POST /{admin_route}/standby/{id}/print/picking</code>（別ウィンドウ <code>newwin</code>）</td><td>親画面の <code>#form_bulk</code> の <code>action</code> が当パスになり <code>target=newwin</code> で送信され、ウィンドウ内に単体のピッキングリストHTMLが表示される。送信のたび隠し <code>name=id</code> と値 <code>ja</code> が追記されるが、サーバは印刷結果にこれを参照しない。</td></tr><tr><td>チェックをすべて外してからピッキング印刷を押す</td><td>上記POST</td><td><code>order_ids</code> が実質なくなり、注文ID配列が空になる。Doctrine の IN パラメタとDB方言の組み合わせにより例外や空結果になりうる。</td></tr><tr><td>アドレスへ直接 <code>/print/picking</code> を叩く（GET）</td><td><code>GET /{admin_route}/standby/{id}/print/picking</code></td><td>本文にチェック状態が載らず <code>order_ids</code> が無いときは空集合扱いになりうる。</td></tr></tbody></table></div>
   232	<hr>
   233	<h2 id="フロント挙動">フロント挙動</h2>
   234	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>表示要素（編集）</td><td>共通管理フレーム <code>@admin/default_frame</code>。一括フォーム <code>id="form_bulk"</code> に「ピッキングリスト印刷」ボタン <code>id="printPickingList"</code>、各受注行のチェックボックスは <code>order_ids[&lt;注文ID&gt;]</code> とし、一覧ヘッダの <code>id="check-all"</code> と行 <code>id="check-&lt;注文ID&gt;"</code> が共通JSの全選択慣例に一致するようになっている（初期チェックオンはテンプレの <code>checked</code> 属性）。</td></tr><tr><td>JS挙動（編集）</td><td>クリック時に縦横700程度の名前付きウィンドウを空で開き、<code>#form_bulk</code> の <code>action</code> をピッキング印刷URL、<code>target</code> を <code>newwin</code> にセットし、<code>type=hidden</code>、<code>name=id</code>、<code>value=ja</code> を毎回 <code>append</code> してから <code>submit</code>。納品書ボタンは同ウィンドウ名を再利用する別ハンドラである。送信後、<code>action</code> と <code>target</code> を他ボタンのハンドラが都度張り替える設計とは独立に、親ページURLは編集画面のままである。</td></tr><tr><td>表示要素（印刷）</td><td>共通レイアウトは使わず、<code>picking_list.twig</code> が単独HTMLを返す。先頭は印刷ボタン帯 <code>.printBox</code>、本文 <code>.ContentsAll</code>。帯ごとに <code>multipage</code>、<code>maxPageRows = 30</code> で表を区切り、最終ページは空行パディングのあとに「合計 N 点数」相当の一行を載せる。</td></tr><tr><td>CSS・レイアウト（印刷）</td><td>アセットパス経由で <code>assets/css/pickinglist.css</code>（成果物は <code>html/template/admin/assets/css/</code> 側）を読む。コンテンツ幅720px、<code>@media print</code> で <code>.printBox</code> を非表示。<code>.multipage</code> は <code>page-break-after: always</code> で強制改ページを付ける（最終チャンク含めて当該 DIV に付く）。</td></tr><tr><td>JS挙動（印刷ページ）</td><td><code>DOMContentLoaded</code> で <code>#printButton</code> に <code>window.print</code> を紐づける。<code>select2</code> の静的JSを読むが、当ページでウィジェット初期化コードは載せない。</td></tr><tr><td>モーダル</td><td>共通モーダルはなく、確認はブラウザの印刷ダイアログに委ねる。</td></tr></tbody></table></div>
   235	<hr>
   236	<h2 id="処理フロー">処理フロー</h2>
   237	<h3 id="編集から別ウィンドウで印刷ページを開くまで">編集から別ウィンドウで印刷ページを開くまで</h3>
   238	<ol><li>利用者が管理画面ログイン済み状態で編集ページを開く。</li><li>受注一覧で印刷に含める行だけチェックオンにする（既定はすべてオン）。</li><li>「ピッキングリスト印刷」を押す。</li><li>スクリプトが別ウィンドウを準備して一括フォームを <code>POST …/standby/{id}/print/picking</code> に送る。</li><li>返却された単体ページで「印刷」を押すとブラウザ印刷が開始し、CSSにより画面上部ボタン帯はプレビューから消える。</li></ol>
   239	<h3 id="サーバがピッキングリストHTMLを返すまで-admin-shipping-standby-print-picking-list">サーバがピッキングリストHTMLを返すまで（<code>admin_shipping_standby_print_picking_list</code>）</h3>
   240	<ol><li>パス <code>{id}</code> の出荷指示行が無いとき <code>createNotFoundException</code> により404。</li><li>リクエストから <code>order_ids</code> を読み、その連想配列のキーを注文ID配列のみとして用いる。値や <code>ja</code> と名付けた隠しフィールドはこのルートの分岐には使わない。</li><li>出荷指示用リポジトリのピッキングリスト生成関数に、スタンバイ整数IDと注文ID配列を渡す。このクエリでは <code>mtb_option</code> へ <code>findBy(['option_key' =&gt; ['order_list_threshold_price_1','order_list_threshold_price_2'], …])</code> 相当で複数行を一度に読み、その返却順の最初の行値を <code>:price1</code>、2番目を <code>:price2</code> に結びつける。またコントローラでは同じ両キーを個別に <code>findOneBy</code> で読み、<code>thresholdPrice1</code>・<code>thresholdPrice2</code> を Twig の見出し数値へ渡している。両経路で同じDB行が異なる順に束ねられると、「一覧の並びクエリでの閾値」と「画面上の文言数値」の取り合わせが食い違う可能性がある。</li><li>クエリの SELECT に集計項目（色情報、レアコード、プロモーション、言語コード、状態コード、棚番名称、単価、カテゴリ最小、SUM数量など）と、単価と <code>:price1</code>・<code>:price2</code> を使うCASE二つがある。JOIN はスタンバイにぶら下がる受注および明細からカード詳細類へ広がり、グループキーとして色・状態・収納略称・並び順用列など多数をGROUP BY に載せている。並び順は商品並び用trait が付与するHIDDENおよび可視ソートキー、アルギュメント <code>[ 'foilFlg' ]</code> により箔フラグ列を結果に載せている。</li><li>PHPループ各行で、<code>polyquantity</code> と色カウント・カテゴリカウントの積により <code>quantitySubtotal</code> を算出し、収納略称を別名フィールドへ写す。</li><li>最小カテゴリがグッズ定数・予約グッズ定数のいずれでもないとき、収納略称に一致する角括弧略称、<code>【言語コード/状態コード】</code>、複数順の色レア抽出正規表現で商品名を削り、ヒットした断片は色レラ列へ。抽出に使う定数群はピッキング印刷と納品書系で共有しないが、文言ルール自体はソース先頭で定める。</li><li>CLASS二つ <code>$class[class1][class2]</code> が指す値を <code>low</code>・<code>middle</code>・<code>high</code> のいずれかキーへ追記し、その帯の合計点数に <code>quantitySubtotal</code> を足す。</li><li>グッズ定数側は常に <code>'goods'</code> キー側へだけ足し込み、名解体や二段クラス参照はしない。</li><li>各帯のアイテム配列長が正のときだけ Twig が表と改ページブロックを出す。</li></ol>
   241	<hr>
   242	<h2 id="集計条件">集計条件</h2>
   243	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>結合単位の起点</td><td>URLのスタンバイIDにより外部キーJOINされた注文のみ。</td></tr><tr><td><code>order_ids</code> でのフィルタ</td><td>WITH句側で、そのスタンバイにぶらさがっている注文のうち、渡された注文ID集合への IN 一致を追加している。集合が論理空のときのクエリ評価はORMと方言の確認値とする。</td></tr><tr><td>グループ単位</td><td>色・名前・単価・各種コード・並び順用列などでGROUP BY し、<code>SUM(oi.quantity)</code> を <code>polyquantity</code> にまとめる。</td></tr><tr><td><code>quantitySubtotal</code> 分母</td><td>クエリ側 <code>colorCount</code>（色が無いときはELSE 1）、<code>categoryCount</code>（カウント0なら COALESCE で1）は積によって同じグループ線の複雑さを吸収する狙いであり、実数除算となる。</td></tr></tbody></table></div>
   244	<hr>
   245	<h2 id="価格帯とサプライ振り分けの判定順序">価格帯とサプライ振り分けの判定順序</h2>
   246	<div class="table-wrap"><table><thead><tr><th>順序</th><th>判定</th><th>結果</th></tr></thead><tbody><tr><td>1</td><td>クエリ側で <code>CASE WHEN price &lt; price1 THEN 1 ELSE 0</code>、<code>CASE WHEN price &lt; price2 THEN 1 ELSE 0</code> とし、両者をともにSELECTに載せる。</td><td><code>class1</code>・<code>class2</code></td></tr><tr><td>2</td><td>サーバ側のマップ <code>class:[0⇒high/middle][1⇒low]</code> とし、<code>[class1][class2]</code> で <code>low</code>・<code>middle</code>・<code>high</code> のいずれかを選ぶ。</td><td><code>[1][1]→low</code>、<code>[0][1]→middle</code>、<code>[0][0]→high</code>。組み <code>[1][0]</code> はマップ未定義となる。論理的には単価が「閾値2以上かつ閾値1未満」となるが、運用上閾値1≤閾値2でないときに現れうる。</td></tr><tr><td>3</td><td>ステップ2より前に、最小カテゴリがグッズ定数または予約グッズ定数に一致しないかだけを見て、サプライ帯への強制があるかを決める。</td><td>強制側ならステップ2のマップを読まず <code>goods</code>。</td></tr></tbody></table></div>
   247	<p>画面上の文言は Twig が <code>thresholdPrice1</code>・<code>thresholdPrice2</code>（コントローラの単独読み込み結果、欠落時0）から「○○円未満」「○○〜△△」「△△円以上」系のキーを組み立てる。</p>
   248	<hr>
   249	<h2 id="業務ルール・計算">業務ルール・計算</h2>
   250	<div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>単価の参照ソース</td><td>Twig の価格列はクエリ結果 <code>price02</code> が <code>price</code> エイリアスで載った値を出力する実装であり、画面上の並びクエリ側の CASE が参照する閾値比較 <code>oi.price</code> と一致することをソース上は狙っている。</td></tr><tr><td>商品名の略称削除</td><td><code>[storageCode と一致する収納略称]</code> が商品名にあるときその括弧を削る。無いとき <code>[ … ]</code> 最初一致を総取り削除。続けて <code>【languageCode/conditionCode】</code> を完全一致削除。</td></tr><tr><td>色／レラ列の抽出優先順</td><td>文末パターン、括弧直前パターン、語間空白パターン、旧角括弧直前パターンの順に最初のヒットのみ採用し、ヒットぶんだけ商品名からも削除する（いずれも未ヒット時は後続へ）。パターン内の許容色名・末尾レター群はソース定義の列挙に従う。</td></tr><tr><td>言語状態列の表示</td><td>Twig は通常帯で <code>(箔ならば文字列「Foil」) + languageCode + "/" + conditionCode</code>。箔はDoctrine結果の箔フラグ列（並び順用traitが可視化）をそのまま真偽値として評価する。サプライ帯のみ翻訳キー「サプライ品」を固定文言で載せる。</td></tr><tr><td><code>quantitySubtotal</code> の画面上の強調</td><td><code>!= 1</code> のときのみ数量セルを太字スタイルにする（整数桁ゼロの桁区切り表示）。</td></tr></tbody></table></div>
   251	<p>本機能には永続化する入力フォームが無いため「### 入力項目」は置かない。</p>
   252	<h3 id="画面上の一覧列とデータ対応-低・中・高">画面上の一覧列とデータ対応（低・中・高）</h3>
   253	<div class="table-wrap"><table><thead><tr><th>列見出し（Twig側のキー運用あり）</th><th>内容</th></tr></thead><tbody><tr><td>No</td><td>当該ブロック内のループ通し番号。</td></tr><tr><td>棚番号</td><td><code>shelfNumberName</code>。</td></tr><tr><td>言語／状態</td><td><code>Foil</code> 連結含むコード連結またはサプライ固定。</td></tr><tr><td>略称エキスパンション名列</td><td><code>cardsetName</code>（実体はクエリ側 <code>storageCode</code>）。</td></tr><tr><td>色／レラ</td><td><code>abbreviationColorRarity</code>。</td></tr><tr><td>数</td><td><code>quantitySubtotal</code> を整数桁区切り。</td></tr><tr><td>商品名</td><td>解体後の <code>product_name</code>。</td></tr><tr><td>価格</td><td>クエリ <code>price</code>。</td></tr><tr><td>備考</td><td>Twig上は空div。</td></tr></tbody></table></div>
   254	<p>サプライ帯ブロックでは言語状態列だけ固定文言、その他解体列や略称セルが空となる実装がある。</p>
   255	<hr>
   256	<h2 id="データ整合性">データ整合性</h2>
   257	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>読み取りと表示</td><td>クエリ送信時点の注文明細とマスタ状態を読む。編集画面の受注表の並びと一致する保証は本機能では論じない。</td></tr><tr><td>永続変更</td><td>本ルートの応答処理は受注明細や出荷指示、在庫を更新しない。</td></tr><tr><td>再印刷のゆらぎ</td><td><code>mtb_option</code> の閾値や商品カテゴリ変更後は、同一スタンバイでもブロック構成や並びが変わりうる。</td></tr></tbody></table></div>
   258	<hr>
   259	<h2 id="API-バッチ結果">API/バッチ結果</h2>
   260	<p>本機能では外部公開APIおよびバッチ起動は行わない。</p>

exec
/bin/bash -lc "sed -n '1,240p' /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-21_admin_order_order_shipping_standby_picking_list_print.json" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
{
  "functionId": "m05-21_admin_order_order_shipping_standby_picking_list_print",
  "title": "m05-21_admin_order_order_shipping_standby_picking_list_print（管理画面_受注管理_ピッキングリスト印刷）",
  "domain": "m05",
  "kind": "admin",
  "designHtml": "function_spec_html_preview/pf-eccube3/m05-21_admin_order_order_shipping_standby_picking_list_print.html",
  "findings": [
    {
      "dimension": "② 業務ルール・計算",
      "severity": "high",
      "designRef": "function_spec_html_preview/pf-eccube3/m05-21_admin_order_order_shipping_standby_picking_list_print.html:246",
      "designQuote": "ステップ2より前に、最小カテゴリがグッズ定数または予約グッズ定数に一致しないかだけを見て、サプライ帯への強制があるかを決める。…強制側ならステップ2のマップを読まず goods。",
      "implRef": "src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:343",
      "difference": "設計(pf-eccube3を確認値とする処理フロー)は『最小カテゴリ MIN(ct.category_id) がグッズ定数(Category::GOODS_ID)/予約グッズ定数(Category::RESERVED_GOODS_ID)に一致するか』でサプライ(goods)帯への強制を決める。実装(ec-cube-enterprise)はカテゴリ定数を一切使わず、productClassRepository.getSubInfosByProductClassIds([productClassId]) の返却有無($hasSubInfo)で分岐している(348行 if($hasSubInfo)、非該当は375行 $c='goods')。getSubInfosByProductClassIds は ProductClass→Language/CardCondition, Product→CardDetail の INNER JOIN(ProductClassRepository.php:3042-3067)で行が取れるか＝カード明細を持つ規格かどうかを判定する仕組みで、カテゴリ定数比較とは判定基準が別物。クエリでは categoryId(MIN(ct.category_id)) を SELECT(DtbShippingStandbyRepository.php:168)しているがループ内で未使用。この結果、goods帯に落ちる明細・価格帯(low/middle/high)分類とその合計点数が設計と食い違いうる。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "実装: ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:343-376 (343行 getSubInfosByProductClassIds、345行 $hasSubInfo、348行 if($hasSubInfo)…373行 $c=$class[class1][class2]、374-376行 else $c='goods')。getSubInfos定義: ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:3042-3067 (Language/CardCondition/CardDetailをINNER JOIN)。categoryId未使用のSELECT: ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:168。設計(正)の裏付け=現行 pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Order/ShippingStandbyController.php:250 が『intval($item[categoryId]) !== Category::GOODS_ID && !== Category::RESERVED_GOODS_ID』でカテゴリ定数比較→else goods。判定基準が別物であることを両リポで確認。implRef行番号(343)は正しい。"
    },
    {
      "dimension": "④ DBカラム・DB操作 / ⑦ エラー処理",
      "severity": "low",
      "designRef": "function_spec_html_preview/pf-eccube3/m05-21_admin_order_order_shipping_standby_picking_list_print.html:240",
      "designQuote": "このクエリでは mtb_option へ findBy(['option_key' => ['order_list_threshold_price_1','order_list_threshold_price_2'], …]) 相当で複数行を一度に読み、その返却順の最初の行値を :price1、2番目を :price2 に結びつける。",
      "implRef": "src/Eccube/Repository/DtbShippingStandbyRepository.php:143",
      "difference": "設計(pf-eccube3を確認値とする)はクエリ側の閾値取得を『両キーを findByOptionKey で一括取得し返却順の[0]を:price1/[1]を:price2に結ぶ』とし、これに起因する取得順の食い違い・添字[0]/[1]参照による実行時異常(html:277)を論点とする。実装(ec-cube-enterprise)の generatePickingList は各キーを個別に findOneBy(['option_key'=>ORDER_LIST_THRESHOLD_PRICE_1]) / (…PRICE_2) で読み、null時は0にフォールバックして $thresholdPrice1/$thresholdPrice2 を作り :price1/:price2 に setParameter(214-215行)している。よって設計が挙げる『返却順による取り違え』も『[0]/[1]未定義添字クラッシュ』も実装では発生せず、取得ロジック自体が設計(現行)と異なる。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "実装: ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:143-151 (キー別 findOneBy + null→0 フォールバック)、:price1/:price2 のsetParameterは214-215行。設計(正)の裏付け=現行 pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbShippingStandbyRepository.php:149-153 が findByOptionKey([PRICE_1,PRICE_2]) 一括取得、194-195行で $thresholdPrices[0]/[1]->getOptionValue() を :price1/:price2 に束ねる=[0]/[1]添字依存。両リポで取得ロジックの相違を確認。implRef行番号(143)・designRef行番号(240)とも正しい。"
    }
  ]
}

exec
/bin/bash -lc 'rg -n "picking|Picking|発送準備|出荷待ち|shipping_standby|standby|ピッキング" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /home/y-saito/Developments/ec-cube-enterprise/app 2>/dev/null' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 115ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:861:                                            <div class="col">{{ Order.picking_date ? Order.picking_date|date_sec : '' }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:862:                                            {% if Order.picking_date %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:863:                                                <div class="col"><button type="button" class="btn btn-ec-regular clear-date" data-target="picking_date">クリア</button></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:62:        $pickingStatus = $this->orderStatusRepository->find(OrderStatus::PICKING);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:70:        if (!$pickingStatus) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:90:                    $Order->setOrderStatus($pickingStatus);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:96:                        $Order->setPickingDate(new \DateTime());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:287:                                <div class="col-3"><span>{{ 'admin.setting.shop.shop.picking_list_threshold'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:289:                                    {{ form_widget(form.picking_list_threshold) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:290:                                    {{ form_errors(form.picking_list_threshold) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:562:                                    {{ form_widget(form.is_shipping_standby_list_exclusion) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:563:                                    {{ form_errors(form.is_shipping_standby_list_exclusion) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdateStackListAction.php:51:                if ($orderParams['update_status_picking']) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:45:                      action="{{ path('admin_order_generate_standby_list') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:53:                                            {{ 'admin.order.shipping_standby_generate_list'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:101:                                                    {{ 'admin.order.shipping_standby_generate_list'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:119:                                        {{ 'admin.order.shipping_standby_search'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:123:                                    action="{{ path('admin_shipping_standby', { page_no: 1 }) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:128:                                                <label for="{{ searchForm.standby_id.vars.id }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:129:                                                    class="form-label">{{ searchForm.standby_id.vars.label }}{{ 'admin.order.shipping_standby_no'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:130:                                                {{ form_widget(searchForm.standby_id) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:196:                        {{ 'admin.order.shipping_standby_search_multi'|trans }}<i class="fa fa-angle-right ms-1" aria-hidden="true"></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:217:                                                        value="{{ path('admin_shipping_standby_page', {'page_no': 1, 'page_count': pageMax.name}) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:232:                                                                <th id="result_list_main__header_id">{{ 'admin.order.shipping_standby_no'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:233:                                                                <th id="result_list_main__header_type">{{ 'admin.order.shipping_standby_order_type'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:234:                                                                <th id="result_list_main__header_count">{{ 'admin.order.shipping_standby_order_count'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:244:                                                                    <a href="{{ path('admin_shipping_standby_edit', {'id': StandbyList.id }) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:262:                                                                                <li><a class="dropdown-item" href="{{ path('admin_shipping_standby_edit', { 'id':StandbyList.id }) }}">{{ 'admin.common.edit'|trans }}</a></li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:263:                                                                                <li><a class="dropdown-item" href="{{ path('admin_shipping_standby_delete', { 'id':StandbyList.id }) }}" {{ csrf_token_for_anchor() }} data-method="delete">{{ 'admin.common.delete'|trans }}</a></li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:269:                                                                <div class="modal fade" id="admin_shipping_standby_delete" tabindex="-1" role="dialog" aria-labelledby="discontinuance" aria-hidden="true" data-bs-keyboard="false" data-bs-backdrop="static">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:302:                                            {% include "@admin/pager.twig" with { 'pages' : pagination.paginationData, 'routes' : 'admin_shipping_standby' } %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:2:{% set menus = ['order', 'shipping_standby'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:4:{% block sub_title %}{{ 'admin.order.shipping_standby_export'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:11:            // ピッキングリスト印刷
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:12:            $('#printPickingList').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:14:                $('#form_bulk').attr('action', "{{ url('admin_shipping_standby_print_picking_list', { 'id' : shippingStandby.id }) }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:23:                $('#form_bulk').attr('action', "{{ url('admin_shipping_standby_print_delivery_slips' ,{'id' : shippingStandby.id, 'lang' : 'ja' }) }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:31:                $('#form_bulk').attr('action', "{{ url('admin_shipping_standby_print_delivery_slips' ,{'id' : shippingStandby.id, 'lang' : 'en' }) }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:72:                            <form method='POST' action='{{ path('admin_shipping_standby_update', {'id': shippingStandby.id}) }}'>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:77:                                            <p id="number_info_box__standby_id">{{ 'admin.order.shipping_standby_no'|trans }}：{{ shippingStandby.id }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:97:                                            <a href="{{ path('admin_shipping_standby_delete', { 'id': shippingStandby.id }) }}" class="btn btn-danger w-100" {{ csrf_token_for_anchor() }} data-method="delete">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:98:                                                {{ 'admin.order.shipping_standby_delete'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:117:                                                    <button type="button" id="printPickingList" class="btn btn-primary btn-sm edit">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:118:                                                        {{ 'admin.order.shipping_standby_list_print'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:146:                                                                <th id="result_list_main__header_payment_total">{{ 'admin.order.shipping_standby_order_payment_total'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:147:                                                                <th id="result_list_main__header_total_count">{{ 'admin.order.shipping_standby_order_quantity'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:148:                                                                <th id="result_list_main__header_order_date">{{ 'admin.order.shipping_standby_order_date'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:6:    <title>ピッキングリスト</title>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:7:    <link rel="stylesheet" type="text/css" href="{{ asset('assets/css/pickinglist.css', 'admin') }}"/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:27:        {% if pickingList.low.items|length > 0 %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:30:        {% for pickingItem in pickingList.low.items %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:34:                {{'admin.picking_item_list.title_per_item'|trans }}{{ thresholdPrice1 }}{{'admin.picking_item_list.under'|trans }} {{ loop.index // maxPageRows + 1 }}/{{ (pickingList.low.items|length - 1) // maxPageRows + 1 }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:38:                {{'admin.picking_item_list.shipping_standby_id'|trans }}：{{ shippingStandby.id }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:42:                {{'admin.picking_item_list.create_date'|trans }}：{{ shippingStandby.createDate|date('Y/m/d H:i:s') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:48:                    <th class='shelf_number_'>{{'admin.picking_item_list.shelf_number'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:49:                    <th class='language_condition_'>{{'admin.picking_item_list.language_condition'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:50:                    <th class='expansion_sname_'>{{'admin.picking_item_list.expansion_sname'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:51:                    <th class='color_rarity_'>{{'admin.picking_item_list.color_rarity'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:52:                    <th class='qty_'>{{'admin.picking_item_list.qty'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:53:                    <th class='name_'>{{'admin.picking_item_list.item_name'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:54:                    <th class='price_'>{{'admin.picking_item_list.price'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:59:            {% if (currentCondition != '') and (currentCondition != pickingItem.conditionCode) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:62:            {% if (currentLanguage != '') and (currentLanguage != pickingItem.languageCode) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:65:            {% set currentLanguage = pickingItem.languageCode %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:66:            {% set currentCondition = pickingItem.conditionCode %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:69:                    <td class='shelf_number_' style='border-top:{{ borderWidth }}px solid black;'><div class='shelf_number_'>{{ pickingItem.shelfNumberName }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:70:                    <td class='language_condition_' style='border-top:{{ borderWidth }}px solid black;'><div class='language_condition_'>{{ (pickingItem.foilFlg ? 'Foil') ~ (pickingItem.languageCode ?? '') ~ '/' ~ (pickingItem.conditionCode ?? '') }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:71:                    <td class='expansion_sname_' style='border-top:{{ borderWidth }}px solid black;'><div class='expansion_sname_'>{{ pickingItem.cardsetName }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:72:                    <td class='color_rarity_' style='border-top:{{ borderWidth }}px solid black;'><div class='color_rarity_'>{{ pickingItem.abbreviationColorRarity }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:73:                    <td class='qty_' style='border-top:{{ borderWidth }}px solid black;'><div class='qty_'{% if pickingItem.quantitySubtotal != 1 %} style='font-weight:bold;'{% endif %}>{{ pickingItem.quantitySubtotal|number_format(0) }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:74:                    <td class='name_' style='border-top:{{ borderWidth }}px solid black;'><div class='name_'>{{ pickingItem.product_name }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:75:                    <td class='price_' style='border-top:{{ borderWidth }}px solid black;'><div class='price_'>{{ pickingItem.price|number_format(0) }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:101:                <td class='name_'><div class='name_'>{{'admin.picking_item_list.all'|trans }}{{ pickingList.low.total_quantity }} {{'admin.picking_item_list.count'|trans }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:113:        {% if pickingList.middle.items|length > 0 %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:116:        {% for pickingItem in pickingList.middle.items %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:120:                {{'admin.picking_item_list.title_per_item'|trans }}{{ thresholdPrice1 }}{{'admin.picking_item_list.andover'|trans }}{{ thresholdPrice2 }}{{'admin.picking_item_list.under'|trans }} {{ loop.index // maxPageRows + 1 }}/{{ (pickingList.middle.items|length - 1) // maxPageRows + 1 }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:124:                {{'admin.picking_item_list.shipping_standby_id'|trans }}：{{ shippingStandby.id }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:128:                {{'admin.picking_item_list.create_date'|trans }}：{{ shippingStandby.createDate|date('Y/m/d H:i:s') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:134:                    <th class='shelf_number_'>{{'admin.picking_item_list.shelf_number'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:135:                    <th class='language_condition_'>{{'admin.picking_item_list.language_condition'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:136:                    <th class='expansion_sname_'>{{'admin.picking_item_list.expansion_sname'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:137:                    <th class='color_rarity_'>{{'admin.picking_item_list.color_rarity'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:138:                    <th class='qty_'>{{'admin.picking_item_list.qty'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:139:                    <th class='name_'>{{'admin.picking_item_list.item_name'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:140:                    <th class='price_'>{{'admin.picking_item_list.price'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:145:            {% if (currentCondition != '') and (currentCondition != pickingItem.conditionCode) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:148:            {% if (currentLanguage != '') and (currentLanguage != pickingItem.languageCode) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:151:            {% set currentLanguage = pickingItem.languageCode %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:152:            {% set currentCondition = pickingItem.conditionCode %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:155:                    <td class='shelf_number_' style='border-top:{{ borderWidth }}px solid black;'><div class='shelf_number_'>{{ pickingItem.shelfNumberName }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:156:                    <td class='language_condition_' style='border-top:{{ borderWidth }}px solid black;'><div class='language_condition_'>{{ (pickingItem.foilFlg ? 'Foil') ~ (pickingItem.languageCode ?? '') ~ '/' ~ (pickingItem.conditionCode ?? '') }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:157:                    <td class='expansion_sname_' style='border-top:{{ borderWidth }}px solid black;'><div class='expansion_sname_'>{{ pickingItem.cardsetName }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:158:                    <td class='color_rarity_' style='border-top:{{ borderWidth }}px solid black;'><div class='color_rarity_'>{{ pickingItem.abbreviationColorRarity }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:159:                    <td class='qty_' style='border-top:{{ borderWidth }}px solid black;'><div class='qty_'{% if pickingItem.quantitySubtotal != 1 %} style='font-weight:bold;'{% endif %}>{{ pickingItem.quantitySubtotal|number_format(0) }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:160:                    <td class='name_' style='border-top:{{ borderWidth }}px solid black;'><div class='name_'>{{ pickingItem.product_name }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:161:                    <td class='price_' style='border-top:{{ borderWidth }}px solid black;'><div class='price_'>{{ pickingItem.price|number_format(0) }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:187:                <td class='name_'><div class='name_'>{{'admin.picking_item_list.all'|trans }}{{ pickingList.middle.total_quantity }} {{'admin.picking_item_list.count'|trans }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:199:        {% if pickingList.high.items|length > 0 %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:202:        {% for pickingItem in pickingList.high.items %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:206:                {{'admin.picking_item_list.title_per_item'|trans }}{{ thresholdPrice2 }}{{'admin.picking_item_list.over'|trans }} {{ loop.index // maxPageRows + 1 }}/{{ (pickingList.high.items|length - 1) // maxPageRows + 1 }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:210:                {{'admin.picking_item_list.shipping_standby_id'|trans }}：{{ shippingStandby.id }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:214:                {{'admin.picking_item_list.create_date'|trans }}：{{ shippingStandby.createDate|date('Y/m/d H:i:s') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:220:                    <th class='shelf_number_'>{{'admin.picking_item_list.shelf_number'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:221:                    <th class='language_condition_'>{{'admin.picking_item_list.language_condition'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:222:                    <th class='expansion_sname_'>{{'admin.picking_item_list.expansion_sname'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:223:                    <th class='color_rarity_'>{{'admin.picking_item_list.color_rarity'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:224:                    <th class='qty_'>{{'admin.picking_item_list.qty'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:225:                    <th class='name_'>{{'admin.picking_item_list.item_name'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:226:                    <th class='price_'>{{'admin.picking_item_list.price'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:231:            {% if (currentCondition != '') and (currentCondition != pickingItem.conditionCode) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:234:            {% if (currentLanguage != '') and (currentLanguage != pickingItem.languageCode) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:237:            {% set currentLanguage = pickingItem.languageCode %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:238:            {% set currentCondition = pickingItem.conditionCode %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:241:                    <td class='shelf_number_' style='border-top:{{ borderWidth }}px solid black;'><div class='shelf_number_'>{{ pickingItem.shelfNumberName }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:242:                    <td class='language_condition_' style='border-top:{{ borderWidth }}px solid black;'><div class='language_condition_'>{{ (pickingItem.foilFlg ? 'Foil') ~ (pickingItem.languageCode ?? '') ~ '/' ~ (pickingItem.conditionCode ?? '') }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:243:                    <td class='expansion_sname_' style='border-top:{{ borderWidth }}px solid black;'><div class='expansion_sname_'>{{ pickingItem.cardsetName }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:244:                    <td class='color_rarity_' style='border-top:{{ borderWidth }}px solid black;'><div class='color_rarity_'>{{ pickingItem.abbreviationColorRarity }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:245:                    <td class='qty_' style='border-top:{{ borderWidth }}px solid black;'><div class='qty_'{% if pickingItem.quantitySubtotal != 1 %} style='font-weight:bold;'{% endif %}>{{ pickingItem.quantitySubtotal|number_format(0) }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:246:                    <td class='name_' style='border-top:{{ borderWidth }}px solid black;'><div class='name_'>{{ pickingItem.product_name }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:247:                    <td class='price_' style='border-top:{{ borderWidth }}px solid black;'><div class='price_'>{{ pickingItem.price|number_format(0) }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:273:                    <td class='name_'><div class='name_'>{{'admin.picking_item_list.all'|trans }}{{ pickingList.high.total_quantity }} {{'admin.picking_item_list.count'|trans }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:285:        {% if pickingList.goods.items|length > 0 %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:286:        {% for pickingItem in pickingList.goods.items %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:290:                {{'admin.picking_item_list.title_per_supply'|trans }}{{ loop.index // maxPageRows + 1 }}/{{ (pickingList.goods.items|length - 1) // maxPageRows + 1 }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:294:                {{'admin.picking_item_list.shipping_standby_id'|trans }}：{{ shippingStandby.id }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:298:                {{'admin.picking_item_list.create_date'|trans }}：{{ shippingStandby.createDate|date('Y/m/d H:i:s') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:304:                    <th class='shelf_number_'>{{'admin.picking_item_list.shelf_number'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:305:                    <th class='language_condition_'>{{'admin.picking_item_list.language_condition'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:306:                    <th class='expansion_sname_'>{{'admin.picking_item_list.expansion_sname'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:307:                    <th class='color_rarity_'>{{'admin.picking_item_list.color_rarity'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:308:                    <th class='qty_'>{{'admin.picking_item_list.qty'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:309:                    <th class='name_'>{{'admin.picking_item_list.item_name'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:310:                    <th class='price_'>{{'admin.picking_item_list.price'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:316:                    <td class='shelf_number_'><div class='shelf_number_'>{{ pickingItem.shelfNumberName }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:317:                    <td class='language_condition_'><div class='language_condition_'>{{'admin.picking_item_list.supply'|trans }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:320:                    <td class='qty_'><div class='qty_'{% if pickingItem.quantitySubtotal != 1 %} style='font-weight:bold;'{% endif %}>{{ pickingItem.quantitySubtotal|number_format(0) }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:321:                    <td class='name_'><div class='name_'>{{ pickingItem.product_name }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:322:                    <td class='price_'><div class='price_'>{{ pickingItem.price|number_format(0) }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:348:                    <td class='name_'><div class='name_'>{{'admin.picking_item_list.all'|trans }}{{ pickingList.goods.total_quantity }} {{'admin.picking_item_list.count'|trans }}</div></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:65:                'pickingType' => 'ピッキング区分', // 店舗ごとの閾値（ネット買取管理の場合は本店しかないため本店の閾値）とサプライを出力 ●●円未満、●●円以上▲▲円未満、■■円以上、サプライ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:27:    /** 棚戻しリスト SQL の pickingTypeSort: サプライ品 */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:30:    /** 棚戻しリスト SQL の pickingTypeSort: 基準価格 null */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:68:            $pickingTypeSort = $this->resolvePickingTypeSort($rawRow);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:71:            if (!isset($buckets[$pickingTypeSort])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:72:                $buckets[$pickingTypeSort] = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:74:                        $pickingTypeSort,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:84:            $buckets[$pickingTypeSort]['items'][] = $this->toPickingItem($rawRow, $formatted);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:85:            $buckets[$pickingTypeSort]['total_quantity'] += $quantity;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:90:        // getBuyOrderRestockListCsvExportData の ORDER BY pickingTypeSort と同じ挿入順
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:107:     * ピッキングリスト1行分のデータを組み立てる
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:115:    private function toPickingItem(array $rawRow, array $formatted): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:133:    private function resolvePickingTypeSort(array $rawRow): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:139:        return (int) $rawRow['pickingTypeSort'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:147:    private function buildSectionTitleBase(int $pickingTypeSort, bool $isSupply, array $sortedThresholds): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:151:            return $this->translator->trans('admin.picking_item_list.title_per_supply');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:155:        if ($pickingTypeSort === self::PICKING_TYPE_SORT_NULL_STANDARD_PRICE) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:159:                $this->translator->trans('admin.picking_item_list.title_per_item'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:163:        $prefix = $this->translator->trans('admin.picking_item_list.title_per_item');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:170:        // Repository の pickingTypeSort は「超えた閾値の数 + 1」。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:172:        if ($pickingTypeSort === 1) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:174:            return $prefix.number_format($sortedThresholds[0]).$this->translator->trans('admin.picking_item_list.under');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:177:        if ($pickingTypeSort >= $thresholdCount + 1) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:179:            return $prefix.number_format($sortedThresholds[$thresholdCount - 1]).$this->translator->trans('admin.picking_item_list.over');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:183:        $low = $sortedThresholds[$pickingTypeSort - 2];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:184:        $high = $sortedThresholds[$pickingTypeSort - 1];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:188:            .$this->translator->trans('admin.picking_item_list.andover')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListPdfSectionBuilder.php:190:            .$this->translator->trans('admin.picking_item_list.under');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListCsvRowFormatter.php:81:            'pickingType' => $this->formatPickingType($isSupply, $standardPrice, $threshold1, $threshold2, $threshold3),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListCsvRowFormatter.php:99:    private function formatPickingType(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListCsvRowFormatter.php:154:     * 受注管理ピッキングリストと同様のロジック（ShippingStandbyController参照）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php:34:        'pickingType' => 'ピッキング区分',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:33:        'pickingType' => 'ピッキング区分',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:62:     * @method \DateTime|null getPickingDate()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:63:     * @method Order setPickingDate(?\DateTime $picking_date)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:675:        #[ORM\Column(name: 'picking_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => 'ピック開始日'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:676:        private ?\DateTime $picking_date = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1864:        public function getPickingDate(): ?\DateTime
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1866:            return $this->picking_date;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1869:        public function setPickingDate(?\DateTime $picking_date): Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1871:            $this->picking_date = $picking_date;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:1208:        #[ORM\Column(name: 'picking_list_threshold', type: Types::INTEGER, nullable: true, options: ['unsigned' => true, 'comment' => 'ピッキングリスト分割閾値'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:1209:        private ?int $picking_list_threshold = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:1211:        public function getPickingListThreshold(): ?int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:1213:            return $this->picking_list_threshold;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:1216:        public function setPickingListThreshold(?int $picking_list_threshold): BaseInfo
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:1218:            $this->picking_list_threshold = $picking_list_threshold;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Pdf/Exporter/StockMoveTransferListPdfFormatter.php:123:     * pickingType を閾値ラベルとしてグループ化し、各グループを印刷ページへ分割する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Pdf/Exporter/StockMoveTransferListPdfFormatter.php:132:        // pickingType を閾値ラベルとしてグループ化する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Pdf/Exporter/StockMoveTransferListPdfFormatter.php:135:            $thresholdLabel = (string) ($formattedRow['pickingType'] ?? '');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Pdf/Exporter/StockMoveTransferListPdfFormatter.php:183:                ] + array_diff_key($formattedRow, ['pickingType' => true]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:25:#[ORM\Table(name: 'dtb_shipping_standby')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:54:    #[ORM\JoinTable(name: 'dtb_order_shipping_standby')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:55:    #[ORM\JoinColumn(name: 'standby_id', referencedColumnName: 'id')]
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:3566:	 (44859,24,1,3,163,10,1,NULL,'','It''s important to always have the right tool for the job. This one is for picking my teeth.','無色の1/1の霊気装置(Servo)アーティファクト・クリーチャー・トークンを３体生成する。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:6946:	 (47492,18175,1,1,152,52,1,NULL,'','"When I was a child, we worried about picking the wrong mushrooms for the cook pot. Now we must worry about being picked ourselves."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:27824:	 (56319,8859,1,1,68,276,1,NULL,'「ゴールドメドウでいい一日だって言えるのは、夜中かけて背中に刺さった羽根を抜かなくてもいい日だろうな。」――― キスキンの農夫、カリッド.','"A good day in Goldmeadow is one in which I don''t spend all evening picking quills out of my backside."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:47145:	 (64976,24,1,3,163,10,2,NULL,'','It''s important to always have the right tool for the job. This one is for picking my teeth.','無色の1/1の霊気装置(Servo)アーティファクト・クリーチャー・トークンを３体生成する。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:69459:	 (77724,25537,1,2,221,88,1,NULL,'日課の勤めを果たす代わりに、ヘリオッドの侍祭たちはその日、昼までかかって祭壇に張り付いた海藻を取り除いた。','Instead of performing their daily devotions, Heliod''s acolytes spent the morning picking strands of kelp off the altar.','クリーチャーやエンチャント合わせて最大３つを対象とし、それらをオーナーの手札に戻す。','Return up to three target creatures and/or enchantments to their owners'' hands.','','','63',0,false,0,'2020-01-13 00:40:18+09','2025-07-31 21:53:49+09'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2629:admin.order.shipping_standby_export: 出荷指示リストエクスポート
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2630:admin.order.shipping_standby_no: 出荷指示番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2631:admin.order.shipping_standby_generate_list: 生成
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2632:admin.order.shipping_standby_search: 出荷指示リスト検索
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2633:admin.order.shipping_standby_search_multi: 検索する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2634:admin.order.shipping_standby_search_result: 検索結果
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2635:admin.order.shipping_standby_search_result_count: 件が該当しました
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2636:admin.order.shipping_standby_order_type: 区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2637:admin.order.shipping_standby_order_count: 注文件数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2638:admin.order.shipping_standby_delete: リスト削除
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2639:admin.order.shipping_standby_list_print: ピッキングリスト印刷
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2640:admin.order.shipping_standby_order_payment_total: 購入金額(円)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2641:admin.order.shipping_standby_order_quantity: 合計点数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2642:admin.order.shipping_standby_order_date: 受注日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2644:# ピッキングリスト
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2645:admin.picking_item_list.title_per_item: ピッキングリスト（商品単位_
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2646:admin.picking_item_list.title_per_supply: ピッキングリスト（サプライ）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2647:admin.picking_item_list.under: 円未満）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2648:admin.picking_item_list.andover: 円以上_
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2649:admin.picking_item_list.over: 円以上）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2650:admin.picking_item_list.shipping_standby_id: 出荷指示リスト番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2651:admin.picking_item_list.create_date: 作成日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2652:admin.picking_item_list.number: No
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2653:admin.picking_item_list.shelf_number: 棚番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2654:admin.picking_item_list.language_condition: 言語/状態
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2655:admin.picking_item_list.expansion_sname: 略称
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2656:admin.picking_item_list.color_rarity: 色/R
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2657:admin.picking_item_list.qty: 数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2658:admin.picking_item_list.item_name: 商品名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2659:admin.picking_item_list.price: 価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2660:admin.picking_item_list.remark: 備考
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2661:admin.picking_item_list.all: 全
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2662:admin.picking_item_list.count: 点
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2663:admin.picking_item_list.supply: サプライ品
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2989:admin.setting.shop.shop.picking_list_threshold: ピッキングリスト分割しきい値価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3057:admin.setting.shop.delivery.is_shipping_standby_list_exclusion: 出荷指示リストから除外
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:484:        #[ORM\Column(name: 'is_shipping_standby_list_exclusion', type: Types::BOOLEAN, options: ['default' => false, 'comment' => '出荷指示リスト除外フラグ'])]
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:26605:	 (98702,30149,1,1,266,1368,1,NULL,'「一年前はウォーターディープでスリをしていたなんて、考えられないな。」','"And to think, a year ago I was picking pockets in Waterdeep."','財宝荒らしがプレイヤー１人に戦闘ダメージを与えるたび、宝物・トークン１つを生成する。（それは、「{Tap}, このアーティファクトを生け贄に捧げる：好きな色１色のマナ１点を加える。」を持つアーティファクトである。）','Whenever Hoard Robber deals combat damage to a player, create a Treasure token. (It''s an artifact with "{Tap}, Sacrifice this artifact: Add one mana of any color.")','1','3','110',0,false,0,'2021-07-11 00:01:34+09','2025-07-31 22:01:24+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:28111:	 (99107,30149,1,1,266,1368,1,NULL,'「一年前はウォーターディープでスリをしていたなんて、考えられないな。」','"And to think, a year ago I was picking pockets in Waterdeep."','財宝荒らしがプレイヤー１人に戦闘ダメージを与えるたび、宝物・トークン１つを生成する。（それは、「{Tap}, このアーティファクトを生け贄に捧げる：好きな色１色のマナ１点を加える。」を持つアーティファクトである。）','Whenever Hoard Robber deals combat damage to a player, create a Treasure token. (It''s an artifact with "{Tap}, Sacrifice this artifact: Add one mana of any color.")','1','3','110',1,false,0,'2021-07-13 20:37:27+09','2025-07-31 22:01:24+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:67:	 (24,24,1,3,163,10,1,NULL,'','It''s important to always have the right tool for the job. This one is for picking my teeth.','無色の1/1の霊気装置(Servo)アーティファクト・クリーチャー・トークンを３体生成する。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:27261:	 (11696,8859,1,1,68,276,1,NULL,'「ゴールドメドウでいい一日だって言えるのは、夜中かけて背中に刺さった羽根を抜かなくてもいい日だろうな。」――― キスキンの農夫、カリッド.','"A good day in Goldmeadow is one in which I don''t spend all evening picking quills out of my backside."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:44676:	 (20748,2282,1,1,181,352,1,NULL,'','Picking locks is for beginners.','クリーチャー最大２体を対象とする。このターン、それらはブロックされない。','Up to two target creatures can''t be blocked this turn.','','','58',0,false,0,'2018-07-12 18:34:30+09','2025-07-31 20:38:34+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:48679:	 (43418,21357,1,2,177,849,1,NULL,'','Picking hammers is dangerous, but it''s still safer than harvesting saw bushes.','','Destroy target artifact or enchantment. Assemble a Contraption. (Put the top card of your Contraption deck face up onto one of your sprockets.)','','','109',1,false,0,'2019-03-12 02:54:43+09','2025-07-31 21:46:59+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:48758:	 (24229,18175,1,1,152,52,1,NULL,'','"When I was a child, we worried about picking the wrong mushrooms for the cook pot. Now we must worry about being picked ourselves."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:58629:	 (34163,21357,1,2,177,849,1,NULL,'','Picking hammers is dangerous, but it''s still safer than harvesting saw bushes.','','Destroy target artifact or enchantment. Assemble a Contraption. (Put the top card of your Contraption deck face up onto one of your sprockets.)','','','109',0,false,0,'2018-08-25 00:09:28+09','2025-07-31 21:46:59+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:82915:	 (41606,2282,1,1,181,352,1,NULL,'','Picking locks is for beginners.','クリーチャー最大２体を対象とする。このターン、それらはブロックされない。','Up to two target creatures can''t be blocked this turn.','','','58',1,false,0,'2019-03-12 02:21:23+09','2025-07-31 20:38:34+09'),

codex
候補2件の参照行は存在しています。次に、周辺の実装と設計の後半節を確認して、候補にない重要差分がないかを横断します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php | sed -n '260,410p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba function_spec_html_preview/pf-eccube3/m05-21_admin_order_order_shipping_standby_picking_list_print.html | sed -n '260,360p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 144ms:
   260	
   261	        return !empty($pageNo) ? $this->redirectToRoute('admin_shipping_standby_search', ['page_no' => $pageNo]) : ($this->redirectToRoute('admin_shipping_standby'));
   262	    }
   263	
   264	    /**
   265	     * @return array<string, mixed>
   266	     */
   267	    public function search(Request $request, ?int $patternId = null, int $pageNo = 1): array
   268	    {
   269	        $result = $this->traitSearch($request, $patternId, $pageNo);
   270	        $builder = $this->formFactory->createBuilder(GenerateShippingStandbyType::class);
   271	        $result['generateForm'] = $builder->getForm()->createView();
   272	
   273	        return $result;
   274	    }
   275	
   276	    /**
   277	     * 出荷指示リスト ピッキングリスト印刷
   278	     *
   279	     * @param Request $request
   280	     * @param int $id
   281	     *
   282	     * @return Response
   283	     */
   284	    #[Route(path: '/%eccube_admin_route%/standby/{id}/print/picking', name: 'admin_shipping_standby_print_picking_list', requirements: ['id' => '\d+'], methods: ['GET', 'POST'])]
   285	    public function printPickingList(Request $request, $id)
   286	    {
   287	        $shippingStandby = $this->shippingStandbyRepository->findOneByid($id);
   288	        if ($shippingStandby === null) {
   289	            throw $this->createNotFoundException();
   290	        }
   291	
   292	        $orderIdList = array_keys($request->get('order_ids', []));
   293	
   294	        $pickingItems = $this->shippingStandbyRepository->generatePickingList((int) $id, $orderIdList);
   295	
   296	        $option1 = $this->mtbOptionRepository->findOneBy([
   297	            'option_key' => MtbOption::ORDER_LIST_THRESHOLD_PRICE_1,
   298	        ]);
   299	        $thresholdPrice1 = $option1 !== null ? (int) $option1->getOptionValue() : 0;
   300	
   301	        $option2 = $this->mtbOptionRepository->findOneBy([
   302	            'option_key' => MtbOption::ORDER_LIST_THRESHOLD_PRICE_2,
   303	        ]);
   304	        $thresholdPrice2 = $option2 !== null ? (int) $option2->getOptionValue() : 0;
   305	
   306	        $pickingList = [
   307	            'low' => [
   308	                'total_quantity' => 0,
   309	                'items' => [],
   310	            ],
   311	            'middle' => [
   312	                'total_quantity' => 0,
   313	                'items' => [],
   314	            ],
   315	            'high' => [
   316	                'total_quantity' => 0,
   317	                'items' => [],
   318	            ],
   319	            'goods' => [
   320	                'total_quantity' => 0,
   321	                'items' => [],
   322	            ],
   323	        ];
   324	
   325	        $class = [
   326	            0 => [
   327	                0 => 'high',
   328	                1 => 'middle',
   329	            ],
   330	            1 => [
   331	                1 => 'low',
   332	            ],
   333	        ];
   334	
   335	        foreach ($pickingItems as $item) {
   336	            $polyquantity = (float) ($item['polyquantity'] ?? 0);
   337	            $denominator = (int) ($item['colorCount'] ?? 0) * (int) ($item['categoryCount'] ?? 0);
   338	            $item['quantitySubtotal'] = $denominator > 0 ? $polyquantity / $denominator : 0.0;
   339	            $item['cardsetName'] = $item['storageCode'] ?? '';
   340	            $productName = $item['product_name'];
   341	
   342	            // 商品規格IDから詳細情報を取得
   343	            $subInfos = $this->productClassRepository->getSubInfosByProductClassIds([$item['productClassId']]);
   344	            // 詳細情報が紐づくかでサプライ品かどうかを判定
   345	            $hasSubInfo = count($subInfos) > 0 && isset($subInfos[$item['productClassId']]);
   346	
   347	            // サプライ品でない場合は商品名から略称・言語・状態・色・レアリティを取り除く
   348	            if ($hasSubInfo) {
   349	                if (preg_match('/\['.$item['cardsetName'].'\]/', $productName, $matchedSetName)) {
   350	                    $productName = str_replace($matchedSetName[0], '', $productName);
   351	                } else {
   352	                    // 商品名内に[略称タグ]が含まれない場合は[～]を削除
   353	                    $productName = preg_replace('/\[.+?\]/', '', $productName);
   354	                }
   355	                $productName = str_replace('【'.$item['languageCode'].'/'.$item['conditionCode'].'】', '', $productName);
   356	
   357	                // マッチした各パターンごとに商品名を修正する(色のみの場合は余計なところまで置換する可能性があるため)
   358	                $item['abbreviationColorRarity'] = '';
   359	                if (preg_match(self::COLOR_RARITY_END_PATTERN, $productName, $matchedString)) {
   360	                    $item['abbreviationColorRarity'] = $matchedString[0];
   361	                    $productName = preg_replace(self::COLOR_RARITY_END_PATTERN, '', $productName);
   362	                } elseif (preg_match(self::COLOR_RARITY_BRANCKET_PATTERN, $productName, $matchedString)) {
   363	                    $item['abbreviationColorRarity'] = str_replace('(', '', $matchedString[0]);
   364	                    $productName = preg_replace(self::COLOR_RARITY_BRANCKET_PATTERN, '(', $productName);
   365	                } elseif (preg_match(self::COLOR_RARITY_IN_MIDDLE, $productName, $matchedString)) {
   366	                    $item['abbreviationColorRarity'] = trim($matchedString[0]);
   367	                    $productName = preg_replace(self::COLOR_RARITY_IN_MIDDLE, ' ', $productName);
   368	                } elseif (preg_match(self::COLOR_RARITY_OLD_TOKEN, $productName, $matchedString)) {
   369	                    $item['abbreviationColorRarity'] = str_replace('[', '', $matchedString[0]);
   370	                    $productName = preg_replace(self::COLOR_RARITY_OLD_TOKEN, '[', $productName);
   371	                }
   372	
   373	                $c = $class[$item['class1']][$item['class2']];
   374	            } else {
   375	                $c = 'goods';
   376	            }
   377	
   378	            $item['product_name'] = $productName;
   379	            $pickingList[$c]['items'][] = $item;
   380	            $pickingList[$c]['total_quantity'] += $item['quantitySubtotal'];
   381	        }
   382	
   383	        return $this->render('@admin/ShippingStandby/picking_list.twig', [
   384	            'shippingStandby' => $shippingStandby,
   385	            'pickingList' => $pickingList,
   386	            'thresholdPrice1' => $thresholdPrice1,
   387	            'thresholdPrice2' => $thresholdPrice2,
   388	        ]);
   389	    }
   390	
   391	    /**
   392	     * 出荷指示リスト 納品書印刷
   393	     *
   394	     * @param Request $request
   395	     * @param int $id
   396	     * @param string $lang
   397	     *
   398	     * @return Response
   399	     */
   400	    #[Route(path: '/%eccube_admin_route%/standby/{id}/print/delivery/{lang}', name: 'admin_shipping_standby_print_delivery_slips', requirements: ['id' => '\d+', 'lang' => 'ja|en'], methods: ['GET', 'POST'])]
   401	    public function printDeliverySlips(Request $request, int $id, string $lang): Response
   402	    {
   403	        $ShippingStandby = $this->shippingStandbyRepository->findOneById($id);
   404	        if ($ShippingStandby === null) {
   405	            throw $this->createNotFoundException();
   406	        }
   407	
   408	        $orderIdList = array_keys($request->get('order_ids', []));
   409	
   410	        if ($orderIdList === []) {

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php | sed -n '3030,3075p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php | sed -n '130,230p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 121ms:
   260	<p>本機能では外部公開APIおよびバッチ起動は行わない。</p>
   261	<hr>
   262	<h2 id="入出力">入出力</h2>
   263	<div class="table-wrap"><table><thead><tr><th>種類</th><th>内容</th></tr></thead><tbody><tr><td>入力（HTTP）</td><td>パスのスタンバイID、<code>order_ids</code> をキーにもつチェック状態（およびフロントが付けるがサーバ無視の隠し <code>id=ja</code>）。</td></tr><tr><td>成功時出力</td><td><code>text/html</code>。単独ページでありJSONやCSVではない。</td></tr><tr><td>副作用</td><td>HTTP応答のみでサーバ状態を変えない。</td></tr></tbody></table></div>
   264	<hr>
   265	<h2 id="バリデーション">バリデーション</h2>
   266	<div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>入力全体</td><td>Symfonyフォームオブジェクトでの束ねはなく、チェック状態の集合はブラウザがPOST本文に載せるかだけが実質的な入力検証となる。</td></tr><tr><td>CSRF</td><td>親の一括フォームにトークンフィールドがあるかどうかは親テンプレの設計による。ピッキングのみに特化した明示的検証コードは載せない。</td></tr></tbody></table></div>
   267	<hr>
   268	<h2 id="権限・認可">権限・認可</h2>
   269	<div class="table-wrap"><table><thead><tr><th>利用者状態</th><th>本印刷ルートおよび編集への到達</th></tr></thead><tbody><tr><td>未ログイン</td><td>管理チャネルの共通規則でログイン誘導または拒否となる（設定を確認値とする）。</td></tr><tr><td>ログイン済み管理者アカウント（<code>dtb_member</code>）</td><td>他の出荷指示操作と同一経路として到達しうる。ルート単体の細かなロール名は共通のメンバー権限設計へ委ねる。</td></tr></tbody></table></div>
   270	<hr>
   271	<h2 id="画面遷移">画面遷移</h2>
   272	<div class="table-wrap"><table><thead><tr><th>条件</th><th>遷移先</th></tr></thead><tbody><tr><td>編集ページでピッキング実行</td><td>POSTで別ウィンドウに単体ページ。親は同一URL編集画面のまま。</td></tr><tr><td>無効または存在しないスタンバイ <code>id</code></td><td>404。</td></tr></tbody></table></div>
   273	<h3 id="遷移時に引き継ぐ状態">遷移時に引き継ぐ状態</h3>
   274	<div class="table-wrap"><table><thead><tr><th>起点</th><th>遷移前の処理</th><th>遷移後の初期状態</th></tr></thead><tbody><tr><td>編集から印刷ウィンドウ</td><td>チェック集合をフォーム送信するのみ</td><td>共通ナビ無し単体レイアウト</td></tr></tbody></table></div>
   275	<hr>
   276	<h2 id="エラー処理">エラー処理</h2>
   277	<div class="table-wrap"><table><thead><tr><th>エラー内容</th><th>処理</th></tr></thead><tbody><tr><td>無効または存在しない出荷指示 <code>id</code></td><td>404応答とする実装がある。</td></tr><tr><td><code>mtb_option</code> の閾値行が両方そろわないとき</td><td><code>findBy</code> 結果の添字 <code>$thresholdPrices[0]</code>・<code>[1]</code> 参照により実行時異常になりうる。コントローラ側の単独読みだけでは防げず、両経路とも欠落時0をTwigへ渡せるとは限らない。</td></tr><tr><td><code>[class1][class2]</code> 未定義</td><td>未定義インデックス相当の状態となり実行時異常になりうる。閾値1が閾値2を超えるデータ設定でのみ論理的に出る。</td></tr></tbody></table></div>
   278	<hr>
   279	<h2 id="DBカラム">DBカラム</h2>
   280	<p>本機能は利用者操作で列を書き換えない。参照の主要な論理がある。</p>
   281	<div class="table-wrap"><table><thead><tr><th>テーブル</th><th>列または論理</th><th>メモ</th></tr></thead><tbody><tr><td><code>dtb_shipping_standby</code></td><td>主キー</td><td>URLの <code>{id}</code>。</td></tr><tr><td><code>mtb_option</code></td><td><code>option_key order_list_threshold_price_1</code>、<code>order_list_threshold_price_2</code></td><td>DQL と見出し数値両方へ。取得順問題は本文参照。</td></tr><tr><td>（間接参照）カード詳細・マスタ一式</td><td><code>foil_flg</code> ほか並び順列</td><td>TraitがSELECTとORDERBYに載せる。</td></tr></tbody></table></div>
   282	<h3 id="DB操作">DB操作</h3>
   283	<p>本機能は参照系（検索・出力）であり、DBへの登録・更新・削除は行わない。テーブル名は ec-cube-enterprise を正典とする。</p>
   284	<div class="table-wrap"><table><thead><tr><th>操作種別</th><th>対象テーブル</th><th>契機・条件</th></tr></thead><tbody><tr><td>検索</td><td>dtb_shipping_standby / mtb_option</td><td>検索条件に合致するレコードを抽出する。抽出結果を所定フォーマットでファイル出力する。</td></tr></tbody></table></div>
   285	<hr>
   286	<h2 id="ログ・監査">ログ・監査</h2>
   287	<div class="table-wrap"><table><thead><tr><th>タイミング</th><th>記録内容</th></tr></thead><tbody><tr><td>ピッキング表示成功時に専用の業務ログ</td><td>実装しない。インフラ系アクセスログは環境に従う。</td></tr></tbody></table></div>
   288	<h3 id="ログに出してはいけないもの">ログに出してはいけないもの</h3>
   289	<ul><li>パスワード</li><li>なりすまし対策トークン</li><li>Cookie値</li><li>セッションIDの完全値</li><li>RememberMeトークンの原値</li></ul>
   290	<hr>
   291	<h2 id="試行制限">試行制限</h2>
   292	<p>本機能で回数ガードやレートリミットは実装しない。</p>
   293	<hr>
   294	<h2 id="セッション">セッション</h2>
   295	<p>本機能の印刷POSTが出荷指示検索セッションのキーを更新する処理は持たない。検索状態は親画面側の別ルートが担う。</p>
   296	<h3 id="セッションへ保存しない情報">セッションへ保存しない情報</h3>
   297	<p>変更しうるチェック状態はHTTP本文でのみウィンドウ子へ運ばれる。</p>
   298	<hr>
   299	<h2 id="Cookie">Cookie</h2>
   300	<p>認証済みセッション用Cookieは管理チャネルの共通方針に従う。本機能のみに特化したCookieの読み書きは持たない。</p>
   301	<hr>
   302	<h2 id="排他制御・トランザクション">排他制御・トランザクション</h2>
   303	<p>本機能は一覧取得のみでトランザクション境界による楽観排他オブジェクト更新は載せない。同一注文在庫への同時変更と印刷内容の競合については一覧と異なる状態を読む可能性だけは残るが、明示的ロックはしない。</p>
   304	<hr>
   305	<h2 id="調査補助">調査補助</h2>
   306	<p>実装確認のgrep用パスのみ列挙する。</p>
   307	<ul><li><code>src/Eccube/Controller/Admin/Order/ShippingStandbyController.php</code></li><li><code>src/Eccube/Repository/DtbShippingStandbyRepository.php</code>（関数 <code>generatePickingList</code>）</li><li><code>src/Eccube/Repository/Traits/SortProductTrait.php</code></li><li><code>src/Eccube/Resource/template/admin/ShippingStandby/edit.twig</code></li><li><code>src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig</code></li><li><code>html/template/admin/assets/js/function.js</code>（<code>check-all</code>）</li><li><code>html/template/admin/assets/css/pickinglist.css</code></li></ul>
   308	<h3 id="HTTPルート名とパス-コード探索用・旧入口節より退避">HTTPルート名とパス（コード探索用・旧入口節より退避）</h3>
   309	<ul><li><code>admin_shipping_standby_print_picking_list</code> … <code>GET, POST</code> … <code>/{admin_route}/standby/{id}/print/picking</code>（<code>{id}</code> は出荷指示リストの主キー。リクエストの <code>order_ids</code> から対象注文を絞り込み、ピッキング用単体 Twig を応答する。）</li></ul>
   310	      <footer>このページは機能仕様書Markdownから自動生成されています。編集は元のMarkdownに対して行ってください。</footer>
   311	    </main>
   312	  </div>
   313	</body>
   314	</html>

 succeeded in 107ms:
  3030	
  3031	            return $row;
  3032	        }, $result);
  3033	    }
  3034	
  3035	    /**
  3036	     * 商品規格ID配列から、商品規格IDごとに言語、状態、フォイル情報を取得
  3037	     *
  3038	     * @param array<int, mixed> $productClassIds
  3039	     *
  3040	     * @return array<int, mixed>
  3041	     */
  3042	    public function getSubInfosByProductClassIds(array $productClassIds): array
  3043	    {
  3044	        $qb = $this->createQueryBuilder('pc')
  3045	            ->join('pc.Language', 'l')
  3046	            ->join('pc.CardCondition', 'cc')
  3047	            ->join('pc.Product', 'p')
  3048	            ->join('p.CardDetail', 'cd');
  3049	        $results = $qb->select([
  3050	            'pc.id',
  3051	            'l.code AS languageCode',
  3052	            'l.name_jp AS languageName',
  3053	            'cc.code AS conditionCode',
  3054	            'cd.foil_flg AS foilFlg',
  3055	        ])
  3056	            ->where($qb->expr()->in('pc.id', ':productClassIds'))
  3057	            ->setParameter('productClassIds', $productClassIds)
  3058	            ->getQuery()
  3059	            ->getResult();
  3060	
  3061	        $subInfos = [];
  3062	        foreach ($results as $result) {
  3063	            $subInfos[$result['id']] = $result;
  3064	        }
  3065	
  3066	        return $subInfos;
  3067	    }
  3068	
  3069	    /**
  3070	     * 商品のサイズリストを取得
  3071	     *
  3072	     * @param array<int, mixed> $productClassIdList
  3073	     *
  3074	     * @return int[]
  3075	     */

 succeeded in 102ms:
codex
処理フローとDB取得は候補の内容どおり差分が確認できます。見落とし候補として、画面表示/Twig/フロント挙動が設計と一致しているかも確認します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig | sed -n '1,260p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig | sed -n '1,260p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc 'rg -n "printPickingList|shipping_standby_print_picking|form_bulk|check-all|order_ids|newwin|picking_list" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin /home/y-saito/Developments/ec-cube-enterprise/html/template/admin/assets/js /home/y-saito/Developments/ec-cube-enterprise/html/template/admin/assets/css 2>/dev/null' in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Traits/SortProductTrait.php | sed -n '1,220p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 212ms:
     1	<!DOCTYPE html>
     2	<html>
     3	<head>
     4	    {% set maxPageRows = 30 %}
     5	    <meta charset="UTF-8">
     6	    <title>ピッキングリスト</title>
     7	    <link rel="stylesheet" type="text/css" href="{{ asset('assets/css/pickinglist.css', 'admin') }}"/>
     8	    <script src="{{ asset('assets/js/select2.min.js', 'admin') }}"></script>
     9	    <script nonce="{{ csp_nonce }}">
    10	        document.addEventListener('DOMContentLoaded', function () {
    11	            const btn = document.getElementById('printButton');
    12	            if (btn) {
    13	                btn.addEventListener('click', function () {
    14	                    window.print();
    15	                });
    16	            }
    17	        });
    18	    </script>
    19	</head>
    20	<body>
    21	        <div class="printBox">
    22	            <button id="printButton" style="width: 120px; height: 26px; margin: 3px;">
    23	                {{ 'admin.common.print'|trans }}
    24	            </button>
    25	        </div>
    26	    <div class='ContentsAll'>
    27	        {% if pickingList.low.items|length > 0 %}
    28	        {% set currentLanguage = '' %}
    29	        {% set currentCondition = '' %}
    30	        {% for pickingItem in pickingList.low.items %}
    31	        {% if loop.index % maxPageRows == 1 %}
    32	        <div class='multipage'>
    33	            <div style="text-align: center; font-size: 15pt;">
    34	                {{'admin.picking_item_list.title_per_item'|trans }}{{ thresholdPrice1 }}{{'admin.picking_item_list.under'|trans }} {{ loop.index // maxPageRows + 1 }}/{{ (pickingList.low.items|length - 1) // maxPageRows + 1 }}
    35	            </div>
    36	            <div style="text-align: right;">
    37	            <span style="float: left;">
    38	                {{'admin.picking_item_list.shipping_standby_id'|trans }}：{{ shippingStandby.id }}
    39	            </span>
    40	
    41	            <span style="text-align: right;">
    42	                {{'admin.picking_item_list.create_date'|trans }}：{{ shippingStandby.createDate|date('Y/m/d H:i:s') }}
    43	            </span>
    44	            </div>
    45	            <table>
    46	                <tr class="desc">
    47	                    <th class='no_'>No</th>
    48	                    <th class='shelf_number_'>{{'admin.picking_item_list.shelf_number'|trans }}</th>
    49	                    <th class='language_condition_'>{{'admin.picking_item_list.language_condition'|trans }}</th>
    50	                    <th class='expansion_sname_'>{{'admin.picking_item_list.expansion_sname'|trans }}</th>
    51	                    <th class='color_rarity_'>{{'admin.picking_item_list.color_rarity'|trans }}</th>
    52	                    <th class='qty_'>{{'admin.picking_item_list.qty'|trans }}</th>
    53	                    <th class='name_'>{{'admin.picking_item_list.item_name'|trans }}</th>
    54	                    <th class='price_'>{{'admin.picking_item_list.price'|trans }}</th>
    55	                    <th class='remarks_'>{{'admin.common.note'|trans }}</th>
    56	                </tr>
    57	            {% endif %}
    58	            {% set borderWidth = 0 %}
    59	            {% if (currentCondition != '') and (currentCondition != pickingItem.conditionCode) %}
    60	                {% set borderWidth = 1 %}
    61	            {% endif %}
    62	            {% if (currentLanguage != '') and (currentLanguage != pickingItem.languageCode) %}
    63	                {% set borderWidth = 2 %}
    64	            {% endif %}
    65	            {% set currentLanguage = pickingItem.languageCode %}
    66	            {% set currentCondition = pickingItem.conditionCode %}
    67	                <tr class="data">
    68	                    <td class='no_' style='border-top:{{ borderWidth }}px solid black;'><div class='no_'>{{ loop.index }}</div></td>
    69	                    <td class='shelf_number_' style='border-top:{{ borderWidth }}px solid black;'><div class='shelf_number_'>{{ pickingItem.shelfNumberName }}</div></td>
    70	                    <td class='language_condition_' style='border-top:{{ borderWidth }}px solid black;'><div class='language_condition_'>{{ (pickingItem.foilFlg ? 'Foil') ~ (pickingItem.languageCode ?? '') ~ '/' ~ (pickingItem.conditionCode ?? '') }}</div></td>
    71	                    <td class='expansion_sname_' style='border-top:{{ borderWidth }}px solid black;'><div class='expansion_sname_'>{{ pickingItem.cardsetName }}</div></td>
    72	                    <td class='color_rarity_' style='border-top:{{ borderWidth }}px solid black;'><div class='color_rarity_'>{{ pickingItem.abbreviationColorRarity }}</div></td>
    73	                    <td class='qty_' style='border-top:{{ borderWidth }}px solid black;'><div class='qty_'{% if pickingItem.quantitySubtotal != 1 %} style='font-weight:bold;'{% endif %}>{{ pickingItem.quantitySubtotal|number_format(0) }}</div></td>
    74	                    <td class='name_' style='border-top:{{ borderWidth }}px solid black;'><div class='name_'>{{ pickingItem.product_name }}</div></td>
    75	                    <td class='price_' style='border-top:{{ borderWidth }}px solid black;'><div class='price_'>{{ pickingItem.price|number_format(0) }}</div></td>
    76	                    <td class='remarks_' style='border-top:{{ borderWidth }}px solid black;'><div class='remarks_'></div></td>
    77	                </tr>
    78	            {% if loop.last %}
    79	            {% if loop.index % maxPageRows != 0 %}
    80	            {% for i in (loop.index % maxPageRows) .. maxPageRows %}
    81	                <tr class="data">
    82	                    <td class='no_'><div class='no_'></div></td>
    83	                    <td class='shelf_number_'><div class='shelf_number_'></div></td>
    84	                    <td class='language_condition_'><div class='language_condition_'></div></td>
    85	                    <td class='expansion_sname_'><div class='expansion_sname_'></div></td>
    86	                    <td class='color_rarity_'><div class='color_rarity_'></div></td>
    87	                    <td class='qty_'><div class='qty_'></div></td>
    88	                    <td class='name_'><div class='name_'></div></td>
    89	                    <td class='price_'><div class='price_'></div></td>
    90	                    <td class='remarks_'><div class='remarks_'></div></td>
    91	                </tr>
    92	            {% endfor %}
    93	            {% endif %}
    94	            <tr class="data">
    95	                <td class='no_'><div class='no_'></div></td>
    96	                <td class='shelf_number_'><div class='shelf_number_'></div></td>
    97	                <td class='language_condition_'><div class='language_condition_'></div></td>
    98	                <td class='expansion_sname_'><div class='expansion_sname_'></div></td>
    99	                <td class='color_rarity_'><div class='color_rarity_'></div></td>
   100	                <td class='qty_'><div class='qty_'></div></td>
   101	                <td class='name_'><div class='name_'>{{'admin.picking_item_list.all'|trans }}{{ pickingList.low.total_quantity }} {{'admin.picking_item_list.count'|trans }}</div></td>
   102	                <td class='price_'><div class='price_'></div></td>
   103	                <td class='remarks_'><div class='remarks_'></div></td>
   104	            </tr>
   105	            {% endif %}
   106	            {% if loop.index % maxPageRows == 0 or loop.last %}
   107	            </table>
   108	            </div>
   109	            {% endif %}
   110	        {% endfor %}
   111	        {% endif %}
   112	
   113	        {% if pickingList.middle.items|length > 0 %}
   114	        {% set currentLanguage = '' %}
   115	        {% set currentCondition = '' %}
   116	        {% for pickingItem in pickingList.middle.items %}
   117	        {% if loop.index % maxPageRows == 1 %}
   118	        <div class='multipage'>
   119	            <div style="text-align: center; font-size: 15pt;">
   120	                {{'admin.picking_item_list.title_per_item'|trans }}{{ thresholdPrice1 }}{{'admin.picking_item_list.andover'|trans }}{{ thresholdPrice2 }}{{'admin.picking_item_list.under'|trans }} {{ loop.index // maxPageRows + 1 }}/{{ (pickingList.middle.items|length - 1) // maxPageRows + 1 }}
   121	            </div>
   122	            <div style="text-align: right;">
   123	            <span style="float: left;">
   124	                {{'admin.picking_item_list.shipping_standby_id'|trans }}：{{ shippingStandby.id }}
   125	            </span>
   126	
   127	            <span style="text-align: right;">
   128	                {{'admin.picking_item_list.create_date'|trans }}：{{ shippingStandby.createDate|date('Y/m/d H:i:s') }}
   129	            </span>
   130	            </div>
   131	            <table>
   132	                <tr class="desc">
   133	                    <th class='no_'>No</th>
   134	                    <th class='shelf_number_'>{{'admin.picking_item_list.shelf_number'|trans }}</th>
   135	                    <th class='language_condition_'>{{'admin.picking_item_list.language_condition'|trans }}</th>
   136	                    <th class='expansion_sname_'>{{'admin.picking_item_list.expansion_sname'|trans }}</th>
   137	                    <th class='color_rarity_'>{{'admin.picking_item_list.color_rarity'|trans }}</th>
   138	                    <th class='qty_'>{{'admin.picking_item_list.qty'|trans }}</th>
   139	                    <th class='name_'>{{'admin.picking_item_list.item_name'|trans }}</th>
   140	                    <th class='price_'>{{'admin.picking_item_list.price'|trans }}</th>
   141	                    <th class='remarks_'>{{'admin.common.note'|trans }}</th>
   142	                </tr>
   143	            {% endif %}
   144	            {% set borderWidth = 0 %}
   145	            {% if (currentCondition != '') and (currentCondition != pickingItem.conditionCode) %}
   146	                {% set borderWidth = 1 %}
   147	            {% endif %}
   148	            {% if (currentLanguage != '') and (currentLanguage != pickingItem.languageCode) %}
   149	                {% set borderWidth = 2 %}
   150	            {% endif %}
   151	            {% set currentLanguage = pickingItem.languageCode %}
   152	            {% set currentCondition = pickingItem.conditionCode %}
   153	                <tr class="data">
   154	                    <td class='no_' style='border-top:{{ borderWidth }}px solid black;'><div class='no_'>{{ loop.index }}</div></td>
   155	                    <td class='shelf_number_' style='border-top:{{ borderWidth }}px solid black;'><div class='shelf_number_'>{{ pickingItem.shelfNumberName }}</div></td>
   156	                    <td class='language_condition_' style='border-top:{{ borderWidth }}px solid black;'><div class='language_condition_'>{{ (pickingItem.foilFlg ? 'Foil') ~ (pickingItem.languageCode ?? '') ~ '/' ~ (pickingItem.conditionCode ?? '') }}</div></td>
   157	                    <td class='expansion_sname_' style='border-top:{{ borderWidth }}px solid black;'><div class='expansion_sname_'>{{ pickingItem.cardsetName }}</div></td>
   158	                    <td class='color_rarity_' style='border-top:{{ borderWidth }}px solid black;'><div class='color_rarity_'>{{ pickingItem.abbreviationColorRarity }}</div></td>
   159	                    <td class='qty_' style='border-top:{{ borderWidth }}px solid black;'><div class='qty_'{% if pickingItem.quantitySubtotal != 1 %} style='font-weight:bold;'{% endif %}>{{ pickingItem.quantitySubtotal|number_format(0) }}</div></td>
   160	                    <td class='name_' style='border-top:{{ borderWidth }}px solid black;'><div class='name_'>{{ pickingItem.product_name }}</div></td>
   161	                    <td class='price_' style='border-top:{{ borderWidth }}px solid black;'><div class='price_'>{{ pickingItem.price|number_format(0) }}</div></td>
   162	                    <td class='remarks_' style='border-top:{{ borderWidth }}px solid black;'><div class='remarks_'></div></td>
   163	                </tr>
   164	            {% if loop.last %}
   165	            {% if loop.index % maxPageRows != 0 %}
   166	            {% for i in (loop.index % maxPageRows) .. maxPageRows %}
   167	                <tr class="data">
   168	                    <td class='no_'><div class='no_'></div></td>
   169	                    <td class='shelf_number_'><div class='shelf_number_'></div></td>
   170	                    <td class='language_condition_'><div class='language_condition_'></div></td>
   171	                    <td class='expansion_sname_'><div class='expansion_sname_'></div></td>
   172	                    <td class='color_rarity_'><div class='color_rarity_'></div></td>
   173	                    <td class='qty_'><div class='qty_'></div></td>
   174	                    <td class='name_'><div class='name_'></div></td>
   175	                    <td class='price_'><div class='price_'></div></td>
   176	                    <td class='remarks_'><div class='remarks_'></div></td>
   177	                </tr>
   178	            {% endfor %}
   179	            {% endif %}
   180	            <tr class="data">
   181	                <td class='no_'><div class='no_'></div></td>
   182	                <td class='shelf_number_'><div class='shelf_number_'></div></td>
   183	                <td class='language_condition_'><div class='language_condition_'></div></td>
   184	                <td class='expansion_sname_'><div class='expansion_sname_'></div></td>
   185	                <td class='color_rarity_'><div class='color_rarity_'></div></td>
   186	                <td class='qty_'><div class='qty_'></div></td>
   187	                <td class='name_'><div class='name_'>{{'admin.picking_item_list.all'|trans }}{{ pickingList.middle.total_quantity }} {{'admin.picking_item_list.count'|trans }}</div></td>
   188	                <td class='price_'><div class='price_'></div></td>
   189	                <td class='remarks_'><div class='remarks_'></div></td>
   190	            </tr>
   191	            {% endif %}
   192	            {% if loop.index % maxPageRows == 0 or loop.last %}
   193	            </table>
   194	            </div>
   195	            {% endif %}
   196	        {% endfor %}
   197	        {% endif %}
   198	
   199	        {% if pickingList.high.items|length > 0 %}
   200	        {% set currentLanguage = '' %}
   201	        {% set currentCondition = '' %}
   202	        {% for pickingItem in pickingList.high.items %}
   203	        {% if loop.index % maxPageRows == 1 %}
   204	        <div class='multipage'>
   205	            <div style="text-align: center; font-size: 15pt;">
   206	                {{'admin.picking_item_list.title_per_item'|trans }}{{ thresholdPrice2 }}{{'admin.picking_item_list.over'|trans }} {{ loop.index // maxPageRows + 1 }}/{{ (pickingList.high.items|length - 1) // maxPageRows + 1 }}
   207	            </div>
   208	            <div style="text-align: right;">
   209	            <span style="float: left;">
   210	                {{'admin.picking_item_list.shipping_standby_id'|trans }}：{{ shippingStandby.id }}
   211	            </span>
   212	
   213	            <span style="text-align: right;">
   214	                {{'admin.picking_item_list.create_date'|trans }}：{{ shippingStandby.createDate|date('Y/m/d H:i:s') }}
   215	            </span>
   216	            </div>
   217	            <table>
   218	                <tr class="desc">
   219	                    <th class='no_'>No</th>
   220	                    <th class='shelf_number_'>{{'admin.picking_item_list.shelf_number'|trans }}</th>
   221	                    <th class='language_condition_'>{{'admin.picking_item_list.language_condition'|trans }}</th>
   222	                    <th class='expansion_sname_'>{{'admin.picking_item_list.expansion_sname'|trans }}</th>
   223	                    <th class='color_rarity_'>{{'admin.picking_item_list.color_rarity'|trans }}</th>
   224	                    <th class='qty_'>{{'admin.picking_item_list.qty'|trans }}</th>
   225	                    <th class='name_'>{{'admin.picking_item_list.item_name'|trans }}</th>
   226	                    <th class='price_'>{{'admin.picking_item_list.price'|trans }}</th>
   227	                    <th class='remarks_'>{{'admin.common.note'|trans }}</th>
   228	                </tr>
   229	            {% endif %}
   230	            {% set borderWidth = 0 %}
   231	            {% if (currentCondition != '') and (currentCondition != pickingItem.conditionCode) %}
   232	                {% set borderWidth = 1 %}
   233	            {% endif %}
   234	            {% if (currentLanguage != '') and (currentLanguage != pickingItem.languageCode) %}
   235	                {% set borderWidth = 2 %}
   236	            {% endif %}
   237	            {% set currentLanguage = pickingItem.languageCode %}
   238	            {% set currentCondition = pickingItem.conditionCode %}
   239	                <tr class="data">
   240	                    <td class='no_' style='border-top:{{ borderWidth }}px solid black;'><div class='no_'>{{ loop.index }}</div></td>
   241	                    <td class='shelf_number_' style='border-top:{{ borderWidth }}px solid black;'><div class='shelf_number_'>{{ pickingItem.shelfNumberName }}</div></td>
   242	                    <td class='language_condition_' style='border-top:{{ borderWidth }}px solid black;'><div class='language_condition_'>{{ (pickingItem.foilFlg ? 'Foil') ~ (pickingItem.languageCode ?? '') ~ '/' ~ (pickingItem.conditionCode ?? '') }}</div></td>
   243	                    <td class='expansion_sname_' style='border-top:{{ borderWidth }}px solid black;'><div class='expansion_sname_'>{{ pickingItem.cardsetName }}</div></td>
   244	                    <td class='color_rarity_' style='border-top:{{ borderWidth }}px solid black;'><div class='color_rarity_'>{{ pickingItem.abbreviationColorRarity }}</div></td>
   245	                    <td class='qty_' style='border-top:{{ borderWidth }}px solid black;'><div class='qty_'{% if pickingItem.quantitySubtotal != 1 %} style='font-weight:bold;'{% endif %}>{{ pickingItem.quantitySubtotal|number_format(0) }}</div></td>
   246	                    <td class='name_' style='border-top:{{ borderWidth }}px solid black;'><div class='name_'>{{ pickingItem.product_name }}</div></td>
   247	                    <td class='price_' style='border-top:{{ borderWidth }}px solid black;'><div class='price_'>{{ pickingItem.price|number_format(0) }}</div></td>
   248	                    <td class='remarks_' style='border-top:{{ borderWidth }}px solid black;'><div class='remarks_'></div></td>
   249	                </tr>
   250	            {% if loop.last %}
   251	            {% if loop.index % maxPageRows != 0 %}
   252	            {% for i in (loop.index % maxPageRows) .. maxPageRows %}
   253	                <tr class="data">
   254	                    <td class='no_'><div class='no_'></div></td>
   255	                    <td class='shelf_number_'><div class='shelf_number_'></div></td>
   256	                    <td class='language_condition_'><div class='language_condition_'></div></td>
   257	                    <td class='expansion_sname_'><div class='expansion_sname_'></div></td>
   258	                    <td class='color_rarity_'><div class='color_rarity_'></div></td>
   259	                    <td class='qty_'><div class='qty_'></div></td>
   260	                    <td class='name_'><div class='name_'></div></td>

 succeeded in 212ms:
     1	{% extends '@admin/default_frame.twig' %}
     2	{% set menus = ['order', 'shipping_standby'] %}
     3	{% block title %}{{ 'admin.order.order_management'|trans }}{% endblock %}
     4	{% block sub_title %}{{ 'admin.order.shipping_standby_export'|trans }}{% endblock %}
     5	
     6	{% form_theme form '@admin/Form/bootstrap_4_horizontal_layout.html.twig' %}
     7	
     8	{% block javascript %}
     9	    <script nonce="{{ csp_nonce }}">
    10	        $(function() {
    11	            // ピッキングリスト印刷
    12	            $('#printPickingList').on('click', function(event) {
    13	                window.open('', 'newwin', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=700, height=700');
    14	                $('#form_bulk').attr('action', "{{ url('admin_shipping_standby_print_picking_list', { 'id' : shippingStandby.id }) }}");
    15	                $('#form_bulk').attr('target', 'newwin');
    16	                $('#form_bulk').append($('<input>', { type: 'hidden', name: 'id', value: 'ja' }));
    17	                $('#form_bulk').submit();
    18	                return false;
    19	            });
    20	            // 納品書印刷(日本語)
    21	            $('#printDeliverySlipsJp').on('click', function(event) {
    22	                window.open('', 'newwin', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=700, height=700');
    23	                $('#form_bulk').attr('action', "{{ url('admin_shipping_standby_print_delivery_slips' ,{'id' : shippingStandby.id, 'lang' : 'ja' }) }}");
    24	                $('#form_bulk').attr('target', 'newwin');
    25	                $('#form_bulk').submit();
    26	                return false;
    27	            });
    28	            // 納品書印刷(英語)
    29	            $('#printDeliverySlipsEn').on('click', function(event) {
    30	                window.open('', 'newwin', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=700, height=700');
    31	                $('#form_bulk').attr('action', "{{ url('admin_shipping_standby_print_delivery_slips' ,{'id' : shippingStandby.id, 'lang' : 'en' }) }}");
    32	                $('#form_bulk').attr('target', 'newwin');
    33	                $('#form_bulk').submit();
    34	                return false;
    35	            });
    36	            // 出荷実績入力用CSV出力
    37	            $('#orderExportForInput').on('click', function(event) {
    38	                $('#form_bulk').removeAttr('target');
    39	                $('#form_bulk').attr('action', "{{ url('admin_order_export_for_input') }}");
    40	                $('#form_bulk').submit();
    41	                return false;
    42	            });
    43	            // 送り状CSV出力
    44	            $('#labelsExport').on('click', function(event) {
    45	                $('#form_bulk').removeAttr('target');
    46	                $('#form_bulk').attr('action', "{{ url('admin_labels_export') }}");
    47	                $('#form_bulk input[name="ids[]"]').remove();
    48	                $('#form_bulk input[type="checkbox"][name^="order_ids"]:checked').each(function() {
    49	                    var shippingId = $(this).data('shipping-id');
    50	                    if (shippingId) {
    51	                        $('#form_bulk').append($('<input>', {
    52	                            type: 'hidden',
    53	                            name: 'ids[]',
    54	                            value: shippingId
    55	                        }));
    56	                    }
    57	                });
    58	                $('#form_bulk').submit();
    59	                return false;
    60	            });
    61	        });
    62	    </script>
    63	{% endblock javascript %}
    64	{% block main %}
    65	    {# 更新用フォーム#}
    66	    <div class="c-contentsArea__cols">
    67	        <div class="c-contentsArea__primaryCol">
    68	            <div class="c-primaryCol">
    69	                <div class="row">
    70	                    <div class="col-md-12">
    71	                        <div class="card rounded border shadow-sm mb-4">                            
    72	                            <form method='POST' action='{{ path('admin_shipping_standby_update', {'id': shippingStandby.id}) }}'>
    73	                                {{ form_widget(form._token) }}
    74	                                <div class="card-body">    
    75	                                    <div class="row">
    76	                                        <div class="col-sm-6">
    77	                                            <p id="number_info_box__standby_id">{{ 'admin.order.shipping_standby_no'|trans }}：{{ shippingStandby.id }}</p>
    78	                                            <p id="number_info_box__create_date">
    79	                                                {{ 'admin.common.create_date'|trans }}：{{ shippingStandby.createDate ? shippingStandby.createDate |date("Y/m/d H:i:s") : '' }}</p>
    80	                                            <p id="number_info_box__update_date">
    81	                                                {{ 'admin.common.update_date'|trans }}：{{ shippingStandby.updateDate ? shippingStandby.updateDate |date("Y/m/d H:i:s") : '' }}</p>
    82	                                            <p id="number_info_box__member">
    83	                                                {{ 'admin.common.last_updater'|trans }}：{{ shippingStandby.member.name ?? '' }}</p>
    84	                                        </div>
    85	                                        <div class="col">
    86	                                            <div class="card-body">
    87	                                                {{ 'admin.common.note'|trans }}
    88	                                                    {{ form_widget(form.comment, {'attr': {'rows': 8}}) }}
    89	                                            </div>
    90	                                        </div>
    91	                                    </div>
    92	                                    <div class="row py-3 align-items-center">
    93	                                        <div class="col-sm-2 offset-sm-5">
    94	                                            <button type="submit" class="btn btn-primary w-100">{{ 'admin.common.registration'|trans }}</button>
    95	                                        </div>
    96	                                        <div class="col-sm-2 ms-auto">
    97	                                            <a href="{{ path('admin_shipping_standby_delete', { 'id': shippingStandby.id }) }}" class="btn btn-danger w-100" {{ csrf_token_for_anchor() }} data-method="delete">
    98	                                                {{ 'admin.order.shipping_standby_delete'|trans }}
    99	                                            </a>
   100	                                        </div>
   101	                                    </div>
   102	                                </div>
   103	                            </form>
   104	                        </div>
   105	                    </div>
   106	                </div>
   107	
   108	                {# 一覧#}
   109	                    <!-- /.box -->
   110	                        <div id="result_list" class="row">
   111	                            <div class="col-md-12">
   112	                                <div id="result_list_main" class="box">
   113	                                    <form id="form_bulk" method="POST" name="order_list" action="">
   114	                                        <div id="result_list__menu" class="row">
   115	                                            <div class="row justify-content-between mb-3">
   116	                                                <ul class="list-inline">
   117	                                                    <button type="button" id="printPickingList" class="btn btn-primary btn-sm edit">
   118	                                                        {{ 'admin.order.shipping_standby_list_print'|trans }}
   119	                                                    </button>
   120	                                                    <button type="button" id="printDeliverySlipsJp" class="btn btn-primary btn-sm edit">
   121	                                                        {{ 'admin.order.print_delivery_slips_ja'|trans }}
   122	                                                    </button>
   123	                                                    <button type="button" id="printDeliverySlipsEn" class="btn btn-primary btn-sm edit">
   124	                                                        {{ 'admin.order.print_delivery_slips_en'|trans }}
   125	                                                    </button>
   126	                                                    <button type="button" id="orderExportForInput" class="btn btn-primary btn-sm edit submit">
   127	                                                        {{ 'admin.order.shipping_export_for_import'|trans }}
   128	                                                    </button>
   129	                                                    <button type="button" id="labelsExport" class="btn btn-primary btn-sm edit submit">
   130	                                                        {{ 'admin.stock.move_instruction.csv_download_invoice'|trans }}
   131	                                                    </button>
   132	                                                </ul>
   133	                                            </div>
   134	                                        </div>
   135	                                        <div id="result_list_main__body" class="box-body">
   136	                                            <div id="result_list_main__list" class="table_list">
   137	                                                <div id="result_list_main__list_body" class="table-responsive with-border">
   138	                                                    <table class="table table-striped">
   139	                                                        <thead>
   140	                                                            <tr id="result_list_main__header">
   141	                                                                <th class="text-center">
   142	                                                                <input type="checkbox" checked id="check-all"></th>
   143	                                                                <th id="result_list_main__header_id">{{ 'admin.common.order_number'|trans }}</th>
   144	                                                                <th id="result_list_main__header_name">{{ 'admin.common.name'|trans }}</th>
   145	                                                                <th id="result_list_main__header_payment_method">{{ 'admin.common.payment_method'|trans }}</th>
   146	                                                                <th id="result_list_main__header_payment_total">{{ 'admin.order.shipping_standby_order_payment_total'|trans }}</th>
   147	                                                                <th id="result_list_main__header_total_count">{{ 'admin.order.shipping_standby_order_quantity'|trans }}</th>
   148	                                                                <th id="result_list_main__header_order_date">{{ 'admin.order.shipping_standby_order_date'|trans }}</th>
   149	                                                                <th id="result_list_main__header_commit_date">{{ 'admin.order.commit_date'|trans }}</th>
   150	                                                                <th id="result_list_main__header_order_status">{{ 'admin.order.order_status'|trans }}</th>
   151	                                                            </tr>
   152	                                                        </thead>
   153	                                                        <tbody>
   154	                                                            {% for Order in shippingStandby.Orders %}
   155	                                                                <tr id="result_list_main__item--{{ Order.id }}">
   156	                                                                    <td id="result_list_main__id_check--{{ Order.id }}" class="text-center">
   157	                                                                        <input type="checkbox" checked id="check-{{ Order.id }}" data-id="{{ Order.id }}" data-shipping-id="{{ (Order.Shippings|first).id ?? '' }}" name="order_ids[{{ Order.id }}]"></td>
   158	                                                                    <td id="result_list_main__id--{{ Order.id }}">
   159	                                                                        <a href="{{ url('admin_order_edit', { id : Order.id }) }}">
   160	                                                                            {{ Order.order_number }}
   161	                                                                        </a>
   162	                                                                    </td>
   163	                                                                    <td id="result_list_main__name--{{ Order.id }}">
   164	                                                                        {{ Order.name01 }}
   165	                                                                        {{ Order.name02 }}</td>
   166	                                                                    <td id="result_list_main__payment_method--{{ Order.id }}">
   167	                                                                        {{ Order.payment_method }}</td>
   168	                                                                    <td id="result_list_main__payment_total--{{ Order.id }}" class="text-right">
   169	                                                                        {{ Order.payment_total|number_format }}</td>
   170	                                                                    <td id="result_list_main__total_count--{{ Order.id }}" class="text-right">
   171	                                                                        {{ Order.quantity|number_format }}</td>
   172	                                                                    <td id="result_list_main__order_date--{{ Order.id }}">
   173	                                                                        {{ Order.order_date|date_format }}</td>
   174	                                                                    <td id="result_list_main__commit_date--{{ Order.id }}">
   175	                                                                        {{ Order.commit_date|date_format }}</td>
   176	                                                                    <td id="result_list_main__order_status--{{ Order.id }}">
   177	                                                                        {{ Order.OrderStatus }}</td>
   178	                                                                </tr>
   179	                                                            {% endfor %}
   180	                                                        </tbody>
   181	                                                    </table>
   182	                                                </div>
   183	                                            </div>
   184	                                        </div>
   185	                                        <!-- /.box-body -->
   186	                                    </form>
   187	                                </div>
   188	                            <!-- /.box -->
   189	                        </div>
   190	                    <!-- /.col -->
   191	                </div>
   192	            </div>  
   193	        </div>
   194	    </div>
   195	{% endblock %}

 succeeded in 159ms:
     1	<?php
     2	
     3	declare(strict_types=1);
     4	
     5	/*
     6	 * This file is part of EC-CUBE
     7	 *
     8	 * Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved.
     9	 *
    10	 * http://www.ec-cube.co.jp/
    11	 *
    12	 * For the full copyright and license information, please view the LICENSE
    13	 * file that was distributed with this source code.
    14	 */
    15	
    16	namespace Eccube\Repository\Traits;
    17	
    18	use Doctrine\ORM\QueryBuilder;
    19	use Eccube\Entity\Master\MtbRarity;
    20	
    21	/**
    22	 * 商品のソート順をまとめたTrait
    23	 */
    24	trait SortProductTrait
    25	{
    26	    /** @var array<string> */
    27	    private array $productSortKeys = [
    28	        'storageCodeRank',
    29	        'languageOrder',
    30	        'foilFlg',
    31	        'isRarityNull',
    32	        'rarityOrder',
    33	        'isCardNumberNull',
    34	        'cardNumber',
    35	        'colorSequence',
    36	        'alphabetSort',
    37	        'isCard',
    38	        'shelfNumberSortNo',
    39	    ];
    40	
    41	    /**
    42	     * クエリビルダに商品情報をソートするクエリを追加
    43	     *
    44	     * @param QueryBuilder $qb
    45	     * @param array<string> $visibleKeys
    46	     *
    47	     * @return void
    48	     */
    49	    private function sortProduct(QueryBuilder $qb, array $visibleKeys = []): void
    50	    {
    51	        // ソート用カラムのデフォルトはHIDDEN, $visibleKeysに指定されたらHIDDENを解除する
    52	        $hiddenOrNot = array_fill_keys($this->productSortKeys, 'HIDDEN');
    53	        foreach ($visibleKeys as $key) {
    54	            $hiddenOrNot[$key] = '';
    55	        }
    56	
    57	        $qb
    58	            ->addSelect(
    59	                "stc.rank AS {$hiddenOrNot['storageCodeRank']} storageCodeRank",
    60	                "lng.id AS {$hiddenOrNot['languageOrder']} languageOrder",
    61	                "CASE WHEN cd.foil_flg IS NULL THEN 0 ELSE cd.foil_flg END AS {$hiddenOrNot['foilFlg']} foilFlg",
    62	                "CASE WHEN r.id IS NULL THEN 1 ELSE 0 END AS {$hiddenOrNot['isRarityNull']} isRarityNull",
    63	                "CASE WHEN r.id IN (:rareId, :mythicId) THEN :rareOrderVal ELSE r.id END AS {$hiddenOrNot['rarityOrder']} rarityOrder",
    64	                "CASE WHEN stc.alphabet_sort_flg = false OR cd.card_no IS NULL OR cd.card_no = '' THEN 1 ELSE 0 END AS {$hiddenOrNot['isCardNumberNull']} isCardNumberNull",
    65	                "CASE WHEN stc.alphabet_sort_flg = false THEN concat(cd.card_no, '0') ELSE '0' END AS {$hiddenOrNot['cardNumber']} cardNumber",    // TODO: カードNOは英数字あり - 文字列結合としたが現行と同じになるか？（MySQL - PgSQLの差異）
    66	                "CASE WHEN cs.sort_no IS NULL THEN 0 ELSE cs.sort_no END AS {$hiddenOrNot['colorSequence']} colorSequence",
    67	                "CASE WHEN stc.alphabet_sort_flg = true THEN c.name_en ELSE 'zzz' END AS {$hiddenOrNot['alphabetSort']} alphabetSort",
    68	                "CASE WHEN cd.id IS NULL THEN 0 ELSE 1 END AS {$hiddenOrNot['isCard']} isCard",
    69	                "sn.sortNo AS {$hiddenOrNot['shelfNumberSortNo']} shelfNumberSortNo",
    70	            )
    71	            ->addOrderBy('isCard', 'DESC')
    72	            ->addOrderBy('shelfNumberSortNo', 'ASC')
    73	            ->addOrderBy('languageOrder', 'ASC')
    74	            ->addOrderBy('psc.CardCondition', 'ASC')
    75	            ->addOrderBy('foilFlg', 'ASC')
    76	            ->addOrderBy('storageCodeRank', 'ASC')
    77	            ->addOrderBy('isRarityNull', 'ASC')
    78	            ->addOrderBy('rarityOrder', 'DESC')
    79	            ->addOrderBy('colorSequence', 'ASC')
    80	            ->addOrderBy('isCardNumberNull', 'ASC')
    81	            ->addOrderBy('cardNumber', 'ASC')
    82	            ->addOrderBy('alphabetSort', 'ASC')
    83	            ->addOrderBy('cd.card_no', 'ASC')
    84	            ->setParameter('rareId', MtbRarity::RARE_ID)
    85	            ->setParameter('mythicId', MtbRarity::MYTHIC_RARE_ID)
    86	            ->setParameter('rareOrderVal', MtbRarity::RARE_ID);
    87	    }
    88	}

 succeeded in 207ms:
/home/y-saito/Developments/ec-cube-enterprise/html/template/admin/assets/js/function.js:208:     * すべて選択/すべて選択解除させるボタンのidをcheck-allにする
/home/y-saito/Developments/ec-cube-enterprise/html/template/admin/assets/js/function.js:210:    $('#check-all').click(function() {
/home/y-saito/Developments/ec-cube-enterprise/html/template/admin/assets/js/function.js:211:        const checkAll = $('#check-all').prop('checked');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:141:            $(document).on('click', '#form_bulk .action-submit', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:158:            $('form#form_bulk').on('click', 'table.table button[data-class-url]', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:465:                    <form id="form_bulk" method="POST" action="">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:12:            $('#printPickingList').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:13:                window.open('', 'newwin', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=700, height=700');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:14:                $('#form_bulk').attr('action', "{{ url('admin_shipping_standby_print_picking_list', { 'id' : shippingStandby.id }) }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:15:                $('#form_bulk').attr('target', 'newwin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:16:                $('#form_bulk').append($('<input>', { type: 'hidden', name: 'id', value: 'ja' }));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:17:                $('#form_bulk').submit();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:22:                window.open('', 'newwin', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=700, height=700');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:23:                $('#form_bulk').attr('action', "{{ url('admin_shipping_standby_print_delivery_slips' ,{'id' : shippingStandby.id, 'lang' : 'ja' }) }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:24:                $('#form_bulk').attr('target', 'newwin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:25:                $('#form_bulk').submit();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:30:                window.open('', 'newwin', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=700, height=700');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:31:                $('#form_bulk').attr('action', "{{ url('admin_shipping_standby_print_delivery_slips' ,{'id' : shippingStandby.id, 'lang' : 'en' }) }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:32:                $('#form_bulk').attr('target', 'newwin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:33:                $('#form_bulk').submit();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:38:                $('#form_bulk').removeAttr('target');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:39:                $('#form_bulk').attr('action', "{{ url('admin_order_export_for_input') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:40:                $('#form_bulk').submit();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:45:                $('#form_bulk').removeAttr('target');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:46:                $('#form_bulk').attr('action', "{{ url('admin_labels_export') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:47:                $('#form_bulk input[name="ids[]"]').remove();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:48:                $('#form_bulk input[type="checkbox"][name^="order_ids"]:checked').each(function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:51:                        $('#form_bulk').append($('<input>', {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:58:                $('#form_bulk').submit();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:113:                                    <form id="form_bulk" method="POST" name="order_list" action="">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:117:                                                    <button type="button" id="printPickingList" class="btn btn-primary btn-sm edit">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:142:                                                                <input type="checkbox" checked id="check-all"></th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:157:                                                                        <input type="checkbox" checked id="check-{{ Order.id }}" data-id="{{ Order.id }}" data-shipping-id="{{ (Order.Shippings|first).id ?? '' }}" name="order_ids[{{ Order.id }}]"></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:127:                $('`#form_bulk`')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:143:                $('#form_bulk').attr('method', 'GET').attr('action', href).submit();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:153:                window.open('', 'newwin', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=700, height=700');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:154:                $('#form_bulk').attr('action', "{{ url('admin_order_export_pdf') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:155:                $('#form_bulk').attr('target', 'newwin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:156:                $('#form_bulk').submit();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:162:                window.open(this.href, 'newwin', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=700, height=700');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:172:                window.open('', 'newwin', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=700, height=700');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:173:                $('#form_bulk').attr('action', "{{ url('admin_delivery_slips_export', { 'lang': 'ja' }) }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:174:                $('#form_bulk').attr('target', 'newwin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:175:                $('#form_bulk').submit();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:185:                window.open('', 'newwin', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=700, height=700');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:186:                $('#form_bulk').attr('action', "{{ url('admin_delivery_slips_export', { 'lang': 'en' }) }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:187:                $('#form_bulk').attr('target', 'newwin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:188:                $('#form_bulk').submit();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:198:                $('#form_bulk').attr('action', "{{ url('admin_labels_export') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:199:                $('#form_bulk').submit();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:236:                window.open('', 'newwin', 'toolbar=no, width=450, height=400');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:237:                $('#form_bulk').attr('action', "{{ url('admin_order_print_stack_window') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:238:                $('#form_bulk').attr('target', 'newwin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:239:                $('#form_bulk').submit();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1095:                    <form id="form_bulk" method="POST" action="">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:160:            window.open(this.href, 'newwin', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=700, height=700');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/index.twig:51:            $('#form_bulk').find('.action-submit').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/index.twig:54:                const $form = $('#form_bulk');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/index.twig:343:                            <form id="form_bulk" method="POST">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:476:                window.open(this.href, 'newwin', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=700, height=700');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:750:            window.open(url, 'newwin', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=700, height=700');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/history.twig:595:                                    <form id="form_bulk" method="POST" action="">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/index.twig:438:                                        <th class="align-middle text-center"><input type="checkbox" id="check-all"></th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/tenant/detail.twig:545:                                <div class="col-3"><span>{{ 'admin.setting.shop.shop.picking_list_threshold'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/tenant/detail.twig:547:                                    {{ form_widget(form.picking_list_threshold) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/tenant/detail.twig:548:                                    {{ form_errors(form.picking_list_threshold) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:287:                                <div class="col-3"><span>{{ 'admin.setting.shop.shop.picking_list_threshold'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:289:                                    {{ form_widget(form.picking_list_threshold) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:290:                                    {{ form_errors(form.picking_list_threshold) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/tenant/index.twig:98:            $('#form_bulk').find('.action-submit').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/tenant/index.twig:116:            $('form#form_bulk').on('click', 'table.table button[data-class-url]', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/tenant/index.twig:180:                <form id="form_bulk" method="POST" action="">

codex
表示テンプレートとJSは設計記述と大きくずれていません。一方で、設計の「DB操作」節が「ファイル出力」と書いている点はHTML応答の機能内容と矛盾するため、実装差分というより設計内記述の不整合として扱うべきか確認しています。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/html/template/admin/assets/css/pickinglist.css | sed -n '1,220p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig | sed -n '260,430p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   260	                    <td class='name_'><div class='name_'></div></td>
   261	                    <td class='price_'><div class='price_'></div></td>
   262	                    <td class='remarks_'><div class='remarks_'></div></td>
   263	                </tr>
   264	            {% endfor %}
   265	            {% endif %}
   266	                <tr class="data">
   267	                    <td class='no_'><div class='no_'></div></td>
   268	                    <td class='shelf_number_'><div class='shelf_number_'></div></td>
   269	                    <td class='language_condition_'><div class='language_condition_'></div></td>
   270	                    <td class='expansion_sname_'><div class='expansion_sname_'></div></td>
   271	                    <td class='color_rarity_'><div class='color_rarity_'></div></td>
   272	                    <td class='qty_'><div class='qty_'></div></td>
   273	                    <td class='name_'><div class='name_'>{{'admin.picking_item_list.all'|trans }}{{ pickingList.high.total_quantity }} {{'admin.picking_item_list.count'|trans }}</div></td>
   274	                    <td class='price_'><div class='price_'></div></td>
   275	                    <td class='remarks_'><div class='remarks_'></div></td>
   276	                </tr>
   277	            {% endif %}
   278	            {% if loop.index % maxPageRows == 0 or loop.last %}
   279	            </table>
   280	            </div>
   281	            {% endif %}
   282	        {% endfor %}
   283	        {% endif %}
   284	
   285	        {% if pickingList.goods.items|length > 0 %}
   286	        {% for pickingItem in pickingList.goods.items %}
   287	        {% if loop.index % maxPageRows == 1 %}
   288	        <div class='multipage'>
   289	            <div style="text-align: center; font-size: 15pt;">
   290	                {{'admin.picking_item_list.title_per_supply'|trans }}{{ loop.index // maxPageRows + 1 }}/{{ (pickingList.goods.items|length - 1) // maxPageRows + 1 }}
   291	            </div>
   292	            <div style="text-align: right;">
   293	            <span style="float: left;">
   294	                {{'admin.picking_item_list.shipping_standby_id'|trans }}：{{ shippingStandby.id }}
   295	            </span>
   296	
   297	            <span style="text-align: right;">
   298	                {{'admin.picking_item_list.create_date'|trans }}：{{ shippingStandby.createDate|date('Y/m/d H:i:s') }}
   299	            </span>
   300	            </div>
   301	            <table>
   302	                <tr class="desc">
   303	                    <th class='no_'>No</th>
   304	                    <th class='shelf_number_'>{{'admin.picking_item_list.shelf_number'|trans }}</th>
   305	                    <th class='language_condition_'>{{'admin.picking_item_list.language_condition'|trans }}</th>
   306	                    <th class='expansion_sname_'>{{'admin.picking_item_list.expansion_sname'|trans }}</th>
   307	                    <th class='color_rarity_'>{{'admin.picking_item_list.color_rarity'|trans }}</th>
   308	                    <th class='qty_'>{{'admin.picking_item_list.qty'|trans }}</th>
   309	                    <th class='name_'>{{'admin.picking_item_list.item_name'|trans }}</th>
   310	                    <th class='price_'>{{'admin.picking_item_list.price'|trans }}</th>
   311	                    <th class='remarks_'>{{'admin.common.note'|trans }}</th>
   312	                </tr>
   313	            {% endif %}
   314	                <tr class="data">
   315	                    <td class='no_'><div class='no_'>{{ loop.index }}</div></td>
   316	                    <td class='shelf_number_'><div class='shelf_number_'>{{ pickingItem.shelfNumberName }}</div></td>
   317	                    <td class='language_condition_'><div class='language_condition_'>{{'admin.picking_item_list.supply'|trans }}</div></td>
   318	                    <td class='expansion_sname_'><div class='expansion_sname_'></div></td>
   319	                    <td class='color_rarity_'><div class='color_rarity_'></div></td>
   320	                    <td class='qty_'><div class='qty_'{% if pickingItem.quantitySubtotal != 1 %} style='font-weight:bold;'{% endif %}>{{ pickingItem.quantitySubtotal|number_format(0) }}</div></td>
   321	                    <td class='name_'><div class='name_'>{{ pickingItem.product_name }}</div></td>
   322	                    <td class='price_'><div class='price_'>{{ pickingItem.price|number_format(0) }}</div></td>
   323	                    <td class='remarks_'><div class='remarks_'></div></td>
   324	                </tr>
   325	            {% if loop.last %}
   326	            {% if loop.index % maxPageRows != 0 %}
   327	            {% for i in (loop.index % maxPageRows) .. maxPageRows %}
   328	                <tr class="data">
   329	                    <td class='no_'><div class='no_'></div></td>
   330	                    <td class='shelf_number_'><div class='shelf_number_'></div></td>
   331	                    <td class='language_condition_'><div class='language_condition_'></div></td>
   332	                    <td class='expansion_sname_'><div class='expansion_sname_'></div></td>
   333	                    <td class='color_rarity_'><div class='color_rarity_'></div></td>
   334	                    <td class='qty_'><div class='qty_'></div></td>
   335	                    <td class='name_'><div class='name_'></div></td>
   336	                    <td class='price_'><div class='price_'></div></td>
   337	                    <td class='remarks_'><div class='remarks_'></div></td>
   338	                </tr>
   339	            {% endfor %}
   340	            {% endif %}
   341	                <tr class="data">
   342	                    <td class='no_'><div class='no_'></div></td>
   343	                    <td class='shelf_number_'><div class='shelf_number_'></div></td>
   344	                    <td class='language_condition_'><div class='language_condition_'></div></td>
   345	                    <td class='expansion_sname_'><div class='expansion_sname_'></div></td>
   346	                    <td class='color_rarity_'><div class='color_rarity_'></div></td>
   347	                    <td class='qty_'><div class='qty_'></div></td>
   348	                    <td class='name_'><div class='name_'>{{'admin.picking_item_list.all'|trans }}{{ pickingList.goods.total_quantity }} {{'admin.picking_item_list.count'|trans }}</div></td>
   349	                    <td class='price_'><div class='price_'></div></td>
   350	                    <td class='remarks_'><div class='remarks_'></div></td>
   351	                </tr>
   352	            {% endif %}
   353	            {% if loop.index % maxPageRows == 0 or loop.last %}
   354	            </table>
   355	            </div>
   356	            {% endif %}
   357	        {% endfor %}
   358	        {% endif %}
   359	    </div>
   360	</body>
   361	</html>

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/html/template/admin/assets/js/function.js | sed -n '200,220p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   200	            }
   201	            $('li.select2-selection__choice').remove();
   202	        });
   203	    });
   204	
   205	    /**
   206	     * 登録チェックボックス
   207	     * 検索画面で検索結果のチェックボックスに対して「すべて選択/すべて選択解除」を行う
   208	     * すべて選択/すべて選択解除させるボタンのidをcheck-allにする
   209	     */
   210	    $('#check-all').click(function() {
   211	        const checkAll = $('#check-all').prop('checked');
   212	        $('input[id^=check-]').prop('checked', checkAll);
   213	    });
   214	
   215	    /**
   216	     * チェックボックスを選択判定
   217	     * 検索結果のチェックボックスを選択していない場合はエラーメッセージを表示し、
   218	     * target-actionがclassに付与されている場合はチェックボックスチェックを確認
   219	     * 選択されている場合はhrefが設定されている場合はsubmitする
   220	     */

exec
/bin/bash -lc 'rg -n "GOODS_ID|RESERVED_GOODS_ID|class Category|const .*GOODS" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /home/y-saito/Developments/ec-cube-enterprise/app 2>/dev/null' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/EventSubscriber/CategoryNavCacheInvalidationSubscriber.php:41:class CategoryNavCacheInvalidationSubscriber
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/Subscriber/CategorySubscriber.php:25:class CategorySubscriber implements EventSubscriberInterface
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/CategoryMap.php:26:class CategoryMap
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/CategoryController.php:43:class CategoryController extends AbstractController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/CategoryController.php:26:class CategoryController extends AbstractController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/Block/CategoryListBlockListener.php:29:final class CategoryListBlockListener implements EventSubscriberInterface
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CategoryCsvController.php:35:class CategoryCsvController extends AbstractController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Master/CategoryType.php:22:class CategoryType extends AbstractType
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Category.php:39:    class Category extends AbstractEntity implements \Stringable
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Category.php:42:        public const GOODS_ID = 2;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Category.php:44:        public const RESERVED_GOODS_ID = 4;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/Block/CategoryNavPcBlockListener.php:29:final class CategoryNavPcBlockListener implements EventSubscriberInterface
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/Block/CategoryModalBlockListener.php:29:final class CategoryModalBlockListener implements EventSubscriberInterface
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CategoryType.php:28:class CategoryType extends AbstractType
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbCsvImportType.php:29:    public const PRODUCT_GOODS_IMPORT_CSV_ID = 2;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategoryTreeCardsetSyntheticChildrenGenerator.php:31:class CategoryTreeCardsetSyntheticChildrenGenerator
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategoryTreeResponseBuilder.php:30:class CategoryTreeResponseBuilder
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/CategoryCsvImportHandler.php:35:class CategoryCsvImportHandler extends BaseCsvImportHandler
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockSplitJoinDetailRepository.php:145:                'goods_category_id' => Category::GOODS_ID,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockSplitJoinDetailRepository.php:146:                'reserved_goods_category_id' => Category::RESERVED_GOODS_ID,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/CategoryRepository.php:41:class CategoryRepository extends AbstractEnterpriseRepository implements ServiceEntityRepositoryInterface
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/Repository/CategoryIdValidator.php:27:class CategoryIdValidator implements ValidatorInterface
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CategoryCsvRowValidator.php:27:final class CategoryCsvRowValidator implements RowValidatorInterface
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategorySidebarLinkContext.php:24:final class CategorySidebarLinkContext
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/CategoryListBlockPayloadBuilder.php:30:class CategoryListBlockPayloadBuilder
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPriceHistoryRepository.php:671:            'goods_category_id' => Category::GOODS_ID,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPriceHistoryRepository.php:672:            'reserved_goods_category_id' => Category::RESERVED_GOODS_ID,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:306:                'goods_category_id' => Category::GOODS_ID,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:307:                'reserved_goods_category_id' => Category::RESERVED_GOODS_ID,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:463:            'goods_category_id' => Category::GOODS_ID,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:464:            'reserved_goods_category_id' => Category::RESERVED_GOODS_ID,

 succeeded in 101ms:
     1	
     2	@charset "utf-8";
     3	@media screen, print
     4	{
     5	    .ContentsAll
     6	    {
     7	        font-family: 'メイリオ', 'Meiryo';
     8	        width: 720px;
     9	        font-size: 8pt;
    10	        clear: both;
    11	        margin: 10px;
    12	        margin-left: auto;
    13	        margin-right: auto;
    14	    }
    15	    .multipage
    16	    {
    17	        page-break-after: always;
    18	    }
    19	    .printBox
    20	    {
    21	        width: 100%;
    22	        border-bottom: 1px solid #bbbbbb;
    23	        background-color: #dddddd;
    24	        margin-bottom: 0px;
    25	        text-align: center;
    26	    }
    27	}
    28	@media print
    29	{
    30	    .printBox
    31	    {
    32	        display: none;
    33	    }
    34	}
    35	body
    36	{
    37	    margin: 0px;
    38	}
    39	table
    40	{
    41	    border: 1px solid black;
    42	    width: 720px;
    43	    border-spacing: 0;
    44	    border-collapse: separate;
    45	}
    46	tr.data
    47	{
    48	    height: 30px;
    49	}
    50	tr.data:nth-child(odd)
    51	{
    52	    background-color:#DCDCDC;
    53	}
    54	th
    55	{
    56	    padding: 2px;
    57	}
    58	td
    59	{
    60	    padding: 2px;
    61	}
    62	tr.data td
    63	{
    64	    height: 16px; font-size: 6pt;
    65	}
    66	tr.data td div
    67	{
    68	    overflow: hidden;
    69	    text-align: center;
    70	}
    71	tr.desc td, tr.desc th
    72	{
    73	    height: 15px; font-size: 8pt;
    74	    background-color:black; color:white;
    75	}
    76	tr.data td div.no_
    77	{
    78	    width: 20px;
    79	    white-space:nowrap;
    80	}
    81	td.location_, th.location_
    82	{
    83	    width: 60px;
    84	}
    85	tr.data td div.shelf_number_
    86	{
    87	    width: 48px;
    88	    white-space:nowrap;
    89	}
    90	tr.data td div.language_condition_
    91	{
    92	    width: 52px;
    93	    white-space:nowrap;
    94	}
    95	tr.data td div.expansion_sname_
    96	{
    97	    width: 64px;
    98	    white-space:nowrap;
    99	}
   100	tr.data td div.seq_
   101	{
   102	    width: 44px;
   103	    white-space:nowrap;
   104	}
   105	tr.data td div.color_rarity_
   106	{
   107	    width: 32px;
   108	    white-space:nowrap;
   109	}
   110	tr.data td div.qty_
   111	{
   112	    width: 20px;
   113	    white-space:nowrap;
   114	    font-size: 6pt;
   115	}
   116	tr.data td div.name_
   117	{
   118	    width: 332px;
   119	    white-space: normal;
   120	    text-align: left;
   121	    font-size: 6pt;
   122	}
   123	tr.data td div.price_
   124	{
   125	    width: 45px;
   126	    white-space:nowrap;
   127	    font-size: 4pt;
   128	}
   129	tr.data td.remarks_
   130	{
   131	}
   132	tr.data td div.remarks_
   133	{
   134	    width: 50px;
   135	    white-space:nowrap;
   136	}

codex
関連する別ルートや同名関数を検索しましたが、対象の印刷ルートは `ShippingStandbyController::printPickingList` と `DtbShippingStandbyRepository::generatePickingList` に収束しています。候補が「別ファイルで実現済み」を見落としている形跡はありません。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Category.php | sed -n '35,50p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
    35	    // sort_no まで含めて並び替えコストを削減する目的で追加する。
    36	    #[ORM\Index(columns: ['parent_category_id', 'sort_no'], name: 'dtb_category_parent_sort_no_idx')]
    37	    #[ORM\HasLifecycleCallbacks]
    38	    #[ORM\Entity(repositoryClass: CategoryRepository::class)]
    39	    class Category extends AbstractEntity implements \Stringable
    40	    {
    41	        public const SINGLE_ID = 1;
    42	        public const GOODS_ID = 2;
    43	        public const RESERVED_SINGLE_ID = 3;
    44	        public const RESERVED_GOODS_ID = 4;
    45	        public const INFORMATION_PRODUCT_ID = 5;
    46	
    47	        #[\Override]
    48	        public function __toString(): string
    49	        {
    50	            return $this->getName();

exec
/bin/bash -lc 'rg -n "function generatePickingList|printPickingList|admin_shipping_standby_print_picking_list|getSubInfosByProductClassIds|ORDER_LIST_THRESHOLD_PRICE_1|ORDER_LIST_THRESHOLD_PRICE_2" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /home/y-saito/Developments/ec-cube-enterprise/app 2>/dev/null' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:1043:            'option_key' => MtbOption::ORDER_LIST_THRESHOLD_PRICE_1,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:1048:            'option_key' => MtbOption::ORDER_LIST_THRESHOLD_PRICE_2,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:1077:        $subInfosByProductClass = $this->productClassRepository->getSubInfosByProductClassIds($productClassIds);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:284:    #[Route(path: '/%eccube_admin_route%/standby/{id}/print/picking', name: 'admin_shipping_standby_print_picking_list', requirements: ['id' => '\d+'], methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:285:    public function printPickingList(Request $request, $id)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:297:            'option_key' => MtbOption::ORDER_LIST_THRESHOLD_PRICE_1,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:302:            'option_key' => MtbOption::ORDER_LIST_THRESHOLD_PRICE_2,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:343:            $subInfos = $this->productClassRepository->getSubInfosByProductClassIds([$item['productClassId']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOption.php:32:    public const ORDER_LIST_THRESHOLD_PRICE_1 = 'order_list_threshold_price_1';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOption.php:33:    public const ORDER_LIST_THRESHOLD_PRICE_1_DEFAULT = 980;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOption.php:34:    public const ORDER_LIST_THRESHOLD_PRICE_2 = 'order_list_threshold_price_2';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOption.php:35:    public const ORDER_LIST_THRESHOLD_PRICE_2_DEFAULT = 4800;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:141:    public function generatePickingList(int $standbyId, array $orderIdList = []): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:144:            'option_key' => MtbOption::ORDER_LIST_THRESHOLD_PRICE_1,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:149:            'option_key' => MtbOption::ORDER_LIST_THRESHOLD_PRICE_2,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:239:            'option_key' => MtbOption::ORDER_LIST_THRESHOLD_PRICE_1,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:244:            'option_key' => MtbOption::ORDER_LIST_THRESHOLD_PRICE_2,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2531:    //     public function getSubInfosByProductClassIds(array $productClassIds): mixed
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:3042:    public function getSubInfosByProductClassIds(array $productClassIds): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1116:            'option_key' => MtbOption::ORDER_LIST_THRESHOLD_PRICE_1,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1121:            'option_key' => MtbOption::ORDER_LIST_THRESHOLD_PRICE_2,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1906:            'option_key' => MtbOption::ORDER_LIST_THRESHOLD_PRICE_1,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1911:            'option_key' => MtbOption::ORDER_LIST_THRESHOLD_PRICE_2,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:12:            $('#printPickingList').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:14:                $('#form_bulk').attr('action', "{{ url('admin_shipping_standby_print_picking_list', { 'id' : shippingStandby.id }) }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:117:                                                    <button type="button" id="printPickingList" class="btn btn-primary btn-sm edit">

exec
/bin/bash -lc 'rg -n "findByOptionKey|ORDER_LIST_THRESHOLD_PRICE|Category::GOODS_ID|RESERVED_GOODS_ID|getSubInfosByProductClassIds|generatePickingList|printPickingList" /home/y-saito/Developments/hareruya-design-docs /home/y-saito/Developments/ec-cube-enterprise/src/Eccube 2>/dev/null' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 247ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:12:            $('#printPickingList').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:117:                                                    <button type="button" id="printPickingList" class="btn btn-primary btn-sm edit">
/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4409:          <div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>明細行の並び</td><td><code>SortProductTrait</code>により、ホイル区分・アルファベットソートフラグなど定義済み順序へ並べる。しきい値は<code>ORDER_LIST_THRESHOLD_PRICE_1</code>および<code>ORDER_LIST_THRESHOLD_PRICE_2</code>の確認値である。</td></tr><tr><td>改ページと件数脚注</td><td>Twig定数<code>_maxPageRows</code>相当は30行。チャンク先頭ごとにタイトル・ページ番号・宛先などを繰り返す。脚注行はチャンク末または最終で出し、<code>subtotal_quantity</code>と<code>DeliverySlip.total_quantity</code>を並べて表示する。</td></tr><tr><td>合計フィールドループでの注意</td><td>Twigは最後のチャンクの<code>loop.last</code>で締めるが、総行数が30の倍数で終わらないときの余り行は明示的な総括行のみでなく、ヘッダ再掲タイミングに依存するレイアウトとなっている（実装上の細部としてテンプレートを確認する）。</td></tr></tbody></table></div>
/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4426:          <div class="table-wrap"><table><thead><tr><th>テーブル</th><th>列</th><th>メモ</th></tr></thead><tbody><tr><td><code>dtb_shipping</code></td><td><code>id</code>, <code>order_id</code>, 宛先関連列、<code>delivery_id</code></td><td><code>ids</code>入力と、注文からのJOINに使う主キー・外部キー。住所・電話などは版面に転写される。</td></tr><tr><td><code>dtb_delivery</code></td><td><code>name</code>, <code>is_abroad</code></td><td>発送方法名と海外配送フラグ。英語経路では<code>is_abroad</code>が真と結合される。</td></tr><tr><td><code>dtb_order_item</code></td><td>商品名・単価・数量関連</td><td>版面の明細行。</td></tr><tr><td><code>mtb_option</code></td><td><code>ORDER_LIST_THRESHOLD_PRICE_1</code>、<code>ORDER_LIST_THRESHOLD_PRICE_2</code></td><td>明細の補助分類およびソート用。</td></tr></tbody></table></div>
/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:7110:          <div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>表示要素（編集）</td><td>共通管理フレーム <code>@admin/default_frame</code>。一括フォーム <code>id="form_bulk"</code> に「ピッキングリスト印刷」ボタン <code>id="printPickingList"</code>、各受注行のチェックボックスは <code>order_ids[&lt;注文ID&gt;]</code> とし、一覧ヘッダの <code>id="check-all"</code> と行 <code>id="check-&lt;注文ID&gt;"</code> が共通JSの全選択慣例に一致するようになっている（初期チェックオンはテンプレの <code>checked</code> 属性）。</td></tr><tr><td>JS挙動（編集）</td><td>クリック時に縦横700程度の名前付きウィンドウを空で開き、<code>#form_bulk</code> の <code>action</code> をピッキング印刷URL、<code>target</code> を <code>newwin</code> にセットし、<code>type=hidden</code>、<code>name=id</code>、<code>value=ja</code> を毎回 <code>append</code> してから <code>submit</code>。納品書ボタンは同ウィンドウ名を再利用する別ハンドラである。送信後、<code>action</code> と <code>target</code> を他ボタンのハンドラが都度張り替える設計とは独立に、親ページURLは編集画面のままである。</td></tr><tr><td>表示要素（印刷）</td><td>共通レイアウトは使わず、<code>picking_list.twig</code> が単独HTMLを返す。先頭は印刷ボタン帯 <code>.printBox</code>、本文 <code>.ContentsAll</code>。帯ごとに <code>multipage</code>、<code>maxPageRows = 30</code> で表を区切り、最終ページは空行パディングのあとに「合計 N 点数」相当の一行を載せる。</td></tr><tr><td>CSS・レイアウト（印刷）</td><td>アセットパス経由で <code>assets/css/pickinglist.css</code>（成果物は <code>html/template/admin/assets/css/</code> 側）を読む。コンテンツ幅720px、<code>@media print</code> で <code>.printBox</code> を非表示。<code>.multipage</code> は <code>page-break-after: always</code> で強制改ページを付ける（最終チャンク含めて当該 DIV に付く）。</td></tr><tr><td>JS挙動（印刷ページ）</td><td><code>DOMContentLoaded</code> で <code>#printButton</code> に <code>window.print</code> を紐づける。<code>select2</code> の静的JSを読むが、当ページでウィジェット初期化コードは載せない。</td></tr><tr><td>モーダル</td><td>共通モーダルはなく、確認はブラウザの印刷ダイアログに委ねる。</td></tr></tbody></table></div>
/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:7183:          <ul><li><code>src/Eccube/Controller/Admin/Order/ShippingStandbyController.php</code></li><li><code>src/Eccube/Repository/DtbShippingStandbyRepository.php</code>（関数 <code>generatePickingList</code>）</li><li><code>src/Eccube/Repository/Traits/SortProductTrait.php</code></li><li><code>src/Eccube/Resource/template/admin/ShippingStandby/edit.twig</code></li><li><code>src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig</code></li><li><code>html/template/admin/assets/js/function.js</code>（<code>check-all</code>）</li><li><code>html/template/admin/assets/css/pickinglist.css</code></li></ul>
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_21_admin_order_order_shipping_standby_picking_list_print_e2e_cases.md:9:刷新先 `ec-cube-enterprise` に当該画面は存在する（`Controller/Admin/Order/ShippingStandbyController.php` の `edit`／`printPickingList`、`Resource/template/admin/ShippingStandby/edit.twig`／`picking_list.twig`）。設計書は pf-eccube3 のリバースだが、本ルートの処理フロー・画面構成は刷新先と一致する（404/別ウィンドウPOST/単体HTML/印刷ボタン）。乖離・要確認は付帯表4。
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_21_admin_order_order_shipping_standby_picking_list_print_e2e_cases.md:89:| E2E-M05-21-001 | E2E自動化(要シード) | button #printPickingList（edit.twig:117）／文言 trans `admin.order.shipping_standby_list_print`＝「ピッキングリスト印刷」（messages.ja.yaml:2485） | フロント挙動「表示要素（編集）」・利用者視点の入口 ／ IT-25 操作起点(021) | 021 |
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_21_admin_order_order_shipping_standby_picking_list_print_e2e_cases.md:108:| E2E-M05-21-052 | 要確認(実機・異常系) | 閾値 findBy 添字[0]/[1]参照（DtbShippingStandbyRepository::generatePickingList／ShippingStandbyController.php 単独 findOneBy） | エラー処理「mtb_option閾値行が両方そろわないとき実行時異常になりうる」 ／ IT-27 出力失敗(008) | 008 |
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_21_admin_order_order_shipping_standby_picking_list_print_e2e_cases.md:203:| 1 | チェックを全て外して印刷→order_idsが空集合になり「例外や空結果になりうる」（ふるまい未確定） | ShippingStandbyController.php:291 `array_keys($request->get('order_ids', []))`＝空配列→generatePickingList に空配列 | 空配列INのORM/DB方言依存で例外か空結果か実機確認。設計書もふるまいを断定しない | E2E-M05-21-022 | 要確認(ふるまい未確定) |
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_21_admin_order_order_shipping_standby_picking_list_print_e2e_cases.md:204:| 2 | `mtb_option` 閾値の取得順問題（DQL一括取得の返却順とコントローラ単独読みの数値が食い違う可能性） | ShippingStandbyController.php:295-303 個別 findOneBy ／ Repository::generatePickingList のDQL一括取得 | 一覧並びクエリの閾値と画面見出し数値の取り合わせが食い違う可能性。閾値1>閾値2の異常データで顕在化 | （手動: 価格帯振り分け） | 要確認(データ依存) |
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_21_admin_order_order_shipping_standby_picking_list_print_e2e_cases.md:218:| フロント挙動「表示要素（編集）」 | form_bulk・printPickingList・check-all・order_ids初期チェック | 001,002 | カバー |
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_23_admin_order_order_shipping_standby_print_delivery_slips_en_e2e_cases.md:72:| E2E-M05-23-003 | E2E自動化(要シード) | #form_bulk(edit.twig:113) / #printPickingList(:117) / #printDeliverySlipsJp(:120) / #printDeliverySlipsEn(:123) / #orderExportForInput(:126) / #labelsExport(:129) | フロント挙動(form_bulkに各出力ボタン) | IT-...-018,020 |

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/pf-eccube3/app/Plugin/HareruyaEc/Controller/Admin/Order/ShippingStandbyController.php | sed -n '230,270p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   230	            'goods' => [
   231	                'total_quantity' => 0,
   232	                'items' => []
   233	            ],
   234	        ];
   235	
   236	        $class = [
   237	            0 => [
   238	                0 => 'high',
   239	                1 => 'middle',
   240	            ],
   241	            1 => [
   242	                1 => 'low',
   243	            ],
   244	        ];
   245	        foreach ($pickingItems as $item) {
   246	            $item['quantitySubtotal'] = $item['polyquantity'] / $item['colorCount'] / $item['categoryCount'];
   247	            $item['cardsetName'] = $item['storageCode'] ?? '';
   248	            $productName = $item['product_name'];
   249	            // サプライ品でない場合は商品名から略称・言語・状態・色・レアリティを取り除く
   250	            if (intval($item['categoryId']) !== Category::GOODS_ID && intval($item['categoryId']) !== Category::RESERVED_GOODS_ID) {
   251	                if (preg_match('/\[' . $item['cardsetName'] . '\]/', $productName, $matchedSetName)) {
   252	                    $productName = str_replace($matchedSetName[0], '', $productName);
   253	                } else {
   254	                    // 商品名内に[略称タグ]が含まれない場合は[～]を削除
   255	                    $productName = preg_replace('/\[.+?\]/', '', $productName);
   256	                }
   257	                $productName = str_replace('【' . $item['languageCode'] . '/' . $item['conditionCode'] . '】', '', $productName);
   258	                // マッチした各パターンごとに商品名を修正する(色のみの場合は余計なところまで置換する可能性があるため)
   259	                $item['abbreviationColorRarity'] = '';
   260	                if (preg_match(self::COLOR_RARITY_END_PATTERN, $productName, $matchedString)) {
   261	                    $item['abbreviationColorRarity'] = $matchedString[0];
   262	                    $productName = preg_replace(self::COLOR_RARITY_END_PATTERN, '', $productName);
   263	                } elseif (preg_match(self::COLOR_RARITY_BRANCKET_PATTERN, $productName, $matchedString)) {
   264	                    $item['abbreviationColorRarity'] = str_replace('(', '', $matchedString[0]);
   265	                    $productName = preg_replace(self::COLOR_RARITY_BRANCKET_PATTERN, '(', $productName);
   266	                } elseif (preg_match(self::COLOR_RARITY_IN_MIDDLE, $productName, $matchedString)) {
   267	                    $item['abbreviationColorRarity'] = trim($matchedString[0]);
   268	                    $productName = preg_replace(self::COLOR_RARITY_IN_MIDDLE, ' ', $productName);
   269	                } elseif (preg_match(self::COLOR_RARITY_OLD_TOKEN, $productName, $matchedString)) {
   270	                    $item['abbreviationColorRarity'] = str_replace('[', '', $matchedString[0]);

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbShippingStandbyRepository.php | sed -n '140,205p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   140	     * @param integer $standbyId
   141	     * @param integer[] $orderIdList
   142	     * @return array
   143	     */
   144	    public function generatePickingList($standbyId, $orderIdList = [])
   145	    {
   146	        $config = $this->getEntityManager()->getConfiguration();
   147	        $config->addCustomStringFunction('GROUP_CONCAT', 'DoctrineExtensions\Query\Mysql\GroupConcat');
   148	
   149	        $thresholdPrices = $this->getEntityManager()->getRepository('Plugin\HareruyaEc\Entity\MtbOption')
   150	            ->findByOptionKey([
   151	                MtbOption::ORDER_LIST_THRESHOLD_PRICE_1,
   152	                MtbOption::ORDER_LIST_THRESHOLD_PRICE_2
   153	            ]);
   154	
   155	        $qb = $this->createQueryBuilder('ss')
   156	        ->select(
   157	            'CASE WHEN cc IS NOT NULL THEN COUNT(DISTINCT cc.id) ELSE 1 END AS colorCount',
   158	            'CASE WHEN ct IS NOT NULL THEN COUNT(DISTINCT ct.category_id) ELSE 1 END AS categoryCount',
   159	            'od.product_name',
   160	            'SUM(od.quantity) AS polyquantity',
   161	            'pc.price02 AS price',
   162	            'cc.nameJp AS colorName',
   163	            'r.code AS rarityCode',
   164	            'prm.code AS promotionCode',
   165	            'lng.code AS languageCode',
   166	            'ccd.code AS conditionCode',
   167	            'stc.name AS storageCode',
   168	            'MIN(ct.category_id) AS categoryId',
   169	            'sn.name AS shelfNumberName'
   170	        )
   171	        ->addSelect('CASE WHEN od.price < :price1 THEN 1 ELSE 0 END AS class1')
   172	        ->addSelect('CASE WHEN od.price < :price2 THEN 1 ELSE 0 END AS class2')
   173	        ->join('ss.Orders', 'o', 'WITH', 'ss = :standbyId AND o IN (:orders)')
   174	        ->join('o.OrderDetails', 'od')
   175	        ->join('od.Product', 'p')
   176	        ->join('od.ProductClass', 'pc')
   177	        ->join('Plugin\HareruyaEc\Entity\DtbProductSub', 'ps', 'WITH', 'p.id = ps.productId')
   178	        ->join('Plugin\HareruyaEc\Entity\DtbProductSubClass', 'psc', 'WITH', 'pc.id = psc.productClassId')
   179	        ->join('p.ProductCategories', 'ct')
   180	        ->leftJoin('ps.storageCode', 'stc')
   181	        ->leftJoin('ps.cardDetail', 'cd')
   182	        ->leftJoin('psc.language', 'lng')
   183	        ->leftJoin('psc.cardCondition', 'ccd')
   184	        ->leftJoin('psc.shelfNumber', 'sn')
   185	        ->leftJoin('cd.rarity', 'r')
   186	        ->leftJoin('cd.promotion', 'prm')
   187	        ->leftJoin('cd.card', 'c')
   188	        ->leftJoin('c.colors', 'cc')
   189	        ->leftJoin('c.colorSequence', 'cs')
   190	        ->groupBy('pc.id, od.product_name')
   191	        ->setParameters([
   192	            'standbyId' => $standbyId,
   193	            'orders' => $orderIdList,
   194	            'price1' => $thresholdPrices[0]->getOptionValue(),
   195	            'price2' => $thresholdPrices[1]->getOptionValue(),
   196	        ]);
   197	
   198	        $this->sortProduct($qb, ['foilFlg']);
   199	
   200	        return $qb->getQuery()->getResult();
   201	    }
   202	
   203	    /**
   204	     * 受注管理 出荷指示リスト編集
   205	     * 納品書に記載する情報を取得

codex
監査結果: 候補2件はいずれも実ファイルで根拠を確認でき、誤検知・根拠不備は見つかりませんでした。追加で設計HTML後半、Twig、JS、CSS、関連ルート検索も確認しましたが、findingsに載せるべき明確な見落としは確認できません。

| 種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応 |
|---|---|---|---|---|
| FALSE_POSITIVE | ② 業務ルール・計算 | なし。設計はカテゴリIDでgoods判定、実装は`getSubInfosByProductClassIds`の有無で判定しており、候補どおり差分あり。実データ上の発生有無は確認不能だが、コード上の判定基準差は確認済み。 | 設計 `function_spec_html_preview/pf-eccube3/m05-21_admin_order_order_shipping_standby_picking_list_print.html:246`、実装 `src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:343`、`src/Eccube/Repository/ProductClassRepository.php:3042`、`src/Eccube/Repository/DtbShippingStandbyRepository.php:168` | 候補維持 |
| FALSE_POSITIVE | ④ DBカラム・DB操作 / ⑦ エラー処理 | なし。設計は閾値2件を一括取得して添字`[0]`/`[1]`利用、実装は個別`findOneBy`かつ欠落時0なので、候補どおり差分あり。 | 設計 `function_spec_html_preview/pf-eccube3/m05-21_admin_order_order_shipping_standby_picking_list_print.html:240`、`同:277`、実装 `src/Eccube/Repository/DtbShippingStandbyRepository.php:143`、`同:214` | 候補維持 |
| WEAK_EVIDENCE | 全体 | なし。候補のdesignRef/implRefはいずれも存在し、引用内容も周辺コード・設計節と整合。 | 上記各行、および `src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:348`、`同:375` | 対応不要 |
| MISSED | 全体 | なし。フロント挙動、印刷Twig、CSS、セッション、権限、404、入力扱いは設計と大きな差分なし。 | `src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:12`、`同:113`、`src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:1`、`html/template/admin/assets/js/function.js:210`、`html/template/admin/assets/css/pickinglist.css:15` | 対応不要 |
| SEVERITY | 全体 | 重要度誤りなし。goods分類差は出力ブロックと点数集計に直結するためhighは妥当。閾値取得差は異常系・設定依存の挙動差なのでlowは妥当。 | `src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:373`、`同:379`、`src/Eccube/Repository/DtbShippingStandbyRepository.php:143` | 候補維持 |

VERDICT: false_positive=0, missed=0, weak_evidence=0, 総合=信頼できる
tokens used
71,975
監査結果: 候補2件はいずれも実ファイルで根拠を確認でき、誤検知・根拠不備は見つかりませんでした。追加で設計HTML後半、Twig、JS、CSS、関連ルート検索も確認しましたが、findingsに載せるべき明確な見落としは確認できません。

| 種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応 |
|---|---|---|---|---|
| FALSE_POSITIVE | ② 業務ルール・計算 | なし。設計はカテゴリIDでgoods判定、実装は`getSubInfosByProductClassIds`の有無で判定しており、候補どおり差分あり。実データ上の発生有無は確認不能だが、コード上の判定基準差は確認済み。 | 設計 `function_spec_html_preview/pf-eccube3/m05-21_admin_order_order_shipping_standby_picking_list_print.html:246`、実装 `src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:343`、`src/Eccube/Repository/ProductClassRepository.php:3042`、`src/Eccube/Repository/DtbShippingStandbyRepository.php:168` | 候補維持 |
| FALSE_POSITIVE | ④ DBカラム・DB操作 / ⑦ エラー処理 | なし。設計は閾値2件を一括取得して添字`[0]`/`[1]`利用、実装は個別`findOneBy`かつ欠落時0なので、候補どおり差分あり。 | 設計 `function_spec_html_preview/pf-eccube3/m05-21_admin_order_order_shipping_standby_picking_list_print.html:240`、`同:277`、実装 `src/Eccube/Repository/DtbShippingStandbyRepository.php:143`、`同:214` | 候補維持 |
| WEAK_EVIDENCE | 全体 | なし。候補のdesignRef/implRefはいずれも存在し、引用内容も周辺コード・設計節と整合。 | 上記各行、および `src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:348`、`同:375` | 対応不要 |
| MISSED | 全体 | なし。フロント挙動、印刷Twig、CSS、セッション、権限、404、入力扱いは設計と大きな差分なし。 | `src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:12`、`同:113`、`src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:1`、`html/template/admin/assets/js/function.js:210`、`html/template/admin/assets/css/pickinglist.css:15` | 対応不要 |
| SEVERITY | 全体 | 重要度誤りなし。goods分類差は出力ブロックと点数集計に直結するためhighは妥当。閾値取得差は異常系・設定依存の挙動差なのでlowは妥当。 | `src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:373`、`同:379`、`src/Eccube/Repository/DtbShippingStandbyRepository.php:143` | 候補維持 |

VERDICT: false_positive=0, missed=0, weak_evidence=0, 総合=信頼できる

OpenAI Codex v0.142.5
--------
workdir: /home/y-saito/Developments/hareruya-design-docs
model: gpt-5.5
provider: openai
approval: never
sandbox: read-only
reasoning effort: medium
reasoning summaries: none
session id: 019f26ad-d525-7113-88af-0b7811bfee88
--------
user
あなたは設計書vs実装の差分監査に対する**批判的レビュア**です。読み取り専用で検証してください。創作禁止・確認できないものは「確認不能」と明記。

## 対象機能: m05-19_admin_order_order_shipping_standby_list_search
- 差分候補JSON(検証対象): /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-19_admin_order_order_shipping_standby_list_search.json
- 設計書HTML(正): /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html
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
まず差分候補と設計HTML、実装側の該当箇所を読みます。読み取り専用で、引用元の行番号が実在するかを先に固めます。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html | sed -n '1,260p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<!doctype html>
     2	<html lang="ja">
     3	<head>
     4	  <meta charset="utf-8">
     5	  <meta name="viewport" content="width=device-width, initial-scale=1">
     6	  <title>m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索） - 機能仕様書</title>
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
   187	<a class="lv3" href="#出荷指示一覧を初期表示する-GET-ページクエリなし">出荷指示一覧を初期表示する（GET、ページクエリなし）</a>
   188	<a class="lv3" href="#検索・一覧を表示する-POST-または-GET-でページ番号付き-または-search-からの再入">検索・一覧を表示する（POST、または GET でページ番号付き、または `search` からの再入）</a>
   189	<a class="lv2" href="#集計条件">集計条件</a>
   190	<a class="lv2" href="#出荷指示一覧クエリの判定順序">出荷指示一覧クエリの判定順序</a>
   191	<a class="lv2" href="#業務ルール・計算">業務ルール・計算</a>
   192	<a class="lv3" href="#入力項目">入力項目</a>
   193	<a class="lv3" href="#エッジケース">エッジケース</a>
   194	<a class="lv2" href="#データ整合性">データ整合性</a>
   195	<a class="lv2" href="#API-バッチ結果">API/バッチ結果</a>
   196	<a class="lv2" href="#入出力">入出力</a>
   197	<a class="lv2" href="#DBカラム">DBカラム</a>
   198	<a class="lv3" href="#DB操作">DB操作</a>
   199	<a class="lv2" href="#バリデーション">バリデーション</a>
   200	<a class="lv2" href="#権限・認可">権限・認可</a>
   201	<a class="lv2" href="#画面遷移">画面遷移</a>
   202	<a class="lv3" href="#遷移時に引き継ぐ状態">遷移時に引き継ぐ状態</a>
   203	<a class="lv2" href="#エラー処理">エラー処理</a>
   204	<a class="lv2" href="#試行制限">試行制限</a>
   205	<a class="lv2" href="#ログ・監査">ログ・監査</a>
   206	<a class="lv3" href="#ログに出してはいけないもの">ログに出してはいけないもの</a>
   207	<a class="lv2" href="#セッション">セッション</a>
   208	<a class="lv3" href="#本機能におけるセッション">本機能におけるセッション</a>
   209	<a class="lv3" href="#セッションへ保存しない情報">セッションへ保存しない情報</a>
   210	<a class="lv2" href="#Cookie">Cookie</a>
   211	<a class="lv2" href="#排他制御・トランザクション">排他制御・トランザクション</a>
   212	<a class="lv2" href="#調査補助-grep-用-主説明の正典ではない">調査補助（grep 用。主説明の正典ではない）</a>
   213	<a class="lv3" href="#HTTPルート名とパス-コード探索用・旧入口節より退避">HTTPルート名とパス（コード探索用・旧入口節より退避）</a></nav>
   214	    </aside>
   215	    <main class="doc-content">
   216	      <header class="page-header">
   217	        <p class="crumb">Source:<br>/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.md</p>
   218	        <h1>m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）</h1>
   219	      </header>
   220	      <h2 id="概要">概要</h2>
   221	<p>管理画面「受注管理」配下の「出荷指示」において、既に作成された出荷指示リスト（<code>dtb_shipping_standby</code>）を条件で絞り込み、一覧・ページ分割・並び順・表示件数をセッションに保持しながら表示する機能である。同一 HTML ページにはリスト生成用の別フォームも置かれるが、本書は検索フォーム送受信・一覧表示・セッション・クエリ組み立てに限定する。</p>
   222	<p>本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。ec-cube-enterpriseのコア実装を確認値とする。</p>
   223	<p>対象はブラウザ経由の管理画面に限定する。</p>
   224	<p>コントローラのメソッド名は本文の主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。</p>
   225	<p>本機能のカスタマイズ区分は現行踏襲であり、出荷指示機能は現行リポ（pf-eccube3 の HareruyaEc プラグイン）と移行先（ec-cube-enterprise コア）の双方に同名で実装される。挙動は現行リポの実装を踏襲し、DB（永続化先のテーブル・列）は ec-cube-enterprise の実装を正とする。</p>
   226	<hr>
   227	<h2 id="リニューアル移行時の扱い">リニューアル移行時の扱い</h2>
   228	<p>出荷指示リスト検索は、現行は pf-eccube3 の HareruyaEc プラグインに、移行先は ec-cube-enterprise コアに同名で実装される。検索・並び替えの対象となる出荷指示リスト（<code>dtb_shipping_standby</code>）・受注（<code>dtb_order</code>）・受注タイプマスタ（<code>mtb_order_type</code>）は、両者で同一スキーマである。検索条件・並び順に用いる列（<code>dtb_shipping_standby.id</code>・<code>create_date</code>・<code>update_date</code>・<code>order_type_id</code>、<code>dtb_order.id</code>、<code>mtb_order_type.id</code>）は ec-cube-enterprise の定義を正とする。現行と移行先で差異が判明した場合は、DB記述は ec-cube-enterprise 実装を正とする。</p>
   229	<hr>
   230	<h2 id="利用者視点の入口">利用者視点の入口</h2>
   231	<div class="table-wrap"><table><thead><tr><th>入口</th><th>URLエンドポイント</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>ナビ「出荷指示」</td><td><code>GET /{admin_route}/standby/search</code></td><td>ページクエリに正のページ番号が無ければ、空の検索フォームと生成カードを返し、一覧ブロックは描画しない（<code>pagination</code> が空相当）。</td></tr><tr><td>「検索する」ボタン</td><td>通常 <code>POST /{admin_route}/standby/search</code>（フォームの <code>action</code> は <code>path('admin_shipping_standby', { page_no: 1 })</code> によりクエリに <code>page_no=1</code> が付く場合がある）</td><td>送信内容を処理し、条件とソートで一覧を 1 ページ目から表示。条件とページ情報をセッションへ保存する。</td></tr><tr><td>ページネーションのリンク</td><td><code>GET /{admin_route}/standby/search?page_no=N</code>（他に既存クエリがマージされる）</td><td>セッションの検索条件とソートを復元し、N ページ目を表示する。</td></tr><tr><td>表示件数プルダウン</td><td>各 <code>option</code> の <code>value</code> は <code>GET /{admin_route}/standby/search?page_no=1&amp;page_count=…</code> 形式の URL 文字列</td><td>他一覧画面では <code>#page_count_pulldown</code> の <code>change</code> で <code>location.href</code> を変える実装があるが、当 <code>index.twig</code> の <code>javascript</code> ブロックは空であり、同一パターンのハンドラは載っていない。プルダウンだけでは自動遷移しない実装である。</td></tr><tr><td>出荷指示番号のリンクまたは行メニューの編集</td><td><code>GET /{admin_route}/standby/{id}/edit</code></td><td>編集画面へ遷移（本書範囲外）。</td></tr><tr><td>パスパラメータ <code>page_no</code>（1 以上の数字）でページ指定。内部では <code>index</code> の `$pag…</td><td><code>GET /{admin_route}/standby/page/{page_no}</code></td><td>パスパラメータ <code>page_no</code>（1 以上の数字）でページ指定。内部では <code>index</code> の <code>$page_no</code> 引数が使われ、セッションから検索条件を復元して一覧を表示する経路として定義されている。</td></tr></tbody></table></div>
   232	<hr>
   233	<h2 id="フロント挙動">フロント挙動</h2>
   234	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>表示要素</td><td>ページタイトルは「出荷指示」、サブタイトルは受注管理。上部に折りたたみ可能な「生成」カード（注文 ID 範囲・受注日範囲・送信ボタン）。その下に「出荷指示リスト検索」カード。検索欄は出荷指示番号・注文番号ラベル付近の整数入力、登録日 From-To（単一行 datetime）、最終更新日 From-To、注文区分のチェックボックス群、「検索条件をクリア」リンク、「検索する」ボタン。結果部は件数見出し、表示件数セレクト、表列（出荷指示番号リンク・区分・注文件数・登録日・最終更新日・行メニュー）、<code>pager.twig</code>（<code>routes</code>: <code>admin_shipping_standby</code>）。0 件時は固定文言で「検索条件に該当するデータがありませんでした。」を見出しに近い形で出す。</td></tr><tr><td>JS 挙動</td><td>当テンプレート専用の <code>block javascript</code> は空。共通 <code>function.js</code> の <code>.search-clear</code> により、<code>#search_form</code> 内および <code>.search-box-inner</code> 内の input/select の値をクリアし、チェック・ラジオを外す。<code>_token</code> 以外の hidden も空にする。<code>select2</code> の見た目残骸を削除する処理が走る。</td></tr><tr><td>CSS・レイアウト</td><td>一覧の <code>.table-responsive</code> に <code>overflow: visible !important</code> を当ページ内 style で上書き。</td></tr><tr><td>モーダル・ポップアップ</td><td>各行付近に商品永久削除用と思われるモーダル断片がテンプレートに含まれる。出荷指示削除はメニューの anchor に <code>data-method="delete"</code> を付けた別系統の挙動に依存する。</td></tr></tbody></table></div>
   235	<hr>
   236	<h2 id="処理フロー">処理フロー</h2>
   237	<h3 id="出荷指示一覧を初期表示する-GET-ページクエリなし">出荷指示一覧を初期表示する（GET、ページクエリなし）</h3>
   238	<ol><li>管理画面の認証・共通制約を通過する。</li><li><code>index</code> でパス <code>page_no</code> が 0 のとき、クエリ <code>pageno</code> または <code>page_no</code> を確認する。いずれも正の整数でなければ次へ。</li><li>リクエストが GET のとき、空データの出荷指示検索フォームと空のリスト生成フォームを生成し、<code>pagination</code>・<code>pageMaxis</code> を空配列、<code>page_count</code> を設定 <code>eccube_default_page_count</code> で返す。</li></ol>
   239	<h3 id="検索・一覧を表示する-POST-または-GET-でページ番号付き-または-search-からの再入">検索・一覧を表示する（POST、または GET でページ番号付き、または <code>search</code> からの再入）</h3>
   240	<ol><li>管理画面の認証・共通制約を通過する。</li><li>検索トレイトの <code>search</code> でフォーム名 <code>admin_shipping_standby</code>（出荷指示一覧向け検索フォーム型）を <code>handleRequest</code> する。</li><li>クエリ優先で <code>sort</code>、なければセッション <code>eccube.admin.shipping_standby.sort</code>、なければ <code>default</code>。</li><li>同様に <code>order</code>、なければセッション <code>eccube.admin.shipping_standby.order</code>、なければ <code>DESC</code>。</li><li><code>order</code> が正規表現 <code>^(ASC|DESC|asc|desc)$</code> に一致しないとき、管理画面エラー <code>admin.error.sort</code> を積み、<code>index</code> を再呼び出しする。</li><li><code>mtb_page_max</code> 由来の表示件数一覧を取得し、セッションの <code>eccube.admin.shipping_standby.search.page_count</code> が許容一覧に無ければ既定ページ件数または一覧の先頭値に矯正する。</li><li>クエリ <code>page_count</code> が許容一覧に含まれるとき、セッションの表示件数を上書きする。</li><li>フォームの <code>getData</code> が null のとき、セッション <code>eccube.admin.shipping_standby.search</code> のビューデータをフォームへ再投入してデータを復元する。ビューデータも無ければ <code>index</code> に戻る。</li><li>検索データに <code>sort</code>・<code>order</code> を合成し、出荷指示リスト用リポジトリが検索条件からDoctrineの問い合わせビルダを返す。</li><li>セッションに現在ページ番号、検索ビューデータ、ソート、並び順、表示件数を書き込む。</li><li>ページネータで問い合わせをページ分割する。総件数が「現在ページの直前まででちょうど取り尽くせる」場合、ページ番号を 1 減らして再ページ分割する（最終ページで件数がなくなった直後の空画面回避）。</li><li><code>search</code> の戻りにリスト生成用フォーム型の空フォームビューをコントローラ側で合成し、Twigを描画する。</li></ol>
   241	<hr>
   242	<h2 id="集計条件">集計条件</h2>
   243	<div class="table-wrap"><table><thead><tr><th>指標</th><th>集計の要点</th></tr></thead><tbody><tr><td>一覧の総件数</td><td>ページネータが問い合わせビルダに対して数えた総件数と一覧の根拠となる問い合わせは同じ組み立て経路を使う。</td></tr><tr><td>一覧行の注文件数</td><td>エンティティの <code>Orders</code> コレクションに対する Twig の <code>count</code>（遅延読込の有無は Doctrine の状態に従う）。</td></tr></tbody></table></div>
   244	<hr>
   245	<h2 id="出荷指示一覧クエリの判定順序">出荷指示一覧クエリの判定順序</h2>
   246	<div class="table-wrap"><table><thead><tr><th>順序</th><th>処理</th><th>結果</th></tr></thead><tbody><tr><td>1</td><td><code>distinct</code> 付きで <code>dtb_shipping_standby</code> 行を起点に受注タイプを左外部結合する。</td><td>以降の条件の基礎集合。</td></tr><tr><td>2</td><td><code>sort</code> キーが <code>default</code>・<code>create_date</code>・<code>update_date</code> のいずれでもないとき <code>default</code> とみなす。</td><td><code>orderBy</code> 対象列が識別子・登録日時・更新日時のいずれかになる。</td></tr><tr><td>3</td><td><code>order</code> を大文字化し <code>ASC</code> のときだけ昇順、それ以外は降順。</td><td>並び順確定。</td></tr><tr><td>4</td><td><code>standby_id</code> が非空</td><td><code>s.id</code> がその値と一致する行だけ残す。</td></tr><tr><td>5</td><td><code>order_id</code> が非空</td><td><code>Orders</code> を結合し、受注の主キーが入力値と一致する行だけ残す。</td></tr><tr><td>6</td><td><code>create_date_from</code> が非空</td><td><code>s.createDate</code> がその日時以上。</td></tr><tr><td>7</td><td><code>create_date_to</code> が非空</td><td><code>s.createDate</code> がその日時以下。</td></tr><tr><td>8</td><td><code>update_date_from</code> が非空</td><td><code>s.updateDate</code> がその日時以上。</td></tr><tr><td>9</td><td><code>update_date_to</code> が非空</td><td><code>s.updateDate</code> がその日時以下。</td></tr><tr><td>10</td><td><code>order_type</code> が配列かつ要素に受注タイプマスタの行が含まれる</td><td>その ID 集合に <code>order_type_id</code> が含まれる行だけ残す。配列が空または実体化できなければ条件を付けない。</td></tr></tbody></table></div>
   247	<hr>
   248	<h2 id="業務ルール・計算">業務ルール・計算</h2>
   249	<div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>一意性</td><td>一覧は <code>dtb_shipping_standby</code> 行単位。<code>distinct</code> は結合による重複行抑止を意図する。</td></tr><tr><td>注文番号入力とクエリ</td><td>画面では「注文番号」ラベル側の文言を当てるが、リポジトリは <code>order_no</code> 文字列ではなく <code>dtb_order.id</code>（主キー）の数値一致で絞る（フォームキー <code>order_id</code>）。</td></tr></tbody></table></div>
   250	<p>本機能では金額集計や税率計算を行わない。</p>
   251	<h3 id="入力項目">入力項目</h3>
   252	<div class="table-wrap"><table><thead><tr><th>項目名</th><th>必須／任意</th><th>最大長</th><th>初期値</th><th>保存先・扱い</th></tr></thead><tbody><tr><td>出荷指示番号</td><td>任意</td><td>整数入力。桁は PHP 整数範囲に依存</td><td>空</td><td>フォームキー <code>standby_id</code>。非空時のみ識別子一致。セッション検索ビューに保持。</td></tr><tr><td>注文番号</td><td>任意</td><td>同上</td><td>空</td><td>フォームキー <code>order_id</code>。非空時のみ紐付く受注の主キー一致。画面ラベルは注文番号だが <code>order_no</code> ではない。セッション検索ビューに保持。</td></tr><tr><td>登録日（開始）</td><td>任意</td><td><code>single_text</code> の datetime。HTML5／ブラウザ依存の入力検証</td><td>空</td><td>キー <code>create_date_from</code>。非空時 <code>createDate</code> 下限。セッション検索ビューに保持。</td></tr><tr><td>登録日（終了）</td><td>任意</td><td>同上</td><td>空</td><td>キー <code>create_date_to</code>。非空時 <code>createDate</code> 上限。セッション検索ビューに保持。</td></tr><tr><td>最終更新日（開始）</td><td>任意</td><td>同上</td><td>空</td><td>キー <code>update_date_from</code>。非空時 <code>updateDate</code> 下限。セッション検索ビューに保持。</td></tr><tr><td>最終更新日（終了）</td><td>任意</td><td>同上</td><td>空</td><td>キー <code>update_date_to</code>。非空時 <code>updateDate</code> 上限。セッション検索ビューに保持。</td></tr><tr><td>注文区分</td><td>任意</td><td>チェックボックス複数</td><td>すべて未選択</td><td>フォームキー <code>order_type</code>。受注タイプマスタ行の配列。選択 ID のいずれかに一致（IN）。未選択なら条件なし。セッション検索ビューに保持。</td></tr></tbody></table></div>
   253	<p>テンプレートでは各日付ラベルに <code>admin.common.create_date</code> または <code>admin.common.update_date</code> が連結され、出荷指示番号・注文番号ラベルにも翻訳キーが連結される。</p>
   254	<h3 id="エッジケース">エッジケース</h3>
   255	<div class="table-wrap"><table><thead><tr><th>ケース</th><th>扱い</th></tr></thead><tbody><tr><td>ソート方向パラメータが不正</td><td>エラーフラッシュを積み <code>index</code> へ。以降の分岐はリクエストメソッド次第。</td></tr><tr><td>セッションに検索ビューが無くフォームデータも取れない</td><td><code>index</code> の初期表示へ。</td></tr><tr><td><code>order_type</code> にエンティティ以外が混じる</td><td>ID 抽出で無視され、残りが空なら注文区分条件は付かない。</td></tr><tr><td>表示件数プルダウン</td><td>前述のとおり change ハンドラが無く、選択だけでは遷移しない。</td></tr></tbody></table></div>
   256	<hr>
   257	<h2 id="データ整合性">データ整合性</h2>
   258	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>一覧と DB</td><td>一覧表示時点のトランザクション分離レベルにおける <code>dtb_shipping_standby</code> の投影。他セッションの更新と一覧の整合は保証しない。</td></tr><tr><td>注文件数</td><td>コレクション <code>count</code> は一覧描画時のロード状態に依存し、別端末の受注紐付け変更とは一致しない場合がある。</td></tr></tbody></table></div>
   259	<hr>
   260	<h2 id="API-バッチ結果">API/バッチ結果</h2>

exec
/bin/bash -lc "sed -n '1,240p' /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-19_admin_order_order_shipping_standby_list_search.json" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
{
  "functionId": "m05-19_admin_order_order_shipping_standby_list_search",
  "title": "m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）",
  "domain": "m05",
  "kind": "admin",
  "designHtml": "function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html",
  "findings": [
    {
      "dimension": "⑤画面遷移・引き継ぎ状態（フロントJS挙動）",
      "severity": "med",
      "designRef": "function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html:231",
      "designQuote": "当 index.twig の javascript ブロックは空であり、同一パターンのハンドラは載っていない。プルダウンだけでは自動遷移しない実装である。",
      "implRef": "src/Eccube/Resource/template/admin/ShippingStandby/index.twig:21-32",
      "difference": "設計は「block javascript は空・#page_count_pulldown の change ハンドラは無く、選択だけでは遷移しない」とする（HTML:234『当テンプレート専用の block javascript は空』、HTML:255『change ハンドラが無く、選択だけでは遷移しない』も同旨）。しかし enterprise の index.twig は block javascript 内に $('#page_count_pulldown').on('change', ...) を実装し、選択した option の value(URL)へ window.location.href で自動遷移する。設計の記述と実装のUI挙動が逆である。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "src/Eccube/Resource/template/admin/ShippingStandby/index.twig:21-32 に block javascript が存在し、24-29行で $('#page_count_pulldown').on('change', function(){ const targetUrl=$(this).val(); if(targetUrl){ window.location.href=targetUrl; } }); を実装。design HTML:231/234/255 は『block javascript は空・change ハンドラなし・自動遷移しない』と記述しており逆。"
    },
    {
      "dimension": "①ルート/パス（表示件数プルダウンのoption value）",
      "severity": "med",
      "designRef": "function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html:231",
      "designQuote": "各 option の value は GET /{admin_route}/standby/search?page_no=1&page_count=… 形式の URL 文字列",
      "implRef": "src/Eccube/Resource/template/admin/ShippingStandby/index.twig:217",
      "difference": "設計は option の value を admin_shipping_standby ルート（/{admin_route}/standby/search?page_no=1&page_count=…）形式とする。実装は path('admin_shipping_standby_page', {'page_no':1,'page_count':pageMax.name}) を出力し、生成URLは /{admin_route}/standby/page/1?page_count=… というパスパラメータ経路（別ルート名 admin_shipping_standby_page）になる。ルート/URL形式が設計と異なる。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "index.twig:217 に value=\"{{ path('admin_shipping_standby_page', {'page_no': 1, 'page_count': pageMax.name}) }}\"。ShippingStandbyController.php:93-107 でルート定義が admin_shipping_standby=/standby/search (GET,POST)、admin_shipping_standby_page=/standby/page/{page_no} (GET) と別ルート・別パス。設計 HTML:231/309 が想定する standby/search?page_no=1&page_count=… とは異なる。"
    },
    {
      "dimension": "⑤画面遷移・引き継ぎ状態（0件時の表示文言）",
      "severity": "low",
      "designRef": "function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html:234",
      "designQuote": "0 件時は固定文言で「検索条件に該当するデータがありませんでした。」を見出しに近い形で出す。",
      "implRef": "src/Eccube/Resource/template/admin/ShippingStandby/index.twig:315-320",
      "difference": "設計は0件時に固定文言『検索条件に該当するデータがありませんでした。』を出すとする。実装は翻訳キー admin.common.search_no_result（実文言『検索条件に合致するデータが見つかりませんでした』）と admin.common.search_try_change_condition（『検索条件を変えて、再度検索をお試しください』）の2行構成で表示し、さらに has_errors 分岐（admin.common.search_invalid_condition『検索条件に誤りがあります』, index.twig:307-312）を別途持つ。設計の単一固定文言とは表示文言も構造も異なる（翻訳文言を再検証済みで一致しないことを確認）。",
      "confidence": "med",
      "verdict": "CONFIRMED",
      "evidence": "index.twig:314-320 が {% else %} 分岐で admin.common.search_no_result + admin.common.search_try_change_condition の2行、index.twig:306-312 が {% elseif has_errors %} 分岐で admin.common.search_invalid_condition + search_try_change_condition。messages.ja.yaml:1688-1690 で search_invalid_condition=『検索条件に誤りがあります』、search_no_result=『検索条件に合致するデータが見つかりませんでした』、search_try_change_condition=『検索条件を変えて、再度検索をお試しください』。設計の固定文言『検索条件に該当するデータがありませんでした。』とは文言・行数・分岐構造が不一致。"
    }
  ]
}

exec
/bin/bash -lc 'rg -n "shipping_standby|ShippingStandby|出荷待ち|standby" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /home/y-saito/Developments/ec-cube-enterprise/app 2>/dev/null' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000001.php:38:                'INSERT INTO dtb_delivery (id, base_info_id, creator_id, sale_type_id, name, service_name, description, confirm_url, sort_no, visible, create_date, update_date, service_name_en, max_size, lead_time, is_abroad, is_shipping_standby_list_exclusion)
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000001.php:39:                 VALUES (:id, :base_info_id, :creator_id, :sale_type_id, :name, :service_name, :description, :confirm_url, :sort_no, :visible, :create_date, :update_date, :service_name_en, :max_size, :lead_time, :is_abroad, :is_shipping_standby_list_exclusion)
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000001.php:56:                    is_shipping_standby_list_exclusion = EXCLUDED.is_shipping_standby_list_exclusion',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000001.php:75:                    'is_shipping_standby_list_exclusion' => Types::BOOLEAN,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000001.php:123:                'is_shipping_standby_list_exclusion' => false,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:31:use Eccube\Form\Type\Admin\Order\GenerateShippingStandbyType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:39:use Eccube\Repository\DtbShippingStandbyRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:54:use Eccube\Service\Admin\Order\GenerateShippingStandbyListAction;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:56:use Eccube\Service\Csv\Exporter\ShippingStandbyCsvExporterService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:104:        protected DtbShippingStandbyRepository $dtbShippingStandbyRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:105:        protected ShippingStandbyCsvExporterService $shippingStandbyCsvExporterService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:109:        protected GenerateShippingStandbyListAction $generateShippingStandbyListAction,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:743:        $DeliverySlips = $this->dtbShippingStandbyRepository->generateDeliverySlips($lang !== 'ja', $ids);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:746:        return $this->render("@admin/ShippingStandby/delivery_slips.{$lang}.twig", [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:757:    #[Route(path: '/%eccube_admin_route%/standby/labels', name: 'admin_labels_export', methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:786:    #[Route(path: '/%eccube_admin_route%/order/generate/standby', name: 'admin_order_generate_standby_list', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:787:    public function generateShippingStandbyList(Request $request): RedirectResponse
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:789:        $form = $this->createForm(GenerateShippingStandbyType::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:795:            return $this->redirectToRoute('admin_shipping_standby');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:800:        $DeliveryList = $this->deliveryRepository->findByIsShippingStandbyListExclusion(false);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:806:            return $this->redirectToRoute('admin_shipping_standby');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:810:            $this->generateShippingStandbyListAction->handle(new GenerateListInput(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:817:            return $this->redirectToRoute('admin_shipping_standby');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:822:        return $this->redirectToRoute('admin_shipping_standby');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:42:use Eccube\Repository\DtbShippingStandbyRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:104:     * @param DtbShippingStandbyRepository       $dtbShippingStandbyRepository 編集画面用：納品書
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:125:        private readonly DtbShippingStandbyRepository $dtbShippingStandbyRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:1333:        $DeliverySlips = $this->dtbShippingStandbyRepository->generateDeliverySlips($lang !== 'ja', [$Shipping->getId()]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:1336:        return $this->render("@admin/ShippingStandby/delivery_slips.{$lang}.twig", [
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260604000002.php:33:INSERT INTO dtb_delivery (id, base_info_id, creator_id, sale_type_id, name, service_name, description, confirm_url, sort_no, visible, create_date, update_date, service_name_en, max_size, lead_time, is_abroad, is_shipping_standby_list_exclusion) VALUES
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260604000002.php:59:    is_shipping_standby_list_exclusion = EXCLUDED.is_shipping_standby_list_exclusion;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:22:use Eccube\Form\Type\Admin\Order\GenerateShippingStandbyType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:23:use Eccube\Form\Type\Admin\Order\ShippingStandbyType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:24:use Eccube\Form\Type\Admin\ShippingStandbyCommentType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:26:use Eccube\Repository\DtbShippingStandbyRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:32:use Eccube\Service\Admin\ShippingStandby\ActionInput\UpdateCommentInput;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:33:use Eccube\Service\Admin\ShippingStandby\DeleteListAction;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:34:use Eccube\Service\Admin\ShippingStandby\UpdateCommentAction;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:44:class ShippingStandbyController extends AbstractController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:58:     * ShippingStandbyController constructor.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:62:     * @param DtbShippingStandbyRepository $shippingStandbyRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:68:        protected DtbShippingStandbyRepository $shippingStandbyRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:81:        $this->sessionKey = 'shipping_standby';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:82:        $this->formType = ShippingStandbyType::class;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:84:        $this->formName = 'admin_shipping_standby';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:85:        $this->redirect = 'admin_shipping_standby';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:95:            path: '/%eccube_admin_route%/standby/search',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:96:            name: 'admin_shipping_standby',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:102:            path: '/%eccube_admin_route%/standby/page/{page_no}',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:103:            name: 'admin_shipping_standby_page',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:108:    #[Template(template: '@admin/ShippingStandby/index.twig')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:128:            $form = $this->createForm(ShippingStandbyType::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:130:            $builder = $this->formFactory->createBuilder(GenerateShippingStandbyType::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:153:    #[Route(path: '/%eccube_admin_route%/standby/{id}/edit', name: 'admin_shipping_standby_edit', requirements: ['id' => '\d+'], methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:172:            ShippingStandbyCommentType::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:176:        return $this->render('@admin/ShippingStandby/edit.twig', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:191:    #[Route(path: '/%eccube_admin_route%/standby/{id}/update', name: 'admin_shipping_standby_update', requirements: ['id' => '\d+'], methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:194:        $ShippingStandby = $this->shippingStandbyRepository->find($id);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:195:        if ($ShippingStandby === null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:199:        $form = $this->createForm(ShippingStandbyCommentType::class, $ShippingStandby);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:205:            return $this->redirectToRoute('admin_shipping_standby_edit', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:212:                ShippingStandby: $ShippingStandby,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:219:            return $this->redirectToRoute('admin_shipping_standby_edit', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:226:        return $this->redirectToRoute('admin_shipping_standby_edit', ['id' => $id]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:236:    #[Route(path: '/%eccube_admin_route%/standby/{id}/delete', name: 'admin_shipping_standby_delete', requirements: ['id' => '\d+'], methods: ['DELETE'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:253:            return $this->redirectToRoute('admin_shipping_standby_edit', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:261:        return !empty($pageNo) ? $this->redirectToRoute('admin_shipping_standby_search', ['page_no' => $pageNo]) : ($this->redirectToRoute('admin_shipping_standby'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:270:        $builder = $this->formFactory->createBuilder(GenerateShippingStandbyType::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:284:    #[Route(path: '/%eccube_admin_route%/standby/{id}/print/picking', name: 'admin_shipping_standby_print_picking_list', requirements: ['id' => '\d+'], methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:383:        return $this->render('@admin/ShippingStandby/picking_list.twig', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:400:    #[Route(path: '/%eccube_admin_route%/standby/{id}/print/delivery/{lang}', name: 'admin_shipping_standby_print_delivery_slips', requirements: ['id' => '\d+', 'lang' => 'ja|en'], methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:403:        $ShippingStandby = $this->shippingStandbyRepository->findOneById($id);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:404:        if ($ShippingStandby === null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:416:        foreach ($ShippingStandby->getOrders() as $Order) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:439:        return $this->render("@admin/ShippingStandby/delivery_slips.{$lang}.twig", [
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube_nav.yaml:119:                    url: admin_shipping_standby
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/SearchControllerTrait.php:33:use Eccube\Repository\DtbShippingStandbyRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/SearchControllerTrait.php:60:    protected CustomerRepository|DtbArchetypeRepository|DtbBuyOrderRepository|DtbBuyOrderStockHistoryRepository|DtbDeckRepository|DtbInventoryPlanRepository|DtbPriceHistoryRepository|MtbCardRepository|DtbShippingStandbyRepository $repository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:21:use Eccube\Entity\DtbShippingStandby;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:29: * @extends AbstractRepository<DtbShippingStandby>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:31:class DtbShippingStandbyRepository extends AbstractRepository implements ServiceEntityRepositoryInterface
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:48:        parent::__construct($registry, DtbShippingStandby::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:79:        if (!empty($searchData['standby_id'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:80:            $qb->andWhere('s.id = :standbyId')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:81:                ->setParameter('standbyId', $searchData['standby_id']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:136:     * @param int $standbyId
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:141:    public function generatePickingList(int $standbyId, array $orderIdList = []): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:173:        ->join('ss.Orders', 'o', 'WITH', 'ss = :standbyId AND o IN (:orders)')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:212:        ->setParameter('standbyId', $standbyId)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/GenerateShippingStandbyListAction.php:20:use Eccube\Entity\DtbShippingStandby;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/GenerateShippingStandbyListAction.php:26:class GenerateShippingStandbyListAction
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/GenerateShippingStandbyListAction.php:47:                $shippingStandby = new DtbShippingStandby();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/ShippingStandby/ActionInput/UpdateCommentInput.php:16:namespace Eccube\Service\Admin\ShippingStandby\ActionInput;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/ShippingStandby/ActionInput/UpdateCommentInput.php:18:use Eccube\Entity\DtbShippingStandby;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/ShippingStandby/ActionInput/UpdateCommentInput.php:24:        public DtbShippingStandby $ShippingStandby,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/ShippingStandby/DeleteListAction.php:16:namespace Eccube\Service\Admin\ShippingStandby;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/ShippingStandby/DeleteListAction.php:19:use Eccube\Entity\DtbShippingStandby;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/ShippingStandby/DeleteListAction.php:30:    public function handle(DtbShippingStandby $shippingStandby): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/ShippingStandby/UpdateCommentAction.php:16:namespace Eccube\Service\Admin\ShippingStandby;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/ShippingStandby/UpdateCommentAction.php:19:use Eccube\Service\Admin\ShippingStandby\ActionInput\UpdateCommentInput;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/ShippingStandby/UpdateCommentAction.php:33:            $input->ShippingStandby
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/ShippingStandby/UpdateCommentAction.php:37:            $this->entityManager->persist($input->ShippingStandby);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingStandbyCommentType.php:24:class ShippingStandbyCommentType extends AbstractType
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingStandbyCommentType.php:49:        return 'admin_shipping_standby_edit';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryType.php:75:            ->add('is_shipping_standby_list_exclusion', CheckboxType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryType.php:77:                'label' => 'admin.setting.shop.delivery.is_shipping_standby_list_exclusion',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Order/GenerateShippingStandbyType.php:23:class GenerateShippingStandbyType extends AbstractType
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Order/GenerateShippingStandbyType.php:64:        return 'admin_generate_shipping_standby';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Order/ShippingStandbyType.php:25:class ShippingStandbyType extends AbstractType
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Order/ShippingStandbyType.php:67:            ->add('standby_id', IntegerType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Order/ShippingStandbyType.php:90:        return 'admin_shipping_standby';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/RestockListCsvRowFormatter.php:154:     * 受注管理ピッキングリストと同様のロジック（ShippingStandbyController参照）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ShippingStandbyCsvExporterService.php:22:class ShippingStandbyCsvExporterService
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:23:use Eccube\Repository\DtbShippingStandbyRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:25:#[ORM\Table(name: 'dtb_shipping_standby')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:27:#[ORM\Entity(repositoryClass: DtbShippingStandbyRepository::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:28:class DtbShippingStandby extends AbstractEntity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:54:    #[ORM\JoinTable(name: 'dtb_order_shipping_standby')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:55:    #[ORM\JoinColumn(name: 'standby_id', referencedColumnName: 'id')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:70:    public function setMemberId(int $memberId): DtbShippingStandby
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:82:    public function setCreateDate(?\DateTime $createDate): DtbShippingStandby
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:94:    public function setUpdateDate(?\DateTime $updateDate): DtbShippingStandby
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:106:    public function setComment(?string $comment): DtbShippingStandby
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:118:    public function setOrderType(MtbOrderType $OrderType): DtbShippingStandby
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:130:    public function addOrder(Order $order): DtbShippingStandby
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:145:    public function setOrders(Collection $orders): DtbShippingStandby
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:484:        #[ORM\Column(name: 'is_shipping_standby_list_exclusion', type: Types::BOOLEAN, options: ['default' => false, 'comment' => '出荷指示リスト除外フラグ'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:485:        private bool $isShippingStandbyListExclusion = false;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:487:        public function isShippingStandbyListExclusion(): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:489:            return $this->isShippingStandbyListExclusion;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:492:        public function setIsShippingStandbyListExclusion(bool $isShippingStandbyListExclusion): Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:494:            $this->isShippingStandbyListExclusion = $isShippingStandbyListExclusion;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOrderType.php:23:use Eccube\Entity\DtbShippingStandby;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOrderType.php:52:     * @var Collection<int, DtbShippingStandby>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOrderType.php:99:     * @param Eccube\EntityDtbShippingStandby $shippingStandby
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOrderType.php:104:    public function addOrder(Eccube\EntityDtbShippingStandby $shippingStandby)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOrderType.php:115:     * @param Eccube\EntityDtbShippingStandby $shippingStandby
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOrderType.php:118:    public function removeOrder(Eccube\EntityDtbShippingStandby $shippingStandby)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOrderType.php:125:     * @param Collection<int, DtbShippingStandby> $shippingStandby
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOrderType.php:127:    public function setShippingStandby(Collection $shippingStandby): MtbOrderType
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOrderType.php:135:     * @return Collection<int, DtbShippingStandby>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOrderType.php:137:    public function getShippingStandby(): Collection
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:38:                {{'admin.picking_item_list.shipping_standby_id'|trans }}：{{ shippingStandby.id }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:124:                {{'admin.picking_item_list.shipping_standby_id'|trans }}：{{ shippingStandby.id }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:210:                {{'admin.picking_item_list.shipping_standby_id'|trans }}：{{ shippingStandby.id }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:294:                {{'admin.picking_item_list.shipping_standby_id'|trans }}：{{ shippingStandby.id }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:2:{% set menus = ['order', 'shipping_standby'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:4:{% block sub_title %}{{ 'admin.order.shipping_standby_export'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:14:                $('#form_bulk').attr('action', "{{ url('admin_shipping_standby_print_picking_list', { 'id' : shippingStandby.id }) }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:23:                $('#form_bulk').attr('action', "{{ url('admin_shipping_standby_print_delivery_slips' ,{'id' : shippingStandby.id, 'lang' : 'ja' }) }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:31:                $('#form_bulk').attr('action', "{{ url('admin_shipping_standby_print_delivery_slips' ,{'id' : shippingStandby.id, 'lang' : 'en' }) }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:72:                            <form method='POST' action='{{ path('admin_shipping_standby_update', {'id': shippingStandby.id}) }}'>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:77:                                            <p id="number_info_box__standby_id">{{ 'admin.order.shipping_standby_no'|trans }}：{{ shippingStandby.id }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:97:                                            <a href="{{ path('admin_shipping_standby_delete', { 'id': shippingStandby.id }) }}" class="btn btn-danger w-100" {{ csrf_token_for_anchor() }} data-method="delete">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:98:                                                {{ 'admin.order.shipping_standby_delete'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:118:                                                        {{ 'admin.order.shipping_standby_list_print'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:146:                                                                <th id="result_list_main__header_payment_total">{{ 'admin.order.shipping_standby_order_payment_total'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:147:                                                                <th id="result_list_main__header_total_count">{{ 'admin.order.shipping_standby_order_quantity'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:148:                                                                <th id="result_list_main__header_order_date">{{ 'admin.order.shipping_standby_order_date'|trans }}</th>
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
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2650:admin.picking_item_list.shipping_standby_id: 出荷指示リスト番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3057:admin.setting.shop.delivery.is_shipping_standby_list_exclusion: 出荷指示リストから除外
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:562:                                    {{ form_widget(form.is_shipping_standby_list_exclusion) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:563:                                    {{ form_errors(form.is_shipping_standby_list_exclusion) }}

codex
候補3件はいずれも参照行自体は存在します。次に、候補以外の重要節に見落としがないか、コントローラ・共通検索trait・リポジトリ・翻訳を実装根拠として確認します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig | sed -n '1,340p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	{#
     2	This file is part of EC-CUBE
     3	
     4	Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved.
     5	
     6	http://www.ec-cube.co.jp/
     7	
     8	For the full copyright and license information, please view the LICENSE
     9	file that was distributed with this source code.
    10	#}
    11	{% extends '@admin/default_frame.twig' %}
    12	
    13	{% set menus = ['order', 'shipping_instructions'] %}
    14	
    15	{% block title %}{{ 'admin.order.shipping_instructions'|trans }}{% endblock %}
    16	{% block sub_title %}{{ 'admin.order.order_management'|trans }}{% endblock %}
    17	
    18	{% form_theme searchForm '@admin/Form/bootstrap_4_horizontal_layout.html.twig' %}
    19	{% form_theme generateForm '@admin/Form/bootstrap_4_horizontal_layout.html.twig' %}
    20	
    21	{% block javascript %}
    22	    <script nonce="{{ csp_nonce }}">
    23	        $(function() {
    24	            $('#page_count_pulldown').on('change',  function () {
    25	                const targetUrl = $(this).val();
    26	                if (targetUrl) {
    27	                    window.location.href = targetUrl;
    28	                }
    29	            });
    30	        });
    31	    </script> 
    32	{% endblock %}
    33	
    34	{% block main %}
    35	    <style>
    36	        .table-responsive {
    37	            overflow: visible !important;
    38	        }
    39	    </style>
    40	    <div class="c-contentsArea__cols">
    41	        <div class="c-contentsArea__primaryCol">
    42	            <div class="c-primaryCol">
    43	                {# 生成用フォーム #}
    44	                <form id="generate_form" method="post"
    45	                      action="{{ path('admin_order_generate_standby_list') }}">
    46	                    {{ form_widget(generateForm._token) }}
    47	                    <div class="row mb-4">
    48	                        <div class="col-md-12">
    49	                            <div class="card rounded border shadow-sm mb-4">
    50	                                <div class="card-header bg-white">
    51	                                    <div class="row">
    52	                                        <div class="card-title col-8 h5 font-weight-bold">
    53	                                            {{ 'admin.order.shipping_standby_generate_list'|trans }}
    54	                                        </div>
    55	                                        <div class="col-4 text-end"><a data-bs-toggle="collapse" href="#generateList" aria-expanded="false" aria-controls="generateList"><i class="fa fa-angle-up fa-lg"></i></a></div>
    56	                                    </div>
    57	                                </div>
    58	                                <div class="collapse ec-cardCollapse" id="generateList">
    59	                                    <div class="card-body">
    60	                                        <div class="row mb-4">
    61	                                            <div class="col-12">
    62	                                                <div class="row align-items-center">
    63	                                                    <div class="col-auto">
    64	                                                        <label for="{{ generateForm.order_id_from.vars.id }}" 
    65	                                                            class="form-label">{{ generateForm.order_id_from.vars.label }}</label>
    66	                                                    </div>
    67	                                                    <div class="col">
    68	                                                        {{ form_widget(generateForm.order_id_from) }} 
    69	                                                        {{ form_errors(generateForm.order_id_from) }}
    70	                                                    </div>
    71	                                                    <div class="col-auto"><span>{{ 'admin.common.separator__range'|trans }}</span></div>
    72	                                                    <div class="col">
    73	                                                        {{ form_widget(generateForm.order_id_to) }}
    74	                                                        {{ form_errors(generateForm.order_id_to) }}
    75	                                                    </div>
    76	                                                </div>
    77	                                            </div>
    78	                                        </div>
    79	                                        <div class="row mb-4">
    80	                                            <div class="col-12">
    81	                                                <div class="row align-items-center">
    82	                                                    <div class="col-auto">
    83	                                                        <label for="{{ generateForm.order_date_from.vars.id }}" 
    84	                                                            class="form-label">{{ generateForm.order_date_from.vars.label }}</label>
    85	                                                    </div>
    86	                                                    <div class="col">
    87	                                                        {{ form_widget(generateForm.order_date_from) }} 
    88	                                                        {{ form_errors(generateForm.order_date_from) }}
    89	                                                    </div>
    90	                                                    <div class="col-auto"><span>{{ 'admin.common.separator__range'|trans }}</span></div>
    91	                                                    <div class="col">
    92	                                                        {{ form_widget(generateForm.order_date_to) }}
    93	                                                        {{ form_errors(generateForm.order_date_to) }}
    94	                                                    </div>
    95	                                                </div>
    96	                                            </div>
    97	                                        </div>
    98	                                        <div class="row mb-4">
    99	                                            <div class="text-center my-4 admin-product-search-submit-wrap">
   100	                                                <button class="btn btn-ec-conversion px-5" type="submit" form="generate_form">
   101	                                                    {{ 'admin.order.shipping_standby_generate_list'|trans }}
   102	                                                </button>
   103	                                            </div>
   104	                                        </div>
   105	                                    </div>
   106	                                </div>
   107	                            </div>
   108	                        </div>
   109	                    </div>
   110	                </form>
   111	
   112	                {# 一覧用フォーム #}
   113	                <div class="search-box-inner">
   114	                    <div class="row mb-4">
   115	                        <div class="col-md-12">
   116	                            <div class="card rounded border shadow-sm mb-4">
   117	                                <div class="card-header bg-white">
   118	                                    <h3 class="card-title mb-0 h5 font-weight-bold">
   119	                                        {{ 'admin.order.shipping_standby_search'|trans }}
   120	                                    </h3>
   121	                                </div>
   122	                                <form id="search_form" method="post"
   123	                                    action="{{ path('admin_shipping_standby', { page_no: 1 }) }}">
   124	                                    {{ form_widget(searchForm._token) }}
   125	                                    <div class="card-body">
   126	                                        <div class="row mb-4">
   127	                                            <div class="col-md-6">
   128	                                                <label for="{{ searchForm.standby_id.vars.id }}"
   129	                                                    class="form-label">{{ searchForm.standby_id.vars.label }}{{ 'admin.order.shipping_standby_no'|trans }}</label>
   130	                                                {{ form_widget(searchForm.standby_id) }}
   131	                                            </div>
   132	                                            <div class="col-md-6">
   133	                                                <label for="{{ searchForm.order_id.vars.id }}"
   134	                                                    class="form-label">{{ searchForm.order_id.vars.label }}{{ 'admin.common.order_number'|trans }}</label>
   135	                                                {{ form_widget(searchForm.order_id) }}
   136	                                            </div>
   137	                                        </div>
   138	                                        <div class="row mb-4">
   139	                                            <div class="col-6">
   140	                                                <div class="row align-items-center">
   141	                                                    <label for="{{ searchForm.create_date_from.vars.id }}"
   142	                                                        class="form-label">{{ searchForm.create_date_from.vars.label }}{{ 'admin.common.create_date'|trans }}</label>
   143	                                                    <div class="col">
   144	                                                        {{ form_widget(searchForm.create_date_from) }} 
   145	                                                        {{ form_errors(searchForm.create_date_from) }}
   146	                                                    </div>
   147	                                                    <div class="col-auto"><span>{{ 'admin.common.separator__range'|trans }}</span></div>
   148	                                                    <div class="col">
   149	                                                        {{ form_widget(searchForm.create_date_to) }} 
   150	                                                        {{ form_errors(searchForm.create_date_to) }}
   151	                                                    </div>
   152	                                                </div>
   153	                                            </div>
   154	                                            <div class="col-6">
   155	                                                <div class="row align-items-center">
   156	                                                    <label for="{{ searchForm.update_date_from.vars.id }}"
   157	                                                        class="form-label">{{ searchForm.update_date_from.vars.label }}{{ 'admin.common.update_date'|trans }}</label>
   158	                                                    <div class="col">
   159	                                                        {{ form_widget(searchForm.update_date_from) }} 
   160	                                                        {{ form_errors(searchForm.update_date_from) }}
   161	                                                    </div>
   162	                                                    <div class="col-auto"><span>{{ 'admin.common.separator__range'|trans }}</span></div>
   163	                                                    <div class="col">
   164	                                                        {{ form_widget(searchForm.update_date_to) }} 
   165	                                                        {{ form_errors(searchForm.update_date_to) }}
   166	                                                    </div>
   167	                                                </div>
   168	                                            </div>
   169	                                        </div>
   170	                                        <div class="row mb-4">
   171	                                            <div class="col-6">
   172	                                                <div class="row align-items-center">
   173	                                                    <label for="{{ searchForm.order_type.vars.id }}"
   174	                                                        class="form-label">{{ searchForm.order_type.vars.label }}</label>
   175	                                                    <div class="col">
   176	                                                        {{ form_widget(searchForm.order_type, {'label_attr': {'class': 'checkbox-inline'}}) }}
   177	                                                    </div>
   178	                                                </div>
   179	                                            </div>
   180	                                        </div>
   181	                                        <div id="search_box_main__clear" class="row">
   182	                                            <div class="col-sm-12">
   183	                                                <p class="text-center">
   184	                                                    <a href="#" class="search-clear">{{ 'admin.common.search_clear'|trans }}</a>
   185	                                                </p>
   186	                                            </div>
   187	                                        </div>     
   188	                                    </div>
   189	                                </form>
   190	                            </div>
   191	                        </div>
   192	                    </div>
   193	                </div>
   194	                <div class="text-center my-4 admin-product-search-submit-wrap">
   195	                    <button type="submit" class="btn btn-ec-conversion px-5" form="search_form">
   196	                        {{ 'admin.order.shipping_standby_search_multi'|trans }}<i class="fa fa-angle-right ms-1" aria-hidden="true"></i>
   197	                    </button>
   198	                </div>
   199	
   200	                {# 一覧 #}
   201	                {% if pagination %} 
   202	                    <div id="result_list" class="row">
   203	                        <div class="col-md-12">
   204	                            <div id="result_list_main" class="box">
   205	                                {% if pagination.totalItemCount > 0 %}
   206	                                    <div class="c-outsideBlock__contents mb-5 text-center">
   207	                                        {% if pagination %}
   208	                                            <span class="fw-bold ms-2" id="search_total_count">{{ 'admin.common.search_result'|trans({"%count%":pagination.totalItemCount})|raw }}</span>
   209	                                        {% endif %}
   210	                                    </div>
   211	                                    <!-- /.box-header -->
   212	                                    <div class="col-12 text-end mb-2">
   213	                                        <div class="d-inline-block me-2 align-bottom">
   214	                                            <select id="page_count_pulldown" class="form-select">
   215	                                                {% for pageMax in pageMaxis %}
   216	                                                    <option {% if pageMax.name == page_count %} selected {% endif %}
   217	                                                        value="{{ path('admin_shipping_standby_page', {'page_no': 1, 'page_count': pageMax.name}) }}">
   218	                                                        {{ 'admin.common.count'|trans({ '%count%': pageMax.name }) }}</option>
   219	                                                    {% endfor %}
   220	                                                </select>
   221	                                            </div>   
   222	                                        </div>
   223	                                    <div class="card rounded border-0 mb-4 d-block">
   224	                                    <div id="result_list_main__body" class="box-body">
   225	                    
   226	                                        <form id="dropdown-form">
   227	                                            <div id="result_list_main__list" class="table_list">
   228	                                                <div id="result_list_main__list_body" class="table-responsive with-border">
   229	                                                    <table class="table table-striped">
   230	                                                        <thead>
   231	                                                            <tr id="result_list_main__header">
   232	                                                                <th id="result_list_main__header_id">{{ 'admin.order.shipping_standby_no'|trans }}</th>
   233	                                                                <th id="result_list_main__header_type">{{ 'admin.order.shipping_standby_order_type'|trans }}</th>
   234	                                                                <th id="result_list_main__header_count">{{ 'admin.order.shipping_standby_order_count'|trans }}</th>
   235	                                                                <th id="result_list_main__header_create_date">{{ 'admin.common.create_date'|trans }}</th>
   236	                                                                <th id="result_list_main__header_update_date">{{ 'admin.common.last_update_date'|trans }}</th>
   237	                                                                <th>&nbsp;</th>
   238	                                                            </tr>
   239	                                                        </thead>
   240	                                                        <tbody>
   241	                                                        {% for StandbyList in pagination %}
   242	                                                            <tr id="result_list_main__item--{{ StandbyList.id }}">
   243	                                                                <td id="result_list_main__id--{{ StandbyList.id }}">
   244	                                                                    <a href="{{ path('admin_shipping_standby_edit', {'id': StandbyList.id }) }}">
   245	                                                                        {{ StandbyList.id }}</a></td>
   246	                                                                <td id="result_list_main__type--{{ StandbyList.id }}">
   247	                                                                    {{ StandbyList.orderType ? StandbyList.orderType.name : '' }}</td>
   248	                                                                <td id="result_list_main__count--{{ StandbyList.id }}">
   249	                                                                    {{ StandbyList.Orders.count }}</td>
   250	                                                                <td id="result_list_main__create_date--{{ StandbyList.id }}">
   251	                                                                    {{ StandbyList.create_date|date_format }}</td>
   252	                                                                <td id="result_list_main__update_date--{{ StandbyList.id }}">
   253	                                                                    {{ StandbyList.update_date|date_format }}</td>
   254	
   255	                                                                <td id="result_list_main__item_menu_box--{{ StandbyList.id }}" class="icon_edit">
   256	                                                                    <div class="d-inline-grid text-center">
   257	                                                                        <div class="dropdown history_dropdown">
   258	                                                                            <button class="btn dropdown-menu-toggle" type="button" data-toggle="dropdown" aria-expanded="false" id="dropdown_{{ StandbyList.id }}">
   259	                                                                                <i class="fa-solid fa-ellipsis"></i>
   260	                                                                            </button>
   261	                                                                            <ul class="dropdown-menu" aria-labelledby="dropdown_{{ StandbyList.id }}">
   262	                                                                                <li><a class="dropdown-item" href="{{ path('admin_shipping_standby_edit', { 'id':StandbyList.id }) }}">{{ 'admin.common.edit'|trans }}</a></li>
   263	                                                                                <li><a class="dropdown-item" href="{{ path('admin_shipping_standby_delete', { 'id':StandbyList.id }) }}" {{ csrf_token_for_anchor() }} data-method="delete">{{ 'admin.common.delete'|trans }}</a></li>
   264	                                                                            </ul>
   265	                                                                        </div>
   266	                                                                    </div>
   267	                                                                </td>
   268	                                                                <!-- 削除の確認モーダル-->
   269	                                                                <div class="modal fade" id="admin_shipping_standby_delete" tabindex="-1" role="dialog" aria-labelledby="discontinuance" aria-hidden="true" data-bs-keyboard="false" data-bs-backdrop="static">
   270	                                                                    <div class="modal-dialog" role="document">
   271	                                                                        <div class="modal-content">
   272	                                                                            <div class="modal-header">
   273	                                                                                <h5 class="modal-title fw-bold">{{ 'admin.product.permanently_delete__confirm_title'|trans }}</h5>
   274	                                                                                <button class="btn-close" type="button" data-bs-dismiss="modal" aria-label="Close"></button>
   275	                                                                            </div>
   276	                                                                            <div class="modal-body text-start">
   277	                                                                                <p class="text-start">{{ 'admin.product.permanently_delete__confirm_message'|trans }}</p>
   278	                                                                                <ul id="bulkErrors"></ul>
   279	                                                                                <div class="progress" style="display: none">
   280	                                                                                    <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
   281	                                                                                </div>
   282	                                                                            </div>
   283	                                                                            <div class="modal-footer">
   284	                                                                                <button class="btn btn-ec-sub" type="button" data-bs-dismiss="modal">{{ 'admin.common.cancel'|trans }}</button>
   285	                                                                                <button class="btn btn-ec-delete" type="button" id="bulkDelete">{{ 'admin.product.permanently_delete' | trans }}</button>
   286	                                                                                <button class="btn btn-ec-regular" id="bulkDeleteDone" style="display: none" type="button" data-bs-dismiss="modal">{{ 'admin.product.permanently_delete__complete'|trans }}</button>
   287	                                                                            </div>
   288	                                                                        </div>
   289	                                                                    </div>
   290	                                                                </div>
   291	                                                            </tr>
   292	                                                        {% endfor %}
   293	                                                        </tbody>
   294	                                                    </table>
   295	                                                </div>
   296	                                            </div>
   297	                                        </form>
   298	                                    </div>
   299	                                    <!-- /.box-body -->
   300	                                    <div class="row justify-content-md-center pb-4 mb-4">
   301	                                        {% if pagination.totalItemCount > 0 %}
   302	                                            {% include "@admin/pager.twig" with { 'pages' : pagination.paginationData, 'routes' : 'admin_shipping_standby' } %}
   303	                                        {% endif %}
   304	                                    </div>
   305	                                    {# 検索条件エラー時 #}
   306	                                {% elseif has_errors %}
   307	                                    <div class="card rounded border-0">
   308	                                        <div class="card-body p-4">
   309	                                            <div class="text-center text-muted mb-4 h5">{{ 'admin.common.search_invalid_condition'|trans }}</div>
   310	                                            <div class="text-center text-muted">{{ 'admin.common.search_try_change_condition'|trans }}</div>
   311	                                        </div>
   312	                                    </div>
   313	                                    {# 検索結果なし #}
   314	                                {% else %}
   315	                                    <div class="card rounded border-0">
   316	                                        <div class="card-body p-4">
   317	                                            <div class="text-center text-muted mb-4 h5">{{ 'admin.common.search_no_result'|trans }}</div>
   318	                                            <div class="text-center text-muted">{{ 'admin.common.search_try_change_condition'|trans }}</div>
   319	                                        </div>
   320	                                    </div>
   321	                                    <!-- /.box-header -->
   322	                                {% endif %}
   323	                            </div>
   324	                            <!-- /.box -->
   325	                        </div>
   326	                        <!-- /.col -->
   327	                    </div>
   328	                {% endif %}
   329	            </div>
   330	        </div>
   331	    </div>
   332	{% endblock %}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/SearchControllerTrait.php | sed -n '1,260p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
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
    16	namespace Eccube\Controller\Admin;
    17	
    18	use Doctrine\Common\Collections\ArrayCollection;
    19	use Doctrine\ORM\Exception\ORMException;
    20	use Doctrine\ORM\NonUniqueResultException;
    21	use Doctrine\ORM\OptimisticLockException;
    22	use Doctrine\ORM\QueryBuilder;
    23	use Eccube\Common\EccubeConfig;
    24	use Eccube\Entity\DtbSearchPattern;
    25	use Eccube\Repository\CustomerRepository;
    26	use Eccube\Repository\DtbArchetypeRepository;
    27	use Eccube\Repository\DtbBuyOrderRepository;
    28	use Eccube\Repository\DtbBuyOrderStockHistoryRepository;
    29	use Eccube\Repository\DtbDeckRepository;
    30	use Eccube\Repository\DtbInventoryPlanRepository;
    31	use Eccube\Repository\DtbPriceHistoryRepository;
    32	use Eccube\Repository\DtbSearchPatternRepository;
    33	use Eccube\Repository\DtbShippingStandbyRepository;
    34	use Eccube\Repository\Master\MtbCardRepository;
    35	use Eccube\Repository\Master\PageMaxRepository;
    36	use Eccube\Util\FormUtil;
    37	use Knp\Component\Pager\PaginatorInterface;
    38	use Symfony\Component\Form\FormInterface;
    39	use Symfony\Component\HttpFoundation\RedirectResponse;
    40	use Symfony\Component\HttpFoundation\Request;
    41	use Symfony\Component\Security\Csrf\CsrfToken;
    42	
    43	trait SearchControllerTrait
    44	{
    45	    /** セッションキー。表示件数、検索条件、ソート条件の保持に使用 */
    46	    protected string $sessionKey;
    47	    /** フォームタイプ */
    48	    protected string $formType;
    49	    /** フォーム名 */
    50	    protected string $formName;
    51	    /** デフォルトソートキー */
    52	    protected string $defaultSort = 'default';
    53	    /** デフォルト並び順 */
    54	    protected string $defaultOrder = 'DESC';
    55	    /**
    56	     * ソート参照用レポジトリ
    57	     * 使用する場合は[ | ]を使用してリポジトリの宣言追加をすること
    58	     * 追加するリポジトリにgetQueryBuilderBySearchDataを実装すること
    59	     */
    60	    protected CustomerRepository|DtbArchetypeRepository|DtbBuyOrderRepository|DtbBuyOrderStockHistoryRepository|DtbDeckRepository|DtbInventoryPlanRepository|DtbPriceHistoryRepository|MtbCardRepository|DtbShippingStandbyRepository $repository;
    61	    /** リダイレクト先 */
    62	    protected string $redirect = '';
    63	    /** 検索パターンキー名 */
    64	    protected string $patternKey = '';
    65	    /**
    66	     * @var array<string, mixed>
    67	     * Form作成時のオプション
    68	     */
    69	    protected array $formCreateOption = [];
    70	
    71	    /** 意図名（intention） */
    72	    protected string $intention = '';
    73	
    74	    protected PaginatorInterface $paginator;
    75	
    76	    protected DtbSearchPatternRepository $dtbSearchPatternRepository;
    77	
    78	    public function __construct(
    79	        PageMaxRepository $pageMaxRepository,
    80	        EccubeConfig $eccubeConfig,
    81	        PaginatorInterface $paginator,
    82	    ) {
    83	        $this->pageMaxRepository = $pageMaxRepository;
    84	        $this->eccubeConfig = $eccubeConfig;
    85	    }
    86	
    87	    /**
    88	     * 表示件数ドロップダウン用。画面ごとにコントローラでオーバーライドする。
    89	     *
    90	     * @return list<\Eccube\Entity\Master\PageMax>
    91	     */
    92	    protected function getPageMaxisForSearch(): array
    93	    {
    94	        return $this->pageMaxRepository->findAll();
    95	    }
    96	
    97	    /**
    98	     * データ検索メイン処理
    99	     *
   100	     * @return array<string, mixed>
   101	     *
   102	     * @throws \Exception
   103	     */
   104	    public function search(Request $request, ?int $patternId = null, int $pageNo = 1): array
   105	    {
   106	        // セッション取得
   107	        $session = $request->getSession();
   108	        $sessionkey = $this->sessionKey;
   109	        // セッションキー：ページ内表示件数
   110	        $pageCountKey = "eccube.admin.{$sessionkey}.search.page_count";
   111	        // セッションキー：ページ表示番号
   112	        $pageNoKey = "eccube.admin.{$sessionkey}.search.page_no";
   113	        // セッションキー：検索条件
   114	        $viewKey = "eccube.admin.{$sessionkey}.search";
   115	        // セッションキー：ソートカラム
   116	        $sortKey = "eccube.admin.{$sessionkey}.sort";
   117	        // セッションキー：降順/昇順
   118	        $orderKey = "eccube.admin.{$sessionkey}.order";
   119	
   120	        // フォーム取得
   121	        $builder = $this->formFactory->createBuilder($this->formType, null, $this->formCreateOption);
   122	
   123	        // パターンIDに設定する
   124	        $searchForm = $builder->getForm();
   125	        $searchForm->handleRequest($request);
   126	
   127	        // ソートキー、並び順
   128	        // sort の処理
   129	        $sort = match (true) {
   130	            !empty($request->get('sort')) => $request->get('sort'),
   131	            !is_null($session->get($sortKey)) => $session->get($sortKey),
   132	            default => $this->defaultSort,
   133	        };
   134	
   135	        // order の処理
   136	        $order = match (true) {
   137	            !empty($request->get('order')) => $request->get('order'),
   138	            !is_null($session->get($orderKey)) => $session->get($orderKey),
   139	            default => $this->defaultOrder,
   140	        };
   141	
   142	        if (!preg_match('/^(ASC|DESC|asc|desc)$/', $order)) {
   143	            $this->addError('admin.error.sort', 'admin');
   144	
   145	            return $this->index($request, $this->paginator);
   146	        }
   147	
   148	        $pageMaxis = $this->getPageMaxisForSearch();
   149	
   150	        $maxArr = [];
   151	        foreach ($pageMaxis as $pageMax) {
   152	            $maxArr[] = $pageMax->getName();
   153	        }
   154	        // 表示件数取得する、1.SESSION 2.設定ファイル
   155	        $defaultPageCount = (string) $this->eccubeConfig['eccube_default_page_count'];
   156	        $pageCount = (string) $session->get($pageCountKey, $defaultPageCount);
   157	        if ($maxArr !== [] && !in_array($pageCount, $maxArr, true)) {
   158	            $pageCount = in_array($defaultPageCount, $maxArr, true) ? $defaultPageCount : $maxArr[0];
   159	            $session->set($pageCountKey, $pageCount);
   160	        }
   161	        $pageCountParam = $request->get('page_count');
   162	        // 表示件数入力値がマスターに設定されている場合SESSIONに保存する
   163	        if ($pageCountParam !== null && $pageCountParam !== '' && in_array((string) $pageCountParam, $maxArr, true)) {
   164	            $pageCount = (string) $pageCountParam;
   165	            $session->set($pageCountKey, $pageCount);
   166	        }
   167	
   168	        // 検索条件
   169	        $searchData = $searchForm->getData();
   170	        $viewData = FormUtil::getViewData($searchForm);
   171	
   172	        // 検索条件が空の場合、セッションに保存されている検索条件を復元する
   173	        if (is_null($searchData)) {
   174	            $viewData = $session->get($viewKey);
   175	            // sessionに保持されている検索条件を復元.
   176	            $searchData = FormUtil::submitAndGetData($searchForm, $viewData);
   177	            if (is_null($viewData) && is_null($searchData)) {
   178	                return $this->index($request, $this->paginator);
   179	            }
   180	        }
   181	
   182	        $searchData['pattern_id'] = $patternId ?? null;
   183	        $searchData['sort'] = $sort;
   184	        $searchData['order'] = $order;
   185	        $searchRequest = ['searchData' => $searchData];
   186	
   187	        $qb = $this->getQueryBuilder($searchRequest);
   188	
   189	        // Sessionに設定
   190	        $session->set($pageNoKey, $pageNo);
   191	        $session->set($viewKey, $viewData);
   192	        $session->set($sortKey, $sort);
   193	        $session->set($orderKey, $order);
   194	        $session->set($pageCountKey, $pageCount);
   195	
   196	        // 検索結果
   197	        $pagination = $this->paginator->paginate(
   198	            $qb,
   199	            $pageNo,
   200	            (int) $pageCount,
   201	            $this->paginationOption ?? []
   202	        );
   203	        // 最終ページのデータ削除時に表示するデータがなくなった場合、１つ前のページを表示する
   204	        $resultCount = $pagination->getTotalItemCount();
   205	        $pageCountInt = (int) $pageCount;
   206	        if ($pageNo > 1 && $resultCount === (($pageNo - 1) * $pageCountInt)) {
   207	            $pageNo = $pageNo - 1;
   208	            $session->set($pageNoKey, $pageNo);
   209	            $pagination = $this->paginator->paginate(
   210	                $qb,
   211	                $pageNo,
   212	                $pageCountInt,
   213	                $this->paginationOption ?? []
   214	            );
   215	        }
   216	
   217	        return [
   218	            'searchForm' => $searchForm->createView(),
   219	            'pagination' => $pagination,
   220	            'pageMaxis' => $pageMaxis,
   221	            'page_no' => $pageNo,
   222	            'page_count' => (int) $pageCount,
   223	            'sort_key' => $sort,
   224	            'order_key' => $order,
   225	            'has_errors' => false,
   226	            'pattern_id' => $patternId,
   227	            'is_search_filter_active' => $this->isSearchFilterActive($searchData),
   228	        ];
   229	    }
   230	
   231	    /**
   232	     * 検索パターン保存
   233	     *
   234	     * @return array<string, mixed>
   235	     *
   236	     * @throws ORMException
   237	     * @throws NonUniqueResultException
   238	     * @throws OptimisticLockException
   239	     */
   240	    public function saveSearchPattern(Request $request): array
   241	    {
   242	        $searchForm = $this->getForm();
   243	        $searchForm->handleRequest($request);
   244	        $viewData = FormUtil::getViewData($searchForm);
   245	
   246	        if (is_null($viewData['pattern_name']) || $viewData['pattern_name'] === '') {
   247	            $this->addError('admin.common.save_pattern.error.name_empty', 'admin');
   248	
   249	            return $this->search($request);
   250	        }
   251	
   252	        if ($viewData['pattern_id']) {
   253	            $searchPattern = $this->dtbSearchPatternRepository->find($viewData['pattern_id']) ?? new DtbSearchPattern();
   254	        } else {
   255	            $searchPattern = new DtbSearchPattern();
   256	        }
   257	        $searchPattern
   258	            ->setPattern(serialize($viewData))
   259	            ->setName($viewData['pattern_name'])
   260	            ->setDisplayKey($this->patternKey);

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php | sed -n '1,160p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
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
    16	namespace Eccube\Controller\Admin\Order;
    17	
    18	use Doctrine\ORM\EntityManagerInterface;
    19	use Eccube\Controller\AbstractController;
    20	use Eccube\Controller\Admin\SearchControllerTrait;
    21	use Eccube\Entity\Master\MtbOption;
    22	use Eccube\Form\Type\Admin\Order\GenerateShippingStandbyType;
    23	use Eccube\Form\Type\Admin\Order\ShippingStandbyType;
    24	use Eccube\Form\Type\Admin\ShippingStandbyCommentType;
    25	use Eccube\Repository\BaseInfoRepository;
    26	use Eccube\Repository\DtbShippingStandbyRepository;
    27	use Eccube\Repository\Master\MtbOptionRepository;
    28	use Eccube\Repository\Master\PageMaxRepository;
    29	use Eccube\Repository\MemberRepository;
    30	use Eccube\Repository\OrderRepository;
    31	use Eccube\Repository\ProductClassRepository;
    32	use Eccube\Service\Admin\ShippingStandby\ActionInput\UpdateCommentInput;
    33	use Eccube\Service\Admin\ShippingStandby\DeleteListAction;
    34	use Eccube\Service\Admin\ShippingStandby\UpdateCommentAction;
    35	use Eccube\Util\OrderUtil;
    36	use Knp\Component\Pager\PaginatorInterface;
    37	use Symfony\Bridge\Twig\Attribute\Template;
    38	use Symfony\Component\HttpFoundation\RedirectResponse;
    39	use Symfony\Component\HttpFoundation\Request;
    40	use Symfony\Component\HttpFoundation\Response;
    41	use Symfony\Component\Routing\Attribute\Route;
    42	use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
    43	
    44	class ShippingStandbyController extends AbstractController
    45	{
    46	    use SearchControllerTrait {
    47	        SearchControllerTrait::search as traitSearch;
    48	    }
    49	
    50	    /** 商品名から色とレアリティの組み合わせを取り出すための正規表現(文末と()の前にあるもの2パターン) */
    51	    public const COLOR_RARITY_END_PATTERN = '/(無|白|青|黒|赤|緑|金|茶|分|混|土地|か)(M|R|U|C|L|S|T)?$/';
    52	    public const COLOR_RARITY_BRANCKET_PATTERN = '/(無|白|青|黒|赤|緑|金|茶|分|混|土地)(M|R|U|C|L|S|T)?\(/';
    53	    /** 特殊なパターン(上記2つで取り出せない場合) */
    54	    public const COLOR_RARITY_IN_MIDDLE = '/(無|白|青|黒|赤|緑|金|茶|分|混|土地)(M|R|U|C|L|S|T)?\s/'; // 商品名内にある場合
    55	    public const COLOR_RARITY_OLD_TOKEN = '/(無|白|青|黒|赤|緑|金|茶|分|混|土地)\[/';                 // トークンのうち　名前 色[エキスパンション]のパターン
    56	
    57	    /**
    58	     * ShippingStandbyController constructor.
    59	     *
    60	     * @param PageMaxRepository $pageMaxRepository
    61	     * @param PaginatorInterface $paginator
    62	     * @param DtbShippingStandbyRepository $shippingStandbyRepository
    63	     * @param CsrfTokenManagerInterface $csrfTokenManager
    64	     */
    65	    public function __construct(
    66	        protected PageMaxRepository $pageMaxRepository,
    67	        protected PaginatorInterface $paginator,
    68	        protected DtbShippingStandbyRepository $shippingStandbyRepository,
    69	        protected CsrfTokenManagerInterface $csrfTokenManager,
    70	        protected MemberRepository $memberRepository,
    71	        protected EntityManagerInterface $entityManager,
    72	        protected OrderRepository $orderRepository,
    73	        protected MtbOptionRepository $mtbOptionRepository,
    74	        protected BaseInfoRepository $baseInfoRepository,
    75	        protected UpdateCommentAction $updateCommentAction,
    76	        protected DeleteListAction $deleteListAction,
    77	        protected ProductClassRepository $productClassRepository,
    78	    ) {
    79	        $this->repository = $this->shippingStandbyRepository;
    80	        /** セッションキー。表示件数、検索条件、ソート条件の保持に使用 */
    81	        $this->sessionKey = 'shipping_standby';
    82	        $this->formType = ShippingStandbyType::class;
    83	        /** フォーム名 */
    84	        $this->formName = 'admin_shipping_standby';
    85	        $this->redirect = 'admin_shipping_standby';
    86	    }
    87	
    88	    /**
    89	     * 出荷指示一覧
    90	     *
    91	     * @return array<string, mixed>
    92	     */
    93	    #[
    94	        Route(
    95	            path: '/%eccube_admin_route%/standby/search',
    96	            name: 'admin_shipping_standby',
    97	            methods: ['GET', 'POST'],
    98	        ),
    99	    ]
   100	    #[
   101	        Route(
   102	            path: '/%eccube_admin_route%/standby/page/{page_no}',
   103	            name: 'admin_shipping_standby_page',
   104	            requirements: ['page_no' => "\d+"],
   105	            methods: ['GET'],
   106	        ),
   107	    ]
   108	    #[Template(template: '@admin/ShippingStandby/index.twig')]
   109	    public function index(
   110	        Request $request,
   111	        PaginatorInterface $paginator,
   112	        int $page_no = 0,
   113	    ): array {
   114	        // 現行だとパスパラメータでのページネーションだが、pager.twig が クエリパラメータでのページネーションを想定しているため両方に対応しておく
   115	        if ($page_no === 0) {
   116	            $page_no =
   117	                $request->query->getInt('pageno', 0) ?:
   118	                $request->query->getInt('page_no', 0);
   119	        }
   120	
   121	        // ページ番号が指定されている場合、セッションから検索条件を復元して指定のページを開く
   122	        if ($page_no > 0) {
   123	            return $this->search($request, null, $page_no);
   124	        }
   125	
   126	        // GET: 初期表示（空の状態）
   127	        if ($request->isMethod('GET')) {
   128	            $form = $this->createForm(ShippingStandbyType::class);
   129	
   130	            $builder = $this->formFactory->createBuilder(GenerateShippingStandbyType::class);
   131	            $generateForm = $builder->getForm();
   132	
   133	            return [
   134	                'searchForm' => $form->createView(),
   135	                'generateForm' => $generateForm->createView(),
   136	                'pagination' => [],
   137	                'pageMaxis' => [],
   138	                'page_count' => $this->eccubeConfig['eccube_default_page_count'],
   139	            ];
   140	        }
   141	
   142	        return $this->search($request, null, 1);
   143	    }
   144	
   145	    /**
   146	     * 出荷指示リスト 編集画面
   147	     *
   148	     * @param Request $request
   149	     * @param int $id
   150	     *
   151	     * @return Response
   152	     */
   153	    #[Route(path: '/%eccube_admin_route%/standby/{id}/edit', name: 'admin_shipping_standby_edit', requirements: ['id' => '\d+'], methods: ['GET', 'POST'])]
   154	    public function edit(Request $request, int $id, OrderRepository $orderRepository): Response
   155	    {
   156	        $shippingStandby = $this->shippingStandbyRepository->findOneByStandbyIdWithOrder($id);
   157	
   158	        if (empty($shippingStandby)) {
   159	            throw $this->createNotFoundException();
   160	        }

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php | sed -n '1,130p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
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
    16	namespace Eccube\Repository;
    17	
    18	use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepositoryInterface;
    19	use Doctrine\ORM\QueryBuilder;
    20	use Doctrine\Persistence\ManagerRegistry;
    21	use Eccube\Entity\DtbShippingStandby;
    22	use Eccube\Entity\Master\MtbOption;
    23	use Eccube\Entity\Master\MtbOrderType;
    24	use Eccube\Repository\Master\MtbOptionRepository;
    25	use Eccube\Repository\Traits\SortProductTrait;
    26	use Eccube\Util\PriceUtil;
    27	
    28	/**
    29	 * @extends AbstractRepository<DtbShippingStandby>
    30	 */
    31	class DtbShippingStandbyRepository extends AbstractRepository implements ServiceEntityRepositoryInterface
    32	{
    33	    use SortProductTrait;
    34	
    35	    /**
    36	     * @var array<string, string>
    37	     */
    38	    private array $sortKeys = [
    39	        'default' => 's.id',
    40	        'create_date' => 's.createDate',
    41	        'update_date' => 's.updateDate',
    42	    ];
    43	
    44	    private MtbOptionRepository $optionRepository;
    45	
    46	    public function __construct(ManagerRegistry $registry, MtbOptionRepository $optionRepository)
    47	    {
    48	        parent::__construct($registry, DtbShippingStandby::class);
    49	        $this->optionRepository = $optionRepository;
    50	    }
    51	
    52	    /**
    53	     * @return array<string, string>
    54	     */
    55	    public function getSortKeys(): array
    56	    {
    57	        return $this->sortKeys;
    58	    }
    59	
    60	    /**
    61	     * 出荷指示一覧の検索クエリ
    62	     *
    63	     * @param array<string, mixed> $searchData
    64	     */
    65	    public function getQueryBuilderBySearchData(array $searchData): QueryBuilder
    66	    {
    67	        $qb = $this->createQueryBuilder('s')
    68	            ->distinct()
    69	            ->leftJoin('s.OrderType', 'ot');
    70	
    71	        $sort = $searchData['sort'] ?? 'default';
    72	        $order = strtoupper((string) ($searchData['order'] ?? 'DESC'));
    73	        if (!isset($this->sortKeys[$sort])) {
    74	            $sort = 'default';
    75	        }
    76	        $qb->orderBy($this->sortKeys[$sort], $order === 'ASC' ? 'ASC' : 'DESC');
    77	
    78	        // 出荷指示番号
    79	        if (!empty($searchData['standby_id'])) {
    80	            $qb->andWhere('s.id = :standbyId')
    81	                ->setParameter('standbyId', $searchData['standby_id']);
    82	        }
    83	
    84	        // 注文番号
    85	        if (!empty($searchData['order_id'])) {
    86	            $qb->join('s.Orders', 'o_filter')
    87	                ->andWhere('o_filter.id = :orderId')
    88	                ->setParameter('orderId', $searchData['order_id']);
    89	        }
    90	
    91	        // 登録日From
    92	        if (!empty($searchData['create_date_from'])) {
    93	            $qb->andWhere('s.createDate >= :cdf')
    94	                ->setParameter('cdf', $searchData['create_date_from']);
    95	        }
    96	
    97	        // 登録日To
    98	        if (!empty($searchData['create_date_to'])) {
    99	            $qb->andWhere('s.createDate <= :cdt')
   100	                ->setParameter('cdt', $searchData['create_date_to']);
   101	        }
   102	
   103	        // 更新日From
   104	        if (!empty($searchData['update_date_from'])) {
   105	            $qb->andWhere('s.updateDate >= :udf')
   106	                ->setParameter('udf', $searchData['update_date_from']);
   107	        }
   108	
   109	        // 更新日To
   110	        if (!empty($searchData['update_date_to'])) {
   111	            $qb->andWhere('s.updateDate <= :udt')
   112	                ->setParameter('udt', $searchData['update_date_to']);
   113	        }
   114	
   115	        // 受注タイプ
   116	        if (!empty($searchData['order_type']) && is_array($searchData['order_type'])) {
   117	            $ids = [];
   118	            foreach ($searchData['order_type'] as $mt) {
   119	                if ($mt instanceof MtbOrderType) {
   120	                    $ids[] = $mt->getId();
   121	                }
   122	            }
   123	            if ($ids !== []) {
   124	                $qb->andWhere($qb->expr()->in('IDENTITY(s.OrderType)', ':otIds'))
   125	                    ->setParameter('otIds', $ids);
   126	            }
   127	        }
   128	
   129	        return $qb;
   130	    }

codex
実装の主経路は設計の処理フロー・判定順序とほぼ対応しています。一方で、JSONの証拠には「設計書がec-cube-enterprise実装を正とする」と書いている箇所との内部矛盾があるので、誤検知というより設計書自体の不整合として扱うべきかを切り分けています。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Order/ShippingStandbyType.php | sed -n '1,130p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
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
    16	namespace Eccube\Form\Type\Admin\Order;
    17	
    18	use Eccube\Entity\Master\MtbOrderType;
    19	use Symfony\Bridge\Doctrine\Form\Type\EntityType;
    20	use Symfony\Component\Form\AbstractType;
    21	use Symfony\Component\Form\Extension\Core\Type\DateTimeType;
    22	use Symfony\Component\Form\Extension\Core\Type\IntegerType;
    23	use Symfony\Component\Form\FormBuilderInterface;
    24	
    25	class ShippingStandbyType extends AbstractType
    26	{
    27	    /**
    28	     * buildForm
    29	     *
    30	     * @param FormBuilderInterface $builder
    31	     * @param array<string, mixed> $options
    32	     *
    33	     * @return void
    34	     */
    35	    public function buildForm(FormBuilderInterface $builder, array $options): void
    36	    {
    37	        $builder
    38	            // 登録日From
    39	            ->add('create_date_from', DateTimeType::class, [
    40	                'required' => false,
    41	                'input' => 'datetime',
    42	                'widget' => 'single_text',
    43	                'attr' => ['placeholder' => '年-月-日 時:分'],
    44	            ])
    45	            // 登録日日To
    46	            ->add('create_date_to', DateTimeType::class, [
    47	                'required' => false,
    48	                'input' => 'datetime',
    49	                'widget' => 'single_text',
    50	                'attr' => ['placeholder' => '年-月-日 時:分'],
    51	            ])
    52	            // 最終更新日From
    53	            ->add('update_date_from', DateTimeType::class, [
    54	                'required' => false,
    55	                'input' => 'datetime',
    56	                'widget' => 'single_text',
    57	                'attr' => ['placeholder' => '年-月-日 時:分'],
    58	            ])
    59	            // 最終更新日To
    60	            ->add('update_date_to', DateTimeType::class, [
    61	                'required' => false,
    62	                'input' => 'datetime',
    63	                'widget' => 'single_text',
    64	                'attr' => ['placeholder' => '年-月-日 時:分'],
    65	            ])
    66	            // 出荷指示番号
    67	            ->add('standby_id', IntegerType::class, [
    68	                'required' => false,
    69	            ])
    70	            // オーダーID
    71	            ->add('order_id', IntegerType::class, [
    72	                'required' => false,
    73	            ])
    74	            // 受注タイプ
    75	            ->add('order_type', EntityType::class, [
    76	                'label' => '注文区分',
    77	                'required' => false,
    78	                'class' => MtbOrderType::class,
    79	                'expanded' => true,
    80	                'multiple' => true,
    81	            ])
    82	        ;
    83	    }
    84	
    85	    /**
    86	     * {@inheritdoc}
    87	     */
    88	    public function getBlockPrefix()
    89	    {
    90	        return 'admin_shipping_standby';
    91	    }
    92	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml | sed -n '1680,1695p;2626,2642p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
  1680	admin.common.unspecified: 未選択
  1681	admin.common.separator__range: 〜
  1682	admin.common.separator__colon: ：
  1683	admin.common.count: "%count%件"
  1684	admin.common.search_detail: 詳細検索
  1685	admin.common.search_result: "検索結果：%count%件が該当しました"
  1686	admin.common.search_result_count: "検索結果 %count% 件"
  1687	admin.common.search_result_suffix: "が該当しました"
  1688	admin.common.search_invalid_condition: 検索条件に誤りがあります
  1689	admin.common.search_no_result: 検索条件に合致するデータが見つかりませんでした
  1690	admin.common.search_try_change_condition: 検索条件を変えて、再度検索をお試しください
  1691	admin.common.search_try_advanced_search: "[詳細検索]も試してみましょう"
  1692	admin.common.search_clear: 検索条件をクリア
  1693	admin.common.csv_download: CSVダウンロード
  1694	admin.common.csv_upload: CSVファイルをアップロード
  1695	admin.common.csv_skeleton_download: 雛形ファイルダウンロード
  2626	admin.delivery_slips_en.amount: Total
  2627	
  2628	# 出荷指示リスト
  2629	admin.order.shipping_standby_export: 出荷指示リストエクスポート
  2630	admin.order.shipping_standby_no: 出荷指示番号
  2631	admin.order.shipping_standby_generate_list: 生成
  2632	admin.order.shipping_standby_search: 出荷指示リスト検索
  2633	admin.order.shipping_standby_search_multi: 検索する
  2634	admin.order.shipping_standby_search_result: 検索結果
  2635	admin.order.shipping_standby_search_result_count: 件が該当しました
  2636	admin.order.shipping_standby_order_type: 区分
  2637	admin.order.shipping_standby_order_count: 注文件数
  2638	admin.order.shipping_standby_delete: リスト削除
  2639	admin.order.shipping_standby_list_print: ピッキングリスト印刷
  2640	admin.order.shipping_standby_order_payment_total: 購入金額(円)
  2641	admin.order.shipping_standby_order_quantity: 合計点数
  2642	admin.order.shipping_standby_order_date: 受注日

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html | sed -n '260,380p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   260	<h2 id="API-バッチ結果">API/バッチ結果</h2>
   261	<p>本機能では API 呼び出し・バッチ実行を扱わない。</p>
   262	<hr>
   263	<h2 id="入出力">入出力</h2>
   264	<div class="table-wrap"><table><thead><tr><th>種類</th><th>内容</th></tr></thead><tbody><tr><td>入力</td><td>検索フォームの各フィールド、クエリの <code>sort</code>・<code>order</code>・<code>page_no</code> または <code>pageno</code>・<code>page_count</code>、CSRF トークン。</td></tr><tr><td>成功時出力</td><td>HTML（<code>@admin/ShippingStandby/index.twig</code>）。総件数、ページリンク、結果テーブル。</td></tr><tr><td>失敗時出力</td><td>ソート不正時はエラーフラッシュと初期表示寄りのレスポンス。</td></tr><tr><td>副作用</td><td>セッション更新（検索条件・ページ・ソート・表示件数）。</td></tr></tbody></table></div>
   265	<hr>
   266	<h2 id="DBカラム">DBカラム</h2>
   267	<div class="table-wrap"><table><thead><tr><th>テーブル</th><th>列</th><th>メモ</th></tr></thead><tbody><tr><td><code>dtb_shipping_standby</code></td><td><code>id</code>, <code>create_date</code>, <code>update_date</code>, <code>order_type_id</code></td><td>検索条件・並びの主対象。</td></tr><tr><td><code>dtb_order</code></td><td><code>id</code></td><td><code>order_id</code> 条件で参照（主キー）。</td></tr><tr><td><code>mtb_order_type</code></td><td><code>id</code></td><td>注文区分条件。</td></tr></tbody></table></div>
   268	<h3 id="DB操作">DB操作</h3>
   269	<p>本機能は参照系（検索）であり、DBへの登録・更新・削除は行わない。テーブル名は ec-cube-enterprise を正典とする。</p>
   270	<div class="table-wrap"><table><thead><tr><th>操作種別</th><th>対象テーブル</th><th>契機・条件</th></tr></thead><tbody><tr><td>検索</td><td>dtb_order / dtb_shipping_standby / mtb_order_type</td><td>検索条件に合致するレコードを抽出する。</td></tr></tbody></table></div>
   271	<hr>
   272	<h2 id="バリデーション">バリデーション</h2>
   273	<div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>全検索項目</td><td>出荷指示検索フォームではいずれも必須ではない。サーバ側の追加アサーションは当フォーム型に無い。整数項目はフォームの整数変換に従う。</td></tr><tr><td>CSRF</td><td>フォームに <code>_token</code> あり。</td></tr></tbody></table></div>
   274	<hr>
   275	<h2 id="権限・認可">権限・認可</h2>
   276	<div class="table-wrap"><table><thead><tr><th>利用者状態</th><th>出荷指示リスト検索画面</th></tr></thead><tbody><tr><td>管理画面にログイン済み</td><td>ルート単体に追加のアノテーションは無い。ファイアウォールで管理エリアが保護されている前提。</td></tr><tr><td>未ログイン</td><td>管理画面共通のログイン誘導を正とする。</td></tr></tbody></table></div>
   277	<hr>
   278	<h2 id="画面遷移">画面遷移</h2>
   279	<div class="table-wrap"><table><thead><tr><th>条件</th><th>遷移先</th></tr></thead><tbody><tr><td>ナビから開く（GET、ページクエリなし）</td><td>同一 URL の初期状態。</td></tr><tr><td>検索送信成功</td><td>同一 URL 上で結果描画。</td></tr><tr><td>ページリンク</td><td>同一ルートにクエリ <code>page_no</code> を付与した GET。</td></tr><tr><td>出荷指示 ID リンク</td><td>編集ルート（本書範囲外）。</td></tr></tbody></table></div>
   280	<h3 id="遷移時に引き継ぐ状態">遷移時に引き継ぐ状態</h3>
   281	<div class="table-wrap"><table><thead><tr><th>起点</th><th>遷移前の処理</th><th>遷移後の初期状態</th></tr></thead><tbody><tr><td>ページネーション</td><td>セッションに既に保存された検索ビュー・ソート・表示件数を読む</td><td>指定ページの行集合</td></tr><tr><td>ブラウザで別画面へ一度離脱後、クエリ付き GET で戻る</td><td>セッションが残っていれば同条件で復元</td><td>セッションが失われていれば <code>index</code> 側でフォームのみ等に戻る動きになる</td></tr></tbody></table></div>
   282	<hr>
   283	<h2 id="エラー処理">エラー処理</h2>
   284	<div class="table-wrap"><table><thead><tr><th>エラー内容</th><th>処理</th></tr></thead><tbody><tr><td>並び順パラメータが許容形式でない</td><td><code>admin.error.sort</code> をフラッシュし <code>index</code> を呼ぶ。</td></tr><tr><td>CSRF 等のフォームエラー</td><td>フレームワークの通常処理（本書では網羅しない）。</td></tr></tbody></table></div>
   285	<hr>
   286	<h2 id="試行制限">試行制限</h2>
   287	<p>本機能では試行制限を扱わない。</p>
   288	<hr>
   289	<h2 id="ログ・監査">ログ・監査</h2>
   290	<p>当機能専用の業務ログ出力はコード上目立たない。共通リクエストログに従う。</p>
   291	<h3 id="ログに出してはいけないもの">ログに出してはいけないもの</h3>
   292	<ul><li>パスワード</li><li>なりすまし対策トークン</li><li>Cookie 値</li><li>セッション ID の完全値</li><li>Remember Me トークンの原値</li></ul>
   293	<hr>
   294	<h2 id="セッション">セッション</h2>
   295	<h3 id="本機能におけるセッション">本機能におけるセッション</h3>
   296	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>キー接頭辞</td><td><code>eccube.admin.shipping_standby</code> に <code>.search</code>、<code>.search.page_no</code>、<code>.search.page_count</code>、<code>.sort</code>、<code>.order</code> を続ける。</td></tr><tr><td>更新タイミング</td><td>検索処理が成功したループ内で、<code>search</code> メソッドが各キーを書き込む。</td></tr></tbody></table></div>
   297	<h3 id="セッションへ保存しない情報">セッションへ保存しない情報</h3>
   298	<p>受注の個人情報全文やカード番号など、検索フォームが要求しないものは保存しない。保存するのはフォーム由来の検索ビューとページング・ソート用パラメータに限る。</p>
   299	<hr>
   300	<h2 id="Cookie">Cookie</h2>
   301	<p>本機能単体で新たに Cookie を定義しない。セッション Cookie は管理画面共通の仕組みに従う。</p>
   302	<hr>
   303	<h2 id="排他制御・トランザクション">排他制御・トランザクション</h2>
   304	<p>検索・一覧表示は読み取り中心であり、当処理が行レベルロックを取得する要件は持たない。</p>
   305	<hr>
   306	<h2 id="調査補助-grep-用-主説明の正典ではない">調査補助（grep 用。主説明の正典ではない）</h2>
   307	<ul><li><code>src/Eccube/Controller/Admin/Order/ShippingStandbyController.php</code></li><li><code>src/Eccube/Controller/Admin/SearchControllerTrait.php</code></li><li><code>src/Eccube/Form/Type/Admin/Order/ShippingStandbyType.php</code></li><li><code>src/Eccube/Repository/DtbShippingStandbyRepository.php</code>（<code>getQueryBuilderBySearchData</code>）</li><li><code>src/Eccube/Resource/template/admin/ShippingStandby/index.twig</code></li></ul>
   308	<h3 id="HTTPルート名とパス-コード探索用・旧入口節より退避">HTTPルート名とパス（コード探索用・旧入口節より退避）</h3>
   309	<ul><li><code>admin_shipping_standby</code> … <code>GET, POST</code> … <code>/{admin_route}/standby/search</code>（GET かつクエリに有効な <code>page_no</code> または <code>pageno</code> が無いときは検索フォームの初期表示（一覧は空）。GET でページ番号が正の整数のときはセッションの検索条件を復元して該当ページの一覧を表示。POST は検索実行として管理画面共通の検索トレイトの <code>search</code> に委ね、通常は 1 ページ目を表示する。）</li><li><code>admin_shipping_standby_page</code> … <code>GET</code> … <code>/{admin_route}/standby/page/{page_no}</code>（パスパラメータ <code>page_no</code>（1 以上の数字）でページ指定。内部では <code>index</code> の <code>$page_no</code> 引数が使われ、セッションから検索条件を復元して一覧を表示する経路として定義されている。）</li></ul>
   310	      <footer>このページは機能仕様書Markdownから自動生成されています。編集は元のMarkdownに対して行ってください。</footer>
   311	    </main>
   312	  </div>
   313	</body>
   314	</html>

exec
/bin/bash -lc 'rg -n "admin_shipping_standby_search|admin_shipping_standby_page|page_count_pulldown|search_no_result|search_invalid_condition" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /home/y-saito/Developments/ec-cube-enterprise/app 2>/dev/null' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 127ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:103:            $('#page_count_pulldown').on('change',  function () {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1125:                                    <select id="page_count_pulldown" class="form-select">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1354:                            <div class="text-center text-muted mb-4 h5">{{ 'admin.common.search_invalid_condition'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1362:                            <div class="text-center text-muted mb-4 h5">{{ 'admin.common.search_no_result'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_import_history.twig:10:                <select id="page_count_pulldown" class="form-select">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_import_history.twig:38:                            <td colspan="3" class="text-center text-muted py-4">{{ 'admin.common.search_no_result'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_import_history.twig:53:        $('#page_count_pulldown').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/history.twig:12:            $('#page_count_pulldown').on('change', function () {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/history.twig:587:                                        <select id="page_count_pulldown" class="form-select" >
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/history.twig:749:                            <div class="text-center text-muted mb-4 h5">{{ 'admin.common.search_invalid_condition'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/history.twig:756:                            <div class="text-center text-muted mb-4 h5">{{ 'admin.common.search_no_result'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:66:            $('#page_count_pulldown').on('change', function () {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:409:                <select id="page_count_pulldown" class="form-select w-auto">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:614:                    <div class="text-muted mb-4 h5">{{ 'admin.common.search_no_result'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1688:admin.common.search_invalid_condition: 検索条件に誤りがあります
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1689:admin.common.search_no_result: 検索条件に合致するデータが見つかりませんでした
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5101:admin.stock.join.search_no_results: 商品が見つかりませんでした。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:170:                                <select id="page_count_pulldown" class="form-select w-auto">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:231:                                            <td colspan="12" class="align-middle text-center py-4">{{ 'admin.common.search_no_result'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:369:            $('#page_count_pulldown').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/edit.twig:479:                $('#player_search_results').html('<p class="text-muted">{{ "admin.common.search_no_result"|trans }}</p>');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/edit.twig:543:                $('#event_search_results').html('<p class="text-muted">{{ "admin.common.search_no_result"|trans }}</p>');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/edit.twig:615:                $('#card_image_search_results').html('<p class="text-muted">{{ "admin.common.search_no_result"|trans }}</p>');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:116:            $('#page_count_pulldown').on('change', function () {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:665:                                    <select id="page_count_pulldown" class="form-select">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:788:                                <div class="text-center text-muted mb-4 h5">{{ 'admin.common.search_no_result'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:299:                                    <p class="mb-0 text-muted">{{ 'admin.common.search_no_result'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:401:                                                {{ 'admin.common.search_no_result'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/System/login_history.twig:24:            $('#page_count_pulldown').on('change', function () {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/System/login_history.twig:132:                                <select id="page_count_pulldown" class="form-select">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/System/login_history.twig:190:                            <div class="text-center text-muted mb-4 h5">{{ 'admin.common.search_invalid_condition'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/System/login_history.twig:197:                            <div class="text-center text-muted mb-4 h5">{{ 'admin.common.search_no_result'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/index.twig:66:        $('#page_count_pulldown').on('change', function () {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/index.twig:346:                                <select id="page_count_pulldown" class="form-select form-select-sm" style="width: auto;">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/index.twig:475:                        <div class="text-center text-muted mb-4 h5">{{ 'admin.common.search_no_result'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/search_player_modal_list.twig:52:    <p class="text-muted text-center mb-0">{{ 'admin.common.search_no_result'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/search_event_modal_list.twig:73:    <p class="text-center text-muted mb-0 py-3">{{ 'admin.common.search_no_result'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/decklist.twig:300:        <p class="decklist-empty">{{ 'admin.common.search_no_result'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/index.twig:18:        $('#page_count_pulldown').on('change', function () {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/index.twig:118:                                <select id="page_count_pulldown" class="form-select form-select-sm" style="width: auto;">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/index.twig:211:                        <div class="text-center text-muted mb-4 h5">{{ 'admin.common.search_no_result'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/EntryRegistration/index.twig:126:                        <div class="text-center text-muted mb-4 h5">{{ 'admin.common.search_no_result'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/tenant/index.twig:20:        $('#page_count_pulldown').on('change', function () {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/tenant/index.twig:192:                                    <select id="page_count_pulldown"  class="form-select">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/tenant/index.twig:260:                        <div class="text-center text-muted mb-4 h5">{{ 'admin.common.search_no_result'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/index.twig:42:            $('#page_count_pulldown').on('change', function () {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/index.twig:122:                <select id="page_count_pulldown" class="form-select w-auto">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/index.twig:215:                    <div class="text-muted mb-4 h5">{{ 'admin.common.search_no_result'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/edit.twig:133:                        $('<p>').addClass('text-muted').text('{{ "admin.common.search_no_result"|trans|e('js') }}').appendTo($results);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:24:            $('#page_count_pulldown').on('change',  function () {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:214:                                            <select id="page_count_pulldown" class="form-select">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:217:                                                        value="{{ path('admin_shipping_standby_page', {'page_no': 1, 'page_count': pageMax.name}) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:309:                                            <div class="text-center text-muted mb-4 h5">{{ 'admin.common.search_invalid_condition'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:317:                                            <div class="text-center text-muted mb-4 h5">{{ 'admin.common.search_no_result'|trans }}</div>

exec
/bin/bash -lc "rg -n \"admin\\.order\\.shipping_instructions|shipping_instructions\" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin /home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube_nav.yaml" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube_nav.yaml:117:                shipping_instructions:
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube_nav.yaml:118:                    name: admin.order.shipping_instructions
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4057:admin.order.shipping_instructions: 出荷指示
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:13:{% set menus = ['order', 'shipping_instructions'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:15:{% block title %}{{ 'admin.order.shipping_instructions'|trans }}{% endblock %}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/pager.twig | sed -n '1,180p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	{#
     2	This file is part of EC-CUBE
     3	
     4	Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved.
     5	
     6	http://www.ec-cube.co.jp/
     7	
     8	For the full copyright and license information, please view the LICENSE
     9	file that was distributed with this source code.
    10	#}
    11	{% if pages.pageCount > 1 %}
    12	    <ul class="pagination col-auto">
    13	
    14	        <!-- 最初へ -->
    15	        {% if pages.firstPageInRange != 1 %}
    16	            <li class="page-item">
    17	                {# FIXME: Need check pass routes before use default _route from request #}
    18	                {% set request = app.request.query.all|merge({'page_no': pages.first}) %}
    19	                {% set request = id is defined ? request|merge({'id': id}) : request %}
    20	                {% set request = nonce is defined ? request|merge({'nonce': nonce}) : request %}
    21	                <a class="page-link"
    22	                   href="{{ path(routes ? routes : app.request.attributes.get('_route'), request) }}">{{ 'admin.common.first'|trans }}</a></li>
    23	
    24	        {% endif %}
    25	
    26	        <!-- 前へ -->
    27	        {% if pages.previous is defined %}
    28	            <li class="page-item">
    29	                {# FIXME: Need check pass routes before use default _route from request #}
    30	                {% set request = app.request.query.all|merge({'page_no': pages.previous}) %}
    31	                {% set request = id is defined ? request|merge({'id': id}) : request %}
    32	                {% set request = nonce is defined ? request|merge({'nonce': nonce}) : request %}
    33	                <a class="page-link"
    34	                   href="{{ path(routes ? routes : app.request.attributes.get('_route'), request) }}">{{ 'admin.common.prev'|trans }}</a>
    35	            </li>
    36	        {% endif %}
    37	
    38	        <!-- 1ページリンクが表示されない場合、「...」を表示 -->
    39	        {% if pages.firstPageInRange != 1 %}
    40	            <li class="page-item">...</li>
    41	        {% endif %}
    42	
    43	        {% for page in pages.pagesInRange %}
    44	            <li class="page-item{% if page == pages.current %} active{% endif %}">
    45	                {% if page == pages.current %}
    46	                    <span class="page-link">{{ page }}</span>
    47	                {% else %}
    48	                    {# FIXME: Need check pass routes before use default _route from request #}
    49	                    {% set request = app.request.query.all|merge({'page_no': page}) %}
    50	                    {% set request = id is defined ? request|merge({'id': id}) : request %}
    51	                    {% set request = nonce is defined ? request|merge({'nonce': nonce}) : request %}
    52	                    <a class="page-link"
    53	                       href="{{ path(routes ? routes : app.request.attributes.get('_route'), request) }}">
    54	                        {{ page }}
    55	                    </a>
    56	                {% endif %}
    57	            </li>
    58	        {% endfor %}
    59	
    60	        <!-- 最終ページリンクが表示されない場合、「...」を表示 -->
    61	        {% if pages.last != pages.lastPageInRange %}
    62	            <li class="page-item">...</li>
    63	        {% endif %}
    64	
    65	        <!-- 次へ -->
    66	        {% if pages.next is defined %}
    67	            <li class="page-item">
    68	                {# FIXME: Need check pass routes before use default _route from request #}
    69	                {% set request = app.request.query.all|merge({'page_no': pages.next}) %}
    70	                {% set request = id is defined ? request|merge({'id': id}) : request %}
    71	                {% set request = nonce is defined ? request|merge({'nonce': nonce}) : request %}
    72	                <a class="page-link"
    73	                   href="{{ path(routes ? routes : app.request.attributes.get('_route'), request) }}">{{ 'admin.common.next'|trans }}</a>
    74	            </li>
    75	        {% endif %}
    76	
    77	        <!-- 最後へ -->
    78	        {% if pages.last != pages.lastPageInRange %}
    79	            <li class="page-item">
    80	                {# FIXME: Need check pass routes before use default _route from request #}
    81	                {% set request = app.request.query.all|merge({'page_no': pages.last}) %}
    82	                {% set request = id is defined ? request|merge({'id': id}) : request %}
    83	                {% set request = nonce is defined ? request|merge({'nonce': nonce}) : request %}
    84	                <a class="page-link"
    85	                   href="{{ path(routes ? routes : app.request.attributes.get('_route'), request) }}">{{ 'admin.common.last'|trans }}</a></li>
    86	        {% endif %}
    87	
    88	    </ul>
    89	{% endif %}

exec
/bin/bash -lc 'rg -n "admin_shipping_standby_search" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /home/y-saito/Developments/ec-cube-enterprise/app 2>/dev/null' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:261:        return !empty($pageNo) ? $this->redirectToRoute('admin_shipping_standby_search', ['page_no' => $pageNo]) : ($this->redirectToRoute('admin_shipping_standby'));

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php | sed -n '250,285p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   250	        } catch (\InvalidArgumentException $e) {
   251	            $this->addError($e->getMessage(), 'admin');
   252	
   253	            return $this->redirectToRoute('admin_shipping_standby_edit', [
   254	                'id' => $id,
   255	            ]);
   256	        }
   257	
   258	        $this->addSuccess('admin.common.delete_complete', 'admin');
   259	        $pageNo = $request->getSession()->get("admin.{$this->sessionKey}.search.page_no");
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

exec
/bin/bash -lc "rg -n \"function search\\(|traitSearch|generateForm\" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
47:        SearchControllerTrait::search as traitSearch;
131:            $generateForm = $builder->getForm();
135:                'generateForm' => $generateForm->createView(),
267:    public function search(Request $request, ?int $patternId = null, int $pageNo = 1): array
269:        $result = $this->traitSearch($request, $patternId, $pageNo);
271:        $result['generateForm'] = $builder->getForm()->createView();

codex
FALSE_POSITIVE: なし。3件とも designRef/implRef は実在し、設計記述と実装差分は確認できました。

SEVERITY | ①ルート/パス | 表示件数 option value の差分は `med` ではなく `low` 相当。実装は `/standby/page/1?page_count=...` だが同じ `index()` に到達し、表示件数は `page_count` クエリで処理されるため、確認できる業務影響はURL形式差に留まる | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html:231`, 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:217`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:93` | findingは残し、severityをlowへ下げる

WEAK_EVIDENCE | ⑤画面遷移・引き継ぎ状態 | 3件目のevidenceにある「翻訳文言を再検証済み」は、JSON単体では根拠ファイルが implRef に含まれていない。差分自体は正しいが、翻訳キーの実文言まで主張するなら locale ファイルを implRef/evidence に明示すべき | 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:317`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1689`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1690` | implRefに `messages.ja.yaml:1688-1690` を追加する

MISSED: なし。処理フロー、検索条件、判定順序、バリデーション、セッション保存は主要実装と概ね一致していました | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html:238`, `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html:240`, `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html:246`, 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/SearchControllerTrait.php:127`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/SearchControllerTrait.php:148`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:67` | 追加不要

VERDICT: false_positive=0, missed=0, weak_evidence=1, 総合=要修正
tokens used
99,851
FALSE_POSITIVE: なし。3件とも designRef/implRef は実在し、設計記述と実装差分は確認できました。

SEVERITY | ①ルート/パス | 表示件数 option value の差分は `med` ではなく `low` 相当。実装は `/standby/page/1?page_count=...` だが同じ `index()` に到達し、表示件数は `page_count` クエリで処理されるため、確認できる業務影響はURL形式差に留まる | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html:231`, 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:217`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:93` | findingは残し、severityをlowへ下げる

WEAK_EVIDENCE | ⑤画面遷移・引き継ぎ状態 | 3件目のevidenceにある「翻訳文言を再検証済み」は、JSON単体では根拠ファイルが implRef に含まれていない。差分自体は正しいが、翻訳キーの実文言まで主張するなら locale ファイルを implRef/evidence に明示すべき | 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:317`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1689`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1690` | implRefに `messages.ja.yaml:1688-1690` を追加する

MISSED: なし。処理フロー、検索条件、判定順序、バリデーション、セッション保存は主要実装と概ね一致していました | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html:238`, `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html:240`, `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html:246`, 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/SearchControllerTrait.php:127`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/SearchControllerTrait.php:148`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:67` | 追加不要

VERDICT: false_positive=0, missed=0, weak_evidence=1, 総合=要修正

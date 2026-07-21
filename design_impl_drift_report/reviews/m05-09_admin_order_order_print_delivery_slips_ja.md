OpenAI Codex v0.142.5
--------
workdir: /home/y-saito/Developments/hareruya-design-docs
model: gpt-5.5
provider: openai
approval: never
sandbox: read-only
reasoning effort: medium
reasoning summaries: none
session id: 019f26aa-e2fc-74d2-bd2c-e46bf908dd56
--------
user
あなたは設計書vs実装の差分監査に対する**批判的レビュア**です。読み取り専用で検証してください。創作禁止・確認できないものは「確認不能」と明記。

## 対象機能: m05-09_admin_order_order_print_delivery_slips_ja
- 差分候補JSON(検証対象): /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-09_admin_order_order_print_delivery_slips_ja.json
- 設計書HTML(正): /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.html
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
まず候補JSONと設計HTMLの該当箇所、実装側の参照先を読みます。読み取り専用で、参照行が本当に合っているかから確認します。
exec
/bin/bash -lc "sed -n '1,240p' /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-09_admin_order_order_print_delivery_slips_ja.json" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
{
  "functionId": "m05-09_admin_order_order_print_delivery_slips_ja",
  "title": "m05-09_admin_order_order_print_delivery_slips_ja（受注管理_納品書印刷（日本語））",
  "domain": "m05",
  "kind": "admin",
  "designHtml": "function_spec_html_preview/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.html",
  "findings": [
    {
      "dimension": "④DBカラム・DB操作・テーブル",
      "severity": "low",
      "designRef": "function_spec_html_preview/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.html:263",
      "designQuote": "dtb_order … order_no、名前・電話・郵便・住所群、請求側の複数請求項目、税項目",
      "implRef": "src/Eccube/Repository/DtbShippingStandbyRepository.php:281",
      "difference": "設計はdtb_orderの代表列として order_no を挙げるが、納品書に「注文番号」として表示される値は実装ではクエリの o.order_number（DtbShippingStandbyRepository.php:281 で 'o.order_number AS order_number'）を選択し、delivery_slips.ja.twig:42 の DeliverySlip.order_number で表示している。Order.php では order_no（464-465, dtb_order.order_no, STRING(255) nullable）と order_number（647-648, dtb_order.order_number, STRING(11) unsigned, comment '注文番号'）が別々に定義されており、この機能で実際の注文番号表示ソースは order_number。order_no は index 用に別存在。DB列名の細部相違。設計はDB相違時 ec-cube-enterprise を正とする方針だが事実として記録。",
      "confidence": "med",
      "verdict": "CONFIRMED",
      "evidence": "DtbShippingStandbyRepository.php:281 'o.order_number AS order_number'; delivery_slips.ja.twig:42 DeliverySlip.order_number 表示; Order.php:647-648 order_number(STRING 11 unsigned comment '注文番号'); Order.php:464-465 order_no(STRING 255) は別列; 設計HTML:263 dtb_order代表列 order_no 記載"
    }
  ]
}

exec
/bin/bash -lc "nl -ba function_spec_html_preview/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.html | sed -n '1,260p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<!doctype html>
     2	<html lang="ja">
     3	<head>
     4	  <meta charset="utf-8">
     5	  <meta name="viewport" content="width=device-width, initial-scale=1">
     6	  <title>m05-09_admin_order_order_print_delivery_slips_ja（受注管理_納品書印刷（日本語）） - 機能仕様書</title>
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
   187	<a class="lv3" href="#受注一覧から日本語の納品書を開く-クライアント">受注一覧から日本語の納品書を開く（クライアント）</a>
   188	<a class="lv3" href="#サーバが一覧POSTを受ける-この機能の確認値">サーバが一覧POSTを受ける（この機能の確認値）</a>
   189	<a class="lv2" href="#集計条件">集計条件</a>
   190	<a class="lv2" href="#業務ルール・計算">業務ルール・計算</a>
   191	<a class="lv3" href="#入力項目">入力項目</a>
   192	<a class="lv3" href="#エッジケース">エッジケース</a>
   193	<a class="lv2" href="#データ整合性">データ整合性</a>
   194	<a class="lv2" href="#API-バッチ結果">API/バッチ結果</a>
   195	<a class="lv2" href="#入出力">入出力</a>
   196	<a class="lv2" href="#DBカラム">DBカラム</a>
   197	<a class="lv3" href="#DB操作">DB操作</a>
   198	<a class="lv2" href="#バリデーション">バリデーション</a>
   199	<a class="lv2" href="#権限・認可">権限・認可</a>
   200	<a class="lv2" href="#画面遷移">画面遷移</a>
   201	<a class="lv2" href="#エラー処理">エラー処理</a>
   202	<a class="lv2" href="#試行制限">試行制限</a>
   203	<a class="lv2" href="#ログ・監査">ログ・監査</a>
   204	<a class="lv3" href="#ログに出してはいけないもの">ログに出してはいけないもの</a>
   205	<a class="lv2" href="#セッション">セッション</a>
   206	<a class="lv3" href="#セッションへ保存しない情報">セッションへ保存しない情報</a>
   207	<a class="lv2" href="#Cookie">Cookie</a>
   208	<a class="lv2" href="#排他制御・トランザクション">排他制御・トランザクション</a>
   209	<a class="lv2" href="#調査補助-grep">調査補助（grep）</a>
   210	<a class="lv3" href="#HTTPルート名とパス-コード探索用・旧入口節より退避">HTTPルート名とパス（コード探索用・旧入口節より退避）</a></nav>
   211	    </aside>
   212	    <main class="doc-content">
   213	      <header class="page-header">
   214	        <p class="crumb">Source:<br>/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.md</p>
   215	        <h1>m05-09_admin_order_order_print_delivery_slips_ja（受注管理_納品書印刷（日本語））</h1>
   216	      </header>
   217	      <h2 id="概要">概要</h2>
   218	<p>管理画面の受注一覧で、配送単位チェックボックスを選んだうえで「納品書印刷（日本語）」を押すと、新規ウィンドウでHTML製の納品書を開く機能である。送信パラメータの配送ID集合を渡し、<code>lang</code> に日本語を指定したルートへPOSTする。サーバ側では配送マスタの海外フラグが国内として保存されている配送だけが内部結合に残り、注文単位へ集約した連想配列と注文明細一覧を、<code>admin</code> 資産パッケージ内の日本語用テンプレートへ載せて返す。</p>
   219	<p>本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値とするソースは、<code>/{admin_route}/order/print/delivery_slips/ja</code> に相当するSymfonyルート、受注管理コントローラの印刷ハンドラ、配送待機系リポジトリのデータ組み立て、テンプレート <code>ShippingStandby/delivery_slips.ja.twig</code>、設定鍵 <code>eccube_admin_route</code> とする。</p>
   220	<p>対象はブラウザ経由の管理画面である。詳細編集や出荷指示画面から同名テンプレートを開く経路があるが、処理の差分は「本書で扱わないこと」に限定する。</p>
   221	<p>本機能のカスタマイズ区分はカスタマイズであり、挙動は現行リポ（pf-eccube3）の実装を確認値とし、DB関連（テーブル名・列名・保存先）はec-cube-enterpriseを正とする。</p>
   222	<hr>
   223	<h2 id="リニューアル移行時の扱い">リニューアル移行時の扱い</h2>
   224	<p>本機能はカスタマイズ区分がカスタマイズであり、挙動は現行リポ（pf-eccube3）、DBスキーマはec-cube-enterpriseを正とする。本書が参照する受注・出荷・配送・受注明細の主要列（dtb_order、dtb_shipping、dtb_delivery、dtb_order_item）と適格請求書登録番号（dtb_base_info.invoice_registration_number）は、ec-cube-enterpriseの実装で実在を確認した。配送先の国参照は、ec-cube-enterpriseでは外部キーcountry_idとして保持する（本文の旧表記countryはcountry_idに相当する）。並び順キー・論理削除と物理削除の方式・補助テーブルの有無について、現行（pf-eccube3）と移行先（ec-cube-enterprise）の差分は本書では確認していないため、相違が判明した場合はec-cube-enterprise実装を正とする。</p>
   225	<hr>
   226	<h2 id="利用者視点の入口">利用者視点の入口</h2>
   227	<div class="table-wrap"><table><thead><tr><th>入口</th><th>URLエンドポイント</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>受注一覧の「納品書印刷（日本語）」ボタン（一覧に配送行があること、かつチェックが1つ以上）</td><td><code>POST /{admin_route}/order/print/delivery_slips/ja</code>（ルート <code>admin_delivery_slips_export</code>。固定で <code>lang=ja</code> をURLに含める）</td><td>空ウィンドウを開き、一覧のPOST先を上記に差し替えて送信する。国内配送フラグ一致の配送のみが対象となるHTMLが新規ウィンドウに表示される。</td></tr><tr><td>チェックが無い状態で同名ボタンを押したとき</td><td>（送信しない）</td><td><code>alert("チェックボックスが選択されていません")</code> のみであり、ブラウザ遷移は起こさない。</td></tr><tr><td>（参考）一覧はGETのみ <code>admin_delivery_slips_export</code> を叩く運用になっていない</td><td><code>GET …/ja</code></td><td>クエリまたはパラメータに配送ID配列が欠けると異常応答となる。一覧UI経由での通常運用対象外。</td></tr><tr><td>PHPのタイム上限解除のあと、<code>ids[]</code> と内部結合用の配送マスタ海外フラグにより納品書データを構築し…</td><td><code>POST /{admin_route}/order/print/delivery_slips/{lang}</code></td><td>PHPのタイム上限解除のあと、<code>ids[]</code> と内部結合用の配送マスタ海外フラグにより納品書データを構築し、日本語HTMLを応答ボディへ載せて返す。</td></tr><tr><td>ルート要件上は許可されている。リクエストに妥当な配送ID配列が無いときは一覧一括実行と同一の異常経路となる…</td><td><code>GET {lang}=ja</code></td><td>ルート要件上は許可されている。リクエストに妥当な配送ID配列が無いときは一覧一括実行と同一の異常経路となる。一覧UIはPOSTのみ利用する。</td></tr></tbody></table></div>
   228	<p>翻訳キー <code>admin.order.print_delivery_slips_ja</code> の文言がボタン表示に使われる。</p>
   229	<hr>
   230	<h2 id="フロント挙動">フロント挙動</h2>
   231	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>表示要素</td><td>「納品書印刷（日本語）」および英語側の並列ボタンが受注一覧の一括処理帯にある。一覧のチェックボックスは各配送行の <code>ids[]</code>。</td></tr><tr><td>JS挙動</td><td>チェック確認のあと <code>window.open</code> で名前 <code>newwin</code> のウィンドウを開き、<code>form_bulk</code> の <code>action</code> を日本語印刷URLへ、<code>target</code> を <code>newwin</code> へセットして送信する。英語側はURLの末尾言語のみ変更。チェック無しでは <code>preventDefault</code> と <code>alert</code>。</td></tr><tr><td>CSS・レイアウト</td><td>印刷画面は単体ドキュメントに <code>deliveryslips.css</code>（<code>admin</code> パッケージ）を読み込む。受注一覧自体に本機能用の追加レイアウトは無い（既存一覧スタイルのみ）。</td></tr><tr><td>モーダル・ポップアップ</td><td>印刷前の確認モーダルは無い新規ウィンドウ遷移。</td></tr></tbody></table></div>
   232	<p>印刷画面側では読み込み後に <code>#printButton</code> があればクリックで <code>window.print()</code> を実行するのみである。</p>
   233	<hr>
   234	<h2 id="処理フロー">処理フロー</h2>
   235	<h3 id="受注一覧から日本語の納品書を開く-クライアント">受注一覧から日本語の納品書を開く（クライアント）</h3>
   236	<ol><li>利用者が1件以上の配送行チェックボックスを付ける。</li><li>「納品書印刷（日本語）」を押す。</li><li>スクリプトがチェック有無を数え、0件なら警告を表示して終える。</li><li>新規ブラウザウィンドウを開く。</li><li><code>#form_bulk</code> の <code>action</code> を <code>/{admin_route}/order/print/delivery_slips/ja</code> に変更し、<code>target</code> を事前に開いたウィンドウ名へ向ける。</li><li>フォームをPOST送信する（本文は一覧と同一の <code>#form_bulk</code> で、チェック済みの <code>ids[]</code> と共通hiddenが載る）。</li></ol>
   237	<h3 id="サーバが一覧POSTを受ける-この機能の確認値">サーバが一覧POSTを受ける（この機能の確認値）</h3>
   238	<ol><li>管理画面の認証コンテキスト（<code>/{admin_route}/</code> を守るSymfonyファイアウォール設定）へ到達済みとして処理が始まる。</li><li><code>set_time_limit(0)</code> を実施してPHP側のタイム上限を無効にする。</li><li>クエリまたは本文から <code>ids</code> を配列として取り、<code>ids</code> が配列ではないまたは空である場合は、アクセス不存在に相当する異常応答を返す実装となる。</li><li>配送データ取得処理へ次の入力を渡す。海外フラグ引数には「日本語でないとき真」となるブール論理があり、日本語指定ではこの引数が偽となる。もうひとつの引数には配送ID配列となる。</li><li>取得処理内部では、<code>dtb_order</code> 起点に配送・配送マスタ・注文明細・顧客・プレイヤ等を組み立て、<code>shipping.id</code> が入力集合に一致し、かつ配送マスタ海外フラグが手順4の論理値と一致する行だけが内部結合に残る。注文単位の集約配列および明細行配列へ整形する（明細並び順は並び順用トレイトと価格帯オプション2件を入力に使う）。</li><li>モール共通の基本情報（店舗形態を跨いだ取得メソッド名は実装上の細部であり本書では固定しないが、請求書登録番号表示に使われるオブジェクト種別のみ記す）を取得する。</li><li>日本語用納品書テンプレートへ、<code>DeliverySlips</code> と取得した基本情報を渡してHTML応答として返す。既定のコンテンツ種別ではHTMLとなる。</li></ol>
   239	<hr>
   240	<h2 id="集計条件">集計条件</h2>
   241	<div class="table-wrap"><table><thead><tr><th>指標</th><th>集計の要点</th></tr></thead><tbody><tr><td>注文単位の合計数量（明細別ではない総数）</td><td>同一注文の明細について <code>quantity</code> を合計したものをクエリ側で算出し、レイアウト下部の比率表示などに載せる実装となる。テンプレートでは明細ごとの数量も個別セルへ出している。</td></tr><tr><td>日本語一覧に載る請求側の項目</td><td>「お買上額」「送料」「手数料」「ポイント使用」「発送方法」はひとつの注文オブジェクトへ保持される各列相当の値としてテンプレートへ渡される。画面上の桁は通貨表記フィルタが適用される。請求金額と内税額も同順で表示フィルタを通過するテキストとなる。</td></tr></tbody></table></div>
   242	<p>明細並び順は並び順用トレイトと、マスタオプションに登録されている2つの価格しきい値の数値との比較クラスフラグ順を含む並べ替え式をクエリ側が利用する。このしきい値は受注リスト画面の並び順ロジックと同系統のオプション参照であるが、リスト画面と今後も常に完全一致するという保証は本書では扱わない。</p>
   243	<hr>
   244	<h2 id="業務ルール・計算">業務ルール・計算</h2>
   245	<div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>一覧からの入力</td><td>画面上は配送単位チェックのみが本機能固有の増分である。名前 <code>ids[]</code> の配送ID一覧がPOSTされる。リストフォーム共通のトークン欄および名称 <code>filter</code> のチェック状態付随hiddenが混入しうるが、サーバ側の本ハンドラは <code>ids</code> の形状しか検証の主対象としていない確認値となる。データベースへの書き込みは行わない。</td></tr><tr><td>国内配送のみ残す内部結合</td><td>海外フラグ・真側を要求するクエリ構成では、<code>is_abroad</code> が真へ一致する発送のみ残る。日本語側は国内（偽側）のみ残る。このため、画面上で海外向け発送のみを選択して日本語印刷を実行すると、クエリ側で行が結合できず、この後の処理で異常状態や空表示が起きうる（エッジケース表参照）。</td></tr><tr><td>並び順</td><td>クエリ側で並び順用トレイトを呼ぶ。並び順のキー一覧は共通トレイト内の確認値による。</td></tr></tbody></table></div>
   246	<p>明細ごとの「合計」列はレイアウト側で単価と個数から価格表記関数へ渡される前値を乗じて算出する。末尾の一覧行にある数量欄には、レイアウト側で増分集計している明細総数分子とクエリ算出の総数分母を並べる。</p>
   247	<h3 id="入力項目">入力項目</h3>
   248	<p>本機能は永続フォーム入力の保存対象ではないため、画面ラベルを列べた入力項目の5列表は置かない。検証が実質的に効きうる入力は一覧POSTのチェック状態と共通hiddenのみである。</p>
   249	<h3 id="エッジケース">エッジケース</h3>
   250	<div class="table-wrap"><table><thead><tr><th>ケース</th><th>扱い</th></tr></thead><tbody><tr><td><code>ids[]</code> が無いまたは空である</td><td>アクセス不存在に相当する異常応答となる（実装確認値による）。</td></tr><tr><td>国内フラグ側の印刷を選択した一方で選択配送がすべて海外フラグのみ</td><td>内部結合で行が落ち、その後に配列側の組み立て依存で実行時異常となる可能性がある。また空配列に近い中間状態ではHTMLは実質ブランクとなる。</td></tr><tr><td><code>Customer</code> と <code>Player</code> が内部結合に載るクエリ構成</td><td>Playerが無いケースでもプレイヤ行がなくなりクエリ側で失敗または空となる可能性がある。</td></tr><tr><td>同一注文に複数配送が存在し両方選ばれた</td><td>クエリおよび配列結合構造により、結果の単一注文キーを根にした配列要素へ複数配送列が順に上書きされる可能性がある。利用者視点では意図と異なる抜け・重複になりうる運用であり、一覧で重複しない選び方に依存する。</td></tr></tbody></table></div>
   251	<hr>
   252	<h2 id="データ整合性">データ整合性</h2>
   253	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>一覧チェック状態と送信ID</td><td>POSTは送信時点でブラウザがマークしている配送行のみであり、一覧の並び順や検索状態は送信本文には埋め込まない。一覧を再読み込みしないままウィンドウを開けば一覧に見える情報と異なる状態のデータが読まれうる。</td></tr><tr><td>注文側の請求項目と実配送</td><td>画面上部請求情報は注文側のフィールド読み込みであり、複数配送に分割請求されていても画面上は注文総額側に寄っている。複数配送の費目按分との一致は別途業務側で読むべきであり本書では保証しない。</td></tr><tr><td>適格請求書登録番号</td><td>レイアウトは基本情報オブジェクトへ保持される登録番号をそのまま表示するのみであり、桁や形式チェック画面は無い。</td></tr></tbody></table></div>
   254	<hr>
   255	<h2 id="API-バッチ結果">API/バッチ結果</h2>
   256	<p>本機能では外部HTTPS API呼び出しやバッチ起動は行わない。</p>
   257	<hr>
   258	<h2 id="入出力">入出力</h2>
   259	<div class="table-wrap"><table><thead><tr><th>種類</th><th>内容</th></tr></thead><tbody><tr><td>入力（HTTP本文）</td><td>配送ID一覧 <code>ids</code>。テストでも <code>"filter"=&gt;"open"</code> 付随が並ぶ確認値による。共通CSRF名前のhiddenがフォームにある。これらへ対するSymfonyフォームオブジェクト側の項目検証バインドは本ハンドラでは行わない確認値となる。</td></tr><tr><td>成功時出力</td><td>HTML応答。UTF-8のmetaを含む。プリントボタンと複数ページ風レイアウトの表が主体。標準機能としてCSVやPDFバイナリは返さない。</td></tr><tr><td>失敗時出力</td><td>配送ID入力が要件を満たさないときは異常応答（404系）。クエリ異常などは未定義でありフレームワーク既定の異常処理に従う。</td></tr><tr><td>副作用</td><td>読み込みのみ。注文状態・監査イベント・フラッシュメッセージなどの変更はしない。</td></tr></tbody></table></div>
   260	<hr>

exec
/bin/bash -lc 'rg -n "delivery|slip|納品|Print|OrderPdf|pdf|受注" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /home/y-saito/Developments/ec-cube-enterprise/app 2>/dev/null | head -n 200' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/app/template/admin/Customer/customer_address_csv.twig:3:{% set menus = ['customer', 'delivery_csv'] %}
/home/y-saito/Developments/ec-cube-enterprise/app/template/admin/Customer/customer_address_csv.twig:5:{% block title %}{{ 'admin.customer.delivery_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:228:        $logoPath = '/assets/pdf/logo.png';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:668:    #[Route(path: '/%eccube_admin_route%/purchase/pdf_export_return_list', name: 'admin_purchase_pdf_export_return_list', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:669:    public function pdfExportReturnList(Request $request): JsonResponse
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:53:     * @var array<int, int> 売り上げ状況用受注状況
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:112:         * 受注状況.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:130:        // 受注ステータスごとの受注件数.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:133:        // 受注ステータスの一覧.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000003.php:35:                'UPDATE dtb_delivery_time SET delivery_time = :delivery_time WHERE id = :id',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000003.php:38:                    'delivery_time' => ParameterType::STRING,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000003.php:44:        $this->addSql("SELECT setval(pg_get_serial_sequence('dtb_delivery_time', 'id'), COALESCE((SELECT MAX(id) FROM dtb_delivery_time), 1), true)");
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000003.php:54:     * @return array<int, array{id: int, delivery_time: string}>
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000003.php:59:            ['id' => 8, 'delivery_time' => '19～21時'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/LoadDataFixturesEccubeCommand.php:203:        $logoPath = '/assets/pdf/logo.png';
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20240930235959_03.php:54:            dtb_mail_history, dtb_order, dtb_order_item, dtb_order_pdf, dtb_shipping, dtb_product_stock, dtb_mail_history, dtb_product_class, dtb_product_stock
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20240930235959_03.php:58:        $this->addSql('REVOKE SELECT ON dtb_customer, dtb_customer_address, dtb_customer_favorite_product, dtb_order, dtb_order_item, dtb_order_pdf FROM guest;');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:326:                'id' => 'delivery_date_id',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:104:        protected DeliveryDurationRepository $deliveryDurationRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:347:                                if (isset($row[$headerByKey['delivery_fee']]) && StringUtil::isNotBlank($row[$headerByKey['delivery_fee']])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:348:                                    $deliveryFee = str_replace(',', '', $row[$headerByKey['delivery_fee']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:349:                                    $errors = $this->validator->validate($deliveryFee, new GreaterThanOrEqual(['value' => 0]));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:351:                                        $ProductClassOrg->setDeliveryFee($deliveryFee);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:353:                                        $message = trans('admin.common.csv_invalid_greater_than_zero', ['%line%' => $line, '%name%' => $headerByKey['delivery_fee']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:472:                                        if (isset($row[$headerByKey['delivery_fee']]) && StringUtil::isNotBlank($row[$headerByKey['delivery_fee']])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:473:                                            $deliveryFee = str_replace(',', '', $row[$headerByKey['delivery_fee']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:474:                                            $errors = $this->validator->validate($deliveryFee, new GreaterThanOrEqual(['value' => 0]));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:476:                                                $pc->setDeliveryFee($deliveryFee);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:478:                                                $message = trans('admin.common.csv_invalid_greater_than_zero', ['%line%' => $line, '%name%' => $headerByKey['delivery_fee']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:590:                                        if (isset($row[$headerByKey['delivery_fee']]) && StringUtil::isNotBlank($row[$headerByKey['delivery_fee']])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:591:                                            $deliveryFee = str_replace(',', '', $row[$headerByKey['delivery_fee']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:592:                                            $errors = $this->validator->validate($deliveryFee, new GreaterThanOrEqual(['value' => 0]));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:594:                                                $ProductClass->setDeliveryFee($deliveryFee);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:596:                                                $message = trans('admin.common.csv_invalid_greater_than_zero', ['%line%' => $line, '%name%' => $headerByKey['delivery_fee']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1528:        if (isset($row[$headerByKey['delivery_date']]) && StringUtil::isNotBlank($row[$headerByKey['delivery_date']])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1529:            if (preg_match('/^\d+$/', (string) $row[$headerByKey['delivery_date']])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1530:                $DeliveryDuration = $this->deliveryDurationRepository->find($row[$headerByKey['delivery_date']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1532:                    $message = trans('admin.common.csv_invalid_not_found', ['%line%' => $line, '%name%' => $headerByKey['delivery_date']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1538:                $message = trans('admin.common.csv_invalid_not_found', ['%line%' => $line, '%name%' => $headerByKey['delivery_date']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1613:            if (isset($row[$headerByKey['delivery_fee']]) && StringUtil::isNotBlank($row[$headerByKey['delivery_fee']])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1614:                $delivery_fee = str_replace(',', '', $row[$headerByKey['delivery_fee']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1615:                $errors = $this->validator->validate($delivery_fee, new GreaterThanOrEqual(['value' => 0]));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1617:                    $ProductClass->setDeliveryFee($delivery_fee);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1620:                        ['%line%' => $line, '%name%' => $headerByKey['delivery_fee']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1706:        if (isset($row[$headerByKey['delivery_date']]) && $row[$headerByKey['delivery_date']] != '') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1707:            if (preg_match('/^\d+$/', (string) $row[$headerByKey['delivery_date']])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1708:                $DeliveryDuration = $this->deliveryDurationRepository->find($row[$headerByKey['delivery_date']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1710:                    $message = trans('admin.common.csv_invalid_not_found', ['%line%' => $line, '%name%' => $headerByKey['delivery_date']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1716:                $message = trans('admin.common.csv_invalid_not_found', ['%line%' => $line, '%name%' => $headerByKey['delivery_date']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1956:            trans('admin.product.product_csv.delivery_duration_col') => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1957:                'id' => 'delivery_date',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1958:                'description' => 'admin.product.product_csv.delivery_duration_description',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1991:            trans('admin.product.product_csv.delivery_fee_col') => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1992:                'id' => 'delivery_fee',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1993:                'description' => 'admin.product.product_csv.delivery_fee_description',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:221:     * 取消(canceled)。ポイント専用取引(区分6/7)は受注が無いためポイントを差し戻し、
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:222:     * それ以外は従来どおり受注の取消処理を行う。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:235:     * それ以外は従来どおり受注の取消処理を行う。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:249:        // 受注作成パターンには乗せず会員ポイントのみを増減する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:296:            // 既存受注を引き渡し済みにし、取引明細から新規受注を作成する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:309:        // 会員が購入した受注のポイント (付与/使用) を EC 会員残高へ反映する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:310:        // 非会員受注や取引IDが無い場合は applier 側で skip される。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:317:     * Pattern 1: 既存オンライン受注を引渡し済みにする。ポイント付与対象は既存オンライン受注。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:323:        // Pattern 1 は構造上 1 注文 = 1 スマレジ商品のため先頭の既存受注を付与対象とする。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:328:     * Pattern 2-7: 既存受注を引渡し済みにし新規受注を作成する。ポイント付与対象は新規受注 (戻り値の末尾)。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:324:                'id' => 'delivery_date_id',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiUpdatePointCommand.php:38:        $this->addArgument('orderId', InputArgument::OPTIONAL, '対象受注ID', '');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:36: * Messenger のリトライに委ねる（管理画面の受注編集画面で連携失敗を確認できるようにする）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:73:                $this->failJob($Job, '受注が見つかりません (orderId='.$message->getOrderId().').');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:146:     * 連携失敗を受注側にも記録する（管理画面の受注編集画面で確認できるようにする）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/CustomExportCsvController.php:66:     * 商品・受注・配送・在庫共通のCSV出力を行う。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOtcSyncMessageHandler.php:84:                    $this->failJob($Job, sprintf('受注が見つかりません (orderId=%d).', $message->getOrderId()));
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/purchaseflow.yaml:23:    eccube.purchase.flow.item.validator.delivery.setting.validator: # 配送設定のチェック
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/purchaseflow.yaml:129:    eccube.purchase.flow.item.holder.preprocessor.delivery.fee.preprocessor:
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/purchaseflow.yaml:140:    eccube.purchase.flow.item.holder.preprocessor.delivery.fee.free.by.shipping.preprocessor:
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/purchaseflow.yaml:222:    eccube.purcahse.flow.item.holder.post.validator.delivery.fee.change.validator: # 送料の変更検知
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:73:                $this->failJob($Job, '受注が見つかりません (orderId='.$message->getOrderId().').');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:144:     * 連携失敗を受注側にも記録する（管理画面の受注編集画面で確認できるようにする）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/PurchaseController.php:73:     * 買取受注IDのセッションキー
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOtcDeleteMessageHandler.php:80:                    $this->failJob($Job, sprintf('受注が見つかりません (orderId=%d).', $message->getOrderId()));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:19:use Eccube\Service\Admin\Order\ActionInput\OrderDirectPrintInput;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:20:use Eccube\Service\Admin\Order\ActionInput\UpdatePrintedOrderStatusInput;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:21:use Eccube\Service\Admin\Order\OrderDirectPrintAction;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:22:use Eccube\Service\Admin\Order\UpdatePrintedOrderStatusAction;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:31:        private readonly OrderDirectPrintAction $orderDirectPrintAction,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:32:        private readonly UpdatePrintedOrderStatusAction $updatePrintedOrderStatusAction,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:44:    public function orderDirectPrint(Request $request, int $base_info_id): StreamedResponse
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:52:            $xmlData = $this->orderDirectPrintAction->handle(new OrderDirectPrintInput(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:77:            // 印刷が完了した受注のステータスを更新
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:78:            $this->updatePrintedOrderStatusAction->handle(new UpdatePrintedOrderStatusInput(
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/prod/eccube_rate_limiter.yaml:29:        mypage_delivery_new:
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/prod/eccube_rate_limiter.yaml:30:            route: mypage_delivery_new
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/prod/eccube_rate_limiter.yaml:35:        mypage_delivery_edit:
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/prod/eccube_rate_limiter.yaml:36:            route: mypage_delivery_edit
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/prod/eccube_rate_limiter.yaml:41:        mypage_delivery_delete:
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/prod/eccube_rate_limiter.yaml:42:            route: mypage_delivery_delete
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:114:     * カート情報から受注データを生成し, `pre_order_id`でカートと受注の紐付けを行う.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:115:     * 既に受注が生成されている場合(pre_order_idで取得できる場合)は, 受注の生成を行わずに画面を表示する.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:140:        // 受注の初期化.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:141:        log_info('[注文手続] 受注の初期化処理を開始します.');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:160:            // 受注明細と同期をとるため, CartPurchaseFlowを実行する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:221:        // 受注の存在チェック.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:225:            log_info('[リダイレクト] 購入処理中の受注が存在しません.');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:308:        // 受注の存在チェック
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:312:            log_info('[注文確認] 購入処理中の受注が存在しません.', [$preOrderId]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:424:        // 受注の存在チェック
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:428:            log_info('[注文処理] 購入処理中の受注が存在しません.', [$preOrderId]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:513:                // 使用ポイントのスマレジ連携ジョブを受注確定と同一トランザクションで作成（dispatch は commit 後）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:554:            // 受注IDをセッションにセット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:580:                    // 受注明細に紐づく売上分析タグ登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:590:            // 受注確定の commit 成功後に使用ポイント連携メッセージを送信する（アウトボックス的な順序）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:621:        // 受注IDを取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:625:            log_info('[注文完了] 受注IDを取得できないため, トップページへ遷移します.');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:690:        // 受注の存在チェック
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:697:        // 受注に紐づくShippingかどうかのチェック.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:770:        // 受注の存在チェック
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:777:        // 受注に紐づくShippingかどうかのチェック.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:830:            return $this->render('Shopping/delivery_confirm.twig', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:858:        // 受注の存在チェック
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:865:        // 受注に紐づくShippingかどうかのチェック.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:1015:        // 受注とカートのずれを合わせるため, カートのPurchaseFlowをコールする.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:1076:        // 受注の存在チェック
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:1083:        // 受注に紐づくShippingかどうかのチェック.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/AggregateSalesCommand.php:29: * 現在は EC 受注のみ対象。スマレジ実店舗販売は未実装のため除外される。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/CartController.php:94:        // 購入フロー途中の選択状態をクリア（お届け先・配送・支払いのセッション／受注紐付け）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/GenerateDummyDataCommand.php:31:    public function __construct(protected ?Generator $generator = null, protected ?EntityManagerInterface $entityManager = null, protected ?DeliveryRepository $deliveryRepository = null, protected ?ProductRepository $productRepository = null)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/GenerateDummyDataCommand.php:116:        $Deliveries = $this->deliveryRepository->findAll();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcDeleteCommand.php:54:            ->addOption('order-id', null, InputOption::VALUE_REQUIRED, '特定の受注 ID のみ enqueue する')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcDeleteCommand.php:55:            ->addOption('limit', null, InputOption::VALUE_REQUIRED, '一括 enqueue する受注の最大件数', '100');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcDeleteCommand.php:81:            $io->success('対象受注はありません。');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcDeleteCommand.php:128:            $io->error(sprintf('受注 ID %s が見つかりません。', $orderId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/NonMemberShoppingController.php:144:                log_info('受注が存在しません');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:47: *   vendor/bin/console eccube:smaregi:otc:create-test-order --delivery=otc
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:61:    private const GUEST_NAME02 = '受注';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:66:        private readonly DeliveryRepository $deliveryRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:78:            ->addOption('delivery', null, InputOption::VALUE_REQUIRED, 'otc または smooth_otc', 'otc')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:80:            ->addOption('price', null, InputOption::VALUE_REQUIRED, '受注金額 (subtotal/total/payment_total)', '1000')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:89:        $deliveryId = $this->resolveDeliveryId((string) $input->getOption('delivery'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:90:        if ($deliveryId === null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:91:            $io->error('--delivery は otc または smooth_otc を指定してください。');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:134:        $delivery = $this->deliveryRepository->find($deliveryId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:135:        if (!$delivery instanceof Delivery) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:136:            $io->error(sprintf('Delivery (id=%d) が見つかりません。', $deliveryId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:158:        $Shipping = $this->buildShipping($baseInfo, $delivery);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:174:            'テスト受注を作成しました。orderId=%d order_number=%s delivery=%d smaregi_shop_id=%s order_date=%s',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:177:            $deliveryId,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:185:    private function resolveDeliveryId(string $deliveryOption): ?int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:187:        return match ($deliveryOption) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:217:    private function buildShipping(BaseInfo $baseInfo, Delivery $delivery): Shipping
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:225:        $Shipping->setDelivery($delivery);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/ResendMailCommand.php:66:            $io->success('購入完了手続き再処理対象の受注はありませんでした。');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShippingMultipleController.php:64:        // 受注の存在チェック
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShippingMultipleController.php:342:        // 受注の存在チェック
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShippingMultipleController.php:389:                    $this->mailService->sendCustomerChangeNotifyMail($Customer, $userData, trans('front.mypage.delivery.notify_title'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:486:    #[Route(path: '/%eccube_admin_route%/product/stock/move_transfer/return_list_pdf_export', name: 'admin_stock_move_transfer_return_list_pdf_export', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:1200:    #[Route(path: '/%eccube_admin_route%/product/stock/join/{id}/pick-list-pdf-export', requirements: ['id' => '\d+'], name: 'admin_stock_join_pick_list_pdf_export', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveController.php:437:    #[Route(path: '/%eccube_admin_route%/product/stock/move/outbound_approval_request/{id}/pick-list-pdf-export', requirements: ['id' => '\d+'], name: 'admin_stock_move_outbound_approval_request_pick_list_pdf_export', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveController.php:1064:    #[Route(path: '/%eccube_admin_route%/product/stock/move/{id}/return-list-pdf-export', requirements: ['id' => '\d+'], name: 'admin_stock_move_return_list_pdf_export', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/OrderUtil.php:21: * 受注に関するユーティリティクラス。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/OrderUtil.php:26:     * 受注情報IDから注文番号を取得する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeliveryController.php:53:    #[Route(path: '/mypage/delivery', name: 'mypage_delivery', methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeliveryController.php:54:    #[Template(template: 'Mypage/delivery.twig')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeliveryController.php:76:    #[Route(path: '/mypage/delivery/new', name: 'mypage_delivery_new', methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeliveryController.php:77:    #[Route(path: '/mypage/delivery/{id}/edit', name: 'mypage_delivery_edit', requirements: ['id' => '\d+'], methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeliveryController.php:78:    #[Template(template: 'Mypage/delivery_edit.twig')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeliveryController.php:110:            $this->generateUrl('mypage_delivery'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeliveryController.php:117:            $parentPage = $this->generateUrl('mypage_delivery');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeliveryController.php:125:        $inputData = $session->get('eccube.front.mypage.delivery.input');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeliveryController.php:132:            $session->remove('eccube.front.mypage.delivery.input');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeliveryController.php:153:            return $this->render('Mypage/delivery_confirm.twig', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeliveryController.php:169:    #[Route(path: '/mypage/delivery/new/complete', name: 'mypage_delivery_new_complete', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeliveryController.php:170:    #[Route(path: '/mypage/delivery/{id}/edit/complete', name: 'mypage_delivery_edit_complete', requirements: ['id' => '\d+'], methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeliveryController.php:177:            $request->getSession()->set('eccube.front.mypage.delivery.input', $request->request->all());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeliveryController.php:179:            return $this->redirectToRoute($id ? 'mypage_delivery_edit' : 'mypage_delivery_new', ['id' => $id]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeliveryController.php:207:            return $this->redirectToRoute('mypage_delivery');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeliveryController.php:210:        return $this->redirectToRoute($id ? 'mypage_delivery_edit' : 'mypage_delivery_new', ['id' => $id]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeliveryController.php:218:    #[Route(path: '/mypage/delivery/{id}/delete', name: 'mypage_delivery_delete', requirements: ['id' => '\d+'], methods: ['DELETE'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeliveryController.php:243:        return $this->redirectToRoute('mypage_delivery');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:67:     * 審査未完了の店頭買取受注一覧取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/EventSubscriber/CustomerIdSetSubscriber.php:43:     * 顧客IDを受注またはカートエンティティーに追加する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/OrderStatusController.php:34:     * 受注ステータス編集画面.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/TaxExtension.php:46:     * 受注作成時点での標準税率と比較し, 異なれば軽減税率として判定する.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiOtcDeleteMessage.php:19: * 店頭受取注文 (OTC) スマレジ商品削除バッチで 1 受注分の処理を依頼するメッセージ。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiOtcDeleteMessage.php:21: * 親バッチコマンド ({@see \Eccube\Command\SmaregiOtcDeleteCommand}) が 1 受注ごとに
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:56:    public function __construct(protected PaymentOptionRepository $paymentOptionRepository, protected DeliveryFeeRepository $deliveryFeeRepository, protected PrefRepository $prefRepository, protected DeliveryRepository $deliveryRepository, protected DeliveryTimeRepository $deliveryTimeRepository, protected SaleTypeRepository $saleTypeRepository, private readonly BaseInfoRepository $baseInfoRepository, private readonly DtbMinimumDeliveryTimeRepository $minimumDeliveryTimeRepository, private readonly MinimumDeliveryTimeUpdateAction $minimumDeliveryTimeUpdateAction)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:63:    #[Route(path: '/%eccube_admin_route%/setting/shop/delivery', name: 'admin_setting_shop_delivery', methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:64:    #[Template(template: '@admin/Setting/Shop/delivery.twig')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:67:        $Deliveries = $this->deliveryRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:90:    #[Route(path: '/%eccube_admin_route%/setting/shop/delivery/new', name: 'admin_setting_shop_delivery_new', methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:91:    #[Route(path: '/%eccube_admin_route%/setting/shop/delivery/{id}/edit', name: 'admin_setting_shop_delivery_edit', requirements: ['id' => '\d+'], methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:92:    #[Template(template: '@admin/Setting/Shop/delivery_edit.twig')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:101:            $DeliveryLatest = $this->deliveryRepository->findOneBy([], ['sort_no' => 'DESC']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:175:        $form['delivery_times']->setData($Delivery->getDeliveryTimes());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:209:                    ->findBy(['delivery_id' => $Delivery->getId()]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:256:                            $message = trans('admin.setting.shop.delivery.payment_warning', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:265:                return $this->redirectToRoute('admin_setting_shop_delivery_edit', ['id' => $Delivery->getId()]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:271:            'delivery_id' => $Delivery->getId(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:276:    #[Route(path: '/%eccube_admin_route%/setting/shop/delivery/{id}/delete', name: 'admin_setting_shop_delivery_delete', requirements: ['id' => '\d+'], methods: ['DELETE'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:287:            return $this->redirectToRoute('admin_setting_shop_delivery');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:291:        $Delivs = $this->deliveryRepository

codex
候補は1件だけですが、実装参照が enterprise 配下に存在するかも含めて確認します。あわせて設計書のDB節全体を見て、候補JSONにない重要差分がないかを広げて見ます。
exec
/bin/bash -lc "nl -ba function_spec_html_preview/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.html | sed -n '260,380p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   260	<hr>
   261	<h2 id="DBカラム">DBカラム</h2>
   262	<p>機能は参照中心である。クエリ側で名前が読み込まれる主な列の代表例のみ示す。</p>
   263	<div class="table-wrap"><table><thead><tr><th>テーブル相当</th><th>列（代表）</th><th>メモ</th></tr></thead><tbody><tr><td><code>dtb_order</code></td><td><code>order_no</code>、名前・電話・郵便・住所群、請求側の複数請求項目、税項目</td><td>「送り主」欄および上部請求欄へ流れる確認値となる。</td></tr><tr><td><code>dtb_shipping</code></td><td>宛先名・電話・郵便・住所群、<code>pref_id</code>、<code>country_id</code>（現行表記 <code>country</code>）、<code>delivery_id</code> 外部参照</td><td>「お届け先」および配送手段名読み込み側。</td></tr><tr><td><code>dtb_delivery</code></td><td><code>name</code>、<code>is_abroad</code></td><td><code>is_abroad</code> がクエリ側のフィルタ中核となる。手段名ラベルを表示へ流す。</td></tr><tr><td><code>dtb_customer</code> とプレイヤ紐付け</td><td>（会員識別子に相当する列）</td><td>納品書の会員番号欄。欠落時結合異常への注意あり。</td></tr><tr><td><code>dtb_order_item</code> 系</td><td><code>product_name</code>、<code>price</code>、<code>quantity</code></td><td>レイアウトの明細行。</td></tr><tr><td>基本情報</td><td><code>invoice_registration_number</code> を含む共通店舗設定群</td><td>「登録番号」へ表示される。書き換え処理はしない。</td></tr></tbody></table></div>
   264	<p>完全な列リストはDoctrineマッピングと実際のJOIN句を確認する。</p>
   265	<h3 id="DB操作">DB操作</h3>
   266	<p>本機能は参照系（検索・出力）であり、DBへの登録・更新・削除は行わない。テーブル名は ec-cube-enterprise を正典とする。</p>
   267	<div class="table-wrap"><table><thead><tr><th>操作種別</th><th>対象テーブル</th><th>契機・条件</th></tr></thead><tbody><tr><td>検索</td><td>dtb_customer / dtb_delivery / dtb_order / dtb_order_item / dtb_shipping</td><td>検索条件に合致するレコードを抽出する。抽出結果を所定フォーマットでファイル出力する。</td></tr></tbody></table></div>
   268	<hr>
   269	<h2 id="バリデーション">バリデーション</h2>
   270	<div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>配送ID配列形状</td><td>「配列でかつ空でない」だけをハンドラ先頭で確認する。この以外の桁・所有権・状態は当ハンドラで検証しない。</td></tr><tr><td>アクセス権</td><td>一覧で見える配送かどうかは一覧側とテナント行制御の合成結果であり、本機能単体での二重チェックは置かない本書での確認値となる。</td></tr></tbody></table></div>
   271	<hr>
   272	<h2 id="権限・認可">権限・認可</h2>
   273	<div class="table-wrap"><table><thead><tr><th>利用者状態</th><th>納品書印刷（一覧POST）HTML生成</th></tr></thead><tbody><tr><td>未ログイン管理者</td><td><code>/</code> 配下へ付与されている管理ログインへの誘導対象となる。</td></tr><tr><td>管理画面ログイン済み</td><td>Symfonyの管理ファイアウォールにより当パターンへ入室可能となる前提であり、機能固有の細かなロール細分化はコード上明示されない。この先の許可モデル運用がある場合は管理画面共通方針に従う。</td></tr></tbody></table></div>
   274	<hr>
   275	<h2 id="画面遷移">画面遷移</h2>
   276	<div class="table-wrap"><table><thead><tr><th>条件</th><th>遷移先</th></tr></thead><tbody><tr><td>一覧でチェック付与後にボタン成功</td><td>POSTに成功すると新規ウィンドウボディへ納品書HTMLのみを返す親ドキュメント。一覧ウィンドウ自身は自動遷移しない。</td></tr><tr><td>チェック無し</td><td>一覧に留まる。</td></tr></tbody></table></div>
   277	<p>一覧の検索条件セッションを本ハンドラが読む処理はなく、ウィンドウ遷移前後でセッションの受注検索キーなどを更新しない。</p>
   278	<hr>
   279	<h2 id="エラー処理">エラー処理</h2>
   280	<div class="table-wrap"><table><thead><tr><th>エラー内容</th><th>処理</th></tr></thead><tbody><tr><td>配送ID一覧が要件を欠く</td><td>アクセス不存在相当の異常応答となる。</td></tr><tr><td>アプリ内クエリ異常または配列インデックス不整合（例: クエリ側と集約側キーずれや内部結合空集合）</td><td>フレームワーク既定の異常処理またはランタイム例外に委ねられる。画面上の親切文言は機能固有で保証しない。</td></tr></tbody></table></div>
   281	<hr>
   282	<h2 id="試行制限">試行制限</h2>
   283	<p>本機能ではレートリミットを扱わない。</p>
   284	<hr>
   285	<h2 id="ログ・監査">ログ・監査</h2>
   286	<p>一覧印刷ハンドラ専用の業務ログを残す処理はソース上は確認していない。このためショッピング行動の証跡はアクセスログ側に期待する。</p>
   287	<h3 id="ログに出してはいけないもの">ログに出してはいけないもの</h3>
   288	<ul><li>パスワード</li><li>CSRF関連の入力完全値そのものの恒常ログ化</li><li>なりすまし対策トークン類</li><li>Cookieの完全転記ログ</li><li>セッションIDの完全値</li><li>RememberMeトークンの原値</li></ul>
   289	<hr>
   290	<h2 id="セッション">セッション</h2>
   291	<p>本機能のハンドラはセッション変数へ書き込まない読み込み中心の処理である。</p>
   292	<h3 id="セッションへ保存しない情報">セッションへ保存しない情報</h3>
   293	<p>一覧POSTで送られる配送ID一覧はウィンドウ遷移先で保持されず、セッションキーにも格納されない確認値となる。</p>
   294	<hr>
   295	<h2 id="Cookie">Cookie</h2>
   296	<p>本機能単体として新しいCookieは発行しない。管理ログイン状態は共通の管理認証により維持される。</p>
   297	<hr>
   298	<h2 id="排他制御・トランザクション">排他制御・トランザクション</h2>
   299	<p>本機能は単発リクエスト内の読み込みのみであり、オブジェクトロックや明示トランザクション境界を設けない。注文状態のワークフローと同時競合するときの表示との一致は一覧側の読み込みタイミングに依存する。</p>
   300	<hr>
   301	<h2 id="調査補助-grep">調査補助（grep）</h2>
   302	<p>実装との突き合わせに用いルート名およびテンプレートパスだけを列挙する。</p>
   303	<ul><li>Symfonyルート名 <code>admin_delivery_slips_export</code></li><li>テンプレートエイリアス <code>@admin/ShippingStandby/delivery_slips.ja.twig</code></li></ul>
   304	<h3 id="HTTPルート名とパス-コード探索用・旧入口節より退避">HTTPルート名とパス（コード探索用・旧入口節より退避）</h3>
   305	<ul><li><code>admin_delivery_slips_export</code> … <code>POST</code> … <code>/{admin_route}/order/print/delivery_slips/{lang}</code>（PHPのタイム上限解除のあと、<code>ids[]</code> と内部結合用の配送マスタ海外フラグにより納品書データを構築し、日本語HTMLを応答ボディへ載せて返す。）</li><li><code>admin_delivery_slips_export</code> … <code>GET</code> … <code>{lang}=ja</code>（ルート要件上は許可されている。リクエストに妥当な配送ID配列が無いときは一覧一括実行と同一の異常経路となる。一覧UIはPOSTのみ利用する。）</li></ul>
   306	      <footer>このページは機能仕様書Markdownから自動生成されています。編集は元のMarkdownに対して行ってください。</footer>
   307	    </main>
   308	  </div>
   309	</body>
   310	</html>

exec
/bin/bash -lc "rg -n \"class DtbShippingStandbyRepository|order_number AS order_number|delivery_slips\\.ja|admin_delivery_slips_export|print/delivery_slips\" /home/y-saito/Developments/ec-cube-enterprise /home/y-saito/Developments/hareruya-design-docs 2>/dev/null" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "find /home/y-saito/Developments/ec-cube-enterprise -path '*DtbShippingStandbyRepository.php' -o -path '*delivery_slips.ja.twig' -o -path '*Order.php' | sed -n '1,120p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 2041ms:
/home/y-saito/Developments/ec-cube-enterprise/vendor/doctrine/collections/src/Order.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrder.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php

 succeeded in 2744ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1514:            'o.order_number AS order_number',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:173:                $('#form_bulk').attr('action', "{{ url('admin_delivery_slips_export', { 'lang': 'ja' }) }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:186:                $('#form_bulk').attr('action', "{{ url('admin_delivery_slips_export', { 'lang': 'en' }) }}");
/home/y-saito/Developments/hareruya-design-docs/e2e/spec/admin/m05/m05_10_admin_order_order_print_delivery_slips_en.spec.ts:5: * 【screenExists=true】刷新先 ec-cube-enterprise に本機能は実在する（ルート admin_delivery_slips_export /
/home/y-saito/Developments/hareruya-design-docs/e2e/spec/admin/m05/m05_10_admin_order_order_print_delivery_slips_en.spec.ts:59:      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/order/print/delivery_slips/en?ids[]=1`);
/home/y-saito/Developments/hareruya-design-docs/e2e/spec/admin/m05/m05_10_admin_order_order_print_delivery_slips_en.spec.ts:98:        `/${ECCUBE_ADMIN_ROUTE}/order/print/delivery_slips/xx?ids[]=1`
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_09_admin_order_order_print_delivery_slips_ja_e2e_cases.md:11:本機能は設計源が現行リポ pf-eccube3（リバース）であるため、**基本設計・観点表を上位オラクル**とし、刷新先 ec-cube-enterprise との乖離は付帯表4（不具合候補）に出す。刷新先 ec-cube-enterprise には該当画面（受注一覧の一括「納品書印刷（日本語）」ボタン → ルート `admin_delivery_slips_export`）が**存在する**（screenExists=true）。
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_09_admin_order_order_print_delivery_slips_ja_e2e_cases.md:37:3. 「納品書印刷（日本語）」を押下"	新規ウィンドウ（名前 newwin）が開いて印刷ルート（/admin/order/print/delivery_slips/ja）へ遷移し、納品書HTML（タイトル「納品書」見出し「納品書」）が表示されること。さらに帳票本文に「注文番号」「送り主」等の帳票項目（設計書 帳票フォーマット定義）が描画され、対象データが空でない国内配送の納品書であること（空データなら本文に帳票項目が現れない＝空通過を検出）。
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_09_admin_order_order_print_delivery_slips_ja_e2e_cases.md:41:m05-09_admin_order_order_print_delivery_slips_ja（受注管理_納品書印刷（日本語））	E2E-M05-09-030	IT-27	出力失敗	P1	配送ID（ids）無しで印刷URLへアクセスすると404異常応答になる	管理ログイン済／SEED-M05-09-ADMIN	ids＝なし	"1. ids を付けずに /admin/order/print/delivery_slips/ja へアクセス"	HTTP 404（アクセス不存在に相当する異常応答）が返ること。
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_09_admin_order_order_print_delivery_slips_ja_e2e_cases.md:42:m05-09_admin_order_order_print_delivery_slips_ja（受注管理_納品書印刷（日本語））	E2E-M05-09-031	IT-13	URL直接アクセス	P2	印刷URLへ直接アクセス（idsが配列でないスカラー）すると404になる	管理ログイン済／SEED-M05-09-ADMIN	ids＝スカラー（例 ids=invalid・配列でない形）	"1. 一覧UIを経由せず /admin/order/print/delivery_slips/ja?ids=invalid へ直接GETアクセス"	HTTP 404（idsが配列でない＝妥当な配送ID配列が無い異常経路。E2E-030のids空とは別経路）が返ること。
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_09_admin_order_order_print_delivery_slips_ja_e2e_cases.md:44:2. /admin/order/print/delivery_slips/ja?ids[]=<配送ID> へ一覧UIを経由せず直接GETアクセス"	GETルートは要件上許可されており、妥当な配送ID配列があれば通常処理に入り納品書HTML（タイトル「納品書」・HTTP 200）が返ること（E2E-031のGET不正ids→404と対の正常系）。
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_09_admin_order_order_print_delivery_slips_ja_e2e_cases.md:45:m05-09_admin_order_order_print_delivery_slips_ja（受注管理_納品書印刷（日本語））	E2E-M05-09-040	IT-15	未認証	P1	未ログインで印刷URLへアクセスすると管理ログイン画面へ誘導される	未ログイン	—	"1. 未ログイン状態で /admin/order/print/delivery_slips/ja へアクセス"	管理ログイン画面（/admin/login）へ誘導されること。
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_09_admin_order_order_print_delivery_slips_ja_e2e_cases.md:63:セレクタは刷新先 ec-cube-enterprise の Twig/Controller 由来（位置情報のみ）。行番号は現行ソース基準。受注一覧URLはルート `admin_order`（OrderController.php:136）＝ `/{admin_route}/order`。印刷ルートは `admin_delivery_slips_export`（OrderController.php:731）＝ `POST/GET /{admin_route}/order/print/delivery_slips/{lang}`。
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_09_admin_order_order_print_delivery_slips_ja_e2e_cases.md:70:| E2E-M05-09-020 | E2E自動化(要シード) | `#form_bulk`（index.twig:1095）→ JS `window.open('',\'newwin\',…)`＋action=`admin_delivery_slips_export(ja)`＋target=newwin＋submit（index.twig:170-176）。応答テンプレート `<title>納品書</title>`（delivery_slips.ja.twig:19）・見出し `admin.delivery_slips_ja`=「納品書」（:36 / messages.ja.yaml:2436） | 処理フロー（サーバ）7・画面遷移（成功→新規ウィンドウHTML）・成功時出力（HTML） | 007,018,026,027,029 |
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_09_admin_order_order_print_delivery_slips_ja_e2e_cases.md:71:| E2E-M05-09-021 | E2E自動化(要シード) | `#printButton`（delivery_slips.ja.twig:24）trans `admin.common.print`=「印刷する」（messages.ja.yaml:1467）・押下で `window.print()`（delivery_slips.ja.twig:5-9） | フロント挙動（印刷画面 #printButton 表示） | 016相当 |
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_09_admin_order_order_print_delivery_slips_ja_e2e_cases.md:72:| E2E-M05-09-022 | 手動(ネイティブUI) | `#printButton` click→`window.print()`（delivery_slips.ja.twig:5-9）。読み込み後の自動クリックも同経路。ネイティブ印刷ダイアログ自動検証は限定的 | フロント挙動（印刷ボタン押下→window.print() の機能挙動。E2E-021の表示のみと別判定） | 016相当 |
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_09_admin_order_order_print_delivery_slips_ja_e2e_cases.md:73:| E2E-M05-09-030 | E2E自動化 | ルート `admin_delivery_slips_export`（OrderController.php:731）。`ids` が配列でない/空なら `throw new NotFoundHttpException()`（OrderController.php:737-740） | エラー処理（配送ID欠如→404）・失敗時出力（404系） | 009,013,019,024 |
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_09_admin_order_order_print_delivery_slips_ja_e2e_cases.md:75:| E2E-M05-09-032 | E2E自動化(要シード) | ルート `admin_delivery_slips_export` は `methods: ['GET','POST']`（OrderController.php:731）。`$ids = $request->get('ids', [])` が配列かつ非空なら通常処理→`render(delivery_slips.ja.twig)`（OrderController.php:737-748）。一覧の `input[id^="check_"]` value＝配送ID（index.twig:1249） | 利用者視点の入口（GETルート要件上許可・妥当ID配列で通常処理→HTML200）・URL直接アクセス | 030 |
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_09_admin_order_order_print_delivery_slips_ja_e2e_cases.md:77:| E2E-M05-09-050 | 手動(帳票内容) | `delivery_slips.ja.twig`（注文番号:42 / 登録番号 `BaseInfo.invoice_registration_number`:103 / 明細:142-172 / `is_abroad` フィルタは `DtbShippingStandbyRepository::generateDeliverySlips($lang!=='ja', $ids)` OrderController.php:743） | 集計条件・業務ルール（国内のみ残す内部結合）・帳票フォーマット | 001-006,008,016,020,021,022 |
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_09_admin_order_order_print_delivery_slips_ja_e2e_cases.md:82:| E2E-M05-09-054 | 手動(エッジ/帳票) | テンプレートは会員/プレイヤ由来項目（`DeliverySlip.customer_*` 等 delivery_slips.ja.twig:69-）を参照。`generateDeliverySlips` の Customer/Player 内部結合欠落時の表示/例外はデータ依存（OrderController.php:743） | エッジケース（Customer/Player結合欠落）・エラー処理（配列インデックス不整合・内部結合空集合）・不具合候補#7 | 021相当 |
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_09_admin_order_order_print_delivery_slips_ja_e2e_cases.md:168:| 1 | 設計源は pf-eccube3。刷新先 ec-cube-enterprise に同等画面が存在するか | ルート `admin_delivery_slips_export`（OrderController.php:731）・ボタン `#printDeliverySlipsJp`（Order/index.twig:1214）・テンプレート delivery_slips.ja.twig 実在を確認 | 静的確認済（screenExists=true）。pf-eccube3とのボタン位置・JS差分は実機で再確認 | E2E-001,002,010,020 | 要確認(移行整合) |
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_09_admin_order_order_print_delivery_slips_ja_e2e_cases.md:172:| 5 | 印刷ボタン押下で window.print（ブラウザネイティブ印刷ダイアログ） | `#printButton` click→`window.print()`（delivery_slips.ja.twig:5-9） | ネイティブ印刷ダイアログの自動検証は限定的＝手動 | E2E-021,050 | 手動(ネイティブUI) |
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_09_admin_order_order_print_delivery_slips_ja_e2e_cases.md:174:| 7 | 会員情報（Customer/会員番号・住所）の結合が欠落（非会員/退会等）した受注でも帳票が破綻しない | テンプレートは `DeliverySlip.customer_pref_id` 等を参照（delivery_slips.ja.twig:69-）。結合元が無い場合の表示（空欄/例外）はデータ依存 | 会員結合が無い受注で空欄になるか・実行時例外になるかを実機で確認（基本設計の対象データ範囲との整合） | E2E-051,050 | 要確認(結合欠落) |
/home/y-saito/Developments/hareruya-design-docs/e2e/spec/admin/m05/m05_09_admin_order_order_print_delivery_slips_ja.spec.ts:30:const SLIP_TITLE = "納品書"; // delivery_slips.ja.twig:19 <title> / messages.ja.yaml:2436
/home/y-saito/Developments/hareruya-design-docs/e2e/spec/admin/m05/m05_09_admin_order_order_print_delivery_slips_ja.spec.ts:106:      expect(popup.url()).toContain(`/${ECCUBE_ADMIN_ROUTE}/order/print/delivery_slips/ja`);
/home/y-saito/Developments/hareruya-design-docs/e2e/spec/admin/m05/m05_09_admin_order_order_print_delivery_slips_ja.spec.ts:150:      const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/order/print/delivery_slips/ja?ids=invalid`);
/home/y-saito/Developments/hareruya-design-docs/e2e/spec/admin/m05/m05_09_admin_order_order_print_delivery_slips_ja.spec.ts:178:      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/order/print/delivery_slips/ja`);
/home/y-saito/Developments/hareruya-design-docs/e2e/spec/admin/m05/m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja.spec.ts:33:const SLIP_TITLE = "納品書"; // delivery_slips.ja.twig:19 <title> / messages.ja.yaml:2436
/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja.md:5:管理画面「受注管理」配下ナビ項目「出荷指示リスト」（設定 `eccube_nav.yaml` のキー `shipping_instructions` に対応。翻訳キーは `admin.order.shipping_instructions`）から一覧を検索したうえで特定のリストを編集画面で開き、表に並ぶ受注のうちチェックがオンになっている行のみを送信対象として、サーバ側で配送単位まで展開して国内配送フラグに合致する情報だけから納品書用データを組み立て、`delivery_slips.ja.twig` 相当のHTMLを新規ブラウザウィンドウで表示する機能である。ボタンラベルは翻訳キー `admin.order.print_delivery_slips_ja`。
/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja.md:7:本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値とする実装起点はSymfonyルート名 `admin_shipping_standby_print_delivery_slips`、`/{admin_route}/standby/{id}/print/delivery/{lang}`（本機能では `lang=ja` のみ説明対象）、出荷指示用コントローラに付与される印刷用ルートアクション、出荷指示リスト用データアクセス層における納品書構築処理が返す配列およびテンプレート `@admin/ShippingStandby/delivery_slips.ja.twig`、ならびに設定鍵 `eccube_admin_route`（環境変数 `ECCUBE_ADMIN_ROUTE`）とする。
/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja.md:39:| `order_ids` 連想入力のオンキーを受注主キー一覧として読み、当該出荷指示リストに属する送信対象受… | `POST /{admin_route}/standby/{id}/print/delivery/{lang}` | `order_ids` 連想入力のオンキーを受注主キー一覧として読み、当該出荷指示リストに属する送信対象受注だけに絞り、それらにぶら下がる各配送について配送主キーを一意に集める。続けて納品書データ組み立てのうち日本語向けとなる国内配送フラグ条件を渡したあと、`delivery_slips.ja.twig` を応答ボディへ返す。 |
/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja.md:76:8. モール共通基本情報を取得し、`@admin/ShippingStandby/delivery_slips.ja.twig` を描いて返す。
/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja.md:251:レイアウト・税制表示など受注一覧向け日本語テンプレと共通の細部は、同一リポジトリメソッド利用の経路にある設計書 `m05-09_admin_order_order_print_delivery_slips_ja` とテンプレ `delivery_slips.ja.twig` の実装照合により読み替える。
/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja.md:260:- 印刷Twig `src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig`
/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja.md:265:- `admin_shipping_standby_print_delivery_slips` … `POST` … `/{admin_route}/standby/{id}/print/delivery/{lang}`（`order_ids` 連想入力のオンキーを受注主キー一覧として読み、当該出荷指示リストに属する送信対象受注だけに絞り、それらにぶら下がる各配送について配送主キーを一意に集める。続けて納品書データ組み立てのうち日本語向けとなる国内配送フラグ条件を渡したあと、`delivery_slips.ja.twig` を応答ボディへ返す。）
/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-10_admin_order_order_print_delivery_slips_en.md:27:| 受注一覧で複数行のチェックボックスを付け、「納品書印刷（英語）」を押す | `POST /{admin_route}/order/print/delivery_slips/en` | いずれの配送行もチェックされていなければ、日本語のアラート「チェックボックスが選択されていません」が出て送信しない。チェックがある場合、`700x700`程度の名前付きウィンドウを開き、同一フォームを`POST`して英語レイアウトのHTMLを表示する。 |
/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-10_admin_order_order_print_delivery_slips_en.md:28:| アドレス直打ちなどで配列なしまたは空で触る | `GET`または`POST`で`/order/print/delivery_slips/en`に対し`ids`が欠ける、または空配列・非配列 | サーバ側で見つからないリソースとしてHTTP404となる。 |
/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-10_admin_order_order_print_delivery_slips_en.md:29:| `lang`が`ja`または`en`。本書では`en`のとき英語納品書HTMLを返す。リクエストボディまた… | `GET, POST /{admin_route}/order/print/delivery_slips/{lang}` | `lang`が`ja`または`en`。本書では`en`のとき英語納品書HTMLを返す。リクエストボディまたはクエリから`ids`配列（配送IDの整数）を受け取り、空または非配列ならHTTP404とする。 |
/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-10_admin_order_order_print_delivery_slips_en.md:48:### 受注一覧から英語納品書HTMLを開く（`POST admin_delivery_slips_export`、`lang=en`）
/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-10_admin_order_order_print_delivery_slips_en.md:113:| GETで`/order/print/delivery_slips/en?ids[]=…`等形式 | メソッド制約上許容される。`ids`の解釈は同様。クエリ複数同名キーまたは配列表記はSymfonyのパラメータバッグ解釈に従う。 |
/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-10_admin_order_order_print_delivery_slips_en.md:245:| ルート定義クラス実装ファイル | `src/Eccube/Controller/Admin/Order/OrderController.php`内`admin_delivery_slips_export` |
/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-10_admin_order_order_print_delivery_slips_en.md:253:- `admin_delivery_slips_export` … `GET, POST` … `/{admin_route}/order/print/delivery_slips/{lang}`（`lang`が`ja`または`en`。本書では`en`のとき英語納品書HTMLを返す。リクエストボディまたはクエリから`ids`配列（配送IDの整数）を受け取り、空または非配列ならHTTP404とする。）
/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.md:7:本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値とするソースは、`/{admin_route}/order/print/delivery_slips/ja` に相当するSymfonyルート、受注管理コントローラの印刷ハンドラ、配送待機系リポジトリのデータ組み立て、テンプレート `ShippingStandby/delivery_slips.ja.twig`、設定鍵 `eccube_admin_route` とする。
/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.md:25:| 受注一覧の「納品書印刷（日本語）」ボタン（一覧に配送行があること、かつチェックが1つ以上） | `POST /{admin_route}/order/print/delivery_slips/ja`（ルート `admin_delivery_slips_export`。固定で `lang=ja` をURLに含める） | 空ウィンドウを開き、一覧のPOST先を上記に差し替えて送信する。国内配送フラグ一致の配送のみが対象となるHTMLが新規ウィンドウに表示される。 |
/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.md:27:| （参考）一覧はGETのみ `admin_delivery_slips_export` を叩く運用になっていない | `GET …/ja` | クエリまたはパラメータに配送ID配列が欠けると異常応答となる。一覧UI経由での通常運用対象外。 |
/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.md:28:| PHPのタイム上限解除のあと、`ids[]` と内部結合用の配送マスタ海外フラグにより納品書データを構築し… | `POST /{admin_route}/order/print/delivery_slips/{lang}` | PHPのタイム上限解除のあと、`ids[]` と内部結合用の配送マスタ海外フラグにより納品書データを構築し、日本語HTMLを応答ボディへ載せて返す。 |
/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.md:56:5. `#form_bulk` の `action` を `/{admin_route}/order/print/delivery_slips/ja` に変更し、`target` を事前に開いたウィンドウ名へ向ける。
/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.md:244:- Symfonyルート名 `admin_delivery_slips_export`
/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.md:245:- テンプレートエイリアス `@admin/ShippingStandby/delivery_slips.ja.twig`
/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.md:249:- `admin_delivery_slips_export` … `POST` … `/{admin_route}/order/print/delivery_slips/{lang}`（PHPのタイム上限解除のあと、`ids[]` と内部結合用の配送マスタ海外フラグにより納品書データを構築し、日本語HTMLを応答ボディへ載せて返す。）
/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.md:250:- `admin_delivery_slips_export` … `GET` … `{lang}=ja`（ルート要件上は許可されている。リクエストに妥当な配送ID配列が無いときは一覧一括実行と同一の異常経路となる。一覧UIはPOSTのみ利用する。）
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/html_entry_missing_endpoints_recheck.md:181:| Admin | GET | /%eccube_admin_route%/order/print/delivery_slips/{lang} | admin_delivery_slips_export | 受注情報 納品書一括印刷 | Admin/Order/OrderController.php:731 |  |
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_10_admin_order_order_print_delivery_slips_en_e2e_cases.md:9:刷新先確認: ec-cube-enterprise に本機能は実在する（`screenExists=true`）。ルート `admin_delivery_slips_export`＝`GET,POST /<route>/order/print/delivery_slips/{lang}`（`OrderController.php:731`、`lang=ja|en`）、`ids` が非配列/空なら `NotFoundHttpException`＝HTTP404（`OrderController.php:737-741`）、`en` は `delivery_slips.en.twig` をレンダリング（:746）。入口は受注一覧 `admin_order`＝`/<route>/order`（:136）。
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_10_admin_order_order_print_delivery_slips_en_e2e_cases.md:38:m05-10_admin_order_order_print_delivery_slips_en（受注管理 — 納品書印刷・英語）	E2E-M05-10-005	IT-25	HTTPステータス	P2	有効なidsで英語印刷URLへPOSTするとHTTP200で英語見出しが返る	管理ログイン済み／海外配送1件／SEED-M05-10-ABROAD	"ids[]＝海外配送のdtb_shipping.id"	"1. 英語印刷URL（/admin/order/print/delivery_slips/en）へ ids 付きで POST"	HTTP200が返り、英語見出し「Delivery Slip」を含むHTMLであること。
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_10_admin_order_order_print_delivery_slips_en_e2e_cases.md:39:m05-10_admin_order_order_print_delivery_slips_en（受注管理 — 納品書印刷・英語）	E2E-M05-10-006	IT-13	URL直接アクセス	P3	GET形式 ids[] で英語印刷URLへアクセスするとHTTP200のHTMLが返る	管理ログイン済み／海外配送1件／SEED-M05-10-ABROAD	"クエリ ids[]＝海外配送のdtb_shipping.id"	"1. /admin/order/print/delivery_slips/en?ids[]=<id> へGETアクセス"	HTTP200で英語納品書HTMLが返ること（GET/POST両許容）。
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_10_admin_order_order_print_delivery_slips_en_e2e_cases.md:40:m05-10_admin_order_order_print_delivery_slips_en（受注管理 — 納品書印刷・英語）	E2E-M05-10-007	IT-15	状態変化	P1	idsを付けずに英語印刷URLへアクセスするとHTTP404	管理ログイン済み	ids＝なし	"1. /admin/order/print/delivery_slips/en へ ids なしでアクセス"	HTTP404となること（判定順序#1）。
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_10_admin_order_order_print_delivery_slips_en_e2e_cases.md:41:m05-10_admin_order_order_print_delivery_slips_en（受注管理 — 納品書印刷・英語）	E2E-M05-10-008	IT-15	状態変化	P2	ids空または非配列で英語印刷URLへアクセスするとHTTP404	管理ログイン済み	ids＝空/非配列	"1. /admin/order/print/delivery_slips/en?ids= へアクセス"	HTTP404となること（判定順序#1）。
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_10_admin_order_order_print_delivery_slips_en_e2e_cases.md:42:m05-10_admin_order_order_print_delivery_slips_en（受注管理 — 納品書印刷・英語）	E2E-M05-10-009	IT-25	URL	P2	lang要件外のパスは解決されずHTTP404	管理ログイン済み	lang＝ja|en以外	"1. /admin/order/print/delivery_slips/xx?ids[]=1 へアクセス"	ルート要件（lang=ja|en）に合致せずHTTP404となること（判定順序#2）。
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_10_admin_order_order_print_delivery_slips_en_e2e_cases.md:43:m05-10_admin_order_order_print_delivery_slips_en（受注管理 — 納品書印刷・英語）	E2E-M05-10-010	IT-15	未認証	P1	未ログインで英語印刷URLへ直接アクセスすると管理ログイン画面へ誘導される	未ログイン	—	"1. 未ログインで /admin/order/print/delivery_slips/en?ids[]=1 へアクセス"	管理ログイン画面へ誘導されること（権限・認可）。
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_10_admin_order_order_print_delivery_slips_en_e2e_cases.md:48:m05-10_admin_order_order_print_delivery_slips_en（受注管理 — 納品書印刷・英語）	E2E-M05-10-014	IT-22	状態変化	P2	非空だが存在しない配送IDで英語へ送ると404にならずHTTP200・本文は空整形	管理ログイン済み／SEED-M05-10-ORDER	"ids[]＝DBに存在しない配送ID（非空配列）"	"1. /admin/order/print/delivery_slips/en へ 存在しない ids[] 付きでPOST"	idsは非空配列のため判定順序#1の404とはならずHTTP200が返り、該当レコードが無いため納品書本文が空整形であること（判定順序#3で0件）。
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_10_admin_order_order_print_delivery_slips_en_e2e_cases.md:73:| E2E-M05-10-005 | E2E自動化(要シード/直接POST) | ルート admin_delivery_slips_export(OrderController.php:731) / 見出し admin.delivery_slips_en(delivery_slips.en.twig:36 messages.ja.yaml:2457="Delivery Slip") | 入出力(成功時HTML200)・HTTPステータス | IT-...-014,085 |
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/endpoint_combined_list.md:649:| HTML設計のみ | POST | /{admin_route}/order/print/delivery_slips/en | Design/Admin |  | 受注一覧で複数行のチェックボックスを付け、「納品書印刷（英語）」を押す |  | 0203_基本設計仕様書(受注管理機能).html:4143 |  |
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/endpoint_combined_list.md:650:| HTML設計のみ | POST | /{admin_route}/order/print/delivery_slips/ja | Design/Admin |  | 受注一覧の「納品書印刷（日本語）」ボタン（一覧に配送行があること、かつチェックが1つ以上） |  | 0203_基本設計仕様書(受注管理機能).html:3859 |  |
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/endpoint_combined_list.md:651:| HTML設計のみ | POST | /{admin_route}/order/print/delivery_slips/{lang} | Design/Admin |  | PHPのタイム上限解除のあと、`ids[]` と内部結合用の配送マスタ海外フラグにより納品書データを構築し… / `lang`が`ja`または`en`。本書では`en`のとき英語納品書HTMLを返す。リクエストボディまた… |  | 0203_基本設計仕様書(受注管理機能).html:3859; 0203_基本設計仕様書(受注管理機能).html:4143 |  |
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/endpoint_combined_list.md:952:| 実装未記載候補のみ | GET | /%eccube_admin_route%/order/print/delivery_slips/{lang} | Admin | admin_delivery_slips_export |  | 受注情報 納品書一括印刷 |  | Admin/Order/OrderController.php:731 |
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/endpoint_combined_list.md:1380:| 実装未記載候補のみ | POST | /%eccube_admin_route%/order/print/delivery_slips/{lang} | Admin | admin_delivery_slips_export |  | 受注情報 納品書一括印刷 |  | Admin/Order/OrderController.php:731 |
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/endpoint_combined_list.csv:637:HTML設計のみ,POST,/{admin_route}/order/print/delivery_slips/en,/{}/order/print/delivery_slips/en,Design/Admin,,受注一覧で複数行のチェックボックスを付け、「納品書印刷（英語）」を押す,,0203_基本設計仕様書(受注管理機能).html:4143,,1,0
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/endpoint_combined_list.csv:638:HTML設計のみ,POST,/{admin_route}/order/print/delivery_slips/ja,/{}/order/print/delivery_slips/ja,Design/Admin,,受注一覧の「納品書印刷（日本語）」ボタン（一覧に配送行があること、かつチェックが1つ以上）,,0203_基本設計仕様書(受注管理機能).html:3859,,1,0
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/endpoint_combined_list.csv:639:HTML設計のみ,POST,/{admin_route}/order/print/delivery_slips/{lang},/{}/order/print/delivery_slips/{},Design/Admin,,PHPのタイム上限解除のあと、`ids[]` と内部結合用の配送マスタ海外フラグにより納品書データを構築し… / `lang`が`ja`または`en`。本書では`en`のとき英語納品書HTMLを返す。リクエストボディまた…,,0203_基本設計仕様書(受注管理機能).html:3859; 0203_基本設計仕様書(受注管理機能).html:4143,,2,0
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/endpoint_combined_list.csv:940:実装未記載候補のみ,GET,/%eccube_admin_route%/order/print/delivery_slips/{lang},/%eccube_admin_route%/order/print/delivery_slips/{},Admin,admin_delivery_slips_export,,受注情報 納品書一括印刷,,Admin/Order/OrderController.php:731,0,1
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/endpoint_combined_list.csv:1368:実装未記載候補のみ,POST,/%eccube_admin_route%/order/print/delivery_slips/{lang},/%eccube_admin_route%/order/print/delivery_slips/{},Admin,admin_delivery_slips_export,,受注情報 納品書一括印刷,,Admin/Order/OrderController.php:731,0,1
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/endpoint_supplement_data.json:824:      "url": "`GET /%eccube_admin_route%/order/print/delivery_slips/{lang}`",
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_source_function_inventory.tsv:238:m05-01	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	pf-eccube3	hareruya-design-docs/functions/pf-eccube3/m05-01_admin_order_order_search_list.md	admin	order	48	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/SearchOrderController.php	admin_delivery_slips_export,admin_labels_export,admin_order,admin_order_bulk_delete,admin_order_count_pattern,admin_order_delete,admin_order_delete_pattern,admin_order_export_order,admin_order_export_pdf,admin_order_export_shipping,admin_order_generate_standby_list,admin_order_page,admin_order_pdf_download,admin_order_print_stack,admin_order_print_stack_window,admin_order_save_pattern,admin_order_search_pattern,admin_shipping_update_order_status,admin_shipping_update_tracking_number	admin_order,admin_order_page,admin_order_search_pattern,admin_shipping_standby	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/print_stack_window.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/index.twig		dtb_member,dtb_order,dtb_order_pdf,dtb_search_pattern,dtb_shipping,mtb_csv_type,mtb_option,mtb_order_status,mtb_page_max	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderPdfService,OrderStateMachine,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateStackListAction,UpdateStackListInput	GenerateShippingStandbyType,OrderPdfType,SearchOrderType
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_source_function_inventory.tsv:239:m05-02	m05-02_admin_order_order_csv_export（受注管理_受注情報CSV出力）	pf-eccube3	hareruya-design-docs/functions/pf-eccube3/m05-02_admin_order_order_csv_export.md	admin	order	27	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php	admin_delivery_slips_export,admin_labels_export,admin_order,admin_order_bulk_delete,admin_order_delete,admin_order_export_for_input,admin_order_export_order,admin_order_export_pdf,admin_order_export_shipping,admin_order_generate_standby_list,admin_order_page,admin_order_pdf_download,admin_order_print_stack,admin_order_print_stack_window,admin_shipping_result_csv_import,admin_shipping_update_order_status,admin_shipping_update_tracking_number	admin_order,admin_order_page,admin_shipping_result_csv_import,admin_shipping_standby	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/SearchOrderController.php,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/print_stack_window.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/index.twig		dtb_csv,dtb_member,dtb_order,dtb_order_pdf,dtb_shipping,mtb_csv_type,mtb_option,mtb_order_status	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderCsv,OrderPdfService,OrderStateMachine,PointService,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateStackListAction,UpdateStackListInput	CsvImportType,GenerateShippingStandbyType,OrderPdfType,SearchOrderType
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_source_function_inventory.tsv:240:m05-03	m05-03_admin_order_order_custom_csv_export（受注管理 — カスタム受注CSVダウンロード）	pf-eccube3	hareruya-design-docs/functions/pf-eccube3/m05-03_admin_order_order_custom_csv_export.md	admin	order	27	ec-cube-enterprise/src/Eccube/Controller/Admin/CustomExportCsvController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php	admin_custom_export,admin_delivery_slips_export,admin_labels_export,admin_order,admin_order_bulk_delete,admin_order_delete,admin_order_export_order,admin_order_export_pdf,admin_order_export_shipping,admin_order_generate_standby_list,admin_order_page,admin_order_pdf_download,admin_order_print_stack,admin_order_print_stack_window,admin_shipping_update_order_status,admin_shipping_update_tracking_number	admin_order,admin_order_page,admin_shipping_standby	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/SearchOrderController.php,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/print_stack_window.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/index.twig		dtb_csv,dtb_csv_csv_extension,dtb_csv_extension,dtb_member,dtb_order,dtb_order_pdf,dtb_shipping,mtb_csv_type,mtb_option,mtb_order_status	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvCsvExtensionRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderPdfService,OrderStateMachine,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateStackListAction,UpdateStackListInput	GenerateShippingStandbyType,OrderPdfType,SearchOrderType
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_source_function_inventory.tsv:241:m05-04	m05-04_admin_order_order_shipping_csv_export（管理画面_受注管理_配送CSV出力）	pf-eccube3	hareruya-design-docs/functions/pf-eccube3/m05-04_admin_order_order_shipping_csv_export.md	admin	order	14	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php	admin_delivery_slips_export,admin_labels_export,admin_order,admin_order_bulk_delete,admin_order_delete,admin_order_export_order,admin_order_export_pdf,admin_order_export_shipping,admin_order_generate_standby_list,admin_order_page,admin_order_pdf_download,admin_order_print_stack,admin_order_print_stack_window,admin_shipping_update_order_status,admin_shipping_update_tracking_number	admin_order,admin_order_page,admin_shipping_standby	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/SearchOrderController.php,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/print_stack_window.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/index.twig		dtb_csv,dtb_member,dtb_order,dtb_order_pdf,dtb_shipping,mtb_csv_type,mtb_option,mtb_order_status	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderPdfService,OrderStateMachine,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateStackListAction,UpdateStackListInput	GenerateShippingStandbyType,OrderPdfType,SearchOrderType
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_source_function_inventory.tsv:242:m05-05	受注管理 — 配送カスタムCSV出力	pf-eccube3	hareruya-design-docs/functions/pf-eccube3/m05-05_admin_order_order_shipping_custom_csv_export.md	admin	order	33	ec-cube-enterprise/src/Eccube/Controller/Admin/CustomExportCsvController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php	admin_custom_export,admin_delivery_slips_export,admin_labels_export,admin_order,admin_order_bulk_delete,admin_order_delete,admin_order_export_order,admin_order_export_pdf,admin_order_export_shipping,admin_order_generate_standby_list,admin_order_page,admin_order_pdf_download,admin_order_print_stack,admin_order_print_stack_window,admin_shipping_update_order_status,admin_shipping_update_tracking_number	admin_order,admin_order_page,admin_shipping_standby	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/SearchOrderController.php,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/print_stack_window.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/index.twig		dtb_csv,dtb_csv_csv_extension,dtb_csv_extension,dtb_member,dtb_order,dtb_order_pdf,dtb_shipping,mtb_csv_type,mtb_option,mtb_order_status	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvCsvExtensionRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderPdfService,OrderStateMachine,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateStackListAction,UpdateStackListInput	GenerateShippingStandbyType,OrderPdfType,SearchOrderType
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_source_function_inventory.tsv:243:m05-06	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	pf-eccube3	hareruya-design-docs/functions/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.md	admin	order	42	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php	admin_delivery_slips_export,admin_labels_export,admin_order,admin_order_bulk_delete,admin_order_delete,admin_order_export_order,admin_order_export_pdf,admin_order_export_shipping,admin_order_generate_standby_list,admin_order_mail,admin_order_manual_mail,admin_order_manual_mail_all,admin_order_manual_mail_all_edit,admin_order_manual_mail_edit,admin_order_page,admin_order_pdf_download,admin_order_print_stack,admin_order_print_stack_window,admin_shipping_update_order_status,admin_shipping_update_tracking_number	admin_order,admin_order_edit,admin_order_page,admin_shipping_standby	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/SearchOrderController.php,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/mail.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/mail_confirm.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all_confirm.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_confirm.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/print_stack_window.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/index.twig		dtb_mail_history,dtb_mail_template,dtb_member,dtb_order,dtb_order_pdf,dtb_shipping,dtb_user_mail_history,mtb_csv_type,mtb_option,mtb_order_status	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MailHistoryRepository,MailTemplateRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderPdfService,OrderStateMachine,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateStackListAction,UpdateStackListInput	GenerateShippingStandbyType,OrderMailType,OrderManualMailAllType,OrderManualMailType,OrderPdfType,SearchOrderType
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_source_function_inventory.tsv:244:m05-07	m05-07_admin_order_order_labels_csv_export（管理画面_受注管理_送り状CSV出力）	pf-eccube3	hareruya-design-docs/functions/pf-eccube3/m05-07_admin_order_order_labels_csv_export.md	admin	order	16	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php	admin_delivery_slips_export,admin_labels_export,admin_order,admin_order_bulk_delete,admin_order_delete,admin_order_export_order,admin_order_export_pdf,admin_order_export_shipping,admin_order_generate_standby_list,admin_order_page,admin_order_pdf_download,admin_order_print_stack,admin_order_print_stack_window,admin_shipping_update_order_status,admin_shipping_update_tracking_number	admin_order,admin_order_page,admin_shipping_standby	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/SearchOrderController.php,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/print_stack_window.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/index.twig		dtb_csv,dtb_delivery,dtb_member,dtb_order,dtb_order_item,dtb_order_pdf,dtb_order_sub,dtb_product,dtb_shipping,mtb_csv_type,mtb_option,mtb_order_status	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderPdfService,OrderStateMachine,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateStackListAction,UpdateStackListInput	GenerateShippingStandbyType,OrderPdfType,SearchOrderType
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_source_function_inventory.tsv:245:m05-08	m05-08_admin_order_order_stack_paper_print（受注管理 — スタック用紙印刷）	pf-eccube3	hareruya-design-docs/functions/pf-eccube3/m05-08_admin_order_order_stack_paper_print.md	admin	order	17	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php	admin_delivery_slips_export,admin_labels_export,admin_order,admin_order_bulk_delete,admin_order_delete,admin_order_export_order,admin_order_export_pdf,admin_order_export_shipping,admin_order_generate_standby_list,admin_order_page,admin_order_pdf_download,admin_order_print_stack,admin_order_print_stack_window,admin_shipping_update_order_status,admin_shipping_update_tracking_number	admin_order,admin_order_page,admin_shipping_standby	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/SearchOrderController.php,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/print_stack_window.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/index.twig		dtb_base_info,dtb_member,dtb_order,dtb_order_pdf,dtb_order_sub,dtb_shipping,mtb_csv_type,mtb_option,mtb_order_status	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderPdfService,OrderStateMachine,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateStackListAction,UpdateStackListInput	GenerateShippingStandbyType,OrderPdfType,SearchOrderType
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_source_function_inventory.tsv:246:m05-09	m05-09_admin_order_order_print_delivery_slips_ja（受注管理_納品書印刷（日本語））	pf-eccube3	hareruya-design-docs/functions/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.md	admin	order	15	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php	admin_delivery_slips_export,admin_labels_export,admin_order,admin_order_bulk_delete,admin_order_delete,admin_order_export_order,admin_order_export_pdf,admin_order_export_shipping,admin_order_generate_standby_list,admin_order_page,admin_order_pdf_download,admin_order_print_stack,admin_order_print_stack_window,admin_shipping_update_order_status,admin_shipping_update_tracking_number	admin_order,admin_order_page,admin_shipping_standby	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/SearchOrderController.php,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/print_stack_window.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/index.twig		dtb_base_info,dtb_customer,dtb_delivery,dtb_member,dtb_order,dtb_order_item,dtb_order_pdf,dtb_shipping,mtb_csv_type,mtb_option,mtb_order_status	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderPdfService,OrderStateMachine,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateStackListAction,UpdateStackListInput	GenerateShippingStandbyType,OrderPdfType,SearchOrderType
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_source_function_inventory.tsv:247:m05-10	m05-10_admin_order_order_print_delivery_slips_en（受注管理 — 納品書印刷・英語）	pf-eccube3	hareruya-design-docs/functions/pf-eccube3/m05-10_admin_order_order_print_delivery_slips_en.md	admin	order	29	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php	admin_delivery_slips_export,admin_labels_export,admin_order,admin_order_bulk_delete,admin_order_delete,admin_order_export_order,admin_order_export_pdf,admin_order_export_shipping,admin_order_generate_standby_list,admin_order_page,admin_order_pdf_download,admin_order_print_stack,admin_order_print_stack_window,admin_shipping_standby,admin_shipping_standby_delete,admin_shipping_standby_edit,admin_shipping_standby_page,admin_shipping_standby_print_delivery_slips,admin_shipping_standby_print_picking_list,admin_shipping_standby_update,admin_shipping_update_order_status,admin_shipping_update_tracking_number	admin_order,admin_order_page,admin_shipping_standby,admin_shipping_standby_edit,admin_shipping_standby_search	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/SearchOrderController.php,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/print_stack_window.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/index.twig		dtb_category,dtb_delivery,dtb_member,dtb_order,dtb_order_item,dtb_order_pdf,dtb_shipping,mtb_csv_type,mtb_option,mtb_order_status	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository	CsvExportService,DeleteListAction,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderPdfService,OrderStateMachine,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateCommentAction,UpdateCommentInput,UpdateStackListAction,UpdateStackListInput	GenerateShippingStandbyType,OrderPdfType,SearchOrderType,ShippingStandbyCommentType,ShippingStandbyType
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_source_function_inventory.tsv:248:m05-11	m05-11_admin_order_order_edit（管理画面_受注管理_受注情報編集）	pf-eccube3	hareruya-design-docs/functions/pf-eccube3/m05-11_admin_order_order_edit.md	admin	order	79	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/SearchProductController.php	admin_delivery_slips_export,admin_labels_export,admin_order,admin_order_bulk_delete,admin_order_delete,admin_order_edit,admin_order_export_order,admin_order_export_pdf,admin_order_export_shipping,admin_order_generate_standby_list,admin_order_new,admin_order_page,admin_order_pdf_download,admin_order_print_delivery_slips,admin_order_print_stack,admin_order_print_stack_window,admin_order_search_customer_by_id,admin_order_search_customer_html,admin_order_search_customer_html_page,admin_order_search_order_item_type,admin_search_product,admin_search_product_page,admin_shipping_edit,admin_shipping_notify_mail,admin_shipping_preview_notify_mail,admin_shipping_update_order_status,admin_shipping_update_tracking_number	admin_order,admin_order_edit,admin_order_page,admin_shipping_edit,admin_shipping_standby	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/SearchOrderController.php,ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/mail.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/print_stack_window.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/search_customer.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/detail.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/index.twig		dtb_customer,dtb_member,dtb_order,dtb_order_item,dtb_order_pdf,dtb_payment,dtb_product,dtb_product_class,dtb_shipping,dtb_stockout_history,mtb_csv_type,mtb_customer_status,mtb_option,mtb_order_item_type,mtb_order_status,mtb_tax_type	BaseInfoRepository,CategoryRepository,CustomerRepository,DeliveryRepository,DeviceTypeRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,DtbWaitingNumberRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderItemRepository,OrderItemTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductClassRepository,ProductRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderHelper,OrderNoProcessor,OrderPdfService,OrderStateMachine,PointService,PurchaseContext,PurchaseException,PurchaseFlow,PurchaseFlowResult,ShippingStandbyCsvExporterService,SmaregiApiService,SmaregiCustomerService,TaxRuleService,UpdateStackListAction,UpdateStackListInput	AddCartType,GenerateShippingStandbyType,OrderPdfType,OrderType,SearchCustomerType,SearchOrderType,SearchProductType,ShippingType
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_source_function_inventory.tsv:249:m05-12	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	ec-cube-enterprise	hareruya-design-docs/functions/ec-cube-enterprise/m05-12_admin_order_order_bulk_status_change.md	admin	order	10	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php	admin_delivery_slips_export,admin_labels_export,admin_order,admin_order_bulk_delete,admin_order_delete,admin_order_edit,admin_order_export_order,admin_order_export_pdf,admin_order_export_shipping,admin_order_generate_standby_list,admin_order_new,admin_order_page,admin_order_pdf_download,admin_order_print_delivery_slips,admin_order_print_stack,admin_order_print_stack_window,admin_order_search_customer_by_id,admin_order_search_customer_html,admin_order_search_customer_html_page,admin_order_search_order_item_type,admin_shipping_update_order_status,admin_shipping_update_tracking_number	admin_order,admin_order_edit,admin_order_page,admin_shipping_standby	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/SearchOrderController.php,ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/mail.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/print_stack_window.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/search_customer.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/index.twig		dtb_customer,dtb_member,dtb_order,dtb_order_item,dtb_order_pdf,dtb_payment,dtb_shipping,dtb_stockout_history,mtb_csv_type,mtb_customer_status,mtb_option,mtb_order_item_type,mtb_order_status,mtb_tax_type	BaseInfoRepository,CategoryRepository,CustomerRepository,DeliveryRepository,DeviceTypeRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,DtbWaitingNumberRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderItemTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductClassRepository,ProductRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderHelper,OrderNoProcessor,OrderPdfService,OrderStateMachine,PointService,PurchaseContext,PurchaseException,PurchaseFlow,PurchaseFlowResult,ShippingStandbyCsvExporterService,SmaregiApiService,SmaregiCustomerService,TaxRuleService,UpdateStackListAction,UpdateStackListInput	GenerateShippingStandbyType,OrderPdfType,OrderType,SearchCustomerType,SearchOrderType,SearchProductType
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_source_function_inventory.tsv:251:m05-14	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	ec-cube-enterprise	hareruya-design-docs/functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md	admin	order	10	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php	admin_delivery_slips_export,admin_labels_export,admin_order,admin_order_bulk_delete,admin_order_delete,admin_order_edit,admin_order_export_order,admin_order_export_pdf,admin_order_export_shipping,admin_order_generate_standby_list,admin_order_new,admin_order_page,admin_order_pdf_download,admin_order_print_delivery_slips,admin_order_print_stack,admin_order_print_stack_window,admin_order_search_customer_by_id,admin_order_search_customer_html,admin_order_search_customer_html_page,admin_order_search_order_item_type,admin_shipping_update_order_status,admin_shipping_update_tracking_number	admin_order,admin_order_edit,admin_order_page,admin_shipping_standby	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/SearchOrderController.php,ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/mail.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/print_stack_window.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/search_customer.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/index.twig		dtb_customer,dtb_member,dtb_order,dtb_order_item,dtb_order_pdf,dtb_payment,dtb_shipping,dtb_stockout_history,mtb_csv_type,mtb_customer_status,mtb_option,mtb_order_item_type,mtb_order_status,mtb_tax_type	BaseInfoRepository,CategoryRepository,CustomerRepository,DeliveryRepository,DeviceTypeRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,DtbWaitingNumberRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderItemTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductClassRepository,ProductRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderHelper,OrderNoProcessor,OrderPdfService,OrderStateMachine,PointService,PurchaseContext,PurchaseException,PurchaseFlow,PurchaseFlowResult,ShippingStandbyCsvExporterService,SmaregiApiService,SmaregiCustomerService,TaxRuleService,UpdateStackListAction,UpdateStackListInput	GenerateShippingStandbyType,OrderPdfType,OrderType,SearchCustomerType,SearchOrderType,SearchProductType
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_source_function_inventory.tsv:255:m05-18	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	pf-eccube3	hareruya-design-docs/functions/pf-eccube3/m05-18_admin_order_order_shipping_standby_list_create.md	admin	order	42	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php	admin_delivery_slips_export,admin_labels_export,admin_order,admin_order_bulk_delete,admin_order_delete,admin_order_export_order,admin_order_export_pdf,admin_order_export_shipping,admin_order_generate_standby_list,admin_order_page,admin_order_pdf_download,admin_order_print_stack,admin_order_print_stack_window,admin_shipping_standby,admin_shipping_standby_delete,admin_shipping_standby_edit,admin_shipping_standby_page,admin_shipping_standby_print_delivery_slips,admin_shipping_standby_print_picking_list,admin_shipping_standby_update,admin_shipping_update_order_status,admin_shipping_update_tracking_number	admin_order,admin_order_page,admin_shipping_standby,admin_shipping_standby_edit,admin_shipping_standby_search	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/SearchOrderController.php,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/print_stack_window.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/index.twig		dtb_category,dtb_member,dtb_order,dtb_order_pdf,dtb_order_shipping_standby,dtb_shipping,dtb_shipping_standby,mtb_csv_type,mtb_option,mtb_order_status,mtb_order_type	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository	CsvExportService,DeleteListAction,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderPdfService,OrderStateMachine,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateCommentAction,UpdateCommentInput,UpdateStackListAction,UpdateStackListInput	GenerateShippingStandbyType,OrderPdfType,SearchOrderType,ShippingStandbyCommentType,ShippingStandbyType
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_source_function_inventory.tsv:261:m05-24	m05-24_admin_order_order_shipping_export_for_import（管理画面_受注管理_出荷実績入力用CSV出力）	pf-eccube3	hareruya-design-docs/functions/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.md	admin	order	40	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php	admin_delivery_slips_export,admin_labels_export,admin_order,admin_order_bulk_delete,admin_order_delete,admin_order_export_for_input,admin_order_export_order,admin_order_export_pdf,admin_order_export_shipping,admin_order_generate_standby_list,admin_order_page,admin_order_pdf_download,admin_order_print_stack,admin_order_print_stack_window,admin_shipping_result_csv_import,admin_shipping_update_order_status,admin_shipping_update_tracking_number	admin_order,admin_order_page,admin_shipping_result_csv_import,admin_shipping_standby	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php,ec-cube-enterprise/src/Eccube/Controller/Admin/Order/SearchOrderController.php,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/print_stack_window.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig,ec-cube-enterprise/src/Eccube/Resource/template/admin/index.twig		dtb_member,dtb_order,dtb_order_pdf,dtb_shipping,mtb_csv_type,mtb_option,mtb_order_status	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderCsv,OrderPdfService,OrderStateMachine,PointService,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateStackListAction,UpdateStackListInput	CsvImportType,GenerateShippingStandbyType,OrderPdfType,SearchOrderType
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/html_entry_missing_endpoints_recheck.csv:162:Admin,GET,/%eccube_admin_route%/order/print/delivery_slips/{lang},admin_delivery_slips_export,受注情報 納品書一括印刷,Admin/Order/OrderController.php:731,
/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4094:          <p>本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値とするソースは、<code>/{admin_route}/order/print/delivery_slips/ja</code> に相当するSymfonyルート、受注管理コントローラの印刷ハンドラ、配送待機系リポジトリのデータ組み立て、テンプレート <code>ShippingStandby/delivery_slips.ja.twig</code>、設定鍵 <code>eccube_admin_route</code> とする。</p>
/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4102:          <div class="table-wrap"><table><thead><tr><th>入口</th><th>URLエンドポイント</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>受注一覧の「納品書印刷（日本語）」ボタン（一覧に配送行があること、かつチェックが1つ以上）</td><td><code>POST /{admin_route}/order/print/delivery_slips/ja</code>（ルート <code>admin_delivery_slips_export</code>。固定で <code>lang=ja</code> をURLに含める）</td><td>空ウィンドウを開き、一覧のPOST先を上記に差し替えて送信する。国内配送フラグ一致の配送のみが対象となるHTMLが新規ウィンドウに表示される。</td></tr><tr><td>チェックが無い状態で同名ボタンを押したとき</td><td>（送信しない）</td><td><code>alert("チェックボックスが選択されていません")</code> のみであり、ブラウザ遷移は起こさない。</td></tr><tr><td>（参考）一覧はGETのみ <code>admin_delivery_slips_export</code> を叩く運用になっていない</td><td><code>GET …/ja</code></td><td>クエリまたはパラメータに配送ID配列が欠けると異常応答となる。一覧UI経由での通常運用対象外。</td></tr><tr><td>PHPのタイム上限解除のあと、<code>ids[]</code> と内部結合用の配送マスタ海外フラグにより納品書データを構築し…</td><td><code>POST /{admin_route}/order/print/delivery_slips/{lang}</code></td><td>PHPのタイム上限解除のあと、<code>ids[]</code> と内部結合用の配送マスタ海外フラグにより納品書データを構築し、日本語HTMLを応答ボディへ載せて返す。</td></tr><tr><td>ルート要件上は許可されている。リクエストに妥当な配送ID配列が無いときは一覧一括実行と同一の異常経路となる…</td><td><code>GET {lang}=ja</code></td><td>ルート要件上は許可されている。リクエストに妥当な配送ID配列が無いときは一覧一括実行と同一の異常経路となる。一覧UIはPOSTのみ利用する。</td></tr></tbody></table></div>
/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4111:          <ol><li>利用者が1件以上の配送行チェックボックスを付ける。</li><li>「納品書印刷（日本語）」を押す。</li><li>スクリプトがチェック有無を数え、0件なら警告を表示して終える。</li><li>新規ブラウザウィンドウを開く。</li><li><code>#form_bulk</code> の <code>action</code> を <code>/{admin_route}/order/print/delivery_slips/ja</code> に変更し、<code>target</code> を事前に開いたウィンドウ名へ向ける。</li><li>フォームをPOST送信する（本文は一覧と同一の <code>#form_bulk</code> で、チェック済みの <code>ids[]</code> と共通hiddenが載る）。</li></ol>
/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4178:          <ul><li>Symfonyルート名 <code>admin_delivery_slips_export</code></li><li>テンプレートエイリアス <code>@admin/ShippingStandby/delivery_slips.ja.twig</code></li></ul>
/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4180:          <ul><li><code>admin_delivery_slips_export</code> … <code>POST</code> … <code>/{admin_route}/order/print/delivery_slips/{lang}</code>（PHPのタイム上限解除のあと、<code>ids[]</code> と内部結合用の配送マスタ海外フラグにより納品書データを構築し、日本語HTMLを応答ボディへ載せて返す。）</li><li><code>admin_delivery_slips_export</code> … <code>GET</code> … <code>{lang}=ja</code>（ルート要件上は許可されている。リクエストに妥当な配送ID配列が無いときは一覧一括実行と同一の異常経路となる。一覧UIはPOSTのみ利用する。）</li></ul>
/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4389:          <div class="table-wrap"><table><thead><tr><th>入口</th><th>URLエンドポイント</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>受注一覧で複数行のチェックボックスを付け、「納品書印刷（英語）」を押す</td><td><code>POST /{admin_route}/order/print/delivery_slips/en</code></td><td>いずれの配送行もチェックされていなければ、日本語のアラート「チェックボックスが選択されていません」が出て送信しない。チェックがある場合、<code>700x700</code>程度の名前付きウィンドウを開き、同一フォームを<code>POST</code>して英語レイアウトのHTMLを表示する。</td></tr><tr><td>アドレス直打ちなどで配列なしまたは空で触る</td><td><code>GET</code>または<code>POST</code>で<code>/order/print/delivery_slips/en</code>に対し<code>ids</code>が欠ける、または空配列・非配列</td><td>サーバ側で見つからないリソースとしてHTTP404となる。</td></tr><tr><td><code>lang</code>が<code>ja</code>または<code>en</code>。本書では<code>en</code>のとき英語納品書HTMLを返す。リクエストボディまた…</td><td><code>GET, POST /{admin_route}/order/print/delivery_slips/{lang}</code></td><td><code>lang</code>が<code>ja</code>または<code>en</code>。本書では<code>en</code>のとき英語納品書HTMLを返す。リクエストボディまたはクエリから<code>ids</code>配列（配送IDの整数）を受け取り、空または非配列ならHTTP404とする。</td></tr></tbody></table></div>
/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4396:          <h3 id="function-design-m05-10-m05-10_admin_order_order_print_delivery_slips_en-受注一覧から英語納品書HTMLを開く-POST-admin-delivery-slips-export-lang-en">受注一覧から英語納品書HTMLを開く（<code>POST admin_delivery_slips_export</code>、<code>lang=en</code>）</h3>
/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4413:          <div class="table-wrap"><table><thead><tr><th>ケース</th><th>扱い</th></tr></thead><tbody><tr><td>チェック無しで印刷ボタン</td><td>一覧JSがアラートを出して<code>POST</code>しない。</td></tr><tr><td><code>ids</code>空・欠落・非配列</td><td>HTTP404応答（例外）。</td></tr><tr><td>国内配送のみ選択して英語</td><td>結合条件に合わず納品書配列が空。印刷画面はヘッダと印刷ボタンだけの静止HTMLに近い。</td></tr><tr><td>同一注文の複数配送IDを別々にオン</td><td>結果連想配列キーが注文主キーのためエントリが上書きされうる。意図と異なる一覧になるリスクがある。</td></tr><tr><td>GETで<code>/order/print/delivery_slips/en?ids[]=…</code>等形式</td><td>メソッド制約上許容される。<code>ids</code>の解釈は同様。クエリ複数同名キーまたは配列表記はSymfonyのパラメータバッグ解釈に従う。</td></tr></tbody></table></div>
/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4463:          <div class="table-wrap"><table><thead><tr><th>論理対象</th><th>パスまたは識別子の例</th></tr></thead><tbody><tr><td>ルート定義クラス実装ファイル</td><td><code>src/Eccube/Controller/Admin/Order/OrderController.php</code>内<code>admin_delivery_slips_export</code></td></tr><tr><td>単体テスト名</td><td><code>OrderControllerTest::testBulkPrintDeliverySlipEn</code></td></tr></tbody></table></div>
/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4466:          <ul><li><code>admin_delivery_slips_export</code> … <code>GET, POST</code> … <code>/{admin_route}/order/print/delivery_slips/{lang}</code>（<code>lang</code>が<code>ja</code>または<code>en</code>。本書では<code>en</code>のとき英語納品書HTMLを返す。リクエストボディまたはクエリから<code>ids</code>配列（配送IDの整数）を受け取り、空または非配列ならHTTP404とする。）</li></ul>
/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:7220:          <p>管理画面「受注管理」配下ナビ項目「出荷指示リスト」（設定 <code>eccube_nav.yaml</code> のキー <code>shipping_instructions</code> に対応。翻訳キーは <code>admin.order.shipping_instructions</code>）から一覧を検索したうえで特定のリストを編集画面で開き、表に並ぶ受注のうちチェックがオンになっている行のみを送信対象として、サーバ側で配送単位まで展開して国内配送フラグに合致する情報だけから納品書用データを組み立て、<code>delivery_slips.ja.twig</code> 相当のHTMLを新規ブラウザウィンドウで表示する機能である。ボタンラベルは翻訳キー <code>admin.order.print_delivery_slips_ja</code>。</p>
/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:7221:          <p>本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値とする実装起点はSymfonyルート名 <code>admin_shipping_standby_print_delivery_slips</code>、<code>/{admin_route}/standby/{id}/print/delivery/{lang}</code>（本機能では <code>lang=ja</code> のみ説明対象）、出荷指示用コントローラに付与される印刷用ルートアクション、出荷指示リスト用データアクセス層における納品書構築処理が返す配列およびテンプレート <code>@admin/ShippingStandby/delivery_slips.ja.twig</code>、ならびに設定鍵 <code>eccube_admin_route</code>（環境変数 <code>ECCUBE_ADMIN_ROUTE</code>）とする。</p>
/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:7232:          <div class="table-wrap"><table><thead><tr><th>入口</th><th>URLエンドポイント</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>ナビ「受注管理」→「出荷指示リスト」→検索で対象リストを選択し、<code>admin_shipping_standby_edit</code> の編集を開いたうえで、少なくとも1件オンで「納品書印刷（日本語）」を押したとき</td><td><code>POST /{admin_route}/standby/（出荷指示リスト主キー）/print/delivery/ja</code></td><td><code>window.open</code> で空ウィンドウを開く。<code>#form_bulk</code> の <code>action</code> を上記、<code>target</code> を <code>newwin</code> にセットしてPOSTし、ウィンドウ内に国内配送条件を満たして組み立てたHTML納品書を表示する。</td></tr><tr><td>画面上でオン受注キー一覧が空になるPOST（チェックオフのみ等）</td><td>（上記と同様のPOST URL）</td><td>サーバ側でアクセス不存在に相当する異常応答となる。</td></tr><tr><td>メソッドがGETのみでリクエストにオン受注キー一覧が載らない</td><td><code>GET /{admin_route}/standby/（リスト主キー）/print/delivery/ja</code></td><td>POSTと同種の異常応答となる。編集画面上のウィンドウPOST運用とは別検証となる。</td></tr><tr><td><code>order_ids</code> 連想入力のオンキーを受注主キー一覧として読み、当該出荷指示リストに属する送信対象受…</td><td><code>POST /{admin_route}/standby/{id}/print/delivery/{lang}</code></td><td><code>order_ids</code> 連想入力のオンキーを受注主キー一覧として読み、当該出荷指示リストに属する送信対象受注だけに絞り、それらにぶら下がる各配送について配送主キーを一意に集める。続けて納品書データ組み立てのうち日本語向けとなる国内配送フラグ条件を渡したあと、<code>delivery_slips.ja.twig</code> を応答ボディへ返す。</td></tr><tr><td>メソッド制約として許容される。画面上の通常運用ではPOST主体。GETで本文にオン状態に相当する `ord…</td><td><code>GET {lang}=ja</code></td><td>メソッド制約として許容される。画面上の通常運用ではPOST主体。GETで本文にオン状態に相当する <code>order_ids</code> が載らない場合は異常応答となる。</td></tr></tbody></table></div>
/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:7242:          <ol><li>管理ユーザのログイン状態で管理側ファイアウォールを通過する。</li><li>パス <code>{id}</code> の出荷指示リスト実体が取れない場合、アクセス不存在に相当する異常応答となる。</li><li>HTTPリクエストから連想入力 <code>order_ids</code> を読み、そのキーを配列化したものが空ならアクセス不存在に相当する異常応答となる。</li><li>リストにぶら下がる各受注について、手順3の送信キー集合に含まれるものだけ処理対象に残す。</li><li>対象各受注の各配送について配送主キーを集合へ載せ、<code>array</code> のキー再利用で一意化する。</li><li>配送主キー集合が空ならアクセス不存在に相当する異常応答となる。</li><li><code>{lang}=ja</code> のとき納品書組み立てに「海外向けフラグ」の偽判定を渡し、配送ID配列ごとクエリ実行する実装となる（引数順は関数定義どおり）。</li><li>モール共通基本情報を取得し、<code>@admin/ShippingStandby/delivery_slips.ja.twig</code> を描いて返す。</li></ol>
/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:7305:          <p>レイアウト・税制表示など受注一覧向け日本語テンプレと共通の細部は、同一リポジトリメソッド利用の経路にある設計書 <code>m05-09_admin_order_order_print_delivery_slips_ja</code> とテンプレ <code>delivery_slips.ja.twig</code> の実装照合により読み替える。</p>
/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:7308:          <ul><li>コントローラ実装ファイル <code>src/Eccube/Controller/Admin/Order/ShippingStandbyController.php</code> メソッド <code>printDeliverySlips</code></li><li>ルート属性名 <code>admin_shipping_standby_print_delivery_slips</code></li><li>編集Twig <code>src/Eccube/Resource/template/admin/ShippingStandby/edit.twig</code>（ <code>#printDeliverySlipsJp</code> と <code>#form_bulk</code> ）</li><li>印刷Twig <code>src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig</code></li><li>納品書データ <code>src/Eccube/Repository/DtbShippingStandbyRepository.php</code> メソッド <code>generateDeliverySlips</code></li></ul>
/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:7310:          <ul><li><code>admin_shipping_standby_print_delivery_slips</code> … <code>POST</code> … <code>/{admin_route}/standby/{id}/print/delivery/{lang}</code>（<code>order_ids</code> 連想入力のオンキーを受注主キー一覧として読み、当該出荷指示リストに属する送信対象受注だけに絞り、それらにぶら下がる各配送について配送主キーを一意に集める。続けて納品書データ組み立てのうち日本語向けとなる国内配送フラグ条件を渡したあと、<code>delivery_slips.ja.twig</code> を応答ボディへ返す。）</li><li><code>admin_shipping_standby_print_delivery_slips</code> … <code>GET</code> … <code>{lang}=ja</code>（メソッド制約として許容される。画面上の通常運用ではPOST主体。GETで本文にオン状態に相当する <code>order_ids</code> が載らない場合は異常応答となる。）</li></ul>
/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:8448:    <div class="table-wrap"><table><thead><tr><th>入口</th><th>URLエンドポイント</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>受注複数一括削除を実行する</td><td>`POST /%eccube_admin_route%/order/bulk_delete`</td><td>利用者の送信内容を処理し、処理結果を画面に反映する。</td></tr><tr><td>アップロード用CSV雛形ファイルダウンロードを出力する</td><td>`GET /%eccube_admin_route%/order/csv_template`</td><td>利用者操作に応じて対象ファイルを出力する。</td></tr><tr><td>order export pdfを出力する</td><td>`GET /%eccube_admin_route%/order/export/pdf`</td><td>利用者操作に応じて対象ファイルを出力する。</td></tr><tr><td>order export pdfを実行する</td><td>`POST /%eccube_admin_route%/order/export/pdf`</td><td>利用者の送信内容を処理し、処理結果を画面に反映する。</td></tr><tr><td>order pdf downloadを実行する</td><td>`POST /%eccube_admin_route%/order/export/pdf/download`</td><td>利用者の送信内容を処理し、処理結果を画面に反映する。</td></tr><tr><td>手動メール通知（一件分）を開く</td><td>`GET /%eccube_admin_route%/order/manual_mail`</td><td>指定された画面または対象データを表示する。</td></tr><tr><td>手動メール通知（一件分）を出力する</td><td>`GET /%eccube_admin_route%/order/manual_mail/{orderId}/{templateId}`</td><td>利用者操作に応じて対象ファイルを出力する。</td></tr><tr><td>手動メール通知（一件分）を実行する</td><td>`POST /%eccube_admin_route%/order/manual_mail/{orderId}/{templateId}`</td><td>利用者の送信内容を処理し、処理結果を画面に反映する。</td></tr><tr><td>受注情報 納品書一括印刷を開く</td><td>`GET /%eccube_admin_route%/order/print/delivery_slips/{lang}`</td><td>指定された画面または対象データを表示する。</td></tr><tr><td>顧客情報を検索するを開く</td><td>`GET /%eccube_admin_route%/order/search/customer/html`</td><td>指定された画面または対象データを表示する。</td></tr><tr><td>顧客情報を検索するを実行する</td><td>`POST /%eccube_admin_route%/order/search/customer/html/page/{page_no}`</td><td>利用者の送信内容を処理し、処理結果を画面に反映する。</td></tr><tr><td>order search patternを実行する</td><td>`POST /%eccube_admin_route%/order/search/pattern/{pattern_id}`</td><td>利用者の送信内容を処理し、処理結果を画面に反映する。</td></tr><tr><td>出荷CSVアップロードを出力する</td><td>`GET /%eccube_admin_route%/order/shipping_csv_upload`</td><td>利用者操作に応じて対象ファイルを出力する。</td></tr><tr><td>出荷CSVアップロードを実行する</td><td>`POST /%eccube_admin_route%/order/shipping_csv_upload`</td><td>利用者の送信内容を処理し、処理結果を画面に反映する。</td></tr><tr><td>出荷実績CSVアップロードを実行する</td><td>`POST /%eccube_admin_route%/order/shipping_result_csv/import`</td><td>利用者の送信内容を処理し、処理結果を画面に反映する。</td></tr><tr><td>受注個別削除を削除する</td><td>`DELETE /%eccube_admin_route%/order/{id}/delete`</td><td>削除操作を実行し、処理結果を画面に反映する。</td></tr></tbody></table></div>
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_route_inventory.tsv:124:admin_delivery_slips_export	/%eccube_admin_route%/order,/%eccube_admin_route%/order/bulk_delete,/%eccube_admin_route%/order/export/order,/%eccube_admin_route%/order/export/pdf,/%eccube_admin_route%/order/export/pdf/download,/%eccube_admin_route%/order/export/shipping,/%eccube_admin_route%/order/generate/standby,/%eccube_admin_route%/order/page/{page_no},/%eccube_admin_route%/order/print/delivery_slips/{lang},/%eccube_admin_route%/order/print/stack,/%eccube_admin_route%/order/print/stack/window,/%eccube_admin_route%/order/{id}/delete,/%eccube_admin_route%/shipping/{id}/order_status,/%eccube_admin_route%/shipping/{id}/tracking_number,/%eccube_admin_route%/standby/labels	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php	dtb_member,dtb_order,dtb_order_pdf,dtb_shipping,mtb_csv_type,mtb_option,mtb_order_status	admin_order,admin_order_page,admin_shipping_standby	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderPdfService,OrderStateMachine,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateStackListAction,UpdateStackListInput	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_route_inventory.tsv:164:admin_labels_export	/%eccube_admin_route%/order,/%eccube_admin_route%/order/bulk_delete,/%eccube_admin_route%/order/export/order,/%eccube_admin_route%/order/export/pdf,/%eccube_admin_route%/order/export/pdf/download,/%eccube_admin_route%/order/export/shipping,/%eccube_admin_route%/order/generate/standby,/%eccube_admin_route%/order/page/{page_no},/%eccube_admin_route%/order/print/delivery_slips/{lang},/%eccube_admin_route%/order/print/stack,/%eccube_admin_route%/order/print/stack/window,/%eccube_admin_route%/order/{id}/delete,/%eccube_admin_route%/shipping/{id}/order_status,/%eccube_admin_route%/shipping/{id}/tracking_number,/%eccube_admin_route%/standby/labels	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php	dtb_member,dtb_order,dtb_order_pdf,dtb_shipping,mtb_csv_type,mtb_option,mtb_order_status	admin_order,admin_order_page,admin_shipping_standby	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderPdfService,OrderStateMachine,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateStackListAction,UpdateStackListInput	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_route_inventory.tsv:186:admin_order	/%eccube_admin_route%/order,/%eccube_admin_route%/order/bulk_delete,/%eccube_admin_route%/order/export/order,/%eccube_admin_route%/order/export/pdf,/%eccube_admin_route%/order/export/pdf/download,/%eccube_admin_route%/order/export/shipping,/%eccube_admin_route%/order/generate/standby,/%eccube_admin_route%/order/page/{page_no},/%eccube_admin_route%/order/print/delivery_slips/{lang},/%eccube_admin_route%/order/print/stack,/%eccube_admin_route%/order/print/stack/window,/%eccube_admin_route%/order/{id}/delete,/%eccube_admin_route%/shipping/{id}/order_status,/%eccube_admin_route%/shipping/{id}/tracking_number,/%eccube_admin_route%/standby/labels	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php	dtb_member,dtb_order,dtb_order_pdf,dtb_shipping,mtb_csv_type,mtb_option,mtb_order_status	admin_order,admin_order_page,admin_shipping_standby	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderPdfService,OrderStateMachine,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateStackListAction,UpdateStackListInput	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_route_inventory.tsv:187:admin_order_bulk_delete	/%eccube_admin_route%/order,/%eccube_admin_route%/order/bulk_delete,/%eccube_admin_route%/order/export/order,/%eccube_admin_route%/order/export/pdf,/%eccube_admin_route%/order/export/pdf/download,/%eccube_admin_route%/order/export/shipping,/%eccube_admin_route%/order/generate/standby,/%eccube_admin_route%/order/page/{page_no},/%eccube_admin_route%/order/print/delivery_slips/{lang},/%eccube_admin_route%/order/print/stack,/%eccube_admin_route%/order/print/stack/window,/%eccube_admin_route%/order/{id}/delete,/%eccube_admin_route%/shipping/{id}/order_status,/%eccube_admin_route%/shipping/{id}/tracking_number,/%eccube_admin_route%/standby/labels	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php	dtb_member,dtb_order,dtb_order_pdf,dtb_shipping,mtb_csv_type,mtb_option,mtb_order_status	admin_order,admin_order_page,admin_shipping_standby	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderPdfService,OrderStateMachine,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateStackListAction,UpdateStackListInput	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_route_inventory.tsv:189:admin_order_delete	/%eccube_admin_route%/order,/%eccube_admin_route%/order/bulk_delete,/%eccube_admin_route%/order/export/order,/%eccube_admin_route%/order/export/pdf,/%eccube_admin_route%/order/export/pdf/download,/%eccube_admin_route%/order/export/shipping,/%eccube_admin_route%/order/generate/standby,/%eccube_admin_route%/order/page/{page_no},/%eccube_admin_route%/order/print/delivery_slips/{lang},/%eccube_admin_route%/order/print/stack,/%eccube_admin_route%/order/print/stack/window,/%eccube_admin_route%/order/{id}/delete,/%eccube_admin_route%/shipping/{id}/order_status,/%eccube_admin_route%/shipping/{id}/tracking_number,/%eccube_admin_route%/standby/labels	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php	dtb_member,dtb_order,dtb_order_pdf,dtb_shipping,mtb_csv_type,mtb_option,mtb_order_status	admin_order,admin_order_page,admin_shipping_standby	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderPdfService,OrderStateMachine,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateStackListAction,UpdateStackListInput	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_route_inventory.tsv:193:admin_order_export_order	/%eccube_admin_route%/order,/%eccube_admin_route%/order/bulk_delete,/%eccube_admin_route%/order/export/order,/%eccube_admin_route%/order/export/pdf,/%eccube_admin_route%/order/export/pdf/download,/%eccube_admin_route%/order/export/shipping,/%eccube_admin_route%/order/generate/standby,/%eccube_admin_route%/order/page/{page_no},/%eccube_admin_route%/order/print/delivery_slips/{lang},/%eccube_admin_route%/order/print/stack,/%eccube_admin_route%/order/print/stack/window,/%eccube_admin_route%/order/{id}/delete,/%eccube_admin_route%/shipping/{id}/order_status,/%eccube_admin_route%/shipping/{id}/tracking_number,/%eccube_admin_route%/standby/labels	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php	dtb_member,dtb_order,dtb_order_pdf,dtb_shipping,mtb_csv_type,mtb_option,mtb_order_status	admin_order,admin_order_page,admin_shipping_standby	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderPdfService,OrderStateMachine,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateStackListAction,UpdateStackListInput	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_route_inventory.tsv:194:admin_order_export_pdf	/%eccube_admin_route%/order,/%eccube_admin_route%/order/bulk_delete,/%eccube_admin_route%/order/export/order,/%eccube_admin_route%/order/export/pdf,/%eccube_admin_route%/order/export/pdf/download,/%eccube_admin_route%/order/export/shipping,/%eccube_admin_route%/order/generate/standby,/%eccube_admin_route%/order/page/{page_no},/%eccube_admin_route%/order/print/delivery_slips/{lang},/%eccube_admin_route%/order/print/stack,/%eccube_admin_route%/order/print/stack/window,/%eccube_admin_route%/order/{id}/delete,/%eccube_admin_route%/shipping/{id}/order_status,/%eccube_admin_route%/shipping/{id}/tracking_number,/%eccube_admin_route%/standby/labels	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php	dtb_member,dtb_order,dtb_order_pdf,dtb_shipping,mtb_csv_type,mtb_option,mtb_order_status	admin_order,admin_order_page,admin_shipping_standby	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderPdfService,OrderStateMachine,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateStackListAction,UpdateStackListInput	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_route_inventory.tsv:195:admin_order_export_shipping	/%eccube_admin_route%/order,/%eccube_admin_route%/order/bulk_delete,/%eccube_admin_route%/order/export/order,/%eccube_admin_route%/order/export/pdf,/%eccube_admin_route%/order/export/pdf/download,/%eccube_admin_route%/order/export/shipping,/%eccube_admin_route%/order/generate/standby,/%eccube_admin_route%/order/page/{page_no},/%eccube_admin_route%/order/print/delivery_slips/{lang},/%eccube_admin_route%/order/print/stack,/%eccube_admin_route%/order/print/stack/window,/%eccube_admin_route%/order/{id}/delete,/%eccube_admin_route%/shipping/{id}/order_status,/%eccube_admin_route%/shipping/{id}/tracking_number,/%eccube_admin_route%/standby/labels	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php	dtb_member,dtb_order,dtb_order_pdf,dtb_shipping,mtb_csv_type,mtb_option,mtb_order_status	admin_order,admin_order_page,admin_shipping_standby	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderPdfService,OrderStateMachine,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateStackListAction,UpdateStackListInput	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_route_inventory.tsv:196:admin_order_generate_standby_list	/%eccube_admin_route%/order,/%eccube_admin_route%/order/bulk_delete,/%eccube_admin_route%/order/export/order,/%eccube_admin_route%/order/export/pdf,/%eccube_admin_route%/order/export/pdf/download,/%eccube_admin_route%/order/export/shipping,/%eccube_admin_route%/order/generate/standby,/%eccube_admin_route%/order/page/{page_no},/%eccube_admin_route%/order/print/delivery_slips/{lang},/%eccube_admin_route%/order/print/stack,/%eccube_admin_route%/order/print/stack/window,/%eccube_admin_route%/order/{id}/delete,/%eccube_admin_route%/shipping/{id}/order_status,/%eccube_admin_route%/shipping/{id}/tracking_number,/%eccube_admin_route%/standby/labels	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php	dtb_member,dtb_order,dtb_order_pdf,dtb_shipping,mtb_csv_type,mtb_option,mtb_order_status	admin_order,admin_order_page,admin_shipping_standby	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderPdfService,OrderStateMachine,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateStackListAction,UpdateStackListInput	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_route_inventory.tsv:203:admin_order_page	/%eccube_admin_route%/order,/%eccube_admin_route%/order/bulk_delete,/%eccube_admin_route%/order/export/order,/%eccube_admin_route%/order/export/pdf,/%eccube_admin_route%/order/export/pdf/download,/%eccube_admin_route%/order/export/shipping,/%eccube_admin_route%/order/generate/standby,/%eccube_admin_route%/order/page/{page_no},/%eccube_admin_route%/order/print/delivery_slips/{lang},/%eccube_admin_route%/order/print/stack,/%eccube_admin_route%/order/print/stack/window,/%eccube_admin_route%/order/{id}/delete,/%eccube_admin_route%/shipping/{id}/order_status,/%eccube_admin_route%/shipping/{id}/tracking_number,/%eccube_admin_route%/standby/labels	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php	dtb_member,dtb_order,dtb_order_pdf,dtb_shipping,mtb_csv_type,mtb_option,mtb_order_status	admin_order,admin_order_page,admin_shipping_standby	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderPdfService,OrderStateMachine,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateStackListAction,UpdateStackListInput	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_route_inventory.tsv:204:admin_order_pdf_download	/%eccube_admin_route%/order,/%eccube_admin_route%/order/bulk_delete,/%eccube_admin_route%/order/export/order,/%eccube_admin_route%/order/export/pdf,/%eccube_admin_route%/order/export/pdf/download,/%eccube_admin_route%/order/export/shipping,/%eccube_admin_route%/order/generate/standby,/%eccube_admin_route%/order/page/{page_no},/%eccube_admin_route%/order/print/delivery_slips/{lang},/%eccube_admin_route%/order/print/stack,/%eccube_admin_route%/order/print/stack/window,/%eccube_admin_route%/order/{id}/delete,/%eccube_admin_route%/shipping/{id}/order_status,/%eccube_admin_route%/shipping/{id}/tracking_number,/%eccube_admin_route%/standby/labels	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php	dtb_member,dtb_order,dtb_order_pdf,dtb_shipping,mtb_csv_type,mtb_option,mtb_order_status	admin_order,admin_order_page,admin_shipping_standby	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderPdfService,OrderStateMachine,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateStackListAction,UpdateStackListInput	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_route_inventory.tsv:206:admin_order_print_stack	/%eccube_admin_route%/order,/%eccube_admin_route%/order/bulk_delete,/%eccube_admin_route%/order/export/order,/%eccube_admin_route%/order/export/pdf,/%eccube_admin_route%/order/export/pdf/download,/%eccube_admin_route%/order/export/shipping,/%eccube_admin_route%/order/generate/standby,/%eccube_admin_route%/order/page/{page_no},/%eccube_admin_route%/order/print/delivery_slips/{lang},/%eccube_admin_route%/order/print/stack,/%eccube_admin_route%/order/print/stack/window,/%eccube_admin_route%/order/{id}/delete,/%eccube_admin_route%/shipping/{id}/order_status,/%eccube_admin_route%/shipping/{id}/tracking_number,/%eccube_admin_route%/standby/labels	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php	dtb_member,dtb_order,dtb_order_pdf,dtb_shipping,mtb_csv_type,mtb_option,mtb_order_status	admin_order,admin_order_page,admin_shipping_standby	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderPdfService,OrderStateMachine,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateStackListAction,UpdateStackListInput	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_route_inventory.tsv:207:admin_order_print_stack_window	/%eccube_admin_route%/order,/%eccube_admin_route%/order/bulk_delete,/%eccube_admin_route%/order/export/order,/%eccube_admin_route%/order/export/pdf,/%eccube_admin_route%/order/export/pdf/download,/%eccube_admin_route%/order/export/shipping,/%eccube_admin_route%/order/generate/standby,/%eccube_admin_route%/order/page/{page_no},/%eccube_admin_route%/order/print/delivery_slips/{lang},/%eccube_admin_route%/order/print/stack,/%eccube_admin_route%/order/print/stack/window,/%eccube_admin_route%/order/{id}/delete,/%eccube_admin_route%/shipping/{id}/order_status,/%eccube_admin_route%/shipping/{id}/tracking_number,/%eccube_admin_route%/standby/labels	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php	dtb_member,dtb_order,dtb_order_pdf,dtb_shipping,mtb_csv_type,mtb_option,mtb_order_status	admin_order,admin_order_page,admin_shipping_standby	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderPdfService,OrderStateMachine,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateStackListAction,UpdateStackListInput	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_route_inventory.tsv:471:admin_shipping_update_order_status	/%eccube_admin_route%/order,/%eccube_admin_route%/order/bulk_delete,/%eccube_admin_route%/order/export/order,/%eccube_admin_route%/order/export/pdf,/%eccube_admin_route%/order/export/pdf/download,/%eccube_admin_route%/order/export/shipping,/%eccube_admin_route%/order/generate/standby,/%eccube_admin_route%/order/page/{page_no},/%eccube_admin_route%/order/print/delivery_slips/{lang},/%eccube_admin_route%/order/print/stack,/%eccube_admin_route%/order/print/stack/window,/%eccube_admin_route%/order/{id}/delete,/%eccube_admin_route%/shipping/{id}/order_status,/%eccube_admin_route%/shipping/{id}/tracking_number,/%eccube_admin_route%/standby/labels	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php	dtb_member,dtb_order,dtb_order_pdf,dtb_shipping,mtb_csv_type,mtb_option,mtb_order_status	admin_order,admin_order_page,admin_shipping_standby	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderPdfService,OrderStateMachine,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateStackListAction,UpdateStackListInput	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository
/home/y-saito/Developments/hareruya-design-docs/endpoint_reports/ec_enterprise_route_inventory.tsv:472:admin_shipping_update_tracking_number	/%eccube_admin_route%/order,/%eccube_admin_route%/order/bulk_delete,/%eccube_admin_route%/order/export/order,/%eccube_admin_route%/order/export/pdf,/%eccube_admin_route%/order/export/pdf/download,/%eccube_admin_route%/order/export/shipping,/%eccube_admin_route%/order/generate/standby,/%eccube_admin_route%/order/page/{page_no},/%eccube_admin_route%/order/print/delivery_slips/{lang},/%eccube_admin_route%/order/print/stack,/%eccube_admin_route%/order/print/stack/window,/%eccube_admin_route%/order/{id}/delete,/%eccube_admin_route%/shipping/{id}/order_status,/%eccube_admin_route%/shipping/{id}/tracking_number,/%eccube_admin_route%/standby/labels	ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php	dtb_member,dtb_order,dtb_order_pdf,dtb_shipping,mtb_csv_type,mtb_option,mtb_order_status	admin_order,admin_order_page,admin_shipping_standby	CsvExportService,GenerateListInput,GenerateShippingStandbyListAction,MailService,OrderPdfService,OrderStateMachine,PurchaseFlow,ShippingStandbyCsvExporterService,UpdateStackListAction,UpdateStackListInput	BaseInfoRepository,CustomerRepository,DeliveryRepository,DtbCsvExtensionRepository,DtbSearchPatternRepository,DtbShippingStandbyRepository,MemberRepository,MtbOptionRepository,MtbOrderTypeRepository,OrderPdfRepository,OrderRepository,OrderStatusRepository,PageMaxRepository,PaymentRepository,ProductStatusRepository,ProductStockRepository,SexRepository,ShippingRepository
/home/y-saito/Developments/hareruya-design-docs/e2e/pages/admin/m05/m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja.page.ts:24: *  - 印刷HTML: <title>納品書</title>（delivery_slips.ja.twig:19）/ 見出し admin.delivery_slips_ja=「納品書」（:36 / messages.ja.yaml:2436）
/home/y-saito/Developments/hareruya-design-docs/e2e/pages/admin/m05/m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja.page.ts:26: *  - 印刷画面 #printButton（delivery_slips.ja.twig:25）trans admin.common.print=「印刷する」（messages.ja.yaml:1467）→ window.print()（:5-9）
/home/y-saito/Developments/hareruya-design-docs/e2e/pages/admin/m05/m05_10_admin_order_order_print_delivery_slips_en.page.ts:9: *  - ルート admin_delivery_slips_export = GET,POST /<route>/order/print/delivery_slips/{lang}
/home/y-saito/Developments/hareruya-design-docs/e2e/pages/admin/m05/m05_10_admin_order_order_print_delivery_slips_en.page.ts:47:    return `/${ECCUBE_ADMIN_ROUTE}/order/print/delivery_slips/${lang}`;
/home/y-saito/Developments/hareruya-design-docs/e2e/pages/admin/m05/m05_09_admin_order_order_print_delivery_slips_ja.page.ts:20: *      action=url(admin_delivery_slips_export,{lang:'ja'})→target=newwin→submit（Order/index.twig:170-176）
/home/y-saito/Developments/hareruya-design-docs/e2e/pages/admin/m05/m05_09_admin_order_order_print_delivery_slips_ja.page.ts:22: *  - 印刷ルート admin_delivery_slips_export = POST/GET /<route>/order/print/delivery_slips/{lang}
/home/y-saito/Developments/hareruya-design-docs/e2e/pages/admin/m05/m05_09_admin_order_order_print_delivery_slips_ja.page.ts:24: *  - 印刷HTML: <title>納品書</title>（delivery_slips.ja.twig:19）/ 見出し admin.delivery_slips_ja=「納品書」（:36 / messages.ja.yaml:2436）
/home/y-saito/Developments/hareruya-design-docs/e2e/pages/admin/m05/m05_09_admin_order_order_print_delivery_slips_ja.page.ts:25: *  - 印刷画面 #printButton（delivery_slips.ja.twig:24）trans admin.common.print=「印刷する」（messages.ja.yaml:1467）→ window.print()（:5-9）
/home/y-saito/Developments/hareruya-design-docs/e2e/pages/admin/m05/m05_09_admin_order_order_print_delivery_slips_ja.page.ts:42:    this.printUrlJa = `/${ECCUBE_ADMIN_ROUTE}/order/print/delivery_slips/ja`;
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja_e2e_cases.md:64:| E2E-M05-22-010 | E2E自動化(要シード・国内配送受注) | #printDeliverySlipsJp→window.open('','newwin')→#form_bulk(edit.twig:113) action差替→target=newwin→submit(edit.twig:22-25) / popup <title>納品書(delivery_slips.ja.twig:19 / 見出し admin.delivery_slips_ja messages.ja.yaml:2436) | 処理フロー(クライアント1-4)・画面遷移(子ウィンドウに納品書HTML)／IT-15 状態変化・IT-03 | 015,029,023 |
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja_e2e_cases.md:65:| E2E-M05-22-011 | E2E自動化(要シード・国内配送受注) | popup 本文 注文番号(delivery_slips.ja.twig:42 admin.delivery_slips_ja.order_number messages.ja.yaml:2437) / 送り主(:67 admin.delivery_slips_ja.sender messages.ja.yaml:2440) | 集計条件・入出力(成功時HTML)／IT-18 フォーマット定義 | 001 |
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja_e2e_cases.md:66:| E2E-M05-22-012 | E2E自動化(要シード・国内配送受注) | popup #printButton(delivery_slips.ja.twig:25) trans admin.common.print=「印刷する」(messages.ja.yaml:1467) → window.print()(delivery_slips.ja.twig:5-9) | フロント挙動(印刷トリガボタン帯)／IT-25 UI部品 | 016 |
/home/y-saito/Developments/hareruya-design-docs/integration_test/e2e/m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja_e2e_cases.md:190:| 処理フロー(サーバ7-8 国内フラグ・twig描画) | 海外フラグ偽で組立・delivery_slips.ja.twig 応答 | 010,011 | カバー(国内判定は間接/手動) |
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja.html:218:<p>管理画面「受注管理」配下ナビ項目「出荷指示リスト」（設定 <code>eccube_nav.yaml</code> のキー <code>shipping_instructions</code> に対応。翻訳キーは <code>admin.order.shipping_instructions</code>）から一覧を検索したうえで特定のリストを編集画面で開き、表に並ぶ受注のうちチェックがオンになっている行のみを送信対象として、サーバ側で配送単位まで展開して国内配送フラグに合致する情報だけから納品書用データを組み立て、<code>delivery_slips.ja.twig</code> 相当のHTMLを新規ブラウザウィンドウで表示する機能である。ボタンラベルは翻訳キー <code>admin.order.print_delivery_slips_ja</code>。</p>
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja.html:219:<p>本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値とする実装起点はSymfonyルート名 <code>admin_shipping_standby_print_delivery_slips</code>、<code>/{admin_route}/standby/{id}/print/delivery/{lang}</code>（本機能では <code>lang=ja</code> のみ説明対象）、出荷指示用コントローラに付与される印刷用ルートアクション、出荷指示リスト用データアクセス層における納品書構築処理が返す配列およびテンプレート <code>@admin/ShippingStandby/delivery_slips.ja.twig</code>、ならびに設定鍵 <code>eccube_admin_route</code>（環境変数 <code>ECCUBE_ADMIN_ROUTE</code>）とする。</p>
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja.html:230:<div class="table-wrap"><table><thead><tr><th>入口</th><th>URLエンドポイント</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>ナビ「受注管理」→「出荷指示リスト」→検索で対象リストを選択し、<code>admin_shipping_standby_edit</code> の編集を開いたうえで、少なくとも1件オンで「納品書印刷（日本語）」を押したとき</td><td><code>POST /{admin_route}/standby/（出荷指示リスト主キー）/print/delivery/ja</code></td><td><code>window.open</code> で空ウィンドウを開く。<code>#form_bulk</code> の <code>action</code> を上記、<code>target</code> を <code>newwin</code> にセットしてPOSTし、ウィンドウ内に国内配送条件を満たして組み立てたHTML納品書を表示する。</td></tr><tr><td>画面上でオン受注キー一覧が空になるPOST（チェックオフのみ等）</td><td>（上記と同様のPOST URL）</td><td>サーバ側でアクセス不存在に相当する異常応答となる。</td></tr><tr><td>メソッドがGETのみでリクエストにオン受注キー一覧が載らない</td><td><code>GET /{admin_route}/standby/（リスト主キー）/print/delivery/ja</code></td><td>POSTと同種の異常応答となる。編集画面上のウィンドウPOST運用とは別検証となる。</td></tr><tr><td><code>order_ids</code> 連想入力のオンキーを受注主キー一覧として読み、当該出荷指示リストに属する送信対象受…</td><td><code>POST /{admin_route}/standby/{id}/print/delivery/{lang}</code></td><td><code>order_ids</code> 連想入力のオンキーを受注主キー一覧として読み、当該出荷指示リストに属する送信対象受注だけに絞り、それらにぶら下がる各配送について配送主キーを一意に集める。続けて納品書データ組み立てのうち日本語向けとなる国内配送フラグ条件を渡したあと、<code>delivery_slips.ja.twig</code> を応答ボディへ返す。</td></tr><tr><td>メソッド制約として許容される。画面上の通常運用ではPOST主体。GETで本文にオン状態に相当する `ord…</td><td><code>GET {lang}=ja</code></td><td>メソッド制約として許容される。画面上の通常運用ではPOST主体。GETで本文にオン状態に相当する <code>order_ids</code> が載らない場合は異常応答となる。</td></tr></tbody></table></div>
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja.html:240:<ol><li>管理ユーザのログイン状態で管理側ファイアウォールを通過する。</li><li>パス <code>{id}</code> の出荷指示リスト実体が取れない場合、アクセス不存在に相当する異常応答となる。</li><li>HTTPリクエストから連想入力 <code>order_ids</code> を読み、そのキーを配列化したものが空ならアクセス不存在に相当する異常応答となる。</li><li>リストにぶら下がる各受注について、手順3の送信キー集合に含まれるものだけ処理対象に残す。</li><li>対象各受注の各配送について配送主キーを集合へ載せ、<code>array</code> のキー再利用で一意化する。</li><li>配送主キー集合が空ならアクセス不存在に相当する異常応答となる。</li><li><code>{lang}=ja</code> のとき納品書組み立てに「海外向けフラグ」の偽判定を渡し、配送ID配列ごとクエリ実行する実装となる（引数順は関数定義どおり）。</li><li>モール共通基本情報を取得し、<code>@admin/ShippingStandby/delivery_slips.ja.twig</code> を描いて返す。</li></ol>
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja.html:303:<p>レイアウト・税制表示など受注一覧向け日本語テンプレと共通の細部は、同一リポジトリメソッド利用の経路にある設計書 <code>m05-09_admin_order_order_print_delivery_slips_ja</code> とテンプレ <code>delivery_slips.ja.twig</code> の実装照合により読み替える。</p>
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja.html:306:<ul><li>コントローラ実装ファイル <code>src/Eccube/Controller/Admin/Order/ShippingStandbyController.php</code> メソッド <code>printDeliverySlips</code></li><li>ルート属性名 <code>admin_shipping_standby_print_delivery_slips</code></li><li>編集Twig <code>src/Eccube/Resource/template/admin/ShippingStandby/edit.twig</code>（ <code>#printDeliverySlipsJp</code> と <code>#form_bulk</code> ）</li><li>印刷Twig <code>src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig</code></li><li>納品書データ <code>src/Eccube/Repository/DtbShippingStandbyRepository.php</code> メソッド <code>generateDeliverySlips</code></li></ul>
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja.html:308:<ul><li><code>admin_shipping_standby_print_delivery_slips</code> … <code>POST</code> … <code>/{admin_route}/standby/{id}/print/delivery/{lang}</code>（<code>order_ids</code> 連想入力のオンキーを受注主キー一覧として読み、当該出荷指示リストに属する送信対象受注だけに絞り、それらにぶら下がる各配送について配送主キーを一意に集める。続けて納品書データ組み立てのうち日本語向けとなる国内配送フラグ条件を渡したあと、<code>delivery_slips.ja.twig</code> を応答ボディへ返す。）</li><li><code>admin_shipping_standby_print_delivery_slips</code> … <code>GET</code> … <code>{lang}=ja</code>（メソッド制約として許容される。画面上の通常運用ではPOST主体。GETで本文にオン状態に相当する <code>order_ids</code> が載らない場合は異常応答となる。）</li></ul>
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-10_admin_order_order_print_delivery_slips_en.html:187:<a class="lv3" href="#受注一覧から英語納品書HTMLを開く-POST-admin-delivery-slips-export-lang-en">受注一覧から英語納品書HTMLを開く（`POST admin_delivery_slips_export`、`lang=en`）</a>
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-10_admin_order_order_print_delivery_slips_en.html:228:<div class="table-wrap"><table><thead><tr><th>入口</th><th>URLエンドポイント</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>受注一覧で複数行のチェックボックスを付け、「納品書印刷（英語）」を押す</td><td><code>POST /{admin_route}/order/print/delivery_slips/en</code></td><td>いずれの配送行もチェックされていなければ、日本語のアラート「チェックボックスが選択されていません」が出て送信しない。チェックがある場合、<code>700x700</code>程度の名前付きウィンドウを開き、同一フォームを<code>POST</code>して英語レイアウトのHTMLを表示する。</td></tr><tr><td>アドレス直打ちなどで配列なしまたは空で触る</td><td><code>GET</code>または<code>POST</code>で<code>/order/print/delivery_slips/en</code>に対し<code>ids</code>が欠ける、または空配列・非配列</td><td>サーバ側で見つからないリソースとしてHTTP404となる。</td></tr><tr><td><code>lang</code>が<code>ja</code>または<code>en</code>。本書では<code>en</code>のとき英語納品書HTMLを返す。リクエストボディまた…</td><td><code>GET, POST /{admin_route}/order/print/delivery_slips/{lang}</code></td><td><code>lang</code>が<code>ja</code>または<code>en</code>。本書では<code>en</code>のとき英語納品書HTMLを返す。リクエストボディまたはクエリから<code>ids</code>配列（配送IDの整数）を受け取り、空または非配列ならHTTP404とする。</td></tr></tbody></table></div>
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-10_admin_order_order_print_delivery_slips_en.html:235:<h3 id="受注一覧から英語納品書HTMLを開く-POST-admin-delivery-slips-export-lang-en">受注一覧から英語納品書HTMLを開く（<code>POST admin_delivery_slips_export</code>、<code>lang=en</code>）</h3>
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-10_admin_order_order_print_delivery_slips_en.html:252:<div class="table-wrap"><table><thead><tr><th>ケース</th><th>扱い</th></tr></thead><tbody><tr><td>チェック無しで印刷ボタン</td><td>一覧JSがアラートを出して<code>POST</code>しない。</td></tr><tr><td><code>ids</code>空・欠落・非配列</td><td>HTTP404応答（例外）。</td></tr><tr><td>国内配送のみ選択して英語</td><td>結合条件に合わず納品書配列が空。印刷画面はヘッダと印刷ボタンだけの静止HTMLに近い。</td></tr><tr><td>同一注文の複数配送IDを別々にオン</td><td>結果連想配列キーが注文主キーのためエントリが上書きされうる。意図と異なる一覧になるリスクがある。</td></tr><tr><td>GETで<code>/order/print/delivery_slips/en?ids[]=…</code>等形式</td><td>メソッド制約上許容される。<code>ids</code>の解釈は同様。クエリ複数同名キーまたは配列表記はSymfonyのパラメータバッグ解釈に従う。</td></tr></tbody></table></div>
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-10_admin_order_order_print_delivery_slips_en.html:302:<div class="table-wrap"><table><thead><tr><th>論理対象</th><th>パスまたは識別子の例</th></tr></thead><tbody><tr><td>ルート定義クラス実装ファイル</td><td><code>src/Eccube/Controller/Admin/Order/OrderController.php</code>内<code>admin_delivery_slips_export</code></td></tr><tr><td>単体テスト名</td><td><code>OrderControllerTest::testBulkPrintDeliverySlipEn</code></td></tr></tbody></table></div>
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-10_admin_order_order_print_delivery_slips_en.html:305:<ul><li><code>admin_delivery_slips_export</code> … <code>GET, POST</code> … <code>/{admin_route}/order/print/delivery_slips/{lang}</code>（<code>lang</code>が<code>ja</code>または<code>en</code>。本書では<code>en</code>のとき英語納品書HTMLを返す。リクエストボディまたはクエリから<code>ids</code>配列（配送IDの整数）を受け取り、空または非配列ならHTTP404とする。）</li></ul>
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.html:219:<p>本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値とするソースは、<code>/{admin_route}/order/print/delivery_slips/ja</code> に相当するSymfonyルート、受注管理コントローラの印刷ハンドラ、配送待機系リポジトリのデータ組み立て、テンプレート <code>ShippingStandby/delivery_slips.ja.twig</code>、設定鍵 <code>eccube_admin_route</code> とする。</p>
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.html:227:<div class="table-wrap"><table><thead><tr><th>入口</th><th>URLエンドポイント</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>受注一覧の「納品書印刷（日本語）」ボタン（一覧に配送行があること、かつチェックが1つ以上）</td><td><code>POST /{admin_route}/order/print/delivery_slips/ja</code>（ルート <code>admin_delivery_slips_export</code>。固定で <code>lang=ja</code> をURLに含める）</td><td>空ウィンドウを開き、一覧のPOST先を上記に差し替えて送信する。国内配送フラグ一致の配送のみが対象となるHTMLが新規ウィンドウに表示される。</td></tr><tr><td>チェックが無い状態で同名ボタンを押したとき</td><td>（送信しない）</td><td><code>alert("チェックボックスが選択されていません")</code> のみであり、ブラウザ遷移は起こさない。</td></tr><tr><td>（参考）一覧はGETのみ <code>admin_delivery_slips_export</code> を叩く運用になっていない</td><td><code>GET …/ja</code></td><td>クエリまたはパラメータに配送ID配列が欠けると異常応答となる。一覧UI経由での通常運用対象外。</td></tr><tr><td>PHPのタイム上限解除のあと、<code>ids[]</code> と内部結合用の配送マスタ海外フラグにより納品書データを構築し…</td><td><code>POST /{admin_route}/order/print/delivery_slips/{lang}</code></td><td>PHPのタイム上限解除のあと、<code>ids[]</code> と内部結合用の配送マスタ海外フラグにより納品書データを構築し、日本語HTMLを応答ボディへ載せて返す。</td></tr><tr><td>ルート要件上は許可されている。リクエストに妥当な配送ID配列が無いときは一覧一括実行と同一の異常経路となる…</td><td><code>GET {lang}=ja</code></td><td>ルート要件上は許可されている。リクエストに妥当な配送ID配列が無いときは一覧一括実行と同一の異常経路となる。一覧UIはPOSTのみ利用する。</td></tr></tbody></table></div>
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.html:236:<ol><li>利用者が1件以上の配送行チェックボックスを付ける。</li><li>「納品書印刷（日本語）」を押す。</li><li>スクリプトがチェック有無を数え、0件なら警告を表示して終える。</li><li>新規ブラウザウィンドウを開く。</li><li><code>#form_bulk</code> の <code>action</code> を <code>/{admin_route}/order/print/delivery_slips/ja</code> に変更し、<code>target</code> を事前に開いたウィンドウ名へ向ける。</li><li>フォームをPOST送信する（本文は一覧と同一の <code>#form_bulk</code> で、チェック済みの <code>ids[]</code> と共通hiddenが載る）。</li></ol>
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.html:303:<ul><li>Symfonyルート名 <code>admin_delivery_slips_export</code></li><li>テンプレートエイリアス <code>@admin/ShippingStandby/delivery_slips.ja.twig</code></li></ul>
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.html:305:<ul><li><code>admin_delivery_slips_export</code> … <code>POST</code> … <code>/{admin_route}/order/print/delivery_slips/{lang}</code>（PHPのタイム上限解除のあと、<code>ids[]</code> と内部結合用の配送マスタ海外フラグにより納品書データを構築し、日本語HTMLを応答ボディへ載せて返す。）</li><li><code>admin_delivery_slips_export</code> … <code>GET</code> … <code>{lang}=ja</code>（ルート要件上は許可されている。リクエストに妥当な配送ID配列が無いときは一覧一括実行と同一の異常経路となる。一覧UIはPOSTのみ利用する。）</li></ul>

codex
実装ファイルは enterprise 側に実在し、候補の implRef 自体は開けます。次に、候補の列名差分が本当に差分として扱うべきか、テンプレート表示とエンティティ定義まで線で追います。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php | sed -n '240,340p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php | sed -n '440,670p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   240	        ]);
   241	        $thresholdPrice1 = $option1 !== null ? (int) $option1->getOptionValue() : 0;
   242	
   243	        $option2 = $this->optionRepository->findOneBy([
   244	            'option_key' => MtbOption::ORDER_LIST_THRESHOLD_PRICE_2,
   245	        ]);
   246	        $thresholdPrice2 = $option2 !== null ? (int) $option2->getOptionValue() : 0;
   247	
   248	        // メインクエリ
   249	        $qb = $this->getEntityManager()->createQueryBuilder()
   250	            ->from('Eccube\Entity\Order', 'o', 'o.id')
   251	            ->select('o')
   252	            ->join('o.Pref', 'op')
   253	            ->leftJoin('o.Country', 'oc')
   254	            ->leftJoin('o.Shippings', 's')
   255	            ->leftJoin('s.Pref', 'sp')
   256	            ->leftJoin('s.Country', 'sc')
   257	            ->join('s.Delivery', 'd', 'WITH', 'd.isAbroad = :isAbroad')
   258	            ->setParameter('isAbroad', $isAbroad ? '1' : '0')
   259	            ->join('o.OrderItems', 'oi')
   260	            ->where('s.id IN (:shippingIds)')
   261	            ->setParameter('shippingIds', $ids);
   262	
   263	        $qb2 = clone $qb;
   264	
   265	        // 注文単位（個数集計）の取得
   266	        $summary = $qb
   267	            ->addSelect([
   268	                'op.name AS order_pref',
   269	                'oc.name AS order_country',
   270	                'o.postal_code AS customer_postalCode',
   271	                'op.name AS customer_pref',
   272	                'oc.name AS customer_country',
   273	                'o.addr01 AS customer_addr01',
   274	                'o.addr02 AS customer_addr02',
   275	                'o.addr03 AS customer_addr03',
   276	                'o.tel01 AS customer_tel01',
   277	                'o.tel02 AS customer_tel02',
   278	                'o.tel03 AS customer_tel03',
   279	                'o.name01 AS customer_name01',
   280	                'o.name02 AS customer_name02',
   281	                'o.order_number AS order_number',
   282	                'op.id AS customer_pref_id',
   283	                's.postal_code AS shipping_postalCode',
   284	                's.abroadPostalCode AS shipping_abroad_postal_code',
   285	                'o.abroadPostalCode AS customer_abroad_postal_code',
   286	                'sp.id AS shipping_pref_id',
   287	                'sp.name AS shipping_pref',
   288	                'sc.name AS shipping_country',
   289	                's.addr01 AS shipping_addr01',
   290	                's.addr02 AS shipping_addr02',
   291	                's.addr03 AS shipping_addr03',
   292	                's.tel01 AS shipping_tel01',
   293	                's.tel02 AS shipping_tel02',
   294	                's.tel03 AS shipping_tel03',
   295	                's.name01 AS shipping_name01',
   296	                's.name02 AS shipping_name02',
   297	                'd.id AS delivery_id',
   298	                'd.name AS delivery',
   299	                'd.isAbroad',
   300	                'sum(oi.quantity)  AS total_quantity',
   301	                'player.smaregiId AS smaregi_id',
   302	            ])
   303	            ->join('o.Customer', 'cus')
   304	            ->join('cus.Player', 'player')
   305	            ->groupBy('o, op, oc, s, sp, sc, d, player')
   306	            ->getQuery()
   307	            ->getArrayResult();
   308	
   309	        // 注文明細の取得
   310	        $qb2
   311	            ->addSelect('oi')
   312	            ->join('oi.Product', 'p')
   313	            ->join('oi.ProductClass', 'pc')
   314	            ->leftJoin('p.ProductCategories', 'ct')
   315	            ->leftJoin('p.StorageCode', 'stc')
   316	            ->leftJoin('p.CardDetail', 'cd')
   317	            ->leftJoin('pc.Language', 'lng')
   318	            ->leftJoin('pc.ShelfNumber', 'sn')
   319	            ->leftJoin('cd.Rarity', 'r')
   320	            ->leftJoin('cd.Card', 'c')
   321	            ->leftJoin('c.ColorSequence', 'cs')
   322	            ->leftJoin('oi.ProductClass', 'psc')
   323	            ->addSelect('CASE WHEN oi.price < :price1 THEN 1 ELSE 0 END AS HIDDEN class1')
   324	            ->addSelect('CASE WHEN oi.price < :price2 THEN 1 ELSE 0 END AS HIDDEN class2')
   325	            ->orderBy('o.id', 'ASC')
   326	            ->setParameter('shippingIds', $ids)
   327	            ->setParameter('price1', $thresholdPrice1)
   328	            ->setParameter('price2', $thresholdPrice2)
   329	            ->groupBy('o, op, oc, s, sp, sc, d, oi, p, pc, stc, cd, lng, sn, r, c, cs, psc');
   330	
   331	        // 品目のソート
   332	        $this->sortProduct($qb2);
   333	
   334	        $items = $qb2
   335	            ->getQuery()
   336	            ->getArrayResult();
   337	
   338	        $result = [];
   339	
   340	        foreach (array_keys($items) as $key) {

 succeeded in 0ms:
   440	
   441	            return array_values($orderItemArray);
   442	        }
   443	
   444	        /**
   445	         * 合計金額を計算
   446	         *
   447	         * @deprecated
   448	         */
   449	        public function getTotalPrice(): string
   450	        {
   451	            @trigger_error('The '.__METHOD__.' method is deprecated.', E_USER_DEPRECATED);
   452	
   453	            return $this->getPaymentTotal();
   454	        }
   455	
   456	        #[ORM\Column(name: 'id', type: Types::INTEGER, options: ['unsigned' => true])]
   457	        #[ORM\Id]
   458	        #[ORM\GeneratedValue(strategy: 'IDENTITY')]
   459	        private ?int $id = null;
   460	
   461	        #[ORM\Column(name: 'pre_order_id', type: Types::STRING, length: 255, nullable: true)]
   462	        private ?string $pre_order_id = null;
   463	
   464	        #[ORM\Column(name: 'order_no', type: Types::STRING, length: 255, nullable: true)]
   465	        private ?string $order_no = null;
   466	
   467	        #[ORM\Column(name: 'message', type: Types::STRING, length: 4000, nullable: true)]
   468	        private ?string $message = null;
   469	
   470	        #[ORM\Column(name: 'name01', type: Types::STRING, length: 255)]
   471	        private ?string $name01 = null;
   472	
   473	        #[ORM\Column(name: 'name02', type: Types::STRING, length: 255)]
   474	        private ?string $name02 = null;
   475	
   476	        #[ORM\Column(name: 'kana01', type: Types::STRING, length: 255, nullable: true)]
   477	        private ?string $kana01 = null;
   478	
   479	        #[ORM\Column(name: 'kana02', type: Types::STRING, length: 255, nullable: true)]
   480	        private ?string $kana02 = null;
   481	
   482	        #[ORM\Column(name: 'company_name', type: Types::STRING, length: 255, nullable: true)]
   483	        private ?string $company_name = null;
   484	
   485	        #[ORM\Column(name: 'email', type: Types::STRING, length: 255, nullable: true)]
   486	        private ?string $email = null;
   487	
   488	        #[ORM\Column(name: 'postal_code', type: Types::STRING, length: 8, nullable: true)]
   489	        private ?string $postal_code = null;
   490	
   491	        #[ORM\Column(name: 'addr01', type: Types::STRING, length: 255, nullable: true)]
   492	        private ?string $addr01 = null;
   493	
   494	        #[ORM\Column(name: 'addr02', type: Types::STRING, length: 255, nullable: true)]
   495	        private ?string $addr02 = null;
   496	
   497	        /**
   498	         * @var \DateTimeInterface|null
   499	         */
   500	        #[ORM\Column(name: 'birth', type: Types::DATE_MUTABLE, nullable: true)]
   501	        private ?\DateTimeInterface $birth = null;
   502	
   503	        #[ORM\Column(name: 'subtotal', type: Types::DECIMAL, precision: 12, scale: 2, options: ['unsigned' => true, 'default' => 0])]
   504	        private ?string $subtotal = '0';
   505	
   506	        #[ORM\Column(name: 'discount', type: Types::DECIMAL, precision: 12, scale: 2, options: ['unsigned' => true, 'default' => 0])]
   507	        private ?string $discount = '0';
   508	
   509	        #[ORM\Column(name: 'delivery_fee_total', type: Types::DECIMAL, precision: 12, scale: 2, options: ['unsigned' => true, 'default' => 0])]
   510	        private ?string $delivery_fee_total = '0';
   511	
   512	        #[ORM\Column(name: 'charge', type: Types::DECIMAL, precision: 12, scale: 2, options: ['unsigned' => true, 'default' => 0])]
   513	        private ?string $charge = '0';
   514	
   515	        /**
   516	         * @deprecated 明細ごとに集計した税額と差異が発生する場合があるため非推奨
   517	         */
   518	        #[ORM\Column(name: 'tax', type: Types::DECIMAL, precision: 12, scale: 2, options: ['unsigned' => true, 'default' => 0])]
   519	        private ?string $tax = '0';
   520	
   521	        #[ORM\Column(name: 'total', type: Types::DECIMAL, precision: 12, scale: 2, options: ['unsigned' => true, 'default' => 0])]
   522	        private ?string $total = '0';
   523	
   524	        #[ORM\Column(name: 'payment_total', type: Types::DECIMAL, precision: 12, scale: 2, options: ['unsigned' => true, 'default' => 0])]
   525	        private ?string $payment_total = '0';
   526	
   527	        #[ORM\Column(name: 'payment_method', type: Types::STRING, length: 255, nullable: true)]
   528	        private ?string $payment_method = null;
   529	
   530	        #[ORM\Column(name: 'note', type: Types::STRING, length: 4000, nullable: true)]
   531	        private ?string $note = null;
   532	
   533	        /**
   534	         * @var \DateTime
   535	         */
   536	        #[ORM\Column(name: 'create_date', type: Types::DATETIMETZ_MUTABLE)]
   537	        private $create_date;
   538	
   539	        /**
   540	         * @var \DateTime
   541	         */
   542	        #[ORM\Column(name: 'update_date', type: Types::DATETIMETZ_MUTABLE)]
   543	        private $update_date;
   544	
   545	        /**
   546	         * @var \DateTime|null
   547	         */
   548	        #[ORM\Column(name: 'order_date', type: Types::DATETIMETZ_MUTABLE, nullable: true)]
   549	        private $order_date;
   550	
   551	        /**
   552	         * @var \DateTime|null
   553	         */
   554	        #[ORM\Column(name: 'payment_date', type: Types::DATETIMETZ_MUTABLE, nullable: true)]
   555	        private $payment_date;
   556	
   557	        #[ORM\Column(name: 'currency_code', type: Types::STRING, nullable: true)]
   558	        private ?string $currency_code = null;
   559	
   560	        /**
   561	         * 注文完了画面に表示するメッセージ
   562	         *
   563	         * プラグインから注文完了時にメッセージを表示したい場合, このフィールドにセットすることで, 注文完了画面で表示されます。
   564	         * 複数のプラグインから利用されるため, appendCompleteMesssage()で追加してください.
   565	         * 表示する際にHTMLは利用可能です。
   566	         */
   567	        #[ORM\Column(name: 'complete_message', type: Types::TEXT, nullable: true)]
   568	        private ?string $complete_message = null;
   569	
   570	        /**
   571	         * 注文完了メールに表示するメッセージ
   572	         *
   573	         * プラグインから注文完了メールにメッセージを表示したい場合, このフィールドにセットすることで, 注文完了メールで表示されます。
   574	         * 複数のプラグインから利用されるため, appendCompleteMailMesssage()で追加してください.
   575	         */
   576	        #[ORM\Column(name: 'complete_mail_message', type: Types::TEXT, nullable: true)]
   577	        private ?string $complete_mail_message = null;
   578	
   579	        /**
   580	         * @var Collection<int, OrderItem>
   581	         */
   582	        #[ORM\OneToMany(targetEntity: OrderItem::class, mappedBy: 'Order', cascade: ['persist', 'remove'])]
   583	        private $OrderItems;
   584	
   585	        /**
   586	         * @var Collection<int, Shipping>
   587	         */
   588	        #[ORM\OneToMany(targetEntity: Shipping::class, mappedBy: 'Order', cascade: ['persist', 'remove'])]
   589	        private $Shippings;
   590	
   591	        /**
   592	         * @var Collection<int, MailHistory>
   593	         */
   594	        #[ORM\OneToMany(targetEntity: MailHistory::class, mappedBy: 'Order', cascade: ['remove'])]
   595	        #[ORM\OrderBy(['send_date' => 'DESC'])]
   596	        private $MailHistories;
   597	
   598	        #[ORM\ManyToOne(targetEntity: Customer::class, inversedBy: 'Orders')]
   599	        #[ORM\JoinColumn(name: 'customer_id', referencedColumnName: 'id')]
   600	        private ?Customer $Customer = null;
   601	
   602	        #[ORM\ManyToOne(targetEntity: Country::class)]
   603	        #[ORM\JoinColumn(name: 'country_id', referencedColumnName: 'id')]
   604	        private ?Country $Country = null;
   605	
   606	        #[ORM\ManyToOne(targetEntity: Pref::class)]
   607	        #[ORM\JoinColumn(name: 'pref_id', referencedColumnName: 'id')]
   608	        private ?Pref $Pref = null;
   609	
   610	        #[ORM\ManyToOne(targetEntity: Sex::class)]
   611	        #[ORM\JoinColumn(name: 'sex_id', referencedColumnName: 'id')]
   612	        private ?Sex $Sex = null;
   613	
   614	        #[ORM\ManyToOne(targetEntity: Job::class)]
   615	        #[ORM\JoinColumn(name: 'job_id', referencedColumnName: 'id')]
   616	        private ?Job $Job = null;
   617	
   618	        #[ORM\ManyToOne(targetEntity: Payment::class)]
   619	        #[ORM\JoinColumn(name: 'payment_id', referencedColumnName: 'id')]
   620	        private ?Payment $Payment = null;
   621	
   622	        #[ORM\ManyToOne(targetEntity: DeviceType::class)]
   623	        #[ORM\JoinColumn(name: 'device_type_id', referencedColumnName: 'id')]
   624	        private ?DeviceType $DeviceType = null;
   625	
   626	        /**
   627	         * OrderStatusより先にプロパティを定義しておかないとセットされなくなる
   628	         */
   629	        #[ORM\ManyToOne(targetEntity: CustomerOrderStatus::class)]
   630	        #[ORM\JoinColumn(name: 'order_status_id', referencedColumnName: 'id')]
   631	        private ?CustomerOrderStatus $CustomerOrderStatus = null;
   632	
   633	        /**
   634	         * OrderStatusより先にプロパティを定義しておかないとセットされなくなる
   635	         */
   636	        #[ORM\ManyToOne(targetEntity: OrderStatusColor::class)]
   637	        #[ORM\JoinColumn(name: 'order_status_id', referencedColumnName: 'id')]
   638	        private ?OrderStatusColor $OrderStatusColor = null;
   639	
   640	        #[ORM\ManyToOne(targetEntity: OrderStatus::class)]
   641	        #[ORM\JoinColumn(name: 'order_status_id', referencedColumnName: 'id')]
   642	        private ?OrderStatus $OrderStatus = null;
   643	
   644	        #[ORM\Column(name: 'waiting_number', type: Types::INTEGER, nullable: true, options: ['unsigned' => true, 'comment' => '店舗販売用整理番号'])]
   645	        private ?int $waitingNumber = null;
   646	
   647	        #[ORM\Column(name: 'order_number', type: Types::STRING, length: 11, nullable: true, options: ['unsigned' => true, 'comment' => '注文番号'])]
   648	        private ?string $order_number = null;
   649	
   650	        #[ORM\JoinColumn(name: 'operator_id', referencedColumnName: 'id')]
   651	        #[ORM\ManyToOne(targetEntity: Member::class)]
   652	        private ?Member $Member = null;
   653	
   654	        #[ORM\Column(name: 'gained_points', type: Types::INTEGER, nullable: true, options: ['unsigned' => true, 'comment' => 'ポイント発生'])]
   655	        private ?int $gained_points = null;
   656	
   657	        #[ORM\Column(name: 'spended_points', type: Types::INTEGER, nullable: true, options: ['unsigned' => true, 'comment' => 'ポイント使用'])]
   658	        private ?int $spended_points = null;
   659	
   660	        #[ORM\Column(name: 'payment_detail', type: Types::STRING, length: 255, nullable: true, options: ['comment' => '支払詳細'])]
   661	        private ?string $payment_detail = null;
   662	
   663	        #[ORM\Column(name: 'credit_payment_total', type: Types::INTEGER, nullable: true, options: ['comment' => '与信時金額合計'])]
   664	        private ?int $credit_payment_total = null;
   665	
   666	        #[ORM\Column(name: 'confirm_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '注文確定日'])]
   667	        private ?\DateTime $confirmDate = null;
   668	
   669	        #[ORM\Column(name: 'commit_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '出荷指示日'])]
   670	        private ?\DateTime $commitDate = null;

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php | sed -n '720,755p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   720	            $this->orderPdfRepository->saveDefaultValue($arrData);
   721	        }
   722	
   723	        return $response;
   724	    }
   725	
   726	    /**
   727	     * 受注情報 納品書一括印刷
   728	     *
   729	     * @return Response
   730	     */
   731	    #[Route(path: '/%eccube_admin_route%/order/print/delivery_slips/{lang}', name: 'admin_delivery_slips_export', requirements: ['lang' => 'ja|en'], methods: ['GET', 'POST'])]
   732	    public function bulkPrintDeliverySlip(Request $request, string $lang): Response
   733	    {
   734	        // タイムアウトを無効にする.
   735	        set_time_limit(0);
   736	
   737	        $ids = $request->get('ids', []);
   738	
   739	        if (!is_array($ids) || $ids === []) {
   740	            throw new NotFoundHttpException();
   741	        }
   742	
   743	        $DeliverySlips = $this->dtbShippingStandbyRepository->generateDeliverySlips($lang !== 'ja', $ids);
   744	        $BaseInfo = $this->baseInfoRepository->getMallBaseInfo();
   745	
   746	        return $this->render("@admin/ShippingStandby/delivery_slips.{$lang}.twig", [
   747	            'DeliverySlips' => $DeliverySlips,
   748	            'BaseInfo' => $BaseInfo,
   749	        ]);
   750	    }
   751	
   752	    /**
   753	     * 送り状CSV出力
   754	     *
   755	     * @return Response

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig | sed -n '1,210p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	{% block javascript %}
     2	    <script src="{{ asset('assets/js/select2.min.js', 'admin') }}"></script>
     3	    <script nonce="{{ csp_nonce }}">
     4	        document.addEventListener('DOMContentLoaded', function () {
     5	            const btn = document.getElementById('printButton');
     6	            if (btn) {
     7	                btn.addEventListener('click', function () {
     8	                    window.print();
     9	                });
    10	            }
    11	        });
    12	</script>
    13	{% endblock javascript %}
    14	{% set maxPageRows = 30 %}
    15	<!DOCTYPE html>
    16	<html lang="ja">
    17	    <head>
    18	        <meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>
    19	        <title>納品書</title>
    20	        <link rel="stylesheet" type="text/css" href="{{ asset('assets/css/deliveryslips.css', 'admin') }}"/>
    21	    </head>
    22	    <body style="margin: 0px;">
    23	        <div class="printBox">
    24	            <button id="printButton" style="width: 120px; height: 26px; margin: 3px;">
    25	                {{ 'admin.common.print'|trans }}
    26	            </button>
    27	        </div>
    28	        <div class="ContentsAll">
    29	        {% for orderId, DeliverySlip in DeliverySlips %}
    30	        {% set subtotal_quantity = 0 %}
    31	        {% for OrderItem in DeliverySlip.OrderItems %}
    32	        {% set subtotal_quantity = subtotal_quantity + OrderItem.quantity %}
    33	        {% if loop.index % maxPageRows == 1 %}
    34	            <div class="multipage">
    35	                <div style="text-align: center; font-size: 24pt; margin-bottom: 15px;">
    36	                    {{ 'admin.delivery_slips_ja'|trans }}
    37	                </div>
    38	                <div style="text-align: right; font-size: 12pt;">
    39	                    {{ loop.index // maxPageRows + 1 }}/{{ (DeliverySlip.OrderItems|length - 1) // maxPageRows + 1 }}
    40	                </div>
    41	                <div style="text-align: left; font-size: 12pt; font-weight: bold; text-decoration: underline;">
    42	                    {{ 'admin.delivery_slips_ja.order_number'|trans }}:<span style="font-weight: normal;">{{ (DeliverySlip.order_number) }}</span>
    43	                </div>
    44	                {% if DeliverySlip.delivery_id == constant('Eccube\\Entity\\Delivery::SMOOTH_OTC') %}
    45	                <div style="text-align: right; font-size: 12pt; font-weight: bold; text-decoration: underline;">
    46	                    {{ 'admin.delivery_slips_ja.recipient_sign'|trans }}:&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;
    47	                </div>
    48	                {% endif %}
    49	                <div style="margin-top: 20px;">
    50	                    <div style="float: left; width: 205px; padding-right: 5px; word-br/eak:br/eak-all;">
    51	                        <b>{{ 'admin.delivery_slips_ja.delivery'|trans }}</b><br/>
    52	                        <br/>
    53	                        {% if DeliverySlip.shipping_pref_id == constant('Eccube\\Entity\\Master\\Pref::PREF_ABROAD') %}
    54	                            {{ DeliverySlip.shipping_country }}<br />
    55	                            {% set formattedShippingZip = DeliverySlip.shipping_abroad_postal_code|default('') %}
    56	                        {% else %}
    57	                            {% set rawShippingZip = DeliverySlip.shipping_postalCode|default('')|replace({'-': ''})|trim %}
    58	                            {% set formattedShippingZip = rawShippingZip|length == 7 ? (rawShippingZip|slice(0, 3) ~ '-' ~ rawShippingZip|slice(3)) : rawShippingZip %}
    59	                        {% endif %}
    60	                        〒{{ formattedShippingZip }} {% if DeliverySlip.shipping_pref_id != constant('Eccube\\Entity\\Master\\Pref::PREF_ABROAD') %}{{ DeliverySlip.shipping_pref }}{% endif %}<br/>
    61	                        {{ DeliverySlip.shipping_addr01 }}<br/>
    62	                        {{ DeliverySlip.shipping_addr02 }}<br/>
    63	                        TEL：{{ DeliverySlip.shipping_tel01 }}{{ DeliverySlip.shipping_tel02 }}{{ DeliverySlip.shipping_tel03 }}<br/>
    64	                        {{ DeliverySlip.shipping_name01 }}&nbsp;{{ DeliverySlip.shipping_name02 }}{{ 'common.name.suffix'|trans }}<br/>
    65	                    </div>
    66	                    <div style="float: left; width: 205px; padding-right: 5px; word-br/eak:br/eak-all;">
    67	                        <b>{{ 'admin.delivery_slips_ja.sender'|trans }}</b><br/>
    68	                        <br/>
    69	                        {# 送り主: 国内配送でも注文者住所は国外という組合わせが発生しうるため、pref_idで国内/国外を判定 #}
    70	                        {% if DeliverySlip.customer_pref_id == constant('Eccube\\Entity\\Master\\Pref::PREF_ABROAD') %}
    71	                            {{ DeliverySlip.customer_country }}<br />
    72	                            〒{% set senderPostal = DeliverySlip.customer_abroad_postal_code|default('') %}
    73	                        {% else %}
    74	                            {% set rawCustomerZip = DeliverySlip.customer_postalCode|default('')|replace({'-': ''})|trim %}
    75	                            {% set senderPostal = rawCustomerZip|length == 7 ? (rawCustomerZip|slice(0, 3) ~ '-' ~ rawCustomerZip|slice(3)) : rawCustomerZip %}
    76	                        {% endif %}
    77	                        {% if DeliverySlip.customer_pref_id != constant('Eccube\\Entity\\Master\\Pref::PREF_ABROAD') %}{{ 'admin.common.postal_symbol'|trans }}{% endif %}{{ senderPostal }}{% if DeliverySlip.customer_pref_id != constant('Eccube\\Entity\\Master\\Pref::PREF_ABROAD') %} {{ DeliverySlip.customer_pref }}{% endif %}<br/>
    78	                        {{ DeliverySlip.customer_addr01 }}<br/>
    79	                        {{ DeliverySlip.customer_addr02 }}<br/>
    80	                        {% if DeliverySlip.customer_pref_id == constant('Eccube\\Entity\\Master\\Pref::PREF_ABROAD') and DeliverySlip.customer_addr03 %}
    81	                            {{ DeliverySlip.customer_addr03 }}<br/>
    82	                        {% endif %}
    83	                        {{ 'admin.common.phone_number_short'|trans }}：{{ DeliverySlip.customer_tel01 }}{{ DeliverySlip.customer_tel02 }}{{ DeliverySlip.customer_tel03 }}<br/>
    84	                        {{ DeliverySlip.customer_name01 }}&nbsp;{{ DeliverySlip.customer_name02 }}{{ 'common.name.suffix'|trans }}<br/>
    85	                        {{ 'admin.delivery_slips_ja.customer_id'|trans }}
    86	                        {% if DeliverySlip.smaregi_id is defined and DeliverySlip.smaregi_id is not null %}
    87	                            {{ DeliverySlip.smaregi_id }}
    88	                        {% else %}
    89	                            {{ 'admin.delivery_slips_ja.non_member'|trans }}
    90	                        {% endif %}
    91	                        <br/>
    92	                    </div>
    93	                    <div style="float: left; width: 205px; word-br/eak:br/eak-all;">
    94	                        <span style="font-size: large;font-family:arial;">
    95	                            <b>株式会社 晴れる屋</b>
    96	                        </span><br/>
    97	                        〒169-0075<br/>
    98	                        東京都新宿区高田馬場3-12-2<br/>
    99	                        OCビル2F<br/>
   100	                        TEL:03-5332-7517<br/>
   101	                        http://www.hareruyamtg.com/jp/<br/>
   102	                        E-Mail:info@hareruyamtg.com<br/>
   103	                       <div style="padding-top: 3px;">{{ 'admin.delivery_slips_ja.invoice_registration_number'|trans }}:{{ BaseInfo.invoice_registration_number }}</div><br/>
   104	                    </div>
   105	                </div>
   106	                <div class="sales_wrap_">
   107	                    <table border="0" cellpadding="0" cellspacing="0" class="sales_">
   108	                        <tbody>
   109	                            <tr>
   110	                                <th class="subtotal_">{{ 'admin.delivery_slips_ja.subtotal'|trans }}</th>
   111	                                <th class="postage_">{{ 'admin.delivery_slips_ja.postage'|trans }}</th>
   112	                                <th class="charge_">{{ 'admin.delivery_slips_ja.charge'|trans }}</th>
   113	                                <th class="point_out_">{{ 'admin.delivery_slips_ja.point_out'|trans }}</th>
   114	                                <th class="delivery_method_">{{ 'admin.delivery_slips_ja.delivery_method'|trans }}</th>
   115	                            </tr>
   116	                            <tr>
   117	                                <td class="subtotal_">{{ DeliverySlip.subtotal|price }}</td>
   118	                                <td class="postage_">{{ DeliverySlip.delivery_fee_total|price }}</td>
   119	                                <td class="charge_">{{ DeliverySlip.charge|price }}</td>
   120	                                <td class="point_out_">{{ DeliverySlip.discount|number_format(0) }}<small>{{ 'common.point'|trans }}</small>
   121	                                </td>
   122	                                <td class="delivery_method_">{{ DeliverySlip.delivery }}</td>
   123	                            </tr>
   124	                        </tbody>
   125	                    </table>
   126	                    <table border="0" cellpadding="0" cellspacing="0" class="total_">
   127	                        <tbody>
   128	                            <tr>
   129	                                <th class="total_">{{ 'admin.delivery_slips_ja.total_tax_included'|trans }}</th>
   130	                            </tr>
   131	                            <tr>
   132	                                <td class="total_">{{ DeliverySlip.total|price }}({{ 'admin.delivery_slips_ja.tax_included'|trans }}:{{ DeliverySlip.tax|price }})</td>
   133	                            </tr>
   134	                        </tbody>
   135	                    </table>
   136	                </div>
   137	                <div style="clear: both; width: 640px; padding: 5px 0px;">
   138	                    <table border="0" cellpadding="0" cellspacing="0" class="detail">
   139	                        <tbody>
   140	                            <tr>
   141	                                <th class="gname">
   142	                                    {{ 'admin.delivery_slips_ja.product_name'|trans }}
   143	                                </th>
   144	                                <th class="price">
   145	                                    {{ 'admin.delivery_slips_ja.price'|trans }}
   146	                                </th>
   147	                                <th class="qty">
   148	                                    {{ 'admin.delivery_slips_ja.quantity'|trans }}
   149	                                </th>
   150	                                <th class="amt">
   151	                                    {{ 'admin.delivery_slips_ja.amount'|trans }}
   152	                                </th>
   153	                            </tr>
   154	        {% endif %}
   155	                            <tr>
   156	                                <td class="gname">
   157	                                    <div class="gname">{{ OrderItem.product_name }}</div>
   158	                                </td>
   159	                                <td class="price">
   160	                                    {{ OrderItem.price|price }}
   161	                                </td>
   162	                                <td class="qty">
   163	                                    {{ OrderItem.quantity }}
   164	                                </td>
   165	                                <td class="amt">
   166	                                    {{ (OrderItem.price * OrderItem.quantity)|price }}
   167	                                </td>
   168	                            </tr>
   169	        {% if loop.index % maxPageRows == 0 or loop.last %}
   170	                            <tr>
   171	                                <td class="gname">
   172	                                    {{ 'admin.delivery_slips_ja.amount'|trans }}
   173	                                </td>
   174	                                <td class="price">
   175	                                </td>
   176	                                <td class="qty">
   177	                                    {{ subtotal_quantity }}/{{ DeliverySlip.total_quantity }}
   178	                                </td>
   179	                                <td class="amt">
   180	                                </td>
   181	                            </tr>
   182	                        </tbody>
   183	                    </table>
   184	                </div>
   185	                <div style="clear: both; padding-top: 5px;"></div>
   186	                <div style="clear: both; padding-top: 5px;"></div>
   187	            </div>
   188	        {% endif %}
   189	        {% endfor %}
   190	        {% endfor %}
   191	        </div>
   192	    </body>
   193	</html>

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php | sed -n '338,410p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   338	        $result = [];
   339	
   340	        foreach (array_keys($items) as $key) {
   341	            $total = ($items[$key]['subtotal'] + $items[$key]['delivery_fee_total'] + $items[$key]['charge']) - $items[$key]['discount'];
   342	            $details[$key]['taxPrice'] = PriceUtil::taxCalculation((int) $total);
   343	            $result[$key] = array_merge($summary[$key], $items[$key]);
   344	        }
   345	
   346	        return $result;
   347	    }
   348	
   349	    /**
   350	     * オーダー情報を一緒に取得
   351	     *
   352	     * @param int $id
   353	     *
   354	     * @return array <mixed> $data>>
   355	     */
   356	    public function findOneByStandbyIdWithOrder(int $id): array
   357	    {
   358	        $result = $this->createQueryBuilder('ss')
   359	            ->join('ss.Orders', 'o')
   360	            ->join('o.OrderItems', 'oi')
   361	            ->select('ss', 'o', 'oi')
   362	            ->where('ss.id = :id')
   363	            ->setParameter('id', $id)
   364	            ->getQuery()
   365	            ->getOneOrNullResult();
   366	
   367	        if ($result === null) {
   368	            return [];
   369	        }
   370	
   371	        return $result->toArray();
   372	    }
   373	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig | sed -n '150,195p;1205,1225p;1240,1255p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   150	                    event.preventDefault();
   151	                    return false;
   152	                }
   153	                window.open('', 'newwin', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=700, height=700');
   154	                $('#form_bulk').attr('action', "{{ url('admin_order_export_pdf') }}");
   155	                $('#form_bulk').attr('target', 'newwin');
   156	                $('#form_bulk').submit();
   157	                return false;
   158	            });
   159	
   160	            // PDF出力(単一)
   161	            $('.pdf-print').click(function() {
   162	                window.open(this.href, 'newwin', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=700, height=700');
   163	                return false;
   164	            });
   165	
   166	            // 納品書印刷(日本語)
   167	            $('#printDeliverySlipsJp').on('click', function(event) {
   168	                if (preventIfNoCheckedBulkTarget()) {
   169	                    event.preventDefault();
   170	                    return false;
   171	                }
   172	                window.open('', 'newwin', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=700, height=700');
   173	                $('#form_bulk').attr('action', "{{ url('admin_delivery_slips_export', { 'lang': 'ja' }) }}");
   174	                $('#form_bulk').attr('target', 'newwin');
   175	                $('#form_bulk').submit();
   176	                return false;
   177	            });
   178	
   179	            // 納品書印刷(英語)
   180	            $('#printDeliverySlipsEn').on('click', function(event) {
   181	                if (preventIfNoCheckedBulkTarget()) {
   182	                    event.preventDefault();
   183	                    return false;
   184	                }
   185	                window.open('', 'newwin', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=700, height=700');
   186	                $('#form_bulk').attr('action', "{{ url('admin_delivery_slips_export', { 'lang': 'en' }) }}");
   187	                $('#form_bulk').attr('target', 'newwin');
   188	                $('#form_bulk').submit();
   189	                return false;
   190	            });
   191	
   192	            // 送り状CSV出力
   193	            $('#labelsExport').on('click', function(event) {
   194	                if (preventIfNoCheckedBulkTarget()) {
   195	                    event.preventDefault();
  1205	                                <div class="row justify-content-between mb-3">
  1206	                                    <div class="col-12">
  1207	                                        <button type="button" id="printStack" class="btn btn-ec-conversion px-5 btn-print-stack">
  1208	                                            {{ 'admin.order.print_stack_paper'|trans }}
  1209	                                        </button>
  1210	                                        <div class="float-end">
  1211	                                            <button type="button" id="labelsExport" class="btn btn-ec-conversion px-5">
  1212	                                                {{ 'admin.order.output_labels_Export'|trans }}
  1213	                                            </button>
  1214	                                            <button type="button" id="printDeliverySlipsJp" class="btn btn-ec-conversion px-5">
  1215	                                                {{ 'admin.order.print_delivery_slips_ja'|trans }}
  1216	                                            </button>
  1217	                                            <button type="button" id="printDeliverySlipsEn" class="btn btn-ec-conversion px-5">
  1218	                                                {{ 'admin.order.print_delivery_slips_en'|trans }}
  1219	                                            </button>
  1220	                                        </div>
  1221	                                    </div>
  1222	                                </div>
  1223	                            </div>
  1224	                        </div>
  1225	                        <div class="card rounded border-0 mb-4 d-block">
  1240	                                        <th class="border-top-0 pt-2 pb-2 text-center">{{ 'enterprise.admin.shop.name'|trans }}<a href="#" class="js-listSort" data-sortkey="delivery"><i class="fa fa-arrow-up" aria-hidden="true"></i></a></th>
  1241	                                        <th class="border-top-0 pt-2 pb-2 text-center pe-3"></th>
  1242	                                    </tr>
  1243	                                    </thead>
  1244	                                    <tbody>
  1245	                                    {% for Order in pagination %}
  1246	                                        {% for Shipping in Order.Shippings %}
  1247	                                            <tr>
  1248	                                                <td class="align-middle text-center ps-3">
  1249	                                                    <input type="checkbox" id="check_{{ Shipping.id }}" data-id="{{ Shipping.id }}" data-order-id="{{ Order.id }}" name="ids[]" value="{{ Shipping.id }}"
  1250	                                                           data-preview-notify-mail-url="{{ url('admin_shipping_preview_notify_mail', { id: Shipping.id}) }}"
  1251	                                                           data-notify-mail-url="{{ url('admin_shipping_notify_mail', { id: Shipping.id}) }}"
  1252	                                                           data-update-status-url="{{ url('admin_shipping_update_order_status', { id: Shipping.id}) }}"
  1253	                                                    />
  1254	                                                </td>
  1255	                                                <td class="align-middle text-start">

exec
/bin/bash -lc 'rg -n "function getOrderNo|function getOrderNumber|setOrderNo|setOrderNumber" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
47:     * @method Order setOrderNumber(?string $order_number)
877:        public function setOrderNo(?string $orderNo = null): Order
887:        public function getOrderNo(): ?string
1768:        public function getOrderNumber(): ?string
1773:        public function setOrderNumber(?string $order_number): Order

exec
/bin/bash -lc 'rg -n "order_no|order_number" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:135:     *         order_number?:string,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:136:     *         order_no?:string,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:258:        // order_number
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:259:        if (isset($searchData['order_number']) && StringUtil::isNotBlank($searchData['order_number'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:261:                ->andWhere('o.order_number LIKE :order_number')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:262:                ->setParameter('order_number', '%'.$searchData['order_number'].'%');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1174:                ->andWhere('o.order_number >= :order_id_from')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1179:                ->andWhere('o.order_number <= :order_id_to')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1271:        return (string) $this->getEntityManager()->getConnection()->fetchOne('SELECT NEXTVAL(\'dtb_order_no_seq\')');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1326:            , o.order_number
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1349:            ->addScalarResult('order_number', 'order_number')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1378:                'o.order_number',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1514:            'o.order_number AS order_number',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1525:            ->andWhere('o.order_number IS NOT NULL')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1572:                    o.order_number,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1583:                  AND o.order_number IS NOT NULL
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1594:                    o.order_number,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1604:                    AND o.order_number IS NOT NULL
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1615:            ->addScalarResult('order_number', 'order_number')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1826:            ->andWhere('o.order_number IS NOT NULL')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1847:            AND o.order_number IS NOT NULL
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:2071:     *  2. 各グループについて、紐づく店頭受取受注の order_date 最大値と order_number 一覧を 1 クエリずつ取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:2191:     * next_order_id ごとに、統合グループに含まれる全受注の order_number を id 昇順で返す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:2208:            ->select('o.id AS orderId, o.nextOrderId AS nextOrderId, o.order_number AS orderNumber')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:2210:            ->andWhere('o.order_number IS NOT NULL')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:887:            if (empty($Order['order_number'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:392:                                <!-- admin_search_order[order_number] 注文番号 -->
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:393:                                {{ form_widget(searchForm.order_number) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:394:                                {{ form_errors(searchForm.order_number) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1234:                                        <th class="border-top-0 pt-2 pb-2 text-center">{{ 'admin.order.order_no'|trans }}<a href="#" class="js-listSort" data-sortkey="order_number"><i class="fa fa-arrow-up" aria-hidden="true"></i></a></th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1266:                                                        {{ Order.order_number }}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php | sed -n '860,895p;1760,1780p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   860	        {
   861	            $this->pre_order_id = $preOrderId;
   862	
   863	            return $this;
   864	        }
   865	
   866	        /**
   867	         * Get preOrderId.
   868	         */
   869	        public function getPreOrderId(): ?string
   870	        {
   871	            return $this->pre_order_id;
   872	        }
   873	
   874	        /**
   875	         * Set orderNo
   876	         */
   877	        public function setOrderNo(?string $orderNo = null): Order
   878	        {
   879	            $this->order_no = $orderNo;
   880	
   881	            return $this;
   882	        }
   883	
   884	        /**
   885	         * Get orderNo
   886	         */
   887	        public function getOrderNo(): ?string
   888	        {
   889	            return $this->order_no;
   890	        }
   891	
   892	        /**
   893	         * Set message.
   894	         */
   895	        public function setMessage(?string $message = null): Order
  1760	            return $this;
  1761	        }
  1762	
  1763	        public function getWaitingNumber(): ?int
  1764	        {
  1765	            return $this->waitingNumber;
  1766	        }
  1767	
  1768	        public function getOrderNumber(): ?string
  1769	        {
  1770	            return $this->order_number;
  1771	        }
  1772	
  1773	        public function setOrderNumber(?string $order_number): Order
  1774	        {
  1775	            $this->order_number = $order_number;
  1776	
  1777	            return $this;
  1778	        }
  1779	
  1780	        public function getMember(): ?Member

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig | sed -n '1228,1270p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
  1228	                                    <thead>
  1229	                                    <tr>
  1230	                                        <th class="border-top-0 pt-2 pb-2 text-center ps-3">
  1231	                                            <input type="checkbox" id="toggle_check_all" name="filter" value="open">
  1232	                                        </th>
  1233	                                        <th class="border-top-0 pt-2 pb-2 text-center">{{ 'admin.order.order_date'|trans }}<a href="#" class="js-listSort" data-sortkey="order_date"><i class="fa fa-arrow-up" aria-hidden="true"></i></a></th>
  1234	                                        <th class="border-top-0 pt-2 pb-2 text-center">{{ 'admin.order.order_no'|trans }}<a href="#" class="js-listSort" data-sortkey="order_number"><i class="fa fa-arrow-up" aria-hidden="true"></i></a></th>
  1235	                                        <th class="border-top-0 pt-2 pb-2 text-center">{{ 'admin.common.name'|trans }}<a href="#" class="js-listSort" data-sortkey="orderer"><i class="fa fa-arrow-up" aria-hidden="true"></i></a></th>
  1236	                                        <th class="border-top-0 pt-2 pb-2 text-center text-nowrap">{{ 'admin.common.payment_method'|trans }}<a href="#" class="js-listSort" data-sortkey="payment_method"><i class="fa fa-arrow-up" aria-hidden="true"></i></a></th>
  1237	                                        <th class="border-top-0 pt-2 pb-2 text-center">{{ 'admin.order.purchase_price'|trans }}<a href="#" class="js-listSort" data-sortkey="purchase_price"><i class="fa fa-arrow-up" aria-hidden="true"></i></a></th>
  1238	                                        <th class="border-top-0 pt-2 pb-2 text-center">{{ 'admin.order.commit_date'|trans }}<a href="#" class="js-listSort" data-sortkey="order_commit_date"><i class="fa fa-arrow-up" aria-hidden="true"></i></a></th>
  1239	                                        <th class="border-top-0 pt-2 pb-2 text-center">{{ 'admin.order.order_status'|trans }}<a href="#" class="js-listSort" data-sortkey="order_status"><i class="fa fa-arrow-up" aria-hidden="true"></i></a></th>
  1240	                                        <th class="border-top-0 pt-2 pb-2 text-center">{{ 'enterprise.admin.shop.name'|trans }}<a href="#" class="js-listSort" data-sortkey="delivery"><i class="fa fa-arrow-up" aria-hidden="true"></i></a></th>
  1241	                                        <th class="border-top-0 pt-2 pb-2 text-center pe-3"></th>
  1242	                                    </tr>
  1243	                                    </thead>
  1244	                                    <tbody>
  1245	                                    {% for Order in pagination %}
  1246	                                        {% for Shipping in Order.Shippings %}
  1247	                                            <tr>
  1248	                                                <td class="align-middle text-center ps-3">
  1249	                                                    <input type="checkbox" id="check_{{ Shipping.id }}" data-id="{{ Shipping.id }}" data-order-id="{{ Order.id }}" name="ids[]" value="{{ Shipping.id }}"
  1250	                                                           data-preview-notify-mail-url="{{ url('admin_shipping_preview_notify_mail', { id: Shipping.id}) }}"
  1251	                                                           data-notify-mail-url="{{ url('admin_shipping_notify_mail', { id: Shipping.id}) }}"
  1252	                                                           data-update-status-url="{{ url('admin_shipping_update_order_status', { id: Shipping.id}) }}"
  1253	                                                    />
  1254	                                                </td>
  1255	                                                <td class="align-middle text-start">
  1256	                                                    <a class="action-edit" href="{{ url('admin_order_edit', { id : Order.id }) }}">
  1257	                                                        {{ Order.order_date|date_min }}
  1258	                                                        {% if Order.pickup_today %}
  1259	                                                        <span class="pickup-today-badge">当日</span>
  1260	                                                        {% endif %}
  1261	                                                    </a>
  1262	                                                </td>
  1263	                                                <td class="align-middle text-start">
  1264	                                                    <!-- TODO: アラート + ポイントエラーの場合、スタイル変更 -->
  1265	                                                    <a class="action-edit" href="{{ url('admin_order_edit', { id : Order.id }) }}">
  1266	                                                        {{ Order.order_number }}
  1267	                                                    </a>
  1268	                                                </td>
  1269	                                                <td class="align-middle text-start">
  1270	                                                    {% if Order.Customer is null %}

exec
/bin/bash -lc 'rg -n "order_no|getOrderNo|setOrderNo|OrderNo" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /home/y-saito/Developments/ec-cube-enterprise/app 2>/dev/null' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/complete.twig:57:                            <p class="c-hareruya-heading--lev3">{{ 'front.shopping.order_no'|trans }}　{{ Order.orderNumber }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:177:            ->add('order_no', TextType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:178:                'label' => 'admin.order.order_no',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:54:use Eccube\Service\PurchaseFlow\Processor\OrderNoProcessor;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:94:     * @param OrderNoProcessor                  $orderNoProcessor        受注番号採番
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:115:        protected OrderNoProcessor $orderNoProcessor,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:657:                // IDENTITY の場合、新規受注は OrderNoProcessor が PK を参照するため同一トランザクション内で 1 回 flush が必要
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:222:    eccube_otc_buy_order_no_section_alert_mail_template_id: "eccube.mail.mall.otc_buy_order_no_section_alert" #店頭買取集計バッチ 部門未設定商品通知メール
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:237:    eccube_order_no_format: ''
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Purchase/complete.twig:56:                            <th>{{ 'front.purchase.complete.order_no'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/purchaseflow.yaml:122:        class: Eccube\Service\PurchaseFlow\Processor\OrderNoProcessor
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:126:                    $form['orderNumber']->addError(new FormError(trans('admin.customer.point.form.not_has.order_no')));
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/doctrine.yaml:36:                schema_filter: '~^(?!dtb_order_no_seq$)~'
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/doctrine.yaml:44:                schema_filter: '~^(?!dtb_order_no_seq$)~'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:143:     * @param string|int $order_no
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:147:    #[Route(path: '/mypage/history/{order_no}', name: 'mypage_history', methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:149:    public function history(Request $request, $order_no): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:155:                'order_number' => $order_no,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:192:     * @param int|string $order_no
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:196:    #[Route(path: '/mypage/order/{order_no}', name: 'mypage_order', methods: ['PUT'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:197:    public function order(Request $request, $order_no): RedirectResponse|Response
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:201:        log_info('再注文開始', [$order_no]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:208:                'order_number' => $order_no,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:223:            log_info('対象の注文が見つかりません', [$order_no]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:257:                log_info($e->getMessage(), [$order_no]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:279:        log_info('再注文完了', [$order_no]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:136:     *         order_no?:string,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1271:        return (string) $this->getEntityManager()->getConnection()->fetchOne('SELECT NEXTVAL(\'dtb_order_no_seq\')');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOrderNoRepository.php:21:use Eccube\Entity\DtbOrderNo;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOrderNoRepository.php:24: * @extends AbstractRepository<DtbOrderNo>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOrderNoRepository.php:26: * @see DtbOrderNo
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOrderNoRepository.php:28:class DtbOrderNoRepository extends AbstractRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOrderNoRepository.php:35:        parent::__construct($registry, DtbOrderNo::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOrderNoRepository.php:43:    public function nextValue(int $baseInfoId): DtbOrderNo
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOrderNoRepository.php:53:                ->update(DtbOrderNo::class, 'ono')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOrderNoRepository.php:87:    public function getCurrentValue(int $baseInfoId): DtbOrderNo
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260303143331.php:38:                'eccube.mail.mall.otc_buy_order_no_section_alert',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260303143331.php:40:                'Mail/Mall/otc_buy_order_no_section_alert.twig',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260513140000.php:25:        return 'order_no参照をorder_number参照に修正';
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260513140000.php:38:        $this->addSql("UPDATE dtb_csv SET field_name = 'order_no', reference_field_name = NULL WHERE csv_type_id = 3 AND disp_name = '注文番号';");
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260513140000.php:39:        $this->addSql("UPDATE dtb_csv SET field_name = 'order_no', reference_field_name = NULL WHERE csv_type_id = 4 AND disp_name = '注文番号';");
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260403165600.php:31:        $this->addSql('CREATE SEQUENCE IF NOT EXISTS dtb_order_no_seq INCREMENT BY 1 START 1 MINVALUE 1');
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260403165600.php:32:        $this->addSql('GRANT ALL PRIVILEGES ON SEQUENCE dtb_order_no_seq TO system, mall_owner, mall_operator, tenant_owner, tenant_operator, customer, guest, login_customer, login_member');
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260403165600.php:37:        $this->addSql('REVOKE ALL PRIVILEGES ON SEQUENCE dtb_order_no_seq FROM system, mall_owner, mall_operator, tenant_owner, tenant_operator, customer, guest, login_customer, login_member');
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260403165600.php:38:        $this->addSql('DROP SEQUENCE IF EXISTS dtb_order_no_seq');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:207:        // EC 標準注文番号 (order_no)。スマレジ商品コードの採番には使わない。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:208:        $Order->setOrderNo(sprintf('%s%04d', date('YmdHis'), random_int(0, 9999)));
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260604000001.php:30:        $this->addSql('CREATE SEQUENCE IF NOT EXISTS dtb_order_no_seq INCREMENT BY 1 START 1 MINVALUE 1');
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260604000001.php:31:        $this->addSql('GRANT ALL PRIVILEGES ON SEQUENCE dtb_order_no_seq TO system, mall_owner, mall_operator, tenant_owner, tenant_operator, customer, guest, login_customer, login_member');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:66:                                <dt>{{ 'front.mypage.order_no'|trans }}</dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderPdfService.php:444:        $this->lfText(25, 135, $Order->getOrderNo(), 10);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/history.twig:36:                        <dt>{{ 'front.mypage.order_no'|trans }}</dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/history.twig:191:                        <a href="{{ url('mypage_order', {'order_no': Order.order_number }) }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history.twig:130:                                        <dt>{{ 'front.mypage.shopping_history.col.order_no'|trans }}</dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:89:                                <span>{{ 'front.mypage.point_history.col.order_no'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:109:                                            <dt>{{ 'front.mypage.point_history.col.order_no'|trans }}</dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:112:                                                    <a class="c-hareruya-link" href="{{ url('mypage_history', {'order_no' : PointHistory.Order.order_number}) }}"{{ csrf_token_for_anchor() }}>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/TaxRateChangeValidator.php:44:        if (!$originHolder->getOrderNo()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeChangeValidator.php:44:        if (!$originHolder->getOrderNo()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderSequenceNoProcessor.php:26:     * OrderNoProcessor constructor.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/StockDiffProcessor.php:225:            $orderNo = $target->getOrderNo() ?? '';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PaymentChargeChangeValidator.php:44:        if (!$originHolder->getOrderNo()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderNoProcessor.php:25:class OrderNoProcessor implements ItemHolderPreprocessor
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderNoProcessor.php:28:     * OrderNoProcessor constructor.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderNoProcessor.php:43:            if ($Order->getOrderNo()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderNoProcessor.php:51:            $format = $this->eccubeConfig['eccube_order_no_format'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderNoProcessor.php:54:                $Order->setOrderNo((string) $Order->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderNoProcessor.php:92:                        'order_no' => $orderNo,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderNoProcessor.php:96:                $Order->setOrderNo($orderNo);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order.twig:15:ご注文番号：{{ Order.order_no }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcSyncDispatcher.php:55:            (string) ($Order->getOrderNo() ?? ''),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1204:            'mail_key' => $this->eccubeConfig['eccube_otc_buy_order_no_section_alert_mail_template_id'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcDeleteDispatcher.php:54:            (string) ($Order->getOrderNo() ?? ''),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderFactory.php:37: * TODO: order_no の採番ルールを確定する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail.twig:48:                            <span class="col-md-2 mt-2 mb-2">{{ 'admin.order.order_no'|trans }}</span> <span class="col-md-10 mt-2 mb-2">{{ Order.order_number }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/mail_confirm.twig:55:                            <div class="col-2"><span>{{ 'admin.order.order_no'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1234:                                        <th class="border-top-0 pt-2 pb-2 text-center">{{ 'admin.order.order_no'|trans }}<a href="#" class="js-listSort" data-sortkey="order_number"><i class="fa fa-arrow-up" aria-hidden="true"></i></a></th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:817:                                            <div class="col-3" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.order.order_no'|trans }}">{{ 'admin.order.order_no'|trans }}<i class="fa fa-question-circle fa-lg ms-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/mail.twig:64:                            <div class="col-2"><span>{{ 'admin.order.order_no'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:250:front.contact.order_notice: For an inquiry about your order, please inform us of the order number.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:573:front.mypage.order_no: Order No.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:628:front.mypage.point_history.col.order_no: Order no.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:730:front.mypage.shopping_history.col.order_no: Order No.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1089:front.shopping.order_no: Order No.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1542:front.purchase.complete.order_no: Purchase number
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2236:admin.order.order_no: Order No.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3140:tooltip.order.order_no: Order No. is automatically generated upon placing the order.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:231:front.purchase.complete.order_no: 買取番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:368:front.contact.order_notice: ご注文に関するお問い合わせには、必ず「ご注文番号」をご記入くださいますようお願いいたします。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:672:front.mypage.order_no: 注文番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:822:front.mypage.point_history.col.order_no: 注文番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:975:front.mypage.shopping_history.col.order_no: 注文番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1331:front.shopping.order_no: ご注文番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2432:admin.order.order_no: 注文番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2584:admin.buy_order.order_no: 買取番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2718:admin.customer.order_no: 受注番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2787:admin.customer.point.form.not_has.order_no: この会員は該当のオーダーIDを持っていません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3566:tooltip.order.order_no: 注文時に自動で採番される管理番号です。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig:870:                                            <th class="align-middle pt-2 pb-2">{{ 'admin.customer.order_no'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig:951:                                            <th class="align-middle pt-2 pb-2">{{ 'admin.buy_order.order_no'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order.html.twig:35:                            ご注文番号：{{ Order.order_no }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/order.twig:15:ご注文番号：{{ Order.order_no }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_order.csv:1:id,customer_id,country_id,pref_id,sex_id,job_id,payment_id,device_type_id,pre_order_id,order_no,message,name01,name02,kana01,kana02,company_name,email,phone_number,postal_code,addr01,addr02,birth,subtotal,discount,delivery_fee_total,charge,tax,total,payment_total,payment_method,note,create_date,update_date,order_date,payment_date,order_status_id
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:59:"58","3",,"Eccube\\Entity\\Order","order_no",,"注文番号","2","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:129:"129","4",,"Eccube\\Entity\\Order","order_no",,"注文番号","2","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/order.twig:15:ご注文番号：{{ Order.order_no }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/order.html.twig:35:                            ご注文番号：{{ Order.order_no }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/order.twig:15:ご注文番号：{{ Order.order_no }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/order.html.twig:35:                            ご注文番号：{{ Order.order_no }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_order.csv:1:id,customer_id,country_id,pref_id,sex_id,job_id,payment_id,device_type_id,pre_order_id,order_no,message,name01,name02,kana01,kana02,company_name,email,phone_number,postal_code,addr01,addr02,birth,subtotal,discount,delivery_fee_total,charge,tax,total,payment_total,payment_method,note,create_date,update_date,order_date,payment_date,order_status_id
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:59:58,3,,Eccube\\Entity\\Order,order_no,,Order No.,2,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:129:129,4,,Eccube\\Entity\\Order,order_no,,Order No.,2,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOrderNo.php:20:use Eccube\Repository\DtbOrderNoRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOrderNo.php:22:#[ORM\Table(name: 'dtb_order_no')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOrderNo.php:23:#[ORM\Entity(repositoryClass: DtbOrderNoRepository::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOrderNo.php:24:class DtbOrderNo extends AbstractEntity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOrderNo.php:52:    public function setValue(int $value): DtbOrderNo
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOrderNo.php:64:    public function setBaseInfo(?BaseInfo $BaseInfo): DtbOrderNo
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOrderNo.php:79:    public function setUpdateDate(\DateTime $updateDate): DtbOrderNo
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOrderNo.php:89:    public function nextValue(): DtbOrderNo
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Cart.php:425:        public function getOrderNo(): ?string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/order.html.twig:35:                            ご注文番号：{{ Order.order_no }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:149:    #[ORM\Index(columns: ['order_no'], name: 'dtb_order_order_no_idx')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:464:        #[ORM\Column(name: 'order_no', type: Types::STRING, length: 255, nullable: true)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:465:        private ?string $order_no = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:877:        public function setOrderNo(?string $orderNo = null): Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:879:            $this->order_no = $orderNo;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:887:        public function getOrderNo(): ?string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:889:            return $this->order_no;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ItemHolderInterface.php:144:    public function getOrderNo(): ?string;

codex
候補の主張中にある `order_no` の「別存在」も追加で確認しました。`dtb_order_order_no_idx` として DB インデックス定義があり、帳票表示のソースとは別にエンティティ上も列がある状態です。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php | sed -n '140,152p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   140	     * @method Order setOtcSmaregiLinkedPurchaseDate(?\DateTime $otcSmaregiLinkedPurchaseDate)
   141	     * @method list<string> getOtcSmaregiLinkedOrderNumbers()
   142	     * @method Order setOtcSmaregiLinkedOrderNumbers(list<string> $otcSmaregiLinkedOrderNumbers)
   143	     */
   144	    #[ORM\Table(name: 'dtb_order')]
   145	    #[ORM\Index(columns: ['email'], name: 'dtb_order_email_idx')]
   146	    #[ORM\Index(columns: ['order_date'], name: 'dtb_order_order_date_idx')]
   147	    #[ORM\Index(columns: ['payment_date'], name: 'dtb_order_payment_date_idx')]
   148	    #[ORM\Index(columns: ['update_date'], name: 'dtb_order_update_date_idx')]
   149	    #[ORM\Index(columns: ['order_no'], name: 'dtb_order_order_no_idx')]
   150	    #[ORM\UniqueConstraint(name: 'dtb_order_pre_order_id_idx', columns: ['pre_order_id'])]
   151	    #[ORM\HasLifecycleCallbacks]
   152	    #[ORM\Entity(repositoryClass: OrderRepository::class)]

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php | sed -n '170,182p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   170	                'label' => 'admin.order.orderer_company_name',
   171	                'required' => false,
   172	            ])
   173	            ->add('email', TextType::class, [
   174	                'label' => 'admin.common.mail_address',
   175	                'required' => false,
   176	            ])
   177	            ->add('order_no', TextType::class, [
   178	                'label' => 'admin.order.order_no',
   179	                'required' => false,
   180	            ])
   181	            ->add('phone_number', PhoneNumberType::class, [
   182	                'label' => 'admin.common.phone_number',

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php | sed -n '252,264p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   252	        if (!empty($searchData['tenants']) && count($searchData['tenants']) > 0) {
   253	            $qb
   254	                ->andWhere($qb->expr()->in('s.baseInfo', ':BaseInfo'))
   255	                ->setParameter('BaseInfo', $searchData['tenants']);
   256	        }
   257	
   258	        // order_number
   259	        if (isset($searchData['order_number']) && StringUtil::isNotBlank($searchData['order_number'])) {
   260	            $qb
   261	                ->andWhere('o.order_number LIKE :order_number')
   262	                ->setParameter('order_number', '%'.$searchData['order_number'].'%');
   263	        }
   264	

exec
/bin/bash -lc 'rg -n "order_number" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
75:            ->add('order_number', TextType::class, [
79:                    'placeholder' => 'admin.order.order_number',

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php | sed -n '1,80p;150,190p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Form\Type\Admin;
    17	
    18	use Doctrine\ORM\EntityRepository;
    19	use Eccube\Common\EccubeConfig;
    20	use Eccube\Entity\BaseInfo;
    21	use Eccube\Entity\Delivery;
    22	use Eccube\Entity\DtbCustomerGroup;
    23	use Eccube\Entity\Master\Country;
    24	use Eccube\Entity\Master\OrderStatus;
    25	use Eccube\Entity\Master\Pref;
    26	use Eccube\Entity\Master\Sex;
    27	use Eccube\Entity\Shipping;
    28	use Eccube\Form\EventListener\ConvertKanaListener;
    29	use Eccube\Form\Type\Master\OrderStatusType;
    30	use Eccube\Form\Type\Master\PaymentType;
    31	use Eccube\Form\Type\PhoneNumberType;
    32	use Eccube\Form\Type\PriceType;
    33	use Symfony\Bridge\Doctrine\Form\Type\EntityType;
    34	use Symfony\Component\Form\AbstractType;
    35	use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
    36	use Symfony\Component\Form\Extension\Core\Type\DateTimeType;
    37	use Symfony\Component\Form\Extension\Core\Type\DateType;
    38	use Symfony\Component\Form\Extension\Core\Type\HiddenType;
    39	use Symfony\Component\Form\Extension\Core\Type\NumberType;
    40	use Symfony\Component\Form\Extension\Core\Type\TextType;
    41	use Symfony\Component\Form\FormBuilderInterface;
    42	use Symfony\Component\Form\FormError;
    43	use Symfony\Component\Form\FormEvent;
    44	use Symfony\Component\Form\FormEvents;
    45	use Symfony\Component\Validator\Constraints as Assert;
    46	
    47	class SearchOrderType extends AbstractType
    48	{
    49	    public function __construct(protected EccubeConfig $eccubeConfig)
    50	    {
    51	    }
    52	
    53	    /**
    54	     * {@inheritdoc}
    55	     *
    56	     * @param array<string, mixed> $options
    57	     */
    58	    #[\Override]
    59	    public function buildForm(FormBuilderInterface $builder, array $options): void
    60	    {
    61	        // 日付系は複数フィールドに分かれているので、共通化する
    62	        $this->addDateRange($builder, 'order', 'admin.order.order_date', false);
    63	        $this->addDateRange($builder, 'payment', 'admin.order.payment_date', true);
    64	        $this->addDateRange($builder, 'update', 'admin.order.update_date', true);
    65	        $this->addDateRange($builder, 'shipping_delivery', 'admin.order.shipping_delivery_date', true);
    66	        $this->addDateRange($builder, 'confirm', 'admin.order.confirm_date', true);
    67	        $this->addDateRange($builder, 'commit', 'admin.order.commit_date', true);
    68	        $this->addDateRange($builder, 'shipping', 'admin.order.shipping_date', true);
    69	        $this->addDateRange($builder, 'cancel', 'admin.order.cancel_date', true);
    70	        $this->addDateRange($builder, 'receipt', 'admin.order.receipt_date', true);
    71	        $this->addDateRange($builder, 'otc_rsv', 'admin.order.otc_rsv_date', true);
    72	
    73	        $builder
    74	            // 注文番号
    75	            ->add('order_number', TextType::class, [
    76	                'required' => false,
    77	                'attr' => [
    78	                    'class' => 'input_search',
    79	                    'placeholder' => 'admin.order.order_number',
    80	                ],
   150	                },
   151	            ])
   152	            ->add('name', TextType::class, [
   153	                'label' => 'admin.order.orderer_name',
   154	                'required' => false,
   155	            ])
   156	            ->add($builder
   157	                ->create('kana', TextType::class, [
   158	                    'label' => 'admin.order.orderer_kana',
   159	                    'required' => false,
   160	                    'constraints' => [
   161	                        new Assert\Regex([
   162	                            'pattern' => '/^[ァ-ヶｦ-ﾟー]+$/u',
   163	                            'message' => 'form_error.kana_only',
   164	                        ]),
   165	                    ],
   166	                ])
   167	                ->addEventSubscriber(new ConvertKanaListener('CV')
   168	                ))
   169	            ->add('company_name', TextType::class, [
   170	                'label' => 'admin.order.orderer_company_name',
   171	                'required' => false,
   172	            ])
   173	            ->add('email', TextType::class, [
   174	                'label' => 'admin.common.mail_address',
   175	                'required' => false,
   176	            ])
   177	            ->add('order_no', TextType::class, [
   178	                'label' => 'admin.order.order_no',
   179	                'required' => false,
   180	            ])
   181	            ->add('phone_number', PhoneNumberType::class, [
   182	                'label' => 'admin.common.phone_number',
   183	                'required' => false,
   184	            ])
   185	            ->add('tracking_number', TextType::class, [
   186	                'label' => 'admin.order.tracking_number',
   187	                'required' => false,
   188	            ])
   189	            ->add('shipping_mail', ChoiceType::class, [
   190	                'label' => 'admin.order.shipping_mail',

codex
確認結果: 候補findingは概ね信頼できます。誤検知・根拠不備・重要度誤りは見つかりませんでした。

CONFIRMED | ④DBカラム・DB操作・テーブル | 設計書は `dtb_order` 代表列として `order_no` を挙げるが、実装の納品書表示値は `order_number`。候補の指摘は妥当。 | 設計: `function_spec_html_preview/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.html:263`、実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:281`、`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:42`、`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:464`、`:647` | 候補どおり維持。設計書側を `order_number` に補正するのが妥当。

SEVERITY | ④DBカラム・DB操作・テーブル | `low` は妥当。帳票の表示元列名の細部差分で、ルート処理・DB書込・権限・エラー処理の破綻ではない。 | `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:743`、`:746` | 重要度変更不要。

VERDICT: false_positive=0, missed=0, weak_evidence=0, 総合=信頼できる
tokens used
74,440
確認結果: 候補findingは概ね信頼できます。誤検知・根拠不備・重要度誤りは見つかりませんでした。

CONFIRMED | ④DBカラム・DB操作・テーブル | 設計書は `dtb_order` 代表列として `order_no` を挙げるが、実装の納品書表示値は `order_number`。候補の指摘は妥当。 | 設計: `function_spec_html_preview/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.html:263`、実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:281`、`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:42`、`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:464`、`:647` | 候補どおり維持。設計書側を `order_number` に補正するのが妥当。

SEVERITY | ④DBカラム・DB操作・テーブル | `low` は妥当。帳票の表示元列名の細部差分で、ルート処理・DB書込・権限・エラー処理の破綻ではない。 | `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:743`、`:746` | 重要度変更不要。

VERDICT: false_positive=0, missed=0, weak_evidence=0, 総合=信頼できる

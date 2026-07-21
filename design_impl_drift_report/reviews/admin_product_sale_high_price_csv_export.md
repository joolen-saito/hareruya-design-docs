OpenAI Codex v0.142.5
--------
workdir: /home/y-saito/Developments/hareruya-design-docs
model: gpt-5.5
provider: openai
approval: never
sandbox: read-only
reasoning effort: medium
reasoning summaries: none
session id: 019f26a8-0842-7e02-a1d1-7f161323ef68
--------
user
あなたは設計書vs実装の差分監査に対する**批判的レビュア**です。読み取り専用で検証してください。創作禁止・確認できないものは「確認不能」と明記。

## 対象機能: admin_product_sale_high_price_csv_export
- 差分候補JSON(検証対象): /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/admin_product_sale_high_price_csv_export.json
- 設計書HTML(正): /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/admin_product_sale_high_price_csv_export.html
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
読み取り専用で、まず候補JSONと設計HTMLの該当箇所、実装側の参照先を確認します。差分候補の主張を先に固定してから、周辺コードと設計の重要節を横断して見落としを探します。
exec
/bin/bash -lc "sed -n '1,240p' /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/admin_product_sale_high_price_csv_export.json" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
{
  "functionId": "admin_product_sale_high_price_csv_export",
  "title": "admin_product_sale_high_price_csv_export（管理画面_商品管理_セール用高額商品価格変更CSV雛形出力）",
  "domain": "admin_product",
  "kind": "admin",
  "designHtml": "function_spec_html_preview/pf-eccube3/admin_product_sale_high_price_csv_export.html",
  "findings": [
    {
      "dimension": "② 業務ルール・計算",
      "severity": "high",
      "designRef": "function_spec_html_preview/pf-eccube3/admin_product_sale_high_price_csv_export.html:234",
      "designQuote": "<td>商品コード</td>...<td>販売価格</td>...<td>買取価格</td>...<td>セールフラグ</td>...<td>帯URL</td>...<td>タグ(ID)</td>...<td>スマレジ連携フラグ</td>",
      "implRef": "src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:180-186",
      "difference": "設計はヘッダ列を左から『商品コード/販売価格/買取価格/セールフラグ/帯URL/タグ(ID)/スマレジ連携フラグ』の7列と定める。実装のgetCsvHeader()(178-187行、返却配列は180-186行)は『商品コード/販売価格/セールフラグ/帯URL/タグ(ID)』の5列のみを返し、『買取価格』と『スマレジ連携フラグ』の2列が欠落。雛形CSVのヘッダ行が設計と列数・列内容ともに不一致。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "実装 getCsvHeader() 返却キーは 商品コード(181)/販売価格(182)/セールフラグ(183)/帯URL(184)/タグ(ID)(185) の5件のみ。買取価格・スマレジ連携フラグは存在しない。設計HTML:234 は7列（買取価格・スマレジ連携フラグ含む）を明示。csvTemplate()(53-60行)は getCsvHeader() を雛形出力に使用しており、この配列が雛形ヘッダ行そのものとなる。"
    },
    {
      "dimension": "③ バリデーション(必須列バッジ)",
      "severity": "high",
      "designRef": "function_spec_html_preview/pf-eccube3/admin_product_sale_high_price_csv_export.html:235",
      "designQuote": "必須バッジの付与は 商品コード・販売価格・買取価格・セールフラグ・スマレジ連携フラグ に対して行われる。帯URL と タグ(ID) には付かない。",
      "implRef": "src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:194-198",
      "difference": "設計は必須バッジ対象を『商品コード・販売価格・買取価格・セールフラグ・スマレジ連携フラグ』の5項目とする。実装のgetRequiredCsvHeader()(192-199行、返却配列は194-198行)は『商品コード・販売価格・セールフラグ』の3項目のみを返し、『買取価格』『スマレジ連携フラグ』が必須指定から欠落。array_keys()経由でcsv_required_header_keys(88行)としてテンプレートに渡り画面バッジに反映されるため、設計の必須集合と不一致。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "実装 getRequiredCsvHeader() 返却キーは 商品コード(195)/販売価格(196)/セールフラグ(197) の3件のみ。88行で array_keys($this->getRequiredCsvHeader()) を 'csv_required_header_keys' としてテンプレートに渡す。設計HTML:235 は5項目（買取価格・スマレジ連携フラグ含む）を必須バッジ対象と明示。買取価格・スマレジ連携フラグが欠落。"
    }
  ]
}

exec
/bin/bash -lc "nl -ba function_spec_html_preview/pf-eccube3/admin_product_sale_high_price_csv_export.html | sed -n '1,260p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<!doctype html>
     2	<html lang="ja">
     3	<head>
     4	  <meta charset="utf-8">
     5	  <meta name="viewport" content="width=device-width, initial-scale=1">
     6	  <title>admin_product_sale_high_price_csv_export（管理画面_商品管理_セール用高額商品価格変更CSV雛形出力） - 機能仕様書</title>
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
   183	<a class="lv2" href="#利用者視点の入口">利用者視点の入口</a>
   184	<a class="lv2" href="#フロント挙動">フロント挙動</a>
   185	<a class="lv2" href="#処理フロー">処理フロー</a>
   186	<a class="lv3" href="#雛形-CSV-をダウンロードする-GET-admin-product-sale-high-price-csv-template">雛形 CSV をダウンロードする（GET `admin_product_sale_high_price_csv_template`）</a>
   187	<a class="lv3" href="#文字コードと区切り-fopen-fputcsv-の共通実装">文字コードと区切り（`fopen`〜`fputcsv` の共通実装）</a>
   188	<a class="lv2" href="#集計条件">集計条件</a>
   189	<a class="lv2" href="#業務ルール・計算">業務ルール・計算</a>
   190	<a class="lv3" href="#ヘッダ列-1-行目の左から右">ヘッダ列（1 行目の左から右）</a>
   191	<a class="lv2" href="#データ整合性">データ整合性</a>
   192	<a class="lv2" href="#API-バッチ結果">API/バッチ結果</a>
   193	<a class="lv2" href="#権限・認可">権限・認可</a>
   194	<a class="lv2" href="#画面遷移">画面遷移</a>
   195	<a class="lv2" href="#エラー処理">エラー処理</a>
   196	<a class="lv2" href="#ログ・監査">ログ・監査</a>
   197	<a class="lv3" href="#ログに出してはいけないもの">ログに出してはいけないもの</a>
   198	<a class="lv2" href="#セッション">セッション</a>
   199	<a class="lv2" href="#パフォーマンス">パフォーマンス</a>
   200	<a class="lv2" href="#拡張・差し替え">拡張・差し替え</a>
   201	<a class="lv2" href="#調査補助">調査補助</a>
   202	<a class="lv3" href="#HTTPルート名とパス-コード探索用・旧入口節より退避">HTTPルート名とパス（コード探索用・旧入口節より退避）</a></nav>
   203	    </aside>
   204	    <main class="doc-content">
   205	      <header class="page-header">
   206	        <p class="crumb">Source:<br>/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/admin_product_sale_high_price_csv_export.md</p>
   207	        <h1>admin_product_sale_high_price_csv_export（管理画面_商品管理_セール用高額商品価格変更CSV雛形出力）</h1>
   208	      </header>
   209	      <h2 id="概要">概要</h2>
   210	<p>管理画面「商品管理」配下の CSV 管理メニューから開ける「セール用高額商品価格変更CSVアップロード」画面上で、「雛形ファイルダウンロード」リンクを押すと取得できる、セール用高額商品価格変更 CSV 取込と同一ヘッダ列名（日本語）の 1 行だけを含む雛形ファイルを返す機能である。データ行（商品コードや価格の実データ）は出力されない。</p>
   211	<p>本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。ec-cube-enterprise のコア実装を確認値とする。</p>
   212	<p>対象はブラウザ経由の管理画面に限定する。</p>
   213	<p>コントローラのメソッド名は本文の主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。</p>
   214	<hr>
   215	<h2 id="利用者視点の入口">利用者視点の入口</h2>
   216	<div class="table-wrap"><table><thead><tr><th>入口</th><th>URLエンドポイント</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>管理画面メニューで「商品管理」→「商品CSV」→「セール用高額商品価格変更CSVアップロード」を開き、カード「セール用高額商品価格変更CSVファイルフォーマット」内の「雛形ファイルダウンロード」を押す</td><td><code>GET /{admin_route}/product/sale_high_price/csv_template</code></td><td>ファイル名 <code>sale_high_price_template.csv</code> が添付として返り、本文はヘッダ行 1 行だけの CSV である。</td></tr><tr><td>上記 URL を直接開く（ブックマーク等）</td><td>同上</td><td>認証・共通制約を通過していれば同じ雛形が返る。</td></tr></tbody></table></div>
   217	<p>ナビゲーションの表示ラベルはロケールキー <code>admin.product.sale_high_price_csv</code> により「セール用高額商品価格変更CSVアップロード」となる（日本語ロケールの確認値）。</p>
   218	<hr>
   219	<h2 id="フロント挙動">フロント挙動</h2>
   220	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>表示要素</td><td>雛形へのリンクは共通テンプレート <code>base_csv_upload.twig</code> にあり、フォーマット説明カードのヘッダ右側の <code>id="download-template-button"</code> のアンカー。ラベルは <code>admin.common.csv_skeleton_download</code>（日本語では「雛形ファイルダウンロード」）。子テンプレート <code>csv_product_sale_high_price.twig</code> はメニューハイライトとサブタイトル文言のみを上書きする。</td></tr><tr><td>JS 挙動</td><td>雛形ダウンロード専用のクライアント処理は無い。ファイル選択とアップロード送信時のローディング表示のみ共通スクリプトにある。</td></tr><tr><td>CSS・レイアウト</td><td>雛形リンクはコアの secondary ボタン見た目。</td></tr><tr><td>モーダル・ポップアップ</td><td>ダウンロード前の確認ダイアログは無い。</td></tr></tbody></table></div>
   221	<hr>
   222	<h2 id="処理フロー">処理フロー</h2>
   223	<h3 id="雛形-CSV-をダウンロードする-GET-admin-product-sale-high-price-csv-template">雛形 CSV をダウンロードする（GET <code>admin_product_sale_high_price_csv_template</code>）</h3>
   224	<ol><li>管理画面の認証・共通制約を通過する。</li><li>ストリーミング応答のコールバック内で、共通の CSV 出力サービスを開く（<code>fopen</code>）。</li><li>ヘッダー定義連想配列のキーを順に並べた配列を 1 行だけ <code>fputcsv</code> に渡す。値側の説明文は書き込まない。</li><li>出力ストリームを閉じる（<code>fclose</code>）。</li><li>応答ヘッダに <code>Content-Type: application/octet-stream</code> と <code>Content-Disposition: attachment; filename=sale_high_price_template.csv</code> を付与した応答を返す（自動テストがこの組み合わせを確認値とする）。</li></ol>
   225	<h3 id="文字コードと区切り-fopen-fputcsv-の共通実装">文字コードと区切り（<code>fopen</code>〜<code>fputcsv</code> の共通実装）</h3>
   226	<ol><li>設定 <code>eccube_csv_export_encoding</code> の値（配布設定では <code>UTF-8</code>）を UTF-8 からの変換先とする。配列の各セルは <code>mb_convert_encoding</code> で当該エンコーディングへ変換されてから <code>fputcsv</code> される。</li><li>エンコーディング名を大文字化した値が <code>UTF-8</code> と一致するとき、ストリーム先頭に UTF-8 の BOM（バイト列 <code>\xEF\xBB\xBF</code>）を書く。</li><li>区切り文字は <code>eccube_csv_export_separator</code>（配布設定ではカンマ）。フィールド囲みは二重引用符、エスケープはバックスラッシュとして <code>fputcsv</code> に渡される。</li></ol>
   227	<hr>
   228	<h2 id="集計条件">集計条件</h2>
   229	<p>本機能では件数集計や売上などの業務集計は行わない。出力内容は固定のヘッダ行 1 行のみである。</p>
   230	<hr>
   231	<h2 id="業務ルール・計算">業務ルール・計算</h2>
   232	<h3 id="ヘッダ列-1-行目の左から右">ヘッダ列（1 行目の左から右）</h3>
   233	<p>画面上のフォーマット表の行順と一致する。列名と画面の説明欄の対応は次のとおり（説明文は参考用。ファイル内のデータセルには出ない）。</p>
   234	<div class="table-wrap"><table><thead><tr><th>列名（ヘッダ）</th><th>画面上の説明欄の内容（確認値）</th></tr></thead><tbody><tr><td>商品コード</td><td>（空欄。取込側で必須）</td></tr><tr><td>販売価格</td><td>（空欄。取込側で必須）</td></tr><tr><td>買取価格</td><td>（空欄。取込側で必須）</td></tr><tr><td>セールフラグ</td><td><code>0: セールではない, 1: セールあり</code></td></tr><tr><td>帯URL</td><td>（空欄）</td></tr><tr><td>タグ(ID)</td><td><code>カンマ区切りで複数指定可能。</code></td></tr><tr><td>スマレジ連携フラグ</td><td><code>0: 連携しない/ 1: 連携する</code>（取込側で必須列として扱われる）</td></tr></tbody></table></div>
   235	<p>必須バッジの付与は <code>商品コード</code>・<code>販売価格</code>・<code>買取価格</code>・<code>セールフラグ</code>・<code>スマレジ連携フラグ</code> に対して行われる。<code>帯URL</code> と <code>タグ(ID)</code> には付かない。</p>
   236	<p>本機能ではフォーム入力の保存やファイルアップロード検証は行わない。よって <code>### 入力項目</code> 表は置かない（取込画面の入力は別ルート）。</p>
   237	<hr>
   238	<h2 id="データ整合性">データ整合性</h2>
   239	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>商品マスタとの一致</td><td>雛形ダウンロードはデータベースを読まないため、商品コードや価格との整合は保証の対象外である。</td></tr><tr><td>取込との一致</td><td>ヘッダ列名および列順は、同一機能群の取込ハンドラが期待する日本語列名と揃えるためのものである。取込時の検証・更新の詳細は取込側の実装を正とする。</td></tr></tbody></table></div>
   240	<hr>
   241	<h2 id="API-バッチ結果">API/バッチ結果</h2>
   242	<p>本機能では API 呼び出し・バッチ実行を扱わない。</p>
   243	<hr>
   244	<h2 id="権限・認可">権限・認可</h2>
   245	<div class="table-wrap"><table><thead><tr><th>利用者状態</th><th>雛形ダウンロード（GET <code>/{admin_route}/product/sale_high_price/csv_template</code>）</th></tr></thead><tbody><tr><td>管理画面にログイン済みで当領域へ到達できる主体</td><td>雛形を取得できる。</td></tr><tr><td>未認証または管理領域外の主体</td><td>管理画面のセキュリティ設定に従い、ログイン画面等へ誘導されるかアクセス拒否となる。実装の細部は別設計を正とする。</td></tr></tbody></table></div>
   246	<hr>
   247	<h2 id="画面遷移">画面遷移</h2>
   248	<div class="table-wrap"><table><thead><tr><th>条件</th><th>遷移先</th></tr></thead><tbody><tr><td>アップロード画面上で雛形リンクを押す</td><td>同一タブでファイルダウンロードが始まる。ブラウザの挙動により保存ダイアログが開く。HTML 画面遷移は発生しない。</td></tr><tr><td>直接 GET で雛形 URL を開く</td><td>同上。</td></tr></tbody></table></div>
   249	<p>遷移に伴い検索条件セッションやフラッシュメッセージを更新する処理は無い。</p>
   250	<hr>
   251	<h2 id="エラー処理">エラー処理</h2>
   252	<div class="table-wrap"><table><thead><tr><th>エラー内容</th><th>処理</th></tr></thead><tbody><tr><td>管理画面として未認証・無権限</td><td>管理画面共通の扱いに従う（詳細は別設計）。</td></tr><tr><td>雛形生成中の I/O 失敗</td><td>雛形用コールバック内で明示的な try-catch は無く、フレームワーク既定のエラーハンドリングに委ねる。</td></tr></tbody></table></div>
   253	<hr>
   254	<h2 id="ログ・監査">ログ・監査</h2>
   255	<p>雛形ダウンロードの成功時に専用の情報ログを残す処理は無い。</p>
   256	<h3 id="ログに出してはいけないもの">ログに出してはいけないもの</h3>
   257	<ul><li>パスワード</li><li>なりすまし対策トークン</li><li>Cookie 値</li><li>セッション ID の完全値</li><li>Remember Me トークンの原値</li></ul>
   258	<hr>
   259	<h2 id="セッション">セッション</h2>
   260	<p>本機能の GET 雛形ダウンロードは、セッションキー <code>admin.product.sale_high_price_csv.page_count</code> や <code>admin.product.sale_high_price_csv.page_no</code> を読み書きしない（これらはアップロード画面表示用の別ルートで用いられる）。</p>

exec
/bin/bash -lc 'rg -n "high_price|HighPrice|sale_high|高額|csv" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /home/y-saito/Developments/ec-cube-enterprise/app 2>/dev/null' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 117ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/EccubeExtension.php:308:            'csv' => 'fa-file-excel-o',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbCsvImportHistoryRepository.php:38:     * @param int $csvImportTypeId mtb_csv_import_type.id
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbCsvImportHistoryRepository.php:42:    public function insertCsvImportHistory(int $csvImportTypeId, string $fileName, ?int $memberId): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbCsvImportHistoryRepository.php:45:        $CsvImportType = $em->getRepository(MtbCsvImportType::class)->find($csvImportTypeId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbCsvImportHistoryRepository.php:63:     * @param int $csvImportTypeId mtb_csv_import_type.id
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbCsvImportHistoryRepository.php:65:    public function getQueryBuilderByCsvImportType(int $csvImportTypeId): QueryBuilder
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbCsvImportHistoryRepository.php:69:            ->where('ct.id = :csvImportTypeId')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbCsvImportHistoryRepository.php:70:            ->setParameter('csvImportTypeId', $csvImportTypeId)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbCsvImportHistoryRepository.php:79:    public function getRecentCsvImportHistory(int $csvImportType, string $fileName): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbCsvImportHistoryRepository.php:84:            ->where('cih.CsvImportType = :csvImportType')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbCsvImportHistoryRepository.php:88:                'csvImportType' => $csvImportType,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:178:                                    {{ 'admin.product.inventory_plan.csv_import_submit'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:184:                                    {{ 'admin.product.inventory_plan.quantity_csv_import_submit'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:190:                                    {{ 'admin.product.csv.export'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:267:    {% include '@admin/Stock/inventory_plan_csv_modal.twig' with {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:270:            modal_title: 'admin.product.inventory_plan.csv_import_title',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:271:            form_id: 'form-inventory-plan-product-csv',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:273:            file_input_id: 'inventory-plan-product-csv-file',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:275:            submit_label: 'admin.product.inventory_plan.csv_import_submit',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:276:            csv_format_type: 'product',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:277:            csvImportMaxRecords: csvImportMaxRecords,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:279:        {% include '@admin/Stock/inventory_plan_csv_modal.twig' with {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:282:            modal_title: 'admin.product.inventory_plan.quantity_csv_import_title',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:283:            form_id: 'form-inventory-plan-quantity-csv',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:285:            file_input_id: 'inventory-plan-quantity-csv-file',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:287:            submit_label: 'admin.product.inventory_plan.quantity_csv_import_submit',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:288:            csv_format_type: 'quantity',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:289:            csvImportMaxRecords: csvImportMaxRecords,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/CsvRepository.php:36:     * CSV種別・有効フラグで dtb_csv を取得し、sort_no（表示順 rank）で並べ替える.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/CsvRepository.php:40:    public function findByCsvTypeIdAndEnabledOrderBySortNo(int $csvTypeId, bool $enabled, string $sort = 'DESC'): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/CsvRepository.php:42:        $CsvType = $this->getEntityManager()->getReference(CsvType::class, $csvTypeId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/CsvRepository.php:46:            ->where('c.CsvType = :csvType')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/CsvRepository.php:48:            ->setParameter('csvType', $CsvType)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/CsvRepository.php:56:    //      * csv_extension_idに紐づくrankでソートしたcsv_sub情報の取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/CsvRepository.php:58:    //      * @param int $csvExtensionId
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/CsvRepository.php:63:    //     public function findByCsvExtensionId(int $csvExtensionId)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/CsvRepository.php:67:    //             ->innerJoin('Plugin\HareruyaEc\Entity\DtbCsvCsvExtension', 'cce', Join::WITH, 'cs.csvId = cce.csvId')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/CsvRepository.php:68:    //             ->where('cce.csvExtensionId = :csvExtensionId')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/CsvRepository.php:69:    //             ->setParameter('csvExtensionId', $csvExtensionId)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/history.twig:598:                                            <button class="btn btn-ec-regular" type="submit" formaction="{{ url('admin_stock_history_csv_export') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/history.twig:600:                                            <button class="btn btn-ec-regular" type="submit" formaction="{{ url('admin_stock_history_disposal_csv_export') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/history.twig:602:                                                <span>{{ 'admin.common.csv_download'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:65:                        <span class="fw-bold">{{ 'admin.stock.move_instruction.csv_registration'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:68:                        <button type="button" class="btn btn-ec-conversion" data-bs-toggle="modal" data-bs-target="#csvRecordRegistrationModal">{{ 'admin.stock.move_instruction.csv_registration_button'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:160:                                    <a href="{{ url('admin_stock_move_instruction_csv_download_record') }}" class="btn btn-ec-conversion">{{ 'admin.stock.move_instruction.csv_download_record'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:161:                                    <button type="button" id="stockMoveInstructionLabelsExport" class="btn btn-ec-conversion">{{ 'admin.stock.move_instruction.csv_download_invoice'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:276:                <div class="modal fade" id="csvRecordRegistrationModal" tabindex="-1" role="dialog" aria-labelledby="csvRecordRegistrationModalLabel" aria-hidden="true">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:280:                                <h5 class="modal-title fw-bold" id="csvRecordRegistrationModalLabel">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:281:                                    {{ 'admin.stock.move_instruction.csv_registration_button'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:282:                                    <span class="fw-normal fs-6 text-muted">{{ 'admin.stock.move_instruction.csv_registration_modal_overwrite_note'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:287:                            <form method="post" action="{{ url('admin_stock_move_instruction_csv_tracking') }}" enctype="multipart/form-data" id="csvRecordRegistrationForm">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:290:                                    <p class="text-muted small mb-3">{{ 'admin.stock.move_instruction.csv_registration_modal_lead'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:292:                                        <label class="col-form-label col-2">{{ 'admin.common.csv_select'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:294:                                            <p class="text-muted small mb-2">{{ 'admin.stock.move_instruction.csv_registration_file_limit'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:296:                                                <span id="csvRecordFileSelect" class="btn btn-ec-regular me-2">{{ 'admin.common.file_select'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:297:                                                <span id="csvRecordFileName">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:299:                                            <input type="file" name="csv_file" id="csvRecordImportFile" accept="text/csv,text/tsv,.csv,.tsv" class="d-none">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:303:                                        <h6 class="fw-bold mb-2">{{ 'admin.stock.move_instruction.csv_format_title'|trans }}</h6>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:314:                                                        <td class="table-light fw-bold"><span class="badge bg-primary me-1">{{ 'admin.common.required'|trans }}</span>{{ 'admin.stock.move_instruction.csv_format_instruction_id'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:315:                                                        <td>{{ 'admin.stock.move_instruction.csv_format_instruction_id_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:318:                                                        <td class="table-light fw-bold">{{ 'admin.stock.move_instruction.csv_format_move_from_shop'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:319:                                                        <td>{{ 'admin.stock.move_instruction.csv_format_move_from_shop_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:322:                                                        <td class="table-light fw-bold">{{ 'admin.stock.move_instruction.csv_format_move_to_shop'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:323:                                                        <td>{{ 'admin.stock.move_instruction.csv_format_move_to_shop_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:326:                                                        <td class="table-light fw-bold"><span class="badge bg-primary me-1">{{ 'admin.common.required'|trans }}</span>{{ 'admin.stock.move_instruction.csv_format_tracking_no'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:327:                                                        <td>{{ 'admin.stock.move_instruction.csv_format_tracking_no_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:336:                                    <button type="submit" class="btn btn-ec-conversion" id="csvRecordUploadButton" disabled>{{ 'admin.stock.move_instruction.tracking_register_button'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:343:                <form id="form_stock_move_instruction_label_csv" method="post" action="{{ url('admin_stock_move_instruction_labels_export') }}" class="d-none">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:375:            $('#csvRecordFileSelect').on('click', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:376:                $('#csvRecordImportFile').click();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:378:            $('#csvRecordImportFile').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:381:                    $('#csvRecordFileName').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:382:                    $('#csvRecordUploadButton').prop('disabled', false);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:384:                    $('#csvRecordFileName').text("{{ 'admin.common.file_select_empty'|trans|e('js') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:385:                    $('#csvRecordUploadButton').prop('disabled', true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:388:            $('#csvRecordRegistrationModal').on('hidden.bs.modal', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:389:                $('#csvRecordImportFile').val('');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:390:                $('#csvRecordFileName').text("{{ 'admin.common.file_select_empty'|trans|e('js') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:391:                $('#csvRecordUploadButton').prop('disabled', true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:411:                    alert("{{ 'admin.stock.move_instruction.csv_invoice_select_rows'|trans|e('js') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:416:                const $form = $('#form_stock_move_instruction_label_csv');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:193:                            <button type="button" class="btn btn-ec-regular" data-bs-toggle="modal" data-bs-target="#joinEditSourceCsvModal">{{ 'admin.stock.join.csv_register'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:204:                                <a href="{{ url('admin_stock_join_shortage_csv_export', { id: StockSplitJoin.id }) }}" class="btn btn-ec-conversion">{{ 'admin.stock.move.csv_output'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:205:                                <button type="button" class="btn btn-ec-conversion" data-bs-toggle="modal" data-bs-target="#joinShortageCsvModal">{{ 'admin.stock.join.shortage_csv_modal.open_button'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:513:    {% include '@admin/Stock/stock_join_source_csv_modal.twig' with {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:514:        join_source_csv_modal_id: 'joinEditSourceCsvModal',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:515:        join_source_csv_modal_label_id: 'joinEditSourceCsvModalLabel',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:516:        join_source_csv_form_id: 'form-join-edit-source-csv',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:517:        join_source_csv_file_id: 'join-edit-source-csv-file',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:518:        join_source_csv_submit_id: 'btn-join-edit-source-csv-submit',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:519:        join_source_csv_error_id: 'join-edit-source-csv-error',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:520:        join_source_csv_upload_url: url('admin_stock_join_edit_source_csv_upload', { id: StockSplitJoin.id }),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:521:        join_source_csv_template_url: url('admin_stock_join_new_source_csv_template'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:522:        join_source_csv_csrf: csrf_token('stock_join_edit_source_csv'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:523:        join_source_csv_reload: true,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:538:                    <h5 class="modal-title fw-bold" id="joinShortageCsvModalLabel">{{ 'admin.stock.join.shortage_csv_modal.title'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:543:                    {% include '@admin/Stock/stock_join_shortage_csv_modal.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1126:            let joinSrcCsvForm = document.getElementById('form-join-edit-source-csv');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1127:            let joinSrcCsvFile = document.getElementById('join-edit-source-csv-file');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1128:            let joinSrcCsvErr = document.getElementById('join-edit-source-csv-error');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1136:                let span = joinSrcCsvModal.querySelector('.js-join-csv-file-name');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1138:                    span.textContent = (this.files && this.files.length) ? this.files[0].name : "{{ 'admin.stock.split_csv_modal.no_file_selected'|trans|e('js') }}";
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1156:                        if (joinSrcCsvForm.getAttribute('data-join-csv-reload') === '1') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1161:                        let span = joinSrcCsvModal.querySelector('.js-join-csv-file-name');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1163:                            span.textContent = "{{ 'admin.stock.split_csv_modal.no_file_selected'|trans|e('js') }}";
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1191:            const shortageCsvForm = document.getElementById('form-join-shortage-csv');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1192:            const shortageCsvFile = document.getElementById('join-shortage-csv-file');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1193:            const shortageCsvErr = document.getElementById('join-shortage-csv-error');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1199:                const span = shortageCsvModal.querySelector('.js-shortage-csv-file-name');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/csv_card.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/csv_card.twig:5:{% block import_file_accept %}.csv, text/csv{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/csv_card.twig:7:{% block title %}{{ 'admin.card.card_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveAddDifferentialProductAction.php:43:            throw new \InvalidArgumentException('admin.stock.move.differential_csv_invalid_status');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/index.twig:167:            <a class="btn  btn-ec-conversion" href="{{ url('admin_card_csv_upload') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/index.twig:168:                {{ 'admin.common.csv_import'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/index.twig:349:                                            data-action="{{ url('admin_card_export_csv') }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionCreateAction.php:80:            $totalHighPrice = '0.00';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionCreateAction.php:93:                $totalHighPrice = bcadd($totalHighPrice, $agg['high_total'], 2);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionCreateAction.php:100:            $Instruction->setHighTotalPrice($totalHighPrice);
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:11975:	 (4731,4315,1,1,60,286,1,NULL,'シミック連合にとって、紋章は名誉を示すものではなく商標である。この見慣れたシンボルはあらゆる生物学的な消耗品につけられていて、卓絶した技術と独創的な革新と高額な値段を意味している。','For the Simic Combine, its sigil serves not as an emblem of honor but as a trademark. Its familiar image on any biological commodity attests to superb craftsmanship, ingenious innovation, and higher cost.','{1}, {Tap}：{Green}{Blue}を加える。','{1}, {Tap}: Add {Green}{Blue}.','','','166',0,false,0,'2018-06-07 05:13:43+09','2025-07-31 20:49:29+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:58180:	 (29352,4315,1,1,121,334,1,NULL,'シミック連合にとって、紋章は名誉を示すものではなく商標である。この見慣れたシンボルはあらゆる生物学的な消耗品につけられていて、卓絶した技術と独創的な革新と高額な値段を意味している。','For the Simic Combine, its sigil serves not as an emblem of honor but as a trademark. Its familiar image on any biological commodity attests to superb craftsmanship, ingenious innovation, and higher cost.','{1}, {Tap}：{Green}{Blue}を加える。','{1}, {Tap}: Add {Green}{Blue}.','','','258',0,false,0,'2018-07-26 03:08:17+09','2025-07-31 20:49:29+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:59979:	 (30053,4315,1,1,149,334,1,NULL,'シミック連合にとって、紋章は名誉を示すものではなく商標である。この見慣れたシンボルはあらゆる生物学的な消耗品につけられていて、卓絶した技術と独創的な革新と高額な値段を意味している。','For the Simic Combine, its sigil serves not as an emblem of honor but as a trademark. Its familiar image on any biological commodity attests to superb craftsmanship, ingenious innovation, and higher cost.','{1}, {Tap}：{Green}{Blue}を加える。','{1}, {Tap}: Add {Green}{Blue}.','','','266',0,false,0,'2018-07-27 04:43:22+09','2025-07-31 20:49:29+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:60933:	 (30399,4315,1,1,161,334,1,NULL,'シミック連合にとって、紋章は名誉を示すものではなく商標である。この見慣れたシンボルはあらゆる生物学的な消耗品につけられていて、卓絶した技術と独創的な革新と高額な値段を意味している。','For the Simic Combine, its sigil serves not as an emblem of honor but as a trademark. Its familiar image on any biological commodity attests to superb craftsmanship, ingenious innovation, and higher cost.','{1}, {Tap}：{Green}{Blue}を加える。','{1}, {Tap}: Add {Green}{Blue}.','','','270',0,false,0,'2018-07-27 21:57:09+09','2025-07-31 20:49:29+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:63332:	 (31303,4315,1,1,98,286,1,NULL,'シミック連合にとって、紋章は名誉を示すものではなく商標である。この見慣れたシンボルはあらゆる生物学的な消耗品につけられていて、卓絶した技術と独創的な革新と高額な値段を意味している。','For the Simic Combine, its sigil serves not as an emblem of honor but as a trademark. Its familiar image on any biological commodity attests to superb craftsmanship, ingenious innovation, and higher cost.','{1}, {Tap}：{Green}{Blue}を加える。','{1}, {Tap}: Add {Green}{Blue}.','','','259',0,false,0,'2018-08-04 01:17:53+09','2025-07-31 20:49:29+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:67232:	 (32961,4315,1,1,169,334,1,NULL,'シミック連合にとって、紋章は名誉を示すものではなく商標である。この見慣れたシンボルはあらゆる生物学的な消耗品につけられていて、卓絶した技術と独創的な革新と高額な値段を意味している。','For the Simic Combine, its sigil serves not as an emblem of honor but as a trademark. Its familiar image on any biological commodity attests to superb craftsmanship, ingenious innovation, and higher cost.','{1}, {Tap}：{Green}{Blue}を加える。','{1}, {Tap}: Add {Green}{Blue}.','','','229',0,false,0,'2018-08-22 02:31:32+09','2025-07-31 20:49:29+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:75782:	 (38267,4315,1,2,164,334,1,NULL,'シミック連合にとって、紋章は名誉を示すものではなく商標である。この見慣れたシンボルはあらゆる生物学的な消耗品につけられていて、卓絶した技術と独創的な革新と高額な値段を意味している。','For the Simic Combine, its sigil serves not as an emblem of honor but as a trademark. Its familiar image on any biological commodity attests to superb craftsmanship, ingenious innovation, and higher cost.','{1}, {Tap}：{Green}{Blue}を加える。','{1}, {Tap}: Add {Green}{Blue}.','','','227',0,false,0,'2018-11-06 20:48:33+09','2025-07-31 20:49:29+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:81747:	 (41175,4315,1,2,201,334,1,NULL,'シミック連合にとって、紋章は名誉を示すものではなく商標である。この見慣れたシンボルはあらゆる生物学的な消耗品につけられていて、卓絶した技術と独創的な革新と高額な値段を意味している。','For the Simic Combine, its sigil serves not as an emblem of honor but as a trademark. Its familiar image on any biological commodity attests to superb craftsmanship, ingenious innovation, and higher cost.','{1}, {Tap}：{Green}{Blue}を加える。','{1}, {Tap}: Add {Green}{Blue}.','','','130',0,false,0,'2019-03-11 23:12:58+09','2025-07-31 20:49:29+09'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:457:                    AND pc.high_price_code IS NULL -- 移植元のネット買取の結合仕様に合わせている
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/Subscriber/PurchaseQueryBuilderSubscriber.php:79:            ->andWhere($event->expr()->isNull('psc.high_price_code'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/Subscriber/SortSubscriber.php:285:            // createBaseQueryBuilder は p.id, l.id, pc.high_price_code のみのため、pc で一意の pc.id や
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPriceHistoryRepository.php:257:    AND pc2.high_price_code IS NULL
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPriceHistoryRepository.php:270:WHERE pc1.high_price_code IS NULL
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPriceHistoryRepository.php:344:    AND pc2.high_price_code IS NULL
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPriceHistoryRepository.php:348:WHERE pc1.high_price_code IS NULL
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/Subscriber/BaseQueryBuilderSubscriber.php:30:    // 商品検索では【商品ID】【言語】【高額商品コード】でグループ化して商品を表示する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/Subscriber/BaseQueryBuilderSubscriber.php:34:    // 1. 【商品ID】【言語】【高額商品コード】のみを検索する（→ createQueryBuilderForId）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/Subscriber/BaseQueryBuilderSubscriber.php:53:                'pc.high_price_code AS sk_hpc',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/Subscriber/BaseQueryBuilderSubscriber.php:112:                    $qb->expr()->isNull('pc.high_price_code')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/Subscriber/BaseQueryBuilderSubscriber.php:120:                    $qb->expr()->eq('pc.high_price_code', ":highPriceCode{$index}")
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/Subscriber/BaseQueryBuilderSubscriber.php:192:        //     CASE WHEN foo.high_price_code IS NULL THEN '' ELSE foo.high_price_code END
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/Subscriber/BaseQueryBuilderSubscriber.php:198:            .'CASE WHEN $1.high_price_code IS NULL THEN \'\' ELSE $1.high_price_code END)'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/Subscriber/BaseQueryBuilderSubscriber.php:246:            ->addGroupBy('pc.high_price_code');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/Subscriber/BaseQueryBuilderSubscriber.php:280:                'highPriceCode' => $row['highPriceCode'] ?? $row['high_price_code'] ?? null,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/Subscriber/PriceRangeSubscriber.php:66:                    $event->expr()->isNotNull('psc.high_price_code')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/Subscriber/PriceRangeSubscriber.php:93:                    $event->expr()->isNotNull('psc.high_price_code')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/CustomerCsvUpdateAction.php:31:    private DtbCsvCsvExtensionRepository $csvCsvExtensionRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/CustomerCsvUpdateAction.php:32:    private CsvRepository $csvRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/CustomerCsvUpdateAction.php:33:    private CsvExtensionEntityManager $csvExtensionEntityManager;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/CustomerCsvUpdateAction.php:34:    private CsvCsvExtensionEntityManager $csvCsvExtensionEntityManager;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/CustomerCsvUpdateAction.php:38:        DtbCsvCsvExtensionRepository $csvCsvExtensionRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/CustomerCsvUpdateAction.php:39:        CsvRepository $csvRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/CustomerCsvUpdateAction.php:40:        CsvExtensionEntityManager $csvExtensionEntityManager,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/CustomerCsvUpdateAction.php:41:        CsvCsvExtensionEntityManager $csvCsvExtensionEntityManager,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/CustomerCsvUpdateAction.php:44:        $this->csvCsvExtensionRepository = $csvCsvExtensionRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/CustomerCsvUpdateAction.php:45:        $this->csvRepository = $csvRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/CustomerCsvUpdateAction.php:46:        $this->csvExtensionEntityManager = $csvExtensionEntityManager;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/CustomerCsvUpdateAction.php:47:        $this->csvCsvExtensionEntityManager = $csvCsvExtensionEntityManager;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/CustomerCsvUpdateAction.php:65:            $this->csvExtensionEntityManager->save(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/CustomerCsvUpdateAction.php:74:                $this->csvCsvExtensionRepository->deleteByCsvExtensionId($CsvExtension->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/CustomerCsvUpdateAction.php:77:            $csvIds = isset($requestData['csv_output']) ? $requestData['csv_output'] : [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/CustomerCsvUpdateAction.php:78:            $Csvs = $this->csvRepository->findBy(['id' => $csvIds]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/CustomerCsvUpdateAction.php:82:                $this->csvCsvExtensionEntityManager->save($CsvCsvExtension, $CsvExtension, $Csv, $key);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/detail.twig:304:                           高額商品はそのまま、通常商品は全カード状態(NM/SP/MP/HP)に展開。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/summary.twig:122:                                        <button type="submit" id="result_list_main__csv_menu" class="btn btn-primary btn-sm">CSVダウンロード</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:512:                    AND pc.high_price_code IS NULL
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:593:                AND pc.high_price_code IS NULL
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:173:                    alert("{{ 'admin.stock.move_transfer.barcode_csv_export.no_selection'|trans|e('js') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:178:                const $form = $('#form_stock_move_transfer_barcode_csv');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:199:                    alert("{{ 'admin.stock.move_transfer.return_list_csv_export.no_selection'|trans|e('js') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:204:                const $form = $('#form_stock_move_transfer_return_list_csv');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:225:                    alert("{{ 'admin.stock.move_transfer.return_list_csv_export.no_selection'|trans|e('js') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:325:            const $approvalDepartmentSelect = $('#stock_transfer_csv_import_approval_department');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:326:            const $approvalNotificationTargetMembersSelect = $('#stock_transfer_csv_import_approval_notification_target_members');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:327:            const $stockTransferTargetBaseSelect = $('#stock_transfer_csv_import_transfer_base_info');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:485:                        <span class="card-title">{{ 'admin.stock.move_transfer.csv_file_registration'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:489:                            <button type="button" class="btn btn-ec-conversion" data-bs-toggle="modal" data-bs-target="#stockMoveCsvRegisterModal">{{ 'admin.stock.move_transfer.csv_register_move'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:490:                            <button type="button" class="btn btn-ec-conversion" data-bs-toggle="modal" data-bs-target="#stockTransferCsvRegisterModal">{{ 'admin.stock.move_transfer.csv_register_transfer'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:652:                            <button type="button" class="btn btn-ec-conversion" id="stockMoveTransferBarcodeCsvExport">{{ 'admin.stock.move_transfer.action_barcode_csv_export'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:653:                            <a href="{{ path('admin_stock_move_transfer_csv_export') }}" class="btn btn-ec-conversion">{{ 'admin.stock.move_transfer.action_move_transfer_csv_export'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:654:                            <button type="button" class="btn btn-ec-conversion" id="stockMoveTransferReturnListCsvExport">{{ 'admin.stock.move_transfer.action_return_list_csv_export'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:800:    <div class="modal fade stock-move-csv-modal" id="stockMoveCsvRegisterModal" tabindex="-1" aria-labelledby="stockMoveCsvRegisterModalLabel" aria-hidden="true">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:804:                    <h5 class="modal-title fw-bold" id="stockMoveCsvRegisterModalLabel">{{ 'admin.stock.move_transfer.csv_register_move'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:809:                        action: path('admin_stock_move_transfer_move_csv_import'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:831:                                    {{ 'admin.stock.move_transfer.csv_move_modal.move_from_stock_location'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:838:                                    {{ 'admin.stock.move_transfer.csv_move_modal.move_to_stock_location'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:846:                                {{ 'admin.common.csv_select'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:847:                                <span class="text-muted small ms-1">{{ 'admin.stock.move_transfer.csv_move_modal.file_row_limit_hint'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:852:                                {{ form_widget(stockMoveCsvImportForm.import_file, { attr: { class: 'd-none', accept: 'text/csv,.csv,text/plain' } }) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:864:                        <span class="fw-bold">{{ 'admin.common.csv_format'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:865:                        <a class="btn btn-ec-regular" href="{{ path('admin_stock_move_transfer_move_csv_template') }}">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:873:                            <td class="align-middle">{{ 'admin.stock.move_transfer.csv_move_modal.col_product_code_hint'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:879:                            <td class="align-middle">{{ 'admin.stock.move_transfer.csv_move_modal.col_move_quantity_hint'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:892:    <div class="modal fade stock-transfer-csv-modal" id="stockTransferCsvRegisterModal" tabindex="-1" aria-labelledby="stockTransferCsvRegisterModalLabel" aria-hidden="true">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:896:                    <h5 class="modal-title fw-bold" id="stockTransferCsvRegisterModalLabel">{{ 'admin.stock.move_transfer.csv_register_transfer'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:901:                        action: path('admin_stock_move_transfer_transfer_csv_import'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:907:                                    {{ 'admin.stock.move_transfer.csv_transfer_modal.store'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:917:                                    {{ 'admin.stock.move_transfer.csv_transfer_modal.transfer_from_stock_location'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:937:                                    <label class="form-label" for="{{ stockTransferCsvImportForm.approval_notification_target_members.vars.id }}">{{ 'admin.stock.move_transfer.csv_transfer_modal.member'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:944:                                {{ 'admin.common.csv_select'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:945:                                <span class="text-muted small ms-1">{{ 'admin.stock.move_transfer.csv_move_modal.file_row_limit_hint'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:950:                                {{ form_widget(stockTransferCsvImportForm.import_file, { attr: { class: 'd-none', accept: 'text/csv,.csv,text/plain' } }) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:961:                        <span class="fw-bold">{{ 'admin.common.csv_format'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:962:                        <a class="btn btn-ec-regular" href="{{ path('admin_stock_move_transfer_transfer_csv_template') }}">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:968:                                {{ 'admin.stock.move_transfer.csv_transfer_modal.col_src_product_code'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:970:                            <td class="align-middle">{{ 'admin.stock.move_transfer.csv_transfer_modal.col_src_product_code_hint'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:974:                                {{ 'admin.stock.move_transfer.csv_transfer_modal.col_dest_product_code'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:976:                            <td class="align-middle">{{ 'admin.stock.move_transfer.csv_transfer_modal.col_dest_product_code_hint'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:980:                                {{ 'admin.stock.move_transfer.csv_transfer_modal.col_transfer_quantity'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:982:                            <td class="align-middle">{{ 'admin.stock.move_transfer.csv_transfer_modal.col_transfer_quantity_hint'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:997:    <form id="form_stock_move_transfer_barcode_csv" method="post" action="{{ url('admin_stock_move_transfer_barcode_csv_export') }}" class="d-none">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:1000:    <form id="form_stock_move_transfer_return_list_csv" method="post" action="{{ url('admin_stock_move_transfer_return_list_csv_export') }}" class="d-none">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:130:                                                        {{ 'admin.stock.move_instruction.csv_download_invoice'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:102:                        <button type="button" class="btn btn-ec-conversion me-2" data-bs-toggle="modal" data-bs-target="#modalSplitCsv">{{ 'admin.stock.split_join.split_csv_register'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:103:                        <button type="button" class="btn btn-ec-conversion" data-bs-toggle="modal" data-bs-target="#modalJoinCsv">{{ 'admin.stock.split_join.join_csv_register'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:292:                                    <a href="{{ url('admin_stock_split_join_csv_export') }}" class="btn btn-ec-conversion">{{ 'admin.stock.split_join.csv_export'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:424:                    <h5 class="modal-title fw-bold" id="modalSplitCsvLabel">{{ 'admin.stock.split_join.split_csv_register'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:429:                    {% include '@admin/Stock/stock_split_csv_modal_body.twig' with splitCsvModal|merge({ split_csv_list_import_url: url('admin_stock_split_join_list_split_csv_import') }) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:444:                    <h5 class="modal-title fw-bold" id="modalJoinCsvLabel">{{ 'admin.stock.split_join.join_csv_register'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:449:                    {% include '@admin/Stock/stock_join_csv_modal_body.twig' with joinCsvModal|merge({ join_csv_list_import_url: url('admin_stock_split_join_list_join_csv_import') }) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:474:                        const nativeSelect = document.getElementById('admin_stock_split_csv_upload_approval_notification_target_members');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:502:                    let form = document.getElementById('form-stock-split-csv-upload');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:513:                const storeSelect = document.getElementById('admin_stock_split_csv_upload_store');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:526:                    let span = modalSplitCsv.querySelector('.js-csv-file-name');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:527:                    if (span) span.textContent = e.target.files && e.target.files.length ? e.target.files[0].name : '{{ 'admin.stock.split_csv_modal.no_file_selected'|trans }}';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:530:                    let spanJ = modalJoinCsv.querySelector('.js-csv-file-name');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:531:                    if (spanJ) spanJ.textContent = e.target.files && e.target.files.length ? e.target.files[0].name : '{{ 'admin.stock.split_csv_modal.no_file_selected'|trans }}';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:16:#result_list__custom_csv_menu .dropdown-menu.show {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:181:                                <li id="result_list__custom_csv_menu" class="dropdown">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:186:                                        <li><a href="#" class="dropdown-item export-link" data-type="otc_buy_order_restock_list_csv">戻しリストCSV</a></li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/history.twig:16:#result_list__custom_csv_menu .dropdown-menu.show {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/history.twig:186:                                <li id="result_list__custom_csv_menu" class="dropdown">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:3:{% set menus = ['product', 'section_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:5:{% block title %}{{ 'admin.product.department_csv_upload'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:43:                $('#admin_csv_import_import_file').click();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:44:                $('#admin_csv_import_import_file').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:47:                        $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:60:                        <div class="d-inline-block" data-tooltip="true" data-placement="top" title="{{ 'tooltip.section.csv_upload'|trans }}"><span>{{ 'admin.common.csv_upload'|trans }}</span><i class="fa fa-question-circle fa-lg fa-lg ml-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:62:                    <div id="ex-csv_category-upload" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:64:                            <div class="col-2"><span>{{ 'admin.common.csv_select'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:66:                                <form id="upload-form" method="post" action="{{ url('admin_product_department_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:70:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:71:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,text/tsv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:88:                                <div class="d-inline-block" data-tooltip="true" data-placement="top" title="{{ 'tooltip.section.csv_format'|trans }}"><span class="align-middle">{{ 'admin.common.csv_format'|trans }}</span><i class="fa fa-question-circle fa-lg fa-lg ml-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:91:                                <a href="{{ url('admin_product_csv_template', {'type': 'department'}) }}" class="btn btn-ec-regular" id="download-button">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:95:                    <div id="ex-csv_section-format" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:13:{% set menus = ['order', 'admin_shipping_result_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:24:                $('#admin_csv_import_import_file').click();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:25:                $('#admin_csv_import_import_file').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:28:                        $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:45:                <form id="upload-form" method="post" action="{{ url('admin_shipping_result_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:46:                    <div id="ex-csv_product_card-upload" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:48:                            <div class="col-2"><span>{{ 'admin.common.csv_select'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:53:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:54:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,text/tsv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_new_destination_csv_modal.twig:1:{% include '@admin/Stock/stock_split_destination_csv_modal.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/storage_code.twig:24:        .btn-csv {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/storage_code.twig:57:                                <a href="{{ path('admin_product_storage_code') }}" class="btn btn-primary btn-csv ml-2">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/storage_code.twig:61:                            <a href="{{ path('admin_product_storage_code_export') }}" class="btn btn-primary btn-csv mr-1">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/storage_code.twig:62:                                {{ 'admin.product.csv.export'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/storage_code.twig:64:                            <a href="{{ path('admin_product_storage_code_csv') }}" class="btn btn-primary btn-csv">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/storage_code.twig:65:                                {{ 'admin.product.csv.import'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:13:{% set menus = ['order', 'shipping_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:15:{% block title %}{{ 'admin.order.shipping_csv_upload'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:51:                $('#admin_csv_import_import_file').click();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:52:                $('#admin_csv_import_import_file').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:55:                        $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:70:                        <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.shipping.csv_upload'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:71:                            <span>{{'admin.common.csv_upload'|trans}}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:78:                                <span>{{ 'admin.common.csv_select'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:82:                                <form id="upload-form" method="post" action="{{ url('admin_shipping_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:86:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:87:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,text/tsv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:105:                                <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.shipping.csv_format'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:106:                                    <span class="align-middle">{{ 'admin.common.csv_format'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:112:                                <a id="download-button" class="btn btn-ec-regular" href="{{ url('admin_shipping_csv_template') }}">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:13:{% set menus = ['product', 'product_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:15:{% block title %}{{ 'admin.product.product_csv_upload'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:27:                    $('.modal-body p', modal).text("{{ 'admin.common.csv_upload_in_progress'|trans }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:57:                            url: '{{ url('admin_product_csv_split') }}',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:85:                            url: '{{ url('admin_product_csv_split_import') }}',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:88:                                file_name: file_name + current + '.csv',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:90:                                force_file_to_db: $('#admin_csv_import_force_file_to_db').prop('checked')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:127:                                    files.push(file_name + i + '.csv')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:130:                                    $.post('{{ url('admin_product_csv_split_cleanup') }}', { files: files })
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:149:                        $('.modal-body p', modal).text("{{ 'admin.common.csv_upload_error'|trans }}")
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:164:                        $('.modal-body p', modal).text("{{ 'admin.common.csv_upload_complete'|trans }}")
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:198:                $('#admin_csv_import_import_file').click();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:199:                $('#admin_csv_import_import_file').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:202:                        $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:217:                        <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.product.csv_upload'|trans }}"><span>{{ 'admin.common.csv_upload'|trans }}</span><i class="fa fa-question-circle fa-lg fa-lg ms-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:219:                    <div id="ex-csv_product-upload" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:221:                            <div class="col-2"><span>{{ 'admin.common.csv_select'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:223:                                <form id="upload-form" method="post" action="{{ url('admin_product_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:227:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:228:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,text/tsv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:252:                                <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.product.csv_format'|trans }}"><span class="align-middle">{{ 'admin.common.csv_format'|trans }}</span><i class="fa fa-question-circle fa-lg fa-lg ms-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:255:                                <a href="{{ url('admin_product_csv_template', {'type': 'product'}) }}" class="btn btn-ec-regular" id="download-button">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:259:                    <div id="ex-csv_product-format" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:287:                    <h5 class="modal-title fw-bold">{{ 'admin.product.product_csv_upload__title'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:292:                    <p class="text-start">{{ 'admin.product.product_csv_upload__message'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:3:  オプション: split_destination_csv_modal_id, split_destination_csv_upload_url, split_destination_csv_template_url,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:4:  split_destination_csv_csrf, split_destination_csv_reload（編集時 true でアップロード成功後にリロード）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:6:{% if split_destination_csv_modal_id is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:7:    {% set sdp_modal_id = split_destination_csv_modal_id %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:11:{% if split_destination_csv_modal_label_id is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:12:    {% set sdp_label_id = split_destination_csv_modal_label_id %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:16:{% if split_destination_csv_form_id is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:17:    {% set sdp_form_id = split_destination_csv_form_id %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:19:    {% set sdp_form_id = 'form-split-new-destination-csv' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:21:{% if split_destination_csv_file_id is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:22:    {% set sdp_file_id = split_destination_csv_file_id %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:24:    {% set sdp_file_id = 'split-new-destination-csv-file' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:26:{% if split_destination_csv_submit_id is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:27:    {% set sdp_submit_id = split_destination_csv_submit_id %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:29:    {% set sdp_submit_id = 'btn-split-new-destination-csv-submit' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:31:{% if split_destination_csv_error_id is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:32:    {% set sdp_err_id = split_destination_csv_error_id %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:34:    {% set sdp_err_id = 'split-new-destination-csv-error' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:36:{% if split_destination_csv_upload_url is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:37:    {% set sdp_upload = split_destination_csv_upload_url %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:39:    {% set sdp_upload = url('admin_stock_split_new_destination_csv_upload', { productStockId: ProductStock.id }) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:41:{% if split_destination_csv_template_url is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:42:    {% set sdp_template = split_destination_csv_template_url %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:44:    {% set sdp_template = url('admin_stock_split_new_destination_csv_template') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:46:{% if split_destination_csv_csrf is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:47:    {% set sdp_csrf = split_destination_csv_csrf %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:49:    {% set sdp_csrf = csrf_token('stock_split_new_destination_csv') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:51:{% set sdp_reload = split_destination_csv_reload|default(false) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:57:                <h5 class="modal-title fw-bold" id="{{ sdp_label_id }}">{{ 'admin.stock.split.new_destination_csv_modal.title'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:61:                <p class="text-muted small mb-3">{{ 'admin.stock.split.new_destination_csv_modal.note'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:62:                <form id="{{ sdp_form_id }}" method="post" action="{{ sdp_upload }}" enctype="multipart/form-data" data-split-csv-reload="{{ sdp_reload ? '1' : '0' }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:65:                        <label class="form-label fw">{{ 'admin.stock.split.new_destination_csv_modal.csv_file'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:68:                            <span class="js-split-csv-file-name text-muted small">{{ 'admin.stock.split.new_destination_csv_modal.no_file_selected'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:69:                            <input type="file" name="import_file" id="{{ sdp_file_id }}" class="d-none" accept=".csv,text/csv,text/plain">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:73:                        <button type="submit" class="btn btn-ec-conversion" id="{{ sdp_submit_id }}">{{ 'admin.stock.split.new_destination_csv_modal.product_register'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:78:                    <span class="form-label fw d-block mb-0">{{ 'admin.common.csv_format'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:79:                    <a href="{{ sdp_template }}" class="btn btn-ec-regular">{{ 'admin.stock.split.new_destination_csv_modal.template_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:84:                            <td class="table-light w-25">{{ 'admin.stock.split.new_destination_csv_modal.format_product_code'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:85:                            <td class="text-muted small">{{ 'admin.stock.split.new_destination_csv_modal.format_product_code_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:88:                            <td class="table-light">{{ 'admin.stock.split.new_destination_csv_modal.format_destination_qty'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:89:                            <td class="text-muted small">{{ 'admin.stock.split.new_destination_csv_modal.format_destination_qty_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:100:                    const nameEl = document.querySelector('#{{ sdp_modal_id }} .js-split-csv-file-name');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:13:{% set menus = ['product', 'class_category_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:15:{% block title %}{{ 'admin.product.class_category_csv_upload'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:53:                $('#admin_csv_import_import_file').click();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:54:                $('#admin_csv_import_import_file').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:57:                        $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:70:                        <div class="d-inline-block" data-tooltip="true" data-placement="top" title="{{ 'tooltip.class_category.csv_upload'|trans }}"><span>{{ 'admin.common.csv_upload'|trans }}</span><i class="fa fa-question-circle fa-lg fa-lg ml-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:72:                    <div id="ex-csv_category-upload" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:74:                            <div class="col-2"><span>{{ 'admin.common.csv_select'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:76:                                <form id="upload-form" method="post" action="{{ url('admin_product_class_category_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:80:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:81:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,text/tsv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:98:                                <div class="d-inline-block" data-tooltip="true" data-placement="top" title="{{ 'tooltip.class_category.csv_format'|trans }}"><span class="align-middle">{{ 'admin.common.csv_format'|trans }}</span><i class="fa fa-question-circle fa-lg fa-lg ml-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:101:                                <a href="{{ url('admin_product_csv_template', {'type': 'class_category'}) }}" class="btn btn-ec-regular" id="download-button">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:105:                    <div id="ex-csv_class_name-format" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:113:            const $shortageCsvForm = $('#form-move-shortage-csv');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:114:            const $shortageCsvErr = $('#move-shortage-csv-error');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:371:                                    <a href="{{ url('admin_stock_move_outbound_approval_request_csv_export', { id: StockMoveTransfer.id }) }}" class="btn btn-ec-conversion me-2">{{ 'admin.stock.move.csv_output'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:372:                                    <button type="button" class="btn btn-ec-conversion me-2" data-bs-toggle="modal" data-bs-target="#moveShortageCsvModal">{{ 'admin.stock.move.shortage_csv_register'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:564:                                <h5 class="modal-title fw-bold" id="moveShortageCsvModalLabel">{{ 'admin.stock.move.shortage_csv_register'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:568:                                <form id="form-move-shortage-csv"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:570:                                      action="{{ url('admin_stock_move_shortage_csv_import', { id: StockMoveTransfer.id }) }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:572:                                    <input type="hidden" name="_token" value="{{ csrf_token('stock_move_shortage_csv') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:573:                                    <p class="text-muted small mb-3">{{ 'admin.stock.move.shortage_csv_modal.note'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:575:                                        <label class="form-label fw">{{ 'admin.stock.move.shortage_csv_modal.csv_file'|trans }} ({{ 'admin.stock.move.shortage_csv_modal.csv_file_limit'|trans }})<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:577:                                            <input type="file" name="import_file" id="move-shortage-csv-file" class="form-control form-control-sm" accept=".csv,text/csv,text/plain">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:581:                                        <button type="submit" class="btn btn-ec-conversion" id="btn-move-shortage-csv-submit">{{ 'admin.stock.move.shortage_csv_register'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:586:                                    <span class="form-label fw d-block mb-0">{{ 'admin.common.csv_format'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:591:                                            <td class="table-light w-25">{{ 'admin.stock.move.shortage_csv_modal.format_product_code'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:592:                                            <td class="text-muted small">{{ 'admin.stock.move.shortage_csv_modal.format_product_code_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:595:                                            <td class="table-light">{{ 'admin.stock.move.shortage_csv_modal.format_product_name'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:596:                                            <td class="text-muted small">{{ 'admin.stock.move.shortage_csv_modal.format_product_name_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:599:                                            <td class="table-light">{{ 'admin.stock.move.shortage_csv_modal.format_move_qty'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:600:                                            <td class="text-muted small">{{ 'admin.stock.move.shortage_csv_modal.format_move_qty_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:603:                                            <td class="table-light">{{ 'admin.stock.move.shortage_csv_modal.format_shortage_qty'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:604:                                            <td class="text-muted small">{{ 'admin.stock.move.shortage_csv_modal.format_shortage_qty_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:608:                                <p class="text-danger small mt-2 mb-0" id="move-shortage-csv-error" style="display:none;"></p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_goods.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_goods.twig:3:{% set menus = ['product', 'product_csv_management', 'product_goods_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_goods.twig:5:{% block sub_title %}{{ 'admin.product.product_goods_csv_upload'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:4:{% if join_source_csv_modal_id is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:5:    {% set jm_id = join_source_csv_modal_id %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:9:{% if join_source_csv_modal_label_id is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:10:    {% set jm_label_id = join_source_csv_modal_label_id %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:14:{% if join_source_csv_form_id is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:15:    {% set jm_form_id = join_source_csv_form_id %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:17:    {% set jm_form_id = 'form-join-new-source-csv' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:19:{% if join_source_csv_file_id is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:20:    {% set jm_file_id = join_source_csv_file_id %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:22:    {% set jm_file_id = 'join-new-source-csv-file' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:24:{% if join_source_csv_submit_id is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:25:    {% set jm_submit_id = join_source_csv_submit_id %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:27:    {% set jm_submit_id = 'btn-join-new-source-csv-submit' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:29:{% if join_source_csv_error_id is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:30:    {% set jm_err_id = join_source_csv_error_id %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:32:    {% set jm_err_id = 'join-new-source-csv-error' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:34:{% if join_source_csv_upload_url is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:35:    {% set jm_upload = join_source_csv_upload_url %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:37:    {% set jm_upload = url('admin_stock_join_new_source_csv_upload', { productStockId: ProductStock.id }) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:39:{% if join_source_csv_template_url is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:40:    {% set jm_template = join_source_csv_template_url %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:42:    {% set jm_template = url('admin_stock_join_new_source_csv_template') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:44:{% if join_source_csv_csrf is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:45:    {% set jm_csrf = join_source_csv_csrf %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:47:    {% set jm_csrf = csrf_token('stock_join_new_source_csv') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:49:{% set jm_reload = join_source_csv_reload|default(false) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:55:                <h5 class="modal-title fw-bold" id="{{ jm_label_id }}">{{ 'admin.stock.join.new_source_csv_modal.title'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:59:                <p class="text-muted small mb-3">{{ 'admin.stock.join.new_source_csv_modal.note'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:60:                <form id="{{ jm_form_id }}" method="post" action="{{ jm_upload }}" enctype="multipart/form-data" data-join-csv-reload="{{ jm_reload ? '1' : '0' }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:63:                        <label class="form-label fw">{{ 'admin.stock.join.new_source_csv_modal.csv_file'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:66:                            <span class="js-join-csv-file-name text-muted small">{{ 'admin.stock.join.new_source_csv_modal.no_file_selected'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:67:                            <input type="file" name="import_file" id="{{ jm_file_id }}" class="d-none" accept=".csv,text/csv,text/plain">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:71:                        <button type="submit" class="btn btn-ec-conversion" id="{{ jm_submit_id }}">{{ 'admin.stock.join.new_source_csv_modal.product_register'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:76:                    <span class="form-label fw d-block mb-0">{{ 'admin.common.csv_format'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:77:                    <a href="{{ jm_template }}" class="btn btn-ec-regular">{{ 'admin.stock.join.new_source_csv_modal.template_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:82:                            <td class="table-light w-25">{{ 'admin.stock.join.new_source_csv_modal.format_product_code'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:83:                            <td class="text-muted small">{{ 'admin.stock.join.new_source_csv_modal.format_product_code_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:86:                            <td class="table-light">{{ 'admin.stock.join.new_source_csv_modal.format_join_qty'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:87:                            <td class="text-muted small">{{ 'admin.stock.join.new_source_csv_modal.format_join_qty_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:98:                    const nameEl = document.querySelector('#{{ jm_id }} .js-join-csv-file-name');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/section.twig:24:        .btn-csv {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/section.twig:40:                                <a href="{{ path('admin_product_section') }}" class="btn btn-primary btn-csv ml-2">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/section.twig:44:                            <a href="{{ path('admin_product_section_export') }}" class="btn btn-primary btn-csv mr-1">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/section.twig:45:                                {{ 'admin.product.csv.export'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/section.twig:47:                            <a href="{{ path('admin_product_section_master_csv_upload') }}" class="btn btn-primary btn-csv">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/section.twig:48:                                {{ 'admin.product.csv.import'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/approval_list_line_items.twig:2:    <p class="text-danger mb-2">{{ 'admin.stock.approval_list.line_items.over_display_limit_csv_hint'|trans({'%max%': modalLineItemsDisplayMax}) }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/barcode_replacement_list.twig:11:    <form name="barcode_replacement_list_form" id="barcode_replacement_list_form" method="post" action="{{ url('admin_stock_barcode_replacement_list_csv_export') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/barcode_replacement_list.twig:39:                                        {{ 'admin.stock.barcode_replacement_list.csv_export'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/tag_sales_analysis.twig:24:        .btn-csv {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:118:            $('#page_count_pulldown, #display_pulldown, #csv_pulldown').on('change', function () {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:468:                                <button class="btn btn-ec-conversion px-5" type="submit" formaction="{{ url('admin_product_card_csv_export') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:469:                                    <span>{{ 'admin.product.card_csv_export'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:471:                                <button class="btn btn-ec-conversion px-5" type="submit" formaction="{{ url('admin_product_goods_csv_export') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:472:                                    <span>{{ 'admin.product.goods_csv_export'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:474:                                <button class="btn btn-ec-conversion px-5" type="submit" formaction="{{ url('admin_product_price_csv_export') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:475:                                    <span>{{ 'admin.product.sale_price_csv_export'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:512:                                        <select id="csv_pulldown" class="form-select" >
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:513:                                            <option value="">{{ 'admin.product.custom_csv_export'|trans }}</option>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:515:                                                <option value="{{ url('admin_product_all_csv_custom_export', { csvExtensionId: CsvEx.id }) }}">{{ CsvEx.name }}</option>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:517:                                            <option value="{{ url('admin_setting_shop_csv_custom', { csvTypeId: constant('Eccube\\Entity\\Master\\CsvType::CSV_TYPE_PRODUCT') }) }}">{{ 'admin.setting.shop.custom_csv_setting'|trans }}</option>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Form/stock_approval_notification_members_row.html.twig:5:{% block _admin_stock_split_csv_upload_approval_notification_target_members_row %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:208:                if (action.indexOf('csv_export') !== -1) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:209:                    $('#bulk_form_token').val($('#csv_export_token_value').val());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:226:            <a href="{{ url('admin_deck_csv_import') }}" class="btn btn-ec-conversion">{{ 'admin.deck.csv_import'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:401:        <input type="hidden" id="csv_export_token_value" value="{{ csrf_token('admin_deck_csv_export') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:404:                <button type="submit" id="csv_export" class="btn btn-ec-conversion" formaction="{{ url('admin_deck_csv_export') }}">{{ 'admin.deck.csv_export'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1136:                                            <button type="button" class="btn btn-ec-regular dropdown-menu-toggle" id="csvDownloadDropDown">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1138:                                                <span>{{ 'admin.common.csv_download'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1142:                                                    {{ 'admin.order.order_csv.download'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1145:                                                    {{ 'admin.order.shipping_csv.download'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1147:                                                <a class="dropdown-item" href="{{ url('admin_setting_shop_csv', { id : constant('\\Eccube\\Entity\\Master\\CsvType::CSV_TYPE_ORDER') }) }}" id="orderCsvSetting">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1148:                                                    {{ 'admin.order.order_csv.setting'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1150:                                                <a class="dropdown-item" href="{{ url('admin_setting_shop_csv', { id : constant('\\Eccube\\Entity\\Master\\CsvType::CSV_TYPE_SHIPPING') }) }}" id="shippingCsvSetting">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1151:                                                    {{ 'admin.order.shipping_csv.setting'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1159:                                                <span>{{ 'admin.order.custom_order_csv.download'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1163:                                                    <a class="dropdown-item" href="{{ url('admin_custom_export', {'csvExtensionId': CsvEx.id}) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1167:                                                <a class="dropdown-item" href="{{ url('admin_setting_shop_csv_custom', {'csvTypeId': constant('Eccube\\Entity\\Master\\CsvType::CSV_TYPE_ORDER') }) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1168:                                                    {{ 'admin.order.order.custom_csv.setting'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1176:                                                <span>{{ 'admin.order.custom_shipping_csv.download'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1180:                                                    <a class="dropdown-item" href="{{ url('admin_custom_export', {'csvExtensionId': CsvEx.id}) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1184:                                                <a class="dropdown-item" href="{{ url('admin_setting_shop_csv_custom', {'csvTypeId': constant('Eccube\\Entity\\Master\\CsvType::CSV_TYPE_SHIPPING') }) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1185:                                                    {{ 'admin.order.order.custom_csv.setting'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:5:{% block title %}{{ 'admin.deck.csv_upload_title'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:12:        .csv-format-card > .card-header {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:15:        .csv-format-table th:first-child,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:16:        .csv-format-table td:first-child {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:19:        .csv-format-table th:last-child,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:20:        .csv-format-table td:last-child {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:23:        .csv-format-table thead th {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:29:        .csv-format-scroll {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:33:        .csv-format-table {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:36:        .csv-format-table > tbody > tr > td {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:49:            var $fileInput = $('#admin_csv_import_import_file');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:58:                    $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:83:                        <span>{{ 'admin.deck.csv_upload_header'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:87:                            <div class="col-2"><span>{{ 'admin.common.csv_file_select'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:89:                                <form id="upload-form" method="post" action="{{ url('admin_deck_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:93:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:94:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,.csv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:97:                                    <button class="btn btn-ec-conversion" id="upload-button" type="submit" disabled>{{ 'admin.common.csv_upload'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:103:                <div class="card rounded border-0 mb-4 csv-format-card">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:105:                        <span>{{ 'admin.deck.csv_format_title'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:108:                        <div class="csv-format-scroll">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:109:                            <table class="table table-bordered csv-format-table mb-0">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:20:{% block import_file_accept %}.csv, text/csv, .tsv, text/tsv{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:43:                            <i class="fa fa-exclamation-triangle mr-2"></i>{{ 'admin.common.csv_import_error'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:58:                            <h4 class="card-title mb-0">{{ csv_box_title|trans }}</h4>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:74:                                {{ 'admin.common.csv_upload'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:82:                        <h4 class="card-title mb-0">{{ csv_format_title|trans }}</h4>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:83:                        <a href="{{ url(template_download_route, template_download_route_params|default({})) }}" class="btn btn-secondary" id="download-template-button">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:90:                                        <th class="w-50">{{ 'admin.common.csv_item_name'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:91:                                        <th>{{ 'admin.common.csv_description'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:99:                                                {% if csv_required_header_keys is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:100:                                                    {% if key in csv_required_header_keys %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:113:                {% include '@admin/Product/csv_import_history.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:13:{% set menus = ['setting', 'basic_info', 'shop_csv'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:15:{% block title %}{{ 'admin.setting.shop.csv_setting'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:25:                var tmp_select =  $('#csv-type[name="form[csv_type]"] option[selected]').val();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:26:                $('#csv-type[name="form[csv_type]"]').val(tmp_select);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:42:            $('#add').on('click', {from: 'csv-not-output', to: 'csv-output'}, add);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:43:            $('#add-all').on('click', {from: 'csv-not-output', to: 'csv-output'}, addAll);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:44:            $('#remove').on('click', {from: 'csv-output', to: 'csv-not-output'}, add);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:45:            $('#remove-all').on('click', {from: 'csv-output', to: 'csv-not-output'}, addAll);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:48:                var $op = $('#csv-output option:selected');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:56:                var $op = $('#csv-output option:selected');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:59:                    val == 'top' ? $op.prependTo('#csv-output') : $op.appendTo('#csv-output');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:63:            $('#csv-type').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:65:                var href = '{{ url('admin_setting_shop_csv') }}' + '/' + id;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:70:            $('#csv-form').submit(function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:71:                $('#csv-not-output').children().prop('selected', true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:72:                $('#csv-output').children().prop('selected', true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:79:    <form id="csv-form" method="post" action="{{ url('admin_setting_shop_csv', {'id': id}) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:86:                            <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.setting.shop.csv.csv_columns'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:87:                                <span>{{ 'admin.setting.shop.csv.csv_columns'|trans }}</span><i class="fa fa-question-circle fa-lg ms-1"></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:93:                                    <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.setting.shop.csv.csv_type'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:94:                                        <span>{{ 'admin.setting.shop.csv.csv_type'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:99:                                    {{ form_widget(form.csv_type, {'id': 'csv-type'}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:106:                                        <label for="FormControlSelect1">{{ 'admin.setting.shop.csv.non_output_colmuns'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:107:                                        {{ form_widget(form.csv_not_output, {'id': 'csv-not-output', 'attr': {'size': '30'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:112:                                        <div class="col text-center"><span>{{ 'admin.setting.shop.csv.operation'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:117:                                                                                                  aria-hidden="true"></i><span>&nbsp;{{ 'admin.setting.shop.csv.operation__output'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:124:                                                                                                     aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.operation__release'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:131:                                                        class="fa fa-arrow-circle-right" aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.operation__all_output'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:138:                                                                                                         aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.operation__all_release'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:145:                                        <label for="FormControlSelect2">{{ 'admin.setting.shop.csv.output_colmuns'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:146:                                        {{ form_widget(form.csv_output, {'id': 'csv-output', 'attr': {'size': '30'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:151:                                        <div class="col text-center"><span>{{ 'admin.setting.shop.csv.order'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:156:                                                                                                              aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.order__up'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:163:                                                                                                                aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.order__down'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:170:                                                                                                                    aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.order__top'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:177:                                                                                                                       aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.order__bottom'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/csv.twig:184:                            {{ 'admin.setting.shop.csv.how_to_use'|trans|nl2br }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_import_history.twig:6:                <h4 class="card-title mb-0">{{ 'admin.product.csv_import_history_title'|trans }}</h4>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_import_history.twig:24:                        <th class="text-nowrap">{{ 'admin.product.csv_import_history_filename'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_import_history.twig:25:                        <th class="text-nowrap">{{ 'admin.product.csv_import_history_upload_date'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_import_history.twig:26:                        <th class="text-nowrap">{{ 'admin.product.csv_import_history_operator'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_simple_high_price.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_simple_high_price.twig:3:{% set menus = ['product', 'product_csv_management', 'simple_high_price_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_simple_high_price.twig:5:{% block sub_title %}{{ 'admin.product.simple_high_price_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:3:{% set menus = ['setting', 'basic_info', 'custom_csv'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:5:{% block title %}{{ 'admin.setting.shop.custom_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:27:            $('#add').on('click', {from: 'csv-not-output', to: 'csv-output'}, add);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:28:            $('#add-all').on('click', {from: 'csv-not-output', to: 'csv-output'}, addAll);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:29:            $('#remove').on('click', {from: 'csv-output', to: 'csv-not-output'}, add);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:30:            $('#remove-all').on('click', {from: 'csv-output', to: 'csv-not-output'}, addAll);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:33:                const $op = $('#csv-output option:selected');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:41:                const $op = $('#csv-output option:selected');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:44:                    val == 'top' ? $op.prependTo('#csv-output') : $op.appendTo('#csv-output');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:48:            $('#csv-type').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:50:                const href = '{{ url('admin_setting_shop_csv_custom') }}' + '/' + id;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:54:            $('#admin_custom_csv_csv_extensions').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:55:                const csvTypeId = $('#csv-type').val();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:56:                let href = '{{ url('admin_setting_shop_csv_custom') }}' + '/' + csvTypeId;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:62:            $('#csv-form').submit(function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:63:                $('#csv-not-output').children().prop('selected', true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:64:                $('#csv-output').children().prop('selected', true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:79:    <form id="csv-form" method="post" action="{{ path('admin_setting_shop_csv_custom_update', {'csvTypeId': csvTypeId, 'csvExtensionId': csvExtensionId}) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:86:                            <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.setting.shop.csv.csv_columns'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:87:                                <span>{{ 'admin.setting.shop.csv.csv_columns'|trans }}</span><i class="fa fa-question-circle fa-lg ms-1"></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:93:                                    <span>{{ 'admin.setting.shop.csv.csv_type'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:97:                                    {{ form_widget(form.csv_type, {'id': 'csv-type'}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:103:                                    <span>{{ 'admin.setting.shop.custom_csv'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:106:                                    {{ form_widget(form.csv_extensions) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:112:                                    <span>{{ 'admin.setting.shop.csv.output_name'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:126:                                        <label for="FormControlSelect1">{{ 'admin.setting.shop.csv.non_output_colmuns'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:127:                                        {{ form_widget(form.csv_not_output, {'id': 'csv-not-output', 'attr': {'size': '30'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:132:                                        <div class="col text-center"><span>{{ 'admin.setting.shop.csv.operation'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:137:                                                                                                  aria-hidden="true"></i><span>&nbsp;{{ 'admin.setting.shop.csv.operation__output'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:144:                                                                                                     aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.operation__release'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:151:                                                        class="fa fa-arrow-circle-right" aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.operation__all_output'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:158:                                                                                                         aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.operation__all_release'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:165:                                        <label for="FormControlSelect2">{{ 'admin.setting.shop.csv.output_colmuns'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:166:                                        {{ form_widget(form.csv_output, {'id': 'csv-output', 'attr': {'size': '30'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:171:                                        <div class="col text-center"><span>{{ 'admin.setting.shop.csv.order'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:176:                                                                                                              aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.order__up'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:183:                                                                                                                aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.order__down'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:190:                                                                                                                aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.order__top'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:197:                                                                                                                aria-hidden="true"><span>&nbsp;{{ 'admin.setting.shop.csv.order__bottom'|trans }}</span></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:213:                            {% if csvExtensionId %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:217:                                   data-url="{{ path('admin_setting_shop_csv_custom_delete', {csvExtensionId: csvExtensionId}) }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/custom_csv.twig:248:                    <p class="text-start modal-message">{{ 'admin.setting.shop.csv.delete_modal__message'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig:42:                    <h3 class="c-primaryCol__title">{{ 'admin.product.storage_code_csv_upload_title'|trans }}</h3>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig:44:                        {{ 'admin.common.csv_back_to_list'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig:51:                            <i class="fa fa-exclamation-triangle mr-2"></i>{{ 'admin.common.csv_import_error'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig:67:                            <h4 class="card-title mb-0">{{ 'admin.common.csv_file_select'|trans }}</h4>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig:74:                                            {{ form_widget(form.import_file, {'attr': {'class': 'custom-file-input', 'accept': '.csv, text/csv, .tsv, text/tsv'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig:83:                                {{ 'admin.common.csv_upload'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig:91:                        <h4 class="card-title mb-0">{{ 'admin.product.storage_code_csv_format_title'|trans }}</h4>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig:92:                        <a href="{{ url('admin_product_storage_code_csv_template') }}" class="btn btn-ec-conversion" id="download-template-button">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig:110:                                                <br><small class="text-muted">{{ 'admin.common.csv_id_optional'|trans }}</small>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig:122:                            {{ 'admin.common.csv_export_guide'|trans({'%url%': path('admin_product_storage_code_export')})|raw }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_card_bulk.twig:11:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_card_bulk.twig:13:{% set menus = ['product', 'product_csv_management', 'product_card_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_card_bulk.twig:15:{% block title %}{{ 'admin.product.product_card_csv_upload_title'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_status.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_status.twig:3:{% set menus = ['product', 'product_csv_management', 'admin_product_status_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_status.twig:5:{% block sub_title %}{{ 'admin.product.product_status_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_shelf_number.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_shelf_number.twig:5:{% block sub_title %}{{ 'admin.product.product_shelf_number_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_shelf_number_update.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_shelf_number_update.twig:3:{% set menus = ['product', 'product_csv_management', 'shelf_number_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_shelf_number_update.twig:5:{% block sub_title %}{{ 'admin.product.product_shelf_number_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/index.twig:68:            <a href="{{ url('admin_archetype_csv_import') }}" class="btn btn-ec-conversion">{{ 'admin.archetype.csv_import'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:5:{% block title %}{{ 'admin.archetype.csv_upload_title'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:12:        .csv-format-card > .card-header {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:15:        .csv-format-table th:first-child,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:16:        .csv-format-table td:first-child {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:19:        .csv-format-table th:last-child,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:20:        .csv-format-table td:last-child {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:23:        .csv-format-table thead th {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:26:        .csv-format-table > tbody > tr > td {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:39:            var $fileInput = $('#admin_csv_import_import_file');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:48:                    $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:73:                        <span>{{ 'admin.archetype.csv_upload_header'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:77:                            <div class="col-2"><span>{{ 'admin.common.csv_file_select'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:79:                                <form id="upload-form" method="post" action="{{ url('admin_archetype_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:83:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:84:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,.csv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:87:                                    <button class="btn btn-ec-conversion" id="upload-button" type="submit" disabled>{{ 'admin.common.csv_upload'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:93:                <div class="card rounded border-0 mb-4 csv-format-card">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:95:                        <span>{{ 'admin.archetype.csv_format_title'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:98:                        <table class="table table-bordered csv-format-table mb-0">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/buy_sale_price_history.twig:249:                                <a href="{{ path('admin_product_buy_sale_price_history_export') }}" class="btn btn-ec-conversion">{{ 'admin.common.csv_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_tag_sales_analysis.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_tag_sales_analysis.twig:3:{% set menus = ['product', 'product_csv_management', 'product_tag_sales_analysis_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_tag_sales_analysis.twig:5:{% block sub_title %}{{ 'admin.product.tag_sales_analysis_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:38:"41","1",,"/order/shipping_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:39:"42","2",,"/order/shipping_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:40:"43","3",,"/order/shipping_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:41:"44","1",,"/product/product_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:42:"45","2",,"/product/product_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:43:"46","3",,"/product/product_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:44:"47","1",,"/product/class_name_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:45:"48","2",,"/product/class_name_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:46:"49","3",,"/product/class_name_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:47:"50","1",,"/product/class_category_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:48:"51","2",,"/product/class_category_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_authority_role.csv:49:"52","3",,"/product/class_category_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/ProductClass/edit.twig:467:                                        <span>{{ 'admin.product.high_price_code'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/ProductClass/edit.twig:471:                                            {{ form_widget(form.high_price_code) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/ProductClass/edit.twig:472:                                            {{ form_errors(form.high_price_code) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:1:- mtb_authority.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:2:- mtb_country.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:3:- mtb_csv_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:4:- mtb_customer_order_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:5:- mtb_customer_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:6:- mtb_device_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:7:- mtb_product_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:8:- mtb_job.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:9:- mtb_login_history_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:10:- mtb_order_item_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:11:- mtb_order_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:12:- mtb_order_status_color.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:13:- mtb_page_max.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:14:- mtb_pref.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:15:- mtb_product_list_max.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:16:- mtb_product_list_order_by.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:17:- mtb_sale_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:18:- mtb_sex.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:19:- mtb_shipping_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:20:- mtb_tax_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:21:- mtb_tax_display_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:22:- mtb_work.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:23:- dtb_tenant.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:24:- dtb_member.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:25:- dtb_tax_rule.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:26:- dtb_block.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:27:- dtb_page.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:28:- dtb_layout.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:29:- dtb_page_layout.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:30:- dtb_block_position.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:31:- dtb_authority_role.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:32:- dtb_base_info.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:33:- dtb_category.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:34:- dtb_tag.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:35:- dtb_class_name.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:36:- dtb_class_category.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:37:- dtb_csv.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:38:- dtb_customer.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:39:- dtb_customer_address.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:40:- dtb_customer_favorite_product.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:41:- dtb_delivery.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:42:- dtb_delivery_duration.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:43:- dtb_delivery_fee.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:44:- dtb_delivery_time.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:45:- dtb_mail_history.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:46:- dtb_mail_template.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:47:- dtb_news.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:48:- dtb_order.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:49:- dtb_payment.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:50:- dtb_payment_option.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:51:- dtb_plugin.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:52:- dtb_plugin_event_handler.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:53:- dtb_product.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:54:- dtb_product_category.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:55:- dtb_product_class.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:56:- dtb_product_image.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:57:- dtb_product_stock.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:58:- dtb_product_tag.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:59:- dtb_order_item.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:60:- dtb_shipping.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:61:- dtb_template.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:62:- dtb_tradelaw.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Purchase/PurchaseOrderSubmitAction.php:239:                $CartLineProductClass->getHighPriceCode(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:1:"id","csv_type_id","creator_id","entity_name","field_name","reference_field_name","disp_name","sort_no","enabled","create_date","update_date"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/index.twig:16:    #result_list_main__csv_menu .dropdown-menu.show,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/index.twig:352:                            <div id="result_list_main__csv_menu" class="dropdown d-inline-block">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/index.twig:354:                                    {{ 'admin.event.entry.csv_download'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/index.twig:358:                                        <a class="dropdown-item" href="{{ path('admin_event_entry_csv_export') }}">{{ 'admin.event.entry.csv_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/index.twig:361:                                        <a class="dropdown-item" href="{{ url('admin_setting_shop_csv', { id : constant('\\Eccube\\Entity\\Master\\CsvType::CSV_TYPE_EVENT_APPLICATION') }) }}">{{ 'admin.event.entry.csv_column_settings'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:5:{% block title %}{{ 'admin.event.entry.bulk_csv_upload_title'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:18:            const $fileInput = $('#admin_csv_import_import_file');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:27:                    $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:53:                        <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.event.entry.bulk_csv_upload'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:54:                            <span>{{ 'admin.common.csv_upload'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:61:                                <span>{{ 'admin.common.csv_file_select'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:64:                                <form id="upload-form" method="post" action="{{ url('admin_event_entry_bulk_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:68:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:69:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,.csv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:83:                                <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.event.entry.bulk_csv_format'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:84:                                    <span class="align-middle">{{ 'admin.common.csv_format'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:89:                                <a id="download-button" class="btn btn-ec-regular" href="{{ url('admin_event_entry_bulk_csv_template') }}">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:94:                        <p class="text-muted small mb-3">{{ 'admin.event.entry.bulk_csv_format_title'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_sale_high_price.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_sale_high_price.twig:3:{% set menus = ['product', 'product_csv_management', 'sale_high_price_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_sale_high_price.twig:5:{% block sub_title %}{{ 'admin.product.sale_high_price_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category_bulk.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category_bulk.twig:3:{% set menus = ['product', 'product_csv_management', 'category_bulk_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category_bulk.twig:5:{% block sub_title %}{{ 'admin.product.category_bulk_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/class_category.twig:152:                                        <span>{{ 'admin.common.csv_download'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/class_category.twig:154:                                    <a class="btn btn-ec-regular" href="{{ url('admin_setting_shop_csv', { id : constant('\\Eccube\\Entity\\Master\\CsvType::CSV_TYPE_CLASS_CATEGORY') }) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/class_category.twig:156:                                        <span>{{ 'admin.setting.shop.csv_setting'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_price.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_price.twig:3:{% set menus = ['product', 'product_csv_management', 'product_price_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_price.twig:5:{% block sub_title %}{{ 'admin.product.product_price_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/shelf_number.twig:24:        .btn-csv {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/shelf_number.twig:57:                                <a href="{{ path('admin_product_shelf_number') }}" class="btn btn-primary btn-csv ml-2">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/shelf_number.twig:61:                            <a href="{{ path('admin_product_shelf_number_export') }}" class="btn btn-primary btn-csv mr-1">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/shelf_number.twig:62:                                {{ 'admin.product.csv.export'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/shelf_number.twig:64:                            <a href="{{ path('admin_product_shelf_number_master_csv_upload') }}" class="btn btn-primary btn-csv">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/shelf_number.twig:65:                                {{ 'admin.product.csv.import'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_standard_price.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_standard_price.twig:3:{% set menus = ['product', 'product_csv_management', 'product_standard_price_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_standard_price.twig:5:{% block sub_title %}{{ 'admin.product.product_standard_price_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_tag.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_tag.twig:3:{% set menus = ['product', 'product_csv_management', 'product_tag_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_tag.twig:5:{% block sub_title %}{{ 'admin.product.product_tag_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/priority/ja/definition.yml:1:- mtb_tenant_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/priority/ja/definition.yml:2:- mtb_rounding_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/class_name.twig:155:                            <span>{{ 'admin.common.csv_download'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/class_name.twig:157:                        {% if is_accessable_route('admin_setting_shop_csv') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/class_name.twig:158:                        <a class="btn btn-ec-regular" href="{{ url('admin_setting_shop_csv', { id : constant('\\Eccube\\Entity\\Master\\CsvType::CSV_TYPE_CLASS_NAME') }) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/class_name.twig:160:                            <span>{{ 'admin.setting.shop.csv_setting'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/priority/en/definition.yml:1:- mtb_tenant_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/priority/en/definition.yml:2:- mtb_rounding_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:13:{% set menus = ['product', 'class_name_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:15:{% block title %}{{ 'admin.product.class_name_csv_upload'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:53:                $('#admin_csv_import_import_file').click();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:54:                $('#admin_csv_import_import_file').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:57:                        $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:70:                        <div class="d-inline-block" data-tooltip="true" data-placement="top" title="{{ 'tooltip.class_name.csv_upload'|trans }}"><span>{{ 'admin.common.csv_upload'|trans }}</span><i class="fa fa-question-circle fa-lg fa-lg ml-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:72:                    <div id="ex-csv_category-upload" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:74:                            <div class="col-2"><span>{{ 'admin.common.csv_select'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:76:                                <form id="upload-form" method="post" action="{{ url('admin_product_class_name_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:80:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:81:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,text/tsv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:98:                                <div class="d-inline-block" data-tooltip="true" data-placement="top" title="{{ 'tooltip.class_name.csv_format'|trans }}"><span class="align-middle">{{ 'admin.common.csv_format'|trans }}</span><i class="fa fa-question-circle fa-lg fa-lg ml-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:101:                                <a href="{{ url('admin_product_csv_template', {'type': 'class_name'}) }}" class="btn btn-ec-regular" id="download-button">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:105:                    <div id="ex-csv_class_name-format" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_section.twig:1:{% extends '@admin/Product/base_csv_upload.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_section.twig:3:{% set menus = ['product', 'product_csv_management', 'admin_product_section_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_section.twig:5:{% block sub_title %}{{ 'admin.product.product_section_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/category.twig:245:                            <span>{{ 'admin.common.csv_download'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/category.twig:248:                           href="{{ url('admin_setting_shop_csv', { id : constant('\\Eccube\\Entity\\Master\\CsvType::CSV_TYPE_CATEGORY') }) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/category.twig:250:                            <span>{{ 'admin.setting.shop.csv_setting'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:13:{% set menus = ['product', 'category_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:15:{% block title %}{{ 'admin.product.category_csv_upload'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:52:                $('#admin_csv_import_import_file').click();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:53:                $('#admin_csv_import_import_file').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:56:                        $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:69:                        <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.category.csv_upload'|trans }}"><span>{{ 'admin.common.csv_upload'|trans }}</span><i class="fa fa-question-circle fa-lg fa-lg ms-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:71:                    <div id="ex-csv_category-upload" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:73:                            <div class="col-2"><span>{{ 'admin.common.csv_select'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:75:                                <form id="upload-form" method="post" action="{{ url('admin_product_category_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:79:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:80:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,text/tsv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:97:                                <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.category.csv_format'|trans }}"><span class="align-middle">{{ 'admin.common.csv_format'|trans }}</span><i class="fa fa-question-circle fa-lg fa-lg ms-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:100:                                <a href="{{ url('admin_product_csv_template', {'type': 'category'}) }}" class="btn btn-ec-regular" id="download-button">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:104:                    <div id="ex-csv_category-format" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:1:- mtb_authority.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:2:- mtb_country.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:3:- mtb_csv_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:4:- mtb_customer_order_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:5:- mtb_customer_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:6:- mtb_device_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:7:- mtb_product_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:8:- mtb_job.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:9:- mtb_login_history_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:10:- mtb_order_item_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:11:- mtb_order_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:12:- mtb_order_status_color.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:13:- mtb_page_max.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:14:- mtb_pref.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:15:- mtb_product_list_max.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:16:- mtb_product_list_order_by.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:17:- mtb_sale_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:18:- mtb_sex.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:19:- mtb_shipping_status.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:20:- mtb_tax_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:21:- mtb_tax_display_type.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:22:- mtb_work.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:23:- dtb_member.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:24:- dtb_tax_rule.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:25:- dtb_block.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:26:- dtb_page.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:27:- dtb_layout.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:28:- dtb_page_layout.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:29:- dtb_block_position.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:30:- dtb_authority_role.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:31:- dtb_base_info.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:32:- dtb_category.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:33:- dtb_tag.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:34:- dtb_class_name.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:35:- dtb_class_category.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:36:- dtb_csv.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:37:- dtb_customer.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:38:- dtb_customer_address.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:39:- dtb_customer_favorite_product.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:40:- dtb_delivery.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:41:- dtb_delivery_duration.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:42:- dtb_delivery_fee.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:43:- dtb_delivery_time.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:44:- dtb_mail_history.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:45:- dtb_mail_template.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:46:- dtb_news.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:47:- dtb_order.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:48:- dtb_payment.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:49:- dtb_payment_option.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:50:- dtb_plugin.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:51:- dtb_plugin_event_handler.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:52:- dtb_product.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:53:- dtb_product_category.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:54:- dtb_product_class.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:55:- dtb_product_image.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:56:- dtb_product_stock.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:57:- dtb_product_tag.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:58:- dtb_order_item.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:59:- dtb_shipping.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:60:- dtb_template.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:61:- dtb_tradelaw.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:1:id,csv_type_id,creator_id,entity_name,field_name,reference_field_name,disp_name,sort_no,enabled,create_date,update_date
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:38:"41","1",,"/order/shipping_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:39:"42","2",,"/order/shipping_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:40:"43","3",,"/order/shipping_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:41:"44","1",,"/product/product_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:42:"45","2",,"/product/product_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:43:"46","3",,"/product/product_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:44:"47","1",,"/product/class_name_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:45:"48","2",,"/product/class_name_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:46:"49","3",,"/product/class_name_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:47:"50","1",,"/product/class_category_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:48:"51","2",,"/product/class_category_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_authority_role.csv:49:"52","3",,"/product/class_category_csv_upload","2024-07-25 01:27:09 +00:00","2024-07-25 01:27:09 +00:00","false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1562:admin.common.csv_upload_complete: CSV file uploaded
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1563:admin.common.csv_upload_error: Failed to upload CSV file
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1681:admin.common.csv_download: Download CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1682:admin.common.csv_upload: Upload a CSV file
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1683:admin.common.csv_skeleton_download: Download a template
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1684:admin.common.csv_format: CSV file format
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1685:admin.common.csv_select: Select a CSV file
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1688:admin.common.csv_invalid_format: Unmatched CSV format
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1689:admin.common.csv_invalid_no_data: No CSV data found
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1690:admin.common.csv_invalid_required: "%name% is empty in the %line%"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1691:admin.common.csv_invalid_greater_than_zero: "%name% should be more than 0 in the line %line%."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1692:admin.common.csv_invalid_format_line_name: "Unmatched format in %name% in the line %line%"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1693:admin.common.csv_invalid_format_line: "Unmatched CSV format in the line %line%"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1694:admin.common.csv_invalid_date_format: "Unmatched date format in %name% in the line %line%"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1695:admin.common.csv_invalid_not_found: "%name% is empty in the line %line%"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1696:admin.common.csv_invalid_not_found_target: '"%target_name%" is empty in %name% in the line %line%'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1697:admin.common.csv_invalid_not_same: "You are not allowed to enter the same value in %name1% and %name2% in the line %line%"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1698:admin.common.csv_invalid_can_not: "%name% is invalid in the line %line%"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1699:admin.common.csv_invalid_image: 'Your are not allowed to use "/" or "../" as suffix in %name% in the %line%'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1700:admin.common.csv_invalid_foreign_key: "You are unable to delete %name% in the line %line% because it has related data"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1701:admin.common.csv_invalid_description_detail_upper_limit: "%name% should be less than %max% characters in the line %line%."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1702:admin.common.csv_upload_in_progress: "Uploading CSV file ..."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1703:admin.common.csv_upload_line_success: "The %from% to %to% lines have been registered."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1704:admin.common.csv_upload_line_error: "An error has occurred. The registration process after the %from% line has been cancelled."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1816:admin.product.product_csv_management: Product CSV Management
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1817:admin.product.product_csv_upload: Product CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1818:admin.product.product_goods_csv_upload: Goods Product CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1819:admin.product.class_name_csv_upload: Class Name CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1820:admin.product.class_category_csv_upload: Class Category CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1821:admin.product.category_csv_upload: Category CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1930:admin.product.product_csv.product_id_col: Product ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1931:admin.product.product_csv.product_id_description: For new product registration, please leave it empty. To update the registered product information, please specify the product ID.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1932:admin.product.product_csv.display_status_col: Display Status (ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1933:admin.product.product_csv.display_status_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1934:admin.product.product_csv.product_name_col: Product Name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1935:admin.product.product_csv.product_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1936:admin.product.product_csv.shop_memo_col: Store Notes
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1937:admin.product.product_csv.shop_memo_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1938:admin.product.product_csv.description_list_col: Product Descriptions (All)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1939:admin.product.product_csv.description_list_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1940:admin.product.product_csv.description_detail_col: Product Descriptions (Details)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1941:admin.product.product_csv.description_detail_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1942:admin.product.product_csv.keyword_col: Search Keywords
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1943:admin.product.product_csv.keyword_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1944:admin.product.product_csv.free_area_col: Miscellaneous
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1945:admin.product.product_csv.free_area_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1946:admin.product.product_csv.delete_flag_col: Product Deletion Flag
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1947:admin.product.product_csv.delete_flag_description: "Specify 0: Register 1: Delete. If unspecified, it will be set to 0."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1948:admin.product.product_csv.product_image_col: Product Images
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1949:admin.product.product_csv.product_image_description: Specify the name of the image file. For multiple images, please double-quote each file name.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1950:admin.product.product_csv.category_col: Product Category (ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1951:admin.product.product_csv.category_description: Specify the category ID. For multiple categories, please double-quote each category ID.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1952:admin.product.product_csv.tag_col: Tag (ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1953:admin.product.product_csv.tag_description: Specify the tag ID. For multiple tags, please double-quote each tag ID.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1954:admin.product.product_csv.sale_type_col: Sales Type (ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1955:admin.product.product_csv.sale_type_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1956:admin.product.product_csv.class_category1_col: Option Group 1(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1957:admin.product.product_csv.class_category1_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1958:admin.product.product_csv.class_category2_col: Option Group 2(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1959:admin.product.product_csv.class_category2_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1960:admin.product.product_csv.delivery_duration_col: Estimated Shipping Date (ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1961:admin.product.product_csv.delivery_duration_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1962:admin.product.product_csv.product_code_col: SKU
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1963:admin.product.product_csv.product_code_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1964:admin.product.product_csv.stock_col: Stock Qty
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1965:admin.product.product_csv.stock_description: If the unlimited stock flag is set to 0, please set the value more than 0.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1966:admin.product.product_csv.stock_unlimited_col: Unlimited Stock Flag
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1967:admin.product.product_csv.stock_unlimited_description: "Specify 0: Limited or 1: Unlimited"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1968:admin.product.product_csv.sale_limit_col: Max Sales Qty
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1969:admin.product.product_csv.sale_limit_description: Set the value more than 1
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1970:admin.product.product_csv.normal_price_col: Regular Price
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1971:admin.product.product_csv.normal_price_description: Set the value more than 0
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1972:admin.product.product_csv.sale_price_col: Selling Price
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1973:admin.product.product_csv.sale_price_description: Set the value more than 0
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1974:admin.product.product_csv.delivery_fee_col: Shipping Charge
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1975:admin.product.product_csv.delivery_fee_description: If the shipping charge is set per product, set the value more than 0
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1976:admin.product.product_csv.tax_rate_col: Tax Rate
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1977:admin.product.product_csv.tax_rate_description: If the Tax Rate is set per product, set the value more than 0
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1978:admin.product.product_csv.product_class_visible_flag_col: Product options visible flag
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1979:admin.product.product_csv.product_class_visible_flag_description: 0:Invisible 1:Visible. If unspecified, it will not be updated.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1982:admin.product.category_csv.category_id_col: Category ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1983:admin.product.category_csv.category_id_description: For a new category registration, please leave it empty. To update the registered category, please specify the category ID.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1984:admin.product.category_csv.category_name_col: Category Name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1985:admin.product.category_csv.category_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1986:admin.product.category_csv.parent_category_id_col: Parent Category ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1987:admin.product.category_csv.parent_category_id_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1988:admin.product.category_csv.delete_flag_col: Category Deletion Flag
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1989:admin.product.category_csv.delete_flag_description: "Specify 0: Upload or 1: Delete. If unspecified, it is set to 0."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1992:admin.product.class_name_csv.class_name_id_col: Class Name ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1993:admin.product.class_name_csv.class_name_id_description: For a new class name registration, please leave it empty. To update the registered class name, please specify the class name ID.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1994:admin.product.class_name_csv.class_name_col: Class Name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1995:admin.product.class_name_csv.class_name_description: ''
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1996:admin.product.class_name_csv.class_backend_name_col: Backend Name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1997:admin.product.class_name_csv.class_backend_name_description: ''
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1998:admin.product.class_name_csv.delete_flag_col: Class Name Deletion Flag
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1999:admin.product.class_name_csv.delete_flag_description: 'Specify 0: Upload or 1: Delete. If unspecified, it is set to 0.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2002:admin.product.class_category_csv.class_name_id_col: Class Name ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2003:admin.product.class_category_csv.class_name_id_description: Specify an existing Class Name ID.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2004:admin.product.class_category_csv.class_category_id_col: Class Category ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2005:admin.product.class_category_csv.class_category_id_description: For a new class category registration, please leave it empty. To update the registered class category, please specify the class category ID.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2006:admin.product.class_category_csv.class_category_name_col: Class Category Name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2007:admin.product.class_category_csv.class_category_name_description: ''
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2008:admin.product.class_category_csv.class_category_backend_name_col: Class Category Backend Name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2009:admin.product.class_category_csv.class_category_backend_name_description: ''
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2010:admin.product.class_category_csv.delete_flag_col: Class Category Deletion Flag
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2011:admin.product.class_category_csv.delete_flag_description: 'Specify 0: Upload or 1: Delete. If unspecified, it is set to 0.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2014:admin.product.product_csv_upload__title: "Upload product CSV"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2015:admin.product.product_csv_upload__message: "Upload the product CSV file. Is it OK?"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2055:admin.stock.list.recommend_csv: Recommend CSV Export
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2056:admin.stock.list.stock_info_csv: Stock Info CSV Export
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2057:admin.stock.list.custom_csv: Custom CSV Export
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2058:admin.stock.list.custom_csv_no_formats: No formats registered
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2059:admin.stock.list.custom_csv_settings: Output Settings
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2128:admin.stock.move.shortage_csv_invalid_status: The current status does not allow shortage CSV import.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2129:admin.stock.move.shortage_csv_modal.note: Register shortage quantities via CSV. Only rows with a shortage quantity are updated; blank rows and rows omitted from the CSV are left unchanged. Entering 0 clears the shortage quantity.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2130:admin.stock.move.shortage_csv_modal.csv_file: CSV file
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2131:admin.stock.move.shortage_csv_modal.csv_file_limit: Size limit applies
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2132:admin.stock.move.shortage_csv_modal.csv_file_required: Please select a CSV file.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2133:admin.stock.move.shortage_csv_import.file_not_found: 'The file could not be read.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2134:admin.stock.move.shortage_csv_import.shortage_qty_invalid: 'Line %line%: Shortage quantity must be an integer of 0 or greater.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2135:admin.stock.move.shortage_csv_import.product_code_duplicated: 'Line %line%: Product code "%code%" is duplicated in the CSV.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2136:admin.stock.move.shortage_csv_import.product_code_not_found: 'Line %line%: Product code "%code%" was not found in this stock move.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2137:admin.stock.move.shortage_csv_import.shortage_qty_exceeds_move: 'Line %line%: Shortage quantity (%shortage%) exceeds move quantity (%max%).'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2138:admin.stock.move.shortage_csv_modal.format_product_code: Product code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2139:admin.stock.move.shortage_csv_modal.format_product_code_desc: Product code with a shortage
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2140:admin.stock.move.shortage_csv_modal.format_product_name: Product name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2141:admin.stock.move.shortage_csv_modal.format_product_name_desc: Reference only (not updated on import)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2142:admin.stock.move.shortage_csv_modal.format_move_qty: Move quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2143:admin.stock.move.shortage_csv_modal.format_move_qty_desc: Reference only (not updated on import)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2144:admin.stock.move.shortage_csv_modal.format_shortage_qty: Shortage quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2145:admin.stock.move.shortage_csv_modal.format_shortage_qty_desc: Shortage quantity (integer 0 or greater; blank is not updated)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2146:admin.stock.move.differential_csv_invalid_status: The current status does not allow differential CSV import.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2147:admin.stock.move.differential_csv_modal.note: Register difference quantities via CSV. Only rows with a difference quantity are updated; blank rows and rows omitted from the CSV are left unchanged. Entering 0 clears the difference quantity.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2148:admin.stock.move.differential_csv_modal.csv_file: CSV file
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2149:admin.stock.move.differential_csv_modal.csv_file_limit: Size limit applies
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2150:admin.stock.move.differential_csv_modal.csv_file_required: Please select a CSV file.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2151:admin.stock.move.differential_csv_import.difference_qty_invalid: 'Line %line%: Difference quantity must be an integer.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2152:admin.stock.move.differential_csv_import.product_code_duplicated: 'Line %line%: Product code "%code%" is duplicated in the CSV.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2153:admin.stock.move.differential_csv_import.product_code_not_found: 'Line %line%: Product code "%code%" was not found in this stock move.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2154:admin.stock.move.differential_csv_import.difference_qty_exceeds_actual_move: 'Line %line%: Difference quantity (%difference%) exceeds actual move quantity (%max%).'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2155:admin.stock.move.differential_csv_import.difference_qty_out_of_range: 'Line %line%: Difference quantity must be between %min% and %max%.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2156:admin.stock.move.differential_csv_modal.format_product_code: Product code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2157:admin.stock.move.differential_csv_modal.format_product_code_desc: Product code with a difference
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2158:admin.stock.move.differential_csv_modal.format_product_name: Product name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2159:admin.stock.move.differential_csv_modal.format_product_name_desc: Reference only (not updated on import)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2160:admin.stock.move.differential_csv_modal.format_actual_move_qty: Actual move quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2161:admin.stock.move.differential_csv_modal.format_actual_move_qty_desc: Reference only (not updated on import)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2162:admin.stock.move.differential_csv_modal.format_difference_qty: Difference quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2163:admin.stock.move.differential_csv_modal.format_difference_qty_desc: Difference quantity (integer; positive for shortage, negative for surplus; blank is not updated)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2184:admin.stock.move_transfer.csv_file_registration: CSV file registration
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2185:admin.stock.move_transfer.csv_register_move: Register stock move CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2186:admin.stock.move_transfer.csv_register_transfer: Register stock transfer CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2187:admin.stock.move_transfer.csv_move_modal.file_row_limit_hint: (Up to 10,000 rows per file.)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2188:admin.stock.move_transfer.csv_move_modal.move_from_stock_location: Source stock division
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2189:admin.stock.move_transfer.csv_move_modal.move_to_stock_location: Destination stock division
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2190:admin.stock.move_transfer.csv_move_modal.col_product_code_hint: Enter the product code.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2191:admin.stock.move_transfer.csv_move_modal.col_move_quantity_hint: Enter the movement quantity.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2192:admin.stock.move_transfer.csv_transfer_modal.store: Store
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2193:admin.stock.move_transfer.csv_transfer_modal.transfer_from_stock_location: Transfer source stock division
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2194:admin.stock.move_transfer.csv_transfer_modal.member: Member
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2195:admin.stock.move_transfer.csv_transfer_modal.col_src_product_code: Transfer source product code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2196:admin.stock.move_transfer.csv_transfer_modal.col_dest_product_code: Transfer destination product code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2197:admin.stock.move_transfer.csv_transfer_modal.col_transfer_quantity: Transfer quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2198:admin.stock.move_transfer.csv_transfer_modal.col_src_product_code_hint: Enter the transfer source product code.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2199:admin.stock.move_transfer.csv_transfer_modal.col_dest_product_code_hint: Enter the transfer destination product code.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2200:admin.stock.move_transfer.csv_transfer_modal.col_transfer_quantity_hint: Enter the transfer quantity.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2201:admin.stock.move_transfer.barcode_csv_export.no_selection: Please select one or more stock move/transfer records.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2202:admin.stock.move_transfer.barcode_csv_export.not_found: No matching data found.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2203:admin.stock.move_transfer.barcode_csv_export.not_move_type: 'ID: %moveTransferId% cannot be exported because it is not a move.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2204:admin.stock.move_transfer.barcode_csv_export.not_smaregi_destination: 'ID: %moveTransferId% cannot be exported because the destination is not Smaregi stock.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2205:admin.stock.move_transfer.barcode_csv_export.move_to_shop_not_set: 'ID: %moveTransferId% has no destination store configured.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2206:admin.stock.move_transfer.barcode_csv_export.shop_not_permitted: 'ID: %moveTransferId% belongs to a store you are not authorized to access.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2207:admin.stock.move_transfer.barcode_csv_export.id_not_found: 'ID: %moveTransferId% does not exist.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2208:admin.stock.move_transfer.barcode_csv_export.multiple_shops: Stock move/transfer records from multiple stores cannot be processed at the same time.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2219:admin.order.shipping_csv_upload: Upload Shipping CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2324:admin.order.csv_shipping_date_description: Set Shipping Date in YYYY-MM-DD format
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2325:admin.order.order_csv: Order CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2326:admin.order.shipping_csv: Shipping CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2367:admin.order.shipping_csv.shipping_id_col: Shipping ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2368:admin.order.shipping_csv.shipping_id_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2369:admin.order.shipping_csv.tracking_number_col: Tracking No.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2370:admin.order.shipping_csv.tracking_number_description: Enter alphanumeric characters or hyphens
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2371:admin.order.shipping_csv.shipping_date_col: Shipping Date
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2372:admin.order.shipping_csv.shipping_date_description: Enter the shipping date in the format of MM/DD/YYYY
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2585:admin.setting.shop.csv_setting: CSV Outputs
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2706:admin.setting.shop.csv.csv_columns: CSV Output Items
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2707:admin.setting.shop.csv.csv_type: CSV Type
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2708:admin.setting.shop.csv.non_output_colmuns: NOT to Output
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2709:admin.setting.shop.csv.output_colmuns: To Output
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2710:admin.setting.shop.csv.operation: Output Menus
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2711:admin.setting.shop.csv.operation__output: Add
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2712:admin.setting.shop.csv.operation__release: Delete
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2713:admin.setting.shop.csv.operation__all_output: Add All
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2714:admin.setting.shop.csv.operation__all_release: Delete All
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2715:admin.setting.shop.csv.order: Item Orders
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2716:admin.setting.shop.csv.order__up: Move Up
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2717:admin.setting.shop.csv.order__down: Move Down
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2718:admin.setting.shop.csv.order__top: Move to Top
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2719:admin.setting.shop.csv.order__bottom: Move to Bottom
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2720:admin.setting.shop.csv.how_to_use: |
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3132:tooltip.product.csv_upload: Bulk product registration is available with a CSV template.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3133:tooltip.product.csv_format: You can create a CSV data easily with templates available for downloads.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3134:tooltip.category.csv_upload: Bulk category registration is available with a CSV template.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3135:tooltip.category.csv_format: You can create a CSV data easily with templates available for downloads.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3153:tooltip.shipping.csv_upload: You can bulk-register shipping information with a CSV template.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3154:tooltip.shipping.csv_format: You can easily create CSV data in specified format with downloadable templates.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3201:tooltip.setting.shop.csv.csv_columns: You can output various data in CSV format. You can specify the items for CSV output.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3202:tooltip.setting.shop.csv.csv_type: Specify the CSV file type.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3228:tooltip.class_name.csv_upload: Standards can be registered in a batch using the specified type of CSV data.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3229:tooltip.class_name.csv_format: You can easily create CSV data of the specified type by downloading and editing the template file.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3398:admin.stock.split_join.csv_preview_error: The preview could not be loaded. Please confirm you are still logged in and try again.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3402:admin.stock.split_join.split_csv_register: Register Stock Split CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3403:admin.stock.split_join.join_csv_register: Register Stock Join CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3404:admin.stock.split_join.list_csv_import_submit: Import from CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3405:admin.stock.split_join.list_csv_join_import_done: 'Registered %count% join(s) and advanced to shortage entry.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3406:admin.stock.split_join.list_csv_split_import_done: 'Registered %count% split(s) and submitted for approval.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3459:admin.stock.split_join.csv_file_not_found: 'CSV file not found.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3460:admin.stock.split_join.csv_header_invalid: 'Invalid CSV header format.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3461:admin.stock.split_join.csv_parse_failed: 'Failed to parse the CSV.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3462:admin.stock.split_join.csv_product_not_found: 'Row %line%: Product code "%code%" not found in the same store and stock location.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3463:admin.stock.split_csv_modal.store: Store
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3464:admin.stock.split_csv_modal.store_placeholder: Please select a store
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3465:admin.stock.split_csv_modal.inventory_category: Inventory Category
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3466:admin.stock.split_csv_modal.csv_file: CSV File
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3467:admin.stock.split_csv_modal.csv_file_limit: limit applies
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3468:admin.stock.split_csv_modal.no_file_selected: No file selected
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3469:admin.stock.split_csv_modal.register: Register
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3470:admin.stock.split_csv_modal.template_download: Download Template
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3471:admin.stock.split_csv_modal.approval_notification_label: Approval Notification Recipients
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3472:admin.stock.split_csv_modal.format_source_code: Source Product Code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3473:admin.stock.split_csv_modal.format_source_code_desc: Enter the product code of the split source.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3474:admin.stock.split_csv_modal.format_split_quantity: Split Quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3475:admin.stock.split_csv_modal.format_split_quantity_desc: Enter the split quantity as a whole number.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3476:admin.stock.split_csv_modal.format_target_code: Destination Product Code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3477:admin.stock.split_csv_modal.format_target_code_desc: Enter the product code of the split destination.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3478:admin.stock.split_csv_modal.format_target_stock: Destination Stock
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3479:admin.stock.split_csv_modal.format_target_stock_desc: Enter the destination stock quantity as a whole number.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3480:admin.stock.join_csv_modal.store: Store
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3481:admin.stock.join_csv_modal.inventory_category: Inventory Category
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3482:admin.stock.join_csv_modal.csv_file: CSV File
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3483:admin.stock.join_csv_modal.format_destination_code: Destination Product Code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3484:admin.stock.join_csv_modal.format_destination_code_desc: Enter the product code of the join destination.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3485:admin.stock.join_csv_modal.format_join_quantity: Source Quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3486:admin.stock.join_csv_modal.format_join_quantity_desc: Enter the join quantity as a whole number.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3487:admin.stock.join_csv_modal.format_source_code: Source Product Code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3488:admin.stock.join_csv_modal.format_source_code_desc: Enter the product code of the join source.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3489:admin.stock.join_csv_modal.format_source_stock_category: Source Stock Category
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3490:admin.stock.join_csv_modal.format_source_stock_category_desc: Enter the stock category of the join source.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3491:admin.stock.join_csv_modal.format_source_stock_quantity: Source Stock Quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3492:admin.stock.join_csv_modal.format_source_stock_quantity_desc: Enter the source stock quantity as a whole number.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3493:admin.stock.join_csv_modal.reflect_only_note: "※ This operation only reflects the CSV contents on screen. Please register separately."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3494:admin.stock.join_csv_modal.reflect_only_note_list: "※ The CSV contents will be imported and saved as awaiting approval."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3495:admin.stock.join_csv_modal.template_download: Download Template
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3500:admin.stock.split.csv_column_invalid: 'Invalid CSV columns. Row 1 must contain "Product Code" and "Destination Stock".'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3501:admin.stock.split.csv_same_as_source: 'Row %line%: The source product code cannot be used as a split destination.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3504:admin.stock.split.new_destination_csv_modal.title: Register Destination CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3505:admin.stock.split.new_destination_csv_modal.note: Upload a CSV file to register split destination products in bulk. The existing destination list will be replaced.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3506:admin.stock.split.new_destination_csv_modal.product_register: Register Destination Products
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3507:admin.stock.split.new_destination_csv_modal.format_product_code: Product Code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3508:admin.stock.split.new_destination_csv_modal.format_product_code_desc: Enter the product code of the split destination.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3509:admin.stock.split.new_destination_csv_modal.format_destination_qty: Destination Quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3510:admin.stock.split.new_destination_csv_modal.format_destination_qty_desc: Enter the destination quantity as a whole number.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3548:admin.stock.join.csv_column_invalid: 'Invalid CSV columns. Row 1 must contain "Product Code" and "Source Stock".'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3549:admin.stock.join.csv_same_as_destination: 'Row %line%: The same stock as the destination cannot be specified as a source.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3555:admin.stock.join.shortage_csv_modal.csv_file_required: Please select a CSV file.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3605:admin.deck.csv_import: CSV Import
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3606:admin.deck.csv_export: CSV Export
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3607:admin.deck.csv_export_no_selection: No deck selected for CSV export.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3670:admin.deck.csv_upload_title: Deck Registration CSV Upload
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3671:admin.deck.csv_upload_header: Deck Registration CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3672:admin.deck.csv_format_title: Deck Registration CSV File Format
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3673:admin.deck.csv.commander: Commander
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3674:admin.deck.csv.error.format_invalid: "The format of %s is invalid. Please check the data on row %d."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3675:admin.deck.csv.error.deck_not_found: "Deck ID %s does not exist. Please check the data on row %d."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3676:admin.deck.csv.error.deck_type_invalid: "Deck ID %s is not an event type deck. Please check the data on row %d."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3699:admin.archetype.csv_import: CSV Import
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3700:admin.archetype.csv_upload_title: Archetype CSV Upload
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3701:admin.archetype.csv_upload_header: Archetype CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3702:admin.archetype.csv_format_title: Archetype CSV File Format
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1556:admin.common.csv_upload_complete: CSVファイルをアップロードしました
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1557:admin.common.csv_upload_error: CSVファイルのアップロードに失敗しました
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1573:# csvバリデーションエラー
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1574:admin.csv.error.upload.require: ファイルを選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1575:admin.csv.error.upload.maxsize: "CSVファイルは %maxSize% MB以下でアップロードしてください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1576:admin.csv.error.upload.maxrecord: "%maxRecord% 行を超えるCSVファイルは登録できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1577:admin.csv.error.data.already_executing: "既に %csvName% インポートが実行中です。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1578:admin.csv.error.data.lock_failed: "DBのロックに失敗しました。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1693:admin.common.csv_download: CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1694:admin.common.csv_upload: CSVファイルをアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1695:admin.common.csv_skeleton_download: 雛形ファイルダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1696:admin.common.csv_format: CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1697:admin.common.csv_item_name: 項目名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1698:admin.common.csv_description: 説明
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1699:admin.common.csv_select: CSVファイルを選択
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1706:admin.common.csv_checkbox_force_missing_file_pass_to_db: "ファイルの有無に関わらず、ファイルパスをデータベースに追加する。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1708:admin.common.csv_invalid_format: CSVのフォーマットが一致しません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1709:admin.common.csv_invalid_no_data: CSVデータが存在しません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1710:admin.common.csv_invalid_required: "%line%行目の%name%が設定されていません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1711:admin.common.csv_invalid_greater_than_zero: "%line%行目の%name%は0以上の数値を設定してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1712:admin.common.csv_invalid_format_line: "%line%行目のCSVフォーマットが一致しません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1713:admin.common.csv_invalid_format_line_name: "%line%行目の%name%のフォーマットが異なります"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1714:admin.common.csv_invalid_date_format: "%line%行目の%name%の日付フォーマットが異なります"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1715:admin.common.csv_invalid_not_found: "%line%行目の%name%が存在しません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1716:admin.common.csv_invalid_not_found_target: "%line%行目の%name%「%target_name%」が存在しません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1717:admin.common.csv_invalid_not_same: "%line%行目の%name1%と%name2%には同じ値を使用できません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1718:admin.common.csv_invalid_can_not: "%line%行目の%name%は設定できません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1719:admin.common.csv_invalid_image: '%line%行目の%name%には末尾に"/"や"../"を使用できません'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1720:admin.common.csv_invalid_foreign_key: "%line%行目の%name%は関連するデータがあるため削除できません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1721:admin.common.csv_invalid_description_detail_upper_limit: "%line%行目の%name%は%max%文字以下の文字列を指定してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1722:admin.common.csv_invalid_image_file: "%line%行目の%name%は画像ファイルが見つかりませんでした。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1723:admin.common.csv_invalid_image_file_size: "%line%行目の%name%は画像ファイルサイズが大きすぎます。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1724:admin.common.csv_invalid_image_file_not_image: "%line%行目の%name%は画像ファイルではありません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1725:admin.common.csv_disallow_url_paths: "%line%行目の%name%には見つからないURLパスを設定できません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1726:admin.common.csv_cannot_allow_disabled_url: "%line%行目の%name%には見つからないURLパスを設定できません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1727:admin.common.csv_cannot_find_file_but_forcefully_saved_pass: "%line%行目の%name%が見つかりませんでしたが、強制的にファイルパスをデータベースに追加しました。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1728:admin.common.csv_upload_in_progress: "CSVファイルのアップロード中..."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1729:admin.common.csv_upload_line_success: "%from%行目〜%to%行目を登録しました"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1730:admin.common.csv_upload_line_error: "エラーが発生しました。%from%行目以降の登録処理はキャンセルされました"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1731:admin.common.csv_back_to_list: 一覧に戻る
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1732:admin.common.csv_import_error: CSVインポートエラー
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1733:admin.common.csv_file_select: CSVファイル選択
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1734:admin.common.csv_import: CSV取り込み
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1735:admin.common.csv_id_optional: (新規登録時は入力不要)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1736:admin.common.csv_export_guide: '<a href="%url%" class="text-muted text-decoration-underline">登録済みのデータをCSV出力</a>して、フォーマットを確認・編集してからアップロードすることをお勧めします。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1881:admin.product.product_csv_management: 商品CSV管理
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1882:admin.product.product_csv_upload: 商品CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1883:admin.product.product_card_csv_upload: カード商品CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1884:admin.product.product_card_csv_upload_title: カード商品登録CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1885:admin.product.product_card_csv_format_title: カード商品登録CSVフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1886:admin.product.product_goods_csv_upload: グッズ商品CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1887:admin.product.class_name_csv_upload: 規格CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1888:admin.product.class_category_csv_upload: 規格分類CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1889:admin.product.category_csv_upload: カテゴリCSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1890:admin.product.category_bulk_csv: カテゴリ登録CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1891:admin.product.category_bulk_csv_upload_title: カテゴリ登録CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1892:admin.product.category_bulk_csv_format_title: カテゴリ登録CSVフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1927:admin.storagecode.duplicate_csv_rank_error: "CSV内で並び順が重複しています。 %row% 行目のデータを確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1933:admin.product.storage_code_csv_upload_title: 略称タグ登録CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1934:admin.product.storage_code_csv_format_title: 略称タグ登録CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1935:admin.product.csv_import_history_title: CSVインポート履歴
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1936:admin.product.csv_import_history_filename: ファイル名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1937:admin.product.csv_import_history_upload_date: アップロード日時
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1938:admin.product.csv_import_history_operator: 作業者
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1941:admin.product.product_tag_csv: 商品タグ更新CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1942:admin.product.product_tag_csv_upload_title: 商品タグ更新CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1943:admin.product.product_tag_csv_format_title: 商品タグ更新CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1946:admin.product.product_price_csv: セール用価格変更CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1947:admin.product.product_price_csv_upload_title: セール用価格変更CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1948:admin.product.product_price_csv_format_title: セール用価格変更CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1950:# 高額商品価格変更CSV（商品コード・基準価格）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1951:admin.product.simple_high_price_csv: 高額商品価格変更CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1952:admin.product.simple_high_price_csv_upload_title: 高額商品価格変更CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1953:admin.product.simple_high_price_csv_format_title: 高額商品価格変更CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1954:admin.product.simple_high_price_csv.sale_alert: セール中商品の販売価格は変更できません。基準価格のみ更新されます。セール外の商品は基準価格・販売価格の両方を更新します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1955:admin.product.simple_high_price_csv.sell_price_not_updated: "%d行目: セール中商品のため、基準価格のみ更新しました。（販売価格は変更されません）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1956:admin.product.simple_high_price_csv.no_matching_product_class: "%d行目: 対象の商品規格がありません。（商品公開ステータスが0かつ高額商品コードが設定された規格のみ対象です）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1958:# セール用高額商品価格変更CSV（商品コード・価格・セールフラグ等）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1959:admin.product.sale_high_price_csv: セール用高額商品価格変更CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1960:admin.product.sale_high_price_csv_upload_title: セール用高額商品価格変更CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1961:admin.product.sale_high_price_csv_format_title: セール用高額商品価格変更CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1962:admin.product.sale_high_price_csv.alert_off_sale_buy_only: "%d行目: セール外のため、買取価格および販売価格はデータベースにある基準価格で更新してます。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1963:admin.product.sale_high_price_csv.alert_end_sale_sell_from_standard: "%d行目: 通常商品のため、買取価格はCSVの値で更新しました。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1966:admin.product.product_section_csv: 部門登録CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1967:admin.product.product_section_csv_upload_title: 部門登録CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1968:admin.product.product_section_csv_format_title: 部門登録CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1969:admin.product.product_status_csv: 商品公開CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1970:admin.product.product_status_csv_upload_title: 商品公開CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1971:admin.product.product_status_csv_format_title: 商品公開CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1974:admin.product.product_standard_price_csv: 基準価格変更CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1975:admin.product.product_standard_price_csv_upload_title: 基準価格変更CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1976:admin.product.product_standard_price_csv_format_title: 基準価格変更CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1977:admin.product.standard_price_csv.product_class_not_found: "%d行目: 商品ID %s・言語ID %s に該当する商品規格がありません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1978:admin.product.standard_price_csv.sale_product_sell_price_unchanged: "%d行目: セール中商品のため、販売価格は変更されません。（基準価格・買取価格は更新しました）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1981:admin.product.product_shelf_number_csv: 棚番号登録CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1982:admin.product.product_shelf_number_csv_upload_title: 棚番号登録CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1983:admin.product.product_shelf_number_csv_format_title: 棚番号登録CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1986:admin.product.tag_sales_analysis_csv: 売上分析タグ更新CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1987:admin.product.tag_sales_analysis_csv_upload_title: 売上分析タグ更新CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1988:admin.product.tag_sales_analysis_csv_format_title: 売上分析タグ更新CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2076:admin.product.price_csv.sell_price_not_reflected: "%d行目: セールフラグを無効にしたため、CSVに設定された販売価格は反映されていません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2077:admin.product.price_csv.normal_product_sell_price_unchanged: "%d行目: 通常商品のため、販売価格は変更されませんでした。買取価格のみ更新しています。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2147:admin.product.high_price_code: 高額商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2187:admin.product.expensive: 高額商品
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2188:admin.product.is_expensive: 高額商品のみ表示
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2189:admin.product.not_expensive: 高額商品を除外する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2192:admin.product.card_csv_export: カード商品CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2193:admin.product.goods_csv_export: グッズ商品CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2194:admin.product.sale_price_csv_export: セール用価格変更CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2196:admin.product.custom_csv_export: カスタムデータCSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2245:admin.product.product_csv.product_id_col: 商品ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2246:admin.product.product_csv.product_id_description: 新規登録の場合は空にしてください。既存の商品を更新する場合は、商品IDを指定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2247:admin.product.product_csv.display_status_col: 公開ステータス(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2248:admin.product.product_csv.display_status_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2249:admin.product.product_csv.product_name_col: 商品名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2250:admin.product.product_csv.product_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2251:admin.product.product_csv.shop_memo_col: ショップ用メモ欄
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2252:admin.product.product_csv.shop_memo_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2253:admin.product.product_csv.description_list_col: 商品説明(一覧)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2254:admin.product.product_csv.description_list_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2255:admin.product.product_csv.description_detail_col: 商品説明(詳細)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2256:admin.product.product_csv.description_detail_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2257:admin.product.product_csv.keyword_col: 検索ワード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2258:admin.product.product_csv.keyword_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2259:admin.product.product_csv.free_area_col: フリーエリア
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2260:admin.product.product_csv.free_area_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2261:admin.product.product_csv.delete_flag_col: 商品削除フラグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2262:admin.product.product_csv.delete_flag_description: 0:登録 1:削除を指定します。未指定の場合、0として扱います。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2263:admin.product.product_csv.product_image_col: 商品画像
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2264:admin.product.product_csv.product_image_description: '画像のファイル名を指定します。複数画像の場合、画像ファイル名をカンマ区切りで「"」で囲んでください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2265:admin.product.product_csv.category_col: 商品カテゴリ(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2266:admin.product.product_csv.category_description: 'カテゴリIDを指定します。複数カテゴリの場合、商品カテゴリIDをカンマ区切りで「"」で囲んでください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2267:admin.product.product_csv.tag_col: タグ(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2268:admin.product.product_csv.tag_description: 'タグIDを指定します。複数タグの場合、タグIDをカンマ区切りで「"」で囲んでください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2269:admin.product.product_csv.sale_type_col: 販売種別(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2270:admin.product.product_csv.sale_type_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2271:admin.product.product_csv.class_category1_col: 規格分類1(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2272:admin.product.product_csv.class_category1_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2273:admin.product.product_csv.class_category2_col: 規格分類2(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2274:admin.product.product_csv.class_category2_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2275:admin.product.product_csv.delivery_duration_col: 発送日目安(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2276:admin.product.product_csv.delivery_duration_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2277:admin.product.product_csv.product_code_col: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2278:admin.product.product_csv.product_code_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2279:admin.product.product_csv.stock_col: 在庫数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2280:admin.product.product_csv.stock_description: 在庫数無制限フラグが0の場合、0以上の数値を設定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2281:admin.product.product_csv.stock_unlimited_col: 在庫数無制限フラグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2282:admin.product.product_csv.stock_unlimited_description: "0:制限 1: 無制限を指定します。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2283:admin.product.product_csv.sale_limit_col: 販売制限数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2284:admin.product.product_csv.sale_limit_description: 1以上の数値を設定します。未指定の場合、販売制限数なしとして扱います。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2285:admin.product.product_csv.normal_price_col: 通常価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2286:admin.product.product_csv.normal_price_description: 0以上の数値を設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2287:admin.product.product_csv.sale_price_col: 販売価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2288:admin.product.product_csv.sale_price_description: 0以上の数値を設定します。未指定の場合、非表示として扱います。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2289:admin.product.product_csv.delivery_fee_col: 送料
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2290:admin.product.product_csv.delivery_fee_description: 商品ごとの送料設定が有効の場合、0以上の数値を設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2291:admin.product.product_csv.tax_rate_col: 税率
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2292:admin.product.product_csv.tax_rate_description: 商品別税率機能設定が有効の場合、0以上の数値を設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2293:admin.product.product_csv.product_class_visible_flag_col: 商品規格表示フラグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2294:admin.product.product_csv.product_class_visible_flag_description: 0:非表示 1:表示を指定します。未指定の場合は更新しません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2295:admin.product.csv.import: CSV入力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2296:admin.product.csv.export: CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2299:admin.product.category_csv.category_id_col: カテゴリID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2300:admin.product.category_csv.category_id_description: 新規登録の場合は空にしてください。既存のカテゴリを更新する場合は、カテゴリIDを指定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2301:admin.product.category_csv.category_name_col: カテゴリ名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2302:admin.product.category_csv.category_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2303:admin.product.category_csv.parent_category_id_col: 親カテゴリID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2304:admin.product.category_csv.parent_category_id_description: 登録済みのカテゴリIDを数字で指定してください
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2305:admin.product.category_csv.delete_flag_col: カテゴリ削除フラグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2306:admin.product.category_csv.delete_flag_description: 0:登録 1:削除を指定します。未指定の場合、0として扱います。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2309:admin.product.class_name_csv.class_name_id_col: 規格ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2310:admin.product.class_name_csv.class_name_id_description: 新規登録の場合は空にしてください。既存の規格を更新する場合は、規格IDを指定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2311:admin.product.class_name_csv.class_name_col: 規格名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2312:admin.product.class_name_csv.class_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2313:admin.product.class_name_csv.class_backend_name_col: 管理名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2314:admin.product.class_name_csv.class_backend_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2315:admin.product.class_name_csv.delete_flag_col: 規格削除フラグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2316:admin.product.class_name_csv.delete_flag_description: 0:登録 1:削除を指定します。未指定の場合、0として扱います。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2319:admin.product.class_category_csv.class_name_id_col: 規格ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2320:admin.product.class_category_csv.class_name_id_description: 既存の規格IDを指定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2321:admin.product.class_category_csv.class_category_id_col: 規格分類ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2322:admin.product.class_category_csv.class_category_id_description: 新規登録の場合は空にしてください。既存の規格分類を更新する場合は、規格分類IDを指定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2323:admin.product.class_category_csv.class_category_name_col: 規格分類名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2324:admin.product.class_category_csv.class_category_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2325:admin.product.class_category_csv.class_category_backend_name_col: 規格分類管理名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2326:admin.product.class_category_csv.class_category_backend_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2327:admin.product.class_category_csv.delete_flag_col: 規格分類削除フラグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2328:admin.product.class_category_csv.delete_flag_description: 0:登録 1:削除を指定します。未指定の場合、0として扱います。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2331:admin.product.product_csv_upload__title: "商品CSVをアップロードします"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2332:admin.product.product_csv_upload__message: "商品CSVファイルをアップロードします。よろしいですか？"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2335:admin.product.stock_change_csv.stock_product_code_col: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2336:admin.product.stock_change_csv.stock_product_code_description: 在庫変更対象の商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2337:admin.product.stock_change_csv.stock_change_quantity_col: 在庫増減数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2338:admin.product.stock_change_csv.stock_change_quantity_description: 在庫変更対象の商品の在庫増減数を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2339:admin.product.stock_change_csv.stock_purchase_price_col: 仕入単価
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2340:admin.product.stock_change_csv.stock_purchase_price_description: 在庫変動区分の親区分が入庫の場合必須入力 在庫変更対象の商品の仕入単価を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2343:admin.product.department_csv.type_name: 部門CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2344:admin.product.department_csv.section_id_col: 部門ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2345:admin.product.department_csv.section_id_description: 新規登録の場合は空にしてください。既存の部門を更新する場合は、部門IDを指定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2346:admin.product.department_csv.section_name_col: 部門名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2347:admin.product.department_csv.section_name_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2348:admin.product.department_csv.section_code_col: 部門コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2349:admin.product.department_csv.section_code_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2350:admin.product.department_csv.section_tax_free_division_col: 免税区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2351:admin.product.department_csv.section_tax_free_division_description: 0:対象外 1:一般品 2:消耗品のいずれかを指定します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2352:admin.product.department_csv.section_visible_col: MTGBuyer表示フラグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2353:admin.product.department_csv.section_visible_description: 0:非表示 1:表示を指定します。未指定の場合、0として扱います。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2356:admin.csv.error.format.header: "CSVのフォーマットが一致しません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2357:admin.csv.error.format.body: "CSVのフォーマットが一致しません。 %d 行目のデータを確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2358:admin.csv.error.data.empty: "CSVデータが存在しません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2359:admin.stock.csv.error_limit_notice: "エラーを最大20件まで表示しています。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2360:admin.csv.error.data.require: "%s は必須項目です。 %d 行目のデータを確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2361:admin.csv.error.data.not_registered: "%s : %s がマスターから取得できません。 %d 行目のデータを確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2362:admin.csv.error.data.out_of_stock: "%d 行目の%s : %s の在庫個数が足りません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2363:admin.csv.error.data.string_max_length: "%d 行目の %s は %d 文字以内で入力してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2364:admin.csv.error.product.invalid: "%d 行目の %s の値が異常です。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2365:admin.csv.error.product.not_exists: "%d 行目の %s ではデータを取得できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2366:admin.csv.error.product.required: "%d 行目の %s が設定されていません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2367:admin.csv.error.product.over_zero: "%d 行目の %s は0以上の数値を設定してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2368:admin.csv.error.product.max_length: "%d 行目の %s は %d桁以内の数値 を設定してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2369:admin.csv.error.product.filename: '%d 行目の %s には末尾に "/" や "../" を使用できません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2370:admin.csv.error.product.price_valid: "%d 行目の販売価格は買取価格より大きい価格を設定してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2371:admin.csv.error.product.new_product_cannot_be_deleted: "%d 行目の新規登録商品には 商品削除フラグ 「削除する」を指定できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2372:admin.csv.error.product.product_code_duplicated: "%d 行目の商品コードの値 %s は重複して登録されてるため更新できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2373:admin.csv.error.product.non_unique_card_detail_found: "%d 行目で該当するカード情報が複数見つかったため更新できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2374:admin.csv.error.product.product_with_card_detail_exists: "%d 行目のカード %s は商品マスターに登録済みです。登録をスキップします。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2375:admin.csv.error.product.product_update_lock_timeout: "%d 行目の商品が他の処理により更新中です。少し時間を空けてから再度更新してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2376:admin.csv.error.product.new_product_be_duplicate: "%d 行目の新規登録商品の商品コード %s は重複して登録されようとしているため登録できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2377:admin.csv.error.product.new_product_smaregi_product_code_duplicate: "%d 行目の新規登録商品のスマレジ商品コード %s は重複して登録されようとしているため登録できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2378:admin.csv.error.product.abolished_status_with_stock: "%d 行目の %s を「廃止」に変更する場合、在庫が0である必要があります。EC-CUBE内在庫またはスマレジ内在庫に在庫が存在するため、変更できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2379:admin.csv.error.product.smaregi_alignment_flg_off_with_stock: "%d 行目の %s を「無効」に変更する場合、スマレジ内在庫が0である必要があります。スマレジ内在庫に在庫が存在するため、変更できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2380:admin.csv.error.product.product_class_count_invalid_for_update: "%d 行目の %s=%d に該当する商品規格が %d 件です。更新時は 1 件である必要があります。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2381:admin.csv.error.storage_code.not_exists: "%d 行目の %s ではデータを取得できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2382:admin.csv.error.inventory_plan_detail.product_code_not_exists: "%d 行目の商品コード %s ではデータを取得できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2383:admin.csv.error.inventory_plan_detail.product_stock_not_found: "%d 行目の商品コード %s は、棚卸計画で指定された店舗・在庫区分の在庫が存在しません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2384:admin.csv.error.inventory_plan_detail.plan_base_info_or_stock_location_required: 棚卸計画に店舗または在庫区分が設定されていないため、CSV登録できません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2385:admin.csv.error.inventory_plan_detail.product_code_duplicated: "%d 行目の商品コード %s は重複して登録されようとしているため登録できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2386:admin.csv.error.inventory_plan_detail.product_code_non_unique: "%d 行目の商品コード %s が複数の商品規格に設定されているため特定できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2387:admin.csv.error.inventory_plan_detail.product_code_not_registered: "%d 行目の商品コード %s は棚卸計画に登録されていません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2388:admin.csv.error.inventory_plan_detail.actual_stock_invalid: "%d 行目: 棚卸数量は0以上の整数で入力してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2389:admin.csv.error.shelf_number.name_duplicate: "名称がすでに登録されています。 %d 行目のデータを確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2391:admin.csv.error.category.update_requires_sort: "%d 行目: カテゴリIDが指定されている更新行では、表示ランクを入力してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2392:admin.csv.error.category.not_found: "%d 行目: 指定したカテゴリIDのカテゴリが見つかりません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2393:admin.csv.error.category.new_must_not_have_sort: "%d 行目: 新規登録の行では表示ランクを入力しないでください（取込時に自動設定されます）。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2394:admin.csv.error.category.id_equals_parent: "%d 行目: カテゴリIDと親カテゴリIDに同じ値を指定することはできません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2395:admin.csv.error.category.parent_is_descendant: "%d 行目: 親カテゴリに、指定カテゴリの子孫を指定することはできません（循環参照になります）。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2396:admin.csv.error.category.parent_not_found: "%d 行目: 指定した親カテゴリIDのカテゴリが見つかりません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2397:admin.csv.error.category.nest_level_exceeded: "%d 行目: 親を指定した場合の階層が上限（%d 階層まで）を超えます。親カテゴリを見直してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2398:admin.csv.error.export.not_registered: 存在しないカードIDが含まれています。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2399:admin.csv.error.export.no_card_selected: 1つ以上のカードを選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2400:admin.csv.error.export.no_card_data: カードデータが存在しないためエクスポートできません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2401:admin.csv.error.customer.not_member: "%row% 行目の会員は非会員状態の可能性があります。データ確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2402:admin.csv.error.exception.datetime: "%row% 行目の %column% で日時の形式が不正です。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2412:admin.order.shipping_csv_upload: 出荷CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2527:admin.order.csv_shipping_date_description: 出荷日を「YYYY-MM-DD」の形式で設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2528:admin.order.order_csv: 受注CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2529:admin.order.shipping_csv: 出荷CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2576:admin.order.shipping_csv.shipping_id_col: 出荷ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2577:admin.order.shipping_csv.shipping_id_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2578:admin.order.shipping_csv.tracking_number_col: お問い合わせ番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2579:admin.order.shipping_csv.tracking_number_description: 半角英数字かハイフンのみで設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2580:admin.order.shipping_csv.shipping_date_col: 出荷日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2581:admin.order.shipping_csv.shipping_date_description: "出荷日を「YYYY-MM-DD」の形式で設定"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2736:admin.customer.csv: CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2938:admin.setting.shop.csv_setting: CSV出力項目設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2977:admin.setting.shop.shop.expensive_threshold1: 高額商品閾値1
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2978:admin.setting.shop.shop.expensive_threshold2: 高額商品閾値2
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2979:admin.setting.shop.shop.expensive_threshold3: 高額商品閾値3
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2990:admin.setting.shop.shop.stack_paper_threshold: スタック用紙高額商品しきい値価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3110:admin.setting.shop.csv.csv_columns: CSV出力項目
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3111:admin.setting.shop.csv.csv_type: CSV種別
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3112:admin.setting.shop.csv.non_output_colmuns: 出力しない項目
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3113:admin.setting.shop.csv.output_colmuns: 出力する項目
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3114:admin.setting.shop.csv.operation: 操作項目
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3115:admin.setting.shop.csv.operation__output: 出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3116:admin.setting.shop.csv.operation__release: 解除
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3117:admin.setting.shop.csv.operation__all_output: すべて出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3118:admin.setting.shop.csv.operation__all_release: すべて解除
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3119:admin.setting.shop.csv.order: 項目順序
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3120:admin.setting.shop.csv.order__up: ひとつ上へ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3121:admin.setting.shop.csv.order__down: ひとつ下へ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3122:admin.setting.shop.csv.order__top: 一番上へ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3123:admin.setting.shop.csv.order__bottom: 一番下へ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3124:admin.setting.shop.csv.how_to_use: |
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3558:tooltip.product.csv_upload: 所定の型のCSVデータを用いて商品を一括で登録することができます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3559:tooltip.product.csv_format: 雛形ファイルをダウンロードして編集すれば、簡単に所定の型のCSVデータを作成できます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3560:tooltip.category.csv_upload: 所定の型のCSVデータを用いてカテゴリを一括で登録することができます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3561:tooltip.category.csv_format: 雛形ファイルをダウンロードして編集すれば、簡単に所定の型のCSVデータを作成できます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3579:tooltip.shipping.csv_upload: 所定の型のCSVデータを用いて出荷情報を一括で登録することができます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3580:tooltip.shipping.csv_format: 雛形ファイルをダウンロードして編集すれば、簡単に所定の型のCSVデータを作成できます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3629:tooltip.setting.shop.csv.csv_columns: 各種のデータをCSVで出力できます。出力したい項目をこちらで設定することが可能です。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3630:tooltip.setting.shop.csv.csv_type: 設定したいCSVの種類を指定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3657:tooltip.class_name.csv_upload: 所定の型のCSVデータを用いて規格を一括で登録することができます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3658:tooltip.class_name.csv_format: 雛形ファイルをダウンロードして編集すれば、簡単に所定の型のCSVデータを作成できます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3882:admin.product.department_csv_upload: 部門CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3974:admin.product.inventory_plan.csv_import_title: 棚卸商品CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3975:admin.product.inventory_plan.csv_import_limit: '1ファイルの登録上限は %max% 件です'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3976:admin.product.inventory_plan.csv_import_submit: 商品登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3977:admin.product.inventory_plan.csv_modal.csv_file: CSVファイル
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3978:admin.product.inventory_plan.csv_modal.no_file_selected: ファイルが選択されていません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3979:admin.product.inventory_plan.csv_modal.format_product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3980:admin.product.inventory_plan.csv_modal.format_product_code_desc: 棚卸計画に登録する商品コードを入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3981:admin.product.inventory_plan.csv_modal.format_actual_stock: 棚卸数量
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3982:admin.product.inventory_plan.csv_modal.format_actual_stock_desc: 棚卸数量を整数で入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3983:admin.product.inventory_plan.quantity_csv_import_title: 棚卸商品数量CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3984:admin.product.inventory_plan.quantity_csv_import_submit: 数量登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3985:admin.product.inventory_plan.quantity_csv_import.complete: 棚卸数量を登録しました。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4085:admin.customer.delivery_csv: 配送先情報CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4086:admin.customer.delivery_csv.csv_invalid_zipcode: "%d行目の郵便番号の入力に誤りがあります（郵便番号1・2が両方未入力の場合は海外郵便番号が必須です）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4087:admin.customer.delivery_csv.csv_invalid_zipcode_partial: "%d行目の郵便番号の入力に誤りがあります（郵便番号1と2はどちらか一方のみの入力はできません）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4088:admin.customer.delivery_csv.csv_invalid_pref: "%d行目の都道府県の入力に誤りがあります（日本の場合は必須、海外の場合は入力不可）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4141:admin.setting.shop.custom_csv: カスタムCSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4142:admin.setting.shop.custom_csv_menu: カスタムCSV出力設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4143:admin.setting.shop.custom_csv_setting: カスタムCSV出力項目設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4144:admin.setting.shop.csv.save.complete: CSV出力項目を保存しました。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4145:admin.setting.shop.csv.output_name: 出力名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4146:admin.setting.shop.csv.delete_modal__message: このCSV出力設定を削除してもよろしいでしょうか？
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4320:admin.deck.csv_import: CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4321:admin.deck.csv_export: CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4322:admin.deck.csv_export_no_selection: CSV出力対象のデッキが選択されていません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4385:admin.deck.csv_upload_title: デッキ登録CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4386:admin.deck.csv_upload_header: デッキ登録CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4387:admin.deck.csv_format_title: デッキ登録CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4388:admin.deck.csv.commander: 統率者
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4389:admin.deck.csv.error.format_invalid: "%s のフォーマットが一致しません。 %d 行目のデータを確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4390:admin.deck.csv.error.deck_not_found: "指定されたデッキID %s が存在しません。 %d 行目のデータを確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4391:admin.deck.csv.error.deck_type_invalid: "指定されたデッキID %s は event タイプではありません。 %d 行目のデータを確認してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4414:admin.archetype.csv_import: CSV取り込み
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4415:admin.archetype.csv_upload_title: アーキタイプ登録CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4416:admin.archetype.csv_upload_header: アーキタイプ登録CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4417:admin.archetype.csv_format_title: アーキタイプ登録CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4456:admin.card.card_csv: カードCSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4457:admin.card.card_csv_upload_title: カードCSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4458:admin.card.card_csv_format_title: カードCSVフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4459:admin.card.csv_tsv_not_allowed: TSVファイルはアップロードできません。CSVファイルをアップロードしてください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4549:admin.stock.move.shortage_csv_register: 欠品CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4550:admin.stock.move.shortage_csv_invalid_status: 欠品CSV登録可能なステータスではありません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4551:admin.stock.move.shortage_csv_modal.note: 欠品点数をCSVで一括登録します。欠品点数を入力した行のみ更新され、空欄の行およびCSVに含まれない明細は変更されません。0を入力した場合は欠品点数を0に更新します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4552:admin.stock.move.shortage_csv_modal.csv_file: CSVファイル
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4553:admin.stock.move.shortage_csv_modal.csv_file_limit: 上限あり
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4554:admin.stock.move.shortage_csv_modal.csv_file_required: CSVファイルを選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4555:admin.stock.move.shortage_csv_import.file_not_found: 'ファイルが読み込めません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4556:admin.stock.move.shortage_csv_import.shortage_qty_invalid: '%line%行目: 欠品点数は0以上の整数で入力してください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4557:admin.stock.move.shortage_csv_import.product_code_duplicated: '%line%行目: 商品コード「%code%」がCSV内で重複しています。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4558:admin.stock.move.shortage_csv_import.product_code_not_found: '%line%行目: 商品コード「%code%」がこの在庫移動に見つかりません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4559:admin.stock.move.shortage_csv_import.shortage_qty_exceeds_move: '%line%行目: 欠品点数（%shortage%）が移動点数（%max%）を超えています。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4560:admin.stock.move.shortage_csv_modal.format_product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4561:admin.stock.move.shortage_csv_modal.format_product_code_desc: 欠品対象の商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4562:admin.stock.move.shortage_csv_modal.format_product_name: 商品名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4563:admin.stock.move.shortage_csv_modal.format_product_name_desc: 参照情報（更新対象外）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4564:admin.stock.move.shortage_csv_modal.format_move_qty: 移動点数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4565:admin.stock.move.shortage_csv_modal.format_move_qty_desc: 参照情報（更新対象外）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4566:admin.stock.move.shortage_csv_modal.format_shortage_qty: 欠品点数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4567:admin.stock.move.shortage_csv_modal.format_shortage_qty_desc: 欠品点数を記入（0以上の整数。空欄は更新対象外）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4590:admin.stock.move.csv_output: CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4591:admin.stock.move.differential_csv_register: 差分CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4592:admin.stock.move.differential_csv_invalid_status: 差分CSV登録可能なステータスではありません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4593:admin.stock.move.differential_csv_modal.note: 差分点数をCSVで一括登録します。差分点数を入力した行のみ更新され、空欄の行およびCSVに含まれない明細は変更されません。0を入力した場合は差分点数を0に更新します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4594:admin.stock.move.differential_csv_modal.csv_file: CSVファイル
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4595:admin.stock.move.differential_csv_modal.csv_file_limit: 上限あり
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4596:admin.stock.move.differential_csv_modal.csv_file_required: CSVファイルを選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4597:admin.stock.move.differential_csv_import.difference_qty_invalid: '%line%行目: 差分点数は整数で入力してください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4598:admin.stock.move.differential_csv_import.product_code_duplicated: '%line%行目: 商品コード「%code%」がCSV内で重複しています。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4599:admin.stock.move.differential_csv_import.product_code_not_found: '%line%行目: 商品コード「%code%」がこの在庫移動に見つかりません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4600:admin.stock.move.differential_csv_import.difference_qty_exceeds_actual_move: '%line%行目: 差分点数（%difference%）が実移動点数（%max%）を超えています。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4601:admin.stock.move.differential_csv_import.difference_qty_out_of_range: '%line%行目: 差分点数は%min%～%max%の範囲で入力してください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4602:admin.stock.move.differential_csv_modal.format_product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4603:admin.stock.move.differential_csv_modal.format_product_code_desc: 差分対象の商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4604:admin.stock.move.differential_csv_modal.format_product_name: 商品名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4605:admin.stock.move.differential_csv_modal.format_product_name_desc: 参照情報（更新対象外）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4606:admin.stock.move.differential_csv_modal.format_actual_move_qty: 実移動点数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4607:admin.stock.move.differential_csv_modal.format_actual_move_qty_desc: 参照情報（更新対象外）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4608:admin.stock.move.differential_csv_modal.format_difference_qty: 差分点数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4609:admin.stock.move.differential_csv_modal.format_difference_qty_desc: 差分点数を記入（整数。不足は正の数、追加は負の数。空欄は更新対象外）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4664:admin.stock.list.search_required_for_csv: 検索条件を指定してからCSV出力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4697:admin.stock.list.recommend_csv: 在庫リコメンドCSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4698:admin.stock.list.stock_info_csv: 在庫情報CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4699:admin.stock.list.custom_csv: 在庫情報カスタムCSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4700:admin.stock.list.custom_csv_no_formats: フォーマットが登録されていません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4701:admin.stock.list.custom_csv_settings: 出力項目設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4793:admin.stock.barcode_replacement_list.csv_export: バーコード貼替リストCSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4822:admin.stock.split_join.csv_preview_error: プレビューを表示できませんでした。ログイン状態を確認するか、しばらく経ってから再度お試しください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4826:admin.stock.split_join.split_csv_register: 在庫分割CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4827:admin.stock.split_join.join_csv_register: 在庫結合CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4828:admin.stock.split_join.list_csv_import_submit: CSVから登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4830:admin.stock.split_join.list_csv_join_import_done: '%count% 件の結合を登録し、欠品入力まで進めました。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4831:admin.stock.split_join.list_csv_split_import_done: '%count% 件の分割を登録し、承認申請まで進めました。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4898:admin.stock.split_join.csv_file_not_found: 'CSVファイルが見つかりません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4899:admin.stock.split_join.csv_header_invalid: 'CSVのヘッダー形式が不正です。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4900:admin.stock.split_join.csv_parse_failed: 'CSVの解析に失敗しました。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4901:admin.stock.split_join.csv_product_not_found: '%line%行目: 商品コード「%code%」が同一店舗・在庫区分で見つかりません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4902:admin.stock.split_join.csv_export: 在庫分割結合CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4903:admin.stock.split_csv_modal.store: 店舗
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4904:admin.stock.split_csv_modal.store_placeholder: 選択してください
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4905:admin.stock.split_csv_modal.inventory_category: 在庫区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4906:admin.stock.split_csv_modal.csv_file: CSVファイル選択
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4907:admin.stock.split_csv_modal.csv_file_limit: 1ファイルの登録上限は 2,000 件です
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4909:admin.stock.split_csv_modal.register: 登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4910:admin.stock.split_csv_modal.approval_notification_label: 承認通知先
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4911:admin.stock.split_csv_modal.format_source_code: 分割元商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4912:admin.stock.split_csv_modal.format_source_code_desc: 分割元商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4913:admin.stock.split_csv_modal.format_split_quantity: 分割数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4914:admin.stock.split_csv_modal.format_split_quantity_desc: 分割数を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4915:admin.stock.split_csv_modal.format_target_code: 分割先商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4916:admin.stock.split_csv_modal.format_target_code_desc: 分割先商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4917:admin.stock.split_csv_modal.format_target_stock: 分割先在庫数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4918:admin.stock.split_csv_modal.format_target_stock_desc: 分割先在庫数を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4919:admin.stock.split_csv_modal.no_file_selected: 選択されていません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4920:admin.stock.split_csv_modal.template_download: 雛形ファイルダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4921:admin.stock.join_csv_modal.store: 店舗
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4922:admin.stock.join_csv_modal.store_placeholder: 選択してください
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4923:admin.stock.join_csv_modal.inventory_category: 在庫区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4924:admin.stock.join_csv_modal.csv_file: CSVファイル選択
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4925:admin.stock.join_csv_modal.csv_file_limit: 1ファイルの登録上限は 2,000 件です
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4926:admin.stock.join_csv_modal.format_destination_code: 結合先商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4927:admin.stock.join_csv_modal.format_destination_code_desc: 結合先となる商品コードを入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4928:admin.stock.join_csv_modal.format_join_quantity: 結合元在庫数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4929:admin.stock.join_csv_modal.format_join_quantity_desc: 結合する数量を整数で入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4930:admin.stock.join_csv_modal.format_source_code: 結合元商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4931:admin.stock.join_csv_modal.format_source_code_desc: 結合元商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4932:admin.stock.join_csv_modal.format_source_stock_category: 結合元在庫区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4933:admin.stock.join_csv_modal.format_source_stock_category_desc: "結合元の在庫区分を記入（1: EC-CUBE, 2: スマレジ）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4934:admin.stock.join_csv_modal.format_source_stock_quantity: 結合元在庫数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4935:admin.stock.join_csv_modal.format_source_stock_quantity_desc: 結合元在庫数を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4936:admin.stock.join_csv_modal.register: 登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4937:admin.stock.join_csv_modal.template_download: 雛形ファイルダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4954:admin.stock.split.csv_register: 分割先商品CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4977:admin.stock.split.csv_column_invalid: 'CSVの列名が不正です。1行目に「商品コード」「分割先在庫数」が必要です。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4978:admin.stock.split.csv_same_as_source: '%line%行目: 分割元と同じ商品コードは分割先に指定できません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4984:admin.stock.split.new_destination_csv_modal.title: 分割先CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4985:admin.stock.split.new_destination_csv_modal.note: CSVファイルをアップロードして分割先商品を一括登録します。登録済みの分割先リストは上書きされます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4986:admin.stock.split.new_destination_csv_modal.product_register: 分割先商品を登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4987:admin.stock.split.new_destination_csv_modal.format_product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4988:admin.stock.split.new_destination_csv_modal.format_product_code_desc: 分割先となる商品コードを入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4989:admin.stock.split.new_destination_csv_modal.format_destination_qty: 分割先数量
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4990:admin.stock.split.new_destination_csv_modal.format_destination_qty_desc: 分割先の分割数量を整数で入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4991:admin.stock.split.new_destination_csv_modal.csv_file: CSVファイル (上限あり)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4992:admin.stock.split.new_destination_csv_modal.no_file_selected: ファイルが選択されていません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4993:admin.stock.split.new_destination_csv_modal.template_download: 雛形ファイルダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5025:admin.stock.join.new_source_csv_modal.title: 結合元商品CSV登録（既に登録済みの商品は削除して登録します。）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5026:admin.stock.join.new_source_csv_modal.note: 既に画面に登録済みの結合元はすべて削除し、CSVの内容で置き換えます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5027:admin.stock.join.new_source_csv_modal.product_register: 商品登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5028:admin.stock.join.new_source_csv_modal.format_product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5029:admin.stock.join.new_source_csv_modal.format_product_code_desc: 結合元商品の商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5030:admin.stock.join.new_source_csv_modal.format_join_qty: 結合元在庫数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5031:admin.stock.join.new_source_csv_modal.format_join_qty_desc: 結合元在庫数を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5032:admin.stock.join.new_source_csv_modal.csv_file: CSVファイル選択（1ファイルの登録上限は 10,000 件です）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5033:admin.stock.join.new_source_csv_modal.no_file_selected: 選択されていません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5034:admin.stock.join.new_source_csv_modal.template_download: 雛形ファイルダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5052:admin.stock.join.shortage_csv_modal.title: 検品CSV登録（既に仮登録済みの欠品点数は削除して仮登録します。）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5053:admin.stock.join.shortage_csv_modal.button_label: 欠品仮登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5054:admin.stock.join.shortage_csv_modal.open_button: 検品CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5055:admin.stock.join.shortage_csv_modal.csv_file: CSVファイル選択（1ファイルの登録上限は 10,000 件です）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5056:admin.stock.join.shortage_csv_modal.note: 欠品点数をCSVで一括登録します。登録済みの欠品点数は上書きされます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5057:admin.stock.join.shortage_csv_modal.format_product_code_desc: 商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5058:admin.stock.join.shortage_csv_modal.format_shortage_qty: 欠品点数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5059:admin.stock.join.shortage_csv_modal.format_shortage_qty_desc: 欠品点数を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5060:admin.stock.join.shortage_csv_modal.template_download: 雛形ファイルダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5061:admin.stock.join.shortage_csv_modal.csv_file_required: CSVファイルを選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5067:admin.stock.join.csv_register: 結合元商品CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5120:admin.stock.join.csv_column_invalid: 'CSVの列名が不正です。1行目に「商品コード」「結合元在庫数」が必要です。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5121:admin.stock.join.csv_same_as_destination: '%line%行目: 結合先と同一の在庫は結合元に指定できません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5176:admin.csv.error.export.not_registered_stock_history_id: 存在しない在庫履歴IDが含まれています。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5177:admin.csv.error.export.no_stock_history_data: 在庫履歴データが存在しないためエクスポートできません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5180:admin.stock.change_csv.title: 在庫変更CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5181:admin.stock.change_csv.subtitle: 在庫管理
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5182:admin.stock.change_csv.list: 在庫変更CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5183:admin.stock.change_csv.file_upload_title: CSVファイルをアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5184:admin.stock.change_csv.base_info_name: 店舗
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5185:admin.stock.change_csv.stock_location: 在庫場所
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5186:admin.stock.change_csv.change_type_detail: 在庫変動区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5187:admin.stock.change_csv.hange_type_detail_empty: 在庫変動区分を選択
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5188:admin.stock.change_csv.stock_change_reason: 在庫変動理由
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5189:admin.stock.change_csv.approval_department: 承認通知先
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5190:admin.stock.change_csv.approval_department_empty: 所属を選択
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5191:admin.stock.change_csv.approval_members_empty: 選択してください
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5192:admin.stock.change_csv.file_format_title: CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5193:admin.stock.change_csv.history_title: 在庫変更CSV登録履歴（承認テーブルの情報を参照）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5194:admin.stock.change_csv.history_approval_status: 承認状態
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5195:admin.stock.change_csv.history_filename: ファイル名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5196:admin.stock.change_csv.history_store: 店舗/在庫場所
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5197:admin.stock.change_csv.history_class_count: 対象商品規格数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5198:admin.stock.change_csv.history_total_change_quantity: 合計在庫増減数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5199:admin.stock.change_csv.history_total_cost_change: 合計総原価増減数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5200:admin.stock.change_csv.history_type_detail: 在庫変動区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5201:admin.stock.change_csv.history_type_detail_stock: 入庫
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5202:admin.stock.change_csv.history_type_detail_disposal: 廃棄
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5203:admin.stock.change_csv.history_registration_date: 登録日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5204:admin.stock.change_csv.history_registration_member: 登録者
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5205:admin.stock.change_csv.history_approval_date: 承認日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5206:admin.stock.change_csv.history_approval_member: 承認者
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5207:admin.stock.change_csv.history_approval_upapproved: 未承認
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5208:admin.stock.change_csv.history_approval_approved: 承認済
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5209:admin.stock.change_csv.history_approval_waiting: 承認待ち
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5210:admin.stock.change_csv.shop_not_permitted: 編集権限のない店舗が選択されています。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5235:admin.stock.move_instruction.csv_download_record: 在庫移動実績入力用CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5236:admin.stock.move_instruction.csv_download_invoice: 送り状CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5237:admin.stock.move_instruction.csv_invoice_select_rows: 送り状CSVを出力する在庫移動指示にチェックを入れてください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5240:admin.stock.move_instruction.csv_registration: CSVファイル登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5241:admin.stock.move_instruction.csv_registration_button: 在庫移動実績CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5242:admin.stock.move_instruction.csv_registration_modal_lead: CSVファイルを選択し、登録ボタンをクリックしてください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5243:admin.stock.move_instruction.csv_registration_modal_overwrite_note: （既に在庫移動実績を登録している場合、上書きされます）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5244:admin.stock.move_instruction.csv_registration_file_limit: （1ファイルの登録上限は10,000件です）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5245:admin.stock.move_instruction.csv_format_title: CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5246:admin.stock.move_instruction.csv_format_instruction_id: 移動指示ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5247:admin.stock.move_instruction.csv_format_instruction_id_desc: 移動指示リストのIDを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5248:admin.stock.move_instruction.csv_format_move_from_shop: 出庫元店舗(名称)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5249:admin.stock.move_instruction.csv_format_move_from_shop_desc: 出庫元店舗の名称を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5250:admin.stock.move_instruction.csv_format_move_to_shop: 入庫先店舗(名称)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5251:admin.stock.move_instruction.csv_format_move_to_shop_desc: 入庫先店舗の名称を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5252:admin.stock.move_instruction.csv_format_tracking_no: 送り状No.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5253:admin.stock.move_instruction.csv_format_tracking_no_desc: 送り状No.を入力、複数ある場合はカンマ(,)で区切る(スペースなどは不要)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5258:admin.stock.move_instruction.high_total_price_col: 高額商品合計
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5271:admin.stock.move_instruction.csv_tracking_file_invalid: ファイルが不正です。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5272:admin.stock.move_instruction.csv_tracking_header_invalid: CSVのヘッダーが不正です。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5273:admin.stock.move_instruction.csv_tracking_no_valid_rows: 有効な行がありません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5274:admin.stock.move_instruction.csv_tracking_success: 送り状No.を一括登録しました。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5275:admin.stock.move_instruction.csv_tracking_upload_error_detail: アップロードに失敗しました。詳細：%detail%
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5276:admin.stock.move_instruction.csv_tracking_error_instruction_not_found: 移動指示が見つかりません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5277:admin.stock.move_instruction.csv_tracking_error_shop_mismatch_from: 出庫元店舗が一致しません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5278:admin.stock.move_instruction.csv_tracking_error_shop_mismatch_to: 入庫先店舗が一致しません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5279:admin.stock.move_instruction.csv_tracking_error_tracking_no_empty: 送り状Noが空欄です
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5280:admin.stock.move_instruction.csv_tracking_error_register_failed: 登録処理中にエラーが発生しました（%detail%）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5281:admin.stock.move_instruction.csv_tracking_errors_capped: エラーは20件まで表示されます
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5319:admin.stock.approval_list.csv_download: CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5338:admin.stock.approval_list.approval_target_csv: 在庫変更CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5345:admin.stock.approval_list.confirm_modal_message_csv: 在庫変更CSV登録にて登録した在庫情報はCSVダウンロードして確認してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5353:admin.stock.approval_list.csv_export_no_session: 明細を表示するための選択情報がありません。確認モーダルを開き直してからCSVダウンロードしてください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5369:admin.stock.approval_list.line_items.over_display_limit_csv_hint: 参照している在庫情報が表示上限（%max%件）を超えているため、全件を確認する場合はCSVダウンロードして確認してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5400:admin.stock.move_transfer.action_barcode_csv_export: バーコード印刷用CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5401:admin.stock.move_transfer.action_move_transfer_csv_export: 在庫移動振替CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5402:admin.stock.move_transfer.action_return_list_csv_export: 戻しリストCSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5407:admin.stock.move_transfer.return_list_csv_export.no_selection: 1つ以上の在庫移動情報を選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5408:admin.stock.move_transfer.barcode_csv_export.no_selection: 1つ以上の在庫移動・振替を選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5409:admin.stock.move_transfer.barcode_csv_export.not_found: 対象のデータが見つかりません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5410:admin.stock.move_transfer.barcode_csv_export.not_move_type: 'ID: %moveTransferId% は移動ではないため出力できません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5411:admin.stock.move_transfer.barcode_csv_export.not_smaregi_destination: 'ID: %moveTransferId% は入庫先がスマレジ在庫ではないため出力できません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5412:admin.stock.move_transfer.barcode_csv_export.move_to_shop_not_set: 'ID: %moveTransferId% は入庫先店舗が設定されていません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5413:admin.stock.move_transfer.barcode_csv_export.shop_not_permitted: 'ID: %moveTransferId% は権限のない店舗のデータです。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5414:admin.stock.move_transfer.barcode_csv_export.id_not_found: 'ID: %moveTransferId% は存在しません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5415:admin.stock.move_transfer.barcode_csv_export.multiple_shops: 複数店舗の在庫移動・振替情報を同時に処理することはできません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5418:admin.stock.move_transfer.csv_file_registration: CSVファイル登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5419:admin.stock.move_transfer.csv_register_move: 在庫移動CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5420:admin.stock.move_transfer.csv_register_transfer: 在庫振替CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5421:admin.stock.move_transfer.csv_move_modal.file_row_limit_hint: （1ファイルの登録上限は 10,000 件です）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5422:admin.stock.move_transfer.csv_move_modal.move_from_stock_location: 出庫元在庫区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5423:admin.stock.move_transfer.csv_move_modal.move_to_stock_location: 入庫先在庫区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5424:admin.stock.move_transfer.csv_move_modal.col_product_code_hint: 商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5425:admin.stock.move_transfer.csv_move_modal.col_move_quantity_hint: 移動点数を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5426:admin.stock.move_transfer.csv_transfer_modal.store: 店舗
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5427:admin.stock.move_transfer.csv_transfer_modal.transfer_from_stock_location: 振替元在庫区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5428:admin.stock.move_transfer.csv_transfer_modal.member: メンバー
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5429:admin.stock.move_transfer.csv_transfer_modal.col_src_product_code: 振替元商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5430:admin.stock.move_transfer.csv_transfer_modal.col_dest_product_code: 振替先商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5431:admin.stock.move_transfer.csv_transfer_modal.col_transfer_quantity: 振替点数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5432:admin.stock.move_transfer.csv_transfer_modal.col_src_product_code_hint: 振替元商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5433:admin.stock.move_transfer.csv_transfer_modal.col_dest_product_code_hint: 振替先商品コードを記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5434:admin.stock.move_transfer.csv_transfer_modal.col_transfer_quantity_hint: 振替点数を記入
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5524:admin.purchase.online.csv_export.no_selection: 1つ以上の買取注文情報を選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5525:admin.purchase.online.csv_export.not_registered_buy_order_id: 存在しない買取注文情報IDが含まれています。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5526:admin.purchase.online.csv_export.bad_csv_type: 不正なCSV種別です。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5527:admin.purchase.online.btn.csvexport: 古物台帳入力用CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5528:admin.purchase.online.btn.csvexport_deposit: 入金CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5529:admin.purchase.online.btn.csvexport_product_list: 買取商品一覧CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5530:admin.purchase.online.detail.btn.csvexport: 古物台帳入力用CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5531:admin.purchase.online.detail.btn.csvexport_product_list: 買取商品一覧CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5535:admin.purchase.online.btn.csv_export_product_cancel: 買取商品（キャンセル）CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5536:admin.purchase.online.btn.csv_export_return_list: 戻しリストCSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5807:admin.order.order_csv.download: 受注CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5808:admin.order.shipping_csv.download: 出荷CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5809:admin.order.order_csv.setting: 受注CSV出力項目設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5810:admin.order.shipping_csv.setting: 出荷CSV出力項目設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5811:admin.order.custom_order_csv.download: カスタム受注CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5812:admin.order.custom_shipping_csv.download: カスタム配送CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5814:admin.order.order.custom_csv.setting: 出力項目設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5815:admin.search_product.product_code: 商品コード/言語/状態/基準価格/高額商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5854:admin.event.entry.bulk_csv_upload_title: イベント一括登録CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5855:admin.event.entry.bulk_csv_header: イベント一括登録CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5856:admin.event.entry.bulk_csv_format_title: イベント一括登録CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5857:tooltip.event.entry.bulk_csv_upload: 所定の型のCSVファイルを選択し、一括登録を実行するとイベントを登録できます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5858:tooltip.event.entry.bulk_csv_format: 雛形ファイルをダウンロードして編集すれば、所定の型のイベント一括登録用CSVデータを作成できます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5859:admin.event.entry.bulk_csv.error.shop_not_editable: '行%line%: 指定した店舗は登録できません（権限がありません）。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5860:admin.event.entry.bulk_csv.error.format_not_found: '行%line%: フォーマット名が正しくないか、マスタに存在しません（複数指定はカンマ区切り）。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5861:admin.event.entry.bulk_csv.error.schedule_without_start: '行%line%: 開始時間が空欄のとき、日程列のみ入力することはできません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5862:admin.event.entry.bulk_csv.error.reception_time_required: '行%line%: 受付が「あり」のときは受付時間From・Toを入力してください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5863:admin.event.entry.bulk_csv.error.reception_time_order: '行%line%: 受付時間のFromはToより前である必要があります。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5864:admin.event.entry.bulk_csv.error.reception_end_after_event_start: '行%line%: 受付時間Toはイベント開始時間以前である必要があります。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5865:admin.event.entry.bulk_csv.error.online_reception_time_required: '行%line%: オンライン受付が「あり」のときはオンライン受付時間From・Toを入力してください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5866:admin.event.entry.bulk_csv.error.online_reception_time_order: '行%line%: オンライン受付時間のFromはToより前である必要があります。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5867:admin.event.entry.bulk_csv.error.online_reception_end_not_before_event_start: '行%line%: オンライン受付終了はイベント開始時間より前である必要があります。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5868:admin.event.entry.bulk_csv.error.team_battle_invalid: '行%line%: チーム戦は0または1で指定してください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6055:admin.event.entry.csv_download: CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6056:admin.event.entry.csv_column_settings: 出力項目設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6195:admin.analysis.used_card.csv_download: 特集タグ編集CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6622:front.seo.product_list.meta_description: 'マジック：ザ・ギャザリング | %category%の商品をお探しならこちらから。日本最大級の在庫数を誇るMTG通販サイト「晴れる屋」には、通販として期間限定セール、デッキセットの販売や、初心者の方向けの入門用商品も多数販売しています。また、カード高額買取、豊富なカード情報、デッキ検索など情報サイトとしても活用いただけます。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6623:front.seo.purchase_top.page_title: 'MTG高額買取 | 晴れる屋 - MTG専門店'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6624:front.seo.purchase_top.meta_description: 'マジック：ザ・ギャザリング高額買取 | MTGの買取なら日本最大級の専門店、晴れる屋へ！送料・手数料無料のネット買取！不要なカードをまとめて送るだけ！高価買取カード一覧も公開中。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6627:front.seo.purchase_list.meta_description: 'マジック：ザ・ギャザリング | %category%の高額買取なら日本最大級 MTG通販サイト「晴れる屋」で。通販として期間限定セール、デッキセットの販売や、初心者の方向けの入門用商品も多数販売しています。豊富なカード情報、デッキ検索など情報サイトとしても活用いただけます。'
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:3452:	 (44813,4315,1,2,164,334,1,NULL,'シミック連合にとって、紋章は名誉を示すものではなく商標である。この見慣れたシンボルはあらゆる生物学的な消耗品につけられていて、卓絶した技術と独創的な革新と高額な値段を意味している。','For the Simic Combine, its sigil serves not as an emblem of honor but as a trademark. Its familiar image on any biological commodity attests to superb craftsmanship, ingenious innovation, and higher cost.','{1}, {Tap}：{Green}{Blue}を加える。','{1}, {Tap}: Add {Green}{Blue}.','','','227',1,false,0,'2019-03-12 03:18:36+09','2025-07-31 20:49:29+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:32088:	 (58249,4315,1,1,60,286,1,NULL,'シミック連合にとって、紋章は名誉を示すものではなく商標である。この見慣れたシンボルはあらゆる生物学的な消耗品につけられていて、卓絶した技術と独創的な革新と高額な値段を意味している。','For the Simic Combine, its sigil serves not as an emblem of honor but as a trademark. Its familiar image on any biological commodity attests to superb craftsmanship, ingenious innovation, and higher cost.','{1}, {Tap}：{Green}{Blue}を加える。','{1}, {Tap}: Add {Green}{Blue}.','','','166',1,false,0,'2019-03-14 21:13:50+09','2025-07-31 20:49:29+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:47855:	 (65238,4315,1,1,203,286,1,NULL,'シミック連合にとって、紋章は名誉を示すものではなく商標である。この見慣れたシンボルはあらゆる生物学的な消耗品につけられていて、卓絶した技術と独創的な革新と高額な値段を意味している。','For the Simic Combine, its sigil serves not as an emblem of honor but as a trademark. Its familiar image on any biological commodity attests to superb craftsmanship, ingenious innovation, and higher cost.','{1}, {Tap}：{Green}{Blue}を加える。','{1}, {Tap}: Add {Green}{Blue}.','','','215',0,false,0,'2019-03-15 21:46:07+09','2025-07-31 20:49:29+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:47856:	 (65239,4315,1,1,203,334,1,NULL,'シミック連合にとって、紋章は名誉を示すものではなく商標である。この見慣れたシンボルはあらゆる生物学的な消耗品につけられていて、卓絶した技術と独創的な革新と高額な値段を意味している。','For the Simic Combine, its sigil serves not as an emblem of honor but as a trademark. Its familiar image on any biological commodity attests to superb craftsmanship, ingenious innovation, and higher cost.','{1}, {Tap}：{Green}{Blue}を加える。','{1}, {Tap}: Add {Green}{Blue}.','','','216',0,false,0,'2019-03-15 21:46:07+09','2025-07-31 20:49:29+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:178722:	 (213503,110508,1,false,'img/goods/L/CLB/jp/compulsive_research_jp_4j227csvyk.jpg',false,'2022-06-05 01:28:07+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:178723:	 (213504,110508,2,false,'img/goods/L/CLB/en/compulsive_research_en_4j227csvyk.jpg',false,'2022-06-05 01:28:07+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:181861:	 (216679,112207,1,false,'img/goods/L/2X2/jp/child_of_alara_jp_2eg7csvzja.jpg',false,'2022-06-29 01:37:57+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:181862:	 (216680,112207,2,false,'img/goods/L/2X2/en/child_of_alara_en_2eg7csvzja.jpg',false,'2022-06-29 01:37:57+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:189042:	 (224024,116784,2,false,'img/goods/L/UNF/single/carnival_barker_en_csvunrsdrd.jpg',false,'2022-10-01 03:15:12+09'),

codex
候補2件はどちらもヘッダ定義に関する主張です。次に実装の該当コントローラと共通ストリーム出力、画面テンプレートへの受け渡しを行番号付きで確認します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php | sed -n '1,240p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Controller\Admin\Product\Csv;
    17	
    18	use Eccube\Controller\AbstractController;
    19	use Eccube\Entity\Master\MtbCsvImportType;
    20	use Eccube\Entity\Member;
    21	use Eccube\Form\Type\Admin\CsvImportType;
    22	use Eccube\Repository\DtbCsvImportHistoryRepository;
    23	use Eccube\Repository\DtbPriceHistoryRepository;
    24	use Eccube\Repository\ProductClassRepository;
    25	use Eccube\Repository\ProductRepository;
    26	use Eccube\Service\Csv\Importer\CsvImporter;
    27	use Eccube\Service\Csv\Importer\Event\SaleHighPriceImportHandler;
    28	use Eccube\Service\CsvExportService;
    29	use Knp\Component\Pager\PaginatorInterface;
    30	use Symfony\Component\HttpFoundation\File\UploadedFile;
    31	use Symfony\Component\HttpFoundation\RedirectResponse;
    32	use Symfony\Component\HttpFoundation\Request;
    33	use Symfony\Component\HttpFoundation\Response;
    34	use Symfony\Component\HttpFoundation\StreamedResponse;
    35	use Symfony\Component\Routing\Attribute\Route;
    36	
    37	class ProductSaleHighPriceCsvController extends AbstractController
    38	{
    39	    public function __construct(
    40	        private readonly ProductClassRepository $productClassRepository,
    41	        private readonly ProductRepository $productRepository,
    42	        private readonly CsvExportService $csvExportService,
    43	        private readonly PaginatorInterface $paginator,
    44	        private readonly DtbPriceHistoryRepository $priceHistoryRepository,
    45	        private readonly DtbCsvImportHistoryRepository $csvImportHistoryRepository,
    46	    ) {
    47	    }
    48	
    49	    /**
    50	     * セール用高額商品価格変更CSV雛形ファイルダウンロード
    51	     */
    52	    #[Route(path: '/%eccube_admin_route%/product/sale_high_price/csv_template', name: 'admin_product_sale_high_price_csv_template', methods: ['GET'])]
    53	    public function csvTemplate(): StreamedResponse
    54	    {
    55	        return $this->csvTemplateStreamedResponse(
    56	            $this->csvExportService,
    57	            $this->getCsvHeader(),
    58	            'sale_high_price_template.csv'
    59	        );
    60	    }
    61	
    62	    /**
    63	     * セール用高額商品価格変更CSVアップロード画面
    64	     */
    65	    #[Route(path: '/%eccube_admin_route%/product/sale_high_price/csv_upload', name: 'admin_product_sale_high_price_csv_upload', methods: ['GET'])]
    66	    public function csv(Request $request): Response
    67	    {
    68	        $form = $this->createForm(CsvImportType::class);
    69	        $form->handleRequest($request);
    70	
    71	        $pagination = $this->getCsvImportHistoryPaginationParams(
    72	            $request,
    73	            'admin.product.sale_high_price_csv.page_count',
    74	            'admin.product.sale_high_price_csv.page_no',
    75	        );
    76	        $pageCount = $pagination['pageCount'];
    77	        $pageNo = $pagination['pageNo'];
    78	        $pageCountOptions = $pagination['pageCountOptions'];
    79	
    80	        $qb = $this->csvImportHistoryRepository->getQueryBuilderByCsvImportType(MtbCsvImportType::HIGH_PRICE_IMPORT_CSV_ID);
    81	        $importHistoriesPagination = $this->paginator->paginate($qb, $pageNo, $pageCount);
    82	
    83	        $headers = $this->getCsvHeader();
    84	
    85	        return $this->render('@admin/Product/csv_product_sale_high_price.twig', [
    86	            'form' => $form->createView(),
    87	            'headers' => $headers,
    88	            'csv_required_header_keys' => array_keys($this->getRequiredCsvHeader()),
    89	            'csv_box_title' => 'admin.product.sale_high_price_csv_upload_title',
    90	            'csv_format_title' => 'admin.product.sale_high_price_csv_format_title',
    91	            'form_action_route' => 'admin_product_sale_high_price_import',
    92	            'template_download_route' => 'admin_product_sale_high_price_csv_template',
    93	            'import_histories_pagination' => $importHistoriesPagination,
    94	            'history_page_route' => 'admin_product_sale_high_price_csv_upload',
    95	            'page_no' => $pageNo,
    96	            'page_count' => $pageCount,
    97	            'pageMax' => $pageCountOptions,
    98	        ]);
    99	    }
   100	
   101	    /**
   102	     * セール用高額商品価格変更CSV取込
   103	     */
   104	    #[Route(path: '/%eccube_admin_route%/product/sale_high_price/import', name: 'admin_product_sale_high_price_import', methods: ['POST'])]
   105	    public function import(Request $request): RedirectResponse
   106	    {
   107	        /** @var Member $Member */
   108	        $Member = $this->getUser();
   109	
   110	        $form = $this->formFactory->createBuilder(CsvImportType::class)->getForm();
   111	        $form->handleRequest($request);
   112	
   113	        if (!$form->isValid()) {
   114	            foreach ($form->getErrors() as $error) {
   115	                $this->addError($error->getMessage(), 'admin');
   116	            }
   117	
   118	            return $this->redirectToRoute('admin_product_sale_high_price_csv_upload');
   119	        }
   120	        /** @var UploadedFile|null $formFile */
   121	        $formFile = $form['import_file']->getData();
   122	
   123	        if ($formFile === null) {
   124	            $this->addError('admin.common.csv_invalid_format', 'admin');
   125	
   126	            return $this->redirectToRoute('admin_product_sale_high_price_csv_upload');
   127	        }
   128	
   129	        if ($this->countCsvRows($formFile) >= static::ADMIN_CSV_IMPORT_MAX_ROWS) {
   130	            $this->addError($this->getCsvImportMaxRowsExceededMessage(), 'admin');
   131	
   132	            return $this->redirectToRoute('admin_product_sale_high_price_csv_upload');
   133	        }
   134	
   135	        log_info('セール用高額商品価格変更CSV登録開始');
   136	
   137	        $handler = new SaleHighPriceImportHandler(
   138	            $this->entityManager,
   139	            $this->productRepository,
   140	            $this->productClassRepository,
   141	            $this->priceHistoryRepository,
   142	        );
   143	        $importer = new CsvImporter(
   144	            $this->entityManager,
   145	            $this->translator,
   146	            $this->eccubeConfig,
   147	            $handler,
   148	            $Member
   149	        );
   150	        $result = $importer->import($formFile);
   151	        if ($result->hasInfos()) {
   152	            foreach ($result->getInfos() as $info) {
   153	                $this->addWarning($info['message'], 'admin');
   154	            }
   155	        }
   156	
   157	        if ($result->hasError()) {
   158	            log_info('セール用高額商品価格変更CSV登録 異常終了');
   159	            foreach ($result->getErrors() as $error) {
   160	                $this->addError($error['message'], 'admin');
   161	            }
   162	        } else {
   163	            $this->addSuccess('admin.register.complete', 'admin');
   164	            log_info('セール用高額商品価格変更CSV登録完了', ['count' => $result->getCount()]);
   165	            $this->csvImportHistoryRepository->insertCsvImportHistory(
   166	                MtbCsvImportType::HIGH_PRICE_IMPORT_CSV_ID,
   167	                $formFile->getClientOriginalName(),
   168	                $Member->getId()
   169	            );
   170	        }
   171	
   172	        return $this->redirectToRoute('admin_product_sale_high_price_csv_upload');
   173	    }
   174	
   175	    /**
   176	     * @return array<string, string>
   177	     */
   178	    private function getCsvHeader(): array
   179	    {
   180	        return [
   181	            '商品コード' => '',
   182	            '販売価格' => '',
   183	            'セールフラグ' => '0: セールではない, 1: セールあり',
   184	            '帯URL' => '',
   185	            'タグ(ID)' => 'カンマ区切りで複数指定可能。',
   186	        ];
   187	    }
   188	
   189	    /**
   190	     * @return array<string, string>
   191	     */
   192	    private function getRequiredCsvHeader(): array
   193	    {
   194	        return [
   195	            '商品コード' => '商品コード',
   196	            '販売価格' => '販売価格',
   197	            'セールフラグ' => 'セールフラグ',
   198	        ];
   199	    }
   200	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/AbstractController.php | sed -n '410,445p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   410	        $pageNo = (int) ($request->get('page_no') ?? $session->get($sessionKeyPageNo, 1));
   411	        $session->set($sessionKeyPageNo, $pageNo);
   412	
   413	        return [
   414	            'pageCount' => $pageCount,
   415	            'pageNo' => $pageNo,
   416	            'pageCountOptions' => $pageCountOptions,
   417	        ];
   418	    }
   419	
   420	    /**
   421	     * ヘッダー行のみのCSV雛形をダウンロードする StreamedResponse を生成する。
   422	     *
   423	     * @param array<string, string> $headersKeyed キーがCSV列名（getCsvHeader() 形式）
   424	     */
   425	    protected function csvTemplateStreamedResponse(
   426	        CsvExportService $csvExportService,
   427	        array $headersKeyed,
   428	        string $downloadFilename,
   429	    ): StreamedResponse {
   430	        $response = new StreamedResponse();
   431	        $response->setCallback(function () use ($csvExportService, $headersKeyed) {
   432	            $csvExportService->fopen();
   433	            $csvExportService->fputcsv(array_keys($headersKeyed));
   434	            $csvExportService->fclose();
   435	        });
   436	        $response->headers->set('Content-Type', 'application/octet-stream');
   437	        $response->headers->set('Content-Disposition', 'attachment; filename='.$downloadFilename);
   438	
   439	        return $response;
   440	    }
   441	
   442	    protected function getCsvImportMaxRowsExceededMessage(): string
   443	    {
   444	        return $this->translator->trans(
   445	            'admin.csv.error.upload.maxrecord',

exec
/bin/bash -lc 'rg -n "sale_high_price|ProductSaleHighPriceCsvController|sale_high_price_template|csv_required_header_keys|getRequiredCsvHeader|getCsvHeader|スマレジ連携|買取価格" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /home/y-saito/Developments/ec-cube-enterprise/app/template/admin 2>/dev/null' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/PurchaseController.php:813:     * UniSearch docs を信頼してカード行を組み立てる。買取価格のみ DB から取得する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOtcSyncMessageHandler.php:35: * 店頭受取注文 (OTC) スマレジ連携メッセージのハンドラ。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:513:                // 使用ポイントのスマレジ連携ジョブを受注確定と同一トランザクションで作成（dispatch は commit 後）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/EntryController.php:403:     * スマレジ連携失敗を記録する (exists_smaregi_flg を OFF のまま確定し、ログを残す)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiProductClassUpsertMessageHandler.php:78:                $this->completeJobSkipped($Job, 'スマレジ連携フラグがOFFのため処理しません。');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:407:     * [説明] 同じ商品・同じコンディションでも、「買取価格」が1円でも異なれば別行として出力される。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPriceHistoryRepository.php:197:     * NMの商品規格サブIDと買取価格で他の状態の買取価格変更履歴をまとめて登録する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStockRepository.php:71:        // 同一買取価格を1行にまとめるかの分岐
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Archetype/ArchetypeCsvController.php:52:        $headers = $this->getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Archetype/ArchetypeCsvController.php:114:    private function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:695:    //      * 申込時買取価格合計を算出しつつ会員に紐づくネット買取を取得する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/Subscriber/MinPriceSubscriber.php:61:        // 買取検索： 買取価格が1円以上、かつニアミントが対象。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerEditController.php:72:        // スマレジ連携対象（氏名・カナ）の変更検知用に、フォーム束縛前の値を控える。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerEditController.php:175:            // スマレジ連携対象（氏名・カナ）が変わった場合のみ、会員情報更新を非同期連携する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:91:            // ポイント履歴・残高更新と同一トランザクションでスマレジ連携ジョブを積み、commit 後に dispatch する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcOrderSmaregiPostCommand.php:25:#[AsCommand(name: 'eccube:order:otc-smaregi-post', description: '店頭受取注文のスマレジ連携バッチ')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcOrderSmaregiPostCommand.php:44:        $io->text('店頭受取注文スマレジ連携バッチ開始');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcOrderSmaregiPostCommand.php:54:                '店頭受取注文スマレジ連携処理でエラーが発生しました',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcOrderSmaregiPostCommand.php:61:        $io->success('店頭受取注文スマレジ連携処理が完了しました。');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/AbstractController.php:423:     * @param array<string, string> $headersKeyed キーがCSV列名（getCsvHeader() 形式）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOtcOrderPostAction.php:23: * 店頭受取注文のスマレジ連携用アクション.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOtcOrderPostAction.php:35:     * 店頭受取注文のスマレジ連携を行う.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOtcOrderPostAction.php:65:                log_info('店頭受取注文スマレジ連携ジョブを enqueue しました', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOtcOrderPostAction.php:72:                log_error('店頭受取注文スマレジ連携ジョブの enqueue に失敗しました', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOtcOrderPostAction.php:80:            throw new \RuntimeException(sprintf('店頭受取注文スマレジ連携ジョブの enqueue に失敗した受注があります (orderIds=%s)', implode(',', $failedOrderIds)));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/Seeder/SeedUnisearchPurchaseTagCommand.php:56:            ->addOption('buy-price', null, InputOption::VALUE_REQUIRED, '投入する買取価格（省略時 10000）', (string) self::DEFAULT_BUY_PRICE)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiApiService.php:51:     * 受注更新に伴うスマレジ連携処理（仮実装）.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiApiService.php:59:        // TODO: $Order と $targets を元に、必要なスマレジ連携 API を実行する実装を追加
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/ChangeController.php:168:                // スマレジ連携対象（氏名・カナ）が変わった場合のみ、会員情報更新を非同期連携する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/ChangeController.php:170:                // スマレジ連携の失敗で会員情報変更自体はブロックしない（FAILED ジョブを Messenger が再試行する）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcSyncDispatcher.php:26: * 店頭受取注文 (OTC) スマレジ連携を MessengerJob として enqueue するディスパッチャ。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcSyncResult.php:19: * 店頭受取注文用スマレジ連携の 1 受注ごとの結果コード。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:42: * フロントが未稼働の検証フェーズで店頭受取注文スマレジ連携バッチ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:109:        // 店頭受取注文スマレジ連携バッチは order_date < (now - 30分) を対象とするため、
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:80:    /** 買取価格順用の内部 sort キー */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:172:        // 買取価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:226:     * 買取 UniSearch 遅延描画: ID ごとの買取価格のみ取得（表示用）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:1891:     * NMのproduct_class_idと買取価格を投げると良しなに他の規格も対応する価格に更新してくれる
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2034:     * @return int 買取価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2697:     * @param int                              $buyPrice         CSV買取価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2707:     * @param int $buyPrice 買取価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardCsvController.php:50:            CardCsv::getCsvHeader(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardCsvController.php:67:        return $this->renderWithError($form, CardCsv::getCsvHeader());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardCsvController.php:76:        $headers = CardCsv::getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardCsvController.php:191:            'csv_required_header_keys' => CardCsv::getRequiredCsvHeaderKeys(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiProductClassCsvImportUpsertCoordinator.php:94:                    log_error('スマレジ連携タスクの投入に失敗しました（'.$this->logContextLabel.'）。', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiProductClassCsvImportUpsertCoordinator.php:107:            throw new \RuntimeException('スマレジ連携タスクの投入に失敗しました（'.$this->logContextLabel.'）。', 0, $firstFailure);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Stock/SmaregiStockChangeApplier.php:171:            operatorMemberName: 'スマレジ連携(在庫変動Webhook)',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Stock/SmaregiStockChangeApplier.php:247:            self::DIVISION_SALES => 'スマレジ連携（売上）による減算',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Stock/SmaregiStockChangeApplier.php:248:            self::DIVISION_RETURN => 'スマレジ連携（返品）による加算',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Stock/SmaregiStockChangeApplier.php:249:            default => 'スマレジ連携',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Data/BuyPriceListController.php:41:     * 買取価格対応表一覧
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Data/BuyPriceListController.php:76:     * 買取価格編集
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Data/BuyPriceListController.php:93:     * 買取価格更新
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Purchase/include/net_purchase_terms_text.twig:11:第3条 （買取価格）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Purchase/include/net_purchase_terms_text.twig:12:買取価格は、当社が提示する価格表に基づき決定されます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Purchase/include/net_purchase_terms_text.twig:13:買取価格は、カードの状態、数量、需要等により変動することがあります。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Purchase/include/net_purchase_terms_text.twig:18:当社は、ユーザーから送付されたカードを受領し、査定を行った後に買取の可否および買取価格をユーザーに通知します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Purchase/include/net_purchase_terms_text.twig:19:ユーザーが当社の提示した買取価格に同意した場合、買取契約が成立します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/history.twig:231:                                                    <th>買取価格</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyMainCardController.php:62:            // 状態（NM、SP等）をキーにした買取価格を整形
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ShelfNumberController.php:257:            'csv_required_header_keys' => array_keys($this->getShelfNumberUpdateCsvRequiredHeader()),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:829:                            log_error('スマレジ連携タスクの投入に失敗しました。', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/_purchase_product_card.twig:42:                <p class="p-hareruya-product-card__purchase-price-label">買取価格</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:677:                // 会員残高へ反映し、同一トランザクションでスマレジ連携ジョブを積む（dispatch は commit 後）.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:812:                // 発生ポイントのスマレジ連携ジョブを同一トランザクションで積む（dispatch は commit 後）.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:363:                                            <th id="purchase_list_main__application_price">申込時買取価格</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/SectionController.php:271:            'csv_required_header_keys' => array_keys($this->getSectionUpdateCsvRequiredHeader()),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductClassController.php:226:        // 更新前の販売価格と買取価格を保持
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductClassController.php:323:                // スマレジ連携商品規格の削除対象を取得する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductClassController.php:340:                // 同一トランザクション内で商品規格の削除とスマレジ連携商品削除のジョブ登録を行い、整合性を保つ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:315:                    // 発生ポイントのスマレジ連携ジョブを同一トランザクションで積む（dispatch は commit 後）.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeSmoothOtcPatternHandler.php:29: * の突合で行う ({@see PurchasePatternContextBuilder})。店頭受取注文スマレジ連携バッチが
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/BuySalePriceHistoryController.php:54:        '変更前買取価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/BuySalePriceHistoryController.php:55:        '変更後買取価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/StorageCodeController.php:230:        $headers = $this->getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/StorageCodeController.php:253:            $this->getCsvHeader(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/StorageCodeController.php:254:            $this->getRequiredCsvHeader()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/StorageCodeController.php:289:            $headers = $this->getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/StorageCodeController.php:330:    private function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/StorageCodeController.php:344:    private function getRequiredCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckCsvController.php:150:            'headers' => $this->getCsvHeader(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckCsvController.php:158:    private function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductTagCsvController.php:55:            $this->getCsvHeader(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductTagCsvController.php:85:        $headers = $this->getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductTagCsvController.php:90:            'csv_required_header_keys' => array_keys($this->getRequiredCsvHeader()),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductTagCsvController.php:176:    private function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductTagCsvController.php:189:    private function getRequiredCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiMessengerJobProcessingLock.php:24: * スマレジ連携用 MessengerJob の重複実行抑止（悲観ロック + 状態遷移）.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:55:            $this->getCsvHeader(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:86:        $headers = $this->getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:91:            'csv_required_header_keys' => array_keys($this->getRequiredCsvHeader()),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:184:    private function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSimpleHighPriceCsvController.php:197:    private function getRequiredCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:865:front.mypage.purchase_history.detail.col.application_price: 申込時買取価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1900:admin.product.buy_sale_price_history.old_buy_price: 変更前買取価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1901:admin.product.buy_sale_price_history.new_buy_price: 変更後買取価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1918:admin.product.not_found_nm_price: "%price%円の買取価格は設定できません。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1919:admin.product.buy_price_exceeds_standard: "ID:%productId%（%language%）の買取価格は基準価格「%standardPrice%」以下を指定してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1923:admin.product.product_class.error.smaregi_alignment_flg_off_with_stock: スマレジ内在庫が存在するため、スマレジ連携フラグをOFFに変更できません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1959:admin.product.sale_high_price_csv: セール用高額商品価格変更CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1960:admin.product.sale_high_price_csv_upload_title: セール用高額商品価格変更CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1961:admin.product.sale_high_price_csv_format_title: セール用高額商品価格変更CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1962:admin.product.sale_high_price_csv.alert_off_sale_buy_only: "%d行目: セール外のため、買取価格および販売価格はデータベースにある基準価格で更新してます。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1963:admin.product.sale_high_price_csv.alert_end_sale_sell_from_standard: "%d行目: 通常商品のため、買取価格はCSVの値で更新しました。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1978:admin.product.standard_price_csv.sale_product_sell_price_unchanged: "%d行目: セール中商品のため、販売価格は変更されません。（基準価格・買取価格は更新しました）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2027:admin.product.application_price: 買取価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2077:admin.product.price_csv.normal_product_sell_price_unchanged: "%d行目: 通常商品のため、販売価格は変更されませんでした。買取価格のみ更新しています。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2139:admin.product.smaregi_alignment_flg: スマレジ連携フラグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2144:admin.product.buy_price: 買取価格(円)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2167:admin.product.buy_price_from: 買取価格(開始)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2168:admin.product.buy_price_to: 買取価格(終了)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2233:admin.product.buy_price_nm: 買取価格(NM)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2370:admin.csv.error.product.price_valid: "%d 行目の販売価格は買取価格より大きい価格を設定してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2573:admin.product_class.price_valid_bulk: "ID:%productId%（%language%）の販売価格は買取価格「%purchasePrice%」以上を指定してください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4711:admin.stock.list.col.buy_price: 買取価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4974:admin.stock.split.purchase_price: 買取価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5480:admin.purchase.store.history.form.buy_price.label: 買取価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5596:admin.purchase.online.history.form.buy_price.label: 買取価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6118:admin.data.buy_price_list_management: 買取価格対応表
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6119:admin.data.buy_price_list_edit: 買取価格対応表編集
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6121:admin.data.buy_price_list.price: 買取価格(円)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6625:front.seo.purchase_list.subtitle_suffix: 'の買取価格'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/purchase_product_list_unisearch.twig:3:   表示は UniSearch doc を優先し、買取価格のみ DB（buyPrices）から取得する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/purchase_product_list_unisearch.twig:32:                <p class="p-hareruya-product-card__purchase-price-label">買取価格</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:886:     * スマレジ連携エラーの受注を取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1801:     * スマレジ連携対象の受注を取得.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1805:     * スマレジ連携済みフラグ = 未連携
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:25: * 店頭受取注文商品スマレジ連携バッチで「商品登録後の在庫登録(在庫数=1 固定など)」や
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/TagSalesAnalysisCsvController.php:55:            $this->getCsvHeader(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/TagSalesAnalysisCsvController.php:85:        $headers = $this->getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/TagSalesAnalysisCsvController.php:90:            'csv_required_header_keys' => array_keys($this->getRequiredCsvHeader()),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/TagSalesAnalysisCsvController.php:179:    private function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/TagSalesAnalysisCsvController.php:192:    private function getRequiredCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:323:            '買取価格' => "買取価格\n必須",
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:349:            '買取価格' => "買取価格\n必須",
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:387:            '買取価格' => "買取価格\n必須",
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:390:            'スマレジ連携フラグ' => 'スマレジ連携フラグ',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:414:            '買取価格' => "買取価格\n必須",
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:430:            '買取価格' => "買取価格\n必須",
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:449:            '買取価格' => "買取価格\n必須",
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductShelfNumberCsvController.php:59:            $this->getCsvHeader(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductShelfNumberCsvController.php:89:        $headers = $this->getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductShelfNumberCsvController.php:94:            'csv_required_header_keys' => array_keys($this->getRequiredCsvHeader()),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductShelfNumberCsvController.php:183:    private function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductShelfNumberCsvController.php:196:    private function getRequiredCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CategoryCsvController.php:54:        $headers = $this->getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CategoryCsvController.php:97:        $headers = $this->getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CategoryCsvController.php:102:            'csv_required_header_keys' => array_keys($this->getRequiredCsvHeader()),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CategoryCsvController.php:188:    private function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CategoryCsvController.php:211:    private function getRequiredCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:37:class ProductSaleHighPriceCsvController extends AbstractController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:52:    #[Route(path: '/%eccube_admin_route%/product/sale_high_price/csv_template', name: 'admin_product_sale_high_price_csv_template', methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:57:            $this->getCsvHeader(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:58:            'sale_high_price_template.csv'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:65:    #[Route(path: '/%eccube_admin_route%/product/sale_high_price/csv_upload', name: 'admin_product_sale_high_price_csv_upload', methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:73:            'admin.product.sale_high_price_csv.page_count',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:74:            'admin.product.sale_high_price_csv.page_no',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:83:        $headers = $this->getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:85:        return $this->render('@admin/Product/csv_product_sale_high_price.twig', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:88:            'csv_required_header_keys' => array_keys($this->getRequiredCsvHeader()),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:89:            'csv_box_title' => 'admin.product.sale_high_price_csv_upload_title',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:90:            'csv_format_title' => 'admin.product.sale_high_price_csv_format_title',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:91:            'form_action_route' => 'admin_product_sale_high_price_import',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:92:            'template_download_route' => 'admin_product_sale_high_price_csv_template',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:94:            'history_page_route' => 'admin_product_sale_high_price_csv_upload',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:104:    #[Route(path: '/%eccube_admin_route%/product/sale_high_price/import', name: 'admin_product_sale_high_price_import', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:118:            return $this->redirectToRoute('admin_product_sale_high_price_csv_upload');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:126:            return $this->redirectToRoute('admin_product_sale_high_price_csv_upload');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:132:            return $this->redirectToRoute('admin_product_sale_high_price_csv_upload');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:172:        return $this->redirectToRoute('admin_product_sale_high_price_csv_upload');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:178:    private function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:192:    private function getRequiredCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:65:            $this->getCsvHeader(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:95:        $headers = $this->getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:100:            'csv_required_header_keys' => array_keys($this->getRequiredCsvHeader()),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:196:    private function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:202:            '買取価格' => '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:211:    private function getRequiredCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStandardPriceCsvController.php:217:            '買取価格' => '買取価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:75:            $this->getCsvHeaderForDisplay(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:110:            'headers' => $this->getCsvHeaderForDisplay(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:111:            'csv_required_header_keys' => $this->getRequiredCsvHeaderLabels(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:199:            // TODO スマレジ連携の表示の仕様確定後変更(M03-26)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:343:            '買取価格' => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:374:    private function getCsvHeaderForDisplay(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:387:    private function getRequiredCsvHeaderLabels(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php:63:            $this->getCsvHeader(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php:94:        $headers = $this->getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php:99:            'csv_required_header_keys' => array_keys($this->getRequiredCsvHeader()),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php:193:    private function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php:199:            '買取価格' => '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php:211:    private function getRequiredCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductPriceCsvController.php:217:            '買取価格' => '買取価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:67:            $this->getCsvHeaderForTemplateDownload(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:97:        $headers = $this->getCsvHeaderForTemplateDownload();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:102:            'csv_required_header_keys' => $this->getRequiredCsvHeaderLabels(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:179:            // TODO スマレジ連携の表示の仕様確定後変更(M03-27)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:194:    private function getCsvHeaderForTemplateDownload(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:197:        foreach ($this->getCsvHeader() as $label => $def) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:207:    private function getRequiredCsvHeaderLabels(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:210:        foreach ($this->getCsvHeader() as $label => $def) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:222:    private function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:350:            '買取価格' => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:365:            'スマレジ連携フラグ' => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:372:                'description' => 'スマレジ連携フラグが「1(有効)」の場合必須。JANまたはカスタムコード',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:377:                'description' => 'スマレジ連携フラグが「1(有効)」の場合必須',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/ApprovalListRowBuilder.php:93:            // TODO 承認状態が「スマレジ連携失敗」の場合も一括操作を可能にする
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSectionCsvController.php:57:            $this->getCsvHeader(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSectionCsvController.php:87:        $headers = $this->getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSectionCsvController.php:92:            'csv_required_header_keys' => array_keys($this->getRequiredCsvHeader()),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSectionCsvController.php:181:    private function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSectionCsvController.php:194:    private function getRequiredCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStatusCsvController.php:57:            $this->getCsvHeader(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStatusCsvController.php:88:        $headers = $this->getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStatusCsvController.php:93:            'csv_required_header_keys' => array_keys($this->getRequiredCsvHeader()),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStatusCsvController.php:179:    private function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStatusCsvController.php:193:    private function getRequiredCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:63:    public static function getCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:106:     * 必須列キー（表示順）。ラベルは getCsvHeader() のみを正とする。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:110:    public static function getRequiredCsvHeaderKeys(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:120:     * @throws \LogicException 必須キーが getCsvHeader に存在しないとき
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:122:    public static function getRequiredCsvHeader(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:124:        $all = self::getCsvHeader();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:126:        foreach (self::getRequiredCsvHeaderKeys() as $key) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:128:                throw new \LogicException('カードCSV必須キー '.$key.' が getCsvHeader にありません。');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:192:            csvHeader: self::getCsvHeader(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:193:            requiredCsvHeader: self::getRequiredCsvHeader(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/purchase_special_corner.twig:1:{# 買取TOP「買取特集コーナー」: タグ別 UniSearch（買取価格のみ DB） #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Product/ProductClassUpdateAction.php:58:        // スマレジ連携フラグを手動でOFFにする場合、スマレジに1つでも在庫があれば連携をOFFにできないよう制御
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:332:            'label' => '買取価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:746:        $headers = $this->getCsvHeaders();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:1938:    private function getCsvHeaders(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductGoodsCsv.php:148:                '買取価格' => '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductGoodsCsv.php:151:                'スマレジ連携フラグ' => '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductGoodsCsv.php:165:                $row['買取価格'] = $ProductClass->getBuyPrice();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductGoodsCsv.php:167:                $row['スマレジ連携フラグ'] = $ProductClass->getSmaregiAlignmentFlg() ? '1' : '0';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockSplitApprovalApproveAction.php:118:            // 全分割先の買取金額合計（個数×買取価格の合計）・個数合計を事前集計
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockSplitApprovalApproveAction.php:146:                // 分割先の仕入総価格 = 移動分の総原価 × (分割先個数×買取価格 / 全分割先個数×買取価格合計)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockSplitApprovalApproveAction.php:147:                // 買取価格が全て0の場合は個数比率で按分する（フォールバック）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:375:     * @return BaseCsvColumn 買取価格の列定義
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:377:    public static function buyPrice(string $name = '買取価格'): BaseCsvColumn
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:379:        return self::createUnsignedNumericColumn($name, '買取価格', 9);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:442:     * @return BaseCsvColumn スマレジ連携フラグの列定義
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:444:    public static function smaregiAlignmentFlg(string $name = 'スマレジ連携フラグ'): BaseCsvColumn
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:448:            'スマレジ連携フラグ',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderHistoryCsvExportService.php:39:        'buyPrice' => '買取価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:545:                                        {# (5-11)(5-12) 買取価格／原価単価 #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderProductListCsvExportService.php:35:        'buy_price' => '買取価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Purchase/PurchaseOrderSubmitAction.php:233:            // 選んで買取の申し込み時点の買取価格を保持する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Purchase/PurchaseOrderSubmitAction.php:235:            // カートはNMのみのため、他状態の買取価格も取得する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Purchase/PurchaseCartService.php:69:        // 実在しない規格や買取価格が無効な明細は保持用カートから外す
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/purchase_feature_product_list_unisearch.twig:3:   表示は UniSearch doc を優先し、買取価格のみ DB（buyPrices）から取得する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/UsedCardCsvExportService.php:30:        'buy_price' => '買取価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:56:                'buyPrice' => '買取価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:43:        'buy_price' => '買取価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderHistoryCsvExportService.php:42:        'buyPrice' => '買取価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/BulkUpdateProductPriceType.php:57:     * 買取価格(NM)が基準価格(NM)を上回る場合にエラーを追加する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:132:                $messageStore->addInfo('admin.product.sale_high_price_csv.alert_off_sale_buy_only', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:137:            $messageStore->addInfo('admin.product.sale_high_price_csv.alert_end_sale_sell_from_standard', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php:147:        // 今回のcsv登録では買取価格・基準価格の更新はないので一緒の値を入れる
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:129:    /** @var CsvColumnInterface 列: 買取価格 */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:135:    /** @var CsvColumnInterface 列: スマレジ連携フラグ */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:570:        // 商品公開ステータスが「非公開」または「廃止」の場合、スマレジ連携フラグを自動的にOFFにする
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:616:            // TODO: スマレジ連携フラグが無効から有効に変更された場合、スマレジ連携のキューを作成する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:618:            // 既存のスマレジ連携フラグと比較して、無効から有効に変わった場合にキューを作成する必要がある
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:619:            // TODO:スマレジ連携状態の確認後、更新するか決める（https://joolen.slack.com/archives/C086TQW7VTK/p1777341428022289）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:674:            // TODO: スマレジ連携フラグが無効から有効に変更された場合、スマレジ連携のキューを作成する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:676:            // 既存のスマレジ連携フラグと比較して、無効から有効に変わった場合にキューを作成する必要がある
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:677:            // TODO:スマレジ連携状態の確認後、更新するか決める（https://joolen.slack.com/archives/C086TQW7VTK/p1777341428022289）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:139:    /** @var CsvColumnInterface 列: 買取価格 */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:929:     * スマレジ連携フラグを決定する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:935:     * @return int スマレジ連携フラグ（1:有効、0:無効）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:939:        // 商品公開ステータスが「非公開」または「廃止」の場合はスマレジ連携フラグを無効にする
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:944:        // 販売価格が300円以上、かつ状態がNM以外の場合はスマレジ連携フラグを有効にする
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:955:     * @param int $smaregiAlignmentFlg スマレジ連携フラグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:962:        // スマレジ連携の対象でない場合は部門を設定しない
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:976:     * @param int $smaregiAlignmentFlg スマレジ連携フラグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:984:        // スマレジ連携フラグがONからOFFになったとしても、スマレジ商品コードはそのままとする
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:989:        // スマレジ連携の対象でない場合は商品コードを設定しない
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:50:    /** @var CsvColumnInterface 列: 買取価格 */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:349:            // 買取価格: NMはCSV値、SP/MP/HPは買取減額率・買取価格表・既定率から算出する（減額率取得はメソッド内で処理）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:490:     * スマレジ連携フラグを無効にする際、スマレジ在庫が存在する場合のエラーを追加する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/DiscountBuyPriceCalculator.php:26: * NM買取価格・カードコンディション・特別版フラグ・買取割引から買取価格を算出する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/DiscountBuyPriceCalculator.php:29: * データ取得（買取減額率・買取価格表）は各 Repository に委譲する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/DiscountBuyPriceCalculator.php:40:     * 買取価格を算出する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/DiscountBuyPriceCalculator.php:44:     * - nmPrice <= MAX_NM_PRICE かつ 0 以外: 買取価格表(mtb_buy_price_list)に従う（無ければ nmPrice）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/DiscountBuyPriceCalculator.php:47:     * @param int $nmPrice NM買取価格（基準）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/Util/DiscountBuyPriceCalculator.php:65:        // 買取価格表に記載のある商品は表に従った買取価格を返す
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/BuildBuyMainCard.php:150:     * 申込時の買取価格を引き継いだApplicationPriceを構築
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/BuildBuyMainCard.php:152:     * 状態や単価が変更されても、申込時に提示した買取価格を維持するため。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/BuildBuyMainCard.php:163:        // 状態違いの同じ商品規格の選んで買取の明細を取得する。取得先から状態ごとの申込時の買取価格を導けるため。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1225:                                {# TODO: 小計値引/割引区分 - スマレジ連携後#}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1226:                                {# TODO: クーポン値引き - スマレジ連携後 #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1227:                                {# TODO: 免税額 - スマレジ連携後 #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/SmaregiAlignmentFlgOffStockValidator.php:26: * スマレジ連携フラグを有効から無効に変更する際、スマレジ在庫が存在すればエラーを返すバリデーター
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/SmaregiAlignmentFlgOffStockValidator.php:38:     * @param CsvColumnInterface $smaregiAlignmentFlgColumn スマレジ連携フラグ列
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/SmaregiAlignmentFlgOffStockValidator.php:55:        // スマレジ連携フラグが有効の場合はバリデーションをスキップ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/SmaregiAlignmentFlgOffStockValidator.php:76:            // 現在のスマレジ連携フラグが既に無効の場合はスキップ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:97:        // CSVの基準価格・買取価格はNM基準。SP/MP/HPは各規格の割引・買取条件で算出する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStandardPriceImportHandler.php:125:            // 買取価格: NMはCSV値、SP/MP/HPは買取減額率・買取価格表・既定率から算出（NM特例・減額率取得はメソッド内で処理）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:82:                // EC 失効と同一トランザクションでスマレジ連携ジョブを積む（未連携・増減0は null）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:112:            // commit 成功後にのみスマレジ連携メッセージを dispatch する（アウトボックス的な順序）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:711:        #[ORM\Column(name: 'smaregi_error_flg', type: Types::BOOLEAN, options: ['default' => false, 'comment' => 'スマレジ連携エラーフラグ'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/history.twig:210:                                    <th id="result_list_main__header_buy_price">買取価格</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/SmaregiConditionalRequiredValidator.php:24: * スマレジ連携フラグが「1(有効)」の場合、スマレジ商品コードと部門IDを必須とするバリデーター
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/SmaregiConditionalRequiredValidator.php:35:     * @param CsvColumnInterface $smaregiAlignmentFlgColumn スマレジ連携フラグ列
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/SmaregiConditionalRequiredValidator.php:53:        // スマレジ連携フラグが「1(有効)」でない場合はバリデーションをスキップ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/PriceConsistencyRowValidator.php:56:        // 買取価格が販売価格を上回っている場合、エラー
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:195:                                                        <span class="p-hareruya-order-list__summary-item-value">TODO: スマレジ連携後</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:199:                                                        <span class="p-hareruya-order-list__summary-item-value">TODO: スマレジ連携後</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:203:                                                        <span class="p-hareruya-order-list__summary-item-value">TODO: スマレジ連携後</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:275:        #[ORM\Column(name: 'buy_price', type: Types::INTEGER, nullable: true, options: ['unsigned' => true, 'comment' => '買取価格'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:293:        #[ORM\Column(name: 'smaregi_alignment_flg', type: Types::BOOLEAN, options: ['default' => true, 'comment' => 'スマレジ連携フラグ'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbApplicationPrice.php:33:    #[ORM\Column(name: 'application_price', type: Types::INTEGER, options: ['unsigned' => true, 'comment' => '申込時買取価格'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbOtcBuyOrderStock.php:133:     * 仕入単価（買取価格）を算出
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPriceHistory.php:56:    #[ORM\Column(name: 'old_buy_price', type: Types::INTEGER, nullable: true, options: ['default' => 0, 'unsigned' => true, 'comment' => '変更前買取価格'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/ProductClass/edit.twig:201:            const smaregiAlertMessage = 'スマレジ連携の閾値（' + PRICE_THRESHOLD + '円）を跨ぐ価格変更があったため、スマレジ連携フラグの設定をご確認ください';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:145:                '買取価格' => '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:167:                $row['買取価格'] = $ProductClass->getBuyPrice();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/edit_bulk_update_buy_price.twig:208:                                                    {# 買取価格(NM) #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_sale_high_price.twig:3:{% set menus = ['product', 'product_csv_management', 'sale_high_price_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_sale_high_price.twig:5:{% block sub_title %}{{ 'admin.product.sale_high_price_csv'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:99:                                                {% if csv_required_header_keys is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:100:                                                    {% if key in csv_required_header_keys %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbBuyPriceList.php:41:    #[ORM\Column(name: 'id', type: Types::INTEGER, options: ['unsigned' => true, 'comment' => '買取価格対応表ID'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOption.php:114:        self::BUY => '買取価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbStockChangeTypeDetail.php:52:    public const SMAREGI_SYNC_SALES = 36; // スマレジ売上（スマレジ連携(売上)による減算）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbStockChangeTypeDetail.php:53:    public const SMAREGI_SYNC_RETURN = 37; // スマレジ返品（スマレジ連携(返品)による加算）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbStockChangeTypeDetail.php:54:    public const SMAREGI_SYNC_ADJUST = 38; // スマレジその他（スマレジ連携(調整)）

codex
設計の処理フロー、レスポンスヘッダ、文字コード・区切りは共通メソッドに集約されており、候補の主張とは別に実装差分がないか確認しています。取込ハンドラの列定義も、設計が「取込側と同一ヘッダ」と述べるため照合対象に含めます。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php | sed -n '1,220p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<?php
     2	
     3	/*
     4	 * This file is part of EC-CUBE
     5	 *
     6	 * Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved.
     7	 *
     8	 * http://www.ec-cube.co.jp/
     9	 *
    10	 * For the full copyright and license information, please view the LICENSE
    11	 * file that was distributed with this source code.
    12	 */
    13	
    14	namespace Eccube\Service;
    15	
    16	use Doctrine\Common\Collections\Collection;
    17	use Doctrine\Common\Util\ClassUtils;
    18	use Doctrine\ORM\EntityManagerInterface;
    19	use Doctrine\ORM\QueryBuilder;
    20	use Eccube\Common\EccubeConfig;
    21	use Eccube\Entity\AbstractEntity;
    22	use Eccube\Entity\Csv;
    23	use Eccube\Entity\DtbCsvExtension;
    24	use Eccube\Entity\Master\CsvType;
    25	use Eccube\Entity\Order;
    26	use Eccube\Entity\Product;
    27	use Eccube\Entity\ProductStock;
    28	use Eccube\Form\Type\Admin\SearchCustomerType;
    29	use Eccube\Form\Type\Admin\SearchOrderType;
    30	use Eccube\Form\Type\Admin\SearchProductType;
    31	use Eccube\Form\Type\Admin\SearchStockListType;
    32	use Eccube\Repository\CsvRepository;
    33	use Eccube\Repository\CustomerRepository;
    34	use Eccube\Repository\Master\CsvTypeRepository;
    35	use Eccube\Repository\OrderRepository;
    36	use Eccube\Repository\ProductRepository;
    37	use Eccube\Repository\ProductStockRepository;
    38	use Eccube\Repository\ShippingRepository;
    39	use Eccube\Service\Admin\Stock\ActionInput\StockListSearchInput;
    40	use Eccube\Util\FormUtil;
    41	use Knp\Component\Pager\Pagination\AbstractPagination;
    42	use Knp\Component\Pager\PaginatorInterface;
    43	use Symfony\Component\Form\FormFactoryInterface;
    44	use Symfony\Component\HttpFoundation\Request;
    45	
    46	class CsvExportService
    47	{
    48	    /**
    49	     * @var resource|null
    50	     */
    51	    protected $fp;
    52	
    53	    protected bool $closed = false;
    54	
    55	    protected ?\Closure $convertEncodingCallBack = null;
    56	
    57	    protected ?QueryBuilder $qb = null;
    58	
    59	    protected ?CsvType $CsvType = null;
    60	
    61	    /**
    62	     * @var Csv[]|null
    63	     */
    64	    protected ?array $Csvs = null;
    65	
    66	    /**
    67	     * CsvExportService constructor.
    68	     */
    69	    public function __construct(protected ?EntityManagerInterface $entityManager, protected CsvRepository $csvRepository, protected CsvTypeRepository $csvTypeRepository, protected OrderRepository $orderRepository, protected ShippingRepository $shippingRepository, protected CustomerRepository $customerRepository, protected ProductRepository $productRepository, protected EccubeConfig $eccubeConfig, protected FormFactoryInterface $formFactory, protected PaginatorInterface $paginator, protected ?ProductStockRepository $productStockRepository = null)
    70	    {
    71	    }
    72	
    73	    public function setConfig(EccubeConfig $config): void
    74	    {
    75	        $this->eccubeConfig = $config;
    76	    }
    77	
    78	    public function setCsvRepository(CsvRepository $csvRepository): void
    79	    {
    80	        $this->csvRepository = $csvRepository;
    81	    }
    82	
    83	    public function setCsvTypeRepository(CsvTypeRepository $csvTypeRepository): void
    84	    {
    85	        $this->csvTypeRepository = $csvTypeRepository;
    86	    }
    87	
    88	    public function setOrderRepository(OrderRepository $orderRepository): void
    89	    {
    90	        $this->orderRepository = $orderRepository;
    91	    }
    92	
    93	    public function setCustomerRepository(CustomerRepository $customerRepository): void
    94	    {
    95	        $this->customerRepository = $customerRepository;
    96	    }
    97	
    98	    public function setProductRepository(ProductRepository $productRepository): void
    99	    {
   100	        $this->productRepository = $productRepository;
   101	    }
   102	
   103	    public function setEntityManager(EntityManagerInterface $entityManager): void
   104	    {
   105	        $this->entityManager = $entityManager;
   106	    }
   107	
   108	    public function getEntityManager(): EntityManagerInterface
   109	    {
   110	        return $this->entityManager;
   111	    }
   112	
   113	    public function setExportQueryBuilder(QueryBuilder $qb): void
   114	    {
   115	        $this->qb = $qb;
   116	    }
   117	
   118	    /**
   119	     * Csv種別からServiceの初期化を行う.
   120	     */
   121	    public function initCsvType(CsvType|int $CsvType): void
   122	    {
   123	        if ($CsvType instanceof CsvType) {
   124	            $this->CsvType = $CsvType;
   125	        } else {
   126	            $this->CsvType = $this->csvTypeRepository->find($CsvType);
   127	        }
   128	
   129	        $criteria = [
   130	            'CsvType' => $CsvType,
   131	            'enabled' => true,
   132	        ];
   133	        $orderBy = [
   134	            'sort_no' => 'ASC',
   135	        ];
   136	        $this->Csvs = $this->csvRepository->findBy($criteria, $orderBy);
   137	    }
   138	
   139	    /**
   140	     * Csv拡張から必要な情報をセット(initCsvTypeの代わり).
   141	     *
   142	     * @param DtbCsvExtension $CsvExtension
   143	     */
   144	    public function setCsvsAndCsvType(DtbCsvExtension $CsvExtension): void
   145	    {
   146	        $this->CsvType = $CsvExtension->getCsvType();
   147	        $this->Csvs = $CsvExtension->getCsvs();
   148	    }
   149	
   150	    /**
   151	     * @return Csv[]
   152	     */
   153	    public function getCsvs(): array
   154	    {
   155	        return $this->Csvs;
   156	    }
   157	
   158	    /**
   159	     * ヘッダ行を出力する.
   160	     * このメソッドを使う場合は, 事前にinitCsvType($CsvType)で初期化しておく必要がある.
   161	     */
   162	    public function exportHeader(): void
   163	    {
   164	        if (is_null($this->CsvType) || empty($this->Csvs)) {
   165	            throw new \LogicException('init csv type incomplete.');
   166	        }
   167	
   168	        $row = [];
   169	        foreach ($this->Csvs as $Csv) {
   170	            $row[] = $Csv->getDispName();
   171	        }
   172	
   173	        $this->fopen();
   174	        $this->fputcsv($row);
   175	        $this->fclose();
   176	    }
   177	
   178	    /**
   179	     * クエリビルダにもとづいてデータ行を出力する.
   180	     * このメソッドを使う場合は, 事前にsetExportQueryBuilder($qb)で出力対象のクエリビルダをわたしておく必要がある.
   181	     *
   182	     * @param \Closure(mixed $result, CsvExportService $service): void $closure
   183	     */
   184	    public function exportData(\Closure $closure): void
   185	    {
   186	        if (is_null($this->qb) || is_null($this->entityManager)) {
   187	            throw new \LogicException('query builder not set.');
   188	        }
   189	
   190	        $this->fopen();
   191	
   192	        $page = 1;
   193	        $limit = 100;
   194	        while ($results = $this->paginator->paginate($this->qb, $page, $limit)) {
   195	            /** @var AbstractPagination<int, mixed> $results */
   196	            if (!$results->valid()) {
   197	                break;
   198	            }
   199	
   200	            foreach ($results as $result) {
   201	                $closure($result, $this);
   202	                flush();
   203	            }
   204	
   205	            $this->entityManager->clear();
   206	            $page++;
   207	        }
   208	
   209	        $this->fclose();
   210	    }
   211	
   212	    /**
   213	     * CSV出力項目と比較し, 合致するデータを返す.
   214	     */
   215	    public function getData(Csv $Csv, AbstractEntity $entity): ?string
   216	    {
   217	        // エンティティ名が一致するかどうかチェック.
   218	        $csvEntityName = str_replace('\\\\', '\\', $Csv->getEntityName());
   219	        $entityName = ClassUtils::getClass($entity);
   220	        if ($csvEntityName !== $entityName) {

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/SaleHighPriceImportHandler.php | sed -n '1,230p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_sale_high_price.twig | sed -n '1,80p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	{% extends '@admin/Product/base_csv_upload.twig' %}
     2	
     3	{% set menus = ['product', 'product_csv_management', 'sale_high_price_csv_import'] %}
     4	
     5	{% block sub_title %}{{ 'admin.product.sale_high_price_csv'|trans }}{% endblock %}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig | sed -n '1,140p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	{% extends '@admin/default_frame.twig' %}
     2	
     3	{% block title %}{{ 'admin.product.product_management'|trans }}{% endblock %}
     4	{% block sub_title %}{% endblock %}
     5	
     6	{% form_theme form '@admin/Form/bootstrap_4_horizontal_layout.html.twig' %}
     7	
     8	{% block stylesheet %}
     9	    <style>
    10	        .custom-file-input:lang(ja) ~ .custom-file-label::after {
    11	            content: "{{ 'admin.common.browse'|trans }}";
    12	        }
    13	        .custom-file-label::after {
    14	            background-color: #b6b6b6;
    15	            color: #fff;
    16	        }
    17	    </style>
    18	{% endblock %}
    19	
    20	{% block import_file_accept %}.csv, text/csv, .tsv, text/tsv{% endblock %}
    21	
    22	{% block javascript %}
    23	<script nonce="{{ csp_nonce|default('') }}">
    24	    $(function() {
    25	        $('.custom-file-input').on('change', function() {
    26	            const fileName = $(this).val().split('\\').pop();
    27	            $(this).next('.custom-file-label').addClass("selected").html(fileName);
    28	        });
    29	        $('#upload-form').on('submit', function() {
    30	            $.changeLoading(true);
    31	        });
    32	    });
    33	</script>
    34	{% endblock javascript %}
    35	
    36	{% block main %}
    37	    <div class="c-contentsArea__cols">
    38	        <div class="c-contentsArea__primaryCol">
    39	            <div class="c-primaryCol">
    40	                {% if import_errors is defined and import_errors|length > 0 %}
    41	                    <div class="alert alert-danger mb-4">
    42	                        <div class="font-weight-bold mb-2">
    43	                            <i class="fa fa-exclamation-triangle mr-2"></i>{{ 'admin.common.csv_import_error'|trans }}
    44	                        </div>
    45	                        <ul class="mb-0 pl-3">
    46	                            {% for error in import_errors %}
    47	                                <li>{{ error }}</li>
    48	                            {% endfor %}
    49	                        </ul>
    50	                    </div>
    51	                {% endif %}
    52	
    53	                <form id="upload-form" method="post" action="{{ url(form_action_route) }}" enctype="multipart/form-data">
    54	                    {{ form_widget(form._token) }}
    55	
    56	                    <div class="card rounded border shadow-sm mb-4">
    57	                        <div class="card-header">
    58	                            <h4 class="card-title mb-0">{{ csv_box_title|trans }}</h4>
    59	                        </div>
    60	                        <div class="card-body">
    61	                            <div class="row justify-content-center">
    62	                                <div class="col-md-8">
    63	                                    <div class="form-group">
    64	                                        <div class="custom-file">
    65	                                            {{ form_widget(form.import_file, {'attr': {'class': 'custom-file-input', 'accept': block('import_file_accept')}}) }}
    66	                                        </div>
    67	                                        {{ form_errors(form.import_file) }}
    68	                                    </div>
    69	                                </div>
    70	                            </div>
    71	                        </div>
    72	                        <div class="card-footer text-center">
    73	                            <button id="upload-button" type="submit" class="btn btn-ec-conversion px-5">
    74	                                {{ 'admin.common.csv_upload'|trans }}
    75	                            </button>
    76	                        </div>
    77	                    </div>
    78	                </form>
    79	
    80	                <div class="card rounded border shadow-sm mb-4">
    81	                    <div class="card-header d-flex align-items-center justify-content-between">
    82	                        <h4 class="card-title mb-0">{{ csv_format_title|trans }}</h4>
    83	                        <a href="{{ url(template_download_route, template_download_route_params|default({})) }}" class="btn btn-secondary" id="download-template-button">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
    84	                    </div>
    85	                    <div class="card-body p-0">
    86	                        <div class="table-responsive">
    87	                            <table class="table table-striped table-bordered mb-0">
    88	                                <thead class="thead-light">
    89	                                    <tr>
    90	                                        <th class="w-50">{{ 'admin.common.csv_item_name'|trans }}</th>
    91	                                        <th>{{ 'admin.common.csv_description'|trans }}</th>
    92	                                    </tr>
    93	                                </thead>
    94	                                <tbody>
    95	                                    {% for key, value in headers %}
    96	                                        <tr>
    97	                                            <td class="text-nowrap">
    98	                                                {{ key }}
    99	                                                {% if csv_required_header_keys is defined %}
   100	                                                    {% if key in csv_required_header_keys %}
   101	                                                        <span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
   102	                                                    {% endif %}
   103	                                                {% endif %}
   104	                                            </td>
   105	                                            <td>{{ value|nl2br }}</td>
   106	                                        </tr>
   107	                                    {% endfor %}
   108	                                </tbody>
   109	                            </table>
   110	                        </div>
   111	                    </div>
   112	                </div>
   113	                {% include '@admin/Product/csv_import_history.twig' %}
   114	            </div>
   115	        </div>
   116	    </div>
   117	{% endblock %}

 succeeded in 105ms:
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
    16	namespace Eccube\Service\Csv\Importer\Event;
    17	
    18	use Doctrine\ORM\EntityManagerInterface;
    19	use Eccube\Repository\DtbPriceHistoryRepository;
    20	use Eccube\Repository\ProductClassRepository;
    21	use Eccube\Repository\ProductRepository;
    22	use Eccube\Service\Csv\Importer\Model\ColumnDefinitions;
    23	use Eccube\Service\Csv\Importer\Model\CsvColumnInterface;
    24	use Eccube\Service\Csv\Importer\Validator\RowValidatorInterface;
    25	use Eccube\Util\StringUtil;
    26	
    27	class SaleHighPriceImportHandler extends BaseCsvImportHandler
    28	{
    29	    private ?CsvColumnInterface $productCodeColumn = null;
    30	
    31	    private ?CsvColumnInterface $sellPriceColumn = null;
    32	
    33	    private ?CsvColumnInterface $saleFlgColumn = null;
    34	
    35	    private ?CsvColumnInterface $beltUrlColumn = null;
    36	
    37	    private ?CsvColumnInterface $productTagListColumn = null;
    38	
    39	    public function __construct(
    40	        private readonly EntityManagerInterface $em,
    41	        private readonly ProductRepository $productRepository,
    42	        private readonly ProductClassRepository $productClassRepository,
    43	        private readonly DtbPriceHistoryRepository $priceHistoryRepository,
    44	    ) {
    45	    }
    46	
    47	    public function onBeforeImport(): void
    48	    {
    49	        parent::onBeforeImport();
    50	
    51	        $this->productCodeColumn = ColumnDefinitions::productCode()->setRequired(true);
    52	        $this->sellPriceColumn = ColumnDefinitions::sellPrice()->setRequired(true);
    53	        $this->saleFlgColumn = ColumnDefinitions::saleFlg()->setRequired(true);
    54	        $this->beltUrlColumn = ColumnDefinitions::beltUrl();
    55	        $this->productTagListColumn = ColumnDefinitions::productTagList($this->em);
    56	    }
    57	
    58	    public function onAfterImport(AfterReadEvent $event): void
    59	    {
    60	        parent::onAfterImport($event);
    61	
    62	        $this->productCodeColumn = null;
    63	        $this->sellPriceColumn = null;
    64	        $this->saleFlgColumn = null;
    65	        $this->beltUrlColumn = null;
    66	        $this->productTagListColumn = null;
    67	    }
    68	
    69	    public function onValidateRow(ReadCsvRowEvent $event): void
    70	    {
    71	        parent::onValidateRow($event);
    72	        if ($event->isBreakAll() || $event->isSkipRow()) {
    73	            return;
    74	        }
    75	
    76	        if (!$this->validateRowTarget($event)) {
    77	            $event->breakAll();
    78	        }
    79	    }
    80	
    81	    public function onReadRow(ReadCsvRowEvent $event): bool
    82	    {
    83	        $row = $event->getRow();
    84	        $productCode = (string) $this->productCodeColumn->getValue($row);
    85	
    86	        $ProductClass = $this->productClassRepository->findHighPriceProductClassForSaleCsv($productCode);
    87	        if ($ProductClass === null) {
    88	            $event->getMessageStore()->addProductNotExistsError(
    89	                $row->getRowNumber(),
    90	                $this->productCodeColumn->getLabel()
    91	            );
    92	            $event->breakAll();
    93	
    94	            return false;
    95	        }
    96	        $csvSellPrice = (int) bcfloor((string) $this->sellPriceColumn->getValue($row));
    97	
    98	        $csvSaleFlg = (bool) (int) $this->saleFlgColumn->getValue($row);
    99	        $currentSaleFlg = $ProductClass->isSaleFlg();
   100	
   101	        $csvBeltUrl = $this->beltUrlColumn->getValue($row);
   102	        $beltUrl = StringUtil::isNotBlank($csvBeltUrl) ? (string) $csvBeltUrl : null;
   103	
   104	        $messageStore = $event->getMessageStore();
   105	        $rowNumber = $row->getRowNumber();
   106	
   107	        $oldSellPrice = (int) ($ProductClass->getPrice02() ?? 0);
   108	        $oldBuyPrice = (int) ($ProductClass->getBuyPrice() ?? 0);
   109	        $oldStandardPrice = (int) ($ProductClass->getStandardPrice() ?? 0);
   110	
   111	        $productId = (int) $ProductClass->getProduct()->getId();
   112	        $tagIds = $this->productTagListColumn->getValue($row);
   113	        if (!\is_array($tagIds)) {
   114	            $tagIds = [];
   115	        }
   116	        $this->productRepository->replaceProductTags(
   117	            $productId,
   118	            $tagIds,
   119	            $event->getUpdateUser()->getId()
   120	        );
   121	
   122	        if (!$currentSaleFlg && $csvSaleFlg) {
   123	            $newSellPrice = $csvSellPrice;
   124	            $newSaleFlg = true;
   125	        } elseif ($currentSaleFlg && $csvSaleFlg) {
   126	            $newSellPrice = $csvSellPrice;
   127	            $newSaleFlg = true;
   128	        } elseif ($currentSaleFlg && !$csvSaleFlg) {
   129	            $newSellPrice = $oldStandardPrice;
   130	            $newSaleFlg = false;
   131	            if ($csvSellPrice) {
   132	                $messageStore->addInfo('admin.product.sale_high_price_csv.alert_off_sale_buy_only', $rowNumber);
   133	            }
   134	        } else {
   135	            $newSellPrice = (int) bcfloor((string) ($ProductClass->getPrice02() ?? '0'));
   136	            $newSaleFlg = false;
   137	            $messageStore->addInfo('admin.product.sale_high_price_csv.alert_end_sale_sell_from_standard', $rowNumber);
   138	        }
   139	
   140	        $this->productClassRepository->updateProductClassForHighPriceSaleCsv(
   141	            $ProductClass->getId(),
   142	            $newSellPrice,
   143	            $beltUrl,
   144	            $newSaleFlg,
   145	        );
   146	
   147	        // 今回のcsv登録では買取価格・基準価格の更新はないので一緒の値を入れる
   148	        $this->priceHistoryRepository->addSellBuyPriceHistoryIfChanged(
   149	            $ProductClass,
   150	            $event->getUpdateUser()->getId(),
   151	            $oldSellPrice,
   152	            $oldBuyPrice,
   153	            $oldStandardPrice,
   154	            $newSellPrice,
   155	            $oldBuyPrice,
   156	            $oldStandardPrice,
   157	        );
   158	
   159	        return true;
   160	    }
   161	
   162	    /**
   163	     * @return array<CsvColumnInterface>
   164	     */
   165	    protected function getColumns(): array
   166	    {
   167	        return [
   168	            $this->productCodeColumn,
   169	            $this->sellPriceColumn,
   170	            $this->saleFlgColumn,
   171	            $this->beltUrlColumn,
   172	            $this->productTagListColumn,
   173	        ];
   174	    }
   175	
   176	    /**
   177	     * @return array<RowValidatorInterface>
   178	     */
   179	    protected function getRowValidators(): array
   180	    {
   181	        return [];
   182	    }
   183	
   184	    private function validateRowTarget(ReadCsvRowEvent $event): bool
   185	    {
   186	        $row = $event->getRow();
   187	        $productCode = (string) $this->productCodeColumn->getValue($row);
   188	        $rowNumber = $row->getRowNumber();
   189	
   190	        if (!$this->productClassRepository->isProductCodeUnique($productCode)) {
   191	            $event->getMessageStore()->addProductCodeDuplicatedError($rowNumber, $productCode);
   192	
   193	            return false;
   194	        }
   195	
   196	        if ($this->productClassRepository->findHighPriceProductClassForSaleCsv($productCode) === null) {
   197	            $event->getMessageStore()->addProductNotExistsError(
   198	                $rowNumber,
   199	                $this->productCodeColumn->getLabel()
   200	            );
   201	
   202	            return false;
   203	        }
   204	
   205	        return true;
   206	    }
   207	}

exec
/bin/bash -lc "nl -ba function_spec_html_preview/pf-eccube3/admin_product_sale_high_price_csv_export.html | sed -n '222,266p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   222	<h2 id="処理フロー">処理フロー</h2>
   223	<h3 id="雛形-CSV-をダウンロードする-GET-admin-product-sale-high-price-csv-template">雛形 CSV をダウンロードする（GET <code>admin_product_sale_high_price_csv_template</code>）</h3>
   224	<ol><li>管理画面の認証・共通制約を通過する。</li><li>ストリーミング応答のコールバック内で、共通の CSV 出力サービスを開く（<code>fopen</code>）。</li><li>ヘッダー定義連想配列のキーを順に並べた配列を 1 行だけ <code>fputcsv</code> に渡す。値側の説明文は書き込まない。</li><li>出力ストリームを閉じる（<code>fclose</code>）。</li><li>応答ヘッダに <code>Content-Type: application/octet-stream</code> と <code>Content-Disposition: attachment; filename=sale_high_price_template.csv</code> を付与した応答を返す（自動テストがこの組み合わせを確認値とする）。</li></ol>
   225	<h3 id="文字コードと区切り-fopen-fputcsv-の共通実装">文字コードと区切り（<code>fopen</code>〜<code>fputcsv</code> の共通実装）</h3>
   226	<ol><li>設定 <code>eccube_csv_export_encoding</code> の値（配布設定では <code>UTF-8</code>）を UTF-8 からの変換先とする。配列の各セルは <code>mb_convert_encoding</code> で当該エンコーディングへ変換されてから <code>fputcsv</code> される。</li><li>エンコーディング名を大文字化した値が <code>UTF-8</code> と一致するとき、ストリーム先頭に UTF-8 の BOM（バイト列 <code>\xEF\xBB\xBF</code>）を書く。</li><li>区切り文字は <code>eccube_csv_export_separator</code>（配布設定ではカンマ）。フィールド囲みは二重引用符、エスケープはバックスラッシュとして <code>fputcsv</code> に渡される。</li></ol>
   227	<hr>
   228	<h2 id="集計条件">集計条件</h2>
   229	<p>本機能では件数集計や売上などの業務集計は行わない。出力内容は固定のヘッダ行 1 行のみである。</p>
   230	<hr>
   231	<h2 id="業務ルール・計算">業務ルール・計算</h2>
   232	<h3 id="ヘッダ列-1-行目の左から右">ヘッダ列（1 行目の左から右）</h3>
   233	<p>画面上のフォーマット表の行順と一致する。列名と画面の説明欄の対応は次のとおり（説明文は参考用。ファイル内のデータセルには出ない）。</p>
   234	<div class="table-wrap"><table><thead><tr><th>列名（ヘッダ）</th><th>画面上の説明欄の内容（確認値）</th></tr></thead><tbody><tr><td>商品コード</td><td>（空欄。取込側で必須）</td></tr><tr><td>販売価格</td><td>（空欄。取込側で必須）</td></tr><tr><td>買取価格</td><td>（空欄。取込側で必須）</td></tr><tr><td>セールフラグ</td><td><code>0: セールではない, 1: セールあり</code></td></tr><tr><td>帯URL</td><td>（空欄）</td></tr><tr><td>タグ(ID)</td><td><code>カンマ区切りで複数指定可能。</code></td></tr><tr><td>スマレジ連携フラグ</td><td><code>0: 連携しない/ 1: 連携する</code>（取込側で必須列として扱われる）</td></tr></tbody></table></div>
   235	<p>必須バッジの付与は <code>商品コード</code>・<code>販売価格</code>・<code>買取価格</code>・<code>セールフラグ</code>・<code>スマレジ連携フラグ</code> に対して行われる。<code>帯URL</code> と <code>タグ(ID)</code> には付かない。</p>
   236	<p>本機能ではフォーム入力の保存やファイルアップロード検証は行わない。よって <code>### 入力項目</code> 表は置かない（取込画面の入力は別ルート）。</p>
   237	<hr>
   238	<h2 id="データ整合性">データ整合性</h2>
   239	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>商品マスタとの一致</td><td>雛形ダウンロードはデータベースを読まないため、商品コードや価格との整合は保証の対象外である。</td></tr><tr><td>取込との一致</td><td>ヘッダ列名および列順は、同一機能群の取込ハンドラが期待する日本語列名と揃えるためのものである。取込時の検証・更新の詳細は取込側の実装を正とする。</td></tr></tbody></table></div>
   240	<hr>
   241	<h2 id="API-バッチ結果">API/バッチ結果</h2>
   242	<p>本機能では API 呼び出し・バッチ実行を扱わない。</p>
   243	<hr>
   244	<h2 id="権限・認可">権限・認可</h2>
   245	<div class="table-wrap"><table><thead><tr><th>利用者状態</th><th>雛形ダウンロード（GET <code>/{admin_route}/product/sale_high_price/csv_template</code>）</th></tr></thead><tbody><tr><td>管理画面にログイン済みで当領域へ到達できる主体</td><td>雛形を取得できる。</td></tr><tr><td>未認証または管理領域外の主体</td><td>管理画面のセキュリティ設定に従い、ログイン画面等へ誘導されるかアクセス拒否となる。実装の細部は別設計を正とする。</td></tr></tbody></table></div>
   246	<hr>
   247	<h2 id="画面遷移">画面遷移</h2>
   248	<div class="table-wrap"><table><thead><tr><th>条件</th><th>遷移先</th></tr></thead><tbody><tr><td>アップロード画面上で雛形リンクを押す</td><td>同一タブでファイルダウンロードが始まる。ブラウザの挙動により保存ダイアログが開く。HTML 画面遷移は発生しない。</td></tr><tr><td>直接 GET で雛形 URL を開く</td><td>同上。</td></tr></tbody></table></div>
   249	<p>遷移に伴い検索条件セッションやフラッシュメッセージを更新する処理は無い。</p>
   250	<hr>
   251	<h2 id="エラー処理">エラー処理</h2>
   252	<div class="table-wrap"><table><thead><tr><th>エラー内容</th><th>処理</th></tr></thead><tbody><tr><td>管理画面として未認証・無権限</td><td>管理画面共通の扱いに従う（詳細は別設計）。</td></tr><tr><td>雛形生成中の I/O 失敗</td><td>雛形用コールバック内で明示的な try-catch は無く、フレームワーク既定のエラーハンドリングに委ねる。</td></tr></tbody></table></div>
   253	<hr>
   254	<h2 id="ログ・監査">ログ・監査</h2>
   255	<p>雛形ダウンロードの成功時に専用の情報ログを残す処理は無い。</p>
   256	<h3 id="ログに出してはいけないもの">ログに出してはいけないもの</h3>
   257	<ul><li>パスワード</li><li>なりすまし対策トークン</li><li>Cookie 値</li><li>セッション ID の完全値</li><li>Remember Me トークンの原値</li></ul>
   258	<hr>
   259	<h2 id="セッション">セッション</h2>
   260	<p>本機能の GET 雛形ダウンロードは、セッションキー <code>admin.product.sale_high_price_csv.page_count</code> や <code>admin.product.sale_high_price_csv.page_no</code> を読み書きしない（これらはアップロード画面表示用の別ルートで用いられる）。</p>
   261	<hr>
   262	<h2 id="パフォーマンス">パフォーマンス</h2>
   263	<p>雛形は常に 1 行のため、<code>set_time_limit(0)</code> や SQL ロガー無効化など、大量行エクスポート向けの特別処理は掛けない。</p>
   264	<hr>
   265	<h2 id="拡張・差し替え">拡張・差し替え</h2>
   266	<ul><li>ヘッダ列集合を変える場合は雛形ルートと取込ハンドラの両方を整合させる必要がある。</li><li><code>eccube_csv_export_encoding</code> や <code>eccube_csv_export_separator</code> を環境で上書きすると、雛形ファイルのバイト表現が変わる（BOM の有無を含む）。</li></ul>

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php | sed -n '300,390p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   300	
   301	    /**
   302	     * 受注検索用のクエリビルダを返す.
   303	     */
   304	    public function getOrderQueryBuilder(Request $request): QueryBuilder
   305	    {
   306	        $session = $request->getSession();
   307	        $builder = $this->formFactory
   308	            ->createBuilder(SearchOrderType::class);
   309	        $searchForm = $builder->getForm();
   310	
   311	        $viewData = $session->get('eccube.admin.order.search', []);
   312	        $searchData = FormUtil::submitAndGetData($searchForm, $viewData);
   313	
   314	        // 受注データのクエリビルダを構築.
   315	        $qb = $this->orderRepository
   316	            ->getQueryBuilderBySearchDataForAdmin($searchData);
   317	
   318	        return $qb;
   319	    }
   320	
   321	    /**
   322	     * 会員検索用のクエリビルダを返す.
   323	     */
   324	    public function getCustomerQueryBuilder(Request $request): QueryBuilder
   325	    {
   326	        $session = $request->getSession();
   327	        $builder = $this->formFactory
   328	            ->createBuilder(SearchCustomerType::class);
   329	        $searchForm = $builder->getForm();
   330	
   331	        $viewData = $session->get('eccube.admin.customer.search', []);
   332	        $searchData = FormUtil::submitAndGetData($searchForm, $viewData);
   333	
   334	        // 会員データのクエリビルダを構築.
   335	        $qb = $this->customerRepository
   336	            ->getQueryBuilderBySearchData($searchData);
   337	
   338	        return $qb;
   339	    }
   340	
   341	    /**
   342	     * 商品検索用のクエリビルダを返す.
   343	     */
   344	    public function getProductQueryBuilder(Request $request): QueryBuilder
   345	    {
   346	        $session = $request->getSession();
   347	        $builder = $this->formFactory
   348	            ->createBuilder(SearchProductType::class);
   349	        $searchForm = $builder->getForm();
   350	
   351	        $viewData = $session->get('eccube.admin.product.search', []);
   352	        $searchData = FormUtil::submitAndGetData($searchForm, $viewData);
   353	
   354	        // 商品データのクエリビルダを構築.
   355	        $qb = $this->productRepository
   356	            ->getQueryBuilderBySearchDataForAdmin($searchData);
   357	
   358	        return $qb;
   359	    }
   360	
   361	    /**
   362	     * 商品カスタムCSV用
   363	     *
   364	     * @param Product $Product
   365	     * @param CsvExportService $csvExportService
   366	     * @param Request $request
   367	     */
   368	    public function exportProduct(Product $Product, CsvExportService $csvExportService, Request $request): void
   369	    {
   370	        $ProductClasses = $Product->getProductClasses();
   371	
   372	        foreach ($ProductClasses as $ProductClass) {
   373	            $ExportCsvRow = new \Eccube\Entity\ExportCsvRow();
   374	            // CSV出力項目と合致するデータを取得.
   375	            foreach ($csvExportService->getCsvs() as $Csv) {
   376	                $entityName = str_replace('\\\\', '\\', $Csv->getEntityName());
   377	                switch ($entityName) {
   378	                    case 'Eccube\Entity\Product':
   379	                        $ExportCsvRow->setData($csvExportService->getData($Csv, $Product));
   380	                        break;
   381	                    case 'Eccube\Entity\ProductClass':
   382	                        $ExportCsvRow->setData($csvExportService->getData($Csv, $ProductClass));
   383	                        break;
   384	                    case 'Eccube\Entity\Master\MtbCardDetail':
   385	                        $cardDetail = $Product->getCardDetail();
   386	                        $ExportCsvRow->setData($cardDetail !== null ? $csvExportService->getData($Csv, $cardDetail) : null);
   387	                        break;
   388	                    case 'Eccube\Entity\Master\MtbCard':
   389	                        $cardDetail = $Product->getCardDetail();
   390	                        $card = $cardDetail !== null ? $cardDetail->getCard() : null;

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php | sed -n '330,470p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   330	    /**
   331	     * @param EntityManagerInterface $em
   332	     * @param string $name 列名
   333	     *
   334	     * @return BaseCsvColumn タグID（複数）の列定義
   335	     */
   336	    public static function productTagList(EntityManagerInterface $em, string $name = 'タグ(ID)'): BaseCsvColumn
   337	    {
   338	        return self::createMultipleUnsignedNumericColumn($name, 'タグ(ID)')
   339	            ->addValidator(new TagIdValidator($em));
   340	    }
   341	
   342	    /**
   343	     * @param string $name 列名
   344	     *
   345	     * @return BaseCsvColumn 発送日目安IDの列定義（※未使用のデータなので、ダミーの列定義を返す）
   346	     */
   347	    public static function deliveryDateId(string $name = '発送日目安(ID)'): BaseCsvColumn
   348	    {
   349	        return self::dummyColumn($name, '発送日目安(ID)');
   350	    }
   351	
   352	    /**
   353	     * @param string $name 列名
   354	     *
   355	     * @return BaseCsvColumn 販売制限数の列定義
   356	     */
   357	    public static function saleLimit(string $name = '販売制限数'): BaseCsvColumn
   358	    {
   359	        return self::createUnsignedNumericColumn($name, '販売制限数', 9);
   360	    }
   361	
   362	    /**
   363	     * @param string $name 列名
   364	     *
   365	     * @return BaseCsvColumn 販売価格の列定義
   366	     */
   367	    public static function sellPrice(string $name = '販売価格'): BaseCsvColumn
   368	    {
   369	        return self::createUnsignedNumericColumn($name, '販売価格', 9);
   370	    }
   371	
   372	    /**
   373	     * @param string $name 列名
   374	     *
   375	     * @return BaseCsvColumn 買取価格の列定義
   376	     */
   377	    public static function buyPrice(string $name = '買取価格'): BaseCsvColumn
   378	    {
   379	        return self::createUnsignedNumericColumn($name, '買取価格', 9);
   380	    }
   381	
   382	    /**
   383	     * @param string $name 列名
   384	     *
   385	     * @return BaseCsvColumn セールフラグの列定義
   386	     */
   387	    public static function saleFlg(string $name = 'セールフラグ'): BaseCsvColumn
   388	    {
   389	        return self::createNumericChoiceColumn(
   390	            $name,
   391	            'セールフラグ',
   392	            [Constant::DISABLED, Constant::ENABLED]
   393	        );
   394	    }
   395	
   396	    /**
   397	     * @param string $name 列名
   398	     *
   399	     * @return BaseCsvColumn 帯URLの列定義
   400	     */
   401	    public static function beltUrl(string $name = '帯URL'): BaseCsvColumn
   402	    {
   403	        return self::createStringColumn($name, '帯URL');
   404	    }
   405	
   406	    /**
   407	     * @param EntityManagerInterface $em
   408	     * @param string $name 列名
   409	     *
   410	     * @return BaseCsvColumn カードセットIDの列定義
   411	     */
   412	    public static function cardsetId(EntityManagerInterface $em, string $name = 'カードセット(ID)'): BaseCsvColumn
   413	    {
   414	        /** @var \Eccube\Repository\Master\MtbCardsetRepository $repository */
   415	        $repository = $em->getRepository(\Eccube\Entity\Master\MtbCardset::class);
   416	        $cardsets = $repository->findAll();
   417	        $cardsetIds = array_map(function ($cardset) {
   418	            return $cardset->getId();
   419	        }, $cardsets);
   420	
   421	        $column = self::createUnsignedNumericColumn($name, 'カードセット(ID)');
   422	        if ($cardsetIds !== []) {
   423	            $column->addValidator(new ChoiceValidator(array_map('strval', $cardsetIds)));
   424	        }
   425	
   426	        return $column;
   427	    }
   428	
   429	    /**
   430	     * @param string $name 列名
   431	     *
   432	     * @return BaseCsvColumn 基準価格の列定義
   433	     */
   434	    public static function standardPrice(string $name = '基準価格'): BaseCsvColumn
   435	    {
   436	        return self::createUnsignedNumericColumn($name, '基準価格', 9);
   437	    }
   438	
   439	    /**
   440	     * @param string $name 列名
   441	     *
   442	     * @return BaseCsvColumn スマレジ連携フラグの列定義
   443	     */
   444	    public static function smaregiAlignmentFlg(string $name = 'スマレジ連携フラグ'): BaseCsvColumn
   445	    {
   446	        return self::createNumericChoiceColumn(
   447	            $name,
   448	            'スマレジ連携フラグ',
   449	            [Constant::DISABLED, Constant::ENABLED]
   450	        );
   451	    }
   452	
   453	    /**
   454	     * @param string $name 列名
   455	     *
   456	     * @return BaseCsvColumn スマレジ商品コードの列定義
   457	     */
   458	    public static function smaregiProductCode(string $name = 'スマレジ商品コード'): BaseCsvColumn
   459	    {
   460	        return self::createStringColumn($name, 'スマレジ商品コード');
   461	    }
   462	
   463	    /**
   464	     * @param string $name 列名
   465	     *
   466	     * @return BaseCsvColumn 部門コードの列定義
   467	     */
   468	    public static function sectionCode(string $name = '部門コード'): BaseCsvColumn
   469	    {
   470	        return self::createStringColumn($name, '部門コード');

exec
/bin/bash -lc 'rg -n "function fopen|function fputcsv|function fclose|BOM|mb_convert_encoding|eccube_csv_export" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
242:            return implode($this->eccubeConfig['eccube_csv_export_multidata_separator'], $array);
245:            return $data->format($this->eccubeConfig['eccube_csv_export_date_format']);
262:        return fn ($value) => mb_convert_encoding(
263:            (string) $value, $config['eccube_csv_export_encoding'], 'UTF-8'
267:    public function fopen(): void
273:            $encoding = $this->eccubeConfig['eccube_csv_export_encoding'] ?? 'SJIS-win';
284:    public function fputcsv(array $row): void
290:        fputcsv($this->fp, array_map($this->convertEncodingCallBack, $row), $this->eccubeConfig['eccube_csv_export_separator'], '"', '\\');
293:    public function fclose(): void

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php | sed -n '520,610p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
exec
/bin/bash -lc 'rg -n "admin_product_sale_high_price_csv_template|product/sale_high_price/csv_template|sale_high_price_template|admin.product.sale_high_price_csv.page_count|admin.product.sale_high_price_csv.page_no|セール用高額商品価格変更CSV雛形" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /home/y-saito/Developments/ec-cube-enterprise/app/template/admin 2>/dev/null' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:50:     * セール用高額商品価格変更CSV雛形ファイルダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:52:    #[Route(path: '/%eccube_admin_route%/product/sale_high_price/csv_template', name: 'admin_product_sale_high_price_csv_template', methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:58:            'sale_high_price_template.csv'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:73:            'admin.product.sale_high_price_csv.page_count',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:74:            'admin.product.sale_high_price_csv.page_no',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductSaleHighPriceCsvController.php:92:            'template_download_route' => 'admin_product_sale_high_price_csv_template',

codex
共通CSV出力の該当行レンジ指定が外れたため、関数位置に合わせて取り直します。ここは設計の文字コード・BOM・区切りの根拠確認です。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php | sed -n '254,300p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   254	
   255	    /**
   256	     * 文字エンコーディングの変換を行うコールバック関数を返す.
   257	     */
   258	    public function getConvertEncodingCallback(): \Closure
   259	    {
   260	        $config = $this->eccubeConfig;
   261	
   262	        return fn ($value) => mb_convert_encoding(
   263	            (string) $value, $config['eccube_csv_export_encoding'], 'UTF-8'
   264	        );
   265	    }
   266	
   267	    public function fopen(): void
   268	    {
   269	        if (is_null($this->fp) || $this->closed) {
   270	            $this->fp = fopen('php://output', 'w');
   271	            $this->closed = false;
   272	
   273	            $encoding = $this->eccubeConfig['eccube_csv_export_encoding'] ?? 'SJIS-win';
   274	            // Excelを開いたときに文字化けを防ぐため
   275	            if (strtoupper((string) $encoding) === 'UTF-8') {
   276	                fwrite($this->fp, "\xEF\xBB\xBF");
   277	            }
   278	        }
   279	    }
   280	
   281	    /**
   282	     * @param array<int, string|int> $row
   283	     */
   284	    public function fputcsv(array $row): void
   285	    {
   286	        if (is_null($this->convertEncodingCallBack)) {
   287	            $this->convertEncodingCallBack = $this->getConvertEncodingCallback();
   288	        }
   289	
   290	        fputcsv($this->fp, array_map($this->convertEncodingCallBack, $row), $this->eccubeConfig['eccube_csv_export_separator'], '"', '\\');
   291	    }
   292	
   293	    public function fclose(): void
   294	    {
   295	        if (!$this->closed) {
   296	            fclose($this->fp);
   297	            $this->closed = true;
   298	        }
   299	    }
   300	

codex
FALSE_POSITIVE | なし | 候補2件はいずれも誤検知ではない。設計行・実装行とも実在し、内容も一致していない | `admin_product_sale_high_price_csv_export.html:234`, `ProductSaleHighPriceCsvController.php:180`, `admin_product_sale_high_price_csv_export.html:235`, `ProductSaleHighPriceCsvController.php:194` | 候補は維持

WEAK_EVIDENCE | なし | designRef/implRef は存在し、引用趣旨も確認できる。行番号も大きなズレなし | `ProductSaleHighPriceCsvController.php:55`, `AbstractController.php:431` で `getCsvHeader()` のキーが雛形CSVに出力されることも確認 | 根拠不備扱い不要

MISSED | フロント挙動・画面フォーマット表 | findingsは雛形CSVヘッダ欠落と必須バッジ欠落を指摘しているが、アップロード画面のフォーマット表自体も同じ `headers` で描画されるため、設計上の7行ではなく5行表示になる差分が未記載 | 設計: `admin_product_sale_high_price_csv_export.html:233-235`、実装: `ProductSaleHighPriceCsvController.php:83-88`, `base_csv_upload.twig:95-107` | 画面表示行の欠落も別差分として追加

MISSED | データ整合性・取込との一致 | 設計は「ヘッダ列名および列順は取込ハンドラが期待する日本語列名と揃える」とするが、実装の取込ハンドラ自体も `商品コード/販売価格/セールフラグ/帯URL/タグ(ID)` の5列のみで、設計の `買取価格` と `スマレジ連携フラグ` を期待していない。候補は雛形側だけを指摘し、この取込側の設計差分を落としている | 設計: `admin_product_sale_high_price_csv_export.html:238-239`、実装: `SaleHighPriceImportHandler.php:51-55`, `SaleHighPriceImportHandler.php:165-173` | 取込ハンドラ列定義も差分として追加

SEVERITY | ② 業務ルール・計算 / ③ バリデーション | high は概ね妥当。設計が正ならCSV契約の列数・必須列が欠け、利用者が設計どおりの雛形を取得できない。ただし実装の取込側も5列仕様になっているため、「取込失敗を直接誘発する」という根拠は確認不能 | `ProductSaleHighPriceCsvController.php:180-186`, `ProductSaleHighPriceCsvController.php:194-198`, `SaleHighPriceImportHandler.php:51-55` | high維持。ただし業務影響説明は「設計CSV契約不一致」に寄せる

VERDICT: false_positive=0, missed=2, weak_evidence=0, 総合=要修正
tokens used
60,592
FALSE_POSITIVE | なし | 候補2件はいずれも誤検知ではない。設計行・実装行とも実在し、内容も一致していない | `admin_product_sale_high_price_csv_export.html:234`, `ProductSaleHighPriceCsvController.php:180`, `admin_product_sale_high_price_csv_export.html:235`, `ProductSaleHighPriceCsvController.php:194` | 候補は維持

WEAK_EVIDENCE | なし | designRef/implRef は存在し、引用趣旨も確認できる。行番号も大きなズレなし | `ProductSaleHighPriceCsvController.php:55`, `AbstractController.php:431` で `getCsvHeader()` のキーが雛形CSVに出力されることも確認 | 根拠不備扱い不要

MISSED | フロント挙動・画面フォーマット表 | findingsは雛形CSVヘッダ欠落と必須バッジ欠落を指摘しているが、アップロード画面のフォーマット表自体も同じ `headers` で描画されるため、設計上の7行ではなく5行表示になる差分が未記載 | 設計: `admin_product_sale_high_price_csv_export.html:233-235`、実装: `ProductSaleHighPriceCsvController.php:83-88`, `base_csv_upload.twig:95-107` | 画面表示行の欠落も別差分として追加

MISSED | データ整合性・取込との一致 | 設計は「ヘッダ列名および列順は取込ハンドラが期待する日本語列名と揃える」とするが、実装の取込ハンドラ自体も `商品コード/販売価格/セールフラグ/帯URL/タグ(ID)` の5列のみで、設計の `買取価格` と `スマレジ連携フラグ` を期待していない。候補は雛形側だけを指摘し、この取込側の設計差分を落としている | 設計: `admin_product_sale_high_price_csv_export.html:238-239`、実装: `SaleHighPriceImportHandler.php:51-55`, `SaleHighPriceImportHandler.php:165-173` | 取込ハンドラ列定義も差分として追加

SEVERITY | ② 業務ルール・計算 / ③ バリデーション | high は概ね妥当。設計が正ならCSV契約の列数・必須列が欠け、利用者が設計どおりの雛形を取得できない。ただし実装の取込側も5列仕様になっているため、「取込失敗を直接誘発する」という根拠は確認不能 | `ProductSaleHighPriceCsvController.php:180-186`, `ProductSaleHighPriceCsvController.php:194-198`, `SaleHighPriceImportHandler.php:51-55` | high維持。ただし業務影響説明は「設計CSV契約不一致」に寄せる

VERDICT: false_positive=0, missed=2, weak_evidence=0, 総合=要修正

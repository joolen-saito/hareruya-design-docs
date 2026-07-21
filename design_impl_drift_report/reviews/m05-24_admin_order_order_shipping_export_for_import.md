OpenAI Codex v0.142.5
--------
workdir: /home/y-saito/Developments/hareruya-design-docs
model: gpt-5.5
provider: openai
approval: never
sandbox: read-only
reasoning effort: medium
reasoning summaries: none
session id: 019f26ae-aee8-7611-a9fd-a7ec9a50b5ae
--------
user
あなたは設計書vs実装の差分監査に対する**批判的レビュア**です。読み取り専用で検証してください。創作禁止・確認できないものは「確認不能」と明記。

## 対象機能: m05-24_admin_order_order_shipping_export_for_import
- 差分候補JSON(検証対象): /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-24_admin_order_order_shipping_export_for_import.json
- 設計書HTML(正): /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.html
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
差分候補と設計HTML、実装参照を読み合わせます。まずJSONの内容と周辺ファイル構造を確認します。
exec
/bin/bash -lc "nl -ba function_spec_html_preview/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.html | sed -n '1,260p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<!doctype html>
     2	<html lang="ja">
     3	<head>
     4	  <meta charset="utf-8">
     5	  <meta name="viewport" content="width=device-width, initial-scale=1">
     6	  <title>m05-24_admin_order_order_shipping_export_for_import（管理画面_受注管理_出荷実績入力用CSV出力） - 機能仕様書</title>
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
   187	<a class="lv3" href="#CSVをダウンロードする-admin-order-export-for-input-exportForInput">CSVをダウンロードする（`admin_order_export_for_input`、`exportForInput`）</a>
   188	<a class="lv2" href="#集計条件">集計条件</a>
   189	<a class="lv2" href="#業務ルール・計算">業務ルール・計算</a>
   190	<a class="lv3" href="#エッジケース">エッジケース</a>
   191	<a class="lv2" href="#データ整合性">データ整合性</a>
   192	<a class="lv2" href="#API-バッチ結果">API/バッチ結果</a>
   193	<a class="lv2" href="#入出力">入出力</a>
   194	<a class="lv2" href="#DBカラム">DBカラム</a>
   195	<a class="lv3" href="#DB操作">DB操作</a>
   196	<a class="lv2" href="#バリデーション">バリデーション</a>
   197	<a class="lv2" href="#権限・認可">権限・認可</a>
   198	<a class="lv2" href="#画面遷移">画面遷移</a>
   199	<a class="lv2" href="#エラー処理">エラー処理</a>
   200	<a class="lv2" href="#試行制限">試行制限</a>
   201	<a class="lv2" href="#ログ・監査">ログ・監査</a>
   202	<a class="lv3" href="#ログに出してはいけないもの">ログに出してはいけないもの</a>
   203	<a class="lv2" href="#セッション">セッション</a>
   204	<a class="lv3" href="#本機能におけるセッション">本機能におけるセッション</a>
   205	<a class="lv3" href="#セッションへ保存しない情報">セッションへ保存しない情報</a>
   206	<a class="lv2" href="#Cookie">Cookie</a>
   207	<a class="lv2" href="#排他制御・トランザクション">排他制御・トランザクション</a>
   208	<a class="lv2" href="#調査補助-grep向け">調査補助（grep向け）</a>
   209	<a class="lv3" href="#HTTPルート名とパス-コード探索用・旧入口節より退避">HTTPルート名とパス（コード探索用・旧入口節より退避）</a></nav>
   210	    </aside>
   211	    <main class="doc-content">
   212	      <header class="page-header">
   213	        <p class="crumb">Source:<br>/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.md</p>
   214	        <h1>m05-24_admin_order_order_shipping_export_for_import（管理画面_受注管理_出荷実績入力用CSV出力）</h1>
   215	      </header>
   216	      <h2 id="概要">概要</h2>
   217	<p>「出荷実績インポート登録」で取り込むCSVと同一の日本語ヘッダ列を持つファイルを、管理画面からダウンロード応答で返す機能である。画面ラベルは翻訳キー<code>admin.order.shipping_export_for_import</code>で「出荷実績入力用CSVダウンロード」となる。</p>
   218	<p>本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。ソース上の確認値はSymfonyルート、<code>src/Eccube/Controller/Admin/Order/OrderCsvController.php</code>の送信先処理、<code>src/Eccube/Service/Csv/OrderCsv.php</code>、<code>src/Eccube/Repository/OrderRepository.php</code>の出荷実績用CSV検索、<code>src/Eccube/Resource/template/admin/ShippingStandby/edit.twig</code>のボタンとフォーム送信とする。</p>
   219	<p>対象はブラウザ経由の管理画面に限定する。</p>
   220	<p>本機能のカスタマイズ区分は現行踏襲であり、画面挙動と処理フローは現行リポ pf-eccube3 の実装を確認値とし、永続化に関わるテーブル・列の記述は ec-cube-enterprise を正とする。</p>
   221	<p>コントローラの公開関数一覧は本文の主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。</p>
   222	<hr>
   223	<h2 id="リニューアル移行時の扱い">リニューアル移行時の扱い</h2>
   224	<p>DB関連の記述は ec-cube-enterprise を正とする。CSV生成が参照する永続化先のうち、注文の郵便番号の保持方式に現行と移行先で差がある。</p>
   225	<div class="table-wrap"><table><thead><tr><th>観点</th><th>現行（pf-eccube3）</th><th>移行先（ec-cube-enterprise）</th></tr></thead><tbody><tr><td>受注本体</td><td><code>dtb_order</code></td><td>同一テーブル。郵便番号列の構成のみ後述のとおり異なる。</td></tr><tr><td>注文の郵便番号</td><td><code>dtb_order</code> が <code>zip01</code>（3桁）・<code>zip02</code>（4桁）の2列で保持</td><td><code>dtb_order.postal_code</code>（単一列、最大8桁）に統合。先頭3桁・残り4桁への分割はエンティティの取得補助で行う。CSVヘッダは引き続き2列分を出力する。</td></tr><tr><td>配送</td><td><code>dtb_shipping</code>（INNER JOIN のため配送が無い注文は出力対象外）</td><td>同一スキーマ。</td></tr><tr><td>配送先FAX</td><td>専用列なし。CSVでは空文字で補完</td><td>同一。移行先にも配送先FAX列は無く、空文字補完の前提は変わらない。</td></tr></tbody></table></div>
   226	<p>CSVのヘッダ列順・日時書式（<code>Y/m/d H:i:s</code>）・エンコーディング設定は永続化スキーマではなく出力仕様であり、本節の差分管理対象としない。</p>
   227	<hr>
   228	<h2 id="利用者視点の入口">利用者視点の入口</h2>
   229	<div class="table-wrap"><table><thead><tr><th>入口</th><th>URLエンドポイント</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>受注メニューの出荷指示（出荷待ち）詳細ページで一覧のチェック付きを残し「出荷実績入力用CSVダウンロード」ボタンを押す</td><td><code>POST /{admin_route}/order/export/order</code></td><td><code>order_ids[&lt;受注内部ID&gt;]</code>が送られ、共通CSV出力サービスでエンコード・区切り付きのCSVファイルが応答となる。ブラウザのダウンロード挙動は利用者環境に委ねる。</td></tr><tr><td>上記一覧でチェック済みが1件も送られなかった場合</td><td>（同一POSTの前段でフラッシュのみ）</td><td>エラーフラッシュ<code>admin.common.select</code>相当の文言となり、<code>Referer</code>ヘッダがあればそこへ、無ければ<code>admin_order</code>へリダイレクトする確認値となる。ステータスはリダイレクト応答のフレームワーク既定に従う。</td></tr><tr><td>ストリーム直前までにデータ取得が論外終了した場合</td><td>（同一POSTまたはGETの処理分岐による）</td><td>エラーフラッシュに例外または翻訳メッセージを載せ、<code>Referer</code>優先または<code>admin_order</code>へリダイレクトする確認値となる。</td></tr></tbody></table></div>
   230	<hr>
   231	<h2 id="フロント挙動">フロント挙動</h2>
   232	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>表示要素</td><td><code>@admin/ShippingStandby/edit.twig</code>の一覧フォーム（<code>form_bulk</code>）直上に、<code>id="orderExportForInput"</code>のボタンがある。一覧各行のチェックボックスは既定でオン、名前は<code>order_ids[{{ Order.id }}]</code>。</td></tr><tr><td>JS挙動</td><td>クリックで<code>form_bulk</code>から<code>target</code>属性を削除し、<code>action</code>を<code>admin_order_export_for_input</code>へ差し替えて<code>submit</code>する。確認ダイアログは無い確認値である。</td></tr><tr><td>CSS・レイアウト</td><td>本機能専用の見た目変更はコード上読み取れない。</td></tr><tr><td>モーダル・ポップアップ</td><td>本機能では扱わない。</td></tr></tbody></table></div>
   233	<hr>
   234	<h2 id="処理フロー">処理フロー</h2>
   235	<h3 id="CSVをダウンロードする-admin-order-export-for-input-exportForInput">CSVをダウンロードする（<code>admin_order_export_for_input</code>、<code>exportForInput</code>）</h3>
   236	<ol><li>管理画面の認証・共通制約を通過する。</li><li><code>set_time_limit(0)</code>でPHPの実行時間制限を無効にする。</li><li>Doctrineの設定からSQLログ出力を無効にする確認値となる。</li><li><code>order_ids</code>を配列として取得する。PHP配列でない、または空のときフラッシュへ<code>admin.common.select</code>を載せ、<code>Referer</code>が空で無ければそこへ、空ならルート名<code>admin_order</code>へリダイレクトする。</li><li>キー一覧を整数IDの並びとして解釈し、出荷実績用CSV生成関数へ渡す。</li><li>返却データが論理偽となるとき実行時論外メッセージを投げる。そのメッセージは翻訳キー<code>admin.csv.error.export.not_registered</code>であり、標準ロケール下の日本語文言は文言上カード領域向けであり受注一覧からは転用読みとなる（実装確認値）。</li><li>論外を捕まえた場合はフラッシュへメッセージを載せ、同様に<code>Referer</code>または<code>admin_order</code>へリダイレクトする。</li><li>成功経路では<code>StreamedResponse</code>を返す。コールバック内で<code>CsvExportService</code>を開く。</li><li>ヘッダ行として、ヘッダ定数の連想キー配列について<code>array_keys</code>の順で1行書く。</li><li>クエリ結果の各行について、そのまま<code>fputcsv</code>へ渡す。 DoctrineのDateTime項目はクエリ関数内で事前に<code>'Y/m/d H:i:s'</code>形式へ書式化済みとなる。</li><li>ストリームを閉じる。</li><li>ファイル名は接頭辞<code>order_</code>、<code>YmdHis</code>桁そろえ日時、拡張子<code>.csv</code>を連結する実装関数を用いる（受注一覧向け自動命名と接頭辞と形式が字面で同一規則である確認値）。</li><li>応答ヘッダに<code>Content-Type: text/csv;charset=&lt;出力エンコーディング&gt;</code>と<code>Content-Disposition: attachment; filename=…</code>を付与する。<code>&lt;出力エンコーディング&gt;</code>は設定<code>eccube_csv_export_encoding</code>がSJIS系と判定される場合のラベルを<code>windows-31j</code>に寄せたりそうでない場合そのまま読む処理である。</li><li>ストリーム返却の手前で情報ログに「CSV出力ファイル名」とファイル名を記録する。</li></ol>
   237	<hr>
   238	<h2 id="集計条件">集計条件</h2>
   239	<p>本機能は金額集計をしない。結果行数および列値は検索関数の結合規則に従う。</p>
   240	<div class="table-wrap"><table><thead><tr><th>指標</th><th>集計の要点</th></tr></thead><tbody><tr><td>出力対象受注集合</td><td>POSTで送られた内部IDのみ。セッションの受注検索条件とは無関係である。</td></tr><tr><td>受注単位での最大行数</td><td>受注に対し配送（<code>dtb_shipping</code>に相当するORM結合対象）と配送時間の組が複数ありうるとき、<code>GROUP BY</code>句に配送側の識別に足りない列が並ばない構造のため、同一受注で複数配送があるケースでもSQLエンジン実装およびデータの状態によって複数結果行が並ぶ結果になりうる。完全な一意性の保証はクエリのみからは断定しない。</td></tr><tr><td>DBから結果ゼロ</td><td>関数が空とみなされる配列または偽値を返したとき、このコントローラ経路では上記論外となる。すべての指定IDが顧客未紐付け・配送無しなどでクエリ結果に現れなかった場合に該当しうる。</td></tr></tbody></table></div>
   241	<hr>
   242	<h2 id="業務ルール・計算">業務ルール・計算</h2>
   243	<div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>ヘッダ列順</td><td>アップロード側と整合する連想キー並び順（日本語項目名）はルータファイル側のヘッダ定数に固定される。</td></tr><tr><td>日時フォーマット</td><td>Doctrine結果に含まれる日時項目は関数内書式化により<code>OrderRepository::CSV_DATE_FORMAT</code>の確認値<code>'Y/m/d H:i:s'</code>へそろえる。</td></tr><tr><td>顧客郵便番号</td><td>DBは単一桁列の確認値であり、関数内で先頭3桁・残り4桁に<code>SUBSTRING</code>分割して2列出力する実装である。</td></tr><tr><td>配送先FAX</td><td>DB列が無い確認値であり、関数内では空文字3列として埋める。</td></tr><tr><td>文字コード</td><td><code>CsvExportService</code>のコールバックで、セルごとに<code>eccube_csv_export_encoding</code>へ向けて<code>mb_convert_encoding</code>する。UTF-8系と判定されるときのみ先頭BOMを付与するfopen処理である。</td></tr><tr><td>区切り・囲み</td><td><code>eccube_csv_export_separator</code>、<code>fputcsv</code>のエスケープはバックスラッシュ、囲みは二重引用符が確認値である。</td></tr></tbody></table></div>
   244	<p>本機能では画面フォーム入力をサーバへ永続化しないため、<code>### 入力項目</code>の表は置かない。</p>
   245	<h3 id="エッジケース">エッジケース</h3>
   246	<div class="table-wrap"><table><thead><tr><th>ケース</th><th>扱い</th></tr></thead><tbody><tr><td>選択IDリストが論理欠損または空</td><td>フラッシュ<code>admin.common.select</code>相当を載せ、<code>Referer</code>または<code>admin_order</code>へリダイレクト。</td></tr><tr><td>クエリ関数が論理偽のデータ集合を返す</td><td>転用読みとなる翻訳メッセージを載せて実行時論外となり、その後フラッシュ処理とリダイレクト。</td></tr><tr><td>GETで<code>/order/export/order</code>へ入るが本ルート名では無いとき</td><td>Symfonyのマッチは受注dtb_csv系CSVが優先される（GETのみのルートが選ばれた確認環境がある）。セッション検索状態に応じて受注明細粒度の項目定義ファイルが生成される。この取得経路によるファイルは受注一覧用の出力であり、固定ヘッダの出荷実績入力用CSVではない。</td></tr><tr><td>画面上の一覧フォームがCSRF用hidden無しであること</td><td>Twig断片のみでは共通トークンを確認できなかった。送信が拒否されるかはSymfony全体の構成に従う。</td></tr></tbody></table></div>
   247	<hr>
   248	<h2 id="データ整合性">データ整合性</h2>
   249	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>一覧との一致</td><td>受注一覧の検索状態や並び順とは無関係に、<code>order_ids</code>に含まれたIDのみをSQLへ渡す。</td></tr><tr><td>アップロード形式との対応</td><td>ヘッダ定数および列順はインポート実装側のチェック関数と共通のソース定数であり、両者は同一ソースで更新されることが前提となる。一方でSQLが返す列セットはDoctrineの結果キー並びであり、クエリ側の並び変更で列ズレするリスクがあるため、両ファイルの並び確認が運用上の論点となる。</td></tr><tr><td>DBの更新</td><td>読み取りのみ。インポート登録とは別機能。</td></tr></tbody></table></div>
   250	<hr>
   251	<h2 id="API-バッチ結果">API/バッチ結果</h2>
   252	<p>本機能ではAPI呼び出しやバッチ起動は扱わない。</p>
   253	<hr>
   254	<h2 id="入出力">入出力</h2>
   255	<div class="table-wrap"><table><thead><tr><th>種類</th><th>内容</th></tr></thead><tbody><tr><td>入力（成功経路判定に効くもの）</td><td>POSTボディまたは同等の請求項目<code>order_ids</code>（PHP配列。キーが受注内部ID）。クエリでの絞り込み入力は読まない確認値である。</td></tr><tr><td>成功時出力</td><td><code>text/csv</code>ストリーム。1行目は日本語固定ヘッダ。</td></tr><tr><td>失敗時出力</td><td>ブラウザのダウンロードではなく、フラッシュおよびリダイレクトとなる経路がある。</td></tr></tbody></table></div>
   256	<hr>
   257	<h2 id="DBカラム">DBカラム</h2>
   258	<p>当機能はリポジトリの選択子一覧に応じ、<code>dtb_order</code>を中心とし会員情報・決済情報・状態マスタ・配送・都道府県・配送時間帯など多数のJOINに触れる。</p>
   259	<div class="table-wrap"><table><thead><tr><th>テーブル</th><th>列または関係のメモ</th></tr></thead><tbody><tr><td><code>dtb_order</code></td><td>注文番号、計上金額系、関連日時、送り状番号内部保持列など結果に露出する項目がある。詳細な列リストは関数の選択子およびスキーマを正とする。</td></tr><tr><td>会員系</td><td>INNER JOINとなるため結果に現れず、関数が空になりうる。</td></tr><tr><td>配送系（<code>dtb_shipping</code>相当）</td><td>INNER JOINとなるため無い注文は出力から落ちうることをリバース側で押さえる価値がある。</td></tr></tbody></table></div>
   260	<h3 id="DB操作">DB操作</h3>

exec
/bin/bash -lc 'rg -n "shipping_export|export_for_import|Shipping.*Export|order_shipping|配送CSV|出荷CSV|import" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /home/y-saito/Developments/ec-cube-enterprise/app 2>/dev/null' in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "sed -n '1,240p' /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-24_admin_order_order_shipping_export_for_import.json" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
{
  "functionId": "m05-24_admin_order_order_shipping_export_for_import",
  "title": "m05-24_admin_order_order_shipping_export_for_import（管理画面_受注管理_出荷実績入力用CSV出力）",
  "domain": "m05",
  "kind": "admin",
  "designHtml": "function_spec_html_preview/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.html",
  "findings": [
    {
      "dimension": "④DBカラム・DB操作・テーブル",
      "severity": "low",
      "designRef": "function_spec_html_preview/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.html:224-225",
      "designQuote": "CSV生成が参照する永続化先のうち、注文の郵便番号の保持方式に現行と移行先で差がある。… 注文の郵便番号 | dtb_order が zip01・zip02 の2列で保持 | dtb_order.postal_code（単一列、最大8桁）に統合。… CSVヘッダは引き続き2列分を出力する。",
      "implRef": "src/Eccube/Repository/OrderRepository.php:1386",
      "difference": "設計の移行表（HTML line224-225）は本CSV生成が参照する郵便番号の永続化先を『注文の郵便番号＝dtb_order.postal_code』として提示している。しかし実装 generateResultCsv は郵便番号列を『顧客』分は SUBSTRING(c.postal_code,...)（dtb_customer, L1386-1387）から、『配送先』分は SUBSTRING(s.postal_code,...)（dtb_shipping, L1427-1428）から取得しており、受注本体 dtb_order.postal_code（o.postal_code）は本CSVで一切参照されない（o.postal_code の参照は別メソッドの L1934/1947 のみ）。同設計書の業務ルール節（HTML line243『顧客郵便番号…SUBSTRING分割』）は実装と整合しており、移行表側の『注文の郵便番号 / dtb_order.postal_code』というデータ源ラベルのみが実装のデータ源（顧客・配送先）と食い違う。severity/confidence とも low。",
      "confidence": "low",
      "verdict": "CONFIRMED",
      "evidence": "src/Eccube/Repository/OrderRepository.php:1386-1387 (SUBSTRING(c.postal_code) AS customer_zip01/02, c=dtb_customer), :1427-1428 (SUBSTRING(s.postal_code) AS shipping_zip01/02, s=dtb_shipping); o.postal_code は同ファイル L1934/1947 の別メソッドのみで generateResultCsv(L1373-1490) には不在。設計HTML L224-225 migration表 vs L243 業務ルール表（顧客郵便番号SUBSTRING分割）。"
    }
  ]
}

 succeeded in 112ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/_product_list_breadcrumb_items.twig:5:{% import 'breadcrumb_nav.twig' as hareruya_breadcrumb %}
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:61425:	 (32328,4,'カリムポートの殺し屋、サファナ','Safana, Calimport Cutthroat','威迫
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbShippingStandby.php:54:    #[ORM\JoinTable(name: 'dtb_order_shipping_standby')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Deck/show.en.twig:77:{% import _self as deck_detail %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Deck/show.en.twig:146:                                        {{ 'front.deck.show.arena_import_text'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Deck/show.en.twig:240:                                        {{ 'front.deck.show.arena_import_text'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Contact/confirm.twig:18:{% import _self as contact_page %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Product/list.twig:24:            z-index: 9000 !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/toolbar/eccube.html.twig:25:            display: block !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/toolbar/eccube.html.twig:27:            margin-right: 4px !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/toolbar/eccube.html.twig:28:            margin-left: 0 !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Contact/index.twig:21:{% import _self as contact_page %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/purchase_history_detail.twig:12:                background-color: #ffdddd !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1353:front.deck.show.arena_import_text: Arena import text
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1537:  If our email does not arrive, you may miss important information and your sale process could be delayed.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2128:admin.stock.move.shortage_csv_invalid_status: The current status does not allow shortage CSV import.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2133:admin.stock.move.shortage_csv_import.file_not_found: 'The file could not be read.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2134:admin.stock.move.shortage_csv_import.shortage_qty_invalid: 'Line %line%: Shortage quantity must be an integer of 0 or greater.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2135:admin.stock.move.shortage_csv_import.product_code_duplicated: 'Line %line%: Product code "%code%" is duplicated in the CSV.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2136:admin.stock.move.shortage_csv_import.product_code_not_found: 'Line %line%: Product code "%code%" was not found in this stock move.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2137:admin.stock.move.shortage_csv_import.shortage_qty_exceeds_move: 'Line %line%: Shortage quantity (%shortage%) exceeds move quantity (%max%).'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2141:admin.stock.move.shortage_csv_modal.format_product_name_desc: Reference only (not updated on import)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2143:admin.stock.move.shortage_csv_modal.format_move_qty_desc: Reference only (not updated on import)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2146:admin.stock.move.differential_csv_invalid_status: The current status does not allow differential CSV import.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2151:admin.stock.move.differential_csv_import.difference_qty_invalid: 'Line %line%: Difference quantity must be an integer.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2152:admin.stock.move.differential_csv_import.product_code_duplicated: 'Line %line%: Product code "%code%" is duplicated in the CSV.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2153:admin.stock.move.differential_csv_import.product_code_not_found: 'Line %line%: Product code "%code%" was not found in this stock move.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2154:admin.stock.move.differential_csv_import.difference_qty_exceeds_actual_move: 'Line %line%: Difference quantity (%difference%) exceeds actual move quantity (%max%).'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2155:admin.stock.move.differential_csv_import.difference_qty_out_of_range: 'Line %line%: Difference quantity must be between %min% and %max%.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2159:admin.stock.move.differential_csv_modal.format_product_name_desc: Reference only (not updated on import)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2161:admin.stock.move.differential_csv_modal.format_actual_move_qty_desc: Reference only (not updated on import)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3404:admin.stock.split_join.list_csv_import_submit: Import from CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3405:admin.stock.split_join.list_csv_join_import_done: 'Registered %count% join(s) and advanced to shortage entry.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3406:admin.stock.split_join.list_csv_split_import_done: 'Registered %count% split(s) and submitted for approval.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3494:admin.stock.join_csv_modal.reflect_only_note_list: "※ The CSV contents will be imported and saved as awaiting approval."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3503:admin.stock.split.rejected_operation_locked: 'This split has been rejected. Quantity changes, additions, deletions, and CSV imports are not allowed.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3605:admin.deck.csv_import: CSV Import
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3699:admin.archetype.csv_import: CSV Import
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3789:api.deck_builder.deck.import_register_success: 'Deck registration success by import'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3790:api.deck_builder.deck.import_update_success: 'Deck update success by import'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/purchase_history_detail_net.twig:7:{% import _self as purchase_history_net %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:86:        $('#deckentry-import [data-js-modal-close]').trigger('click');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:127:    // how-to-import へのスクロール（グローバルJSがアンカー遷移を横取りするため明示的に実装）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:128:    $('a[href="#how-to-import"]').on('click', function(e) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:130:        const $target = $('#how-to-import');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:133:                history.pushState(null, null, '#how-to-import');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:219:                        <p class="p-hareruya-deckentry-edit__card-select-subtitle">インポートから登録<a href="#how-to-import" aria-label="インポート方法を見る"><i class="icon-hareruya-help c-hareruya-icon" aria-hidden="true"></i></a></p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:220:                        <div class="p-hareruya-deckentry-edit__import-actions">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:221:                            <button class="p-hareruya-deckentry-edit__import-btn" type="button" data-js-modal-trigger="deckentry-import" aria-controls="deckentry-import" aria-haspopup="dialog">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:225:                            <button class="p-hareruya-deckentry-edit__import-btn" type="button" data-js-modal-trigger="deckentry-mydeck" aria-controls="deckentry-mydeck" aria-haspopup="dialog">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:316:            <div class="p-hareruya-deckentry-edit__freespace" id="how-to-import">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:317:                {% include 'Block/deck_entry_how_to_import.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:325:<div class="p-hareruya-modal" id="deckentry-import" data-js-modal aria-hidden="true" role="dialog" aria-modal="true">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:337:                <div class="p-hareruya-deckentry-edit__import-modal-content">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:339:                    <textarea class="p-hareruya-deckentry-edit__import-textarea" id="arenaDeckList" name="arenaDeckList" placeholder="Magic Online形式またはMTG Arena形式が使用できます"></textarea>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/mtb_csv_type.csv:5:"4","配送CSV","1"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ShippingStandbyCsvExporterService.php:22:class ShippingStandbyCsvExporterService
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/index.twig:17:    display: block !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1732:admin.common.csv_import_error: CSVインポートエラー
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1734:admin.common.csv_import: CSV取り込み
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1935:admin.product.csv_import_history_title: CSVインポート履歴
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1936:admin.product.csv_import_history_filename: ファイル名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1937:admin.product.csv_import_history_upload_date: アップロード日時
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1938:admin.product.csv_import_history_operator: 作業者
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2295:admin.product.csv.import: CSV入力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2412:admin.order.shipping_csv_upload: 出荷CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2529:admin.order.shipping_csv: 出荷CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2575:# 出荷CSV雛形
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3974:admin.product.inventory_plan.csv_import_title: 棚卸商品CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3975:admin.product.inventory_plan.csv_import_limit: '1ファイルの登録上限は %max% 件です'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3976:admin.product.inventory_plan.csv_import_submit: 商品登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3983:admin.product.inventory_plan.quantity_csv_import_title: 棚卸商品数量CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3984:admin.product.inventory_plan.quantity_csv_import_submit: 数量登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3985:admin.product.inventory_plan.quantity_csv_import.complete: 棚卸数量を登録しました。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4058:admin.order.shipping_export_for_import: 出荷実績入力用CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4059:admin.order.shipping_import: 出荷実績インポート登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4320:admin.deck.csv_import: CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4414:admin.archetype.csv_import: CSV取り込み
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4555:admin.stock.move.shortage_csv_import.file_not_found: 'ファイルが読み込めません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4556:admin.stock.move.shortage_csv_import.shortage_qty_invalid: '%line%行目: 欠品点数は0以上の整数で入力してください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4557:admin.stock.move.shortage_csv_import.product_code_duplicated: '%line%行目: 商品コード「%code%」がCSV内で重複しています。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4558:admin.stock.move.shortage_csv_import.product_code_not_found: '%line%行目: 商品コード「%code%」がこの在庫移動に見つかりません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4559:admin.stock.move.shortage_csv_import.shortage_qty_exceeds_move: '%line%行目: 欠品点数（%shortage%）が移動点数（%max%）を超えています。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4597:admin.stock.move.differential_csv_import.difference_qty_invalid: '%line%行目: 差分点数は整数で入力してください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4598:admin.stock.move.differential_csv_import.product_code_duplicated: '%line%行目: 商品コード「%code%」がCSV内で重複しています。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4599:admin.stock.move.differential_csv_import.product_code_not_found: '%line%行目: 商品コード「%code%」がこの在庫移動に見つかりません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4600:admin.stock.move.differential_csv_import.difference_qty_exceeds_actual_move: '%line%行目: 差分点数（%difference%）が実移動点数（%max%）を超えています。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4601:admin.stock.move.differential_csv_import.difference_qty_out_of_range: '%line%行目: 差分点数は%min%～%max%の範囲で入力してください。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4828:admin.stock.split_join.list_csv_import_submit: CSVから登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4830:admin.stock.split_join.list_csv_join_import_done: '%count% 件の結合を登録し、欠品入力まで進めました。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4831:admin.stock.split_join.list_csv_split_import_done: '%count% 件の分割を登録し、承認申請まで進めました。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5660:front.deck.show.arena_import_text: アリーナ用インポートテキスト
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5808:admin.order.shipping_csv.download: 出荷CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5810:admin.order.shipping_csv.setting: 出荷CSV出力項目設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5812:admin.order.custom_shipping_csv.download: カスタム配送CSVダウンロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6267:api.deck_builder.deck.import_register_success: 'インポートによるデッキ登録に成功しました'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6268:api.deck_builder.deck.import_update_success: 'インポートによるデッキ更新に成功しました'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/index.twig:19:        display: block !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:18:            const $fileInput = $('#admin_csv_import_import_file');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:27:                    $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:64:                                <form id="upload-form" method="post" action="{{ url('admin_event_entry_bulk_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:68:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:69:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,.csv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/event_bulk_csv_import.twig:70:                                        {{ form_errors(form.import_file) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/decklist.twig:170:                display: table !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/decklist.twig:171:                width: 100% !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/decklist.twig:173:                table-layout: fixed !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/decklist.twig:177:                display: table-row-group !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/decklist.twig:181:                display: table-row !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/decklist.twig:190:                display: table-cell !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/decklist.twig:191:                width: 50% !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/decklist.twig:207:                width: 100% !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:9:    <form id="form-stock-join-csv-upload" method="post" action="{{ join_csv_list_import_url|default(url('admin_stock_split_join_list_join_csv_import')) }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:27:                    {{ form_widget(form.import_file, {'attr': {'class': 'd-none', 'accept': 'text/csv'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:29:                {{ form_errors(form.import_file) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:32:                {% if join_csv_list_import_url is defined and join_csv_list_import_url %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_csv_modal_body.twig:33:                    <button type="submit" class="btn btn-ec-conversion" id="btn-join-csv-import">{{ 'admin.stock.split_join.list_csv_import_submit'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/banner.twig:26:            background-color: transparent !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:12:            display: none !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:13:            opacity: 0 !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:14:            pointer-events: none !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:15:            visibility: hidden !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_shortage_csv_modal.twig:7:      action="{{ url('admin_stock_join_shortage_csv_import', { id: StockSplitJoin.id }) }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_shortage_csv_modal.twig:15:            <input type="file" name="import_file" id="join-shortage-csv-file" class="d-none" accept=".csv,text/csv,text/plain">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:13:                $('#admin_stock_change_csv_list_import_file').click();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:14:                $('#admin_stock_change_csv_list_import_file').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:17:                        $('#admin_stock_change_csv_list_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:132:            const fileInput = document.getElementById('admin_stock_change_csv_list_import_file');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:405:                                        <span id="admin_stock_change_csv_list_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:406:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,text/tsv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/change.twig:407:                                        {{ form_errors(form.import_file) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:10:    <form id="form-stock-split-csv-upload" method="post" action="{{ split_csv_list_import_url|default(url('admin_stock_split_join_list_split_csv_import')) }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:51:                    {{ form_widget(form.import_file, {'attr': {'class': 'd-none', 'accept': 'text/csv'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:53:                {{ form_errors(form.import_file) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:57:                {% if split_csv_list_import_url is defined and split_csv_list_import_url %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_csv_modal_body.twig:58:                    <button type="submit" class="btn btn-ec-conversion" id="btn-split-csv-import">{{ 'admin.stock.split_join.list_csv_import_submit'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:15:            background-color: var(--bs-table-accent-bg) !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:16:            border-color: var(--bs-table-accent-bg) !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:635:                                      action="{{ url('admin_stock_move_inbound_approval_request_differential_csv_import', { id: StockMoveTransfer.id }) }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:642:                                            <input type="file" name="import_file" id="move-differential-csv-file" class="form-control form-control-sm" accept=".csv,text/csv,text/plain">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/history.twig:16:    display: block !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:87:        background-color: #ffdddd !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:15:                <p class="text-muted small mb-3">{{ 'admin.product.inventory_plan.csv_import_limit'|trans({'%max%': csvImportMaxRecords|number_format}) }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_csv_modal.twig:23:                            <input type="file" name="{{ form_name }}[import_file]" id="{{ file_input_id }}" class="d-none" accept=".csv,text/csv,.tsv,text/tsv">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:178:                                    {{ 'admin.product.inventory_plan.csv_import_submit'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:184:                                    {{ 'admin.product.inventory_plan.quantity_csv_import_submit'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:270:            modal_title: 'admin.product.inventory_plan.csv_import_title',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:274:            upload_url: path('admin_stock_inventory_plan_import', { id: form.vars.value.id }),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:275:            submit_label: 'admin.product.inventory_plan.csv_import_submit',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:282:            modal_title: 'admin.product.inventory_plan.quantity_csv_import_title',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:286:            upload_url: path('admin_stock_inventory_plan_quantity_import', { id: form.vars.value.id }),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/inventory_plan_edit.twig:287:            submit_label: 'admin.product.inventory_plan.quantity_csv_import_submit',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/csv_card.twig:5:{% block import_file_accept %}.csv, text/csv{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/index.twig:168:                {{ 'admin.common.csv_import'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/block.twig:21:            z-index: inherit !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/news.twig:22:            z-index: inherit !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveShortageImportHandler.php:188:                'admin.stock.move.shortage_csv_import.shortage_qty_invalid',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveShortageImportHandler.php:208:                'admin.stock.move.shortage_csv_import.product_code_duplicated',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveShortageImportHandler.php:230:                'admin.stock.move.shortage_csv_import.product_code_not_found',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveShortageImportHandler.php:253:                'admin.stock.move.shortage_csv_import.shortage_qty_exceeds_move',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:3:{% set menus = ['product', 'section_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:43:                $('#admin_csv_import_import_file').click();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:44:                $('#admin_csv_import_import_file').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:47:                        $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:66:                                <form id="upload-form" method="post" action="{{ url('admin_product_department_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:70:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:71:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,text/tsv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_department.twig:72:                                        {{ form_errors(form.import_file) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/storage_code.twig:65:                                {{ 'admin.product.csv.import'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:13:{% set menus = ['product', 'product_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:23:            $('#importCsv').on('click', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:85:                            url: '{{ url('admin_product_csv_split_import') }}',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:90:                                force_file_to_db: $('#admin_csv_import_force_file_to_db').prop('checked')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:142:                var modal = $('#importCsvModal')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:193:            $('#importCsvDone').on('click', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:198:                $('#admin_csv_import_import_file').click();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:199:                $('#admin_csv_import_import_file').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:202:                        $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:223:                                <form id="upload-form" method="post" action="{{ url('admin_product_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:227:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:228:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,text/tsv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:229:                                        {{ form_errors(form.import_file) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:231:                                    <button class="btn btn-ec-conversion" id="upload-button" type="button" data-bs-toggle="modal" data-bs-target="#importCsvModal" disabled>{{ 'admin.common.bulk_registration'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:283:    <div class="modal fade" id="importCsvModal" tabindex="-1" role="dialog" aria-labelledby="importCsvModal" aria-hidden="true" data-bs-keyboard="false" data-bs-backdrop="static">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:303:                    <button class="btn btn-ec-conversion" type="button" id="importCsv">{{ 'admin.common.bulk_registration' | trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product.twig:304:                    <button class="btn btn-ec-regular" id="importCsvDone" style="display: none" type="button" data-bs-dismiss="modal">{{ 'admin.common.close'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:13:{% set menus = ['product', 'class_category_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:53:                $('#admin_csv_import_import_file').click();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:54:                $('#admin_csv_import_import_file').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:57:                        $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:76:                                <form id="upload-form" method="post" action="{{ url('admin_product_class_category_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:80:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:81:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,text/tsv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_category.twig:82:                                        {{ form_errors(form.import_file) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_goods.twig:3:{% set menus = ['product', 'product_csv_management', 'product_goods_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:12:            background-color: var(--bs-table-accent-bg) !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:13:            border-color: var(--bs-table-accent-bg) !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:570:                                      action="{{ url('admin_stock_move_shortage_csv_import', { id: StockMoveTransfer.id }) }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:577:                                            <input type="file" name="import_file" id="move-shortage-csv-file" class="form-control form-control-sm" accept=".csv,text/csv,text/plain">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_source_csv_modal.twig:67:                            <input type="file" name="import_file" id="{{ jm_file_id }}" class="d-none" accept=".csv,text/csv,text/plain">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/ProductClass/edit.twig:14:            display: none !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/section.twig:48:                                {{ 'admin.product.csv.import'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:429:                    {% include '@admin/Stock/stock_split_csv_modal_body.twig' with splitCsvModal|merge({ split_csv_list_import_url: url('admin_stock_split_join_list_split_csv_import') }) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:449:                    {% include '@admin/Stock/stock_join_csv_modal_body.twig' with joinCsvModal|merge({ join_csv_list_import_url: url('admin_stock_split_join_list_join_csv_import') }) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:522:                if (!e.target.name || e.target.name.indexOf('import_file') === -1) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Data/top_banner.twig:25:            background-color: transparent !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Data/top_banner.twig:84:            display: none !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Data/top_banner.twig:87:            display: block !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig:17:    display: block !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/index.twig:15:            background-color: #f7f7f7 !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/index.twig:16:            box-shadow: inset 0 0 0 9999px #f7f7f7 !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/index.twig:17:            --bs-table-bg-state: #f7f7f7 !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/index.twig:18:            --bs-table-bg-type: #f7f7f7 !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/index.twig:27:            right: 100% !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/index.twig:28:            left: auto !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/index.twig:29:            top: 0 !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/index.twig:31:            transform: none !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/index.twig:68:            <a href="{{ url('admin_archetype_csv_import') }}" class="btn btn-ec-conversion">{{ 'admin.archetype.csv_import'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/product.twig:624:                                    {% import _self as selfMacro %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/product.twig:640:                                    {% import _self as renderMacro %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:20:{% block import_file_accept %}.csv, text/csv, .tsv, text/tsv{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:40:                {% if import_errors is defined and import_errors|length > 0 %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:43:                            <i class="fa fa-exclamation-triangle mr-2"></i>{{ 'admin.common.csv_import_error'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:46:                            {% for error in import_errors %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:65:                                            {{ form_widget(form.import_file, {'attr': {'class': 'custom-file-input', 'accept': block('import_file_accept')}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:67:                                        {{ form_errors(form.import_file) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:113:                {% include '@admin/Product/csv_import_history.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/approval.twig:40:            display: block !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/approval.twig:43:            display: none !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:27:            background-color: #fff !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:28:            --bs-table-bg: #fff !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:29:            --bs-table-bg-state: #fff !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:30:            --bs-table-bg-type: #fff !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:39:            var $fileInput = $('#admin_csv_import_import_file');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:48:                    $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:79:                                <form id="upload-form" method="post" action="{{ url('admin_archetype_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:83:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:84:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,.csv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/csv_import.twig:85:                                        {{ form_errors(form.import_file) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/history.twig:17:    display: block !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_import_history.twig:1:{% if import_histories_pagination is defined and import_histories_pagination is not null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_import_history.twig:6:                <h4 class="card-title mb-0">{{ 'admin.product.csv_import_history_title'|trans }}</h4>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_import_history.twig:24:                        <th class="text-nowrap">{{ 'admin.product.csv_import_history_filename'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_import_history.twig:25:                        <th class="text-nowrap">{{ 'admin.product.csv_import_history_upload_date'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_import_history.twig:26:                        <th class="text-nowrap">{{ 'admin.product.csv_import_history_operator'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_import_history.twig:30:                    {% for importHistory in import_histories_pagination %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_import_history.twig:32:                            <td>{{ importHistory.fileName }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_import_history.twig:33:                            <td>{{ importHistory.createDate|date('Y-m-d H:i') }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_import_history.twig:34:                            <td>{{ importHistory.member is not null ? importHistory.member.name : '' }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_import_history.twig:44:        {% if import_histories_pagination.paginationData.pageCount > 1 and history_page_route is defined %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_import_history.twig:46:            {% include '@admin/pager.twig' with { 'pages': import_histories_pagination.paginationData, 'routes': history_page_route } %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_simple_high_price.twig:3:{% set menus = ['product', 'product_csv_management', 'simple_high_price_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/index.twig:37:            overflow: visible !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/edit.twig:23:            height: calc(1.5em + 0.75rem + 2px) !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/edit.twig:24:            border: 1px solid #ced4da !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/edit.twig:25:            border-radius: 0.25rem !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/edit.twig:26:            display: flex !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/edit.twig:27:            align-items: center !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/edit.twig:30:            display: flex !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/edit.twig:31:            align-items: center !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/edit.twig:32:            justify-content: flex-start !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/edit.twig:33:            width: 100% !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/edit.twig:34:            height: 100% !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/edit.twig:35:            line-height: 1 !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/edit.twig:36:            padding-left: 0 !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/edit.twig:37:            text-align: left !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/edit.twig:40:            color: #999 !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/edit.twig:41:            text-align: left !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Archetype/edit.twig:44:            height: 100% !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_destination_csv_modal.twig:69:                            <input type="file" name="import_file" id="{{ sdp_file_id }}" class="d-none" accept=".csv,text/csv,text/plain">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig:48:                {% if import_errors is defined and import_errors|length > 0 %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig:51:                            <i class="fa fa-exclamation-triangle mr-2"></i>{{ 'admin.common.csv_import_error'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig:54:                            {% for error in import_errors %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig:62:                <form id="upload-form" method="post" action="{{ url('admin_product_storage_code_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig:74:                                            {{ form_widget(form.import_file, {'attr': {'class': 'custom-file-input', 'accept': '.csv, text/csv, .tsv, text/tsv'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_storage_code.twig:76:                                        {{ form_errors(form.import_file) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/payment.twig:21:            z-index: inherit !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:127:                                                        {{ 'admin.order.shipping_export_for_import'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_card_bulk.twig:13:{% set menus = ['product', 'product_csv_management', 'product_card_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_status.twig:3:{% set menus = ['product', 'product_csv_management', 'admin_product_status_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/mail_view.twig:18:        width: 100% !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/mail_view.twig:21:        width: 100% !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:13:{% set menus = ['order', 'admin_shipping_result_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:24:                $('#admin_csv_import_import_file').click();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:25:                $('#admin_csv_import_import_file').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:28:                        $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:45:                <form id="upload-form" method="post" action="{{ url('admin_shipping_result_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:53:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:54:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,text/tsv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:55:                                        {{ form_errors(form.import_file) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_sale_high_price.twig:3:{% set menus = ['product', 'product_csv_management', 'sale_high_price_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/shelf_number.twig:65:                                {{ 'admin.product.csv.import'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category_bulk.twig:3:{% set menus = ['product', 'product_csv_management', 'category_bulk_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_tag.twig:3:{% set menus = ['product', 'product_csv_management', 'product_tag_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_price.twig:3:{% set menus = ['product', 'product_csv_management', 'product_price_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:13:{% set menus = ['product', 'class_name_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:53:                $('#admin_csv_import_import_file').click();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:54:                $('#admin_csv_import_import_file').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:57:                        $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:76:                                <form id="upload-form" method="post" action="{{ url('admin_product_class_name_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:80:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:81:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,text/tsv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_class_name.twig:82:                                        {{ form_errors(form.import_file) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:18:            right: 100% !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:19:            left: auto !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:20:            top: 0 !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:22:            transform: none !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:25:            height: calc(1.5em + 0.75rem + 2px) !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:26:            border: 1px solid #ced4da !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:27:            border-radius: 0.25rem !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:28:            display: flex !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:29:            align-items: center !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:32:            display: flex !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:33:            align-items: center !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:34:            justify-content: flex-start !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:35:            width: 100% !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:36:            height: 100% !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:37:            line-height: 1 !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:38:            padding-left: 0 !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:39:            text-align: left !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:42:            color: #999 !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:43:            text-align: left !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:46:            height: 100% !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:226:            <a href="{{ url('admin_deck_csv_import') }}" class="btn btn-ec-conversion">{{ 'admin.deck.csv_import'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_section.twig:3:{% set menus = ['product', 'product_csv_management', 'admin_product_section_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_standard_price.twig:3:{% set menus = ['product', 'product_csv_management', 'product_standard_price_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:13:{% set menus = ['product', 'category_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:52:                $('#admin_csv_import_import_file').click();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:53:                $('#admin_csv_import_import_file').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:56:                        $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:75:                                <form id="upload-form" method="post" action="{{ url('admin_product_category_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:79:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:80:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,text/tsv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_category.twig:81:                                        {{ form_errors(form.import_file) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_tag_sales_analysis.twig:3:{% set menus = ['product', 'product_csv_management', 'product_tag_sales_analysis_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/edit.twig:15:            height: calc(1.5em + 0.75rem + 2px) !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/edit.twig:16:            border: 1px solid #ced4da !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/edit.twig:17:            border-radius: 0.25rem !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/edit.twig:18:            display: flex !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/edit.twig:19:            align-items: center !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/edit.twig:22:            display: flex !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/edit.twig:23:            align-items: center !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/edit.twig:24:            justify-content: flex-start !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/edit.twig:25:            width: 100% !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/edit.twig:26:            height: 100% !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/edit.twig:27:            line-height: 1 !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/edit.twig:28:            padding-left: 0 !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/edit.twig:29:            text-align: left !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/edit.twig:32:            color: #999 !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/edit.twig:33:            text-align: left !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/edit.twig:36:            height: 100% !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/latest_event_deck.twig:14:            background-color: transparent !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:219:        $importService = new CsvImportService(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:221:            $this->eccubeConfig['eccube_csv_import_delimiter'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:222:            $this->eccubeConfig['eccube_csv_import_enclosure']
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:225:        if (!$importService->setHeaderRowNumber(0)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:228:        $importService->next();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:229:        if (!$importService->valid()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:232:        $importService->seek(0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:243:        foreach ($importService as $rowIndex => $rowData) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/category.twig:476:            {% import _self as selfMacro %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/category.twig:508:                            {% import _self as renderMacro %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:34:            margin-bottom: 10px !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:37:            background-color: #fff !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:38:            --bs-table-bg: #fff !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:39:            --bs-table-bg-state: #fff !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:40:            --bs-table-bg-type: #fff !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:49:            var $fileInput = $('#admin_csv_import_import_file');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:58:                    $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:89:                                <form id="upload-form" method="post" action="{{ url('admin_deck_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:93:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:94:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,.csv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/csv_import.twig:95:                                        {{ form_errors(form.import_file) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:13:            display: none !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:14:            opacity: 0 !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:15:            pointer-events: none !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:16:            visibility: hidden !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:22:{% import _self as moveTransferMacros %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:325:            const $approvalDepartmentSelect = $('#stock_transfer_csv_import_approval_department');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:326:            const $approvalNotificationTargetMembersSelect = $('#stock_transfer_csv_import_approval_notification_target_members');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:327:            const $stockTransferTargetBaseSelect = $('#stock_transfer_csv_import_transfer_base_info');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:809:                        action: path('admin_stock_move_transfer_move_csv_import'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:845:                            <label class="form-label" for="{{ stockMoveCsvImportForm.import_file.vars.id }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:852:                                {{ form_widget(stockMoveCsvImportForm.import_file, { attr: { class: 'd-none', accept: 'text/csv,.csv,text/plain' } }) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:854:                            {{ form_errors(stockMoveCsvImportForm.import_file) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:901:                        action: path('admin_stock_move_transfer_transfer_csv_import'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:943:                            <label class="form-label" for="{{ stockTransferCsvImportForm.import_file.vars.id }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:950:                                {{ form_widget(stockTransferCsvImportForm.import_file, { attr: { class: 'd-none', accept: 'text/csv,.csv,text/plain' } }) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:13:{% set menus = ['order', 'shipping_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:51:                $('#admin_csv_import_import_file').click();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:52:                $('#admin_csv_import_import_file').on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:55:                        $('#admin_csv_import_import_file_name').text(files[0].name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:82:                                <form id="upload-form" method="post" action="{{ url('admin_shipping_csv_import') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:86:                                        <span id="admin_csv_import_import_file_name">{{ 'admin.common.file_select_empty'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:87:                                        {{ form_widget(form.import_file, {'attr': {'accept': 'text/csv,text/tsv', 'class': 'd-none'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/csv_shipping.twig:88:                                        {{ form_errors(form.import_file) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:37:  background:#fcc !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:40:  background:#fff !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:43:  background:#ccc !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:46:  background:#aaa !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:106:  border-radius:  0 0 2px 2px !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:112:  border-radius: 2px 2px 0 0 !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:145:  border-top: 1px solid #5d8fc2 !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:146:  border-bottom: 1px solid #5d8fc2 !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:147:  background: #5d8fc2; !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:152:  border-top: 1px solid #5cb85c !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:153:  border-bottom: 1px solid #5cb85c !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:154:  background: #5cb85c; !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:163:  border-bottom: 1px solid #ccc !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/csv_product_shelf_number_update.twig:3:{% set menus = ['product', 'product_csv_management', 'shelf_number_csv_import'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:70:        margin-bottom: 0 !important;

codex
JSONにはfindingが1件だけあります。設計側は該当節だけでなく、処理フロー・DBカラム・業務ルールも同じ主張に関わるため、実装のコントローラ、CSVサービス、リポジトリ、Twig入口を絞って確認します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php | sed -n '1360,1505p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
  1360	            ->setParameter('shippingIds', $shippingIds, ArrayParameterType::INTEGER)
  1361	            ->setParameter('stackPaperThresholdPrice', (int) $optionValues['stack_paper_threshold_price'])
  1362	            ->getResult();
  1363	    }
  1364	
  1365	    /**
  1366	     * 受注管理
  1367	     * 出荷実績インポート用CSVに出力する情報を取得
  1368	     *
  1369	     * @param array<int> $orderIdList
  1370	     *
  1371	     * @return array<int, mixed>
  1372	     */
  1373	    public function generateResultCsv(array $orderIdList): array
  1374	    {
  1375	        $qb = $this->getEntityManager()->createQueryBuilder()
  1376	            ->from('Eccube\Entity\Order', 'o')
  1377	            ->select([
  1378	                'o.order_number',
  1379	                'c.id AS customer_id',
  1380	                'c.name01 AS customer_name01',
  1381	                'c.name02 AS customer_name02',
  1382	                'c.kana01 AS customer_kana01',
  1383	                'c.kana02 AS customer_kana02',
  1384	                'c.company_name AS customer_company_name',
  1385	                // TODO：顧客郵便番号はテーブルでカラムが01，02に分かれていない。一旦ここで分割して出力する。
  1386	                'SUBSTRING(c.postal_code, 1, 3) AS customer_zip01',
  1387	                'SUBSTRING(c.postal_code, 4, 4) AS customer_zip02',
  1388	                'cp.id AS customer_pref_id',
  1389	                'cp.name AS customer_pref_name',
  1390	                'c.addr01 AS customer_addr01',
  1391	                'c.addr02 AS customer_addr02',
  1392	                'c.addr03 AS customer_addr03',
  1393	                'c.email AS customer_email',
  1394	                'c.tel01 AS customer_tel01',
  1395	                'c.tel02 AS customer_tel02',
  1396	                'c.tel03 AS customer_tel03',
  1397	                'c.fax01 AS customer_fax01',
  1398	                'c.fax02 AS customer_fax02',
  1399	                'c.fax03 AS customer_fax03',
  1400	                'cs.id AS customer_sex_id',
  1401	                'cs.name AS customer_sex',
  1402	                'cj.id AS customer_job_id',
  1403	                'cj.name AS customer_job',
  1404	                'c.birth AS customer_birth',
  1405	                'c.note AS customer_note',
  1406	                'o.subtotal',
  1407	                'o.discount',
  1408	                'o.delivery_fee_total',
  1409	                'o.tax',
  1410	                'o.total',
  1411	                'o.payment_total',
  1412	                'ost.id AS status_id',
  1413	                'ost.name AS status',
  1414	                'py.id AS payment_id',
  1415	                'py.method',
  1416	                'o.order_date',
  1417	                'o.confirmDate',
  1418	                'o.payment_date',
  1419	                'o.commitDate',
  1420	                'o.shippingDate',
  1421	                's.name01 AS shipping_name01',
  1422	                's.name02 AS shipping_name02',
  1423	                's.kana01 AS shipping_kana01',
  1424	                's.kana02 AS shipping_kana02',
  1425	                's.company_name AS shipping_company_name',
  1426	                // TODO：配送先郵便番号はテーブルでカラムが01，02に分かれていない。一旦ここで分割して出力する。
  1427	                'SUBSTRING(s.postal_code, 1, 3) AS shipping_zip01',
  1428	                'SUBSTRING(s.postal_code, 4, 4) AS shipping_zip02',
  1429	                'sp.id AS shipping_pref_id',
  1430	                'sp.name AS shipping_pref_name',
  1431	                's.addr01 AS shipping_addr01',
  1432	                's.addr02 AS shipping_addr02',
  1433	                's.addr03 AS shipping_addr03',
  1434	                's.tel01 AS shipping_tel01',
  1435	                's.tel02 AS shipping_tel02',
  1436	                's.tel03 AS shipping_tel03',
  1437	                // TODO：配送先Fax番号はテーブルにカラムなし。一旦空文字を出力する。
  1438	                "'' AS shipping_fax01",
  1439	                "'' AS shipping_fax02",
  1440	                "'' AS shipping_fax03",
  1441	                'd.id AS delivery_id',
  1442	                'd.name AS delivery_name',
  1443	                'o.invoiceNumber',
  1444	                't.id AS delivery_time_id',
  1445	                't.delivery_time',
  1446	            ])
  1447	            ->join('o.Pref', 'op')
  1448	            ->leftJoin('o.Country', 'oc')
  1449	            ->join('o.Customer', 'c')
  1450	            ->leftJoin('c.Sex', 'cs')
  1451	            ->leftJoin('c.Job', 'cj')
  1452	            ->join('c.Pref', 'cp')
  1453	            ->leftjoin('c.Country', 'cc')
  1454	            ->join('o.Payment', 'py')
  1455	            ->join('o.OrderStatus', 'ost')
  1456	            ->leftJoin('o.Shippings', 's')
  1457	            ->join('s.Pref', 'sp')
  1458	            ->join('s.Delivery', 'd')
  1459	            ->leftJoin('d.DeliveryTimes', 't', 'WITH', 't.id = s.time_id')
  1460	            ->where('o IN (:orders)')
  1461	            ->setParameter('orders', $orderIdList)
  1462	            ->groupBy('
  1463	                o.id,
  1464	                c.id,
  1465	                cp.id,
  1466	                cs.id,
  1467	                cj.id,
  1468	                ost.id,
  1469	                py.id,
  1470	                py.id,
  1471	                sp.id,
  1472	                s.name01,
  1473	                s.name02,
  1474	                s.kana01,
  1475	                s.kana02,
  1476	                s.company_name,
  1477	                s.postal_code,
  1478	                s.addr01,
  1479	                s.addr02,
  1480	                s.addr03,
  1481	                s.tel01,
  1482	                s.tel02,
  1483	                s.tel03,
  1484	                d.id,
  1485	                t.id
  1486	            ');
  1487	
  1488	        $result = $qb
  1489	            ->getQuery()
  1490	            ->getResult();
  1491	
  1492	        array_walk_recursive($result, function (&$item) {
  1493	            if ($item instanceof \DateTime) {
  1494	                $item = $item->format(self::CSV_DATE_FORMAT);
  1495	            }
  1496	        });
  1497	
  1498	        return $result;
  1499	    }
  1500	
  1501	    /**
  1502	     * スタック用紙の印字情報取得（本店）
  1503	     *
  1504	     * @param int $base_info_id
  1505	     *

exec
/bin/bash -lc "nl -ba function_spec_html_preview/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.html | sed -n '260,360p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   260	<h3 id="DB操作">DB操作</h3>
   261	<p>本機能は参照系（検索・出力）であり、DBへの登録・更新・削除は行わない。テーブル名は ec-cube-enterprise を正典とする。</p>
   262	<div class="table-wrap"><table><thead><tr><th>操作種別</th><th>対象テーブル</th><th>契機・条件</th></tr></thead><tbody><tr><td>検索</td><td>dtb_order / dtb_shipping</td><td>検索条件に合致するレコードを抽出する。抽出結果を所定フォーマットでファイル出力する。</td></tr></tbody></table></div>
   263	<hr>
   264	<h2 id="バリデーション">バリデーション</h2>
   265	<p>クエリ入力に対してフォームオブジェクト側の入力種別チェックは行わない確認値となる。送信欠損は配列チェックのみ。</p>
   266	<hr>
   267	<h2 id="権限・認可">権限・認可</h2>
   268	<div class="table-wrap"><table><thead><tr><th>利用者状態</th><th>本機能のブラウザ操作</th></tr></thead><tbody><tr><td>管理画面共通ルートにログイン済みのアカウント</td><td>POSTで送信しうる確認値となる。細かい許可一覧はSymfonyの権限設定を正とする。</td></tr><tr><td>未ログイン</td><td>管理画面の共通フローのとおりログインまたは拒否となる。</td></tr></tbody></table></div>
   269	<hr>
   270	<h2 id="画面遷移">画面遷移</h2>
   271	<div class="table-wrap"><table><thead><tr><th>条件</th><th>遷移先</th></tr></thead><tbody><tr><td>一覧から正常にダウンロードが成功</td><td>画面上は出荷指示編集ページのままになりうる確認値であり、応答本体は別ストリーム。</td></tr><tr><td>選択欠損・論外によりリダイレクト</td><td>RefererヘッダのURLまたは受注一覧<code>admin_order</code>。</td></tr></tbody></table></div>
   272	<hr>
   273	<h2 id="エラー処理">エラー処理</h2>
   274	<div class="table-wrap"><table><thead><tr><th>エラー内容</th><th>処理</th></tr></thead><tbody><tr><td><code>order_ids</code>が無効または欠損</td><td>フラッシュ<code>admin.common.select</code>相当。</td></tr><tr><td>データ取得関数が論外値</td><td>フラッシュにメッセージを載せ、リダイレクト経路同上。標準文言はキー転用となる（実装修正の論点になりうる）。</td></tr></tbody></table></div>
   275	<hr>
   276	<h2 id="試行制限">試行制限</h2>
   277	<p>本機能では試行回数による抑止機構を扱わない。</p>
   278	<hr>
   279	<h2 id="ログ・監査">ログ・監査</h2>
   280	<div class="table-wrap"><table><thead><tr><th>タイミング</th><th>記録内容</th></tr></thead><tbody><tr><td>ストリーム返却直前</td><td>情報ログ「CSV出力ファイル名」とファイル名文字列</td></tr></tbody></table></div>
   281	<h3 id="ログに出してはいけないもの">ログに出してはいけないもの</h3>
   282	<ul><li>パスワード</li><li>なりすまし対策トークン</li><li>Cookie値</li><li>セッションIDの完全値</li><li>Remember Meトークンの原値</li></ul>
   283	<hr>
   284	<h2 id="セッション">セッション</h2>
   285	<h3 id="本機能におけるセッション">本機能におけるセッション</h3>
   286	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>読み取り</td><td>成功経路において検索状態キーは参照しない確認値となる。フラッシュのみフレームワークが利用する。</td></tr><tr><td>書き込み</td><td>受注一覧の検索状態を意図的に変更しない処理である。</td></tr></tbody></table></div>
   287	<h3 id="セッションへ保存しない情報">セッションへ保存しない情報</h3>
   288	<p>ブラウザが取得したファイル本文はサーバ側セッションへ格納しない。</p>
   289	<hr>
   290	<h2 id="Cookie">Cookie</h2>
   291	<p>管理画面共通のセッションCookieのみ。本機能が新規にCookieヘッダを発行する処理はソース上読み取れない。</p>
   292	<hr>
   293	<h2 id="排他制御・トランザクション">排他制御・トランザクション</h2>
   294	<p>読み取り主体のクエリおよびストリーム応答のみであり、このHTTPハンドラが開始するトランザクション境界や楽観排他フラグ更新はソース上読み取れない。</p>
   295	<p>行ロック・悲観ロック・楽観ロック・ロックファイルは使用しない。ロールバック対象や部分反映の扱いは本節のトランザクション境界と例外時の記載を正とする。</p>
   296	<hr>
   297	<h2 id="調査補助-grep向け">調査補助（grep向け）</h2>
   298	<div class="table-wrap"><table><thead><tr><th>手がかり</th><th>備考</th></tr></thead><tbody><tr><td><code>admin_order_export_for_input</code></td><td>ルート名。</td></tr><tr><td><code>exportForInput</code></td><td>コントローラアクション関数。</td></tr><tr><td><code>generateResultCsv</code></td><td>結果行構築。</td></tr><tr><td><code>OrderCsv::exportCsv</code></td><td>ストリームとヘッダ。</td></tr><tr><td><code>order_ids</code></td><td>フォーム入力名およびリクエスト取得キー。</td></tr></tbody></table></div>
   299	<h3 id="HTTPルート名とパス-コード探索用・旧入口節より退避">HTTPルート名とパス（コード探索用・旧入口節より退避）</h3>
   300	<ul><li><code>admin_order_export_for_input</code> … <code>GET, POST</code> … <code>/{admin_route}/order/export/order</code>（リクエストに含まれる<code>order_ids</code>から受注内部IDリストを復元し、固定ハードコード列のCSVをストリーム返却する。）</li></ul>
   301	      <footer>このページは機能仕様書Markdownから自動生成されています。編集は元のMarkdownに対して行ってください。</footer>
   302	    </main>
   303	  </div>
   304	</body>
   305	</html>

exec
/bin/bash -lc 'rg -n "admin_order_export_for_input|exportForInput|ORDER_SHIPPING_CSV|generateResultCsv|shipping_export_for_import|orderExportForInput" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /home/y-saito/Developments/ec-cube-enterprise/app 2>/dev/null' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 108ms:
codex
実装の郵便番号参照はfindingの説明どおり顧客・配送先で、`o.postal_code` はこのCSV生成関数には出ていません。次に、設計書の他節に対する見落としがないか、ルートのメソッド、エラー処理、JOIN条件、ヘッダ列順を確認します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php | sed -n '1,280p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php | sed -n '1,220p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Service\Csv;
    17	
    18	use Doctrine\ORM\EntityManagerInterface;
    19	use Eccube\Common\EccubeConfig;
    20	use Eccube\Controller\Admin\Order\OrderCsvController;
    21	use Eccube\Entity\Master\OrderStatus;
    22	use Eccube\Entity\Order;
    23	use Eccube\Repository\DtbPlayerRepository;
    24	use Eccube\Repository\Master\OrderStatusRepository;
    25	use Eccube\Repository\OrderRepository;
    26	use Eccube\Service\CsvExportService;
    27	use Eccube\Service\CsvImportService;
    28	use Symfony\Component\HttpFoundation\Response;
    29	use Symfony\Component\HttpFoundation\StreamedResponse;
    30	use Symfony\Contracts\Translation\TranslatorInterface;
    31	
    32	class OrderCsv extends AbstractCsvService
    33	{
    34	    public function __construct(
    35	        protected EntityManagerInterface $entityManager,
    36	        protected TranslatorInterface $translator,
    37	        protected EccubeConfig $eccubeConfig,
    38	        protected CsvExportService $csvExportService,
    39	        protected OrderRepository $orderRepository,
    40	        protected DtbPlayerRepository $playerRepository,
    41	        protected OrderStatusRepository $orderStatusRepository,
    42	    ) {
    43	        parent::__construct(
    44	            $entityManager,
    45	            $translator,
    46	            $eccubeConfig,
    47	            OrderCsvController::CSV_HEADER,
    48	            OrderCsvController::REQUIRED_CSV_HEADER,
    49	        );
    50	    }
    51	
    52	    /**
    53	     * 出荷実績インポート用CSVを出力する
    54	     *
    55	     * @param array<int> $orderIdList
    56	     */
    57	    public function exportCsv(array $orderIdList): StreamedResponse
    58	    {
    59	        if (!$csvRows = $this->orderRepository->generateResultCsv($orderIdList)) {
    60	            throw new \RuntimeException($this->translator->trans('admin.csv.error.export.not_registered'));
    61	        }
    62	
    63	        $response = new StreamedResponse();
    64	
    65	        // $response->setCallback(function () use ($app, $csvRows) {
    66	        $response->setCallback(function () use ($csvRows): void {
    67	            // $csvService = $app['eccube.service.csv.export'];
    68	            $csvService = $this->csvExportService;
    69	            $csvService->fopen();
    70	
    71	            // ヘッダ行出力
    72	            $csvService->fputcsv(array_keys($this->csvHeader));
    73	
    74	            // データ出力
    75	            foreach ($csvRows as $csvRow) {
    76	                $csvService->fputcsv($csvRow);
    77	            }
    78	
    79	            $csvService->fclose();
    80	        });
    81	
    82	        $filename = $this->createFileName('order_');
    83	        $this->setCsvResponseHeader($response, $filename);
    84	
    85	        log_info('CSV出力ファイル名', [$filename]);
    86	
    87	        return $response;
    88	    }
    89	
    90	    /**
    91	     * 出荷実績登録処理
    92	     * 対応状況が出荷指示かつ出荷日が入力されている受注情報を更新
    93	     *
    94	     * @param array<string, string> $headers
    95	     * @param CsvImportService<int, array<int|string, string>> $data
    96	     *
    97	     * @return array<int, array{order: Order, player: \Eccube\Entity\DtbPlayer|null}>
    98	     */
    99	    public function registerShippingResult(array $headers, int $headerSize, CsvImportService $data): array
   100	    {
   101	        $requiredHeaders = $this->requiredCsvHeader;
   102	
   103	        $updatedOrders = [];
   104	        foreach ($data as $row) {
   105	            $rowIndex = $data->key() + 1;
   106	
   107	            // ヘッダーサイズチェック
   108	            $this->checkHeaderSize($headerSize, $row, $rowIndex);
   109	            // CSV必須項目入力チェック
   110	            $this->checkRequiredHeaders($requiredHeaders, $row, $rowIndex);
   111	
   112	            $order = $this->orderRepository->findOneBy(['order_number' => $row['注文番号']]);
   113	
   114	            if ($order === null) {
   115	                throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.data.not_registered'), '注文番号', $row['注文番号'], $rowIndex));
   116	            }
   117	            if (empty($row['出荷日'])) {
   118	                continue;
   119	            }
   120	            // 非会員の場合エラーを出力
   121	            if ($order->getCustomer() === null) {
   122	                throw new \RuntimeException($this->translator->trans('admin.csv.error.customer.not_member', ['%row%' => $rowIndex]));
   123	            }
   124	            try {
   125	                $shippingDate = new \DateTime($row['出荷日']);
   126	            } catch (\Exception $e) {
   127	                $message = $this->translator->trans('admin.csv.error.exception.datetime', ['%row%' => $rowIndex, '%column%' => '出荷日']);
   128	                throw new \RuntimeException($message, $rowIndex, $e);
   129	            }
   130	            $invoiceNumber = $row['送り状No.'];
   131	            $newStatus = $this->orderStatusRepository->find(OrderStatus::DELIVERED);
   132	            $isPreDeliv = $order->getOrderStatus()?->getId() === OrderStatus::PRE_DELIV;
   133	            if ($isPreDeliv && $order->getShippingDate() === null) {
   134	                $order->setOrderStatus($newStatus);
   135	                $order
   136	                    ->setShippingDate($shippingDate)
   137	                    ->setInvoiceNumber($invoiceNumber);
   138	                $updatedOrders[] = [
   139	                    'order' => $order,
   140	                    'player' => $this->playerRepository->findOneByCustomer($order->getCustomer()),
   141	                ];
   142	            }
   143	            foreach ($order->getShippings() as $shipping) {
   144	                $shipping->setShippingCommitDate($shippingDate);
   145	            }
   146	        }
   147	
   148	        $this->entityManager->flush();
   149	
   150	        return $updatedOrders;
   151	    }
   152	
   153	    /**
   154	     * 登録、更新時の画面表示
   155	     *
   156	     * @return Response
   157	     */
   158	    public function render(): Response
   159	    {
   160	        if (!empty($this->getFileName())) {
   161	            try {
   162	                $this->deleteTempData();
   163	            } catch (\Exception $e) {
   164	                // エラーが発生しても無視する
   165	            }
   166	        }
   167	
   168	        return new Response();
   169	    }
   170	}

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
    18	use Eccube\Controller\AbstractController;
    19	use Eccube\Form\Type\Admin\CsvImportType;
    20	use Eccube\Repository\Master\OrderStatusRepository;
    21	use Eccube\Repository\OrderRepository;
    22	use Eccube\Service\Csv\OrderCsv;
    23	use Eccube\Service\CsvExportService;
    24	use Eccube\Service\PointService;
    25	use Eccube\Service\Smaregi\SmaregiOrderGainPointEventService;
    26	use Symfony\Bridge\Twig\Attribute\Template;
    27	use Symfony\Component\HttpFoundation\Request;
    28	use Symfony\Component\HttpFoundation\Response;
    29	use Symfony\Component\Routing\Attribute\Route;
    30	
    31	class OrderCsvController extends AbstractController
    32	{
    33	    public function __construct(
    34	        protected OrderCsv $orderCsv,
    35	        protected CsvExportService $csvExportService,
    36	        protected OrderRepository $orderRepository,
    37	        protected OrderStatusRepository $orderStatusRepository,
    38	        private readonly PointService $pointService,
    39	        private readonly SmaregiOrderGainPointEventService $smaregiOrderGainPointEventService,
    40	    ) {
    41	    }
    42	
    43	    public const CSV_HEADER = [
    44	        '注文番号' => '注文番号',
    45	        '会員ID' => '会員ID',
    46	        'お名前(姓)' => 'お名前(姓)',
    47	        'お名前(名)' => 'お名前(名)',
    48	        'お名前(セイ)' => 'お名前(セイ)',
    49	        'お名前(メイ)' => 'お名前(メイ)',
    50	        '会社名' => '会社名',
    51	        '郵便番号1' => '郵便番号1',
    52	        '郵便番号2' => '郵便番号2',
    53	        '都道府県(ID)' => '都道府県(ID)',
    54	        '都道府県(名称)' => '都道府県(名称)',
    55	        '住所1' => '住所1',
    56	        '住所2' => '住所2',
    57	        '住所3' => '住所3',
    58	        'メールアドレス' => 'メールアドレス',
    59	        'TEL1' => 'TEL1',
    60	        'TEL2' => 'TEL2',
    61	        'TEL3' => 'TEL3',
    62	        'FAX1' => 'FAX1',
    63	        'FAX2' => 'FAX2',
    64	        'FAX3' => 'FAX3',
    65	        '性別(ID)' => '性別(ID)',
    66	        '性別(名称)' => '性別(名称)',
    67	        '職業(ID)' => '職業(ID)',
    68	        '職業(名称)' => '職業(名称)',
    69	        '誕生日' => '誕生日',
    70	        'ショップ用メモ欄' => 'ショップ用メモ欄',
    71	        '小計' => '小計',
    72	        '値引き' => '値引き',
    73	        '送料合計' => '送料合計',
    74	        '税金' => '税金',
    75	        '合計' => '合計',
    76	        '支払合計' => '支払合計',
    77	        '対応状況(ID)' => '対応状況(ID)',
    78	        '対応状況(名称)' => '対応状況(名称)',
    79	        '支払方法(ID)' => '支払方法(ID)',
    80	        '支払方法(名称)' => '支払方法(名称)',
    81	        '注文日' => '注文日',
    82	        '注文確定日' => '注文確定日',
    83	        '入金日' => '入金日',
    84	        '出荷指示日' => '出荷指示日',
    85	        '出荷日' => '出荷日',
    86	        '配送先_お名前(姓)' => '配送先_お名前(姓)',
    87	        '配送先_お名前(名)' => '配送先_お名前(名)',
    88	        '配送先_お名前(セイ)' => '配送先_お名前(セイ)',
    89	        '配送先_お名前(メイ)' => '配送先_お名前(メイ)',
    90	        '配送先_会社名' => '配送先_会社名',
    91	        '配送先_郵便番号1' => '配送先_郵便番号1',
    92	        '配送先_郵便番号2' => '配送先_郵便番号2',
    93	        '配送先_都道府県(ID)' => '配送先_都道府県(ID)',
    94	        '配送先_都道府県(名称)' => '配送先_都道府県(名称)',
    95	        '配送先_住所1' => '配送先_住所1',
    96	        '配送先_住所2' => '配送先_住所2',
    97	        '配送先_住所3' => '配送先_住所3',
    98	        '配送先_TEL1' => '配送先_TEL1',
    99	        '配送先_TEL2' => '配送先_TEL2',
   100	        '配送先_TEL3' => '配送先_TEL3',
   101	        '配送先_FAX1' => '配送先_FAX1',
   102	        '配送先_FAX2' => '配送先_FAX2',
   103	        '配送先_FAX3' => '配送先_FAX3',
   104	        '配送方法(ID)' => '配送方法(ID)',
   105	        '配送方法(名称)' => '配送方法(名称)',
   106	        '送り状No.' => '送り状No.',
   107	        'お届け時間ID' => 'お届け時間ID',
   108	        'お届け時間(名称)' => 'お届け時間(名称)',
   109	        // TODO:DateTime型のカラムを追加
   110	        // 'お届け希望日' => "お届け希望日",
   111	    ];
   112	
   113	    public const REQUIRED_CSV_HEADER = [
   114	        '注文番号' => '注文番号',
   115	    ];
   116	
   117	    public const NOT_REQUIRED_CSV_HEADER = [
   118	        '会員ID' => '会員ID',
   119	        'お名前(姓)' => 'お名前(姓)',
   120	        'お名前(名)' => 'お名前(名)',
   121	        'お名前(セイ)' => 'お名前(セイ)',
   122	        'お名前(メイ)' => 'お名前(メイ)',
   123	        '会社名' => '会社名',
   124	        '郵便番号1' => '郵便番号1',
   125	        '郵便番号2' => '郵便番号2',
   126	        '都道府県(ID)' => '都道府県(ID)',
   127	        '都道府県(名称)' => '都道府県(名称)',
   128	        '住所1' => '住所1',
   129	        '住所2' => '住所2',
   130	        '住所3' => '住所3',
   131	        'メールアドレス' => 'メールアドレス',
   132	        'TEL1' => 'TEL1',
   133	        'TEL2' => 'TEL2',
   134	        'TEL3' => 'TEL3',
   135	        'FAX1' => 'FAX1',
   136	        'FAX2' => 'FAX2',
   137	        'FAX3' => 'FAX3',
   138	        '性別(ID)' => '性別(ID)',
   139	        '性別(名称)' => '性別(名称)',
   140	        '職業(ID)' => '職業(ID)',
   141	        '職業(名称)' => '職業(名称)',
   142	        '誕生日' => '誕生日',
   143	        'ショップ用メモ欄' => 'ショップ用メモ欄',
   144	        '小計' => '小計',
   145	        '値引き' => '値引き',
   146	        '送料合計' => '送料合計',
   147	        '税金' => '税金',
   148	        '合計' => '合計',
   149	        '支払合計' => '支払合計',
   150	        '対応状況(ID)' => '対応状況(ID)',
   151	        '対応状況(名称)' => '対応状況(名称)',
   152	        '支払方法(ID)' => '支払方法(ID)',
   153	        '支払方法(名称)' => '支払方法(名称)',
   154	        '注文日' => '注文日',
   155	        '注文確定日' => '注文確定日',
   156	        '入金日' => '入金日',
   157	        '出荷指示日' => '出荷指示日',
   158	        '出荷日' => '出荷日',
   159	        '配送先_お名前(姓)' => '配送先_お名前(姓)',
   160	        '配送先_お名前(名)' => '配送先_お名前(名)',
   161	        '配送先_お名前(セイ)' => '配送先_お名前(セイ)',
   162	        '配送先_お名前(メイ)' => '配送先_お名前(メイ)',
   163	        '配送先_会社名' => '配送先_会社名',
   164	        '配送先_郵便番号1' => '配送先_郵便番号1',
   165	        '配送先_郵便番号2' => '配送先_郵便番号2',
   166	        '配送先_都道府県(ID)' => '配送先_都道府県(ID)',
   167	        '配送先_都道府県(名称)' => '配送先_都道府県(名称)',
   168	        '配送先_住所1' => '配送先_住所1',
   169	        '配送先_住所2' => '配送先_住所2',
   170	        '配送先_住所3' => '配送先_住所3',
   171	        '配送先_TEL1' => '配送先_TEL1',
   172	        '配送先_TEL2' => '配送先_TEL2',
   173	        '配送先_TEL3' => '配送先_TEL3',
   174	        '配送先_FAX1' => '配送先_FAX1',
   175	        '配送先_FAX2' => '配送先_FAX2',
   176	        '配送先_FAX3' => '配送先_FAX3',
   177	        '配送方法(ID)' => '配送方法(ID)',
   178	        '配送方法(名称)' => '配送方法(名称)',
   179	        '送り状No.' => '送り状No.',
   180	        'お届け時間ID' => 'お届け時間ID',
   181	        'お届け時間(名称)' => 'お届け時間(名称)',
   182	        // TODO:DateTime型のカラムを追加
   183	        // 'お届け希望日' => "お届け希望日",
   184	    ];
   185	
   186	    /**
   187	     * 出荷実績インポート用CSVエクスポート
   188	     *
   189	     * @param Request $request
   190	     *
   191	     * @return Response
   192	     */
   193	    #[Route(path: '/%eccube_admin_route%/order/export/order', name: 'admin_order_export_for_input', methods: ['GET', 'POST'])]
   194	    public function exportForInput(Request $request)
   195	    {
   196	        // タイムアウトを無効にする
   197	        set_time_limit(0);
   198	        // SQL Loggerを無効にする
   199	        $em = $this->entityManager;
   200	        $em->getConfiguration()->setSQLLogger(null);
   201	        // 注文情報IDを取得する
   202	        $rawOrderIds = $request->get('order_ids', []);
   203	        if (!is_array($rawOrderIds) || empty($rawOrderIds)) {
   204	            $this->addError('admin.common.select', 'admin');
   205	
   206	            $referer = $request->headers->get('referer');
   207	            if ($referer !== null && $referer !== '') {
   208	                return $this->redirect($referer);
   209	            }
   210	
   211	            return $this->redirectToRoute('admin_order');
   212	        }
   213	        $orderIdList = array_keys($rawOrderIds);
   214	
   215	        // CSVを出力する
   216	        try {
   217	            $response = $this->orderCsv->exportCsv($orderIdList);
   218	        } catch (\RuntimeException $e) {
   219	            $this->addError($e->getMessage(), 'admin');
   220	
   221	            $referer = $request->headers->get('referer');
   222	            if ($referer !== null && $referer !== '') {
   223	                return $this->redirect($referer);
   224	            }
   225	
   226	            return $this->redirectToRoute('admin_order');
   227	        }
   228	
   229	        return $response;
   230	    }
   231	
   232	    /**
   233	     * 出荷実績CSVアップロード画面
   234	     *
   235	     * @param Request $request
   236	     *
   237	     * @return Response
   238	     */
   239	    #[Route(
   240	        path: '/%eccube_admin_route%/order/shipping_result_csv/import',
   241	        name: 'admin_shipping_result_csv_import',
   242	        methods: ['GET'])
   243	    ]
   244	    #[Template(template: '@admin/Order/shipping_result_csv_import.twig')]
   245	    public function shippingResultCsv(Request $request)
   246	    {
   247	        $form = $this->formFactory->createBuilder(CsvImportType::class)->getForm();
   248	        $headers = self::CSV_HEADER;
   249	
   250	        return $this->render('@admin/Order/shipping_result_csv_import.twig', [
   251	            'form' => $form->createView(),
   252	            'headers' => $headers,
   253	            'errors' => [],
   254	            'warnings' => [],
   255	        ]);
   256	    }
   257	
   258	    /**
   259	     * 出荷実績CSVアップロード
   260	     *
   261	     * @param Request $request
   262	     *
   263	     * @return Response
   264	     */
   265	    #[Route(path: '/%eccube_admin_route%/order/shipping_result_csv/import', name: 'admin_shipping_result_csv_upload', methods: ['POST'], ),]
   266	    public function shippingResultImport(Request $request)
   267	    {
   268	        $form = $this->formFactory->createBuilder(CsvImportType::class)->getForm()->handleRequest($request);
   269	
   270	        $this->orderCsv->checkFormValid($form);
   271	        $formFile = $this->orderCsv->getFormFile($form);
   272	        if ($formFile === null) {
   273	            $this->orderCsv->render();
   274	
   275	            return $this->redirectToRoute('admin_shipping_result_csv_import');
   276	        }
   277	
   278	        $data = $this->orderCsv->getImportData($formFile);
   279	        if ($data === false) {
   280	            $this->orderCsv->render();

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig | sed -n '1,165p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
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

codex
大きな処理フローは概ね設計どおりですが、IDの扱いだけは設計の「整数ID」と実装の「配列キーそのまま」に差があります。郵便番号findingとは別の見落とし候補として成立するか、エンティティ定義も確認して根拠を固めます。
exec
/bin/bash -lc 'rg -n "postal_code|function getZip|getZip01|getZip02|setPostalCode" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php' in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php | sed -n '250,360p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   250	            ksort($total);
   251	
   252	            return $total;
   253	        }
   254	
   255	        /**
   256	         * 税額を税率ごとに集計する.
   257	         *
   258	         * 不課税, 非課税の値引明細は税率ごとに按分する.
   259	         *
   260	         * @return array<string, string>
   261	         */
   262	        public function getTaxByTaxRate(): array
   263	        {
   264	            $roundingTypes = $this->getRoundingTypeByTaxRate();
   265	            $tax = [];
   266	            $taxableTotal = $this->getTaxableTotal();
   267	            $taxFreeDiscount = $this->getTaxFreeDiscount();
   268	
   269	            foreach ($this->getTaxableTotalByTaxRate() as $rate => $totalPrice) {
   270	                if (!array_key_exists($rate, $roundingTypes) || null === $roundingTypes[$rate]) {
   271	                    continue;
   272	                }
   273	
   274	                if (bccomp($taxableTotal, '0', 2) !== 0) {
   275	                    // (totalPrice - abs(taxFreeDiscount) * totalPrice / taxableTotal) * (rate / (100 + rate))
   276	                    $absDiscount = ltrim($taxFreeDiscount, '-');
   277	
   278	                    // abs(taxFreeDiscount) * totalPrice / taxableTotal
   279	                    $discountPortion = bcdiv(bcmul($absDiscount, $totalPrice, 6), $taxableTotal, 6);
   280	
   281	                    // totalPrice - discountPortion
   282	                    $afterDiscount = bcsub($totalPrice, $discountPortion, 6);
   283	
   284	                    // rate / (100 + rate)
   285	                    $rateStr = $rate;
   286	                    $taxRate = bcdiv($rateStr, bcadd('100', $rateStr, 6), 6);
   287	
   288	                    // 最終計算
   289	                    $value = bcmul($afterDiscount, $taxRate, 6);
   290	                } else {
   291	                    $value = '0';
   292	                }
   293	
   294	                $tax[$rate] = TaxRuleService::roundByRoundingType(
   295	                    $value,
   296	                    $roundingTypes[$rate]->getId()
   297	                );
   298	            }
   299	
   300	            ksort($tax);
   301	
   302	            return $tax;
   303	        }
   304	
   305	        /**
   306	         * 課税対象の値引き明細を返す.
   307	         *
   308	         * @return array<int, OrderItem>
   309	         */
   310	        public function getTaxableDiscountItems(): array
   311	        {
   312	            /** @var OrderItem[] $items */
   313	            $items = (new ItemCollection($this->getTaxableItems()))->sort()->toArray();
   314	
   315	            return array_filter($items, fn (OrderItem $Item) => $Item->isDiscount());
   316	        }
   317	
   318	        /**
   319	         * 課税対象の値引き金額合計を返す.
   320	         */
   321	        public function getTaxableDiscount(): string
   322	        {
   323	            return array_reduce($this->getTaxableDiscountItems(), fn ($sum, OrderItem $Item) => bcadd($sum, $Item->getTotalPrice(), 2), '0');
   324	        }
   325	
   326	        /**
   327	         * 非課税・不課税の値引き明細を返す.
   328	         *
   329	         * @return array<int, OrderItem>
   330	         */
   331	        public function getTaxFreeDiscountItems(): array
   332	        {
   333	            /** @var OrderItem[] $items */
   334	            $items = (new ItemCollection($this->getOrderItems()))->sort()->toArray();
   335	
   336	            return array_filter($items, fn (OrderItem $Item) => $Item->isPoint() || ($Item->isDiscount() && $Item->getTaxType()->getId() != TaxType::TAXATION));
   337	        }
   338	
   339	        /**
   340	         * 非課税・不課税の値引き額を返す.
   341	         */
   342	        public function getTaxFreeDiscount(): string
   343	        {
   344	            return array_reduce($this->getTaxFreeDiscountItems(), fn ($sum, OrderItem $Item) => bcadd($sum, $Item->getTotalPrice(), 2), '0');
   345	        }
   346	
   347	        /**
   348	         * 税率ごとの丸め規則を取得する.
   349	         *
   350	         * @return array<string, RoundingType|null>
   351	         */
   352	        public function getRoundingTypeByTaxRate(): array
   353	        {
   354	            $roundingTypes = [];
   355	            foreach ($this->getTaxableItems() as $Item) {
   356	                $roundingTypes[$Item->getTaxRate()] = $Item->getRoundingType();
   357	            }
   358	
   359	            return $roundingTypes;
   360	        }

 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:83:        #[ORM\Column(name: 'postal_code', type: Types::STRING, length: 8, nullable: true)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:84:        private ?string $postal_code = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:201:            ->setPostalCode($CustomerAddress->getPostalCode())
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:315:         * Set postal_code.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:317:        public function setPostalCode(?string $postal_code = null): Shipping
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:319:            $this->postal_code = $postal_code;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:325:         * Get postal_code.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:329:            return $this->postal_code;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:333:         * Get postal_code01.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:337:            return substr($this->postal_code ?? '', 0, 3);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:341:         * Get postal_code02.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:345:            return substr($this->postal_code ?? '', 3);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:838:        #[ORM\Column(name: 'abroad_postal_code', type: Types::STRING, length: 10, nullable: true, options: ['comment' => '国外郵便番号'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:74:        #[ORM\Column(name: 'postal_code', type: Types::STRING, length: 8, nullable: true)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:75:        private ?string $postal_code = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:359:         * Set postal_code.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:361:        public function setPostalCode(?string $postal_code = null): Customer
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:363:            $this->postal_code = $postal_code;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:369:         * Get postal_code.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:373:            return $this->postal_code;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:1005:        #[ORM\Column(name: 'abroad_postal_code', type: Types::STRING, length: 10, nullable: true, options: ['comment' => '国外郵便番号'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:1351:            if (!$this->postal_code) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:1355:            return substr($this->postal_code, 0, 3);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:1360:            if (!$this->postal_code || strlen($this->postal_code) <= 3) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:1364:            return substr($this->postal_code, 3, 4);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:488:        #[ORM\Column(name: 'postal_code', type: Types::STRING, length: 8, nullable: true)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:489:        private ?string $postal_code = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:723:        #[ORM\Column(name: 'abroad_postal_code', type: Types::STRING, length: 10, nullable: true, options: ['comment' => '国外郵便番号'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1019:         * Set postal_code.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1021:        public function setPostalCode(?string $postal_code = null): Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1023:            $this->postal_code = $postal_code;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1029:         * Get postal_code.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1033:            return $this->postal_code;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1037:         * Get postal_code01.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1041:            return substr($this->postal_code ?? '', 0, 3);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1045:         * Get postal_code02.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1049:            return substr($this->postal_code ?? '', 3);

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php | sed -n '120,210p' && nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php | sed -n '90,180p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   120	        #[ORM\Column(name: 'buy_times', type: Types::DECIMAL, precision: 10, scale: 0, nullable: true, options: ['unsigned' => true, 'default' => 0])]
   121	        private ?string $buy_times = '0';
   122	
   123	        #[ORM\Column(name: 'buy_total', type: Types::DECIMAL, precision: 12, scale: 2, nullable: true, options: ['unsigned' => true, 'default' => 0])]
   124	        private ?string $buy_total = '0';
   125	
   126	        #[ORM\Column(name: 'note', type: Types::STRING, length: 4000, nullable: true)]
   127	        private ?string $note = null;
   128	
   129	        #[ORM\Column(name: 'reset_key', type: Types::STRING, length: 255, nullable: true)]
   130	        private ?string $reset_key = null;
   131	
   132	        /**
   133	         * @var \DateTime|null
   134	         */
   135	        #[ORM\Column(name: 'reset_expire', type: Types::DATETIMETZ_MUTABLE, nullable: true)]
   136	        private $reset_expire;
   137	
   138	        #[ORM\Column(name: 'point', type: Types::DECIMAL, precision: 12, scale: 0, options: ['unsigned' => false, 'default' => 0])]
   139	        private ?string $point = '0';
   140	
   141	        #[ORM\Column(name: 'close_reason', type: Types::STRING, length: 255, nullable: true, options: ['comment' => '退会区分'])]
   142	        private ?string $close_reason = null;
   143	
   144	        /**
   145	         * @var \DateTime
   146	         */
   147	        #[ORM\Column(name: 'create_date', type: Types::DATETIMETZ_MUTABLE)]
   148	        private $create_date;
   149	
   150	        /**
   151	         * @var \DateTime
   152	         */
   153	        #[ORM\Column(name: 'update_date', type: Types::DATETIMETZ_MUTABLE)]
   154	        private $update_date;
   155	
   156	        /**
   157	         * @var Collection<int, CustomerFavoriteProduct>
   158	         */
   159	        #[ORM\OneToMany(mappedBy: 'Customer', targetEntity: CustomerFavoriteProduct::class, cascade: ['remove'])]
   160	        private $CustomerFavoriteProducts;
   161	
   162	        /**
   163	         * @var Collection<int, CustomerAddress>
   164	         */
   165	        #[ORM\OneToMany(targetEntity: CustomerAddress::class, mappedBy: 'Customer', cascade: ['remove'])]
   166	        #[ORM\OrderBy(['id' => 'ASC'])]
   167	        private $CustomerAddresses;
   168	
   169	        /**
   170	         * @var Collection<int, Order>
   171	         */
   172	        #[ORM\OneToMany(targetEntity: Order::class, mappedBy: 'Customer')]
   173	        private $Orders;
   174	
   175	        /**
   176	         * @var Collection<int, Shipping>
   177	         */
   178	        #[ORM\OneToMany(targetEntity: Shipping::class, mappedBy: 'Customer')]
   179	        private $Shippings;
   180	
   181	        /**
   182	         * @var Collection<int, MailHistory>
   183	         */
   184	        #[ORM\OneToMany(targetEntity: MailHistory::class, mappedBy: 'Customer')]
   185	        private $MailHistories;
   186	
   187	        #[ORM\ManyToOne(targetEntity: CustomerStatus::class)]
   188	        #[ORM\JoinColumn(name: 'customer_status_id', referencedColumnName: 'id')]
   189	        private ?CustomerStatus $Status = null;
   190	
   191	        #[ORM\ManyToOne(targetEntity: Sex::class)]
   192	        #[ORM\JoinColumn(name: 'sex_id', referencedColumnName: 'id')]
   193	        private ?Sex $Sex = null;
   194	
   195	        #[ORM\ManyToOne(targetEntity: Job::class)]
   196	        #[ORM\JoinColumn(name: 'job_id', referencedColumnName: 'id')]
   197	        private ?Job $Job = null;
   198	
   199	        #[ORM\ManyToOne(targetEntity: Country::class)]
   200	        #[ORM\JoinColumn(name: 'country_id', referencedColumnName: 'id')]
   201	        private ?Country $Country = null;
   202	
   203	        #[ORM\ManyToOne(targetEntity: Pref::class)]
   204	        #[ORM\JoinColumn(name: 'pref_id', referencedColumnName: 'id')]
   205	        private ?Pref $Pref = null;
   206	
   207	        /**
   208	         * Constructor
   209	         */
   210	        public function __construct()
    90	        private ?string $addr02 = null;
    91	
    92	        #[ORM\Column(name: 'delivery_name', type: Types::STRING, length: 255, nullable: true)]
    93	        private ?string $shipping_delivery_name = null;
    94	
    95	        #[ORM\Column(name: 'time_id', type: Types::INTEGER, options: ['unsigned' => true], nullable: true)]
    96	        private ?int $time_id = null;
    97	
    98	        #[ORM\Column(name: 'delivery_time', type: Types::STRING, length: 255, nullable: true)]
    99	        private ?string $shipping_delivery_time = null;
   100	
   101	        /**
   102	         * お届け予定日/お届け希望日
   103	         *
   104	         * @var \DateTime|null
   105	         */
   106	        #[ORM\Column(name: 'delivery_date', type: Types::DATETIMETZ_MUTABLE, nullable: true)]
   107	        private $shipping_delivery_date;
   108	
   109	        /**
   110	         * 出荷日
   111	         *
   112	         * @var \DateTime|null
   113	         */
   114	        #[ORM\Column(name: 'shipping_date', type: Types::DATETIMETZ_MUTABLE, nullable: true)]
   115	        private $shipping_date;
   116	
   117	        #[ORM\Column(name: 'tracking_number', type: Types::STRING, length: 255, nullable: true)]
   118	        private ?string $tracking_number = null;
   119	
   120	        #[ORM\Column(name: 'note', type: Types::STRING, length: 4000, nullable: true)]
   121	        private ?string $note = null;
   122	
   123	        #[ORM\Column(name: 'sort_no', type: Types::SMALLINT, nullable: true, options: ['unsigned' => true])]
   124	        private ?int $sort_no = null;
   125	
   126	        /**
   127	         * @var \DateTime
   128	         */
   129	        #[ORM\Column(name: 'create_date', type: Types::DATETIMETZ_MUTABLE)]
   130	        private $create_date;
   131	
   132	        /**
   133	         * @var \DateTime
   134	         */
   135	        #[ORM\Column(name: 'update_date', type: Types::DATETIMETZ_MUTABLE)]
   136	        private $update_date;
   137	
   138	        /**
   139	         * @var \DateTime
   140	         */
   141	        #[ORM\Column(name: 'mail_send_date', type: Types::DATETIMETZ_MUTABLE, nullable: true)]
   142	        private $mail_send_date;
   143	
   144	        #[ORM\ManyToOne(targetEntity: Order::class, cascade: ['persist'], inversedBy: 'Shippings')]
   145	        #[ORM\JoinColumn(name: 'order_id', referencedColumnName: 'id')]
   146	        private ?Order $Order = null;
   147	
   148	        /**
   149	         * @var Collection<int, OrderItem>
   150	         */
   151	        #[ORM\OneToMany(targetEntity: OrderItem::class, mappedBy: 'Shipping', cascade: ['persist'])]
   152	        private $OrderItems;
   153	
   154	        #[ORM\ManyToOne(targetEntity: Country::class)]
   155	        #[ORM\JoinColumn(name: 'country_id', referencedColumnName: 'id')]
   156	        private ?Country $Country = null;
   157	
   158	        #[ORM\ManyToOne(targetEntity: Pref::class)]
   159	        #[ORM\JoinColumn(name: 'pref_id', referencedColumnName: 'id')]
   160	        private ?Pref $Pref = null;
   161	
   162	        #[ORM\ManyToOne(targetEntity: Delivery::class)]
   163	        #[ORM\JoinColumn(name: 'delivery_id', referencedColumnName: 'id')]
   164	        private ?Delivery $Delivery = null;
   165	
   166	        private ProductClass $ProductClassOfTemp;
   167	
   168	        #[ORM\ManyToOne(targetEntity: Member::class)]
   169	        #[ORM\JoinColumn(name: 'creator_id', referencedColumnName: 'id')]
   170	        private ?Member $Creator = null;
   171	
   172	        #[ORM\ManyToOne(targetEntity: Customer::class, inversedBy: 'Shippings')]
   173	        #[ORM\JoinColumn(name: 'customer_id', referencedColumnName: 'id')]
   174	        private ?Customer $Customer = null;
   175	
   176	        #[ORM\Column(name: 'deleted_at', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '削除日時'])]
   177	        private ?\DateTime $deletedAt = null;
   178	
   179	        /**
   180	         * Constructor

exec
/bin/bash -lc "rg -n \"o\\.postal_code|postal_code.*AS|SUBSTRING\\((c|s|o)\\.postal_code\" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba function_spec_html_preview/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.html | sed -n '224,246p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php | sed -n '60,85p'; nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php | sed -n '76,88p'; nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php | sed -n '482,492p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 103ms:
   224	<p>DB関連の記述は ec-cube-enterprise を正とする。CSV生成が参照する永続化先のうち、注文の郵便番号の保持方式に現行と移行先で差がある。</p>
   225	<div class="table-wrap"><table><thead><tr><th>観点</th><th>現行（pf-eccube3）</th><th>移行先（ec-cube-enterprise）</th></tr></thead><tbody><tr><td>受注本体</td><td><code>dtb_order</code></td><td>同一テーブル。郵便番号列の構成のみ後述のとおり異なる。</td></tr><tr><td>注文の郵便番号</td><td><code>dtb_order</code> が <code>zip01</code>（3桁）・<code>zip02</code>（4桁）の2列で保持</td><td><code>dtb_order.postal_code</code>（単一列、最大8桁）に統合。先頭3桁・残り4桁への分割はエンティティの取得補助で行う。CSVヘッダは引き続き2列分を出力する。</td></tr><tr><td>配送</td><td><code>dtb_shipping</code>（INNER JOIN のため配送が無い注文は出力対象外）</td><td>同一スキーマ。</td></tr><tr><td>配送先FAX</td><td>専用列なし。CSVでは空文字で補完</td><td>同一。移行先にも配送先FAX列は無く、空文字補完の前提は変わらない。</td></tr></tbody></table></div>
   226	<p>CSVのヘッダ列順・日時書式（<code>Y/m/d H:i:s</code>）・エンコーディング設定は永続化スキーマではなく出力仕様であり、本節の差分管理対象としない。</p>
   227	<hr>
   228	<h2 id="利用者視点の入口">利用者視点の入口</h2>
   229	<div class="table-wrap"><table><thead><tr><th>入口</th><th>URLエンドポイント</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>受注メニューの出荷指示（出荷待ち）詳細ページで一覧のチェック付きを残し「出荷実績入力用CSVダウンロード」ボタンを押す</td><td><code>POST /{admin_route}/order/export/order</code></td><td><code>order_ids[&lt;受注内部ID&gt;]</code>が送られ、共通CSV出力サービスでエンコード・区切り付きのCSVファイルが応答となる。ブラウザのダウンロード挙動は利用者環境に委ねる。</td></tr><tr><td>上記一覧でチェック済みが1件も送られなかった場合</td><td>（同一POSTの前段でフラッシュのみ）</td><td>エラーフラッシュ<code>admin.common.select</code>相当の文言となり、<code>Referer</code>ヘッダがあればそこへ、無ければ<code>admin_order</code>へリダイレクトする確認値となる。ステータスはリダイレクト応答のフレームワーク既定に従う。</td></tr><tr><td>ストリーム直前までにデータ取得が論外終了した場合</td><td>（同一POSTまたはGETの処理分岐による）</td><td>エラーフラッシュに例外または翻訳メッセージを載せ、<code>Referer</code>優先または<code>admin_order</code>へリダイレクトする確認値となる。</td></tr></tbody></table></div>
   230	<hr>
   231	<h2 id="フロント挙動">フロント挙動</h2>
   232	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>表示要素</td><td><code>@admin/ShippingStandby/edit.twig</code>の一覧フォーム（<code>form_bulk</code>）直上に、<code>id="orderExportForInput"</code>のボタンがある。一覧各行のチェックボックスは既定でオン、名前は<code>order_ids[{{ Order.id }}]</code>。</td></tr><tr><td>JS挙動</td><td>クリックで<code>form_bulk</code>から<code>target</code>属性を削除し、<code>action</code>を<code>admin_order_export_for_input</code>へ差し替えて<code>submit</code>する。確認ダイアログは無い確認値である。</td></tr><tr><td>CSS・レイアウト</td><td>本機能専用の見た目変更はコード上読み取れない。</td></tr><tr><td>モーダル・ポップアップ</td><td>本機能では扱わない。</td></tr></tbody></table></div>
   233	<hr>
   234	<h2 id="処理フロー">処理フロー</h2>
   235	<h3 id="CSVをダウンロードする-admin-order-export-for-input-exportForInput">CSVをダウンロードする（<code>admin_order_export_for_input</code>、<code>exportForInput</code>）</h3>
   236	<ol><li>管理画面の認証・共通制約を通過する。</li><li><code>set_time_limit(0)</code>でPHPの実行時間制限を無効にする。</li><li>Doctrineの設定からSQLログ出力を無効にする確認値となる。</li><li><code>order_ids</code>を配列として取得する。PHP配列でない、または空のときフラッシュへ<code>admin.common.select</code>を載せ、<code>Referer</code>が空で無ければそこへ、空ならルート名<code>admin_order</code>へリダイレクトする。</li><li>キー一覧を整数IDの並びとして解釈し、出荷実績用CSV生成関数へ渡す。</li><li>返却データが論理偽となるとき実行時論外メッセージを投げる。そのメッセージは翻訳キー<code>admin.csv.error.export.not_registered</code>であり、標準ロケール下の日本語文言は文言上カード領域向けであり受注一覧からは転用読みとなる（実装確認値）。</li><li>論外を捕まえた場合はフラッシュへメッセージを載せ、同様に<code>Referer</code>または<code>admin_order</code>へリダイレクトする。</li><li>成功経路では<code>StreamedResponse</code>を返す。コールバック内で<code>CsvExportService</code>を開く。</li><li>ヘッダ行として、ヘッダ定数の連想キー配列について<code>array_keys</code>の順で1行書く。</li><li>クエリ結果の各行について、そのまま<code>fputcsv</code>へ渡す。 DoctrineのDateTime項目はクエリ関数内で事前に<code>'Y/m/d H:i:s'</code>形式へ書式化済みとなる。</li><li>ストリームを閉じる。</li><li>ファイル名は接頭辞<code>order_</code>、<code>YmdHis</code>桁そろえ日時、拡張子<code>.csv</code>を連結する実装関数を用いる（受注一覧向け自動命名と接頭辞と形式が字面で同一規則である確認値）。</li><li>応答ヘッダに<code>Content-Type: text/csv;charset=&lt;出力エンコーディング&gt;</code>と<code>Content-Disposition: attachment; filename=…</code>を付与する。<code>&lt;出力エンコーディング&gt;</code>は設定<code>eccube_csv_export_encoding</code>がSJIS系と判定される場合のラベルを<code>windows-31j</code>に寄せたりそうでない場合そのまま読む処理である。</li><li>ストリーム返却の手前で情報ログに「CSV出力ファイル名」とファイル名を記録する。</li></ol>
   237	<hr>
   238	<h2 id="集計条件">集計条件</h2>
   239	<p>本機能は金額集計をしない。結果行数および列値は検索関数の結合規則に従う。</p>
   240	<div class="table-wrap"><table><thead><tr><th>指標</th><th>集計の要点</th></tr></thead><tbody><tr><td>出力対象受注集合</td><td>POSTで送られた内部IDのみ。セッションの受注検索条件とは無関係である。</td></tr><tr><td>受注単位での最大行数</td><td>受注に対し配送（<code>dtb_shipping</code>に相当するORM結合対象）と配送時間の組が複数ありうるとき、<code>GROUP BY</code>句に配送側の識別に足りない列が並ばない構造のため、同一受注で複数配送があるケースでもSQLエンジン実装およびデータの状態によって複数結果行が並ぶ結果になりうる。完全な一意性の保証はクエリのみからは断定しない。</td></tr><tr><td>DBから結果ゼロ</td><td>関数が空とみなされる配列または偽値を返したとき、このコントローラ経路では上記論外となる。すべての指定IDが顧客未紐付け・配送無しなどでクエリ結果に現れなかった場合に該当しうる。</td></tr></tbody></table></div>
   241	<hr>
   242	<h2 id="業務ルール・計算">業務ルール・計算</h2>
   243	<div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>ヘッダ列順</td><td>アップロード側と整合する連想キー並び順（日本語項目名）はルータファイル側のヘッダ定数に固定される。</td></tr><tr><td>日時フォーマット</td><td>Doctrine結果に含まれる日時項目は関数内書式化により<code>OrderRepository::CSV_DATE_FORMAT</code>の確認値<code>'Y/m/d H:i:s'</code>へそろえる。</td></tr><tr><td>顧客郵便番号</td><td>DBは単一桁列の確認値であり、関数内で先頭3桁・残り4桁に<code>SUBSTRING</code>分割して2列出力する実装である。</td></tr><tr><td>配送先FAX</td><td>DB列が無い確認値であり、関数内では空文字3列として埋める。</td></tr><tr><td>文字コード</td><td><code>CsvExportService</code>のコールバックで、セルごとに<code>eccube_csv_export_encoding</code>へ向けて<code>mb_convert_encoding</code>する。UTF-8系と判定されるときのみ先頭BOMを付与するfopen処理である。</td></tr><tr><td>区切り・囲み</td><td><code>eccube_csv_export_separator</code>、<code>fputcsv</code>のエスケープはバックスラッシュ、囲みは二重引用符が確認値である。</td></tr></tbody></table></div>
   244	<p>本機能では画面フォーム入力をサーバへ永続化しないため、<code>### 入力項目</code>の表は置かない。</p>
   245	<h3 id="エッジケース">エッジケース</h3>
   246	<div class="table-wrap"><table><thead><tr><th>ケース</th><th>扱い</th></tr></thead><tbody><tr><td>選択IDリストが論理欠損または空</td><td>フラッシュ<code>admin.common.select</code>相当を載せ、<code>Referer</code>または<code>admin_order</code>へリダイレクト。</td></tr><tr><td>クエリ関数が論理偽のデータ集合を返す</td><td>転用読みとなる翻訳メッセージを載せて実行時論外となり、その後フラッシュ処理とリダイレクト。</td></tr><tr><td>GETで<code>/order/export/order</code>へ入るが本ルート名では無いとき</td><td>Symfonyのマッチは受注dtb_csv系CSVが優先される（GETのみのルートが選ばれた確認環境がある）。セッション検索状態に応じて受注明細粒度の項目定義ファイルが生成される。この取得経路によるファイルは受注一覧用の出力であり、固定ヘッダの出荷実績入力用CSVではない。</td></tr><tr><td>画面上の一覧フォームがCSRF用hidden無しであること</td><td>Twig断片のみでは共通トークンを確認できなかった。送信が拒否されるかはSymfony全体の構成に従う。</td></tr></tbody></table></div>

 succeeded in 125ms:
1386:                'SUBSTRING(c.postal_code, 1, 3) AS customer_zip01',
1387:                'SUBSTRING(c.postal_code, 4, 4) AS customer_zip02',
1427:                'SUBSTRING(s.postal_code, 1, 3) AS shipping_zip01',
1428:                'SUBSTRING(s.postal_code, 4, 4) AS shipping_zip02',
1934:                'o.postal_code AS order_postal_code',
1947:                's.postal_code AS shipping_postal_code',

 succeeded in 118ms:
    76	
    77	        #[ORM\Column(name: 'kana02', type: Types::STRING, length: 255, nullable: true)]
    78	        private ?string $kana02 = null;
    79	
    80	        #[ORM\Column(name: 'company_name', type: Types::STRING, length: 255, nullable: true)]
    81	        private ?string $company_name = null;
    82	
    83	        #[ORM\Column(name: 'postal_code', type: Types::STRING, length: 8, nullable: true)]
    84	        private ?string $postal_code = null;
    85	
    86	        #[ORM\Column(name: 'addr01', type: Types::STRING, length: 255, nullable: true)]
    87	        private ?string $addr01 = null;
    88	
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

codex
CSV出力サービス側も確認します。設計の文字コード・ヘッダ応答まわりが差分候補に入っていないため、そこに追加の不一致がないかだけ見ます。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php | sed -n '1,180p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php | sed -n '1,220p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Service\Csv;
    17	
    18	use Doctrine\ORM\EntityManagerInterface;
    19	use Eccube\Common\EccubeConfig;
    20	use Eccube\Entity\Master\MtbFormat;
    21	use Eccube\Exception\CsvImportException;
    22	use Eccube\Repository\Master\MtbFormatRepository;
    23	use Eccube\Service\CsvImportService;
    24	use Eccube\Util\StringUtil;
    25	use Symfony\Component\Filesystem\Filesystem;
    26	use Symfony\Component\Form\FormInterface;
    27	use Symfony\Component\HttpFoundation\File\UploadedFile;
    28	use Symfony\Component\HttpFoundation\Response;
    29	use Symfony\Contracts\Translation\TranslatorInterface;
    30	
    31	abstract class AbstractCsvService
    32	{
    33	    private ?string $fileName = null;
    34	
    35	    /** @var CsvImportException[] */
    36	    private array $errors = [];
    37	
    38	    /**
    39	     * getImportData() で保存した一時ファイル名。未アップロード時は null。
    40	     */
    41	    protected function getFileName(): ?string
    42	    {
    43	        return $this->fileName;
    44	    }
    45	
    46	    /**
    47	     * @param array<string, string> $csvHeader
    48	     * @param array<string, string> $requiredCsvHeader
    49	     */
    50	    public function __construct(
    51	        protected EntityManagerInterface $entityManager,
    52	        protected TranslatorInterface $translator,
    53	        protected EccubeConfig $eccubeConfig,
    54	        protected array $csvHeader = [],
    55	        protected array $requiredCsvHeader = [],
    56	        protected string $importTwig = '',
    57	        protected string $sessionKey = '',
    58	        protected ?MtbFormatRepository $formatRepository = null,
    59	    ) {
    60	    }
    61	
    62	    /**
    63	     * @param array<int, string> $headers
    64	     * @param int $headerSize
    65	     * @param \Iterator<array<string, string>> $data
    66	     */
    67	    public function register(array $headers, int $headerSize, \Iterator $data): void
    68	    {
    69	    }
    70	
    71	    /**
    72	     * @param array<int, mixed> $ids
    73	     */
    74	    public function exportCsv(array $ids): Response
    75	    {
    76	        return new Response();
    77	    }
    78	
    79	    /**
    80	     * @param \Symfony\Component\HttpFoundation\Request $request
    81	     *
    82	     * @return array<int, mixed>
    83	     */
    84	    public function getIds(\Symfony\Component\HttpFoundation\Request $request): array
    85	    {
    86	        return [];
    87	    }
    88	
    89	    /**
    90	     * @param array<int, mixed> $entity
    91	     *
    92	     * @return array<int, mixed>
    93	     */
    94	    public function convertExportCsvRows(array $entity): array
    95	    {
    96	        return [];
    97	    }
    98	
    99	    /**
   100	     * カードレイアウト毎に点数で見たマナコスト(CMC)を取得
   101	     *
   102	     * @param array<string, mixed> $row
   103	     *
   104	     * @return int|string CMC
   105	     */
   106	    public function getCmc(array $row): int|string
   107	    {
   108	        $layout = $row['layout'] ?? 'Normal';
   109	        $cmc = $row['cmc'] ?? 0;
   110	        if ($cmc === '' || (\is_string($cmc) && trim($cmc) === '')) {
   111	            $cmc = 0;
   112	        }
   113	
   114	        return match ($layout) {
   115	            'Split' => array_sum(array_map('intval', explode('/', (string) $cmc))),
   116	            'Flip' => (int) explode('/', (string) $cmc)[0],
   117	            'Normal', 'Double Faced', 'Meld', 'Double Faced,Meld' => is_numeric($cmc) ? (int) $cmc : $cmc,
   118	            default => is_numeric($cmc) ? (int) $cmc : $cmc,
   119	        };
   120	    }
   121	
   122	    /**
   123	     * 入力CSVファイルをフォームから取得する
   124	     *
   125	     * @param FormInterface $form
   126	     *
   127	     * @return UploadedFile|null
   128	     */
   129	    public function getFormFile(FormInterface $form): ?UploadedFile
   130	    {
   131	        $formFile = $form->get('import_file')->getData();
   132	        if ($formFile === null || $formFile->getSize() === 0) {
   133	            return null;
   134	        }
   135	
   136	        return $formFile;
   137	    }
   138	
   139	    /**
   140	     * アップロードされたCSVファイルの行ごとの処理
   141	     *
   142	     * @param UploadedFile $formFile
   143	     *
   144	     * @return CsvImportService<int, array<int|string, string>>|false
   145	     */
   146	    public function getImportData(UploadedFile $formFile): CsvImportService|false
   147	    {
   148	        $tempDir = $this->eccubeConfig['eccube_csv_temp_realdir'] ?? null;
   149	        if ($tempDir === null) {
   150	            return false;
   151	        }
   152	
   153	        $this->fileName = 'upload_'.StringUtil::random().'.'.$formFile->getClientOriginalExtension();
   154	        $formFile->move($tempDir, $this->fileName);
   155	
   156	        $path = $tempDir.'/'.$this->fileName;
   157	        $fileContent = file_get_contents($path);
   158	
   159	        if ($fileContent === false) {
   160	            return false;
   161	        }
   162	
   163	        if (str_starts_with($fileContent, "\xEF\xBB\xBF")) {
   164	            $fileContent = substr($fileContent, 3);
   165	        }
   166	
   167	        $encode = StringUtil::characterEncoding($fileContent);
   168	        // UTF-8以外（Shift-JISなど）なら、UTF-8に変換する
   169	        if ($encode !== null && $encode !== 'UTF-8') {
   170	            $fileContent = mb_convert_encoding($fileContent, 'UTF-8', $encode);
   171	        }
   172	
   173	        $fileContent = StringUtil::convertLineFeed($fileContent);
   174	        $fileContent = $this->removeWhite($fileContent);
   175	
   176	        $tmp = tmpfile();
   177	        if ($tmp === false) {
   178	            return false;
   179	        }
   180	

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
/bin/bash -lc 'rg -n "function fopen|function fputcsv|setCsvResponseHeader|createFileName|Content-Type|Content-Disposition|eccube_csv_export_encoding" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:749:        $enc = (string) $this->eccubeConfig->get('eccube_csv_export_encoding');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:812:     * CSVレスポンスに必要なContent-Type/Content-Dispositionヘッダを組み立てる。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:818:        $encoding = (string) $this->eccubeConfig->get('eccube_csv_export_encoding');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:819:        $fileName = $this->createFileName($this->fileNamePrefix);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:822:            'Content-Type' => 'text/csv;charset='.$encoding,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:823:            'Content-Disposition' => 'attachment; filename="'.$fileName.'"',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:1382:     * eccube_csv_export_encoding を mb_convert_encoding の第2引数向けに正規化する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:2059:    private function createFileName(?string $prefix): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiCustomerApiClient.php:321:            $headers['Content-Type'] = 'application/json';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:343:            'Content-Type' => 'application/json',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiAccessTokenService.php:78:            'Content-Type' => 'application/x-www-form-urlencoded',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiAccessTokenService.php:93:                    'Content-Type' => 'application/x-www-form-urlencoded',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiSectionApiClient.php:243:            'Content-Type' => 'application/json',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php:380:    protected function createFileName(string $prefix): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php:391:    protected function setCsvResponseHeader(Response $response, string $fileName): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php:393:        $innerEncoding = $this->eccubeConfig['eccube_csv_export_encoding'] ?? 'SJIS-win';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php:395:        $response->headers->set('Content-Type', 'text/csv;charset='.$encoding);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php:396:        $response->headers->set('Content-Disposition', 'attachment; filename='.$fileName);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/StockHistoryCsv.php:75:        $filename = $this->createFileName('stock_history_');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/StockHistoryCsv.php:76:        $this->setCsvResponseHeader($response, $filename);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:245:        $filename = $this->createFileName('cards_');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:246:        $this->setCsvResponseHeader($response, $filename);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/InventoryPlanCsv.php:262:        $this->setCsvResponseHeader($response, $filename);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/SmaregiMockResponder.php:177:                'Content-Type' => 'application/json',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/SmaregiMockResponder.php:194:                'Content-Type' => 'application/json',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Upload/FileManager.php:142:                    // @TODO: MIMEチェックしたいが、get_headersからのContent-Type順番が変わるため、一旦全てのヘッダ内容でContent-Typeをチェックする
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php:263:            (string) $value, $config['eccube_csv_export_encoding'], 'UTF-8'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php:267:    public function fopen(): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php:273:            $encoding = $this->eccubeConfig['eccube_csv_export_encoding'] ?? 'SJIS-win';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php:284:    public function fputcsv(array $row): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductPriceCsv.php:66:        $filename = $this->createFileName('product_price_');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductPriceCsv.php:67:        $this->setCsvResponseHeader($response, $filename);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/Response/SectionMockResponse.php:96:                'Content-Type' => 'application/json',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:74:        $filename = $this->createFileName('product_card_');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:75:        $this->setCsvResponseHeader($response, $filename);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/StockHistoryDisposalCsv.php:75:        $filename = $this->createFileName('stock_history_disposal_');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/StockHistoryDisposalCsv.php:76:        $this->setCsvResponseHeader($response, $filename);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:82:        $filename = $this->createFileName('order_');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:83:        $this->setCsvResponseHeader($response, $filename);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductGoodsCsv.php:72:        $filename = $this->createFileName('product_goods_');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductGoodsCsv.php:73:        $this->setCsvResponseHeader($response, $filename);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderHistoryCsvExportService.php:100:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderHistoryCsvExportService.php:101:        $response->headers->set('Content-Disposition', 'attachment; filename='.$filename);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/Response/CustomerMockResponse.php:111:                'Content-Type' => 'application/json',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderProductListCsvExportService.php:94:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderProductListCsvExportService.php:95:        $response->headers->set('Content-Disposition', 'attachment; filename='.$filename);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/Response/AccessTokenMockResponse.php:42:                'Content-Type' => 'application/json',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/Response/ProductMockResponse.php:103:                'Content-Type' => 'application/json',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ProductRequestCsvExportService.php:63:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ProductRequestCsvExportService.php:64:        $response->headers->set('Content-Disposition', 'attachment; filename='.$filename);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiProductApiClient.php:257:            $headers['Content-Type'] = 'application/json';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/UsedCardCsvExportService.php:78:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/UsedCardCsvExportService.php:79:        $response->headers->set('Content-Disposition', 'attachment; filename='.$filename);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderSummaryCsvExportService.php:108:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderSummaryCsvExportService.php:109:        $response->headers->set('Content-Disposition', 'attachment; filename='.$filename);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockApprovalLineItemsCsvExportService.php:105:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockApprovalLineItemsCsvExportService.php:107:            'Content-Disposition',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockJoinShortageCsvExportService.php:59:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockJoinShortageCsvExportService.php:60:        $response->headers->set('Content-Disposition', 'attachment; filename='.$filename);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveOutboundApprovalRequestCsvExportService.php:73:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveOutboundApprovalRequestCsvExportService.php:74:        $response->headers->set('Content-Disposition', 'attachment; filename='.$filename);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SalesAnalysisCsvExporterService.php:59:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SalesAnalysisCsvExporterService.php:60:        $response->headers->set('Content-Disposition', 'attachment; filename='.$filename);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockApprovalListCsvExportService.php:92:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockApprovalListCsvExportService.php:94:            'Content-Disposition',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInboundApprovalRequestCsvExportService.php:72:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInboundApprovalRequestCsvExportService.php:73:        $response->headers->set('Content-Disposition', 'attachment; filename='.$filename);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInstructionLabelCsvExporterService.php:88:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInstructionLabelCsvExporterService.php:89:        $response->headers->set('Content-Disposition', 'attachment; filename='.$filename);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:97:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:99:            'Content-Disposition',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderHistoryCsvExportService.php:101:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderHistoryCsvExportService.php:102:        $response->headers->set('Content-Disposition', 'attachment; filename='.$filename);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php:83:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php:85:            'Content-Disposition',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:60:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:61:        $response->headers->set('Content-Disposition', 'attachment; filename='.$filename);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:106:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:108:            'Content-Disposition',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:97:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:99:            'Content-Disposition',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ShippingStandbyCsvExporterService.php:134:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/ShippingStandbyCsvExporterService.php:136:            'Content-Disposition',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:69:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:71:            'Content-Disposition',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExportService.php:85:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/EventEntryCsvExportService.php:87:            'Content-Disposition',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockSplitJoinCsvExportService.php:85:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockSplitJoinCsvExportService.php:86:        $response->headers->set('Content-Disposition', 'attachment; filename='.$filename);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/DeckCsvExporterService.php:86:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/DeckCsvExporterService.php:87:        $response->headers->set('Content-Disposition', 'attachment; filename='.$filename);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderCsvExportService.php:103:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderCsvExportService.php:105:            'Content-Disposition',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderDepositCsvExportService.php:90:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderDepositCsvExportService.php:92:            'Content-Disposition',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:124:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php:126:            'Content-Disposition',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BarcodeReplacementListCsvExportService.php:95:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BarcodeReplacementListCsvExportService.php:97:            'Content-Disposition',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:129:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:130:        $response->headers->set('Content-Disposition', 'attachment; filename='.$filename);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:95:        $response->headers->set('Content-Type', 'application/octet-stream');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:96:        $response->headers->set('Content-Disposition', 'attachment; filename='.$filename);

codex
今のところ、候補finding自体は根拠ありです。ただし同じJSONには、入力IDの型扱いの差が含まれていません。最後にレスポンスヘッダの詳細まで確認して、最終判定をまとめます。
exec
/bin/bash -lc "nl -ba function_spec_html_preview/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.html | sed -n '248,295p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvExportService.php | sed -n '250,305p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php | sed -n '376,402p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 113ms:
   248	<h2 id="データ整合性">データ整合性</h2>
   249	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>一覧との一致</td><td>受注一覧の検索状態や並び順とは無関係に、<code>order_ids</code>に含まれたIDのみをSQLへ渡す。</td></tr><tr><td>アップロード形式との対応</td><td>ヘッダ定数および列順はインポート実装側のチェック関数と共通のソース定数であり、両者は同一ソースで更新されることが前提となる。一方でSQLが返す列セットはDoctrineの結果キー並びであり、クエリ側の並び変更で列ズレするリスクがあるため、両ファイルの並び確認が運用上の論点となる。</td></tr><tr><td>DBの更新</td><td>読み取りのみ。インポート登録とは別機能。</td></tr></tbody></table></div>
   250	<hr>
   251	<h2 id="API-バッチ結果">API/バッチ結果</h2>
   252	<p>本機能ではAPI呼び出しやバッチ起動は扱わない。</p>
   253	<hr>
   254	<h2 id="入出力">入出力</h2>
   255	<div class="table-wrap"><table><thead><tr><th>種類</th><th>内容</th></tr></thead><tbody><tr><td>入力（成功経路判定に効くもの）</td><td>POSTボディまたは同等の請求項目<code>order_ids</code>（PHP配列。キーが受注内部ID）。クエリでの絞り込み入力は読まない確認値である。</td></tr><tr><td>成功時出力</td><td><code>text/csv</code>ストリーム。1行目は日本語固定ヘッダ。</td></tr><tr><td>失敗時出力</td><td>ブラウザのダウンロードではなく、フラッシュおよびリダイレクトとなる経路がある。</td></tr></tbody></table></div>
   256	<hr>
   257	<h2 id="DBカラム">DBカラム</h2>
   258	<p>当機能はリポジトリの選択子一覧に応じ、<code>dtb_order</code>を中心とし会員情報・決済情報・状態マスタ・配送・都道府県・配送時間帯など多数のJOINに触れる。</p>
   259	<div class="table-wrap"><table><thead><tr><th>テーブル</th><th>列または関係のメモ</th></tr></thead><tbody><tr><td><code>dtb_order</code></td><td>注文番号、計上金額系、関連日時、送り状番号内部保持列など結果に露出する項目がある。詳細な列リストは関数の選択子およびスキーマを正とする。</td></tr><tr><td>会員系</td><td>INNER JOINとなるため結果に現れず、関数が空になりうる。</td></tr><tr><td>配送系（<code>dtb_shipping</code>相当）</td><td>INNER JOINとなるため無い注文は出力から落ちうることをリバース側で押さえる価値がある。</td></tr></tbody></table></div>
   260	<h3 id="DB操作">DB操作</h3>
   261	<p>本機能は参照系（検索・出力）であり、DBへの登録・更新・削除は行わない。テーブル名は ec-cube-enterprise を正典とする。</p>
   262	<div class="table-wrap"><table><thead><tr><th>操作種別</th><th>対象テーブル</th><th>契機・条件</th></tr></thead><tbody><tr><td>検索</td><td>dtb_order / dtb_shipping</td><td>検索条件に合致するレコードを抽出する。抽出結果を所定フォーマットでファイル出力する。</td></tr></tbody></table></div>
   263	<hr>
   264	<h2 id="バリデーション">バリデーション</h2>
   265	<p>クエリ入力に対してフォームオブジェクト側の入力種別チェックは行わない確認値となる。送信欠損は配列チェックのみ。</p>
   266	<hr>
   267	<h2 id="権限・認可">権限・認可</h2>
   268	<div class="table-wrap"><table><thead><tr><th>利用者状態</th><th>本機能のブラウザ操作</th></tr></thead><tbody><tr><td>管理画面共通ルートにログイン済みのアカウント</td><td>POSTで送信しうる確認値となる。細かい許可一覧はSymfonyの権限設定を正とする。</td></tr><tr><td>未ログイン</td><td>管理画面の共通フローのとおりログインまたは拒否となる。</td></tr></tbody></table></div>
   269	<hr>
   270	<h2 id="画面遷移">画面遷移</h2>
   271	<div class="table-wrap"><table><thead><tr><th>条件</th><th>遷移先</th></tr></thead><tbody><tr><td>一覧から正常にダウンロードが成功</td><td>画面上は出荷指示編集ページのままになりうる確認値であり、応答本体は別ストリーム。</td></tr><tr><td>選択欠損・論外によりリダイレクト</td><td>RefererヘッダのURLまたは受注一覧<code>admin_order</code>。</td></tr></tbody></table></div>
   272	<hr>
   273	<h2 id="エラー処理">エラー処理</h2>
   274	<div class="table-wrap"><table><thead><tr><th>エラー内容</th><th>処理</th></tr></thead><tbody><tr><td><code>order_ids</code>が無効または欠損</td><td>フラッシュ<code>admin.common.select</code>相当。</td></tr><tr><td>データ取得関数が論外値</td><td>フラッシュにメッセージを載せ、リダイレクト経路同上。標準文言はキー転用となる（実装修正の論点になりうる）。</td></tr></tbody></table></div>
   275	<hr>
   276	<h2 id="試行制限">試行制限</h2>
   277	<p>本機能では試行回数による抑止機構を扱わない。</p>
   278	<hr>
   279	<h2 id="ログ・監査">ログ・監査</h2>
   280	<div class="table-wrap"><table><thead><tr><th>タイミング</th><th>記録内容</th></tr></thead><tbody><tr><td>ストリーム返却直前</td><td>情報ログ「CSV出力ファイル名」とファイル名文字列</td></tr></tbody></table></div>
   281	<h3 id="ログに出してはいけないもの">ログに出してはいけないもの</h3>
   282	<ul><li>パスワード</li><li>なりすまし対策トークン</li><li>Cookie値</li><li>セッションIDの完全値</li><li>Remember Meトークンの原値</li></ul>
   283	<hr>
   284	<h2 id="セッション">セッション</h2>
   285	<h3 id="本機能におけるセッション">本機能におけるセッション</h3>
   286	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>読み取り</td><td>成功経路において検索状態キーは参照しない確認値となる。フラッシュのみフレームワークが利用する。</td></tr><tr><td>書き込み</td><td>受注一覧の検索状態を意図的に変更しない処理である。</td></tr></tbody></table></div>
   287	<h3 id="セッションへ保存しない情報">セッションへ保存しない情報</h3>
   288	<p>ブラウザが取得したファイル本文はサーバ側セッションへ格納しない。</p>
   289	<hr>
   290	<h2 id="Cookie">Cookie</h2>
   291	<p>管理画面共通のセッションCookieのみ。本機能が新規にCookieヘッダを発行する処理はソース上読み取れない。</p>
   292	<hr>
   293	<h2 id="排他制御・トランザクション">排他制御・トランザクション</h2>
   294	<p>読み取り主体のクエリおよびストリーム応答のみであり、このHTTPハンドラが開始するトランザクション境界や楽観排他フラグ更新はソース上読み取れない。</p>
   295	<p>行ロック・悲観ロック・楽観ロック・ロックファイルは使用しない。ロールバック対象や部分反映の扱いは本節のトランザクション境界と例外時の記載を正とする。</p>

 succeeded in 115ms:
   250	            // スカラ値の場合はそのまま.
   251	            return $data;
   252	        }
   253	    }
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
   301	    /**
   302	     * 受注検索用のクエリビルダを返す.
   303	     */
   304	    public function getOrderQueryBuilder(Request $request): QueryBuilder
   305	    {

 succeeded in 109ms:
   376	     * CSV ファイル名を生成する
   377	     *
   378	     * @param string $prefix
   379	     */
   380	    protected function createFileName(string $prefix): string
   381	    {
   382	        return $prefix.(new \DateTime())->format('YmdHis').'.csv';
   383	    }
   384	
   385	    /**
   386	     * レスポンスに CSV 用ヘッダーを設定する
   387	     *
   388	     * @param Response $response
   389	     * @param string $fileName
   390	     */
   391	    protected function setCsvResponseHeader(Response $response, string $fileName): void
   392	    {
   393	        $innerEncoding = $this->eccubeConfig['eccube_csv_export_encoding'] ?? 'SJIS-win';
   394	        $encoding = strcasecmp($innerEncoding, 'SJIS-win') === 0 ? 'windows-31j' : $innerEncoding;
   395	        $response->headers->set('Content-Type', 'text/csv;charset='.$encoding);
   396	        $response->headers->set('Content-Disposition', 'attachment; filename='.$fileName);
   397	    }
   398	
   399	    /**
   400	     * ゼロ幅スペース・BOM を除去する
   401	     *
   402	     * @param string $str

codex
FALSE_POSITIVE | ④DBカラム・DB操作・テーブル | なし。候補findingは成立。設計は「注文の郵便番号」を `dtb_order.postal_code` とする一方、実装の当該CSV生成は `c.postal_code` と `s.postal_code` を `SUBSTRING` しており、`generateResultCsv` 内で `o.postal_code` は参照していない。 | `function_spec_html_preview/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.html:224-225`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1386-1387`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1427-1428` | 候補findingは維持。設計側の「注文の郵便番号」表現を顧客/配送先の実データ源に合わせて修正。

WEAK_EVIDENCE | ④DBカラム・DB操作・テーブル | なし。designRef/implRef は実在し、引用内容も概ね確認できる。補強するなら `dtb_order.postal_code` 自体は存在するが、このCSV生成では未使用である点を明記するとよい。 | `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:488`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1373` | 根拠補強のみ。

MISSED | バリデーション/処理フロー | 設計は「キー一覧を整数IDの並びとして解釈」とするが、実装は `array_keys($rawOrderIds)` をそのまま渡しており、整数キャスト・整数型検証はない。DQL側も `o IN (:orders)` にそのまま設定している。実行時に数値文字列が許容されるかは確認不能だが、少なくとも設計上の「整数ID」化は実装されていない。 | `function_spec_html_preview/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.html:236`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:202-213`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1460-1461` | findingsへ low 程度で追加、または設計を「配列キーをIDとして渡す」に修正。

SEVERITY | ④DBカラム・DB操作・テーブル | 候補findingの low は妥当。設計内部でも業務ルール節は「顧客郵便番号」を `SUBSTRING` 分割と書いており、主な不整合は移行表のデータ源ラベルに限定される。 | `function_spec_html_preview/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.html:225`, `function_spec_html_preview/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.html:243` | severity 変更不要。

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正
tokens used
72,314
FALSE_POSITIVE | ④DBカラム・DB操作・テーブル | なし。候補findingは成立。設計は「注文の郵便番号」を `dtb_order.postal_code` とする一方、実装の当該CSV生成は `c.postal_code` と `s.postal_code` を `SUBSTRING` しており、`generateResultCsv` 内で `o.postal_code` は参照していない。 | `function_spec_html_preview/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.html:224-225`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1386-1387`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1427-1428` | 候補findingは維持。設計側の「注文の郵便番号」表現を顧客/配送先の実データ源に合わせて修正。

WEAK_EVIDENCE | ④DBカラム・DB操作・テーブル | なし。designRef/implRef は実在し、引用内容も概ね確認できる。補強するなら `dtb_order.postal_code` 自体は存在するが、このCSV生成では未使用である点を明記するとよい。 | `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:488`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1373` | 根拠補強のみ。

MISSED | バリデーション/処理フロー | 設計は「キー一覧を整数IDの並びとして解釈」とするが、実装は `array_keys($rawOrderIds)` をそのまま渡しており、整数キャスト・整数型検証はない。DQL側も `o IN (:orders)` にそのまま設定している。実行時に数値文字列が許容されるかは確認不能だが、少なくとも設計上の「整数ID」化は実装されていない。 | `function_spec_html_preview/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.html:236`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:202-213`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1460-1461` | findingsへ low 程度で追加、または設計を「配列キーをIDとして渡す」に修正。

SEVERITY | ④DBカラム・DB操作・テーブル | 候補findingの low は妥当。設計内部でも業務ルール節は「顧客郵便番号」を `SUBSTRING` 分割と書いており、主な不整合は移行表のデータ源ラベルに限定される。 | `function_spec_html_preview/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.html:225`, `function_spec_html_preview/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.html:243` | severity 変更不要。

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正

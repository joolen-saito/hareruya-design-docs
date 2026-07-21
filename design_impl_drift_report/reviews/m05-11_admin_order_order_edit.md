OpenAI Codex v0.142.5
--------
workdir: /home/y-saito/Developments/hareruya-design-docs
model: gpt-5.5
provider: openai
approval: never
sandbox: read-only
reasoning effort: medium
reasoning summaries: none
session id: 019f2639-577e-7963-82c7-f5c16ccb743e
--------
user
あなたは設計書vs実装の差分監査に対する**批判的レビュア**です。読み取り専用で検証してください。創作禁止・確認できないものは「確認不能」と明記。

## 対象機能: m05-11_admin_order_order_edit
- 差分候補JSON(検証対象): /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-11_admin_order_order_edit.json
- 設計書HTML(正): /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-11_admin_order_order_edit.html
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
読み取り専用で、まず候補JSONと対象設計書・実装の該当箇所を確認します。根拠の実在性を優先して見ます。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-11_admin_order_order_edit.html | sed -n '1,260p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<!doctype html>
     2	<html lang="ja">
     3	<head>
     4	  <meta charset="utf-8">
     5	  <meta name="viewport" content="width=device-width, initial-scale=1">
     6	  <title>m05-11_admin_order_order_edit（管理画面_受注管理_受注情報編集） - 機能仕様書</title>
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
   187	<a class="lv3" href="#編集画面を表示する-GET-m05-11-admin-order-order-edit">編集画面を表示する（GET `m05-11_admin_order_order_edit`）</a>
   188	<a class="lv3" href="#フォームを送信する-POST-共通前提">フォームを送信する（POST、共通前提）</a>
   189	<a class="lv3" href="#登録する-POST-かつ-mode-register-かつ検証成功">登録する（POST かつ `mode=register`、かつ検証成功）</a>
   190	<a class="lv3" href="#ステータスだけ更新する-POST-かつ-mode-status-change">ステータスだけ更新する（POST かつ `mode=status_change`）</a>
   191	<a class="lv3" href="#日付をクリアする-POST-かつ-mode-clear-date">日付をクリアする（POST かつ `mode=clear_date`）</a>
   192	<a class="lv2" href="#集計条件">集計条件</a>
   193	<a class="lv2" href="#登録処理時の判定順序">登録処理時の判定順序</a>
   194	<a class="lv2" href="#業務ルール・計算">業務ルール・計算</a>
   195	<a class="lv3" href="#入力項目">入力項目</a>
   196	<a class="lv3" href="#エッジケース">エッジケース</a>
   197	<a class="lv2" href="#データ整合性">データ整合性</a>
   198	<a class="lv2" href="#API-バッチ結果">API/バッチ結果</a>
   199	<a class="lv2" href="#入出力">入出力</a>
   200	<a class="lv2" href="#DBカラム">DBカラム</a>
   201	<a class="lv3" href="#DB操作">DB操作</a>
   202	<a class="lv2" href="#バリデーション">バリデーション</a>
   203	<a class="lv2" href="#権限・認可">権限・認可</a>
   204	<a class="lv2" href="#画面遷移">画面遷移</a>
   205	<a class="lv3" href="#遷移時に引き継ぐ状態">遷移時に引き継ぐ状態</a>
   206	<a class="lv2" href="#エラー処理">エラー処理</a>
   207	<a class="lv2" href="#試行制限">試行制限</a>
   208	<a class="lv2" href="#ログ・監査">ログ・監査</a>
   209	<a class="lv3" href="#ログに出してはいけないもの">ログに出してはいけないもの</a>
   210	<a class="lv2" href="#セッション">セッション</a>
   211	<a class="lv3" href="#本機能におけるセッション">本機能におけるセッション</a>
   212	<a class="lv3" href="#セッションへ保存しない情報">セッションへ保存しない情報</a>
   213	<a class="lv2" href="#Cookie">Cookie</a>
   214	<a class="lv2" href="#排他制御・トランザクション">排他制御・トランザクション</a>
   215	<a class="lv2" href="#調査補助">調査補助</a>
   216	<a class="lv3" href="#HTTPルート名とパス-コード探索用・旧入口節より退避">HTTPルート名とパス（コード探索用・旧入口節より退避）</a></nav>
   217	    </aside>
   218	    <main class="doc-content">
   219	      <header class="page-header">
   220	        <p class="crumb">Source:<br>/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-11_admin_order_order_edit.md</p>
   221	        <h1>m05-11_admin_order_order_edit（管理画面_受注管理_受注情報編集）</h1>
   222	      </header>
   223	      <h2 id="概要">概要</h2>
   224	<p>既存受注を開き、注文者・お届け先・商品明細・金額構成・ステータス等を変更し、検証のうえ保存する機能である。同一テンプレートとフォーム種別で受注新規登録ルートも提供されるが、本書の主眼は既存IDを指定する編集ルートとその画面ふるまいとする。</p>
   225	<p>本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。ec-cube-enterpriseのコア実装を確認値とする。</p>
   226	<p>対象はブラウザ経由の管理画面に限定する。コントローラのメソッド名は本文の主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。</p>
   227	<p>本機能のカスタマイズ区分はカスタマイズであり、挙動は現行リポ（pf-eccube3）の実装を確認値とし、DB関連（テーブル名・列名・保存先）はec-cube-enterpriseを正とする。</p>
   228	<hr>
   229	<h2 id="リニューアル移行時の扱い">リニューアル移行時の扱い</h2>
   230	<p>本機能はカスタマイズ区分がカスタマイズであり、挙動は現行リポ（pf-eccube3）、DBスキーマはec-cube-enterpriseを正とする。本書が参照する受注（dtb_order）・出荷（dtb_shipping）・受注明細（dtb_order_item）の主要列は、ec-cube-enterpriseの実装で実在を確認した。確認した列には、受注側のステータス（order_status_id）・各種日時（payment_date、confirm_date、shipping_date、cancel_date、update_date）・金額系（discount、delivery_fee_total、charge）・ポイント系（use_point、add_point、gained_points、spended_points、point_percentage）・スマレジメモ（smaregi_memo）・住所系（addr01〜addr03、postal_code、abroad_postal_code）、出荷側の追跡番号（tracking_number）・出荷日（shipping_date）、受注明細側の欠品数量（stockout）を含む。並び順キー・論理削除と物理削除の方式・補助テーブルの有無について、現行（pf-eccube3）と移行先（ec-cube-enterprise）の差分は本書では確認していないため、相違が判明した場合はec-cube-enterprise実装を正とする。</p>
   231	<hr>
   232	<h2 id="利用者視点の入口">利用者視点の入口</h2>
   233	<div class="table-wrap"><table><thead><tr><th>入口</th><th>URLエンドポイント</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>受注一覧などから既存受注の編集へ遷移</td><td><code>GET /{admin_route}/order/{id}/edit</code></td><td>認証済み管理者として編集テンプレートが返る。存在しない <code>id</code> は HTTP 404。</td></tr><tr><td>送信・再計算・登録（フォームの <code>action</code> は <code>?</code> で現 URL に POST）</td><td><code>POST /{admin_route}/order/{id}/edit</code></td><td><code>mode</code> と検証結果に応じてフラッシュメッセージ付き同一編集 URL へリダイレクトする、または検証エラーで同画面再描画する。</td></tr><tr><td>会員検索モーダルで検索実行</td><td><code>POST /{admin_route}/order/search/customer/html</code></td><td>検索キーワードをセッションに保存し、会員一覧 HTML 断片がモーダル内に差し込まれる。</td></tr><tr><td>会員検索結果の次ページ</td><td><code>GET /{admin_route}/order/search/customer/html/page/{page_no}</code></td><td>セッションに保存した条件でページングした HTML 断片が返る。</td></tr><tr><td>商品追加モーダルで検索実行</td><td><code>POST /{admin_route}/search/product</code></td><td>店舗 ID・在庫ロケ等を含む検索条件をセッションに保存し、商品一覧 HTML 断片が返る。</td></tr><tr><td>商品検索結果の次ページ</td><td><code>GET /{admin_route}/search/product/page/{page_no}</code></td><td>セッション条件のままページング HTML が返る。</td></tr><tr><td>納品書印刷ボタン</td><td><code>GET /{admin_route}/order/{id}/print/delivery</code></td><td>新しいウィンドウで納品書用テンプレートが開く。</td></tr><tr><td>会員 ID 指定の会員情報 JSON。XMLHttpRequest かつ CSRF 検証に成功しないと H…</td><td><code>POST /{admin_route}/order/search/customer/id</code></td><td>会員 ID 指定の会員情報 JSON。XMLHttpRequest かつ CSRF 検証に成功しないと HTTP 400。</td></tr><tr><td>「その他明細」モーダル用の手数料・送料・値引きの組み合わせ一覧 HTML。XMLHttpRequest か…</td><td><code>POST /{admin_route}/order/search/order_item_type</code></td><td>「その他明細」モーダル用の手数料・送料・値引きの組み合わせ一覧 HTML。XMLHttpRequest かつ CSRF 検証が前提。</td></tr></tbody></table></div>
   234	<hr>
   235	<h2 id="フロント挙動">フロント挙動</h2>
   236	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>表示要素</td><td>カード単位で受注概要、商品一覧（価格帯により行見出し色分け）、金額サマリ、注文者、お支払情報、お届け先（単一／複数で切替）、ショップメモ、ポイントエラーメッセージ（読み取り専用）、メール履歴などを出す。決済処理中・購入処理中に該当すると末尾の登録ボタンに <code>disabled</code> を付ける。</td></tr><tr><td>JS 挙動</td><td>全 <code>input</code> で Enter 押下を止める。会員・商品・明細種別モーダルは Ajax。商品決定後はプロトタイプ行を DOM 追加して即 <code>form</code> 送信し、再計算を走らせる。配送業者変更で配送時間プルダウンを JSON から再構築する。単一配送の注文者情報コピーボタンで配送側住所・氏名等を埋める（テンプレート上はコメントアウトされており、当リポジトリの当画面では出ないブロックもある）。編集時のみ「受注ステータス変更」で <code>mode=status_change</code>、各日付クリアで <code>mode=clear_date</code> と <code>target</code> クエリを付ける。submit 前にキャンセル移行・数量減・欠品・価格差異で <code>confirm</code> / <code>alert</code> を挟む。ポイント利用が有効かつ会員のとき submit で換算レートに従いポイント割引額入力欄を更新する処理をフックする。</td></tr><tr><td>CSS・レイアウト</td><td>カード折りたたみ、商品表の固定レイアウト、閾値帯の色分け、拡大画像オーバーレイ用クラス、バッジ色（言語・状態・フォイル）をインラインスタイルで定義する。</td></tr><tr><td>モーダル・ポップアップ</td><td>会員検索、商品検索、その他明細、明細削除確認、メール履歴本文、未保存のまま別画面へ進む確認、Bootstrap モーダルを用いる。</td></tr><tr><td>手動メールボタン</td><td>画面上部に「手動メール」ボタンがあるが、当テンプレート内のスクリプトでは当クラスへのクリック束縛を定義しない。クライアント側の遷移・送信は本書では仕様確定しない。</td></tr></tbody></table></div>
   237	<hr>
   238	<h2 id="処理フロー">処理フロー</h2>
   239	<h3 id="編集画面を表示する-GET-m05-11-admin-order-order-edit">編集画面を表示する（GET <code>m05-11_admin_order_order_edit</code>）</h3>
   240	<ol><li>管理画面の認証済みセッションを要する。</li><li><code>id</code> により受注を取得する。実装は商品明細の結合・閾値用ソートを含む専用クエリを用いる。該当が無ければ HTTP 404。</li><li>編集前スナップショットを受注のクローンと明細参照コレクションで保持する。</li><li>受注フォームビルダを組み立て、拡張イベント（initialize）を送出する。</li><li>フォームをリクエストに束ね、税表示タイプ未設定の明細へ既定の税表示区分を補う。</li><li>POST でないため、送信後処理には入らず、会員検索・商品検索フォーム、配送時間 JSON、価格閾値オプション、店頭待ち番号、商品サブ情報マップ等の表示用データとともにテンプレートを返す。</li></ol>
   241	<h3 id="フォームを送信する-POST-共通前提">フォームを送信する（POST、共通前提）</h3>
   242	<ol><li>フォームが submit されたとき、<code>OrderItems</code> コレクションが妥当でなければ以降の <code>mode</code> 分岐に入らず、そのまま再表示する。</li><li><code>mode=status_change</code> のときは「受注ステータス変更」経路のみ実行し、編集画面へリダイレクトして終える（後述）。</li><li><code>mode=clear_date</code> のときは指定 <code>target</code> の日付フィールドを null にし flush、成功フラッシュ後、編集画面へリダイレクトする（後述）。</li><li>上記以外では、送料・手数料・値引きを含む明細の税・小計・合計を <code>calculate()</code> で再計算し、Symfony フォーム検証（<code>$form-&gt;isValid()</code>）で妥当性を確認する。現行実装（pf-eccube3 / HareruyaEc）は EC-CUBE4 系の PurchaseFlow を用いない。</li><li>validate の警告は管理フラッシュに積み、エラーがあれば欠品側のメモリ変更をロールバックし、エラーメッセージをフラッシュに積む。</li><li><code>mode=register</code> でかつフォーム全体が妥当で、かつ validate にエラーが無いときだけ登録トランザクションに入る。それ以外の POST はここで終わり、同画面を再表示する（validate 結果は反映済み）。</li></ol>
   243	<h3 id="登録する-POST-かつ-mode-register-かつ検証成功">登録する（POST かつ <code>mode=register</code>、かつ検証成功）</h3>
   244	<ol><li>情報ログに受注登録開始を書く。</li><li>配送・明細の店舗参照を揃え、トランザクション内で <code>persist</code>／<code>flush</code> により永続化する（現行実装に PurchaseFlow の prepare/commit は無い）。</li><li>commit 後も店舗 ID を配送・明細に再付与する。</li><li>受注ステータスが編集前と異なり、かつ新ステータスが「出荷完了」相当の ID のとき、未出荷の配送に出荷日時を立て、<code>gainPoints</code>（会員加算とスマレジ側加算の両系統）を呼ぶ。その後ステータスを一旦旧値に戻し、ステートマシンで新ステータスへ遷移させる。</li><li>新規受注なら作成日時・更新日時と配送の日時を埋め、既存なら更新日時のみ更新する。永続化し、新規の場合は採番の都合で早期 flush する。</li><li>スナップショットにあってフォームから消えた明細を削除する。受注番号処理を走らせ、会員がいれば購入サマリを更新する。フォームのポイント割合・使用・獲得を反映するが、支払方法名に特定文字列が含まれず、小計または割合が変わったときは小計と割合から獲得ポイントを再計算する。</li><li>スマレジ取引コードがあり、かつキャンセル以外のステータスなら、スマレジ API に商品系の後処理 POST を行う。</li><li>トランザクション成功後、完了イベントを送出し、成功フラッシュを積み、情報ログに完了を書く。フォームの <code>return_link</code> がサイト内パスとして解釈できればそのルートへ、できなければ編集画面へリダイレクトする。</li><li>明細再計算・フォーム検証系の例外はエラーフラッシュのみで再表示。ステートマシン矛盾はログに例外を残し、旧新ステータス名入りの短いエラーメッセージをフラッシュする。</li></ol>
   245	<h3 id="ステータスだけ更新する-POST-かつ-mode-status-change">ステータスだけ更新する（POST かつ <code>mode=status_change</code>）</h3>
   246	<ol><li>旧新いずれかが欠ける、または同一 ID なら検証なしで編集画面へリダイレクトする。</li><li>フォーム全体が妥当でない場合も同様にリダイレクトする。</li><li>新ステータスが「出荷完了」へ変わるとき受注および全配送の出荷日時を現在時刻にする。新キャンセルで既存が非キャンセルかつキャンセル日未設定ならキャンセル日を立てる。新入金／新ピック中でも同様に専用日付を初回だけ立てる。</li><li>ステータスを旧値に戻したうえでステートマシン適用、会員係の更新者・更新日時を flush。出荷完了への変化ならポイント加算とスマレジ加算を再度呼ぶ。キャンセル以外かつスマレジコードがあるなら API POST。</li><li>新ステータスがキャンセルなら専用完了メッセージ、それ以外は汎用保存完了メッセージをフラッシュし、編集画面へリダイレクトする。</li></ol>
   247	<h3 id="日付をクリアする-POST-かつ-mode-clear-date">日付をクリアする（POST かつ <code>mode=clear_date</code>）</h3>
   248	<ol><li>クエリ <code>target</code> が許可リスト（ピック中日、入金日、確定日、出荷指示日、出荷日、キャンセル日、店頭予約）に一致するときだけ該当フィールドを null にし、出荷日クリアは全配送の出荷日も null にする。</li><li>一致しない <code>target</code> は何も変えず編集画面へリダイレクトする。</li><li>成功時は更新者・更新日時を更新して flush し、保存完了系フラッシュを積んで編集画面へリダイレクトする。</li></ol>
   249	<hr>
   250	<h2 id="集計条件">集計条件</h2>
   251	<p>本機能は売上ダッシュボードの集計を行わない。商品一覧の並びは受注取得クエリ側で価格閾値に応じた並び替えを含む。</p>
   252	<div class="table-wrap"><table><thead><tr><th>指標</th><th>集計の要点</th></tr></thead><tbody><tr><td>商品追加モーダルの検索</td><td>POST 直後は 1 ページ目固定。以降 GET はセッションキー <code>eccube.admin.order.product.search</code> の条件と <code>page_no</code> を使う。店舗は編集対象受注の店舗 ID、在庫ロケは定数で EC-CUBE 側ロケを指定する。</td></tr><tr><td>会員検索</td><td>POST 直後はページ 1。キーワードを <code>multi</code> に、会員状態は正会員に限定する。条件は <code>eccube.admin.order.customer.search</code> に保存する。</td></tr></tbody></table></div>
   253	<hr>
   254	<h2 id="登録処理時の判定順序">登録処理時の判定順序</h2>
   255	<div class="table-wrap"><table><thead><tr><th>順序</th><th>判定</th><th>結果</th></tr></thead><tbody><tr><td>1</td><td><code>OrderItems</code> コレクションがフォーム上妥当か</td><td>否なら <code>mode</code> に関わらず以降の分岐に進まない。</td></tr><tr><td>2</td><td><code>mode</code> が <code>status_change</code> / <code>clear_date</code> か</td><td>はいなら専用経路で終了。</td></tr><tr><td>3</td><td>明細再計算・フォーム検証にエラーがあるか</td><td>はいなら <code>register</code> でも永続化しない。欠品差分はメモリ上で戻す。</td></tr><tr><td>4</td><td><code>mode=register</code> かつフォーム全体妥当か</td><td>いいえなら再表示。</td></tr><tr><td>5</td><td>トランザクション内の <code>flush</code> 成功か</td><td>失敗ならメッセージをフラッシュして再表示。</td></tr></tbody></table></div>
   256	<hr>
   257	<h2 id="業務ルール・計算">業務ルール・計算</h2>
   258	<ul><li>受注明細のうち商品種別は 1 行以上必須。0 件なら <code>OrderItemsErrors</code> にエラーを付与する。</li><li>欠品数が増えると、その差分だけ注文数量から減算する。減算結果が負にならないよう 0 に切りつめる。差分がある明細では担当者を現ログイン管理者に付け替え、欠品履歴行を <code>persist</code> する。明細再計算・検証がエラーなら数量・担当者・履歴をメモリ上戻す。</li><li>送料・手数料・値引きは validate 時のみ一時明細として <code>Order</code> に載せ、本体フィールドの文字列金額から作る。値引きは正の入力を負の明細金額に変換し、非課税種別を付ける。</li><li>ポイント獲得数は登録確定直前にフォーム優先で載せ替えつつ、決済方法名に定数文字列が含まれず小計または割合が変わったときは「税込小計 − 利用ポイント」が正のときだけ切り捨て整数で再計算する。</li></ul>
   259	<p>本機能独自の定期バッチ集計はない。</p>
   260	<h3 id="入力項目">入力項目</h3>

exec
/bin/bash -lc "sed -n '1,240p' /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-11_admin_order_order_edit.json" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
{
  "functionId": "m05-11_admin_order_order_edit",
  "title": "m05-11_admin_order_order_edit（管理画面_受注管理_受注情報編集）",
  "domain": "m05",
  "kind": "admin",
  "designHtml": "function_spec_html_preview/pf-eccube3/m05-11_admin_order_order_edit.html",
  "findings": [
    {
      "dimension": "② 業務ルール・計算",
      "severity": "high",
      "designRef": "function_spec_html_preview/pf-eccube3/m05-11_admin_order_order_edit.html:244",
      "designQuote": "配送・明細の店舗参照を揃え、トランザクション内で persist／flush により永続化する（現行実装に PurchaseFlow の prepare/commit は無い）。",
      "implRef": "src/Eccube/Controller/Admin/Order/EditController.php:595",
      "difference": "設計はpf-eccube3挙動として『PurchaseFlowのprepare/commitは無い』(html:244)『validateもcalculate()＋$form->isValid()のみでEC-CUBE4系PurchaseFlowを用いない』(html:242)としているが、enterprise実装はorderPurchaseFlow->validate()(526)・prepare()(595)・commit()(596)を実行する。PurchaseFlowのプロセッサ群(StockDiff/税/ポイント等)が動くため在庫差分検証・税計算・金額確定の経路が設計記述と根本的に異なる。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "EditController.php:526 orderPurchaseFlow->validate、:595 orderPurchaseFlow->prepare、:596 orderPurchaseFlow->commit。設計html:242『現行実装（pf-eccube3 / HareruyaEc）は EC-CUBE4 系の PurchaseFlow を用いない。』・html:244『現行実装に PurchaseFlow の prepare/commit は無い』と明確に矛盾。"
    },
    {
      "dimension": "② 業務ルール・計算（ポイント）",
      "severity": "med",
      "designRef": "function_spec_html_preview/pf-eccube3/m05-11_admin_order_order_edit.html:244",
      "designQuote": "gainPoints（会員加算とスマレジ側加算の両系統）を呼ぶ",
      "implRef": "src/Eccube/Controller/Admin/Order/EditController.php:637",
      "difference": "設計は登録経路(html:244)・ステータス変更経路(html:246)ともに『出荷完了時のgainPoints』とキャンセル日設定のみを記述し、キャンセル時のポイント取り消しには触れていない。実装は初回キャンセル遷移時にpointService->cancelOrderPoints()をregister経路(637)およびstatus_change経路(816)で呼ぶ。設計に無い追加のポイント取消挙動。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "EditController.php:636-638 register経路 isFirstCancellation 時 pointService->cancelOrderPoints($TargetOrder)。:815-817 status_change経路も同様。設計html:244/246 いずれもポイント取消(cancelOrderPoints)への言及なし。"
    },
    {
      "dimension": "② 業務ルール・計算（登録経路のキャンセル副作用）",
      "severity": "low",
      "designRef": "function_spec_html_preview/pf-eccube3/m05-11_admin_order_order_edit.html:244",
      "designQuote": "受注ステータスが編集前と異なり、かつ新ステータスが「出荷完了」相当の ID のとき、未出荷の配送に出荷日時を立て",
      "implRef": "src/Eccube/Controller/Admin/Order/EditController.php:630",
      "difference": "設計の登録(register)フロー(html:244)はステータス差分時の副作用として『出荷完了』相当のみ記述し、キャンセルへの遷移には言及しない。実装のregister経路は初回キャンセル遷移時にsetCancelDate(630-633)まで行う。キャンセル日設定はstatus_change経路(html:246)にのみ設計記載があり、register経路の同挙動は設計未記載。",
      "confidence": "med",
      "verdict": "CONFIRMED",
      "evidence": "EditController.php:630-633 register経路 $isFirstCancellation 時 $TargetOrder->setCancelDate(new DateTime())。設計html:244のregister副作用記述はDELIVERED(出荷完了)のみでキャンセル日設定に言及なし。html:246(status_change)にのみキャンセル日設定を記載。"
    },
    {
      "dimension": "⑤ 画面遷移・フラッシュ",
      "severity": "low",
      "designRef": "function_spec_html_preview/pf-eccube3/m05-11_admin_order_order_edit.html:244",
      "designQuote": "トランザクション成功後、完了イベントを送出し、成功フラッシュを積み",
      "implRef": "src/Eccube/Controller/Admin/Order/EditController.php:733",
      "difference": "設計は登録成功時のフラッシュを『成功フラッシュ』(キャンセル時は取消完了、他は汎用保存完了)としか記述しないが、実装はisPartCancel()判定(729,843-859)で一部キャンセル時に専用メッセージ admin.order.part_cancel.complete(733)を出す3分岐を持つ。設計に無い『一部キャンセル』完了メッセージ分岐。",
      "confidence": "med",
      "verdict": "CONFIRMED",
      "evidence": "EditController.php:729 $isPartCancel=$this->isPartCancel(...)、:730-736 3分岐(CANCEL→cancel.complete / isPartCancel→part_cancel.complete(733) / else→save.complete)。isPartCancel実装は:843-859。設計html:244『成功フラッシュ』・html:272『成功・取消完了等のフラッシュ』に一部キャンセル専用メッセージの記載なし。"
    },
    {
      "dimension": "② 業務ルール・計算（ポイント再計算の例外）",
      "severity": "low",
      "designRef": "function_spec_html_preview/pf-eccube3/m05-11_admin_order_order_edit.html:258",
      "designQuote": "決済方法名に定数文字列が含まれず小計または割合が変わったときは「税込小計 − 利用ポイント」が正のときだけ切り捨て整数で再計算する",
      "implRef": "src/Eccube/Controller/Admin/Order/EditController.php:956",
      "difference": "設計のポイント獲得数再計算ルール(html:258)は支払方法名・小計/割合変化の条件のみ記述。実装はそれに先立ち、受注ステータスがCANCELのとき無条件でgainedPoints=0にする分岐(956-957)を持つ。設計未記載の獲得ポイント0固定挙動。",
      "confidence": "med",
      "verdict": "CONFIRMED",
      "evidence": "EditController.php:956-957 if OrderStatus::CANCEL then $gainedPoints=0（elseifで初めて設計記載の再計算式:958-962）。設計html:258の再計算ルールにCANCELステータスでの獲得ポイント0固定の記述なし。"
    }
  ]
}

exec
/bin/bash -lc 'rg -n "order_edit|OrderController|受注|Order" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube | head -n 120' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:125:     * Admin/Order/EditController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:147:     * Admin/Order/MailController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:162:     * Admin/Order/OrderController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:171:    // exportOrder
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/PurchaseProductListOrderBy.php:23:enum PurchaseProductListOrderBy: int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/PurchaseProductListOrderBy.php:43:    public static function toolbarDisplayOrder(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/PurchaseProductListOrderBy.php:59:        foreach (self::toolbarDisplayOrder() as $orderBy) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SalesAnalysisController.php:21:use Eccube\Repository\OrderItemRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SalesAnalysisController.php:35:        private readonly OrderItemRepository $orderItemRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SalesAnalysisController.php:125:    private function resolveTargetBaseInfoIds(bool $mailOrderEnabled, iterable $storeSalesTargets): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SalesAnalysisController.php:128:        if ($mailOrderEnabled) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:21:use Eccube\Repository\OrderRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:34:        private readonly OrderRepository $orderRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:155:    private function resolveBaseInfoFilter(bool $mailOrder, bool $store): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:159:        if ($mailOrder && $store) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:162:        if ($mailOrder) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:190:            $resultInfo[$name] = $this->complementOrderDay(array_column($tagSales, 'price', 'day'), $days);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:198:            $resultInfo[$label] = $this->complementOrderDay(array_column($noTagSales, 'price', 'day'), $days);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:234:    private function complementOrderDay(array $order, int $days): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SummaryController.php:141:        $mailOrderEnabled = (bool) ($viewData['mail_order_enabled'] ?? false);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SummaryController.php:156:                $mailOrderEnabled,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SummaryController.php:159:            $mailOrderEnabled
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SummaryController.php:295:        bool $mailOrderEnabled,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SummaryController.php:301:        if ($mailOrderEnabled) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/TaxExtension.php:16:use Eccube\Entity\OrderItem;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/TaxExtension.php:46:     * 受注作成時点での標準税率と比較し, 異なれば軽減税率として判定する.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/TaxExtension.php:48:    public function isReducedTaxRate(OrderItem $OrderItem): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/TaxExtension.php:50:        $Order = $OrderItem->getOrder();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/TaxExtension.php:57:                ->setParameter('apply_date', $Order->getCreateDate())
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/TaxExtension.php:65:        return $TaxRule && $TaxRule->getTaxRate() != $OrderItem->getTaxRate();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Attribute/OrderFlow.php:17:final class OrderFlow
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/EccubeExtension.php:17:use Eccube\Entity\DtbOtcBuyOrder;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/EccubeExtension.php:366:     * @param DtbOtcBuyOrder $otcBuyOrder
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/EccubeExtension.php:370:    public function getAssessmentNumber(DtbOtcBuyOrder $otcBuyOrder): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/EccubeExtension.php:372:        return explode('-', $otcBuyOrder->getAssessmentId())[2];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/EccubeExtension.php:387:            $weeklySold += $productClass->getOrderQuantity04();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiOtcSyncMessage.php:26:    public function getOrderId(): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiOrderUsePointMessage.php:21:final readonly class SmaregiOrderUsePointMessage
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiOrderUsePointMessage.php:29:    public function getOrderId(): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:22:use Eccube\Entity\DtbBuyOrder;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:23:use Eccube\Entity\DtbBuyOrderIndivisualInputProduct;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:28:use Eccube\Form\Type\Admin\Purchase\BuyOrderStockType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:34:use Eccube\Repository\DtbBuyOrderRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:35:use Eccube\Repository\DtbBuyOrderStatusHistoryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:36:use Eccube\Repository\DtbBuyOrderStockRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:38:use Eccube\Repository\Master\MtbBuyOrderStatusRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:44:use Eccube\Service\Admin\Purchase\BuyOrderRestockListService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:48:use Eccube\Service\Csv\Exporter\BuyOrderCsvExportService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:49:use Eccube\Service\Csv\Exporter\BuyOrderDepositCsvExportService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:50:use Eccube\Service\Csv\Exporter\BuyOrderProductListCsvExportService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:51:use Eccube\Service\Csv\Exporter\BuyOrderRestockListCsvExportService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:90:        protected DtbBuyOrderRepository $buyOrderRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:92:        protected DtbBuyOrderStatusHistoryRepository $buyOrderStatusHistoryRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:94:        protected MtbBuyOrderStatusRepository $buyOrderStatusRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:98:        protected DtbBuyOrderStockRepository $buyOrderStockRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:100:        protected BuyOrderCsvExportService $BuyOrderCsvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:101:        protected BuyOrderDepositCsvExportService $BuyOrderDepositCsvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:102:        protected BuyOrderProductListCsvExportService $buyOrderProductListCsvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:103:        protected BuyOrderRestockListCsvExportService $buyOrderRestockListCsvExportService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:104:        protected BuyOrderRestockListService $buyOrderRestockListService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:151:        $this->repository = $this->buyOrderRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:162:        $BuyOrders = ($pagination && $pagination->getTotalItemCount() > 0) ? $pagination->getItems() : [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:163:        $result = array_merge($result, $this->purchaseSearchAction->handle($BuyOrders));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:174:        $BuyOrder = $this->buyOrderRepository->find($id);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:175:        if ($BuyOrder === null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:181:        foreach ($BuyOrder->getBuyMainCards() as $BuyMainCard) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:186:        $this->entityManager->remove($BuyOrder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:203:        $BuyOrder = $this->buyOrderRepository->find($id);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:204:        if ($BuyOrder === null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:208:        $viewData = $this->getDetailViewData($BuyOrder, $id);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:212:            $this->productClassRepository->selectHighPriceProductClassByBuyOrder($BuyOrder),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:213:            $this->productClassRepository->selectAllProductClassByBuyOrder($BuyOrder)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:218:        $treatNullAsUnconfirmed = $BuyOrder->getQualifiedInvoiceIssuerConfirmationFlg() === null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:219:        $buyOrderStockForm = $this->formFactory->createBuilder(BuyOrderStockType::class, ['stockProductClasses' => $stockProductClasses])->getForm();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:220:        $form = $this->formFactory->createBuilder(PurchaseDetailType::class, $BuyOrder, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:222:            'original_buy_order_status_id' => $BuyOrder->getBuyOrderStatus()->getId(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:223:            'buy_order_stock_form' => $buyOrderStockForm,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:230:        $bankAccountForm = $this->formFactory->createBuilder(BankAccountType::class, $BuyOrder->getBankAccount())->getForm();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:234:            $BuyOrder->getQualifiedInvoiceIssuerAccount(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:235:            ['qualifiedInvoiceIssuerFlgForDisplay' => $BuyOrder->isQualifiedInvoiceIssuerFlg()]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:241:            'buyOrderStockForm' => $buyOrderStockForm->createView(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:359:        $BuyOrder = $this->buyOrderRepository->find($id);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:360:        if ($BuyOrder === null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:365:        $BuyMainCards = $this->buyMainCardRepository->getBuyMainCardsByPurchaseCategory($BuyOrder->getId(), DtbBuyMainCard::SELECT_TYPE);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:366:        $BuyOrder->setBuyMainCards(new ArrayCollection($BuyMainCards));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:367:        $BuyMainBulkCards = $this->buyMainCardRepository->getBuyMainCardsByPurchaseCategory($BuyOrder->getId(), DtbBuyMainCard::BULK_TYPE);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:368:        $BuyOrder->setBuyMainBulkCards(new ArrayCollection($BuyMainBulkCards));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:371:            $this->productClassRepository->selectHighPriceProductClassByBuyOrder($BuyOrder),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:372:            $this->productClassRepository->selectAllProductClassByBuyOrder($BuyOrder)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:375:        $treatNullAsUnconfirmed = $BuyOrder->getQualifiedInvoiceIssuerConfirmationFlg() === null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:376:        $originalBuyOrderStatusId = $BuyOrder->getBuyOrderStatus()->getId();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:377:        $buyOrderStockForm = $this->formFactory->createBuilder(BuyOrderStockType::class, ['stockProductClasses' => $stockProductClasses])->getForm();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:378:        $form = $this->formFactory->createBuilder(PurchaseDetailType::class, $BuyOrder, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:380:            'original_buy_order_status_id' => $originalBuyOrderStatusId,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:381:            'buy_order_stock_form' => $buyOrderStockForm,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:385:        // 実在庫バリデーション（validateStockEditAllowed）が buyOrderStockForm->getData() を参照するため、
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:387:        $buyOrderStockForm->handleRequest($request);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:392:        $bankAccountForm = $this->formFactory->createBuilder(BankAccountType::class, $BuyOrder->getBankAccount())->getForm();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:396:            $BuyOrder->getQualifiedInvoiceIssuerAccount(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:397:            ['qualifiedInvoiceIssuerFlgForDisplay' => $BuyOrder->isQualifiedInvoiceIssuerFlg()]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:401:        $isInvalid = !$form->isValid() || !$buyOrderStockForm->isValid() || !$bankAccountForm->isValid() || !$qualifiedInvoiceIssuerForm->isValid();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:407:            $viewData = $this->getDetailViewData($BuyOrder, $id);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:411:                'buyOrderStockForm' => $buyOrderStockForm->createView(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:421:            $stockData = $buyOrderStockForm->getData();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:430:                BuyOrder: $form->getData(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:432:                originalBuyOrderStatusId: $originalBuyOrderStatusId,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:452:    private function getDetailViewData(DtbBuyOrder $BuyOrder, int $id): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:455:        $BuyOrder->setBuyMainCards(new ArrayCollection(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:456:            $this->buyMainCardRepository->getBuyMainCardsByPurchaseCategory($BuyOrder->getId(), DtbBuyMainCard::SELECT_TYPE)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:459:        $BuyOrder->setBuyOrderIndivisualInputProducts(new ArrayCollection(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:460:            $BuyOrder->getBuyOrderIndivisualInputProductsWithCancelSort()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:463:        $BuyOrder->setBuyOrderStocks(new ArrayCollection(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:464:            $this->buyOrderStockRepository->selectForStockTable($BuyOrder)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:468:            'BuyOrder' => $BuyOrder,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:471:            'Player' => $this->playerRepository->findOneBy(['Customer' => $BuyOrder->getCustomer()]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:472:            'StatusHistories' => $this->buyOrderStatusHistoryRepository->findBy(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:473:                ['BuyOrder' => $BuyOrder],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:476:            'statusList' => $this->buyOrderStatusRepository->getAllStatusName(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:493:        $BuyOrder = $BuyMainCard->getBuyOrder();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:499:            return $this->redirectToRoute('admin_purchase_edit', ['id' => $BuyOrder->getId()]);

codex
候補の設計参照行は実在し、引用の大枠も一致しています。次に実装側の該当行周辺を開き、候補が本当に差分か、別経路で吸収されていないかを確認します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php | sed -n '920,980p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   920	                break;
   921	            default:
   922	                return $this->redirectToRoute('admin_order_edit', ['id' => $TargetOrder->getId()]);
   923	        }
   924	
   925	        $TargetOrder
   926	            ->setMember($this->getMember())
   927	            ->setUpdateDate(new \DateTime());
   928	        $this->entityManager->persist($TargetOrder);
   929	        $this->entityManager->flush();
   930	
   931	        $this->addSuccess('admin.order.save.complete', 'admin');
   932	
   933	        return $this->redirectToRoute('admin_order_edit', ['id' => $TargetOrder->getId()]);
   934	    }
   935	
   936	    /**
   937	     * 受注フォームのポイント関連入力と担当者を受注に反映する.
   938	     *
   939	     * 受注明細・配送・金額が確定した後（PurchaseFlow commit 後）に実行し、
   940	     * 小計や還元率が変わった場合のみ発生ポイントを再計算する。
   941	     */
   942	    private function applyOrderPointAndOperatorFromForm(Order $TargetOrder, Order $OriginOrder, FormInterface $form): void
   943	    {
   944	        $targetSubTotal = (int) $TargetOrder->getSubtotal();
   945	        $pointPercentage = $form->has('pointPercentage')
   946	            ? (int) ($form->get('pointPercentage')->getData() ?? 0)
   947	            : (int) ($TargetOrder->getPointPercentage() ?? 0);
   948	        $spendedPoints = $form->has('spendedPoints')
   949	            ? (int) ($form->get('spendedPoints')->getData() ?? 0)
   950	            : (int) ($TargetOrder->getSpendedPoints() ?? 0);
   951	        $gainedPoints = $form->has('gainedPoints')
   952	            ? (int) ($form->get('gainedPoints')->getData() ?? 0)
   953	            : (int) ($TargetOrder->getGainedPoints() ?? 0);
   954	
   955	        $paymentMethod = $TargetOrder->getPaymentMethod() ?? '';
   956	        if ($TargetOrder->getOrderStatus()?->getId() === OrderStatus::CANCEL) {
   957	            $gainedPoints = 0;
   958	        } elseif (strpos($paymentMethod, Payment::EC_CASH_AND_CARRY_METHOD) === false
   959	            && ($targetSubTotal !== (int) $OriginOrder->getSubtotal()
   960	                || (int) ($OriginOrder->getPointPercentage() ?? 0) !== $pointPercentage)) {
   961	            $taxedBase = $targetSubTotal - $spendedPoints;
   962	            $gainedPoints = $taxedBase > 0 ? (int) floor($taxedBase * $pointPercentage / 100) : 0;
   963	        }
   964	
   965	        $TargetOrder
   966	            ->setMember($this->getMember())
   967	            ->setGainedPoints($gainedPoints)
   968	            ->setSpendedPoints($spendedPoints)
   969	            ->setPointPercentage($pointPercentage);
   970	    }
   971	
   972	    /**
   973	     * 受注編集画面モーダル用の会員検索・商品検索フォームを生成し、それぞれ初期化イベントを送出する.
   974	     *
   975	     * @param Request $request     リクエスト
   976	     * @param Order   $OriginOrder 編集前スナップショット
   977	     * @param Order   $TargetOrder 編集対象の受注
   978	     *
   979	     * @return array{0: FormInterface, 1: FormInterface} [会員検索フォーム, 商品検索フォーム]
   980	     */

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-11_admin_order_order_edit.html | sed -n '260,340p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   260	<h3 id="入力項目">入力項目</h3>
   261	<div class="table-wrap"><table><thead><tr><th>項目名</th><th>必須／任意</th><th>最大長</th><th>初期値</th><th>保存先・扱い</th></tr></thead><tbody><tr><td>受注ステータス</td><td>必須（既存受注のみ表示）</td><td>—</td><td>現行ステータス</td><td>フォームは <code>mapped</code> 偽。POST_SET_DATA で遷移可能な集合に限定。POST_SUBMIT で実体へ反映し、ステートマシンで再検証。</td></tr><tr><td>姓</td><td>必須</td><td>名前 1 フィールドあたり 16 文字（<code>eccube_name_len</code>）、空白不可</td><td>DB 現行値</td><td><code>Order</code> の氏名。</td></tr><tr><td>名</td><td>必須</td><td>同上</td><td>同上</td><td>同上。</td></tr><tr><td>セイ</td><td>必須</td><td>1 フィールドあたり 25 文字（<code>eccube_kana_len</code>）、カタカナ正規表現</td><td>DB 現行値</td><td><code>Order</code> のカナ。入力はひらがなをカタカナへ正規化するサブスクライバがある。</td></tr><tr><td>メイ</td><td>必須</td><td>同上</td><td>同上</td><td>同上。</td></tr><tr><td>会社名</td><td>任意</td><td>255 文字（<code>eccube_stext_len</code>）</td><td>DB 現行値</td><td><code>Order</code>。</td></tr><tr><td>郵便番号（国内 2 分割）</td><td>必須（国内住所時）</td><td>各フィールドは郵便番号用ウィジェットの扱い</td><td>現行郵便番号から分割</td><td><code>mapped</code> 偽。国内国指定時は前半・後半いずれも空ならエラー。成功時は連結して <code>Order.postalCode</code>。</td></tr><tr><td>国外郵便番号</td><td>必須（国外住所時）</td><td>10 文字（<code>eccube_abroad_postal_code_len</code>）</td><td>DB 現行値</td><td>国外国指定時に空ならエラー。</td></tr><tr><td>国</td><td>必須</td><td>—</td><td>DB 現行値</td><td><code>Order</code>。</td></tr><tr><td>都道府県</td><td>必須</td><td>—</td><td>DB 現行値</td><td><code>Order</code> 住所。</td></tr><tr><td>市区町村・番地</td><td>必須</td><td>200 文字（<code>eccube_mtext_len</code>）</td><td>DB 現行値</td><td>同上。</td></tr><tr><td>建物名</td><td>必須</td><td>200 文字</td><td>DB 現行値</td><td>同上。</td></tr><tr><td>建物名（備考）</td><td>任意</td><td>200 文字</td><td>DB 現行値</td><td><code>addr03</code>。</td></tr><tr><td>メールアドレス</td><td>必須</td><td>メール種別＋厳格 RFC チェックは設定 <code>eccube_rfc_email_check</code> による</td><td>DB 現行値</td><td><code>Order</code>。</td></tr><tr><td>電話番号</td><td>任意</td><td>3 分割それぞれ数字のみ、長さは 2～5 桁（<code>eccube_split_tel_len_min</code> / <code>eccube_split_tel_len_max</code>）</td><td>DB 現行値</td><td><code>Order</code>。</td></tr><tr><td>FAX 番号</td><td>任意</td><td>電話番号と同条件</td><td>DB 現行値</td><td><code>Order</code>（フィールド名は fax 系）。</td></tr><tr><td>お問い合わせ</td><td>任意</td><td>3000 文字（<code>eccube_ltext_len</code>）複数行</td><td>DB 現行値</td><td><code>Order.message</code>、<code>rows=8</code>。</td></tr><tr><td>値引き</td><td>必須</td><td>9 桁まで（<code>eccube_int_len</code>）かつ金額レンジ</td><td>0 以上</td><td><code>Order.discount</code>。</td></tr><tr><td>送料</td><td>必須</td><td>同上</td><td>0 以上</td><td><code>Order.delivery_fee_total</code>。</td></tr><tr><td>手数料</td><td>必須</td><td>同上</td><td>0 以上</td><td><code>Order.charge</code>。</td></tr><tr><td>利用ポイント</td><td>必須</td><td>非負整数正規表現、上限 <code>eccube_price_max</code></td><td>DB 現行値</td><td><code>Order.use_point</code>。画面では <code>hidden</code> のみ出力。</td></tr><tr><td>ショップ用メモ</td><td>任意</td><td>3000 文字</td><td>DB 現行値</td><td><code>Order.note</code>。</td></tr><tr><td>変更後お支払方法</td><td>必須</td><td>—</td><td>DB 現行の支払方法</td><td><code>Order.Payment</code>。ラベル表示名は非表示決済には「非表示」ラベルを付与。</td></tr><tr><td>明細コレクション（商品行）</td><td>条件付き必須</td><td>商品名 200 文字、数量は整数長上限、価格は通貨小数と金額上限、税率は 0 以上の数値文字列</td><td>既存明細または追加行</td><td><code>OrderItem</code> 永続化。商品行は価格 0 以上、税・規格・名称は hidden または入力で補完。</td></tr><tr><td>欠品数量</td><td>任意</td><td>0 以上、入力幅は整数長と <code>min=0</code></td><td>0 または DB 欠品</td><td><code>OrderItem.stockout</code>。</td></tr><tr><td>担当者（欠品行）</td><td>—</td><td>—</td><td>既存担当</td><td><code>mapped</code> 偽・無効化。表示専用。</td></tr><tr><td>ポイント還元率（%）</td><td>必須</td><td>9 桁文字長制約に載る整数入力</td><td>0 または DB</td><td><code>Order.pointPercentage</code>。</td></tr><tr><td>ポイント発生</td><td>必須</td><td>非負整数・桁長</td><td>DB</td><td><code>Order.gainedPoints</code>。</td></tr><tr><td>ポイント使用</td><td>必須</td><td>非負整数・桁長</td><td>DB</td><td><code>Order.spendedPoints</code>。</td></tr><tr><td>ポイントエラーメッセージ</td><td>—</td><td>3000 文字</td><td>（画面表示用）</td><td><code>mapped</code> 偽・無効化。</td></tr><tr><td>スマレジメモ</td><td>任意</td><td>3000 文字</td><td>DB 現行値</td><td><code>Order.smaregi_memo</code>。</td></tr><tr><td>会員 ID</td><td>—</td><td>—</td><td>DB 現行の会員</td><td><code>Customer</code> への hidden ID。新規のみ検索モーダル。</td></tr><tr><td>お届け先 氏名・カナ・住所・国・国外郵便番号</td><td>単一配送時は注文者側と同型の必須条件（国内郵便・都道府県・addr01・addr02 必須、電話 3 分割必須）</td><td>注文者と同上限</td><td>DB 現行の先頭配送</td><td><code>Shipping</code> エンティティ（フォームは <code>mapped</code> 偽で別エンティティへ直接バインドする）。</td></tr><tr><td>変更後配送業者</td><td>必須</td><td>—</td><td>先頭配送の業者</td><td><code>Shipping.Delivery</code>。</td></tr><tr><td>お届け日</td><td>任意</td><td>日付ウィジェット下限 0003-01-01</td><td>DB</td><td><code>Shipping.shipping_delivery_date</code>。</td></tr><tr><td>変更後お届け時間</td><td>任意</td><td>—</td><td>既存配送時刻マスタ</td><td><code>DeliveryTime</code> 選択、<code>mapped</code> 偽。POST で名称と <code>timeId</code> を配送へ書く。</td></tr><tr><td>出荷伝票番号</td><td>任意</td><td>200 文字かつ英数字とハイフンのみ</td><td>DB</td><td><code>Shipping.tracking_number</code>。</td></tr><tr><td>配送用ショップメモ</td><td>任意</td><td>3000 文字</td><td>DB</td><td><code>Shipping.note</code>。</td></tr><tr><td>戻りリンク</td><td>—</td><td>—</td><td>空</td><td><code>mapped</code> 偽。確認モーダルで保存後遷移先を入れる。</td></tr></tbody></table></div>
   262	<h3 id="エッジケース">エッジケース</h3>
   263	<div class="table-wrap"><table><thead><tr><th>ケース</th><th>扱い</th></tr></thead><tbody><tr><td>受注 ID なし（新規）</td><td>ステータス変更 UI は出さない。欠品入力はクライアントで拒否する。</td></tr><tr><td>複数配送</td><td>配送サブフォームを建てず、編集は <code>admin_shipping_edit</code> へのリンクのみ。商品明細の新規紐付けも <code>associateOrderAndShipping</code> でスキップされる。</td></tr><tr><td>テンプレが商品以外の <code>OrderItems</code> 行を描画しない</td><td>POST データは商品行中心になりやすい。削除済み扱いや明細再構成の詳細はシステム全体の確認値とする。</td></tr><tr><td><code>return_link</code> がサイト外や解釈不能</td><td>警告ログのうえ編集画面へフォールバック。</td></tr></tbody></table></div>
   264	<hr>
   265	<h2 id="データ整合性">データ整合性</h2>
   266	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>一覧との即時一致</td><td>保存後も検索セッションは自動では無効にならない。一覧再表示は別リクエストの条件に従う。</td></tr><tr><td>会員サマリ</td><td>登録成功かつ会員がいれば購入回数・合計等のサマリ更新を同期的に呼ぶ。</td></tr><tr><td>外部連携</td><td>スマレジコードがある場合、条件を満たす保存で API を呼ぶ失敗はトランザクション例外としてユーザーに見える。</td></tr></tbody></table></div>
   267	<hr>
   268	<h2 id="API-バッチ結果">API/バッチ結果</h2>
   269	<p>本機能は UI からスマレジ API を呼ぶが、リクエスト／レスポンスボディの細目は本書では扱わない。バッチは扱わない。</p>
   270	<hr>
   271	<h2 id="入出力">入出力</h2>
   272	<div class="table-wrap"><table><thead><tr><th>種類</th><th>内容</th></tr></thead><tbody><tr><td>入力</td><td>HTML フォーム、<code>mode</code>、任意の <code>target</code>、<code>csrf</code> トークン、Ajax 時の <code>nonce</code>。</td></tr><tr><td>成功時出力</td><td>302 で編集画面または <code>return_link</code> 解釈先、成功・取消完了等のフラッシュ。</td></tr><tr><td>失敗時出力</td><td>422 相当の再描画またはリダイレクト後フラッシュ、ログへの例外スタック。</td></tr><tr><td>副作用</td><td>DB 更新、欠品履歴、在庫、ポイント、メール履歴は別画面、セッション検索条件。</td></tr></tbody></table></div>
   273	<hr>
   274	<h2 id="DBカラム">DBカラム</h2>
   275	<p>機能に直接関係する列は <code>dtb_order</code>・<code>dtb_shipping</code>・<code>dtb_order_item</code>・欠品履歴・会員購入サマリ等に跨る。型と全列一覧はマイグレーションとエンティティを参照する。</p>
   276	<div class="table-wrap"><table><thead><tr><th>テーブル</th><th>列</th><th>メモ</th></tr></thead><tbody><tr><td><code>dtb_order</code></td><td>代表としてステータス、各種日時、金額系、ポイント系、<code>member_id</code>、<code>base_info_id</code></td><td>更新者・更新日時も保存。</td></tr><tr><td><code>dtb_order_item</code></td><td>数量、価格、税、規格 ID、欠品、種別</td><td>削除行はフォームから外れたものを remove。</td></tr><tr><td><code>dtb_shipping</code></td><td>住所、配送業者、追跡番号、出荷日</td><td>単一配送フォームから更新対象。</td></tr><tr><td>欠品履歴</td><td>欠品数、規格、受注、担当者</td><td>差分があるとき insert 予定。</td></tr></tbody></table></div>
   277	<h3 id="DB操作">DB操作</h3>
   278	<p>永続化の正は ec-cube-enterprise（テーブル名・操作は ec-cube-enterprise を正典）。当ドメインは承認ワークフローを介さず persist/flush で直接確定する（承認ワークフローは在庫機能固有）。</p>
   279	<div class="table-wrap"><table><thead><tr><th>操作種別</th><th>対象テーブル</th><th>契機・条件</th></tr></thead><tbody><tr><td>登録/更新</td><td>dtb_order / dtb_order_item / dtb_shipping</td><td>当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。</td></tr></tbody></table></div>
   280	<hr>
   281	<h2 id="バリデーション">バリデーション</h2>
   282	<p>Symfony フォーム制約に加え、POST_SUBMIT で以下を行う。</p>
   283	<div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>受注ステータス</td><td>変更時はステートマシンで遷移可否を再判定し、不可ならフォームエラー。</td></tr><tr><td>商品明細件数</td><td>商品種別が 1 未満ならエラー。</td></tr><tr><td>配送（単一時）</td><td>電話必須、国内郵便番号必須、国外時は国外郵便番号必須。</td></tr><tr><td>明細行の金額符号</td><td>種別ごとに価格・数量の不等号を検証インターフェースへ渡す。</td></tr></tbody></table></div>
   284	<hr>
   285	<h2 id="権限・認可">権限・認可</h2>
   286	<div class="table-wrap"><table><thead><tr><th>利用者状態</th><th>画面・操作</th></tr></thead><tbody><tr><td>未ログイン（管理者）</td><td>管理ログインへ誘導（ファイアウォール既定）。</td></tr><tr><td>ログイン済み管理者</td><td>編集画面と関連 XHR、納品書出力へ到達可とする。細かいロール制約は本リポジトリの <code>security.yaml</code> にアクセス制御一覧が無いため、権限制御プラグインやサーバ設定がある場合は別途確認する。</td></tr></tbody></table></div>
   287	<hr>
   288	<h2 id="画面遷移">画面遷移</h2>
   289	<div class="table-wrap"><table><thead><tr><th>条件</th><th>遷移先</th></tr></thead><tbody><tr><td>保存成功、<code>return_link</code> 解釈可</td><td>解釈された内部ルート</td></tr><tr><td>保存成功、上記以外</td><td><code>m05-11_admin_order_order_edit</code> 同一 ID</td></tr><tr><td>受注一覧／一覧再開リンク</td><td><code>admin_order</code> または <code>admin_order_page</code>（セッションのページ番号）</td></tr><tr><td>配送編集（複数・単一の導線）</td><td><code>admin_shipping_edit</code>（未保存警告モーダル経由可）</td></tr><tr><td>メール作成</td><td><code>m05-15_admin_order_order_mail</code></td></tr><tr><td>納品書印刷</td><td><code>admin_order_print_delivery_slips</code> を新窓</td></tr></tbody></table></div>
   290	<h3 id="遷移時に引き継ぐ状態">遷移時に引き継ぐ状態</h3>
   291	<div class="table-wrap"><table><thead><tr><th>起点</th><th>遷移前の処理</th><th>遷移後の初期状態</th></tr></thead><tbody><tr><td>未保存のまま別画面へ移る確認モーダルで保存を選ぶ</td><td><code>return_link</code> と隠し <code>mode=register</code> を付与して submit</td><td>保存成功なら <code>return_link</code> 先、失敗なら編集画面にエラー</td></tr><tr><td>会員／商品検索モーダル</td><td>POST 条件をセッションキーへ保存</td><td>次ページ GET は同条件を読み戻す</td></tr></tbody></table></div>
   292	<hr>
   293	<h2 id="エラー処理">エラー処理</h2>
   294	<div class="table-wrap"><table><thead><tr><th>エラー内容</th><th>処理</th></tr></thead><tbody><tr><td>受注不存在</td><td>HTTP 404（編集 GET）。</td></tr><tr><td>Ajax CSRF／非 XHR</td><td>会員検索は HTTP 400、商品検索は空配列応答の実装。</td></tr><tr><td>明細再計算・検証例外</td><td>メッセージをフラッシュし、同一編集画面を再表示。</td></tr><tr><td>ステータス遷移不可</td><td>短い管理メッセージとログ。</td></tr></tbody></table></div>
   295	<hr>
   296	<h2 id="試行制限">試行制限</h2>
   297	<p>本機能ではフィールド単位の試行制限は設けない。管理ログインのスロットリングは管理画面ファイアウォール共通。</p>
   298	<hr>
   299	<h2 id="ログ・監査">ログ・監査</h2>
   300	<div class="table-wrap"><table><thead><tr><th>タイミング</th><th>記録内容</th></tr></thead><tbody><tr><td>登録開始／完了</td><td>情報ログに受注 ID。</td></tr><tr><td>ステータス遷移失敗</td><td>エラーログに例外内容。</td></tr><tr><td><code>return_link</code> 不正</td><td>警告ログにメッセージ。</td></tr></tbody></table></div>
   301	<h3 id="ログに出してはいけないもの">ログに出してはいけないもの</h3>
   302	<ul><li>パスワード</li><li>なりすまし対策トークン</li><li>Cookie 値</li><li>セッション ID の完全値</li><li>Remember Me トークンの原値</li></ul>
   303	<hr>
   304	<h2 id="セッション">セッション</h2>
   305	<h3 id="本機能におけるセッション">本機能におけるセッション</h3>
   306	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>会員検索</td><td><code>eccube.admin.order.customer.search</code> と <code>...page_no</code> を更新する。</td></tr><tr><td>商品検索</td><td><code>eccube.admin.order.product.search</code> と <code>...page_no</code> を更新する。</td></tr><tr><td>一覧戻り</td><td><code>eccube.admin.order.search.page_no</code> を読んでページリンクを組み立てる。</td></tr></tbody></table></div>
   307	<h3 id="セッションへ保存しない情報">セッションへ保存しない情報</h3>
   308	<ul><li>カード番号など決済の機微情報は当機能の検索条件に載せない。</li></ul>
   309	<hr>
   310	<h2 id="Cookie">Cookie</h2>
   311	<p>管理画面セッション Cookie および Remember Me の名称は環境設定に従う。当機能が独自 Cookie を追加しない。</p>
   312	<hr>
   313	<h2 id="排他制御・トランザクション">排他制御・トランザクション</h2>
   314	<p>登録とステータス更新の本体はラップドトランザクション内で実施する。在庫処理は悲観ロック等を含みうる。編集画面同士の楽観ロック UUID は当画面では持たない。</p>
   315	<hr>
   316	<h2 id="調査補助">調査補助</h2>
   317	<p>実装追跡用に、起点 PHP パスは <code>src/Eccube/Controller/Admin/Order/EditController.php</code>、テンプレートは <code>src/Eccube/Resource/template/admin/Order/edit.twig</code>、フォームは <code>src/Eccube/Form/Type/Admin/OrderType.php</code> および <code>ShippingType.php</code> / <code>OrderItemType.php</code> を参照する。</p>
   318	<h3 id="HTTPルート名とパス-コード探索用・旧入口節より退避">HTTPルート名とパス（コード探索用・旧入口節より退避）</h3>
   319	<ul><li><code>m05-11_admin_order_order_edit</code> … <code>GET, POST</code> … <code>/{admin_route}/order/{id}/edit</code>（既存受注の編集画面表示、フォーム送信による再表示・登録・ステータス変更・日付クリア。<code>id</code> は 1 桁以上の数字。）</li><li><code>admin_order_search_customer_html</code> … <code>GET, POST</code> … <code>/{admin_route}/order/search/customer/html</code>（編集画面モーダルからの会員検索。XMLHttpRequest かつ CSRF 検証に成功すると HTML 断片を返す。）</li><li><code>admin_order_search_customer_html_page</code> … <code>GET, POST</code> … <code>/{admin_route}/order/search/customer/html/page/{page_no}</code>（同上のページング。<code>page_no</code> は数字。）</li><li><code>admin_order_search_customer_by_id</code> … <code>POST</code> … <code>/{admin_route}/order/search/customer/id</code>（会員 ID 指定の会員情報 JSON。XMLHttpRequest かつ CSRF 検証に成功しないと HTTP 400。）</li><li><code>admin_search_product</code> … <code>GET, POST</code> … <code>/{admin_route}/search/product</code>（編集画面の商品追加モーダルからの商品検索。XMLHttpRequest かつ CSRF 検証に成功すると HTML 断片を返す。トークン不一致や非 XHR では空配列を返す実装である。）</li><li><code>admin_search_product_page</code> … <code>GET, POST</code> … <code>/{admin_route}/search/product/page/{page_no}</code>（同上のページング。）</li><li><code>admin_order_search_order_item_type</code> … <code>POST</code> … <code>/{admin_route}/order/search/order_item_type</code>（「その他明細」モーダル用の手数料・送料・値引きの組み合わせ一覧 HTML。XMLHttpRequest かつ CSRF 検証が前提。）</li><li><code>admin_order_print_delivery_slips</code> … <code>GET</code> … <code>/{admin_route}/order/{id}/print/delivery</code>（納品書印刷用の別画面レンダリング。配送が1件も無い受注はHTTP404。）</li></ul>
   320	      <footer>このページは機能仕様書Markdownから自動生成されています。編集は元のMarkdownに対して行ってください。</footer>
   321	    </main>
   322	  </div>
   323	</body>
   324	</html>

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php | sed -n '680,880p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   680	                    $gainPointJob = $this->smaregiOrderGainPointEventService->registerGainPointJob($TargetOrder);
   681	                }
   682	
   683	                if ($TargetOrder->getSmaregiCode()
   684	                    && $TargetOrder->getOrderStatus() !== null
   685	                    && $TargetOrder->getOrderStatus()->getId() !== OrderStatus::CANCEL) {
   686	                    $this->smaregiApiService->postSmaregiProcess($TargetOrder, ['product']);
   687	                }
   688	                // wrapInTransaction が成功時に最終 flush + DB commit する（失敗時は rollback）
   689	            });
   690	        } catch (PurchaseException $e) {
   691	            $this->addError($e->getMessage(), 'admin');
   692	
   693	            return null;
   694	        } catch (ShoppingException $e) {
   695	            $this->addError($e->getMessage(), 'admin');
   696	
   697	            return null;
   698	        } catch (\InvalidArgumentException $e) {
   699	            log_error('受注ステータス遷移に失敗しました', ['exception' => $e]);
   700	            $old = $OriginOrder->getOrderStatus();
   701	            $new = $TargetOrder->getOrderStatus();
   702	            $this->addError(trans('admin.order.failed_to_change_status__short', [
   703	                '%from%' => $old?->getName() ?? '-',
   704	                '%to%' => $new?->getName() ?? '-',
   705	            ]), 'admin');
   706	
   707	            return null;
   708	        }
   709	
   710	        // 受注確定の commit 成功後に発生ポイント連携メッセージを送信する（アウトボックス的な順序）。
   711	        if ($gainPointJob !== null) {
   712	            $this->smaregiOrderGainPointEventService->dispatchGainPointMessage($gainPointJob, $TargetOrder);
   713	        }
   714	
   715	        $Customer = $TargetOrder->getCustomer();
   716	
   717	        $event = new EventArgs(
   718	            [
   719	                'form' => $form,
   720	                'OriginOrder' => $OriginOrder,
   721	                'TargetOrder' => $TargetOrder,
   722	                'Customer' => $Customer,
   723	            ],
   724	            $request
   725	        );
   726	        $this->eventDispatcher->dispatch($event, EccubeEvents::ADMIN_ORDER_EDIT_INDEX_COMPLETE);
   727	
   728	        $newStatusId = $TargetOrder->getOrderStatus()?->getId();
   729	        $isPartCancel = $this->isPartCancel($TargetOrder, $OriginOrder);
   730	        if ($newStatusId === OrderStatus::CANCEL) {
   731	            $this->addSuccess('admin.order.cancel.complete', 'admin');
   732	        } elseif ($isPartCancel) {
   733	            $this->addSuccess('admin.order.part_cancel.complete', 'admin');
   734	        } else {
   735	            $this->addSuccess('admin.order.save.complete', 'admin');
   736	        }
   737	
   738	        log_info('受注登録完了', [$TargetOrder->getId()]);
   739	
   740	        if ($returnLink = $form->get('return_link')->getData()) {
   741	            try {
   742	                $pattern = '/^'.preg_quote($request->getBasePath(), '/').'/';
   743	                $returnLink = preg_replace($pattern, '', (string) $returnLink);
   744	                $result = $router->match($returnLink);
   745	                $params = array_filter($result, fn ($key) => !str_starts_with((string) $key, '_'), ARRAY_FILTER_USE_KEY);
   746	
   747	                return $this->redirectToRoute($result['_route'], $params);
   748	            } catch (\Exception) {
   749	                log_warning('URLの形式が不正です。');
   750	            }
   751	        }
   752	
   753	        return $this->redirectToRoute('admin_order_edit', ['id' => $TargetOrder->getId()]);
   754	    }
   755	
   756	    /**
   757	     * 「ステータス更新」押下時の確定処理。ステータス遷移と日付更新のみを行う.
   758	     */
   759	    private function tryCommitOrderStatusChange(Order $TargetOrder, Order $OriginOrder, FormInterface $form): RedirectResponse
   760	    {
   761	        $prevStatusId = $OriginOrder->getOrderStatus()?->getId();
   762	        $newStatusId = $TargetOrder->getOrderStatus()?->getId();
   763	
   764	        if ($prevStatusId === null || $newStatusId === null || $prevStatusId === $newStatusId) {
   765	            return $this->redirectToRoute('admin_order_edit', ['id' => $TargetOrder->getId()]);
   766	        }
   767	
   768	        if (!$form->isValid()) {
   769	            return $this->redirectToRoute('admin_order_edit', ['id' => $TargetOrder->getId()]);
   770	        }
   771	
   772	        $now = new \DateTime();
   773	        $statusChangedToDelivered = $newStatusId === OrderStatus::DELIVERED && $prevStatusId !== OrderStatus::DELIVERED;
   774	
   775	        if ($statusChangedToDelivered) {
   776	            $TargetOrder->setShippingDate($now);
   777	            foreach ($TargetOrder->getShippings() as $Shipping) {
   778	                $Shipping->setShippingDate($now);
   779	            }
   780	        }
   781	        $isFirstCancellation = $newStatusId === OrderStatus::CANCEL && $prevStatusId !== OrderStatus::CANCEL && $TargetOrder->getCancelDate() === null;
   782	        if ($isFirstCancellation) {
   783	            $TargetOrder->setCancelDate($now);
   784	        }
   785	        if ($newStatusId === OrderStatus::PAID && $prevStatusId !== OrderStatus::PAID && $TargetOrder->getPaymentDate() === null) {
   786	            $TargetOrder->setPaymentDate($now);
   787	        }
   788	        if ($newStatusId === OrderStatus::PICKING && $prevStatusId !== OrderStatus::PICKING && $TargetOrder->getConfirmDate() === null) {
   789	            $TargetOrder->setConfirmDate($now);
   790	        }
   791	
   792	        $OldOrderStatus = $OriginOrder->getOrderStatus();
   793	        $NewOrderStatus = $TargetOrder->getOrderStatus();
   794	        if ($OldOrderStatus !== null && $NewOrderStatus !== null) {
   795	            $TargetOrder->setOrderStatus($OldOrderStatus);
   796	        }
   797	
   798	        $gainPointJob = null;
   799	        $this->entityManager->wrapInTransaction(function () use ($TargetOrder, $statusChangedToDelivered, $isFirstCancellation, $OldOrderStatus, $NewOrderStatus, &$gainPointJob): void {
   800	            if ($OldOrderStatus !== null && $NewOrderStatus !== null) {
   801	                $this->orderStateMachine->apply($TargetOrder, $NewOrderStatus);
   802	            }
   803	
   804	            $TargetOrder
   805	                ->setMember($this->getMember())
   806	                ->setUpdateDate(new \DateTime());
   807	            $this->entityManager->persist($TargetOrder);
   808	
   809	            // 新たに出荷完了になった場合、ポイントを付加
   810	            if ($statusChangedToDelivered) {
   811	                $this->pointService->gainPoints($TargetOrder);
   812	                // 発生ポイントのスマレジ連携ジョブを同一トランザクションで積む（dispatch は commit 後）.
   813	                $gainPointJob = $this->smaregiOrderGainPointEventService->registerGainPointJob($TargetOrder);
   814	            }
   815	            if ($isFirstCancellation) {
   816	                $this->pointService->cancelOrderPoints($TargetOrder);
   817	            }
   818	
   819	            if ($TargetOrder->getSmaregiCode()
   820	                && $TargetOrder->getOrderStatus() !== null
   821	                && $TargetOrder->getOrderStatus()->getId() !== OrderStatus::CANCEL) {
   822	                $this->smaregiApiService->postSmaregiProcess($TargetOrder, ['product']);
   823	            }
   824	        });
   825	
   826	        // 受注確定の commit 成功後に発生ポイント連携メッセージを送信する（アウトボックス的な順序）。
   827	        if ($gainPointJob !== null) {
   828	            $this->smaregiOrderGainPointEventService->dispatchGainPointMessage($gainPointJob, $TargetOrder);
   829	        }
   830	
   831	        if ($newStatusId === OrderStatus::CANCEL) {
   832	            $this->addSuccess('admin.order.cancel.complete', 'admin');
   833	        } else {
   834	            $this->addSuccess('admin.order.save.complete', 'admin');
   835	        }
   836	
   837	        return $this->redirectToRoute('admin_order_edit', ['id' => $TargetOrder->getId()]);
   838	    }
   839	
   840	    /**
   841	     * 商品規格ごとの数量差分から一部キャンセルかどうかを判定する.
   842	     */
   843	    private function isPartCancel(Order $TargetOrder, Order $OriginOrder): bool
   844	    {
   845	        $fromQuantities = $this->getProductQuantitiesByProductClass($OriginOrder);
   846	        $toQuantities = $this->getProductQuantitiesByProductClass($TargetOrder);
   847	
   848	        foreach (array_unique(array_merge(array_keys($fromQuantities), array_keys($toQuantities))) as $classId) {
   849	            $diff = bcsub($toQuantities[$classId] ?? '0', $fromQuantities[$classId] ?? '0', 0);
   850	            if (bccomp($diff, '0', 0) === 0) {
   851	                continue;
   852	            }
   853	            if (bccomp($diff, '0', 0) < 0 && isset($fromQuantities[$classId])) {
   854	                return true;
   855	            }
   856	        }
   857	
   858	        return false;
   859	    }
   860	
   861	    /**
   862	     * @return array<int, string> 商品規格IDをキーとした商品明細数量の合計
   863	     */
   864	    private function getProductQuantitiesByProductClass(Order $Order): array
   865	    {
   866	        $quantities = [];
   867	        foreach ($Order->getOrderItems() as $OrderItem) {
   868	            if (!$OrderItem->isProduct()) {
   869	                continue;
   870	            }
   871	            $classId = $OrderItem->getProductClass()?->getId();
   872	            if ($classId === null) {
   873	                continue;
   874	            }
   875	            $quantities[$classId] = isset($quantities[$classId])
   876	                ? bcadd($quantities[$classId], $OrderItem->getQuantity(), 0)
   877	                : $OrderItem->getQuantity();
   878	        }
   879	
   880	        return $quantities;

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php | sed -n '480,680p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   480	     * @param FormInterface                   $form            バインド済み受注フォーム
   481	     * @param FormBuilderInterface            $builder         イベント引数用（progress イベント）
   482	     * @param Order                           $TargetOrder     編集対象の受注
   483	     * @param Order                           $OriginOrder     編集前スナップショット
   484	     * @param ArrayCollection<int, OrderItem> $OriginItems     編集前に存在した明細（削除済み明細の remove 用）
   485	     * @param PurchaseContext                 $purchaseContext PurchaseFlowコンテキスト
   486	     *
   487	     * @return RedirectResponse|null 登録完了してリダイレクトするときのみ Response。再表示のときは null
   488	     */
   489	    private function handleSubmittedOrderEdit(
   490	        Request $request,
   491	        RouterInterface $router,
   492	        FormInterface $form,
   493	        FormBuilderInterface $builder,
   494	        Order $TargetOrder,
   495	        Order $OriginOrder,
   496	        ArrayCollection $OriginItems,
   497	        PurchaseContext $purchaseContext,
   498	    ): ?RedirectResponse {
   499	        if (!$form->isSubmitted() || !$form['OrderItems']->isValid()) {
   500	            return null;
   501	        }
   502	
   503	        if ($request->get('mode') === 'status_change') {
   504	            return $this->tryCommitOrderStatusChange($TargetOrder, $OriginOrder, $form);
   505	        }
   506	
   507	        if ($request->get('mode') === 'clear_date') {
   508	            return $this->tryClearOrderDate($request, $TargetOrder);
   509	        }
   510	
   511	        $event = new EventArgs(
   512	            [
   513	                'builder' => $builder,
   514	                'OriginOrder' => $OriginOrder,
   515	                'TargetOrder' => $TargetOrder,
   516	                'PurchaseContext' => $purchaseContext,
   517	            ],
   518	            $request
   519	        );
   520	        $this->eventDispatcher->dispatch($event, EccubeEvents::ADMIN_ORDER_EDIT_INDEX_PROGRESS);
   521	
   522	        $rollbackStockoutChanges = $this->applyStockoutChangesBeforeOrderPurchaseFlowValidate($TargetOrder, $OriginOrder);
   523	
   524	        $rollbackTemporaryItems = $this->appendTemporaryFinancialOrderItemsForFlow($TargetOrder);
   525	        try {
   526	            $flowResult = $this->orderPurchaseFlow->validate($TargetOrder, $purchaseContext);
   527	        } finally {
   528	            $rollbackTemporaryItems();
   529	        }
   530	
   531	        if ($flowResult->hasWarning()) {
   532	            foreach ($flowResult->getWarning() as $warning) {
   533	                $this->addWarning($warning->getMessage(), 'admin');
   534	            }
   535	        }
   536	
   537	        if ($flowResult->hasError()) {
   538	            $rollbackStockoutChanges();
   539	            foreach ($flowResult->getErrors() as $error) {
   540	                $this->addError($error->getMessage(), 'admin');
   541	            }
   542	        }
   543	
   544	        if ($request->get('mode') === 'register') {
   545	            return $this->tryCommitOrderRegister($request, $router, $form, $TargetOrder, $OriginOrder, $OriginItems, $purchaseContext, $flowResult);
   546	        }
   547	
   548	        return null;
   549	    }
   550	
   551	    /**
   552	     * 「登録」ボタン（`mode=register`）押下時の確定処理。PurchaseFlow prepare/commit、ステータス遷移、永続化、リダイレクトまでを行う.
   553	     *
   554	     * @param Request                         $request         リクエスト（`return_link` 等）
   555	     * @param RouterInterface                 $router          `return_link` のルート解決
   556	     * @param FormInterface                   $form            受注フォーム
   557	     * @param Order                           $TargetOrder     保存対象の受注
   558	     * @param Order                           $OriginOrder     編集前スナップショット（ステータス比較等）
   559	     * @param ArrayCollection<int, OrderItem> $OriginItems     編集前明細。フォームから外れた明細を remove するために使用
   560	     * @param PurchaseContext                 $purchaseContext PurchaseFlowコンテキスト
   561	     * @param PurchaseFlowResult              $flowResult      直前の validate 結果（エラー時は処理しない）
   562	     *
   563	     * @return RedirectResponse|null 検証エラー・PurchaseFlow 例外・ステートマシン例外時は null（画面再表示）
   564	     */
   565	    private function tryCommitOrderRegister(
   566	        Request $request,
   567	        RouterInterface $router,
   568	        FormInterface $form,
   569	        Order $TargetOrder,
   570	        Order $OriginOrder,
   571	        ArrayCollection $OriginItems,
   572	        PurchaseContext $purchaseContext,
   573	        PurchaseFlowResult $flowResult,
   574	    ): ?RedirectResponse {
   575	        log_info('受注登録開始', [$TargetOrder->getId()]);
   576	
   577	        if ($flowResult->hasError() || !$form->isValid()) {
   578	            return null;
   579	        }
   580	
   581	        foreach ($TargetOrder->getShippings() as $Shipping) {
   582	            $Shipping->setBaseInfo($TargetOrder->getBaseInfo());
   583	        }
   584	        foreach ($TargetOrder->getOrderItems() as $OrderItem) {
   585	            $OrderItem->setBaseInfo($TargetOrder->getBaseInfo());
   586	        }
   587	
   588	        $gainPointJob = null;
   589	
   590	        try {
   591	            // StockDiffProcessor 等が悲観ロックを使うため、prepare/commit から永続化まで同一 DB トランザクション内で行う
   592	            $this->entityManager->wrapInTransaction(function () use ($TargetOrder, $OriginOrder, $OriginItems, $purchaseContext, $form, &$gainPointJob): void {
   593	                $rollbackTemporaryItems = $this->appendTemporaryFinancialOrderItemsForFlow($TargetOrder);
   594	                try {
   595	                    $this->orderPurchaseFlow->prepare($TargetOrder, $purchaseContext);
   596	                    $this->orderPurchaseFlow->commit($TargetOrder, $purchaseContext);
   597	                } finally {
   598	                    $rollbackTemporaryItems();
   599	                }
   600	
   601	                // prepare/commit 後に差し替えられた明細等へ店舗を再付与（新規受注 flush 時の base_info_id NOT NULL 対策）
   602	                $baseInfo = $TargetOrder->getBaseInfo();
   603	                foreach ($TargetOrder->getShippings() as $Shipping) {
   604	                    $Shipping->setBaseInfo($baseInfo);
   605	                    foreach ($Shipping->getOrderItems() as $item) {
   606	                        if ($item instanceof OrderItem) {
   607	                            $item->setBaseInfo($baseInfo);
   608	                        }
   609	                    }
   610	                }
   611	                foreach ($TargetOrder->getOrderItems() as $OrderItem) {
   612	                    $OrderItem->setBaseInfo($baseInfo);
   613	                }
   614	
   615	                $OldOrderStatus = $OriginOrder->getOrderStatus();
   616	                $NewOrderStatus = $TargetOrder->getOrderStatus();
   617	
   618	                $statusChangedToDelivered = false;
   619	                if ($TargetOrder->getId() && $OldOrderStatus->getId() !== $NewOrderStatus->getId()) {
   620	                    $statusChangedToDelivered = $NewOrderStatus->getId() === OrderStatus::DELIVERED;
   621	                    $statusChangedToCancel = $NewOrderStatus->getId() === OrderStatus::CANCEL;
   622	
   623	                    if ($statusChangedToDelivered) {
   624	                        $TargetOrder->getShippings()->map(function (Shipping $Shipping): void {
   625	                            if (!$Shipping->isShipped()) {
   626	                                $Shipping->setShippingDate(new \DateTime());
   627	                            }
   628	                        });
   629	                    }
   630	                    $isFirstCancellation = $statusChangedToCancel && $TargetOrder->getCancelDate() === null;
   631	                    if ($isFirstCancellation) {
   632	                        $TargetOrder->setCancelDate(new \DateTime());
   633	                    }
   634	                    $TargetOrder->setOrderStatus($OldOrderStatus);
   635	                    $this->orderStateMachine->apply($TargetOrder, $NewOrderStatus);
   636	                    if ($isFirstCancellation) {
   637	                        $this->pointService->cancelOrderPoints($TargetOrder);
   638	                    }
   639	                }
   640	
   641	                $now = new \DateTime();
   642	                if ($TargetOrder->getId() === null) {
   643	                    $TargetOrder->setCreateDate($now);
   644	                    $TargetOrder->setUpdateDate($now);
   645	
   646	                    foreach ($TargetOrder->getShippings() as $Shipping) {
   647	                        if ($Shipping->getId() === null) {
   648	                            $Shipping->setCreateDate($now);
   649	                            $Shipping->setUpdateDate($now);
   650	                        }
   651	                    }
   652	                } else {
   653	                    $TargetOrder->setUpdateDate($now);
   654	                }
   655	
   656	                $this->entityManager->persist($TargetOrder);
   657	                // IDENTITY の場合、新規受注は OrderNoProcessor が PK を参照するため同一トランザクション内で 1 回 flush が必要
   658	                if ($TargetOrder->getId() === null) {
   659	                    $this->entityManager->flush();
   660	                }
   661	
   662	                foreach ($OriginItems as $OrderItem) {
   663	                    if (!$TargetOrder->getOrderItems()->contains($OrderItem)) {
   664	                        $this->entityManager->remove($OrderItem);
   665	                    }
   666	                }
   667	
   668	                $this->orderNoProcessor->process($TargetOrder, $purchaseContext);
   669	
   670	                $Customer = $TargetOrder->getCustomer();
   671	                if ($Customer instanceof Customer) {
   672	                    $this->orderRepository->updateOrderSummary($Customer);
   673	                }
   674	                $this->applyOrderPointAndOperatorFromForm($TargetOrder, $OriginOrder, $form);
   675	
   676	                // 新たに出荷完了へ遷移した場合、確定後の発生ポイント（applyOrderPointAndOperatorFromForm 反映後の最終値）を
   677	                // 会員残高へ反映し、同一トランザクションでスマレジ連携ジョブを積む（dispatch は commit 後）.
   678	                if ($statusChangedToDelivered) {
   679	                    $this->pointService->gainPoints($TargetOrder);
   680	                    $gainPointJob = $this->smaregiOrderGainPointEventService->registerGainPointJob($TargetOrder);

codex
実装側では候補5件の参照行はいずれも存在します。見落とし確認のため、同じコントローラの前半、日付クリア、補助メソッド、関連フォームの差分が出やすい箇所を追加で見ます。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php | sed -n '240,480p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   240	    /**
   241	     * 受注フォーム組み立て直後の拡張ポイント。{@see EccubeEvents} `ADMIN_ORDER_EDIT_INDEX_INITIALIZE` を送出する.
   242	     *
   243	     * @param FormBuilderInterface $builder     `OrderType` のフォームビルダ
   244	     * @param Order                $OriginOrder 編集前スナップショット（クローン）
   245	     * @param Order                $TargetOrder 編集対象の受注
   246	     * @param Request              $request     リクエスト
   247	     */
   248	    private function dispatchOrderEditIndexInitialize(FormBuilderInterface $builder, Order $OriginOrder, Order $TargetOrder, Request $request): void
   249	    {
   250	        $event = new EventArgs(
   251	            [
   252	                'builder' => $builder,
   253	                'OriginOrder' => $OriginOrder,
   254	                'TargetOrder' => $TargetOrder,
   255	            ],
   256	            $request
   257	        );
   258	        $this->eventDispatcher->dispatch($event, EccubeEvents::ADMIN_ORDER_EDIT_INDEX_INITIALIZE);
   259	    }
   260	
   261	    /**
   262	     * 商品明細行のフォーム初期表示用データをセットし、Twig 用の数量・欠品・価格差異マップを組み立てる.
   263	     *
   264	     * @param FormInterface $form `OrderType` のフォーム（`OrderItems` サブフォームを持つ）
   265	     *
   266	     * @return array{arrQuantity: array<int, int>, arrStockout: array<int, int>, arrDifferentPrice: array<int, string>}
   267	     *               キーはいずれも product_class_id => 値
   268	     */
   269	    private function presetOrderItemRowsForDisplay(FormInterface $form): array
   270	    {
   271	        $arrQuantity = [];
   272	        $arrStockout = [];
   273	        $arrDifferentPrice = [];
   274	
   275	        foreach ($form->get('OrderItems') as $OrderItemForm) {
   276	            $OrderItem = $OrderItemForm->getData();
   277	            if (!$OrderItem instanceof OrderItem || !$OrderItem->isProduct()) {
   278	                continue;
   279	            }
   280	            $ProductClass = $OrderItem->getProductClass();
   281	            if ($ProductClass === null) {
   282	                continue;
   283	            }
   284	
   285	            $OrderItemForm->get('stockout')->setData($OrderItem->getStockout() ?? 0);
   286	            $classId = $ProductClass->getId();
   287	            if (null !== $classId) {
   288	                $arrQuantity[$classId] = (int) $OrderItem->getQuantity();
   289	                $arrStockout[$classId] = $OrderItem->getStockout() ?? 0;
   290	                if ($OrderItem->getPrice() !== $ProductClass->getPrice02()) {
   291	                    $arrDifferentPrice[$classId] = $OrderItem->getProductName();
   292	                }
   293	            }
   294	            $OrderItemForm->get('operator')->setData($OrderItem->getMember());
   295	            $DtbShelfNumber = $ProductClass->getShelfNumber();
   296	            if (null !== $DtbShelfNumber && $DtbShelfNumber->getName() !== '') {
   297	                $OrderItemForm->get('shelfNumber')->setData($DtbShelfNumber->getName());
   298	            }
   299	        }
   300	
   301	        return [
   302	            'arrQuantity' => $arrQuantity,
   303	            'arrStockout' => $arrStockout,
   304	            'arrDifferentPrice' => $arrDifferentPrice,
   305	        ];
   306	    }
   307	
   308	    /**
   309	     * 明細ごとに税表示タイプが未設定のとき、明細種別に応じたデフォルトを {@see OrderHelper::getTaxDisplayType} で補完する.
   310	     *
   311	     * @param Order $TargetOrder 編集対象の受注
   312	     */
   313	    private function ensureTaxDisplayTypesOnOrderItems(Order $TargetOrder): void
   314	    {
   315	        foreach ($TargetOrder->getOrderItems() as $OrderItem) {
   316	            if ($OrderItem->getTaxDisplayType() !== null) {
   317	                continue;
   318	            }
   319	            $orderItemType = $OrderItem->getOrderItemType();
   320	            if ($orderItemType === null) {
   321	                continue;
   322	            }
   323	            $OrderItem->setTaxDisplayType($this->orderHelper->getTaxDisplayType($orderItemType));
   324	        }
   325	    }
   326	
   327	    /**
   328	     * Order に入力された送料/手数料/値引きを PurchaseFlow 計算用の一時明細へ変換する.
   329	     *
   330	     * 管理画面では discount はフォーム入力値をそのまま一時明細に載せる（order フローでは PointProcessor が POINT 明細を作らない）.
   331	     *
   332	     * @return \Closure 追加した一時明細を取り除くロールバック
   333	     */
   334	    private function appendTemporaryFinancialOrderItemsForFlow(Order $TargetOrder): \Closure
   335	    {
   336	        $temporaryItems = [];
   337	
   338	        $taxation = $this->entityManager->find(TaxType::class, TaxType::TAXATION);
   339	        if ($taxation === null) {
   340	            return static fn () => null;
   341	        }
   342	
   343	        $nonTaxable = $this->entityManager->find(TaxType::class, TaxType::NON_TAXABLE);
   344	
   345	        $appendItem = function (int $typeId, string $price, ?Shipping $Shipping = null, ?TaxType $itemTaxType = null) use ($TargetOrder, $taxation, &$temporaryItems): void {
   346	            if (bccomp($price, '0', 2) === 0) {
   347	                return;
   348	            }
   349	
   350	            $OrderItemType = $this->OrderItemTypeRepository->find($typeId);
   351	            if ($OrderItemType === null) {
   352	                return;
   353	            }
   354	
   355	            $OrderItem = (new OrderItem())
   356	                ->setProductName($OrderItemType->getName())
   357	                ->setQuantity('1')
   358	                ->setPrice($price)
   359	                ->setBaseInfo($TargetOrder->getBaseInfo())
   360	                ->setOrderItemType($OrderItemType)
   361	                ->setOrder($TargetOrder)
   362	                ->setTaxDisplayType($this->orderHelper->getTaxDisplayType($OrderItemType))
   363	                ->setTaxType($itemTaxType ?? $taxation)
   364	                ->setProcessorName(self::TEMP_ORDER_ITEM_PROCESSOR_NAME);
   365	
   366	            if ($Shipping !== null) {
   367	                $OrderItem->setShipping($Shipping);
   368	                $Shipping->addOrderItem($OrderItem);
   369	            }
   370	
   371	            $TargetOrder->addOrderItem($OrderItem);
   372	            $temporaryItems[] = $OrderItem;
   373	        };
   374	
   375	        $shipping = $TargetOrder->getShippings()->first();
   376	        $appendItem(OrderItemType::DELIVERY_FEE, (string) $TargetOrder->getDeliveryFeeTotal(), $shipping instanceof Shipping ? $shipping : null);
   377	        $appendItem(OrderItemType::CHARGE, (string) $TargetOrder->getCharge());
   378	
   379	        $discount = (string) $TargetOrder->getDiscount();
   380	        if (bccomp($discount, '0', 2) === 1) {
   381	            $appendItem(OrderItemType::DISCOUNT, bcmul($discount, '-1', 2), null, $nonTaxable);
   382	        }
   383	
   384	        return function () use ($TargetOrder, $temporaryItems): void {
   385	            foreach ($temporaryItems as $OrderItem) {
   386	                if ($OrderItem->getShipping() instanceof Shipping) {
   387	                    $OrderItem->getShipping()->removeOrderItem($OrderItem);
   388	                }
   389	                $TargetOrder->removeOrderItem($OrderItem);
   390	            }
   391	        };
   392	    }
   393	
   394	    /**
   395	     * 欠品数の変化に応じて商品明細の担当者・欠品履歴を更新し、注文数から欠品の増減分を減算する.
   396	     *
   397	     * {@see PurchaseFlow::validate} より前に呼ぶことで、在庫差分（{@see \Eccube\Service\PurchaseFlow\Processor\StockDiffProcessor}）が
   398	     * 実在庫に対する有効数量を前提に動くようにする。検証失敗時は返却したクロージャでメモリ上の変更と未 flush の履歴を戻す.
   399	     *
   400	     * @param Order $TargetOrder フォーム反映後の受注
   401	     * @param Order $OriginOrder 編集開始時点の受注クローン（明細も clone 済み）
   402	     *
   403	     * @return \Closure 検証エラー時に呼ぶロールバック（引数・戻り値なし）
   404	     */
   405	    private function applyStockoutChangesBeforeOrderPurchaseFlowValidate(Order $TargetOrder, Order $OriginOrder): \Closure
   406	    {
   407	        $entityManager = $this->entityManager;
   408	        $originById = [];
   409	        foreach ($OriginOrder->getOrderItems() as $OriginItem) {
   410	            $id = $OriginItem->getId();
   411	            if ($id !== null) {
   412	                $originById[$id] = $OriginItem;
   413	            }
   414	        }
   415	
   416	        $operator = $this->getMember();
   417	        /** @var list<array{0: OrderItem, 1: string, 2: ?Member}> */
   418	        $quantityAndMemberRollbacks = [];
   419	        /** @var list<DtbStockoutHistory> */
   420	        $pendingHistories = [];
   421	
   422	        foreach ($TargetOrder->getOrderItems() as $OrderItem) {
   423	            if (!$OrderItem->isProduct() || $OrderItem->getProductClass() === null) {
   424	                continue;
   425	            }
   426	
   427	            $newStockout = (int) ($OrderItem->getStockout() ?? 0);
   428	            $oldStockout = 0;
   429	            $orderItemId = $OrderItem->getId();
   430	            if ($orderItemId !== null && isset($originById[$orderItemId])) {
   431	                $oldStockout = (int) ($originById[$orderItemId]->getStockout() ?? 0);
   432	            }
   433	
   434	            if ($newStockout === $oldStockout) {
   435	                continue;
   436	            }
   437	
   438	            $delta = $newStockout - $oldStockout;
   439	            $quantityBefore = $OrderItem->getQuantity();
   440	            $memberBefore = $OrderItem->getMember();
   441	            $adjustedQuantity = bcsub($quantityBefore, (string) $delta, 0);
   442	            if (bccomp($adjustedQuantity, '0', 0) < 0) {
   443	                $adjustedQuantity = '0';
   444	            }
   445	            $OrderItem->setQuantity($adjustedQuantity);
   446	            $OrderItem->setMember($operator);
   447	
   448	            $history = new DtbStockoutHistory();
   449	            $history
   450	                ->setStockout($newStockout)
   451	                ->setOrder($TargetOrder)
   452	                ->setProductClass($OrderItem->getProductClass())
   453	                ->setBaseInfo($TargetOrder->getBaseInfo())
   454	                ->setMember($operator)
   455	                ->setCreateDate(new \DateTime());
   456	            $entityManager->persist($history);
   457	            $pendingHistories[] = $history;
   458	
   459	            $quantityAndMemberRollbacks[] = [$OrderItem, $quantityBefore, $memberBefore];
   460	        }
   461	
   462	        return function () use ($entityManager, $pendingHistories, $quantityAndMemberRollbacks): void {
   463	            foreach ($pendingHistories as $history) {
   464	                if ($entityManager->contains($history)) {
   465	                    $entityManager->detach($history);
   466	                }
   467	            }
   468	            foreach ($quantityAndMemberRollbacks as [$item, $qty, $member]) {
   469	                $item->setQuantity($qty);
   470	                $item->setMember($member);
   471	            }
   472	        };
   473	    }
   474	
   475	    /**
   476	     * フォーム送信後の処理。PurchaseFlow による検証とフラッシュメッセージ設定、`mode=register` 時は登録処理を実行.
   477	     *
   478	     * @param Request                         $request         リクエスト
   479	     * @param RouterInterface                 $router          登録完了後の `return_link` 解決に使用（{@see tryCommitOrderRegister} へ伝播）
   480	     * @param FormInterface                   $form            バインド済み受注フォーム

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php | sed -n '1,240p'" in /home/y-saito/Developments/hareruya-design-docs
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
    18	use Doctrine\Common\Collections\ArrayCollection;
    19	use Eccube\Controller\AbstractController;
    20	use Eccube\Entity\Customer;
    21	use Eccube\Entity\DtbStockoutHistory;
    22	use Eccube\Entity\Master\CustomerStatus;
    23	use Eccube\Entity\Master\MtbOption;
    24	use Eccube\Entity\Master\OrderItemType;
    25	use Eccube\Entity\Master\OrderStatus;
    26	use Eccube\Entity\Master\TaxType;
    27	use Eccube\Entity\Member;
    28	use Eccube\Entity\Order;
    29	use Eccube\Entity\OrderItem;
    30	use Eccube\Entity\Payment;
    31	use Eccube\Entity\Shipping;
    32	use Eccube\Event\EccubeEvents;
    33	use Eccube\Event\EventArgs;
    34	use Eccube\Exception\ShoppingException;
    35	use Eccube\Form\Type\Admin\OrderType;
    36	use Eccube\Form\Type\Admin\SearchCustomerType;
    37	use Eccube\Form\Type\Admin\SearchProductType;
    38	use Eccube\Repository\BaseInfoRepository;
    39	use Eccube\Repository\CategoryRepository;
    40	use Eccube\Repository\CustomerRepository;
    41	use Eccube\Repository\DeliveryRepository;
    42	use Eccube\Repository\DtbShippingStandbyRepository;
    43	use Eccube\Repository\DtbWaitingNumberRepository;
    44	use Eccube\Repository\Master\DeviceTypeRepository;
    45	use Eccube\Repository\Master\MtbOptionRepository;
    46	use Eccube\Repository\Master\OrderItemTypeRepository;
    47	use Eccube\Repository\Master\OrderStatusRepository;
    48	use Eccube\Repository\OrderRepository;
    49	use Eccube\Repository\ProductClassRepository;
    50	use Eccube\Repository\ProductRepository;
    51	use Eccube\Service\OrderHelper;
    52	use Eccube\Service\OrderStateMachine;
    53	use Eccube\Service\PointService;
    54	use Eccube\Service\PurchaseFlow\Processor\OrderNoProcessor;
    55	use Eccube\Service\PurchaseFlow\PurchaseContext;
    56	use Eccube\Service\PurchaseFlow\PurchaseException;
    57	use Eccube\Service\PurchaseFlow\PurchaseFlow;
    58	use Eccube\Service\PurchaseFlow\PurchaseFlowResult;
    59	use Eccube\Service\Smaregi\SmaregiApiService;
    60	use Eccube\Service\Smaregi\SmaregiOrderGainPointEventService;
    61	use Eccube\Service\TaxRuleService;
    62	use Knp\Component\Pager\Pagination\SlidingPagination;
    63	use Knp\Component\Pager\PaginatorInterface;
    64	use Symfony\Bridge\Twig\Attribute\Template;
    65	use Symfony\Component\Form\FormBuilderInterface;
    66	use Symfony\Component\Form\FormInterface;
    67	use Symfony\Component\HttpFoundation\JsonResponse;
    68	use Symfony\Component\HttpFoundation\RedirectResponse;
    69	use Symfony\Component\HttpFoundation\Request;
    70	use Symfony\Component\HttpFoundation\Response;
    71	use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
    72	use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
    73	use Symfony\Component\Routing\Attribute\Route;
    74	use Symfony\Component\Routing\RouterInterface;
    75	use Symfony\Component\Serializer\SerializerInterface;
    76	
    77	/**
    78	 * 管理画面の受注新規作成・編集、および編集画面用の顧客／商品検索・明細種別 Ajax を提供する.
    79	 *
    80	 * 受注の本処理（`index`）は GET/POST 同一アクションとし、表示準備・POST 時の検証・登録確定を private メソッドに分割.
    81	 */
    82	class EditController extends AbstractController
    83	{
    84	    private const TEMP_ORDER_ITEM_PROCESSOR_NAME = self::class.'::temporaryFinancialItems';
    85	
    86	    /**
    87	     * @param TaxRuleService                    $taxRuleService            税計算（他アクション・継承先で利用される場合あり）
    88	     * @param DeviceTypeRepository              $deviceTypeRepository      端末種別
    89	     * @param ProductRepository                 $productRepository       商品（検索等）
    90	     * @param CategoryRepository                $categoryRepository      カテゴリ（検索等）
    91	     * @param CustomerRepository                $customerRepository      会員（検索等）
    92	     * @param PurchaseFlow                      $orderPurchaseFlow       受注用 PurchaseFlow（検証・prepare/commit）
    93	     * @param OrderRepository                   $orderRepository         受注の取得・会員購入サマリ更新
    94	     * @param OrderNoProcessor                  $orderNoProcessor        受注番号採番
    95	     * @param OrderItemTypeRepository           $OrderItemTypeRepository 明細種別マスタ
    96	     * @param OrderStatusRepository             $orderStatusRepository   受注ステータスマスタ
    97	     * @param OrderStateMachine                 $orderStateMachine       受注ステータス遷移
    98	     * @param OrderHelper                       $orderHelper             受注ヘルパ（仮受注 ID・税表示タイプ等）
    99	     * @param DeliveryRepository                $deliveryRepository      編集画面用：配送業者・お届け時間
   100	     * @param MtbOptionRepository               $optionRepository        編集画面用：一覧閾値オプション等
   101	     * @param DtbWaitingNumberRepository        $waitingNumberRepository 編集画面用：店頭待ち番号
   102	     * @param SerializerInterface               $serializer              編集画面用：配送時間 JSON
   103	     * @param ProductClassRepository            $productClassRepository  編集画面用：商品規格サブ情報
   104	     * @param DtbShippingStandbyRepository       $dtbShippingStandbyRepository 編集画面用：納品書
   105	     * @param BaseInfoRepository                $baseInfoRepository      編集画面用：基本情報
   106	     */
   107	    public function __construct(
   108	        protected TaxRuleService $taxRuleService,
   109	        protected DeviceTypeRepository $deviceTypeRepository,
   110	        protected ProductRepository $productRepository,
   111	        protected CategoryRepository $categoryRepository,
   112	        protected CustomerRepository $customerRepository,
   113	        protected PurchaseFlow $orderPurchaseFlow,
   114	        protected OrderRepository $orderRepository,
   115	        protected OrderNoProcessor $orderNoProcessor,
   116	        protected OrderItemTypeRepository $OrderItemTypeRepository,
   117	        protected OrderStatusRepository $orderStatusRepository,
   118	        protected OrderStateMachine $orderStateMachine,
   119	        private readonly OrderHelper $orderHelper,
   120	        private readonly DeliveryRepository $deliveryRepository,
   121	        private readonly MtbOptionRepository $optionRepository,
   122	        private readonly DtbWaitingNumberRepository $waitingNumberRepository,
   123	        private readonly SerializerInterface $serializer,
   124	        private readonly ProductClassRepository $productClassRepository,
   125	        private readonly DtbShippingStandbyRepository $dtbShippingStandbyRepository,
   126	        private readonly BaseInfoRepository $baseInfoRepository,
   127	        private readonly PointService $pointService,
   128	        private readonly SmaregiApiService $smaregiApiService,
   129	        private readonly SmaregiOrderGainPointEventService $smaregiOrderGainPointEventService,
   130	    ) {
   131	    }
   132	
   133	    /**
   134	     * 受注登録/編集画面.
   135	     *
   136	     * POST かつ `mode=register` で確定保存し、成功時はリダイレクトする。検証エラー時は同画面を再表示.
   137	     *
   138	     * @param Request         $request リクエスト（フォーム入力・mode 判定）
   139	     * @param RouterInterface $router  `return_link` からのリダイレクト先解決に使用
   140	     * @param int|null        $id      受注 ID.(null のとき新規作成画面)
   141	     *
   142	     * @return RedirectResponse|array<string, mixed> 登録成功時は RedirectResponse、表示時は Twig へ渡す連想配列
   143	     *
   144	     * @throws NotFoundHttpException 指定 ID の受注が存在しない場合
   145	     */
   146	    #[Route(path: '/%eccube_admin_route%/order/new', name: 'admin_order_new', methods: ['GET', 'POST'])]
   147	    #[Route(path: '/%eccube_admin_route%/order/{id}/edit', name: 'admin_order_edit', requirements: ['id' => '\d+'], methods: ['GET', 'POST'])]
   148	    #[Template(template: '@admin/Order/edit.twig')]
   149	    public function index(Request $request, RouterInterface $router, ?int $id = null): RedirectResponse|array
   150	    {
   151	        $TargetOrder = $this->loadTargetOrderForEdit($id);
   152	        [$OriginOrder, $OriginItems] = $this->cloneOriginOrderAndItems($TargetOrder);
   153	
   154	        $builder = $this->formFactory->createBuilder(OrderType::class, $TargetOrder);
   155	        $this->dispatchOrderEditIndexInitialize($builder, $OriginOrder, $TargetOrder, $request);
   156	
   157	        $form = $builder->getForm();
   158	        $lineDisplay = $this->presetOrderItemRowsForDisplay($form);
   159	        $form->handleRequest($request);
   160	
   161	        $purchaseContext = new PurchaseContext($OriginOrder, $OriginOrder->getCustomer());
   162	        $this->ensureTaxDisplayTypesOnOrderItems($TargetOrder);
   163	
   164	        $redirect = $this->handleSubmittedOrderEdit(
   165	            $request,
   166	            $router,
   167	            $form,
   168	            $builder,
   169	            $TargetOrder,
   170	            $OriginOrder,
   171	            $OriginItems,
   172	            $purchaseContext
   173	        );
   174	        if ($redirect instanceof RedirectResponse) {
   175	            return $redirect;
   176	        }
   177	
   178	        [$searchCustomerModalForm, $searchProductModalForm] = $this->createSearchModalForms($request, $OriginOrder, $TargetOrder);
   179	        $viewContext = $this->buildAdminOrderEditViewContext($TargetOrder);
   180	
   181	        return array_merge(
   182	            [
   183	                'form' => $form->createView(),
   184	                'searchCustomerModalForm' => $searchCustomerModalForm->createView(),
   185	                'searchProductModalForm' => $searchProductModalForm->createView(),
   186	                'Order' => $TargetOrder,
   187	                'id' => $id,
   188	                'arrQuantity' => $lineDisplay['arrQuantity'],
   189	                'arrStockout' => $lineDisplay['arrStockout'],
   190	                'arrDifferentPrice' => $lineDisplay['arrDifferentPrice'],
   191	            ],
   192	            $viewContext
   193	        );
   194	    }
   195	
   196	    /**
   197	     * 編集対象の {@see Order} を返す。新規の場合は空の受注と初期 Shipping・仮受注 ID を設定する.
   198	     *
   199	     * @param int|null $id 受注 ID。null なら新規
   200	     *
   201	     * @throws NotFoundHttpException 既存 ID が DB に存在しない場合
   202	     */
   203	    private function loadTargetOrderForEdit(?int $id): Order
   204	    {
   205	        if ($id === null) {
   206	            $TargetOrder = new Order();
   207	            $TargetOrder->setBaseInfo($this->getMember()->getBaseInfo());
   208	            $TargetOrder->addShipping((new Shipping())->setOrder($TargetOrder));
   209	            $TargetOrder->setPreOrderId($this->orderHelper->createPreOrderId());
   210	
   211	            return $TargetOrder;
   212	        }
   213	
   214	        $TargetOrder = $this->orderRepository->getOrderItemList($id);
   215	        if ($TargetOrder === null) {
   216	            throw new NotFoundHttpException();
   217	        }
   218	
   219	        return $TargetOrder;
   220	    }
   221	
   222	    /**
   223	     * 保存前比較用に、編集前の受注クローンと当時の明細エンティティ参照のコレクションを返す.
   224	     *
   225	     * @param Order $TargetOrder 編集対象の受注
   226	     *
   227	     * @return array{0: Order, 1: ArrayCollection<int, OrderItem>} [編集前受注クローン, 編集前の OrderItem 参照（削除判定用）]
   228	     */
   229	    private function cloneOriginOrderAndItems(Order $TargetOrder): array
   230	    {
   231	        $OriginOrder = clone $TargetOrder;
   232	        $OriginItems = new ArrayCollection();
   233	        foreach ($TargetOrder->getOrderItems() as $OrderItem) {
   234	            $OriginItems->add($OrderItem);
   235	        }
   236	
   237	        return [$OriginOrder, $OriginItems];
   238	    }
   239	
   240	    /**

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php | sed -n '880,1160p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   880	        return $quantities;
   881	    }
   882	
   883	    /**
   884	     * 指定された日付項目をクリアする.
   885	     */
   886	    private function tryClearOrderDate(Request $request, Order $TargetOrder): RedirectResponse
   887	    {
   888	        $target = (string) $request->query->get('target', '');
   889	        switch ($target) {
   890	            case 'picking_date':
   891	                // ピック中
   892	                $TargetOrder->setPickingDate(null);
   893	                break;
   894	            case 'payment_date':
   895	                // 入金日
   896	                $TargetOrder->setPaymentDate(null);
   897	                break;
   898	            case 'confirm_date':
   899	                // ピック中
   900	                $TargetOrder->setConfirmDate(null);
   901	                break;
   902	            case 'commit_date':
   903	                // 出荷指示日
   904	                $TargetOrder->setCommitDate(null);
   905	                break;
   906	            case 'shipping_date':
   907	                // 出荷日
   908	                $TargetOrder->setShippingDate(null);
   909	                foreach ($TargetOrder->getShippings() as $Shipping) {
   910	                    $Shipping->setShippingDate(null);
   911	                }
   912	                break;
   913	            case 'cancel_date':
   914	                // キャンセル日
   915	                $TargetOrder->setCancelDate(null);
   916	                break;
   917	            case 'otc_rsv_date':
   918	                // 店頭予約
   919	                $TargetOrder->setOtcRsvDate(null);
   920	                break;
   921	            default:
   922	                return $this->redirectToRoute('admin_order_edit', ['id' => $TargetOrder->getId()]);
   923	        }
   924	
   925	        $TargetOrder
   926	            ->setMember($this->getMember())
   927	            ->setUpdateDate(new \DateTime());
   928	        $this->entityManager->persist($TargetOrder);
   929	        $this->entityManager->flush();
   930	
   931	        $this->addSuccess('admin.order.save.complete', 'admin');
   932	
   933	        return $this->redirectToRoute('admin_order_edit', ['id' => $TargetOrder->getId()]);
   934	    }
   935	
   936	    /**
   937	     * 受注フォームのポイント関連入力と担当者を受注に反映する.
   938	     *
   939	     * 受注明細・配送・金額が確定した後（PurchaseFlow commit 後）に実行し、
   940	     * 小計や還元率が変わった場合のみ発生ポイントを再計算する。
   941	     */
   942	    private function applyOrderPointAndOperatorFromForm(Order $TargetOrder, Order $OriginOrder, FormInterface $form): void
   943	    {
   944	        $targetSubTotal = (int) $TargetOrder->getSubtotal();
   945	        $pointPercentage = $form->has('pointPercentage')
   946	            ? (int) ($form->get('pointPercentage')->getData() ?? 0)
   947	            : (int) ($TargetOrder->getPointPercentage() ?? 0);
   948	        $spendedPoints = $form->has('spendedPoints')
   949	            ? (int) ($form->get('spendedPoints')->getData() ?? 0)
   950	            : (int) ($TargetOrder->getSpendedPoints() ?? 0);
   951	        $gainedPoints = $form->has('gainedPoints')
   952	            ? (int) ($form->get('gainedPoints')->getData() ?? 0)
   953	            : (int) ($TargetOrder->getGainedPoints() ?? 0);
   954	
   955	        $paymentMethod = $TargetOrder->getPaymentMethod() ?? '';
   956	        if ($TargetOrder->getOrderStatus()?->getId() === OrderStatus::CANCEL) {
   957	            $gainedPoints = 0;
   958	        } elseif (strpos($paymentMethod, Payment::EC_CASH_AND_CARRY_METHOD) === false
   959	            && ($targetSubTotal !== (int) $OriginOrder->getSubtotal()
   960	                || (int) ($OriginOrder->getPointPercentage() ?? 0) !== $pointPercentage)) {
   961	            $taxedBase = $targetSubTotal - $spendedPoints;
   962	            $gainedPoints = $taxedBase > 0 ? (int) floor($taxedBase * $pointPercentage / 100) : 0;
   963	        }
   964	
   965	        $TargetOrder
   966	            ->setMember($this->getMember())
   967	            ->setGainedPoints($gainedPoints)
   968	            ->setSpendedPoints($spendedPoints)
   969	            ->setPointPercentage($pointPercentage);
   970	    }
   971	
   972	    /**
   973	     * 受注編集画面モーダル用の会員検索・商品検索フォームを生成し、それぞれ初期化イベントを送出する.
   974	     *
   975	     * @param Request $request     リクエスト
   976	     * @param Order   $OriginOrder 編集前スナップショット
   977	     * @param Order   $TargetOrder 編集対象の受注
   978	     *
   979	     * @return array{0: FormInterface, 1: FormInterface} [会員検索フォーム, 商品検索フォーム]
   980	     */
   981	    private function createSearchModalForms(Request $request, Order $OriginOrder, Order $TargetOrder): array
   982	    {
   983	        $builder = $this->formFactory->createBuilder(SearchCustomerType::class);
   984	
   985	        $event = new EventArgs(
   986	            [
   987	                'builder' => $builder,
   988	                'OriginOrder' => $OriginOrder,
   989	                'TargetOrder' => $TargetOrder,
   990	            ],
   991	            $request
   992	        );
   993	        $this->eventDispatcher->dispatch($event, EccubeEvents::ADMIN_ORDER_EDIT_SEARCH_CUSTOMER_INITIALIZE);
   994	
   995	        $searchCustomerModalForm = $builder->getForm();
   996	
   997	        $builder = $this->formFactory->createBuilder(SearchProductType::class);
   998	
   999	        $event = new EventArgs(
  1000	            [
  1001	                'builder' => $builder,
  1002	                'OriginOrder' => $OriginOrder,
  1003	                'TargetOrder' => $TargetOrder,
  1004	            ],
  1005	            $request
  1006	        );
  1007	        $this->eventDispatcher->dispatch($event, EccubeEvents::ADMIN_ORDER_EDIT_SEARCH_PRODUCT_INITIALIZE);
  1008	
  1009	        $searchProductModalForm = $builder->getForm();
  1010	
  1011	        return [$searchCustomerModalForm, $searchProductModalForm];
  1012	    }
  1013	
  1014	    /**
  1015	     * 編集画面 Twig 向けの補助データ（配送時間 JSON・閾値・店頭番号・商品サブ情報）を組み立てる。永続化は行わない.
  1016	     *
  1017	     * @param Order $TargetOrder 表示中の受注（新規のときは未永続で ID が null の場合あり）
  1018	     *
  1019	     * @return array{
  1020	     *     shippingDeliveryTimes: string,
  1021	     *     thresholdPrice1: int,
  1022	     *     thresholdPrice2: int,
  1023	     *     waitingNumber: int|null,
  1024	     *     productNameAndSubInfos: array<int, array<string, string|array<string, string>>>
  1025	     * }
  1026	     */
  1027	    private function buildAdminOrderEditViewContext(Order $TargetOrder): array
  1028	    {
  1029	        $times = [];
  1030	        foreach ($this->deliveryRepository->findAll() as $Delivery) {
  1031	            $deliveryTimes = $Delivery->getDeliveryTimes();
  1032	            foreach ($deliveryTimes as $DeliveryTime) {
  1033	                $times[$Delivery->getId()][$DeliveryTime->getId()] = $DeliveryTime->getDeliveryTime();
  1034	            }
  1035	        }
  1036	
  1037	        $WaitingNumber = $TargetOrder->getId() === null
  1038	            ? null
  1039	            : $this->waitingNumberRepository->findOneBy(['orderId' => $TargetOrder->getId()]);
  1040	
  1041	        // 金額閾値情報の取得
  1042	        $option1 = $this->optionRepository->findOneBy([
  1043	            'option_key' => MtbOption::ORDER_LIST_THRESHOLD_PRICE_1,
  1044	        ]);
  1045	        $thresholdPrice1 = $option1 !== null ? (int) $option1->getOptionValue() : 0;
  1046	
  1047	        $option2 = $this->optionRepository->findOneBy([
  1048	            'option_key' => MtbOption::ORDER_LIST_THRESHOLD_PRICE_2,
  1049	        ]);
  1050	        $thresholdPrice2 = $option2 !== null ? (int) $option2->getOptionValue() : 0;
  1051	
  1052	        return [
  1053	            'shippingDeliveryTimes' => $this->serializer->serialize($times, 'json'),
  1054	            'thresholdPrice1' => $thresholdPrice1,
  1055	            'thresholdPrice2' => $thresholdPrice2,
  1056	            'waitingNumber' => $WaitingNumber?->getWaitingNumber() ?? null,
  1057	            'productNameAndSubInfos' => $this->getProductNameAndSubInfosForEditView($TargetOrder),
  1058	        ];
  1059	    }
  1060	
  1061	    /**
  1062	     * 注文明細ごとに、商品名（表示用に整形）および言語・状態・フォイル等のサブ情報を格納した配列を返す.
  1063	     *
  1064	     * 商品明細（{@see OrderItem::isProduct}）のみを対象とする。カード以外でサブ情報が無い明細は `productName` のみを格納する.
  1065	     *
  1066	     * @param Order $Order 対象受注
  1067	     *
  1068	     * @return array<int, array<string, string|array<string, string>>> キーは注文明細 ID（商品明細かつ永続化済みの行が主な対象）
  1069	     */
  1070	    private function getProductNameAndSubInfosForEditView(Order $Order): array
  1071	    {
  1072	        $productClassIds = array_map(
  1073	            fn ($OrderItem) => $OrderItem->getProductClass()->getId(),
  1074	            array_filter($Order->getOrderItems()->toArray(), fn ($OrderItem) => $OrderItem->isProduct())
  1075	        );
  1076	
  1077	        $subInfosByProductClass = $this->productClassRepository->getSubInfosByProductClassIds($productClassIds);
  1078	
  1079	        $productNameAndSubInfos = [];
  1080	        foreach (array_filter($Order->getOrderItems()->toArray(), fn ($OrderItem) => $OrderItem->isProduct()) as $OrderItem) {
  1081	            $OrderItemId = $OrderItem->getId();
  1082	            $productName = $OrderItem->getProductName();
  1083	            if (!isset($subInfosByProductClass[$OrderItem->getProductClass()->getId()])) {
  1084	                $productNameAndSubInfos[$OrderItemId]['productName'] = $productName;
  1085	
  1086	                continue;
  1087	            }
  1088	            $subInfo = $subInfosByProductClass[$OrderItem->getProductClass()->getId()];
  1089	
  1090	            $productName = $OrderItem->getProductName();
  1091	            $pattern = '/【'.$subInfo['languageCode'].'\/([^】]+)】/u';
  1092	            if (preg_match($pattern, $productName, $matches)) {
  1093	                $subInfo['conditionLabel'] = $matches[1];
  1094	            } else {
  1095	                $subInfo['conditionLabel'] = $subInfo['conditionCode'];
  1096	            }
  1097	            $productNameAndSubInfos[$OrderItemId]['productName'] = preg_replace($pattern, '', $productName);
  1098	            $productNameAndSubInfos[$OrderItemId]['subInfo'] = $subInfo;
  1099	        }
  1100	
  1101	        return $productNameAndSubInfos;
  1102	    }
  1103	
  1104	    /**
  1105	     * 顧客情報を検索する.
  1106	     *
  1107	     * @return array<string, mixed>
  1108	     *
  1109	     * @throws BadRequestHttpException
  1110	     */
  1111	    #[Route(path: '/%eccube_admin_route%/order/search/customer/html', name: 'admin_order_search_customer_html', methods: ['GET', 'POST'])]
  1112	    #[Route(path: '/%eccube_admin_route%/order/search/customer/html/page/{page_no}', name: 'admin_order_search_customer_html_page', requirements: ['page_no' => '\d+'], methods: ['GET', 'POST'])]
  1113	    #[Template(template: '@admin/Order/search_customer.twig')]
  1114	    public function searchCustomerHtml(Request $request, PaginatorInterface $paginator, ?int $page_no = null): array
  1115	    {
  1116	        if ($request->isXmlHttpRequest() && $this->isTokenValid()) {
  1117	            log_debug('search customer start.');
  1118	            $page_count = $this->eccubeConfig['eccube_default_page_count'];
  1119	            $session = $this->session;
  1120	
  1121	            if ($request->getMethod() === 'POST') {
  1122	                $page_no = 1;
  1123	
  1124	                $searchData = [
  1125	                    'multi' => $request->get('search_word'),
  1126	                    'customer_status' => [
  1127	                        CustomerStatus::REGULAR,
  1128	                    ],
  1129	                ];
  1130	
  1131	                $session->set('eccube.admin.order.customer.search', $searchData);
  1132	                $session->set('eccube.admin.order.customer.search.page_no', $page_no);
  1133	            } else {
  1134	                $searchData = (array) $session->get('eccube.admin.order.customer.search');
  1135	                if (is_null($page_no)) {
  1136	                    $page_no = intval($session->get('eccube.admin.order.customer.search.page_no'));
  1137	                } else {
  1138	                    $session->set('eccube.admin.order.customer.search.page_no', $page_no);
  1139	                }
  1140	            }
  1141	
  1142	            $qb = $this->customerRepository->getQueryBuilderBySearchData($searchData);
  1143	
  1144	            $event = new EventArgs(
  1145	                [
  1146	                    'qb' => $qb,
  1147	                    'data' => $searchData,
  1148	                ],
  1149	                $request
  1150	            );
  1151	            $this->eventDispatcher->dispatch($event, EccubeEvents::ADMIN_ORDER_EDIT_SEARCH_CUSTOMER_SEARCH);
  1152	
  1153	            /** @var SlidingPagination<int, Customer> $pagination */
  1154	            $pagination = $paginator->paginate(
  1155	                $qb,
  1156	                $page_no,
  1157	                $page_count,
  1158	                ['wrap-queries' => true]
  1159	            );
  1160	

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php | sed -n '1,260p'" in /home/y-saito/Developments/hareruya-design-docs
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
    14	namespace Eccube\Form\Type\Admin;
    15	
    16	use Doctrine\Common\Collections\ArrayCollection;
    17	use Doctrine\ORM\EntityManagerInterface;
    18	use Eccube\Common\EccubeConfig;
    19	use Eccube\Entity\Customer;
    20	use Eccube\Entity\Master\Country;
    21	use Eccube\Entity\Master\OrderStatus;
    22	use Eccube\Entity\Order;
    23	use Eccube\Entity\Payment;
    24	use Eccube\Form\DataTransformer\EntityToIdTransformer;
    25	use Eccube\Form\Type\AddressType;
    26	use Eccube\Form\Type\KanaType;
    27	use Eccube\Form\Type\NameType;
    28	use Eccube\Form\Type\PriceType;
    29	use Eccube\Form\Type\SplitPhoneNumberType;
    30	use Eccube\Form\Type\SplitPostalType;
    31	use Eccube\Form\Validator\Email;
    32	use Eccube\Repository\Master\OrderStatusRepository;
    33	use Eccube\Service\OrderStateMachine;
    34	use Symfony\Bridge\Doctrine\Form\Type\EntityType;
    35	use Symfony\Component\Form\AbstractType;
    36	use Symfony\Component\Form\Extension\Core\Type\CollectionType;
    37	use Symfony\Component\Form\Extension\Core\Type\EmailType;
    38	use Symfony\Component\Form\Extension\Core\Type\HiddenType;
    39	use Symfony\Component\Form\Extension\Core\Type\IntegerType;
    40	use Symfony\Component\Form\Extension\Core\Type\TextareaType;
    41	use Symfony\Component\Form\Extension\Core\Type\TextType;
    42	use Symfony\Component\Form\FormBuilderInterface;
    43	use Symfony\Component\Form\FormError;
    44	use Symfony\Component\Form\FormEvent;
    45	use Symfony\Component\Form\FormEvents;
    46	use Symfony\Component\OptionsResolver\OptionsResolver;
    47	use Symfony\Component\Validator\Constraints as Assert;
    48	
    49	class OrderType extends AbstractType
    50	{
    51	    /**
    52	     * OrderType constructor.
    53	     */
    54	    public function __construct(protected EntityManagerInterface $entityManager, protected EccubeConfig $eccubeConfig, protected OrderStateMachine $orderStateMachine, protected OrderStatusRepository $orderStatusRepository)
    55	    {
    56	    }
    57	
    58	    /**
    59	     * {@inheritdoc}
    60	     *
    61	     * @param array<string, mixed> $options
    62	     */
    63	    #[\Override]
    64	    public function buildForm(FormBuilderInterface $builder, array $options): void
    65	    {
    66	        $Order = $options['data'] ?? null;
    67	
    68	        $builder
    69	            ->add('name', NameType::class, [
    70	                'required' => false,
    71	                'options' => [
    72	                    'constraints' => [
    73	                        new Assert\NotBlank(),
    74	                    ],
    75	                ],
    76	            ])
    77	            ->add('kana', KanaType::class, [
    78	                'required' => false,
    79	                'options' => [
    80	                    'constraints' => [
    81	                        new Assert\NotBlank(),
    82	                    ],
    83	                ],
    84	            ])
    85	            ->add('company_name', TextType::class, [
    86	                'required' => false,
    87	                'constraints' => [
    88	                    new Assert\Length(max: $this->eccubeConfig['eccube_stext_len']),
    89	                ],
    90	            ])
    91	            ->add('postalCode', SplitPostalType::class, [
    92	                'mapped' => false,
    93	                'required' => false,
    94	                'initial_postal_code' => $Order?->getPostalCode(),
    95	            ])
    96	            ->add('address', AddressType::class, [
    97	                'required' => false,
    98	                'pref_options' => [
    99	                    'constraints' => [
   100	                        new Assert\NotBlank(),
   101	                    ],
   102	                    'attr' => ['class' => 'p-region-id'],
   103	                ],
   104	                'addr01_options' => [
   105	                    'constraints' => [
   106	                        new Assert\NotBlank(),
   107	                        new Assert\Length(max: $this->eccubeConfig['eccube_mtext_len']),
   108	                    ],
   109	                    'attr' => ['class' => 'p-locality p-street-address'],
   110	                ],
   111	                'addr02_options' => [
   112	                    'required' => false,
   113	                    'constraints' => [
   114	                        new Assert\NotBlank(),
   115	                        new Assert\Length(max: $this->eccubeConfig['eccube_mtext_len']),
   116	                    ],
   117	                    'attr' => ['class' => 'p-extended-address'],
   118	                ],
   119	                'addr03_options' => [
   120	                    'required' => false,
   121	                    'constraints' => [
   122	                        new Assert\Length(max: $this->eccubeConfig['eccube_mtext_len']),
   123	                    ],
   124	                    'attr' => [
   125	                        'class' => 'p-extended-address',
   126	                        'placeholder' => 'admin.common.address_sample_03',
   127	                    ],
   128	                ],
   129	            ])
   130	            ->add('email', EmailType::class, [
   131	                'required' => false,
   132	                'constraints' => [
   133	                    new Assert\NotBlank(),
   134	                    new Email(null, null, $this->eccubeConfig['eccube_rfc_email_check'] ? 'strict' : null),
   135	                ],
   136	            ])
   137	            ->add('tel', SplitPhoneNumberType::class, [
   138	                'required' => false,
   139	                'tel01_options' => [
   140	                    'required' => false,
   141	                    'constraints' => [
   142	                        new Assert\Type(type: 'numeric', message: 'form_error.numeric_only'),
   143	                        new Assert\Length([
   144	                            'max' => $this->eccubeConfig['eccube_split_tel_len_max'],
   145	                            'min' => $this->eccubeConfig['eccube_split_tel_len_min'],
   146	                        ]),
   147	                    ],
   148	                ],
   149	                'tel02_options' => [
   150	                    'required' => false,
   151	                    'constraints' => [
   152	                        new Assert\Type(type: 'numeric', message: 'form_error.numeric_only'),
   153	                        new Assert\Length([
   154	                            'max' => $this->eccubeConfig['eccube_split_tel_len_max'],
   155	                            'min' => $this->eccubeConfig['eccube_split_tel_len_min'],
   156	                        ]),
   157	                    ],
   158	                ],
   159	                'tel03_options' => [
   160	                    'required' => false,
   161	                    'constraints' => [
   162	                        new Assert\Type(type: 'numeric', message: 'form_error.numeric_only'),
   163	                        new Assert\Length([
   164	                            'max' => $this->eccubeConfig['eccube_split_tel_len_max'],
   165	                            'min' => $this->eccubeConfig['eccube_split_tel_len_min'],
   166	                        ]),
   167	                    ],
   168	                ],
   169	            ])
   170	            ->add('fax', SplitPhoneNumberType::class, [
   171	                'required' => false,
   172	                'tel01_options' => [
   173	                    'required' => false,
   174	                    'constraints' => [
   175	                        new Assert\Type(type: 'numeric', message: 'form_error.numeric_only'),
   176	                        new Assert\Length([
   177	                            'max' => $this->eccubeConfig['eccube_split_tel_len_max'],
   178	                            'min' => $this->eccubeConfig['eccube_split_tel_len_min'],
   179	                        ]),
   180	                    ],
   181	                ],
   182	                'tel02_options' => [
   183	                    'required' => false,
   184	                    'constraints' => [
   185	                        new Assert\Type(type: 'numeric', message: 'form_error.numeric_only'),
   186	                        new Assert\Length([
   187	                            'max' => $this->eccubeConfig['eccube_split_tel_len_max'],
   188	                            'min' => $this->eccubeConfig['eccube_split_tel_len_min'],
   189	                        ]),
   190	                    ],
   191	                ],
   192	                'tel03_options' => [
   193	                    'required' => false,
   194	                    'constraints' => [
   195	                        new Assert\Type(type: 'numeric', message: 'form_error.numeric_only'),
   196	                        new Assert\Length([
   197	                            'max' => $this->eccubeConfig['eccube_split_tel_len_max'],
   198	                            'min' => $this->eccubeConfig['eccube_split_tel_len_min'],
   199	                        ]),
   200	                    ],
   201	                ],
   202	            ])
   203	            ->add('message', TextareaType::class, [
   204	                'required' => false,
   205	                'constraints' => [
   206	                    new Assert\Length(max: $this->eccubeConfig['eccube_ltext_len']),
   207	                ],
   208	            ])
   209	            ->add('discount', PriceType::class, [
   210	                'required' => false,
   211	                'constraints' => [
   212	                    new Assert\NotBlank(),
   213	                    new Assert\Length(max: $this->eccubeConfig['eccube_int_len']),
   214	                    new Assert\Range(min: 0),
   215	                ],
   216	            ])
   217	            ->add('delivery_fee_total', PriceType::class, [
   218	                'required' => false,
   219	                'constraints' => [
   220	                    new Assert\NotBlank(),
   221	                    new Assert\Length(max: $this->eccubeConfig['eccube_int_len']),
   222	                    new Assert\Range(min: 0),
   223	                ],
   224	            ])
   225	            ->add('charge', PriceType::class, [
   226	                'required' => false,
   227	                'constraints' => [
   228	                    new Assert\NotBlank(),
   229	                    new Assert\Length(max: $this->eccubeConfig['eccube_int_len']),
   230	                    new Assert\Range(min: 0),
   231	                ],
   232	            ])
   233	            ->add('note', TextareaType::class, [
   234	                'required' => false,
   235	                'constraints' => [
   236	                    new Assert\Length(max: $this->eccubeConfig['eccube_ltext_len']),
   237	                ],
   238	            ])
   239	            ->add('Payment', EntityType::class, [
   240	                'required' => false,
   241	                'class' => Payment::class,
   242	                'choice_label' => fn (Payment $Payment) => $Payment->isVisible()
   243	                    ? $Payment->getMethod()
   244	                    : $Payment->getMethod().trans('admin.common.hidden_label'),
   245	                'placeholder' => false,
   246	                'query_builder' => fn ($er) => $er->createQueryBuilder('p')
   247	                    ->orderBy('p.visible', 'DESC')  // 非表示は下に配置
   248	                    ->addOrderBy('p.sort_no', 'ASC'),
   249	                'constraints' => [
   250	                    new Assert\NotBlank(),
   251	                ],
   252	            ])
   253	            ->add('OrderItems', CollectionType::class, [
   254	                'entry_type' => OrderItemType::class,
   255	                'allow_add' => true,
   256	                'allow_delete' => true,
   257	                'prototype' => true,
   258	            ])
   259	            ->add('OrderItemsErrors', TextType::class, [
   260	                'mapped' => false,

codex
設計と実装の主要な処理フローを横断しました。候補の中には「実装が設計通り」の誤検知は見つかっていませんが、候補に入っていない差分が少なくとも1件あります。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php | sed -n '260,560p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   260	                'mapped' => false,
   261	            ])
   262	            ->add('return_link', HiddenType::class, [
   263	                'mapped' => false,
   264	            ])
   265	            ->add('Country', EntityType::class, [
   266	                'class' => Country::class,
   267	                'choice_label' => 'name',
   268	                'required' => true,
   269	                'mapped' => true,
   270	                'constraints' => [
   271	                    new Assert\NotBlank(),
   272	                ],
   273	            ])
   274	            ->add('abroad_postal_code', TextType::class, [
   275	                'required' => false,
   276	                'constraints' => [
   277	                    new Assert\Length(max: $this->eccubeConfig['eccube_abroad_postal_code_len']),
   278	                ],
   279	            ])
   280	            ->add('smaregi_memo', TextareaType::class, [
   281	                'required' => false,
   282	                'constraints' => [
   283	                    new Assert\Length(max: $this->eccubeConfig['eccube_ltext_len']),
   284	                ],
   285	            ])
   286	            ->add('pointPercentage', IntegerType::class, [
   287	                'required' => false,
   288	                'empty_data' => '0',
   289	                'constraints' => [
   290	                    new Assert\NotBlank(),
   291	                    new Assert\Length(max: $this->eccubeConfig['eccube_int_len']),
   292	                ],
   293	            ])
   294	            ->add('gainedPoints', IntegerType::class, [
   295	                'required' => false,
   296	                'empty_data' => '0',
   297	                'constraints' => [
   298	                    new Assert\NotBlank(),
   299	                    new Assert\Length(max: $this->eccubeConfig['eccube_int_len']),
   300	                    new Assert\Range(min: 0),
   301	                ],
   302	            ])
   303	            ->add('spendedPoints', IntegerType::class, [
   304	                'required' => false,
   305	                'empty_data' => '0',
   306	                'constraints' => [
   307	                    new Assert\NotBlank(),
   308	                    new Assert\Length(max: $this->eccubeConfig['eccube_int_len']),
   309	                    new Assert\Range(min: 0),
   310	                ],
   311	            ])
   312	            ->add('pointErrorMessage', TextareaType::class, [
   313	                'required' => false,
   314	                'mapped' => false,
   315	                'disabled' => true,
   316	            ])
   317	        ;
   318	
   319	        $builder
   320	            ->add($builder->create('Customer', HiddenType::class)
   321	                ->addModelTransformer(new EntityToIdTransformer(
   322	                    $this->entityManager,
   323	                    Customer::class
   324	                )));
   325	
   326	        // TODO: $builder->addEventListener(FormEvents::POST_SET_DATA, $this->sortOrderItems(...));
   327	        $builder->addEventListener(FormEvents::POST_SET_DATA, $this->addOrderStatusForm(...));
   328	        $builder->addEventListener(FormEvents::POST_SET_DATA, $this->addShippingForm(...));
   329	        $builder->addEventListener(FormEvents::POST_SUBMIT, $this->copyFields(...));
   330	        $builder->addEventListener(FormEvents::POST_SUBMIT, $this->validateOrderStatus(...));
   331	        $builder->addEventListener(FormEvents::POST_SUBMIT, $this->validateOrderItems(...));
   332	        $builder->addEventListener(FormEvents::POST_SUBMIT, $this->associateOrderAndShipping(...));
   333	
   334	        $builder->addEventListener(FormEvents::POST_SUBMIT, function (FormEvent $event) {
   335	            $Order = $event->getData();
   336	            $form = $event->getForm();
   337	
   338	            $Country = $Order->getCountry();
   339	            // 国は必須だが NotBlank が失敗した submit などではエンティティに未セットのときがある
   340	            if ($Country === null) {
   341	                return;
   342	            }
   343	
   344	            $zip1 = $form->get('postalCode')->get('postalCode01')->getData() ?: '';
   345	            $zip2 = $form->get('postalCode')->get('postalCode02')->getData() ?: '';
   346	
   347	            if ($Country->isJapan()) {
   348	                if (empty($zip1)) {
   349	                    $form['postalCode']['postalCode01']->addError(new FormError(trans('form.type.select.notselect', [], 'validators')));
   350	                }
   351	                if (empty($zip2)) {
   352	                    $form['postalCode']['postalCode02']->addError(new FormError(trans('form.type.select.notselect', [], 'validators')));
   353	                }
   354	                $Order->setPostalCode($zip1.$zip2);
   355	            } else {
   356	                if (empty($form->get('abroad_postal_code')->getData())) {
   357	                    $form->get('abroad_postal_code')->addError(new FormError(trans('form.type.abroad_postal_code.invalid', [], 'validators')));
   358	                }
   359	            }
   360	        });
   361	    }
   362	
   363	    /**
   364	     * {@inheritdoc}
   365	     */
   366	    #[\Override]
   367	    public function configureOptions(OptionsResolver $resolver): void
   368	    {
   369	        $resolver->setDefaults([
   370	            'data_class' => Order::class,
   371	        ]);
   372	    }
   373	
   374	    /**
   375	     * {@inheritdoc}
   376	     */
   377	    #[\Override]
   378	    public function getBlockPrefix(): string
   379	    {
   380	        return 'order';
   381	    }
   382	
   383	    /**
   384	     * 受注明細をソートする.
   385	     */
   386	    public function sortOrderItems(FormEvent $event): void
   387	    {
   388	        /** @var Order|null $Order */
   389	        $Order = $event->getData();
   390	        if (null === $Order) {
   391	            return;
   392	        }
   393	        $OrderItems = $Order->getItems();
   394	
   395	        $form = $event->getForm();
   396	        $form['OrderItems']->setData($OrderItems);
   397	    }
   398	
   399	    /**
   400	     * 受注ステータスのフォームを追加する
   401	     * 新規登録の際は, ユーザ編集不可のため追加しない.
   402	     *
   403	     * ステータスのプルダウンは, ステートマシンで遷移可能なステータスのみ表示する.
   404	     */
   405	    public function addOrderStatusForm(FormEvent $event): void
   406	    {
   407	        /** @var Order|null $Order */
   408	        $Order = $event->getData();
   409	        if (null === $Order || null === $Order->getId()) {
   410	            return;
   411	        }
   412	
   413	        /** @var OrderStatus[] $OrderStatuses */
   414	        $OrderStatuses = $this->orderStatusRepository->findBy([], ['sort_no' => 'ASC']);
   415	        $OrderStatuses = new ArrayCollection($OrderStatuses);
   416	
   417	        foreach ($OrderStatuses as $Status) {
   418	            // 同一ステータスはスキップ
   419	            if ($Order->getOrderStatus()->getId() == $Status->getId()) {
   420	                continue;
   421	            }
   422	            // 遷移できないステータスはリストから除外する.
   423	            if (!$this->orderStateMachine->can($Order, $Status)) {
   424	                $OrderStatuses->removeElement($Status);
   425	            }
   426	        }
   427	
   428	        $form = $event->getForm();
   429	        $form->add('OrderStatus', EntityType::class, [
   430	            'class' => OrderStatus::class,
   431	            'choices' => $OrderStatuses,
   432	            'choice_label' => 'name',
   433	            'constraints' => [
   434	                new Assert\NotBlank(),
   435	            ],
   436	            // 変更前後のステータスチェックが必要なのでmapped => false で定義する.
   437	            'mapped' => false,
   438	            'data' => $Order->getOrderStatus(),
   439	        ]);
   440	    }
   441	
   442	    /**
   443	     * 単一配送時に, Shippingのフォームを追加する.
   444	     * 複数配送時はShippingの編集は行わない.
   445	     */
   446	    public function addShippingForm(FormEvent $event): void
   447	    {
   448	        /** @var Order|null $Order */
   449	        $Order = $event->getData();
   450	
   451	        // 複数配送時はShippingの編集は行わない
   452	        if ($Order && $Order->isMultiple()) {
   453	            return;
   454	        }
   455	
   456	        $data = $Order ? $Order->getShippings()->first() : null;
   457	        $form = $event->getForm();
   458	        $form->add('Shipping', ShippingType::class, [
   459	            'mapped' => false,
   460	            'data' => $data,
   461	        ]);
   462	    }
   463	
   464	    /**
   465	     * フォームからPOSTされない情報をコピーする.
   466	     *
   467	     * - 支払方法の名称
   468	     * - 会員の性別/職業/誕生日
   469	     * - 受注ステータス(新規登録時)
   470	     */
   471	    public function copyFields(FormEvent $event): void
   472	    {
   473	        /** @var Order $Order */
   474	        $Order = $event->getData();
   475	
   476	        // 支払方法の名称をコピーする.
   477	        if ($Payment = $Order->getPayment()) {
   478	            $Order->setPaymentMethod($Payment->getMethod());
   479	        }
   480	
   481	        // 新規登録時は, 新規受付ステータスで登録する.
   482	        if (null === $Order->getOrderStatus()) {
   483	            $Order->setOrderStatus($this->orderStatusRepository->find(OrderStatus::NEW));
   484	            // 会員受注の場合、会員の性別/職業/誕生日をエンティティにコピーする
   485	            if ($Customer = $Order->getCustomer()) {
   486	                $Order->setSex($Customer->getSex());
   487	                $Order->setJob($Customer->getJob());
   488	                $Order->setBirth($Customer->getBirth());
   489	            }
   490	        } else {
   491	            // 編集時は, mapped => falseで定義しているため, フォームから変更後データを取得する.
   492	            $form = $event->getForm();
   493	            $Order->setOrderStatus($form['OrderStatus']->getData());
   494	        }
   495	
   496	        // 新規登録時は受注日を登録する.
   497	        if (null === $Order->getOrderDate()) {
   498	            $Order->setOrderDate(new \DateTime());
   499	        }
   500	    }
   501	
   502	    /**
   503	     * 受注ステータスのバリデーションを行う.
   504	     */
   505	    public function validateOrderStatus(FormEvent $event): void
   506	    {
   507	        /** @var Order $Order */
   508	        $Order = $event->getData();
   509	        if (!$Order->getId()) {
   510	            return;
   511	        }
   512	
   513	        $form = $event->getForm();
   514	        if (!$form['OrderStatus']->isValid()) {
   515	            return;
   516	        }
   517	        // mapped => falseで定義しているため, Orderのステータスは変更されない
   518	        $oldStatus = $Order->getOrderStatus();
   519	        // 変更後のステータスはFormから直接取得する.
   520	        $newStatus = $form['OrderStatus']->getData();
   521	
   522	        // ステータスに変更があった場合のみチェックする.
   523	        if ($oldStatus->getId() != $newStatus->getId()) {
   524	            if (!$this->orderStateMachine->can($Order, $newStatus)) {
   525	                $form['OrderStatus']->addError(
   526	                    new FormError(trans('admin.order.failed_to_change_status__short', [
   527	                        '%from%' => $oldStatus->getName(),
   528	                        '%to%' => $newStatus->getName(),
   529	                    ]))
   530	                );
   531	            }
   532	        }
   533	    }
   534	
   535	    /**
   536	     * 受注明細のバリデーションを行う.
   537	     * 商品明細が1件も登録されていない場合はエラーとする.
   538	     */
   539	    public function validateOrderItems(FormEvent $event): void
   540	    {
   541	        /** @var Order $Order */
   542	        $Order = $event->getData();
   543	        $OrderItems = $Order->getOrderItems();
   544	
   545	        $count = 0;
   546	        foreach ($OrderItems as $OrderItem) {
   547	            if ($OrderItem->isProduct()) {
   548	                $count++;
   549	            }
   550	        }
   551	        // 商品明細が1件もない場合はエラーとする.
   552	        if ($count < 1) {
   553	            // 画面下部にエラーメッセージを表示させる
   554	            $form = $event->getForm();
   555	            $form['OrderItemsErrors']->addError(new FormError(trans('admin.order.product_item_not_found')));
   556	        }
   557	    }
   558	
   559	    /**
   560	     * 受注明細と, Order/Shippingの紐付けを行う.

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php | sed -n '1480,1740p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php | sed -n '1160,1480p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
  1160	
  1161	            /** @var Customer[] $Customers */
  1162	            $Customers = $pagination->getItems();
  1163	
  1164	            if (empty($Customers)) {
  1165	                log_debug('search customer not found.');
  1166	            }
  1167	
  1168	            $data = [];
  1169	            $formatName = '%s%s(%s%s)';
  1170	            foreach ($Customers as $Customer) {
  1171	                $data[] = [
  1172	                    'id' => $Customer->getId(),
  1173	                    'name' => sprintf(
  1174	                        $formatName,
  1175	                        $Customer->getName01(),
  1176	                        $Customer->getName02(),
  1177	                        $Customer->getKana01(),
  1178	                        $Customer->getKana02()
  1179	                    ),
  1180	                    'phone_number' => $Customer->getPhoneNumber(),
  1181	                    'email' => $Customer->getEmail(),
  1182	                ];
  1183	            }
  1184	
  1185	            $event = new EventArgs(
  1186	                [
  1187	                    'data' => $data,
  1188	                    'Customers' => $pagination,
  1189	                ],
  1190	                $request
  1191	            );
  1192	            $this->eventDispatcher->dispatch($event, EccubeEvents::ADMIN_ORDER_EDIT_SEARCH_CUSTOMER_COMPLETE);
  1193	            $data = $event->getArgument('data');
  1194	
  1195	            return [
  1196	                'data' => $data,
  1197	                'pagination' => $pagination,
  1198	                'nonce' => $request->get('nonce'),
  1199	            ];
  1200	        }
  1201	
  1202	        throw new BadRequestHttpException();
  1203	    }
  1204	
  1205	    /**
  1206	     * 顧客情報を検索する.
  1207	     */
  1208	    #[Route(path: '/%eccube_admin_route%/order/search/customer/id', name: 'admin_order_search_customer_by_id', methods: ['POST'])]
  1209	    public function searchCustomerById(Request $request): JsonResponse
  1210	    {
  1211	        if ($request->isXmlHttpRequest() && $this->isTokenValid()) {
  1212	            log_debug('search customer by id start.');
  1213	
  1214	            /** @var Customer|null $Customer */
  1215	            $Customer = $this->customerRepository
  1216	                ->find($request->get('id'));
  1217	
  1218	            $event = new EventArgs(
  1219	                [
  1220	                    'Customer' => $Customer,
  1221	                ],
  1222	                $request
  1223	            );
  1224	            $this->eventDispatcher->dispatch($event, EccubeEvents::ADMIN_ORDER_EDIT_SEARCH_CUSTOMER_BY_ID_INITIALIZE);
  1225	
  1226	            if (is_null($Customer)) {
  1227	                log_debug('search customer by id not found.');
  1228	
  1229	                return $this->json([], 404);
  1230	            }
  1231	
  1232	            log_debug('search customer by id found.');
  1233	
  1234	            $data = [
  1235	                'id' => $Customer->getId(),
  1236	                'name01' => $Customer->getName01(),
  1237	                'name02' => $Customer->getName02(),
  1238	                'kana01' => $Customer->getKana01(),
  1239	                'kana02' => $Customer->getKana02(),
  1240	                'postal_code' => $Customer->getPostalCode(),
  1241	                'pref' => is_null($Customer->getPref()) ? null : $Customer->getPref()->getId(),
  1242	                'addr01' => $Customer->getAddr01(),
  1243	                'addr02' => $Customer->getAddr02(),
  1244	                'email' => $Customer->getEmail(),
  1245	                'phone_number' => $Customer->getPhoneNumber(),
  1246	                'company_name' => $Customer->getCompanyName(),
  1247	            ];
  1248	
  1249	            $event = new EventArgs(
  1250	                [
  1251	                    'data' => $data,
  1252	                    'Customer' => $Customer,
  1253	                ],
  1254	                $request
  1255	            );
  1256	            $this->eventDispatcher->dispatch($event, EccubeEvents::ADMIN_ORDER_EDIT_SEARCH_CUSTOMER_BY_ID_COMPLETE);
  1257	            $data = $event->getArgument('data');
  1258	
  1259	            return $this->json($data);
  1260	        }
  1261	
  1262	        throw new BadRequestHttpException();
  1263	    }
  1264	
  1265	    /**
  1266	     * その他明細情報を取得
  1267	     *
  1268	     * @return array<string, array<int, array<string, OrderItemType|TaxType|null>>>
  1269	     *
  1270	     * @throws BadRequestHttpException
  1271	     */
  1272	    #[Route(path: '/%eccube_admin_route%/order/search/order_item_type', name: 'admin_order_search_order_item_type', methods: ['POST'])]
  1273	    #[Template(template: '@admin/Order/order_item_type.twig')]
  1274	    public function searchOrderItemType(Request $request): array
  1275	    {
  1276	        if ($request->isXmlHttpRequest() && $this->isTokenValid()) {
  1277	            log_debug('search order item type start.');
  1278	
  1279	            $Charge = $this->entityManager->find(OrderItemType::class, OrderItemType::CHARGE);
  1280	            $DeliveryFee = $this->entityManager->find(OrderItemType::class, OrderItemType::DELIVERY_FEE);
  1281	            $Discount = $this->entityManager->find(OrderItemType::class, OrderItemType::DISCOUNT);
  1282	
  1283	            $NonTaxable = $this->entityManager->find(TaxType::class, TaxType::NON_TAXABLE);
  1284	            $Taxation = $this->entityManager->find(TaxType::class, TaxType::TAXATION);
  1285	
  1286	            $OrderItemTypes = [
  1287	                ['OrderItemType' => $Charge, 'TaxType' => $Taxation],
  1288	                ['OrderItemType' => $DeliveryFee, 'TaxType' => $Taxation],
  1289	                ['OrderItemType' => $Discount, 'TaxType' => $Taxation],
  1290	                ['OrderItemType' => $Discount, 'TaxType' => $NonTaxable],
  1291	            ];
  1292	
  1293	            return [
  1294	                'OrderItemTypes' => $OrderItemTypes,
  1295	                'nonce' => $request->get('nonce'),
  1296	            ];
  1297	        }
  1298	
  1299	        throw new BadRequestHttpException();
  1300	    }
  1301	
  1302	    /**
  1303	     * 納品書を印刷.
  1304	     *
  1305	     * @param Request $request リクエスト
  1306	     * @param int $id 受注ID
  1307	     *
  1308	     * @return array<string, mixed>|Response
  1309	     *
  1310	     * @throws NotFoundHttpException
  1311	     */
  1312	    #[Route(path: '/%eccube_admin_route%/order/{id}/print/delivery', name: 'admin_order_print_delivery_slips', requirements: ['id' => '\d+'], methods: ['GET'])]
  1313	    public function printDeliverySlip(Request $request, int $id): array|Response
  1314	    {
  1315	        $Order = $this->orderRepository->find($id);
  1316	
  1317	        if ($Order === null) {
  1318	            throw new NotFoundHttpException();
  1319	        }
  1320	
  1321	        $lang = 'ja';
  1322	        $Shippings = $Order->getShippings();
  1323	        if ($Shippings->isEmpty()) {
  1324	            throw new NotFoundHttpException();
  1325	        }
  1326	
  1327	        $Shipping = $Shippings->first();
  1328	        $Country = $Shipping->getCountry();
  1329	        if ($Country !== null) {
  1330	            $lang = $Country->isJapan() ? 'ja' : 'en';
  1331	        }
  1332	
  1333	        $DeliverySlips = $this->dtbShippingStandbyRepository->generateDeliverySlips($lang !== 'ja', [$Shipping->getId()]);
  1334	        $BaseInfo = $this->baseInfoRepository->getMallBaseInfo();
  1335	
  1336	        return $this->render("@admin/ShippingStandby/delivery_slips.{$lang}.twig", [
  1337	            'DeliverySlips' => $DeliverySlips,
  1338	            'BaseInfo' => $BaseInfo,
  1339	        ]);
  1340	    }
  1341	}

exec
/bin/bash -lc 'rg -n "class ShippingType|tracking_number|DeliveryTime|shipping_delivery_date|abroad_postal" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderItemType.php' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:20:use Eccube\Entity\DeliveryTime;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:30:use Eccube\Repository\DeliveryTimeRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:47:class ShippingType extends AbstractType
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:57:        protected DeliveryTimeRepository $deliveryTimeRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:185:            ->add('shipping_delivery_date', DateType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:197:            ->add('tracking_number', TextType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:237:            ->add('abroad_postal_code', TextType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:240:                    new Assert\Length(max: $this->eccubeConfig['eccube_abroad_postal_code_len']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:255:                $DeliveryTime = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:257:                    $DeliveryTime = $this->deliveryTimeRepository->find($timeId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:261:                $form->add('DeliveryTime', EntityType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:262:                    'class' => DeliveryTime::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:263:                    'choice_label' => fn (DeliveryTime $DeliveryTime) => $DeliveryTime->isVisible()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:264:                        ? $DeliveryTime->getDeliveryTime()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:265:                        : $DeliveryTime->getDeliveryTime().trans('admin.common.hidden_label'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:268:                    'data' => $DeliveryTime,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:299:                $form->remove('DeliveryTime');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:300:                $form->add('DeliveryTime', EntityType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:301:                    'class' => DeliveryTime::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:323:                $DeliveryTime = $form['DeliveryTime']->getData();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:324:                if ($DeliveryTime) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:325:                    $Shipping->setShippingDeliveryTime($DeliveryTime->getDeliveryTime());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:326:                    $Shipping->setTimeId($DeliveryTime->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:328:                    $Shipping->setShippingDeliveryTime(null);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:349:                    if (empty($form->get('abroad_postal_code')->getData())) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:350:                        $form->get('abroad_postal_code')->addError(new FormError(trans('form.type.abroad_postal_code.invalid', [], 'validators')));

codex
フォーム側も確認し、設計の入力項目・バリデーションの記述と概ね対応していることを見ました。追加の見落とし候補は「出荷完了時の受注本体 shipping_date」の差分が最も根拠明確です。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php | sed -n '560,680p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   560	     * 受注明細と, Order/Shippingの紐付けを行う.
   561	     */
   562	    public function associateOrderAndShipping(FormEvent $event): void
   563	    {
   564	        /** @var Order $Order */
   565	        $Order = $event->getData();
   566	        $OrderItems = $Order->getOrderItems();
   567	
   568	        // 明細とOrder, Shippingを紐付ける.
   569	        // 新規の明細のみが対象, 更新時はスキップする.
   570	        foreach ($OrderItems as $OrderItem) {
   571	            // 更新時はスキップ
   572	            if ($OrderItem->getId()) {
   573	                continue;
   574	            }
   575	
   576	            $OrderItem->setOrder($Order);
   577	
   578	            // 送料明細の紐付けを行う.
   579	            // 複数配送の場合は, 常に最初のShippingと紐付ける.
   580	            // Order::getShippingsは氏名でソートされている.
   581	            if ($OrderItem->isDeliveryFee()) {
   582	                $OrderItem->setShipping($Order->getShippings()->first());
   583	            }
   584	
   585	            // 商品明細の紐付けを行う.
   586	            // 複数配送時は, 明細の追加は行われないためスキップする.
   587	            if ($OrderItem->isProduct() && !$Order->isMultiple()) {
   588	                $OrderItem->setShipping($Order->getShippings()->first());
   589	            }
   590	        }
   591	    }
   592	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php | sed -n '1,380p'" in /home/y-saito/Developments/hareruya-design-docs
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
    14	namespace Eccube\Form\Type\Admin;
    15	
    16	use Doctrine\ORM\EntityRepository;
    17	use Eccube\Common\EccubeConfig;
    18	use Eccube\Entity\BaseInfo;
    19	use Eccube\Entity\Delivery;
    20	use Eccube\Entity\DeliveryTime;
    21	use Eccube\Entity\Master\Country;
    22	use Eccube\Entity\Shipping;
    23	use Eccube\Form\Type\AddressType;
    24	use Eccube\Form\Type\KanaType;
    25	use Eccube\Form\Type\NameType;
    26	use Eccube\Form\Type\SplitPhoneNumberType;
    27	use Eccube\Form\Type\SplitPostalType;
    28	use Eccube\Repository\BaseInfoRepository;
    29	use Eccube\Repository\DeliveryRepository;
    30	use Eccube\Repository\DeliveryTimeRepository;
    31	use Eccube\Util\StringUtil;
    32	use Symfony\Bridge\Doctrine\Form\Type\EntityType;
    33	use Symfony\Component\Form\AbstractType;
    34	use Symfony\Component\Form\Extension\Core\Type\CheckboxType;
    35	use Symfony\Component\Form\Extension\Core\Type\CollectionType;
    36	use Symfony\Component\Form\Extension\Core\Type\DateType;
    37	use Symfony\Component\Form\Extension\Core\Type\TextareaType;
    38	use Symfony\Component\Form\Extension\Core\Type\TextType;
    39	use Symfony\Component\Form\Form;
    40	use Symfony\Component\Form\FormBuilderInterface;
    41	use Symfony\Component\Form\FormError;
    42	use Symfony\Component\Form\FormEvent;
    43	use Symfony\Component\Form\FormEvents;
    44	use Symfony\Component\OptionsResolver\OptionsResolver;
    45	use Symfony\Component\Validator\Constraints as Assert;
    46	
    47	class ShippingType extends AbstractType
    48	{
    49	    protected BaseInfo $BaseInfo;
    50	
    51	    /**
    52	     * ShippingType constructor.
    53	     */
    54	    public function __construct(
    55	        protected EccubeConfig $eccubeConfig,
    56	        protected DeliveryRepository $deliveryRepository,
    57	        protected DeliveryTimeRepository $deliveryTimeRepository,
    58	        BaseInfoRepository $baseInfoRepository,
    59	    ) {
    60	        $this->BaseInfo = $baseInfoRepository->get();
    61	    }
    62	
    63	    /**
    64	     * {@inheritdoc}
    65	     *
    66	     * @param array<string, mixed> $options
    67	     */
    68	    #[\Override]
    69	    public function buildForm(FormBuilderInterface $builder, array $options): void
    70	    {
    71	        $Shipping = $options['data'];
    72	
    73	        $builder
    74	            ->add('name', NameType::class, [
    75	                'required' => false,
    76	                'options' => [
    77	                    'constraints' => [
    78	                        new Assert\NotBlank(),
    79	                    ],
    80	                ],
    81	            ])
    82	            ->add('kana', KanaType::class, [
    83	                'required' => false,
    84	            ])
    85	            ->add('company_name', TextType::class, [
    86	                'required' => false,
    87	                'constraints' => [
    88	                    new Assert\Length(max: $this->eccubeConfig['eccube_stext_len']),
    89	                ],
    90	            ])
    91	            ->add('postalCode', SplitPostalType::class, [
    92	                'mapped' => false,
    93	                'required' => false,
    94	                'initial_postal_code' => $Shipping?->getPostalCode(),
    95	            ])
    96	            ->add('address', AddressType::class, [
    97	                'required' => false,
    98	                'pref_options' => [
    99	                    'constraints' => [
   100	                        new Assert\NotBlank(),
   101	                    ],
   102	                    'attr' => ['class' => 'p-region-id'],
   103	                ],
   104	                'addr01_options' => [
   105	                    'constraints' => [
   106	                        new Assert\NotBlank(),
   107	                        new Assert\Length(max: $this->eccubeConfig['eccube_mtext_len']),
   108	                    ],
   109	                    'attr' => [
   110	                        'class' => 'p-locality p-street-address',
   111	                        'placeholder' => 'admin.common.address_sample_01',
   112	                    ],
   113	                ],
   114	                'addr02_options' => [
   115	                    'required' => false,
   116	                    'constraints' => [
   117	                        new Assert\NotBlank(),
   118	                        new Assert\Length(max: $this->eccubeConfig['eccube_mtext_len']),
   119	                    ],
   120	                    'attr' => [
   121	                        'class' => 'p-extended-address',
   122	                        'placeholder' => 'admin.common.address_sample_02',
   123	                    ],
   124	                ],
   125	                'addr03_options' => [
   126	                    'required' => false,
   127	                    'constraints' => [
   128	                        new Assert\Length(max: $this->eccubeConfig['eccube_mtext_len']),
   129	                    ],
   130	                    'attr' => [
   131	                        'class' => 'p-extended-address',
   132	                        'placeholder' => 'admin.common.address_sample_03',
   133	                    ],
   134	                ],
   135	            ])
   136	            ->add('tel', SplitPhoneNumberType::class, [
   137	                'tel01_options' => [
   138	                    'required' => true,
   139	                    'constraints' => [
   140	                        new Assert\NotBlank(),
   141	                        new Assert\Type(type: 'numeric', message: 'form_error.numeric_only'),
   142	                        new Assert\Length([
   143	                            'max' => $this->eccubeConfig['eccube_split_tel_len_max'],
   144	                            'min' => $this->eccubeConfig['eccube_split_tel_len_min'],
   145	                        ]),
   146	                    ],
   147	                ],
   148	                'tel02_options' => [
   149	                    'required' => true,
   150	                    'constraints' => [
   151	                        new Assert\NotBlank(),
   152	                        new Assert\Type(type: 'numeric', message: 'form_error.numeric_only'),
   153	                        new Assert\Length([
   154	                            'max' => $this->eccubeConfig['eccube_split_tel_len_max'],
   155	                            'min' => $this->eccubeConfig['eccube_split_tel_len_min'],
   156	                        ]),
   157	                    ],
   158	                ],
   159	                'tel03_options' => [
   160	                    'required' => true,
   161	                    'constraints' => [
   162	                        new Assert\NotBlank(),
   163	                        new Assert\Type(type: 'numeric', message: 'form_error.numeric_only'),
   164	                        new Assert\Length([
   165	                            'max' => $this->eccubeConfig['eccube_split_tel_len_max'],
   166	                            'min' => $this->eccubeConfig['eccube_split_tel_len_min'],
   167	                        ]),
   168	                    ],
   169	                ],
   170	            ])
   171	            ->add('Delivery', EntityType::class, [
   172	                'required' => false,
   173	                'class' => Delivery::class,
   174	                'choice_label' => fn (Delivery $Delivery) => $Delivery->isVisible()
   175	                    ? $Delivery->getServiceName()
   176	                    : $Delivery->getServiceName().trans('admin.common.hidden_label'),
   177	                'query_builder' => fn ($er) => $er->createQueryBuilder('d')
   178	                    ->orderBy('d.visible', 'DESC') // 非表示は下に配置
   179	                    ->addOrderBy('d.sort_no', 'ASC'),
   180	                'placeholder' => false,
   181	                'constraints' => [
   182	                    new Assert\NotBlank(),
   183	                ],
   184	            ])
   185	            ->add('shipping_delivery_date', DateType::class, [
   186	                'placeholder' => '',
   187	                'required' => false,
   188	                'input' => 'datetime',
   189	                'widget' => 'single_text',
   190	                'constraints' => [
   191	                    new Assert\Range([
   192	                        'min' => '0003-01-01',
   193	                        'minMessage' => 'form_error.out_of_range',
   194	                    ]),
   195	                ],
   196	            ])
   197	            ->add('tracking_number', TextType::class, [
   198	                'required' => false,
   199	                'constraints' => [
   200	                    new Assert\Length(max: $this->eccubeConfig['eccube_mtext_len']),
   201	                    new Assert\Regex(
   202	                        pattern: '/^[0-9a-zA-Z-]+$/u',
   203	                        message: 'form_error.graph_and_hyphen_only'
   204	                    ),
   205	                ],
   206	            ])
   207	            ->add('note', TextareaType::class, [
   208	                'required' => false,
   209	                'constraints' => [
   210	                    new Assert\Length(max: $this->eccubeConfig['eccube_ltext_len']),
   211	                ],
   212	            ])
   213	            ->add('OrderItems', CollectionType::class, [
   214	                'entry_type' => OrderItemType::class,
   215	                'allow_add' => true,
   216	                'allow_delete' => true,
   217	                'prototype' => true,
   218	            ])
   219	            // 明細業のエラー表示用
   220	            ->add('OrderItemsErrors', TextType::class, [
   221	                'mapped' => false,
   222	            ])
   223	            ->add('notify_email', CheckboxType::class, [
   224	                'mapped' => false,
   225	                'required' => false,
   226	                'data' => true,
   227	            ])
   228	            ->add('Country', EntityType::class, [
   229	                'class' => Country::class,
   230	                'choice_label' => 'name',
   231	                'mapped' => true,
   232	                'required' => true,
   233	                'constraints' => [
   234	                    new Assert\NotBlank(),
   235	                ],
   236	            ])
   237	            ->add('abroad_postal_code', TextType::class, [
   238	                'required' => false,
   239	                'constraints' => [
   240	                    new Assert\Length(max: $this->eccubeConfig['eccube_abroad_postal_code_len']),
   241	                ],
   242	            ])
   243	            ->addEventListener(FormEvents::POST_SET_DATA, function (FormEvent $event): void {
   244	                /** @var Shipping|null $data */
   245	                $data = $event->getData();
   246	                /** @var Form $form */
   247	                $form = $event->getForm();
   248	
   249	                if (!$data) {
   250	                    return;
   251	                }
   252	
   253	                $Delivery = $data->getDelivery();
   254	                $timeId = $data->getTimeId();
   255	                $DeliveryTime = null;
   256	                if ($timeId) {
   257	                    $DeliveryTime = $this->deliveryTimeRepository->find($timeId);
   258	                }
   259	
   260	                // お届け時間を配送業者で絞り込み
   261	                $form->add('DeliveryTime', EntityType::class, [
   262	                    'class' => DeliveryTime::class,
   263	                    'choice_label' => fn (DeliveryTime $DeliveryTime) => $DeliveryTime->isVisible()
   264	                        ? $DeliveryTime->getDeliveryTime()
   265	                        : $DeliveryTime->getDeliveryTime().trans('admin.common.hidden_label'),
   266	                    'placeholder' => 'common.select__unspecified',
   267	                    'required' => false,
   268	                    'data' => $DeliveryTime,
   269	                    'query_builder' => function (EntityRepository $er) use ($Delivery) {
   270	                        $qb = $er->createQueryBuilder('dt');
   271	                        $qb
   272	                            ->orderBy('dt.visible', 'DESC') // 非表示は下に配置
   273	                            ->addOrderBy('dt.sort_no', 'ASC');
   274	                        if ($Delivery) {
   275	                            $qb
   276	                                ->where('dt.Delivery = :Delivery')
   277	                                ->setParameter('Delivery', $Delivery);
   278	                        }
   279	
   280	                        return $qb;
   281	                    },
   282	                    'mapped' => false,
   283	                ]);
   284	            })
   285	            ->addEventListener(FormEvents::PRE_SUBMIT, function (FormEvent $event): void {
   286	                $data = $event->getData();
   287	                $form = $event->getForm();
   288	
   289	                if (!$data) {
   290	                    return;
   291	                }
   292	
   293	                $Delivery = null;
   294	                if (StringUtil::isNotBlank($data['Delivery'])) {
   295	                    $Delivery = $this->deliveryRepository->find($data['Delivery']);
   296	                }
   297	
   298	                // お届け時間を配送業者で絞り込み
   299	                $form->remove('DeliveryTime');
   300	                $form->add('DeliveryTime', EntityType::class, [
   301	                    'class' => DeliveryTime::class,
   302	                    'choice_label' => 'delivery_time',
   303	                    'placeholder' => 'common.select__unspecified',
   304	                    'required' => false,
   305	                    'query_builder' => function (EntityRepository $er) use ($Delivery) {
   306	                        $qb = $er->createQueryBuilder('dt');
   307	                        if ($Delivery) {
   308	                            $qb
   309	                                ->where('dt.Delivery = :Delivery')
   310	                                ->setParameter('Delivery', $Delivery);
   311	                        }
   312	
   313	                        return $qb;
   314	                    },
   315	                    'mapped' => false,
   316	                ]);
   317	            })
   318	            ->addEventListener(FormEvents::POST_SUBMIT, function (FormEvent $event): void {
   319	                $form = $event->getForm();
   320	                $Shipping = $event->getData();
   321	                $Delivery = $Shipping->getDelivery();
   322	                $Shipping->setShippingDeliveryName($Delivery ? $Delivery->getName() : null);
   323	                $DeliveryTime = $form['DeliveryTime']->getData();
   324	                if ($DeliveryTime) {
   325	                    $Shipping->setShippingDeliveryTime($DeliveryTime->getDeliveryTime());
   326	                    $Shipping->setTimeId($DeliveryTime->getId());
   327	                } else {
   328	                    $Shipping->setShippingDeliveryTime(null);
   329	                    $Shipping->setTimeId(null);
   330	                }
   331	
   332	                $Country = $Shipping->getCountry();
   333	
   334	                if ($Country === null) {
   335	                    return;
   336	                }
   337	
   338	                if ($Country->isJapan()) {
   339	                    $zip1 = $form->get('postalCode')->get('postalCode01')->getData() ?: '';
   340	                    $zip2 = $form->get('postalCode')->get('postalCode02')->getData() ?: '';
   341	                    if (empty($zip1)) {
   342	                        $form['postalCode']['postalCode01']->addError(new FormError(trans('form.type.select.notselect', [], 'validators')));
   343	                    }
   344	                    if (empty($zip2)) {
   345	                        $form['postalCode']['postalCode02']->addError(new FormError(trans('form.type.select.notselect', [], 'validators')));
   346	                    }
   347	                    $Shipping->setPostalCode($zip1.$zip2);
   348	                } else {
   349	                    if (empty($form->get('abroad_postal_code')->getData())) {
   350	                        $form->get('abroad_postal_code')->addError(new FormError(trans('form.type.abroad_postal_code.invalid', [], 'validators')));
   351	                    }
   352	                }
   353	            })
   354	            ->addEventListener(FormEvents::POST_SUBMIT, function (FormEvent $event): void {
   355	                // 出荷編集画面のみバリデーションをする。
   356	                if ($event->getForm()->getParent()->getName() != 'shippings') {
   357	                    return;
   358	                }
   359	
   360	                /** @var Shipping $Shipping */
   361	                $Shipping = $event->getData();
   362	                $OrderItems = $Shipping->getOrderItems();
   363	
   364	                $count = 0;
   365	                foreach ($OrderItems as $OrderItem) {
   366	                    if ($OrderItem->isProduct()) {
   367	                        $count++;
   368	                    }
   369	                }
   370	                // 商品明細が1件もない場合はエラーとする.
   371	                if ($count < 1) {
   372	                    // 画面下部にエラーメッセージを表示させる
   373	                    $form = $event->getForm();
   374	                    $form['OrderItemsErrors']->addError(new FormError(trans('admin.order.product_item_not_found')));
   375	                }
   376	            });
   377	    }
   378	
   379	    /**
   380	     * {@inheritdoc}

exec
/bin/bash -lc 'rg -n "shippingDate|shipping_date|setShippingDate|getShippingDate" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:626:                                $Shipping->setShippingDate(new \DateTime());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:776:            $TargetOrder->setShippingDate($now);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:778:                $Shipping->setShippingDate($now);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:906:            case 'shipping_date':
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:908:                $TargetOrder->setShippingDate(null);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:910:                    $Shipping->setShippingDate(null);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:60:     * @method \DateTime|null getShippingDate()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:61:     * @method Order setShippingDate(?\DateTime $shippingDate)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:672:        #[ORM\Column(name: 'shipping_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '出荷日'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:673:        private ?\DateTime $shippingDate = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1852:        public function setShippingDate(?\DateTime $shippingDate): Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1854:            $this->shippingDate = $shippingDate;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1859:        public function getShippingDate(): ?\DateTime
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1861:            return $this->shippingDate;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:114:        #[ORM\Column(name: 'shipping_date', type: Types::DATETIMETZ_MUTABLE, nullable: true)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:115:        private $shipping_date;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:439:         * Set shippingDate.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:441:        public function setShippingDate(?\DateTime $shippingDate = null): Shipping
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:443:            $this->shipping_date = $shippingDate;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:449:         * Get shippingDate.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:451:        public function getShippingDate(): ?\DateTime
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:453:            return $this->shipping_date;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:703:            return !is_null($this->shipping_date);

codex
種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応
---|---|---|---|---
MISSED | ② 業務ルール・計算 / DB操作 | 登録経路で「出荷完了」へ変更した場合、設計は未出荷の配送に出荷日時を立てるのみだが、実装も登録経路では `Shipping` だけを更新し、受注本体 `Order.shipping_date` は更新しない。一方、`status_change` 経路は受注本体と全配送の両方を更新する。findingsに未記載。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-11_admin_order_order_edit.html:244` は登録経路で「未出荷の配送に出荷日時」。同 `:246` はstatus_changeで「受注および全配送」。実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:623-628` は登録経路で `Shipping->setShippingDate()` のみ、`:775-779` はstatus_changeで `TargetOrder->setShippingDate()` と `Shipping->setShippingDate()`。 | 登録経路で受注本体出荷日を更新しないことを仕様差分として追加する。業務上、一覧・検索・帳票が `dtb_order.shipping_date` を見るなら重要度はmed以上。
SEVERITY | ② 業務ルール・計算（ポイント） | キャンセル時の `cancelOrderPoints()` 追加挙動は会員ポイント残高に直接影響するため、候補のmedは妥当からやや低め。少なくともlowではない。 | 実装: `EditController.php:636-637`, `:815-816`。設計: HTML `:244`, `:246` は出荷完了時の `gainPoints` のみで取消ポイント処理は未記載。 | med維持、またはポイント残高を正とする業務影響としてhighへ引き上げ検討。
SEVERITY | ② 業務ルール・計算（ポイント再計算の例外） | キャンセル時に獲得ポイントを0固定する差分は、確定ポイント値と会員残高取消処理に絡むためlowは軽すぎる可能性がある。 | 実装: `EditController.php:955-962`。設計: HTML `:258` は支払方法名・小計・割合変化による再計算条件のみ。 | medへ引き上げを推奨。

FALSE_POSITIVEは確認されませんでした。各findingのdesignRef/implRefはいずれも実在し、引用の主要部も確認できました。WEAK_EVIDENCEも確認されませんでした。

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正
tokens used
80,135
種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応
---|---|---|---|---
MISSED | ② 業務ルール・計算 / DB操作 | 登録経路で「出荷完了」へ変更した場合、設計は未出荷の配送に出荷日時を立てるのみだが、実装も登録経路では `Shipping` だけを更新し、受注本体 `Order.shipping_date` は更新しない。一方、`status_change` 経路は受注本体と全配送の両方を更新する。findingsに未記載。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-11_admin_order_order_edit.html:244` は登録経路で「未出荷の配送に出荷日時」。同 `:246` はstatus_changeで「受注および全配送」。実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:623-628` は登録経路で `Shipping->setShippingDate()` のみ、`:775-779` はstatus_changeで `TargetOrder->setShippingDate()` と `Shipping->setShippingDate()`。 | 登録経路で受注本体出荷日を更新しないことを仕様差分として追加する。業務上、一覧・検索・帳票が `dtb_order.shipping_date` を見るなら重要度はmed以上。
SEVERITY | ② 業務ルール・計算（ポイント） | キャンセル時の `cancelOrderPoints()` 追加挙動は会員ポイント残高に直接影響するため、候補のmedは妥当からやや低め。少なくともlowではない。 | 実装: `EditController.php:636-637`, `:815-816`。設計: HTML `:244`, `:246` は出荷完了時の `gainPoints` のみで取消ポイント処理は未記載。 | med維持、またはポイント残高を正とする業務影響としてhighへ引き上げ検討。
SEVERITY | ② 業務ルール・計算（ポイント再計算の例外） | キャンセル時に獲得ポイントを0固定する差分は、確定ポイント値と会員残高取消処理に絡むためlowは軽すぎる可能性がある。 | 実装: `EditController.php:955-962`。設計: HTML `:258` は支払方法名・小計・割合変化による再計算条件のみ。 | medへ引き上げを推奨。

FALSE_POSITIVEは確認されませんでした。各findingのdesignRef/implRefはいずれも実在し、引用の主要部も確認できました。WEAK_EVIDENCEも確認されませんでした。

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正

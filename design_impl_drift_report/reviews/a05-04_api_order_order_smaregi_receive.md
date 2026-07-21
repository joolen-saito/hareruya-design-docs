OpenAI Codex v0.142.5
--------
workdir: /home/y-saito/Developments/hareruya-design-docs
model: gpt-5.5
provider: openai
approval: never
sandbox: read-only
reasoning effort: medium
reasoning summaries: none
session id: 019f26a6-36c5-7a52-99b5-cec72e7023a7
--------
user
あなたは設計書vs実装の差分監査に対する**批判的レビュア**です。読み取り専用で検証してください。創作禁止・確認できないものは「確認不能」と明記。

## 対象機能: a05-04_api_order_order_smaregi_receive
- 差分候補JSON(検証対象): /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/a05-04_api_order_order_smaregi_receive.json
- 設計書HTML(正): /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/a05-04_api_order_order_smaregi_receive.html
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
読み取り専用で、まず候補JSONと設計HTML、該当実装の参照位置を確認します。差分監査なので、引用の存在確認を優先してから実装側の周辺ルートを追います。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/a05-04_api_order_order_smaregi_receive.html | sed -n '1,260p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "sed -n '1,240p' /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/a05-04_api_order_order_smaregi_receive.json" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "pwd && rg --files /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3 /home/y-saito/Developments/ec-cube-enterprise/src/Eccube | sed -n '1,120p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 159ms:
     1	<!doctype html>
     2	<html lang="ja">
     3	<head>
     4	  <meta charset="utf-8">
     5	  <meta name="viewport" content="width=device-width, initial-scale=1">
     6	  <title>API 受注管理 — スマレジ受信処理（ポイント履歴取得） - 機能仕様書</title>
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
   183	<a class="lv2" href="#本書で扱うこと">本書で扱うこと</a>
   184	<a class="lv2" href="#本書で扱わないこと">本書で扱わないこと</a>
   185	<a class="lv2" href="#リニューアル移行時の扱い">リニューアル移行時の扱い</a>
   186	<a class="lv2" href="#用語">用語</a>
   187	<a class="lv2" href="#利用者視点の入口">利用者視点の入口</a>
   188	<a class="lv2" href="#認証・認可">認証・認可</a>
   189	<a class="lv2" href="#処理フロー">処理フロー</a>
   190	<a class="lv3" href="#スマレジ取引通知を取り込む-POST-locale-smaregi-transaction">スマレジ取引通知を取り込む（POST `/{_locale}/smaregi/transaction`）</a>
   191	<a class="lv2" href="#業務ルール・計算">業務ルール・計算</a>
   192	<a class="lv2" href="#入出力">入出力</a>
   193	<a class="lv3" href="#リクエスト">リクエスト</a>
   194	<a class="lv3" href="#レスポンス-成功">レスポンス（成功）</a>
   195	<a class="lv3" href="#レスポンス-失敗">レスポンス（失敗）</a>
   196	<a class="lv3" href="#サンプルレスポンス">サンプルレスポンス</a>
   197	<a class="lv3" href="#副作用">副作用</a>
   198	<a class="lv2" href="#バリデーション">バリデーション</a>
   199	<a class="lv2" href="#データ整合性">データ整合性</a>
   200	<a class="lv2" href="#DBカラム">DBカラム</a>
   201	<a class="lv3" href="#DB操作">DB操作</a>
   202	<a class="lv2" href="#権限・認可">権限・認可</a>
   203	<a class="lv2" href="#エラー処理">エラー処理</a>
   204	<a class="lv2" href="#ログ・監査">ログ・監査</a>
   205	<a class="lv3" href="#ログに出してはいけないもの">ログに出してはいけないもの</a>
   206	<a class="lv2" href="#排他制御・トランザクション">排他制御・トランザクション</a></nav>
   207	    </aside>
   208	    <main class="doc-content">
   209	      <header class="page-header">
   210	        <p class="crumb">Source:<br>/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/a05-04_api_order_order_smaregi_receive.md</p>
   211	        <h1>API 受注管理 — スマレジ受信処理（ポイント履歴取得）</h1>
   212	      </header>
   213	      <h2 id="概要">概要</h2>
   214	<p>スマレジが送信する取引情報の通知を受け取り、対象会員のポイントとポイント履歴を更新するためのAPIである。pf-eccube3のHareruyaEcプラグインが提供するJSON APIで、通知の区分（通常・取消・打消）に応じて会員ポイントの加減算、ポイント履歴の登録または取消、店頭注文の出荷完了反映を行い、支店コードの明細は支店システムのスマレジ受信APIへ転送する。取消・打消の処理では取引IDからポイント履歴を取得して巻き戻す。</p>
   215	<p>本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値はHareruyaEcプラグインのスマレジ取引取込処理、フロントのルート登録（ControllerProvider）、ポイント履歴テーブル・会員（プレイヤー）・注文サブ・オプションマスタ・ポイント区分マスタを正とする。</p>
   216	<p>本機能のカスタマイズ区分はカスタマイズで、挙動の参照リポはpf-eccube3（HareruyaEcプラグイン）とする。DB関連の記述（テーブル名・列名・永続化先）はec-cube-enterpriseを正とする。</p>
   217	<p>対象はJSON APIエンドポイントであり、ブラウザ向けの画面を持たない。本文ではフレームワークのコントローラ型名やメソッド名を主説明としない。「利用者視点の入口」にHTTPメソッドとパスパターンを書く。</p>
   218	<hr>
   219	<h2 id="本書で扱うこと">本書で扱うこと</h2>
   220	<ul><li>スマレジ取引通知の受信と、取引区分（通常・取消・打消）の判定</li><li>会員ポイントの加減算とポイント履歴の登録・取消</li><li>取消・打消時の、取引IDによるポイント履歴の取得と巻き戻し</li><li>対象店舗の明細による店頭注文の出荷完了反映</li><li>支店コードの明細の、支店システムのスマレジ受信APIへの転送と更新件数の合算</li></ul>
   221	<hr>
   222	<h2 id="本書で扱わないこと">本書で扱わないこと</h2>
   223	<p>以下は本書では仕様確定せず、実装または別機能の設計を正とする。</p>
   224	<ul><li>スマレジ側の取引登録・通知送信そのもの（外部システムの仕様を正とする）</li><li>出荷完了反映後の付与ポイントのスマレジ連携（スマレジ連携サービスの設計を正とする）</li><li>支店システム側のスマレジ受信API本体（支店システムの設計を正とする）</li><li>ポイント履歴の閲覧画面（管理画面・フロントのポイント履歴の設計を正とする）</li></ul>
   225	<hr>
   226	<h2 id="リニューアル移行時の扱い">リニューアル移行時の扱い</h2>
   227	<p>挙動は現行（pf-eccube3）を正とし、永続化に関わる記述は移行先（ec-cube-enterprise）を正とする。</p>
   228	<div class="table-wrap"><table><thead><tr><th>区分</th><th>現行（pf-eccube3）</th><th>移行先（ec-cube-enterprise）</th></tr></thead><tbody><tr><td>会員（プレイヤー）</td><td>dtb_player。スマレジ会員ID・保有ポイントを保持</td><td>dtb_player。スマレジ会員ID＝smaregi_id、保有ポイント＝point（ポイント残高）、顧客との関連＝customer_id。列名は移行先を正とする</td></tr><tr><td>ポイント履歴</td><td>dtb_point_history。ポイント増減・摘要・発生日・ポイント区分・取引IDを保持</td><td>dtb_point_history。ポイント増減＝point_change、摘要＝note、発生日＝issue_date、ポイント区分＝point_type_id、取引ID＝transaction_id。取消・打消はtransaction_idで特定</td></tr><tr><td>オプションマスタ</td><td>mtb_option</td><td>同一スキーマ（mtb_option）</td></tr><tr><td>ポイント区分マスタ</td><td>mtb_point_type</td><td>同一スキーマ（mtb_point_type。移行先のpoint_type_idはポイント属性IDの呼称）</td></tr><tr><td>注文サブ（出荷完了反映先）</td><td>dtb_order_sub。スマレジコード・出荷日・担当者・付与ポイント等を保持</td><td>ec-cube-enterpriseには注文サブ（dtb_order_sub）に対応するエンティティが見当たらない。出荷完了反映の永続化先はec-cube-enterprise実装で要確認とする</td></tr></tbody></table></div>
   229	<p>ポイント加減算・取消・打消の取引ID基準の巻き戻しと、店舗コードによる支店転送の挙動は現行（pf-eccube3）を正とする。出荷完了反映の対象表が移行先で変わる場合があるため、永続化先はec-cube-enterprise実装で要確認とする。</p>
   230	<hr>
   231	<h2 id="用語">用語</h2>
   232	<div class="table-wrap"><table><thead><tr><th>用語</th><th>説明</th></tr></thead><tbody><tr><td>取引情報</td><td>スマレジから送信される売上の取引データ。取引ヘッダと取引明細を含む。</td></tr><tr><td>取引区分</td><td>通知の種別。通常取引・取消・打消レコードを区別する。</td></tr><tr><td>会員（プレイヤー）</td><td>スマレジ会員IDで照合する晴れる屋会員。ポイントの加減算対象。</td></tr><tr><td>ポイント履歴</td><td>会員のポイント増減を記録する明細。取引IDを保持し、取消・打消の特定に用いる。</td></tr><tr><td>支店コード</td><td>商品コードの一部に含まれる店舗識別。自店舗以外は支店システムへ転送する。</td></tr></tbody></table></div>
   233	<hr>
   234	<h2 id="利用者視点の入口">利用者視点の入口</h2>
   235	<div class="table-wrap"><table><thead><tr><th>入口</th><th>URLエンドポイント</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>スマレジ取引通知の受信</td><td><code>POST /{_locale}/smaregi/transaction</code></td><td>取引情報を受け取り、会員ポイントとポイント履歴を更新し、対象注文を出荷完了に反映し、更新件数を返す。</td></tr></tbody></table></div>
   236	<p>応答形式はJSON。呼び出し元はスマレジ（および支店システムへの転送経路）。フロントのルートは言語識別子<code>{_locale}</code>配下にマウントされる。</p>
   237	<hr>
   238	<h2 id="認証・認可">認証・認可</h2>
   239	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>認証方式</td><td>本APIは認証トークンを要求しない。フロントのファイアウォールは匿名アクセスを許可し、本パスにはログイン必須のアクセス制御を設定していない。</td></tr><tr><td>連携用ヘッダ</td><td>支店システムへの転送時に、受信したリクエストの<code>X_contract_id</code>・<code>X_access_token</code>ヘッダを転送先へ引き継ぐ。これらは本APIの呼び出し元認証ではなく、転送先のスマレジ受信APIに渡す資格情報として用いる。</td></tr><tr><td>認証失敗時</td><td>認証判定を行わないため、未認証でも処理を実行する。</td></tr><tr><td>認可</td><td>呼び出し元はスマレジおよび転送経路。利用者の資格情報による絞り込みは行わない。</td></tr></tbody></table></div>
   240	<p>連携用ヘッダの値は本書に記載しない。</p>
   241	<hr>
   242	<h2 id="処理フロー">処理フロー</h2>
   243	<h3 id="スマレジ取引通知を取り込む-POST-locale-smaregi-transaction">スマレジ取引通知を取り込む（POST <code>/{_locale}/smaregi/transaction</code>）</h3>
   244	<ol><li>リクエストボディの<code>params</code>をJSONとして解釈し、<code>data</code>配下のうち取引ヘッダと取引明細を抽出する。</li><li>オプションマスタからスマレジ店舗IDを取得し、3桁ゼロ埋めの店舗コードに整形する。</li><li>取引区分を判定する。</li></ol>
   245	<ul><li>取消の場合は、会員ポイントを取消方向に補正し、取引IDに一致するポイント履歴を取得して削除する。</li><li>打消レコードの場合は、付与・利用ポイントの正負を反転したうえで取消と同様に補正し、対象履歴を削除する。</li><li>通常取引の場合は、会員ポイントを加減算し、付与・利用それぞれのポイント履歴を登録する。続いて取引明細の各行を処理し、商品コードの店舗コードが自店舗と一致する行は対象注文を出荷完了に反映する。一致しない行は支店分として記録する。</li></ul>
   246	<ol><li>支店分の明細がある場合は、受信ヘッダの連携用ヘッダを引き継ぎ、支店システムのスマレジ受信APIへ明細を転送する。転送結果に更新件数が含まれる場合は合算し、含まれない場合は転送エラーをログに記録する。</li><li>取引ヘッダの更新件数を合算した値を、更新件数として応答に組み立てて返す（HTTP 200）。</li></ol>
   247	<hr>
   248	<h2 id="業務ルール・計算">業務ルール・計算</h2>
   249	<div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>更新対象</td><td>リクエストで指定されたID・入力値に対応する業務データを対象にする。対象特定、入力不正、認証・認可の判定順序は処理フローとバリデーションの各節を正とする。</td></tr><tr><td>更新方法</td><td>入力値を対象データへ上書きまたは追加登録する。履歴登録や関連データ更新がある場合は入出力の副作用およびDBカラムの節を正とする。</td></tr><tr><td>計算処理</td><td>本APIでは金額・税・ポイント・在庫数量の再計算や丸めを行わない。ステータスやコメント等の更新は、実装で定義された遷移・存在確認・担当者判定に従う。</td></tr><tr><td>応答値</td><td>成功時は処理結果コードまたは更新後に取得した値を返す。レスポンス値は本API内で独自集計せず、保存結果または取得結果をJSON応答へ整形する。</td></tr></tbody></table></div>
   250	<hr>
   251	<h2 id="入出力">入出力</h2>
   252	<h3 id="リクエスト">リクエスト</h3>
   253	<div class="table-wrap"><table><thead><tr><th>パラメータ</th><th>位置</th><th>型</th><th>必須／任意</th><th>説明</th></tr></thead><tbody><tr><td><code>params</code></td><td>ボディ（フォーム値）</td><td>string</td><td>必須</td><td>JSON文字列。<code>data</code>配列に取引ヘッダ（<code>TransactionHead</code>）と取引明細（<code>TransactionDetail</code>）を含む。取引ヘッダは会員ID・付与ポイント・利用ポイント・取引ヘッダID・取消区分・打消区分等を持つ。</td></tr><tr><td><code>proc_name</code></td><td>ボディ（フォーム値）</td><td>string</td><td>任意</td><td>スマレジの処理名。支店システムへの転送時にそのまま引き継ぐ。</td></tr><tr><td><code>X_contract_id</code></td><td>ヘッダ</td><td>string</td><td>任意</td><td>支店転送時に転送先へ引き継ぐ契約ID。</td></tr><tr><td><code>X_access_token</code></td><td>ヘッダ</td><td>string</td><td>任意</td><td>支店転送時に転送先へ引き継ぐアクセストークン。</td></tr><tr><td><code>{_locale}</code></td><td>パス</td><td>string</td><td>必須</td><td>言語識別子。処理対象の絞り込みには用いない。</td></tr></tbody></table></div>
   254	<h3 id="レスポンス-成功">レスポンス（成功）</h3>
   255	<p>HTTP 200。</p>
   256	<div class="table-wrap"><table><thead><tr><th>フィールド</th><th>型</th><th>説明</th></tr></thead><tbody><tr><td><code>result</code></td><td>array</td><td>更新結果の配列。要素はオブジェクト1件。</td></tr><tr><td><code>result[].TransactionHead</code></td><td>integer</td><td>更新件数。会員ポイント・ポイント履歴・出荷完了反映の処理件数と、支店転送の結果件数を合算した値。</td></tr></tbody></table></div>
   257	<h3 id="レスポンス-失敗">レスポンス（失敗）</h3>
   258	<div class="table-wrap"><table><thead><tr><th>HTTPステータス</th><th>条件</th><th>本文の形</th></tr></thead><tbody><tr><td>500</td><td><code>params</code>の解釈不可、取引ヘッダの不足、処理中の例外</td><td>標準例外ハンドラに委ねる</td></tr></tbody></table></div>
   259	<p>入力検証・認証判定を明示的に行わないため、400・401は発生しない。会員が見つからない・対象履歴が無い・対象注文が無い場合はその処理の更新件数を0として継続し、200を返す。</p>
   260	<h3 id="サンプルレスポンス">サンプルレスポンス</h3>

 succeeded in 217ms:
{
  "functionId": "a05-04_api_order_order_smaregi_receive",
  "title": "API 受注管理 — スマレジ受信処理（ポイント履歴取得）",
  "domain": "a05",
  "kind": "api",
  "designHtml": "function_spec_html_preview/pf-eccube3/a05-04_api_order_order_smaregi_receive.html",
  "findings": [
    {
      "dimension": "①ルート/HTTPメソッド",
      "severity": "high",
      "designRef": "functions/pf-eccube3/a05-04_api_order_order_smaregi_receive.md:68",
      "designQuote": "スマレジ取引通知の受信 | `POST /{_locale}/smaregi/transaction`",
      "implRef": "src/Eccube/Controller/Smaregi/WebhookController.php:41",
      "difference": "設計は言語識別子配下の固定パス `POST /{_locale}/smaregi/transaction`。実装は `#[Route('', name: 'smaregi_webhook', methods: ['POST'])]` で、routes.yaml(app/config/eccube/routes.yaml:9-12)の prefix `/%eccube_smaregi_webhook_route%`（秘匿パス）配下の単一Webhookエンドポイント。`{_locale}`も`/transaction`サブパスも存在しない。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "WebhookController.php:41 `#[Route('', name: 'smaregi_webhook', methods: ['POST'])]`。routes.yaml:9-12 smaregi_webhook_controllers に prefix: /%eccube_smaregi_webhook_route% を確認。{_locale}/transaction パスは無い。"
    },
    {
      "dimension": "⑥権限・認可",
      "severity": "high",
      "designRef": "functions/pf-eccube3/a05-04_api_order_order_smaregi_receive.md:140",
      "designQuote": "入力検証・認証判定を明示的に行わないため、400・401は発生しない。",
      "implRef": "src/Eccube/Controller/Smaregi/WebhookController.php:52",
      "difference": "設計は認証トークン不要／匿名許可／400・401は発生しない。実装は AuthenticationService->verify() 失敗時に HTTP 401(`{status:error,message:Authentication failed}`)を返し、`smaregi-event-id`ヘッダ欠落時は HTTP 400 を返す。設計と矛盾。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "WebhookController.php:52-65 verify()失敗で HTTP_UNAUTHORIZED、67-78 smaregi-event-id欠落で HTTP_BAD_REQUEST。AuthenticationService.php:33-45 verify() は秘密ヘッダを hash_equals で照合し不一致で false を返す。"
    },
    {
      "dimension": "⑧バッチ/API入出力・再実行性",
      "severity": "high",
      "designRef": "functions/pf-eccube3/a05-04_api_order_order_smaregi_receive.md:132",
      "designQuote": "`result[].TransactionHead` | integer | 更新件数。会員ポイント・ポイント履歴・出荷完了反映の処理件数と、支店転送の結果件数を合算した値。",
      "implRef": "src/Eccube/Controller/Smaregi/WebhookController.php:107",
      "difference": "設計の成功レスポンスは `{result:[{TransactionHead: 更新件数}]}`。実装は `{status:'ok'}`(107-109行)または重複時 `{status:'ok',message:'Event is duplicate'}`(85-88行)を返すのみで、更新件数を集計・返却しない。result/TransactionHead スキーマは存在しない。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "WebhookController.php:106-109 `return new JsonResponse(['status'=>'ok'], HTTP_OK)`。result/TransactionHead を返す箇所は無い。"
    },
    {
      "dimension": "⑧バッチ/API入出力・再実行性",
      "severity": "med",
      "designRef": "functions/pf-eccube3/a05-04_api_order_order_smaregi_receive.md:98",
      "designQuote": "取引ヘッダの更新件数を合算した値を、更新件数として応答に組み立てて返す（HTTP 200）。",
      "implRef": "src/Eccube/Controller/Smaregi/WebhookController.php:91",
      "difference": "設計は同期実行し結果件数を応答。実装は SmaregiWebhookEvent を永続化し MessageBus へ SmaregiWebhookEventMessage を dispatch して即時200を返すのみで、取引取得・ポイント/受注反映は非同期ハンドラで後続実行。再実行性は smaregi-event-id 重複判定と updateDateTime stale判定に依存(設計に無い方式)。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "WebhookController.php:91-104 createEventFromRequest→persist/flush→messageBus->dispatch(new SmaregiWebhookEventMessage($Event->getId()))→即200。同期の件数集計は無い。"
    },
    {
      "dimension": "⑧バッチ/API入出力（リクエスト項目）",
      "severity": "med",
      "designRef": "functions/pf-eccube3/a05-04_api_order_order_smaregi_receive.md:119",
      "designQuote": "`params` | ボディ（フォーム値）| string | 必須 | JSON文字列。`data`配列に取引ヘッダ（`TransactionHead`）と取引明細（`TransactionDetail`）を含む。",
      "implRef": "src/Eccube/Controller/Smaregi/WebhookController.php:67",
      "difference": "設計はフォーム値`params`(JSON文字列)必須＋`proc_name`・`X_contract_id`/`X_access_token`ヘッダ。実装は `smaregi-event-id`ヘッダとボディ生JSON(`$request->getContent()`)を EventService で解釈し、body から contractId/event/action を抽出。`params`フォーム値・`proc_name`・`X_contract_id`/`X_access_token`は参照しない。取引ヘッダ/明細は後続の取引取得APIで取得する方式。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "WebhookController.php:67 smaregi-event-id ヘッダ取得。EventService.php:29-31 `json_decode($request->getContent(), true)`、38-46 body['contractId']/['event']/['action'] を使用。params/proc_name/X_contract_id/X_access_token の参照は無い。"
    },
    {
      "dimension": "④DBカラム・DB操作",
      "severity": "high",
      "designRef": "functions/pf-eccube3/a05-04_api_order_order_smaregi_receive.md:192",
      "designQuote": "ポイント増減（point_change）・摘要（note）・発生日（issue_date）・ポイント区分（point_type_id）・取引ID（transaction_id） | 通常取引で登録、取消・打消で取引IDをキーに削除する。",
      "implRef": "src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:96",
      "difference": "設計は取消・打消で取引IDに一致するポイント履歴を取得して削除。実装の SmaregiPointAdjustmentReverter は元履歴を削除せず監査用に残し、符号反転した逆仕訳ポイント履歴を追加登録して残高を戻す。DELETEではなく相殺INSERTで dtb_point_history の残存状態が設計と異なる。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "SmaregiPointAdjustmentReverter.php:96-108 `$player->setPoint($player->getPoint() - $net)` の後 pointHistoryEntityManager->save(...,-$net,REVERT_NOTE,...,$transactionId) で逆仕訳を追加。クラスdocコメントにも『元の付与/減算履歴は監査用に残し、相殺用の逆仕訳履歴を追加』と明記。DELETE呼出は無い。なお本実装は order_id が NULL のポイント専用取引(区分6/7)を対象とする点も設計の一般化と差異あり。"
    },
    {
      "dimension": "②業務ルール・計算（支店転送）",
      "severity": "med",
      "designRef": "functions/pf-eccube3/a05-04_api_order_order_smaregi_receive.md:97",
      "designQuote": "支店分の明細がある場合は、受信ヘッダの連携用ヘッダを引き継ぎ、支店システムのスマレジ受信APIへ明細を転送する。転送結果に更新件数が含まれる場合は合算し、含まれない場合は転送エラーをログに記録する。",
      "implRef": "不在",
      "difference": "設計は自店舗以外の明細を X_contract_id/X_access_token を引き継いで支店システムのスマレジ受信APIへ転送し件数合算/エラーログ記録。実装の取引Webhook処理経路(src/Eccube/Service/Smaregi/Webhook/Transaction 配下)に支店転送処理が無く、grepでも該当なし。設計の支店転送機能が未実装。",
      "confidence": "med",
      "verdict": "CONFIRMED",
      "evidence": "Transaction ディレクトリ一覧(Handler/Processor/PurchasePattern*/SmaregiOrderFactory/SmaregiOrderPointApplier/SmaregiPointAdjustment*/Dispatcher 等)に支店転送コンポーネント無し。`grep -rilE '支店|branch|transferTo|otherShop|storeCode.*transfer' src/Eccube/Service/Smaregi` は0件。X_contract_id/X_access_token 引き継ぎ処理も無し。"
    },
    {
      "dimension": "④DBカラム・DB操作（注文サブ／出荷完了反映）",
      "severity": "med",
      "designRef": "functions/pf-eccube3/a05-04_api_order_order_smaregi_receive.md:195",
      "designQuote": "注文サブ（dtb_order_sub。ec-cube-enterprise 実装で要確認）| スマレジコード・出荷日・担当者・付与ポイント・連携エラー | 出荷完了反映の対象特定と更新に用いる。",
      "implRef": "不在",
      "difference": "設計は通常取引で自店舗明細に対し注文サブ(dtb_order_sub)を特定し出荷完了反映。実装に dtb_order_sub 相当エンティティは存在せず(grep一致は 'OrderSubmit' の誤検出のみ)、created処理は PurchasePatternResolver で判定し既存受注の引渡し済み化＋新規Order作成を行う。永続化先・更新項目が設計と異なる（設計も『要確認』と明記）。",
      "confidence": "med",
      "verdict": "CONFIRMED",
      "evidence": "src/Eccube/Entity 配下に *ordersub* / dtb_order_sub エンティティは存在しない(find/grep 0件)。'order_sub|OrderSub' の grep 一致は Front/Purchase の PurchaseOrderSubmitInput/Action 等『OrderSubmit』の誤検出。設計側も dtb_order_sub 移行先を『要確認』としており確定差分ではなく open item。"
    },
    {
      "dimension": "⑦エラー処理",
      "severity": "med",
      "designRef": "functions/pf-eccube3/a05-04_api_order_order_smaregi_receive.md:221",
      "designQuote": "明示的な`try-catch`は持たず、標準例外ハンドラに委ねる（HTTP 500相当）。",
      "implRef": "src/Eccube/Controller/Smaregi/WebhookController.php:110",
      "difference": "設計はコントローラで明示的try-catchを持たず標準例外ハンドラに委ねる。実装は index() 内で try/catch し、例外時に HTTP 500(`{status:error,message:'Error processing webhook'}`)を JsonResponse で自前返却。標準例外ハンドラ経由でなく本文形が設計前提と異なる。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "WebhookController.php:90-121 try{...}catch(\\Throwable $e){ log_error; return new JsonResponse(['status'=>'error','message'=>'Error processing webhook'], HTTP_INTERNAL_SERVER_ERROR); }。"
    },
    {
      "dimension": "⑧バッチ/API入出力（重複判定）",
      "severity": "low",
      "designRef": "functions/pf-eccube3/a05-04_api_order_order_smaregi_receive.md:240",
      "designQuote": "同一取引の重複受信時の整合は、取消・打消が取引IDを基準にポイント履歴を特定して巻き戻す前提に依存する。",
      "implRef": "src/Eccube/Controller/Smaregi/WebhookController.php:80",
      "difference": "設計は重複受信の整合を取引ID基準の巻き戻し前提に委ねる。実装は EventService->isDuplicate(smaregi-event-id) で受信段階の重複を判定し『Event is duplicate』で200 skip(80-88行)、さらに子ジョブ側で existsByTransactionId 冪等チェックを行う。設計に無い受信重複排除層が追加。",
      "confidence": "med",
      "verdict": "CONFIRMED",
      "evidence": "WebhookController.php:80-88 isDuplicate分岐。EventService.php:52-57 findBySmaregiEventId で既存判定。SmaregiPointAdjustmentReverter docコメントに existsByTransactionId 冪等の記述あり。設計に無い追加挙動。"
    },
    {
      "dimension": "⑧副作用（レスポンスヘッダ）",
      "severity": "low",
      "designRef": "functions/pf-eccube3/a05-04_api_order_order_smaregi_receive.md:160",
      "designQuote": "`Content-Type`に`application/json;charset=UTF-8`、キャッシュ抑止と`Access-Control-Allow-Origin: *`を明示する。",
      "implRef": "src/Eccube/Controller/Smaregi/WebhookController.php:107",
      "difference": "設計は応答に Content-Type `application/json;charset=UTF-8`、キャッシュ抑止ヘッダ、`Access-Control-Allow-Origin: *` を明示。実装は標準 Symfony JsonResponse を返すのみで、コントローラ内でキャッシュ抑止/CORSヘッダの明示的付与は無い。ただしグローバルなレスポンスリスナ等での付与を短時間で網羅確認できず。",
      "confidence": "med",
      "verdict": "UNCERTAIN",
      "evidence": "WebhookController.php:106-109 はヘッダ操作なしの JsonResponse。コントローラ内に Access-Control-Allow-Origin / Cache-Control の明示付与は無いが、kernel.response 相当のグローバルリスナで付与される可能性を排除できていないため UNCERTAIN。"
    }
  ]
}

 succeeded in 262ms:
/home/y-saito/Developments/hareruya-design-docs
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/EccubeNav.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/EccubeTwigBlock.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/Constant.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/ConnectionType.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/PurchaseProductListOrderBy.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/ProductListDisplayMode.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/EccubeConfig.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventSubscriber/RestockNotificationPostCommitSubscriber.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Smaregi/WebhookController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallPluginController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SalesAnalysisController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/AbstractController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/FormatSalesController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/UsedCardController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/ProductRequestController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Analysis/SummaryController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/MailController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseHistoryController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/SearchProductController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AbstractCsvImportController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Store/TemplateController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Store/OwnerStoreController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Store/PluginController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockListController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockBulkApprovalController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockHistoryController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockChangeCsvController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockApprovalListController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/InventoryPlanController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/BarcodeReplacementListController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockApprovalController.php
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m08-09_admin_customer_customer_delivery.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-20_admin_order_order_shipping_standby_detail_edit_delete.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m04-17_admin_stock_stock_history_search_list.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-05_admin_order_order_shipping_custom_csv_export.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m13-03_admin_event_event_schedule_add.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m10-13_admin_base_setting_setting_shop_csv_custom.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/a17-03_api_other_point_granter.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m15-04_admin_deck_deck_bulk_update.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/admin_customer_point.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/f03-07_front_product_product_arrival_notification.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m03-40_admin_product_product_shelf_number_csv_import.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/f06-10_front_member_mypage_point_history.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m13-06_admin_event_event_entry_management_search.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/o01-02_other_mtg_buyer_mtg_buyer_online_purchase.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/f06-24_front_contact_history.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m03-36_admin_product_product_buy_discount_csv_import.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m04-03_admin_stock_stock_bulk_edit.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/f07-04_front_event_event_entry_complete.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/batch_s3_file_sync.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m13-10_admin_event_event_entry_edit.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m08-13_admin_customer_customer_blacklist.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/front_contact_history.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/f04-03_front_cart_shopping_delivery_edit.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/b02-06_batch_product_product_stock_initialize.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/f03-08_front_product_product_favorite.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m03-13_admin_product_product_tag.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m15-01_admin_deck_deck_search.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m13-04_admin_event_event_repeat_schedule.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m04-05_admin_stock_product_stock_custom_csv_export.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m07-06_admin_online_purchase_purchase_online_product_list_csv_export.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/f06-02_front_member_entry_activate.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/b08-01_batch_customer_customer_send_account_migration.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m03-12_admin_product_product_category_csv_export.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/f07-02_front_event_event_search.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m03-31_admin_product_product_sale_price_csv_import.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m03-34_admin_product_product_discount_csv_import.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m12-08_admin_analytics_sales_format_analysis_csv_export.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m14-04_admin_card_card_register_update_delete.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m15-09_admin_deck_deck_archetype_crud.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m06-06_admin_store_purchase_purchase_store_history_csv_export_all.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/f03-06_front_product_product_recently_viewed.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/f06-13_front_member_mypage_online_identification.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/f06-11_front_member_mypage_buy_history.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m13-11_admin_event_event_entry_search.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m16-06_admin_data_data_buy_price_list.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m13-15_admin_event_event_image_setting.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m03-29_admin_product_product_tag_sales_analysis_csv_import.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m03-19_admin_product_product_section_csv_export.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m16-07_admin_data_data_buy_price_list_edit.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m08-01_admin_customer_customer_search_list.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m03-25_admin_product_product_duplicate_product_code_check.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/f02-01_front_global_nav_global_nav_pc.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m06-09_admin_store_purchase_otc_buy_order_summary_csv_export.html
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/HealthcheckController.php
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m03-10_admin_product_product_bulk_buy_standard_price_edit.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m03-24_admin_product_product_buy_sale_price_history_csv_export.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/b08-02_batch_customer_customer_lost_points.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/f03-02_front_product_product_detail.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m07-05_admin_online_purchase_purchase_csv_export_deposit.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m10-07_admin_base_setting_setting_shop_tax.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m06-04_admin_store_purchase_purchase_store_status_change.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m14-05_admin_card_card_csv_import.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/b05-04_batch_order_order_resend_smaregi_product.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/b13-02_batch_event_event_check_cvs_payment.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/o01-03_other_mtg_buyer_mtg_buyer_stock_inbound.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m16-02_admin_data_data_top_banner.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/admin_product_sale_high_price_csv_export.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m13-02_admin_event_event_edit_delete.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m03-37_admin_product_product_storage_code_csv_import.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m12-05_admin_analytics_sales_arrival_notification_search_list.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m11-02_admin_system_setting_setting_system_member_edit.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m13-08_admin_event_event_deck_view.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m03-41_admin_product_product_category_csv_import.html
/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m06-07_admin_store_purchase_purchase_store_history_select_csv_export.html

codex
候補JSONの設計参照はMarkdown行番号ですが、今回の正本はHTMLなのでHTML行へ読み替えて照合します。次に実装側のコントローラ、認証、イベント生成、非同期処理、ポイント/注文反映周辺を開きます。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/routes.yaml | sed -n '1,80p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/a05-04_api_order_order_smaregi_receive.html | sed -n '260,360p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc 'find /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi -maxdepth 5 -type f | sort' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/Response/AccessTokenMockResponse.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/Response/CustomerMockResponse.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/Response/ProductMockResponse.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/Response/SectionMockResponse.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/SmaregiMockHttpClientFactory.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/SmaregiMockResponder.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiAccessTokenService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiCustomerApiClient.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiGuzzleClientFactory.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiMessengerJobContext.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiPlatformApiCallRecorder.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiPlatformApiCallSanitizer.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiProductApiClient.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiSectionApiClient.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiTransactionApiClient.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Util/SmaregiFieldFormatter.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Util/Transaction/TransactionResponseParser.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcDeleteDispatcher.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcDeleteResult.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcDeleteService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcProductCodeGenerator.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcSyncDispatcher.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcSyncResult.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiApiService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerPointEventService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerResolveException.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerResolver.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerUpdateEventService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiMessengerJobProcessingLock.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderUsePointEventService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOtcOrderPostAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiPointPushLogService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiProductClassCsvImportUpsertCoordinator.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiProductClassCsvImportUpsertCoordinatorFactory.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiProductClassEventService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiSectionEventService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Stock/SmaregiStockBackfillAction.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/AuthenticationService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/EventService.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Stock/SmaregiStockChangeApplier.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Stock/SmaregiStockProcessDispatcher.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Stock/StockEventDispatcher.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/BulkDeletedHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/BulkUpdateHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/CanceledHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/CreatedHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/DisposedHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/EditedHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeOtcPatternHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeSmoothOtcPatternHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/OtcGuestPatternHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/OtcMemberPatternHandler.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/SmaregiOtcOrderLock.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/TransactionActionHandlerInterface.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/PickupMethod.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionCanceledProcessor.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionDisposedProcessor.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/PurchasePattern.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/PurchasePatternContext.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/PurchasePatternContextBuilder.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/PurchasePatternResolver.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderFactory.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiTransactionProcessDispatcher.php
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/TransactionEventDispatcher.php

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Smaregi/WebhookController.php | sed -n '1,180p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Controller\Smaregi;
    17	
    18	use Eccube\Controller\AbstractController;
    19	use Eccube\Message\SmaregiWebhookEventMessage;
    20	use Eccube\Service\Smaregi\Webhook\AuthenticationService;
    21	use Eccube\Service\Smaregi\Webhook\EventService;
    22	use Symfony\Component\HttpFoundation\JsonResponse;
    23	use Symfony\Component\HttpFoundation\Request;
    24	use Symfony\Component\HttpFoundation\Response;
    25	use Symfony\Component\Messenger\MessageBusInterface;
    26	use Symfony\Component\Routing\Attribute\Route;
    27	
    28	class WebhookController extends AbstractController
    29	{
    30	    public function __construct(
    31	        private readonly AuthenticationService $authenticationService,
    32	        private readonly EventService $eventService,
    33	        private readonly MessageBusInterface $messageBus,
    34	    ) {
    35	    }
    36	
    37	    /**
    38	     * スマレジ Webhook 受信エンドポイント（検証用）
    39	     * リクエスト内容をログに出力し、200 OK で固定レスポンスを返す。
    40	     */
    41	    #[Route('', name: 'smaregi_webhook', methods: ['POST'])]
    42	    public function index(Request $request): JsonResponse
    43	    {
    44	        log_info('Smaregi webhook received', [
    45	            'method' => $request->getMethod(),
    46	            'uri' => $request->getRequestUri(),
    47	            'headers' => $request->headers->all(),
    48	            'query' => $request->query->all(),
    49	            'content' => $request->getContent(),
    50	        ]);
    51	
    52	        if (!$this->authenticationService->verify($request)) {
    53	            log_warning('Smaregi webhook authentication failed', [
    54	                'method' => $request->getMethod(),
    55	                'uri' => $request->getRequestUri(),
    56	                'headers' => $request->headers->all(),
    57	                'query' => $request->query->all(),
    58	                'content' => $request->getContent(),
    59	            ]);
    60	
    61	            return new JsonResponse([
    62	                'status' => 'error',
    63	                'message' => 'Authentication failed',
    64	            ], Response::HTTP_UNAUTHORIZED);
    65	        }
    66	
    67	        $smaregiEventId = $request->headers->get('smaregi-event-id');
    68	        if ($smaregiEventId === null) {
    69	            log_warning('Smaregi-Event-Id header is missing', [
    70	                'uri' => $request->getUri(),
    71	                'headers' => $request->headers->all(),
    72	            ]);
    73	
    74	            return new JsonResponse([
    75	                'status' => 'error',
    76	                'message' => 'Smaregi-Event-Id header is required',
    77	            ], Response::HTTP_BAD_REQUEST);
    78	        }
    79	
    80	        if ($this->eventService->isDuplicate($smaregiEventId)) {
    81	            log_warning('Smaregi webhook event is duplicate', [
    82	                'smaregiEventId' => $smaregiEventId,
    83	            ]);
    84	
    85	            return new JsonResponse([
    86	                'status' => 'ok',
    87	                'message' => 'Event is duplicate',
    88	            ], Response::HTTP_OK);
    89	        }
    90	
    91	        try {
    92	            $Event = $this->eventService->createEventFromRequest($request);
    93	            $this->entityManager->persist($Event);
    94	            $this->entityManager->flush();
    95	
    96	            log_info('Webhook event created', [
    97	                'eventId' => $Event->getId(),
    98	                'smaregiEventId' => $smaregiEventId,
    99	            ]);
   100	
   101	            // 非同期処理に投入
   102	            $this->messageBus->dispatch(new SmaregiWebhookEventMessage($Event->getId()));
   103	
   104	            log_info('Webhook event message dispatched', ['eventId' => $Event->getId()]);
   105	
   106	            // 3秒以内に空のレスポンスを返す
   107	            return new JsonResponse([
   108	                'status' => 'ok',
   109	            ], Response::HTTP_OK);
   110	        } catch (\Throwable $e) {
   111	            log_error('Error processing webhook', [
   112	                'smaregiEventId' => $smaregiEventId,
   113	                'error' => $e->getMessage(),
   114	                'trace' => $e->getTraceAsString(),
   115	            ]);
   116	
   117	            return new JsonResponse([
   118	                'status' => 'error',
   119	                'message' => 'Error processing webhook',
   120	            ], Response::HTTP_INTERNAL_SERVER_ERROR);
   121	        }
   122	    }
   123	}

 succeeded in 110ms:
     1	admin_controllers:
     2	    resource: '../../../src/Eccube/Controller/Admin'
     3	    type: attribute
     4	
     5	app_controllers:
     6	    resource: '../../../src/Eccube/Controller/App'
     7	    type: attribute
     8	
     9	smaregi_webhook_controllers:
    10	    resource: '../../../src/Eccube/Controller/Smaregi'
    11	    type: attribute
    12	    prefix: /%eccube_smaregi_webhook_route%
    13	
    14	block_controllers:
    15	    resource: '../../../src/Eccube/Controller/Block'
    16	    type: attribute
    17	    # NOTE:
    18	    # 本店では'/{_locale}'、支店では'/{_locale}/{_shop}'となる。
    19	    # front_controllers と同じ prefix にし、render(path('block_xxx')) 等で _shop が引き継がれて支店判定 (TopCategoryListBuilder::isBranchShopContext 等) が動くようにする。
    20	    prefix: /{_locale}{_shop}
    21	    requirements:
    22	        _locale: '%app_locales%'
    23	        _shop: '%app_shop_route_requirement%'
    24	    defaults:
    25	        _locale: '%locale%'
    26	
    27	install_controllers:
    28	    resource: '../../../src/Eccube/Controller/Install'
    29	    type: attribute
    30	
    31	shop_controllers:
    32	    resource: '../../../src/Eccube/Controller/Shop'
    33	    type: attribute
    34	
    35	front_controllers:
    36	    resource: '../../../src/Eccube/Controller/Front'
    37	    type: attribute
    38	    # NOTE:
    39	    # 本店では'/{_locale}'、支店では'/{_locale}/{_shop}'となる。
    40	    # {_shop}を任意にするだけでは'/ja//products'のようにスラッシュが重複してしまう為、
    41	    # {_shop}の前のスラッシュをrequirementsに含めることで'/ja/products'となるようにしている。
    42	    prefix: /{_locale}{_shop}
    43	    requirements:
    44	        _locale: '%app_locales%'
    45	        _shop: '%app_shop_route_requirement%'
    46	    defaults:
    47	        _locale: '%locale%'
    48	        _shop: ''
    49	
    50	default_locale_redirect:
    51	    path: /
    52	    controller: Symfony\Bundle\FrameworkBundle\Controller\RedirectController::urlRedirectAction
    53	    defaults:
    54	        path: /%locale%/
    55	        permanent: false
    56	
    57	customize_controllers:
    58	    resource: ../../../app/Customize/Controller
    59	    type: attribute
    60	
    61	#    prefix: /{_locale}
    62	    # prefix: /
    63	    # requirements:
    64	    #     _locale: '%app_locales%'
    65	    # defaults:
    66	    #     _locale: '%locale%'
    67	
    68	# These lines define a route using YAML configuration. The controller used by
    69	# the route (FrameworkBundle:Template:template) is a convenient shortcut when
    70	# the template can be rendered without executing any logic in your own controller.
    71	# See https://symfony.com/doc/current/cookbook/templating/render_without_controller.html
    72	# homepage:
    73	#     path: /{_locale}
    74	#     requirements:
    75	#         _locale: '%app_locales%'
    76	#     defaults:
    77	#         _controller: FrameworkBundle:Template:template
    78	#         template: default/homepage.html.twig
    79	#         _locale: '%locale%'
    80	admin_logout:

 succeeded in 107ms:
   260	<h3 id="サンプルレスポンス">サンプルレスポンス</h3>
   261	<p>成功時の応答例（代表値）。</p>
   262	<pre><code class="language-json">{
   263	  "result": [
   264	    {
   265	      "TransactionHead": 1
   266	    }
   267	  ]
   268	}</code></pre>
   269	<h3 id="副作用">副作用</h3>
   270	<p>会員（プレイヤー）の保有ポイントの更新。ポイント履歴の登録（通常取引）または削除（取消・打消）。対象注文の出荷完了反映（受注ステータス・出荷確定日・コミット日・注文サブの出荷日・担当者の更新、ポイント付与処理）。支店システムのスマレジ受信APIへの明細転送。これらはデータベースへ反映する。</p>
   271	<p>応答はJSON応答整形を経て返す。<code>result</code>配列を持つ連想配列を返し、<code>Content-Type</code>に<code>application/json;charset=UTF-8</code>、キャッシュ抑止と<code>Access-Control-Allow-Origin: *</code>を明示する。</p>
   272	<hr>
   273	<h2 id="バリデーション">バリデーション</h2>
   274	<div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td><code>params</code></td><td>JSON文字列として解釈する。形式や必須項目の明示的な検証は行わず、解釈不可・取引ヘッダ不足時は処理中の例外として標準例外ハンドラに委ねる（HTTP 500相当）。</td></tr><tr><td>取引区分</td><td>取消区分・打消区分の値で処理経路を分岐する。いずれにも該当しない場合は通常取引として扱う。</td></tr></tbody></table></div>
   275	<hr>
   276	<h2 id="データ整合性">データ整合性</h2>
   277	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>更新の有無</td><td>本APIは参照だけでなく、会員ポイント・ポイント履歴・受注を更新する。</td></tr><tr><td>ポイントと履歴</td><td>通常取引では会員ポイントの加減算とポイント履歴の登録を同一処理内で行う。取消・打消では取引IDに一致するポイント履歴を取得して削除し、会員ポイントを逆方向へ補正する。会員または対象履歴が無い場合は更新しない。</td></tr><tr><td>出荷完了反映</td><td>自店舗の明細に対し、注文サブを商品コードで特定して出荷完了へ反映する。対象注文が無い場合は反映しない。</td></tr><tr><td>支店転送</td><td>自店舗以外の明細は支店システムへ転送し、結果件数を更新件数に合算する。転送に件数が含まれない場合はログに記録し、件数は合算しない。</td></tr></tbody></table></div>
   278	<hr>
   279	<h2 id="DBカラム">DBカラム</h2>
   280	<p>機能に直接関係する列のみ記載する。型や一覧の細部はスキーマを参照する。</p>
   281	<div class="table-wrap"><table><thead><tr><th>テーブル</th><th>列</th><th>メモ</th></tr></thead><tbody><tr><td>会員（プレイヤー）（dtb_player）</td><td>スマレジ会員ID（smaregi_id）</td><td>取引ヘッダの会員IDで会員を特定する結合キー。</td></tr><tr><td>会員（プレイヤー）（dtb_player）</td><td>保有ポイント（point）</td><td>付与・利用・取消に応じて加減算する。</td></tr><tr><td>ポイント履歴テーブル（dtb_point_history）</td><td>ポイント増減（point_change）・摘要（note）・発生日（issue_date）・ポイント区分（point_type_id）・取引ID（transaction_id）</td><td>通常取引で登録、取消・打消で取引IDをキーに削除する。</td></tr><tr><td>オプションマスタ（mtb_option）</td><td>スマレジ店舗ID</td><td>自店舗の店舗コード判定に用いる。</td></tr><tr><td>ポイント区分マスタ（mtb_point_type）</td><td>購入区分</td><td>登録するポイント履歴の区分に用いる。</td></tr><tr><td>注文サブ（dtb_order_sub。ec-cube-enterprise 実装で要確認）</td><td>スマレジコード・出荷日・担当者・付与ポイント・連携エラー</td><td>出荷完了反映の対象特定と更新に用いる。移行先の対応表は要確認。</td></tr><tr><td>受注</td><td>受注ステータス・コミット日・出荷確定日</td><td>出荷完了への反映に用いる。</td></tr></tbody></table></div>
   282	<h3 id="DB操作">DB操作</h3>
   283	<p>永続化の正は ec-cube-enterprise（テーブル名・操作は ec-cube-enterprise を正典）。当ドメインは承認ワークフローを介さず persist/flush で直接確定する（承認ワークフローは在庫機能固有）。</p>
   284	<div class="table-wrap"><table><thead><tr><th>操作種別</th><th>対象テーブル</th><th>契機・条件</th></tr></thead><tbody><tr><td>登録/更新</td><td>dtb_order_sub / dtb_player / dtb_point_history / mtb_option / mtb_point_type</td><td>当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。</td></tr></tbody></table></div>
   285	<hr>
   286	<h2 id="権限・認可">権限・認可</h2>
   287	<div class="table-wrap"><table><thead><tr><th>利用者状態</th><th>スマレジ受信処理</th></tr></thead><tbody><tr><td>任意のクライアント（未認証含む）</td><td>処理を実行できる。本APIは呼び出し元の認証・利用者状態による制御を行わない。</td></tr><tr><td>支店システムへの転送</td><td>受信した連携用ヘッダを引き継いで転送先のスマレジ受信APIを呼び出す。</td></tr></tbody></table></div>
   288	<hr>
   289	<h2 id="エラー処理">エラー処理</h2>
   290	<div class="table-wrap"><table><thead><tr><th>エラー内容</th><th>処理</th></tr></thead><tbody><tr><td><code>params</code>の解釈不可・取引ヘッダ不足・処理中の例外</td><td>明示的な<code>try-catch</code>は持たず、標準例外ハンドラに委ねる（HTTP 500相当）。</td></tr><tr><td>会員が見つからない・対象履歴が無い・対象注文が無い</td><td>エラーとせず、その処理の更新件数を0として継続し、200を返す。</td></tr><tr><td>支店転送の結果に件数が含まれない</td><td>転送エラーとしてログに記録し、件数を合算しない。処理は継続する。</td></tr></tbody></table></div>
   291	<hr>
   292	<h2 id="ログ・監査">ログ・監査</h2>
   293	<p>支店転送の結果に件数が含まれない場合に、転送エラーである旨と転送結果をログ出力する。</p>
   294	<h3 id="ログに出してはいけないもの">ログに出してはいけないもの</h3>
   295	<ul><li>連携用ヘッダ（契約ID・アクセストークン）の値</li><li>Cookie値・セッションIDの完全値</li></ul>
   296	<hr>
   297	<h2 id="排他制御・トランザクション">排他制御・トランザクション</h2>
   298	<p>本APIは会員ポイント・ポイント履歴・受注を更新する。各処理の末尾で永続化を確定する。明示的な悲観ロック・楽観ロックの取得は行わない。同一取引の重複受信時の整合は、取消・打消が取引IDを基準にポイント履歴を特定して巻き戻す前提に依存する。</p>
   299	      <footer>このページは機能仕様書Markdownから自動生成されています。編集は元のMarkdownに対して行ってください。</footer>
   300	    </main>
   301	  </div>
   302	</body>
   303	</html>

codex
実装はスマレジWebhook全般の受信口からイベントを保存し、後段のTransactionハンドラへ渡す構造に見えます。候補の「同期レスポンス差分」は概ね根拠がありそうですが、支店転送や注文サブは“存在しない”主張なので、検索範囲を広げて誤検知でないか確認します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/EventService.php | sed -n '1,140p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Service\Smaregi\Webhook;
    17	
    18	use Eccube\Entity\SmaregiWebhookEvent;
    19	use Eccube\Repository\SmaregiWebhookEventRepository;
    20	use Symfony\Component\HttpFoundation\Request;
    21	
    22	class EventService
    23	{
    24	    public function __construct(
    25	        private readonly SmaregiWebhookEventRepository $smaregiWebhookEventRepository,
    26	    ) {
    27	    }
    28	
    29	    public function createEventFromRequest(Request $request): SmaregiWebhookEvent
    30	    {
    31	        $body = json_decode($request->getContent(), true);
    32	
    33	        $smaregiEventId = $request->headers->get('smaregi-event-id');
    34	
    35	        if ($smaregiEventId === null) {
    36	            throw new \InvalidArgumentException('Smaregi-Event-Id header is required');
    37	        }
    38	
    39	        $Event = new SmaregiWebhookEvent();
    40	        $Event->setContractId($body['contractId'] ?? '');
    41	        $Event->setSmaregiEventId($smaregiEventId);
    42	        $Event->setEvent($body['event'] ?? '');
    43	        $Event->setAction($body['action'] ?? '');
    44	        $Event->setRequestHeaders($request->headers->all());
    45	        $Event->setRequestBody($body);
    46	        $Event->setReceivedAt(new \DateTime());
    47	        $Event->setStatus(SmaregiWebhookEvent::STATUS_PENDING);
    48	
    49	        return $Event;
    50	    }
    51	
    52	    public function isDuplicate(string $smaregiEventId): bool
    53	    {
    54	        $Existing = $this->smaregiWebhookEventRepository->findBySmaregiEventId($smaregiEventId);
    55	
    56	        return $Existing !== null;
    57	    }
    58	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/AuthenticationService.php | sed -n '1,120p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Service\Smaregi\Webhook;
    17	
    18	use Symfony\Component\HttpFoundation\Request;
    19	
    20	class AuthenticationService
    21	{
    22	    public function __construct(
    23	        private readonly string $secret,
    24	        private readonly string $secretHeader,
    25	    ) {
    26	    }
    27	
    28	    public function getSecretHeader(): string
    29	    {
    30	        return $this->secretHeader;
    31	    }
    32	
    33	    public function verify(Request $request): bool
    34	    {
    35	        $headers = $request->headers->all();
    36	        $headerKey = strtolower($this->secretHeader);
    37	
    38	        if (isset($headers[$headerKey])) {
    39	            $receivedSecret = $headers[$headerKey][0];
    40	            if (hash_equals($this->secret, $receivedSecret)) {
    41	                return true;
    42	            }
    43	        }
    44	
    45	        return false;
    46	    }
    47	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiTransactionProcessDispatcher.php | sed -n '1,180p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Service\Smaregi\Webhook\Transaction;
    17	
    18	use Doctrine\ORM\EntityManagerInterface;
    19	use Eccube\Entity\MessengerJob;
    20	use Eccube\Entity\SmaregiWebhookEvent;
    21	use Eccube\Message\SmaregiTransactionProcessMessage;
    22	use Psr\Log\LoggerInterface;
    23	use Symfony\Component\Messenger\MessageBusInterface;
    24	
    25	/**
    26	 * 1 件の Webhook イベントに含まれる transactionHeadId 単位で子 MessengerJob を作成し、
    27	 * {@see SmaregiTransactionProcessMessage} を MessageBus へ投入する。
    28	 *
    29	 * - 子 MessengerJob の `parent_job_id` には Webhook イベント側の親 MessengerJob の ID を入れる
    30	 * - dispatch 失敗時は当該子 MessengerJob を FAILED へ遷移させて例外を再 throw
    31	 *   (既存 {@see \Eccube\Service\Smaregi\Otc\SmaregiOtcSyncDispatcher} と同方針)
    32	 */
    33	final readonly class SmaregiTransactionProcessDispatcher
    34	{
    35	    public function __construct(
    36	        private MessageBusInterface $messageBus,
    37	        private EntityManagerInterface $entityManager,
    38	        private LoggerInterface $logger,
    39	    ) {
    40	    }
    41	
    42	    public function dispatch(
    43	        SmaregiWebhookEvent $event,
    44	        string $action,
    45	        string $transactionHeadId,
    46	        ?int $parentJobId,
    47	    ): MessengerJob {
    48	        $webhookEventId = $event->getId();
    49	
    50	        $Job = new MessengerJob();
    51	        $Job->setMessageClass(SmaregiTransactionProcessMessage::class);
    52	        $Job->setStatus(MessengerJob::STATUS_PENDING);
    53	        $Job->setParentJobId($parentJobId);
    54	        $Job->setPayloadSummary(sprintf(
    55	            'webhookEventId=%d action=%s transactionHeadId=%s',
    56	            $webhookEventId,
    57	            $action,
    58	            $transactionHeadId,
    59	        ));
    60	        $this->entityManager->persist($Job);
    61	        $this->entityManager->flush();
    62	
    63	        try {
    64	            $this->messageBus->dispatch(new SmaregiTransactionProcessMessage(
    65	                (int) $Job->getId(),
    66	                $webhookEventId,
    67	                $action,
    68	                $transactionHeadId,
    69	            ));
    70	        } catch (\Throwable $e) {
    71	            try {
    72	                $Job->setStatus(MessengerJob::STATUS_FAILED);
    73	                $Job->setCompletedAt(new \DateTime());
    74	                $Job->setErrorMessage('メッセージバスへの投入に失敗しました: '.$e->getMessage());
    75	                $this->entityManager->flush();
    76	            } catch (\Throwable $persistError) {
    77	                $this->logger->error('Failed to persist Smaregi transaction process job failure state', [
    78	                    'jobId' => $Job->getId(),
    79	                    'webhookEventId' => $webhookEventId,
    80	                    'transactionHeadId' => $transactionHeadId,
    81	                    'error' => $persistError->getMessage(),
    82	                ]);
    83	            }
    84	            $this->logger->error('Smaregi transaction process message dispatch failed', [
    85	                'exception' => $e,
    86	                'jobId' => $Job->getId(),
    87	                'webhookEventId' => $webhookEventId,
    88	                'action' => $action,
    89	                'transactionHeadId' => $transactionHeadId,
    90	            ]);
    91	
    92	            throw $e;
    93	        }
    94	
    95	        return $Job;
    96	    }
    97	}

exec
/bin/bash -lc 'rg -n "X_contract_id|X_access_token|proc_name|params|TransactionHead|Access-Control-Allow-Origin|Cache-Control|dtb_order_sub|OrderSub|order_sub|支店|branch|transfer|smaregi/transaction|smaregi_webhook|eccube_smaregi_webhook_route" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /home/y-saito/Developments/ec-cube-enterprise/app/config /home/y-saito/Developments/ec-cube-enterprise/app/Customize 2>/dev/null' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Common/ProductListDisplayMode.php:26:    // 販売数（支店）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:127:            $this->processTransaction($Job, $Event, $message->getAction(), $message->getTransactionHeadId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:138:                'transactionHeadId' => $message->getTransactionHeadId(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:234:     * 打消(disposed)。打消元(disposeServerTransactionHeadId)がポイント専用取引なら差し戻し、
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:239:        if ($transaction->isDisposed() && $this->pointAdjustmentReverter->revert($transaction->disposeServerTransactionHeadId)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:385:            $TransactionJob->setTransactionHeadId($transactionHeadId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Smaregi/WebhookController.php:41:    #[Route('', name: 'smaregi_webhook', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/routes.yaml:9:smaregi_webhook_controllers:
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/routes.yaml:12:    prefix: /%eccube_smaregi_webhook_route%
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/routes.yaml:18:    # 本店では'/{_locale}'、支店では'/{_locale}/{_shop}'となる。
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/routes.yaml:19:    # front_controllers と同じ prefix にし、render(path('block_xxx')) 等で _shop が引き継がれて支店判定 (TopCategoryListBuilder::isBranchShopContext 等) が動くようにする。
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/routes.yaml:39:    # 本店では'/{_locale}'、支店では'/{_locale}/{_shop}'となる。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:424:                $params = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:428:                $this->sendAppData($params, $em);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:564:     * @param array<string, mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:568:    protected function createConnection(array $params): Connection
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:570:        if (str_contains((string) $params['url'], 'mysql')) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:571:            $params['charset'] = 'utf8mb4';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:572:            $params['defaultTableOptions'] = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:581:        $conn = DriverManager::getConnection($params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:609:     * @param array<string, mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:611:    public function createDatabaseUrl(array $params): ?string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:613:        if (!isset($params['database'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:618:        switch ($params['database']) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:620:                $url = 'sqlite://'.$params['database_name'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:625:                $url = str_replace('pdo_', '', $params['database']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:627:                if (isset($params['database_user'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:628:                    $url .= $params['database_user'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:629:                    if (isset($params['database_password'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:630:                        $url .= ':'.\rawurlencode((string) $params['database_password']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:634:                if (isset($params['database_host'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:635:                    $url .= $params['database_host'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:636:                    if (isset($params['database_port'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:637:                        $url .= ':'.$params['database_port'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:641:                $url .= $params['database_name'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:679:     * @param array<string, string> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:683:    public function createMailerUrl(array $params): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:685:        if (isset($params['transport'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:686:            $url = $params['transport'].'://';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:690:        if (isset($params['smtp_username'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:691:            $url .= $params['smtp_username'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:692:            if (isset($params['smtp_password'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:693:                $url .= ':'.$params['smtp_password'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:699:        if (isset($params['encryption'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:700:            $queryStrings['encryption'] = $params['encryption'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:701:            if ($params['encryption'] === 'ssl' && !isset($params['smtp_port'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:702:                $params['smtp_port'] = 465;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:705:        if (isset($params['auth_mode'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:706:            $queryStrings['auth_mode'] = $params['auth_mode'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:708:            if (isset($params['smtp_username'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:714:        if (isset($params['smtp_host'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:715:            $url .= $params['smtp_host'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:716:            if (isset($params['smtp_port'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:717:                $url .= ':'.$params['smtp_port'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:721:        if (isset($params['smtp_username']) || array_values($queryStrings)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:938:     * @param array<string, string> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:942:    public function createAppData(array $params, EntityManager $em): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:948:            'site_url' => $params['http_url'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:949:            'shop_name' => $params['shop_name'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:958:     * @param array<string, mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:962:    protected function sendAppData(array $params, EntityManager $em): static
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Install/InstallController.php:965:            $query = http_build_query($this->createAppData($params, $em));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseHistoryController.php:152:                'transfer_complete_date' => $this->stockHistoryRepository->getTransferCompleteDateForOrder($buyOrder),
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/reference.php:1044: *             platform_service?: scalar|null|Param, // Deprecated: The "platform_service" configuration key is deprecated since doctrine-bundle 2.9. DBAL 4 will not support setting a custom platform via connection params anymore.
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/reference.php:1566: *             params?: list<scalar|null|Param>,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:126:                $params = $this->getParams();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:127:                $params['user'] = Authority::SYSTEM;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:128:                parent::__construct($params, $this->_driver, $this->_config);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:129:                $this->_conn = $this->_driver->connect($params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:224:    public function __construct(array $params, Driver $driver, ?Configuration $config = null, ?EventManager $eventManager = null)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:226:        parent::__construct($params, $driver, $config, $eventManager);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:315:        $params = $this->getParams();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:317:        $params['user'] = $realParams['role'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:320:        parent::__construct($params, $this->_driver, $this->_config);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:321:        $this->_conn = $this->_driver->connect($params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:336:        $params = $this->getParams();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:338:            $params['user'] = $guest['name'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:339:            parent::__construct($params, $this->_driver, $this->_config);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:340:            $this->_conn = $this->_driver->connect($params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:343:            $params['user'] = Authority::GUEST;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:344:            parent::__construct($params, $this->_driver, $this->_config);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:345:            $this->_conn = $this->_driver->connect($params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:378:            $params = $this->getParams();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:379:            $params['user'] = Authority::LOGIN_CUSTOMER;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:380:            parent::__construct($params, $this->_driver, $this->_config);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:381:            $this->_conn = $this->_driver->connect($params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:396:            $params = $this->getParams();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:397:            $params['user'] = Authority::LOGIN_MEMBER;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:398:            parent::__construct($params, $this->_driver, $this->_config);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/EccubeRoleConnection.php:399:            $this->_conn = $this->_driver->connect($params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/IgnoreRoutingNotFoundExtension.php:96:        $paramsNode = $argsNode->hasNode('parameters') ? $argsNode->getNode('parameters') : (
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/IgnoreRoutingNotFoundExtension.php:100:        if (null === $paramsNode || $paramsNode instanceof ArrayExpression && \count($paramsNode) <= 2
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/IgnoreRoutingNotFoundExtension.php:101:            && (!$paramsNode->hasNode('1') || $paramsNode->getNode('1') instanceof ConstantExpression)
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/test/eccube_rate_limiter.yaml:11:        test_params:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Request/Context.php:109:        if ($request->attributes->get('_route') === 'smaregi_webhook') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Request/Context.php:113:        $webhookPath = $this->eccubeConfig->get('eccube_smaregi_webhook_route');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:106:            // TODO: 支店側本店在庫更新API連携
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:107:            // $branchUpdate->noticeStockUpdate($productStockArr);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/EventSubscriber/StockMoveTransferEventSubscriber.php:72:            ->getFieldForColumn('move_transfer_status_id');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/InvalidLocaleRedirectListener.php:50:        $this->smaregiWebhookRoute = $eccubeConfig->get('eccube_smaregi_webhook_route') ?? '';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/BaseProductSearchEvent.php:33:    private array $params;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/BaseProductSearchEvent.php:52:     * @param array<string, mixed> $params 検索条件
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/BaseProductSearchEvent.php:54:    public function __construct(ProductClassRepository $repository, array $params)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/BaseProductSearchEvent.php:57:        $this->params = $params;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/BaseProductSearchEvent.php:159:        return $this->params;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/BaseProductSearchEvent.php:167:        return $this->params[$name];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/BaseProductSearchEvent.php:175:        if (!isset($this->params[$name])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/ProductSearch/Event/BaseProductSearchEvent.php:178:        $value = $this->params[$name];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/WhereClause.php:28:     * @param string|int|array<string, int|string|null>|null $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/WhereClause.php:30:    private function __construct(private readonly Comparison|string $expr, private readonly string|int|array|null $params = null)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/WhereClause.php:169:     * @param string|int|array<string, int|string>|null $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/WhereClause.php:171:    public static function between(string $var, string $x, string $y, string|int|array|null $params): WhereClause
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/WhereClause.php:173:        return new WhereClause(self::expr()->between($var, $x, $y), self::isMap($params) ? $params : [$x => $params[0], $y => $params[1]]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/WhereClause.php:243:        if ($this->params) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/WhereClause.php:244:            foreach ($this->params as $key => $param) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/TwigInitializeListener.php:87:        $params = $this->router->getContext()->getParameters();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/TwigInitializeListener.php:90:            $params['_locale'] = $request->attributes->get('_locale');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/TwigInitializeListener.php:94:            $params['_shop'] = $request->attributes->get('_shop');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/TwigInitializeListener.php:97:        $this->router->getContext()->setParameters($params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/TwigInitializeListener.php:110:            $routeParams = $attributes->get('_route_params', []);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/Enterprise/AuditLogListener.php:113:        // set default audit log params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Session/Storage/Handler/SameSiteNoneCompatSessionHandler.php:53:            header(sprintf('Cache-Control: max-age=%d, private, must-revalidate', 60 * (int) ini_get('session.cache_expire')));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiTransactionProcessMessage.php:50:    public function getTransactionHeadId(): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/JoinClause.php:105:     * @param array<mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/JoinClause.php:111:    protected function createStatements($params, $queryKey): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/JoinClause.php:139:     * @param array<mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/JoinClause.php:145:    protected function createStatements($params, $queryKey): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:365:        $transactionHeadIds = $this->extractTransactionHeadIds($response['json']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:398:    private function extractTransactionHeadIds(?array $json): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/WhereCustomizer.php:21:     * @param array<string, mixed>|null $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/WhereCustomizer.php:24:    final public function customize(QueryBuilder $builder, ?array $params, string $queryKey): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/WhereCustomizer.php:26:        $params ??= [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/WhereCustomizer.php:27:        foreach ($this->createStatements($params, $queryKey) as $whereClause) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/WhereCustomizer.php:33:     * @param array<string, mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/WhereCustomizer.php:37:    abstract protected function createStatements(array $params, string $queryKey): array;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiApiService.php:31:     * @param string $params パラメータ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiApiService.php:39:        string $params,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/OrderByCustomizer.php:24:     * @param array<mixed>|null $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/OrderByCustomizer.php:27:    final public function customize(QueryBuilder $builder, ?array $params, string $queryKey): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/OrderByCustomizer.php:29:        $params ??= [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/OrderByCustomizer.php:30:        foreach ($this->createStatements($params, $queryKey) as $index => $orderByClause) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/OrderByCustomizer.php:43:     * @param array<mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/OrderByCustomizer.php:47:    abstract protected function createStatements(array $params, string $queryKey): array;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Smaregi/Api/Transaction/TransactionDto.php:32:        public readonly ?string $disposeServerTransactionHeadId,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/QueryCustomizer.php:26:     * @param array<mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/QueryCustomizer.php:28:    public function customize(QueryBuilder $builder, array $params, string $queryKey): void;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/SqlUtil.php:122:     * @param array<string> $params 検索するパラメータ配列
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/SqlUtil.php:128:    public static function multiTextQuery(QueryBuilder $qb, array $params, array $searchedColumns, ?array $numericIdMatch = null): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/SqlUtil.php:130:        foreach ($params as $num => $param) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/SqlUtil.php:584:     * 複数のテキスト検索キーワード ($params) を、LIKE 部分一致と完全一致のカラム群に対して同時にマッチさせる WHERE 句を
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/SqlUtil.php:589:     * @param array<string> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/SqlUtil.php:596:        array $params,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/SqlUtil.php:602:        foreach (array_unique($params) as $num => $param) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/SqlUtil.php:643:     * $params のいずれかと一致するかを AND / OR / NOT で判定する JOIN + WHERE 句を QueryBuilder に追加する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/SqlUtil.php:653:     * @param array<int|string> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/SqlUtil.php:662:        array $params,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/SqlUtil.php:664:        $params = array_unique($params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/SqlUtil.php:668:                foreach ($params as $idx => $param) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/SqlUtil.php:679:                    ->setParameter($placeholder, $params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/SqlUtil.php:687:                    ->setParameter($placeholder, $params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Front/Mypage/PurchaseHistoryNetDetailViewDto.php:32:        public ?\DateTimeInterface $transferCompletedAt,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/Block/CategoryListBlockListener.php:78:        // 本店トップページ・支店トップページリクエストのみ、payload構築の対象とする
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/RateLimiterListener.php:61:            if (!empty($config['params'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/RateLimiterListener.php:62:                $matchParams = array_filter($config['params'], fn ($value, $key) => $request->get($key) === $value, ARRAY_FILTER_USE_BOTH);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/RateLimiterListener.php:64:                if (count($config['params']) !== count($matchParams)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:451:            || (isset($searchData['stock_move_transfer_id']) && trim((string) $searchData['stock_move_transfer_id']) !== '')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveController.php:299:            'stock_move_transfer_details' => $StockMoveTransferDetails,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveController.php:340:            'stock_move_transfer_details' => $StockMoveTransferDetails,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveController.php:374:            StockMoveTransferDetails: $formData['stock_move_transfer_details'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveController.php:709:            'stock_move_transfer_details' => $StockMoveTransferDetails,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveController.php:862:            'stock_move_transfer_details' => $StockMoveTransferDetails,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveController.php:901:            StockMoveTransferDetails: $formData['stock_move_transfer_details'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:643:            $result['message'] = $this->translator->trans($result['message_key'], $result['message_params'] ?? []);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:644:            unset($result['message_key'], $result['message_params']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:1029:     * @param array{route: string, params: array<string, mixed>, errorMessage?: string|null, successMessage?: string|null} $result
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:1040:        return $this->redirectToRoute($result['route'], $result['params']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Admin/Purchase/HistorySearchDataDto.php:29:        public ?\DateTime $transferCompleteDateFrom = null,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Admin/Purchase/HistorySearchDataDto.php:30:        public ?\DateTime $transferCompleteDateTo = null,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Admin/Purchase/HistorySearchDataDto.php:55:     *     transfer_complete_date_from?: ?\DateTime,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Admin/Purchase/HistorySearchDataDto.php:56:     *     transfer_complete_date_to?: ?\DateTime,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Admin/Purchase/HistorySearchDataDto.php:77:            transferCompleteDateFrom: $formData['transfer_complete_date_from'] ?? null,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Admin/Purchase/HistorySearchDataDto.php:78:            transferCompleteDateTo: $formData['transfer_complete_date_to'] ?? null,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitController.php:727:     * @param array{route: string, params: array<string, mixed>, errorMessage?: string|null, successMessage?: string|null} $result
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitController.php:738:        return $this->redirectToRoute($result['route'], $result['params']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockHistoryController.php:287:        $params = $request->request->all();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockHistoryController.php:288:        $ids = $params['ids'] ?? [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockHistoryController.php:336:        $params = $request->request->all();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockHistoryController.php:337:        $ids = $params['ids'] ?? [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:66:    private const ROUTE_TRANSFER_COMPLETE = 'admin_stock_transfer';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:67:    private const ROUTE_TRANSFER_APPROVAL = 'admin_stock_transfer_approval';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:96:            $this->addError('admin.stock.transfer.approval_status_error', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:114:    #[Route(path: '/%eccube_admin_route%/product/stock/transfer/new', name: 'admin_stock_transfer_new', methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:115:    #[Template(template: '@admin/Stock/transfer_new.twig')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:140:            'transfer_details' => array_map(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:144:                    'move_transfer_quantity' => null,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:157:        $formAction = $this->generateUrl('admin_stock_transfer_store', ['productStockIds' => $productStockIds]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:174:    #[Route(path: '/%eccube_admin_route%/product/stock/transfer/store', name: 'admin_stock_transfer_store', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:175:    #[Template(template: '@admin/Stock/transfer_new.twig')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:187:        $formDataFromRequest = $request->request->all('admin_stock_transfer_new');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:190:            'transfer_details' => $formDataFromRequest['transfer_details'] ?? [],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:208:                'formAction' => $this->generateUrl('admin_stock_transfer_store', ['productStockIds' => $productStockIds]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:216:            $this->addError('admin.stock.transfer.not_editable_store', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:223:        foreach ($formData['transfer_details'] as $detail) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:228:                    $this->addError('admin.stock.transfer.not_editable_store', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:240:            transferDetails: $formData['transfer_details'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:258:                'formAction' => $this->generateUrl('admin_stock_transfer_store', ['productStockIds' => $productStockIds]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:266:        return $this->redirectToRoute('admin_stock_transfer_approval', ['id' => $StockTransfer->getId()]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:274:    #[Route(path: '/%eccube_admin_route%/product/stock/transfer/{id}', requirements: ['id' => '\d+'], name: 'admin_stock_transfer', methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:275:    #[Template(template: '@admin/Stock/transfer_complete.twig')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:307:    #[Route(path: '/%eccube_admin_route%/product/stock/transfer/{id}/approval', requirements: ['id' => '\d+'], name: 'admin_stock_transfer_approval', methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:308:    #[Template(template: '@admin/Stock/transfer_approval.twig')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:336:            'formAction' => $this->generateUrl('admin_stock_transfer_approval_submit', ['id' => $StockMoveTransfer->getId()]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:347:    #[Route(path: '/%eccube_admin_route%/product/stock/transfer/{id}/approval/submit', requirements: ['id' => '\d+'], name: 'admin_stock_transfer_approval_submit', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:348:    #[Template(template: '@admin/Stock/transfer_approval.twig')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:360:            return $this->redirectToRoute('admin_stock_transfer_approval', ['id' => $StockMoveTransfer->getId()]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:397:                'formAction' => $this->generateUrl('admin_stock_transfer_approval_submit', ['id' => $StockMoveTransfer->getId()]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:406:            $this->addError('admin.stock.transfer.approval_no_authority', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:408:            return $this->redirectToRoute('admin_stock_transfer_approval', ['id' => $StockMoveTransfer->getId()]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:428:                return $this->redirectToRoute('admin_stock_transfer_approval', ['id' => $StockMoveTransfer->getId()]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:443:                return $this->redirectToRoute('admin_stock_transfer_approval', ['id' => $StockMoveTransfer->getId()]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:448:        return $this->redirectToRoute('admin_stock_transfer', ['id' => $StockMoveTransfer->getId()]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockTransferController.php:454:    #[Route(path: '/%eccube_admin_route%/product/stock/transfer/dest-product-class-info', name: 'admin_stock_transfer_dest_product_class_info', methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockBulkApprovalController.php:179:        $params = [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockBulkApprovalController.php:181:            $params['productStockIds'][] = $ps->getId();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockBulkApprovalController.php:184:        return $this->redirectToRoute('admin_stock_bulk_approval_new', $params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:69:    private const SESSION_KEY_SEARCH = 'eccube.admin.stock.move_transfer.search';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:71:    private const SESSION_KEY_PAGE_NO = 'eccube.admin.stock.move_transfer.page_no';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:73:    private const SESSION_KEY_PAGE_COUNT = 'eccube.admin.stock.move_transfer.page_count';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:108:    #[Route(path: '/%eccube_admin_route%/product/stock/move_transfer', name: 'admin_stock_move_transfer', methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:109:    #[Route(path: '/%eccube_admin_route%/product/stock/move_transfer/page/{page_no}', name: 'admin_stock_move_transfer_page', requirements: ['page_no' => '\d+'], methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:226:    #[Route(path: '/%eccube_admin_route%/product/stock/move_transfer/move_csv_import', name: 'admin_stock_move_transfer_move_csv_import', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:240:            return $this->redirectToRoute('admin_stock_move_transfer');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:249:            return $this->redirectToRoute('admin_stock_move_transfer');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:255:            return $this->redirectToRoute('admin_stock_move_transfer');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:264:            $this->addError('admin.stock.move_transfer.not_editable_store', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:266:            return $this->redirectToRoute('admin_stock_move_transfer');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:301:            return $this->redirectToRoute('admin_stock_move_transfer');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:315:            return $this->redirectToRoute('admin_stock_move_transfer');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:326:    #[Route(path: '/%eccube_admin_route%/product/stock/move_transfer/transfer_csv_import', name: 'admin_stock_move_transfer_transfer_csv_import', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:340:            return $this->redirectToRoute('admin_stock_move_transfer');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:349:            return $this->redirectToRoute('admin_stock_move_transfer');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:355:            return $this->redirectToRoute('admin_stock_move_transfer');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:358:        $TransferBaseInfo = $form->get('transfer_base_info')->getData();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:359:        $transferStockLocationId = (int) $form->get('transfer_stock_location_id')->getData();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:363:            $this->addError('admin.stock.move_transfer.not_editable_store', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:365:            return $this->redirectToRoute('admin_stock_move_transfer');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:372:            $transferStockLocationId,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:402:            return $this->redirectToRoute('admin_stock_move_transfer');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:416:            return $this->redirectToRoute('admin_stock_move_transfer');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:419:        return $this->redirectToRoute('admin_stock_transfer', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:427:    #[Route(path: '/%eccube_admin_route%/product/stock/move_transfer/csv_export', name: 'admin_stock_move_transfer_csv_export', methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:451:    #[Route(path: '/%eccube_admin_route%/product/stock/move_transfer/barcode_csv_export', name: 'admin_stock_move_transfer_barcode_csv_export', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:468:    #[Route(path: '/%eccube_admin_route%/product/stock/move_transfer/return_list_csv_export', name: 'admin_stock_move_transfer_return_list_csv_export', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:486:    #[Route(path: '/%eccube_admin_route%/product/stock/move_transfer/return_list_pdf_export', name: 'admin_stock_move_transfer_return_list_pdf_export', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:518:        $redirectUrl = $this->generateUrl('admin_stock_move_transfer_page', ['page_no' => $pageNo]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:522:                $this->translator->trans('admin.stock.move_transfer.return_list_csv_export.no_selection'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:572:        $redirectUrl = $this->generateUrl('admin_stock_move_transfer_page', ['page_no' => $pageNo]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:576:                $this->translator->trans('admin.stock.move_transfer.barcode_csv_export.no_selection'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:617:    #[Route(path: '/%eccube_admin_route%/product/stock/move_transfer/create_instruction', name: 'admin_stock_move_transfer_create_instruction', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:624:            return $this->redirectToRoute('admin_stock_move_transfer', array_merge($request->query->all(), ['resume' => '1']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:630:                $this->addError('admin.stock.move_transfer.create_instruction.no_selection', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:632:                return $this->redirectToRoute('admin_stock_move_transfer', array_merge($request->query->all(), ['resume' => '1']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:638:            $this->addError('admin.stock.move_transfer.create_instruction.no_selection', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:640:            return $this->redirectToRoute('admin_stock_move_transfer', array_merge($request->query->all(), ['resume' => '1']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:645:            $this->addError('admin.stock.move_transfer.create_instruction.no_selection', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:647:            return $this->redirectToRoute('admin_stock_move_transfer', array_merge($request->query->all(), ['resume' => '1']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:660:            return $this->redirectToRoute('admin_stock_move_transfer', array_merge($request->query->all(), ['resume' => '1']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:663:        $this->addSuccess('admin.stock.move_transfer.create_instruction.success', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:671:    #[Route(path: '/%eccube_admin_route%/product/stock/move_transfer/move_csv_template', name: 'admin_stock_move_transfer_move_csv_template', methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:695:    #[Route(path: '/%eccube_admin_route%/product/stock/move_transfer/transfer_csv_template', name: 'admin_stock_move_transfer_transfer_csv_template', methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:701:            'stock_transfer.csv'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchExportService.php:51:        ParameterBagInterface $params,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchExportService.php:58:        $this->cdnBaseUrl = (string) $params->get('cdn_base_url');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchExportService.php:59:        $this->s3Endpoint = (string) $params->get('s3_endpoint');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchExportService.php:60:        $this->awsS3Bucket = (string) $params->get('aws_s3_bucket');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchExportService.php:61:        $this->workerCount = max(1, (int) $params->get('eccube_unisearch_export_workers'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchExportService.php:167:            'is_branch_published',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchExportService.php:496:            'is_branch_published' => $row['is_branch_published'] ?? '0',
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/prod/eccube_rate_limiter.yaml:18:            params:
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/prod/eccube_rate_limiter.yaml:62:            params:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:130:        $params = [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:133:            $params[] = 'fq.is_branch_published=1';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:139:            $params[] = 'kw='.urlencode(str_replace('&amp;', '&', $escapedKeyword));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:149:                $params[] = 'fq.category_id='.urlencode(implode(':', $categoryIds));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:154:            $params[] = 'fq.cardset='.urlencode((string) $query['cardset']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:162:            $params[] = 'fq.format='.urlencode((string) $formatCondition);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:170:            $params[] = 'fq.price='.urlencode($priceFrom.'~'.$priceTo);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:178:            $params[] = 'fq.buy_price='.urlencode($buyPriceFrom.'~'.$buyPriceTo);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:183:                $params[] = 'fq.card_condition='.urlencode(implode('|', $query['cardCondition']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:185:                $params[] = 'fq.card_condition='.urlencode((string) $query['cardCondition']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:190:            $params[] = 'fq.high_price_code='.urlencode((string) $query['highPriceCode']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:194:            $params[] = 'fq.reservation_flg='.urlencode((string) $query['reservationFlg']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:198:            $params[] = 'fq.illustrator='.urlencode((string) $query['illustrator']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:202:            $params[] = 'fq.subtype='.urlencode((string) $query['subtype']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:207:            $params[] = 'fq.color='.urlencode($colorCondition);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:219:            $params[] = 'fq.color_identity='.urlencode(implode('|', (array) $query['colorIdentities']).'^'.implode('^', $notColorIdentities));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:231:            $params[] = 'fq.mana_cost='.urlencode(implode('|', $manaCostCondition));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:236:                $params[] = 'fq.rarity='.urlencode(implode('|', $query['rarity']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:238:                $params[] = 'fq.rarity='.urlencode((string) $query['rarity']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:244:            $params[] = 'fq.card_type='.urlencode($cardtypeCondition);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:250:                $params[] = 'fq.foil_flg='.urlencode(implode('|', $foilFlg));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:252:                $params[] = 'fq.foil_flg='.urlencode((string) $foilFlg);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:258:                $params[] = 'fq.frame_flg='.urlencode(implode('|', $frameFlg));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:260:                $params[] = 'fq.frame_flg='.urlencode((string) $frameFlg);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:283:            $params[] = 'fq.language='.urlencode(implode('|', $languageCondition));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:288:                $params[] = 'fq.tag='.urlencode(implode('|', $query['tags']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:290:                $params[] = 'fq.tag='.urlencode((string) $query['tags']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:295:            $params[] = 'fq.sale_flg=1';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:301:                $params[] = 'fq.card_name='.urlencode($card->getNameEn());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:306:            $params[] = 'fq.card_name='.urlencode(htmlspecialchars((string) $query['cardName'], ENT_COMPAT));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:312:                $params[] = 'fq.stock='.urlencode((string) (int) $shop->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:318:            $params[] = 'sort='.urlencode('color_sequence asc,card_name asc,language asc,foil_flg asc,product asc');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:321:            $params[] = 'sort='.urlencode('price '.$order.',color_sequence asc,card_name '.$order.',language asc,foil_flg asc');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:324:            $params[] = 'sort='.urlencode('release_date desc,product desc,language asc,foil_flg asc');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:327:            $params[] = 'sort='.urlencode('buy_price '.$order.',color_sequence asc,card_name asc,language asc,foil_flg asc');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:332:        $params[] = 'rows='.urlencode((string) $pageSize);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:333:        $params[] = 'page='.urlencode((string) $page);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:335:        return implode('&', $params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/CardController.php:78:        $params = $request->query->all();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/CardController.php:79:        if (!$this->isValidSearchParams($params)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/CardController.php:86:        $result = $this->cardRepository->findBySearchParams($params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/CardController.php:96:     * @param array<string, mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/CardController.php:98:    private function isValidSearchParams(array $params): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/CardController.php:101:            if (!$this->isValidEnumParam($params, $config['field'], $config['allowed'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/CardController.php:106:            if (!$this->isValidDigitParam($params, $field)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/CardController.php:115:     * @param array<string, mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/CardController.php:118:    private function isValidEnumParam(array $params, string $field, array $allowed): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/CardController.php:120:        if (!isset($params[$field]) || $params[$field] === '') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/CardController.php:124:        return is_string($params[$field]) && in_array($params[$field], $allowed, true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/CardController.php:128:     * @param array<string, mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/CardController.php:130:    private function isValidDigitParam(array $params, string $field): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/CardController.php:132:        if (!isset($params[$field]) || $params[$field] === '') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/CardController.php:135:        if (!is_string($params[$field])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/CardController.php:139:        return preg_match('/^\d+$/', $params[$field]) === 1;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:55:     * @param array<string, mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:57:    public function buildSaveData(array $params, DtbDeck $Deck, ?DtbPlayer $Player = null): BuildSaveDataResultDto
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:60:        $cardsParam = $params['cards'] ?? [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:63:        $masters = $this->resolveMasterEntities($params, $Deck, $extracted['CardImage']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:65:        $deckName = $params['deck_name'] ?? null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:207:     * @param array<string, mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:218:    private function resolveMasterEntities(array $params, DtbDeck $Deck, ?MtbCardImage $CardImage): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:221:        if (isset($params['format_id']) && $params['format_id'] !== '') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:222:            $Format = $this->entityManager->getRepository(MtbFormat::class)->find($params['format_id']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:226:        if (isset($params['archetype_id']) && $params['archetype_id'] !== '') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:227:            $Archetype = $this->entityManager->getRepository(DtbArchetype::class)->find($params['archetype_id']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:231:        if (isset($params['scope_id']) && $params['scope_id'] !== '') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:232:            $Disp = $this->entityManager->getRepository(MtbDisp::class)->find($params['scope_id']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:238:        if (isset($params['image_card_id']) && $params['image_card_id'] !== '') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:239:            $CardImage = $this->cardImageRepository->findOneByCardId((int) $params['image_card_id']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:250:        if (isset($params['campaign_tag_ids']) && $params['campaign_tag_ids'] !== '') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:251:            $campaignTagIds = is_array($params['campaign_tag_ids']) ? $params['campaign_tag_ids'] : [$params['campaign_tag_ids']];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:313:        $params = json_decode($json, true) ?? [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:314:        if ($params === []) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:318:        return $this->enrichRedisData($deckId, $params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:387:     * @param array<string, mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:391:    private function enrichRedisData(int $deckId, array $params): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:395:            return $params;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:404:            'scope_id' => (int) ($params['scope_id'] ?? $Deck->getDisp()->getId()),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:410:        $Format = isset($params['format_id'])
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:411:            ? $this->entityManager->getRepository(MtbFormat::class)->find($params['format_id'])
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:417:        $Archetype = isset($params['archetype_id'])
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:418:            ? $this->entityManager->getRepository(DtbArchetype::class)->find($params['archetype_id'])
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:424:        $deck['deck_name'] = $params['deck_name'] ?? $Deck->getDeckName();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:427:        if (isset($params['image_card_id']) && $params['image_card_id'] !== '') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:429:                ->findOneBy(['Card' => $params['image_card_id']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:451:        if (isset($params['campaign_tag_ids']) && is_array($params['campaign_tag_ids'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:452:            $CampaignTagEntities = $this->entityManager->getRepository(MtbCampaignTag::class)->findBy(['id' => $params['campaign_tag_ids']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:489:        $deck['instant_save_flag'] = $params['instant_save_flag'] ?? false;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/DeckService.php:495:        $cardsParam = $params['cards'] ?? [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/AbstractDeckBuilderController.php:68:            $response->headers->set('Access-Control-Allow-Origin', $origin);
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube_nav.yaml:80:            name: admin.stock.transfer.subtitle
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube_nav.yaml:89:                stock_move_transfer:
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube_nav.yaml:90:                    name: admin.stock.move_transfer.title
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube_nav.yaml:91:                    url: admin_stock_move_transfer
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube_nav.yaml:200:                branch:
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube_nav.yaml:201:                    name: admin.content.branch_toppage_management
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube_nav.yaml:202:                    url: admin_content_branch_toppage
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/security.yaml:68:            pattern: '^/%eccube_smaregi_webhook_route%/'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PluginApiService.php:81:        $params['category_id'] = $data['category_id'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PluginApiService.php:82:        $params['price_type'] = empty($data['price_type']) ? 'all' : $data['price_type'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PluginApiService.php:83:        $params['keyword'] = $data['keyword'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PluginApiService.php:84:        $params['sort'] = $data['sort'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PluginApiService.php:85:        $params['page'] = (isset($data['page_no']) && !empty($data['page_no'])) ? $data['page_no'] : 1;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PluginApiService.php:86:        $params['per_page'] = (isset($data['page_count']) && !empty($data['page_count'])) ? $data['page_count'] : $this->eccubeConfig->get('eccube_default_page_count');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PluginApiService.php:88:        $payload = $this->requestApi($url, $params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:83:        $params = $this->parseJsonBody($request);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:88:                params: $params,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:110:        $scopeId = (int) ($params['scope_id'] ?? 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:132:        $params = $this->parseJsonBody($request);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:138:                params: $params,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:169:        $scopeId = (int) ($params['scope_id'] ?? 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:269:        $params = $request->query->all();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:270:        $mode = $params['mode'] ?? 'public';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:290:        $perPage = min((int) ($params['per_page'] ?? 20), 100);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:291:        $page = max((int) ($params['page'] ?? 1), 1);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:303:        if (StringUtil::isNotBlank($params['search_decks_count'] ?? null)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:315:                ->setParameter('maxDeckId', $maxDeckId - (int) $params['search_decks_count']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:327:        $eventDeckFlag = $params['event_deck_flag'] ?? '1';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:328:        $userDeckFlag = $params['user_deck_flag'] ?? '1';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:349:        if (StringUtil::isNotBlank($params['format'] ?? null) && is_array($params['format'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:351:                ->setParameter('formats', $params['format']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:354:        if (StringUtil::isNotBlank($params['archetype'] ?? null) && is_array($params['archetype'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:356:                ->setParameter('archetypes', $params['archetype']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:366:            if (!StringUtil::isNotBlank($params[$key] ?? null)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:369:            $date = $this->parseDateBoundary((string) $params[$key], $time);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:380:        if (StringUtil::isNotBlank($params['tag'] ?? null) && is_array($params['tag'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:382:                ->setParameter('tags', $params['tag']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:385:        if (StringUtil::isNotBlank($params['campaign_tag_ids'] ?? null) && is_array($params['campaign_tag_ids'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:387:                ->setParameter('campaignTags', $params['campaign_tag_ids']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:390:        if (StringUtil::isNotBlank($params['user_id'] ?? null)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:392:                ->setParameter('deckUserId', $params['user_id']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:395:        if (StringUtil::isNotBlank($params['user_name'] ?? null)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:399:                ->setParameter('playerName', '%'.addcslashes($params['user_name'], '%_\\').'%');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:402:        if (StringUtil::isNotBlank($params['event_name'] ?? null)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:403:            SqlUtil::multiTextQuery($qb, [$params['event_name']], [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:413:            if (!StringUtil::isNotBlank($params[$key] ?? null)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:416:            $date = $this->parseDateBoundary((string) $params[$key], $time);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:427:        if (StringUtil::isNotBlank($params['participants_from'] ?? null)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:429:                ->setParameter('participantsFrom', (int) $params['participants_from']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:432:        if (StringUtil::isNotBlank($params['participants_to'] ?? null)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:434:                ->setParameter('participantsTo', (int) $params['participants_to']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:437:        $championFlag = filter_var($params['champion_flag'] ?? false, FILTER_VALIDATE_BOOLEAN);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:438:        $top8Flag = filter_var($params['top8_flag'] ?? false, FILTER_VALIDATE_BOOLEAN);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:450:        if (!filter_var($params['regulation_violation_flag'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:455:        if (StringUtil::isNotBlank($params['cards'] ?? null) && is_array($params['cards'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:456:            foreach ($params['cards'] as $key => $card) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:465:        if (isset($params['cache_key']) && $params['cache_key'] !== '') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:466:            $normalizedParams = $params;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:488:        $sortKey = (string) ($params['sort'] ?? 'create_date');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:490:        $sortOrder = strtoupper((string) ($params['order'] ?? 'DESC')) === 'ASC' ? 'ASC' : 'DESC';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:690:        $params = $this->parseJsonBody($request);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:696:                params: $params,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/DeckController.php:735:        $scopeId = (int) ($params['scope_id'] ?? 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/ProductImageService.php:279:        $params = $productClassIds;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/ProductImageService.php:284:                $params
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:65:    eccube_smaregi_webhook_route: '%env(ECCUBE_SMAREGI_WEBHOOK_ROUTE)%'
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:191:    eccube_branch_url_max_len: 32
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:360:    branch_top_banner_directory: 'banner/top'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/InventoryReflectService.php:110:            // 支店システムへ更新情報を連携
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/InventoryReflectService.php:112:            // $this->branchUpdateService->noticeStockUpdate($productStocks);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:203:                    'branchSalesQuantities' => [],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:239:                    'branchSalesQuantities' => [],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:272:        $branchSalesQuantities = [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:279:                $branchSalesQuantities = $this->dtbSalesQuantityRepository->getBranchSalesQuantitiesByProductClassIds($productClassIds);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:296:            'branchSalesQuantities' => $branchSalesQuantities,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:808:                // 支店の商品公開ステータス
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:861:                        $params = array_filter($result, fn ($key) => !str_starts_with((string) $key, '_'), ARRAY_FILTER_USE_KEY);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:864:                        return $this->redirectToRoute($result['_route'], $params);
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/services.yaml:26:    smaregi_webhook_secret: '%env(SMAREGI_WEBHOOK_SECRET)%'
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/services.yaml:27:    smaregi_webhook_secret_header: '%env(SMAREGI_WEBHOOK_SECRET_HEADER)%'
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/services.yaml:631:            $secret: '%smaregi_webhook_secret%'
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/services.yaml:632:            $secretHeader: '%smaregi_webhook_secret_header%'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:165:                // 支店の場合(OTC/SMOOTH_OTCのみ表示)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/JoinCustomizer.php:24:     * @param array<mixed>|null $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/JoinCustomizer.php:27:    final public function customize(QueryBuilder $builder, ?array $params, string $queryKey): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/JoinCustomizer.php:29:        $params ??= [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/JoinCustomizer.php:30:        foreach ($this->createStatements($params, $queryKey) as $joinClause) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/JoinCustomizer.php:39:     * @param array<mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/JoinCustomizer.php:43:    abstract public function createStatements(array $params, string $queryKey): array;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/Queries.php:32:     * @param array<mixed>|null $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/Queries.php:34:    public function customize(string $queryKey, QueryBuilder $builder, ?array $params): QueryBuilder
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Query/Queries.php:39:                $customizer->customize($builder, $params, $queryKey);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/BannerController.php:207:     * @param array{message: string, params?: array<string, string>}|null $uploadError
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:41:     * 支店トップページ管理の初期表示
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:45:    #[Route(path: '/%eccube_admin_route%/content/branch_toppage', name: 'admin_content_branch_toppage', methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:46:    #[Template(template: '@admin/Content/branch_toppage.twig')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:53:     * 支店トップページ管理の支店選択
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:59:    #[Route(path: '/%eccube_admin_route%/content/branch_toppage/select', name: 'admin_content_branch_toppage_select', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:66:     * 支店トップページ管理の登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:72:    #[Route(path: '/%eccube_admin_route%/content/branch_toppage/register', name: 'admin_content_branch_toppage_register', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:78:        $formData = $request->request->all('branch_toppage_management');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:86:            if (!$this->isCsrfTokenValid('branch_toppage_management', (string) ($formData['_token'] ?? ''))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:103:        $form->get('branch_list')->setData($BaseInfo);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:125:     * 支店トップページ管理の画面表示に必要なデータを構築
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:138:            $form->get('branch_list')->setData($BaseInfo);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:143:            'selected_branch_id' => $BaseInfo->getId(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:144:            'common_branch_id' => $this->baseInfoRepository->getMallBaseInfo()->getId(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:145:            'is_common_branch' => $this->isCommonBranch($BaseInfo),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:151:     * 選択中の支店が支店共通かどうかを判定する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:163:     * 支店トップページ管理の画面表示
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:172:        return $this->render('@admin/Content/branch_toppage.twig', $this->buildPage($BaseInfo, $form));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:202:        $id = $request->request->getInt('branch_id');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:203:        $formData = $request->request->all('branch_toppage_management');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:204:        $formBranchId = (int) ($formData['branch_list'] ?? 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:219:     * 支店トップページ管理の入力内容を検証し、保存前に必要な値を BaseInfo へ反映する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:236:                $this->addError('admin.content.branch_toppage.banner_image_required', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:244:                    $this->addError('admin.content.branch_toppage.banner_image_required', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:249:                $this->addError('admin.content.branch_toppage.banner_image_required', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:274:                $this->addError('admin.content.branch_toppage.duplicate_section', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:280:                $this->addError('admin.content.branch_toppage.tag_required', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:316:        $uploadDir = $this->eccubeConfig->get('branch_top_banner_directory').'/'.$BaseInfo->getHtmlClassName();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Deck/DeckValidationService.php:66:                    $warningsByBoard[$boardId][] = trans($message['key'], $message['params']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Deck/DeckValidationService.php:127:                    $mainErrors[] = trans($message['key'], $message['params']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Deck/DeckValidationService.php:134:                    $sideErrors[] = trans($message['key'], $message['params']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Deck/DeckValidationService.php:227:     * @return array{key: string, params: array<string, scalar>}|null
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Deck/DeckValidationService.php:234:            return ['key' => 'admin.deck.validation.unknown_card', 'params' => $baseParams];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Deck/DeckValidationService.php:239:            return ['key' => 'admin.deck.validation.out_of_range', 'params' => $baseParams];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Deck/DeckValidationService.php:245:                return ['key' => 'admin.deck.validation.banned', 'params' => $baseParams];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Deck/DeckValidationService.php:248:                return ['key' => 'admin.deck.validation.restricted', 'params' => $baseParams];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Deck/DeckValidationService.php:253:            return ['key' => 'admin.deck.validation.highlander_only', 'params' => $baseParams];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Deck/DeckValidationService.php:259:                'params' => array_merge($baseParams, ['%count%' => self::MAX_COUNT_PER_CARD]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:64:        $params = $request->request->all();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:65:        $ids = $params['ids'] ?? [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:112:        $params = $request->request->all();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:113:        $ids = $params['ids'] ?? [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:167:        $params = $request->request->all();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:168:        $ids = $params['ids'] ?? [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:301:            '支店の商品公開ステータス' => '支店の商品公開ステータス',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductCsvController.php:366:            '支店の商品公開ステータス' => '支店の商品公開ステータス',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Event/EventBannerStorageService.php:59:     * @return array{message: string, params?: array<string, string>}|null
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Event/EventBannerStorageService.php:80:                'params' => ['%max%' => (string) self::MAX_UPLOAD_BYTES],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/CardController.php:41:    #[Route(path: '/card', name: 'card_by_params', methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/CardController.php:42:    #[Route(path: '/card.json', name: 'card_by_params_json', methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:149:     * @return BaseCsvColumn 支店の商品公開ステータスの列定義
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:151:    public static function branchStatusId(string $name = '支店の商品公開ステータス'): BaseCsvColumn
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:155:            '支店の商品公開ステータス',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CategoryCsvController.php:198:            '支店非表示フラグ' => '0: 表示する、1: 表示しない',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CategoryCsvController.php:218:            '支店非表示フラグ' => '支店非表示フラグ',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/PointGranterController.php:49:        $procName = $request->request->get('proc_name', '');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/PointGranterController.php:50:        $params = $request->request->get('params', '');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/PointGranterController.php:53:            if ($contractId === '' || $accessToken === '' || $procName === '' || $params === '') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/PointGranterController.php:66:                (string) $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/PointGranterController.php:82:            $row = $this->extractRow((string) $params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/PointGranterController.php:125:            'Access-Control-Allow-Origin' => '*',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/PointGranterController.php:133:     * @param string $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/PointGranterController.php:137:    private function extractRow(string $params): ?array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/PointGranterController.php:139:        $data = json_decode($params, true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:245:            '支店の商品公開ステータス' => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:246:                'id' => 'branch_status_id',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/TransactionEventDispatcher.php:74:        $transactionHeadIds = $this->extractTransactionHeadIds($event);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/TransactionEventDispatcher.php:89:    private function extractTransactionHeadIds(SmaregiWebhookEvent $event): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/TenantController.php:433:                    'Access-Control-Allow-Origin' => '*',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/TenantController.php:462:                    'Access-Control-Allow-Origin' => '*',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:233:            '支店の商品公開ステータス' => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:234:                'id' => 'branch_status_id',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:892:            $params = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:899:                $params['update_status_picking'] = true;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:901:            $UpdateOrderList[] = $params;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStatusCsvController.php:184:            '支店の商品公開ステータス' => '0:非公開 1:公開',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/ProductStatusCsvController.php:198:            '支店の商品公開ステータス' => '支店の商品公開ステータス',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:128:                    // 支店の場合(OTC/SMOOTH_OTCのみ表示)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionDisposedProcessor.php:33: * disposeServerTransactionHeadId を打消元 (元取引) のキーに使って Order を引き当てる。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionDisposedProcessor.php:70:        $originTransactionHeadId = $transaction->disposeServerTransactionHeadId;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionDisposedProcessor.php:71:        if ($originTransactionHeadId === null || $originTransactionHeadId === '') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionDisposedProcessor.php:72:            $this->logger->warning('Smaregi disposed transaction has no disposeServerTransactionHeadId', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionDisposedProcessor.php:80:        $Order = $this->orderRepository->findOneBy(['smaregiTransactionId' => $originTransactionHeadId]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionDisposedProcessor.php:86:                'disposeServerTransactionHeadId' => $originTransactionHeadId,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionDisposedProcessor.php:96:                'disposeServerTransactionHeadId' => $originTransactionHeadId,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionDisposedProcessor.php:115:            'disposeServerTransactionHeadId' => $originTransactionHeadId,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:56:     * @param ?string $originalTransactionId 取消は取引自体のID、打消は打消元(disposeServerTransactionHeadId)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:745:                $params = array_filter($result, fn ($key) => !str_starts_with((string) $key, '_'), ARRAY_FILTER_USE_KEY);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:747:                return $this->redirectToRoute($result['_route'], $params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockJoinApprovalSubmitAction.php:37:     * @return array{route: string, params: array<string, mixed>, errorMessage?: string|null, successMessage?: string|null}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockJoinApprovalSubmitAction.php:47:                'params' => ['id' => $id],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockJoinApprovalSubmitAction.php:55:                'params' => ['id' => $id],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockJoinApprovalSubmitAction.php:64:                    'params' => ['id' => $id],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockJoinApprovalSubmitAction.php:71:                    'params' => ['id' => $id],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockJoinApprovalSubmitAction.php:79:                    'params' => ['id' => $id],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockJoinApprovalSubmitAction.php:97:                'params' => ['id' => $id],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockJoinApprovalSubmitAction.php:104:            'params' => ['id' => $result['stockSplitJoinId']],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/Seeder/SeedUnisearchPurchaseTagCommand.php:226:                'is_branch_published' => true,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/Seeder/SeedUnisearchPurchaseTagCommand.php:238:                'is_branch_published' => ParameterType::BOOLEAN,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:52:    private ?CsvColumnInterface $transferQuantityColumn = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:63:        private readonly int $transferStockLocationId,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:93:            moveFromStockLocationId: $this->transferStockLocationId,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:94:            moveToStockLocationId: $this->transferStockLocationId,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:115:                StockLocationId: $this->transferStockLocationId,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:133:            'admin_stock_transfer',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:183:        $quantity = trim((string) $this->transferQuantityColumn->getValue($row));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:194:            'stockLocationId' => $this->transferStockLocationId,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:210:            'stockLocationId' => $this->transferStockLocationId,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:217:        $transferQuantity = (string) $quantity;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:220:        $standardTotalPrice = bcmul((string) $standardPrice, $transferQuantity, 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:222:        $fromOutboundTotalCost = $FromProductStock->getMovementTotalCost($transferQuantity);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:230:            moveTransferQuantity: (int) $transferQuantity,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:235:        $afterFromStock = $FromProductStock->getStockQuantityAfterChange(bcmul($transferQuantity, '-1', 0));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:236:        $afterFromTotalCost = $FromProductStock->getTotalCostAfterChange(bcmul($transferQuantity, '-1', 0));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:244:            stockChangeQuantity: $transferQuantity,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:247:            unitCostPriceAfter: $FromProductStock->getUnitCostPriceAfterChange($transferQuantity),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:283:            $this->transferQuantityColumn,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:301:        $this->transferQuantityColumn = ColumnDefinitions::stockTransferQuantity()->setRequired(true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:308:        $this->transferQuantityColumn = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:353:        $label = $this->transferQuantityColumn->getLabel();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:354:        $transferQuantity = trim((string) $this->transferQuantityColumn->getValue($row));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockTransferCsvImportHandler.php:356:        if ((int) $transferQuantity <= 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/Seeder/SeedPurchaseCategoryDisplayCommand.php:51:        'category/seed-purchase-banner-latest.webp' => 'html/template/default/assets/hareruya/img/branch/top-category-banner01.webp',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/Seeder/SeedPurchaseCategoryDisplayCommand.php:52:        'category/seed-purchase-banner-format.webp' => 'html/template/default/assets/hareruya/img/branch/top-category-banner02.webp',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/Seeder/SeedPurchaseCategoryDisplayCommand.php:53:        'category/seed-purchase-icon-supply.webp' => 'html/template/default/assets/hareruya/img/branch/top-category-banner03.webp',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/Seeder/SeedPurchaseCategoryDisplayCommand.php:54:        'category/seed-purchase-icon-sealed.webp' => 'html/template/default/assets/hareruya/img/branch/top-category-banner04.webp',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/Seeder/SeedPurchaseCategoryDisplayCommand.php:55:        'category/seed-purchase-symbol-cardset.webp' => 'html/template/default/assets/hareruya/img/branch/top-category-banner05.webp',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/Seeder/SeedPurchaseCategoryDisplayCommand.php:452:                'is_branch_published' => true,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/Seeder/SeedPurchaseCategoryDisplayCommand.php:464:                'is_branch_published' => ParameterType::BOOLEAN,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/Seeder/SeedPurchaseCategoryDisplayCommand.php:607:                $io->writeln('  fix visibility: '.$Category->getName().' (front_search_hide + branch_hide)');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/Seeder/SeedPurchaseCategoryDisplayCommand.php:611:                $io->writeln('  fix visibility: '.$Category->getName().' (branch_hide)');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/CategoryController.php:59:     * 指定したカテゴリ ID をルートとしたツリー構造を取得する（本店想定・支店非表示フラグは見ない）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/CategoryController.php:68:     * 支店フラグ branch に応じたツリー（true: 支店向け、branch_hide_flg を除外）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/CategoryController.php:70:    #[Route(path: '/api/categories/{id}/tree/{branch}', name: 'api_categories_tree_by_id_branch', requirements: ['id' => '\\d+', 'branch' => 'true|false'], methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/CategoryController.php:71:    public function getCategoryTreeByBranch(int $id, string $branch): JsonResponse
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/CategoryController.php:73:        return $this->respondCategoryTree($id, $branch === 'true');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/CategoryController.php:76:    private function respondCategoryTree(int $id, bool $branchContext): JsonResponse
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/CategoryController.php:83:        $tree = $this->categoryTreeResponseBuilder->buildRoots($Category, $branchContext);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:63:    /** @var CsvColumnInterface 列: 支店の商品公開ステータス */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:184:        // インポート成功の場合、支店システムと連携
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:187:            // $branchUpdate = new BranchUpdateService($this->app);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:188:            // $branchUpdate->noticeProductUpdate(array_unique($this->importedIds));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:350:        $this->isBranchPublishedColumn = ColumnDefinitions::branchStatusId()->setRequired(true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockJoinShortageEntryAction.php:48:                'params' => ['id' => $StockSplitJoin->getId()],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockSplitApprovalSubmitAction.php:37:     * @return array{route: string, params: array<string, mixed>, errorMessage?: string|null, successMessage?: string|null}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockSplitApprovalSubmitAction.php:47:                'params' => ['id' => $id],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockSplitApprovalSubmitAction.php:55:                'params' => ['id' => $id],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockSplitApprovalSubmitAction.php:65:                    'params' => ['id' => $id],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockSplitApprovalSubmitAction.php:72:                    'params' => ['id' => $id],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockSplitApprovalSubmitAction.php:80:                    'params' => ['id' => $id],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockSplitApprovalSubmitAction.php:96:                        'params' => ['id' => $id],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockSplitApprovalSubmitAction.php:103:                    'params' => ['id' => $id],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockSplitApprovalSubmitAction.php:111:                    'params' => ['id' => $result['stockSplitJoinId']],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockSplitApprovalSubmitAction.php:122:                'params' => ['id' => $id],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:87:        // インポート成功の場合、支店システムと連携
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:91:        //     $branchUpdate = new BranchUpdateService(...);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:92:        //     $branchUpdate->noticeProductUpdate(array_unique($this->importedIds));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:95:                        // 支店の場合、ピック開始日を更新
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiPointPushLogService.php:54:            if ($this->repository->existsByTransactionHeadId($transactionHeadId)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiPointPushLogService.php:59:            $log->setTransactionHeadId($transactionHeadId)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiPointPushLogService.php:92:        return $this->repository->existsByTransactionHeadId($transactionHeadId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ArticleController.php:45:    #[Route('/article.json', name: 'article_by_params', methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/PurchaseController.php:41:use Eccube\Service\Front\Purchase\ActionInput\PurchaseOrderSubmitInput;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/PurchaseController.php:43:use Eccube\Service\Front\Purchase\PurchaseOrderSubmitAction;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/PurchaseController.php:120:        private PurchaseOrderSubmitAction $purchaseOrderSubmitAction,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/PurchaseController.php:318:        $submitInput = new PurchaseOrderSubmitInput(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/PurchaseController.php:329:        $buyOrderId = $this->purchaseOrderSubmitAction->handle($submitInput);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/PurchaseController.php:491:                'product_list_crumb_route_params' => ['purchaseFlg' => true],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductStatusUpdateImportHandler.php:125:        $this->isBranchPublishedColumn = (new BaseCsvColumn('支店の商品公開ステータス', '支店の商品公開ステータス'))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:73:    /** @var CsvColumnInterface 列: 支店の商品公開ステータス */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:200:        // インポート成功の場合、支店システムと連携
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:202:            $this->em->getConnection()->commit(); // $this->emのトランザクションをcommitしないと支店側が最新化されない
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:204:        // TODO: 支店システムとの連携処理
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:205:        // $branchUpdate = new BranchUpdateService($this->app);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:206:        // $branchUpdate->noticeProductUpdate(array_unique($this->importedIds));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:357:        $this->isBranchPublishedColumn = ColumnDefinitions::branchStatusId()->setRequired(true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/OtcBuyController.php:594:        // 支店システムへ更新情報を連携
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/OtcBuyController.php:596:        // $branchUpdate = new BranchUpdateService($app);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/OtcBuyController.php:597:        // $branchUpdate->noticeCustomerUpdate([$Customer->getId()]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockJoinUpdateShortageAction.php:51:     *   message_params?: array<string, int|string>,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockJoinUpdateShortageAction.php:111:     *   message_params?: array<string, int|string>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockJoinUpdateShortageAction.php:144:                    'message_params' => ['%max%' => $max],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/CategoryCsvImportHandler.php:51:    private ?BaseCsvColumn $branchHideColumn = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/CategoryCsvImportHandler.php:92:            $this->branchHideColumn,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/CategoryCsvImportHandler.php:151:        $branch = (int) $this->branchHideColumn->getValue($row);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/CategoryCsvImportHandler.php:152:        $Category->setBranchHideFlg($branch === 1);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/CategoryCsvImportHandler.php:220:        $this->branchHideColumn = (new BaseCsvColumn('支店非表示フラグ', '支店非表示フラグ'))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/CategoryCsvImportHandler.php:259:        $this->branchHideColumn = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:1382:            // 支店サイトでは支店公開ステータスが非公開の商品は表示しない.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:1709:            'Access-Control-Allow-Origin' => '*',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:1724:            'Access-Control-Allow-Origin' => '*',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:1739:            'Access-Control-Allow-Origin' => '*',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:1754:            'Access-Control-Allow-Origin' => '*',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:1780:            'Access-Control-Allow-Origin' => '*',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockTransferNewType.php:52:            ->add('transfer_details', CollectionType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockTransferNewType.php:121:        return 'admin_stock_transfer_new';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockSplitUpdateDestinationStockLocationAction.php:95:                throw new \LogicException('admin.stock.transfer.same_source_dest_error');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:255:                $params = array_filter($result, fn ($key) => !str_starts_with((string) $key, '_'), ARRAY_FILTER_USE_KEY);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:257:                log_info('[リダイレクト] リダイレクトを実行します.', [$result['_route'], $params]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:260:                return $this->redirectToRoute($result['_route'], $params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockTransferStoreAction.php:77:            foreach ($input->transferDetails as $detail) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockTransferStoreAction.php:80:                $moveTransferQuantity = (int) $detail['move_transfer_quantity'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerEditController.php:334:        $response->headers->set('Cache-Control', 'private, no-store');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiAccessTokenService.php:95:                'form_params' => $bodyParams,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/StockCostCalculator.php:312:                $transfer = $stock['currentSubtotal'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/StockCostCalculator.php:317:                $transfer = $unitCost * $decreasedQty;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/StockCostCalculator.php:320:            $results[$productClassId] -= $transfer;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/StockCostCalculator.php:321:            $totalTransfer += $transfer;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/ActionInput/StockTransferStoreInput.php:24:     * @param array<int, array{move_from_product_stock_id: int, dest_product_code: string, move_transfer_quantity: int}> $transferDetails
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/ActionInput/StockTransferStoreInput.php:31:        public readonly array $transferDetails,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseHistoryType.php:82:            ->add('transfer_complete_date_from', DateTimeType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseHistoryType.php:83:                'label' => 'admin.purchase.online.history.form.transfer_complete_date_from.label',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseHistoryType.php:89:                    'data-target' => '#'.$this->getBlockPrefix().'_transfer_complete_date_from',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseHistoryType.php:93:            ->add('transfer_complete_date_to', DateTimeType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseHistoryType.php:94:                'label' => 'admin.purchase.online.history.form.transfer_complete_date_to.label',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseHistoryType.php:100:                    'data-target' => '#'.$this->getBlockPrefix().'_transfer_complete_date_to',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/BankAccountType.php:43:            ->add('branchCode', TextType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/ApprovalListRowBuilder.php:73:                    $approvalTargetLabel = 'admin.stock.approval_list.approval_target_stock_transfer';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/ApprovalListRowBuilder.php:74:                    $approvalTargetLink = $this->urlGenerator->generate('admin_stock_transfer', ['id' => $ApprovalList->getHistorySourceId()]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:123:                '支店の商品公開ステータス' => (int) $Product->isBranchPublished(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductGoodsCsv.php:127:                '支店の商品公開ステータス' => (int) $Product->isBranchPublished(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:110:    #[ORM\Column(name: 'can_transfer_request_flg', type: Types::BOOLEAN)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:113:    #[ORM\Column(name: 'transfer_failed_flg', type: Types::BOOLEAN)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:114:    private bool $transferFailedFlg = false;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:511:        return $this->transferFailedFlg;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:514:    public function setTransferFailedFlg(bool $transferFailedFlg): DtbBuyOrder
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:516:        $this->transferFailedFlg = $transferFailedFlg;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbSmaregiPointPushLog.php:50:    public function getTransactionHeadId(): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbSmaregiPointPushLog.php:55:    public function setTransactionHeadId(string $transactionHeadId): self
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Util/Transaction/TransactionResponseParser.php:55:            disposeServerTransactionHeadId: $this->stringOrNull($payload['disposeServerTransactionHeadId'] ?? null),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionCreateAction.php:66:                'UPDATE dtb_stock_move_transfer SET move_instruction_id = :instructionId WHERE id IN (:ids) AND move_instruction_id IS NULL',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionCreateAction.php:72:                throw new StockMoveInstructionCreateException('admin.stock.move_transfer.create_instruction.already_assigned');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionCreateAction.php:82:            foreach ($StockMoveTransfers as $transfer) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionCreateAction.php:83:                $agg = $aggregates[$transfer->getId()] ?? [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionCreateAction.php:120:        foreach ($StockMoveTransfers as $transfer) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionCreateAction.php:122:            if ($transfer->getMoveTransferType() !== DtbStockMoveTransfer::MOVE_TRANSFER_TYPE_MOVE) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionCreateAction.php:123:                throw new StockMoveInstructionCreateException('admin.stock.move_transfer.create_instruction.not_move_type');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionCreateAction.php:127:            if ($transfer->getMoveTransferStatus()->getId() !== \Eccube\Entity\Master\MtbStockMoveTransferStatus::STATUS_OUTBOUND_APPROVED) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionCreateAction.php:128:                throw new StockMoveInstructionCreateException('admin.stock.move_transfer.create_instruction.status_invalid');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionCreateAction.php:132:            if ($transfer->getMoveInstructionId() !== null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionCreateAction.php:133:                throw new StockMoveInstructionCreateException('admin.stock.move_transfer.create_instruction.already_assigned');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionCreateAction.php:139:        foreach ($StockMoveTransfers as $transfer) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionCreateAction.php:140:            if ($transfer->getMoveFromBaseInfo()?->getId() !== $fromBaseInfoId) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionCreateAction.php:141:                throw new StockMoveInstructionCreateException('admin.stock.move_transfer.create_instruction.from_store_mismatch');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionCreateAction.php:147:        foreach ($StockMoveTransfers as $transfer) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionCreateAction.php:148:            if ($transfer->getMoveToBaseInfo()?->getId() !== $toBaseInfoId) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionCreateAction.php:149:                throw new StockMoveInstructionCreateException('admin.stock.move_transfer.create_instruction.to_store_mismatch');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Shop/ShopTopController.php:41:    private const KEEP_QR_LOGO_RELATIVE = 'html/template/default/assets/hareruya/img/branch/icon-cart.png';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Shop/ShopTopController.php:62:        condition: "service('shop_route_condition_service').isShopByPath(params['_shop'])",
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockJoinUpdateSourceStockLocationAction.php:102:                throw new \LogicException('admin.stock.transfer.same_source_dest_error');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/ImportDeckAction.php:82:        $formatIdRaw = $input->params['format_id'] ?? null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/ImportDeckAction.php:92:        $params = $input->params;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/ImportDeckAction.php:93:        $cardListRaw = $params['card_list'] ?? '';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/ImportDeckAction.php:98:        $params['cards'] = $cardList['cards'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/ImportDeckAction.php:102:            $buildResult = $this->deckService->buildSaveData($params, $Deck, $Player);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/SmaregiTransactionJob.php:83:    public function getTransactionHeadId(): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/SmaregiTransactionJob.php:88:    public function setTransactionHeadId(string $transactionHeadId): SmaregiTransactionJob
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderHistoryCsvExportService.php:44:        'transferCompleteDate' => '振込完了日',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockHistory.php:37:        MtbStockHistorySourceType::STOCK_TRANSFER_EDIT => 'admin_stock_transfer',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockApprovalListCsvExportService.php:125:                    $approvalTargetKey = 'admin.stock.approval_list.approval_target_stock_transfer';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/SmaregiWebhookEvent.php:22:#[ORM\Table(name: 'dtb_smaregi_webhook_request')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:110:        [$whereSql, $params, $paramTypes] = $this->buildWhere($input);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:195:        return $this->connection->executeQuery($sql, $params, $paramTypes)->iterateAssociative();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:204:        $params = [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:210:            $params['productName'] = $this->escapeLike($productNameTrimmed);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:217:            $params['cardName'] = $this->escapeLike($cardNameTrimmed);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:222:            $params['productId'] = $input->productId;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:228:            $params['productCode'] = $this->escapeLike($productCodeTrimmed);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:233:            $params['baseInfoIds'] = array_map(fn (\Eccube\Entity\BaseInfo $bi) => $bi->getId(), $input->baseInfos);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:239:            $params['updateDateFrom'] = $input->updateDateFrom->format('Y-m-d H:i:s');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:247:            $params['updateDateToExclusive'] = $toExclusive->format('Y-m-d H:i:s');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:253:            $params['cardConditionIds'] = $ids;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:260:            $params['categoryIds'] = $ids;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:267:            $params['statusIds'] = $ids;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:286:            $params['cardsetIds'] = $ids;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:292:            $params['foilValues'] = $input->foilValues;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:299:            $params['rarityIds'] = $ids;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:305:            $params['frameValues'] = $input->frameValues;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:321:            $params['tagIds'] = $tagIds;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:328:            $params['storageCodeIds'] = $ids;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:335:            $params['tagSalesAnalysisIds'] = $ids;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:342:            $params['sectionIds'] = $ids;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:349:            $params['shelfNumberIds'] = $ids;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:355:            $params['basePriceFrom'] = $input->basePriceFrom;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:359:            $params['basePriceTo'] = $input->basePriceTo;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:364:            $params['sellPriceFrom'] = $input->sellPriceFrom;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:368:            $params['sellPriceTo'] = $input->sellPriceTo;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:378:                $params['orderQuantityFrom'] = $input->orderQuantityFrom;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:382:                $params['orderQuantityTo'] = $input->orderQuantityTo;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:388:            $params['stockFrom'] = $input->stockFrom;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:392:            $params['stockTo'] = $input->stockTo;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:409:                $params['constantLangIds'] = MtbLanguage::CONSTANT_LANG_IDS;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:419:        return [$whereSql, $params, $paramTypes];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderDepositCsvExportService.php:35:        'bank_branch_code' => '支店名',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderDepositCsvExportService.php:103:     * @param array<int, array{buyOrderId: mixed, bank_code: mixed, bank_branch_code: mixed, bank_account_type: mixed, bank_account_no: mixed, bank_account_holder: mixed, online_identificaion_status: mixed}> $bankData 買取IDでキー化した銀行データ（Repositoryの生の戻り値をキー化したもの）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderDepositCsvExportService.php:121:                'bank_branch_code' => $bank['bank_branch_code'] ?? '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/SmaregiMockResponder.php:149:        parse_str($request->getUri()->getQuery(), $params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/SmaregiMockResponder.php:151:        return $params;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:37:        'stock_move_transfer_id' => '在庫移動振替ID',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:39:        'move_transfer_type' => '移動タイプ',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:46:        'move_transfer_status' => 'ステータス',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:105:        $filename = 'stock_move_transfer_list_'.(new \DateTime())->format('YmdHis').'.csv';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:155:            'stock_move_transfer_id' => (string) $stockMoveTransfer->getId(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:157:            'move_transfer_type' => $this->formatMoveTransferType($stockMoveTransfer->getMoveTransferType()),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:170:            'move_transfer_status' => $stockMoveTransfer->getMoveTransferStatus()->getStatusName(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:185:            return $this->translator->trans('admin.stock.move.type_transfer', [], 'messages');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbAuthorityShop.php:27:    #[ORM\Column(name: 'id', type: Types::INTEGER, options: ['unsigned' => true, 'comment' => '権限支店紐付ID'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Purchase/PurchaseOrderSubmitAction.php:32:use Eccube\Service\Front\Purchase\ActionInput\PurchaseOrderSubmitInput;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Purchase/PurchaseOrderSubmitAction.php:39:final class PurchaseOrderSubmitAction
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Purchase/PurchaseOrderSubmitAction.php:51:    public function handle(PurchaseOrderSubmitInput $input): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Product.php:1274:        #[ORM\Column(name: 'is_branch_published', type: Types::BOOLEAN, options: ['default' => true, 'comment' => '支店の商品公開ステータス'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Purchase/ActionInput/PurchaseOrderSubmitInput.php:27:final readonly class PurchaseOrderSubmitInput
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/ActionInput/UpdateDeckInput.php:21:     * @param array<string, mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/ActionInput/UpdateDeckInput.php:26:        public readonly array $params,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2211:     * @param array<string, mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2213:    public function getBody(string $view, array $params): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2225:        $content = $template->render($params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:46:        public const COMMON_NAME = '支店共通';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:1088:        #[ORM\Column(name: 'html_class_name', type: Types::STRING, length: 32, options: ['default' => '', 'comment' => '支店URL'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:1343:        #[ORM\Column(name: 'common_setting_flg', type: Types::BOOLEAN, options: ['default' => true, 'comment' => '支店共通設定適用フラグ'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:1533:        #[ORM\Column(name: 'is_main_shop', type: Types::BOOLEAN, nullable: false, options: ['default' => false, 'comment' => '店舗種別（true: 本店 / false: 支店）'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/DependencyInjection/Configuration.php:89:                                    ->arrayNode('params')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/Purchase/ConfirmType.php:61:            ->add('branchCode', TextType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/Purchase/ConfirmType.php:67:                    'placeholder' => '例：〇〇支店',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbCardset.php:229:    #[ORM\Column(name: 'branch_display_flg', type: Types::BOOLEAN, options: ['default' => true, 'comment' => '支店表示フラグ'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbCardset.php:230:    private bool $branch_display_flg = true;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbCardset.php:234:        return $this->branch_display_flg;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbCardset.php:237:    public function setBranchDisplayFlg(bool $branch_display_flg): MtbCardset
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbCardset.php:239:        $this->branch_display_flg = $branch_display_flg;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOption.php:39:     * 支店から移植した定数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetDetailAction.php:73:            transferCompletedAt: $this->parseHistoryDate($statusHistories[MtbBuyOrderStatus::BUY_ORDER_STATUS[MtbBuyOrderStatus::TRANSFER_COMPLETE]] ?? null),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetDetailAction.php:145:            $params = ['id' => $BuyMainCard->getProduct()->getId()];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetDetailAction.php:147:                $params['lang'] = $Language->getCode();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetDetailAction.php:149:            $productDetailUrl = $this->urlGenerator->generate('product_detail', $params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockMoveTransferStatusHistory.php:23:#[ORM\Table(name: 'dtb_stock_move_transfer_status_history')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockMoveTransferStatusHistory.php:38:    #[ORM\JoinColumn(name: 'stock_move_transfer_id', referencedColumnName: 'id', nullable: false, options: ['comment' => '在庫移動振替ID'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockMoveTransferStatusHistory.php:54:    #[ORM\JoinColumn(name: 'stock_move_transfer_status_id', referencedColumnName: 'id', nullable: false, options: ['comment' => '在庫移動振替ステータスID'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockMoveInboundApprovalRequestType.php:70:            ->add('stock_move_transfer_details', CollectionType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbBuyOrderStatus.php:67:        self::TRANSFER_REQUESTED => 'transfer_request',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbBuyOrderStatus.php:68:        self::TRANSFER_COMPLETE => 'transfer_complete',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbBuyOrderStatus.php:69:        self::TRANSFER_FAILED => 'transfer_fail',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductType.php:237:                'label' => 'admin.product.is_branch_published',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/DependencyInjection/EccubeExtension.php:82:            ['path' => '^/%eccube_smaregi_webhook_route%/', 'roles' => 'IS_AUTHENTICATED_ANONYMOUSLY', 'method' => ['POST']],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/DependencyInjection/EccubeExtension.php:187:        $params = $config['dbal']['connections'][$config['dbal']['default_connection']];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/DependencyInjection/EccubeExtension.php:190:        $params['url'] = env('DATABASE_URL');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/DependencyInjection/EccubeExtension.php:191:        $conn = DriverManager::getConnection($params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/DependencyInjection/EccubeExtension.php:195:            error_log('[routing-debug] EccubeExtension::configurePlugins: DB not connected, params='.json_encode($params));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/ActionInput/ImportDeckInput.php:21:     * @param array<string, mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/ActionInput/ImportDeckInput.php:26:        public readonly array $params,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:95:        $prefix = 'stock_move_transfer_return_list_'.sprintf('%07d', min($stockMoveTransferIds)).'_';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:135:            $moveTransferIds[] = $stockMoveTransfer['transferId'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:145:                    $stockMoveTransfer['transferId'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:150:                    $stockMoveTransfer['transferId'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:157:                    $stockMoveTransfer['transferId'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/ActionInput/PostDeckInput.php:21:     * @param array<string, mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/ActionInput/PostDeckInput.php:25:        public readonly array $params,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:67:        $prefix = 'stock_move_transfer_barcode_'.sprintf('%07d', min($stockMoveTransferIds)).'_';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:96:                $this->translator->trans('admin.stock.move_transfer.barcode_csv_export.not_found', [], 'messages'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:117:                    'admin.stock.move_transfer.barcode_csv_export.not_move_type',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:125:                    'admin.stock.move_transfer.barcode_csv_export.not_smaregi_destination',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:133:                    'admin.stock.move_transfer.barcode_csv_export.move_to_shop_not_set',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:139:                    'admin.stock.move_transfer.barcode_csv_export.shop_not_permitted',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:153:                    'admin.stock.move_transfer.barcode_csv_export.id_not_found',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:162:                'admin.stock.move_transfer.barcode_csv_export.multiple_shops',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseDetailType.php:102:                'label' => 'admin.purchase.online.detail.can_transfer_request_flg',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseDetailType.php:106:            ->add('transferFailedFlg', CheckboxType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseDetailType.php:107:                'label' => 'admin.purchase.online.detail.transfer_failed_flg',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryOtcDetailAction.php:92:            $params = ['id' => $ProductClass->getProduct()->getId()];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryOtcDetailAction.php:94:                $params['lang'] = $Language->getCode();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryOtcDetailAction.php:96:            $productDetailUrl = $this->urlGenerator->generate('product_detail', $params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockMoveTransfer.php:23:#[ORM\Table(name: 'dtb_stock_move_transfer')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockMoveTransfer.php:43:    #[ORM\Column(name: 'move_transfer_type', type: Types::INTEGER, options: ['comment' => '移動振替区分 1: 移動 2: 振替'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockMoveTransfer.php:75:    #[ORM\JoinColumn(name: 'move_transfer_status_id', referencedColumnName: 'id', nullable: false)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockTransferApprovalType.php:64:        return 'admin_stock_transfer_approval';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/UpdateDeckAction.php:83:        $instantSaveFlag = isset($input->params['instant_save_flag']) && filter_var($input->params['instant_save_flag'], FILTER_VALIDATE_BOOLEAN);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/UpdateDeckAction.php:94:                $buildResult = $this->deckService->buildSaveData($input->params, $Deck, $Player);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/UpdateDeckAction.php:161:                $this->deckService->buildSaveData($input->params, $Deck, $Player);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/UpdateDeckAction.php:168:            $json = json_encode($input->params, JSON_THROW_ON_ERROR);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:26:    public const MAPPED_STATUS_TRANSFER_PENDING = 'transfer_pending';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:111:                'iconPath' => 'assets/img/mypage/transfer_pending.svg',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBankAccount.php:39:    #[ORM\Column(name: 'branch_code', type: Types::TEXT, options: ['comment' => '支店番号'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBankAccount.php:40:    private string $branchCode;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBankAccount.php:87:        return $this->branchCode;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBankAccount.php:90:    public function setBranchCode(string $branchCode): DtbBankAccount
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBankAccount.php:92:        $this->branchCode = $branchCode;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:100:                        'max' => $this->eccubeConfig['eccube_branch_url_max_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:114:                    'admin.setting.shop.shop.is_main_shop__branch' => BaseInfo::SHOP_BRANCH,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockMoveTransferDetail.php:22:#[ORM\Table(name: 'dtb_stock_move_transfer_detail')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockMoveTransferDetail.php:37:    #[ORM\JoinColumn(name: 'stock_move_transfer_id', referencedColumnName: 'id', nullable: false)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockMoveTransferDetail.php:84:    #[ORM\Column(name: 'move_transfer_quantity', type: Types::INTEGER, options: ['comment' => '移動振替点数'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbStockMoveTransferStatus.php:23:#[ORM\Table(name: 'mtb_stock_move_transfer_status')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbMonthlySummaryRepository.php:109:        $params = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbMonthlySummaryRepository.php:117:            $params['targetIds'] = $targetBaseInfoIds;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbMonthlySummaryRepository.php:123:        return $this->getEntityManager()->getConnection()->executeQuery($sql, $params, $types)->fetchAllAssociative();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Category.php:459:        #[ORM\Column(name: 'branch_hide_flg', type: Types::BOOLEAN, options: ['default' => false, 'comment' => '支店非表示フラグ'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Category.php:460:        private bool $branch_hide_flg = false;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Category.php:491:            return $this->branch_hide_flg;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Category.php:494:        public function setBranchHideFlg(bool $branchHideFlg): Category
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Category.php:496:            $this->branch_hide_flg = $branchHideFlg;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBranchUpdateError.php:22:#[ORM\Table(name: 'dtb_branch_update_error')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockTransferCsvImportType.php:50:            ->add('transfer_base_info', EntityType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockTransferCsvImportType.php:65:            ->add('transfer_stock_location_id', ChoiceType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockTransferCsvImportType.php:164:        return 'stock_transfer_csv_import';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:585:     * @param array<string, mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:593:        array $params,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:598:        $qb = $this->buildSearchQuery($params)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:609:     * @param array<string, mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:611:    public function countBy(array $params): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:613:        $qb = $this->buildSearchQuery($params)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:623:     * @param array<string, mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:625:    private function buildSearchQuery(array $params): QueryBuilder
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:632:        if (isset($params['tagId']) && !empty($params['tagId'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:634:                ->setParameter(':tagIds', $params['tagId']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:644:        if (isset($params['card']) && !empty($params['card'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:650:                ->setParameter(':card', str_replace('+', '/', $params['card']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:652:        if (isset($params['player']) && !empty($params['player'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:654:                ->setParameter(':player', '%'.addcslashes((string) $params['player'], '%_').'%');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:656:        if (isset($params['eventName']) && !empty($params['eventName'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:661:            ->setParameter(':eventName', '%'.addcslashes((string) $params['eventName'], '%_').'%');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:663:        if (isset($params['archetypeId']) && !empty($params['archetypeId'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:665:                ->setParameter(':archetypeId', $params['archetypeId']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:667:        if (isset($params['dateFrom']) && !empty($params['dateFrom'])
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:668:            && $from = \DateTime::createFromFormat(self::DATE_PICKER_FORMAT, $params['dateFrom'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:673:        if (isset($params['dateTo']) && !empty($params['dateTo'])
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:674:            && $to = \DateTime::createFromFormat(self::DATE_PICKER_FORMAT, $params['dateTo'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:685:        if (isset($params['formats'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:686:            $formats = array_filter((array) $params['formats'], static fn ($v) => $v !== '' && $v !== null);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:692:        if (isset($params['capacityFrom']) && !empty($params['capacityFrom'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:694:                ->setParameter(':capacityFrom', $params['capacityFrom']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:696:        if (isset($params['capacityTo']) && !empty($params['capacityTo'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:698:                ->setParameter(':capacityTo', $params['capacityTo']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:700:        if (isset($params['archetypeIds']) && !empty($params['archetypeIds'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:702:                ->setParameter(':typeIds', explode(',', (string) $params['archetypeIds']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:704:        if (isset($params['grades']) && !empty($params['grades']) && $params['grades'] === 'top8') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:707:        } elseif (isset($params['grades']) && !empty($params['grades']) && $params['grades'] === 'champion') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:710:        if (isset($params['public_status']) && !empty($params['public_status']) && $params['public_status'] === 'public') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:1069:        $params = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:1088:            $params['basicId'] = MtbSpecialtype::BASIC_ID;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:1112:        return $conn->executeQuery($sql, $params)->fetchAllAssociative();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:1256:        $params = array_merge($formatParams, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:1330:            ->executeQuery($sql, $params)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCustomerGroup.php:100:    #[ORM\Column(name: 'branch_shop_front_flg', type: Types::BOOLEAN, options: ['default' => false, 'comment' => '支店店頭販売フラグ'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCustomerGroup.php:101:    private bool $branch_shop_front_flg = false;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCustomerGroup.php:105:        return $this->branch_shop_front_flg;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCustomerGroup.php:108:    public function setBranchShopFrontFlg(bool $branch_shop_front_flg): DtbCustomerGroup
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCustomerGroup.php:110:        $this->branch_shop_front_flg = $branch_shop_front_flg;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockApprovalList.php:43:        MtbStockHistorySourceType::STOCK_MOVE_EDIT => 'admin.stock.approval_list.approval_target_stock_move_transfer',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockApprovalList.php:44:        MtbStockHistorySourceType::STOCK_TRANSFER_EDIT => 'admin.stock.approval_list.approval_target_stock_move_transfer',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockApprovalList.php:136:    #[ORM\JoinColumn(name: 'stock_transfer_type_detail_id', referencedColumnName: 'id', nullable: false)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:617:                -- 棚番ソート: 本店のみ棚番順、支店は棚番によるソートを行わない（全て0で同順）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:659:                -- 2. 棚番: 本店のみ昇順（支店は棚番ソートなし）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:723:    //     $params = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:731:    //         $params["otcBuyOrderId{$i}"] = $id;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:742:    //     $app['orm.em']->getConnection()->executeUpdate($query, $params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CategoryType.php:68:            ->add('branch_hide_flg', CheckboxType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CategoryType.php:69:                'label' => 'admin.product.category_branch_hide',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:98:    #[ORM\Column(name: 'point_transfer_flg', type: Types::BOOLEAN, options: ['default' => 0, 'comment' => 'ポイント移行完了フラグ'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:451:     * @return list<array{buyOrderId: mixed, bank_code: mixed, bank_branch_code: mixed, bank_account_type: mixed, bank_account_no: mixed, bank_account_holder: mixed, online_identificaion_status: mixed}>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:467:                'ba.branchCode AS bank_branch_code',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:849:                -- 2. 棚番: 本店のみ昇順（支店は棚番ソートなし）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/PostDeckAction.php:59:            $buildResult = $this->deckService->buildSaveData($input->params, $Deck, $Player);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockMoveOutboundApprovalRequestType.php:73:            ->add('stock_move_transfer_details', CollectionType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockTransferNewDetailType.php:52:                    'placeholder' => trans('admin.stock.transfer.product_code_placeholder'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockTransferNewDetailType.php:55:                    new Assert\NotBlank(['message' => trans('admin.stock.transfer.dest_product_code_required')]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockTransferNewDetailType.php:58:            ->add('move_transfer_quantity', IntegerType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockMoveInstructionType.php:65:            ->add('stock_move_transfer_id', TextType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockMoveInstructionType.php:66:                'label' => 'admin.stock.move_instruction.stock_move_transfer_id',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerGroupType.php:50:            ->add('branch_shop_front_flg', CheckboxType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerGroupType.php:51:                'label' => '支店店内注文専用アカウント',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/ProductDetail/ProductDetailResponseBuilder.php:29:    public function __construct(ParameterBagInterface $params)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/ProductDetail/ProductDetailResponseBuilder.php:31:        $this->conditionDisplayMinPrice = (int) $params->get('condition_display_min_price');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/ProductDetail/ProductDetailResponseBuilder.php:32:        $this->cdnBaseUrl = $params->get('cdn_base_url');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/ProductDetail/ProductDetailResponseBuilder.php:33:        $this->s3Endpoint = $params->get('s3_endpoint');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/ProductDetail/ProductDetailResponseBuilder.php:34:        $this->awsS3Bucket = $params->get('aws_s3_bucket');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckCardRepository.php:145:        $params = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckCardRepository.php:155:            ->setParameters($params)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockMoveTransferType.php:58:            ->add('stock_move_transfer_id', TextType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockMoveTransferType.php:59:                'label' => 'admin.stock.move_transfer.stock_move_transfer_id',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockMoveTransferType.php:64:                'label' => 'admin.stock.move_transfer.move_instruction_list_id',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockMoveTransferType.php:69:                'label' => 'admin.stock.move_transfer.tracking_no',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockMoveTransferType.php:74:                'label' => 'admin.stock.move_transfer.move_from_base_info',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockMoveTransferType.php:86:                'label' => 'admin.stock.move_transfer.move_to_base_info',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockMoveTransferType.php:123:            ->add('move_transfer_type', ChoiceType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockMoveTransferType.php:124:                'label' => 'admin.stock.move_transfer.move_type',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockMoveTransferType.php:130:                    'admin.stock.move.type_transfer' => DtbStockMoveTransfer::MOVE_TRANSFER_TYPE_TRANSFER,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockMoveTransferType.php:136:            ->add('move_transfer_status', ChoiceType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockMoveTransferType.php:137:                'label' => 'admin.stock.move_transfer.move_transfer_status',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockMoveTransferType.php:363:        return 'admin_search_stock_move_transfer';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferDetailRepository.php:45:            ->select('smt.id AS stock_move_transfer_id')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferDetailRepository.php:46:            ->addSelect('COALESCE(SUM(d.moveTransferQuantity), 0) AS move_transfer_quantity')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferDetailRepository.php:58:            $stockMoveTransferId = (int) $row['stock_move_transfer_id'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferDetailRepository.php:61:                'quantity' => (int) $row['move_transfer_quantity'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/ProductSearch/ProductSearchResponseBuilder.php:29:    public function __construct(ParameterBagInterface $params)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/ProductSearch/ProductSearchResponseBuilder.php:31:        $this->conditionDisplayMinPrice = (int) $params->get('condition_display_min_price');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/ProductSearch/ProductSearchResponseBuilder.php:32:        $this->cdnBaseUrl = $params->get('cdn_base_url');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/ProductSearch/ProductSearchResponseBuilder.php:33:        $this->s3Endpoint = $params->get('s3_endpoint');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/ProductSearch/ProductSearchResponseBuilder.php:34:        $this->awsS3Bucket = $params->get('aws_s3_bucket');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPriceHistoryRepository.php:556:     * 支店連携用のデータを返却
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderStockRepository.php:79:            // 支店伝票インポート用CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Content/BranchTopPageManagementType.php:49:            ->add('branch_list', EntityType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Content/BranchTopPageManagementType.php:63:                'label' => 'admin.content.branch_toppage.apply_common_setting',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Content/BranchTopPageManagementType.php:93:                'label' => 'admin.content.branch_toppage.banner_image_tag',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Content/BranchTopPageManagementType.php:128:        return 'branch_toppage_management';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Article/ArticleResponseBuilder.php:211:                'branch_display_flg' => $Cardset->isBranchDisplayFlg(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MemberRepository.php:175:        $params = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MemberRepository.php:183:            $params['BaseInfoId'] = $BaseInfo->getId();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MemberRepository.php:198:            ->setParameters($params)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/TopCategoryListBuilder.php:145:        $params = ['category_id' => $Category->getId()];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/TopCategoryListBuilder.php:150:            $params = array_merge($params, $extraParams);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/TopCategoryListBuilder.php:153:        if (!isset($params['orderby'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/TopCategoryListBuilder.php:156:                $params['orderby'] = $categoryListOrderById;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/TopCategoryListBuilder.php:163:                $params['_shop'] = $shop;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/TopCategoryListBuilder.php:167:        $routeParams = array_merge($linkContext->getDefaultQueryParams(), $params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Content/BranchTopPageTileType.php:51:                'label' => 'admin.content.branch_toppage.section',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Content/BranchTopPageTileType.php:58:                'label' => 'admin.content.branch_toppage.tile_type',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Content/BranchTopPageTileType.php:66:                'label' => 'admin.content.branch_toppage.tag',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Content/BranchTopPageTileType.php:93:        return 'branch_top_page_tile';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:987:        $params = [$lockName, $lockName, self::ADVISORY_LOCK_KEY2_SUFFIX];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:989:            $result = $conn->fetchOne($sql, $params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:414:front.agreement.s4.body1: "Regarding the copyright of content displayed on Hareruya through User submissions, at the time a post reaches our servers, the User grants us a non-exclusive, royalty-free license (including the right to sub-license) to use such post domestically and internationally (including reproduction, public transmission, disclosure, distribution, transfer, lending, translation, adaptation, and editing). Users also agree not to exercise moral rights over their posts. Users may not copy or use the posts of other Users beyond the scope permitted by these Terms, and may not copy or use any content for purposes other than use on Hareruya. Furthermore, Users may not reproduce, distribute, transmit, or upload such content to other websites for the purpose of providing it to third parties."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:449:front.agreement.s8.body4: "For in-store purchase assessment requests made at Hareruya, items for which a customer fails to collect within one month after our notification without a valid reason shall be deemed abandoned by the customer, and ownership shall be transferred to us at no cost."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1156:front.shopping.payment_modal.bank.intro: Bank transfer payment is available.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1159:front.shopping.payment_modal.postal.info: "Postal transfer payment is available.<br>・Account number: 10100-30613341<br>・Account name: Ka) Hareruya"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1191:front.shopping.reserve_return_modal.reserve.payment.li3: If you select bank transfer or postal transfer and your payment will be delayed, please contact us in advance.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1500:front.purchase.fill.branch_name: Branch name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2021:# Stock transfer
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2024:# Stock transfer registration
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2025:admin.stock.transfer.subtitle: Inventory management
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2052:admin.stock.list.stock_transfer: Register Stock Transfer
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2082:admin.stock.transfer.approval.subtitle: Stock transfer awaiting approval
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2083:admin.stock.transfer.complete.subtitle: Stock transfer completed
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2084:admin.stock.transfer.approval_status_error: This stock transfer is not awaiting approval, or it has already been processed.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2085:admin.stock.transfer.approval_self_error: The registrant cannot approve or reject this request.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2086:admin.stock.transfer.back_to_list: Back to stock transfer search
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2089:admin.stock.transfer.basic_info_card_title: Receipt and issue basic information
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2090:admin.stock.transfer.store: Store
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2091:admin.stock.transfer.stock_division: Stock division
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2092:admin.stock.transfer.approval_department: Approval notification department
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2093:admin.stock.transfer.details_card_title: Stock move / transfer details
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2094:admin.stock.transfer.source: Transfer from
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2095:admin.stock.transfer.dest: Transfer to
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2096:admin.stock.transfer.product_name_code: Product name / product code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2097:admin.stock.transfer.product_code_search: Search by product code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2098:admin.stock.transfer.product_code: Product code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2099:admin.stock.transfer.product_code_placeholder: Product code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2100:admin.stock.transfer.quantity: Transfer quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2101:admin.stock.transfer.operation: Action
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2102:admin.stock.transfer.search: Search
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2103:admin.stock.transfer.delete: Delete
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2104:admin.stock.transfer.no_items: No stock is selected. Select stock from the inventory list to register.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2105:admin.stock.transfer.same_source_dest_error: The transfer source and destination cannot be the same stock.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2106:admin.stock.transfer.dest_select_above: Select the destination above
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2107:admin.stock.transfer.dest_product_code_required: Please enter the destination product code.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2108:admin.stock.transfer.quantity_required_when_dest_filled: When a destination is entered, enter a transfer quantity of 1 or more.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2109:admin.stock.transfer.at_least_one_detail_required: Enter at least one line with a destination product code and transfer quantity.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2110:admin.stock.transfer.dest_product_code_not_found: No matching product was found.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2111:admin.stock.transfer.dest_product_code_no_stock: No matching destination stock is available (cannot specify as destination under the same stock division).
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2112:admin.stock.transfer.dest_product_code_ambiguous: Destination stock could not be uniquely identified. Please specify by product code.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2113:admin.stock.transfer.product_search_modal_title: Product search
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2114:admin.stock.transfer.product_search_failed: Product search failed.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2115:admin.stock.transfer.memo_placeholder: Enter a memo (optional)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2116:admin.stock.transfer.inventory_list: Inventory list
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2117:admin.stock.transfer.confirm_modal_title: Confirm
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2118:admin.stock.transfer.confirm_modal_reject_message: This action cannot be undone. Reject this stock transfer?
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2119:admin.stock.transfer.confirm_modal_reject_button: Reject
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2120:admin.stock.transfer.confirm_modal_approve_message: This action cannot be undone. Approve this stock transfer?
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2121:admin.stock.transfer.confirm_modal_approve_button: Approve
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2122:admin.stock.transfer.delete_row_confirm_message: This product will be removed from the transfer (excluded). Continue?
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2123:admin.stock.transfer.delete_row_confirm_button: Remove
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2180:admin.stock.move_transfer.title: Stock move / transfer list
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2181:admin.stock.move_transfer.department: Department / affiliation
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2182:admin.stock.move_transfer.move_from_base_info: Source store
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2183:admin.stock.move_transfer.move_to_base_info: Destination store
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
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3827:front.nav.branch.logo_aria_label: '%shop% order top page'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3828:front.nav.branch.mascot_alt: 'Branch mascot'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3900:front.footer.branch.sitemap.privacy: 'Privacy policy'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3901:front.footer.branch.sitemap.tradelaw: 'Specified Commercial Transactions Act'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3902:front.footer.branch.postal_prefix: '〒'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3903:front.footer.branch.google_map_label: 'GOOGLE MAP'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3904:front.footer.branch.google_map_aria_label: 'Open in Google Maps'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3905:front.footer.branch.tel_prefix: 'TEL: '
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3906:front.footer.branch.business_hour_prefix: 'Hours: '
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderSummaryRepository.php:111:        $params = [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderSummaryRepository.php:114:            $params[] = $data['base_info_id'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderSummaryRepository.php:115:            $params[] = $data['section_id'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderSummaryRepository.php:116:            $params[] = $data['total_sell_price'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderSummaryRepository.php:117:            $params[] = $data['total_buy_price'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderSummaryRepository.php:118:            $params[] = $summaryDateStr;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderSummaryRepository.php:125:        $conn->executeStatement($sql, $params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/storage_code.twig:172:                                    'params': {'id': id}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MemberBaseInfoRepository.php:43:        $params = ['memberId' => $Member->getId()];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MemberBaseInfoRepository.php:49:            $params[$paramName] = $baseInfoId;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MemberBaseInfoRepository.php:56:                $params,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategoryTreeCardsetSyntheticChildrenGenerator.php:48:    public function beginPreloadForSubtree(array $categoryIds, bool $branchContext): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategoryTreeCardsetSyntheticChildrenGenerator.php:68:        if ($branchContext) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategoryTreeCardsetSyntheticChildrenGenerator.php:69:            $qb->andWhere('cs.branch_display_flg = true');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategoryTreeCardsetSyntheticChildrenGenerator.php:113:        bool $branchContext,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategoryTreeCardsetSyntheticChildrenGenerator.php:125:                return $this->generateForMany([$parentCategory], $branchContext, $linkContext)[$parentId] ?? [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategoryTreeCardsetSyntheticChildrenGenerator.php:140:        return $this->generateForMany([$parentCategory], $branchContext, $linkContext)[$parentId] ?? [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategoryTreeCardsetSyntheticChildrenGenerator.php:152:        bool $branchContext,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategoryTreeCardsetSyntheticChildrenGenerator.php:181:        if ($branchContext) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategoryTreeCardsetSyntheticChildrenGenerator.php:182:            $qb->andWhere('cs.branch_display_flg = true');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/category.twig:279:                                        {{ form_widget(form.branch_hide_flg, { attr: { class: 'form-check-input' } }) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/category.twig:280:                                        {{ form_label(form.branch_hide_flg, null, { label_attr: { class: 'form-check-label' } }) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/category.twig:283:                                    {{ form_errors(form.branch_hide_flg) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/tag.twig:203:                                    'params': {'id': id}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:189:front.purchase.fill.branch_name: 支店名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:856:front.mypage.purchase_history.detail.col.transfer_date: 振込日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1239:# 支店トップページ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1401:front.shopping.payment_modal.bank.info: "銀行名: 三菱UFJ銀行<br>・支店名: 高田馬場支店(053)<br>・口座種別: 普通<br>・口座番号: 0472843<br>・口座名義: 株式会社晴れる屋(カブシキガイシャ ハレルヤ)"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2033:admin.product.stock__branch: 在庫(支店)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2107:admin.product.category_branch_hide: 支店非表示フラグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2209:admin.product.list_display_data__branch: 販売数（支店）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2228:admin.product.is_branch_published: 支店の商品公開ステータス
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2231:admin.product.stock_branch: 支店
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2961:admin.setting.shop.shop.shop_branch_url: 支店URL
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2966:admin.setting.shop.shop.is_main_shop__branch: 支店
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4103:# コンテンツ管理：支店トップページ管理
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4106:admin.content.branch_toppage_management: 支店トップページ管理
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4107:admin.content.branch_toppage.select_branch: 支店選択
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4108:admin.content.branch_toppage.branch: 支店
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4109:admin.content.branch_toppage.apply_common_setting: 支店共通設定を適用
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4110:admin.content.branch_toppage.banner: バナー画像
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4111:admin.content.branch_toppage.banner_image_tag: バナーリンクタグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4112:admin.content.branch_toppage.section: タイル位置
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4113:admin.content.branch_toppage.tile_type: タイル属性
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4114:admin.content.branch_toppage.tag: タイルタグ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4115:admin.content.branch_toppage.banner_image_required: バナー画像の登録に失敗しました。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4116:admin.content.branch_toppage.duplicate_section: タイル位置に重複があります。すべてのタイルは異なる位置を選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4117:admin.content.branch_toppage.tag_required: タイルタグを設定してください。（※タイル属性がピックアップ商品の場合を除く）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4500:admin.stock.move.type_transfer: 在庫振替
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4572:admin.stock.move.pick_list.stock_move_transfer_id: 在庫移動・振替番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4663:admin.stock.transfer.subtitle: 在庫管理
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4694:admin.stock.list.stock_transfer: 在庫振替登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4726:admin.stock.transfer.approval.subtitle: 在庫振替承認待ち
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4727:admin.stock.transfer.complete.subtitle: 在庫振替完了
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4728:admin.stock.transfer.approval_status_error: 承認待ちの在庫振替ではありません。または既に処理済みです。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4729:admin.stock.transfer.approval_no_authority: 承認権限がありません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4730:admin.stock.transfer.back_to_list: 在庫振替検索一覧へ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4733:admin.stock.transfer.basic_info_card_title: 入出庫基本情報
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4734:admin.stock.transfer.store: 店舗
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4735:admin.stock.transfer.stock_division: 在庫区分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4736:admin.stock.transfer.approval_department: 承認通知先
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4737:admin.stock.transfer.details_card_title: 在庫移動・振替内容
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4738:admin.stock.transfer.source: 振替元
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4739:admin.stock.transfer.dest: 振替先
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4740:admin.stock.transfer.product_name_code: 商品名/商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4741:admin.stock.transfer.product_code_search: 商品コード検索
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4742:admin.stock.transfer.product_code: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4743:admin.stock.transfer.product_code_placeholder: 商品コード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4744:admin.stock.transfer.quantity: 振替点数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4745:admin.stock.transfer.operation: 操作
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4746:admin.stock.transfer.search: 検索
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4747:admin.stock.transfer.delete: 削除
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4748:admin.stock.transfer.no_items: 在庫が選択されていません。在庫一覧から選択して登録してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4749:admin.stock.transfer.same_source_dest_error: 振替元と振替先に同じ在庫を指定できません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4750:admin.stock.transfer.dest_select_above: 振替先は上記で選択
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4751:admin.stock.transfer.dest_product_code_required: 振替先の商品コードを入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4752:admin.stock.transfer.quantity_required_when_dest_filled: 振替先を入力した場合は振替点数を入力してください（1以上）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4753:admin.stock.transfer.at_least_one_detail_required: 1行以上、振替先の商品コードと振替点数を入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4754:admin.stock.transfer.dest_product_code_not_found: 該当する商品が見つかりません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4755:admin.stock.transfer.dest_product_code_no_stock: 該当する振替先在庫がありません（同一在庫区分のため振替先に指定できません）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4756:admin.stock.transfer.dest_product_code_ambiguous: 振替先の在庫が一意に特定できません。商品コードで指定してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4757:admin.stock.transfer.product_search_modal_title: 商品検索
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4758:admin.stock.transfer.product_search_failed: 商品の検索に失敗しました。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4759:admin.stock.transfer.memo_placeholder: メモを入力（任意）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4760:admin.stock.transfer.inventory_list: 在庫一覧
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4761:admin.stock.transfer.confirm_modal_title: 確認
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4762:admin.stock.transfer.confirm_modal_reject_message: この操作はあとから取り消すことができません。在庫振替を却下してよろしいですか？
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4763:admin.stock.transfer.confirm_modal_reject_button: 却下する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4764:admin.stock.transfer.confirm_modal_approve_message: この操作はあとから取り消すことができません。在庫振替を承認してよろしいですか？
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4765:admin.stock.transfer.confirm_modal_approve_button: 承認する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4766:admin.stock.transfer.delete_row_confirm_message: 商品を削除（振替対象外）にします。よろしいですか。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4767:admin.stock.transfer.delete_row_confirm_button: 削除する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4768:admin.stock.transfer.not_editable_store: この店舗の在庫を編集する権限がありません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5077:admin.stock.join.transfer_quantity: 振向数量
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5220:admin.stock.move_instruction.stock_move_transfer_id: 在庫移動振替ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5340:admin.stock.approval_list.approval_target_stock_transfer: 在庫振替登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5383:admin.stock.move_transfer.title: 在庫移動振替一覧
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5384:admin.stock.move_transfer.stock_move_transfer_id: 在庫移動・振替ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5385:admin.stock.move_transfer.move_instruction_list_id: 移動指示リストID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5386:admin.stock.move_transfer.tracking_no: 送り状No.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5387:admin.stock.move_transfer.move_from_base_info: 出庫元店舗
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5388:admin.stock.move_transfer.move_to_base_info: 入庫先店舗
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5389:admin.stock.move_transfer.move_type: 移動タイプ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5390:admin.stock.move_transfer.move_transfer_status: ステータス
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5391:admin.stock.move_transfer.department: 所属
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5392:admin.stock.move_transfer.outbound_approver: 出庫承認者
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5393:admin.stock.move_transfer.registrant: 登録者
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5394:admin.stock.move_transfer.inbound_approver: 入庫承認者
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5395:admin.stock.move_transfer.move_from_stock_date: 出庫日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5396:admin.stock.move_transfer.move_to_stock_date: 入庫日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5397:admin.stock.move_transfer.approver_name_placeholder: 承認者名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5398:admin.stock.move_transfer.registrant_name_placeholder: 登録者名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5399:admin.stock.move_transfer.action_create_instruction: 在庫移動指示作成
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5400:admin.stock.move_transfer.action_barcode_csv_export: バーコード印刷用CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5401:admin.stock.move_transfer.action_move_transfer_csv_export: 在庫移動振替CSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5402:admin.stock.move_transfer.action_return_list_csv_export: 戻しリストCSV出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5403:admin.stock.move_transfer.action_return_list_pdf_export: 戻しリストPDF出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5404:admin.stock.move_transfer.return_list.pdf_title: 戻しリスト
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5405:admin.stock.move_transfer.return_list.title_per_item: 戻しリスト（商品単位_
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5406:admin.stock.move_transfer.return_list.title_per_supply: 戻しリスト（サプライ）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5407:admin.stock.move_transfer.return_list_csv_export.no_selection: 1つ以上の在庫移動情報を選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5408:admin.stock.move_transfer.barcode_csv_export.no_selection: 1つ以上の在庫移動・振替を選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5409:admin.stock.move_transfer.barcode_csv_export.not_found: 対象のデータが見つかりません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5410:admin.stock.move_transfer.barcode_csv_export.not_move_type: 'ID: %moveTransferId% は移動ではないため出力できません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5411:admin.stock.move_transfer.barcode_csv_export.not_smaregi_destination: 'ID: %moveTransferId% は入庫先がスマレジ在庫ではないため出力できません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5412:admin.stock.move_transfer.barcode_csv_export.move_to_shop_not_set: 'ID: %moveTransferId% は入庫先店舗が設定されていません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5413:admin.stock.move_transfer.barcode_csv_export.shop_not_permitted: 'ID: %moveTransferId% は権限のない店舗のデータです。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5414:admin.stock.move_transfer.barcode_csv_export.id_not_found: 'ID: %moveTransferId% は存在しません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5415:admin.stock.move_transfer.barcode_csv_export.multiple_shops: 複数店舗の在庫移動・振替情報を同時に処理することはできません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5416:admin.stock.move_transfer.return_list_pdf_export.popup_blocked: ポップアップがブロックされているため、戻しリストPDFを開けませんでした。ブラウザの設定を確認してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5417:admin.stock.move_transfer.return_list_pdf_export.fetch_failed: 戻しリストPDF用データの取得に失敗しました。
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
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5435:admin.stock.move_transfer.create_instruction.no_selection: 1つ以上の移動を選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5436:admin.stock.move_transfer.create_instruction.not_move_type: 移動タイプが「移動」のデータのみ選択してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5437:admin.stock.move_transfer.create_instruction.from_store_mismatch: 出庫元店舗が異なるデータが含まれています。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5438:admin.stock.move_transfer.create_instruction.to_store_mismatch: 入庫先店舗が異なるデータが含まれています。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5439:admin.stock.move_transfer.create_instruction.status_invalid: ステータスが出庫承認済みでないデータが含まれています。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5440:admin.stock.move_transfer.create_instruction.already_assigned: 移動指示IDが既に登録されているデータが含まれています。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5441:admin.stock.move_transfer.create_instruction.success: 在庫移動指示を作成しました。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5442:admin.stock.move_transfer.not_editable_store: この店舗の在庫を編集する権限がありません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5508:admin.purchase.online.form.transfer_request_date.label: 振込依頼日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5509:admin.purchase.online.form.transfer_complete_date.label: 振込完了日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5510:admin.purchase.online.form.transfer_fail_date.label: 振込失敗日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5543:admin.purchase.online.detail.can_transfer_request_flg: 振込依頼可能
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5544:admin.purchase.online.detail.transfer_failed_flg: 振込失敗
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5572:admin.purchase.online.detail.form.bank_account.branch_code.label: 支店名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5590:admin.purchase.online.history.form.transfer_complete_date_from.label: 振込完了日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5591:admin.purchase.online.history.form.transfer_complete_date_to.label: 振込完了日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6304:# (20) 支店 PC ナビゲーション
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6305:front.nav.branch.logo_aria_label: '%shop% 注文トップページ'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6306:front.nav.branch.mascot_alt: 支店マスコット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6376:# (28) 支店 PC フッター
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6378:front.footer.branch.sitemap.privacy: プライバシーポリシー
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6379:front.footer.branch.sitemap.tradelaw: 特定商取引法に基づく表記
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6380:front.footer.branch.postal_prefix: '〒'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6381:front.footer.branch.google_map_label: GOOGLE MAP
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6382:front.footer.branch.google_map_aria_label: Google Mapで見る
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6383:front.footer.branch.tel_prefix: 'TEL：'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6384:front.footer.branch.business_hour_prefix: '営業時間：'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/buy_sale_price_history.twig:232:                                            {% set page_count_href_params = {'page_no': 1, 'page_count': pageMax.name} %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/buy_sale_price_history.twig:234:                                                {% set page_count_href_params = page_count_href_params|merge({'multi': app.request.query.get('multi')}) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/buy_sale_price_history.twig:237:                                                {% set page_count_href_params = page_count_href_params|merge({'card_condition': app.request.query.get('card_condition')}) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/buy_sale_price_history.twig:241:                                                   href="{{ path('admin_product_buy_sale_price_history_search', page_count_href_params) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/history.twig:119:                        <label class="col-form-label">{{ 'admin.purchase.online.history.form.transfer_complete_date_from.label'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/history.twig:122:                                {{ form_widget(searchForm.transfer_complete_date_from) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/history.twig:123:                                {{ form_errors(searchForm.transfer_complete_date_from) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/history.twig:127:                                {{ form_widget(searchForm.transfer_complete_date_to) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/history.twig:128:                                {{ form_errors(searchForm.transfer_complete_date_to) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/history.twig:254:                                                    <td>{% if row.transfer_complete_date %}{{ row.transfer_complete_date|date('Y/m/d') }}<br>{{ row.transfer_complete_date|date('H:i:s') }}{% endif %}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/base_csv_upload.twig:83:                        <a href="{{ url(template_download_route, template_download_route_params|default({})) }}" class="btn btn-secondary" id="download-template-button">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/shelf_number.twig:158:                                    'params': {'id': id}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/edit_bulk_update_buy_price.twig:108:        // 在庫表示切替（TC東京 / 支店 / バックヤード）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/edit_bulk_update_buy_price.twig:156:                                            <option value="branch">{{ 'admin.product.stock_branch'|trans }}</option>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/edit_bulk_update_buy_price.twig:228:                                                                     data-stock-branch="{{ formDetail.vars.value.stock_nm_branch|default(0) }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/edit_bulk_update_buy_price.twig:242:                                                                     data-stock-branch="{{ formDetail.vars.value.stock_sp_branch|default(0) }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/edit_bulk_update_buy_price.twig:256:                                                                     data-stock-branch="{{ formDetail.vars.value.stock_mp_branch|default(0) }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/edit_bulk_update_buy_price.twig:270:                                                                     data-stock-branch="{{ formDetail.vars.value.stock_hp_branch|default(0) }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/ProductClass/edit.twig:82:            const selectedId = String(e.params?.args?.data?.id ?? '');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/ProductClass/edit.twig:96:            const selectedId = String(e.params?.args?.data?.id ?? '');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/product.twig:424:                                            <span>{{ 'admin.product.is_branch_published'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:106:    transferRequestedStatus: constant('Eccube\\Entity\\Master\\MtbBuyOrderStatus::TRANSFER_REQUESTED') ~ '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:192:                                            {{ form_widget(form.transferFailedFlg) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:193:                                            {{ form_errors(form.transferFailedFlg) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:831:                                <label class="col-md-3 col-form-label">{{ 'admin.purchase.online.detail.form.bank_account.branch_code.label'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:833:                                    {{ form_widget(bankAccountForm.branchCode, { 'attr' : { 'class' : 'form-control customer editform', 'readonly' : 'readonly' }}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:834:                                    {{ form_errors(bankAccountForm.branchCode) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:44:        return ['default' => 'transferCompleteDate'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:136:        if ($searchData->transferCompleteDateFrom !== null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:137:            $qb->andWhere($createTcSubQuery('bosh_tc_from').' >= :transferCompleteDateFrom')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:138:                ->setParameter('transferCompleteDateFrom', $searchData->transferCompleteDateFrom);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:142:        if ($searchData->transferCompleteDateTo !== null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:143:            $qb->andWhere($createTcSubQuery('bosh_tc_to').' <= :transferCompleteDateTo')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:144:                ->setParameter('transferCompleteDateTo', $searchData->transferCompleteDateTo);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:227:        $qb->addSelect($createTcSubQuery('bosh_tc_sort').' AS HIDDEN transferCompleteDateSort');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:231:        $qb->addSelect('CASE WHEN EXISTS '.$existsQuery.' THEN 0 ELSE 1 END AS HIDDEN transferCompleteDateNullLast');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:233:        $qb->addOrderBy('transferCompleteDateNullLast', 'ASC') // 0(存在する) が先、1(存在しない/NULL) が最後
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:234:            ->addOrderBy('transferCompleteDateSort', 'DESC')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:310:        $qb->addSelect($tcSubQuery.' AS HIDDEN transferCompleteDateSort');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:312:        $qb->addSelect('CASE WHEN EXISTS '.$existsQuery.' THEN 0 ELSE 1 END AS HIDDEN transferCompleteDateNullLast');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:313:        $qb->addOrderBy('transferCompleteDateNullLast', 'ASC')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:314:            ->addOrderBy('transferCompleteDateSort', 'DESC')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:334:            $transferCompleteDate = $this->getTransferCompleteDateForOrder($Order);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:348:                'transferCompleteDate' => $transferCompleteDate !== null ? $transferCompleteDate->format('Y/m/d H:i:s') : '',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:340:     * 支店ECTOP §2 SALE中の商品 仕様準拠で取得する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:431:     * 指定支店でピックアップフラグが立っている ProductClass を持つ公開商品を上位取得する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1357:        $params['productId'] = $productId;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1364:            $params["{$paramName}"] = $tagSalesAnalysisId;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1371:                $params,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1411:        $params = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1420:            ->setParameters($params)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1451:        $params = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1457:            $params['exceptProductId'] = $exceptProductId;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1465:            ->setParameters($params)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1486:    is_branch_published = ?,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1579:    is_branch_published,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1972:        $params = [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1975:            $params["productId{$index}"] = $pair['productId'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1976:            $params["languageId{$index}"] = $pair['languageId'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1977:            $params["highPriceCode{$index}"] = $pair['highPriceCode'] ?? '';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2023:        foreach ($params as $key => $value) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:17:{% set defaultStockSummary = {'mainStoreStock': 0, 'branchTotalStock': 0} %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:533:                                                    <option {% if display_mode == DISPLAY_MODE_SALES_BRANCH %}selected=""{% endif %} value="{{ path('admin_product_page', {'page_no': page_no, 'mode': DISPLAY_MODE_SALES_BRANCH}) }}">{{ 'admin.product.list_display_data__branch'|trans }}</option>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:562:                                        <th class="border-top-0 pt-2 pb-2 stock">{{ 'admin.product.stock__branch'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:621:                                                    {{ stockSummary.branchTotalStock|number_format }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:645:                                                {% set branchQuantity = branchSalesQuantities[ProductClass.id]|default(defaultOrderQuantities) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:647:                                                    {{ branchQuantity.orderQuantity01|number_format }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:650:                                                    {{ branchQuantity.orderQuantity02|number_format }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:653:                                                    {{ branchQuantity.orderQuantity03|number_format }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:656:                                                    {{ branchQuantity.orderQuantity04|number_format }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:659:                                                    {{ branchQuantity.orderQuantity05|number_format }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:662:                                                    {{ branchQuantity.orderQuantity06|number_format }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:733:                                                        {{ stockSummary.branchTotalStock|number_format }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:757:                                                    {% set branchQuantity = branchSalesQuantities[productClass.id]|default(defaultOrderQuantities) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:759:                                                        {{ branchQuantity.orderQuantity01|number_format }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:762:                                                        {{ branchQuantity.orderQuantity02|number_format }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:765:                                                        {{ branchQuantity.orderQuantity03|number_format }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:768:                                                        {{ branchQuantity.orderQuantity04|number_format }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:771:                                                        {{ branchQuantity.orderQuantity05|number_format }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/index.twig:774:                                                        {{ branchQuantity.orderQuantity06|number_format }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_new.twig:3:{% set menus = ['product_stock', 'stock_move_transfer'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_new.twig:69:                            {% include '@admin/Stock/stock_move_transfer_info.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_new.twig:202:                {% include '@admin/Stock/stock_move_transfer_status_history.twig' with {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/banner.twig:265:                                    <p class="text-danger errormsg mt-2 mb-0">{{ uploadError.message|trans(uploadError.params ?? {}) }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:3:{% set menus = ['product_stock', 'stock_move_transfer'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:272:                            {% include '@admin/Stock/stock_move_transfer_info.twig' with { StockMoveTransfer: StockMoveTransfer } %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:416:                                                    form.stock_move_transfer_details[detailIndex].stockoutQuantity,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:418:                                                        value: form.stock_move_transfer_details[detailIndex].stockoutQuantity.vars.value,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:427:                                                {{ form_errors(form.stock_move_transfer_details[detailIndex].stockoutQuantity) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:475:                {% include '@admin/Stock/stock_move_transfer_status_history.twig' with {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:485:                                    <a href="{{ url('admin_stock_move_transfer') }}" class="c-baseLink">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_transfer_info.twig:21:                <div class="form-control-plaintext">{% if hasDisplay %}{{ (StockMoveTransfer.moveTransferType == 1 ? 'admin.stock.move.type_move' : 'admin.stock.move.type_transfer')|trans }}{% else %}{{ 'admin.stock.move.type_transfer'|trans }}{% endif %}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Purchase/fill.twig:210:                                <th>{{ 'front.purchase.fill.branch_name'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Purchase/fill.twig:212:                                    {{ form_widget(form.branchCode) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Purchase/fill.twig:213:                                    {{ form_errors(form.branchCode) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/tag_sales_analysis.twig:138:                                    'params': {'id': id}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval.twig:3:{% set menus = ['product_stock', 'stock_move_transfer'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval.twig:55:                            {% include '@admin/Stock/stock_move_transfer_info.twig' with { StockMoveTransfer: StockMoveTransfer } %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval.twig:211:                {% include '@admin/Stock/stock_move_transfer_status_history.twig' with {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval.twig:221:                                    <a href="{{ url('admin_stock_move_transfer') }}" class="c-baseLink">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSmaregiPointPushLogRepository.php:34:    public function existsByTransactionHeadId(string $transactionHeadId): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/shop_top.twig:35:    <div class="p-hareruya-branch-top">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:489:                                    data-url="{{ url('admin_stock_transfer_new') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:490:                                    {{ 'admin.stock.list.stock_transfer'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbWeeklyStockHistoryTempRepository.php:91:        $params = [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbWeeklyStockHistoryTempRepository.php:102:            $params[] = '('.implode(',', $values).')';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbWeeklyStockHistoryTempRepository.php:105:        return $params;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbWeeklyStockHistoryTempRepository.php:111:     * @param array<int, string> $params INSERT VALUES 用の文字列配列
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbWeeklyStockHistoryTempRepository.php:113:    public function insertBatch(array $params): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbWeeklyStockHistoryTempRepository.php:115:        if (empty($params)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbWeeklyStockHistoryTempRepository.php:127:        $count = (int) ceil(count($params) / BatchUpdateWeeklyStockHistoryAction::BATCH_SIZE);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbWeeklyStockHistoryTempRepository.php:129:            $values = implode(',', array_slice($params, $offset, BatchUpdateWeeklyStockHistoryAction::BATCH_SIZE));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategoryTreeResponseBuilder.php:50:     * @param bool $branchContext true のとき支店向け表示（branch_hide_flg が true のカテゴリを除外）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategoryTreeResponseBuilder.php:54:    public function buildRoots(Category $root, bool $branchContext = false): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategoryTreeResponseBuilder.php:60:        if ($branchContext && $root->getBranchHideFlg()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategoryTreeResponseBuilder.php:66:            $branchContext
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategoryTreeResponseBuilder.php:69:            $node = $this->buildNode($root, $branchContext, null);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategoryTreeResponseBuilder.php:100:    private function buildNode(Category $category, bool $branchContext, ?Category $parentInTree): ?array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategoryTreeResponseBuilder.php:110:        if ($branchContext && $category->getBranchHideFlg()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategoryTreeResponseBuilder.php:121:                $built = $this->buildNode($child, $branchContext, $category);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategoryTreeResponseBuilder.php:135:            foreach ($this->cardsetSyntheticChildrenGenerator->generate($category, $branchContext) as $synthetic) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig:32:                var params = '';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig:34:                    params += 'ids%5B%5D=' + $(this).attr('value') + '&';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig:37:                    location.href = '{{ path('admin_order_manual_mail_all_edit', {'templateId': 0}) }}'.replace(/\/0$/, '/' + templateId) + '?' + params;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig:39:                    location.href = '{{ path('admin_order_manual_mail_all') }}?' + params;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbFavoriteProductRepository.php:60:    //         ->join('pl.customerGroup', 'cg', Join::WITH, 'cg.shopFrontFlg = 0 AND cg.branchShopFrontFlg = 0')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_header.twig:11:{% set branchClassName = BaseInfo.html_class_name is defined ? BaseInfo.html_class_name : '' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_header.twig:12:{% set branchShopName = app.request.locale == 'en' ? (BaseInfo.shopNameEng ?? BaseInfo.shopName) : BaseInfo.shopName %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_header.twig:13:{% set branchMascotSrc = BaseInfo.local_hareruyakun_image is not empty
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_header.twig:15:    : (branchClassName != '' ? asset('assets/img/dynamic/branch/branch-' ~ branchClassName ~ '-hareruyakun.webp') : '') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_header.twig:16:<header class="l-hareruya-header p-hareruya-header--branch" data-header>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_header.twig:19:            <h1 class="p-hareruya-header__logo p-hareruya-header__logo--branch">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_header.twig:20:                <a class="p-hareruya-header__logo-link" href="{{ url('homepage') }}" aria-label="{{ 'front.nav.branch.logo_aria_label'|trans({'%shop%': branchShopName}) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_header.twig:21:                    <span class="p-hareruya-header__branch-logo">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_header.twig:22:                        <span class="p-hareruya-header__branch-logo-wrap">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_header.twig:28:                        {% if branchClassName != '' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_header.twig:29:                            <span class="p-hareruya-header__branch-name-img-wrap">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_header.twig:30:                                <img class="p-hareruya-header__branch-name-img" src="{{ asset('assets/img/dynamic/branch/branch-' ~ branchClassName ~ '-text.webp') }}" alt="{{ branchShopName }}" width="125" height="14">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_header.twig:34:                    {% if branchMascotSrc != '' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_header.twig:35:                        <span class="p-hareruya-header__branch-mascot-wrap">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_header.twig:36:                            <img class="p-hareruya-header__branch-mascot" src="{{ branchMascotSrc }}" alt="{{ 'front.nav.branch.mascot_alt'|trans }}" width="64" height="64">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_header.twig:43:                <div class="p-hareruya-header__point p-hareruya-header__point--branch">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_order_method.twig:12:<div class="p-hareruya-branch-top__info">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_order_method.twig:13:  <div class="p-hareruya-branch-top__info-balloon">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_order_method.twig:14:    <p class="p-hareruya-branch-top__info-text">{{ 'shop_top.order_method.in_store'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_order_method.twig:16:  <div class="p-hareruya-branch-top__info-character">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_order_method.twig:17:    <img class="p-hareruya-branch-top__info-character-img" src="{{ asset('assets/hareruya/img/share/ozigi-hareruyakun02.webp') }}" alt="{{ 'shop_top.mascot_alt'|trans }}" width="48" height="55" decoding="async">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_order_method.twig:21:<div class="p-hareruya-branch-top__info">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_order_method.twig:22:  <div class="p-hareruya-branch-top__info-balloon">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_order_method.twig:23:    <p class="p-hareruya-branch-top__info-text">{{ 'shop_top.order_method.public.prefix1'|trans({ '%shop_name%': app.request.locale == 'en' ? (Shop.shopNameEng ?? Shop.shopName) : Shop.shopName }) }}<br>{{ 'shop_top.order_method.public.prefix2'|trans }}<a class="p-hareruya-branch-top__info-link" href="{{ url('homepage', { _shop: '' }) }}" target="_blank">{{ 'shop_top.order_method.public.link_text'|trans }}</a>{{ 'shop_top.order_method.public.suffix'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_order_method.twig:25:  <div class="p-hareruya-branch-top__info-character">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_order_method.twig:26:    <img class="p-hareruya-branch-top__info-character-img" src="{{ asset('assets/hareruya/img/share/ozigi-hareruyakun02.webp') }}" alt="{{ 'shop_top.mascot_alt'|trans }}" width="48" height="55" decoding="async">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:3:{% set menus = ['product_stock', 'stock_move_transfer'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:336:                            {% include '@admin/Stock/stock_move_transfer_info.twig' with { StockMoveTransfer: StockMoveTransfer } %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:485:                                                    form.stock_move_transfer_details[detailIndex].differenceQuantity,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:487:                                                        value: form.stock_move_transfer_details[detailIndex].differenceQuantity.vars.value,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:495:                                                {{ form_errors(form.stock_move_transfer_details[detailIndex].differenceQuantity) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:543:                {% include '@admin/Stock/stock_move_transfer_status_history.twig' with {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:553:                                    <a href="{{ url('admin_stock_move_transfer') }}" class="c-baseLink">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBranchUpdateErrorRepository.php:36:    //     $withinHours = $app['config']['HareruyaEc']['const']['branch_update_error']['within_hours'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBranchUpdateErrorRepository.php:44:    //             dtb_branch_update_error bue
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbInventoryPlanRepository.php:156:        $params = [$lockName, $lockName, self::ADVISORY_LOCK_KEY2_SUFFIX];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbInventoryPlanRepository.php:158:            $result = $conn->fetchOne($sql, $params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/CustomerGroup/index.twig:55:                                    {{ form_widget(form.branch_shop_front_flg) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/CustomerGroup/index.twig:56:                                    {{ form_errors(form.branch_shop_front_flg) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardsetRepository.php:59:     * 支店表示フラグが立った発売済みのカードセットを取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardsetRepository.php:64:        ->where('cs.branch_display_flg = true')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_footer.twig:11:<footer class="l-hareruya-footer p-hareruya-footer p-hareruya-footer--branch">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_footer.twig:14:            <div class="p-hareruya-footer__branch-info">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_footer.twig:15:                <div class="p-hareruya-footer__nav p-hareruya-footer__nav--branch">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_footer.twig:18:                            <button class="p-hareruya-footer__nav-toggle js-footer-accordion-trigger" type="button" aria-expanded="false" aria-controls="footer-branch-nav-sitemap" title="{{ 'front.footer.accordion_toggle'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_footer.twig:23:                        <div class="p-hareruya-footer__nav-body" id="footer-branch-nav-sitemap">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_footer.twig:29:                                    <a class="p-hareruya-footer__nav-link" href="{{ url('help_privacy') }}">{{ 'front.footer.branch.sitemap.privacy'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_footer.twig:32:                                    <a class="p-hareruya-footer__nav-link" href="{{ url('help_tradelaw') }}">{{ 'front.footer.branch.sitemap.tradelaw'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_footer.twig:43:                            <button class="p-hareruya-footer__nav-toggle js-footer-accordion-trigger" type="button" aria-expanded="false" aria-controls="footer-branch-nav-info" title="{{ 'front.footer.accordion_toggle'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_footer.twig:48:                        <div class="p-hareruya-footer__nav-body" id="footer-branch-nav-info">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_footer.twig:69:                        <p class="p-hareruya-footer__branch-name">{{ app.request.locale == 'en' ? (BaseInfo.shopNameEng ?? BaseInfo.shopName) : BaseInfo.shopName }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_footer.twig:75:                            <p class="p-hareruya-footer__address-postal">{{ 'front.footer.branch.postal_prefix'|trans }}{{ formattedZip }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_footer.twig:87:                                <a class="p-hareruya-footer__map-link" href="{{ mapUrl }}" target="_blank" rel="noopener noreferrer" aria-label="{{ 'front.footer.branch.google_map_aria_label'|trans }}">{{ 'front.footer.branch.google_map_label'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_footer.twig:91:                            <p class="p-hareruya-footer__tel">{{ 'front.footer.branch.tel_prefix'|trans }}<a href="tel:{{ BaseInfo.phone_number }}">{{ BaseInfo.phone_number }}</a></p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_footer.twig:94:                            <p class="p-hareruya-footer__hours">{{ 'front.footer.branch.business_hour_prefix'|trans }}{{ BaseInfo.business_hour }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:232:     * 指定支店(base_info_id) の週間販売数 (sales_quantity_04) 上位の ProductClass を取得する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:233:     * 支店ECTOP「今週の売れ筋商品」向け。公開商品・在庫1以上・ロケール一致を満たすもののみ。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:479:     * 支店の合計販売数を取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:494:     * @param bool $isMainBase true の場合は通販+TC東京（base_info_id = TC_TOKYO_ID）、false の場合は支店（dtb_base_info.is_main_shop = false）を集計する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:504:        $params = ['ids' => $productClassIds];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:509:            $params['mallBaseInfoId'] = BaseInfo::TC_TOKYO_ID;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:529:            $params,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:8:{% block sub_title %}{{ 'admin.stock.transfer.subtitle'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:18:            // 承認通知先メンバーセレクトボックスのエレメントを取得（getBlockPrefix: admin_stock_transfer_new）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:19:            const $approvalNotificationTargetMembersSelect = $('#admin_stock_transfer_new_approval_notification_target_members');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:39:            $(document).on('click', '.btn-transfer-product-search', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:65:                    alert('{{ 'admin.stock.transfer.product_search_failed'|trans }}');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:74:             * @param {jQuery} $transferRow - 振替一覧の行
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:77:            function applyDestToTransferRow($transferRow, destData) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:82:                    const $destCell = $transferRow.find('[data-destKey="' + destKey + '"]');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:83:                    const $sourceCell = $transferRow.find('td').eq(sourceColIndex[i]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:112:                if (!$('#stock_transfer_new_form').length || !window.currentTransferDestInput || !window.currentTransferDestInput.length) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:136:                    const $transferRow = window.currentTransferDestInput.closest('tr');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:138:                        url: '{{ url('admin_stock_transfer_dest_product_class_info') }}',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:144:                        applyDestToTransferRow($transferRow, destData);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:151:                        alert('{{ 'admin.stock.transfer.product_search_failed'|trans }}');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:169:                    alert('{{ 'admin.stock.transfer.product_search_failed'|trans }}');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:195:                        return $(this).find('input[name*="[transfer_details]"]').length > 0;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:205:                                $el.attr('name', nameAttr.replace(/\[transfer_details\]\[\d+\]/, '[transfer_details][' + rowIndex + ']'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:209:                                $el.attr('id', idAttr.replace(/_transfer_details_\d+_/, '_transfer_details_' + rowIndex + '_'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:216:                                $label.attr('for', forAttr.replace(/_transfer_details_\d+_/, '_transfer_details_' + rowIndex + '_'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:223:                    $remainingRows.find('.btn-transfer-row-delete').prop('disabled', disableDelete);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:235:    {{ form_start(form, { attr: { id: 'stock_transfer_new_form' }, action: formAction|default(''), method: 'POST' }) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:244:                                <span class="card-title align-middle fw-bold">{{ 'admin.stock.transfer.basic_info_card_title'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:251:                            {% include '@admin/Stock/stock_transfer_info.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:256:                                            <label class="fw-bold">{{ 'admin.stock.transfer.store'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:266:                                            <label class="fw-bold">{{ 'admin.stock.transfer.stock_division'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:276:                                    <label class="col-form-label mb-0">{{ 'admin.stock.transfer.approval_department'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:295:                                <span class="card-title align-middle fw-bold">{{ 'admin.stock.transfer.details_card_title'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:305:                                        <th class="pt-2 pb-2 ps-3 border-bottom-0 text-black-50" colspan="5">{{ 'admin.stock.transfer.source'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:306:                                        <th class="pt-2 pb-2 border-bottom-0 text-black-50" colspan="6">{{ 'admin.stock.transfer.dest'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:307:                                        <th class="pt-2 pb-2 border-bottom-0 text-black-50" colspan="3">{{ 'admin.stock.transfer.source'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:310:                                        <th class="pt-2 pb-2 ps-3">{{ 'admin.stock.transfer.product_name_code'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:316:                                        <th class="pt-2 pb-2 ps-3">{{ 'admin.stock.transfer.product_name_code'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:322:                                        <th class="pt-2 pb-2">{{ 'admin.stock.transfer.quantity'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:323:                                        <th class="pt-2 pb-2 pe-3">{{ 'admin.stock.transfer.operation'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:327:                                    {% for detail in form.transfer_details %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:344:                                                <button type="button" class="btn btn-secondary btn-sm ms-0 mt-1 btn-transfer-product-search" data-bs-toggle="modal" data-bs-target="#stockTransferProductModal">{{ 'admin.stock.transfer.search'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:363:                                                {{ form_widget(detail.move_transfer_quantity) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:364:                                                {{ form_errors(detail.move_transfer_quantity) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:368:                                                        class="btn btn-ec-delete btn-sm btn-transfer-row-delete"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:369:                                                        {% if form.transfer_details|length <= 1 %}disabled{% endif %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:371:                                                        data-bs-target="#stockTransferDeleteRowModal">{{ 'admin.stock.transfer.delete'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:376:                                            <td colspan="14" class="text-center text-muted py-3">{{ 'admin.stock.transfer.no_items'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:436:                    <h5 class="modal-title fw-bold" id="stockTransferDeleteRowModalTitle">{{ 'admin.stock.transfer.confirm_modal_title'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:440:                    <p class="mb-0">{{ 'admin.stock.transfer.delete_row_confirm_message'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:444:                    <button class="btn btn-ec-delete" type="button" id="stockTransferDeleteRowModalConfirm">{{ 'admin.stock.transfer.delete_row_confirm_button'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_new.twig:455:                    <h5 class="modal-title">{{ 'admin.stock.transfer.product_search_modal_title'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:13:{% set menus = ['content', 'branch'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:15:{% block title %}{{ 'admin.content.branch_toppage_management'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:23:    const $selector = $('#branch-selector').length ? $('#branch-selector') : $('[name="branch_toppage_management[branch_list]"]');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:24:    const COMMON_BRANCH_ID = {{ common_branch_id }};
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:27:        const branchId = $selector.val() || {{ selected_branch_id }};
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:30:        if (Number(branchId) === COMMON_BRANCH_ID) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:39:        const branchId = $(this).val() || {{ selected_branch_id }};
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:40:        $('#branch-form-id').val(branchId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:41:        const $branchListField = $('#branch_toppage_management_branch_list');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:42:        if ($branchListField.length) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:43:            $branchListField.val(branchId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:48:        const $form = $('#branch_toppage_management_form');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:49:        $form.attr('action', '{{ path('admin_content_branch_toppage_select') }}');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:114:            $('#branch_toppage_management_Tiles_' + index + '_section').val(sectionValue);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:121:            $('#branch_toppage_management_image_file').attr('disabled', 'disabled');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:122:            $('#branch_toppage_management_banner_image_tag').attr('disabled', 'disabled');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:123:            $("[id^='branch_toppage_management_Tiles']").attr('disabled', 'disabled');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:125:            $('#branch_toppage_management_image_file').removeAttr('disabled');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:126:            $('#branch_toppage_management_banner_image_tag').removeAttr('disabled');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:127:            $("[id^='branch_toppage_management_Tiles']").removeAttr('disabled');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:144:        $("[id^='branch_toppage_management_Tiles_'][id*='_tileType']").each(function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:149:    $(document).on('change', "[id^='branch_toppage_management_Tiles_'][id*='_tileType']", function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:154:    $("[id^='branch_toppage_management_Tiles_'][id*='_tileType']").each(function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:173:<form name="form" role="form" class="form-horizontal h-adr" id="branch_toppage_management_form" method="post" action="{{ path('admin_content_branch_toppage_register') }}" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:175:    <input type="hidden" name="branch_id" id="branch-form-id" value="{{ selected_branch_id }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:180:                    <div class="card-header"><span>{{ 'admin.content.branch_toppage.select_branch'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:183:                            <div class="col-3"><span>{{ 'admin.content.branch_toppage.branch'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:185:                                {{ form_widget(form.branch_list, {'attr': {'id': 'branch-selector'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:196:                                {% if is_common_branch %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:205:                            <div class="col-3"><span>{{ 'admin.content.branch_toppage.banner'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:219:                            <div class="col-3"><span>{{ 'admin.content.branch_toppage.banner_image_tag'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:225:                        <div id="tiles" data-bs-prototype="{{ include('@admin/Content/branch_toppage_tile.twig', {'form': form.Tiles.vars.prototype})|e('html_attr') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage.twig:227:                                {{ include('@admin/Content/branch_toppage_tile.twig', {'form': tileForm}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:59:        $stockMoveTransferId = isset($searchData['stock_move_transfer_id']) ? trim((string) $searchData['stock_move_transfer_id']) : '';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:102:        if (!empty($searchData['move_transfer_type'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:104:                ->setParameter('mtt', $searchData['move_transfer_type']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:107:        if (!empty($searchData['move_transfer_status'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:109:                ->setParameter('mts', $searchData['move_transfer_status']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:186:            $quantityExpression = 'd.move_transfer_quantity - COALESCE(d.stockout_quantity, 0)';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:191:            $quantityExpression = 'd.move_transfer_quantity';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:241:                -- 棚番ソート: 本店のみ棚番順、支店は棚番によるソートを行わない（全て0で同順）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:257:            FROM dtb_stock_move_transfer_detail d
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:258:            JOIN dtb_stock_move_transfer smt ON smt.id = d.stock_move_transfer_id
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:284:                -- 2. 棚番: 本店のみ棚番順、支店は棚番によるソートを行わない（全て0で同順）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:324:     * @return list<array{transferId: int, shopId: int|null, statusId: int}>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:336:                'smt.id AS transferId',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:429:                FROM dtb_stock_move_transfer smt
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:430:                INNER JOIN dtb_stock_move_transfer_detail d ON d.stock_move_transfer_id = smt.id
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:442:                    AND smt.move_transfer_type = :move_transfer_type
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:461:            'move_transfer_type' => DtbStockMoveTransfer::MOVE_TRANSFER_TYPE_MOVE,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:468:            'move_transfer_type' => \PDO::PARAM_INT,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSynchronisationUpdateRepository.php:86:        $params = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSynchronisationUpdateRepository.php:93:            $params["targetId_{$targetId}"] = $targetId;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSynchronisationUpdateRepository.php:96:        $this->getEntityManager()->getConnection()->executeUpdate($sql.implode(',', $valueSqls), $params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage_tile.twig:3:        <span>{{ 'admin.content.branch_toppage.section'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage_tile.twig:10:        <span>{{ 'admin.content.branch_toppage.tile_type'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/branch_toppage_tile.twig:17:        <span>{{ 'admin.content.branch_toppage.tag'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveInstructionRepository.php:66:        $stockMoveTransferId = isset($searchData['stock_move_transfer_id']) ? trim((string) $searchData['stock_move_transfer_id']) : '';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveInstructionRepository.php:74:                ->andWhere('CONCAT(t.id, \'\') = :stock_move_transfer_id')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveInstructionRepository.php:75:                ->setParameter('stock_move_transfer_id', $stockMoveTransferId)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveInstructionRepository.php:162:     * @param list<int> $transferIds   集計対象の在庫移動振替ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveInstructionRepository.php:167:    public function getTransferAggregatesByTransferIds(array $transferIds, int $priceThreshold): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveInstructionRepository.php:169:        if ($transferIds === []) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveInstructionRepository.php:174:            ->select('t.id AS transfer_id')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveInstructionRepository.php:175:            ->addSelect('COALESCE(SUM(d.moveTransferQuantity), 0) AS move_transfer_quantity')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveInstructionRepository.php:185:            ->setParameter('ids', $transferIds)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveInstructionRepository.php:200:            $aggregates[(int) $row['transfer_id']] = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveInstructionRepository.php:201:                'quantity' => (int) $row['move_transfer_quantity'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_complete.twig:3:{% set menus = ['product_stock', 'stock_move_transfer'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_complete.twig:32:                            {% include '@admin/Stock/stock_move_transfer_info.twig' with { StockMoveTransfer: StockMoveTransfer } %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_complete.twig:170:                {% include '@admin/Stock/stock_move_transfer_status_history.twig' with {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_complete.twig:181:                                    <a href="{{ url('admin_stock_move_transfer') }}" class="c-baseLink">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_transfer_info.twig:21:                <div class="form-control-plaintext">{% if hasDisplay %}{{ (StockMoveTransfer.moveTransferType == 1 ? 'admin.stock.move.type_move' : 'admin.stock.move.type_transfer')|trans }}{% else %}{{ 'admin.stock.move.type_move'|trans }}{% endif %}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductStockRepository.php:595:     * 商品規格IDごとに、本店（base_info_id = TC_TOKYO_ID）在庫と支店（dtb_base_info.is_main_shop = false）合計在庫を取得する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductStockRepository.php:599:     * @return array<int, array{mainStoreStock:int,branchTotalStock:int}>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductStockRepository.php:611:                COALESCE(SUM(CASE WHEN bi.is_main_shop = false THEN ps.stock ELSE 0 END), 0) AS branch_total_stock
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductStockRepository.php:631:                'branchTotalStock' => (int) $row['branch_total_stock'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_best_sellers.twig:12:<section class="p-hareruya-section p-hareruya-branch-top__best-sellers">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:332:        $params = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:342:        return $conn->iterateAssociative($sql, $params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:511:            CASE WHEN p.is_branch_published THEN '1' ELSE '0' END AS is_branch_published,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:988:                // 支店: dtb_base_info.is_main_shop = false
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:989:                'SUM(CASE WHEN pc.CardCondition = 1 AND bi.isMainShop = false THEN COALESCE(ps.stock, 0) ELSE 0 END) as stock_nm_branch',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:990:                'SUM(CASE WHEN pc.CardCondition = 2 AND bi.isMainShop = false THEN COALESCE(ps.stock, 0) ELSE 0 END) as stock_sp_branch',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:991:                'SUM(CASE WHEN pc.CardCondition = 3 AND bi.isMainShop = false THEN COALESCE(ps.stock, 0) ELSE 0 END) as stock_mp_branch',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:992:                'SUM(CASE WHEN pc.CardCondition = 4 AND bi.isMainShop = false THEN COALESCE(ps.stock, 0) ELSE 0 END) as stock_hp_branch',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2647:        $params = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:2668:            $params,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:99:                                        <label class="form-label fw">{{ form_label(searchForm.stock_move_transfer_id) }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:100:                                        {{ form_widget(searchForm.stock_move_transfer_id, {'attr': {'class': 'form-control form-control-sm w-100'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:101:                                        {{ form_errors(searchForm.stock_move_transfer_id) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardDetailRepository.php:193:        $params = [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardDetailRepository.php:196:        $params['cardNameEn'] = $cardInfo['cardNameEn'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardDetailRepository.php:199:        $params['foilFlg'] = $cardInfo['foilFlg'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardDetailRepository.php:202:        $params['promotionId'] = $cardInfo['promotionId'] ?? MtbPromotion::NON_PROMOTION_ID;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardDetailRepository.php:206:            $params['cardsetNameEn'] = $cardInfo['cardsetNameEn'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardDetailRepository.php:223:            ->setParameters($params)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_complete.twig:6:{% block sub_title %}{{ 'admin.stock.transfer.complete.subtitle'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_complete.twig:24:                            {% include '@admin/Stock/stock_transfer_info.twig' with { StockMoveTransfer: StockMoveTransfer } %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_complete.twig:29:                                            <label class="fw-bold">{{ 'admin.stock.transfer.store'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_complete.twig:39:                                            <label class="fw-bold">{{ 'admin.stock.transfer.stock_division'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_complete.twig:56:                                <span class="card-title align-middle fw-bold">{{ 'admin.stock.transfer.details_card_title'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_complete.twig:66:                                        <th class="pt-2 pb-2 ps-3" colspan="5">{{ 'admin.stock.transfer.source'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_complete.twig:67:                                        <th class="pt-2 pb-2" colspan="5">{{ 'admin.stock.transfer.dest'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_complete.twig:68:                                        <th class="pt-2 pb-2 pe-3">{{ 'admin.stock.transfer.quantity'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_complete.twig:71:                                        <th class="pt-2 pb-2 ps-3">{{ 'admin.stock.transfer.product_name_code'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_complete.twig:76:                                        <th class="pt-2 pb-2 ps-3">{{ 'admin.stock.transfer.product_name_code'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_complete.twig:81:                                        <th class="pt-2 pb-2 pe-3">{{ 'admin.stock.transfer.quantity'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_complete.twig:174:                {% include '@admin/Stock/stock_move_transfer_status_history.twig' with {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_complete.twig:184:                                    <a href="{{ url('admin_stock_move_transfer') }}" class="c-baseLink">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_complete.twig:186:                                        <span>{{ 'admin.stock.transfer.back_to_list'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventDetailRepository.php:130:     * @param array<string, mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventDetailRepository.php:132:    public function searchBy(array $params, int $limit = 25, int $offset = 0): mixed
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventDetailRepository.php:134:        $qb = $this->buildSearchQuery($params);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventDetailRepository.php:146:     * @param array<string, mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventDetailRepository.php:148:    public function countBy(array $params): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventDetailRepository.php:150:        $qb = $this->buildSearchQuery($params)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventDetailRepository.php:310:     * @param array<string, mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventDetailRepository.php:312:    private function buildSearchQuery(array $params): QueryBuilder
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventDetailRepository.php:319:        if (isset($params['term'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventDetailRepository.php:320:            $term = $qb->expr()->literal('%'.$params['term'].'%');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventDetailRepository.php:326:        if (isset($params['from']) && !empty($params['from'])
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventDetailRepository.php:327:            && $from = \DateTime::createFromFormat(self::DATE_PICKER_FORMAT, $params['from'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventDetailRepository.php:331:        if (isset($params['to']) && !empty($params['to'])
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventDetailRepository.php:332:            && $to = \DateTime::createFromFormat(self::DATE_PICKER_FORMAT, $params['to'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventDetailRepository.php:336:        if (isset($params['formats'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventDetailRepository.php:338:                ->andWhere($qb->expr()->in('f.id', $params['formats']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventDetailRepository.php:340:        if (isset($params['isWeekday']) && !isset($params['isHoliday'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventDetailRepository.php:343:        if (!isset($params['isWeekday']) && isset($params['isHoliday'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventDetailRepository.php:346:        if (!isset($params['isPast']) || !$params['isPast']) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventDetailRepository.php:350:        if (isset($params['eventId'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventDetailRepository.php:351:            $qb->andWhere($qb->expr()->eq('d.eventId', $params['eventId']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventDetailRepository.php:353:        if (isset($params['entryFlg'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventDetailRepository.php:354:            $qb->andWhere($qb->expr()->eq('d.entryFlg', $params['entryFlg']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval.twig:3:{% set menus = ['product_stock', 'stock_move_transfer'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval.twig:59:                            {% include '@admin/Stock/stock_move_transfer_info.twig' with { StockMoveTransfer: StockMoveTransfer } %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval.twig:209:                {% include '@admin/Stock/stock_move_transfer_status_history.twig' with {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_inbound_approval.twig:219:                                    <a href="{{ url('admin_stock_move_transfer') }}" class="c-baseLink">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/return_list.twig:6:    <title>{{ 'admin.stock.move_transfer.return_list.pdf_title'|trans }}</title>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/return_list.twig:21:                            {{ 'admin.stock.move_transfer.return_list.title_per_supply'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/return_list.twig:23:                            {{ 'admin.stock.move_transfer.return_list.title_per_item'|trans }}{{ group.thresholdLabel }}）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:60:            matcher: function(params, data) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:61:                if (params.term && params.term.trim() !== '') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:62:                    if (data.text.toLowerCase().indexOf(params.term.trim().toLowerCase()) === -1) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/purchase_history_detail_net.twig:35:            <dt>{{ 'front.mypage.purchase_history.detail.col.transfer_date'|trans }}</dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/purchase_history_detail_net.twig:36:            <dd>{% if d.transferCompletedAt %}{{ d.transferCompletedAt|date('Y年m月d日') }}{% endif %}</dd>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/pick_list.twig:29:                            {{ 'admin.stock.move.pick_list.stock_move_transfer_id'|trans }}：{{ StockMoveTransfer.id }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:440:     * カード検索 API 用の一覧取得。クエリパラメータ ($params) を条件・並び順・ページネーションとして解釈し、
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:443:     * @param array<string, mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:447:    public function findBySearchParams(array $params): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:449:        $cacheKey = 'card_search:'.md5(json_encode($params) ?: '');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:465:        if (StringUtil::isNotBlank($params['name'] ?? null)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:466:            $texts = $this->splitSearchText((string) $params['name']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:467:            $condition = $params['name_condition'] ?? 'AND';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:479:        if (StringUtil::isNotBlank($params['text'] ?? null)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:480:            $texts = $this->splitSearchText((string) $params['text']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:481:            $condition = $params['text_condition'] ?? 'AND';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:493:        if (!empty($params['cardtype']) && is_array($params['cardtype'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:494:            $condition = $params['cardtype_condition'] ?? 'AND';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:495:            $where[] = $this->buildRelationCondition('dtb_card_cardtype', 'cardtype_id', $params['cardtype'], $condition, $sqlParams, $joinIndex, $joins);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:498:        if (!empty($params['subtype']) && is_array($params['subtype'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:499:            $condition = $params['subtype_condition'] ?? 'AND';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:500:            $where[] = $this->buildRelationCondition('dtb_card_subtype', 'subtype_id', $params['subtype'], $condition, $sqlParams, $joinIndex, $joins);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:503:        if (!empty($params['color']) && is_array($params['color'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:504:            $condition = $params['color_condition'] ?? 'AND';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:505:            $where[] = $this->buildRelationCondition('dtb_card_color', 'color_id', $params['color'], $condition, $sqlParams, $joinIndex, $joins);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:508:        if (!empty($params['exclude_color']) && is_array($params['exclude_color'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:510:            foreach ($params['exclude_color'] as $i => $v) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:518:        if (StringUtil::isNotBlank($params['format'] ?? null)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:520:            $sqlParams['format_id'] = (int) $params['format'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:522:            $illegalCondition = ($params['illegal_condition'] ?? 'false') === 'true';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:530:        if (!empty($params['rarity']) && is_array($params['rarity'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:531:            $condition = $params['rarity_condition'] ?? 'AND';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:532:            $where[] = $this->buildRelationCondition('mtb_card_detail', 'rarity_id', $params['rarity'], $condition, $sqlParams, $joinIndex, $joins);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:535:        $this->addNumericRangeCondition($where, $sqlParams, $params, 'mana_value', 'c.cmc');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:536:        $this->addNumericRangeCondition($where, $sqlParams, $params, 'power', 'c.power', "c.power ~ '^-?[0-9]+(?:\\.[0-9]+)?$'");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:537:        $this->addNumericRangeCondition($where, $sqlParams, $params, 'toughness', 'c.toughness', "c.toughness ~ '^-?[0-9]+(?:\\.[0-9]+)?$'");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:538:        $this->addNumericRangeCondition($where, $sqlParams, $params, 'loyalty', 'c.loyalty', "c.loyalty ~ '^-?[0-9]+(?:\\.[0-9]+)?$'");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:546:        $sortColumn = self::SORT_MAP[$params['sort'] ?? 'color'] ?? self::SORT_MAP['color'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:547:        $order = ($params['order'] ?? 'asc') === 'desc' ? 'DESC' : 'ASC';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:548:        $perPage = max(1, min((int) ($params['per_page'] ?? 20), self::MAX_PER_PAGE));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:549:        $page = max((int) ($params['page'] ?? 1), 1);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:554:        if (!empty($params['name_match_priority']) && $params['name_match_priority'] !== 'false' && StringUtil::isNotBlank($params['name'] ?? null)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:557:            $sqlParams['exact_name'] = $params['name'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:709:     * @param array<string, mixed> $params
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:711:    private function addNumericRangeCondition(array &$where, array &$sqlParams, array $params, string $name, string $dbColumn, ?string $numericGuard = null): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:714:        if (StringUtil::isNotBlank($params["{$name}_from"] ?? null)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:715:            $fromVal = is_array($params["{$name}_from"]) ? $params["{$name}_from"][0] : $params["{$name}_from"];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:719:        if (StringUtil::isNotBlank($params["{$name}_to"] ?? null)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:720:            $toVal = is_array($params["{$name}_to"]) ? $params["{$name}_to"][0] : $params["{$name}_to"];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:724:        if (StringUtil::isNotBlank($params[$name] ?? null)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:725:            $values = is_array($params[$name]) ? $params[$name] : [$params[$name]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:734:        if (StringUtil::isNotBlank($params["exclude_{$name}"] ?? null)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:735:            $values = is_array($params["exclude_{$name}"]) ? $params["exclude_{$name}"] : [$params["exclude_{$name}"]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:965:        $params = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:977:            $params['languageIds'] = $filters['languageIds'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:981:            $params['conditionIds'] = $filters['conditionIds'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:985:            $params['foilFlgs'] = $filters['foilFlgs'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:1033:        $rows = $conn->executeQuery($sql, $params, $types)->fetchAllAssociative();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:6:{% block sub_title %}{{ 'admin.stock.transfer.approval.subtitle'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:11:            const $form = $('#transfer_approval_form');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:12:            const $modeInput = $('#transfer_approval_mode');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:14:            $('#transfer_approval_reject_btn').on('click', function(e) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:22:            $('#transfer_approval_approve_btn').on('click', function(e) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:55:                            {% include '@admin/Stock/stock_transfer_info.twig' with { StockMoveTransfer: StockMoveTransfer } %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:60:                                            <label class="fw-bold">{{ 'admin.stock.transfer.store'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:70:                                            <label class="fw-bold">{{ 'admin.stock.transfer.stock_division'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:87:                                <span class="card-title align-middle fw-bold">{{ 'admin.stock.transfer.details_card_title'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:97:                                        <th class="pt-2 pb-2 ps-3" colspan="5">{{ 'admin.stock.transfer.source'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:98:                                        <th class="pt-2 pb-2" colspan="5">{{ 'admin.stock.transfer.dest'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:99:                                        <th class="pt-2 pb-2 pe-3">{{ 'admin.stock.transfer.quantity'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:102:                                        <th class="pt-2 pb-2 ps-3">{{ 'admin.stock.transfer.product_name_code'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:107:                                        <th class="pt-2 pb-2 ps-3">{{ 'admin.stock.transfer.product_name_code'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:112:                                        <th class="pt-2 pb-2 pe-3">{{ 'admin.stock.transfer.quantity'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:173:                    attr: { id: 'transfer_approval_form' }
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:175:                <input type="hidden" name="mode" id="transfer_approval_mode" value="">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:216:                {% include '@admin/Stock/stock_move_transfer_status_history.twig' with {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:226:                                    <a href="{{ url('admin_stock_move_transfer') }}" class="c-baseLink">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:228:                                        <span>{{ 'admin.stock.transfer.back_to_list'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:235:                                        <button type="button" class="btn btn-ec-delete px-4" id="transfer_approval_reject_btn">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:240:                                        <button type="button" class="btn btn-ec-conversion px-5" id="transfer_approval_approve_btn">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:258:                    <h5 class="modal-title fw-bold" id="rejectConfirmModalLabel">{{ 'admin.stock.transfer.confirm_modal_title'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:262:                    <p class="text-start">{{ 'admin.stock.transfer.confirm_modal_reject_message'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:266:                    <button type="button" class="btn btn-ec-delete px-4" id="reject_confirm_submit_btn">{{ 'admin.stock.transfer.confirm_modal_reject_button'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:277:                    <h5 class="modal-title fw-bold" id="approveConfirmModalLabel">{{ 'admin.stock.transfer.confirm_modal_title'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:281:                    <p class="text-start">{{ 'admin.stock.transfer.confirm_modal_approve_message'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:285:                    <button type="button" class="btn btn-ec-conversion px-5" id="approve_confirm_submit_btn">{{ 'admin.stock.transfer.confirm_modal_approve_button'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/deck_bulk_js.twig:52:                const params = {};
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/deck_bulk_js.twig:54:                    params[entry.name] = entry.value;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/deck_bulk_js.twig:60:                    data: params,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:3:{% set menus = ['product_stock', 'stock_move_transfer'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:5:{% block title %}{{ 'admin.stock.move_transfer.title'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:27:        #form_search_stock_move_transfer .form-select,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:28:        #form_search_stock_move_transfer .form-control {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:43:            const $fromBase = $('#admin_search_stock_move_transfer_move_from_base_info');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:44:            const $toBase = $('#admin_search_stock_move_transfer_move_to_base_info');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:48:            const $registeredDept = $('.js-move-transfer-registered-department');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:49:            const $registeredMembers = $('.js-move-transfer-registered-members');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:71:            const $fromApprovalDept = $('.js-move-transfer-from-approval-department');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:72:            const $fromApprovalMembers = $('.js-move-transfer-from-approval-members');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:94:            const $toApprovalDept = $('.js-move-transfer-to-approval-department');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:95:            const $toApprovalMembers = $('.js-move-transfer-to-approval-members');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:123:            const $moveTransferCheckAll = $('#move_transfer_check_all');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:124:            const moveTransferRowCheck = '.js-move-transfer-row-check';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:147:                    alert("{{ 'admin.stock.move_transfer.create_instruction.no_selection'|trans|e('js') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:152:                const $form = $('#form_stock_move_transfer_create_instruction');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:173:                    alert("{{ 'admin.stock.move_transfer.barcode_csv_export.no_selection'|trans|e('js') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:178:                const $form = $('#form_stock_move_transfer_barcode_csv');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:199:                    alert("{{ 'admin.stock.move_transfer.return_list_csv_export.no_selection'|trans|e('js') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:204:                const $form = $('#form_stock_move_transfer_return_list_csv');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:225:                    alert("{{ 'admin.stock.move_transfer.return_list_csv_export.no_selection'|trans|e('js') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:230:                const exportUrl = $('#form_stock_move_transfer_return_list_pdf').attr('action');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:237:                    'stock_move_transfer_return_list_pdf_' + String(Date.now()),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:242:                    alert("{{ 'admin.stock.move_transfer.return_list_pdf_export.popup_blocked'|trans|e('js') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:251:                const $form = $('#form_stock_move_transfer_return_list_pdf');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:286:                        alert("{{ 'admin.stock.move_transfer.return_list_pdf_export.fetch_failed'|trans|e('js') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:290:                        alert("{{ 'admin.stock.move_transfer.return_list_pdf_export.fetch_failed'|trans|e('js') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:325:            const $approvalDepartmentSelect = $('#stock_transfer_csv_import_approval_department');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:326:            const $approvalNotificationTargetMembersSelect = $('#stock_transfer_csv_import_approval_notification_target_members');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:327:            const $stockTransferTargetBaseSelect = $('#stock_transfer_csv_import_transfer_base_info');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:450:                const $form = $('#form_search_stock_move_transfer');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:485:                        <span class="card-title">{{ 'admin.stock.move_transfer.csv_file_registration'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:489:                            <button type="button" class="btn btn-ec-conversion" data-bs-toggle="modal" data-bs-target="#stockMoveCsvRegisterModal">{{ 'admin.stock.move_transfer.csv_register_move'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:490:                            <button type="button" class="btn btn-ec-conversion" data-bs-toggle="modal" data-bs-target="#stockTransferCsvRegisterModal">{{ 'admin.stock.move_transfer.csv_register_transfer'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:496:                    <form name="admin_search_stock_move_transfer" id="form_search_stock_move_transfer" method="post" action="{{ url('admin_stock_move_transfer') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:501:                                    <label class="form-label">{{ form_label(searchForm.stock_move_transfer_id) }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:502:                                    {{ form_widget(searchForm.stock_move_transfer_id) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:503:                                    {{ form_errors(searchForm.stock_move_transfer_id) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:542:                                    <label class="form-label">{{ form_label(searchForm.move_transfer_type) }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:543:                                    {{ form_widget(searchForm.move_transfer_type) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:544:                                    {{ form_errors(searchForm.move_transfer_type) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:547:                                    <label class="form-label">{{ form_label(searchForm.move_transfer_status) }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:548:                                    {{ form_widget(searchForm.move_transfer_status) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:549:                                    {{ form_errors(searchForm.move_transfer_status) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:572:                                    <label class="form-label">{{ 'admin.stock.move_transfer.outbound_approver'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:575:                                            {{ form_widget(searchForm.move_from_approval_department, {'attr': {'class': 'form-select form-select-sm js-move-transfer-from-approval-department'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:579:                                            {{ form_widget(searchForm.move_from_approval_member, {'attr': {'class': 'form-select form-select-sm js-move-transfer-from-approval-members'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:587:                                    <label class="form-label">{{ 'admin.stock.move_transfer.registrant'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:590:                                            {{ form_widget(searchForm.registered_department, {'attr': {'class': 'form-select form-select-sm js-move-transfer-registered-department'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:594:                                            {{ form_widget(searchForm.registered_member, {'attr': {'class': 'form-select form-select-sm js-move-transfer-registered-members'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:600:                                    <label class="form-label">{{ 'admin.stock.move_transfer.move_from_stock_date'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:611:                                    <label class="form-label">{{ 'admin.stock.move_transfer.inbound_approver'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:614:                                            {{ form_widget(searchForm.move_to_approval_department, {'attr': {'class': 'form-select form-select-sm js-move-transfer-to-approval-department'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:618:                                            {{ form_widget(searchForm.move_to_approval_member, {'attr': {'class': 'form-select form-select-sm js-move-transfer-to-approval-members'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:626:                                    <label class="form-label">{{ 'admin.stock.move_transfer.move_to_stock_date'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:651:                            <button type="button" class="btn btn-ec-conversion" id="stockMoveTransferCreateInstruction">{{ 'admin.stock.move_transfer.action_create_instruction'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:652:                            <button type="button" class="btn btn-ec-conversion" id="stockMoveTransferBarcodeCsvExport">{{ 'admin.stock.move_transfer.action_barcode_csv_export'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:653:                            <a href="{{ path('admin_stock_move_transfer_csv_export') }}" class="btn btn-ec-conversion">{{ 'admin.stock.move_transfer.action_move_transfer_csv_export'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:654:                            <button type="button" class="btn btn-ec-conversion" id="stockMoveTransferReturnListCsvExport">{{ 'admin.stock.move_transfer.action_return_list_csv_export'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:655:                            <button type="button" class="btn btn-ec-conversion" id="stockMoveTransferReturnListPdfExport">{{ 'admin.stock.move_transfer.action_return_list_pdf_export'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:667:                                            <option {% if pageMax.name == page_count %}selected=""{% endif %} value="{{ path('admin_stock_move_transfer_page', {'page_no': 1, 'page_count': pageMax.name}) }}">{{ 'admin.common.count'|trans({ '%count%': pageMax.name }) }}</option>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:679:                                            <input type="checkbox" id="move_transfer_check_all" class="form-check-input" aria-label="{{ 'admin.common.select_all'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:682:                                            <span class="d-block small">{{ 'admin.stock.move_transfer.stock_move_transfer_id'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:683:                                            <span class="d-block small">{{ 'admin.stock.move_transfer.move_instruction_list_id'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:686:                                            <span class="d-block small">{{ 'admin.stock.move_transfer.move_type'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:689:                                            <span class="d-block small">{{ 'admin.stock.move_transfer.move_from_base_info'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:693:                                            <span class="d-block small">{{ 'admin.stock.move_transfer.move_to_base_info'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:701:                                            <span class="d-block small">{{ 'admin.stock.move_transfer.move_transfer_status'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:708:                                            <span class="d-block small">{{ 'admin.stock.move_transfer.registrant'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:718:                                                <input type="checkbox" name="ids[]" value="{{ stockMoveTransfer.id }}" class="form-check-input js-move-transfer-row-check" aria-label="{{ 'admin.common.select'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:727:                                                        <a href="{{ path('admin_stock_transfer', { id: stockMoveTransfer.id }) }}" target="_blank" rel="noopener noreferrer">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:748:                                                    {{ 'admin.stock.move.type_transfer'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:780:                                        {% include "@admin/pager.twig" with { 'pages' : pagination.paginationData, 'routes' : 'admin_stock_move_transfer_page' } %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:804:                    <h5 class="modal-title fw-bold" id="stockMoveCsvRegisterModalLabel">{{ 'admin.stock.move_transfer.csv_register_move'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:809:                        action: path('admin_stock_move_transfer_move_csv_import'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:815:                                    {{ 'admin.stock.move_transfer.move_from_base_info'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:822:                                    {{ 'admin.stock.move_transfer.move_to_base_info'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:831:                                    {{ 'admin.stock.move_transfer.csv_move_modal.move_from_stock_location'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:838:                                    {{ 'admin.stock.move_transfer.csv_move_modal.move_to_stock_location'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:847:                                <span class="text-muted small ms-1">{{ 'admin.stock.move_transfer.csv_move_modal.file_row_limit_hint'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:865:                        <a class="btn btn-ec-regular" href="{{ path('admin_stock_move_transfer_move_csv_template') }}">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:873:                            <td class="align-middle">{{ 'admin.stock.move_transfer.csv_move_modal.col_product_code_hint'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:879:                            <td class="align-middle">{{ 'admin.stock.move_transfer.csv_move_modal.col_move_quantity_hint'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:892:    <div class="modal fade stock-transfer-csv-modal" id="stockTransferCsvRegisterModal" tabindex="-1" aria-labelledby="stockTransferCsvRegisterModalLabel" aria-hidden="true">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:896:                    <h5 class="modal-title fw-bold" id="stockTransferCsvRegisterModalLabel">{{ 'admin.stock.move_transfer.csv_register_transfer'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:901:                        action: path('admin_stock_move_transfer_transfer_csv_import'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:906:                                <label class="form-label" for="{{ stockTransferCsvImportForm.transfer_base_info.vars.id }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:907:                                    {{ 'admin.stock.move_transfer.csv_transfer_modal.store'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:909:                                {{ form_widget(stockTransferCsvImportForm.transfer_base_info, {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:917:                                    {{ 'admin.stock.move_transfer.csv_transfer_modal.transfer_from_stock_location'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:921:                                        {{ form_widget(stockTransferCsvImportForm.transfer_stock_location_id) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:922:                                        {{ form_errors(stockTransferCsvImportForm.transfer_stock_location_id) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:933:                                    <label class="form-label" for="{{ stockTransferCsvImportForm.approval_department.vars.id }}">{{ 'admin.stock.move_transfer.department'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:937:                                    <label class="form-label" for="{{ stockTransferCsvImportForm.approval_notification_target_members.vars.id }}">{{ 'admin.stock.move_transfer.csv_transfer_modal.member'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:945:                                <span class="text-muted small ms-1">{{ 'admin.stock.move_transfer.csv_move_modal.file_row_limit_hint'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:962:                        <a class="btn btn-ec-regular" href="{{ path('admin_stock_move_transfer_transfer_csv_template') }}">{{ 'admin.common.csv_skeleton_download'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:968:                                {{ 'admin.stock.move_transfer.csv_transfer_modal.col_src_product_code'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:970:                            <td class="align-middle">{{ 'admin.stock.move_transfer.csv_transfer_modal.col_src_product_code_hint'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:974:                                {{ 'admin.stock.move_transfer.csv_transfer_modal.col_dest_product_code'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:976:                            <td class="align-middle">{{ 'admin.stock.move_transfer.csv_transfer_modal.col_dest_product_code_hint'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:980:                                {{ 'admin.stock.move_transfer.csv_transfer_modal.col_transfer_quantity'|trans }}<span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:982:                            <td class="align-middle">{{ 'admin.stock.move_transfer.csv_transfer_modal.col_transfer_quantity_hint'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:994:    <form id="form_stock_move_transfer_create_instruction" method="post" action="{{ url('admin_stock_move_transfer_create_instruction') }}" class="d-none">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:997:    <form id="form_stock_move_transfer_barcode_csv" method="post" action="{{ url('admin_stock_move_transfer_barcode_csv_export') }}" class="d-none">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:1000:    <form id="form_stock_move_transfer_return_list_csv" method="post" action="{{ url('admin_stock_move_transfer_return_list_csv_export') }}" class="d-none">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:1003:    <form id="form_stock_move_transfer_return_list_pdf" method="post" action="{{ url('admin_stock_move_transfer_return_list_pdf_export') }}" class="d-none">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/tenant/detail.twig:284:                                    <span>{{ 'admin.setting.shop.shop.shop_branch_url'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/header_search_unisuggest_js.twig:78:            const params = [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/header_search_unisuggest_js.twig:81:                params.push('uid=' + encodeURIComponent(uid));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/header_search_unisuggest_js.twig:84:                params.push('loginid=' + encodeURIComponent(hashedLoginId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/header_search_unisuggest_js.twig:86:            return params;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/header_search_unisuggest_js.twig:93:            const params = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/header_search_unisuggest_js.twig:102:                params.push('fq.cardset=' + encodeURIComponent(cardsetId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/header_search_unisuggest_js.twig:104:            params.push(...buildAuthParams());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/header_search_unisuggest_js.twig:107:                url: unisuggestApiUrl + '?' + params.join('&'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/header_search_unisuggest_js.twig:250:        function fetchProducts(params) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/header_search_unisuggest_js.twig:259:            if (typeof params.kw === 'string' && params.kw !== '') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/header_search_unisuggest_js.twig:260:                query.push('kw=' + encodeURIComponent(params.kw));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/header_search_unisuggest_js.twig:261:            } else if (typeof params.cardset === 'string' && params.cardset !== '') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/header_search_unisuggest_js.twig:262:                query.push('fq.cardset=' + encodeURIComponent(params.cardset));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/header_search_unisuggest_js.twig:342:            const params = [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/header_search_unisuggest_js.twig:344:                params.push('q=' + encodeURIComponent(word));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/header_search_unisuggest_js.twig:346:            params.push(...buildAuthParams());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/header_search_unisuggest_js.twig:351:                url: unisuggestDeleteApiUrl + (params.length > 0 ? ('?' + params.join('&')) : ''),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/header_search_unisuggest_js.twig:519:                const params = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/header_search_unisuggest_js.twig:526:                params.push(...buildAuthParams());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/header_search_unisuggest_js.twig:528:                    url: unisuggestApiUrl + '?' + params.join('&'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/product_search_js.twig:4:        function prefixMatch(params, data) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/product_search_js.twig:5:            params.term = params.term || '';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/product_search_js.twig:6:            if (data.text.toUpperCase().indexOf(params.term.toUpperCase()) == 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/product_search_js.twig:31:            matcher: function(params, data) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/product_search_js.twig:32:                return prefixMatch(params, data);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_promo.twig:11:<div class="p-hareruya-branch-top__promo">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_promo.twig:13:    <div class="p-hareruya-branch-top__promo-cards{% if not isBranchShopFront %} p-hareruya-branch-top__promo-cards--center{% endif %}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_promo.twig:15:      <div class="p-hareruya-branch-top__promo-card">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_promo.twig:16:        <div class="p-hareruya-branch-top__promo-card-content">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_promo.twig:17:          <div class="p-hareruya-branch-top__promo-card-header">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_promo.twig:18:            <div class="p-hareruya-branch-top__promo-card-icon">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_promo.twig:19:              <img class="p-hareruya-branch-top__promo-card-icon-img" src="{{ asset('assets/hareruya/img/share/icon-x.webp') }}" alt="X" width="32" height="32" decoding="async" loading="lazy">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_promo.twig:21:            <span class="p-hareruya-branch-top__promo-card-title">{{ 'shop_top.promo.x_title'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_promo.twig:23:          <p class="p-hareruya-branch-top__promo-card-desc">{{ 'shop_top.promo.x_desc'|trans({ '%shop_name%': app.request.locale == 'en' ? (Shop.shopNameEng ?? Shop.shopName) : Shop.shopName }) }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_promo.twig:25:        <a class="p-hareruya-branch-top__promo-card-qr" href="{{ Shop.xAccountUrl }}" target="_blank" rel="noopener noreferrer">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_promo.twig:26:          <img class="p-hareruya-branch-top__promo-card-qr-img" src="{{ xAccountQrDataUri }}" alt="{{ 'shop_top.promo.x_qr_alt'|trans({ '%shop_name%': app.request.locale == 'en' ? (Shop.shopNameEng ?? Shop.shopName) : Shop.shopName }) }}" width="105" height="105" decoding="async" loading="lazy">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_promo.twig:31:      <div class="p-hareruya-branch-top__promo-card p-hareruya-branch-top__promo-card--primary">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_promo.twig:32:        <div class="p-hareruya-branch-top__promo-card-content">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_promo.twig:33:          <div class="p-hareruya-branch-top__promo-card-header">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_promo.twig:34:            <div class="p-hareruya-branch-top__promo-card-icon">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_promo.twig:35:              <img class="p-hareruya-branch-top__promo-card-icon-img" src="{{ asset('assets/hareruya/img/branch/icon-keep.webp') }}" alt="KEEP" width="39" height="39" decoding="async" loading="lazy">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_promo.twig:37:            <span class="p-hareruya-branch-top__promo-card-title">{{ 'shop_top.promo.keep_title'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_promo.twig:39:          <p class="p-hareruya-branch-top__promo-card-desc">{{ 'shop_top.promo.keep_desc'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_promo.twig:41:        <a class="p-hareruya-branch-top__promo-card-qr" href="{{ shopTopUrl }}" target="_blank" rel="noopener noreferrer">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_promo.twig:42:          <img class="p-hareruya-branch-top__promo-card-qr-img" src="{{ shopTopQrDataUri }}" alt="{{ 'shop_top.promo.keep_qr_alt'|trans({ '%shop_name%': app.request.locale == 'en' ? (Shop.shopNameEng ?? Shop.shopName) : Shop.shopName }) }}" width="105" height="105" decoding="async" loading="lazy">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/_product_list_breadcrumb_items.twig:11:        {% set product_list_crumb_route_params = { purchaseFlg: true } %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/_product_list_breadcrumb_items.twig:16:        {% set product_list_crumb_route_params = {} %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/_product_list_breadcrumb_items.twig:47:        {{ hareruya_breadcrumb.link_li(url(product_list_crumb_route_name, product_list_crumb_route_params|merge({ category_id: Path.id })), path_crumb_label, 2 + loop.index) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/_product_list_breadcrumb_items.twig:62:                {{ hareruya_breadcrumb.link_li(url(product_list_crumb_route_name, product_list_crumb_route_params|merge({ category_id: Path.id })), path_crumb_label, 1 + loop.index) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/product_unisearch_js.twig:578:        const params = queryString.split("&");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/product_unisearch_js.twig:581:        for (const param of params) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:11:<section class="p-hareruya-section p-hareruya-branch-top__recommend">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:16:    <ul class="p-hareruya-branch-top__recommend-list">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:17:      <li class="p-hareruya-branch-top__recommend-item">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:18:        <a class="p-hareruya-branch-top__recommend-link" href="#">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:19:          <div class="p-hareruya-branch-top__recommend-img-wrap">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:20:            <img class="p-hareruya-branch-top__recommend-img" src="{{ asset('assets/hareruya/img/branch/top-category-banner01.webp') }}" alt="{{ 'shop_top.recommend.label.standard'|trans }}" width="384" height="131" decoding="async" loading="lazy">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:22:          <div class="p-hareruya-branch-top__recommend-label">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:23:            <span class="p-hareruya-branch-top__recommend-label-text">{{ 'shop_top.recommend.label.standard'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:27:      <li class="p-hareruya-branch-top__recommend-item">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:28:        <a class="p-hareruya-branch-top__recommend-link" href="#">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:29:          <div class="p-hareruya-branch-top__recommend-img-wrap">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:30:            <img class="p-hareruya-branch-top__recommend-img" src="{{ asset('assets/hareruya/img/branch/top-category-banner02.webp') }}" alt="{{ 'shop_top.recommend.label.pioneer'|trans }}" width="384" height="131" decoding="async" loading="lazy">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:32:          <div class="p-hareruya-branch-top__recommend-label">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:33:            <span class="p-hareruya-branch-top__recommend-label-text">{{ 'shop_top.recommend.label.pioneer'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:37:      <li class="p-hareruya-branch-top__recommend-item">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:38:        <a class="p-hareruya-branch-top__recommend-link" href="#">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:39:          <div class="p-hareruya-branch-top__recommend-img-wrap">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:40:            <img class="p-hareruya-branch-top__recommend-img" src="{{ asset('assets/hareruya/img/branch/top-category-banner03.webp') }}" alt="{{ 'shop_top.recommend.label.modern'|trans }}" width="384" height="131" decoding="async" loading="lazy">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:42:          <div class="p-hareruya-branch-top__recommend-label">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:43:            <span class="p-hareruya-branch-top__recommend-label-text">{{ 'shop_top.recommend.label.modern'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:47:      <li class="p-hareruya-branch-top__recommend-item">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:48:        <a class="p-hareruya-branch-top__recommend-link" href="#">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:49:          <div class="p-hareruya-branch-top__recommend-img-wrap">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:50:            <img class="p-hareruya-branch-top__recommend-img" src="{{ asset('assets/hareruya/img/branch/top-category-banner04.webp') }}" alt="{{ 'shop_top.recommend.label.legacy'|trans }}" width="384" height="131" decoding="async" loading="lazy">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:52:          <div class="p-hareruya-branch-top__recommend-label">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:53:            <span class="p-hareruya-branch-top__recommend-label-text">{{ 'shop_top.recommend.label.legacy'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:57:      <li class="p-hareruya-branch-top__recommend-item">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:58:        <a class="p-hareruya-branch-top__recommend-link" href="#">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:59:          <div class="p-hareruya-branch-top__recommend-img-wrap">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:60:            <img class="p-hareruya-branch-top__recommend-img" src="{{ asset('assets/hareruya/img/branch/top-category-banner05.webp') }}" alt="{{ 'shop_top.recommend.label.commander'|trans }}" width="384" height="131" decoding="async" loading="lazy">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:62:          <div class="p-hareruya-branch-top__recommend-label">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:63:            <span class="p-hareruya-branch-top__recommend-label-text">{{ 'shop_top.recommend.label.commander'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:67:      <li class="p-hareruya-branch-top__recommend-item">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:68:        <a class="p-hareruya-branch-top__recommend-link" href="#">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:69:          <div class="p-hareruya-branch-top__recommend-img-wrap">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:70:            <img class="p-hareruya-branch-top__recommend-img" src="{{ asset('assets/hareruya/img/branch/top-category-banner06.webp') }}" alt="{{ 'shop_top.recommend.label.promo'|trans }}" width="384" height="131" decoding="async" loading="lazy">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:72:          <div class="p-hareruya-branch-top__recommend-label">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recommend.twig:73:            <span class="p-hareruya-branch-top__recommend-label-text">{{ 'shop_top.recommend.label.promo'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:180:                                                {# EC かつ本店の場合のみ表示（支店は非表示） #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/_product_search_form_fields.twig:13:                    <input class="c-hareruya-form-input__field branch_search_keyword" id="{{ f.product.vars.id }}" type="text" placeholder="{{ 'form.product.empty_value'|trans }}" autocomplete="off" maxlength="255" name="{{ f.product.vars.full_name }}" value="{{ f.product.vars.data ?? '' }}" data-search-keyword-input>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_item_list.twig:11:<section class="p-hareruya-section p-hareruya-branch-top__item-list">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_item_list.twig:14:      <div class="p-hareruya-feature-grid__item p-hareruya-branch-top__item-banner">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_item_list.twig:16:        {% set bannerImage = banner.image|default('') != '' ? asset(banner.image, 'save_image') : asset('assets/hareruya/img/branch/top-category-list-banner01.webp') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_item_list.twig:18:          <a class="p-hareruya-branch-top__item-banner-link" href="{{ bannerUrl }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_item_list.twig:19:            <img class="p-hareruya-branch-top__item-banner-img" src="{{ bannerImage }}" alt="{{ 'shop_top.banner.item_list_alt'|trans }}" width="573" height="389" decoding="async" loading="lazy">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_item_list.twig:22:          <img class="p-hareruya-branch-top__item-banner-img" src="{{ bannerImage }}" alt="{{ 'shop_top.banner.item_list_alt'|trans }}" width="573" height="389" decoding="async" loading="lazy">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_item_list.twig:53:      <div class="p-hareruya-feature-grid__item p-hareruya-branch-top__item-banners">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_item_list.twig:54:        <a class="p-hareruya-branch-top__item-banners-link" href="{{ Shop.restockFormUrl|default('#') }}"{% if Shop.restockFormUrl %} target="_blank" rel="noopener noreferrer"{% endif %}>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_item_list.twig:55:          <img class="p-hareruya-branch-top__item-banners-img" src="{{ asset('assets/hareruya/img/share/banner-order.webp') }}" alt="{{ 'shop_top.banner.restock_alt'|trans }}" width="573" height="117" decoding="async" loading="lazy">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_item_list.twig:57:        <a class="p-hareruya-branch-top__item-banners-link" href="{{ url('purchase_index', {_shop: ''}) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_item_list.twig:58:          <img class="p-hareruya-branch-top__item-banners-img" src="{{ asset('assets/hareruya/img/share/banner-purchase.webp') }}" alt="{{ 'shop_top.banner.purchase_alt'|trans }}" width="573" height="117" decoding="async" loading="lazy">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/footer.twig:13:    {{ include('Block/branch_footer.twig') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recruit.twig:11:<div class="p-hareruya-branch-top__recruit">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recruit.twig:13:    <a class="p-hareruya-branch-top__recruit-banner" href="https://corp.hareruyamtg.com/recruit" target="_blank" rel="noopener noreferrer">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/shop_recruit.twig:14:      <img class="p-hareruya-branch-top__recruit-banner-img" src="{{ asset('assets/hareruya/img/share/img_251217_hareruya_recruit.webp') }}" alt="{{ 'shop_top.recruit.alt'|trans }}" width="486" height="165" decoding="async" loading="lazy">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/header.twig:13:    {{ include('Block/branch_header.twig') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/header.twig:104:                            <a class="p-hareruya-header__nav-link" href="{{ url(app.request.attributes.get('_route') ?: 'homepage', app.request.attributes.get('_route_params')|default({})|merge({_locale: switchLocale})) }}" aria-label="{{ 'front.nav.lang.aria_label'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/header.twig:116:                    <a class="p-hareruya-header__lang-btn" href="{{ url(app.request.attributes.get('_route') ?: 'homepage', app.request.attributes.get('_route_params')|default({})|merge({_locale: switchLocale})) }}" aria-label="{{ 'front.nav.lang.aria_label'|trans }}">

codex
広域検索では支店転送らしき専用処理は出ていませんが、出力が大きいのでSmaregi配下とMessageHandlerに絞り直します。あわせて「見落とし」がないか、後段処理が設計の通常/取消/打消とどう違うかを確認します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiWebhookEventMessageHandler.php | sed -n '1,260p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\MessageHandler;
    17	
    18	use Doctrine\ORM\EntityManagerInterface;
    19	use Eccube\Entity\MessengerJob;
    20	use Eccube\Entity\SmaregiWebhookEvent;
    21	use Eccube\Message\SmaregiWebhookEventMessage;
    22	use Eccube\Repository\SmaregiWebhookEventRepository;
    23	use Eccube\Service\Smaregi\Webhook\Stock\StockEventDispatcher;
    24	use Eccube\Service\Smaregi\Webhook\Transaction\TransactionEventDispatcher;
    25	use Psr\Log\LoggerInterface;
    26	use Symfony\Component\Messenger\Attribute\AsMessageHandler;
    27	
    28	/**
    29	 * Webhook 全体の親 MessengerJob として動作する Handler。
    30	 *
    31	 * 本ジョブはWebhookイベントを受け取り、そのイベントとアクションに応じた子ジョブをディスパッチする。
    32	 */
    33	#[AsMessageHandler]
    34	final readonly class SmaregiWebhookEventMessageHandler
    35	{
    36	    public function __construct(
    37	        private LoggerInterface $logger,
    38	        private EntityManagerInterface $entityManager,
    39	        private SmaregiWebhookEventRepository $smaregiWebhookEventRepository,
    40	        private TransactionEventDispatcher $transactionEventDispatcher,
    41	        private StockEventDispatcher $stockEventDispatcher,
    42	    ) {
    43	    }
    44	
    45	    public function __invoke(SmaregiWebhookEventMessage $message): void
    46	    {
    47	        $Event = $this->smaregiWebhookEventRepository->find($message->getSmaregiWebhookEventId());
    48	        if ($Event === null) {
    49	            $this->logger->error('Smaregi webhook event not found');
    50	
    51	            return;
    52	        }
    53	
    54	        $Event->setStatus(SmaregiWebhookEvent::STATUS_PROCESSING);
    55	        $Event->setStartedAt(new \DateTime());
    56	
    57	        // Webhook イベント全体を可視化する親 MessengerJob を 1 件作成。
    58	        // 配下の transactionHeadId ごとの子ジョブはここで発番した id を parent_job_id に持つ。
    59	        $parentJob = (new MessengerJob())
    60	            ->setMessageClass(SmaregiWebhookEventMessage::class)
    61	            ->setStatus(MessengerJob::STATUS_PROCESSING)
    62	            ->setStartedAt(new \DateTime())
    63	            ->setPayloadSummary(sprintf(
    64	                'webhookEventId=%d event=%s action=%s',
    65	                (int) $Event->getId(),
    66	                (string) $Event->getEvent(),
    67	                (string) $Event->getAction(),
    68	            ));
    69	        // Event の PROCESSING 遷移・親ジョブ INSERT・親ジョブ ID 逆書きを同一トランザクションで確定し、
    70	        // commit 成功後に子ジョブを dispatch する。途中で失敗した場合は rollback して PENDING のまま
    71	        // retry させ、Event が PROCESSING のまま取り残されたり親ジョブが孤児化するのを防ぐ。
    72	        $this->entityManager->beginTransaction();
    73	        try {
    74	            $this->entityManager->persist($parentJob);
    75	            $this->entityManager->flush();
    76	
    77	            // 管理画面 (Webhook 詳細 → ジョブ詳細) からの遷移用に Webhook 側へ親ジョブ ID を逆書き
    78	            $Event->setMessengerJobId($parentJob->getId());
    79	            $this->entityManager->flush();
    80	
    81	            $this->entityManager->commit();
    82	        } catch (\Throwable $e) {
    83	            if ($this->entityManager->getConnection()->isTransactionActive()) {
    84	                $this->entityManager->rollback();
    85	            }
    86	            $this->logger->error('Failed to begin Smaregi webhook parent job', [
    87	                'eventId' => $Event->getId(),
    88	                'error' => $e->getMessage(),
    89	            ]);
    90	
    91	            throw $e;
    92	        }
    93	
    94	        try {
    95	            // 各ディスパッチャは自身が扱う event 種別以外を自己フィルタして return するため、
    96	            // event の種別判定はここで分岐させず、関係する全ディスパッチャへ順に渡す。
    97	            $this->transactionEventDispatcher->dispatch($Event, $parentJob->getId());
    98	            $this->stockEventDispatcher->dispatch($Event, $parentJob->getId());
    99	
   100	            $this->logger->info('Smaregi webhook event handled', [
   101	                'eventId' => $Event->getId(),
   102	                'parentJobId' => $parentJob->getId(),
   103	            ]);
   104	            $Event->setStatus(SmaregiWebhookEvent::STATUS_COMPLETED);
   105	            $Event->setCompletedAt(new \DateTime());
   106	            $parentJob->setStatus(MessengerJob::STATUS_COMPLETED);
   107	            $parentJob->setCompletedAt(new \DateTime());
   108	            $this->entityManager->flush();
   109	        } catch (\Throwable $e) {
   110	            $this->logger->warning('Smaregi webhook event failed', [
   111	                'eventId' => $Event->getId(),
   112	                'parentJobId' => $parentJob->getId(),
   113	                'error' => $e->getMessage(),
   114	                'trace' => $e->getTraceAsString(),
   115	            ]);
   116	            try {
   117	                $Event->setStatus(SmaregiWebhookEvent::STATUS_FAILED);
   118	                $Event->setCompletedAt(new \DateTime());
   119	                $parentJob->setStatus(MessengerJob::STATUS_FAILED);
   120	                $parentJob->setCompletedAt(new \DateTime());
   121	                $parentJob->setErrorMessage($e->getMessage());
   122	                $this->entityManager->flush();
   123	            } catch (\Throwable $persistError) {
   124	                $this->logger->error('Failed to persist Smaregi webhook event failure state', [
   125	                    'eventId' => $Event->getId(),
   126	                    'parentJobId' => $parentJob->getId(),
   127	                    'error' => $persistError->getMessage(),
   128	                ]);
   129	            }
   130	
   131	            throw $e;
   132	        }
   133	    }
   134	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php | sed -n '1,460p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\MessageHandler;
    17	
    18	use Doctrine\ORM\EntityManagerInterface;
    19	use Eccube\Dto\Smaregi\Api\Transaction\TransactionDto;
    20	use Eccube\Entity\MessengerJob;
    21	use Eccube\Entity\Order;
    22	use Eccube\Entity\SmaregiTransactionJob;
    23	use Eccube\Entity\SmaregiWebhookEvent;
    24	use Eccube\Message\SmaregiTransactionProcessMessage;
    25	use Eccube\Repository\MessengerJobRepository;
    26	use Eccube\Repository\SmaregiTransactionJobRepository;
    27	use Eccube\Repository\SmaregiWebhookEventRepository;
    28	use Eccube\Service\Smaregi\Api\SmaregiAccessTokenService;
    29	use Eccube\Service\Smaregi\Api\SmaregiMessengerJobContext;
    30	use Eccube\Service\Smaregi\Api\SmaregiTransactionApiClient;
    31	use Eccube\Service\Smaregi\SmaregiMessengerJobProcessingLock;
    32	use Eccube\Service\Smaregi\Webhook\Transaction\Handler\CanceledHandler;
    33	use Eccube\Service\Smaregi\Webhook\Transaction\Handler\CreatedHandler;
    34	use Eccube\Service\Smaregi\Webhook\Transaction\Handler\DisposedHandler;
    35	use Eccube\Service\Smaregi\Webhook\Transaction\Handler\Pattern\EccubeOtcPatternHandler;
    36	use Eccube\Service\Smaregi\Webhook\Transaction\Handler\Pattern\EccubeSmoothOtcPatternHandler;
    37	use Eccube\Service\Smaregi\Webhook\Transaction\Handler\Pattern\OtcGuestPatternHandler;
    38	use Eccube\Service\Smaregi\Webhook\Transaction\Handler\Pattern\OtcMemberPatternHandler;
    39	use Eccube\Service\Smaregi\Webhook\Transaction\Processor\SmaregiTransactionCanceledProcessor;
    40	use Eccube\Service\Smaregi\Webhook\Transaction\Processor\SmaregiTransactionDisposedProcessor;
    41	use Eccube\Service\Smaregi\Webhook\Transaction\PurchasePattern;
    42	use Eccube\Service\Smaregi\Webhook\Transaction\PurchasePatternContext;
    43	use Eccube\Service\Smaregi\Webhook\Transaction\PurchasePatternContextBuilder;
    44	use Eccube\Service\Smaregi\Webhook\Transaction\PurchasePatternResolver;
    45	use Eccube\Service\Smaregi\Webhook\Transaction\SmaregiOrderPointApplier;
    46	use Eccube\Service\Smaregi\Webhook\Transaction\SmaregiPointAdjustmentApplier;
    47	use Eccube\Service\Smaregi\Webhook\Transaction\SmaregiPointAdjustmentReverter;
    48	use Psr\Log\LoggerInterface;
    49	use Symfony\Component\Messenger\Attribute\AsMessageHandler;
    50	
    51	/**
    52	 * スマレジ取引取得 + action 別処理を 1 子ジョブとして消化する MessageHandler。
    53	 *
    54	 * 親ジョブ ({@see SmaregiWebhookEventMessageHandler}) は SmaregiWebhookEvent 単位での
    55	 * 受信状態を管理し、本ハンドラは transactionHeadId 単位の処理状態を MessengerJob として管理する。
    56	 *
    57	 * 主な責務:
    58	 *  1. 子 MessengerJob を {@see SmaregiMessengerJobProcessingLock} で悲観ロック + 状態遷移
    59	 *     (PENDING/FAILED → PROCESSING、COMPLETED は skip)
    60	 *  2. スマレジ取引取得 API 呼出
    61	 *  3. updateDateTime ベースの dedup ({@see SmaregiTransactionJobRepository::findLatestCompletedByTransaction()})
    62	 *     により、同一 (transactionHeadId, action) で過去に完了した updateDateTime 以下のリクエストを skip
    63	 *  4. action ('created' / 'canceled' / 'disposed') 別に Pattern Handler / Processor を実行
    64	 *  5. 処理結果を {@see SmaregiTransactionJob} に保存 (updateDateTime と共に)
    65	 *
    66	 * TODO: edited / bulk-* も同パターンで子ジョブ化する
    67	 * TODO: webhook 到着順序が逆転して対応 Order が無い canceled/disposed の救済
    68	 */
    69	#[AsMessageHandler]
    70	final readonly class SmaregiTransactionProcessMessageHandler
    71	{
    72	    public function __construct(
    73	        private LoggerInterface $logger,
    74	        private EntityManagerInterface $entityManager,
    75	        private SmaregiMessengerJobProcessingLock $smaregiMessengerJobProcessingLock,
    76	        private MessengerJobRepository $messengerJobRepository,
    77	        private SmaregiWebhookEventRepository $smaregiWebhookEventRepository,
    78	        private SmaregiTransactionJobRepository $smaregiTransactionJobRepository,
    79	        private SmaregiMessengerJobContext $smaregiMessengerJobContext,
    80	        private SmaregiAccessTokenService $accessTokenService,
    81	        private SmaregiTransactionApiClient $transactionApiClient,
    82	        private PurchasePatternContextBuilder $contextBuilder,
    83	        private PurchasePatternResolver $patternResolver,
    84	        private OtcGuestPatternHandler $otcGuestPatternHandler,
    85	        private OtcMemberPatternHandler $otcMemberPatternHandler,
    86	        private EccubeSmoothOtcPatternHandler $eccubeSmoothOtcPatternHandler,
    87	        private EccubeOtcPatternHandler $eccubeOtcPatternHandler,
    88	        private SmaregiOrderPointApplier $pointApplier,
    89	        private SmaregiPointAdjustmentApplier $pointAdjustmentApplier,
    90	        private SmaregiPointAdjustmentReverter $pointAdjustmentReverter,
    91	        private SmaregiTransactionCanceledProcessor $canceledProcessor,
    92	        private SmaregiTransactionDisposedProcessor $disposedProcessor,
    93	        private string $smaregiApiIdUrl,
    94	        private string $smaregiApiUrl,
    95	        private string $smaregiApiClientId,
    96	        private string $smaregiApiClientSecret,
    97	        private string $smaregiApiContractId,
    98	    ) {
    99	    }
   100	
   101	    public function __invoke(SmaregiTransactionProcessMessage $message): void
   102	    {
   103	        $Job = $this->messengerJobRepository->find($message->getJobId());
   104	        if (!$Job instanceof MessengerJob) {
   105	            $this->logger->error('Smaregi transaction process job not found', [
   106	                'jobId' => $message->getJobId(),
   107	            ]);
   108	
   109	            return;
   110	        }
   111	
   112	        // スマレジ API 呼び出しログを当該子ジョブに紐付けるため、コンテキストへ jobId を設定する。
   113	        // ({@see \Eccube\Service\Smaregi\Api\SmaregiPlatformApiCallRecorder} は本 ID を見て記録の可否を判断する)
   114	        $this->smaregiMessengerJobContext->setJobId((int) $Job->getId());
   115	
   116	        try {
   117	            // 悲観ロック + PENDING/FAILED のときのみ PROCESSING へ遷移し、重複実行を抑止する。
   118	            if (!$this->smaregiMessengerJobProcessingLock->tryBeginProcessingJob($Job)) {
   119	                return;
   120	            }
   121	
   122	            $Event = $this->smaregiWebhookEventRepository->find($message->getSmaregiWebhookEventId());
   123	            if (!$Event instanceof SmaregiWebhookEvent) {
   124	                throw new \RuntimeException(sprintf('Smaregi webhook event not found (webhookEventId=%d)', $message->getSmaregiWebhookEventId()));
   125	            }
   126	
   127	            $this->processTransaction($Job, $Event, $message->getAction(), $message->getTransactionHeadId());
   128	
   129	            $Job->setStatus(MessengerJob::STATUS_COMPLETED);
   130	            $Job->setCompletedAt(new \DateTime());
   131	            $Job->setErrorMessage(null);
   132	            $this->entityManager->flush();
   133	        } catch (\Throwable $e) {
   134	            $this->logger->warning('Smaregi transaction process job failed', [
   135	                'jobId' => $Job->getId(),
   136	                'webhookEventId' => $message->getSmaregiWebhookEventId(),
   137	                'action' => $message->getAction(),
   138	                'transactionHeadId' => $message->getTransactionHeadId(),
   139	                'error' => $e->getMessage(),
   140	            ]);
   141	            $this->failJob($Job, $e);
   142	
   143	            throw $e;
   144	        } finally {
   145	            $this->smaregiMessengerJobContext->clear();
   146	        }
   147	    }
   148	
   149	    private function processTransaction(MessengerJob $Job, SmaregiWebhookEvent $event, string $action, string $transactionHeadId): void
   150	    {
   151	        $accessToken = $this->accessTokenService->getAccessToken(
   152	            $this->smaregiApiIdUrl,
   153	            $this->smaregiApiContractId,
   154	            $this->smaregiApiClientId,
   155	            $this->smaregiApiClientSecret,
   156	        );
   157	
   158	        $response = $this->transactionApiClient->getTransaction(
   159	            $this->smaregiApiUrl,
   160	            $this->smaregiApiContractId,
   161	            $accessToken,
   162	            $transactionHeadId,
   163	        );
   164	
   165	        $transaction = $response['dto'] ?? null;
   166	        if ($transaction === null) {
   167	            throw new \RuntimeException(sprintf('Failed to fetch Smaregi transaction (transactionHeadId=%s, statusCode=%d)', $transactionHeadId, $response['statusCode']));
   168	        }
   169	
   170	        $updateDateTime = $transaction->updateDateTime;
   171	
   172	        if ($this->isStaleUpdate($transactionHeadId, $action, $updateDateTime)) {
   173	            $this->logger->info('Skip Smaregi transaction: stale updateDateTime (already processed)', [
   174	                'jobId' => $Job->getId(),
   175	                'webhookEventId' => $event->getId(),
   176	                'action' => $action,
   177	                'transactionHeadId' => $transactionHeadId,
   178	                'updateDateTime' => $updateDateTime,
   179	            ]);
   180	            $this->upsertTransactionJobRecord($Job, $transactionHeadId, $action, $updateDateTime);
   181	
   182	            return;
   183	        }
   184	
   185	        $this->dispatchByAction($event, $action, $transaction);
   186	        $this->upsertTransactionJobRecord($Job, $transactionHeadId, $action, $updateDateTime);
   187	    }
   188	
   189	    private function isStaleUpdate(string $transactionHeadId, string $action, ?string $incomingUpdateDateTime): bool
   190	    {
   191	        if ($incomingUpdateDateTime === null || $incomingUpdateDateTime === '') {
   192	            return false;
   193	        }
   194	        $latest = $this->smaregiTransactionJobRepository->findLatestCompletedByTransaction($transactionHeadId, $action);
   195	        if ($latest === null) {
   196	            return false;
   197	        }
   198	        $stored = $latest->getTransactionUpdateDateTime();
   199	        if ($stored === null || $stored === '') {
   200	            return false;
   201	        }
   202	
   203	        return $stored >= $incomingUpdateDateTime;
   204	    }
   205	
   206	    private function dispatchByAction(SmaregiWebhookEvent $event, string $action, TransactionDto $transaction): void
   207	    {
   208	        match ($action) {
   209	            CreatedHandler::ACTION => $this->processCreated($event, $transaction),
   210	            CanceledHandler::ACTION => $this->processCanceled($event, $transaction),
   211	            DisposedHandler::ACTION => $this->processDisposed($event, $transaction),
   212	            default => $this->logger->warning('Smaregi transaction action not yet handled in child job', [
   213	                'webhookEventId' => $event->getId(),
   214	                'action' => $action,
   215	                'transactionHeadId' => $transaction->transactionHeadId,
   216	            ]),
   217	        };
   218	    }
   219	
   220	    /**
   221	     * 取消(canceled)。ポイント専用取引(区分6/7)は受注が無いためポイントを差し戻し、
   222	     * それ以外は従来どおり受注の取消処理を行う。
   223	     */
   224	    private function processCanceled(SmaregiWebhookEvent $event, TransactionDto $transaction): void
   225	    {
   226	        if ($transaction->isCanceled() && $this->pointAdjustmentReverter->revert($transaction->transactionHeadId)) {
   227	            return;
   228	        }
   229	
   230	        $this->canceledProcessor->process($event, $transaction);
   231	    }
   232	
   233	    /**
   234	     * 打消(disposed)。打消元(disposeServerTransactionHeadId)がポイント専用取引なら差し戻し、
   235	     * それ以外は従来どおり受注の取消処理を行う。
   236	     */
   237	    private function processDisposed(SmaregiWebhookEvent $event, TransactionDto $transaction): void
   238	    {
   239	        if ($transaction->isDisposed() && $this->pointAdjustmentReverter->revert($transaction->disposeServerTransactionHeadId)) {
   240	            return;
   241	        }
   242	
   243	        $this->disposedProcessor->process($event, $transaction);
   244	    }
   245	
   246	    private function processCreated(SmaregiWebhookEvent $event, TransactionDto $transaction): void
   247	    {
   248	        // 取引区分6/7 (ポイント加算/減算) は商品明細を持たないポイント専用取引のため、
   249	        // 受注作成パターンには乗せず会員ポイントのみを増減する。
   250	        if ($this->pointAdjustmentApplier->supports($transaction)) {
   251	            if ($transaction->isCanceled() || $transaction->isDisposed()) {
   252	                $this->logger->info('Smaregi point-only transaction is canceled/disposed, skipping point apply', [
   253	                    'webhookEventId' => $event->getId(),
   254	                    'transactionHeadId' => $transaction->transactionHeadId,
   255	                    'division' => $transaction->transactionHeadDivision,
   256	                    'cancelDivision' => $transaction->cancelDivision,
   257	                    'disposeDivision' => $transaction->disposeDivision,
   258	                ]);
   259	
   260	                return;
   261	            }
   262	
   263	            $this->logger->info('Smaregi transaction is point-only (division 6/7), applying point adjustment', [
   264	                'webhookEventId' => $event->getId(),
   265	                'transactionHeadId' => $transaction->transactionHeadId,
   266	                'division' => $transaction->transactionHeadDivision,
   267	            ]);
   268	            $this->pointAdjustmentApplier->apply($transaction);
   269	
   270	            return;
   271	        }
   272	
   273	        $context = $this->contextBuilder->build($transaction);
   274	        $pattern = $this->patternResolver->resolve($context);
   275	
   276	        $this->logger->info('Smaregi transaction pattern resolved', [
   277	            'webhookEventId' => $event->getId(),
   278	            'action' => CreatedHandler::ACTION,
   279	            'transactionHeadId' => $transaction->transactionHeadId,
   280	            'pattern' => $pattern->name,
   281	            'patternNumber' => $pattern->value,
   282	        ]);
   283	
   284	        $this->dispatchByPattern($event, $transaction, $pattern, $context);
   285	    }
   286	
   287	    private function dispatchByPattern(
   288	        SmaregiWebhookEvent $event,
   289	        TransactionDto $transaction,
   290	        PurchasePattern $pattern,
   291	        PurchasePatternContext $context,
   292	    ): void {
   293	        $pointBearingOrder = match ($pattern) {
   294	            PurchasePattern::ECCUBE_SMOOTH_OTC => $this->handleSmoothOtc($transaction, $context),
   295	            // Pattern 2/3 (店頭受取) と Pattern 4-7 (店頭PC購入) は連携方法が同一:
   296	            // 既存受注を引き渡し済みにし、取引明細から新規受注を作成する。
   297	            // 店頭PC購入注文も配送方法=店頭受取で登録されるため突合・複製ロジックは共通で、
   298	            // 会員(4/5)・非会員(6/7)の差は member 引数 (非会員は null → guest として作成) で吸収する。
   299	            PurchasePattern::ECCUBE_OTC,
   300	            PurchasePattern::ECCUBE_OTC_WITH_ADD_ON,
   301	            PurchasePattern::OTC_PC_MEMBER,
   302	            PurchasePattern::OTC_PC_MEMBER_WITH_ADD_ON,
   303	            PurchasePattern::OTC_PC_GUEST,
   304	            PurchasePattern::OTC_PC_GUEST_WITH_ADD_ON => $this->handleEccubeOtc($transaction, $context),
   305	            PurchasePattern::OTC_MEMBER => $this->handleOtcMember($event, $transaction, $context),
   306	            PurchasePattern::OTC_GUEST => $this->handleOtcGuest($transaction),
   307	        };
   308	
   309	        // 会員が購入した受注のポイント (付与/使用) を EC 会員残高へ反映する。
   310	        // 非会員受注や取引IDが無い場合は applier 側で skip される。
   311	        if ($pointBearingOrder !== null) {
   312	            $this->pointApplier->apply($pointBearingOrder, $transaction);
   313	        }
   314	    }
   315	
   316	    /**
   317	     * Pattern 1: 既存オンライン受注を引渡し済みにする。ポイント付与対象は既存オンライン受注。
   318	     */
   319	    private function handleSmoothOtc(TransactionDto $transaction, PurchasePatternContext $context): ?Order
   320	    {
   321	        $orders = $this->eccubeSmoothOtcPatternHandler->handle($transaction, $context->matchedOrders);
   322	
   323	        // Pattern 1 は構造上 1 注文 = 1 スマレジ商品のため先頭の既存受注を付与対象とする。
   324	        return $orders[0] ?? null;
   325	    }
   326	
   327	    /**
   328	     * Pattern 2-7: 既存受注を引渡し済みにし新規受注を作成する。ポイント付与対象は新規受注 (戻り値の末尾)。
   329	     */
   330	    private function handleEccubeOtc(TransactionDto $transaction, PurchasePatternContext $context): ?Order
   331	    {
   332	        $orders = $this->eccubeOtcPatternHandler->handle(
   333	            $transaction,
   334	            $context->matchedOrders,
   335	            $context->matchedSmaregiCodes,
   336	            $context->member,
   337	        );
   338	
   339	        return $orders === [] ? null : $orders[array_key_last($orders)];
   340	    }
   341	
   342	    private function handleOtcGuest(TransactionDto $transaction): null
   343	    {
   344	        $this->otcGuestPatternHandler->handle($transaction);
   345	
   346	        // 非会員はポイント対象外。
   347	        return null;
   348	    }
   349	
   350	    private function handleOtcMember(
   351	        SmaregiWebhookEvent $event,
   352	        TransactionDto $transaction,
   353	        PurchasePatternContext $context,
   354	    ): ?Order {
   355	        $member = $context->member;
   356	        if ($member === null) {
   357	            // 解決済み Player が無い場合は guest 扱いに fallback して取り込み漏れを防ぐ。
   358	            $this->logger->warning('Smaregi OTC_MEMBER pattern resolved but member is null, falling back to guest creation', [
   359	                'webhookEventId' => $event->getId(),
   360	                'transactionHeadId' => $transaction->transactionHeadId,
   361	            ]);
   362	            $this->otcGuestPatternHandler->handle($transaction);
   363	
   364	            // guest fallback はポイント対象外。
   365	            return null;
   366	        }
   367	
   368	        return $this->otcMemberPatternHandler->handle($transaction, $member);
   369	    }
   370	
   371	    /**
   372	     * 1 子ジョブ = 1 SmaregiTransactionJob となるよう upsert する。
   373	     * 既存行があれば updateDateTime のみ更新し、無ければ新規作成。
   374	     */
   375	    private function upsertTransactionJobRecord(MessengerJob $Job, string $transactionHeadId, string $action, ?string $updateDateTime): void
   376	    {
   377	        $jobId = $Job->getId();
   378	        if ($jobId === null) {
   379	            return;
   380	        }
   381	        $TransactionJob = $this->smaregiTransactionJobRepository->findByMessengerJobId($jobId);
   382	        if ($TransactionJob === null) {
   383	            $TransactionJob = new SmaregiTransactionJob();
   384	            $TransactionJob->setMessengerJobId($jobId);
   385	            $TransactionJob->setTransactionHeadId($transactionHeadId);
   386	            $TransactionJob->setAction($action);
   387	            $this->entityManager->persist($TransactionJob);
   388	        }
   389	        $TransactionJob->setTransactionUpdateDateTime($updateDateTime);
   390	    }
   391	
   392	    private function failJob(MessengerJob $Job, \Throwable $e): void
   393	    {
   394	        try {
   395	            $Job->setStatus(MessengerJob::STATUS_FAILED);
   396	            $Job->setCompletedAt(new \DateTime());
   397	            $Job->setErrorMessage($this->truncateErrorMessage($e->getMessage()));
   398	            $this->entityManager->flush();
   399	        } catch (\Throwable $persistError) {
   400	            $this->logger->error('Failed to persist Smaregi transaction process job failure state', [
   401	                'jobId' => $Job->getId(),
   402	                'error' => $persistError->getMessage(),
   403	            ]);
   404	        }
   405	    }
   406	
   407	    private function truncateErrorMessage(string $message): string
   408	    {
   409	        // dtb_messenger_job.error_message は TEXT だが、巨大な stack trace でログ膨張するのを避ける
   410	        if (strlen($message) <= 2000) {
   411	            return $message;
   412	        }
   413	
   414	        return substr($message, 0, 2000).'... (truncated)';
   415	    }
   416	}

exec
/bin/bash -lc 'rg -n "X_contract_id|X_access_token|proc_name|TransactionHead|transactionHead|transactionHeadId|Access-Control-Allow-Origin|Cache-Control|dtb_order_sub|OrderSub|order_sub|支店|branch|transfer|転送" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Smaregi' in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "find /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity -iname '*OrderSub*' -o -iname '*ordersub*' -o -iname '*Sub*Order*' | sort && rg -n \"class .*OrderSub|dtb_order_sub|order_sub\" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 108ms:
 exited 1 in 166ms:
codex
候補JSONのdesignRefはHTMLではなく元Markdownを指しています。正本HTMLには対応内容がありますが、手順上は参照ファイル形式のズレとして扱う余地があるため、元Markdownの有無と行番号も確認します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php | sed -n '1,230p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Service\Smaregi\Webhook\Transaction;
    17	
    18	use Doctrine\DBAL\LockMode;
    19	use Doctrine\ORM\EntityManagerInterface;
    20	use Eccube\Dto\Smaregi\Api\Transaction\TransactionDto;
    21	use Eccube\Entity\Customer;
    22	use Eccube\Entity\Master\MtbPointType;
    23	use Eccube\Repository\DtbPointHistoryRepository;
    24	use Eccube\Repository\Master\MtbPointTypeRepository;
    25	use Eccube\Service\EntityManager\PointHistoryEntityManager;
    26	use Eccube\Service\Smaregi\SmaregiCustomerResolver;
    27	use Eccube\Service\Smaregi\SmaregiPointPushLogService;
    28	use Psr\Log\LoggerInterface;
    29	
    30	/**
    31	 * スマレジ取引区分6 (ポイント加算) / 7 (ポイント減算) の「ポイント専用取引」を
    32	 * EC-CUBE 会員ポイント残高へ反映する。
    33	 *
    34	 * 通常購入 (取引区分1) と異なり商品明細を持たず受注作成パターンに乗らないため、
    35	 * {@see \Eccube\MessageHandler\SmaregiTransactionProcessMessageHandler} の created 処理で
    36	 * 受注を作らずに本サービスへ分岐させる。
    37	 *
    38	 * 仕様:
    39	 *  - 区分6: 付与ポイント (`newPoint`) を加算。
    40	 *  - 区分7: 使用ポイント (`spendPoint`) を減算。
    41	 *  - 会員 (customerId → DtbPlayer) に紐付かない取引は対象外。
    42	 *  - 冪等性: 同一 `transactionHeadId` のポイント履歴が既にあれば再適用しない。
    43	 *  - 履歴種別はスマレジ由来ポイントとして {@see MtbPointType::PURCHASE_TYPE} で統一する。
    44	 */
    45	final readonly class SmaregiPointAdjustmentApplier
    46	{
    47	    private const DIVISION_POINT_ADD = '6';
    48	
    49	    private const DIVISION_POINT_SUBTRACT = '7';
    50	
    51	    public function __construct(
    52	        private LoggerInterface $logger,
    53	        private EntityManagerInterface $entityManager,
    54	        private SmaregiCustomerResolver $customerResolver,
    55	        private DtbPointHistoryRepository $pointHistoryRepository,
    56	        private MtbPointTypeRepository $pointTypeRepository,
    57	        private PointHistoryEntityManager $pointHistoryEntityManager,
    58	        private SmaregiPointPushLogService $pushLogService,
    59	    ) {
    60	    }
    61	
    62	    /**
    63	     * 取引がポイント専用取引 (区分6/7) かどうか。
    64	     */
    65	    public function supports(TransactionDto $transaction): bool
    66	    {
    67	        return in_array(
    68	            $transaction->transactionHeadDivision,
    69	            [self::DIVISION_POINT_ADD, self::DIVISION_POINT_SUBTRACT],
    70	            true,
    71	        );
    72	    }
    73	
    74	    public function apply(TransactionDto $transaction): void
    75	    {
    76	        if (!$this->supports($transaction)) {
    77	            return;
    78	        }
    79	
    80	        // EC-CUBE発のpoint/addが生んだ取引（送信記録に該当）は、EC-CUBE側で既にポイント反映済みのためここでは適用しない。
    81	        if ($this->pushLogService->isPushed($transaction->transactionHeadId)) {
    82	            $this->logger->info('Smaregi point adjustment skipped: EC-originated push (self-issued)', [
    83	                'transactionHeadId' => $transaction->transactionHeadId,
    84	                'division' => $transaction->transactionHeadDivision,
    85	            ]);
    86	
    87	            return;
    88	        }
    89	
    90	        $customerId = $transaction->customerId;
    91	        if ($customerId === null || $customerId === '') {
    92	            // ポイントは会員にしか紐付かないため、会員IDが無い取引は対象外。
    93	            $this->logger->warning('Smaregi point adjustment skipped: transaction has no customerId', [
    94	                'transactionHeadId' => $transaction->transactionHeadId,
    95	                'division' => $transaction->transactionHeadDivision,
    96	            ]);
    97	
    98	            return;
    99	        }
   100	
   101	        // 受信した customerId はスマレジ採番IDのため、会員取得APIで customerNo を引いて
   102	        // dtb_player.smaregi_id と突合する（SmaregiCustomerResolver が解決を担う）。
   103	        $player = $this->customerResolver->resolvePlayerByCustomerId($customerId);
   104	        $customer = $player?->getCustomer();
   105	        if ($player === null || !$customer instanceof Customer) {
   106	            $this->logger->warning('Smaregi point adjustment skipped: member not resolved', [
   107	                'transactionHeadId' => $transaction->transactionHeadId,
   108	                'customerId' => $customerId,
   109	            ]);
   110	
   111	            return;
   112	        }
   113	
   114	        $transactionId = $this->resolveTransactionId($transaction);
   115	        if ($transactionId === null) {
   116	            // 取引IDが数値でない場合は冪等性を担保できないため適用しない。
   117	            $this->logger->warning('Smaregi point adjustment skipped: transactionHeadId is not numeric', [
   118	                'transactionHeadId' => $transaction->transactionHeadId,
   119	            ]);
   120	
   121	            return;
   122	        }
   123	
   124	        $pointChange = $this->resolvePointChange($transaction);
   125	        if ($pointChange === 0) {
   126	            return;
   127	        }
   128	
   129	        // 同一 transactionHeadId の Webhook が並列処理されると existsByTransactionId が両者 false を
   130	        // 見て二重適用し得る。残高を持つ Player 行を悲観ロックして直列化し、ロック確立後に
   131	        // 冪等性チェック → 残高更新 → 履歴記録までを同一トランザクションで完了させる。
   132	        $this->entityManager->beginTransaction();
   133	        try {
   134	            $this->entityManager->lock($player, LockMode::PESSIMISTIC_WRITE);
   135	
   136	            // 冪等性: 同一取引のポイント履歴が既にあれば再適用しない (ロック確立後に再確認)。
   137	            if ($this->pointHistoryRepository->existsByTransactionId($transactionId)) {
   138	                $this->entityManager->commit();
   139	                $this->logger->info('Smaregi point adjustment already applied for transaction, skipping', [
   140	                    'transactionHeadId' => $transaction->transactionHeadId,
   141	                ]);
   142	
   143	                return;
   144	            }
   145	
   146	            $player->setPoint($player->getPoint() + $pointChange);
   147	            $this->entityManager->persist($player);
   148	
   149	            $pointType = $this->pointTypeRepository->find(MtbPointType::PURCHASE_TYPE);
   150	            $this->pointHistoryEntityManager->save(
   151	                null,
   152	                $customer,
   153	                null,
   154	                $pointType,
   155	                $pointChange,
   156	                null,
   157	                new \DateTime(),
   158	                $transactionId,
   159	            );
   160	            $this->entityManager->flush();
   161	            $this->entityManager->commit();
   162	        } catch (\Throwable $e) {
   163	            if ($this->entityManager->getConnection()->isTransactionActive()) {
   164	                $this->entityManager->rollback();
   165	            }
   166	
   167	            throw $e;
   168	        }
   169	
   170	        $this->logger->info('Smaregi point adjustment applied to member', [
   171	            'transactionHeadId' => $transaction->transactionHeadId,
   172	            'division' => $transaction->transactionHeadDivision,
   173	            'pointChange' => $pointChange,
   174	            'playerId' => $player->getId(),
   175	        ]);
   176	    }
   177	
   178	    /**
   179	     * 区分6は付与ポイントを加算、区分7は使用ポイントを減算する。
   180	     */
   181	    private function resolvePointChange(TransactionDto $transaction): int
   182	    {
   183	        return match ($transaction->transactionHeadDivision) {
   184	            self::DIVISION_POINT_ADD => (int) ($transaction->newPoint ?? 0),
   185	            self::DIVISION_POINT_SUBTRACT => -(int) ($transaction->spendPoint ?? 0),
   186	            default => 0,
   187	        };
   188	    }
   189	
   190	    /**
   191	     * 取引IDを履歴用の int に変換する。数値でなければ null を返す。
   192	     */
   193	    private function resolveTransactionId(TransactionDto $transaction): ?int
   194	    {
   195	        $transactionHeadId = $transaction->transactionHeadId;
   196	        if ($transactionHeadId === null || !ctype_digit($transactionHeadId)) {
   197	            return null;
   198	        }
   199	
   200	        return (int) $transactionHeadId;
   201	    }
   202	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php | sed -n '1,180p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Service\Smaregi\Webhook\Transaction;
    17	
    18	use Doctrine\ORM\EntityManagerInterface;
    19	use Eccube\Entity\Master\MtbPointType;
    20	use Eccube\Repository\DtbPlayerRepository;
    21	use Eccube\Repository\DtbPointHistoryRepository;
    22	use Eccube\Repository\Master\MtbPointTypeRepository;
    23	use Eccube\Service\EntityManager\PointHistoryEntityManager;
    24	use Psr\Log\LoggerInterface;
    25	
    26	/**
    27	 * スマレジ「ポイント専用取引」(取引区分6/7) の取消(canceled)/打消(disposed)で、
    28	 * {@see SmaregiPointAdjustmentApplier} が適用したポイントを EC-CUBE 会員残高から差し戻す。
    29	 *
    30	 * 判別:
    31	 *  - ポイント専用取引の履歴は受注に紐付かない (dtb_point_history.order_id が NULL) ため、
    32	 *    取引ID + order_id IS NULL で抽出する。受注由来のポイント履歴 (order_id 有り) は対象外。
    33	 *
    34	 * 差し戻し方式:
    35	 *  - 元の付与/減算履歴は監査用に残し、相殺用の逆仕訳履歴 (符号反転) を追加して残高を戻す。
    36	 *    元履歴を削除しないことで created 再送時の forward 冪等性 (`existsByTransactionId`) も維持する。
    37	 *  - 既に逆仕訳済み (net = 0) の場合は再処理しない。
    38	 */
    39	final readonly class SmaregiPointAdjustmentReverter
    40	{
    41	    private const REVERT_NOTE = 'スマレジ取消/打消によるポイント差し戻し';
    42	
    43	    public function __construct(
    44	        private LoggerInterface $logger,
    45	        private EntityManagerInterface $entityManager,
    46	        private DtbPlayerRepository $playerRepository,
    47	        private DtbPointHistoryRepository $pointHistoryRepository,
    48	        private MtbPointTypeRepository $pointTypeRepository,
    49	        private PointHistoryEntityManager $pointHistoryEntityManager,
    50	    ) {
    51	    }
    52	
    53	    /**
    54	     * 指定取引IDで適用済みのポイント専用取引を差し戻す。
    55	     *
    56	     * @param ?string $originalTransactionId 取消は取引自体のID、打消は打消元(disposeServerTransactionHeadId)
    57	     *
    58	     * @return bool ポイント専用取引だった(差戻し実施 or 既に差戻し済み)場合 true、対象でなければ false
    59	     */
    60	    public function revert(?string $originalTransactionId): bool
    61	    {
    62	        $transactionId = $this->resolveTransactionId($originalTransactionId);
    63	        if ($transactionId === null) {
    64	            return false;
    65	        }
    66	
    67	        $histories = $this->pointHistoryRepository->findPointOnlyByTransactionId($transactionId);
    68	        if ($histories === []) {
    69	            // 受注に紐付かないポイント履歴が無い = ポイント専用取引ではない (または対象なし)。
    70	            return false;
    71	        }
    72	
    73	        $net = 0;
    74	        foreach ($histories as $history) {
    75	            $net += (int) $history->getPointChange();
    76	        }
    77	        if ($net === 0) {
    78	            // 付与/減算 と 逆仕訳 が相殺済み = 既に差し戻し済みのため再処理しない。
    79	            $this->logger->info('Smaregi point adjustment already reverted, skipping', [
    80	                'transactionId' => $transactionId,
    81	            ]);
    82	
    83	            return true;
    84	        }
    85	
    86	        $customer = $histories[0]->getCustomer();
    87	        $player = $this->playerRepository->findOneByCustomer($customer);
    88	        if ($player === null) {
    89	            $this->logger->warning('Smaregi point adjustment revert skipped: player not resolved', [
    90	                'transactionId' => $transactionId,
    91	            ]);
    92	
    93	            return true;
    94	        }
    95	
    96	        // 残高を差し戻し、相殺用の逆仕訳履歴 (元履歴は保持) を残す。
    97	        $player->setPoint($player->getPoint() - $net);
    98	        $this->entityManager->persist($player);
    99	
   100	        $pointType = $this->pointTypeRepository->find(MtbPointType::PURCHASE_TYPE);
   101	        $this->pointHistoryEntityManager->save(
   102	            null,
   103	            $customer,
   104	            null,
   105	            $pointType,
   106	            -$net,
   107	            self::REVERT_NOTE,
   108	            new \DateTime(),
   109	            $transactionId,
   110	        );
   111	        $this->entityManager->flush();
   112	
   113	        $this->logger->info('Smaregi point adjustment reverted', [
   114	            'transactionId' => $transactionId,
   115	            'revertedPoint' => -$net,
   116	            'playerId' => $player->getId(),
   117	        ]);
   118	
   119	        return true;
   120	    }
   121	
   122	    /**
   123	     * 取引IDを履歴用の int に変換する。数値でなければ null を返す。
   124	     */
   125	    private function resolveTransactionId(?string $transactionId): ?int
   126	    {
   127	        if ($transactionId === null || !ctype_digit($transactionId)) {
   128	            return null;
   129	        }
   130	
   131	        return (int) $transactionId;
   132	    }
   133	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/a05-04_api_order_order_smaregi_receive.md | sed -n '60,250p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
    60	| 支店コード | 商品コードの一部に含まれる店舗識別。自店舗以外は支店システムへ転送する。 |
    61	
    62	---
    63	
    64	## 利用者視点の入口
    65	
    66	| 入口 | URLエンドポイント | 期待されるふるまい |
    67	|------|--------------------|--------------------|
    68	| スマレジ取引通知の受信 | `POST /{_locale}/smaregi/transaction` | 取引情報を受け取り、会員ポイントとポイント履歴を更新し、対象注文を出荷完了に反映し、更新件数を返す。 |
    69	
    70	応答形式はJSON。呼び出し元はスマレジ（および支店システムへの転送経路）。フロントのルートは言語識別子`{_locale}`配下にマウントされる。
    71	
    72	---
    73	
    74	## 認証・認可
    75	
    76	| 観点 | 内容 |
    77	|------|------|
    78	| 認証方式 | 本APIは認証トークンを要求しない。フロントのファイアウォールは匿名アクセスを許可し、本パスにはログイン必須のアクセス制御を設定していない。 |
    79	| 連携用ヘッダ | 支店システムへの転送時に、受信したリクエストの`X_contract_id`・`X_access_token`ヘッダを転送先へ引き継ぐ。これらは本APIの呼び出し元認証ではなく、転送先のスマレジ受信APIに渡す資格情報として用いる。 |
    80	| 認証失敗時 | 認証判定を行わないため、未認証でも処理を実行する。 |
    81	| 認可 | 呼び出し元はスマレジおよび転送経路。利用者の資格情報による絞り込みは行わない。 |
    82	
    83	連携用ヘッダの値は本書に記載しない。
    84	
    85	---
    86	
    87	## 処理フロー
    88	
    89	### スマレジ取引通知を取り込む（POST `/{_locale}/smaregi/transaction`）
    90	
    91	1. リクエストボディの`params`をJSONとして解釈し、`data`配下のうち取引ヘッダと取引明細を抽出する。
    92	2. オプションマスタからスマレジ店舗IDを取得し、3桁ゼロ埋めの店舗コードに整形する。
    93	3. 取引区分を判定する。
    94	   - 取消の場合は、会員ポイントを取消方向に補正し、取引IDに一致するポイント履歴を取得して削除する。
    95	   - 打消レコードの場合は、付与・利用ポイントの正負を反転したうえで取消と同様に補正し、対象履歴を削除する。
    96	   - 通常取引の場合は、会員ポイントを加減算し、付与・利用それぞれのポイント履歴を登録する。続いて取引明細の各行を処理し、商品コードの店舗コードが自店舗と一致する行は対象注文を出荷完了に反映する。一致しない行は支店分として記録する。
    97	4. 支店分の明細がある場合は、受信ヘッダの連携用ヘッダを引き継ぎ、支店システムのスマレジ受信APIへ明細を転送する。転送結果に更新件数が含まれる場合は合算し、含まれない場合は転送エラーをログに記録する。
    98	5. 取引ヘッダの更新件数を合算した値を、更新件数として応答に組み立てて返す（HTTP 200）。
    99	
   100	---
   101	
   102	## 業務ルール・計算
   103	
   104	| 項目 | 内容 |
   105	|------|------|
   106	| 更新対象 | リクエストで指定されたID・入力値に対応する業務データを対象にする。対象特定、入力不正、認証・認可の判定順序は処理フローとバリデーションの各節を正とする。 |
   107	| 更新方法 | 入力値を対象データへ上書きまたは追加登録する。履歴登録や関連データ更新がある場合は入出力の副作用およびDBカラムの節を正とする。 |
   108	| 計算処理 | 本APIでは金額・税・ポイント・在庫数量の再計算や丸めを行わない。ステータスやコメント等の更新は、実装で定義された遷移・存在確認・担当者判定に従う。 |
   109	| 応答値 | 成功時は処理結果コードまたは更新後に取得した値を返す。レスポンス値は本API内で独自集計せず、保存結果または取得結果をJSON応答へ整形する。 |
   110	
   111	---
   112	
   113	## 入出力
   114	
   115	### リクエスト
   116	
   117	| パラメータ | 位置 | 型 | 必須／任意 | 説明 |
   118	|------------|------|----|-----------|------|
   119	| `params` | ボディ（フォーム値） | string | 必須 | JSON文字列。`data`配列に取引ヘッダ（`TransactionHead`）と取引明細（`TransactionDetail`）を含む。取引ヘッダは会員ID・付与ポイント・利用ポイント・取引ヘッダID・取消区分・打消区分等を持つ。 |
   120	| `proc_name` | ボディ（フォーム値） | string | 任意 | スマレジの処理名。支店システムへの転送時にそのまま引き継ぐ。 |
   121	| `X_contract_id` | ヘッダ | string | 任意 | 支店転送時に転送先へ引き継ぐ契約ID。 |
   122	| `X_access_token` | ヘッダ | string | 任意 | 支店転送時に転送先へ引き継ぐアクセストークン。 |
   123	| `{_locale}` | パス | string | 必須 | 言語識別子。処理対象の絞り込みには用いない。 |
   124	
   125	### レスポンス（成功）
   126	
   127	HTTP 200。
   128	
   129	| フィールド | 型 | 説明 |
   130	|------------|----|------|
   131	| `result` | array | 更新結果の配列。要素はオブジェクト1件。 |
   132	| `result[].TransactionHead` | integer | 更新件数。会員ポイント・ポイント履歴・出荷完了反映の処理件数と、支店転送の結果件数を合算した値。 |
   133	
   134	### レスポンス（失敗）
   135	
   136	| HTTPステータス | 条件 | 本文の形 |
   137	|----------------|------|----------|
   138	| 500 | `params`の解釈不可、取引ヘッダの不足、処理中の例外 | 標準例外ハンドラに委ねる |
   139	
   140	入力検証・認証判定を明示的に行わないため、400・401は発生しない。会員が見つからない・対象履歴が無い・対象注文が無い場合はその処理の更新件数を0として継続し、200を返す。
   141	
   142	### サンプルレスポンス
   143	
   144	成功時の応答例（代表値）。
   145	
   146	```json
   147	{
   148	  "result": [
   149	    {
   150	      "TransactionHead": 1
   151	    }
   152	  ]
   153	}
   154	```
   155	
   156	### 副作用
   157	
   158	会員（プレイヤー）の保有ポイントの更新。ポイント履歴の登録（通常取引）または削除（取消・打消）。対象注文の出荷完了反映（受注ステータス・出荷確定日・コミット日・注文サブの出荷日・担当者の更新、ポイント付与処理）。支店システムのスマレジ受信APIへの明細転送。これらはデータベースへ反映する。
   159	
   160	応答はJSON応答整形を経て返す。`result`配列を持つ連想配列を返し、`Content-Type`に`application/json;charset=UTF-8`、キャッシュ抑止と`Access-Control-Allow-Origin: *`を明示する。
   161	
   162	---
   163	
   164	## バリデーション
   165	
   166	| 項目 | 内容 |
   167	|------|------|
   168	| `params` | JSON文字列として解釈する。形式や必須項目の明示的な検証は行わず、解釈不可・取引ヘッダ不足時は処理中の例外として標準例外ハンドラに委ねる（HTTP 500相当）。 |
   169	| 取引区分 | 取消区分・打消区分の値で処理経路を分岐する。いずれにも該当しない場合は通常取引として扱う。 |
   170	
   171	---
   172	
   173	## データ整合性
   174	
   175	| 観点 | 内容 |
   176	|------|------|
   177	| 更新の有無 | 本APIは参照だけでなく、会員ポイント・ポイント履歴・受注を更新する。 |
   178	| ポイントと履歴 | 通常取引では会員ポイントの加減算とポイント履歴の登録を同一処理内で行う。取消・打消では取引IDに一致するポイント履歴を取得して削除し、会員ポイントを逆方向へ補正する。会員または対象履歴が無い場合は更新しない。 |
   179	| 出荷完了反映 | 自店舗の明細に対し、注文サブを商品コードで特定して出荷完了へ反映する。対象注文が無い場合は反映しない。 |
   180	| 支店転送 | 自店舗以外の明細は支店システムへ転送し、結果件数を更新件数に合算する。転送に件数が含まれない場合はログに記録し、件数は合算しない。 |
   181	
   182	---
   183	
   184	## DBカラム
   185	
   186	機能に直接関係する列のみ記載する。型や一覧の細部はスキーマを参照する。
   187	
   188	| テーブル | 列 | メモ |
   189	|----------|-----|------|
   190	| 会員（プレイヤー）（dtb_player） | スマレジ会員ID（smaregi_id） | 取引ヘッダの会員IDで会員を特定する結合キー。 |
   191	| 会員（プレイヤー）（dtb_player） | 保有ポイント（point） | 付与・利用・取消に応じて加減算する。 |
   192	| ポイント履歴テーブル（dtb_point_history） | ポイント増減（point_change）・摘要（note）・発生日（issue_date）・ポイント区分（point_type_id）・取引ID（transaction_id） | 通常取引で登録、取消・打消で取引IDをキーに削除する。 |
   193	| オプションマスタ（mtb_option） | スマレジ店舗ID | 自店舗の店舗コード判定に用いる。 |
   194	| ポイント区分マスタ（mtb_point_type） | 購入区分 | 登録するポイント履歴の区分に用いる。 |
   195	| 注文サブ（dtb_order_sub。ec-cube-enterprise 実装で要確認） | スマレジコード・出荷日・担当者・付与ポイント・連携エラー | 出荷完了反映の対象特定と更新に用いる。移行先の対応表は要確認。 |
   196	| 受注 | 受注ステータス・コミット日・出荷確定日 | 出荷完了への反映に用いる。 |
   197	
   198	### DB操作
   199	
   200	永続化の正は ec-cube-enterprise（テーブル名・操作は ec-cube-enterprise を正典）。当ドメインは承認ワークフローを介さず persist/flush で直接確定する（承認ワークフローは在庫機能固有）。
   201	
   202	| 操作種別 | 対象テーブル | 契機・条件 |
   203	|---------|--------------|------------|
   204	| 登録/更新 | dtb_order_sub / dtb_player / dtb_point_history / mtb_option / mtb_point_type | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。 |
   205	
   206	---
   207	
   208	## 権限・認可
   209	
   210	| 利用者状態 | スマレジ受信処理 |
   211	|------------|------------------|
   212	| 任意のクライアント（未認証含む） | 処理を実行できる。本APIは呼び出し元の認証・利用者状態による制御を行わない。 |
   213	| 支店システムへの転送 | 受信した連携用ヘッダを引き継いで転送先のスマレジ受信APIを呼び出す。 |
   214	
   215	---
   216	
   217	## エラー処理
   218	
   219	| エラー内容 | 処理 |
   220	|------------|------|
   221	| `params`の解釈不可・取引ヘッダ不足・処理中の例外 | 明示的な`try-catch`は持たず、標準例外ハンドラに委ねる（HTTP 500相当）。 |
   222	| 会員が見つからない・対象履歴が無い・対象注文が無い | エラーとせず、その処理の更新件数を0として継続し、200を返す。 |
   223	| 支店転送の結果に件数が含まれない | 転送エラーとしてログに記録し、件数を合算しない。処理は継続する。 |
   224	
   225	---
   226	
   227	## ログ・監査
   228	
   229	支店転送の結果に件数が含まれない場合に、転送エラーである旨と転送結果をログ出力する。
   230	
   231	### ログに出してはいけないもの
   232	
   233	- 連携用ヘッダ（契約ID・アクセストークン）の値
   234	- Cookie値・セッションIDの完全値
   235	
   236	---
   237	
   238	## 排他制御・トランザクション
   239	
   240	本APIは会員ポイント・ポイント履歴・受注を更新する。各処理の末尾で永続化を確定する。明示的な悲観ロック・楽観ロックの取得は行わない。同一取引の重複受信時の整合は、取消・打消が取引IDを基準にポイント履歴を特定して巻き戻す前提に依存する。

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php | sed -n '1,190p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Service\Smaregi\Webhook\Transaction;
    17	
    18	use Doctrine\DBAL\LockMode;
    19	use Doctrine\ORM\EntityManagerInterface;
    20	use Eccube\Dto\Smaregi\Api\Transaction\TransactionDto;
    21	use Eccube\Entity\Customer;
    22	use Eccube\Entity\Order;
    23	use Eccube\Repository\DtbPlayerRepository;
    24	use Eccube\Repository\DtbPointHistoryRepository;
    25	use Eccube\Service\PointService;
    26	use Psr\Log\LoggerInterface;
    27	
    28	/**
    29	 * スマレジの売上取引 (受注 Webhook) に乗った獲得/使用ポイントを EC-CUBE 会員残高へ反映する。
    30	 *
    31	 * 対象は商品明細を伴う売上取引で、受注作成パターン (OTC 等) に紐づくもの。商品明細を持たない
    32	 * ポイント専用取引 (区分6/7) は {@see SmaregiPointAdjustmentApplier} が扱う（本クラスの対象外）。
    33	 *
    34	 * 仕様:
    35	 *  - 付与ポイント (`newPoint`) を加算、使用ポイント (`spendPoint`) を減算する。
    36	 *    店頭受取のオンライン注文で使われたポイントは EC 側が注文時に減算済みのため、
    37	 *    Webhook の `spendPoint` には店頭レジでの使用分のみが乗る前提で二重減算しない。
    38	 *  - 非会員 (Order に Customer が紐付かない) は対象外。
    39	 *  - 冪等性: 同一 `transactionHeadId` のポイント履歴が既にあれば再適用しない
    40	 *    (Webhook 再送・補完取得バッチでの重複付与を防ぐ)。
    41	 *
    42	 * ポイント残高/履歴の更新は共通の {@see PointService} に委譲し、`transactionId` を履歴へ記録する。
    43	 */
    44	final readonly class SmaregiOrderPointApplier
    45	{
    46	    public function __construct(
    47	        private LoggerInterface $logger,
    48	        private EntityManagerInterface $entityManager,
    49	        private PointService $pointService,
    50	        private DtbPointHistoryRepository $pointHistoryRepository,
    51	        private DtbPlayerRepository $playerRepository,
    52	    ) {
    53	    }
    54	
    55	    /**
    56	     * @param Order $order ポイント付与対象の受注 (Pattern 1 は既存オンライン受注、Pattern 2-5/8 は新規受注)
    57	     */
    58	    public function apply(Order $order, TransactionDto $transaction): void
    59	    {
    60	        // 非会員はポイント対象外。
    61	        $customer = $order->getCustomer();
    62	        if (!$customer instanceof Customer) {
    63	            return;
    64	        }
    65	
    66	        $transactionId = $this->resolveTransactionId($transaction);
    67	        if ($transactionId === null) {
    68	            // 取引IDが数値でない場合は冪等性を担保できないため適用しない。
    69	            $this->logger->warning('Smaregi point not applied: transactionHeadId is not numeric', [
    70	                'transactionHeadId' => $transaction->transactionHeadId,
    71	                'orderId' => $order->getId(),
    72	            ]);
    73	
    74	            return;
    75	        }
    76	
    77	        $gained = (int) ($transaction->newPoint ?? 0);
    78	        $spended = (int) ($transaction->spendPoint ?? 0);
    79	        if ($gained === 0 && $spended === 0) {
    80	            return;
    81	        }
    82	
    83	        // ポイント残高を持つ会員 (Player) を取得。Player が無ければ PointService 側でも
    84	        // 残高加減算されないため、ロックも適用も行わない。
    85	        $player = $this->playerRepository->findOneByCustomer($customer);
    86	        if ($player === null) {
    87	            $this->logger->warning('Smaregi point not applied: player not found for customer', [
    88	                'transactionHeadId' => $transaction->transactionHeadId,
    89	                'orderId' => $order->getId(),
    90	                'customerId' => $customer->getId(),
    91	            ]);
    92	
    93	            return;
    94	        }
    95	
    96	        // 同一 transactionHeadId の Webhook が並列処理されると existsByTransactionId が両者 false を
    97	        // 見て二重付与し得る。1 取引 = 1 会員のため、残高を持つ Player 行を悲観ロックして直列化し、
    98	        // ロック確立後に冪等性チェック → 付与 → 履歴記録までを同一トランザクションで完了させる。
    99	        $this->entityManager->beginTransaction();
   100	        try {
   101	            $this->entityManager->lock($player, LockMode::PESSIMISTIC_WRITE);
   102	
   103	            // 冪等性: 同一取引のポイント履歴が既にあれば再適用しない (ロック確立後に再確認)。
   104	            if ($this->pointHistoryRepository->existsByTransactionId($transactionId)) {
   105	                $this->entityManager->commit();
   106	                $this->logger->info('Smaregi point already applied for transaction, skipping', [
   107	                    'transactionHeadId' => $transaction->transactionHeadId,
   108	                    'orderId' => $order->getId(),
   109	                ]);
   110	
   111	                return;
   112	            }
   113	
   114	            $order->setGainedPoints($gained);
   115	            $order->setSpendedPoints($spended);
   116	            $this->entityManager->persist($order);
   117	
   118	            $this->pointService->gainPoints($order, $transactionId);
   119	            $this->pointService->spendPoints($order, $transactionId);
   120	            $this->entityManager->flush();
   121	            $this->entityManager->commit();
   122	        } catch (\Throwable $e) {
   123	            if ($this->entityManager->getConnection()->isTransactionActive()) {
   124	                $this->entityManager->rollback();
   125	            }
   126	
   127	            throw $e;
   128	        }
   129	
   130	        $this->logger->info('Smaregi point applied to member', [
   131	            'transactionHeadId' => $transaction->transactionHeadId,
   132	            'orderId' => $order->getId(),
   133	            'gainedPoints' => $gained,
   134	            'spendedPoints' => $spended,
   135	        ]);
   136	    }
   137	
   138	    /**
   139	     * 取引IDを履歴用の int に変換する。数値でなければ null を返す。
   140	     */
   141	    private function resolveTransactionId(TransactionDto $transaction): ?int
   142	    {
   143	        $transactionHeadId = $transaction->transactionHeadId;
   144	        if ($transactionHeadId === null || !ctype_digit($transactionHeadId)) {
   145	            return null;
   146	        }
   147	
   148	        return (int) $transactionHeadId;
   149	    }
   150	}

codex
見落とし候補として、設計が「ログに出してはいけない」としている連携ヘッダ/Cookieを、コントローラがそのままログ出力している点が見えました。もう一点、JSON解釈不可時の扱いが設計の500と合わない可能性があるため、エンティティの型とディスパッチャのevent判定を確認します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Stock/StockEventDispatcher.php | sed -n '1,130p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Service\Smaregi\Webhook\Stock;
    17	
    18	use Eccube\Entity\SmaregiWebhookEvent;
    19	use Psr\Log\LoggerInterface;
    20	
    21	/**
    22	 * 在庫変動 (pos:stock) Webhook イベントを在庫変動履歴 1 件ごとの子ジョブへ振り分けるディスパッチャ。
    23	 *
    24	 * 親 ({@see \Eccube\MessageHandler\SmaregiWebhookEventMessageHandler}) から呼ばれ、自身が扱う
    25	 * event 種別 (pos:stock) 以外は何もせず return する (各ディスパッチャが自己フィルタする方式)。
    26	 * 扱う action は `edited` のみ。未知 action は例外にせず、後続バッチでの再連携余地を残すため
    27	 * ログ警告のみで return する。
    28	 *
    29	 * payload の `ids[]` 1 要素 (= 在庫変動履歴 1 件) ごとに {@see SmaregiStockProcessDispatcher} を通じて
    30	 * 子 MessengerJob を作成・enqueue する (子ジョブ生成は再連携バッチと共通)。
    31	 */
    32	final readonly class StockEventDispatcher
    33	{
    34	    public const EVENT_NAME = 'pos:stock';
    35	
    36	    public const ACTION_EDITED = 'edited';
    37	
    38	    public function __construct(
    39	        private SmaregiStockProcessDispatcher $processDispatcher,
    40	        private LoggerInterface $logger,
    41	    ) {
    42	    }
    43	
    44	    public function dispatch(SmaregiWebhookEvent $event, ?int $parentJobId = null): void
    45	    {
    46	        $eventName = $event->getEvent();
    47	        if ($eventName !== self::EVENT_NAME) {
    48	            // pos:stock 以外 (取引など) は本ディスパッチャの対象外。
    49	            return;
    50	        }
    51	
    52	        $action = $event->getAction();
    53	        if ($action !== self::ACTION_EDITED) {
    54	            $this->logger->warning('Smaregi stock action has no handler', [
    55	                'webhookEventId' => $event->getId(),
    56	                'action' => $action,
    57	                'knownActions' => [self::ACTION_EDITED],
    58	            ]);
    59	
    60	            return;
    61	        }
    62	
    63	        $items = $this->extractStockChangeItems($event);
    64	        if ($items === []) {
    65	            $this->logger->warning('Smaregi stock webhook has no ids', [
    66	                'webhookEventId' => $event->getId(),
    67	                'action' => $action,
    68	            ]);
    69	
    70	            return;
    71	        }
    72	
    73	        $this->logger->info('Smaregi stock action dispatching', [
    74	            'webhookEventId' => $event->getId(),
    75	            'action' => $action,
    76	            'itemCount' => count($items),
    77	            'parentJobId' => $parentJobId,
    78	        ]);
    79	
    80	        // 在庫変動履歴 1 件ごとに子ジョブを発行する (取引が transactionHeadId 単位で分割するのと同様)。
    81	        foreach ($items as $item) {
    82	            $this->processDispatcher->dispatch(
    83	                $action,
    84	                $item['id'],
    85	                $item['productId'],
    86	                $item['storeId'],
    87	                $event->getId(),
    88	                $parentJobId,
    89	            );
    90	        }
    91	    }
    92	
    93	    /**
    94	     * Webhook payload の `ids[]` から在庫変動履歴の明細を取り出す。
    95	     *
    96	     * payload 例:
    97	     *   { "ids": [ { "id": "1", "productId": "1", "storeId": "0" }, ... ] }
    98	     *
    99	     * id / productId / storeId のいずれかが欠けている要素は処理キーが揃わないため除外する。
   100	     *
   101	     * @return list<array{id:string,productId:string,storeId:string}>
   102	     */
   103	    private function extractStockChangeItems(SmaregiWebhookEvent $event): array
   104	    {
   105	        $body = $event->getRequestBody();
   106	        $raw = $body['ids'] ?? null;
   107	        if (!is_array($raw)) {
   108	            return [];
   109	        }
   110	
   111	        $items = [];
   112	        foreach ($raw as $row) {
   113	            if (!is_array($row)) {
   114	                continue;
   115	            }
   116	            $id = $this->stringOrNull($row['id'] ?? null);
   117	            $productId = $this->stringOrNull($row['productId'] ?? null);
   118	            $storeId = $this->stringOrNull($row['storeId'] ?? null);
   119	            if ($id === null || $productId === null || $storeId === null) {
   120	                $this->logger->warning('Smaregi stock id row is incomplete, skipped', [
   121	                    'webhookEventId' => $event->getId(),
   122	                    'row' => $row,
   123	                ]);
   124	
   125	                continue;
   126	            }
   127	            $items[] = ['id' => $id, 'productId' => $productId, 'storeId' => $storeId];
   128	        }
   129	
   130	        return $items;

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/SmaregiWebhookEvent.php | sed -n '1,260p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Entity;
    17	
    18	use Doctrine\DBAL\Types\Types;
    19	use Doctrine\ORM\Mapping as ORM;
    20	use Eccube\Repository\SmaregiWebhookEventRepository;
    21	
    22	#[ORM\Table(name: 'dtb_smaregi_webhook_request')]
    23	#[ORM\Index(name: 'idx_smaregi_event_id', columns: ['smaregi_event_id'])]
    24	#[ORM\Entity(repositoryClass: SmaregiWebhookEventRepository::class)]
    25	class SmaregiWebhookEvent extends AbstractEntity
    26	{
    27	    public const STATUS_PENDING = 'pending';
    28	    public const STATUS_PROCESSING = 'processing';
    29	    public const STATUS_COMPLETED = 'completed';
    30	    public const STATUS_FAILED = 'failed';
    31	
    32	    #[ORM\Column(name: 'id', type: Types::INTEGER, options: ['unsigned' => true, 'comment' => 'ID'])]
    33	    #[ORM\Id]
    34	    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    35	    private int $id;
    36	
    37	    #[ORM\Column(name: 'contract_id', type: Types::STRING, length: 32, options: ['comment' => '契約ID'])]
    38	    private string $contractId;
    39	
    40	    #[ORM\Column(name: 'smaregi_event_id', type: Types::STRING, length: 255, unique: true, options: ['comment' => 'スマレジイベントID'])]
    41	    private string $smaregiEventId;
    42	
    43	    #[ORM\Column(name: 'event', type: Types::STRING, length: 100, options: ['comment' => 'イベント'])]
    44	    private string $event;
    45	
    46	    #[ORM\Column(name: 'action', type: Types::STRING, length: 100, options: ['comment' => 'アクション'])]
    47	    private string $action;
    48	
    49	    /**
    50	     * @var array<string,array<string>>
    51	     */
    52	    #[ORM\Column(name: 'request_headers', type: Types::JSON, options: ['comment' => 'リクエストヘッダー'])]
    53	    private array $requestHeaders;
    54	
    55	    /**
    56	     * @var array<string,mixed>
    57	     */
    58	    #[ORM\Column(name: 'request_body', type: Types::JSON, options: ['comment' => 'リクエストボディ'])]
    59	    private array $requestBody;
    60	
    61	    #[ORM\Column(name: 'received_at', type: Types::DATETIME_MUTABLE, options: ['comment' => '受信日時'])]
    62	    private \DateTime $receivedAt;
    63	
    64	    #[ORM\Column(name: 'started_at', type: Types::DATETIME_MUTABLE, nullable: true, options: ['comment' => '開始日時'])]
    65	    private ?\DateTime $startedAt = null;
    66	
    67	    #[ORM\Column(name: 'completed_at', type: Types::DATETIME_MUTABLE, nullable: true, options: ['comment' => '完了日時'])]
    68	    private ?\DateTime $completedAt = null;
    69	
    70	    #[ORM\Column(name: 'status', type: Types::STRING, length: 100, options: ['comment' => 'ステータス'])]
    71	    private string $status = self::STATUS_PENDING;
    72	
    73	    /**
    74	     * 親 MessengerJob (Webhook 全体ジョブ) の ID。
    75	     * Webhook 受信時にメッセージ ({@see \Eccube\Message\SmaregiWebhookEventMessage}) を消化する
    76	     * MessageHandler が親 MessengerJob を発番してここに記録する。FK は貼らず、参照のみ。
    77	     */
    78	    #[ORM\Column(name: 'messenger_job_id', type: Types::INTEGER, nullable: true, options: ['unsigned' => true, 'comment' => '親 MessengerJob の ID'])]
    79	    private ?int $messengerJobId = null;
    80	
    81	    #[ORM\Column(name: 'create_date', type: Types::DATETIMETZ_MUTABLE)]
    82	    private \DateTime $createDate;
    83	
    84	    #[ORM\Column(name: 'update_date', type: Types::DATETIMETZ_MUTABLE)]
    85	    private \DateTime $updateDate;
    86	
    87	    public function getId(): int
    88	    {
    89	        return $this->id;
    90	    }
    91	
    92	    public function getContractId(): string
    93	    {
    94	        return $this->contractId;
    95	    }
    96	
    97	    public function setContractId(string $contractId): SmaregiWebhookEvent
    98	    {
    99	        $this->contractId = $contractId;
   100	
   101	        return $this;
   102	    }
   103	
   104	    public function getSmaregiEventId(): string
   105	    {
   106	        return $this->smaregiEventId;
   107	    }
   108	
   109	    public function setSmaregiEventId(string $smaregiEventId): SmaregiWebhookEvent
   110	    {
   111	        $this->smaregiEventId = $smaregiEventId;
   112	
   113	        return $this;
   114	    }
   115	
   116	    public function getEvent(): string
   117	    {
   118	        return $this->event;
   119	    }
   120	
   121	    public function setEvent(string $event): SmaregiWebhookEvent
   122	    {
   123	        $this->event = $event;
   124	
   125	        return $this;
   126	    }
   127	
   128	    public function getAction(): string
   129	    {
   130	        return $this->action;
   131	    }
   132	
   133	    public function setAction(string $action): SmaregiWebhookEvent
   134	    {
   135	        $this->action = $action;
   136	
   137	        return $this;
   138	    }
   139	
   140	    /**
   141	     * @return array<string,array<string>>
   142	     */
   143	    public function getRequestHeaders(): array
   144	    {
   145	        return $this->requestHeaders;
   146	    }
   147	
   148	    /**
   149	     * @param array<string,array<string>> $requestHeaders
   150	     */
   151	    public function setRequestHeaders(array $requestHeaders): SmaregiWebhookEvent
   152	    {
   153	        $this->requestHeaders = $requestHeaders;
   154	
   155	        return $this;
   156	    }
   157	
   158	    /**
   159	     * @return array<string,mixed>
   160	     */
   161	    public function getRequestBody(): array
   162	    {
   163	        return $this->requestBody;
   164	    }
   165	
   166	    /**
   167	     * @param array<string,mixed> $requestBody
   168	     */
   169	    public function setRequestBody(array $requestBody): SmaregiWebhookEvent
   170	    {
   171	        $this->requestBody = $requestBody;
   172	
   173	        return $this;
   174	    }
   175	
   176	    public function getReceivedAt(): \DateTime
   177	    {
   178	        return $this->receivedAt;
   179	    }
   180	
   181	    public function setReceivedAt(\DateTime $receivedAt): SmaregiWebhookEvent
   182	    {
   183	        $this->receivedAt = $receivedAt;
   184	
   185	        return $this;
   186	    }
   187	
   188	    public function getStartedAt(): ?\DateTime
   189	    {
   190	        return $this->startedAt;
   191	    }
   192	
   193	    public function setStartedAt(?\DateTime $startedAt): SmaregiWebhookEvent
   194	    {
   195	        $this->startedAt = $startedAt;
   196	
   197	        return $this;
   198	    }
   199	
   200	    public function getCompletedAt(): ?\DateTime
   201	    {
   202	        return $this->completedAt;
   203	    }
   204	
   205	    public function setCompletedAt(?\DateTime $completedAt): SmaregiWebhookEvent
   206	    {
   207	        $this->completedAt = $completedAt;
   208	
   209	        return $this;
   210	    }
   211	
   212	    public function getStatus(): string
   213	    {
   214	        return $this->status;
   215	    }
   216	
   217	    public function setStatus(string $status): SmaregiWebhookEvent
   218	    {
   219	        $this->status = $status;
   220	
   221	        return $this;
   222	    }
   223	
   224	    public function getMessengerJobId(): ?int
   225	    {
   226	        return $this->messengerJobId;
   227	    }
   228	
   229	    public function setMessengerJobId(?int $messengerJobId): SmaregiWebhookEvent
   230	    {
   231	        $this->messengerJobId = $messengerJobId;
   232	
   233	        return $this;
   234	    }
   235	
   236	    public function getCreateDate(): \DateTime
   237	    {
   238	        return $this->createDate;
   239	    }
   240	
   241	    public function setCreateDate(\DateTime $createDate): SmaregiWebhookEvent
   242	    {
   243	        $this->createDate = $createDate;
   244	
   245	        return $this;
   246	    }
   247	
   248	    public function getUpdateDate(): \DateTime
   249	    {
   250	        return $this->updateDate;
   251	    }
   252	
   253	    public function setUpdateDate(\DateTime $updateDate): SmaregiWebhookEvent
   254	    {
   255	        $this->updateDate = $updateDate;
   256	
   257	        return $this;
   258	    }
   259	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/TransactionEventDispatcher.php | sed -n '1,150p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Service\Smaregi\Webhook\Transaction;
    17	
    18	use Eccube\Entity\SmaregiWebhookEvent;
    19	use Eccube\Service\Smaregi\Webhook\Transaction\Handler\TransactionActionHandlerInterface;
    20	use Psr\Log\LoggerInterface;
    21	
    22	final readonly class TransactionEventDispatcher
    23	{
    24	    public const EVENT_NAME = 'pos:transactions';
    25	
    26	    /** @var array<string,TransactionActionHandlerInterface> */
    27	    private array $handlerMap;
    28	
    29	    /**
    30	     * @param iterable<TransactionActionHandlerInterface> $handlers
    31	     */
    32	    public function __construct(
    33	        iterable $handlers,
    34	        private LoggerInterface $logger,
    35	    ) {
    36	        $map = [];
    37	        foreach ($handlers as $handler) {
    38	            $action = $handler->getAction();
    39	            if (isset($map[$action])) {
    40	                $this->logger->warning('Smaregi transaction action handler is duplicated', [
    41	                    'action' => $action,
    42	                    'duplicate' => $handler::class,
    43	                    'kept' => $map[$action]::class,
    44	                ]);
    45	
    46	                continue;
    47	            }
    48	            $map[$action] = $handler;
    49	        }
    50	        $this->handlerMap = $map;
    51	    }
    52	
    53	    public function dispatch(SmaregiWebhookEvent $event, ?int $parentJobId = null): void
    54	    {
    55	        $eventName = $event->getEvent();
    56	        if ($eventName !== self::EVENT_NAME) {
    57	            // 当該イベントでなければ無視
    58	            return;
    59	        }
    60	
    61	        $action = $event->getAction();
    62	        $handler = $this->handlerMap[$action] ?? null;
    63	        if ($handler === null) {
    64	            // 未知actionは例外にせず後続バッチでの再連携余地を残すためログ警告のみで return する
    65	            $this->logger->warning('Smaregi transaction action has no handler', [
    66	                'webhookEventId' => $event->getId(),
    67	                'action' => $action,
    68	                'knownActions' => array_keys($this->handlerMap),
    69	            ]);
    70	
    71	            return;
    72	        }
    73	
    74	        $transactionHeadIds = $this->extractTransactionHeadIds($event);
    75	
    76	        $this->logger->info('Smaregi transaction action dispatching', [
    77	            'webhookEventId' => $event->getId(),
    78	            'action' => $action,
    79	            'transactionHeadIds' => $transactionHeadIds,
    80	            'parentJobId' => $parentJobId,
    81	        ]);
    82	
    83	        $handler->handle($event, $transactionHeadIds, $parentJobId);
    84	    }
    85	
    86	    /**
    87	     * @return list<string>
    88	     */
    89	    private function extractTransactionHeadIds(SmaregiWebhookEvent $event): array
    90	    {
    91	        $body = $event->getRequestBody();
    92	        $raw = $body['transactionHeadIds'] ?? null;
    93	        if (!is_array($raw)) {
    94	            return [];
    95	        }
    96	
    97	        $result = [];
    98	        foreach ($raw as $id) {
    99	            if (is_string($id) && $id !== '') {
   100	                $result[] = $id;
   101	
   102	                continue;
   103	            }
   104	            if (is_int($id)) {
   105	                $result[] = (string) $id;
   106	            }
   107	        }
   108	
   109	        return $result;
   110	    }
   111	}

exec
/bin/bash -lc "rg -n \"setRequestBody\\(|request_body|requestBody\" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine /home/y-saito/Developments/ec-cube-enterprise/app 2>/dev/null" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 113ms:
codex
有効JSONだが`transactionHeadIds`が無いケースは、設計では「取引ヘッダ不足」で500相当ですが、実装はイベント保存後に後段で警告だけになりそうです。該当ハンドラの空配列処理を確認します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/CanceledHandler.php | sed -n '1,90p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Service\Smaregi\Webhook\Transaction\Handler;
    17	
    18	use Eccube\Entity\SmaregiWebhookEvent;
    19	use Eccube\Service\Smaregi\Webhook\Transaction\SmaregiTransactionProcessDispatcher;
    20	use Psr\Log\LoggerInterface;
    21	
    22	/**
    23	 * canceled (取消) action のディスパッチャ。
    24	 *
    25	 * 取引取得 API 呼出と取消反映処理は子 MessengerJob
    26	 * ({@see \Eccube\MessageHandler\SmaregiTransactionProcessMessageHandler}) に委譲し、
    27	 * 本 Handler は transactionHeadId 単位で子ジョブを enqueue する責務のみを持つ。
    28	 */
    29	final readonly class CanceledHandler implements TransactionActionHandlerInterface
    30	{
    31	    public const ACTION = 'canceled';
    32	
    33	    public function __construct(
    34	        private LoggerInterface $logger,
    35	        private SmaregiTransactionProcessDispatcher $processDispatcher,
    36	    ) {
    37	    }
    38	
    39	    public function getAction(): string
    40	    {
    41	        return self::ACTION;
    42	    }
    43	
    44	    public function handle(SmaregiWebhookEvent $event, array $transactionHeadIds, ?int $parentJobId = null): void
    45	    {
    46	        if ($transactionHeadIds === []) {
    47	            $this->logger->warning('Smaregi canceled webhook has no transactionHeadIds', [
    48	                'webhookEventId' => $event->getId(),
    49	            ]);
    50	
    51	            return;
    52	        }
    53	
    54	        foreach ($transactionHeadIds as $transactionHeadId) {
    55	            $this->processDispatcher->dispatch($event, self::ACTION, $transactionHeadId, $parentJobId);
    56	        }
    57	    }
    58	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/CreatedHandler.php | sed -n '1,100p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Service\Smaregi\Webhook\Transaction\Handler;
    17	
    18	use Eccube\Entity\SmaregiWebhookEvent;
    19	use Eccube\Service\Smaregi\Webhook\Transaction\SmaregiTransactionProcessDispatcher;
    20	use Psr\Log\LoggerInterface;
    21	
    22	/**
    23	 * created action のディスパッチャ。
    24	 *
    25	 * 設計変更 (2026-06-04): 取引取得 API 呼出と Pattern Handler 実行は同期実行から
    26	 * 子 MessengerJob ({@see \Eccube\MessageHandler\SmaregiTransactionProcessMessageHandler}) に委譲。
    27	 * 本 Handler は transactionHeadId 単位で子ジョブを enqueue する責務のみを持ち、
    28	 * 親 (Webhook 全体) と子 (取引 1 件) の MessengerJob で進捗を可視化する。
    29	 */
    30	final readonly class CreatedHandler implements TransactionActionHandlerInterface
    31	{
    32	    public const ACTION = 'created';
    33	
    34	    public function __construct(
    35	        private LoggerInterface $logger,
    36	        private SmaregiTransactionProcessDispatcher $processDispatcher,
    37	    ) {
    38	    }
    39	
    40	    public function getAction(): string
    41	    {
    42	        return self::ACTION;
    43	    }
    44	
    45	    public function handle(SmaregiWebhookEvent $event, array $transactionHeadIds, ?int $parentJobId = null): void
    46	    {
    47	        if ($transactionHeadIds === []) {
    48	            $this->logger->warning('Smaregi created webhook has no transactionHeadIds', [
    49	                'webhookEventId' => $event->getId(),
    50	            ]);
    51	
    52	            return;
    53	        }
    54	
    55	        foreach ($transactionHeadIds as $transactionHeadId) {
    56	            $this->processDispatcher->dispatch($event, self::ACTION, $transactionHeadId, $parentJobId);
    57	        }
    58	    }
    59	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/DisposedHandler.php | sed -n '1,90p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Service\Smaregi\Webhook\Transaction\Handler;
    17	
    18	use Eccube\Entity\SmaregiWebhookEvent;
    19	use Eccube\Service\Smaregi\Webhook\Transaction\SmaregiTransactionProcessDispatcher;
    20	use Psr\Log\LoggerInterface;
    21	
    22	/**
    23	 * disposed (廃棄返品) action のディスパッチャ。
    24	 *
    25	 * 取引取得 API 呼出と返品反映処理は子 MessengerJob
    26	 * ({@see \Eccube\MessageHandler\SmaregiTransactionProcessMessageHandler}) に委譲し、
    27	 * 本 Handler は transactionHeadId 単位で子ジョブを enqueue する責務のみを持つ。
    28	 */
    29	final readonly class DisposedHandler implements TransactionActionHandlerInterface
    30	{
    31	    public const ACTION = 'disposed';
    32	
    33	    public function __construct(
    34	        private LoggerInterface $logger,
    35	        private SmaregiTransactionProcessDispatcher $processDispatcher,
    36	    ) {
    37	    }
    38	
    39	    public function getAction(): string
    40	    {
    41	        return self::ACTION;
    42	    }
    43	
    44	    public function handle(SmaregiWebhookEvent $event, array $transactionHeadIds, ?int $parentJobId = null): void
    45	    {
    46	        if ($transactionHeadIds === []) {
    47	            $this->logger->warning('Smaregi disposed webhook has no transactionHeadIds', [
    48	                'webhookEventId' => $event->getId(),
    49	            ]);
    50	
    51	            return;
    52	        }
    53	
    54	        foreach ($transactionHeadIds as $transactionHeadId) {
    55	            $this->processDispatcher->dispatch($event, self::ACTION, $transactionHeadId, $parentJobId);
    56	        }
    57	    }
    58	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Request/Context.php | sed -n '90,125p' && nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/InvalidLocaleRedirectListener.php | sed -n '40,75p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
    90	        if (is_string($controller) && str_contains($controller, '::')) {
    91	            [$className] = explode('::', $controller, 2);
    92	            if (str_starts_with($className, 'Eccube\Controller\App\\')) {
    93	                return true;
    94	            }
    95	        }
    96	
    97	        return false;
    98	    }
    99	
   100	    /**
   101	     * スマレジ Webhook へのアクセスかどうか.
   102	     */
   103	    public function isSmaregiWebhook(): bool
   104	    {
   105	        $request = $this->requestStack->getMainRequest();
   106	        if ($request === null) {
   107	            return false;
   108	        }
   109	        if ($request->attributes->get('_route') === 'smaregi_webhook') {
   110	            return true;
   111	        }
   112	        $pathInfo = \rawurldecode($request->getPathInfo());
   113	        $webhookPath = $this->eccubeConfig->get('eccube_smaregi_webhook_route');
   114	        $webhookPath = '/'.\trim((string) $webhookPath, '/').'/';
   115	
   116	        return str_starts_with($pathInfo, $webhookPath);
   117	    }
   118	
   119	    public function getMainRequest(): ?Request
   120	    {
   121	        return $this->requestStack->getMainRequest();
   122	    }
   123	
   124	    /**
   125	     * E2E/PlaywrightのFixtureかどうか.
    40	    private readonly string $messengerRoute;
    41	    private readonly string $smaregiWebhookRoute;
    42	    private readonly Context $requestContext;
    43	
    44	    public function __construct(EccubeConfig $eccubeConfig, Context $requestContext)
    45	    {
    46	        $this->validLocales = explode('|', $eccubeConfig->get('app_locales') ?? 'ja|en');
    47	        $this->defaultLocale = $eccubeConfig->get('locale') ?? 'ja';
    48	        $this->adminRoute = $eccubeConfig->get('eccube_admin_route') ?? '';
    49	        $this->messengerRoute = $eccubeConfig->get('eccube_messenger_route') ?? 'messenger';
    50	        $this->smaregiWebhookRoute = $eccubeConfig->get('eccube_smaregi_webhook_route') ?? '';
    51	        $this->requestContext = $requestContext;
    52	    }
    53	
    54	    #[\Override]
    55	    public static function getSubscribedEvents(): array
    56	    {
    57	        return [
    58	            // Context::isAppApi() がコントローラー基準（_controller属性）で判定するため、優先度31で実行する
    59	            KernelEvents::REQUEST => ['onKernelRequest', 31],
    60	        ];
    61	    }
    62	
    63	    public function onKernelRequest(RequestEvent $event): void
    64	    {
    65	        if (!$event->isMainRequest()) {
    66	            return;
    67	        }
    68	
    69	        $pathInfo = $event->getRequest()->getPathInfo();
    70	
    71	        // ルートパス、管理画面の場合は何もしない
    72	        if ($pathInfo === '/' || ($this->adminRoute && str_starts_with($pathInfo, '/'.$this->adminRoute))) {
    73	            return;
    74	        }
    75	

codex
レスポンスヘッダ差分は候補自身がUNCERTAINなので、グローバルなresponse listenerや設定で付与されていないかを最低限検索します。ここが確認できれば、根拠不備ではなく確認済み差分に寄せられます。
exec
/bin/bash -lc "rg -n \"Access-Control-Allow-Origin|Cache-Control|no-cache|no-store|kernel\\.response|ResponseEvent|set\\('Cache-Control'|headers->set\\('Cache|headers->set\\('Access-Control\" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /home/y-saito/Developments/ec-cube-enterprise/app/config /home/y-saito/Developments/ec-cube-enterprise/app/Customize 2>/dev/null" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "rg -n \"event_dispatcher|kernel\\.response|ResponseListener|Cache-Control|Access-Control-Allow-Origin\" /home/y-saito/Developments/ec-cube-enterprise/app/config /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/DependencyInjection /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener 2>/dev/null" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc 'rg -n "function gainPoints|function spendPoints|transactionId|PointHistory" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 115ms:
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/twig.yaml:5:      event_dispatcher: '@event_dispatcher'

 succeeded in 136ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/LogListener.php:22:use Symfony\Component\HttpKernel\Event\ResponseEvent;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/LogListener.php:97:    public function onKernelResponse(ResponseEvent $event): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/CSPHeaderListener.php:20:use Symfony\Component\HttpKernel\Event\ResponseEvent;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/CSPHeaderListener.php:53:    public function onKernelResponse(ResponseEvent $event): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/MaintenanceListener.php:21:use Symfony\Component\HttpKernel\Event\ResponseEvent;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/MaintenanceListener.php:38:    public function onResponse(ResponseEvent $event): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/TenantController.php:433:                    'Access-Control-Allow-Origin' => '*',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Mall/TenantController.php:462:                    'Access-Control-Allow-Origin' => '*',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:1709:            'Access-Control-Allow-Origin' => '*',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:1724:            'Access-Control-Allow-Origin' => '*',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:1739:            'Access-Control-Allow-Origin' => '*',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:1754:            'Access-Control-Allow-Origin' => '*',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:1780:            'Access-Control-Allow-Origin' => '*',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/AbstractDeckBuilderController.php:61:        $response->headers->set('Access-Control-Allow-Methods', $this->getAllowedMethods());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/AbstractDeckBuilderController.php:62:        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, jwt-token');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/AbstractDeckBuilderController.php:68:            $response->headers->set('Access-Control-Allow-Origin', $origin);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/PointGranterController.php:125:            'Access-Control-Allow-Origin' => '*',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerEditController.php:334:        $response->headers->set('Cache-Control', 'private, no-store');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Session/Storage/Handler/SameSiteNoneCompatSessionHandler.php:53:            header(sprintf('Cache-Control: max-age=%d, private, must-revalidate', 60 * (int) ini_get('session.cache_expire')));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_status_sync.script.twig:16:            cache: 'no-store',

 succeeded in 111ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:24:use Eccube\Entity\DtbPointHistory;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:29: * @extends AbstractRepository<DtbPointHistory>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:31:class DtbPointHistoryRepository extends AbstractRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:38:        parent::__construct($registry, DtbPointHistory::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:46:    public function existsByTransactionId(int $transactionId): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:50:            ->where('ph.transactionId = :transactionId')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:51:            ->setParameter('transactionId', $transactionId)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:64:     * @return list<DtbPointHistory>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:66:    public function findPointOnlyByTransactionId(int $transactionId): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:68:        /** @var list<DtbPointHistory> $result */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:70:            ->where('ph.transactionId = :transactionId')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:72:            ->setParameter('transactionId', $transactionId)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:159:    //     $history = new DtbPointHistory();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:176:    public function getNextDeadlinePointHistory(DtbPlayer $player): ?DtbPointHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:192:        $deadlinePointHistory = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:193:        $previousPointHistory = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:197:            $totalSameDatePreviousPoint = $this->isSameDatePointHistory($pointHistory, $previousPointHistory) ? $totalSameDatePreviousPoint : 0;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:201:                $deadlinePointHistory = (clone $pointHistory)->setPointChange($currentPoint + $pointHistory->getPointChange() + $totalSameDatePreviousPoint);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:206:            $totalSameDatePreviousPoint = $this->isSameDatePointHistory($pointHistory, $previousPointHistory)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:209:            $previousPointHistory = $pointHistory;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:212:        return $deadlinePointHistory;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:284:    private function isSameDatePointHistory(DtbPointHistory $pointHistory, ?DtbPointHistory $anotherPointHistory): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:286:        return !is_null($anotherPointHistory) && $pointHistory->getIssueDate()->format('Ymd') === $anotherPointHistory->getIssueDate()->format('Ymd');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:402:    public function hasSpendPointHistoryForOrder(Order $Order): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:20:use Eccube\Entity\DtbPointHistory;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:25:use Eccube\Service\EntityManager\PointHistoryEntityManager;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:32:        private readonly PointHistoryEntityManager $pointHistoryEntityManager,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:40:     * @param ?int $transactionId スマレジ取引由来の場合に履歴へ記録する取引ID (冪等性判定用)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:42:    public function gainPoints(Order $Order, ?int $transactionId = null): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:71:            $transactionId
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:78:     * @param ?int $transactionId スマレジ取引由来の場合に履歴へ記録する取引ID (冪等性判定用)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:80:    public function spendPoints(Order $Order, ?int $transactionId = null): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:82:        $this->changeSpentPoints($Order, -1, $transactionId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:113:            ->getRepository(DtbPointHistory::class)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:115:        foreach ($PointHistories as $PointHistory) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:116:            $pointDiffTotal += (int) $PointHistory->getPointChange();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:117:            $this->entityManager->remove($PointHistory);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:128:    private function changeSpentPoints(Order $Order, int $sign, ?int $transactionId = null): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:158:            $transactionId
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:20:use Eccube\Entity\DtbPointHistory;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:24:class PointHistoryEntityManager
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:33:     * @param DtbPointHistory|null $PointHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:40:     * @param int|null $transactionId
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:45:        ?DtbPointHistory $PointHistory,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:52:        ?int $transactionId,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:54:        if ($PointHistory === null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:55:            $PointHistory = new DtbPointHistory();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:58:        $PointHistory->setCustomer($Customer)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:62:            $PointHistory->setOrder($Order);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:65:            $PointHistory->setPointType($PointType);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:68:            $PointHistory->setPointChange($pointChange);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:71:            $PointHistory->setNote($note);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:73:        if ($transactionId !== null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:74:            $PointHistory->setTransactionId($transactionId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:77:        $this->entityManager->persist($PointHistory);

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php | sed -n '40,82p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
    40	
    41	    /**
    42	     * 指定したスマレジ取引IDのポイント履歴が既に存在するか判定する.
    43	     *
    44	     * スマレジ取引由来のポイント付与の冪等性担保 (Webhook 再送・補完取得バッチでの重複付与防止) に使う。
    45	     */
    46	    public function existsByTransactionId(int $transactionId): bool
    47	    {
    48	        $count = (int) $this->createQueryBuilder('ph')
    49	            ->select('COUNT(ph.id)')
    50	            ->where('ph.transactionId = :transactionId')
    51	            ->setParameter('transactionId', $transactionId)
    52	            ->getQuery()
    53	            ->getSingleScalarResult();
    54	
    55	        return $count > 0;
    56	    }
    57	
    58	    /**
    59	     * 指定したスマレジ取引IDの「ポイント専用取引」(受注に紐付かない = order_id が NULL) のポイント履歴を取得する.
    60	     *
    61	     * 受注由来 (order_id 有り) のポイント履歴と区別し、ポイント専用取引 (取引区分6/7) の
    62	     * 取消/打消による差し戻し対象のみを抽出するために使う。
    63	     *
    64	     * @return list<DtbPointHistory>
    65	     */
    66	    public function findPointOnlyByTransactionId(int $transactionId): array
    67	    {
    68	        /** @var list<DtbPointHistory> $result */
    69	        $result = $this->createQueryBuilder('ph')
    70	            ->where('ph.transactionId = :transactionId')
    71	            ->andWhere('ph.Order IS NULL')
    72	            ->setParameter('transactionId', $transactionId)
    73	            ->orderBy('ph.id', 'ASC')
    74	            ->getQuery()
    75	            ->getResult();
    76	
    77	        return $result;
    78	    }
    79	
    80	    /**
    81	     * 顧客が持つポイント履歴を取得
    82	     */

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/CSPHeaderListener.php | sed -n '45,75p'; nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/LogListener.php | sed -n '90,110p'; nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/MaintenanceListener.php | sed -n '32,50p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
    45	
    46	            // 1. Nonceを生成
    47	            $this->nonce = base64_encode(random_bytes(16));
    48	            $this->twig->addGlobal('csp_nonce', $this->nonce);
    49	            $this->initialized = true;
    50	        }
    51	    }
    52	
    53	    public function onKernelResponse(ResponseEvent $event): void
    54	    {
    55	        $response = $event->getResponse();
    56	        $cspEnable = $this->eccubeConfig->get('eccube_content_security_policy_enabled');
    57	        if ($cspEnable) {
    58	            if ($this->context->isAdmin()) {
    59	                $csp = " script-src 'self' blob: 'nonce-$this->nonce'";
    60	
    61	                $cspEnableResources = $this->eccubeConfig->get('eccube_content_security_policy_enabled_resources');
    62	                if ($cspEnableResources) {
    63	                    foreach ($cspEnableResources as $v) {
    64	                        $csp = $csp." $v";
    65	                    }
    66	                }
    67	                if ($this->kernel->getEnvironment() === 'dev') {
    68	                    $projectDir = $this->kernel->getProjectDir();
    69	                    $path = $projectDir.'/app/config/eccube/packages/dev/web_profiler.yaml';
    70	                    $data = Yaml::parseFile($path);
    71	                    if ($data['web_profiler']['toolbar']) {
    72	                        $csp = $csp." 'unsafe-eval'";
    73	                    }
    74	                }
    75	                $response->headers->set('Content-Security-Policy', $csp.' ;');
    90	            return;
    91	        }
    92	
    93	        $route = $this->getRoute($event->getRequest());
    94	        $this->logger->debug('LOGIC START', [$route]);
    95	    }
    96	
    97	    public function onKernelResponse(ResponseEvent $event): void
    98	    {
    99	        if (!$event->isMainRequest()) {
   100	            return;
   101	        }
   102	
   103	        $route = $this->getRoute($event->getRequest());
   104	        $this->logger->debug('LOGIC END', [$route]);
   105	    }
   106	
   107	    public function onKernelTerminate(TerminateEvent $event): void
   108	    {
   109	        $route = $this->getRoute($event->getRequest());
   110	        $this->logger->debug('PROCESS END', [$route]);
    32	    {
    33	        return [
    34	            KernelEvents::RESPONSE => ['onResponse'],
    35	        ];
    36	    }
    37	
    38	    public function onResponse(ResponseEvent $event): void
    39	    {
    40	        $response = $event->getResponse();
    41	
    42	        if (!$this->systemService->isMaintenanceMode()) {
    43	            $response->headers->clearCookie(SystemService::MAINTENANCE_TOKEN_KEY);
    44	
    45	            return;
    46	        }
    47	
    48	        $user = $this->requestContext->getCurrentUser();
    49	        if ($user instanceof Member && $this->requestContext->isAdmin()) {
    50	            $cookie = (new Cookie(

codex
FALSE_POSITIVE は確認できませんでした。主要候補は概ね実装根拠あり。ただし1件は根拠の扱いが弱く、重要な見落としが複数あります。

種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応
- WEAK_EVIDENCE | ④DBカラム・DB操作（注文サブ） | `dtb_order_sub` 不在を「確定差分」とするのは弱い。設計自身が移行先は「実装で要確認」としており、正本上も未確定項目。 | [a05-04 HTML](/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/a05-04_api_order_order_smaregi_receive.html:281), [Markdown](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/a05-04_api_order_order_smaregi_receive.md:195) | findingはCONFIRMEDではなく「要確認/open item」または低重要度へ落とす。
- MISSED | ログ・監査 | 設計は連携用ヘッダ/Cookie完全値をログ出力禁止としているが、実装は受信時・認証失敗時に全headersとcontentをログへ出す。`X_access_token`、Cookie、秘密ヘッダ混入の可能性がある。 | [設計HTML](/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/a05-04_api_order_order_smaregi_receive.html:292), [WebhookController.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Smaregi/WebhookController.php:44), [WebhookController.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Smaregi/WebhookController.php:52) | 高優先でfinding追加。ログ前に認証/連携ヘッダ・Cookie・本文内機微値をマスクする。
- MISSED | バリデーション/エラー処理 | 設計は取引ヘッダ不足を500相当としているが、実装は`transactionHeadIds`欠落時に後段ハンドラで警告してreturnし、親ジョブは完了扱いになり得る。HTTP応答も受信時点では200。 | [設計HTML](/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/a05-04_api_order_order_smaregi_receive.html:257), [TransactionEventDispatcher.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/TransactionEventDispatcher.php:89), [CreatedHandler.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/CreatedHandler.php:47), [SmaregiWebhookEventMessageHandler.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiWebhookEventMessageHandler.php:104) | finding追加。欠落時の期待ステータスを設計/実装どちらへ合わせるか決める。
- MISSED | 排他制御・トランザクション | 設計は明示的な悲観/楽観ロックなしとしているが、実装は会員ポイント更新で明示トランザクションと`PESSIMISTIC_WRITE`を使う。冪等性・デッドロック・待機挙動に関わる差分。 | [設計HTML](/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/a05-04_api_order_order_smaregi_receive.html:297), [SmaregiOrderPointApplier.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:99), [SmaregiPointAdjustmentApplier.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:132) | finding追加。設計を現行実装に合わせるか、ロック不要仕様なら実装差分として扱う。

VERDICT: false_positive=0, missed=3, weak_evidence=1, 総合=要修正
tokens used
132,958
FALSE_POSITIVE は確認できませんでした。主要候補は概ね実装根拠あり。ただし1件は根拠の扱いが弱く、重要な見落としが複数あります。

種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応
- WEAK_EVIDENCE | ④DBカラム・DB操作（注文サブ） | `dtb_order_sub` 不在を「確定差分」とするのは弱い。設計自身が移行先は「実装で要確認」としており、正本上も未確定項目。 | [a05-04 HTML](/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/a05-04_api_order_order_smaregi_receive.html:281), [Markdown](/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/a05-04_api_order_order_smaregi_receive.md:195) | findingはCONFIRMEDではなく「要確認/open item」または低重要度へ落とす。
- MISSED | ログ・監査 | 設計は連携用ヘッダ/Cookie完全値をログ出力禁止としているが、実装は受信時・認証失敗時に全headersとcontentをログへ出す。`X_access_token`、Cookie、秘密ヘッダ混入の可能性がある。 | [設計HTML](/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/a05-04_api_order_order_smaregi_receive.html:292), [WebhookController.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Smaregi/WebhookController.php:44), [WebhookController.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Smaregi/WebhookController.php:52) | 高優先でfinding追加。ログ前に認証/連携ヘッダ・Cookie・本文内機微値をマスクする。
- MISSED | バリデーション/エラー処理 | 設計は取引ヘッダ不足を500相当としているが、実装は`transactionHeadIds`欠落時に後段ハンドラで警告してreturnし、親ジョブは完了扱いになり得る。HTTP応答も受信時点では200。 | [設計HTML](/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/a05-04_api_order_order_smaregi_receive.html:257), [TransactionEventDispatcher.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/TransactionEventDispatcher.php:89), [CreatedHandler.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/CreatedHandler.php:47), [SmaregiWebhookEventMessageHandler.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiWebhookEventMessageHandler.php:104) | finding追加。欠落時の期待ステータスを設計/実装どちらへ合わせるか決める。
- MISSED | 排他制御・トランザクション | 設計は明示的な悲観/楽観ロックなしとしているが、実装は会員ポイント更新で明示トランザクションと`PESSIMISTIC_WRITE`を使う。冪等性・デッドロック・待機挙動に関わる差分。 | [設計HTML](/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/a05-04_api_order_order_smaregi_receive.html:297), [SmaregiOrderPointApplier.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:99), [SmaregiPointAdjustmentApplier.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:132) | finding追加。設計を現行実装に合わせるか、ロック不要仕様なら実装差分として扱う。

VERDICT: false_positive=0, missed=3, weak_evidence=1, 総合=要修正

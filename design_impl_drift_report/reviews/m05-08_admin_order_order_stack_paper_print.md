OpenAI Codex v0.142.5
--------
workdir: /home/y-saito/Developments/hareruya-design-docs
model: gpt-5.5
provider: openai
approval: never
sandbox: read-only
reasoning effort: medium
reasoning summaries: none
session id: 019f26aa-5f6d-7822-9655-1c481ec2af83
--------
user
あなたは設計書vs実装の差分監査に対する**批判的レビュア**です。読み取り専用で検証してください。創作禁止・確認できないものは「確認不能」と明記。

## 対象機能: m05-08_admin_order_order_stack_paper_print
- 差分候補JSON(検証対象): /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-08_admin_order_order_stack_paper_print.json
- 設計書HTML(正): /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/m05-08_admin_order_order_stack_paper_print.html
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
差分候補と対象設計書、実装参照を読み取り専用で確認します。まず JSON の findings と参照先の周辺行を把握して、そこから必要な実装ルートを絞ります。
exec
/bin/bash -lc "jq '.' /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-08_admin_order_order_stack_paper_print.json" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
{
  "functionId": "m05-08_admin_order_order_stack_paper_print",
  "title": "m05-08_admin_order_order_stack_paper_print（受注管理 — スタック用紙印刷）",
  "domain": "m05",
  "kind": "admin",
  "designHtml": "function_spec_html_preview/pf-eccube3/m05-08_admin_order_order_stack_paper_print.html",
  "findings": [
    {
      "dimension": "④DBカラム・DB操作・テーブル",
      "severity": "low",
      "designRef": "function_spec_html_preview/pf-eccube3/m05-08_admin_order_order_stack_paper_print.html:239",
      "designQuote": "各行について `order_no` が空ならHTTP400でJSON「注文番号が未採番の注文があります。」を返し",
      "implRef": "src/Eccube/Controller/Admin/Order/OrderController.php:887",
      "difference": "設計は未採番判定の対象キーを `order_no` と表記するが、実装は `$Order['order_number']` を判定し、SQL(getPrintOrderList)は `o.order_number` を `order_number` として選択（OrderRepository.php:1326,1349）。挙動は同一で、実装が正しいenterprise列名(dtb_order.order_number)を用い、設計の `order_no` 表記が不正確な細部相違。設計は自ら『DBカラム名はenterpriseを正』とする（HTML:225-227）ため設計内でも表記が不整合。バリデーション節(HTML:269)・エラー処理節でも同様に `order_no` と表記。",
      "confidence": "low",
      "verdict": "CONFIRMED",
      "evidence": "OrderController.php:887 `if (empty($Order['order_number']))`; OrderRepository.php:1326 `, o.order_number` および 1349 `addScalarResult('order_number', 'order_number')`; 設計HTML:239,269 は `order_no` と表記"
    },
    {
      "dimension": "④DBカラム・DB操作・テーブル",
      "severity": "low",
      "designRef": "function_spec_html_preview/pf-eccube3/m05-08_admin_order_order_stack_paper_print.html:265",
      "designQuote": "本機能は参照系（検索・出力）であり、DBへの登録・更新・削除は行わない。",
      "implRef": "src/Eccube/Service/Admin/Order/UpdateStackListAction.php:49",
      "difference": "設計『DB操作』節(HTML:265)はテンプレ的に『登録・更新・削除は行わない（参照系のみ）』と記すが、実装 UpdateStackListAction は browser_print_flg(setBrowserPrintFlg)、条件付きで order_status(PICKING)・confirm_date、member を実際にsetしflush/commitでUPDATEする。ただし設計の処理フロー節(HTML:239)・DBカラム節(HTML:261-263)・副作用行(HTML:259)は更新を明記しており、実装はそれら主要節と整合。DB操作節の記述が設計内で自己矛盾しているのみで実装欠陥ではない。",
      "confidence": "med",
      "verdict": "CONFIRMED",
      "evidence": "UpdateStackListAction.php:49 setBrowserPrintFlg(true), :52 setOrderStatus(PICKING), :53 setConfirmDate, :56 setMember, :60 flush, :61 commit（実際にUPDATE/commit）。設計HTML:265 は『DBへの登録・更新・削除は行わない』と記す一方、HTML:239/261-263/259 は更新を明記し自己矛盾"
    }
  ]
}

exec
/bin/bash -lc 'rg -n "" function_spec_html_preview/pf-eccube3/m05-08_admin_order_order_stack_paper_print.html' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
1:<!doctype html>
2:<html lang="ja">
3:<head>
4:  <meta charset="utf-8">
5:  <meta name="viewport" content="width=device-width, initial-scale=1">
6:  <title>m05-08_admin_order_order_stack_paper_print（受注管理 — スタック用紙印刷） - 機能仕様書</title>
7:  <style>
8::root {
9:  --bg: #ffffff;
10:  --panel: #fffdf8;
11:  --text: #2b2a26;
12:  --muted: #7a756a;
13:  --line: #d6cdbd;
14:  --line-soft: #ebe2d3;
15:  --band: #f3ede1;
16:  --clay: #c25a37;
17:  --clay-soft: #f4e6dd;
18:  --olive: #5f7048;
19:  --olive-soft: #e9ecdf;
20:}
21:* { box-sizing: border-box; }
22:body {
23:  margin: 0;
24:  background: var(--bg);
25:  color: var(--text);
26:  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Yu Gothic", Meiryo, sans-serif;
27:  font-size: 14px;
28:  line-height: 1.7;
29:}
30:.page {
31:  display: grid;
32:  grid-template-columns: 280px minmax(0, 1fr);
33:  gap: 32px;
34:  max-width: 1480px;
35:  margin: 0 auto;
36:  padding: 28px 28px 64px;
37:}
38:.sidebar {
39:  position: sticky;
40:  top: 24px;
41:  align-self: start;
42:  max-height: calc(100vh - 48px);
43:  overflow-y: auto;
44:  padding-right: 12px;
45:  border-right: 1px solid var(--line-soft);
46:}
47:.sidebar-title {
48:  margin: 0 0 10px;
49:  color: var(--muted);
50:  font-size: 12px;
51:  font-weight: 700;
52:  letter-spacing: .06em;
53:  text-transform: uppercase;
54:}
55:.toc a {
56:  display: block;
57:  padding: 4px 0 4px 12px;
58:  border-left: 2px solid var(--line-soft);
59:  color: var(--muted);
60:  text-decoration: none;
61:}
62:.toc a:hover { color: var(--clay); border-left-color: var(--clay); }
63:.toc .lv3 { padding-left: 24px; font-size: 13px; }
64:.doc-content { min-width: 0; }
65:header.page-header {
66:  margin-bottom: 24px;
67:  padding-bottom: 18px;
68:  border-bottom: 1px solid var(--line);
69:}
70:.crumb {
71:  margin: 0 0 8px;
72:  color: var(--muted);
73:  font-size: 13px;
74:}
75:h1 { margin: 0; font-size: 28px; line-height: 1.3; }
76:h2 {
77:  margin: 34px 0 12px;
78:  padding-bottom: 7px;
79:  border-bottom: 2px solid var(--clay);
80:  font-size: 21px;
81:}
82:h3 { margin: 26px 0 10px; font-size: 17px; color: var(--olive); }
83:h4 { margin: 20px 0 8px; font-size: 15px; color: var(--muted); }
84:p { margin: 9px 0; }
85:a { color: var(--clay); }
86:code {
87:  padding: 1px 5px;
88:  border-radius: 5px;
89:  background: var(--band);
90:  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
91:  font-size: 90%;
92:}
93:pre {
94:  overflow-x: auto;
95:  padding: 12px 14px;
96:  border: 1px solid var(--line);
97:  border-radius: 8px;
98:  background: var(--panel);
99:}
100:pre code { padding: 0; background: transparent; }
101:hr { margin: 26px 0; border: 0; border-top: 1px solid var(--line); }
102:ul, ol { margin: 9px 0; padding-left: 26px; }
103:li { margin: 3px 0; }
104:.table-wrap {
105:  overflow-x: auto;
106:  margin: 14px 0 22px;
107:  border: 1px solid var(--line);
108:  border-radius: 8px;
109:  background: var(--panel);
110:}
111:table {
112:  width: 100%;
113:  min-width: 760px;
114:  border-collapse: collapse;
115:  font-size: 13px;
116:}
117:th, td {
118:  border: 1px solid var(--line-soft);
119:  padding: 7px 9px;
120:  text-align: left;
121:  vertical-align: top;
122:}
123:th {
124:  position: sticky;
125:  top: 0;
126:  background: var(--band);
127:  font-weight: 700;
128:  white-space: nowrap;
129:}
130:tbody tr:nth-child(even) { background: #fffaf0; }
131:.screen-item-table table { min-width: 1120px; }
132:.section-row td {
133:  background: var(--olive-soft);
134:  color: var(--olive);
135:  font-weight: 700;
136:}
137:.tabbed-note {
138:  white-space: pre-wrap;
139:  overflow-x: auto;
140:  padding: 10px 12px;
141:  border-left: 3px solid var(--olive);
142:  background: var(--panel);
143:}
144:details {
145:  margin: 34px 0 12px;
146:}
147:details > summary {
148:  cursor: pointer;
149:  padding-bottom: 7px;
150:  border-bottom: 2px solid var(--clay);
151:  font-size: 21px;
152:  font-weight: 700;
153:  list-style: revert;
154:}
155:details[open] > summary { margin-bottom: 12px; }
156:footer {
157:  margin-top: 48px;
158:  padding-top: 16px;
159:  border-top: 1px solid var(--line);
160:  color: var(--muted);
161:  font-size: 12px;
162:}
163:@media (max-width: 900px) {
164:  .page { display: block; padding: 20px 16px 48px; }
165:  .sidebar {
166:    position: static;
167:    max-height: none;
168:    margin-bottom: 24px;
169:    padding-right: 0;
170:    border-right: 0;
171:    border-bottom: 1px solid var(--line-soft);
172:    padding-bottom: 16px;
173:  }
174:  h1 { font-size: 23px; }
175:}
176:  </style>
177:</head>
178:<body>
179:  <div class="page">
180:    <aside class="sidebar">
181:      <p class="sidebar-title">On this page</p>
182:      <nav class="toc"><a class="lv2" href="#概要">概要</a>
183:<a class="lv2" href="#リニューアル移行時の扱い">リニューアル移行時の扱い</a>
184:<a class="lv2" href="#利用者視点の入口">利用者視点の入口</a>
185:<a class="lv2" href="#フロント挙動">フロント挙動</a>
186:<a class="lv2" href="#処理フロー">処理フロー</a>
187:<a class="lv3" href="#子ウィンドウを開いてHTMLを表示する-admin-order-print-stack-window">子ウィンドウを開いてHTMLを表示する（`admin_order_print_stack_window`）</a>
188:<a class="lv3" href="#印刷予約を記録する-admin-order-print-stack">印刷予約を記録する（`admin_order_print_stack`）</a>
189:<a class="lv2" href="#集計条件">集計条件</a>
190:<a class="lv2" href="#スタック用紙印字データ組み立て時の判定">スタック用紙印字データ組み立て時の判定</a>
191:<a class="lv2" href="#業務ルール・計算">業務ルール・計算</a>
192:<a class="lv2" href="#データ整合性">データ整合性</a>
193:<a class="lv2" href="#API-バッチ結果">API/バッチ結果</a>
194:<a class="lv2" href="#入出力">入出力</a>
195:<a class="lv2" href="#DBカラム">DBカラム</a>
196:<a class="lv3" href="#DB操作">DB操作</a>
197:<a class="lv2" href="#バリデーション">バリデーション</a>
198:<a class="lv2" href="#権限・認可">権限・認可</a>
199:<a class="lv2" href="#画面遷移">画面遷移</a>
200:<a class="lv3" href="#遷移時に引き継ぐ状態">遷移時に引き継ぐ状態</a>
201:<a class="lv2" href="#エラー処理">エラー処理</a>
202:<a class="lv2" href="#試行制限">試行制限</a>
203:<a class="lv2" href="#ログ・監査">ログ・監査</a>
204:<a class="lv3" href="#ログに出してはいけないもの">ログに出してはいけないもの</a>
205:<a class="lv2" href="#セッション">セッション</a>
206:<a class="lv3" href="#セッションへ保存しない情報">セッションへ保存しない情報</a>
207:<a class="lv2" href="#Cookie">Cookie</a>
208:<a class="lv2" href="#排他制御・トランザクション">排他制御・トランザクション</a>
209:<a class="lv2" href="#調査補助-grep用">調査補助（grep用）</a>
210:<a class="lv3" href="#HTTPルート名とパス-コード探索用・旧入口節より退避">HTTPルート名とパス（コード探索用・旧入口節より退避）</a></nav>
211:    </aside>
212:    <main class="doc-content">
213:      <header class="page-header">
214:        <p class="crumb">Source:<br>/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/m05-08_admin_order_order_stack_paper_print.md</p>
215:        <h1>m05-08_admin_order_order_stack_paper_print（受注管理 — スタック用紙印刷）</h1>
216:      </header>
217:      <h2 id="概要">概要</h2>
218:<p>管理画面の「受注管理」一覧から選択した配送行に対し、別ウィンドウを開いたうえで非同期処理を走らせ、スタック用紙向けに必要な印刷予約フラグおよび条件に応じた受注ステータス・確定日を更新する機能である。呼び出し成功時にはJSONで確認メッセージを返し、アラート表示後に子ウィンドウを閉じる。</p>
219:<p>本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値とするソースは <code>src/Eccube/Controller/Admin/Order/OrderController.php</code> の該当ルート、<code>src/Eccube/Resource/template/admin/Order/index.twig</code>、<code>src/Eccube/Resource/template/admin/Order/print_stack_window.twig</code>、<code>src/Eccube/Repository/OrderRepository.php</code> の印字リスト取得処理、<code>src/Eccube/Service/Admin/Order/UpdateStackListAction.php</code>、<code>src/Eccube/Entity/Master/MtbOption.php</code> とする。</p>
220:<p>対象はブラウザ経由の管理画面に限定する。店舗別の基本情報画面上の「スタック用紙高額商品しきい値価格」（<code>dtb_base_info.stack_paper_threshold</code>）の入力・同期は別画面の設計とし、一覧からのスタック用紙印字クエリそのものでは参照しない点に注意する。</p>
221:<p>本機能のカスタマイズ区分は現行踏襲である。現行挙動は pf-eccube3 のHareruyaEcプラグイン実装を参照し、リニューアル移行後の挙動とDBは ec-cube-enterprise を確認値とする。DB関連の記述は ec-cube-enterprise を正とする。</p>
222:<p>コントローラの公開関数一覧は本文の主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。</p>
223:<hr>
224:<h2 id="リニューアル移行時の扱い">リニューアル移行時の扱い</h2>
225:<p>スタック用紙印刷は現行 pf-eccube3 では HareruyaEc プラグインで実装する。ブラウザ印刷フラグ・確定日時・担当者は、現行では補助テーブル <code>dtb_order_sub</code> に分割保持するが、移行先 ec-cube-enterprise では <code>dtb_order</code> に統合される。DB関連は ec-cube-enterprise を正とし、本書のテーブル・列名は移行先名で記す。</p>
226:<div class="table-wrap"><table><thead><tr><th>項目</th><th>現行 pf-eccube3（HareruyaEc）</th><th>移行先 ec-cube-enterprise</th></tr></thead><tbody><tr><td>ブラウザ印刷フラグ</td><td><code>dtb_order_sub.browser_print_flg</code></td><td><code>dtb_order.browser_print_flg</code></td></tr><tr><td>確定日時</td><td><code>dtb_order_sub.confirm_date</code></td><td><code>dtb_order.confirm_date</code></td></tr><tr><td>担当者会員</td><td><code>dtb_order_sub.operator_id</code></td><td><code>dtb_order.member_id</code></td></tr><tr><td>受注ステータス</td><td><code>dtb_order.order_status_id</code></td><td><code>dtb_order.order_status_id</code>（同一）</td></tr><tr><td>高額判定・閾値オプション</td><td><code>mtb_option</code>（<code>option_key</code>/<code>option_value</code>）</td><td><code>mtb_option</code>（同一。<code>stack_paper_judgment_price</code>, <code>stack_paper_threshold_price</code>）</td></tr><tr><td>店舗別しきい値</td><td>ec-cube-enterprise 実装で要確認</td><td><code>dtb_base_info.stack_paper_threshold</code></td></tr></tbody></table></div>
227:<p>本書のDBカラム節・副作用節のDB更新記述は移行先 ec-cube-enterprise の名称に合わせている。現行の補助テーブル列は上表で対応づける。</p>
228:<hr>
229:<h2 id="利用者視点の入口">利用者視点の入口</h2>
230:<div class="table-wrap"><table><thead><tr><th>入口</th><th>URLエンドポイント</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>受注一覧で配送行のチェックを付けて「スタック用紙印刷」を押す</td><td><code>POST /{admin_route}/order/print/stack/window</code>（同一画面の一括フォームから子ウィンドウ向けに送信）</td><td>未選択ならアラート「チェックボックスが選択されていません」で中断。選択済みなら幅450高さ400の別ウィンドウを開き、フォームをPOSTする。子画面は「スタック用紙印刷中」と見出しのみの本文を表示し、読み込み完了後にJSON用エンドポイントへAJAX POSTする</td></tr><tr><td>子ウィンドウ内の自動AJAX</td><td><code>POST /{admin_route}/order/print/stack</code></td><td>成功時はアラートで「印刷予約を受け付けました。」を表示し、ウィンドウを閉じる。失敗時はレスポンス本文の <code>message</code> をアラートし、本文が取れなければ固定のシステムエラー文を表示して閉じる</td></tr></tbody></table></div>
231:<hr>
232:<h2 id="フロント挙動">フロント挙動</h2>
233:<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>表示要素</td><td>一覧下部の「スタック用紙印刷」ボタン（識別子 <code>printStack</code>）。子ウィンドウは見出し「スタック用紙印刷中」のみ</td></tr><tr><td>JS挙動</td><td>一覧側で <code>#form_bulk</code> の <code>action</code> をウィンドウ用ルートに差し替え、<code>target</code> を <code>newwin</code> にしてPOSTする。子ウィンドウはjQueryの <code>$.ajax</code> でタイムアウト5秒、データ型JSON、POST。成功・失敗のどちらでも <code>alert</code> のあと <code>window.close()</code> する</td></tr><tr><td>CSS・レイアウト</td><td>一覧先頭のインラインスタイルで <code>.btn-print-stack</code> の配色を定義する</td></tr><tr><td>モーダル・ポップアップ</td><td>別ウィンドウを用いる。Bootstrapモーダルは本導線では使わない</td></tr></tbody></table></div>
234:<hr>
235:<h2 id="処理フロー">処理フロー</h2>
236:<h3 id="子ウィンドウを開いてHTMLを表示する-admin-order-print-stack-window">子ウィンドウを開いてHTMLを表示する（<code>admin_order_print_stack_window</code>）</h3>
237:<ol><li>管理画面の認証・共通制約を通過する。</li><li>リクエストパラメータ <code>ids</code> をそのままテンプレート変数に渡す（配列でも単一値でもテンプレート側でJSON化する）。</li><li><code>print_stack_window.twig</code> を返す。ルート処理内に <code>_token</code> の検証コードは無い。</li></ol>
238:<h3 id="印刷予約を記録する-admin-order-print-stack">印刷予約を記録する（<code>admin_order_print_stack</code>）</h3>
239:<ol><li>管理画面の認証・共通制約を通過する。</li><li>リクエストボディの <code>_token</code> について共通の検証関数で照合し、失敗時は管理向けエラーメッセージを積み、HTTP400でJSON「不正なリクエストです。」を返す。</li><li><code>ids</code> が空ならHTTP404でJSON「対象の注文が指定されていません。」を返す。配列でなければ長さ1の配列に包む。</li><li><code>mtb_option</code> から <code>stack_paper_judgment_price</code> と <code>stack_paper_threshold_price</code> を取得し、連想配列にする。</li><li><code>getPrintOrderList</code> に配送ID配列と当該オプション値を渡し、注文ごとの印字行を得る。SQLの <code>ORDER BY</code> は <code>dtb_order.id</code> 昇順。</li><li>各行について <code>order_no</code> が空ならHTTP400でJSON「注文番号が未採番の注文があります。」を返し、以降の更新は行わない。</li><li>各行について更新パラメータを組み立てる。配列には印刷フラグを真にする意図のキーを含めるが、保存処理側は現行コードではそれ以外のビジネス用キーを解釈しない。ステータスが新規受付（数値IDが1）の行だけピックへ進めるフラグを真にする。</li><li><code>src/Eccube/Service/Admin/Order/UpdateStackListAction.php</code> が提供するハンドラをトランザクション内で実行する。各注文に対し <code>browser_print_flg</code> を真にし、手順7でピック遷移フラグが真になった行だけ受注ステータスをピック中（数値IDが10）にし <code>confirm_date</code> を現在日時で上書きする。操作者会員が解決できれば <code>dtb_order</code> の担当者をその会員に差し替える。</li><li>例外が出た場合はハンドラでロールバックしたうえで再送出される。コントローラ側は単一種類の標準例外だけをHTTP400のJSONへ写し替える分岐がある。印刷フラグ更新ハンドラの処理本文だけを読む限り、その型での終了は定義されていない。その他はそのまま外へ伝播しうる。</li><li>正常終了時はHTTP200でJSON「印刷予約を受け付けました。」を返す。</li></ol>
240:<hr>
241:<h2 id="集計条件">集計条件</h2>
242:<p>本機能は一覧の件数集計や合計金額の再計算を行わない。</p>
243:<div class="table-wrap"><table><thead><tr><th>指標</th><th>集計の要点</th></tr></thead><tbody><tr><td>印字行の単位</td><td>選択された <code>dtb_shipping.id</code> に紐づく <code>dtb_order.id</code> ごとに1行。同一注文の複数配送を同時に選んでも注文は1行にまとまる</td></tr></tbody></table></div>
244:<hr>
245:<h2 id="スタック用紙印字データ組み立て時の判定">スタック用紙印字データ組み立て時の判定</h2>
246:<div class="table-wrap"><table><thead><tr><th>順序</th><th>判定</th><th>結果</th></tr></thead><tbody><tr><td>1</td><td><code>stack_paper_judgment_price</code> の文字列が <code>"0"</code> か</td><td><code>"0"</code> なら明細価格の最大を使うサブクエリを採用。それ以外なら商品規格の買取価格の最大を使うサブクエリを採用</td></tr><tr><td>2</td><td>閾値 <code>(int) stack_paper_threshold_price</code> と <code>op.price</code> を比較する</td><td>現行の <code>CASE</code> 式では閾値以上・未満にかかわらず印字列 <code>expensive</code> は同じ空欄装飾文字（実装では「□」）になる</td></tr></tbody></table></div>
247:<hr>
248:<h2 id="業務ルール・計算">業務ルール・計算</h2>
249:<div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>閾値</td><td><code>mtb_option.stack_paper_threshold_price</code> を整数化してSQLパラメータに渡す。店舗マスタ <code>dtb_base_info.stack_paper_threshold</code> は当クエリでは使わない</td></tr><tr><td>高額印字区分</td><td>前表のとおり分岐はあるが、返却列の文字は両分岐で同一のため、現行実装単体では印字データ上の差は出ない</td></tr><tr><td>新規受付時の追加更新</td><td>ステータスIDが1の注文だけピック中（ID10）へ遷移し、<code>confirmDate</code> をサーバ現在日時でセットする。それ以外のステータスではステータスと確定日は変えない</td></tr></tbody></table></div>
250:<p>本機能ではフォーム入力の保存・更新画面を持たないため、<code>### 入力項目</code> の5列表は置かない。</p>
251:<hr>
252:<h2 id="データ整合性">データ整合性</h2>
253:<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>一覧との対応</td><td>チェックボックスの値は配送ID。印字と更新の対象はその配送が属する注文</td></tr><tr><td>オプションと店舗マスタ</td><td>印字SQLは全体オプションの閾値のみ参照し、行ごとの店舗しきい値とは自動一致しない</td></tr><tr><td>同時操作</td><td>更新は悲観的ロックの追加取得なしで行う。他画面と同一注文を同時に更新した場合の結果は最終書き込み優先</td></tr><tr><td>子画面と親画面</td><td>親の検索条件セッションは本導線では書き換えない</td></tr><tr><td>配送ID欠損時</td><td>SQLに現れなかった配送IDだけは更新対象に含まれず、リストに載った注文だけがコミットされる</td></tr></tbody></table></div>
254:<hr>
255:<h2 id="API-バッチ結果">API/バッチ結果</h2>
256:<p>本機能では外部公開API呼び出しやバッチジョブ起動を扱わない。子ウィンドウからの <code>POST</code> は同一オリジンの管理画面用JSON応答である。</p>
257:<hr>
258:<h2 id="入出力">入出力</h2>
259:<div class="table-wrap"><table><thead><tr><th>種類</th><th>内容</th></tr></thead><tbody><tr><td>入力</td><td>一覧フォームの <code>ids[]</code>（配送ID）、<code>_token</code>。AJAXでは同じ <code>ids</code> 配列と <code>_token</code></td></tr><tr><td>成功時出力</td><td>HTTP200、JSONオブジェクトに <code>message</code> キーで成功文面</td></tr><tr><td>失敗時出力</td><td>HTTP400または404、JSONに <code>message</code>。<code>_token</code> 不正時は本文が固定、同時にフラッシュへ管理者向けCSRFエラーキーを積む場合がある</td></tr><tr><td>副作用</td><td>対象注文の <code>browser_print_flg</code>、条件付きで <code>order_status_id</code> と <code>confirmDate</code>、担当者会員。トランザクション完了時に確定</td></tr></tbody></table></div>
260:<hr>
261:<h2 id="DBカラム">DBカラム</h2>
262:<p>当機能の更新で直接触れる主な列は次のとおり。型の細部はスキーマ定義を参照する。</p>
263:<div class="table-wrap"><table><thead><tr><th>テーブル</th><th>列</th><th>メモ</th></tr></thead><tbody><tr><td><code>dtb_order</code></td><td><code>browser_print_flg</code></td><td>真に更新する</td></tr><tr><td><code>dtb_order</code></td><td><code>order_status_id</code></td><td>新規受付からピック中への遷移時のみ変更</td></tr><tr><td><code>dtb_order</code></td><td><code>confirm_date</code></td><td>上記遷移時に現在日時をセット</td></tr><tr><td><code>dtb_order</code></td><td><code>member_id</code></td><td>操作者会員が存在するときにセット</td></tr></tbody></table></div>
264:<h3 id="DB操作">DB操作</h3>
265:<p>本機能は参照系（検索・出力）であり、DBへの登録・更新・削除は行わない。テーブル名は ec-cube-enterprise を正典とする。</p>
266:<div class="table-wrap"><table><thead><tr><th>操作種別</th><th>対象テーブル</th><th>契機・条件</th></tr></thead><tbody><tr><td>検索</td><td>dtb_order</td><td>検索条件に合致するレコードを抽出する。抽出結果を所定フォーマットでファイル出力する。</td></tr></tbody></table></div>
267:<hr>
268:<h2 id="バリデーション">バリデーション</h2>
269:<div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>CSRF</td><td>AJAXのPOSTのみ明示検証。フォームキーは <code>_token</code>。失敗時HTTP400</td></tr><tr><td>対象ID</td><td><code>ids</code> 空はHTTP404</td></tr><tr><td>注文番号</td><td>印字行の <code>order_no</code> が空文字相当ならHTTP400</td></tr></tbody></table></div>
270:<hr>
271:<h2 id="権限・認可">権限・認可</h2>
272:<div class="table-wrap"><table><thead><tr><th>利用者状態</th><th>本機能の画面・ルート</th></tr></thead><tbody><tr><td>未ログイン</td><td>管理画面セキュリティ設定に従い当パスへ到達しない</td></tr><tr><td>管理画面ログイン済み（従来の管理者ロール）</td><td>ルート定義上は追加のメソッド単位制限なし。実運用のロール細分は管理画面共通に従う</td></tr></tbody></table></div>
273:<hr>
274:<h2 id="画面遷移">画面遷移</h2>
275:<div class="table-wrap"><table><thead><tr><th>条件</th><th>遷移先</th></tr></thead><tbody><tr><td>一覧で印刷ボタン押下（正常）</td><td>子ウィンドウが開き、同セッション内でAJAX後に子が閉じる。親URLは変わらない</td></tr><tr><td>CSRF失敗・対象なし・未採番</td><td>子ウィンドウ内でアラート後に閉じる。親はそのまま</td></tr></tbody></table></div>
276:<h3 id="遷移時に引き継ぐ状態">遷移時に引き継ぐ状態</h3>
277:<div class="table-wrap"><table><thead><tr><th>起点</th><th>遷移前の処理</th><th>遷移後の初期状態</th></tr></thead><tbody><tr><td>一覧→子ウィンドウ</td><td>一括フォームに埋めた <code>ids[]</code> と <code>_token</code> をPOST</td><td>子は同じ <code>ids</code> をJSONでAJAXに載せ替え、新しいページ生成時点の <code>_token</code> を付与する</td></tr></tbody></table></div>
278:<hr>
279:<h2 id="エラー処理">エラー処理</h2>
280:<div class="table-wrap"><table><thead><tr><th>エラー内容</th><th>処理</th></tr></thead><tbody><tr><td>CSRF不正</td><td>HTTP400、JSONで固定メッセージ。管理向けフラッシュにCSRF関連キー</td></tr><tr><td><code>ids</code> 空</td><td>HTTP404、JSONで対象未指定メッセージ</td></tr><tr><td>注文番号未採番</td><td>HTTP400、JSONで未採番メッセージ。DB更新は行わない</td></tr><tr><td>AJAX応答がJSONでない等</td><td>子ウィンドウで固定のシステムエラー文を表示して閉じる</td></tr><tr><td>更新処理の例外（HTTP400へ写し替えられない種類）</td><td>子ウィンドウ側では汎用エラー表示に落ちうる。サーバは伝播させうる</td></tr></tbody></table></div>
281:<hr>
282:<h2 id="試行制限">試行制限</h2>
283:<p>本機能ではレート制限や試行回数上限を扱わない。</p>
284:<hr>
285:<h2 id="ログ・監査">ログ・監査</h2>
286:<div class="table-wrap"><table><thead><tr><th>タイミング</th><th>記録内容</th></tr></thead><tbody><tr><td>本ルート正常系</td><td>専用の業務ログ出力はコード上は必須としていない</td></tr><tr><td>更新例外</td><td>印刷フラグ更新用ハンドラはロールバック後に例外を再送出する。当ハンドラ内の追加ログは無い</td></tr></tbody></table></div>
287:<h3 id="ログに出してはいけないもの">ログに出してはいけないもの</h3>
288:<ul><li>パスワード</li><li>なりすまし対策トークン</li><li>Cookie値</li><li>セッションIDの完全値</li><li>Remember Meトークンの原値</li></ul>
289:<hr>
290:<h2 id="セッション">セッション</h2>
291:<p>本機能は受注検索セッションキーを読み書きしない。子ウィンドウのPOSTは同一ブラウザセッションのクッキーで識別される。</p>
292:<h3 id="セッションへ保存しない情報">セッションへ保存しない情報</h3>
293:<ul><li>スタック用紙用の配送ID一覧をセッションに残す処理は無い（リクエスト都度POSTで渡す）</li></ul>
294:<hr>
295:<h2 id="Cookie">Cookie</h2>
296:<p>セッション識別子以外の専用Cookieを本機能が新たに設定することはない。詳細は管理画面共通のセッション設定に従う。</p>
297:<hr>
298:<h2 id="排他制御・トランザクション">排他制御・トランザクション</h2>
299:<p>印刷フラグ・ステータス更新ハンドラは1トランザクションで複数注文を更新し、成功時にコミット、例外時にロールバックする。行ロックの明示取得は行わない。</p>
300:<hr>
301:<h2 id="調査補助-grep用">調査補助（grep用）</h2>
302:<p>実装位置の手がかりとして、ルート名 <code>admin_order_print_stack_window</code>・<code>admin_order_print_stack</code>、テンプレート <code>print_stack_window.twig</code>、リポジトリメソッド <code>getPrintOrderList</code>、サービス <code>UpdateStackListAction</code> を検索する。</p>
303:<h3 id="HTTPルート名とパス-コード探索用・旧入口節より退避">HTTPルート名とパス（コード探索用・旧入口節より退避）</h3>
304:<ul><li><code>admin_order_print_stack_window</code> … <code>POST</code> … <code>/{admin_route}/order/print/stack/window</code>（子ウィンドウ用の薄いページをHTMLで返す。<code>ids[]</code> と <code>_token</code> を一覧の一括フォームからPOSTする前提）</li><li><code>admin_order_print_stack</code> … <code>POST</code> … <code>/{admin_route}/order/print/stack</code>（AJAXによる印刷予約処理。<code>_token</code> を検証し、配送ID群から受注を解決してDB更新し、JSONで結果メッセージを返す）</li></ul>
305:      <footer>このページは機能仕様書Markdownから自動生成されています。編集は元のMarkdownに対して行ってください。</footer>
306:    </main>
307:  </div>
308:</body>
309:</html>

exec
/bin/bash -lc 'rg -n "order_stack|stack_paper|Stack|一括|納品書|帳票|paper|print" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /home/y-saito/Developments/ec-cube-enterprise/app 2>/dev/null' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 1ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Session/Session.php:16:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Session/Session.php:25:    public function __construct(private readonly RequestStack $requestStack)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Session/Session.php:31:        return $this->requestStack->getSession();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Stream/Filter/SjisToUtf8EncodingFilter.php:109:            \sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Session/Storage/Handler/SameSiteNoneCompatSessionHandler.php:53:            header(sprintf('Cache-Control: max-age=%d, private, must-revalidate', 60 * (int) ini_get('session.cache_expire')));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Session/Storage/Handler/SameSiteNoneCompatSessionHandler.php:110:                throw new \LogicException(sprintf('Session name cannot be empty, did you forget to call "parent::open()" in "%s"?.', static::class));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Session/Storage/Handler/SameSiteNoneCompatSessionHandler.php:112:            $sessionCookie = sprintf(' %s=', urlencode($this->sessionName));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Session/Storage/Handler/SameSiteNoneCompatSessionHandler.php:113:            $sessionCookieWithId = sprintf('%s%s;', $sessionCookie, urlencode($sessionId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Security/Core/User/MemberProvider.php:56:            throw new UnsupportedUserException(sprintf('Instances of "%s" are not supported.', $user::class));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Security/Core/User/MemberProvider.php:81:                throw new UserNotFoundException(sprintf('Username "%s" does not exist.', $identifier));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Security/Core/User/MemberProvider.php:94:                throw new UserNotFoundException(sprintf('Username "%s" does not exist.', $identifier));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Security/Core/User/CustomerProvider.php:59:            throw new UnsupportedUserException(sprintf('Instances of "%s" are not supported.', $user::class));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Security/Core/User/CustomerProvider.php:87:                throw new UserNotFoundException(sprintf('Username "%s" does not exist.', $identifier));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Security/Core/User/CustomerProvider.php:105:            throw new UserNotFoundException(sprintf('Username "%s" does not exist.', $identifier));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Security/Voter/AuthorityVoter.php:19:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Security/Voter/AuthorityVoter.php:26:    public function __construct(protected AuthorityRoleRepository $authorityRoleRepository, protected RequestStack $requestStack, protected EccubeConfig $eccubeConfig)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Security/Voter/AuthorityVoter.php:39:            $request = $this->requestStack->getMainRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Kernel.php:245:                    'routesYamlPerms' => file_exists($routesYamlFile) ? substr(sprintf('%o', fileperms($routesYamlFile)), -4) : null,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:1105:            $strNum = $fixNo.sprintf("%0{$zeroPaddingLength}d", $smaregiId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/MergeCartPostLoginListener.php:27:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/MergeCartPostLoginListener.php:34:    public function __construct(protected EntityManagerInterface $em, protected CartService $cartService, protected PurchaseFlow $purchaseFlow, protected RequestStack $requestStack, private readonly Security $security)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/LogListener.php:119:            $message = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/EnterpriseEccubeRememberMeRedirectListener.php:19:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/EnterpriseEccubeRememberMeRedirectListener.php:28:    public function __construct(private readonly EccubeConfig $eccubeConfig, private readonly UrlGeneratorInterface $urlGenerator, private readonly RequestStack $requestStack)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/EnterpriseEccubeRememberMeRedirectListener.php:48:        if ($this->requestStack->getMainRequest()->cookies->get($this->eccubeConfig->get('eccube_rememberme_admin_cookie_name')) === null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/EnterpriseEccubeRememberMeRedirectListener.php:53:        if (str_contains($this->requestStack->getMainRequest()->getUri(), $this->urlGenerator->generate('admin_login')) === true) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/EnterpriseEccubeRememberMeRedirectListener.php:58:        if (str_contains($this->requestStack->getMainRequest()->getUri(), $this->urlGenerator->generate('admin_homepage')) === false) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Front/Mypage/PurchaseHistoryNetBulkSectionViewDto.php:19: * まとめて買取ブロック（高単価明細・低価格帯集計・一括売却フラグ）.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/LoginPasswordLengthCheckListener.php:20:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/LoginPasswordLengthCheckListener.php:37:        private readonly RequestStack $requestStack,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/LoginPasswordLengthCheckListener.php:44:        $request = $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:124:                throw new \RuntimeException(sprintf('Smaregi webhook event not found (webhookEventId=%d)', $message->getSmaregiWebhookEventId()));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:167:            throw new \RuntimeException(sprintf('Failed to fetch Smaregi transaction (transactionHeadId=%s, statusCode=%d)', $transactionHeadId, $response['statusCode']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiStockProcessMessageHandler.php:78:            // 在庫行の悲観ロックを取得するためトランザクション内で反映し、在庫更新・履歴登録・ジョブ完了を一括確定する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiStockProcessMessageHandler.php:138:            throw new \RuntimeException(sprintf('Failed to fetch Smaregi stock change (stockChangeId=%s, statusCode=%d)', $message->getStockChangeId(), $statusCode));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Loader/LocaleFilesystemLoader.php:18:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Loader/LocaleFilesystemLoader.php:31:    private ?RequestStack $requestStack = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Loader/LocaleFilesystemLoader.php:34:    public function setRequestStack(RequestStack $requestStack): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Loader/LocaleFilesystemLoader.php:36:        $this->requestStack = $requestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Loader/LocaleFilesystemLoader.php:122:        if ($this->requestStack === null || $this->defaultLocale === null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Loader/LocaleFilesystemLoader.php:126:        $request = $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOtcSyncMessageHandler.php:84:                    $this->failJob($Job, sprintf('受注が見つかりません (orderId=%d).', $message->getOrderId()));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOtcSyncMessageHandler.php:91:                    $this->failJob($Job, sprintf('BaseInfo.smaregi_shop_id が未設定のため処理不能 (orderId=%d).', $message->getOrderId()));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOtcSyncMessageHandler.php:136:            $this->failJob($Job, sprintf('Smaregi OTC sync failed: result=%s', $result->value));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/LoginHistoryListener.php:29:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/LoginHistoryListener.php:38:    public function __construct(private readonly EntityManagerInterface $entityManager, private readonly RequestStack $requestStack, private readonly Context $requestContext, private readonly LoginMemberViewRepository $memberViewRepository, private readonly LoginHistoryStatusRepository $loginHistoryStatusRepository, private readonly EccubeConfig $eccubeConfig, private readonly Security $security, private readonly UrlGeneratorInterface $urlGenerator)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/LoginHistoryListener.php:96:        $request = $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiProductClassUpsertMessageHandler.php:348:            throw new \RuntimeException(sprintf('スマレジ商品コード %s に対して productId が複数件存在するため、一意に更新先を決定できません。', $productCode));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Request/Context.php:20:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Request/Context.php:26:    public function __construct(protected RequestStack $requestStack, protected EccubeConfig $eccubeConfig, private readonly TokenStorageInterface $tokenStorage)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Request/Context.php:35:        $request = $this->requestStack->getMainRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Request/Context.php:60:        $request = $this->requestStack->getMainRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Request/Context.php:76:        $request = $this->requestStack->getMainRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Request/Context.php:105:        $request = $this->requestStack->getMainRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Request/Context.php:121:        return $this->requestStack->getMainRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Request/Context.php:131:        $request = $this->requestStack->getMainRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Request/Context.php:154:        $request = $this->requestStack->getMainRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Request/Context.php:178:        $request = $this->requestStack->getMainRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiWebhookEventMessageHandler.php:63:            ->setPayloadSummary(sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:540:        // $strNum = $fixNo . sprintf("%0{$zeroPaddingLength}d", $this->getSmaregiId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOtcDeleteMessageHandler.php:80:                    $this->failJob($Job, sprintf('受注が見つかりません (orderId=%d).', $message->getOrderId()));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOtcDeleteMessageHandler.php:116:            $this->failJob($Job, sprintf('Smaregi OTC delete failed: result=%s', $result->value));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/ForwardOnlyListener.php:56:                $message = sprintf('%s is Forward Only', $attributes->get('_controller'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/MailUtil.php:55:        $message->getHeaders()->addTextHeader('Content-Type', sprintf('text/plain; charset=%s', $toEncoding));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:48:            throw new \InvalidArgumentException(sprintf('smaregiCustomerIdLength must be between 1 and %d to keep EAN13 compatibility, %d given.', $maxLength, $smaregiCustomerIdLength));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOtcOrderPostAction.php:58:            $smaregiCode = $this->getProductBarcode('20', '1', sprintf('%03d', $smaregiShopId), $orderNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOtcOrderPostAction.php:80:            throw new \RuntimeException(sprintf('店頭受取注文スマレジ連携ジョブの enqueue に失敗した受注があります (orderIds=%s)', implode(',', $failedOrderIds)));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php:60:        $job->setPayloadSummary(sprintf('orderId=%s gainedPoints=%d', $Order->getId(), $gainedPoints));
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/reference.php:117: * @psalm-type StackType = array{
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/reference.php:125: *     ...<string, DefinitionType|AliasType|PrototypeType|StackType|ArgumentsType|null>
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/reference.php:496: *             peer_fingerprint?: array{ // Associative array: hashing algorithm => hash(es).
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/reference.php:549: *             peer_fingerprint?: array{ // Associative array: hashing algorithm => hash(es).
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/CategoryMap.php:133:                throw new \InvalidArgumentException(sprintf('指定されたカテゴリIDはマスタに存在しません: %s', $id));
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:121:                'option_key' => 'receipt_printer_ip_address',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:128:                'option_key' => 'stack_paper_judgment_price',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:135:                'option_key' => 'stack_paper_threshold_price',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260619000001.php:36:        $this->addSql(sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:517:     * 一括で商品の売却フラグをtrueに変更する
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164507.php:450:                'name_en' => 'Test print',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260106155157.php:66:                'source_name' => '在庫一括編集',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:137:     * デッキ一括削除（個別削除兼用）.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:171:            log_error('デッキ一括削除エラー', ['message' => $e->getMessage()]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:183:     * デッキ一括編集.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:231:            log_error('デッキ一括編集エラー', ['message' => $e->getMessage()]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:591:                    $qb->andWhere(sprintf('c.name_jp LIKE :%1$s OR c.name_en LIKE :%1$s', $param))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:601:                $qb->andWhere(sprintf('c.text_jp LIKE :%1$s OR c.text_en LIKE :%1$s', $param))
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:38:        $sql = 'INSERT INTO dtb_base_info (id, country_id, pref_id, tenant_status, company_name, company_kana, postal_code, addr01, addr02, phone_number, business_hour, email01, email02, email03, email04, shop_name, shop_kana, shop_name_eng, update_date, good_traded, message, delivery_free_amount, delivery_free_quantity, option_mypage_order_status_display, option_nostock_hidden, option_favorite_product, option_product_delivery_fee, option_product_tax_rule, option_customer_activate, option_remember_me, option_mail_notifier, option_point, invoice_registration_number, authentication_key, php_path, basic_point_rate, point_conversion_rate, ga_id, banner_image, limited_items_tag01, limited_items_tag02, latest_expansion, customer_id, rank, short_name_jp, short_name_en, html_class_name, address_en, fax_number, max_capacity, shop_color, shop_icon, picking_list_threshold, expensive_threshold1, expensive_threshold2, expensive_threshold3, stack_paper_threshold, shop_digit, smaregi_shop_id, smaregi_shop_code, global_ip_address, printer_ip_address, common_setting_flg, banner_image_tag, random_tile_flg, test_store_flg, is_main_shop, is_public_shop, is_open_shop, google_map_url, business_hour_en, local_hareruyakun_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:95:            stack_paper_threshold = EXCLUDED.stack_paper_threshold,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:100:            printer_ip_address = EXCLUDED.printer_ip_address,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:172:                    $record['stack_paper_threshold'] ?? null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:177:                    $record['printer_ip_address'] ?? null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:265:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:270:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:339:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:344:                'printer_ip_address' => '192.168.100.20',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:413:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:418:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:487:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:492:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:561:                'stack_paper_threshold' => 5000,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:566:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:635:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:640:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:709:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:714:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:783:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:788:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:857:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:862:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:931:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:936:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1005:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1010:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1079:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1084:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1153:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1158:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1227:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1232:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1301:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1306:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1375:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1380:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1449:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1454:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1523:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1528:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1597:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1602:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1671:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1676:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1745:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1750:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1819:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1824:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1893:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1898:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1967:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1972:                'printer_ip_address' => '192.168.3.46',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2041:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2046:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2115:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2120:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2189:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2194:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2263:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2268:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2337:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2342:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2411:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2416:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2485:                'stack_paper_threshold' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2490:                'printer_ip_address' => null,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/CardUtil.php:54:            throw new BadRequestHttpException(sprintf('The maximum card list length is %s lines', self::MAX_LINE_COUNT));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/SearchProductController.php:157:                    return sprintf('%s/%s/%s/\%s%s', $code, $lang, $condition, $standardPrice, $highPriceCode ? '/'.$highPriceCode : '');
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260525000001.php:52:            $this->addSql(sprintf('ALTER TABLE %s DISABLE ROW LEVEL SECURITY;', $table));
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260525000001.php:53:            $this->addSql(sprintf('GRANT ALL PRIVILEGES ON TABLE %s TO %s;', $table, self::ROLES));
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260525000001.php:59:                $this->addSql(sprintf('GRANT ALL PRIVILEGES ON SEQUENCE %s TO %s;', $sequence, self::ROLES));
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260525000001.php:72:            $this->addSql(sprintf('REVOKE ALL PRIVILEGES ON TABLE %s FROM %s;', $table, self::ROLES));
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260525000001.php:78:                $this->addSql(sprintf('REVOKE ALL PRIVILEGES ON SEQUENCE %s FROM %s;', $sequence, self::ROLES));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOption.php:107:    public const STACK_PAPER_JUDGMENT_PRICE = 'stack_paper_judgment_price';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOption.php:119:    public const STACK_PAPER_THRESHOLD_PRICE = 'stack_paper_threshold_price';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:632:    public function printRestockList(Request $request): JsonResponse
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Stock/SmaregiStockBackfillAction.php:122:                throw new \RuntimeException(sprintf('Failed to list Smaregi stocks (page=%d, statusCode=%d)', $page, $statusCode));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Stock/SmaregiStockBackfillAction.php:149:            throw new \RuntimeException(sprintf('Smaregi stock list exceeded max pages (maxPages=%d, limit=%d); not all stock data retrieved.', self::MAX_PAGES, self::PAGE_LIMIT));
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260525130000.php:29:        ['url' => 'deck_bulk', 'name' => 'デッキ一括購入', 'file' => 'Deck/bulk'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcProductCodeGenerator.php:52:            throw new \LogicException(sprintf('Generated Smaregi OTC code length is invalid: %s', $code));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcProductCodeGenerator.php:61:            throw new \InvalidArgumentException(sprintf('Store ID must be a non-empty numeric string. given=%s', $storeId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcProductCodeGenerator.php:64:            throw new \InvalidArgumentException(sprintf('Store ID exceeds %d digits. given=%s', self::STORE_ID_LENGTH, $storeId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcProductCodeGenerator.php:73:            throw new \InvalidArgumentException(sprintf('Order number must be a non-empty numeric string. given=%s', $orderNumber));
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:1051:大量一括買取も大歓迎！お気軽にご相談ください！
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:2702:    Regarding the state of value on the shipping documents, I am afraid we do not print a lower amount value on the package.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:3208:                'footer' => '■まとめて一括買取の内訳
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:3211:※まとめて一括買取のうち、査定額が一番高かったカード
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:3264:                'footer' => '■まとめて一括買取の内訳
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:3267:※まとめて一括買取のうち、査定額が一番高かったカード
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:4146:※まとめて一括買取のうち、査定額が一番高かった商品
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:4205:                'footer' => '■まとめて一括買取の内訳
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockListController.php:431:     * 在庫一括編集: 一覧からの POST を受け、在庫一括編集画面へリダイレクトする。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcSyncDispatcher.php:52:        $Job->setPayloadSummary(sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:84:            $this->markError($Order, sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:132:                $this->markError($Order, sprintf('Smaregi stock add failed (status=%d)', $stockResult['statusCode']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:185:            $this->markError($Order, sprintf('Smaregi product create failed (status=%d)', $createResult['statusCode']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcDeleteDispatcher.php:51:        $Job->setPayloadSummary(sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockBulkApprovalController.php:47:     * 検索画面で選択された在庫を一括編集する画面を表示する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Common/CsvDataFixtures/CsvFixture.php:108:            $sequence_name = sprintf('%s_%s_seq', $table_name, $pk_name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Common/CsvDataFixtures/CsvFixture.php:118:            $sql = sprintf('SELECT MAX(%s) FROM %s', $pk_name, $table_name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Common/CsvDataFixtures/CsvFixture.php:122:                $sql = sprintf("SELECT SETVAL('%s', 1, false)", $sequence_name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Common/CsvDataFixtures/CsvFixture.php:125:                $sql = sprintf("SELECT SETVAL('%s', %s)", $sequence_name, $max);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiProductClassEventService.php:54:        $job->setPayloadSummary(sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiProductClassEventService.php:100:        $job->setPayloadSummary(sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerPointEventService.php:60:        $job->setPayloadSummary(sprintf('smaregiId=%s point=%d', $smaregiId, $pointChange));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Common/CsvDataFixtures/Loader.php:45:            throw new \InvalidArgumentException(sprintf('"%s" does not exist', $dir));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Common/CsvDataFixtures/Loader.php:66:                        throw new \Exception(sprintf('"%s" is undefined in definition.yml', $a->getFilename()));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Common/CsvDataFixtures/Loader.php:69:                        throw new \Exception(sprintf('"%s" is undefined in definition.yml', $b->getFilename()));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitController.php:112:        $sessionKey = sprintf('stock_split_new_destinations_%d', $ProductStock->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitController.php:170:        $sessionKey = sprintf('stock_split_new_destinations_%d', $ProductStock->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitController.php:239:                $sessionKey = sprintf('stock_split_edit_destinations_%d', $StockSplitJoin->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitController.php:304:        $sessionKey = sprintf('stock_split_edit_destinations_%d', $joinId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitController.php:428:        $sessionKey = sprintf('stock_split_edit_destinations_%d', $StockSplitJoin->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitController.php:478:        $sessionKey = sprintf('stock_split_edit_destinations_%d', $StockSplitJoin->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitController.php:548:        $sessionKey = sprintf('stock_split_edit_destinations_%d', $StockSplitJoin->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitController.php:681:            $sessionKey = sprintf('stock_split_edit_destinations_%d', $StockSplitJoin->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerUpdateEventService.php:60:        $job->setPayloadSummary(sprintf('customerId=%d smaregiId=%s', $customerId, $smaregiId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:366:     * 在庫移動実績CSV登録（送り状No.一括登録）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockApprovalListController.php:225:     * 一括却下・一括承認
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Stock/SmaregiStockChangeApplier.php:72:            throw new \RuntimeException(sprintf('Smaregi stock change record not found in response (stockChangeId=%s)', $stockChangeId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Stock/SmaregiStockChangeApplier.php:99:            throw new \RuntimeException(sprintf('Store not resolved for Smaregi stock change (storeId=%s, stockChangeId=%s)', $message->getStoreId(), $stockChangeId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Stock/SmaregiStockChangeApplier.php:234:            throw new \RuntimeException(sprintf('Smaregi stock change type detail master not found (detailId=%d, division=%s)', $detailId, (string) $division));
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260416190000.php:59:        $this->addSql(sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:271:                    $sessionKey = sprintf('stock_join_edit_sources_%d', $StockSplitJoin->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:313:            $sessionKey = sprintf('stock_join_edit_sources_%d', $StockSplitJoin->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:392:        $sessionKey = sprintf('stock_join_edit_sources_%d', $StockSplitJoin->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:451:        $sessionKey = sprintf('stock_join_edit_sources_%d', $StockSplitJoin->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:488:                    $sessionKey = sprintf('stock_join_edit_sources_%d', $stockSplitJoinId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:507:            $request->getSession()->remove(sprintf('stock_join_edit_sources_%d', $stockSplitJoinId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:1044:     * 結合元在庫数一括更新（使用停止：NEWステータスの結合元はSessionで管理）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:1071:        $sessionKey = sprintf('stock_join_edit_sources_%d', $joinId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:1105:        $sessionKey = sprintf('stock_join_edit_sources_%d', $StockSplitJoin->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:1166:            $sessionKey = sprintf('stock_join_edit_sources_%d', $joinId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Stock/SmaregiStockProcessDispatcher.php:54:        $Job->setPayloadSummary(sprintf(
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_cardset.sql:633:(372, NULL, NULL, 'モダンホライゾン旧枠再録', 'Modern Horizon Retro Reprints', 'H2R', NULL, '2024-06-14 0:00:00+00', true, 0, true, false, true, true, false, NULL, NULL),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:285:            $detail = sprintf('[%s] %s', get_class($e), $e->getMessage());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:376:            $detail = sprintf('[%s] %s', get_class($e), $e->getMessage());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockChangeCsvController.php:360:                $errors[] = ['row' => $rowNum, 'message' => sprintf('商品コード「%s」が見つかりません', $productCode)];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockChangeCsvController.php:373:                $errors[] = ['row' => $rowNum, 'message' => sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockChangeCsvController.php:378:                $errors[] = ['row' => $rowNum, 'message' => sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockChangeCsvController.php:383:                $errors[] = ['row' => $rowNum, 'message' => sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockSplitJoinDetail.php:213:            throw new \RuntimeException(sprintf('ProductClass (ID: %s) has no ProductStock.', $ProductClass->getId() ?? 'null'));
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:40:    # 身分証アップロード用 Private S3 Bucket（ローカル: LocalStack上の replace-dev-idcheck / 開発環境: replace-dev-idcheck）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/Types/UTCDateTimeTzType.php:82:            throw new \LogicException(sprintf('%s::$timezone is undefined.', self::class));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/DBAL/Types/UTCDateTimeType.php:82:            throw new \LogicException(sprintf('%s::$timezone is undefined.', self::class));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockHistory.php:226:     * 在庫編集・一括編集由来かつ、在庫変動区分が入庫・廃棄の場合のみ編集可能.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:115:        return (clone $this->issueDate)->modify(sprintf('+%d days', $expireDays));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/Filter/CustomerDeleteFilter.php:31:        return sprintf('%s.del_flg = 0', $alias);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/CartController.php:110:     * カート一括削除.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/CartController.php:482:                'message' => sprintf(trans('front.cart.product.over_request_count.message'), $compare['max_value']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductSearchTrait.php:24: * PaginatorInterface $paginator, RequestStack $requestStack, ProductFinder $productFinder
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductSearchTrait.php:47:        $request = $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:760:     * まとめて買取の個別表示価格未満の商品について一括管理される売却可否を取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:764:        // まとめて買取の個別表示価格未満は売却可否を一括で管理されているので最大1つだけ確認する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/PurchaseController.php:331:        $displayOrderId = 'PU'.date('ymd').'-'.sprintf('%010d', $buyOrderId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:835:            return sprintf('%s%s%s', $this->getTel01(), $this->getTel02(), $this->getTel03());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/OtcBuyController.php:179:                $form->get('telNo')->setData(sprintf('%s-%s-%s', $user->getTel01(), $user->getTel02(), $user->getTel03()));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/OtcBuyController.php:307:            $telNo = sprintf('%s-%s-%s', $merged['tel01'], $merged['tel02'], $merged['tel03']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/OtcBuyController.php:424:            sprintf('%02d', $shop->getId()),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/ORM/Query/Normalize.php:45:            'postgresql' => sprintf("LOWER(TRANSLATE(%s, '%s', '%s'))", $this->string->dispatch($sqlWalker), self::FROM, self::TO),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/ORM/Query/Normalize.php:46:            'mysql' => sprintf('CONVERT(%s USING utf8) COLLATE utf8_unicode_ci', $this->string->dispatch($sqlWalker)),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/ORM/Query/Normalize.php:47:            default => sprintf('LOWER(%s)', $this->string->dispatch($sqlWalker)),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:72:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:109:        protected RequestStack $requestStack,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:806:        // 商品詳細など FavoriteCartType（favorite_cart[quantity_*]）の一括追加
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:907:     * AddCartType / 一括追加の結果を Ajax なら JSON、それ以外はカートへリダイレクトで返す.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:1081:            'カート一括追加処理開始',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:1165:            'カート一括追加処理完了',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:1425:     * 商品一覧（複数規格表示時）からの一括カート追加（お気に入り {@see addFavoriteCartBulk} と同様）.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:1460:            '商品一覧カート一括追加処理開始',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:1544:            '商品一覧カート一括追加処理完了',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:1774:     * ユニサーチ用クエリ文字列を JSON で返す（message は生のクエリ。trans や sprintf しない）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/ORM/Query/Extract.php:114:            'sqlite' => sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/ORM/Query/Extract.php:118:            'postgresql' => sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/ORM/Query/Extract.php:123:            default => sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:517:    #[Route(path: '/mypage/shopping_history_printOrderReceipt/{id}', requirements: ['id' => '\d+'], name: 'mypage_shopping_history_printOrderReceipt', methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:518:    public function printOrderReceipt(int $id): Response
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerMailController.php:43:     * 会員一括メール送信
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:104:     * @method Order setBrowserPrintFlg(bool $browser_print_flg)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:735:        #[ORM\Column(name: 'browser_print_flg', type: Types::BOOLEAN, options: ['default' => false, 'comment' => 'ブラウザ印刷フラグ'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:736:        private bool $browser_print_flg = false;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2106:            return sprintf('%s%s%s', $this->getFax01(), $this->getFax02(), $this->getFax03());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2111:            return $this->browser_print_flg;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2114:        public function setBrowserPrintFlg(bool $browser_print_flg): Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2116:            $this->browser_print_flg = $browser_print_flg;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2171:            return sprintf('%s%s%s', $this->getTel01(), $this->getTel02(), $this->getTel03());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/UserDataController.php:55:        $file = sprintf('@user_data/%s.twig', $Page->getFileName());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:1268:        #[ORM\Column(name: 'stack_paper_threshold', type: Types::INTEGER, nullable: true, options: ['unsigned' => true, 'comment' => 'スタック用紙の高額商品閾値'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:1269:        private ?int $stack_paper_threshold = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:1271:        public function getStackPaperThreshold(): ?int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:1273:            return $this->stack_paper_threshold;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:1276:        public function setStackPaperThreshold(?int $stack_paper_threshold): BaseInfo
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:1278:            $this->stack_paper_threshold = $stack_paper_threshold;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:1328:        #[ORM\Column(name: 'printer_ip_address', type: Types::STRING, length: 15, nullable: true, options: ['comment' => 'レシートプリンタープライベートIPアドレス'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:1329:        private ?string $printer_ip_address = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:1333:            return $this->printer_ip_address;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:1336:        public function setPrinterIpAddress(?string $printer_ip_address): BaseInfo
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:1338:            $this->printer_ip_address = $printer_ip_address;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardController.php:306:     * カード一括削除.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardController.php:348:                log_error('カード一括削除エラー', ['id' => $card->getId(), 'message' => $e->getMessage()]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardCsvController.php:168:     * 一括操作後にカード検索一覧へ戻す（ページ番号と再開フラグを付与）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Block/SearchEventController.php:24:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Block/SearchEventController.php:36:        private readonly RequestStack $requestStack,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Block/SearchEventController.php:50:        $mainRequest = $this->requestStack->getMainRequest() ?? $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BlockController.php:170:            $dir = sprintf('%s/app/template/%s/Block',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BlockController.php:253:            $dir = sprintf('%s/app/template/%s/Block',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Block/DeckDetailedSearchModalController.php:26:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Block/DeckDetailedSearchModalController.php:33:        private readonly RequestStack $requestStack,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Block/DeckDetailedSearchModalController.php:50:        $mainRequest = $this->requestStack->getMainRequest() ?? $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:315:        $fileName = sprintf('%s%d.%s', uniqid(), random_int(100, 999), $extension);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Block/EventDetailedSearchModalController.php:24:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Block/EventDetailedSearchModalController.php:34:        private readonly RequestStack $requestStack,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Block/EventDetailedSearchModalController.php:48:        $mainRequest = $this->requestStack->getMainRequest() ?? $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CreateLatestArticleListAction.php:68:            throw new \RuntimeException(sprintf('WordPress APIの取得に失敗しました。HTTPステータス: %d', $statusCode));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/AbstractController.php:239:            throw new RouteNotFoundException(sprintf('The named route "%s" as such route does not exist.', $route));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/AbstractController.php:334:            throw new \LogicException(sprintf('You cannot use the "%s" method if the Twig Bundle is not available. Try running "composer require symfony/twig-bundle".', $method));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchExportService.php:248:                        throw new \RuntimeException(sprintf('Unisearch chunk export failed. index=%d error=%s', $task['index'], trim($process->getErrorOutput())));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchExportService.php:253:                        throw new \RuntimeException(sprintf('Unisearch chunk export returned invalid count. index=%d output="%s"', $task['index'], $output));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:34:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:100:        private readonly RequestStack $requestStack,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:637:        $request = $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_tag.sql:5623:<img src="https://files.hareruyamtg.com/img/ec_middle_banner/baner_2412_deck_bulk.webp"  alt="デッキの価格を一括で調べる">
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_category.sql:99:	 (124,8,1,'CSP構築済み',3,238,'2019-03-21 16:39:13+09','2022-11-15 13:39:40+09','Coldsnap Theme Deck Reprints',false,NULL,false,false,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/BuyOrderRestockListService.php:113:                $errs[] = sprintf('買取番号: %07d は存在しません。', $orderId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/BuyOrderRestockListService.php:118:                $errs[] = sprintf('買取番号: %07d 出力対象に入庫待ち、入庫済み以外のステータスが設定されています。', $orderId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php:103:                log_info('イベント一括登録CSV登録開始');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EventEntryBulkCsvController.php:137:                    log_info('イベント一括登録CSV登録完了');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase/PurchaseDetailUpdateAction.php:344:        // 4. 原価按分を一括再計算
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/ScheduleController.php:167:     * スケジュール一括削除
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockApprovalListUpdateAction.php:29: * 在庫編集承認一覧の一括承認・一括却下処理。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockApprovalListUpdateAction.php:44:     * 在庫編集承認一覧の一括承認・一括却下処理。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:83:              <devid>local_printer</devid>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:85:              <printjobid>{$Order['order_id']}</printjobid>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:88:              <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:146:              </epos-print>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:78:            foreach ($xml->ePOSPrint as $print) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:79:                $orderId = explode('_', (string) $print->Parameter->printjobid)[0];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionCsvUploadAction.php:29: * 在庫移動実績CSVアップロード（送り状No.一括登録）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ActionInput/UpdateStackListInput.php:18:final readonly class UpdateStackListInput
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2248:Sleeve packs will have a black sticker on the back to identify them as third print run sleeves. <br/>
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2290:<br/>Sleeve packs will have a black sticker on the back to identify them as third print run sleeves.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:4394:Sleeve packs will have a black sticker on the back to identify them as third print run sleeves. <br/>
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:4434:<br/>Sleeve packs will have a black sticker on the back to identify them as third print run sleeves.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:4477:<br/>Sleeve packs will have a black sticker on the back to identify them as third print run sleeves.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:5815:92mm*67mm','MTGS-027 エンスカイ プレイヤーズカードスリーブ イクサランの相克 《風雲艦隊の疾走者》 80枚入り','','2026-05-20 19:25:25+09','2026-05-20 19:25:25+09','MTGS-027 Ensky Players Card Sleeve Rivals of Ixalan 《Storm Fleet Sprinter》 80ct',NULL,'【Size】<br/>
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:17882:It adds a variety of high-gloss foil printing effects. <br/>
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:17887:Material: Paper (cold foil printing)<br/>
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:17911:It adds a variety of high-gloss foil printing effects. <br/>
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:17916:Material: Paper (cold foil printing)<br/>
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:17940:It adds a variety of high-gloss foil printing effects. <br/>
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:17945:Material: Paper (cold foil printing)<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:85:                    ? sprintf('%08d', (int) $orderNumberEntity)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/GenerateShippingStandbyListAction.php:44:                    throw new \InvalidArgumentException(sprintf('注文タイプが見つかりません (id: %s)。', $orderTypeId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/ActionInput/StockBulkApprovalStoreInput.php:22: * 在庫一括承認の入力（共通項目＋明細配列を持つDTO）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdateStackListAction.php:23:use Eccube\Service\Admin\Order\ActionInput\UpdateStackListInput;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdateStackListAction.php:25:class UpdateStackListAction
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdateStackListAction.php:36:    public function handle(UpdateStackListInput $input): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/ActionInput/StockBulkApprovalItem.php:21: * 在庫一括承認の1行分のデータ（明細。InputではなくDTOの配列プロパティに格納する値）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/ApprovalListRowBuilder.php:92:                && $ApprovalList->getRegisteredMember()->getId() !== $currentMemberId; // 登録者と現在のログインユーザーが違う場合のみ一括操作を可能にする
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/ApprovalListRowBuilder.php:93:            // TODO 承認状態が「スマレジ連携失敗」の場合も一括操作を可能にする
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/ApprovalListRowBuilder.php:102:            // 編集・一括編集・変更CSV・分割・結合、合計在庫増減数・合計総原価増減数・在庫変動区分を表示
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/OtcBuyOrderRestockListService.php:112:                $errs[] = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/OtcBuyOrderRestockListService.php:123:                $errs[] = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/StockCostCalculator.php:69:     * 原価（subtotal）を一括再計算する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockTransferStoreAction.php:93:                    throw new \Exception(sprintf('振替先の商品コード「%s」が見つかりません', $destProductCode));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockTransferStoreAction.php:102:                    throw new \Exception(sprintf('振替先の商品在庫（商品コード: %s）が見つかりません', $destProductCode));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockEditLineItemRowBuilder.php:94:            'store_and_stock_location' => sprintf('%s / %s', $shopName, $locationName),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/UpdateOtcBuyOrderStockAction.php:96:        // 3. 原価（subtotal）を一括再計算
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockChangeHistoryListBuilder.php:170:        return sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:43:    #[Route(path: '/api/order/prints/direct/{base_info_id}', name: 'order_direct_print', requirements: ['base_info_id' => '\d+'], methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:60:                $dir = '/var/www/html/ec-cube/var/log/print_logs/';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:64:                $filename = $dir . 'print_' . date('Ymd_His') . '_' . uniqid() . '.xml';;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiTransactionProcessDispatcher.php:54:        $Job->setPayloadSummary(sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/EventScheduleController.php:63:        $rangeStart = $today->modify(sprintf('%+d days', $offsetDays));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/EventScheduleController.php:64:        $rangeEnd = $rangeStart->modify(sprintf('+%d days', self::SCHEDULE_RANGE_DAYS));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/EventScheduleController.php:78:        $monthStart = \DateTimeImmutable::createFromFormat('!Y-m-d', sprintf('%s-%s-01', $year, $month));
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:248:{2}{White}, 雄鹿の蹄の跡の上から蹄跡カウンター４個を取り除く：飛行を持つ白の４/４のエレメンタル・クリーチャー・トークン１体を生成する。あなたのターンにしか起動できない。','Whenever you draw a card, you may put a hoofprint counter on Hoofprints of the Stag.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:249:{2}{White}, Remove four hoofprint counters from Hoofprints of the Stag: Create a 4/4 white Elemental creature token with flying. Activate only during your turn.','','','140',0,false,0,'2024-07-21 05:07:03+09','2025-07-31 21:16:00+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:7747:You may cast Undead Sprinter from your graveyard if a non-Zombie creature died this turn. If you do, Undead Sprinter enters with a +1/+1 counter on it.','2','2','237',0,false,0,'2024-09-15 03:54:13+09','2025-07-31 22:35:27+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:8163:You may cast Undead Sprinter from your graveyard if a non-Zombie creature died this turn. If you do, Undead Sprinter enters with a +1/+1 counter on it.','2','2','350',0,false,0,'2024-09-15 03:54:18+09','2025-07-31 22:35:27+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:9553:You may cast Undead Sprinter from your graveyard if a non-Zombie creature died this turn. If you do, Undead Sprinter enters with a +1/+1 counter on it.','2','2','237',1,false,0,'2024-09-15 04:17:36+09','2025-07-31 22:35:27+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:9969:You may cast Undead Sprinter from your graveyard if a non-Zombie creature died this turn. If you do, Undead Sprinter enters with a +1/+1 counter on it.','2','2','350',1,false,0,'2024-09-15 04:17:41+09','2025-07-31 22:35:27+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:10613:You may cast Undead Sprinter from your graveyard if a non-Zombie creature died this turn. If you do, Undead Sprinter enters with a +1/+1 counter on it.','2','2','237',1,true,0,'2024-09-15 04:17:46+09','2025-07-31 22:35:27+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:12541:You may cast Undead Sprinter from your graveyard if a non-Zombie creature died this turn. If you do, Undead Sprinter enters with a +1/+1 counter on it.','2','2','237',0,true,0,'2024-10-12 21:23:48+09','2025-07-31 22:35:27+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:12956:You may cast Undead Sprinter from your graveyard if a non-Zombie creature died this turn. If you do, Undead Sprinter enters with a +1/+1 counter on it.','2','2','237',1,true,0,'2024-10-12 21:23:52+09','2025-07-31 22:35:27+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:24271:	 (171216,43183,1,2,387,2722,1,NULL,'アヴィシュカーの派遣団はサウリド独裁政権との協定は結ばれたものと考えていたが、それは大きな間違いであった。独裁政権にとって外交とは、ペンではなく剣の問題である。グランプリの防衛体制を試すことは、彼らの流儀では対案の提示にすぎないのだ。','The Avishkari delegation considered their treaties with the Saurid Autocracy settled, but that was a crucial misunderstanding. To the Autocracy, diplomacy is a matter of power, not paper; testing the Grand Prix''s defenses is merely their way of making a counteroffer.','','','4','1','149',0,false,0,'2025-02-02 01:44:04+09','2025-07-31 22:37:05+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:26152:このクリーチャーによって追放されているカードがクリーチャー・カードであるかぎり、このクリーチャーは、これによって最後に追放されたクリーチャー・カードのパワーとタフネスとクリーチャー・タイプを持つ。これは多相の戦士でもある。','Imprint — When this creature enters, you may exile target nontoken creature.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:26638:(Ｔ)：その追放されたカードと共通する好きな色のマナ１点を加える。','Imprint — When Chrome Mox enters the battlefield, you may exile a nonartifact, nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:26670:(Ｔ)：その追放されたカードと共通する好きな色のマナ１点を加える。','Imprint — When Chrome Mox enters the battlefield, you may exile a nonartifact, nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:26703:(Ｔ)：その追放されたカードと共通する好きな色のマナ１点を加える。','Imprint — When Chrome Mox enters the battlefield, you may exile a nonartifact, nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:27289:	 (172146,43183,1,2,387,2722,1,NULL,'アヴィシュカーの派遣団はサウリド独裁政権との協定は結ばれたものと考えていたが、それは大きな間違いであった。独裁政権にとって外交とは、ペンではなく剣の問題である。グランプリの防衛体制を試すことは、彼らの流儀では対案の提示にすぎないのだ。','The Avishkari delegation considered their treaties with the Saurid Autocracy settled, but that was a crucial misunderstanding. To the Autocracy, diplomacy is a matter of power, not paper; testing the Grand Prix''s defenses is merely their way of making a counteroffer.','','','4','1','149',1,false,0,'2025-02-02 04:02:16+09','2025-07-31 22:37:05+09'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Product/ProductClassUpdateAction.php:78:            // DQL の一括 DELETE ではなく ORM 管理下の remove を使うことで、
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderPdfService.php:378:        // 文書タイトル（納品書・請求書）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:53:use Eccube\Service\Admin\Order\ActionInput\UpdateStackListInput;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:55:use Eccube\Service\Admin\Order\UpdateStackListAction;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:112:        protected UpdateStackListAction $updateStackListAction,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:347:     * 受注複数一括削除
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:489:                log_info('対応状況一括変更スキップ');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:551:                log_info('対応状況一括変更処理完了', [$Order->getId()]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:727:     * 受注情報 納品書一括印刷
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:731:    #[Route(path: '/%eccube_admin_route%/order/print/delivery_slips/{lang}', name: 'admin_delivery_slips_export', requirements: ['lang' => 'ja|en'], methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:832:    #[Route(path: '/%eccube_admin_route%/order/print/stack/window', name: 'admin_order_print_stack_window', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:833:    #[Template(template: '@admin/Order/print_stack_window.twig')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:834:    public function printStackWindow(Request $request): Response
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:838:        return $this->render('@admin/Order/print_stack_window.twig', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:850:    #[Route(path: '/%eccube_admin_route%/order/print/stack', name: 'admin_order_print_stack', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:851:    public function printStackPaper(Request $request): JsonResponse
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:894:                'browser_print_flg' => true,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:906:                $this->updateStackListAction->handle(new UpdateStackListInput(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:104:     * @param DtbShippingStandbyRepository       $dtbShippingStandbyRepository 編集画面用：納品書
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:1173:                    'name' => sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:1303:     * 納品書を印刷.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:1312:    #[Route(path: '/%eccube_admin_route%/order/{id}/print/delivery', name: 'admin_order_print_delivery_slips', requirements: ['id' => '\d+'], methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:1313:    public function printDeliverySlip(Request $request, int $id): array|Response
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/OtcGuestPatternHandler.php:47:            throw new \RuntimeException(sprintf('Failed to acquire Smaregi OTC order creation lock (transactionHeadId=%s)', $transactionHeadId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php:296:     * 一括手動メール通知
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php:320:                    sprintf($this->translator->trans('admin.order.mail_all.error.missing'), $missingId),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/OtcMemberPatternHandler.php:54:            throw new \RuntimeException(sprintf('Failed to acquire Smaregi OTC order creation lock (transactionHeadId=%s)', $transactionHeadId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/BulkUpdateHandler.php:22: * 一括更新 (bulk-update) webhook ハンドラ。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/BulkUpdateHandler.php:24: * 検証環境 (Smaregi サンドボックス) で確認したところ、スマレジ管理画面の取引一括更新系
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/BulkUpdateHandler.php:25: * 操作 (例: 締め日の一括更新) は本 action ではなく `edited` で複数 transactionHeadIds を
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/BulkDeletedHandler.php:22: * 一括削除 (bulk-deleted) webhook ハンドラ。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/BulkDeletedHandler.php:24: * 検証環境 (Smaregi サンドボックス) でスマレジ管理画面の取引一括削除を試行したところ、
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:284:    #[Route(path: '/%eccube_admin_route%/standby/{id}/print/picking', name: 'admin_shipping_standby_print_picking_list', requirements: ['id' => '\d+'], methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:285:    public function printPickingList(Request $request, $id)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:392:     * 出荷指示リスト 納品書印刷
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:400:    #[Route(path: '/%eccube_admin_route%/standby/{id}/print/delivery/{lang}', name: 'admin_shipping_standby_print_delivery_slips', requirements: ['id' => '\d+', 'lang' => 'ja|en'], methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:401:    public function printDeliverySlips(Request $request, int $id, string $lang): Response
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Event/EventEntryRegisterAction.php:108:        return 'EV'.$Entry->getCreateDate()->format('Ymdhi').'-'.sprintf('%010d', $Entry->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiCustomerApiClient.php:47:        $url = sprintf('%s/%s/pos/customers', rtrim($apiUrl, '/'), $contractId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiCustomerApiClient.php:75:        $url = sprintf('%s/%s/pos/customers', rtrim($apiUrl, '/'), $contractId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiCustomerApiClient.php:101:        $url = sprintf('%s/%s/pos/customers/%s', rtrim($apiUrl, '/'), $contractId, rawurlencode($smaregiCustomerId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiCustomerApiClient.php:128:        $url = sprintf('%s/%s/pos/customers', rtrim($apiUrl, '/'), $contractId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiCustomerApiClient.php:155:        $url = sprintf('%s/%s/pos/customers/%s', rtrim($apiUrl, '/'), $contractId, rawurlencode($smaregiCustomerId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiCustomerApiClient.php:186:        $url = sprintf('%s/%s/pos/customers/%s', rtrim($apiUrl, '/'), $contractId, rawurlencode($smaregiCustomerId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiCustomerApiClient.php:215:        $url = sprintf('%s/%s/pos/customers/%s/point/add', rtrim($apiUrl, '/'), $contractId, rawurlencode($smaregiCustomerId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:52:            throw new \InvalidArgumentException(sprintf('Stock add quantity must be positive. given=%d', $quantity));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:55:        $url = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:94:        $url = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:134:        $url = sprintf('%s/%s/pos/stock', rtrim($apiUrl, '/'), $contractId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:166:        $url = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiAccessTokenService.php:71:        $url = sprintf('%s/app/%s/token', rtrim($idUrl, '/'), $contractId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiSectionApiClient.php:42:        $url = sprintf('%s/%s/pos/categories', rtrim($apiUrl, '/'), $contractId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiSectionApiClient.php:69:        $url = sprintf('%s/%s/pos/categories', rtrim($apiUrl, '/'), $contractId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiSectionApiClient.php:103:        $url = sprintf('%s/%s/pos/categories/%s', rtrim($apiUrl, '/'), $contractId, $smaregiCategoryId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiGuzzleClientFactory.php:21:use GuzzleHttp\HandlerStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiGuzzleClientFactory.php:54:        $stack = HandlerStack::create();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Event/EventSlnLinkPaymentService.php:75:        return sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Event/EventSlnLinkPaymentService.php:113:            throw new \RuntimeException(sprintf('Required plugin service "%s" is not available.', $id));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Event/EventSlnLinkPaymentService.php:119:            throw new \RuntimeException(sprintf('Required plugin service "%s" is not available.', $id), 0, $e);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiTransactionApiClient.php:59:        $url = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiTransactionApiClient.php:105:        $url = sprintf('%s/%s/pos/transactions', rtrim($apiUrl, '/'), $contractId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/SmaregiMockResponder.php:188:            'message' => sprintf('Mock endpoint not implemented: %s %s', $method, $path),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/SmaregiMockHttpClientFactory.php:19:use GuzzleHttp\HandlerStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/SmaregiMockHttpClientFactory.php:43:            'handler' => HandlerStack::create($handler),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/MtgMasterDataEntityManager.php:54:                throw new \RuntimeException(sprintf('Method %s::%s() does not exist.', get_class($Entity), $setter));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderEntityManager.php:79:     * ステータス更新 + 履歴保存を一括で行う
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/FavoriteSaleNotificationCommand.php:58:            $io->success(sprintf('お気に入り商品セール通知を%d名に送信しました。', $count));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/LoadDataFixturesEccubeCommand.php:212:        $output->writeln(sprintf('  <comment>></comment> <info>%s</info>', 'Finished Successful!'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/InstallerCommand.php:258:                $this->io->text(sprintf('<info>Run %s</info>...', implode(' ', $command)));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/InstallerCommand.php:286:        throw new \LogicException(sprintf('Database Url %s is invalid.', $databaseUrl));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/InstallerCommand.php:301:            throw new \LogicException(sprintf('Database Url %s is invalid.', $databaseUrl));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/PluginGenerateCommand.php:114:        $this->io->success(sprintf('Plugin was successfully created: %s %s %s', $name, $code, $version));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/DailySummaryAggregateCommand.php:81:        $io->success(sprintf('日次集計テーブル更新が完了しました。対象日: %s / 更新件数: %d', $summaryDate->format('Y-m-d'), $affected));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckNotReflectedPointUsageCommand.php:68:            $io->success(sprintf('ポイント利用未反映が検出されました。（%d件）', $count));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiStockBackfillCommand.php:68:        $message = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderSequenceNoProcessor.php:42:            $Order->setOrderNumber(sprintf('%08d', $this->orderRepository->getNextOrderNumber()));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/Seeder/SeedUnisearchPurchaseTagCommand.php:78:        $io->note(sprintf('UniSearch 取得: tag=%d, rows=%d', $tagId, $pageSize));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/Seeder/SeedUnisearchPurchaseTagCommand.php:90:        $io->success(sprintf('UniSearch: numFound=%d, docs=%d', $numFound, \count($docs)));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/Seeder/SeedUnisearchPurchaseTagCommand.php:114:                $io->writeln(sprintf('  skip: product_class %d は既に存在', $existingClassId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/Seeder/SeedUnisearchPurchaseTagCommand.php:119:            $io->writeln(sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/Seeder/SeedUnisearchPurchaseTagCommand.php:137:        $io->success(sprintf('完了: created=%d, skipped=%d%s', $created, $skipped, $dryRun ? ' (dry-run)' : ''));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/Seeder/SeedUnisearchPurchaseTagCommand.php:261:            'product_code' => sprintf('US-%d', $summary['productClassId']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/Seeder/SeedUnisearchPurchaseTagCommand.php:373:            sprintf("SELECT setval('%s', GREATEST((SELECT COALESCE(MAX(id), 1) FROM %s), 1))", $sequenceName, $tableName),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PluginApiService.php:23:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PluginApiService.php:35:    public function __construct(private readonly EccubeConfig $eccubeConfig, private readonly RequestStack $requestStack, private readonly BaseInfoRepository $baseInfoRepository, private readonly PluginRepository $pluginRepository)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PluginApiService.php:249:        if ($this->requestStack->getCurrentRequest()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PluginApiService.php:250:            $baseUrl = $this->requestStack->getCurrentRequest()->getSchemeAndHttpHost().$this->requestStack->getCurrentRequest()->getBasePath();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/Seeder/SeedPurchaseCategoryDisplayCommand.php:641:            throw new \RuntimeException(sprintf('テーブル %s に id 用シーケンスがありません', $tableName));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/Seeder/SeedPurchaseCategoryDisplayCommand.php:662:        $maxId = (int) $this->connection->fetchOne(sprintf('SELECT COALESCE(MAX(id), 0) FROM %s', $tableName));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/StockDiffProcessor.php:382:            MtbStockChangeTypeDetail::ORDER_CANCEL => sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/StockDiffProcessor.php:387:            MtbStockChangeTypeDetail::ORDER_STOCKOUT_INCREASE => sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/StockDiffProcessor.php:393:            MtbStockChangeTypeDetail::ORDER_STOCKOUT_DECREASE => sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/StockDiffProcessor.php:398:            MtbStockChangeTypeDetail::ORDER_COMPLETE => sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/StockDiffProcessor.php:404:            MtbStockChangeTypeDetail::ORDER_ADD => sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/StockDiffProcessor.php:409:            default => sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/Seeder/AbstractSeederCommand.php:87:                        $conn->executeStatement(sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckDuplicatePointCommand.php:62:            $io->success(sprintf('ポイント二重登録が検出されました。（%d件）', $count));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Upload/Adapters/S3FileAdapter.php:84:            'Key' => sprintf('%s/%s', $path, $filename),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Upload/Adapters/S3FileAdapter.php:93:            $publicURL = $this->cdnService->CloudStorageLinkToCDNLink(sprintf('%s/%s', $path, $filename));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Upload/Adapters/S3FileAdapter.php:102:            's3_object_key' => sprintf('%s/%s', $path, $filename),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Upload/Adapters/S3FileAdapter.php:243:                'Key' => sprintf('%s/%s', $newPath, $newFileName),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Upload/Adapters/S3FileAdapter.php:244:                'CopySource' => sprintf('%s/%s', $options['s3_bucket_name'] ?? $this->bucketName, $path),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Upload/Adapters/S3FileAdapter.php:253:            $publicURL = $this->cdnService->CloudStorageLinkToCDNLink(sprintf('%s/%s', $newPath, $newFileName));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Upload/Adapters/S3FileAdapter.php:262:            's3_object_key' => sprintf('%s/%s', $newPath, $newFileName),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Upload/Adapters/S3FileAdapter.php:324:            'Key' => sprintf('%s/%s', $path, $filename),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Upload/Adapters/S3FileAdapter.php:333:            $publicUrl = $this->cdnService->CloudStorageLinkToCDNLink(sprintf('%s/%s', $path, $filename));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Upload/Adapters/S3FileAdapter.php:339:            's3_object_key' => sprintf('%s/%s', $path, $filename),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderNoProcessor.php:74:                                            return sprintf("%0{$res[1]}d", $Order->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderNoProcessor.php:78:                                            return sprintf("%0{$res[1]}d", $random);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiUpdatePointCommand.php:59:        $io->text(sprintf('スマレジ使用ポイント連携バッチ開始 orderId=%s', $orderId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiUpdatePointCommand.php:72:        $io->success(sprintf('スマレジ使用ポイント連携処理が完了しました。orderId=%s', $orderId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CancelProductRequestCommand.php:55:        $io->success(sprintf('入荷通知キャンセルが完了しました。（%d件）', $count));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/InitialStockRegistrationCommand.php:71:        $io->success(sprintf('在庫初期化が完了しました。（%d件作成、新店舗ID=%d）', $count, $targetBaseInfoId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/MonthlySummaryAggregateCommand.php:71:        $io->success(sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/PluginCommandTrait.php:45:            $io->text(sprintf('<info>Run %s</info>...', implode(' ', $command)));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/GenerateDummyDataCommand.php:167:        $output->writeln(sprintf('%s <info>success</info>', 'eccube:fixtures:generate'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Upload/FileManager.php:68:            throw new \InvalidArgumentException(sprintf('FileAdapter "%s" not found.', $adapter));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcDeleteCommand.php:55:            ->addOption('limit', null, InputOption::VALUE_REQUIRED, '一括 enqueue する受注の最大件数', '100');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcDeleteCommand.php:92:                $io->writeln(sprintf('  - orderId=%d jobId=%d enqueued', $Order->getId() ?? 0, $Job->getId() ?? 0));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcDeleteCommand.php:99:                $io->writeln(sprintf('  - orderId=%d enqueue_failed: %s', $Order->getId() ?? 0, $e->getMessage()));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcDeleteCommand.php:103:        $message = sprintf('OTC delete enqueue completed: enqueued=%d failed=%d', $enqueued, $failed);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcDeleteCommand.php:128:            $io->error(sprintf('受注 ID %s が見つかりません。', $orderId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:111:        $orderDate = (new \DateTime())->modify(sprintf('-%d minutes', (int) $minutesAgoOption));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:136:            $io->error(sprintf('Delivery (id=%d) が見つかりません。', $deliveryId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:173:        $io->success(sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:208:        $Order->setOrderNo(sprintf('%s%04d', date('YmdHis'), random_int(0, 9999)));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:212:        $Order->setOrderNumber(sprintf('%08d', random_int(0, 99999999)));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/ResendMailCommand.php:71:        $message = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/ProductImageService.php:64:                throw new \LogicException(sprintf('画像が登録されていません: %s', $fileName));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/ProductImageService.php:275:        $sql = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:58:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:75:    private RequestStack $requestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:90:        RequestStack $requestStack,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:101:        $this->requestStack = $requestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:108:        return $this->requestStack->getCurrentRequest()?->getLocale() ?? 'ja';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:996:     * 会員メール一括送信
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1000:        log_info('会員メール一括送信開始');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1013:            log_info('会員メール一括送信完了');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1334:            $lines[] = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1693:     * 在庫管理承認通知メール一括送信
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1697:        log_info('在庫管理承認通知メール一括送信開始');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1739:            log_info('在庫管理承認通知メール一括送信完了');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1980:            $request = $this->requestStack->getMainRequest() ?? $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2085:     * 一括用手動メール送信
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/InventoryReflectService.php:132:            throw new \RuntimeException(sprintf($this->translator->trans('admin.inventory_plan.stock_reflect.product_update_lock_timeout'), $inventoryPlanDetail['productClassCode']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/InventoryReflectService.php:138:            throw new \OutOfBoundsException(sprintf($this->translator->trans('admin.inventory_plan.stock_reflect.minus_stock_error'), $inventoryPlanDetail['productClassCode']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/InventoryReflectService.php:165:        $stockChangeReason = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/BatchInitialStockRegistrationAction.php:40:            throw new \RuntimeException(sprintf('新店舗（base_info_id=%d）が見つかりません。', $targetBaseInfoId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/BatchInitialStockRegistrationAction.php:45:            throw new \RuntimeException(sprintf('新店舗IDと基準店舗IDが同一です（base_info_id=%d）。', $targetBaseInfoId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/BatchInitialStockRegistrationAction.php:50:            throw new \RuntimeException(sprintf('基準店舗（base_info_id=%d）が見つかりません。', $sourceBaseInfoId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderUsePointEventService.php:60:        $job->setPayloadSummary(sprintf('orderId=%s spendedPoints=%d', $Order->getId(), $spendedPoints));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiSectionEventService.php:39:        $job->setPayloadSummary(sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiProductApiClient.php:45:        $url = sprintf('%s/%s/pos/products', rtrim($apiUrl, '/'), $contractId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiProductApiClient.php:71:        $url = sprintf('%s/%s/pos/products', rtrim($apiUrl, '/'), $contractId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiProductApiClient.php:97:        $url = sprintf('%s/%s/pos/products/%s', rtrim($apiUrl, '/'), $contractId, rawurlencode($smaregiProductId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiProductApiClient.php:120:        $url = sprintf('%s/%s/pos/products/%s', rtrim($apiUrl, '/'), $contractId, rawurlencode($smaregiProductId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php:273:            $message = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php:293:                $message = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/AbstractCsvService.php:319:            $message = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:37:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:44:    public function __construct(protected EccubeConfig $eccubeConfig, protected DeliveryRepository $deliveryRepository, protected DeliveryFeeRepository $deliveryFeeRepository, protected CartService $cartService, private readonly DtbMinimumDeliveryTimeRepository $minimumDeliveryTimeRepository, private readonly MtbOptionRepository $mtbOptionRepository, private readonly ShoppingService $shoppingService, private readonly TranslatorInterface $translator, private readonly RequestStack $requestStack)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:339:        $locale = $this->requestStack->getCurrentRequest()?->getLocale()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:342:        return $this->translator->trans(sprintf('admin.%s.%s', $deliveryTime, $locale));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Install/Step4Type.php:25:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Install/Step4Type.php:34:    public function __construct(protected RequestStack $requestStack)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Install/Step4Type.php:139:        $parameters = $this->requestStack->getCurrentRequest()->get('install_step4');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Analysis/SummaryType.php:128:                $uniqueLabel = sprintf('%s (ID:%d)', $label, $id);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Analysis/SalesType.php:243:                $uniqueLabel = sprintf('%s (ID:%d)', $label, $id);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:254:     * 一覧の一括 POST から数値のカード ID のみを重複除去して返す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:449:        return rtrim(rtrim(sprintf('%.10F', $cmc), '0'), '.');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:508:                        throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.data.not_registered', [], 'messages'), $this->columnLabelForCsvColumn('color_sequence'), $row['color_sequence'], $rowIndex));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:541:                throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.data.require', [], 'messages'), $this->columnLabelForMessage((string) $label), $rowIndex));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:600:                throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.data.not_registered', [], 'messages'), $this->columnLabelForCsvColumn('cardtype'), $nameEn, $rowIndex));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:617:                throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.data.not_registered', [], 'messages'), $this->columnLabelForCsvColumn($columnKey), $nameEn, $rowIndex));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:636:                throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.data.not_registered', [], 'messages'), $this->columnLabelForCsvColumn('subtype'), $nameEn, $rowIndex));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:655:                throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.data.not_registered', [], 'messages'), $this->columnLabelForCsvColumn('specialtype'), $nameEn, $rowIndex));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:702:                throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.data.not_registered', [], 'messages'), $this->columnLabelForCsvColumn($headerKey), $formatName, $rowIndex));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:734:            throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.product.invalid', [], 'messages'), $rowIndex, $this->columnLabelForCsvColumn('card_detail_id')));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:745:                throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.data.not_registered', [], 'messages'), $this->columnLabelForCsvColumn('card_detail_id'), $rawCardDetailId, $rowIndex));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:773:                throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.data.not_registered', [], 'messages'), $this->columnLabelForCsvColumn('set'), $row['set'], $rowIndex));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:783:                throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.data.not_registered', [], 'messages'), $this->columnLabelForCsvColumn('layout'), $layoutName, $rowIndex));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:792:                throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.data.not_registered', [], 'messages'), $this->columnLabelForCsvColumn('rarity'), $row['rarity'], $rowIndex));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:801:                throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.data.not_registered', [], 'messages'), $this->columnLabelForCsvColumn('promotion_type'), $row['promotion_type'], $rowIndex));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:831:                throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.product.invalid', [], 'messages'), $rowIndex, $this->columnLabelForCsvColumn('back_card_detail_id')));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:836:                throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.data.not_registered', [], 'messages'), $this->columnLabelForCsvColumn('back_card_detail_id'), $row['back_card_detail_id'], $rowIndex));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:975:        throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.data.not_registered', [], 'messages'), $this->columnLabelForCsvColumn('frame'), $value, $rowIndex));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/CardCsv.php:992:            throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.data.not_registered', [], 'messages'), $this->columnLabelForCsvColumn('foil'), $value, $rowIndex));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/InventoryPlanCsv.php:107:                    throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.inventory_plan_detail.product_stock_not_found'), $rowIndex, $row['商品コード']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/InventoryPlanCsv.php:111:                throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.inventory_plan_detail.product_code_non_unique'), $rowIndex, $row['商品コード']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/InventoryPlanCsv.php:116:                throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.inventory_plan_detail.product_code_duplicated'), $rowIndex, $row['商品コード']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/InventoryPlanCsv.php:177:                throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.inventory_plan_detail.product_code_not_registered'), $rowIndex, $productCode));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/InventoryPlanCsv.php:181:                throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.inventory_plan_detail.product_code_duplicated'), $rowIndex, $productCode));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/InventoryPlanCsv.php:187:                throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.inventory_plan_detail.actual_stock_invalid'), $rowIndex));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/BaseCsvColumn.php:194:        $label = sprintf('%s(%s)', $this->label, $this->name);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/CsvRow.php:131:            throw new \InvalidArgumentException(sprintf('%d 行目には %d 列目のデータが存在しません。（最大 %d 列）', $this->getRowNumber(), $index, $this->count()));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/CsvRow.php:139:            throw new \InvalidArgumentException(sprintf('ヘッダに指定されたキー %s が存在しません', $index));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/CsvRow.php:148:        throw new \InvalidArgumentException(sprintf('%d 行目には %d 列目（%s）のデータが存在しません。（最大 %d 列）', $this->getRowNumber(), $indexByHeader, $index, $this->count()));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/SearchType.php:40:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/SearchType.php:81:        private readonly RequestStack $requestStack,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/SearchType.php:94:        $locale = $this->requestStack->getCurrentRequest()?->getLocale() ?? 'ja';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/SearchType.php:346:            $choices[sprintf('form.card.mana_cost.choice_%d', $i)] = $i;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/CsvImporter.php:307:            throw new \LogicException(sprintf('%s の getLockTimeout() は %d 以上 %d 以下を返してください: %d', get_class($this->handler), self::MIN_LOCK_TIMEOUT, self::MAX_LOCK_TIMEOUT, $lockTimeout));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockShortageImportHandler.php:145:                $this->flashErrors[] = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockShortageImportHandler.php:156:                $this->flashErrors[] = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockShortageImportHandler.php:228:                return ['ok' => false, 'errors' => [sprintf('%d行目: 欠品点数は0以上の整数で入力してください。', $rowIndex + 1)]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockShortageImportHandler.php:251:                return ['ok' => false, 'errors' => [sprintf('%d行目: 商品コード「%s」がこの結合の結合元に見つかりません。', $lineNum, $code)]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockShortageImportHandler.php:256:                return ['ok' => false, 'errors' => [sprintf('%d行目: 欠品点数（%d）が結合数（%d）を超えています。', $lineNum, $qty, $max)]];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/DependencyInjection/Compiler/NavCompilerPass.php:37:                throw new \InvalidArgumentException(sprintf('Service "%s" must implement interface "%s".', $id, EccubeNav::class));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderType.php:34:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderType.php:52:     * @var RequestStack
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderType.php:54:    protected RequestStack $requestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderType.php:66:    public function __construct(EccubeConfig $eccubeConfig, RequestStack $requestStack, BaseInfoRepository $baseInfoRepository, Security $security)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderType.php:69:        $this->requestStack = $requestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OtcBuyOrder/OtcBuyOrderType.php:90:        $request = $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/DependencyInjection/Compiler/PaymentMethodPass.php:36:                throw new \InvalidArgumentException(sprintf('Service "%s" must implement interface "%s".', $id, PaymentMethodInterface::class));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/DependencyInjection/Compiler/TwigBlockPass.php:37:                throw new \InvalidArgumentException(sprintf('Service "%s" must implement interface "%s".', $id, EccubeTwigBlock::class));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MasterdataType.php:50:        // AttributeDriver でも有効なメタデータ一括取得に変更
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/DependencyInjection/Compiler/QueryCustomizerPass.php:36:                throw new \InvalidArgumentException(sprintf('Service "%s" must implement interface "%s".', $id, QueryCustomizer::class));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:334:            ->add('stack_paper_threshold', PriceType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:243:            ->add('stack_paper_threshold', PriceType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/DependencyInjection/Compiler/LocaleTwigLoaderPass.php:37:        $definition->addMethodCall('setRequestStack', [new Reference('request_stack')]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockBulkApprovalType.php:37: * 在庫一括承認用フォーム。グローバル3項目（在庫変動区分・承認部門・承認通知先）1セット + 在庫ごと3項目（item_0, item_1, ...）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SecurityType.php:24:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SecurityType.php:34:    public function __construct(protected EccubeConfig $eccubeConfig, protected ValidatorInterface $validator, protected RequestStack $requestStack, protected RouterInterface $router)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SecurityType.php:196:                $request = $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:366:	 (136,136,1,2,163,13,1,NULL,'','After I examine your cargo and check your papers, you can be on your way.','飛行
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:1836:Storm Fleet Sprinter can''t be blocked.','2','2','172',0,false,0,'2018-06-07 04:24:57+09','2025-07-31 20:32:01+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:4863:	 (1857,1738,1,2,78,258,1,NULL,'それはあらゆる物を踏み潰すが、そこには何の跡も残さない ――― 踏み荒らされた破片も、潰された魂も、蹄跡すらも。','It crushes all underfoot, yet leaves no trace of its passage—no trampled debris, no flattened souls, not even a hoofprint.','虚無跡のガルガンチュアンが戦場に出たとき、あなたがコントロールするクリーチャー１体を、オーナーのライブラリーの一番上に置く。','When Nulltread Gargantuan enters the battlefield, put a creature you control on top of its owner''s library.','5','6','102',0,false,0,'2018-06-07 05:06:58+09','2025-07-31 20:36:57+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:5661:	 (2134,1959,1,3,5,316,1,NULL,'彼ら兄弟は、人間の企みがドミニアの真の支配者に抵抗できたことなどないと、最も基本的な学習から知ったのである。','From their earliest educations, the brothers had known that no human contrivance could stand against the true masters of Dominia.','(１),(Ｔ)：Antiquitiesエキスパンションにて印刷された名前を持つトークンでない各パーマネントは、それのコントローラーによって生け贄に捧げられる。','{1}, {Tap}: Each nontoken permanent with a name originally printed in the Antiquities expansion is sacrificed by its controller.','','','51',0,false,0,'2018-06-07 05:07:35+09','2025-07-31 20:37:36+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:6193:プレイヤーは、Arabian Nightsエキスパンションにて印刷された名前を持つ呪文を唱えたり土地をプレイしたりできない。','Whenever another nontoken permanent with a name originally printed in the Arabian Nights expansion is on the battlefield, its controller sacrifices it.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:6194:Players can''t cast spells or play lands with a name originally printed in the Arabian Nights expansion.','','','60',0,false,0,'2018-06-07 05:07:58+09','2025-07-31 20:38:15+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:6677:	 (2584,2370,1,2,106,353,1,NULL,'「アンデッドの肉は乾燥してて紙みたいだろ。 火花が落ちれば『ボワッ』といって、グールさんさよならだ。」','Undead flesh is dry and papery. A single spark and ‘poof.'' No more ghoul.','エンチャント（クリーチャー）
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:9301:	 (3697,3337,1,2,28,194,1,NULL,'彼女は沼で死んだ。お前もそうなる。','It moved through the troops leaving no footprints, save on their souls.','沼渡り（このクリーチャーは、防御プレイヤーが沼(Swamp)をコントロールしているかぎりブロックされない。）','Swampwalk (This creature can''t be blocked as long as defending player controls a Swamp.)','3','3','118',0,false,0,'2018-06-07 05:11:59+09','2025-07-31 20:45:20+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:11122:	 (4431,4016,1,3,51,257,1,NULL,'今日の文鎮は、明日の地ならし屋ってとこね。――― ニューロックの指導者ブルエナ.','Today''s paperweight, tomorrow''s leveler.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:11325:死面の映し身人形に追放されたカードが飛行を持っているかぎり、死面の映し身人形は飛行を持つ。畏怖、先制攻撃、二段攻撃、速攻、土地渡り、プロテクション、トランプルについても同様である。','Imprint — {1}: Exile target creature card from your graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:11382:あなたのアップキープの開始時に、あなたは一望の鏡に追放されているそのインスタント・カードかソーサリー・カードの１枚をコピーしてもよい。そうした場合、あなたはそのコピーを、そのマナ・コストを支払うことなく唱えてもよい。','Imprint — {X}, {Tap}: You may exile an instant or sorcery card with mana value X from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:11406:装備(４)','Imprint — When Spellbinder enters the battlefield, you may exile an instant card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:12068:	 (4767,4350,1,3,115,225,1,NULL,'契約には血判を押すこと。','Make sure you bleed the fine print.','あなたの手札にカードがないときにあなたがカードを引く場合、代わりにあなたはカードを２枚引き、１点のライフを失う。','If you would draw a card while you have no cards in hand, instead draw two cards and lose 1 life.','2','1','22',0,false,0,'2018-06-07 05:14:06+09','2025-07-31 20:49:42+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:12916:疾駆(３)(赤)（あなたはこの呪文を、これの疾駆コストで唱えてもよい。そうしたなら、これは速攻を得るとともに、次の終了ステップの開始時にこれを戦場からオーナーの手札に戻す。）','Sprinting Warbrute attacks each combat if able.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:16962:召喚者の卵が死亡したとき、その追放されている裏向きのカードを表向きにする。それがクリーチャー・カードである場合、それをあなたのコントロール下で戦場に出す。','Imprint — When Summoner''s Egg enters the battlefield, you may exile a card from your hand face down.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:17434:	 (6772,3300,1,2,17,303,1,NULL,'氷と議論するようなもの――― 「時間の無駄」という意味のヴォーデイリアの言い回し.','"As we neared, Belfar proclaimed the wall to be made of glass and went forward to prove it. We had no choice but to pull his hands free from where he had touched it, leaving flesh palmprints on the icy wall."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:19903:	 (7773,6520,1,1,113,73,1,NULL,'「契約には未払いが発生した場合の付随担保が明記されています。細則にはこうあります。『付随担保は頭部とする。』」','The contract specified an appendage for a missed payment. Read the fine print: the head is an appendage.','このターンにダメージを与えたクリーチャー１体を対象とする。それはターン終了時まで-5/-5の修整を受ける。','Target creature that dealt damage this turn gets -5/-5 until end of turn.','','','161',0,false,0,'2018-06-07 20:56:31+09','2025-07-31 21:10:22+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:20064:	 (7832,6578,1,3,113,95,1,NULL,'「無数の契約に記した細則のおかげで、私たちが無防備になることはなくなったのよ。」 ――― オルゾフの大特使、テイサ・カルロフ','"The fine print of countless contracts has ensured we are never defenseless."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:20648:—Grandmother Sengir','(２),(Ｔ),Apocalypse Chimeを生け贄に捧げる：すべてのHomelandsエキスパンションにて印刷された名前を持つトークンでないパーマネントを破壊する。それらは再生できない。','{2}, {Tap}, Sacrifice Apocalypse Chime: Destroy all nontoken permanents with a name originally printed in the Homelands expansion. They can''t be regenerated.','','','101',0,false,0,'2018-06-08 02:35:26+09','2025-07-31 21:11:09+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:25090:	 (9678,8123,1,2,131,89,1,NULL,'','The most ferocious saddlebrutes lead the assault, ramming through massed pikes and stout barricades as if they were paper and silk.','マルドゥの荒くれ乗りが攻撃するたび、クリーチャー１体を対象とする。このターン、それではブロックできない。','Whenever Mardu Roughrider attacks, target creature can''t block this turn.','5','4','187',0,false,0,'2018-06-12 05:09:06+09','2025-07-31 21:14:32+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:26930:{2}{White}, 雄鹿の蹄の跡の上から蹄跡カウンター４個を取り除く：飛行を持つ白の４/４のエレメンタル・クリーチャー・トークン１体を生成する。あなたのターンにしか起動できない。','Whenever you draw a card, you may put a hoofprint counter on Hoofprints of the Stag.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:26931:{2}{White}, Remove four hoofprint counters from Hoofprints of the Stag: Create a 4/4 white Elemental creature token with flying. Activate only during your turn.','','','21',0,false,0,'2018-06-20 05:00:10+09','2025-07-31 21:16:00+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:27325:"a giant''s footprint"','クリーチャー１体を対象とする。あなたがコントロールする巨人(Giant)クリーチャーを１体選ぶ。その巨人はそのクリーチャーに、自身のパワーに等しい点数のダメージを与える。','Choose a Giant creature you control. It deals damage equal to its power to target creature.','','','162',0,false,0,'2018-06-20 05:00:18+09','2025-07-31 21:16:24+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:29312:	 (12681,9403,1,1,108,23,1,NULL,'「愚かな。お宝を紙の箱に入れて紐で結わいておくのと変わらないじゃないか。」','Pathetic. You might as well have protected your treasures with a paper box and some string.','エンチャント（クリーチャー） エンチャントされているクリーチャーは+2/+0の修整を受けるとともにブロックされない。','Enchant creature Enchanted creature gets +2/+0 and can''t be blocked.','0','0','74',0,false,0,'2018-06-27 03:19:07+09','2025-07-31 21:18:50+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:29584:	 (12816,4937,1,2,108,23,1,NULL,'遥か昔の侵略兵器であるぎらつく油は、数え切れない程の残虐行為の設計図を内に抱えている。','An invasion weapon of ages past, the glistening oil contained the blueprints of countless atrocities.','','','5','4','209',0,false,0,'2018-06-27 03:19:14+09','2025-07-31 21:03:55+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:31997:	 (13950,10183,1,2,32,328,1,NULL,'いちいち書類をそろえるより、ワイロのほうが話が早いんだよ。','A bribe is always faster than filling out paperwork.','あなたがクリーチャー呪文を唱えるたび、あなたは(１)を支払ってもよい。そうした場合、カードを１枚引き、その後あなたはカードを１枚捨てる。','Whenever you cast a creature spell, you may pay {1}. If you do, draw a card, then discard a card.','','','71',0,false,0,'2018-07-03 03:46:41+09','2025-07-31 21:21:55+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:33016:	 (14427,10576,1,2,82,76,1,NULL,'「この血の染みから、我々を苦しめるものの指紋を見つけようぞ。」――― 遺跡の賢者、アノワン.','In these bloodstains I will find the fingerprints of our oppressors.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:34886:(Ｔ)：その追放されたカードと共通する好きな色のマナ１点を加える。','Imprint — When Chrome Mox enters the battlefield, you may exile a nonartifact, nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:34921:このクリーチャーによって追放されているカードがクリーチャー・カードであるかぎり、このクリーチャーは、これによって最後に追放されたクリーチャー・カードのパワーとタフネスとクリーチャー・タイプを持つ。これは多相の戦士でもある。','Imprint — When this creature enters, you may exile target nontoken creature.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:34931:その追放されているカードと同じ名前の土地がマナを引き出す目的でタップされるたび、それのコントローラーは、その土地が生み出したいずれかのタイプのマナ１点を加える。','Imprint — When Extraplanar Lens enters the battlefield, you may exile target land you control.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:34999:鏡のゴーレムは、その追放されたカードの各カード・タイプに対するプロテクションを持つ。（アーティファクト、クリーチャー、エンチャント、インスタント、土地、プレインズウォーカー、ソーサリー、部族がカード・タイプである。）','Imprint — When Mirror Golem enters the battlefield, you may exile target card from a graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:35002:(２),(Ｔ)：このターン、その追放されたカードと同じ色を共有する、あなたが選んだ発生源１つによって与えられるすべてのダメージを軽減する。','Imprint — When Mourner''s Shield enters the battlefield, you may exile target card from a graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:35044:{X}, {Tap}：その追放されたカードのコピーであるトークンを１つ生成する。Ｘはそのカードの点数で見たマナ・コストに等しい。','Imprint — When Soul Foundry enters the battlefield, you may exile a creature card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:35084:プレイヤー１人がカードを唱えるたび、それがその追放されたソーサリー・カードの一方と同じ名前を持つ場合、あなたは他の一方をコピーしてもよい。そうした場合、あなたはそのコピーを、そのマナ・コストを支払うことなく唱えてもよい。','Imprint — When Spellweaver Helix enters the battlefield, you may exile two target sorcery cards from a single graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:35125:プレイヤー１人がその追放されているカードと共通の色または点数で見たマナ・コストを持つ呪文を唱えるたび、思考の牢獄はそのプレイヤーに２点のダメージを与える。','Imprint — When Thought Prison enters the battlefield, you may have target player reveal their hand. If you do, choose a nonland card from it and exile that card.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:35163:	 (15270,2007,1,1,50,375,1,NULL,'詩人は他の世界の物語の一節を夢見る。工匠は他の次元のアーティファクトの青写真を夢見る。','Poets dream the verses of otherworldly stories. Artificers dream the blueprints of otherplanar artifacts.','警戒','Vigilance','1','4','277',0,false,0,'2018-07-05 04:09:08+09','2025-07-31 20:37:48+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:35312:	 (15339,11270,1,2,19,413,1,NULL,'ジンの足跡のようにとらえどころがない。――― スークアタの言い回し.','As elusive as the footprint of a djinn
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:37646:	 (16502,4942,1,2,25,290,1,NULL,'ウルザは肉体の守りは固めたが、魂は無防備だった。','Tawnos''s blueprints were critical to the creation of my armor. As he once sealed himself in steel, I sealed myself in a walking crypt.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:37942:プレイヤー１人が自分の手札から呪文を１つ唱えるたび、そのプレイヤーはそれを追放する。そうした場合、そのプレイヤーは知識槽により追放された他の土地でないカードを１枚、そのカードのマナ・コストを支払うことなく唱えてもよい。','Imprint — When Knowledge Pool enters the battlefield, each player exiles the top three cards of their library.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:37959:マイアの溶接工は、それにより追放されたすべてのカードの起動型能力を持つ。','Imprint — {Tap}: Exile target artifact card from a graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:38361:	 (16831,12442,1,3,27,200,1,NULL,'着想から下絵へ、そして実際のものへ。','From concept to paper to reality.','','','','','137',0,false,0,'2018-07-06 03:12:15+09','2025-07-31 21:27:04+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:38595:Footprints of the beasts of Keld.','土地１つを対象とする。それと、それと同じ名前を持つ他のすべての土地を破壊する。','Destroy target land and all other lands with the same name as that land.','','','99',0,false,0,'2018-07-07 00:51:24+09','2025-07-31 21:27:16+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:40174:プレイヤーはその追放されているカードと同じ名前を持つ呪文を唱えられない。','Imprint — When Exclusion Ritual enters the battlefield, exile target nonland permanent.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:40283:ファイレクシアの摂取者は＋Ｘ/＋Ｙの修整を受ける。Ｘはその追放されたクリーチャー・カードのパワーに等しく、Ｙはその追放されたクリーチャー・カードのタフネスに等しい。','Imprint — When Phyrexian Ingester enters the battlefield, you may exile target nontoken creature.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:40405:その追放されたカードと同じ名前を持つ土地が１つ対戦相手１人のコントロール下で戦場に出るたび、侵略の寄生虫はそのプレイヤーに２点のダメージを与える。','Imprint — When Invader Parasite enters the battlefield, exile target land.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:40576:	 (18076,4937,1,1,97,23,1,NULL,'遥か昔の侵略兵器であるぎらつく油は、数え切れない程の残虐行為の設計図を内に抱えている。','An invasion weapon of ages past, the glistening oil contained the blueprints of countless atrocities.','','','5','4','150',0,false,0,'2018-07-10 00:02:09+09','2025-07-31 21:03:55+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:40831:	 (18194,13235,1,1,42,322,1,NULL,'そいつは霞の中に身を潜めて、落後する者が出るのをじっと待ち受けている。霧が晴れたとき、あとに残っているのは足跡だけだ。','It lurks in the mist, waiting for stragglers to fall behind. When the fog clears, nothing remains but footprints.','幻影の仔が攻撃かブロックしたとき、戦闘終了時に幻影の仔をオーナーの手札に戻す。（それが戦場にある場合にのみ戻す。）','When Phantom Whelp attacks or blocks, return it to its owner''s hand at end of combat. (Return it only if it''s on the battlefield.)','2','2','93',0,false,0,'2018-07-10 02:31:12+09','2025-07-31 21:29:42+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:44320:	 (20490,3337,1,2,18,606,1,NULL,'彼女は沼で死んだ。お前もそうなる。','It moved through the troops leaving no footprints, save on their souls.','沼渡り（このクリーチャーは、防御プレイヤーが沼(Swamp)をコントロールしているかぎりブロックされない。）','Swampwalk (This creature can''t be blocked as long as defending player controls a Swamp.)','3','3','83',0,false,0,'2018-07-12 06:20:00+09','2025-07-31 20:45:20+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:45236:	 (20994,15461,1,3,181,48,1,NULL,'','"This imprint was the familiar of a friend."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:47564:	 (23390,17416,1,3,58,264,1,NULL,'霊気は系図を設計図とする。','Æther can turn a footprint into a blueprint.','エンチャント（クリーチャー）
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:49215:	 (24425,18346,1,2,56,245,1,NULL,'動きは猿のようだがその千倍もすばやく、あらゆる隅を覗き込んでは、灰の手形を残す。','They moved like apes, but a thousand times swifter, prying into every corner, leaving pawprints of ash.','速攻を持つ赤の3/1のエレメンタル(Elemental)・クリーチャー・トークンを３体生成する。次の終了ステップの開始時に、それらを追放する。','Create three 3/1 red Elemental creature tokens with haste. Exile them at the beginning of the next end step.','','','97',0,false,0,'2018-07-18 23:10:47+09','2025-07-31 21:39:20+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:50713:クローンの殻が死亡したとき、その追放されたカードを表向きにする。それがクリーチャー・カードである場合、それをあなたのコントロール下で戦場に出す。','Imprint — When Clone Shell enters the battlefield, look at the top four cards of your library, exile one face down, then put the rest on the bottom of your library in any order.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:50795:{3}, {Tap}：ミミックの大桶によって追放されているカード１枚のコピーであるトークン１つを生成する。それは速攻を得る。次の終了ステップの開始時に、それを追放する。','Imprint — Whenever a nontoken creature dies, you may exile that card. If you do, return each other card exiled with Mimic Vat to its owner''s graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:50845:(Ｘ),(Ｔ)：その追放されたカードのコピーであるトークンを１つ生成する。Ｘはそのカードの点数で見たマナ・コストである。','Imprint — When Prototype Portal enters the battlefield, you may exile an artifact card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:50858:あなたが唱える、その追放されているカードと共通のカード・タイプを持つ呪文は、それを唱えるためのコストが(２)少なくなる。','Imprint — When Semblance Anvil enters the battlefield, you may exile a nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:50874:装備(３)','Imprint — When Strata Scythe enters the battlefield, search your library for a land card, exile it, then shuffle.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:51415:	 (26355,12415,1,2,40,254,1,NULL,'地面が揺れるのを感じたんだ。それでテントに逃げ込んで、地震がおさまるのを待った。地震はすぐおさまったが、それが足跡を残していったんだ。――― フェメレフの探検者.','I felt the ground shake, so I hid in my tent until the earthquake passed. It passed all right, and it left hoofprints.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:51575:	 (26460,18811,1,2,55,256,1,NULL,'目をつけ、紙折らば、霊は去り、魂は封じられん。','Crease the folds, bend the paper, turn the spirits, shield the soul.','廃院の神主は、あなたがコントロールするパーマネントの色に対するプロテクションを持つ。','Empty-Shrine Kannushi has protection from the colors of permanents you control.','1','1','2',0,false,0,'2018-07-20 03:42:04+09','2025-07-31 21:41:01+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:51609:	 (26469,18820,1,1,55,240,1,NULL,'それは灯籠の灯りが自らの紙の翼に落とす影を覚えていた。その影は時として再びその形を結び、物言わぬ悲劇を演じるのだ。','It remembered all the shadows lantern-cast upon its paper wings, and sometimes those silhouettes played across its shape again, acting out silent tragedies.','あなたがスピリット(Spirit)か秘儀(Arcane)呪文を唱えるたび、破れ障子の神はターン終了時まで飛行を得る。','Whenever you cast a Spirit or Arcane spell, Kami of Tattered Shoji gains flying until end of turn.','2','5','11',0,false,0,'2018-07-20 03:42:04+09','2025-07-31 21:41:03+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:54430:	 (27751,19304,1,3,74,522,1,NULL,'グリクシスで何かに署名するには、まず契約に目を通すこと。','Before signing anything on Grixis, always read the fine print.','対戦相手１人を対象とする。あなたのライブラリーのカードを上から３枚公開する。そのプレイヤーは、それらのカードをあなたの手札に加えることを選んでもよい。そうしない場合、それらのカードをあなたの墓地に置き、カードを５枚引く。','Reveal the top three cards of your library. Target opponent may choose to put those cards into your hand. If they don''t, put those cards into your graveyard and draw five cards.','','','38',0,false,0,'2018-07-25 01:04:20+09','2025-07-31 21:42:21+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:55615:	 (28192,19698,1,2,63,413,1,NULL,'ベナリアの岩塩、ラノワールの苔、ハールーンの埃、そしてアーボーグの灰すらもが荒々しい群れの足跡に削られた。','Ground into the footprints of the ravaging herd were clumps of salt from Benalia, moss from Llanowar, dust from Hurloon, and ash from as far as Urborg.','版図 ― ターン終了時まで、あなたがコントロールするクリーチャーはトランプルを得るとともに、あなたがコントロールする土地の中の基本土地タイプ１つにつき+1/+1の修整を受ける。','Domain — Until end of turn, creatures you control gain trample and get +1/+1 for each basic land type among lands you control.','','','230',0,false,0,'2018-07-25 04:23:34+09','2025-07-31 21:43:52+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:56215:	 (28451,3337,1,2,31,194,1,NULL,'彼女は沼で死んだ。お前もそうなる。','It moved through the troops leaving no footprints, save on their souls.','沼渡り（このクリーチャーは、防御プレイヤーが沼(Swamp)をコントロールしているかぎりブロックされない。）','Swampwalk (This creature can''t be blocked as long as defending player controls a Swamp.)','3','3','67',0,false,0,'2018-07-25 21:25:09+09','2025-07-31 20:45:20+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:58136:	 (29332,10576,1,2,121,76,1,NULL,'「この血の染みから、我々を苦しめるものの指紋を見つけようぞ。」――― 遺跡の賢者、アノワン.','In these bloodstains I will find the fingerprints of our oppressors.—Anowon, the Ruin Sage','(３),クリーチャーを１体生け贄に捧げる：カードを１枚引く。','{3}, Sacrifice a creature: Draw a card.','','','238',0,false,0,'2018-07-26 03:08:16+09','2025-07-31 21:22:54+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:58809:ファイレクシアの摂取者は＋Ｘ/＋Ｙの修整を受ける。Ｘはその追放されたクリーチャー・カードのパワーに等しく、Ｙはその追放されたクリーチャー・カードのタフネスに等しい。','Imprint — When Phyrexian Ingester enters the battlefield, you may exile target nontoken creature.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:59164:装備(３)','Imprint — When Strata Scythe enters the battlefield, search your library for a land card, exile it, then shuffle.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:60411:{2}{White}, 雄鹿の蹄の跡の上から蹄跡カウンター４個を取り除く：飛行を持つ白の４/４のエレメンタル・クリーチャー・トークン１体を生成する。あなたのターンにしか起動できない。','Whenever you draw a card, you may put a hoofprint counter on Hoofprints of the Stag.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:60412:{2}{White}, Remove four hoofprint counters from Hoofprints of the Stag: Create a 4/4 white Elemental creature token with flying. Activate only during your turn.','','','67',0,false,0,'2018-07-27 21:57:01+09','2025-07-31 21:16:00+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:62333:	 (30881,19304,1,3,157,522,1,NULL,'グリクシスで何かに署名するには、まず契約に目を通すこと。','Before signing anything on Grixis, always read the fine print.','対戦相手１人を対象とする。あなたのライブラリーのカードを上から３枚公開する。そのプレイヤーは、それらのカードをあなたの手札に加えることを選んでもよい。そうしない場合、それらのカードをあなたの墓地に置き、カードを５枚引く。','Reveal the top three cards of your library. Target opponent may choose to put those cards into your hand. If they don''t, put those cards into your graveyard and draw five cards.','','','105',0,false,0,'2018-07-30 23:40:14+09','2025-07-31 21:42:22+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:62351:	 (30887,17416,1,3,157,264,1,NULL,'霊気は系図を設計図とする。','Æther can turn a footprint into a blueprint.','エンチャント（クリーチャー）
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:62635:	 (31028,9403,1,1,166,23,1,NULL,'「愚かな。お宝を紙の箱に入れて紐で結わいておくのと変わらないじゃないか。」','Pathetic. You might as well have protected your treasures with a paper box and some string.','エンチャント（クリーチャー） エンチャントされているクリーチャーは+2/+0の修整を受けるとともにブロックされない。','Enchant creature Enchanted creature gets +2/+0 and can''t be blocked.','0','0','14',0,false,0,'2018-08-02 02:59:14+09','2025-07-31 21:18:50+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:63819:このクリーチャーによって追放されているカードがクリーチャー・カードであるかぎり、このクリーチャーは、これによって最後に追放されたクリーチャー・カードのパワーとタフネスとクリーチャー・タイプを持つ。これは多相の戦士でもある。','Imprint — When this creature enters, you may exile target nontoken creature.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:63894:	 (31891,2007,1,1,180,375,1,NULL,'詩人は他の世界の物語の一節を夢見る。工匠は他の次元のアーティファクトの青写真を夢見る。','Poets dream the verses of otherworldly stories. Artificers dream the blueprints of other planar artifacts.','警戒','Vigilance','1','4','249',0,false,0,'2018-08-08 21:58:08+09','2025-07-31 20:37:48+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:65554:このクリーチャーによって追放されているカードがクリーチャー・カードであるかぎり、このクリーチャーは、これによって最後に追放されたクリーチャー・カードのパワーとタフネスとクリーチャー・タイプを持つ。これは多相の戦士でもある。','Imprint — When this creature enters, you may exile target nontoken creature.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:65565:{3}, {Tap}：ミミックの大桶によって追放されているカード１枚のコピーであるトークン１つを生成する。それは速攻を得る。次の終了ステップの開始時に、それを追放する。','Imprint — Whenever a nontoken creature dies, you may exile that card. If you do, return each other card exiled with Mimic Vat to its owner''s graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:65582:(Ｘ),(Ｔ)：その追放されたカードのコピーであるトークンを１つ生成する。Ｘはそのカードの点数で見たマナ・コストである。','Imprint — When Prototype Portal enters the battlefield, you may exile an artifact card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:66409:	 (32652,11270,1,2,37,413,1,NULL,'ジンの足跡のようにとらえどころがない。――― スークアタの言い回し.','As elusive as the footprint of a djinn
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:67451:このクリーチャーによって追放されているカードがクリーチャー・カードであるかぎり、このクリーチャーは、これによって最後に追放されたクリーチャー・カードのパワーとタフネスとクリーチャー・タイプを持つ。これは多相の戦士でもある。','Imprint — When this creature enters, you may exile target nontoken creature.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:68152:{1}{White}, Sacrifice an artifact: Choose any kind of counter a printed card refers to, then put one of that counter on target permanent.','','','4',0,false,0,'2018-08-24 23:50:57+09','2025-07-31 21:46:49+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:68377:	 (34222,21406,1,3,177,127,1,NULL,'','','','Whenever an opponent casts a spell, you have five seconds to choose a keyword you haven''t chosen for a card named Modular Monstrosity today that''s been printed on a creature card. If you do, Modular Monstrosity gains that ability. Otherwise, Modular Monstrosity loses all keyword abilities.','3','3','155',0,false,0,'2018-08-25 00:09:30+09','2025-07-31 21:47:04+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:68895:	 (35288,22458,1,2,24,209,1,NULL,'','The number printed on the card is no longer in service. For help, go to wizards.custhelp.com or find us on Twitter @Wizards_Help.','','The Ultimate Nightmare of Wizards of the Coast® Customer Service deals X damage to each of Y target creatures and Z target players or planeswalkers.','','','53',0,false,0,'2018-09-10 23:23:14+09','2025-07-31 21:47:22+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:73517:"a giant''s footprint"','クリーチャー１体を対象とする。あなたがコントロールする巨人(Giant)クリーチャーを１体選ぶ。その巨人はそのクリーチャーに、自身のパワーに等しい点数のダメージを与える。','Choose a Giant creature you control. It deals damage equal to its power to target creature.','','','109',0,false,0,'2018-11-02 00:42:22+09','2025-07-31 21:16:24+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:73698:	 (37485,19698,1,2,116,413,1,NULL,'','Ground into the footprints of the ravaging herd were clumps of salt from Benalia, moss from Llanowar, dust from Hurloon, and ash from as far as Urborg.','版図 ― ターン終了時まで、あなたがコントロールするクリーチャーはトランプルを得るとともに、あなたがコントロールする土地の中の基本土地タイプ１つにつき+1/+1の修整を受ける。','Domain — Until end of turn, creatures you control gain trample and get +1/+1 for each basic land type among lands you control.','','','171',0,false,0,'2018-11-02 00:42:25+09','2025-07-31 21:43:52+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:74044:ファイレクシアの摂取者は＋Ｘ/＋Ｙの修整を受ける。Ｘはその追放されたクリーチャー・カードのパワーに等しく、Ｙはその追放されたクリーチャー・カードのタフネスに等しい。','Imprint — When Phyrexian Ingester enters the battlefield, you may exile target nontoken creature.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:74468:(Ｔ)：その追放されたカードと共通する好きな色のマナ１点を加える。','Imprint — When Chrome Mox enters the battlefield, you may exile a nonartifact, nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:74471:このクリーチャーによって追放されているカードがクリーチャー・カードであるかぎり、このクリーチャーは、これによって最後に追放されたクリーチャー・カードのパワーとタフネスとクリーチャー・タイプを持つ。これは多相の戦士でもある。','Imprint — When this creature enters, you may exile target nontoken creature.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:76501:(Ｔ)：その追放されたカードと共通する好きな色のマナ１点を加える。','Imprint — When Chrome Mox enters the battlefield, you may exile a nonartifact, nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:76565:このクリーチャーによって追放されているカードがクリーチャー・カードであるかぎり、このクリーチャーは、これによって最後に追放されたクリーチャー・カードのパワーとタフネスとクリーチャー・タイプを持つ。これは多相の戦士でもある。','Imprint — When this creature enters, you may exile target nontoken creature.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:76573:その追放されているカードと同じ名前の土地がマナを引き出す目的でタップされるたび、それのコントローラーは、その土地が生み出したいずれかのタイプのマナ１点を加える。','Imprint — When Extraplanar Lens enters the battlefield, you may exile target land you control.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:79423:	 (39958,23278,1,1,188,139,1,NULL,'','Hold it! I need to see your papers.','(１)(青),(Ｔ)：クリーチャー１体を対象とし、それをタップする。','{1}{Blue}, {Tap}: Tap target creature.','0','3','266',0,false,0,'2019-01-19 00:05:12+09','2025-07-31 21:49:09+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:80899:	 (40707,23278,1,1,188,139,1,NULL,'','Hold it! I need to see your papers.','(１)(青),(Ｔ)：クリーチャー１体を対象とし、それをタップする。','{1}{Blue}, {Tap}: Tap target creature.','0','3','266',1,false,0,'2019-01-25 22:48:57+09','2025-07-31 21:49:09+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:83448:	 (41850,15461,1,3,181,48,1,NULL,'','"This imprint was the familiar of a friend."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:84642:	 (42344,2007,1,1,180,375,1,NULL,'詩人は他の世界の物語の一節を夢見る。工匠は他の次元のアーティファクトの青写真を夢見る。','Poets dream the verses of otherworldly stories. Artificers dream the blueprints of other planar artifacts.','警戒','Vigilance','1','4','249',1,false,0,'2019-03-12 02:32:28+09','2025-07-31 20:37:48+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:86418:Storm Fleet Sprinter can''t be blocked.','2','2','172',1,false,0,'2019-03-12 02:46:23+09','2025-07-31 20:32:01+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:86642:{1}{White}, Sacrifice an artifact: Choose any kind of counter a printed card refers to, then put one of that counter on target permanent.','','','4',1,false,0,'2019-03-12 02:54:38+09','2025-07-31 21:46:49+09'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassMatrixType.php:46:                'choice_label' => fn (ClassName $className) => sprintf('%s (%s)', $className->getName(), $className->getBackendName()),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassMatrixType.php:56:                'choice_label' => fn (ClassName $className) => sprintf('%s (%s)', $className->getName(), $className->getBackendName()),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockBulkApprovalItemType.php:30: * 在庫一括承認：在庫1行分の入力（在庫変動理由・在庫増減数・仕入単価のみ）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckCardRepository.php:171:                sprintf('%s %s', $record['count'], $name) :
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckCardRepository.php:172:                sprintf('%s %s (%s) %s', $record['count'], $name, $record['code'], $match[0]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckCardRepository.php:175:        $deck = empty($decklist[MtbBoard::BOARD_ID_COMMAND]) ? '' : sprintf("%s\n%s\n\n", self::LIST_TITLES[$lang]['commander'], $decklist[MtbBoard::BOARD_ID_COMMAND][0]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckCardRepository.php:206:        $redisKey = sprintf('deck_adoption_ranking:%d:%d:%d', $formatId, $baseInfoId, $limit);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchProductType.php:389:            // モーダル検索等で利用する一括キーワード（商品一覧では未表示）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:739:                $key = sprintf('keyword%s', $index);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:741:                    ->andWhere(sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1063:        // id キーワード（従来・商品ID・名称・規格コード・カード名への一括 OR）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1259:                $qb->andWhere(sprintf('pc.order_quantity_%02d >= :order_quantity_from', $searchData['order_date']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1264:                $qb->andWhere(sprintf('pc.order_quantity_%02d <= :order_quantity_to', $searchData['order_date']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2187:     * 商品ID一覧からカードIDを一括取得する（カード商品のみ）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:829:     * 高額商品は同じカード状態でも値段が異なるため、一括更新してはマズい。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:1000:        return sprintf('%06d', $smaregiProductCode);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbWeeklyStockHistoryTempRepository.php:53:            $alias = sprintf('stock_%02d', $i);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbWeeklyStockHistoryTempRepository.php:121:            $columns[] = sprintf('stock_%02d', $i);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:81:     * @param string|int ...$args メッセージに埋め込む値（sprintf で処理する）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:96:     * @param string|int ...$args メッセージに埋め込む値（sprintf で処理する）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:522:     * @param string|int ...$args メッセージに埋め込む値（sprintf で処理する）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/MessageStore.php:528:        return sprintf($this->translator->trans($key), ...$args);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPlayerRepository.php:146:    //     $latestPointContactNumber = $qb->getSingleScalarResult() ?? sprintf("%0{$pointContactNumberLength}d", 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPlayerRepository.php:149:    //     $nextSerialNumber = sprintf('%0' . strval($pointContactNumberLength - 1) . 'd', $nextNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventEntryRepository.php:356:     * 複数 EventDetail 単位 の 有効申込数 を 一括取得 (= N+1 回避用)。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventEntryRepository.php:387:     * 複数 EventDetail 単位 で Customer が 既に 有効申込 を 持つか を 一括判定 (= N+1 回避用)。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:119:            $messageStore->addRawMessage(sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:134:            $messageStore->addRawMessage(sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:147:            $messageStore->addRawMessage(sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:160:            $messageStore->addRawMessage(sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:172:            $messageStore->addRawMessage(sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:183:            $messageStore->addRawMessage(sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:196:                $messageStore->addRawMessage(sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:206:                $messageStore->addRawMessage(sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:222:                $messageStore->addRawMessage(sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:232:                $messageStore->addRawMessage(sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/DeckUpdateImportHandler.php:479:                $messageStore->addRawMessage(sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:228:     * 納品書に記載する情報を取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSynchronisationUpdateRepository.php:49:     * 指定されたデータタイプとIDを一括でテーブルに追加
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitListCsvImportHandler.php:345:            $errors[] = sprintf('分割元商品コード「%s」が同一店舗・在庫区分で見つかりません。', $srcCode);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitListCsvImportHandler.php:360:                $errors[] = sprintf('分割先商品コード「%s」が同一店舗・在庫区分で見つかりません。', $destCode);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitListCsvImportHandler.php:365:                $errors[] = sprintf('分割元と分割先が同一在庫です（%s）。', $srcCode);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitListCsvImportHandler.php:378:            $errors[] = sprintf('分割元 %s: 分割先が空です。', $srcCode);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitListCsvImportHandler.php:394:            $errors[] = sprintf('分割元 %s: %s', $srcCode, trans($e->getMessage()));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitListCsvImportHandler.php:400:            $errors[] = sprintf('分割元 %s: %s', $srcCode, trans((string) $regResult['errorMessage']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitListCsvImportHandler.php:407:            $errors[] = sprintf('分割元 %s: 登録に失敗しました。', $srcCode);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitListCsvImportHandler.php:421:            $errors[] = sprintf('分割元 %s（承認申請）: %s', $srcCode, trans((string) $applyResult['errorMessage']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/PriceConsistencyRowValidator.php:80:        throw new \InvalidArgumentException(sprintf('%s には int, float または CsvColumnInterface を指定してください。', $argumentName));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/PriceConsistencyRowValidator.php:99:            throw new \LogicException(sprintf('%s から数値を取得できません。数値を返却する列を指定してください。', $price->getLabel()));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/OrderCsv.php:115:                throw new \RuntimeException(sprintf($this->translator->trans('admin.csv.error.data.not_registered'), '注文番号', $row['注文番号'], $rowIndex));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveInstructionCsvImportHandler.php:33: * 在庫移動実績CSV（送り状No.一括登録）をインポートするもの。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:1660:	 (639,13,'風雲艦隊の疾走者','Storm Fleet Sprinter','速攻
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:1662:Storm Fleet Sprinter can''t be blocked.','(1)(U)(R)',3.0,'2','2','','RIX000172JN','RIX000172EN','','',false,'2018-06-07 04:24:57+09','2025-07-31 20:32:01+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:4920:	 (1959,90,'Golgothian Sylex','Golgothian Sylex','(１),(Ｔ)：Antiquitiesエキスパンションにて印刷された名前を持つトークンでない各パーマネントは、それのコントローラーによって生け贄に捧げられる。','{1}, {Tap}: Each nontoken permanent with a name originally printed in the Antiquities expansion is sacrificed by its controller.','-4',4.0,'','','','ATQ000016EN','ATQ000016EN','','',false,'2018-06-07 05:07:35+09','2025-07-31 20:37:36+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:5377:プレイヤーは、Arabian Nightsエキスパンションにて印刷された名前を持つ呪文を唱えたり土地をプレイしたりできない。','Whenever another nontoken permanent with a name originally printed in the Arabian Nights expansion is on the battlefield, its controller sacrifices it.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:5378:Players can''t cast spells or play lands with a name originally printed in the Arabian Nights expansion.','-2',2.0,'','','','ARN000005EN','ARN000005EN','','',false,'2018-06-07 05:07:58+09','2025-07-31 20:38:15+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:9744:死面の映し身人形に追放されたカードが飛行を持っているかぎり、死面の映し身人形は飛行を持つ。畏怖、先制攻撃、二段攻撃、速攻、土地渡り、プロテクション、トランプルについても同様である。','Imprint — {1}: Exile target creature card from your graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:9788:あなたのアップキープの開始時に、あなたは一望の鏡に追放されているそのインスタント・カードかソーサリー・カードの１枚をコピーしてもよい。そうした場合、あなたはそのコピーを、そのマナ・コストを支払うことなく唱えてもよい。','Imprint — {X}, {Tap}: You may exile an instant or sorcery card with mana value X from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:9812:装備(４)','Imprint — When Spellbinder enters the battlefield, you may exile an instant card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:11181:	 (4633,5,'疾走する戦暴者','Sprinting Warbrute','各戦闘で、疾走する戦暴者は可能なら攻撃する。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:11182:疾駆(３)(赤)（あなたはこの呪文を、これの疾駆コストで唱えてもよい。そうしたなら、これは速攻を得るとともに、次の終了ステップの開始時にこれを戦場からオーナーの手札に戻す。）','Sprinting Warbrute attacks each combat if able.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:14142:召喚者の卵が死亡したとき、その追放されている裏向きのカードを表向きにする。それがクリーチャー・カードである場合、それをあなたのコントロール下で戦場に出す。','Imprint — When Summoner''s Egg enters the battlefield, you may exile a card from your hand face down.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:16226:	 (6770,90,'Apocalypse Chime','Apocalypse Chime','(２),(Ｔ),Apocalypse Chimeを生け贄に捧げる：すべてのHomelandsエキスパンションにて印刷された名前を持つトークンでないパーマネントを破壊する。それらは再生できない。','{2}, {Tap}, Sacrifice Apocalypse Chime: Destroy all nontoken permanents with a name originally printed in the Homelands expansion. They can''t be regenerated.','-2',2.0,'','','','HML000001EN','HML000001EN','','',false,'2018-06-08 02:35:26+09','2025-07-31 21:11:09+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:20387:	 (8744,2,'雄鹿の蹄の跡','Hoofprints of the Stag','あなたがカード１枚を引くたび、雄鹿の蹄の跡の上に蹄跡カウンター１個を置いてもよい。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:20388:{2}{White}, 雄鹿の蹄の跡の上から蹄跡カウンター４個を取り除く：飛行を持つ白の４/４のエレメンタル・クリーチャー・トークン１体を生成する。あなたのターンにしか起動できない。','Whenever you draw a card, you may put a hoofprint counter on Hoofprints of the Stag.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:20389:{2}{White}, Remove four hoofprint counters from Hoofprints of the Stag: Create a 4/4 white Elemental creature token with flying. Activate only during your turn.','(1)(W)',2.0,'','','','C16000010EN','C16000010EN','','',false,'2018-06-20 05:00:10+09','2025-07-31 21:16:00+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:25709:(Ｔ)：その追放されたカードと共通する好きな色のマナ１点を加える。','Imprint — When Chrome Mox enters the battlefield, you may exile a nonartifact, nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:25744:このクリーチャーによって追放されているカードがクリーチャー・カードであるかぎり、このクリーチャーは、これによって最後に追放されたクリーチャー・カードのパワーとタフネスとクリーチャー・タイプを持つ。これは多相の戦士でもある。','Imprint — When this creature enters, you may exile target nontoken creature.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:25754:その追放されているカードと同じ名前の土地がマナを引き出す目的でタップされるたび、それのコントローラーは、その土地が生み出したいずれかのタイプのマナ１点を加える。','Imprint — When Extraplanar Lens enters the battlefield, you may exile target land you control.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:25831:鏡のゴーレムは、その追放されたカードの各カード・タイプに対するプロテクションを持つ。（アーティファクト、クリーチャー、エンチャント、インスタント、土地、プレインズウォーカー、ソーサリー、部族がカード・タイプである。）','Imprint — When Mirror Golem enters the battlefield, you may exile target card from a graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:25834:(２),(Ｔ)：このターン、その追放されたカードと同じ色を共有する、あなたが選んだ発生源１つによって与えられるすべてのダメージを軽減する。','Imprint — When Mourner''s Shield enters the battlefield, you may exile target card from a graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:25901:{X}, {Tap}：その追放されたカードのコピーであるトークンを１つ生成する。Ｘはそのカードの点数で見たマナ・コストに等しい。','Imprint — When Soul Foundry enters the battlefield, you may exile a creature card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:25904:プレイヤー１人がカードを唱えるたび、それがその追放されたソーサリー・カードの一方と同じ名前を持つ場合、あなたは他の一方をコピーしてもよい。そうした場合、あなたはそのコピーを、そのマナ・コストを支払うことなく唱えてもよい。','Imprint — When Spellweaver Helix enters the battlefield, you may exile two target sorcery cards from a single graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:25942:プレイヤー１人がその追放されているカードと共通の色または点数で見たマナ・コストを持つ呪文を唱えるたび、思考の牢獄はそのプレイヤーに２点のダメージを与える。','Imprint — When Thought Prison enters the battlefield, you may have target player reveal their hand. If you do, choose a nonland card from it and exile that card.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:27897:プレイヤー１人が自分の手札から呪文を１つ唱えるたび、そのプレイヤーはそれを追放する。そうした場合、そのプレイヤーは知識槽により追放された他の土地でないカードを１枚、そのカードのマナ・コストを支払うことなく唱えてもよい。','Imprint — When Knowledge Pool enters the battlefield, each player exiles the top three cards of their library.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:27911:マイアの溶接工は、それにより追放されたすべてのカードの起動型能力を持つ。','Imprint — {Tap}: Exile target artifact card from a graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:28237:	 (12442,90,'ウルザの青写真','Urza''s Blueprints','','','-6',6.0,'','','','ULG000115JN','ULG000115EN','','',false,'2018-07-06 03:12:15+09','2025-07-31 21:27:04+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:29227:プレイヤーはその追放されているカードと同じ名前を持つ呪文を唱えられない。','Imprint — When Exclusion Ritual enters the battlefield, exile target nonland permanent.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:29327:ファイレクシアの摂取者は＋Ｘ/＋Ｙの修整を受ける。Ｘはその追放されたクリーチャー・カードのパワーに等しく、Ｙはその追放されたクリーチャー・カードのタフネスに等しい。','Imprint — When Phyrexian Ingester enters the battlefield, you may exile target nontoken creature.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:29433:その追放されたカードと同じ名前を持つ土地が１つ対戦相手１人のコントロール下で戦場に出るたび、侵略の寄生虫はそのプレイヤーに２点のダメージを与える。','Imprint — When Invader Parasite enters the battlefield, exile target land.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:37234:クローンの殻が死亡したとき、その追放されたカードを表向きにする。それがクリーチャー・カードである場合、それをあなたのコントロール下で戦場に出す。','Imprint — When Clone Shell enters the battlefield, look at the top four cards of your library, exile one face down, then put the rest on the bottom of your library in any order.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:37315:{3}, {Tap}：ミミックの大桶によって追放されているカード１枚のコピーであるトークン１つを生成する。それは速攻を得る。次の終了ステップの開始時に、それを追放する。','Imprint — Whenever a nontoken creature dies, you may exile that card. If you do, return each other card exiled with Mimic Vat to its owner''s graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:37363:(Ｘ),(Ｔ)：その追放されたカードのコピーであるトークンを１つ生成する。Ｘはそのカードの点数で見たマナ・コストである。','Imprint — When Prototype Portal enters the battlefield, you may exile an artifact card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:37372:あなたが唱える、その追放されているカードと共通のカード・タイプを持つ呪文は、それを唱えるためのコストが(２)少なくなる。','Imprint — When Semblance Anvil enters the battlefield, you may exile a nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:37381:装備(３)','Imprint — When Strata Scythe enters the battlefield, search your library for a land card, exile it, then shuffle.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:42124:{1}{White}, Sacrifice an artifact: Choose any kind of counter a printed card refers to, then put one of that counter on target permanent.','(2)(W)',3.0,'','','','UST000004EN','UST000004EN','','',false,'2018-08-24 23:50:57+09','2025-07-31 21:46:49+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:42324:	 (21406,90,'Modular Monstrosity','Modular Monstrosity','','Whenever an opponent casts a spell, you have five seconds to choose a keyword you haven''t chosen for a card named Modular Monstrosity today that''s been printed on a creature card. If you do, Modular Monstrosity gains that ability. Otherwise, Modular Monstrosity loses all keyword abilities.','-7',7.0,'3','3','','UST000155EN','UST000155EN','','',false,'2018-08-25 00:09:30+09','2025-07-31 21:47:04+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:44371:	 (23444,5,'サムトの疾走','Samut''s Sprint','クリーチャー１体を対象とする。ターン終了時まで、それは＋２/＋１の修整を受け速攻を得る。占術１を行う。','Target creature gets +2/+1 and gains haste until end of turn. Scry 1.','(R)',1.0,'0','0','',NULL,NULL,'','',false,'2019-04-19 03:35:04+09','2025-07-31 21:49:35+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:45148:	 (24435,5,'ヴィーアシーノの砂駆け','Viashino Sandsprinter','トランプル、速攻
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:45151:At the beginning of the end step, return Viashino Sandsprinter to its owner''s hand. (Return it only if it''s on the battlefield.)
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:47713:	 (26060,2,'Stack of Paperwork(Play Test Card)','Stack of Paperwork(Play Test Card)',NULL,'When CARDNAME enters the battlefield, draw a card.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:47867:	 (26142,16,'Louvaq, the Aberrant(Play Test Card)','Louvaq, the Aberrant(Play Test Card)','','Protection from modified creatures. (Modified creatures have a power, toughness, or ability different than their printed version.)
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:55150:あなたがコントロールしていてアンタップ状態のクリーチャー２体をタップする：ターン終了時まで、毛皮運送は、それの他のタイプに加えて機体・アーティファクトであることを除きその追放されたカードのコピーになる。','Imprint — As Dermotaxi enters the battlefield, exile a creature card from a graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:65236:	 (33675,2,'Surprise Party','Surprise Party','When Surprise Party enters the battlefield, yell "Surprise" and put onto the battlefield any number of printed Clown Robot tokens that aren''t touching each other, that you hid on the battlefield before you cast Surprise Party, and that weren''t spotted by an opponent before you cast Surprise Party.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:65237:Robots you control get +1/+0 and have vigilance.','When Surprise Party enters the battlefield, yell "Surprise" and put onto the battlefield any number of printed Clown Robot tokens that aren''t touching each other, that you hid on the battlefield before you cast Surprise Party, and that weren''t spotted by an opponent before you cast Surprise Party.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:65809:	 (33874,90,'Squirrel Stack','Squirrel Stack','Visit — You have five seconds to stack dice on top of one another. If you stack at least five dice, claim the prize
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:65810:Prize — Create a 1/1 green Squirrel creature token for each die you stacked above the fourth, then sacrifice Squirrel Stack and open an Attraction.','Visit — You have five seconds to stack dice on top of one another. If you stack at least five dice, claim the prize
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:65811:Prize — Create a 1/1 green Squirrel creature token for each die you stacked above the fourth, then sacrifice Squirrel Stack and open an Attraction.','0',0.0,'','','',NULL,NULL,'','',false,'2022-10-01 03:11:08+09','2025-07-31 22:19:45+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:68431:(Ｔ)：その追放されたカードと共通する好きな色のマナ１点を加える。','Imprint — When Chrome Mox enters the battlefield, you may exile a nonartifact, nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:68578:	 (35298,90,'【金枠】Apocalypse Chime','【Gold Frame】Apocalypse Chime','(２),(Ｔ),Apocalypse Chimeを生け贄に捧げる：すべてのHomelandsエキスパンションにて印刷された名前を持つトークンでないパーマネントを破壊する。それらは再生できない。','{2}, {Tap}, Sacrifice Apocalypse Chime: Destroy all nontoken permanents with a name originally printed in the Homelands expansion. They can''t be regenerated.','-2',2.0,'','','',NULL,NULL,'','',false,'2022-12-29 23:58:46+09','2025-05-07 22:57:16+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:69131:	 (35485,5,'マグマの疾走者','Magmatic Sprinter','速攻
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:69134:When Magmatic Sprinter enters the battlefield, put two oil counters on target artifact or creature you control.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:69135:At the beginning of your end step, return Magmatic Sprinter to its owner''s hand unless you remove two oil counters from it.','(2)(R)',3.0,'3','2','',NULL,NULL,'','',false,'2023-01-28 02:29:56+09','2025-07-31 22:21:40+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:69758:	 (35734,91,'【テストプリント】地底の大河','【Test print】Underground River','','','',0.0,'','','',NULL,NULL,'','',false,'2023-03-03 00:41:11+09','2023-05-21 00:57:40+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:69759:	 (35735,6,'【テストプリント】リスの巣','【Test print】Squirrel Nest','','','',0.0,'','','',NULL,NULL,'','',false,'2023-03-03 00:41:11+09','2024-10-17 20:33:06+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:69760:	 (35736,3,'【テストプリント】マハモティ・ジン','【Test print】Mahamoti Djinn','','','',0.0,'','','',NULL,NULL,'','',false,'2023-03-03 00:41:12+09','2023-05-21 00:57:40+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:69761:	 (35737,4,'【テストプリント】もぎとり','【Test print】Mutilate','','','',0.0,'','','',NULL,NULL,'','',false,'2023-03-03 00:41:12+09','2025-03-12 23:08:19+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:69762:	 (35738,5,'【テストプリント】ショック','【Test print】Shock','','','',0.0,'','','',NULL,NULL,'','',false,'2023-03-03 00:41:12+09','2025-03-12 23:08:19+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:69763:	 (35739,6,'【テストプリント】起源','【Test print】Genesis','','','',0.0,'','','',NULL,NULL,'','',false,'2023-03-03 00:41:12+09','2025-03-12 23:08:19+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:69764:	 (35740,6,'【テストプリント】獣群の呼び声','【Test print】Call of the Herd','','','',0.0,'','','',NULL,NULL,'','',false,'2023-03-03 00:41:12+09','2025-03-12 23:08:19+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:69765:	 (35741,5,'【テストプリント】火山の鎚','【Test print】Volcanic Hammer','','','',0.0,'','','',NULL,NULL,'','',false,'2023-03-03 00:41:12+09','2024-10-17 20:33:05+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:69766:	 (35742,6,'【テストプリント】呪文散らしのケンタウルス','【Test print】Spellbane Centaur','','','',0.0,'','','',NULL,NULL,'','',false,'2023-03-03 00:41:12+09','2024-10-17 20:33:05+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:69767:	 (35743,6,'【テストプリント】幻影のケンタウロス','【Test print】Phantom Centaur','','','',0.0,'','','',NULL,NULL,'','',false,'2023-03-03 00:41:12+09','2024-10-17 20:33:06+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:69768:	 (35744,3,'【テストプリント】洞察のひらめき','【Test print】Flash of Insight','','','',0.0,'','','',NULL,NULL,'','',false,'2023-03-03 00:41:12+09','2024-10-17 20:33:06+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:69769:	 (35745,6,'【テストプリント】象の導き','【Test print】Elephant Guide','','','',0.0,'','','',NULL,NULL,'','',false,'2023-03-03 00:41:12+09','2024-10-17 20:33:06+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:69770:	 (35746,3,'【テストプリント】強制','【Test print】Compulsion','','','',0.0,'','','',NULL,NULL,'','',false,'2023-03-03 00:41:12+09','2024-10-17 20:33:06+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:69771:	 (35747,6,'【テストプリント】獣の襲撃','【Test print】Beast Attack','','','',0.0,'','','',NULL,NULL,'','',false,'2023-03-03 00:41:12+09','2024-10-17 20:33:06+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:71483:	 (36367,NULL,'【テストプリント】アダーカー荒原','【Test print】Adarkar Wastes','{Tap}：{Colorless}を加える。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:71643:	 (36419,91,'【テストプリント】カープルーザンの森','【Test print】Karplusan Forest','','','',0.0,'','','',NULL,NULL,'','',false,'2023-05-21 01:26:44+09','2024-10-17 20:33:06+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:71644:	 (36420,6,'【テストプリント】野生の雑種犬','【Test print】Wild Mongrel','','','',0.0,'','','',NULL,NULL,'','',false,'2023-05-21 01:26:44+09','2024-10-17 20:33:06+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:71645:	 (36421,91,'【テストプリント】蛮族のリング','【Test print】Barbarian Ring','','','',0.0,'','','',NULL,NULL,'','',false,'2023-05-21 01:26:44+09','2024-10-17 20:33:06+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:71646:	 (36422,94,'【テストプリント】沼','【Test print】Swamp','','','',0.0,'','','',NULL,NULL,'','',false,'2023-05-21 01:26:45+09','2024-10-17 20:33:06+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:71647:	 (36423,4,'【テストプリント】ナントゥーコの影','【Test print】Nantuko Shade','','','',0.0,'','','',NULL,NULL,'','',false,'2023-05-21 01:26:45+09','2024-10-17 20:33:06+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:74984:	 (37950,NULL,'対抗呪文(ミスプリント)','Counterspell(Miss print)',NULL,NULL,NULL,0.0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,false,'2023-10-17 22:41:16+09','2023-10-17 22:42:17+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:76290:{6}：恐竜の遺伝子によって追放されているクリーチャー・カード１枚を対象とする。トランプルを持つ緑の６/６の恐竜・クリーチャーであることを除き、それのコピーであるトークン１つを生成する。起動はソーサリーとしてのみ行う。','Imprint — {1}, {Tap}: Exile target creature card from a graveyard. Activate only as a sorcery.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:76368:	 (39077,6,'【テストプリント】木っ端みじん','【Test print】Splinter','','','',4.0,'','','',NULL,NULL,'','',false,'2023-11-16 03:38:16+09','2024-10-17 20:33:05+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:76369:	 (39078,3,'【テストプリント】手練','【Test print】Sleight of Hand','','','',1.0,'','','',NULL,NULL,'','',false,'2023-11-16 03:38:16+09','2024-10-17 20:33:05+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:76370:	 (39079,3,'【テストプリント】古術師','【Test print】Archaeomancer','','','',4.0,'1','2','',NULL,NULL,'','',false,'2023-11-16 03:38:16+09','2024-10-17 20:33:05+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:76371:	 (39080,6,'【テストプリント】ガラクの群れ率い','【Test print】Garruk''s Packleader','','','',5.0,'4','4','',NULL,NULL,'','',false,'2023-11-16 03:38:16+09','2024-10-17 20:33:05+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:76372:	 (39081,5,'【テストプリント】灰の盲信者','【Test print】Ash Zealot','','','',2.0,'2','2','',NULL,NULL,'','',false,'2023-11-16 03:38:16+09','2024-10-17 20:33:05+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:76374:	 (39083,91,'【テストプリント】硫黄泉','【Test print】Sulfurous Springs','','','',0.0,'','','',NULL,NULL,'','',false,'2023-11-16 03:38:16+09','2024-10-17 20:33:05+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:76375:	 (39084,5,'【テストプリント】激発','【Test print】Violent Eruption','','','',4.0,'','','',NULL,NULL,'','',false,'2023-11-16 03:38:16+09','2024-10-17 20:33:05+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:76523:	 (39125,90,'【テストプリント】巡礼者の目','【Test print】Pilgrim''s Eye','','','',3.0,'','','',NULL,NULL,'','',false,'2023-11-25 02:23:17+09','2024-10-17 20:33:04+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:76524:	 (39126,90,'【テストプリント】面晶体の刃','【Test print】Hedron Blade','','','',1.0,'','','',NULL,NULL,'','',false,'2023-11-25 02:23:17+09','2024-10-17 20:33:05+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:76525:	 (39127,90,'【テストプリント】突き抜けの矢','【Test print】Pathway Arrows','','','',1.0,'','','',NULL,NULL,'','',false,'2023-11-25 02:23:17+09','2024-10-17 20:33:05+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:76526:	 (39128,90,'【テストプリント】面晶体の記録庫','【Test print】Hedron Archive','','','',4.0,'','','',NULL,NULL,'','',false,'2023-11-25 02:23:17+09','2024-10-17 20:33:05+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:76527:	 (39129,90,'【テストプリント】板岩の槌','【Test print】Slab Hammer','','','',2.0,'','','',NULL,NULL,'','',false,'2023-11-25 02:23:17+09','2024-10-17 20:33:05+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:76528:	 (39130,NULL,'【テストプリント】平地','【Test print】Plains',NULL,NULL,NULL,0.0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,false,'2023-12-01 01:41:34+09','2023-12-01 01:49:10+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:76529:	 (39131,NULL,'【テストプリント】島','【Test print】Island',NULL,NULL,NULL,0.0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,false,'2023-12-01 01:41:34+09','2023-12-01 01:49:18+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:76571:	 (39162,3,'【テストプリント】マナ侵害','【Test print】Mana Breach','','','',0.0,'','','',NULL,NULL,'','',false,'2023-12-29 03:46:43+09','2024-10-17 20:33:04+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:76572:	 (39163,2,'【テストプリント】しもべの誓い','【Test print】Oath of Lieges','','','',0.0,'','','',NULL,NULL,'','',false,'2023-12-29 03:46:43+09','2024-10-17 20:33:04+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:76573:	 (39164,4,'【テストプリント】疫病媒体','【Test print】Plaguebearer','','','',0.0,'','','',NULL,NULL,'','',false,'2023-12-29 03:46:43+09','2024-10-17 20:33:04+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:76574:	 (39165,90,'【テストプリント】記憶の水晶','【Test print】Memory Crystal','','','',0.0,'','','',NULL,NULL,'','',false,'2023-12-29 03:46:43+09','2024-10-17 20:33:04+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:78025:	 (39808,5,'グリムリーパーズスプリント','Grim Reaper''s Sprint','陰鬱 ― このターンにクリーチャーが死亡していたなら、この呪文を唱えるためのコストは{3}少なくなる。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:78030:When Grim Reaper''s Sprint enters the battlefield, untap each creature you control. If it''s your main phase, there is an additional combat phase after this phase.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:78044:	 (39948,NULL,'森/島(二重印刷)','Forest/Island(Miss print)','','','0',0.0,'','','',NULL,NULL,'','',false,'2024-03-16 20:21:13+09','2024-10-17 20:33:03+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:80037:	 (40620,4,'【テストプリント】強迫','【Test print】Duress','','','',0.0,'','','',NULL,NULL,'','',false,'2024-05-17 20:47:53+09','2025-03-12 23:08:19+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:80038:	 (40621,3,'【テストプリント】風のドレイク','【Test print】Wind Drake','','','',0.0,'','','',NULL,NULL,'','',false,'2024-05-17 20:47:53+09','2024-10-17 20:33:03+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:80039:	 (40622,5,'【テストプリント】 	巣立つドラゴン','【Test print】Fledgling Dragon','','','',0.0,'','','',NULL,NULL,'','',false,'2024-05-17 20:47:53+09','2024-10-17 20:33:03+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:80040:	 (40623,3,'【テストプリント】 	困惑の石','【Test print】Cumber Stone','','','',0.0,'','','',NULL,NULL,'','',false,'2024-05-17 20:47:53+09','2024-10-17 20:33:03+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:81040:{Tap}：その追放されているカードをオーナーの手札に戻す。','Imprint — When Ugin''s Labyrinth enters the battlefield, you may exile a colorless card with mana value 7 or greater from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:84419:	 (42496,9,'不死の疾走者','Undead Sprinter','トランプル、速攻
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:84421:You may cast Undead Sprinter from your graveyard if a non-Zombie creature died this turn. If you do, Undead Sprinter enters with a +1/+1 counter on it.','(B)(R)',2.0,'2','2','',NULL,NULL,'','',false,'2024-09-15 03:54:13+09','2025-07-31 22:35:27+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:86778:	 (43442,6,'【テストプリント】ラノワールのエルフ','【Test print】Llanowar Elves','','','',0.0,'','','',NULL,NULL,'','',false,'2025-03-12 23:08:19+09','2025-03-12 23:08:19+09'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderProductListCsvExportService.php:92:        $prefix .= sprintf('%07d', min($buyOrderIds)).'_';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:311:        $sessionKey = sprintf('stock_split_edit_destinations_%d', $this->stockSplitJoin->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockApprovalListCsvExportService.php:142:            // 編集・一括編集・変更CSVのみ、合計在庫増減数・合計総原価増減数・在庫変動区分を表示
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinListCsvImportHandler.php:356:            $errors[] = sprintf('結合先商品コード「%s」が同一店舗・在庫区分で見つかりません。', $destCode);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinListCsvImportHandler.php:368:                $errors[] = sprintf('結合先 %s 結合元 %s: 在庫区分が不正です（%s）。', $destCode, $srcCode, $cat);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinListCsvImportHandler.php:378:                $errors[] = sprintf('結合元商品コード「%s」（在庫区分 %s）が見つかりません。', $srcCode, $cat);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinListCsvImportHandler.php:383:                $errors[] = sprintf('結合先と結合元が同一在庫です（%s）。', $destCode);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinListCsvImportHandler.php:396:            $errors[] = sprintf('結合先 %s: 結合元が空です。', $destCode);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinListCsvImportHandler.php:410:            $errors[] = sprintf('結合先 %s: %s', $destCode, trans($e->getMessage()));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinListCsvImportHandler.php:417:            $errors[] = sprintf('結合先 %s: 登録に失敗しました。', $destCode);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinListCsvImportHandler.php:432:            $errors[] = sprintf('結合先 %s（欠品入力へ）: %s', $destCode, trans($e->getMessage()));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockRecommendCsvExportService.php:375:            $col = sprintf('pc.order_quantity_%02d', $input->orderDate);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/SummaryCsvExporterService.php:128:        $filename = sprintf('summary_%s_%s.csv', $summaryType, (new \DateTime())->format('YmdHis'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderCsvExportService.php:101:        $prefix = 'purchase_'.sprintf('%07d', min($buyOrderIds)).'_';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderDepositCsvExportService.php:88:        $prefix = 'purchase_bank_deposit_'.sprintf('%07d', min($buyOrderIds)).'_';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityProxyService.php:117:            $originalPath = sprintf('%s/src/Eccube/Entity/%s.php', $projectDir, $pathToEntity);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityProxyService.php:120:            $originalPath = sprintf('%s/app/Customize/Entity/%s.php', $projectDir, $pathToEntity);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityProxyService.php:123:            $originalPath = sprintf('%s/app/Plugin/%s/Entity/%s.php', $projectDir, $matches[1], $pathToEntity);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveOutboundApprovalRequestCsvExportService.php:68:        $filename = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:194:                sprintf('%d行目: 変更元拠点（ID: %d）が見つかりません', $row->getRowNumber(), $this->input->changeBaseInfoId)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:203:                sprintf('%d行目: 商品コード「%s」が見つかりません', $row->getRowNumber(), $productCode)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Deck/DeckBulkCartBuilder.php:70:     * MO 形式デッキリスト + フィルタから cart_list (= 一括カート投入用配列) を構築する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetConsentConfirmAction.php:57:                // まとめて買取に個別表示する価格未満の場合は一括フラグで売却を判断
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetConsentConfirmAction.php:79:                // まとめて買取に個別表示する価格未満の場合は一括フラグで売却を判断
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryNetDetailAction.php:68:            purchaseNo: sprintf('%07d', $buyOrder->getId()),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/ProductDetailedSearchModalBlockPayloadBuilder.php:22:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/ProductDetailedSearchModalBlockPayloadBuilder.php:30:        private readonly RequestStack $requestStack,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/ProductDetailedSearchModalBlockPayloadBuilder.php:40:        $mainRequest = $this->requestStack->getMainRequest() ?? $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/RestockedBlockPayloadBuilder.php:20:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/RestockedBlockPayloadBuilder.php:31:        private readonly RequestStack $requestStack,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/RestockedBlockPayloadBuilder.php:43:        $mainRequest = $this->requestStack->getMainRequest() ?? $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/CategoryListBlockPayloadBuilder.php:23:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/CategoryListBlockPayloadBuilder.php:33:        private readonly RequestStack $requestStack,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/CategoryListBlockPayloadBuilder.php:51:        $mainRequest = $this->requestStack->getMainRequest() ?? $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/CategoryListBlockPayloadBuilder.php:67:        $cacheKey = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/SearchProductBlockPayloadBuilder.php:24:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/SearchProductBlockPayloadBuilder.php:32:        private readonly RequestStack $requestStack,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/SearchProductBlockPayloadBuilder.php:47:        $mainRequest = $this->requestStack->getMainRequest() ?? $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryRowBuilder.php:101:            purchaseNo: sprintf('%07d', $buyOrder->getId()),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/CartBlockPayloadBuilder.php:26:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/CartBlockPayloadBuilder.php:40:        private readonly RequestStack $requestStack,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/CartBlockPayloadBuilder.php:61:        $request = $this->requestStack->getMainRequest() ?? $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/BottomNavBlockPayloadBuilder.php:27:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/BottomNavBlockPayloadBuilder.php:35:        private readonly RequestStack $requestStack,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/BottomNavBlockPayloadBuilder.php:57:        $mainRequest = $this->requestStack->getMainRequest() ?? $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/MvCarouselBlockPayloadBuilder.php:21:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/MvCarouselBlockPayloadBuilder.php:32:        private readonly RequestStack $requestStack,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/MvCarouselBlockPayloadBuilder.php:42:        $mainRequest = $this->requestStack->getMainRequest() ?? $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbWeeklyStockHistoryRepository.php:39:            $insertParams[] = sprintf('stock_%02d', $i);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbWeeklyStockHistoryRepository.php:40:            $selectParams[] = sprintf('wsht.stock_%02d', $i);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/PurchaseDetailedSearchModalBlockPayloadBuilder.php:21:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/PurchaseDetailedSearchModalBlockPayloadBuilder.php:29:        private readonly RequestStack $requestStack,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/PurchaseDetailedSearchModalBlockPayloadBuilder.php:39:        $mainRequest = $this->requestStack->getMainRequest() ?? $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/PriceDownBlockPayloadBuilder.php:20:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/PriceDownBlockPayloadBuilder.php:31:        private readonly RequestStack $requestStack,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/PriceDownBlockPayloadBuilder.php:43:        $mainRequest = $this->requestStack->getMainRequest() ?? $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:345:        $redisKey = sprintf('redis_deck_top_usage_%d_%d_%d', $formatId, $metaRange, $limit);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDeckRepository.php:408:        $redisKey = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/FavoritesBlockPayloadBuilder.php:22:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/FavoritesBlockPayloadBuilder.php:35:        private readonly RequestStack $requestStack,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/FavoritesBlockPayloadBuilder.php:56:        $mainRequest = $this->requestStack->getMainRequest() ?? $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/RecentlyViewedBlockPayloadBuilder.php:20:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/RecentlyViewedBlockPayloadBuilder.php:32:        private readonly RequestStack $requestStack,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/RecentlyViewedBlockPayloadBuilder.php:44:        $mainRequest = $this->requestStack->getMainRequest() ?? $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/NewItemsBlockPayloadBuilder.php:24:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/NewItemsBlockPayloadBuilder.php:37:        private readonly RequestStack $requestStack,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/NewItemsBlockPayloadBuilder.php:50:        $mainRequest = $this->requestStack->getMainRequest() ?? $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/SaleBlockPayloadBuilder.php:20:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/SaleBlockPayloadBuilder.php:31:        private readonly RequestStack $requestStack,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/SaleBlockPayloadBuilder.php:40:        $mainRequest = $this->requestStack->getMainRequest() ?? $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MemberRepository.php:50:            throw new \Exception(sprintf('%s より上位の管理ユーザが存在しません.', $Member->getId()));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MemberRepository.php:73:            throw new \Exception(sprintf('%s より下位の管理ユーザが存在しません.', $Member->getId()));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MemberRepository.php:217:     * 承認・却下の実行権限を一括判定する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderRepository.php:723:     * ネット買取IDに紐づく買取商品の売却フラグを一括でtrueにする
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockJoinEditReplaceSourcesImportHandler.php:265:        $sessionKey = sprintf('stock_join_edit_sources_%d', $this->stockSplitJoin->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/MemberBaseInfoRepository.php:33:     * MemberBaseInfo を一括挿入する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderSummaryRepository.php:96:     * 店頭買取集計の一括登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbBuyOrderStockHistoryRepository.php:126:            return sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/BaseInfoRepository.php:28:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/BaseInfoRepository.php:44:        private readonly RequestStack $request,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/BaseInfoRepository.php:113:            throw new \RuntimeException(sprintf('Multiple BaseInfo found for smaregi_shop_id=%d; store resolution must be unique.', $smaregiShopId), 0, $e);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/BaseInfoService.php:21:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/BaseInfoService.php:27:        private readonly RequestStack $requestStack,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/BaseInfoService.php:41:        $request = $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/BaseInfoService.php:81:        $request = $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/TwoFactorAuthService.php:21:use Symfony\Component\HttpFoundation\RequestStack;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/TwoFactorAuthService.php:50:        protected RequestStack $requestStack,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/TwoFactorAuthService.php:52:        $this->request = $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductStockRepository.php:266:            $col = sprintf('pc.order_quantity_%02d', $input->orderDate);
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:32:	 (87118,27142,1,3,242,142,1,NULL,'その足が踏んだ跡は、不毛の塵が肥沃な土地になる。','In its hoofprints, barren dust becomes fertile ground.','鎮まらぬ大地、ヤシャーンが戦場に出たとき、あなたのライブラリーから基本森・カード１枚と基本平地・カード１枚を探し、公開し、あなたの手札に加える。その後、あなたのライブラリーを切り直す。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:513:	 (87228,27142,1,3,242,142,2,NULL,'その足が踏んだ跡は、不毛の塵が肥沃な土地になる。','In its hoofprints, barren dust becomes fertile ground.','鎮まらぬ大地、ヤシャーンが戦場に出たとき、あなたのライブラリーから基本森・カード１枚と基本平地・カード１枚を探し、公開し、あなたの手札に加える。その後、あなたのライブラリーを切り直す。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:1126:	 (87393,27142,1,3,243,142,1,NULL,'その足が踏んだ跡は、不毛の塵が肥沃な土地になる。','In its hoofprints, barren dust becomes fertile ground.','鎮まらぬ大地、ヤシャーンが戦場に出たとき、あなたのライブラリーから基本森・カード１枚と基本平地・カード１枚を探し、公開し、あなたの手札に加える。その後、あなたのライブラリーを切り直す。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:1617:	 (87504,27142,1,3,243,NULL,1,NULL,'その足が踏んだ跡は、不毛の塵が肥沃な土地になる。','In its hoofprints, barren dust becomes fertile ground.','鎮まらぬ大地、ヤシャーンが戦場に出たとき、あなたのライブラリーから基本森・カード１枚と基本平地・カード１枚を探し、公開し、あなたの手札に加える。その後、あなたのライブラリーを切り直す。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:17751:このクリーチャーによって追放されているカードがクリーチャー・カードであるかぎり、このクリーチャーは、これによって最後に追放されたクリーチャー・カードのパワーとタフネスとクリーチャー・タイプを持つ。これは多相の戦士でもある。','Imprint — When this creature enters, you may exile target nontoken creature.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:19746:プレイヤー１人が自分の手札から呪文を１つ唱えるたび、そのプレイヤーはそれを追放する。そうした場合、そのプレイヤーは知識槽により追放された他の土地でないカードを１枚、そのカードのマナ・コストを支払うことなく唱えてもよい。','Imprint — When Knowledge Pool enters the battlefield, each player exiles the top three cards of their library.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:21022:あなたがコントロールしていてアンタップ状態のクリーチャー２体をタップする：ターン終了時まで、毛皮運送は、それの他のタイプに加えて機体・アーティファクトであることを除きその追放されたカードのコピーになる。','Imprint — As Dermotaxi enters the battlefield, exile a creature card from a graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:22103:あなたがコントロールしていてアンタップ状態のクリーチャー２体をタップする：ターン終了時まで、毛皮運送は、それの他のタイプに加えて機体・アーティファクトであることを除きその追放されたカードのコピーになる。','Imprint — As Dermotaxi enters the battlefield, exile a creature card from a graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:23186:あなたがコントロールしていてアンタップ状態のクリーチャー２体をタップする：ターン終了時まで、毛皮運送は、それの他のタイプに加えて機体・アーティファクトであることを除きその追放されたカードのコピーになる。','Imprint — As Dermotaxi enters the battlefield, exile a creature card from a graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:23749:あなたがコントロールしていてアンタップ状態のクリーチャー２体をタップする：ターン終了時まで、毛皮運送は、それの他のタイプに加えて機体・アーティファクトであることを除きその追放されたカードのコピーになる。','Imprint — As Dermotaxi enters the battlefield, exile a creature card from a graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:24129:あなたがコントロールしていてアンタップ状態のクリーチャー２体をタップする：ターン終了時まで、毛皮運送は、それの他のタイプに加えて機体・アーティファクトであることを除きその追放されたカードのコピーになる。','Imprint — As Dermotaxi enters the battlefield, exile a creature card from a graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:24805:あなたがコントロールしていてアンタップ状態のクリーチャー２体をタップする：ターン終了時まで、毛皮運送は、それの他のタイプに加えて機体・アーティファクトであることを除きその追放されたカードのコピーになる。','Imprint — As Dermotaxi enters the battlefield, exile a creature card from a graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:26090:(Ｔ)：その追放されたカードと共通する好きな色のマナ１点を加える。','Imprint — When Chrome Mox enters the battlefield, you may exile a nonartifact, nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:26151:このクリーチャーによって追放されているカードがクリーチャー・カードであるかぎり、このクリーチャーは、これによって最後に追放されたクリーチャー・カードのパワーとタフネスとクリーチャー・タイプを持つ。これは多相の戦士でもある。','Imprint — When this creature enters, you may exile target nontoken creature.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:26158:その追放されているカードと同じ名前の土地がマナを引き出す目的でタップされるたび、それのコントローラーは、その土地が生み出したいずれかのタイプのマナ１点を加える。','Imprint — When Extraplanar Lens enters the battlefield, you may exile target land you control.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:31728:	 (100296,26142,1,3,226,226,1,NULL,'','','Protection from modified creatures. (Modified creatures have a power, toughness, or ability different than their printed version.)
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:31729:At the beginning of each player''s end step, you may put a +1/+1 counter on target creature that player controls.','Protection from modified creatures. (Modified creatures have a power, toughness, or ability different than their printed version.)
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:31886:	 (100417,26142,1,3,226,226,1,NULL,'','','','Protection from modified creatures. (Modified creatures have a power, toughness, or ability different than their printed version.)
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:44710:――命を与える者、カツマサ','"I folded a model in paper first to test the relative tensile strength of the plates."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:44888:	 (105369,31365,1,1,281,1133,1,NULL,'「地面に触れなければ、足跡を追跡される心配はないわ。」','"They can''t follow your footprints if you never touch the ground."','飛行
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:45252:	 (105474,31468,1,1,281,1334,1,NULL,'長きに渡り都市の下で眠り続けていた古の神が目覚めると、舗装された道路が紙のように破けた。','Pavement ripped like paper as the ancient kami awoke from her long slumber beneath the city.','以下から１つまたは両方を選ぶ。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:45599:――命を与える者、カツマサ','"I folded a model in paper first to test the relative tensile strength of the plates."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:45961:	 (105671,31365,1,1,281,1133,1,NULL,'「地面に触れなければ、足跡を追跡される心配はないわ。」','"They can''t follow your footprints if you never touch the ground."','飛行
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:46328:	 (105776,31468,1,1,281,1334,1,NULL,'長きに渡り都市の下で眠り続けていた古の神が目覚めると、舗装された道路が紙のように破けた。','Pavement ripped like paper as the ancient kami awoke from her long slumber beneath the city.','以下から１つまたは両方を選ぶ。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:46819:	 (105912,31365,1,1,292,2520,1,NULL,'「地面に触れなければ、足跡を追跡される心配はないわ。」','"They can''t follow your footprints if you never touch the ground."','飛行
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:47715:	 (106122,31365,1,1,292,2520,1,NULL,'「地面に触れなければ、足跡を追跡される心配はないわ。」','"They can''t follow your footprints if you never touch the ground."','飛行
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:54175:{2}{White}, 雄鹿の蹄の跡の上から蹄跡カウンター４個を取り除く：飛行を持つ白の４/４のエレメンタル・クリーチャー・トークン１体を生成する。あなたのターンにしか起動できない。','Whenever you draw a card, you may put a hoofprint counter on Hoofprints of the Stag.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:54176:{2}{White}, Remove four hoofprint counters from Hoofprints of the Stag: Create a 4/4 white Elemental creature token with flying. Activate only during your turn.','','','203',0,false,0,'2022-04-23 00:47:00+09','2025-07-31 21:16:00+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:54639:{3}, {Tap}：ミミックの大桶によって追放されているカード１枚のコピーであるトークン１つを生成する。それは速攻を得る。次の終了ステップの開始時に、それを追放する。','Imprint — Whenever a nontoken creature dies, you may exile that card. If you do, return each other card exiled with Mimic Vat to its owner''s graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:74143:Footprints of the beasts of Keld.','土地１つを対象とする。それと、それと同じ名前を持つ他のすべての土地を破壊する。','Destroy target land and all other lands with the same name as that land.','','','863a',0,false,0,'2022-09-01 20:51:08+09','2025-07-31 21:27:16+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:76621:	 (116325,33675,1,3,306,177,1,NULL,'','','When Surprise Party enters the battlefield, yell "Surprise" and put onto the battlefield any number of printed Clown Robot tokens that aren''t touching each other, that you hid on the battlefield before you cast Surprise Party, and that weren''t spotted by an opponent before you cast Surprise Party.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:76622:Robots you control get +1/+0 and have vigilance.','When Surprise Party enters the battlefield, yell "Surprise" and put onto the battlefield any number of printed Clown Robot tokens that aren''t touching each other, that you hid on the battlefield before you cast Surprise Party, and that weren''t spotted by an opponent before you cast Surprise Party.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:77395:Prize — Create a 1/1 green Squirrel creature token for each die you stacked above the fourth, then sacrifice Squirrel Stack and open an Attraction.','Visit — You have five seconds to stack dice on top of one another. If you stack at least five dice, claim the prize
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:77396:Prize — Create a 1/1 green Squirrel creature token for each die you stacked above the fourth, then sacrifice Squirrel Stack and open an Attraction.','','','228a',0,false,0,'2022-10-01 03:11:08+09','2025-07-31 22:19:45+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:77398:Prize — Create a 1/1 green Squirrel creature token for each die you stacked above the fourth, then sacrifice Squirrel Stack and open an Attraction.','Visit — You have five seconds to stack dice on top of one another. If you stack at least five dice, claim the prize
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:77399:Prize — Create a 1/1 green Squirrel creature token for each die you stacked above the fourth, then sacrifice Squirrel Stack and open an Attraction.','','','228b',0,false,0,'2022-10-01 03:11:08+09','2025-07-31 22:19:45+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:77401:Prize — Create a 1/1 green Squirrel creature token for each die you stacked above the fourth, then sacrifice Squirrel Stack and open an Attraction.','Visit — You have five seconds to stack dice on top of one another. If you stack at least five dice, claim the prize
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:77402:Prize — Create a 1/1 green Squirrel creature token for each die you stacked above the fourth, then sacrifice Squirrel Stack and open an Attraction.','','','228c',0,false,0,'2022-10-01 03:11:08+09','2025-07-31 22:19:45+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:77404:Prize — Create a 1/1 green Squirrel creature token for each die you stacked above the fourth, then sacrifice Squirrel Stack and open an Attraction.','Visit — You have five seconds to stack dice on top of one another. If you stack at least five dice, claim the prize
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:77405:Prize — Create a 1/1 green Squirrel creature token for each die you stacked above the fourth, then sacrifice Squirrel Stack and open an Attraction.','','','228d',0,false,0,'2022-10-01 03:11:08+09','2025-07-31 22:19:45+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:77407:Prize — Create a 1/1 green Squirrel creature token for each die you stacked above the fourth, then sacrifice Squirrel Stack and open an Attraction.','Visit — You have five seconds to stack dice on top of one another. If you stack at least five dice, claim the prize
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:77408:Prize — Create a 1/1 green Squirrel creature token for each die you stacked above the fourth, then sacrifice Squirrel Stack and open an Attraction.','','','228e',0,false,0,'2022-10-01 03:11:08+09','2025-07-31 22:19:45+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:77410:Prize — Create a 1/1 green Squirrel creature token for each die you stacked above the fourth, then sacrifice Squirrel Stack and open an Attraction.','Visit — You have five seconds to stack dice on top of one another. If you stack at least five dice, claim the prize
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:77411:Prize — Create a 1/1 green Squirrel creature token for each die you stacked above the fourth, then sacrifice Squirrel Stack and open an Attraction.','','','228f',0,false,0,'2022-10-01 03:11:08+09','2025-07-31 22:19:45+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:77712:	 (116711,33675,1,3,309,177,1,NULL,'','','When Surprise Party enters the battlefield, yell "Surprise" and put onto the battlefield any number of printed Clown Robot tokens that aren''t touching each other, that you hid on the battlefield before you cast Surprise Party, and that weren''t spotted by an opponent before you cast Surprise Party.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:77713:Robots you control get +1/+0 and have vigilance.','When Surprise Party enters the battlefield, yell "Surprise" and put onto the battlefield any number of printed Clown Robot tokens that aren''t touching each other, that you hid on the battlefield before you cast Surprise Party, and that weren''t spotted by an opponent before you cast Surprise Party.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:78364:{1}{White}, Sacrifice an artifact: Choose any kind of counter a printed card refers to, then put one of that counter on target permanent.','','','UN001',1,false,0,'2022-10-02 01:27:05+09','2025-07-31 21:46:50+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:78533:	 (116963,33675,1,3,306,177,1,NULL,'','','When Surprise Party enters the battlefield, yell "Surprise" and put onto the battlefield any number of printed Clown Robot tokens that aren''t touching each other, that you hid on the battlefield before you cast Surprise Party, and that weren''t spotted by an opponent before you cast Surprise Party.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:78534:Robots you control get +1/+0 and have vigilance.','When Surprise Party enters the battlefield, yell "Surprise" and put onto the battlefield any number of printed Clown Robot tokens that aren''t touching each other, that you hid on the battlefield before you cast Surprise Party, and that weren''t spotted by an opponent before you cast Surprise Party.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:79299:Prize — Create a 1/1 green Squirrel creature token for each die you stacked above the fourth, then sacrifice Squirrel Stack and open an Attraction.','Visit — You have five seconds to stack dice on top of one another. If you stack at least five dice, claim the prize
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:79300:Prize — Create a 1/1 green Squirrel creature token for each die you stacked above the fourth, then sacrifice Squirrel Stack and open an Attraction.','','','228a',1,false,0,'2022-10-01 19:27:48+09','2025-07-31 22:19:45+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:79302:Prize — Create a 1/1 green Squirrel creature token for each die you stacked above the fourth, then sacrifice Squirrel Stack and open an Attraction.','Visit — You have five seconds to stack dice on top of one another. If you stack at least five dice, claim the prize
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:79303:Prize — Create a 1/1 green Squirrel creature token for each die you stacked above the fourth, then sacrifice Squirrel Stack and open an Attraction.','','','228b',1,false,0,'2022-10-01 19:27:48+09','2025-07-31 22:19:45+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:79305:Prize — Create a 1/1 green Squirrel creature token for each die you stacked above the fourth, then sacrifice Squirrel Stack and open an Attraction.','Visit — You have five seconds to stack dice on top of one another. If you stack at least five dice, claim the prize
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:79306:Prize — Create a 1/1 green Squirrel creature token for each die you stacked above the fourth, then sacrifice Squirrel Stack and open an Attraction.','','','228c',1,false,0,'2022-10-01 19:27:48+09','2025-07-31 22:19:45+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:79308:Prize — Create a 1/1 green Squirrel creature token for each die you stacked above the fourth, then sacrifice Squirrel Stack and open an Attraction.','Visit — You have five seconds to stack dice on top of one another. If you stack at least five dice, claim the prize
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:79309:Prize — Create a 1/1 green Squirrel creature token for each die you stacked above the fourth, then sacrifice Squirrel Stack and open an Attraction.','','','228d',1,false,0,'2022-10-01 19:27:48+09','2025-07-31 22:19:45+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:79311:Prize — Create a 1/1 green Squirrel creature token for each die you stacked above the fourth, then sacrifice Squirrel Stack and open an Attraction.','Visit — You have five seconds to stack dice on top of one another. If you stack at least five dice, claim the prize
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:79312:Prize — Create a 1/1 green Squirrel creature token for each die you stacked above the fourth, then sacrifice Squirrel Stack and open an Attraction.','','','228e',1,false,0,'2022-10-01 19:27:48+09','2025-07-31 22:19:45+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:79314:Prize — Create a 1/1 green Squirrel creature token for each die you stacked above the fourth, then sacrifice Squirrel Stack and open an Attraction.','Visit — You have five seconds to stack dice on top of one another. If you stack at least five dice, claim the prize
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:79315:Prize — Create a 1/1 green Squirrel creature token for each die you stacked above the fourth, then sacrifice Squirrel Stack and open an Attraction.','','','228f',1,false,0,'2022-10-01 19:27:48+09','2025-07-31 22:19:45+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:79608:	 (117411,21406,1,3,280,127,1,NULL,'','','','Whenever an opponent casts a spell, you have five seconds to choose a keyword you haven''t chosen for a card named Modular Monstrosity today that''s been printed on a creature card. If you do, Modular Monstrosity gains that ability. Otherwise, Modular Monstrosity loses all keyword abilities.','3','3','UN059',1,false,0,'2022-10-02 01:27:07+09','2025-07-31 21:47:04+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:80255:あなたが唱える、その追放されているカードと共通のカード・タイプを持つ呪文は、それを唱えるためのコストが(２)少なくなる。','Imprint — When Semblance Anvil enters the battlefield, you may exile a nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:80386:あなたが唱える、その追放されているカードと共通のカード・タイプを持つ呪文は、それを唱えるためのコストが(２)少なくなる。','Imprint — When Semblance Anvil enters the battlefield, you may exile a nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:80794:あなたが唱える、その追放されているカードと共通のカード・タイプを持つ呪文は、それを唱えるためのコストが(２)少なくなる。','Imprint — When Semblance Anvil enters the battlefield, you may exile a nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:80928:あなたが唱える、その追放されているカードと共通のカード・タイプを持つ呪文は、それを唱えるためのコストが(２)少なくなる。','Imprint — When Semblance Anvil enters the battlefield, you may exile a nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:81336:あなたが唱える、その追放されているカードと共通のカード・タイプを持つ呪文は、それを唱えるためのコストが(２)少なくなる。','Imprint — When Semblance Anvil enters the battlefield, you may exile a nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:85887:(Ｘ),(Ｔ)：その追放されたカードのコピーであるトークンを１つ生成する。Ｘはそのカードの点数で見たマナ・コストである。','Imprint — When Prototype Portal enters the battlefield, you may exile an artifact card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:89745:(Ｔ)：その追放されたカードと共通する好きな色のマナ１点を加える。','Imprint — When Chrome Mox enters the battlefield, you may exile a nonartifact, nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:89843:(Ｔ)：その追放されたカードと共通する好きな色のマナ１点を加える。','Imprint — When Chrome Mox enters the battlefield, you may exile a nonartifact, nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:93006:(Ｔ)：その追放されたカードと共通する好きな色のマナ１点を加える。','Imprint — When Chrome Mox enters the battlefield, you may exile a nonartifact, nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:93150:(Ｔ)：その追放されたカードと共通する好きな色のマナ１点を加える。','Imprint — When Chrome Mox enters the battlefield, you may exile a nonartifact, nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:93302:—Grandmother Sengir','(２),(Ｔ),Apocalypse Chimeを生け贄に捧げる：すべてのHomelandsエキスパンションにて印刷された名前を持つトークンでないパーマネントを破壊する。それらは再生できない。','{2}, {Tap}, Sacrifice Apocalypse Chime: Destroy all nontoken permanents with a name originally printed in the Homelands expansion. They can''t be regenerated.','','','et0101sb',0,false,0,'2022-12-29 23:58:46+09','2025-05-07 22:57:16+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:93476:—Grandmother Sengir','(２),(Ｔ),Apocalypse Chimeを生け贄に捧げる：すべてのHomelandsエキスパンションにて印刷された名前を持つトークンでないパーマネントを破壊する。それらは再生できない。','{2}, {Tap}, Sacrifice Apocalypse Chime: Destroy all nontoken permanents with a name originally printed in the Homelands expansion. They can''t be regenerated.','','','ll0101sb',0,false,0,'2022-12-29 23:58:48+09','2025-05-07 22:57:16+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:94815:	 (124622,35442,1,3,320,2806,1,NULL,'「誰かが契約の細部を読み忘れたようだな。」','"It seems someone forgot to read the fine print."','あなたがコントロールしていてこれでないすべてのクリーチャーは－１/－１の修整を受ける。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:94969:When Magmatic Sprinter enters the battlefield, put two oil counters on target artifact or creature you control.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:94970:At the beginning of your end step, return Magmatic Sprinter to its owner''s hand unless you remove two oil counters from it.','3','2','140',0,false,0,'2023-01-28 02:29:56+09','2025-07-31 22:21:40+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:95822:	 (124893,35442,1,3,320,2806,1,NULL,'「誰かが契約の細部を読み忘れたようだな。」','"It seems someone forgot to read the fine print."','あなたがコントロールしていてこれでないすべてのクリーチャーは－１/－１の修整を受ける。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:95975:When Magmatic Sprinter enters the battlefield, put two oil counters on target artifact or creature you control.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:95976:At the beginning of your end step, return Magmatic Sprinter to its owner''s hand unless you remove two oil counters from it.','3','2','140',1,false,0,'2023-01-28 02:34:07+09','2025-07-31 22:21:40+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:96585:	 (125091,35442,1,3,320,2806,2,NULL,'「誰かが契約の細部を読み忘れたようだな。」','"It seems someone forgot to read the fine print."','あなたがコントロールしていてこれでないすべてのクリーチャーは－１/－１の修整を受ける。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:96953:	 (125504,35442,1,3,323,2806,1,NULL,'「誰かが契約の細部を読み忘れたようだな。」','"It seems someone forgot to read the fine print."','あなたがコントロールしていてこれでないすべてのクリーチャーは－１/－１の修整を受ける。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:95:        $prefix = 'stock_move_transfer_return_list_'.sprintf('%07d', min($stockMoveTransferIds)).'_';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:143:                $errors[] = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:148:                $errors[] = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:155:                $errors[] = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferReturnListCsvExportService.php:164:                $errors[] = sprintf('ID: %d は存在しません。', $uniqueStockMoveTransferId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveTransferBarcodeCsvExportService.php:67:        $prefix = 'stock_move_transfer_barcode_'.sprintf('%07d', min($stockMoveTransferIds)).'_';
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:377:	 (125636,35442,1,3,323,2806,1,NULL,'「誰かが契約の細部を読み忘れたようだな。」','"It seems someone forgot to read the fine print."','あなたがコントロールしていてこれでないすべてのクリーチャーは－１/－１の修整を受ける。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:714:	 (125709,35442,1,3,323,2806,1,NULL,'「誰かが契約の細部を読み忘れたようだな。」','"It seems someone forgot to read the fine print."','あなたがコントロールしていてこれでないすべてのクリーチャーは－１/－１の修整を受ける。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:9797:このクリーチャーによって追放されているカードがクリーチャー・カードであるかぎり、このクリーチャーは、これによって最後に追放されたクリーチャー・カードのパワーとタフネスとクリーチャー・タイプを持つ。これは多相の戦士でもある。','Imprint — When this creature enters, you may exile target nontoken creature.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:18946:	 (132370,15687,1,4,335,10,1,NULL,'時に最大の敵となるものが書類仕事である。','Because sometimes the greatest enemy is paperwork.','忠臣を生け贄に捧げる：あなたの墓地にある伝説のクリーチャー・カード１枚を対象とする。それを戦場に戻す。あなたのターンの間で、攻撃クリーチャーが指定される前にのみ起動できる。','Sacrifice Loyal Retainers: Return target legendary creature card from your graveyard to the battlefield. Activate only during your turn, before attackers are declared.','1','1','39',0,false,0,'2023-07-23 04:09:18+09','2025-07-31 21:34:41+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:19142:ファイレクシアの摂取者は＋Ｘ/＋Ｙの修整を受ける。Ｘはその追放されたクリーチャー・カードのパワーに等しく、Ｙはその追放されたクリーチャー・カードのタフネスに等しい。','Imprint — When Phyrexian Ingester enters the battlefield, you may exile target nontoken creature.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:20022:その追放されているカードと同じ名前の土地がマナを引き出す目的でタップされるたび、それのコントローラーは、その土地が生み出したいずれかのタイプのマナ１点を加える。','Imprint — When Extraplanar Lens enters the battlefield, you may exile target land you control.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:20368:	 (132838,15687,1,4,335,10,1,NULL,'時に最大の敵となるものが書類仕事である。','Because sometimes the greatest enemy is paperwork.','忠臣を生け贄に捧げる：あなたの墓地にある伝説のクリーチャー・カード１枚を対象とする。それを戦場に戻す。あなたのターンの間で、攻撃クリーチャーが指定される前にのみ起動できる。','Sacrifice Loyal Retainers: Return target legendary creature card from your graveyard to the battlefield. Activate only during your turn, before attackers are declared.','1','1','39',1,false,0,'2023-07-23 04:17:17+09','2025-07-31 21:34:41+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:20560:ファイレクシアの摂取者は＋Ｘ/＋Ｙの修整を受ける。Ｘはその追放されたクリーチャー・カードのパワーに等しく、Ｙはその追放されたクリーチャー・カードのタフネスに等しい。','Imprint — When Phyrexian Ingester enters the battlefield, you may exile target nontoken creature.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:21447:その追放されているカードと同じ名前の土地がマナを引き出す目的でタップされるたび、それのコントローラーは、その土地が生み出したいずれかのタイプのマナ１点を加える。','Imprint — When Extraplanar Lens enters the battlefield, you may exile target land you control.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:22274:このクリーチャーによって追放されているカードがクリーチャー・カードであるかぎり、このクリーチャーは、これによって最後に追放されたクリーチャー・カードのパワーとタフネスとクリーチャー・タイプを持つ。これは多相の戦士でもある。','Imprint — When this creature enters, you may exile target nontoken creature.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:22693:	 (133586,15687,1,4,336,10,1,NULL,'時に最大の敵となるものが書類仕事である。','Because sometimes the greatest enemy is paperwork.','忠臣を生け贄に捧げる：あなたの墓地にある伝説のクリーチャー・カード１枚を対象とする。それを戦場に戻す。あなたのターンの間で、攻撃クリーチャーが指定される前にのみ起動できる。','Sacrifice Loyal Retainers: Return target legendary creature card from your graveyard to the battlefield. Activate only during your turn, before attackers are declared.','1','1','465',1,false,0,'2023-07-23 06:09:00+09','2025-07-31 21:34:41+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:23205:その追放されているカードと同じ名前の土地がマナを引き出す目的でタップされるたび、それのコントローラーは、その土地が生み出したいずれかのタイプのマナ１点を加える。','Imprint — When Extraplanar Lens enters the battlefield, you may exile target land you control.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:23345:その追放されているカードと同じ名前の土地がマナを引き出す目的でタップされるたび、それのコントローラーは、その土地が生み出したいずれかのタイプのマナ１点を加える。','Imprint — When Extraplanar Lens enters the battlefield, you may exile target land you control.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:23877:その追放されているカードと同じ名前の土地がマナを引き出す目的でタップされるたび、それのコントローラーは、その土地が生み出したいずれかのタイプのマナ１点を加える。','Imprint — When Extraplanar Lens enters the battlefield, you may exile target land you control.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:31853:	 (136947,26526,1,3,227,47,103,NULL,'狩人の野営地で見つかったものは、小さな足跡と大量の血だけだった。','All they found in the hunter''s camp were tiny paw prints and a lot of blood.','あなたのターンの戦闘の開始時に、あなたの墓地から赤か白か黒のクリーチャー・カード１枚を対象とし、それを追放する。１/１であることを除きそのカードのコピーであるトークンを１体生成する。あなたの次のターンまで、それは速攻を得る。','At the beginning of combat on your turn, exile target red, white, or black creature card from your graveyard. Create a token that''s a copy of that card, except it''s 1/1. It gains haste until your next turn.','0','0','198',0,true,0,'2023-10-04 20:51:30+09','2025-07-31 21:55:10+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:32472:	 (137105,27142,1,3,242,142,103,NULL,'その足が踏んだ跡は、不毛の塵が肥沃な土地になる。','In its hoofprints, barren dust becomes fertile ground.','鎮まらぬ大地、ヤシャーンが戦場に出たとき、あなたのライブラリーから基本森・カード１枚と基本平地・カード１枚を探し、公開し、あなたの手札に加える。その後、あなたのライブラリーを切り直す。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:35251:	 (137760,35442,1,3,320,2806,103,NULL,'「誰かが契約の細部を読み忘れたようだな。」','"It seems someone forgot to read the fine print."','あなたがコントロールしていてこれでないすべてのクリーチャーは－１/－１の修整を受ける。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:37845:	 (138419,26526,1,3,227,47,103,NULL,'狩人の野営地で見つかったものは、小さな足跡と大量の血だけだった。','All they found in the hunter''s camp were tiny paw prints and a lot of blood.','あなたのターンの戦闘の開始時に、あなたの墓地から赤か白か黒のクリーチャー・カード１枚を対象とし、それを追放する。１/１であることを除きそのカードのコピーであるトークンを１体生成する。あなたの次のターンまで、それは速攻を得る。','At the beginning of combat on your turn, exile target red, white, or black creature card from your graveyard. Create a token that''s a copy of that card, except it''s 1/1. It gains haste until your next turn.','0','0','198',1,true,0,'2023-10-05 23:15:03+09','2025-07-31 21:55:10+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:38468:	 (138577,27142,1,3,242,142,103,NULL,'その足が踏んだ跡は、不毛の塵が肥沃な土地になる。','In its hoofprints, barren dust becomes fertile ground.','鎮まらぬ大地、ヤシャーンが戦場に出たとき、あなたのライブラリーから基本森・カード１枚と基本平地・カード１枚を探し、公開し、あなたの手札に加える。その後、あなたのライブラリーを切り直す。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:41237:	 (139232,35442,1,3,320,2806,103,NULL,'「誰かが契約の細部を読み忘れたようだな。」','"It seems someone forgot to read the fine print."','あなたがコントロールしていてこれでないすべてのクリーチャーは－１/－１の修整を受ける。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:52185:	 (143514,38864,1,2,344,3069,1,NULL,'洞窟に向かう足跡は多数あるが、そこから出てくるのは一つもない。','Many footprints lead into the cave. None lead out.','{Tap}：{Colorless}を加える。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:53605:	 (143929,38864,1,2,344,3069,1,NULL,'洞窟に向かう足跡は多数あるが、そこから出てくるのは一つもない。','Many footprints lead into the cave. None lead out.','{Tap}：{Colorless}を加える。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:54864:――風雲船長ラネリーの注意書き','"Skim all the gold and magic rocks you want, but if I see one greasy fingerprint on my new boots, you''ll be drinking bilgewater for a month."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:54869:{3}, {Tap}：ミミックの大桶によって追放されているカード１枚のコピーであるトークン１つを生成する。それは速攻を得る。次の終了ステップの開始時に、それを追放する。','Imprint — Whenever a nontoken creature dies, you may exile that card. If you do, return each other card exiled with Mimic Vat to its owner''s graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:55921:――風雲船長ラネリーの注意書き','"Skim all the gold and magic rocks you want, but if I see one greasy fingerprint on my new boots, you''ll be drinking bilgewater for a month."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:55926:{3}, {Tap}：ミミックの大桶によって追放されているカード１枚のコピーであるトークン１つを生成する。それは速攻を得る。次の終了ステップの開始時に、それを追放する。','Imprint — Whenever a nontoken creature dies, you may exile that card. If you do, return each other card exiled with Mimic Vat to its owner''s graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:56111:――ミスター・DNA','"Dinosaurs left their blueprints behind for us."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:56113:{6}：恐竜の遺伝子によって追放されているクリーチャー・カード１枚を対象とする。トランプルを持つ緑の６/６の恐竜・クリーチャーであることを除き、それのコピーであるトークン１つを生成する。起動はソーサリーとしてのみ行う。','Imprint — {1}, {Tap}: Exile target creature card from a graveyard. Activate only as a sorcery.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:56177:――ミスター・DNA','"Dinosaurs left their blueprints behind for us."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:56179:{6}：恐竜の遺伝子によって追放されているクリーチャー・カード１枚を対象とする。トランプルを持つ緑の６/６の恐竜・クリーチャーであることを除き、それのコピーであるトークン１つを生成する。起動はソーサリーとしてのみ行う。','Imprint — {1}, {Tap}: Exile target creature card from a graveyard. Activate only as a sorcery.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:56327:――ミスター・DNA','"Dinosaurs left their blueprints behind for us."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:56329:{6}：恐竜の遺伝子によって追放されているクリーチャー・カード１枚を対象とする。トランプルを持つ緑の６/６の恐竜・クリーチャーであることを除き、それのコピーであるトークン１つを生成する。起動はソーサリーとしてのみ行う。','Imprint — {1}, {Tap}: Exile target creature card from a graveyard. Activate only as a sorcery.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:61903:	 (147094,39274,1,1,351,2694,1,NULL,'証拠を「正規ルート」で手に入れようとすると、場合によっては数週間にも及ぶ書類手続きが必要になる。時に正義は待ってくれないものだ。','Obtaining evidence through the "proper" channels can take weeks of paperwork. Sometimes justice just can''t wait.','無節操な探偵社員が戦場に出たとき、対戦相手１人を対象とする。そのプレイヤーは手札にあるカード１枚を追放する。','When Unscrupulous Agent enters the battlefield, target opponent exiles a card from their hand.','1','1','109',0,false,0,'2024-01-28 03:10:34+09','2025-07-31 22:29:08+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:62398:――一件落着の会のドソール','"The Golgari can read the dead like a newspaper."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:62473:――探偵社の新人探偵、アーガイル','"These footprints mean only one thing: the streetcleaner is running late!"
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:63107:――一件落着の会のドソール','"The Golgari can read the dead like a newspaper."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:63593:	 (147534,39274,1,1,351,2694,1,NULL,'証拠を「正規ルート」で手に入れようとすると、場合によっては数週間にも及ぶ書類手続きが必要になる。時に正義は待ってくれないものだ。','Obtaining evidence through the "proper" channels can take weeks of paperwork. Sometimes justice just can''t wait.','無節操な探偵社員が戦場に出たとき、対戦相手１人を対象とする。そのプレイヤーは手札にあるカード１枚を追放する。','When Unscrupulous Agent enters the battlefield, target opponent exiles a card from their hand.','1','1','109',1,false,0,'2024-01-28 03:48:48+09','2025-07-31 22:29:08+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:64080:――一件落着の会のドソール','"The Golgari can read the dead like a newspaper."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:64155:――探偵社の新人探偵、アーガイル','"These footprints mean only one thing: the streetcleaner is running late!"
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:64703:――一件落着の会のドソール','"The Golgari can read the dead like a newspaper."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:65043:――一件落着の会のドソール','"The Golgari can read the dead like a newspaper."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:67797:――一件落着の会のドソール','"The Golgari can read the dead like a newspaper."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:68172:――一件落着の会のドソール','"The Golgari can read the dead like a newspaper."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:69749:When Grim Reaper''s Sprint enters the battlefield, untap each creature you control. If it''s your main phase, there is an additional combat phase after this phase.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:69879:	 (150595,2695,1,3,356,2920,1,NULL,'不運なことに、唯一残ったトイレットペーパーは近場の金庫に保管されていた。','Even worse, the only toilet paper was locked in a nearby safe.','','','','','292',0,false,0,'2024-02-27 04:19:35+09','2025-07-31 20:39:40+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:70851:When Grim Reaper''s Sprint enters the battlefield, untap each creature you control. If it''s your main phase, there is an additional combat phase after this phase.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:71078:	 (150813,2695,1,3,359,2920,1,NULL,'不運なことに、唯一残ったトイレットペーパーは近場の金庫に保管されていた。','Even worse, the only toilet paper was locked in a nearby safe.','','','','','510',0,false,0,'2024-02-27 04:19:41+09','2025-07-31 20:39:40+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:71588:When Grim Reaper''s Sprint enters the battlefield, untap each creature you control. If it''s your main phase, there is an additional combat phase after this phase.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:72133:	 (151123,2695,1,3,356,2920,1,NULL,'不運なことに、唯一残ったトイレットペーパーは近場の金庫に保管されていた。','Even worse, the only toilet paper was locked in a nearby safe.','','','','','820',1,false,0,'2024-02-27 04:19:50+09','2025-07-31 20:39:40+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:72677:When Grim Reaper''s Sprint enters the battlefield, untap each creature you control. If it''s your main phase, there is an additional combat phase after this phase.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:72685:	 (151881,2695,1,3,359,2920,1,NULL,'不運なことに、唯一残ったトイレットペーパーは近場の金庫に保管されていた。','Even worse, the only toilet paper was locked in a nearby safe.','','','','','510',1,false,0,'2024-02-27 05:03:38+09','2025-07-31 20:39:40+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:73098:	 (151341,2695,1,3,359,2920,1,NULL,'不運なことに、唯一残ったトイレットペーパーは近場の金庫に保管されていた。','Even worse, the only toilet paper was locked in a nearby safe.','','','','','1038',1,false,0,'2024-02-27 04:19:56+09','2025-07-31 20:39:40+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:73451:When Grim Reaper''s Sprint enters the battlefield, untap each creature you control. If it''s your main phase, there is an additional combat phase after this phase.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:74217:	 (151663,2695,1,3,356,2920,1,NULL,'不運なことに、唯一残ったトイレットペーパーは近場の金庫に保管されていた。','Even worse, the only toilet paper was locked in a nearby safe.','','','','','292',1,false,0,'2024-02-27 05:03:31+09','2025-07-31 20:39:40+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:74526:When Grim Reaper''s Sprint enters the battlefield, untap each creature you control. If it''s your main phase, there is an additional combat phase after this phase.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:84204:{Tap}：その追放されているカードをオーナーの手札に戻す。','Imprint — When Ugin''s Labyrinth enters the battlefield, you may exile a colorless card with mana value 7 or greater from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:84581:{Tap}：その追放されているカードをオーナーの手札に戻す。','Imprint — When Ugin''s Labyrinth enters the battlefield, you may exile a colorless card with mana value 7 or greater from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:86371:{Tap}：その追放されているカードをオーナーの手札に戻す。','Imprint — When Ugin''s Labyrinth enters the battlefield, you may exile a colorless card with mana value 7 or greater from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:86719:{Tap}：その追放されているカードをオーナーの手札に戻す。','Imprint — When Ugin''s Labyrinth enters the battlefield, you may exile a colorless card with mana value 7 or greater from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:87543:{Tap}：その追放されているカードをオーナーの手札に戻す。','Imprint — When Ugin''s Labyrinth enters the battlefield, you may exile a colorless card with mana value 7 or greater from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:87950:{Tap}：その追放されているカードをオーナーの手札に戻す。','Imprint — When Ugin''s Labyrinth enters the battlefield, you may exile a colorless card with mana value 7 or greater from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:88369:{Tap}：その追放されているカードをオーナーの手札に戻す。','Imprint — When Ugin''s Labyrinth enters the battlefield, you may exile a colorless card with mana value 7 or greater from your hand.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockMoveInboundApprovalRequestCsvExportService.php:67:        $filename = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardDetailRepository.php:233:        throw new NonUniqueResultException(sprintf('カード詳細情報が複数見つかりました: cardName=%s', $cardInfo['cardNameEn']));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1222:     * 注文ステータス一括変更
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1245:     * 出荷指示日一括削除
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1284:        if ($optionValues['stack_paper_judgment_price'] === (string) MtbOption::SALE) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1361:            ->setParameter('stackPaperThresholdPrice', (int) $optionValues['stack_paper_threshold_price'])
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1543:                'o.browser_print_flg = true'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1605:                    AND o.browser_print_flg = true
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:2083:        // 統合グループごとに SQL で最新注文日・注文番号一覧を一括取得するため、照会用 ID を集める。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/TopCategoryListBuilder.php:49:        private readonly \Symfony\Component\HttpFoundation\RequestStack $requestStack,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/TopCategoryListBuilder.php:56:        $request = $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/TopCategoryListBuilder.php:159:        $request = $this->requestStack->getCurrentRequest();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategoryTreeCardsetSyntheticChildrenGenerator.php:311:            $qPack = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategoryTreeCardsetSyntheticChildrenGenerator.php:353:            $qPack = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategoryTreeCardsetSyntheticChildrenGenerator.php:371:            $qMr = sprintf(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategoryTreeCardsetSyntheticChildrenGenerator.php:381:            $q = sprintf('cardset=%d&rarity=%d', $id, MtbRarity::UNCOMMON_ID);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategoryTreeCardsetSyntheticChildrenGenerator.php:386:            $q = sprintf('cardset=%d&rarity=%d', $id, MtbRarity::COMMON_ID);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Category/CategoryTreeCardsetSyntheticChildrenGenerator.php:391:            $q = sprintf('cardset=%d&rarity=%d', $id, MtbRarity::BASIC_LAND_ID);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/BuildBuyMainCard.php:57:            throw new InvalidParameterException(sprintf('商品規格ID %d が見つかりません', $orderDetail->productClassId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderRestockListCsvExportService.php:81:        $prefix = 'purchase_restock_list_'.sprintf('%07d', min($buyOrderIds)).'_';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:72:                                        <a href="javascript:openPrint('{{ url('mypage_shopping_history_printOrderReceipt', {id: Order.id}) }}')">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:109:     * ProductStock[] から DtbSalesQuantity を一括ロードし、
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:96:	 (43477,21406,1,3,177,127,1,NULL,'','','','Whenever an opponent casts a spell, you have five seconds to choose a keyword you haven''t chosen for a card named Modular Monstrosity today that''s been printed on a creature card. If you do, Modular Monstrosity gains that ability. Otherwise, Modular Monstrosity loses all keyword abilities.','3','3','155',1,false,0,'2019-03-12 02:54:46+09','2025-07-31 21:47:04+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:3864:	 (44971,136,1,2,163,13,1,NULL,'','After I examine your cargo and check your papers, you can be on your way.','飛行
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:4960:	 (46712,19304,1,3,157,522,1,NULL,'グリクシスで何かに署名するには、まず契約に目を通すこと。','Before signing anything on Grixis, always read the fine print.','対戦相手１人を対象とする。あなたのライブラリーのカードを上から３枚公開する。そのプレイヤーは、それらのカードをあなたの手札に加えることを選んでもよい。そうしない場合、それらのカードをあなたの墓地に置き、カードを５枚引く。','Reveal the top three cards of your library. Target opponent may choose to put those cards into your hand. If they don''t, put those cards into your graveyard and draw five cards.','','','105',1,false,0,'2019-03-12 17:32:54+09','2025-07-31 21:42:22+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:4978:	 (46718,17416,1,3,157,264,1,NULL,'霊気は系図を設計図とする。','Æther can turn a footprint into a blueprint.','エンチャント（クリーチャー）
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:6003:ファイレクシアの摂取者は＋Ｘ/＋Ｙの修整を受ける。Ｘはその追放されたクリーチャー・カードのパワーに等しく、Ｙはその追放されたクリーチャー・カードのタフネスに等しい。','Imprint — When Phyrexian Ingester enters the battlefield, you may exile target nontoken creature.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:6400:(Ｔ)：その追放されたカードと共通する好きな色のマナ１点を加える。','Imprint — When Chrome Mox enters the battlefield, you may exile a nonartifact, nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:6403:このクリーチャーによって追放されているカードがクリーチャー・カードであるかぎり、このクリーチャーは、これによって最後に追放されたクリーチャー・カードのパワーとタフネスとクリーチャー・タイプを持つ。これは多相の戦士でもある。','Imprint — When this creature enters, you may exile target nontoken creature.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:10257:疾駆(３)(赤)（あなたはこの呪文を、これの疾駆コストで唱えてもよい。そうしたなら、これは速攻を得るとともに、次の終了ステップの開始時にこれを戦場からオーナーの手札に戻す。）','Sprinting Warbrute attacks each combat if able.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:11547:	 (49542,8123,1,2,131,89,1,NULL,'','The most ferocious saddlebrutes lead the assault, ramming through massed pikes and stout barricades as if they were paper and silk.','マルドゥの荒くれ乗りが攻撃するたび、クリーチャー１体を対象とする。このターン、それではブロックできない。','Whenever Mardu Roughrider attacks, target creature can''t block this turn.','5','4','187',1,false,0,'2019-03-14 19:02:32+09','2025-07-31 21:14:32+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:14992:"a giant''s footprint"','クリーチャー１体を対象とする。あなたがコントロールする巨人(Giant)クリーチャーを１体選ぶ。その巨人はそのクリーチャーに、自身のパワーに等しい点数のダメージを与える。','Choose a Giant creature you control. It deals damage equal to its power to target creature.','','','109',1,false,0,'2019-03-14 19:09:42+09','2025-07-31 21:16:24+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:15174:	 (51337,19698,1,2,116,413,1,NULL,'','Ground into the footprints of the ravaging herd were clumps of salt from Benalia, moss from Llanowar, dust from Hurloon, and ash from as far as Urborg.','版図 ― ターン終了時まで、あなたがコントロールするクリーチャーはトランプルを得るとともに、あなたがコントロールする土地の中の基本土地タイプ１つにつき+1/+1の修整を受ける。','Domain — Until end of turn, creatures you control gain trample and get +1/+1 for each basic land type among lands you control.','','','171',1,false,0,'2019-03-14 19:09:45+09','2025-07-31 21:43:52+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:15391:	 (51417,4350,1,3,115,225,1,NULL,'契約には血判を押すこと。','Make sure you bleed the fine print.','あなたの手札にカードがないときにあなたがカードを引く場合、代わりにあなたはカードを２枚引き、１点のライフを失う。','If you would draw a card while you have no cards in hand, instead draw two cards and lose 1 life.','2','1','22',1,false,0,'2019-03-14 19:10:09+09','2025-07-31 20:49:42+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:16197:	 (51712,6520,1,1,113,73,1,NULL,'「契約には未払いが発生した場合の付随担保が明記されています。細則にはこうあります。『付随担保は頭部とする。』」','The contract specified an appendage for a missed payment. Read the fine print: the head is an appendage.','このターンにダメージを与えたクリーチャー１体を対象とする。それはターン終了時まで-5/-5の修整を受ける。','Target creature that dealt damage this turn gets -5/-5 until end of turn.','','','161',1,false,0,'2019-03-14 19:10:43+09','2025-07-31 21:10:22+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:16347:	 (51771,6578,1,3,113,95,1,NULL,'「無数の契約に記した細則のおかげで、私たちが無防備になることはなくなったのよ。」 ――― オルゾフの大特使、テイサ・カルロフ','"The fine print of countless contracts has ensured we are never defenseless."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:17204:	 (52148,9403,1,1,108,23,1,NULL,'「愚かな。お宝を紙の箱に入れて紐で結わいておくのと変わらないじゃないか。」','Pathetic. You might as well have protected your treasures with a paper box and some string.','エンチャント（クリーチャー） エンチャントされているクリーチャーは+2/+0の修整を受けるとともにブロックされない。','Enchant creature Enchanted creature gets +2/+0 and can''t be blocked.','0','0','74',1,false,0,'2019-03-14 19:13:40+09','2025-07-31 21:18:50+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:17478:	 (52283,4937,1,2,108,23,1,NULL,'遥か昔の侵略兵器であるぎらつく油は、数え切れない程の残虐行為の設計図を内に抱えている。','An invasion weapon of ages past, the glistening oil contained the blueprints of countless atrocities.','','','5','4','209',1,false,0,'2019-03-14 19:13:46+09','2025-07-31 21:03:55+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:17912:	 (52468,2370,1,2,106,353,1,NULL,'「アンデッドの肉は乾燥してて紙みたいだろ。 火花が落ちれば『ボワッ』といって、グールさんさよならだ。」','Undead flesh is dry and papery. A single spark and ‘poof.'' No more ghoul.','エンチャント（クリーチャー）
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:19785:プレイヤーはその追放されているカードと同じ名前を持つ呪文を唱えられない。','Imprint — When Exclusion Ritual enters the battlefield, exile target nonland permanent.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:19899:ファイレクシアの摂取者は＋Ｘ/＋Ｙの修整を受ける。Ｘはその追放されたクリーチャー・カードのパワーに等しく、Ｙはその追放されたクリーチャー・カードのタフネスに等しい。','Imprint — When Phyrexian Ingester enters the battlefield, you may exile target nontoken creature.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:20026:その追放されたカードと同じ名前を持つ土地が１つ対戦相手１人のコントロール下で戦場に出るたび、侵略の寄生虫はそのプレイヤーに２点のダメージを与える。','Imprint — When Invader Parasite enters the battlefield, exile target land.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:20194:	 (53422,4937,1,1,97,23,1,NULL,'遥か昔の侵略兵器であるぎらつく油は、数え切れない程の残虐行為の設計図を内に抱えている。','An invasion weapon of ages past, the glistening oil contained the blueprints of countless atrocities.','','','5','4','150',1,false,0,'2019-03-14 19:32:05+09','2025-07-31 21:03:55+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:20472:プレイヤー１人が自分の手札から呪文を１つ唱えるたび、そのプレイヤーはそれを追放する。そうした場合、そのプレイヤーは知識槽により追放された他の土地でないカードを１枚、そのカードのマナ・コストを支払うことなく唱えてもよい。','Imprint — When Knowledge Pool enters the battlefield, each player exiles the top three cards of their library.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:20488:マイアの溶接工は、それにより追放されたすべてのカードの起動型能力を持つ。','Imprint — {Tap}: Exile target artifact card from a graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:20927:クローンの殻が死亡したとき、その追放されたカードを表向きにする。それがクリーチャー・カードである場合、それをあなたのコントロール下で戦場に出す。','Imprint — When Clone Shell enters the battlefield, look at the top four cards of your library, exile one face down, then put the rest on the bottom of your library in any order.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:21010:{3}, {Tap}：ミミックの大桶によって追放されているカード１枚のコピーであるトークン１つを生成する。それは速攻を得る。次の終了ステップの開始時に、それを追放する。','Imprint — Whenever a nontoken creature dies, you may exile that card. If you do, return each other card exiled with Mimic Vat to its owner''s graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:21059:(Ｘ),(Ｔ)：その追放されたカードのコピーであるトークンを１つ生成する。Ｘはそのカードの点数で見たマナ・コストである。','Imprint — When Prototype Portal enters the battlefield, you may exile an artifact card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:21077:あなたが唱える、その追放されているカードと共通のカード・タイプを持つ呪文は、それを唱えるためのコストが(２)少なくなる。','Imprint — When Semblance Anvil enters the battlefield, you may exile a nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:21089:装備(３)','Imprint — When Strata Scythe enters the battlefield, search your library for a land card, exile it, then shuffle.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:23306:	 (54692,10576,1,2,82,76,1,NULL,'「この血の染みから、我々を苦しめるものの指紋を見つけようぞ。」――― 遺跡の賢者、アノワン.','"In these bloodstains I will find the fingerprints of our oppressors."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:24151:	 (55114,1738,1,2,78,258,1,NULL,'それはあらゆる物を踏み潰すが、そこには何の跡も残さない ――― 踏み荒らされた破片も、潰された魂も、蹄跡すらも。','It crushes all underfoot, yet leaves no trace of its passage—no trampled debris, no flattened souls, not even a hoofprint.','虚無跡のガルガンチュアンが戦場に出たとき、あなたがコントロールするクリーチャー１体を、オーナーのライブラリーの一番上に置く。','When Nulltread Gargantuan enters the battlefield, put a creature you control on top of its owner''s library.','5','6','102',1,false,0,'2019-03-14 19:38:04+09','2025-07-31 20:36:57+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:24691:	 (55340,19304,1,3,74,522,1,NULL,'グリクシスで何かに署名するには、まず契約に目を通すこと。','Before signing anything on Grixis, always read the fine print.','対戦相手１人を対象とする。あなたのライブラリーのカードを上から３枚公開する。そのプレイヤーは、それらのカードをあなたの手札に加えることを選んでもよい。そうしない場合、それらのカードをあなたの墓地に置き、カードを５枚引く。','Reveal the top three cards of your library. Target opponent may choose to put those cards into your hand. If they don''t, put those cards into your graveyard and draw five cards.','','','38',1,false,0,'2019-03-14 19:38:54+09','2025-07-31 21:42:22+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:27499:{2}{White}, 雄鹿の蹄の跡の上から蹄跡カウンター４個を取り除く：飛行を持つ白の４/４のエレメンタル・クリーチャー・トークン１体を生成する。あなたのターンにしか起動できない。','Whenever you draw a card, you may put a hoofprint counter on Hoofprints of the Stag.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:27500:{2}{White}, Remove four hoofprint counters from Hoofprints of the Stag: Create a 4/4 white Elemental creature token with flying. Activate only during your turn.','','','21',1,false,0,'2019-03-14 19:42:33+09','2025-07-31 21:16:00+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:27892:"a giant''s footprint"','クリーチャー１体を対象とする。あなたがコントロールする巨人(Giant)クリーチャーを１体選ぶ。その巨人はそのクリーチャーに、自身のパワーに等しい点数のダメージを与える。','Choose a Giant creature you control. It deals damage equal to its power to target creature.','','','162',1,false,0,'2019-03-14 19:42:41+09','2025-07-31 21:16:24+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:30640:	 (57746,19698,1,2,63,413,1,NULL,'ベナリアの岩塩、ラノワールの苔、ハールーンの埃、そしてアーボーグの灰すらもが荒々しい群れの足跡に削られた。','Ground into the footprints of the ravaging herd were clumps of salt from Benalia, moss from Llanowar, dust from Hurloon, and ash from as far as Urborg.','版図 ― ターン終了時まで、あなたがコントロールするクリーチャーはトランプルを得るとともに、あなたがコントロールする土地の中の基本土地タイプ１つにつき+1/+1の修整を受ける。','Domain — Until end of turn, creatures you control gain trample and get +1/+1 for each basic land type among lands you control.','','','230',1,false,0,'2019-03-14 21:12:29+09','2025-07-31 21:43:52+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:32778:	 (58489,17416,1,3,58,264,1,NULL,'霊気は系図を設計図とする。','Æther can turn a footprint into a blueprint.','エンチャント（クリーチャー）
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:34201:	 (59197,18346,1,2,56,245,1,NULL,'動きは猿のようだがその千倍もすばやく、あらゆる隅を覗き込んでは、灰の手形を残す。','They moved like apes, but a thousand times swifter, prying into every corner, leaving pawprints of ash.','速攻を持つ赤の3/1のエレメンタル(Elemental)・クリーチャー・トークンを３体生成する。次の終了ステップの開始時に、それらを追放する。','Create three 3/1 red Elemental creature tokens with haste. Exile them at the beginning of the next end step.','','','97',1,false,0,'2019-03-14 21:19:01+09','2025-07-31 21:39:20+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:34399:	 (59270,18811,1,2,55,256,1,NULL,'目をつけ、紙折らば、霊は去り、魂は封じられん。','Crease the folds, bend the paper, turn the spirits, shield the soul.','廃院の神主は、あなたがコントロールするパーマネントの色に対するプロテクションを持つ。','Empty-Shrine Kannushi has protection from the colors of permanents you control.','1','1','2',1,false,0,'2019-03-14 21:21:04+09','2025-07-31 21:41:01+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:34423:	 (59278,18820,1,1,55,240,1,NULL,'それは灯籠の灯りが自らの紙の翼に落とす影を覚えていた。その影は時として再びその形を結び、物言わぬ悲劇を演じるのだ。','It remembered all the shadows lantern-cast upon its paper wings, and sometimes those silhouettes played across its shape again, acting out silent tragedies.','あなたがスピリット(Spirit)か秘儀(Arcane)呪文を唱えるたび、破れ障子の神はターン終了時まで飛行を得る。','Whenever you cast a Spirit or Arcane spell, Kami of Tattered Shoji gains flying until end of turn.','2','5','11',1,false,0,'2019-03-14 21:21:05+09','2025-07-31 21:41:03+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:36059:	 (59909,4016,1,3,51,257,1,NULL,'今日の文鎮は、明日の地ならし屋ってとこね。――― ニューロックの指導者ブルエナ.','"Today''s paperweight, tomorrow''s leveler."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:36258:死面の映し身人形に追放されたカードが飛行を持っているかぎり、死面の映し身人形は飛行を持つ。畏怖、先制攻撃、二段攻撃、速攻、土地渡り、プロテクション、トランプルについても同様である。','Imprint — {1}: Exile target creature card from your graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:36310:あなたのアップキープの開始時に、あなたは一望の鏡に追放されているそのインスタント・カードかソーサリー・カードの１枚をコピーしてもよい。そうした場合、あなたはそのコピーを、そのマナ・コストを支払うことなく唱えてもよい。','Imprint — {X}, {Tap}: You may exile an instant or sorcery card with mana value X from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:36334:装備(４)','Imprint — When Spellbinder enters the battlefield, you may exile an instant card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:36746:召喚者の卵が死亡したとき、その追放されている裏向きのカードを表向きにする。それがクリーチャー・カードである場合、それをあなたのコントロール下で戦場に出す。','Imprint — When Summoner''s Egg enters the battlefield, you may exile a card from your hand face down.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:37097:(Ｔ)：その追放されたカードと共通する好きな色のマナ１点を加える。','Imprint — When Chrome Mox enters the battlefield, you may exile a nonartifact, nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:37132:このクリーチャーによって追放されているカードがクリーチャー・カードであるかぎり、このクリーチャーは、これによって最後に追放されたクリーチャー・カードのパワーとタフネスとクリーチャー・タイプを持つ。これは多相の戦士でもある。','Imprint — When this creature enters, you may exile target nontoken creature.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:37142:その追放されているカードと同じ名前の土地がマナを引き出す目的でタップされるたび、それのコントローラーは、その土地が生み出したいずれかのタイプのマナ１点を加える。','Imprint — When Extraplanar Lens enters the battlefield, you may exile target land you control.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:37216:鏡のゴーレムは、その追放されたカードの各カード・タイプに対するプロテクションを持つ。（アーティファクト、クリーチャー、エンチャント、インスタント、土地、プレインズウォーカー、ソーサリー、部族がカード・タイプである。）','Imprint — When Mirror Golem enters the battlefield, you may exile target card from a graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:37219:(２),(Ｔ)：このターン、その追放されたカードと同じ色を共有する、あなたが選んだ発生源１つによって与えられるすべてのダメージを軽減する。','Imprint — When Mourner''s Shield enters the battlefield, you may exile target card from a graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:37241:{X}, {Tap}：その追放されたカードのコピーであるトークンを１つ生成する。Ｘはそのカードの点数で見たマナ・コストに等しい。','Imprint — When Soul Foundry enters the battlefield, you may exile a creature card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:37312:プレイヤー１人がカードを唱えるたび、それがその追放されたソーサリー・カードの一方と同じ名前を持つ場合、あなたは他の一方をコピーしてもよい。そうした場合、あなたはそのコピーを、そのマナ・コストを支払うことなく唱えてもよい。','Imprint — When Spellweaver Helix enters the battlefield, you may exile two target sorcery cards from a single graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:37351:プレイヤー１人がその追放されているカードと共通の色または点数で見たマナ・コストを持つ呪文を唱えるたび、思考の牢獄はそのプレイヤーに２点のダメージを与える。','Imprint — When Thought Prison enters the battlefield, you may have target player reveal their hand. If you do, choose a nonland card from it and exile that card.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:37389:	 (60485,2007,1,1,50,375,1,NULL,'詩人は他の世界の物語の一節を夢見る。工匠は他の次元のアーティファクトの青写真を夢見る。','Poets dream the verses of otherworldly stories. Artificers dream the blueprints of otherplanar artifacts.','警戒','Vigilance','1','4','277',1,false,0,'2019-03-14 21:23:47+09','2025-07-31 20:37:48+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:40566:	 (61888,13235,1,1,42,322,1,NULL,'そいつは霞の中に身を潜めて、落後する者が出るのをじっと待ち受けている。霧が晴れたとき、あとに残っているのは足跡だけだ。','It lurks in the mist, waiting for stragglers to fall behind. When the fog clears, nothing remains but footprints.','幻影の仔が攻撃かブロックしたとき、戦闘終了時に幻影の仔をオーナーの手札に戻す。（それが戦場にある場合にのみ戻す。）','When Phantom Whelp attacks or blocks, return it to its owner''s hand at end of combat. (Return it only if it''s on the battlefield.)','2','2','93',1,false,0,'2019-03-14 21:33:54+09','2025-07-31 21:29:43+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:41957:	 (62540,12415,1,2,40,254,1,NULL,'地面が揺れるのを感じたんだ。それでテントに逃げ込んで、地震がおさまるのを待った。地震はすぐおさまったが、それが足跡を残していったんだ。――― フェメレフの探検者.','"I felt the ground shake, so I hid in my tent until the earthquake passed. It passed all right, and it left hoofprints."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:44130:	 (63846,10183,1,2,32,328,1,NULL,'いちいち書類をそろえるより、ワイロのほうが話が早いんだよ。','A bribe is always faster than filling out paperwork.','あなたがクリーチャー呪文を唱えるたび、あなたは(１)を支払ってもよい。そうした場合、カードを１枚引き、その後あなたはカードを１枚捨てる。','Whenever you cast a creature spell, you may pay {1}. If you do, draw a card, then discard a card.','','','71',1,false,0,'2019-03-14 21:41:46+09','2025-07-31 21:21:55+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:44863:Footprints of the beasts of Keld.','土地１つを対象とする。それと、それと同じ名前を持つ他のすべての土地を破壊する。','Destroy target land and all other lands with the same name as that land.','','','99',1,false,0,'2019-03-14 21:43:20+09','2025-07-31 21:27:16+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:45270:	 (64405,12442,1,3,27,677,1,NULL,'着想から下絵へ、そして実際のものへ。','From concept to paper to reality.','','','','','137',1,false,0,'2019-03-14 21:43:52+09','2025-07-31 21:27:04+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:54724:At the beginning of the end step, return Viashino Sandsprinter to its owner''s hand. (Return it only if it''s on the battlefield.)
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:55494:At the beginning of the end step, return Viashino Sandsprinter to its owner''s hand. (Return it only if it''s on the battlefield.)
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:58128:(Ｔ)：その追放されたカードと共通する好きな色のマナ１点を加える。','Imprint — When Chrome Mox enters the battlefield, you may exile a nonartifact, nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:65700:{3}, {Tap}：ミミックの大桶によって追放されているカード１枚のコピーであるトークン１つを生成する。それは速攻を得る。次の終了ステップの開始時に、それを追放する。','Imprint — Whenever a nontoken creature dies, you may exile that card. If you do, return each other card exiled with Mimic Vat to its owner''s graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:65712:{X}, {Tap}：その追放されたカードのコピーであるトークンを１つ生成する。Ｘはそのカードの点数で見たマナ・コストに等しい。','Imprint — When Soul Foundry enters the battlefield, you may exile a creature card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:72381:	 (79009,26142,1,3,226,226,1,NULL,'','','','Protection from modified creatures. (Modified creatures have a power, toughness, or ability different than their printed version.)
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:72883:プレイヤー１人が自分の手札から呪文を１つ唱えるたび、そのプレイヤーはそれを追放する。そうした場合、そのプレイヤーは知識槽により追放された他の土地でないカードを１枚、そのカードのマナ・コストを支払うことなく唱えてもよい。','Imprint — When Knowledge Pool enters the battlefield, each player exiles the top three cards of their library.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:73251:プレイヤー１人が自分の手札から呪文を１つ唱えるたび、そのプレイヤーはそれを追放する。そうした場合、そのプレイヤーは知識槽により追放された他の土地でないカードを１枚、そのカードのマナ・コストを支払うことなく唱えてもよい。','Imprint — When Knowledge Pool enters the battlefield, each player exiles the top three cards of their library.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:74472:ファイレクシアの摂取者は＋Ｘ/＋Ｙの修整を受ける。Ｘはその追放されたクリーチャー・カードのパワーに等しく、Ｙはその追放されたクリーチャー・カードのタフネスに等しい。','Imprint — When Phyrexian Ingester enters the battlefield, you may exile target nontoken creature.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:76845:	 (80992,8123,1,2,280,89,1,NULL,'','The most ferocious saddlebrutes lead the assault, ramming through massed pikes and stout barricades as if they were paper and silk.','マルドゥの荒くれ乗りが攻撃するたび、クリーチャー１体を対象とする。このターン、それではブロックできない。','Whenever Mardu Roughrider attacks, target creature can''t block this turn.','5','4','1993',0,false,0,'2020-03-14 03:27:41+09','2025-07-31 21:14:32+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:77310:{3}, {Tap}：ミミックの大桶によって追放されているカード１枚のコピーであるトークン１つを生成する。それは速攻を得る。次の終了ステップの開始時に、それを追放する。','Imprint — Whenever a nontoken creature dies, you may exile that card. If you do, return each other card exiled with Mimic Vat to its owner''s graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:78004:{2}{White}, 雄鹿の蹄の跡の上から蹄跡カウンター４個を取り除く：飛行を持つ白の４/４のエレメンタル・クリーチャー・トークン１体を生成する。あなたのターンにしか起動できない。','Whenever you draw a card, you may put a hoofprint counter on Hoofprints of the Stag.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:78005:{2}{White}, Remove four hoofprint counters from Hoofprints of the Stag: Create a 4/4 white Elemental creature token with flying. Activate only during your turn.','','','90',0,false,0,'2020-04-10 03:40:24+09','2025-07-31 21:16:00+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:78340:{3}, {Tap}：ミミックの大桶によって追放されているカード１枚のコピーであるトークン１つを生成する。それは速攻を得る。次の終了ステップの開始時に、それを追放する。','Imprint — Whenever a nontoken creature dies, you may exile that card. If you do, return each other card exiled with Mimic Vat to its owner''s graveyard.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:79651:	 (82073,26526,1,3,227,47,1,NULL,'狩人の野営地で見つかったものは、小さな足跡と大量の血だけだった。','All they found in the hunter''s camp were tiny paw prints and a lot of blood.','あなたのターンの戦闘の開始時に、あなたの墓地から赤か白か黒のクリーチャー・カード１枚を対象とし、それを追放する。１/１であることを除きそのカードのコピーであるトークンを１体生成する。あなたの次のターンまで、それは速攻を得る。','At the beginning of combat on your turn, exile target red, white, or black creature card from your graveyard. Create a token that''s a copy of that card, except it''s 1/1. It gains haste until your next turn.','0','0','198',0,false,0,'2020-04-12 05:33:26+09','2025-07-31 21:55:10+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:80144:	 (82214,26526,1,3,233,47,1,NULL,'狩人の野営地で見つかったものは、小さな足跡と大量の血だけだった。','All they found in the hunter''s camp were tiny paw prints and a lot of blood.','あなたのターンの戦闘の開始時に、あなたの墓地から赤か白か黒のクリーチャー・カード１枚を対象とし、それを追放する。１/１であることを除きそのカードのコピーであるトークンを１体生成する。あなたの次のターンまで、それは速攻を得る。','At the beginning of combat on your turn, exile target red, white, or black creature card from your graveyard. Create a token that''s a copy of that card, except it''s 1/1. It gains haste until your next turn.','0','0','340',0,false,0,'2020-04-13 04:39:03+09','2025-07-31 21:55:10+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:80930:	 (82460,26526,1,3,227,47,1,NULL,'狩人の野営地で見つかったものは、小さな足跡と大量の血だけだった。','All they found in the hunter''s camp were tiny paw prints and a lot of blood.','あなたのターンの戦闘の開始時に、あなたの墓地から赤か白か黒のクリーチャー・カード１枚を対象とし、それを追放する。１/１であることを除きそのカードのコピーであるトークンを１体生成する。あなたの次のターンまで、それは速攻を得る。','At the beginning of combat on your turn, exile target red, white, or black creature card from your graveyard. Create a token that''s a copy of that card, except it''s 1/1. It gains haste until your next turn.','0','0','198',1,false,0,'2020-04-13 05:32:31+09','2025-07-31 21:55:10+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:81420:	 (82601,26526,1,3,233,47,1,NULL,'狩人の野営地で見つかったものは、小さな足跡と大量の血だけだった。','All they found in the hunter''s camp were tiny paw prints and a lot of blood.','あなたのターンの戦闘の開始時に、あなたの墓地から赤か白か黒のクリーチャー・カード１枚を対象とし、それを追放する。１/１であることを除きそのカードのコピーであるトークンを１体生成する。あなたの次のターンまで、それは速攻を得る。','At the beginning of combat on your turn, exile target red, white, or black creature card from your graveyard. Create a token that''s a copy of that card, except it''s 1/1. It gains haste until your next turn.','0','0','340',1,false,0,'2020-04-13 05:32:35+09','2025-07-31 21:55:10+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:81806:	 (82760,26526,1,3,227,47,2,NULL,'狩人の野営地で見つかったものは、小さな足跡と大量の血だけだった。','All they found in the hunter''s camp were tiny paw prints and a lot of blood.','あなたのターンの戦闘の開始時に、あなたの墓地から赤か白か黒のクリーチャー・カード１枚を対象とし、それを追放する。１/１であることを除きそのカードのコピーであるトークンを１体生成する。あなたの次のターンまで、それは速攻を得る。','At the beginning of combat on your turn, exile target red, white, or black creature card from your graveyard. Create a token that''s a copy of that card, except it''s 1/1. It gains haste until your next turn.','0','0','198',1,true,0,'2020-04-18 22:18:16+09','2025-07-31 21:55:10+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:83794:	 (83564,26760,1,1,237,6,1,NULL,'匂いは薄れ足跡は洗い流されるが、決して消せない痕跡もある。','Scents fade and footprints wash away, but some trails can never be erased.','占術３を行い、その後あなたのライブラリーの一番上のカードを公開する。それがクリーチャーや土地であるカードなら、カードを１枚引く。（占術３とは、あなたのライブラリーの一番上からカードを３枚見て、そのうち望む枚数をあなたのライブラリーの一番下に、残りを一番上に、それぞれ望む順番で置くことである。）','Scry 3, then reveal the top card of your library. If it''s a creature or land card, draw a card. (To scry 3, look at the top three cards of your library, then put any number of them on the bottom of your library and the rest on top in any order.)','','','211',0,false,0,'2020-06-19 06:56:18+09','2025-07-31 21:56:01+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:87655:(Ｔ)：その追放されたカードと共通する好きな色のマナ１点を加える。','Imprint — When Chrome Mox enters the battlefield, you may exile a nonartifact, nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:87658:クローンの殻が死亡したとき、その追放されたカードを表向きにする。それがクリーチャー・カードである場合、それをあなたのコントロール下で戦場に出す。','Imprint — When Clone Shell enters the battlefield, look at the top four cards of your library, exile one face down, then put the rest on the bottom of your library in any order.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:87680:このクリーチャーによって追放されているカードがクリーチャー・カードであるかぎり、このクリーチャーは、これによって最後に追放されたクリーチャー・カードのパワーとタフネスとクリーチャー・タイプを持つ。これは多相の戦士でもある。','Imprint — When this creature enters, you may exile target nontoken creature.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:87972:(Ｔ)：その追放されたカードと共通する好きな色のマナ１点を加える。','Imprint — When Chrome Mox enters the battlefield, you may exile a nonartifact, nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:88589:(Ｔ)：その追放されたカードと共通する好きな色のマナ１点を加える。','Imprint — When Chrome Mox enters the battlefield, you may exile a nonartifact, nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:88592:クローンの殻が死亡したとき、その追放されたカードを表向きにする。それがクリーチャー・カードである場合、それをあなたのコントロール下で戦場に出す。','Imprint — When Clone Shell enters the battlefield, look at the top four cards of your library, exile one face down, then put the rest on the bottom of your library in any order.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:88612:このクリーチャーによって追放されているカードがクリーチャー・カードであるかぎり、このクリーチャーは、これによって最後に追放されたクリーチャー・カードのパワーとタフネスとクリーチャー・タイプを持つ。これは多相の戦士でもある。','Imprint — When this creature enters, you may exile target nontoken creature.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:88900:(Ｔ)：その追放されたカードと共通する好きな色のマナ１点を加える。','Imprint — When Chrome Mox enters the battlefield, you may exile a nonartifact, nonland card from your hand.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:90003:	 (86829,27142,1,3,242,142,1,NULL,'その足が踏んだ跡は、不毛の塵が肥沃な土地になる。','In its hoofprints, barren dust becomes fertile ground.','鎮まらぬ大地、ヤシャーンが戦場に出たとき、あなたのライブラリーから基本森・カード１枚と基本平地・カード１枚を探し、公開し、あなたの手札に加える。その後、あなたのライブラリーを切り直す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/RebuildOtcBuyOrderDetail.php:45:        // 一括DELETEはメモリ上のコレクションは更新しないため、明示的に空にする
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:747:     * 指定された card_id 配列に対して、card / 言語ごとの最新カード画像 URL を一括取得する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:938:     * デッキ一括購入用、 指定カードIDに紐づく在庫あり ProductClass 候補を取得する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/product.twig:7:      - form: AddCartType または FavoriteCartType（list_variants が2件以上のとき一括数量・名前 favorite_cart）の FormView|null
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/product.twig:76:            {# 複数規格の一括数量 UI のときは規格 select なし（お気に入り一覧と同様） #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/product.twig:131:                        {# お気に入りと同様の一括カート + 「＋他の状態」でリード以外の規格を開閉 #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/order_receipt.twig:10:        <div class="printBox">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/order_receipt.twig:11:            <button id="printButton" style="width: 120px; height: 26px; margin: 3px;">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/order_receipt.twig:12:                {{ 'admin.common.print'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/order_receipt.twig:133:                const btn = document.getElementById('printButton');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/order_receipt.twig:136:                        window.print();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/index.twig:50:            // 一括操作ボタンの制御
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Card/index.twig:359:                                        一括削除
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:486:front.privacy.s9.li2: "When entrusting the handling of personal information to contracted companies with confidentiality agreements, within the scope necessary to achieve the stated purposes of use (e.g., contracted companies include delivery companies, printing companies for catalog address labels, credit card companies when card payment is requested, etc.)"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:863:front.product_search.subtype_hint: "※Types printed in the type line of the card (e.g. Elf, Angel, Equipment)"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1604:admin.common.print: Print
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2250:admin.order.print_delivery_slips_ja: Print Delivery Slip（ja）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2251:admin.order.print_delivery_slips_en: Print Delivery Slip（en）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2375:admin.delivery_slips_ja: 納品書
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:5:            const btn = document.getElementById('printButton');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:8:                    window.print();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:19:        <title>納品書</title>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:23:        <div class="printBox">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:24:            <button id="printButton" style="width: 120px; height: 26px; margin: 3px;">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:25:                {{ 'admin.common.print'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:42:    .btn-print-stack {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:46:    .btn-print-stack:hover,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:47:    .btn-print-stack:focus,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:48:    .btn-print-stack:active {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:135:            // メール一括通知
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:161:            $('.pdf-print').click(function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:166:            // 納品書印刷(日本語)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:167:            $('#printDeliverySlipsJp').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:179:            // 納品書印刷(英語)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:180:            $('#printDeliverySlipsEn').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:231:            $('#printStack').click(function (event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:237:                $('#form_bulk').attr('action', "{{ url('admin_order_print_stack_window') }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1207:                                        <button type="button" id="printStack" class="btn btn-ec-conversion px-5 btn-print-stack">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1208:                                            {{ 'admin.order.print_stack_paper'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1214:                                            <button type="button" id="printDeliverySlipsJp" class="btn btn-ec-conversion px-5">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1215:                                                {{ 'admin.order.print_delivery_slips_ja'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1217:                                            <button type="button" id="printDeliverySlipsEn" class="btn btn-ec-conversion px-5">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1218:                                                {{ 'admin.order.print_delivery_slips_en'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1306:                                                            <a class="btn btn-ec-actionIcon pdf-print" href="{{ url('admin_order_export_pdf') }}?ids[]={{ Shipping.id }}" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'admin.order.output_delivery_note_short'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1408:                <!-- 一括削除の確認モーダル -->
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:12:            $('#printPickingList').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:14:                $('#form_bulk').attr('action', "{{ url('admin_shipping_standby_print_picking_list', { 'id' : shippingStandby.id }) }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:20:            // 納品書印刷(日本語)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:21:            $('#printDeliverySlipsJp').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:23:                $('#form_bulk').attr('action', "{{ url('admin_shipping_standby_print_delivery_slips' ,{'id' : shippingStandby.id, 'lang' : 'ja' }) }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:28:            // 納品書印刷(英語)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:29:            $('#printDeliverySlipsEn').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:31:                $('#form_bulk').attr('action', "{{ url('admin_shipping_standby_print_delivery_slips' ,{'id' : shippingStandby.id, 'lang' : 'en' }) }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:117:                                                    <button type="button" id="printPickingList" class="btn btn-primary btn-sm edit">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:118:                                                        {{ 'admin.order.shipping_standby_list_print'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:120:                                                    <button type="button" id="printDeliverySlipsJp" class="btn btn-primary btn-sm edit">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:121:                                                        {{ 'admin.order.print_delivery_slips_ja'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:123:                                                    <button type="button" id="printDeliverySlipsEn" class="btn btn-primary btn-sm edit">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:124:                                                        {{ 'admin.order.print_delivery_slips_en'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1297:front.cart.delete_all_item: カート一括削除
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1304:front.cart.description: 商品の数量を変更する場合は、「＋」「－」で数量を変更してください。商品を削除する場合は、「削除」または「カート一括削除」をご利用ください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1384:front.shopping.payment_modal.credit.notes: "クレジットカード利用明細上の名前には「晴れる屋」と表示されます。<br>※分割払いには対応しておりません。一括払いでのお支払いのみ可能です。<br>※他の支払方法からクレジットカード決済への変更は対応できません。<br>※クレジットカードでお支払いのご注文が含まれる場合は同梱発送を承っておりません。ご了承ください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1598:admin.common.bulk_registration: 一括登録を実行
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1614:admin.common.print: 印刷する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1666:admin.common.email_sending: "メール一括送信"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1676:admin.common.bulk_actions: 一括操作
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1893:admin.product.edit_bulk_update_buy_pricing: 買取・基準価格一括編集
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2195:admin.product.standard_price_bulk_update: 買取・基準価格一括編集
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2414:admin.order.mail_bulk: メール一括通知
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2416:admin.order.print_stack_paper: スタック用紙印刷
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2451:admin.order.output_delivery_note: 納品書を出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2452:admin.order.output_delivery_note_short: 納品書出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2453:admin.order.print_delivery_slips_ja: 納品書印刷（日本語）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2454:admin.order.print_delivery_slips_en: 納品書印刷（英語）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2547:admin.order.delivery_note_title__default: お買上げ明細書(納品書)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2589:# 納品書印刷（日本語）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2590:admin.delivery_slips_ja: 納品書
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2610:# 納品書印刷（英語）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2639:admin.order.shipping_standby_list_print: ピッキングリスト印刷
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2667:admin.order.manual_mail_all: 一括メール通知
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2764:admin.customer.mail: メール一括送信
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2990:admin.setting.shop.shop.stack_paper_threshold: スタック用紙高額商品しきい値価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3558:tooltip.product.csv_upload: 所定の型のCSVデータを用いて商品を一括で登録することができます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3560:tooltip.category.csv_upload: 所定の型のCSVデータを用いてカテゴリを一括で登録することができます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3564:tooltip.order.bulk_actions: チェックを入れた受注に対して、一括処理を行います。充分に確認をしてから実行してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3579:tooltip.shipping.csv_upload: 所定の型のCSVデータを用いて出荷情報を一括で登録することができます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3616:tooltip.setting.shop.shop.option_invoice_registration_number: 納品書に適格請求書発行事業者登録番号を表示できます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3625:tooltip.setting.shop.delivery.apply_to_pref: すべての都道府県に同じ送料を一括で設定できます。あとから個々の都道府県の送料を書き換えることも可能です。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3653:tooltip.stock.approval_list.approval_target: 承認が必要な在庫操作の種類を表します（在庫編集・一括編集・CSV変更・分割・結合・移動・振替）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3657:tooltip.class_name.csv_upload: 所定の型のCSVデータを用いて規格を一括で登録することができます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4353:admin.deck.bulk_delete: 一括削除
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4354:admin.deck.bulk_edit: 一括編集
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4355:admin.deck.bulk_edit_execute: 一括編集実行
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4472:admin.stock.bulk_edit.title: 在庫一括編集
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4551:admin.stock.move.shortage_csv_modal.note: 欠品点数をCSVで一括登録します。欠品点数を入力した行のみ更新され、空欄の行およびCSVに含まれない明細は変更されません。0を入力した場合は欠品点数を0に更新します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4593:admin.stock.move.differential_csv_modal.note: 差分点数をCSVで一括登録します。差分点数を入力した行のみ更新され、空欄の行およびCSVに含まれない明細は変更されません。0を入力した場合は差分点数を0に更新します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4692:admin.stock.list.bulk_edit: 在庫一括編集
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4985:admin.stock.split.new_destination_csv_modal.note: CSVファイルをアップロードして分割先商品を一括登録します。登録済みの分割先リストは上書きされます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5056:admin.stock.join.shortage_csv_modal.note: 欠品点数をCSVで一括登録します。登録済みの欠品点数は上書きされます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5274:admin.stock.move_instruction.csv_tracking_success: 送り状No.を一括登録しました。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5317:admin.stock.approval_list.bulk_reject: 一括却下
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5318:admin.stock.approval_list.bulk_approve: 一括承認
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5337:admin.stock.approval_list.approval_target_bulk_edit: 在庫一括編集
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5621:front.deck.show.buy_all: このデッキを一括購入する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5743:front.deck.result.meta.description: "%listTitle%はこちら。晴れる屋デッキ検索は、世界最大級のマジック：ザ・ギャザリングのデッキ検索データベースです。リストから一括でデッキを購入することも可能です。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5853:admin.event.entry_bulk: イベント一括登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5854:admin.event.entry.bulk_csv_upload_title: イベント一括登録CSVアップロード
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5855:admin.event.entry.bulk_csv_header: イベント一括登録CSV
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5856:admin.event.entry.bulk_csv_format_title: イベント一括登録CSVファイルフォーマット
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5857:tooltip.event.entry.bulk_csv_upload: 所定の型のCSVファイルを選択し、一括登録を実行するとイベントを登録できます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5858:tooltip.event.entry.bulk_csv_format: 雛形ファイルをダウンロードして編集すれば、所定の型のイベント一括登録用CSVデータを作成できます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5985:admin.event.schedule.bulk_delete: 選択した日程を一括削除
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5993:admin.event.schedule.bulk_delete.error: "デッキ登録または申込がある日程が含まれていたため、一括削除できませんでした。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6057:admin.event.entry.bulk_edit: 一括編集
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6058:admin.event.entry.bulk_update.modal_title: イベント申込一括更新
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6589:front.event.entry.payment_info.notes: '※分割払いには対応しておりません。一括払いでのお支払いのみ可能です。<br>※クレジットカード決済から他のお支払い方法への変更は対応できません。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:11:            const btn = document.getElementById('printButton');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:14:                    window.print();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:21:        <div class="printBox">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:22:            <button id="printButton" style="width: 120px; height: 26px; margin: 3px;">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/picking_list.twig:23:                {{ 'admin.common.print'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/print_stack_window.twig:30:            url: '{{ url("admin_order_print_stack") }}'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:5:            const btn = document.getElementById('printButton');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:8:                    window.print();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:19:        <title>納品書</title>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:23:        <div class="printBox">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:24:            <button id="printButton" style="width: 120px; height: 26px; margin: 3px;">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:25:                {{ 'admin.common.print'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:475:            $('.pdf-print').click(function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:747:        // 納品書印刷
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:748:        $('#print-delivery-slip').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:749:            const url = "{{ url('admin_order_print_delivery_slips', {id: Order.id}) }}";
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:806:                                        <button type="button" class="btn btn-ec-regular" id="print-delivery-slip">{{ '納品書印刷'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1608:                                                <a class="btn btn-ec-regular pdf-print" href="{{ url('admin_order_export_pdf') }}?ids[]={{ Order.Shippings[0].id }}">{{ 'admin.order.output_delivery_note'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:159:        $('.pdf-print').click(function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:324:                                                <!-- 納品書を出力ボタン -->
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:325:                                                <a class="btn btn-ec-regular pdf-print" href="{{ url('admin_order_export_pdf') }}?ids[]={{ shippingForm.vars.value.id }}">{{ 'admin.order.output_delivery_note'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/confirmationModal_js.twig:143:     * ステータス一括更新
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/confirmationModal_js.twig:233:     * メール一括送信
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/mail_view.twig:11:<style media="print" type="text/css">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:294:                                <div class="col-3"><span>{{ 'admin.setting.shop.shop.stack_paper_threshold'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:296:                                    {{ form_widget(form.stack_paper_threshold) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:297:                                    {{ form_errors(form.stack_paper_threshold) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:204:            // 一括フォームは formaction でアクションを切り替えるため、CSRFトークンも対応する値に差し替える
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:432:        {# 一括編集アコーディオン #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:896:                                <button id="sell_btn" class="btn btn-ec-conversion px-5" type="submit" formaction="{{ path('admin_purchase_bulk_detail_sell', { id : BuyOrder.id } ) }}">一括売却登録</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/restock_list.twig:10:    <div class="printBox">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/restock_list.twig:11:        <button id="printButton" type="button" style="width: 120px; height: 26px; margin: 3px;">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/restock_list.twig:12:            {{ 'admin.common.print'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/mail_confirm.twig:66:                        以下ユーザーに一括送信します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:227:                            const printButton = popupWindow.document.getElementById('printButton');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:228:                            if (printButton) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:229:                                printButton.addEventListener('click', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:230:                                    popupWindow.print();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/tenant/detail.twig:552:                                <div class="col-3"><span>{{ 'admin.setting.shop.shop.stack_paper_threshold'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/tenant/detail.twig:554:                                    {{ form_widget(form.stack_paper_threshold) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/tenant/detail.twig:555:                                    {{ form_errors(form.stack_paper_threshold) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/approval_list.twig:126:            // 一括チェック（未承認行のみ選択可能。一括承認・却下は今後実装）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/approval_list.twig:151:            // 一括承認ボタン押下時に確認モーダルを表示
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/approval_list.twig:297:            // 一括却下するボタン押下時に確認モーダルを表示
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/decklist.twig:8:        @media screen, print {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/decklist.twig:18:            .printBox {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/decklist.twig:27:            .printBox__button {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/decklist.twig:277:        @media print {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/decklist.twig:278:            .printBox {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/decklist.twig:288:                    window.print();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/decklist.twig:295:    <div class="printBox">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Event/Entry/decklist.twig:296:        <button type="button" id="decklistPrintButton" class="printBox__button">{{ 'admin.common.print'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:473:                                - 在庫一括編集 (4-4)         : 1件以上選択かつ権限のない店舗が含まれない場合のみ活性
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:477:                                {# (4-4) 在庫一括編集: admin_stock_bulk_approval_new へ直接 POST #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:794:        // 在庫一括編集: 権限なし店舗・複数店舗の場合はアラート
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_return_list_pdf_export_script.twig:39:                const printButton = popupWindow.document.getElementById('printButton');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_return_list_pdf_export_script.twig:40:                if (printButton) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_return_list_pdf_export_script.twig:41:                    printButton.addEventListener('click', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_return_list_pdf_export_script.twig:42:                        popupWindow.print();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_pick_list.twig:10:    <div class="printBox">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_pick_list.twig:11:        <button id="printButton" type="button" style="width: 120px; height: 26px; margin: 3px;">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_pick_list.twig:12:            {{ 'admin.common.print'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/pick_list.twig:10:    <div class="printBox">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/pick_list.twig:11:        <button id="printButton" type="button" style="width: 120px; height: 26px; margin: 3px;">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/pick_list.twig:12:            {{ 'admin.common.print'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:919:            // 欠品登録トグルボタン（在庫移動と同方式: クライアント側のみで状態管理、フォーム送信時に一括送信）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1342:                            const printButton = popupWindow.document.getElementById('printButton');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1343:                            if (printButton) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1344:                                printButton.addEventListener('click', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1345:                                    popupWindow.print();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/return_list.twig:10:    <div class="printBox">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/return_list.twig:11:        <button id="printButton" type="button" style="width: 120px; height: 26px; margin: 3px;">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/return_list.twig:12:            {{ 'admin.common.print'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:270:                            const printButton = popupWindow.document.getElementById('printButton');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:271:                            if (printButton) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:272:                                printButton.addEventListener('click', function () {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:273:                                    popupWindow.print();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/bulkapproval.twig:226:                    {# 在庫一括編集：グローバル1件（在庫変動区分・承認部門・承認通知先）+ 在庫ごと3項目 #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/detail.twig:570:        // 実在庫への商品追加: テーブルに行を動的追加 (確定ボタンで一括保存)
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:1314:	 (1313,657,1,false,'img/goods/card/RIX/jp/storm_fleet_sprinter.jpg',false,'2018-06-07 04:24:57+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:1315:	 (1314,657,2,false,'img/goods/card/RIX/en/storm_fleet_sprinter.jpg',false,'2018-06-07 04:24:57+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:70472:	 (85413,43070,1,false,'img/goods/card/RIX/jp/storm_fleet_sprinter.jpg',false,'2019-03-12 02:46:23+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:70473:	 (85414,43070,2,false,'img/goods/card/RIX/en/storm_fleet_sprinter.jpg',false,'2019-03-12 02:46:23+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:112869:	 (133027,66824,1,false,'img/goods/L/WAR/ja/samuts_sprint.jpg',false,'2019-04-19 03:35:04+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:112870:	 (133028,66824,2,false,'img/goods/L/WAR/en/samuts_sprint.jpg',false,'2019-04-19 03:35:04+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:113519:	 (133677,67149,1,false,'img/goods/L/WAR/ja/samuts_sprint.jpg',false,'2019-04-25 23:50:40+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:113520:	 (133678,67149,2,false,'img/goods/L/WAR/en/samuts_sprint.jpg',false,'2019-04-25 23:50:40+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:115042:	 (138604,69962,1,false,'img/goods/L/MH1/jn/viashino_sandsprinter.png',false,'2019-06-02 00:06:43+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:115043:	 (138605,69962,2,false,'img/goods/L/MH1/en/viashino_sandsprinter.png',false,'2019-06-02 00:06:43+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:115552:	 (139114,70217,1,false,'img/goods/L/MH1/jn/viashino_sandsprinter.png',false,'2019-06-02 22:56:06+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:115553:	 (139115,70217,2,false,'img/goods/L/MH1/en/viashino_sandsprinter.png',false,'2019-06-02 22:56:06+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:170083:	 (204575,105522,1,false,'img/goods/L/NEO/jp/papercraft_decoy_jp_8rkw64i1hq.jpg',false,'2022-02-06 04:57:02+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:170084:	 (204576,105522,2,false,'img/goods/L/NEO/en/papercraft_decoy_en_8rkw64i1hq.jpg',false,'2022-02-06 04:57:02+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:170687:	 (205179,105824,1,false,'img/goods/L/NEO/jp/papercraft_decoy_jp_8rkw64i1hq.jpg',false,'2022-02-06 04:57:10+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:170688:	 (205180,105824,2,false,'img/goods/L/NEO/en/papercraft_decoy_en_8rkw64i1hq.jpg',false,'2022-02-06 04:57:10+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:175103:	 (209752,108444,1,false,'img/goods/L/NCC/jp/hoofprints_of_the_stag_jp_wefuubezgo.jpg',false,'2022-04-23 00:47:00+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:175104:	 (209753,108444,2,false,'img/goods/L/NCC/en/hoofprints_of_the_stag_en_wefuubezgo.jpg',false,'2022-04-23 00:47:00+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:194739:	 (231572,121449,1,false,'img/goods/L/J22/jp/uktabi_orangutan_jp_6jmdspaper.jpg',false,'2022-11-25 02:14:30+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:194740:	 (231573,121449,2,false,'img/goods/L/J22/en/uktabi_orangutan_en_6jmdspaper.jpg',false,'2022-11-25 02:14:30+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:196890:	 (233724,122658,1,false,'img/goods/L/DMR/jp/urzas_blueprints_jp_09329226a2.jpg',false,'2022-12-09 03:21:31+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:196891:	 (233725,122658,2,false,'img/goods/L/DMR/en/urzas_blueprints_en_09329226a2.jpg',false,'2022-12-09 03:21:31+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:197217:	 (234051,122822,1,false,'img/goods/L/DMR/jp/urzas_blueprints_jp_3d7c1fc2b4.jpg',false,'2022-12-09 21:04:16+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:197218:	 (234052,122822,2,false,'img/goods/L/DMR/en/urzas_blueprints_en_3d7c1fc2b4.jpg',false,'2022-12-09 21:04:16+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:197805:	 (234639,123116,1,false,'img/goods/L/DMR/jp/urzas_blueprints_jp_09329226a2.jpg',false,'2022-12-09 21:10:17+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:197806:	 (234640,123116,2,false,'img/goods/L/DMR/en/urzas_blueprints_en_09329226a2.jpg',false,'2022-12-09 21:10:17+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:198131:	 (234965,123279,1,false,'img/goods/L/DMR/jp/urzas_blueprints_jp_3d7c1fc2b4.jpg',false,'2022-12-09 21:10:25+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:198132:	 (234966,123279,2,false,'img/goods/L/DMR/en/urzas_blueprints_en_3d7c1fc2b4.jpg',false,'2022-12-09 21:10:25+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:199744:	 (236697,124667,1,false,'img/goods/L/ONE/JP/magmatic_sprinter_jp_392c233365.jpg',false,'2023-01-28 02:29:56+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:199745:	 (236698,124667,2,false,'img/goods/L/ONE/EN/magmatic_sprinter_en_392c233365.jpg',false,'2023-01-28 02:29:56+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:200283:	 (237234,124938,1,false,'img/goods/L/ONE/JP/magmatic_sprinter_jp_392c233365.jpg',false,'2023-01-28 02:34:07+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:200284:	 (237235,124938,2,false,'img/goods/L/ONE/EN/magmatic_sprinter_en_392c233365.jpg',false,'2023-01-28 02:34:07+09'),

codex
JSON の2件はいずれも設計書内部の表記矛盾を差分として拾っている可能性が高いです。次に、候補が挙げた実装行と周辺のルート、リポジトリ、更新サービス、テンプレートを直接開いて、未掲載の差分がないか確認します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdateStackListAction.php | sed -n '1,120p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Service\Admin\Order;
    17	
    18	use Doctrine\ORM\EntityManagerInterface;
    19	use Eccube\Entity\Master\OrderStatus;
    20	use Eccube\Repository\Master\OrderStatusRepository;
    21	use Eccube\Repository\MemberRepository;
    22	use Eccube\Repository\OrderRepository;
    23	use Eccube\Service\Admin\Order\ActionInput\UpdateStackListInput;
    24	
    25	class UpdateStackListAction
    26	{
    27	    public function __construct(
    28	        private readonly EntityManagerInterface $entityManager,
    29	        private readonly OrderRepository $orderRepository,
    30	        private readonly OrderStatusRepository $orderStatusRepository,
    31	        private readonly MemberRepository $memberRepository,
    32	    ) {
    33	    }
    34	
    35	    // 受注更新パラメータに応じてブラウザ印刷フラグやステータスを更新
    36	    public function handle(UpdateStackListInput $input): void
    37	    {
    38	        $this->entityManager->beginTransaction();
    39	
    40	        try {
    41	            $Member = $this->memberRepository->find($input->MemberId);
    42	
    43	            foreach ($input->UpdateOrderList as $orderParams) {
    44	                $Order = $this->orderRepository->find($orderParams['order']['order_id']);
    45	                if ($Order === null) {
    46	                    continue;
    47	                }
    48	
    49	                $Order->setBrowserPrintFlg(true);
    50	
    51	                if ($orderParams['update_status_picking']) {
    52	                    $Order->setOrderStatus($this->orderStatusRepository->find(OrderStatus::PICKING));
    53	                    $Order->setConfirmDate(new \DateTime());
    54	                }
    55	                if ($Member) {
    56	                    $Order->setMember($Member);
    57	                }
    58	                $this->entityManager->persist($Order);
    59	            }
    60	            $this->entityManager->flush();
    61	            $this->entityManager->commit();
    62	        } catch (\Throwable $e) {
    63	            $this->entityManager->rollback();
    64	
    65	            throw $e;
    66	        }
    67	    }
    68	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php | sed -n '820,930p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   820	        $this->addSuccess('admin.common.save_complete', 'admin');
   821	
   822	        return $this->redirectToRoute('admin_shipping_standby');
   823	    }
   824	
   825	    /**
   826	     * スタック用紙印刷用のウィンドウを表示
   827	     *
   828	     * @param Request $request
   829	     *
   830	     * @return Response
   831	     */
   832	    #[Route(path: '/%eccube_admin_route%/order/print/stack/window', name: 'admin_order_print_stack_window', methods: ['POST'])]
   833	    #[Template(template: '@admin/Order/print_stack_window.twig')]
   834	    public function printStackWindow(Request $request): Response
   835	    {
   836	        $ids = $request->get('ids');
   837	
   838	        return $this->render('@admin/Order/print_stack_window.twig', [
   839	            'ids' => $ids,
   840	        ]);
   841	    }
   842	
   843	    /**
   844	     * スタック用紙印刷
   845	     *
   846	     * @param Request $request
   847	     *
   848	     * @return JsonResponse
   849	     */
   850	    #[Route(path: '/%eccube_admin_route%/order/print/stack', name: 'admin_order_print_stack', methods: ['POST'])]
   851	    public function printStackPaper(Request $request): JsonResponse
   852	    {
   853	        // CSRFトークンの検証
   854	        $token = $request->request->get('_token');
   855	        if (!$this->isCsrfTokenValid(Constant::TOKEN_NAME, $token)) {
   856	            $this->addError('admin.common.csrf_token_error', 'admin');
   857	
   858	            return $this->json(['message' => '不正なリクエストです。'], 400, [
   859	                'Content-Type' => 'application/json',
   860	            ]);
   861	        }
   862	
   863	        $shippingIds = $request->get('ids');
   864	
   865	        if (empty($shippingIds)) {
   866	            return $this->json(['message' => '対象の注文が指定されていません。'], 404, [
   867	                'Content-Type' => 'application/json',
   868	            ]);
   869	        }
   870	        if (!\is_array($shippingIds)) {
   871	            $shippingIds = [$shippingIds];
   872	        }
   873	
   874	        $memberId = $this->getMember()->getId();
   875	
   876	        $options = $this->optionRepository->findListArray([
   877	            MtbOption::STACK_PAPER_JUDGMENT_PRICE,
   878	            MtbOption::STACK_PAPER_THRESHOLD_PRICE,
   879	        ]);
   880	
   881	        $optionValues = array_column($options, 'option_value', 'option_key');
   882	        $OrderList = $this->orderRepository->getPrintOrderList($shippingIds, $optionValues);
   883	
   884	        $UpdateOrderList = [];
   885	        foreach ($OrderList as $Order) {
   886	            // 未採番の注文がある場合はエラーを返すようにする
   887	            if (empty($Order['order_number'])) {
   888	                return $this->json(['message' => '注文番号が未採番の注文があります。'], 400, [
   889	                    'Content-Type' => 'application/json',
   890	                ]);
   891	            }
   892	            $params = [
   893	                'order' => $Order,
   894	                'browser_print_flg' => true,
   895	                'update_status_picking' => false,
   896	            ];
   897	            // 「注文受領」状態の受注のみ、ステータスを「ピック中」に更新するフラグを立てる
   898	            if ($Order['status'] === OrderStatus::NEW) {
   899	                $params['update_status_picking'] = true;
   900	            }
   901	            $UpdateOrderList[] = $params;
   902	        }
   903	
   904	        if (count($UpdateOrderList)) {
   905	            try {
   906	                $this->updateStackListAction->handle(new UpdateStackListInput(
   907	                    UpdateOrderList: $UpdateOrderList,
   908	                    MemberId: $memberId,
   909	                ));
   910	            } catch (\InvalidArgumentException $e) {
   911	                $this->addError($e->getMessage(), 'admin');
   912	
   913	                return $this->json(['message' => $e->getMessage()], 400, [
   914	                    'Content-Type' => 'application/json',
   915	                ]);
   916	            }
   917	        }
   918	
   919	        return $this->json(['message' => '印刷予約を受け付けました。'], 200, [
   920	            'Content-Type' => 'application/json',
   921	        ]);
   922	    }
   923	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/print_stack_window.twig | sed -n '1,160p'" in /home/y-saito/Developments/hareruya-design-docs
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
    11	
    12	{% block title %}{% endblock %}
    13	{% block sub_title %}{% endblock %}
    14	
    15	{% block stylesheet %}
    16	{% endblock stylesheet %}
    17	
    18	{% block javascript %}
    19	    <script src="{{ asset('admin.bundle.js', 'bundle') }}"></script>
    20	    <script nonce="{{ csp_nonce }}">
    21	        $(function () {
    22	        var options = {
    23	            dataType: 'JSON',
    24	            timeout: 5000,
    25	            type: 'POST',
    26	            data: { 
    27	                ids: {{ ids|json_encode|raw }} ,
    28	                {{ constant('Eccube\\Common\\Constant::TOKEN_NAME') }}: '{{ csrf_token(constant('Eccube\\Common\\Constant::TOKEN_NAME')) }}'
    29	            },
    30	            url: '{{ url("admin_order_print_stack") }}'
    31	        };
    32	
    33	        $.ajax(options)
    34	        .done(function (data, status, jqXHR) {
    35	            if (data.message !== undefined) {
    36	                alert(data.message);
    37	            }
    38	            window.close();
    39	        })
    40	        .fail(function (jqXHR, status, error) {
    41	            if (jqXHR.responseJSON !== undefined) {
    42	                alert(jqXHR.responseJSON.message);
    43	            } else {
    44	                alert('システムエラーが発生いたしました。\nサイト管理者へお問い合わせください。');
    45	            }
    46	            window.close();
    47	        });
    48	    });
    49	
    50	    function getParam(name) {
    51	        var url = window.location.href;
    52	        name = name.replace(/[\[\]]/g, "\\$&");
    53	        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    54	            results = regex.exec(url);
    55	        if (!results) {
    56	            return null;
    57	        }
    58	        if (!results[2]){
    59	            return '';
    60	        }
    61	        return decodeURIComponent(results[2].replace(/\+/g, " "));
    62	    }
    63	    </script>
    64	{% endblock javascript %}
    65	
    66	{% block main %}
    67	    <body>
    68	        <h2>スタック用紙印刷中</h2>
    69	    </body>
    70	{% endblock %}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php | sed -n '1280,1375p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
  1280	     * @return list<array<string, mixed>>
  1281	     */
  1282	    public function getPrintOrderList(array $shippingIds, array $optionValues): array
  1283	    {
  1284	        if ($optionValues['stack_paper_judgment_price'] === (string) MtbOption::SALE) {
  1285	            $from = <<<'EOF'
  1286	, (
  1287	        SELECT
  1288	            oi.order_id
  1289	        , MAX(price) AS price
  1290	        FROM
  1291	            dtb_order_item oi
  1292	            INNER JOIN
  1293	                dtb_shipping s
  1294	                ON oi.order_id = s.order_id
  1295	        WHERE
  1296	            s.id IN (:shippingIds)
  1297	        GROUP BY
  1298	            oi.order_id
  1299	    ) AS op
  1300	EOF;
  1301	        } else {
  1302	            $from = <<<'EOF'
  1303	, (
  1304	        SELECT
  1305	            oi.order_id
  1306	        , MAX(pc.buy_price) AS price
  1307	        FROM
  1308	            dtb_order_item oi
  1309	            INNER JOIN dtb_product_class AS pc
  1310	                ON oi.product_class_id = pc.product_class_id
  1311	            INNER JOIN
  1312	                dtb_shipping s
  1313	                ON oi.order_id = s.order_id
  1314	        WHERE
  1315	            s.id IN (:shippingIds)
  1316	        GROUP BY
  1317	            oi.order_id
  1318	    ) AS op
  1319	EOF;
  1320	        }
  1321	
  1322	        $query = <<<EOS
  1323	        SELECT
  1324	            o.id AS order_id
  1325	            , o.order_date
  1326	            , o.order_number
  1327	            , TRIM(CONCAT(COALESCE(o.kana01, ''), ' ', COALESCE(o.kana02, ''))) AS name_kana
  1328	            , TRIM(CONCAT(COALESCE(o.name01, ''), ' ', COALESCE(o.name02, ''))) AS name
  1329	            , o.payment_total
  1330	            , o.order_status_id AS status
  1331	        , CASE
  1332	                WHEN op.price >= :stackPaperThresholdPrice THEN '□'
  1333	                ELSE '□'
  1334	            END AS expensive
  1335	            , o.smaregi_code
  1336	            , (o.message IS NOT NULL AND o.message <> '') AS hasMessage
  1337	        FROM
  1338	            dtb_order AS o
  1339	        {$from}
  1340	        WHERE
  1341	            o.id = op.order_id
  1342	        ORDER BY
  1343	            o.id
  1344	        EOS;
  1345	
  1346	        $rsm = new ResultSetMapping();
  1347	        $rsm->addScalarResult('order_id', 'order_id', Types::INTEGER)
  1348	            ->addScalarResult('order_date', 'order_date')
  1349	            ->addScalarResult('order_number', 'order_number')
  1350	            ->addScalarResult('name_kana', 'name_kana')
  1351	            ->addScalarResult('name', 'name')
  1352	            ->addScalarResult('payment_total', 'payment_total')
  1353	            ->addScalarResult('status', 'status', Types::INTEGER)
  1354	            ->addScalarResult('expensive', 'expensive')
  1355	            ->addScalarResult('smaregi_code', 'smaregi_code')
  1356	            ->addScalarResult('hasMessage', 'hasMessage');
  1357	
  1358	        return $this->getEntityManager()
  1359	            ->createNativeQuery($query, $rsm)
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

exec
/bin/bash -lc 'rg -n "printStack|btn-print-stack|print/stack|admin_order_print_stack|チェックボックスが選択されていません|newwin" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
42:    .btn-print-stack {
46:    .btn-print-stack:hover,
47:    .btn-print-stack:focus,
48:    .btn-print-stack:active {
87:                alert("チェックボックスが選択されていません");
153:                window.open('', 'newwin', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=700, height=700');
155:                $('#form_bulk').attr('target', 'newwin');
162:                window.open(this.href, 'newwin', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=700, height=700');
172:                window.open('', 'newwin', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=700, height=700');
174:                $('#form_bulk').attr('target', 'newwin');
185:                window.open('', 'newwin', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=700, height=700');
187:                $('#form_bulk').attr('target', 'newwin');
231:            $('#printStack').click(function (event) {
236:                window.open('', 'newwin', 'toolbar=no, width=450, height=400');
237:                $('#form_bulk').attr('action', "{{ url('admin_order_print_stack_window') }}");
238:                $('#form_bulk').attr('target', 'newwin');
1207:                                        <button type="button" id="printStack" class="btn btn-ec-conversion px-5 btn-print-stack">

exec
/bin/bash -lc 'rg -n "STACK_PAPER|SALE|PICKING|const PICKING|const NEW|注文受領|ピック" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOption.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/OrderStatus.php' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/OrderStatus.php:30:        /** 注文受領. */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/OrderStatus.php:31:        public const NEW = 1;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/OrderStatus.php:48:        /** ピック中 */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/OrderStatus.php:49:        public const PICKING = 10;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/OrderStatus.php:52:        /** ピック完了 */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOption.php:107:    public const STACK_PAPER_JUDGMENT_PRICE = 'stack_paper_judgment_price';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOption.php:109:    public const SALE = 0;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOption.php:112:    public const STACK_PAPER_JUDGMENT_PRICE_VALUES = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOption.php:113:        self::SALE => '販売価格',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOption.php:117:    public const STACK_PAPER_JUDGMENT_PRICE_DEFAULT = self::SALE;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOption.php:119:    public const STACK_PAPER_THRESHOLD_PRICE = 'stack_paper_threshold_price';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOption.php:121:    public const STACK_PAPER_THRESHOLD_PRICE_DEFAULT = 5000;

exec
/bin/bash -lc 'rg -n "order_number|browser_print_flg|confirm_date|member_id" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php /home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations /home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/doctrine.yaml 2>/dev/null' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:47:     * @method Order setOrderNumber(?string $order_number)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:104:     * @method Order setBrowserPrintFlg(bool $browser_print_flg)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:647:        #[ORM\Column(name: 'order_number', type: Types::STRING, length: 11, nullable: true, options: ['unsigned' => true, 'comment' => '注文番号'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:648:        private ?string $order_number = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:666:        #[ORM\Column(name: 'confirm_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '注文確定日'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:735:        #[ORM\Column(name: 'browser_print_flg', type: Types::BOOLEAN, options: ['default' => false, 'comment' => 'ブラウザ印刷フラグ'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:736:        private bool $browser_print_flg = false;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:790:         * 統合グループに含まれる全受注の order_number を id 昇順で格納。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1770:            return $this->order_number;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1773:        public function setOrderNumber(?string $order_number): Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1775:            $this->order_number = $order_number;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2111:            return $this->browser_print_flg;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2114:        public function setBrowserPrintFlg(bool $browser_print_flg): Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2116:            $this->browser_print_flg = $browser_print_flg;
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:44:            $this->addSql('INSERT INTO mtb_option (id, option_key, option_value, member_id, update_date) VALUES (?, ?, ?, ?, ?)', [$record['id'], $record['option_key'], $record['option_value'], $record['member_id'], $record['update_date']]);
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:67:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:74:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:81:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:88:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:95:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:102:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:109:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:116:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:123:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:130:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:137:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:144:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:151:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:158:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:165:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:172:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:179:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:186:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:193:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:200:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:207:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:214:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:221:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:228:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:235:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:242:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:249:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:256:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:263:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:270:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:277:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:284:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251128120606.php:44:            $this->addSql('INSERT INTO dtb_customer_group (id, name, point_percentage, shop_front_flg, update_date, create_date, member_id, branch_shop_front_flg) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [$record['id'], $record['name'], $record['point_percentage'], $record['shop_front_flg'], $record['update_date'], $record['create_date'], $record['member_id'], $record['branch_shop_front_flg']]);
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251128120606.php:70:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251128120606.php:80:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251128120606.php:90:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251128120606.php:100:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251128120606.php:110:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251128120606.php:120:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251128120606.php:130:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260402105452.php:33:            'INSERT INTO mtb_option (id, option_key, option_value, member_id, update_date)'
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260513140000.php:25:        return 'order_no参照をorder_number参照に修正';
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260513140000.php:31:        $this->addSql("UPDATE dtb_csv SET field_name = 'order_number', reference_field_name = NULL WHERE csv_type_id = 3 AND disp_name = '注文番号';");
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260513140000.php:33:        $this->addSql("UPDATE dtb_csv SET field_name = 'order_number', reference_field_name = NULL WHERE csv_type_id = 4 AND disp_name = '注文番号';");
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251209091013.php:39:                'INSERT INTO mtb_option (id, option_key, option_value, member_id, update_date) VALUES (?, ?, ?, ?, ?)',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20210412073123.php:61:                    'INSERT INTO dtb_login_history (user_name, client_ip, create_date, update_date, login_history_status_id, member_id) VALUES (?, ?, ?, ?, ?, ?)',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20210412073123.php:68:                        $row['member_id'],
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000009.php:35:                'INSERT INTO dtb_customer_group (id, name, point_percentage, shop_front_flg, branch_shop_front_flg, create_date, update_date, member_id)
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000009.php:44:                    member_id = EXCLUDED.member_id',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000009.php:53:                    $record['member_id'],
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000009.php:80:            ['id' => 1, 'name' => '通常会員', 'point_percentage' => 1, 'shop_front_flg' => '0', 'branch_shop_front_flg' => '0', 'create_date' => '2019-03-21 20:00:37+00', 'update_date' => '2025-07-15 09:00:01+00', 'member_id' => null],
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000009.php:81:            ['id' => 2, 'name' => 'SCG取引用', 'point_percentage' => 5, 'shop_front_flg' => '0', 'branch_shop_front_flg' => '0', 'create_date' => '2019-03-21 20:00:37+00', 'update_date' => '2019-03-22 05:01:33+00', 'member_id' => null],
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000009.php:82:            ['id' => 3, 'name' => '店内アカウント', 'point_percentage' => 0, 'shop_front_flg' => '1', 'branch_shop_front_flg' => '0', 'create_date' => '2019-03-21 20:00:37+00', 'update_date' => '2019-06-26 17:56:17+00', 'member_id' => null],
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000009.php:83:            ['id' => 4, 'name' => 'Sekappy用', 'point_percentage' => 0, 'shop_front_flg' => '0', 'branch_shop_front_flg' => '0', 'create_date' => '2019-03-21 20:00:37+00', 'update_date' => '2019-03-22 04:55:23+00', 'member_id' => null],
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000009.php:84:            ['id' => 5, 'name' => '支店用店内アカウント', 'point_percentage' => 0, 'shop_front_flg' => '0', 'branch_shop_front_flg' => '1', 'create_date' => '2022-06-09 01:00:51+00', 'update_date' => '2022-06-29 22:39:26+00', 'member_id' => null],
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000009.php:85:            ['id' => 6, 'name' => '海外代理販売用', 'point_percentage' => 0, 'shop_front_flg' => '0', 'branch_shop_front_flg' => '0', 'create_date' => '2022-11-28 20:39:03+00', 'update_date' => '2023-05-23 04:36:09+00', 'member_id' => null],
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000009.php:86:            ['id' => 9, 'name' => '集換社アカウント', 'point_percentage' => 0, 'shop_front_flg' => '0', 'branch_shop_front_flg' => '0', 'create_date' => '2025-10-27 20:39:04+00', 'update_date' => '2025-10-27 21:22:15+00', 'member_id' => null],
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20240930235959_04.php:625:            USING (id = current_setting('custom.eccube.member_id')::integer)
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20240930235959_04.php:626:            WITH CHECK (id = current_setting('custom.eccube.member_id')::integer);");
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20240930235959_04.php:639:            USING (id = current_setting('custom.eccube.member_id')::integer AND base_info_id = current_setting('custom.eccube.base_info_id')::integer)
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20240930235959_04.php:640:            WITH CHECK (id = current_setting('custom.eccube.member_id')::integer AND base_info_id = current_setting('custom.eccube.base_info_id')::integer);"
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20240930235959_04.php:1219:            USING (member_id = current_setting('custom.eccube.member_id')::integer)
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20240930235959_04.php:1220:            WITH CHECK (member_id = current_setting('custom.eccube.member_id')::integer);");
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:44:            $this->addSql('INSERT INTO mtb_sell_group (id, name, memo, update_date, create_date, member_id, deleted_at, name_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [$record['id'], $record['name'], $record['memo'], $record['update_date'], $record['create_date'], $record['member_id'], $record['deleted_at'], $record['name_en']]);
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:69:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:79:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:89:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:99:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:109:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:119:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:129:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:139:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:149:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:159:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:169:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:179:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:189:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:199:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:209:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:219:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:229:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:239:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:249:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:259:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:269:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:279:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:289:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:299:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:309:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125164811.php:319:                'member_id' => null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260127004039.php:34:            INSERT INTO mtb_option (id, option_key, option_value, member_id, update_date) VALUES (
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260305143115.php:36:            "INSERT INTO mtb_option (id, option_key, option_value, member_id, update_date)\n"
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_price_history.sql:1:INSERT INTO public.dtb_price_history (id,product_class_id,member_id,sell_price,buy_price,create_date,old_sell_price,old_buy_price,standard_price,old_standard_price) VALUES
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_price_history.sql:6977:    member_id,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_price_history.sql:6987:    EXCLUDED.member_id,

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig | sed -n '220,245p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   220	                    var response = JSON.parse(jqXHR.responseText);
   221	                    var messages = '';
   222	                    for (var i = 0; i < response.messages.length; i++) {
   223	                        messages += response.messages[i] + "\n";
   224	                    }
   225	                    alert(messages);
   226	                    return false;
   227	                });
   228	            };
   229	
   230	            // スタック用紙印刷
   231	            $('#printStack').click(function (event) {
   232	                if (preventIfNoCheckedBulkTarget()) {
   233	                    event.preventDefault();
   234	                    return false;
   235	                }
   236	                window.open('', 'newwin', 'toolbar=no, width=450, height=400');
   237	                $('#form_bulk').attr('action', "{{ url('admin_order_print_stack_window') }}");
   238	                $('#form_bulk').attr('target', 'newwin');
   239	                $('#form_bulk').submit();
   240	                return false;
   241	            });
   242	
   243	            $('button.update_tracking_number').prop('disabled', true);
   244	            // フォームに変更があったら更新ボタンを有効にする
   245	            $('input.update_tracking_number').on('keyup', function(event) {

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig | sed -n '1195,1215p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
  1195	                                            <div id="dropmenu" class="dropdown-menu">
  1196	                                                <a class="dropdown-item" href="{{ url('admin_order_manual_mail_all') }}" id="manualMailAll">
  1197	                                                    {{ 'admin.order.mail_bulk'|trans }}
  1198	                                                </a>
  1199	                                            </div>
  1200	                                        </div>
  1201	                                    </div>
  1202	                                </div>
  1203	                            </div>
  1204	                            <div class="col-12">
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

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig | sed -n '35,100p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
    35	        border-radius: 50%;
    36	        background-color: red;
    37	        color: white;
    38	        text-align: center;
    39	        line-height: 1.2em;
    40	        margin-right: 0.2em;
    41	    }
    42	    .btn-print-stack {
    43	        background-color: var(--bs-orange);
    44	        border-color: transparent;
    45	    }
    46	    .btn-print-stack:hover,
    47	    .btn-print-stack:focus,
    48	    .btn-print-stack:active {
    49	        background-color: #e76f00;
    50	        border-color: transparent;
    51	    }
    52	    /* 1行に1項目だけある検索入力は中央に配置する */
    53	    #search_form .row > .col-6:only-child {
    54	        margin-right: auto;
    55	        margin-left: auto;
    56	    }
    57	    /* 入力欄サイズは維持し、詳細検索ボタンだけ右隣に表示 */
    58	    #search_form .search-field-with-toggle {
    59	        position: relative;
    60	    }
    61	    #search_form .search-field-with-toggle .search-field-main {
    62	        width: 100%;
    63	    }
    64	    #search_form .search-field-with-toggle .search-detail-toggle {
    65	        position: absolute;
    66	        left: calc(100%);
    67	        top: 50%;
    68	        transform: translateY(-50%);
    69	        white-space: nowrap;
    70	        margin-bottom: 0 !important;
    71	    }
    72	</style>
    73	{% endblock stylesheet %}
    74	
    75	{% form_theme searchForm '@admin/Form/bootstrap_4_layout.html.twig' %}
    76	{% block javascript %}
    77	    <script src="{{ asset('assets/js/select2.min.js', 'admin') }}"></script>
    78	    <script nonce="{{ csp_nonce }}">
    79	        $(function() {
    80	            const hasCheckedBulkTarget = function() {
    81	                return $('input[id^="check_"]:checked').length > 0;
    82	            };
    83	            const preventIfNoCheckedBulkTarget = function() {
    84	                if (hasCheckedBulkTarget()) {
    85	                    return false;
    86	                }
    87	                alert("チェックボックスが選択されていません");
    88	                return true;
    89	            };
    90	
    91	            const select2Ids = [
    92	                '#admin_search_order_tenants'
    93	            ];
    94	            const select2Selector = $(select2Ids.join(','));
    95	            select2Selector.select2({width:'100%'});
    96	
    97	            toggleBtnBulk('input[id^="check_"]', '.btn-bulk-wrapper');
    98	            $('input[id^="check_"]').on('change', function() {
    99	                $('#toggle_check_all').prop('checked', false);
   100	                toggleBtnBulk('input[id^="check_"]', '.btn-bulk-wrapper');

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOption.php | sed -n '100,125p' && nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/OrderStatus.php | sed -n '25,55p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   100	    public const SLIDER_EN_ONLY_TAG_ID = 'slider_en_only_tag_id';
   101	
   102	    public const AUTO_LOGOUT_TIME = 'auto_logout_time';
   103	    public const AUTO_LOGOUT_TIME_DEFAULT = 10;
   104	
   105	    public const UNISEARCH_SFTP_HOST = 'unisearch_sftp_host';
   106	
   107	    public const STACK_PAPER_JUDGMENT_PRICE = 'stack_paper_judgment_price';
   108	
   109	    public const SALE = 0;
   110	    public const BUY = 1;
   111	
   112	    public const STACK_PAPER_JUDGMENT_PRICE_VALUES = [
   113	        self::SALE => '販売価格',
   114	        self::BUY => '買取価格',
   115	    ];
   116	
   117	    public const STACK_PAPER_JUDGMENT_PRICE_DEFAULT = self::SALE;
   118	
   119	    public const STACK_PAPER_THRESHOLD_PRICE = 'stack_paper_threshold_price';
   120	
   121	    public const STACK_PAPER_THRESHOLD_PRICE_DEFAULT = 5000;
   122	
   123	    #[ORM\Column(name: 'id', type: Types::INTEGER, options: ['unsigned' => true, 'comment' => 'オプションID'])]
   124	    #[ORM\Id]
   125	    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    25	    #[ORM\HasLifecycleCallbacks]
    26	    #[ORM\Entity(repositoryClass: OrderStatusRepository::class)]
    27	    #[ORM\Cache(usage: 'NONSTRICT_READ_WRITE')]
    28	    class OrderStatus extends AbstractMasterEntity
    29	    {
    30	        /** 注文受領. */
    31	        public const NEW = 1;
    32	        /** TODO: 入金待ち = CUBE4では本来不要 */
    33	        public const PAY_WAIT = 2;
    34	        /** 注文取消し. */
    35	        public const CANCEL = 3;
    36	        /** 対応中. */
    37	        public const IN_PROGRESS = 4;
    38	        /** 出荷完了. */
    39	        public const DELIVERED = 5;
    40	        /** 入金済み. */
    41	        public const PAID = 6;
    42	        /** 決済処理中. */
    43	        public const PENDING = 7;
    44	        /** 購入処理中. */
    45	        public const PROCESSING = 8;
    46	        /** 出荷指示 */
    47	        public const PRE_DELIV = 9;
    48	        /** ピック中 */
    49	        public const PICKING = 10;
    50	        /** 店頭予約 */
    51	        public const OTC_RSV = 12;
    52	        /** ピック完了 */
    53	        public const PICKED = 13;
    54	        /** 引渡し済み */
    55	        public const PASSED = 14;

codex
主要フローはおおむね設計どおりです。ただし、候補JSONは「設計内の自己矛盾/列名表記ゆれ」を実装差分として扱っており、実装欠陥としては弱い扱いにすべき箇所があります。もう少しだけ、入力 checkbox の値や翻訳文言など入口周りも確認します。
exec
/bin/bash -lc "rg -n \"name=\\\"ids|name='ids|check_|Order.Shippings|shipping.id|Shipping.id|value=.*shipping\" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
81:                return $('input[id^="check_"]:checked').length > 0;
97:            toggleBtnBulk('input[id^="check_"]', '.btn-bulk-wrapper');
98:            $('input[id^="check_"]').on('change', function() {
99:                $('#toggle_check_all').prop('checked', false);
100:                toggleBtnBulk('input[id^="check_"]', '.btn-bulk-wrapper');
112:            $('#toggle_check_all').on('change', function() {
115:                    $('input[id^="check_"]').prop('checked', true);
117:                    $('input[id^="check_"]').prop('checked', false);
119:                toggleBtnBulk('input[id^="check_"]', '.btn-bulk-wrapper');
124:                $('input[id^="check_"]:checked').each(function() {
269:                    updateTrackingNumber($tracking_number.data('shipping_id'), $tracking_number.data('url'), $tracking_number.val(), callback);
285:        updateTrackingNumber($target.data('shipping_id'), $target.data('url'), tracking_number, callback);
1231:                                            <input type="checkbox" id="toggle_check_all" name="filter" value="open">
1246:                                        {% for Shipping in Order.Shippings %}
1249:                                                    <input type="checkbox" id="check_{{ Shipping.id }}" data-id="{{ Shipping.id }}" data-order-id="{{ Order.id }}" name="ids[]" value="{{ Shipping.id }}"
1250:                                                           data-preview-notify-mail-url="{{ url('admin_shipping_preview_notify_mail', { id: Shipping.id}) }}"
1251:                                                           data-notify-mail-url="{{ url('admin_shipping_notify_mail', { id: Shipping.id}) }}"
1252:                                                           data-update-status-url="{{ url('admin_shipping_update_order_status', { id: Shipping.id}) }}"
1299:                                                               data-preview-notify-mail-url="{{ url('admin_shipping_preview_notify_mail', { id: Shipping.id}) }}"
1300:                                                               data-notify-mail-url="{{ url('admin_shipping_notify_mail', { id: Shipping.id}) }}"
1306:                                                            <a class="btn btn-ec-actionIcon pdf-print" href="{{ url('admin_order_export_pdf') }}?ids[]={{ Shipping.id }}" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'admin.order.output_delivery_note_short'|trans }}">
1312:                                                               data-id="{{ Shipping.id }}" data-type="status" data-bulk-update="false"
1314:                                                               data-update-status-url="{{ url('admin_shipping_update_order_status', { id: Shipping.id}) }}"
1315:                                                               data-preview-notify-mail-url="{{ url('admin_shipping_preview_notify_mail', { id: Shipping.id}) }}"

exec
/bin/bash -lc 'rg -n "print_stack_paper|印刷予約を受け付けました|注文番号が未採番|対象の注文が指定|システムエラーが発生|不正なリクエスト" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /home/y-saito/Developments/ec-cube-enterprise/app 2>/dev/null' in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc 'rg -n "function findListArray|findListArray" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository /home/y-saito/Developments/ec-cube-enterprise/src/Eccube' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 127ms:
 succeeded in 107ms:
codex
入口の checkbox は `ids[]` に配送IDを入れており、テンプレート文言も設計と一致しています。残る論点は、候補2件を差分として採用する際の根拠の強さと分類です。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig | sed -n '1238,1255p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbOptionRepository.php | sed -n '1,80p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Repository\Master;
    17	
    18	use Doctrine\ORM\Query;
    19	use Doctrine\Persistence\ManagerRegistry;
    20	use Eccube\Entity\Master\MtbOption;
    21	use Eccube\Repository\AbstractRepository;
    22	
    23	/**
    24	 * @extends AbstractRepository<MtbOption>
    25	 */
    26	class MtbOptionRepository extends AbstractRepository
    27	{
    28	    public function __construct(ManagerRegistry $registry)
    29	    {
    30	        parent::__construct($registry, MtbOption::class);
    31	    }
    32	
    33	    public function get(int $id = 1): ?MtbOption
    34	    {
    35	        return $this->find($id);
    36	    }
    37	
    38	    /**
    39	     * 指定されたオプションキーの値を配列で返す
    40	     *
    41	     * @param array<int, string> $optionKeys
    42	     */
    43	    public function findListArray(array $optionKeys): mixed
    44	    {
    45	        $qb = $this->createQueryBuilder('r');
    46	
    47	        return $qb->where($qb->expr()->in('r.option_key', ':optionKeys'))
    48	            ->setParameter('optionKeys', $optionKeys)
    49	            ->getQuery()
    50	            ->getResult(Query::HYDRATE_ARRAY);
    51	    }
    52	}

 succeeded in 0ms:
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

exec
/bin/bash -lc "nl -ba function_spec_html_preview/pf-eccube3/m05-08_admin_order_order_stack_paper_print.html | sed -n '217,305p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   217	      <h2 id="概要">概要</h2>
   218	<p>管理画面の「受注管理」一覧から選択した配送行に対し、別ウィンドウを開いたうえで非同期処理を走らせ、スタック用紙向けに必要な印刷予約フラグおよび条件に応じた受注ステータス・確定日を更新する機能である。呼び出し成功時にはJSONで確認メッセージを返し、アラート表示後に子ウィンドウを閉じる。</p>
   219	<p>本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値とするソースは <code>src/Eccube/Controller/Admin/Order/OrderController.php</code> の該当ルート、<code>src/Eccube/Resource/template/admin/Order/index.twig</code>、<code>src/Eccube/Resource/template/admin/Order/print_stack_window.twig</code>、<code>src/Eccube/Repository/OrderRepository.php</code> の印字リスト取得処理、<code>src/Eccube/Service/Admin/Order/UpdateStackListAction.php</code>、<code>src/Eccube/Entity/Master/MtbOption.php</code> とする。</p>
   220	<p>対象はブラウザ経由の管理画面に限定する。店舗別の基本情報画面上の「スタック用紙高額商品しきい値価格」（<code>dtb_base_info.stack_paper_threshold</code>）の入力・同期は別画面の設計とし、一覧からのスタック用紙印字クエリそのものでは参照しない点に注意する。</p>
   221	<p>本機能のカスタマイズ区分は現行踏襲である。現行挙動は pf-eccube3 のHareruyaEcプラグイン実装を参照し、リニューアル移行後の挙動とDBは ec-cube-enterprise を確認値とする。DB関連の記述は ec-cube-enterprise を正とする。</p>
   222	<p>コントローラの公開関数一覧は本文の主題としない。本文ではルートbind名やSymfonyのルートnameの網羅は主説明としない。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。コード探索でbind名が必要なときだけ「調査補助」へ書く。</p>
   223	<hr>
   224	<h2 id="リニューアル移行時の扱い">リニューアル移行時の扱い</h2>
   225	<p>スタック用紙印刷は現行 pf-eccube3 では HareruyaEc プラグインで実装する。ブラウザ印刷フラグ・確定日時・担当者は、現行では補助テーブル <code>dtb_order_sub</code> に分割保持するが、移行先 ec-cube-enterprise では <code>dtb_order</code> に統合される。DB関連は ec-cube-enterprise を正とし、本書のテーブル・列名は移行先名で記す。</p>
   226	<div class="table-wrap"><table><thead><tr><th>項目</th><th>現行 pf-eccube3（HareruyaEc）</th><th>移行先 ec-cube-enterprise</th></tr></thead><tbody><tr><td>ブラウザ印刷フラグ</td><td><code>dtb_order_sub.browser_print_flg</code></td><td><code>dtb_order.browser_print_flg</code></td></tr><tr><td>確定日時</td><td><code>dtb_order_sub.confirm_date</code></td><td><code>dtb_order.confirm_date</code></td></tr><tr><td>担当者会員</td><td><code>dtb_order_sub.operator_id</code></td><td><code>dtb_order.member_id</code></td></tr><tr><td>受注ステータス</td><td><code>dtb_order.order_status_id</code></td><td><code>dtb_order.order_status_id</code>（同一）</td></tr><tr><td>高額判定・閾値オプション</td><td><code>mtb_option</code>（<code>option_key</code>/<code>option_value</code>）</td><td><code>mtb_option</code>（同一。<code>stack_paper_judgment_price</code>, <code>stack_paper_threshold_price</code>）</td></tr><tr><td>店舗別しきい値</td><td>ec-cube-enterprise 実装で要確認</td><td><code>dtb_base_info.stack_paper_threshold</code></td></tr></tbody></table></div>
   227	<p>本書のDBカラム節・副作用節のDB更新記述は移行先 ec-cube-enterprise の名称に合わせている。現行の補助テーブル列は上表で対応づける。</p>
   228	<hr>
   229	<h2 id="利用者視点の入口">利用者視点の入口</h2>
   230	<div class="table-wrap"><table><thead><tr><th>入口</th><th>URLエンドポイント</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>受注一覧で配送行のチェックを付けて「スタック用紙印刷」を押す</td><td><code>POST /{admin_route}/order/print/stack/window</code>（同一画面の一括フォームから子ウィンドウ向けに送信）</td><td>未選択ならアラート「チェックボックスが選択されていません」で中断。選択済みなら幅450高さ400の別ウィンドウを開き、フォームをPOSTする。子画面は「スタック用紙印刷中」と見出しのみの本文を表示し、読み込み完了後にJSON用エンドポイントへAJAX POSTする</td></tr><tr><td>子ウィンドウ内の自動AJAX</td><td><code>POST /{admin_route}/order/print/stack</code></td><td>成功時はアラートで「印刷予約を受け付けました。」を表示し、ウィンドウを閉じる。失敗時はレスポンス本文の <code>message</code> をアラートし、本文が取れなければ固定のシステムエラー文を表示して閉じる</td></tr></tbody></table></div>
   231	<hr>
   232	<h2 id="フロント挙動">フロント挙動</h2>
   233	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>表示要素</td><td>一覧下部の「スタック用紙印刷」ボタン（識別子 <code>printStack</code>）。子ウィンドウは見出し「スタック用紙印刷中」のみ</td></tr><tr><td>JS挙動</td><td>一覧側で <code>#form_bulk</code> の <code>action</code> をウィンドウ用ルートに差し替え、<code>target</code> を <code>newwin</code> にしてPOSTする。子ウィンドウはjQueryの <code>$.ajax</code> でタイムアウト5秒、データ型JSON、POST。成功・失敗のどちらでも <code>alert</code> のあと <code>window.close()</code> する</td></tr><tr><td>CSS・レイアウト</td><td>一覧先頭のインラインスタイルで <code>.btn-print-stack</code> の配色を定義する</td></tr><tr><td>モーダル・ポップアップ</td><td>別ウィンドウを用いる。Bootstrapモーダルは本導線では使わない</td></tr></tbody></table></div>
   234	<hr>
   235	<h2 id="処理フロー">処理フロー</h2>
   236	<h3 id="子ウィンドウを開いてHTMLを表示する-admin-order-print-stack-window">子ウィンドウを開いてHTMLを表示する（<code>admin_order_print_stack_window</code>）</h3>
   237	<ol><li>管理画面の認証・共通制約を通過する。</li><li>リクエストパラメータ <code>ids</code> をそのままテンプレート変数に渡す（配列でも単一値でもテンプレート側でJSON化する）。</li><li><code>print_stack_window.twig</code> を返す。ルート処理内に <code>_token</code> の検証コードは無い。</li></ol>
   238	<h3 id="印刷予約を記録する-admin-order-print-stack">印刷予約を記録する（<code>admin_order_print_stack</code>）</h3>
   239	<ol><li>管理画面の認証・共通制約を通過する。</li><li>リクエストボディの <code>_token</code> について共通の検証関数で照合し、失敗時は管理向けエラーメッセージを積み、HTTP400でJSON「不正なリクエストです。」を返す。</li><li><code>ids</code> が空ならHTTP404でJSON「対象の注文が指定されていません。」を返す。配列でなければ長さ1の配列に包む。</li><li><code>mtb_option</code> から <code>stack_paper_judgment_price</code> と <code>stack_paper_threshold_price</code> を取得し、連想配列にする。</li><li><code>getPrintOrderList</code> に配送ID配列と当該オプション値を渡し、注文ごとの印字行を得る。SQLの <code>ORDER BY</code> は <code>dtb_order.id</code> 昇順。</li><li>各行について <code>order_no</code> が空ならHTTP400でJSON「注文番号が未採番の注文があります。」を返し、以降の更新は行わない。</li><li>各行について更新パラメータを組み立てる。配列には印刷フラグを真にする意図のキーを含めるが、保存処理側は現行コードではそれ以外のビジネス用キーを解釈しない。ステータスが新規受付（数値IDが1）の行だけピックへ進めるフラグを真にする。</li><li><code>src/Eccube/Service/Admin/Order/UpdateStackListAction.php</code> が提供するハンドラをトランザクション内で実行する。各注文に対し <code>browser_print_flg</code> を真にし、手順7でピック遷移フラグが真になった行だけ受注ステータスをピック中（数値IDが10）にし <code>confirm_date</code> を現在日時で上書きする。操作者会員が解決できれば <code>dtb_order</code> の担当者をその会員に差し替える。</li><li>例外が出た場合はハンドラでロールバックしたうえで再送出される。コントローラ側は単一種類の標準例外だけをHTTP400のJSONへ写し替える分岐がある。印刷フラグ更新ハンドラの処理本文だけを読む限り、その型での終了は定義されていない。その他はそのまま外へ伝播しうる。</li><li>正常終了時はHTTP200でJSON「印刷予約を受け付けました。」を返す。</li></ol>
   240	<hr>
   241	<h2 id="集計条件">集計条件</h2>
   242	<p>本機能は一覧の件数集計や合計金額の再計算を行わない。</p>
   243	<div class="table-wrap"><table><thead><tr><th>指標</th><th>集計の要点</th></tr></thead><tbody><tr><td>印字行の単位</td><td>選択された <code>dtb_shipping.id</code> に紐づく <code>dtb_order.id</code> ごとに1行。同一注文の複数配送を同時に選んでも注文は1行にまとまる</td></tr></tbody></table></div>
   244	<hr>
   245	<h2 id="スタック用紙印字データ組み立て時の判定">スタック用紙印字データ組み立て時の判定</h2>
   246	<div class="table-wrap"><table><thead><tr><th>順序</th><th>判定</th><th>結果</th></tr></thead><tbody><tr><td>1</td><td><code>stack_paper_judgment_price</code> の文字列が <code>"0"</code> か</td><td><code>"0"</code> なら明細価格の最大を使うサブクエリを採用。それ以外なら商品規格の買取価格の最大を使うサブクエリを採用</td></tr><tr><td>2</td><td>閾値 <code>(int) stack_paper_threshold_price</code> と <code>op.price</code> を比較する</td><td>現行の <code>CASE</code> 式では閾値以上・未満にかかわらず印字列 <code>expensive</code> は同じ空欄装飾文字（実装では「□」）になる</td></tr></tbody></table></div>
   247	<hr>
   248	<h2 id="業務ルール・計算">業務ルール・計算</h2>
   249	<div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>閾値</td><td><code>mtb_option.stack_paper_threshold_price</code> を整数化してSQLパラメータに渡す。店舗マスタ <code>dtb_base_info.stack_paper_threshold</code> は当クエリでは使わない</td></tr><tr><td>高額印字区分</td><td>前表のとおり分岐はあるが、返却列の文字は両分岐で同一のため、現行実装単体では印字データ上の差は出ない</td></tr><tr><td>新規受付時の追加更新</td><td>ステータスIDが1の注文だけピック中（ID10）へ遷移し、<code>confirmDate</code> をサーバ現在日時でセットする。それ以外のステータスではステータスと確定日は変えない</td></tr></tbody></table></div>
   250	<p>本機能ではフォーム入力の保存・更新画面を持たないため、<code>### 入力項目</code> の5列表は置かない。</p>
   251	<hr>
   252	<h2 id="データ整合性">データ整合性</h2>
   253	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>一覧との対応</td><td>チェックボックスの値は配送ID。印字と更新の対象はその配送が属する注文</td></tr><tr><td>オプションと店舗マスタ</td><td>印字SQLは全体オプションの閾値のみ参照し、行ごとの店舗しきい値とは自動一致しない</td></tr><tr><td>同時操作</td><td>更新は悲観的ロックの追加取得なしで行う。他画面と同一注文を同時に更新した場合の結果は最終書き込み優先</td></tr><tr><td>子画面と親画面</td><td>親の検索条件セッションは本導線では書き換えない</td></tr><tr><td>配送ID欠損時</td><td>SQLに現れなかった配送IDだけは更新対象に含まれず、リストに載った注文だけがコミットされる</td></tr></tbody></table></div>
   254	<hr>
   255	<h2 id="API-バッチ結果">API/バッチ結果</h2>
   256	<p>本機能では外部公開API呼び出しやバッチジョブ起動を扱わない。子ウィンドウからの <code>POST</code> は同一オリジンの管理画面用JSON応答である。</p>
   257	<hr>
   258	<h2 id="入出力">入出力</h2>
   259	<div class="table-wrap"><table><thead><tr><th>種類</th><th>内容</th></tr></thead><tbody><tr><td>入力</td><td>一覧フォームの <code>ids[]</code>（配送ID）、<code>_token</code>。AJAXでは同じ <code>ids</code> 配列と <code>_token</code></td></tr><tr><td>成功時出力</td><td>HTTP200、JSONオブジェクトに <code>message</code> キーで成功文面</td></tr><tr><td>失敗時出力</td><td>HTTP400または404、JSONに <code>message</code>。<code>_token</code> 不正時は本文が固定、同時にフラッシュへ管理者向けCSRFエラーキーを積む場合がある</td></tr><tr><td>副作用</td><td>対象注文の <code>browser_print_flg</code>、条件付きで <code>order_status_id</code> と <code>confirmDate</code>、担当者会員。トランザクション完了時に確定</td></tr></tbody></table></div>
   260	<hr>
   261	<h2 id="DBカラム">DBカラム</h2>
   262	<p>当機能の更新で直接触れる主な列は次のとおり。型の細部はスキーマ定義を参照する。</p>
   263	<div class="table-wrap"><table><thead><tr><th>テーブル</th><th>列</th><th>メモ</th></tr></thead><tbody><tr><td><code>dtb_order</code></td><td><code>browser_print_flg</code></td><td>真に更新する</td></tr><tr><td><code>dtb_order</code></td><td><code>order_status_id</code></td><td>新規受付からピック中への遷移時のみ変更</td></tr><tr><td><code>dtb_order</code></td><td><code>confirm_date</code></td><td>上記遷移時に現在日時をセット</td></tr><tr><td><code>dtb_order</code></td><td><code>member_id</code></td><td>操作者会員が存在するときにセット</td></tr></tbody></table></div>
   264	<h3 id="DB操作">DB操作</h3>
   265	<p>本機能は参照系（検索・出力）であり、DBへの登録・更新・削除は行わない。テーブル名は ec-cube-enterprise を正典とする。</p>
   266	<div class="table-wrap"><table><thead><tr><th>操作種別</th><th>対象テーブル</th><th>契機・条件</th></tr></thead><tbody><tr><td>検索</td><td>dtb_order</td><td>検索条件に合致するレコードを抽出する。抽出結果を所定フォーマットでファイル出力する。</td></tr></tbody></table></div>
   267	<hr>
   268	<h2 id="バリデーション">バリデーション</h2>
   269	<div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>CSRF</td><td>AJAXのPOSTのみ明示検証。フォームキーは <code>_token</code>。失敗時HTTP400</td></tr><tr><td>対象ID</td><td><code>ids</code> 空はHTTP404</td></tr><tr><td>注文番号</td><td>印字行の <code>order_no</code> が空文字相当ならHTTP400</td></tr></tbody></table></div>
   270	<hr>
   271	<h2 id="権限・認可">権限・認可</h2>
   272	<div class="table-wrap"><table><thead><tr><th>利用者状態</th><th>本機能の画面・ルート</th></tr></thead><tbody><tr><td>未ログイン</td><td>管理画面セキュリティ設定に従い当パスへ到達しない</td></tr><tr><td>管理画面ログイン済み（従来の管理者ロール）</td><td>ルート定義上は追加のメソッド単位制限なし。実運用のロール細分は管理画面共通に従う</td></tr></tbody></table></div>
   273	<hr>
   274	<h2 id="画面遷移">画面遷移</h2>
   275	<div class="table-wrap"><table><thead><tr><th>条件</th><th>遷移先</th></tr></thead><tbody><tr><td>一覧で印刷ボタン押下（正常）</td><td>子ウィンドウが開き、同セッション内でAJAX後に子が閉じる。親URLは変わらない</td></tr><tr><td>CSRF失敗・対象なし・未採番</td><td>子ウィンドウ内でアラート後に閉じる。親はそのまま</td></tr></tbody></table></div>
   276	<h3 id="遷移時に引き継ぐ状態">遷移時に引き継ぐ状態</h3>
   277	<div class="table-wrap"><table><thead><tr><th>起点</th><th>遷移前の処理</th><th>遷移後の初期状態</th></tr></thead><tbody><tr><td>一覧→子ウィンドウ</td><td>一括フォームに埋めた <code>ids[]</code> と <code>_token</code> をPOST</td><td>子は同じ <code>ids</code> をJSONでAJAXに載せ替え、新しいページ生成時点の <code>_token</code> を付与する</td></tr></tbody></table></div>
   278	<hr>
   279	<h2 id="エラー処理">エラー処理</h2>
   280	<div class="table-wrap"><table><thead><tr><th>エラー内容</th><th>処理</th></tr></thead><tbody><tr><td>CSRF不正</td><td>HTTP400、JSONで固定メッセージ。管理向けフラッシュにCSRF関連キー</td></tr><tr><td><code>ids</code> 空</td><td>HTTP404、JSONで対象未指定メッセージ</td></tr><tr><td>注文番号未採番</td><td>HTTP400、JSONで未採番メッセージ。DB更新は行わない</td></tr><tr><td>AJAX応答がJSONでない等</td><td>子ウィンドウで固定のシステムエラー文を表示して閉じる</td></tr><tr><td>更新処理の例外（HTTP400へ写し替えられない種類）</td><td>子ウィンドウ側では汎用エラー表示に落ちうる。サーバは伝播させうる</td></tr></tbody></table></div>
   281	<hr>
   282	<h2 id="試行制限">試行制限</h2>
   283	<p>本機能ではレート制限や試行回数上限を扱わない。</p>
   284	<hr>
   285	<h2 id="ログ・監査">ログ・監査</h2>
   286	<div class="table-wrap"><table><thead><tr><th>タイミング</th><th>記録内容</th></tr></thead><tbody><tr><td>本ルート正常系</td><td>専用の業務ログ出力はコード上は必須としていない</td></tr><tr><td>更新例外</td><td>印刷フラグ更新用ハンドラはロールバック後に例外を再送出する。当ハンドラ内の追加ログは無い</td></tr></tbody></table></div>
   287	<h3 id="ログに出してはいけないもの">ログに出してはいけないもの</h3>
   288	<ul><li>パスワード</li><li>なりすまし対策トークン</li><li>Cookie値</li><li>セッションIDの完全値</li><li>Remember Meトークンの原値</li></ul>
   289	<hr>
   290	<h2 id="セッション">セッション</h2>
   291	<p>本機能は受注検索セッションキーを読み書きしない。子ウィンドウのPOSTは同一ブラウザセッションのクッキーで識別される。</p>
   292	<h3 id="セッションへ保存しない情報">セッションへ保存しない情報</h3>
   293	<ul><li>スタック用紙用の配送ID一覧をセッションに残す処理は無い（リクエスト都度POSTで渡す）</li></ul>
   294	<hr>
   295	<h2 id="Cookie">Cookie</h2>
   296	<p>セッション識別子以外の専用Cookieを本機能が新たに設定することはない。詳細は管理画面共通のセッション設定に従う。</p>
   297	<hr>
   298	<h2 id="排他制御・トランザクション">排他制御・トランザクション</h2>
   299	<p>印刷フラグ・ステータス更新ハンドラは1トランザクションで複数注文を更新し、成功時にコミット、例外時にロールバックする。行ロックの明示取得は行わない。</p>
   300	<hr>
   301	<h2 id="調査補助-grep用">調査補助（grep用）</h2>
   302	<p>実装位置の手がかりとして、ルート名 <code>admin_order_print_stack_window</code>・<code>admin_order_print_stack</code>、テンプレート <code>print_stack_window.twig</code>、リポジトリメソッド <code>getPrintOrderList</code>、サービス <code>UpdateStackListAction</code> を検索する。</p>
   303	<h3 id="HTTPルート名とパス-コード探索用・旧入口節より退避">HTTPルート名とパス（コード探索用・旧入口節より退避）</h3>
   304	<ul><li><code>admin_order_print_stack_window</code> … <code>POST</code> … <code>/{admin_route}/order/print/stack/window</code>（子ウィンドウ用の薄いページをHTMLで返す。<code>ids[]</code> と <code>_token</code> を一覧の一括フォームからPOSTする前提）</li><li><code>admin_order_print_stack</code> … <code>POST</code> … <code>/{admin_route}/order/print/stack</code>（AJAXによる印刷予約処理。<code>_token</code> を検証し、配送ID群から受注を解決してDB更新し、JSONで結果メッセージを返す）</li></ul>
   305	      <footer>このページは機能仕様書Markdownから自動生成されています。編集は元のMarkdownに対して行ってください。</footer>

codex
FALSE_POSITIVE | ④DBカラム・DB操作・テーブル | `order_no` vs `order_number` は実装差分ではなく設計書の表記ゆれ。設計書自身が ec-cube-enterprise のDB名を正とし、実装は `dtb_order.order_number` を取得・判定して「注文番号未採番なら400」を実現している。 | 設計: `function_spec_html_preview/pf-eccube3/m05-08_admin_order_order_stack_paper_print.html:221`, `:225`, `:239`, `:269`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1326`, `:1349`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:887` | findingはCONFIRMEDではなく「設計書修正候補」に落とす。実装欠陥扱いしない。

WEAK_EVIDENCE | ④DBカラム・DB操作・テーブル | DB操作節の「更新しない」だけを根拠に実装差分とするのは弱い。設計の概要・処理フロー・入出力・DBカラム・トランザクション節は更新を明記しており、実装もそれに一致する。候補JSON自体も「設計内自己矛盾」と書いており、設計vs実装差分としての根拠が的外れ。 | 設計: `function_spec_html_preview/pf-eccube3/m05-08_admin_order_order_stack_paper_print.html:218`, `:239`, `:259`, `:263`, `:265`, `:299`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdateStackListAction.php:49`, `:52`, `:53`, `:56`, `:60`, `:61` | 「設計書内矛盾」として記録し、実装差分findingからは除外または注記付きにする。

MISSED | 全体 | 確認範囲では追加の重要差分は確認不能ではなく、確認できた範囲で見当たらない。入口、AJAX、CSRF、ids、注文番号チェック、オプション分岐、更新、例外、トランザクションは設計記述と概ね一致。 | 設計: `function_spec_html_preview/pf-eccube3/m05-08_admin_order_order_stack_paper_print.html:230`, `:233`, `:237`, `:239`, `:246`, `:253`, `:277`, `:280`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:231`, `:236`, `:237`, `:1249`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/print_stack_window.twig:23`, `:24`, `:25`, `:27`, `:28`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:853`, `:865`, `:876`, `:882`, `:887`, `:906` | 追加finding不要。

VERDICT: false_positive=1, missed=0, weak_evidence=1, 総合=要修正
tokens used
118,861
FALSE_POSITIVE | ④DBカラム・DB操作・テーブル | `order_no` vs `order_number` は実装差分ではなく設計書の表記ゆれ。設計書自身が ec-cube-enterprise のDB名を正とし、実装は `dtb_order.order_number` を取得・判定して「注文番号未採番なら400」を実現している。 | 設計: `function_spec_html_preview/pf-eccube3/m05-08_admin_order_order_stack_paper_print.html:221`, `:225`, `:239`, `:269`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1326`, `:1349`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:887` | findingはCONFIRMEDではなく「設計書修正候補」に落とす。実装欠陥扱いしない。

WEAK_EVIDENCE | ④DBカラム・DB操作・テーブル | DB操作節の「更新しない」だけを根拠に実装差分とするのは弱い。設計の概要・処理フロー・入出力・DBカラム・トランザクション節は更新を明記しており、実装もそれに一致する。候補JSON自体も「設計内自己矛盾」と書いており、設計vs実装差分としての根拠が的外れ。 | 設計: `function_spec_html_preview/pf-eccube3/m05-08_admin_order_order_stack_paper_print.html:218`, `:239`, `:259`, `:263`, `:265`, `:299`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdateStackListAction.php:49`, `:52`, `:53`, `:56`, `:60`, `:61` | 「設計書内矛盾」として記録し、実装差分findingからは除外または注記付きにする。

MISSED | 全体 | 確認範囲では追加の重要差分は確認不能ではなく、確認できた範囲で見当たらない。入口、AJAX、CSRF、ids、注文番号チェック、オプション分岐、更新、例外、トランザクションは設計記述と概ね一致。 | 設計: `function_spec_html_preview/pf-eccube3/m05-08_admin_order_order_stack_paper_print.html:230`, `:233`, `:237`, `:239`, `:246`, `:253`, `:277`, `:280`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:231`, `:236`, `:237`, `:1249`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/print_stack_window.twig:23`, `:24`, `:25`, `:27`, `:28`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:853`, `:865`, `:876`, `:882`, `:887`, `:906` | 追加finding不要。

VERDICT: false_positive=1, missed=0, weak_evidence=1, 総合=要修正

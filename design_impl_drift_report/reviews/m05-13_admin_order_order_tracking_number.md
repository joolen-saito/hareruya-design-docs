OpenAI Codex v0.142.5
--------
workdir: /home/y-saito/Developments/hareruya-design-docs
model: gpt-5.5
provider: openai
approval: never
sandbox: read-only
reasoning effort: medium
reasoning summaries: none
session id: 019f26ab-699f-7422-85d5-e2468a024fd9
--------
user
あなたは設計書vs実装の差分監査に対する**批判的レビュア**です。読み取り専用で検証してください。創作禁止・確認できないものは「確認不能」と明記。

## 対象機能: m05-13_admin_order_order_tracking_number
- 差分候補JSON(検証対象): /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-13_admin_order_order_tracking_number.json
- 設計書HTML(正): /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m05-13_admin_order_order_tracking_number.html
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
対象JSONと設計HTML、実装参照を順に確認します。読み取り専用なので、まず候補の構造と参照先の実在性を押さえます。
exec
/bin/bash -lc 'rg -n "tracking|Tracking|お問い合わせ|問合|delivery|Delivery|OrderTracking|tracking_number|trackingNumber" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube' in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc 'rg -n "" function_spec_html_preview/ec-cube-enterprise/m05-13_admin_order_order_tracking_number.html' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
1:<!doctype html>
2:<html lang="ja">
3:<head>
4:  <meta charset="utf-8">
5:  <meta name="viewport" content="width=device-width, initial-scale=1">
6:  <title>m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力） - 機能仕様書</title>
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
183:<a class="lv2" href="#本書で扱うこと">本書で扱うこと</a>
184:<a class="lv2" href="#本書で扱わないこと">本書で扱わないこと</a>
185:<a class="lv2" href="#リニューアル移行時の扱い">リニューアル移行時の扱い</a>
186:<a class="lv2" href="#用語">用語</a>
187:<a class="lv2" href="#利用者視点の入口">利用者視点の入口</a>
188:<a class="lv2" href="#フロント挙動">フロント挙動</a>
189:<a class="lv2" href="#処理フロー">処理フロー</a>
190:<a class="lv3" href="#受注一覧からの非同期保存">受注一覧からの非同期保存</a>
191:<a class="lv3" href="#受注編集からの保存">受注編集からの保存</a>
192:<a class="lv2" href="#表示メッセージ">表示メッセージ</a>
193:<a class="lv3" href="#エラー・警告-インライン">エラー・警告（インライン）</a>
194:<a class="lv3" href="#フラッシュ・トースト">フラッシュ・トースト</a>
195:<a class="lv2" href="#業務ルール・計算">業務ルール・計算</a>
196:<a class="lv3" href="#入力項目">入力項目</a>
197:<a class="lv3" href="#エッジケース">エッジケース</a>
198:<a class="lv2" href="#データ整合性">データ整合性</a>
199:<a class="lv2" href="#API-バッチ結果">API/バッチ結果</a>
200:<a class="lv2" href="#入出力">入出力</a>
201:<a class="lv2" href="#DBカラム">DBカラム</a>
202:<a class="lv3" href="#DB操作">DB操作</a>
203:<a class="lv2" href="#バリデーション">バリデーション</a>
204:<a class="lv2" href="#権限・認可">権限・認可</a>
205:<a class="lv2" href="#画面遷移">画面遷移</a>
206:<a class="lv2" href="#エラー処理">エラー処理</a>
207:<a class="lv2" href="#ログ・監査">ログ・監査</a>
208:<a class="lv3" href="#ログに出してはいけないもの">ログに出してはいけないもの</a>
209:<a class="lv2" href="#排他制御・トランザクション">排他制御・トランザクション</a></nav>
210:    </aside>
211:    <main class="doc-content">
212:      <header class="page-header">
213:        <p class="crumb">Source:<br>/home/y-saito/Developments/hareruya-design-docs/functions/ec-cube-enterprise/m05-13_admin_order_order_tracking_number.md</p>
214:        <h1>m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）</h1>
215:      </header>
216:      <p>管理画面の受注一覧と受注編集で、出荷ごとに問い合わせ番号（出荷伝票番号・トラッキング番号）を入力し、出荷情報へ保存する機能。</p>
217:<h2 id="概要">概要</h2>
218:<p>受注の問い合わせ番号入力は、管理者が出荷単位の伝票番号を受注一覧画面または受注編集画面から入力し、出荷情報の伝票番号列へ保存する機能である。受注一覧では出荷行ごとの入力欄から非同期で1件ずつ保存し、受注編集では出荷情報フォームの一項目として受注全体の保存と同時に保存する。</p>
219:<p>本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。既存実装のふるまい、保存先、検証境界、副作用を確認し、仕様の確からしさを把握することを目的とする。</p>
220:<p>対象はブラウザ経由の管理画面の受注一覧と受注編集における問い合わせ番号の入力・保存に限る。</p>
221:<p>管理画面プレフィックスは環境変数由来の<code>eccube_admin_route</code>で決まり、管理用ファイアウォールは<code>^/%eccube_admin_route%/</code>配下を保護する。本書ではサイトルートからのパスを<code>%eccube_admin_route%</code>で示す。コントローラのメソッド単位の解剖やルートnameの網羅は主題としない。</p>
222:<p>本機能のカスタマイズ区分は標準であり、挙動・DB関連ともにec-cube-enterpriseの実装を正とする。</p>
223:<hr>
224:<h2 id="本書で扱うこと">本書で扱うこと</h2>
225:<ul><li>受注一覧の出荷行から問い合わせ番号を非同期で保存する入口とふるまい</li><li>受注編集の出荷情報フォームで問い合わせ番号を受注保存と同時に保存するふるまい</li><li>入力値の半角変換、文字種検証、最大長検証、保存先の出荷情報列</li><li>一覧の非同期保存と編集フォーム保存で最大長の確認値が異なること</li><li>非同期保存の成功・失敗時のJSON応答と画面のふるまい</li><li>非同期保存の権限・なりすまし対策トークン・XHR要求の判定</li></ul>
226:<hr>
227:<h2 id="本書で扱わないこと">本書で扱わないこと</h2>
228:<p>以下は本書では仕様確定せず、実装または別機能の設計を正とする。</p>
229:<ul><li>対応状況（出荷ステータス）の個別変更・一括変更（M05-12／M05-14の機能）</li><li>出荷完了メール・通知メールの送信（M05-15の機能）</li><li>受注メモ・ショップ用メモ欄の入力（M05-16／M05-17の機能）</li><li>受注一覧の検索・絞り込み・ページング・CSV出力・納品書出力</li><li>受注編集フォーム全体の明細・金額・お届け先などの編集ルール</li><li>管理画面のログイン・権限マスタ・管理者アカウント管理の詳細</li></ul>
230:<hr>
231:<h2 id="リニューアル移行時の扱い">リニューアル移行時の扱い</h2>
232:<p>本機能はカスタマイズ区分が標準であり、リニューアル後の標準機能としてec-cube-enterpriseの実装を正典とする。挙動・画面・DBスキーマはいずれもec-cube-enterpriseに基づき、現行リポとの差分管理は本書では行わない。問い合わせ番号の保存先（dtb_shipping.tracking_number。最大255文字の文字列・null許容）はec-cube-enterpriseの実装で実在を確認しており、移行先スキーマと同一とする。</p>
233:<hr>
234:<h2 id="用語">用語</h2>
235:<div class="table-wrap"><table><thead><tr><th>用語</th><th>説明</th></tr></thead><tbody><tr><td>問い合わせ番号</td><td>配送業者の伝票番号・トラッキング番号。画面ラベルは「送り状No.」、ツールチップやCSV列では「お問い合わせ番号（出荷伝票番号）」と表現する。</td></tr><tr><td>出荷</td><td>1受注に紐づく出荷単位。1受注は複数の出荷を持ち得る。問い合わせ番号は出荷単位で保持する。</td></tr><tr><td>受注一覧</td><td>出荷行を一覧表示する管理画面。1行が1出荷に対応する。</td></tr><tr><td>受注編集</td><td>1受注の明細・出荷情報を編集する管理画面。出荷情報の中に問い合わせ番号欄を持つ。</td></tr><tr><td>出荷情報</td><td>出荷を表す台帳。問い合わせ番号は出荷情報の伝票番号列に保存する。</td></tr></tbody></table></div>
236:<hr>
237:<h2 id="利用者視点の入口">利用者視点の入口</h2>
238:<div class="table-wrap"><table><thead><tr><th>入口</th><th>URLエンドポイント</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>受注一覧を開く</td><td><code>GET /%eccube_admin_route%/order</code></td><td>出荷行を含む受注一覧を表示する。各出荷行に問い合わせ番号の入力欄と更新ボタンを表示する想定のJSが読み込まれる。</td></tr><tr><td>受注一覧で問い合わせ番号を入力し更新</td><td><code>PUT /%eccube_admin_route%/shipping/{id}/tracking_number</code></td><td>入力欄の値を非同期（XHR）で送信し、当該出荷の問い合わせ番号を保存する。成功時は入力欄へ保存後の値を反映する。</td></tr><tr><td>受注編集を開く</td><td><code>GET /%eccube_admin_route%/order/{id}/edit</code></td><td>出荷情報の中に問い合わせ番号（送り状No.）欄を、現在の保存値を初期値として表示する。</td></tr><tr><td>受注編集で受注を保存</td><td><code>POST /%eccube_admin_route%/order/{id}/edit</code></td><td>問い合わせ番号欄を含む出荷情報フォームを受注全体の保存と同時に検証・保存する。</td></tr><tr><td>非管理者・未認証</td><td>上記の管理側URL</td><td>管理用ファイアウォールにより到達できず、本機能を利用できない。</td></tr></tbody></table></div>
239:<p>非同期保存の<code>{id}</code>は出荷識別子（数字のみ）である。受注編集側の<code>{id}</code>は受注識別子である。</p>
240:<hr>
241:<h2 id="フロント挙動">フロント挙動</h2>
242:<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>表示要素（受注一覧）</td><td>出荷行ごとに問い合わせ番号の入力欄（1行テキスト）と更新ボタンを表示する設計のJSを持つ。入力欄のidは<code>tracking_number_&lt;出荷id&gt;</code>、入力欄に<code>data-shipping_id</code>と保存先URLの<code>data-url</code>、更新ボタンに対象入力欄を指す<code>data-target</code>を持たせる前提である。現Enterprise版の一覧テンプレートでは出荷行に「編集系UIは各機能実装時に調整する」旨のTODOがあり、入力欄・更新ボタンの行内マークアップは未配置である。</td></tr><tr><td>JS挙動（受注一覧）</td><td>更新ボタンは初期状態で無効。入力欄のkeyupで対象ボタンを有効化し、アイコン色を成功色へ変える。updateTrackingNumberが<code>PUT</code>のXHRで<code>tracking_number</code>を送信する。成功（status=OK）時は入力欄へ応答値を反映し、コールバックでボタンを再度無効化・アイコンを既定色へ戻す。Enterキー押下時は保存後に次の入力欄へフォーカスを移す。応答がOK以外の到達時は<code>Update failed.</code>をアラート表示する。</td></tr><tr><td>JS挙動（失敗応答）</td><td>XHRがHTTPエラー応答（4xx／5xx）を返した場合、応答JSONの<code>messages</code>配列を改行連結してアラート表示する。</td></tr><tr><td>CSS・レイアウト</td><td>更新ボタンのアイコンは未変更時が<code>text-secondary</code>、変更検知時が<code>text-success</code>。状態表現のためのクラス切替のみで、条件分岐表示は行わない。</td></tr><tr><td>表示要素（受注編集）</td><td>出荷情報の中に「送り状No.」ラベルとツールチップ付きの1行テキスト欄を表示する。値は受注編集フォームの出荷情報項目として描画する。</td></tr><tr><td>JS挙動（受注編集）</td><td>受注編集の問い合わせ番号欄は専用の非同期送信を持たず、受注編集フォームの通常送信で保存する。</td></tr><tr><td>モーダル・ポップアップ</td><td>本機能はモーダル・ポップアップ・トーストを表示しない。一覧の失敗・更新失敗は素のアラートで通知する。</td></tr></tbody></table></div>
243:<hr>
244:<h2 id="処理フロー">処理フロー</h2>
245:<h3 id="受注一覧からの非同期保存">受注一覧からの非同期保存</h3>
246:<ol><li>利用者が出荷行の問い合わせ番号入力欄へ値を入力する。</li><li>キー入力で当該行の更新ボタンが有効化される。</li><li>更新ボタン押下またはEnterキーで、入力欄の<code>data-url</code>が示す出荷の伝票番号更新エンドポイントへ<code>PUT</code>のXHRを送り、<code>tracking_number</code>を送信する。</li><li>サーバは要求がXHRであることとなりすまし対策トークンが正当であることを確認する。いずれかを満たさない場合はステータスNGのJSONをHTTP400で返す。</li><li>サーバは受け取った値を半角へ変換し、最大長と文字種を検証する。詳細は「入力項目」と「表示メッセージ」を参照する。</li><li>検証エラー時は、エラー文言の配列を持つステータスNGのJSONをHTTP400で返す。画面はその文言をアラート表示する。</li><li>検証通過時は出荷情報の伝票番号列を更新して保存し、ステータスOKと出荷識別子・保存後の値を持つJSONを返す。画面は入力欄へ保存後の値を反映する。</li><li>保存中に例外が発生した場合はステータスNGのJSONをHTTP500で返す。</li></ol>
247:<h3 id="受注編集からの保存">受注編集からの保存</h3>
248:<ol><li>利用者が受注編集を開くと、出荷情報の問い合わせ番号欄に現在の保存値が初期表示される。</li><li>利用者が値を入力し、受注編集フォームを送信する。</li><li>サーバは出荷情報フォームの一項目として問い合わせ番号を検証する。最大長と文字種を検証する。</li><li>受注全体の保存処理のなかで、検証通過時に出荷情報の伝票番号列を更新する。検証エラー時はフォーム直下に項目エラーを表示し、受注を保存しない。</li></ol>
249:<hr>
250:<h2 id="表示メッセージ">表示メッセージ</h2>
251:<h3 id="エラー・警告-インライン">エラー・警告（インライン）</h3>
252:<div class="table-wrap"><table><thead><tr><th>表示文言（日本語）</th><th>表示文言（英語）</th><th>表示条件（利用者視点）</th><th>表示位置</th><th>備考</th></tr></thead><tbody><tr><td>送り状No.は半角英数字かハイフンのみを入力してください。</td><td>Only Roman alphabets, numbers and hyphens are accepted for tracking numbers.</td><td>受注一覧の非同期保存で、半角変換後の値が半角英数字とハイフン以外を含むとき。</td><td>入力結果のアラート</td><td>文字種検証のメッセージ。調査補助キー<code>admin.order.tracking_number_error</code>。</td></tr><tr><td>半角英数字かハイフンのみを入力してください。</td><td>Entry must be alphanumeric characters or hyphens.</td><td>受注編集フォーム送信で、問い合わせ番号が半角英数字とハイフン以外を含むとき。</td><td>問い合わせ番号欄の直下</td><td>調査補助キー<code>form_error.graph_and_hyphen_only</code>。</td></tr><tr><td>Update failed.</td><td>Update failed.</td><td>受注一覧の非同期保存で、応答が到達したがステータスがOKでないとき。</td><td>アラート</td><td>固定文言。翻訳キーを介さない日英共通の文言。</td></tr></tbody></table></div>
253:<p>最大長超過時はSymfonyの文字数超過メッセージを返す。一覧の非同期保存では<code>messages</code>配列の各文言を改行連結してアラート表示する。</p>
254:<h3 id="フラッシュ・トースト">フラッシュ・トースト</h3>
255:<p>本機能は問い合わせ番号の保存に固有のフラッシュ・トーストを生成しない。受注編集フォーム全体の保存完了フラッシュは受注編集機能の出力とする。</p>
256:<hr>
257:<h2 id="業務ルール・計算">業務ルール・計算</h2>
258:<div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>半角変換</td><td>受注一覧の非同期保存では、受け取った値を全角英数字から半角英数字へ変換してから検証・保存する。受注編集フォーム経路ではこの変換を行わない。</td></tr><tr><td>文字種</td><td>半角英数字とハイフンのみを許可する。それ以外を含むと検証エラーとし保存しない。</td></tr><tr><td>最大長（一覧の非同期保存）</td><td>確認値255文字。<code>eccube_stext_len</code>を上限に用いる。</td></tr><tr><td>最大長（受注編集フォーム）</td><td>確認値200文字。<code>eccube_mtext_len</code>を上限に用いる。</td></tr><tr><td>保存単位</td><td>問い合わせ番号は出荷単位で保持する。受注ではなく各出荷に1つずつ保存する。</td></tr><tr><td>既存値の上書き</td><td>保存時は当該出荷の伝票番号列を受信値で上書きする。</td></tr></tbody></table></div>
259:<p>本機能は金額計算・税計算・丸め処理を行わない。</p>
260:<h3 id="入力項目">入力項目</h3>
261:<div class="table-wrap"><table><thead><tr><th>項目名</th><th>必須／任意</th><th>最大長</th><th>初期値</th><th>保存先・扱い</th></tr></thead><tbody><tr><td>送り状No.（受注一覧の出荷行）</td><td>任意</td><td>255文字（<code>eccube_stext_len</code>確認値255）</td><td>当該出荷の現在の保存値または空</td><td><code>dtb_shipping.tracking_number</code>。送信キー<code>tracking_number</code>。半角変換後に文字種<code>/^[0-9a-zA-Z-]+$/u</code>と最大長を検証。非同期で1出荷ずつ保存。</td></tr><tr><td>送り状No.（受注編集の出荷情報）</td><td>任意</td><td>200文字（<code>eccube_mtext_len</code>確認値200）</td><td>当該出荷の現在の保存値または空</td><td><code>dtb_shipping.tracking_number</code>。フォーム項目<code>Shipping.tracking_number</code>。文字種<code>/^[0-9a-zA-Z-]+$/u</code>と最大長を検証し、受注編集フォーム送信で保存。</td></tr></tbody></table></div>
262:<p>最大長の確認値は<code>app/config/eccube/packages/eccube.yaml</code>の<code>eccube_stext_len</code>（255）と<code>eccube_mtext_len</code>（200）に基づく。運用環境で上書きされている場合はその環境の値が正とする。保存先列<code>dtb_shipping.tracking_number</code>はスキーマ上は最大255文字の文字列・null許容である。</p>
263:<h3 id="エッジケース">エッジケース</h3>
264:<div class="table-wrap"><table><thead><tr><th>ケース</th><th>扱い</th></tr></thead><tbody><tr><td>値が空（受注一覧の非同期保存）</td><td>文字種検証が空文字に一致せず検証エラーとなり保存しない。空での消去はこの経路では成立しない。</td></tr><tr><td>値が空（受注編集フォーム）</td><td>任意項目のため空のまま保存し得る。空文字または未設定として伝票番号列を更新する。</td></tr><tr><td>全角英数字を入力（受注一覧）</td><td>半角へ変換してから検証するため、半角英数字とハイフンの範囲なら保存される。</td></tr><tr><td>全角英数字を入力（受注編集フォーム）</td><td>半角変換を行わないため、半角英数字とハイフン以外と判定され検証エラーとなる。</td></tr><tr><td>ハイフン以外の記号・空白を含む</td><td>いずれの経路でも文字種検証エラーとなり保存しない。</td></tr><tr><td>最大長を超える</td><td>文字数超過の検証エラーとなり保存しない。上限は経路により255／200と異なる。</td></tr><tr><td>存在しない出荷識別子（非同期保存）</td><td>出荷の取得に失敗し、フレームワークの未検出応答となる。</td></tr></tbody></table></div>
265:<hr>
266:<h2 id="データ整合性">データ整合性</h2>
267:<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>一覧と編集の一致</td><td>受注一覧と受注編集はいずれも同一の出荷情報の伝票番号列を参照・更新する。片方で保存した値は、他方を次に開いたときの初期値に反映される。</td></tr><tr><td>参照時点</td><td>一覧・編集とも画面表示時点の永続化済みの値を表示する。他者が更新しても表示中の画面は自動更新しない。</td></tr><tr><td>最大長の差</td><td>非同期保存は255文字まで、編集フォームは200文字までを許す。200文字を超え255文字以下の値は非同期保存でのみ保存され、その出荷を編集フォームで再保存する際に最大長検証に掛かり得る。</td></tr><tr><td>同時更新</td><td>出荷単位の上書き保存であり、同一出荷を複数の管理者が同時に保存した場合は後勝ちとなる。ロックは取らない。</td></tr></tbody></table></div>
268:<hr>
269:<h2 id="API-バッチ結果">API/バッチ結果</h2>
270:<p>本機能ではバッチ実行を扱わない。受注一覧の非同期保存は管理画面内のXHRであり、入力は出荷識別子と<code>tracking_number</code>、成功結果はステータスOKと保存後の値、失敗結果は検証エラー（HTTP400）または保存例外（HTTP500）のステータスNGである。再送信は同じ出荷へ上書き保存となる。</p>
271:<hr>
272:<h2 id="入出力">入出力</h2>
273:<div class="table-wrap"><table><thead><tr><th>種類</th><th>内容</th></tr></thead><tbody><tr><td>入力</td><td>受注一覧では出荷識別子（パス）と<code>tracking_number</code>（PUTボディ）。受注編集では出荷情報フォームの問い合わせ番号欄。</td></tr><tr><td>成功時出力</td><td>受注一覧ではステータスOK・出荷識別子・保存後の値を持つJSON。受注編集では受注全体の保存結果に含めて出荷情報を更新。</td></tr><tr><td>失敗時出力</td><td>受注一覧では検証エラー時にステータスNGとエラー文言配列をHTTP400、保存例外時にステータスNGをHTTP500。XHR・トークン不正時はステータスNGをHTTP400。受注編集ではフォーム項目エラーを表示し受注を保存しない。</td></tr><tr><td>副作用</td><td>出荷情報の伝票番号列の更新。情報ログ（送り状番号変更処理完了・入力チェックエラー）の出力。</td></tr></tbody></table></div>
274:<hr>
275:<h2 id="DBカラム">DBカラム</h2>
276:<p>当機能に直接関係する列のみを記載する。型や一覧の細部はスキーマを参照する。</p>
277:<div class="table-wrap"><table><thead><tr><th>テーブル</th><th>列</th><th>メモ</th></tr></thead><tbody><tr><td>dtb_shipping</td><td>id</td><td>非同期保存の対象出荷を特定するキー。</td></tr><tr><td>dtb_shipping</td><td>tracking_number</td><td>問い合わせ番号の保存先。最大255文字の文字列、null許容。</td></tr></tbody></table></div>
278:<h3 id="DB操作">DB操作</h3>
279:<p>永続化の正は ec-cube-enterprise（テーブル名・操作は ec-cube-enterprise を正典）。当ドメインは承認ワークフローを介さず persist/flush で直接確定する（承認ワークフローは在庫機能固有）。</p>
280:<div class="table-wrap"><table><thead><tr><th>操作種別</th><th>対象テーブル</th><th>契機・条件</th></tr></thead><tbody><tr><td>登録/更新</td><td>dtb_shipping</td><td>当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。</td></tr></tbody></table></div>
281:<hr>
282:<h2 id="バリデーション">バリデーション</h2>
283:<div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>送り状No.（受注一覧の非同期保存）</td><td>半角変換後に文字種<code>/^[0-9a-zA-Z-]+$/u</code>と最大長255文字を検証する。空文字は文字種検証に一致せずエラーとなる。</td></tr><tr><td>送り状No.（受注編集フォーム）</td><td>文字種<code>/^[0-9a-zA-Z-]+$/u</code>と最大長200文字を検証する。任意項目のため空は許容する。</td></tr><tr><td>要求の正当性（受注一覧）</td><td>XHR要求であること、なりすまし対策トークンが正当であることを保存前に確認する。なりすまし対策トークン自体は業務データとして扱わない。</td></tr></tbody></table></div>
284:<hr>
285:<h2 id="権限・認可">権限・認可</h2>
286:<div class="table-wrap"><table><thead><tr><th>利用者状態</th><th>問い合わせ番号の入力・保存</th></tr></thead><tbody><tr><td>未認証</td><td>利用不可。管理用ファイアウォールにより管理側URLへ到達できずログインへ誘導される。</td></tr><tr><td>管理者として認証済み</td><td>受注一覧・受注編集から問い合わせ番号を入力・保存できる。</td></tr><tr><td>受注機能以外の操作権限</td><td>問い合わせ番号の保存自体は受注画面の到達可否に従う。対応状況変更・メール送信などの可否は各機能の権限設計に従う。</td></tr></tbody></table></div>
287:<hr>
288:<h2 id="画面遷移">画面遷移</h2>
289:<div class="table-wrap"><table><thead><tr><th>条件</th><th>遷移先</th></tr></thead><tbody><tr><td>受注一覧で問い合わせ番号を更新</td><td>画面遷移しない。同一画面のまま非同期で保存し、入力欄へ値を反映する。</td></tr><tr><td>受注編集で受注を保存</td><td>受注編集機能の保存後遷移に従う。問い合わせ番号は同時に保存される。</td></tr></tbody></table></div>
290:<p>本機能の非同期保存は別ウィンドウや画面遷移を伴わず、同一画面内の更新として扱う。</p>
291:<hr>
292:<h2 id="エラー処理">エラー処理</h2>
293:<div class="table-wrap"><table><thead><tr><th>エラー内容</th><th>処理</th></tr></thead><tbody><tr><td>XHR要求でない／なりすまし対策トークン不正</td><td>ステータスNGのJSONをHTTP400で返す。表示文言は本機能では設けない。</td></tr><tr><td>文字種・最大長の検証エラー（受注一覧）</td><td>エラー文言配列を持つステータスNGのJSONをHTTP400で返す。文言は「表示メッセージ」を正とする。情報ログに入力チェックエラーを記録する。</td></tr><tr><td>保存中の例外（受注一覧）</td><td>ステータスNGのJSONをHTTP500で返し、エラーログを記録する。</td></tr><tr><td>検証エラー（受注編集フォーム）</td><td>問い合わせ番号欄の直下に項目エラーを表示し、受注を保存しない。</td></tr></tbody></table></div>
294:<hr>
295:<h2 id="ログ・監査">ログ・監査</h2>
296:<div class="table-wrap"><table><thead><tr><th>タイミング</th><th>記録内容</th></tr></thead><tbody><tr><td>受注一覧の非同期保存の検証エラー時</td><td>送り状番号入力チェックエラーの情報ログ。</td></tr><tr><td>受注一覧の非同期保存の完了時</td><td>送り状番号変更処理完了の情報ログ（出荷識別子）。</td></tr><tr><td>受注一覧の非同期保存の例外時</td><td>予期しないエラーのエラーログ（例外メッセージ）。</td></tr></tbody></table></div>
297:<h3 id="ログに出してはいけないもの">ログに出してはいけないもの</h3>
298:<ul><li>なりすまし対策トークンの原値</li><li>セッション識別子の完全値</li><li>Cookie値</li></ul>
299:<hr>
300:<h2 id="排他制御・トランザクション">排他制御・トランザクション</h2>
301:<p>本機能は問い合わせ番号の保存で楽観ロック・悲観ロックを取らない。出荷単位の上書き保存であり、同一出荷への同時保存は後勝ちとなる。受注編集フォーム経由の保存トランザクションの境界は受注編集機能の設計を正とする。</p>
302:      <footer>このページは機能仕様書Markdownから自動生成されています。編集は元のMarkdownに対して行ってください。</footer>
303:    </main>
304:  </div>
305:</body>
306:</html>

exec
/bin/bash -lc "jq '.' /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/m05-13_admin_order_order_tracking_number.json" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
{
  "functionId": "m05-13_admin_order_order_tracking_number",
  "title": "m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）",
  "domain": "m05",
  "kind": "admin",
  "designHtml": "function_spec_html_preview/ec-cube-enterprise/m05-13_admin_order_order_tracking_number.html",
  "findings": [
    {
      "dimension": "③バリデーション",
      "severity": "med",
      "designRef": "functions/ec-cube-enterprise/m05-13_admin_order_order_tracking_number.md:155",
      "designQuote": "値が空（受注一覧の非同期保存）: 文字種検証が空文字に一致せず検証エラーとなり保存しない。空での消去はこの経路では成立しない。",
      "implRef": "src/Eccube/Controller/Admin/Order/OrderController.php:576",
      "difference": "設計は受注一覧の非同期保存で空文字は文字種検証（/^[0-9a-zA-Z-]+$/u）に一致せず検証エラーとなり保存されない（空での消去不可）とする。しかし実装は Symfony の Assert\\Length と Assert\\Regex を validator->validate() で適用しており、Symfony の RegexValidator（RegexValidator.php:33-34: `if (null === $value || '' === $value) { return; }`）は空文字を検証スキップ、LengthValidator（LengthValidator.php:30 は null のみスキップし空文字は長さ0で max を通過）。このため tracking_number が空文字の場合は errors->count()==0（OrderController.php:586）で検証を通過し、setTrackingNumber('')（OrderController.php:598）で dtb_shipping.tracking_number が空文字に上書き保存される。設計が「成立しない」とする空での消去が、実装では非同期保存経路（admin_shipping_update_tracking_number, PUT, OrderController.php:565-566）で成立する。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "src/Eccube/Controller/Admin/Order/OrderController.php:572（$trackingNumber = $request->get('tracking_number') ?? ''）, :576-584（validator->validate に Assert\\Length + Assert\\Regex）, :586（errors->count() != 0 のみ NG）, :598（$shipping->setTrackingNumber($trackingNumber)）; vendor/symfony/validator/Constraints/RegexValidator.php:33（null または '' で return しスキップ）; vendor/symfony/validator/Constraints/LengthValidator.php:30（null のみ return、空文字は長さ0で max を通過）。したがって空文字は検証通過し保存され、空での消去が非同期経路で成立する。"
    }
  ]
}

 succeeded in 123ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:108:    public const ADMIN_CUSTOMER_DELIVERY_DELETE_COMPLETE = 'admin.customer.delivery.delete.complete';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:121:    public const ADMIN_CUSTOMER_DELIVERY_EDIT_INDEX_INITIALIZE = 'admin.customer.delivery.edit.index.initialize';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:122:    public const ADMIN_CUSTOMER_DELIVERY_EDIT_INDEX_COMPLETE = 'admin.customer.delivery.edit.index.complete';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:307:     * Admin/Setting/Shop/DeliveryController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:310:    public const ADMIN_SETTING_SHOP_DELIVERY_INDEX_COMPLETE = 'admin.setting.shop.delivery.index.complete';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:312:    public const ADMIN_SETTING_SHOP_DELIVERY_EDIT_INITIALIZE = 'admin.setting.shop.delivery.edit.initialize';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:313:    public const ADMIN_SETTING_SHOP_DELIVERY_EDIT_COMPLETE = 'admin.setting.shop.delivery.edit.complete';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:315:    public const ADMIN_SETTING_SHOP_DELIVERY_DELETE_COMPLETE = 'admin.setting.shop.delivery.delete.complete';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:317:    public const ADMIN_SETTING_SHOP_DELIVERY_VISIBILITY_COMPLETE = 'admin.setting.shop.delivery.visibility.complete';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:424:     * Mypage/DeliveryController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:427:    public const FRONT_MYPAGE_DELIVERY_EDIT_INITIALIZE = 'front.mypage.delivery.edit.initialize';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:428:    public const FRONT_MYPAGE_DELIVERY_EDIT_COMPLETE = 'front.mypage.delivery.edit.complete';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:552:    // delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:553:    public const FRONT_SHOPPING_DELIVERY_INITIALIZE = 'front.shopping.delivery.initialize';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Event/EccubeEvents.php:554:    public const FRONT_SHOPPING_DELIVERY_COMPLETE = 'front.shopping.delivery.complete';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Calculator/OrderItemCollection.php:67:    public function getDeliveryFees(): ArrayCollection
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Calculator/OrderItemCollection.php:70:            fn (ItemInterface $OrderItem) => $OrderItem->isDeliveryFee());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Views/MallReferenceViaTenantView.php:85:    #[ORM\Column(name: 'option_product_delivery_fee', type: Types::BOOLEAN, options: ['default' => false])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Views/MallReferenceViaTenantView.php:86:    private bool $option_product_delivery_fee = false;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Views/MallReferenceViaTenantView.php:182:    public function isOptionProductDeliveryFee(): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Views/MallReferenceViaTenantView.php:184:        return $this->option_product_delivery_fee;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:27:use Eccube\Repository\DtbMinimumDeliveryTimeRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:40:        private readonly DtbMinimumDeliveryTimeRepository $minimumDeliveryTimeRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:168:     * 注文内商品の発送日目安（DeliveryDuration）の最大日数から選択可能日を生成する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:173:    public function getFormDeliveryDates(Order $Order): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:175:        $minDate = $this->getMinDeliveryDateOffset($Order);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:180:        return $this->buildDeliveryDateChoices(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:191:    public function buildDeliveryDateChoices(int $minDate, int $selectDays): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:193:        $deliveryDates = [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:202:            $deliveryDates[$formatted] = $formatted;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:205:        return $deliveryDates;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:213:    public function getMinDeliveryDateOffset(Order $Order): ?int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:216:        $hasDeliveryDuration = false;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:224:            $DeliveryDuration = $ProductClass->getDeliveryDuration();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:225:            if ($DeliveryDuration === null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:229:            if ($DeliveryDuration->getDuration() < 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:233:            if ($minDate < $DeliveryDuration->getDuration()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:234:                $minDate = $DeliveryDuration->getDuration();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:237:            $hasDeliveryDuration = true;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:240:        return $hasDeliveryDuration ? $minDate : null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:265:        $Delivery = $Shipping->getDelivery();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:266:        if ($Delivery === null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:275:        $minimumDeliveryTimesByPrefId = $this->minimumDeliveryTimeRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:276:            ->findByDeliveryIdWithResultKeyToPrefId((string) $Delivery->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:277:        $entry = $minimumDeliveryTimesByPrefId[$Pref->getId()] ?? null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ShoppingService.php:279:        return $entry !== null ? $entry->getDeliveryTime()->getId() : 0;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/EventSubscriber/TenantEventSubscriber.php:28:use Eccube\Entity\Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/EventSubscriber/TenantEventSubscriber.php:29:use Eccube\Entity\DeliveryFee;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/EventSubscriber/TenantEventSubscriber.php:30:use Eccube\Entity\DeliveryTime;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/EventSubscriber/TenantEventSubscriber.php:63:                && $entity instanceof Delivery === false
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/EventSubscriber/TenantEventSubscriber.php:64:                && $entity instanceof DeliveryFee === false
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/EventSubscriber/TenantEventSubscriber.php:65:                && $entity instanceof DeliveryTime === false
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Data/MtgMasterDataController.php:242:                'label' => 'お問い合わせ件名',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryFee.php:20:use Eccube\Repository\DeliveryFeeRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryFee.php:22:if (!class_exists(DeliveryFee::class)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryFee.php:24:     * DeliveryFee
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryFee.php:26:    #[ORM\Table(name: 'dtb_delivery_fee')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryFee.php:28:    #[ORM\Entity(repositoryClass: DeliveryFeeRepository::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryFee.php:29:    class DeliveryFee extends AbstractEntity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryFee.php:40:        #[ORM\ManyToOne(targetEntity: Delivery::class, inversedBy: 'DeliveryFees')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryFee.php:41:        #[ORM\JoinColumn(name: 'delivery_id', referencedColumnName: 'id', nullable: false)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryFee.php:42:        private ?Delivery $Delivery = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryFee.php:61:        public function setFee(string $fee): DeliveryFee
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryFee.php:77:         * Set delivery.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryFee.php:79:        public function setDelivery(?Delivery $delivery = null): DeliveryFee
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryFee.php:81:            $this->Delivery = $delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryFee.php:87:         * Get delivery.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryFee.php:89:        public function getDelivery(): ?Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryFee.php:91:            return $this->Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryFee.php:97:        public function setPref(?Pref $pref = null): DeliveryFee
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryFee.php:120:        public function setSize(?int $size): DeliveryFee
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryFee.php:135:        public function setWeight(?int $weight): DeliveryFee
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:204:        #[ORM\Column(name: 'delivery_fee', type: Types::DECIMAL, precision: 12, scale: 2, nullable: true, options: ['unsigned' => true])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:205:        private ?string $delivery_fee = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:257:        #[ORM\ManyToOne(targetEntity: DeliveryDuration::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:258:        #[ORM\JoinColumn(name: 'delivery_duration_id', referencedColumnName: 'id')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:259:        private ?DeliveryDuration $DeliveryDuration = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:500:         * Set deliveryFee.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:502:        public function setDeliveryFee(?string $deliveryFee = null): ProductClass
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:504:            $this->delivery_fee = $deliveryFee;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:510:         * Get deliveryFee.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:512:        public function getDeliveryFee(): ?string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:514:            return $this->delivery_fee;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:754:         * Set deliveryDuration.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:756:        public function setDeliveryDuration(?DeliveryDuration $deliveryDuration = null): ProductClass
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:758:            $this->DeliveryDuration = $deliveryDuration;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:764:         * Get deliveryDuration.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:766:        public function getDeliveryDuration(): ?DeliveryDuration
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:768:            return $this->DeliveryDuration;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:30:use Eccube\Service\Admin\Stock\StockMoveInstructionTrackingRegisterAction;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:54:        protected StockMoveInstructionTrackingRegisterAction $trackingRegisterAction,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:170:        $originalTrackingNo = $Instruction->getTrackingNo();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:175:            $newTrackingNo = trim($Instruction->getTrackingNo() ?? '');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:176:            if ($originalTrackingNo !== null && $originalTrackingNo !== '' && $newTrackingNo === '') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:177:                $form->get('trackingNo')->addError(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:179:                        $this->translator->trans('admin.stock.move_instruction.detail_tracking_no_cannot_be_cleared', [], 'messages')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:228:    #[Route(path: '/%eccube_admin_route%/product/stock/move-instruction/{id}/tracking', name: 'admin_stock_move_instruction_register_tracking', requirements: ['id' => '\d+'], methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:229:    public function registerTracking(Request $request, int $id): RedirectResponse
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:238:        $trackingNo = $request->request->get('tracking_no');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:239:        $trackingNo = is_string($trackingNo) ? trim($trackingNo) : '';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:241:        $originalTrackingNo = $Instruction->getTrackingNo();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:242:        if ($originalTrackingNo !== null && $originalTrackingNo !== '' && $trackingNo === '') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:243:            $this->addError('admin.stock.move_instruction.detail_tracking_no_cannot_be_cleared', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:249:        $this->trackingRegisterAction->handle($Instruction, $trackingNo, $Member);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:251:        $this->addSuccess('admin.stock.move_instruction.tracking_register_success', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:272:            $this->addError('admin.stock.move_instruction.delete_error_after_tracking', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:296:        $trackingNo = $Instruction->getTrackingNo();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:297:        if ($trackingNo !== null && $trackingNo !== '') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:306:            $Move->setTrackingNo(null);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:368:    #[Route(path: '/%eccube_admin_route%/product/stock/move-instruction/csv-tracking', name: 'admin_stock_move_instruction_csv_tracking', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:369:    public function csvTrackingUpload(Request $request): RedirectResponse
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:375:            $this->addError('admin.stock.move_instruction.csv_tracking_file_invalid', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:387:                $this->addError('admin.stock.move_instruction.csv_tracking_errors_capped', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:395:                $this->addSuccess('admin.stock.move_instruction.csv_tracking_success', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:399:                $this->addError('admin.stock.move_instruction.csv_tracking_no_valid_rows', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:411:                if ($msg === 'admin.stock.move_instruction.csv_tracking_header_invalid') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:412:                    $this->addError('admin.stock.move_instruction.csv_tracking_header_invalid', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:413:                } elseif ($msg === 'admin.stock.move_instruction.csv_tracking_file_invalid') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:414:                    $this->addError('admin.stock.move_instruction.csv_tracking_file_invalid', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:415:                } elseif ($msg === 'admin.stock.move_instruction.csv_tracking_temp_dir_invalid') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:423:                        'admin.stock.move_instruction.csv_tracking_upload_error_detail',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php:432:                    'admin.stock.move_instruction.csv_tracking_upload_error_detail',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:19:use Eccube\Entity\Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:299:            $delivery = $Shipping->getDelivery();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:300:            if ($delivery instanceof Delivery && $delivery->getId() === Delivery::SMOOTH_OTC) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/CartItem.php:128:        public function isDeliveryFee(): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ItemInterface.php:32:    public function isDeliveryFee(): bool;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/PurchasePatternContextBuilder.php:19:use Eccube\Entity\Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/PurchasePatternContextBuilder.php:151:                $delivery = $shipping->getDelivery();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/PurchasePatternContextBuilder.php:152:                if ($delivery === null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/PurchasePatternContextBuilder.php:156:                $pickupMethod = match ($delivery->getId()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/PurchasePatternContextBuilder.php:157:                    Delivery::SMOOTH_OTC => PickupMethod::SMOOTH_OTC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/PurchasePatternContextBuilder.php:158:                    Delivery::OTC => PickupMethod::OTC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:19:use Eccube\Repository\DeliveryTimeRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:21:if (!class_exists(DeliveryTime::class)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:23:     * DeliveryTime
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:25:    #[ORM\Table(name: 'dtb_delivery_time')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:27:    #[ORM\Entity(repositoryClass: DeliveryTimeRepository::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:28:    class DeliveryTime extends AbstractEntity implements \Stringable
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:35:            return (string) $this->delivery_time;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:43:        #[ORM\Column(name: 'delivery_time', type: Types::STRING, length: 255)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:44:        private ?string $delivery_time = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:46:        #[ORM\ManyToOne(targetEntity: Delivery::class, inversedBy: 'DeliveryTimes')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:47:        #[ORM\JoinColumn(name: 'delivery_id', referencedColumnName: 'id')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:48:        private ?Delivery $Delivery = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:79:         * Set deliveryTime.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:81:        public function setDeliveryTime(string $deliveryTime): DeliveryTime
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:83:            $this->delivery_time = $deliveryTime;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:89:         * Get deliveryTime.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:91:        public function getDeliveryTime(): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:93:            return $this->delivery_time;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:97:         * Set delivery.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:99:        public function setDelivery(?Delivery $delivery = null): DeliveryTime
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:101:            $this->Delivery = $delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:107:         * Get delivery.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:109:        public function getDelivery(): ?Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:111:            return $this->Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:137:        public function setVisible(bool $visible): DeliveryTime
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:155:        public function setCreateDate(\DateTime $createDate): DeliveryTime
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryTime.php:173:        public function setUpdateDate(\DateTime $updateDate): DeliveryTime
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryTimeRepository.php:17:use Eccube\Entity\DeliveryTime;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryTimeRepository.php:25: * @extends AbstractRepository<DeliveryTime>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryTimeRepository.php:27:class DeliveryTimeRepository extends AbstractRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryTimeRepository.php:31:        parent::__construct($registry, DeliveryTime::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDailySummaryRepository.php:48:    COALESCE(SUM(o.subtotal + o.delivery_fee_total + o.charge), 0) AS order_amount_order,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Cart.php:70:        #[ORM\Column(name: 'delivery_fee_total', type: Types::DECIMAL, precision: 12, scale: 2, options: ['unsigned' => true, 'default' => 0])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Cart.php:71:        private ?string $delivery_fee_total = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Cart.php:277:        public function setDeliveryFeeTotal($total): static
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Cart.php:279:            $this->delivery_fee_total = $total;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Cart.php:288:        public function getDeliveryFeeTotal(): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Cart.php:290:            return $this->delivery_fee_total;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerDeliveryEditController.php:30:class CustomerDeliveryEditController extends AbstractController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerDeliveryEditController.php:45:    #[Route(path: '/%eccube_admin_route%/customer/{id}/delivery/new', name: 'admin_customer_delivery_new', requirements: ['id' => '\d+'], methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerDeliveryEditController.php:46:    #[Route(path: '/%eccube_admin_route%/customer/{id}/delivery/{did}/edit', name: 'admin_customer_delivery_edit', requirements: ['id' => '\d+', 'did' => '\d+'], methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerDeliveryEditController.php:47:    #[Template(template: '@admin/Customer/delivery_edit.twig')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerDeliveryEditController.php:109:            return $this->redirectToRoute('admin_customer_delivery_edit', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerDeliveryEditController.php:127:    #[Route(path: '/%eccube_admin_route%/customer/{id}/delivery/{did}/delete', name: 'admin_customer_delivery_delete', requirements: ['id' => '\d+', 'did' => '\d+'], methods: ['DELETE'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php:22:use Eccube\Entity\Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php:47:     * 店頭受取注文 (Delivery::OTC_GROUP) のうちスマレジ商品IDが一致する明細を返す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php:62:            ->innerJoin('s.Delivery', 'd')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php:64:            ->andWhere('d.id IN (:deliveryIds)')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php:66:            ->setParameter('deliveryIds', Delivery::OTC_GROUP)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbMinimumDeliveryTime.php:21:use Eccube\Repository\DtbMinimumDeliveryTimeRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbMinimumDeliveryTime.php:23:#[ORM\Table(name: 'dtb_minimum_delivery_time')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbMinimumDeliveryTime.php:25:#[ORM\Entity(repositoryClass: DtbMinimumDeliveryTimeRepository::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbMinimumDeliveryTime.php:26:class DtbMinimumDeliveryTime extends AbstractEntity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbMinimumDeliveryTime.php:36:    #[ORM\JoinColumn(name: 'delivery_id', nullable: false, referencedColumnName: 'id', options: ['unsigned' => true, 'comment' => '　'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbMinimumDeliveryTime.php:37:    #[ORM\ManyToOne(targetEntity: Delivery::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbMinimumDeliveryTime.php:38:    private Delivery $Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbMinimumDeliveryTime.php:40:    #[ORM\JoinColumn(name: 'delivery_time_id', nullable: false, referencedColumnName: 'id', options: ['unsigned' => true, 'comment' => '　'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbMinimumDeliveryTime.php:41:    #[ORM\ManyToOne(targetEntity: DeliveryTime::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbMinimumDeliveryTime.php:42:    private DeliveryTime $DeliveryTime;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbMinimumDeliveryTime.php:53:    public function setId(int $id): DtbMinimumDeliveryTime
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbMinimumDeliveryTime.php:60:    public function setMinimumArraivalDate(int $minimumArraivalDate): DtbMinimumDeliveryTime
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbMinimumDeliveryTime.php:72:    public function setDelivery(Delivery $Delivery): DtbMinimumDeliveryTime
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbMinimumDeliveryTime.php:74:        $this->Delivery = $Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbMinimumDeliveryTime.php:79:    public function getDelivery(): Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbMinimumDeliveryTime.php:81:        return $this->Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbMinimumDeliveryTime.php:84:    public function setDeliveryTime(DeliveryTime $DeliveryTime): DtbMinimumDeliveryTime
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbMinimumDeliveryTime.php:86:        $this->DeliveryTime = $DeliveryTime;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbMinimumDeliveryTime.php:91:    public function getDeliveryTime(): DeliveryTime
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbMinimumDeliveryTime.php:93:        return $this->DeliveryTime;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbMinimumDeliveryTime.php:96:    public function setPref(Pref $Pref): DtbMinimumDeliveryTime
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryFeeRepository.php:17:use Eccube\Entity\Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryFeeRepository.php:18:use Eccube\Entity\DeliveryFee;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryFeeRepository.php:27: * @extends AbstractRepository<DeliveryFee>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryFeeRepository.php:29:class DeliveryFeeRepository extends AbstractRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryFeeRepository.php:32:     * DeliveryFeeRepository constructor.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryFeeRepository.php:36:        parent::__construct($registry, DeliveryFee::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryFeeRepository.php:44:        Delivery $delivery,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryFeeRepository.php:49:    ): ?DeliveryFee {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryFeeRepository.php:51:            ->where('df.Delivery = :delivery')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryFeeRepository.php:53:            ->setParameter('delivery', $delivery)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryFeeRepository.php:76:            ->where('df.Delivery = :delivery')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryFeeRepository.php:80:            ->setParameter('delivery', $delivery)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/OrderItem.php:86:        public function isDeliveryFee(): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:20:use Eccube\Entity\Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:21:use Eccube\Entity\DeliveryFee;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:22:use Eccube\Entity\DeliveryTime;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:28:use Eccube\Form\Type\Admin\DeliveryType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:30:use Eccube\Repository\DeliveryFeeRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:31:use Eccube\Repository\DeliveryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:32:use Eccube\Repository\DeliveryTimeRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:33:use Eccube\Repository\DtbMinimumDeliveryTimeRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:37:use Eccube\Service\Admin\Setting\Shop\ActionInput\MinimumDeliveryTimeUpdateInput;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:38:use Eccube\Service\Admin\Setting\Shop\MinimumDeliveryTimeUpdateAction;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:49: * Class DeliveryController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:51:class DeliveryController extends AbstractController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:54:     * DeliveryController constructor.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:56:    public function __construct(protected PaymentOptionRepository $paymentOptionRepository, protected DeliveryFeeRepository $deliveryFeeRepository, protected PrefRepository $prefRepository, protected DeliveryRepository $deliveryRepository, protected DeliveryTimeRepository $deliveryTimeRepository, protected SaleTypeRepository $saleTypeRepository, private readonly BaseInfoRepository $baseInfoRepository, private readonly DtbMinimumDeliveryTimeRepository $minimumDeliveryTimeRepository, private readonly MinimumDeliveryTimeUpdateAction $minimumDeliveryTimeUpdateAction)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:63:    #[Route(path: '/%eccube_admin_route%/setting/shop/delivery', name: 'admin_setting_shop_delivery', methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:64:    #[Template(template: '@admin/Setting/Shop/delivery.twig')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:67:        $Deliveries = $this->deliveryRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:90:    #[Route(path: '/%eccube_admin_route%/setting/shop/delivery/new', name: 'admin_setting_shop_delivery_new', methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:91:    #[Route(path: '/%eccube_admin_route%/setting/shop/delivery/{id}/edit', name: 'admin_setting_shop_delivery_edit', requirements: ['id' => '\d+'], methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:92:    #[Template(template: '@admin/Setting/Shop/delivery_edit.twig')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:93:    public function edit(Request $request, EccubeExtension $extension, ?BaseInfo $BaseInfo = null, ?Delivery $Delivery = null): RedirectResponse|array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:99:        if (is_null($Delivery)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:101:            $DeliveryLatest = $this->deliveryRepository->findOneBy([], ['sort_no' => 'DESC']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:104:            if ($DeliveryLatest) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:105:                $sortNo = $DeliveryLatest->getSortNo() + 1;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:108:            $Delivery = new Delivery();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:109:            $Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:116:        /** @var ArrayCollection<int, DeliveryTime> $originalDeliveryTimes */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:117:        $originalDeliveryTimes = new ArrayCollection();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:119:        foreach ($Delivery->getDeliveryTimes() as $DeliveryTime) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:120:            $originalDeliveryTimes->add($DeliveryTime);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:123:        $originalDeliveryFees = new ArrayCollection();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:125:        foreach ($Delivery->getDeliveryFees() as $DeliveryFee) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:126:            $originalDeliveryFees->add($DeliveryFee);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:129:        // FormType: DeliveryFeeの生成
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:133:        $DeliveryFees = $Delivery->getDeliveryFees();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:134:        $SortedDeliveryFees = $DeliveryFees->toArray();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:135:        usort($SortedDeliveryFees, function (DeliveryFee $a, DeliveryFee $b) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:148:        $Delivery->getDeliveryFees()->clear();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:149:        foreach ($SortedDeliveryFees as $DeliveryFee) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:150:            $Delivery->addDeliveryFee($DeliveryFee);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:154:            ->createBuilder(DeliveryType::class, $Delivery);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:159:                'Delivery' => $Delivery,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:161:                'DeliveryFees' => $DeliveryFees,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:171:        foreach ($Delivery->getPaymentOptions() as $PaymentOption) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:175:        $form['delivery_times']->setData($Delivery->getDeliveryTimes());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:183:                $SubmittedDelivery = $form->getData();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:186:                foreach ($originalDeliveryTimes as $DeliveryTime) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:187:                    if (false === $SubmittedDelivery->getDeliveryTimes()->contains($DeliveryTime)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:188:                        $this->entityManager->remove($DeliveryTime);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:191:                foreach ($SubmittedDelivery->getDeliveryTimes() as $DeliveryTime) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:192:                    $DeliveryTime->setBaseInfo($BaseInfo);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:193:                    $DeliveryTime->setDelivery($SubmittedDelivery);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:197:                foreach ($originalDeliveryFees as $DeliveryFee) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:198:                    if ($SubmittedDelivery->getDeliveryFees()->contains($DeliveryFee) === false) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:199:                        $this->entityManager->remove($DeliveryFee);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:202:                foreach ($SubmittedDelivery->getDeliveryFees() as $DeliveryFee) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:203:                    $DeliveryFee->setBaseInfo($BaseInfo);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:204:                    $DeliveryFee->setDelivery($SubmittedDelivery);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:209:                    ->findBy(['delivery_id' => $Delivery->getId()]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:212:                    $SubmittedDelivery->removePaymentOption($PaymentOption);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:215:                $this->entityManager->persist($SubmittedDelivery);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:225:                        ->setDeliveryId($SubmittedDelivery->getId())
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:228:                        ->setDelivery($SubmittedDelivery);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:229:                    $SubmittedDelivery->addPaymentOption($PaymentOption);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:230:                    $this->entityManager->persist($SubmittedDelivery);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:233:                $this->entityManager->persist($SubmittedDelivery);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:240:                        'Delivery' => $Delivery,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:242:                        'DeliveryFees' => $DeliveryFees,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:256:                            $message = trans('admin.setting.shop.delivery.payment_warning', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:265:                return $this->redirectToRoute('admin_setting_shop_delivery_edit', ['id' => $Delivery->getId()]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:271:            'delivery_id' => $Delivery->getId(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:276:    #[Route(path: '/%eccube_admin_route%/setting/shop/delivery/{id}/delete', name: 'admin_setting_shop_delivery_delete', requirements: ['id' => '\d+'], methods: ['DELETE'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:277:    public function delete(Request $request, Delivery $Delivery): RedirectResponse
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:282:            $this->entityManager->remove($Delivery);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:285:            $this->addError(trans('admin.common.delete_error_foreign_key', ['%name%' => $Delivery->getName()]), 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:287:            return $this->redirectToRoute('admin_setting_shop_delivery');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:291:        $Delivs = $this->deliveryRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:295:            if ($Deliv->getId() != $Delivery->getId()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:306:                'Delivery' => $Delivery,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:314:        return $this->redirectToRoute('admin_setting_shop_delivery');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:317:    #[Route(path: '/%eccube_admin_route%/setting/shop/delivery/{id}/visibility', name: 'admin_setting_shop_delivery_visibility', requirements: ['id' => '\d+'], methods: ['PUT'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:318:    public function visibility(Request $request, Delivery $Delivery): RedirectResponse
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:323:        if ($Delivery->isVisible()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:324:            $message = trans('admin.common.to_hide_complete', ['%name%' => $Delivery->getName()]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:325:            $Delivery->setVisible(false);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:327:            $message = trans('admin.common.to_show_complete', ['%name%' => $Delivery->getName()]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:328:            $Delivery->setVisible(true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:330:        $this->entityManager->persist($Delivery);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:336:                'Delivery' => $Delivery,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:344:        return $this->redirectToRoute('admin_setting_shop_delivery');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:350:    #[Route(path: '/%eccube_admin_route%/setting/shop/delivery/{id}/minimum_delivery_time', name: 'admin_setting_shop_delivery_minimum_delivery_time_edit', requirements: ['id' => '\d+'], methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:351:    #[Template(template: '@admin/Setting/Shop/minimum_delivery_time_edit.twig')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:352:    public function minimumDeliveryTimeEdit(Request $request, Delivery $Delivery): RedirectResponse|array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:354:        $minimumDeliveryTimesByPrefId = $this->minimumDeliveryTimeRepository->findByDeliveryIdWithResultKeyToPrefId((string) $Delivery->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:357:        $DeliveryTimes = $Delivery->getDeliveryTimes()->filter(fn (DeliveryTime $dt) => $dt->isVisible())->toArray();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:363:            $this->minimumDeliveryTimeUpdateAction->handle(new MinimumDeliveryTimeUpdateInput($Delivery, $prefDataList));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:364:            $this->addSuccess('admin.setting.shop.delivery.minimum_delivery_time_save_complete', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:366:            return $this->redirectToRoute('admin_setting_shop_delivery_minimum_delivery_time_edit', ['id' => $Delivery->getId()]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:370:            'Delivery' => $Delivery,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:372:            'DeliveryTimes' => $DeliveryTimes,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:373:            'minimumDeliveryTimesByPrefId' => $minimumDeliveryTimesByPrefId,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:380:    #[Route(path: '/%eccube_admin_route%/setting/shop/delivery/sort_no/move', name: 'admin_setting_shop_delivery_sort_no_move', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:389:            foreach ($sortNos as $deliveryId => $sortNo) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:390:                $Delivery = $this->deliveryRepository->find($deliveryId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:391:                $Delivery->setSortNo($sortNo);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/Shop/DeliveryController.php:392:                $this->entityManager->persist($Delivery);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:76:        $trackingNo = isset($searchData['tracking_no']) ? trim((string) $searchData['tracking_no']) : '';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:77:        if ($trackingNo !== '') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:78:            $qb->andWhere('s.trackingNo LIKE :trk')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:79:                ->setParameter('trk', '%'.addcslashes($trackingNo, '%_').'%');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/GenerateDummyDataCommand.php:18:use Eccube\Repository\DeliveryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/GenerateDummyDataCommand.php:31:    public function __construct(protected ?Generator $generator = null, protected ?EntityManagerInterface $entityManager = null, protected ?DeliveryRepository $deliveryRepository = null, protected ?ProductRepository $productRepository = null)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/GenerateDummyDataCommand.php:116:        $Deliveries = $this->deliveryRepository->findAll();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/GenerateDummyDataCommand.php:129:            $Delivery = $Deliveries[$faker->numberBetween(0, count($Deliveries) - 1)];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/GenerateDummyDataCommand.php:143:                $Order = $this->generator->createOrder($Customer, $Product->getProductClasses()->toArray(), $Delivery, $charge, $discount);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveInstructionRepository.php:111:            $qb->andWhere('s.trackingNo IS NOT NULL AND s.trackingNo != :empty_str')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveInstructionRepository.php:115:            $qb->andWhere('s.trackingNo IS NULL OR s.trackingNo = :empty_str_not_done')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:20:use Eccube\Entity\Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:28:use Eccube\Repository\DeliveryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:47: *   vendor/bin/console eccube:smaregi:otc:create-test-order --delivery=otc
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:66:        private readonly DeliveryRepository $deliveryRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:78:            ->addOption('delivery', null, InputOption::VALUE_REQUIRED, 'otc または smooth_otc', 'otc')
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
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:188:            'otc' => Delivery::OTC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:189:            'smooth_otc' => Delivery::SMOOTH_OTC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:217:    private function buildShipping(BaseInfo $baseInfo, Delivery $delivery): Shipping
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiOtcCreateTestOrderCommand.php:225:        $Shipping->setDelivery($delivery);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_order.csv:1:id,customer_id,country_id,pref_id,sex_id,job_id,payment_id,device_type_id,pre_order_id,order_no,message,name01,name02,kana01,kana02,company_name,email,phone_number,postal_code,addr01,addr02,birth,subtotal,discount,delivery_fee_total,charge,tax,total,payment_total,payment_method,note,create_date,update_date,order_date,payment_date,order_status_id
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPlayerRepository.php:132:     * 最新のお問い合わせ番号の次の番号を取得する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_mail_template.csv:6:"5",,eccube.mail.mall.inquiry_receipt,1,"問合受付メール","Mail/Mall/contact_mail.twig","お問い合わせを受け付けました。",0,"2017-03-07 10:14:52","2017-03-07 10:14:52"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:36:use Eccube\Repository\DeliveryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:107:        protected DeliveryRepository $deliveryRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:563:     * Update to Tracking number.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:565:    #[Route(path: '/%eccube_admin_route%/shipping/{id}/tracking_number', name: 'admin_shipping_update_tracking_number', requirements: ['id' => '\d+'], methods: ['PUT'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:566:    public function updateTrackingNumber(Request $request, Shipping $shipping): Response
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:572:        $trackingNumber = $request->get('tracking_number') ?? '';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:573:        $trackingNumber = mb_convert_kana((string) $trackingNumber, 'a', 'utf-8');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:577:            $trackingNumber,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:581:                    ['pattern' => '/^[0-9a-zA-Z-]+$/u', 'message' => trans('admin.order.tracking_number_error')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:598:            $shipping->setTrackingNumber($trackingNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:602:            $message = ['status' => 'OK', 'shipping_id' => $shipping->getId(), 'tracking_number' => $trackingNumber];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:623:            $this->addError('admin.order.delivery_note_parameter_error', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:636:                ->setTitle(trans('admin.order.delivery_note_title__default'))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:637:                ->setMessage1(trans('admin.order.delivery_note_message__default1'))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:638:                ->setMessage2(trans('admin.order.delivery_note_message__default2'))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:639:                ->setMessage3(trans('admin.order.delivery_note_message__default3'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:731:    #[Route(path: '/%eccube_admin_route%/order/print/delivery_slips/{lang}', name: 'admin_delivery_slips_export', requirements: ['lang' => 'ja|en'], methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:732:    public function bulkPrintDeliverySlip(Request $request, string $lang): Response
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:743:        $DeliverySlips = $this->dtbShippingStandbyRepository->generateDeliverySlips($lang !== 'ja', $ids);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:746:        return $this->render("@admin/ShippingStandby/delivery_slips.{$lang}.twig", [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:747:            'DeliverySlips' => $DeliverySlips,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:800:        $DeliveryList = $this->deliveryRepository->findByIsShippingStandbyListExclusion(false);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:801:        $OrderTypes = $this->orderRepository->getOrdersForStandby($conditions, $DeliveryList);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_page.csv:16:"16","お問い合わせ(入力ページ)","contact","Contact/index","2",,,,"2017-03-07 10:14:52","2017-03-07 10:14:52",,,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_page.csv:17:"17","お問い合わせ(完了ページ)","contact_complete","Contact/complete","2",,,,"2017-03-07 10:14:52","2017-03-07 10:14:52","noindex",,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_page.csv:37:"7","MYページ/お届け先一覧","mypage_delivery","Mypage/delivery","2",,,,"2017-03-07 10:14:52","2017-03-07 10:14:52","noindex",,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_page.csv:38:"8","MYページ/お届け先追加","mypage_delivery_new","Mypage/delivery_edit","2",,,,"2017-03-07 10:14:52","2017-03-07 10:14:52","noindex",,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_page.csv:40:"44","MYページ/お届け先編集","mypage_delivery_edit","Mypage/delivery_edit","2",,,,"2017-03-07 01:15:05","2017-03-07 01:15:05","noindex","8",
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_page.csv:44:"48","お問い合わせ(確認ページ)","contact_confirm","Contact/confirm","3",,,,"2020-01-12 10:14:52","2020-01-12 10:14:52","noindex","16",
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_delivery_fee.csv:1:id,delivery_id,base_info_id,pref_id,fee
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:95:    #[ORM\Column(name: 'delivery_fee', type: Types::INTEGER)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:96:    private int $deliveryFee;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:416:    public function getDeliveryFee(): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:418:        return $this->deliveryFee;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:421:    public function setDeliveryFee(int $deliveryFee): DtbBuyOrder
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrder.php:423:        $this->deliveryFee = $deliveryFee;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:41:use Eccube\Repository\DeliveryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:99:     * @param DeliveryRepository                $deliveryRepository      編集画面用：配送業者・お届け時間
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:120:        private readonly DeliveryRepository $deliveryRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:376:        $appendItem(OrderItemType::DELIVERY_FEE, (string) $TargetOrder->getDeliveryFeeTotal(), $shipping instanceof Shipping ? $shipping : null);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:1020:     *     shippingDeliveryTimes: string,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:1030:        foreach ($this->deliveryRepository->findAll() as $Delivery) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:1031:            $deliveryTimes = $Delivery->getDeliveryTimes();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:1032:            foreach ($deliveryTimes as $DeliveryTime) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:1033:                $times[$Delivery->getId()][$DeliveryTime->getId()] = $DeliveryTime->getDeliveryTime();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:1053:            'shippingDeliveryTimes' => $this->serializer->serialize($times, 'json'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:1280:            $DeliveryFee = $this->entityManager->find(OrderItemType::class, OrderItemType::DELIVERY_FEE);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:1288:                ['OrderItemType' => $DeliveryFee, 'TaxType' => $Taxation],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:1312:    #[Route(path: '/%eccube_admin_route%/order/{id}/print/delivery', name: 'admin_order_print_delivery_slips', requirements: ['id' => '\d+'], methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:1313:    public function printDeliverySlip(Request $request, int $id): array|Response
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:1333:        $DeliverySlips = $this->dtbShippingStandbyRepository->generateDeliverySlips($lang !== 'ja', [$Shipping->getId()]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:1336:        return $this->render("@admin/ShippingStandby/delivery_slips.{$lang}.twig", [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:1337:            'DeliverySlips' => $DeliverySlips,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:92:        #[ORM\Column(name: 'delivery_name', type: Types::STRING, length: 255, nullable: true)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:93:        private ?string $shipping_delivery_name = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:98:        #[ORM\Column(name: 'delivery_time', type: Types::STRING, length: 255, nullable: true)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:99:        private ?string $shipping_delivery_time = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:106:        #[ORM\Column(name: 'delivery_date', type: Types::DATETIMETZ_MUTABLE, nullable: true)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:107:        private $shipping_delivery_date;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:117:        #[ORM\Column(name: 'tracking_number', type: Types::STRING, length: 255, nullable: true)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:118:        private ?string $tracking_number = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:162:        #[ORM\ManyToOne(targetEntity: Delivery::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:163:        #[ORM\JoinColumn(name: 'delivery_id', referencedColumnName: 'id')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:164:        private ?Delivery $Delivery = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:385:         * Set shippingDeliveryName.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:387:        public function setShippingDeliveryName(?string $shippingDeliveryName = null): Shipping
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:389:            $this->shipping_delivery_name = $shippingDeliveryName;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:395:         * Get shippingDeliveryName.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:397:        public function getShippingDeliveryName(): ?string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:399:            return $this->shipping_delivery_name;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:403:         * Set shippingDeliveryTime.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:405:        public function setShippingDeliveryTime(?string $shippingDeliveryTime = null): Shipping
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:407:            $this->shipping_delivery_time = $shippingDeliveryTime;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:413:         * Get shippingDeliveryTime.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:415:        public function getShippingDeliveryTime(): ?string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:417:            return $this->shipping_delivery_time;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:421:         * Set shippingDeliveryDate.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:423:        public function setShippingDeliveryDate(?\DateTime $shippingDeliveryDate = null): Shipping
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:425:            $this->shipping_delivery_date = $shippingDeliveryDate;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:431:         * Get shippingDeliveryDate.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:433:        public function getShippingDeliveryDate(): ?\DateTime
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:435:            return $this->shipping_delivery_date;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:605:         * Set delivery.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:607:        public function setDelivery(?Delivery $delivery = null): Shipping
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:609:            $this->Delivery = $delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:615:         * Get delivery.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:617:        public function getDelivery(): ?Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:619:            return $this->Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:663:         * Set trackingNumber
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:665:        public function setTrackingNumber(?string $trackingNumber): Shipping
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:667:            $this->tracking_number = $trackingNumber;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:673:         * Get trackingNumber
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:675:        public function getTrackingNumber(): ?string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:677:            return $this->tracking_number;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingController.php:24:use Eccube\Repository\DeliveryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingController.php:49:    public function __construct(protected MailService $mailService, protected OrderItemRepository $orderItemRepository, protected CategoryRepository $categoryRepository, protected DeliveryRepository $deliveryRepository, protected TaxRuleService $taxRuleService, protected ShippingRepository $shippingRepository, protected SerializerInterface $serializer, protected OrderStateMachine $orderStateMachine, protected PurchaseFlow $orderPurchaseFlow)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingController.php:107:                $newShipping = ['Delivery' => ''];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingController.php:217:        $deliveries = $this->deliveryRepository->findAll();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingController.php:218:        foreach ($deliveries as $Delivery) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingController.php:219:            $deliveryTimes = $Delivery->getDeliveryTimes();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingController.php:220:            foreach ($deliveryTimes as $DeliveryTime) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingController.php:221:                $times[$Delivery->getId()][$DeliveryTime->getId()] = $DeliveryTime->getDeliveryTime();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingController.php:229:            'shippingDeliveryTimes' => $this->serializer->serialize($times, 'json'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/PaymentRepository.php:18:use Eccube\Entity\Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/PaymentRepository.php:61:    public function findPayments(Delivery $delivery, bool $returnType = false): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/PaymentRepository.php:65:            ->where('po.Delivery = (:delivery) AND p.visible = true')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/PaymentRepository.php:67:            ->setParameter('delivery', $delivery)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/PaymentRepository.php:84:     * @param array<int, Delivery> $deliveries
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/PaymentRepository.php:92:        foreach ($deliveries as $Delivery) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/PaymentRepository.php:93:            $p = $this->findPayments($Delivery, $returnType);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/PaymentRepository.php:99:                $saleTypes[$Delivery->getSaleType()->getId()][$payment['id']] = true;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:18:"17","1",,"Eccube\\Entity\\ProductClass","DeliveryDuration","id","発送日目安(ID)","17","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:19:"18","1",,"Eccube\\Entity\\ProductClass","DeliveryDuration","name","発送日目安(名称)","18","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:26:"25","1",,"Eccube\\Entity\\ProductClass","delivery_fee",,"送料","25","0","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:81:"80","3",,"Eccube\\Entity\\Order","delivery_fee_total",,"送料","24","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:118:"117","3",,"Eccube\\Entity\\Shipping","Delivery","id","配送業者(ID)","61","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:119:"118","3",,"Eccube\\Entity\\Shipping","shipping_delivery_name",,"配送業者(名称)","62","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:121:"120","3",,"Eccube\\Entity\\Shipping","shipping_delivery_time",,"お届け時間(名称)","64","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:122:"121","3",,"Eccube\\Entity\\Shipping","shipping_delivery_date",,"お届け希望日","65","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:123:"123","3",,"Eccube\\Entity\\Shipping","shipping_delivery_fee",,"送料","67","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:125:"125","3",,"Eccube\\Entity\\Shipping","tracking_number",,"出荷伝票番号","69","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:151:"151","4",,"Eccube\\Entity\\Order","delivery_fee_total",,"送料","24","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:188:"188","4",,"Eccube\\Entity\\Shipping","Delivery","id","配送業者(ID)","61","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:189:"189","4",,"Eccube\\Entity\\Shipping","shipping_delivery_name",,"配送業者(名称)","62","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:191:"191","4",,"Eccube\\Entity\\Shipping","shipping_delivery_time",,"お届け時間(名称)","64","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:192:"192","4",,"Eccube\\Entity\\Shipping","shipping_delivery_date",,"お届け希望日","65","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:193:"194","4",,"Eccube\\Entity\\Shipping","shipping_delivery_fee",,"送料","67","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:195:"196","4",,"Eccube\\Entity\\Shipping","tracking_number",,"出荷伝票番号","69","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:86:                            <div class="p-hareruya-form-block p-hareruya-entry__delivery-name">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:111:                                                    <div class="c-hareruya-heading--lev4">{{ 'front.mypage.delivery.label_name01'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:113:                                                        <label class="u-hareruya-dsp-visually-hidden" for="{{ form.name.name01.vars.id }}">{{ 'front.mypage.delivery.label_name01'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:120:                                                    <div class="c-hareruya-heading--lev4">{{ 'front.mypage.delivery.label_name02'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:122:                                                        <label class="u-hareruya-dsp-visually-hidden" for="{{ form.name.name02.vars.id }}">{{ 'front.mypage.delivery.label_name02'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:144:                                                    <div class="c-hareruya-heading--lev4">{{ 'front.mypage.delivery.label_kana01'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:146:                                                        <label class="u-hareruya-dsp-visually-hidden" for="{{ form.kana.kana01.vars.id }}">{{ 'front.mypage.delivery.label_kana01'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:153:                                                    <div class="c-hareruya-heading--lev4">{{ 'front.mypage.delivery.label_kana02'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:155:                                                        <label class="u-hareruya-dsp-visually-hidden" for="{{ form.kana.kana02.vars.id }}">{{ 'front.mypage.delivery.label_kana02'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:196:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.postalCode.postalCode01.vars.id }}">{{ 'front.mypage.delivery.postal_label_first'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:201:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.postalCode.postalCode02.vars.id }}">{{ 'front.mypage.delivery.postal_label_second'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:240:                                                <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.pref.vars.id }}">{{ 'front.mypage.delivery.label_pref'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:247:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.addr01.vars.id }}">{{ 'front.mypage.delivery.label_addr01'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:252:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.addr02.vars.id }}">{{ 'front.mypage.delivery.label_addr02'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:270:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.addr01.vars.id }}">{{ 'front.mypage.delivery.label_addr_overseas_1'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:275:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.addr02.vars.id }}">{{ 'front.mypage.delivery.label_addr_overseas_2'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:280:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.addr03.vars.id }}">{{ 'front.mypage.delivery.label_addr_overseas_3'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:299:                                                <label class="u-hareruya-dsp-visually-hidden" for="{{ form.tel.tel01.vars.id }}">{{ 'front.mypage.delivery.label_tel01'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:304:                                                <label class="u-hareruya-dsp-visually-hidden" for="{{ form.tel.tel02.vars.id }}">{{ 'front.mypage.delivery.label_tel02'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:309:                                                <label class="u-hareruya-dsp-visually-hidden" for="{{ form.tel.tel03.vars.id }}">{{ 'front.mypage.delivery.label_tel03'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_delivery_time.csv:1:id,delivery_id,delivery_time,base_info_id,sort_no,create_date,update_date,visible
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_base_info.csv:1:id,country_id,pref_id,company_name,company_kana,postal_code,addr01,addr02,phone_number,business_hour,email01,email02,email03,email04,shop_name,shop_kana,shop_name_eng,update_date,good_traded,message,delivery_free_amount,delivery_free_quantity,option_mypage_order_status_display,option_nostock_hidden,option_favorite_product,option_product_delivery_fee,option_product_tax_rule,option_customer_activate,option_remember_me,option_mail_notifier,authentication_key,option_point,basic_point_rate,point_conversion_rate
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_payment_option.csv:1:delivery_id,base_info_id,payment_id
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php:455:        list($Order, $Delivery) = $this->orderRepository->findForOrderMail($Order->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php:457:        $total = ((int) $Order->getSubtotal() + (int) $Order->getDeliveryFeeTotal() + (int) $Order->getCharge()) - (int) $Order->getDiscount();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php:465:            'Delivery' => $Delivery,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_shipping.csv:1:id,country_id,pref_id,delivery_id,time_id,name01,name02,kana01,kana02,company_name,phone_number,postal_code,addr01,addr02,delivery_name,delivery_time,delivery_date,shipping_date,sort_no,create_date,update_date
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:33:use Eccube\Entity\Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:66:        'order' => 'o.name01', 'orderer' => 'o.id', 'shipping_id' => 's.id', 'purchase_product' => 'oi.product_name', 'quantity' => 'oi.quantity', 'payment_method' => 'o.payment_method', 'order_status' => 'o.OrderStatus', 'purchase_price' => 'o.total', 'shipping_status' => 's.shipping_date', 'tracking_number' => 's.tracking_number', 'delivery' => 's.name01',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:150:     *         tracking_number?:string,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:163:     *         delivery?:Delivery[]|ArrayCollection<int, Delivery>,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:313:        // delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:314:        if (!empty($searchData['delivery']) && count($searchData['delivery']) > 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:316:            foreach ($searchData['delivery'] as $delivery) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:317:                $deliveries[] = $delivery->getId();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:320:                ->andWhere($qb->expr()->in('s.Delivery', ':deliveries'))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:665:            ->join('s.Delivery', 'd')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:712:            $row[] = $shipping->getShippingDeliveryDate() ? $shipping->getShippingDeliveryDate()->format('Y/m/d H:i:s') : '';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:713:            $row[] = $shipping->getShippingDeliveryTime() ?? '';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:715:            $row[] = $order->getDeliveryFeeTotal();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:716:            $row[] = $order->getDeliveryFeeTotal();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:736:            $deliveryId = $shipping->getDelivery()->getId();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:738:            $row[] = isset(self::POST_TYPE[$deliveryId]) ? self::POST_TYPE[$deliveryId] : '';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:739:            $row[] = $shipping->getDelivery()->getName();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:742:            $row[] = isset(self::WORLD_POST_TYPE[$deliveryId]) ? self::WORLD_POST_TYPE[$deliveryId] : '';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:770:     * 店頭受取注文 (Delivery::OTC_GROUP) のうち、スマレジ商品/在庫の連携が未完了な受注を返す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:773:     * - Shipping.Delivery が OTC または SMOOTH_OTC
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:789:            ->where('s.Delivery IN (:deliveryIds)')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:797:            ->setParameter('deliveryIds', Delivery::OTC_GROUP)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:810:     * 店頭受取注文 (Delivery::OTC_GROUP) のうち `smaregi_code` (= 13桁 productCode) が
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:834:            ->andWhere('s.Delivery IN (:deliveryIds)')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:840:            ->setParameter('deliveryIds', Delivery::OTC_GROUP)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1157:     * @param Delivery[] $deliveryList
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1161:    public function getOrdersForStandby(array $conditions, array $deliveryList): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1166:            ->join('o.Shippings', 's', 'WITH', 's.Delivery IN (:deliveryList)')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1168:            ->setParameter('deliveryList', $deliveryList)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1408:                'o.delivery_fee_total',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1441:                'd.id AS delivery_id',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1442:                'd.name AS delivery_name',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1444:                't.id AS delivery_time_id',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1445:                't.delivery_time',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1458:            ->join('s.Delivery', 'd')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1459:            ->leftJoin('d.DeliveryTimes', 't', 'WITH', 't.id = s.time_id')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1528:                    's.Delivery = :otc',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1532:                    's.Delivery = :smoothOtc',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1546:            ->setParameter('otc', Delivery::OTC)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1548:            ->setParameter('smoothOtc', Delivery::SMOOTH_OTC)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1584:                  AND s.delivery_id = :otc
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1628:                'otc' => Delivery::OTC,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1639:     * @return array{Order|null, Delivery|null}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1649:            ->join('s.Delivery', 'd')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1657:        $Delivery = $Order?->getShippings()->first()?->getDelivery();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1659:        return [$Order, $Delivery];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1822:            ->andWhere('s.Delivery IN (:delivery)')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1823:            ->setParameter('delivery', [Delivery::OTC, Delivery::SMOOTH_OTC])
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1923:            ->join('s.Delivery', 'd')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1958:                'd.id AS delivery_id',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1959:                'd.name AS delivery',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:2092:            if ($Order->isDeliverySmoothOtc()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:2115:            if (!$Order->isOtcSmaregiLinkedOrder() || $Order->isDeliverySmoothOtc()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:136:     * @method int|null getPrimaryDeliveryId()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:137:     * @method bool isDeliveryOtc()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:138:     * @method bool isDeliverySmoothOtc()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:509:        #[ORM\Column(name: 'delivery_fee_total', type: Types::DECIMAL, precision: 12, scale: 2, options: ['unsigned' => true, 'default' => 0])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:510:        private ?string $delivery_fee_total = '0';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:808:                ->setDeliveryFeeTotal('0');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1148:         * Set deliveryFeeTotal.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1150:         * @param string $deliveryFeeTotal
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1155:        public function setDeliveryFeeTotal($deliveryFeeTotal): static
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1157:            $this->delivery_fee_total = $deliveryFeeTotal;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1163:         * Get deliveryFeeTotal.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1166:        public function getDeliveryFeeTotal(): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1168:            return $this->delivery_fee_total;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2335:         * 先頭 Shipping の Delivery ID を返す。Shipping が無い場合は null。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2338:         * また同一受注内の全 Shipping は同一 Delivery 種別であることを前提とする。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2340:        public function getPrimaryDeliveryId(): ?int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2343:                $Delivery = $Shipping->getDelivery();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2345:                return $Delivery?->getId();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2354:        public function isDeliveryOtc(): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2356:            return $this->getPrimaryDeliveryId() === Delivery::OTC;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2362:        public function isDeliverySmoothOtc(): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2364:            return $this->getPrimaryDeliveryId() === Delivery::SMOOTH_OTC;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2454:            if ($this->isDeliverySmoothOtc() && $this->hasSmaregiTransactionId()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2459:            if ($this->isDeliveryOtc() && $this->getNextOrderId() !== null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2468:         * Delivery::OTC / smaregi_transaction_id なし / next_order_id なし。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2473:            return $this->isDeliveryOtc()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2480:         * Delivery::OTC 以外 かつ smaregi_transaction_id なし。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2484:            return !$this->isDeliveryOtc() && !$this->hasSmaregiTransactionId();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:235:    public function generateDeliverySlips(bool $isAbroad, array $ids = []): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:257:            ->join('s.Delivery', 'd', 'WITH', 'd.isAbroad = :isAbroad')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:297:                'd.id AS delivery_id',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:298:                'd.name AS delivery',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbShippingStandbyRepository.php:341:            $total = ($items[$key]['subtotal'] + $items[$key]['delivery_fee_total'] + $items[$key]['charge']) - $items[$key]['discount'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php:326:                'id' => 'delivery_date_id',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/CsvImportController.php:135:            if (isset($row[$columnNames['tracking_number']])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/CsvImportController.php:137:                if (!preg_match('/^[0-9a-zA-Z-]*$/u', $row[$columnNames['tracking_number']])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/CsvImportController.php:138:                    $errors[] = trans('admin.common.csv_invalid_format_line_name', ['%line%' => $line + 1, '%name%' => $columnNames['tracking_number']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/CsvImportController.php:142:                $Shipping->setTrackingNumber($row[$columnNames['tracking_number']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/CsvImportController.php:208:            'tracking_number' => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/CsvImportController.php:209:                'name' => trans('admin.order.shipping_csv.tracking_number_col'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/CsvImportController.php:210:                'description' => trans('admin.order.shipping_csv.tracking_number_description'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryDurationRepository.php:17:use Eccube\Entity\DeliveryDuration;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryDurationRepository.php:20: * DeliveryDurationRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryDurationRepository.php:25: * @extends AbstractRepository<DeliveryDuration>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryDurationRepository.php:27:class DeliveryDurationRepository extends AbstractRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryDurationRepository.php:31:        parent::__construct($registry, DeliveryDuration::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbSellGroup.php:23:use Eccube\Entity\Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbSellGroup.php:194:     * @var Collection<int, Delivery>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbSellGroup.php:196:    #[ORM\JoinTable(name: 'dtb_sell_group_delivery')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbSellGroup.php:198:    #[ORM\InverseJoinColumn(name: 'delivery_id', referencedColumnName: 'id')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbSellGroup.php:199:    #[ORM\ManyToMany(targetEntity: Delivery::class, inversedBy: 'SellGroups')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbSellGroup.php:202:    public function addDelivery(Delivery $delivery): MtbSellGroup
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbSellGroup.php:204:        $this->Deliveries[] = $delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbSellGroup.php:209:    public function removeDelivery(Delivery $delivery): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbSellGroup.php:211:        return $this->Deliveries->removeElement($delivery);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbSellGroup.php:215:     * @return Collection<int, Delivery>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:21:use Eccube\Entity\Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:34: * @extends AbstractRepository<Delivery>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:36:class DeliveryRepository extends AbstractRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:62:        parent::__construct($registry, Delivery::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:71:     * @return array<int, Delivery>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:98:     * @return array<int, Delivery>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:105:        foreach ($d as $Delivery) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:106:            $paymentOptions = $Delivery->getPaymentOptions();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:112:                            $arr[$Delivery->getId()] = $Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:130:     * @param bool $isDeliveryFree
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:132:     * @return array<int, Delivery>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:139:        bool $isDeliveryFree = false): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:171:            SELECT o.id, s.delivery_id
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:180:            GROUP BY o.id, s.delivery_id
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:185:            ->addScalarResult('delivery_id', 'delivery_id', 'integer');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:200:            $parameters['bundle'] = Delivery::BUNDLE;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:203:        if ($isDeliveryFree) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:205:            $parameters['yu_packet'] = Delivery::YU_PACKET;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:218:                $parameters['small_packet'] = Delivery::SMALL_PACKET;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:275:     * @param array<int, array{delivery_id:int|string, id?:int|string}> $orderResult
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DeliveryRepository.php:283:            if ($order['delivery_id'] === Delivery::BUNDLE) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:20:use Eccube\Entity\Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:24:use Eccube\Repository\DeliveryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:52:    public function __construct(protected OrderRepository $orderRepository, protected DeliveryRepository $deliveryRepository, protected PaymentRepository $paymentRepository, protected BaseInfoRepository $baseInfoRepository, protected Context $requestContext, protected TranslatorInterface $translator)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:243:                    if (!empty($Shipping['Delivery'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:244:                        $Delivery = $this->deliveryRepository->find($Shipping['Delivery']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:245:                        if ($Delivery) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:246:                            $Deliveries[] = $Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:412:            + (int) $Order->getDeliveryFeeTotal()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:419:     * @return Delivery[]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:425:            $Delivery = $Shipping->getDelivery();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:426:            if ($Delivery->isVisible()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:427:                $Deliveries[] = $Shipping->getDelivery();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:438:     * @param array<int, Delivery> $Deliveries
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:448:        foreach ($Deliveries as $Delivery) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:449:            $PaymentOptions = $Delivery->getPaymentOptions();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:461:                    $PaymentsByDeliveries[$Delivery->getId()][] = $Payment;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/ShoppingMultipleType.php:16:use Eccube\Entity\Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/ShoppingMultipleType.php:17:use Eccube\Entity\DeliveryTime;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/ShoppingMultipleType.php:35:        $delivery = $options['delivery'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/ShoppingMultipleType.php:36:        $deliveryDurations = $options['deliveryDurations'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/ShoppingMultipleType.php:39:            ->add('delivery', EntityType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/ShoppingMultipleType.php:40:                'class' => Delivery::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/ShoppingMultipleType.php:43:                'data' => $delivery,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/ShoppingMultipleType.php:45:            ->add('deliveryDuration', ChoiceType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/ShoppingMultipleType.php:46:                'choices' => array_flip($deliveryDurations),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/ShoppingMultipleType.php:50:            ->add('deliveryTime', EntityType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/ShoppingMultipleType.php:51:                'class' => DeliveryTime::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/ShoppingMultipleType.php:52:                'choice_label' => 'deliveryTime',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/ShoppingMultipleType.php:53:                'choices' => $delivery->getDeliveryTimes(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/ShoppingMultipleType.php:67:            'delivery' => null,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/ShoppingMultipleType.php:68:            'deliveryDurations' => [],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:400:    #[Route(path: '/%eccube_admin_route%/standby/{id}/print/delivery/{lang}', name: 'admin_shipping_standby_print_delivery_slips', requirements: ['id' => '\d+', 'lang' => 'ja|en'], methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:401:    public function printDeliverySlips(Request $request, int $id, string $lang): Response
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:436:        $DeliverySlips = $this->shippingStandbyRepository->generateDeliverySlips($lang !== 'ja', $shippingIdList);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:439:        return $this->render("@admin/ShippingStandby/delivery_slips.{$lang}.twig", [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:440:            'DeliverySlips' => $DeliverySlips,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:39:use Eccube\Repository\DeliveryDurationRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:104:        protected DeliveryDurationRepository $deliveryDurationRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:346:                            if ($this->MallInfo->isOptionProductDeliveryFee()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:347:                                if (isset($row[$headerByKey['delivery_fee']]) && StringUtil::isNotBlank($row[$headerByKey['delivery_fee']])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:348:                                    $deliveryFee = str_replace(',', '', $row[$headerByKey['delivery_fee']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:349:                                    $errors = $this->validator->validate($deliveryFee, new GreaterThanOrEqual(['value' => 0]));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:351:                                        $ProductClassOrg->setDeliveryFee($deliveryFee);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:353:                                        $message = trans('admin.common.csv_invalid_greater_than_zero', ['%line%' => $line, '%name%' => $headerByKey['delivery_fee']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:471:                                    if ($this->MallInfo->isOptionProductDeliveryFee()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:472:                                        if (isset($row[$headerByKey['delivery_fee']]) && StringUtil::isNotBlank($row[$headerByKey['delivery_fee']])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:473:                                            $deliveryFee = str_replace(',', '', $row[$headerByKey['delivery_fee']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:474:                                            $errors = $this->validator->validate($deliveryFee, new GreaterThanOrEqual(['value' => 0]));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:476:                                                $pc->setDeliveryFee($deliveryFee);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:478:                                                $message = trans('admin.common.csv_invalid_greater_than_zero', ['%line%' => $line, '%name%' => $headerByKey['delivery_fee']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:589:                                    if ($this->MallInfo->isOptionProductDeliveryFee()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:590:                                        if (isset($row[$headerByKey['delivery_fee']]) && StringUtil::isNotBlank($row[$headerByKey['delivery_fee']])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:591:                                            $deliveryFee = str_replace(',', '', $row[$headerByKey['delivery_fee']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:592:                                            $errors = $this->validator->validate($deliveryFee, new GreaterThanOrEqual(['value' => 0]));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:594:                                                $ProductClass->setDeliveryFee($deliveryFee);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:596:                                                $message = trans('admin.common.csv_invalid_greater_than_zero', ['%line%' => $line, '%name%' => $headerByKey['delivery_fee']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1528:        if (isset($row[$headerByKey['delivery_date']]) && StringUtil::isNotBlank($row[$headerByKey['delivery_date']])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1529:            if (preg_match('/^\d+$/', (string) $row[$headerByKey['delivery_date']])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1530:                $DeliveryDuration = $this->deliveryDurationRepository->find($row[$headerByKey['delivery_date']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1531:                if (!$DeliveryDuration) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1532:                    $message = trans('admin.common.csv_invalid_not_found', ['%line%' => $line, '%name%' => $headerByKey['delivery_date']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1535:                    $ProductClass->setDeliveryDuration($DeliveryDuration);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1538:                $message = trans('admin.common.csv_invalid_not_found', ['%line%' => $line, '%name%' => $headerByKey['delivery_date']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1612:        if ($this->MallInfo->isOptionProductDeliveryFee()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1613:            if (isset($row[$headerByKey['delivery_fee']]) && StringUtil::isNotBlank($row[$headerByKey['delivery_fee']])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1614:                $delivery_fee = str_replace(',', '', $row[$headerByKey['delivery_fee']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1615:                $errors = $this->validator->validate($delivery_fee, new GreaterThanOrEqual(['value' => 0]));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1617:                    $ProductClass->setDeliveryFee($delivery_fee);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1620:                        ['%line%' => $line, '%name%' => $headerByKey['delivery_fee']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1706:        if (isset($row[$headerByKey['delivery_date']]) && $row[$headerByKey['delivery_date']] != '') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1707:            if (preg_match('/^\d+$/', (string) $row[$headerByKey['delivery_date']])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1708:                $DeliveryDuration = $this->deliveryDurationRepository->find($row[$headerByKey['delivery_date']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1709:                if (!$DeliveryDuration) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1710:                    $message = trans('admin.common.csv_invalid_not_found', ['%line%' => $line, '%name%' => $headerByKey['delivery_date']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1713:                    $ProductClass->setDeliveryDuration($DeliveryDuration);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1716:                $message = trans('admin.common.csv_invalid_not_found', ['%line%' => $line, '%name%' => $headerByKey['delivery_date']]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1956:            trans('admin.product.product_csv.delivery_duration_col') => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1957:                'id' => 'delivery_date',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1958:                'description' => 'admin.product.product_csv.delivery_duration_description',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1991:            trans('admin.product.product_csv.delivery_fee_col') => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1992:                'id' => 'delivery_fee',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CsvImportController.php:1993:                'description' => 'admin.product.product_csv.delivery_fee_description',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbMinimumDeliveryTimeRepository.php:19:use Eccube\Entity\DtbMinimumDeliveryTime;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbMinimumDeliveryTimeRepository.php:23: * @extends AbstractRepository<DtbMinimumDeliveryTime>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbMinimumDeliveryTimeRepository.php:25:class DtbMinimumDeliveryTimeRepository extends AbstractRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbMinimumDeliveryTimeRepository.php:29:        parent::__construct($registry, DtbMinimumDeliveryTime::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbMinimumDeliveryTimeRepository.php:33:     * @return array<int, DtbMinimumDeliveryTime>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbMinimumDeliveryTimeRepository.php:35:    public function findByDeliveryIdWithResultKeyToPrefId(string $deliveryId): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbMinimumDeliveryTimeRepository.php:37:        /** @var DtbMinimumDeliveryTime[] $minimumDeliveryTimes */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbMinimumDeliveryTimeRepository.php:38:        $minimumDeliveryTimes = $this->createQueryBuilder('mdt')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbMinimumDeliveryTimeRepository.php:41:            ->where('mdt.Delivery = :deliveryId')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbMinimumDeliveryTimeRepository.php:43:            ->setParameter('deliveryId', $deliveryId)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbMinimumDeliveryTimeRepository.php:50:        $minimumDeliveryTimesByPrefId = [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbMinimumDeliveryTimeRepository.php:51:        foreach ($minimumDeliveryTimes as $minimumDeliveryTime) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbMinimumDeliveryTimeRepository.php:52:            $minimumDeliveryTimesByPrefId[$minimumDeliveryTime->getPref()->getId()] = $minimumDeliveryTime;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbMinimumDeliveryTimeRepository.php:55:        return $minimumDeliveryTimesByPrefId;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:52:            const $datetime = $('[data-js-delivery-datetime]');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:58:            const $dateSelect = $datetime.find('select[id$="_shipping_delivery_date"]');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:59:            const $timeSelect = $datetime.find('select[id$="_DeliveryTime"]');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:127:    {% set delivery = Order.Shippings.0.Delivery %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:128:    {% set isDeliveryOTC = delivery.id is defined and delivery.id in constant('Eccube\\Entity\\Delivery::OTC_GROUP') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:129:    {% set canUsePoint = delivery.id is defined and delivery.id != constant('Eccube\\Entity\\Delivery::OTC') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:189:                                            <p class="p-hareruya-shipping__address-tel"><abbr title="{{ 'front.shopping.delivery.phone_number_short'|trans }}">{{ 'front.shopping.delivery.phone_number_short'|trans }}:</abbr> <span class="customer-phone_number">{{ Order.phone_number }}</span></p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:196:                            {% if not isDeliveryOTC and isMainShop %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:200:                                            <h2 class="c-hareruya-heading--lev3">{{ 'front.shopping.delivery_info'|trans }}</h2>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:206:                                                    <legend class="p-hareruya-shipping__address-legend u-hareruya-dsp-visually-hidden">{{ 'front.shopping.delivery_info'|trans }}</legend>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:216:                                                                            {{ 'front.shopping.delivery.membership_information_address'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:224:                                                                    <p class="p-hareruya-shipping__address-tel"><abbr title="{{ 'front.shopping.delivery.phone_number_short'|trans }}">{{ 'front.shopping.delivery.phone_number_short'|trans }}:</abbr> {{ CustomerAddress.phone_number }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:233:                                                    <button class="c-hareruya-btn c-hareruya-btn--sm u-hareruya-w-full" type="button" data-id="{{ shipping.id }}" data-trigger="click" data-submit="true" data-path="{{ path('shopping_shipping', {'id': shipping.id}) }}">{{ 'front.shopping.delivery.change'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:234:                                                    <button class="c-hareruya-btn c-hareruya-btn--sm u-hareruya-w-full" type="button" data-id="{{ shipping.id }}" data-trigger="click" data-path="{{ path('shopping_shipping_edit', {'id': shipping.id}) }}">{{ 'front.shopping.delivery.add'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:292:                            <section class="p-hareruya-shipping__section p-hareruya-shipping__delivery-method-selector">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:295:                                        <h2 class="c-hareruya-heading--lev3">{{ 'front.shopping.delivery_method'|trans }}</h2>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:296:                                        <button class="p-hareruya-shipping__help" type="button" data-js-modal-trigger="shipping-help-modal-{{ idx }}" aria-controls="shipping-help-modal-{{ idx }}"><span class="c-hareruya-text--link">{{ 'front.shopping.delivery_modal.heading'|trans }}</span><span class="c-hareruya-icon--sm icon-hareruya-help" aria-hidden="true"></span></button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:303:                                                            <h3 class="c-hareruya-heading--lev3">{{ 'front.shopping.delivery_modal.heading'|trans }}</h3>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:307:                                                        <h4 class="c-hareruya-heading--lev4">{{ 'front.shopping.delivery_modal.section_title'|trans }}</h4>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:308:                                                        <p class="c-hareruya-text">{{ 'front.shopping.delivery_modal.intro'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:310:                                                            <dt class="u-hareruya-mt20">{{ 'front.shopping.delivery_modal.yupacket.title'|trans }}</dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:313:                                                                    <li>{{ 'front.shopping.delivery_modal.yupacket.li1'|trans }}</li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:314:                                                                    <li>{{ 'front.shopping.delivery_modal.yupacket.li2'|trans }}</li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:315:                                                                    <li>{{ 'front.shopping.delivery_modal.yupacket.li3'|trans }}</li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:318:                                                                    <li>{{ 'front.shopping.delivery_modal.yupacket.note1'|trans }}</li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:319:                                                                    <li>{{ 'front.shopping.delivery_modal.yupacket.note2'|trans }}</li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:320:                                                                    <li>{{ 'front.shopping.delivery_modal.yupacket.note3'|trans }}</li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:321:                                                                    <li>{{ 'front.shopping.delivery_modal.yupacket.note4'|trans }}</li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:324:                                                            <dt class="u-hareruya-mt20">{{ 'front.shopping.delivery_modal.yupack.title'|trans }}</dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:327:                                                                    <li>{{ 'front.shopping.delivery_modal.yupack.li1'|trans }}</li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:328:                                                                    <li>{{ 'front.shopping.delivery_modal.yupack.li2'|trans }}</li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:329:                                                                    <li>{{ 'front.shopping.delivery_modal.yupack.li3'|trans }}</li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:332:                                                                    <li>{{ 'front.shopping.delivery_modal.yupack.note1'|trans }}</li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:333:                                                                    <li>{{ 'front.shopping.delivery_modal.yupack.note2'|trans }}</li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:334:                                                                    <li>{{ 'front.shopping.delivery_modal.yupack.note3'|trans }}</li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:335:                                                                    <li>{{ 'front.shopping.delivery_modal.yupack.note4'|trans }}</li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:338:                                                            <dt class="u-hareruya-mt20">{{ 'front.shopping.delivery_modal.combined.title'|trans }}</dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:341:                                                                    <li>{{ 'front.shopping.delivery_modal.combined.li1'|trans }}</li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:342:                                                                    <li>{{ 'front.shopping.delivery_modal.combined.li2'|trans }}</li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:343:                                                                    <li>{{ 'front.shopping.delivery_modal.combined.li3'|trans }}</li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:346:                                                                    <li>{{ 'front.shopping.delivery_modal.combined.note1'|trans }}</li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:347:                                                                    <li>{{ 'front.shopping.delivery_modal.combined.note2'|trans }}</li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:348:                                                                    <li>{{ 'front.shopping.delivery_modal.combined.note3'|trans }}</li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:349:                                                                    <li>{{ 'front.shopping.delivery_modal.combined.note4'|trans }}</li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:350:                                                                    <li>{{ 'front.shopping.delivery_modal.combined.note5'|trans }}</li>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:360:                                        <div class="p-hareruya-shipping__delivery">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:361:                                            <div class="p-hareruya-shipping__delivery-method">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:362:                                                <fieldset class="p-hareruya-shipping__delivery-radio-fieldset">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:363:                                                    <legend class="p-hareruya-shipping__delivery-method-label">{{ 'front.shopping.delivery_provider'|trans }}</legend>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:365:                                                        {{ form_widget(form.Shippings[idx].Delivery, { 'attr': { 'class': 'form-control', 'data-trigger': 'change' }}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:366:                                                        {{ form_errors(form.Shippings[idx].Delivery) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:370:                                                {% if isDeliveryOTC and app.user is not null and app.user.Player is defined and app.user.Player and app.user.Player.CustomerGroup is defined and app.user.Player.CustomerGroup and not app.user.Player.CustomerGroup.isOtcGroup() %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:371:                                                    <div class="p-hareruya-shipping__delivery-same-day">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:372:                                                        <label class="p-hareruya-shipping__delivery-same-day-label">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:377:                                                    <div class="p-hareruya-shipping__delivery-notice">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:378:                                                        <p class="p-hareruya-shipping__delivery-notice-title">{{ 'front.shopping.otc_notice.title'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:379:                                                        <ul class="p-hareruya-shipping__delivery-notice-list">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:386:                                                {% set hasDeliveryDates = form.Shippings[idx].shipping_delivery_date.vars.choices|length > 0 %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:387:                                                {% set hasDeliveryTimes = form.Shippings[idx].DeliveryTime.vars.choices|length > 0 %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:388:                                                {% if not isDeliveryOTC and isMainShop and (hasDeliveryDates or hasDeliveryTimes) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:389:                                                    <div class="p-hareruya-shipping__delivery-datetime" data-js-delivery-datetime data-time-id="{{ timeId|default(0) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:390:                                                        <label class="p-hareruya-shipping__delivery-datetime-label" for="{{ form.Shippings[idx].shipping_delivery_date.vars.id }}">{{ 'front.shopping.delivery_date'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:392:                                                            {{ form_widget(form.Shippings[idx].shipping_delivery_date, {'attr': {'class': 'form-control'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:395:                                                        {{ form_errors(form.Shippings[idx].shipping_delivery_date) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:396:                                                        <label class="p-hareruya-shipping__delivery-datetime-label" for="{{ form.Shippings[idx].DeliveryTime.vars.id }}">{{ 'front.shopping.delivery_time'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:398:                                                            {{ form_widget(form.Shippings[idx].DeliveryTime, {'attr': {'class': 'form-control'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:401:                                                        {{ form_errors(form.Shippings[idx].DeliveryTime) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:504:                                                {% set payment_total_before_point = Order.subtotal + Order.deliveryFeeTotal + Order.charge %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:559:                                    {% if not isDeliveryOTC %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:704:                                    <dt class="p-hareruya-shipping__summary-label">{{ 'common.delivery_fee'|trans }}</dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:705:                                    <dd class="p-hareruya-shipping__summary-value">{{ Order.deliveryFeeTotal|price }}</dd>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/CardCsvController.php:324:                'id' => 'delivery_date_id',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:20:use Eccube\Entity\Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:21:use Eccube\Entity\DeliveryTime;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:24:use Eccube\Repository\DeliveryFeeRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:25:use Eccube\Repository\DeliveryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:26:use Eccube\Repository\DtbMinimumDeliveryTimeRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:44:    public function __construct(protected EccubeConfig $eccubeConfig, protected DeliveryRepository $deliveryRepository, protected DeliveryFeeRepository $deliveryFeeRepository, protected CartService $cartService, private readonly DtbMinimumDeliveryTimeRepository $minimumDeliveryTimeRepository, private readonly MtbOptionRepository $mtbOptionRepository, private readonly ShoppingService $shoppingService, private readonly TranslatorInterface $translator, private readonly RequestStack $requestStack)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:100:                $isDeliveryFree = false;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:103:                if ($BaseInfo->getDeliveryFreeQuantity()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:104:                    if (bccomp((string) $BaseInfo->getDeliveryFreeQuantity(), $targetCart->getQuantity()) > 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:105:                        $quantity = (int) bcsub((string) $BaseInfo->getDeliveryFreeQuantity(), $targetCart->getQuantity());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:107:                        $isDeliveryFree = true;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:111:                if ($BaseInfo->getDeliveryFreeAmount()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:112:                    if (!$isDeliveryFree && $BaseInfo->getDeliveryFreeAmount() <= $targetCart->getTotalPrice()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:113:                        $isDeliveryFree = true;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:120:                    $Deliveries = $this->deliveryRepository->findDeliveriesForOrder(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:125:                        $isDeliveryFree,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:129:                    $Deliveries = $this->deliveryRepository->findBy([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:130:                        'id' => [Delivery::OTC, Delivery::SMOOTH_OTC],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:138:                $currentDelivery = $Shipping->getDelivery();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:139:                $isCurrentDeliveryAvailable = $currentDelivery !== null && in_array($currentDelivery, $Deliveries, true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:140:                if (!$isCurrentDeliveryAvailable) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:141:                    $currentDelivery = $Deliveries[0] ?? null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:143:                $Shipping->setDelivery($currentDelivery);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:147:                    'Delivery',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:151:                        'label' => 'shipping.label.delivery_hour',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:152:                        'class' => Delivery::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:158:                        'data' => $currentDelivery,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:173:                $deliveryDurations = [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:174:                $deliveryDateOptions = $this->resolveDeliveryDateOptions($Shipping);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:176:                if ($deliveryDateOptions !== null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:177:                    $choices = $this->shoppingService->buildDeliveryDateChoices(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:178:                        $deliveryDateOptions['minDate'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:179:                        $deliveryDateOptions['selectDays'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:193:                        $deliveryDurations[$formatted] = $formatted.'('.$dateFormatter->format($day).')';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:199:                    'shipping_delivery_date',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:202:                        'choices' => array_flip($deliveryDurations),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:206:                        'data' => $Shipping->getShippingDeliveryDate() ? $Shipping->getShippingDeliveryDate()->format('Y/m/d') : null,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:221:                $ShippingDeliveryTime = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:222:                $DeliveryTimes = [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:223:                $Delivery = $Shipping->getDelivery();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:224:                if ($Delivery) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:225:                    $DeliveryTimes = $Delivery->getDeliveryTimes();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:226:                    $DeliveryTimes = $DeliveryTimes->filter(fn (DeliveryTime $DeliveryTime) => $DeliveryTime->isVisible());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:228:                    foreach ($DeliveryTimes as $deliveryTime) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:229:                        if ($deliveryTime->getId() == $Shipping->getTimeId()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:230:                            $ShippingDeliveryTime = $deliveryTime;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:238:                    'DeliveryTime',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:241:                        'label' => 'front.shopping.delivery_time',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:242:                        'class' => DeliveryTime::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:243:                        'choice_label' => fn (DeliveryTime $DeliveryTime) => $this->translateDeliveryTimeLabel($DeliveryTime->getDeliveryTime()),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:244:                        'choices' => $DeliveryTimes,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:248:                        'data' => $ShippingDeliveryTime,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:260:            /** @var Delivery|null $Delivery */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:261:            $Delivery = $form['Delivery']->getData();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:262:            if ($Delivery) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:263:                $Shipping->setShippingDeliveryName($Delivery->getName());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:265:                $Shipping->setShippingDeliveryName();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:267:            $DeliveryDate = $form['shipping_delivery_date']->getData();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:268:            if ($DeliveryDate) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:269:                $Shipping->setShippingDeliveryDate(new \DateTime($DeliveryDate));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:271:                $Shipping->setShippingDeliveryDate();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:274:            $DeliveryTime = $form['DeliveryTime']->getData();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:275:            if ($DeliveryTime) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:276:                $Shipping->setShippingDeliveryTime($DeliveryTime->getDeliveryTime());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:277:                $Shipping->setTimeId($DeliveryTime->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:279:                $Shipping->setShippingDeliveryTime();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:289:     * ゆうパック等: DtbMinimumDeliveryTime（都道府県別）+ eccube_shopping_max_lead_time（9日）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:290:     * 未設定時: 注文商品の DeliveryDuration + eccube_deliv_date_end_max（21日）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:294:    private function resolveDeliveryDateOptions(Shipping $Shipping): ?array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:296:        $Delivery = $Shipping->getDelivery();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:297:        if ($Delivery === null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:303:            $minimumDeliveryTimesByPrefId = $this->minimumDeliveryTimeRepository->findByDeliveryIdWithResultKeyToPrefId((string) $Delivery->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:304:            $entry = $minimumDeliveryTimesByPrefId[$Pref->getId()] ?? null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:319:        $minDate = $this->shoppingService->getMinDeliveryDateOffset($Order);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:337:    private function translateDeliveryTimeLabel(string $deliveryTime): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/ShippingType.php:342:        return $this->translator->trans(sprintf('admin.%s.%s', $deliveryTime, $locale));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbRegionRestriction.php:23:use Eccube\Entity\Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbRegionRestriction.php:120:     * @var Collection<int, Delivery>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbRegionRestriction.php:122:    #[ORM\JoinTable(name: 'dtb_region_restriction_delivery')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbRegionRestriction.php:124:    #[ORM\InverseJoinColumn(name: 'delivery_id', referencedColumnName: 'id')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbRegionRestriction.php:125:    #[ORM\ManyToMany(targetEntity: Delivery::class, inversedBy: 'RegionRestrictions')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbRegionRestriction.php:128:    public function addDelivery(Delivery $Delivery): MtbRegionRestriction
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbRegionRestriction.php:130:        $this->Deliveries[] = $Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbRegionRestriction.php:135:    public function removeDelivery(Delivery $Delivery): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbRegionRestriction.php:137:        return $this->Deliveries->removeElement($Delivery);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbRegionRestriction.php:141:     * @return Collection<int, Delivery>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.en.twig:86:                            <div class="p-hareruya-form-block p-hareruya-entry__delivery-name">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.en.twig:103:                                    <label class="p-hareruya-form-block__label c-hareruya-heading--lev4" for="{{ form.name.name02.vars.id }}">{{ 'front.mypage.delivery.label_name02'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.en.twig:110:                                            placeholder: 'front.mypage.delivery.placeholder_first_name'|trans,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.en.twig:119:                                    <label class="p-hareruya-form-block__label c-hareruya-heading--lev4" for="{{ form.name.name01.vars.id }}">{{ 'front.mypage.delivery.label_name01'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.en.twig:126:                                            placeholder: 'front.mypage.delivery.placeholder_last_name'|trans,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.en.twig:160:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.postalCode.postalCode01.vars.id }}">{{ 'front.mypage.delivery.postal_label_first'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.en.twig:165:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.postalCode.postalCode02.vars.id }}">{{ 'front.mypage.delivery.postal_label_second'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.en.twig:207:                                                <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.pref.vars.id }}">{{ 'front.mypage.delivery.label_pref'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.en.twig:214:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.addr01.vars.id }}">{{ 'front.mypage.delivery.label_addr01'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.en.twig:219:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.addr02.vars.id }}">{{ 'front.mypage.delivery.label_addr02'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.en.twig:237:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.addr01.vars.id }}">{{ 'front.mypage.delivery.label_addr_overseas_1'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.en.twig:242:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.addr02.vars.id }}">{{ 'front.mypage.delivery.label_addr_overseas_2'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.en.twig:247:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.addr03.vars.id }}">{{ 'front.mypage.delivery.label_addr_overseas_3'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.en.twig:266:                                                <label class="u-hareruya-dsp-visually-hidden" for="{{ form.tel.tel01.vars.id }}">{{ 'front.mypage.delivery.label_tel01'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.en.twig:271:                                                <label class="u-hareruya-dsp-visually-hidden" for="{{ form.tel.tel02.vars.id }}">{{ 'front.mypage.delivery.label_tel02'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.en.twig:276:                                                <label class="u-hareruya-dsp-visually-hidden" for="{{ form.tel.tel03.vars.id }}">{{ 'front.mypage.delivery.label_tel03'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/delivery_confirm.twig:15:{% set mypageno = 'delivery' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/delivery_confirm.twig:20:    <div class="p-hareruya-entry p-hareruya-entry--confirm p-hareruya-entry--delivery">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/delivery_confirm.twig:50:                <h1 class="c-hareruya-heading--lev1">{{ 'front.mypage.title.delivery'|trans }}</h1>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/delivery_confirm.twig:51:                <p class="p-hareruya-entry__title-text">{{ 'front.mypage.delivery.confirm_intro'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/delivery_confirm.twig:59:                        <div class="p-hareruya-form-block p-hareruya-entry__delivery-name">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/delivery_confirm.twig:70:                                <span class="p-hareruya-form-block__label c-hareruya-heading--lev4">{{ 'front.mypage.delivery.shipping_name_label'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:108:        #[ORM\Column(name: 'delivery_free_amount', type: Types::DECIMAL, precision: 12, scale: 2, nullable: true, options: ['unsigned' => true])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:109:        private ?string $delivery_free_amount = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:111:        #[ORM\Column(name: 'delivery_free_quantity', type: Types::INTEGER, nullable: true, options: ['unsigned' => true])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:112:        private ?int $delivery_free_quantity = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:123:        #[ORM\Column(name: 'option_product_delivery_fee', type: Types::BOOLEAN, options: ['default' => false])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:124:        private ?bool $option_product_delivery_fee = false;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:199:         * @var Collection<int, Delivery>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:201:        #[ORM\OneToMany(targetEntity: Delivery::class, mappedBy: 'baseInfo')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:547:         * Set deliveryFreeAmount.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:549:        public function setDeliveryFreeAmount(?string $deliveryFreeAmount = null): BaseInfo
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:551:            $this->delivery_free_amount = $deliveryFreeAmount;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:557:         * Get deliveryFreeAmount.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:559:        public function getDeliveryFreeAmount(): ?string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:561:            return $this->delivery_free_amount;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:565:         * Set deliveryFreeQuantity.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:567:        public function setDeliveryFreeQuantity(?int $deliveryFreeQuantity = null): BaseInfo
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:569:            $this->delivery_free_quantity = $deliveryFreeQuantity;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:575:         * Get deliveryFreeQuantity.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:577:        public function getDeliveryFreeQuantity(): ?int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:579:            return $this->delivery_free_quantity;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:637:         * Set optionProductDeliveryFee.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:639:        public function setOptionProductDeliveryFee(bool $optionProductDeliveryFee): BaseInfo
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:641:            $this->option_product_delivery_fee = $optionProductDeliveryFee;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:647:         * Get optionProductDeliveryFee.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:649:        public function isOptionProductDeliveryFee(): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:651:            return $this->option_product_delivery_fee;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:976:         * @return Collection<int, Delivery>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:984:         * @param ArrayCollection<int, Delivery>|Collection<int, Delivery>|Delivery[]|array<int, Delivery> $Deliveries
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/confirm.twig:87:            <div class="ec-orderDelivery">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/confirm.twig:89:                    <h2>{{ 'front.shopping.delivery_info'|trans }}</h2>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/confirm.twig:94:                    <div class="ec-orderDelivery__item">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/confirm.twig:116:                    <div class="ec-orderDelivery__address">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/confirm.twig:121:                    <div class="ec-orderDelivery__actions">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/confirm.twig:124:                                <label>{{ 'front.shopping.delivery_provider'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/confirm.twig:125:                                {% set delivery_fee = 0 %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/confirm.twig:126:                                {% for item in shipping.order_items|filter(item => item.isDeliveryFee) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/confirm.twig:127:                                    {% set delivery_fee = item.total_price %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/confirm.twig:129:                                {{ Order.Shippings[idx].Delivery }}({{ delivery_fee|price }})
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/confirm.twig:131:                            <div class="ec-select ec-select__delivery">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/confirm.twig:132:                                <label>{{ 'front.shopping.delivery_date'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/confirm.twig:133:                                {{ Order.Shippings[idx].shipping_delivery_date? Order.Shippings[idx].shipping_delivery_date|date_day_with_weekday : 'common.select__unspecified'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/confirm.twig:136:                                <label>{{ 'front.shopping.delivery_time'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/confirm.twig:137:                                {{ Order.Shippings[idx].shipping_delivery_time?: 'common.select__unspecified'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/confirm.twig:195:                    <dt>{{ 'common.delivery_fee'|trans }}</dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/confirm.twig:196:                    <dd>{{ Order.deliveryFeeTotal|price }}</dd>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:830:            return $this->render('Shopping/delivery_confirm.twig', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_multiple.twig:119:                                        <label>{{ 'front.shopping.delivery_to'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/CartController.php:124:     * カートサマリー（totalPrice, totalQuantity, least, quantity, isDeliveryFree, isCartError）を構築する.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/CartController.php:127:     * @return array{totalPrice: int, totalQuantity: string|int, least: int, quantity: int, isDeliveryFree: bool, isCartError: bool}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/CartController.php:133:        $isDeliveryFree = false;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/CartController.php:148:            if ($BaseInfo->getDeliveryFreeQuantity()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/CartController.php:149:                if (bccomp((string) $BaseInfo->getDeliveryFreeQuantity(), $Cart->getQuantity()) > 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/CartController.php:150:                    $quantity = (int) bcsub((string) $BaseInfo->getDeliveryFreeQuantity(), $Cart->getQuantity());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/CartController.php:152:                    $isDeliveryFree = true;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/CartController.php:156:            if ($BaseInfo->getDeliveryFreeAmount()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/CartController.php:157:                if (!$isDeliveryFree && $BaseInfo->getDeliveryFreeAmount() <= $Cart->getTotalPrice()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/CartController.php:158:                    $isDeliveryFree = true;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/CartController.php:160:                    $least = $BaseInfo->getDeliveryFreeAmount() - (int) $Cart->getTotalPrice(); // @phpstan-ignore-line TODO bcmath-polyfill を使用する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/CartController.php:173:            'isDeliveryFree' => $isDeliveryFree,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbContact.php:190:    #[ORM\Column(name: 'sub_subject_id', type: Types::INTEGER, nullable: true, options: ['comment' => 'お問い合わせ詳細ID'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockMoveInstruction.php:176:    #[ORM\Column(name: 'tracking_no', type: Types::STRING, length: 255, nullable: true,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockMoveInstruction.php:178:    private ?string $trackingNo = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockMoveInstruction.php:180:    public function getTrackingNo(): ?string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockMoveInstruction.php:182:        return $this->trackingNo;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockMoveInstruction.php:185:    public function setTrackingNo(?string $trackingNo): DtbStockMoveInstruction
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockMoveInstruction.php:187:        $this->trackingNo = $trackingNo;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/MailTemplate.php:106:            self::BASE_BUY_ORDER_INCLUDE_DELIVERY_FEE => 'Mail/buy_order_include_delivery_fee.twig',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/MailTemplate.php:109:            self::BASE_BUY_ORDER_INCLUDE_DELIVERY_FEE_OLD => 'Mail/buy_order_include_delivery_fee_old.twig',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShippingMultipleController.php:178:                $Delivery = $OrderItem->getShipping()->getDelivery();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShippingMultipleController.php:196:                            ->setDelivery($Delivery);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShippingMultipleController.php:389:                    $this->mailService->sendCustomerChangeNotifyMail($Customer, $userData, trans('front.mypage.delivery.notify_title'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ItemHolderInterface.php:49:    public function setDeliveryFeeTotal(string $total): static;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ItemHolderInterface.php:54:    public function getDeliveryFeeTotal(): string;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:312:     * @param array<string, string> $formData お問い合わせ内容
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:320:        log_info('お問い合わせ受付メール送信開始');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:390:            log_info('お問い合わせ受付メール送信完了');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:451:        $taxTargetTotal = (int) $Order->getSubtotal() + (int) $Order->getDeliveryFeeTotal() + (int) $Order->getCharge() - (int) $Order->getDiscount();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1449:            'mail_key' => 'eccube.mail.buy_order_include_delivery_fee',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1452:            log_critical('振込完了メールテンプレートが見つかりません。mail_key=eccube.mail.buy_order_include_delivery_fee');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2374:        $taxTargetTotal = (int) $Order->getSubtotal() + (int) $Order->getDeliveryFeeTotal() + (int) $Order->getCharge() - (int) $Order->getDiscount();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PaymentOption.php:31:        #[ORM\Column(name: 'delivery_id', type: Types::INTEGER, options: ['unsigned' => true])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PaymentOption.php:34:        private ?int $delivery_id = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PaymentOption.php:46:        #[ORM\ManyToOne(targetEntity: Delivery::class, inversedBy: 'PaymentOptions')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PaymentOption.php:47:        #[ORM\JoinColumn(name: 'delivery_id', referencedColumnName: 'id')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PaymentOption.php:48:        private ?Delivery $Delivery = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PaymentOption.php:55:         * Set deliveryId.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PaymentOption.php:57:        public function setDeliveryId(int $deliveryId): PaymentOption
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PaymentOption.php:59:            $this->delivery_id = $deliveryId;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PaymentOption.php:65:         * Get deliveryId.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PaymentOption.php:67:        public function getDeliveryId(): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PaymentOption.php:69:            return $this->delivery_id;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PaymentOption.php:91:         * Set delivery.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PaymentOption.php:93:        public function setDelivery(?Delivery $delivery = null): PaymentOption
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PaymentOption.php:95:            $this->Delivery = $delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PaymentOption.php:101:         * Get delivery.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PaymentOption.php:103:        public function getDelivery(): ?Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PaymentOption.php:105:            return $this->Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryDuration.php:19:use Eccube\Repository\DeliveryDurationRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryDuration.php:21:if (!class_exists(DeliveryDuration::class)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryDuration.php:23:     * DeliveryDuration
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryDuration.php:25:    #[ORM\Table(name: 'dtb_delivery_duration')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryDuration.php:27:    #[ORM\Entity(repositoryClass: DeliveryDurationRepository::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryDuration.php:28:    class DeliveryDuration extends AbstractEntity implements \Stringable
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryDuration.php:65:        public function setName(?string $name = null): DeliveryDuration
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryDuration.php:83:        public function setDuration(int $duration): DeliveryDuration
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DeliveryDuration.php:101:        public function setSortNo(int $sortNo): DeliveryDuration
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Cart/CartHeaderViewService.php:52:     * 送料無料までの残額を返す。BaseInfo.delivery_free_amount を閾値として使用し、
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Cart/CartHeaderViewService.php:57:        $threshold = $this->baseInfoRepository->getMallBaseInfo()->getDeliveryFreeAmount();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Cart/index.twig:29:    const deliveryFeeFreeNow = {{ 'front.cart.delivery_fee_free__now'|trans|json_encode|raw }};
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Cart/index.twig:30:    const deliveryFeeFreePrice = {{ 'front.cart.delivery_fee_free__price'|trans({ '%price%': '__PRICE__' })|json_encode|raw }};
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Cart/index.twig:69:        if ($('[data-delivery-progress]').length) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Cart/index.twig:70:            $('[data-delivery-progress]').html(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Cart/index.twig:71:                data.isDeliveryFree
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Cart/index.twig:72:                    ? deliveryFeeFreeNow
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Cart/index.twig:73:                    : deliveryFeeFreePrice.replace('__PRICE__', formatPrice(data.least))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Cart/index.twig:241:                            {% if BaseInfo.delivery_free_amount %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Cart/index.twig:242:                                <p class="p-hareruya-cart__free-shipping" data-delivery-progress>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Cart/index.twig:243:                                    {% if isDeliveryFree %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Cart/index.twig:244:                                        {{ 'front.cart.delivery_fee_free__now'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Cart/index.twig:246:                                        {{ 'front.cart.delivery_fee_free__price'|trans({ '%price%': least|price })|raw }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockMoveTransfer.php:90:    #[ORM\Column(name: 'tracking_no', type: Types::STRING, length: 255, nullable: true, options: ['comment' => '送り状No'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockMoveTransfer.php:91:    private ?string $trackingNo = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockMoveTransfer.php:93:    public function getTrackingNo(): ?string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockMoveTransfer.php:95:        return $this->trackingNo;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockMoveTransfer.php:98:    public function setTrackingNo(?string $trackingNo): DtbStockMoveTransfer
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockMoveTransfer.php:100:        $this->trackingNo = $trackingNo;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeliveryController.php:35:class DeliveryController extends AbstractController
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
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ContactController.php:57:     * お問い合わせ画面.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ContactController.php:185:     * お問い合わせ完了画面.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ContactController.php:197:     * お問い合わせ履歴一覧.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ContactController.php:217:     * お問い合わせ履歴詳細.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Purchase/PurchaseOrderSubmitAction.php:154:            ->setDeliveryFee(0)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:23:use Eccube\Repository\DeliveryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:25:if (!class_exists(Delivery::class)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:27:     * Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:29:    #[ORM\Table(name: 'dtb_delivery')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:31:    #[ORM\Entity(repositoryClass: DeliveryRepository::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:32:    class Delivery extends AbstractEntity implements \Stringable
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:98:        #[ORM\OneToMany(targetEntity: PaymentOption::class, mappedBy: 'Delivery', cascade: ['persist', 'remove'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:102:         * @var Collection<int, DeliveryFee>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:104:        #[ORM\OneToMany(targetEntity: DeliveryFee::class, mappedBy: 'Delivery', cascade: ['persist', 'remove'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:105:        private $DeliveryFees;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:108:         * @var Collection<int, DeliveryTime>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:110:        #[ORM\OneToMany(targetEntity: DeliveryTime::class, mappedBy: 'Delivery', cascade: ['persist', 'remove'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:112:        private $DeliveryTimes;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:128:            $this->DeliveryFees = new ArrayCollection();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:129:            $this->DeliveryTimes = new ArrayCollection();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:139:        public function setBaseInfo(BaseInfo $baseInfo): Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:157:        public function setName(?string $name = null): Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:175:        public function setServiceName(?string $serviceName = null): Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:193:        public function setDescription(?string $description = null): Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:211:        public function setConfirmUrl(?string $confirmUrl = null): Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:229:        public function setSortNo(?int $sortNo = null): Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:247:        public function setCreateDate(\DateTime $createDate): Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:265:        public function setUpdateDate(\DateTime $updateDate): Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:283:        public function addPaymentOption(PaymentOption $paymentOption): Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:311:         * Add deliveryFee.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:313:        public function addDeliveryFee(DeliveryFee $deliveryFee): Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:315:            $this->DeliveryFees[] = $deliveryFee;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:321:         * Remove deliveryFee.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:325:        public function removeDeliveryFee(DeliveryFee $deliveryFee): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:327:            return $this->DeliveryFees->removeElement($deliveryFee);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:331:         * Get deliveryFees.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:333:         * @return Collection<int, DeliveryFee>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:335:        public function getDeliveryFees(): Collection
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:337:            return $this->DeliveryFees;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:341:         * Add deliveryTime.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:343:        public function addDeliveryTime(DeliveryTime $deliveryTime): Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:345:            $this->DeliveryTimes[] = $deliveryTime;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:351:         * Remove deliveryTime.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:355:        public function removeDeliveryTime(DeliveryTime $deliveryTime): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:357:            return $this->DeliveryTimes->removeElement($deliveryTime);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:361:         * Get deliveryTimes.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:363:         * @return Collection<int, DeliveryTime>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:365:        public function getDeliveryTimes(): Collection
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:367:            return $this->DeliveryTimes;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:373:        public function setCreator(?Member $creator = null): Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:391:        public function setSaleType(?SaleType $saleType = null): Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:409:        public function setVisible(bool $visible): Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:432:        public function setServiceNameEn(?string $serviceNameEn): Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:447:        public function setMaxSize(?int $max_size): Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:462:        public function setLeadTime(?int $lead_time): Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:477:        public function setIsAbroad(bool $isAbroad): Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:492:        public function setIsShippingStandbyListExclusion(bool $isShippingStandbyListExclusion): Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:505:        public function addRegionRestriction(MtbRegionRestriction $regionRestriction): Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Delivery.php:531:        public function addSellGroup(MtbSellGroup $sellGroup): Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:41:- dtb_delivery.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:42:- dtb_delivery_duration.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:43:- dtb_delivery_fee.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/definition.yml:44:- dtb_delivery_time.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Master/DeliveryDurationType.php:17:use Eccube\Entity\DeliveryDuration;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Master/DeliveryDurationType.php:23: * Class DeliveryDurationType
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Master/DeliveryDurationType.php:25:class DeliveryDurationType extends AbstractType
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Master/DeliveryDurationType.php:34:            'class' => DeliveryDuration::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Master/DeliveryDurationType.php:50:        return 'delivery_duration';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionTrackingRegisterAction.php:27:class StockMoveInstructionTrackingRegisterAction
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionTrackingRegisterAction.php:35:    public function handle(DtbStockMoveInstruction $Instruction, string $trackingNo, Member $UpdateMember): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionTrackingRegisterAction.php:37:        $trackingNoValue = $trackingNo !== '' ? $trackingNo : null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionTrackingRegisterAction.php:38:        $Instruction->setTrackingNo($trackingNoValue);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionTrackingRegisterAction.php:46:        $MovingStatus = $trackingNoValue !== null
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionTrackingRegisterAction.php:50:            $Transfer->setTrackingNo($trackingNoValue);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionDetailUpdateAction.php:40:        $trackingNo = $instruction->getTrackingNo();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionDetailUpdateAction.php:45:        $MovingStatus = $trackingNo !== null && $trackingNo !== ''
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockMoveInstructionDetailUpdateAction.php:49:            $Transfer->setTrackingNo($trackingNo);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:337:            ->add('delivery_free_amount', PriceType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:340:            ->add('delivery_free_quantity', IntegerType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_product_class.csv:1:id,product_id,base_info_id,sale_type_id,class_category_id1,class_category_id2,delivery_duration_id,creator_id,product_code,stock,stock_unlimited,sale_limit,price01,price02,delivery_fee,create_date,update_date,visible,currency_code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Entry/index.twig:489:                                                        {{ form_label(form.address.addr01, 'front.mypage.delivery.label_addr01'|trans, { label_attr: { class: 'u-hareruya-dsp-visually-hidden' } }) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Entry/index.twig:499:                                                        {{ form_label(form.address.addr02, 'front.mypage.delivery.label_addr02'|trans, { label_attr: { class: 'u-hareruya-dsp-visually-hidden' } }) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Entry/index.twig:509:                                                        {{ form_label(form.address.addr03, 'front.mypage.delivery.label_addr03'|trans, { label_attr: { class: 'u-hareruya-dsp-visually-hidden' } }) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockMoveTransferType.php:68:            ->add('tracking_no', TextType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockMoveTransferType.php:69:                'label' => 'admin.stock.move_transfer.tracking_no',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:21:use Eccube\Entity\Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:65:        $this->addDateRange($builder, 'shipping_delivery', 'admin.order.shipping_delivery_date', true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:185:            ->add('tracking_number', TextType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:186:                'label' => 'admin.order.tracking_number',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:266:            ->add('delivery', EntityType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:267:                'label' => 'admin.order.delivery.delivery_provider',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:269:                'class' => Delivery::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:388:                $shippingDeliveryDatetimeStart = $form['shipping_delivery_datetime_start']->getData();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:389:                $shippingDeliveryDatetimeEnd = $form['shipping_delivery_datetime_end']->getData();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:391:                if (!empty($shippingDeliveryDatetimeStart) && !empty($shippingDeliveryDatetimeEnd)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:392:                    if ($shippingDeliveryDatetimeStart > $shippingDeliveryDatetimeEnd) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:393:                        $form['shipping_delivery_datetime_end']->addError(new FormError(trans('admin.product.date_range_error')));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:26:use Eccube\Entity\Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:39:use Eccube\Repository\DeliveryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:86:    public function __construct(protected EntityManagerInterface $entityManager, protected OrderRepository $orderRepository, protected OrderItemTypeRepository $orderItemTypeRepository, protected OrderStatusRepository $orderStatusRepository, protected DeliveryRepository $deliveryRepository, protected PaymentRepository $paymentRepository, protected DeviceTypeRepository $deviceTypeRepository, protected PrefRepository $prefRepository, protected MobileDetect $mobileDetector, protected Session $session, protected AuthorizationCheckerInterface $authorizationChecker, protected TokenStorageInterface $tokenStorage, protected CartService $cartService)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:123:        $isDeliveryFree = false;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:125:        if ($BaseInfo->getDeliveryFreeQuantity()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:126:            if (bccomp((string) $BaseInfo->getDeliveryFreeQuantity(), $Cart->getQuantity()) <= 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:127:                $isDeliveryFree = true;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:131:        if ($BaseInfo->getDeliveryFreeAmount()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:132:            if (!$isDeliveryFree && $BaseInfo->getDeliveryFreeAmount() <= $Cart->getTotalPrice()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:133:                $isDeliveryFree = true;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:153:                    throw new ShoppingException(trans('purchase_flow.no_delivery_method'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:157:                $Deliveries = $this->deliveryRepository->findDeliveriesForOrder(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:162:                    $isDeliveryFree,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:166:                $Deliveries = $this->deliveryRepository->findBy([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:167:                    'id' => [Delivery::OTC, Delivery::SMOOTH_OTC],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:177:                    'isDeliveryFree' => $isDeliveryFree,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:180:                throw new ShoppingException(trans('purchase_flow.no_delivery_method'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:183:            $Delivery = $Deliveries[0];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:184:            $Shipping->setDelivery($Delivery);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:185:            $Shipping->setShippingDeliveryName($Delivery->getName());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:435:    protected function setDefaultDelivery(Shipping $Shipping): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:448:        $Deliveries = $this->deliveryRepository->getDeliveries($SaleTypes);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:451:        $Delivery = current($Deliveries);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:452:        $Shipping->setDelivery($Delivery);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:453:        $Shipping->setShippingDeliveryName($Delivery->getName());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:463:            $Delivery = $Shipping->getDelivery();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:464:            if ($Delivery === null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:469:            foreach ($Delivery->getPaymentOptions() as $PaymentOption) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:28:use Eccube\Form\Type\Master\DeliveryDurationType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:141:            ->add('delivery_fee', PriceType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:144:            ->add('delivery_duration', DeliveryDurationType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:274:             * - pc.DeliveryDate (dd)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:466:        'delivery_date_id' => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:468:            'labelEn' => 'delivery_date_id',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:469:            'column' => 'dd.id as delivery_date_id',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:471:        'delivery_date_name' => [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:473:            'labelEn' => 'delivery_date_name',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:474:            'column' => 'dd.name as delivery_date_name',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:835:            ->leftJoin('pc.DeliveryDuration', 'dd')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductAllCsv.php:1007:            $qb->leftJoin('pc.DeliveryDuration', 'dd');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_order.csv:1:id,customer_id,country_id,pref_id,sex_id,job_id,payment_id,device_type_id,pre_order_id,order_no,message,name01,name02,kana01,kana02,company_name,email,phone_number,postal_code,addr01,addr02,birth,subtotal,discount,delivery_fee_total,charge,tax,total,payment_total,payment_method,note,create_date,update_date,order_date,payment_date,order_status_id
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/breadcrumb_nav.twig:4:  お問い合わせ履歴詳細: contact_id を渡すか、テンプレに contact があれば contact.id にフォールバック
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/breadcrumb_nav.twig:126:        {% elseif route in ['mypage_delivery', 'mypage_delivery_new', 'mypage_delivery_edit', 'mypage_delivery_new_complete', 'mypage_delivery_edit_complete'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/breadcrumb_nav.twig:128:            {{ hareruya_breadcrumb.current_li('front.mypage.title.delivery'|trans, 3) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_page.csv:22:24,Shopping / Delivery Address,shopping_shipping,Shopping/shipping,2,,,,2017-03-07 10:14:52,2017-03-07 10:14:52,noindex,,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_page.csv:27:32,Shopping / Add a Delivery Address,shopping_shipping_edit,Shopping/shipping_edit,2,,,,2017-03-07 01:15:02,2017-03-07 01:15:02,noindex,,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_page.csv:28:33,Shopping / Multiple Delivery Addresses (Add Delivery Address),shopping_shipping_multiple_edit,Shopping/shipping_multiple_edit,2,,,,2017-03-07 01:15:02,2017-03-07 01:15:02,noindex,,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_page.csv:35:25,Shopping / Select multiple delivery addresses,shopping_shipping_multiple,Shopping/shipping_multiple,2,,,,2017-03-07 10:14:52,2017-03-07 10:14:52,noindex,,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_page.csv:37:7,My Account / All Delivery Addresses,mypage_delivery,Mypage/delivery,2,,,,2017-03-07 10:14:52,2017-03-07 10:14:52,noindex,,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_page.csv:38:8,My Account / Add a Delivery Address,mypage_delivery_new,Mypage/delivery_edit,2,,,,2017-03-07 10:14:52,2017-03-07 10:14:52,noindex,,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_page.csv:39:42,Shopping / Change Delivery Address,shopping_shipping_edit_change,Shopping/index,2,,,,2017-03-07 01:15:03,2017-03-07 01:15:03,noindex,,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_page.csv:40:44,My Account / Edit Delivery Address,mypage_delivery_edit,Mypage/delivery_edit,2,,,,2017-03-07 01:15:05,2017-03-07 01:15:05,noindex,8,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_delivery_fee.csv:1:id,delivery_id,pref_id,fee
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_delivery.csv:3:2,,2,Sample Delivery,Sample Delivery,,,2,1,2017-03-07 10:14:52,2017-03-07 10:14:52
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseDetailType.php:132:            ->add('deliveryFee', PriceType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_tradelaw.csv:9:8,"Date of delivery",,8,0
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassEditType.php:22:use Eccube\Form\Type\Master\DeliveryDurationType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassEditType.php:101:            ->add('delivery_fee', PriceType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassEditType.php:108:            ->add('delivery_duration', DeliveryDurationType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderPdfService.php:534:            $arrOrder[$i][3] = $this->eccubeExtension->getPriceFilter($Order->getDeliveryFeeTotal());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:19:use Eccube\Entity\Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:20:use Eccube\Entity\DeliveryTime;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:29:use Eccube\Repository\DeliveryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:30:use Eccube\Repository\DeliveryTimeRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:56:        protected DeliveryRepository $deliveryRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:57:        protected DeliveryTimeRepository $deliveryTimeRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:171:            ->add('Delivery', EntityType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:173:                'class' => Delivery::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:174:                'choice_label' => fn (Delivery $Delivery) => $Delivery->isVisible()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:175:                    ? $Delivery->getServiceName()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:176:                    : $Delivery->getServiceName().trans('admin.common.hidden_label'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:185:            ->add('shipping_delivery_date', DateType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:197:            ->add('tracking_number', TextType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:253:                $Delivery = $data->getDelivery();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:255:                $DeliveryTime = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:257:                    $DeliveryTime = $this->deliveryTimeRepository->find($timeId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:261:                $form->add('DeliveryTime', EntityType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:262:                    'class' => DeliveryTime::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:263:                    'choice_label' => fn (DeliveryTime $DeliveryTime) => $DeliveryTime->isVisible()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:264:                        ? $DeliveryTime->getDeliveryTime()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:265:                        : $DeliveryTime->getDeliveryTime().trans('admin.common.hidden_label'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:268:                    'data' => $DeliveryTime,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:269:                    'query_builder' => function (EntityRepository $er) use ($Delivery) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:274:                        if ($Delivery) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:276:                                ->where('dt.Delivery = :Delivery')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:277:                                ->setParameter('Delivery', $Delivery);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:293:                $Delivery = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:294:                if (StringUtil::isNotBlank($data['Delivery'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:295:                    $Delivery = $this->deliveryRepository->find($data['Delivery']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:299:                $form->remove('DeliveryTime');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:300:                $form->add('DeliveryTime', EntityType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:301:                    'class' => DeliveryTime::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:302:                    'choice_label' => 'delivery_time',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:305:                    'query_builder' => function (EntityRepository $er) use ($Delivery) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:307:                        if ($Delivery) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:309:                                ->where('dt.Delivery = :Delivery')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:310:                                ->setParameter('Delivery', $Delivery);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:321:                $Delivery = $Shipping->getDelivery();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:322:                $Shipping->setShippingDeliveryName($Delivery ? $Delivery->getName() : null);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:323:                $DeliveryTime = $form['DeliveryTime']->getData();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:324:                if ($DeliveryTime) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:325:                    $Shipping->setShippingDeliveryTime($DeliveryTime->getDeliveryTime());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:326:                    $Shipping->setTimeId($DeliveryTime->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:328:                    $Shipping->setShippingDeliveryTime(null);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:18:17,1,,Eccube\\Entity\\ProductClass,DeliveryDuration,id,Estimated Shipping Date (ID),17,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:19:18,1,,Eccube\\Entity\\ProductClass,DeliveryDuration,name,Estimated Shipping Date (Name),18,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:26:25,1,,Eccube\\Entity\\ProductClass,delivery_fee,,Shipping Charge,25,0,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:81:80,3,,Eccube\\Entity\\Order,delivery_fee_total,,Shipping Charge,24,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:106:105,3,,Eccube\\Entity\\Shipping,id,,Delivery ID,49,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:118:117,3,,Eccube\\Entity\\Shipping,Delivery,id,Delivery Company (ID),61,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:119:118,3,,Eccube\\Entity\\Shipping,shipping_delivery_name,,Delivery Company (Name),62,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:120:119,3,,Eccube\\Entity\\Shipping,time_id,,Delivery Time ID,63,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:121:120,3,,Eccube\\Entity\\Shipping,shipping_delivery_time,,Delivery Time (Name),64,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:122:121,3,,Eccube\\Entity\\Shipping,shipping_delivery_date,,Preferred Delivery Date,65,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:123:123,3,,Eccube\\Entity\\Shipping,shipping_delivery_fee,,Shipping Charge,67,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:125:125,3,,Eccube\\Entity\\Shipping,tracking_number,,Tracking No. ,69,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:126:126,3,,Eccube\\Entity\\Shipping,note,,Delivery Notes,70,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:151:151,4,,Eccube\\Entity\\Order,delivery_fee_total,,Shipping Charge,24,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:176:176,4,,Eccube\\Entity\\Shipping,id,,Delivery ID,49,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:188:188,4,,Eccube\\Entity\\Shipping,Delivery,id,Delivery Company (ID),61,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:189:189,4,,Eccube\\Entity\\Shipping,shipping_delivery_name,,Delivery Company (Name),62,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:190:190,4,,Eccube\\Entity\\Shipping,time_id,,Delivery Time (ID),63,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:191:191,4,,Eccube\\Entity\\Shipping,shipping_delivery_time,,Delivery Time (Name),64,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:192:192,4,,Eccube\\Entity\\Shipping,shipping_delivery_date,,Preferred Delivery Date,65,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:193:194,4,,Eccube\\Entity\\Shipping,shipping_delivery_fee,,Shipping Charge,67,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:195:196,4,,Eccube\\Entity\\Shipping,tracking_number,,Tracking No. ,69,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:196:197,4,,Eccube\\Entity\\Shipping,note,,Delivery Notes,70,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockMoveInstructionDetailType.php:34:            ->add('trackingNo', TextareaType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockMoveInstructionDetailType.php:35:                'label' => 'admin.stock.move_instruction.tracking_no',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_delivery_time.csv:1:id,delivery_id,delivery_time,sort_no,create_date,update_date,visible
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_base_info.csv:1:id,country_id,pref_id,company_name,company_kana,postal_code,addr01,addr02,phone_number,business_hour,email01,email02,email03,email04,shop_name,shop_kana,shop_name_eng,update_date,good_traded,message,delivery_free_amount,delivery_free_quantity,option_mypage_order_status_display,option_nostock_hidden,option_favorite_product,option_product_delivery_fee,option_product_tax_rule,option_customer_activate,option_remember_me,option_mail_notifier,authentication_key,option_point,basic_point_rate,point_conversion_rate
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_payment_option.csv:1:delivery_id,payment_id
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryType.php:17:use Eccube\Entity\Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryType.php:33:class DeliveryType extends AbstractType
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryType.php:72:                'label' => 'admin.setting.shop.delivery.is_abroad',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryType.php:77:                'label' => 'admin.setting.shop.delivery.is_shipping_standby_list_exclusion',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryType.php:103:            ->add('delivery_times', CollectionType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryType.php:105:                'entry_type' => DeliveryTimeType::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryType.php:115:            ->add('delivery_fees', CollectionType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryType.php:117:                'entry_type' => DeliveryFeeType::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryType.php:144:            'data_class' => Delivery::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryType.php:154:        return 'delivery';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_shipping.csv:1:id,country_id,pref_id,delivery_id,time_id,name01,name02,kana01,kana02,company_name,phone_number,postal_code,addr01,addr02,delivery_name,delivery_time,delivery_date,shipping_date,sort_no,create_date,update_date
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/mtb_csv_type.csv:5:4,Delivery CSV,1
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Model/ColumnDefinitions.php:347:    public static function deliveryDateId(string $name = '発送日目安(ID)'): BaseCsvColumn
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:246:            ->add('delivery_free_amount', PriceType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:249:            ->add('delivery_free_quantity', IntegerType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:258:            ->add('option_product_delivery_fee', ToggleSwitchType::class)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_payment.csv:5:4,,Cash on Delivery,0,,1,1,1,2017-03-07 10:14:52,2017-03-07 10:14:52,,0,Eccube\Service\Payment\Method\Cash
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:217:            ->add('delivery_fee_total', PriceType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:581:            if ($OrderItem->isDeliveryFee()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Help/agreement.twig:31:晴れる屋をご利用いただく場合、利用者には本規約の条項を熟読、理解した上で利用を開始する義務を負います。また書き込み・投稿・問合せを行う場合は、あらかじめ送信方法・送信内容に問題がないことを確認する義務を負うこととします。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Help/agreement.twig:43:マジック：ザ・ギャザリングはWizards of the Coast, LLCの登録商標であり、それらのロゴ、シンボル、全てのカード、また、マジック：ザ・ギャザリングに関わる全ての権利についてはWizards of the Coast, LLCにお問い合わせください。全てのデッキリストは、掲載元であるWebサイトから転載の許可を得て、掲載しています。このサイトは、Wizards of the Coast, LLCが運営する公式なサイトではありません。上記を除く全ての権利は株式会社晴れる屋が保有しています。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:40:- dtb_delivery.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:41:- dtb_delivery_duration.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:42:- dtb_delivery_fee.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/definition.yml:43:- dtb_delivery_time.csv
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductCardCsv.php:163:                $row['発送日目安(ID)'] = $ProductClass->getDeliveryDuration()?->getId() ?? '';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_product_class.csv:1:id,product_id,sale_type_id,class_category_id1,class_category_id2,delivery_duration_id,creator_id,product_code,stock,stock_unlimited,sale_limit,price01,price02,delivery_fee,create_date,update_date,visible,currency_code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/ProductGoodsCsv.php:161:                $row['発送日目安(ID)'] = $ProductClass->getDeliveryDuration()?->getId() ?? '';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryFeeType.php:16:use Eccube\Entity\DeliveryFee;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryFeeType.php:25:class DeliveryFeeType extends AbstractType
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryFeeType.php:68:            'data_class' => DeliveryFee::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryFeeType.php:78:        return 'delivery_fee';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryTimeType.php:17:use Eccube\Entity\DeliveryTime;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryTimeType.php:28:class DeliveryTimeType extends AbstractType
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryTimeType.php:39:            ->add('delivery_time', TextType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryTimeType.php:62:            /** @var DeliveryTime $DeliveryTime */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryTimeType.php:63:            $DeliveryTime = $event->getData();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryTimeType.php:64:            $DeliveryTime->setVisible(true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryTimeType.php:75:            'data_class' => DeliveryTime::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryTimeType.php:88:        return 'delivery_time';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/ActionInput/MinimumDeliveryTimeUpdateInput.php:18:use Eccube\Entity\Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/ActionInput/MinimumDeliveryTimeUpdateInput.php:20:final readonly class MinimumDeliveryTimeUpdateInput
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/ActionInput/MinimumDeliveryTimeUpdateInput.php:23:     * @param array<int, array{minimum_arraival_date: string, delivery_time_id: string}> $prefDataList
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/ActionInput/MinimumDeliveryTimeUpdateInput.php:26:        public Delivery $Delivery,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/StockMoveInstructionEntityManager.php:46:        ?string $trackingNo = null,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/StockMoveInstructionEntityManager.php:60:        $Instruction->setTrackingNo($trackingNo);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductSellGroupType.php:19:use Eccube\Entity\Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductSellGroupType.php:99:                'class' => Delivery::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/MinimumDeliveryTimeUpdateAction.php:19:use Eccube\Entity\DtbMinimumDeliveryTime;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/MinimumDeliveryTimeUpdateAction.php:21:use Eccube\Repository\DeliveryTimeRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/MinimumDeliveryTimeUpdateAction.php:22:use Eccube\Repository\DtbMinimumDeliveryTimeRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/MinimumDeliveryTimeUpdateAction.php:24:use Eccube\Service\Admin\Setting\Shop\ActionInput\MinimumDeliveryTimeUpdateInput;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/MinimumDeliveryTimeUpdateAction.php:26:class MinimumDeliveryTimeUpdateAction
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/MinimumDeliveryTimeUpdateAction.php:31:        private readonly DeliveryTimeRepository $deliveryTimeRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/MinimumDeliveryTimeUpdateAction.php:32:        private readonly DtbMinimumDeliveryTimeRepository $minimumDeliveryTimeRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/MinimumDeliveryTimeUpdateAction.php:36:    public function handle(MinimumDeliveryTimeUpdateInput $input): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/MinimumDeliveryTimeUpdateAction.php:38:        $Delivery = $input->Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/MinimumDeliveryTimeUpdateAction.php:42:        $existingByPrefId = $this->minimumDeliveryTimeRepository->findByDeliveryIdWithResultKeyToPrefId((string) $Delivery->getId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/MinimumDeliveryTimeUpdateAction.php:62:            $deliveryTimeId = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/MinimumDeliveryTimeUpdateAction.php:63:            if (isset($data['delivery_time_id']) && $data['delivery_time_id'] !== '') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/MinimumDeliveryTimeUpdateAction.php:64:                $rawDeliveryTimeId = (string) $data['delivery_time_id'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/MinimumDeliveryTimeUpdateAction.php:65:                if (ctype_digit($rawDeliveryTimeId) && (int) $rawDeliveryTimeId > 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/MinimumDeliveryTimeUpdateAction.php:66:                    $deliveryTimeId = (int) $rawDeliveryTimeId;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/MinimumDeliveryTimeUpdateAction.php:72:            if ($minimumArraivalDate === null || $deliveryTimeId === null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/MinimumDeliveryTimeUpdateAction.php:79:            $DeliveryTime = $this->deliveryTimeRepository->find($deliveryTimeId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/MinimumDeliveryTimeUpdateAction.php:80:            if ($DeliveryTime === null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/MinimumDeliveryTimeUpdateAction.php:86:                $existing->setDeliveryTime($DeliveryTime);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/MinimumDeliveryTimeUpdateAction.php:88:                $entity = new DtbMinimumDeliveryTime();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/MinimumDeliveryTimeUpdateAction.php:89:                $entity->setDelivery($Delivery);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Setting/Shop/MinimumDeliveryTimeUpdateAction.php:91:                $entity->setDeliveryTime($DeliveryTime);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderPdfType.php:87:                    'admin.order.delivery_note_output_format__file' => 1,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderPdfType.php:88:                    'admin.order.delivery_note_output_format__browser' => 2,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderPdfType.php:144:                'label' => 'admin.order.delivery_note_save_input',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderPdfType.php:164:                        new FormError(trans('admin.order.delivery_note_parameter_error'))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderDepositCsvExportService.php:32:        'delivery_fee' => '送料',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderDepositCsvExportService.php:113:            $deliveryFee = $BuyOrder->getDeliveryFee();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderDepositCsvExportService.php:118:                'delivery_fee' => $deliveryFee,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Exporter/BuyOrderDepositCsvExportService.php:125:                'deposit_price' => $deliveryFee + $acceptanceTotalPrice,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig:15:{% set mypageno = 'delivery' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig:32:    <div class="p-hareruya-entry p-hareruya-entry--delivery">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig:50:                        <span itemprop="name">{{ 'front.mypage.title.delivery_breadcrumb_lead'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig:52:                        <span>{{ 'front.mypage.title.delivery_breadcrumb_tail'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig:60:                <h1 class="c-hareruya-heading--lev1">{{ 'front.mypage.title.delivery'|trans }}</h1>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig:61:                <p class="p-hareruya-entry__title-text">{{ 'front.mypage.delivery.edit_notice'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig:70:                            <div class="p-hareruya-form-block p-hareruya-entry__delivery-name">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig:81:                                            'data-error-required': 'front.mypage.delivery.error.address_name_required'|trans
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig:93:                                    <label class="p-hareruya-form-block__label c-hareruya-heading--lev4" for="{{ form.name.name02.vars.id }}">{{ 'front.mypage.delivery.label_name02'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig:100:                                            placeholder: 'front.mypage.delivery.placeholder_first_name'|trans,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig:114:                                    <label class="p-hareruya-form-block__label c-hareruya-heading--lev4" for="{{ form.name.name01.vars.id }}">{{ 'front.mypage.delivery.label_name01'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig:121:                                            placeholder: 'front.mypage.delivery.placeholder_last_name'|trans,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig:164:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.postalCode.postalCode01.vars.id }}">{{ 'front.mypage.delivery.postal_label_first'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig:180:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.postalCode.postalCode02.vars.id }}">{{ 'front.mypage.delivery.postal_label_second'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig:237:                                                <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.pref.vars.id }}">{{ 'front.mypage.delivery.label_pref'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig:250:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.addr01.vars.id }}">{{ 'front.mypage.delivery.label_addr01'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig:261:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.addr02.vars.id }}">{{ 'front.mypage.delivery.label_addr02'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig:272:                                            <p class="p-hareruya-entry__help-text">{{ 'front.mypage.delivery.address_help'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig:287:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.addr01.vars.id }}">{{ 'front.mypage.delivery.label_addr_overseas_1'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig:298:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.addr02.vars.id }}">{{ 'front.mypage.delivery.label_addr_overseas_2'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig:309:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.addr03.vars.id }}">{{ 'front.mypage.delivery.label_addr_overseas_3'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig:332:                                                <label class="u-hareruya-dsp-visually-hidden" for="{{ form.tel.tel01.vars.id }}">{{ 'front.mypage.delivery.label_tel01'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig:348:                                                <label class="u-hareruya-dsp-visually-hidden" for="{{ form.tel.tel02.vars.id }}">{{ 'front.mypage.delivery.label_tel02'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig:364:                                                <label class="u-hareruya-dsp-visually-hidden" for="{{ form.tel.tel03.vars.id }}">{{ 'front.mypage.delivery.label_tel03'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.en.twig:436:                            <a class="c-hareruya-btn c-hareruya-btn--lg" href="{{ url('mypage_delivery') }}">{{ 'common.back'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:183:                                                        <span class="p-hareruya-order-list__summary-item-label">{{ 'common.delivery_fee'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:184:                                                        <span class="p-hareruya-order-list__summary-item-value">{{ Order.delivery_fee_total|price }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:253:                                            <p class="p-hareruya-history-detail__sender-tel"><abbr title="{{ 'common.phone_number'|trans }}">{{ 'front.mypage.delivery.tel_abbr'|trans }}</abbr> {{ Order.tel01 }}-{{ Order.tel02 }}-{{ Order.tel03 }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:262:                                    <dt>{{ 'front.mypage.delivery_provider'|trans }}</dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:263:                                    <dd>{{ Shipping.shipping_delivery_name }}</dd>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:276:                                    <dt>{{ 'front.mypage.delivery'|trans }}</dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:291:                                            <p class="p-hareruya-history-detail__receiver-tel"><abbr title="{{ 'common.phone_number'|trans }}">{{ 'front.mypage.delivery.tel_abbr'|trans }}</abbr> {{ Shipping.tel01 }}-{{ Shipping.tel02 }}-{{ Shipping.tel03 }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveInstructionCsvImportHandler.php:45:    private ?CsvColumnInterface $trackingNoColumn = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveInstructionCsvImportHandler.php:124:                $rowNumber.'行目: '.$this->translator->trans('admin.stock.move_instruction.csv_tracking_error_instruction_not_found', [], 'messages')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveInstructionCsvImportHandler.php:133:                $rowNumber.'行目: '.$this->translator->trans('admin.stock.move_instruction.csv_tracking_error_instruction_not_found', [], 'messages')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveInstructionCsvImportHandler.php:146:                $rowNumber.'行目: '.$this->translator->trans('admin.stock.move_instruction.csv_tracking_error_shop_mismatch_from', [], 'messages')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveInstructionCsvImportHandler.php:153:                $rowNumber.'行目: '.$this->translator->trans('admin.stock.move_instruction.csv_tracking_error_shop_mismatch_to', [], 'messages')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveInstructionCsvImportHandler.php:159:        $trackingNoRaw = (string) $this->trackingNoColumn->getValue($row);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveInstructionCsvImportHandler.php:160:        $trackingNoTrimmed = $this->trimOrNull($trackingNoRaw);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveInstructionCsvImportHandler.php:161:        if ($trackingNoTrimmed === null || $trackingNoTrimmed === '') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveInstructionCsvImportHandler.php:163:                $rowNumber.'行目: '.$this->translator->trans('admin.stock.move_instruction.csv_tracking_error_tracking_no_empty', [], 'messages')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveInstructionCsvImportHandler.php:169:        $this->persistTrackingNo($Instruction, $trackingNoTrimmed, $event->getUpdateUser());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveInstructionCsvImportHandler.php:185:            $this->trackingNoColumn,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveInstructionCsvImportHandler.php:207:        $this->trackingNoColumn = (new BaseCsvColumn(self::COL_TRACKING_NO, self::COL_TRACKING_NO))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveInstructionCsvImportHandler.php:217:        $this->trackingNoColumn = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveInstructionCsvImportHandler.php:227:    private function persistTrackingNo(DtbStockMoveInstruction $Instruction, string $trackingNo, Member $UpdateMember): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveInstructionCsvImportHandler.php:229:        $Instruction->setTrackingNo($trackingNo);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockMoveInstructionCsvImportHandler.php:242:            $Transfer->setTrackingNo($trackingNo);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:189:                            <a class="p-hareruya-mypage__menu-link" href="{{ url('mypage_delivery') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:191:                                <span class="p-hareruya-mypage__menu-text">{{ 'front.mypage.index.menu.delivery_html'|trans|raw }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:112:    private ?CsvColumnInterface $deliveryDateIdColumn = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:299:            $this->deliveryDateIdColumn,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:370:        $this->deliveryDateIdColumn = ColumnDefinitions::deliveryDateId();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductGoodsImportHandler.php:409:        $this->deliveryDateIdColumn = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/ItemCollection.php:71:    public function getDeliveryFees(): ItemCollection
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/ItemCollection.php:74:            fn (ItemInterface $OrderItem) => $OrderItem->isDeliveryFee());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/ItemCollection.php:138:            } elseif ($a->isDeliveryFee()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/ItemCollection.php:145:                if ($b->isDeliveryFee() || $b->isProduct()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:128:    private ?CsvColumnInterface $deliveryDateIdColumn = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:320:            $this->deliveryDateIdColumn,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:379:        $this->deliveryDateIdColumn = ColumnDefinitions::deliveryDateId();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:416:        $this->deliveryDateIdColumn = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/order_receipt.twig:31:                    {% if orderReceipt.delivery_id == constant('Eccube\\Entity\\Delivery::SMOOTH_OTC') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/order_receipt.twig:67:                                    <td class="postage_">{{ orderReceipt.delivery_fee_total|price }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/history.twig:57:                <div class="ec-orderDelivery">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/history.twig:59:                        <h2>{{ 'front.mypage.delivery_info'|trans }}</h2>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/history.twig:63:                        <div class="ec-orderDelivery__title">{{ 'front.mypage.delivery'|trans }}{% if Order.multiple %}({{ loop.index }}){% endif %}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/history.twig:65:                            <div class="ec-orderDelivery__item">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/history.twig:104:                        <div class="ec-orderDelivery__address">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/history.twig:111:                            <dt>{{ 'front.mypage.delivery_provider'|trans }} :</dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/history.twig:112:                            <dd>{{ Shipping.shipping_delivery_name }}</dd>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/history.twig:115:                            <dt>{{ 'front.mypage.delivery_date'|trans }} :</dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/history.twig:116:                            <dd>{{ Shipping.shipping_delivery_date|date_day_with_weekday|default('common.select__unspecified'|trans) }}</dd>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/history.twig:119:                            <dt>{{ 'front.mypage.delivery_time'|trans }} :</dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/history.twig:120:                            <dd>{{ Shipping.shipping_delivery_time|default('common.select__unspecified'|trans) }}</dd>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/history.twig:163:                        <dt>{{ 'common.delivery_fee'|trans }}</dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/history.twig:164:                        <dd>{{ Order.delivery_fee_total|price }}</dd>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:13:{% set mypageno = 'delivery' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:18:    <div class="p-hareruya-delivery-list">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:21:                <div class="ec-alertRole p-hareruya-delivery-list__flash" role="alert">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:48:                    <span class="p-hareruya-breadcrumb__current" aria-current="page"><span itemprop="name">{{ 'front.mypage.title.delivery'|trans }}</span></span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:54:        <div class="p-hareruya-delivery-list__container">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:55:            <div class="p-hareruya-delivery-list__title">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:56:                <h1 class="c-hareruya-heading--lev1">{{ 'front.mypage.title.delivery'|trans }}</h1>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:58:            <div class="p-hareruya-delivery-list__content">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:59:                <div class="p-hareruya-delivery-list__header">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:60:                    <div class="p-hareruya-delivery-list__member-name">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:63:                    <p class="c-hareruya-text">{{ 'front.mypage.delivery.list_intro'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:65:                <div class="p-hareruya-delivery-list__new-address">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:67:                        <a class="c-hareruya-btn c-hareruya-btn--lg c-hareruya-btn--secondary u-hareruya-w-full p-hareruya-cart-btn" href="{{ url('mypage_delivery_new') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:68:                            <i class="icon-hareruya-new-address c-hareruya-icon" aria-hidden="true"></i> {{ 'front.mypage.delivery.add_address_button'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:74:                <div class="p-hareruya-delivery-list__address-list">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:78:                                <input class="c-hareruya-radio__input" type="radio" name="mypage_delivery_preview" value="default" checked>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:90:                                        <p class="p-hareruya-shipping-address__tel"><abbr title="{{ 'common.phone_number'|trans }}">{{ 'front.mypage.delivery.tel_abbr'|trans }}</abbr> {{ Customer.phoneNumber }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:91:                                        <p class="p-hareruya-shipping-address__company">{{ 'front.mypage.delivery.company_prefix'|trans }}{{ Customer.company_name }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:100:                                    <input class="c-hareruya-radio__input" type="radio" name="mypage_delivery_preview" value="{{ CustomerAddress.id }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:103:                                            <p class="p-hareruya-shipping-address__title">{{ CustomerAddress.address_name ?: ('front.mypage.delivery.address_untitled'|trans({ '%num%': loop.index })) }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:112:                                            <p class="p-hareruya-shipping-address__tel"><abbr title="{{ 'common.phone_number'|trans }}">{{ 'front.mypage.delivery.tel_abbr'|trans }}</abbr> {{ CustomerAddress.phoneNumber }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:113:                                            <p class="p-hareruya-shipping-address__company">{{ 'front.mypage.delivery.company_prefix'|trans }}{{ CustomerAddress.company_name }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:116:                                            <a class="c-hareruya-btn c-hareruya-btn--sm" href="{{ url('mypage_delivery_edit', { id: CustomerAddress.id }) }}">{{ 'common.edit'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:117:                                            <a href="{{ url('mypage_delivery_delete', { id: CustomerAddress.id }) }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:121:                                               data-confirm="{{ 'front.mypage.delivery.delete_confirm'|trans({ '%name01%': CustomerAddress.name01, '%name02%': CustomerAddress.name02 })|e('html_attr') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery.twig:132:            <div class="p-hareruya-delivery-list__btn">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CustomerAddressRowValidator.php:94:                $errors->addMessage('admin.customer.delivery_csv.csv_invalid_zipcode_partial', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CustomerAddressRowValidator.php:100:                $errors->addMessage('admin.customer.delivery_csv.csv_invalid_zipcode', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CustomerAddressRowValidator.php:106:                $errors->addMessage('admin.customer.delivery_csv.csv_invalid_pref', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CustomerAddressRowValidator.php:119:                $errors->addMessage('admin.customer.delivery_csv.csv_invalid_zipcode', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/CustomerAddressRowValidator.php:125:                $errors->addMessage('admin.customer.delivery_csv.csv_invalid_pref', $rowNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_confirm.twig:15:{% set mypageno = 'delivery' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_confirm.twig:20:    <div class="p-hareruya-entry p-hareruya-entry--confirm p-hareruya-entry--delivery">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_confirm.twig:38:                        <span itemprop="name">{{ 'front.mypage.title.delivery_breadcrumb_lead'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_confirm.twig:40:                        <span>{{ 'front.mypage.title.delivery_breadcrumb_tail'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_confirm.twig:48:                <h1 class="c-hareruya-heading--lev1">{{ 'front.mypage.title.delivery'|trans }}</h1>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_confirm.twig:49:                <p class="p-hareruya-entry__title-text">{{ 'front.mypage.delivery.confirm_intro'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_confirm.twig:51:            <form method="post" action="{{ id ? url('mypage_delivery_edit_complete', { id: id }) : url('mypage_delivery_new_complete') }}" novalidate>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_confirm.twig:58:                        <div class="p-hareruya-form-block p-hareruya-entry__delivery-name">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_confirm.twig:69:                                <span class="p-hareruya-form-block__label c-hareruya-heading--lev4">{{ 'front.mypage.delivery.shipping_name_label'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_confirm.twig:138:                        <span>{{ 'front.mypage.delivery.confirm_submit'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/navi.twig:24:        <li class="ec-navlistRole__item {% if mypageno|default('') == 'delivery' %}active{% endif %}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/navi.twig:25:            <a href="{{ url('mypage_delivery') }}">{{ 'front.mypage.nav__customer_address'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:156:            + (int) $Order->getDeliveryFeeTotal()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:192:            + (int) $Order->getDeliveryFeeTotal()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:212:        $paymentTotalWithoutCharge = (int) $Order->getSubtotal() + (int) $Order->getDeliveryFeeTotal();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PaymentValidator.php:17:use Eccube\Entity\Delivery;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PaymentValidator.php:22:use Eccube\Repository\DeliveryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PaymentValidator.php:35:    public function __construct(protected DeliveryRepository $deliveryRepository)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PaymentValidator.php:94:     * @return array<int, Delivery>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PaymentValidator.php:98:        /** @var Delivery[] $Deliveries */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PaymentValidator.php:99:        $Deliveries = $this->deliveryRepository->findBy(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PaymentValidator.php:110:     * @param Delivery[] $Deliveries
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PaymentValidator.php:117:        foreach ($Deliveries as $Delivery) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PaymentValidator.php:118:            $PaymentOptions = $Delivery->getPaymentOptions();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeChangeValidator.php:23: * 送料明細の金額とdtb_delivery_feeに登録されている送料の差異を検知するバリデータ.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeChangeValidator.php:25:class DeliveryFeeChangeValidator extends ItemHolderPostValidator
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeChangeValidator.php:48:        if ($originHolder->getDeliveryFeeTotal() != $itemHolder->getDeliveryFeeTotal()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeChangeValidator.php:49:            $this->throwInvalidItemException('purchase_flow.delivery_fee_update', null, true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliverySettingValidator.php:17:use Eccube\Repository\DeliveryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliverySettingValidator.php:25:class DeliverySettingValidator extends ItemValidator
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliverySettingValidator.php:28:     * DeliverySettingValidator constructor.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliverySettingValidator.php:30:    public function __construct(protected DeliveryRepository $deliveryRepository)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliverySettingValidator.php:56:        $Deliveries = $this->deliveryRepository->findBy(['SaleType' => $SaleType, 'visible' => true]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderItemCleanupProcessor.php:27: * 受注確定時にこれらのOrderItemを削除し、Orderのプロパティ（deliveryFeeTotal, charge, discount）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderItemCleanupProcessor.php:46:            if ($processorName === DeliveryFeePreprocessor::class
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:15:{% set mypageno = 'delivery' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:33:    <div class="p-hareruya-entry p-hareruya-entry--delivery">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:51:                        <span itemprop="name">{{ 'front.mypage.title.delivery_breadcrumb_lead'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:53:                        <span>{{ 'front.mypage.title.delivery_breadcrumb_tail'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:61:                <h1 class="c-hareruya-heading--lev1">{{ 'front.mypage.title.delivery'|trans }}</h1>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:62:                <p class="p-hareruya-entry__title-text">{{ 'front.mypage.delivery.edit_notice'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:71:                            <div class="p-hareruya-form-block p-hareruya-entry__delivery-name">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:82:                                            'data-error-required': 'front.mypage.delivery.error.address_name_required'|trans
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:102:                                                    <div class="c-hareruya-heading--lev4">{{ 'front.mypage.delivery.label_name01'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:104:                                                        <label class="u-hareruya-dsp-visually-hidden" for="{{ form.name.name01.vars.id }}">{{ 'front.mypage.delivery.label_name01'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:119:                                                    <div class="c-hareruya-heading--lev4">{{ 'front.mypage.delivery.label_name02'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:121:                                                        <label class="u-hareruya-dsp-visually-hidden" for="{{ form.name.name02.vars.id }}">{{ 'front.mypage.delivery.label_name02'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:155:                                                    <div class="c-hareruya-heading--lev4">{{ 'front.mypage.delivery.label_kana01'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:157:                                                        <label class="u-hareruya-dsp-visually-hidden" for="{{ form.kana.kana01.vars.id }}">{{ 'front.mypage.delivery.label_kana01'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:171:                                                    <div class="c-hareruya-heading--lev4">{{ 'front.mypage.delivery.label_kana02'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:173:                                                        <label class="u-hareruya-dsp-visually-hidden" for="{{ form.kana.kana02.vars.id }}">{{ 'front.mypage.delivery.label_kana02'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:229:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.postalCode.postalCode01.vars.id }}">{{ 'front.mypage.delivery.postal_label_first'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:245:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.postalCode.postalCode02.vars.id }}">{{ 'front.mypage.delivery.postal_label_second'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:299:                                                <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.pref.vars.id }}">{{ 'front.mypage.delivery.label_pref'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:312:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.addr01.vars.id }}">{{ 'front.mypage.delivery.label_addr01'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:323:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.addr02.vars.id }}">{{ 'front.mypage.delivery.label_addr02'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:334:                                            <p class="p-hareruya-entry__help-text">{{ 'front.mypage.delivery.address_help'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:349:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.addr01.vars.id }}">{{ 'front.mypage.delivery.label_addr_overseas_1'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:360:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.addr02.vars.id }}">{{ 'front.mypage.delivery.label_addr_overseas_2'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:371:                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.addr03.vars.id }}">{{ 'front.mypage.delivery.label_addr_overseas_3'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:394:                                                <label class="u-hareruya-dsp-visually-hidden" for="{{ form.tel.tel01.vars.id }}">{{ 'front.mypage.delivery.label_tel01'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:410:                                                <label class="u-hareruya-dsp-visually-hidden" for="{{ form.tel.tel02.vars.id }}">{{ 'front.mypage.delivery.label_tel02'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:426:                                                <label class="u-hareruya-dsp-visually-hidden" for="{{ form.tel.tel03.vars.id }}">{{ 'front.mypage.delivery.label_tel03'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:498:                            <a class="c-hareruya-btn c-hareruya-btn--lg" href="{{ url('mypage_delivery') }}">{{ 'common.back'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeFreeByShippingPreprocessor.php:28:class DeliveryFeeFreeByShippingPreprocessor implements ItemHolderPreprocessor
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeFreeByShippingPreprocessor.php:33:     * DeliveryFeeProcessor constructor.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeFreeByShippingPreprocessor.php:43:        if (!($this->BaseInfo->getDeliveryFreeAmount() || $this->BaseInfo->getDeliveryFreeQuantity())) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeFreeByShippingPreprocessor.php:60:                if ($this->BaseInfo->getDeliveryFreeAmount()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeFreeByShippingPreprocessor.php:61:                    if ($total >= $this->BaseInfo->getDeliveryFreeAmount()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeFreeByShippingPreprocessor.php:66:                if ($this->BaseInfo->getDeliveryFreeQuantity()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeFreeByShippingPreprocessor.php:67:                    if ($quantity >= $this->BaseInfo->getDeliveryFreeQuantity()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeFreeByShippingPreprocessor.php:74:                        if ($Item->getProcessorName() == DeliveryFeePreprocessor::class) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeFreePreprocessor.php:25:class DeliveryFeeFreePreprocessor implements ItemHolderPreprocessor
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeFreePreprocessor.php:30:     * DeliveryFeeProcessor constructor.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeFreePreprocessor.php:40:        $isDeliveryFree = false;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeFreePreprocessor.php:42:        if ($this->BaseInfo->getDeliveryFreeAmount()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeFreePreprocessor.php:43:            if ($this->BaseInfo->getDeliveryFreeAmount() <= $itemHolder->getTotal()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeFreePreprocessor.php:45:                $isDeliveryFree = true;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeFreePreprocessor.php:49:        if ($this->BaseInfo->getDeliveryFreeQuantity()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeFreePreprocessor.php:50:            if ($this->BaseInfo->getDeliveryFreeQuantity() <= $itemHolder->getQuantity()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeFreePreprocessor.php:52:                $isDeliveryFree = true;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeFreePreprocessor.php:57:        if ($isDeliveryFree) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeeFreePreprocessor.php:60:                if ($item->isDeliveryFee()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeePreprocessor.php:19:use Eccube\Entity\DeliveryFee;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeePreprocessor.php:28:use Eccube\Repository\DeliveryFeeRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeePreprocessor.php:37:class DeliveryFeePreprocessor implements ItemHolderPreprocessor
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeePreprocessor.php:42:     * DeliveryFeePreprocessor constructor.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeePreprocessor.php:48:        protected DeliveryFeeRepository $deliveryFeeRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeePreprocessor.php:64:            $this->removeDeliveryFeeItem($itemHolder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeePreprocessor.php:65:            $this->saveDeliveryFeeItem($itemHolder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeePreprocessor.php:69:    private function removeDeliveryFeeItem(ItemHolderInterface $itemHolder): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeePreprocessor.php:75:                    if ($item->getProcessorName() == DeliveryFeePreprocessor::class) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeePreprocessor.php:88:    private function saveDeliveryFeeItem(ItemHolderInterface $itemHolder): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeePreprocessor.php:90:        $DeliveryFeeType = $this->entityManager
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeePreprocessor.php:104:            $deliveryFeeProduct = '0';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeePreprocessor.php:105:            if ($this->BaseInfo->isOptionProductDeliveryFee()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeePreprocessor.php:111:                    $deliveryFeeProduct = bcadd($deliveryFeeProduct, bcmul((string) $item->getProductClass()->getDeliveryFee(), $item->getQuantity(), 2), 2);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeePreprocessor.php:115:            $Delivery = $Shipping->getDelivery();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeePreprocessor.php:117:            /** @var DeliveryFee|null $DeliveryFee */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeePreprocessor.php:118:            $DeliveryFee = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeePreprocessor.php:119:            if ($Delivery !== null && $Pref !== null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeePreprocessor.php:120:                $DeliveryFee = $this->deliveryFeeRepository->getFeeForShipping(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeePreprocessor.php:121:                    $Delivery,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeePreprocessor.php:125:                    $Delivery->isAbroad(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeePreprocessor.php:128:            $fee = is_object($DeliveryFee) ? $DeliveryFee->getFee() : '0';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeePreprocessor.php:131:            $OrderItem->setProductName($DeliveryFeeType->getName())
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeePreprocessor.php:132:                ->setPrice(bcadd($fee, $deliveryFeeProduct))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeePreprocessor.php:135:                ->setOrderItemType($DeliveryFeeType)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/DeliveryFeePreprocessor.php:140:                ->setProcessorName(DeliveryFeePreprocessor::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/PurchaseFlow.php:291:    protected function calculateDeliveryFeeTotal(ItemHolderInterface $itemHolder): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/PurchaseFlow.php:294:            ->getDeliveryFees()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/PurchaseFlow.php:296:        $itemHolder->setDeliveryFeeTotal($total);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/PurchaseFlow.php:333:        $this->calculateDeliveryFeeTotal($itemHolder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/OtcBuy/complete.twig:39:                <p class="c-hareruya-text--sm">※メールが届かない場合、迷惑メールやフィルタ設定を見直していただき、メールが届かない旨をお問い合わせよりご連絡ください。</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:21:            $('#printDeliverySlipsJp').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:23:                $('#form_bulk').attr('action', "{{ url('admin_shipping_standby_print_delivery_slips' ,{'id' : shippingStandby.id, 'lang' : 'ja' }) }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:29:            $('#printDeliverySlipsEn').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:31:                $('#form_bulk').attr('action', "{{ url('admin_shipping_standby_print_delivery_slips' ,{'id' : shippingStandby.id, 'lang' : 'en' }) }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:120:                                                    <button type="button" id="printDeliverySlipsJp" class="btn btn-primary btn-sm edit">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:121:                                                        {{ 'admin.order.print_delivery_slips_ja'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:123:                                                    <button type="button" id="printDeliverySlipsEn" class="btn btn-primary btn-sm edit">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:124:                                                        {{ 'admin.order.print_delivery_slips_en'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/footer.twig:27:                <div class="p-hareruya-footer__feature-icon"><i class="icon-hareruya-delivery c-hareruya-icon--lg"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/footer.twig:28:                <p class="p-hareruya-footer__feature-text">{{ 'front.footer.feature.delivery'|trans|raw }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:20:        <link rel="stylesheet" type="text/css" href="{{ asset('assets/css/deliveryslips.css', 'admin') }}"/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:29:        {% for orderId, DeliverySlip in DeliverySlips %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:31:        {% for OrderItem in DeliverySlip.OrderItems %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:36:                    {{ 'admin.delivery_slips_ja'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:39:                    {{ loop.index // maxPageRows + 1 }}/{{ (DeliverySlip.OrderItems|length - 1) // maxPageRows + 1 }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:42:                    {{ 'admin.delivery_slips_ja.order_number'|trans }}:<span style="font-weight: normal;">{{ (DeliverySlip.order_number) }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:44:                {% if DeliverySlip.delivery_id == constant('Eccube\\Entity\\Delivery::SMOOTH_OTC') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:46:                    {{ 'admin.delivery_slips_ja.recipient_sign'|trans }}:&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:51:                        <b>{{ 'admin.delivery_slips_ja.delivery'|trans }}</b><br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:53:                        {% if DeliverySlip.shipping_pref_id == constant('Eccube\\Entity\\Master\\Pref::PREF_ABROAD') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:54:                            {{ DeliverySlip.shipping_country }}<br />
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:55:                            {% set formattedShippingZip = DeliverySlip.shipping_abroad_postal_code|default('') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:57:                            {% set rawShippingZip = DeliverySlip.shipping_postalCode|default('')|replace({'-': ''})|trim %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:60:                        〒{{ formattedShippingZip }} {% if DeliverySlip.shipping_pref_id != constant('Eccube\\Entity\\Master\\Pref::PREF_ABROAD') %}{{ DeliverySlip.shipping_pref }}{% endif %}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:61:                        {{ DeliverySlip.shipping_addr01 }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:62:                        {{ DeliverySlip.shipping_addr02 }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:63:                        TEL：{{ DeliverySlip.shipping_tel01 }}{{ DeliverySlip.shipping_tel02 }}{{ DeliverySlip.shipping_tel03 }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:64:                        {{ DeliverySlip.shipping_name01 }}&nbsp;{{ DeliverySlip.shipping_name02 }}{{ 'common.name.suffix'|trans }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:67:                        <b>{{ 'admin.delivery_slips_ja.sender'|trans }}</b><br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:70:                        {% if DeliverySlip.customer_pref_id == constant('Eccube\\Entity\\Master\\Pref::PREF_ABROAD') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:71:                            {{ DeliverySlip.customer_country }}<br />
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:72:                            〒{% set senderPostal = DeliverySlip.customer_abroad_postal_code|default('') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:74:                            {% set rawCustomerZip = DeliverySlip.customer_postalCode|default('')|replace({'-': ''})|trim %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:77:                        {% if DeliverySlip.customer_pref_id != constant('Eccube\\Entity\\Master\\Pref::PREF_ABROAD') %}{{ 'admin.common.postal_symbol'|trans }}{% endif %}{{ senderPostal }}{% if DeliverySlip.customer_pref_id != constant('Eccube\\Entity\\Master\\Pref::PREF_ABROAD') %} {{ DeliverySlip.customer_pref }}{% endif %}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:78:                        {{ DeliverySlip.customer_addr01 }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:79:                        {{ DeliverySlip.customer_addr02 }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:80:                        {% if DeliverySlip.customer_pref_id == constant('Eccube\\Entity\\Master\\Pref::PREF_ABROAD') and DeliverySlip.customer_addr03 %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:81:                            {{ DeliverySlip.customer_addr03 }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:83:                        {{ 'admin.common.phone_number_short'|trans }}：{{ DeliverySlip.customer_tel01 }}{{ DeliverySlip.customer_tel02 }}{{ DeliverySlip.customer_tel03 }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:84:                        {{ DeliverySlip.customer_name01 }}&nbsp;{{ DeliverySlip.customer_name02 }}{{ 'common.name.suffix'|trans }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:85:                        {{ 'admin.delivery_slips_ja.customer_id'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:86:                        {% if DeliverySlip.smaregi_id is defined and DeliverySlip.smaregi_id is not null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:87:                            {{ DeliverySlip.smaregi_id }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:89:                            {{ 'admin.delivery_slips_ja.non_member'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:103:                       <div style="padding-top: 3px;">{{ 'admin.delivery_slips_ja.invoice_registration_number'|trans }}:{{ BaseInfo.invoice_registration_number }}</div><br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:110:                                <th class="subtotal_">{{ 'admin.delivery_slips_ja.subtotal'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:111:                                <th class="postage_">{{ 'admin.delivery_slips_ja.postage'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:112:                                <th class="charge_">{{ 'admin.delivery_slips_ja.charge'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:113:                                <th class="point_out_">{{ 'admin.delivery_slips_ja.point_out'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:114:                                <th class="delivery_method_">{{ 'admin.delivery_slips_ja.delivery_method'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:117:                                <td class="subtotal_">{{ DeliverySlip.subtotal|price }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:118:                                <td class="postage_">{{ DeliverySlip.delivery_fee_total|price }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:119:                                <td class="charge_">{{ DeliverySlip.charge|price }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:120:                                <td class="point_out_">{{ DeliverySlip.discount|number_format(0) }}<small>{{ 'common.point'|trans }}</small>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:122:                                <td class="delivery_method_">{{ DeliverySlip.delivery }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:129:                                <th class="total_">{{ 'admin.delivery_slips_ja.total_tax_included'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:132:                                <td class="total_">{{ DeliverySlip.total|price }}({{ 'admin.delivery_slips_ja.tax_included'|trans }}:{{ DeliverySlip.tax|price }})</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:142:                                    {{ 'admin.delivery_slips_ja.product_name'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:145:                                    {{ 'admin.delivery_slips_ja.price'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:148:                                    {{ 'admin.delivery_slips_ja.quantity'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:151:                                    {{ 'admin.delivery_slips_ja.amount'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:172:                                    {{ 'admin.delivery_slips_ja.amount'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:177:                                    {{ subtotal_quantity }}/{{ DeliverySlip.total_quantity }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/validators.en.yaml:75:form.type.admin.nottrackingnumberstyle: Tracking No. entry must be alphanumeric chars and hypens.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:20:        <link rel="stylesheet" type="text/css" href="{{ asset('assets/css/deliveryslips.css', 'admin') }}"/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:29:        {% for orderId, DeliverySlip in DeliverySlips %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:31:        {% for OrderItem in DeliverySlip.OrderItems %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:36:                    {{ 'admin.delivery_slips_en'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:39:                    {{ loop.index // maxPageRows + 1 }}/{{ (DeliverySlip.OrderItems|length - 1) // maxPageRows + 1 }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:42:                    {{ 'admin.delivery_slips_en.order_number'|trans }}:<span style="font-weight: normal;">{{ (DeliverySlip.order_number) }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:46:                        <b>{{ 'admin.delivery_slips_en.delivery'|trans }}</b><br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:48:                        {% if DeliverySlip.shipping_pref_id == constant('Eccube\\Entity\\Master\\Pref::PREF_ABROAD') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:49:                            {% set shippingPostal = DeliverySlip.shipping_abroad_postal_code|default('') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:51:                            {% set rawShippingZip = DeliverySlip.shipping_postalCode|default('')|replace({'-': ''})|trim %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:54:                        {{ 'admin.delivery_slips_en.postal_code'|trans }}{{ shippingPostal }}{% if DeliverySlip.shipping_pref_id == constant('Eccube\\Entity\\Master\\Pref::PREF_ABROAD') %} {{ DeliverySlip.shipping_country }}{% endif %}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:55:                        {{ DeliverySlip.shipping_addr01 }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:56:                        {{ DeliverySlip.shipping_addr02 }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:57:                        {% if DeliverySlip.shipping_pref_id == constant('Eccube\\Entity\\Master\\Pref::PREF_ABROAD') and DeliverySlip.shipping_addr03 %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:58:                            {{ DeliverySlip.shipping_addr03 }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:60:                        {{ 'admin.common.phone_number_short'|trans }}：{{ DeliverySlip.shipping_tel01 }}{{ DeliverySlip.shipping_tel02 }}{{ DeliverySlip.shipping_tel03 }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:61:                        {{ DeliverySlip.shipping_name02 }}&nbsp;{{ DeliverySlip.shipping_name01 }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:64:                        <b>{{ 'admin.delivery_slips_en.sender'|trans }}</b><br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:67:                        {% if DeliverySlip.customer_pref_id == constant('Eccube\\Entity\\Master\\Pref::PREF_ABROAD') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:68:                            {% set senderPostal = DeliverySlip.customer_abroad_postal_code|default('') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:70:                            {% set rawCustomerZip = DeliverySlip.customer_postalCode|default('')|replace({'-': ''})|trim %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:73:                        {{ 'admin.delivery_slips_en.postal_code'|trans }}{{ senderPostal }} {{ DeliverySlip.customer_country }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:74:                        {{ DeliverySlip.customer_addr01 }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:75:                        {{ DeliverySlip.customer_addr02 }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:76:                        {% if DeliverySlip.customer_pref_id == constant('Eccube\\Entity\\Master\\Pref::PREF_ABROAD') and DeliverySlip.customer_addr03 %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:77:                            {{ DeliverySlip.customer_addr03 }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:79:                        {{ 'admin.common.phone_number_short'|trans }}：{{ DeliverySlip.customer_tel01 }}{{ DeliverySlip.customer_tel02 }}{{ DeliverySlip.customer_tel03 }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:80:                        {{ DeliverySlip.customer_name02 }}&nbsp;{{ DeliverySlip.customer_name01 }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:98:                                <th class="subtotal_">{{ 'admin.delivery_slips_en.subtotal'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:99:                                <th class="postage_">{{ 'admin.delivery_slips_en.postage'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:100:                                <th class="charge_">{{ 'admin.delivery_slips_en.charge'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:101:                                <th class="point_out_">{{ 'admin.delivery_slips_en.point_out'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:102:                                <th class="delivery_method_">{{ 'admin.delivery_slips_en.delivery_method'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:105:                                <td class="subtotal_">{{ DeliverySlip.subtotal|price }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:106:                                <td class="postage_">{{ DeliverySlip.delivery_fee_total|price }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:107:                                <td class="charge_">{{ DeliverySlip.charge|price }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:108:                                <td class="point_out_">{{ DeliverySlip.discount|number_format(0) }}<small>{{ 'admin.delivery_slips_en.point'|trans }}</small>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:110:                                <td class="delivery_method_">{{ DeliverySlip.delivery }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:117:                                <th class="total_">{{ 'admin.delivery_slips_en.total'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:118:                                <td class="total_">{{ DeliverySlip.total|price }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:128:                                    {{ 'admin.delivery_slips_en.product_name'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:131:                                    {{ 'admin.delivery_slips_en.price'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:134:                                    {{ 'admin.delivery_slips_en.quantity'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:137:                                    {{ 'admin.delivery_slips_en.amount'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:158:                                    {{ 'admin.delivery_slips_en.amount'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:163:                                    {{ subtotal_quantity }}/{{ DeliverySlip.total_quantity }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:336:                                        {{ form_widget(form.deliveryFee, { value : form.deliveryFee.vars.value, 'attr': { 'class': 'product editform' } }) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:337:                                        {{ form_errors(form.deliveryFee) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/minimum_delivery_time_edit.twig:3:{% set menus = ['setting', 'basic_info', 'shop_delivery'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/minimum_delivery_time_edit.twig:5:{% block title %}{{ 'admin.setting.shop.delivery.minimum_delivery_time_setting'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/minimum_delivery_time_edit.twig:12:            <form method="post" action="{{ url('admin_setting_shop_delivery_minimum_delivery_time_edit', {id: Delivery.id}) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/minimum_delivery_time_edit.twig:16:                        <span>{{ 'admin.setting.shop.delivery.minimum_delivery_time_setting'|trans }}：{{ Delivery.name }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/minimum_delivery_time_edit.twig:22:                                    <th class="border-top-0 pt-2 pb-2 ps-3">{{ 'admin.setting.shop.delivery.pref'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/minimum_delivery_time_edit.twig:23:                                    <th class="border-top-0 pt-2 pb-2">{{ 'admin.setting.shop.delivery.minimum_arraival_date'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/minimum_delivery_time_edit.twig:24:                                    <th class="border-top-0 pt-2 pb-2">{{ 'admin.setting.shop.delivery.delivery_time_setting'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/minimum_delivery_time_edit.twig:29:                                    {% set existing = minimumDeliveryTimesByPrefId[Pref.id] ?? null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/minimum_delivery_time_edit.twig:41:                                            <select name="pref_data[{{ Pref.id }}][delivery_time_id]" class="form-select form-select-sm" style="width: auto;">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/minimum_delivery_time_edit.twig:43:                                                {% for DeliveryTime in DeliveryTimes %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/minimum_delivery_time_edit.twig:44:                                                    <option value="{{ DeliveryTime.id }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/minimum_delivery_time_edit.twig:45:                                                        {% if existing and existing.deliveryTime.id == DeliveryTime.id %}selected{% endif %}>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/minimum_delivery_time_edit.twig:46:                                                        {{ DeliveryTime.deliveryTime }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/minimum_delivery_time_edit.twig:62:                                    <a class="c-baseLink" href="{{ url('admin_setting_shop_delivery_edit', {id: Delivery.id}) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/minimum_delivery_time_edit.twig:64:                                        <span>{{ 'admin.setting.shop.delivery_setting'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:167:            $('#printDeliverySlipsJp').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:173:                $('#form_bulk').attr('action', "{{ url('admin_delivery_slips_export', { 'lang': 'ja' }) }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:180:            $('#printDeliverySlipsEn').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:186:                $('#form_bulk').attr('action', "{{ url('admin_delivery_slips_export', { 'lang': 'en' }) }}");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:204:            var updateTrackingNumber = function(id, url, tracking_number, callback) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:208:                    data: {'tracking_number': tracking_number}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:211:                        $('#tracking_number_' + id).val(data['tracking_number']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:243:            $('button.update_tracking_number').prop('disabled', true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:245:            $('input.update_tracking_number').on('keyup', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:246:                var $tracking_number = $(this);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:247:                var $button = $("button[data-target='#" + $tracking_number.attr('id') + "']");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:254:            $('input.update_tracking_number').on('keypress', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:255:                var $tracking_number = $(this);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:256:                var $button = $("button[data-target='#" + $tracking_number.attr('id') + "']");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:261:                    var index = $('input.update_tracking_number').index(this);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:267:                        $('input.update_tracking_number:gt(' + index + '):first').focus();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:269:                    updateTrackingNumber($tracking_number.data('shipping_id'), $tracking_number.data('url'), $tracking_number.val(), callback);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:274:            $('button.update_tracking_number').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:278:                var tracking_number = $target.val();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:285:        updateTrackingNumber($target.data('shipping_id'), $target.data('url'), tracking_number, callback);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:367:    setupCollapseToggle('searchDetailDelivery');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:468:                        <label class="col-form-label">{{ 'admin.order.delivery_provider'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:469:                        {{ form_widget(searchForm.delivery, { 'label_attr': { 'class': 'checkbox-inline'}}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:470:                        {{ form_errors(searchForm.delivery) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:968:                                    <button type="button" class="btn btn-ec-regular admin-product-search-detail-toggle px-3" data-bs-toggle="collapse" data-bs-target="#searchDetailDelivery" aria-expanded="{{ has_errors ? 'true' : 'false' }}" aria-controls="searchDetailDelivery" aria-label="{{ 'admin.common.search_detail'|trans }}" title="{{ 'admin.common.search_detail'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:980:            <div class="c-subContents ec-collapse collapse{{ has_errors ? ' show' }} search-box-inner" id="searchDetailDelivery">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1105:                                        <button type="button" id="bulkExportPdf" class="btn btn-ec-regular me-2">{{ 'admin.order.output_delivery_note_short'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1214:                                            <button type="button" id="printDeliverySlipsJp" class="btn btn-ec-conversion px-5">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1215:                                                {{ 'admin.order.print_delivery_slips_ja'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1217:                                            <button type="button" id="printDeliverySlipsEn" class="btn btn-ec-conversion px-5">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1218:                                                {{ 'admin.order.print_delivery_slips_en'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1240:                                        <th class="border-top-0 pt-2 pb-2 text-center">{{ 'enterprise.admin.shop.name'|trans }}<a href="#" class="js-listSort" data-sortkey="delivery"><i class="fa fa-arrow-up" aria-hidden="true"></i></a></th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1306:                                                            <a class="btn btn-ec-actionIcon pdf-print" href="{{ url('admin_order_export_pdf') }}?ids[]={{ Shipping.id }}" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'admin.order.output_delivery_note_short'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content.en.twig:6:{% if data.Shippings[0].delivery.id not in constant('Eccube\\Entity\\Delivery::OTC_GROUP') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content.en.twig:27: Postage : {{ data.deliveryFeeTotal|price }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content.en.twig:33:[Delivery method] {{ data.Shippings[0].shippingDeliveryName }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content.en.twig:35:[Delivery Date] {% if data.Shippings[0].shippingDeliveryDate is not null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content.en.twig:37:{% for value in weekday|slice((data.Shippings[0].shippingDeliveryDate|date('w') + weekday|length - 1) % weekday|length, 1) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content.en.twig:38:{{ data.Shippings[0].shippingDeliveryDate|date('m/d/Y') }} ({{ value }})
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content.en.twig:44:[Desired Delivery Window] {{ data.Shippings[0].shippingDeliveryTime ? ('admin.' ~ data.Shippings[0].shippingDeliveryTime ~ '.en')|trans : 'No Request' }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/shipment_complete.twig:5:{% if data.Order.Shippings.0.delivery.confirm_url is not empty %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/shipment_complete.twig:6:配送確認URL：{{ data.Order.Shippings.0   .delivery.confirm_url }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/shipment_complete.twig:21:　送料：{{ data.Order.deliveryFeeTotal|price }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/buy_order_include_delivery_fee_old.twig:20:　送料：{{ buyOrder.deliveryFee|price }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/buy_order_include_delivery_fee_old.twig:21:【送金金額】　{{ buyOrder.getAcceptanceTotalPrice + buyOrder.deliveryFee }} 円
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/buy_order_assessment.twig:58:　送料：{{ BuyOrder.deliveryFee|price }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:97:common.delivery_fee: 送料
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:227:  申込完了から1日以内にメールが届かない場合、お手数ですが下記フォームよりお問い合わせください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:306:front.block.footer.inquiry: お問い合わせ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:363:front.contact.title: お問い合わせ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:368:front.contact.order_notice: ご注文に関するお問い合わせには、必ず「ご注文番号」をご記入くださいますようお願いいたします。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:369:front.contact.inquiry_contents: お問い合わせ内容
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:370:front.contact.complete_title: お問い合わせ完了
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:371:front.contact.complete_message__title: お問い合わせ内容の送信が完了いたしました
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:373:  お問い合わせが完了いたしました。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:384:front.contact.sub_subject: お問い合わせ詳細
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:389:front.contact.name: お問い合わせ時氏名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:404:front.contact.contact_detail: お問い合わせ詳細
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:407:front.contact_history.title: お問い合わせ履歴一覧
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:409:front.contact_history.inquiry_number: お問い合わせ番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:410:front.contact_history.breadcrumb_inquiry: お問い合わせ番号：%id%
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:411:front.contact_history.detail.title: お問い合わせ履歴詳細
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:412:front.contact_history.empty: お問い合わせ履歴はありません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:414:front.contact_history.inquiry_number_parens: "（お問い合わせ番号：%id%）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:442:  ※メールが届かない場合、迷惑メールやフィルタ設定を見直していただき、メールが届かない旨をお問い合わせよりご連絡ください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:456:front.entry.activate_error.activate_failed.message: 時間を置いて再度お試しいただくか、お問い合わせください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:489:front.mypage.delivery.error.address_name_required: 配送先名称を入力してください
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:533:front.agreement.s2.body: "晴れる屋をご利用いただく場合、利用者には本規約の条項を熟読、理解した上で利用を開始する義務を負います。また書き込み・投稿・問合せを行う場合は、あらかじめ送信方法・送信内容に問題がないことを確認する義務を負うこととします。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:539:front.agreement.s4.body3: "マジック：ザ・ギャザリングはWizards of the Coast, LLCの登録商標であり、それらのロゴ、シンボル、全てのカード、また、マジック：ザ・ギャザリングに関わる全ての権利についてはWizards of the Coast, LLCにお問い合わせください。全てのデッキリストは、掲載元であるWebサイトから転載の許可を得て、掲載しています。このサイトは、Wizards of the Coast, LLCが運営する公式なサイトではありません。上記を除く全ての権利は株式会社晴れる屋が保有しています。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:678:front.mypage.delivery_info: 配送情報
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:679:front.mypage.delivery: お届け先
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:680:front.mypage.delivery_provider: 配送方法
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:681:front.mypage.delivery_date: お届け日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:682:front.mypage.delivery_time: お届け時間
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:687:front.mypage.message: お問い合わせ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:737:front.mypage.delivery.notify_title: お届け先情報編集
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:738:front.mypage.delivery.list_intro: 配送先の情報をアドレス帳に登録しておくことができます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:739:front.mypage.delivery.add_address_button: 新しい住所を追加
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:740:front.mypage.delivery.company_prefix: "会社名: "
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:741:front.mypage.delivery.tel_abbr: "TEL:"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:742:front.mypage.delivery.address_untitled: お届け先 %num%
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:743:front.mypage.delivery.shipping_name_label: 配送先氏名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:744:front.mypage.delivery.edit_notice: 既にいただいています（準備中も含む）ご注文の注文者ならびに配送先の情報は変更されませんので、変更が必要な場合は弊社へご連絡をお願い致します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:745:front.mypage.delivery.address_help: 町名・番地の入力漏れにご注意ください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:746:front.mypage.delivery.confirm_intro: 下記の内容で登録してもよろしいでしょうか？よろしければ「登録する」へお進みください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:747:front.mypage.delivery.confirm_submit: 登録する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:748:front.mypage.delivery.label_name01: 姓
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:749:front.mypage.delivery.label_name02: 名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:750:front.mypage.delivery.label_kana01: セイ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:751:front.mypage.delivery.label_kana02: メイ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:752:front.mypage.delivery.postal_label_first: 郵便番号（前3桁）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:753:front.mypage.delivery.postal_label_second: 郵便番号（後4桁）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:754:front.mypage.delivery.label_pref: 住所（都道府県）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:755:front.mypage.delivery.label_addr01: 住所（市区町村）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:756:front.mypage.delivery.label_addr02: 住所（番地・建物名）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:757:front.mypage.delivery.label_addr03: 住所（建物名・部屋番号）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:758:front.mypage.delivery.label_addr_overseas_1: 住所（海外・住所1）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:759:front.mypage.delivery.label_addr_overseas_2: 住所（海外・住所2）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:760:front.mypage.delivery.label_addr_overseas_3: 住所（海外・住所3）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:761:front.mypage.delivery.label_tel01: 電話番号（市外局番）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:762:front.mypage.delivery.label_tel02: 電話番号（市内局番）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:763:front.mypage.delivery.label_tel03: 電話番号（加入者番号）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:765:front.mypage.delivery.delete_confirm: "%name01%　%name02%様の情報をアドレス帳から削除しますか？"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:778:front.mypage.index.menu.delivery_html: '配送先の<br>新規登録・変更'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:779:front.mypage.index.menu.contact_history_html: 'お問い合わせ<br class="u-hareruya-dsp-sp">履歴'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:794:front.mypage.title.contact: お問い合わせ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:966:front.mypage.title.delivery: 配送先の新規登録・変更
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:967:front.mypage.title.delivery_breadcrumb_lead: 配送先の新規登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:968:front.mypage.title.delivery_breadcrumb_tail: 変更
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:997:front.mypage.shopping_history.col.delivery_information: お届け先情報
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1289:front.cart.delivery_fee_free__now: 現在送料無料です。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1290:front.cart.delivery_fee_free__price_and_quantity: 'あと「<strong>%price%</strong>」または「<strong>%quantity%個</strong>」のお買い上げで<strong class="ec-color-red">送料無料</strong>になります。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1291:front.cart.delivery_fee_free__price: 'あと「<strong>%price%</strong>」で<strong class="ec-color-red">送料無料</strong>'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1292:front.cart.delivery_fee_free__quantity: 'あと「<strong>%quantity%個</strong>」のお買い上げで<strong class="ec-color-red">送料無料</strong>になります。'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1337:front.shopping.delivery_info: お届け先
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1338:front.shopping.delivery_to: お届け先
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1339:front.shopping.delivery_method: 配送方法指定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1340:front.shopping.delivery_modal.heading: 配送について
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1341:front.shopping.delivery_modal.section_title: 《配送方法》
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1342:front.shopping.delivery_modal.intro: 2種類の発送方法をご用意しております。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1343:front.shopping.delivery_modal.yupacket.title: "●ゆうパケット (全国一律180円)"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1344:front.shopping.delivery_modal.yupacket.li1: 日本郵便、ゆうパケットサービスでの発送です。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1345:front.shopping.delivery_modal.yupacket.li2: 1件の商品代金合計が30,000円以上は送料無料、ゆうパックにてお送りいたします。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1346:front.shopping.delivery_modal.yupacket.li3: 郵便局止めをご希望の方は、ご希望の郵便局名、住所を備考欄にご記入お願いいたします。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1347:front.shopping.delivery_modal.yupacket.note1: ※代引きでのゆうパケットの指定はご利用いただけません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1348:front.shopping.delivery_modal.yupacket.note2: ※購入商品が一定のサイズを超えた場合、ゆうパケットはご利用いただけません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1349:front.shopping.delivery_modal.yupacket.note3: ※ゆうパケットをご利用頂いた場合の配送時の商品の紛失・破損があった場合には返品、返金はお受けできません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1350:front.shopping.delivery_modal.yupacket.note4: ※保証をご希望の場合はゆうパックをご利用ください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1351:front.shopping.delivery_modal.yupack.title: "●ゆうパック(550円～)"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1352:front.shopping.delivery_modal.yupack.li1: 日本郵便、ゆうパックサービスでの発送です。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1353:front.shopping.delivery_modal.yupack.li2: 地域によっては最速で翌日午前に到着するため、お急ぎの方にお勧めです。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1354:front.shopping.delivery_modal.yupack.li3: また、日時指定も可能ですので、日時指定をご希望の場合もゆうパックサービスをご利用ください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1355:front.shopping.delivery_modal.yupack.note1: ※1件のご注文に対して、商品合計金額が30,000円以上は送料無料
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1356:front.shopping.delivery_modal.yupack.note2: ※郵送事故が起きた場合の賠償額は、原則として50万円までの実損額となります。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1357:front.shopping.delivery_modal.yupack.note3: ※お受け取りいただけず、保持期限が過ぎて返送されてきた商品につきましては、再送料を頂く場合があります。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1358:front.shopping.delivery_modal.yupack.note4: ※郵便局留めをご希望の方は、ご希望の郵便局名、住所を備考欄にご記入をお願いいたします。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1359:front.shopping.delivery_modal.combined.title: ●同梱
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1360:front.shopping.delivery_modal.combined.li1: 発送方法を選択する際に【同梱】をご選択いただく事で、複数のご注文を取り纏めて発送する事が可能です。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1361:front.shopping.delivery_modal.combined.li2: 備考欄に「追加を希望する注文のオーダーID」をご記載の上、発送方法は【同梱】をご選択してご注文をお願いいたします。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1362:front.shopping.delivery_modal.combined.li3: 同梱をご希望されましたご注文と取り纏めて発送させていただきます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1363:front.shopping.delivery_modal.combined.note1: ※同梱をご希望されますご注文のお支払方法に「クレジットカード」「代金引換」「コンビニ決済」のいずれかが含まれる場合は、同梱発送をお断りさせていただいております。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1364:front.shopping.delivery_modal.combined.note2: ※同梱が可能な注文数は同梱元の注文を含めて最大3件までとさせていただいております。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1365:front.shopping.delivery_modal.combined.note3: ※4件目以降で同梱をご希望いただいた場合は3件目までを同梱させていただき、4件目以降のご注文の同梱発送はお断りさせていただいております。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1366:front.shopping.delivery_modal.combined.note4: ※ご注文内容に予約商品を含むご注文については同梱発送をお断りさせていただいております。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1367:front.shopping.delivery_modal.combined.note5: ※既にご入金をいただいている場合はお受けできない場合がございます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1457:front.shopping.delivery_provider: 配送方法
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1458:front.shopping.delivery_date: 配送希望日時指定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1459:front.shopping.delivery_time: お届け時間
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1460:front.shopping.delivery.change: お届け先情報を変更する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1461:front.shopping.delivery.add: 新しいお届け先を追加する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1462:front.shopping.delivery.phone_number_short: TEL
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1463:front.shopping.delivery.membership_information_address: 会員情報住所 / Membership Information Address
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1485:front.shopping.message_placeholder: お問い合わせ事項がございましたら、こちらにご入力ください。(3000文字まで)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1503:  万一、ご確認メールが届かない場合は、トラブルの可能性もありますので大変お手数ではございますがお問い合わせくださいますようお願いいたします。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1513:front.shopping.system_error: 購入処理で予期しないエラーが発生しました。恐れ入りますがお問い合わせページよりご連絡ください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1519:front.shopping.in_preparation: "「%product%」はまだ配送の準備ができておりません。恐れ入りますがお問い合わせページよりお問い合わせください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1799:admin.common.ga.tracking_id: "G-XXXXXXXXXX"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2041:admin.product.delivery_duration: 発送日目安
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2042:admin.product.delivery_fee: 商品送料
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2275:admin.product.product_csv.delivery_duration_col: 発送日目安(ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2276:admin.product.product_csv.delivery_duration_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2289:admin.product.product_csv.delivery_fee_col: 送料
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2290:admin.product.product_csv.delivery_fee_description: 商品ごとの送料設定が有効の場合、0以上の数値を設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2430:admin.order.delivery_date__start: お届け日(開始)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2431:admin.order.delivery_date__end: お届け日(終了)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2440:admin.order.message: お問い合わせ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2441:admin.order.message_short: お問合せ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2451:admin.order.output_delivery_note: 納品書を出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2452:admin.order.output_delivery_note_short: 納品書出力
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2453:admin.order.print_delivery_slips_ja: 納品書印刷（日本語）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2454:admin.order.print_delivery_slips_en: 納品書印刷（英語）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2472:admin.order.delivery_fee: 送料
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2485:admin.order.tracking_number: 送り状No.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2486:admin.order.tracking_number_error: 送り状No.は半角英数字かハイフンのみを入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2502:admin.order.delivery_date: お届け日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2503:admin.order.delivery_time: お届け時間
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2504:admin.order.delivery_provider: 配送方法
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2531:admin.order.delivery: お届け先
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2545:admin.order.delivery_note_create_date: 発行日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2546:admin.order.delivery_note_title: タイトル
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2547:admin.order.delivery_note_title__default: お買上げ明細書(納品書)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2548:admin.order.delivery_note_output_format: 出力形式
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2549:admin.order.delivery_note_output_format__browser: ブラウザで開く
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2550:admin.order.delivery_note_output_format__file: ファイルに保存
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2551:admin.order.delivery_note_message: メッセージ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2552:admin.order.delivery_note_message__default1: このたびはお買上げいただきありがとうございます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2553:admin.order.delivery_note_message__default2: 下記の内容にて納品させていただきます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2554:admin.order.delivery_note_message__default3: ご確認くださいますよう、お願いいたします。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2555:admin.order.delivery_note_memo: 備考
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2556:admin.order.delivery_note_line1: 1行目
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2557:admin.order.delivery_note_line2: 2行目
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2558:admin.order.delivery_note_line3: 3行目
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2559:admin.order.delivery_note_save_input: 入力内容を保存する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2560:admin.order.delivery_note_download_error: "ダウンロードに失敗しました"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2561:admin.order.delivery_note_parameter_error: "出荷IDが指定されていません"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2578:admin.order.shipping_csv.tracking_number_col: お問い合わせ番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2579:admin.order.shipping_csv.tracking_number_description: 半角英数字かハイフンのみで設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2590:admin.delivery_slips_ja: 納品書
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2591:admin.delivery_slips_ja.order_number: 注文番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2592:admin.delivery_slips_ja.recipient_sign: 受取人署名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2593:admin.delivery_slips_ja.delivery: お届け先
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2594:admin.delivery_slips_ja.sender: 送り主
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2595:admin.delivery_slips_ja.customer_id: 会員番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2596:admin.delivery_slips_ja.non_member: 非会員
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2597:admin.delivery_slips_ja.invoice_registration_number: 登録番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2598:admin.delivery_slips_ja.subtotal: お買上額
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2599:admin.delivery_slips_ja.postage: 送料
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2600:admin.delivery_slips_ja.charge: 手数料
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2601:admin.delivery_slips_ja.point_out: ポイント使用
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2602:admin.delivery_slips_ja.delivery_method: 発送方法
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2603:admin.delivery_slips_ja.total_tax_included: 請求金額(税込)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2604:admin.delivery_slips_ja.tax_included: 内税
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2605:admin.delivery_slips_ja.product_name: 商品情報
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2606:admin.delivery_slips_ja.price: 価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2607:admin.delivery_slips_ja.quantity: 数量
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2608:admin.delivery_slips_ja.amount: 合計
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2611:admin.delivery_slips_en: Delivery Slip
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2612:admin.delivery_slips_en.postal_code: Postal Code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2613:admin.delivery_slips_en.order_number: OrderID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2614:admin.delivery_slips_en.delivery: Addressee
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2615:admin.delivery_slips_en.sender: Sender
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2616:admin.delivery_slips_en.subtotal: Item Total
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2617:admin.delivery_slips_en.postage: Postage
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2618:admin.delivery_slips_en.charge: Fee
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2619:admin.delivery_slips_en.point_out: Points Used
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2620:admin.delivery_slips_en.point: Points
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2621:admin.delivery_slips_en.delivery_method: Delivery method
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2622:admin.delivery_slips_en.total: Order Total
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2623:admin.delivery_slips_en.product_name: Item
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2624:admin.delivery_slips_en.price: Price
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2625:admin.delivery_slips_en.quantity: Quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2626:admin.delivery_slips_en.amount: Total
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2934:admin.setting.shop.delivery_list: 配送方法設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2935:admin.setting.shop.delivery_setting: 配送方法設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3000:admin.setting.shop.shop.option_delivery_fee: 送料設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3001:admin.setting.shop.shop.option_delivery_fee_free_amount: 送料無料条件（金額）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3002:admin.setting.shop.shop.option_delivery_fee_free_quantity: 送料無料条件（数量）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3003:admin.setting.shop.shop.option_delivery_fee_by_product: 商品ごとの送料設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3021:admin.setting.shop.shop.ga.tracking_id: "トラッキングID"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3052:admin.setting.shop.delivery.base_info: 基本情報
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3053:admin.setting.shop.delivery.delivery_name: 配送業者名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3054:admin.setting.shop.delivery.delivery_sevice_name: 名称
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3055:admin.setting.shop.delivery.delivery_sevice_name_en: 名称(英)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3056:admin.setting.shop.delivery.is_abroad: 国外配送
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3057:admin.setting.shop.delivery.is_shipping_standby_list_exclusion: 出荷指示リストから除外
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3058:admin.setting.shop.delivery.tracking_number_url: お問い合わせ番号URL
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3059:admin.setting.shop.delivery.max_size: 上限サイズ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3060:admin.setting.shop.delivery.lead_time: 最短納品日数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3061:admin.setting.shop.delivery.minimum_delivery_time_setting: 地域別最短到着日設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3062:admin.setting.shop.delivery.minimum_arraival_date: 最短到着日数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3063:admin.setting.shop.delivery.minimum_delivery_time_save_complete: 地域別最短到着日設定を保存しました。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3064:admin.setting.shop.delivery.sale_type: 販売種別
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3065:admin.setting.shop.delivery.payment_method: 取り扱う支払方法
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3066:admin.setting.shop.delivery.delivery_time_setting: お届け時間設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3067:admin.setting.shop.delivery.delivery_fee_by_pref: 都道府県別送料設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3068:admin.setting.shop.delivery.apply_to_pref__title: 全国一律に設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3069:admin.setting.shop.delivery.apply_to_pref__button: 各都道府県に適用
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3070:admin.setting.shop.delivery.fee.invalid: 数字で入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3071:admin.setting.shop.delivery.payment_warning: "税込%min% ~ %max%の購入で選択できる支払い方法がありません。支払方法の利用条件をご確認ください。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3468:admin.store.plugin_owners_search.modal.contact: 資料請求・お問い合わせ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3553:tooltip.product.delivery_duration: 発送日の目安期間を商品ごとに登録できます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3570:tooltip.order.shipping_info.tracking_number: お問い合せ番号（出荷伝票番号）がある場合、こちらから入力できます。受注一覧からまとめて入力することも可能です。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3571:tooltip.order.shipping_info.delivery_provider: 配達業者、配達方法を変更できます。変更後、送料が変わる可能性がありますので、ご注意ください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3607:tooltip.setting.shop.shop.option_delivery_fee_free_amount: この金額を超える購入があった場合、送料を無料とします。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3608:tooltip.setting.shop.shop.option_delivery_fee_free_quantity: この個数を超える購入があった場合、送料を無料とします。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3609:tooltip.setting.shop.shop.option_delivery_fee_by_product: ここをオンにすると、商品ごとに送料を指定できるようになります。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3620:tooltip.setting.shop.shop.ga.tracking_id: "Googleアナリティクスでアクセス解析を行う場合に設定してください（Googleアナリティクスの規約も参照ください）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3623:tooltip.setting.shop.delivery.tracking_number_url: 配送業者のお問い合わせページURLを指定します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3624:tooltip.setting.shop.delivery.sale_type: この配送方法で取り扱える販売種別を指定します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3625:tooltip.setting.shop.delivery.apply_to_pref: すべての都道府県に同じ送料を一括で設定できます。あとから個々の都道府県の送料を書き換えることも可能です。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3626:tooltip.setting.shop.delivery.shop_memo: 店舗用のメモ欄です。フロント側には表示されません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3753:purchase_flow.delivery_fee_update: 送料が更新されました。金額をご確認ください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3759:purchase_flow.no_delivery_method: この注文に対応する配送方法がありません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3804:enterprise.admin.shop.tenant.delivery_setting: 配送設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4085:admin.customer.delivery_csv: 配送先情報CSV登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4086:admin.customer.delivery_csv.csv_invalid_zipcode: "%d行目の郵便番号の入力に誤りがあります（郵便番号1・2が両方未入力の場合は海外郵便番号が必須です）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4087:admin.customer.delivery_csv.csv_invalid_zipcode_partial: "%d行目の郵便番号の入力に誤りがあります（郵便番号1と2はどちらか一方のみの入力はできません）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4088:admin.customer.delivery_csv.csv_invalid_pref: "%d行目の都道府県の入力に誤りがあります（日本の場合は必須、海外の場合は入力不可）"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4123:admin.setting.shop.delivery.shop_delivery: 配送方法設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4124:admin.setting.shop.delivery.pref: 地域
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4125:admin.setting.shop.delivery.size: サイズ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4126:admin.setting.shop.delivery.weight: 重量
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4127:admin.setting.shop.delivery.fee: 送料
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4129:admin.setting.shop.delivery.fee.delete_modal__message: "この操作はあとから取り消すことができません。<br>以下を削除してよろしいですか？<br>地域：%pref%<br>重量：%weight%<br>サイズ：%size%<br>送料：%fee%"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5221:admin.stock.move_instruction.tracking_no: 送り状No
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5252:admin.stock.move_instruction.csv_format_tracking_no: 送り状No.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5253:admin.stock.move_instruction.csv_format_tracking_no_desc: 送り状No.を入力、複数ある場合はカンマ(,)で区切る(スペースなどは不要)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5264:admin.stock.move_instruction.tracking_register_button: 登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5265:admin.stock.move_instruction.tracking_change_button: 変更
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5266:admin.stock.move_instruction.tracking_register_modal_title: 送り状No.登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5267:admin.stock.move_instruction.tracking_register_success: 送り状No.を登録しました。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5268:admin.stock.move_instruction.delete_disabled_after_tracking: 送り状No.登録後は削除できません
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5269:admin.stock.move_instruction.delete_error_after_tracking: 送り状No.登録後は削除できません。
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
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5282:admin.stock.move_instruction.detail_tracking_no_cannot_be_cleared: 送り状番号を空に戻して発送状況を未に戻すことはできません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5386:admin.stock.move_transfer.tracking_no: 送り状No.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6289:front.nav.menu.contact: お問い合わせ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6345:front.footer.feature.delivery: '即日発送　<br class="u-hareruya-dsp-pc">※15時までの入金確認or代引'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6361:front.footer.sitemap.contact: お問い合わせ
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6653:admin.代金引換.en: Cash On Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6658:# Delivery time window
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content_tax.en.twig:6:{% if data.Shippings[0].delivery.id not in constant('Eccube\\Entity\\Delivery::OTC_GROUP') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content_tax.en.twig:27: Postage : {{ data.deliveryFeeTotal|price }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content_tax.en.twig:33:[Delivery method] {{ data.Shippings[0].shippingDeliveryName }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content_tax.en.twig:35:[Delivery Date] {% if data.Shippings[0].shippingDeliveryDate is not null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content_tax.en.twig:37:{% for value in weekday|slice((data.Shippings[0].shippingDeliveryDate|date('w') + weekday|length - 1) % weekday|length, 1) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content_tax.en.twig:38:{{ data.Shippings[0].shippingDeliveryDate|date('m/d/Y') }} ({{ value }})
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content_tax.en.twig:44:[Desired Delivery Window] {{ data.Shippings[0].shippingDeliveryTime ? ('admin.' ~ data.Shippings[0].shippingDeliveryTime ~ '.en')|trans : 'No Request' }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/sell_order.en.twig:18: Postage : {{ Order.deliveryFeeTotal|number_format }}JPY
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/sell_order.en.twig:24:[Delivery method] {{ Order.Shippings[0].getDelivery.service_name_en }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/sell_order.en.twig:26:[Delivery Date] {% if Order.shippings[0].shippingDeliveryDate is not null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/sell_order.en.twig:28:{% for value in weekday|slice((Order.shippings[0].shippingDeliveryDate|date('w') + weekday|length - 1) % weekday|length, 1) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/sell_order.en.twig:29:{{ Order.Shippings[0].shippingDeliveryDate|date('m/d/Y') }} ({{ value }})
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/sell_order.en.twig:35:[Desired Delivery Window] {{ Order.Shippings[0].shippingDeliveryTime ? ('admin.' ~ Order.Shippings[0].shippingDeliveryTime ~ '.en')|trans : 'No Request' }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/print_stack_window.twig:44:                alert('システムエラーが発生いたしました。\nサイト管理者へお問い合わせください。');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:13:{% set menus = ['setting', 'basic_info', 'shop_delivery'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:15:{% block title %}{{ 'admin.setting.shop.delivery_setting'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:59:            const $collectionHolder = $('#delivery-time-group');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:60:            let index = $collectionHolder.find('.delivery-time-item').length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:62:            let $targetDeliveryFeeToDelete = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:67:            const confirmModal = new bootstrap.Modal(document.getElementById('delivery-time-sort-modal'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:88:                $('#delivery-time-sort-modal .modal-message').text('{{ 'admin.common.sort_confirm'|trans|default('並び順を変更しますか？') }}');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:93:            $('#add-delivery-time-button').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:96:                const deliveryTimeName = $('#add-delivery-time-value').val();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:98:                if (deliveryTimeName == '') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:105:                newForm.find('.display-label').text(deliveryTimeName)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:108:                const $lastRow = $('#delivery-time-group > li:last');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:112:                const $inputField = newForm.find('input[name*="[delivery_time]"]');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:113:                $inputField.val(deliveryTimeName);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:114:                $inputField.attr('data-origin-value', deliveryTimeName);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:117:                $('#add-delivery-time-value').val('');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:126:            $('#delivery-time-group').on('click', '.remove-delivery-time-item', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:133:                const deliveryTimeName = $targetItemToDelete.find('.display-label').text() || '{{ 'admin.setting.shop.delivery.delivery_time'|trans }}';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:135:                $('#delivery-time-delete-modal .modal-message').text('{{ 'admin.common.delete_modal__message'|trans }}'.replace('%name%', deliveryTimeName));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:137:                $('#delivery-time-delete-modal').modal('show');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:140:            $('#delivery-time-delete-confirm').on('click', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:146:                $('#delivery-time-delete-modal').modal('hide');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:171:                            $('#delivery-time-group').append(item);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:182:                                $('#delivery-time-group').append(item);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:192:            $('#delivery-time-sort-modal').on('click', '.btn-confirm', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:197:            $('#delivery-time-sort-modal').on('hidden.bs.modal', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:208:                            $('#delivery-time-group').append(item);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:218:            $('#delivery-time-group').on('click', 'a.action-up', function(e) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:236:            $('#delivery-time-group').on('click', 'a.action-down', function(e) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:255:            $('#delivery-time-group').on('click', 'a.action-edit', function(e) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:265:            $('#delivery-time-group').on('click', 'button.action-edit-submit', function(e) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:277:            $('#delivery-time-group').on('click', 'button.action-edit-cancel', function(e) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:289:            $('#delivery-time-group').find('.is-invalid').each(function(e) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:301:            const $collectionHolder = $('#delivery-fee-group');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:302:            let index = $collectionHolder.find('.delivery-fee-item').length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:304:            $('#add-delivery-fee-button').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:306:                const prefId = $('#add-delivery-fee-pref').val();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:307:                const sizeValue = $('#add-delivery-fee-size').val() || 0;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:308:                const weightValue = $('#add-delivery-fee-weight').val() || 0;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:309:                const feeValue = $('#add-delivery-fee-value').val() || 0;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:311:                $('#add-delivery-fee-form-error').addClass('d-none').text('');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:312:                $('#add-delivery-fee-pref').removeClass('is-invalid');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:313:                $('#add-delivery-fee-value').removeClass('is-invalid');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:317:                    $('#add-delivery-fee-pref').addClass('is-invalid');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:321:                    $('#add-delivery-fee-value').addClass('is-invalid');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:325:                    $('#add-delivery-fee-form-error').removeClass('d-none').html(errorMessages.join('<br>'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:333:                const prefOptions = $('#add-delivery-fee-pref').html();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:337:                const prefName = $('#add-delivery-fee-pref option:selected').text();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:346:                $('#delivery-fee-group').find('.delivery-fee-item').each(function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:357:                    const $lastRow = $('#delivery-fee-group > li:last');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:369:                $('#add-delivery-fee-pref').val('');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:370:                $('#add-delivery-fee-size').val('');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:371:                $('#add-delivery-fee-weight').val('');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:372:                $('#add-delivery-fee-value').val('');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:377:            $('#delivery-fee-group').on('click', '.remove-delivery-fee-item', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:381:                $targetDeliveryFeeToDelete = $(this).closest('li');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:383:                const prefName = $targetDeliveryFeeToDelete.find('.display-label-pref').text() || '{{ 'admin.setting.shop.delivery.pref'|trans }}';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:384:                const sizeValue = $targetDeliveryFeeToDelete.find('.display-label-size').text() || '0';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:385:                const weightValue = $targetDeliveryFeeToDelete.find('.display-label-weight').text() || '0';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:386:                const feeValue = $targetDeliveryFeeToDelete.find('.display-label-fee').text() || '0';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:388:                const message = '{{ 'admin.setting.shop.delivery.fee.delete_modal__message'|trans|raw }}'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:393:                $('#delivery-fee-delete-modal .modal-message').html(message);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:395:                $('#delivery-fee-delete-modal').modal('show');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:398:            $('#delivery-fee-delete-confirm').on('click', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:399:                if ($targetDeliveryFeeToDelete) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:400:                    $targetDeliveryFeeToDelete.remove();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:401:                    $targetDeliveryFeeToDelete = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:403:                $('#delivery-fee-delete-modal').modal('hide');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:406:            $('#delivery-fee-group').on('click', 'a.action-edit', function(e) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:413:                    const prefOptions = $('#add-delivery-fee-pref').html();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:434:            $('#delivery-fee-group').on('click', 'button.action-edit-submit', function(e) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:477:            $('#delivery-fee-group').on('click', 'button.action-edit-cancel', function(e) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:508:            $('#delivery-fee-group').find('.is-invalid').each(function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:514:            $('#delivery-registration-button').on('click', function(e) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:523:    <form method="post" action="{{ delivery_id ? url('admin_setting_shop_delivery_edit', {'id': delivery_id}) : url('admin_setting_shop_delivery_new') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:529:                        <div class="card-header"><span>{{ 'admin.setting.shop.delivery.base_info'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:530:                        <div id="ex-delivery-basic" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:532:                                <div class="col-3"><span>{{ 'admin.setting.shop.delivery.delivery_name'|trans }}</span><span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:539:                                <div class="col-3"><span>{{ 'admin.setting.shop.delivery.delivery_sevice_name'|trans }}</span><span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:546:                                <div class="col-3"><span>{{ 'admin.setting.shop.delivery.delivery_sevice_name_en'|trans }}</span><span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:569:                                         title="{{ 'tooltip.setting.shop.delivery.tracking_number_url'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:570:                                        <span>{{ 'admin.setting.shop.delivery.tracking_number_url'|trans }}</span><i class="fa fa-question-circle fa-lg ms-1"></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:580:                                    <span>{{ 'admin.setting.shop.delivery.max_size'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:589:                                    <span>{{ 'admin.setting.shop.delivery.lead_time'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:596:                            {# ゆうパックのみ地域別最短到着日設定を提供。他の配送方法は商品レベルの DeliveryDuration にフォールバックする #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:597:                            {% if delivery_id == constant('Eccube\\Entity\\Delivery::YU_PACK') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:601:                                    <a href="{{ url('admin_setting_shop_delivery_minimum_delivery_time_edit', {id: delivery_id}) }}" class="btn btn-ec-regular">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:602:                                        {{ 'admin.setting.shop.delivery.minimum_delivery_time_setting'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:625:                        <div class="card-header"><span>{{ 'admin.setting.shop.delivery.payment_method'|trans }}</span><span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:626:                        <div id="ex-delivery-payment" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:634:                        <div class="card-header"><span>{{ 'admin.setting.shop.delivery.delivery_time_setting'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:635:                        <div id="ex-delivery-time" class="card-body p-0">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:637:                                <ul id="delivery-time-group" class="list-group list-group-flush sortable-container"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:638:                                    data-prototype="{% apply escape %}{{ include('@admin/Setting/Shop/delivery_time_prototype.twig', {'form': form.delivery_times.vars.prototype}) }}{% endapply %}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:642:                                                <input id="add-delivery-time-value" class="form-control" type="text">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:645:                                                <button id="add-delivery-time-button" class="btn btn-ec-regular" type="button">{{ 'admin.common.create__new'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:649:                                    {% for child in form.delivery_times %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:650:                                        {{ include('@admin/Setting/Shop/delivery_time_prototype.twig', {'form': child}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:658:                        <div class="card-header"><span>{{ 'admin.setting.shop.delivery.delivery_fee_by_pref'|trans }}</span><span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:659:                        <div id="ex-delivery-fee" class="card-body p-0">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:661:                                <ul id="delivery-fee-group" class="list-group list-group-flush"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:662:                                    data-prototype="{% apply escape %}{{ include('@admin/Setting/Shop/delivery_fee_prototype.twig', {'form': form.delivery_fees.vars.prototype}) }}{% endapply %}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:666:                                                <select id="add-delivery-fee-pref" class="form-control">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:672:                                                <div id="add-delivery-fee-pref-error" class="invalid-feedback d-none"></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:675:                                                <input id="add-delivery-fee-weight" class="form-control" type="text" placeholder="{{ 'admin.setting.shop.delivery.weight'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:676:                                                <div id="add-delivery-fee-weight-error" class="invalid-feedback d-none"></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:679:                                                <input id="add-delivery-fee-size" class="form-control" type="text" placeholder="{{ 'admin.setting.shop.delivery.size'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:680:                                                <div id="add-delivery-fee-size-error" class="invalid-feedback d-none"></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:683:                                                <input id="add-delivery-fee-value" class="form-control" type="text" placeholder="{{ 'admin.setting.shop.delivery.fee'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:684:                                                <div id="add-delivery-fee-value-error" class="invalid-feedback d-none"></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:687:                                                <button id="add-delivery-fee-button" class="btn btn-ec-regular" type="button">{{ 'admin.common.create__new'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:690:                                        <div id="add-delivery-fee-form-error" class="text-danger mt-2 d-none"></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:695:                                                <span class="display-label-pref"><strong>{{ 'admin.setting.shop.delivery.pref'|trans }}</strong></span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:698:                                                <span class="display-label-weight"><strong>{{ 'admin.setting.shop.delivery.weight'|trans }}</strong></span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:701:                                                <span class="display-label-size"><strong>{{ 'admin.setting.shop.delivery.size'|trans }}</strong></span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:704:                                                <span class="display-label-fee"><strong>{{ 'admin.setting.shop.delivery.fee'|trans }}</strong></span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:711:                                    {% for child in form.delivery_fees %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:712:                                        {{ include('@admin/Setting/Shop/delivery_fee_prototype.twig', {'form': child}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:726:                            <a class="c-baseLink" href="{{ url('admin_setting_shop_delivery') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:727:                                <i class="fa fa-backward" aria-hidden="true"></i><span>{{ 'admin.setting.shop.delivery_list'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:738:                                <button class="btn btn-ec-conversion px-5" id="delivery-registration-button" type="button">{{ 'admin.common.registration'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:747:    <div class="modal fade" id="delivery-time-delete-modal" tabindex="-1" role="dialog" aria-labelledby="delivery-time-delete-modal-label" aria-hidden="true">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:751:                    <h5 class="modal-title" id="delivery-time-delete-modal-label">{{ 'admin.common.delete_modal__title'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:759:                    <button type="button" class="btn btn-ec-delete" id="delivery-time-delete-confirm">{{ 'admin.common.delete'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:765:    <div class="modal fade" id="delivery-time-sort-modal" tabindex="-1" role="dialog" aria-labelledby="delivery-time-sort-modal-label" aria-hidden="true">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:769:                    <h5 class="modal-title fw-bold" id="delivery-time-sort-modal-label">{{ 'admin.common.sort_confirm'|trans|default('並び順の変更') }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:783:    <div class="modal fade" id="delivery-fee-delete-modal" tabindex="-1" role="dialog" aria-labelledby="delivery-fee-delete-modal-label" aria-hidden="true">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:787:                    <h5 class="modal-title" id="delivery-fee-delete-modal-label">{{ 'admin.common.delete_modal__title'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_edit.twig:795:                    <button type="button" class="btn btn-ec-delete" id="delivery-fee-delete-confirm">{{ 'admin.common.delete'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/tenant/detail.twig:590:                        <div class="card-header"><span>{{ 'admin.setting.shop.shop.option_delivery_fee'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/tenant/detail.twig:591:                        <div id="ex-shop-delivery" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/tenant/detail.twig:594:                                    <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.setting.shop.shop.option_delivery_fee_free_amount'|trans }}"><span>{{ 'admin.setting.shop.shop.option_delivery_fee_free_amount'|trans }}</span><i class="fa fa-question-circle fa-lg ms-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/tenant/detail.twig:597:                                    {{ form_widget(form.delivery_free_amount) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/tenant/detail.twig:598:                                    {{ form_errors(form.delivery_free_amount) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/tenant/detail.twig:604:                                    <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.setting.shop.shop.option_delivery_fee_free_quantity'|trans }}"><span>{{ 'admin.setting.shop.shop.option_delivery_fee_free_quantity'|trans }}</span><i class="fa fa-question-circle fa-lg ms-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/tenant/detail.twig:607:                                    {{ form_widget(form.delivery_free_quantity) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/tenant/detail.twig:608:                                    {{ form_errors(form.delivery_free_quantity) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:92:common.delivery_fee: Shipping Charge
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:351:front.mypage.delivery.error.address_name_required: Please enter the delivery address name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:470:front.privacy.s1.li2: "Product delivery and order confirmation emails (including customer name)"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:474:front.privacy.s1.li6: "Product delivery from Hareruya, catalog delivery, and notifications about related services and new products"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:486:front.privacy.s9.li2: "When entrusting the handling of personal information to contracted companies with confidentiality agreements, within the scope necessary to achieve the stated purposes of use (e.g., contracted companies include delivery companies, printing companies for catalog address labels, credit card companies when card payment is requested, etc.)"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:547:front.mypage.index.menu.delivery_html: 'Shipping addresses<br>add / edit'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:579:front.mypage.delivery_info: Delivery Info
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:580:front.mypage.delivery: Delivery to
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:581:front.mypage.delivery_provider: Delivery Method
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:582:front.mypage.delivery_date: Delivery Date
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:583:front.mypage.delivery_time: Delivery Time
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:632:front.mypage.customer_address_count: "%count% items are registered in Delivery Addresses"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:654:front.mypage.delivery.notify_title: Change delivery information
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:655:front.mypage.delivery.list_intro: You can register delivery destination information in your address book.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:656:front.mypage.delivery.add_address_button: Add a new address
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:657:front.mypage.delivery.company_prefix: 'Company: '
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:658:front.mypage.delivery.tel_abbr: 'TEL:'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:659:front.mypage.delivery.address_untitled: Address #%num%
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:660:front.mypage.delivery.shipping_name_label: Recipient name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:661:front.mypage.delivery.edit_notice: For orders you have already placed (including those being prepared), the purchaser and shipping address on the order will not change. Please contact us if you need to make changes.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:662:front.mypage.delivery.address_help: Please make sure you enter the street name and number correctly.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:663:front.mypage.delivery.confirm_intro: Please confirm the details below. If they are correct, tap Register to continue.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:664:front.mypage.delivery.confirm_submit: Register
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:665:front.mypage.delivery.label_name01: Last name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:666:front.mypage.delivery.label_name02: First name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:667:front.mypage.delivery.placeholder_first_name: Hareruya
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:668:front.mypage.delivery.placeholder_last_name: Happy
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:669:front.mypage.delivery.label_kana01: Last name (kana)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:670:front.mypage.delivery.label_kana02: First name (kana)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:671:front.mypage.delivery.postal_label_first: Postal code (first 3 digits)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:672:front.mypage.delivery.postal_label_second: Postal code (last 4 digits)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:673:front.mypage.delivery.label_pref: Address (prefecture)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:674:front.mypage.delivery.label_addr01: Address (city / ward / town)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:675:front.mypage.delivery.label_addr02: Address (street number / building)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:676:front.mypage.delivery.label_addr03: Address (building / room)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:677:front.mypage.delivery.label_addr_overseas_1: Address (line 1)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:678:front.mypage.delivery.label_addr_overseas_2: Address (line 2)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:679:front.mypage.delivery.label_addr_overseas_3: Address (line 3)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:680:front.mypage.delivery.label_tel01: Phone (area code)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:681:front.mypage.delivery.label_tel02: Phone (city code)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:682:front.mypage.delivery.label_tel03: Phone (subscriber number)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:684:front.mypage.title.delivery: Add or change delivery addresses
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:685:front.mypage.title.delivery_breadcrumb_lead: Add delivery address
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:686:front.mypage.title.delivery_breadcrumb_tail: Change
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:687:front.mypage.delivery.delete_confirm: "Remove %name01% %name02% from your address book?"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:751:front.mypage.shopping_history.col.delivery_information: Delivery Information
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1007:shop_top.order_method.public.prefix2: "For delivery, please visit "
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1051:front.cart.delivery_fee_free__now: Shipping charge is waived.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1052:front.cart.delivery_fee_free__price_and_quantity: '<strong class="ec-color-red">Free shipping</strong> with the purchase of <strong>%price%</strong>, or <strong>%quantity% item(s)</strong>.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1053:front.cart.delivery_fee_free__price: '<strong class="ec-color-red">Free shipping</strong> with the purchase of <strong>%price%</strong>.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1054:front.cart.delivery_fee_free__quantity: '<strong class="ec-color-red">Free shipping</strong> with the purchase of <strong>%quantity% item(s)</strong>.'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1094:front.shopping.delivery_info: Delivery Information
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1095:front.shopping.delivery_to: Delivery to
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1096:front.shopping.delivery_modal.heading: Shipping Information
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1097:front.shopping.delivery_modal.section_title: Shipping Methods
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1098:front.shopping.delivery_modal.intro: We offer three shipping methods.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1099:front.shopping.delivery_modal.yupacket.title: "●Yu-Packet (Flat rate ¥180 nationwide)"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1100:front.shopping.delivery_modal.yupacket.li1: Ships via Japan Post Yu-Packet service.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1101:front.shopping.delivery_modal.yupacket.li2: "Orders totaling ¥30,000 or more qualify for free shipping via Yu-Pack."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1102:front.shopping.delivery_modal.yupacket.li3: To request post office hold delivery, please enter the post office name and address in the notes field.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1103:front.shopping.delivery_modal.yupacket.note1: "※Yu-Packet is not available for cash on delivery."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1104:front.shopping.delivery_modal.yupacket.note2: "※Yu-Packet is not available if the purchased items exceed a certain size."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1105:front.shopping.delivery_modal.yupacket.note3: "※We are unable to accept returns or refunds for items lost or damaged during shipping when using Yu-Packet."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1106:front.shopping.delivery_modal.yupacket.note4: "※Please use Yu-Pack if you require coverage."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1107:front.shopping.delivery_modal.yupack.title: "●Yu-Pack (from ¥550)"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1108:front.shopping.delivery_modal.yupack.li1: Ships via Japan Post Yu-Pack service.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1109:front.shopping.delivery_modal.yupack.li2: "Depending on the region, delivery can arrive as early as the next morning, making it ideal if you're in a hurry."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1110:front.shopping.delivery_modal.yupack.li3: Date and time specification is also available. Please use Yu-Pack if you wish to specify a delivery date or time.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1111:front.shopping.delivery_modal.yupack.note1: "※Free shipping on orders totaling ¥30,000 or more."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1112:front.shopping.delivery_modal.yupack.note2: "※In the event of a postal accident, compensation is generally limited to actual damages up to ¥500,000."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1113:front.shopping.delivery_modal.yupack.note3: "※If a package is not received and returned after the holding period, an additional shipping fee may be charged."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1114:front.shopping.delivery_modal.yupack.note4: "※To request post office hold delivery, please enter the post office name and address in the notes field."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1115:front.shopping.delivery_modal.combined.title: "●Combined Shipping"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1116:front.shopping.delivery_modal.combined.li1: "By selecting [Combined Shipping] as your shipping method, you can combine multiple orders into a single shipment."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1117:front.shopping.delivery_modal.combined.li2: "Please enter the Order ID of the order you wish to combine in the notes field and select [Combined Shipping] as your shipping method."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1118:front.shopping.delivery_modal.combined.li3: We will ship your combined orders together.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1119:front.shopping.delivery_modal.combined.note1: "※Combined shipping is not available if any of the orders to be combined use Credit Card, Cash on Delivery, or Convenience Store Payment."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1120:front.shopping.delivery_modal.combined.note2: "※The maximum number of orders that can be combined, including the base order, is 3."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1121:front.shopping.delivery_modal.combined.note3: "※If you request combined shipping for a 4th or more order, we will combine up to the 3rd order, and combined shipping for the 4th order onwards will not be available."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1122:front.shopping.delivery_modal.combined.note4: "※Combined shipping is not available for orders that include pre-order items."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1123:front.shopping.delivery_modal.combined.note5: "※If payment has already been received, we may not be able to accommodate your request."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1130:front.shopping.payment_modal.methods.li2: ●Cash on Delivery
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1141:front.shopping.payment_modal.cod.title: "●Cash on Delivery<br>Cash on delivery is available via Japan Post. The cash on delivery fee is based on the total payment amount (product price + shipping + COD fee) as follows.<br>※We cannot change payment methods from other options to cash on delivery.<br>-・-・-・-・-・-・-・-・-・-・-・-・-・-・-"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1147:front.shopping.payment_modal.cod.notes: "-・-・-・-・-・-・-・-・-・-・-・-・-・-・-<br>※Cash on delivery is a payment method where the delivery carrier collects payment upon delivery.<br>※Please pay the total amount (including shipping and COD fee) in cash to the delivery carrier.<br>※If a package is not received and returned after the holding period, an additional shipping fee may be charged.<br>※An additional COD fee applies on top of the standard shipping fee.<br>※Shipping will be via Yu-Pack.<br>※Combined shipping is not available for orders using cash on delivery."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1160:front.shopping.delivery_method: Delivery Method
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1195:front.shopping.reserve_return_modal.reserve.shipping.li2: If you request delivery before the release date, your order will ship on or after the official release date.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1196:front.shopping.reserve_return_modal.reserve.shipping.li3: "For customers who do not specify a delivery date, we will ship as quickly as possible after the release date."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1217:front.shopping.delivery.change: Change Delivery Address
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1218:front.shopping.delivery.add: Add New Delivery Address
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1219:front.shopping.delivery.phone_number_short: TEL
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1220:front.shopping.delivery.membership_information_address: Membership Information Address
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1232:front.shopping.delivery_provider: Delivery Method
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1233:front.shopping.delivery_date: Delivery Date
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1234:front.shopping.delivery_time: Delivery Time
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1235:front.shopping.to_multiple: Add Delivery Address
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1253:front.shopping.shipping_title: Select a Delivery Address
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1254:front.shopping.shipping_add_new_shipping: Add a New Delivery Address
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1256:front.shopping.shipping_unselected: Please select a delivery address.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1259:front.shopping.shipping_multiple_message: Please select a delivery address for each item.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1260:front.shppping.shipping_multiple_add_shipping: Please select a delivery address for each item.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1280:front.shopping.shipping_edit_title_nomember: Purchase / Change of Delivery Address
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1281:front.shopping.shipping_edit_header_customer: Add Delivery Address
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1282:front.shopping.shipping_edit_header_nonmember: Change Delivery Address
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1299:front.shopping.payment_method_not_fount: Sorry, you have no payment options. If you have selected multiple delivery methods, you can only select the same payment option for them all.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1756:admin.common.ga.tracking_id: "G-XXXXXXXXXX"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1870:admin.product.delivery_duration: Estimated Shipping Date
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1871:admin.product.delivery_fee: Shipping Charge
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1960:admin.product.product_csv.delivery_duration_col: Estimated Shipping Date (ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1961:admin.product.product_csv.delivery_duration_description: ""
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1974:admin.product.product_csv.delivery_fee_col: Shipping Charge
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1975:admin.product.product_csv.delivery_fee_description: If the shipping charge is set per product, set the value more than 0
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2234:admin.order.delivery_date__start: Delivery Date (Start)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2235:admin.order.delivery_date__end: Delivery Date (End)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2248:admin.order.output_delivery_note: Print Delivery Slip
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2249:admin.order.output_delivery_note_short: Print Delivery Slip
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2250:admin.order.print_delivery_slips_ja: Print Delivery Slip（ja）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2251:admin.order.print_delivery_slips_en: Print Delivery Slip（en）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2269:admin.order.delivery_fee: Shipping Charge
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2282:admin.order.tracking_number: Tracking No.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2283:admin.order.tracking_number_error: Only Roman alphabets, numbers and hyphens are accepted for tracking numbers.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2299:admin.order.delivery_date: Delivery Date
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2300:admin.order.delivery_time: Delivery Time
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2301:admin.order.delivery_provider: Delivery Method
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2328:admin.order.delivery: Delivery to
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2339:admin.order.edit_multiple_shipping: Edit Delivery Address
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2340:admin.order.edit_multiple_shipping_description: If you selected multiple delivery addresses, you can edit each of them from the this button.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2342:admin.order.delivery_note_create_date: Date of Issue
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2343:admin.order.delivery_note_title: Title
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2344:admin.order.delivery_note_title__default: Delivery Slip
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2345:admin.order.delivery_note_output_format: Output Format
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2346:admin.order.delivery_note_output_format__browser: Open in browser
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2347:admin.order.delivery_note_output_format__file: Save as a file
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2348:admin.order.delivery_note_message: Message
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2349:admin.order.delivery_note_message__default1: Thank you for shopping with us.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2350:admin.order.delivery_note_message__default2: Here are the delivered items.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2351:admin.order.delivery_note_message__default3: Kindly confirm the details.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2352:admin.order.delivery_note_memo: Notes
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2353:admin.order.delivery_note_line1: Line 1
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2354:admin.order.delivery_note_line2: Line 2
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2355:admin.order.delivery_note_line3: Line 3
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2356:admin.order.delivery_note_save_input: Save Entry
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2357:admin.order.delivery_note_download_error: "Failed to Download"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2358:admin.order.delivery_note_parameter_error: "Shipping ID is not specified"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2369:admin.order.shipping_csv.tracking_number_col: Tracking No.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2370:admin.order.shipping_csv.tracking_number_description: Enter alphanumeric characters or hyphens
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2374:# Print Delivery Slip（ja）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2375:admin.delivery_slips_ja: 納品書
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2376:admin.delivery_slips_ja.order_number: 注文番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2377:admin.delivery_slips_ja.recipient_sign: 受取人署名
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2378:admin.delivery_slips_ja.delivery: お届け先
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2379:admin.delivery_slips_ja.sender: 送り主
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2380:admin.delivery_slips_ja.customer_id: 会員番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2381:admin.delivery_slips_ja.non_member: 非会員
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2382:admin.delivery_slips_ja.subtotal: お買上額
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2383:admin.delivery_slips_ja.postage: 送料
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2384:admin.delivery_slips_ja.charge: 手数料
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2385:admin.delivery_slips_ja.point_out: ポイント使用
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2386:admin.delivery_slips_ja.delivery_method: 発送方法
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2387:admin.delivery_slips_ja.total_tax_included: 請求金額(税込)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2388:admin.delivery_slips_ja.tax_included: 内税
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2389:admin.delivery_slips_ja.product_name: 商品情報
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2390:admin.delivery_slips_ja.price: 価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2391:admin.delivery_slips_ja.quantity: 数量
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2392:admin.delivery_slips_ja.amount: 合計
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2394:# Print Delivery Slip（en）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2395:admin.delivery_slips_en: Delivery Slip
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2396:admin.delivery_slips_en.postal_code: Postal Code
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2397:admin.delivery_slips_en.order_number: OrderID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2398:admin.delivery_slips_en.delivery: Addressee
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2399:admin.delivery_slips_en.sender: Sender
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2400:admin.delivery_slips_en.subtotal: Item Total
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2401:admin.delivery_slips_en.postage: Postage
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2402:admin.delivery_slips_en.charge: Fee
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2403:admin.delivery_slips_en.point_out: Points Used
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2404:admin.delivery_slips_en.point: Points
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2405:admin.delivery_slips_en.delivery_method: Delivery method
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2406:admin.delivery_slips_en.total: Order Total
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2407:admin.delivery_slips_en.product_name: Item
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2408:admin.delivery_slips_en.price: Price
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2409:admin.delivery_slips_en.quantity: Quantity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2410:admin.delivery_slips_en.amount: Total
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2421:admin.customer.customer_address_registration: Register Delivery Addresses
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2428:admin.customer.customer_address: Delivery Address
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2429:admin.customer.customer_address__not_found: No delivery address is found
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2430:admin.customer.customer_address__add: Add a Delivery Address
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2431:admin.customer.customer_address_count_is_over: "You have already reached the max number (%eccube_deliv_addr_max%) of delivery addresses. If you want to add more, either delete or overwrite a registered address."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2432:admin.customer.customer_address_id: Delivery Address ID
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2433:admin.customer.customer_address_info: Delivery Address Info
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2440:admin.customer.no_customer_address: No delivery address is found for this customer
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2581:admin.setting.shop.delivery_list: All Delivery Methods
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2582:admin.setting.shop.delivery_setting: Delivery Settings
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2614:admin.setting.shop.shop.option_delivery_fee: Shipping Charge
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2615:admin.setting.shop.shop.option_delivery_fee_free_amount: Free Shipping (Amount)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2616:admin.setting.shop.shop.option_delivery_fee_free_quantity: Free Shipping (Qty)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2617:admin.setting.shop.shop.option_delivery_fee_by_product: Shipping Charge by Product
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2634:admin.setting.shop.shop.ga.tracking_id: "Tracking ID"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2658:# Settings : Store Settings : Delivery Methods
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2661:admin.setting.shop.delivery.base_info: General
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2662:admin.setting.shop.delivery.delivery_name: Delivery Company Name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2663:admin.setting.shop.delivery.delivery_sevice_name: Delivery Method Name
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2664:admin.setting.shop.delivery.tracking_number_url: Tracking URL
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2665:admin.setting.shop.delivery.sale_type: Sales Type
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2666:admin.setting.shop.delivery.payment_method: Available Payment Methods
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2667:admin.setting.shop.delivery.delivery_time_setting: Delivery Time
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2668:admin.setting.shop.delivery.delivery_fee_by_pref: Shipping Charge by Prefecture
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2669:admin.setting.shop.delivery.apply_to_pref__title: Flat Rate (Nationwide)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2670:admin.setting.shop.delivery.apply_to_pref__button: Apply to All Prefectures
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2671:admin.setting.shop.delivery.fee.invalid: Please enter with numbers.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2672:admin.setting.shop.delivery.payment_warning: "There is no payment method that can be selected for purchases of %min% to %max% including tax. Please check the payment method condition settings."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3127:tooltip.product.delivery_duration: You can register estimated shipping date per product.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3143:tooltip.order.shipping_info: Displaying the delivery information. You can add delivery addresses too. If you have multiple delivery addresses within a order, you can check the delivery address details at [Edit Delivery Address].
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3144:tooltip.order.shipping_info.tracking_number: If you have a tracking number (delivery slip number), you can enter from here. You can also bulk-input from All Orders.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3145:tooltip.order.shipping_info.delivery_provider: You can change delivery companies or delivery methods here. Please note the shipping charge may be updated if you change any of them.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3146:tooltip.order.shipping_info.shop_memo: You can save a note for shipping operators or delivery companies. You can review it in Shipping CSV etc.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3157:tooltip.customer.customer_address: The delivery address registered by this customer. You can add a new address from this page as well.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3180:tooltip.setting.shop.shop.option_delivery_fee_free_amount: Shipping charge will be waived if a customer purchases more than this amount.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3181:tooltip.setting.shop.shop.option_delivery_fee_free_quantity: Shipping charge will be waived if a customer purchases more than this quantity.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3182:tooltip.setting.shop.shop.option_delivery_fee_by_product: If turned on, you can set shipping charge per product.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3188:tooltip.setting.shop.shop.option_invoice_registration_number: Invoice registration number can be displayed on the delivery note.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3192:tooltip.setting.shop.shop.ga.tracking_id: "Set tracking id when you analyze your site access using Google Analytics.(Please refer to Google Analytics terms and conditions)"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3195:tooltip.setting.shop.delivery.tracking_number_url: Enter the URL of the shipping tracker of the delivery company.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3196:tooltip.setting.shop.delivery.sale_type: Specify the sales type(s) available for this delivery method.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3197:tooltip.setting.shop.delivery.apply_to_pref: The same shipping charge can be applied to all prefectures. You can later change the shipping rate for each prefecture one by one.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3198:tooltip.setting.shop.delivery.shop_memo: This is a note for store Owner''s. It is not displayed on the Front Screen.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3317:purchase_flow.delivery_fee_update: Shipping charge has been updated. Please confirm the total amount.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3867:front.footer.feature.delivery: 'Same-day shipping<br class="u-hareruya-dsp-pc">*Confirmed by 15:00 or COD'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:303:                        <div class="card-header"><span>{{ 'admin.setting.shop.shop.option_delivery_fee'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:304:                        <div id="ex-shop-delivery" class="card-body">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:307:                                    <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.setting.shop.shop.option_delivery_fee_free_amount'|trans }}"><span>{{ 'admin.setting.shop.shop.option_delivery_fee_free_amount'|trans }}</span><i class="fa fa-question-circle fa-lg ms-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:310:                                    {{ form_widget(form.delivery_free_amount) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:311:                                    {{ form_errors(form.delivery_free_amount) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:317:                                    <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.setting.shop.shop.option_delivery_fee_free_quantity'|trans }}"><span>{{ 'admin.setting.shop.shop.option_delivery_fee_free_quantity'|trans }}</span><i class="fa fa-question-circle fa-lg ms-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:320:                                    {{ form_widget(form.delivery_free_quantity) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:321:                                    {{ form_errors(form.delivery_free_quantity) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:327:                                    <div class="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.setting.shop.shop.option_delivery_fee_by_product'|trans }}"><span>{{ 'admin.setting.shop.shop.option_delivery_fee_by_product'|trans }}</span><i class="fa fa-question-circle fa-lg ms-1"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:330:                                    {{ form_widget(form.option_product_delivery_fee) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:331:                                    {{ form_errors(form.option_product_delivery_fee) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/validators.ja.yaml:105:form.type.admin.nottrackingnumberstyle: 送り状番号は半角英数字かハイフンのみを入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content.en.twig:6:{% if data.Shippings[0].delivery.id not in constant('Plugin\\HareruyaEc\\Entity\\Delivery::OTC_GROUP') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content.en.twig:26: Postage : {{ data.deliveryFeeTotal|number_format }}JPY
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content.en.twig:32:[Delivery method] {{ deliverySub.nameEn }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content.en.twig:34:[Delivery Date] {% if data.shippings[0].shippingDeliveryDate is not null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content.en.twig:36:{% for value in weekday|slice((data.shippings[0].shippingDeliveryDate|date('w') + weekday|length - 1) % weekday|length, 1) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content.en.twig:37:{{ data.Shippings[0].shippingDeliveryDate|date('m/d/Y (' ~ value ~ ')') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content.en.twig:43:[Desired Delivery Window] {{ data.Shippings[0].shippingDeliveryTime ? trans('admin.' ~ data.Shippings[0].shippingDeliveryTime ~ '.en') : 'No Request'}}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_fee_prototype.twig:1:{% set DeliveryFee = form.vars.value %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_fee_prototype.twig:2:<li class="list-group-item delivery-fee-item">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_fee_prototype.twig:5:            <span class="display-label-pref">{{ DeliveryFee and DeliveryFee.pref ? DeliveryFee.pref}}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_fee_prototype.twig:8:            <span class="display-label-weight">{{ DeliveryFee and DeliveryFee.weight ? DeliveryFee.weight|number_format(0, '.', '') : 0 }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_fee_prototype.twig:11:            <span class="display-label-size">{{ DeliveryFee and DeliveryFee.size ? DeliveryFee.size|number_format(0, '.', '') : 0 }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_fee_prototype.twig:14:            <span class="display-label-fee">{{ DeliveryFee and DeliveryFee.fee ? DeliveryFee.fee|number_format : 0 }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_fee_prototype.twig:21:            <a class="btn btn-ec-actionIcon me-2 remove-delivery-fee-item" href="" data-bs-toggle="tooltip"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_fee_prototype.twig:31:                    {{ form_widget(form.pref, {'attr': {'data-origin-value': (DeliveryFee and DeliveryFee.pref) ? DeliveryFee.pref.id : '' }}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_fee_prototype.twig:36:                    {{ form_widget(form.weight, {'attr': {'data-origin-value': (DeliveryFee and DeliveryFee.weight) ? DeliveryFee.weight : '', 'placeholder': 'admin.setting.shop.delivery.weight'|trans }}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_fee_prototype.twig:41:                    {{ form_widget(form.size, {'attr': {'data-origin-value': (DeliveryFee and DeliveryFee.size) ? DeliveryFee.size : '', 'placeholder': 'admin.setting.shop.delivery.size'|trans }}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_fee_prototype.twig:46:                    {{ form_widget(form.fee, {'attr': {'data-origin-value': (DeliveryFee and DeliveryFee.fee) ? DeliveryFee.fee : '', 'placeholder': 'admin.setting.shop.delivery.fee'|trans }}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_time_prototype.twig:11:{% set DeliveryTime = form.vars.value %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_time_prototype.twig:12:<li class="list-group-item delivery-time-item sortable-item">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_time_prototype.twig:18:            <span class="display-label">{% if DeliveryTime is empty %}__value__{% else %}{{ DeliveryTime }}{% endif %}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_time_prototype.twig:33:            <a class="btn btn-ec-actionIcon me-2 remove-delivery-time-item" href="" data-bs-toggle="tooltip"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_time_prototype.twig:43:                    {{ form_widget(form.delivery_time, {'attr': {'data-origin-value': form.vars.value }}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery_time_prototype.twig:51:                {{ form_errors(form.delivery_time) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery.twig:13:{% set menus = ['setting', 'basic_info', 'shop_delivery'] %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery.twig:15:{% block title %}{{ 'admin.setting.shop.delivery_list'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery.twig:37:                    url: '{{ url('admin_setting_shop_delivery_sort_no_move') }}',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery.twig:198:                        <a class="btn btn-ec-regular" href="{{ url('admin_setting_shop_delivery_new') }}">{{ 'admin.common.create__new'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery.twig:208:                                            <div class="col-2"><strong>{{ 'admin.setting.shop.delivery.delivery_name'|trans }}</strong></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery.twig:212:                                        {% for Delivery in Deliveries %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery.twig:213:                                            <li id="ex-delivery-{{ Delivery.id }}" class="list-group-item sortable-item" data-id="{{ Delivery.id }}" data-sort-no="{{ Delivery.sortNo }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery.twig:216:                                                    <div class="col-auto d-flex align-items-center">{{ Delivery.id }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery.twig:218:                                                        <a href="{{ url('admin_setting_shop_delivery_edit', {'id': Delivery.id} ) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery.twig:219:                                                            {{ Delivery.name }} / {{ Delivery.service_name }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery.twig:229:                                                        <a class="btn btn-ec-actionIcon me-2 action-visible" href="{{ url('admin_setting_shop_delivery_visibility', {'id': Delivery.id }) }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery.twig:230:                                                           data-bs-toggle="tooltip" data-bs-placement="top" title="{{ Delivery.visible ? 'admin.common.to_hide'|trans : 'admin.common.to_show'|trans }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery.twig:232:                                                            <i class="fa fa-toggle-{{ Delivery.visible ? 'on' : 'off' }} fa-lg text-secondary" aria-hidden="true"></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery.twig:237:                                                               data-url="{{ url('admin_setting_shop_delivery_delete', {id: Delivery.id} ) }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/delivery.twig:238:                                                               data-message="{{ 'admin.common.delete_modal__message'|trans({ "%name%" : Delivery.name }) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_detail.twig:28:                                        <p class="mb-0">{% if instruction.trackingNo %}{{ 'admin.stock.move_instruction.shipment_status_done'|trans }}{% else %}{{ 'admin.stock.move_instruction.shipment_status_not_done'|trans }}{% endif %}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_detail.twig:55:                                        {{ form_row(form.trackingNo, { 'attr': { 'class': 'form-control', 'rows': 2 } }) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_detail.twig:84:                                {% if instruction.trackingNo %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_detail.twig:85:                                    <button type="button" class="btn btn-ec-delete" disabled title="{{ 'admin.stock.move_instruction.delete_disabled_after_tracking'|trans }}">{{ 'admin.stock.move_instruction.delete'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_detail.twig:144:                {% if not instruction.trackingNo %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/shipping_notify.twig:11:{% if Shipping.tracking_number %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/shipping_notify.twig:12:お問い合わせ番号：{{ Shipping.tracking_number }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/shipping_notify.twig:13:{% if Shipping.Delivery.confirm_url %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/shipping_notify.twig:14:お問い合わせURL：{{ Shipping.Delivery.confirm_url }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/shipping_notify.twig:48:配送方法：{{ Shipping.shipping_delivery_name }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/shipping_notify.twig:49:お届け日：{{ Shipping.shipping_delivery_date is empty ? '指定なし' : Shipping.shipping_delivery_date|date_day }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/shipping_notify.twig:50:お届け時間：{{ Shipping.shipping_delivery_time|default('指定なし') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/delivery_edit.twig:37:          action="{%- if CustomerAddress.id %}{{ url('admin_customer_delivery_edit', { id : Customer.id, did: CustomerAddress.id }) }}{% else %}{{ url('admin_customer_delivery_new', { id: Customer.id }) }}{% endif -%}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig:725:                                        <a data-bs-toggle="collapse" href="#delivery" aria-expanded="false"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig:726:                                           aria-controls="delivery">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig:732:                            <div class="collapse show ec-cardCollapse" id="delivery">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig:753:                                                        <a href="{{ url('admin_customer_delivery_edit', { 'id': Customer.id, 'did': CustomerAddress.id }) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig:786:                                                                        <a href="{{ url('admin_customer_delivery_delete', {'id' : Customer.id, 'did':  CustomerAddress.id}) }}" class="btn btn-ec-delete"{{ csrf_token_for_anchor() }} data-method="delete" data-confirm="false">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig:802:                                                <a href="{{ url('admin_customer_delivery_new', { id: Customer.id }) }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig:818:                                            <a href="{{ url('admin_customer_delivery_new', { id: Customer.id }) }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order.twig:22:お問い合わせ：{{ Order.message }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order.twig:38:送　料：{{ Order.delivery_fee_total|price}}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order.twig:77:配送方法：{{ Shipping.shipping_delivery_name }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order.twig:78:お届け日：{{ Shipping.shipping_delivery_date is empty ? '指定なし' : Shipping.shipping_delivery_date|date_day }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order.twig:79:お届け時間：{{ Shipping.shipping_delivery_time|default('指定なし') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:194:                                        <th class="pt-2 pb-2">{{ 'admin.stock.move_instruction.tracking_no'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:215:                                                {% if Item.trackingNo %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:216:                                                    <span class="tracking-no-value">{{ Item.trackingNo }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:218:                                                    <button type="button" class="btn btn-ec-regular btn-sm btn-tracking-register" data-id="{{ Item.id }}" data-url="{{ url('admin_stock_move_instruction_register_tracking', { id: Item.id }) }}" data-bs-toggle="modal" data-bs-target="#trackingRegisterModal">{{ 'admin.stock.move_instruction.tracking_register_button'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:222:                                                {% if Item.trackingNo %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:251:                <div class="modal fade" id="trackingRegisterModal" tabindex="-1" role="dialog" aria-labelledby="trackingRegisterModalLabel" aria-hidden="true">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:255:                                <h5 class="modal-title fw-bold" id="trackingRegisterModalLabel">{{ 'admin.stock.move_instruction.tracking_register_modal_title'|trans }}</h5>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:258:                            <form id="trackingRegisterForm" method="post" action="#">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:262:                                        <label class="form-label fw">{{ 'admin.stock.move_instruction.tracking_no'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:263:                                        <input type="text" class="form-control" name="tracking_no" id="trackingRegisterTrackingNo" value="" placeholder="" maxlength="255">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:268:                                    <button type="submit" class="btn btn-ec-conversion">{{ 'admin.stock.move_instruction.tracking_register_button'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:287:                            <form method="post" action="{{ url('admin_stock_move_instruction_csv_tracking') }}" enctype="multipart/form-data" id="csvRecordRegistrationForm">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:326:                                                        <td class="table-light fw-bold"><span class="badge bg-primary me-1">{{ 'admin.common.required'|trans }}</span>{{ 'admin.stock.move_instruction.csv_format_tracking_no'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:327:                                                        <td>{{ 'admin.stock.move_instruction.csv_format_tracking_no_desc'|trans }}</td>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:336:                                    <button type="submit" class="btn btn-ec-conversion" id="csvRecordUploadButton" disabled>{{ 'admin.stock.move_instruction.tracking_register_button'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:395:            $(document).on('click', '.btn-tracking-register', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:397:                $('#trackingRegisterForm').attr('action', url);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:398:                $('#trackingRegisterTrackingNo').val('');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:400:            $('#trackingRegisterModal').on('hidden.bs.modal', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:401:                $('#trackingRegisterForm').attr('action', '#');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:402:                $('#trackingRegisterTrackingNo').val('');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_movement_info.twig:42:                            <div class="form-control-plaintext">{{ hasDisplay ? (StockMoveTransfer.trackingNo ?? '') : '' }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content_tax.en.twig:6:{% if data.Shippings[0].delivery.id not in constant('Plugin\\HareruyaEc\\Entity\\Delivery::OTC_GROUP') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content_tax.en.twig:26: Postage : {{ data.deliveryFeeTotal|number_format }}JPY
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content_tax.en.twig:32:[Delivery method] {{ deliverySub.nameEn }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content_tax.en.twig:34:[Delivery Date] {% if data.shippings[0].shippingDeliveryDate is not null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content_tax.en.twig:36:{% for value in weekday|slice((data.shippings[0].shippingDeliveryDate|date('w') + weekday|length - 1) % weekday|length, 1) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content_tax.en.twig:37:{{ data.Shippings[0].shippingDeliveryDate|date('m/d/Y (' ~ value ~ ')') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content_tax.en.twig:43:[Desired Delivery Window] {{ data.Shippings[0].shippingDeliveryTime ? trans('admin.' ~ data.Shippings[0].shippingDeliveryTime ~ '.en') : 'No Request'}}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/sell_order.twig:18:　送料：{{ Order.deliveryFeeTotal|price }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/sell_order.twig:24:【配送方法】{{ Order.Shippings[0].shippingDeliveryName }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/sell_order.twig:26:【配送希望日】{% if Order.shippings[0].shippingDeliveryDate is not null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/sell_order.twig:28:{% for value in weekday|slice((Order.shippings[0].shippingDeliveryDate|date('w') + weekday|length - 1) % weekday|length, 1) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/sell_order.twig:29:{{ Order.Shippings[0].shippingDeliveryDate|date('Y年m月d日') }} ({{ value }})
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/sell_order.twig:35:【配送希望時間帯】{{ Order.Shippings[0].shippingDeliveryTime|default('希望なし') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:511:                                    <label class="form-label">{{ form_label(searchForm.tracking_no) }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:512:                                    {{ form_widget(searchForm.tracking_no) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:513:                                    {{ form_errors(searchForm.tracking_no) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/contact_mail.twig:19:■お問い合わせの内容：
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/shipment_complete.en.twig:4:{% if data.Order.Shippings.0.delivery.confirm_url is not empty %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/shipment_complete.en.twig:5:{{ data.Order.Shippings.0.delivery.confirm_url }}?locale=en
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/shipment_complete.en.twig:21: Postage : {{ data.Order.deliveryFeeTotal|number_format }}JPY
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content.twig:7:{% if data.Shippings[0].delivery.id not in constant('Eccube\\Entity\\Delivery::OTC_GROUP') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content.twig:27:　送料：{{ data.deliveryFeeTotal|price }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content.twig:33:【配送方法】{{ data.Shippings[0].shippingDeliveryName }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content.twig:35:【配送希望日】{% if data.Shippings[0].shippingDeliveryDate is not null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content.twig:37:{% for value in weekday|slice((data.Shippings[0].shippingDeliveryDate|date('w') + weekday|length - 1) % weekday|length, 1) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content.twig:38:{{ data.Shippings[0].shippingDeliveryDate|date('Y年m月d日') }} ({{ value }})
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content.twig:44:【配送希望時間帯】{{ data.Shippings[0].shippingDeliveryTime ? ('admin.' ~ data.Shippings[0].shippingDeliveryTime ~ '.ja')|trans : '希望なし' }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:481:            $('#order_Shipping_Delivery').change();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:507:            const times = {{ shippingDeliveryTimes|raw }};
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:508:            $('#order_Shipping_Delivery').change(function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:509:                const deliveryId = $(this).val();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:510:                const $shippingDeliveryTime = $('#order_Shipping_DeliveryTime');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:511:                $shippingDeliveryTime.find('option').remove();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:512:                $shippingDeliveryTime.append($('<option></option>').val('').text('{{ 'admin.common.select__unspecified'|trans }}'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:513:                if (typeof(times[deliveryId]) !== 'undefined') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:514:                    for (const timeId in times[deliveryId]) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:515:                        const timeValue = times[deliveryId][timeId];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:516:                        $shippingDeliveryTime.append($('<option></option>')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:748:        $('#print-delivery-slip').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:749:            const url = "{{ url('admin_order_print_delivery_slips', {id: Order.id}) }}";
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:806:                                        <button type="button" class="btn btn-ec-regular" id="print-delivery-slip">{{ '納品書印刷'|trans }}</button>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1183:                                    <div class="col-auto"><span class="align-middle">{{ 'admin.order.delivery_fee'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1185:                                        {{ form_widget(form.delivery_fee_total) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1186:                                        {{ form_errors(form.delivery_fee_total) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1595:                                            <span class="me-5">{{ 'admin.order.delivery'|trans }}({{ loop.index }})</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1608:                                                <a class="btn btn-ec-regular pdf-print" href="{{ url('admin_order_export_pdf') }}?ids[]={{ Order.Shippings[0].id }}">{{ 'admin.order.output_delivery_note'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1732:                                                <label class="col-3 col-form-label" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.order.shipping_info.delivery_provider'|trans }}">{{ 'admin.order.delivery_provider'|trans }}<span class="badge bg-primary ms-1"></span><i class="fa fa-question-circle fa-lg ms-1"></i></label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1734:                                                    {{ Order.Shippings[0].Delivery }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1738:                                                <label class="col-3 col-form-label" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.order.shipping_info.delivery_provider'|trans }}">{{ '変更後配送方法'|trans }}<span class="badge bg-primary ms-1"></span><i class="fa fa-question-circle fa-lg ms-1"></i></label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1740:                                                    {{ form_widget(form.Shipping.Delivery) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1741:                                                    {{ form_errors(form.Shipping.Delivery) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1745:                                                <label class="col-3 col-form-label"><i class="fa fa-calendar-check-o fa-fw me-1" aria-hidden="true"></i>{{ 'admin.order.delivery_date'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1747:                                                    {{ form_widget(form.Shipping.shipping_delivery_date) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1748:                                                    {{ form_errors(form.Shipping.shipping_delivery_date) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1752:                                                <label class="col-3 col-form-label"><i class="fa fa-clock-o fa-fw me-1" aria-hidden="true"></i>{{ 'admin.order.delivery_time'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1754:                                                    {{ Order.Shippings[0].shipping_delivery_time }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1760:                                                    {{ form_widget(form.Shipping.DeliveryTime) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1761:                                                    {{ form_errors(form.Shipping.DeliveryTime) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1765:                                                <label class="col-3 col-form-label" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.order.shipping_info.tracking_number'|trans }}">{{ 'admin.order.tracking_number'|trans }}<i class="fa fa-question-circle fa-lg ms-1"></i></label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1767:                                                    {{ form_widget(form.Shipping.tracking_number) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1768:                                                    {{ form_errors(form.Shipping.tracking_number) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order.html.twig:42:                            お問い合わせ：{{ Order.message }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order.html.twig:59:                            送　料：{{ Order.delivery_fee_total|price }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order.html.twig:103:                                配送方法：{{ Shipping.shipping_delivery_name }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order.html.twig:104:                                お届け日：{{ Shipping.shipping_delivery_date is empty ? '指定なし' : Shipping.shipping_delivery_date|date_day }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order.html.twig:105:                                お届け時間：{{ Shipping.shipping_delivery_time|default('指定なし') }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/id_expire_notification.twig:12:■お問い合わせについて
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/id_expire_notification.twig:13:ご不明な点がございましたら下記URLよりお問い合わせください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content.twig:7:{% if data.Shippings[0].delivery.id not in constant('Plugin\\HareruyaEc\\Entity\\Delivery::OTC_GROUP') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content.twig:27:　送料：{{ data.deliveryFeeTotal|price }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content.twig:33:【配送方法】{{ data.Shippings[0].shippingDeliveryName }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content.twig:35:【配送希望日】{% if data.shippings[0].shippingDeliveryDate is not null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content.twig:37:{% for value in weekday|slice((data.shippings[0].shippingDeliveryDate|date('w') + weekday|length - 1) % weekday|length, 1) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content.twig:38:{{ data.Shippings[0].shippingDeliveryDate|date('Y年m月d日 (' ~ value ~ ')') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content.twig:44:【配送希望時間帯】{{ data.Shippings[0].shippingDeliveryTime ? trans('admin.' ~ data.Shippings[0].shippingDeliveryTime ~ '.ja') : '希望無し'}}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/forgot_mail.en.twig:2:*This URL will expire after {{ eccube_config.eccube_customer_reset_expire }} hours from the delivery of this email.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/evententry_complete.twig:11:■お問い合わせフォーム
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/evententry_complete.twig:16:お手数をおかけしますが、お問い合わせフォームからご連絡いただけますようお願いいたします。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/buy_order_include_delivery_fee.twig:58:　送料：{{ BuyOrder.deliveryFee|price }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/buy_order_include_delivery_fee.twig:59:【送金金額】　{{ BuyOrder.getAcceptanceTotalPrice() + BuyOrder.getDeliveryFee() }} 円
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/shipping_notify.html.twig:32:                            {% if Shipping.tracking_number %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/shipping_notify.html.twig:34:                                お問い合わせ番号：{{ Shipping.tracking_number }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/shipping_notify.html.twig:35:                                {% if Shipping.Delivery.confirm_url %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/shipping_notify.html.twig:37:                                    お問い合わせURL：{{ Shipping.Delivery.confirm_url }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/shipping_notify.html.twig:74:                            配送方法：{{ Shipping.shipping_delivery_name }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/shipping_notify.html.twig:75:                            お届け日：{{ Shipping.shipping_delivery_date is empty ? '指定なし' : Shipping.shipping_delivery_date|date_day }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/shipping_notify.html.twig:76:                            お届け時間：{{ Shipping.shipping_delivery_time|default('指定なし') }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig:15:{% block title %}{{ 'admin.order.output_delivery_note_short'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig:62:                            <h4 class="box-title fw-bold">{{ 'admin.order.output_delivery_note'|trans }}</h4>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig:67:                                <label class="col-form-label">{{ 'admin.order.delivery_note_create_date'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig:79:                                <label class="col-form-label">{{ 'admin.order.delivery_note_title'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig:86:                                <label class="col-form-label">{{ 'admin.order.delivery_note_output_format'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig:91:                            <div class="fw-bold">{{ 'admin.order.delivery_note_message'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig:94:                                <label class="col-form-label">{{ 'admin.order.delivery_note_line1'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig:100:                                <label class="col-form-label">{{ 'admin.order.delivery_note_line2'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig:106:                                <label class="col-form-label">{{ 'admin.order.delivery_note_line3'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig:111:                            <div class="fw-bold">{{ 'admin.order.delivery_note_memo'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig:113:                                <label class="col-form-label">{{ 'admin.order.delivery_note_line1'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig:119:                                <label class="col-form-label">{{ 'admin.order.delivery_note_line2'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_pdf.twig:125:                                <label class="col-form-label">{{ 'admin.order.delivery_note_line3'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:129:        var times = {{ shippingDeliveryTimes|raw }};
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:131:        $("select[id$='_Delivery']").on('change', function() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:132:            var deliveryId = $(this).val();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:133:            var $shippingDeliveryTime = $(this).parents('.card-body').find("select[id$='_DeliveryTime']");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:134:            $shippingDeliveryTime.find('option').remove();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:135:            $shippingDeliveryTime.append($('<option></option>').val('').text('{{ 'admin.common.select__unspecified'|trans }}'));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:136:            if (typeof(times[deliveryId]) !== 'undefined') {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:137:                for (var timeId in times[deliveryId]) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:138:                    timeValue = times[deliveryId][timeId];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:139:                    $shippingDeliveryTime.append($('<option></option>')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:325:                                                <a class="btn btn-ec-regular pdf-print" href="{{ url('admin_order_export_pdf') }}?ids[]={{ shippingForm.vars.value.id }}">{{ 'admin.order.output_delivery_note'|trans }}</a>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:449:                                                    {{ 'admin.order.tracking_number'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:452:                                                    {{ form_widget(shippingForm.tracking_number) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:453:                                                    {{ form_errors(shippingForm.tracking_number) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:458:                                                    {{ 'admin.order.delivery_provider'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:463:                                                    {{ form_widget(shippingForm.Delivery) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:464:                                                    {{ form_errors(shippingForm.Delivery) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:472:                                                    {{ 'admin.order.delivery_date'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:475:                                                    {{ form_widget(shippingForm.shipping_delivery_date) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:476:                                                    {{ form_errors(shippingForm.shipping_delivery_date) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:482:                                                    {{ 'admin.order.delivery_time'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:485:                                                    {{ form_widget(shippingForm.DeliveryTime) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:486:                                                    {{ form_errors(shippingForm.DeliveryTime) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/shipping_notify.twig:11:{% if Shipping.tracking_number %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/shipping_notify.twig:12:お問い合わせ番号：{{ Shipping.tracking_number }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/shipping_notify.twig:13:{% if Shipping.Delivery.confirm_url %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/shipping_notify.twig:14:お問い合わせURL：{{ Shipping.Delivery.confirm_url }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/shipping_notify.twig:48:配送方法：{{ Shipping.shipping_delivery_name }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/shipping_notify.twig:49:お届け日：{{ Shipping.shipping_delivery_date is empty ? '指定なし' : Shipping.shipping_delivery_date|date_day }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/shipping_notify.twig:50:お届け時間：{{ Shipping.shipping_delivery_time|default('指定なし') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/order.html.twig:42:                            お問い合わせ：{{ Order.message }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/order.html.twig:59:                            送　料：{{ Order.delivery_fee_total|price }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/order.html.twig:103:                                配送方法：{{ Shipping.shipping_delivery_name }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/order.html.twig:104:                                お届け日：{{ Shipping.shipping_delivery_date is empty ? '指定なし' : Shipping.shipping_delivery_date|date_day }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/order.html.twig:105:                                お届け時間：{{ Shipping.shipping_delivery_time|default('指定なし') }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/order.html.twig:42:                            お問い合わせ：{{ Order.message }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/order.html.twig:59:                            送　料：{{ Order.delivery_fee_total|price }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/order.html.twig:103:                                配送方法：{{ Shipping.shipping_delivery_name }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/order.html.twig:104:                                お届け日：{{ Shipping.shipping_delivery_date is empty ? '指定なし' : Shipping.shipping_delivery_date|date_day }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/order.html.twig:105:                                お届け時間：{{ Shipping.shipping_delivery_time|default('指定なし') }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/shipping_notify.html.twig:32:                            {% if Shipping.tracking_number %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/shipping_notify.html.twig:34:                                お問い合わせ番号：{{ Shipping.tracking_number }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/shipping_notify.html.twig:35:                                {% if Shipping.Delivery.confirm_url %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/shipping_notify.html.twig:37:                                    お問い合わせURL：{{ Shipping.Delivery.confirm_url }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/shipping_notify.html.twig:74:                            配送方法：{{ Shipping.shipping_delivery_name }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/shipping_notify.html.twig:75:                            お届け日：{{ Shipping.shipping_delivery_date is empty ? '指定なし' : Shipping.shipping_delivery_date|date_day }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/shipping_notify.html.twig:76:                            お届け時間：{{ Shipping.shipping_delivery_time|default('指定なし') }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/order.twig:22:お問い合わせ：{{ Order.message }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/order.twig:38:送　料：{{ Order.delivery_fee_total|price}}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/order.twig:77:配送方法：{{ Shipping.shipping_delivery_name }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/order.twig:78:お届け日：{{ Shipping.shipping_delivery_date is empty ? '指定なし' : Shipping.shipping_delivery_date|date_day }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/order.twig:79:お届け時間：{{ Shipping.shipping_delivery_time|default('指定なし') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/shipping_notify.html.twig:32:                            {% if Shipping.tracking_number %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/shipping_notify.html.twig:34:                                お問い合わせ番号：{{ Shipping.tracking_number }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/shipping_notify.html.twig:35:                                {% if Shipping.Delivery.confirm_url %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/shipping_notify.html.twig:37:                                    お問い合わせURL：{{ Shipping.Delivery.confirm_url }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/shipping_notify.html.twig:74:                            配送方法：{{ Shipping.shipping_delivery_name }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/shipping_notify.html.twig:75:                            お届け日：{{ Shipping.shipping_delivery_date is empty ? '指定なし' : Shipping.shipping_delivery_date|date_day }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/shipping_notify.html.twig:76:                            お届け時間：{{ Shipping.shipping_delivery_time|default('指定なし') }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/order.twig:22:お問い合わせ：{{ Order.message }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/order.twig:38:送　料：{{ Order.delivery_fee_total|price}}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/order.twig:77:配送方法：{{ Shipping.shipping_delivery_name }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/order.twig:78:お届け日：{{ Shipping.shipping_delivery_date is empty ? '指定なし' : Shipping.shipping_delivery_date|date_day }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/order.twig:79:お届け時間：{{ Shipping.shipping_delivery_time|default('指定なし') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/shipping_notify.twig:11:{% if Shipping.tracking_number %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/shipping_notify.twig:12:お問い合わせ番号：{{ Shipping.tracking_number }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/shipping_notify.twig:13:{% if Shipping.Delivery.confirm_url %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/shipping_notify.twig:14:お問い合わせURL：{{ Shipping.Delivery.confirm_url }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/shipping_notify.twig:48:配送方法：{{ Shipping.shipping_delivery_name }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/shipping_notify.twig:49:お届け日：{{ Shipping.shipping_delivery_date is empty ? '指定なし' : Shipping.shipping_delivery_date|date_day }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/shipping_notify.twig:50:お届け時間：{{ Shipping.shipping_delivery_time|default('指定なし') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/order.twig:22:お問い合わせ：{{ Order.message }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/order.twig:38:送　料：{{ Order.delivery_fee_total|price}}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/order.twig:77:配送方法：{{ Shipping.shipping_delivery_name }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/order.twig:78:お届け日：{{ Shipping.shipping_delivery_date is empty ? '指定なし' : Shipping.shipping_delivery_date|date_day }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/order.twig:79:お届け時間：{{ Shipping.shipping_delivery_time|default('指定なし') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/shipping_notify.twig:11:{% if Shipping.tracking_number %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/shipping_notify.twig:12:お問い合わせ番号：{{ Shipping.tracking_number }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/shipping_notify.twig:13:{% if Shipping.Delivery.confirm_url %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/shipping_notify.twig:14:お問い合わせURL：{{ Shipping.Delivery.confirm_url }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/shipping_notify.twig:48:配送方法：{{ Shipping.shipping_delivery_name }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/shipping_notify.twig:49:お届け日：{{ Shipping.shipping_delivery_date is empty ? '指定なし' : Shipping.shipping_delivery_date|date_day }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/shipping_notify.twig:50:お届け時間：{{ Shipping.shipping_delivery_time|default('指定なし') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/shipping_notify.html.twig:32:                            {% if Shipping.tracking_number %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/shipping_notify.html.twig:34:                                お問い合わせ番号：{{ Shipping.tracking_number }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/shipping_notify.html.twig:35:                                {% if Shipping.Delivery.confirm_url %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/shipping_notify.html.twig:37:                                    お問い合わせURL：{{ Shipping.Delivery.confirm_url }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/shipping_notify.html.twig:74:                            配送方法：{{ Shipping.shipping_delivery_name }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/shipping_notify.html.twig:75:                            お届け日：{{ Shipping.shipping_delivery_date is empty ? '指定なし' : Shipping.shipping_delivery_date|date_day }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/shipping_notify.html.twig:76:                            お届け時間：{{ Shipping.shipping_delivery_time|default('指定なし') }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/order.html.twig:42:                            お問い合わせ：{{ Order.message }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/order.html.twig:59:                            送　料：{{ Order.delivery_fee_total|price }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/order.html.twig:103:                                配送方法：{{ Shipping.shipping_delivery_name }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/order.html.twig:104:                                お届け日：{{ Shipping.shipping_delivery_date is empty ? '指定なし' : Shipping.shipping_delivery_date|date_day }}<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/order.html.twig:105:                                お届け時間：{{ Shipping.shipping_delivery_time|default('指定なし') }}<br/>

codex
候補は1件で、論点は「一覧の非同期保存で空文字が保存されるか」です。次に該当コントローラ、Symfony Validator、受注編集側フォーム定義、一覧JSを狭く読んで、誤検知や見落としがないか確認します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php | sed -n '540,625p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc 'rg -n "tracking_number|graph_and_hyphen|Regex|Length|stext|mtext" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php' in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/hareruya-design-docs/functions/ec-cube-enterprise/m05-13_admin_order_order_tracking_number.md | sed -n '1,230p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	# m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）
     2	
     3	管理画面の受注一覧と受注編集で、出荷ごとに問い合わせ番号（出荷伝票番号・トラッキング番号）を入力し、出荷情報へ保存する機能。
     4	
     5	## 概要
     6	
     7	受注の問い合わせ番号入力は、管理者が出荷単位の伝票番号を受注一覧画面または受注編集画面から入力し、出荷情報の伝票番号列へ保存する機能である。受注一覧では出荷行ごとの入力欄から非同期で1件ずつ保存し、受注編集では出荷情報フォームの一項目として受注全体の保存と同時に保存する。
     8	
     9	本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。既存実装のふるまい、保存先、検証境界、副作用を確認し、仕様の確からしさを把握することを目的とする。
    10	
    11	対象はブラウザ経由の管理画面の受注一覧と受注編集における問い合わせ番号の入力・保存に限る。
    12	
    13	管理画面プレフィックスは環境変数由来の`eccube_admin_route`で決まり、管理用ファイアウォールは`^/%eccube_admin_route%/`配下を保護する。本書ではサイトルートからのパスを`%eccube_admin_route%`で示す。コントローラのメソッド単位の解剖やルートnameの網羅は主題としない。
    14	
    15	本機能のカスタマイズ区分は標準であり、挙動・DB関連ともにec-cube-enterpriseの実装を正とする。
    16	
    17	---
    18	
    19	## 本書で扱うこと
    20	
    21	- 受注一覧の出荷行から問い合わせ番号を非同期で保存する入口とふるまい
    22	- 受注編集の出荷情報フォームで問い合わせ番号を受注保存と同時に保存するふるまい
    23	- 入力値の半角変換、文字種検証、最大長検証、保存先の出荷情報列
    24	- 一覧の非同期保存と編集フォーム保存で最大長の確認値が異なること
    25	- 非同期保存の成功・失敗時のJSON応答と画面のふるまい
    26	- 非同期保存の権限・なりすまし対策トークン・XHR要求の判定
    27	
    28	---
    29	
    30	## 本書で扱わないこと
    31	
    32	以下は本書では仕様確定せず、実装または別機能の設計を正とする。
    33	
    34	- 対応状況（出荷ステータス）の個別変更・一括変更（M05-12／M05-14の機能）
    35	- 出荷完了メール・通知メールの送信（M05-15の機能）
    36	- 受注メモ・ショップ用メモ欄の入力（M05-16／M05-17の機能）
    37	- 受注一覧の検索・絞り込み・ページング・CSV出力・納品書出力
    38	- 受注編集フォーム全体の明細・金額・お届け先などの編集ルール
    39	- 管理画面のログイン・権限マスタ・管理者アカウント管理の詳細
    40	
    41	---
    42	
    43	## リニューアル移行時の扱い
    44	
    45	本機能はカスタマイズ区分が標準であり、リニューアル後の標準機能としてec-cube-enterpriseの実装を正典とする。挙動・画面・DBスキーマはいずれもec-cube-enterpriseに基づき、現行リポとの差分管理は本書では行わない。問い合わせ番号の保存先（dtb_shipping.tracking_number。最大255文字の文字列・null許容）はec-cube-enterpriseの実装で実在を確認しており、移行先スキーマと同一とする。
    46	
    47	---
    48	
    49	## 用語
    50	
    51	| 用語 | 説明 |
    52	|------|------|
    53	| 問い合わせ番号 | 配送業者の伝票番号・トラッキング番号。画面ラベルは「送り状No.」、ツールチップやCSV列では「お問い合わせ番号（出荷伝票番号）」と表現する。 |
    54	| 出荷 | 1受注に紐づく出荷単位。1受注は複数の出荷を持ち得る。問い合わせ番号は出荷単位で保持する。 |
    55	| 受注一覧 | 出荷行を一覧表示する管理画面。1行が1出荷に対応する。 |
    56	| 受注編集 | 1受注の明細・出荷情報を編集する管理画面。出荷情報の中に問い合わせ番号欄を持つ。 |
    57	| 出荷情報 | 出荷を表す台帳。問い合わせ番号は出荷情報の伝票番号列に保存する。 |
    58	
    59	---
    60	
    61	## 利用者視点の入口
    62	
    63	| 入口 | URLエンドポイント | 期待されるふるまい |
    64	|------|--------------------|--------------------|
    65	| 受注一覧を開く | `GET /%eccube_admin_route%/order` | 出荷行を含む受注一覧を表示する。各出荷行に問い合わせ番号の入力欄と更新ボタンを表示する想定のJSが読み込まれる。 |
    66	| 受注一覧で問い合わせ番号を入力し更新 | `PUT /%eccube_admin_route%/shipping/{id}/tracking_number` | 入力欄の値を非同期（XHR）で送信し、当該出荷の問い合わせ番号を保存する。成功時は入力欄へ保存後の値を反映する。 |
    67	| 受注編集を開く | `GET /%eccube_admin_route%/order/{id}/edit` | 出荷情報の中に問い合わせ番号（送り状No.）欄を、現在の保存値を初期値として表示する。 |
    68	| 受注編集で受注を保存 | `POST /%eccube_admin_route%/order/{id}/edit` | 問い合わせ番号欄を含む出荷情報フォームを受注全体の保存と同時に検証・保存する。 |
    69	| 非管理者・未認証 | 上記の管理側URL | 管理用ファイアウォールにより到達できず、本機能を利用できない。 |
    70	
    71	非同期保存の`{id}`は出荷識別子（数字のみ）である。受注編集側の`{id}`は受注識別子である。
    72	
    73	---
    74	
    75	## フロント挙動
    76	
    77	| 観点 | 内容 |
    78	|------|------|
    79	| 表示要素（受注一覧） | 出荷行ごとに問い合わせ番号の入力欄（1行テキスト）と更新ボタンを表示する設計のJSを持つ。入力欄のidは`tracking_number_<出荷id>`、入力欄に`data-shipping_id`と保存先URLの`data-url`、更新ボタンに対象入力欄を指す`data-target`を持たせる前提である。現Enterprise版の一覧テンプレートでは出荷行に「編集系UIは各機能実装時に調整する」旨のTODOがあり、入力欄・更新ボタンの行内マークアップは未配置である。 |
    80	| JS挙動（受注一覧） | 更新ボタンは初期状態で無効。入力欄のkeyupで対象ボタンを有効化し、アイコン色を成功色へ変える。updateTrackingNumberが`PUT`のXHRで`tracking_number`を送信する。成功（status=OK）時は入力欄へ応答値を反映し、コールバックでボタンを再度無効化・アイコンを既定色へ戻す。Enterキー押下時は保存後に次の入力欄へフォーカスを移す。応答がOK以外の到達時は`Update failed.`をアラート表示する。 |
    81	| JS挙動（失敗応答） | XHRがHTTPエラー応答（4xx／5xx）を返した場合、応答JSONの`messages`配列を改行連結してアラート表示する。 |
    82	| CSS・レイアウト | 更新ボタンのアイコンは未変更時が`text-secondary`、変更検知時が`text-success`。状態表現のためのクラス切替のみで、条件分岐表示は行わない。 |
    83	| 表示要素（受注編集） | 出荷情報の中に「送り状No.」ラベルとツールチップ付きの1行テキスト欄を表示する。値は受注編集フォームの出荷情報項目として描画する。 |
    84	| JS挙動（受注編集） | 受注編集の問い合わせ番号欄は専用の非同期送信を持たず、受注編集フォームの通常送信で保存する。 |
    85	| モーダル・ポップアップ | 本機能はモーダル・ポップアップ・トーストを表示しない。一覧の失敗・更新失敗は素のアラートで通知する。 |
    86	
    87	---
    88	
    89	## 処理フロー
    90	
    91	### 受注一覧からの非同期保存
    92	
    93	1. 利用者が出荷行の問い合わせ番号入力欄へ値を入力する。
    94	2. キー入力で当該行の更新ボタンが有効化される。
    95	3. 更新ボタン押下またはEnterキーで、入力欄の`data-url`が示す出荷の伝票番号更新エンドポイントへ`PUT`のXHRを送り、`tracking_number`を送信する。
    96	4. サーバは要求がXHRであることとなりすまし対策トークンが正当であることを確認する。いずれかを満たさない場合はステータスNGのJSONをHTTP400で返す。
    97	5. サーバは受け取った値を半角へ変換し、最大長と文字種を検証する。詳細は「入力項目」と「表示メッセージ」を参照する。
    98	6. 検証エラー時は、エラー文言の配列を持つステータスNGのJSONをHTTP400で返す。画面はその文言をアラート表示する。
    99	7. 検証通過時は出荷情報の伝票番号列を更新して保存し、ステータスOKと出荷識別子・保存後の値を持つJSONを返す。画面は入力欄へ保存後の値を反映する。
   100	8. 保存中に例外が発生した場合はステータスNGのJSONをHTTP500で返す。
   101	
   102	### 受注編集からの保存
   103	
   104	1. 利用者が受注編集を開くと、出荷情報の問い合わせ番号欄に現在の保存値が初期表示される。
   105	2. 利用者が値を入力し、受注編集フォームを送信する。
   106	3. サーバは出荷情報フォームの一項目として問い合わせ番号を検証する。最大長と文字種を検証する。
   107	4. 受注全体の保存処理のなかで、検証通過時に出荷情報の伝票番号列を更新する。検証エラー時はフォーム直下に項目エラーを表示し、受注を保存しない。
   108	
   109	---
   110	
   111	## 表示メッセージ
   112	
   113	### エラー・警告（インライン）
   114	
   115	| 表示文言（日本語） | 表示文言（英語） | 表示条件（利用者視点） | 表示位置 | 備考 |
   116	|-------------------|-------------------|----------------------|----------|------|
   117	| 送り状No.は半角英数字かハイフンのみを入力してください。 | Only Roman alphabets, numbers and hyphens are accepted for tracking numbers. | 受注一覧の非同期保存で、半角変換後の値が半角英数字とハイフン以外を含むとき。 | 入力結果のアラート | 文字種検証のメッセージ。調査補助キー`admin.order.tracking_number_error`。 |
   118	| 半角英数字かハイフンのみを入力してください。 | Entry must be alphanumeric characters or hyphens. | 受注編集フォーム送信で、問い合わせ番号が半角英数字とハイフン以外を含むとき。 | 問い合わせ番号欄の直下 | 調査補助キー`form_error.graph_and_hyphen_only`。 |
   119	| Update failed. | Update failed. | 受注一覧の非同期保存で、応答が到達したがステータスがOKでないとき。 | アラート | 固定文言。翻訳キーを介さない日英共通の文言。 |
   120	
   121	最大長超過時はSymfonyの文字数超過メッセージを返す。一覧の非同期保存では`messages`配列の各文言を改行連結してアラート表示する。
   122	
   123	### フラッシュ・トースト
   124	
   125	本機能は問い合わせ番号の保存に固有のフラッシュ・トーストを生成しない。受注編集フォーム全体の保存完了フラッシュは受注編集機能の出力とする。
   126	
   127	---
   128	
   129	## 業務ルール・計算
   130	
   131	| 項目 | 内容 |
   132	|------|------|
   133	| 半角変換 | 受注一覧の非同期保存では、受け取った値を全角英数字から半角英数字へ変換してから検証・保存する。受注編集フォーム経路ではこの変換を行わない。 |
   134	| 文字種 | 半角英数字とハイフンのみを許可する。それ以外を含むと検証エラーとし保存しない。 |
   135	| 最大長（一覧の非同期保存） | 確認値255文字。`eccube_stext_len`を上限に用いる。 |
   136	| 最大長（受注編集フォーム） | 確認値200文字。`eccube_mtext_len`を上限に用いる。 |
   137	| 保存単位 | 問い合わせ番号は出荷単位で保持する。受注ではなく各出荷に1つずつ保存する。 |
   138	| 既存値の上書き | 保存時は当該出荷の伝票番号列を受信値で上書きする。 |
   139	
   140	本機能は金額計算・税計算・丸め処理を行わない。
   141	
   142	### 入力項目
   143	
   144	| 項目名 | 必須／任意 | 最大長 | 初期値 | 保存先・扱い |
   145	|--------|------------|--------|--------|----------------|
   146	| 送り状No.（受注一覧の出荷行） | 任意 | 255文字（`eccube_stext_len`確認値255） | 当該出荷の現在の保存値または空 | `dtb_shipping.tracking_number`。送信キー`tracking_number`。半角変換後に文字種`/^[0-9a-zA-Z-]+$/u`と最大長を検証。非同期で1出荷ずつ保存。 |
   147	| 送り状No.（受注編集の出荷情報） | 任意 | 200文字（`eccube_mtext_len`確認値200） | 当該出荷の現在の保存値または空 | `dtb_shipping.tracking_number`。フォーム項目`Shipping.tracking_number`。文字種`/^[0-9a-zA-Z-]+$/u`と最大長を検証し、受注編集フォーム送信で保存。 |
   148	
   149	最大長の確認値は`app/config/eccube/packages/eccube.yaml`の`eccube_stext_len`（255）と`eccube_mtext_len`（200）に基づく。運用環境で上書きされている場合はその環境の値が正とする。保存先列`dtb_shipping.tracking_number`はスキーマ上は最大255文字の文字列・null許容である。
   150	
   151	### エッジケース
   152	
   153	| ケース | 扱い |
   154	|--------|------|
   155	| 値が空（受注一覧の非同期保存） | 文字種検証が空文字に一致せず検証エラーとなり保存しない。空での消去はこの経路では成立しない。 |
   156	| 値が空（受注編集フォーム） | 任意項目のため空のまま保存し得る。空文字または未設定として伝票番号列を更新する。 |
   157	| 全角英数字を入力（受注一覧） | 半角へ変換してから検証するため、半角英数字とハイフンの範囲なら保存される。 |
   158	| 全角英数字を入力（受注編集フォーム） | 半角変換を行わないため、半角英数字とハイフン以外と判定され検証エラーとなる。 |
   159	| ハイフン以外の記号・空白を含む | いずれの経路でも文字種検証エラーとなり保存しない。 |
   160	| 最大長を超える | 文字数超過の検証エラーとなり保存しない。上限は経路により255／200と異なる。 |
   161	| 存在しない出荷識別子（非同期保存） | 出荷の取得に失敗し、フレームワークの未検出応答となる。 |
   162	
   163	---
   164	
   165	## データ整合性
   166	
   167	| 観点 | 内容 |
   168	|------|------|
   169	| 一覧と編集の一致 | 受注一覧と受注編集はいずれも同一の出荷情報の伝票番号列を参照・更新する。片方で保存した値は、他方を次に開いたときの初期値に反映される。 |
   170	| 参照時点 | 一覧・編集とも画面表示時点の永続化済みの値を表示する。他者が更新しても表示中の画面は自動更新しない。 |
   171	| 最大長の差 | 非同期保存は255文字まで、編集フォームは200文字までを許す。200文字を超え255文字以下の値は非同期保存でのみ保存され、その出荷を編集フォームで再保存する際に最大長検証に掛かり得る。 |
   172	| 同時更新 | 出荷単位の上書き保存であり、同一出荷を複数の管理者が同時に保存した場合は後勝ちとなる。ロックは取らない。 |
   173	
   174	---
   175	
   176	## API/バッチ結果
   177	
   178	本機能ではバッチ実行を扱わない。受注一覧の非同期保存は管理画面内のXHRであり、入力は出荷識別子と`tracking_number`、成功結果はステータスOKと保存後の値、失敗結果は検証エラー（HTTP400）または保存例外（HTTP500）のステータスNGである。再送信は同じ出荷へ上書き保存となる。
   179	
   180	---
   181	
   182	## 入出力
   183	
   184	| 種類 | 内容 |
   185	|------|------|
   186	| 入力 | 受注一覧では出荷識別子（パス）と`tracking_number`（PUTボディ）。受注編集では出荷情報フォームの問い合わせ番号欄。 |
   187	| 成功時出力 | 受注一覧ではステータスOK・出荷識別子・保存後の値を持つJSON。受注編集では受注全体の保存結果に含めて出荷情報を更新。 |
   188	| 失敗時出力 | 受注一覧では検証エラー時にステータスNGとエラー文言配列をHTTP400、保存例外時にステータスNGをHTTP500。XHR・トークン不正時はステータスNGをHTTP400。受注編集ではフォーム項目エラーを表示し受注を保存しない。 |
   189	| 副作用 | 出荷情報の伝票番号列の更新。情報ログ（送り状番号変更処理完了・入力チェックエラー）の出力。 |
   190	
   191	---
   192	
   193	## DBカラム
   194	
   195	当機能に直接関係する列のみを記載する。型や一覧の細部はスキーマを参照する。
   196	
   197	| テーブル | 列 | メモ |
   198	|----------|-----|------|
   199	| dtb_shipping | id | 非同期保存の対象出荷を特定するキー。 |
   200	| dtb_shipping | tracking_number | 問い合わせ番号の保存先。最大255文字の文字列、null許容。 |
   201	
   202	### DB操作
   203	
   204	永続化の正は ec-cube-enterprise（テーブル名・操作は ec-cube-enterprise を正典）。当ドメインは承認ワークフローを介さず persist/flush で直接確定する（承認ワークフローは在庫機能固有）。
   205	
   206	| 操作種別 | 対象テーブル | 契機・条件 |
   207	|---------|--------------|------------|
   208	| 登録/更新 | dtb_shipping | 当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。 |
   209	
   210	---
   211	
   212	## バリデーション
   213	
   214	| 項目 | 内容 |
   215	|------|------|
   216	| 送り状No.（受注一覧の非同期保存） | 半角変換後に文字種`/^[0-9a-zA-Z-]+$/u`と最大長255文字を検証する。空文字は文字種検証に一致せずエラーとなる。 |
   217	| 送り状No.（受注編集フォーム） | 文字種`/^[0-9a-zA-Z-]+$/u`と最大長200文字を検証する。任意項目のため空は許容する。 |
   218	| 要求の正当性（受注一覧） | XHR要求であること、なりすまし対策トークンが正当であることを保存前に確認する。なりすまし対策トークン自体は業務データとして扱わない。 |
   219	
   220	---
   221	
   222	## 権限・認可
   223	
   224	| 利用者状態 | 問い合わせ番号の入力・保存 |
   225	|------------|---------------------------|
   226	| 未認証 | 利用不可。管理用ファイアウォールにより管理側URLへ到達できずログインへ誘導される。 |
   227	| 管理者として認証済み | 受注一覧・受注編集から問い合わせ番号を入力・保存できる。 |
   228	| 受注機能以外の操作権限 | 問い合わせ番号の保存自体は受注画面の到達可否に従う。対応状況変更・メール送信などの可否は各機能の権限設計に従う。 |
   229	
   230	---

 succeeded in 130ms:
   540	                    }
   541	                } else {
   542	                    $from = $Order->getOrderStatus()->getName();
   543	                    $to = $OrderStatus->getName();
   544	                    $result = ['message' => trans('admin.order.failed_to_change_status', [
   545	                        '%name%' => $Shipping->getId(),
   546	                        '%from%' => $from,
   547	                        '%to%' => $to,
   548	                    ])];
   549	                }
   550	
   551	                log_info('対応状況一括変更処理完了', [$Order->getId()]);
   552	            }
   553	        } catch (\Exception $e) {
   554	            log_error('予期しないエラーです', [$e->getMessage()]);
   555	
   556	            return $this->json(['status' => 'NG'], 500);
   557	        }
   558	
   559	        return $this->json(array_merge(['status' => 'OK'], $result));
   560	    }
   561	
   562	    /**
   563	     * Update to Tracking number.
   564	     */
   565	    #[Route(path: '/%eccube_admin_route%/shipping/{id}/tracking_number', name: 'admin_shipping_update_tracking_number', requirements: ['id' => '\d+'], methods: ['PUT'])]
   566	    public function updateTrackingNumber(Request $request, Shipping $shipping): Response
   567	    {
   568	        if (!($request->isXmlHttpRequest() && $this->isTokenValid())) {
   569	            return $this->json(['status' => 'NG'], 400);
   570	        }
   571	
   572	        $trackingNumber = $request->get('tracking_number') ?? '';
   573	        $trackingNumber = mb_convert_kana((string) $trackingNumber, 'a', 'utf-8');
   574	
   575	        /** @var ConstraintViolationListInterface $errors */
   576	        $errors = $this->validator->validate(
   577	            $trackingNumber,
   578	            [
   579	                new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
   580	                new Assert\Regex(
   581	                    ['pattern' => '/^[0-9a-zA-Z-]+$/u', 'message' => trans('admin.order.tracking_number_error')]
   582	                ),
   583	            ]
   584	        );
   585	
   586	        if ($errors->count() != 0) {
   587	            log_info('送り状番号入力チェックエラー');
   588	            $messages = [];
   589	            /** @var ConstraintViolationInterface $error */
   590	            foreach ($errors as $error) {
   591	                $messages[] = $error->getMessage();
   592	            }
   593	
   594	            return $this->json(['status' => 'NG', 'messages' => $messages], 400);
   595	        }
   596	
   597	        try {
   598	            $shipping->setTrackingNumber($trackingNumber);
   599	            $this->entityManager->persist($shipping);
   600	            $this->entityManager->flush();
   601	            log_info('送り状番号変更処理完了', [$shipping->getId()]);
   602	            $message = ['status' => 'OK', 'shipping_id' => $shipping->getId(), 'tracking_number' => $trackingNumber];
   603	
   604	            return $this->json($message);
   605	        } catch (\Exception $e) {
   606	            log_error('予期しないエラー', [$e->getMessage()]);
   607	
   608	            return $this->json(['status' => 'NG'], 500);
   609	        }
   610	    }
   611	
   612	    /**
   613	     * @return array<string, mixed>|RedirectResponse
   614	     */
   615	    #[Route(path: '/%eccube_admin_route%/order/export/pdf', name: 'admin_order_export_pdf', methods: ['GET', 'POST'])]
   616	    #[Template(template: '@admin/Order/order_pdf.twig')]
   617	    public function exportPdf(Request $request): array|RedirectResponse
   618	    {
   619	        // requestから出荷番号IDの一覧を取得する.
   620	        $ids = $request->get('ids', []);
   621	
   622	        if (count($ids) == 0) {
   623	            $this->addError('admin.order.delivery_note_parameter_error', 'admin');
   624	            log_info('The Order cannot found!');
   625	

 succeeded in 112ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:449:                                                    {{ 'admin.order.tracking_number'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:452:                                                    {{ form_widget(shippingForm.tracking_number) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:453:                                                    {{ form_errors(shippingForm.tracking_number) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:204:            var updateTrackingNumber = function(id, url, tracking_number, callback) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:208:                    data: {'tracking_number': tracking_number}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:211:                        $('#tracking_number_' + id).val(data['tracking_number']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:243:            $('button.update_tracking_number').prop('disabled', true);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:245:            $('input.update_tracking_number').on('keyup', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:246:                var $tracking_number = $(this);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:247:                var $button = $("button[data-target='#" + $tracking_number.attr('id') + "']");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:254:            $('input.update_tracking_number').on('keypress', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:255:                var $tracking_number = $(this);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:256:                var $button = $("button[data-target='#" + $tracking_number.attr('id') + "']");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:261:                    var index = $('input.update_tracking_number').index(this);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:267:                        $('input.update_tracking_number:gt(' + index + '):first').focus();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:269:                    updateTrackingNumber($tracking_number.data('shipping_id'), $tracking_number.data('url'), $tracking_number.val(), callback);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:274:            $('button.update_tracking_number').on('click', function(event) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:278:                var tracking_number = $target.val();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:285:        updateTrackingNumber($target.data('shipping_id'), $target.data('url'), tracking_number, callback);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1765:                                                <label class="col-3 col-form-label" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.order.shipping_info.tracking_number'|trans }}">{{ 'admin.order.tracking_number'|trans }}<i class="fa fa-question-circle fa-lg ms-1"></i></label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1767:                                                    {{ form_widget(form.Shipping.tracking_number) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1768:                                                    {{ form_errors(form.Shipping.tracking_number) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/RepeatedPasswordType.php:49:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/RepeatedPasswordType.php:53:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/AddressType.php:110:                    new Assert\Length(['max' => $this->config['eccube_address1_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/AddressType.php:119:                    new Assert\Length(['max' => $this->config['eccube_address2_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/AddressType.php:128:                    new Assert\Length(['max' => $this->config['eccube_address3_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/RepeatedEmailType.php:47:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/RepeatedEmailType.php:50:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/KanaType.php:57:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/KanaType.php:61:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/KanaType.php:71:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/KanaType.php:75:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/SplitPhoneNumberType.php:26:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/SplitPhoneNumberType.php:110:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/SplitPhoneNumberType.php:119:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/SplitPhoneNumberType.php:128:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:42:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:44:use Symfony\Component\Validator\Constraints\Regex;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:72:                new Length(['min' => 0, 'max' => 3000]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:123:                    new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:127:                    new Length(['max' => 11]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/PhoneNumberType.php:63:            $constraints[] = new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/FaxNumberType.php:28:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/FaxNumberType.php:132:                    new Length(['max' => $this->config['eccube_split_tel_len_max'], 'min' => $this->config['eccube_split_tel_len_min']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/FaxNumberType.php:138:                    new Length(['max' => $this->config['eccube_split_tel_len_max'], 'min' => $this->config['eccube_split_tel_len_min']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/FaxNumberType.php:144:                    new Length(['max' => $this->config['eccube_split_tel_len_max'], 'min' => $this->config['eccube_split_tel_len_min']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/NameType.php:104:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/NameType.php:107:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/NameType.php:118:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/NameType.php:121:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/AddCartType.php:71:                    new Assert\Regex(['pattern' => '/^\d+$/']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/AddCartType.php:98:                        new Assert\Regex(['pattern' => '/^\d+$/']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/SplitPostalType.php:23:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/SplitPostalType.php:46:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/SplitPostalType.php:60:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/NonMemberType.php:55:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/NonMemberType.php:56:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/EntryType.php:82:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/EntryType.php:106:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/Purchase/ConfirmType.php:88:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/Purchase/ConfirmType.php:92:                    new Assert\Length(['max' => 7]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/Purchase/ConfirmType.php:102:                    new Assert\Length(['max' => 128]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Install/Step3Type.php:51:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Install/Step3Type.php:52:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Install/Step3Type.php:70:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Install/Step3Type.php:74:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Install/Step3Type.php:87:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Install/Step3Type.php:91:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Install/Step3Type.php:104:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Install/Step3Type.php:108:                    new Assert\Regex(['pattern' => '/\A\w+\z/']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/ShippingMultipleItemType.php:63:                    new Assert\Regex(['pattern' => '/^\d+$/']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventEntryDetailType.php:34:use Symfony\Component\Validator\Constraints\Regex;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventEntryDetailType.php:67:                    new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/ForgotType.php:45:                'maxlength' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/PasswordResetType.php:46:                'maxlength' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/OtcBuy/OtcBuyOrderType.php:98:                    new Assert\Length(['max' => $this->eccubeConfig->get('eccube_customer_address_length_zipcode')]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/OtcBuy/OtcBuyOrderType.php:105:                    new Assert\Length(['max' => $this->eccubeConfig->get('eccube_zip01_len')]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/OtcBuy/OtcBuyOrderType.php:113:                    new Assert\Length(['max' => $this->eccubeConfig->get('eccube_zip02_len')]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/OtcBuy/OtcBuyOrderType.php:125:                    new Assert\Length(['max' => $this->eccubeConfig->get('eccube_customer_address_length_address_name')]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/OtcBuy/OtcBuyOrderType.php:132:                    new Assert\Length(['max' => $this->eccubeConfig->get('eccube_customer_address_length_address_name')]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/OtcBuy/OtcBuyOrderType.php:138:                    new Assert\Length(['max' => $this->eccubeConfig->get('eccube_customer_address_length_address_name')]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/OtcBuy/OtcBuyOrderType.php:157:                    new Assert\Length(['max' => $this->eccubeConfig->get('eccube_split_tel_len_max')]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/OtcBuy/OtcBuyOrderType.php:166:                    new Assert\Length(['max' => $this->eccubeConfig->get('eccube_split_tel_len_max')]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/OtcBuy/OtcBuyOrderType.php:175:                    new Assert\Length(['max' => $this->eccubeConfig->get('eccube_split_tel_len_max')]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/OtcBuy/OtcBuyOrderType.php:204:                    new Assert\Length(['max' => $this->eccubeConfig->get('eccube_smtext_len')]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/OtcBuy/OtcBuyOrderType.php:284:            new Assert\Length(['max' => $this->eccubeConfig->get('eccube_customer_address_length_address_name')]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/OtcBuy/OtcBuyOrderType.php:285:            new Assert\Regex(['pattern' => '/^[^\s ]+$/u', 'message' => "front.error.{$name}.message"]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockApprovalType.php:37:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockApprovalType.php:112:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/PostalType.php:62:            $constraints[] = new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/PaymentRegisterType.php:31:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/PaymentRegisterType.php:33:use Symfony\Component\Validator\Constraints\Regex;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/PaymentRegisterType.php:62:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/PaymentRegisterType.php:69:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/PaymentRegisterType.php:98:                    new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/CustomerLoginType.php:41:                'maxlength' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/CustomerLoginType.php:51:                'maxlength' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ChangePasswordType.php:59:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ChangePasswordType.php:63:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/OtcBuy/QualifiedInvoiceIssuerAccountType.php:42:        $codeLength = $this->eccubeConfig->get('eccube_qualified_invoice_issuer_length_code');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/OtcBuy/QualifiedInvoiceIssuerAccountType.php:43:        $codeRegex = $this->eccubeConfig->get('eccube_qualified_invoice_issuer_code_regex');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/OtcBuy/QualifiedInvoiceIssuerAccountType.php:47:                new Assert\Length(['max' => $codeLength, 'min' => $codeLength]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/OtcBuy/QualifiedInvoiceIssuerAccountType.php:49:                new Assert\Regex(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/OtcBuy/QualifiedInvoiceIssuerAccountType.php:51:                        'pattern' => $codeRegex,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/OtcBuy/QualifiedInvoiceIssuerAccountType.php:57:                new Assert\Length(['max' => $codeLength]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/ContactType.php:82:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShelfNumberType.php:25:use Symfony\Component\Validator\Constraints\Regex;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShelfNumberType.php:40:                    new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/CustomerAddressType.php:60:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/CustomerAddressType.php:73:                        new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/CustomerAddressType.php:77:                        new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/CustomerAddressType.php:85:                        new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/CustomerAddressType.php:89:                        new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/CustomerAddressType.php:98:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/CustomerAddressType.php:99:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/CustomerAddressType.php:121:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CardDetailType.php:61:                    new Assert\Length(['max' => $length['text']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CardDetailType.php:68:                    new Assert\Length(['max' => $length['text']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CardDetailType.php:75:                    new Assert\Length(['max' => $length['flavor']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CardDetailType.php:82:                    new Assert\Length(['max' => $length['flavor']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CardDetailType.php:89:                    new Assert\Length(['max' => $length['power']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CardDetailType.php:96:                    new Assert\Length(['max' => $length['toughness']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CardDetailType.php:103:                    new Assert\Length(['max' => $length['card_no']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TradeLawType.php:44:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TradeLawType.php:45:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TradeLawType.php:53:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ClassCategoryType.php:43:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ClassCategoryType.php:44:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ClassCategoryType.php:52:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ClassCategoryType.php:53:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ScheduleType.php:36:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ScheduleType.php:140:                    new Length(['max' => $this->eccubeConfig['eccube_int_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ScheduleType.php:145:                    new Length(['max' => $this->eccubeConfig['eccube_price_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ScheduleType.php:152:                    new Length(['max' => $this->eccubeConfig['eccube_construct_format_board_max_card_count']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ScheduleType.php:158:                    new Length(['max' => $this->eccubeConfig['eccube_construct_format_board_max_card_count']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/OtcBuy/OtcBuyRepeatedEmailType.php:46:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/OtcBuy/OtcBuyRepeatedEmailType.php:50:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/OtcBuy/OtcBuyRepeatedPasswordType.php:46:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Front/OtcBuy/OtcBuyRepeatedPasswordType.php:50:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductTag.php:43:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductTag.php:44:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AutoMailType.php:28:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AutoMailType.php:59:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AutoMailType.php:66:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderItemType.php:85:                    new Assert\Length(max: $this->eccubeConfig['eccube_mtext_len']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderItemType.php:94:                    new Assert\Length(max: $this->eccubeConfig['eccube_int_len']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderItemType.php:102:                    new Assert\Regex(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderItemType.php:112:                    new Assert\Regex(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:82:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:93:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:104:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:111:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:161:                        new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:185:            ->add('tracking_number', TextType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:186:                'label' => 'admin.order.tracking_number',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:316:                        new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductType.php:53:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductType.php:88:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductType.php:93:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductType.php:107:                    new Length(['max' => $this->eccubeConfig['eccube_ltext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductType.php:113:                    new Length(['max' => $this->eccubeConfig['eccube_ltext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductType.php:119:                    new Length(['max' => $this->eccubeConfig['eccube_ltext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductType.php:125:                    new Length(['max' => $this->eccubeConfig['eccube_ltext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductType.php:270:                    new Length(['max' => $this->eccubeConfig['eccube_ltext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductType.php:279:                    new Length(['max' => $this->eccubeConfig['eccube_lltext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductType.php:292:                    new Length(['max' => $this->eccubeConfig['eccube_ltext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/HolidayAddType.php:52:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MailType.php:61:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MailType.php:68:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MailType.php:102:                        new Assert\Regex(['pattern' => '/^[0-9a-z_-]+$/']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MailType.php:103:                        new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockMoveInstructionDetailType.php:39:                    new Assert\Length(['max' => 255]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Content/BranchTopPageManagementType.php:68:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Content/BranchTopPageManagementType.php:69:                        'max' => $this->eccubeConfig['eccube_mtext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CalendarType.php:54:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CalendarType.php:55:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/PermissionAccessUrlType.php:30:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/PermissionAccessUrlType.php:59:                    new Length(['max' => 255]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/PermissionAccessUrlType.php:65:                    new Length(['max' => 255]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CardsetType.php:62:                        new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CardsetType.php:75:                        new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CardsetType.php:88:                        new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CardsetType.php:91:                        new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerGroupType.php:28:use Symfony\Component\Validator\Constraints\Regex;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerGroupType.php:43:                    new Regex(['pattern' => '/^[-]?([1-9]\d*|0)$/']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingStandbyCommentType.php:39:                    new Assert\Length(max: $this->eccubeConfig['eccube_ltext_len']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TradeLawMallType.php:43:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TradeLawMallType.php:44:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TradeLawMallType.php:52:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductSellGroupType.php:45:        $stextLen = (int) $this->eccubeConfig['eccube_stext_len'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductSellGroupType.php:54:                    new Assert\Length(['max' => $stextLen]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductSellGroupType.php:56:                'attr' => ['maxlength' => $stextLen],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductSellGroupType.php:63:                    new Assert\Length(['max' => $stextLen]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductSellGroupType.php:65:                'attr' => ['maxlength' => $stextLen],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductSellGroupType.php:75:                    new Assert\Length(['max' => $sellGroupMemoMaxLen]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TopBannerType.php:30:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TopBannerType.php:31:use Symfony\Component\Validator\Constraints\Regex;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TopBannerType.php:84:                        new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TopBannerType.php:85:                        new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TopBannerType.php:97:                        new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryType.php:28:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryType.php:52:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryType.php:60:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeliveryType.php:67:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchCardType.php:74:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TagSalesAnalysisType.php:24:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TagSalesAnalysisType.php:46:                    new Length(['max' => 64]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchCustomerType.php:64:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchCustomerType.php:138:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchCustomerType.php:145:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_price_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchCustomerType.php:152:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_price_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchCustomerType.php:159:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_int_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchCustomerType.php:166:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_int_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchCustomerType.php:400:                        new Assert\Regex(['pattern' => '/^\d+$/']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchCustomerType.php:412:                        new Assert\Regex(['pattern' => '/^\d+$/']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchCustomerType.php:424:                        new Assert\Regex(['pattern' => '/^\d+$/']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchCustomerType.php:436:                        new Assert\Regex(['pattern' => '/^\d+$/']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchCustomerType.php:447:                        new Assert\Length(['max' => $this->eccubeConfig['eccube_price_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchCustomerType.php:458:                        new Assert\Length(['max' => $this->eccubeConfig['eccube_price_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchCustomerType.php:466:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_int_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchCustomerType.php:473:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_int_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchCustomerType.php:504:                        new Assert\Length(['max' => $this->eccubeConfig['eccube_dci_name_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchCustomerType.php:513:                        new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchProductType.php:229:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_price_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchProductType.php:236:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_price_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchProductType.php:243:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_price_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchProductType.php:250:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_price_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchProductType.php:257:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_price_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchProductType.php:264:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_price_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/LatestEventDeckRowType.php:39:        $stextLen = $this->eccubeConfig['eccube_stext_len'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/LatestEventDeckRowType.php:66:                'attr' => ['maxlength' => $stextLen],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/LatestEventDeckRowType.php:68:                    new Assert\Length(['max' => $stextLen]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/LatestEventDeckRowType.php:74:                'attr' => ['maxlength' => $stextLen],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/LatestEventDeckRowType.php:76:                    new Assert\Length(['max' => $stextLen]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CardType.php:54:                    new Assert\Length(['max' => $length['name']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CardType.php:62:                    new Assert\Length(['max' => $length['name']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CardType.php:69:                    new Assert\Length(['max' => $length['name']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CardType.php:76:                    new Assert\Length(['max' => $length['name']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CardType.php:83:                    new Assert\Length(['max' => $length['text']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CardType.php:90:                    new Assert\Length(['max' => $length['text']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CardType.php:97:                    new Assert\Length(['max' => $length['mana_cost']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CardType.php:111:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CardType.php:121:                    new Assert\Length(['max' => $length['power']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CardType.php:128:                    new Assert\Length(['max' => $length['toughness']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CardType.php:135:                    new Assert\Length(['max' => $length['loyalty']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CardType.php:136:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/BulkUpdateProductPriceDetailType.php:73:        $maxLength = 10;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/BulkUpdateProductPriceDetailType.php:75:        return intval(str_repeat('9', $maxLength));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Analysis/FormatSalesType.php:45:                    new Assert\Regex(['pattern' => '/^\d{4}-(0[1-9]|1[0-2])$/']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:88:                    new Assert\Length(max: $this->eccubeConfig['eccube_stext_len']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:107:                        new Assert\Length(max: $this->eccubeConfig['eccube_mtext_len']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:115:                        new Assert\Length(max: $this->eccubeConfig['eccube_mtext_len']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:122:                        new Assert\Length(max: $this->eccubeConfig['eccube_mtext_len']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:143:                        new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:153:                        new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:163:                        new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:176:                        new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:186:                        new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:196:                        new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:206:                    new Assert\Length(max: $this->eccubeConfig['eccube_ltext_len']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:213:                    new Assert\Length(max: $this->eccubeConfig['eccube_int_len']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:221:                    new Assert\Length(max: $this->eccubeConfig['eccube_int_len']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:229:                    new Assert\Length(max: $this->eccubeConfig['eccube_int_len']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:236:                    new Assert\Length(max: $this->eccubeConfig['eccube_ltext_len']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:277:                    new Assert\Length(max: $this->eccubeConfig['eccube_abroad_postal_code_len']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:283:                    new Assert\Length(max: $this->eccubeConfig['eccube_ltext_len']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:291:                    new Assert\Length(max: $this->eccubeConfig['eccube_int_len']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:299:                    new Assert\Length(max: $this->eccubeConfig['eccube_int_len']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:308:                    new Assert\Length(max: $this->eccubeConfig['eccube_int_len']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AuthenticationType.php:47:                    new Assert\Regex(['pattern' => '/^[0-9a-zA-Z]+$/']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AuthenticationType.php:55:                        new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AuthenticationType.php:56:                            'max' => $this->eccubeConfig->get('eccube_smtext_len'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MasterdataDataType.php:49:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MasterdataDataType.php:52:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderStatusSettingType.php:48:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderStatusSettingType.php:55:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderStatusSettingType.php:62:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/FormatType.php:74:                        new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/FormatType.php:88:                        new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockBulkApprovalItemType.php:25:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockBulkApprovalItemType.php:57:                    new Length(max: $maxReasonLen),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/NewsType.php:60:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_mtext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/NewsType.php:67:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_mtext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/NewsType.php:82:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_ltext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:39:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:67:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:68:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:76:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:77:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:85:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:86:                        'max' => $this->eccubeConfig['eccube_mtext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:88:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:99:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:102:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:142:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:154:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:157:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:166:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:167:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:177:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:178:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:185:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:186:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:221:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:224:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:233:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:236:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:270:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:278:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:287:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:297:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:306:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:309:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:320:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:343:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:352:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:353:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:363:                        new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:364:                            'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:366:                        new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:380:                        new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:381:                            'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:383:                        new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Enterprise/MallTenantShopType.php:395:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchEntryType.php:34:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchEntryType.php:156:                    new Length(['max' => $this->eccubeConfig['eccube_event_detail_id_max_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MemberType.php:39:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MemberType.php:42:use Symfony\Component\Validator\Constraints\Regex;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MemberType.php:70:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MemberType.php:87:                        new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MemberType.php:91:                        new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MemberType.php:143:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MemberType.php:200:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MemberType.php:204:                    new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:44:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:47:use Symfony\Component\Validator\Constraints\Regex;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:71:                    new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:75:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:76:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:83:                    new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:97:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:103:                    new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:119:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:122:                    new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:135:                    new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:157:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:181:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:184:                    new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:197:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:200:                    new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:239:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:247:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:255:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:258:                    new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:287:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockHistoryDisposalType.php:29:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockHistoryDisposalType.php:67:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TemplateType.php:44:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TemplateType.php:47:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TemplateType.php:48:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TemplateType.php:56:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TemplateType.php:57:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:41:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:45:use Symfony\Component\Validator\Constraints\Regex;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:79:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:85:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:130:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:131:                    new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:141:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:142:                    new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:152:                    new Length(['max' => $this->eccubeConfig['eccube_int_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:172:                    new Length(['max' => $this->eccubeConfig['eccube_price_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:179:                    new Length(['max' => $this->eccubeConfig['eccube_construct_format_board_max_card_count']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:185:                    new Length(['max' => $this->eccubeConfig['eccube_construct_format_board_max_card_count']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:191:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:197:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:203:                    new Length(['max' => $this->eccubeConfig['eccube_construct_format_board_max_card_count']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:209:                    new Length(['max' => $this->eccubeConfig['eccube_construct_format_board_max_card_count']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:219:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:225:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:231:                    new Length(['max' => $this->eccubeConfig['eccube_construct_format_board_max_card_count']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:237:                    new Length(['max' => $this->eccubeConfig['eccube_construct_format_board_max_card_count']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:247:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:253:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:259:                    new Length(['max' => $this->eccubeConfig['eccube_construct_format_board_max_card_count']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/EventType.php:265:                    new Length(['max' => $this->eccubeConfig['eccube_construct_format_board_max_card_count']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:30:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:33:use Symfony\Component\Validator\Constraints\Regex;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:70:                    new Length(['max' => $this->eccubeConfig['eccube_order_id_len'], 'maxMessage' => 'form.order_id.max_length']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:71:                    new Regex(['pattern' => '/^\d{8}$/']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:82:                    new Regex(['pattern' => '/^[-]?([1-9]\d*|0)$/']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CategoryType.php:50:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CategoryType.php:51:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CategoryType.php:59:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CategoryType.php:60:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CategoryType.php:135:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Event/EventBannerSettingType.php:33:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Event/EventBannerSettingType.php:34:use Symfony\Component\Validator\Constraints\Regex;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Event/EventBannerSettingType.php:89:                        new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Event/EventBannerSettingType.php:90:                        new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Event/EventBannerSettingType.php:95:                        new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Event/EventBannerSettingType.php:106:                        new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Event/EventBannerSettingType.php:107:                        new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:28:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:30:use Symfony\Component\Validator\Constraints\Regex;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:60:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:79:                    new Regex(['pattern' => '/^([!-~]*)$/']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:85:                    new Regex(['pattern' => '/^([!-~]*)$/']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:91:                    new Regex(['pattern' => '/^(https?|ftp)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+)$/']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:98:                    new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:108:                    new Regex(['pattern' => '/^([01][0-9]|2[0-3]):[0-5][0-9]$/']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:139:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:146:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:153:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:160:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:167:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:174:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:181:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:188:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:195:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:225:                    new Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ArchetypeType.php:44:                    new Assert\Length(['max' => 255]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ArchetypeType.php:53:                    new Assert\Length(['max' => 255]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ArchetypeType.php:61:                    new Assert\Length(['max' => 1024]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ArchetypeType.php:69:                    new Assert\Length(['max' => 1024]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TwoFactorAuthType.php:39:                        new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:88:                    new Assert\Length(max: $this->eccubeConfig['eccube_stext_len']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:107:                        new Assert\Length(max: $this->eccubeConfig['eccube_mtext_len']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:118:                        new Assert\Length(max: $this->eccubeConfig['eccube_mtext_len']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:128:                        new Assert\Length(max: $this->eccubeConfig['eccube_mtext_len']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:142:                        new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:153:                        new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:164:                        new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:197:            ->add('tracking_number', TextType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:200:                    new Assert\Length(max: $this->eccubeConfig['eccube_mtext_len']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:201:                    new Assert\Regex(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:203:                        message: 'form_error.graph_and_hyphen_only'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:210:                    new Assert\Length(max: $this->eccubeConfig['eccube_ltext_len']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:240:                    new Assert\Length(max: $this->eccubeConfig['eccube_abroad_postal_code_len']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/WaitingTagType.php:26:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/WaitingTagType.php:28:use Symfony\Component\Validator\Constraints\Regex;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/WaitingTagType.php:76:                    new Length(['max' => $lengthSettings['waiting_tag']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/WaitingTagType.php:77:                    new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchLoginHistoryType.php:47:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchLoginHistoryType.php:54:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchLoginHistoryType.php:61:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockListType.php:101:                    new Assert\Length(['max' => 255]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockListType.php:109:                    new Assert\Length(['max' => 255]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockListType.php:268:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_price_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockListType.php:275:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_price_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockListType.php:414:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_price_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockListType.php:421:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_price_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchStockListType.php:431:                    new Assert\Length(['max' => 255]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SecurityType.php:63:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SecurityType.php:64:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SecurityType.php:67:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SecurityType.php:76:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_ltext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SecurityType.php:83:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_ltext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SecurityType.php:90:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_ltext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SecurityType.php:97:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_ltext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SecurityType.php:109:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SecurityType.php:110:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TaxRuleType.php:52:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ClassNameType.php:47:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ClassNameType.php:48:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ClassNameType.php:55:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ClassNameType.php:56:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchDeckType.php:51:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchDeckType.php:52:                    new Assert\Regex(['pattern' => '/^[\d,\s　]+$/']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchDeckType.php:59:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchDeckType.php:129:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchDeckType.php:146:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchDeckType.php:153:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchDeckType.php:168:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_mtext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchDeckType.php:175:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchDeckType.php:176:                    new Assert\Regex(['pattern' => '/^[\d,\s　]+$/']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:32:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:34:use Symfony\Component\Validator\Constraints\Regex;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:61:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:62:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:70:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:71:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:79:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:80:                        'max' => $this->eccubeConfig['eccube_mtext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:82:                    new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:101:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:104:                    new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:116:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:117:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:124:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:125:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:160:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:168:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:177:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:186:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:195:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:198:                    new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:216:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:219:                    new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:228:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:231:                    new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:252:                    new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:273:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:274:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:284:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:285:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:296:                        new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:299:                        new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:300:                            'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:312:                        new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:313:                            'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShopMasterType.php:315:                        new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderPdfType.php:79:                'attr' => ['maxlength' => $config['eccube_stext_len']],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderPdfType.php:82:                    new Assert\Length(['max' => $config['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderPdfType.php:101:                    new Assert\Length(['max' => $config['eccube_order_pdf_message_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderPdfType.php:109:                    new Assert\Length(['max' => $config['eccube_order_pdf_message_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderPdfType.php:117:                    new Assert\Length(['max' => $config['eccube_order_pdf_message_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderPdfType.php:124:                'attr' => ['maxlength' => $config['eccube_stext_len']],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderPdfType.php:126:                    new Assert\Length(['max' => $config['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderPdfType.php:131:                'attr' => ['maxlength' => $config['eccube_stext_len']],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderPdfType.php:133:                    new Assert\Length(['max' => $config['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderPdfType.php:138:                'attr' => ['maxlength' => $config['eccube_stext_len']],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderPdfType.php:140:                    new Assert\Length(['max' => $config['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Stock/InventoryPlanType.php:63:                    new Assert\Length(['max' => self::NAME_MAX_LENGTH]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Stock/InventoryPlanType.php:71:                    new Assert\Length(['max' => self::MEMO_MAX_LENGTH]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AuthorityRoleType.php:27:use Symfony\Component\Validator\Constraints\Regex;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/AuthorityRoleType.php:53:                    new Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MainEditType.php:57:                'attr' => ['maxlength' => $this->eccubeConfig['eccube_stext_len']],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MainEditType.php:60:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MainEditType.php:61:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MainEditType.php:67:                'attr' => ['maxlength' => $this->eccubeConfig['eccube_stext_len']],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MainEditType.php:70:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MainEditType.php:71:                    new Assert\Regex(['pattern' => '/^([0-9a-zA-Z_\-]+\/?)+(?<!\/)$/']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MainEditType.php:76:                'attr' => ['maxlength' => $this->eccubeConfig['eccube_stext_len']],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MainEditType.php:79:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MainEditType.php:80:                    new Assert\Regex(['pattern' => '/^([0-9a-zA-Z_\-]+\/?)+$/']),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MainEditType.php:94:                'attr' => ['maxlength' => $this->eccubeConfig['eccube_stext_len']],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MainEditType.php:96:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MainEditType.php:97:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MainEditType.php:103:                'attr' => ['maxlength' => $this->eccubeConfig['eccube_stext_len']],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MainEditType.php:105:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MainEditType.php:106:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MainEditType.php:112:                'attr' => ['maxlength' => $this->eccubeConfig['eccube_stext_len']],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MainEditType.php:114:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MainEditType.php:115:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MainEditType.php:121:                'attr' => ['maxlength' => $this->eccubeConfig['eccube_stext_len']],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MainEditType.php:123:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MainEditType.php:124:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MainEditType.php:130:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeckBulkUpdateType.php:70:                    new Assert\Length(['max' => 255]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeckBulkUpdateType.php:76:                    new Assert\Length(['max' => 255]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeckBulkUpdateType.php:93:                    new Assert\Length(['max' => 32]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeckBulkUpdateType.php:99:                    new Assert\Length(['max' => 64]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeckBulkUpdateType.php:112:                    new Assert\Length(['max' => 255]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeckType.php:44:                    new Assert\Length(['max' => 255]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeckType.php:97:                    new Assert\Length(['max' => 64]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeckType.php:107:                    new Assert\Length(['max' => 255]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeckType.php:114:                    new Assert\Length(['max' => 255]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeckType.php:140:                    new Assert\Length(['max' => 32]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/DeckType.php:146:                    new Assert\Length(['max' => 2048]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Stock/InventoryPlanDetailType.php:47:                    new Assert\Length(['max' => self::MEMO_MAX_LENGTH]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Stock/InventoryPlanDetailType.php:60:                new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/BankAccountType.php:65:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/BankAccountType.php:77:                    new Assert\Length(['max' => 128]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/BuyMainCardType.php:64:                    new Assert\Length(['max' => $buyPriceMaxLen]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/BuyMainCardType.php:65:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/BuyMainCardType.php:76:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerType.php:74:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerType.php:75:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerType.php:98:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerType.php:139:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerType.php:157:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerType.php:171:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerType.php:172:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/QualifiedInvoiceIssuerAccountType.php:83:            new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/QualifiedInvoiceIssuerAccountType.php:87:            new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseDetailType.php:58:            new Assert\Length(['max' => $buyPriceMaxLen]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseDetailType.php:59:            new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/BlockType.php:56:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/BlockType.php:57:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/BlockType.php:65:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/BlockType.php:66:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/BlockType.php:68:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/BlockType.php:71:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchArchetypeType.php:44:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockApprovalHistoryReasonType.php:24:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockApprovalHistoryReasonType.php:56:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/BuyMainBulkCardType.php:58:                    new Assert\Length(['max' => $buyPriceMaxLen]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/BuyMainBulkCardType.php:59:                    new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TagType.php:26:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TagType.php:66:                    new Length(['max' => $lengthSettings['name']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TagType.php:74:                    new Length(['max' => $lengthSettings['name']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TagType.php:116:                    new Length(['max' => $lengthSettings['title']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TagType.php:123:                    new Length(['max' => $lengthSettings['title']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TagType.php:133:                    new Length(['max' => $lengthSettings['description']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/TagType.php:143:                    new Length(['max' => $lengthSettings['description']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockChangeType.php:35:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockChangeType.php:122:                    new Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassEditType.php:77:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassEditType.php:78:                        'max' => $this->eccubeConfig['eccube_stext_len'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassEditType.php:199:                new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassEditType.php:213:                new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassEditType.php:219:                new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassEditType.php:236:                new Assert\Regex([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Purchase/PurchaseListType.php:126:                    new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductDepartmentType.php:44:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductDepartmentType.php:57:                    new Assert\Length([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockHistoryType.php:48:use Symfony\Component\Validator\Constraints\Length;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockHistoryType.php:200:                    new Length(['max' => $this->eccubeConfig['eccube_price_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockHistoryType.php:207:                    new Length(['max' => $this->eccubeConfig['eccube_price_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockHistoryType.php:214:                    new Length(['max' => $this->eccubeConfig['eccube_price_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockHistoryType.php:221:                    new Length(['max' => $this->eccubeConfig['eccube_price_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockHistoryType.php:260:                    new Length(['max' => $this->eccubeConfig['eccube_price_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockHistoryType.php:267:                    new Length(['max' => $this->eccubeConfig['eccube_price_len']]),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockHistoryType.php:478:                    new Length([

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/vendor/symfony/validator/Constraints/RegexValidator.php | sed -n '1,80p'; nl -ba /home/y-saito/Developments/ec-cube-enterprise/vendor/symfony/validator/Constraints/LengthValidator.php | sed -n '1,70p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<?php
     2	
     3	/*
     4	 * This file is part of the Symfony package.
     5	 *
     6	 * (c) Fabien Potencier <fabien@symfony.com>
     7	 *
     8	 * For the full copyright and license information, please view the LICENSE
     9	 * file that was distributed with this source code.
    10	 */
    11	
    12	namespace Symfony\Component\Validator\Constraints;
    13	
    14	use Symfony\Component\Validator\Constraint;
    15	use Symfony\Component\Validator\ConstraintValidator;
    16	use Symfony\Component\Validator\Exception\UnexpectedTypeException;
    17	use Symfony\Component\Validator\Exception\UnexpectedValueException;
    18	
    19	/**
    20	 * Validates whether a value match or not given regexp pattern.
    21	 *
    22	 * @author Bernhard Schussek <bschussek@gmail.com>
    23	 * @author Joseph Bielawski <stloyd@gmail.com>
    24	 */
    25	class RegexValidator extends ConstraintValidator
    26	{
    27	    public function validate(mixed $value, Constraint $constraint): void
    28	    {
    29	        if (!$constraint instanceof Regex) {
    30	            throw new UnexpectedTypeException($constraint, Regex::class);
    31	        }
    32	
    33	        if (null === $value || '' === $value) {
    34	            return;
    35	        }
    36	
    37	        if (!\is_scalar($value) && !$value instanceof \Stringable) {
    38	            throw new UnexpectedValueException($value, 'string');
    39	        }
    40	
    41	        $value = (string) $value;
    42	
    43	        if (null !== $constraint->normalizer) {
    44	            $value = ($constraint->normalizer)($value);
    45	        }
    46	
    47	        if ($constraint->match xor preg_match($constraint->pattern, $value)) {
    48	            $this->context->buildViolation($constraint->message)
    49	                ->setParameter('{{ value }}', $this->formatValue($value))
    50	                ->setParameter('{{ pattern }}', $constraint->pattern)
    51	                ->setCode(Regex::REGEX_FAILED_ERROR)
    52	                ->addViolation();
    53	        }
    54	    }
    55	}
     1	<?php
     2	
     3	/*
     4	 * This file is part of the Symfony package.
     5	 *
     6	 * (c) Fabien Potencier <fabien@symfony.com>
     7	 *
     8	 * For the full copyright and license information, please view the LICENSE
     9	 * file that was distributed with this source code.
    10	 */
    11	
    12	namespace Symfony\Component\Validator\Constraints;
    13	
    14	use Symfony\Component\Validator\Constraint;
    15	use Symfony\Component\Validator\ConstraintValidator;
    16	use Symfony\Component\Validator\Exception\UnexpectedTypeException;
    17	use Symfony\Component\Validator\Exception\UnexpectedValueException;
    18	
    19	/**
    20	 * @author Bernhard Schussek <bschussek@gmail.com>
    21	 */
    22	class LengthValidator extends ConstraintValidator
    23	{
    24	    public function validate(mixed $value, Constraint $constraint): void
    25	    {
    26	        if (!$constraint instanceof Length) {
    27	            throw new UnexpectedTypeException($constraint, Length::class);
    28	        }
    29	
    30	        if (null === $value) {
    31	            return;
    32	        }
    33	
    34	        if (!\is_scalar($value) && !$value instanceof \Stringable) {
    35	            throw new UnexpectedValueException($value, 'string');
    36	        }
    37	
    38	        $stringValue = (string) $value;
    39	
    40	        if (null !== $constraint->normalizer) {
    41	            $stringValue = ($constraint->normalizer)($stringValue);
    42	        }
    43	
    44	        try {
    45	            $invalidCharset = !@mb_check_encoding($stringValue, $constraint->charset);
    46	        } catch (\ValueError $e) {
    47	            if (!str_starts_with($e->getMessage(), 'mb_check_encoding(): Argument #2 ($encoding) must be a valid encoding')) {
    48	                throw $e;
    49	            }
    50	
    51	            $invalidCharset = true;
    52	        }
    53	
    54	        $length = $invalidCharset ? 0 : match ($constraint->countUnit) {
    55	            Length::COUNT_BYTES => \strlen($stringValue),
    56	            Length::COUNT_CODEPOINTS => mb_strlen($stringValue, $constraint->charset),
    57	            Length::COUNT_GRAPHEMES => grapheme_strlen($stringValue),
    58	        };
    59	
    60	        if ($invalidCharset || false === ($length ?? false)) {
    61	            $this->context->buildViolation($constraint->charsetMessage)
    62	                ->setParameter('{{ value }}', $this->formatValue($stringValue))
    63	                ->setParameter('{{ charset }}', $constraint->charset)
    64	                ->setInvalidValue($value)
    65	                ->setCode(Length::INVALID_CHARACTERS_ERROR)
    66	                ->addViolation();
    67	
    68	            return;
    69	        }
    70	

codex
設計RefのMarkdown行155とHTML行264は一致しており、候補の引用自体は存在します。実装側もコントローラの該当行は存在し、SymfonyのRegexが空文字をスキップする点まで確認できています。見落とし確認として、設計の主要節を実装に対して追加で突き合わせます。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php | sed -n '108,122p'; nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php | sed -n '660,680p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "rg -n \"class ShippingType|tracking_number\" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/Order -g '*.php'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
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
   660	        }
   661	
   662	        /**
   663	         * Set trackingNumber
   664	         */
   665	        public function setTrackingNumber(?string $trackingNumber): Shipping
   666	        {
   667	            $this->tracking_number = $trackingNumber;
   668	
   669	            return $this;
   670	        }
   671	
   672	        /**
   673	         * Get trackingNumber
   674	         */
   675	        public function getTrackingNumber(): ?string
   676	        {
   677	            return $this->tracking_number;
   678	        }
   679	
   680	        /**

 exited 1 in 0ms:
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig | sed -n '190,290p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   190	            });
   191	
   192	            // 送り状CSV出力
   193	            $('#labelsExport').on('click', function(event) {
   194	                if (preventIfNoCheckedBulkTarget()) {
   195	                    event.preventDefault();
   196	                    return false;
   197	                }
   198	                $('#form_bulk').attr('action', "{{ url('admin_labels_export') }}");
   199	                $('#form_bulk').submit();
   200	                return false;
   201	            });
   202	
   203	            // 送り状番号
   204	            var updateTrackingNumber = function(id, url, tracking_number, callback) {
   205	                $.ajax({
   206	                    type: 'PUT',
   207	                    url: url,
   208	                    data: {'tracking_number': tracking_number}
   209	                }).done(function(data, textStatus, jqXHR) {
   210	                    if (data['status'] == 'OK') {
   211	                        $('#tracking_number_' + id).val(data['tracking_number']);
   212	                        if (typeof callback == 'function') {
   213	                            callback();
   214	                        }
   215	                    } else {
   216	                        alert('Update failed.');
   217	                    }
   218	                    return true;
   219	                }).fail(function(jqXHR, textStatus, errorThrown) {
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
   246	                var $tracking_number = $(this);
   247	                var $button = $("button[data-target='#" + $tracking_number.attr('id') + "']");
   248	                $button.prop('disabled', false);
   249	                $button.children('i')
   250	                    .removeClass('text-secondary')
   251	                    .addClass('text-success');
   252	            });
   253	            // enter キーで更新し、次のフォームへフォーカスを移動する
   254	            $('input.update_tracking_number').on('keypress', function(event) {
   255	                var $tracking_number = $(this);
   256	                var $button = $("button[data-target='#" + $tracking_number.attr('id') + "']");
   257	
   258	                var code = event.which ? event.which : event.keyCode;
   259	
   260	                if (code == 13) { // on press to enter
   261	                    var index = $('input.update_tracking_number').index(this);
   262	                    var callback = function() {
   263	                        $button.prop('disabled', true);
   264	                        $button.children('i')
   265	                            .removeClass('text-success')
   266	                            .addClass('text-secondary');
   267	                        $('input.update_tracking_number:gt(' + index + '):first').focus();
   268	                    };
   269	                    updateTrackingNumber($tracking_number.data('shipping_id'), $tracking_number.data('url'), $tracking_number.val(), callback);
   270	                    event.preventDefault();
   271	                }
   272	            });
   273	            // 更新ボタンの制御
   274	            $('button.update_tracking_number').on('click', function(event) {
   275	                event.preventDefault();
   276	                var $button = $(this);
   277	                var $target = $($(this).data('target'));
   278	                var tracking_number = $target.val();
   279	                var callback = function() {
   280	                    $button.prop('disabled', true);
   281	                    $button.children('i')
   282	                        .removeClass('text-success')
   283	                        .addClass('text-secondary');
   284	                };
   285	        updateTrackingNumber($target.data('shipping_id'), $target.data('url'), tracking_number, callback);
   286	    });
   287	
   288	    // 完了ボタン
   289	    $('#bulkChangeComplete').on('click', function() {
   290	        location.href = '{{ url('admin_order', { 'resume': 1 }) }}';

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig | sed -n '1758,1772p'; nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig | sed -n '444,456p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
  1758	                                                <label class="col-3 col-form-label"><i class="fa fa-clock-o fa-fw me-1" aria-hidden="true"></i>{{ '変更後お届け時間'|trans }}</label>
  1759	                                                <div class="col">
  1760	                                                    {{ form_widget(form.Shipping.DeliveryTime) }}
  1761	                                                    {{ form_errors(form.Shipping.DeliveryTime) }}
  1762	                                                </div>
  1763	                                            </div>
  1764	                                            <div class="row mb-3">
  1765	                                                <label class="col-3 col-form-label" data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'tooltip.order.shipping_info.tracking_number'|trans }}">{{ 'admin.order.tracking_number'|trans }}<i class="fa fa-question-circle fa-lg ms-1"></i></label>
  1766	                                                <div class="col">
  1767	                                                    {{ form_widget(form.Shipping.tracking_number) }}
  1768	                                                    {{ form_errors(form.Shipping.tracking_number) }}
  1769	                                                </div>
  1770	                                            </div>
  1771	                                        </div>
  1772	                                    </div>
   444	                                    </div>
   445	                                    <div class="row">
   446	                                        <div class="col-6">
   447	                                            <div class="row mb-3">
   448	                                                <label class="col-3 col-form-label">
   449	                                                    {{ 'admin.order.tracking_number'|trans }}
   450	                                                </label>
   451	                                                <div class="col">
   452	                                                    {{ form_widget(shippingForm.tracking_number) }}
   453	                                                    {{ form_errors(shippingForm.tracking_number) }}
   454	                                                </div>
   455	                                            </div>
   456	                                            <div class="row mb-3">

codex
受注編集テンプレートと一覧JSは設計どおり存在します。一方でフォーム型の場所が想定パスでは出なかったため、`tracking_number`を定義しているFormクラスを全体検索で特定します。
exec
/bin/bash -lc 'rg -n "編集系UI|TODO|update_tracking_number|tracking_number" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
204:            var updateTrackingNumber = function(id, url, tracking_number, callback) {
208:                    data: {'tracking_number': tracking_number}
211:                        $('#tracking_number_' + id).val(data['tracking_number']);
243:            $('button.update_tracking_number').prop('disabled', true);
245:            $('input.update_tracking_number').on('keyup', function(event) {
246:                var $tracking_number = $(this);
247:                var $button = $("button[data-target='#" + $tracking_number.attr('id') + "']");
254:            $('input.update_tracking_number').on('keypress', function(event) {
255:                var $tracking_number = $(this);
256:                var $button = $("button[data-target='#" + $tracking_number.attr('id') + "']");
261:                    var index = $('input.update_tracking_number').index(this);
267:                        $('input.update_tracking_number:gt(' + index + '):first').focus();
269:                    updateTrackingNumber($tracking_number.data('shipping_id'), $tracking_number.data('url'), $tracking_number.val(), callback);
274:            $('button.update_tracking_number').on('click', function(event) {
278:                var tracking_number = $target.val();
285:        updateTrackingNumber($target.data('shipping_id'), $target.data('url'), tracking_number, callback);
940:                    {# TODO 1項目1行になるのを改善 #}
1264:                                                    <!-- TODO: アラート + ポイントエラーの場合、スタイル変更 -->
1293:                                                <!-- TODO: 編集系UIは各機能実装時に調整する -->

exec
/bin/bash -lc "rg -n \"update_tracking_number|tracking_number_\\{|tracking_number_\" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
211:                        $('#tracking_number_' + id).val(data['tracking_number']);
243:            $('button.update_tracking_number').prop('disabled', true);
245:            $('input.update_tracking_number').on('keyup', function(event) {
254:            $('input.update_tracking_number').on('keypress', function(event) {
261:                    var index = $('input.update_tracking_number').index(this);
267:                        $('input.update_tracking_number:gt(' + index + '):first').focus();
274:            $('button.update_tracking_number').on('click', function(event) {

exec
/bin/bash -lc 'rg -n "tracking_number" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Extension' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:185:            ->add('tracking_number', TextType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/SearchOrderType.php:186:                'label' => 'admin.order.tracking_number',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php:197:            ->add('tracking_number', TextType::class, [

exec
/bin/bash -lc 'rg -n "eccube_stext_len:|eccube_mtext_len:" /home/y-saito/Developments/ec-cube-enterprise/app /home/y-saito/Developments/ec-cube-enterprise/src /home/y-saito/Developments/ec-cube-enterprise/config' in /home/y-saito/Developments/hareruya-design-docs
 exited 2 in 0ms:
rg: /home/y-saito/Developments/ec-cube-enterprise/config: No such file or directory (os error 2)
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:110:    eccube_mtext_len: 200
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:129:    eccube_stext_len: 255

codex
フォーム定義は `Admin/ShippingType.php` にありました。最大長・文字種・requiredの扱いを確認し、候補にない差分があるかを最後に絞り込みます。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ShippingType.php | sed -n '1,230p'" in /home/y-saito/Developments/hareruya-design-docs
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

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig | sed -n '1284,1302p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
  1284	                                                </td>
  1285	
  1286	                                                <td class="align-middle text-center">
  1287	                                                    <span class="badge badge-ec-blue" style="background-color: #fff; color: {{ Order.OrderStatusColor }}; border-color: {{ Order.OrderStatusColor }}">{{ Order.OrderStatus }}</span>
  1288	                                                </td>
  1289	                                                <td class="align-middle text-center">
  1290	                                                    {{ Shipping.BaseInfo.shop_name }}
  1291	                                                </td>
  1292	
  1293	                                                <!-- TODO: 編集系UIは各機能実装時に調整する -->
  1294	                                                <td class="align-middle pe-3">
  1295	                                                    <div class="text-end">
  1296	                                                        <div class="px-1 d-inline-block">
  1297	                                                            <a class="btn btn-ec-actionIcon confirmationModal"
  1298	                                                               data-type="mail" data-bulk-update="false"
  1299	                                                               data-preview-notify-mail-url="{{ url('admin_shipping_preview_notify_mail', { id: Shipping.id}) }}"
  1300	                                                               data-notify-mail-url="{{ url('admin_shipping_notify_mail', { id: Shipping.id}) }}"
  1301	                                                               data-bs-toggle="tooltip" data-bs-placement="top" title="{{ 'admin.order.shipping_mail_send'|trans }}">
  1302	                                                                <i class="fa fa-send fa-lg text-secondary" aria-hidden="true"></i>

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube.yaml | sed -n '104,132p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   104	    eccube_category_nest_level: 5
   105	    eccube_lltext_len: 99999
   106	    eccube_ltext_len: 3000
   107	    eccube_sell_group_memo_len: 4000
   108	    eccube_max_total_fee: 9999999999
   109	    eccube_mltext_len: 1000
   110	    eccube_mtext_len: 200
   111	    plugin_html_realdir: '%eccube_html_dir%/plugin/'
   112	    plugin_html_urlpath: /plugin/ # asset 使う
   113	    plugin_realdir: '%kernel.project_dir%/app/Plugin'
   114	    plugin_data_realdir: '%kernel.project_dir%/app/PluginData'
   115	    plugin_temp_realdir: /PATH/TO/WEB_ROOT/src/Eccube/Repository/Master/upload/temp_plugin/ # upload_tmp_dir に任せればよい？
   116	    eccube_capacity_min: 1
   117	    eccube_capacity_max: 8
   118	    eccube_price_len: 8                                                    # 最大値で制御したい
   119	    eccube_product_class_sell_price_max_len: 10
   120	    eccube_product_class_buy_price_max_len: 9
   121	    eccube_product_class_sale_limit_max_len: 10
   122	    eccube_product_stock_change_reason_max_len: 16384 # 65535byte制限を4バイト文字の文字数制限で指定
   123	    eccube_product_stock_change_quantity_min: -99999999
   124	    eccube_product_stock_change_quantity_max: 99999999
   125	    eccube_product_stock_purchase_price_min: 0
   126	    eccube_product_stock_purchase_price_max: 999999999
   127	    eccube_search_pmax: 12
   128	    eccube_sitemap_products_per_page: 1000
   129	    eccube_stext_len: 255
   130	    eccube_sltext_len: 500
   131	    eccube_smtext_len: 100
   132	    eccube_tax_rule_priority: ['product_id','product_class_id','pref_id','country_id']

exec
/bin/bash -lc 'rg -n "admin.order.tracking_number_error|form_error.graph_and_hyphen_only" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource /home/y-saito/Developments/ec-cube-enterprise/app' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2283:admin.order.tracking_number_error: Only Roman alphabets, numbers and hyphens are accepted for tracking numbers.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/validators.ja.yaml:41:form_error.graph_and_hyphen_only: 半角英数字かハイフンのみを入力してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/validators.en.yaml:36:form_error.graph_and_hyphen_only: Entry must be alphanumeric characters or hyphens.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2486:admin.order.tracking_number_error: 送り状No.は半角英数字かハイフンのみを入力してください。

codex
候補finding（空文字が非同期保存で消去として成立する件）は確認済みで、誤検知ではありません。設計RefもMarkdown/HTML双方で実在し、実装Refも妥当です。重要度 `med` も、管理画面内で既存送り状No.を空にできる業務影響として概ね妥当です。

種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応
---|---|---|---|---
MISSED | エラー処理/フロント失敗応答 | 設計はHTTPエラー応答時に `messages` 配列を改行連結してアラート表示するとするが、実装のXHR/CSRF不正400と保存例外500は `messages` を返さない。JS側は常に `response.messages.length` を参照するため、この経路では設計どおりのアラート表示にならない可能性がある。 | [m05-13_admin_order_order_tracking_number.html](/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m05-13_admin_order_order_tracking_number.html:242), [OrderController.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:568), [OrderController.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:605), [index.twig](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:219) | findingsに追加。実装を直すなら400/500でも `messages` を返すか、JS側で `messages` 不在時のフォールバック表示を行う。

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正
tokens used
63,186
候補finding（空文字が非同期保存で消去として成立する件）は確認済みで、誤検知ではありません。設計RefもMarkdown/HTML双方で実在し、実装Refも妥当です。重要度 `med` も、管理画面内で既存送り状No.を空にできる業務影響として概ね妥当です。

種別 | 対象dimension | 指摘 | 根拠file:line | 推奨対応
---|---|---|---|---
MISSED | エラー処理/フロント失敗応答 | 設計はHTTPエラー応答時に `messages` 配列を改行連結してアラート表示するとするが、実装のXHR/CSRF不正400と保存例外500は `messages` を返さない。JS側は常に `response.messages.length` を参照するため、この経路では設計どおりのアラート表示にならない可能性がある。 | [m05-13_admin_order_order_tracking_number.html](/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/ec-cube-enterprise/m05-13_admin_order_order_tracking_number.html:242), [OrderController.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:568), [OrderController.php](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:605), [index.twig](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:219) | findingsに追加。実装を直すなら400/500でも `messages` を返すか、JS側で `messages` 不在時のフォールバック表示を行う。

VERDICT: false_positive=0, missed=1, weak_evidence=0, 総合=要修正

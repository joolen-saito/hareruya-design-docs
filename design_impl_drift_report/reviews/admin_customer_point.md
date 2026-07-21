OpenAI Codex v0.142.5
--------
workdir: /home/y-saito/Developments/hareruya-design-docs
model: gpt-5.5
provider: openai
approval: never
sandbox: read-only
reasoning effort: medium
reasoning summaries: none
session id: 019f26a7-f3af-7191-bfa8-fbe0f479b0fd
--------
user
あなたは設計書vs実装の差分監査に対する**批判的レビュア**です。読み取り専用で検証してください。創作禁止・確認できないものは「確認不能」と明記。

## 対象機能: admin_customer_point
- 差分候補JSON(検証対象): /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/admin_customer_point.json
- 設計書HTML(正): /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/admin_customer_point.html
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
読み取り専用で、候補JSON・設計HTML・実装参照を実ファイルで確認します。まず対象ファイルと関連実装の所在を把握します。
exec
/bin/bash -lc "sed -n '1,240p' /tmp/claude-1000/-home-y-saito-Developments/13b9542a-bdfa-4d4b-af54-a3d10ddcfc17/scratchpad/findings/admin_customer_point.json" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
{
  "functionId": "admin_customer_point",
  "title": "会員管理 — ポイント付与・ポイント履歴",
  "domain": "admin_customer",
  "kind": "admin",
  "designHtml": "function_spec_html_preview/pf-eccube3/admin_customer_point.html",
  "findings": [
    {
      "dimension": "⑦エラー処理・試行制限",
      "severity": "high",
      "designRef": "function_spec_html_preview/pf-eccube3/admin_customer_point.html:245",
      "designQuote": "会員・選手情報を取得する。いずれも無い場合はページが見つからない扱い（404）とする。",
      "implRef": "src/Eccube/Controller/Admin/Customer/CustomerPointController.php:88",
      "difference": "設計は会員・選手情報のいずれかが無い場合404と規定。実装はCustomerはMapEntityで404になるが、Playerは付与時に $Customer->getPlayer()->addPoint(...) を無チェックで呼び、GET表示テンプレートも Customer.Player.point を参照する。getPlayer() は ?DtbPlayer で null を返し得る(Customer.php:1145, OneToOneは nullable $Player=null: Customer.php:1015)。Playerがnullの場合は404ではなくnullメソッド呼び出しの致命的エラー(500)となり、設計の404扱いと異なる。",
      "confidence": "med",
      "verdict": "CONFIRMED",
      "evidence": "Customer.php:1015 (`private ?DtbPlayer $Player = null`), Customer.php:1145 (`getPlayer(): ?DtbPlayer`), CustomerPointController.php:88 (`$Customer->getPlayer()->addPoint(...)` 無ガード), point_update.twig:105 (`Customer.Player.point`)。Customerのみ404、Playerのnullガードは存在しない。"
    },
    {
      "dimension": "②業務ルール・計算",
      "severity": "high",
      "designRef": "function_spec_html_preview/pf-eccube3/admin_customer_point.html:264",
      "designQuote": "選手情報（dtb_player）| point（保有ポイント）| 付与対象の会員に紐づく。",
      "implRef": "src/Eccube/Form/Type/Admin/CustomerPointType.php:131",
      "difference": "付与の保有ポイント更新は Player.point に対して行う($Customer->getPlayer()->addPoint(), Controller:88)一方、フォームの残高マイナス検証は Customer.getPoint()(=dtb_customer.point, getPoint は $this->point を返す Customer.php:892)を参照している。更新先(Player.point)と検証読取先(Customer.point)が別列のため、両者が乖離しているとPlayer残高がマイナスになる付与を通す/正当な付与を弾く可能性がある。設計DBカラムが付与対象保有ポイントをdtb_player.pointとする点と、検証がdtb_customer.pointを見る実装が不整合。",
      "confidence": "med",
      "verdict": "CONFIRMED",
      "evidence": "CustomerPointController.php:88 (更新: Player.point), CustomerPointType.php:131 (`$Customer->getPoint() + $pointChange < 0` で検証), Customer.php:892 (`getPoint()` は dtb_customer.point の $this->point を返す)。更新列と検証読取列が別。"
    },
    {
      "dimension": "④DBカラム・DB操作・テーブル",
      "severity": "med",
      "designRef": "function_spec_html_preview/pf-eccube3/admin_customer_point.html:248",
      "designQuote": "種別ごとの履歴 | ポイント種別ごとにポイント履歴を表示する。",
      "implRef": "src/Eccube/Resource/template/admin/Customer/point_update.twig:123",
      "difference": "設計はポイント種別ごとに履歴を絞って表示する。実装テンプレートは {% for PointHistory in Customer.PointHistories %} で当該会員の全履歴を種別無関係に列挙し、point_type_id({type})によるフィルタが無い。コントローラも Customer をそのまま渡すのみで絞り込みしない(Controller:112-118)。Customer.PointHistories の OneToMany(Customer.php:1330) にも種別のWHERE絞り込みは無い(なお並び順は #[ORM\\OrderBy(['id'=>DESC])] が付与済み Customer.php:1331)。結果として種別別表示になっていない。",
      "confidence": "med",
      "verdict": "CONFIRMED",
      "evidence": "point_update.twig:123 (全 Customer.PointHistories を列挙), CustomerPointController.php:112-118 (Customer をそのまま渡すのみ), Customer.php:1330 (OneToMany に type 絞り込み無し)。※差分候補が主張した『OrderBy無し』は誤りで、1331行に OrderBy id DESC が存在するため『種別フィルタ欠如』のみが有効。"
    },
    {
      "dimension": "③バリデーション",
      "severity": "med",
      "designRef": "function_spec_html_preview/pf-eccube3/admin_customer_point.html:250",
      "designQuote": "備考 | 任意 | ... | ポイント履歴の備考。",
      "implRef": "src/Eccube/Form/Type/Admin/CustomerPointType.php:85",
      "difference": "設計は備考を『任意』の自由入力としている。実装のnoteは ChoiceType(line85) の固定選択肢(granted: キャンペーン/特別対応、その他: 余剰入金へのご返金/注文金額変更によるご返金 line37-45,59)で自由入力不可、かつ required=true + NotBlank(必須, line87,91-93)。テンプレートでも必須バッジ付き(point_update.twig:70)。必須/任意および入力形式が設計と異なる。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "CustomerPointType.php:85-93 (ChoiceType, required=true, NotBlank), :37-45,59 (固定選択肢), point_update.twig:70 (必須バッジ)。"
    },
    {
      "dimension": "③バリデーション",
      "severity": "med",
      "designRef": "function_spec_html_preview/pf-eccube3/admin_customer_point.html:250",
      "designQuote": "ポイント変動 | 必須 ... 備考 | 任意",
      "implRef": "src/Eccube/Form/Type/Admin/CustomerPointType.php:95",
      "difference": "設計の入力項目はポイント変動・備考の2項目のみ。実装は付与日 issueDate を必須入力(required=true + NotBlank + Range最小1900-01-01, line95-107)として追加している。テンプレートも必須バッジ付きで表示(point_update.twig:58-63)。設計はissue_dateをDB列(付与日)として扱い入力項目に挙げていないため、設計に無い必須入力の追加。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "CustomerPointType.php:95-113 (issueDate DateType, required=true, NotBlank, Range), point_update.twig:56-65 (必須入力表示)。"
    },
    {
      "dimension": "③バリデーション",
      "severity": "med",
      "designRef": "function_spec_html_preview/pf-eccube3/admin_customer_point.html:250",
      "designQuote": "ポイント変動 | 必須 ... 備考 | 任意",
      "implRef": "src/Eccube/Form/Type/Admin/CustomerPointType.php:62",
      "difference": "実装は orderNumber(注文番号)を任意入力(mapped=false, 8桁数字Regex line62-72, 会員の注文に存在するか hasOrderNumber 検証 line123-128)として受け付け、付与時に該当注文を履歴へ紐付ける(Controller:80-83)。設計の入力項目には注文番号が無く、注文番号は『履歴に関連する注文番号を取得して表示する』(line248)表示用の扱いのみ。設計に無い入力項目の追加。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "CustomerPointType.php:62-73 (orderNumber TextType, mapped=false, Regex \\d{8}), :123-128 (hasOrderNumber 検証), CustomerPointController.php:80-83 (getOrderByOrderNumber で履歴に紐付け), point_update.twig:37-42 (入力欄)。"
    },
    {
      "dimension": "②業務ルール・計算",
      "severity": "med",
      "designRef": "function_spec_html_preview/pf-eccube3/admin_customer_point.html:250",
      "designQuote": "ポイント変動 | 必須 | 実装確認値 | 空 | ポイント履歴のポイント変動。",
      "implRef": "src/Eccube/Form/Type/Admin/CustomerPointType.php:131",
      "difference": "実装は付与後残高がマイナスになる場合にエラーとする検証(Customer.getPoint()+pointChange<0, line131-133)を持つ。設計の業務ルール・バリデーションにこの残高マイナス禁止ルールの記載が無く、設計に無い追加検証。",
      "confidence": "med",
      "verdict": "CONFIRMED",
      "evidence": "CustomerPointType.php:130-133 (POST_SUBMIT で `$Customer->getPoint() + $pointChange < 0` なら FormError)。設計HTMLの業務ルール/バリデーション節に該当記載なし。"
    },
    {
      "dimension": "①ルート/HTTPメソッド",
      "severity": "med",
      "designRef": "function_spec_html_preview/pf-eccube3/admin_customer_point.html:235",
      "designQuote": "POST /{admin_route}/customer/point/{id}/update/{type}",
      "implRef": "src/Eccube/Controller/Admin/Customer/CustomerPointController.php:54",
      "difference": "設計は付与のPOSTパスを /customer/point/{id}/update/{type} と規定。実装のPOSTルートは /customer/point/{id}/{type}(name: admin_customer_point_update, line54)で『/update/』セグメントが無い。パス構造が設計と異なる(ただしルート名 admin_customer_point_update とテンプレの url() 参照は一致 point_update.twig:18)。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "CustomerPointController.php:54 (`#[Route('/%eccube_admin_route%/customer/point/{id}/{type}', name: 'admin_customer_point_update', ... methods: ['POST'])]`) に /update/ 無し。設計HTML:235 は /update/{type}。"
    },
    {
      "dimension": "⑧バッチ/API入出力・再実行性",
      "severity": "med",
      "designRef": "function_spec_html_preview/pf-eccube3/admin_customer_point.html:224",
      "designQuote": "スマレジポイント連携（ポイント連携バッチを正とする）",
      "implRef": "src/Eccube/Controller/Admin/Customer/CustomerPointController.php:92",
      "difference": "設計は本機能でスマレジポイント連携を扱わず別仕様(ポイント連携バッチ)を正とする。実装は付与処理内でトランザクション内にスマレジ連携ジョブを積み(registerPointAddJob line92)、flush後に dispatchPointAddMessage する(line96-98)インライン連携を行う。設計に無い付随処理。",
      "confidence": "med",
      "verdict": "CONFIRMED",
      "evidence": "CustomerPointController.php:92 (registerPointAddJob), :94 (flush), :96-98 (dispatchPointAddMessage), コンストラクタ:34 で SmaregiCustomerPointEventService を注入。設計は line224 でスマレジ連携を本書対象外と明記。"
    },
    {
      "dimension": "①ルート/HTTPメソッド",
      "severity": "low",
      "designRef": "function_spec_html_preview/pf-eccube3/admin_customer_point.html:273",
      "designQuote": "種別選択画面（admin_customer_point_type_select）",
      "implRef": "src/Eccube/Controller/Admin/Customer/CustomerPointController.php:41",
      "difference": "設計の種別選択画面のルート名は admin_customer_point_type_select。実装のGET /customer/point/{id}/select のルート名は admin_customer_point_select で名称が異なる(『_type』欠落)。なお履歴画面のルート名 admin_customer_point_history は設計 line273 と一致。",
      "confidence": "high",
      "verdict": "CONFIRMED",
      "evidence": "CustomerPointController.php:41 (`name: 'admin_customer_point_select'`)。設計HTML:273 は admin_customer_point_type_select。"
    },
    {
      "dimension": "①ルート/HTTPメソッド",
      "severity": "low",
      "designRef": "function_spec_html_preview/pf-eccube3/admin_customer_point.html:235",
      "designQuote": "GET /{admin_route}/customer/point/{id}/{type}",
      "implRef": "src/Eccube/Controller/Admin/Customer/CustomerPointController.php:53",
      "difference": "設計は{type}を任意のポイント種別(種別マスタ参照 line229)として扱う。実装は type を history|granted|purchase(GET) / granted|purchase(POST) に固定列挙(requirements, line53-54)し、granted→GRANTED_TYPE, purchase→PURCHASE_TYPE と分岐(Controller:68)しており、種別マスタ由来の可変種別ではなくハードコードされた区分に限定されている。",
      "confidence": "med",
      "verdict": "CONFIRMED",
      "evidence": "CustomerPointController.php:53-54 (requirements: ['type' => 'history|granted|purchase'] / 'granted|purchase'), :68 (三項で GRANTED_TYPE / PURCHASE_TYPE に固定マッピング)。設計HTML:229 は種別マスタ参照。"
    }
  ]
}

exec
/bin/bash -lc 'rg -n "Point|point|customer_point|admin_customer_point|顧客ポイント|ポイント" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /home/y-saito/Developments/ec-cube-enterprise/app 2>/dev/null' in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/admin_customer_point.html | sed -n '1,260p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	<!doctype html>
     2	<html lang="ja">
     3	<head>
     4	  <meta charset="utf-8">
     5	  <meta name="viewport" content="width=device-width, initial-scale=1">
     6	  <title>会員管理 — ポイント付与・ポイント履歴 - 機能仕様書</title>
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
   188	<a class="lv2" href="#フロント挙動">フロント挙動</a>
   189	<a class="lv2" href="#処理フロー">処理フロー</a>
   190	<a class="lv3" href="#ポイント履歴を表示する-GET-admin-route-customer-point-id-type">ポイント履歴を表示する（GET `/{admin_route}/customer/point/{id}/{type}`）</a>
   191	<a class="lv3" href="#ポイントを付与する-POST-admin-route-customer-point-id-update-type">ポイントを付与する（POST `/{admin_route}/customer/point/{id}/update/{type}`）</a>
   192	<a class="lv2" href="#業務ルール・計算">業務ルール・計算</a>
   193	<a class="lv3" href="#入力項目">入力項目</a>
   194	<a class="lv2" href="#データ整合性">データ整合性</a>
   195	<a class="lv2" href="#API-バッチ結果">API/バッチ結果</a>
   196	<a class="lv2" href="#入出力">入出力</a>
   197	<a class="lv2" href="#DBカラム">DBカラム</a>
   198	<a class="lv3" href="#DB操作">DB操作</a>
   199	<a class="lv2" href="#権限・認可">権限・認可</a>
   200	<a class="lv2" href="#画面遷移">画面遷移</a>
   201	<a class="lv2" href="#エラー処理">エラー処理</a>
   202	<a class="lv2" href="#ログ・監査">ログ・監査</a>
   203	<a class="lv3" href="#ログに出してはいけないもの">ログに出してはいけないもの</a>
   204	<a class="lv2" href="#排他制御・トランザクション">排他制御・トランザクション</a></nav>
   205	    </aside>
   206	    <main class="doc-content">
   207	      <header class="page-header">
   208	        <p class="crumb">Source:<br>/home/y-saito/Developments/hareruya-design-docs/functions/pf-eccube3/admin_customer_point.md</p>
   209	        <h1>会員管理 — ポイント付与・ポイント履歴</h1>
   210	      </header>
   211	      <h2 id="概要">概要</h2>
   212	<p>管理画面で、特定の会員のポイント履歴を一覧表示し、同一画面からポイントを付与（履歴の追加）する機能である。ポイント種別ごとに履歴を確認でき、付与時はポイント変動・備考等を入力して履歴を追加する。</p>
   213	<p>本書はTODOリストの「ポイント付与」（M08-05）と「ポイント履歴」（M08-06）の2機能を、同一画面で履歴閲覧と付与を行う一連の機能として1冊にまとめる。</p>
   214	<p>本書は実装手順ではなく、誰が・いつ・どの条件で・結果どうなるかを読むためのリバース詳細設計とする。確認値はpf-eccube3（EC-CUBE3系）のHareruyaEcプラグインの管理画面会員ポイント処理、ポイント履歴追加フォーム、ポイント履歴を扱うリポジトリ、テンプレート（<code>Customer/point_history.twig</code>・<code>point_type_select.twig</code>）を正とする。</p>
   215	<p>本機能（ポイント付与・ポイント履歴）のカスタマイズ区分はいずれも現行踏襲であり、挙動の確認はpf-eccube3を参照し、DB関連の記述（テーブル名・列名・保存先）はec-cube-enterpriseを正とする。</p>
   216	<p>対象はブラウザ経由の管理画面に限定する。</p>
   217	<p>本文ではフレームワークのコントローラ型名やメソッド名を主説明としない。管理画面プレフィックスは環境により変わる（<code>admin_route</code>）。「利用者視点の入口」にHTTPメソッドとサイトルートからのパスパターンを書く。</p>
   218	<hr>
   219	<h2 id="本書で扱うこと">本書で扱うこと</h2>
   220	<ul><li>ポイント種別の選択</li><li>特定会員のポイント履歴の一覧表示</li><li>ポイント付与（履歴の追加）</li></ul>
   221	<hr>
   222	<h2 id="本書で扱わないこと">本書で扱わないこと</h2>
   223	<p>以下は本書では仕様確定せず、実装または別機能の設計を正とする。</p>
   224	<ul><li>ポイント付与・利用の自動処理（受注・ポイント処理を正とする）</li><li>スマレジポイント連携（ポイント連携バッチを正とする）</li><li>会員一覧・検索の仕様（会員一覧機能を正とする）</li></ul>
   225	<hr>
   226	<h2 id="リニューアル移行時の扱い">リニューアル移行時の扱い</h2>
   227	<p>現行（pf-eccube3、HareruyaEcプラグイン）と移行先（ec-cube-enterprise）でのDB関連の差を記録する。挙動は現行を確認値とし、永続化先の名称はec-cube-enterpriseを正とする。</p>
   228	<div class="table-wrap"><table><thead><tr><th>観点</th><th>現行（pf-eccube3）</th><th>移行先（ec-cube-enterprise）</th></tr></thead><tbody><tr><td>ポイント履歴</td><td>HareruyaEcプラグインのポイント履歴に保持</td><td>ポイント履歴テーブル<code>dtb_point_history</code>（会員<code>customer_id</code>、ポイント変動<code>point_change</code>、備考<code>note</code>、ポイント種別<code>point_type_id</code>、注文参照<code>order_id</code>、付与日<code>issue_date</code>）。同名テーブルのため概ね同一スキーマだが、列名・型はec-cube-enterprise実装を正とする</td></tr><tr><td>会員の保有ポイント</td><td>選手情報の保有ポイント</td><td>選手情報<code>dtb_player.point</code>（会員側<code>dtb_customer.point</code>も保持。付与対象の保有ポイントはec-cube-enterprise実装で要確認）</td></tr></tbody></table></div>
   229	<p>ポイント種別はポイント種別マスタを参照する。</p>
   230	<hr>
   231	<h2 id="用語">用語</h2>
   232	<div class="table-wrap"><table><thead><tr><th>用語</th><th>説明</th></tr></thead><tbody><tr><td>ポイント種別</td><td>ポイントの区分。履歴の対象種別を選ぶ。</td></tr><tr><td>ポイント履歴</td><td>ポイントの増減記録。</td></tr><tr><td>付与</td><td>ポイント履歴を追加して会員のポイントを増減すること。</td></tr></tbody></table></div>
   233	<hr>
   234	<h2 id="利用者視点の入口">利用者視点の入口</h2>
   235	<div class="table-wrap"><table><thead><tr><th>入口</th><th>URLエンドポイント</th><th>期待されるふるまい</th></tr></thead><tbody><tr><td>会員のポイント操作で種別選択</td><td><code>GET /{admin_route}/customer/point/{id}/select</code></td><td>ポイント種別の選択画面を表示する。</td></tr><tr><td>ポイント履歴を開く</td><td><code>GET /{admin_route}/customer/point/{id}/{type}</code></td><td>当該会員・種別のポイント履歴一覧と付与フォームを表示する。</td></tr><tr><td>「登録」ボタン（付与）</td><td><code>POST /{admin_route}/customer/point/{id}/update/{type}</code></td><td>入力したポイント変動を履歴に追加し、ポイント履歴画面へ戻る。</td></tr></tbody></table></div>
   236	<p>管理画面プレフィックスは環境により変わるためプレースホルダで示す。</p>
   237	<hr>
   238	<h2 id="フロント挙動">フロント挙動</h2>
   239	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>表示要素</td><td>ポイント種別の選択、当該会員のポイント履歴一覧（注文番号を含む）、ポイント付与の入力フォーム。</td></tr><tr><td>JS挙動</td><td>本機能では送信中心で、動的な表示切替は主としない。</td></tr><tr><td>モーダル・ポップアップ</td><td>本機能専用のモーダルは無い。</td></tr></tbody></table></div>
   240	<hr>
   241	<h2 id="処理フロー">処理フロー</h2>
   242	<h3 id="ポイント履歴を表示する-GET-admin-route-customer-point-id-type">ポイント履歴を表示する（GET <code>/{admin_route}/customer/point/{id}/{type}</code>）</h3>
   243	<ol><li>管理画面の認証・権限を通過する。</li><li>パスの会員IDで会員を取得する。存在しない場合はページが見つからない扱い（404）とする。</li><li>ポイント付与フォームを生成する。</li><li>当該会員のポイント履歴を新しい順に取得し、各履歴の注文番号を取得する。</li><li>ポイント履歴一覧と付与フォームを表示する。</li></ol>
   244	<h3 id="ポイントを付与する-POST-admin-route-customer-point-id-update-type">ポイントを付与する（POST <code>/{admin_route}/customer/point/{id}/update/{type}</code>）</h3>
   245	<ol><li>管理画面の認証・権限を通過し、なりすまし対策トークンを検証する。</li><li>会員・選手情報を取得する。いずれも無い場合はページが見つからない扱い（404）とする。</li><li>ポイント付与フォームを検証する。検証に失敗した場合はポイント履歴画面を再表示する。</li><li>検証に成功した場合は、入力したポイント変動を履歴に追加し、ポイント履歴画面へ戻る。</li></ol>
   246	<hr>
   247	<h2 id="業務ルール・計算">業務ルール・計算</h2>
   248	<div class="table-wrap"><table><thead><tr><th>項目</th><th>内容</th></tr></thead><tbody><tr><td>種別ごとの履歴</td><td>ポイント種別ごとにポイント履歴を表示する。</td></tr><tr><td>付与</td><td>入力したポイント変動・備考でポイント履歴を追加する。</td></tr><tr><td>注文番号</td><td>履歴に関連する注文番号を取得して表示する。</td></tr></tbody></table></div>
   249	<h3 id="入力項目">入力項目</h3>
   250	<div class="table-wrap"><table><thead><tr><th>項目名</th><th>必須／任意</th><th>最大長</th><th>初期値</th><th>保存先・扱い</th></tr></thead><tbody><tr><td>ポイント変動</td><td>必須</td><td>実装確認値</td><td>空</td><td>ポイント履歴のポイント変動。付与時に履歴へ追加する。フォームキーはポイント履歴追加フォームの変動量。</td></tr><tr><td>備考</td><td>任意</td><td>実装確認値</td><td>空</td><td>ポイント履歴の備考。</td></tr></tbody></table></div>
   251	<p>ポイント種別はパスで指定する。</p>
   252	<hr>
   253	<h2 id="データ整合性">データ整合性</h2>
   254	<div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>更新単位</td><td>登録・編集・削除の対象データは、フォーム送信またはCSV取込で検証を通過した単位で更新する。保存対象と副作用は処理フロー、入出力、DBカラムの各節を正とする。</td></tr><tr><td>再表示</td><td>保存成功後はDBに確定した値を次回表示・検索・出力の基準にする。検証エラーまたは例外時に確定しない入力値は再表示画面のフォーム値に留まる。</td></tr><tr><td>同時更新</td><td>明示的な楽観ロック・悲観ロックを持たない場合、同一データを複数管理者が同時に更新すると後から保存された内容が残る。</td></tr></tbody></table></div>
   255	<hr>
   256	<h2 id="API-バッチ結果">API/バッチ結果</h2>
   257	<p>本機能ではAPI呼び出し・バッチ実行を扱わない。</p>
   258	<hr>
   259	<h2 id="入出力">入出力</h2>
   260	<div class="table-wrap"><table><thead><tr><th>種類</th><th>内容</th></tr></thead><tbody><tr><td>入力</td><td>会員ID、ポイント種別、ポイント変動・備考、なりすまし対策トークン。</td></tr><tr><td>成功時出力</td><td>ポイント履歴の追加、履歴画面への遷移。</td></tr><tr><td>失敗時出力</td><td>会員・選手情報が無い場合は404、検証失敗時は履歴画面を再表示。</td></tr><tr><td>副作用</td><td>ポイント履歴の追加。</td></tr></tbody></table></div>

 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Smaregi/WebhookController.php:38:     * スマレジ Webhook 受信エンドポイント（検証用）
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/services_e2e.yaml:23:                -   endpoint_url: '%env(S3_ENDPOINT)%'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/InvalidLocaleRedirectListener.php:76:        // ロケール不要なwell-knownエンドポイントの場合は何もしない
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/InvalidLocaleRedirectListener.php:91:        // スマレジWebhook等、ロケール不要なエンドポイントの場合は何もしない
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/services.yaml:23:    s3_endpoint: '%env(S3_ENDPOINT)%'
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/services_test.yaml:47:    Eccube\Service\PurchaseFlow\Processor\AddPointProcessor:
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/services_test.yaml:59:    Eccube\Service\PurchaseFlow\Processor\PointDiffProcessor:
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/services_test.yaml:77:    Eccube\Service\PurchaseFlow\Processor\PointRateProcessor:
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/services_test.yaml:94:                -   endpoint_url: '%env(S3_ENDPOINT)%'
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/services_dev.yaml:16:                - endpoint_url: '%env(S3_ENDPOINT)%'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiOrderGainPointMessage.php:19: * 出荷完了時の発生ポイント（付与ポイント）をスマレジ会員ポイントへ反映するための非同期メッセージ.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiOrderGainPointMessage.php:21:final readonly class SmaregiOrderGainPointMessage
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiOrderUsePointMessage.php:19: * 注文完了時の使用ポイントをスマレジ会員ポイントへ反映するための非同期メッセージ.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiOrderUsePointMessage.php:21:final readonly class SmaregiOrderUsePointMessage
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitController.php:447:     * @deprecated 分割先は Session で管理するためこのエンドポイントは使用しない
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiCustomerPointAddMessage.php:19: * 管理画面ポイント付与をスマレジ会員ポイントへ反映するための非同期メッセージ.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiCustomerPointAddMessage.php:21:final readonly class SmaregiCustomerPointAddMessage
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiCustomerPointAddMessage.php:24:        private int $pointHistoryId,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiCustomerPointAddMessage.php:29:    public function getPointHistoryId(): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Message/SmaregiCustomerPointAddMessage.php:31:        return $this->pointHistoryId;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:89:        if ($this->baseInfoRepository->get()->isOptionPoint() && $this->requestContext->getCurrentUser()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:90:            $builder->add('pointpay', ChoiceType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:101:            $builder->get('pointpay')->addEventListener(FormEvents::PRE_SET_DATA, function (FormEvent $event): void {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:110:                if (!$Order instanceof Order || !$event->getForm()->has('pointpay')) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:114:                $event->getForm()->get('pointpay')->setData(((int) ($Order->getSpendedPoints() ?? 0)) > 0 ? 1 : 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:117:            $builder->add('use_point', IntegerType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:118:                'property_path' => 'spendedPoints',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:130:            $builder->get('use_point')->addEventListener(FormEvents::POST_SET_DATA, function (FormEvent $event): void {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:135:                    $event->setData($Order instanceof Order ? $this->getDefaultUsePoint($Order) : 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:144:                if (empty($data['pointpay'])) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:145:                    $data['use_point'] = 0;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:169:                if (!$form->has('use_point') || !$form->has('pointpay')) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:173:                if (empty($form->get('pointpay')->getData())) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:177:                $usePoint = (int) ($form->get('use_point')->getData() ?? 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:178:                if ($usePoint <= 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:188:                $paymentTotalBeforePoint = $this->getPaymentTotalBeforePoint($Order);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:189:                $pointBalance = (int) ($Order->getCustomer()?->getPlayer()?->getPoint() ?? 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:191:                if ($usePoint > $paymentTotalBeforePoint) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:192:                    $form->get('use_point')->addError(new FormError(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:196:                if ($usePoint > $pointBalance) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:197:                    $form->get('use_point')->addError(new FormError(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:198:                        $this->translator->trans('purchase_flow.over_customer_point')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:402:    private function getDefaultUsePoint(Order $Order): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:404:        $pointBalance = (int) ($Order->getCustomer()?->getPlayer()?->getPoint() ?? 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:406:        return max(0, min($pointBalance, $this->getPaymentTotalBeforePoint($Order)));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Shopping/OrderType.php:409:    private function getPaymentTotalBeforePoint(Order $Order): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerUpdateMessageHandler.php:35: * （ポイント連携の point/add と異なり再実行で二重適用にならないため、適用不明の手動照合分岐は不要）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:45:use Eccube\Service\Smaregi\Webhook\Transaction\SmaregiOrderPointApplier;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:46:use Eccube\Service\Smaregi\Webhook\Transaction\SmaregiPointAdjustmentApplier;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:47:use Eccube\Service\Smaregi\Webhook\Transaction\SmaregiPointAdjustmentReverter;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:88:        private SmaregiOrderPointApplier $pointApplier,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:89:        private SmaregiPointAdjustmentApplier $pointAdjustmentApplier,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:90:        private SmaregiPointAdjustmentReverter $pointAdjustmentReverter,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:221:     * 取消(canceled)。ポイント専用取引(区分6/7)は受注が無いためポイントを差し戻し、
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:226:        if ($transaction->isCanceled() && $this->pointAdjustmentReverter->revert($transaction->transactionHeadId)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:234:     * 打消(disposed)。打消元(disposeServerTransactionHeadId)がポイント専用取引なら差し戻し、
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:239:        if ($transaction->isDisposed() && $this->pointAdjustmentReverter->revert($transaction->disposeServerTransactionHeadId)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:248:        // 取引区分6/7 (ポイント加算/減算) は商品明細を持たないポイント専用取引のため、
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:249:        // 受注作成パターンには乗せず会員ポイントのみを増減する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:250:        if ($this->pointAdjustmentApplier->supports($transaction)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:252:                $this->logger->info('Smaregi point-only transaction is canceled/disposed, skipping point apply', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:263:            $this->logger->info('Smaregi transaction is point-only (division 6/7), applying point adjustment', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:268:            $this->pointAdjustmentApplier->apply($transaction);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:293:        $pointBearingOrder = match ($pattern) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:309:        // 会員が購入した受注のポイント (付与/使用) を EC 会員残高へ反映する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:311:        if ($pointBearingOrder !== null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:312:            $this->pointApplier->apply($pointBearingOrder, $transaction);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:317:     * Pattern 1: 既存オンライン受注を引渡し済みにする。ポイント付与対象は既存オンライン受注。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:328:     * Pattern 2-7: 既存受注を引渡し済みにし新規受注を作成する。ポイント付与対象は新規受注 (戻り値の末尾)。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:346:        // 非会員はポイント対象外。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiTransactionProcessMessageHandler.php:364:            // guest fallback はポイント対象外。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260625125713.php:23: * 注文完了時の使用ポイントのスマレジ連携で必要になる、フロントのログインロール
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/test/doctrine.yaml:7:                use_savepoints: true
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/test/doctrine.yaml:9:                use_savepoints: true
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Smaregi/Api/Transaction/TransactionDto.php:35:        public readonly ?string $pointDiscount,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Smaregi/Api/Transaction/TransactionDto.php:39:        public readonly ?string $newPoint,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/Smaregi/Api/Transaction/TransactionDto.php:40:        public readonly ?string $spendPoint,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125163806.php:22: * Auto-generated Migration: Import from CSV for mtb_point_type
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125163806.php:29:        return 'mtb_point_type のマスタデータを登録';
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125163806.php:38:            $recordCount = $this->connection->fetchOne('SELECT COUNT(id) FROM mtb_point_type WHERE id = ?', [$record['id']]);
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125163806.php:44:            $this->addSql('INSERT INTO mtb_point_type (id, name) VALUES (?, ?)', [$record['id'], $record['name']]);
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125163806.php:48:        $this->addSql("SELECT setval('mtb_point_type_id_seq', COALESCE((SELECT MAX(id) FROM mtb_point_type), 0) + 1, false)");
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/test/aws.yaml:9:    use_path_style_endpoint: true
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/test/aws.yaml:10:    endpoint: "%env(S3_ENDPOINT)%"
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/test/aws.yaml:21:        use_path_style_endpoint: true
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/test/aws.yaml:22:        endpoint: '%env(S3_ENDPOINT)%'
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/test/aws.yaml:31:        use_path_style_endpoint: true
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/test/aws.yaml:32:        endpoint: "%env(S3_ENDPOINT)%"
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/messenger.yaml:30:            # 管理画面ポイント付与のスマレジ会員ポイント反映用
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/messenger.yaml:31:            Eccube\Message\SmaregiCustomerPointAddMessage: async
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/messenger.yaml:32:            # 注文完了時の使用ポイントのスマレジ会員ポイント反映用
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/messenger.yaml:33:            Eccube\Message\SmaregiOrderUsePointMessage: async
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/messenger.yaml:36:            # 出荷完了時の発生ポイントのスマレジ会員ポイント反映用
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/messenger.yaml:37:            Eccube\Message\SmaregiOrderGainPointMessage: async
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251128120606.php:44:            $this->addSql('INSERT INTO dtb_customer_group (id, name, point_percentage, shop_front_flg, update_date, create_date, member_id, branch_shop_front_flg) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [$record['id'], $record['name'], $record['point_percentage'], $record['shop_front_flg'], $record['update_date'], $record['create_date'], $record['member_id'], $record['branch_shop_front_flg']]);
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251128120606.php:66:                'point_percentage' => 1,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251128120606.php:76:                'point_percentage' => 5,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251128120606.php:86:                'point_percentage' => 0,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251128120606.php:96:                'point_percentage' => 0,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251128120606.php:106:                'point_percentage' => 0,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251128120606.php:116:                'point_percentage' => 0,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251128120606.php:126:                'point_percentage' => 0,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125161057.php:240:                'option_key' => 'adjust_point_variance_mail_addr',
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/codeception/aws.yaml:9:    use_path_style_endpoint: true
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/codeception/aws.yaml:10:    endpoint: "%env(S3_ENDPOINT)%"
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251223094816.php:67:        'eccube.mail.point_expire_notification',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251223094816.php:68:        'eccube.mail.point_expire_notification_en',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:442:                // FilePond がこのエンドポイントへ img/goods/... パスでリクエストを送る。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:21:use Eccube\Message\SmaregiOrderUsePointMessage;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:27:use Eccube\Service\Smaregi\SmaregiPointPushLogService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:32: * 注文完了時の使用ポイントをスマレジ会員ポイントへ反映する非同期ハンドラ.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:35: * 失敗時は Order.smaregiErrorFlg / pointErrorMessage に記録したうえで FAILED にして例外を再送出し、
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:39:final readonly class SmaregiOrderUsePointMessageHandler
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:49:        private SmaregiPointPushLogService $smaregiPointPushLogService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:53:    public function __invoke(SmaregiOrderUsePointMessage $message): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:57:            $this->logger->error('MessengerJob not found for SmaregiOrderUsePointMessage', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:80:                $this->completeJobSkipped($Job, 'スマレジ未連携の会員のため使用ポイント連携をスキップしました。');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:85:            $spendedPoints = $Order->getSpendedPoints();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:86:            if ($spendedPoints === null || $spendedPoints === 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:87:                $this->completeJobSkipped($Job, '使用ポイントが 0 のため連携をスキップしました。');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:93:                // 使用ポイントはスマレジ会員ポイントから減算するため負値で連携する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:94:                $response = $this->smaregiCustomerService->postSmaregiPoint($smaregiId, -$spendedPoints, false);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:96:                // postSmaregiPoint は通常例外を投げないが、想定外例外は適用有無が不明なため自動リトライせず手動照合へ回す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:98:                $this->failJob($Job, 'スマレジ会員ポイント更新で想定外の例外が発生しました（適用有無不明・要手動照合）: '.$e->getMessage());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:104:                $error = json_encode($response, JSON_UNESCAPED_UNICODE) ?: 'スマレジ会員ポイント更新に失敗しました。';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:107:                // ポイント加算API(point/add)は相対加算で非冪等。加算API実行後（statusCode あり）の失敗は
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:110:                    $this->failJob($Job, 'スマレジ会員ポイント更新が不確定な状態で失敗しました（自動リトライ不可・要手動照合）: '.$error);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:116:                $this->failJob($Job, 'スマレジ会員ポイント更新に失敗しました（外部未適用・再試行）: '.$error);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:121:            // ここに到達した時点でスマレジ側のポイント加算は成功している。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:123:            // point/add は非冪等のため、ここで失敗しても再送出（リトライ）はせずログのみとする（echo 抑止欠落の恐れ・要手動照合）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:125:                // この point/add がスマレジ側に生む取引が Webhook で戻ってきても二重処理しないよう、取引IDを送信記録へ積む。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:126:                $this->smaregiPointPushLogService->recordFromResult($response);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:129:                    ->setPointErrorMessage(null);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:135:                $this->logger->error('Smaregi order use-point applied but failed to persist push log/COMPLETED state', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:152:            ->setPointErrorMessage(json_encode(['message' => $message], JSON_UNESCAPED_UNICODE) ?: $message);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:163:            $this->logger->error('Failed to persist Smaregi order use-point job failure state', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:179:            $this->logger->error('Failed to persist Smaregi order use-point job skipped state', [
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260108204509.php:36:        $this->addSql("INSERT INTO dtb_csv (csv_type_id, entity_name, field_name, reference_field_name, disp_name, sort_no, enabled, create_date, update_date) VALUES (2, 'Eccube\\Entity\\Customer', 'Player', 'point', '保有ポイント', 9, true, NOW(), NOW());");
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260108204509.php:68:        $this->addSql("DELETE FROM dtb_csv WHERE csv_type_id = 2 AND disp_name = 'ポイント';");
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260108204509.php:76:        $this->addSql("DELETE FROM dtb_csv WHERE csv_type_id = 2 AND disp_name = '保有ポイント';");
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260108204509.php:108:        $this->addSql("INSERT INTO dtb_csv (csv_type_id, entity_name, field_name, reference_field_name, disp_name, sort_no, enabled, create_date, update_date) VALUES (2, 'Eccube\\Entity\\Customer', 'point', NULL, 'ポイント', 33, true, NOW(), NOW());");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:21:use Eccube\Message\SmaregiOrderGainPointMessage;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:27:use Eccube\Service\Smaregi\SmaregiPointPushLogService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:32: * 出荷完了時の発生ポイントをスマレジ会員ポイントへ反映する非同期ハンドラ.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:35: * 失敗時は Order.smaregiErrorFlg / pointErrorMessage に記録したうえで FAILED にし、
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:36: * point/add（相対加算で非冪等）の二重適用を避けるため、適用有無で自動リトライ可否を分類する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:39:final readonly class SmaregiOrderGainPointMessageHandler
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:49:        private SmaregiPointPushLogService $smaregiPointPushLogService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:53:    public function __invoke(SmaregiOrderGainPointMessage $message): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:57:            $this->logger->error('MessengerJob not found for SmaregiOrderGainPointMessage', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:80:                $this->completeJobSkipped($Job, 'スマレジ未連携の会員のため発生ポイント連携をスキップしました。');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:85:            $gainedPoints = $Order->getGainedPoints();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:86:            if ($gainedPoints === null || $gainedPoints === 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:87:                $this->completeJobSkipped($Job, '発生ポイントが 0 のため連携をスキップしました。');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:93:                $response = $this->smaregiCustomerService->gainPoints($Order);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:95:                // gainPoints は通常例外を投げないが、想定外例外は適用有無が不明なため自動リトライせず手動照合へ回す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:97:                $this->failJob($Job, 'スマレジ会員ポイント更新で想定外の例外が発生しました（適用有無不明・要手動照合）: '.$e->getMessage());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:106:                // ポイント加算API(point/add)は相対加算で非冪等。加算API実行後（statusCode あり）の失敗は
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:109:                    $this->failJob($Job, 'スマレジ会員ポイント更新が不確定な状態で失敗しました（自動リトライ不可・要手動照合）: '.$error);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:115:                $this->failJob($Job, 'スマレジ会員ポイント更新に失敗しました（外部未適用・再試行）: '.$error);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:117:                throw new \RuntimeException('スマレジ会員ポイント更新に失敗しました（外部未適用・再試行）: '.$error);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:120:            // ここに到達した時点でスマレジ側のポイント加算は成功している。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:122:            // point/add は非冪等のため、ここで失敗しても再送出（リトライ）はせずログのみとする（echo 抑止欠落の恐れ・要手動照合）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:124:                // この point/add がスマレジ側に生む取引が Webhook で戻ってきても二重処理しないよう、取引IDを送信記録へ積む。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:125:                $this->smaregiPointPushLogService->recordFromResult($response);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:127:                    ->setPointErrorMessage(null);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:133:                $this->logger->error('Smaregi order gain-point applied but failed to persist push log/COMPLETED state', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:150:            ->setPointErrorMessage(json_encode(['message' => $message], JSON_UNESCAPED_UNICODE) ?: $message);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:161:            $this->logger->error('Failed to persist Smaregi order gain-point job failure state', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiOrderGainPointMessageHandler.php:177:            $this->logger->error('Failed to persist Smaregi order gain-point job skipped state', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiProductClassUpsertMessageHandler.php:254:            // 'pointNotApplicable' => '0',
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/dev/aws.yaml:9:    use_path_style_endpoint: true
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/dev/aws.yaml:10:    endpoint: "%env(S3_ENDPOINT)%"
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/dev/aws.yaml:21:        use_path_style_endpoint: true
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/dev/aws.yaml:22:        endpoint: "%env(S3_ENDPOINT)%"
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/dev/aws.yaml:31:        use_path_style_endpoint: true
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/dev/aws.yaml:32:        endpoint: "%env(S3_ENDPOINT)%"
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/purchaseflow.yaml:99:    eccube.purchase.flow.item.holder.validator.point.diff.processor:
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/purchaseflow.yaml:100:        class: Eccube\Service\PurchaseFlow\Processor\PointDiffProcessor
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/purchaseflow.yaml:103:            - '@Eccube\Service\PointHelper'
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/purchaseflow.yaml:167:    eccube.purchase.flow.discount.processor.point.processor:
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/purchaseflow.yaml:168:        class: Eccube\Service\PurchaseFlow\Processor\PointProcessor
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/purchaseflow.yaml:170:            - '@Eccube\Service\PointHelper'
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/purchaseflow.yaml:171:            - '@Eccube\Service\PointService'
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/purchaseflow.yaml:178:    eccube.purchase.flow.item.holder.post.validator.point.rate.validator: # 明細にポイント付与率を設定する
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/purchaseflow.yaml:179:        class: Eccube\Service\PurchaseFlow\Processor\PointRateProcessor
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/purchaseflow.yaml:185:    eccube.purchase.flow.item.holder.post.validator.add.point.validator: # 加算ポイントの計算
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/purchaseflow.yaml:186:        class: Eccube\Service\PurchaseFlow\Processor\AddPointProcessor
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/purchaseflow.yaml:247:    eccube.purchase.flow.purchase.processor.point.processor:
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/purchaseflow.yaml:248:        class: Eccube\Service\PurchaseFlow\Processor\PointProcessor
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/purchaseflow.yaml:250:            - '@Eccube\Service\PointHelper'
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/purchaseflow.yaml:251:            - '@Eccube\Service\PointService'
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/purchaseflow.yaml:298:    eccube.purchase.flow.purchase.processor.point.diff.processor:
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/purchaseflow.yaml:299:        class: Eccube\Service\PurchaseFlow\Processor\PointDiffProcessor
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/purchaseflow.yaml:302:            - '@Eccube\Service\PointHelper'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerEditController.php:278:            $Player->getPoint(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerEditController.php:280:            $Player->getPointContactNumber(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerEditController.php:281:            $Player->getPointTransferFlg(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerEditController.php:282:            $Player->getPointLinkedFailureCount(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:20:use Eccube\Entity\DtbPointHistory;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:21:use Eccube\Entity\Master\MtbPointType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:22:use Eccube\Form\Type\Admin\CustomerPointType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:23:use Eccube\Repository\Master\MtbPointTypeRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:24:use Eccube\Service\Smaregi\SmaregiCustomerPointEventService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:30:class CustomerPointController extends AbstractController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:33:        private readonly MtbPointTypeRepository $pointTypeRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:34:        private readonly SmaregiCustomerPointEventService $smaregiCustomerPointEventService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:41:    #[Route('/%eccube_admin_route%/customer/point/{id}/select', name: 'admin_customer_point_select', requirements: ['id' => '\d+'], methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:42:    #[Template('@admin/Customer/point_select.twig')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:53:    #[Route('/%eccube_admin_route%/customer/point/{id}/{type}', name: 'admin_customer_point_history', requirements: ['id' => '\d+', 'type' => 'history|granted|purchase'], methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:54:    #[Route('/%eccube_admin_route%/customer/point/{id}/{type}', name: 'admin_customer_point_update', requirements: ['id' => '\d+', 'type' => 'granted|purchase'], methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:55:    #[Template('@admin/Customer/point_update.twig')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:56:    public function pointHistory(Request $request, Customer $Customer, string $type): array|RedirectResponse
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:58:        $PointHistory = new DtbPointHistory();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:59:        $PointHistory->setCustomer($Customer);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:62:            ->createBuilder(CustomerPointType::class, $PointHistory, ['type' => $type]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:68:            $pointTypeId = $type == MtbPointType::GRANTED ? MtbPointType::GRANTED_TYPE : MtbPointType::PURCHASE_TYPE;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:69:            $PointType = $this->pointTypeRepository->find($pointTypeId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:71:            if ($PointType === null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:74:                return $this->redirectToRoute('admin_customer_point_history', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:82:            $PointHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:84:                ->setPointType($PointType)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:86:            $this->entityManager->persist($PointHistory);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:88:            $Customer->getPlayer()->addPoint($PointHistory->getPointChange());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:91:            // ポイント履歴・残高更新と同一トランザクションでスマレジ連携ジョブを積み、commit 後に dispatch する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:92:            $job = $this->smaregiCustomerPointEventService->registerPointAddJob($PointHistory);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:97:                $this->smaregiCustomerPointEventService->dispatchPointAddMessage($job, $PointHistory);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:102:            return $this->redirectToRoute('admin_customer_point_history', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:108:        $pointTypeLabelKey = $type === MtbPointType::GRANTED
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:109:            ? 'admin.customer.point_update.granted'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:110:            : 'admin.customer.point_update.purchase';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:116:            'pointTypeLabelKey' => $pointTypeLabelKey,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:117:            'pointUpdateFlg' => $type !== MtbPointType::HISTORY,
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/e2e/aws.yaml:9:    use_path_style_endpoint: true
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/e2e/aws.yaml:10:    endpoint: "%env(S3_ENDPOINT)%"
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260701014652.php:23: * dtb_smaregi_point_push_log（EC 発 point/add の 送信記録）へ権限を付与する。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260701014652.php:25: * 記録・参照はいずれも messenger:consume（取引 Webhook 処理 / ポイント連携ハンドラ）から行われ、
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260701014652.php:36:        return 'dtb_smaregi_point_push_log への権限を system ロールへ付与（送信記録の記録・参照用）';
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260701014652.php:42:        if (!$this->tableExists('dtb_smaregi_point_push_log')) {
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260701014652.php:46:        $this->addSql('GRANT SELECT, INSERT ON TABLE dtb_smaregi_point_push_log TO '.self::ROLES);
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260701014652.php:48:        if ($this->sequenceExists('dtb_smaregi_point_push_log_id_seq')) {
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260701014652.php:49:            $this->addSql('GRANT USAGE ON SEQUENCE dtb_smaregi_point_push_log_id_seq TO '.self::ROLES);
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260701014652.php:56:        if ($this->tableExists('dtb_smaregi_point_push_log')) {
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260701014652.php:57:            $this->addSql('REVOKE SELECT, INSERT ON TABLE dtb_smaregi_point_push_log FROM '.self::ROLES);
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260701014652.php:59:        if ($this->sequenceExists('dtb_smaregi_point_push_log_id_seq')) {
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260701014652.php:60:            $this->addSql('REVOKE USAGE ON SEQUENCE dtb_smaregi_point_push_log_id_seq FROM '.self::ROLES);
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000009.php:35:                'INSERT INTO dtb_customer_group (id, name, point_percentage, shop_front_flg, branch_shop_front_flg, create_date, update_date, member_id)
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000009.php:39:                    point_percentage = EXCLUDED.point_percentage,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000009.php:48:                    $record['point_percentage'],
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000009.php:80:            ['id' => 1, 'name' => '通常会員', 'point_percentage' => 1, 'shop_front_flg' => '0', 'branch_shop_front_flg' => '0', 'create_date' => '2019-03-21 20:00:37+00', 'update_date' => '2025-07-15 09:00:01+00', 'member_id' => null],
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000009.php:81:            ['id' => 2, 'name' => 'SCG取引用', 'point_percentage' => 5, 'shop_front_flg' => '0', 'branch_shop_front_flg' => '0', 'create_date' => '2019-03-21 20:00:37+00', 'update_date' => '2019-03-22 05:01:33+00', 'member_id' => null],
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000009.php:82:            ['id' => 3, 'name' => '店内アカウント', 'point_percentage' => 0, 'shop_front_flg' => '1', 'branch_shop_front_flg' => '0', 'create_date' => '2019-03-21 20:00:37+00', 'update_date' => '2019-06-26 17:56:17+00', 'member_id' => null],
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000009.php:83:            ['id' => 4, 'name' => 'Sekappy用', 'point_percentage' => 0, 'shop_front_flg' => '0', 'branch_shop_front_flg' => '0', 'create_date' => '2019-03-21 20:00:37+00', 'update_date' => '2019-03-22 04:55:23+00', 'member_id' => null],
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000009.php:84:            ['id' => 5, 'name' => '支店用店内アカウント', 'point_percentage' => 0, 'shop_front_flg' => '0', 'branch_shop_front_flg' => '1', 'create_date' => '2022-06-09 01:00:51+00', 'update_date' => '2022-06-29 22:39:26+00', 'member_id' => null],
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000009.php:85:            ['id' => 6, 'name' => '海外代理販売用', 'point_percentage' => 0, 'shop_front_flg' => '0', 'branch_shop_front_flg' => '0', 'create_date' => '2022-11-28 20:39:03+00', 'update_date' => '2023-05-23 04:36:09+00', 'member_id' => null],
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260618000009.php:86:            ['id' => 9, 'name' => '集換社アカウント', 'point_percentage' => 0, 'shop_front_flg' => '0', 'branch_shop_front_flg' => '0', 'create_date' => '2025-10-27 20:39:04+00', 'update_date' => '2025-10-27 21:22:15+00', 'member_id' => null],
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20240930235959_03.php:94:        $this->addSql('GRANT SELECT, UPDATE (buy_times, buy_total, update_date, point) ON dtb_customer TO tenant_owner, tenant_operator;');
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/prod/aws.yaml:16:        use_path_style_endpoint: true
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/prod/aws.yaml:17:        endpoint: "%env(S3_ENDPOINT)%"
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/prod/aws.yaml:26:        use_path_style_endpoint: true
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/prod/aws.yaml:27:        endpoint: "%env(S3_ENDPOINT)%"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:20:use Eccube\Message\SmaregiCustomerPointAddMessage;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:21:use Eccube\Repository\DtbPointHistoryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:26:use Eccube\Service\Smaregi\SmaregiPointPushLogService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:31: * 管理画面ポイント付与をスマレジ会員ポイントへ反映する非同期ハンドラ.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:37:final readonly class SmaregiCustomerPointAddMessageHandler
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:44:        private DtbPointHistoryRepository $pointHistoryRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:47:        private SmaregiPointPushLogService $smaregiPointPushLogService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:51:    public function __invoke(SmaregiCustomerPointAddMessage $message): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:55:            $this->logger->error('MessengerJob not found for SmaregiCustomerPointAddMessage', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:57:                'pointHistoryId' => $message->getPointHistoryId(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:69:            $pointHistory = $this->pointHistoryRepository->find($message->getPointHistoryId());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:70:            if ($pointHistory === null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:71:                $this->failJob($Job, 'ポイント履歴が見つかりません (pointHistoryId='.$message->getPointHistoryId().').');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:76:            $smaregiId = $pointHistory->getCustomer()->getPlayer()?->getSmaregiId();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:78:                $this->completeJobSkipped($Job, 'スマレジ未連携の会員のためポイント連携をスキップしました。');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:83:            $pointChange = $pointHistory->getPointChange();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:84:            if ($pointChange === null || $pointChange === 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:85:                $this->completeJobSkipped($Job, '増減ポイントが 0 のためポイント連携をスキップしました。');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:91:                $response = $this->smaregiCustomerService->postSmaregiPoint($smaregiId, $pointChange);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:93:                // postSmaregiPoint は通常例外を投げないが、想定外例外は適用有無が不明なため自動リトライせず手動照合へ回す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:94:                $this->failJob($Job, 'スマレジ会員ポイント更新で想定外の例外が発生しました（適用有無不明・要手動照合）: '.$e->getMessage());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:102:                // ポイント加算API(point/add)は相対加算で非冪等。加算API実行後（statusCode あり）の失敗は
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:105:                    $this->failJob($Job, 'スマレジ会員ポイント更新が不確定な状態で失敗しました（自動リトライ不可・要手動照合）: '.$error);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:111:                $this->failJob($Job, 'スマレジ会員ポイント更新に失敗しました（外部未適用・再試行）: '.$error);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:113:                throw new \RuntimeException('スマレジ会員ポイント更新に失敗しました（外部未適用・再試行）: '.$error);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:116:            // ここに到達した時点でスマレジ側のポイント加算は成功している。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:118:            // point/add は非冪等のため、ここで失敗しても再送出（リトライ）はせずログのみとする（echo 抑止欠落の恐れ・要手動照合）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:120:                // この point/add がスマレジ側に生む取引が Webhook で戻ってきても二重処理しないよう、取引IDを送信記録へ積む。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:121:                $this->smaregiPointPushLogService->recordFromResult($response);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:127:                $this->logger->error('Smaregi customer point applied but failed to persist push log/COMPLETED state', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:145:            $this->logger->error('Failed to persist Smaregi customer point job failure state', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:161:            $this->logger->error('Failed to persist Smaregi customer point job skipped state', [
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260512200000.php:28:    private const BLOCK_NAME = 'PCナビゲーション_会員UX (ポイント/マイページ/お気に入り)';
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:190:    eccube_customer_point_expire: 183
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:305:    eccube_point_expire_prior_1: 30
/home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:306:    eccube_point_expire_prior_2: 7
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:53:use Eccube\Service\PointService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:60:use Eccube\Service\Smaregi\SmaregiOrderGainPointEventService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:127:        private readonly PointService $pointService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:129:        private readonly SmaregiOrderGainPointEventService $smaregiOrderGainPointEventService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:241:     * 受注フォーム組み立て直後の拡張ポイント。{@see EccubeEvents} `ADMIN_ORDER_EDIT_INDEX_INITIALIZE` を送出する.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:330:     * 管理画面では discount はフォーム入力値をそのまま一時明細に載せる（order フローでは PointProcessor が POINT 明細を作らない）.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:588:        $gainPointJob = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:592:            $this->entityManager->wrapInTransaction(function () use ($TargetOrder, $OriginOrder, $OriginItems, $purchaseContext, $form, &$gainPointJob): void {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:637:                        $this->pointService->cancelOrderPoints($TargetOrder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:674:                $this->applyOrderPointAndOperatorFromForm($TargetOrder, $OriginOrder, $form);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:676:                // 新たに出荷完了へ遷移した場合、確定後の発生ポイント（applyOrderPointAndOperatorFromForm 反映後の最終値）を
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:679:                    $this->pointService->gainPoints($TargetOrder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:680:                    $gainPointJob = $this->smaregiOrderGainPointEventService->registerGainPointJob($TargetOrder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:710:        // 受注確定の commit 成功後に発生ポイント連携メッセージを送信する（アウトボックス的な順序）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:711:        if ($gainPointJob !== null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:712:            $this->smaregiOrderGainPointEventService->dispatchGainPointMessage($gainPointJob, $TargetOrder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:798:        $gainPointJob = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:799:        $this->entityManager->wrapInTransaction(function () use ($TargetOrder, $statusChangedToDelivered, $isFirstCancellation, $OldOrderStatus, $NewOrderStatus, &$gainPointJob): void {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:809:            // 新たに出荷完了になった場合、ポイントを付加
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:811:                $this->pointService->gainPoints($TargetOrder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:812:                // 発生ポイントのスマレジ連携ジョブを同一トランザクションで積む（dispatch は commit 後）.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:813:                $gainPointJob = $this->smaregiOrderGainPointEventService->registerGainPointJob($TargetOrder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:816:                $this->pointService->cancelOrderPoints($TargetOrder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:826:        // 受注確定の commit 成功後に発生ポイント連携メッセージを送信する（アウトボックス的な順序）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:827:        if ($gainPointJob !== null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:828:            $this->smaregiOrderGainPointEventService->dispatchGainPointMessage($gainPointJob, $TargetOrder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:937:     * 受注フォームのポイント関連入力と担当者を受注に反映する.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:940:     * 小計や還元率が変わった場合のみ発生ポイントを再計算する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:942:    private function applyOrderPointAndOperatorFromForm(Order $TargetOrder, Order $OriginOrder, FormInterface $form): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:945:        $pointPercentage = $form->has('pointPercentage')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:946:            ? (int) ($form->get('pointPercentage')->getData() ?? 0)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:947:            : (int) ($TargetOrder->getPointPercentage() ?? 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:948:        $spendedPoints = $form->has('spendedPoints')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:949:            ? (int) ($form->get('spendedPoints')->getData() ?? 0)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:950:            : (int) ($TargetOrder->getSpendedPoints() ?? 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:951:        $gainedPoints = $form->has('gainedPoints')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:952:            ? (int) ($form->get('gainedPoints')->getData() ?? 0)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:953:            : (int) ($TargetOrder->getGainedPoints() ?? 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:957:            $gainedPoints = 0;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:960:                || (int) ($OriginOrder->getPointPercentage() ?? 0) !== $pointPercentage)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:961:            $taxedBase = $targetSubTotal - $spendedPoints;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:962:            $gainedPoints = $taxedBase > 0 ? (int) floor($taxedBase * $pointPercentage / 100) : 0;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:967:            ->setGainedPoints($gainedPoints)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:968:            ->setSpendedPoints($spendedPoints)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:969:            ->setPointPercentage($pointPercentage);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Calculator/OrderItemCollection.php:88:            fn (ItemInterface $OrderItem) => $OrderItem->isDiscount() || $OrderItem->isPoint());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchExportService.php:37:    private string $s3Endpoint;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchExportService.php:59:        $this->s3Endpoint = (string) $params->get('s3_endpoint');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchExportService.php:578:        return $this->s3Endpoint.$this->awsS3Bucket.'/'.$path;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/EventTopController.php:32: * 該当 5 endpoint は `Eccube\Controller\App\EventScheduleController` (App namespace, locale prefix なし) で提供する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:24:use Eccube\Service\PointService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:25:use Eccube\Service\Smaregi\SmaregiOrderGainPointEventService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:38:        private readonly PointService $pointService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:39:        private readonly SmaregiOrderGainPointEventService $smaregiOrderGainPointEventService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:312:                $gainPointDispatch = [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:314:                    $this->pointService->gainPoints($updateOrder['order']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:315:                    // 発生ポイントのスマレジ連携ジョブを同一トランザクションで積む（dispatch は commit 後）.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:316:                    $gainPointJob = $this->smaregiOrderGainPointEventService->registerGainPointJob($updateOrder['order']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:317:                    if ($gainPointJob !== null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:318:                        $gainPointDispatch[] = ['job' => $gainPointJob, 'order' => $updateOrder['order']];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:324:                // commit 成功後に発生ポイント連携メッセージをまとめて送信する（アウトボックス的な順序）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:325:                foreach ($gainPointDispatch as $gainPointEntry) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderCsvController.php:326:                    $this->smaregiOrderGainPointEventService->dispatchGainPointMessage($gainPointEntry['job'], $gainPointEntry['order']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerGroupType.php:39:            ->add('point_percentage', IntegerType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:19:use Eccube\Entity\DtbPointHistory;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:35:class CustomerPointType extends AbstractType
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:63:                'label' => 'admin.customer.point.order_id',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:74:            ->add('pointChange', IntegerType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:75:                'label' => 'admin.customer.point.point_change',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:78:                    'placeholder' => 'admin.customer.point.point_change_ex',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:86:                'label' => 'admin.customer.point.note',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:96:                'label' => 'admin.customer.point.issue_date',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:118:            /** @var DtbPointHistory $PointHistory */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:119:            $PointHistory = $event->getData();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:121:            $Customer = $PointHistory->getCustomer();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:126:                    $form['orderNumber']->addError(new FormError(trans('admin.customer.point.form.not_has.order_no')));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:130:            $pointChange = $form->get('pointChange')->getData();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:131:            if ($Customer->getPoint() + $pointChange < 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:132:                $form['pointChange']->addError(new FormError(trans('admin.customer.point.point_charge.point_minus')));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:141:            'data_class' => DtbPointHistory::class,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:149:        return 'admin_customer_point';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderItemType.php:108:            ->add('point_rate', HiddenType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:316:     * スマレジにポイントを増減させる
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:320:    public function postSmaregiPoint(?string $smaregiId = null, ?int $point = null, bool $isRollback = false): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:326:        if ($point === null || $point === 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:342:        // ポイント加算APIは customerId 必須だが EC は保持しないため、customer_no から解決する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:348:        $delta = $isRollback ? -$point : $point;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:349:        $response = $this->customerApiClient->addPoint(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:359:                'error' => 'スマレジ会員ポイント更新APIが失敗しました (status='.$response['statusCode'].').',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:364:        // point/add がスマレジ側に生む取引ID。Webhook で戻る echo を抑止するため呼び出し側へ返す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:367:            // point/add は成功(2xx)したが取引IDを取得できなかった。echo 抑止の記録ができず Webhook で二重付与に
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:368:            // なり得るため、成功扱いにせず statusCode 付きエラーとして返し、手動照合へ回す（point/add は再実行しない）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:369:            $this->logger->error('Smaregi customer point updated but response has no transactionHeadIds', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:372:                'point' => $delta,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:377:                'error' => 'スマレジ会員ポイント更新は成功しましたが取引IDを取得できませんでした（echo 抑止不可・要手動照合）。',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:382:        $this->logger->info('Smaregi customer point updated', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:385:            'point' => $delta,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:392:     * point/add 応答（{"transactionHeadIds":["79"]} 等）から取引IDの一覧を取り出す.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:550:     * 受注の発生ポイント（出荷完了時の付与ポイント）をスマレジ会員ポイントへ加算連携する.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:552:     * 発生ポイントは正値で加算する。非同期ハンドラから呼ぶ同期ワーカーで、
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:553:     * smaregi_id 無し・増減 0 は postSmaregiPoint 側でスキップ(成功扱い)になる。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:557:    public function gainPoints(Order $Order): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:560:        $gainedPoints = (int) ($Order->getGainedPoints() ?? 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerService.php:562:        return $this->postSmaregiPoint($smaregiId, $gainedPoints, false);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:45:use Eccube\Service\Smaregi\SmaregiOrderUsePointEventService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:104:    public function __construct(protected CartService $cartService, protected MailService $mailService, protected OrderRepository $orderRepository, protected OrderHelper $orderHelper, protected ContainerInterface $serviceContainer, protected TradeLawRepository $tradeLawRepository, protected RateLimiterFactoryInterface $shoppingConfirmIpLimiter, protected RateLimiterFactoryInterface $shoppingConfirmCustomerLimiter, protected RateLimiterFactoryInterface $shoppingCheckoutIpLimiter, protected RateLimiterFactoryInterface $shoppingCheckoutCustomerLimiter, protected BaseInfoRepository $baseInfoRepository, protected OrderItemRepository $orderItemRepository, protected UniSearchService $uniSearchService, protected DtbWaitingNumberRepository $waitingNumberRepository, protected ShoppingService $shoppingService, protected SmaregiOrderUsePointEventService $smaregiOrderUsePointEventService)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:440:            $usePointJob = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:513:                // 使用ポイントのスマレジ連携ジョブを受注確定と同一トランザクションで作成（dispatch は commit 後）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:514:                $usePointJob = $this->smaregiOrderUsePointEventService->registerUsePointJob($Order);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:590:            // 受注確定の commit 成功後に使用ポイント連携メッセージを送信する（アウトボックス的な順序）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:591:            if ($usePointJob !== null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:592:                $this->smaregiOrderUsePointEventService->dispatchUsePointMessage($usePointJob, $Order);
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125150314.php:87:                'name' => 'ポイント',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php:21:use Eccube\Message\SmaregiOrderGainPointMessage;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php:26: * 出荷完了時の発生ポイントをスマレジ会員ポイントへ非同期反映するための連携ジョブを扱う.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php:28: * ポイント付与と同一トランザクションで MessengerJob を INSERT し（{@see registerGainPointJob()}）、
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php:29: * commit 成功後に {@see dispatchGainPointMessage()} でメッセージを送る（アウトボックス的な順序）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php:31:class SmaregiOrderGainPointEventService
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php:41:     * 発生ポイント付与と同一 DB トランザクションで連携ジョブを積む（flush は呼び出し側）.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php:43:     * スマレジ未連携（smaregi_id 無し）や発生ポイント 0 の場合は連携不要のため null を返す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php:45:    public function registerGainPointJob(Order $Order): ?MessengerJob
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php:52:        $gainedPoints = $Order->getGainedPoints();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php:53:        if ($gainedPoints === null || $gainedPoints === 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php:58:        $job->setMessageClass(SmaregiOrderGainPointMessage::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php:60:        $job->setPayloadSummary(sprintf('orderId=%s gainedPoints=%d', $Order->getId(), $gainedPoints));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php:67:     * registerGainPointJob の flush / commit 成功後にのみ呼ぶ。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php:70:    public function dispatchGainPointMessage(MessengerJob $job, Order $Order): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php:74:            $this->logger->error('Smaregi order gain-point job has no id; cannot dispatch message bus.', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php:82:            $this->messageBus->dispatch(new SmaregiOrderGainPointMessage((int) $Order->getId(), $jobId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php:94:                $this->logger->error('Failed to persist Smaregi order gain-point job failure state', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderGainPointEventService.php:100:            $this->logger->error('Smaregi order gain-point message dispatch failed', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:286:            ->add('pointPercentage', IntegerType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:294:            ->add('gainedPoints', IntegerType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:303:            ->add('spendedPoints', IntegerType::class, [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderType.php:312:            ->add('pointErrorMessage', TextareaType::class, [
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20240930235959_02.php:107:            option_point,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20240930235959_02.php:108:            basic_point_rate,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20240930235959_02.php:109:            point_conversion_rate,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php:22:class SmaregiUpdatePointAction
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php:39:        $suspendPoint = $order->getSpendedPoints();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php:40:        if ($suspendPoint === null || $suspendPoint === 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php:54:            $response = $this->smaregiCustomerService->postSmaregiPoint($player->getSmaregiId(), -$suspendPoint, false);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php:57:                $order->setPointErrorMessage(json_encode(['message' => $e->getMessage()], JSON_UNESCAPED_UNICODE))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php:62:                log_error('スマレジポイント連携失敗後の注文更新に失敗しました', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php:75:        $order->setPointErrorMessage(json_encode($response, JSON_UNESCAPED_UNICODE))
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20201218044542.php:29:        $pointExists = $this->connection->fetchOne("SELECT COUNT(*) FROM dtb_csv WHERE csv_type_id = 2 AND field_name = 'point'");
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20201218044542.php:31:        if ($pointExists == 0) {
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20201218044542.php:37:                2, null, ?, 'point', 'ポイント', $sortNo, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:38:        $sql = 'INSERT INTO dtb_base_info (id, country_id, pref_id, tenant_status, company_name, company_kana, postal_code, addr01, addr02, phone_number, business_hour, email01, email02, email03, email04, shop_name, shop_kana, shop_name_eng, update_date, good_traded, message, delivery_free_amount, delivery_free_quantity, option_mypage_order_status_display, option_nostock_hidden, option_favorite_product, option_product_delivery_fee, option_product_tax_rule, option_customer_activate, option_remember_me, option_mail_notifier, option_point, invoice_registration_number, authentication_key, php_path, basic_point_rate, point_conversion_rate, ga_id, banner_image, limited_items_tag01, limited_items_tag02, latest_expansion, customer_id, rank, short_name_jp, short_name_en, html_class_name, address_en, fax_number, max_capacity, shop_color, shop_icon, picking_list_threshold, expensive_threshold1, expensive_threshold2, expensive_threshold3, stack_paper_threshold, shop_digit, smaregi_shop_id, smaregi_shop_code, global_ip_address, printer_ip_address, common_setting_flg, banner_image_tag, random_tile_flg, test_store_flg, is_main_shop, is_public_shop, is_open_shop, google_map_url, business_hour_en, local_hareruyakun_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:70:            option_point = EXCLUDED.option_point,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:74:            basic_point_rate = EXCLUDED.basic_point_rate,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:75:            point_conversion_rate = EXCLUDED.point_conversion_rate,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:147:                    $record['option_point'] ?? null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:151:                    $record['basic_point_rate'] ?? null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:152:                    $record['point_conversion_rate'] ?? null,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:240:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:244:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:245:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:314:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:318:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:319:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:388:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:392:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:393:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:462:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:466:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:467:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:536:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:540:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:541:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:610:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:614:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:615:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:684:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:688:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:689:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:758:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:762:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:763:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:832:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:836:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:837:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:906:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:910:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:911:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:980:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:984:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:985:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1054:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1058:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1059:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1128:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1132:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1133:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1202:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1206:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1207:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1276:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1280:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1281:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1350:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1354:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1355:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1424:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1428:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1429:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1498:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1502:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1503:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1572:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1576:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1577:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1646:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1650:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1651:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1720:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1724:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1725:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1794:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1798:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1799:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1868:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1872:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1873:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1942:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1946:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:1947:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2016:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2020:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2021:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2090:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2094:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2095:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2164:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2168:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2169:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2238:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2242:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2243:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2312:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2316:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2317:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2386:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2390:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2391:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2460:                'option_point' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2464:                'basic_point_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251127154224.php:2465:                'point_conversion_rate' => '1',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:1068:店頭での商品購入時ポイント5倍などの、
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:1630:                'mail_key' => 'eccube.mail.point_expire_notification',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:1631:                'name' => '【ポイント/日】ポイント有効期限通知メール',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:1632:                'file_name' => 'Mail/Mall/point_expire_notification.twig',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:1633:                'mail_subject' => '※重要【晴れる屋】ポイント有効期限のお知らせ',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:1639:下記のポイントに関しまして有効期限が迫っていることをお知らせさせていただきます。',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:1640:                'footer' => '※有効期限内にご利用いただけないポイントは失効となってしまいます。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:1641:失効となったポイントの再加算はいたしかねますのでご注意ください。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:1659:                'mail_key' => 'eccube.mail.point_expire_notification_en',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:1660:                'name' => '【ポイント/英】ポイント有効期限通知メール',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:1661:                'file_name' => 'Mail/Mall/point_expire_notification.en.twig',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:1662:                'mail_subject' => '【Hareruya】 Your points are about to expire',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:1666:                'header' => 'We notify you that your Hareruya points are about to expire.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:1667:The following link shows the amount of points you currently have:
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:1671:These points will be automatically lost after the expiration date.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:1672:Please note that we\'ll not accept a request for restoring lost points in any circumstances.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:1673:    We strongly recommend you to spend these points before expired.',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:2090:余剰の○○円に関しましては、まことに勝手ではございますが、晴れる屋のポイントとして付与させていただきます、ご了承ください。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:2095:不足分の○○円につきましては、まことに勝手ではございますが、お持ちのポイントから充当させていただきます、ご了承ください。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:2099:余剰の○○円に関しましては、晴れる屋のポイントとして加算させていただくか、返金をさせていただければと思います。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:2144:今後ご利用いただけるようであれば、晴れる屋のポイントとして加算させていただく事も可能です。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:2167:今後ご利用いただけるようであれば、晴れる屋のポイントとして加算させていただく事も可能です。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:2580:                'name' => '【通販/英】発送遅れ、ポイント10%付与しました',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:2590:    To express our apologies, we have decided to add 10% of your delayed order price as online store points to your account.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:2643:    We can ship orders combined though we will be charging extra shipping fee due to our order system. We will refund the extra charged shipping cost as Hareruya credit points when you placed your new order.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:2674:    We have combined your 2 orders, and added Hareruya credit points to your account as refund of shipping cost.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:3774:※すでに入金済みのお客様への返金は、全額晴れる屋ポイントでの返金となります。予めご了承ください。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:3802:We will take action to give 10% points of the purchased amount by after a week.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:3803:Please accept the points as a token of our appreciation and apology for your time.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:3960:※ご入金の際に手数料が生じる場合は金額をご連絡ください。ご入金いただいた後、同額分の晴れる屋ポイントを付与させていただきます。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:3976:                'name' => '【買取/日】キャンペーンポイント付与完了メール',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:3978:                'mail_subject' => '【晴れる屋　ネット買取】ポイント付与完了のご連絡',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:3986:3月26日(木)～4月25日(土)の期間内にご注文いただいたお客様を対象にネット買取ご成約で、買取金額の5％を通販ポイント還元のキャンペーンを行っております。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:3987:本日ポイント付与をさせていただきましたので、ご確認よろしくお願いいたします。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:3989:付与ポイント： P',
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:5691:※アカウントを凍結された場合、オンラインショップやネット買取の注文、ポイント利用などのサービスが使用出来なくなります。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/HealthcheckController.php:25: * 負荷分散 / コンテナヘルスチェック用エンドポイント.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260312120000.php:23:    private const MAIL_KEY = 'eccube.mail.point_expire_notification_en';
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260312120000.php:26:We strongly recommend you to spend these points before expired.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260312120000.php:44:We notify you that your Hareruya points are about to expire.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260312120000.php:45:The following link shows the amount of points you currently have:
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260312120000.php:49:These points will be automatically lost after the expiration date.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260312120000.php:50:Please note that we'll not accept a request for restoring lost points in any circumstances.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260312120000.php:51:    We strongly recommend you to spend these points before expired.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260312120000.php:71:        return '英語ポイント有効期限通知メール本文を設計どおりに更新';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:34:use Eccube\Repository\DtbPointHistoryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:71:        private readonly DtbPointHistoryRepository $pointHistoryRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:132:        $NextDeadlinePointHistory = $this->pointHistoryRepository->getNextDeadlinePointHistory($Customer->getPlayer());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:136:            'nextDeadlinePointHistory' => $NextDeadlinePointHistory,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:381:     * ポイント履歴を表示する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:387:    #[Route(path: '/mypage/point_history', name: 'mypage_point_history', methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:388:    #[Route(path: '/mypage/point_history/{page_no}', name: 'mypage_point_history_page', requirements: ['page_no' => '\d+'], methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:389:    #[Template(template: 'Mypage/point_history.twig')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:390:    public function pointHistory(Request $request, PaginatorInterface $paginator): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:395:        $qb = $this->pointHistoryRepository->getQueryBuilderByCustomer($Customer);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:406:        $NextDeadlinePointHistory = $this->pointHistoryRepository->getNextDeadlinePointHistory($Customer->getPlayer());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:411:            'NextDeadlinePointHistory' => $NextDeadlinePointHistory,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerType.php:190:            // ポイント数が入力されていない場合0を登録
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerType.php:191:            if (is_null($Customer->getPoint())) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerType.php:192:                $Customer->getPlayer()->setPoint(0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerPointEventService.php:19:use Eccube\Entity\DtbPointHistory;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerPointEventService.php:21:use Eccube\Message\SmaregiCustomerPointAddMessage;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerPointEventService.php:26: * 管理画面ポイント付与をスマレジ会員ポイントへ非同期反映するための連携ジョブを扱う.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerPointEventService.php:28: * EC のポイント履歴登録と同一トランザクションで MessengerJob を INSERT し（{@see registerPointAddJob()}）、
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerPointEventService.php:29: * commit 成功後に {@see dispatchPointAddMessage()} でメッセージを送る（アウトボックス的な順序）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerPointEventService.php:31:class SmaregiCustomerPointEventService
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerPointEventService.php:41:     * ポイント付与と同一 DB トランザクションで連携ジョブを積む（flush は呼び出し側）.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerPointEventService.php:45:    public function registerPointAddJob(DtbPointHistory $pointHistory): ?MessengerJob
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerPointEventService.php:47:        $smaregiId = $pointHistory->getCustomer()->getPlayer()?->getSmaregiId();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerPointEventService.php:52:        $pointChange = $pointHistory->getPointChange();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerPointEventService.php:53:        if ($pointChange === null || $pointChange === 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerPointEventService.php:58:        $job->setMessageClass(SmaregiCustomerPointAddMessage::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerPointEventService.php:60:        $job->setPayloadSummary(sprintf('smaregiId=%s point=%d', $smaregiId, $pointChange));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerPointEventService.php:67:     * registerPointAddJob の flush / commit 成功後にのみ呼ぶ。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerPointEventService.php:70:    public function dispatchPointAddMessage(MessengerJob $job, DtbPointHistory $pointHistory): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerPointEventService.php:74:            $this->logger->error('Smaregi customer point job has no id; cannot dispatch message bus.', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerPointEventService.php:75:                'pointHistoryId' => $pointHistory->getId(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerPointEventService.php:82:            $this->messageBus->dispatch(new SmaregiCustomerPointAddMessage($pointHistory->getId(), $jobId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerPointEventService.php:94:                $this->logger->error('Failed to persist Smaregi customer point job failure state', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerPointEventService.php:96:                    'pointHistoryId' => $pointHistory->getId(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerPointEventService.php:100:            $this->logger->error('Smaregi customer point add message dispatch failed', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiCustomerPointEventService.php:103:                'pointHistoryId' => $pointHistory->getId(),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260606000001.php:85:    payment_method_en = 'Pay in full with points'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:43:     * 商品IDを検索条件として、商品情報を1件取得して返却するAPIエンドポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:82:     * 商品名をキーワードとして検索し、該当する商品の一覧を返却するAPIエンドポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:197:     * 更新日時が指定期間内の商品規格一覧を返却するAPIエンドポイント
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260126202442.php:28:        return 'mypage_point_history を dtb_page に追加';
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260126202442.php:33:        $count = $this->connection->fetchOne("SELECT COUNT(*) FROM dtb_page WHERE url = 'point_history'");
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260126202442.php:44:            [$pageId, 'MYページ/ポイント履歴', 'mypage_point_history', 'Mypage/point_history', 2]
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260126202442.php:59:        $this->connection->executeQuery("DELETE FROM dtb_page_layout WHERE page_id = (SELECT id FROM dtb_page WHERE url = 'mypage_point_history')");
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260126202442.php:60:        $this->connection->executeQuery("DELETE FROM dtb_page WHERE url = 'mypage_point_history'");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/PointGranterController.php:21:use Eccube\Service\App\PointGranter\PointGranterAction;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/PointGranterController.php:22:use Eccube\Service\App\PointGranter\PointGranterInput;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/PointGranterController.php:29:class PointGranterController extends AbstractController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/PointGranterController.php:32:        private readonly PointGranterAction $action,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/PointGranterController.php:38:     * PointGranterからのリクエストをSmaregi APIに中継するAPIエンドポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/PointGranterController.php:44:    #[Route('/admin_api/point_granter', name: 'point_granter', methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/PointGranterController.php:45:    public function processPointGranter(Request $request): JsonResponse
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/PointGranterController.php:87:            $input = new PointGranterInput(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/PointGranterController.php:93:            log_info('ポイント付与処理が正常に完了しました', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/PointGranterController.php:105:            log_error('ポイント付与処理中にエラーが発生しました', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/EventScheduleController.php:26: * イベント大会TOP のイベントスケジュール JSON を返す 5 つのエンドポイント。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/EventScheduleController.php:46:    /** 各 endpoint が返す日付範囲の幅 (= 28 日)。フロント側が ±28 日刻みで隣接するため。 */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/EventScheduleController.php:70:     * 月別タブ専用の JSON エンドポイント。指定 YYYY-MM の 1 日〜末日のスケジュールを返す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/EventScheduleController.php:123:     * JSON エンドポイントは locale prefix を持たないため、fetch 元ページ (Referer) の先頭パスセグメントから locale を判定する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ArticleController.php:39:     * WordPressの投稿IDを検索条件として、記事情報を1件取得して返却するAPIエンドポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ArticleController.php:74:     * 指定された記事IDを基準として、関連する記事のリストを取得して返却するAPIエンドポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ContentController.php:41:     * トップバナーIDを検索条件として、トップバナー情報を1件取得して返却するAPIエンドポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ContentController.php:79:     * 言語コードを検索条件として、トップバナー情報の一覧を取得して返却するAPIエンドポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:24:use Eccube\Repository\DtbPointHistoryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:25:use Eccube\Service\PointService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:29: * スマレジの売上取引 (受注 Webhook) に乗った獲得/使用ポイントを EC-CUBE 会員残高へ反映する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:32: * ポイント専用取引 (区分6/7) は {@see SmaregiPointAdjustmentApplier} が扱う（本クラスの対象外）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:35: *  - 付与ポイント (`newPoint`) を加算、使用ポイント (`spendPoint`) を減算する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:36: *    店頭受取のオンライン注文で使われたポイントは EC 側が注文時に減算済みのため、
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:37: *    Webhook の `spendPoint` には店頭レジでの使用分のみが乗る前提で二重減算しない。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:39: *  - 冪等性: 同一 `transactionHeadId` のポイント履歴が既にあれば再適用しない
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:42: * ポイント残高/履歴の更新は共通の {@see PointService} に委譲し、`transactionId` を履歴へ記録する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:44:final readonly class SmaregiOrderPointApplier
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:49:        private PointService $pointService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:50:        private DtbPointHistoryRepository $pointHistoryRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:56:     * @param Order $order ポイント付与対象の受注 (Pattern 1 は既存オンライン受注、Pattern 2-5/8 は新規受注)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:60:        // 非会員はポイント対象外。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:69:            $this->logger->warning('Smaregi point not applied: transactionHeadId is not numeric', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:77:        $gained = (int) ($transaction->newPoint ?? 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:78:        $spended = (int) ($transaction->spendPoint ?? 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:83:        // ポイント残高を持つ会員 (Player) を取得。Player が無ければ PointService 側でも
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:87:            $this->logger->warning('Smaregi point not applied: player not found for customer', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:103:            // 冪等性: 同一取引のポイント履歴が既にあれば再適用しない (ロック確立後に再確認)。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:104:            if ($this->pointHistoryRepository->existsByTransactionId($transactionId)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:106:                $this->logger->info('Smaregi point already applied for transaction, skipping', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:114:            $order->setGainedPoints($gained);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:115:            $order->setSpendedPoints($spended);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:118:            $this->pointService->gainPoints($order, $transactionId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:119:            $this->pointService->spendPoints($order, $transactionId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:130:        $this->logger->info('Smaregi point applied to member', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:133:            'gainedPoints' => $gained,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderPointApplier.php:134:            'spendedPoints' => $spended,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:19:use Eccube\Entity\Master\MtbPointType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:21:use Eccube\Repository\DtbPointHistoryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:22:use Eccube\Repository\Master\MtbPointTypeRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:23:use Eccube\Service\EntityManager\PointHistoryEntityManager;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:27: * スマレジ「ポイント専用取引」(取引区分6/7) の取消(canceled)/打消(disposed)で、
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:28: * {@see SmaregiPointAdjustmentApplier} が適用したポイントを EC-CUBE 会員残高から差し戻す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:31: *  - ポイント専用取引の履歴は受注に紐付かない (dtb_point_history.order_id が NULL) ため、
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:32: *    取引ID + order_id IS NULL で抽出する。受注由来のポイント履歴 (order_id 有り) は対象外。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:39:final readonly class SmaregiPointAdjustmentReverter
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:41:    private const REVERT_NOTE = 'スマレジ取消/打消によるポイント差し戻し';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:47:        private DtbPointHistoryRepository $pointHistoryRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:48:        private MtbPointTypeRepository $pointTypeRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:49:        private PointHistoryEntityManager $pointHistoryEntityManager,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:54:     * 指定取引IDで適用済みのポイント専用取引を差し戻す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:58:     * @return bool ポイント専用取引だった(差戻し実施 or 既に差戻し済み)場合 true、対象でなければ false
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:67:        $histories = $this->pointHistoryRepository->findPointOnlyByTransactionId($transactionId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:69:            // 受注に紐付かないポイント履歴が無い = ポイント専用取引ではない (または対象なし)。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:75:            $net += (int) $history->getPointChange();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:79:            $this->logger->info('Smaregi point adjustment already reverted, skipping', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:89:            $this->logger->warning('Smaregi point adjustment revert skipped: player not resolved', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:97:        $player->setPoint($player->getPoint() - $net);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:100:        $pointType = $this->pointTypeRepository->find(MtbPointType::PURCHASE_TYPE);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:101:        $this->pointHistoryEntityManager->save(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:105:            $pointType,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:113:        $this->logger->info('Smaregi point adjustment reverted', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentReverter.php:115:            'revertedPoint' => -$net,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/EccubeOtcPatternHandler.php:152:        // 送料/手数料/値引/税/ポイント等の非商品行は引き継がない (まとめ商品を「解いた」商品明細のみが対象)。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:22:use Eccube\Entity\Master\MtbPointType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:23:use Eccube\Repository\DtbPointHistoryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:24:use Eccube\Repository\Master\MtbPointTypeRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:25:use Eccube\Service\EntityManager\PointHistoryEntityManager;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:27:use Eccube\Service\Smaregi\SmaregiPointPushLogService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:31: * スマレジ取引区分6 (ポイント加算) / 7 (ポイント減算) の「ポイント専用取引」を
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:32: * EC-CUBE 会員ポイント残高へ反映する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:39: *  - 区分6: 付与ポイント (`newPoint`) を加算。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:40: *  - 区分7: 使用ポイント (`spendPoint`) を減算。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:42: *  - 冪等性: 同一 `transactionHeadId` のポイント履歴が既にあれば再適用しない。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:43: *  - 履歴種別はスマレジ由来ポイントとして {@see MtbPointType::PURCHASE_TYPE} で統一する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:45:final readonly class SmaregiPointAdjustmentApplier
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:55:        private DtbPointHistoryRepository $pointHistoryRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:56:        private MtbPointTypeRepository $pointTypeRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:57:        private PointHistoryEntityManager $pointHistoryEntityManager,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:58:        private SmaregiPointPushLogService $pushLogService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:63:     * 取引がポイント専用取引 (区分6/7) かどうか。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:80:        // EC-CUBE発のpoint/addが生んだ取引（送信記録に該当）は、EC-CUBE側で既にポイント反映済みのためここでは適用しない。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:82:            $this->logger->info('Smaregi point adjustment skipped: EC-originated push (self-issued)', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:92:            // ポイントは会員にしか紐付かないため、会員IDが無い取引は対象外。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:93:            $this->logger->warning('Smaregi point adjustment skipped: transaction has no customerId', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:106:            $this->logger->warning('Smaregi point adjustment skipped: member not resolved', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:117:            $this->logger->warning('Smaregi point adjustment skipped: transactionHeadId is not numeric', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:124:        $pointChange = $this->resolvePointChange($transaction);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:125:        if ($pointChange === 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:136:            // 冪等性: 同一取引のポイント履歴が既にあれば再適用しない (ロック確立後に再確認)。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:137:            if ($this->pointHistoryRepository->existsByTransactionId($transactionId)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:139:                $this->logger->info('Smaregi point adjustment already applied for transaction, skipping', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:146:            $player->setPoint($player->getPoint() + $pointChange);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:149:            $pointType = $this->pointTypeRepository->find(MtbPointType::PURCHASE_TYPE);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:150:            $this->pointHistoryEntityManager->save(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:154:                $pointType,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:155:                $pointChange,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:170:        $this->logger->info('Smaregi point adjustment applied to member', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:173:            'pointChange' => $pointChange,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:179:     * 区分6は付与ポイントを加算、区分7は使用ポイントを減算する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:181:    private function resolvePointChange(TransactionDto $transaction): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:184:            self::DIVISION_POINT_ADD => (int) ($transaction->newPoint ?? 0),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiPointAdjustmentApplier.php:185:            self::DIVISION_POINT_SUBTRACT => -(int) ($transaction->spendPoint ?? 0),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiPointPushLogService.php:19:use Eccube\Entity\DtbSmaregiPointPushLog;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiPointPushLogService.php:20:use Eccube\Repository\DtbSmaregiPointPushLogRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiPointPushLogService.php:23: * EC-CUBE発のポイント連携（point/add）が生むスマレジ取引を送信記録として保持し、webhook受信時の二重反映を抑止するためのレコードを扱う。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiPointPushLogService.php:25: * EC-CUBEがリクエストしたpoint/addの応答に含まれるtransactionHeadIdを記録し（{@see record()}）、
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiPointPushLogService.php:28:class SmaregiPointPushLogService
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiPointPushLogService.php:32:        private readonly DtbSmaregiPointPushLogRepository $repository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiPointPushLogService.php:37:     * EC-CUBEがリクエストしたpoint/addの取引IDを送信記録として永続化キューへ積む（flushは呼び出し側）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiPointPushLogService.php:58:            $log = new DtbSmaregiPointPushLog();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiPointPushLogService.php:67:     * postSmaregiPoint の成功応答（`['result' => ['transactionHeadIds' => [...]]]`）から取引IDを記録する.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product_class.sql:1:INSERT INTO public.dtb_product_class (id,product_id,sale_type_id,class_category_id1,class_category_id2,delivery_duration_id,creator_id,card_condition_id,language_id,product_status_id,section_id,shelf_number_id,base_info_id,product_code,stock,stock_unlimited,sale_limit,price01,price02,delivery_fee,visible,create_date,update_date,currency_code,point_rate,buy_price,sale_flg,belt_url,high_price_code,wholesale_price,standard_price,smaregi_alignment_flg,smaregi_product_id,smaregi_product_code,memo,card_condition_name,order_quantity_01,order_quantity_02,order_quantity_03,order_quantity_04,order_quantity_05,order_quantity_06,order_quantity_07,order_quantity_08) VALUES
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product_class.sql:6999:    point_rate,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product_class.sql:7043:    EXCLUDED.point_rate,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiCustomerApiClient.php:201:     * 会員ポイント加算（相対値での増減）.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiCustomerApiClient.php:203:     * point は増減値（負数で減算）。スマレジ側は会員ごとの失効日を持つため pointExpireDate は送らない。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiCustomerApiClient.php:208:    public function addPoint(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiCustomerApiClient.php:213:        int $point,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiCustomerApiClient.php:215:        $url = sprintf('%s/%s/pos/customers/%s/point/add', rtrim($apiUrl, '/'), $contractId, rawurlencode($smaregiCustomerId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiCustomerApiClient.php:223:                // スマレジ仕様: point は文字列形式の整数。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiCustomerApiClient.php:224:                'point' => (string) $point,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiCustomerApiClient.php:228:                'point' => $point,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiSectionApiClient.php:82:                'pointNotApplicable' => '0',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Util/Transaction/TransactionResponseParser.php:58:            pointDiscount: $this->stringOrNull($payload['pointDiscount'] ?? null),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Util/Transaction/TransactionResponseParser.php:62:            newPoint: $this->stringOrNull($payload['newPoint'] ?? null),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Util/Transaction/TransactionResponseParser.php:63:            spendPoint: $this->stringOrNull($payload['spendPoint'] ?? null),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/SmaregiMockResponder.php:29: * Phase 2 では OAuth トークンに加えて Product / Section (Category) エンドポイントを実装.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/SmaregiMockResponder.php:30: * 未実装エンドポイントは引き続き 404 を返して識別可能にする.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/SmaregiMockResponder.php:187:            'error' => 'mock_endpoint_not_implemented',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/SmaregiMockResponder.php:188:            'message' => sprintf('Mock endpoint not implemented: %s %s', $method, $path),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSmaregiPointPushLogRepository.php:19:use Eccube\Entity\DtbSmaregiPointPushLog;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSmaregiPointPushLogRepository.php:22: * @extends AbstractRepository<DtbSmaregiPointPushLog>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSmaregiPointPushLogRepository.php:24:class DtbSmaregiPointPushLogRepository extends AbstractRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSmaregiPointPushLogRepository.php:28:        parent::__construct($registry, DtbSmaregiPointPushLog::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/Response/SectionMockResponse.php:22: * スマレジ Platform API の部門 (categories) エンドポイント群へのモック応答.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/Response/CustomerMockResponse.php:22: * スマレジ Platform API の会員エンドポイント群へのモック応答.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPlayerRepository.php:136:    // public function getNextPointContactNumber(Application $app): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPlayerRepository.php:138:    //     $pointContactNumberLength = intval($app['config']['HareruyaEc']['const']['player']['point_contact_number_length']);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPlayerRepository.php:141:    //         ->select('MAX(pl.pointContactNumber)')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPlayerRepository.php:146:    //     $latestPointContactNumber = $qb->getSingleScalarResult() ?? sprintf("%0{$pointContactNumberLength}d", 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPlayerRepository.php:147:    //     $latestSerialNumber = substr($latestPointContactNumber, 0, $pointContactNumberLength - 1);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPlayerRepository.php:149:    //     $nextSerialNumber = sprintf('%0' . strval($pointContactNumberLength - 1) . 'd', $nextNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/Mock/Response/ProductMockResponse.php:22: * スマレジ Platform API の商品エンドポイント群へのモック応答.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderUsePointEventService.php:21:use Eccube\Message\SmaregiOrderUsePointMessage;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderUsePointEventService.php:26: * 注文完了時の使用ポイントをスマレジ会員ポイントへ非同期反映するための連携ジョブを扱う.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderUsePointEventService.php:28: * 受注確定と同一トランザクションで MessengerJob を INSERT し（{@see registerUsePointJob()}）、
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderUsePointEventService.php:29: * commit 成功後に {@see dispatchUsePointMessage()} でメッセージを送る（アウトボックス的な順序）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderUsePointEventService.php:31:class SmaregiOrderUsePointEventService
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderUsePointEventService.php:43:     * スマレジ未連携（smaregi_id 無し）や使用ポイント 0 の場合は連携不要のため null を返す。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderUsePointEventService.php:45:    public function registerUsePointJob(Order $Order): ?MessengerJob
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderUsePointEventService.php:52:        $spendedPoints = $Order->getSpendedPoints();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderUsePointEventService.php:53:        if ($spendedPoints === null || $spendedPoints === 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderUsePointEventService.php:58:        $job->setMessageClass(SmaregiOrderUsePointMessage::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderUsePointEventService.php:60:        $job->setPayloadSummary(sprintf('orderId=%s spendedPoints=%d', $Order->getId(), $spendedPoints));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderUsePointEventService.php:67:     * registerUsePointJob の flush / commit 成功後にのみ呼ぶ。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderUsePointEventService.php:70:    public function dispatchUsePointMessage(MessengerJob $job, Order $Order): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderUsePointEventService.php:74:            $this->logger->error('Smaregi order use-point job has no id; cannot dispatch message bus.', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderUsePointEventService.php:82:            $this->messageBus->dispatch(new SmaregiOrderUsePointMessage((int) $Order->getId(), $jobId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderUsePointEventService.php:94:                $this->logger->error('Failed to persist Smaregi order use-point job failure state', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOrderUsePointEventService.php:100:            $this->logger->error('Smaregi order use-point message dispatch failed', [
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_tag.sql:6540:		cursor: pointer;
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_tag.sql:6637:    cursor: pointer;
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_category.sql:1152:	 (543,208,1,'Fallout®: Points of Interest',3,113,'2024-04-19 17:40:34+09','2025-06-10 18:23:12+09','Fallout®: Points of Interest',false,NULL,false,false,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:24:use Eccube\Entity\DtbPointHistory;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:29: * @extends AbstractRepository<DtbPointHistory>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:31:class DtbPointHistoryRepository extends AbstractRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:38:        parent::__construct($registry, DtbPointHistory::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:42:     * 指定したスマレジ取引IDのポイント履歴が既に存在するか判定する.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:44:     * スマレジ取引由来のポイント付与の冪等性担保 (Webhook 再送・補完取得バッチでの重複付与防止) に使う。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:59:     * 指定したスマレジ取引IDの「ポイント専用取引」(受注に紐付かない = order_id が NULL) のポイント履歴を取得する.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:61:     * 受注由来 (order_id 有り) のポイント履歴と区別し、ポイント専用取引 (取引区分6/7) の
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:64:     * @return list<DtbPointHistory>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:66:    public function findPointOnlyByTransactionId(int $transactionId): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:68:        /** @var list<DtbPointHistory> $result */
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:81:     * 顧客が持つポイント履歴を取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:93:     * 有効期限を過ぎており未使用のポイントが残っているポイント履歴を持つプレイヤー一覧を取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:97:    // public function getPlayersForLostPoint($app): mixed
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:104:    //                 WHEN ph.issueDate >= :expireIssueDate AND ph.pointChange > 0 THEN ph.pointChange
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:106:    //             END) AS remainingPoint',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:109:    //         ->having($qb->expr()->gt('p.point', 'remainingPoint'))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:116:     * 指定日数後に失効となるポイントを持つプレイヤー一覧を取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:120:    // public function getPlayersForNotificationPointExpire($app, DateTime $date): mixed
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:126:    //     $qb->join('Plugin\HareruyaEc\Entity\DtbPlayer', 'p', 'WITH', 'ph.customerId = p.customerId AND p.smaregiId IS NOT NULL AND p.point > 0')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:130:    //                 WHEN ph.issueDate < :expireIssueDateEnd AND ph.pointChange > 0 THEN ph.pointChange
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:132:    //             END) AS gainPoint',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:134:    //                 WHEN ph.pointChange < 0 THEN ph.pointChange
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:136:    //             END) AS usedPoint',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:138:    //                 CASE WHEN ph.issueDate >= :expireIssueDateStart AND ph.issueDate < :expireIssueDateEnd AND ph.pointChange > 0 THEN ph.pointChange
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:140:    //             END) AS targetPoint'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:143:    //         ->having('targetPoint > 0 AND gainPoint + usedPoint > 0')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:153:     * Insert point history
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:157:    // public function addHistory(Application $app, Customer $customer, Order $order, int $point, string $note): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:159:    //     $history = new DtbPointHistory();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:162:    //         ->setPointChange($point)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:173:     * 最もポイント有効期限切れに近く、未使用のポイント履歴を取得する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:174:     * 有効期限が同日の履歴が複数ある場合は失効するポイントを合計する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:176:    public function getNextDeadlinePointHistory(DtbPlayer $player): ?DtbPointHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:178:        if ($player->getPoint() === 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:185:            ->andWhere('ph.pointChange > 0')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:190:        $pointHistories = $qb->getQuery()->getResult();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:192:        $deadlinePointHistory = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:193:        $previousPointHistory = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:194:        $totalSameDatePreviousPoint = 0;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:195:        $currentPoint = $player->getPoint();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:196:        foreach ($pointHistories as $pointHistory) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:197:            $totalSameDatePreviousPoint = $this->isSameDatePointHistory($pointHistory, $previousPointHistory) ? $totalSameDatePreviousPoint : 0;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:199:            $currentPoint -= $pointHistory->getPointChange();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:200:            if ($currentPoint <= 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:201:                $deadlinePointHistory = (clone $pointHistory)->setPointChange($currentPoint + $pointHistory->getPointChange() + $totalSameDatePreviousPoint);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:206:            $totalSameDatePreviousPoint = $this->isSameDatePointHistory($pointHistory, $previousPointHistory)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:207:                ? $totalSameDatePreviousPoint + $pointHistory->getPointChange() : $pointHistory->getPointChange();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:209:            $previousPointHistory = $pointHistory;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:212:        return $deadlinePointHistory;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:216:     * 24時間以内で二重でポイントが登録されている受注IDの取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:220:    public function findDuplicatePoint(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:229:            ->andWhere('ph.pointChange < 0')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:233:            ->addGroupBy('ph.pointChange')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:249:     * 会員のポイント履歴の合計と現在ポイントの差分がある会員を取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:251:     * @return array<int, array{player: DtbPlayer, point_history_total: int|null, point: int}>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:253:    public function getCustomersWithPointDifferential(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:259:                'SUM(ph.pointChange) AS point_history_total',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:260:                'p.point AS point',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:263:            ->having('p.point <> SUM(ph.pointChange)');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:269:     * ポイント失効日を過ぎているポイント履歴発行日を取得する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:274:        $expire = $this->eccubeConfig['eccube_customer_point_expire'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:282:     * 2つのポイント履歴が同日か判定する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:284:    private function isSameDatePointHistory(DtbPointHistory $pointHistory, ?DtbPointHistory $anotherPointHistory): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:286:        return !is_null($anotherPointHistory) && $pointHistory->getIssueDate()->format('Ymd') === $anotherPointHistory->getIssueDate()->format('Ymd');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:290:     * 有効期限を過ぎており未使用のポイントが残っているポイント履歴を持つプレイヤーを一覧で取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:292:     * @return array<array{player: DtbPlayer, remainingPoint: int}>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:294:    public function getPlayersForLostPoint(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:301:                    WHEN ph.issueDate >= :expireIssueDate AND ph.pointChange > 0 THEN ph.pointChange
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:303:                END) AS remainingPoint',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:306:            ->having('p.point > SUM(CASE WHEN ph.issueDate >= :expireIssueDate AND ph.pointChange > 0 THEN ph.pointChange ELSE 0 END)')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:313:     * 指定日数後に失効となるポイントを持つプレイヤーを一覧で取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:318:     * @return array<array{player: DtbPlayer, gainPoint: int, usedPoint: int, targetPoint: int}>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:320:    public function getPlayersForNotificationPointExpire(int $priorDays): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:328:            ->innerJoin('c.Player', 'p', 'WITH', 'p.smaregiId IS NOT NULL AND p.point > 0')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:332:                    WHEN ph.issueDate < :expireIssueDateEnd AND ph.pointChange > 0 THEN ph.pointChange
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:334:                END) AS gainPoint',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:336:                    WHEN ph.pointChange < 0 THEN ph.pointChange
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:338:                END) AS usedPoint',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:340:                    WHEN ph.issueDate >= :expireIssueDateStart AND ph.issueDate < :expireIssueDateEnd AND ph.pointChange > 0 THEN ph.pointChange
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:342:                END) AS targetPoint',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:347:                WHEN ph.issueDate >= :expireIssueDateStart AND ph.issueDate < :expireIssueDateEnd AND ph.pointChange > 0 THEN ph.pointChange
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:351:                WHEN ph.issueDate < :expireIssueDateEnd AND ph.pointChange > 0 THEN ph.pointChange
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:354:                WHEN ph.pointChange < 0 THEN ph.pointChange
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:387:                'gainPoint' => (int) $row['gainPoint'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:388:                'usedPoint' => (int) $row['usedPoint'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:389:                'targetPoint' => (int) $row['targetPoint'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:397:     * 受注に紐づく利用ポイント履歴（pointChange < 0）が存在するか判定する.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:399:     * 購入完了手続き再処理での spendPoints 冪等性判定に使う。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:400:     * 付与ポイント履歴（pointChange > 0）とは区別する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:402:    public function hasSpendPointHistoryForOrder(Order $Order): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbPointHistoryRepository.php:407:            ->andWhere('ph.pointChange < 0')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1088:     * ポイント有効期限通知メール送信
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1091:     * @param int $point
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1094:    public function sendPointExpireNotificationMail(DtbPlayer $player, int $point, \DateTimeInterface $expireDate): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1096:        log_info('ポイント有効期限通知メール送信開始');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1106:            'point' => $point,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1130:        log_info('ポイント有効期限通知メール送信完了');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1314:     * ポイント差分発生通知メール送信
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1316:     * @param array<int, array{customerId: int, pointHistoryTotal: int, point: int, pointVariance: int}> $pointVarianceList
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1318:    public function sendAdjustPointVarianceMail(array $pointVarianceList): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1320:        log_info('ポイント差分発生通知メール送信開始');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1327:            log_info('ポイント差分発生通知メールアドレス未設定のため送信せずに終了');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1333:        foreach ($pointVarianceList as $pointVariance) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1336:                $pointVariance['customerId'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1337:                $pointVariance['pointHistoryTotal'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1338:                $pointVariance['point'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1339:                $pointVariance['pointVariance'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1345:        以下のポイント差分が発生したため自動調整されました。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1346:        会員ID, 履歴合計値, 現在のポイント, 差分
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1353:            ->subject('ポイント差分発生通知メール')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1362:            log_info('ポイント差分発生通知メール送信完了');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2231:     * ポイント重複登録通知メール送信
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2237:        log_info('ポイント重複登録通知メール送信開始');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2244:            log_info('ポイント重複登録通知メールアドレス未設定のため送信せずに終了');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2253:        ポイントの重複登録を検知しました。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2254:        注文番号を確認してポイント残高を修正してください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2263:            ->subject('ポイント重複登録通知メール')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2272:            log_info('ポイント重複登録通知メール送信完了');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2279:     * ポイント利用が反映されない決済について通知メールを送信
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2281:     * @param array<int, array{order_id: int}> $notReflectedPointsUsage
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2283:    public function sendNotReflectedPointUsageAlertMail(array $notReflectedPointsUsage): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2285:        log_info('ポイント利用が反映されない決済を通知するメール送信開始');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2288:        foreach ($notReflectedPointsUsage as $notReflectedPointUsage) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2289:            $lines[] = $notReflectedPointUsage['order_id'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2303:            log_info('ポイント利用が反映されない決済を通知するメールアドレス未設定のため送信せずに終了');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2309:            ->subject('ポイント利用が反映されない決済を通知するメール')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:2320:        log_info('ポイント利用が反映されない決済を通知するメール送信完了');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/HeaderCategoriesController.php:34:     * ヘッダー 4 段目のカテゴリバーが hover 展開時に取得する JSON エンドポイント。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/AdjustPointVarianceAction.php:19:use Eccube\Repository\DtbPointHistoryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/AdjustPointVarianceAction.php:23:class AdjustPointVarianceAction
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/AdjustPointVarianceAction.php:26:        private readonly DtbPointHistoryRepository $pointHistoryRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/AdjustPointVarianceAction.php:35:        $pointDifferentials = $this->pointHistoryRepository->getCustomersWithPointDifferential();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/AdjustPointVarianceAction.php:37:        if (empty($pointDifferentials)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/AdjustPointVarianceAction.php:38:            $this->logger->info('ポイント差分発生対象なし');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/AdjustPointVarianceAction.php:43:        $pointVarianceList = [];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/AdjustPointVarianceAction.php:48:            foreach ($pointDifferentials as $pointDifferential) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/AdjustPointVarianceAction.php:49:                $player = $pointDifferential['player'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/AdjustPointVarianceAction.php:51:                $pointHistoryTotal = (int) $pointDifferential['point_history_total'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/AdjustPointVarianceAction.php:52:                $point = $pointDifferential['point'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/AdjustPointVarianceAction.php:54:                $player->setPoint($pointHistoryTotal);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/AdjustPointVarianceAction.php:57:                $pointVarianceList[] = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/AdjustPointVarianceAction.php:59:                    'pointHistoryTotal' => $pointHistoryTotal,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/AdjustPointVarianceAction.php:60:                    'point' => $point,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/AdjustPointVarianceAction.php:61:                    'pointVariance' => $point - $pointHistoryTotal,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/AdjustPointVarianceAction.php:73:        $this->mailService->sendAdjustPointVarianceMail($pointVarianceList);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:19:use Eccube\Entity\DtbPointHistory;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:20:use Eccube\Entity\Master\MtbPointType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:21:use Eccube\Repository\DtbPointHistoryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:22:use Eccube\Repository\Master\MtbPointTypeRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:23:use Eccube\Service\EntityManager\PointHistoryEntityManager;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:24:use Eccube\Service\Smaregi\SmaregiCustomerPointEventService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:27:class LostPointsAction
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:32:        private readonly DtbPointHistoryRepository $pointHistoryRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:33:        private readonly MtbPointTypeRepository $pointTypeRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:34:        private readonly SmaregiCustomerPointEventService $smaregiCustomerPointEventService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:36:        private readonly PointHistoryEntityManager $pointHistoryEntityManager,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:43:        $lostPointPlayers = $this->pointHistoryRepository->getPlayersForLostPoint();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:44:        $PointType = $this->pointTypeRepository->find(MtbPointType::GRANTED_TYPE);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:46:        if (empty($lostPointPlayers)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:47:            $this->logger->info('ポイント失効処理対象なし');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:52:        foreach ($lostPointPlayers as $lostPointPlayer) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:53:            $Player = $lostPointPlayer['player'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:54:            $remainingPoint = (int) $lostPointPlayer['remainingPoint'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:55:            $losePoint = $remainingPoint - $Player->getPoint();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:57:            if ($losePoint === 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:62:            $LostPointHistory = new DtbPointHistory();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:68:                $Player->setPoint($remainingPoint);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:71:                $this->pointHistoryEntityManager->save(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:72:                    PointHistory: $LostPointHistory,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:75:                    PointType: $PointType,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:76:                    pointChange: $losePoint,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:83:                $job = $this->smaregiCustomerPointEventService->registerPointAddJob($LostPointHistory);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:96:                $this->logger->error('ポイント失効処理に失敗しました', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:104:                    $this->logger->error('EntityManager が閉じたためポイント失効バッチを中断します（残りは次回実行で再処理）');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/LostPointsAction.php:114:                $this->smaregiCustomerPointEventService->dispatchPointAddMessage($job, $LostPointHistory);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:20:use Eccube\Entity\DtbPointHistory;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:21:use Eccube\Entity\Master\MtbPointType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:24:use Eccube\Repository\Master\MtbPointTypeRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:25:use Eccube\Service\EntityManager\PointHistoryEntityManager;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:27:class PointService
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:31:        private readonly MtbPointTypeRepository $pointTypeRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:32:        private readonly PointHistoryEntityManager $pointHistoryEntityManager,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:38:     * 受注の発生ポイントを会員ポイント残高と履歴へ反映する.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:42:    public function gainPoints(Order $Order, ?int $transactionId = null): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:54:        $gainedPoints = (int) ($Order->getGainedPoints() ?? 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:55:        if ($gainedPoints === 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:59:        $Player->setPoint($Player->getPoint() + $gainedPoints);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:62:        $PointType = $this->pointTypeRepository->find(MtbPointType::PURCHASE_TYPE);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:63:        $this->pointHistoryEntityManager->save(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:67:            $PointType,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:68:            $gainedPoints,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:76:     * 受注の利用ポイントを会員ポイント残高と履歴へ反映する.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:80:    public function spendPoints(Order $Order, ?int $transactionId = null): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:82:        $this->changeSpentPoints($Order, -1, $transactionId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:86:     * 受注の利用ポイントを会員ポイント残高へ戻し、履歴へ反映する.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:88:    public function rollbackSpentPoints(Order $Order): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:90:        $this->changeSpentPoints($Order, 1);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:94:     * 受注に紐づくポイント変動を取り消し、会員ポイント残高からも差し戻す.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:96:    public function cancelOrderPoints(Order $Order): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:108:        $Order->setGainedPoints(0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:111:        $pointDiffTotal = 0;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:112:        $PointHistories = $this->entityManager
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:113:            ->getRepository(DtbPointHistory::class)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:115:        foreach ($PointHistories as $PointHistory) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:116:            $pointDiffTotal += (int) $PointHistory->getPointChange();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:117:            $this->entityManager->remove($PointHistory);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:120:        if ($pointDiffTotal === 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:124:        $Player->setPoint($Player->getPoint() - $pointDiffTotal);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:128:    private function changeSpentPoints(Order $Order, int $sign, ?int $transactionId = null): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:140:        $spendedPoints = (int) ($Order->getSpendedPoints() ?? 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:141:        if ($spendedPoints === 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:145:        $pointChange = $spendedPoints * $sign;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:146:        $Player->setPoint($Player->getPoint() + $pointChange);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:149:        $PointType = $this->pointTypeRepository->find(MtbPointType::PURCHASE_TYPE);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:150:        $this->pointHistoryEntityManager->save(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:154:            $PointType,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointService.php:155:            $pointChange,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckNotReflectedPointUsageCommand.php:18:use Eccube\Service\Admin\Order\CheckNotReflectedPointUsageAction;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckNotReflectedPointUsageCommand.php:26: * ポイント利用未反映チェックバッチ（B05-07）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckNotReflectedPointUsageCommand.php:28: * ポイント利用が反映されない決済を検出し、通知メールを送信する。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckNotReflectedPointUsageCommand.php:32: *   bin/console eccube:check-not-reflected-point-usage
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckNotReflectedPointUsageCommand.php:35:    name: 'eccube:check-not-reflected-point-usage',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckNotReflectedPointUsageCommand.php:36:    description: 'ポイント利用未反映チェックバッチ',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckNotReflectedPointUsageCommand.php:38:class CheckNotReflectedPointUsageCommand extends Command
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckNotReflectedPointUsageCommand.php:41:        private readonly CheckNotReflectedPointUsageAction $checkNotReflectedPointUsageAction,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckNotReflectedPointUsageCommand.php:52:        $io->text('ポイント利用未反映チェックバッチ開始');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckNotReflectedPointUsageCommand.php:55:            $count = $this->checkNotReflectedPointUsageAction->handle();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckNotReflectedPointUsageCommand.php:58:                'ポイント利用未反映チェック処理でエラーが発生しました',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckNotReflectedPointUsageCommand.php:66:            $io->success('ポイント利用未反映は検出されませんでした。');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckNotReflectedPointUsageCommand.php:68:            $io->success(sprintf('ポイント利用未反映が検出されました。（%d件）', $count));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/PointExpireNotificationAction.php:19:use Eccube\Repository\DtbPointHistoryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/PointExpireNotificationAction.php:23:class PointExpireNotificationAction
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/PointExpireNotificationAction.php:26:        private readonly DtbPointHistoryRepository $pointHistoryRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/PointExpireNotificationAction.php:36:            (int) $this->eccubeConfig->get('eccube_point_expire_prior_1'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/PointExpireNotificationAction.php:37:            (int) $this->eccubeConfig->get('eccube_point_expire_prior_2'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/PointExpireNotificationAction.php:42:            $lostPointPlayers = $this->pointHistoryRepository->getPlayersForNotificationPointExpire($prior);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/PointExpireNotificationAction.php:44:            foreach ($lostPointPlayers as $lostPointPlayer) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/PointExpireNotificationAction.php:45:                $player = $lostPointPlayer['player'];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/PointExpireNotificationAction.php:46:                $lostPoint = min([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/PointExpireNotificationAction.php:47:                    $player->getPoint(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/PointExpireNotificationAction.php:48:                    $lostPointPlayer['gainPoint'] + $lostPointPlayer['usedPoint'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/PointExpireNotificationAction.php:49:                    $lostPointPlayer['targetPoint'],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/PointExpireNotificationAction.php:52:                $this->mailService->sendPointExpireNotificationMail($player, $lostPoint, $expireDate);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Customer/PointExpireNotificationAction.php:56:        $this->logger->info('ポイント有効期限通知処理完了');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbPointTypeRepository.php:19:use Eccube\Entity\Master\MtbPointType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbPointTypeRepository.php:23: * @extends AbstractRepository<MtbPointType>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbPointTypeRepository.php:25:class MtbPointTypeRepository extends AbstractRepository
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Master/MtbPointTypeRepository.php:29:        parent::__construct($registry, MtbPointType::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/S3AccessService.php:37:            'endpoint' => $config->endpoint,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/S3AccessService.php:38:            'use_path_style_endpoint' => $config->usePathStyleEndpoint,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckDuplicatePointCommand.php:18:use Eccube\Service\Admin\Order\CheckDuplicatePointAction;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckDuplicatePointCommand.php:26: * ポイント二重登録チェックバッチ（B05-06）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckDuplicatePointCommand.php:28: * ポイント二重登録が発生している注文をチェックする。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckDuplicatePointCommand.php:32: *   bin/console eccube:check-duplicate-point
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckDuplicatePointCommand.php:34:#[AsCommand(name: 'eccube:check-duplicate-point', description: 'ポイント二重登録チェックバッチ')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckDuplicatePointCommand.php:35:class CheckDuplicatePointCommand extends Command
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckDuplicatePointCommand.php:38:        private readonly CheckDuplicatePointAction $checkDuplicatePointAction,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckDuplicatePointCommand.php:46:        $io->text('ポイント二重登録チェックバッチ開始');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckDuplicatePointCommand.php:49:            $count = $this->checkDuplicatePointAction->handle();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckDuplicatePointCommand.php:52:                'ポイント二重登録チェック処理でエラーが発生しました',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckDuplicatePointCommand.php:60:            $io->success('ポイント二重登録は検出されませんでした。');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CheckDuplicatePointCommand.php:62:            $io->success(sprintf('ポイント二重登録が検出されました。（%d件）', $count));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/AdjustPointVarianceCommand.php:18:use Eccube\Service\Admin\Customer\AdjustPointVarianceAction;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/AdjustPointVarianceCommand.php:25:#[AsCommand(name: 'eccube:customer:adjust-point-variance', description: 'ポイント差分発生通知バッチ')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/AdjustPointVarianceCommand.php:26:class AdjustPointVarianceCommand extends Command
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/AdjustPointVarianceCommand.php:29:        private readonly AdjustPointVarianceAction $adjustPointVarianceAction,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/AdjustPointVarianceCommand.php:38:        $io->text('ポイント差分発生通知バッチ開始');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/AdjustPointVarianceCommand.php:41:            $this->adjustPointVarianceAction->handle();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/AdjustPointVarianceCommand.php:44:                'ポイント差分発生通知処理でエラーが発生しました',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/AdjustPointVarianceCommand.php:51:        $io->success('ポイント差分発生通知処理が完了しました。');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiUpdatePointCommand.php:18:use Eccube\Service\Smaregi\SmaregiUpdatePointAction;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiUpdatePointCommand.php:26:#[AsCommand(name: 'eccube:smaregi:update-point', description: 'スマレジ使用ポイント連携バッチ')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiUpdatePointCommand.php:27:class SmaregiUpdatePointCommand extends Command
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiUpdatePointCommand.php:30:        private readonly SmaregiUpdatePointAction $smaregiUpdatePointAction,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiUpdatePointCommand.php:59:        $io->text(sprintf('スマレジ使用ポイント連携バッチ開始 orderId=%s', $orderId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiUpdatePointCommand.php:62:            $this->smaregiUpdatePointAction->handle((int) $orderId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiUpdatePointCommand.php:65:                'スマレジ使用ポイント連携処理でエラーが発生しました',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/SmaregiUpdatePointCommand.php:72:        $io->success(sprintf('スマレジ使用ポイント連携処理が完了しました。orderId=%s', $orderId));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/S3/S3BucketConfig.php:28:        public ?string $endpoint = null,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/S3/S3BucketConfig.php:29:        public bool $usePathStyleEndpoint = false,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/S3/S3BucketConfig.php:42:     *     endpoint?: string|null,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/S3/S3BucketConfig.php:43:     *     use_path_style_endpoint?: bool,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/S3/S3BucketConfig.php:53:            endpoint: $config['endpoint'] ?? null,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/S3/S3BucketConfig.php:54:            usePathStyleEndpoint: $config['use_path_style_endpoint'] ?? false,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/PointExpireNotificationCommand.php:18:use Eccube\Service\Admin\Customer\PointExpireNotificationAction;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/PointExpireNotificationCommand.php:25:#[AsCommand(name: 'eccube:customer:point-expire-notification', description: 'ポイント有効期限通知バッチ')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/PointExpireNotificationCommand.php:26:class PointExpireNotificationCommand extends Command
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/PointExpireNotificationCommand.php:29:        private readonly PointExpireNotificationAction $pointExpireNotificationAction,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/PointExpireNotificationCommand.php:38:        $io->text('ポイント有効期限通知バッチ開始');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/PointExpireNotificationCommand.php:41:            $this->pointExpireNotificationAction->handle();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/PointExpireNotificationCommand.php:44:                'ポイント有効期限通知処理でエラーが発生しました',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/PointExpireNotificationCommand.php:51:        $io->success('ポイント有効期限通知処理が完了しました。');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/EccubeExtension.php:160:    public function getPriceFilter(float|string|null $number, int $decimals = 0, string $decPoint = '.', string $thousandsSep = ','): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/EccubeExtension.php:311:            'ppt' => 'fa-file-powerpoint-o',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/EccubeExtension.php:312:            'pptx' => 'fa-file-powerpoint-o',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/EccubeExtension.php:421:     * 公開ストレージ上のパスから URL を組み立てる（CDN 優先・未設定時は S3 エンドポイント＋バケット）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/EccubeExtension.php:433:        return rtrim((string) $this->eccubeConfig->get('s3_endpoint'), '/')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/LostPointsCommand.php:18:use Eccube\Service\Admin\Customer\LostPointsAction;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/LostPointsCommand.php:25:#[AsCommand(name: 'eccube:customer:lost-points', description: 'ポイント失効バッチ')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/LostPointsCommand.php:26:class LostPointsCommand extends Command
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/LostPointsCommand.php:29:        private readonly LostPointsAction $lostPointsAction,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/LostPointsCommand.php:38:        $io->text('ポイント失効バッチ開始');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/LostPointsCommand.php:41:            $this->lostPointsAction->handle();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/LostPointsCommand.php:44:                'ポイント失効処理でエラーが発生しました',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/LostPointsCommand.php:51:        $io->success('ポイント失効処理が完了しました。');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PlayerEntityManager.php:43:        int $point,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PlayerEntityManager.php:45:        ?string $pointContactNumber,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PlayerEntityManager.php:46:        bool $pointTransferFlg,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PlayerEntityManager.php:47:        int $pointLinkedFailureCount,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PlayerEntityManager.php:70:        $Player->setPoint($point);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PlayerEntityManager.php:72:        $Player->setPointContactNumber($pointContactNumber);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PlayerEntityManager.php:73:        $Player->setPointTransferFlg($pointTransferFlg);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PlayerEntityManager.php:74:        $Player->setPointLinkedFailureCount($pointLinkedFailureCount);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/CustomerRepository.php:96:            ->setPoint('0')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbEventRepository.php:283:     * イベント大会TOP の dummy 互換 JSON エンドポイント (5 path) で利用。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:20:use Eccube\Entity\DtbPointHistory;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:21:use Eccube\Entity\Master\MtbPointType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:24:class PointHistoryEntityManager
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:31:     * ポイント履歴を保存する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:33:     * @param DtbPointHistory|null $PointHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:36:     * @param MtbPointType|null $PointType
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:37:     * @param int|null $pointChange
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:45:        ?DtbPointHistory $PointHistory,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:48:        ?MtbPointType $PointType,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:49:        ?int $pointChange,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:54:        if ($PointHistory === null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:55:            $PointHistory = new DtbPointHistory();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:58:        $PointHistory->setCustomer($Customer)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:62:            $PointHistory->setOrder($Order);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:64:        if ($PointType !== null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:65:            $PointHistory->setPointType($PointType);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:67:        if ($pointChange !== null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:68:            $PointHistory->setPointChange($pointChange);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:71:            $PointHistory->setNote($note);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:74:            $PointHistory->setTransactionId($transactionId);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:77:        $this->entityManager->persist($PointHistory);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDailySummaryRepository.php:38:     * 総売上(order_amount_order)は値引き前金額（ポイント・クーポン値引きは考慮しない）に送料・手数料を含めた額。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbDailySummaryRepository.php:57:        -- 販売数量は商品明細の数量のみを合算する（送料・手数料・値引き・ポイント明細の数量は含めない）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1835:     * ポイント利用が反映されない決済を取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1839:    public function getNotReflectedPointsUsage(): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductList/ProductListCardViewModelBuilder.php:50: *     list_badges: array{sale: bool, reservation: bool, point_up: bool},
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductList/ProductListCardViewModelBuilder.php:309:     * @return array{sale: bool, reservation: bool, point_up: bool}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductList/ProductListCardViewModelBuilder.php:313:        $pointUp = $leadClass->getPointRate() !== null
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductList/ProductListCardViewModelBuilder.php:314:            && bccomp((string) $leadClass->getPointRate(), '0', 0) > 0;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/ProductList/ProductListCardViewModelBuilder.php:319:            'point_up' => $pointUp,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/ItemCollection.php:92:            fn (ItemInterface $OrderItem) => $OrderItem->isDiscount() || $OrderItem->isPoint());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/ItemCollection.php:150:            } elseif ($a->isDiscount() || $a->isPoint()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/ItemCollection.php:155:                if ($b->isPoint()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:20:use Eccube\Service\PointHelper;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:26: * 受注編集におけるポイント処理.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:28:class PointDiffProcessor extends ItemHolderValidator implements PurchaseProcessor
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:31:     * PointDiffProcessor constructor.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:33:    public function __construct(protected EntityManagerInterface $entityManager, protected PointHelper $pointHelper)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:50:        $diffUsePoint = $this->getDiffOfUsePoint($itemHolder, $context);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:52:        // 所有ポイント < 新規利用ポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:55:        if ($diffUsePoint > 0 && $Player !== null && $Player->getPoint() < $diffUsePoint) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:56:            $this->throwInvalidItemException('purchase_flow.over_customer_point');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:73:        $diffUsePoint = $this->getDiffOfUsePoint($itemHolder, $context);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:77:            $Player->setPoint($Player->getPoint() - (int) $diffUsePoint);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:101:        $diffUsePoint = $this->getDiffOfUsePoint($itemHolder, $context);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:105:            $Player->setPoint($Player->getPoint() + (int) $diffUsePoint);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:118:     * - ポイント設定が有効であること.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:126:        if (!$this->pointHelper->isPointEnabled()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:160:     * 利用ポイントの差を計算する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:161:     * この差が新規利用ポイントとなる
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:163:     * 使用ポイントが増えた場合プラスとなる
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:167:    protected function getDiffOfUsePoint(ItemHolderInterface $itemHolder, PurchaseContext $context): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:172:            $fromUsePoint = (string) ($OriginOrder->getSpendedPoints() ?? 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:174:            $fromUsePoint = '0';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:177:        $toUsePoint = (string) ($itemHolder->getSpendedPoints() ?? 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointDiffProcessor.php:179:        return bcsub((string) $toUsePoint, (string) $fromUsePoint);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:20:use Eccube\Service\PointHelper;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:21:use Eccube\Service\PointService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:28: * Hareruya向けの購入フローにおけるポイント処理.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:30: * EC-CUBE標準の use_point/add_point ではなく、移行元と同じく
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:31: * Order.spended_points / gained_points と Player.point を正として扱う.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:33:class PointProcessor implements DiscountProcessor, PurchaseProcessor
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:36:        private readonly PointHelper $pointHelper,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:37:        private readonly PointService $pointService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:49:        $this->pointHelper->removePointDiscountItem($itemHolder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:62:        $requestedPoint = max(0, (int) ($Order->getSpendedPoints() ?? 0));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:63:        $pointBalance = (int) ($Order->getCustomer()?->getPlayer()?->getPoint() ?? 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:64:        $paymentTotalBeforePoint = $this->getPaymentTotalBeforePoint($Order);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:65:        $additionalSpendedPoint = $this->getAdditionalSpendedPoint($context, $requestedPoint);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:67:        if ($requestedPoint > $paymentTotalBeforePoint) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:69:                $requestedPoint = $paymentTotalBeforePoint;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:76:        $spendedPointToValidate = $context->isOrderFlow() ? $additionalSpendedPoint : $requestedPoint;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:77:        if ($spendedPointToValidate > $pointBalance) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:79:                $requestedPoint = min($requestedPoint, $pointBalance);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:80:                $result ??= ProcessResult::warn(trans('purchase_flow.over_customer_point'), self::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:82:                return ProcessResult::error(trans('purchase_flow.over_customer_point'), self::class);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:87:            [$requestedPoint, $paymentResult] = $this->applyPaymentNoneIfFullyCovered($Order, $requestedPoint);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:92:            ->setSpendedPoints($requestedPoint)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:93:            ->setGainedPoints($this->calculateGainedPoints($Order, $requestedPoint))
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:94:            ->setPointPercentage($Order->getCustomer()?->getPlayer()?->getCustomerGroup()?->getPointPercentage())
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:95:            ->setAddPoint('0')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:96:            ->setUsePoint('0');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:99:        if ($requestedPoint > 0 && !$context->isOrderFlow()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:100:            // Hareruyaのポイントは1pt=1円で値引きする.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:101:            $this->pointHelper->addPointDiscountItem($Order, (string) (0 - $requestedPoint));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:115:        $this->pointService->spendPoints($itemHolder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:132:        $this->pointService->rollbackSpentPoints($itemHolder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:137:        if (!$this->pointHelper->isPointEnabled()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:153:    private function getPaymentTotalBeforePoint(Order $Order): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:161:     * 受注編集では既に確定済みの利用ポイントは残高検証の対象外とし、増加分のみを返す.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:162:     * 購入フローではリクエストされた利用ポイント全量を返す.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:164:    private function getAdditionalSpendedPoint(PurchaseContext $context, int $requestedPoint): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:167:            return $requestedPoint;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:172:            return $requestedPoint;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:175:        $originSpendedPoint = max(0, (int) ($originHolder->getSpendedPoints() ?? 0));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:177:        return max(0, $requestedPoint - $originSpendedPoint);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:183:    private function applyPaymentNoneIfFullyCovered(Order $Order, int $requestedPoint): array
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:185:        if ($requestedPoint <= 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:191:        $paymentTotalBeforePoint = (int) $Order->getSubtotal()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:195:        if ($requestedPoint < $paymentTotalBeforePoint) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:198:            return [$requestedPoint, $cleared ? ProcessResult::warn(trans('front.shopping.payment_method_unselected'), self::class) : null];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:203:            return [$requestedPoint, null];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:211:        $pointBalance = (int) ($Order->getCustomer()?->getPlayer()?->getPoint() ?? 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:214:        return [max(0, min($pointBalance, $paymentTotalWithoutCharge, $requestedPoint)), null];
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:240:    private function calculateGainedPoints(Order $Order, int $spendedPoints): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:246:        $pointPercentage = $Order->getCustomer()?->getPlayer()?->getCustomerGroup()?->getPointPercentage() ?? 0;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:247:        $pointTarget = (int) $Order->getSubtotal() - $spendedPoints;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointProcessor.php:249:        return $pointTarget > 0 ? (int) floor($pointTarget * $pointPercentage / 100) : 0;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderItemCleanupProcessor.php:24: * 受注確定時に手数料・送料・ポイント割引のOrderItemを削除する.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/OrderItemCleanupProcessor.php:48:                || $processorName === PointProcessor::class) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:25: * 加算ポイント.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:27:class AddPointProcessor extends ItemHolderPostValidator
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:32:     * AddPointProcessor constructor.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:46:        // 付与ポイントを計算
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:47:        $addPoint = $this->calculateAddPoint($itemHolder);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:48:        $itemHolder->setAddPoint($addPoint);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:52:     * 付与ポイントを計算.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:54:    private function calculateAddPoint(ItemHolderInterface $itemHolder): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:56:        $basicPointRate = $this->BaseInfo->getBasicPointRate();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:58:        // 明細ごとのポイントを集計
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:59:        $totalPoint = array_reduce($itemHolder->getItems()->toArray(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:60:            function ($carry, ItemInterface $item) use ($basicPointRate) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:61:                $pointRate = $item->getPointRate() ?: null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:63:                if ($pointRate === null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:64:                    $pointRate = $basicPointRate;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:67:                // TODO: ポイントは税抜き分しか割引されない、ポイント明細は税抜きのままでいいのか？
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:68:                $point = '0';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:69:                if ($item->isPoint()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:70:                    $pointCalc = bcmul(bcmul((string) $item->getPrice(), bcdiv((string) $pointRate, '100', 2), 2), $item->getQuantity(), 2);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:71:                    $point = (string) round((float) $pointCalc);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:72:                // Only calc point on product
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:74:                    // ポイント = 単価 * ポイント付与率 * 数量
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:75:                    $pointCalc = bcmul(bcmul((string) $item->getPrice(), bcdiv((string) $pointRate, '100', 2), 2), $item->getQuantity(), 2);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:76:                    $point = (string) round((float) $pointCalc);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:78:                    $pointCalc = bcmul(bcmul((string) $item->getPrice(), bcdiv((string) $pointRate, '100', 2), 2), $item->getQuantity(), 2);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:79:                    $point = (string) round((float) $pointCalc);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:82:                return bcadd($carry, $point);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:85:        return bccomp($totalPoint, '0') < 0 ? '0' : $totalPoint;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:93:     * - ポイント設定が有効であること.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/AddPointProcessor.php:99:        if (!$this->BaseInfo->isOptionPoint()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointRateProcessor.php:23: * 購入フローで、明細に対してポイント付与率を設定する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointRateProcessor.php:24: * ポイント明細の追加後、ポイント加算の計算前に実行する必要がある
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointRateProcessor.php:26:class PointRateProcessor extends ItemHolderPostValidator
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointRateProcessor.php:46:            if ($item->isProduct() && $item->getProductClass()->getPointRate()) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointRateProcessor.php:47:                $item->setPointRate($item->getProductClass()->getPointRate());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/PointRateProcessor.php:49:                $item->setPointRate($this->baseInfoRepository->get()->getBasicPointRate());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/TaxProcessor.php:105:     * - ポイント値引き: 不課税
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PurchaseFlow/Processor/TaxProcessor.php:131:     * - ポイント値引き: 税込
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:22:use Eccube\Repository\DtbPointHistoryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:25:use Eccube\Service\PointService;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:36:        private readonly DtbPointHistoryRepository $pointHistoryRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:37:        private readonly PointService $pointService,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:67:            $shouldUpdateSmaregiPoint = false;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:74:                if ($Order->getSpendedPoints() > 0) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:75:                    // 利用ポイント履歴の存在を識別して判定する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:76:                    if (!$this->pointHistoryRepository->hasSpendPointHistoryForOrder($Order)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:77:                        $this->pointService->spendPoints($Order);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:79:                    $shouldUpdateSmaregiPoint = true;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:94:                if (!empty($shouldUpdateSmaregiPoint)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:95:                    // スマレジポイント連携を別プロセスで実行
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:98:                        "nohup php {$projectDir}/bin/console eccube:smaregi:update-point {$Order->getId()} &"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/ResendMailAction.php:102:                        log_warning("Warning: Smaregi point update failed for Order ID {$Order->getId()}: {$process->getErrorOutput()}\n");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/CheckDuplicatePointAction.php:18:use Eccube\Repository\DtbPointHistoryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/CheckDuplicatePointAction.php:24:class CheckDuplicatePointAction
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/CheckDuplicatePointAction.php:27:        private readonly DtbPointHistoryRepository $pointHistoryRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/CheckDuplicatePointAction.php:39:        $orderIds = $this->pointHistoryRepository->findDuplicatePoint();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/CheckDuplicatePointAction.php:42:            $this->logger->info('ポイント二重登録対象なし');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/CheckNotReflectedPointUsageAction.php:22:class CheckNotReflectedPointUsageAction
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/CheckNotReflectedPointUsageAction.php:36:        $notReflectedPointsUsage = $this->orderRepository->getNotReflectedPointsUsage();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/CheckNotReflectedPointUsageAction.php:38:        if ($notReflectedPointsUsage === []) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/CheckNotReflectedPointUsageAction.php:39:            $this->logger->info('ポイント利用未反映対象なし');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/CheckNotReflectedPointUsageAction.php:44:        $this->mailService->sendNotReflectedPointUsageAlertMail($notReflectedPointsUsage);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/CheckNotReflectedPointUsageAction.php:46:        return count($notReflectedPointsUsage);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:19:use Eccube\Service\PurchaseFlow\Processor\PointProcessor;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:29:    public function __construct(private readonly WorkflowInterface $_orderStateMachine, private readonly OrderStatusRepository $orderStatusRepository, private readonly PointProcessor $pointProcessor, private readonly StockReduceProcessor $stockReduceProcessor)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:96:            'workflow.order.transition.cancel' => [['rollbackStock'], ['rollbackUsePoint']],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:97:            'workflow.order.transition.admin_cancel' => [['rollbackStock'], ['rollbackUsePoint']],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:98:            'workflow.order.transition.back_to_in_progress' => [['commitStock'], ['commitUsePoint']],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:99:            'workflow.order.transition.ship' => [['commitAddPoint']],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:100:            'workflow.order.transition.return' => [['rollbackUsePoint'], ['rollbackAddPoint']],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:101:            'workflow.order.transition.cancel_return' => [['commitUsePoint'], ['commitAddPoint']],
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:119:     * 会員の保有ポイントを減らす.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:123:    public function commitUsePoint(Event $event): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:127:        $this->pointProcessor->prepare($Order, new PurchaseContext());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:131:     * 利用ポイントを会員に戻す.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:133:    public function rollbackUsePoint(Event $event): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:137:        $this->pointProcessor->rollback($Order, new PurchaseContext());
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:163:     * 会員に加算ポイントを付与する.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:165:     * Hareruyaのポイント付与は Order.gained_points をもとに PointService 側で行う。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:166:     * EC-CUBE標準の Order.add_point / Customer.point は使用しない。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:168:    public function commitAddPoint(Event $event): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:174:     * 会員に付与した加算ポイントを取り消す.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:176:     * Hareruyaのポイント付与取消は Order.gained_points / Player.point 側で扱う。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:178:    public function rollbackAddPoint(Event $event): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:209:                                                        <span class="p-hareruya-order-list__summary-item-label">{{ 'front.mypage.shopping_history.col.point_used'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:210:                                                        <span class="p-hareruya-order-list__summary-item-value">{{ Order.spended_points }}{{ 'front.block.point.unit'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:225:                                                    <span class="p-hareruya-order-list__summary-item-label">{{ 'front.mypage.shopping_history.col.point_generated'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:226:                                                    <span class="p-hareruya-order-list__summary-item-value">{{ Order.gained_points }}{{ 'front.block.point.unit'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:22:{% include 'Block/js/point_barcode_js.twig' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:30:        breakpoints: [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:45:        const c = document.getElementById('js-ec_point_barcode');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:49:        c.querySelectorAll('a.ec-transPoint-barcode__inner__reset').forEach(function (a) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:55:        const c = document.getElementById('js-ec_point_barcode');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:77:                        <div class="p-hareruya-mypage__barcode-container ec-transPoint-barcode__inner__barcode" id="js-ec_point_barcode"></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:78:                        <div class="p-hareruya-mypage__barcode-timer ec-transPoint-barcode__inner__time" id="js-ec_point_timer" data-minutes-left="5"></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:80:                    <div class="p-hareruya-mypage__barcode-points">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:81:                        <div class="p-hareruya-mypage__barcode-point">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:82:                            <div class="p-hareruya-mypage__barcode-point-label">{{ 'front.mypage.index.current_point'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:83:                            <div class="p-hareruya-mypage__barcode-point-value">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:84:                                <span class="p-hareruya-mypage__barcode-point-number ec-transPoint-barcode__currentPoint">{{ Customer.Player.point|number_format }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:85:                                <span class="p-hareruya-mypage__barcode-point-unit">pt</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:88:                        {% if nextDeadlinePointHistory %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:89:                            {% set expiring = nextDeadlinePointHistory.pointChange <= Customer.Player.point ? nextDeadlinePointHistory.pointChange : Customer.Player.point %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:90:                            <div class="p-hareruya-mypage__barcode-point p-hareruya-mypage__barcode-point--expiring">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:91:                                <div class="p-hareruya-mypage__barcode-point-label">{{ 'front.mypage.index.point_expiring_soon'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:92:                                    <time datetime="{{ nextDeadlinePointHistory.expireDate(eccube_config.eccube_customer_point_expire)|date('Y-m-d') }}">({{ nextDeadlinePointHistory.expireDate(eccube_config.eccube_customer_point_expire)|date('Y/n/j') }})</time>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:94:                                <div class="p-hareruya-mypage__barcode-point-value">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:95:                                    <span class="p-hareruya-mypage__barcode-point-number">{{ expiring|number_format }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:96:                                    <span class="p-hareruya-mypage__barcode-point-unit">pt</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:138:                            <a class="p-hareruya-mypage__menu-link" href="{{ url('mypage_point_history') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:139:                                <i class="icon-hareruya-point-history c-hareruya-icon--xl" aria-hidden="true"></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:140:                                <span class="p-hareruya-mypage__menu-text">{{ 'front.mypage.point_history.title'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/order_receipt.twig:63:                                    <th class="point_out_">{{ 'front.mypage.order_receipt.point_out'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/order_receipt.twig:69:                                    <td class="point_out_">{{ orderReceipt.discount|number_format(0) }}<small>{{ 'front.mypage.order_receipt.point'|trans }}</small>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:123:    <script src="{{ asset('assets/hareruya/js/hareruya-shopping-point.js') }}" defer></script>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:129:    {% set canUsePoint = delivery.id is defined and delivery.id != constant('Eccube\\Entity\\Delivery::OTC') %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:501:                                        {% if BaseInfo.isOptionPoint and Order.Customer is not null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:502:                                            {% if canUsePoint %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:503:                                                {% set point_balance = Order.Customer.Player.point|default(0) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:504:                                                {% set payment_total_before_point = Order.subtotal + Order.deliveryFeeTotal + Order.charge %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:505:                                                {% set max_use_point = min(point_balance, payment_total_before_point) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:506:                                                <div class="p-hareruya-shipping__payment-point">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:507:                                                    <span class="p-hareruya-shipping__payment-point-label">{{ 'front.shopping.point_info'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:508:                                                    <div class="p-hareruya-shipping__payment-point-content" data-js-point-interaction data-point-max-balance="{{ point_balance }}" data-point-max-payment="{{ payment_total_before_point }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:509:                                                        <p class="c-hareruya-text">{{ 'front.shopping.payment.point_balance_label'|trans }}<span class="p-hareruya-shipping__payment-point-balance-unit">{{ Order.Customer.Player.Point|number_format }}pt</span></p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:511:                                                            <legend class="u-hareruya-dsp-visually-hidden">{{ 'front.shopping.payment.point_usage_method'|trans }}</legend>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:513:                                                                {% for key, child in form.pointpay %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:516:                                                                            {{ form_widget(child, { 'attr': { 'class': 'c-hareruya-radio__input', 'data-point-save': '' }, 'label': false }) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:520:                                                                        <div class="p-hareruya-shipping__payment-point-use">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:522:                                                                                {{ form_widget(child, { 'attr': { 'class': 'c-hareruya-radio__input', 'data-point-use': '' }, 'label': false }) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:525:                                                                            <div class="p-hareruya-shipping__payment-point-input-wrap" data-js-point-input-wrapper>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:526:                                                                                <div class="c-hareruya-form-input u-hareruya-w-170" data-js-point-input-field>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:527:                                                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.use_point.vars.id }}">{{ 'front.shopping.payment.use_point_count'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:528:                                                                                    {{ form_widget(form.use_point, { 'attr': { 'type': 'number', 'class': 'c-hareruya-form-input__field', 'data-point-input': '', 'data-trigger': 'change', 'min': 0, 'max': max_use_point }}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:530:                                                                                <span class="p-hareruya-shipping__payment-point-unit">pt</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:535:                                                                {{ form_errors(form.pointpay) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:536:                                                                {{ form_errors(form.use_point) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:542:                                                <div class="p-hareruya-shipping__payment-point">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:543:                                                    <span class="p-hareruya-shipping__payment-point-label">{{ 'front.shopping.point_info'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:544:                                                    <p class="c-hareruya-text">{{ 'front.shopping.point_otc_notice'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:719:                                        {% if item.is_point %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:720:                                            <dt class="p-hareruya-shipping__summary-label">{{ 'common.discount.point'|trans }}<br>({{ 'common.discount'|trans }})</dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:739:                            {% if BaseInfo.isOptionPoint and Order.Customer is not null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:740:                                <dl class="p-hareruya-shipping__summary-point">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:742:                                        <dt class="p-hareruya-shipping__summary-label">{{ 'front.shopping.point_balance'|trans }}</dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:743:                                        <dd class="p-hareruya-shipping__summary-value">{{ (Order.Customer.Player.point|default(0) - Order.SpendedPoints)|default(0)|number_format }} pt</dd>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:746:                                        <dt class="p-hareruya-shipping__summary-label"><span class="ec-font-bold">{{ 'front.shopping.add_point'|trans }}</span></dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:747:                                        <dd class="p-hareruya-shipping__summary-value"><span class="ec-font-bold">{{ Order.GainedPoints|default(0)|number_format }} pt</span></dd>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:752:                                <p class="p-hareruya-shipping__summary-notice-text"><strong class="u-hareruya-font-bold">{{ 'front.shopping.notice.point'|trans }}</strong></p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/history.twig:45:                    {% if BaseInfo.isOptionPoint %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/history.twig:47:                            <dt>{{ 'front.mypage.use_point'|trans }}</dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/history.twig:48:                            <dd>{{ Order.usePoint|number_format }} pt</dd>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/history.twig:51:                            <dt>{{ 'front.mypage.add_point'|trans }}</dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/history.twig:52:                            <dd>{{ Order.addPoint|number_format }} pt</dd>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/confirm.twig:155:            {% if BaseInfo.isOptionPoint and Order.Customer is not null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/confirm.twig:158:                    <h2>{{ 'front.shopping.point_info'|trans }}</h2>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/confirm.twig:161:                    {{ Order.SpendedPoints|default(0)|number_format }} pt
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/confirm.twig:218:                {% if BaseInfo.isOptionPoint and Order.Customer is not null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/confirm.twig:219:                <div class="ec-totalBox__pointBlock">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/confirm.twig:221:                        <dt>{{ 'front.shopping.use_point'|trans }}</dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/confirm.twig:222:                        <dd>{{ Order.SpendedPoints|default(0)|number_format }} pt</dd>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/confirm.twig:225:                        <dt><span class="ec-font-bold">{{ 'front.shopping.add_point'|trans }}</span></dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/confirm.twig:226:                        <dd><span class="ec-font-bold">{{ Order.GainedPoints|default(0)|number_format }} pt</span></dd>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/navi.twig:35:    {% if BaseInfo.option_point %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/navi.twig:36:        <p>{{ 'front.mypage.welcome__point'|trans({ '%point%': app.user.point|number_format}) }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Purchase/detail.twig:21:            cursor: pointer;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Purchase/detail.twig:31:            cursor: pointer;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:11:マークアップ・クラス: 納品 `ja/mypage/point/history/index.html` 相当（`p-hareruya-history-list--point` / `p-hareruya-history-list__list--point`）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:17:{% set mypageno = 'point_history' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:26:            url.pathname = "{{ path('mypage_point_history') }}";
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:33:        <div class="p-hareruya-history-list p-hareruya-history-list--point">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:37:                    <h1 class="c-hareruya-heading--lev1">{{ 'front.mypage.point_history.title'|trans }}</h1>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:41:                    <div class="p-hareruya-history-list__point-info">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:42:                        <p>{{ 'front.mypage.point_history.point.current_label'|trans }}:&nbsp;<strong class="u-hareruya-font-bold">{{ Customer.Player.point|number_format }}</strong>{{ 'front.mypage.point_history.col.point'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:43:                        {% if NextDeadlinePointHistory %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:45:                                {{ 'front.mypage.point_history.next_expire_label'|trans }}:&nbsp;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:46:                                <strong class="u-hareruya-font-bold">{{ (NextDeadlinePointHistory.pointChange <= Customer.Player.point ? NextDeadlinePointHistory.pointChange : Customer.Player.point)|number_format }}</strong>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:47:                                {{ 'front.mypage.point_history.col.point'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:49:                                    ({{ NextDeadlinePointHistory.expireDate(eccube_config.eccube_customer_point_expire)|date('Y/m/d') }})
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:51:                                    ({{ NextDeadlinePointHistory.expireDate(eccube_config.eccube_customer_point_expire)|date('M j, Y') }})
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:62:                                <p class="c-hareruya-text u-hareruya-font-bold">{{ 'front.mypage.point_history.range_info'|trans({ '%start%': start, '%end%': end, '%total%': pagination.totalItemCount }) }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:67:                                        <span class="c-hareruya-text--sm u-hareruya-font-bold">{{ 'front.mypage.point_history.display_count_label'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:71:                                        <select id="change-page-count" class="p-hareruya-toolbar__sort-select" aria-label="{{ 'front.mypage.point_history.display_count_label'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:74:                                                    {{ 'front.mypage.point_history.items_per_page'|trans({ '%count%': count }) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:86:                        <div class="p-hareruya-history-list__list p-hareruya-history-list__list--point">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:88:                                <span>{{ 'front.mypage.point_history.col.issue_date'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:89:                                <span>{{ 'front.mypage.point_history.col.order_no'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:90:                                <span>{{ 'front.mypage.point_history.col.point'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:91:                                <span>{{ 'front.mypage.point_history.col.expire'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:92:                                <span>{{ 'front.mypage.point_history.col.note'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:95:                            {% for PointHistory in pagination %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:99:                                            <dt>{{ 'front.mypage.point_history.col.issue_date'|trans }}</dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:102:                                                    {{ PointHistory.issueDate|date('Y/m/d') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:104:                                                    {{ PointHistory.issueDate|date('M j, Y') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:109:                                            <dt>{{ 'front.mypage.point_history.col.order_no'|trans }}</dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:111:                                                {% if PointHistory.Order is not null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:112:                                                    <a class="c-hareruya-link" href="{{ url('mypage_history', {'order_no' : PointHistory.Order.order_number}) }}"{{ csrf_token_for_anchor() }}>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:113:                                                        {% if PointHistory.transactionId is null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:114:                                                            {{ PointHistory.Order.order_number }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:116:                                                            {{ PointHistory.Order.smaregi_receipt_no }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:122:                                        <div class="p-hareruya-history-list__order-info-row {% if PointHistory.pointChange > 0 %} p-hareruya-history-list__order-info-point--plus{% elseif PointHistory.pointChange < 0 %} p-hareruya-history-list__order-info-point--minus{% endif %}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:123:                                            <dt>{{ 'front.mypage.point_history.col.point'|trans }}</dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:124:                                            <dd>{{ (PointHistory.pointChange > 0 ? '+' : '') ~ PointHistory.pointChange|number_format }}</dd>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:127:                                            <dt>{{ 'front.mypage.point_history.col.expire'|trans }}</dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:129:                                                {% if PointHistory.pointChange > 0 %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:131:                                                        {{ PointHistory.expireDate(eccube_config.eccube_customer_point_expire)|date('Y年m月d日') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:133:                                                        {{ PointHistory.expireDate(eccube_config.eccube_customer_point_expire)|date('M j, Y') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:139:                                            <dt>{{ 'front.mypage.point_history.col.note'|trans }}</dt>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:140:                                            <dd>{{ PointHistory.note }}</dd>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/point_history.twig:151:                        <p class="c-hareruya-text--sm">{{ 'front.mypage.point_history.not_found'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/default_frame.twig:66:                '.p-hareruya-header__point',
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/default_frame.twig:122:    {# Subtle, non-blocking debug indicator (pointer-events:none so it never intercepts clicks) #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/default_frame.twig:124:         style="position:fixed;left:8px;top:8px;z-index:9999;padding:2px 8px;border-radius:4px;background:rgba(220,53,69,.85);color:#fff;font-size:11px;font-weight:bold;letter-spacing:.05em;line-height:1.4;pointer-events:none;">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/breadcrumb_nav.twig:110:        {% elseif route == 'mypage_point_history' %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/breadcrumb_nav.twig:112:            {{ hareruya_breadcrumb.current_li('front.mypage.point_history.title'|trans, 3) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content.en.twig:29: Points Used : {{ (0 - data.discount)|number_format }} Points
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/shipment_complete.twig:23:　ポイント使用(値引き)：{{ (0 - data.Order.discount)|number_format }} ポイント
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:1973:	 (788,4,'剣呑な交渉','Sword-Point Diplomacy','あなたのライブラリーの一番上からカードを３枚公開する。それらの各カードにつきそれぞれ、いずれかの対戦相手が３点のライフを支払わないかぎり、そのカードをあなたの手札に加える。その後、残りを追放する。','Reveal the top three cards of your library. For each of those cards, put that card into your hand unless any opponent pays 3 life. Then exile the rest.','(2)(B)',3.0,'','','','XLN000126JN','XLN000126EN','','',false,'2018-06-07 04:31:39+09','2025-07-31 20:32:27+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:2359:	 (957,2,'圧点','Pressure Point','クリーチャー１体を対象とする。それをタップする。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:7108:Each other Samurai creature you control gets +1/+1 for each point of bushido it has.','(5)(W)',6.0,'3','3','','CHK000091JN','CHK000091EN','','',false,'2018-06-07 05:11:14+09','2025-07-31 20:40:09+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:18885:	 (7884,5,'限界点','Breaking Point','どのプレイヤーも「限界点は自分に６点のダメージを与える」ことを選んでよい。誰もそうしなかった場合、すべてのクリーチャーを破壊する。これにより破壊されたクリーチャーは再生できない。','Any player may have Breaking Point deal 6 damage to them. If no one does, destroy all creatures. Creatures destroyed this way can''t be regenerated.','(1)(R)(R)',3.0,'','','','DD-SvT000015JN','DD-SvT000015EN','','',false,'2018-06-12 01:47:22+09','2025-07-31 21:13:48+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:23294:	 (10051,2,'微光角の鹿','Glimmerpoint Stag','警戒
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:23296:When Glimmerpoint Stag enters the battlefield, exile another target permanent. Return that card to the battlefield under its owner''s control at the beginning of the next end step.','(2)(W)(W)',4.0,'3','3','','EMA000012JN','EMA000012EN','','',false,'2018-06-29 01:03:49+09','2025-07-31 21:21:23+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:31223:	 (13964,5,'狙いすましたなだれ','Pinpoint Avalanche','クリーチャー１体を対象とする。狙いすましたなだれはそれに４点のダメージを与える。このダメージは軽減できない。','Pinpoint Avalanche deals 4 damage to target creature. The damage can''t be prevented.','(3)(R)(R)',5.0,'','','','ONS000287JN','ONS000287EN','','',false,'2018-07-11 03:41:37+09','2025-07-31 21:31:25+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:34741:	 (17289,5,'槍先のオリアード','Spearpoint Oread','授与(５)(赤)（このカードを授与コストで唱えた場合、これはエンチャント（クリーチャー）を持つオーラ(Aura)呪文である。クリーチャーにつけられていない場合、これは再びクリーチャーになる。）
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:42469:Are you aware that any time you say something that isn''t a question, when a player points out this fact first, they gain control of Question Elemental?','(2)(U)(U)',4.0,'3','4','','UNH000094EN','UNH000094EN','','',false,'2018-09-06 02:23:35+09','2025-07-31 21:47:12+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:42621:	 (22116,90,'Pointy Finger of Doom','Pointy Finger of Doom','','','',4.0,'','','','UNH000073EN','UNH000073EN','','',false,'2018-09-06 02:23:38+09','2025-07-31 21:47:18+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:43841:	 (23212,9,'的中','Get the Point','クリーチャー１体を対象とし、それを破壊する。占術１を行う。','Destroy target creature. Scry 1.','(3)(B)(R)',5.0,'','','','RNA000176JN','RNA000176EN','','',false,'2019-01-19 00:05:07+09','2025-07-31 21:48:55+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:45466:Enchanted player has teaching and is a Magic Guru. You and enchanted player each add five Guru points to your Guru pool. (Gurus teach the Magic game and get free booster packs and unique basic land cards).','(W)(U)(B)(R)(G)',5.0,'','','',NULL,NULL,'','',false,'2019-06-24 22:38:23+09','2022-09-22 23:10:44+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:48179:	 (26354,2,'検問官','Checkpoint Officer','{1}{White}, {Tap}：クリーチャー１体を対象とし、それをタップする。','{1}{White}, {Tap}: Tap target creature.','(1)(W)',2.0,'1','2','',NULL,NULL,'','',false,'2020-04-12 05:33:22+09','2025-07-31 21:54:37+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:52360:	 (28457,4,'激しい落胆','Crushing Disappointment','各プレイヤーはそれぞれ２点のライフを失う。あなたはカード２枚を引く。','Each player loses 2 life. You draw two cards.','(3)(B)',4.0,'','','',NULL,NULL,'','',false,'2021-04-08 04:42:11+09','2025-07-31 21:58:57+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:52932:あなたがコントロールしているクリーチャー１体が対戦相手１人に戦闘ダメージを与えるたび、ストリクスヘイヴンの競技場の上に得点カウンター１個を置く。その後、これの上に10個以上の得点カウンターが置かれているなら、それらすべてを取り除き、そのプレイヤーはこのゲームに敗北する。','{Tap}: Add {Colorless}. Put a point counter on Strixhaven Stadium.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:52933:Whenever a creature deals combat damage to you, remove a point counter from Strixhaven Stadium.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:52934:Whenever a creature you control deals combat damage to an opponent, put a point counter on Strixhaven Stadium. Then if it has ten or more point counters on it, remove them all and that player loses the game.','-3',3.0,'','','',NULL,NULL,'','',false,'2021-04-08 04:42:22+09','2025-07-31 21:59:31+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:58049:	 (30998,4,'当て付けの議論','Pointed Discussion','あなたはカード２枚を引き、２点のライフを失う。その後、血・トークン１つを生成する。（それは「{1}, {Tap}, カード１枚を捨てる, このアーティファクトを生け贄に捧げる：カード１枚を引く。」を持つアーティファクトである。）','You draw two cards, lose 2 life, then create a Blood token. (It''s an artifact with "{1}, {Tap}, Discard a card, Sacrifice this artifact: Draw a card.")','(2)(B)',3.0,'','','',NULL,NULL,'','',false,'2021-11-08 05:44:12+09','2025-07-31 22:03:51+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:74878:	 (37876,102,'時の固定点','Fixed Point in Time','あなたが時の固定点に遭遇したとき、次のあなたのターンまで、プレイヤーが次元ダイスを振った結果としてプレインズウォークするなら、代わりにカオスが起こる。（その後、この現象からプレインズウォークする。）','When you encounter Fixed Point in Time, until your next turn, if a player would planeswalk as a result of rolling the planar die, chaos ensues instead. (Then planeswalk away from this phenomenon.)','0',0.0,'','','',NULL,NULL,'','',false,'2023-10-08 04:02:56+09','2025-07-31 22:27:36+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:74891:カオスが起こるたび、対戦相手がコントロールしているクリーチャー１体を対象とする。シレンシオ湖はそれに６点のダメージを与える。このターン、これによりダメージを受けたクリーチャーが死亡するなら、代わりにそれを追放する。','Still Point in Time — All spells have split second. (As long as a spell with split second is on the stack, players can''t cast spells or activate abilities that aren''t mana abilities.)
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:75898:{2}, {Tap}: Draw a card and put a point counter on Contested Game Ball. Then if it has five or more point counters on it, sacrifice it and create a Treasure token.','-2',2.0,'','','',NULL,NULL,'','',false,'2023-11-05 02:40:54+09','2025-07-31 22:28:29+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:77683:	 (39572,8,'異議あり','Counterpoint','呪文１つを対象とする。それを打ち消す。あなたの墓地から、クリーチャーやインスタントやソーサリーやプレインズウォーカーであり、マナ総量がその呪文以下である呪文１つを、マナ・コストを支払うことなく唱えてもよい。','Counter target spell. You may cast a creature, instant, sorcery, or planeswalker spell from your graveyard with mana value less than or equal to that spell''s mana value without paying its mana cost.','(3)(U)(B)',5.0,'','','',NULL,NULL,'','',false,'2024-01-28 05:27:41+09','2025-07-31 22:29:49+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:79456:	 (40381,9,'ナイフによる脅迫','At Knifepoint','あなたのターンの間、あなたがコントロールしているすべての無法者は先制攻撃を持つ。（暗殺者、海賊、邪術師、ならず者、傭兵が無法者である。）
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:81806:	 (41356,6,'ビューポイントのシンクロ','Viewpoint Synchronization','フリーランニング{2}{Green}
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:81935:	 (41390,90,'そびえ立つビューポイント','Towering Viewpoint','防衛、到達
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:86288:	 (43208,6,'活路を指せ','Point the Way','エンジン始動！（あなたが速度を持たないなら、１から始まる。速度はあなたの各ターンに１回、対戦相手がライフを失ったとき、１上がる。最高速度は４である。）
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card.sql:89727:	 (44476,4,'零地点のバラード','Zero Point Ballad','','','(X)(B)',1.0,'','','',NULL,NULL,'','',false,'2025-07-20 01:13:27+09','2025-08-17 04:22:46+09'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content_tax.en.twig:29: Points Used : {{ (0 - data.discount)|number_format }} Points
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Front/Event/EventScheduleJsonBuilder.php:27: * フロント側ビルド済 JS (hareruya-event.js) がブラウザから fetch する 5 endpoint
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:2128:	 (126130,17606,1,2,324,68,1,NULL,'見るものの視点により、その印章が示すものは、自然の巡りを護る名誉ある守護者にも、永遠の生命のために魂を闇に売り渡した者にもなる。','Depending on your point of view, the seal represents a proud guardian of the natural cycle or one who has sold her soul to darkness for eternal life.','{1}, {Tap}：{Black}{Green}を加える。','{1}, {Tap}: Add {Black}{Green}.','','','131',0,false,0,'2023-01-31 22:13:53+09','2025-07-31 21:37:47+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:4719:	 (127244,35936,1,1,325,2852,1,NULL,'「君はいつも物分かりのいい生徒だったね。理解するまで時間がかかってしまったのは残念だよ。」','"You always were such a sharp student. Shame it took you so long to get the point."','１つを対象とする。焼尽の逆刺はそれに２点のダメージを与える。それがクリーチャーなら、このターン、それではブロックできない。培養１を行う。（培養器・トークン１つを、「{2}：このアーティファクトを変身させる。」を持ち、＋１/＋１カウンター１個が置かれた状態で生成する。それは０/０のファイレクシアン・アーティファクト・クリーチャーに変身する。）','Searing Barb deals 2 damage to any target. If it''s a creature, it can''t block this turn. Incubate 1. (Create an Incubator token with a +1/+1 counter on it and "{2}: Transform this artifact." It transforms into a 0/0 Phyrexian artifact creature.)','','','163',0,false,0,'2023-04-07 04:54:26+09','2025-07-31 22:23:04+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:5996:	 (127586,35936,1,1,325,2852,1,NULL,'「君はいつも物分かりのいい生徒だったね。理解するまで時間がかかってしまったのは残念だよ。」','"You always were such a sharp student. Shame it took you so long to get the point."','１つを対象とする。焼尽の逆刺はそれに２点のダメージを与える。それがクリーチャーなら、このターン、それではブロックできない。培養１を行う。（培養器・トークン１つを、「{2}：このアーティファクトを変身させる。」を持ち、＋１/＋１カウンター１個が置かれた状態で生成する。それは０/０のファイレクシアン・アーティファクト・クリーチャーに変身する。）','Searing Barb deals 2 damage to any target. If it''s a creature, it can''t block this turn. Incubate 1. (Create an Incubator token with a +1/+1 counter on it and "{2}: Transform this artifact." It transforms into a 0/0 Phyrexian artifact creature.)','','','163',1,false,0,'2023-04-07 20:28:28+09','2025-07-31 22:23:04+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:19261:	 (132478,26320,1,3,335,16,1,NULL,'新しい友達がすぐに疲れて遊ぶのをやめてしまったので、オツリーミはがっかりした。','Otrimi was disappointed at how quickly its new friend got tired and stopped playing.','あなたが統率者をコントロールしているなら、この呪文をマナ・コストを支払うことなく唱えてもよい。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:20153:	 (132756,3815,1,2,335,136,1,NULL,'ある時点までは、魔法使いが欲しいものと言えば時間だけだった。それを超えると何もなくなる。','At a certain point, the only thing a wizard wants for is time. And after that, nothing.','あなたの手札の上限はなくなる。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:20678:	 (132946,26320,1,3,335,16,1,NULL,'新しい友達がすぐに疲れて遊ぶのをやめてしまったので、オツリーミはがっかりした。','Otrimi was disappointed at how quickly its new friend got tired and stopped playing.','あなたが統率者をコントロールしているなら、この呪文をマナ・コストを支払うことなく唱えてもよい。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:21573:	 (133224,3815,1,2,335,136,1,NULL,'ある時点までは、魔法使いが欲しいものと言えば時間だけだった。それを超えると何もなくなる。','At a certain point, the only thing a wizard wants for is time. And after that, nothing.','あなたの手札の上限はなくなる。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:22827:	 (133628,26320,1,3,336,16,1,NULL,'新しい友達がすぐに疲れて遊ぶのをやめてしまったので、オツリーミはがっかりした。','Otrimi was disappointed at how quickly its new friend got tired and stopped playing.','あなたが統率者をコントロールしているなら、この呪文をマナ・コストを支払うことなく唱えてもよい。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:23363:	 (133784,3815,1,2,336,136,1,NULL,'ある時点までは、魔法使いが欲しいものと言えば時間だけだった。それを超えると何もなくなる。','At a certain point, the only thing a wizard wants for is time. And after that, nothing.','あなたの手札の上限はなくなる。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:23498:	 (133816,26320,1,3,336,16,1,NULL,'新しい友達がすぐに疲れて遊ぶのをやめてしまったので、オツリーミはがっかりした。','Otrimi was disappointed at how quickly its new friend got tired and stopped playing.','あなたが統率者をコントロールしているなら、この呪文をマナ・コストを支払うことなく唱えてもよい。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:23895:	 (133947,3815,1,2,336,136,1,NULL,'ある時点までは、魔法使いが欲しいものと言えば時間だけだった。それを超えると何もなくなる。','At a certain point, the only thing a wizard wants for is time. And after that, nothing.','あなたの手札の上限はなくなる。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:24029:	 (133979,26320,1,3,336,16,1,NULL,'新しい友達がすぐに疲れて遊ぶのをやめてしまったので、オツリーミはがっかりした。','Otrimi was disappointed at how quickly its new friend got tired and stopped playing.','あなたが統率者をコントロールしているなら、この呪文をマナ・コストを支払うことなく唱えてもよい。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:31408:	 (136843,25490,1,3,221,53,103,NULL,'死は、称賛に値する信念を無意味な執着に変えた。','Death turned admirable conviction into pointless intransigence.','先制攻撃
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:32382:	 (137085,27080,1,3,242,66,103,NULL,'ゴブリン騎兵の戦術は、獣に向きを示すことと、できるかぎり長くしがみついていることからなる。','Goblin cavalry tactics consist of pointing a beast in a direction and hanging on for as long as possible.','トランプル、速攻
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:33051:あなたがコントロールしているクリーチャー１体が対戦相手１人に戦闘ダメージを与えるたび、ストリクスヘイヴンの競技場の上に得点カウンター１個を置く。その後、これの上に10個以上の得点カウンターが置かれているなら、それらすべてを取り除き、そのプレイヤーはこのゲームに敗北する。','{Tap}: Add {Colorless}. Put a point counter on Strixhaven Stadium.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:33052:Whenever a creature deals combat damage to you, remove a point counter from Strixhaven Stadium.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:33053:Whenever a creature you control deals combat damage to an opponent, put a point counter on Strixhaven Stadium. Then if it has ten or more point counters on it, remove them all and that player loses the game.','','','259',0,true,0,'2023-10-04 20:51:37+09','2025-07-31 21:59:31+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:33594:	 (137398,9121,1,3,271,1279,103,NULL,'恐れる者は血の祭りの前に処置を求める。罪人は祭りの後で処置を求める。','It disables with pinpoint accuracy.','真髄の針が戦場に出るに際し、カードの名前１つを選ぶ。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:37397:	 (138315,25490,1,3,221,53,103,NULL,'死は、称賛に値する信念を無意味な執着に変えた。','Death turned admirable conviction into pointless intransigence.','先制攻撃
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:38378:	 (138557,27080,1,3,242,66,103,NULL,'ゴブリン騎兵の戦術は、獣に向きを示すことと、できるかぎり長くしがみついていることからなる。','Goblin cavalry tactics consist of pointing a beast in a direction and hanging on for as long as possible.','トランプル、速攻
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:39047:あなたがコントロールしているクリーチャー１体が対戦相手１人に戦闘ダメージを与えるたび、ストリクスヘイヴンの競技場の上に得点カウンター１個を置く。その後、これの上に10個以上の得点カウンターが置かれているなら、それらすべてを取り除き、そのプレイヤーはこのゲームに敗北する。','{Tap}: Add {Colorless}. Put a point counter on Strixhaven Stadium.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:39048:Whenever a creature deals combat damage to you, remove a point counter from Strixhaven Stadium.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:39049:Whenever a creature you control deals combat damage to an opponent, put a point counter on Strixhaven Stadium. Then if it has ten or more point counters on it, remove them all and that player loses the game.','','','259',1,true,0,'2023-10-05 23:15:20+09','2025-07-31 21:59:31+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:39584:	 (138870,9121,1,3,271,1279,103,NULL,'恐れる者は血の祭りの前に処置を求める。罪人は祭りの後で処置を求める。','It disables with pinpoint accuracy.','真髄の針が戦場に出るに際し、カードの名前１つを選ぶ。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:42313:	 (139502,37733,1,1,341,3027,1,NULL,'「時間は原因から結果への直線だと考えられている。だが実際は、非線形的客観的視野では、もっと不定的で時間的なものなんだ。」','"People assume time is a strict progression of cause to effect, but actually, from a non-linear, non-subjective viewpoint, it''s more like a big ball of wibbly-wobbly, timey-wimey stuff."','タイムトラベルを行う。（あなたがオーナーである待機状態の各カードやあなたがコントロールしていて時間カウンターが置かれている各パーマネントにつきそれぞれ、それの上に時間カウンター１個を置くか取り除くかしてもよい。）
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:43872:	 (140018,37876,1,1,341,2961,1,NULL,'','','あなたが時の固定点に遭遇したとき、次のあなたのターンまで、プレイヤーが次元ダイスを振った結果としてプレインズウォークするなら、代わりにカオスが起こる。（その後、この現象からプレインズウォークする。）','When you encounter Fixed Point in Time, until your next turn, if a player would planeswalk as a result of rolling the planar die, chaos ensues instead. (Then planeswalk away from this phenomenon.)','','','582',0,false,0,'2023-10-08 04:02:56+09','2025-07-31 22:27:36+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:43885:カオスが起こるたび、対戦相手がコントロールしているクリーチャー１体を対象とする。シレンシオ湖はそれに６点のダメージを与える。このターン、これによりダメージを受けたクリーチャーが死亡するなら、代わりにそれを追放する。','Still Point in Time — All spells have split second. (As long as a spell with split second is on the stack, players can''t cast spells or activate abilities that aren''t mana abilities.)
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:44100:	 (140103,37733,1,1,341,3027,1,NULL,'「時間は原因から結果への直線だと考えられている。だが実際は、非線形的客観的視野では、もっと不定的で時間的なものなんだ。」','"People assume time is a strict progression of cause to effect, but actually, from a non-linear, non-subjective viewpoint, it''s more like a big ball of wibbly-wobbly, timey-wimey stuff."','タイムトラベルを行う。（あなたがオーナーである待機状態の各カードやあなたがコントロールしていて時間カウンターが置かれている各パーマネントにつきそれぞれ、それの上に時間カウンター１個を置くか取り除くかしてもよい。）
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:45752:	 (140655,37733,1,1,341,3027,1,NULL,'「時間は原因から結果への直線だと考えられている。だが実際は、非線形的客観的視野では、もっと不定的で時間的なものなんだ。」','"People assume time is a strict progression of cause to effect, but actually, from a non-linear, non-subjective viewpoint, it''s more like a big ball of wibbly-wobbly, timey-wimey stuff."','タイムトラベルを行う。（あなたがオーナーである待機状態の各カードやあなたがコントロールしていて時間カウンターが置かれている各パーマネントにつきそれぞれ、それの上に時間カウンター１個を置くか取り除くかしてもよい。）
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:51609:――ファートリ','"This weapon embodies both the strength and the weakness of the Legion of Dusk. They will endure any pain to achieve their ends, but they suffer pointlessly just to prove their dedication."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:52121:{2}, {Tap}: Draw a card and put a point counter on Contested Game Ball. Then if it has five or more point counters on it, sacrifice it and create a Treasure token.','','','251',0,false,0,'2023-11-05 02:40:54+09','2025-07-31 22:28:29+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:53019:――ファートリ','"This weapon embodies both the strength and the weakness of the Legion of Dusk. They will endure any pain to achieve their ends, but they suffer pointlessly just to prove their dedication."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:53539:{2}, {Tap}: Draw a card and put a point counter on Contested Game Ball. Then if it has five or more point counters on it, sacrifice it and create a Treasure token.','','','251',1,false,0,'2023-11-05 03:09:41+09','2025-07-31 22:28:29+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:65473:	 (148283,25529,1,3,354,13,1,NULL,'それに遭遇したことは確実に人生で最も後悔すべきことのひとつである。','Meeting one is definitely the low point of your life.','あなたがカード１枚を引くたび、{1}を支払ってもよい。そうしたなら、水底のクラーケンの上に＋１/＋１カウンター１個を置き、青の１/１の触手・クリーチャー・トークン１体を生成する。','Whenever you draw a card, you may pay {1}. If you do, put a +1/+1 counter on Nadir Kraken and create a 1/1 blue Tentacle creature token.','2','3','112',0,false,0,'2024-01-28 05:27:43+09','2025-07-31 21:53:48+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:66016:――ジェイス・ベレレン','"This is it! All the cryptoliths point here!"
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:69702:	 (150350,39797,1,3,356,53,1,NULL,'世界の終わりは予想通り起こった。増えすぎた人間、足りない土地、資源の枯渇。詳細に分け入ったところで中身は凡庸であり無意味である。しかしその理由はいつものことながら、まったくもって人間臭い。','The end of the world occurred as predicted: too many humans, not enough space or resources to go around. The details are trivial and pointless. The reasons, as always, purely human ones.','ターン終了時まで、すべてのクリーチャーは－Ｘ/－Ｘの２倍の修整を受ける。各プレイヤーはそれぞれＲＡＤカウンターＸ個を得る。','Each creature gets twice -X/-X until end of turn. Each player gets X rad counters.','','','47',0,false,0,'2024-02-27 04:19:27+09','2025-07-31 22:30:16+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:70255:	 (150506,4666,1,2,356,1308,1,NULL,'秋分の日に悟りを開きし者の忠実な信者たちは、冒涜的な無知な輩の妨害を顧みず、賢きモスマンを拝むために聖地ポイント・プレザントへの巡礼を果たすのである。','Loyal members of the Enlightened return to Point Pleasant during the seasonal equinox to honor the Wise Mothman, despite interference from the blasphemous "Dim Ones."','あなたがコントロールしていて+1/+1カウンターが置かれているクリーチャー1体につき1枚のカードを引く。ターン終了時まで、それらのクリーチャーは破壊不能を得る。','Draw a card for each creature you control with a +1/+1 counter on it. Those creatures gain indestructible until end of turn. (Damage and effects that say "destroy" don''t destroy them.)','','','203',0,false,0,'2024-02-27 04:19:32+09','2025-07-31 20:51:07+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:70544:	 (150604,19272,1,2,356,1329,1,NULL,'ウェイストランドを生き抜くワンポイントアドバイス：デスクローは泳げない。','Wasteland survival tip: deathclaws can''t swim.','{Tap}：{Colorless}を加える。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:70632:	 (150634,39797,1,3,359,3134,1,NULL,'世界の終わりは予想通り起こった。増えすぎた人間、足りない土地、資源の枯渇。詳細に分け入ったところで中身は凡庸であり無意味である。しかしその理由はいつものことながら、まったくもって人間臭い。','The end of the world occurred as predicted: too many humans, not enough space or resources to go around. The details are trivial and pointless. The reasons, as always, purely human ones.','ターン終了時まで、すべてのクリーチャーは－Ｘ/－Ｘの２倍の修整を受ける。各プレイヤーはそれぞれＲＡＤカウンターＸ個を得る。','Each creature gets twice -X/-X until end of turn. Each player gets X rad counters.','','','331',0,false,0,'2024-02-27 04:19:36+09','2025-07-31 22:30:16+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:71539:	 (150878,39797,1,3,356,53,1,NULL,'世界の終わりは予想通り起こった。増えすぎた人間、足りない土地、資源の枯渇。詳細に分け入ったところで中身は凡庸であり無意味である。しかしその理由はいつものことながら、まったくもって人間臭い。','The end of the world occurred as predicted: too many humans, not enough space or resources to go around. The details are trivial and pointless. The reasons, as always, purely human ones.','ターン終了時まで、すべてのクリーチャーは－Ｘ/－Ｘの２倍の修整を受ける。各プレイヤーはそれぞれＲＡＤカウンターＸ個を得る。','Each creature gets twice -X/-X until end of turn. Each player gets X rad counters.','','','575',1,false,0,'2024-02-27 04:19:43+09','2025-07-31 22:30:16+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:72091:	 (151034,4666,1,2,356,1308,1,NULL,'秋分の日に悟りを開きし者の忠実な信者たちは、冒涜的な無知な輩の妨害を顧みず、賢きモスマンを拝むために聖地ポイント・プレザントへの巡礼を果たすのである。','Loyal members of the Enlightened return to Point Pleasant during the seasonal equinox to honor the Wise Mothman, despite interference from the blasphemous "Dim Ones."','あなたがコントロールしていて+1/+1カウンターが置かれているクリーチャー1体につき1枚のカードを引く。ターン終了時まで、それらのクリーチャーは破壊不能を得る。','Draw a card for each creature you control with a +1/+1 counter on it. Those creatures gain indestructible until end of turn. (Damage and effects that say "destroy" don''t destroy them.)','','','731',1,false,0,'2024-02-27 04:19:47+09','2025-07-31 20:51:07+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:72383:	 (151132,19272,1,2,356,1329,1,NULL,'ウェイストランドを生き抜くワンポイントアドバイス：デスクローは泳げない。','Wasteland survival tip: deathclaws can''t swim.','{Tap}：{Colorless}を加える。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:72470:	 (151162,39797,1,3,359,3134,1,NULL,'世界の終わりは予想通り起こった。増えすぎた人間、足りない土地、資源の枯渇。詳細に分け入ったところで中身は凡庸であり無意味である。しかしその理由はいつものことながら、まったくもって人間臭い。','The end of the world occurred as predicted: too many humans, not enough space or resources to go around. The details are trivial and pointless. The reasons, as always, purely human ones.','ターン終了時まで、すべてのクリーチャーは－Ｘ/－Ｘの２倍の修整を受ける。各プレイヤーはそれぞれＲＡＤカウンターＸ個を得る。','Each creature gets twice -X/-X until end of turn. Each player gets X rad counters.','','','859',1,false,0,'2024-02-27 04:19:51+09','2025-07-31 22:30:16+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:73406:	 (151418,39797,1,3,356,53,1,NULL,'世界の終わりは予想通り起こった。増えすぎた人間、足りない土地、資源の枯渇。詳細に分け入ったところで中身は凡庸であり無意味である。しかしその理由はいつものことながら、まったくもって人間臭い。','The end of the world occurred as predicted: too many humans, not enough space or resources to go around. The details are trivial and pointless. The reasons, as always, purely human ones.','ターン終了時まで、すべてのクリーチャーは－Ｘ/－Ｘの２倍の修整を受ける。各プレイヤーはそれぞれＲＡＤカウンターＸ個を得る。','Each creature gets twice -X/-X until end of turn. Each player gets X rad counters.','','','47',1,false,0,'2024-02-27 05:03:22+09','2025-07-31 22:30:16+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:73947:	 (151574,4666,1,2,356,1308,1,NULL,'秋分の日に悟りを開きし者の忠実な信者たちは、冒涜的な無知な輩の妨害を顧みず、賢きモスマンを拝むために聖地ポイント・プレザントへの巡礼を果たすのである。','Loyal members of the Enlightened return to Point Pleasant during the seasonal equinox to honor the Wise Mothman, despite interference from the blasphemous "Dim Ones."','あなたがコントロールしていて+1/+1カウンターが置かれているクリーチャー1体につき1枚のカードを引く。ターン終了時まで、それらのクリーチャーは破壊不能を得る。','Draw a card for each creature you control with a +1/+1 counter on it. Those creatures gain indestructible until end of turn. (Damage and effects that say "destroy" don''t destroy them.)','','','203',1,false,0,'2024-02-27 05:03:27+09','2025-07-31 20:51:07+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:74239:	 (151672,19272,1,2,356,1329,1,NULL,'ウェイストランドを生き抜くワンポイントアドバイス：デスクローは泳げない。','Wasteland survival tip: deathclaws can''t swim.','{Tap}：{Colorless}を加える。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:74326:	 (151702,39797,1,3,359,3134,1,NULL,'世界の終わりは予想通り起こった。増えすぎた人間、足りない土地、資源の枯渇。詳細に分け入ったところで中身は凡庸であり無意味である。しかしその理由はいつものことながら、まったくもって人間臭い。','The end of the world occurred as predicted: too many humans, not enough space or resources to go around. The details are trivial and pointless. The reasons, as always, purely human ones.','ターン終了時まで、すべてのクリーチャーは－Ｘ/－Ｘの２倍の修整を受ける。各プレイヤーはそれぞれＲＡＤカウンターＸ個を得る。','Each creature gets twice -X/-X until end of turn. Each player gets X rad counters.','','','331',1,false,0,'2024-02-27 05:03:32+09','2025-07-31 22:30:16+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_4.sql:92485:	 (159102,41340,1,3,374,NULL,1,NULL,'「ブラスナックルをこっちによこせ、喧嘩の相手は誰だ。」','"Toss me my brass knuckles and point me to a good brawl."','エヴィー・フライとの共闘
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:2439:――管区の案内人、タミーナ','"The shortest path between two points is not always the safest."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:6874:	 (89898,27447,1,7,223,269,1,NULL,'“Bonus points for covering their heads and protecting them from head trauma from hostiles and calamities.”
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:6875:—Eugene Porter','“Bonus points for covering their heads and protecting them from head trauma from hostiles and calamities.”
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:6960:	 (90357,27740,1,1,251,35,1,NULL,'怒声と爆音から離れ旋回しながら上昇した。空と煙が溶け合う高さに達すると、地平に一瞬目をやり、狙いを定めて急降下した。','It wheeled upward, away from the shrieks and thunder. It reached the point where sky met smoke, and, with but a glance at the horizon, aimed itself and dove.','飛行、先制攻撃','Flying, first strike','1','2','3',0,false,0,'2021-01-25 04:47:40+09','2025-07-31 21:57:51+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:7167:――ティボルト','"Oh, Valki. I''m disappointed in you. How could the god of lies be so gullible?"
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:8917:	 (90878,27740,1,1,251,35,1,NULL,'怒声と爆音から離れ旋回しながら上昇した。空と煙が溶け合う高さに達すると、地平に一瞬目をやり、狙いを定めて急降下した。','It wheeled upward, away from the shrieks and thunder. It reached the point where sky met smoke, and, with but a glance at the horizon, aimed itself and dove.','飛行、先制攻撃','Flying, first strike','1','2','3',1,false,0,'2021-01-26 21:49:13+09','2025-07-31 21:57:51+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:9112:――ティボルト','"Oh, Valki. I''m disappointed in you. How could the god of lies be so gullible?"
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:14164:あなたがコントロールしているクリーチャー１体が対戦相手１人に戦闘ダメージを与えるたび、ストリクスヘイヴンの競技場の上に得点カウンター１個を置く。その後、これの上に10個以上の得点カウンターが置かれているなら、それらすべてを取り除き、そのプレイヤーはこのゲームに敗北する。','{Tap}: Add {Colorless}. Put a point counter on Strixhaven Stadium.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:14165:Whenever a creature deals combat damage to you, remove a point counter from Strixhaven Stadium.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:14166:Whenever a creature you control deals combat damage to an opponent, put a point counter on Strixhaven Stadium. Then if it has ten or more point counters on it, remove them all and that player loses the game.','','','259',0,false,0,'2021-04-08 04:42:22+09','2025-07-31 21:59:31+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:15061:あなたがコントロールしているクリーチャー１体が対戦相手１人に戦闘ダメージを与えるたび、ストリクスヘイヴンの競技場の上に得点カウンター１個を置く。その後、これの上に10個以上の得点カウンターが置かれているなら、それらすべてを取り除き、そのプレイヤーはこのゲームに敗北する。','{Tap}: Add {Colorless}. Put a point counter on Strixhaven Stadium.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:15062:Whenever a creature deals combat damage to you, remove a point counter from Strixhaven Stadium.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:15063:Whenever a creature you control deals combat damage to an opponent, put a point counter on Strixhaven Stadium. Then if it has ten or more point counters on it, remove them all and that player loses the game.','','','259',1,false,0,'2021-04-08 04:42:35+09','2025-07-31 21:59:31+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:15498:あなたがコントロールしているクリーチャー１体が対戦相手１人に戦闘ダメージを与えるたび、ストリクスヘイヴンの競技場の上に得点カウンター１個を置く。その後、これの上に10個以上の得点カウンターが置かれているなら、それらすべてを取り除き、そのプレイヤーはこのゲームに敗北する。','{Tap}: Add {Colorless}. Put a point counter on Strixhaven Stadium.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:15499:Whenever a creature deals combat damage to you, remove a point counter from Strixhaven Stadium.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:15500:Whenever a creature you control deals combat damage to an opponent, put a point counter on Strixhaven Stadium. Then if it has ten or more point counters on it, remove them all and that player loses the game.','','','259',1,true,0,'2021-04-08 04:42:40+09','2025-07-31 21:59:31+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:15864:あなたがコントロールしているクリーチャー１体が対戦相手１人に戦闘ダメージを与えるたび、ストリクスヘイヴンの競技場の上に得点カウンター１個を置く。その後、これの上に10個以上の得点カウンターが置かれているなら、それらすべてを取り除き、そのプレイヤーはこのゲームに敗北する。','{Tap}: Add {Colorless}. Put a point counter on Strixhaven Stadium.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:15865:Whenever a creature deals combat damage to you, remove a point counter from Strixhaven Stadium.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:15866:Whenever a creature you control deals combat damage to an opponent, put a point counter on Strixhaven Stadium. Then if it has ten or more point counters on it, remove them all and that player loses the game.','','','358',0,false,0,'2021-04-10 06:35:14+09','2025-07-31 21:59:31+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:16269:あなたがコントロールしているクリーチャー１体が対戦相手１人に戦闘ダメージを与えるたび、ストリクスヘイヴンの競技場の上に得点カウンター１個を置く。その後、これの上に10個以上の得点カウンターが置かれているなら、それらすべてを取り除き、そのプレイヤーはこのゲームに敗北する。','{Tap}: Add {Colorless}. Put a point counter on Strixhaven Stadium.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:16270:Whenever a creature deals combat damage to you, remove a point counter from Strixhaven Stadium.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:16271:Whenever a creature you control deals combat damage to an opponent, put a point counter on Strixhaven Stadium. Then if it has ten or more point counters on it, remove them all and that player loses the game.','','','358',1,false,0,'2021-04-10 06:35:19+09','2025-07-31 21:59:31+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:26763:	 (98736,30183,1,1,266,1320,1,NULL,'憎悪だけでは途中までしか到達できない。残りの距離は尖った槍で縮める。','Hate gets you only so far. A pointy stick can close the rest of the distance.','速攻
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:27420:	 (98913,30183,1,1,269,1379,1,NULL,'憎悪だけでは途中までしか到達できない。残りの距離は尖った槍で縮める。','Hate gets you only so far. A pointy stick can close the rest of the distance.','速攻
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:28267:	 (99141,30183,1,1,266,1320,1,NULL,'憎悪だけでは途中までしか到達できない。残りの距離は尖った槍で縮める。','Hate gets you only so far. A pointy stick can close the rest of the distance.','速攻
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:28936:	 (99315,30183,1,1,269,1379,1,NULL,'憎悪だけでは途中までしか到達できない。残りの距離は尖った槍で縮める。','Hate gets you only so far. A pointy stick can close the rest of the distance.','速攻
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:29975:	 (99662,243,1,3,270,38,1,NULL,'スフィンクスに物事を尋ねるには忍耐がいる。恐らくそれが重要なのだ。','To consult a sphinx is a test in patience. Perhaps that''s the point.','飛行
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:32428:	 (100546,18039,1,1,271,28,1,NULL,'疲弊した旅人たちはその明滅する光を収穫祭への方向を示す蝋燭案内だと思い込んだ。彼らの安堵は雷と共に恐怖へと変わった。','The weary travelers mistook the flickering lights for a candleguide pointing the way to Harvesttide. Their relief turned to terror as lightning lit the sky.','瞬速
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:33282:	 (100823,18039,1,1,271,28,1,NULL,'疲弊した旅人たちはその明滅する光を収穫祭への方向を示す蝋燭案内だと思い込んだ。彼らの安堵は雷と共に恐怖へと変わった。','The weary travelers mistook the flickering lights for a candleguide pointing the way to Harvesttide. Their relief turned to terror as lightning lit the sky.','瞬速
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:37500:	 (102881,31052,1,1,275,1176,1,NULL,'「味覚を研ぎ澄まさないなら、永遠に生きる意義とは何なのだ？」','"If you''re not refining your tastes, what''s the point of living forever?"','ヴォルダーレンの美食家が戦場に出たとき、これは各対戦相手にそれぞれ１点のダメージを与える。血・トークン１つを生成する。（それは「{1}, {Tap}, カード１枚を捨てる, このアーティファクトを生け贄に捧げる：カード１枚を引く。」を持つアーティファクトである。）','When Voldaren Epicure enters the battlefield, it deals 1 damage to each opponent. Create a Blood token. (It''s an artifact with "{1}, {Tap}, Discard a card, Sacrifice this artifact: Draw a card.")','1','1','182',0,false,0,'2021-11-08 05:44:14+09','2025-07-31 22:12:34+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:38885:	 (103288,31052,1,1,275,1176,1,NULL,'「味覚を研ぎ澄まさないなら、永遠に生きる意義とは何なのだ？」','"If you''re not refining your tastes, what''s the point of living forever?"','ヴォルダーレンの美食家が戦場に出たとき、これは各対戦相手にそれぞれ１点のダメージを与える。血・トークン１つを生成する。（それは「{1}, {Tap}, カード１枚を捨てる, このアーティファクトを生け贄に捧げる：カード１枚を引く。」を持つアーティファクトである。）','When Voldaren Epicure enters the battlefield, it deals 1 damage to each opponent. Create a Blood token. (It''s an artifact with "{1}, {Tap}, Discard a card, Sacrifice this artifact: Draw a card.")','1','1','182',1,false,0,'2021-11-08 05:44:26+09','2025-07-31 22:12:34+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:40439:	 (103741,7251,1,2,279,4,1,NULL,'「面白くないというなら、永遠に生きる意義は何だ？」','"If you''re not having fun, what''s the point of living forever?"','あなたがコントロールしている吸血鬼１体がプレイヤー１人に戦闘ダメージを与えるたび、それの上に＋１/＋１カウンター１個を置く。','Whenever a Vampire you control deals combat damage to a player, put a +1/+1 counter on it.','2','2','149',0,false,0,'2021-11-11 02:42:42+09','2025-07-31 21:12:03+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:41731:	 (104409,9121,1,3,282,197,1,NULL,'恐れる者は血の祭りの前に処置を求める。罪人は祭りの後で処置を求める。','It disables with pinpoint accuracy.','真髄の針が戦場に出るに際し、カードの名前１つを選ぶ。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:42421:	 (104601,31052,1,1,282,1176,1,NULL,'「味覚を研ぎ澄まさないなら、永遠に生きる意義とは何なのだ？」','"If you''re not refining your tastes, what''s the point of living forever?"','ヴォルダーレンの美食家が戦場に出たとき、これは各対戦相手にそれぞれ１点のダメージを与える。血・トークン１つを生成する。（それは「{1}, {Tap}, カード１枚を捨てる, このアーティファクトを生け贄に捧げる：カード１枚を引く。」を持つアーティファクトである。）','When Voldaren Epicure enters the battlefield, it deals 1 damage to each opponent. Create a Blood token. (It''s an artifact with "{1}, {Tap}, Discard a card, Sacrifice this artifact: Draw a card.")','1','1','449',0,false,0,'2022-01-07 03:23:53+09','2025-07-31 22:12:34+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:42464:	 (104613,845,1,1,282,52,1,NULL,'','Do not mistake your lofty vantage point for safety.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:43538:	 (104944,9121,1,3,282,197,1,NULL,'恐れる者は血の祭りの前に処置を求める。罪人は祭りの後で処置を求める。','It disables with pinpoint accuracy.','真髄の針が戦場に出るに際し、カードの名前１つを選ぶ。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:44182:	 (105136,31052,1,1,282,1176,1,NULL,'「味覚を研ぎ澄まさないなら、永遠に生きる意義とは何なのだ？」','"If you''re not refining your tastes, what''s the point of living forever?"','ヴォルダーレンの美食家が戦場に出たとき、これは各対戦相手にそれぞれ１点のダメージを与える。血・トークン１つを生成する。（それは「{1}, {Tap}, カード１枚を捨てる, このアーティファクトを生け贄に捧げる：カード１枚を引く。」を持つアーティファクトである。）','When Voldaren Epicure enters the battlefield, it deals 1 damage to each opponent. Create a Blood token. (It''s an artifact with "{1}, {Tap}, Discard a card, Sacrifice this artifact: Draw a card.")','1','1','449',1,false,0,'2022-01-07 03:24:18+09','2025-07-31 22:12:34+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:44220:	 (105148,845,1,1,282,52,1,NULL,'','Do not mistake your lofty vantage point for safety.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:44638:	 (105301,31300,1,1,281,2454,1,NULL,'自身の灯によって再び引き戻されてしまう前に、皇は自らの不在の間に神河を導く者として思慮深き軽脚を任命した。','Before her spark pulled her away again, the Emperor appointed the wise Light-Paws to guide Kamigawa in her absence.','クリーチャー１体を対象とする。ターン終了時まで、それは＋２/＋２の修整を受ける。それがクリーチャー・エンチャントや伝説のクリーチャーであるなら、代わりに、それの上に＋１/＋１カウンター１個を置き、ターン終了時までそれは＋１/＋１の修整を受ける。','Target creature gets +2/+2 until end of turn. If it''s an enchantment creature or legendary creature, instead put a +1/+1 counter on it and it gets +1/+1 until end of turn.','','','32',0,false,0,'2022-02-06 04:56:55+09','2025-07-31 22:13:15+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:45120:	 (105433,31428,1,2,281,29,1,NULL,'霜剣山市の職工の間で、屑鉄を全て再利用することが美徳とされている。','Among the artisans of Sokenzan City, reusing every scrap of metal is a point of pride.','あなたのターンの戦闘の開始時に、あなたは「{1}を支払いアーティファクト１つを生け贄に捧げる。」を選んでもよい。そうしたなら、速攻を持つ赤の３/１の構築物・アーティファクト・クリーチャー・トークン１体を生成する。','At the beginning of combat on your turn, you may pay {1} and sacrifice an artifact. If you do, create a 3/1 red Construct artifact creature token with haste.','2','2','164',0,false,0,'2022-02-06 04:56:59+09','2025-07-31 22:13:44+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:45442:	 (105521,31515,1,1,281,52,1,NULL,'その切っ先は肉体や魂を貫く。','A point to pierce flesh and spirit alike.','装備しているクリーチャーは「{1}, {Tap}, 忍者の苦無を生け贄に捧げる：クリーチャーやプレインズウォーカーやプレイヤーのうち１つを対象とする。忍者の苦無はそれに３点のダメージを与える。」を持つ。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:45716:	 (105603,31300,1,1,281,2454,1,NULL,'自身の灯によって再び引き戻されてしまう前に、皇は自らの不在の間に神河を導く者として思慮深き軽脚を任命した。','Before her spark pulled her away again, the Emperor appointed the wise Light-Paws to guide Kamigawa in her absence.','クリーチャー１体を対象とする。ターン終了時まで、それは＋２/＋２の修整を受ける。それがクリーチャー・エンチャントや伝説のクリーチャーであるなら、代わりに、それの上に＋１/＋１カウンター１個を置き、ターン終了時までそれは＋１/＋１の修整を受ける。','Target creature gets +2/+2 until end of turn. If it''s an enchantment creature or legendary creature, instead put a +1/+1 counter on it and it gets +1/+1 until end of turn.','','','32',1,false,0,'2022-02-06 04:57:04+09','2025-07-31 22:13:15+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:46196:	 (105735,31428,1,2,281,29,1,NULL,'霜剣山市の職工の間で、屑鉄を全て再利用することが美徳とされている。','Among the artisans of Sokenzan City, reusing every scrap of metal is a point of pride.','あなたのターンの戦闘の開始時に、あなたは「{1}を支払いアーティファクト１つを生け贄に捧げる。」を選んでもよい。そうしたなら、速攻を持つ赤の３/１の構築物・アーティファクト・クリーチャー・トークン１体を生成する。','At the beginning of combat on your turn, you may pay {1} and sacrifice an artifact. If you do, create a 3/1 red Construct artifact creature token with haste.','2','2','164',1,false,0,'2022-02-06 04:57:08+09','2025-07-31 22:13:44+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:46519:	 (105823,31515,1,1,281,52,1,NULL,'その切っ先は肉体や魂を貫く。','A point to pierce flesh and spirit alike.','装備しているクリーチャーは「{1}, {Tap}, 忍者の苦無を生け贄に捧げる：クリーチャーやプレインズウォーカーやプレイヤーのうち１つを対象とする。忍者の苦無はそれに３点のダメージを与える。」を持つ。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:55625:	 (109243,32217,1,1,297,71,1,NULL,'「残った市民を安全な場所へ！この悪党どもには、私の槍をくれてやる。」','"Get the remaining citizens to safety! These miscreants have an appointment with my spear."','あなたがコントロールしていてこれでないクリーチャー１体が戦場を離れるたび、燃える拳の士官の上に＋１/＋１カウンター１個を置く。','Whenever another creature you control leaves the battlefield, put a +1/+1 counter on Flaming Fist Officer.','2','2','19',0,false,0,'2022-05-29 06:02:28+09','2025-07-31 22:16:56+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:56560:――地平線を歩むもの、キオン','"To feel no constraint but the four points of a compass, to tread a path that only you can find . . . these are the flavors of power I''ve learned to savor."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:57697:	 (109855,32217,1,1,297,71,1,NULL,'「残った市民を安全な場所へ！この悪党どもには、私の槍をくれてやる。」','"Get the remaining citizens to safety! These miscreants have an appointment with my spear."','あなたがコントロールしていてこれでないクリーチャー１体が戦場を離れるたび、燃える拳の士官の上に＋１/＋１カウンター１個を置く。','Whenever another creature you control leaves the battlefield, put a +1/+1 counter on Flaming Fist Officer.','2','2','19',1,false,0,'2022-05-29 06:02:53+09','2025-07-31 22:16:56+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:58673:――地平線を歩むもの、キオン','"To feel no constraint but the four points of a compass, to tread a path that only you can find . . . these are the flavors of power I''ve learned to savor."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:60449:――ジェイス・ベレレン','"This is it! All the cryptoliths point here!"
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:65134:	 (112609,243,1,3,167,38,76,NULL,'','To consult a sphinx is a test in patience. Perhaps that''s the point.','飛行
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:70376:	 (114083,33203,1,1,302,48,1,NULL,'ヤヴィマヤの生ける樹から細工された矢は、その火で鍛えた先端に森のすべての怒りを宿している。','Arrows fashioned from the living wood of Yavimaya carry all of the forest''s rage in their fire-hardened points.','到達
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:72036:	 (114548,33203,1,1,302,48,1,NULL,'ヤヴィマヤの生ける樹から細工された矢は、その火で鍛えた先端に森のすべての怒りを宿している。','Arrows fashioned from the living wood of Yavimaya carry all of the forest''s rage in their fire-hardened points.','到達
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:76540:	 (116299,33649,1,2,306,7,1,NULL,'Known for their hit single "Your Wait from This Point Is Seven Hours."','Known for their hit single "Your Wait from This Point Is Seven Hours."','Vigilance
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:76709:	 (116352,33702,1,4,306,2625,1,NULL,'For extra style points, spin them.','For extra style points, spin them.','Whenever you cast a spell, copy it and you may choose new targets for the copy. Then balance a card from outside the game on one of your fingertips. When that card falls or touches another card, sacrifice Plate Spinning.','Whenever you cast a spell, copy it and you may choose new targets for the copy. Then balance a card from outside the game on one of your fingertips. When that card falls or touches another card, sacrifice Plate Spinning.','','','56',0,false,0,'2022-10-01 03:11:01+09','2025-07-31 22:19:20+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:77629:	 (116685,33649,1,2,309,7,1,NULL,'Known for their hit single "Your Wait from This Point Is Seven Hours."','Known for their hit single "Your Wait from This Point Is Seven Hours."','Vigilance
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:77799:	 (116738,33702,1,4,309,2625,1,NULL,'For extra style points, spin them.','For extra style points, spin them.','Whenever you cast a spell, copy it and you may choose new targets for the copy. Then balance a card from outside the game on one of your fingertips. When that card falls or touches another card, sacrifice Plate Spinning.','Whenever you cast a spell, copy it and you may choose new targets for the copy. Then balance a card from outside the game on one of your fingertips. When that card falls or touches another card, sacrifice Plate Spinning.','','','342',1,false,0,'2022-10-01 03:15:11+09','2025-07-31 22:19:20+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:78453:	 (116937,33649,1,2,306,7,1,NULL,'Known for their hit single "Your Wait from This Point Is Seven Hours."','Known for their hit single "Your Wait from This Point Is Seven Hours."','Vigilance
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:78620:	 (116990,33702,1,4,306,2625,1,NULL,'For extra style points, spin them.','For extra style points, spin them.','Whenever you cast a spell, copy it and you may choose new targets for the copy. Then balance a card from outside the game on one of your fingertips. When that card falls or touches another card, sacrifice Plate Spinning.','Whenever you cast a spell, copy it and you may choose new targets for the copy. Then balance a card from outside the game on one of your fingertips. When that card falls or touches another card, sacrifice Plate Spinning.','','','56',1,false,0,'2022-10-01 19:27:41+09','2025-07-31 22:19:20+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_3.sql:81604:「雌鹿と豹」.','I want every last one of these tree-hugging, earth-loving, pointy-eared weaklings out of here. Now','色を１色選ぶ。プレイヤー１人を対象とする。そのプレイヤーは自分の手札を公開し、選ばれた色のすべてのカードを捨てる。','Choose a color. Target player reveals their hand and discards all cards of that color.','','','tvdl0154sb',0,false,0,'2022-11-05 02:25:32+09','2025-05-07 22:57:04+09'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvImportService.php:210:     * Rewind the file pointer
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvImportService.php:212:     * If a header row has been set, the pointer is set just below the header
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvImportService.php:279:    public function seek($pointer): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/CsvImportService.php:281:        $this->file->seek($pointer);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/shipment_complete.en.twig:23: Points Used : {{ (0 - data.Order.discount)|number_format }} Points
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/sell_order.en.twig:20: Points Used : {{ (0 - Order.discount)|number_format }} Points
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/LatestArticlesBlockPayloadBuilder.php:27:    // TODO: ECCUBE_HARERUYA-126 正しい最新記事APIエンドポイントに差し替え（現在のURL latest_articles.json は404）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/HeaderUserBlockPayloadBuilder.php:34:     * @return array{Customer: Customer|null, point: int, favoriteCount: int}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/HeaderUserBlockPayloadBuilder.php:40:        $point = $customer?->getPoint();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Block/HeaderUserBlockPayloadBuilder.php:44:            'point' => $point !== null ? (int) $point : 0,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Analysis/format_sales.twig:52:                pointRadius: 3,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:41:        pointer-events: none;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Purchase/detail.twig:461:                                    <div class="card-header d-flex justify-content-between align-items-center flex-wrap" data-bs-toggle="collapse" data-bs-target="#bulkPurchaseCollapse" aria-expanded="false" aria-controls="bulkPurchaseCollapse" role="button" style="cursor: pointer;">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderHelper.php:544:     * - ポイント値引き: 税込
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityProxyService.php:284:     * - 本体でuseされているTrait -> PointTrait
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:26:use Eccube\Service\PurchaseFlow\Processor\PointProcessor;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:28:class PointHelper
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:31:     * PointHelper constructor.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:38:     * ポイント設定が有効かどうか.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:43:    public function isPointEnabled(): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:47:        return $BaseInfo->isOptionPoint();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:51:     * ポイントを金額に変換する.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:53:     * @param string $point ポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:60:    public function pointToPrice(string $point): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:64:        return bcmul($point, (string) $BaseInfo->getPointConversionRate(), 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:68:     * ポイントを値引き額に変換する. マイナス値を返す.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:70:     * @param string $point ポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:77:    public function pointToDiscount(string $point): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:79:        return bcmul($this->pointToPrice($point), '-1', 0);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:83:     * 金額をポイントに変換する.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:85:     * @return string ポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:90:    public function priceToPoint(string $price): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:94:        return bcfloor(bcdiv($price, (string) $BaseInfo->getPointConversionRate(), 4));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:102:    public function addPointDiscountItem(ItemHolderInterface $itemHolder, string $discount, string $processorName = PointProcessor::class): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:113:        // 商品明細に保持しているポイント付与率を取得して設定する.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:114:        // 商品明細が取得できない場合は店舗基本情報のポイント付与率を設定する.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:116:        $pointRate = $Baseinfo->getBasicPointRate();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:117:        // 商品別ポイントは未実装なので, 商品明細のポイント付与率はすべて同じ値が設定されているはず
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:119:        if ($ProductOrderItem instanceof OrderItem && $ProductOrderItem->getPointRate() !== null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:120:            $pointRate = $ProductOrderItem->getPointRate();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:126:            ->setPointRate($pointRate)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:140:     * 既存のポイント明細を削除する.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:142:    public function removePointDiscountItem(ItemHolderInterface $itemHolder, string $processorName = PointProcessor::class): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:154:    public function prepare(ItemHolderInterface $itemHolder, string $point): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:156:        // ユーザの保有ポイントを減算
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:158:        $Customer->setPoint(bcsub((string) $Customer->getPoint(), $point));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:161:    public function rollback(ItemHolderInterface $itemHolder, string $point): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:163:        // 利用したポイントをユーザに戻す.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/PointHelper.php:165:        $Customer->setPoint(bcadd((string) $Customer->getPoint(), $point));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/System/member.twig:139:                                    <th class="border-top-0 pt-2 pb-2 text-center sortable" data-sort="department" style="cursor: pointer;">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/System/member.twig:143:                                    <th class="border-top-0 pt-2 pb-2 text-center sortable" data-sort="authority" style="cursor: pointer;">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/System/authority.twig:64:        pointer-events: none;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_item_prototype.twig:20:        {{ form_widget(orderItemForm.point_rate) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/index.twig:1264:                                                    <!-- TODO: アラート + ポイントエラーの場合、スタイル変更 -->
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_item_type.twig:14:        // 既存の受注明細のポイント付与率を取得する. 取得できない場合は店舗基本情報の付与率を設定する.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_item_type.twig:15:        var point_rate = $('input[type=hidden][id$=point_rate]').first().val();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_item_type.twig:16:        if (point_rate === undefined) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_item_type.twig:17:            point_rate = '{{ BaseInfo.basic_point_rate }}';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/order_item_type.twig:31:        $($lastRow).find(formIdPrefix + index + '_point_rate').val(point_rate);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/additional_system.twig:13:    <form name="form1" role="form" class="form-horizontal h-adr" id="point_form" method="post" action="{{ path('admin_setting_shop_additional_system_update') }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/additional_system.twig:157:                                    <span>{{ 'admin.setting.shop.add_system.check_not_reflected_point_usage_mail_address'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/additional_system.twig:166:                                    <span>{{ 'admin.setting.shop.add_system.adjust_point_variance_mail_address'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/additional_system.twig:169:                                    {{ form_widget(form.adjust_point_variance_mail_addr) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/additional_system.twig:170:                                    {{ form_errors(form.adjust_point_variance_mail_addr) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:167:    cursor: pointer;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:178:    cursor: pointer;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:346:                // 既存の受注明細のポイント付与率を取得する. 取得できない場合は店舗基本情報の付与率を設定する.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:347:                let point_rate = $('input[type=hidden][id$=point_rate]').first().val();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:348:                if (point_rate === undefined) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:349:                    point_rate = '{{ BaseInfo.basic_point_rate }}';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:364:                $($lastRow).find(formIdPrefix + index + '_point_rate').val(point_rate);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:548:        {# ポイント機能が有効かつ会員の場合のみポイントの割引金額を変更する #}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:549:        {% if BaseInfo.isOptionPoint and Order.Customer is not null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:551:                updatePointItem();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:554:            // 再計算時のポイントの割引金額の更新
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:555:            function updatePointItem() {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:556:                // 利用ポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:557:                const usePoint = $('#order_spendedPoints').val();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:559:                // 利用ポイントが数値以外の時は割引金額を更新しない
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:560:                if (isNaN(usePoint)) return;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:563:                const discountPrice = (-1) * usePoint;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:565:                // ポイント明細の金額の要素を取得
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:566:                const $pointPrice = $('.pointPrice');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:568:                // ポイント明細の金額の要素がある場合はポイントの更新
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:569:                if ($pointPrice.length) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:570:                    $pointPrice.val(discountPrice);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:650:                if (!confirm("過去にキャンセルされているため、在庫数やポイントの変動はありません。\nキャンセルしてもよろしいですか？")) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:657:                if (!confirm("全キャンセル時、在庫数等は以下のように変動します。\nキャンセルしてもよろしいですか？\n在庫数：キャンセル分増加\n使用ポイント：払い戻し\n付与済みポイント：取り消し")) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:674:                    if (!confirm("一部キャンセル時、在庫数等は以下のように変動します。\nキャンセルしてもよろしいですか？\n在庫数：キャンセル分増加\n使用ポイント：変動なし\n付与予定ポイント：再計算\n付与済みポイント：変動なし")) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:690:                            if (!confirm("一部キャンセル時、在庫数等は以下のように変動します。\nキャンセルしてもよろしいですか？\n在庫数：キャンセル分増加\n使用ポイント：変動なし\n付与予定ポイント：再計算\n付与済みポイント：変動なし")) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1045:                                                {{ form_widget(orderItemForm.point_rate) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1238:                                    <div class="col-auto"><span class="align-middle">{{ 'admin.order.add_point'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1241:                                            {{ form.vars.value.addpoint|number_format }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1245:                                <!-- 利用ポイント -->
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1247:                                    <div class="col-auto"><span class="align-middle">{{ 'admin.order.use_point'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1250:                                            {% if BaseInfo.isOptionPoint and Order.Customer is not null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1251:                                                {{ form_widget(form.use_point) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1253:                                                {{ form_widget(form.use_point, {'attr': { 'readonly': 'readonly' } }) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1255:                                            {{ form_errors(form.use_point) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1550:                                    <label class="col-3 col-form-label">{{ 'ポイント還元率(%)'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1552:                                        {{ form_widget(form.pointPercentage) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1553:                                        {{ form_errors(form.pointPercentage) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1557:                                    <label class="col-3 col-form-label">{{ 'ポイント発生'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1559:                                        {{ form_widget(form.gainedPoints) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1560:                                        {{ form_errors(form.gainedPoints) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1564:                                    <label class="col-3 col-form-label">{{ 'ポイント使用'|trans }}</label>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1566:                                        {{ form_widget(form.spendedPoints) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1567:                                        {{ form_errors(form.spendedPoints) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1795:                    <!-- ポイントエラーメッセージ -->
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1800:                                    <div class="d-inline-block"><span class="card-title">{{ 'ポイントエラーメッセージ'|trans }}</span></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1802:                                <div class="col-4 text-end"><a data-bs-toggle="collapse" href="#pointErrorMessage" aria-expanded="false" aria-controls="pointErrorMessage"><i class="fa fa-angle-up fa-lg"></i></a></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1805:                        <div class="collapse show ec-cardCollapse" id="pointErrorMessage">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1807:                                {{ form_widget(form.pointErrorMessage) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:25:    <form name="form1" role="form" class="form-horizontal h-adr" id="point_form" method="post" action="">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/confirmationModal_js.twig:171:                // ポイントや在庫の加算・減算は非同期で実行できないため、同期処理で実行
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/shipping.twig:585:                                                    {{ form_widget(orderItemForm.point_rate) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/default_frame.twig:49:                cursor: pointer;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Deck/index.twig:593:                                    <i class="dropdown-menu-toggle fa-solid fa-ellipsis text-secondary" data-bs-toggle="dropdown" data-bs-display="static" style="cursor: pointer;"></i>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/CustomerGroup/index.twig:36:                                    <span>{{ 'admin.customer.customer_group.point_percentage'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/CustomerGroup/index.twig:39:                                    {{ form_widget(form.point_percentage) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/CustomerGroup/index.twig:40:                                    {{ form_errors(form.point_percentage) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/CustomerGroup/index.twig:77:                                    <th class="align-middle pt-2 pb-3 col-1">{{ 'admin.customer.customer_group.point_percentage_list'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/CustomerGroup/index.twig:88:                                            {{ CustomerGroup.pointPercentage }}%
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:14:            pointer-events: none !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:113:                                <th class="point_out_">{{ 'admin.delivery_slips_ja.point_out'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:120:                                <td class="point_out_">{{ DeliverySlip.discount|number_format(0) }}<small>{{ 'common.point'|trans }}</small>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:101:                                <th class="point_out_">{{ 'admin.delivery_slips_en.point_out'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:108:                                <td class="point_out_">{{ DeliverySlip.discount|number_format(0) }}<small>{{ 'admin.delivery_slips_en.point'|trans }}</small>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_approval_notification_ui.script.twig:20:    cursor: pointer;
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:1644:	 (1643,822,1,false,'img/goods/card/XLN/jp/sword-point_diplomacy.jpg',false,'2018-06-07 04:31:39+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:1645:	 (1644,822,2,false,'img/goods/card/XLN/en/sword-point_diplomacy.jpg',false,'2018-06-07 04:31:39+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:60776:	 (74611,37555,1,false,'img/goods/card/EMA/jp/glimmerpoint_stag.jpg',false,'2018-11-05 23:13:21+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:60777:	 (74612,37555,2,false,'img/goods/card/EMA/en/glimmerpoint_stag.jpg',false,'2018-11-05 23:13:21+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:64857:	 (79237,39868,1,false,'img/goods/card/RNA/jp/get_the_point.jpg',false,'2019-01-19 00:05:07+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:64858:	 (79238,39868,2,false,'img/goods/card/RNA/en/get_the_point.jpg',false,'2019-01-19 00:05:07+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:71840:	 (87101,43914,1,false,'img/goods/card/XLN/jp/sword-point_diplomacy.jpg',false,'2019-03-12 03:00:51+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:71841:	 (87102,43914,2,false,'img/goods/card/XLN/en/sword-point_diplomacy.jpg',false,'2019-03-12 03:00:51+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:75506:	 (93349,47063,1,false,'img/goods/card/EMA/jp/glimmerpoint_stag.jpg',false,'2019-03-12 20:42:07+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:75507:	 (93350,47063,2,false,'img/goods/card/EMA/en/glimmerpoint_stag.jpg',false,'2019-03-12 20:42:07+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:79665:	 (98015,40641,1,false,'img/goods/card/RNA/jp/get_the_point.jpg',false,'2019-03-14 19:01:10+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:79666:	 (98016,40641,2,false,'img/goods/card/RNA/en/get_the_point.jpg',false,'2019-03-14 19:01:10+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:108917:	 (129035,64796,1,false,'img/goods/card/XLN/jp/sword-point_diplomacy.jpg',false,'2019-03-15 03:59:06+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_image_1.sql:108918:	 (129036,64796,2,false,'img/goods/card/XLN/en/sword-point_diplomacy.jpg',false,'2019-03-15 03:59:06+09'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Data/top_banner.twig:54:            cursor: pointer;
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:670:	 (243,243,1,3,167,38,1,NULL,'','To consult a sphinx is a test in patience. Perhaps that''s the point.','飛行
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:886:	 (324,324,1,1,167,62,1,NULL,'','My stride will break only against the twin points of Hazoret''s spear.','燃えさし角のミノタウルスが攻撃するに際し、あなたはこれを督励してもよい。そうしたとき、ターン終了時まで、これは+1/+1の修整を受けるとともに威迫を得る。（督励されたクリーチャーは、あなたの次のアンタップ・ステップにアンタップしない。）','You may exert Emberhorn Minotaur as it attacks. When you do, it gets +1/+1 and gains menace until end of turn. (An exerted creature won''t untap during your next untap step.)','4','3','130',0,false,0,'2018-06-07 03:44:45+09','2025-07-31 20:25:37+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:1633:	 (582,564,1,1,178,147,1,NULL,'','"The Brazen Coalition is a firecannon pointed at our enemies. Goblins like him are the spark to its powder."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:1997:	 (719,688,1,1,173,67,1,NULL,'','Closely linked to the Church of Dusk, the paladins of the Bloodstained order are devout to the point of fanaticism.','血潮隊の聖騎士が戦場に出たとき、絆魂を持つ白の1/1の吸血鬼(Vampire)クリーチャー・トークンを１体生成する。','When Paladin of the Bloodstained enters the battlefield, create a 1/1 white Vampire creature token with lifelink.','3','2','25',0,false,0,'2018-06-07 04:31:32+09','2025-07-31 20:32:09+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:2306:	 (880,845,1,1,173,52,1,NULL,'','"Do not mistake your lofty vantage point for safety."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:2623:	 (1016,958,1,1,159,4,1,NULL,'','The sky isn''t the limit. It''s the starting point.','飛行
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:2952:	 (1194,1133,1,1,159,84,1,NULL,'','All skyships entering or leaving the fairgrounds must pass through the security checkpoint.','防衛
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:5841:	 (2217,2025,1,1,41,198,1,NULL,'軍旗は軍隊にとって活力の源であったが、敵にとっては標的であった。','The standard was a rallying point for the army and a target for the enemy.','いずれかの呪文を唱えたり能力を起動する際の対象を選ぶ間に、あなたの対戦相手は可能ならば少なくとも１体の戦場に出ている旗手(Flagbearer)を選ばなければならない。','While choosing targets as part of casting a spell or activating an ability, your opponents must choose at least one Flagbearer on the battlefield if able.','1','1','18',0,false,0,'2018-06-07 05:07:45+09','2025-07-31 20:37:50+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:7174:	 (2796,2564,1,2,147,94,1,NULL,'','It''s hard to find their weak points, but I very much enjoy the discovery process.','(４)(黒)：クリーチャー１体を対象とする。ターン終了時まで、それは-1/-1の修整を受ける。','{4}{Black}: Target creature gets -1/-1 until end of turn.','2','2','113',0,false,0,'2018-06-07 05:08:35+09','2025-07-31 20:39:15+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:7265:	 (2830,2598,1,1,147,8,1,NULL,'','Goblins were first to see the potential of hedrons in the fight against the Eldrazi, for the magical stones came ready-made with pointy bits.','(２)(赤)：ターン終了時まで、溶岩足の略奪者は+2/+0の修整を受ける。','{2}{Red}: Lavastep Raider gets +2/+0 until end of turn.','1','2','147',0,false,0,'2018-06-07 05:08:37+09','2025-07-31 20:39:21+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:7583:	 (2992,2707,1,1,122,83,1,NULL,'','The demon had flown past the reach of Erebos''s whip but not the point of the sun god''s spear.','タップ状態のクリーチャー１体を対象とし、それを追放する。','Exile target tapped creature.','','','10',0,false,0,'2018-06-07 05:09:13+09','2025-07-31 20:39:43+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:8095:Each other Samurai creature you control gets +1/+1 for each point of bushido it has.','3','3','46',0,false,0,'2018-06-07 05:11:14+09','2025-07-31 20:40:09+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:11502:	 (4582,4166,1,1,60,227,1,NULL,'生きていたときと同様、彼らは死してからも大判事を逆の意見から守っている。','In death, as in life, they protect the Grand Arbiter from exposure to contrary points of view.','防衛（このクリーチャーは攻撃できない。）
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:13805:	 (5487,4941,1,2,49,130,1,NULL,'それは北を指してはいない。故郷を指しているんだ。','It doesn''t point north. It points home.','星のコンパスはタップ状態で戦場に出る。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:13812:	 (5492,2003,1,2,49,44,1,NULL,'棒は友人だ。先の尖った棒は親友だ。先の尖った棒の軍団は大親友だ。――― オネイアンの軍曹.','"A stick is your friend. A pointed stick is your good friend. An army of pointed sticks is your best friend."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:14016:	 (5572,4998,1,3,155,19,1,NULL,'','Let the points of our lances lead the way.','先制攻撃
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:15097:','Enlightenment is the mundane seen from the vantage point of the divine.','エンチャント（クリーチャー）
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:16268:	 (6318,5635,1,2,138,73,1,NULL,'','Every time he returns from battle unscathed, he feels a tinge of disappointment.','あなたが赤か白のパーマネントをコントロールしているかぎり、戦いの喧嘩屋は+1/+0の修整を受けるとともに先制攻撃を持つ。','As long as you control a red or white permanent, Battle Brawler gets +1/+0 and has first strike.','2','2','63',0,false,0,'2018-06-07 05:16:33+09','2025-07-31 21:05:31+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:19093:	 (7474,6223,1,3,66,233,1,NULL,'常に裏切りを予測する者が落胆することはまず無い。','Those who expect betrayal at every turn are seldom disappointed.','','','','','42',0,false,0,'2018-06-07 05:18:07+09','2025-07-31 21:08:40+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:19615:	 (7657,6405,1,3,113,36,1,NULL,'ラヴニカの土地の中で、誰かの気まぐれによって変質させられたことがまったくない土地など一片たりとも存在しない。','There is not a single inch of Ravnica that hasn''t been altered at one point or another to fit someone''s whims.','領域大工が戦場に出るに際し、基本土地タイプを１つ選ぶ。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:19708:	 (7690,6438,1,1,113,263,1,NULL,'「精神病と言えるほどに無慈悲だ。こいつに仕事をやろう。」 ――― オルゾフの徴募兵、ゼリーナス','"Merciless to the point of psychosis. Let''s give him a job."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:20247:	 (7902,6641,1,2,59,178,1,NULL,'公平だと？何をどう考えたら、この交渉の目的が公平に事を済ませることなどと思えるのだ？','"Fair? At what point in our negotiations did you convince yourself my goal was to be fair?"','ヴィダルケンの策謀者が戦場に出たとき、あなたがコントロールする土地１つと対戦相手１人がコントロールする土地１つを対象とし、それらのコントロールを交換する。','When Vedalken Plotter enters the battlefield, exchange control of target land you control and target land an opponent controls.','1','1','41',0,false,0,'2018-06-08 01:04:10+09','2025-07-31 21:10:44+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:21760:	 (8395,6996,1,1,11,187,1,NULL,'私の公式記録には霧の民の存在の証拠は何もないと記したが、遠征隊にいた目撃者の報告の呪わしき整合性から、確信は薄れていくばかりだ。――― 不休のディサの日記.','"Although my official log will state there is no evidence pointing to the existence of the Mistfolk, my certainty is lessened by the cursed consistency of the expedition''s eyewitness accounts."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:22621:	 (8717,7251,1,2,102,4,1,NULL,'「面白くないというなら、永遠に生きる意義は何だ？」','"If you''re not having fun, what''s the point of living forever?"','あなたがコントロールしている吸血鬼１体がプレイヤー１人に戦闘ダメージを与えるたび、それの上に＋１/＋１カウンター１個を置く。','Whenever a Vampire you control deals combat damage to a player, put a +1/+1 counter on it.','2','2','158',0,false,0,'2018-06-09 00:03:33+09','2025-07-31 21:12:03+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:24426:	 (9429,7884,1,3,45,454,1,NULL,'もうたくさんだ！','Enough','どのプレイヤーも「限界点は自分に６点のダメージを与える」ことを選んでよい。誰もそうしなかった場合、すべてのクリーチャーを破壊する。これにより破壊されたクリーチャーは再生できない。','Any player may have Breaking Point deal 6 damage to them. If no one does, destroy all creatures. Creatures destroyed this way can''t be regenerated.','','','81',0,false,0,'2018-06-12 01:47:22+09','2025-07-31 21:13:48+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:24653:	 (9519,7972,1,2,131,144,1,NULL,'','Lammasu are the enigmatic travelers of Tarkir, soaring high above all lands in all seasons. None know their true purpose, but they often arrive on the eve of great conflicts or turning points in history.','飛行','Flying','5','4','28',0,false,0,'2018-06-12 05:08:56+09','2025-07-31 21:14:03+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:24901:	 (9606,8055,1,2,131,225,1,NULL,'','"Make sure he''s pointed in the right direction before you light him. And don''t let the goblins anywhere near the torch."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:25925:	 (10259,8443,1,2,47,89,1,NULL,'俺のいるこの高みからなら、希望の行方もわかろうというものさ。','It''s easy to lose sight of hope until you gaze out from my vantage point.','雲に届く騎兵部隊は、あなたが鳥(Bird)をコントロールしているかぎり、+2/+2の修整を受けるとともに飛行を持つ。','As long as you control a Bird, Cloudreach Cavalry gets +2/+2 and has flying.','1','1','7',0,false,0,'2018-06-15 09:29:41+09','2025-07-31 21:15:03+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:27302:	 (11715,8878,1,1,68,126,1,NULL,'「婆は妖精に、ボガートが飛べるならどれだけの悪ふざけができるか語ったんだ。そしてそこに、新たな美しい友情が生まれたのさ。」――― 芋虫婆のお話.','"Auntie pointed out to the faerie how much mischief a flying boggart could wreak, and a beautiful new friendship was born."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:27340:	 (11727,8890,1,2,68,227,1,NULL,'炎族の戦士は干渉の方法を学ぶ。炎の混沌を操り、ピンポイントの正確さで集中する古代の手法だ。','Some flamekin warriors explore the art of coherence, an ancient discipline that harnesses the chaos of fire and focuses it with pinpoint precision.','(３)(赤)：クリーチャー１体かプレイヤー１人を対象とする。炎族の火吐きはそれに１点のダメージを与える。','{3}{Red}: Flamekin Spitfire deals 1 damage to any target.','1','1','168',0,false,0,'2018-06-20 05:00:18+09','2025-07-31 21:16:25+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:27817:	 (11934,4801,1,2,79,454,1,NULL,'「テレパシーを学んで何が一番がっかりしたかって、人々がどれだけつまらないことを考えてるのかわかっちゃったことだね。」――― テフェリー、第四級生徒時代.','The most disappointing thing about learning telepathy is finding out how boring people really are.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:28096:	 (12077,9121,1,3,79,197,1,NULL,'恐れる者は血の祭りの前に処置を求める。罪人は祭りの後で処置を求める。','It disables with pinpoint accuracy.','真髄の針が戦場に出るに際し、カードの名前１つを選ぶ。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:30874:	 (13444,9515,1,1,143,46,1,NULL,'','It''s pointless to hold on when you have nothing to hold on with.','土地でないパーマネント１つを対象とし、それをオーナーの手札に戻す。','Return target nonland permanent to its owner''s hand.','0','0','54',0,false,0,'2018-06-28 20:55:08+09','2025-07-31 21:19:14+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:31086:	 (23217,811,1,1,120,31,1,NULL,'','"The hand of Keranos can be seen in every rumbling storm cloud. Best not to stand where he points."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:31518:When Glimmerpoint Stag enters the battlefield, exile another target permanent. Return that card to the battlefield under its owner''s control at the beginning of the next end step.','3','3','70',0,false,0,'2018-06-29 01:03:49+09','2025-07-31 21:21:23+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:31904:	 (13895,4738,1,1,32,271,1,NULL,'あいつは射程の半ばほどにいる沼バエを真っ二つにできるんだ。――― オネイアンの軍曹.','The crossbow is the ideal weapon for the lazy Mercadians: just point and shoot.','(Ｔ)：攻撃しているクリーチャーかブロックしているクリーチャー１体を対象とする。弩弓歩兵はそれに１点のダメージを与える。','{Tap}: Crossbow Infantry deals 1 damage to target attacking or blocking creature.','1','1','16',0,false,0,'2018-07-03 03:46:39+09','2025-07-31 21:02:53+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:31972:	 (13938,10176,1,1,32,362,1,NULL,'市場のお祭りは、ここを訪れたジャフィーにとっての最高の時となった。','The market festival turned out to be the high point of Jaffy''s visit.','(青),(Ｔ),カードを１枚捨てる：クリーチャー１体を対象とする。それはターン終了時まで飛行を得る。','{Blue}, {Tap}, Discard a card: Target creature gains flying until end of turn.','2','2','59',0,false,0,'2018-07-03 03:46:41+09','2025-07-31 21:21:54+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:32628:	 (14275,10447,1,2,82,245,1,NULL,'探検家にとっては、「先頭の人物」とは「ゴーマゾアの餌」の丁寧な言い方である。','To explorers, point man is a polite way of saying gomazoa fodder.','防衛、飛行
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:32702:	 (14302,10471,1,1,82,228,1,NULL,'「罠探しは、いつか身体の一部を失ってしまうものなのよ。 問題は、それがどれぐらいか――それと、そこが元に戻るかどうかなの。」――― カザンドゥの罠探し、アルハーナ.','"At some point, every trapfinder will lose a hunk of flesh. It''s just a question of how much—and whether it''ll grow back."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:34588:	 (15012,10993,1,3,50,328,1,NULL,'王自身に指名された裁きの面々は、すべての論議が究極の公平さの下に行われていることを保障している。','Appointed by the kha himself, members of the tribunal ensure all disputes are settled with the utmost fairness.','各プレイヤーは、毎ターン１つしか呪文を唱えられない。','Each player can''t cast more than one spell each turn.','','','19',0,false,0,'2018-07-05 04:08:51+09','2025-07-31 21:23:55+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:37079:	 (16244,11954,1,2,25,107,1,NULL,'人生のバランスは星のようなものだ。その一つの要素は法。法は維持されねばならぬ。秩序の結び目がゆるめば、混沌がこぼれ出てくる。――― 万物の歌、第１６７篇.','Life''s balance is as a star: on one point is Law, and Law must be upheld. If the knots of order are loosened, chaos will spill through.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:37186:	 (16291,4801,1,2,25,527,1,NULL,'「テレパシーを学んで何が一番がっかりしたかって、人々がどれだけつまらないことを考えてるのかわかっちゃったことだね。」――― テフェリー、第四級生徒時代.','The most disappointing thing about learning telepathy is finding out how boring people really are.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:37485:	 (16424,12104,1,1,25,528,1,NULL,'アルゴスでは、２点を結ぶ最短距離は、猪が通る道さ。','In Argoth, the shortest route between two points is the one the swine make.','トランプル','Trample','3','3','235',0,false,0,'2018-07-06 01:41:42+09','2025-07-31 21:26:14+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:37597:	 (16479,12151,1,2,25,809,1,NULL,'ギックス教団がコイロスの洞窟を掘り起こしたとき、彼らは切り取られた主人の片手を見つけた。彼らはそれを聖堂に祭り、いつの日かその手がファイレクシアへの道を示してくれることを願った。','When the Brotherhood of Gix dug out the cave of Koilos they found their master''s severed hand. They enshrined it, hoping that one day it would point the way to Phyrexia.','(１),パーマネントを１つ生け贄に捧げる：あなたは１点のライフを得る。','{1}, Sacrifice a permanent: You gain 1 life.','','','290',0,false,0,'2018-07-06 01:41:46+09','2025-07-31 21:26:19+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:38700:	 (17053,12639,1,2,70,227,1,NULL,'隘路へ導くのは戦略だが、献身的な仲間意識はいつだって彼女の戦術だ。','The choke point was the plan, but devoted camaraderie was always her strategy.','(白),(Ｔ)：兵士(Soldier)クリーチャー１体を対象とし、その上に+1/+1カウンターを１個置く。 あなたがコントロールする、+1/+1カウンターが置かれている各クリーチャーは、各戦闘で追加で１体のクリーチャーをブロックできる。','{White}, {Tap}: Put a +1/+1 counter on target Soldier creature. Each creature you control with a +1/+1 counter on it can block an additional creature each combat.','1','1','5',0,false,0,'2018-07-07 02:04:35+09','2025-07-31 21:27:23+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:40400:	 (18012,13075,1,2,97,178,1,NULL,'「ここでは、これが真に迫った聖句というものだ。」――― ウラブラスクの執行人.','"Down here, we have a more pointed version of the scriptures."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:41890:	 (18777,13758,1,1,150,82,1,NULL,'','"It''s endearing, in a mystical, pointy sort of way."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:42273:	 (18915,13871,1,3,46,248,1,NULL,'その時点で、魔術師の議論は非常に険悪なものとなっていった。','At that point, the wizards'' argument got a lot uglier.','壁(Wall)以外のクリーチャー・タイプを１つ選ぶ。各クリーチャーはターン終了時までそのタイプになる。','Choose a creature type other than Wall. Each creature becomes that type until end of turn.','','','116',0,false,0,'2018-07-11 03:41:31+09','2025-07-31 21:31:11+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:42520:—Toggo, goblin weaponsmith','クリーチャー１体を対象とする。狙いすましたなだれはそれに４点のダメージを与える。このダメージは軽減できない。','Pinpoint Avalanche deals 4 damage to target creature. The damage can''t be prevented.','','','221',0,false,0,'2018-07-11 03:41:37+09','2025-07-31 21:31:25+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:42608:	 (19062,4661,1,2,46,84,1,NULL,'','Torching Krosa would be pointless. It grows faster than it burns.','あなたのライブラリーから基本土地・カード最大２枚を探し、タップ状態で戦場に出す。その後、ライブラリーを切り直す。','Search your library for up to two basic land cards, put them onto the battlefield tapped, then shuffle.','','','263',0,false,0,'2018-07-11 03:41:40+09','2025-07-31 20:51:05+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:42929:	 (19744,14580,1,1,111,23,1,NULL,'貴様の死刑囚監房での定位置は、奴が教えてくれるだろう。','He''ll point you to your death row seats.','解鎖（あなたはこのクリーチャーを、+1/+1カウンターが１個置かれた状態で戦場に出してもよい。これの上に+1/+1カウンターが置かれているかぎり、これではブロックできない。）
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:43051:	 (19802,14632,1,2,111,83,1,NULL,'怒り狂った市民は、自分達の居住地にそれを解き放ったとしてシミックを非難した。シミック側はネズミの害がなくなったことを指摘した。','The furious citizens blamed the Simic for releasing it in their district. The Simic pointed out that rats were no longer a problem.','(緑),他のクリーチャーを１体生け贄に捧げる：貪り食う軟泥の上に+1/+1カウンターを１個置く。','{Green}, Sacrifice another creature: Put a +1/+1 counter on Gobbling Ooze.','3','3','126',0,false,0,'2018-07-11 20:36:11+09','2025-07-31 21:32:24+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:44263:	 (20252,4941,1,2,39,130,1,NULL,'それは北を指してはいない。故郷を指しているんだ。','It doesn''t point north. It points home.','星のコンパスはタップ状態で戦場に出る。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:44480:	 (20617,15239,1,1,18,85,1,NULL,'登山家たちはすぐに、どんなときでも槍を立てて旅する習慣を身につけた。','Mountaineers quickly learn to travel with their spears always pointed up.','速攻','Haste','2','2','144',0,false,0,'2018-07-12 06:20:05+09','2025-07-31 21:33:47+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:44659:	 (20740,9515,1,1,181,46,1,NULL,'','It''s pointless to hold on when you have nothing to hold on with.','土地でないパーマネント１つを対象とし、それをオーナーの手札に戻す。','Return target nonland permanent to its owner''s hand.','0','0','50',0,false,0,'2018-07-12 18:34:30+09','2025-07-31 21:19:14+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:45545:','Zhang Fei''s uncharacteristic alliance with a defeated Riverlands general, Yan Yan, allowed Shu forces to advance through forty-five Riverlands strongpoints with no casualties.','警戒、馬術（このクリーチャーは、馬術を持たないクリーチャーによってはブロックされない。）','Vigilance; horsemanship (This creature can''t be blocked except by creatures with horsemanship.)','4','4','32',0,false,0,'2018-07-13 02:33:34+09','2025-07-31 21:34:42+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:45761:	 (21509,15803,1,3,29,738,1,NULL,'人の生死はすべて定まったもの。たかが馬一匹にそれを変える力もござるまい。――― 劉備が「的盧は乗る者に祟りなす馬だ」と告げられて答えた言葉.','All men have their appointed time; that''s something no horse can change.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:45921:	 (21658,15926,1,2,36,366,1,NULL,'「呪文はもうちょっと待たなくちゃね」とアレクシーは上を指さしながら言った。「ドレイクがいるわ」','The spell will have to wait, said Alexi, pointing up. Drakes.','飛行
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:46216:	 (22387,4743,1,1,87,270,1,NULL,'「結ぶべき契約も、誓うべき誓約もない。 入隊手続きは、剣を抜いて、敵に向けることだ。」','There''s no contract to sign, no oath to swear. The enlistment procedure is to unsheathe your sword and point it at the enemy.','0','0','2','2','22',0,false,0,'2018-07-13 23:52:17+09','2025-07-31 21:02:55+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:46899:	 (23118,17189,1,1,120,226,1,NULL,'彼女はエイスリオスを待つ死者たちに鋭い質問をし、生から離れる者たちから人生について学んでいた。','She asks pointed questions of the dead who wait for Athreos, learning of life from those who are about to leave it.','(２)(黒)：各対戦相手はそれぞれ１点のライフを失う。あなたはこれにより失われたライフに等しい点数のライフを得る。','{2}{Black}: Each opponent loses 1 life. You gain life equal to the life lost this way.','1','4','28',0,false,0,'2018-07-17 21:51:28+09','2025-07-31 21:35:50+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:46910:	 (23123,17194,1,3,120,93,1,NULL,'伝説では太陽の槍という強力な武器があり、テーロスのいかなる場所をも攻撃することができるという。死の国の最深淵とて例外ではない。','Legend speaks of the Sun Spear, the mighty weapon that can strike any point in Theros, even the depths of the Underworld.','あなたがコントロールするクリーチャーは+1/+1の修整を受ける。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:47010:	 (23159,17223,1,2,120,54,1,NULL,'「タッサ様は私に力と見識を与えてくださった。そのことを後悔させないように気を付けている。」','Thassa has blessed me with power and insight. I am careful not to disappoint her.','英雄的 ― あなたがトリトンの財宝狩りを対象とする呪文を１つ唱えるたび、カードを１枚引く。','Heroic — Whenever you cast a spell that targets Triton Fortune Hunter, draw a card.','2','2','69',0,false,0,'2018-07-17 21:51:30+09','2025-07-31 21:36:17+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:47496:	 (23358,17387,1,1,58,293,1,NULL,'ディートリ、お前に歯向かう奴がいないおかげで、ここを離れられるよ。――― 夜番の見回り、キトフ.','"Ditri, I leave this checkpoint in your capable teeth."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:48047:	 (23588,17593,1,1,58,256,1,NULL,'地底街では、剣の切っ先ですべてを忘れることがしばしば奨励されている。','In the undercity, forgetfulness is often encouraged at the point of a blade.','（(青/黒)は(青)でも(黒)でも支払うことができる。）
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:48091:	 (23601,17606,1,1,58,286,1,NULL,'見るものの視点により、その印章が示すものは、自然の巡りを護る名誉ある守護者にも、永遠の生命のために魂を闇に売り渡した者にもなる。','Depending on your point of view, the seal represents a proud guardian of the natural cycle or one who has sold her soul to darkness for eternal life.','{1}, {Tap}：{Black}{Green}を加える。','{1}, {Tap}: Add {Black}{Green}.','','','262',0,false,0,'2018-07-18 02:36:28+09','2025-07-31 21:37:47+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:48531:	 (24131,18084,1,1,152,239,1,NULL,'','"To die failing to save a loved one is just so sad—or, more to the point, pathetic."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:48933:	 (24288,18231,1,3,152,84,1,NULL,'','"This is it! All the cryptoliths point here!"
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:50401:When Glimmerpoint Stag enters the battlefield, exile another target permanent. Return that card to the battlefield under its owner''s control at the beginning of the next end step.','3','3','9',0,false,0,'2018-07-19 03:16:42+09','2025-07-31 21:21:23+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:51250:「雌鹿と豹」.','I want every last one of these tree-hugging, earth-loving, pointy-eared weaklings out of here. Now','色を１色選ぶ。プレイヤー１人を対象とする。そのプレイヤーは自分の手札を公開し、選ばれた色のすべてのカードを捨てる。','Choose a color. Target player reveals their hand and discards all cards of that color.','','','154',0,false,0,'2018-07-19 07:39:31+09','2025-07-31 21:03:21+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:51546:	 (26431,2003,1,2,40,44,1,NULL,'棒は友人だ。先の尖った棒は親友だ。先の尖った棒の軍団は大親友だ。――― オネイアンの軍曹.','"A stick is your friend. A pointed stick is your good friend. An army of pointed sticks is your best friend."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:52475:	 (26803,10993,1,2,67,328,1,NULL,'王自身に指名された裁きの面々は、すべての論議が究極の公平さの下に行われていることを保障している。','Appointed by the kha himself, members of the tribunal ensure all disputes are settled with the utmost fairness.','各プレイヤーは、毎ターン１つしか呪文を唱えられない。','Each player can''t cast more than one spell each turn.','','','37',0,false,0,'2018-07-24 04:04:40+09','2025-07-31 21:23:55+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:53013:	 (27097,11150,1,2,67,403,1,NULL,'すべての傷に物語があり、すべての欠けにその名がある。 この剣は四世代に渡って用いられた。 落胆することなどありはしない。――― 空騎士リーナの伝授.','"Every scratch tells a story, and every notch has a name. Four generations have held this blade. You shall not disappoint them."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:54243:	 (27677,19236,1,1,44,248,1,NULL,'あいつはばっちりと要点をつくんだよ。','He gets to the point right away.','カードを１枚無作為に選んで捨てる：パーディック山の長槍使いは、ターン終了時まで+1/+0の修整を受けるとともに先制攻撃を得る。','Discard a card at random: Pardic Lancer gets +1/+0 and gains first strike until end of turn.','3','2','107',0,false,0,'2018-07-25 00:56:22+09','2025-07-31 21:42:06+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:54970:	 (27980,19501,1,1,63,191,1,NULL,'時の裂け目の焦点となったフォライアスは、新たな敵と古い敵の両方と同時に戦っている。','A focal point for time rifts, Foriys contends simultaneously with foes both new and old.','瞬速（あなたはこの呪文を、あなたがインスタントを唱えられるときならいつでも唱えてよい。）
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:56105:	 (28370,12151,1,3,64,809,1,NULL,'ギックス教団がコイロスの洞窟を掘り起こしたとき、彼らは切り取られた主人の片手を見つけた。彼らはそれを聖堂に祭り、いつの日かその手がファイレクシアへの道を示してくれることを願った。','When the Brotherhood of Gix dug out the cave of Koilos they found their master''s severed hand. They enshrined it, hoping that one day it would point the way to Phyrexia.','(１),パーマネントを１つ生け贄に捧げる：あなたは１点のライフを得る。','{1}, Sacrifice a permanent: You gain 1 life.','','','107',0,false,0,'2018-07-25 05:10:06+09','2025-07-31 21:26:19+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:56764:','Don''t stand in his way, for his way is full of pointy things and fire.','プレイヤー１人が赤の呪文を唱えるたび、クリーチャー１体を対象とする。あなたは(１)を支払ってもよい。そうした場合、そのクリーチャーではこのターン、ブロックできない。','Whenever a player casts a red spell, you may pay {1}. If you do, target creature can''t block this turn.','1','1','96',0,false,0,'2018-07-26 01:42:08+09','2025-07-31 21:44:20+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:56813:','Though the shaman rarely got what she wanted, she was never disappointed in the result.','エンチャントでないパーマネント３つを対象とする。それらのうち無作為に選んだ１つを破壊する。','Choose three target nonenchantment permanents. Destroy one of them at random.','','','108',0,false,0,'2018-07-26 01:42:08+09','2025-07-31 21:44:22+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:56887:','The last survivor of her patrol, the warrior returned expecting disappointment and scorn. Instead she found gratitude. You are alive. That is reason to celebrate.','あなたは、あなたがコントロールするタップ状態のアーティファクト、クリーチャー、土地１つにつき１点のライフを得る。','You gain 1 life for each tapped artifact, creature, and land you control.','','','130',0,false,0,'2018-07-26 01:42:10+09','2025-07-31 21:44:25+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:56983:','The kithkin mind-bond is even tighter in Shadowmoor, reinforcing the unity of their community to the point of xenophobia.','あなたの対戦相手がコントロールするすべてのクリーチャーをタップし、あなたがコントロールするすべてのクリーチャーをアンタップする。','Tap all creatures your opponents control and untap all creatures you control.','','','154',0,false,0,'2018-07-26 01:42:11+09','2025-07-31 21:44:30+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:57078:	 (28973,20096,1,2,71,270,1,NULL,'手が崩れ去り、尖った先のみが奇妙にも残されたと知ったとき、彼は自身の目的は戦争しかないと決めた。','After his hands had crumbled away, leaving only wickedly sharp points, he decided his only purpose was war.','アッシェンムーアの抉り出しではブロックできない。','Ashenmoor Gouger can''t block.','4','4','180',0,false,0,'2018-07-26 01:42:13+09','2025-07-31 21:44:34+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:58284:	 (29389,20249,1,3,121,52,1,NULL,'','Let your heels point you home.—Ancient blessing','(Ｔ)：あなたのマナ・プールに(◇)を加える。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:59951:	 (30042,17606,1,1,149,68,1,NULL,'見るものの視点により、その印章が示すものは、自然の巡りを護る名誉ある守護者にも、永遠の生命のために魂を闇に売り渡した者にもなる。','Depending on your point of view, the seal represents a proud guardian of the natural cycle or one who has sold her soul to darkness for eternal life.','{1}, {Tap}：{Black}{Green}を加える。','{1}, {Tap}: Add {Black}{Green}.','','','255',0,false,0,'2018-07-27 04:43:22+09','2025-07-31 21:37:47+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:60896:	 (30384,17606,1,1,161,68,1,NULL,'見るものの視点により、その印章が示すものは、自然の巡りを護る名誉ある守護者にも、永遠の生命のために魂を闇に売り渡した者にもなる。','Depending on your point of view, the seal represents a proud guardian of the natural cycle or one who has sold her soul to darkness for eternal life.','{1}, {Tap}：{Black}{Green}を加える。','{1}, {Tap}: Add {Black}{Green}.','','','255',0,false,0,'2018-07-27 21:57:08+09','2025-07-31 21:37:47+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:61037:	 (30430,20249,1,3,161,52,1,NULL,'','Let your heels point you home.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:61546:	 (30620,7251,1,2,172,4,1,NULL,'「面白くないというなら、永遠に生きる意義は何だ？」','"If you''re not having fun, what''s the point of living forever?"','あなたがコントロールしている吸血鬼１体がプレイヤー１人に戦闘ダメージを与えるたび、それの上に＋１/＋１カウンター１個を置く。','Whenever a Vampire you control deals combat damage to a player, put a +1/+1 counter on it.','2','2','140',0,false,0,'2018-07-28 01:59:28+09','2025-07-31 21:12:03+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:62497:	 (30956,4661,1,2,157,84,1,NULL,'','Torching Krosa would be pointless. It grows faster than it burns.','あなたのライブラリーから基本土地・カード最大２枚を探し、タップ状態で戦場に出す。その後、ライブラリーを切り直す。','Search your library for up to two basic land cards, put them onto the battlefield tapped, then shuffle.','','','180',0,false,0,'2018-07-30 23:40:17+09','2025-07-31 20:51:05+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:62600:	 (31003,9515,1,1,153,46,1,NULL,'','It''s pointless to hold on when you have nothing to hold on with.','土地でないパーマネント１つを対象とし、それをオーナーの手札に戻す。','Return target nonland permanent to its owner''s hand.','0','0','5',0,false,0,'2018-08-02 02:44:45+09','2025-07-31 21:19:14+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:62619:	 (31016,4743,1,1,166,270,1,NULL,'「結ぶべき契約も、誓うべき誓約もない。 入隊手続きは、剣を抜いて、敵に向けることだ。」','There''s no contract to sign, no oath to swear. The enlistment procedure is to unsheathe your sword and point it at the enemy.','0','0','2','2','2',0,false,0,'2018-08-02 02:59:14+09','2025-07-31 21:02:55+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:62794:	 (31092,10447,1,2,98,245,1,NULL,'探検家にとっては、「先頭の人物」とは「ゴーマゾアの餌」の丁寧な言い方である。','To explorers, point man is a polite way of saying gomazoa fodder.','防衛、飛行
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:62831:	 (31110,6641,1,2,98,178,1,NULL,'公平だと？何をどう考えたら、この交渉の目的が公平に事を済ませることなどと思えるのだ？','"Fair? At what point in our negotiations did you convince yourself my goal was to be fair?"','ヴィダルケンの策謀者が戦場に出たとき、あなたがコントロールする土地１つと対戦相手１人がコントロールする土地１つを対象とし、それらのコントロールを交換する。','When Vedalken Plotter enters the battlefield, exchange control of target land you control and target land an opponent controls.','1','1','66',0,false,0,'2018-08-04 01:17:45+09','2025-07-31 21:10:44+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:62925:	 (31151,20370,1,2,98,136,1,NULL,'','I grant you blades—on the condition that they are not pointed at me.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:63040:	 (31197,4661,1,2,98,84,1,NULL,'','Torching Krosa would be pointless. It grows faster than it burns.','あなたのライブラリーから基本土地・カード最大２枚を探し、タップ状態で戦場に出す。その後、ライブラリーを切り直す。','Search your library for up to two basic land cards, put them onto the battlefield tapped, then shuffle.','','','153',0,false,0,'2018-08-04 01:17:48+09','2025-07-31 20:51:05+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:63286:	 (31874,1133,1,1,180,84,1,NULL,'','All skyships entering or leaving the fairgrounds must pass through the security checkpoint.','防衛
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:63317:	 (31293,17606,1,1,98,286,1,NULL,'見るものの視点により、その印章が示すものは、自然の巡りを護る名誉ある守護者にも、永遠の生命のために魂を闇に売り渡した者にもなる。','Depending on your point of view, the seal represents a proud guardian of the natural cycle or one who has sold her soul to darkness for eternal life.','{1}, {Tap}：{Black}{Green}を加える。','{1}, {Tap}: Add {Black}{Green}.','','','249',0,false,0,'2018-08-04 01:17:53+09','2025-07-31 21:37:47+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:63400:	 (31321,20249,1,3,98,52,1,NULL,'','Let your heels point you home.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:65393:	 (32237,4661,1,2,182,84,1,NULL,'','Torching Krosa would be pointless. It grows faster than it burns.','あなたのライブラリーから基本土地・カード最大２枚を探し、タップ状態で戦場に出す。その後、ライブラリーを切り直す。','Search your library for up to two basic land cards, put them onto the battlefield tapped, then shuffle.','','','144',0,false,0,'2018-08-15 21:24:25+09','2025-07-31 20:51:05+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:65853:	 (32405,2707,1,1,170,83,1,NULL,'','The demon had flown past the reach of Erebos''s whip but not the point of the sun god''s spear.','タップ状態のクリーチャー１体を対象とし、それを追放する。','Exile target tapped creature.','','','5',0,false,0,'2018-08-16 23:38:00+09','2025-07-31 20:39:43+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:67117:	 (32950,17606,1,1,169,68,1,NULL,'見るものの視点により、その印章が示すものは、自然の巡りを護る名誉ある守護者にも、永遠の生命のために魂を闇に売り渡した者にもなる。','Depending on your point of view, the seal represents a proud guardian of the natural cycle or one who has sold her soul to darkness for eternal life.','{1}, {Tap}：{Black}{Green}を加える。','{1}, {Tap}: Add {Black}{Green}.','','','218',0,false,0,'2018-08-22 02:31:32+09','2025-07-31 21:37:47+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:68549:Are you aware that any time you say something that isn''t a question, when a player points out this fact first, they gain control of Question Elemental?','3','4','43',0,false,0,'2018-09-06 02:23:35+09','2025-07-31 21:47:12+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:69308:	 (35463,4743,1,1,92,270,1,NULL,'「結ぶべき契約も、誓うべき誓約もない。 入隊手続きは、剣を抜いて、敵に向けることだ。」','There''s no contract to sign, no oath to swear. The enlistment procedure is to unsheathe your sword and point it at the enemy.','0','0','2','2','7',0,false,0,'2018-09-22 00:45:58+09','2025-07-31 21:02:55+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:69486:	 (35955,6438,1,1,123,263,1,NULL,'「精神病と言えるほどに無慈悲だ。こいつに仕事をやろう。」 ――― オルゾフの徴募兵、ゼリーナス','"Merciless to the point of psychosis. Let''s give him a job."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:70117:	 (35813,17606,1,1,110,68,1,NULL,'見るものの視点により、その印章が示すものは、自然の巡りを護る名誉ある守護者にも、永遠の生命のために魂を闇に売り渡した者にもなる。','Depending on your point of view, the seal represents a proud guardian of the natural cycle or one who has sold her soul to darkness for eternal life.','{1}, {Tap}：{Black}{Green}を加える。','{1}, {Tap}: Add {Black}{Green}.','','','66',0,false,0,'2018-09-29 21:53:32+09','2025-07-31 21:37:47+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:70848:	 (36193,22691,1,2,183,171,1,NULL,'','"The shortest path between two points is not always the safest."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:71409:	 (36418,4661,1,2,140,84,1,NULL,'','Torching Krosa would be pointless. It grows faster than it burns.','あなたのライブラリーから基本土地・カード最大２枚を探し、タップ状態で戦場に出す。その後、ライブラリーを切り直す。','Search your library for up to two basic land cards, put them onto the battlefield tapped, then shuffle.','','','46',0,false,0,'2018-10-12 22:05:45+09','2025-07-31 20:51:05+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:71981:	 (36701,7884,1,3,114,454,1,NULL,'もうたくさんだ！','Enough!','どのプレイヤーも「限界点は自分に６点のダメージを与える」ことを選んでよい。誰もそうしなかった場合、すべてのクリーチャーを破壊する。これにより破壊されたクリーチャーは再生できない。','Any player may have Breaking Point deal 6 damage to them. If no one does, destroy all creatures. Creatures destroyed this way can''t be regenerated.','','','67',0,false,0,'2018-10-17 01:00:43+09','2025-07-31 21:13:48+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:73153:	 (37294,4941,1,1,175,130,1,NULL,'それは北を指してはいない。故郷を指しているんだ。','It doesn''t point north. It points home.','星のコンパスはタップ状態で戦場に出る。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:73375:	 (37370,6223,1,3,116,233,1,NULL,'','Those who expect betrayal at every turn are seldom disappointed.','','','','','56',0,false,0,'2018-11-02 00:42:19+09','2025-07-31 21:08:40+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:73906:When Glimmerpoint Stag enters the battlefield, exile another target permanent. Return that card to the battlefield under its owner''s control at the beginning of the next end step.','3','3','12',0,false,0,'2018-11-05 23:13:21+09','2025-07-31 21:21:23+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:74892:	 (37908,13075,1,1,142,178,1,NULL,'「ここでは、これが真に迫った聖句というものだ。」――― ウラブラスクの執行人.','"Down here, we have a more pointed version of the scriptures."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:75079:	 (37981,20096,1,2,142,270,1,NULL,'手が崩れ去り、尖った先のみが奇妙にも残されたと知ったとき、彼は自身の目的は戦争しかないと決めた。','After his hands had crumbled away, leaving only wickedly sharp points, he decided his only purpose was war.','アッシェンムーアの抉り出しではブロックできない。','Ashenmoor Gouger can''t block.','4','4','190',0,false,0,'2018-11-06 02:17:59+09','2025-07-31 21:44:34+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:75772:	 (38260,17606,1,2,164,68,1,NULL,'見るものの視点により、その印章が示すものは、自然の巡りを護る名誉ある守護者にも、永遠の生命のために魂を闇に売り渡した者にもなる。','Depending on your point of view, the seal represents a proud guardian of the natural cycle or one who has sold her soul to darkness for eternal life.','{1}, {Tap}：{Black}{Green}を加える。','{1}, {Tap}: Add {Black}{Green}.','','','220',0,false,0,'2018-11-06 20:48:33+09','2025-07-31 21:37:47+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:77780:	 (39169,845,1,1,187,52,1,NULL,'','"Do not mistake your lofty vantage point for safety."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:77899:	 (39144,3038,1,2,187,102,1,NULL,'神は時には、狡猾さや手練手管で生きるものの世界から希望と誇りを奪い去った。それ以外は、もっと単純明快だった。','It''s not the most subtle incantation, but it gets the point across.','プレイヤー１人かプレインズウォーカー１体を対象とする。溶岩の撃ち込みはそのプレイヤーに３点のダメージを与える。','Lava Spike deals 3 damage to target player or planeswalker.','','','136',0,false,0,'2018-12-13 01:44:53+09','2025-07-31 20:43:51+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:79904:	 (40321,4661,1,2,81,84,1,NULL,'','Torching Krosa would be pointless. It grows faster than it burns.','あなたのライブラリーから基本土地・カード最大２枚を探し、タップ状態で戦場に出す。その後、ライブラリーを切り直す。','Search your library for up to two basic land cards, put them onto the battlefield tapped, then shuffle.','','','70',0,false,0,'2019-01-22 22:19:44+09','2025-07-31 20:51:05+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:80540:	 (40597,17606,1,1,194,68,1,NULL,'見るものの視点により、その印章が示すものは、自然の巡りを護る名誉ある守護者にも、永遠の生命のために魂を闇に売り渡した者にもなる。','Depending on your point of view, the seal represents a proud guardian of the natural cycle or one who has sold her soul to darkness for eternal life.','{1}, {Tap}：{Black}{Green}を加える。','{1}, {Tap}: Add {Black}{Green}.','','','73',0,false,0,'2019-01-24 22:46:21+09','2025-07-31 21:37:47+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:81089:	 (40908,6223,1,3,195,233,1,NULL,'常に裏切りを予測する者が落胆することはまず無い。','Those who expect betrayal at every turn are seldom disappointed.','','','','','68',0,false,0,'2019-03-02 01:02:18+09','2025-07-31 21:08:40+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:81583:	 (41103,6996,1,1,196,187,1,NULL,'私の公式記録には霧の民の存在の証拠は何もないと記したが、遠征隊にいた目撃者の報告の呪わしき整合性から、確信は薄れていくばかりだ。――― 不休のディサの日記.','"Although my official log will state there is no evidence pointing to the existence of the Mistfolk, my certainty is lessened by the cursed consistency of the expedition''s eyewitness accounts."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:82369:	 (41409,22691,1,2,183,171,1,NULL,'','"The shortest path between two points is not always the safest."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:82896:	 (41598,9515,1,1,181,46,1,NULL,'','It''s pointless to hold on when you have nothing to hold on with.','土地でないパーマネント１つを対象とし、それをオーナーの手札に戻す。','Return target nonland permanent to its owner''s hand.','0','0','50',1,false,0,'2019-03-12 02:21:23+09','2025-07-31 21:19:14+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:83721:	 (42024,845,1,1,187,52,1,NULL,'','"Do not mistake your lofty vantage point for safety."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:83841:	 (41999,3038,1,2,187,102,1,NULL,'神は時には、狡猾さや手練手管で生きるものの世界から希望と誇りを奪い去った。それ以外は、もっと単純明快だった。','It''s not the most subtle incantation, but it gets the point across.','プレイヤー１人かプレインズウォーカー１体を対象とする。溶岩の撃ち込みはそのプレイヤーに３点のダメージを与える。','Lava Spike deals 3 damage to target player or planeswalker.','','','136',1,false,0,'2019-03-12 02:29:26+09','2025-07-31 20:43:51+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:84604:	 (42327,1133,1,1,180,84,1,NULL,'','All skyships entering or leaving the fairgrounds must pass through the security checkpoint.','防衛
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:85639:	 (42721,6223,1,3,195,233,1,NULL,'常に裏切りを予測する者が落胆することはまず無い。','Those who expect betrayal at every turn are seldom disappointed.','','','','','68',1,false,0,'2019-03-12 02:40:43+09','2025-07-31 21:08:40+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_1.sql:86331:	 (43003,564,1,1,178,147,1,NULL,'','"The Brazen Coalition is a firecannon pointed at our enemies. Goblins like him are the spark to its powder."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_approval.twig:148:                            {{ 'admin.stock.join.source_count_points'|trans({'%count%': initial_source_count_sum}) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig:15:            pointer-events: none !important;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/Purchase/purchase_add_cart_ec_modal.twig:4:    pointer-events: none;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/Purchase/purchase_add_cart_ec_modal.twig:7:    pointer-events: none;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/Purchase/purchase_add_cart_ec_modal.twig:11:    pointer-events: auto;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:228:                            {{ ('admin.stock.join.source_count_points'|trans({'%count%': '<span id="join-summary-source-count">' ~ initial_source_count_sum ~ '</span>'})) | raw }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/tag.twig:39:            cursor: pointer;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/header.twig:122:            <div class="p-hareruya-header__point">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/header.twig:124:                    <a class="p-hareruya-header__point-link" href="{{ url('mypage') }}" aria-label="{{ 'front.nav.point.aria_label'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/header.twig:125:                        <span class="p-hareruya-header__point-value">{{ app.user.point|number_format }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/header.twig:126:                        <span class="p-hareruya-header__point-unit">{{ 'front.nav.point.unit'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:314:                                        <div>{{ 'admin.stock.split_join.list.source_destination_points'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:319:                                        <div>{{ 'admin.stock.split_join.list.destination_source_points'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:340:                                        {% set sourceDestPoints = StockSplitJoin.splitJoinQuantity %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:343:                                        {% set destSourcePoints = StockSplitJoin.details|reduce((sum, d) => sum + d.splitJoinQuantity, 0) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:376:                                                <div>{{ sourceDestPoints|number_format }}点</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:387:                                                <div>{{ destSourcePoints|number_format }}点</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content.en.twig:28: Points Used : {{ (0 - data.discount)|number_format }} Points
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/product.twig:15:{% set _badges = card.list_badges|default({ sale: false, reservation: false, point_up: false }) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/category.twig:304:                                            <div class="photo_files category-image-dropzone mt-2" id="category-banner-drag-drop-area" style="border: 1px dashed #ccc; border-radius: 8px; padding: 15px; background-color: #f1f0ef; min-height: 120px; cursor: pointer;">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/category.twig:343:                                            <div class="photo_files category-image-dropzone mt-2" id="category-icon-drag-drop-area" style="border: 1px dashed #ccc; border-radius: 8px; padding: 15px; background-color: #f1f0ef; min-height: 120px; cursor: pointer;">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/approval.twig:46:            cursor: pointer;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/approval.twig:55:            pointer-events: none;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/approval.twig:58:            pointer-events: none;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock/approval.twig:61:            pointer-events: auto;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order.twig:18:{% if BaseInfo.isOptionPoint and Order.Customer is not null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order.twig:19:ご利用ポイント：{{ Order.usePoint|number_format }} pt
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order.twig:20:加算ポイント：{{ Order.addPoint|number_format }} pt
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/header_user.twig:12:{% set point = point|default(0) %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/header_user.twig:18:            <div class="p-hareruya-header__point-display">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/header_user.twig:19:                <div class="p-hareruya-header__point-value-large">{{ point|number_format }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/header_user.twig:20:                <div class="p-hareruya-header__point-label">{{ 'front.nav.point.label'|trans }}</div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Validator/StringMaxLengthValidator.php:22: * 文字列項目に対し、UTF-8 の文字数（コードポイント）の上限を検証する ValidatorInterface 実装。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/footer.twig:31:                <div class="p-hareruya-footer__feature-icon"><i class="icon-hareruya-point c-hareruya-icon--lg"></i></div>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/footer.twig:32:                <p class="p-hareruya-footer__feature-text">{{ 'front.footer.feature.point'|trans }}</p>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/tenant/detail.twig:221:    <form name="form1" role="form" class="form-horizontal h-adr" id="point_form" method="post" action="" enctype="multipart/form-data">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content.twig:29:　ポイント使用(値引き)：{{ (0 - data.discount)|number_format }} ポイント
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:526:	 (161466,17606,1,2,377,68,1,NULL,'見るものの視点により、その印章が示すものは、自然の巡りを護る名誉ある守護者にも、永遠の生命のために魂を闇に売り渡した者にもなる。','Depending on your point of view, the seal represents a proud guardian of the natural cycle or one who has sold her soul to darkness for eternal life.','{1}, {Tap}：{Black}{Green}を加える。','{1}, {Tap}: Add {Black}{Green}.','','','272',0,false,0,'2024-07-21 05:07:08+09','2025-07-31 21:37:47+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:3302:When Glimmerpoint Stag enters the battlefield, exile another target permanent. Return that card to the battlefield under its owner''s control at the beginning of the next end step.','3','3','SOM-9',0,false,0,'2024-08-22 21:20:57+09','2025-07-31 21:21:24+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:11256:	 (166317,4661,1,2,381,84,1,NULL,'クローサの森に火を放っても無駄なことだ。そいつは燃えるよりも速く成長する。','Torching Krosa would be pointless. It grows faster than it burns.','あなたのライブラリーから基本土地・カード最大２枚を探し、タップ状態で戦場に出す。その後、ライブラリーを切り直す。','Search your library for up to two basic land cards, put them onto the battlefield tapped, then shuffle.','','','177',0,false,0,'2024-09-15 05:34:59+09','2025-07-31 20:51:06+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:11470:	 (166386,17606,1,2,381,68,1,NULL,'見るものの視点により、その印章が示すものは、自然の巡りを護る名誉ある守護者にも、永遠の生命のために魂を闇に売り渡した者にもなる。','Depending on your point of view, the seal represents a proud guardian of the natural cycle or one who has sold her soul to darkness for eternal life.','{1}, {Tap}：{Black}{Green}を加える。','{1}, {Tap}: Add {Black}{Green}.','','','246',0,false,0,'2024-09-15 05:35:02+09','2025-07-31 21:37:47+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:11551:――ジェイス・ベレレン','"This is it! All the cryptoliths point here!"
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:13359:	 (167105,42702,1,2,382,3087,1,NULL,'「では反撃させて頂こう。」','"Allow me to offer a counterpoint."','攻撃かブロックしているクリーチャー１体を対象とする。突き通しはそれに３点のダメージを与える。あなたは１点のライフを得る。','Joust Through deals 3 damage to target attacking or blocking creature. You gain 1 life.','','','19',0,false,0,'2024-11-03 04:14:10+09','2025-07-31 22:35:48+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:13919:――鉄面提督ベケット','"The Brazen Coalition is a firecannon pointed at our enemies. Goblins like him are the spark to its powder."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:15265:	 (167720,22691,1,2,382,171,1,NULL,'','"The shortest path between two points is not always the safest."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:17667:	 (168613,42702,1,2,382,3087,1,NULL,'「では反撃させて頂こう。」','"Allow me to offer a counterpoint."','攻撃かブロックしているクリーチャー１体を対象とする。突き通しはそれに３点のダメージを与える。あなたは１点のライフを得る。','Joust Through deals 3 damage to target attacking or blocking creature. You gain 1 life.','','','19',1,false,0,'2024-11-03 05:39:02+09','2025-07-31 22:35:48+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:18205:――鉄面提督ベケット','"The Brazen Coalition is a firecannon pointed at our enemies. Goblins like him are the spark to its powder."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:23955:	 (171138,43107,1,1,387,3152,1,NULL,'「そいつは空鯨を捕まえるために拵えられた網さ。次のチェックポイントにたどり着けるよう祈ってあげるよ！」','"That net was made to hold skywhales. Good luck getting to the next checkpoint!"','土地でないパーマネント１つを対象とする。それのオーナーはそれを自分のライブラリーの一番上か一番下のうち選んだほうに置く。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:24224:――ダレッティ','"No, it''s not quite as simple as ‘point and boom,'' but if you must summarize."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:26370:	 (171891,4661,1,2,390,84,1,NULL,'クローサの森に火を放っても無駄なことだ。そいつは燃えるよりも速く成長する。','Torching Krosa would be pointless. It grows faster than it burns.','あなたのライブラリーから基本土地・カード最大２枚を探し、タップ状態で戦場に出す。その後、ライブラリーを切り直す。','Search your library for up to two basic land cards, put them onto the battlefield tapped, then shuffle.','','','112',0,false,0,'2025-02-02 03:07:39+09','2025-07-31 20:51:06+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:26979:	 (172068,43107,1,1,387,3152,1,NULL,'「そいつは空鯨を捕まえるために拵えられた網さ。次のチェックポイントにたどり着けるよう祈ってあげるよ！」','"That net was made to hold skywhales. Good luck getting to the next checkpoint!"','土地でないパーマネント１つを対象とする。それのオーナーはそれを自分のライブラリーの一番上か一番下のうち選んだほうに置く。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:27246:――ダレッティ','"No, it''s not quite as simple as ‘point and boom,'' but if you must summarize."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:31532:	 (173425,43557,1,1,391,1368,1,NULL,'「表現や結果の問題ではない。実行すること、それ自体が大事なのだ。」','"It isn''t about expression or results. Doing the thing is itself the point."','果敢（あなたがクリーチャーでない呪文１つを唱えるたび、ターン終了時まで、このクリーチャーは＋１/＋１の修整を受ける。）
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:35555:――ジェイス・ベレレン','"This is it! All the cryptoliths point here!"
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:45424:あなたがコントロールしているクリーチャー１体が対戦相手１人に戦闘ダメージを与えるたび、ストリクスヘイヴンの競技場の上に得点カウンター１個を置く。その後、これの上に10個以上の得点カウンターが置かれているなら、それらすべてを取り除き、そのプレイヤーはこのゲームに敗北する。','{Tap}: Add {Colorless}. Put a point counter on Strixhaven Stadium.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:45425:Whenever a creature deals combat damage to you, remove a point counter from Strixhaven Stadium.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:45426:Whenever a creature you control deals combat damage to an opponent, put a point counter on Strixhaven Stadium. Then if it has ten or more point counters on it, remove them all and that player loses the game.','','','63',0,false,0,'2025-06-01 06:38:51+09','2025-07-31 21:59:31+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:45620:あなたがコントロールしているクリーチャー１体が対戦相手１人に戦闘ダメージを与えるたび、ストリクスヘイヴンの競技場の上に得点カウンター１個を置く。その後、これの上に10個以上の得点カウンターが置かれているなら、それらすべてを取り除き、そのプレイヤーはこのゲームに敗北する。','{Tap}: Add {Colorless}. Put a point counter on Strixhaven Stadium.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:45621:Whenever a creature deals combat damage to you, remove a point counter from Strixhaven Stadium.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:45622:Whenever a creature you control deals combat damage to an opponent, put a point counter on Strixhaven Stadium. Then if it has ten or more point counters on it, remove them all and that player loses the game.','','','63',1,false,0,'2025-06-01 06:38:53+09','2025-07-31 21:59:31+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_5.sql:46617:	 (179542,8708,1,2,402,23,1,NULL,'','"All creation in a single point, the point of all creation in all."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/sell_order.twig:20:　ポイント使用(値引き)：{{ (0 - Order.discount)|price }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order.html.twig:38:                            {% if BaseInfo.isOptionPoint and Order.Customer is not null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order.html.twig:39:                            ご利用ポイント：{{ Order.usePoint|number_format }} pt<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order.html.twig:40:                            加算ポイント：{{ Order.addPoint|number_format }} pt<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:95:common.discount.point: Points used
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:96:common.point: Points
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:161:front.block.point.unit: pt
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:162:front.block.point.label: Points
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:525:front.mypage.welcome__point: "You have %point%points"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:538:front.mypage.index.current_point: Current points
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:539:front.mypage.index.point_expiring_soon: Points expiring soon
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:577:front.mypage.use_point: Points Used
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:578:front.mypage.add_point: Points Earned
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:619:front.mypage.point_history.title: Point history list
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:620:front.mypage.point_history.point.now: Point history
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:621:front.mypage.point_history.point.current_label: Current points
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:622:front.mypage.point_history.next_expire_label: Next points to expire
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:623:front.mypage.point_history.not_found: No point history found.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:624:front.mypage.point_history.range_info: "Showing %start%–%end% of %total%"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:625:front.mypage.point_history.display_count_label: Items per page
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:626:front.mypage.point_history.items_per_page: "%count% items"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:627:front.mypage.point_history.col.issue_date: Date (earned/used)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:628:front.mypage.point_history.col.order_no: Order no.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:629:front.mypage.point_history.col.point: Points
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:630:front.mypage.point_history.col.expire: Expires
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:631:front.mypage.point_history.col.note: Description
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:746:front.mypage.shopping_history.col.point_used: Points Used
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:748:front.mypage.shopping_history.col.point_generated: Points Generated
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1169:front.shopping.notice.point: "※Points earned will be activated when your order ships."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1171:front.shopping.point_otc_notice: To use your points, please inform the staff at the time of in-store payment.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1222:front.shopping.save: Earn Points
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1223:front.shopping.use: Use Points
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1224:front.shopping.payment_none: Pay in full with points
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1237:front.shopping.point_info: Your Points
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1238:front.shopping.available_point: "You have %point% pts."
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1239:front.shopping.payment.point_balance_label: "Current point balance:"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1240:front.shopping.payment.point_usage_method: "Select how to use points"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1241:front.shopping.payment.use_point_count: "Points to use"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1242:front.shopping.payment.enable_point_input: "Enable point input"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1243:front.shopping.point_prev: Points Used
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1244:front.shopping.prev_point: Points before This Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1245:front.shopping.next_point: Points after This Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1246:front.shopping.add_point: Points Earned
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1247:front.shopping.use_point: Points Used
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1248:front.shopping.point_balance: Points Balance
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1742:admin.common.point: Points
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2266:admin.order.point_rate: Point Rate
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2270:admin.order.add_point: Points Earned
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2271:admin.order.use_point: Points Used
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2385:admin.delivery_slips_ja.point_out: ポイント使用
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2403:admin.delivery_slips_en.point_out: Points Used
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2404:admin.delivery_slips_en.point: Points
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2629:admin.setting.shop.shop.option_point: Point Settings
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2630:admin.setting.shop.shop.option_point_enabled: Points
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2631:admin.setting.shop.shop.option_point_rate: Point Return Rate
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:2632:admin.setting.shop.shop.option_point_conversion_rate: Point Conversion Rate
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3189:tooltip.setting.shop.shop.option_point_enabled: If turned on, the point system is enabled.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3190:tooltip.setting.shop.shop.option_point_rate: You can change the point return rate by purchase amount.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3191:tooltip.setting.shop.shop.option_point_conversion_rate: Conversion rate per 1 point. E.g. If you set ''1'', the point becomes available to shoppers with the rate of 1 point = 1 yen.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3320:purchase_flow.over_customer_point: You are not able to use points more than your current points.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3321:purchase_flow.over_payment_total: The points are more than the total amount.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3439:admin.stock.split_join.list.source_destination_points_price: Source / Destination Points / Price
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3440:admin.stock.split_join.list.source_destination_points: Source / Destination Points
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3441:admin.stock.split_join.list.destination_source_points_price: Destination / Source Points / Price
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3442:admin.stock.split_join.list.destination_source_points: Destination / Source Points
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3449:admin.stock.split_join.split_count_points: Split Count / Points
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3868:front.footer.feature.point: 'Earn 1% points'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3932:front.nav.point.label: 'Points'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3933:front.nav.point.unit: 'pt'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:3934:front.nav.point.aria_label: 'Your points'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:4137:front.seo.top.meta_description: 'Welcome to Hareruya, Japan''s largest MTG/Magic: The Gathering specialty store! Same-day shipping, point rewards, and over 100,000 cards in stock!'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/order_content.twig:29:　ポイント使用(値引き)：{{ (0 - data.discount)|number_format }} ポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/validators.en.yaml:40:form_error.float_only: Entry must be numbers and decimal points.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/validators.en.yaml:56:errors.float_only: Entry must be numbers and decimal points.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/validators.en.yaml:76:form.type.float.invalid: Only numbers and decimal points are accepted.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/product_list.en.twig:54:                breakpoints: {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:5:{% block title %}{{ 'admin.customer.point_update'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:15:                {% if pointUpdateFlg %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:17:                        <form name="customer_point_form" role="form" id="customer_address_form" method="post"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:18:                              action="{{ url('admin_customer_point_update', { id : Customer.id, type: type }) }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:24:                                        <span class="card-title">{{ pointTypeLabelKey|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:27:                                        <a data-bs-toggle="collapse" href="#pointFormInfo" aria-expanded="false" aria-controls="pointFormInfo">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:33:                            <div class="collapse show ec-cardCollapse" id="pointFormInfo">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:37:                                            <span>{{ 'admin.customer.point.order_id'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:47:                                            <span>{{ 'admin.customer.point.point_change'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:51:                                            {{ form_widget(form.pointChange) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:52:                                            {{ form_errors(form.pointChange) }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:58:                                            <span>{{ 'admin.customer.point.issue_date'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:69:                                            <span>{{ 'admin.customer.point.note'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:99:                                    {{ 'admin.customer.point_select'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:105:                                ポイント残高: {{ Customer.Player.point }}pt
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:109:                    <div class="collapse show ec-cardCollapse" id="pointHistory">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:116:                                    <th class="align-middle pt-2 pb-2 pe-3">{{ 'admin.common.point_charge'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:119:                                    <th class="align-middle pt-2 pb-2 pe-3">{{ 'admin.common.point_create_date'|trans }}</th>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:123:                                {% for PointHistory in Customer.PointHistories %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:126:                                            {{ PointHistory.id }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:129:                                            {{ PointHistory.Customer.name01 }} {{ PointHistory.Customer.name02 }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:132:                                             {% if PointHistory.Order %}{{ PointHistory.Order.order_number }}{%endif %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:135:                                            {{ PointHistory.point_change }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:138:                                            {{ PointHistory.note }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:141:                                            {{ PointHistory.issue_date|date('Y/m/d') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:144:                                            {{ PointHistory.create_date|date('Y/m/d') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:147:                                            {{ PointHistory.issue_date|date_modify("+" ~ eccube_config.eccube_customer_point_expire ~ " day")|date_format }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/purchase_new_product.twig:33:            breakpoints: [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_select.twig:5:{% block title %}{{ 'admin.customer.point_select'|trans }}{% endblock %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_select.twig:14:                            <a class="point-type-select" href="{{ url('admin_customer_point_history', { 'id': Customer.id, 'type': constant('Eccube\\Entity\\Master\\MtbPointType::GRANTED') }) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_select.twig:16:                                    {{ 'admin.customer.point.granted'|trans|nl2br }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_select.twig:23:                            <a class="point-type-select" href="{{ url('admin_customer_point_history', { 'id': Customer.id, 'type': constant('Eccube\\Entity\\Master\\MtbPointType::PURCHASE') }) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_select.twig:25:                                    {{ 'admin.customer.point.purchase'|trans|nl2br }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:100:common.discount.point: ポイント使用
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:101:common.point: ポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:279:front.block.point.unit: pt
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:280:front.block.point.label: ポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:636:front.mypage.welcome__point: "現在の所持ポイントは %point%pt です。"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:676:front.mypage.use_point: ご利用ポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:677:front.mypage.add_point: 加算ポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:769:front.mypage.index.current_point: 現在のポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:770:front.mypage.index.point_expiring_soon: 期限の近いポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:813:front.mypage.point_history.title: ポイント履歴一覧
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:814:front.mypage.point_history.point.now: ポイント履歴
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:815:front.mypage.point_history.point.current_label: 現在のポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:816:front.mypage.point_history.next_expire_label: 次に消失するポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:817:front.mypage.point_history.not_found: ポイント履歴はありません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:818:front.mypage.point_history.range_info: "件数: %total%件"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:819:front.mypage.point_history.display_count_label: 表示件数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:820:front.mypage.point_history.items_per_page: "%count%件"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:821:front.mypage.point_history.col.issue_date: 利用or獲得日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:822:front.mypage.point_history.col.order_no: 注文番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:823:front.mypage.point_history.col.point: ポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:824:front.mypage.point_history.col.expire: 有効期限
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:825:front.mypage.point_history.col.note: 内容
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:992:front.mypage.shopping_history.col.point_used: ポイント使用
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:994:front.mypage.shopping_history.col.point_generated: ポイント発生
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1011:front.mypage.order_receipt.point_out: ポイント使用
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1013:front.mypage.order_receipt.point: ポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1410:front.shopping.notice.point: ※獲得ポイントは商品出荷時に有効になります。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1412:front.shopping.point_otc_notice: ポイントのご利用は、店頭にてお支払いいただく際にお申し付けください。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1468:front.shopping.point_info: ポイント使用
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1469:front.shopping.available_point: "現在のポイント残高: %point% pt"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1470:front.shopping.payment.point_balance_label: 現在のポイント残高:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1471:front.shopping.payment.point_usage_method: ポイントの使用方法を選択
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1472:front.shopping.payment.use_point_count: 使用ポイント数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1473:front.shopping.payment.enable_point_input: ポイント入力を有効化
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1474:front.shopping.point_prev: 利用ポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1475:front.shopping.prev_point: ご注文前のポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1476:front.shopping.next_point: ご注文後のポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1477:front.shopping.add_point: 加算ポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1478:front.shopping.use_point: ご利用ポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1479:front.shopping.point_balance: ポイント残高
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1480:front.shopping.save: ポイントをためる
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1481:front.shopping.use: ポイントを使う
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1482:front.shopping.payment_none: 全額ポイント支払い
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1785:admin.common.point: ポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1812:admin.common.point_charge: 増減量
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1815:admin.common.point_create_date: 設定日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2469:admin.order.point_rate: ポイント付与率
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2473:admin.order.add_point: 加算ポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2474:admin.order.use_point: 利用ポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2601:admin.delivery_slips_ja.point_out: ポイント使用
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2619:admin.delivery_slips_en.point_out: Points Used
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2620:admin.delivery_slips_en.point: Points
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2687:admin.customer.point_type_select: ポイント管理・履歴一覧
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2688:admin.customer.point_history: ポイント確認
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2692:admin.customer.point_select: ポイント履歴
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2693:admin.customer.point_update: ポイント履歴確認
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2771:admin.customer.point.granted: |
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2772:  ・キャンペーンによるポイント付与
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2774:admin.customer.point.purchase: |
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2777:admin.customer.point_update.granted: ポイント履歴追加（キャンペーン、特別対応）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2778:admin.customer.point_update.purchase: ポイント履歴追加（余剰入金へのご返金、注文金額変更によるご送金）
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2779:admin.customer.point.order_id: 注文番号
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2780:admin.customer.point.point_change: ポイント増減量
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2781:admin.customer.point.point_change_ex: "例1: 1000, 例2: -500"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2782:admin.customer.point.issue_date: ポイント発行日
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2783:admin.customer.point.note: 備考
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2784:admin.customer.point.refund_type_special_handling: 特別対応
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2785:admin.customer.point.refund_type_overpayment: 余剰入金へのご返金
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2786:admin.customer.point.refund_type_order_change: 注文金額変更によるご返金
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2787:admin.customer.point.form.not_has.order_no: この会員は該当のオーダーIDを持っていません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:2788:admin.customer.point.point_charge.point_minus: ポイント残高を0未満にすることはできません。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3016:admin.setting.shop.shop.option_point: ポイント設定
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3017:admin.setting.shop.shop.option_point_enabled: ポイント機能
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3018:admin.setting.shop.shop.option_point_rate: ポイント付与率
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3019:admin.setting.shop.shop.option_point_conversion_rate: ポイント換算レート
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3617:tooltip.setting.shop.shop.option_point_enabled: オンにすると、ポイント機能を有効化できます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3618:tooltip.setting.shop.shop.option_point_rate: 購入金額に対するポイント付与率を編集できます。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3619:tooltip.setting.shop.shop.option_point_conversion_rate: 1ポイントあたりの換算レートです。例：「1」と設定すると1ポイント「1円」として利用可能になります。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3756:purchase_flow.over_customer_point: 利用ポイントが所有ポイントを上回っています。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:3757:purchase_flow.over_payment_total: 利用ポイントがお支払い金額を上回っています。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4075:admin.customer.customer_group.point_percentage: ポイント還元率(%)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4076:admin.customer.customer_group.point_percentage_list: ポイント率
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4167:admin.setting.shop.add_system.check_not_reflected_point_usage_mail_address: ポイント利用が反映されない決済の送信先メールアドレス
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4168:admin.setting.shop.add_system.adjust_point_variance_mail_address: ポイント差分発生通知メールアドレス
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4872:admin.stock.split_join.list.source_destination_points_price: 分割元・結合先点数/価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4873:admin.stock.split_join.list.source_destination_points: 分割元・結合先点数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4874:admin.stock.split_join.list.destination_source_points_price: 分割先・結合元点数/価格
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4875:admin.stock.split_join.list.destination_source_points: 分割先・結合元点数
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4882:admin.stock.split_join.split_count_points: 分割数・ポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:4975:admin.stock.split.split_points_total: '分割点数: %count%点'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:5070:admin.stock.join.source_count_points: 結合元商品 %count%点
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6346:front.footer.feature.point: ポイントが1%貯まる
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6410:front.nav.point.label: ポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6411:front.nav.point.unit: pt
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6412:front.nav.point.aria_label: 保有ポイント
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6615:front.seo.top.meta_description: '国内最大級MTG/マジック：ザ・ギャザリング専門店の晴れる屋へようこそ！通販は即日発送、ポイント還元あり、10万点以上の豊富な品揃え！'
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6646:admin.支払いなし.ja: 全額ポイント支払い
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6656:admin.支払いなし.en: Pay in full with points
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/order.twig:18:{% if BaseInfo.isOptionPoint and Order.Customer is not null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/order.twig:19:ご利用ポイント：{{ Order.usePoint|number_format }} pt
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/order.twig:20:加算ポイント：{{ Order.addPoint|number_format }} pt
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/order.html.twig:38:                            {% if BaseInfo.isOptionPoint and Order.Customer is not null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/order.html.twig:39:                            ご利用ポイント：{{ Order.usePoint|number_format }} pt<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/1/order.html.twig:40:                            加算ポイント：{{ Order.addPoint|number_format }} pt<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig:1038:                                       href="{{ url('admin_customer_point_select', { 'id': Customer.id}) }}">{{ 'admin.customer.point_type_select'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig:1043:                                       href="{{ url('admin_customer_point_history', { 'id': Customer.id, 'type': constant('Eccube\\Entity\\Master\\MtbPointType::HISTORY') }) }}">{{ 'admin.customer.point_history'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/point_expire_notification.twig:5:{{ point }}ポイント　有効期限　{{ expireDate|date('Y/m/d') }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/order_content_tax.en.twig:28: Points Used : {{ (0 - data.discount)|number_format }} Points
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/mail_history.twig:50:                    <div class="collapse show ec-cardCollapse" id="pointHistory">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/point_expire_notification.en.twig:5:Points nearing expiration:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Mall/point_expire_notification.en.twig:6:{{ point }} points
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/order.html.twig:38:                            {% if BaseInfo.isOptionPoint and Order.Customer is not null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/order.html.twig:39:                            ご利用ポイント：{{ Order.usePoint|number_format }} pt<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/order.html.twig:40:                            加算ポイント：{{ Order.addPoint|number_format }} pt<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/order.twig:18:{% if BaseInfo.isOptionPoint and Order.Customer is not null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/order.twig:19:ご利用ポイント：{{ Order.usePoint|number_format }} pt
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/2/order.twig:20:加算ポイント：{{ Order.addPoint|number_format }} pt
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_header.twig:43:                <div class="p-hareruya-header__point p-hareruya-header__point--branch">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_header.twig:44:                    <a class="p-hareruya-header__point-link" href="{{ url('mypage') }}" aria-label="{{ 'front.nav.point.aria_label'|trans }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_header.twig:45:                        <span class="p-hareruya-header__point-value">{{ app.user.point|number_format }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/branch_header.twig:46:                        <span class="p-hareruya-header__point-unit">{{ 'front.nav.point.unit'|trans }}</span>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/UpdateUserAction.php:68:            $Player->getPoint(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/UpdateUserAction.php:70:            $Player->getPointContactNumber(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/UpdateUserAction.php:71:            $Player->getPointTransferFlg(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/DeckBuilder/UpdateUserAction.php:72:            $Player->getPointLinkedFailureCount(),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/identification_js.twig:179:            }).css('cursor','pointer');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/point_barcode_js.twig:3:    $('#js-ec_point_timer').startTimer({
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/point_barcode_js.twig:6:            const $current = $('.ec-transPoint-barcode__currentPoint');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/point_barcode_js.twig:7:            const $valueWrap = $current.closest('.p-hareruya-mypage__barcode-point-value');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/point_barcode_js.twig:8:            const $row = $current.closest('.p-hareruya-mypage__barcode-point');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/point_barcode_js.twig:10:                .removeClass('p-hareruya-mypage__barcode-point-number')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/point_barcode_js.twig:13:            $valueWrap.addClass('p-hareruya-mypage__barcode-point-value--expired');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/point_barcode_js.twig:14:            $row.addClass('p-hareruya-mypage__barcode-point--barcode-expired');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/point_barcode_js.twig:15:            $valueWrap.find('.p-hareruya-mypage__barcode-point-unit').hide();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/point_barcode_js.twig:16:            $('#js-ec_point_timer').html('');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/point_barcode_js.twig:17:            $('#js-ec_point_barcode').html('<a href="" class="ec-transPoint-barcode__inner__reset">{{ "front.mypage.barcode.restate"|trans|e('js') }}</a>')
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/point_barcode_js.twig:22:        {#$("#js-ec_point_barcode").barcode('{{ Customer.getSmaregiMemberCode }}', "ean13", { barWidth:2, fontSize:14 });#}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/point_barcode_js.twig:23:        $("#js-ec_point_barcode").barcode('2900065596792', "ean13", { barWidth:2, fontSize:14 });
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/product_unisearch_tagged_block_js.twig:53:            const responsive = (carouselConfig.breakpoints || [])
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/product_unisearch_tagged_block_js.twig:58:                        breakpoint: bp.width,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterInput.php:16:namespace Eccube\Service\App\PointGranter;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterInput.php:19: * PointGranterAction用入力DTO
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterInput.php:21:class PointGranterInput
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/OtcBuy/otc_buy_register_customer_js.twig:25:                $("[id^='otcBuyOrderApply']").css('pointer-events', 'auto');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/OtcBuy/otc_buy_register_customer_js.twig:40:                $("[id^='otcBuyOrderApply']").css('pointer-events', 'auto');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/ProductSearch/ProductSearchResponseBuilder.php:26:    private string $s3Endpoint;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/ProductSearch/ProductSearchResponseBuilder.php:33:        $this->s3Endpoint = $params->get('s3_endpoint');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/ProductSearch/ProductSearchResponseBuilder.php:257:        return $this->s3Endpoint.$this->awsS3Bucket.'/'.$path;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterAction.php:16:namespace Eccube\Service\App\PointGranter;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterAction.php:20:use Eccube\Repository\Master\MtbPointTypeRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterAction.php:21:use Eccube\Service\EntityManager\PointHistoryEntityManager;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterAction.php:23:class PointGranterAction
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterAction.php:27:        private readonly MtbPointTypeRepository $mtbPointTypeRepository,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterAction.php:29:        private readonly PointHistoryEntityManager $pointHistoryEntityManager,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterAction.php:34:     * ポイント付与処理を実行する
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterAction.php:36:     * @param PointGranterInput $input
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterAction.php:42:    public function handle(PointGranterInput $input): void
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterAction.php:47:        $newPoint = isset($row['newPoint']) ? (int) $row['newPoint'] : 0;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterAction.php:50:        $pointAttr = isset($row['pointAttr']) ? (int) $row['pointAttr'] : null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterAction.php:62:            if ($pointAttr !== null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterAction.php:63:                $PointType = $this->mtbPointTypeRepository->find($pointAttr);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterAction.php:66:            $Player->setPoint($Player->getPoint() + $newPoint);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterAction.php:68:            $this->pointHistoryEntityManager->save(
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterAction.php:69:                PointHistory: null,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterAction.php:72:                PointType: $PointType ?? null,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterAction.php:73:                pointChange: $newPoint,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/OtcBuy/otc_buy_order_js.twig:97:                $("[id^='otcBuyOrderApply']").css('pointer-events', 'auto');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/OtcBuy/otc_buy_order_js.twig:140:            $('[id^="otcBuyOrderApply"]').css('pointer-events', 'auto');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/Purchase/purchase_js.twig:23:        // オーバーレイは pointer-events: none のためクリックされない。× のみ手動で閉じる。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/mtb_order_item_type.csv:7:"6","ポイント","5"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/ProductDetail/ProductDetailResponseBuilder.php:26:    private string $s3Endpoint;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/ProductDetail/ProductDetailResponseBuilder.php:33:        $this->s3Endpoint = $params->get('s3_endpoint');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/ProductDetail/ProductDetailResponseBuilder.php:223:        return $this->s3Endpoint.$this->awsS3Bucket.'/'.$path;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:204:"205","2",,"Eccube\\Entity\\Customer","point",,"ポイント","33","1","2017-03-07 10:14:00","2017-03-07 10:14:00"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:50:     * @method int|null getGainedPoints()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:51:     * @method Order setGainedPoints(?int $gained_points)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:52:     * @method int|null getSpendedPoints()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:53:     * @method Order setSpendedPoints(?int $spended_points)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:90:     * @method string|null getPointErrorMessage()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:91:     * @method Order setPointErrorMessage(?string $point_error_message)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:92:     * @method int|null getPointPercentage()
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:93:     * @method Order setPointPercentage(?int $pointPercentage)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:157:        use PointTrait;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:336:            return array_filter($items, fn (OrderItem $Item) => $Item->isPoint() || ($Item->isDiscount() && $Item->getTaxType()->getId() != TaxType::TAXATION));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:654:        #[ORM\Column(name: 'gained_points', type: Types::INTEGER, nullable: true, options: ['unsigned' => true, 'comment' => 'ポイント発生'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:655:        private ?int $gained_points = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:657:        #[ORM\Column(name: 'spended_points', type: Types::INTEGER, nullable: true, options: ['unsigned' => true, 'comment' => 'ポイント使用'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:658:        private ?int $spended_points = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:717:        #[ORM\Column(name: 'point_error_message', type: Types::TEXT, nullable: true, options: ['comment' => 'ポイント連携エラーメッセージ'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:718:        private ?string $point_error_message = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:720:        #[ORM\Column(name: 'point_percentage', type: Types::INTEGER, nullable: true, options: ['unsigned' => true, 'comment' => 'ポイント還元率(%)'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:721:        private ?int $pointPercentage = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1792:        public function getGainedPoints(): ?int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1794:            return $this->gained_points;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1797:        public function setGainedPoints(?int $gained_points): Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1799:            $this->gained_points = $gained_points;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1804:        public function getSpendedPoints(): ?int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1806:            return $this->spended_points;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1809:        public function setSpendedPoints(?int $spended_points): Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1811:            $this->spended_points = $spended_points;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2032:        public function getPointErrorMessage(): ?string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2034:            return $this->point_error_message;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2037:        public function setPointErrorMessage(?string $point_error_message): Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2039:            $this->point_error_message = $point_error_message;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2044:        public function setPointPercentage(?int $pointPercentage): Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2046:            $this->pointPercentage = $pointPercentage;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2051:        public function getPointPercentage(): ?int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:2053:            return $this->pointPercentage;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/order.twig:18:{% if BaseInfo.isOptionPoint and Order.Customer is not null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/order.twig:19:ご利用ポイント：{{ Order.usePoint|number_format }} pt
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/order.twig:20:加算ポイント：{{ Order.addPoint|number_format }} pt
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/ja/dtb_base_info.csv:1:id,country_id,pref_id,company_name,company_kana,postal_code,addr01,addr02,phone_number,business_hour,email01,email02,email03,email04,shop_name,shop_kana,shop_name_eng,update_date,good_traded,message,delivery_free_amount,delivery_free_quantity,option_mypage_order_status_display,option_nostock_hidden,option_favorite_product,option_product_delivery_fee,option_product_tax_rule,option_customer_activate,option_remember_me,option_mail_notifier,authentication_key,option_point,basic_point_rate,point_conversion_rate
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/order.html.twig:38:                            {% if BaseInfo.isOptionPoint and Order.Customer is not null %}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/order.html.twig:39:                            ご利用ポイント：{{ Order.usePoint|number_format }} pt<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Mail/Tenant/3/order.html.twig:40:                            加算ポイント：{{ Order.addPoint|number_format }} pt<br/>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:20:use Eccube\Entity\Master\MtbPointType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:21:use Eccube\Repository\DtbPointHistoryRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:23:#[ORM\Table(name: 'dtb_point_history')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:25:#[ORM\Entity(repositoryClass: DtbPointHistoryRepository::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:27:class DtbPointHistory extends AbstractEntity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:35:    #[ORM\ManyToOne(targetEntity: Customer::class, inversedBy: 'PointHistories')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:42:    #[ORM\JoinColumn(name: 'point_type_id', nullable: true, referencedColumnName: 'id', options: ['unsigned' => true, 'comment' => 'ポイント属性ID'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:43:    #[ORM\ManyToOne(targetEntity: MtbPointType::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:44:    private ?MtbPointType $PointType = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:46:    #[ORM\Column(name: 'point_change', type: Types::INTEGER, nullable: true, options: ['default' => 0, 'comment' => 'ポイント増減量'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:47:    private ?int $pointChange = 0;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:52:    #[ORM\Column(name: 'issue_date', type: Types::DATETIMETZ_MUTABLE, options: ['comment' => 'ポイント発行日'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:66:    public function setId(int $id): DtbPointHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:73:    public function setPointChange(?int $pointChange): DtbPointHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:75:        $this->pointChange = $pointChange;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:80:    public function getPointChange(): ?int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:82:        return $this->pointChange;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:85:    public function setNote(?string $note): DtbPointHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:97:    public function setIssueDate(?\DateTime $issueDate): DtbPointHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:118:    public function setCreateDate(?\DateTime $createDate): DtbPointHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:130:    public function setCustomer(Customer $Customer): DtbPointHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:142:    public function setOrder(?Order $Order): DtbPointHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:154:    public function setPointType(MtbPointType $PointType): DtbPointHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:156:        $this->PointType = $PointType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:161:    public function getPointType(): MtbPointType
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:163:        return $this->PointType;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:166:    public function setTransactionId(?int $transactionId): DtbPointHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ItemHolderInterface.php:80:     * 加算ポイントを設定します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ItemHolderInterface.php:84:    public function setAddPoint(string $addPoint): static;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ItemHolderInterface.php:87:     * 加算ポイントを返します.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ItemHolderInterface.php:89:    public function getAddPoint(): string;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ItemHolderInterface.php:92:     * 利用ポイントを設定します。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ItemHolderInterface.php:96:    public function setUsePoint(string $usePoint): static;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ItemHolderInterface.php:99:     * 利用ポイントを返します.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ItemHolderInterface.php:101:    public function getUsePoint(): ?string;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/product_detail_js.twig:188:                responsive: [{ breakpoint: 768, settings: { slidesToShow: 3, slidesToScroll: 1, arrows: true } }]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PointTrait.php:19:trait PointTrait
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PointTrait.php:21:    #[ORM\Column(name: 'add_point', type: Types::DECIMAL, precision: 12, scale: 0, options: ['unsigned' => true, 'default' => 0])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PointTrait.php:22:    private ?string $add_point = '0';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PointTrait.php:24:    #[ORM\Column(name: 'use_point', type: Types::DECIMAL, precision: 12, scale: 0, options: ['unsigned' => true, 'default' => 0])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PointTrait.php:25:    private ?string $use_point = '0';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PointTrait.php:28:     * Set addPoint
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PointTrait.php:32:    public function setAddPoint(string $addPoint): static
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PointTrait.php:34:        $this->add_point = $addPoint;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PointTrait.php:40:     * Get addPoint
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PointTrait.php:42:    public function getAddPoint(): string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PointTrait.php:44:        return $this->add_point;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PointTrait.php:48:     * Set usePoint
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PointTrait.php:52:    public function setUsePoint(?string $usePoint): static
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PointTrait.php:54:        $this->use_point = $usePoint;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PointTrait.php:60:     * Get usePoint
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PointTrait.php:62:    public function getUsePoint(): ?string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PointTrait.php:64:        return $this->use_point;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:150:        #[ORM\Column(name: 'option_point', type: Types::BOOLEAN, options: ['default' => true])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:151:        private ?bool $option_point = true;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:153:        #[ORM\Column(name: 'basic_point_rate', type: Types::DECIMAL, precision: 10, scale: 0, options: ['unsigned' => true, 'default' => 1], nullable: true)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:154:        private ?string $basic_point_rate = '1';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:156:        #[ORM\Column(name: 'point_conversion_rate', type: Types::DECIMAL, precision: 10, scale: 0, options: ['unsigned' => true, 'default' => 1], nullable: true)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:157:        private ?string $point_conversion_rate = '1';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:799:         * Set optionPoint
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:801:        public function setOptionPoint(bool $optionPoint): BaseInfo
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:803:            $this->option_point = $optionPoint;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:809:         * Get optionPoint
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:811:        public function isOptionPoint(): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:813:            return $this->option_point;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:817:         * Set pointConversionRate
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:819:        public function setPointConversionRate(?string $pointConversionRate): BaseInfo
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:821:            $this->point_conversion_rate = $pointConversionRate;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:827:         * Get pointConversionRate
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:829:        public function getPointConversionRate(): ?string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:831:            return $this->point_conversion_rate;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:835:         * Set basicPointRate
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:837:        public function setBasicPointRate(?string $basicPointRate): BaseInfo
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:839:            $this->basic_point_rate = $basicPointRate;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:845:         * Get basicPointRate
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:847:        public function getBasicPointRate(): ?string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:849:            return $this->basic_point_rate;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/SmaregiPlatformApiCallLog.php:46:    public const OPERATION_CUSTOMER_POINT_UPDATE = 'customer_point_update';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ItemInterface.php:49:     * ポイント明細かどうか.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ItemInterface.php:51:     * @return bool ポイント明細の場合 true
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ItemInterface.php:53:    public function isPoint(): bool;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ItemInterface.php:77:    public function getPointRate(): ?string;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/CartItem.php:34:        use PointRateTrait;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/CartItem.php:167:         * ポイント明細かどうか.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/CartItem.php:169:         * @return bool ポイント明細の場合 true
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/CartItem.php:172:        public function isPoint(): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PointRateTrait.php:19:trait PointRateTrait
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PointRateTrait.php:21:    #[ORM\Column(name: 'point_rate', type: Types::DECIMAL, precision: 10, scale: 0, options: ['unsigned' => true], nullable: true)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PointRateTrait.php:22:    private ?string $point_rate = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PointRateTrait.php:25:     * Set pointRate
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PointRateTrait.php:29:    public function setPointRate(?string $pointRate): static
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PointRateTrait.php:31:        $this->point_rate = $pointRate;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PointRateTrait.php:37:     * Get pointRate
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PointRateTrait.php:39:    public function getPointRate(): ?string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/PointRateTrait.php:41:        return $this->point_rate;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/recommend_js.twig:26:                        breakpoints: {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:225:        #[ORM\Column(name: 'point_rate', type: Types::DECIMAL, precision: 10, scale: 0, options: ['unsigned' => true], nullable: true)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:226:        private ?string $point_rate = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:790:         * Set pointRate
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:792:        public function setPointRate(?string $pointRate): ProductClass
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:794:            $this->point_rate = $pointRate;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:800:         * Get pointRate
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:802:        public function getPointRate(): ?string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:804:            return $this->point_rate;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Cart.php:39:        use PointTrait;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:138:        #[ORM\Column(name: 'point', type: Types::DECIMAL, precision: 12, scale: 0, options: ['unsigned' => false, 'default' => 0])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:139:        private ?string $point = '0';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:219:            $this->PointHistories = new ArrayCollection();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:880:         * Set point
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:882:        public function setPoint(?string $point): Customer
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:884:            $this->point = $point;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:890:         * Get point
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:892:        public function getPoint(): ?string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:894:            return $this->point;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:1328:         * @var Collection<int, DtbPointHistory>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:1330:        #[ORM\OneToMany(targetEntity: DtbPointHistory::class, mappedBy: 'Customer')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:1332:        private Collection $PointHistories;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:1334:        public function addPointHistory(DtbPointHistory $PointHistory): Customer
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:1336:            $this->PointHistories[] = $PointHistory;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:1342:         * @return Collection<int, DtbPointHistory>
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:1344:        public function getPointHistories(): Collection
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:1346:            return $this->PointHistories;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:89:    #[ORM\Column(name: 'point', type: Types::INTEGER, options: ['default' => 0, 'comment' => 'ポイント残高'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:90:    private int $point = 0;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:95:    #[ORM\Column(name: 'point_contact_number', type: Types::STRING, length: 16, nullable: true, options: ['comment' => 'ポイント問い合わせ番号'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:96:    private ?string $pointContactNumber = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:98:    #[ORM\Column(name: 'point_transfer_flg', type: Types::BOOLEAN, options: ['default' => 0, 'comment' => 'ポイント移行完了フラグ'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:99:    private bool $pointTransferFlg = false;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:101:    #[ORM\Column(name: 'point_linked_failure_count', type: Types::SMALLINT, options: ['default' => 0, 'unsigned' => true, 'comment' => 'ポイント連携失敗回数'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:102:    private int $pointLinkedFailureCount = 0;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:313:    public function setPointContactNumber(?string $pointContactNumber): DtbPlayer
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:315:        $this->pointContactNumber = $pointContactNumber;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:320:    public function getPointContactNumber(): ?string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:322:        return $this->pointContactNumber;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:325:    public function setPointTransferFlg(bool $pointTransferFlg): DtbPlayer
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:327:        $this->pointTransferFlg = $pointTransferFlg;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:332:    public function getPointTransferFlg(): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:334:        return $this->pointTransferFlg;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:337:    public function setPointLinkedFailureCount(int $pointLinkedFailureCount): DtbPlayer
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:339:        $this->pointLinkedFailureCount = $pointLinkedFailureCount;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:344:    public function getPointLinkedFailureCount(): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:346:        return $this->pointLinkedFailureCount;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:490:    public function setPoint(int $point): DtbPlayer
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:492:        $this->point = $point;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:497:    public function getPoint(): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:499:        return $this->point;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:502:    public function addPoint(int $point): DtbPlayer
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:504:        $this->point = $this->point + $point;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCustomerGroup.php:70:    #[ORM\Column(name: 'point_percentage', type: Types::SMALLINT, options: ['unsigned' => true, 'comment' => 'ポイント付加パーセント'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCustomerGroup.php:71:    private int $point_percentage;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCustomerGroup.php:73:    public function getPointPercentage(): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCustomerGroup.php:75:        return $this->point_percentage;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCustomerGroup.php:78:    public function setPointPercentage(int $point_percentage): DtbCustomerGroup
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbCustomerGroup.php:80:        $this->point_percentage = $point_percentage;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_csv.csv:204:205,2,,Eccube\\Entity\\Customer,point,,Point,32,1,2017-03-07 10:14:00,2017-03-07 10:14:00
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/OrderItemType.php:67:         * ポイント.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/OrderItem.php:37:        use PointRateTrait;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/OrderItem.php:125:         * ポイント明細かどうか.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/OrderItem.php:127:         * @return bool ポイント明細の場合 true
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/OrderItem.php:130:        public function isPoint(): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/mtb_order_item_type.csv:7:6,Points,5
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbPointType.php:21:use Eccube\Repository\Master\MtbPointTypeRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbPointType.php:23:#[ORM\Table(name: 'mtb_point_type')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbPointType.php:25:#[ORM\Entity(repositoryClass: MtbPointTypeRepository::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbPointType.php:26:class MtbPointType extends AbstractEntity implements \Stringable
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbPointType.php:34:    #[ORM\Column(name: 'id', type: Types::INTEGER, options: ['unsigned' => true, 'comment' => 'ポイント属性ID'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbPointType.php:53:    public function setName(string $name): MtbPointType
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/doctrine/import_csv/en/dtb_base_info.csv:1:id,country_id,pref_id,company_name,company_kana,postal_code,addr01,addr02,phone_number,business_hour,email01,email02,email03,email04,shop_name,shop_kana,shop_name_eng,update_date,good_traded,message,delivery_free_amount,delivery_free_quantity,option_mypage_order_status_display,option_nostock_hidden,option_favorite_product,option_product_delivery_fee,option_product_tax_rule,option_customer_activate,option_remember_me,option_mail_notifier,authentication_key,option_point,basic_point_rate,point_conversion_rate
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Views/MallReferenceViaTenantView.php:88:    #[ORM\Column(name: 'option_point', type: Types::BOOLEAN, options: ['default' => true])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Views/MallReferenceViaTenantView.php:89:    private bool $option_point = true;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Views/MallReferenceViaTenantView.php:91:    #[ORM\Column(name: 'basic_point_rate', type: Types::DECIMAL, precision: 10, scale: 0, options: ['unsigned' => true, 'default' => 1], nullable: true)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Views/MallReferenceViaTenantView.php:92:    private ?string $basic_point_rate = '1';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Views/MallReferenceViaTenantView.php:94:    #[ORM\Column(name: 'point_conversion_rate', type: Types::DECIMAL, precision: 10, scale: 0, options: ['unsigned' => true, 'default' => 1], nullable: true)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Views/MallReferenceViaTenantView.php:95:    private ?string $point_conversion_rate = '1';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Views/MallReferenceViaTenantView.php:195:    public function isOptionPoint(): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Views/MallReferenceViaTenantView.php:197:        return $this->option_point;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Views/MallReferenceViaTenantView.php:200:    public function getBasicPointRate(): ?string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Views/MallReferenceViaTenantView.php:202:        return $this->basic_point_rate;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Views/MallReferenceViaTenantView.php:205:    public function getPointConversionRate(): ?string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Views/MallReferenceViaTenantView.php:207:        return $this->point_conversion_rate;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOption.php:85:    public const ADJUST_POINT_VARIANCE_MAIL_ADDRESS = 'adjust_point_variance_mail_addr';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbSmaregiPointPushLog.php:20:use Eccube\Repository\DtbSmaregiPointPushLogRepository;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbSmaregiPointPushLog.php:23: * EC-CUBE側でpoint/addを実行した際のスマレジ取引IDを記録し、その取引がwebhookで戻ってきた際に
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbSmaregiPointPushLog.php:24: * EC-CUBE側の会員ポイントへ二重反映しないための抑止レコード。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbSmaregiPointPushLog.php:26: * EC-CUBE発のポイント連携（付与/使用/失効/発生）はポイント更新API(point/add) を使うことで、スマレジ側に取引区分が
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbSmaregiPointPushLog.php:27: * ポイント加算/ポイント減算のポイント取引が発生する。その取引IDをここへ記録しておき、取引webhook受信時に該当すれば適用をスキップする。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbSmaregiPointPushLog.php:29:#[ORM\Table(name: 'dtb_smaregi_point_push_log')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbSmaregiPointPushLog.php:30:#[ORM\UniqueConstraint(name: 'dtb_smaregi_point_push_log_transaction_head_id_idx', columns: ['transaction_head_id'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbSmaregiPointPushLog.php:31:#[ORM\Entity(repositoryClass: DtbSmaregiPointPushLogRepository::class)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbSmaregiPointPushLog.php:32:class DtbSmaregiPointPushLog extends AbstractEntity
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:797:	 (43771,4941,1,1,175,130,1,NULL,'それは北を指してはいない。故郷を指しているんだ。','It doesn''t point north. It points home.','星のコンパスはタップ状態で戦場に出る。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:925:	 (43815,688,1,1,173,67,1,NULL,'','Closely linked to the Church of Dusk, the paladins of the Bloodstained order are devout to the point of fanaticism.','血潮隊の聖騎士が戦場に出たとき、絆魂を持つ白の1/1の吸血鬼(Vampire)クリーチャー・トークンを１体生成する。','When Paladin of the Bloodstained enters the battlefield, create a 1/1 white Vampire creature token with lifelink.','3','2','25',1,false,0,'2019-03-12 03:00:46+09','2025-07-31 20:32:09+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:1223:	 (43970,845,1,1,173,52,1,NULL,'','"Do not mistake your lofty vantage point for safety."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:2242:	 (44348,243,1,3,167,38,1,NULL,'','To consult a sphinx is a test in patience. Perhaps that''s the point.','飛行
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:2450:	 (44429,324,1,1,167,62,1,NULL,'','My stride will break only against the twin points of Hazoret''s spear.','燃えさし角のミノタウルスが攻撃するに際し、あなたはこれを督励してもよい。そうしたとき、ターン終了時まで、これは+1/+1の修整を受けるとともに威迫を得る。（督励されたクリーチャーは、あなたの次のアンタップ・ステップにアンタップしない。）','You may exert Emberhorn Minotaur as it attacks. When you do, it gets +1/+1 and gains menace until end of turn. (An exerted creature won''t untap during your next untap step.)','4','3','130',1,false,0,'2019-03-12 03:14:05+09','2025-07-31 20:25:37+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:3444:	 (44806,17606,1,2,164,68,1,NULL,'見るものの視点により、その印章が示すものは、自然の巡りを護る名誉ある守護者にも、永遠の生命のために魂を闇に売り渡した者にもなる。','Depending on your point of view, the seal represents a proud guardian of the natural cycle or one who has sold her soul to darkness for eternal life.','{1}, {Tap}：{Black}{Green}を加える。','{1}, {Tap}: Add {Black}{Green}.','','','220',1,false,0,'2019-03-12 03:18:35+09','2025-07-31 21:37:47+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:4080:	 (45053,958,1,1,159,4,1,NULL,'','The sky isn''t the limit. It''s the starting point.','飛行
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:4496:	 (45231,1133,1,1,159,84,1,NULL,'','All skyships entering or leaving the fairgrounds must pass through the security checkpoint.','防衛
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:5123:	 (46787,4661,1,2,157,84,1,NULL,'','Torching Krosa would be pointless. It grows faster than it burns.','あなたのライブラリーから基本土地・カード最大２枚を探し、タップ状態で戦場に出す。その後、ライブラリーを切り直す。','Search your library for up to two basic land cards, put them onto the battlefield tapped, then shuffle.','','','180',1,false,0,'2019-03-12 17:32:57+09','2025-07-31 20:51:05+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:5340:	 (46871,4998,1,3,155,19,1,NULL,'','Let the points of our lances lead the way.','先制攻撃
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:5857:When Glimmerpoint Stag enters the battlefield, exile another target permanent. Return that card to the battlefield under its owner''s control at the beginning of the next end step.','3','3','12',1,false,0,'2019-03-12 20:42:07+09','2025-07-31 21:21:24+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:6783:	 (47418,18084,1,1,152,239,1,NULL,'','"To die failing to save a loved one is just so sad—or, more to the point, pathetic."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:7093:	 (47539,18231,1,3,152,84,1,NULL,'','"This is it! All the cryptoliths point here!"
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:7790:	 (47794,13758,1,1,150,82,1,NULL,'','"It''s endearing, in a mystical, pointy sort of way."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:8141:	 (47929,2564,1,2,147,94,1,NULL,'','It''s hard to find their weak points, but I very much enjoy the discovery process.','(４)(黒)：クリーチャー１体を対象とする。ターン終了時まで、それは-1/-1の修整を受ける。','{4}{Black}: Target creature gets -1/-1 until end of turn.','2','2','113',1,false,0,'2019-03-12 22:43:45+09','2025-07-31 20:39:15+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:8225:	 (47963,2598,1,1,147,8,1,NULL,'','Goblins were first to see the potential of hedrons in the fight against the Eldrazi, for the magical stones came ready-made with pointy bits.','(２)(赤)：ターン終了時まで、溶岩足の略奪者は+2/+0の修整を受ける。','{2}{Red}: Lavastep Raider gets +2/+0 until end of turn.','1','2','147',1,false,0,'2019-03-12 22:43:46+09','2025-07-31 20:39:21+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:8668:	 (48168,9515,1,1,143,46,1,NULL,'','It''s pointless to hold on when you have nothing to hold on with.','土地でないパーマネント１つを対象とし、それをオーナーの手札に戻す。','Return target nonland permanent to its owner''s hand.','0','0','54',1,false,0,'2019-03-12 22:45:42+09','2025-07-31 21:19:14+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:9479:	 (48525,13075,1,1,142,178,1,NULL,'「ここでは、これが真に迫った聖句というものだ。」――― ウラブラスクの執行人.','"Down here, we have a more pointed version of the scriptures."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:9651:	 (48598,20096,1,2,142,270,1,NULL,'手が崩れ去り、尖った先のみが奇妙にも残されたと知ったとき、彼は自身の目的は戦争しかないと決めた。','After his hands had crumbled away, leaving only wickedly sharp points, he decided his only purpose was war.','アッシェンムーアの抉り出しではブロックできない。','Ashenmoor Gouger can''t block.','4','4','190',1,false,0,'2019-03-13 03:14:48+09','2025-07-31 21:44:34+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:10735:	 (48984,5635,1,2,138,73,1,NULL,'','Every time he returns from battle unscathed, he feels a tinge of disappointment.','あなたが赤か白のパーマネントをコントロールしているかぎり、戦いの喧嘩屋は+1/+0の修整を受けるとともに先制攻撃を持つ。','As long as you control a red or white permanent, Battle Brawler gets +1/+0 and has first strike.','2','2','63',1,false,0,'2019-03-14 18:58:28+09','2025-07-31 21:05:31+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:11113:	 (49383,7972,1,2,131,144,1,NULL,'','Lammasu are the enigmatic travelers of Tarkir, soaring high above all lands in all seasons. None know their true purpose, but they often arrive on the eve of great conflicts or turning points in history.','飛行','Flying','5','4','28',1,false,0,'2019-03-14 19:02:23+09','2025-07-31 21:14:03+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:11364:	 (49470,8055,1,2,131,225,1,NULL,'','"Make sure he''s pointed in the right direction before you light him. And don''t let the goblins anywhere near the torch."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:12499:When Glimmerpoint Stag enters the battlefield, exile another target permanent. Return that card to the battlefield under its owner''s control at the beginning of the next end step.','3','3','70',1,false,0,'2019-03-14 19:03:51+09','2025-07-31 21:21:24+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:13250:	 (50280,2707,1,1,122,83,1,NULL,'','The demon had flown past the reach of Erebos''s whip but not the point of the sun god''s spear.','タップ状態のクリーチャー１体を対象とし、それを追放する。','Exile target tapped creature.','','','10',1,false,0,'2019-03-14 19:04:50+09','2025-07-31 20:39:43+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:13702:	 (50696,17189,1,1,120,226,1,NULL,'彼女はエイスリオスを待つ死者たちに鋭い質問をし、生から離れる者たちから人生について学んでいた。','She asks pointed questions of the dead who wait for Athreos, learning of life from those who are about to leave it.','(２)(黒)：各対戦相手はそれぞれ１点のライフを失う。あなたはこれにより失われたライフに等しい点数のライフを得る。','{2}{Black}: Each opponent loses 1 life. You gain life equal to the life lost this way.','1','4','28',1,false,0,'2019-03-14 19:08:29+09','2025-07-31 21:35:50+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:13712:	 (50701,17194,1,3,120,93,1,NULL,'伝説では太陽の槍という強力な武器があり、テーロスのいかなる場所をも攻撃することができるという。死の国の最深淵とて例外ではない。','Legend speaks of the Sun Spear, the mighty weapon that can strike any point in Theros, even the depths of the Underworld.','あなたがコントロールするクリーチャーは+1/+1の修整を受ける。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:13810:	 (50737,17223,1,2,120,54,1,NULL,'「タッサ様は私に力と見識を与えてくださった。そのことを後悔させないように気を付けている。」','Thassa has blessed me with power and insight. I am careful not to disappoint her.','英雄的 ― あなたがトリトンの財宝狩りを対象とする呪文を１つ唱えるたび、カードを１枚引く。','Heroic — Whenever you cast a spell that targets Triton Fortune Hunter, draw a card.','2','2','69',1,false,0,'2019-03-14 19:08:31+09','2025-07-31 21:36:17+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:13941:	 (50795,811,1,1,120,31,1,NULL,'','"The hand of Keranos can be seen in every rumbling storm cloud. Best not to stand where he points."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:14848:	 (51222,6223,1,3,116,233,1,NULL,'','Those who expect betrayal at every turn are seldom disappointed.','','','','','56',1,false,0,'2019-03-14 19:09:39+09','2025-07-31 21:08:40+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:15930:	 (51596,6405,1,3,113,36,1,NULL,'ラヴニカの土地の中で、誰かの気まぐれによって変質させられたことがまったくない土地など一片たりとも存在しない。','There is not a single inch of Ravnica that hasn''t been altered at one point or another to fit someone''s whims.','領域大工が戦場に出るに際し、基本土地タイプを１つ選ぶ。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:16016:	 (51629,6438,1,1,113,263,1,NULL,'「精神病と言えるほどに無慈悲だ。こいつに仕事をやろう。」 ――― オルゾフの徴募兵、ゼリーナス','"Merciless to the point of psychosis. Let''s give him a job."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:16573:	 (51868,14580,1,1,111,23,1,NULL,'貴様の死刑囚監房での定位置は、奴が教えてくれるだろう。','He''ll point you to your death row seats.','解鎖（あなたはこのクリーチャーを、+1/+1カウンターが１個置かれた状態で戦場に出してもよい。これの上に+1/+1カウンターが置かれているかぎり、これではブロックできない。）
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:16703:	 (51926,14632,1,2,111,83,1,NULL,'怒り狂った市民は、自分達の居住地にそれを解き放ったとしてシミックを非難した。シミック側はネズミの害がなくなったことを指摘した。','The furious citizens blamed the Simic for releasing it in their district. The Simic pointed out that rats were no longer a problem.','(緑),他のクリーチャーを１体生け贄に捧げる：貪り食う軟泥の上に+1/+1カウンターを１個置く。','{Green}, Sacrifice another creature: Put a +1/+1 counter on Gobbling Ooze.','3','3','126',1,false,0,'2019-03-14 19:11:38+09','2025-07-31 21:32:24+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:18944:	 (52886,7251,1,2,102,4,1,NULL,'「面白くないというなら、永遠に生きる意義は何だ？」','"If you''re not having fun, what''s the point of living forever?"','あなたがコントロールしている吸血鬼１体がプレイヤー１人に戦闘ダメージを与えるたび、それの上に＋１/＋１カウンター１個を置く。','Whenever a Vampire you control deals combat damage to a player, put a +1/+1 counter on it.','2','2','158',1,false,0,'2019-03-14 19:30:45+09','2025-07-31 21:12:03+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:20021:	 (53358,13075,1,2,97,178,1,NULL,'「ここでは、これが真に迫った聖句というものだ。」――― ウラブラスクの執行人.','"Down here, we have a more pointed version of the scriptures."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:20603:When Glimmerpoint Stag enters the battlefield, exile another target permanent. Return that card to the battlefield under its owner''s control at the beginning of the next end step.','3','3','9',1,false,0,'2019-03-14 19:33:10+09','2025-07-31 21:21:24+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:21780:	 (54122,4743,1,1,87,270,1,NULL,'「結ぶべき契約も、誓うべき誓約もない。 入隊手続きは、剣を抜いて、敵に向けることだ。」','There''s no contract to sign, no oath to swear. The enlistment procedure is to unsheathe your sword and point it at the enemy.','0','0','2','2','22',1,false,0,'2019-03-14 19:34:29+09','2025-07-31 21:02:55+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:22913:	 (54540,10447,1,2,82,245,1,NULL,'探検家にとっては、「先頭の人物」とは「ゴーマゾアの餌」の丁寧な言い方である。','To explorers, point man is a polite way of saying gomazoa fodder.','防衛、飛行
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:22995:	 (54567,10471,1,1,82,228,1,NULL,'「罠探しは、いつか身体の一部を失ってしまうものなのよ。 問題は、それがどれぐらいか――それと、そこが元に戻るかどうかなの。」――― カザンドゥの罠探し、アルハーナ.','"At some point, every trapfinder will lose a hunk of flesh. It''s just a question of how much—and whether it''ll grow back."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:23563:	 (54837,4801,1,2,79,454,1,NULL,'「テレパシーを学んで何が一番がっかりしたかって、人々がどれだけつまらないことを考えてるのかわかっちゃったことだね。」――― テフェリー、第四級生徒時代.','"The most disappointing thing about learning telepathy is finding out how boring people really are."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:23839:	 (54980,9121,1,3,79,197,1,NULL,'恐れる者は血の祭りの前に処置を求める。罪人は祭りの後で処置を求める。','It disables with pinpoint accuracy.','真髄の針が戦場に出るに際し、カードの名前１つを選ぶ。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:25746:','Enlightenment is the mundane seen from the vantage point of the divine.','エンチャント（クリーチャー）
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:26222:','Don''t stand in his way, for his way is full of pointy things and fire.','プレイヤー１人が赤の呪文を唱えるたび、クリーチャー１体を対象とする。あなたは(１)を支払ってもよい。そうした場合、そのクリーチャーではこのターン、ブロックできない。','Whenever a player casts a red spell, you may pay {1}. If you do, target creature can''t block this turn.','1','1','96',1,false,0,'2019-03-14 19:41:22+09','2025-07-31 21:44:20+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:26267:','Though the shaman rarely got what she wanted, she was never disappointed in the result.','エンチャントでないパーマネント３つを対象とする。それらのうち無作為に選んだ１つを破壊する。','Choose three target nonenchantment permanents. Destroy one of them at random.','','','108',1,false,0,'2019-03-14 19:41:22+09','2025-07-31 21:44:22+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:26342:','The last survivor of her patrol, the warrior returned expecting disappointment and scorn. Instead she found gratitude. You are alive. That is reason to celebrate.','あなたは、あなたがコントロールするタップ状態のアーティファクト、クリーチャー、土地１つにつき１点のライフを得る。','You gain 1 life for each tapped artifact, creature, and land you control.','','','130',1,false,0,'2019-03-14 19:41:23+09','2025-07-31 21:44:25+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:26431:','The kithkin mind-bond is even tighter in Shadowmoor, reinforcing the unity of their community to the point of xenophobia.','あなたの対戦相手がコントロールするすべてのクリーチャーをタップし、あなたがコントロールするすべてのクリーチャーをアンタップする。','Tap all creatures your opponents control and untap all creatures you control.','','','154',1,false,0,'2019-03-14 19:41:25+09','2025-07-31 21:44:30+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:26522:	 (55911,20096,1,2,71,270,1,NULL,'手が崩れ去り、尖った先のみが奇妙にも残されたと知ったとき、彼は自身の目的は戦争しかないと決めた。','After his hands had crumbled away, leaving only wickedly sharp points, he decided his only purpose was war.','アッシェンムーアの抉り出しではブロックできない。','Ashenmoor Gouger can''t block.','4','4','180',1,false,0,'2019-03-14 19:41:26+09','2025-07-31 21:44:34+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:26934:	 (56037,12639,1,2,70,227,1,NULL,'隘路へ導くのは戦略だが、献身的な仲間意識はいつだって彼女の戦術だ。','The choke point was the plan, but devoted camaraderie was always her strategy.','(白),(Ｔ)：兵士(Soldier)クリーチャー１体を対象とし、その上に+1/+1カウンターを１個置く。 あなたがコントロールする、+1/+1カウンターが置かれている各クリーチャーは、各戦闘で追加で１体のクリーチャーをブロックできる。','{White}, {Tap}: Put a +1/+1 counter on target Soldier creature. Each creature you control with a +1/+1 counter on it can block an additional creature each combat.','1','1','5',1,false,0,'2019-03-14 19:41:50+09','2025-07-31 21:27:23+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:27864:	 (56338,8878,1,1,68,126,1,NULL,'「婆は妖精に、ボガートが飛べるならどれだけの悪ふざけができるか語ったんだ。そしてそこに、新たな美しい友情が生まれたのさ。」――― 芋虫婆のお話.','"Auntie pointed out to the faerie how much mischief a flying boggart could wreak, and a beautiful new friendship was born."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:27907:	 (56350,8890,1,2,68,227,1,NULL,'炎族の戦士は干渉の方法を学ぶ。炎の混沌を操り、ピンポイントの正確さで集中する古代の手法だ。','Some flamekin warriors explore the art of coherence, an ancient discipline that harnesses the chaos of fire and focuses it with pinpoint precision.','(３)(赤)：クリーチャー１体かプレイヤー１人を対象とする。炎族の火吐きはそれに１点のダメージを与える。','{3}{Red}: Flamekin Spitfire deals 1 damage to any target.','1','1','168',1,false,0,'2019-03-14 19:42:41+09','2025-07-31 21:16:25+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:28295:	 (56516,10993,1,2,67,328,1,NULL,'王自身に指名された裁きの面々は、すべての論議が究極の公平さの下に行われていることを保障している。','Appointed by the kha himself, members of the tribunal ensure all disputes are settled with the utmost fairness.','各プレイヤーは、毎ターン１つしか呪文を唱えられない。','Each player can''t cast more than one spell each turn.','','','37',1,false,0,'2019-03-14 19:43:49+09','2025-07-31 21:23:56+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:28722:	 (56758,11150,1,2,67,403,1,NULL,'すべての傷に物語があり、すべての欠けにその名がある。 この剣は四世代に渡って用いられた。 落胆することなどありはしない。――― 空騎士リーナの伝授.','"Every scratch tells a story, and every notch has a name. Four generations have held this blade. You shall not disappoint them."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:29047:	 (57213,6223,1,3,66,233,1,NULL,'常に裏切りを予測する者が落胆することはまず無い。','Those who expect betrayal at every turn are seldom disappointed.','','','','','42',1,false,0,'2019-03-14 20:32:59+09','2025-07-31 21:08:40+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:30003:	 (57534,19501,1,1,63,191,1,NULL,'時の裂け目の焦点となったフォライアスは、新たな敵と古い敵の両方と同時に戦っている。','A focal point for time rifts, Foriys contends simultaneously with foes both new and old.','瞬速（あなたはこの呪文を、あなたがインスタントを唱えられるときならいつでも唱えてよい。）
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:31121:	 (57923,12151,1,3,64,809,1,NULL,'ギックス教団がコイロスの洞窟を掘り起こしたとき、彼らは切り取られた主人の片手を見つけた。彼らはそれを聖堂に祭り、いつの日かその手がファイレクシアへの道を示してくれることを願った。','When the Brotherhood of Gix dug out the cave of Koilos they found their master''s severed hand. They enshrined it, hoping that one day it would point the way to Phyrexia.','(１),パーマネントを１つ生け贄に捧げる：あなたは１点のライフを得る。','{1}, Sacrifice a permanent: You gain 1 life.','','','107',1,false,0,'2019-03-14 21:13:00+09','2025-07-31 21:26:19+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:31676:	 (58110,4166,1,1,60,227,1,NULL,'生きていたときと同様、彼らは死してからも大判事を逆の意見から守っている。','In death, as in life, they protect the Grand Arbiter from exposure to contrary points of view.','防衛（このクリーチャーは攻撃できない。）
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:32313:	 (58314,6641,1,2,59,178,1,NULL,'公平だと？何をどう考えたら、この交渉の目的が公平に事を済ませることなどと思えるのだ？','"Fair? At what point in our negotiations did you convince yourself my goal was to be fair?"','ヴィダルケンの策謀者が戦場に出たとき、あなたがコントロールする土地１つと対戦相手１人がコントロールする土地１つを対象とし、それらのコントロールを交換する。','When Vedalken Plotter enters the battlefield, exchange control of target land you control and target land an opponent controls.','1','1','41',1,false,0,'2019-03-14 21:15:28+09','2025-07-31 21:10:44+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:32715:	 (58457,17387,1,1,58,293,1,NULL,'ディートリ、お前に歯向かう奴がいないおかげで、ここを離れられるよ。――― 夜番の見回り、キトフ.','"Ditri, I leave this checkpoint in your capable teeth."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:33234:	 (58700,17606,1,1,58,286,1,NULL,'見るものの視点により、その印章が示すものは、自然の巡りを護る名誉ある守護者にも、永遠の生命のために魂を闇に売り渡した者にもなる。','Depending on your point of view, the seal represents a proud guardian of the natural cycle or one who has sold her soul to darkness for eternal life.','{1}, {Tap}：{Black}{Green}を加える。','{1}, {Tap}: Add {Black}{Green}.','','','262',1,false,0,'2019-03-14 21:16:19+09','2025-07-31 21:37:47+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:33235:	 (58687,17593,1,1,58,256,1,NULL,'地底街では、剣の切っ先ですべてを忘れることがしばしば奨励されている。','In the undercity, forgetfulness is often encouraged at the point of a blade.','（(青/黒)は(青)でも(黒)でも支払うことができる。）
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:34988:Are you aware that any time you say something that isn''t a question, when a player points out this fact first, they gain control of Question Elemental?','3','4','43',1,false,0,'2019-03-14 21:21:38+09','2025-07-31 21:47:12+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:35306:Each other Samurai creature you control gets +1/+1 for each point of bushido it has.','3','3','46',1,false,0,'2019-03-14 21:21:55+09','2025-07-31 20:40:10+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:36802:	 (60227,10993,1,3,50,328,1,NULL,'王自身に指名された裁きの面々は、すべての論議が究極の公平さの下に行われていることを保障している。','Appointed by the kha himself, members of the tribunal ensure all disputes are settled with the utmost fairness.','各プレイヤーは、毎ターン１つしか呪文を唱えられない。','Each player can''t cast more than one spell each turn.','','','19',1,false,0,'2019-03-14 21:23:34+09','2025-07-31 21:23:56+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:38025:	 (60836,4941,1,2,49,130,1,NULL,'それは北を指してはいない。故郷を指しているんだ。','It doesn''t point north. It points home.','星のコンパスはタップ状態で戦場に出る。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:38032:	 (60841,2003,1,2,49,44,1,NULL,'棒は友人だ。先の尖った棒は親友だ。先の尖った棒の軍団は大親友だ。――― オネイアンの軍曹.','"A stick is your friend. A pointed stick is your good friend. An army of pointed sticks is your best friend."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:38471:	 (61021,8443,1,2,47,89,1,NULL,'俺のいるこの高みからなら、希望の行方もわかろうというものさ。','It''s easy to lose sight of hope until you gaze out from my vantage point.','雲に届く騎兵部隊は、あなたが鳥(Bird)をコントロールしているかぎり、+2/+2の修整を受けるとともに飛行を持つ。','As long as you control a Bird, Cloudreach Cavalry gets +2/+2 and has flying.','1','1','7',1,false,0,'2019-03-14 21:26:52+09','2025-07-31 21:15:03+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:39090:	 (61275,13871,1,3,46,248,1,NULL,'その時点で、魔術師の議論は非常に険悪なものとなっていった。','At that point, the wizards'' argument got a lot uglier.','壁(Wall)以外のクリーチャー・タイプを１つ選ぶ。各クリーチャーはターン終了時までそのタイプになる。','Choose a creature type other than Wall. Each creature becomes that type until end of turn.','','','116',1,false,0,'2019-03-14 21:31:15+09','2025-07-31 21:31:11+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:39345:—Toggo, goblin weaponsmith','クリーチャー１体を対象とする。狙いすましたなだれはそれに４点のダメージを与える。このダメージは軽減できない。','Pinpoint Avalanche deals 4 damage to target creature. The damage can''t be prevented.','','','221',1,false,0,'2019-03-14 21:31:20+09','2025-07-31 21:31:25+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:39433:	 (61422,4661,1,2,46,84,1,NULL,'','Torching Krosa would be pointless. It grows faster than it burns.','あなたのライブラリーから基本土地・カード最大２枚を探し、タップ状態で戦場に出す。その後、ライブラリーを切り直す。','Search your library for up to two basic land cards, put them onto the battlefield tapped, then shuffle.','','','263',1,false,0,'2019-03-14 21:31:22+09','2025-07-31 20:51:06+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:39803:	 (61590,7884,1,3,45,454,1,NULL,'もうたくさんだ！','Enough','どのプレイヤーも「限界点は自分に６点のダメージを与える」ことを選んでよい。誰もそうしなかった場合、すべてのクリーチャーを破壊する。これにより破壊されたクリーチャーは再生できない。','Any player may have Breaking Point deal 6 damage to them. If no one does, destroy all creatures. Creatures destroyed this way can''t be regenerated.','','','81',1,false,0,'2019-03-14 21:31:59+09','2025-07-31 21:13:48+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:40272:	 (61759,19236,1,1,44,248,1,NULL,'あいつはばっちりと要点をつくんだよ。','He gets to the point right away.','カードを１枚無作為に選んで捨てる：パーディック山の長槍使いは、ターン終了時まで+1/+0の修整を受けるとともに先制攻撃を得る。','Discard a card at random: Pardic Lancer gets +1/+0 and gains first strike until end of turn.','3','2','107',1,false,0,'2019-03-14 21:33:22+09','2025-07-31 21:42:06+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:41185:	 (62163,2025,1,1,41,198,1,NULL,'軍旗は軍隊にとって活力の源であったが、敵にとっては標的であった。','The standard was a rallying point for the army and a target for the enemy.','いずれかの呪文を唱えたり能力を起動する際の対象を選ぶ間に、あなたの対戦相手は可能ならば少なくとも１体の戦場に出ている旗手(Flagbearer)を選ばなければならない。','While choosing targets as part of casting a spell or activating an ability, your opponents must choose at least one Flagbearer on the battlefield if able.','1','1','18',1,false,0,'2019-03-14 21:34:30+09','2025-07-31 20:37:50+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:41795:「雌鹿と豹」.','I want every last one of these tree-hugging, earth-loving, pointy-eared weaklings out of here. Now','色を１色選ぶ。プレイヤー１人を対象とする。そのプレイヤーは自分の手札を公開し、選ばれた色のすべてのカードを捨てる。','Choose a color. Target player reveals their hand and discards all cards of that color.','','','154',1,false,0,'2019-03-14 21:35:05+09','2025-07-31 21:03:21+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:42078:	 (62616,2003,1,2,40,44,1,NULL,'棒は友人だ。先の尖った棒は親友だ。先の尖った棒の軍団は大親友だ。――― オネイアンの軍曹.','"A stick is your friend. A pointed stick is your good friend. An army of pointed sticks is your best friend."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:42459:	 (62780,4941,1,2,39,130,1,NULL,'それは北を指してはいない。故郷を指しているんだ。','It doesn''t point north. It points home.','星のコンパスはタップ状態で戦場に出る。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:43475:	 (63537,15926,1,2,36,366,1,NULL,'「呪文はもうちょっと待たなくちゃね」とアレクシーは上を指さしながら言った。「ドレイクがいるわ」','The spell will have to wait, said Alexi, pointing up. Drakes.','飛行
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:44033:	 (63791,4738,1,1,32,271,1,NULL,'あいつは射程の半ばほどにいる沼バエを真っ二つにできるんだ。――― オネイアンの軍曹.','The crossbow is the ideal weapon for the lazy Mercadians: just point and shoot.','(Ｔ)：攻撃しているクリーチャーかブロックしているクリーチャー１体を対象とする。弩弓歩兵はそれに１点のダメージを与える。','{Tap}: Crossbow Infantry deals 1 damage to target attacking or blocking creature.','1','1','16',1,false,0,'2019-03-14 21:41:44+09','2025-07-31 21:02:53+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:44102:	 (63834,10176,1,1,32,362,1,NULL,'市場のお祭りは、ここを訪れたジャフィーにとっての最高の時となった。','The market festival turned out to be the high point of Jaffy''s visit.','(青),(Ｔ),カードを１枚捨てる：クリーチャー１体を対象とする。それはターン終了時まで飛行を得る。','{Blue}, {Tap}, Discard a card: Target creature gains flying until end of turn.','2','2','59',1,false,0,'2019-03-14 21:41:46+09','2025-07-31 21:21:54+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:46880:	 (64912,243,1,3,167,38,2,NULL,'','To consult a sphinx is a test in patience. Perhaps that''s the point.','飛行
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:47508:	 (65105,20370,1,2,203,136,1,NULL,'','I grant you blades—on the condition that they are not pointed at me.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:47798:	 (65214,17606,1,1,203,286,1,NULL,'見るものの視点により、その印章が示すものは、自然の巡りを護る名誉ある守護者にも、永遠の生命のために魂を闇に売り渡した者にもなる。','Depending on your point of view, the seal represents a proud guardian of the natural cycle or one who has sold her soul to darkness for eternal life.','{1}, {Tap}：{Black}{Green}を加える。','{1}, {Tap}: Add {Black}{Green}.','','','191',0,false,0,'2019-03-15 21:46:06+09','2025-07-31 21:37:47+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:47799:	 (65215,17606,1,1,203,68,1,NULL,'見るものの視点により、その印章が示すものは、自然の巡りを護る名誉ある守護者にも、永遠の生命のために魂を闇に売り渡した者にもなる。','Depending on your point of view, the seal represents a proud guardian of the natural cycle or one who has sold her soul to darkness for eternal life.','{1}, {Tap}：{Black}{Green}を加える。','{1}, {Tap}: Add {Black}{Green}.','','','192',0,false,0,'2019-03-15 21:46:06+09','2025-07-31 21:37:47+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:48361:	 (65419,4998,1,3,155,19,2,NULL,'','Let the points of our lances lead the way.','先制攻撃
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:48769:	 (65549,18231,1,3,152,84,2,NULL,'','"This is it! All the cryptoliths point here!"
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:52298:――ラル・ザレック','"Time to find the melting point of lazotep."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:53321:――ラル・ザレック','"Time to find the melting point of lazotep."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:58472:Enchanted player has teaching and is a Magic Guru. You and enchanted player each add five Guru points to your Guru pool. (Gurus teach the Magic game and get free booster packs and unique basic land cards).','','','1368',0,true,0,'2019-06-24 22:38:23+09','2022-09-22 23:10:44+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:65770:――ジェイス・ベレレン','"This is it! All the cryptoliths point here!"
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:66516:	 (76608,25325,1,2,219,42,1,NULL,'「言葉に意味はない。大事なのはその槌で何をするかだ。」','"Words are pointless. It''s what you do with your hammer that counts."','ヘンジの槌、ファレン卿が攻撃するたび、他の攻撃クリーチャー１体を対象とする。ターン終了時まで、それは＋Ｘ/＋Ｘの修整を受ける。Ｘはヘンジの槌、ファレン卿のパワーに等しい。','','2','2','177',0,false,0,'2019-09-23 06:25:25+09','2025-07-31 21:53:15+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:67681:	 (76999,25325,1,2,219,42,1,NULL,'「言葉に意味はない。大事なのはその槌で何をするかだ。」','"Words are pointless. It''s what you do with your hammer that counts."','ヘンジの槌、ファレン卿が攻撃するたび、他の攻撃クリーチャー１体を対象とする。ターン終了時まで、それは＋Ｘ/＋Ｘの修整を受ける。Ｘはヘンジの槌、ファレン卿のパワーに等しい。','','2','2','177',1,false,0,'2019-09-23 23:59:55+09','2025-07-31 21:53:15+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:69281:	 (77673,25490,1,3,221,53,1,NULL,'死は、称賛に値する信念を無意味な執着に変えた。','Death turned admirable conviction into pointless intransigence.','先制攻撃
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:73558:	 (79641,2707,1,1,280,83,1,NULL,'','The demon had flown past the reach of Erebos''s whip but not the point of the sun god''s spear.','タップ状態のクリーチャー１体を対象とし、それを追放する。','Exile target tapped creature.','','','132',0,false,0,'2020-03-14 03:26:39+09','2025-07-31 20:39:43+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:73773:	 (79736,688,1,1,280,67,1,NULL,'','Closely linked to the Church of Dusk, the paladins of the Bloodstained order are devout to the point of fanaticism.','血潮隊の聖騎士が戦場に出たとき、絆魂を持つ白の1/1の吸血鬼(Vampire)クリーチャー・トークンを１体生成する。','When Paladin of the Bloodstained enters the battlefield, create a 1/1 white Vampire creature token with lifelink.','3','2','250',0,false,0,'2020-03-14 03:26:43+09','2025-07-31 20:32:09+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:73934:	 (79801,4998,1,3,280,19,1,NULL,'','Let the points of our lances lead the way.','先制攻撃
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:75703:	 (80511,13075,1,1,280,178,1,NULL,'「ここでは、これが真に迫った聖句というものだ。」――― ウラブラスクの執行人.','"Down here, we have a more pointed version of the scriptures."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:76184:	 (80717,845,1,1,280,148,1,NULL,'','"Do not mistake your lofty vantage point for safety."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:76249:	 (80745,4661,1,2,280,84,1,NULL,'','Torching Krosa would be pointless. It grows faster than it burns.','あなたのライブラリーから基本土地・カード最大２枚を探し、タップ状態で戦場に出す。その後、ライブラリーを切り直す。','Search your library for up to two basic land cards, put them onto the battlefield tapped, then shuffle.','','','1594',0,false,0,'2020-03-14 03:27:30+09','2025-07-31 20:51:06+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:78990:	 (81880,26354,1,1,227,128,1,NULL,'クードロ将軍は、ルーカが突然裏切ったと見たあの日以来、ドラニスの入り口すべてに厳戒体制を敷くようになった。','After what he viewed as Lukka''s shocking betrayal, General Kudro enacted stringent security measures at every entry point into Drannith.','{1}{White}, {Tap}：クリーチャー１体を対象とし、それをタップする。','{1}{White}, {Tap}: Tap target creature.','1','2','5',0,false,0,'2020-04-12 05:33:22+09','2025-07-31 21:54:37+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:80275:	 (82267,26354,1,1,227,128,1,NULL,'クードロ将軍は、ルーカが突然裏切ったと見たあの日以来、ドラニスの入り口すべてに厳戒体制を敷くようになった。','After what he viewed as Lukka''s shocking betrayal, General Kudro enacted stringent security measures at every entry point into Drannith.','{1}{White}, {Tap}：クリーチャー１体を対象とし、それをタップする。','{1}{White}, {Tap}: Tap target creature.','1','2','5',1,false,0,'2020-04-13 05:32:25+09','2025-07-31 21:54:37+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:86267:	 (85049,6438,1,1,238,263,1,NULL,'','"Merciless to the point of psychosis. Let''s give him a job."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:86330:	 (85085,564,1,1,238,147,1,NULL,'','"The Brazen Coalition is a firecannon pointed at our enemies. Goblins like him are the spark to its powder."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:86474:	 (85156,845,1,1,238,52,1,NULL,'','"Do not mistake your lofty vantage point for safety."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:89665:――海門の冒険者、アーロ','"We just pay him and point him at problems."
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:89732:	 (86765,27080,1,3,242,66,1,NULL,'ゴブリン騎兵の戦術は、獣に向きを示すことと、できるかぎり長くしがみついていることからなる。','Goblin cavalry tactics consist of pointing a beast in a direction and hanging on for as long as possible.','トランプル、速攻
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:89875:	 (86803,27116,1,1,242,1108,1,NULL,'「長いことこの土地は苦痛に叫んでいた。流れがバランスを取り戻した今は、木々の間に新たな調和がこだましている。」','"For so long, this land cried out in pain. Now, as the flow returns to its balance point, a new harmony echoes in the trees."','変わり樹の苦行者が戦場に出たとき、あなたは３点のライフを得る。','When Turntimber Ascetic enters the battlefield, you gain 3 life.','5','4','214',0,false,0,'2020-09-13 03:53:42+09','2025-07-31 21:57:09+09'),
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/mtb_card_detail_2.sql:90171:	 (86874,27172,1,4,245,988,1,NULL,'Once the felidar has marked you as prey, there''s no point in running.','Once the felidar has marked you as prey, there''s no point in running.','Vigilance

codex
候補JSONは11件あり、設計HTML側の引用行は実在しています。次にコントローラ、フォーム、エンティティ、Twigの該当行を絞って確認し、候補の根拠と見落としを切り分けます。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php | sed -n '1,180p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Controller\Admin\Customer;
    17	
    18	use Eccube\Controller\AbstractController;
    19	use Eccube\Entity\Customer;
    20	use Eccube\Entity\DtbPointHistory;
    21	use Eccube\Entity\Master\MtbPointType;
    22	use Eccube\Form\Type\Admin\CustomerPointType;
    23	use Eccube\Repository\Master\MtbPointTypeRepository;
    24	use Eccube\Service\Smaregi\SmaregiCustomerPointEventService;
    25	use Symfony\Bridge\Twig\Attribute\Template;
    26	use Symfony\Component\HttpFoundation\RedirectResponse;
    27	use Symfony\Component\HttpFoundation\Request;
    28	use Symfony\Component\Routing\Attribute\Route;
    29	
    30	class CustomerPointController extends AbstractController
    31	{
    32	    public function __construct(
    33	        private readonly MtbPointTypeRepository $pointTypeRepository,
    34	        private readonly SmaregiCustomerPointEventService $smaregiCustomerPointEventService,
    35	    ) {
    36	    }
    37	
    38	    /**
    39	     * @return array<string, mixed>
    40	     */
    41	    #[Route('/%eccube_admin_route%/customer/point/{id}/select', name: 'admin_customer_point_select', requirements: ['id' => '\d+'], methods: ['GET'])]
    42	    #[Template('@admin/Customer/point_select.twig')]
    43	    public function index(Customer $Customer): array
    44	    {
    45	        return [
    46	            'Customer' => $Customer,
    47	        ];
    48	    }
    49	
    50	    /**
    51	     * @return array<string, mixed>|RedirectResponse
    52	     */
    53	    #[Route('/%eccube_admin_route%/customer/point/{id}/{type}', name: 'admin_customer_point_history', requirements: ['id' => '\d+', 'type' => 'history|granted|purchase'], methods: ['GET'])]
    54	    #[Route('/%eccube_admin_route%/customer/point/{id}/{type}', name: 'admin_customer_point_update', requirements: ['id' => '\d+', 'type' => 'granted|purchase'], methods: ['POST'])]
    55	    #[Template('@admin/Customer/point_update.twig')]
    56	    public function pointHistory(Request $request, Customer $Customer, string $type): array|RedirectResponse
    57	    {
    58	        $PointHistory = new DtbPointHistory();
    59	        $PointHistory->setCustomer($Customer);
    60	
    61	        $builder = $this->formFactory
    62	            ->createBuilder(CustomerPointType::class, $PointHistory, ['type' => $type]);
    63	
    64	        $form = $builder->getForm();
    65	        $form->handleRequest($request);
    66	
    67	        if ($form->isSubmitted() && $form->isValid()) {
    68	            $pointTypeId = $type == MtbPointType::GRANTED ? MtbPointType::GRANTED_TYPE : MtbPointType::PURCHASE_TYPE;
    69	            $PointType = $this->pointTypeRepository->find($pointTypeId);
    70	
    71	            if ($PointType === null) {
    72	                $this->addError('admin.common.system_error', 'admin');
    73	
    74	                return $this->redirectToRoute('admin_customer_point_history', [
    75	                    'id' => $Customer->getId(),
    76	                    'type' => $type,
    77	                ]);
    78	            }
    79	
    80	            $orderNumber = $form->get('orderNumber')->getData();
    81	
    82	            $PointHistory
    83	                ->setOrder($Customer->getOrderByOrderNumber($orderNumber))
    84	                ->setPointType($PointType)
    85	            ;
    86	            $this->entityManager->persist($PointHistory);
    87	
    88	            $Customer->getPlayer()->addPoint($PointHistory->getPointChange());
    89	            $this->entityManager->persist($Customer);
    90	
    91	            // ポイント履歴・残高更新と同一トランザクションでスマレジ連携ジョブを積み、commit 後に dispatch する。
    92	            $job = $this->smaregiCustomerPointEventService->registerPointAddJob($PointHistory);
    93	
    94	            $this->entityManager->flush();
    95	
    96	            if ($job !== null) {
    97	                $this->smaregiCustomerPointEventService->dispatchPointAddMessage($job, $PointHistory);
    98	            }
    99	
   100	            $this->addSuccess('admin.common.save_complete', 'admin');
   101	
   102	            return $this->redirectToRoute('admin_customer_point_history', [
   103	                'id' => $Customer->getId(),
   104	                'type' => $type,
   105	            ]);
   106	        }
   107	
   108	        $pointTypeLabelKey = $type === MtbPointType::GRANTED
   109	            ? 'admin.customer.point_update.granted'
   110	            : 'admin.customer.point_update.purchase';
   111	
   112	        return [
   113	            'Customer' => $Customer,
   114	            'form' => $form->createView(),
   115	            'type' => $type,
   116	            'pointTypeLabelKey' => $pointTypeLabelKey,
   117	            'pointUpdateFlg' => $type !== MtbPointType::HISTORY,
   118	        ];
   119	    }
   120	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php | sed -n '1,190p'" in /home/y-saito/Developments/hareruya-design-docs
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
    18	use Eccube\Common\EccubeConfig;
    19	use Eccube\Entity\DtbPointHistory;
    20	use Symfony\Component\Form\AbstractType;
    21	use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
    22	use Symfony\Component\Form\Extension\Core\Type\DateType;
    23	use Symfony\Component\Form\Extension\Core\Type\IntegerType;
    24	use Symfony\Component\Form\Extension\Core\Type\TextType;
    25	use Symfony\Component\Form\FormBuilderInterface;
    26	use Symfony\Component\Form\FormError;
    27	use Symfony\Component\Form\FormEvent;
    28	use Symfony\Component\Form\FormEvents;
    29	use Symfony\Component\OptionsResolver\OptionsResolver;
    30	use Symfony\Component\Validator\Constraints\Length;
    31	use Symfony\Component\Validator\Constraints\NotBlank;
    32	use Symfony\Component\Validator\Constraints\Range;
    33	use Symfony\Component\Validator\Constraints\Regex;
    34	
    35	class CustomerPointType extends AbstractType
    36	{
    37	    public const NOTE_CHOICES_GRANTED = [
    38	        'キャンペーン' => 'キャンペーン',
    39	        '特別対応' => '特別対応',
    40	    ];
    41	
    42	    public const NOTE_CHOICES_REFUND = [
    43	        '余剰入金へのご返金' => '余剰入金へのご返金',
    44	        '注文金額変更によるご返金' => '注文金額変更によるご返金',
    45	    ];
    46	
    47	    public function __construct(private EccubeConfig $eccubeConfig)
    48	    {
    49	    }
    50	
    51	    /**
    52	     * {@inheritdoc}
    53	     *
    54	     * @param array<string, mixed> $options
    55	     */
    56	    #[\Override]
    57	    public function buildForm(FormBuilderInterface $builder, array $options): void
    58	    {
    59	        $noteChoices = $options['type'] === 'granted' ? self::NOTE_CHOICES_GRANTED : self::NOTE_CHOICES_REFUND;
    60	
    61	        $builder
    62	            ->add('orderNumber', TextType::class, [
    63	                'label' => 'admin.customer.point.order_id',
    64	                'required' => false,
    65	                'mapped' => false,
    66	                'attr' => [
    67	                    'placeholder' => '例: 00001234',
    68	                ],
    69	                'constraints' => [
    70	                    new Length(['max' => $this->eccubeConfig['eccube_order_id_len'], 'maxMessage' => 'form.order_id.max_length']),
    71	                    new Regex(['pattern' => '/^\d{8}$/']),
    72	                ],
    73	            ])
    74	            ->add('pointChange', IntegerType::class, [
    75	                'label' => 'admin.customer.point.point_change',
    76	                'required' => true,
    77	                'attr' => [
    78	                    'placeholder' => 'admin.customer.point.point_change_ex',
    79	                ],
    80	                'constraints' => [
    81	                    new NotBlank(),
    82	                    new Regex(['pattern' => '/^[-]?([1-9]\d*|0)$/']),
    83	                ],
    84	            ])
    85	            ->add('note', ChoiceType::class, [
    86	                'label' => 'admin.customer.point.note',
    87	                'required' => true,
    88	                'choices' => $noteChoices,
    89	                'expanded' => false,
    90	                'multiple' => false,
    91	                'constraints' => [
    92	                    new NotBlank(),
    93	                ],
    94	            ])
    95	            ->add('issueDate', DateType::class, [
    96	                'label' => 'admin.customer.point.issue_date',
    97	                'required' => true,
    98	                'input' => 'datetime',
    99	                'widget' => 'single_text',
   100	                'placeholder' => ['year' => '----', 'month' => '--', 'day' => '--'],
   101	                'constraints' => [
   102	                    new NotBlank(),
   103	                    new Range([
   104	                        'min' => '1900-01-01',
   105	                        'minMessage' => 'form_error.out_of_range',
   106	                    ]),
   107	                ],
   108	                'attr' => [
   109	                    'class' => 'datetimepicker-input',
   110	                    'data-target' => '#'.$this->getBlockPrefix().'_create_date_start',
   111	                    'data-toggle' => 'datetimepicker',
   112	                ],
   113	            ]);
   114	
   115	        $builder->addEventListener(FormEvents::POST_SUBMIT, function (FormEvent $event) {
   116	            $form = $event->getForm();
   117	
   118	            /** @var DtbPointHistory $PointHistory */
   119	            $PointHistory = $event->getData();
   120	
   121	            $Customer = $PointHistory->getCustomer();
   122	
   123	            if ($form->get('orderNumber')->isValid()) {
   124	                $orderNumber = $form->get('orderNumber')->getData();
   125	                if ($orderNumber && !$Customer->hasOrderNumber($orderNumber)) {
   126	                    $form['orderNumber']->addError(new FormError(trans('admin.customer.point.form.not_has.order_no')));
   127	                }
   128	            }
   129	
   130	            $pointChange = $form->get('pointChange')->getData();
   131	            if ($Customer->getPoint() + $pointChange < 0) {
   132	                $form['pointChange']->addError(new FormError(trans('admin.customer.point.point_charge.point_minus')));
   133	            }
   134	        });
   135	    }
   136	
   137	    #[\Override]
   138	    public function configureOptions(OptionsResolver $resolver): void
   139	    {
   140	        $resolver->setDefaults([
   141	            'data_class' => DtbPointHistory::class,
   142	            'type' => null,
   143	        ]);
   144	    }
   145	
   146	    #[\Override]
   147	    public function getBlockPrefix(): string
   148	    {
   149	        return 'admin_customer_point';
   150	    }
   151	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig | sed -n '1,190p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	{% extends '@admin/default_frame.twig' %}
     2	
     3	{% set menus = ['customer', 'customer_edit'] %}
     4	
     5	{% block title %}{{ 'admin.customer.point_update'|trans }}{% endblock %}
     6	{% block sub_title %}{{ 'admin.customer.customer_management'|trans }}{% endblock %}
     7	
     8	{% form_theme form '@admin/Form/bootstrap_4_horizontal_layout.html.twig' %}
     9	
    10	{% block main %}
    11	    <span class="p-country-name" style="display:none;">Japan</span>
    12	    <div class="c-contentsArea__cols">
    13	        <div class="c-contentsArea__primaryCol">
    14	            <div class="c-primaryCol">
    15	                {% if pointUpdateFlg %}
    16	                    <div class="card rounded border-0 mb-4">
    17	                        <form name="customer_point_form" role="form" id="customer_address_form" method="post"
    18	                              action="{{ url('admin_customer_point_update', { id : Customer.id, type: type }) }}"
    19	                              novalidate class="h-adr">
    20	                            {{ form_widget(form._token) }}
    21	                            <div class="card-header">
    22	                                <div class="row">
    23	                                    <div class="col-8">
    24	                                        <span class="card-title">{{ pointTypeLabelKey|trans }}</span>
    25	                                    </div>
    26	                                    <div class="col-4 text-end">
    27	                                        <a data-bs-toggle="collapse" href="#pointFormInfo" aria-expanded="false" aria-controls="pointFormInfo">
    28	                                            <i class="fa fa-angle-up fa-lg"></i>
    29	                                        </a>
    30	                                    </div>
    31	                                </div>
    32	                            </div>
    33	                            <div class="collapse show ec-cardCollapse" id="pointFormInfo">
    34	                                <div class="card-body">
    35	                                    <div class="row mb-2">
    36	                                        <div class="col-3">
    37	                                            <span>{{ 'admin.customer.point.order_id'|trans }}</span>
    38	                                        </div>
    39	                                        <div class="col mb-2">
    40	                                            {{ form_widget(form.orderNumber) }}
    41	                                            {{ form_errors(form.orderNumber) }}
    42	                                        </div>
    43	                                    </div>
    44	
    45	                                    <div class="row mb-2">
    46	                                        <div class="col-3 mb-2">
    47	                                            <span>{{ 'admin.customer.point.point_change'|trans }}</span>
    48	                                            <span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
    49	                                        </div>
    50	                                        <div class="col mb-2">
    51	                                            {{ form_widget(form.pointChange) }}
    52	                                            {{ form_errors(form.pointChange) }}
    53	                                        </div>
    54	                                    </div>
    55	
    56	                                    <div class="row mb-2">
    57	                                        <div class="col-3">
    58	                                            <span>{{ 'admin.customer.point.issue_date'|trans }}</span>
    59	                                            <span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
    60	                                        </div>
    61	                                        <div class="col mb-2">
    62	                                            {{ form_widget(form.issueDate) }}
    63	                                            {{ form_errors(form.issueDate) }}
    64	                                        </div>
    65	                                    </div>
    66	
    67	                                    <div class="row mb-2">
    68	                                        <div class="col-3 mb-2">
    69	                                            <span>{{ 'admin.customer.point.note'|trans }}</span>
    70	                                            <span class="badge bg-primary ms-1">{{ 'admin.common.required'|trans }}</span>
    71	                                        </div>
    72	                                        <div class="col mb-2">
    73	                                            {{ form_widget(form.note) }}
    74	                                            {{ form_errors(form.note) }}
    75	                                        </div>
    76	                                    </div>
    77	
    78	                                    <div class="row mb-2">
    79	                                        <div id="ex-conversion-action" class="col-6">
    80	                                            <div class="row align-items-center justify-content-end">
    81	                                                <div class="col-auto">
    82	                                                    <button class="btn btn-ec-conversion px-5"
    83	                                                            type="submit">{{ 'admin.common.registration'|trans }}</button>
    84	                                                </div>
    85	                                            </div>
    86	                                        </div>
    87	                                    </div>
    88	                                </div>
    89	                            </div>
    90	                        </form>
    91	                    </div>
    92	                {% endif %}
    93	
    94	                <div class="card rounded border-0 mb-4">
    95	                    <div class="card-header">
    96	                        <div class="row">
    97	                            <div class="col-12">
    98	                                <span class="card-title">
    99	                                    {{ 'admin.customer.point_select'|trans }}
   100	                                </span>
   101	                            </div>
   102	                        </div>
   103	                        <div class="row">
   104	                            <div class="col-12 text-end">
   105	                                ポイント残高: {{ Customer.Player.point }}pt
   106	                            </div>
   107	                        </div>
   108	                    </div>
   109	                    <div class="collapse show ec-cardCollapse" id="pointHistory">
   110	                        <div class="card-body">
   111	                            <table class="table table-striped table-sm">
   112	                                <thead class="table-active">
   113	                                    <th class="align-middle pt-2 pb-2 ps-3">{{ 'admin.common.id'|trans }}</th>
   114	                                    <th class="align-middle pt-2 pb-2">{{ 'admin.common.customer_name'|trans }}</th>
   115	                                    <th class="align-middle pt-2 pb-2 pe-3">{{ 'admin.common.order_number'|trans }}</th>
   116	                                    <th class="align-middle pt-2 pb-2 pe-3">{{ 'admin.common.point_charge'|trans }}</th>
   117	                                    <th class="align-middle pt-2 pb-2 pe-3">{{ 'admin.common.note'|trans }}</th>
   118	                                    <th class="align-middle pt-2 pb-2 pe-3">{{ 'admin.common.issue_date'|trans }}</th>
   119	                                    <th class="align-middle pt-2 pb-2 pe-3">{{ 'admin.common.point_create_date'|trans }}</th>
   120	                                    <th class="align-middle pt-2 pb-2 pe-3">{{ 'admin.common.expiry_date'|trans }}</th>
   121	                                </thead>
   122	                                <tbody>
   123	                                {% for PointHistory in Customer.PointHistories %}
   124	                                    <tr>
   125	                                        <td class="align-middle ps-3">
   126	                                            {{ PointHistory.id }}
   127	                                        </td>
   128	                                        <td class="align-middle">
   129	                                            {{ PointHistory.Customer.name01 }} {{ PointHistory.Customer.name02 }}
   130	                                        </td>
   131	                                        <td class="align-middle">
   132	                                             {% if PointHistory.Order %}{{ PointHistory.Order.order_number }}{%endif %}
   133	                                        </td>
   134	                                        <td class="align-middle">
   135	                                            {{ PointHistory.point_change }}
   136	                                        </td>
   137	                                        <td class="align-middle">
   138	                                            {{ PointHistory.note }}
   139	                                        </td>
   140	                                        <td class="align-middle">
   141	                                            {{ PointHistory.issue_date|date('Y/m/d') }}
   142	                                        </td>
   143	                                        <td class="align-middle">
   144	                                            {{ PointHistory.create_date|date('Y/m/d') }}
   145	                                        </td>
   146	                                        <td class="align-middle">
   147	                                            {{ PointHistory.issue_date|date_modify("+" ~ eccube_config.eccube_customer_point_expire ~ " day")|date_format }}
   148	                                        </td>
   149	                                    </tr>
   150	                                {% endfor %}
   151	                                </tbody>
   152	                            </table>
   153	                        </div>
   154	                    </div>
   155	                </div>
   156	            </div>
   157	        </div>
   158	    </div>
   159	
   160	    <div class="c-conversionArea">
   161	        <div class="c-conversionArea__container">
   162	            <div class="row justify-content-between align-items-center">
   163	                <div class="col-6">
   164	                    <div class="c-conversionArea__leftBlockItem">
   165	                        <a class="c-baseLink" href="{{ url('admin_customer_edit', { id: Customer.id }) }}">
   166	                            <i class="fa fa-backward" aria-hidden="true"></i>
   167	                            <span>{{ 'admin.customer.back_to_customer_edit'|trans }}</span></a>
   168	                    </div>
   169	                </div>
   170	            </div>
   171	        </div>
   172	    </div>
   173	
   174	{% endblock %}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php | sed -n '860,1165p'; nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php | sed -n '1310,1350p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   860	
   861	        /**
   862	         * Set pref.
   863	         */
   864	        public function setPref(?Pref $pref = null): Customer
   865	        {
   866	            $this->Pref = $pref;
   867	
   868	            return $this;
   869	        }
   870	
   871	        /**
   872	         * Get pref.
   873	         */
   874	        public function getPref(): ?Pref
   875	        {
   876	            return $this->Pref;
   877	        }
   878	
   879	        /**
   880	         * Set point
   881	         */
   882	        public function setPoint(?string $point): Customer
   883	        {
   884	            $this->point = $point;
   885	
   886	            return $this;
   887	        }
   888	
   889	        /**
   890	         * Get point
   891	         */
   892	        public function getPoint(): ?string
   893	        {
   894	            return $this->point;
   895	        }
   896	
   897	        /**
   898	         * String representation of object
   899	         *
   900	         * @see http://php.net/manual/en/serializable.serialize.php
   901	         *
   902	         * @return string the string representation of the object or null
   903	         *
   904	         * @since 5.1.0
   905	         */
   906	        #[\Override]
   907	        public function serialize(): string
   908	        {
   909	            // see https://symfony.com/doc/2.7/security/entity_provider.html#create-your-user-entity
   910	            // CustomerRepository::loadUserByIdentifier() で Status をチェックしているため、ここでは不要
   911	            return serialize([
   912	                $this->id,
   913	                $this->email,
   914	                $this->password,
   915	                $this->salt,
   916	            ]);
   917	        }
   918	
   919	        /**
   920	         * Constructs the object
   921	         *
   922	         * @see http://php.net/manual/en/serializable.unserialize.php
   923	         *
   924	         * @param string $serialized <p>
   925	         * The string representation of the object.
   926	         * </p>
   927	         *
   928	         * @since 5.1.0
   929	         */
   930	        #[\Override]
   931	        public function unserialize($serialized): void
   932	        {
   933	            [$this->id, $this->email, $this->password, $this->salt] = unserialize($serialized);
   934	        }
   935	
   936	        #[\Override]
   937	        public function getUserIdentifier(): string
   938	        {
   939	            return $this->email;
   940	        }
   941	
   942	        /**
   943	         * 顧客の出荷情報を追加する
   944	         *
   945	         * @param Collection<int, Shipping> $Shippings
   946	         *
   947	         * @return $this
   948	         */
   949	        public function setShippings(Collection $Shippings): static
   950	        {
   951	            $this->Shippings = $Shippings;
   952	
   953	            return $this;
   954	        }
   955	
   956	        /**
   957	         * 顧客の全て出荷情報を取得する
   958	         *
   959	         * @return Collection<int, Shipping>
   960	         */
   961	        public function getShippings(): Collection
   962	        {
   963	            return $this->Shippings;
   964	        }
   965	
   966	        /**
   967	         * 顧客のメール履歴を追加する
   968	         *
   969	         * @param ArrayCollection|Collection<int, MailHistory> $MailHistories
   970	         *
   971	         * @return $this
   972	         */
   973	        public function setMailHistories(ArrayCollection|Collection $MailHistories): static
   974	        {
   975	            $this->MailHistories = $MailHistories;
   976	
   977	            return $this;
   978	        }
   979	
   980	        /**
   981	         * 顧客の全てメール履歴を取得する
   982	         *
   983	         * @return ArrayCollection|Collection<int, MailHistory>
   984	         */
   985	        public function getMailHistories(): ArrayCollection|Collection
   986	        {
   987	            return $this->MailHistories;
   988	        }
   989	
   990	        public function __serialize(): array
   991	        {
   992	            return ['p' => $this->serialize()];
   993	        }
   994	
   995	        /**
   996	         * @param array<string, mixed> $data
   997	         */
   998	        public function __unserialize(array $data): void
   999	        {
  1000	            if (isset($data['p']) && is_string($data['p'])) {
  1001	                $this->unserialize($data['p']);
  1002	            }
  1003	        }
  1004	
  1005	        #[ORM\Column(name: 'abroad_postal_code', type: Types::STRING, length: 10, nullable: true, options: ['comment' => '国外郵便番号'])]
  1006	        private ?string $abroadPostalCode = null;
  1007	
  1008	        #[ORM\Column(name: 'smaregi_buy_times', type: Types::DECIMAL, nullable: true, options: ['unsigned' => true, 'default' => 0])]
  1009	        private ?string $smaregiBuyTimes = '0';
  1010	
  1011	        #[ORM\Column(name: 'smaregi_buy_total', type: Types::DECIMAL, nullable: true, options: ['unsigned' => true, 'default' => 0])]
  1012	        private ?string $smaregiBuyTotal = '0';
  1013	
  1014	        #[ORM\OneToOne(targetEntity: DtbPlayer::class, mappedBy: 'Customer')]
  1015	        private ?DtbPlayer $Player = null;
  1016	
  1017	        /**
  1018	         * @var Collection<int, DtbBuyOrder>
  1019	         */
  1020	        #[ORM\OneToMany(targetEntity: DtbBuyOrder::class, mappedBy: 'Customer')]
  1021	        private Collection $BuyOrders;
  1022	
  1023	        /**
  1024	         * @var Collection<int, DtbBankAccount>
  1025	         */
  1026	        #[ORM\OneToMany(targetEntity: DtbBankAccount::class, mappedBy: 'Customer')]
  1027	        private Collection $BankAccounts;
  1028	
  1029	        #[ORM\Column(name: 'addr03', type: Types::STRING, length: 255, nullable: true)]
  1030	        private ?string $addr03 = null;
  1031	
  1032	        #[ORM\Column(name: 'tel01', type: Types::STRING, length: 5, nullable: true)]
  1033	        private ?string $tel01 = null;
  1034	
  1035	        #[ORM\Column(name: 'tel02', type: Types::STRING, length: 5, nullable: true)]
  1036	        private ?string $tel02 = null;
  1037	
  1038	        #[ORM\Column(name: 'tel03', type: Types::STRING, length: 5, nullable: true)]
  1039	        private ?string $tel03 = null;
  1040	
  1041	        #[ORM\Column(name: 'fax01', type: Types::STRING, length: 5, nullable: true)]
  1042	        private ?string $fax01 = null;
  1043	
  1044	        #[ORM\Column(name: 'fax02', type: Types::STRING, length: 5, nullable: true)]
  1045	        private ?string $fax02 = null;
  1046	
  1047	        #[ORM\Column(name: 'fax03', type: Types::STRING, length: 5, nullable: true)]
  1048	        private ?string $fax03 = null;
  1049	
  1050	        public function getAbroadPostalCode(): ?string
  1051	        {
  1052	            return $this->abroadPostalCode;
  1053	        }
  1054	
  1055	        public function setAbroadPostalCode(?string $abroadPostalCode): Customer
  1056	        {
  1057	            $this->abroadPostalCode = $abroadPostalCode;
  1058	
  1059	            return $this;
  1060	        }
  1061	
  1062	        public function isShopCustomer(): bool
  1063	        {
  1064	            $CustomerGroup = $this->getPlayer()->getCustomerGroup();
  1065	
  1066	            return $CustomerGroup->getBranchShopFrontFlg();
  1067	        }
  1068	
  1069	        /**
  1070	         * スマレジ会員コード(EAN13)を生成して返す.
  1071	         *
  1072	         * 固定番号(29) + ゼロ埋めした smaregi_id + チェックデジット の13桁文字列.
  1073	         * smaregi_id が未設定の場合は生成できないため空文字を返す.
  1074	         */
  1075	        public function getSmaregiMemberCode(): string
  1076	        {
  1077	            $Player = $this->getPlayer();
  1078	            if ($Player === null) {
  1079	                return '';
  1080	            }
  1081	
  1082	            $smaregiId = $Player->getSmaregiId();
  1083	            if ($smaregiId === null || $smaregiId === '') {
  1084	                return '';
  1085	            }
  1086	
  1087	            return self::buildSmaregiMemberCode($smaregiId);
  1088	        }
  1089	
  1090	        /**
  1091	         * 指定した smaregi_id からスマレジ会員コード(EAN13)を生成する.
  1092	         *
  1093	         * 会員登録時は smaregi_id を採番してから本メソッドで customerCode を組み立てるため、
  1094	         * エンティティへ保存する前の値からもコードを生成できるよう static で提供する.
  1095	         */
  1096	        public static function buildSmaregiMemberCode(string $smaregiId): string
  1097	        {
  1098	            if ($smaregiId === '') {
  1099	                return '';
  1100	            }
  1101	
  1102	            $fixNo = self::CUSTOMER_CODE_FIX_NO;
  1103	            $zeroPaddingLength = self::getSmaregiIdMaxLength();
  1104	
  1105	            $strNum = $fixNo.sprintf("%0{$zeroPaddingLength}d", $smaregiId);
  1106	
  1107	            return $strNum.StringUtil::calcCheckDigit($strNum);
  1108	        }
  1109	
  1110	        /**
  1111	         * スマレジ会員コード(EAN13)に収まる smaregi_id の最大桁数を返す.
  1112	         *
  1113	         * 固定番号 + smaregi_id + チェックデジット で CUSTOMER_CODE_LENGTH 桁に収める必要があるため、
  1114	         * smaregi_id はこの桁数を超えてはならない（超えると EAN13 として不正になる）。
  1115	         */
  1116	        public static function getSmaregiIdMaxLength(): int
  1117	        {
  1118	            return self::CUSTOMER_CODE_LENGTH - strlen((string) self::CUSTOMER_CODE_FIX_NO) - 1;
  1119	        }
  1120	
  1121	        public function getSmaregiBuyTimes(): ?string
  1122	        {
  1123	            return $this->smaregiBuyTimes;
  1124	        }
  1125	
  1126	        public function setSmaregiBuyTimes(?string $smaregiBuyTimes): Customer
  1127	        {
  1128	            $this->smaregiBuyTimes = $smaregiBuyTimes;
  1129	
  1130	            return $this;
  1131	        }
  1132	
  1133	        public function getSmaregiBuyTotal(): ?string
  1134	        {
  1135	            return $this->smaregiBuyTotal;
  1136	        }
  1137	
  1138	        public function setSmaregiBuyTotal(?string $smaregiBuyTotal): Customer
  1139	        {
  1140	            $this->smaregiBuyTotal = $smaregiBuyTotal;
  1141	
  1142	            return $this;
  1143	        }
  1144	
  1145	        public function getPlayer(): ?DtbPlayer
  1146	        {
  1147	            return $this->Player;
  1148	        }
  1149	
  1150	        public function setPlayer(?DtbPlayer $Player): Customer
  1151	        {
  1152	            $this->Player = $Player;
  1153	
  1154	            return $this;
  1155	        }
  1156	
  1157	        public function addBuyOrders(DtbBuyOrder $BuyOrder): Customer
  1158	        {
  1159	            $this->BuyOrders[] = $BuyOrder;
  1160	
  1161	            return $this;
  1162	        }
  1163	
  1164	        public function removeBuyOrders(DtbBuyOrder $BuyOrder): bool
  1165	        {
  1310	        }
  1311	
  1312	        public function getOrderByOrderNumber(?string $orderNumber): ?Order
  1313	        {
  1314	            if (!$orderNumber) {
  1315	                return null;
  1316	            }
  1317	
  1318	            foreach ($this->getOrders() as $Order) {
  1319	                if ($Order->getOrderNumber() === $orderNumber) {
  1320	                    return $Order;
  1321	                }
  1322	            }
  1323	
  1324	            return null;
  1325	        }
  1326	
  1327	        /**
  1328	         * @var Collection<int, DtbPointHistory>
  1329	         */
  1330	        #[ORM\OneToMany(targetEntity: DtbPointHistory::class, mappedBy: 'Customer')]
  1331	        #[ORM\OrderBy(['id' => Criteria::DESC])]
  1332	        private Collection $PointHistories;
  1333	
  1334	        public function addPointHistory(DtbPointHistory $PointHistory): Customer
  1335	        {
  1336	            $this->PointHistories[] = $PointHistory;
  1337	
  1338	            return $this;
  1339	        }
  1340	
  1341	        /**
  1342	         * @return Collection<int, DtbPointHistory>
  1343	         */
  1344	        public function getPointHistories(): Collection
  1345	        {
  1346	            return $this->PointHistories;
  1347	        }
  1348	
  1349	        public function getPostalCode01(): ?string
  1350	        {

codex
実装の主要参照は確認できました。候補の多くは実装行自体は存在しますが、いくつかは設計文の読み方や実装行番号の粒度に弱さがあるため、設計の後半節と関連テンプレート/定数まで確認します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/admin_customer_point.html | sed -n '260,330p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   260	<div class="table-wrap"><table><thead><tr><th>種類</th><th>内容</th></tr></thead><tbody><tr><td>入力</td><td>会員ID、ポイント種別、ポイント変動・備考、なりすまし対策トークン。</td></tr><tr><td>成功時出力</td><td>ポイント履歴の追加、履歴画面への遷移。</td></tr><tr><td>失敗時出力</td><td>会員・選手情報が無い場合は404、検証失敗時は履歴画面を再表示。</td></tr><tr><td>副作用</td><td>ポイント履歴の追加。</td></tr></tbody></table></div>
   261	<hr>
   262	<h2 id="DBカラム">DBカラム</h2>
   263	<p>機能に直接関係する列のみ記載する。型や一覧の細部はスキーマを参照する。</p>
   264	<div class="table-wrap"><table><thead><tr><th>テーブル</th><th>列</th><th>メモ</th></tr></thead><tbody><tr><td>ポイント履歴（<code>dtb_point_history</code>）</td><td><code>customer_id</code>（会員参照）、<code>point_change</code>（ポイント変動）、<code>note</code>（備考）、<code>point_type_id</code>（種別）、<code>order_id</code>（注文参照）、<code>issue_date</code>（付与日）</td><td>一覧表示・付与に使用する。</td></tr><tr><td>選手情報（<code>dtb_player</code>）</td><td><code>point</code>（保有ポイント）</td><td>付与対象の会員に紐づく。</td></tr></tbody></table></div>
   265	<h3 id="DB操作">DB操作</h3>
   266	<p>永続化の正は ec-cube-enterprise（テーブル名・操作は ec-cube-enterprise を正典）。当ドメインは承認ワークフローを介さず persist/flush で直接確定する（承認ワークフローは在庫機能固有）。</p>
   267	<div class="table-wrap"><table><thead><tr><th>操作種別</th><th>対象テーブル</th><th>契機・条件</th></tr></thead><tbody><tr><td>登録/更新</td><td>dtb_player / dtb_point_history</td><td>当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）。確定は persist/flush による即時反映。DB=ec-cube-enterprise を正典とする。</td></tr></tbody></table></div>
   268	<hr>
   269	<h2 id="権限・認可">権限・認可</h2>
   270	<div class="table-wrap"><table><thead><tr><th>利用者状態</th><th>ポイント付与・履歴</th></tr></thead><tbody><tr><td>未ログイン管理者</td><td>アクセス不可。</td></tr><tr><td>ログイン済み管理者</td><td>当該会員のポイント履歴閲覧・付与が可能。</td></tr></tbody></table></div>
   271	<hr>
   272	<h2 id="画面遷移">画面遷移</h2>
   273	<div class="table-wrap"><table><thead><tr><th>条件</th><th>遷移先</th></tr></thead><tbody><tr><td>種別選択</td><td>種別選択画面（<code>admin_customer_point_type_select</code>）</td></tr><tr><td>履歴を開く</td><td>ポイント履歴画面（<code>admin_customer_point_history</code>）</td></tr><tr><td>付与成功</td><td>ポイント履歴画面（<code>admin_customer_point_history</code>）</td></tr><tr><td>検証失敗</td><td>ポイント履歴画面を再表示</td></tr><tr><td>会員・選手情報なし</td><td>ページが見つからない扱い（404）</td></tr></tbody></table></div>
   274	<hr>
   275	<h2 id="エラー処理">エラー処理</h2>
   276	<div class="table-wrap"><table><thead><tr><th>エラー内容</th><th>処理</th></tr></thead><tbody><tr><td>会員・選手情報が存在しない</td><td>ページが見つからない扱い（404）。</td></tr><tr><td>付与フォーム検証失敗</td><td>ポイント履歴画面を再表示する。</td></tr><tr><td>なりすまし対策トークン不正</td><td>付与を行わない。</td></tr></tbody></table></div>
   277	<hr>
   278	<h2 id="ログ・監査">ログ・監査</h2>
   279	<h3 id="ログに出してはいけないもの">ログに出してはいけないもの</h3>
   280	<ul><li>Cookie値</li><li>セッションIDの完全値</li></ul>
   281	<hr>
   282	<h2 id="排他制御・トランザクション">排他制御・トランザクション</h2>
   283	<p>ポイント付与時に履歴を追加して確定する。本機能は楽観ロック・悲観ロックの対象は持たない。</p>
   284	      <footer>このページは機能仕様書Markdownから自動生成されています。編集は元のMarkdownに対して行ってください。</footer>
   285	    </main>
   286	  </div>
   287	</body>
   288	</html>

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_select.twig | sed -n '1,180p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
     1	{% extends '@admin/default_frame.twig' %}
     2	
     3	{% set menus = ['customer', 'customer_edit'] %}
     4	
     5	{% block title %}{{ 'admin.customer.point_select'|trans }}{% endblock %}
     6	{% block sub_title %}{{ 'admin.customer.customer_management'|trans }}{% endblock %}
     7	{% block main %}
     8	    <div class="c-contentsArea__cols">
     9	        <div class="c-contentsArea__primaryCol">
    10	            <div class="c-primaryCol">
    11	                <div class="row">
    12	                    <div class="col-6 mb-4">
    13	                        <div class="card rounded border-0 h-100">
    14	                            <a class="point-type-select" href="{{ url('admin_customer_point_history', { 'id': Customer.id, 'type': constant('Eccube\\Entity\\Master\\MtbPointType::GRANTED') }) }}">
    15	                                <div class="text-center pt-5 pb-5">
    16	                                    {{ 'admin.customer.point.granted'|trans|nl2br }}
    17	                                </div>
    18	                            </a>
    19	                        </div>
    20	                    </div>
    21	                    <div class="col-6 mb-4">
    22	                        <div class="card rounded border-0 h-100">
    23	                            <a class="point-type-select" href="{{ url('admin_customer_point_history', { 'id': Customer.id, 'type': constant('Eccube\\Entity\\Master\\MtbPointType::PURCHASE') }) }}">
    24	                                <div class="text-center pt-5 pb-5">
    25	                                    {{ 'admin.customer.point.purchase'|trans|nl2br }}
    26	                                </div>
    27	                            </a>
    28	                        </div>
    29	                    </div>
    30	                </div>
    31	            </div>
    32	        </div>
    33	    </div>
    34	
    35	    <div class="c-conversionArea">
    36	        <div class="c-conversionArea__container">
    37	            <div class="row justify-content-between align-items-center">
    38	                <div class="col-6">
    39	                    <div class="c-conversionArea__leftBlockItem">
    40	                        <a class="c-baseLink" href="{{ url('admin_customer_edit', { id: Customer.id }) }}">
    41	                            <i class="fa fa-backward" aria-hidden="true"></i>
    42	                            <span>{{ 'admin.customer.back_to_customer_edit'|trans }}</span></a>
    43	                    </div>
    44	                </div>
    45	            </div>
    46	        </div>
    47	    </div>
    48	{% endblock %}

exec
/bin/bash -lc 'rg -n "class MtbPointType|const .*TYPE|GRANTED|PURCHASE|HISTORY" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository /home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations | head -80' in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc 'rg -n "dtb_point_history|class DtbPointHistory|point_type|issueDate|issue_date|pointChange|note" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity /home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations | head -160' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 144ms:
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260512200000.php:25:    private const DEVICE_TYPE_PC = 10;
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260424130000.php:27:    private const DEVICE_TYPE_PC = 10;
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260409120000.php:29:    private const DEVICE_TYPE_ID = 10;
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260518110000.php:25:    private const DEVICE_TYPE_PC = 10;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Tag.php:59:        public const FEATURE_PURCHASE_ID = 5;
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260108130821.php:96:                'stock_change_type_id' => MtbStockChangeType::PURCHASE,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260108130821.php:102:                'stock_change_type_id' => MtbStockChangeType::PURCHASE,
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260424120000.php:27:    private const DEVICE_TYPE_PC = 10;
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260508120000.php:25:    private const DEVICE_TYPE_PC = 10;
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260424110000.php:27:    private const DEVICE_TYPE_PC = 10;
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260420150000.php:23:    private const DEVICE_TYPE_PC = 10;
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260601000000.php:29:    private const DEVICE_TYPE_PC = 10;
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20240930235959_04.php:503:        // --- DTB LOGIN HISTORY
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20240930235959_04.php:529:        // --- DTB MAIL HISTORY
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260521100000.php:29:    private const DEVICE_TYPE_PC = 10;
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260603120000.php:25:    private const DEVICE_TYPE_PC = 10;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbSynchronisationUpdate.php:26:    public const TYPE_CARD = 'card';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbSynchronisationUpdate.php:27:    public const TYPE_CUSTOMER = 'customer';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbSynchronisationUpdate.php:28:    public const TYPE_PRODUCT = 'product';
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260518100000.php:25:    private const DEVICE_TYPE_PC = 10;
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260416190000.php:27:    private const DEVICE_TYPE_PC = 10;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbWeeklyStockHistory.php:26:    public const HISTORY_COUNT = 11;
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260424100000.php:27:    private const DEVICE_TYPE_PC = 10;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockHistory.php:32:    private const SOURCE_TYPE_TO_ROUTE_NAME = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyMainCard.php:33:    public const SELECT_TYPE = 1;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyMainCard.php:34:    public const BULK_TYPE = 2;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/QueryKey.php:26:    public const string LOGIN_HISTORY_SEARCH_ADMIN = 'LoginHistory.getQueryBuilderBySearchDataForAdmin';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockMoveTransfer.php:28:    public const MOVE_TRANSFER_TYPE_MOVE = 1;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockMoveTransfer.php:31:    public const MOVE_TRANSFER_TYPE_TRANSFER = 2;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Page.php:37:        public const EDIT_TYPE_USER = 0;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Page.php:38:        public const EDIT_TYPE_PREVIEW = 1;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Page.php:39:        public const EDIT_TYPE_DEFAULT = 2;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Page.php:40:        public const EDIT_TYPE_DEFAULT_CONFIRM = 3;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbStockHistorySourceType.php:30:    public const PURCHASE_AUTO_IMPORT_BATCH = 4;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOrderType.php:38:    public const LARGE_TYPE = 150;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOption.php:52:    public const PURCHASE_MAIL_ADDRESS = 'purchase_mail_address';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOption.php:53:    public const PURCHASE_MAIL_ADDRESS_DEFAULT = 'testbuying@hareruyamtg.com';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOption.php:77:    public const BULK_PURCHASE_ID = 'bulk_purchase_id';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOption.php:95:    public const WEEKLY_STOCK_HISTORY_ERROR_MAIL_ADDRESS = 'weekly_stock_history_error_mail_address';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbStockChangeType.php:28:    public const PURCHASE = 2;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbBanner.php:36:    public const DISP_TYPES = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbPointType.php:26:class MtbPointType extends AbstractEntity implements \Stringable
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbPointType.php:28:    public const HISTORY = 'history';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbPointType.php:29:    public const GRANTED = 'granted';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbPointType.php:30:    public const PURCHASE = 'purchase';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbPointType.php:31:    public const GRANTED_TYPE = 1;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbPointType.php:32:    public const PURCHASE_TYPE = 2;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbSubtype.php:29:    public const SUBTYPE_ATTRACTION_NAME = 'Attraction';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/CsvType.php:32:        public const CSV_TYPE_PRODUCT = 1;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/CsvType.php:37:        public const CSV_TYPE_CUSTOMER = 2;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/CsvType.php:42:        public const CSV_TYPE_ORDER = 3;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/CsvType.php:47:        public const CSV_TYPE_SHIPPING = 4;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/CsvType.php:52:        public const CSV_TYPE_CATEGORY = 5;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/CsvType.php:57:        public const CSV_TYPE_CLASS_NAME = 6;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/CsvType.php:62:        public const CSV_TYPE_CLASS_CATEGORY = 7;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/CsvType.php:67:        public const CSV_TYPE_EVENT_APPLICATION = 8;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/CsvType.php:72:        public const CSV_TYPE_GMO_MEMBER = 9;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/CsvType.php:77:        public const CSV_TYPE_STOCK = 10;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/CsvType.php:82:        public const CSV_TYPE_STOCK_MOVE = 11;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/CsvType.php:87:        public const CSV_TYPE_STOCK_SPLIT = 12;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/CsvType.php:92:        public const CSV_TYPE_DEPARTMENT = 13;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/DeviceType.php:29:        public const DEVICE_TYPE_MB = 2;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/DeviceType.php:30:        // const DEVICE_TYPE_TABLET = 3;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/DeviceType.php:31:        public const DEVICE_TYPE_PC = 10;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbStockChangeTypeDetail.php:27:    public const PURCHASE_OTC = 6; // 店頭買取
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbStockChangeTypeDetail.php:28:    public const PURCHASE_NET = 7; // ネット買取
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbTopBanner.php:33:    public const DISP_TYPES = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/SaleType.php:32:        public const SALE_TYPE_NORMAL = 1;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockSplitJoin.php:34:    public const SPLIT_JOIN_TYPE_SPLIT = 1;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockSplitJoin.php:37:    public const SPLIT_JOIN_TYPE_JOIN = 2;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbWeeklyStockHistoryRepository.php:38:        for ($i = 1; $i <= DtbWeeklyStockHistory::HISTORY_COUNT; ++$i) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:33:    public const LIST_EXPORT_TYPE_PICK = 'pick';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockMoveTransferRepository.php:36:    public const LIST_EXPORT_TYPE_RETURN = 'return';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbWeeklyStockHistoryTempRepository.php:52:        for ($i = 1; $i <= DtbWeeklyStockHistory::HISTORY_COUNT; ++$i) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbWeeklyStockHistoryTempRepository.php:120:        for ($i = 1; $i <= DtbWeeklyStockHistory::HISTORY_COUNT; ++$i) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/LoginHistoryRepository.php:112:        return $this->queries->customize(QueryKey::LOGIN_HISTORY_SEARCH_ADMIN, $qb, $searchData);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbInventoryPlanDetailRepository.php:28:    private const DTYPE = 'dtbinventoryplandetail';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:79:    private const POST_TYPE = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:83:    private const WORLD_POST_TYPE = [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:60:    public const PURCHASE_CONDITION = 'NM';

 succeeded in 153ms:
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125163806.php:22: * Auto-generated Migration: Import from CSV for mtb_point_type
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125163806.php:29:        return 'mtb_point_type のマスタデータを登録';
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125163806.php:38:            $recordCount = $this->connection->fetchOne('SELECT COUNT(id) FROM mtb_point_type WHERE id = ?', [$record['id']]);
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125163806.php:44:            $this->addSql('INSERT INTO mtb_point_type (id, name) VALUES (?, ?)', [$record['id'], $record['name']]);
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125163806.php:48:        $this->addSql("SELECT setval('mtb_point_type_id_seq', COALESCE((SELECT MAX(id) FROM mtb_point_type), 0) + 1, false)");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:126:        #[ORM\Column(name: 'note', type: Types::STRING, length: 4000, nullable: true)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:127:        private ?string $note = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:592:         * Set note.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:594:        public function setNote(?string $note = null): Customer
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:596:            $this->note = $note;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:602:         * Get note.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:606:            return $this->note;
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:403:  Please note that during a new set release, lots of orders come through and may take time to ship than usual.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:421:　*Please note that your ID will need to be a legal ID (Example: Driver’s License, Passport, etc.)
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:526:  *Please note that during new set releases, we receive a high volume of orders, and shipping may take longer than usual.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:620:  Please note that during a new set release, lots of orders come through and may take time to ship than usual.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:720:Please note that during a new set release, lots of orders come through and may take time to ship than usual.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:811:  Please note that during a new set release, lots of orders come through and may take time to ship than usual.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:990:  Please note that during a new set release, lots of orders come through and may take time to ship than usual.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:999:　*Please note that your ID will need to be a legal ID (Example: Driver’s License, Passport, etc.)
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:1303:                'footer' => '*The credit card billing name will appear as Hareruya. Please note that Republic of Singapore or United States may also appear on your credit card billing for reasons due to the credit card company.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:1672:Please note that we\'ll not accept a request for restoring lost points in any circumstances.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:2945:Please note that this order will be canceled If you do not respond by (返信期限日) JST.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:2982:2. In order to save commission fee, you may make another cheap order (Placing an order with only a basic land is fine). If you make your order, please add a note in the remarks column as ship RETURNED 【返送物のオーダーID】 together.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:2983:(Please note that it is unable to combine with the order has already placed.)
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:2985:Please note that this order will be canceled If you do not respond by 【締切日】JST.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251204111453.php:4067:https://note.com/morio2001/n/nbdec628327e0
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:120:        #[ORM\Column(name: 'note', type: Types::STRING, length: 4000, nullable: true)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:121:        private ?string $note = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:681:         * Set note.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:683:        public function setNote(?string $note = null): Shipping
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:685:            $this->note = $note;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:691:         * Get note.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Shipping.php:695:            return $this->note;
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260312120000.php:50:Please note that we'll not accept a request for restoring lost points in any circumstances.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260226000001.php:114:        $this->addSql("INSERT INTO dtb_csv (csv_type_id, creator_id, entity_name, field_name, reference_field_name, disp_name, sort_no, enabled, create_date, update_date) VALUES (4,NULL,'Eccube\\\\Entity\\\\Order', 'note',NULL,'注文備考',86, True,NOW(),NOW());");
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260226000001.php:232:        $this->addSql("INSERT INTO dtb_csv (csv_type_id, creator_id, entity_name, field_name, reference_field_name, disp_name, sort_no, enabled, create_date, update_date) VALUES (4,NULL,'Eccube\\\\Entity\\\\Shipping', 'note',NULL,'配達用メモ',70, True,NOW(),NOW());");
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260224000000.php:83:        $this->addSql("INSERT INTO dtb_csv (csv_type_id, creator_id, entity_name, field_name, reference_field_name, disp_name, sort_no, enabled, create_date, update_date) VALUES (3, NULL,'Eccube\\\\Entity\\\\Order', 'note', NULL,'注文備考', 54, True, NOW(), NOW());");
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20260224000000.php:209:        $this->addSql("INSERT INTO dtb_csv (csv_type_id, creator_id, entity_name, field_name, reference_field_name, disp_name, sort_no, enabled, create_date, update_date) VALUES (3, NULL,'Eccube\\\\Entity\\\\Shipping', 'note', NULL,'配達用メモ', 70, True, NOW(), NOW());");
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbPointType.php:23:#[ORM\Table(name: 'mtb_point_type')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:23:#[ORM\Table(name: 'dtb_point_history')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:27:class DtbPointHistory extends AbstractEntity
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:42:    #[ORM\JoinColumn(name: 'point_type_id', nullable: true, referencedColumnName: 'id', options: ['unsigned' => true, 'comment' => 'ポイント属性ID'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:47:    private ?int $pointChange = 0;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:49:    #[ORM\Column(name: 'note', type: Types::TEXT, nullable: true, options: ['comment' => '備考'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:50:    private ?string $note = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:52:    #[ORM\Column(name: 'issue_date', type: Types::DATETIMETZ_MUTABLE, options: ['comment' => 'ポイント発行日'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:53:    private ?\DateTime $issueDate = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:73:    public function setPointChange(?int $pointChange): DtbPointHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:75:        $this->pointChange = $pointChange;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:82:        return $this->pointChange;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:85:    public function setNote(?string $note): DtbPointHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:87:        $this->note = $note;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:94:        return $this->note;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:97:    public function setIssueDate(?\DateTime $issueDate): DtbPointHistory
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:99:        $this->issueDate = $issueDate;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:106:        return $this->issueDate;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:111:        if ($this->issueDate === null) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:112:            throw new \LogicException('issueDate must be set before calculating expire date.');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php:115:        return (clone $this->issueDate)->modify(sprintf('+%d days', $expireDays));
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:530:        #[ORM\Column(name: 'note', type: Types::STRING, length: 4000, nullable: true)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:531:        private ?string $note = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1280:         * Set note.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1282:        public function setNote(?string $note = null): Order
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1284:            $this->note = $note;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1290:         * Get note.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:1294:            return $this->note;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Product.php:515:        #[ORM\Column(name: 'note', type: Types::TEXT, nullable: true)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Product.php:516:        private ?string $note = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Product.php:701:         * Set note.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Product.php:703:        public function setNote(?string $note = null): Product
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Product.php:705:            $this->note = $note;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Product.php:711:         * Get note.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Product.php:715:            return $this->note;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/OrderPdf.php:29:        public \DateTime|string $issue_date;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/OrderPdf.php:48:        #[ORM\Column(name: 'note1', type: Types::STRING, nullable: true)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/OrderPdf.php:49:        private ?string $note1 = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/OrderPdf.php:51:        #[ORM\Column(name: 'note2', type: Types::STRING, nullable: true)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/OrderPdf.php:52:        private ?string $note2 = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/OrderPdf.php:54:        #[ORM\Column(name: 'note3', type: Types::STRING, nullable: true)]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/OrderPdf.php:55:        private ?string $note3 = null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/OrderPdf.php:149:            return $this->note1;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/OrderPdf.php:155:        public function setNote1(?string $note1): static
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/OrderPdf.php:157:            $this->note1 = $note1;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/OrderPdf.php:164:            return $this->note2;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/OrderPdf.php:170:        public function setNote2(?string $note2): static
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/OrderPdf.php:172:            $this->note2 = $note2;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/OrderPdf.php:179:            return $this->note3;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/OrderPdf.php:185:        public function setNote3(?string $note3): static
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/OrderPdf.php:187:            $this->note3 = $note3;
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:1:INSERT INTO public.dtb_product (id,creator_id,product_status_id,card_detail_id,sell_group_id,discount_id,storage_code_id,region_restriction_id,buy_discount_id,base_info_id,"name",note,description_list,description_detail,search_word,free_area,create_date,update_date,name_en,description_detail_jp,description_detail_en,buy_description_detail,buy_description_detail_en,"size",weight,release_date,is_branch_published,cardset_id) VALUES
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2150:<br/>※Please note there may be tiny differences in sleeve sizes
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2317:<br/>※Please note there may be tiny differences in sleeve sizes
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2344:<br/>※Please note there may be tiny differences in sleeve sizes
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2372:<br/>※Please note there may be tiny differences in sleeve sizes
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2431:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2509:<br/>※Please note there may be tiny differences in sleeve sizes
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2530:<br/>※Please note there may be tiny differences in sleeve sizes
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2547:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2574:<br/>※Please note there may be tiny differences in sleeve sizes
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2594:<br/>※Please note there may be tiny differences in sleeve sizes
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2622:<br/>※Please note there may be tiny differences in sleeve sizes
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2651:<br/>※Please note there may be tiny differences in sleeve sizes
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2679:<br/>※Please note there may be tiny differences in sleeve sizes
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2699:<br/>※Please note there may be tiny differences in sleeve sizes
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2716:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2743:<br/>※Please note there may be tiny differences in sleeve sizes
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2763:<br/>※Please note there may be tiny differences in sleeve sizes
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2784:<br/>※Please note there may be tiny differences in sleeve sizes
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2810:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2827:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2844:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2861:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2878:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2895:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2912:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:2956:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:3090:<br/>※Please note there may be tiny differences in sleeve sizes
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:3109:<br/>※Please note there may be tiny differences in sleeve sizes
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:3128:<br/>※Please note there may be tiny differences in sleeve sizes。
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:3179:<br/>※Please note that in rare cases sleeve dimensions may vary slightly.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:3203:<br/>※Please note that in rare cases sleeve dimensions may vary slightly.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:3232:<br/>※Please note that in rare cases sleeve dimensions may vary slightly.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:3267:<br/>※Please note that in rare cases sleeve dimensions may vary slightly.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:3292:<br/>※Please note that in rare cases sleeve dimensions may vary slightly.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:3317:<br/>※Please note that in rare cases sleeve dimensions may vary slightly.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:3342:<br/>※Please note that in rare cases sleeve dimensions may vary slightly.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:3376:<br/>※Please note that in rare cases sleeve dimensions may vary slightly.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:3418:<br/>※Please note that in rare cases sleeve dimensions may vary slightly.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:3443:<br/>※Please note that in rare cases sleeve dimensions may vary slightly.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:3468:<br/>※Please note that in rare cases sleeve dimensions may vary slightly.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:3493:<br/>※Please note that in rare cases sleeve dimensions may vary slightly.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:3633:※Please note that in rare cases sleeve dimensions may vary slightly.<br/>
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:3671:※Please note that in rare cases sleeve dimensions may vary slightly. <br/>
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:3946:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:3971:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:3988:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:4005:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:4022:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:4039:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:4056:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:4073:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:4091:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:4108:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:4125:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:4143:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:4160:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:4177:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:4194:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:4211:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:4228:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:4737:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:4754:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:4771:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:4800:<br/>※Please note there may be tiny differences in sleeve sizes
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:4821:<br/>※Please note there may be tiny differences in sleeve sizes
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:4958:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:5780:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:7102:<br/>※Please note slight variance in the dimensions is possible.
/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/sql/dtb_product.sql:7142:<br/>※Please note slight variance in the dimensions is possible.

codex
設計後半では、入力は明確に「会員ID、ポイント種別、ポイント変動・備考、トークン」に限定され、副作用も「ポイント履歴の追加」と書かれています。実装側は注文番号・付与日入力、Player残高更新、スマレジジョブが含まれるため、このあたりは候補外の差分もあります。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbPointType.php | sed -n '1,120p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace Eccube\Entity\Master;
    17	
    18	use Doctrine\DBAL\Types\Types;
    19	use Doctrine\ORM\Mapping as ORM;
    20	use Eccube\Entity\AbstractEntity;
    21	use Eccube\Repository\Master\MtbPointTypeRepository;
    22	
    23	#[ORM\Table(name: 'mtb_point_type')]
    24	#[ORM\HasLifecycleCallbacks]
    25	#[ORM\Entity(repositoryClass: MtbPointTypeRepository::class)]
    26	class MtbPointType extends AbstractEntity implements \Stringable
    27	{
    28	    public const HISTORY = 'history';
    29	    public const GRANTED = 'granted';
    30	    public const PURCHASE = 'purchase';
    31	    public const GRANTED_TYPE = 1;
    32	    public const PURCHASE_TYPE = 2;
    33	
    34	    #[ORM\Column(name: 'id', type: Types::INTEGER, options: ['unsigned' => true, 'comment' => 'ポイント属性ID'])]
    35	    #[ORM\Id]
    36	    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    37	    private int $id;
    38	
    39	    #[ORM\Column(name: 'name', type: Types::STRING, length: 16, options: ['comment' => '名称'])]
    40	    private string $name;
    41	
    42	    public function getId(): int
    43	    {
    44	        return $this->id;
    45	    }
    46	
    47	    #[\Override]
    48	    public function __toString(): string
    49	    {
    50	        return $this->name;
    51	    }
    52	
    53	    public function setName(string $name): MtbPointType
    54	    {
    55	        $this->name = $name;
    56	
    57	        return $this;
    58	    }
    59	
    60	    public function getName(): string
    61	    {
    62	        return $this->name;
    63	    }
    64	}

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPointHistory.php | sed -n '1,180p'" in /home/y-saito/Developments/hareruya-design-docs
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
    20	use Eccube\Entity\Master\MtbPointType;
    21	use Eccube\Repository\DtbPointHistoryRepository;
    22	
    23	#[ORM\Table(name: 'dtb_point_history')]
    24	#[ORM\HasLifecycleCallbacks]
    25	#[ORM\Entity(repositoryClass: DtbPointHistoryRepository::class)]
    26	#[ORM\Cache(usage: 'NONSTRICT_READ_WRITE')]
    27	class DtbPointHistory extends AbstractEntity
    28	{
    29	    #[ORM\Column(name: 'id', type: Types::INTEGER, options: ['unsigned' => true, 'comment' => 'ID'])]
    30	    #[ORM\Id]
    31	    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    32	    private int $id;
    33	
    34	    #[ORM\JoinColumn(name: 'customer_id', nullable: false, referencedColumnName: 'id', options: ['unsigned' => true, 'comment' => '顧客ID'])]
    35	    #[ORM\ManyToOne(targetEntity: Customer::class, inversedBy: 'PointHistories')]
    36	    private Customer $Customer;
    37	
    38	    #[ORM\JoinColumn(name: 'order_id', nullable: true, referencedColumnName: 'id', options: ['unsigned' => true, 'comment' => '注文ID'])]
    39	    #[ORM\ManyToOne(targetEntity: Order::class)]
    40	    private ?Order $Order = null;
    41	
    42	    #[ORM\JoinColumn(name: 'point_type_id', nullable: true, referencedColumnName: 'id', options: ['unsigned' => true, 'comment' => 'ポイント属性ID'])]
    43	    #[ORM\ManyToOne(targetEntity: MtbPointType::class)]
    44	    private ?MtbPointType $PointType = null;
    45	
    46	    #[ORM\Column(name: 'point_change', type: Types::INTEGER, nullable: true, options: ['default' => 0, 'comment' => 'ポイント増減量'])]
    47	    private ?int $pointChange = 0;
    48	
    49	    #[ORM\Column(name: 'note', type: Types::TEXT, nullable: true, options: ['comment' => '備考'])]
    50	    private ?string $note = null;
    51	
    52	    #[ORM\Column(name: 'issue_date', type: Types::DATETIMETZ_MUTABLE, options: ['comment' => 'ポイント発行日'])]
    53	    private ?\DateTime $issueDate = null;
    54	
    55	    #[ORM\Column(name: 'create_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '作成日'])]
    56	    private ?\DateTime $createDate = null;
    57	
    58	    #[ORM\Column(name: 'transaction_id', type: Types::INTEGER, nullable: true, options: ['unsigned' => true, 'comment' => 'スマレジ取引ID'])]
    59	    private ?int $transactionId = null;
    60	
    61	    public function getId(): int
    62	    {
    63	        return $this->id;
    64	    }
    65	
    66	    public function setId(int $id): DtbPointHistory
    67	    {
    68	        $this->id = $id;
    69	
    70	        return $this;
    71	    }
    72	
    73	    public function setPointChange(?int $pointChange): DtbPointHistory
    74	    {
    75	        $this->pointChange = $pointChange;
    76	
    77	        return $this;
    78	    }
    79	
    80	    public function getPointChange(): ?int
    81	    {
    82	        return $this->pointChange;
    83	    }
    84	
    85	    public function setNote(?string $note): DtbPointHistory
    86	    {
    87	        $this->note = $note;
    88	
    89	        return $this;
    90	    }
    91	
    92	    public function getNote(): ?string
    93	    {
    94	        return $this->note;
    95	    }
    96	
    97	    public function setIssueDate(?\DateTime $issueDate): DtbPointHistory
    98	    {
    99	        $this->issueDate = $issueDate;
   100	
   101	        return $this;
   102	    }
   103	
   104	    public function getIssueDate(): ?\DateTime
   105	    {
   106	        return $this->issueDate;
   107	    }
   108	
   109	    public function getExpireDate(int $expireDays): \DateTime
   110	    {
   111	        if ($this->issueDate === null) {
   112	            throw new \LogicException('issueDate must be set before calculating expire date.');
   113	        }
   114	
   115	        return (clone $this->issueDate)->modify(sprintf('+%d days', $expireDays));
   116	    }
   117	
   118	    public function setCreateDate(?\DateTime $createDate): DtbPointHistory
   119	    {
   120	        $this->createDate = $createDate;
   121	
   122	        return $this;
   123	    }
   124	
   125	    public function getCreateDate(): ?\DateTime
   126	    {
   127	        return $this->createDate;
   128	    }
   129	
   130	    public function setCustomer(Customer $Customer): DtbPointHistory
   131	    {
   132	        $this->Customer = $Customer;
   133	
   134	        return $this;
   135	    }
   136	
   137	    public function getCustomer(): Customer
   138	    {
   139	        return $this->Customer;
   140	    }
   141	
   142	    public function setOrder(?Order $Order): DtbPointHistory
   143	    {
   144	        $this->Order = $Order;
   145	
   146	        return $this;
   147	    }
   148	
   149	    public function getOrder(): ?Order
   150	    {
   151	        return $this->Order;
   152	    }
   153	
   154	    public function setPointType(MtbPointType $PointType): DtbPointHistory
   155	    {
   156	        $this->PointType = $PointType;
   157	
   158	        return $this;
   159	    }
   160	
   161	    public function getPointType(): MtbPointType
   162	    {
   163	        return $this->PointType;
   164	    }
   165	
   166	    public function setTransactionId(?int $transactionId): DtbPointHistory
   167	    {
   168	        $this->transactionId = $transactionId;
   169	
   170	        return $this;
   171	    }
   172	
   173	    public function getTransactionId(): ?int
   174	    {
   175	        return $this->transactionId;
   176	    }
   177	}

exec
/bin/bash -lc 'rg -n "admin_customer_point|customer/point|point_select|point_update" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /home/y-saito/Developments/ec-cube-enterprise/app 2>/dev/null' in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "rg -n \"class Customer|#\\[ORM\\\\Column\\(name: 'point'|private \\?string \\"'$point|private .*'"\\"'$point" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php' in /home/y-saito/Developments/hareruya-design-docs
 exited 2 in 0ms:
rg: regex parse error:
    (?:class Customer|#\[ORM\Column\(name: 'point'|private \?string $point|private .*$point)
                            ^^
error: unrecognized escape sequence

 succeeded in 107ms:
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php | sed -n '1,180p'" in /home/y-saito/Developments/hareruya-design-docs
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
    18	use Doctrine\Common\Collections\ArrayCollection;
    19	use Doctrine\Common\Collections\Collection;
    20	use Doctrine\DBAL\Types\Types;
    21	use Doctrine\ORM\Mapping as ORM;
    22	use Eccube\Entity\Master\MtbIdentification;
    23	use Eccube\Entity\Master\MtbIdentificationImageType;
    24	use Eccube\Entity\Master\MtbIdentityConfirmStatus;
    25	use Eccube\Repository\DtbPlayerRepository;
    26	
    27	#[ORM\Table(name: 'dtb_player')]
    28	#[ORM\HasLifecycleCallbacks]
    29	#[ORM\Entity(repositoryClass: DtbPlayerRepository::class)]
    30	#[ORM\Cache(usage: 'NONSTRICT_READ_WRITE')]
    31	class DtbPlayer extends AbstractEntity
    32	{
    33	    public const IDENTIFICATION_UNCONFIRMED = 0;
    34	    public const IDENTIFICATION_CONFIRMED = 1;
    35	
    36	    public const MAIL_REJECTION = 0;
    37	    public const MAIL_RECEIVING = 1;
    38	
    39	    // メールマガジン配信
    40	    public const bool MAIL_MAGAZINE_DISALLOW = false;
    41	    public const bool MAIL_MAGAZINE_ALLOW = true;
    42	
    43	    #[ORM\Column(name: 'id', type: Types::INTEGER, options: ['unsigned' => true, 'comment' => 'プレイヤーID'])]
    44	    #[ORM\Id]
    45	    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    46	    private int $id;
    47	
    48	    #[ORM\Column(name: 'dci_no', type: Types::STRING, length: 16, nullable: true, options: ['comment' => 'DCIナンバー'])]
    49	    private ?string $dciNo = null;
    50	
    51	    #[ORM\Column(name: 'email', type: Types::STRING, length: 255, options: ['comment' => 'Eメール'])]
    52	    private string $email;
    53	
    54	    #[ORM\Column(name: 'first_name_jp', type: Types::STRING, length: 128, nullable: true, options: ['comment' => '名前(日)'])]
    55	    private ?string $firstNameJp = null;
    56	
    57	    #[ORM\Column(name: 'first_name_en', type: Types::STRING, length: 128, nullable: true, options: ['comment' => '名前(英)'])]
    58	    private ?string $firstNameEn = null;
    59	
    60	    #[ORM\Column(name: 'last_name_jp', type: Types::STRING, length: 128, nullable: true, options: ['comment' => '名字(日)'])]
    61	    private ?string $lastNameJp = null;
    62	
    63	    #[ORM\Column(name: 'last_name_en', type: Types::STRING, length: 128, nullable: true, options: ['comment' => '名字(英)'])]
    64	    private ?string $lastNameEn = null;
    65	
    66	    #[ORM\JoinColumn(name: 'customer_id', nullable: true, referencedColumnName: 'id', options: ['unsigned' => true, 'comment' => '顧客ID'])]
    67	    #[ORM\OneToOne(targetEntity: Customer::class, inversedBy: 'Player')]
    68	    private ?Customer $Customer = null;
    69	
    70	    #[ORM\Column(name: 'update_date', type: Types::DATETIMETZ_MUTABLE, options: ['comment' => '更新日時'])]
    71	    private \DateTime $updateDate;
    72	
    73	    #[ORM\Column(name: 'create_date', type: Types::DATETIMETZ_MUTABLE, options: ['comment' => '作成日時'])]
    74	    private \DateTime $createDate;
    75	
    76	    #[ORM\Column(name: 'deleted_at', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => '削除日時'])]
    77	    private ?\DateTime $deletedAt = null;
    78	
    79	    #[ORM\Column(name: 'identification_flg', type: Types::BOOLEAN, nullable: true, options: ['default' => 0, 'comment' => '本人確認フラグ'])]
    80	    private ?bool $identificationFlg = false;
    81	
    82	    #[ORM\JoinColumn(name: 'customer_group_id', nullable: false, referencedColumnName: 'id', options: ['default' => 1, 'unsigned' => true, 'comment' => '顧客グループID'])]
    83	    #[ORM\ManyToOne(targetEntity: DtbCustomerGroup::class, inversedBy: 'Players')]
    84	    private DtbCustomerGroup $CustomerGroup;
    85	
    86	    #[ORM\Column(name: 'mail_magazine_flg', type: Types::BOOLEAN, options: ['default' => 0, 'comment' => 'メールマガジン配信フラグ'])]
    87	    private bool $mailMagazineFlg = false;
    88	
    89	    #[ORM\Column(name: 'point', type: Types::INTEGER, options: ['default' => 0, 'comment' => 'ポイント残高'])]
    90	    private int $point = 0;
    91	
    92	    #[ORM\Column(name: 'smaregi_id', type: Types::STRING, length: 16, nullable: true, options: ['comment' => 'スマレジID'])]
    93	    private ?string $smaregiId = null;
    94	
    95	    #[ORM\Column(name: 'point_contact_number', type: Types::STRING, length: 16, nullable: true, options: ['comment' => 'ポイント問い合わせ番号'])]
    96	    private ?string $pointContactNumber = null;
    97	
    98	    #[ORM\Column(name: 'point_transfer_flg', type: Types::BOOLEAN, options: ['default' => 0, 'comment' => 'ポイント移行完了フラグ'])]
    99	    private bool $pointTransferFlg = false;
   100	
   101	    #[ORM\Column(name: 'point_linked_failure_count', type: Types::SMALLINT, options: ['default' => 0, 'unsigned' => true, 'comment' => 'ポイント連携失敗回数'])]
   102	    private int $pointLinkedFailureCount = 0;
   103	
   104	    #[ORM\Column(name: 'exists_smaregi_flg', type: Types::BOOLEAN, options: ['default' => 0, 'comment' => 'スマレジ会員存在フラグ'])]
   105	    private bool $existsSmaregiFlg = false;
   106	
   107	    #[ORM\JoinColumn(name: 'identity_confirm_status_id', nullable: false, referencedColumnName: 'id', options: ['default' => 1, 'unsigned' => true, 'comment' => '本人確認ステータスID'])]
   108	    #[ORM\ManyToOne(targetEntity: MtbIdentityConfirmStatus::class, inversedBy: 'Players')]
   109	    private MtbIdentityConfirmStatus $IdentityConfirmStatus;
   110	
   111	    #[ORM\Column(name: 'nickname', type: Types::STRING, length: 255, nullable: true, options: ['comment' => 'ニックネーム'])]
   112	    private ?string $nickname = null;
   113	
   114	    #[ORM\Column(name: 'deck_user_id', type: Types::STRING, length: 8, nullable: true, options: ['comment' => 'デッキユーザーID'])]
   115	    private ?string $deckUserId = null;
   116	
   117	    #[ORM\Column(name: 'profile', type: Types::STRING, length: 255, nullable: true, options: ['comment' => 'プロフィール'])]
   118	    private ?string $profile = null;
   119	
   120	    #[ORM\Column(name: 'id_expiration_date', type: Types::DATE_MUTABLE, nullable: true, options: ['comment' => '身分証有効期限'])]
   121	    private ?\DateTime $idExpirationDate = null;
   122	
   123	    /**
   124	     * @var Collection<int, DtbEntryPlayer>
   125	     */
   126	    #[ORM\OneToMany(targetEntity: DtbEntryPlayer::class, mappedBy: 'Player')]
   127	    private Collection $EntryPlayers;
   128	
   129	    /**
   130	     * @var Collection<int, DtbIdentificationImage>
   131	     */
   132	    #[ORM\OneToMany(targetEntity: DtbIdentificationImage::class, mappedBy: 'Player')]
   133	    private Collection $IdentificationImages;
   134	
   135	    #[ORM\JoinColumn(name: 'identification_id', nullable: true, referencedColumnName: 'id', options: ['unsigned' => true, 'comment' => '身分証種別ID'])]
   136	    #[ORM\ManyToOne(targetEntity: MtbIdentification::class)]
   137	    private ?MtbIdentification $Identification = null;
   138	
   139	    /**
   140	     * @var Collection<int, DtbProductRequest>
   141	     */
   142	    #[ORM\OneToMany(targetEntity: DtbProductRequest::class, mappedBy: 'Player')]
   143	    private Collection $ProductRequests;
   144	
   145	    public function __construct()
   146	    {
   147	        $this->ProductRequests = new ArrayCollection();
   148	        $this->EntryPlayers = new ArrayCollection();
   149	        $this->IdentificationImages = new ArrayCollection();
   150	    }
   151	
   152	    public function getId(): int
   153	    {
   154	        return $this->id;
   155	    }
   156	
   157	    public function setDciNo(?string $dciNo): DtbPlayer
   158	    {
   159	        $this->dciNo = $dciNo;
   160	
   161	        return $this;
   162	    }
   163	
   164	    public function getDciNo(): ?string
   165	    {
   166	        return $this->dciNo;
   167	    }
   168	
   169	    public function setEmail(string $email): DtbPlayer
   170	    {
   171	        $this->email = $email;
   172	
   173	        return $this;
   174	    }
   175	
   176	    public function getEmail(): string
   177	    {
   178	        return $this->email;
   179	    }
   180	

exec
/bin/bash -lc "rg -n \"point'|point\\)|\\"'$point|addPoint|getPoint|setPoint" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php' in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:138:        #[ORM\Column(name: 'point', type: Types::DECIMAL, precision: 12, scale: 0, options: ['unsigned' => false, 'default' => 0])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:882:        public function setPoint(?string $point): Customer
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:892:        public function getPoint(): ?string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:1334:        public function addPointHistory(DtbPointHistory $PointHistory): Customer
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php:1344:        public function getPointHistories(): Collection
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:89:    #[ORM\Column(name: 'point', type: Types::INTEGER, options: ['default' => 0, 'comment' => 'ポイント残高'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:313:    public function setPointContactNumber(?string $pointContactNumber): DtbPlayer
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:320:    public function getPointContactNumber(): ?string
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:325:    public function setPointTransferFlg(bool $pointTransferFlg): DtbPlayer
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:332:    public function getPointTransferFlg(): bool
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:337:    public function setPointLinkedFailureCount(int $pointLinkedFailureCount): DtbPlayer
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:344:    public function getPointLinkedFailureCount(): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:490:    public function setPoint(int $point): DtbPlayer
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:497:    public function getPoint(): int
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php:502:    public function addPoint(int $point): DtbPlayer

exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig | sed -n '1028,1048p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
  1028	                                <i class="fa fa-backward" aria-hidden="true"></i>
  1029	                                <span>{{ 'admin.customer.customer_list'|trans }}</span>
  1030	                            </a>
  1031	                        </div>
  1032	                    </div>
  1033	                    <div class="col-11">
  1034	                        <div id="ex-conversion-action" class="row align-items-center justify-content-end">
  1035	                            {% if Customer.id %}
  1036	                                <div class="col-auto">
  1037	                                    <a class="btn btn-ec-conversion px-5"
  1038	                                       href="{{ url('admin_customer_point_select', { 'id': Customer.id}) }}">{{ 'admin.customer.point_type_select'|trans }}
  1039	                                    </a>
  1040	                                </div>
  1041	                                <div class="col-auto">
  1042	                                    <a class="btn btn-ec-conversion px-5"
  1043	                                       href="{{ url('admin_customer_point_history', { 'id': Customer.id, 'type': constant('Eccube\\Entity\\Master\\MtbPointType::HISTORY') }) }}">{{ 'admin.customer.point_history'|trans }}
  1044	                                    </a>
  1045	                                </div>
  1046	                                <div class="col-auto">
  1047	                                    <a class="btn btn-ec-conversion px-5"
  1048	                                       href="{{ url('admin_customer_mail_history', { 'id': Customer.id}) }}">{{ 'admin.customer.send_history'|trans }}

codex
関連ルートはこのコントローラと3つのTwig参照に限定されており、別名ルートで設計名を満たす実装は見つかりませんでした。最後にPlayerの加算メソッドと権限/CSRFの実装前提だけ確認します。
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbPlayer.php | sed -n '480,510p'" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 0ms:
   480	        $this->Identification = $Identification;
   481	
   482	        return $this;
   483	    }
   484	
   485	    public function getIdentification(): ?MtbIdentification
   486	    {
   487	        return $this->Identification;
   488	    }
   489	
   490	    public function setPoint(int $point): DtbPlayer
   491	    {
   492	        $this->point = $point;
   493	
   494	        return $this;
   495	    }
   496	
   497	    public function getPoint(): int
   498	    {
   499	        return $this->point;
   500	    }
   501	
   502	    public function addPoint(int $point): DtbPlayer
   503	    {
   504	        $this->point = $this->point + $point;
   505	
   506	        return $this;
   507	    }
   508	
   509	    /**
   510	     * @param Collection<int, DtbProductRequest> $ProductRequests

exec
/bin/bash -lc 'rg -n "admin_customer_point_select|admin_customer_point_type_select|admin_customer_point_history|admin_customer_point_update" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube /home/y-saito/Developments/ec-cube-enterprise/app 2>/dev/null' in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Customer.php | sed -n '130,142p'" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "rg -n \"csrf|CSRF|invalid csrf|form\\.type_extension|_token|Admin.*Controller|AccessDenied|ROLE_ADMIN|security\" /home/y-saito/Developments/ec-cube-enterprise/app/config/eccube /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin | head -120" in /home/y-saito/Developments/hareruya-design-docs
 succeeded in 112ms:
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

 succeeded in 180ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:41:    #[Route('/%eccube_admin_route%/customer/point/{id}/select', name: 'admin_customer_point_select', requirements: ['id' => '\d+'], methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:53:    #[Route('/%eccube_admin_route%/customer/point/{id}/{type}', name: 'admin_customer_point_history', requirements: ['id' => '\d+', 'type' => 'history|granted|purchase'], methods: ['GET'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:54:    #[Route('/%eccube_admin_route%/customer/point/{id}/{type}', name: 'admin_customer_point_update', requirements: ['id' => '\d+', 'type' => 'granted|purchase'], methods: ['POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:74:                return $this->redirectToRoute('admin_customer_point_history', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:102:            return $this->redirectToRoute('admin_customer_point_history', [
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:18:                              action="{{ url('admin_customer_point_update', { id : Customer.id, type: type }) }}"
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_select.twig:14:                            <a class="point-type-select" href="{{ url('admin_customer_point_history', { 'id': Customer.id, 'type': constant('Eccube\\Entity\\Master\\MtbPointType::GRANTED') }) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_select.twig:23:                            <a class="point-type-select" href="{{ url('admin_customer_point_history', { 'id': Customer.id, 'type': constant('Eccube\\Entity\\Master\\MtbPointType::PURCHASE') }) }}">
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig:1038:                                       href="{{ url('admin_customer_point_select', { 'id': Customer.id}) }}">{{ 'admin.customer.point_type_select'|trans }}
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig:1043:                                       href="{{ url('admin_customer_point_history', { 'id': Customer.id, 'type': constant('Eccube\\Entity\\Master\\MtbPointType::HISTORY') }) }}">{{ 'admin.customer.point_history'|trans }}

 succeeded in 209ms:
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:20:use Eccube\Controller\Admin\SearchControllerTrait;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:58:use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:95:        protected CsrfTokenManagerInterface $csrfTokenManager,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:426:                throw new AccessDeniedHttpException();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:721:        if (!$this->isCsrfTokenValid('purchase_register_individual_stock', $request->request->get('_token'))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:722:            $this->addError('admin.common.csrf_token_error', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseHistoryController.php:21:use Eccube\Controller\Admin\SearchControllerTrait;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseHistoryController.php:50:        protected CsrfTokenManagerInterface $csrfTokenManager,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:50:class AdminController extends AbstractController
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:58:     * AdminController constructor.
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/AdminController.php:71:        if ($this->authorizationChecker->isGranted('ROLE_ADMIN')) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckCsvController.php:18:use Eccube\Controller\Admin\AbstractCsvImportController;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/SearchProductBlockType.php:75:            'csrf_protection' => false,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:20:use Eccube\Controller\Admin\SearchControllerTrait;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:56:        protected readonly CsrfTokenManagerInterface $csrfTokenManager,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:142:        $token = $request->request->get('_token');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:144:            $this->addError('admin.common.csrf_invalid', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:188:        $token = $request->request->get('_token');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:192:            $this->addError('admin.common.csrf_invalid', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:347:        $token = $request->request->get('_token');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:349:            $this->addError('admin.common.csrf_invalid', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:382:        if (!$this->isCsrfTokenValid('admin_deck_copy', $request->request->get('_token'))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:383:            $this->addError('admin.common.csrf_invalid', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:680:        $token = $request->request->get('_token');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Deck/DeckController.php:682:            $this->addError('admin.common.csrf_invalid', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryController.php:74:        private readonly CsrfTokenManagerInterface $csrfTokenManager,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryController.php:468:        if (!$this->csrfTokenManager->isTokenValid($token)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/EntryController.php:469:            return new JsonResponse(['message' => trans('admin.common.csrf_invalid')], Response::HTTP_FORBIDDEN);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/SearchFavoriteType.php:73:            'csrf_protection' => false,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockListController.php:38:use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockListController.php:66:        protected CsrfTokenManagerInterface $csrfTokenManager,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockListController.php:71:     * セッション/パターン復元時に古い _token を現在の有効トークンで置き換える。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockListController.php:79:        $viewData['_token'] = $this->csrfTokenManager
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockListController.php:80:            ->getToken(SearchStockListType::CSRF_TOKEN_ID)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockListController.php:315:            $this->addError('admin.common.csrf_invalid', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockListController.php:338:        unset($dataToStore['_token']); // トークンは保存しない
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockListController.php:361:        $tokenValue = $formData['_token'] ?? null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockListController.php:363:        if (!$this->isCsrfTokenValid(SearchStockListType::CSRF_TOKEN_ID, is_string($tokenValue) ? $tokenValue : '')) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockListController.php:439:        if (!$this->isCsrfTokenValid(SearchStockListType::CSRF_TOKEN_ID, is_string($submitted) ? $submitted : '')) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockListController.php:440:            throw new AccessDeniedHttpException('CSRF token is invalid.');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/SearchProductType.php:130:            'csrf_protection' => false,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:622:            $this->addError('admin.common.csrf_invalid', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/BannerController.php:119:     * S3 上のバナー画像を削除する（CSRF 検証後）。
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerController.php:23:use Eccube\Controller\Admin\SearchControllerTrait;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerController.php:60:    public function __construct(protected PageMaxRepository $pageMaxRepository, protected CustomerRepository $customerRepository, protected SexRepository $sexRepository, protected PrefRepository $prefRepository, protected MailService $mailService, protected CsvExportService $csvExportService, protected DtbSearchPatternRepository $dtbSearchPatternRepository, protected CsrfTokenManagerInterface $csrfTokenManager)
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerEditController.php:40:use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerEditController.php:306:        $AccessDeniedAuthorityRole = $this->authorityRoleRepository->findOneBy([
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerEditController.php:311:        if (!empty($AccessDeniedAuthorityRole)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerEditController.php:312:            throw new AccessDeniedHttpException();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/TwoFactorAuthController.php:59:                    if ($this->twoFactorAuthService->verifyCode($Member->getTwoFactorAuthKey(), $form->get('device_token')->getData())) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/TwoFactorAuthController.php:140:            $device_token = $form->get('device_token')->getData();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/TwoFactorAuthController.php:142:                if ($this->twoFactorAuthService->verifyCode($auth_key, $device_token)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/InventoryPlanController.php:20:use Eccube\Controller\Admin\SearchControllerTrait;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/InventoryPlanController.php:104:        protected CsrfTokenManagerInterface $csrfTokenManager,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardController.php:21:use Eccube\Controller\Admin\SearchControllerTrait;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardController.php:46:        protected readonly CsrfTokenManagerInterface $csrfTokenManager,
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardController.php:163:        $tokenValue = $request->request->get('_token');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardController.php:165:        if (!$this->csrfTokenManager->isTokenValid($token)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Card/CardController.php:168:                'message' => trans('admin.common.csrf_invalid'),
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/SecurityController.php:38:    #[Route(path: '/%eccube_admin_route%/setting/system/security', name: 'admin_setting_system_security', methods: ['GET', 'POST'])]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/SecurityController.php:39:    #[Template(template: '@admin/Setting/System/security.twig')]
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/SecurityController.php:51:                return $this->redirectToRoute('admin_setting_system_security');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/SecurityController.php:92:                $this->addSuccess('admin.setting.system.security.admin_url_changed', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/SecurityController.php:109:            return $this->redirectToRoute('admin_setting_system_security');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/SecurityController.php:115:            $this->addWarning('admin.setting.system.security.admin_url_warning', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Setting/System/SecurityController.php:120:            $this->addWarning('admin.setting.system.security.not_found_env_file', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:146:        if (!$this->isCsrfTokenValid('stock_join_register', (string) $request->request->get('_token'))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:147:            $this->addError('admin.common.csrf_invalid', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:159:        $form = $this->formFactory->createBuilder(StockJoinNewType::class, null, ['ProductStock' => $ProductStock, 'csrf_protection' => false])->getForm();
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:201:            if (!$this->isCsrfTokenValid('authenticate', (string) $request->request->get('_token'))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:202:                $this->addError('admin.common.csrf_invalid', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:356:        if (!$this->isCsrfTokenValid('stock_join_add_source', (string) $request->request->get('_token'))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:357:            $this->addError('admin.common.csrf_invalid', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:423:        if (!$this->isCsrfTokenValid('authenticate', (string) $request->request->get('_token'))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:424:            $this->addError('admin.common.csrf_invalid', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:465:        if (!$this->isCsrfTokenValid('authenticate', (string) $request->request->get('_token'))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:466:            $this->addError('admin.common.csrf_invalid', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:534:        if (!$this->isCsrfTokenValid('authenticate', (string) $request->request->get('_token'))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:535:            $this->addError('admin.common.csrf_invalid', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:618:        if (!$this->isCsrfTokenValid('authenticate', (string) $request->request->get('_token'))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:619:            return new JsonResponse(['ok' => false, 'message' => $this->translator->trans('admin.common.csrf_invalid')]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:653:        if (!$this->isCsrfTokenValid('authenticate', (string) $request->request->get('_token'))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:654:            return new JsonResponse(['ok' => false, 'message' => $this->translator->trans('admin.common.csrf_invalid')]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:708:        if (!$this->isCsrfTokenValid('authenticate', (string) $request->request->get('_token'))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:709:            return new JsonResponse(['ok' => false, 'message' => $this->translator->trans('admin.common.csrf_invalid')]);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:754:        if (!$this->isCsrfTokenValid('authenticate', (string) $request->request->get('_token'))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:755:            $this->addError('admin.common.csrf_invalid', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:863:        if (!$this->isCsrfTokenValid('stock_join_new_source_csv', (string) $request->request->get('_token'))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:864:            return new JsonResponse(['ok' => false, 'errors' => ['CSRFトークンが無効です。']], Response::HTTP_FORBIDDEN);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:909:        if (!$this->isCsrfTokenValid('stock_join_edit_source_csv', (string) $request->request->get('_token'))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:910:            return new JsonResponse(['ok' => false, 'errors' => ['CSRFトークンが無効です。']], Response::HTTP_FORBIDDEN);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:976:        if (!$this->isCsrfTokenValid('stock_join_shortage_csv', (string) $request->request->get('_token'))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:977:            return new JsonResponse(['ok' => false, 'errors' => [trans('admin.common.csrf_invalid')]], Response::HTTP_FORBIDDEN);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:1054:        if (!$this->isCsrfTokenValid('authenticate', (string) $request->request->get('_token'))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:1055:            return $this->json(['ok' => false, 'message' => $this->translator->trans('admin.common.csrf_invalid')], Response::HTTP_FORBIDDEN);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:1092:        if (!$this->isCsrfTokenValid('authenticate', (string) $request->request->get('_token'))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:1093:            return $this->json(['ok' => false, 'message' => $this->translator->trans('admin.common.csrf_invalid')], Response::HTTP_FORBIDDEN);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:1130:        if (!$this->isCsrfTokenValid('authenticate', (string) $request->request->get('_token'))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:1131:            return $this->json(['ok' => false, 'message' => $this->translator->trans('admin.common.csrf_invalid')], Response::HTTP_FORBIDDEN);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockJoinController.php:1207:        } catch (\Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/SearchControllerTrait.php:283:        $tokenValue = $formData['_token'] ?? null;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/SearchControllerTrait.php:284:        if (!$this->csrfTokenManager->isTokenValid(new CsrfToken($this->intention, $tokenValue))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/SearchControllerTrait.php:410:            if (in_array($propertyName, ['multi', '_token', 'sort', 'order'], true)) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:226:        $token = isset($csvBag['_token']) ? (string) $csvBag['_token'] : '';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:228:            $this->addError('admin.common.csrf_invalid', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:318:        $token = isset($csvBag['_token']) ? (string) $csvBag['_token'] : '';
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:320:            $this->addError('admin.common.csrf_invalid', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveController.php:69:use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveController.php:444:        } catch (AccessDeniedHttpException) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveController.php:487:        if (!$this->isCsrfTokenValid('stock_move_shortage_csv', (string) $request->request->get('_token'))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveController.php:488:            return new JsonResponse(['success' => false, 'errors' => [trans('admin.common.csrf_invalid')]], Response::HTTP_FORBIDDEN);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveController.php:740:        if (!$this->isCsrfTokenValid('stock_move_add_differential_product', (string) $request->request->get('_token'))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveController.php:776:        if (!$this->isCsrfTokenValid('stock_move_differential_csv', (string) $request->request->get('_token'))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveController.php:777:            return new JsonResponse(['success' => false, 'errors' => [trans('admin.common.csrf_invalid')]], Response::HTTP_FORBIDDEN);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockMoveController.php:1073:        } catch (AccessDeniedHttpException) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:86:            if (!$this->isCsrfTokenValid('branch_toppage_management', (string) ($formData['_token'] ?? ''))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/BranchTopPageController.php:87:                $this->addError('admin.common.csrf_invalid', 'admin');
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitController.php:107:        if (!$this->isCsrfTokenValid('authenticate', (string) $request->request->get('_token'))) {
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitController.php:108:            return $this->json(['ok' => false, 'message' => $this->translator->trans('admin.common.csrf_invalid')], Response::HTTP_FORBIDDEN);
/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock/StockSplitController.php:147:        if (!$this->isCsrfTokenValid('stock_split_register', (string) $request->request->get('_token'))) {

exec
/bin/bash -lc "find /home/y-saito/Developments/ec-cube-enterprise -path '*mtb_point_type*' -type f -maxdepth 6 2>/dev/null | sort" in /home/y-saito/Developments/hareruya-design-docs
exec
/bin/bash -lc "nl -ba /home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125163806.php | sed -n '1,80p'" in /home/y-saito/Developments/hareruya-design-docs
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
    16	namespace DoctrineMigrations;
    17	
    18	use Doctrine\DBAL\Schema\Schema;
    19	use Doctrine\Migrations\AbstractMigration;
    20	
    21	/**
    22	 * Auto-generated Migration: Import from CSV for mtb_point_type
    23	 */
    24	final class Version20251125163806 extends AbstractMigration
    25	{
    26	    #[\Override]
    27	    public function getDescription(): string
    28	    {
    29	        return 'mtb_point_type のマスタデータを登録';
    30	    }
    31	
    32	    #[\Override]
    33	    public function up(Schema $schema): void
    34	    {
    35	        $records = $this->getRecords();
    36	
    37	        foreach ($records as $record) {
    38	            $recordCount = $this->connection->fetchOne('SELECT COUNT(id) FROM mtb_point_type WHERE id = ?', [$record['id']]);
    39	
    40	            if ($recordCount > 0) {
    41	                continue;
    42	            }
    43	
    44	            $this->addSql('INSERT INTO mtb_point_type (id, name) VALUES (?, ?)', [$record['id'], $record['name']]);
    45	        }
    46	
    47	        // シーケンスを最大ID+1に更新
    48	        $this->addSql("SELECT setval('mtb_point_type_id_seq', COALESCE((SELECT MAX(id) FROM mtb_point_type), 0) + 1, false)");
    49	    }
    50	
    51	    #[\Override]
    52	    public function down(Schema $schema): void
    53	    {
    54	        // マスタデータのため、ロールバック時は何もしない
    55	    }
    56	
    57	    /**
    58	     * @return array<int, array<string, mixed>>
    59	     */
    60	    private function getRecords(): array
    61	    {
    62	        return [
    63	            [
    64	                'id' => 1,
    65	                'name' => '付与型',
    66	            ],
    67	            [
    68	                'id' => 2,
    69	                'name' => '購入型',
    70	            ],
    71	        ];
    72	    }
    73	}

 succeeded in 454ms:
codex
WEAK_EVIDENCE | ③バリデーション | 備考の「自由入力不可」は根拠が弱い。設計は「備考 任意」「最大長 実装確認値」としているが、自由入力でなければならないとは明記していない。ただし「任意」に対して実装が `required=true` + `NotBlank` なのは有効な差分。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/admin_customer_point.html:250`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:85`, `:87`, `:91` | finding文言を「自由入力不可」ではなく「必須化・固定選択肢化」と分け、自由入力要件は確認不能にする。

WEAK_EVIDENCE | ⑧バッチ/API入出力・再実行性 | スマレジ連携の差分は根拠がやや弱い。設計の該当行は「本書では仕様確定せず、実装または別機能の設計を正とする」「スマレジポイント連携はポイント連携バッチを正」としており、単純な禁止仕様とは読めない。一方で実装がスマレジ連携ジョブを登録・dispatchしている事実は確認できる。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/admin_customer_point.html:223`, `:224`, `:257`, `:260`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:91`, `:92`, `:96` | 「設計違反」断定ではなく「本書対象外処理が混在。別仕様で正当化されるか確認不能」とする。

FALSE_POSITIVE | ①ルート/HTTPメソッド | 「種別マスタ由来の可変種別ではなくハードコード限定」は誤検知寄り。設計は「ポイント種別はポイント種別マスタを参照」とだけ書いており、任意追加マスタをURLで可変対応する要件は確認できない。実装マスタも付与型・購入型の2件で、実装の `granted|purchase` 固定と直ちに矛盾とは言えない。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/admin_customer_point.html:229`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:53`, `:54`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbPointType.php:28`, `:31`, `/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125163806.php:62` | findingは削除、または「マスタをリポジトリから動的取得していない」程度に弱める。

SEVERITY | ①ルート/HTTPメソッド | POSTパスの `/update/` セグメント欠落は設計との差分として有効だが、実装内のルート名とフォームactionは整合しており、画面操作上の即時障害とは限らない。`med` はやや高い可能性がある。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/admin_customer_point.html:235`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:54`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:18` | 外部URL契約を重視するならmed維持、管理画面内遷移のみならlowへ下げる。

MISSED | ④DBカラム・DB操作・テーブル | 候補は履歴の種別フィルタ欠如を指摘しているが、「履歴画面への直リンク」が全履歴表示になっている点を別差分として落としている。設計は「ポイント種別ごとに履歴を確認」とするが、会員編集画面の「ポイント履歴」は `type=history` で全履歴を開く。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/admin_customer_point.html:212`, `:248`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig:1042`, `:1043`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:53`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:123` | 「type=history による全履歴表示が設計の種別別履歴と衝突」を追加する。

VERDICT: false_positive=1, missed=1, weak_evidence=2, 総合=要修正
tokens used
63,739
WEAK_EVIDENCE | ③バリデーション | 備考の「自由入力不可」は根拠が弱い。設計は「備考 任意」「最大長 実装確認値」としているが、自由入力でなければならないとは明記していない。ただし「任意」に対して実装が `required=true` + `NotBlank` なのは有効な差分。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/admin_customer_point.html:250`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerPointType.php:85`, `:87`, `:91` | finding文言を「自由入力不可」ではなく「必須化・固定選択肢化」と分け、自由入力要件は確認不能にする。

WEAK_EVIDENCE | ⑧バッチ/API入出力・再実行性 | スマレジ連携の差分は根拠がやや弱い。設計の該当行は「本書では仕様確定せず、実装または別機能の設計を正とする」「スマレジポイント連携はポイント連携バッチを正」としており、単純な禁止仕様とは読めない。一方で実装がスマレジ連携ジョブを登録・dispatchしている事実は確認できる。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/admin_customer_point.html:223`, `:224`, `:257`, `:260`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:91`, `:92`, `:96` | 「設計違反」断定ではなく「本書対象外処理が混在。別仕様で正当化されるか確認不能」とする。

FALSE_POSITIVE | ①ルート/HTTPメソッド | 「種別マスタ由来の可変種別ではなくハードコード限定」は誤検知寄り。設計は「ポイント種別はポイント種別マスタを参照」とだけ書いており、任意追加マスタをURLで可変対応する要件は確認できない。実装マスタも付与型・購入型の2件で、実装の `granted|purchase` 固定と直ちに矛盾とは言えない。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/admin_customer_point.html:229`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:53`, `:54`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbPointType.php:28`, `:31`, `/home/y-saito/Developments/ec-cube-enterprise/app/DoctrineMigrations/Version20251125163806.php:62` | findingは削除、または「マスタをリポジトリから動的取得していない」程度に弱める。

SEVERITY | ①ルート/HTTPメソッド | POSTパスの `/update/` セグメント欠落は設計との差分として有効だが、実装内のルート名とフォームactionは整合しており、画面操作上の即時障害とは限らない。`med` はやや高い可能性がある。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/admin_customer_point.html:235`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:54`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:18` | 外部URL契約を重視するならmed維持、管理画面内遷移のみならlowへ下げる。

MISSED | ④DBカラム・DB操作・テーブル | 候補は履歴の種別フィルタ欠如を指摘しているが、「履歴画面への直リンク」が全履歴表示になっている点を別差分として落としている。設計は「ポイント種別ごとに履歴を確認」とするが、会員編集画面の「ポイント履歴」は `type=history` で全履歴を開く。 | 設計: `/home/y-saito/Developments/hareruya-design-docs/function_spec_html_preview/pf-eccube3/admin_customer_point.html:212`, `:248`; 実装: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig:1042`, `:1043`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerPointController.php:53`, `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/point_update.twig:123` | 「type=history による全履歴表示が設計の種別別履歴と衝突」を追加する。

VERDICT: false_positive=1, missed=1, weak_evidence=2, 総合=要修正

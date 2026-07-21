# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-03_0306_sheet-5_sheet.json#f06-03_0306_sheet-5_sheet-conformance-eee0826d789c`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-03_0306_sheet-5_sheet.json`
- sourceFindingId: `f06-03_0306_sheet-5_sheet-conformance-eee0826d789c`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-03_0306_sheet-5_sheet` / F06-03 ログイン
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: ログイン試行制限中(制限日時が現在より後)は、会員ログイン画面でメール・パスワード等の入力欄を表示せず、制限メッセージのみを入力欄に代えて表示する。
- implementationActual: login.twig は制限状態に関わらず常にメール欄(L49)・パスワード欄(L60)・ログインボタン(L86)を描画し、認証エラー時(L77-83)に data-error-code="too-many-login-attempts" 付きエラーボックスを追加表示するのみ。制限中に入力欄を隠す分岐は無く、GET表示時に制限日時を評価して入力欄を抑止する処理も MypageController::login に無い。data-error-code を消費するのは Bloc…
- mismatchReason: 設計は『制限中は入力欄非表示・制限メッセージのみ』を複数節で一貫要求。実装Twigは入力欄を常時表示し、当ログインページに入力欄抑止のロジック(Controller/Twig/JS)が存在しない。
- designRefDetail: excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-5 (フロント挙動『CSS・レイアウト/入力項目』・処理フロー・エラー警告『フォーム位置に入力欄に代えて表示/制限中は入力欄を表示しない』・権限認可／sheet5抽出 L94,95,106,113,141)
- implRef: src/Eccube/Resource/template/default/Mypage/login.twig:46-96, src/Eccube/Controller/Front/Mypage/MypageController.php:85-116

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-03_0306_sheet-5_sheet-conformance-eee0826d789c",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-5",
  "designRefDetail": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-5 (フロント挙動『CSS・レイアウト/入力項目』・処理フロー・エラー警告『フォーム位置に入力欄に代えて表示/制限中は入力欄を表示しない』・権限認可／sheet5抽出 L94,95,106,113,141)",
  "designExpectation": "ログイン試行制限中(制限日時が現在より後)は、会員ログイン画面でメール・パスワード等の入力欄を表示せず、制限メッセージのみを入力欄に代えて表示する。",
  "designQuote": "ログイン試行制限中(制限日時が現在より後)は、会員ログイン画面でメール・パスワード等の入力欄を表示せず、制限メッセージのみを入力欄に代えて表示する。",
  "implRef": "src/Eccube/Resource/template/default/Mypage/login.twig:46-96, src/Eccube/Controller/Front/Mypage/MypageController.php:85-116",
  "implementationActual": "login.twig は制限状態に関わらず常にメール欄(L49)・パスワード欄(L60)・ログインボタン(L86)を描画し、認証エラー時(L77-83)に data-error-code=\"too-many-login-attempts\" 付きエラーボックスを追加表示するのみ。制限中に入力欄を隠す分岐は無く、GET表示時に制限日時を評価して入力欄を抑止する処理も MypageController::login に無い。data-error-code を消費するのは Block/js/product_js.twig(L354,407)のモーダル用途のみ。",
  "difference": "設計は『制限中は入力欄非表示・制限メッセージのみ』を複数節で一貫要求。実装Twigは入力欄を常時表示し、当ログインページに入力欄抑止のロジック(Controller/Twig/JS)が存在しない。",
  "mismatchReason": "設計は『制限中は入力欄非表示・制限メッセージのみ』を複数節で一貫要求。実装Twigは入力欄を常時表示し、当ログインページに入力欄抑止のロジック(Controller/Twig/JS)が存在しない。",
  "comparisonRows": [
    {
      "item": "制限中の入力欄",
      "design": "非表示(入力欄を出さない)",
      "implementation": "常時表示(メール/パスワード/ボタン)",
      "mismatch": "表示有無が逆"
    },
    {
      "item": "制限中の表示内容",
      "design": "入力欄に代えて制限メッセージのみ",
      "implementation": "入力欄に加えてエラーボックスを追加表示",
      "mismatch": "代替表示になっていない"
    },
    {
      "item": "GET時の制限日時評価",
      "design": "制限日時が現在より後なら入力欄抑止",
      "implementation": "MypageController::login に評価処理なし",
      "mismatch": "未実装"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-03_0306_sheet-5_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Resource/template/default/Mypage/login.twig:46-96, src/Eccube/Controller/Front/Mypage/MypageController.php:85-116",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「ログイン試行制限中(制限日時が現在より後)は、会員ログイン画面でメール・パスワード等の入力欄を表示せず、制限メッセージのみを入力欄に代えて表示する。」。実装は「login.twig は制限状態に関わらず常にメール欄(L49)・パスワード欄(L60)・ログインボタン(L86)を描画し、認証エラー時(L77-83)に data-error-code=\"too-many-login-attempts\" 付きエラーボックスを追加表示するのみ。制限中に入力欄を隠す分岐は無く、GET表示時に制限日時を評価して入力欄を抑止する処理も MypageController::login に無い。data-error-code を消費するのは Block/js/product_js.twig…」。乖離理由は「設計は『制限中は入力欄非表示・制限メッセージのみ』を複数節で一貫要求。実装Twigは入力欄を常時表示し、当ログインページに入力欄抑止のロジック(Controller/Twig/JS)が存在しない。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "業務ロジック・外部連携未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "ルート・Controller",
    "Form・入力項目",
    "Twig・画面表示",
    "権限・セッション・副作用・エラー・ログ"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:1885\n1882:       </section>\n1883:       <!-- function-design-embed:end f06-02-f06-02_front_member_entry_activate -->\n1884: </section>\n1885:       <section class=\"sheet-panel\" id=\"sheet-5\">\n1886:         <div class=\"sheet-heading\">\n1887:           <h2>ログイン</h2>\n1888:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Mypage/login.twig:46-96",
    "src/Eccube/Controller/Front/Mypage/MypageController.php:85-116",
    "src/Eccube/Resource/template/default/Mypage/login.twig",
    "src/Eccube/Controller/Front/Mypage/MypageController.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Mypage/login.twig:46\n43:                                     {% for targetPath in app.session.flashBag.peek('eccube.login.target.path') %}\n44:                                         <input type=\"hidden\" name=\"_target_path\" value=\"{{ targetPath }}\">\n45:                                     {% endfor %}\n46:                                 {% endif %}\n47:                                 <input type=\"hidden\" name=\"_failure_path\" value=\"{{ login_failure_path|default(path('mypage_login')) }}\">\n48: \n49:                                 <div class=\"p-hareruya-login__form-fields\">",
    "src/Eccube/Controller/Front/Mypage/MypageController.php:85\n82:     #[Route(path: '/mypage/login', name: 'mypage_login', methods: ['GET', 'POST'])]\n83:     #[Template(template: 'Mypage/login.twig')]\n84:     public function login(Request $request, AuthenticationUtils $utils): RedirectResponse|array\n85:     {\n86:         if ($this->isGranted('IS_AUTHENTICATED_FULLY')) {\n87:             log_info('認証済のためログイン処理をスキップ');\n88: ",
    "src/Eccube/Resource/template/default/Mypage/login.twig:1\n1: {#\n2: This file is part of EC-CUBE\n3: \n4: Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved."
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

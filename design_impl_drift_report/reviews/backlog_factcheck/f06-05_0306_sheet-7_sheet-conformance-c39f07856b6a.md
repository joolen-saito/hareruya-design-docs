# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-05_0306_sheet-7_sheet.json#f06-05_0306_sheet-7_sheet-conformance-c39f07856b6a`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-05_0306_sheet-7_sheet.json`
- sourceFindingId: `f06-05_0306_sheet-7_sheet-conformance-c39f07856b6a`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-05_0306_sheet-7_sheet` / F06-05 マイページ
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: マイページトップ表示時、直前に商品検索からの戻り先がセッションにある場合は、マイページを表示せずその検索画面へリダイレクトし、戻り先をセッションから消去する（現行踏襲）。
- implementationActual: index() は Customer と nextDeadlinePointHistory を返すのみで、セッションから戻り先を取得・消去してリダイレクトする処理が無く無条件に index.twig を表示。
- mismatchReason: 同コントローラ・Front配下・EventListener配下を previousUrl/戻り先/search_return/product_list_url 等で grep しても戻り先の保存・消費処理は不在。設計が現行踏襲として要求するリダイレクト挙動が未実装。
- designRefDetail: excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-7 (処理フロー / エッジケース / 画面遷移 / セッション)
- implRef: src/Eccube/Controller/Front/Mypage/MypageController.php:127-138

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-05_0306_sheet-7_sheet-conformance-c39f07856b6a",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-7",
  "designRefDetail": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-7 (処理フロー / エッジケース / 画面遷移 / セッション)",
  "designExpectation": "マイページトップ表示時、直前に商品検索からの戻り先がセッションにある場合は、マイページを表示せずその検索画面へリダイレクトし、戻り先をセッションから消去する（現行踏襲）。",
  "designQuote": "マイページトップ表示時、直前に商品検索からの戻り先がセッションにある場合は、マイページを表示せずその検索画面へリダイレクトし、戻り先をセッションから消去する（現行踏襲）。",
  "implRef": "src/Eccube/Controller/Front/Mypage/MypageController.php:127-138",
  "implementationActual": "index() は Customer と nextDeadlinePointHistory を返すのみで、セッションから戻り先を取得・消去してリダイレクトする処理が無く無条件に index.twig を表示。",
  "difference": "同コントローラ・Front配下・EventListener配下を previousUrl/戻り先/search_return/product_list_url 等で grep しても戻り先の保存・消費処理は不在。設計が現行踏襲として要求するリダイレクト挙動が未実装。",
  "mismatchReason": "同コントローラ・Front配下・EventListener配下を previousUrl/戻り先/search_return/product_list_url 等で grep しても戻り先の保存・消費処理は不在。設計が現行踏襲として要求するリダイレクト挙動が未実装。",
  "comparisonRows": [
    {
      "item": "商品検索戻り先リダイレクト",
      "design": "戻り先があればマイページ非表示で検索画面へリダイレクト・戻り先消去",
      "implementation": "処理なし・常にマイページ表示",
      "mismatch": "リダイレクト/セッション消去が未実装"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-05_0306_sheet-7_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Controller/Front/Mypage/MypageController.php:127-138",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「マイページトップ表示時、直前に商品検索からの戻り先がセッションにある場合は、マイページを表示せずその検索画面へリダイレクトし、戻り先をセッションから消去する（現行踏襲）。」。実装は「index() は Customer と nextDeadlinePointHistory を返すのみで、セッションから戻り先を取得・消去してリダイレクトする処理が無く無条件に index.twig を表示。」。乖離理由は「同コントローラ・Front配下・EventListener配下を previousUrl/戻り先/search_return/product_list_url 等で grep しても戻り先の保存・消費処理は不在。設計が現行踏襲として要求するリダイレクト挙動が未実装。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "Repository・Entity・DB",
    "Twig・画面表示",
    "権限・セッション・副作用・エラー・ログ"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:2537\n2534:       </section>\n2535:       <!-- function-design-embed:end f06-04-f06-04_front_member_forgot_password_reset -->\n2536: </section>\n2537:       <section class=\"sheet-panel\" id=\"sheet-7\">\n2538:         <div class=\"sheet-heading\">\n2539:           <h2>マイページ</h2>\n2540:         </div>",
  "implementationRefs": [
    "src/Eccube/Controller/Front/Mypage/MypageController.php:127-138",
    "src/Eccube/Controller/Front/Mypage/MypageController.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Controller/Front/Mypage/MypageController.php:127\n124:      * @return array<string, mixed>\n125:      */\n126:     #[Route(path: '/mypage/', name: 'mypage', methods: ['GET'])]\n127:     #[Template(template: 'Mypage/index.twig')]\n128:     public function index(Request $request, PaginatorInterface $paginator): array\n129:     {\n130:         /** @var Customer $Customer */",
    "src/Eccube/Controller/Front/Mypage/MypageController.php:52\n49: use Symfony\\Component\\Routing\\Attribute\\Route;\n50: use Symfony\\Component\\Security\\Http\\Authentication\\AuthenticationUtils;\n51: \n52: class MypageController extends AbstractController\n53: {\n54:     protected ProductRepository $productRepository;\n55: "
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

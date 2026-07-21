# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-24_0306_sheet-20_sheet.json#f06-24_0306_sheet-20_sheet-conformance-4fe92fd44c30`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-24_0306_sheet-20_sheet.json`
- sourceFindingId: `f06-24_0306_sheet-20_sheet-conformance-4fe92fd44c30`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-24_0306_sheet-20_sheet` / F06-24 お問い合わせ履歴詳細
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: 存在しないID／他会員IDを詳細URLに指定した場合、取得結果が無いため当該お問い合わせの内容を表示しないだけで、閲覧専用のため画面上の明示エラーは出さない。
- implementationActual: detail() は findOneBy(id, Customer) が null のとき createNotFoundException() を送出し HTTP 404 エラーページを返す。存在しないIDは型付き引数 DtbContact $Contact のリゾルバ解決時点で404。null時に空表示するフォールバックは無い。
- mismatchReason: 設計オラクルは『明示エラーを出さず内容を表示しないだけ』を要求するが、実装は常に例外→404エラーページを明示表示する。ContactController::detail・history_detail.twig を精査し、静的な非表示フォールバックが無いことを確認。
- designRefDetail: excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-20 約line6944・6963
- implRef: src/Eccube/Controller/Front/ContactController.php:224,229,231-233

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-24_0306_sheet-20_sheet-conformance-4fe92fd44c30",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-20",
  "designRefDetail": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-20 約line6944・6963",
  "designExpectation": "存在しないID／他会員IDを詳細URLに指定した場合、取得結果が無いため当該お問い合わせの内容を表示しないだけで、閲覧専用のため画面上の明示エラーは出さない。",
  "designQuote": "存在しないID／他会員IDを詳細URLに指定した場合、取得結果が無いため当該お問い合わせの内容を表示しないだけで、閲覧専用のため画面上の明示エラーは出さない。",
  "implRef": "src/Eccube/Controller/Front/ContactController.php:224,229,231-233",
  "implementationActual": "detail() は findOneBy(id, Customer) が null のとき createNotFoundException() を送出し HTTP 404 エラーページを返す。存在しないIDは型付き引数 DtbContact $Contact のリゾルバ解決時点で404。null時に空表示するフォールバックは無い。",
  "difference": "設計オラクルは『明示エラーを出さず内容を表示しないだけ』を要求するが、実装は常に例外→404エラーページを明示表示する。ContactController::detail・history_detail.twig を精査し、静的な非表示フォールバックが無いことを確認。",
  "mismatchReason": "設計オラクルは『明示エラーを出さず内容を表示しないだけ』を要求するが、実装は常に例外→404エラーページを明示表示する。ContactController::detail・history_detail.twig を精査し、静的な非表示フォールバックが無いことを確認。",
  "comparisonRows": [
    {
      "item": "存在しないID/他会員IDの扱い",
      "design": "取得結果が無く当該内容を非表示（明示エラー無し・閲覧専用）",
      "implementation": "createNotFoundException()→HTTP 404 エラーページを明示表示",
      "mismatch": "静的非表示 vs 明示404で挙動が相違"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-24_0306_sheet-20_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Controller/Front/ContactController.php:224,229,231-233",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「存在しないID／他会員IDを詳細URLに指定した場合、取得結果が無いため当該お問い合わせの内容を表示しないだけで、閲覧専用のため画面上の明示エラーは出さない。」。実装は「detail() は findOneBy(id, Customer) が null のとき createNotFoundException() を送出し HTTP 404 エラーページを返す。存在しないIDは型付き引数 DtbContact $Contact のリゾルバ解決時点で404。null時に空表示するフォールバックは無い。」。乖離理由は「設計オラクルは『明示エラーを出さず内容を表示しないだけ』を要求するが、実装は常に例外→404エラーページを明示表示する。ContactController::detail・history_detail.twig を精査し、静的な非表示フォールバックが無いことを確認。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ルート・Controller",
    "Twig・画面表示",
    "権限・セッション・副作用・エラー・ログ"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:6797\n6794:       </section>\n6795:       <!-- function-design-embed:end f06-23-f06-23_front_contact_history -->\n6796: </section>\n6797:       <section class=\"sheet-panel\" id=\"sheet-20\">\n6798:         <div class=\"sheet-heading\">\n6799:           <h2>お問い合わせ履歴詳細</h2>\n6800:         </div>",
  "implementationRefs": [
    "src/Eccube/Controller/Front/ContactController.php:224,229,231",
    "src/Eccube/Controller/Front/ContactController.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Controller/Front/ContactController.php:224\n221:     #[IsGranted('ROLE_USER')]\n222:     #[Route(path: '/contact/history/{id}/detail', name: 'contact_history_detail', requirements: ['id' => '\\d+'], methods: ['GET'])]\n223:     #[Template(template: 'Contact/history_detail.twig')]\n224:     public function detail(Request $request, DtbContact $Contact): array\n225:     {\n226:         /** @var Customer $user */\n227:         $user = $this->getUser();",
    "src/Eccube/Controller/Front/ContactController.php:40\n37: use Symfony\\Component\\Routing\\Attribute\\Route;\n38: use Symfony\\Component\\Security\\Http\\Attribute\\IsGranted;\n39: \n40: class ContactController extends AbstractController\n41: {\n42:     /**\n43:      * ContactController constructor."
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-02_0306_sheet-4_sheet.json#f06-02_0306_sheet-4_sheet-conformance-d52de6028d9c`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-02_0306_sheet-4_sheet.json`
- sourceFindingId: `f06-02_0306_sheet-4_sheet-conformance-d52de6028d9c`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-02_0306_sheet-4_sheet` / F06-02 本会員登録
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: 判定順序3: 秘密キーで取得した会員の選手情報にスマレジIDが既にある場合は再登録せず、共通エラー画面『完了済みです。／既に会員登録が完了されております。』を表示して終了する。
- implementationActual: linkSmaregiCustomer() 349-352 で Player->getSmaregiId() が非空の場合『冪等』として何もせず return $Customer し、そのまま完了メール送信(305)・自動ログイン(315)・本登録完了画面表示へ進む。『完了済みです』エラー画面での終了はこの分岐に存在しない。
- mismatchReason: 設計の判定順序3を正として実装を精査。スマレジID保有時の分岐がエラー画面ではなく冪等スキップ+正常完了扱いになっている。『完了済み』判定は customer_status(273-279)でのみ行われ、設計指定のスマレジID保有による判定・画面出力は未実装(activate_error.twig の error_type にも該当ケース無し)。
- designRefDetail: excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-4（判定順序表 順序3、副作用順序『スマレジIDが既にある場合は…完了済みですを表示して終了』、materialGapRows req 146/170/221）
- implRef: src/Eccube/Controller/Front/EntryController.php:348-352

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-02_0306_sheet-4_sheet-conformance-d52de6028d9c",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-4",
  "designRefDetail": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-4（判定順序表 順序3、副作用順序『スマレジIDが既にある場合は…完了済みですを表示して終了』、materialGapRows req 146/170/221）",
  "designExpectation": "判定順序3: 秘密キーで取得した会員の選手情報にスマレジIDが既にある場合は再登録せず、共通エラー画面『完了済みです。／既に会員登録が完了されております。』を表示して終了する。",
  "designQuote": "判定順序3: 秘密キーで取得した会員の選手情報にスマレジIDが既にある場合は再登録せず、共通エラー画面『完了済みです。／既に会員登録が完了されております。』を表示して終了する。",
  "implRef": "src/Eccube/Controller/Front/EntryController.php:348-352",
  "implementationActual": "linkSmaregiCustomer() 349-352 で Player->getSmaregiId() が非空の場合『冪等』として何もせず return $Customer し、そのまま完了メール送信(305)・自動ログイン(315)・本登録完了画面表示へ進む。『完了済みです』エラー画面での終了はこの分岐に存在しない。",
  "difference": "設計の判定順序3を正として実装を精査。スマレジID保有時の分岐がエラー画面ではなく冪等スキップ+正常完了扱いになっている。『完了済み』判定は customer_status(273-279)でのみ行われ、設計指定のスマレジID保有による判定・画面出力は未実装(activate_error.twig の error_type にも該当ケース無し)。",
  "mismatchReason": "設計の判定順序3を正として実装を精査。スマレジID保有時の分岐がエラー画面ではなく冪等スキップ+正常完了扱いになっている。『完了済み』判定は customer_status(273-279)でのみ行われ、設計指定のスマレジID保有による判定・画面出力は未実装(activate_error.twig の error_type にも該当ケース無し)。",
  "comparisonRows": [
    {
      "item": "スマレジID保有時の分岐",
      "design": "共通エラー画面『完了済みです』を表示して終了",
      "implementation": "冪等スキップして正常完了(メール/自動ログイン/完了画面)",
      "mismatch": "エラー画面での終了が実装されていない"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-02_0306_sheet-4_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Controller/Front/EntryController.php:348-352",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「判定順序3: 秘密キーで取得した会員の選手情報にスマレジIDが既にある場合は再登録せず、共通エラー画面『完了済みです。／既に会員登録が完了されております。』を表示して終了する。」。実装は「linkSmaregiCustomer() 349-352 で Player->getSmaregiId() が非空の場合『冪等』として何もせず return $Customer し、そのまま完了メール送信(305)・自動ログイン(315)・本登録完了画面表示へ進む。『完了済みです』エラー画面での終了はこの分岐に存在しない。」。乖離理由は「設計の判定順序3を正として実装を精査。スマレジID保有時の分岐がエラー画面ではなく冪等スキップ+正常完了扱いになっている。『完了済み』判定は customer_status(273-279)でのみ行われ、設計指定のスマレジID保有による判定・画面出力は未実装(activate_error.twig の error_type にも該当ケース無し)。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "業務ロジック・外部連携未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "Service・業務ルール",
    "Repository・Entity・DB",
    "Twig・画面表示",
    "権限・セッション・副作用・エラー・ログ"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:1594\n1591:       </section>\n1592:       <!-- function-design-embed:end f06-19-f06-19_front_member_mypage_credit_card -->\n1593: </section>\n1594:       <section class=\"sheet-panel\" id=\"sheet-4\">\n1595:         <div class=\"sheet-heading\">\n1596:           <h2>本会員登録</h2>\n1597:         </div>",
  "implementationRefs": [
    "src/Eccube/Controller/Front/EntryController.php:348-352",
    "src/Eccube/Controller/Front/EntryController.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Controller/Front/EntryController.php:348\n",
    "src/Eccube/Controller/Front/EntryController.php:47\n44: use Symfony\\Component\\Validator\\Constraints as Assert;\n45: use Symfony\\Component\\Validator\\Validator\\ValidatorInterface;\n46: \n47: class EntryController extends AbstractController\n48: {\n49:     protected BaseInfo $BaseInfo;\n50: "
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

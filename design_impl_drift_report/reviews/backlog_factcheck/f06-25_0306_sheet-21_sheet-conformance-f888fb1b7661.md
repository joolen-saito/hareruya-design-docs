# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-25_0306_sheet-21_sheet.json#f06-25_0306_sheet-21_sheet-conformance-f888fb1b7661`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-25_0306_sheet-21_sheet.json`
- sourceFindingId: `f06-25_0306_sheet-21_sheet-conformance-f888fb1b7661`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-25_0306_sheet-21_sheet` / F06-25 店頭注文呼び出し番号表示
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: 本店のURLは https://www.hareruyamtg.com/ja/waiting_number_1 とする（現行の waiting_number_2 は不要のため除去。支店URLは /ja/{支店名(英)}/waiting_number 形式）
- implementationActual: モニター画面のルートは path '/waiting_number'(name: waiting_number)1本のみ。front_controllers の prefix /{_locale}{_shop}(本店は _shop='')により本店URLは /ja/waiting_number に解決される。waiting_number_1 というパス/ルートは src/ html/ app/ 全体を grep しても存在しない(0件)。
- mismatchReason: WaitingNumberController.php のルート定義と routes.yaml の prefix を確認し、src/ html/ app/ 全体を『waiting_number_1』『waiting_number_2』で grep(0件)。支店URL /ja/{shop}/waiting_number は設計と一致するが、本店URLは設計が waiting_number_1 を明示要求するのに対し実装は /ja/waiting_number であり、設計どお…
- designRefDetail: excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-21（★URLについて「本店のURLは以下とする https://www.hareruyamtg.com/ja/waiting_number_1」）
- implRef: src/Eccube/Controller/Front/WaitingNumberController.php:42 / app/config/eccube/routes.yaml (prefix /{_locale}{_shop})

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-25_0306_sheet-21_sheet-conformance-f888fb1b7661",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-21",
  "designRefDetail": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-21（★URLについて「本店のURLは以下とする https://www.hareruyamtg.com/ja/waiting_number_1」）",
  "designExpectation": "本店のURLは https://www.hareruyamtg.com/ja/waiting_number_1 とする（現行の waiting_number_2 は不要のため除去。支店URLは /ja/{支店名(英)}/waiting_number 形式）",
  "designQuote": "本店のURLは https://www.hareruyamtg.com/ja/waiting_number_1 とする（現行の waiting_number_2 は不要のため除去。支店URLは /ja/{支店名(英)}/waiting_number 形式）",
  "implRef": "src/Eccube/Controller/Front/WaitingNumberController.php:42 / app/config/eccube/routes.yaml (prefix /{_locale}{_shop})",
  "implementationActual": "モニター画面のルートは path '/waiting_number'(name: waiting_number)1本のみ。front_controllers の prefix /{_locale}{_shop}(本店は _shop='')により本店URLは /ja/waiting_number に解決される。waiting_number_1 というパス/ルートは src/ html/ app/ 全体を grep しても存在しない(0件)。",
  "difference": "WaitingNumberController.php のルート定義と routes.yaml の prefix を確認し、src/ html/ app/ 全体を『waiting_number_1』『waiting_number_2』で grep(0件)。支店URL /ja/{shop}/waiting_number は設計と一致するが、本店URLは設計が waiting_number_1 を明示要求するのに対し実装は /ja/waiting_number であり、設計どおりの /ja/waiting_number_1 へアクセスすると404となるため実装違いと確定。",
  "mismatchReason": "WaitingNumberController.php のルート定義と routes.yaml の prefix を確認し、src/ html/ app/ 全体を『waiting_number_1』『waiting_number_2』で grep(0件)。支店URL /ja/{shop}/waiting_number は設計と一致するが、本店URLは設計が waiting_number_1 を明示要求するのに対し実装は /ja/waiting_number であり、設計どおりの /ja/waiting_numbe…",
  "comparisonRows": [
    {
      "item": "本店モニターURL",
      "design": "/ja/waiting_number_1",
      "implementation": "/ja/waiting_number (path '/waiting_number')",
      "mismatch": "設計URLは404・パス名不一致"
    },
    {
      "item": "支店モニターURL",
      "design": "/ja/{支店名(英)}/waiting_number",
      "implementation": "/ja/{_shop}/waiting_number",
      "mismatch": "一致(差異なし)"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-25_0306_sheet-21_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Controller/Front/WaitingNumberController.php:42 / app/config/eccube/routes.yaml (prefix /{_locale}{_shop})",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「本店のURLは https://www.hareruyamtg.com/ja/waiting_number_1 とする（現行の waiting_number_2 は不要のため除去。支店URLは /ja/{支店名(英)}/waiting_number 形式）」。実装は「モニター画面のルートは path '/waiting_number'(name: waiting_number)1本のみ。front_controllers の prefix /{_locale}{_shop}(本店は _shop='')により本店URLは /ja/waiting_number に解決される。waiting_number_1 というパス/ルートは src/ html/ app/ 全体を grep しても存在しない(0件)。」。乖離理由は「WaitingNumberController.php のルート定義と routes.yaml の prefix を確認し、src/ html/ app/ 全体を『waiting_number_1』『waiting_number_2』で grep(0件)。支店URL /ja/{shop}/waiting_number は設計と一致するが、本店URLは設計が waiting_number_1 を明示要求するのに対し実装は /ja/waiting_number であり、設計どおりの /ja/waiting_numbe…」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "ルート・Controller",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:6979\n6976:       </section>\n6977:       <!-- function-design-embed:end f06-24-f06-24_front_contact_history -->\n6978: </section>\n6979:       <section class=\"sheet-panel\" id=\"sheet-21\">\n6980:         <div class=\"sheet-heading\">\n6981:           <h2>店頭注文呼び出し番号表示</h2>\n6982:         </div>",
  "implementationRefs": [
    "src/Eccube/Controller/Front/WaitingNumberController.php:42",
    "src/Eccube/Controller/Front/WaitingNumberController.php",
    "app/config/eccube/routes.yaml"
  ],
  "implementationSnippets": [
    "src/Eccube/Controller/Front/WaitingNumberController.php:42\n39:      *\n40:      * @return array<mixed, mixed>\n41:      */\n42:     #[Route(path: '/waiting_number', name: 'waiting_number', methods: ['GET'])]\n43:     #[Template(template: 'Waiting/waiting_number.twig')]\n44:     public function waitingNumber(): array\n45:     {",
    "src/Eccube/Controller/Front/WaitingNumberController.php:28\n25: use Symfony\\Component\\HttpFoundation\\Request;\n26: use Symfony\\Component\\Routing\\Attribute\\Route;\n27: \n28: class WaitingNumberController extends AbstractController\n29: {\n30:     public function __construct(\n31:         protected EccubeConfig $eccubeConfig,",
    "app/config/eccube/routes.yaml:1\n1: admin_controllers:\n2:     resource: '../../../src/Eccube/Controller/Admin'\n3:     type: attribute\n4: "
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

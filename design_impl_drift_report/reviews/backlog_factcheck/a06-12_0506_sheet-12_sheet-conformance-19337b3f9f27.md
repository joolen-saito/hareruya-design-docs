# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/a06-12_0506_sheet-12_sheet.json#a06-12_0506_sheet-12_sheet-conformance-19337b3f9f27`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/a06-12_0506_sheet-12_sheet.json`
- sourceFindingId: `a06-12_0506_sheet-12_sheet-conformance-19337b3f9f27`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `a06-12_0506_sheet-12_sheet` / A06-12 固定価格部門の部門情報を取得
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: オプションマスタに固定価格部門の設定が存在しない場合は null参照によりHTTP 500となり、フレームワーク標準の例外応答を返す。
- implementationActual: 実装は MtbOption::FIXED_PRICE_SECTION が見つからない場合、nullsafe演算子と null合体で空文字にフォールバックし、HTTP 200で JSON文字列 "" を返す。テストも「オプションが存在しない場合は空文字を返すこと」としてHTTP 200と json_encode('') を期待している。
- mismatchReason: 設計の失敗レスポンスはHTTP 500だが、実装は例外を発生させず正常応答として空文字を返す。反証検索では fixedPriceSection.json、api_admin_fixed_price_section、FIXED_PRICE_SECTION、固定価格部門、section_id を Controller/Service/Dto/Tests/Migrations/html/template で確認したが、未設定時に500を返す固定価格部門APIの別経路は見つからなか…
- designRefDetail: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-12:3276-:3277
- implRef: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OptionController.php:53-:59, /home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OptionControllerTest.php:188-…

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "a06-12_0506_sheet-12_sheet-conformance-19337b3f9f27",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-12:3276-",
  "designRefDetail": "excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-12:3276-:3277",
  "designExpectation": "オプションマスタに固定価格部門の設定が存在しない場合は null参照によりHTTP 500となり、フレームワーク標準の例外応答を返す。",
  "designQuote": "オプションマスタに固定価格部門の設定が存在しない場合は null参照によりHTTP 500となり、フレームワーク標準の例外応答を返す。",
  "implRef": "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OptionController.php:53-:59, /home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OptionControllerTest.php:188-:218",
  "implementationActual": "実装は MtbOption::FIXED_PRICE_SECTION が見つからない場合、nullsafe演算子と null合体で空文字にフォールバックし、HTTP 200で JSON文字列 \"\" を返す。テストも「オプションが存在しない場合は空文字を返すこと」としてHTTP 200と json_encode('') を期待している。",
  "difference": "設計の失敗レスポンスはHTTP 500だが、実装は例外を発生させず正常応答として空文字を返す。反証検索では fixedPriceSection.json、api_admin_fixed_price_section、FIXED_PRICE_SECTION、固定価格部門、section_id を Controller/Service/Dto/Tests/Migrations/html/template で確認したが、未設定時に500を返す固定価格部門APIの別経路は見つからなかった。",
  "mismatchReason": "設計の失敗レスポンスはHTTP 500だが、実装は例外を発生させず正常応答として空文字を返す。反証検索では fixedPriceSection.json、api_admin_fixed_price_section、FIXED_PRICE_SECTION、固定価格部門、section_id を Controller/Service/Dto/Tests/Migrations/html/template で確認したが、未設定時に500を返す固定価格部門APIの別経路は見つからなかった。",
  "comparisonRows": [
    {
      "item": "未設定時のHTTPステータス",
      "design": "500。",
      "implementation": "200。OptionControllerTest.php:217 でHTTP OKを期待。",
      "mismatch": "失敗扱いと正常扱いが逆転している。"
    },
    {
      "item": "未設定時の本文",
      "design": "フレームワーク標準の例外応答。",
      "implementation": "空文字のJSON表現。OptionController.php:57 で $Option?->getOptionValue() ?? ''、:59 で JsonResponse($value)。",
      "mismatch": "例外応答ではなく空文字レスポンスを返す。"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "a06-12_0506_sheet-12_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OptionController.php:53-:59, /home/y-saito/Developments/ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OptionControllerTest.php:188-:218",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「オプションマスタに固定価格部門の設定が存在しない場合は null参照によりHTTP 500となり、フレームワーク標準の例外応答を返す。」。実装は「実装は MtbOption::FIXED_PRICE_SECTION が見つからない場合、nullsafe演算子と null合体で空文字にフォールバックし、HTTP 200で JSON文字列 \"\" を返す。テストも「オプションが存在しない場合は空文字を返すこと」としてHTTP 200と json_encode('') を期待している。」。乖離理由は「設計の失敗レスポンスはHTTP 500だが、実装は例外を発生させず正常応答として空文字を返す。反証検索では fixedPriceSection.json、api_admin_fixed_price_section、FIXED_PRICE_SECTION、固定価格部門、section_id を Controller/Service/Dto/Tests/Migrations/html/template で確認したが、未設定時に500を返す固定価格部門APIの別経路は見つからなかった。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ルート・Controller",
    "Service・業務ルール",
    "Twig・画面表示",
    "CSV・API・Batch・PDF・印刷",
    "権限・セッション・副作用・エラー・ログ"
  ],
  "designSnippet": "",
  "implementationRefs": [
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OptionController.php:53",
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OptionController.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Controller/App/MTGBuyer/V1/Admin/OptionController.php:53\n50:     #[Route('/%eccube_api_v1_route%/admin/fixedPriceSection.json', name: 'api_admin_fixed_price_section', methods: ['GET'])]\n51:     public function getFixedPriceSection(): JsonResponse\n52:     {\n53:         $Option = $this->mtbOptionRepository->findOneBy([\n54:             'option_key' => MtbOption::FIXED_PRICE_SECTION,\n55:         ]);\n56: ",
    "src/Eccube/Controller/App/MTGBuyer/V1/Admin/OptionController.php:26\n23: use Symfony\\Component\\Security\\Http\\Attribute\\IsGranted;\n24: \n25: #[IsGranted('IS_AUTHENTICATED_FULLY')]\n26: class OptionController extends AbstractController\n27: {\n28:     public function __construct(private readonly MtbOptionRepository $mtbOptionRepository)\n29:     {"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```
